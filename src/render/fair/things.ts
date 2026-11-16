import { box, drum } from "../ship/things";
import { h2, Raster } from "../ship/raster";
import { MACHINES } from "../../world/fair";

/** A sprite for a cell-sized thing: its footprint's top-left sits at (ox, oy) in the raster. */
export type FairSprite = { r: Raster; ox: number; oy: number; glow?: { x: number; y: number }[] };

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

/** The great engine's flywheel, in px from its footprint's top-left: the view turns its spokes. */
export const flywheel = (w: number) => ({ x: w * 16 - 62, y: 2, r: 56 });

export function paintFairThing(art: string, w: number, h: number, v: number, tint?: string): FairSprite | undefined {
  const W = w * 16, H = h * 16, pad = 8;
  const make = (rise: number): FairSprite & { X: number; Y: number } => ({ r: new Raster(W + pad * 2, H + rise + pad + 4), ox: pad, oy: rise, X: pad, Y: rise });
  const t = tint ? ramp(tint) : undefined;
  const done = (s: FairSprite & { X: number; Y: number }, card = true) => {
    if (card) placard(s.r, s.X + 1, s.Y + H - 2);
    s.r.finish();
    return s;
  };
  const ground = (s: { r: Raster; X: number; Y: number }) => s.r.shadow(s.X + W / 2 + 2, s.Y + H - 3, W / 2 + 2, 5, 0.28);
  switch (art) {
    case "vitrine": {
      // A long glazed case on a cabinet, its goods laid out in a row behind the glass.
      const s = make(30), { r, X, Y } = s, goods = t ?? BRASS;
      ground(s);
      box(r, X + 1, Y + 1, W - 2, H - 8, 10, DARKWOOD, DARKWOOD);
      for (let x = X + 6; x < X + W - 6; x += 12) r.fill(x, Y + H - 5, 8, 3, DARKWOOD[1]);
      const gy = Y - 16;
      r.fill(X + 2, gy, W - 4, 18, GLASS[2]);
      r.fill(X + 2, gy, W - 4, 7, GLASS[1]);
      for (let i = 0; i < W - 10; i += 7) {
        const x = X + 6 + i, kind = Math.floor(h2(i, 3, Math.floor(v * 97)) * 4);
        if (kind === 0) for (let k = 0; k < 4; k++) r.fill(x + k, gy + 6 + (k % 2), 1, 9, goods[k % 2 ? 1 : 2]);
        else if (kind === 1) { r.fill(x, gy + 9, 5, 5, goods[1]); r.fill(x + 1, gy + 8, 3, 1, goods[0]); r.fill(x, gy + 13, 5, 1, goods[3]); }
        else if (kind === 2) { drum(r, x + 2, gy + 14, 2, 1, 7, goods); }
        else { r.fill(x, gy + 11, 6, 3, goods[2]); r.fill(x, gy + 11, 6, 1, goods[0]); }
      }
      r.fill(X + 2, gy - 1, W - 4, 1, BRASS[1]); r.fill(X + 2, gy + 17, W - 4, 1, BRASS[2]);
      for (const x of [X + 2, X + W - 3, X + (W >> 1)]) r.fill(x, gy - 1, 1, 19, BRASS[2]);
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
      drum(r, cx, Y - 6, 4, 1.5, 18, m);
      drum(r, cx, Y - 24, 3, 1, 8, m);
      drum(r, cx, Y - 33, 2.5, 2, 4, m);
      r.fill(cx + 4, Y - 42, 2, 14, m[2]); r.fill(cx + 4, Y - 42, 1, 14, m[1]);
      r.fill(cx - 6, Y - 28, 2, 10, m[1]);
      r.fill(cx - 4, Y - 10, 8, 4, m[2]);
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
    case "engine": {
      // A horizontal steam engine on an iron bed: the green cylinder and its valve chest,
      // a bright rod to the crank, the governor's balls, and a big red flywheel.
      if (w >= 6) return done(greatEngine(make(64), W, H), false);
      const s = make(46), { r, X, Y } = s, bx = W - 18, by = -26;
      ground(s);
      box(r, X + 1, Y + 8, W - 2, H - 16, 7, STONE, STONE);
      r.fill(X + 3, Y + 10, W - 8, 1, IRON[0]);
      const rad = 17, fx = X + bx, fy = Y + by + rad + 1;
      for (let j = -rad; j <= rad; j++) for (let i = -rad; i <= rad; i++) {
        const d = Math.hypot(i, j);
        if (d > rad + 0.5) continue;
        const a = Math.atan2(j, i), lightK = Math.cos(a + 2.3);
        if (d > rad - 4) r.set(fx + i, fy + j, d > rad - 0.5 ? RED[4] : RED[lightK > 0.4 ? 0 : lightK > -0.3 ? 1 : 2]);
        else if (d < 4) r.set(fx + i, fy + j, d < 2 ? BRASS[0] : BRASS[2]);
        else if (Math.abs(((a / (Math.PI / 3)) % 1 + 1) % 1 - 0.5) > 0.5 - 1.6 / d) r.set(fx + i, fy + j, RED[2]);
      }
      const cyl = ["#b4d2a4", "#8ab47a", "#6a965c", "#4c7442", "#30502c"];
      box(r, X + 2, Y - 8, 17, 6, 12, cyl, cyl);
      for (const x of [X + 4, X + 16]) r.fill(x, Y - 2, 1, 12, BRASS[2]);
      box(r, X + 5, Y - 15, 11, 4, 4, IRON, IRON);
      r.fill(X + 19, fy - 1, fx - X - 19, 3, STONE[1]); r.fill(X + 19, fy - 1, fx - X - 19, 1, "#ffffff");
      r.fill(fx - 2, fy - 2, 5, 5, BRASS[1]);
      r.fill(X + 10, Y - 30, 1, 15, BRASS[2]);
      for (const sx of [-4, 4]) drum(r, X + 10 + sx, Y - 26, 2, 1.5, 3, BRASS);
      r.fill(X + 6, Y - 31, 9, 1, BRASS[1]);
      return done(s);
    }
    case "dynamo": {
      // An Edison dynamo: two tall field magnets wound in copper on an iron bed,
      // joined by a yoke, the armature turning between their feet.
      const s = make(46), { r, X, Y } = s;
      ground(s);
      box(r, X + 1, Y + 2, W - 2, H - 8, 6, STONE, STONE);
      const copper = ["#f4bc90", "#d88a58", "#b06a40", "#844c2c", "#56301c"];
      for (const x of [X + 9, X + W - 9]) {
        drum(r, x, Y + 2, 6, 2.5, 30, copper, IRON);
        for (let y = Y - 26; y < Y + 2; y += 3) r.fill(x - 5, y, 11, 1, copper[3]);
      }
      box(r, X + 2, Y - 34, W - 4, 4, 5, IRON, IRON);
      drum(r, X + W / 2, Y + 4, 6, 3, 9, IRON);
      r.fill(X + W / 2 - 4, Y - 2, 8, 2, copper[1]);
      drum(r, X + W / 2, Y - 34, 4, 2, 5, BRASS);
      return done(s);
    }
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
export function paintFairDecor(type: string, v: number): FairSprite | undefined {
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
  if (type === "stall") return stall(v);
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
  if (type === "demo") return demo();
  return undefined;
}

/** The great engine: a long cylinder on an iron bed, the rods to the crank, and a
 * flywheel taller than a man in a slot in its stone plinth, roped off. Its spokes
 * are drawn turning by the view. */
function greatEngine(s: FairSprite & { X: number; Y: number }, W: number, H: number) {
  const { r, X, Y } = s, fw = flywheel(W / 16), fx = X + fw.x, fy = Y + fw.y, black = ["#6a7486", "#465062", "#30384a", "#222836", "#141820"];
  const cl = X + 10, cr = X + 104, bedTop = Y + 22;
  r.shadow(X + W / 2 + 4, Y + H - 6, W / 2 + 4, 9, 0.3);
  box(r, X + 4, Y + H - 28, W - 8, 16, 8, STONE, STONE);
  r.fill(fx - 8, Y + H - 26, 16, 14, STONE[4]);
  for (let j = -fw.r; j <= fw.r; j++) for (let i = -fw.r; i <= fw.r; i++) {
    const d = Math.hypot(i, j), a = Math.atan2(j, i), k = Math.cos(a + 2.3);
    if (d > fw.r + 0.5) continue;
    if (d > fw.r - 8) r.set(fx + i, fy + j, d > fw.r - 0.7 || d < fw.r - 7.3 ? black[4] : black[k > 0.4 ? 0 : k > -0.3 ? 1 : 2]);
    else if (d < 9) r.set(fx + i, fy + j, d < 3 ? BRASS[0] : d < 6 ? black[1] : black[3]);
  }
  // The plinth's face hides the foot of the wheel, turning in its slot.
  r.fill(X + 4, Y + H - 12, W - 8, 8, STONE[2]); r.fill(X + 4, Y + H - 12, W - 8, 1, STONE[1]); r.fill(X + 4, Y + H - 5, W - 8, 1, STONE[4]); r.fill(X + W - 5, Y + H - 12, 1, 8, STONE[3]);
  r.fill(fx - 8, Y + H - 12, 16, 6, STONE[4]);
  // The bed from the cylinder to the crank, the crosshead guides on it, and the rods.
  box(r, cr - 4, bedTop, fx - cr - 10, 10, 12, black, black);
  r.fill(cr + 6, bedTop - 6, 40, 5, black[1]); r.fill(cr + 6, bedTop - 6, 40, 1, black[0]);
  box(r, cr + 30, bedTop - 12, 12, 8, 8, black, black);
  r.fill(cr, bedTop - 3, fx - cr, 3, STONE[1]); r.fill(cr, bedTop - 3, fx - cr, 1, "#ffffff");
  // The cylinder: lagged in dark blue-black, banded in brass, the valve chest on top.
  box(r, cl, Y - 2, cr - cl, 14, 28, black, black);
  for (let x = cl + 12; x < cr - 4; x += 20) r.fill(x, Y + 12, 2, 28, BRASS[2]), r.set(x, Y - 10, BRASS[0]);
  drum(r, cl, Y + 26, 4, 3, 26, black);
  box(r, cl + 24, Y - 14, 44, 8, 8, black, black);
  for (const x of [cl + 30, cl + 46, cl + 62]) drum(r, x, Y - 14, 2.5, 1, 7, BRASS);
  r.fill(cl + 84, Y - 36, 1, 22, BRASS[2]); for (const sx of [-5, 5]) drum(r, cl + 84 + sx, Y - 28, 3, 2, 4, BRASS);
  r.fill(cl + 79, Y - 37, 11, 2, BRASS[1]);
  // Brass posts and a red rope along the front.
  for (let x = X + 2; x <= X + W - 2; x += 28) { r.fill(x, Y + H - 12, 2, 12, BRASS[2]); r.fill(x - 1, Y + H - 13, 4, 2, BRASS[0]); }
  for (let x = X + 2; x < X + W - 2; x++) r.set(x, Y + H - 11 + Math.round(Math.sin((((x - X - 2) % 28) / 28) * Math.PI) * 4), RED[2]);
  return s;
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

/** A demonstration of driving by belt: a line shaft on two A-frames over a platform
 * of small machines, a belt down from the shaft to each. */
function demo(): FairSprite {
  const W = 13 * 16, r = new Raster(W + 16, 48 + 76), X = 8, Y = 76;
  r.shadow(X + W / 2 + 4, Y + 44, W / 2 + 2, 6, 0.26);
  box(r, X, Y + 8, W, 30, 8, WOOD, DARKWOOD);
  for (let x = X + 12; x < X + W; x += 12) r.fill(x, Y + 9, 1, 28, WOOD[2]);
  const shaft = Y - 34, feet = Y + 30;
  const machine = (mx: number, k: number) => {
    if (k === 0) { box(r, mx - 16, feet - 12, 32, 6, 6, IRON, IRON); box(r, mx - 16, feet - 22, 10, 5, 10, IRON, IRON); r.fill(mx - 6, feet - 16, 18, 2, STONE[1]); box(r, mx + 10, feet - 18, 6, 4, 6, IRON, IRON); }
    else if (k === 1) { box(r, mx - 12, feet - 6, 24, 5, 4, IRON, IRON); drum(r, mx, feet - 6, 9, 4, 14, ["#f4bc90", "#d88a58", "#b06a40", "#844c2c", "#56301c"], IRON); }
    else { box(r, mx - 10, feet - 8, 20, 5, 6, IRON, IRON); r.fill(mx - 7, feet - 30, 4, 24, IRON[2]); r.fill(mx + 3, feet - 30, 4, 24, IRON[2]); r.fill(mx - 8, feet - 32, 16, 4, IRON[1]); r.fill(mx - 8, feet - 32, 16, 1, IRON[0]); drum(r, mx, feet - 14, 5, 2, 4, BRASS); }
    const top = k === 1 ? feet - 24 : k === 0 ? feet - 22 : feet - 32;
    for (const dx of [-3, 3]) { r.fill(mx + dx, shaft + 3, 2, top - shaft - 3, "#5a3a24"); r.fill(mx + dx, shaft + 3, 1, top - shaft - 3, "#8a5e3c"); }
    r.fill(mx - 4, shaft - 4, 10, 9, IRON[2]); r.fill(mx - 4, shaft - 4, 10, 1, IRON[0]); r.fill(mx - 4, shaft + 4, 10, 1, IRON[4]);
  };
  for (const ax of [X + 14, X + W - 14]) for (const s of [-1, 1]) for (let y = shaft; y < feet; y++) {
    const x = ax + s * Math.round(((y - shaft) * 10) / (feet - shaft));
    r.fill(x - 1, y, 3, 1, IRON[2]); r.set(x - 1, y, IRON[0]);
  }
  r.fill(X + 8, shaft, W - 16, 3, IRON[1]); r.fill(X + 8, shaft, W - 16, 1, IRON[0]); r.fill(X + 8, shaft + 2, W - 16, 1, IRON[3]);
  [X + 50, X + 104, X + 158].forEach((mx, k) => machine(mx, k));
  r.finish();
  return { r, ox: X, oy: Y + 32 };
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
function stall(v: number): FairSprite {
  if (v >= 0.6) return trophy(v);
  const r = new Raster(64, 72), X = 8, Y = 52, W = 48, n = Math.floor(v * 97);
  const c = STALLS[n % STALLS.length], cloth = STALLS[(n + 2) % STALLS.length];
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
  r.finish();
  return { r, ox: X, oy: Y };
}
