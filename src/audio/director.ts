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
import type { CultureId } from "../content/history/types";
import {
  anywhereThemes,
  culturalMusic,
  MusicRotation,
} from "./cultural-themes";
import { createMix, scheduleNote, prepareScore, type MixBus } from "./synth";
import { events, noise, playSound, tone, type EventId, type Sound } from "./sfx";
import { applyTuning, tuning } from "./sfx-tuning";
import { Ambience, Room, silence, type AmbienceMix } from "./ambience";
import { interiorThemes, type InteriorMusic } from "./interior-themes";
import { situationTheme, type Situation } from "./situation-themes";

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
  private room?: Room;
  private duck?: GainNode;
  private scene: AmbienceMix = { ...silence };
  private listeners = new Set<() => void>();
  private generation = 0;
  private resumeOnVisible = false;
  private disposed = false;
  private lastSfx = new Map<string, number>();
  private setting = "";
  /** The building's piece; null for a room kept quiet, undefined outdoors. */
  private inside?: InteriorMusic | null;
  /** A situation's piece holding the stage over place and room. */
  private held?: string;
  private heldLoops = false;
  private workIdle?: ReturnType<typeof setTimeout>;
  private place?: { culture?: CultureId; year?: number; at: string };
  private arrivals = 0;
  private lastArrival = -Infinity;
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
      this.room = new Room(this.ctx, this.sfx);
      this.room.set(this.scene);
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
      if (this.held && this.heldLoops) {
        this.patch({ beat: 0 });
        this.begin();
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
    this.place = { culture, year, at: `${location?.lon}:${location?.lat}` };
    // Years pass within a life without a cue; no life jumps sixty at once, so more is time travel.
    const slipped = Math.abs((before?.year ?? 0) - (year ?? 0)) > 60,
      now = performance.now();
    if (!firstSetting && (slipped || (before?.at !== this.place.at && now - this.lastArrival > 60000))) {
      if (!slipped) this.lastArrival = now;
      void this.cue(
        slipped
          ? situationTheme("timeslip", culture, year)
          : situationTheme("arrival", culture, year, this.arrivals++),
      );
    }
    const direct = culture && year !== undefined
      ? culturalMusic(culture, year, location).direct
      : [];
    this.rotation = new MusicRotation(direct, shared);
    // Setting refreshes affect the next piece, not the one already underway.
    if (firstSetting && this.state.followWorld && this.inside === undefined &&
      !this.state.playing && !this.state.loading)
      this.configure({ themeId: this.nextTheme() });
  }
  setClock(seconds: number, playful: boolean) {
    this.clock = seconds;
    this.playful = playful;
  }
  /** A piece that belongs to this hour and has not yet played today, else the rotation's next. */
  private nextTheme(previous?: string) {
    const hours = this.clock / 3600,
      hour = hours % 24;
    const due = timed.find((t) => (!t.playful || this.playful) && hour >= t.hours![0] && hour < t.hours![1] && hours - (this.timedAt.get(t.id) ?? -Infinity) > 12);
    if (!due) return this.rotation.next(previous);
    this.timedAt.set(due.id, hours);
    this.state = { ...this.state, arrangement: { ...this.state.arrangement, period: "day" } };
    return due.id;
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
  /** A short piece over whatever is playing, which steps back for it. */
  async cue(themeId: string) {
    const ctx = this.ctx;
    if (!ctx || this.disposed || this.held || !this.state.followWorld) return;
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
  /** A situation takes the score from place and room until it is released.
   * The work dance starts at once and loops; the others play once and leave silence. */
  setSituation(situation: Situation | undefined) {
    const themeId = situation && situationTheme(situation, this.place?.culture, this.place?.year);
    if (themeId === this.held) return;
    const quick = situation === "work" || this.heldLoops;
    this.held = themeId;
    this.heldLoops = situation === "work";
    if (!this.state.followWorld) return;
    this.generation++;
    clearTimeout(this.pending);
    this.retire(false, quick ? 0.4 : 2.5);
    this.patch({ playing: false, loading: false, beat: 0 });
    if (themeId) {
      this.patch({ arrangement: { ...this.state.arrangement, themeId, period: "day" } });
      if (this.ctx && quick) void this.play(0.15);
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
    if (this.ctx) this.later(3000, () => this.play(SLOW_FADE_IN));
  }
  follow(enabled: boolean) {
    this.patch({ followWorld: enabled });
    if (enabled) this.configure({ themeId: this.nextTheme() });
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
    this.ambience?.set(mix);
    this.room?.set(mix);
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
  /** Sounds sharing a `key` are throttled together, so
   * a burst of the same cue does not stack into a buzz. `pan` runs from -1
   * (left) to 1 (right). */
  async sound(cue: Sound | (() => Sound | undefined) | undefined, key = "", pan = 0) {
    if (!cue || this.disposed || this.state.muted || !this.state.sfxVolume) return;
    const tuned = tuning(key);
    if (tuned.gain <= 0) return;
    const now = performance.now();
    if (now - (this.lastSfx.get(key) ?? -Infinity) < tuned.gap) return;
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
  /** One-shots from underground: a drop into a pool, wings, a find. */
  caveCue(what: "drip" | "bats" | "take", volume: number) {
    if (what === "take") return this.event("gather");
    if (what === "drip") {
      const f = 900 + Math.random() * 900;
      return this.sound([tone(0, 0.11, 0.05 * volume, f * 1.5, { to: f, attack: 0.002 }), tone(0.03, 0.2, 0.02 * volume, f * 2.2, { to: f * 2.6 })], "cave-drip", Math.random() - 0.5);
    }
    return this.sound(
      Array.from({ length: 22 }, (_, i) => noise(i * 0.05 + Math.random() * 0.03, 0.035, 0.07 * (1 - i / 26), 3200 + Math.random() * 2600, { q: 3 })),
      "cave-bats",
    );
  }
  event(id: EventId) {
    return this.sound(events[id], id);
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
