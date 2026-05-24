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

  private crankNoise: Tone.NoiseSynth | null = null;
  private crankSynth: Tone.Synth | null = null;
  private crankFilter: Tone.Filter | null = null;

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

    // Cache the playing state of the previous tune before stopping it
    const wasPlaying = this.player
      ? (this.player.state === 'started' || this.player.autostart)
      : (this.sequence ? this.sequence.state === 'started' : false);

    this.stop();
    this.currentTune = tune;

    if (isFileTune(tune)) {
      const url = tune.file.startsWith('blob:') || tune.file.startsWith('http')
        ? tune.file
        : `/audio/${tune.file}`;

      this.player = new Tone.Player({
        url,
        loop: true,
        loopStart: 0,
      }).connect(this.reverb ?? Tone.getDestination());
      
      if (wasPlaying) {
        this.player.autostart = true;
      }

      await Tone.loaded();
      if (this.player) {
        this.player.loopEnd = this.player.buffer.duration;
        // If loading finishes and the player hasn't started yet, force start it if we were playing
        if (wasPlaying && this.player.state !== 'started') {
          this.player.start();
        }
      }
    } else {
      this.baseBpm = tune.bpm;
      Tone.getTransport().bpm.value = tune.bpm;
      this._buildSequence(tune);
      if (wasPlaying) {
        this.play();
      }
    }
  }

  private _buildSequence(tune: SequencedTune): void {
    const { notes, durations } = tune;
    let noteIndex = 0;

    this.sequence = new Tone.Sequence<number>(
      (time) => {
        const note = notes.at(noteIndex % notes.length);
        const dur  = durations.at(noteIndex % durations.length) ?? '8n';
        if (note !== undefined) {
          this.synth?.triggerAttackRelease(note, dur, time);
        }
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

  private _initCrankSynth(): void {
    if (this.crankNoise) return;

    // Highpass filter to keep click noise crisp and clean, bypass reverb
    this.crankFilter = new Tone.Filter({
      type: 'highpass',
      frequency: 1000
    }).toDestination();

    this.crankNoise = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: {
        attack: 0.001,
        decay: 0.02,
        sustain: 0,
        release: 0.02
      },
      volume: 8
    }).connect(this.crankFilter);

    // Warm, woody mid-frequency thud representing the gear tooth stop
    this.crankSynth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.001,
        decay: 0.025,
        sustain: 0,
        release: 0.025
      },
      volume: 4
    }).toDestination();
  }

  playCrankClick(): void {
    this._initNodes();
    this._initCrankSynth();

    const time = Tone.now();
    this.crankNoise?.triggerAttackRelease('16n', time);
    this.crankSynth?.triggerAttackRelease('G4', '16n', time);
  }

  dispose(): void {
    this.stop();
    this.synth?.dispose();
    this.reverb?.dispose();
    this.crankNoise?.dispose();
    this.crankSynth?.dispose();
    this.crankFilter?.dispose();
  }
}
