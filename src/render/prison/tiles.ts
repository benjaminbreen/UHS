import { BARS, WALL, YARD, type PrisonLayout, type PrisonPlan } from "../../world/prison-plan";
import { h2, Raster } from "../ship/raster";

type Ramp3 = readonly [string, string, string];
export type PrisonLook = {
  /** Wall stone from the lit rim down to the joint colour. */
  wall: readonly [string, string, string, string, string];
  line: string;
  skirt: Ramp3;
  floor: Ramp3;
  yard: Ramp3;
  /** The solid mass above the walls, and its dot. */
  roof: readonly [string, string];
  metal: Ramp3;
  wood: Ramp3;
  masonry: "ashlar" | "brick" | "timber" | "plaster";
  paving: "cobble" | "flag" | "tile" | "concrete";
  bars: "iron" | "wood";
  lamp: "torch" | "lantern" | "bulb";
  glow: readonly [number, number, number];
};

export const prisonLooks: Record<PrisonLayout, PrisonLook> = {
  keep: {
    wall: ["#bcb4e4", "#978dca", "#766cb0", "#5d5398", "#463c78"],
    line: "#2a2250",
    skirt: ["#c4905a", "#9a643c", "#66402c"],
    floor: ["#588c8a", "#4a7c7c", "#3c686c"],
    yard: ["#8a9a6c", "#7a8a60", "#667650"],
    roof: ["#8878b8", "#7868a8"],
    metal: ["#c8d0e4", "#8890ac", "#4c5270"],
    wood: ["#b07c48", "#865a34", "#563824"],
    masonry: "ashlar", paving: "cobble", bars: "iron", lamp: "torch", glow: [255, 190, 96],
  },
  wards: {
    wall: ["#d8a88c", "#b8806a", "#9a6254", "#7c4a44", "#5c3438"],
    line: "#32202c",
    skirt: ["#b4ac9c", "#8c8474", "#5c564c"],
    floor: ["#8e9088", "#7e8078", "#666860"],
    yard: ["#a0947c", "#90846c", "#786c58"],
    roof: ["#74606c", "#64525e"],
    metal: ["#bcc0c8", "#7c808c", "#44485a"],
    wood: ["#a87848", "#7e5632", "#503422"],
    masonry: "brick", paving: "flag", bars: "iron", lamp: "torch", glow: [255, 196, 110],
  },
  yamen: {
    wall: ["#ece6d6", "#d2ccbc", "#a0a29e", "#84888a", "#666a70"],
    line: "#2c2c38",
    skirt: ["#b8b4a8", "#908c82", "#605e5a"],
    floor: ["#929088", "#84827a", "#6c6a66"],
    yard: ["#a8a290", "#9a9482", "#827c6c"],
    roof: ["#5c646e", "#4c545e"],
    metal: ["#c0c4c8", "#80848c", "#484c58"],
    wood: ["#a45c40", "#7c3e30", "#502624"],
    masonry: "timber", paving: "tile", bars: "wood", lamp: "lantern", glow: [255, 170, 110],
  },
  cellblock: {
    wall: ["#e4e2cc", "#cccab2", "#86a48c", "#6a8872", "#4c6458"],
    line: "#242c34",
    skirt: ["#6c7480", "#4c5460", "#343a44"],
    floor: ["#a09e98", "#92908c", "#7c7a78"],
    yard: ["#a8a49c", "#9a968e", "#84807a"],
    roof: ["#505a68", "#444e5c"],
    metal: ["#d0d6dc", "#8c949e", "#4c5460"],
    wood: ["#a88458", "#7e6040", "#50402c"],
    masonry: "plaster", paving: "concrete", bars: "iron", lamp: "bulb", glow: [255, 236, 180],
  },
};

const T = 16, DEPTH = 32;

function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  let out = "#";
  for (const s of [16, 8, 0]) out += Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t).toString(16).padStart(2, "0");
  return out;
}

function art(r: Raster, x: number, y: number, rows: readonly string[], pal: Record<string, string>) {
  rows.forEach((row, j) => [...row].forEach((ch, i) => r.set(x + i, y + j, pal[ch])));
}

/** A 64px repeat of rounded stones: which stone each pixel belongs to, or -1 on a joint. */
const cobbles = (() => {
  const N = 64, C = 8, seeds: [number, number][] = [];
  for (let j = 0; j < C; j++)
    for (let i = 0; i < C; i++) seeds.push([i * 8 + 1.5 + h2(i, j, 3) * 5 + (j & 1) * 4, j * 8 + 1.5 + h2(i, j, 5) * 5]);
  const out = new Int16Array(N * N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let a = 1e9, b = 1e9, who = 0;
      seeds.forEach(([sx, sy], k) => {
        const dx = Math.abs(x - sx), dy = Math.abs(y - sy);
        // Squarer than a true Voronoi, so the stones read as laid rather than cracked.
        const d = Math.hypot(Math.min(dx, N - dx), Math.min(dy, N - dy) * 1.15);
        if (d < a) { b = a; a = d; who = k; } else if (d < b) b = d;
      });
      out[y * N + x] = b - a < 1.25 ? -1 : who;
    }
  return out;
})();

function paving(look: PrisonLook, x: number, y: number) {
  const [hi, mid, joint] = look.floor;
  const tone = (n: number) => (n > 0.8 ? hi : n < 0.14 ? mix(mid, joint, 0.4) : mid);
  if (look.paving === "cobble") {
    const k = cobbles[(y & 63) * 64 + (x & 63)];
    return k < 0 ? joint : tone(h2(k, 9, 1));
  }
  if (look.paving === "flag") {
    const row = y >> 4, u = x + ((row * 11) % 24);
    return y % 16 === 0 || u % 24 === 0 ? joint : tone(h2(Math.floor(u / 24), row, 2));
  }
  if (look.paving === "tile") return x % 16 === 0 || y % 16 === 0 ? joint : tone(h2(x >> 4, y >> 4, 4) * 0.84);
  return x % 48 === 0 || y % 48 === 0 ? mix(mid, joint, 0.7) : h2(x, y, 6) > 0.992 ? hi : mid;
}

function earth(look: PrisonLook, x: number, y: number) {
  const [hi, mid, lo] = look.yard;
  if (look.paving === "tile" || look.paving === "concrete") {
    const row = Math.floor(y / 8), u = x + (row & 1) * 8;
    return y % 8 === 0 || u % 16 === 0 ? lo : h2(Math.floor(u / 16), row, 8) > 0.82 ? hi : mid;
  }
  const n = h2(x >> 1, y >> 1, 7);
  return n > 0.965 ? hi : n < 0.03 ? lo : mid;
}

/** The wall's cross-section, from the floor (1) up to the rim against the roof (32). */
function wallAt(look: PrisonLook, d: number, along: number) {
  const [w0, w1, w2, w3, w4] = look.wall, [s0, s1, s2] = look.skirt, [t0, t1, t2] = look.wood;
  const timber = look.masonry === "timber";
  if (d === 1) return look.line;
  if (d <= 6) return d === 6 ? s0 : d === 2 || (!timber && look.masonry !== "plaster" && along % 8 === 0) ? s2 : s1;
  if (d === 7) return mix(look.line, w4, 0.35);
  if (d === DEPTH) return mix(look.line, w4, 0.45);
  if (timber && d >= 8 && d < 26 && along % 48 < 4) return [t0, t1, t1, t2][along % 48];
  if (d >= 26) {
    if (timber) return d === 30 ? t0 : d === 26 || d === 31 ? t2 : t1;
    return d === 30 ? w0 : d === 26 ? w2 : w1;
  }
  if (d === 25 || d === 16) return w4;
  const upper = d > 16, row = upper ? d - 17 : d - 8, tone = upper ? w2 : w3;
  if (look.masonry === "plaster" || (timber && upper)) return upper ? (row === 0 ? mix(w1, w2, 0.4) : w1) : row === 7 ? w2 : w3;
  const brick = look.masonry === "brick" || timber;
  const course = brick ? (row >> 2) + (upper ? 2 : 0) : upper ? 1 : 0, len = brick ? 8 : 16;
  const u = along + (course & 1) * (len >> 1);
  if (u % len === 0 || (brick && (row & 3) === 0)) return mix(tone, w4, brick ? 0.7 : 1);
  const n = h2(Math.floor(u / len), course, 11), body = n > 0.78 ? mix(tone, w1, 0.22) : n < 0.16 ? mix(tone, w4, 0.3) : tone;
  if (brick) return body;
  return row === 7 ? mix(body, w0, 0.3) : row === 0 ? mix(body, w4, 0.4) : body;
}

/** Floors, the four-sided sloped walls with mitred corners, the roof mass, and everything flat on them. */
export function paintPrisonGround(plan: PrisonPlan, look: PrisonLook): Raster {
  const W = plan.w * T, H = plan.h * T, R = new Raster(W, H);
  const at = (tx: number, ty: number) => (tx < 0 || ty < 0 || tx >= plan.w || ty >= plan.h ? WALL : plan.cells[ty * plan.w + tx]);
  for (let py = 0; py < H; py++)
    for (let px = 0; px < W; px++) {
      const tx = px >> 4, ty = py >> 4, cell = at(tx, ty);
      if (cell !== WALL) {
        let col = cell === YARD ? earth(look, px, py) : paving(look, px, py);
        const north = at(tx, ty - 1), v = py & 15, u = px & 15;
        const dark = north === WALL ? (v < 2 ? 0.3 : v < 5 ? 0.14 : 0) : north === BARS && cell !== BARS && v < 3 ? 0.24 : 0;
        const side = at(tx - 1, ty) === WALL && u < 3 ? 0.14 : 0;
        if (dark || side) col = mix(col, look.line, Math.max(dark, side));
        R.set(px, py, col);
        continue;
      }
      let best = 99, vert = false, horiz = false, south = false, east = false;
      for (let j = ty - 2; j <= ty + 2; j++)
        for (let i = tx - 2; i <= tx + 2; i++) {
          if (at(i, j) === WALL) continue;
          const dx = px < i * T ? i * T - px : px > i * T + 15 ? i * T + 15 - px : 0;
          const dy = py < j * T ? j * T - py : py > j * T + 15 ? j * T + 15 - py : 0;
          const d = Math.max(Math.abs(dx), Math.abs(dy));
          if (d > best) continue;
          if (d < best) { best = d; vert = horiz = false; }
          // A floor that is nearest only corner-on decides nothing; it leaves the mitre line.
          if (Math.abs(dx) === d && Math.abs(dy) === d) continue;
          if (Math.abs(dy) === d) { vert = true; south = dy > 0; }
          else { horiz = true; east = dx > 0; }
        }
      if (best > DEPTH) {
        R.set(px, py, (px % 8 === 1 && py % 8 === 1) || (px % 8 === 5 && py % 8 === 5) ? look.roof[1] : look.roof[0]);
        continue;
      }
      if (vert ? horiz : !horiz) {
        R.set(px, py, best === 1 ? look.line : best >= 30 ? look.wall[1] : look.wall[4]);
        continue;
      }
      const col = wallAt(look, best, vert ? px : py);
      // The wall you face is lightest; the one you look over the back of is darkest.
      R.set(px, py, vert ? (south ? col : mix(col, look.line, 0.16)) : mix(col, look.line, east ? 0.05 : 0.1));
    }
  for (const f of plan.features) flat(R, plan, look, f);
  return R;
}

function flat(R: Raster, plan: PrisonPlan, look: PrisonLook, f: PrisonPlan["features"][number]) {
  const [w0, w1, w2, w3, w4] = look.wall, [m0, m1, m2] = look.metal, [t0, t1, t2] = look.wood;
  const x = f.x * T, y = f.y * T;
  if (f.type === "stairs" || f.type === "door") {
    // A two-tile opening through the wall, splayed so it is wider at the floor than at the head.
    const out = f.type === "door";
    for (let j = 0; j < 25; j++) {
      const py = out ? y + j : y + 15 - j, inset = 1 + Math.floor(j / 7);
      for (let i = inset; i < 32 - inset; i++) {
        const jamb = i < inset + 3 ? i - inset : i >= 29 - inset ? 31 - inset - i : 3;
        if (jamb < 3) {
          R.set(x + i, py, jamb === 0 ? look.line : i < 16 ? (jamb === 1 ? w0 : w1) : jamb === 1 ? w2 : w3);
          continue;
        }
        const step = Math.floor(j / 5), edge = j % 5 === 4;
        const lit = out ? mix(w1, "#fff2c8", 0.25 + step * 0.16) : mix(w2, "#0e0a1c", 0.12 + step * 0.2);
        R.set(x + i, py, j === 24 ? look.line : edge ? mix(lit, look.line, out ? 0.3 : 0.5) : lit);
      }
    }
  } else if (f.type === "window") {
    const cx = x + 8, top = y - 9;
    R.fill(cx - 5, top - 1, 10, 11, w4);
    R.fill(cx - 4, top, 8, 9, "#d4e4e8");
    R.fill(cx - 4, top, 8, 2, "#a8c4d4");
    R.fill(cx - 5, top + 9, 10, 1, w0);
    for (const b of [-2, 1]) R.fill(cx + b, top, 1, 9, m2);
    // Daylight falls through it as a slanted patch with the bars' shadows in it.
    for (let j = 0; j < 30; j++)
      for (let i = -4; i < 4; i++) {
        if (i === -2 || i === 1) continue;
        const px = cx + i + 3 + (j >> 2), py = y + T + 5 + j;
        if (plan.cells[(py >> 4) * plan.w + (px >> 4)] === 1) R.shade(px, py, j < 24 ? 0.2 : 0.1, [236, 240, 200]);
      }
  } else if (f.type === "shackle") {
    const ex = x + T, cy = y + 7;
    R.fill(ex - 19, cy - 1, 3, 3, m2);
    R.set(ex - 18, cy, m0);
    for (let i = 0; i < 11; i++) R.set(ex - 16 + i, cy + (i & 1), i & 1 ? m2 : m1);
    R.fill(ex - 5, cy - 1, 3, 3, m1);
    R.set(ex - 4, cy, w4);
  } else if (f.type === "keys") {
    R.fill(x + 1, y - 6, 14, 3, t1);
    R.fill(x + 1, y - 6, 14, 1, t0);
    R.fill(x + 1, y - 3, 14, 1, w4);
    for (const k of [3, 7, 11]) {
      R.fill(x + k, y - 3, 2, 2, "#e8c860");
      R.fill(x + k, y - 1, 1, 4, "#c09838");
      R.set(x + k + 1, y + 2, "#c09838");
    }
  } else if (f.type === "rack") {
    for (const ry of [-8, 2]) {
      R.fill(x, y + ry, 30, 2, t1);
      R.fill(x, y + ry, 30, 1, t0);
      R.fill(x, y + ry + 2, 30, 1, w4);
    }
    for (const k of [4, 11, 18, 25]) {
      R.fill(x + k, y - 11, 2, 19, t2);
      R.fill(x + k, y - 11, 1, 19, t1);
      R.fill(x + k - 1, y - 15, 4, 4, m1);
      R.fill(x + k, y - 16, 2, 2, m0);
    }
  } else if (f.type === "drain") {
    R.fill(x + 2, y + 2, 12, 12, look.floor[2]);
    R.fill(x + 3, y + 3, 10, 10, "#1c1c2c");
    for (const b of [4, 7, 10]) R.fill(x + b, y + 3, 2, 10, m2);
    for (const b of [4, 7, 10]) R.fill(x + b, y + 3, 1, 10, m1);
  } else if (f.type === "straw") {
    art(R, x - 2, y + 4, [
      "....aaab..aa....",
      "..aabbbaabbbaa..",
      ".abbbcbbbbcbbba.",
      "abbcbbbbcbbbbcba",
      ".abbbbcbbbbcbba.",
      "..aacbbbbcbbaa..",
      "....aa.cc.aa....",
    ], { a: "#d8bc70", b: "#c0a058", c: "#94783c" });
  } else if (f.type === "mat") {
    R.fill(x + 1, y + 3, 30, 11, "#9c8048");
    R.fill(x + 2, y + 4, 28, 9, "#c0a460");
    for (let i = 4; i < 29; i += 3) R.fill(x + i, y + 4, 1, 9, "#aa8e50");
    R.fill(x + 20, y + 3, 11, 11, "#3c4a6c");
    R.fill(x + 21, y + 4, 9, 9, "#50608a");
    R.fill(x + 21, y + 4, 9, 1, "#6878a0");
  }
}

export type PrisonSprite = { r: Raster; x: number; y: number; sort: number; glow?: [number, number][] };

function bars(look: PrisonLook, n: number, door: number) {
  const r = new Raster(n * T, 32);
  const [w0, w1, w2, w3, w4] = look.wall, wood = look.bars === "wood";
  const [m0, m1, m2] = wood ? look.wood : look.metal;
  for (let x = 0; x < n * T; x++) {
    const u = x & 15, gate = x >> 4 === door;
    const post = gate && (u < 3 || u > 12), k = wood ? [2, 3, 4, 10, 11, 12].indexOf(u) % 3 : [1, 2, 6, 7, 11, 12].indexOf(u) % 2;
    if (post) for (let y = 0; y < 29; y++) r.set(x, y, y === 0 || u === 0 || u === 13 ? m0 : u === 2 || u === 15 ? m2 : m1);
    else if (k >= 0) for (let y = wood ? 4 : 1 + k; y < 24; y++) r.set(x, y, y === 7 ? m2 : wood ? [m0, m1, m2][k] : k ? m2 : m0);
    const rail = (y: number, deep: number) => {
      for (let j = 0; j < deep; j++) r.set(x, y + j, j === 0 ? m0 : j === deep - 1 ? m2 : m1);
    };
    rail(wood ? 2 : 4, wood ? 5 : 3);
    rail(13, wood ? 3 : 2);
    if (gate && u >= 8 && u <= 11) for (let y = 10; y < 17; y++) r.set(x, y, y === 10 ? m0 : (u === 9 || u === 10) && (y === 13 || y === 14) ? "#14121e" : m1);
    // The kerb the bars stand in: a lit top face, then the face toward you.
    const top = gate ? w2 : w1, face = wood ? m2 : w3;
    for (let y = gate ? 29 : 22; y < 32; y++)
      r.set(x, y, y === 22 ? (gate ? w1 : w0) : y < 26 ? (k >= 0 && y === 23 && !post ? w3 : wood ? m1 : top) : y === 31 ? look.line : u === 0 && !wood ? w4 : y === 26 ? mix(face, w4, 0.5) : face);
  }
  return r;
}

function lamp(look: PrisonLook) {
  const r = new Raster(12, 24), [m0, m1, m2] = look.metal, [, t1, t2] = look.wood;
  const fire = { o: "#d8581c", y: "#f8b030", w: "#fff4b0" };
  if (look.lamp === "torch") {
    art(r, 2, 0, ["...o....", "..oyo...", "..oyo...", ".oyyyo..", ".oywyo..", "oyywyyo.", "oywwwyo.", ".oywyo..", "..ooo..."], fire);
    r.fill(3, 9, 6, 2, m2);
    r.fill(3, 9, 6, 1, m1);
    r.fill(5, 11, 2, 9, t2);
    r.fill(5, 11, 1, 9, t1);
    r.fill(2, 15, 8, 2, m2);
    r.fill(2, 15, 8, 1, m0);
  } else if (look.lamp === "lantern") {
    r.fill(5, 2, 2, 3, m2);
    r.fill(2, 5, 8, 2, t2);
    r.fill(2, 7, 8, 9, "#f4d890");
    r.fill(4, 9, 4, 5, "#fff4c0");
    for (const i of [2, 5, 9]) r.fill(i, 7, 1, 9, t1);
    r.fill(2, 16, 8, 2, t2);
    r.fill(5, 18, 2, 3, "#c03828");
  } else {
    r.fill(2, 4, 8, 3, m2);
    r.fill(2, 4, 8, 1, m1);
    r.fill(3, 7, 6, 7, "#fff4c0");
    r.fill(4, 8, 4, 4, "#ffffff");
    for (const i of [2, 5, 6, 9]) r.fill(i, 7, 1, 8, m1);
    r.fill(2, 14, 8, 1, m2);
  }
  return r;
}

function thing(look: PrisonLook, type: string): { r: Raster; glow?: [number, number] } | undefined {
  const [t0, t1, t2] = look.wood, [m0, m1, m2] = look.metal;
  const straw = ["#dcc07c", "#c8a660", "#9a7c40"], dark = "#1c1828";
  const table = (r: Raster) => {
    r.shadow(16, 21, 15, 3);
    r.fill(3, 12, 3, 9, t2);
    r.fill(26, 12, 3, 9, t2);
    r.fill(1, 4, 30, 8, t1);
    r.fill(1, 4, 30, 1, t0);
    r.fill(1, 12, 30, 2, t2);
    for (const i of [9, 17, 24]) r.fill(i, 5, 1, 7, mix(t1, t2, 0.5));
  };
  if (type === "pallet" || type === "cot") {
    const r = new Raster(32, 20), cot = type === "cot";
    r.shadow(16, 17, 15, 3);
    r.fill(1, 5, 30, 12, cot ? m2 : t2);
    if (cot) for (const i of [1, 29]) r.fill(i, 2, 2, 16, m1);
    r.fill(2, 5, 28, 10, cot ? "#d8d4c4" : straw[1]);
    r.fill(2, 5, 28, 1, cot ? "#ecE8dc" : straw[0]);
    r.fill(2, 14, 28, 1, cot ? "#a8a498" : straw[2]);
    if (!cot) for (const i of [5, 9, 12]) r.fill(i, 8 + (i & 3), 2, 1, straw[2]);
    const cloth = cot ? ["#8c98a8", "#707c90", "#566074"] : ["#94849a", "#7a6a80", "#5c4e64"];
    r.fill(14, 5, 16, 10, cloth[1]);
    r.fill(14, 5, 16, 1, cloth[0]);
    r.fill(14, 5, 1, 10, cloth[2]);
    r.fill(14, 14, 16, 1, cloth[2]);
    r.fill(3, 6, 8, 8, cot ? "#f4f0e4" : "#d8ccb0");
    r.fill(3, 13, 8, 1, cot ? "#c0bcb0" : "#a89c80");
    return { r: r.finish() };
  }
  if (type === "bucket") {
    const r = new Raster(14, 16);
    r.shadow(7, 14, 6, 2);
    art(r, 2, 3, [
      "..mmmmmm..",
      ".m......m.",
      "aaaaaaaaaa",
      "abddddddcc",
      "abbbbbbbbc",
      "mmmmmmmmmm",
      ".abbbbbbc.",
      ".abbbbbbc.",
      ".mmmmmmmm.",
      "..bbbbbc..",
    ], { a: t0, b: t1, c: t2, d: dark, m: m1 });
    return { r: r.finish() };
  }
  if (type === "barrel") {
    const r = new Raster(16, 22);
    r.shadow(8, 20, 7, 2);
    r.fill(2, 4, 12, 16, t1);
    r.fill(3, 3, 10, 1, t1);
    r.fill(3, 4, 10, 3, t0);
    r.fill(4, 5, 8, 1, t2);
    r.fill(2, 7, 2, 13, t0);
    r.fill(12, 7, 2, 13, t2);
    for (const i of [6, 9]) r.fill(i, 8, 1, 12, t2);
    for (const j of [9, 16]) {
      r.fill(2, j, 12, 2, m2);
      r.fill(2, j, 9, 1, m1);
    }
    return { r: r.finish() };
  }
  if (type === "crate") {
    const r = new Raster(16, 20);
    r.shadow(8, 18, 8, 2);
    r.fill(1, 3, 14, 15, t1);
    r.fill(1, 3, 14, 5, t0);
    r.fill(1, 8, 14, 1, t2);
    r.fill(1, 9, 2, 9, t2);
    r.fill(13, 9, 2, 9, t2);
    for (let i = 0; i < 8; i++) r.set(4 + i, 10 + i, t2);
    r.fill(3, 5, 10, 1, mix(t0, t2, 0.4));
    return { r: r.finish() };
  }
  if (type === "jar") {
    const r = new Raster(14, 18);
    r.shadow(7, 16, 6, 2);
    art(r, 1, 2, [
      "...aaaaaa...",
      "..adddddda..",
      "..cbbbbbbc..",
      "...cbbbbc...",
      "..abbbbbbc..",
      ".aabbbbbbbc.",
      "aaabbbbbbbcc",
      "aabbbbbbbbcc",
      "aabbbbbbbbcc",
      "abbbbbbbbccc",
      ".bbbbbbbbcc.",
      ".bbbbbbbccc.",
      "..bbbbbccc..",
      "...cccccc...",
    ], look.masonry === "ashlar" ? { a: "#a8b8dc", b: "#7888b8", c: "#505c8c", d: dark } : { a: "#d89c70", b: "#b07048", c: "#784430", d: dark });
    return { r: r.finish() };
  }
  if (type === "table" || type === "desk") {
    const r = new Raster(32, 24);
    table(r);
    if (type === "desk") {
      r.fill(8, 2, 14, 7, "#f0e6c8");
      r.fill(14, 2, 2, 7, "#b8ac8c");
      for (const j of [4, 6]) for (const i of [9, 17]) r.fill(i, j, 4, 1, "#7c7060");
      r.fill(25, 3, 3, 5, dark);
      r.fill(25, 3, 3, 1, m1);
    } else {
      r.fill(6, 1, 5, 7, "#b07048");
      r.fill(6, 1, 5, 2, "#d89c70");
      r.fill(15, 4, 5, 4, m1);
      r.fill(15, 4, 5, 1, m0);
      r.fill(23, 5, 5, 2, "#d8ccb0");
    }
    return { r: r.finish() };
  }
  if (type === "stool") {
    const r = new Raster(12, 13);
    r.shadow(6, 11, 5, 2);
    r.fill(2, 7, 2, 4, t2);
    r.fill(8, 7, 2, 4, t2);
    r.fill(1, 3, 10, 4, t1);
    r.fill(1, 3, 10, 1, t0);
    r.fill(1, 6, 10, 1, t2);
    return { r: r.finish() };
  }
  if (type === "brazier") {
    const r = new Raster(14, 18);
    r.shadow(7, 16, 6, 2);
    r.fill(2, 12, 2, 4, m2);
    r.fill(10, 12, 2, 4, m2);
    r.fill(1, 6, 12, 6, m2);
    r.fill(1, 6, 12, 1, m1);
    r.fill(2, 5, 10, 2, "#c83c18");
    art(r, 3, 1, [".o..o...", "oyo.yo.o", "oywoywoy", ".oyyywyo"], { o: "#d8581c", y: "#f8b030", w: "#fff4b0" });
    return { r: r.finish(), glow: [7, 5] };
  }
  if (type === "well") {
    const r = new Raster(32, 30), [w0, w1, w2, w3, w4] = look.wall;
    r.shadow(16, 27, 15, 3);
    for (let y = 0; y < 22; y++)
      for (let x = 0; x < 28; x++) {
        const dx = (x - 13.5) / 14, dy = (y - 8.5) / 9, e = dx * dx + dy * dy, lower = ((x - 13.5) / 14) ** 2 + ((y - 14.5) / 9) ** 2;
        if (e <= 1) r.set(x + 2, y + 2, e < 0.45 ? (e < 0.2 && y < 9 ? "#2c4c6c" : "#1c2c48") : y < 5 ? w0 : w1);
        else if (lower <= 1) r.set(x + 2, y + 2, x % 7 === 0 ? w4 : x < 9 ? w2 : w3);
      }
    r.fill(14, 0, 2, 12, t2);
    r.fill(6, 0, 20, 2, t1);
    r.fill(6, 0, 20, 1, t0);
    return { r: r.finish() };
  }
  if (type === "stocks" || type === "cangue") {
    const r = new Raster(32, 28);
    r.shadow(16, 25, 15, 3);
    r.fill(3, 4, 3, 21, t2);
    r.fill(26, 4, 3, 21, t2);
    r.fill(3, 4, 1, 21, t1);
    r.fill(26, 4, 1, 21, t1);
    r.fill(1, 8, 30, 10, t1);
    r.fill(1, 8, 30, 1, t0);
    r.fill(1, 12, 30, 1, t2);
    r.fill(1, 17, 30, 1, t2);
    for (const i of type === "cangue" ? [13] : [7, 14, 21]) r.fill(i, 10, type === "cangue" ? 6 : 4, 5, dark);
    if (type === "stocks") r.fill(27, 11, 3, 4, m1);
    else r.fill(5, 10, 3, 6, "#e8dcc0");
    return { r: r.finish() };
  }
  if (type === "bench") {
    const r = new Raster(32, 16);
    r.shadow(16, 14, 15, 2);
    r.fill(3, 8, 2, 6, m2);
    r.fill(27, 8, 2, 6, m2);
    r.fill(1, 3, 30, 5, t1);
    r.fill(1, 3, 30, 1, t0);
    r.fill(1, 7, 30, 1, t2);
    r.fill(1, 5, 30, 1, mix(t1, t2, 0.5));
    return { r: r.finish() };
  }
  return undefined;
}

/** Everything that stands up from the floor, with the pixel row it sorts on. */
export function prisonSprites(plan: PrisonPlan, look: PrisonLook): PrisonSprite[] {
  const out: PrisonSprite[] = [];
  for (let y = 0; y < plan.h; y++)
    for (let x = 0; x < plan.w; x++) {
      if (plan.cells[y * plan.w + x] !== BARS || plan.cells[y * plan.w + x - 1] === BARS) continue;
      let n = 1;
      while (plan.cells[y * plan.w + x + n] === BARS) n++;
      const door = plan.features.find((f) => f.type === "cell-door" && f.y === y && f.x >= x && f.x < x + n);
      out.push({ r: bars(look, n, door ? door.x - x : -1), x: x * T, y: y * T - 16, sort: (y + 1) * T });
    }
  for (const f of plan.features) {
    if (f.type === "lamp") {
      const west = f.side === 3, x = west ? f.x * T - 6 : f.x * T + 2, y = west ? f.y * T - 12 : f.y * T - 14;
      out.push({ r: lamp(look), x, y, sort: 0, glow: [[x + 6, y + 6]] });
      continue;
    }
    const s = thing(look, f.type);
    if (!s) continue;
    const x = f.x * T + (s.r.w < T ? (T - s.r.w) >> 1 : 0), y = (f.y + 1) * T - s.r.h + 2;
    out.push({ r: s.r, x, y, sort: (f.y + 1) * T - 3, glow: s.glow && [[x + s.glow[0], y + s.glow[1]]] });
  }
  return out.sort((a, b) => a.sort - b.sort);
}

/** Subtle ALttP-style jagged hairline crack on a cell wall (state 0 = hairline, 1 = crumbled, 2 = dark breach). */
export function paintWallCrack(look: PrisonLook, state: number): Raster {
  const r = new Raster(22, 22);
  const pal = { c: look.line, s: look.wall[4], d: "#141020" };
  if (state >= 2) {
    art(r, 2, 3, [
      "......cccc......",
      "....ccddddcc....",
      "...cddddddddc...",
      "..cddddddddddcc.",
      "..cdddddddddddc.",
      ".cddddddddddddc.",
      ".cddddddddddddc.",
      "..cdddddddddddc.",
      "..ccdddddddddc..",
      "...ccddddddcc...",
      ".....cccccc.....",
    ], pal);
    return r;
  }
  if (state === 1) {
    art(r, 1, 1, [
      "........c...........",
      ".......c.s..........",
      "......c..c..........",
      "....sc..c...........",
      ".....ccc............",
      "....c...cc..........",
      "...c..dd..c...c.....",
      "..c..dddd..c.c......",
      "...c..dd..ccc.......",
      "....cc..cc..........",
      "......cc...c........",
      ".....c..c.c.........",
      "....c....c..........",
    ], pal);
    return r;
  }
  // State 0: delicate 1px jagged spiderweb fissures with small angular stone fragments (no curve or bright halo).
  art(r, 2, 2, [
    ".........c........",
    "........c.........",
    ".......c.c........",
    ".....sc.c.........",
    "....c..c..........",
    ".....cc.c.........",
    "....c....c........",
    "...c..s...c..c....",
    "...c.....c..c.....",
    "....c...c..c......",
    ".....ccc..c.......",
    "....c...cc........",
    "...c.....c........",
    "..c.......c.......",
  ], pal);
  return r;
}

export function paintSpoon(look: PrisonLook): Raster {
  const r = new Raster(14, 12);
  const [m0, m1, m2] = look.metal;
  r.fill(2, 7, 6, 2, m1);
  r.fill(3, 6, 4, 1, m0);
  r.fill(8, 6, 4, 3, m2);
  r.fill(9, 6, 2, 1, "#f2f6fc");
  return r;
}

export function paintEmptyKeyRack(look: PrisonLook): Raster {
  const r = new Raster(16, 14);
  const [t0, t1] = look.wood, w4 = look.wall[4];
  r.fill(1, 0, 14, 3, t1);
  r.fill(1, 0, 14, 1, t0);
  r.fill(1, 3, 14, 1, w4);
  return r;
}

export function paintOpenDrain(look: PrisonLook): Raster {
  const r = new Raster(16, 16);
  const [, m1, m2] = look.metal;
  r.fill(2, 2, 12, 12, look.floor[2]);
  r.fill(3, 3, 10, 10, "#14121e");
  for (const b of [4, 11]) {
    r.fill(b, 3, 2, 10, m2);
    r.fill(b, 3, 1, 10, m1);
  }
  return r;
}
