import type { ShipLevel } from "../../world/ship";
import type { HullGeom } from "./hull";
import type { Ramp, ShipPalette } from "./palette";
import { Raster } from "./raster";

export type Nation = "english" | "iberian" | "dutch" | "french" | "us" | "none";
export type FlagSprite = { x: number; y: number; frames: Raster[] };
export type Rig = { sails: Raster; flags: FlagSprite[]; bottom: number };

const ROPE = "#3e3230";
const ROPE_LIT = "#6a5a4c";

function line(R: Raster, x0: number, y0: number, x1: number, y1: number, col: string) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  for (let i = 0; i <= n; i++) R.set(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, col);
}

/** Fill a polygon, asking `shade` for each pixel's colour. */
function poly(R: Raster, pts: readonly [number, number][], shade: (x: number, y: number) => string | undefined) {
  const ys = pts.map((p) => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      if ((ay <= y + 0.5) !== (by <= y + 0.5)) xs.push(ax + ((y + 0.5 - ay) / (by - ay)) * (bx - ax));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) R.set(x, y, shade(x, y));
  }
}

/** Light into a ramp in bands: no mixing, so the cloth keeps the palette. */
const band = (ramp: Ramp, light: number) => ramp[light > 0.78 ? 0 : light > 0.52 ? 1 : light > 0.28 ? 2 : light > 0.08 ? 3 : 4];

function mast(R: Raster, x: number, foot: number, top: number, w: number, wood: Ramp) {
  for (let y = top; y < foot; y++) {
    const t = (foot - y) / (foot - top), ww = Math.max(2, Math.round(w - (w - 2) * t));
    for (let i = 0; i < ww; i++) R.set(x - (ww >> 1) + i, y, wood[i === 0 ? 1 : i === ww - 1 ? 3 : 2]);
  }
  R.fill(x - 2, top - 2, 4, 2, wood[0]);
}

function yard(R: Raster, cx: number, y: number, half: number, wood: Ramp) {
  for (let x = -half; x <= half; x++) {
    const thick = Math.abs(x) > half - 6 ? 2 : 3;
    R.set(cx + x, y, wood[1]);
    R.set(cx + x, y + 1, wood[2]);
    if (thick > 2) R.set(cx + x, y + 2, wood[3]);
  }
}

/** A square sail filled with wind, face on: a bellied trapezium with seams, reef points and bolt rope. */
function squareSail(R: Raster, cx: number, top: number, wTop: number, wBot: number, h: number, ramp: Ramp, cross?: string) {
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1), half = (wTop + (wBot - wTop) * t) / 2 + Math.sin(t * Math.PI) * 3;
    // The foot is cut in a shallow curve; the corners hang lowest.
    for (let x = -Math.round(half); x <= Math.round(half); x++) {
      const s = x / half;
      if (y > h - 1 - (1 - s * s) * 4) continue;
      const light = 0.62 - 0.42 * s + 0.3 * Math.sin(t * Math.PI) * (1 - s * s) - 0.25 * t;
      let c = band(ramp, light);
      if (y < 2) c = ramp[y ? 2 : 3];
      else if (Math.abs(x) % 7 === 3 && y % 2 === 0) c = ramp[Math.min(4, ramp.indexOf(c) + 1)];
      if ((y === 5 || y === 10) && x % 4 === 0) c = ramp[3];
      if (Math.abs(x) >= Math.round(half) - 0) c = ramp[3];
      if (cross && Math.abs(Math.abs(x) * (h / (wBot * 0.9)) - (y - h * 0.08)) < 1.6 + ((x * 7 + y * 3) % 5 === 0 ? 1 : 0) && y > 3 && y < h - 4) c = cross;
      R.set(cx + x, top + y, c);
    }
    R.set(cx - Math.round(half), top + y, ramp[2]);
  }
}

function lateen(R: Raster, tack: [number, number], peak: [number, number], clew: [number, number], ramp: Ramp, wood: Ramp) {
  const [tx, ty] = tack, [px, py] = peak, [cx, cy] = clew;
  // Distance from the yard, as a share of the clew's.
  const nx = -(py - ty), ny = px - tx, nl = Math.hypot(nx, ny);
  const dClew = Math.abs((cx - tx) * nx + (cy - ty) * ny) / nl;
  const pts: [number, number][] = [tack, peak];
  for (let i = 1; i <= 8; i++) {
    const t = i / 8;
    pts.push([px + (cx - px) * t - Math.sin(t * Math.PI) * 10, py + (cy - py) * t]);
  }
  for (let i = 1; i < 8; i++) {
    const t = i / 8;
    pts.push([cx + (tx - cx) * t, cy + (ty - cy) * t + Math.sin(t * Math.PI) * 9]);
  }
  poly(R, pts, (x, y) => {
    const d = Math.abs((x - tx) * nx + (y - ty) * ny) / nl / dClew;
    const a = ((x - tx) * (px - tx) + (y - ty) * (py - ty)) / ((px - tx) ** 2 + (py - ty) ** 2);
    const light = 0.5 + 0.38 * Math.sin(Math.min(1, d) * Math.PI) - 0.3 * d + 0.18 * a;
    const seam = Math.round((x - px) * 0.97 + (y - py) * 0.24) % 9 === 0;
    const c = band(ramp, light);
    return seam && d > 0.08 ? ramp[Math.min(4, ramp.indexOf(c) + 1)] : c;
  });
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    R.set(px + (cx - px) * t - Math.sin(t * Math.PI) * 10, py + (cy - py) * t, ramp[3]);
  }
  // The yard: two spars fished together, thickest at the mast.
  const n = Math.hypot(px - tx, py - ty);
  for (let i = -4; i <= n + 6; i++) {
    const t = i / n, x = tx + (px - tx) * t, y = ty + (py - ty) * t;
    const thick = 1 + Math.round(Math.sin(Math.max(0, Math.min(1, t)) * Math.PI) * 1.6);
    for (let k = 0; k < thick; k++) R.set(x, y + k - 1, wood[k === 0 ? 1 : 3]);
  }
}

/** A junk's battened lugsail: panels each bellying between bamboo battens, sheets fanned aft. */
function junkSail(R: Raster, mx: number, foot: number, height: number, width: number, ramp: Ramp, wood: Ramp, sheetTo: [number, number]) {
  const n = Math.max(5, Math.round(height / 22));
  const luff = (t: number) => mx + width * 0.22 - t * 4;
  const leech = (t: number) => mx - width * 0.78 + Math.sin(t * Math.PI * 0.9) * -width * 0.12 + t * width * 0.18;
  const battens: [number, number, number][] = [];
  for (let i = 0; i <= n; i++) battens.push([leech(i / n), luff(i / n), foot - (i / n) * height]);
  for (let i = 0; i < n; i++) {
    const [l0, r0, y0] = battens[i], [l1, r1, y1] = battens[i + 1];
    // The head yard peaks aft.
    const peak = i === n - 1 ? 22 : 0;
    const pts: [number, number][] = [[l0, y0], [r0, y0], [r1, y1], [l1, y1 - peak]];
    poly(R, pts, (x, y) => {
      const tp = (y0 - y) / (y0 - y1), s = (x - l0) / (r0 - l0);
      const light = 0.42 + 0.36 * Math.sin(tp * Math.PI) + 0.22 * (1 - s) - 0.12 * tp;
      return Math.round(x - mx) % 11 === 0 ? ramp[3] : band(ramp, light);
    });
    if (i === n - 1) line(R, l1, y1 - peak, r1, y1, wood[2]);
  }
  for (const [l, r, y] of battens) {
    line(R, l - 2, y, r + 3, y, wood[3]);
    line(R, l - 2, y - 1, r + 3, y - 1, wood[1]);
  }
  battens.slice(0, -1).forEach(([l, , y], i) => i % 2 === 0 && line(R, l, y, sheetTo[0], sheetTo[1], ROPE));
}

function jib(R: Raster, tack: [number, number], head: [number, number], clew: [number, number], ramp: Ramp) {
  poly(R, [tack, head, [clew[0] - 3, (clew[1] + head[1]) / 2], clew], (x, y) => {
    const d = Math.abs(x - tack[0] - ((y - tack[1]) * (head[0] - tack[0])) / (head[1] - tack[1] || 1)) / 60;
    return band(ramp, 0.75 - d * 0.6 + ((y - head[1]) / (clew[1] - head[1] || 1)) * -0.15);
  });
  line(R, tack[0], tack[1], head[0], head[1], ramp[3]);
}

function spanker(R: Raster, mx: number, foot: number, h: number, w: number, ramp: Ramp, wood: Ramp) {
  const gaffEnd: [number, number] = [mx - w * 0.85, foot - h - 26], boomEnd: [number, number] = [mx - w, foot];
  poly(R, [[mx, foot - h], gaffEnd, boomEnd, [mx, foot]], (x, y) => {
    const s = (mx - x) / w, t = (y - (foot - h)) / h;
    return band(ramp, 0.6 + 0.3 * Math.sin(s * Math.PI) - 0.3 * t + (Math.round(x) % 8 === 0 ? -0.25 : 0));
  });
  line(R, mx, foot - h, gaffEnd[0], gaffEnd[1], wood[2]);
  line(R, mx, foot + 1, boomEnd[0], boomEnd[1] + 1, wood[2]);
}

/** A flag in four frames of a breeze from ahead, so it streams aft (to the left). */
function flag(design: (u: number, v: number) => string, len: number, hgt: number, swallow = false): Raster[] {
  return [0, 1, 2, 3].map((f) => {
    const R = new Raster(len + 2, hgt + 6);
    for (let x = 0; x < len; x++) {
      const u = x / (len - 1);
      const ph = u * 5 - f * (Math.PI / 2), wave = Math.sin(ph) * 2 * u, slope = Math.cos(ph);
      for (let y = 0; y < hgt; y++) {
        const v = y / (hgt - 1);
        if (swallow && u > 0.7 && Math.abs(v - 0.5) < (u - 0.7) * 1.4) continue;
        const c = design(u, v);
        R.set(len - 1 - x, y + 3 + wave, c);
        if (slope < -0.55 && u > 0.2) R.shade(len - 1 - x, y + 3 + wave, 0.22);
        else if (slope > 0.7 && u > 0.2) R.shade(len - 1 - x, y + 3 + wave, 0.12, [255, 250, 230]);
      }
    }
    return R;
  });
}

const RED = "#c8342c", WHITE = "#f4f0e4", BLUE = "#2a3c78", GOLD = "#e8c048", ORANGE = "#e8862c";

function ensign(nation: Nation, year: number, kind: string): ((u: number, v: number) => string) | undefined {
  const union = (u: number, v: number) => {
    const cu = u / 0.45, cv = v / 0.55;
    if (Math.abs(cu - 0.5) < 0.1 || Math.abs(cv - 0.5) < 0.14) return RED;
    if (Math.abs(cu - 0.5) < 0.18 || Math.abs(cv - 0.5) < 0.24) return WHITE;
    if (year >= 1707 && (Math.abs(cu - cv) < 0.12 || Math.abs(cu + cv - 1) < 0.12)) return WHITE;
    return BLUE;
  };
  switch (nation) {
    case "english":
      return (u, v) => (u < 0.45 && v < 0.55 ? (year >= 1707 ? union(u, v) : Math.abs(u - 0.22) < 0.07 || Math.abs(v - 0.27) < 0.1 ? RED : WHITE) : RED);
    case "dutch":
      return (_, v) => (v < 0.34 ? (year < 1660 ? ORANGE : RED) : v < 0.67 ? WHITE : BLUE);
    case "french":
      return year >= 1790 ? (u) => (u < 0.34 ? BLUE : u < 0.67 ? WHITE : RED) : (u, v) => ((Math.round(u * 9) + Math.round(v * 6)) % 4 === 0 ? GOLD : WHITE);
    case "iberian":
      return year >= 1785 ? (_, v) => (v < 0.25 || v > 0.75 ? RED : GOLD) : (u, v) => (Math.abs(u - v) < 0.13 || Math.abs(u + v - 1) < 0.13 ? RED : WHITE);
    case "us":
      return (u, v) => (u < 0.42 && v < 0.54 ? ((Math.round(u * 14) + Math.round(v * 10)) % 2 ? WHITE : BLUE) : Math.floor(v * 13) % 2 ? WHITE : RED);
    case "none":
      return kind === "dhow" ? () => RED : kind === "steamer" ? (u, v) => (Math.abs(v - 0.5) < 0.18 && u > 0.25 ? WHITE : RED) : undefined;
  }
}

/** Everything that stands above the deck past the lowest mast: spars, sails, rigging and flags. */
export function paintRig(level: ShipLevel, g: HullGeom, p: ShipPalette, year: number, nation: Nation): Rig {
  const R = new Raster(level.w * 16, level.h * 16);
  const { hull } = level;
  const L = hull.length * 16;
  const wood = p.rail;
  const flags: FlagSprite[] = [];
  const masts = level.things.filter((t) => /^mast-\d$/.test(t.art)).map((t) => ({ x: t.x * 16 + 8, foot: t.y * 16 + 10, i: Number(t.art.slice(5)) }));
  const deckY = g.north(g.X0 + L / 2);
  const shroud = (x: number, top: number, spread: number) => {
    const feet = [-1, -0.5, 0, 0.5].map((k) => x + k * spread);
    for (const fx of feet) line(R, fx, g.north(fx) + 2, x, top, ROPE);
    // Ratlines, the rope ladders up the shrouds.
    for (let y = g.north(x) - 4; y > top + 6; y -= 4) {
      const t = (g.north(x) - y) / (g.north(x) - top);
      line(R, feet[0] + (x - feet[0]) * t, y, feet[3] + (x - feet[3]) * t, y, ROPE_LIT);
    }
  };
  const stem: [number, number] = [g.X1 - 6, g.south(g.X1) - 10];
  let bowsprit: [number, number] = stem;
  if (hull.kind === "square-rigger" || hull.kind === "steamer") {
    const len = hull.kind === "steamer" ? (year < 1890 ? 44 : 0) : hull.id === "galleon" ? 120 : 110;
    if (len) {
      bowsprit = [stem[0] + len, stem[1] - len * (hull.id === "galleon" ? 0.55 : 0.32)];
      for (let k = 0; k < 4; k++) line(R, stem[0] - 10, stem[1] + k - 1 - 4, bowsprit[0], bowsprit[1] + Math.min(k, 2) - 1, wood[[1, 2, 2, 3][k]]);
      line(R, bowsprit[0] - 30, bowsprit[1] + 12, g.X1 - 4, g.keel(g.X1 - 4) - 2, ROPE);
    }
  }

  if (hull.kind === "square-rigger") {
    const tiers = hull.id === "galleon" ? [56, 46, 26] : hull.id === "indiaman" ? [52, 46, 32, year >= 1780 ? 22 : 0] : [50, 48, 34, 24];
    const tops: number[] = [];
    const iberian = nation === "iberian" && hull.id === "galleon" ? RED : undefined;
    for (const m of masts) {
      const aft = m.i === 0 && hull.masts.length === 3;
      const scale = aft ? 0.7 : m.i === 1 ? 1 : 0.92;
      const wide = L * 0.21 * scale;
      const height = (tiers.reduce((a, b) => a + b, 0) + 70) * scale;
      const top = m.foot - height;
      tops[m.i] = top;
      mast(R, m.x, m.foot - 30, top, 7, wood);
      shroud(m.x, m.foot - 52 - tiers[0] * scale - 4, 18);
      if (aft) {
        if (hull.id === "galleon") lateen(R, [m.x + 70, m.foot - 50], [m.x - 92, m.foot - 196], [m.x - 64, m.foot - 52], p.sail, wood);
        else spanker(R, m.x, m.foot - 44, 86, 104, p.sail, wood);
        const top2 = m.foot - 44 - 86 - 6;
        squareSail(R, m.x, top2 - 38, wide * 0.6, wide * 0.72, 36, p.sail);
        yard(R, m.x, top2 - 40, Math.round(wide * 0.34), wood);
        continue;
      }
      let y = m.foot - 52;
      tiers.forEach((h, k) => {
        if (!h) return;
        const h2 = h * scale, w0 = wide * (1 - k * 0.2), w1 = wide * (1 - (k + 1) * 0.2 + 0.06);
        squareSail(R, m.x, y - h2, w0 * (k ? 0.92 : 0.94), k ? w1 + 6 : w0, h2, p.sail, k === 0 ? iberian : undefined);
        yard(R, m.x, y - h2 - 2, Math.round(w0 / 2 + 5), wood);
        if (k === 0) {
          // The top: a platform at the lower masthead, seen edge on.
          R.fill(m.x - 16, y - h2 - 8, 32, 3, wood[2]);
          R.fill(m.x - 16, y - h2 - 8, 32, 1, wood[1]);
        }
        // Lifts from the yard's ends up to the masthead above.
        line(R, m.x - w0 / 2 - 4, y - h2 - 2, m.x, y - h2 - 2 - h * 0.8, ROPE);
        line(R, m.x + w0 / 2 + 4, y - h2 - 2, m.x, y - h2 - 2 - h * 0.8, ROPE);
        y -= h2 + 4;
      });
    }
    // Stays run forward from each masthead to the foot of the next mast, the last to the bowsprit.
    const order = [...masts].sort((a, b) => a.x - b.x);
    order.forEach((m, k) => {
      const next = order[k + 1];
      if (next) line(R, m.x, tops[m.i] + 30, next.x, next.foot - 52, ROPE);
      else {
        line(R, m.x, tops[m.i] + 20, bowsprit[0], bowsprit[1], ROPE);
        const reach = bowsprit[0] - m.x;
        jib(R, [bowsprit[0] - 6, bowsprit[1] + 3], [m.x + 10, tops[m.i] + 40], [bowsprit[0] - reach * 0.62, bowsprit[1] - 26], p.sail);
        jib(R, [bowsprit[0] - 40, bowsprit[1] + 12], [m.x + 8, tops[m.i] + 84], [bowsprit[0] - reach * 0.78, bowsprit[1] - 4], p.sail);
      }
    });
    if (hull.id === "galleon") {
      // The spritsail, slung under the bowsprit.
      const sx = stem[0] + 70, sy = stem[1] - 34;
      yard(R, sx, sy, 26, wood);
      squareSail(R, sx, sy + 2, 46, 52, 30, p.sail, iberian);
    }
    const mainTop = tops[1] ?? tops[0];
    const main = masts.find((m) => m.i === 1) ?? masts[0];
    flags.push({ x: main.x - 52, y: mainTop - 10, frames: flag((_, v) => (v < 0.5 ? RED : WHITE), 52, 5) });
  }

  if (hull.kind === "dhow") {
    for (const m of masts) {
      const main = m.i === hull.masts.length - 1, k = main ? 1 : 0.58;
      // The masts rake forward; the long yards are hoisted with the peak aft.
      const top = m.foot - 170 * k;
      line(R, m.x - 1, m.foot - 30, m.x + 16 * k, top, wood[3]);
      line(R, m.x, m.foot - 30, m.x + 1 + 16 * k, top, wood[2]);
      line(R, m.x + 1, m.foot - 30, m.x + 2 + 16 * k, top, wood[1]);
      for (const dx of [-14, 18]) line(R, m.x + dx, g.north(m.x + dx), m.x + 15 * k, top + 8, ROPE);
      lateen(R, [m.x + L * 0.34 * k, m.foot - 40], [m.x - L * 0.4 * k, m.foot - 268 * k], [m.x - L * 0.26 * k, m.foot - 44], p.sail, wood);
      if (main) flags.push({ x: m.x - L * 0.4 * k - 30, y: m.foot - 268 * k - 6, frames: flag(() => RED, 30, 10, true) });
    }
  }

  if (hull.kind === "junk") {
    for (const m of masts) {
      const k = m.i === 1 ? 1 : m.i === 0 ? 0.6 : 0.78;
      const top = m.foot - 230 * k;
      const rake = m.i === 2 ? 12 : 0;
      for (let d = -2; d <= 2; d++) line(R, m.x + d, m.foot - 30, m.x + d + rake, top, wood[[1, 1, 2, 3, 3][d + 2]]);
      junkSail(R, m.x + rake * 0.4, m.foot - 36, 186 * k, 150 * k, p.sail, wood, m.i === 0 ? [g.X0 + 6, deckY + 8] : [m.x - 80 * k, deckY + 10]);
      flags.push({ x: m.x + rake - 40, y: top - 6, frames: flag((u, v) => (v < 0.2 + u * 0.3 ? RED : u > 0.6 ? GOLD : RED), 40, 6) });
    }
  }

  if (hull.kind === "steamer") {
    for (const m of masts) {
      const top = m.foot - 200;
      mast(R, m.x, m.foot - 30, top, 6, ["#e6dcc4", "#c8b898", "#a08c6c", "#786848", "#4e4434"]);
      for (const dx of [-12, 10]) line(R, m.x + dx, g.north(m.x + dx), m.x, top + 20, ROPE);
      // Derricks for working cargo, topped up to the mast.
      for (const dir of [-1, 1]) line(R, m.x, m.foot - 40, m.x + dir * 58, m.foot - 92, wood[2]);
      line(R, m.x + 58, m.foot - 92, m.x, m.foot - 140, ROPE);
      line(R, m.x - 58, m.foot - 92, m.x, m.foot - 140, ROPE);
      if (year < 1895 && m.i === 1) {
        // A steadying yard and its sail, furled.
        yard(R, m.x, m.foot - 150, 34, wood);
        for (let x = -30; x <= 30; x++) R.fill(m.x + x, m.foot - 147, 1, 3 + (Math.abs(x) % 9 < 4 ? 1 : 0), p.sail[x < 0 ? 1 : 2]);
      }
      if (m.i === 1) {
        // The crow's nest.
        R.fill(m.x - 6, m.foot - 170, 12, 9, "#5a4636");
        R.fill(m.x - 6, m.foot - 170, 12, 2, "#7a6250");
      }
    }
    const [a, b] = [...masts].sort((u, v) => u.x - v.x);
    if (a && b) {
      line(R, a.x, a.foot - 196, b.x, b.foot - 196, ROPE);
      if (year >= 1910) for (let x = a.x; x < b.x; x += 2) R.set(x, a.foot - 190 + Math.sin(((x - a.x) / (b.x - a.x)) * Math.PI) * 8, "#5a5a62");
      // Signal flags dressed on a halyard.
      const cols = [RED, GOLD, BLUE, WHITE, "#2a2a30"];
      for (let i = 0; i < 9; i++) {
        const x = b.x + 6 + i * 9, y = b.foot - 196 + i * 13;
        if (x > g.X1 + 20) break;
        R.fill(x, y, 6, 6, cols[(i * 3) % cols.length]);
        R.fill(x + 1, y + 2, 4, 2, cols[(i * 3 + 2) % cols.length]);
      }
      line(R, b.x, b.foot - 196, g.X1 + 4, g.south(g.X1) - 30, ROPE);
    }
    if (masts[0]) flags.push({ x: masts[0].x - 26, y: masts[0].foot - 214, frames: flag((u, v) => (Math.abs(v - 0.5) < 0.18 && u > 0.25 ? WHITE : RED), 26, 14, true) });
  }

  const design = ensign(nation, year, hull.kind);
  if (design) {
    const sx = g.X0 + 8, base = g.north(g.X0 + 8) + 4;
    const staff = hull.kind === "steamer" ? 44 : 54;
    for (let y = 0; y < staff; y++) R.fill(sx, base - y, 2, 1, y === staff - 1 ? GOLD : wood[2]);
    flags.push({ x: sx - 32, y: base - staff - 1, frames: flag(design, 32, 20) });
  }
  const bottom = Math.max(...masts.map((m) => m.foot - 44), deckY);
  return { sails: R, flags, bottom };
}
