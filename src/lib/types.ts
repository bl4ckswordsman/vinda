export interface ModelEntry {
  id: string;
  file: string;    // filename relative to /static/models/
  label: string;
  color: string;   // hex string
}

export interface BaseTune {
  id: string;
  label: string;
  category?: string;
  group?: string;
  soundType?: 'music-box' | 'normal';
}

export interface SequencedTune extends BaseTune {
  notes: string[];
  durations: string[];  // e.g. ["8n"]
  bpm: number;
}

export interface FileTune extends BaseTune {
  file: string;   // filename relative to /static/audio/
}

export type TuneEntry = SequencedTune | FileTune;

export function isFileTune(t: TuneEntry): t is FileTune {
  return 'file' in t;
}

export function isSequencedTune(t: TuneEntry): t is SequencedTune {
  return 'notes' in t;
}

export function getSoundType(t: TuneEntry): 'music-box' | 'normal' {
  if (t.soundType) return t.soundType;
  return isSequencedTune(t) ? 'music-box' : 'normal';
}

