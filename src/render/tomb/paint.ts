import { tombStyle, type TombRole, type TombStyle } from "../../content/tombs";
import { PIT, STAIR, WALL, type TombLevel } from "../../world/tomb";
import { h2, Raster } from "../ship/raster";

export type TombSprite = { r: Raster; ox: number; oy: number };

const GOLD = ["#fff2b0", "#f2cc58", "#cc9a34", "#94682a", "#5e3e1a"];
const QUARTZITE = ["#d8a088", "#bc7c64", "#9c5e4a", "#783f34", "#4e2826"];
const ALABASTER = ["#fbf5e4", "#ece2c6", "#d2c4a2", "#a8987a", "#786a54"];
const WOOD = ["#e0b47c", "#c4925c", "#a06e42", "#784e2e", "#4e301c"];
const COPPER = ["#f4b078", "#cc7a40", "#9a5228", "#6a341c"];
const BLUE = ["#86b4e2", "#4a80c0", "#2f5a98", "#1f3c6c"];
const RED = ["#d86a48", "#b4472f", "#84301f"];
const GREEN = ["#84bc88", "#4f8a5a", "#33603c"];
const BLACK = ["#544a50", "#2e282c", "#1a1618"];
const LINEN = ["#f6f0e0", "#e0d6be", "#bcae90"];
const SKIN = "#a8482e";
const ROCK = ["#cbb994", "#b9a787", "#a59373", "#8a7a5e"];
const PLASTER = { figures: "#e8d088", plain: "#ebe1c8" };

type Look = TombStyle["look"];
type Finish = "figures" | "plain" | "bare" | "limewash" | "fresco" | "bones" | "ashlar";
/** How an area's walls were left, by the kind of tomb. */
const FINISH: Record<Look, Record<TombRole, Finish>> = {
  "painted-rock": { entrance: "bare", corridor: "figures", well: "bare", hall: "figures", store: "plain", cutting: "bare", burial: "figures" },
  crypt: { entrance: "ashlar", corridor: "limewash", well: "ashlar", hall: "limewash", store: "limewash", cutting: "bare", burial: "fresco" },
};
const LIME = ["#dcd5c2", "#c6bfac", "#aaa391", "#878070"];
const BONE = ["#f2e8cc", "#dccca6", "#bca986", "#4a4034"];
/** Floor base, darker and lighter patches, chisel scars; the cut edge's top, lip and side; shade under walls; stair tread and riser; the rock. */
const GROUND: Record<Look, { floor: string[]; edge: string[]; shade: string[]; stair: string[]; rock: string[] }> = {
  "painted-rock": { floor: ["#cdbd9c", "#c4b391", "#d6c7a6", "#b3a282"], edge: ["#51443a", "#3a3029", "#3e332b"], shade: ["#b0a080", "#b9a888"], stair: ["#e6d9bc", "#a09070"], rock: ROCK },
  crypt: { floor: ["#aaa69c", "#a4a096", "#b0aca2", "#8e8a82"], edge: ["#4e4a46", "#36332f", "#403c38"], shade: ["#928e84", "#9c988e"], stair: ["#c8c4ba", "#7e7a70"], rock: LIME },
};
const lookOf = (L: TombLevel): Look => tombStyle(L.style)?.look ?? "painted-rock";
const vn = (x: number, y: number, k: number, seed: number) => {
  const fx = x / k, fy = y / k, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
  const a = h2(x0, y0, seed), b = h2(x0 + 1, y0, seed), c = h2(x0, y0 + 1, seed), d = h2(x0 + 1, y0 + 1, seed);
  return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
};
/** Damp coming through plaster: an ochre bloom with a darker tide edge, worst near the floor. */
const damp = (x: number, y: number, low: number, seed: number) => {
  const wet = vn(x, y, 7, seed) + low;
  return wet > 0.9 ? "#d6bf92" : wet > 0.87 ? "#bfa070" : undefined;
};
const RIM = ["#9a958a", "#7c786e", "#5e5b53", "#2e2c29"];
/** Dressed blocks along a cut edge, bevelled: lit above and left, dark below and right. */
function rim(r: Raster, x0: number, y0: number, w: number, h: number) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const row = Math.floor(y / 5), lx = (x + (row & 1) * 5) % 10, ly = y % 5, k = h2(Math.floor((x + (row & 1) * 5) / 10), row, 41);
    r.set(x, y, ly === 4 || lx === 9 ? RIM[3] : ly === 0 || lx === 0 ? RIM[0] : ly === 3 || lx === 8 ? RIM[2] : k < 0.4 ? RIM[2] : RIM[1]);
  }
}

/** A praying figure with raised arms, a shepherd with a sheep on his shoulders, or a dove, in a slot 14 wide and 22 tall. */
function fresco(r: Raster, x: number, y: number, k: number) {
  const box = (dx: number, dy: number, w: number, h: number, col: string) => r.fill(x + dx, y + dy, w, h, col);
  if (k < 0.4) {
    box(5, 2, 4, 4, "#c88a6a"); box(4, 1, 6, 2, "#5a3a2a");
    box(4, 6, 6, 13, k < 0.2 ? RED[1] : "#c8a050"); box(5, 19, 4, 2, "#5a3a2a");
    box(1, 3, 1, 5, "#c88a6a"); box(2, 7, 2, 1, "#c88a6a"); box(12, 3, 1, 5, "#c88a6a"); box(10, 7, 2, 1, "#c88a6a");
  } else if (k < 0.75) {
    box(6, 4, 3, 3, "#c88a6a"); box(3, 2, 9, 3, "#f0ead8"); box(2, 3, 2, 2, "#c8c0a8"); box(11, 3, 2, 2, "#c8c0a8");
    box(5, 7, 5, 9, GREEN[1]); box(5, 16, 2, 5, "#c88a6a"); box(8, 16, 2, 5, "#c88a6a"); box(11, 8, 1, 13, WOOD[3]);
  } else {
    box(4, 10, 6, 4, "#f0ead8"); box(9, 9, 3, 3, "#f0ead8"); box(12, 10, 1, 1, RED[1]); box(3, 11, 2, 2, "#c8c0a8");
    box(10, 13, 4, 1, GREEN[1]); box(13, 12, 1, 1, GREEN[2]);
  }
}

/** One column of a wall face, 16 wide and 48 tall, in a finish other than the Theban ones. */
function face(r: Raster, X: number, top: number, finish: Finish, rock: string[], seed: number) {
  if (finish === "ashlar") {
    for (let j = 0; j < 48; j++) {
      const course = j >> 3, lip = j % 8;
      for (let i = 0; i < 16; i++) {
        const u = X + i + (course % 2) * 9, joint = u % 18 === 0 || lip === 7;
        const k = h2(Math.floor(u / 18), course, seed + 5);
        r.set(X + i, top + j, joint ? rock[3] : lip === 0 ? rock[0] : k < 0.3 ? rock[2] : rock[1]);
      }
    }
    return;
  }
  if (finish === "limewash") {
    // Whitewash ruled in red to look like fine masonry, over a dado of real stone.
    for (let j = 0; j < 48; j++) for (let i = 0; i < 16; i++) {
      const x = X + i, course = j >> 3, joint = j % 8 === 0 || (x + (course & 1) * 12) % 24 === 0;
      let col = j >= 38 ? (j === 38 ? STONE[0] : j === 39 ? STONE[3] : (x + ((j - 40) >> 2) * 7) % 14 === 0 || j % 4 === 3 ? STONE[3] : h2(x >> 3, j >> 2, seed) < 0.4 ? STONE[2] : STONE[1])
        : joint && j > 4 ? "#b8573e" : vn(x, j, 6, seed + 1) > 0.72 ? "#ddd2b8" : "#e9e0c9";
      if (j < 38) col = damp(x, j + top, j > 24 ? (j - 24) / 40 : j < 8 ? (8 - j) / 30 : 0, seed + 2) ?? col;
      r.set(x, top + j, col);
    }
    return;
  }
  if (finish === "fresco") {
    r.fill(X, top, 16, 48, "#ece3cc");
    r.fill(X, top + 3, 16, 1, RED[1]); r.fill(X, top + 5, 16, 1, GREEN[1]);
    r.fill(X, top + 38, 16, 1, GREEN[1]); r.fill(X, top + 40, 16, 1, RED[1]);
    r.fill(X, top + 41, 16, 7, "#c9b48e");
    for (let i = 0; i < 16; i++) if ((X + i) % 32 === 0) r.fill(X + i, top + 5, 1, 33, RED[1]);
    const panel = Math.floor(X / 32), k = h2(panel, 1, seed + 11);
    // Centred in its panel, so it reaches back into the column already painted.
    if (k < 0.6 && X % 32 === 16) fresco(r, X - 7, top + 12, h2(panel, 2, seed));
    for (let j = 6; j < 38; j++) for (let i = 0; i < 16; i++) {
      const d = damp(X + i, top + j, j > 26 ? (j - 26) / 30 : 0, seed + 2);
      if (d) r.set(X + i, top + j, d);
    }
    return;
  }
  if (finish === "bones") {
    r.fill(X, top, 16, 48, BONE[3]);
    const ends = (y0: number, y1: number) => {
      for (let j = y0; j < y1; j++) for (let i = 0; i < 16; i++) {
        const lx = (X + i + (j >> 2) * 2) % 4, ly = j % 4;
        if (lx === 3 || ly === 3) continue;
        r.set(X + i, top + j, lx === 0 && ly === 0 ? BONE[0] : lx === 2 || ly === 2 ? BONE[2] : BONE[1]);
      }
    };
    const skulls = (y0: number) => {
      for (let i = 0; i < 16; i++) {
        const lx = (X + i) % 8;
        for (let ly = 0; ly < 8; ly++) {
          const w = ly < 1 ? [2, 5] : ly < 5 ? [1, 6] : ly < 7 ? [2, 5] : [3, 4];
          if (lx < w[0] || lx > w[1]) continue;
          const eye = ly >= 3 && ly <= 4 && (lx === 2 || lx === 5), nose = ly === 5 && (lx === 3 || lx === 4) , teeth = ly === 6 && lx % 2 === 0;
          r.set(X + i, top + y0 + ly, eye || nose ? "#3a3028" : teeth ? BONE[2] : ly === 0 || lx === w[0] ? BONE[0] : lx === w[1] ? BONE[2] : BONE[1]);
        }
      }
    };
    ends(2, 10); skulls(10); ends(19, 30); skulls(30); ends(39, 48);
    return;
  }
  for (let j = 0; j < 48; j++) for (let i = 0; i < 16; i++) {
    const k = (X + i + j * 2 + Math.floor(h2((X + i) >> 2, j >> 3, seed) * 5)) % 9;
    r.set(X + i, top + j, k === 0 ? rock[2] : k === 4 ? rock[0] : rock[1]);
  }
}

/** A standing figure, a god, a column of signs or an offering table, in a slot 16 wide and 26 tall. */
function motif(r: Raster, x: number, y: number, k: number, flip: boolean) {
  const px = (dx: number, dy: number, col: string) => r.set(x + (flip ? 15 - dx : dx), y + dy, col);
  const box = (dx: number, dy: number, w: number, h: number, col: string) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(dx + i, dy + j, col); };
  if (k < 0.34) {
    // Two columns of signs between red rules.
    for (const cx of [3, 9]) {
      box(cx - 1, 0, 1, 26, RED[1]);
      for (let j = 1; j < 25; j += 4) {
        const s = h2(x + cx, y + j, 5), col = s < 0.3 ? BLUE[2] : s < 0.55 ? GREEN[2] : s < 0.8 ? BLACK[1] : RED[2];
        box(cx + 1, j, s < 0.5 ? 3 : 2, s > 0.7 ? 3 : 2, col);
        if (s > 0.4 && s < 0.6) px(cx + 3, j + 2, col);
      }
    }
    box(14, 0, 1, 26, RED[1]);
    return;
  }
  const god = k > 0.8, body = god ? (k > 0.9 ? GREEN[1] : BLUE[2]) : SKIN;
  if (k < 0.5) {
    // An offering table heaped with bread, a duck and a lotus.
    box(7, 20, 2, 6, WOOD[2]); box(3, 18, 10, 2, WOOD[1]);
    box(4, 15, 3, 3, "#d8b060"); box(8, 14, 4, 4, "#c88a4a"); box(5, 12, 4, 2, GREEN[1]); box(9, 11, 2, 3, BLUE[1]); px(10, 10, "#f0f0f0");
    return;
  }
  // A figure in profile: wig, shoulders square on, kilt, one foot forward.
  box(6, 2, 4, 4, BLACK[1]); box(9, 3, 2, 3, body); px(11, 4, body);
  if (god) box(6, 0, 3, 2, k > 0.9 ? "#f4f0e4" : GOLD[1]), px(7, -1, k > 0.9 ? "#f4f0e4" : RED[1]);
  box(5, 6, 7, 2, body); box(6, 8, 5, 5, god ? body : body);
  box(11, 7, 1, 6, body); box(12, 12, 2, 1, body); box(4, 7, 1, 5, body);
  box(5, 13, 7, 5, god ? RED[1] : LINEN[0]); if (!god) px(11, 17, LINEN[1]);
  box(6, 18, 2, 7, body); box(9, 18, 2, 7, body); box(5, 25, 4, 1, body); box(9, 25, 4, 1, body);
  if (god) box(13, 3, 1, 23, GOLD[2]), box(12, 2, 3, 1, GOLD[2]);
}

/** The level's rock, floors, wall faces and litter, one cell to sixteen pixels. */
export function paintTombGround(L: TombLevel): Raster {
  const { w, h, cells } = L, r = new Raster(w * 16, h * 16), look = lookOf(L), g = GROUND[look], seed = L.area * 31 + L.w;
  const finish = L.name === "the charnel" ? "bones" : FINISH[look][L.role];
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? WALL : cells[y * w + x]);
  const open = (x: number, y: number) => at(x, y) !== WALL;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = at(x, y), X = x * 16, Y = y * 16;
    if (c === WALL) {
      r.fill(X, Y, 16, 16, "#241d19");
      if (look === "crypt") {
        if (open(x, y - 1)) rim(r, X, Y, 16, 7);
        if (open(x - 1, y)) rim(r, X, Y, 5, 16);
        if (open(x + 1, y)) rim(r, X + 11, Y, 5, 16);
        continue;
      }
      // The cut edge of the rock, where a room lies beside or above it.
      if (open(x, y - 1)) r.fill(X, Y, 16, 3, g.edge[0]), r.fill(X, Y + 3, 16, 1, g.edge[1]);
      if (open(x - 1, y)) r.fill(X, Y, 2, 16, g.edge[2]);
      if (open(x + 1, y)) r.fill(X + 14, Y, 2, 16, g.edge[2]);
      continue;
    }
    if (c === PIT) {
      r.fill(X, Y, 16, 16, "#0d0a09");
      if (at(x, y - 1) !== PIT) r.fill(X, Y, 16, 4, "#5e4f40"), r.fill(X, Y + 4, 16, 5, "#3c3229"), r.fill(X, Y + 9, 16, 4, "#211b17");
      if (at(x - 1, y) !== PIT) r.fill(X, Y, 2, 16, "#2c241f");
      if (at(x + 1, y) !== PIT) r.fill(X + 14, Y, 2, 16, "#2c241f");
      continue;
    }
    if (look === "crypt") {
      // Flagstones, bevelled and worn, and now and then a ledger slab over a grave with a cross cut in it.
      for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
        const px = X + i, py = Y + j, row = Math.floor(py / 12), u = px + (row & 1) * 10, lx = u % 20, ly = py % 12, k = h2(Math.floor(u / 20), row, seed + 3);
        r.set(px, py, ly === 11 || lx === 19 ? g.floor[3] : ly === 0 || lx === 0 ? g.floor[2] : vn(px, py, 6, seed + 4) > 0.78 ? g.floor[2] : k < 0.35 ? g.floor[1] : g.floor[0]);
      }
      if (c !== STAIR && h2(x, y, seed + 5) < 0.015) {
        r.fill(X + 1, Y + 1, 14, 14, g.edge[2]); r.fill(X + 2, Y + 2, 12, 12, "#8c887e"); r.fill(X + 2, Y + 2, 12, 1, "#a6a296");
        r.fill(X + 7, Y + 4, 2, 9, "#5e5b54"); r.fill(X + 4, Y + 6, 8, 2, "#5e5b54");
      }
    } else {
      // Dressed bedrock: broad soft patches, a few chisel scars.
      for (let j = 0; j < 16; j += 8) for (let i = 0; i < 16; i += 8) {
        const k = h2((X + i) >> 3, (Y + j) >> 3, seed + 3);
        r.fill(X + i, Y + j, 8, 8, k < 0.16 ? g.floor[1] : k > 0.86 ? g.floor[2] : g.floor[0]);
      }
      if (h2(x, y, seed + 9) < 0.12) for (let i = 0; i < 5; i++) r.set(X + 4 + i, Y + 6 + ((i * 3 + x) % 3), g.floor[3]);
    }
    if (c === STAIR) for (let j = 0; j < 16; j += 8) r.fill(X, Y + j, 16, 1, g.stair[0]), r.fill(X, Y + j + 6, 16, 2, g.stair[1]);
    // The wall above throws a little shade on the floor at its foot.
    if (!open(x, y - 1)) r.fill(X, Y, 16, 2, g.shade[0]);
    if (!open(x - 1, y)) r.fill(X, Y, 1, 16, g.shade[1]);
  }
  // The faces of the walls behind each floor, three cells tall.
  for (let y = 0; y < h - 1; y++) for (let x = 0; x < w; x++) {
    if (at(x, y) !== WALL || at(x, y + 1) === WALL || at(x, y + 1) === PIT) continue;
    const X = x * 16, top = (y - 2) * 16, left = at(x - 1, y + 1) === WALL, right = at(x + 1, y + 1) === WALL;
    if (finish !== "figures" && finish !== "plain") face(r, X, top, finish, g.rock, seed);
    else {
      r.fill(X, top, 16, 48, PLASTER[finish]);
      if (finish === "figures") {
        // A frieze of bound reed tops, then the scenes.
        r.fill(X, top + 2, 16, 9, "#e2c064");
        for (let i = 1; i < 16; i += 5) {
          const col = [BLUE[1], RED[1], GREEN[1]][((X + i) / 5 | 0) % 3];
          r.fill(X + i, top + 4, 3, 6, col); r.set(X + i + 1, top + 3, col); r.fill(X + i, top + 8, 3, 1, GOLD[3]);
        }
        r.fill(X, top + 11, 16, 1, RED[1]);
        const k = h2(x, y, seed + 21);
        motif(r, X, top + 13, k, h2(x, y, seed + 22) < 0.5);
      } else r.fill(X, top + 4, 16, 1, RED[1]), r.fill(X, top + 6, 16, 1, BLACK[1]);
      r.fill(X, top + 40, 16, 1, GOLD[2]); r.fill(X, top + 41, 16, 2, RED[1]); r.fill(X, top + 43, 16, 5, BLACK[1]);
    }
    r.fill(X, top, 16, 2, g.edge[1]);
    for (let j = 2; j < 48; j++) {
      if (left) r.shade(X, top + j, 0.3), r.shade(X + 1, top + j, 0.14);
      if (right) r.shade(X + 15, top + j, 0.3), r.shade(X + 14, top + j, 0.14);
    }
    for (let i = 0; i < 16; i++) r.shade(X + i, top + 47, 0.3);
  }
  for (const d of L.decor) {
    if (d.solid) continue;
    const X = d.x * 16, Y = d.y * 16, n = Math.floor(d.v * 97);
    if (d.type === "chips") for (let i = 0; i < 4; i++) {
      const cx = X + 2 + ((n * (i + 3)) % 11), cy = Y + 3 + ((n * (i + 5)) % 10);
      r.fill(cx, cy, 2, 1, "#f0e7d0"); r.set(cx, cy + 1, "#a59373"); r.set(cx + 1, cy + 1, "#a59373");
    }
    else if (d.type === "sherds") for (let i = 0; i < 3; i++) {
      const cx = X + 2 + ((n * (i + 2)) % 10), cy = Y + 4 + ((n * (i + 7)) % 8);
      r.fill(cx, cy, 3, 2, i ? "#b4623c" : "#cc7c50"); r.set(cx + 1, cy + 2, "#7a3e26"); r.set(cx + 2, cy + 2, "#7a3e26");
    }
    else if (d.type === "bone") {
      const cx = X + 3 + (n % 8), cy = Y + 5 + ((n >> 3) % 7);
      r.fill(cx, cy, 5, 1, BONE[1]); r.set(cx - 1, cy - 1, BONE[0]); r.set(cx + 5, cy + 1, BONE[2]); r.fill(cx, cy + 1, 5, 1, BONE[2]);
    }
    else for (let i = 0; i < 6; i++) r.set(X + 3 + i + (n % 4), Y + 8 + ((i * 5 + n) % 4), GROUND[look].floor[3]);
  }
  return r;
}

/** A block seen from above and in front: a lit top, a darker front, in five shades. */
function block(r: Raster, x: number, y: number, w: number, top: number, front: number, pal: string[]) {
  r.fill(x, y, w, top, pal[1]);
  r.fill(x, y, w, 1, pal[0]); r.fill(x, y, 1, top, pal[0]);
  r.fill(x, y + top, w, front, pal[2]);
  r.fill(x, y + top, w, 1, pal[3]); r.fill(x + w - 1, y + top, 1, front, pal[3]);
  r.fill(x, y + top + front - 1, w, 1, pal[3]);
}
const glyphs = (r: Raster, x: number, y: number, w: number, hgt: number, col: (k: number) => string) => {
  for (let j = 0; j < hgt; j += 3) for (let i = 0; i < w; i += 4) {
    const k = h2(x + i, y + j, 13);
    if (k < 0.8) r.fill(x + i, y + j, k < 0.4 ? 2 : 3, 2, col(k));
  }
};

/** A find or a piece of furniture, by its art key; `w` and `h` are its cells. */
export function paintTombThing(art: string, w: number, h: number, v: number, look: Look = "painted-rock", find = ""): TombSprite | undefined {
  if (look !== "painted-rock") {
    const own = lookThing(art, w, h, look, find);
    if (own) return own;
  }
  if (art === "sarcophagus") {
    const r = new Raster(50, 48);
    r.shadow(26, 44, 25, 4, 0.35);
    block(r, 1, 3, 48, 21, 21, QUARTZITE);
    // The lid: a raised panel with the king's names down it, rounded at the head.
    r.fill(4, 6, 42, 15, QUARTZITE[0]); r.fill(5, 7, 40, 13, QUARTZITE[1]);
    r.fill(4, 6, 1, 1, QUARTZITE[1]); r.fill(4, 20, 1, 1, QUARTZITE[1]);
    r.fill(10, 12, 30, 3, QUARTZITE[2]);
    glyphs(r, 11, 12, 28, 2, () => GOLD[1]);
    for (const x of [7, 41]) r.fill(x, 9, 2, 9, QUARTZITE[2]);
    // The box: a cornice, and a goddess at each end with her wings along the side.
    r.fill(1, 24, 48, 2, QUARTZITE[1]);
    for (const [x0, dir] of [[4, 1], [45, -1]] as const) {
      r.fill(x0 - (dir < 0 ? 1 : 0), 28, 2, 12, GOLD[1]); r.fill(x0 - (dir < 0 ? 1 : 0), 27, 2, 2, BLACK[1]);
      for (let i = 0; i < 16; i++) r.set(x0 + dir * (2 + i), 30 + (i >> 2), GOLD[i % 3 === 2 ? 2 : 1]), r.set(x0 + dir * (2 + i), 33 + (i >> 2), BLUE[1]);
    }
    glyphs(r, 21, 29, 9, 11, (k) => (k < 0.4 ? GOLD[1] : GOLD[2]));
    return { r: r.finish(), ox: 1, oy: 12 };
  }
  if (art === "shrine") {
    const r = new Raster(34, 58);
    r.shadow(17, 54, 16, 4, 0.35);
    // Sledge runners, the gilded box with its doors, and a roof that slopes up to the front.
    r.fill(2, 51, 30, 3, WOOD[3]); r.fill(1, 53, 32, 1, WOOD[4]);
    r.fill(3, 18, 28, 33, GOLD[1]);
    r.fill(3, 18, 1, 33, GOLD[0]); r.fill(30, 18, 1, 33, GOLD[3]);
    for (let j = 0; j < 12; j++) r.fill(2 + (j > 8 ? 0 : 1), 6 + j, 30 - (j > 8 ? 0 : 2), 1, j < 2 ? GOLD[0] : j < 9 ? GOLD[1] : GOLD[2]);
    r.fill(1, 15, 32, 3, GOLD[0]); r.fill(1, 17, 32, 1, GOLD[3]);
    for (let i = 3; i < 31; i += 3) r.fill(i, 8, 1, 6, i % 2 ? BLUE[1] : RED[1]);
    r.fill(16, 21, 2, 28, GOLD[3]);
    for (const x of [6, 20]) {
      r.fill(x, 22, 8, 26, GOLD[2]); r.fill(x + 1, 23, 6, 24, GOLD[1]);
      for (let j = 25; j < 45; j += 5) r.fill(x + 2, j, 4, 3, j % 2 ? BLUE[1] : BLUE[2]), r.fill(x + 3, j + 1, 2, 1, GOLD[0]);
    }
    r.fill(14, 35, 2, 2, BLACK[1]); r.fill(18, 35, 2, 2, BLACK[1]); r.fill(15, 36, 4, 1, LINEN[1]);
    return { r: r.finish(), ox: 1, oy: 26 };
  }
  if (art === "coffin") {
    const r = new Raster(34, 26);
    r.shadow(17, 23, 16, 3, 0.3);
    // Lying on its back, head to the left: the wig, the face, the wrapped body narrowing to the feet.
    for (let i = 0; i < 30; i++) {
      const half = i < 3 ? 3 + i : i < 9 ? 6 : i < 26 ? 6 - Math.floor((i - 9) / 6) : 5;
      for (let j = -half; j <= half; j++) r.set(2 + i, 11 + j, i < 8 ? (j % 2 ? BLUE[2] : GOLD[1]) : j === -half ? "#f0cc70" : "#dcaa4a");
      for (let j = 1; j <= 4; j++) r.set(2 + i, 11 + half + j, i < 8 ? BLUE[3] : "#a87a30");
    }
    r.fill(4, 9, 4, 5, GOLD[1]); r.fill(5, 10, 1, 1, BLACK[2]); r.fill(5, 12, 1, 1, BLACK[2]); r.fill(7, 11, 1, 1, RED[1]);
    for (const i of [10, 11]) r.fill(i, 6, 1, 11, i === 10 ? BLUE[1] : RED[1]);
    r.fill(12, 10, 16, 3, LINEN[0]);
    glyphs(r, 13, 10, 14, 2, (k) => (k < 0.4 ? BLACK[1] : BLUE[2]));
    for (const i of [18, 24]) r.fill(i, 7, 2, 3, RED[1]), r.fill(i, 13, 2, 3, RED[1]);
    r.fill(29, 5, 3, 13, "#e8c064");
    return { r: r.finish(), ox: 1, oy: 8 };
  }
  if (art === "canopic") {
    const r = new Raster(18, 28);
    r.shadow(9, 25, 8, 3, 0.3);
    r.fill(1, 23, 16, 2, WOOD[3]);
    block(r, 2, 6, 14, 6, 12, ALABASTER);
    r.fill(1, 10, 16, 2, ALABASTER[0]); r.fill(1, 12, 16, 1, ALABASTER[3]);
    for (let j = 0; j < 4; j++) r.fill(3 + j, 5 - j, 12 - j * 2, 1, ALABASTER[j < 2 ? 1 : 0]);
    for (const x of [4, 12]) glyphs(r, x, 14, 2, 8, () => BLUE[2]);
    r.fill(7, 14, 4, 8, ALABASTER[2]); r.fill(8, 15, 2, 6, BLUE[1]);
    return { r: r.finish(), ox: 1, oy: 10 };
  }
  if (art === "chest") {
    const r = new Raster(18, 24);
    r.shadow(9, 21, 8, 3, 0.3);
    block(r, 2, 8, 14, 4, 9, WOOD);
    // A gabled lid, painted panels, and the two knobs the cord ties round.
    for (let j = 0; j < 5; j++) r.fill(2 + j, 7 - j, 14 - j * 2, 1, j > 2 ? WOOD[0] : WOOD[1]);
    const cols = v < 0.5 ? [RED[1], BLUE[1]] : [BLUE[1], GREEN[1]];
    for (let i = 0; i < 3; i++) r.fill(3 + i * 4, 14, 3, 5, cols[i % 2]), r.fill(4 + i * 4, 15, 1, 3, LINEN[0]);
    r.fill(8, 5, 2, 2, BLACK[1]); r.fill(8, 12, 2, 2, BLACK[1]);
    for (const x of [2, 15]) r.fill(x, 21, 1, 1, WOOD[3]);
    return { r: r.finish(), ox: 1, oy: 6 };
  }
  if (art === "jars") {
    const r = new Raster(18, 26);
    r.shadow(9, 23, 8, 3, 0.3);
    const tall = v < 0.5;
    for (const [x, y, hgt, k] of tall ? [[2, 4, 18, 0], [7, 2, 20, 1], [12, 5, 17, 0]] : [[2, 10, 12, 0], [7, 7, 15, 1], [12, 11, 11, 0]]) {
      const pal = tall ? ["#e0946a", "#c4744c", "#9c5236", "#703624"] : [ALABASTER[0], ALABASTER[1], ALABASTER[2], ALABASTER[3]];
      for (let j = 0; j < hgt; j++) {
        const t = j / hgt, half = tall ? (t < 0.15 ? 1 : t < 0.6 ? 2 : t < 0.85 ? 1 : 0) : t < 0.2 ? 1 : 2;
        for (let i = -half; i <= half + (tall ? 0 : 0); i++) r.set(x + 2 + i, y + j, i === -half && half ? pal[0] : i === half && half ? pal[2] : pal[1]);
      }
      r.fill(x + 1, y, 3, 2, k ? LINEN[0] : LINEN[1]);
      if (!tall) r.fill(x, y + hgt - 1, 5, 1, pal[3]);
    }
    return { r: r.finish(), ox: 1, oy: 8 };
  }
  if (art === "statue") {
    const r = new Raster(18, 42);
    r.shadow(9, 39, 8, 3, 0.35);
    block(r, 3, 33, 12, 3, 4, BLACK);
    // Striding, staff in the forward hand: black skin, gilded headcloth and kilt.
    r.fill(6, 25, 2, 9, BLACK[1]); r.fill(10, 24, 2, 10, BLACK[1]); r.fill(5, 33, 4, 1, GOLD[1]); r.fill(9, 33, 4, 1, GOLD[1]);
    for (let j = 0; j < 8; j++) r.fill(6 - (j >> 1), 17 + j, 6 + j, 1, j < 1 ? GOLD[0] : j > 5 ? GOLD[2] : GOLD[1]);
    r.fill(5, 9, 8, 8, BLACK[1]); r.fill(5, 9, 1, 8, BLACK[0]); r.fill(6, 11, 6, 1, GOLD[1]);
    r.fill(4, 10, 1, 7, BLACK[1]); r.fill(13, 10, 1, 5, BLACK[1]); r.fill(14, 14, 2, 1, BLACK[1]);
    r.fill(6, 2, 6, 7, GOLD[1]); r.fill(7, 4, 4, 5, BLACK[1]); r.fill(5, 4, 1, 6, GOLD[2]); r.fill(12, 4, 1, 6, GOLD[2]); r.fill(8, 1, 2, 2, GOLD[0]);
    r.fill(8, 6, 1, 1, LINEN[0]); r.fill(10, 6, 1, 1, LINEN[0]);
    r.fill(15, 6, 1, 28, GOLD[2]);
    return { r: r.finish(), ox: 1, oy: 24 };
  }
  if (art === "bed") {
    const r = new Raster(34, 30);
    r.shadow(17, 27, 16, 3, 0.3);
    // A bed with lions' feet, and a chair stacked on it legs up.
    for (const x of [3, 28]) r.fill(x, 20, 3, 7, GOLD[2]), r.fill(x - 1, 26, 5, 1, GOLD[3]);
    r.fill(2, 16, 30, 4, WOOD[1]); r.fill(2, 16, 30, 1, WOOD[0]); r.fill(2, 19, 30, 1, WOOD[3]);
    r.fill(4, 13, 24, 3, LINEN[0]); r.fill(4, 15, 24, 1, LINEN[2]);
    r.fill(28, 8, 3, 8, WOOD[2]); r.fill(28, 8, 3, 1, GOLD[1]);
    r.fill(8, 8, 12, 5, WOOD[2]); r.fill(8, 8, 12, 1, GOLD[1]); r.fill(9, 10, 10, 2, RED[1]);
    for (const x of [8, 18]) r.fill(x, 2, 2, 6, WOOD[1]), r.fill(x, 2, 2, 1, GOLD[1]);
    return { r: r.finish(), ox: 1, oy: 12 };
  }
  if (art === "baskets") {
    const r = new Raster(18, 20);
    r.shadow(9, 17, 8, 3, 0.3);
    block(r, 2, 6, 14, 5, 6, WOOD);
    if (v < 0.5) for (let i = 0; i < 4; i++) r.fill(3 + i * 3, 3, 2, 6, i % 2 ? BLUE[1] : "#5aa8a0"), r.fill(3 + i * 3, 2, 2, 2, BLACK[1]);
    else for (let i = 0; i < 3; i++) r.fill(3 + i * 4, 5, 4, 4, LINEN[0]), r.fill(3 + i * 4, 8, 4, 1, LINEN[2]);
    return { r: r.finish(), ox: 1, oy: 3 };
  }
  if (art === "vessels") {
    const r = new Raster(18, 20);
    r.shadow(9, 17, 8, 3, 0.3);
    for (const [y, half] of [[13, 7], [10, 6], [7, 5]]) {
      for (let i = -half; i <= half; i++) for (let j = 0; j < 4; j++) if (Math.abs(i) <= half - j) r.set(9 + i, y + j, j === 0 ? COPPER[0] : i > half - j - 2 ? COPPER[2] : COPPER[1]);
    }
    r.fill(6, 8, 6, 1, COPPER[3]);
    r.fill(12, 1, 3, 7, COPPER[1]); r.fill(12, 1, 1, 7, COPPER[0]); r.fill(15, 3, 1, 3, COPPER[2]);
    return { r: r.finish(), ox: 1, oy: 3 };
  }
  if (art === "lamp") {
    const r = new Raster(18, 18);
    r.shadow(9, 15, 7, 2, 0.25);
    r.fill(3, 11, 6, 3, "#c4744c"); r.fill(3, 11, 6, 1, "#e0946a"); r.fill(8, 10, 2, 1, BLACK[1]);
    for (let j = 0; j < 9; j++) r.fill(11 - (j > 2 && j < 8 ? 1 : 0), 5 + j, 3 + (j > 2 && j < 8 ? 2 : 0), 1, j < 1 ? "#e0946a" : "#b4623c");
    r.fill(5, 5, 3, 4, LINEN[1]); r.fill(5, 6, 3, 1, LINEN[2]);
    return { r: r.finish(), ox: 1, oy: 2 };
  }
  if (art === "debris") {
    const r = new Raster(16, 16);
    r.fill(2, 5, 6, 2, LINEN[1]); r.fill(6, 7, 5, 1, LINEN[2]); r.fill(9, 3, 4, 2, LINEN[0]);
    r.fill(3, 10, 5, 2, WOOD[2]); r.fill(8, 11, 3, 1, WOOD[3]);
    for (let i = 0; i < 6; i++) r.set(8 + i, 13 - (i >> 1), i > 3 ? BLACK[2] : WOOD[3]);
    return { r, ox: 0, oy: 0 };
  }
  if (art === "blocking") {
    // Rough stones under plaster, pressed all over with the necropolis seal.
    const across = w > h, W = w * 16, face = across ? 34 : 14, r = new Raster(W, h * 16 + face);
    r.fill(0, 0, W, h * 16 + face, ALABASTER[2]);
    r.fill(0, 0, W, h * 16 - 4, ALABASTER[1]);
    for (let y = 0; y < h * 16 + face; y += 7) for (let x = -((y / 7) % 2) * 5; x < W; x += 11) {
      const k = h2(x, y, 3);
      r.fill(x, y, 10, 6, y < h * 16 - 4 ? (k < 0.5 ? ALABASTER[1] : ALABASTER[0]) : k < 0.5 ? ALABASTER[2] : ALABASTER[1]);
      r.fill(x, y + 6, 11, 1, ALABASTER[3]); r.fill(x + 10, y, 1, 6, ALABASTER[3]);
      if (y >= h * 16 - 4 && k > 0.35) r.fill(x + 3, y + 1, 4, 3, ALABASTER[3]), r.fill(x + 4, y + 2, 2, 1, ALABASTER[4]);
    }
    r.fill(0, h * 16 - 4, W, 1, ALABASTER[4]);
    return { r, ox: 0, oy: face };
  }
  if (art === "painting") {
    // A framed scene: the dead before the god, or the sun's boat on its night journey.
    const W = w * 16, r = new Raster(W, 28);
    r.fill(0, 0, W, 28, "#f3ead0");
    for (let x = 0; x < W; x += 4) r.fill(x, 0, 4, 2, (x >> 2) % 2 ? BLUE[1] : RED[1]), r.fill(x, 26, 4, 2, (x >> 2) % 2 ? RED[1] : BLUE[1]);
    r.fill(0, 0, 1, 28, BLACK[1]); r.fill(W - 1, 0, 1, 28, BLACK[1]);
    if (v < 0.5) {
      motif(r, 2, 2, 0.6, false); motif(r, W - 30, 2, 0.45, false); motif(r, W - 17, 2, 0.95, true);
      glyphs(r, 3, 3, 10, 1, (k) => (k < 0.4 ? BLUE[2] : BLACK[1]));
    } else {
      // A boat on a strip of water, the god under a canopy, a snake rearing ahead.
      r.fill(1, 21, W - 2, 3, BLUE[1]);
      for (let x = 2; x < W - 2; x += 4) r.fill(x, 22, 2, 1, BLUE[0]);
      for (let i = 0; i < 18; i++) r.set(4 + i, 19 - (i < 3 ? 3 - i : i > 14 ? i - 14 : 0), WOOD[3]), r.set(4 + i, 20, WOOD[2]);
      r.fill(9, 8, 8, 1, GOLD[2]); r.fill(9, 9, 1, 10, GOLD[2]); r.fill(16, 9, 1, 10, GOLD[2]);
      r.fill(12, 10, 2, 3, GREEN[1]); r.fill(11, 13, 4, 6, LINEN[0]); r.fill(12, 8, 2, 2, GOLD[1]);
      for (let i = 0; i < W - 28; i++) r.set(24 + i, 17 - Math.round(Math.sin(i * 0.9) * 2) - (i > W - 34 ? (i - (W - 34)) * 2 : 0), GREEN[2]), r.set(24 + i, 18 - Math.round(Math.sin(i * 0.9) * 2), GOLD[2]);
      glyphs(r, 3, 3, W - 8, 4, (k) => (k < 0.4 ? BLACK[1] : RED[2]));
    }
    return { r, ox: 0, oy: 37 };
  }
  if (art === "stela") {
    const r = new Raster(14, 36);
    r.fill(0, 0, 14, 36, ALABASTER[2]); r.fill(1, 1, 12, 34, ALABASTER[1]);
    r.fill(0, 0, 14, 3, ALABASTER[0]); r.fill(0, 3, 14, 1, ALABASTER[3]);
    r.fill(3, 6, 8, 29, ALABASTER[2]); r.fill(4, 7, 6, 28, ALABASTER[1]);
    r.fill(5, 12, 4, 23, ALABASTER[4]); r.fill(6, 13, 2, 22, BLACK[2]);
    for (const x of [1, 11]) glyphs(r, x, 6, 2, 28, () => BLUE[2]);
    r.fill(4, 8, 6, 3, RED[1]);
    return { r, ox: -1, oy: 36 };
  }
  if (art === "niche") {
    const r = new Raster(12, 13);
    r.fill(0, 0, 12, 13, "#5a4a3c"); r.fill(1, 1, 10, 12, "#2a211c");
    r.fill(2, 9, 8, 3, "#8a6a4a"); r.fill(2, 9, 8, 1, "#a8845e");
    r.fill(5, 3, 2, 6, v < 0.5 ? BLUE[1] : "#5aa8a0"); r.fill(5, 2, 2, 2, BLACK[1]);
    return { r, ox: -2, oy: 22 };
  }
  if (art === "sketch") {
    const r = new Raster(16, 30);
    r.fill(0, 0, 16, 30, "#ded2b2");
    for (let x = 0; x < 16; x += 4) r.fill(x, 0, 1, 30, "#c8785e");
    for (let y = 1; y < 30; y += 4) r.fill(0, y, 16, 1, "#c8785e");
    for (const [x, y, ww, hh] of [[6, 3, 4, 4], [5, 7, 7, 2], [6, 9, 5, 5], [5, 14, 7, 5], [6, 19, 2, 8], [9, 19, 2, 8]]) {
      r.fill(x, y, ww, 1, RED[1]); r.fill(x, y + hh - 1, ww, 1, RED[1]); r.fill(x, y, 1, hh, RED[1]); r.fill(x + ww - 1, y, 1, hh, RED[1]);
    }
    r.fill(10, 3, 1, 4, BLACK[1]); r.fill(12, 7, 1, 6, BLACK[1]); r.fill(11, 19, 1, 8, BLACK[1]);
    return { r, ox: 0, oy: 38 };
  }
  return undefined;
}

const STONE = ["#d4cec0", "#bcb5a5", "#a19a8a", "#7e7869", "#5a554a"];
const LEAD = ["#b4b8bc", "#969ba0", "#787d84", "#5a5f66"];
const BRICK = ["#c4704c", "#a85a3c", "#8a462e", "#6a3424"];

/** The finds of the crypts, where they differ from a Theban tomb's. */
function lookThing(art: string, w: number, h: number, look: Look, find: string): TombSprite | undefined {
  if (art === "sarcophagus" && look === "crypt") {
    // A tomb chest with the bishop lying on its lid, a lion at his feet.
    const r = new Raster(50, 46);
    r.shadow(26, 42, 25, 4, 0.35);
    block(r, 1, 4, 48, 19, 20, STONE);
    for (let x = 4; x < 46; x += 8) r.fill(x, 27, 6, 12, STONE[3]), r.fill(x + 1, 28, 4, 10, STONE[2]);
    r.fill(6, 7, 6, 8, STONE[0]); r.fill(7, 8, 4, 6, "#c8c0b0"); r.fill(5, 6, 3, 2, GOLD[2]); r.fill(10, 6, 3, 2, GOLD[2]); r.fill(8, 5, 2, 2, GOLD[2]);
    r.fill(12, 7, 26, 11, "#b44a3a"); r.fill(12, 7, 26, 1, "#d06a52"); r.fill(12, 12, 26, 1, GOLD[2]); r.fill(22, 8, 3, 9, GOLD[1]);
    r.fill(17, 10, 3, 3, STONE[0]);
    r.fill(38, 8, 8, 9, "#c8a050"); r.fill(39, 7, 3, 3, "#c8a050"); r.fill(44, 9, 1, 1, BLACK[1]); r.fill(38, 16, 8, 1, "#94702c");
    return { r: r.finish(), ox: 1, oy: 13 };
  }
  if (art === "shrine" && look === "crypt") {
    // A reliquary shaped like a little church: gilt walls, an enamelled roof, stones along the ridge.
    const r = new Raster(34, 44);
    r.shadow(17, 40, 16, 4, 0.35);
    block(r, 1, 30, 32, 4, 8, STONE);
    r.fill(4, 16, 26, 15, GOLD[1]); r.fill(4, 16, 1, 15, GOLD[0]); r.fill(29, 16, 1, 15, GOLD[3]); r.fill(4, 30, 26, 1, GOLD[3]);
    for (const x of [7, 13, 19, 25]) r.fill(x, 19, 3, 9, GOLD[2]), r.fill(x, 19, 3, 2, BLUE[1]), r.fill(x + 1, 22, 1, 3, "#c8c0a8");
    for (let j = 0; j < 10; j++) r.fill(2 + j, 6 + j, 30 - 2 * j, 1, j === 0 ? GOLD[0] : j % 3 === 0 ? GOLD[2] : BLUE[j % 2 ? 1 : 2]);
    r.fill(2, 15, 30, 2, GOLD[0]); r.fill(4, 5, 26, 2, GOLD[1]);
    for (let x = 6; x < 30; x += 6) r.fill(x, 4, 2, 2, x % 12 ? RED[0] : GREEN[0]);
    return { r: r.finish(), ox: 1, oy: 12 };
  }
  if (art === "coffin" && look === "crypt") {
    const r = new Raster(34, 22);
    r.shadow(17, 19, 16, 3, 0.3);
    for (let i = 0; i < 30; i++) {
      const half = i < 4 ? 3 + i : i < 10 ? 7 : 7 - Math.floor((i - 10) / 6);
      for (let j = -half; j <= half; j++) r.set(2 + i, 9 + j, j === -half ? LEAD[0] : j === half ? LEAD[2] : LEAD[1]);
      for (let j = 1; j <= 3; j++) r.set(2 + i, 9 + half + j, LEAD[3]);
    }
    for (let i = 0; i < 12; i++) r.set(12 + i, 8, LEAD[3]);
    r.fill(6, 6, 2, 6, LEAD[3]); r.fill(4, 8, 6, 2, LEAD[3]);
    return { r: r.finish(), ox: 1, oy: 8 };
  }
  if (art === "blocking") {
    const pal = BRICK, across = w > h, W = w * 16, fc = across ? 34 : 14, H = h * 16 + fc, r = new Raster(W, H), course = 5, len = 9;
    r.fill(0, 0, W, H, pal[3]);
    for (let y = 0; y < H; y += course) for (let x = -((y / course) % 2) * (len >> 1); x < W; x += len) {
      const k = h2(x, y, 3);
      r.fill(x, y, len - 1, course - 1, y < h * 16 - 4 ? pal[k < 0.5 ? 0 : 1] : pal[k < 0.5 ? 1 : 2]);
    }
    r.fill(0, h * 16 - 4, W, 1, pal[3]);
    return { r, ox: 0, oy: fc };
  }
  if (art === "painting") {
    // Two saints under a painted arch, haloed, one in red and one in green, faded where the damp has got in.
    const W = w * 16, r = new Raster(W, 30);
    r.fill(0, 0, W, 30, "#efe6cf");
    for (let x = 0; x < W; x++) for (let y = 0; y < 30; y++) {
      const edge = x < 2 || x >= W - 2 || y < 2 || y >= 28, d = damp(x, y, y > 18 ? (y - 18) / 24 : 0, 7);
      if (edge) r.set(x, y, (x + y) % 6 < 3 ? RED[1] : RED[2]);
      else if (d) r.set(x, y, d);
    }
    for (const [x, robe] of [[W / 2 - 13, RED[1]], [W / 2 + 3, GREEN[1]]] as const) {
      for (let j = -5; j <= 5; j++) for (let i = -5; i <= 5; i++) if (i * i + j * j <= 25 && i * i + j * j > 12) r.set(x + 5 + i, 9 + j, GOLD[1]);
      r.fill(x + 3, 6, 4, 5, "#d8a084"); r.fill(x + 3, 6, 4, 1, "#6a4430"); r.set(x + 4, 8, BLACK[1]); r.set(x + 6, 8, BLACK[1]);
      r.fill(x + 1, 11, 8, 15, robe); r.fill(x + 1, 11, 1, 15, LINEN[0]); r.fill(x + 8, 12, 1, 14, BLACK[1]);
      r.fill(x + 4, 13, 2, 9, LINEN[0]); r.fill(x + 2, 15, 6, 2, "#d8a084");
    }
    r.fill(W / 2 - 1, 4, 2, 22, GOLD[2]);
    return { r, ox: 0, oy: 38 };
  }
  if (art === "stela") {
    // A slab in the wall with four rivets, a cross or a chalice cut in it, and lines of lettering.
    const r = new Raster(14, 18), chalice = find === "priests-chalice";
    r.fill(0, 0, 14, 18, STONE[4]); r.fill(1, 1, 12, 16, STONE[1]); r.fill(1, 1, 12, 1, STONE[0]); r.fill(1, 1, 1, 16, STONE[0]); r.fill(12, 2, 1, 15, STONE[3]);
    for (const [x, y] of [[2, 2], [11, 2], [2, 15], [11, 15]]) r.set(x, y, "#5a5f66");
    if (chalice) r.fill(5, 4, 4, 3, STONE[4]), r.fill(6, 7, 2, 2, STONE[4]), r.fill(5, 9, 4, 1, STONE[4]);
    else r.fill(6, 3, 2, 7, STONE[4]), r.fill(4, 5, 6, 2, STONE[4]);
    for (let y = 11; y < 15; y += 2) for (let x = 3; x < 11; x++) if (h2(x, y, 9) < 0.7) r.set(x, y, STONE[3]);
    return { r, ox: -1, oy: 32 };
  }
  if (art === "lamp" && look === "crypt") {
    // A stand of candles, most burned down.
    const r = new Raster(18, 26);
    r.shadow(9, 23, 7, 2, 0.25);
    r.fill(8, 10, 2, 13, BLACK[1]); r.fill(4, 22, 10, 1, BLACK[1]); r.fill(2, 9, 14, 2, BLACK[0]);
    for (const [x, hh] of [[3, 5], [6, 2], [9, 7], [12, 3], [14, 1]]) r.fill(x, 9 - hh, 2, hh, "#f2ead4"), r.set(x, 8 - hh, "#f4c060");
    return { r: r.finish(), ox: 1, oy: 10 };
  }
  if (art === "bones") {
    const r = new Raster(18, 18);
    r.shadow(9, 15, 8, 3, 0.3);
    for (const [x, y] of [[1, 11], [6, 12], [3, 8], [9, 9], [12, 12]]) r.fill(x, y, 6, 2, BONE[1]), r.fill(x, y + 1, 6, 1, BONE[2]), r.set(x - 1, y, BONE[0]);
    for (const [x, y] of [[4, 3], [10, 5]]) {
      r.fill(x, y, 5, 4, BONE[1]); r.fill(x, y, 5, 1, BONE[0]); r.fill(x + 1, y + 4, 3, 2, BONE[2]);
      r.set(x + 1, y + 2, "#3a3028"); r.set(x + 3, y + 2, "#3a3028");
    }
    return { r: r.finish(), ox: 1, oy: 2 };
  }
  return undefined;
}

/** Pillars and fallen rock, and the ropes at a shaft. */
export function paintTombDecor(type: string, v: number, look: Look = "painted-rock"): TombSprite | undefined {
  if (type === "pillar" && look === "crypt") {
    // A squat round column: a square abacus, a cushion capital rounding down into the shaft, a moulded base on its plinth.
    const r = new Raster(22, 56), round = (x: number, l: number) => (x < l + 2 ? STONE[0] : x < l + 5 ? STONE[1] : x < l + 9 ? STONE[2] : STONE[3]);
    r.shadow(11, 52, 11, 4, 0.35);
    r.fill(1, 1, 20, 4, STONE[1]); r.fill(1, 1, 20, 1, STONE[0]); r.fill(1, 4, 20, 1, STONE[3]); r.fill(20, 1, 1, 4, STONE[3]);
    for (let j = 0; j < 8; j++) {
      const inset = Math.round(1 + (j / 7) ** 2 * 4);
      for (let x = 1 + inset; x < 21 - inset; x++) r.set(x, 5 + j, j === 7 ? STONE[3] : round(x, 1 + inset + (j >> 2)));
    }
    for (let j = 13; j < 45; j++) for (let x = 6; x < 16; x++) r.set(x, j, h2(x, j >> 2, 4) < 0.08 ? STONE[2] : round(x, 6));
    for (const [j, inset] of [[45, 5], [46, 4], [47, 4], [48, 5]]) for (let x = inset; x < 22 - inset; x++) r.set(x, j, j === 46 ? STONE[0] : round(x, inset));
    r.fill(2, 49, 18, 4, STONE[2]); r.fill(2, 49, 18, 1, STONE[1]); r.fill(19, 49, 1, 4, STONE[4]);
    return { r: r.finish(), ox: 3, oy: 38 };
  }
  if (type === "rubble" && look !== "painted-rock") {
    const pal = STONE, r = new Raster(18, 18);
    r.shadow(9, 15, 8, 3, 0.3);
    for (const [x, y, ww, hh] of v < 0.5 ? [[2, 6, 8, 8], [9, 9, 7, 6], [6, 3, 6, 5]] : [[3, 8, 11, 7], [1, 11, 5, 4], [10, 5, 5, 5]]) {
      r.fill(x, y, ww, hh, pal[1]); r.fill(x, y, ww, 2, pal[0]); r.fill(x, y + hh - 2, ww, 2, pal[3]); r.fill(x + ww - 1, y, 1, hh, pal[2]);
    }
    return { r: r.finish(), ox: 1, oy: 2 };
  }
  if (type === "pillar") {
    const r = new Raster(20, 56);
    r.shadow(10, 52, 10, 4, 0.35);
    r.fill(2, 2, 16, 10, "#d9cba8"); r.fill(2, 2, 16, 1, "#eadfc2"); r.fill(2, 2, 1, 10, "#eadfc2");
    r.fill(2, 12, 16, 40, PLASTER.figures);
    r.fill(2, 12, 16, 1, GOLD[3]);
    for (let i = 3; i < 17; i += 5) r.fill(i, 14, 3, 5, [BLUE[1], RED[1], GREEN[1]][(i / 5 | 0) % 3]);
    r.fill(2, 20, 16, 1, RED[1]);
    motif(r, 2, 21, v < 0.5 ? 0.95 : 0.85, v % 0.5 < 0.25);
    r.fill(2, 47, 16, 5, BLACK[1]); r.fill(2, 46, 16, 1, RED[1]);
    for (let j = 12; j < 52; j++) r.shade(17, j, 0.3), r.shade(16, j, 0.15);
    return { r: r.finish(), ox: 2, oy: 38 };
  }
  if (type === "rubble") {
    const r = new Raster(18, 18);
    r.shadow(9, 15, 8, 3, 0.3);
    for (const [x, y, ww, hh] of v < 0.5 ? [[2, 6, 8, 8], [9, 9, 7, 6], [6, 3, 6, 5]] : [[3, 8, 11, 7], [1, 11, 5, 4], [10, 5, 5, 5]]) {
      r.fill(x, y, ww, hh, ROCK[1]); r.fill(x, y, ww, 2, ROCK[0]); r.fill(x, y + hh - 2, ww, 2, ROCK[3]); r.fill(x + ww - 1, y, 1, hh, ROCK[2]);
    }
    return { r: r.finish(), ox: 1, oy: 2 };
  }
  if (type === "rope-up") {
    const r = new Raster(16, 66);
    for (let j = 0; j < 56; j++) r.set(7 + (j % 8 < 4 ? 0 : 1), j, j % 8 === 0 ? "#8a6a3c" : "#c8a468"), r.set(8 + (j % 8 < 4 ? 0 : 1), j, "#a88450");
    for (const [x, y, ww] of [[3, 58, 10], [4, 61, 8], [5, 56, 6]]) r.fill(x, y, ww, 2, "#c8a468"), r.fill(x, y + 2, ww, 1, "#8a6a3c");
    return { r: r.finish(), ox: 0, oy: 50 };
  }
  if (type === "rope-down") {
    // A beam laid across the mouth of the shaft, the rope tied round it and gone into the dark.
    const r = new Raster(76, 24);
    r.fill(0, 2, 76, 5, WOOD[2]); r.fill(0, 2, 76, 1, WOOD[0]); r.fill(0, 6, 76, 1, WOOD[4]);
    for (let x = 6; x < 76; x += 13) r.fill(x, 3, 1, 3, WOOD[3]);
    r.fill(35, 1, 6, 7, "#c8a468"); r.fill(35, 4, 6, 1, "#8a6a3c");
    for (let j = 0; j < 16; j++) r.set(37 + (j % 6 < 3 ? 0 : 1), 8 + j, j < 6 ? "#c8a468" : j < 11 ? "#8a6a3c" : "#4e3c24");
    return { r, ox: 0, oy: 0 };
  }
  return undefined;
}

/** A tomb find's picture from its sprite name, `made:tomb:<look>:<art>:<find>:<w>x<h>:<v>[:wall]`. */
export function tombPicture(frame: string) {
  const m = /^made:tomb:([^:]+):([^:]+):([^:]+):(\d+)x(\d+):(\d+)(:wall)?$/.exec(frame);
  if (!m) return undefined;
  const w = Number(m[4]), h = Number(m[5]);
  const s = paintTombThing(m[2], w, h, Number(m[6]) / 10, m[1] as Look, m[3]);
  if (!s) return undefined;
  const mid = s.ox + 8, half = Math.max(mid, s.r.w - mid);
  const foot = m[7] ? Math.max(s.r.h, s.oy) : Math.min(s.r.h, s.oy + h * 16);
  const out = new Raster(half * 2, foot);
  const rows = Math.min(s.r.h, foot);
  for (let y = 0; y < rows; y++) for (let x = 0; x < s.r.w; x++) {
    const i = (y * s.r.w + x) * 4, o = (y * out.w + x + half - mid) * 4;
    for (let k = 0; k < 4; k++) out.data[o + k] = s.r.data[i + k];
  }
  return out;
}
