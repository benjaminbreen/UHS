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
} from "./score";
import { createMix, scheduleNote, prepareScore, type MixBus } from "./synth";
import { events, playSound, type EventId, type Sound } from "./sfx";
import { applyTuning, tuning } from "./sfx-tuning";
import { Ambience, silence, type AmbienceMix } from "./ambience";

export interface AudioState {
  loading: boolean;
  playing: boolean;
  beat: number;
  arrangement: Arrangement;
  followWorld: boolean;
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
// The lead line tires quickly on repeat; the game mix leaves it out.
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
const pick = <T,>(list: readonly T[]) =>
  list[Math.floor(Math.random() * list.length)];
/** A random theme in a random season, period and era, never the same theme twice running. */
function shuffled(previous?: string): Arrangement {
  const pool = themes.filter((t) => t.id !== previous);
  return {
    themeId: pick(pool).id,
    season: pick(seasons),
    period: pick(periods),
    era: pick(eras),
  };
}
/** The director the game is running under. The scene plays tool and footfall
 * sounds through it without threading a reference through every layer. */
let active: AudioDirector | undefined;
export function gameAudio() {
  return active;
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
  private duck?: GainNode;
  private scene: AmbienceMix = { ...silence };
  private listeners = new Set<() => void>();
  private generation = 0;
  private resumeOnVisible = false;
  private disposed = false;
  private lastSfx = new Map<string, number>();
  private state: AudioState = {
    loading: false,
    playing: false,
    beat: 0,
    arrangement: shuffled(),
    followWorld: true,
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
      this.master.connect(limiter).connect(this.ctx.destination);
      this.music = this.ctx.createGain();
      this.music.gain.value = this.state.volume;
      this.duck = this.ctx.createGain();
      this.duck.gain.value = this.scene.music;
      this.music.connect(this.duck).connect(this.master);
      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = this.state.sfxVolume;
      this.sfx.connect(this.master);
      this.ambience = new Ambience(this.ctx, this.sfx);
      this.ambience.set(this.scene);
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
    if (this.disposed) throw Error("Audio session has closed.");
    return this.ctx;
  }
  async play(fadeIn = 0.8) {
    clearTimeout(this.pending);
    if (this.state.playing || this.state.loading) return;
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
    const mix = createMix(ctx, gain, score.bpm, this.state.levels);
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
      if (this.state.followWorld) {
        this.retire(false, SLOW_FADE_OUT);
        this.patch({ playing: false, beat: 0 });
        const next = shuffled(this.state.arrangement.themeId);
        this.later(GAP_MIN + Math.random() * GAP_SPREAD, () => {
          this.configure(next);
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
  follow(enabled: boolean) {
    this.patch({ followWorld: enabled });
  }
  /** The world's ambient picture: weather, water, a town, a fire, a roof. */
  setScene(mix: AmbienceMix) {
    this.scene = mix;
    this.ambience?.set(mix);
    if (this.ctx)
      this.duck?.gain.setTargetAtTime(mix.music, this.ctx.currentTime, 1.5);
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
        }),
      );
    } catch {
      /* Optional preference. */
    }
  }
  /** Plays a built sound. Sounds sharing a `key` are throttled together, so
   * a burst of the same cue does not stack into a buzz. */
  async sound(sound: Sound | undefined, key = "") {
    if (!sound?.length) return;
    const tuned = tuning(key);
    const now = performance.now();
    if (now - (this.lastSfx.get(key) ?? 0) < tuned.gap) return;
    this.lastSfx.set(key, now);
    try {
      const ctx = await this.unlock();
      playSound(ctx, this.sfx!, applyTuning(sound, tuned), ctx.currentTime + 0.01);
      if (this.state.error) this.patch({ error: "" });
    } catch (error) {
      if (!this.disposed)
        this.patch({ error: `Sound effect unavailable: ${String(error)}` });
    }
  }
  event(id: EventId) {
    return this.sound(events[id](), id);
  }
  resetMix() {
    stems.forEach((stem) => this.setLevel(stem, defaultLevels[stem]));
  }
  dispose() {
    if (active === this) active = undefined;
    this.disposed = true;
    this.generation++;
    this.resumeOnVisible = false;
    this.retire(true);
    document.removeEventListener("visibilitychange", this.visibility);
    this.autoplay();
    this.ambience?.dispose();
    void this.ctx?.close();
    this.listeners.clear();
  }
}
