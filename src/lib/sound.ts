"use client";

/**
 * Tiny synthesized sound engine (Web Audio API). No audio files to download.
 * Browsers only allow audio after a user gesture, so call `unlock()` from a click/tap/key handler.
 */

const MUTE_KEY = "atul-sound-muted";

type Voice = OscillatorType;

// A minor → F → C → G, one bar each, at 112 bpm. MIDI note numbers.
const CHORDS = [
  [57, 60, 64], // Am
  [53, 57, 60], // F
  [48, 52, 55], // C
  [55, 59, 62], // G
];
const BASS = [45, 41, 36, 43];
const LEAD = [76, 74, 72, 74, 76, 79, 76, 72, 72, 74, 72, 69, 67, 69, 71, 74];
const BPM = 112;
const STEP = 60 / BPM / 2; // eighth notes

const freq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer = 0;
  private nextTime = 0;
  private step = 0;
  private listeners = new Set<(muted: boolean) => void>();
  muted = false;
  musicOn = false;

  constructor() {
    if (typeof window !== "undefined") {
      try { this.muted = localStorage.getItem(MUTE_KEY) === "1"; } catch {}
    }
  }

  unlock() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.6;
      this.master.connect(this.ctx.destination);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.32;
      this.musicBus.connect(this.master);
      const len = this.ctx.sampleRate * 0.5;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  onMuteChange(fn: (muted: boolean) => void) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch {}
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 0.6, this.ctx.currentTime, 0.05);
    this.listeners.forEach((fn) => fn(muted));
  }

  private tone(f: number, start: number, dur: number, type: Voice, gain: number, dest?: AudioNode, slideTo?: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, start);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g).connect(dest ?? this.master!);
    o.start(start);
    o.stop(start + dur + 0.02);
  }

  private hiss(start: number, dur: number, gain: number, cutoff: number, dest?: AudioNode) {
    const ctx = this.ctx!;
    const s = ctx.createBufferSource();
    s.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = cutoff;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    s.connect(filter).connect(g).connect(dest ?? this.master!);
    s.start(start);
    s.stop(start + dur);
  }

  flap() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone(320, t, 0.12, "square", 0.08, undefined, 640);
    this.hiss(t, 0.08, 0.05, 3000);
  }

  score(combo = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const base = 880 * Math.pow(2, Math.min(combo, 12) / 24);
    this.tone(base, t, 0.09, "triangle", 0.16);
    this.tone(base * 1.5, t + 0.07, 0.16, "triangle", 0.14);
  }

  milestone() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [72, 76, 79, 84].forEach((n, i) => this.tone(freq(n), t + i * 0.07, 0.22, "square", 0.07));
  }

  hit() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone(220, t, 0.45, "sawtooth", 0.14, undefined, 40);
    this.hiss(t, 0.3, 0.25, 400);
  }

  newBest() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [67, 72, 76, 79, 84, 88].forEach((n, i) => this.tone(freq(n), t + 0.35 + i * 0.08, 0.3, "triangle", 0.12));
  }

  click() {
    if (!this.ctx) return;
    this.tone(1200, this.ctx.currentTime, 0.04, "sine", 0.05);
  }

  /** A little "caw" for the 3D raven. */
  caw() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone(620, t, 0.16, "sawtooth", 0.08, undefined, 380);
    this.tone(560, t + 0.2, 0.2, "sawtooth", 0.07, undefined, 300);
  }

  startMusic() {
    if (!this.ctx || this.musicOn) return;
    this.musicOn = true;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.05;
    this.musicBus!.gain.setTargetAtTime(0.32, this.ctx.currentTime, 0.1);
    const schedule = () => {
      if (!this.ctx || !this.musicOn) return;
      while (this.nextTime < this.ctx.currentTime + 0.2) {
        this.playStep(this.step, this.nextTime);
        this.nextTime += STEP;
        this.step++;
      }
      this.timer = window.setTimeout(schedule, 50);
    };
    schedule();
  }

  stopMusic() {
    this.musicOn = false;
    window.clearTimeout(this.timer);
    if (this.ctx && this.musicBus) this.musicBus.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.15);
  }

  private playStep(step: number, t: number) {
    const bus = this.musicBus!;
    const bar = Math.floor(step / 8) % 4;
    const inBar = step % 8;
    // bass on beats
    if (inBar % 2 === 0) this.tone(freq(BASS[bar]), t, STEP * 1.7, "triangle", 0.35, bus);
    // arpeggio
    const chord = CHORDS[bar];
    this.tone(freq(chord[inBar % 3] + 12), t, STEP * 0.9, "square", 0.05, bus);
    // lead every other loop
    if (Math.floor(step / 32) % 2 === 1 && inBar % 2 === 0) {
      this.tone(freq(LEAD[(step / 2) % 16 | 0]), t, STEP * 1.8, "triangle", 0.12, bus);
    }
    // hats + kick
    this.hiss(t, 0.03, inBar % 2 ? 0.05 : 0.09, 7000, bus);
    if (inBar === 0 || inBar === 4) this.tone(110, t, 0.18, "sine", 0.5, bus, 40);
  }
}

let engine: SoundEngine | null = null;
export function sound() {
  if (!engine) engine = new SoundEngine();
  return engine;
}
