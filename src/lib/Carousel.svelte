<script lang="ts">
    import { DragGesture } from "@use-gesture/vanilla";
    import { fade } from "svelte/transition";
    import type { ModelEntry, TuneEntry } from "./types";
    import { getSoundType } from "./types";
    import { CATEGORY_ICONS, GROUP_ICONS } from "./icons";
    import Icon from "./Icon.svelte";

    interface Props {
        models: ModelEntry[];
        tunes: TuneEntry[];
        selectedModelId: string;
        selectedTuneId: string;
        soundTypeFilter: "all" | "music-box" | "normal";
        activeMenuTab: "tunes" | "designs";
        onModelSelect: (id: string) => void;
        onTuneSelect: (id: string) => void;
        onFilterSelect: (filter: "all" | "music-box" | "normal") => void;
        onMenuTabSelect: (tab: "tunes" | "designs") => void;
    }

    let {
        models,
        tunes,
        selectedModelId,
        selectedTuneId,
        soundTypeFilter,
        activeMenuTab,
        onModelSelect,
        onTuneSelect,
        onFilterSelect,
        onMenuTabSelect,
    }: Props = $props();

    let trayEl = $state<HTMLElement | null>(null);
    let modelOffset = $state(0);

    let currentCategory = $state<string | null>(null);
    let currentGroup = $state<string | null>(null);

    // Derived: unique categories and their icons
    // Derived: filtered tunes based on active sound type filter
    const filteredTunes = $derived.by(() => {
        if (soundTypeFilter === "all") return tunes;
        return tunes.filter(t => getSoundType(t) === soundTypeFilter);
    });

    // Derived: unique categories and their icons
    const categories = $derived.by(() => {
        const seen = new Set<string>();
        const list: { name: string; icon: string }[] = [];
        for (const t of filteredTunes) {
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
        for (const t of filteredTunes) {
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
        return filteredTunes.filter(t => {
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
    // Auto-sync navigation state with the active selected tune (if active filter permits)
    $effect(() => {
        const activeTune = filteredTunes.find(t => t.id === selectedTuneId);
        if (activeTune) {
            currentCategory = activeTune.category || null;
            currentGroup = activeTune.group || null;
        } else {
            // If active tune is filtered out, ensure currentCategory is still valid for this filter
            if (currentCategory && !categories.some(c => c.name === currentCategory)) {
                currentCategory = null;
                currentGroup = null;
            }
        }
    });

    $effect(() => {
        if (!trayEl) return;

        // Instantiate DragGesture with the target element
        const gesture = new DragGesture(
            trayEl,
            ({ active, movement: [mx, my], last, event }) => {
                const target = event.target as HTMLElement;
                const onStrip = target.closest('.model-strip, .tune-strip');

                if (Math.abs(mx) > Math.abs(my)) {
                    // If the user drags horizontally on a scrollable strip, let the browser handle it
                    if (onStrip) {
                        modelOffset = 0;
                        return;
                    }

                    // Horizontal drag on the tray background → model selector (only in designs tab)
                    if (activeMenuTab !== "designs") return;
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
                    // Vertical drag → tune selector (within active filter, only in tunes tab)
                    if (activeMenuTab !== "tunes") return;
                    const dir = my < 0 ? 1 : -1;
                    const currentIdx = filteredTunes.findIndex(
                        (t) => t.id === selectedTuneId,
                    );
                    if (currentIdx !== -1 && filteredTunes.length > 0) {
                        const nextIdx = Math.max(
                            0,
                            Math.min(filteredTunes.length - 1, currentIdx + dir),
                        );
                        onTuneSelect(filteredTunes[nextIdx].id);
                    }
                }
            },
            {
                eventOptions: { passive: true },
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
    {#if activeMenuTab === "designs"}
        <div class="panel-content" transition:fade={{ duration: 150 }}>
            <!-- Model strip -->
            <div class="strip-label">Appearance</div>
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
        </div>
    {:else}
        <div class="panel-content" transition:fade={{ duration: 150 }}>
            <!-- Tune strip -->
            <div class="tune-header">
                <div class="strip-label">{tunePath}</div>
                <div class="segmented-control" role="tablist" aria-label="Filter tunes by type">
                    <button
                        class="segment-btn"
                        class:active={soundTypeFilter === "all"}
                        onclick={() => onFilterSelect("all")}
                        role="tab"
                        aria-selected={soundTypeFilter === "all"}
                    >
                        <Icon name="layers" size={13} />
                        <span>All</span>
                    </button>
                    <button
                        class="segment-btn"
                        class:active={soundTypeFilter === "music-box"}
                        onclick={() => onFilterSelect("music-box")}
                        role="tab"
                        aria-selected={soundTypeFilter === "music-box"}
                    >
                        <Icon name="music" size={13} />
                        <span>Music Box</span>
                    </button>
                    <button
                        class="segment-btn"
                        class:active={soundTypeFilter === "normal"}
                        onclick={() => onFilterSelect("normal")}
                        role="tab"
                        aria-selected={soundTypeFilter === "normal"}
                    >
                        <Icon name="headphones" size={13} />
                        <span>Normal</span>
                    </button>
                </div>
            </div>
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
                                <Icon name={cat.icon} size={18} />
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
                                    <Icon name={grp.icon} size={18} />
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
                                <Icon name={getSoundType(tune) === "music-box" ? "music" : "headphones"} size={15} />
                            </span>
                            <span>{tune.label}</span>
                        </button>
                    {/each}
                {/if}
            </div>
        </div>
    {/if}

    <!-- Bottom tab switcher -->
    <div class="menu-tabs" role="tablist" aria-label="Controls Mode">
        <button
            class="menu-tab-btn"
            class:active={activeMenuTab === "tunes"}
            onclick={() => onMenuTabSelect("tunes")}
            role="tab"
            aria-selected={activeMenuTab === "tunes"}
        >
            <Icon name="music" size={13} />
            <span>Tunes</span>
        </button>
        <button
            class="menu-tab-btn"
            class:active={activeMenuTab === "designs"}
            onclick={() => onMenuTabSelect("designs")}
            role="tab"
            aria-selected={activeMenuTab === "designs"}
        >
            <Icon name="palette" size={13} />
            <span>Appearance</span>
        </button>
    </div>
</div>

<style>
    .carousel-tray {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 16px 20px max(18px, env(safe-area-inset-bottom));
        background: var(--tray-bg);
        backdrop-filter: blur(20px) saturate(160%);
        -webkit-backdrop-filter: blur(20px) saturate(160%);
        border-top: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        gap: 12px;
        /* Allow browser to handle horizontal scrolls (pan-x), let JS handle vertical swipes */
        touch-action: pan-x;
        z-index: 10;
        transition: background 0.3s, border-color 0.3s, padding 0.3s;
    }

    .strip-label {
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-muted);
        padding-left: 4px;
        transition: color 0.3s;
    }

    /* ── Tune Header & Sub-filter Control ── */
    .tune-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-right: 4px;
        margin-top: 4px;
        margin-bottom: 12px; /* Increased from -2px to fix overlapping with tune chips */
    }

    .segmented-control {
        display: flex;
        background: transparent; /* Removed backing panel to establish clear visual hierarchy */
        border: none;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        gap: 6px;
    }

    .segment-btn {
        display: flex;
        align-items: center;
        gap: 5px;
        background: transparent;
        border: 1px solid transparent;
        color: var(--text-muted);
        font-size: 11px; /* Smaller font signals sub-filter level */
        font-weight: 600;
        padding: 4px 10px;
        border-radius: var(--radius-pill);
        transition: color 0.18s ease, background-color 0.18s ease, border-color 0.18s ease, transform 0.1s ease;
    }

    .segment-btn:hover {
        color: var(--text);
    }

    .segment-btn.active {
        background: var(--surface); /* Subtle flat background */
        border-color: var(--border);
        color: var(--text);
        box-shadow: none; /* No shadow to keep it flat and subordinate */
    }

    :global(.app.light) .segment-btn.active {
        background: rgba(48, 16, 20, 0.08);
        border-color: rgba(48, 16, 20, 0.15);
        box-shadow: none;
    }

    .segment-btn:active {
        transform: scale(0.96);
    }

    .model-strip,
    .tune-strip {
        display: flex;
        gap: 10px;
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
        gap: 8px;
        min-height: 50px;
        min-width: 50px;
        padding: 10px 20px;
        border-radius: 25px;
        border: 1.5px solid var(--border);
        background: var(--surface);
        color: var(--text);
        opacity: 0.85;
        font-size: 15px;
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
        background: rgba(255, 98, 117, 0.15);
        border-color: var(--accent);
        color: var(--text);
        opacity: 1;
    }

    :global(.app.light) .chip.active {
        background: rgba(214, 59, 81, 0.12);
    }

    .color-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        flex-shrink: 0;
        box-shadow: 0 0 6px currentColor;
    }

    .chip-icon {
        font-size: 16px;
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

    /* ── Tab Switcher at the bottom ── */
    .menu-tabs {
        display: flex;
        align-self: center;
        background: rgba(0, 0, 0, 0.25);
        border: 1px solid var(--border);
        border-radius: var(--radius-pill);
        padding: 3px;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        gap: 3px;
        margin-top: 6px;
        box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.05);
    }

    :global(.app.light) .menu-tabs {
        background: rgba(48, 16, 20, 0.06);
    }

    .menu-tab-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: transparent;
        border: none;
        color: var(--text-muted);
        font-size: 13px;
        font-weight: 600;
        padding: 8px 20px;
        border-radius: var(--radius-pill);
        transition: color 0.2s ease, background-color 0.2s ease, transform 0.1s ease;
    }

    .menu-tab-btn:hover {
        color: var(--text);
    }

    .menu-tab-btn.active {
        background: var(--surface-hover);
        color: var(--text);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    :global(.app.light) .menu-tab-btn.active {
        background: var(--surface-hover);
        box-shadow: 0 2px 8px rgba(48, 16, 20, 0.1);
    }

    .menu-tab-btn:active {
        transform: scale(0.96);
    }
</style>
