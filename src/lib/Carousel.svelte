<script lang="ts">
    import { DragGesture } from "@use-gesture/vanilla";
    import type { ModelEntry, TuneEntry } from "./types.ts";

    interface Props {
        models: ModelEntry[];
        tunes: TuneEntry[];
        selectedModelId: string;
        selectedTuneId: string;
        onModelSelect: (id: string) => void;
        onTuneSelect: (id: string) => void;
    }

    let {
        models,
        tunes,
        selectedModelId,
        selectedTuneId,
        onModelSelect,
        onTuneSelect,
    }: Props = $props();

    let trayEl = $state<HTMLElement | null>(null);
    let modelOffset = $state(0);

    $effect(() => {
        if (!trayEl) return;

        // Instantiate DragGesture with the target element
        const gesture = new DragGesture(
            trayEl,
            ({ active, movement: [mx, my], last }) => {
                if (Math.abs(mx) > Math.abs(my)) {
                    // Horizontal drag → model selector
                    modelOffset = active ? mx * 0.4 : 0;

                    if (last && Math.abs(mx) > 55) {
                        const dir = mx < 0 ? 1 : -1;
                        const currentIdx = models.findIndex(
                            (m) => m.id === selectedModelId,
                        );
                        const nextIdx = Math.max(
                            0,
                            Math.min(models.length - 1, currentIdx + dir),
                        );
                        onModelSelect(models[nextIdx].id);
                    }
                } else if (last && Math.abs(my) > 55) {
                    // Vertical drag → tune selector
                    const dir = my < 0 ? 1 : -1;
                    const currentIdx = tunes.findIndex(
                        (t) => t.id === selectedTuneId,
                    );
                    const nextIdx = Math.max(
                        0,
                        Math.min(tunes.length - 1, currentIdx + dir),
                    );
                    onTuneSelect(tunes[nextIdx].id);
                }
            },
            {
                eventOptions: { passive: false },
                pointer: { touch: true },
            },
        );

        // Cleanup function for the effect
        return () => gesture.destroy();
    });
</script>

<div
    bind:this={trayEl}
    class="carousel-tray"
    role="toolbar"
    aria-label="Model and tune selector"
>
    <!-- Model strip -->
    <div class="strip-label">Design</div>
    <div
        class="model-strip"
        style="transform: translateX({modelOffset}px); transition: {modelOffset ===
        0
            ? 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)'
            : 'none'}"
    >
        {#each models as model (model.id)}
            <button
                class="chip"
                class:active={model.id === selectedModelId}
                onclick={() => onModelSelect(model.id)}
                aria-label={model.label}
                aria-pressed={model.id === selectedModelId}
            >
                <span class="color-dot" style="background: {model.color}"
                ></span>
                <span>{model.label}</span>
            </button>
        {/each}
    </div>

    <!-- Tune strip -->
    <div class="strip-label">Tune</div>
    <div class="tune-strip">
        {#each tunes as tune (tune.id)}
            <button
                class="chip"
                class:active={tune.id === selectedTuneId}
                onclick={() => onTuneSelect(tune.id)}
                aria-label={tune.label}
                aria-pressed={tune.id === selectedTuneId}
            >
                ♪ {tune.label}
            </button>
        {/each}
    </div>
</div>

<style>
    .carousel-tray {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 14px 16px 32px;
        background: rgba(13, 13, 15, 0.75);
        backdrop-filter: blur(20px) saturate(160%);
        -webkit-backdrop-filter: blur(20px) saturate(160%);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        flex-direction: column;
        gap: 8px;
        touch-action: none;
        z-index: 10;
    }

    .strip-label {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.35);
        padding-left: 4px;
        margin-bottom: -4px;
    }

    .model-strip,
    .tune-strip {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
        -ms-overflow-style: none;
        padding-bottom: 2px;
    }

    .model-strip::-webkit-scrollbar,
    .tune-strip::-webkit-scrollbar {
        display: none;
    }

    .chip {
        display: flex;
        align-items: center;
        gap: 7px;
        min-height: 44px;
        min-width: 44px;
        padding: 8px 16px;
        border-radius: 22px;
        border: 1.5px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.07);
        color: rgba(255, 255, 255, 0.75);
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
        transition:
            background 0.18s ease,
            border-color 0.18s ease,
            color 0.18s ease;
        flex-shrink: 0;
    }

    .chip:hover {
        background: rgba(255, 255, 255, 0.13);
        border-color: rgba(255, 255, 255, 0.25);
    }

    .chip.active {
        background: rgba(181, 164, 245, 0.18);
        border-color: rgba(181, 164, 245, 0.6);
        color: #e8e0ff;
    }

    .color-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
        box-shadow: 0 0 6px currentColor;
    }
</style>
