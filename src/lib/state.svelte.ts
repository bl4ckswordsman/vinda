import type { TuneEntry, ModelEntry } from './types.ts';

const DEFAULT_TUNE: TuneEntry = {
  id: 'default',
  label: 'Für Elise',
  notes: ['E5','D#5','E5','D#5','E5','B4','D5','C5','A4','C4','E4','A4','B4'],
  durations: ['8n'],
  bpm: 80,
};

const DEFAULT_MODEL: ModelEntry = {
  id: 'carousel',
  file: 'carousel_music_box-1-spinner.glb',
  label: 'Carousel 1',
  color: '#ff6275',
};

export function createAppState() {
  function applyCustomColors(newModels: ModelEntry[]): ModelEntry[] {
    if (typeof window === 'undefined') return newModels;
    try {
      const stored = localStorage.getItem('vinda-custom-model-colors');
      if (stored) {
        const customColors = JSON.parse(stored);
        return newModels.map(m => {
          if (customColors[m.id]) {
            return { ...m, color: customColors[m.id] };
          }
          return m;
        });
      }
    } catch (e) {
      console.error('Failed to parse custom model colors', e);
    }
    return newModels;
  }

  // Spin / rotation
  let velocity = $state(0);
  let isPlaying = $state(false);

  // Sleep / idle
  let isSleeping = $state(false);
  let lastInteraction = $state(Date.now());

  // Model selection
  let models = $state<ModelEntry[]>(
    typeof window !== 'undefined'
      ? applyCustomColors([DEFAULT_MODEL])
      : [DEFAULT_MODEL]
  );
  let selectedModelId = $state('carousel');

  // Tune selection
  let tunes = $state<TuneEntry[]>([DEFAULT_TUNE]);
  let selectedTuneId = $state('default');

  // Sound type filter
  let soundTypeFilter = $state<'all' | 'music-box' | 'normal'>('all');

  // Active menu tab
  let activeMenuTab = $state<'tunes' | 'designs'>('tunes');

  // Tempo multiplier control
  let tempoMultiplier = $state(1.0);

  // Theme
  let theme = $state<'system' | 'dark' | 'light'>(
    typeof window !== 'undefined'
      ? (localStorage.getItem('vinda-theme') as 'system' | 'dark' | 'light' ?? 'system')
      : 'system'
  );
  let systemPrefersDark = $state(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  // Tray collapsed state
  let isTrayCollapsed = $state<boolean>(
    typeof window !== 'undefined'
      ? localStorage.getItem('vinda-tray-collapsed') === 'true'
      : false
  );

  $effect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => {
        systemPrefersDark = e.matches;
      };
      mediaQuery.addEventListener('change', listener);
      return () => {
        mediaQuery.removeEventListener('change', listener);
      };
    }
  });

  $effect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vinda-theme', theme);
    }
  });

  $effect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vinda-tray-collapsed', String(isTrayCollapsed));
    }
  });

  // Derived helpers
  const selectedModel = $derived(
    models.find(m => m.id === selectedModelId) ?? DEFAULT_MODEL
  );
  const selectedTune = $derived(
    tunes.find(t => t.id === selectedTuneId) ?? DEFAULT_TUNE
  );
  const isSpinning = $derived(Math.abs(velocity) > 0.01);
  const darkMode = $derived(
    theme === 'system' ? systemPrefersDark : theme === 'dark'
  );

  return {
    get velocity() { return velocity; },
    set velocity(v: number) { velocity = v; },

    get isPlaying() { return isPlaying; },
    set isPlaying(p: boolean) { isPlaying = p; },

    get isSleeping() { return isSleeping; },
    set isSleeping(s: boolean) { isSleeping = s; },

    get lastInteraction() { return lastInteraction; },
    set lastInteraction(t: number) { lastInteraction = t; },

    get models() { return models; },
    set models(m: ModelEntry[]) { models = applyCustomColors(m); },

    get selectedModelId() { return selectedModelId; },
    set selectedModelId(id: string) { selectedModelId = id; },

    get tunes() { return tunes; },
    set tunes(t: TuneEntry[]) { tunes = t; },

    get selectedTuneId() { return selectedTuneId; },
    set selectedTuneId(id: string) { selectedTuneId = id; },

    get soundTypeFilter() { return soundTypeFilter; },
    set soundTypeFilter(f: 'all' | 'music-box' | 'normal') { soundTypeFilter = f; },

    get activeMenuTab() { return activeMenuTab; },
    set activeMenuTab(t: 'tunes' | 'designs') { activeMenuTab = t; },

    get tempoMultiplier() { return tempoMultiplier; },
    set tempoMultiplier(v: number) { tempoMultiplier = v; },

    get isTrayCollapsed() { return isTrayCollapsed; },
    set isTrayCollapsed(c: boolean) { isTrayCollapsed = c; },

    get theme() { return theme; },
    set theme(t: 'system' | 'dark' | 'light') { theme = t; },
    get darkMode() { return darkMode; },

    cycleTheme() {
      if (theme === 'system') {
        theme = 'dark';
      } else if (theme === 'dark') {
        theme = 'light';
      } else {
        theme = 'system';
      }
    },

    updateModelColor(modelId: string, color: string) {
      models = models.map(m => {
        if (m.id === modelId) {
          return { ...m, color };
        }
        return m;
      });
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('vinda-custom-model-colors');
          const customColors = stored ? JSON.parse(stored) : {};
          customColors[modelId] = color;
          localStorage.setItem('vinda-custom-model-colors', JSON.stringify(customColors));
        } catch (e) {
          console.error('Failed to save custom model color', e);
        }
      }
    },

    get selectedModel() { return selectedModel; },
    get selectedTune() { return selectedTune; },
    get isSpinning() { return isSpinning; },
  };
}

export type AppState = ReturnType<typeof createAppState>;
