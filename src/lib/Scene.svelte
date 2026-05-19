<script lang="ts">
    import { Canvas, T, useThrelte } from "@threlte/core";
    import { Environment } from "@threlte/extras";
    import Model from "./Model.svelte";
    import ProceduralModel from "./ProceduralModel.svelte";
    import RendererSetup from "./RendererSetup.svelte";

    interface Props {
        modelFile?: string; // undefined = use procedural fallback
        color?: string;
        velocity: number;
        isSleeping?: boolean;
        reducedMotion?: boolean;
    }

    let {
        modelFile,
        color = "#b5a4f5",
        velocity,
        isSleeping = false,
        reducedMotion = false,
    }: Props = $props();
</script>

<!--
  The canvas wrapper has a CSS filter that mimics a soft bloom pass:
  drop-shadow creates a colored glow around bright geometry.
  This avoids the need for @threlte/postprocessing entirely.
-->
<div class="canvas-wrapper" class:sleeping={isSleeping} style="--glow: {color}">
    <Canvas
        renderMode={isSleeping ? "on-demand" : "always"}
    >
        <RendererSetup />

        <!-- HDRI environment map — reflections only, no visible background -->
        <Environment url="/hdri/studio.hdr" />

        <!-- Fixed product-shot camera -->
        <T.PerspectiveCamera makeDefault position={[0, -0.2, 4]} fov={35} />

        <!-- Lighting -->
        <T.AmbientLight intensity={0.5} />
        <T.DirectionalLight position={[5, 8, 5]} intensity={1.4} castShadow />
        <T.DirectionalLight
            position={[-4, 3, -3]}
            intensity={0.4}
            color="#a090ff"
        />

        <!-- Model -->
        {#if modelFile}
            <Model file={modelFile} {color} {velocity} {reducedMotion} />
        {:else}
            <ProceduralModel {color} {velocity} {reducedMotion} />
        {/if}
    </Canvas>
</div>

<style>
    .canvas-wrapper {
        position: absolute;
        inset: 0;
        transition: opacity 1.2s ease;
        /* CSS bloom: drop-shadow layered to create glow around bright meshes */
        filter: drop-shadow(
                0 0 18px
                    color-mix(in srgb, var(--glow, #b5a4f5) 55%, transparent)
            )
            drop-shadow(
                0 0 40px
                    color-mix(in srgb, var(--glow, #b5a4f5) 25%, transparent)
            );
    }
    .canvas-wrapper.sleeping {
        opacity: 0.2;
        filter: none;
    }
</style>
