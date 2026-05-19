<script lang="ts">
    import { Canvas, T } from "@threlte/core";
    import { Environment } from "@threlte/extras";
    import { EffectComposer } from "threlte-postprocessing";
    import { BloomEffect } from "threlte-postprocessing/effects";
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

<div class="canvas-wrapper" class:sleeping={isSleeping}>
    <Canvas
        renderMode={isSleeping ? "on-demand" : "always"}
    >
        <RendererSetup />

        <!-- HDRI environment map — reflections only, no visible background -->
        <Environment url="/hdri/studio.hdr" />

        <!-- Fixed product-shot camera -->
        <T.PerspectiveCamera makeDefault position={[0, -0.2, 4]} fov={35} />

        <!-- Lighting -->
        <T.AmbientLight intensity={0.3} />
        <T.DirectionalLight position={[5, 8, 5]} intensity={1.0} castShadow />
        <T.DirectionalLight
            position={[-4, 3, -3]}
            intensity={0.4}
            color="#a090ff"
        />

        <!-- Bloom post-processing -->
        <EffectComposer>
            <BloomEffect
                intensity={0.3}
                luminanceThreshold={0.8}
                luminanceSmoothing={0.5}
            />
        </EffectComposer>

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
    }
    .canvas-wrapper.sleeping {
        opacity: 0.2;
    }
</style>
