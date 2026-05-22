<script lang="ts">
    import { setContext, untrack, onDestroy } from "svelte";
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

    const selectedTuneIcon = $derived(
        appState.selectedTune.group || appState.selectedTune.category || "Default"
    );

    // Collapsing Info Chip State & Logic
    let isHovered = $state(false);
    let chipManuallyExpanded = $state(false);
    let autoCollapseTimeout: ReturnType<typeof setTimeout> | null = null;
    let chipExpanded = $state(true);

    const COLLAPSE_DELAY = 6000; // 6 seconds

    function triggerAutoCollapseTimer() {
        if (autoCollapseTimeout) {
            clearTimeout(autoCollapseTimeout);
        }
        autoCollapseTimeout = setTimeout(() => {
            if (!isHovered) {
                chipExpanded = false;
                chipManuallyExpanded = false;
            }
        }, COLLAPSE_DELAY);
    }

    function expandChipTemporarily() {
        chipExpanded = true;
        triggerAutoCollapseTimer();
    }

    function handleMouseEnter() {
        isHovered = true;
        chipExpanded = true;
        if (autoCollapseTimeout) {
            clearTimeout(autoCollapseTimeout);
        }
    }

    function handleMouseLeave() {
        isHovered = false;
        triggerAutoCollapseTimer();
    }

    function handleChipClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (target.closest(".play-btn")) {
            // Clicking the play button shouldn't toggle expand/collapse state
            return;
        }
        chipManuallyExpanded = !chipManuallyExpanded;
        if (chipManuallyExpanded) {
            chipExpanded = true;
            if (autoCollapseTimeout) {
                clearTimeout(autoCollapseTimeout);
                autoCollapseTimeout = null;
            }
        } else {
            triggerAutoCollapseTimer();
        }
    }

    onDestroy(() => {
        if (autoCollapseTimeout) {
            clearTimeout(autoCollapseTimeout);
        }
    });

    // Auto-expand temporarily on tune or playback status changes
    $effect(() => {
        // Track these reactively
        const _tuneId = appState.selectedTuneId;
        const _playing = appState.isPlaying;

        untrack(() => {
            expandChipTemporarily();
        });
    });

    function togglePlay() {
        if (appState.isPlaying) {
            appState.isPlaying = false;
            energy = 0; // stop visual movement
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
                appState.isPlaying = false; // Turn off autoplay when manual winding starts
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

                // Set the VISUAL rotation speed for the 3D model
                const playSpeed = isAutoPlaying
                    ? VISUAL_UNWINDING_SPEED
                    : (nextEnergy > 100
                        ? VISUAL_UNWINDING_SPEED
                        : (nextEnergy / 100) * VISUAL_UNWINDING_SPEED);
                appState.velocity = playSpeed;

                // AUDIO TEMPO CONTROL: Decoupled from the 3D visual rotation!
                const targetTempo = 0.8;
                const audioTempo = isAutoPlaying
                    ? targetTempo
                    : (nextEnergy > 100 ? targetTempo : Math.max(0.1, nextEnergy / 100));

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
            <div 
                class="info-chip" 
                class:playing={appState.isPlaying || (energy > 0 && !gestureActive)}
                class:collapsed={!chipExpanded && !isHovered && !chipManuallyExpanded}
                onmouseenter={handleMouseEnter}
                onmouseleave={handleMouseLeave}
                onclick={handleChipClick}
                role="button"
                tabindex="0"
                onkeydown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        handleChipClick(e as any);
                    }
                }}
                aria-label="Tune info chip"
            >
                <div class="chip-icon">
                    <Icon name={selectedTuneIcon} size={18} />
                </div>
                
                <div class="chip-content">
                    <span class="chip-label">{appState.selectedTune.label}</span>
                    {#if appState.selectedTune.group}
                        <span class="chip-sublabel">{appState.selectedTune.group}</span>
                    {/if}
                </div>

                <!-- Squiggly Wave visualizer -->
                <div class="wave-container" aria-hidden="true">
                    <svg class="squiggly-wave" class:active={appState.isPlaying || (energy > 0 && !gestureActive)} viewBox="0 0 24 12">
                        <path class="wave-path path-1" d="M0,6 Q3,2 6,6 T12,6 T18,6 T24,6" fill="none" stroke="var(--accent)" stroke-width="1.5" />
                        <path class="wave-path path-2" d="M0,6 Q3,10 6,6 T12,6 T18,6 T24,6" fill="none" stroke="var(--accent)" stroke-width="1" opacity="0.5" />
                    </svg>
                </div>

                <!-- Play/Stop Toggle -->
                <button
                    class="play-btn"
                    onclick={togglePlay}
                    aria-label={appState.isPlaying ? "Stop music" : "Play music"}
                    title={appState.isPlaying ? "Stop music" : "Play music"}
                >
                    {#if appState.isPlaying}
                        <span class="pulse-ring ring-1"></span>
                        <span class="pulse-ring ring-2"></span>
                        <Icon name="stop" size={12} />
                    {:else}
                        <Icon name="play" size={12} />
                    {/if}
                </button>
            </div>

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
                <Icon name="theme-{appState.theme}" size={18} />
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
        --accent-hover: #5d4aa3;
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

    /* ── Top controls wrapper & Info Chip ── */
    .top-controls {
        pointer-events: all;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .info-chip {
        display: flex;
        align-items: center;
        padding: 6px 8px 6px 12px;
        border-radius: 24px;
        background: var(--surface);
        border: 1px solid var(--border);
        color: var(--text);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        transition: background 0.2s, border-color 0.2s, color 0.2s,
                    max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                    padding 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        height: 44px;
        box-sizing: border-box;
        max-width: 320px;
        overflow: hidden;
        white-space: nowrap;
        cursor: pointer;
    }

    .info-chip:hover {
        background: var(--surface-hover);
        border-color: var(--border-active);
    }

    /* Collapsed state: collapses into group icon and play/stop button */
    .info-chip.collapsed {
        max-width: 76px;
        padding: 6px 8px 6px 12px;
    }

    .chip-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.85;
        flex-shrink: 0;
        margin-right: 12px;
        transition: margin-right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .info-chip.collapsed .chip-icon {
        margin-right: 8px;
    }

    .chip-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        max-width: 140px;
        min-width: 0;
        overflow: hidden;
        margin-right: 12px;
        transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                    margin-right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        flex-shrink: 0;
    }

    .info-chip.collapsed .chip-content {
        max-width: 0;
        width: 0;
        margin-right: 0;
        opacity: 0;
        transform: translateX(-10px) scale(0.9);
        pointer-events: none;
    }

    .chip-label {
        font-size: 13px;
        font-weight: 600;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .chip-sublabel {
        font-size: 10px;
        font-weight: 500;
        opacity: 0.6;
        line-height: 1.1;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    /* Wave visualizer */
    .wave-container {
        display: flex;
        align-items: center;
        width: 24px;
        height: 12px;
        min-width: 0;
        overflow: hidden;
        margin-left: -2px;
        margin-right: 12px;
        transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                    margin-right 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                    margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        flex-shrink: 0;
    }

    .info-chip.collapsed .wave-container {
        opacity: 0;
        transform: scale(0.8);
        width: 0;
        margin-right: 0;
        margin-left: 0;
        pointer-events: none;
    }

    .squiggly-wave {
        overflow: hidden;
        width: 24px;
        height: 12px;
    }

    .wave-path {
        stroke-linecap: round;
    }

    .squiggly-wave.active .path-1 {
        animation: wave-slide 1.5s linear infinite;
    }

    .squiggly-wave.active .path-2 {
        animation: wave-slide-reverse 2s linear infinite;
    }

    @keyframes wave-slide {
        0% {
            stroke-dasharray: 6, 3;
            stroke-dashoffset: 0;
        }
        100% {
            stroke-dasharray: 6, 3;
            stroke-dashoffset: -18;
        }
    }

    @keyframes wave-slide-reverse {
        0% {
            stroke-dasharray: 5, 4;
            stroke-dashoffset: 0;
        }
        100% {
            stroke-dasharray: 5, 4;
            stroke-dashoffset: 18;
        }
    }

    /* Play/Stop Button inside Chip */
    .play-btn {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--accent);
        color: #ffffff;
        border: none;
        cursor: pointer;
        transition: transform 0.2s, background-color 0.2s;
        outline: none;
        padding: 0;
        flex-shrink: 0;
    }

    .play-btn:hover {
        transform: scale(1.06);
        background: var(--accent-hover, #6451a9);
    }

    .play-btn:active {
        transform: scale(0.94);
    }

    /* Expressive Ripple Rings (M3 Style) */
    .pulse-ring {
        position: absolute;
        inset: -6px;
        border: 2.5px solid var(--accent);
        border-radius: 50%;
        opacity: 0;
        pointer-events: none;
    }

    .play-btn .ring-1 {
        animation: pulse-ring-anim 2.4s cubic-bezier(0.1, 0.8, 0.2, 1) infinite;
    }

    .play-btn .ring-2 {
        animation: pulse-ring-anim 2.4s cubic-bezier(0.1, 0.8, 0.2, 1) infinite;
        animation-delay: 0.8s;
    }

    @keyframes pulse-ring-anim {
        0% {
            transform: scale(0.7);
            opacity: 0.65;
        }
        100% {
            transform: scale(1.6);
            opacity: 0;
        }
    }
</style>
