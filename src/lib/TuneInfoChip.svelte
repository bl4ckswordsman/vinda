<script lang="ts">
    import { getContext, untrack, onDestroy } from "svelte";
    import Icon from "./Icon.svelte";
    import type { AppState } from "./state.svelte";

    interface Props {
        energy: number;
        maxEnergy: number;
        gestureActive: boolean;
        onTogglePlay: () => void;
    }

    let { energy, maxEnergy, gestureActive, onTogglePlay }: Props = $props();

    const appState = getContext<AppState>("app");

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

    // --- Circular Wavy Progress Math & Logic ---
    let phase = $state(0);
    let waveAmp = $state(0);

    const progress = $derived.by(() => {
        if (appState.isPlaying) return 1.0;
        return Math.min(Math.max(energy / maxEnergy, 0), 1.0);
    });

    const isPlayingOrWound = $derived(appState.isPlaying || energy > 0);

    function generateWavyCirclePath(
        cx: number,
        cy: number,
        r_base: number,
        amplitude: number,
        lobes: number,
        phase: number,
        segments = 120
    ) {
        let points: string[] = [];
        for (let i = 0; i < segments; i++) {
            const theta = (i / segments) * 2 * Math.PI;
            // Primary wave (lobes peaks) and secondary wave (double frequency, reverse direction)
            const wave1 = 0.7 * Math.sin(lobes * theta + phase);
            const wave2 = 0.3 * Math.sin((lobes * 2) * theta - phase * 1.5);
            const r = r_base + amplitude * (wave1 + wave2);
            
            const x = cx + r * Math.cos(theta);
            const y = cy + r * Math.sin(theta);
            if (i === 0) {
                points.push(`M ${x.toFixed(2)} ${y.toFixed(2)}`);
            } else {
                points.push(`L ${x.toFixed(2)} ${y.toFixed(2)}`);
            }
        }
        points.push("Z");
        return points.join(" ");
    }

    const wavyPath = $derived(generateWavyCirclePath(18, 18, 16.0, waveAmp, 8, phase));

    const isAnimationActive = $derived(appState.isPlaying || energy > 0 || gestureActive);

    $effect(() => {
        let rafId: number;
        // Depend on the derived boolean so this effect only re-runs when the active state changes
        const active = isAnimationActive;
        const targetAmp = active ? 1.2 : 0;

        function tick() {
            const diff = targetAmp - waveAmp;
            if (Math.abs(diff) > 0.005) {
                waveAmp += diff * 0.15;
            } else {
                waveAmp = targetAmp;
            }

            if (active || waveAmp > 0.01) {
                phase = (phase + 0.08) % (2 * Math.PI);
                rafId = requestAnimationFrame(tick);
            }
        }

        rafId = requestAnimationFrame(tick);
        return () => {
            if (rafId) cancelAnimationFrame(rafId);
        };
    });
</script>

<div 
    class="info-chip" 
    class:playing={isPlayingOrWound || gestureActive}
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

    <!-- Play/Stop Toggle with Wavy Progress Indicator -->
    <div class="play-btn-wrapper">
        <svg class="wavy-progress-svg" viewBox="0 0 36 36" aria-hidden="true">
            <!-- Wavy background track (subtle) -->
            <path
                d={wavyPath}
                fill="none"
                stroke="var(--border)"
                stroke-width="1.5"
                opacity="0.3"
            />
            <!-- Wavy active progress indicator -->
            <path
                d={wavyPath}
                fill="none"
                stroke="var(--accent)"
                stroke-width="2.2"
                stroke-linecap="round"
                pathLength="100"
                stroke-dasharray="100"
                stroke-dashoffset={100 - (progress * 100)}
            />
        </svg>

        <button
            class="play-btn"
            onclick={onTogglePlay}
            aria-label={isPlayingOrWound ? "Stop music" : "Play music"}
            title={isPlayingOrWound ? "Stop music" : "Play music"}
        >
            {#if isPlayingOrWound}
                <span class="pulse-ring ring-1"></span>
                <span class="pulse-ring ring-2"></span>
                <Icon name="stop" size={12} />
            {:else}
                <Icon name="play" size={12} />
            {/if}
        </button>
    </div>
</div>

<style>
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

    /* Collapsed state: collapses into group icon and play/stop button wrapper */
    .info-chip.collapsed {
        max-width: 84px;
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

    /* Play/Stop Button Wrapper & Progress SVG */
    .play-btn-wrapper {
        position: relative;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .wavy-progress-svg {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        pointer-events: none;
        transform: rotate(-90deg); /* Start progress at 12 o'clock */
    }

    /* Animate progress stroke color transitions smoothly */
    .wavy-progress-svg path {
        transition: stroke-dashoffset 0.15s ease-out, stroke 0.2s, opacity 0.2s;
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
