import { box, drum } from "../ship/things";
import { exhibitIcon, exhibitItem, stamp } from "./items";
import { paintPalaceDecor } from "./palace";
import { fairById, fairFind } from "../../content/fairs";
import { louisQuatorze, type PalaceStyle } from "../../content/palaces/styles";
import { hash } from "../../core/random";
import { paintMachine, type MachineKind } from "../machines";
import { h2, Raster } from "../ship/raster";
import { MACHINES, type FairCase } from "../../world/fair";

/** A sprite for a cell-sized thing: its footprint's top-left sits at (ox, oy) in the raster. */
/** `frames`, when there are any, are a loop played at `fps`; `r` is the first. */
export type FairSprite = { r: Raster; ox: number; oy: number; glow?: { x: number; y: number }[]; frames?: Raster[]; fps?: number };

const WOOD = ["#e4b47e", "#c8925e", "#a47044", "#7c5030", "#56361e"];
const DARKWOOD = ["#a8704c", "#86543a", "#683e2a", "#4c2c1e", "#321c14"];
const BRASS = ["#fff4b8", "#f0c860", "#c48e30", "#8a5c22", "#563818"];
const IRON = ["#8a96a4", "#5e6874", "#3e4650", "#2a3038", "#1a1e24"];
const GREEN = ["#a8cc8c", "#78a85e", "#568a44", "#3c6a32", "#264a22"];
const STONE = ["#faf6ee", "#e6dfd2", "#cdc4b2", "#a89e8c", "#7a7062"];
const GLASS = ["#f4fbfd", "#d4ecf2", "#a8d0de", "#7aaabe", "#56869c"];
const RED = ["#f8a088", "#e0604a", "#b43e34", "#842a28", "#521c1c"];
const LEAF = [
  ["#c4e07c", "#94c45a", "#6ea444", "#4e8234", "#386228", "#24441c"],
  ["#d4e284", "#a8c862", "#82aa48", "#5e8a38", "#42682a", "#2a4a1e"],
  ["#a8d27a", "#78b452", "#56963e", "#3e7830", "#2c5a24", "#1c3e18"],
];
const BARK = ["#c8b49a", "#a08a70", "#7c6650", "#5a4838", "#3c3026"];

/** Five steps of a tint, light to dark. */
function ramp(hex: string) {
  const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const step = (k: number) => "#" + c.map((v) => Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)).toString(16).padStart(2, "0")).join("");
  return [step(0.45), step(0.18), step(0), step(-0.28), step(-0.5)];
}

/** Lit from the upper left by its normal: a round clump of `r` px, as a tone index 0 (lit) to 3. */
const lit = (dx: number, dy: number, r: number) => {
  const k = (-dx * 0.7 - dy) / r;
  return k > 0.55 ? 0 : k > 0.05 ? 1 : k > -0.45 ? 2 : 3;
};

function placard(r: Raster, x: number, y: number) {
  r.fill(x + 3, y + 4, 1, 5, DARKWOOD[3]);
  r.fill(x, y, 8, 5, STONE[0]);
  r.fill(x, y + 4, 8, 1, STONE[3]);
  r.fill(x + 1, y + 1, 5, 1, IRON[2]);
  r.fill(x + 1, y + 3, 4, 1, IRON[0]);
}

/** A working machine from the shared kit, as a sprite whose frames the view plays. */
function machine(kind: MachineKind, w: number, h: number, v: number): FairSprite {
  const m = paintMachine(kind, w, h, v);
  return { r: m.frames[0], ox: m.ox, oy: m.oy, frames: m.frames, fps: m.fps };
}

export function paintFairCase(display: FairCase) {
  const cabinet = paintFairThing("vitrine", display.w, 1, (hash(display.name) % 3) / 3, undefined, true, undefined, false)!;
  const columns = display.finds.length > 2 ? 2 : display.finds.length;
  const gap = Math.floor((display.w * 16 - columns * 16) / (columns + 1));
  const items = display.finds.map((f, i) => {
    const art = f.catalog!, row = Math.floor(i / columns);
    const x = display.finds.length === 3 && row ? display.w * 8 - 8 : gap + i % columns * (16 + gap);
    return { r: exhibitIcon(art.icon!, art.variant ?? (hash(f.id) % 6) / 6), ox: -x, oy: columns < display.finds.length ? 24 - row * 16 : 16, id: `${display.id}#${i}` };
  });
  return { cabinet, items };
}

export function paintFairThing(art: string, w: number, h: number, v: number, tint?: string, labelled = true, style?: PalaceStyle, stocked = true): FairSprite | undefined {
  const W = w * 16, H = h * 16, pad = 8;
  const make = (rise: number): FairSprite & { X: number; Y: number } => ({ r: new Raster(W + pad * 2, H + rise + pad + 4), ox: pad, oy: rise, X: pad, Y: rise });
  const t = tint ? ramp(tint) : undefined;
  const done = (s: FairSprite & { X: number; Y: number }, card = true) => {
    if (card && labelled) placard(s.r, s.X + 1, s.Y + H - 2);
    s.r.finish();
    return s;
  };
  const ground = (s: { r: Raster; X: number; Y: number }) => s.r.shadow(s.X + W / 2 + 2, s.Y + H - 3, W / 2 + 2, 5, 0.28);
  switch (art) {
    case "hollerith": {
      const r = new Raster(48, 34);
      r.fill(2, 2, 26, 30, DARKWOOD[4]);
      r.fill(3, 2, 24, 2, WOOD[1]);
      r.fill(3, 4, 23, 24, DARKWOOD[1]);
      r.fill(5, 5, 19, 22, IRON[3]);
      r.fill(4, 28, 23, 3, DARKWOOD[2]);
      for (let y = 8; y < 26; y += 5) for (let x = 8; x < 23; x += 5) {
        r.fill(x - 1, y - 1, 3, 3, BRASS[2]);
        r.set(x, y, STONE[0]);
        r.set(x + 1, y, BRASS[4]);
      }
      r.fill(10, 25, 9, 2, BRASS[2]);
      r.fill(29, 27, 17, 5, DARKWOOD[4]);
      r.fill(30, 26, 15, 3, DARKWOOD[1]);
      r.fill(32, 24, 10, 3, BRASS[2]);
      r.fill(32, 20, 2, 5, BRASS[3]);
      r.fill(32, 19, 11, 2, BRASS[1]);
      r.fill(40, 18, 5, 2, IRON[4]);
      r.fill(34, 25, 7, 4, STONE[1]);
      for (const x of [35, 37, 39]) r.set(x, 26, DARKWOOD[3]);
      r.finish();
      return { r, ox: 0, oy: 40 };
    }
    case "remington": {
      const r = new Raster(32, 26);
      r.fill(4, 15, 24, 9, IRON[4]);
      r.fill(6, 11, 20, 7, IRON[3]);
      r.fill(8, 12, 16, 2, IRON[1]);
      r.fill(4, 16, 24, 5, IRON[2]);
      r.fill(8, 22, 16, 1, BRASS[2]);
      r.fill(2, 8, 28, 4, IRON[4]);
      r.fill(4, 8, 24, 1, IRON[0]);
      r.fill(9, 1, 14, 8, STONE[0]);
      r.fill(21, 1, 2, 7, STONE[2]);
      r.fill(11, 5, 8, 1, STONE[3]);
      r.fill(11, 7, 5, 1, STONE[3]);
      r.set(2, 7, BRASS[2]);
      for (let x = 7; x < 27; x += 3) {
        r.set(x, 16, STONE[0]);
        r.set(x - 1, 18, STONE[1]);
        r.set(x, 20, STONE[2]);
      }
      r.finish();
      return { r, ox: 0, oy: 32 };
    }
    case "filter": {
      const r = new Raster(32, 36), clay = v < 0.5 ? ["#e6ba75", "#c28c4c", "#9b6339", "#72462d", "#4b3228"] : STONE;
      drum(r, 15, 34, 8, 2, 4, clay);
      drum(r, 15, 29, 10, 3, 18, clay);
      for (const y of [14, 24]) {
        r.fill(6, y, 18, 2, "#426777");
        r.fill(7, y, 14, 1, "#7196a0");
      }
      for (const x of [8, 12, 16, 20]) {
        r.set(x, 19, clay[0]);
        r.set(x + 1, 18, clay[0]);
        r.set(x + 1, 20, clay[3]);
      }
      drum(r, 15, 12, 10, 3, 3, clay);
      drum(r, 15, 8, 7, 2, 3, clay);
      drum(r, 15, 5, 2, 1, 3, clay);
      r.fill(22, 27, 6, 3, BRASS[3]);
      r.fill(22, 27, 6, 1, BRASS[1]);
      r.fill(26, 28, 3, 4, BRASS[2]);
      r.set(26, 26, BRASS[0]);
      r.finish();
      return { r, ox: 0, oy: 20 };
    }
    case "vitrine": {
      if (!stocked) {
        const s = make(36), { r, X, Y } = s, back = Y - (w >= 4 ? 27 : 19);
        const oak = ["#c7a179", "#a37c58", "#80593f", "#5e3d30", "#3c2930"];
        const felt = [["#84958b", "#667d72", "#4a6059"], ["#a78388", "#87616e", "#624956"], ["#858b9f", "#636d86", "#464f68"]][Math.floor(v * 3) % 3];
        ground(s);
        r.fill(X, back + 1, W, Y + 14 - back, oak[3]);
        r.fill(X + 1, back, W - 2, Y + 10 - back, oak[1]);
        r.fill(X + 2, back + 1, W - 4, 1, oak[0]);
        r.fill(X + 3, back + 3, W - 6, Y + 7 - back - 3, oak[4]);
        r.fill(X + 5, back + 5, W - 10, Y + 5 - back - 5, felt[1]);
        r.fill(X + 5, back + 5, W - 10, 1, felt[2]);
        r.fill(X + 5, Y + 4, W - 10, 1, felt[0]);
        r.fill(X + 1, Y + 9, W - 2, 3, oak[0]);
        r.fill(X + 2, Y + 12, W - 4, 6, oak[2]);
        for (let x = X + 4; x < X + W - 6; x += 20) {
          const width = Math.min(16, X + W - 4 - x);
          r.fill(x, Y + 14, width, 3, oak[3]);
          r.fill(x + 1, Y + 15, width - 2, 1, oak[1]);
        }
        r.fill(X + 1, Y + 18, W - 2, 2, oak[4]);
        for (const x of [X + 3, X + W - 7]) {
          r.fill(x, Y + 20, 4, 2, oak[3]); r.set(x, Y + 20, oak[1]);
        }
        r.fill(X + (W >> 1) - 5, Y + 11, 10, 3, BRASS[3]);
        r.fill(X + (W >> 1) - 4, Y + 11, 8, 1, BRASS[1]);
        r.fill(X + 3, back + 2, W - 6, 1, "#abc2bd");
        r.fill(X + 3, back + 3, 1, Y + 6 - back - 3, "#9eafa9");
        r.fill(X + W - 4, back + 3, 1, Y + 6 - back - 3, "#6d8987");
        r.fill(X + 4, Y + 6, W - 8, 1, "#c2cdc2");
        for (let i = 0; i < 4; i++) r.set(X + 6 + i, back + 7 + i, "#b7cac1");
        return done(s, false);
      }
      // A long glazed case on a cabinet, its goods laid out in a row behind the glass.
      const s = make(30), { r, X, Y } = s, goods = t ?? BRASS;
      ground(s);
      box(r, X + 1, Y + 1, W - 2, H - 8, 10, DARKWOOD, DARKWOOD);
      for (let x = X + 6; x < X + W - 6; x += 12) r.fill(x, Y + H - 5, 8, 3, DARKWOOD[1]);
      const gy = Y - 16, glassH = Y + 2 - gy;
      r.fill(X + 2, gy, W - 4, glassH, GLASS[2]);
      r.fill(X + 2, gy, W - 4, 7, GLASS[1]);
      for (let i = 0; i < W - 10; i += 7) {
        const x = X + 6 + i, kind = Math.floor(h2(i, 3, Math.floor(v * 97)) * 4);
        if (kind === 0) for (let k = 0; k < 4; k++) r.fill(x + k, gy + 6 + (k % 2), 1, 9, goods[k % 2 ? 1 : 2]);
        else if (kind === 1) { r.fill(x, gy + 9, 5, 5, goods[1]); r.fill(x + 1, gy + 8, 3, 1, goods[0]); r.fill(x, gy + 13, 5, 1, goods[3]); }
        else if (kind === 2) { drum(r, x + 2, gy + 14, 2, 1, 7, goods); }
        else { r.fill(x, gy + 11, 6, 3, goods[2]); r.fill(x, gy + 11, 6, 1, goods[0]); }
      }
      r.fill(X + 2, gy - 1, W - 4, 1, BRASS[1]); r.fill(X + 2, Y + 1, W - 4, 1, BRASS[2]);
      for (const x of [X + 2, X + W - 3, X + (W >> 1)]) r.fill(x, gy - 1, 1, glassH + 1, BRASS[2]);
      for (let k = 0; k < 6; k++) r.set(X + 6 + k, gy + 1 + k, "#ffffff"), r.set(X + 7 + k, gy + 1 + k, GLASS[0]);
      return done(s);
    }
    case "counter": {
      const s = make(18), { r, X, Y } = s, goods = t ?? RED;
      ground(s);
      box(r, X + 1, Y - 2, W - 2, H - 4, 10, WOOD, DARKWOOD);
      for (let i = 0; i < W - 10; i += 6) {
        const x = X + 5 + i;
        r.fill(x, Y - 7, 5, 5, goods[2]); r.fill(x, Y - 7, 5, 1, goods[0]); r.fill(x + 4, Y - 6, 1, 4, goods[3]);
      }
      r.fill(X + 1, Y + H - 9, W - 2, 2, goods[1]);
      return done(s);
    }
    case "bales": case "sacks": {
      // Jute sacks or banded bales piled on a pallet: each a rounded bulk lit on its upper left.
      const s = make(26), { r, X, Y } = s, jute = ["#ecd8ac", "#d6bc88", "#b89a66", "#8e7448", "#5e4c32"];
      const c = art === "bales" ? (t ?? ["#fbf6ea", "#ece0c8", "#d4c4a4", "#ac9c7c", "#7a6c54"]) : jute;
      ground(s);
      box(r, X + 1, Y + H - 9, W - 2, 3, 4, WOOD, DARKWOOD);
      const lump = (cx: number, foot: number, rx: number, ry: number) => {
        for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) {
          const q = (i * i) / (rx * rx) + (j * j) / (ry * ry);
          if (art === "bales" ? Math.max(Math.abs(i) / rx, Math.abs(j) / ry) > 1 || q > 1.5 : q > 1) continue;
          const k = -i / rx * 0.8 - j / ry;
          r.set(cx + i, foot - ry + j, c[k > 0.7 ? 0 : k > -0.1 ? 1 : k > -0.8 ? 2 : 3]);
        }
        r.fill(cx - rx + 1, foot, rx * 2 - 1, 1, c[4]);
        if (art === "bales") for (const dx of [-rx / 2, rx / 2]) r.fill(cx + dx, foot - ry * 2, 1, ry * 2, IRON[2]);
        else { r.fill(cx - 1, foot - ry * 2 - 2, 3, 3, c[2]); r.set(cx, foot - ry * 2 - 3, c[1]); r.fill(cx - 3, foot - ry - 1, 6, 1, t ? t[2] : RED[2]); }
      };
      const n = Math.max(2, Math.floor((W - 4) / 11));
      for (let k = 0; k < n; k++) lump(X + 7 + k * 11, Y + H - 13, 5, 5);
      for (let k = 0; k < n - 1; k++) lump(X + 12 + k * 11, Y + H - 21, 5, 5);
      for (let k = 0; k < n; k++) lump(X + 7 + k * 11 + 2, Y + H - 6, 5, 4);
      return done(s);
    }
    case "barrels": {
      const s = make(20), { r, X, Y } = s;
      ground(s);
      for (let k = 0; k < Math.max(3, W / 8); k++) {
        const x = X + 5 + k * 8, foot = Y + H - 3 - (k % 2) * 3;
        drum(r, x, foot, 4, 2, 12, WOOD, DARKWOOD);
        r.fill(x - 4, foot - 3, 9, 1, IRON[2]); r.fill(x - 4, foot - 10, 9, 1, IRON[2]);
      }
      if (t) for (let k = 0; k < 3; k++) drum(r, X + W - 8 - k * 4, Y + 2, 1, 1, 7, t);
      return done(s);
    }
    case "ingots": {
      const s = make(14), { r, X, Y } = s, metal = t ?? BRASS;
      ground(s);
      box(r, X + 1, Y + 1, W - 2, H - 6, 6, STONE, STONE);
      for (let i = 0; i < W - 10; i += 5) for (let j = 0; j < 3; j++) {
        const x = X + 4 + i + j * 2, y = Y - 3 - j * 3;
        r.fill(x, y, 5, 3, metal[1]); r.fill(x, y, 5, 1, metal[0]); r.fill(x + 4, y + 1, 1, 2, metal[3]);
      }
      return done(s);
    }
    case "statue": {
      const s = make(50), { r, X, Y } = s, m = t ?? (v < 0.5 ? STONE : ["#9ac4b0", "#6a9a86", "#4e7c68", "#36604e", "#224434"]);
      ground(s);
      box(r, X + 1, Y - 4, W - 2, 6, 14, STONE, STONE);
      const cx = X + W / 2;
      // A standing figure in drapery, lit from the upper left.
      [
        "....0112....", "...001122...", "...011123...", "...011123...", "....1123....", "....112.....",
        "..00111223..", ".0001112233.", ".00111122334", "0011.1122.34", "001..1122.34", "01...1122.33",
        "01..01122.23", "11..011223.3", ".1..0112233.", "....0112233.", "...00112233.", "...00112233.",
        "...01112233.", "...01212323.", "...01212323.", "...01212323.", "..001212323.", "..001212323.",
        "..0012123233", "..0112123233", "..0112223233", ".00112223333", ".01122233334",
      ].forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== ".") r.set(cx - 6 + i, Y - 33 + j, m[+ch]); }));
      return done(s);
    }
    case "strongbox": return paintPalaceDecor("arca", v, style);
    case "axe": {
      // A polished stone axe head laid on a folded hide, on a block of wood.
      const s = make(14), { r, X, Y } = s, m = t ?? STONE, cx = X + W / 2;
      ground(s);
      box(r, X + 2, Y - 2, W - 4, 5, 9, WOOD, DARKWOOD);
      r.fill(X + 1, Y - 3, W - 2, 3, "#c8a880"); r.fill(X + 1, Y - 3, W - 2, 1, "#e0c49c"); r.fill(X + 1, Y, W - 2, 1, "#9a7c58");
      for (let j = 0; j < 11; j++) { const hw = j < 2 ? 1 : j < 8 ? 2 + (j >> 2) : 4; r.fill(cx - hw, Y - 13 + j, hw * 2, 1, m[2]); r.set(cx - hw, Y - 13 + j, m[0]); r.set(cx - hw + 1, Y - 13 + j, m[1]); r.set(cx + hw - 1, Y - 13 + j, m[3]); }
      r.fill(cx - 4, Y - 2, 8, 1, m[1]);
      return done(s, false);
    }
    case "throne": {
      // A gilt armchair under a crimson canopy, on a carpeted dais of two steps.
      const s = make(46), { r, X, Y } = s, cx = X + W / 2, crim = ["#e06a70", "#b83a46", "#8a2834", "#5e1a24"];
      ground(s);
      box(r, X + 1, Y + 8, W - 2, 12, 6, crim, crim); box(r, X + 7, Y + 2, W - 14, 10, 5, crim, crim);
      for (let x = X + 2; x < X + W - 2; x += 2) r.set(x, Y + 25, BRASS[1]);
      r.fill(cx - 15, Y - 44, 30, 8, crim[1]); r.fill(cx - 15, Y - 44, 30, 1, BRASS[0]); for (let x = cx - 15; x < cx + 15; x++) r.set(x, Y - 36 + (x % 4 < 2 ? 0 : 1), BRASS[1]);
      r.fill(cx - 13, Y - 36, 26, 34, crim[2]); for (let x = cx - 11; x < cx + 12; x += 5) r.fill(x, Y - 34, 1, 30, crim[3]);
      for (const x of [cx - 15, cx + 13]) r.fill(x, Y - 36, 2, 40, BRASS[2]), r.fill(x, Y - 36, 1, 40, BRASS[0]);
      r.fill(cx - 8, Y - 26, 16, 20, BRASS[1]); r.fill(cx - 8, Y - 26, 16, 1, BRASS[0]); r.fill(cx - 6, Y - 23, 12, 14, crim[1]); r.fill(cx - 2, Y - 30, 4, 4, BRASS[0]);
      box(r, cx - 9, Y - 8, 18, 4, 5, crim, BRASS);
      for (const x of [cx - 10, cx + 8]) r.fill(x, Y - 12, 2, 12, BRASS[2]);
      return done(s, false);
    }
    case "state-bed": {
      // A bed of state: crimson hangings from a gilt tester, a white bolster, and the gilded rail that keeps the court back.
      const s = make(40), { r, X, Y } = s, crim = ["#e06a70", "#b83a46", "#8a2834", "#5e1a24"];
      ground(s);
      r.fill(X + 3, Y - 38, W - 6, 10, crim[1]); r.fill(X + 3, Y - 38, W - 6, 2, BRASS[0]); for (let x = X + 3; x < X + W - 3; x++) r.set(x, Y - 28 + (x % 4 < 2 ? 0 : 1), BRASS[1]);
      for (const x of [X + 3, X + W - 9]) { r.fill(x, Y - 28, 6, 46, crim[2]); r.fill(x, Y - 28, 2, 46, crim[1]); r.fill(x + 5, Y - 28, 1, 46, crim[3]); }
      r.fill(X + 9, Y - 28, W - 18, 22, crim[3]);
      box(r, X + 8, Y - 6, W - 16, 20, 8, ["#fffaf0", "#f2e9d6", "#dccfb4", "#b8a888", "#8a7a60"], crim);
      r.fill(X + 10, Y - 5, W - 20, 6, "#ffffff"); r.fill(X + 10, Y, W - 20, 1, "#d8d0c0");
      r.fill(X + 9, Y + 4, W - 18, 9, crim[1]); r.fill(X + 9, Y + 4, W - 18, 1, crim[0]); for (let x = X + 12; x < X + W - 10; x += 6) r.fill(x, Y + 6, 2, 2, BRASS[1]);
      const ry = Y + H - 14;
      r.fill(X, ry, W, 2, BRASS[0]); r.fill(X, ry + 9, W, 2, BRASS[2]); for (let x = X + 1; x < X + W; x += 4) r.fill(x, ry + 2, 2, 7, BRASS[1]);
      return done(s, false);
    }
    case "bath": {
      const s = make(18), { r, X, Y } = s;
      const en = t ?? (v < 1 / 3 ? STONE : v < 2 / 3 ? ["#efc5a0", "#ce9367", "#ac7048", "#805036", "#56372c"] : IRON);
      ground(s);
      const cx = X + W / 2, foot = Y + H - 8, rx = W / 2 - 4, ry = H / 2 - 6;
      drum(r, cx, foot, rx, ry, 8, en);
      drum(r, cx, foot - 8, rx - 3, ry - 2, 0, [en[0], en[2], en[3], en[3], en[4]]);
      drum(r, cx, foot - 7, rx - 5, ry - 4, 0, GLASS);
      for (const x of [X + 9, X + W - 11]) {
        r.fill(x, Y + H - 1, 3, 4, BRASS[3]); r.set(x, Y + H - 1, BRASS[0]);
      }
      r.fill(X + 8, Y + 2, 2, 13, BRASS[2]); r.fill(X + 8, Y + 2, 1, 13, BRASS[0]);
      r.fill(X + 8, Y + 2, 7, 2, BRASS[1]); r.fill(X + 13, Y + 4, 2, 4, BRASS[3]);
      for (const x of [X + 5, X + 11]) drum(r, x, Y + 7, 2, 1, 2, BRASS);
      return done(s);
    }
    case "basin": {
      const s = make(32), { r, X, Y } = s, cx = X + W / 2;
      const enamel = t ?? (v < 0.5 ? STONE : ["#e6c6ab", "#ca9a75", "#a67555", "#80563e", "#543c31"]);
      ground(s);
      if (Math.floor(v * 6) % 2 === 0) {
        box(r, X + 4, Y - 7, W - 8, 10, 18, WOOD, DARKWOOD);
        for (const x of [X + 6, X + W - 8]) r.fill(x, Y + 21, 2, 3, DARKWOOD[3]);
        r.fill(cx, Y + 8, 1, 12, DARKWOOD[4]); r.set(cx - 3, Y + 11, BRASS[1]); r.set(cx + 3, Y + 11, BRASS[1]);
      } else {
        drum(r, cx, Y + 14, 7, 3, 3, enamel);
        drum(r, cx, Y + 11, 4, 2, 18, enamel);
      }
      drum(r, cx, Y - 4, W / 2 - 4, 6, 6, enamel);
      drum(r, cx, Y - 10, W / 2 - 7, 4, 0, GLASS);
      r.fill(cx + 6, Y - 18, 2, 8, BRASS[2]); r.fill(cx + 2, Y - 18, 6, 2, BRASS[1]);
      r.fill(cx + 2, Y - 16, 1, 3, BRASS[2]); r.set(cx + 6, Y - 19, BRASS[0]);
      return done(s);
    }
    case "stove": {
      const s = make(40), { r, X, Y } = s;
      const metal = t ?? (v < 0.5 ? IRON : ["#a1b2a6", "#758f80", "#516c60", "#374e46", "#253b36"]);
      const shape = Math.floor(v * 6) % 3, cx = X + W / 2;
      ground(s);
      if (shape === 2) {
        drum(r, cx, Y + H - 8, W / 2 - 5, 7, 29, metal);
        drum(r, cx, Y - 7, 4, 2, 11, metal);
        box(r, cx - 6, Y + 6, 12, 1, 9, metal, IRON);
        r.fill(cx - 3, Y + 9, 6, 4, "#b06a42"); r.set(cx + 4, Y + 11, BRASS[1]);
      } else {
        box(r, X + 2, Y - 8, W - 4, H - 8, 18, metal, metal);
        for (const x of [X + 9, X + W - 10]) for (const y of [Y - 2, Y + 8]) drum(r, x, y, 4, 2, 1, IRON);
        box(r, X + 6, Y + H - 21, W - 12, 1, 12, metal, IRON);
        r.fill(X + 8, Y + H - 18, W - 16, 1, BRASS[1]);
        if (shape === 0) for (let x = X + 8; x < X + W - 7; x += 3) {
          r.fill(x, Y + H - 15, 2, 5, "#b06a42"); r.set(x, Y + H - 14, "#e8bc6b");
        }
      }
      return done(s);
    }
    case "chair": {
      const s = make(40), { r, X, Y } = s, m = t ?? (v < 0.5 ? WOOD : DARKWOOD);
      ground(s);
      box(r, X + 5, Y - 25, W - 10, 4, 22, m, m);
      r.fill(X + 8, Y - 18, W - 16, 15, v < 0.5 ? "#6e7771" : "#735364");
      box(r, X + 3, Y - 1, W - 6, H - 5, 4, m, m);
      for (const x of [X + 4, X + W - 7]) {
        r.fill(x, Y + H - 2, 3, 8, m[3]); r.fill(x, Y + H - 2, 1, 7, m[0]);
      }
      for (const x of [X + 2, X + W - 4]) r.fill(x, Y - 5, 3, H - 1, m[2]);
      return done(s);
    }
    case "mattress": {
      const s = make(16), { r, X, Y } = s, cover = t ?? (v < 0.5 ? STONE : ["#b4c0ba", "#96a89f", "#798b84", "#5d7068", "#40534c"]);
      ground(s);
      box(r, X + 2, Y + 2, W - 4, H - 8, 7, WOOD, DARKWOOD);
      box(r, X + 3, Y - 1, W - 6, H - 8, 6, cover, cover);
      for (let x = X + 7; x < X + W - 4; x += 6) r.fill(x, Y + 1, 1, H - 11, cover[3]);
      for (let y = Y + 4; y < Y + H - 10; y += 6) for (let x = X + 7; x < X + W - 4; x += 6) r.set(x, y, cover[0]);
      for (const x of [X + 4, X + W - 7]) r.fill(x, Y + H + 1, 3, 3, DARKWOOD[3]);
      return done(s);
    }
    case "hallclock": {
      const s = make(56), { r, X, Y } = s, m = t ?? (v < 0.5 ? WOOD : DARKWOOD), cx = X + W / 2;
      ground(s);
      box(r, X + 2, Y - 44, W - 4, 7, 51, m, m);
      r.fill(X, Y - 46, W, 3, m[2]); r.fill(X + 1, Y - 46, W - 2, 1, m[0]);
      drum(r, cx, Y - 27, 5, 5, 0, BRASS); drum(r, cx, Y - 27, 4, 4, 0, STONE);
      r.fill(cx, Y - 30, 1, 4, IRON[3]); r.fill(cx, Y - 27, 3, 1, IRON[3]);
      r.fill(X + 4, Y - 17, W - 8, 23, IRON[3]); r.fill(X + 5, Y - 16, 1, 20, GLASS[3]);
      r.fill(cx, Y - 16, 1, 18, BRASS[1]); drum(r, cx, Y + 2, 3, 2, 1, BRASS);
      r.fill(X, Y + 14, W, 3, m[3]); r.fill(X + 1, Y + 14, W - 2, 1, m[1]);
      return done(s);
    }
    case "cupboard": {
      const s = make(52), { r, X, Y } = s, m = t ?? (v < 0.5 ? WOOD : DARKWOOD), tall = Math.floor(v * 6) % 2 === 0;
      const top = Y - (tall ? 34 : 20), height = tall ? 40 : 26;
      ground(s);
      box(r, X + 3, top, W - 6, 9, height, m, m);
      r.fill(X + 1, top - 2, W - 2, 3, m[1]); r.fill(X + 2, top - 2, W - 4, 1, m[0]);
      const mid = X + W / 2;
      for (const x of [X + 6, mid + 2]) {
        r.fill(x, top + 13, W / 2 - 8, height - 8, m[3]);
        r.fill(x + 1, top + 14, W / 2 - 10, height - 10, m[2]);
      }
      r.fill(mid, top + 10, 1, height - 2, m[4]);
      for (const x of [mid - 3, mid + 3]) drum(r, x, top + 12 + height / 2, 1, 1, 1, BRASS);
      for (const x of [X + 4, X + W - 7]) r.fill(x, Y + 16, 3, 4, m[3]);
      return done(s);
    }
    case "tank": {
      const s = make(42), { r, X, Y } = s, m = t ?? (v < 1 / 3 ? IRON : v < 2 / 3 ? ["#e8bc8f", "#ca9164", "#a36e48", "#775036", "#503a2c"] : STONE);
      ground(s);
      if (Math.floor(v * 6) % 2) {
        drum(r, X + W / 2, Y + H - 7, W / 2 - 5, 8, 33, m);
        for (const y of [Y - 1, Y + 18]) r.fill(X + 6, y, W - 12, 2, IRON[2]);
        drum(r, X + W / 2, Y - 8, 3, 2, 5, m);
      } else {
        box(r, X + 3, Y - 14, W - 6, H - 10, 24, m, m);
        r.fill(X + 3, Y - 15, W - 6, 2, m[0]);
        for (const x of [X + 6, X + W - 7]) for (const y of [Y + 11, Y + 26]) r.set(x, y, m[0]);
      }
      r.fill(X + W - 7, Y + H - 9, 8, 3, BRASS[2]); r.fill(X + W - 1, Y + H - 7, 3, 7, BRASS[3]);
      r.fill(X + W - 7, Y + H - 10, 6, 1, BRASS[0]);
      return done(s);
    }
    case "toilet": {
      const s = make(32), { r, X, Y } = s, cx = X + W / 2, enclosed = Math.floor(v * 6) % 2 === 0;
      const m = t ?? STONE;
      ground(s);
      box(r, X + 6, Y - 11, W - 12, 7, 14, enclosed ? WOOD : m, enclosed ? DARKWOOD : m);
      if (enclosed) {
        box(r, X + 4, Y + 5, W - 8, H - 15, 7, WOOD, DARKWOOD);
        drum(r, cx, Y + 12, W / 2 - 9, 4, 0, IRON);
      } else {
        drum(r, cx, Y + H - 3, 7, 4, 8, m);
        drum(r, cx, Y + H - 12, W / 2 - 5, 7, 5, m);
        drum(r, cx, Y + H - 17, W / 2 - 8, 4, 0, IRON);
      }
      r.fill(X + W - 7, Y - 2, 2, 6, BRASS[2]); r.set(X + W - 5, Y - 2, BRASS[0]);
      return done(s);
    }
    case "toolset": {
      const s = make(30), { r, X, Y } = s, m = t ?? (v < 0.5 ? WOOD : DARKWOOD);
      ground(s);
      box(r, X + 2, Y - 8, W - 4, H - 8, 12, m, m);
      for (const x of [X + 5, X + W - 8]) {
        r.fill(x, Y + H - 4, 3, 8, m[3]); r.fill(x, Y + H - 4, 1, 7, m[0]);
      }
      r.fill(X + 5, Y - 22, W - 10, 12, DARKWOOD[3]); r.fill(X + 5, Y - 22, W - 10, 1, m[0]);
      for (let i = 0; i < 4; i++) {
        const x = X + 10 + i * 8;
        r.fill(x, Y - 18, 2, 8, WOOD[1]); r.fill(x - 2, Y - 19, 6, 2, IRON[0]);
        r.fill(x - 2, Y + i % 2 * 5 - 3, 2, 11, WOOD[2]);
        r.fill(x - 3, Y + i % 2 * 5 - 6, 4, 4, i % 2 ? IRON[0] : BRASS[1]);
      }
      box(r, X + 8, Y + H - 10, W - 16, 1, 7, m, DARKWOOD);
      for (const x of [X + W / 2 - 6, X + W / 2 + 6]) r.set(x, Y + H - 6, BRASS[0]);
      return done(s);
    }
    case "sewingmachine": {
      const s = make(40), { r, X, Y } = s, cx = X + W / 2, metal = t ?? (v < 0.5 ? IRON : ["#86aaa1", "#5d8579", "#3f625a", "#2b4942", "#1d3430"]);
      ground(s);
      box(r, X + 1, Y - 4, W - 2, H - 14, 4, WOOD, DARKWOOD);
      for (const x of [X + 5, X + W - 8]) r.fill(x, Y + H - 14, 3, 15, IRON[2]);
      drum(r, cx, Y + H - 2, W / 2 - 7, 3, 1, IRON);
      box(r, X + 5, Y - 2, W - 10, 7, 3, metal, metal);
      r.fill(X + W - 13, Y - 20, 6, 21, metal[2]); r.fill(X + 7, Y - 21, W - 15, 5, metal[1]);
      r.fill(X + 7, Y - 17, 4, 10, metal[2]); r.fill(X + 8, Y - 7, 1, 7, IRON[0]);
      r.fill(X + 7, Y - 21, W - 15, 1, metal[0]);
      drum(r, X + W - 6, Y - 9, 5, 2, 7, IRON); r.fill(X + W - 6, Y - 15, 1, 5, IRON[0]);
      drum(r, X + W - 11, Y - 22, 2, 1, 6, BRASS);
      r.fill(X + 13, Y - 18, 5, 1, BRASS[1]);
      return done(s);
    }
    case "garment": {
      const s = make(36), { r, X, Y } = s, cx = X + W / 2;
      const cloth = t ?? ramp(["#945760", "#527395", "#5f8963", "#a1854e", "#806587", "#528a88"][Math.floor(v * 6) % 6]);
      ground(s);
      drum(r, cx, Y + H - 3, 6, 2, 2, DARKWOOD); r.fill(cx, Y - 8, 1, H + 5, IRON[2]);
      drum(r, cx, Y - 29, 2, 1, 3, WOOD);
      for (let y = -25; y < 5; y++) {
        const half = y < -20 ? 5 : y < -12 ? 4 : Math.floor(v * 6) % 2 ? 4 : 5;
        r.fill(cx - half, Y + y, half * 2 + 1, 1, cloth[2]); r.set(cx - half, Y + y, cloth[0]); r.set(cx + half, Y + y, cloth[3]);
      }
      r.fill(cx - 9, Y - 23, 4, 15, cloth[2]); r.fill(cx + 6, Y - 23, 4, 15, cloth[3]);
      r.fill(cx - 2, Y - 25, 4, 3, STONE[1]); r.fill(cx, Y - 21, 1, 25, cloth[4]);
      for (const y of [-18, -12, -6, 0]) r.set(cx + 1, Y + y, BRASS[1]);
      return done(s);
    }
    case "curtain": {
      const s = make(48), { r, X, Y } = s;
      const c = t ?? ramp(["#945760", "#527395", "#5f8963", "#a1854e", "#806587", "#528a88"][Math.floor(v * 6) % 6]);
      r.fill(X, Y - 42, W, 2, BRASS[2]);
      for (let y = -39; y < H - 3; y++) {
        const width = Math.floor(v * 6) % 2 === 0 && y > -18 && y < -6 ? 5 : W / 2 - 3;
        for (const x of [X + 2, X + W - width - 2]) {
          r.fill(x, Y + y, width, 1, c[2]);
          for (let fold = x + 2; fold < x + width; fold += 4) r.set(fold, Y + y, c[1]);
          r.set(x, Y + y, c[0]);
        }
      }
      r.fill(X + 2, Y - 10, 5, 2, BRASS[1]); r.fill(X + W - 7, Y - 10, 5, 2, BRASS[1]);
      return done(s);
    }
    case "vase": {
      const s = make(32), { r, X, Y } = s, m = t ?? ["#b8d4f4", "#7aa4e0", "#4a74b8", "#30508c", "#1e3460"];
      ground(s);
      box(r, X + 2, Y, W - 4, 6, 8, DARKWOOD, DARKWOOD);
      const cx = X + W / 2;
      for (let k = 0; k < 22; k++) drum(r, cx, Y - 1 - k, 3 + Math.sin((k / 22) * Math.PI) * 4.5, 1, 1, m);
      for (let i = -4; i <= 4; i += 2) r.set(cx + i, Y - 12, BRASS[1]);
      return done(s);
    }
    case "engine": return machine(w >= 6 ? "mill-engine" : "engine", w, h, v);
    case "dynamo": return machine("dynamo", w, h, v);
    case "pump": return machine("pump", w, h, v);
    case "locomotive": {
      // An express engine on its own length of track: black smokebox and chimney, a green
      // boiler banded in brass, a brass dome, the cab, and tall red driving wheels.
      const s = make(40), { r, X, Y } = s, body = t ?? GREEN, black = ["#5a6272", "#3e4656", "#2a303c", "#1c2028", "#10141a"];
      ground(s);
      for (let x = X - 4; x < X + W + 4; x += 7) r.fill(x, Y + H - 9, 4, 7, DARKWOOD[x % 2 ? 2 : 3]);
      for (const y of [Y + H - 8, Y + H - 4]) r.fill(X - 6, y, W + 12, 2, IRON[1]), r.fill(X - 6, y, W + 12, 1, IRON[0]);
      const cyl = (x0: number, x1: number, cy: number, rad: number, ramp: readonly string[]) => {
        for (let j = -rad; j <= rad; j++) r.fill(x0, cy + j, x1 - x0, 1, ramp[j < -rad * 0.6 ? 0 : j < -rad * 0.1 ? 1 : j < rad * 0.5 ? 2 : 3]);
      };
      const by = Y - 6, bl = X + 14, br = X + W - 32;
      cyl(bl, br, by, 11, body);
      for (let x = bl + 14; x < br - 4; x += 18) r.fill(x, by - 11, 2, 23, BRASS[2]), r.set(x, by - 11, BRASS[0]);
      cyl(X + 3, bl, by, 12, black);
      r.fill(X + 7, Y - 34, 7, 16, black[2]); r.fill(X + 7, Y - 34, 2, 16, black[0]); r.fill(X + 5, Y - 36, 11, 3, black[1]); r.fill(X + 5, Y - 36, 11, 1, black[0]);
      drum(r, (bl + br) / 2, by - 10, 5, 2, 7, BRASS);
      drum(r, bl + 12, by - 10, 3, 1.5, 4, BRASS);
      box(r, br, Y - 30, W - 4 - (br - X), 8, 34, body, body);
      r.fill(br + 5, Y - 20, 10, 9, GLASS[2]); r.fill(br + 5, Y - 20, 4, 4, GLASS[0]);
      r.fill(br - 2, Y - 32, W - (br - X), 3, black[2]); r.fill(br - 2, Y - 32, W - (br - X), 1, black[0]);
      r.fill(X + 2, Y + 4, W - 6, 2, RED[2]); r.fill(X + 2, Y + 6, W - 6, 1, black[3]);
      const wheel = (wx: number, rad: number) => {
        for (let j = -rad; j <= rad; j++) for (let i = -rad; i <= rad; i++) {
          const d = Math.hypot(i, j), a = Math.atan2(j, i);
          if (d > rad + 0.4) continue;
          if (d > rad - 2.5) r.set(wx + i, Y + 12 - rad + 1 + j + rad - 1, d > rad - 0.6 ? RED[4] : RED[Math.cos(a + 2.3) > 0 ? 1 : 2]);
          else if (d < 2.5) r.set(wx + i, Y + 12 + j, BRASS[1]);
          else if (Math.abs(((a / (Math.PI / 4)) % 1 + 1) % 1 - 0.5) > 0.5 - 0.9 / d) r.set(wx + i, Y + 12 + j, RED[2]);
        }
      };
      wheel(X + 12, 6);
      const drivers: number[] = [];
      for (let wx = X + 32; wx < X + W - 14; wx += 26) wheel(wx, 11), drivers.push(wx);
      if (drivers.length > 1) r.fill(drivers[0], Y + 14, drivers[drivers.length - 1] - drivers[0], 2, IRON[0]);
      for (let x = X - 4; x <= X + W + 4; x += 30) { r.fill(x, Y + H - 2, 2, 10, BRASS[2]); r.fill(x - 1, Y + H - 3, 4, 2, BRASS[0]); }
      for (let x = X - 4; x < X + W + 4; x++) r.set(x, Y + H - 1 + Math.round(Math.sin((((x - X + 4) % 30) / 30) * Math.PI) * 3), RED[2]);
      return done(s, false);
    }
    case "phonograph": case "telephone": {
      const s = make(26), { r, X, Y } = s;
      ground(s);
      box(r, X + 2, Y, W - 4, H - 6, 12, WOOD, DARKWOOD);
      if (art === "phonograph") {
        for (let k = 0; k < 12; k++) r.fill(X + 6 + k, Y - 2 - k, 1 + Math.floor(k * 0.6), 2 + Math.floor(k / 3), BRASS[k < 5 ? 2 : 1]);
        drum(r, X + 5, Y - 1, 3, 1, 3, IRON);
      } else {
        r.fill(X + 4, Y - 14, 8, 14, DARKWOOD[2]); r.fill(X + 4, Y - 14, 8, 1, DARKWOOD[0]);
        r.fill(X + 6, Y - 11, 4, 4, STONE[1]); drum(r, X + 13, Y - 7, 1.5, 1, 6, IRON);
      }
      return done(s);
    }
    case "piano": {
      const ebony = ["#5a4848", "#443434", "#322626", "#221a1a", "#140e0e"];
      const s = make(26), { r, X, Y } = s;
      ground(s);
      box(r, X + 1, Y - 6, W - 2, H - 4, 18, ebony, ebony);
      for (let i = 0; i < W - 8; i++) r.set(X + 4 + i, Y + 2, i % 3 === 2 ? ebony[4] : STONE[0]);
      r.fill(X + 4, Y - 10, W - 8, 1, ebony[0]);
      for (const x of [X + 6, X + W - 8]) drum(r, x, Y - 12, 1, 1, 4, BRASS);
      return done(s);
    }
    case "model": case "pyramid": {
      const s = make(art === "pyramid" ? 40 : 28), { r, X, Y } = s, m = t ?? STONE;
      ground(s);
      if (art === "pyramid") {
        // A round bed in tiers, each a low drum of leaf massed with bloom; a pale tint is a heap of crystals.
        const pale = parseInt(m[2].slice(1, 3), 16) > 200 && parseInt(m[2].slice(5, 7), 16) > 180, body = pale ? m : GREEN, cx = X + W / 2;
        drum(r, cx, Y + H - 4, W / 2 - 1, (W / 2 - 1) * 0.42, 3, STONE);
        for (let k = 0; k < 3; k++) {
          const rx = W / 2 - 3 - k * 6, ry = rx * 0.42, foot = Y + H - 7 - k * 7;
          if (rx < 4) break;
          drum(r, cx, foot, rx, ry, 6, body);
          for (let j = -ry; j <= ry + 6; j++) for (let i = -rx; i <= rx; i++) {
            const top = (i * i) / (rx * rx) + (j * j) / (ry * ry) <= 1, side = j > 0 && (i * i) / (rx * rx) <= 1 && j <= ry * Math.sqrt(1 - (i * i) / (rx * rx)) + 6;
            if (!top && !side) continue;
            const n = h2(Math.round(cx + i), Math.round(foot - 6 + j), 11 + k);
            if (n < (top ? 0.5 : 0.3)) r.set(cx + i, foot - 6 + j, top ? (n < 0.18 ? m[0] : m[1]) : m[2]);
          }
        }
      } else {
        box(r, X + 1, Y + 4, W - 2, H - 10, 6, DARKWOOD, DARKWOOD);
        r.fill(X + 3, Y + 1, W - 6, H - 12, GREEN[2]);
        box(r, X + 6, Y - 6, W - 20, 6, 8, RED, m);
        box(r, X + W - 14, Y - 12, 8, 4, 14, RED, m);
        r.fill(X + 4, Y + H - 12, W - 8, 1, "#7aaabe");
      }
      return done(s);
    }
    case "loom": case "press": {
      const s = make(48), { r, X, Y } = s;
      ground(s);
      if (art === "loom") {
        // A Jacquard loom: an oak frame, the warp running back to the cloth beam, the
        // card chain looping down from the head on top.
        const c = t ?? RED;
        box(r, X + 2, Y, W - 4, H - 6, 5, WOOD, WOOD);
        for (const x of [X + 3, X + W - 7]) { r.fill(x, Y - 34, 4, 34, WOOD[2]); r.fill(x, Y - 34, 1, 34, WOOD[0]); r.fill(x + 3, Y - 34, 1, 34, WOOD[4]); }
        for (let x = X + 7; x < X + W - 7; x++) r.fill(x, Y - 22, 1, 18, x % 2 ? c[1] : c[2]);
        r.fill(X + 7, Y - 8, W - 14, 4, c[3]); r.fill(X + 7, Y - 8, W - 14, 1, c[1]);
        r.fill(X + 5, Y - 5, W - 10, 3, WOOD[1]); r.fill(X + 5, Y - 5, W - 10, 1, WOOD[0]);
        r.fill(X + 3, Y - 26, W - 6, 3, WOOD[1]); r.fill(X + 3, Y - 26, W - 6, 1, WOOD[0]);
        box(r, X + 8, Y - 42, W - 16, 4, 8, WOOD, DARKWOOD);
        for (let k = 0; k < 9; k++) r.fill(X + W - 9 + (k % 2), Y - 33 + k * 2, 6, 1, k % 2 ? STONE[2] : STONE[0]);
      } else {
        // A printing press: an iron frame, the platen, and a big spoked wheel at its side.
        box(r, X + 2, Y, W - 4, H - 6, 6, IRON, IRON);
        for (const x of [X + 4, X + W - 10]) { r.fill(x, Y - 28, 5, 28, IRON[2]); r.fill(x, Y - 28, 1, 28, IRON[0]); r.fill(x + 4, Y - 28, 1, 28, IRON[4]); }
        r.fill(X + 4, Y - 30, W - 8, 4, IRON[1]); r.fill(X + 4, Y - 30, W - 8, 1, IRON[0]);
        r.fill(X + 9, Y - 14, W - 18, 4, STONE[1]); r.fill(X + 9, Y - 14, W - 18, 1, "#ffffff");
        r.fill(X + 9, Y - 4, W - 18, 3, STONE[0]);
        const wx = X + W - 4, wy = Y - 16;
        for (let a = 0; a < 64; a++) { const g = (a / 64) * Math.PI * 2; for (const k of [0, 1]) r.set(wx + Math.cos(g) * (11 - k), wy + Math.sin(g) * (11 - k), k ? IRON[1] : IRON[3]); }
        for (let k = 0; k < 6; k++) { const g = (k / 6) * Math.PI * 2; for (let d = 2; d < 10; d++) r.set(wx + Math.cos(g) * d, wy + Math.sin(g) * d, IRON[2]); }
        drum(r, wx, wy + 1, 2, 1, 2, BRASS);
        drum(r, X + W / 2, Y - 30, 4, 1.5, 4, BRASS);
      }
      return done(s);
    }
    case "lamp-standard": {
      const s = make(52), { r, X, Y } = s, cx = X + W / 2;
      r.shadow(cx + 2, Y + H - 4, 6, 3);
      drum(r, cx, Y + H - 4, 4, 2, 6, IRON);
      r.fill(cx - 1, Y - 38, 3, 48, IRON[2]); r.fill(cx - 1, Y - 38, 1, 48, IRON[0]);
      r.fill(cx - 8, Y - 38, 17, 2, IRON[2]);
      const glow: { x: number; y: number }[] = [];
      for (const dx of [-8, 7]) { r.fill(cx + dx - 2, Y - 46, 5, 7, "#fff2c0"); r.fill(cx + dx - 2, Y - 46, 5, 1, IRON[2]); r.set(cx + dx - 1, Y - 44, "#ffffff"); glow.push({ x: cx + dx, y: Y - 43 }); }
      s.r.finish();
      return { ...s, glow };
    }
    case "kiosk": {
      // A round kiosk under a striped canopy, a counter open to the walk.
      const s = make(46), { r, X, Y } = s, c = t ?? RED, cx = X + W / 2, rad = W / 2 - 1;
      r.shadow(cx + 3, Y + H - 4, rad + 2, 6);
      drum(r, cx, Y + H - 5, rad - 3, 4, 22, ["#7ab478", "#589a58", "#3e7c42", "#2c5e30", "#1c401e"], WOOD);
      r.fill(cx - 8, Y + H - 22, 16, 9, DARKWOOD[4]); r.fill(cx - 8, Y + H - 14, 16, 2, WOOD[1]);
      for (let k = 0; k < 14; k++) {
        const rr = rad * (0.25 + k / 15);
        for (let x = -rr; x <= rr; x++) r.set(cx + x, Y + H - 44 + k, Math.floor((x + rad + 40) / 5) % 2 ? c[k > 10 ? 2 : 1] : k > 10 ? "#e0d8c8" : "#fbf6ea");
      }
      for (let x = -rad; x <= rad; x += 5) for (let k = 0; k < 3; k++) r.fill(cx + x + k, Y + H - 30 + k, 5 - k * 2, 1, Math.floor((x + rad + 40) / 5) % 2 ? c[2] : "#e0d8c8");
      drum(r, cx, Y + H - 45, 1, 1, 4, BRASS);
      return done(s, false);
    }
    case "lift": {
      const s = make(46), { r, X, Y } = s;
      const IR = ["#cc8a66", "#a8603f", "#884a30", "#643424", "#3e2018"];
      r.shadow(X + W / 2 + 2, Y + H - 3, W / 2 + 4, 5);
      box(r, X - 2, Y - 30, W + 4, 6, 40, IR, IR);
      r.fill(X + 1, Y - 22, W - 2, 30, "#2a2026");
      for (let x = X + 1; x < X + W - 1; x += 3) r.fill(x, Y - 22, 1, 30, IRON[1]);
      r.fill(X - 2, Y - 31, W + 4, 2, BRASS[1]);
      return done(s, false);
    }
    // On the back wall: drawn above the cell in front of it.
    case "painting": case "tapestry": case "carpet": case "panel": case "map": {
      const s = { r: new Raster(W, 40), ox: 0, oy: 26 };
      const { r } = s, c = t ?? ramp(["#6a8ab8", "#c0704c", "#7a9a5a", "#c8a050"][Math.floor(v * 4)]);
      const fw = W - 4, fh = art === "carpet" || art === "tapestry" ? 28 : art === "map" ? 22 : 20, y0 = art === "carpet" || art === "tapestry" ? 6 : 8, x0 = 2;
      if (art === "painting" || art === "map") {
        r.fill(x0, y0, fw, fh, BRASS[2]); r.fill(x0, y0, fw, 1, BRASS[0]); r.fill(x0, y0, 1, fh, BRASS[1]); r.fill(x0, y0 + fh - 1, fw, 1, BRASS[4]);
        for (let y = y0 + 2; y < y0 + fh - 2; y++) for (let x = x0 + 2; x < x0 + fw - 2; x++) {
          const n = h2(x >> 1, y >> 1, Math.floor(v * 99)), sky = y < y0 + fh * 0.45;
          r.set(x, y, art === "map" ? (n > 0.55 ? "#e4d4a4" : "#acc8d4") : sky ? (n > 0.82 ? "#fff4dc" : "#c4d8e4") : n > 0.7 ? c[1] : n < 0.2 ? c[3] : c[2]);
        }
      } else {
        for (let y = y0; y < y0 + fh; y++) for (let x = x0; x < x0 + fw; x++) {
          const d = Math.abs(x - W / 2) / (fw / 2) + Math.abs(y - y0 - fh / 2) / (fh / 2);
          r.set(x, y, x < x0 + 2 || x > x0 + fw - 3 || y < y0 + 2 || y > y0 + fh - 3 ? c[3] : d < 0.45 ? c[0] : Math.floor(d * 7) % 2 ? c[2] : c[1]);
        }
        if (art === "tapestry") r.fill(x0 - 1, y0 - 2, fw + 2, 2, WOOD[3]);
        for (let x = x0; x < x0 + fw; x += 2) r.set(x, y0 + fh, c[2]);
      }
      r.finish();
      return s;
    }
  }
  return undefined;
}

/** Trees, shrubs, urns, lamps, benches and columns in the grounds and halls. */
export function paintFairDecor(type: string, v: number, style?: PalaceStyle): FairSprite | undefined {
  if (type === "tree") {
    // A park chestnut or plane: a dome of leaf clumps, each lit on its upper left, on a pale trunk.
    const r = new Raster(72, 92), cx = 36, foot = 86, leaf = LEAF[Math.floor(v * LEAF.length)];
    r.shadow(cx + 6, foot - 1, 24, 7, 0.32);
    for (let y = foot - 26; y < foot; y++) {
      const spread = y > foot - 5 ? (foot - 5 - y) * -1 : 0;
      for (let x = cx - 4 - spread; x < cx + 4 + spread; x++) r.set(x, y, x < cx - 2 ? BARK[0] : x < cx ? BARK[1] : x < cx + 2 ? BARK[2] : BARK[3]);
    }
    const sc = 0.78 + ((v * 7) % 1) * 0.3;
    const clumps = [[0, -46, 18], [-15, -40, 13], [15, -40, 13], [-9, -57, 13], [10, -56, 13], [0, -66, 11], [-20, -50, 10], [20, -50, 10], [0, -34, 13]]
      .map(([dx, dy, rad]) => [Math.round(dx * sc), Math.round(-26 + (dy + 26) * sc), Math.round(rad * sc)]);
    for (const [dx, dy, rad] of clumps) {
      const ccx = cx + dx, ccy = foot + dy + Math.round((v - 0.5) * 4);
      for (let y = -rad; y <= rad; y++) for (let x = -rad - 1; x <= rad + 1; x++) {
        const lumpy = h2((ccx + x + 50) >> 2, (ccy + y + 50) >> 2, Math.floor(v * 40)) * 2.2;
        if (x * x + y * y > (rad + 0.5 - lumpy * 0.6) ** 2) continue;
        let k = lit(x, y, rad);
        if (dy > -40 * sc && y > 0) k = Math.min(4, k + 1);
        if (dy >= -36 * sc && y > rad * 0.5) k = Math.min(5, k + 1);
        // Leaf clusters: a few lit flecks in the light, dark gaps in the shade.
        const fleck = h2((ccx + x) >> 1, (ccy + y) >> 1, 7);
        if (fleck > 0.86 && k > 0) k--;
        else if (fleck < 0.1 && k < 4) k++;
        r.set(ccx + x, ccy + y, leaf[k]);
      }
    }
    r.finish();
    return { r, ox: 28, oy: 74 };
  }
  if (type === "shrub") {
    // Lilac in flower, a rose bush, or a clipped ball of green.
    const r = new Raster(32, 34), cx = 16, foot = 28, kind = v < 0.45 ? "lilac" : v < 0.75 ? "rose" : "ball";
    const bloom = kind === "lilac" ? ["#f0dcff", "#c8a4ec", "#9a74c8", "#6e4c9c"] : ["#ffd2dc", "#f08aa8", "#c84a72", "#8a2c50"];
    const leaf = LEAF[2];
    r.shadow(cx + 3, foot + 1, 12, 4);
    for (const [dx, dy, rad] of kind === "ball" ? [[0, -9, 9]] : [[0, -9, 10], [-6, -13, 7], [6, -13, 7], [0, -17, 7]]) for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) {
      if (x * x + y * y > rad * rad) continue;
      let k = lit(x, y, rad);
      if (h2(cx + dx + x, foot + dy + y, 3) > 0.88 && k > 0) k--;
      r.set(cx + dx + x, foot + dy + y, leaf[k + 1]);
    }
    if (kind !== "ball") for (let k = 0; k < (kind === "lilac" ? 9 : 12); k++) {
      const a = h2(k, 1, Math.floor(v * 50)) * Math.PI * 2, d = h2(k, 2, Math.floor(v * 50)) * 9;
      const x = cx + Math.cos(a) * d * 1.1, y = foot - 12 + Math.sin(a) * d * 0.8;
      if (kind === "lilac") { r.fill(x, y - 2, 2, 4, bloom[2]); r.set(x, y - 2, bloom[0]); r.set(x + 1, y - 1, bloom[1]); r.set(x + 1, y + 1, bloom[3]); }
      else { r.set(x, y, bloom[1]); r.set(x + 1, y, bloom[2]); r.set(x, y - 1, bloom[0]); }
    }
    r.finish();
    return { r, ox: 8, oy: 18 };
  }
  if (type === "tazza") {
    // A fountain of two stone bowls on a fluted stem, standing in its basin. The
    // sprite's middle is the right edge of its cell, the middle of the basin.
    const big = v >= 1, r = new Raster(80, 80), cx = 40, foot = 70, W1 = big ? 26 : 19, W2 = big ? 13 : 10;
    for (let y = foot - 4; y <= foot + 3; y++) for (let x = -16; x <= 16; x++) if ((x * x) / 256 + ((y - foot) * (y - foot)) / 16 <= 1) r.set(cx + x, y, "#3a78a8");
    drum(r, cx, foot, big ? 9 : 7, 3, 6, STONE);
    for (let k = 0; k < 14; k++) drum(r, cx, foot - 6 - k, 3 + (k < 3 ? 2 - k : 0), 1, 1, STONE);
    // Lower bowl: a wide shallow dish, water brimming in it.
    drum(r, cx, foot - 18, W1, W1 * 0.36, 5, STONE);
    for (let j = -W1 * 0.36 + 1; j < W1 * 0.36 - 1; j++) for (let i = -W1 + 2; i < W1 - 2; i++) if ((i * i) / ((W1 - 2) ** 2) + (j * j) / ((W1 * 0.36 - 1) ** 2) <= 1) r.set(cx + i, foot - 23 + j, (i + j * 3) % 9 === 0 ? "#c8ecf6" : "#6cb4da");
    for (let k = 0; k < 9; k++) drum(r, cx, foot - 24 - k, 2, 1, 1, STONE);
    drum(r, cx, foot - 33, W2, W2 * 0.36, 4, STONE);
    for (let j = -W2 * 0.36 + 1; j < W2 * 0.36 - 1; j++) for (let i = -W2 + 2; i < W2 - 2; i++) if ((i * i) / ((W2 - 2) ** 2) + (j * j) / ((W2 * 0.36 - 1) ** 2) <= 1) r.set(cx + i, foot - 37 + j, "#94d0e8");
    drum(r, cx, foot - 37, 2, 1, 3, STONE);
    r.finish();
    return { r, ox: cx - 16, oy: foot - 8 };
  }
  if (type === "case") {
    // A tall glazed case against the wall: a mahogany base, shelves of goods behind glass, a moulded top.
    const r = new Raster(24, 52), x0 = 3, foot = 44, goods = [BRASS, RED, GLASS, STONE, ramp(["#6a8ab8", "#7a9a5a", "#c8a050"][Math.floor(v * 3)])];
    r.shadow(12, foot, 10, 3);
    box(r, x0, foot - 12, 18, 3, 9, DARKWOOD, DARKWOOD);
    r.fill(x0 + 1, foot - 39, 16, 27, GLASS[2]); r.fill(x0 + 1, foot - 39, 16, 8, GLASS[1]);
    for (const [k, sy] of [[0, foot - 33], [1, foot - 24], [2, foot - 15]] as const) {
      r.fill(x0 + 1, sy + 6, 16, 1, DARKWOOD[1]);
      for (let i = 0; i < 4; i++) {
        const g = goods[Math.floor(h2(i, k, Math.floor(v * 50)) * goods.length)], x = x0 + 2 + i * 4, tall = 2 + Math.floor(h2(k, i, 7) * 4);
        r.fill(x, sy + 6 - tall, 3, tall, g[1]); r.set(x, sy + 6 - tall, g[0]); r.fill(x + 2, sy + 7 - tall, 1, tall - 1, g[3]);
      }
    }
    for (const x of [x0, x0 + 17]) r.fill(x, foot - 41, 1, 30, DARKWOOD[2]);
    r.fill(x0 - 1, foot - 43, 20, 3, DARKWOOD[1]); r.fill(x0 - 1, foot - 43, 20, 1, DARKWOOD[0]);
    for (let k = 0; k < 7; k++) r.set(x0 + 3 + k, foot - 37 + k, "#ffffff");
    r.finish();
    return { r, ox: 4, oy: 34 };
  }
  if (type.startsWith("palace:")) return paintPalaceDecor(type.slice(7), v, style);
  if (type === "palm") {
    // A fan palm in a green-painted tub with brass hoops: fronds springing from a crown, lit on top.
    const r = new Raster(56, 64), cx = 28, foot = 58;
    r.shadow(cx + 4, foot, 16, 4);
    const tub = ["#8cbc84", "#5e9a5e", "#447c46", "#305e34", "#1e4024"];
    drum(r, cx, foot, 8, 3, 13, tub, DARKWOOD);
    for (const y of [foot - 3, foot - 10]) r.fill(cx - 8, y, 16, 1, BRASS[2]);
    const crown = foot - 20, leaf = LEAF[2];
    for (let k = 0; k < 11; k++) {
      const a = -Math.PI + (k / 10) * Math.PI + (h2(k, 1, Math.floor(v * 30)) - 0.5) * 0.25, len = 16 + h2(k, 2, Math.floor(v * 30)) * 9;
      for (let t = 0; t <= len; t++) {
        const droop = (t / len) ** 2 * 10, x = cx + Math.cos(a) * t, y = crown + Math.sin(a) * t * 0.8 + droop;
        const up = Math.sin(a) < -0.4;
        r.set(x, y, leaf[up ? 1 : 2]);
        if (t > 3 && t % 2 === 0) for (const s of [-1, 1]) { r.set(x + s * Math.sin(a) * 2, y - s * Math.cos(a) * 1.5 + 1, leaf[up ? 2 : 3]); r.set(x + s * Math.sin(a) * 3, y - s * Math.cos(a) * 2 + 2, leaf[4]); }
      }
    }
    r.fill(cx - 1, crown - 1, 3, 3, BARK[2]);
    r.finish();
    return { r, ox: 20, oy: 48 };
  }
  if (type === "urn") {
    // A stone urn of geraniums on a pedestal.
    const r = new Raster(32, 44), cx = 16, foot = 38;
    r.shadow(cx + 3, foot, 9, 3);
    box(r, cx - 6, foot - 16, 12, 4, 12, STONE, STONE);
    r.fill(cx - 7, foot - 16, 14, 2, STONE[1]); r.fill(cx - 7, foot - 16, 14, 1, STONE[0]);
    drum(r, cx, foot - 17, 2, 1, 3, STONE);
    for (let k = 0; k < 8; k++) drum(r, cx, foot - 19 - k, 3 + k * 0.75, 1.5, 1, STONE);
    for (let y = -6; y <= 2; y++) for (let x = -10; x <= 10; x++) {
      if (x * x / 100 + y * y / 36 > 1) continue;
      r.set(cx + x, foot - 29 + y, LEAF[2][lit(x, y, 8) + 1]);
    }
    for (let k = 0; k < 10; k++) {
      const x = cx - 8 + Math.floor(h2(k, 5, Math.floor(v * 30)) * 16), y = foot - 33 + Math.floor(h2(k, 6, Math.floor(v * 30)) * 7);
      r.set(x, y, RED[1]); r.set(x + 1, y, RED[2]); r.set(x, y - 1, RED[0]);
    }
    for (const x of [cx - 10, cx + 9]) r.fill(x, foot - 27, 1, 5, LEAF[2][2]);
    r.finish();
    return { r, ox: 8, oy: 30 };
  }
  if (type === "lamp") {
    // A cast-iron lamp standard: fluted base, slim column, crossbar, a glazed lantern lit warm.
    const r = new Raster(24, 64), cx = 12, foot = 58;
    r.shadow(cx + 3, foot, 6, 2.5);
    drum(r, cx, foot, 4, 2, 7, IRON);
    drum(r, cx, foot - 7, 2.5, 1, 3, IRON);
    r.fill(cx - 1, foot - 44, 3, 36, IRON[2]); r.fill(cx - 1, foot - 44, 1, 36, IRON[0]);
    r.fill(cx - 2, foot - 30, 5, 2, IRON[1]);
    r.fill(cx - 5, foot - 42, 11, 1, IRON[2]);
    r.fill(cx - 4, foot - 52, 9, 9, IRON[3]);
    r.fill(cx - 3, foot - 51, 7, 7, "#fff0b8"); r.fill(cx - 3, foot - 51, 3, 3, "#ffffff"); r.fill(cx, foot - 51, 1, 7, IRON[2]);
    for (let k = 0; k < 3; k++) r.fill(cx - 3 + k, foot - 54 - k, 7 - k * 2, 1, IRON[2 - (k ? 1 : 0)]);
    r.set(cx, foot - 58, IRON[0]); r.set(cx, foot - 57, IRON[2]);
    r.finish();
    return { r, ox: 4, oy: 48, glow: [{ x: cx, y: foot - 47 }] };
  }
  if (type === "bench-e" || type === "bench-w") {
    // Seen end-on along a walk: three slats running its length, the back raised on the railing side, iron ends.
    const r = new Raster(32, 48), east = type === "bench-e", sx = east ? 13 : 9, bx = east ? 8 : 20;
    r.shadow(16, 37, 10, 13, 0.24);
    for (const y of [14, 36]) { r.fill(Math.min(sx, bx), y + 2, 15, 3, IRON[3]); r.fill(Math.min(sx, bx), y + 2, 15, 1, IRON[1]); }
    for (let k = 0; k < 3; k++) {
      const x = sx + k * 3 + (east ? 0 : 0);
      r.fill(x, 13, 2, 26, WOOD[k === (east ? 0 : 2) ? 0 : 1]); r.fill(x, 38, 2, 1, WOOD[3]);
    }
    r.fill(bx, 9, 4, 30, WOOD[2]); r.fill(bx, 9, 4, 1, WOOD[0]); r.fill(east ? bx : bx + 3, 9, 1, 30, WOOD[1]); r.fill(bx, 38, 4, 1, WOOD[4]);
    for (const y of [12, 35]) r.fill(bx, y, 4, 3, IRON[2]);
    r.finish();
    return { r, ox: 8, oy: 22 };
  }
  if (type === "bench") {
    // A park bench of green slats on cast-iron ends.
    const r = new Raster(36, 30), x0 = 4, slat = ["#8cbc74", "#6a9e56", "#4e8040", "#38602e", "#24401e"];
    r.shadow(18, 24, 15, 4);
    for (const x of [x0 + 2, x0 + 25]) { r.fill(x, 8, 2, 16, IRON[2]); r.fill(x, 8, 1, 16, IRON[0]); r.fill(x - 1, 22, 4, 2, IRON[3]); }
    for (let k = 0; k < 3; k++) r.fill(x0, 6 + k * 3, 28, 2, slat[k === 0 ? 0 : 1]), r.fill(x0, 8 + k * 3, 28, 1, slat[3]);
    r.fill(x0, 16, 28, 4, slat[1]); r.fill(x0, 16, 28, 1, slat[0]); r.fill(x0, 19, 28, 1, slat[3]);
    r.finish();
    return { r, ox: 4, oy: 8 };
  }
  if (type === "column") {
    const r = new Raster(24, 80), cx = 12, foot = 74;
    r.shadow(cx + 3, foot, 7, 3);
    drum(r, cx, foot, 6, 2, 6, IRON);
    for (let y = foot - 62; y < foot - 6; y++) for (let x = -3; x <= 3; x++) r.set(cx + x, y, IRON[x < -1 ? 0 : x < 1 ? 1 : x < 3 ? 2 : 3]);
    for (let y = foot - 60; y < foot - 8; y += 8) r.fill(cx - 3, y, 7, 1, IRON[0]);
    r.fill(cx - 7, foot - 66, 15, 4, IRON[1]); r.fill(cx - 7, foot - 66, 15, 1, IRON[0]); r.fill(cx - 5, foot - 62, 11, 2, IRON[2]);
    r.finish();
    return { r, ox: 4, oy: 58 };
  }
  if (type === "machine") {
    // Anchored on its bottom-left cell, so it sorts by its front.
    const [art, w, h] = MACHINES[Math.floor(v) % MACHINES.length], s = paintFairThing(art, w, h, v % 1);
    return s && { ...s, oy: s.oy + (h - 1) * 16 };
  }
  if (type === "bandstand") {
    // An octagonal bandstand: a stone base with steps, slim iron columns, a tented roof and a gilt finial.
    const r = new Raster(64, 90), stone = ["#f6f0e2", "#e2d9c6", "#c4baa6", "#9c9282"], zinc = ["#a8c8ba", "#7fa898", "#5e8878", "#44685c"];
    r.shadow(34, 85, 27, 5, 0.3);
    for (let y = 60; y < 76; y++) { const half = 24 - Math.round(Math.abs(y - 68) * 0.5); r.fill(32 - half, y, half * 2, 1, y < 62 ? stone[0] : stone[1]); }
    for (let y = 72; y < 84; y++) { const half = 24 - Math.max(0, y - 80); r.fill(32 - half, y, half * 2, 1, y === 83 ? stone[3] : stone[2]); }
    for (let k = 0; k < 3; k++) r.fill(25 - k, 75 + k * 3, 14 + k * 2, 3, stone[1]), r.fill(25 - k, 75 + k * 3, 14 + k * 2, 1, stone[0]);
    for (let y = 32; y < 62; y++) for (let x = 9; x < 55; x++) r.set(x, y, "#2c2640b0");
    for (const [x, foot] of [[14, 62], [24, 60], [40, 60], [50, 62], [8, 68], [56, 68], [21, 72], [43, 72]]) {
      r.fill(x, 30, 2, foot - 30, "#f4efe2"); r.fill(x + 1, 30, 1, foot - 30, "#c8c0ac"); r.fill(x - 1, foot - 2, 4, 2, "#e2d9c6");
    }
    for (const [x0, x1, y] of [[9, 21, 60], [45, 57, 60], [9, 14, 56], [51, 56, 56]]) { r.fill(x0, y, x1 - x0, 1, "#f4efe2"); for (let x = x0; x < x1; x += 2) r.fill(x, y + 1, 1, 5, "#ddd4be"); r.fill(x0, y + 6, x1 - x0, 1, "#c8c0ac"); }
    for (let y = 8; y < 31; y++) {
      const half = Math.round(((y - 8) / 22) * 30) + 1;
      for (let i = -half; i <= half; i++) {
        const seg = Math.floor(((i + half) / (half * 2 + 1)) * 6);
        r.set(32 + i, y, zinc[seg < 2 ? 0 : seg < 4 ? 1 : 2]);
        if (half > 3 && Math.abs(((i + half) / (half * 2 + 1)) * 6 - Math.round(((i + half) / (half * 2 + 1)) * 6)) < 0.5 / half * 3) r.set(32 + i, y, zinc[3]);
      }
    }
    for (let x = 1; x < 63; x++) r.set(x, 31 + ((x >> 1) % 2), "#f4efe2"), r.set(x, 30, "#fbf8f0");
    r.fill(31, 2, 2, 6, "#f2ca62"); r.fill(30, 4, 4, 2, "#fff4b8");
    r.finish();
    return { r, ox: 8, oy: 70 };
  }
  if (type.startsWith("table:")) {
    const [, cls, size] = type.split(":"), [w, h] = size.split("x").map(Number);
    return table(cls, w, h, v);
  }
  if (type.startsWith("stall")) return stall(v, type.slice(6));
  if (type === "rib") return rib();
  if (type === "crate") {
    const r = new Raster(28, 30), x = 4 + Math.round(v * 3), w = 14 - Math.round(v * 3), d = 5, hgt = 10 + Math.round(v * 4), top = 26 - hgt - d;
    r.shadow(14, 26, 10, 3);
    box(r, x, top, w, d, hgt, WOOD, WOOD);
    for (const yy of [top + d + 2, top + d + hgt - 3]) r.fill(x, yy, w, 1, WOOD[3]);
    for (let k = 0; k < hgt - 2; k++) r.set(x + 1 + Math.round((k * (w - 3)) / (hgt - 2)), top + d + 1 + k, WOOD[3]);
    r.finish();
    return { r, ox: 0, oy: 14 };
  }
  if (type === "demo") {
    // Anchored on its bottom-left cell, three rows deep.
    const m = machine("line-shaft", 13, 3, v);
    return { ...m, oy: m.oy + 32 };
  }
  return undefined;
}

/** A foot of one of the great ribs: a plate girder pier that splits at shoulder height
 * into two arches curving away over the floor to the glass. */
function rib(): FairSprite {
  const r = new Raster(248, 216), cx = 124, foot = 208, split = 104;
  const iron = ["#8a96a4", "#6a7684", "#4e5866", "#3a424e", "#262c36"];
  r.shadow(cx + 6, foot - 1, 30, 7, 0.3);
  for (const side of [-1, 1]) for (let t = 0; t <= 1; t += 0.002) {
    const th = (t * Math.PI) / 2, x = cx + side * (8 + 100 * (1 - Math.cos(th))), y = split - (split - 6) * Math.sin(th);
    const tx = side * 100 * Math.sin(th), ty = -(split - 6) * Math.cos(th), len = Math.hypot(tx, ty) || 1, nx = -ty / len, ny = tx / len;
    for (let k = -8; k <= 8; k++) {
      const e = side * k, col = Math.abs(k) === 8 ? iron[4] : e === -7 ? iron[0] : e === 7 ? iron[3] : Math.abs(k) === 5 ? iron[1] : iron[2];
      r.set(x + nx * k, y + ny * k, col);
      r.set(x + nx * k + 0.5, y + ny * k, col);
    }
    if (Math.round(t * 500) % 12 === 0) for (const k of [-3, 3]) r.set(x + nx * k, y + ny * k, iron[0]);
  }
  for (let y = split - 6; y < foot - 10; y++) {
    const hw = Math.round(13 + (12 * (y - split)) / (foot - split));
    for (let i = -hw; i <= hw; i++) {
      const e = Math.abs(i);
      r.set(cx + i, y, e === hw ? iron[4] : e === hw - 1 ? (i < 0 ? iron[0] : iron[3]) : e === hw - 2 ? iron[1] : iron[2]);
    }
    if (y % 7 === 0) for (const i of [-hw + 4, hw - 4]) r.set(cx + i, y, iron[0]);
    if ((y - split) % 34 === 0) r.fill(cx - hw, y, hw * 2 + 1, 3, iron[1]), r.fill(cx - hw, y + 2, hw * 2 + 1, 1, iron[4]);
  }
  box(r, cx - 26, foot - 16, 52, 6, 10, STONE, STONE);
  box(r, cx - 22, foot - 22, 44, 6, 4, iron, iron);
  for (let x = cx - 18; x <= cx + 18; x += 9) r.set(x, foot - 19, iron[0]);
  r.finish();
  return { r, ox: 100, oy: 192 };
}

/** A trophy: a firm's goods stacked in tiers on a draped dais round a gilt centrepiece, roped off. */
function trophy(v: number): FairSprite {
  const r = new Raster(64, 76), X = 8, Y = 56, W = 48, n = Math.floor(v * 97), cx = X + W / 2;
  const cloth = STALLS[n % STALLS.length], gilt = n % 2 ? BRASS : STONE;
  const goods = [BRASS, RED, GLASS, GREEN, ramp(cloth[0])];
  r.shadow(cx + 3, Y + 12, W / 2 + 2, 6, 0.26);
  box(r, X + 2, Y - 4, W - 4, 12, 6, cloth, cloth);
  for (let x = X + 2; x < X + W - 2; x++) r.set(x, Y + 9, (x & 1) ? BRASS[1] : BRASS[2]);
  box(r, X + 9, Y - 12, W - 18, 9, 5, WOOD, cloth);
  for (const [y, x0, x1] of [[Y + 6, X + 4, X + W - 6], [Y - 4, X + 11, X + W - 13]] as const)
    for (let x = x0, k = n; x < x1; x += 5, k++) {
      if (Math.abs(x + 2 - cx) < 7) continue;
      const g = goods[k % goods.length], tall = 3 + (k % 3) * 2;
      r.fill(x, y - tall, 4, tall, g[1]); r.fill(x, y - tall, 4, 1, g[0]); r.fill(x + 3, y - tall + 1, 1, tall - 1, g[3]);
    }
  drum(r, cx, Y - 8, 5, 2, 10, STONE);
  drum(r, cx, Y - 18, 3, 1.5, 3, gilt);
  for (let k = 0; k < 12; k++) drum(r, cx, Y - 21 - k, Math.round(2 + Math.sin((k / 11) * Math.PI) * 4), 1.5, 1, gilt);
  drum(r, cx, Y - 33, 4, 1.5, 2, gilt);
  for (const x of [X + 1, X + W - 2]) { r.fill(x, Y - 6, 2, 16, BRASS[2]); r.set(x, Y - 7, BRASS[0]); }
  for (let i = 0; i < W - 3; i++) r.set(X + 2 + i, Y - 4 + Math.round(Math.sin((i / (W - 3)) * Math.PI) * 5), RED[2]);
  r.finish();
  return { r, ox: X, oy: Y };
}

const STALLS = [["#c86a5a", "#a84a40", "#86342e", "#5e2422"], ["#6a86b8", "#4e6a9c", "#3a5280", "#283a5e"], ["#7aa46a", "#5a8650", "#44683c", "#2e4a2a"], ["#d8b060", "#b88e44", "#906a30", "#664a22"], ["#a878a8", "#865a88", "#68426a", "#48304a"]];

/** An exhibitor's stand, three cells wide: a nameboard on carved posts over a
 * back screen of shelves, and a draped counter of goods in front. */
const WOOD_TABLE = { rim: "#d49a5e", top: "#a0623a", grain: "#8e5430", front: "#b87844", panel: "#96592e", foot: "#62381c" };
/** A palace table: a marble top in a gilt frame. */
const GILT_TABLE = { rim: "#f6d266", top: "#f2eee6", grain: "#dcd6ca", front: "#d9a23a", panel: "#a87424", foot: "#70481a" };
const BAIZE = [["#5e9a6a", "#3e7850", "#2a583a"], ["#b8504a", "#963632", "#6e2424"], ["#5a78b0", "#3e5a92", "#2a406e"], ["#b89a58", "#96783c", "#6e5628"]];

/** A display table seen from a little above, `w` cells by `h`: a broad top with a
 * raised rim, sometimes laid with cloth, and on it one exhibit to a cell, each
 * its own thing; a panelled front below. Anchored on its bottom-left cell. */
function table(cls: string, w: number, h: number, v: number): FairSprite {
  const W = w * 16, H = h * 16, X = 4, Y = 10, r = new Raster(W + 8, H + Y + 6), n = Math.floor(v * 9973);
  const top = Y - 3, face = Y + H - 11, TABLE = FURNITURE[cls] ? GILT_TABLE : WOOD_TABLE;
  r.shadow(X + W / 2 + 2, Y + H - 1, W / 2 + 1, 4, 0.28);
  r.fill(X, top, W, face - top, TABLE.top);
  for (let y = top + 3; y < face; y += 4) for (let x = X + 2; x < X + W - 2; x++) if (h2(x >> 3, y, n) > 0.55) r.set(x, y, TABLE.grain);
  // The rim, lit along the back and the left.
  r.fill(X, top, W, 2, TABLE.rim); r.fill(X, top, 2, face - top, TABLE.rim); r.fill(X + W - 2, top, 2, face - top, TABLE.grain); r.fill(X, face - 2, W, 2, TABLE.rim);
  if (v > 0.45 && !FURNITURE[cls]) {
    const c = BAIZE[n % BAIZE.length];
    r.fill(X + 3, top + 3, W - 6, face - top - 6, c[1]); r.fill(X + 3, top + 3, W - 6, 1, c[0]); r.fill(X + 3, face - 4, W - 6, 1, c[2]);
    for (let x = X + 4; x < X + W - 4; x += 2) r.set(x, face - 4, "#e8c060");
  }
  r.fill(X, face, W, 10, TABLE.front); r.fill(X, face, W, 1, TABLE.rim); r.fill(X, face + 9, W, 1, TABLE.foot); r.fill(X + W - 1, face, 1, 10, TABLE.panel);
  for (let x = X + 3; x < X + W - 4; x += 16) { r.fill(x, face + 3, Math.min(11, X + W - 4 - x), 4, TABLE.panel); r.fill(x, face + 3, Math.min(11, X + W - 4 - x), 1, TABLE.foot); }
  r.finish();
  if (cls === "empty") return { r, ox: X, oy: Y + (h - 1) * 16 };
  // The exhibits, back row first so the front row stands over it.
  const rows = w === 1 ? h : h - 1, pitch = (face - top - 17) / Math.max(1, rows - 1);
  for (let j = 0; j < rows; j++) for (let i = 0; i < w; i++) {
    if (h2(i, j, n) < 0.08) continue;
    stamp(r, exhibitItem(cls, n + i * 17 + j * 131), X + i * 16, Math.round(top - 1 + j * pitch));
  }
  return { r, ox: X, oy: Y + (h - 1) * 16 };
}

/** What a stand of each class looks like: the colours of its screen and counter cloth, and what stands beside it. */
const CLASSES: Record<string, { screen: number; cloth: number; side: string }> = {
  food: { screen: 2, cloth: 3, side: "barrel" }, dress: { screen: 4, cloth: 0, side: "mannequin" }, dwelling: { screen: 1, cloth: 3, side: "washstand" },
  sanitary: { screen: 1, cloth: 2, side: "washstand" }, heating: { screen: 0, cloth: 3, side: "stove" }, school: { screen: 2, cloth: 1, side: "globe" },
  baths: { screen: 1, cloth: 2, side: "towels" }, india: { screen: 0, cloth: 3, side: "vase" }, china: { screen: 0, cloth: 3, side: "vase" },
  japan: { screen: 0, cloth: 1, side: "vase" }, belgium: { screen: 3, cloth: 0, side: "stove" }, france: { screen: 1, cloth: 0, side: "barrel" },
  refreshments: { screen: 3, cloth: 0, side: "barrel" }, cocoa: { screen: 3, cloth: 2, side: "barrel" }, garden: { screen: 2, cloth: 3, side: "vase" },
};

/** Something standing beside a stand, its foot at `base`: what the stand's trade keeps to hand. */
function beside(r: Raster, kind: string, x: number, base: number, c: readonly string[], n: number) {
  r.shadow(x + 6, base + 1, 8, 3, 0.24);
  if (kind === "barrel") {
    drum(r, x + 5, base, 5, 2, 12, WOOD, DARKWOOD);
    for (const y of [base - 3, base - 10]) r.fill(x, y, 11, 1, IRON[2]);
    // A sack leaning on it, tied at the neck.
    for (let j = 0; j < 9; j++) r.fill(x + 8 - (j > 2 ? 1 : 0), base - 8 + j, 6 + (j > 2 ? 1 : 0), 1, j < 2 ? "#e8dcc0" : j > 6 ? "#b8a888" : "#d4c6a6");
    r.fill(x + 9, base - 9, 3, 1, "#8a6a4a");
  } else if (kind === "mannequin") {
    // A dress form on a turned stand, in the stand's colour.
    r.fill(x + 6, base - 9, 1, 9, DARKWOOD[1]); r.fill(x + 3, base - 1, 7, 2, DARKWOOD[2]);
    for (let j = 0; j < 14; j++) {
      const half = j < 2 ? 2 : j < 6 ? 4 : j < 9 ? 3 : 4 + ((j - 9) >> 1);
      r.fill(x + 6 - half, base - 23 + j, half * 2 + 1, 1, j < 1 ? c[0] : j > 11 ? c[3] : c[1]);
      r.set(x + 6 - half, base - 23 + j, c[0]); r.set(x + 6 + half, base - 23 + j, c[3]);
    }
    r.fill(x + 5, base - 25, 3, 2, BRASS[1]); r.fill(x + 4, base - 21, 5, 1, "#f4f0e8");
  } else if (kind === "washstand") {
    box(r, x + 1, base - 12, 12, 3, 9, ["#fbfbf8", "#ecece6", "#cfd2d2", "#a8aeb0", "#80888c"], DARKWOOD);
    r.fill(x + 3, base - 12, 8, 2, "#9ec8d8"); r.fill(x + 10, base - 18, 2, 6, BRASS[1]); r.fill(x + 8, base - 18, 3, 1, BRASS[0]);
    drum(r, x + 4, base - 13, 2, 1, 5, ["#ffffff", "#ecece6", "#cfd2d2", "#a8aeb0", "#80888c"]);
  } else if (kind === "stove") {
    box(r, x + 1, base - 14, 12, 3, 11, IRON, IRON);
    r.fill(x + 4, base - 8, 6, 4, "#f08a3a"); r.fill(x + 5, base - 7, 4, 2, "#ffd070"); r.fill(x + 3, base - 9, 8, 1, IRON[4]);
    r.fill(x + 5, base - 30, 3, 16, IRON[2]); r.fill(x + 5, base - 30, 1, 16, IRON[0]); r.fill(x + 4, base - 31, 5, 1, IRON[1]);
    for (const fx of [x + 2, x + 11]) r.fill(fx, base, 1, 2, IRON[3]);
  } else if (kind === "globe") {
    r.fill(x + 6, base - 8, 1, 8, DARKWOOD[1]); r.fill(x + 3, base - 1, 7, 2, DARKWOOD[2]);
    for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) if (i * i + j * j <= 27) r.set(x + 6 + i, base - 13 + j, h2(i + 9, j + 9, n) > 0.55 ? (i + j < 0 ? "#8ac48a" : "#5e9a62") : i + j < -2 ? "#9ec8e8" : i + j > 4 ? "#3e6a9c" : "#5e8ec4");
    for (let a = -5; a <= 5; a++) r.set(x + 6 + a, base - 13 - Math.round(Math.sqrt(36 - a * a) * 0.9) - 1, BRASS[1]);
  } else if (kind === "towels") {
    for (const tx of [x + 1, x + 11]) r.fill(tx, base - 18, 1, 18, BRASS[2]);
    r.fill(x + 1, base - 18, 11, 1, BRASS[0]); r.fill(x + 1, base - 9, 11, 1, BRASS[1]);
    r.fill(x + 3, base - 17, 7, 7, "#fbfbf8"); r.fill(x + 3, base - 11, 7, 1, "#c8d8e0"); r.fill(x + 3, base - 13, 7, 1, "#9ec8d8");
    r.fill(x + 4, base - 8, 5, 6, "#f4ece0"); r.fill(x + 4, base - 3, 5, 1, "#d0c4b0");
  } else {
    // A tall vase on a little table.
    box(r, x + 2, base - 7, 10, 3, 5, DARKWOOD, DARKWOOD);
    for (let k = 0; k < 15; k++) drum(r, x + 7, base - 7 - k, 1.5 + Math.sin((k / 15) * Math.PI) * 3, 1, 1, c);
    for (let i = -3; i <= 3; i += 2) r.set(x + 7 + i, base - 15, BRASS[1]);
  }
}

/** What stands in a palace room in place of a tradesman's stand, by the room's class. */
const FURNITURE: Record<string, string> = { state: "settee", bedchamber: "settee", dining: "hearth", kitchen: "hearth", chapel: "altar", arms: "armour", office: "bureau", treasury: "bureau" };

/** A piece of palace furniture three cells wide: a gilt settee, a chimneypiece with its fire, an altar, a stand of arms, a writing bureau. */
function furniture(kind: string, v: number): FairSprite {
  const r = new Raster(64, 72), X = 8, Y = 52, W = 48, cx = X + W / 2, crim = v < 0.5 ? ["#e06a70", "#b83a46", "#8a2834", "#5e1a24"] : ["#7a9ad0", "#4e6eaa", "#36508a", "#243860"];
  r.shadow(cx + 3, Y + 14, W / 2, 4, 0.26);
  if (kind === "settee") {
    r.fill(X + 3, Y - 16, W - 6, 16, crim[1]); r.fill(X + 3, Y - 16, W - 6, 2, BRASS[0]); r.fill(X + 3, Y - 14, W - 6, 1, BRASS[2]);
    for (let x = X + 8; x < X + W - 6; x += 8) r.fill(x, Y - 11, 2, 2, BRASS[1]);
    for (let x = X + 3; x < X + W - 3; x++) r.set(x, Y - 17 - Math.round(Math.sin(((x - X - 3) / (W - 6)) * Math.PI) * 3), BRASS[1]);
    box(r, X + 2, Y, W - 4, 6, 5, crim, BRASS);
    for (const x of [X + 1, X + W - 5]) { r.fill(x, Y - 8, 4, 14, BRASS[1]); r.fill(x, Y - 8, 1, 14, BRASS[0]); r.fill(x, Y - 9, 4, 2, BRASS[0]); }
    for (const x of [X + 3, X + W / 2 - 1, X + W - 6]) r.fill(x, Y + 11, 3, 3, BRASS[2]);
  } else if (kind === "hearth") {
    box(r, X + 2, Y - 30, W - 4, 4, 40, STONE, STONE);
    r.fill(X + 10, Y - 14, W - 20, 24, "#2a2024"); r.fill(X + 14, Y + 2, W - 28, 8, "#f08030"); r.fill(X + 17, Y + 4, W - 34, 5, "#ffd060"); r.fill(X + 12, Y + 8, W - 24, 2, DARKWOOD[3]);
    r.fill(X + 1, Y - 32, W - 2, 3, STONE[0]); r.fill(X + 1, Y - 29, W - 2, 1, STONE[4]);
    r.fill(cx - 9, Y - 48, 18, 15, BRASS[1]); r.fill(cx - 7, Y - 46, 14, 11, "#c4dcea"); r.fill(cx - 7, Y - 46, 5, 4, "#f4fbff");
    for (const x of [X + 6, X + W - 9]) { r.fill(x, Y - 40, 2, 8, BRASS[1]); r.set(x, Y - 41, "#ffd060"); }
  } else if (kind === "altar") {
    box(r, X + 1, Y + 6, W - 2, 8, 4, STONE, STONE);
    box(r, X + 5, Y - 12, W - 10, 8, 16, ["#ffffff", "#f6f2e8", "#e0d8c8", "#b8ae9c", "#8a8070"], ["#ffffff", "#f6f2e8", "#e0d8c8", "#b8ae9c", "#8a8070"]);
    for (let x = X + 6; x < X + W - 6; x += 3) r.set(x, Y + 3, BRASS[1]);
    r.fill(cx - 1, Y - 34, 3, 20, BRASS[1]); r.fill(cx - 5, Y - 28, 11, 3, BRASS[1]); r.fill(cx - 1, Y - 34, 1, 20, BRASS[0]);
    for (const x of [X + 10, X + W - 12]) { r.fill(x, Y - 22, 2, 10, "#fffaf0"); r.set(x, Y - 24, "#ffb030"); r.set(x + 1, Y - 23, "#fff090"); r.fill(x - 1, Y - 13, 4, 2, BRASS[1]); }
  } else if (kind === "armour") {
    box(r, X + 2, Y + 4, W - 4, 6, 4, DARKWOOD, DARKWOOD);
    for (const [ax, tilt] of [[cx - 14, 1], [cx + 14, -1]]) for (let k = 0; k < 44; k++) { r.set(ax + Math.round(tilt * k * 0.18), Y + 4 - k, DARKWOOD[1]); if (k > 38) r.fill(ax + Math.round(tilt * k * 0.18) - 2, Y + 4 - k, 5, 1, IRON[0]); }
    for (let j = 0; j < 16; j++) { const half = j < 3 ? 5 : j < 10 ? 7 : 6; r.fill(cx - half, Y - 22 + j, half * 2 + 1, 1, j < 2 ? IRON[0] : IRON[1]); r.set(cx - half, Y - 22 + j, "#c4ccd8"); r.set(cx, Y - 22 + j, IRON[3]); }
    for (let j = 0; j < 8; j++) r.fill(cx - 4 + (j > 5 ? 1 : 0), Y - 32 + j, 9 - (j > 5 ? 2 : 0), 1, j < 2 ? "#c4ccd8" : IRON[1]);
    r.fill(cx - 3, Y - 28, 7, 1, IRON[4]); r.fill(cx - 1, Y - 36, 3, 4, "#c83028"); r.fill(cx, Y - 6, 1, 10, DARKWOOD[2]);
  } else {
    // A writing bureau: a slope of green leather, pigeon holes behind, papers and an inkstand.
    box(r, X + 4, Y - 4, W - 8, 8, 12, DARKWOOD, DARKWOOD);
    r.fill(X + 8, Y - 2, W - 16, 5, "#3e7850"); r.fill(X + 8, Y - 2, W - 16, 1, "#5e9a6a");
    box(r, X + 6, Y - 20, W - 12, 3, 13, DARKWOOD, DARKWOOD);
    for (let x = X + 9; x < X + W - 10; x += 7) r.fill(x, Y - 15, 5, 9, DARKWOOD[4]), r.fill(x + 1, Y - 12, 3, 6, "#f4ecd8");
    r.fill(X + 12, Y - 1, 8, 3, "#fffaf0"); r.fill(X + 26, Y - 1, 4, 3, BRASS[1]); for (let k = 0; k < 7; k++) r.set(X + 30 + k * 0.7, Y - 1 - k, "#fffaf0");
    for (const x of [X + 5, X + W - 7]) r.fill(x, Y + 14, 2, 3, DARKWOOD[3]);
  }
  r.finish();
  return { r, ox: X, oy: Y };
}

function stall(v: number, cls = ""): FairSprite {
  if (FURNITURE[cls]) return furniture(FURNITURE[cls], v);
  if (v >= 0.8) return trophy(v);
  const r = new Raster(80, 72), X = 8, Y = 52, W = 48, n = Math.floor(v * 97), look = CLASSES[cls];
  const c = STALLS[look ? (look.screen + (n % 2 ? 0 : 0)) % STALLS.length : n % STALLS.length], cloth = STALLS[look ? look.cloth : (n + 2) % STALLS.length];
  const goods = [BRASS, RED, GLASS, STONE, GREEN, ramp(c[0])];
  const item = (x: number, y: number, k: number) => {
    const g = goods[k % goods.length], kind = Math.floor(h2(x, y, n) * 4);
    if (kind === 0) { r.fill(x, y - 6, 3, 6, g[1]); r.fill(x + 1, y - 8, 1, 2, g[2]); r.set(x, y - 6, g[0]); r.fill(x + 2, y - 5, 1, 5, g[3]); }
    else if (kind === 1) { r.fill(x, y - 4, 5, 4, g[1]); r.fill(x, y - 4, 5, 1, g[0]); r.fill(x + 4, y - 3, 1, 3, g[3]); }
    else if (kind === 2) drum(r, x + 2, y - 1, 2, 1, 4, g);
    else { r.fill(x, y - 3, 6, 3, g[2]); r.fill(x, y - 3, 6, 1, g[0]); r.fill(x, y - 1, 6, 1, g[3]); }
  };
  r.shadow(X + W / 2 + 3, Y + 13, W / 2 + 2, 5, 0.26);
  // Back screen, panelled, with two shelves.
  r.fill(X + 3, Y - 38, W - 6, 36, c[2]);
  r.fill(X + 3, Y - 38, W - 6, 1, c[1]);
  for (let x = X + 6; x < X + W - 8; x += 13) { r.fill(x, Y - 35, 10, 30, c[1]); r.fill(x, Y - 35, 10, 1, c[0]); r.fill(x + 9, Y - 34, 1, 29, c[3]); }
  for (const sy of [Y - 24, Y - 13]) {
    r.fill(X + 4, sy, W - 8, 2, DARKWOOD[1]); r.fill(X + 4, sy, W - 8, 1, DARKWOOD[0]); r.fill(X + 4, sy + 2, W - 8, 1, c[3]);
    for (let x = X + 6, k = 0; x < X + W - 10; x += 7, k++) item(x, sy, k + sy);
  }
  // Posts and the nameboard, a gilt crest at its middle.
  for (const x of [X + 1, X + W - 4]) { r.fill(x, Y - 44, 3, 54, DARKWOOD[2]); r.fill(x, Y - 44, 1, 54, DARKWOOD[0]); r.fill(x + 2, Y - 44, 1, 54, DARKWOOD[3]); drum(r, x + 1, Y - 45, 2, 1, 2, BRASS); }
  r.fill(X, Y - 46, W, 9, DARKWOOD[2]); r.fill(X, Y - 46, W, 1, DARKWOOD[0]); r.fill(X, Y - 38, W, 1, DARKWOOD[4]);
  r.fill(X + 3, Y - 44, W - 6, 5, c[0]); r.fill(X + 3, Y - 40, W - 6, 1, c[1]);
  for (let x = X + 8; x < X + W - 8; x += 3) if (h2(x, 1, n) > 0.3) r.fill(x, Y - 43, 2, 2, c[3]);
  for (let j = 0; j < 5; j++) r.fill(X + W / 2 - 5 + j, Y - 50 + j, 10 - 2 * j, 1, BRASS[j < 2 ? 1 : 2]);
  r.fill(X + W / 2 - 6, Y - 47, 12, 1, BRASS[2]);
  // The counter: a wooden top over a valance of cloth with a gold fringe.
  box(r, X + 3, Y, W - 6, 5, 10, WOOD, cloth);
  for (let x = X + 3; x < X + W - 3; x++) { r.set(x, Y + 7, (x & 1) ? BRASS[1] : BRASS[2]); if ((x - X) % 8 === 4) r.fill(x, Y + 6, 1, 9, cloth[3]); }
  for (let x = X + 6, k = 0; x < X + W - 9; x += 8, k++) item(x, Y + 3, k + 3);
  if (look) beside(r, look.side, X + W + 2, Y + 12, cloth, n);
  r.finish();
  return { r, ox: X, oy: Y };
}

/** An exhibit's picture from its sprite name, `made:exhibit:<fair>:<area>:<find>:<w>x<h>:<n>` with `:wall` when it hangs:
 * drawn as the area would draw it, the middle of the foot of the picture at the middle of the foot of its nearest left cell. */
export function exhibitPicture(frame: string) {
  const m = /^made:exhibit:([^:]+):([^:]+):([^:]+):(\d+)x(\d+):(\d+)(:wall)?$/.exec(frame);
  const fair = m && fairById(m[1]), area = fair?.areas.find((a) => a.id === m![2]), f = m && fairFind(m[3]);
  if (!m || !fair || !f) return undefined;
  const palace = area?.kind === "gallery" && (area.look ?? fair.look) === "palace", style = palace ? { ...(fair.palace ?? louisQuatorze), ...area?.palace } : undefined;
  const w = Number(m[4]), h = Number(m[5]);
  const s = paintFairThing(f.art, w, h, Number(m[6]) / 10, f.tint, (style?.order ?? "classical") === "classical", style);
  if (!s) return undefined;
  // On a palace wall a hung thing has a bay to itself: in the middle of it, at eye height.
  const hung = !!m[7] && palace, mid = s.ox + 8 - (hung ? (3 - w) * 8 : 0), half = Math.max(mid, s.r.w - mid), foot = Math.min(s.r.h, s.oy + h * 16), out = new Raster(half * 2, foot + (hung ? 30 : 0));
  for (let y = 0; y < foot; y++) for (let x = 0; x < s.r.w; x++) {
    const i = (y * s.r.w + x) * 4, o = (y * out.w + x + half - mid) * 4;
    for (let k = 0; k < 4; k++) out.data[o + k] = s.r.data[i + k];
  }
  return out;
}
