import Phaser from "phaser";
import { gameAudio } from "../audio/director";
import type { CueKind, Signal } from "../core/combat";
import { facingFromStep } from "../core/facing";
import type { CharacterPose } from "./characters/poses";
import { CUE_BUBBLE, CUE_GLYPHS as GLYPHS } from "./cue-marks";

type Sprite = Phaser.GameObjects.Image;


/** How each cue is acted out: the body, the mark over the head, and the small
 * movement that sells it. This table is the only place those are decided;
 * the engine names the cue and knows nothing of any of this. */
const ACTS: Record<
  CueKind,
  {
    pose?: CharacterPose;
    ms: number;
    mark?: { glyph: keyof typeof GLYPHS; color: number };
    move?: "hop" | "shake" | "dip";
    sound?: "alarm";
  }
> = {
  alarm: {
    pose: "startle",
    // Long enough to read the mark, not just to see that there was one.
    ms: 1000,
    mark: { glyph: "bang", color: 0xd9523f },
    move: "hop",
    sound: "alarm",
  },
  question: {
    pose: "shrug",
    ms: 900,
    mark: { glyph: "query", color: 0x4a78b8 },
  },
  anger: {
    pose: "point",
    ms: 1000,
    mark: { glyph: "vein", color: 0xc23a2e },
    move: "shake",
  },
  warm: { ms: 1100, mark: { glyph: "heart", color: 0xd9527a }, move: "dip" },
  nod: { ms: 320, move: "dip" },
  refuse: { pose: "shrug", ms: 900, mark: { glyph: "dots", color: 0x5c6470 } },
  point: { pose: "point", ms: 800 },
  beckon: { pose: "beckon", ms: 960 },
};
/** Feet to just over the hair. A person's canvas is mostly empty headroom,
 * so its height says nothing about where the head is. */
const HEAD = 35;
/** The same person does not flash the same thing twice in this long. */
const COOLDOWN_MS = 4000;

type Playing = {
  kind: CueKind;
  from: number;
  until: number;
  facing?: number;
  mark?: Phaser.GameObjects.Graphics;
  /** The offset this class last added to the sprite, so it can take it back. */
  dx: number;
  dy: number;
};

/** People showing how they take things. One cue a person at a time, the
 * newest winning; anyone off screen is skipped, since there is no sprite to
 * play it on. */
export class CueEffects {
  private seen = 0;
  private playing = new Map<string, Playing>();
  private last = new Map<string, number>();
  private zs?: Phaser.GameObjects.Graphics;
  constructor(
    private scene: Phaser.Scene,
    private view: {
      entityAt: (id: string) => Sprite | undefined;
      /** The player's poses are the runtime's to play. */
      playerPose: (pose: CharacterPose) => void;
    },
  ) {}

  consume(signals: readonly Signal[]) {
    // A new map is a new engine, and its count starts again.
    if ((signals.at(-1)?.serial ?? this.seen) < this.seen) this.seen = 0;
    for (const s of signals) {
      if (s.serial <= this.seen) continue;
      this.seen = s.serial;
      if (s.kind === "cue") this.play(s.who, s.cue, s.toward);
    }
  }

  /** A reaction the scene asks for itself: someone watching the player land
   * badly or go up a wall. Show only, so nothing reaches the engine. */
  react(who: string, kind: CueKind, toward?: { x: number; y: number }) {
    this.play(who, kind, toward);
  }

  private play(who: string, kind: CueKind, toward?: { x: number; y: number }) {
    const image = this.view.entityAt(who);
    if (!image) return;
    const now = this.scene.time.now;
    const key = `${who}:${kind}`;
    if (now - (this.last.get(key) ?? -COOLDOWN_MS) < COOLDOWN_MS) return;
    this.last.set(key, now);
    this.stop(who);
    const act = ACTS[kind];
    const at = { x: (image.x - 8) / 16, y: (image.y - 16) / 16 };
    const p: Playing = {
      kind,
      from: now,
      until: now + act.ms,
      facing:
        toward &&
        (Math.abs(toward.x - at.x) > 0.5 || Math.abs(toward.y - at.y) > 0.5)
          ? facingFromStep(toward.x - at.x, toward.y - at.y, 2)
          : undefined,
      dx: 0,
      dy: 0,
    };
    if (act.mark) p.mark = this.scene.add.graphics();
    this.playing.set(who, p);
    if (act.pose && who === "player") this.view.playerPose(act.pose);
    if (act.sound) void gameAudio()?.event(act.sound);
  }

  private stop(who: string) {
    const p = this.playing.get(who);
    if (!p) return;
    p.mark?.destroy();
    const image = this.view.entityAt(who);
    if (image?.active) image.setPosition(image.x - p.dx, image.y - p.dy);
    this.playing.delete(who);
  }

  /** The pose and facing a cue asks of somebody other than the player. */
  poseFor(id: string) {
    // The scene clock, which is what cues are stamped with. The time handed
    // to `update` by the game loop is a different one.
    const time = this.scene.time.now;
    const p = this.playing.get(id);
    const pose = p && ACTS[p.kind].pose;
    if (!p || !pose || time >= p.until) return undefined;
    return {
      pose,
      index: Math.min(
        3,
        Math.floor(((time - p.from) / (p.until - p.from)) * 4),
      ),
      facing: p.facing,
    };
  }

  update() {
    const time = this.scene.time.now;
    for (const [who, p] of this.playing) {
      const image = this.view.entityAt(who);
      if (!image || time >= p.until) {
        this.stop(who);
        continue;
      }
      const act = ACTS[p.kind];
      const t = (time - p.from) / (p.until - p.from);
      // Added as an offset and taken back each frame, so a step taken
      // mid-cue is not fought over.
      const early = Math.min(1, (time - p.from) / 220);
      const dx =
        act.move === "shake" && t < 0.5
          ? Math.floor(time / 40) % 2
            ? 1
            : -1
          : 0;
      // The camera rides the player's sprite, so the player's start shows in
      // the pose alone; a hop would bob the whole world.
      const dy =
        who === "player"
          ? 0
          : act.move === "hop"
            ? -Math.sin(Math.PI * early) * 5
            : act.move === "dip"
              ? Math.sin(Math.PI * early) * 2
              : 0;
      image.setPosition(image.x - p.dx + dx, image.y - p.dy + dy);
      p.dx = dx;
      p.dy = dy;
      if (p.mark && act.mark)
        this.mark(p.mark, image, act.mark, time - p.from, p.until - time);
    }
  }

  /** A small speech bubble with one glyph in it: pops in, sits, fades. */
  private mark(
    g: Phaser.GameObjects.Graphics,
    image: Sprite,
    mark: { glyph: keyof typeof GLYPHS; color: number },
    age: number,
    left: number,
  ) {
    const pop = Math.min(1, age / 140);
    // Past full size and back: the overshoot is what makes it a pop.
    const scale =
      pop < 1 ? pop * 1.25 : 1 + 0.25 * Math.max(0, 1 - (age - 140) / 90);
    const x = Math.round(image.x + 5),
      y = Math.round(image.y - HEAD);
    g.clear()
      .setPosition(x, y)
      .setScale(scale)
      .setAlpha(Math.min(1, left / 160))
      .setDepth(image.y + 4700);
    g.fillStyle(CUE_BUBBLE.shell, 1).fillRoundedRect(-6, -12, 11, 12, 3);
    g.fillTriangle(-4, -1, -1, -1, -5, 3);
    g.fillStyle(CUE_BUBBLE.fill, 1).fillRoundedRect(-5, -11, 9, 10, 2);
    g.fillTriangle(-3, -2, -1, -2, -4, 1);
    g.fillStyle(mark.color, 1);
    GLYPHS[mark.glyph].forEach((row, r) => {
      for (let c = 0; c < 5; c++)
        if (row & (1 << (4 - c))) g.fillRect(-3 + c, -10 + r, 1, 1);
    });
  }

  /** Anyone asleep in view breathes out a drifting z. */
  sleeping(ids: readonly string[], time: number) {
    if (!ids.length) {
      this.zs?.destroy();
      this.zs = undefined;
      return;
    }
    const g = (this.zs ??= this.scene.add.graphics()).clear();
    for (const id of ids) {
      const image = this.view.entityAt(id);
      if (!image) continue;
      g.setDepth(image.y + 4700);
      const t = (((time / 1600) % 1) + 1) % 1;
      const x = Math.round(image.x + 4 + t * 5),
        y = Math.round(image.y - HEAD - t * 9);
      g.fillStyle(0xf0e6cf, 1 - t);
      g.fillRect(x, y, 3, 1)
        .fillRect(x + 1, y + 1, 1, 1)
        .fillRect(x, y + 2, 3, 1);
    }
  }

  dispose() {
    for (const who of [...this.playing.keys()]) this.stop(who);
    this.zs?.destroy();
    this.zs = undefined;
  }
}
