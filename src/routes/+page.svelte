<script lang="ts">
    import { setContext, untrack } from "svelte";
    import { fade } from "svelte/transition";
    import { createAppState } from "$lib/state.svelte";
    import { GestureController } from "$lib/GestureController";
    import { AudioEngine } from "$lib/AudioEngine";
    import Scene from "$lib/Scene.svelte";
    import Carousel from "$lib/Carousel.svelte";
    import TuneInfoChip from "$lib/TuneInfoChip.svelte";
    import Icon from "$lib/Icon.svelte";
    import type { PageData } from "./$types";
    import { getCustomTunes } from "$lib/customTunesDb";
    import ImportModal from "$lib/ImportModal.svelte";
    import StarsBackground from "$lib/StarsBackground.svelte";

    let { data }: { data: PageData } = $props();

    // ─── Shared state ──────────────────────────────────────────────────────────
    const appState = createAppState();
    setContext("app", appState);

    // Populate state with models from SvelteKit page data
    $effect(() => {
        if (data.models?.length) appState.models = data.models;
    });

    // ─── Private/Custom Tunes Import State ──────────────────────────────────────
    let isModalOpen = $state(false);
    let customObjectUrls: string[] = [];

    async function loadCustomTunes() {
        if (typeof window === "undefined") return;
        try {
            // Revoke old object URLs to avoid memory leaks
            customObjectUrls.forEach((url) => URL.revokeObjectURL(url));
            customObjectUrls = [];

            const customItems = await getCustomTunes();
            const customTunes = customItems.map((item) => {
                if (item.blob) {
                    const objectUrl = URL.createObjectURL(item.blob);
                    customObjectUrls.push(objectUrl);
                    return {
                        id: item.id,
                        label: item.label,
                        category: item.category,
                        group: item.group,
                        soundType: item.soundType,
                        file: objectUrl, // Used by Tone.Player
                    };
                } else {
                    return {
                        id: item.id,
                        label: item.label,
                        category: item.category,
                        group: item.group,
                        soundType: item.soundType || 'music-box',
                        notes: item.notes || [],
                        durations: item.durations || [],
                        bpm: item.bpm || 80,
                    };
                }
            });

            // Merge public page data tunes with custom tunes
            const publicTunes = data.tunes || [];
            // Remove public tunes if overridden by custom tunes with same ID
            const publicFiltered = publicTunes.filter(
                (t) => !customTunes.some((ct) => ct.id === t.id),
            );

            appState.tunes = [...publicFiltered, ...customTunes];

            // If selected tune is no longer available (e.g. library cleared), reset to default
            if (!appState.tunes.some((t) => t.id === appState.selectedTuneId)) {
                appState.selectedTuneId = "default";
            }
        } catch (err) {
            console.error("Failed to load custom tunes:", err);
        }
    }

    $effect(() => {
        if (data.tunes) {
            loadCustomTunes();
        }
    });

    $effect(() => {
        return () => {
            customObjectUrls.forEach((url) => URL.revokeObjectURL(url));
        };
    });

    function togglePlay() {
        const isCurrentlyPlaying = appState.isPlaying || energy > 0;
        if (isCurrentlyPlaying) {
            appState.isPlaying = false;
            energy = 0; // stop visual movement and clear winding energy
        } else {
            appState.isPlaying = true;
            handleInteraction();
        }
    }

    const reducedMotion = $derived(
        typeof window !== "undefined"
            ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
            : false,
    );

    // ─── Audio engine ──────────────────────────────────────────────────────────
    const audio = new AudioEngine();

    $effect(() => {
        const tune = appState.selectedTune;
        if (tune) audio.loadTune(tune);
    });

    $effect(() => {
        return () => audio.dispose();
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
                appState.isPlaying = false; // Turn off autoplay when manual winding starts
                // WINDING: Every pixel you pull adds tension to the spring
                energy += Math.abs(deltaX) * WINDING_ENERGY_RATE;
                energy = Math.min(energy, 30000);

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

        // Track isPlaying so that this effect re-runs when it changes
        const activePlaying = appState.isPlaying;

        function tick() {
            const currentEnergy = untrack(() => energy);
            const isAutoPlaying = untrack(() => appState.isPlaying);

            if (currentEnergy > 0 || isAutoPlaying) {
                let nextEnergy = currentEnergy;
                if (!isAutoPlaying) {
                    nextEnergy = Math.max(
                        0,
                        currentEnergy - UNWINDING_DRAIN_RATE,
                    );
                    energy = nextEnergy;
                }

                // Set the VISUAL rotation speed for the 3D model (scaled by tempoMultiplier)
                const playSpeed = (isAutoPlaying
                    ? VISUAL_UNWINDING_SPEED
                    : (nextEnergy > 100
                        ? VISUAL_UNWINDING_SPEED
                        : (nextEnergy / 100) * VISUAL_UNWINDING_SPEED)) * appState.tempoMultiplier;
                appState.velocity = playSpeed;

                // AUDIO TEMPO CONTROL: Decoupled from the 3D visual rotation! (scaled by tempoMultiplier)
                const targetTempo = 0.8 * appState.tempoMultiplier;
                const audioTempo = isAutoPlaying
                    ? targetTempo
                    : (nextEnergy > 100 ? targetTempo : Math.max(0.1, (nextEnergy / 100) * appState.tempoMultiplier));

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
        if (initialEnergy > 0 || activePlaying) {
            rafId = requestAnimationFrame(tick);
        } else {
            appState.velocity = 0;
            audio.setVelocity(0);
        }

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
        };
    });

    // 3. Play / Mute Logic
    const shouldPlay = $derived(
        !appState.isSleeping && !gestureActive && (energy > 0 || appState.isPlaying),
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
    <!-- Subtle twinkling background stars in dark mode -->
    {#if appState.darkMode && !appState.isSleeping}
        <div transition:fade={{ duration: 800 }}>
            <StarsBackground />
        </div>
    {/if}

    <!-- Soft glowing sun in light mode -->
    {#if !appState.darkMode && !appState.isSleeping}
        <div class="sun" transition:fade={{ duration: 1000 }}></div>
    {/if}

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
        <div class="top-controls">
            <!-- Info Chip -->
            <TuneInfoChip {energy} maxEnergy={30000} {gestureActive} onTogglePlay={togglePlay} />

            <!-- Theme Cycle Button -->
            <button
                class="icon-btn"
                onclick={() => {
                    appState.cycleTheme();
                }}
                aria-label={appState.theme === "system"
                    ? "Theme: System. Click to switch to Dark"
                    : appState.theme === "dark"
                      ? "Theme: Dark. Click to switch to Light"
                      : "Theme: Light. Click to System"}
                title={appState.theme === "system"
                    ? "Theme: System (Click to switch to Dark)"
                    : appState.theme === "dark"
                      ? "Theme: Dark (Click to switch to Light)"
                      : "Theme: Light (Click to System)"}
            >
                <Icon name="theme-{appState.theme}" size={22} />
            </button>
        </div>
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
            soundTypeFilter={appState.soundTypeFilter}
            activeMenuTab={appState.activeMenuTab}
            tempoMultiplier={appState.tempoMultiplier}
            isTrayCollapsed={appState.isTrayCollapsed}
            onModelSelect={(id) => {
                appState.selectedModelId = id;
            }}
            onTuneSelect={(id) => {
                appState.selectedTuneId = id;
            }}
            onFilterSelect={(filter) => {
                appState.soundTypeFilter = filter;
            }}
            onMenuTabSelect={(tab) => {
                appState.activeMenuTab = tab;
            }}
            onTempoChange={(tempo) => {
                appState.tempoMultiplier = tempo;
            }}
            onToggleCollapse={() => {
                appState.isTrayCollapsed = !appState.isTrayCollapsed;
            }}
            onImportClick={() => {
                isModalOpen = true;
            }}
        />
    {/if}

    <ImportModal
        isOpen={isModalOpen}
        onClose={() => {
            isModalOpen = false;
        }}
        onImportSuccess={loadCustomTunes}
    />
</div>

<style>
    .app {
        position: relative;
        width: 100dvw;
        height: 100dvh;
        overflow: hidden;
        background: var(--bg);
        touch-action: manipulation;
        user-select: none;
        -webkit-user-select: none;
    }

    .app.light {
        --bg: radial-gradient(circle at top right, #e0f2fe 0%, #f0f7fc 100%);
        --text: #1e293b;
        --surface: rgba(30, 41, 59, 0.06);
        --surface-hover: rgba(30, 41, 59, 0.12);
        --border: rgba(30, 41, 59, 0.12);
        --border-active: rgba(30, 41, 59, 0.45);
        --text-muted: rgba(30, 41, 59, 0.5);
        --accent: #d63b51;
        --accent-hover: #b22238;
        --tray-bg: rgba(240, 247, 252, 0.75);

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
        padding: 20px 24px;
        padding-top: max(20px, env(safe-area-inset-top));
        display: flex;
        align-items: center;
        justify-content: space-between;
        pointer-events: none;
        z-index: 20;
    }

    .app-name {
        font-size: 22px;
        font-weight: 700;
        letter-spacing: -0.03em;
        color: var(--text);
        opacity: 0.7;
    }

    .icon-btn {
        pointer-events: all;
        min-width: 50px;
        min-height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: var(--surface);
        border: 1px solid var(--border);
        color: var(--text);
        font-size: 22px;
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
        font-size: 16px;
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
        top: 86px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 14px;
        font-weight: 600;
        color: rgba(255, 98, 117, 0.7);
        letter-spacing: 0.05em;
        pointer-events: none;
        z-index: 5;
        font-variant-numeric: tabular-nums;
    }

    /* ── Top controls wrapper ── */
    .top-controls {
        pointer-events: all;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    /* ── Sun Glow in Light Mode ── */
    .sun {
        position: absolute;
        top: -120px;
        right: -120px;
        width: 420px;
        height: 420px;
        border-radius: 50%;
        background: radial-gradient(
            circle,
            rgba(255, 253, 224, 0.75) 0%,
            rgba(255, 248, 180, 0.3) 35%,
            rgba(255, 255, 255, 0) 70%
        );
        filter: blur(15px);
        pointer-events: none;
        z-index: 0;
        animation: sun-pulse 8s ease-in-out infinite;
    }

    @keyframes sun-pulse {
        0%, 100% {
            transform: scale(1.0);
            opacity: 0.85;
        }
        50% {
            transform: scale(1.08);
            opacity: 1.0;
        }
    }
</style>
