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
  // Spin / rotation
  let velocity = $state(0);
  let isPlaying = $state(false);

  // Sleep / idle
  let isSleeping = $state(false);
  let lastInteraction = $state(Date.now());

  // Model selection
  let models = $state<ModelEntry[]>([DEFAULT_MODEL]);
  let selectedModelId = $state('carousel');

  // Tune selection
  let tunes = $state<TuneEntry[]>([DEFAULT_TUNE]);
  let selectedTuneId = $state('default');

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
    set models(m: ModelEntry[]) { models = m; },

    get selectedModelId() { return selectedModelId; },
    set selectedModelId(id: string) { selectedModelId = id; },

    get tunes() { return tunes; },
    set tunes(t: TuneEntry[]) { tunes = t; },

    get selectedTuneId() { return selectedTuneId; },
    set selectedTuneId(id: string) { selectedTuneId = id; },

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

    get selectedModel() { return selectedModel; },
    get selectedTune() { return selectedTune; },
    get isSpinning() { return isSpinning; },
  };
}

export type AppState = ReturnType<typeof createAppState>;
