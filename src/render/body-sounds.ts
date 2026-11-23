import { gameAudio } from "../audio/director";
import { bodily } from "../audio/sfx";
import { voiceOf } from "../audio/voices";
import { symptomsShown } from "../core/health";
import type { Weather } from "../core/weather";
import type { Runtime } from "../runtime/session";

/** What the player's own body and company add to the mix: a cough, a growling
 * stomach, a breath that catches on cracked ribs, the world gone dull after a
 * blow to the head, children playing near, a house in mourning. */
export class BodySounds {
  private next = 0;
  private due: Record<string, number> = {};
  private movedSince?: number;
  private wetSince?: number;
  private was?: { run: boolean; climb: boolean };

  constructor(private runtime: Runtime) {}

  /** True every `lo` to `hi` seconds while it keeps being asked. */
  private every(key: string, time: number, lo: number, hi: number) {
    if (time < (this.due[key] ??= time + lo * 300)) return false;
    this.due[key] = time + (lo + Math.random() * (hi - lo)) * 1000;
    return true;
  }

  /** `water` is the depth the player stands in. */
  update(time: number, moving: boolean, water: number, weather: Weather | undefined) {
    const audio = gameAudio();
    if (!audio) return;
    const engine = this.runtime.engine, s = engine.state, p = s.player;
    const hurt = engine.injuryNow();

    if (moving) this.movedSince ??= time;
    else if (this.movedSince !== undefined) {
      if (time - this.movedSince > 6000 && hurt?.def.part === "ribs") void audio.sound(bodily.hitch, "breath", 0, 5000);
      this.movedSince = undefined;
    }
    if (water > 0.1) this.wetSince ??= time;
    else if (this.wetSince !== undefined) {
      if (time - this.wetSince > 1500) void audio.sound(bodily.shed, "shed", 0, 15000);
      this.wetSince = undefined;
    }

    if (time < this.next) return;
    this.next = time + 500;
    audio.daze(p.dead || hurt?.def.part !== "head" ? 0 : Math.max(0, 1 - hurt.mended * 2) * (hurt.def.grade > 1 ? 1 : 0.4));
    const gait = engine.gait();
    if (this.was && hurt && ((gait.run && !this.was.run) || (gait.climb && !this.was.climb))) void audio.event("mended");
    this.was = hurt && { run: gait.run, climb: gait.climb };
    if (p.dead) return;

    const voice = voiceOf(p), clock = s.clock, out = p.pos.space === "outside";
    const ill = symptomsShown(s, p, engine.world.pack.setting, clock);
    if (ill.cough > 0.2 && this.every("cough", time, 40, 110)) void audio.sound(() => bodily.cough(voice), "body");
    else if (ill.fever > 0.3 && this.every("shiver", time, 50, 120)) void audio.sound(bodily.shiver, "body");
    if (s.manifest.survival && p.hunger >= 75 && this.every("stomach", time, 80, 180)) void audio.sound(bodily.stomach, "body");
    if (p.fatigue >= 80 && weather?.night && this.every("yawn", time, 100, 220)) void audio.sound(() => bodily.yawn(voice), "body");

    const wind = out ? weather?.wind.strength ?? 0 : 0;
    if (wind > 0.55 && this.every("gust", time, 7, 18)) void audio.sound(() => bodily.buffet(wind), "gust", Math.random() - 0.5);

    const near = (max: number) => (a: (typeof s.actors)[number]) =>
      a.kind === "human" && !a.dead && a.pos.space === p.pos.space && Math.hypot(a.pos.x - p.pos.x, a.pos.y - p.pos.y) < max;
    if (out && !weather?.night && this.every("play", time, 45, 120)) {
      const child = s.actors.find((a) => near(10)(a) && (a.age ?? 30) < 12);
      if (child) void audio.sound(bodily.play, "kin", (child.pos.x - p.pos.x) / 10);
    }
    const home = s.households?.find((h) => h.id === p.householdId);
    if (!out && (home?.mourning?.until ?? 0) > clock && this.every("keen", time, 30, 80)) {
      const mourner = s.actors.find((a) => near(8)(a) && a.householdId === home!.id);
      if (mourner) void audio.sound(bodily.keen, "kin", (mourner.pos.x - p.pos.x) / 8);
    }
  }
}
