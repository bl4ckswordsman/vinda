<script lang="ts">
    import { DragGesture } from "@use-gesture/vanilla";
    import { fade } from "svelte/transition";
    import type { ModelEntry, TuneEntry } from "./types.ts";
    import { CATEGORY_ICONS, GROUP_ICONS } from "./icons";
    import Icon from "./Icon.svelte";

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

    let currentCategory = $state<string | null>(null);
    let currentGroup = $state<string | null>(null);

    // Derived: unique categories and their icons
    const categories = $derived.by(() => {
        const seen = new Set<string>();
        const list: { name: string; icon: string }[] = [];
        for (const t of tunes) {
            const cat = t.category || "Uncategorized";
            if (!seen.has(cat)) {
                seen.add(cat);
                list.push({ name: cat, icon: CATEGORY_ICONS[cat] || CATEGORY_ICONS.Default });
            }
        }
        return list;
    });

    // Derived: unique groups under active category and their icons
    const groups = $derived.by(() => {
        if (!currentCategory) return [];
        const seen = new Set<string>();
        const list: { name: string; icon: string }[] = [];
        for (const t of tunes) {
            if (t.category === currentCategory && t.group) {
                if (!seen.has(t.group)) {
                    seen.add(t.group);
                    list.push({ name: t.group, icon: GROUP_ICONS[t.group] || GROUP_ICONS.Default });
                }
            }
        }
        return list;
    });

    // Derived: visible tunes in current selection view
    const visibleTunes = $derived.by(() => {
        if (!currentCategory) return [];
        return tunes.filter(t => {
            const sameCat = (t.category || "Uncategorized") === currentCategory;
            const sameGrp = currentGroup ? t.group === currentGroup : !t.group;
            return sameCat && sameGrp;
        });
    });

    // Derived: breadcrumb label for the tune selector section
    const tunePath = $derived.by(() => {
        if (!currentCategory) return "Tune";
        if (!currentGroup) return `Tune / ${currentCategory}`;
        return `Tune / ${currentCategory} / ${currentGroup}`;
    });

    // Auto-sync navigation state with the active selected tune
    $effect(() => {
        const activeTune = tunes.find(t => t.id === selectedTuneId);
        if (activeTune) {
            currentCategory = activeTune.category || null;
            currentGroup = activeTune.group || null;
        }
    });

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
    <div class="strip-label">{tunePath}</div>
    <div class="tune-strip">
        {#if !currentCategory}
            {#each categories as cat (cat.name)}
                <button
                    transition:fade={{ duration: 120 }}
                    class="chip category-chip"
                    onclick={() => currentCategory = cat.name}
                    aria-label={cat.name}
                >
                    <span class="chip-icon">
                        <Icon name={cat.icon} />
                    </span>
                    <span>{cat.name}</span>
                </button>
            {/each}
        {:else}
            <button
                transition:fade={{ duration: 120 }}
                class="chip back-chip"
                onclick={() => {
                    if (currentGroup) {
                        currentGroup = null;
                    } else {
                        currentCategory = null;
                    }
                }}
                aria-label="Back"
            >
                ↩ {currentGroup ? currentCategory : "All"}
            </button>

            {#if !currentGroup && groups.length > 0}
                {#each groups as grp (grp.name)}
                    <button
                        transition:fade={{ duration: 120 }}
                        class="chip group-chip"
                        onclick={() => currentGroup = grp.name}
                        aria-label={grp.name}
                    >
                        <span class="chip-icon">
                            <Icon name={grp.icon} />
                        </span>
                        <span>{grp.name}</span>
                    </button>
                {/each}
            {/if}

            {#each visibleTunes as tune (tune.id)}
                <button
                    transition:fade={{ duration: 120 }}
                    class="chip tune-chip"
                    class:active={tune.id === selectedTuneId}
                    onclick={() => onTuneSelect(tune.id)}
                    aria-label={tune.label}
                    aria-pressed={tune.id === selectedTuneId}
                >
                    <span class="chip-icon">
                        <Icon name="Classical" size={13} />
                    </span>
                    <span>{tune.label}</span>
                </button>
            {/each}
        {/if}
    </div>
</div>

<style>
    .carousel-tray {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 14px 16px 32px;
        background: var(--tray-bg);
        backdrop-filter: blur(20px) saturate(160%);
        -webkit-backdrop-filter: blur(20px) saturate(160%);
        border-top: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        gap: 8px;
        touch-action: none;
        z-index: 10;
        transition: background 0.3s, border-color 0.3s;
    }

    .strip-label {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-muted);
        padding-left: 4px;
        margin-bottom: -4px;
        transition: color 0.3s;
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
        border: 1.5px solid var(--border);
        background: var(--surface);
        color: var(--text);
        opacity: 0.85;
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
        transition:
            background 0.18s ease,
            border-color 0.18s ease,
            color 0.18s ease,
            opacity 0.18s ease;
        flex-shrink: 0;
    }

    .chip:hover {
        background: var(--surface-hover);
        border-color: var(--border-active);
        opacity: 1;
    }

    .chip.active {
        background: rgba(181, 164, 245, 0.15);
        border-color: var(--accent);
        color: var(--text);
        opacity: 1;
    }

    :global(.app.light) .chip.active {
        background: rgba(121, 101, 196, 0.12);
    }

    .color-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
        box-shadow: 0 0 6px currentColor;
    }

    .chip-icon {
        font-size: 14px;
        flex-shrink: 0;
    }

    .back-chip {
        border-color: var(--danger-border);
        color: var(--danger-color);
        background: var(--danger-bg);
    }

    .back-chip:hover {
        background: var(--danger-bg-hover);
        border-color: var(--danger-border-hover);
    }
</style>
