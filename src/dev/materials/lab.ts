import artVersion from "../../render/generated/art-version.json" with { type: "json" };
import nature from "../../../public/nature/atlas.json" with { type: "json" };
import { generateAppearance } from "../../core/character";
import { drawCharacter } from "../../render/characters/draw";
import type { CharacterPose } from "../../render/characters/poses";
import { ageStructure, conditionBand, conditionOf, fabricOf, weatherStructure } from "../../core/time/structure";
import { decay, PAD_X } from "../../render/materials/decay";
import { makeBody, Mat, Scene, type Body } from "../../render/materials/sim";

export const WORLD_W = 640;
export const WORLD_H = 320;
export type Tool = "axe" | "pick" | "spade" | "torch" | "bucket";
export const TOOLS: Tool[] = ["axe", "pick", "spade", "torch", "bucket"];

const stamp = `?v=${artVersion.stamp}`;
type Frame = { x: number; y: number; w: number; h: number };
type Sprite = { w: number; h: number; data: Uint8ClampedArray };

export const treeNames = Object.keys(nature.frames).filter((k) => !/bare|autumn/.test(k));

function image(url: string) {
  const img = new Image();
  img.src = url + stamp;
  return new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}
function crop(img: HTMLImageElement, f: Frame): Sprite {
  const c = document.createElement("canvas");
  c.width = f.w;
  c.height = f.h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
  return { w: f.w, h: f.h, data: ctx.getImageData(0, 0, f.w, f.h).data };
}

// Tools are drawn upright with the grip on the bottom row; the lab turns them.
const TOOL_ART: Record<Tool, { rows: string[]; grip: [number, number] }> = {
  axe: {
    rows: ["..mMM..", ".mMMMhw", "mMMMhhw", ".mM.h..", "....h..", "....d..", "....h..", "....d..", "....h..", "....d.."],
    grip: [4, 9],
  },
  pick: {
    rows: [".mMMMMMm.", "m...h...m", "....h....", "....d....", "....h....", "....d....", "....h....", "....d...."],
    grip: [4, 7],
  },
  spade: {
    rows: [".MMM.", ".MMM.", ".mMm.", "..h..", "..d..", "..h..", "..d..", ".hhh."],
    grip: [2, 7],
  },
  torch: {
    rows: [".ccc.", "cpcpc", ".ccc.", "..h..", "..d..", "..h..", "..d..", "..h.."],
    grip: [2, 7],
  },
  bucket: {
    rows: ["..hhh..", ".h...h.", "h.....h", "bwwwwwb", "bBBBBBb", "bBBBBBb", ".bBBBb."],
    grip: [3, 0],
  },
};
const TOOL_INK: Record<string, number[]> = {
  M: [160, 168, 176],
  m: [92, 100, 108],
  w: [222, 226, 230],
  h: [140, 92, 48],
  d: [100, 62, 30],
  c: [70, 52, 36],
  p: [30, 22, 16],
  b: [92, 62, 34],
  B: [128, 88, 50],
};

type Player = {
  x: number;
  y: number;
  dir: number;
  face: number;
  step: number;
  moving: boolean;
  swing: number;
  target: [number, number] | null;
  walkTo: [number, number] | null;
};
const SWING = 24;
const IMPACT = 10;

export class MaterialsLab {
  readonly scene = new Scene(WORLD_W, WORLD_H);
  tool: Tool = "axe";
  age = { years: 0, abandoned: false, upkeep: 0.5 };
  private buildingSheet?: Promise<{ img: HTMLImageElement; frames: Record<string, { frame: Frame }> }>;
  private natureImg = image("/nature/atlas.png");
  private buildings: { name: string; body: Body; source: Sprite; x: number; y: number }[] = [];
  private player: Player = { x: 150, y: 250, dir: 1, face: 1, step: 0, moving: false, swing: -1, target: null, walkTo: null };
  private keys = new Set<string>();
  private using = false;
  private mouse: [number, number] | null = null;
  private appearance = generateAppearance("materials-lab", 0, 30, { sex: "male" });
  private frames = new Map<string, Sprite>();
  private feet = 0;
  private image: ImageData;
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  private acc = 0;

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = WORLD_W;
    canvas.height = WORLD_H;
    this.ctx = canvas.getContext("2d")!;
    this.image = this.ctx.createImageData(WORLD_W, WORLD_H);
    const idle = this.character(2, "idle", 0);
    for (let i = 0; i < idle.w * idle.h; i++) if (idle.data[i * 4 + 3]) this.feet = (i / idle.w) | 0;
  }

  init() {
    this.raf = requestAnimationFrame(this.frame);
    void this.plantTree("nature-oak", 150, 170);
    void this.plantTree("nature-cypress", 250, 150);
    void this.plantTree("nature-olive", 340, 230);
    void this.placeBuilding("house-cottage-timber-1-urban-cottage", 500, 190);
    this.scene.pond(70, 280, 44, 22);
    this.placeOre(210, 185);
  }

  /** A boulder with iron nuggets, drawn here since the atlas has none: four
   * flat tones lit from the upper left, a dark outline, no noise. */
  placeOre(x = 40 + Math.random() * (WORLD_W - 80), base = 130 + Math.random() * 150) {
    const w = 24,
      h = 17;
    const STONE = [
      [58, 52, 60],
      [92, 86, 94],
      [124, 118, 122],
      [160, 154, 150],
      [196, 190, 180],
    ];
    const inside = (px: number, py: number) => {
      const nx = (px + 0.5 - w / 2) / (w / 2 - 0.5),
        ny = (py + 0.5 - h * 0.62) / (py < h * 0.62 ? h * 0.62 - 0.5 : h * 0.38 - 0.5);
      return nx * nx + ny * ny <= 1;
    };
    const data = new Uint8ClampedArray(w * h * 4);
    const put = (px: number, py: number, c: number[]) => data.set([c[0], c[1], c[2], 255], (py * w + px) * 4);
    for (let py = 0; py < h; py++)
      for (let px = 0; px < w; px++) {
        if (!inside(px, py)) continue;
        const edge = !inside(px - 1, py) || !inside(px + 1, py) || !inside(px, py - 1) || !inside(px, py + 1);
        if (edge) {
          put(px, py, STONE[0]);
          continue;
        }
        const nx = (px - w / 2) / (w / 2),
          ny = (py - h * 0.55) / (h * 0.55);
        const light = -0.55 * nx - 0.85 * ny;
        const tone = py >= h - 3 ? 1 : light > 0.55 ? 4 : light > 0.15 ? 3 : light > -0.35 ? 2 : 1;
        put(px, py, STONE[tone]);
      }
    // Two facet seams, so it reads as broken rock rather than a pebble.
    for (const [sx, sy, len] of [
      [9, 4, 5],
      [15, 8, 4],
    ])
      for (let k = 0; k < len; k++) if (inside(sx + k, sy + (k >> 1))) put(sx + k, sy + (k >> 1), STONE[1]);
    const NUGGET = [".oo.", "oRso", "orRo", ".oo."];
    const INK: Record<string, number[]> = { o: [72, 38, 26], r: [150, 78, 44], R: [200, 116, 62], s: [246, 214, 168] };
    const ore: number[] = [];
    for (const [ox, oy] of [
      [5, 7],
      [13, 4],
      [16, 10],
      [9, 11],
    ])
      NUGGET.forEach((row, dy) =>
        [...row].forEach((ch, dx) => {
          if (ch === "." || !inside(ox + dx, oy + dy)) return;
          put(ox + dx, oy + dy, INK[ch]);
          ore.push((oy + dy) * w + ox + dx);
        }),
      );
    const b = makeBody("building", w, h, data, Math.round(x - w / 2), Math.round(base - h));
    for (let i = 0; i < w * h; i++) if (b.mat[i]) b.mat[i] = Mat.Stone;
    for (const i of ore) b.mat[i] = Mat.Ore;
    this.scene.add(b);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  async buildingNames() {
    const { frames } = await this.sheet();
    return Object.keys(frames).filter((k) => !/-(east|north|west)$/.test(k));
  }

  private sheet() {
    return (this.buildingSheet ??= (async () => {
      const [img, json] = await Promise.all([
        image("/packs/buildings.png"),
        fetch(`/packs/buildings.json${stamp}`).then((r) => r.json()),
      ]);
      return { img, frames: json.frames };
    })());
  }

  async plantTree(name: string, x = 40 + Math.random() * (WORLD_W - 80), base = 130 + Math.random() * 150) {
    const f = (nature.frames as Record<string, { frame: Frame }>)[name]?.frame;
    if (!f) return;
    const s = crop(await this.natureImg, f);
    const b = makeBody("tree", s.w, s.h, s.data, 0, 0);
    b.x = Math.round(x - s.w / 2);
    b.y = Math.round(base - b.bottom - 1);
    b.ground = b.y + b.bottom + 1;
    this.scene.add(b);
  }

  async placeBuilding(name: string, x = 120 + Math.random() * (WORLD_W - 240), base = 150 + Math.random() * 110) {
    const { img, frames } = await this.sheet();
    const f = frames[name]?.frame;
    if (!f) return;
    const source = crop(img, f);
    const entry = { name, body: null as unknown as Body, source, x: Math.round(x - source.w / 2), y: Math.round(base - source.h) };
    this.buildings.push(entry);
    this.decay(entry);
  }

  /** The game's own structure model decides the state; the lab only draws it. */
  setAge(age: Partial<typeof this.age>) {
    Object.assign(this.age, age);
    for (const b of this.buildings) this.decay(b);
    const s = this.structure(this.buildings.at(-1)?.name ?? "house");
    return conditionBand(conditionOf(s));
  }

  private structure(name: string) {
    const { years, abandoned, upkeep } = this.age;
    const fabric = fabricOf(name);
    return abandoned
      ? ageStructure("lab", name, fabric, -50, 0, years, 0.5)
      : weatherStructure("lab", name, fabric, 0, years, upkeep);
  }

  clear() {
    this.scene.bodies = [];
    this.scene.parts = [];
    this.buildings = [];
  }

  private decay(entry: (typeof this.buildings)[number]) {
    const d = decay(entry.source.data, entry.source.w, entry.source.h, this.structure(entry.name));
    const body = makeBody("building", d.w, d.h, d.data, entry.x - PAD_X, entry.y);
    const at = this.scene.bodies.indexOf(entry.body);
    if (at >= 0) this.scene.bodies[at] = body;
    else this.scene.add(body);
    entry.body = body;
  }

  key(code: string, down: boolean) {
    if (down) this.keys.add(code);
    else this.keys.delete(code);
    if (code === "Space") this.use(down, null);
    const n = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5"].indexOf(code);
    if (down && n >= 0) this.tool = TOOLS[n];
  }

  pointer(x: number, y: number, down: boolean | null) {
    this.mouse = [x, y];
    if (down === null) return;
    if (!down) {
      this.using = false;
      return;
    }
    const p = this.player;
    const [hx, hy] = this.hand();
    if (Math.hypot(x - hx, y - hy) > 40) p.walkTo = [x - Math.sign(x - p.x || 1) * 12, y + 10];
    this.use(true, [x, y]);
  }

  private use(down: boolean, at: [number, number] | null) {
    this.using = down;
    if (!down) return;
    const p = this.player;
    if (at) p.face = Math.sign(at[0] - p.x) || p.face;
    if (p.swing < 0) {
      p.swing = SWING;
      p.target = at;
    }
  }

  private hand(): [number, number] {
    const p = this.player;
    return [p.x + p.face * 4, p.y - 11];
  }

  private character(dir: number, pose: CharacterPose, frame: number) {
    const key = `${dir}:${pose}:${frame}`;
    let s = this.frames.get(key);
    if (!s) {
      const c = document.createElement("canvas");
      c.width = c.height = 80;
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      drawCharacter(ctx, this.appearance, dir, pose, frame);
      s = { w: 80, h: 80, data: ctx.getImageData(0, 0, 80, 80).data };
      this.frames.set(key, s);
    }
    return s;
  }

  private toolAngle() {
    const p = this.player;
    const t = p.swing < 0 ? 0 : 1 - p.swing / SWING;
    const rest = { axe: 0.4, pick: 0.4, spade: 0.3, torch: 0.35, bucket: 0 }[this.tool];
    if (p.swing < 0) return rest;
    if (this.tool === "torch") return rest + Math.sin(t * Math.PI) * 0.9;
    if (this.tool === "bucket") return Math.sin(t * Math.PI) * -1.2;
    // Wind up behind the head, then drive through to past level.
    return t < 0.35 ? rest - (t / 0.35) * 2 : -1.6 + ((t - 0.35) / 0.65) * 3.4;
  }

  /** The torch head in world space, where its flame sits. */
  private tip(): [number, number] {
    const [hx, hy] = this.hand();
    const a = this.toolAngle() * this.player.face;
    return [hx + Math.sin(a) * 7, hy - Math.cos(a) * 7];
  }

  private tick() {
    const p = this.player;
    let dx = 0,
      dy = 0;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) dx--;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) dx++;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) dy--;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) dy++;
    if (dx || dy) p.walkTo = null;
    else if (p.walkTo) {
      const ex = p.walkTo[0] - p.x,
        ey = p.walkTo[1] - p.y;
      if (Math.hypot(ex, ey) < 1.5) p.walkTo = null;
      else {
        dx = Math.sign(ex) * Math.min(1, Math.abs(ex));
        dy = Math.sign(ey) * Math.min(1, Math.abs(ey));
      }
    }
    p.moving = !!(dx || dy) && (p.swing < 0 || !!p.walkTo);
    if (p.moving) {
      const len = Math.hypot(dx, dy);
      p.x = Math.max(10, Math.min(WORLD_W - 10, p.x + (dx / len) * 0.9));
      p.y = Math.max(30, Math.min(WORLD_H - 2, p.y + (dy / len) * 0.9));
      if (dx) p.face = Math.sign(dx);
      p.dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0;
      p.step++;
    }
    if (p.swing >= 0 && !p.walkTo) {
      if (p.dir === 0 || p.dir === 2) p.dir = p.face > 0 ? 1 : 3;
      p.swing--;
      if (p.swing === IMPACT) this.impact();
      if (p.swing < 0 && this.using && (this.tool === "axe" || this.tool === "pick" || this.tool === "spade")) {
        p.swing = SWING;
        if (p.target && this.mouse) p.target = this.mouse;
      }
    }
    if (this.tool === "torch") {
      const [tx, ty] = this.tip();
      this.scene.flameAt(tx, ty - 1);
      this.scene.heatAt(Math.round(tx), Math.round(ty - 2), 1, 0.03);
      if (this.using) {
        const at = this.mouse && p.target ? this.mouse : ([tx + p.face * 3, ty] as [number, number]);
        if (Math.hypot(at[0] - tx, at[1] - ty) < 40) this.scene.heatAt(Math.round(at[0]), Math.round(at[1]), 2, 0.06);
      }
    }
    this.scene.step();
  }

  private impact() {
    const p = this.player;
    const [hx, hy] = this.hand();
    const at = p.target ?? [hx + p.face * 6, hy + 1];
    if (this.tool === "axe" || this.tool === "pick") this.scene.chop(at[0], at[1], p.face, this.tool);
    else if (this.tool === "spade") this.scene.dig(p.target?.[0] ?? p.x + p.face * 12, p.target?.[1] ?? p.y, 8);
    else if (this.tool === "bucket") this.scene.spawnWater(hx, hy - 4, p.face, p.y);
  }

  private draw() {
    const p = this.player;
    const out = this.image.data;
    const pose: CharacterPose =
      p.swing >= 0
        ? ({ axe: "chop", pick: "chop", spade: "dig", torch: "thrust", bucket: "swing" }[this.tool] as CharacterPose)
        : p.moving
          ? "walk"
          : "idle";
    const frame = p.swing >= 0 ? Math.min(3, ((1 - p.swing / SWING) * 4) | 0) : p.moving ? ((p.step / 8) | 0) % 4 : 0;
    const sprite = this.character(p.dir, pose, frame);
    this.scene.render(out, [
      {
        depth: p.y,
        draw: (o) => {
          const behind = p.dir === 0;
          if (behind) this.drawTool(o);
          blit(o, sprite, Math.round(p.x) - 40, Math.round(p.y) - this.feet - 1);
          if (!behind) this.drawTool(o);
        },
      },
    ]);
    this.ctx.putImageData(this.image, 0, 0);
  }

  private drawTool(out: Uint8ClampedArray) {
    const art = TOOL_ART[this.tool];
    const [hx, hy] = this.hand();
    const a = this.toolAngle() * this.player.face;
    const c = Math.cos(a),
      s = Math.sin(a);
    const rows = art.rows,
      w = rows[0].length,
      h = rows.length;
    for (let Y = Math.floor(hy - 14); Y <= hy + 14; Y++)
      for (let X = Math.floor(hx - 14); X <= hx + 14; X++) {
        if (X < 0 || Y < 0 || X >= WORLD_W || Y >= WORLD_H) continue;
        const dx = X + 0.5 - hx,
          dy = Y + 0.5 - hy;
        let lx = Math.floor(c * dx + s * dy + art.grip[0] + 0.5);
        const ly = Math.floor(-s * dx + c * dy + art.grip[1] + 0.5);
        if (this.player.face < 0) lx = 2 * art.grip[0] - lx;
        if (lx < 0 || ly < 0 || lx >= w || ly >= h) continue;
        const ink = TOOL_INK[rows[ly][lx]];
        if (!ink) continue;
        out.set(ink, (Y * WORLD_W + X) * 4);
      }
  }

  private frame = (now: number) => {
    this.acc += Math.min(100, now - (this.last || now));
    this.last = now;
    while (this.acc >= 1000 / 60) {
      this.tick();
      this.acc -= 1000 / 60;
    }
    this.draw();
    this.raf = requestAnimationFrame(this.frame);
  };
}

function blit(out: Uint8ClampedArray, s: Sprite, x0: number, y0: number) {
  for (let y = 0; y < s.h; y++) {
    const Y = y0 + y;
    if (Y < 0 || Y >= WORLD_H) continue;
    for (let x = 0; x < s.w; x++) {
      const X = x0 + x;
      if (X < 0 || X >= WORLD_W) continue;
      const q = (y * s.w + x) * 4;
      if (s.data[q + 3] < 128) continue;
      out.set(s.data.subarray(q, q + 3), (Y * WORLD_W + X) * 4);
    }
  }
}
