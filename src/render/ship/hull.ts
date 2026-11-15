import type { Hull } from "../../content/ships";
import { halfWidth, type ShipLevel } from "../../world/ship";
import type { ShipPalette } from "./palette";
import { h2, Raster } from "./raster";

/** Where the hull lies on screen, in level pixels. */
export type HullGeom = {
  hull: Hull;
  /** Stern and stem, and the deck's centreline. */
  X0: number;
  X1: number;
  YC: number;
  u(x: number): number;
  north(x: number): number;
  south(x: number): number;
  /** The waterline under the near side: the bottom of the visible hull. */
  keel(x: number): number;
  /** Where the waterline ends at bow and stern: the stem's and counter's rake. */
  wx0: number;
  wx1: number;
};

const RAKE: Record<Hull["kind"], [number, number]> = {
  "square-rigger": [0.07, 0.95],
  junk: [0.04, 0.92],
  dhow: [0.1, 0.8],
  steamer: [0.06, 0.985],
};

export function hullGeom(level: ShipLevel): HullGeom {
  const { hull } = level;
  const X0 = level.x0 * 16, L = hull.length * 16, YC = level.y0 * 16 + (hull.beam * 16) / 2, half = (hull.beam * 16) / 2;
  const u = (x: number) => (x - X0) / L;
  const hw = (x: number) => halfWidth(hull.kind, Math.max(0, Math.min(1, u(x)))) * half;
  const [r0, r1] = RAKE[hull.kind];
  const wx0 = X0 + r0 * L, wx1 = X0 + r1 * L;
  const F = hull.freeboard;
  const water = (x: number) => {
    const t = u(x);
    // Sheer: the stern stands highest, the bow a little.
    const stern = Math.max(0, 1 - t / (hull.poop + 0.12)) ** 1.6, bow = Math.max(0, (t - 0.8) / 0.2) ** 2;
    return YC + half + F * (1 + 0.3 * stern + 0.12 * bow);
  };
  const keel = (x: number) => {
    const south = YC + hw(x);
    if (x >= wx0 && x <= wx1) return water(x);
    // Overhang: the stem and counter rise from the waterline to the deck.
    if (x > wx1) {
      const t = (x - wx1) / (X0 + L - wx1);
      return water(wx1) + (south - water(wx1)) * t ** (hull.kind === "dhow" ? 0.8 : 1.4);
    }
    const t = (wx0 - x) / (wx0 - X0);
    return water(wx0) + (south - water(wx0)) * t ** 1.2;
  };
  return { hull, X0, X1: X0 + L, YC, u, north: (x) => YC - hw(x), south: (x) => YC + hw(x), keel, wx0, wx1 };
}

/** The near side, the deck and the bulwarks of the weather deck, and the
 * flat things on it. Masts, sails and anything standing are drawn apart. */
export function paintWeatherDeck(level: ShipLevel, pal: ShipPalette, year: number) {
  const g = hullGeom(level);
  const R = new Raster(level.w * 16, level.h * 16);
  paintSide(R, g, pal, level, year);
  paintDeck(R, g, pal, level);
  return R;
}

function paintSide(R: Raster, g: HullGeom, p: ShipPalette, level: ShipLevel, year: number) {
  const { hull } = g;
  const seed = level.w * 31 + hull.length;
  const look = hull.look;
  const xs = [] as number[];
  for (let x = Math.floor(g.X0); x <= Math.ceil(g.X1); x++) xs.push(x);
  // Planking, banded down the ramp from the cap rail to the waterline.
  for (const x of xs) {
    const top = g.south(x), bot = g.keel(x);
    if (bot - top < 1) continue;
    for (let y = Math.floor(top); y < Math.ceil(bot); y++) {
      const t = (y - top) / (bot - top);
      const strake = Math.floor(t * 9 + h2(Math.floor(x / 40), Math.floor(t * 9), seed) * 0.15);
      let col = p.side[strake < 2 ? 1 : strake < 6 ? 2 : 3];
      // Seams between strakes, and staggered butts.
      const seam = Math.abs(t * 9 - Math.round(t * 9)) * (bot - top) / 9 < 0.5;
      if (seam) col = p.side[4];
      if (!seam && ((x + strake * 17) % 46 === 0)) col = p.side[3];
      if (!seam && h2(x >> 2, strake, seed + 3) < 0.05) col = p.side[strake < 6 ? 1 : 2];
      R.set(x, y, col);
    }
  }
  const at = (x: number, t: number) => g.south(x) + (g.keel(x) - g.south(x)) * t;
  const band = (t0: number, t1: number, ramp: readonly string[], edge = true) => {
    for (const x of xs) {
      const a = at(x, t0), b = at(x, t1);
      if (b - a < 1) continue;
      for (let y = Math.floor(a); y < Math.ceil(b); y++) {
        const k = (y - a) / (b - a);
        R.set(x, y, edge && k < 0.18 ? ramp[0] : edge && k > 0.82 ? ramp[3] : ramp[1]);
      }
      if (edge) R.set(x, Math.ceil(b), ramp[4]);
    }
  };
  // Wales: the thick dark belts that stiffen the hull.
  if (look === "tarred" || look === "varnish" || look === "black") {
    band(0.5, 0.58, look === "black" ? p.wale : p.wale);
    band(0.7, 0.77, p.wale);
  }
  if (look === "tarred") band(0.12, 0.42, p.band!);
  if (look === "black") band(0.14, 0.36, p.band!);
  if (look === "varnish" && hull.kind !== "junk") {
    band(0.04, 0.14, p.band!);
    band(0.3, 0.36, ["#6aa0a0", "#3c7272", "#2c5656", "#1e3c3e", "#122626"]);
  }
  if (hull.kind === "junk") {
    band(0, 0.16, p.band!);
    band(0.16, 0.22, p.house);
    band(0.22, 0.26, p.wale);
    band(0.56, 0.62, p.wale);
  }
  if (look === "oiled") {
    band(0.02, 0.1, p.wale);
    band(0.42, 0.47, p.wale);
  }
  if (look === "liner") band(0, 0.05, p.band!, false);
  // What shows at the waterline: copper, lime, antifouling.
  const bootTop = look === "liner" ? 0.83 : hull.kind === "junk" || look === "oiled" ? 0.84 : 0.88;
  band(bootTop, 1.02, p.bottom, false);
  for (const x of xs) {
    const y = at(x, bootTop);
    if (g.keel(x) - g.south(x) > 4) R.set(x, y, p.bottom[3]);
  }

  // Openings in the side.
  const u0 = Math.max(hull.poop * 0.5, 0.12), u1 = 0.86;
  if (hull.ports === "guns" || hull.ports === "painted") {
    const tPort = look === "black" ? 0.17 : 0.17, size = look === "black" ? 6 : 8;
    for (let x = g.X0 + u0 * hull.length * 16; x < g.X0 + u1 * hull.length * 16; x += 24) {
      const y = Math.round(at(x, tPort));
      if (hull.ports === "painted") {
        R.fill(x, y, size, size - 1, p.wale[3]);
        R.fill(x, y, size, 1, p.wale[1]);
        continue;
      }
      // An open port: the lid hinged up, red inside, and the gun's muzzle.
      R.fill(x - 1, y - 6, size + 2, 5, p.wale[2]);
      R.fill(x, y - 5, size, 3, "#a83a2c");
      R.fill(x, y - 5, size, 1, "#c8543c");
      R.fill(x, y, size, size, "#140e10");
      R.fill(x + 2, y + 3, 4, 3, "#2a2a2e");
      R.fill(x + 3, y + 3, 2, 1, "#5a5a62");
      R.fill(x, y + size, size, 1, p.wale[1]);
    }
  }
  if (hull.ports === "portholes") {
    for (const t of [0.22, 0.42]) for (let x = g.X0 + 0.06 * hull.length * 16; x < g.X0 + 0.95 * hull.length * 16; x += 12) {
      const y = Math.round(at(x, t));
      if (g.keel(x) - g.south(x) < 20) continue;
      R.fill(x, y, 3, 3, "#c7a24e");
      R.set(x + 1, y + 1, "#22303a");
      R.set(x, y, "#f0d888");
    }
  }
  // Channels at the masts, with their chain plates.
  if (hull.kind === "square-rigger") for (const m of hull.masts) {
    const cx = g.X0 + m * hull.length * 16;
    for (let x = cx - 14; x < cx + 14; x++) {
      const y = Math.round(at(x, 0.05));
      R.set(x, y, p.rail[1]);
      R.set(x, y + 1, p.rail[3]);
      R.set(x, y + 2, p.wale[3]);
    }
    for (let k = 0; k < 5; k++) {
      const x = cx - 12 + k * 6;
      R.fill(x, at(x, 0.05) - 2, 2, 2, "#2a2224");
      for (let y = at(x, 0.05) + 2; y < at(x, 0.5); y++) R.set(x + (y % 7 === 0 ? 1 : 0), y, "#1c1618");
    }
  }
  // The stern: quarter galleries on the big ships, the junk's tall transom, the dhow's carving.
  const sx = g.X0 + 4;
  if (hull.kind === "square-rigger") {
    const gx = g.X0 + 0.035 * hull.length * 16, gw = hull.id === "galleon" ? 30 : 24;
    const gy = at(gx, 0.05);
    R.fill(gx - 2, gy - 6, gw + 4, 4, p.gilt[2]);
    R.fill(gx - 2, gy - 6, gw + 4, 1, p.gilt[0]);
    R.fill(gx, gy - 2, gw, 14, p.gilt[3]);
    for (let i = 0; i < 4; i++) {
      R.fill(gx + 2 + i * (gw / 4), gy, gw / 4 - 3, 8, "#26303c");
      R.set(gx + 2 + i * (gw / 4), gy, "#9ab0b8");
      R.fill(gx + 3 + i * (gw / 4), gy + 1, 1, 6, "#3c4a58");
    }
    R.fill(gx - 1, gy + 12, gw + 2, 3, p.gilt[2]);
    R.fill(gx + 4, gy + 15, gw - 8, 3, p.gilt[3]);
    // The rudder.
    for (let y = at(sx, 0.1); y < g.keel(sx) + 6; y++) R.fill(g.X0 - 2, y, 4, 1, y % 9 === 0 ? p.wale[1] : p.wale[2]);
  }
  if (hull.kind === "junk") {
    // The high stern: a painted panel and the rudder below it.
    const tx = g.X0 + 2;
    for (let y = g.south(tx) - 18; y < at(tx, 0.4); y++) R.fill(tx, y, 14, 1, y < g.south(tx) - 14 ? p.band![0] : p.band![2]);
    R.fill(tx + 3, g.south(tx) - 12, 8, 8, "#2a6a5a");
    R.fill(tx + 5, g.south(tx) - 10, 4, 4, p.gilt[1]);
    for (let y = at(tx, 0.45); y < g.keel(tx) + 10; y++) R.fill(tx - 4, y, 6, 1, p.wale[2]);
    // The oculus, so the ship can see where it is going.
    const ex = g.X0 + 0.9 * hull.length * 16, ey = at(ex, 0.34);
    for (let dy = -4; dy <= 4; dy++) for (let dx = -8; dx <= 8; dx++) {
      const d = (dx / 8) ** 2 + (dy / 4.2) ** 2;
      if (d <= 1.15) R.set(ex + dx, ey + dy, d > 0.82 ? "#b42c24" : "#f6f0e2");
    }
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dy * dy <= 5) R.set(ex + dx + 2, ey + dy, "#141014");
    R.set(ex + 1, ey - 1, "#f6f0e2");
  }
  if (hull.kind === "dhow") {
    const tx = g.X0 + 1;
    R.fill(tx, at(tx, 0) - 1, 26, 1, p.rail[0]);
    for (let x = tx; x < tx + 26; x++) {
      const y = at(x, 0.12);
      R.set(x, y, p.gilt[(x >> 1) % 2 ? 1 : 3]);
      R.set(x, y + 1, (x >> 2) % 2 ? "#c4402c" : p.band![1]);
      R.set(x, y + 2, p.gilt[(x >> 1) % 2 ? 3 : 1]);
    }
    for (let y = at(tx, 0.4); y < g.keel(tx) + 8; y++) R.fill(tx - 3, y, 4, 1, p.wale[1]);
  }
  // At the bow: the stem, the head, the anchor at the cathead.
  const bx = g.X1;
  if (hull.kind === "square-rigger") {
    for (let i = 0; i < 9; i++) R.set(bx + i * 0.6, g.YC + 6 + i * 1.6, p.wale[1]);
    const ax = g.X0 + 0.88 * hull.length * 16, ay = at(ax, 0.06);
    R.fill(ax, ay, 2, 16, "#2c2a30");
    R.fill(ax - 5, ay + 15, 12, 2, "#2c2a30");
    R.set(ax - 6, ay + 13, "#2c2a30");
    R.set(ax + 7, ay + 13, "#2c2a30");
    R.fill(ax - 3, ay + 1, 8, 2, p.rail[2]);
    if (hull.head) paintHead(R, bx + 2, g.YC + 4, hull.head, p);
  }
  if (hull.kind === "dhow") {
    for (let i = 0; i < 14; i++) R.fill(bx + i * 0.9, g.YC - i * 1.4, 3, 2, p.wale[1]);
    R.fill(bx + 12, g.YC - 22, 3, 4, p.gilt[1]);
  }
  if (hull.kind === "steamer") {
    const ax = g.X0 + 0.95 * hull.length * 16, ay = at(ax, 0.2);
    R.fill(ax - 2, ay, 6, 4, "#0c0c10");
    R.fill(ax, ay + 4, 2, 6, "#3c3c44");
  }
  // Light falls from above: a rim under the cap rail, bounce shadow at the waterline.
  for (const x of xs) {
    const top = g.south(x), bot = g.keel(x);
    if (bot - top < 3) continue;
    R.set(x, top, p.rail[look === "liner" ? 0 : 1]);
    R.set(x, top + 1, p.rail[look === "liner" ? 1 : 2]);
    R.shade(x, bot - 1, 0.35);
    R.shade(x, bot - 2, 0.18);
  }
  void year;
}

function paintHead(R: Raster, x: number, y: number, head: NonNullable<Hull["head"]>, p: ShipPalette) {
  // A carved figure leaning out under the bowsprit.
  const g = p.gilt;
  if (head === "lion") {
    R.fill(x, y - 4, 8, 6, g[1]);
    R.fill(x + 6, y - 6, 5, 5, g[1]);
    R.fill(x + 7, y - 5, 2, 1, g[4]);
    R.fill(x + 1, y - 5, 3, 2, g[0]);
    R.fill(x + 2, y + 2, 2, 3, g[2]);
    R.fill(x + 6, y + 2, 2, 3, g[2]);
    return;
  }
  if (head === "woman") {
    R.fill(x, y - 2, 6, 8, "#f2ead6");
    R.fill(x + 4, y - 6, 4, 4, "#f4d6b8");
    R.fill(x + 3, y - 7, 4, 2, g[2]);
    R.fill(x + 1, y + 1, 4, 2, "#b84a3a");
    R.fill(x, y + 6, 6, 1, g[3]);
    return;
  }
  R.fill(x, y - 3, 5, 5, g[1]);
  R.set(x + 2, y - 1, g[4]);
}

function paintDeck(R: Raster, g: HullGeom, p: ShipPalette, level: ShipLevel) {
  const { hull } = g;
  const seed = level.w * 7;
  const poopX = g.X0 + hull.poop * hull.length * 16, fcX = g.X1 - hull.forecastle * hull.length * 16;
  for (let x = Math.floor(g.X0); x <= Math.ceil(g.X1); x++) {
    const n = g.north(x), s = g.south(x);
    if (s - n < 1) continue;
    const raised = x < poopX || x > fcX;
    for (let y = Math.floor(n); y < Math.ceil(s); y++) {
      const row = Math.floor((y - g.YC + 400) / 4);
      // Butt joints, staggered plank to plank.
      const run = 52 + Math.floor(h2(row, 1, seed) * 30);
      const off = Math.floor(h2(row, 2, seed) * run);
      const butt = (x + off) % run === 0;
      const tone = h2(row, Math.floor((x + off) / run), seed);
      let col = p.deck[tone < 0.2 ? 0 : tone < 0.75 ? 1 : 2];
      if (raised) col = p.deck[tone < 0.4 ? 0 : 1];
      if ((y - g.YC + 400) % 4 === 3) col = p.deck[3];
      if (butt) col = p.deck[3];
      // Treenails at the butts.
      if (!butt && (x + off) % run === 2 && (y - g.YC + 400) % 4 === 1) col = p.deck[3];
      R.set(x, y, col);
    }
    // Waterways along both edges, and the north bulwark's shadow on the planks.
    for (let k = 0; k < 6; k++) R.shade(x, n + k, [0.42, 0.34, 0.26, 0.18, 0.1, 0.05][k]);
    R.set(x, s - 1, p.deck[3]);
    R.set(x, s - 2, p.deck[2]);
  }
  // The break of the quarterdeck and forecastle: a lit edge where the deck steps up.
  for (const bx of [poopX, fcX]) {
    if (bx <= g.X0 || bx >= g.X1) continue;
    for (let y = Math.floor(g.north(bx)) + 2; y < g.south(bx) - 1; y++) {
      R.set(bx - 1, y, p.deck[3]);
      R.set(bx, y, p.deck[0]);
    }
  }
  // The far bulwark: its inside face, rising above the north edge, with timberheads and a cap rail.
  const BH = hull.kind === "steamer" ? 8 : 11;
  for (let x = Math.floor(g.X0) - 1; x <= Math.ceil(g.X1) + 1; x++) {
    const n = g.north(x);
    if (g.south(x) - n < 1) continue;
    for (let k = 0; k < BH; k++) {
      const y = n - BH + k;
      let col = p.bulwark[k < 2 ? 1 : k > BH - 3 ? 3 : 2];
      if (hull.kind !== "steamer" && x % 16 === 0) col = p.rail[2];
      if (hull.kind !== "steamer" && x % 16 === 1) col = p.rail[3];
      if (hull.kind === "steamer" && k > 2 && x % 32 < 2) col = p.bulwark[3];
      R.set(x, y, col);
    }
    R.set(x, n - BH - 2, p.rail[0]);
    R.set(x, n - BH - 1, p.rail[1]);
    R.set(x, n - BH, p.rail[3]);
  }
  // Round the stern and the bow the cap rail closes the outline.
  for (let x = Math.floor(g.X0) - 1; x <= Math.ceil(g.X1) + 1; x++) {
    const s = g.south(x);
    if (s - g.north(x) < 1) continue;
    R.set(x, s, p.rail[1]);
    R.set(x, s + 1, p.rail[2]);
  }
  for (let y = Math.floor(g.north(g.X0)) - BH - 2; y <= g.south(g.X0) + 1; y++) {
    R.set(g.X0 - 2, y, p.rail[2]);
    R.set(g.X0 - 1, y, p.rail[1]);
    R.set(g.X0, y, p.rail[0]);
  }
  if (hull.kind === "junk") {
    // The junk's flat transom bow, standing up square.
    for (let y = Math.floor(g.north(g.X1 - 1)) - BH - 2; y <= g.south(g.X1 - 1) + 1; y++) {
      R.set(g.X1 - 1, y, p.rail[2]);
      R.set(g.X1, y, p.rail[3]);
    }
  }
  // Flat things lying on the deck.
  // Contact shadows, cast down and to the right of whatever stands on the deck.
  for (const t of level.things) if (t.solid && !/^(mast|breast-rail)/.test(t.art)) {
    const x = t.x * 16, y = t.y * 16, w = t.w * 16, h = t.h * 16, big = t.w * t.h > 4 ? 6 : 3;
    for (let j = 0; j < big; j++) for (let i = 3; i < w + big; i++) R.shade(x + i, y + h + j, 0.3 - j * 0.03);
    for (let j = 3; j < h; j++) for (let i = 0; i < big; i++) R.shade(x + w + i, y + j, 0.3 - i * 0.03);
  }
  for (const t of level.things) if (!t.solid) paintFlat(R, t.art, t.x * 16, t.y * 16, t.w * 16, t.h * 16, p, t.v);
}

/** Things that lie flat: hatches, gratings, carpets, mats and puddles. */
export function paintFlat(R: Raster, art: string, x: number, y: number, w: number, h: number, p: ShipPalette, v: number) {
  const coaming = (lid: boolean) => {
    R.fill(x + 1, y + 1, w - 2, h - 2, p.rail[3]);
    R.fill(x + 1, y + 1, w - 2, 2, p.rail[1]);
    R.fill(x + 1, y + h - 3, w - 2, 2, p.rail[3]);
    R.fill(x + 1, y + h - 1, w - 2, 1, p.rail[4]);
    R.fill(x + 3, y + 3, w - 6, h - 6, lid ? p.rail[2] : "#1a1210");
  };
  switch (art) {
    case "hatch":
    case "grating": {
      coaming(false);
      // A lattice of battens over the dark below, with a ladder going down.
      for (let j = y + 4; j < y + h - 4; j++) for (let i = x + 4; i < x + w - 4; i++) {
        const bar = (i - x) % 4 === 0 || (j - y) % 4 === 0;
        if (bar && art === "grating") R.set(i, j, (i - x) % 4 === 0 && (j - y) % 4 === 0 ? p.rail[3] : p.rail[1]);
      }
      if (art === "hatch") {
        for (let j = y + 5; j < y + h - 4; j += 4) R.fill(x + 8, j, w - 16, 2, j === y + 5 ? p.rail[1] : p.rail[2]);
        R.fill(x + 7, y + 4, 1, h - 8, p.rail[2]);
        R.fill(x + w - 8, y + 4, 1, h - 8, p.rail[2]);
      }
      return;
    }
    case "engine-door":
      coaming(false);
      R.fill(x + 5, y + 5, 6, 2, "#5a5a62");
      R.fill(x + 5, y + 9, 6, 2, "#5a5a62");
      return;
    case "carpet": {
      const reds = ["#9c2a2a", "#7a1e22", "#c8483a", "#e4b26a", "#22305a"];
      for (let j = y + 2; j < y + h - 2; j++) for (let i = x + 1; i < x + w - 1; i++) {
        const bx = Math.min(i - x - 1, x + w - 2 - i), by = Math.min(j - y - 2, y + h - 3 - j);
        const edge = Math.min(bx, by);
        const cx = (i - x - w / 2) / (w / 2), cy = (j - y - h / 2) / (h / 2);
        const med = Math.abs(cx) + Math.abs(cy) < 0.45;
        R.set(i, j, edge < 1 ? reds[3] : edge < 3 ? ((i + j) % 4 < 2 ? reds[4] : reds[1]) : med ? ((i + j) % 2 ? reds[3] : reds[2]) : (i * 3 + j * 5) % 11 === 0 ? reds[2] : reds[0]);
      }
      for (let i = x + 1; i < x + w - 1; i += 2) {
        R.set(i, y + 1, "#efe2c4");
        R.set(i, y + h - 2, "#efe2c4");
      }
      return;
    }
    case "prayer-mats":
      for (let k = 0; k < 3; k++) {
        const mx = x + 2 + k * (w / 3);
        R.fill(mx, y + 2, w / 3 - 4, h - 4, ["#3a7a5a", "#a4402c", "#2c5078"][k]);
        R.fill(mx + 1, y + 3, w / 3 - 6, h - 6, ["#4e946e", "#c25a3e", "#3c6896"][k]);
        R.fill(mx + 1, y + 3, w / 3 - 6, 2, "#e6d6a8");
      }
      return;
    case "mats":
    case "sleeping-mats":
      for (let k = 0; k < Math.floor(w / 12); k++) {
        const mx = x + 2 + k * 12;
        R.fill(mx, y + 3, 10, h - 6, "#c8a868");
        for (let j = y + 3; j < y + h - 3; j += 2) R.fill(mx, j, 10, 1, "#b49254");
        R.fill(mx, y + 3, 10, 3, art === "sleeping-mats" ? "#5a6e8a" : "#a8884c");
      }
      return;
    case "ropes": {
      const cx = x + w / 2, cy = y + h / 2;
      for (let r = 6; r >= 1; r -= 1.5) for (let a = 0; a < Math.PI * 2; a += 0.15) R.set(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.7, r % 3 < 1.5 ? "#b08a52" : "#8a6a3c");
      return;
    }
    case "bilge":
      for (let j = y + 4; j < y + h - 2; j++) for (let i = x; i < x + w; i++) if (h2(i >> 1, j >> 1, 7) < 0.7 - Math.abs(i - x - w / 2) / w) R.set(i, j, (i + j) % 7 === 0 ? "#4a5a50" : "#1e2a26");
      return;
    case "washing":
      return;
  }
  void v;
}

/** A deck below: planks inside the hull's outline, the ship's side rising as
 * a wall of frames along the north, and the dark beyond it. */
export function paintBelow(level: ShipLevel, p: ShipPalette) {
  const g = hullGeom(level), { hull } = level;
  const R = new Raster(level.w * 16, level.h * 16);
  R.fill(0, 0, R.w, R.h, "#0c0a0e");
  const steel = level.use === "stokehold";
  const floor = steel ? ["#5a5a62", "#4a4a52", "#3a3a42", "#2a2a30", "#1a1a20"] : p.deck;
  const WALL = 30;
  for (let x = Math.floor(g.X0); x <= Math.ceil(g.X1); x++) {
    const n = g.north(x), s = g.south(x);
    if (s - n < 1) continue;
    for (let y = Math.floor(n); y < Math.ceil(s); y++) {
      const row = Math.floor((y + 400) / 6), run = 40 + Math.floor(h2(row, 1, 3) * 30), off = Math.floor(h2(row, 2, 3) * run);
      let c = floor[(h2(row, Math.floor((x + off) / run), 5) < 0.6 ? 2 : 1)];
      if (steel) c = (x >> 3) % 2 === (y >> 3) % 2 ? floor[2] : floor[1];
      else if ((y + 400) % 6 === 5 || (x + off) % run === 0) c = floor[3];
      R.set(x, y, c);
    }
    // The ship's side, curving in to the floor, its frames standing out.
    for (let k = 0; k < WALL; k++) {
      const y = n - WALL + k;
      let c = steel ? (k < 3 ? "#6a6a72" : "#3e3e46") : p.side[k < 3 ? 1 : k > WALL - 6 ? 3 : 2];
      if (!steel && x % 24 < 4) c = p.side[x % 24 < 1 ? 1 : 3];
      if (steel && x % 32 < 3) c = "#2a2a30";
      R.set(x, y, c);
    }
    for (let k = 0; k < 8; k++) R.shade(x, n + k, 0.5 - k * 0.06);
    R.fill(x, s, 1, 4, p.wale[2]);
  }
  // Gunports, scuttles or portholes in the side wall, letting in the day.
  const portW = level.use === "gundeck" ? 12 : 6;
  for (let u = 0.12; u < 0.9; u += level.use === "gundeck" ? 0.1 : 0.08) {
    const x = Math.round(g.X0 + u * hull.length * 16), n = g.north(x);
    if (g.south(x) - n < 40) continue;
    const y = n - 22;
    if (hull.kind === "steamer" || level.use === "steerage") {
      R.fill(x - 4, y, 8, 8, BRASS_DARK);
      R.fill(x - 3, y + 1, 6, 6, "#9ac8d8");
      R.fill(x - 3, y + 1, 3, 2, "#e8f6fa");
    } else if (level.use === "gundeck" || level.use === "hold") {
      R.fill(x - portW / 2 - 1, y - 1, portW + 2, 14, p.wale[3]);
      R.fill(x - portW / 2, y, portW, 12, level.use === "gundeck" ? "#a8d0d8" : p.wale[4]);
      if (level.use === "gundeck") R.fill(x - portW / 2, y, portW, 3, "#e8f6fa");
    }
  }
  for (const t of level.things) if (!t.solid) paintFlat(R, t.art, t.x * 16, t.y * 16, t.w * 16, t.h * 16, p, t.v);
  return R;
}
const BRASS_DARK = "#8a6a2a";
