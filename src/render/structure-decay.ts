import type Phaser from "phaser";
import type { Place } from "../core/types";
import { conditionOf } from "../core/time/structure";
import { random, stateHash } from "../core/random";
import { decay, PAD_X, PAD_Y } from "./materials/decay";

/** Below this a building shows its wear; above it the atlas art is honest. */
const SHOWS_WEAR = 0.9;
const BUDGET_MS = 6;

/** A ruin with its roof gone and its walls down to stubs is drawn by
 * `paintRuin`; until then it is still the building, falling apart. */
export function stillStanding(place: Place) {
  const s = place.structure;
  if (!s) return true;
  const walls = s.walls.reduce((a, b) => a + b, 0) / s.walls.length;
  return s.roof > 0.02 || walls > 0.45;
}

export function showsWear(place: Place) {
  const s = place.structure;
  return !!s && (conditionOf(s) < SHOWS_WEAR || s.char > 0 || s.abandoned !== undefined);
}

type Job = { place: Place; image: Phaser.GameObjects.Image };

/** Worn and decaying buildings, drawn from their own sprite by the materials
 * decay. Queued, and a few milliseconds a frame, so a shabby quarter coming
 * into view costs no hitch: the clean art shows until its worn copy is ready. */
export class StructureDecay {
  private queue: Job[] = [];
  private owned = new Set<string>();
  constructor(private scene: Phaser.Scene) {}

  request(place: Place, image: Phaser.GameObjects.Image) {
    if (!showsWear(place)) return;
    const key = this.key(place);
    if (this.scene.textures.exists(key)) this.apply(image, key);
    else this.queue.push({ place, image });
  }

  update() {
    const start = performance.now();
    while (this.queue.length && performance.now() - start < BUDGET_MS) {
      const { place, image } = this.queue.shift()!;
      if (!image.active) continue;
      const key = this.key(place);
      if (!this.scene.textures.exists(key) && !this.make(place, image, key)) continue;
      this.apply(image, key);
    }
  }

  release() {
    for (const key of this.owned) this.scene.textures.remove(key);
    this.owned.clear();
    this.queue = [];
  }

  private key(place: Place) {
    return `wear:${place.id}:${stateHash(place.structure)}`;
  }

  private make(place: Place, image: Phaser.GameObjects.Image, key: string) {
    const frame = image.frame;
    const w = frame.cutWidth,
      h = frame.cutHeight;
    if (!w || !h) return false;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(frame.source.image as CanvasImageSource, frame.cutX, frame.cutY, w, h, 0, 0, w, h);
    const seed = Math.floor(random(place.id, "wear") * 1e6);
    const d = decay(ctx.getImageData(0, 0, w, h).data, w, h, place.structure!, seed);
    const out = this.scene.textures.createCanvas(key, d.w, d.h)!;
    out.context.putImageData(new ImageData(d.data, d.w, d.h), 0, 0);
    out.refresh();
    this.owned.add(key);
    return true;
  }

  /** Same anchor as the clean art: the decay adds margin to the sides and
   * ground in front, so the origin moves by that much. */
  private apply(image: Phaser.GameObjects.Image, key: string) {
    if (image.texture.key === key) return;
    const w = image.frame.cutWidth,
      h = image.frame.cutHeight,
      ox = image.originX,
      oy = image.originY;
    image.setTexture(key);
    image.setOrigin((PAD_X + ox * w) / (w + PAD_X * 2), (oy * h) / (h + PAD_Y));
  }
}
