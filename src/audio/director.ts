import {
  compose,
  defaultArrangement,
  slotThemes,
  stems,
  worldMusicSlot,
  type Arrangement,
  type Score,
  type Stem,
} from "./score";
import {
  createMix,
  effectNotes,
  scheduleNote,
  prepareScore,
  type EffectId,
  type MixBus,
} from "./synth";

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
export class AudioDirector {
  private ctx?: AudioContext;
  private master?: GainNode;
  private music?: GainNode;
  private sfx?: GainNode;
  private run?: Run;
  private timer?: ReturnType<typeof setInterval>;
  private listeners = new Set<() => void>();
  private clock = 0;
  private generation = 0;
  private resumeOnVisible = false;
  private disposed = false;
  private lastSfx = 0;
  private state: AudioState = {
    loading: false,
    playing: false,
    beat: 0,
    arrangement: defaultArrangement,
    followWorld: true,
    volume: 0.65,
    sfxVolume: 0.6,
    muted: false,
    levels: { melody: 1, harmony: 1, bass: 1, percussion: 1 },
    error: "",
  };
  constructor() {
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
      this.music.connect(this.master);
      this.sfx = this.ctx.createGain();
      this.sfx.gain.value = this.state.sfxVolume;
      this.sfx.connect(this.master);
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
    if (this.disposed) throw Error("Audio session has closed.");
    return this.ctx;
  }
  async play() {
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
      this.begin(this.state.beat);
    } catch (error) {
      if (!this.disposed)
        this.patch({
          playing: false,
          loading: false,
          error: `Audio could not start: ${error instanceof Error ? error.message : String(error)}`,
        });
    }
  }
  private begin(offset = 0) {
    this.retire();
    const ctx = this.ctx!,
      score = this.score;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.8);
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
        const tracks = slotThemes(this.state.arrangement.season);
        const next =
          tracks[
            (tracks.findIndex((t) => t.id === this.state.arrangement.themeId) +
              1) %
              tracks.length
          ];
        this.configure({ themeId: next.id });
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
  private retire(immediate = false) {
    clearInterval(this.timer);
    this.timer = undefined;
    const run = this.run;
    this.run = undefined;
    if (!run || !this.ctx) return;
    const now = this.ctx.currentTime,
      fade = immediate ? 0.025 : 0.8;
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
    if (enabled) this.updateWorld(this.clock);
  }
  updateWorld(clock: number) {
    this.clock = clock;
    if (!this.state.followWorld) return;
    const slot = worldMusicSlot(clock),
      current = this.state.arrangement;
    if (slot.season !== current.season || slot.period !== current.period)
      this.configure({ ...slot, themeId: slotThemes(slot.season)[0].id });
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
  async effect(id: EffectId) {
    if (performance.now() - this.lastSfx < 75) return;
    this.lastSfx = performance.now();
    try {
      const ctx = await this.unlock();
      effectNotes(id).forEach((n) =>
        scheduleNote(ctx, this.sfx!, n, ctx.currentTime + n.beat + 0.01, 1),
      );
      this.patch({ error: "" });
    } catch (error) {
      if (!this.disposed)
        this.patch({ error: `Sound effect unavailable: ${String(error)}` });
    }
  }
  resetMix() {
    stems.forEach((stem) => this.setLevel(stem, 1));
  }
  dispose() {
    this.disposed = true;
    this.generation++;
    this.resumeOnVisible = false;
    this.retire(true);
    document.removeEventListener("visibilitychange", this.visibility);
    void this.ctx?.close();
    this.listeners.clear();
  }
}
