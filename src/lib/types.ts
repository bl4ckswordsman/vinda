export interface ModelEntry {
  id: string;
  file: string;    // filename relative to /static/models/
  label: string;
  color: string;   // hex string
}

export interface SequencedTune {
  id: string;
  label: string;
  notes: string[];
  durations: string[];  // e.g. ["8n"]
  bpm: number;
}

export interface FileTune {
  id: string;
  label: string;
  file: string;   // filename relative to /static/audio/
}

export type TuneEntry = SequencedTune | FileTune;

export function isFileTune(t: TuneEntry): t is FileTune {
  return 'file' in t;
}

export function isSequencedTune(t: TuneEntry): t is SequencedTune {
  return 'notes' in t;
}
