<script lang="ts">
    import { useGltf } from "@threlte/extras";
    import { useTask, T } from "@threlte/core";
    import * as THREE from "three";
    import { createLavaMaterial } from "./LavaMaterial";

    interface Props {
        file: string; // e.g. '/models/musicbox-default.glb'
        color?: string;
        velocity: number; // angular velocity rad/s from GestureController
        reducedMotion?: boolean;
    }

    let {
        file,
        color = "#b5a4f5",
        velocity,
        reducedMotion = false,
    }: Props = $props();

    const gltf = $derived(useGltf(file));

    let spinnerRef = $state<THREE.Object3D | null>(null);
    let displayVelocity = $state(0);

    // Lowered friction so it responds tighter to your finger swipes
    const FRICTION = 0.85;

    // Replace all materials and split Base/Spinner nodes on load
    $effect(() => {
        const scene = $gltf?.scene;
        if (!scene) return;

        const mat = createLavaMaterial({ color });

        let foundSpinner = false;

        scene.traverse((node: THREE.Object3D) => {
            if (node instanceof THREE.Mesh) {
                node.material = mat;
                node.castShadow = true;
                node.receiveShadow = true;
            }
            if (node.name.endsWith("_Spinner")) {
                spinnerRef = node;
                foundSpinner = true;
            }
        });

        // Fallback: treat entire scene as spinner
        if (!foundSpinner) spinnerRef = scene;

        // Auto-center + normalise scale to fit in a 2-unit bounding box
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) scene.scale.setScalar(2 / maxDim);

        const centeredBox = new THREE.Box3().setFromObject(scene);
        const center = centeredBox.getCenter(new THREE.Vector3());
        scene.position.sub(center);
    });

    // Per-frame rotation with inertia
    useTask((delta) => {
        displayVelocity =
            displayVelocity * FRICTION + velocity * (1 - FRICTION);
        if (Math.abs(displayVelocity) < 0.001 && Math.abs(velocity) < 0.001) {
            displayVelocity = 0;
        }

        if (spinnerRef) {
            // Rotate at a slow, realistic speed when playing.
            spinnerRef.rotation.y += displayVelocity * delta * 0.15;

            if (!reducedMotion) {
                spinnerRef.position.y = Math.sin(Date.now() * 0.0008) * 0.04;
            }
        }
    });
</script>

{#if $gltf}
    <T is={$gltf.scene} />
{/if}
