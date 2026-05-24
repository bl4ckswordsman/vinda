<script lang="ts">
    import { Canvas, T } from "@threlte/core";
    import { Environment } from "@threlte/extras";
    import { EffectComposer } from "threlte-postprocessing";
    import { BloomEffect } from "threlte-postprocessing/effects";
    import { getContext } from "svelte";
    import type { AppState } from "./state.svelte";
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

    const appState = getContext<AppState>("app");
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
        {#if appState}
            <T.AmbientLight
                intensity={appState.darkMode ? 0.12 : 0.35}
                color={appState.darkMode ? "#8fa5c7" : "#ffffff"}
            />
            <T.DirectionalLight
                position={[5, 8, 5]}
                intensity={appState.darkMode ? 0.65 : 1.1}
                color={appState.darkMode ? "#ffdce0" : "#ffffff"}
                castShadow
                shadow.mapSize.width={2048}
                shadow.mapSize.height={2048}
                shadow.bias={-0.0005}
                shadow.camera.left={-1.5}
                shadow.camera.right={1.5}
                shadow.camera.top={1.5}
                shadow.camera.bottom={-1.5}
                shadow.camera.near={0.1}
                shadow.camera.far={20}
            />
            <T.DirectionalLight
                position={[-4, 3, -3]}
                intensity={appState.darkMode ? 0.95 : 0.4}
                color={appState.darkMode ? "#9d4edd" : "#ffa4b4"}
            />
        {:else}
            <T.AmbientLight intensity={0.3} />
            <T.DirectionalLight position={[5, 8, 5]} intensity={1.0} castShadow />
            <T.DirectionalLight
                position={[-4, 3, -3]}
                intensity={0.4}
                color="#ffa4b4"
            />
        {/if}

        <!-- Bloom post-processing -->
        <EffectComposer>
            <BloomEffect
                intensity={0.3}
                luminanceThreshold={0.8}
                luminanceSmoothing={0.5}
            />
        </EffectComposer>

        <!-- Model Container - positioned slightly lower to center in visible screen area -->
        <T.Group position.y={-0.12}>
            {#if modelFile}
                <Model file={modelFile} {color} {velocity} {reducedMotion} />
            {:else}
                <ProceduralModel {color} {velocity} {reducedMotion} />
            {/if}
        </T.Group>
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
