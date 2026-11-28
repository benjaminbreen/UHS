import {
  compose,
  periods,
  seasons,
  stems,
  themes,
  type Arrangement,
  type Era,
  type Score,
  type Stem,
  type Voice as SynthVoice,
} from "./score";
import type { CultureId } from "../content/history/types";
import {
  anywhereThemes,
  culturalMusic,
  MusicRotation,
} from "./cultural-themes";
import { createMix, scheduleNote, prepareScore, synthesize, type MixBus } from "./synth";
import { bodily, events, interfaceClick, noise, playSound, ring, tone, type EventId, type InterfaceKind, type Sound } from "./sfx";
import { applyTuning, tuning } from "./sfx-tuning";
import { Ambience, Room, UndergroundBed, silence, type AmbienceMix, type UndergroundLevels } from "./ambience";
import { sung, voiceGain, type Voice } from "./wildlife";
import { interiorThemes, type InteriorMusic } from "./interior-themes";
import { situationTheme, type Situation, type ThreatMusic } from "./situation-themes";
import { smallMemoryDevice } from "../runtime/device";

export interface AudioState {
  loading: boolean;
  playing: boolean;
  beat: number;
  arrangement: Arrangement;
  followWorld: boolean;
  /** Whether the score plays at all. Off on a phone until chosen: each
   * piece is tens of megabytes of synthesised notes. */
  music: boolean;
  volume: number;
  sfxVolume: number;
  muted: boolean;
  levels: Record<Stem, number>;
  error: string;
}
interface Run {
  mix: MixBus;
  gain: GainNode;
  sources: Set<AudioBufferSourceNode>;
  start: number;
  offset: number;
  cursor: number;
  score: Score;
}
const PREF_KEY = "uhs-audio-v1";
const eras: Era[] = ["pastoral", "chamber", "electronic"];
// The original themes' lead line tires quickly on repeat; the game mix leaves it out.
const defaultLevels: Record<Stem, number> = {
  melody: 0,
  harmony: 1,
  bass: 1,
  percussion: 1,
};
// Calm pacing: a wait before the first piece, silence between pieces, long fades.
const FIRST_DELAY = 12000;
const GAP_MIN = 20000,
  GAP_SPREAD = 25000;
const SLOW_FADE_IN = 8;
const SLOW_FADE_OUT = 4;
const pick = <T>(list: readonly T[]) =>
  list[Math.floor(Math.random() * list.length)];
const timed = anywhereThemes.filter((t) => t.hours),
  shared = [...themes, ...anywhereThemes.filter((t) => !t.hours)];
function shuffled(themeId = pick(themes).id): Arrangement {
  return {
    themeId,
    season: pick(seasons),
    period: timed.some((t) => t.id === themeId) ? "day" : pick(periods),
    era: pick(eras),
  };
}
export type CaveCue = "drip" | "bats" | "take" | "creak" | "settle";
export type SewerCue = "lid" | "lid-down" | "ladder" | "splash" | "rats" | "drip" | "take" | "rush" | "knock" | "steam" | "rumble" | "car" | "gate" | "pick" | "tub" | "creak" | "shot" | "crack" | "fall" | "runaway" | "blast";
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const times = (n: number, gap: number, make: (at: number, i: number) => Sound): Sound =>
  Array.from({ length: n }, (_, i) => make(i * gap * rand(0.85, 1.15), i)).flat();
/** The tunnel handing a sound back, quieter each time. */
const echoes = (sound: Sound, delay: number, count: number, fall: number): Sound =>
  Array.from({ length: count + 1 }, (_, i) => sound.map((l) => ({ ...l, at: l.at + i * delay, gain: l.gain * fall ** i }))).flat();
const bubbles = (from: number, span: number, n: number, low: number, gain: number) =>
  times(n, span / n, (at) => {
    const f = low * rand(1, 2.5);
    return [tone(from + at, rand(0.03, 0.07), gain * rand(0.4, 1), f, { to: f * 2, attack: 0.006 })];
  });
/** Cast iron, brick and water. Gains sit near the door and footstep cues. */
const sewerSounds: Record<Exclude<SewerCue, "take">, () => Sound> = {
  lid: () => [
    // The pick bar finds the slot and levers.
    noise(0, 0.12, 0.035, 3200, { q: 4 }),
    ...ring(0.02, 1900, 0.25, 0.03),
    tone(0.2, 0.12, 0.14, 120, { to: 80 }),
    noise(0.2, 0.04, 0.05, 1500, { q: 1.5 }),
    // Dragged aside over the frame: iron grinding on iron and grit.
    noise(0.35, 0.95, 0.03, 450, { to: 380, q: 3, attack: 0.12 }),
    tone(0.35, 0.95, 0.018, 92, { to: 84, wave: "sawtooth", attack: 0.12 }),
    tone(0.5, 0.6, 0.006, 1350, { to: 1240, wave: "triangle", attack: 0.1 }),
    ...times(24, 0.038, (at) => [noise(0.35 + at, 0.04, 0.025, rand(700, 1900), { q: 5 })]),
    // Set down on the cobbles.
    tone(1.32, 0.2, 0.16, 90, { to: 60 }),
    noise(1.32, 0.03, 0.05, 2200, { q: 1.5 }),
    ...ring(1.32, 310, 1.4, 0.08),
  ],
  "lid-down": () => [
    tone(0, 0.18, 0.22, 110, { to: 62 }),
    noise(0, 0.03, 0.08, 2400, { q: 1.5 }),
    ...ring(0, 420, 0.9, 0.09),
    // It rocks once in the frame before it seats.
    noise(0.11, 0.02, 0.04, 2600, { q: 2 }),
    ...ring(0.11, 430, 0.5, 0.035),
  ],
  ladder: () =>
    times(Math.round(rand(3, 4)), 0.34, (at) => echoes([
      ...ring(at, rand(720, 820), 0.35, 0.035),
      noise(at, 0.03, 0.04, 1800, { q: 2 }),
      tone(at, 0.06, 0.08, 170, { to: 120 }),
    ], 0.11, 2, 0.3)),
  splash: () => [
    tone(0, 0.08, 0.07, 140, { to: 90 }),
    noise(0, 0.14, 0.06, 900, { to: 500, q: 0.8, attack: 0.005 }),
    noise(0.01, 0.28, 0.025, 3000, { q: 0.7, attack: 0.02 }),
    ...bubbles(0.04, 0.22, 5, 500, 0.04),
  ],
  rats: () => [
    ...times(Math.round(rand(8, 12)), 0.035, (at) => [noise(at, 0.012, 0.022, 4000, { q: 2 })]),
    ...times(Math.round(rand(2, 3)), 0.17, (at) => {
      const f = rand(3200, 4300);
      return [tone(0.08 + at, rand(0.05, 0.09), 0.025, f, { to: f * rand(1.05, 1.2), wave: "triangle", attack: 0.008 })];
    }),
  ],
  drip: () => {
    const f = rand(800, 1600);
    return echoes([tone(0, 0.1, 0.05, f * 1.5, { to: f, attack: 0.002 }), tone(0.025, 0.16, 0.018, f * 2.2, { to: f * 2.6 })], 0.19, 2, 0.35);
  },
  rush: () => [
    noise(0, 2.8, 0.06, 300, { to: 1400, filter: "lowpass", attack: 1.3 }),
    noise(0.3, 2.4, 0.025, 1200, { to: 2600, q: 0.6, attack: 1 }),
    ...bubbles(0.6, 1.8, 30, 260, 0.03),
  ],
  knock: () => {
    const hit = (at: number, g: number) => [
      ...ring(at, rand(210, 250), 1.4, 0.04 * g),
      tone(at, 0.12, 0.06 * g, 95, { to: 70 }),
      noise(at, 0.02, 0.02 * g, 1400, { q: 1.5 }),
    ];
    return echoes(Math.random() < 0.5 ? hit(0, 1) : [...hit(0, 1), ...hit(0.22, 0.7)], 0.45, 3, 0.4);
  },
  steam: () => [
    noise(0, 1.6, 0.02, 5200, { filter: "highpass", attack: 0.06 }),
    noise(0, 1.5, 0.014, 2400, { q: 0.8, attack: 0.2 }),
    noise(0.02, 0.05, 0.03, 1200, { q: 1 }),
  ],
  rumble: () => [
    noise(0, 4.5, 0.09, 70, { to: 140, filter: "lowpass", attack: 1.8 }),
    tone(0, 4.5, 0.07, 38, { to: 46, attack: 1.8 }),
    tone(0, 4.5, 0.025, 57, { to: 62, wave: "triangle", attack: 2 }),
    // Grit shaken loose from the vault.
    ...times(12, 0.12, (at) => [noise(1.4 + at, 0.015, 0.008, rand(2500, 4000), { q: 2 })]),
  ],
  car: () => [
    noise(0, 1.3, 0.02, 120, { filter: "lowpass", attack: 0.4 }),
    ...[0.35, 0.72].flatMap((at) => [
      tone(at, 0.14, 0.18, 95, { to: 60 }),
      noise(at, 0.035, 0.05, 1700, { q: 1.5 }),
      ...ring(at + 0.01, rand(340, 380), 0.45, 0.04),
      // The loose cover rocks back.
      tone(at + 0.07, 0.08, 0.08, 130, { to: 100 }),
      noise(at + 0.07, 0.02, 0.03, 2200, { q: 2 }),
    ]),
  ],
  gate: () => [
    ...times(10, 0.13, (at) => [...ring(at, 1500, 0.08, 0.012), noise(at, 0.01, 0.02, 3500, { q: 3 })]),
    noise(0.4, 1.8, 0.03, 380, { to: 300, q: 3, attack: 0.3 }),
    tone(0.4, 1.8, 0.016, 70, { to: 64, wave: "sawtooth", attack: 0.3 }),
    tone(0.6, 1.2, 0.006, 1100, { to: 1040, wave: "triangle", attack: 0.3 }),
    tone(2.2, 0.16, 0.14, 90, { to: 60 }),
    ...ring(2.2, 260, 1, 0.06),
  ],
  // Down a mine: steel on rock, iron wheels on rails, timber taking weight, a shot fired far off.
  pick: () => {
    const f = rand(1700, 2600);
    return echoes([noise(0, 0.025, 0.06, f, { q: 3 }), tone(0, 0.08, 0.035, f * 1.4, { to: f * 1.3, wave: "triangle", attack: 0.002 }), tone(0, 0.06, 0.05, 140, { to: 90 }),
      ...times(Math.round(rand(1, 4)), 0.03, (at) => [noise(0.05 + at, 0.015, 0.012, rand(2500, 4500), { q: 2 })])], 0.17, 2, 0.3);
  },
  tub: () => [
    noise(0, 2.6, 0.05, 160, { to: 220, filter: "lowpass", attack: 0.6 }),
    tone(0, 2.6, 0.02, 48, { to: 54, wave: "sawtooth", attack: 0.6 }),
    // The wheels over the rail joints.
    ...times(8, 0.3, (at) => [...ring(0.4 + at, rand(600, 700), 0.2, 0.014), noise(0.4 + at, 0.02, 0.03, 1300, { q: 1.5 })]),
    ...ring(2.9, 380, 0.7, 0.035),
  ],
  creak: () => {
    const f = rand(160, 260);
    return echoes([tone(0, rand(0.6, 1.2), 0.025, f, { to: f * rand(1.15, 1.4), wave: "sawtooth", attack: 0.2 }), noise(0.1, 0.8, 0.012, 900, { q: 4, attack: 0.3 }),
      ...times(Math.round(rand(2, 5)), 0.09, (at) => [noise(0.9 + at, 0.02, 0.02, rand(2200, 4000), { q: 2 })])], 0.29, 2, 0.3);
  },
  // A mine accident: the roof letting go, coming down, a tub loose on the rails, gas firing.
  crack: () => echoes([
    noise(0, 0.03, 0.12, 2600, { q: 0.9 }),
    tone(0, 0.09, 0.08, 320, { to: 120, wave: "triangle", attack: 0.002 }),
    ...times(Math.round(rand(4, 8)), 0.05, (at) => [noise(0.08 + at, 0.02, 0.025, rand(2500, 4500), { q: 2 })]),
  ], 0.21, 3, 0.4),
  fall: () => [
    noise(0, 2.2, 0.22, 90, { to: 50, filter: "lowpass", attack: 0.02 }),
    tone(0, 1.4, 0.14, 52, { to: 34, attack: 0.01 }),
    noise(0, 0.6, 0.08, 900, { to: 300, q: 0.6, attack: 0.01 }),
    ...times(26, 0.06, (at) => [noise(at, 0.05, 0.05 * (1 - at / 2), rand(300, 1400), { q: 1.2 })]),
    ...times(14, 0.12, (at) => [noise(0.8 + at, 0.02, 0.015, rand(2500, 4500), { q: 2 })]),
  ],
  runaway: () => [
    noise(0, 3.2, 0.09, 120, { to: 320, filter: "lowpass", attack: 0.8 }),
    tone(0, 3.2, 0.04, 44, { to: 70, wave: "sawtooth", attack: 0.8 }),
    // The rail joints, closer together as it gathers speed.
    ...times(18, 0.16, (at, i) => [...ring(0.2 + at * (1 - i / 40), rand(600, 720), 0.15, 0.02), noise(0.2 + at * (1 - i / 40), 0.02, 0.04, 1400, { q: 1.5 })]),
  ],
  blast: () => [
    tone(0, 2.4, 0.22, 40, { to: 24, attack: 0.01 }),
    noise(0, 3.4, 0.16, 70, { to: 40, filter: "lowpass", attack: 0.02 }),
    // The air rushing back after it.
    noise(0.5, 2.6, 0.06, 400, { to: 1600, q: 0.5, attack: 0.6 }),
    ...times(24, 0.1, (at) => [noise(0.4 + at, 0.015, 0.01, rand(2500, 4500), { q: 2 })]),
  ],
  shot: () => [
    tone(0, 1.6, 0.16, 46, { to: 30, attack: 0.01 }),
    noise(0, 2.4, 0.09, 90, { to: 60, filter: "lowpass", attack: 0.02 }),
    noise(0, 0.08, 0.03, 700, { q: 0.8 }),
    ...times(16, 0.1, (at) => [noise(0.6 + at, 0.015, 0.008, rand(2500, 4500), { q: 2 })]),
  ],
};
/** Minimum ms between plays, for cues long or loud enough to pile up. */
const caveSounds: Record<Exclude<CaveCue, "take">, () => Sound> = {
  drip: () => {
    const f = rand(900, 1800);
    return echoes([tone(0, 0.11, 0.05, f * 1.5, { to: f, attack: 0.002 }), tone(0.03, 0.2, 0.02, f * 2.2, { to: f * 2.6 })], 0.23, 2, 0.3);
  },
  bats: () => Array.from({ length: 22 }, (_, i) => noise(i * 0.05 + Math.random() * 0.03, 0.035, 0.07 * (1 - i / 26), 3200 + Math.random() * 2600, { q: 3 })),
  // Ice under strain: a low groan bending down, then a crack off the walls.
  creak: () => {
    const f = rand(70, 130);
    return echoes([tone(0, rand(0.5, 1.1), 0.03, f, { to: f * rand(0.7, 0.85), wave: "triangle", attack: 0.15 }), noise(rand(0.3, 0.6), 0.04, 0.05, 1800, { q: 1.2 })], 0.31, 2, 0.35);
  },
  settle: () => echoes(times(Math.round(rand(2, 5)), 0.07, (at) => [noise(at, 0.02, 0.03, rand(2000, 4200), { q: 2 })]), 0.27, 2, 0.3),
};
const sewerGaps: Partial<Record<SewerCue, number>> = { crack: 250, fall: 1500, runaway: 4000, blast: 6000, pick: 400, tub: 3500, creak: 2000, shot: 8000, lid: 1200, "lid-down": 600, ladder: 800, rats: 1500, rush: 4000, knock: 1200, steam: 2500, rumble: 6000, car: 900, gate: 3000 };

/** The director the game is running under. The scene plays tool and footfall
 * sounds through it without threading a reference through every layer. */
let active: AudioDirector | undefined;
export function gameAudio() {
  return active;
}
let bare: AudioContext | undefined;
/** An interface sound from anywhere, the title screens included, where no
 * director is running yet. */
export function interfaceSound(kind: InterfaceKind) {
  if (active) return void active.interfaceSound(kind);
  try {
    const prefs = JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
    if (prefs.muted || prefs.sfxVolume === 0) return;
    const ctx = (bare ??= new AudioContext()),
      out = ctx.createGain();
    out.gain.value = typeof prefs.sfxVolume === "number" ? prefs.sfxVolume : 0.6;
    out.connect(ctx.destination);
    void ctx.resume();
    playSound(ctx, out, interfaceClick(kind), ctx.currentTime + 0.005);
  } catch {
    /* Optional. */
  }
}
export class AudioDirector {
  private ctx?: AudioContext;
  private master?: GainNode;
  private music?: GainNode;
  private sfx?: GainNode;
  private run?: Run;
  private timer?: ReturnType<typeof setInterval>;
  private pending?: ReturnType<typeof setTimeout>;
  private ambience?: Ambience;
  private haze?: BiquadFilterNode;
  private dazed = 0;
  private room?: Room;
  private duck?: GainNode;
  private scene: AmbienceMix = { ...silence };
  private listeners = new Set<() => void>();
  private generation = 0;
  private resumeOnVisible = false;
  private disposed = false;
  private lastSfx = new Map<string, number>();
  private under?: UndergroundLevels;
  private underKey = "";
  private underBed?: UndergroundBed;
  private underEnd?: ReturnType<typeof setTimeout>;
  private setting = "";
  /** The building's piece; null for a room kept quiet, undefined outdoors. */
  private inside?: InteriorMusic | null;
  /** A situation's piece holding the stage over place and room. */
  private held?: string;
  private heldLoops = false;
  private situation?: Situation;
  private threat?: ThreatMusic;
  private dangerQueued = false;
  private threatRelease?: ReturnType<typeof setTimeout>;
  private workIdle?: ReturnType<typeof setTimeout>;
  private place?: { culture?: CultureId; year?: number };
  private resolutions = 0;
  private rotation = new MusicRotation([], shared);
  private clock = 0;
  private playful = false;
  /** World hour (absolute) at which each timed piece last played. */
  private timedAt = new Map<string, number>();
  private state: AudioState = {
    loading: false,
    playing: false,
    beat: 0,
    arrangement: shuffled(),
    followWorld: true,
    music: !smallMemoryDevice(),
    volume: 0.4,
    sfxVolume: 0.6,
    muted: false,
    levels: { ...defaultLevels },
    error: "",
  };
  constructor() {
    active = this;
    try {
      const p = JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
      for (const key of ["volume", "sfxVolume"] as const)
        if (typeof p[key] === "number" && Number.isFinite(p[key]))
          this.state[key] = Math.max(0, Math.min(1, p[key]));
      if (typeof p.muted === "boolean") this.state.muted = p.muted;
      if (typeof p.music === "boolean") this.state.music = p.music;
    } catch {
      /* Sound still works when local preferences are unavailable. */
    }
    document.addEventListener("visibilitychange", this.visibility);
    // Browsers only allow audio after a gesture; start the score on the first one.
    for (const type of ["pointerdown", "keydown"])
      window.addEventListener(type, this.autoplay, { capture: true });
  }
  private autoplay = () => {
    for (const type of ["pointerdown", "keydown"])
      window.removeEventListener(type, this.autoplay, { capture: true });
    if (this.disposed) return;
    // Weather is heard at once; the score waits.
    this.unlock().catch(() => {});
    this.later(FIRST_DELAY, () => this.play(SLOW_FADE_IN));
  };
  /** Runs `fn` after `ms` unless playback is touched in the meantime. */
  private later(ms: number, fn: () => void) {
    clearTimeout(this.pending);
    const generation = this.generation;
    this.pending = setTimeout(() => {
      if (generation !== this.generation || this.disposed) return;
      if (document.hidden) this.resumeOnVisible = true;
      else fn();
    }, ms);
  }
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  getSnapshot = () => this.state;
  get score() {
    return compose(this.state.arrangement);
  }
  private patch(patch: Partial<AudioState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }
  private visibility = () => {
    if (document.hidden) {
      this.resumeOnVisible = this.state.playing || this.state.loading;
      if (this.resumeOnVisible) this.pause();
    } else if (this.resumeOnVisible) {
      this.resumeOnVisible = false;
      void this.play();
    }
  };
  private async unlock() {
    if (this.disposed) throw Error("Audio session has closed.");
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.state.muted ? 0 : 0.72;
      const limiter = this.ctx.createDynamicsCompressor();
      limiter.threshold.value = -6;
      limiter.knee.value = 6;
      limiter.ratio.value = 12;
      this.haze = this.ctx.createBiquadFilter();
      this.haze.frequency.value = 20000;
      this.master.connect(this.haze).connect(limiter).connect(this.ctx.destination);
      this.music = this.ctx.createGain();
      this.music.gain.value = this.state.volume;
      this.duck = this.ctx.createGain();
      this.duck.gain.value = this.heard(this.scene).music;
      this.music.connect(this.duck).connect(this.master);
      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = this.state.sfxVolume;
      this.sfx.connect(this.master);
      this.room = new Room(this.ctx, this.sfx);
      this.room.set(this.heard(this.scene));
      this.ambience = new Ambience(this.ctx, this.sfx, true, this.room.input(0));
      this.ambience.set(this.heard(this.scene));
      this.syncUnder();
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
    if (this.disposed) throw Error("Audio session has closed.");
    return this.ctx;
  }
  async play(fadeIn = 0.8) {
    clearTimeout(this.pending);
    if (!this.state.music || this.state.playing || this.state.loading) return;
    if (this.dangerQueued && !this.held && this.state.followWorld) {
      this.dangerQueued = false;
      this.situation = "danger";
      this.held = situationTheme("danger", this.place?.culture, this.place?.year);
      this.heldLoops = false;
      this.patch({ arrangement: { ...this.state.arrangement, themeId: this.held, period: "day" }, beat: 0 });
    }
    const generation = ++this.generation;
    this.patch({ loading: true, error: "" });
    try {
      const ctx = await this.unlock();
      await prepareScore(
        ctx,
        this.score,
        () => generation === this.generation && !this.disposed,
      );
      if (generation !== this.generation || this.state.playing) return;
      this.patch({ playing: true, loading: false, error: "" });
      this.begin(this.state.beat, fadeIn);
    } catch (error) {
      if (!this.disposed)
        this.patch({
          playing: false,
          loading: false,
          error: `Audio could not start: ${error instanceof Error ? error.message : String(error)}`,
        });
    }
  }
  private begin(offset = 0, fadeIn = 0.8) {
    this.retire();
    const ctx = this.ctx!,
      score = this.score;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + fadeIn);
    gain.connect(this.music!);
    const { levels } = this.state;
    // Only the five original themes tire on repeat; the place pieces are written around their lead.
    const lead = themes.some((t) => t.id === score.theme.id)
      ? levels
      : { ...levels, melody: Math.max(levels.melody, 1) };
    const mix = createMix(ctx, gain, score.bpm, lead, score.reverb);
    this.run = {
      mix,
      gain,
      sources: new Set(),
      score,
      start: ctx.currentTime + 0.06,
      offset,
      cursor: score.notes.findIndex((n) => n.beat >= offset),
    };
    if (this.run.cursor < 0) this.run.cursor = score.notes.length;
    this.timer = setInterval(() => this.tick(), 40);
    this.tick();
  }
  private tick() {
    const run = this.run,
      ctx = this.ctx;
    if (!run || !ctx) return;
    const secondsPerBeat = 60 / run.score.bpm;
    const beat = Math.max(
      run.offset,
      (ctx.currentTime - run.start) / secondsPerBeat + run.offset,
    );
    if (beat >= run.score.beats) {
      if (this.situation === "danger" && this.state.followWorld) {
        this.setSituation(undefined);
        return;
      }
      if (this.dangerQueued && !this.held && this.state.followWorld) {
        this.dangerQueued = false;
        this.setSituation("danger");
        return;
      }
      if (this.held && this.heldLoops) {
        this.patch({ beat: 0 });
        this.begin(0, 0.04);
        return;
      }
      if (this.held) {
        this.retire(false, SLOW_FADE_OUT);
        this.patch({ playing: false, beat: 0 });
        return;
      }
      if (this.state.followWorld && this.inside === undefined) {
        this.retire(false, SLOW_FADE_OUT);
        this.patch({ playing: false, beat: 0 });
        this.later(GAP_MIN + Math.random() * GAP_SPREAD, () => {
          this.configure(shuffled(
            this.nextTheme(this.state.arrangement.themeId),
          ));
          void this.play(SLOW_FADE_IN);
        });
        return;
      } else this.patch({ beat: 0 });
      this.begin();
      return;
    }
    while (run.cursor < run.score.notes.length) {
      const note = run.score.notes[run.cursor];
      const at = run.start + (note.beat - run.offset) * secondsPerBeat;
      if (at > ctx.currentTime + 0.2) break;
      // On an interrupted main thread, skip stale attacks instead of playing a burst.
      if (at >= ctx.currentTime - 0.04) {
        const source = scheduleNote(
          ctx,
          run.mix.stems[note.stem],
          note,
          Math.max(ctx.currentTime, at),
          secondsPerBeat,
        );
        run.sources.add(source);
        source.addEventListener("ended", () => run.sources.delete(source));
      }
      run.cursor++;
    }
    this.patch({ beat });
  }
  private retire(immediate = false, fadeOut = 0.8) {
    clearInterval(this.timer);
    this.timer = undefined;
    const run = this.run;
    this.run = undefined;
    if (!run || !this.ctx) return;
    const now = this.ctx.currentTime,
      fade = immediate ? 0.025 : fadeOut;
    run.gain.gain.cancelAndHoldAtTime(now);
    run.gain.gain.linearRampToValueAtTime(0, now + fade);
    for (const source of run.sources) {
      try {
        source.stop(now + fade + 0.02);
      } catch {
        /* Already ended. */
      }
    }
    setTimeout(
      () => {
        run.mix.disconnect();
        run.gain.disconnect();
      },
      (fade + 0.1) * 1000,
    );
  }
  pause() {
    this.generation++;
    clearTimeout(this.pending);
    this.retire(true);
    this.patch({ playing: false, loading: false });
  }
  stop() {
    this.resumeOnVisible = false;
    this.pause();
    this.patch({ beat: 0 });
  }
  configure(patch: Partial<Arrangement>) {
    const restart = this.state.playing || this.state.loading;
    this.generation++;
    if (restart) this.retire();
    this.patch({
      arrangement: { ...this.state.arrangement, ...patch },
      beat: 0,
      playing: false,
      loading: false,
    });
    if (restart) void this.play();
  }
  setSetting(
    culture: CultureId | undefined,
    year: number | undefined,
    location?: { lon: number; lat: number },
  ) {
    const key = `${culture}:${year}:${location?.lon}:${location?.lat}`;
    if (key === this.setting) return;
    const firstSetting = !this.setting,
      before = this.place;
    this.setting = key;
    this.place = { culture, year };
    // Years pass within a life without a cue; no life jumps sixty at once, so more is time travel.
    const slipped = Math.abs((before?.year ?? 0) - (year ?? 0)) > 60;
    if (!firstSetting && slipped) {
      void this.cue(situationTheme("timeslip", culture, year));
      void this.sound(bodily.arrive, "arrive");
    }
    const direct = culture && year !== undefined
      ? culturalMusic(culture, year, location).direct
      : [];
    this.rotation = new MusicRotation(direct, shared);
    // Setting refreshes affect the next piece, not the one already underway.
    if (firstSetting && this.state.followWorld && this.inside === undefined &&
      !this.state.playing && !this.state.loading)
      this.configure({ themeId: direct.length ? this.rotation.next() : this.nextTheme() });
  }
  setClock(seconds: number, playful: boolean) {
    this.clock = seconds;
    this.playful = playful;
  }
  /** Exhaust dated regional music first, then mix eligible hour-of-day pieces randomly with shared themes. */
  private nextTheme(previous?: string) {
    if (this.rotation.hasLocal()) return this.rotation.next(previous);
    const hours = this.clock / 3600,
      hour = hours % 24;
    const due = timed.filter(
      (t) =>
        (!t.playful || this.playful) &&
        hour >= t.hours![0] &&
        hour < t.hours![1] &&
        hours - (this.timedAt.get(t.id) ?? -Infinity) > 12,
    );
    if (due.length && Math.random() < due.length / (due.length + shared.length)) {
      const chosen = pick(due);
      this.timedAt.set(chosen.id, hours);
      this.state = { ...this.state, arrangement: { ...this.state.arrangement, period: "day" } };
      return chosen.id;
    }
    return this.rotation.next(previous);
  }
  /** Crossing a threshold swaps the score at once, as an RPG does at an inn door. */
  setInterior(music: InteriorMusic | null | undefined) {
    if (music === this.inside) return;
    this.inside = music;
    if (!this.state.followWorld || this.held) return;
    this.generation++;
    clearTimeout(this.pending);
    this.retire(false, 1.5);
    this.patch({ playing: false, loading: false, beat: 0 });
    if (music === null) return;
    const themeId = music
      ? interiorThemes[music].id
      : this.nextTheme(this.state.arrangement.themeId);
    this.patch({ arrangement: { ...this.state.arrangement, themeId } });
    if (this.ctx) void this.play(1.5);
  }
  plotResolution() {
    return this.cue(situationTheme("arrival", this.place?.culture, this.place?.year, this.resolutions++));
  }
  /** A short piece over whatever is playing, which steps back for it. */
  async cue(themeId: string) {
    const ctx = this.ctx;
    if (!ctx || this.disposed || this.held || !this.state.followWorld || !this.state.music) return;
    const score = compose({ ...this.state.arrangement, themeId, period: "day" });
    await prepareScore(ctx, score, () => !this.disposed);
    if (this.disposed || this.held) return;
    const secondsPerBeat = 60 / score.bpm,
      seconds = score.beats * secondsPerBeat,
      now = ctx.currentTime + 0.05;
    const under = this.run?.gain.gain;
    if (under) {
      under.cancelAndHoldAtTime(now);
      under.linearRampToValueAtTime(0.25, now + 0.6);
      under.setValueAtTime(0.25, now + seconds);
      under.linearRampToValueAtTime(1, now + seconds + 3);
    }
    const mix = createMix(ctx, this.music!, score.bpm, { melody: 1, harmony: 1, bass: 1, percussion: 1 }, score.reverb);
    for (const note of score.notes)
      scheduleNote(ctx, mix.stems[note.stem], note, now + note.beat * secondsPerBeat, secondsPerBeat);
    setTimeout(() => mix.disconnect(), (seconds + (score.reverb?.[1] ?? 2.6) + 1) * 1000);
  }
  /** F held at a work station starts the work dance. It runs on between
   * stages and stops when the day's work is done or the player leaves it. */
  work(state: "hold" | "done") {
    const dance = situationTheme("work", this.place?.culture, this.place?.year);
    if (this.held && this.held !== dance) return;
    clearTimeout(this.workIdle);
    if (state === "hold") {
      this.setSituation("work");
      this.workIdle = setTimeout(() => this.held === dance && this.setSituation(undefined), 30000);
    } else if (this.held) {
      this.setSituation(undefined);
      void this.cue(situationTheme("workdone", this.place?.culture, this.place?.year));
    }
  }
  setThreat(threat: ThreatMusic) {
    if (this.situation === "passing" || this.disposed) return;
    if (threat === this.threat) return;
    this.threat = threat;
    clearTimeout(this.threatRelease);
    const current = this.situation;
    if (threat === "danger" && current !== "danger") this.dangerQueued = true;
    if (threat === "combat") {
      if (current === "danger") this.dangerQueued = true;
      this.setSituation("combat");
    } else if (current === "combat") {
      // Brief lulls between blows or along a risk boundary are not safety.
      this.threatRelease = setTimeout(() => {
        if (!this.disposed && this.situation !== "passing") this.setSituation(undefined);
      }, 6000);
    } else if (this.dangerQueued && !this.held && !this.state.playing && !this.state.loading && this.ctx && this.state.followWorld) {
      void this.play(3);
    }
  }
  /** A situation takes the score from place and room until it is released.
   * Work and combat loop; danger plays through once. */
  setSituation(situation: Situation | undefined) {
    const themeId = situation && situationTheme(situation, this.place?.culture, this.place?.year);
    if (themeId === this.held) return;
    const wasThreat = this.situation === "danger" || this.situation === "combat";
    const isThreat = situation === "danger" || situation === "combat";
    const quick = situation === "work" || this.situation === "work";
    this.situation = situation;
    if (situation === "passing") {
      clearTimeout(this.threatRelease);
      this.threat = undefined;
      this.dangerQueued = false;
    }
    this.held = themeId;
    this.heldLoops = situation === "work" || situation === "combat";
    if (!this.state.followWorld) return;
    this.generation++;
    clearTimeout(this.pending);
    this.retire(false, situation === "combat" ? 0.35 : wasThreat ? 4 : quick ? 0.4 : 2.5);
    this.patch({ playing: false, loading: false, beat: 0 });
    if (themeId) {
      this.patch({ arrangement: { ...this.state.arrangement, themeId, period: "day" } });
      if (this.ctx && isThreat) void this.play(situation === "combat" ? 0.25 : 3);
      else if (this.ctx && quick) void this.play(0.15);
      else if (this.ctx) this.later(2500, () => this.play(1.5));
      return;
    }
    const inside = this.inside;
    if (inside === null) return;
    this.patch({
      arrangement: {
        ...this.state.arrangement,
        themeId: inside ? interiorThemes[inside].id : this.nextTheme(this.state.arrangement.themeId),
      },
    });
    if (this.ctx && wasThreat) void this.play(6);
    else if (this.ctx) this.later(3000, () => this.play(SLOW_FADE_IN));
  }
  follow(enabled: boolean) {
    this.patch({ followWorld: enabled });
    if (enabled) {
      const themeId = this.held ?? (this.inside ? interiorThemes[this.inside].id : this.nextTheme());
      if (!this.held && this.inside === null) this.stop();
      else this.configure({ themeId });
    }
  }
  /** The world's ambient picture: weather, water, a town, a fire, a roof. */
  private pinned?: AmbienceMix;
  /** Holds the ambience on a chosen scene, for listening in the studio;
   * undefined hands it back to the world. */
  async pinScene(mix: AmbienceMix | undefined) {
    const world = this.pinned ?? this.scene;
    this.pinned = undefined;
    if (mix) await this.unlock();
    this.setScene(mix ?? world);
    if (mix) this.pinned = world;
  }
  setScene(mix: AmbienceMix) {
    if (this.pinned) {
      this.pinned = mix;
      return;
    }
    this.scene = mix;
    this.hear();
  }
  private hear() {
    const mix = this.heard(this.scene);
    this.ambience?.set(mix);
    this.room?.set(mix);
    if (this.ctx)
      this.duck?.gain.setTargetAtTime(this.instrumentDuck ? mix.music * 0.12 : mix.music, this.ctx.currentTime, this.instrumentDuck ? 0.25 : 1.2);
  }
  private instrumentDuck = false;
  private instrumentBuffers = new Map<string, AudioBuffer>();
  /** Ducks background music while the player plays an interactive instrument panel. */
  setInstrumentDuck(active: boolean) {
    if (this.instrumentDuck === active) return;
    this.instrumentDuck = active;
    if (this.ctx) {
      const target = active ? this.heard(this.scene).music * 0.12 : this.heard(this.scene).music;
      this.duck?.gain.setTargetAtTime(target, this.ctx.currentTime, active ? 0.2 : 0.9);
    }
  }
  /** Plays a single live note through the room's acoustic reverb using the synth voice bank. */
  async playInstrumentNote(voice: SynthVoice, midi: number, velocity = 0.85, sustain = 1.8) {
    if (this.disposed || this.state.muted) return;
    try {
      const ctx = await this.unlock();
      if (this.disposed || this.state.muted) return;
      const key = `${voice}:${midi}:${ctx.sampleRate}`;
      let buf = this.instrumentBuffers.get(key);
      if (!buf) {
        const samples = synthesize(voice, midi, 0, 0, ctx.sampleRate);
        buf = ctx.createBuffer(1, samples.length, ctx.sampleRate);
        buf.getChannelData(0).set(samples);
        if (this.instrumentBuffers.size > 128) {
          const first = this.instrumentBuffers.keys().next().value;
          if (first) this.instrumentBuffers.delete(first);
        }
        this.instrumentBuffers.set(key, buf);
      }
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      const peak = Math.max(0.05, Math.min(1, velocity)) * 0.48 * Math.max(0.35, this.state.volume || 0.7);
      src.buffer = buf;
      gain.gain.setValueAtTime(peak, now);
      const stopAt = Math.min(buf.duration, Math.max(0.35, sustain));
      gain.gain.setValueAtTime(peak, now + Math.max(0.08, stopAt - 0.28));
      gain.gain.exponentialRampToValueAtTime(0.0008, now + stopAt);
      src.connect(gain).connect(this.room?.input(0) ?? this.sfx ?? this.master!);
      src.start(now);
      src.stop(now + stopAt + 0.03);
    } catch {
      /* Audio context unavailable. */
    }
  }
  setLevel(stem: Stem, value: number) {
    const level = Math.max(0, Math.min(1, value));
    this.patch({ levels: { ...this.state.levels, [stem]: level } });
    if (this.ctx)
      this.run?.mix.stems[stem].gain.setTargetAtTime(
        level,
        this.ctx.currentTime,
        0.04,
      );
  }
  setVolume(kind: "volume" | "sfxVolume", value: number) {
    const volume = Math.max(0, Math.min(1, value));
    this.patch({ [kind]: volume });
    if (this.ctx)
      (kind === "volume" ? this.music : this.sfx)?.gain.setTargetAtTime(
        volume,
        this.ctx.currentTime,
        0.04,
      );
    this.persist();
  }
  setMusic(on: boolean) {
    this.patch({ music: on });
    this.persist();
    if (on) void this.play();
    else this.stop();
  }
  mute() {
    this.patch({ muted: !this.state.muted });
    if (this.ctx)
      this.master?.gain.setTargetAtTime(
        this.state.muted ? 0 : 0.72,
        this.ctx.currentTime,
        0.03,
      );
    this.persist();
  }
  private persist() {
    try {
      localStorage.setItem(
        PREF_KEY,
        JSON.stringify({
          volume: this.state.volume,
          sfxVolume: this.state.sfxVolume,
          muted: this.state.muted,
          music: this.state.music,
        }),
      );
    } catch {
      /* Optional preference. */
    }
  }
  /** Sounds sharing a `key` are throttled together, so
   * a burst of the same cue does not stack into a buzz. `pan` runs from -1
   * (left) to 1 (right). */
  async sound(cue: Sound | (() => Sound | undefined) | undefined, key = "", pan = 0, gap = 0) {
    if (!cue || this.disposed || this.state.muted || !this.state.sfxVolume) return;
    const tuned = tuning(key);
    if (tuned.gain <= 0) return;
    const now = performance.now();
    if (now - (this.lastSfx.get(key) ?? -Infinity) < Math.max(gap, tuned.gap)) return;
    try {
      const sound = typeof cue === "function" ? cue() : cue;
      if (!sound?.length) return;
      this.lastSfx.set(key, now);
      const ctx = await this.unlock();
      if (this.state.muted || !this.state.sfxVolume) return;
      playSound(
        ctx,
        this.room!.input(pan),
        applyTuning(sound, tuned),
        ctx.currentTime + 0.01,
      );
      if (this.state.error) this.patch({ error: "" });
    } catch (error) {
      if (!this.disposed)
        this.patch({ error: `Sound effect unavailable: ${String(error)}` });
    }
  }
  /** An animal answering the player: one call from where it is. */
  async call(voice: Voice, pan = 0, volume = 1) {
    if (this.disposed || this.state.muted || !this.state.sfxVolume) return;
    const now = performance.now(),
      key = `call-${voice}`;
    if (now - (this.lastSfx.get(key) ?? -Infinity) < 700) return;
    this.lastSfx.set(key, now);
    try {
      const ctx = await this.unlock();
      const data = sung(voice, ctx.sampleRate),
        src = ctx.createBufferSource(),
        g = ctx.createGain();
      src.buffer = ctx.createBuffer(1, data.length, ctx.sampleRate);
      src.buffer.getChannelData(0).set(data);
      g.gain.value = 0.09 * voiceGain(voice) * volume;
      src.connect(g).connect(this.room!.input(pan));
      src.start();
    } catch {
      /* Optional. */
    }
  }
  /** One-shots from a cave: a drop into a pool, wings, ice, grit, a find. */
  caveCue(what: CaveCue, volume: number) {
    if (what === "take") return this.event("gather");
    return this.sound(() => caveSounds[what]().map((l) => ({ ...l, gain: l.gain * volume })), `cave-${what}`, what === "bats" ? 0 : Math.random() - 0.5);
  }
  /** One-shots from the sewers. `pan` runs from -1 (left) to 1 (right). */
  sewerCue(what: SewerCue, volume: number, pan = 0) {
    if (what === "take") return this.event("gather");
    return this.sound(
      () => sewerSounds[what]().map((l) => ({ ...l, gain: l.gain * volume })),
      `sewer-${what}`,
      pan,
      sewerGaps[what],
    );
  }
  /** The sound of the ground the player is under; undefined back in the open. */
  setUnderground(bed: UndergroundLevels | undefined) {
    if (!bed && !this.under) return;
    const unit = (x: number) => Math.max(0, Math.min(1, x || 0));
    this.under = bed && { place: bed.place, flow: unit(bed.flow), echo: unit(bed.echo), surge: unit(bed.surge), drips: unit(bed.drips), draught: unit(bed.draught) };
    // The world above is re-heard only when the space changes enough to matter.
    const key = this.under ? `${Math.round(this.under.echo * 10)}:${Math.round(this.under.surge * 5)}` : "";
    if (key !== this.underKey) {
      this.underKey = key;
      this.hear();
    }
    if (this.ctx) this.syncUnder();
  }
  private syncUnder() {
    const u = this.under;
    if (u && this.underBed?.place === u.place) {
      clearTimeout(this.underEnd);
      this.underBed.set(u);
      return;
    }
    if (this.underBed) {
      const bed = this.underBed;
      this.underBed = undefined;
      bed.set({ flow: 0, echo: 0, surge: 0, drips: 0, draught: 0 });
      this.underEnd = setTimeout(() => bed.dispose(), 4000);
    }
    if (u) (this.underBed = new UndergroundBed(this.ctx!, this.sfx!, u.place)).set(u);
  }
  /** Underground the world above comes through the rock or the cover:
   * muffled, no birds or wind, and the space's echo on every sound. */
  private heard(mix: AmbienceMix): AmbienceMix {
    const s = this.under;
    if (!s) return mix;
    const shut = s.place === "sewer" ? 1 : 0;
    return {
      ...mix,
      inside: 1,
      birds: 0,
      owls: 0,
      insects: 0,
      trill: 0,
      cicadas: 0,
      frogs: 0,
      wind: 0,
      water: 0,
      town: mix.town * 0.5 * shut,
      traffic: mix.traffic * 0.5 * shut,
      rain: mix.rain * 0.4 * shut,
      room: 0.5 + 1.1 * Math.round(s.echo * 10) / 10,
      hard: 1,
      music: mix.music * (1 - 0.4 * Math.round(s.surge * 5) / 5),
    };
  }
  event(id: EventId) {
    return this.sound(events[id], id);
  }
  /** A blow to the head dulls everything heard, 0 clear to 1 fresh. */
  daze(level: number) {
    if (!this.haze || level === this.dazed) return;
    this.dazed = level;
    this.haze.frequency.setTargetAtTime(20000 * 0.07 ** level, this.ctx!.currentTime, 0.6);
    this.haze.Q.value = level > 0 ? 0.7 : 0;
  }
  /** A street goes quiet at something ugly, then talks about it. */
  private hush() {
    const town = this.heard(this.scene).town;
    if (town < 0.05 || !this.ambience) return;
    this.ambience.set({ ...this.heard(this.scene), town: town * 0.15 });
    setTimeout(() => {
      if (this.disposed) return;
      this.ambience?.set(this.heard(this.scene));
      void this.sound(bodily.murmur, "murmur", Math.random() - 0.5);
    }, 3200);
  }
  /** The blow, then the injury sting with the score drawn back under it. */
  injured(hurt?: Parameters<typeof bodily.impact>[0]) {
    if (hurt) void this.sound(() => bodily.impact(hurt), "impact");
    this.hush();
    const under = this.run?.gain.gain, ctx = this.ctx;
    if (under && ctx) {
      const now = ctx.currentTime;
      under.cancelAndHoldAtTime(now);
      under.linearRampToValueAtTime(0.15, now + 0.3);
      under.setValueAtTime(0.15, now + 4.5);
      under.linearRampToValueAtTime(1, now + 7);
    }
    return this.event("injured");
  }
  thunder(delay: number, close: boolean) {
    this.ambience?.strike(delay, close);
  }
  async interfaceSound(kind: InterfaceKind) {
    if (this.disposed || this.state.muted || !this.state.sfxVolume) return;
    const now = performance.now(),
      // A button's own tap must not swallow the panel it opens or closes.
      key = kind === "tap" || kind === "more" || kind === "less" ? "interface-tap" : "interface";
    if (now - (this.lastSfx.get(key) ?? -Infinity) < 45) return;
    this.lastSfx.set(key, now);
    try {
      const ctx = await this.unlock();
      if (!this.disposed && !this.state.muted && this.state.sfxVolume)
        playSound(ctx, this.sfx!, interfaceClick(kind), ctx.currentTime + 0.005);
    } catch {
      // A blocked audio context must not interrupt navigation.
    }
  }
  resetMix() {
    stems.forEach((stem) => this.setLevel(stem, defaultLevels[stem]));
  }
  dispose() {
    if (active === this) active = undefined;
    this.disposed = true;
    clearTimeout(this.threatRelease);
    clearTimeout(this.workIdle);
    clearTimeout(this.pending);
    this.generation++;
    this.resumeOnVisible = false;
    this.retire(true);
    document.removeEventListener("visibilitychange", this.visibility);
    this.autoplay();
    this.ambience?.dispose();
    clearTimeout(this.underEnd);
    this.underBed?.dispose();
    void this.ctx?.close();
    this.listeners.clear();
  }
}
