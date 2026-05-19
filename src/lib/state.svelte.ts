import type { TuneEntry, ModelEntry } from './types.ts';

const DEFAULT_TUNE: TuneEntry = {
  id: 'default',
  label: 'Für Elise',
  notes: ['E5','D#5','E5','D#5','E5','B4','D5','C5','A4','C4','E4','A4','B4'],
  durations: ['8n'],
  bpm: 80,
};

const DEFAULT_MODEL: ModelEntry = {
  id: 'default',
  file: '',  // empty = use procedural model
  label: 'Classic',
  color: '#b5a4f5',
};

export function createAppState() {
  // Spin / rotation
  let velocity = $state(0);

  // Sleep / idle
  let isSleeping = $state(false);
  let lastInteraction = $state(Date.now());

  // Model selection
  let models = $state<ModelEntry[]>([DEFAULT_MODEL]);
  let selectedModelId = $state('default');

  // Tune selection
  let tunes = $state<TuneEntry[]>([DEFAULT_TUNE]);
  let selectedTuneId = $state('default');

  // Theme
  let darkMode = $state(true);

  // Derived helpers
  const selectedModel = $derived(
    models.find(m => m.id === selectedModelId) ?? DEFAULT_MODEL
  );
  const selectedTune = $derived(
    tunes.find(t => t.id === selectedTuneId) ?? DEFAULT_TUNE
  );
  const isSpinning = $derived(Math.abs(velocity) > 0.01);

  return {
    get velocity() { return velocity; },
    set velocity(v: number) { velocity = v; },

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

    get darkMode() { return darkMode; },
    set darkMode(d: boolean) { darkMode = d; },

    get selectedModel() { return selectedModel; },
    get selectedTune() { return selectedTune; },
    get isSpinning() { return isSpinning; },
  };
}

export type AppState = ReturnType<typeof createAppState>;
