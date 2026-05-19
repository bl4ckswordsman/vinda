<script lang="ts">
    import { T } from "@threlte/core";
    import { useTask } from "@threlte/core";
    import * as THREE from "three";
    import { createLavaMaterial } from "./LavaMaterial";

    interface Props {
        color?: string;
        velocity: number;
        reducedMotion?: boolean;
    }

    let {
        color = "#b5a4f5",
        velocity,
        reducedMotion = false,
    }: Props = $props();

    // Svelte 5: Make the material reactive so it updates when the color prop changes
    const mat = $derived(createLavaMaterial({ color }));

    let spinnerGroup = $state<THREE.Group | undefined>(undefined);
    let displayVelocity = $state(0);

    // Lowered friction so the visual crank responds tighter to your finger
    const FRICTION = 0.85;

    useTask((delta) => {
        // Inertia: blend toward incoming velocity, then decay
        displayVelocity =
            displayVelocity * FRICTION + velocity * (1 - FRICTION);
        if (Math.abs(displayVelocity) < 0.001 && Math.abs(velocity) < 0.001) {
            displayVelocity = 0;
        }

        if (spinnerGroup) {
            // Geared down to a slow, majestic rotation while the audio plays normally.
            spinnerGroup.rotation.y += displayVelocity * delta;

            if (!reducedMotion) {
                spinnerGroup.position.y = Math.sin(Date.now() * 0.0008) * 0.04;
            }
        }
    });
</script>

<!-- Base: flat cylinder — static -->
<T.Mesh material={mat} position={[0, -0.65, 0]} castShadow receiveShadow>
    <T.CylinderGeometry args={[0.85, 0.95, 0.28, 48]} />
</T.Mesh>

<!-- Spinner: torus ring + 4 poles -->
<T.Group bind:ref={spinnerGroup}>
    <!-- Ring -->
    <T.Mesh material={mat} castShadow>
        <T.TorusGeometry args={[0.62, 0.07, 20, 64]} />
    </T.Mesh>

    <!-- Vertical poles -->
    {#each [0, 1, 2, 3] as i}
        {@const angle = (i / 4) * Math.PI * 2}
        <T.Mesh
            material={mat}
            position={[Math.cos(angle) * 0.56, -0.05, Math.sin(angle) * 0.56]}
            castShadow
        >
            <T.CylinderGeometry args={[0.035, 0.035, 0.85, 10]} />
        </T.Mesh>
    {/each}

    <!-- Center cap -->
    <T.Mesh material={mat} position={[0, 0.38, 0]} castShadow>
        <T.SphereGeometry args={[0.12, 20, 20]} />
    </T.Mesh>
</T.Group>
