import type Phaser from "phaser";
import { gustAt, wind } from "./wind";

/** Smoke off a roof. One texture, one clock, no tweens: every plume in view is
 * stepped together ten times a second, and a puff's place is a function of the
 * time alone, so scenery can be thrown away and rebuilt without a plume ever
 * jumping. Puffs move on whole pixels and thin out by losing pixels rather
 * than by fading, which is what keeps them pixel art. */
export const SMOKE_KEY = "roof-smoke-2";
const FRAMES = 8;
const CELL = 17;
const STEP_MS = 100;

export type SmokeKind = "chimney" | "vent" | "fire";
type Plume = {
  x: number;
  y: number;
  kind: SmokeKind;
  /** 0..1: a banked fire to a cooking one. */
  strength: number;
  seed: number;
  puffs: Phaser.GameObjects.Image[];
};

const hash = (x: number, y: number) => {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
};

/** Eight frames of one puff's life: a tight bright knot, swelling, then
 * breaking up. Lit from the upper left like everything else; the holes that
 * open in the late frames are ordered, so they read as thinning, not noise. */
export function ensureSmoke(scene: Phaser.Scene) {
  if (scene.textures.exists(SMOKE_KEY)) return SMOKE_KEY;
  const canvas = scene.textures.createCanvas(SMOKE_KEY, CELL * FRAMES, CELL)!;
  const ctx = canvas.getContext();
  ctx.clearRect(0, 0, CELL * FRAMES, CELL);
  const tones = ["#e4dfd2", "#c9c4b6", "#aaa598", "#8b877c"];
  // Bayer 4x4: which pixels go first as the puff thins.
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  for (let f = 0; f < FRAMES; f++) {
    const t = f / (FRAMES - 1);
    const r = 2 + t * 5.5;
    // Nothing is lost for the first half; by the last frame most of it is.
    const thin = Math.max(0, (t - 0.45) / 0.55) * 15;
    // Three lobes that drift apart, so the puff billows instead of scaling.
    const lobes = [
      [0, 0, r],
      [-r * 0.55 * t - 1, r * 0.25, r * 0.72],
      [r * 0.6 * t + 1, -r * 0.2, r * 0.66],
    ];
    const c = (CELL - 1) / 2;
    for (let y = 0; y < CELL; y++)
      for (let x = 0; x < CELL; x++) {
        let best = -1,
          lit = 0;
        for (const [lx, ly, lr] of lobes) {
          const dx = (x - c - lx) / lr,
            dy = (y - c - ly) / lr;
          const d = dx * dx + dy * dy;
          if (d > 1) continue;
          const depth = 1 - d;
          if (depth > best) {
            best = depth;
            lit = -dx * 0.6 - dy * 0.75;
          }
        }
        if (best < 0) continue;
        // The rim goes first, the heart of the puff last.
        if (bayer[(y & 3) * 4 + (x & 3)] < thin - best * 6) continue;
        const tone = lit > 0.45 ? 0 : lit > -0.05 ? 1 : lit > -0.55 ? 2 : 3;
        ctx.fillStyle = tones[Math.min(3, tone + (t > 0.7 ? 1 : 0))];
        ctx.fillRect(f * CELL + x, y, 1, 1);
      }
    canvas.add(String(f), 0, f * CELL, 0, CELL, CELL);
  }
  canvas.refresh();
  return SMOKE_KEY;
}

const managers = new WeakMap<
  Phaser.Scene,
  { plumes: Set<Plume>; step: number }
>();

/** Start a plume at a world pixel. Returns its sprites so the caller can own
 * their lifetime; a plume whose sprites are destroyed drops itself. */
export function addPlume(
  scene: Phaser.Scene,
  x: number,
  y: number,
  kind: SmokeKind,
  strength: number,
  depth: number,
  tint: number,
) {
  const key = ensureSmoke(scene);
  let manager = managers.get(scene);
  if (!manager) {
    manager = { plumes: new Set(), step: -1 };
    managers.set(scene, manager);
    const m = manager;
    const update = (time: number) => {
      const step = Math.floor(time / STEP_MS);
      if (step === m.step) return;
      m.step = step;
      const view = scene.cameras.main.worldView;
      const air = wind();
      let drawn = 0;
      for (const plume of m.plumes) {
        if (!plume.puffs[0]?.scene) {
          m.plumes.delete(plume);
          continue;
        }
        const seen =
          !view.width ||
          (plume.x > view.x - 90 &&
            plume.x < view.right + 90 &&
            plume.y > view.y - 10 &&
            plume.y < view.bottom + 110);
        if (!seen) {
          for (const puff of plume.puffs) puff.setVisible(false);
          continue;
        }
        drawn++;
        place(plume, step * STEP_MS, air);
      }
      scene.game.canvas.dataset.plumes = String(drawn);
    };
    scene.events.on("update", update);
    scene.events.once("shutdown", () => {
      scene.events.off("update", update);
      m.plumes.clear();
      managers.delete(scene);
    });
  }
  const count = kind === "chimney" ? 6 : kind === "fire" ? 8 : 7;
  const puffs = Array.from({ length: count }, () =>
    scene.add
      .image(x, y, key, "0")
      .setDepth(depth)
      .setTint(tint)
      .setVisible(false),
  );
  const plume: Plume = {
    x,
    y,
    kind,
    strength,
    seed: hash(Math.round(x), Math.round(y)),
    puffs,
  };
  manager.plumes.add(plume);
  place(plume, Math.max(0, manager.step) * STEP_MS, wind());
  return puffs;
}

function place(
  plume: Plume,
  time: number,
  air: { angle: number; strength: number },
) {
  // An open fire is a stack with no chimney: quick, and it keeps going up.
  const chimney = plume.kind === "chimney" || plume.kind === "fire";
  // A stack draws: a narrow quick column. A roof vent seeps: slow and wide.
  const period = plume.kind === "fire" ? 3600 : chimney ? 4300 : 6200;
  const height = plume.kind === "fire" ? 78 : chimney ? 66 : 50;
  const n = plume.puffs.length;
  const gust = gustAt(time, plume.x, plume.y, plume.seed * 6.28);
  const lean =
    Math.cos(air.angle) * (8 + air.strength * 58) * (1 + gust * 0.35);
  // A banked fire sends up every other puff.
  const every = plume.strength < 0.5 ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const puff = plume.puffs[i];
    if (i % every) {
      puff.setVisible(false);
      continue;
    }
    const t = (time / period + i / n + plume.seed) % 1;
    // Quick off the fire, slowing as it cools; the lean grows with height.
    const up = 1 - (1 - t) * (1 - t);
    const curl =
      Math.sin(t * 7.2 + plume.seed * 40 + i) *
      (chimney ? 1.5 + t * 4 : 3 + t * 7);
    puff
      .setVisible(true)
      .setPosition(
        Math.round(plume.x + lean * t * Math.sqrt(t) + curl),
        Math.round(plume.y - 3 - up * height),
      )
      .setFrame(
        String(
          Math.min(FRAMES - 1, Math.floor(t * FRAMES) + (chimney ? 0 : 1)),
        ),
      )
      // Three steps of alpha, not a fade: it arrives, hangs, and is gone.
      .setAlpha(t < 0.08 ? 0.5 : t < 0.7 ? (chimney ? 0.85 : 0.7) : 0.5);
  }
}
