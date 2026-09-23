import { conditionOf, type Structure } from "../../core/time/structure";
import { classify, hash, Mat } from "./sim";

/** Room round the building for what falls off it: sides, and ground in front. */
export const PAD_X = 14;
export const PAD_Y = 8;

function smooth(x: number, y: number, seed: number, scale: number) {
  const fx = x / scale,
    fy = y / scale;
  const x0 = Math.floor(fx),
    y0 = Math.floor(fy);
  const tx = fx - x0,
    ty = fy - y0;
  const a = hash(x0, y0, seed),
    b = hash(x0 + 1, y0, seed),
    c = hash(x0, y0 + 1, seed),
    d = hash(x0 + 1, y0 + 1, seed);
  return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
}
const clamp = (v: number) => Math.max(0, Math.min(1, v));

const MOSS = [
  [79, 107, 46],
  [109, 138, 58],
  [58, 82, 38],
];
const TURF = [
  [98, 116, 60],
  [106, 124, 64],
  [84, 100, 52],
];
/** The fallen-stone palette of `paintRuin`, so the two read as one ruin. */
const RUIN = {
  masonry: [
    [171, 164, 140],
    [100, 105, 87],
    [208, 198, 166],
  ],
  earth: [
    [169, 140, 99],
    [118, 102, 73],
    [197, 170, 128],
  ],
  timber: [
    [121, 105, 80],
    [72, 75, 62],
    [162, 150, 114],
  ],
};

/** The building in the state `s` describes, drawn from its own sprite. Wear
 * comes first and is only colour: damp rising from the footings, leaks
 * under sills and eaves, a cracked pane. Abandonment then takes the roof
 * (sag, then the middle falls in), and the walls come down to their
 * foundations, the stone lying where it fell round them. */
export function decay(src: Uint8ClampedArray, w: number, h: number, s: Structure, seed = 1) {
  const W = w + PAD_X * 2,
    H = h + PAD_Y;
  const n = W * H;
  const out = new Uint8ClampedArray(n * 4);
  for (let y = 0; y < h; y++) out.set(src.subarray(y * w * 4, (y + 1) * w * 4), (y * W + PAD_X) * 4);

  const mat = new Uint8Array(n);
  const glass = new Uint8Array(n);
  let bottom = 0;
  for (let i = 0; i < n; i++) {
    if (out[i * 4 + 3] < 200) continue;
    const r = out[i * 4],
      g = out[i * 4 + 1],
      b = out[i * 4 + 2];
    mat[i] = classify(r, g, b, false);
    glass[i] = +(b > r + 12 && b >= g - 4);
    bottom = Math.max(bottom, (i / W) | 0);
  }
  const wear = 1 - conditionOf(s);
  const abandoned = s.abandoned !== undefined;
  const isRoof = (i: number) => {
    const m = mat[i];
    return (m === Mat.Thatch || m === Mat.Tile || m === Mat.Wood) && i / W < h * 0.55 && !glass[i];
  };

  // The pieces that come away whole: shingles, wall blocks, panes.
  const chunkOf = new Int32Array(n).fill(-1);
  const chunks: number[][] = [];
  const ids = new Map<number, number>();
  for (let i = 0; i < n; i++) {
    if (!mat[i]) continue;
    const x = i % W,
      y = (i / W) | 0;
    const [cw, ch, kind] = glass[i] ? [2, 2, 2] : isRoof(i) ? [3, 2, 1] : [4, 3, 0];
    const row = Math.floor(y / ch);
    const key = (kind * 4096 + row) * 4096 + Math.floor((x + (row & 1) * (cw >> 1)) / cw);
    let c = ids.get(key);
    if (c === undefined) {
      ids.set(key, (c = chunks.length));
      chunks.push([]);
    }
    chunks[c].push(i);
    chunkOf[i] = c;
  }
  // Depth of each piece below the open air, so loss starts at the outline.
  const depth = new Int32Array(chunks.length).fill(-1);
  const touching: number[][] = chunks.map(() => []);
  const queue: number[] = [];
  chunks.forEach((pixels, c) => {
    const seen = new Set<number>();
    for (const i of pixels) {
      const x = i % W;
      for (const j of [x ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) {
        if (j < 0 || j >= n || chunkOf[j] < 0) {
          if (depth[c] < 0) queue.push(c);
          depth[c] = 0;
        } else if (chunkOf[j] !== c && !seen.has(chunkOf[j])) {
          seen.add(chunkOf[j]);
          touching[c].push(chunkOf[j]);
        }
      }
    }
  });
  for (let k = 0; k < queue.length; k++)
    for (const o of touching[queue[k]])
      if (depth[o] < 0) {
        depth[o] = depth[queue[k]] + 1;
        queue.push(o);
      }

  const lost = new Float32Array(W);
  const drop = (i: number, weight = 1) => {
    if (!mat[i]) return;
    lost[i % W] += weight;
    mat[i] = 0;
    out[i * 4 + 3] = 0;
  };
  const kindOf = (c: number) => (glass[chunks[c][0]] ? 2 : isRoof(chunks[c][0]) ? 1 : 0);

  // Panes go first: in a worn house a few, in an empty one nearly all.
  const broken = clamp(abandoned ? wear * 3 : (wear - 0.25) * 1.6);
  const brokenPane = new Uint8Array(chunks.length);
  chunks.forEach((_, c) => kindOf(c) === 2 && hash(c, 7, seed) < broken && (brokenPane[c] = 1));

  // Shingles go from the outline inward, in proportion to the roof lost.
  const roofChunks = chunks.map((_, c) => c).filter((c) => kindOf(c) === 1);
  roofChunks.sort((a, b) => depth[a] + hash(a, 8, seed) * 3 - (depth[b] + hash(b, 8, seed) * 3));
  const shed = Math.round(roofChunks.length * clamp((1 - s.roof) * 0.6));
  for (let k = 0; k < shed; k++) for (const i of chunks[roofChunks[k]]) drop(i, 0.3);

  // Walls come down from the top once nobody lives there, to what `walls`
  // says survives, but never below the footing courses. A lived-in wall only
  // shows its wear.
  const top = new Int16Array(W).fill(H);
  for (let i = 0; i < n; i++) if (mat[i] && !isRoof(i)) top[i % W] = Math.min(top[i % W], (i / W) | 0);
  const FOOTING = 4;
  chunks.forEach((pixels, c) => {
    if (!abandoned || kindOf(c) === 1) return;
    const i = pixels[0],
      x = i % W,
      y = (i / W) | 0;
    const section = Math.min(11, Math.max(0, Math.floor(((x - PAD_X) / w) * 12)));
    const span = bottom - top[x];
    if (span <= FOOTING || bottom - y < FOOTING) return;
    const f = (bottom - y) / span;
    if (f > s.walls[section] + 0.3 + (hash(c, 9, seed) - 0.5) * 0.25) for (const j of pixels) drop(j);
  });

  // Loose frames beside a smashed pane drop a pixel out of true.
  for (let c = 0; c < chunks.length; c++) {
    const pixels = chunks[c];
    if (kindOf(c) !== 0 || wear < 0.45 || !touching[c].some((o) => brokenPane[o])) continue;
    if (hash(c, 6, seed) > wear) continue;
    for (const i of [...pixels].sort((a, b) => b - a)) {
      if (!mat[i] || i + W >= n || glass[i + W]) continue;
      out.copyWithin((i + W) * 4, i * 4, i * 4 + 4);
      mat[i + W] = mat[i];
      if (!pixels.includes(i - W)) drop(i, 0);
    }
  }

  // The roof sags once its timbers go, then the middle falls in.
  let rx0 = W,
    rx1 = -1,
    ry1 = 0;
  for (let i = 0; i < n; i++)
    if (mat[i] && isRoof(i)) {
      rx0 = Math.min(rx0, i % W);
      rx1 = Math.max(rx1, i % W);
      ry1 = Math.max(ry1, (i / W) | 0);
    }
  const sag = clamp((0.6 - s.roof) / 0.45);
  if (rx1 > rx0 && sag > 0) {
    const span = rx1 - rx0;
    const moved: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      if (!mat[i] || !isRoof(i)) continue;
      const bow = Math.sin((Math.PI * ((i % W) - rx0)) / span);
      // The hole opens from the ridge's middle and widens toward the gables.
      if (s.roof < 0.03 || (s.roof < 0.15 && bow > 0.15 + (s.roof / 0.15) * 0.6)) {
        drop(i, 0.3);
        continue;
      }
      const d = Math.round(ry1 * 0.45 * sag * bow * bow);
      if (d) moved.push([i, d]);
    }
    const saved = moved.map(([i]) => [out.slice(i * 4, i * 4 + 4), mat[i]] as const);
    for (const [i] of moved) {
      out[i * 4 + 3] = 0;
      mat[i] = 0;
    }
    moved.forEach(([i, d], k) => {
      const j = i + d * W;
      if (j >= n) return;
      out.set(saved[k][0], j * 4);
      mat[j] = saved[k][1];
    });
  }

  // Whatever no longer reaches the ground comes down with the rest.
  const reached = new Uint8Array(n);
  const stack: number[] = [];
  for (let i = Math.max(0, bottom - 1) * W; i < n; i++)
    if (mat[i]) {
      reached[i] = 1;
      stack.push(i);
    }
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % W;
    for (const j of [i - W, i + W, x ? i - 1 : -1, x < W - 1 ? i + 1 : -1, x ? i - W - 1 : -1, x < W - 1 ? i - W + 1 : -1])
      if (j >= 0 && j < n && mat[j] && !reached[j]) {
        reached[j] = 1;
        stack.push(j);
      }
  }
  for (let i = 0; i < n; i++) if (mat[i] && !reached[i]) drop(i, isRoof(i) ? 0.3 : 1);

  // Colour: fading, damp rising from the footings, leaks under sills and
  // eaves, moss where water sits, soot where it burned.
  for (let i = 0; i < n; i++) {
    if (!mat[i]) continue;
    const x = i % W,
      y = (i / W) | 0,
      q = i * 4;
    let r = out[q],
      g = out[q + 1],
      b = out[q + 2];
    if (brokenPane[chunkOf[i]] && glass[i]) {
      const shard = hash(i, 5, seed) < 0.3 && (!glass[i - 1] || !glass[i + 1]);
      if (!shard) [r, g, b] = [26, 24, 30];
    }
    const grey = (r + g + b) / 3,
      fade = wear * 0.35,
      dark = 1 - wear * 0.15;
    r = (r + (grey - r) * fade) * dark;
    g = (g + (grey - g) * fade) * dark;
    b = (b + (grey - b) * fade) * dark;
    if (!isRoof(i)) {
      const damp = wear * h * 0.22 * (0.5 + smooth(x, 0, seed + 20, 5));
      const up = bottom - y;
      if (up < damp) {
        const k = 0.25 * (1 - up / damp) + 0.08;
        r *= 1 - k;
        g *= 1 - k * 0.9;
        b *= 1 - k * 1.2;
      }
    }
    let streak = 0;
    for (let k = 1; k <= 18 && y - k >= 0; k++) {
      const j = i - k * W;
      if (!glass[j] && !(isRoof(j) && !isRoof(j + W))) continue;
      if (hash(x, j, seed + 21) < wear * 0.8 && k < wear * 18 * (0.5 + hash(x, 0, seed + 22)))
        streak = 0.22 * (1 - k / 18);
      break;
    }
    r *= 1 - streak;
    g *= 1 - streak * 0.85;
    b *= 1 - streak * 0.6;
    const ledge = y === 0 || !mat[i - W];
    const mossy = isRoof(i) ? s.vegetation * 0.6 + wear * 0.15 : s.vegetation * 0.8;
    if ((ledge || isRoof(i)) && hash(x, y, seed + 11) < mossy * smooth(x, y, seed + 11, 4) * 1.4)
      [r, g, b] = MOSS[(hash(x, y, seed + 12) * 3) | 0];
    if (s.char) {
      const k = Math.min(0.85, s.char * smooth(x, y, seed + 23, 6) * 1.4);
      r *= 1 - k;
      g *= 1 - k;
      b *= 1 - k;
    }
    out[q] = r;
    out[q + 1] = g;
    out[q + 2] = b;
  }

  // Ivy climbs from the ground on a building nobody cuts it back from.
  for (let x = 0; x < W; x++) {
    if (hash(x, 0, seed + 7) > s.vegetation * 0.12) continue;
    const reach = s.vegetation * h * 0.8 * (0.5 + hash(x, 1, seed + 7));
    for (let k = 0; k < reach && bottom - k >= 0; k++) {
      const y = bottom - k;
      const vx = x + Math.round((smooth(x, y, seed + 8, 6) - 0.5) * 6);
      for (const ix of [vx, vx + (hash(vx, y, seed + 9) < 0.4 ? 1 : 0)]) {
        const i = y * W + ix;
        if (ix >= 0 && ix < W && mat[i]) out.set([...MOSS[(hash(ix, y, seed + 10) * 3) | 0], 255], i * 4);
      }
    }
  }

  // What fell: a low talus against the footings where the wall stood, and
  // dressed stones or beams thrown out round the base, never one heap.
  const pal = RUIN[s.fabric];
  const paint = (x: number, y: number, c: number[]) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    out.set([c[0], c[1], c[2], 255], (y * W + x) * 4);
  };
  for (let x = 0; x < W; x++) {
    let near = 0;
    for (let d = -3; d <= 3; d++) near += lost[x + d] ?? 0;
    const tall = Math.min(3, Math.floor(near / 40));
    for (let k = 0; k < tall; k++)
      if (hash(x, k, seed + 24) < 0.8) paint(x, bottom - k, pal[k === tall - 1 ? 2 : (hash(x, k, 25) * 2) | 0]);
  }
  const total = lost.reduce((a, b) => a + b, 0);
  const pieces = Math.min(60, Math.floor(total / 18));
  for (let k = 0; k < pieces; k++) {
    // Start from a column that lost something, so stone lies below its wall.
    let x = Math.floor(hash(k, 1, seed + 26) * W);
    for (let tries = 0; tries < 8 && lost[x] < 1; tries++) x = Math.floor(hash(k, tries + 2, seed + 26) * W);
    const side = x < W / 2 ? -1 : 1;
    const bx = x + Math.round(side * hash(k, 3, seed + 27) * (hash(k, 4, seed + 27) < 0.5 ? 10 : 3));
    const by = bottom - 1 + Math.round(hash(k, 5, seed + 27) * (PAD_Y + 1));
    const beam = s.fabric === "timber" && hash(k, 6, seed) < 0.6;
    const bw = beam ? 7 + ((hash(k, 7, seed) * 4) | 0) : 3 + ((hash(k, 7, seed) * 2) | 0);
    for (let dx = 0; dx < bw; dx++) {
      paint(bx + dx, by - 1, pal[2]);
      paint(bx + dx, by, pal[0]);
      paint(bx + dx + 1, by + 1, pal[1]);
    }
    if (hash(k, 8, seed) < s.vegetation) paint(bx + 1, by - 2, MOSS[1]);
  }

  // Burial: turf creeps up over the footings and the fallen stone.
  const turf = s.burial * 10;
  for (let x = 0; x < W; x++) {
    const rise = turf * (0.6 + smooth(x, 0, seed + 28, 5) * 0.8);
    for (let k = 0; k < rise; k++) {
      const i = (bottom + 1 - k) * W + x;
      if (i >= 0 && i < n && out[i * 4 + 3]) out.set([...TURF[(hash(x, k, seed + 29) * 3) | 0], 255], i * 4);
    }
  }
  return { data: out, w: W, h: H };
}
