import * as Tone from 'tone';
import type { TuneEntry, SequencedTune } from './types';
import { isFileTune } from './types';

const BELL_SYNTH_OPTIONS: Partial<Tone.SynthOptions> = {
  oscillator: { type: 'triangle' } as Tone.OmniOscillatorOptions,
  envelope: {
    attack: 0.002,
    decay: 0.4,
    sustain: 0.0,
    release: 1.6,
  } as any,
  volume: -8,
};

export class AudioEngine {
  private synth: Tone.Synth | null = null;
  private sequence: Tone.Sequence<number> | null = null;
  private player: Tone.Player | null = null;
  private reverb: Tone.Reverb | null = null;

  private currentTune: TuneEntry | null = null;
  private baseBpm = 80;
  private userInteracted = false;

  constructor() {}

  private _initNodes(): void {
    if (this.reverb) return; // already initialized
    this.reverb = new Tone.Reverb({ decay: 2.5, wet: 0.35 }).toDestination();
    this.synth  = new Tone.Synth(BELL_SYNTH_OPTIONS).connect(this.reverb);
  }

  /**
   * MUST be called directly from a user gesture handler (pointerdown / click).
   * Browser autoplay policy blocks audio until a real user gesture.
   */
  async ensureStarted(): Promise<void> {
    this._initNodes();
    if (this.userInteracted) return;
    await Tone.start();
    this.userInteracted = true;
  }

  async loadTune(tune: TuneEntry): Promise<void> {
    this._initNodes();
    this.stop();
    this.currentTune = tune;

    if (isFileTune(tune)) {
      this.player = new Tone.Player({
        url: `/audio/${tune.file}`,
        loop: true,
        loopStart: 0,
      }).connect(this.reverb ?? Tone.getDestination());
      
      await Tone.loaded();
      if (this.player) {
        this.player.loopEnd = this.player.buffer.duration;
      }
    } else {
      this.baseBpm = tune.bpm;
      Tone.getTransport().bpm.value = tune.bpm;
      this._buildSequence(tune);
    }
  }

  private _buildSequence(tune: SequencedTune): void {
    const { notes, durations } = tune;
    let noteIndex = 0;

    this.sequence = new Tone.Sequence<number>(
      (time) => {
        const note = notes[noteIndex % notes.length];
        const dur  = durations[noteIndex % durations.length] ?? '8n';
        this.synth?.triggerAttackRelease(note, dur, time);
        noteIndex++;
      },
      notes.map((_, i) => i),
      '8n'
    );
  }

  play(): void {
    if (!this.userInteracted) return;

    if (this.player) {
      if (this.player.loaded) {
        if (this.player.state !== 'started') this.player.start();
      } else {
        this.player.autostart = true;
      }
    } else if (this.sequence) {
      if (this.sequence.state !== 'started') this.sequence.start(0);
      if (Tone.getTransport().state !== 'started') Tone.getTransport().start();
    }
  }

  stop(): void {
    this.sequence?.stop();
    this.sequence?.dispose();
    this.sequence = null;
    this.player?.stop();
    this.player?.dispose();
    this.player = null;
    if (Tone.getTransport().state !== 'stopped') Tone.getTransport().stop();
  }

  /** Called every animation frame with the current angular velocity (rad/s). */
  setVelocity(velocity: number): void {
    const abs = Math.abs(velocity);
    const spinning = abs > 0.05;

    if (spinning) {
      // Scale BPM linearly: 1 rad/s = baseBpm, cap at 3×
      const targetBpm = Math.min(this.baseBpm * Math.max(abs, 0.3), this.baseBpm * 3);
      Tone.getTransport().bpm.rampTo(targetBpm, 0.15);

      if (this.player) {
        this.player.playbackRate = Math.max(abs, 0.3);
      }

      this.play();
    } else {
      this.pause();
    }
  }

  pause(): void {
    if (this.player) {
      this.player.autostart = false;
      if (this.player.state === 'started') this.player.stop();
    } else {
      if (Tone.getTransport().state === 'started') Tone.getTransport().pause();
    }
  }

  resume(): void {
    if (!this.userInteracted) return;
    this.play();
  }

  /** Sleep mode: fade master volume to silence over `duration` seconds */
  fadeOut(duration = 1.5): void {
    Tone.getDestination().volume.rampTo(-Infinity, duration);
  }

  /** Wake: restore master volume */
  fadeIn(duration = 0.5): void {
    Tone.getDestination().volume.rampTo(0, duration);
  }

  dispose(): void {
    this.stop();
    this.synth?.dispose();
    this.reverb?.dispose();
  }
}
