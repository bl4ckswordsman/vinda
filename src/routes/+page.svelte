<script lang="ts">
    import { setContext, untrack } from "svelte";
    import { createAppState } from "$lib/state.svelte";
    import { GestureController } from "$lib/GestureController";
    import { AudioEngine } from "$lib/AudioEngine";
    import Scene from "$lib/Scene.svelte";
    import Carousel from "$lib/Carousel.svelte";
    import Icon from "$lib/Icon.svelte";
    import type { ModelEntry, TuneEntry } from "$lib/types";

    // ─── Shared state ──────────────────────────────────────────────────────────
    const appState = createAppState();
    setContext("app", appState);

    const reducedMotion = $derived(
        typeof window !== "undefined"
            ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
            : false,
    );

    // ─── Manifest loading ──────────────────────────────────────────────────────
    $effect(() => {
        fetch("/models/manifest.json")
            .then((r) => r.json())
            .then((data: ModelEntry[]) => {
                if (data.length) appState.models = data;
            })
            .catch(() => {});

        fetch("/audio/manifest.json")
            .then((r) => r.json())
            .then((data: TuneEntry[]) => {
                if (data.length) {
                    appState.tunes = data;
                    audio.loadTune(appState.selectedTune);
                }
            })
            .catch(() => {});
    });

    // ─── Audio engine ──────────────────────────────────────────────────────────
    const audio = new AudioEngine();

    $effect(() => {
        audio.init().then(() => audio.loadTune(appState.selectedTune));
        return () => audio.dispose();
    });

    $effect(() => {
        const tune = appState.selectedTune;
        if (tune) audio.loadTune(tune);
    });

    // ─── TUNING CONSTANTS ──────────────────────────────────────────────────────
    // Play with these numbers to get the exact mechanical feel you want!

    const VISUAL_WINDING_SPEED = 0.4; // How much the box turns per pixel swiped
    const VISUAL_UNWINDING_SPEED = 0.15; // Rad/s the box spins while playing (make smaller to spin slower)
    const WINDING_ENERGY_RATE = 4; // How much tension 1 pixel of swipe adds
    const UNWINDING_DRAIN_RATE = 2.0; // How fast the spring tension drains

    // ─── Mechanical Wind-Up Physics ────────────────────────────────────────────
    const gesture = new GestureController();
    let canvasWrapper = $state<HTMLElement | null>(null);

    let gestureActive = $state(false);
    let energy = $state(0); // Stores the spring tension (0 to 3000)


    // 1. The Winding Action (Pointer Down)
    $effect(() => {
        if (!canvasWrapper) return;

        gesture.attach(canvasWrapper);
        gesture.onUpdate = ({ deltaX, isActive }) => {
            gestureActive = isActive;

            if (isActive) {
                // WINDING: Every pixel you pull adds tension to the spring
                energy += Math.abs(deltaX) * WINDING_ENERGY_RATE;
                energy = Math.min(energy, 3000);

                // Set the VISUAL rotation speed for the 3D model
                appState.velocity = deltaX * VISUAL_WINDING_SPEED;
            }
            resetSleepTimer();
        };

        return () => gesture.detach();
    });

    // 2. The Unwinding Action (Pointer Released)
    $effect(() => {
        if (gestureActive) return;

        let rafId: number;
        let lastAudioTempo = 0;

        function tick() {
            const currentEnergy = untrack(() => energy);
            if (currentEnergy > 0) {
                const nextEnergy = Math.max(
                    0,
                    currentEnergy - UNWINDING_DRAIN_RATE,
                );
                energy = nextEnergy;

                // Set the VISUAL rotation speed for the 3D model
                const playSpeed =
                    nextEnergy > 100
                        ? VISUAL_UNWINDING_SPEED
                        : (nextEnergy / 100) * VISUAL_UNWINDING_SPEED;
                appState.velocity = playSpeed;

                // AUDIO TEMPO CONTROL: Decoupled from the 3D visual rotation!
                const targetTempo = 0.8;
                const audioTempo =
                    nextEnergy > 100 ? targetTempo : Math.max(0.1, nextEnergy / 100);

                if (Math.abs(audioTempo - lastAudioTempo) > 0.01) {
                    audio.setVelocity(audioTempo);
                    lastAudioTempo = audioTempo;
                }

                rafId = requestAnimationFrame(tick);
            } else {
                appState.velocity = 0;
                audio.setVelocity(0);
                lastAudioTempo = 0;
            }
        }

        const initialEnergy = untrack(() => energy);
        if (initialEnergy > 0) {
            rafId = requestAnimationFrame(tick);
        }

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
        };
    });

    // 3. Play / Mute Logic
    const shouldPlay = $derived(
        !appState.isSleeping && !gestureActive && energy > 0,
    );
    $effect(() => {
        // Only play music when it is actively unwinding!
        if (shouldPlay) {
            audio.fadeIn();
        } else {
            audio.fadeOut();
        }
    });

    // ─── Sleep / idle timer ────────────────────────────────────────────────────
    const SLEEP_TIMEOUT = 30_000;
    let sleepTimer: ReturnType<typeof setTimeout> | null = null;

    function resetSleepTimer() {
        appState.lastInteraction = Date.now();
        if (appState.isSleeping) appState.isSleeping = false;
        if (sleepTimer) clearTimeout(sleepTimer);
        sleepTimer = setTimeout(() => {
            appState.isSleeping = true;
        }, SLEEP_TIMEOUT);
    }

    $effect(() => {
        resetSleepTimer();
        return () => {
            if (sleepTimer) clearTimeout(sleepTimer);
        };
    });

    // ─── User gesture → audio unlock ──────────────────────────────────────────
    async function handleInteraction() {
        await audio.ensureStarted();
        resetSleepTimer();
        audio.play(); // Transport must be running for fadeIn to work
    }

    // ─── Derived values for template ──────────────────────────────────────────
    const currentModelFile = $derived(
        appState.selectedModel.file
            ? `/models/${appState.selectedModel.file}`
            : undefined,
    );
    const currentColor = $derived(appState.selectedModel.color);
</script>

<svelte:head>
    <title>Vinda — Fidget Music Box</title>
</svelte:head>

<!-- Root container: full-screen, dark bg -->
<div
    class="app"
    class:light={!appState.darkMode}
    onpointerdown={handleInteraction}
    ontouchmove={resetSleepTimer}
    role="application"
    aria-label="Vinda fidget music box"
>
    <!-- 3D canvas layer — gesture target -->
    <div bind:this={canvasWrapper} class="canvas-target" aria-hidden="true">
        <Scene
            modelFile={currentModelFile}
            color={currentColor}
            velocity={appState.velocity}
            isSleeping={appState.isSleeping}
            {reducedMotion}
        />
    </div>

    <!-- Top-right controls -->
    <header class="top-bar">
        <div class="app-name">vinda</div>
        <button
            class="icon-btn"
            onclick={() => {
                appState.cycleTheme();
            }}
            aria-label={appState.theme === "system"
                ? "Theme: System. Click to switch to Dark"
                : appState.theme === "dark"
                  ? "Theme: Dark. Click to switch to Light"
                  : "Theme: Light. Click to switch to System"}
            title={appState.theme === "system"
                ? "Theme: System (Click to switch to Dark)"
                : appState.theme === "dark"
                  ? "Theme: Dark (Click to switch to Light)"
                  : "Theme: Light (Click to switch to System)"}
        >
            <Icon name="theme-{appState.theme}" size={18} />
        </button>
    </header>

    <!-- Sleep overlay hint -->
    {#if appState.isSleeping}
        <div class="sleep-hint" role="status" aria-live="polite">
            Tap to wake
        </div>
    {/if}

    <!-- Spin speed indicator -->
    {#if appState.isSpinning && !appState.isSleeping}
        <div class="spin-badge" aria-hidden="true">
            {Math.abs((appState.velocity * 60) / (2 * Math.PI)).toFixed(0)} rpm
        </div>
    {/if}

    <!-- Bottom carousel selector -->
    {#if !appState.isSleeping}
        <Carousel
            models={appState.models}
            tunes={appState.tunes}
            selectedModelId={appState.selectedModelId}
            selectedTuneId={appState.selectedTuneId}
            onModelSelect={(id) => {
                appState.selectedModelId = id;
            }}
            onTuneSelect={(id) => {
                appState.selectedTuneId = id;
            }}
        />
    {/if}
</div>

<style>
    .app {
        position: relative;
        width: 100dvw;
        height: 100dvh;
        overflow: hidden;
        background: var(--bg);
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
    }

    .app.light {
        --bg: #f0eeff;
        --text: #1a1030;
        --surface: rgba(26, 16, 48, 0.06);
        --surface-hover: rgba(26, 16, 48, 0.12);
        --border: rgba(26, 16, 48, 0.12);
        --border-active: rgba(26, 16, 48, 0.45);
        --text-muted: rgba(26, 16, 48, 0.5);
        --accent: #7965c4;
        --tray-bg: rgba(240, 238, 255, 0.75);

        /* Danger states for light mode */
        --danger-color: #c44545;
        --danger-border: rgba(196, 69, 69, 0.25);
        --danger-bg: rgba(196, 69, 69, 0.03);
        --danger-bg-hover: rgba(196, 69, 69, 0.08);
        --danger-border-hover: rgba(196, 69, 69, 0.4);
    }

    .canvas-target {
        position: absolute;
        inset: 0;
        touch-action: none;
        cursor: grab;
    }

    .canvas-target:active {
        cursor: grabbing;
    }

    /* ── Top bar ── */
    .top-bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        padding: 16px 20px;
        padding-top: max(16px, env(safe-area-inset-top));
        display: flex;
        align-items: center;
        justify-content: space-between;
        pointer-events: none;
        z-index: 20;
    }

    .app-name {
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.03em;
        color: var(--text);
        opacity: 0.7;
    }

    .icon-btn {
        pointer-events: all;
        min-width: 44px;
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: var(--surface);
        border: 1px solid var(--border);
        color: var(--text);
        font-size: 18px;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        transition: background 0.2s, border-color 0.2s, color 0.2s;
    }

    .icon-btn:hover {
        background: var(--surface-hover);
        border-color: var(--border-active);
    }

    /* ── Sleep hint ── */
    .sleep-hint {
        position: absolute;
        bottom: 50%;
        left: 50%;
        transform: translate(-50%, 50%);
        font-size: 14px;
        color: var(--text-muted);
        letter-spacing: 0.06em;
        pointer-events: none;
        z-index: 5;
        animation: pulse 3s ease-in-out infinite;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 0.3;
        }
        50% {
            opacity: 0.7;
        }
    }

    /* ── Spin badge ── */
    .spin-badge {
        position: absolute;
        top: 72px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 12px;
        font-weight: 600;
        color: rgba(181, 164, 245, 0.7);
        letter-spacing: 0.05em;
        pointer-events: none;
        z-index: 5;
        font-variant-numeric: tabular-nums;
    }
</style>
