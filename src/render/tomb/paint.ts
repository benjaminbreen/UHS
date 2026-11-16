import type { TombRole } from "../../content/tombs";
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

/** How an area's walls were left: painted with figures, plastered white, or bare rock. */
const FINISH: Record<TombRole, "figures" | "plain" | "bare"> = { entrance: "bare", corridor: "figures", well: "bare", hall: "figures", store: "plain", cutting: "bare", burial: "figures" };

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
  const { w, h, cells } = L, r = new Raster(w * 16, h * 16), finish = FINISH[L.role], seed = L.area * 31 + L.w;
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? WALL : cells[y * w + x]);
  const open = (x: number, y: number) => at(x, y) !== WALL;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = at(x, y), X = x * 16, Y = y * 16;
    if (c === WALL) {
      r.fill(X, Y, 16, 16, "#241d19");
      // The cut edge of the rock, where a room lies beside or above it.
      if (open(x, y - 1)) r.fill(X, Y, 16, 3, "#51443a"), r.fill(X, Y + 3, 16, 1, "#3a3029");
      if (open(x - 1, y)) r.fill(X, Y, 2, 16, "#3e332b");
      if (open(x + 1, y)) r.fill(X + 14, Y, 2, 16, "#3e332b");
      continue;
    }
    if (c === PIT) {
      r.fill(X, Y, 16, 16, "#0d0a09");
      if (at(x, y - 1) !== PIT) r.fill(X, Y, 16, 4, "#5e4f40"), r.fill(X, Y + 4, 16, 5, "#3c3229"), r.fill(X, Y + 9, 16, 4, "#211b17");
      if (at(x - 1, y) !== PIT) r.fill(X, Y, 2, 16, "#2c241f");
      if (at(x + 1, y) !== PIT) r.fill(X + 14, Y, 2, 16, "#2c241f");
      continue;
    }
    // Dressed bedrock: broad soft patches, a few chisel scars.
    for (let j = 0; j < 16; j += 8) for (let i = 0; i < 16; i += 8) {
      const k = h2((X + i) >> 3, (Y + j) >> 3, seed + 3);
      r.fill(X + i, Y + j, 8, 8, k < 0.16 ? "#c4b391" : k > 0.86 ? "#d6c7a6" : "#cdbd9c");
    }
    if (h2(x, y, seed + 9) < 0.12) for (let i = 0; i < 5; i++) r.set(X + 4 + i, Y + 6 + ((i * 3 + x) % 3), "#b3a282");
    if (c === STAIR) for (let j = 0; j < 16; j += 8) r.fill(X, Y + j, 16, 1, "#e6d9bc"), r.fill(X, Y + j + 6, 16, 2, "#a09070");
    // The wall above throws a little shade on the floor at its foot.
    if (!open(x, y - 1)) r.fill(X, Y, 16, 2, "#b0a080");
    if (!open(x - 1, y)) r.fill(X, Y, 1, 16, "#b9a888");
  }
  // The faces of the walls behind each floor, three cells tall.
  for (let y = 0; y < h - 1; y++) for (let x = 0; x < w; x++) {
    if (at(x, y) !== WALL || at(x, y + 1) === WALL || at(x, y + 1) === PIT) continue;
    const X = x * 16, top = (y - 2) * 16, left = at(x - 1, y + 1) === WALL, right = at(x + 1, y + 1) === WALL;
    if (finish === "bare") {
      for (let j = 0; j < 48; j++) for (let i = 0; i < 16; i++) {
        const k = (X + i + j * 2 + Math.floor(h2((X + i) >> 2, j >> 3, seed) * 5)) % 9;
        r.set(X + i, top + j, k === 0 ? ROCK[2] : k === 4 ? ROCK[0] : ROCK[1]);
      }
    } else {
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
    r.fill(X, top, 16, 2, "#3a3029");
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
    else for (let i = 0; i < 6; i++) r.set(X + 3 + i + (n % 4), Y + 8 + ((i * 5 + n) % 4), "#b3a282");
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
export function paintTombThing(art: string, w: number, h: number, v: number): TombSprite | undefined {
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

/** Pillars and fallen rock, and the ropes at a shaft. */
export function paintTombDecor(type: string, v: number): TombSprite | undefined {
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
