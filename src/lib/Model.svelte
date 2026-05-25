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
        isDarkMode?: boolean;
    }

    let {
        file,
        color = "#b5a4f5",
        velocity,
        reducedMotion = false,
        isDarkMode = true,
    }: Props = $props();

    const gltf = $derived(useGltf(file));

    let spinnerRef = $state<THREE.Object3D | null>(null);
    let displayVelocity = $state(0);
    let initialSceneY = 0;

    let mixer: THREE.AnimationMixer | null = null;
    let activeAction: THREE.AnimationAction | null = null;

    // Lowered friction so it responds tighter to your finger swipes
    const FRICTION = 0.85;

    // Replace all materials and split Base/Spinner nodes on load
    $effect(() => {
        const currentGltf = $gltf;
        if (!currentGltf) return;

        const scene = currentGltf.scene;
        if (!scene) return;

        // Clean up previous mixer and action
        if (mixer) {
            mixer.stopAllAction();
            mixer = null;
            activeAction = null;
        }

        let foundSpinner = false;

        // Temporarily detach from parent to compute local bounds accurately,
        // avoiding parent transforms (like offsets in Scene.svelte) leaking into bounding box world space calculations.
        const parent = scene.parent;
        if (parent) {
            parent.remove(scene);
        }

        // Reset scale and position to ensure calculation is idempotent
        scene.scale.set(1, 1, 1);
        scene.position.set(0, 0, 0);
        scene.updateMatrixWorld(true);

        const box = new THREE.Box3();
        let hasMesh = false;

        scene.traverse((node: THREE.Object3D) => {
            if (node instanceof THREE.Mesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                box.expandByObject(node);
                hasMesh = true;
            }
            if (node.name.endsWith("_Spinner")) {
                spinnerRef = node;
                foundSpinner = true;
            }
        });

        // Fallback: treat entire scene as spinner
        if (!foundSpinner) spinnerRef = scene;

        if (!hasMesh) {
            box.setFromObject(scene);
        }

        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scaleFactor = maxDim > 0 ? 2 / maxDim : 1;
        scene.scale.setScalar(scaleFactor);

        const center = box.getCenter(new THREE.Vector3());
        center.multiplyScalar(scaleFactor);
        scene.position.copy(center).negate();

        // Capture initial Y position of the centered scene
        initialSceneY = scene.position.y;

        // Re-attach to parent
        if (parent) {
            parent.add(scene);
        }

        // Set up animation mixer if clips exist
        const animations = currentGltf.animations;
        if (animations && animations.length > 0) {
            mixer = new THREE.AnimationMixer(scene);
            const clip = animations[0];
            activeAction = mixer.clipAction(clip);
            activeAction.play();
        } else {
            // Manual rotation sibling reparenting (e.g. for Carousel 1)
            if (foundSpinner && spinnerRef && spinnerRef.parent) {
                const parentNode = spinnerRef.parent;
                const siblings = parentNode.children.filter(child => child !== spinnerRef);
                siblings.forEach(child => {
                    spinnerRef!.attach(child);
                });
            }
        }

        return () => {
            if (mixer) {
                mixer.stopAllAction();
                mixer = null;
                activeAction = null;
            }
        };
    });

    // Material updates when color or dark mode changes
    $effect(() => {
        const scene = $gltf?.scene;
        if (!scene) return;

        const mat = createLavaMaterial({ color, isDarkMode });

        scene.traverse((node: THREE.Object3D) => {
            if (node instanceof THREE.Mesh) {
                node.material = mat;
            }
        });
    });

    // Per-frame rotation with inertia
    useTask((delta) => {
        displayVelocity =
            displayVelocity * FRICTION + velocity * (1 - FRICTION);
        if (Math.abs(displayVelocity) < 0.001 && Math.abs(velocity) < 0.001) {
            displayVelocity = 0;
        }

        if (mixer) {
            // Play animation forward or backward matching the spin velocity direction
            mixer.update(delta * -displayVelocity);
        } else if (spinnerRef) {
            // Rotate at a slow, realistic speed when playing.
            spinnerRef.rotation.y += displayVelocity * delta;
        }

        const scene = $gltf?.scene;
        if (scene && !reducedMotion) {
            scene.position.y = initialSceneY + Math.sin(Date.now() * 0.0008) * 0.04;
        }
    });
</script>

{#if $gltf}
    <T is={$gltf.scene} />
{/if}
