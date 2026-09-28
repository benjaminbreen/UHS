import Phaser from "phaser";
import { ensureSmoke } from "./smoke";
import { wind } from "./wind";
import {
  DAY,
  stopAt,
  timetable,
  trackCentre,
  trainPart,
  trainsAt,
  type Railway,
  type Run,
  type TrainState,
} from "../world/v3/railway";
import type { WorldSetting } from "../content/geography/types";
import { gameAudio } from "../audio/director";
import { railway as railSounds } from "../audio/sfx";

type Puff = { image: Phaser.GameObjects.Image; born: number; x: number; y: number; drift: number; life: number };

/** The trains on a town's line, drawn from the timetable at the drawn clock.
 * Nothing here is simulated: a train is where its working says it is at this
 * second, so a scene rebuilt mid-journey picks it up where it was. */
export class TrainLayer {
  private cars = new Map<string, Phaser.GameObjects.Image>();
  /** Lit windows and lamps: a pane over the car, a halo over the night. */
  private glows = new Map<string, { pane: Phaser.GameObjects.Image; halo: Phaser.GameObjects.Image }>();
  private lamps = 0;
  private heard = -1;
  private ear = { x: 0, y: 0 };
  private runs = new Map<string, Run[]>();
  private puffs: Puff[] = [];
  private lastPuff = new Map<string, number>();
  constructor(
    private scene: Phaser.Scene,
    private texture: (frame: string) => string,
  ) {}

  update(
    lines: { key: string; line: Railway; radius: number }[],
    setting: WorldSetting | undefined,
    seed: string,
    clock: number,
    now: number,
    view: Phaser.Geom.Rectangle,
    tint: number,
    freeze: boolean,
    lamps: number,
    ear: { x: number; y: number },
  ) {
    this.lamps = lamps;
    this.ear = ear;
    const seen = new Set<string>();
    if (setting)
      for (const { key, line } of lines) {
        let runs = this.runs.get(key);
        if (!runs) this.runs.set(key, (runs = timetable(seed, key, setting, line)));
        for (const train of trainsAt(line, runs, clock))
          this.drawTrain(line, train, seen, view, tint, now, freeze);
        if (!freeze) this.listen(line, runs, clock);
      }
    this.heard = clock;
    for (const [id, image] of this.cars)
      if (!seen.has(id)) {
        image.destroy();
        this.cars.delete(id);
      }
    for (const [id, glow] of this.glows)
      if (!seen.has(id) || !lamps) {
        glow.pane.destroy();
        glow.halo.destroy();
        this.glows.delete(id);
      }
    this.age(now, tint);
  }

  private drawTrain(
    line: Railway,
    train: TrainState,
    seen: Set<string>,
    view: Phaser.Geom.Rectangle,
    tint: number,
    now: number,
    freeze: boolean,
  ) {
    const { run, head } = train;
    const across = trackCentre(line, run.track) * 16;
    const alongX = line.axis === "x";
    let behind = 0;
    for (const [i, key] of run.cars.entries()) {
      const part = trainPart(run.set, key);
      if (!part) continue;
      const length = part.length;
      // The car's two ends along the line, in world pixels.
      const front = head * 16 - run.dir * behind;
      const back = front - run.dir * length;
      behind += length;
      const lo = Math.min(front, back),
        hi = Math.max(front, back);
      const id = `${run.id}-${i}`;
      const x0 = alongX ? lo : across - part.width / 2;
      const x1 = alongX ? hi : across + part.width / 2;
      const y1 = alongX ? across + 8 : hi;
      const y0 = y1 - (alongX ? part.sideHeight : hi - lo + part.height);
      if (x1 < view.x - 32 || x0 > view.right + 32 || y1 < view.y - 32 || y0 > view.bottom + 200) continue;
      seen.add(id);
      // Wheels turn with the distance run, not the clock, so a standing
      // train's rods stand still.
      const step = part.kind === "steam" ? 23 : 9;
      const turn = ((Math.floor((run.dir * head * 16) / step) % 4) + 4) % 4;
      const frame = alongX
        ? `train-${run.set}-${key}-${turn}`
        : part.kind === "steam"
          ? `train-${run.set}-${key}-top-${run.dir > 0 ? "s" : "n"}`
          : `train-${run.set}-${key}-top`;
      let image = this.cars.get(id);
      if (!image) {
        image = this.scene.add.image(0, 0, this.texture(frame), frame).setOrigin(0, 1);
        this.cars.set(id, image);
      } else if (image.frame.name !== frame || image.texture.key === "__DEFAULT")
        image.setTexture(this.texture(frame), frame);
      image
        .setPosition(Math.round(alongX ? lo - 1 : x0 - 1), Math.round(y1))
        .setFlipX(alongX && run.dir < 0)
        .setTint(tint)
        .setDepth(alongX ? across + 6 : hi - 2);
      if (this.lamps > 0) this.light(id, image, alongX ? `train-${run.set}-${key}-glow` : `${frame}-glow`);
      if (part.smoke && !freeze) {
        const [sx, sy] = part.smoke;
        // A flipped side view mirrors the chimney about the car's middle; from
        // above it stands a smokebox's length back from the leading end.
        const wx = alongX ? (run.dir > 0 ? lo - 1 + sx : hi - sx) : across;
        const wy = alongX ? y1 - part.sideHeight + sy : run.dir > 0 ? hi - part.height - 12 : lo - part.height + 12;
        this.exhaust(id, part.steam, wx, wy, train.speed, now, image.depth + 1, tint);
      }
    }
  }

  /** Whistles at the moments the working gives them: the driver's as a
   * stopping train brakes in and as it starts, the guard's just before, a
   * long one from a train running through. Heard only on a clock that ran
   * past the moment, not one that was set over it. */
  private listen(line: Railway, runs: Run[], clock: number) {
    const from = this.heard;
    if (from < 0 || clock <= from || clock - from > 90) return;
    const day = Math.floor(clock / DAY);
    for (const run of runs) {
      const steam = trainPart(run.set, "loco")?.kind === "steam";
      const at = stopAt(line, run);
      const [x, y] = line.axis === "x" ? [at, line.level] : [line.level, at];
      const near = Math.max(0, 1 - Math.hypot(x - this.ear.x, y - this.ear.y) / 60);
      if (!near) continue;
      const cues: [number, () => void][] = run.dwell
        ? [
            [run.at - 75, () => void gameAudio()?.sound(steam ? railSounds.whistle(near * 0.6) : railSounds.horn(near * 0.6), "train-whistle")],
            [run.at + run.dwell - 7, () => void gameAudio()?.sound(railSounds.guard(near), "train-guard")],
            [run.at + run.dwell - 1, () => void gameAudio()?.sound(steam ? railSounds.whistle(near) : railSounds.horn(near), "train-whistle")],
          ]
        : [[run.at - 25, () => void gameAudio()?.sound(steam ? railSounds.whistle(near, true) : railSounds.horn(near), "train-whistle")]];
      for (const [t, play] of cues)
        for (const d of [day - 1, day]) {
          const when = d * DAY + t;
          if (when > from && when <= clock) play();
        }
    }
  }

  private light(id: string, image: Phaser.GameObjects.Image, frame: string) {
    let glow = this.glows.get(id);
    if (!glow) {
      const make = () => this.scene.add.image(0, 0, this.texture(frame), frame).setOrigin(0, 1);
      glow = { pane: make(), halo: make().setBlendMode(Phaser.BlendModes.ADD).setDepth(19001) };
      this.glows.set(id, glow);
    }
    for (const [layer, alpha] of [[glow.pane, this.lamps], [glow.halo, this.lamps * 0.45]] as const) {
      if (layer.frame.name !== frame || layer.texture.key === "__DEFAULT") layer.setTexture(this.texture(frame), frame);
      layer.setPosition(image.x, image.y).setFlipX(image.flipX).setAlpha(alpha);
    }
    glow.pane.setDepth(image.depth + 0.5);
  }

  /** A puff from the chimney: often and hard while working, a lazy wisp
   * when standing. Puffs stay where they were let go, so a moving engine
   * leaves its trail lying along the line behind it. */
  private exhaust(id: string, steam: boolean, x: number, y: number, speed: number, now: number, depth: number, tint: number) {
    // Four beats a turn of the wheels: slow as it starts, a patter at speed.
    const every = steam ? (speed > 0.03 ? Math.max(110, Math.min(900, 90 / speed)) : 700) : 900;
    const last = this.lastPuff.get(id) ?? 0;
    if (now - last < every) return;
    this.lastPuff.set(id, now);
    const key = ensureSmoke(this.scene);
    const image = this.scene.add.image(x, y, key, "0").setDepth(depth).setTint(tint);
    if (steam && speed > 0.03) {
      const near = Math.max(0, 1 - Math.hypot(x / 16 - this.ear.x, y / 16 - this.ear.y) / 40);
      if (near > 0) void gameAudio()?.sound(railSounds.chuff(near, Math.min(1, 1.2 - speed)), "train-chuff");
    }
    this.puffs.push({ image, born: now, x, y, drift: (Math.random() - 0.5) * 6, life: steam ? 2600 : 1600 });
  }

  private age(now: number, tint: number) {
    const air = wind();
    const lean = Math.cos(air.angle) * (6 + air.strength * 30);
    this.puffs = this.puffs.filter((p) => {
      const t = (now - p.born) / p.life;
      if (t >= 1) {
        p.image.destroy();
        return false;
      }
      const up = 1 - (1 - t) * (1 - t);
      p.image
        .setPosition(Math.round(p.x + p.drift * t + lean * t), Math.round(p.y - up * 34))
        .setFrame(String(Math.min(7, Math.floor(t * 8))))
        .setAlpha(t < 0.7 ? 0.85 : 0.5)
        .setTint(tint);
      return true;
    });
  }

  dispose() {
    for (const image of this.cars.values()) image.destroy();
    for (const glow of this.glows.values()) {
      glow.pane.destroy();
      glow.halo.destroy();
    }
    this.glows.clear();
    for (const p of this.puffs) p.image.destroy();
    this.cars.clear();
    this.puffs = [];
    this.runs.clear();
  }
}
