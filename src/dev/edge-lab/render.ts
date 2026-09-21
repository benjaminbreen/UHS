import { Buffer } from "../terrain-experiments/buffer";

/** Mockup of the altitude-edge proposal. Nothing here is read by the game:
 * it is a fixture town on a slope, drawn with the engine's 16 px tile and
 * 14 px rise, so the options can be judged before the real renderer changes. */
export type EdgeSettings = {
  seed: number;
  zoom: number;
  /** Straighten the tier boundary inside the town. */
  terrace: boolean;
  /** Runs follow the street plan and snap to kerbs and rear lot lines. */
  snap: boolean;
  minRun: number;
  /** A terrace row of houses stands against a mid-block step. */
  rowsHide: boolean;
  townEdge: "bank" | "wall";
  wallMaterial: number;
  parapet: boolean;
  countryEdge: "auto" | "bank" | "slope" | "crag";
  slopeLength: number;
  crossing: "cut" | "graded" | "steps";
  sideFace: number;
  rimSaturation: number;
  foot: boolean;
  contactShadow: number;
  hillshade: number;
  wobble: number;
  showRaw: boolean;
};

export const today: EdgeSettings = {
  seed: 3,
  zoom: 2,
  terrace: false,
  snap: false,
  minRun: 4,
  rowsHide: false,
  townEdge: "bank",
  wallMaterial: 0,
  parapet: false,
  countryEdge: "bank",
  slopeLength: 2,
  crossing: "cut",
  sideFace: 0,
  rimSaturation: 1,
  foot: false,
  contactShadow: 3,
  hillshade: 0,
  wobble: 0.6,
  showRaw: false,
};

export const proposed: EdgeSettings = {
  ...today,
  terrace: true,
  snap: true,
  rowsHide: true,
  townEdge: "wall",
  parapet: true,
  countryEdge: "auto",
  crossing: "graded",
  sideFace: 4,
  rimSaturation: 0.25,
  foot: true,
  contactShadow: 4,
  hillshade: 0.6,
};

export const wallMaterials = ["Rubble", "Ashlar", "Brick", "Concrete"];

export const W = 56,
  H = 34,
  T = 16,
  R = 14,
  TOWN = 38,
  OY = 2 * R;
const H_ROADS = [9, 23],
  V_ROADS = [12, 27];
const BLOCKS_X = [
    [0, 10],
    [15, 25],
    [30, 38],
  ],
  BLOCKS_Y = [
    [0, 7],
    [12, 21],
    [26, 33],
  ];
/** Rows a town boundary may sit on: street kerbs and rear lot lines. */
const SNAP_ROWS = [4, 8, 12, 17, 22, 26, 30];
const REAR_LINES = [4, 17, 30];

type RGB = [number, number, number];
const GRASS = 0,
  DIRT = 1,
  PAVE = 2,
  ROAD = 3;
const NORTH = 1,
  EAST = 2;
const CUT = 1,
  GRADED = 2,
  STEPS = 3;
const BANK = 0,
  WALL = 1,
  CRAG = 2,
  SLOPE = 3;

const hash = (x: number, y: number, s: number) => {
  let n =
    Math.imul(x | 0, 374761393) ^
    Math.imul(y | 0, 668265263) ^
    Math.imul(s | 0, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
const ease = (t: number) => t * t * (3 - 2 * t);
const vnoise = (x: number, y: number, scale: number, s: number) => {
  const u = x / scale,
    v = y / scale,
    x0 = Math.floor(u),
    y0 = Math.floor(v),
    fx = ease(u - x0),
    fy = ease(v - y0);
  const a = hash(x0, y0, s),
    b = hash(x0 + 1, y0, s),
    c = hash(x0, y0 + 1, s),
    d = hash(x0 + 1, y0 + 1, s);
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
};
const mul = (c: readonly number[], f: number): RGB => [
  Math.min(255, c[0] * f),
  Math.min(255, c[1] * f),
  Math.min(255, c[2] * f),
];
const mix = (a: readonly number[], b: readonly number[], t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const mod = (n: number, m: number) => ((n % m) + m) % m;

export type Building = {
  x: number;
  y: number;
  w: number;
  d: number;
  tier: number;
  tone: number;
};
export type Layout = {
  raw: number[];
  line: number[];
  tier: Int8Array;
  mat: Uint8Array;
  rampDir: Uint8Array;
  rampK: Uint8Array;
  rampLen: Uint8Array;
  rampKind: Uint8Array;
  style: Uint8Array;
  buildings: Building[];
  jogs: number;
  lots: number;
  built: number;
};

export function makeLayout(s: EdgeSettings): Layout {
  const mat = new Uint8Array(W * H),
    tier = new Int8Array(W * H);
  const street = (x: number, y: number) => {
    if (x > TOWN)
      return H_ROADS.some((r) => y === r || y === r + 1) ? DIRT : -1;
    const road =
      H_ROADS.some((r) => y === r || y === r + 1) ||
      V_ROADS.some((r) => x === r || x === r + 1);
    if (road) return ROAD;
    const walk =
      H_ROADS.some((r) => y === r - 1 || y === r + 2) ||
      V_ROADS.some((r) => x === r - 1 || x === r + 2);
    return walk ? PAVE : -1;
  };
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const st = street(x, y);
      mat[y * W + x] =
        st >= 0
          ? st
          : x <= TOWN && vnoise(x, y, 4, s.seed + 9) > 0.62
            ? DIRT
            : GRASS;
    }

  const raw: number[] = [];
  for (let x = 0; x < W; x++)
    raw.push(
      Math.max(
        2,
        Math.min(
          H - 3,
          Math.round(5 + x * 0.42 + (vnoise(x, 0, 5, s.seed) - 0.5) * 7),
        ),
      ),
    );
  const line = raw.slice();
  if (s.terrace) {
    const breaks = [0];
    if (s.snap) for (const v of V_ROADS) breaks.push(v + 3);
    else for (let x = s.minRun; x <= TOWN; x += s.minRun) breaks.push(x);
    breaks.push(TOWN + 1);
    for (let b = 0; b + 1 < breaks.length; b++) {
      let sum = 0;
      for (let x = breaks[b]; x < breaks[b + 1]; x++) sum += raw[x];
      const mean = sum / (breaks[b + 1] - breaks[b]);
      const row = s.snap
        ? SNAP_ROWS.reduce((best, c) =>
            Math.abs(c - mean) < Math.abs(best - mean) ? c : best,
          )
        : Math.round(mean);
      for (let x = breaks[b]; x < breaks[b + 1]; x++) line[x] = row;
    }
    // Open country keeps its wander but loses single-tile jogs.
    for (let x = TOWN + 2; x < W - 1; x++) {
      const three = [raw[x - 1], raw[x], raw[x + 1]].sort((a, b) => a - b);
      line[x] = three[1];
    }
  }
  const second = (x: number) =>
    x >= 42 ? line[x] - Math.max(0, Math.round(10 - (x - 44) * 1.3)) : -99;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      tier[y * W + x] = y < second(x) ? 2 : y < line[x] ? 1 : 0;

  // Edge style per column: the town walls its steps, the country varies by
  // stretch so one style holds for a whole run.
  const style = new Uint8Array(W);
  for (let x = 0; x < W; x++) {
    if (x <= TOWN) style[x] = s.townEdge === "wall" ? WALL : BANK;
    else if (s.countryEdge === "auto") {
      const pick = hash(Math.floor((x - TOWN) / 6), 0, s.seed + 31);
      style[x] = second(x) === line[x] ? CRAG : pick < 0.45 ? SLOPE : BANK;
    } else style[x] = { bank: BANK, slope: SLOPE, crag: CRAG }[s.countryEdge];
  }

  const rampDir = new Uint8Array(W * H),
    rampK = new Uint8Array(W * H),
    rampLen = new Uint8Array(W * H),
    rampKind = new Uint8Array(W * H);
  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= W || y >= H ? -1 : y * W + x;
  const isStreet = (i: number) =>
    i >= 0 &&
    (mat[i] === ROAD ||
      (mat[i] === PAVE && s.crossing !== "cut") ||
      (mat[i] === DIRT && i % W > TOWN));
  const inBand = (v: number, roads: number[]) =>
    roads.some((r) => v >= r - 1 && v <= r + 2);
  const kind = { cut: CUT, graded: GRADED, steps: STEPS }[s.crossing];
  const len = s.crossing === "graded" ? 2 : 1;
  const lay = (
    x: number,
    y: number,
    dx: number,
    dy: number,
    dir: number,
    n: number,
    k: number,
    ok: (i: number) => boolean,
    /** Cut into the high ground from (x, y) rather than fill below it. */
    cut = false,
  ) => {
    const base = tier[at(x, y)];
    const cells: number[] = [];
    for (let j = 0; j < n; j++) {
      const i = at(x + dx * j, y + dy * j);
      if (i < 0 || !ok(i) || tier[i] !== tier[at(x, y)] || rampDir[i]) break;
      cells.push(i);
    }
    const last = cells.length - 1;
    cells.forEach((i, j) => {
      rampDir[i] = dir;
      rampK[i] = cut ? last - j : j;
      rampLen[i] = cells.length;
      rampKind[i] = k;
      if (cut) tier[i] = base - 1;
    });
  };
  // Streets climb where they meet higher street: north first, then east.
  // The grade is cut into the high side, so it never lands in a junction.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = at(x, y);
      if (!isStreet(i) || rampDir[i]) continue;
      const n = at(x, y - 1),
        e = at(x + 1, y);
      const k = mat[i] === DIRT && kind === STEPS ? GRADED : kind;
      // Cut into the high side unless that is a junction; then fill below.
      if (isStreet(n) && tier[n] === tier[i] + 1 && !rampDir[n]) {
        if (!inBand(y - 1, H_ROADS))
          lay(x, y - 1, 0, -1, NORTH, len, k, isStreet, true);
        else if (!inBand(y, H_ROADS)) lay(x, y, 0, 1, NORTH, len, k, isStreet);
      } else if (isStreet(e) && tier[e] === tier[i] + 1 && !rampDir[e]) {
        if (!inBand(x + 1, V_ROADS) || x > TOWN)
          lay(x + 1, y, 1, 0, EAST, len, k, isStreet, true);
        else if (!inBand(x, V_ROADS)) lay(x, y, -1, 0, EAST, len, k, isStreet);
      }
    }
  const buildings: Building[] = [];
  const level = (x: number, y: number, w: number, d: number) => {
    const t = tier[at(x, y)];
    for (let j = y; j <= Math.min(H - 1, y + d); j++)
      for (let k = x; k < x + w; k++)
        if (tier[at(k, j)] !== t || rampDir[at(k, j)]) return -1;
    return t;
  };
  if (s.terrace && s.snap && s.rowsHide)
    for (const [x0, x1] of BLOCKS_X) {
      const row = line[x0];
      if (!REAR_LINES.includes(row)) continue;
      buildings.push({
        x: x0 + 1,
        y: row,
        w: x1 - x0 - 1,
        d: 2,
        tier: tier[at(x0 + 1, row)],
        tone: 3,
      });
    }
  let lots = 0,
    built = 0;
  for (const [x0, x1] of BLOCKS_X)
    for (const [y0, y1] of BLOCKS_Y)
      for (const y of [y0 + 1, y1 - 3]) {
        lots++;
        const w = Math.min(8, x1 - x0 - 1);
        const t = level(x0 + 1, y, w, 2);
        const clash = buildings.some(
          (b) =>
            b.x < x0 + 1 + w &&
            x0 + 1 < b.x + b.w &&
            b.y < y + 4 &&
            y < b.y + b.d + 2,
        );
        if (t < 0 || clash) continue;
        built++;
        buildings.push({ x: x0 + 1, y, w, d: 2, tier: t, tone: (x0 + y) % 3 });
      }
  buildings.sort((a, b) => a.y + a.d - (b.y + b.d));

  let jogs = 0;
  for (let x = 0; x + 1 < W; x++) if (line[x] !== line[x + 1]) jogs++;
  return {
    raw,
    line,
    tier,
    mat,
    rampDir,
    rampK,
    rampLen,
    rampKind,
    style,
    buildings,
    jogs,
    lots,
    built,
  };
}

const EARTH: RGB[] = [
  [98, 71, 53],
  [144, 99, 63],
  [179, 139, 83],
  [208, 171, 107],
];
const TURF_LIP: RGB = [113, 139, 64];
const NEON: RGB = [126, 217, 87],
  MUTED: RGB = [132, 150, 84];
const ROCK: RGB[] = [
  [84, 86, 90],
  [116, 118, 118],
  [148, 150, 146],
  [180, 182, 172],
];
const MASONRY: { stones: RGB[]; mortar: RGB; coping: RGB }[] = [
  {
    stones: [
      [132, 126, 112],
      [150, 144, 128],
      [116, 112, 102],
    ],
    mortar: [84, 80, 72],
    coping: [196, 190, 170],
  },
  {
    stones: [
      [190, 180, 150],
      [204, 194, 164],
      [178, 168, 140],
    ],
    mortar: [140, 130, 106],
    coping: [226, 218, 192],
  },
  {
    stones: [
      [150, 78, 58],
      [166, 90, 66],
      [134, 68, 52],
    ],
    mortar: [104, 58, 46],
    coping: [200, 196, 184],
  },
  {
    stones: [
      [168, 168, 162],
      [172, 172, 166],
      [164, 164, 158],
    ],
    mortar: [132, 132, 128],
    coping: [198, 198, 192],
  },
];

export function render(layout: Layout, s: EdgeSettings): Buffer {
  const PW = W * T,
    PH = H * T;
  const buf = new Buffer(PW, PH + OY);
  const { tier, mat, rampDir, rampK, rampLen, rampKind, style } = layout;
  const cell = (cx: number, cy: number) =>
    Math.max(0, Math.min(H - 1, cy)) * W + Math.max(0, Math.min(W - 1, cx));
  const rim = mix(MUTED, NEON, s.rimSaturation);

  // Unpaved cells beside a step let the contour leave the tile grid, as the
  // engine's wall pass does. Paved and walled cells keep their own tier.
  const organic = new Uint8Array(W * H);
  if (s.wobble > 0)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (mat[i] >= PAVE || rampDir[i] || style[x] === WALL) continue;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const j = cell(x + dx, y + dy);
            if (tier[j] !== tier[i] && !rampDir[j]) organic[i] = 1;
          }
      }
  const hf = new Float32Array(PW * PH);
  // A grass slope is a continuous band below the interpolated contour, not
  // a row of ramp tiles, so a wandering line still gives one smooth bank.
  const slopePx = new Uint8Array(PW * PH);
  const run = s.slopeLength * T;
  for (let py = 0; py < PH; py++)
    for (let px = 0; px < PW; px++) {
      const cx = px >> 4,
        cy = py >> 4,
        i = cy * W + cx;
      let h: number = tier[i];
      if (
        style[cx] === SLOPE &&
        !rampDir[i] &&
        mat[i] === GRASS &&
        tier[i] < 2
      ) {
        const u = (px - 8) / T,
          x0 = Math.max(0, Math.min(W - 1, Math.floor(u))),
          x1 = Math.min(W - 1, x0 + 1);
        const edge =
          (layout.line[x0] + (layout.line[x1] - layout.line[x0]) * (u - x0)) *
          T;
        const f = Math.max(0, Math.min(1, 1 - (py - edge) / run));
        hf[py * PW + px] = f;
        if (f > 0 && f < 1) slopePx[py * PW + px] = 1;
        continue;
      }
      if (rampDir[i]) {
        const frac =
          rampDir[i] === NORTH
            ? 1 - (py - cy * T + 0.5) / T
            : (px - cx * T + 0.5) / T;
        h += (rampLen[i] - 1 - rampK[i] + frac) / rampLen[i];
      } else if (organic[i]) {
        const u = (px - 8) / T,
          v = (py - 8) / T,
          x0 = Math.floor(u),
          y0 = Math.floor(v),
          fx = ease(u - x0),
          fy = ease(v - y0);
        const a = tier[cell(x0, y0)],
          b = tier[cell(x0 + 1, y0)],
          c = tier[cell(x0, y0 + 1)],
          d = tier[cell(x0 + 1, y0 + 1)];
        h = Math.round(
          (a + (b - a) * fx) * (1 - fy) +
            (c + (d - c) * fx) * fy +
            (vnoise(px, py, 7, s.seed + 5) - 0.5) * s.wobble * 0.9,
        );
      }
      hf[py * PW + px] = h;
    }
  const hAt = (px: number, py: number) =>
    hf[
      Math.max(0, Math.min(PH - 1, py)) * PW + Math.max(0, Math.min(PW - 1, px))
    ];

  // Signed distance to the nearest step, per cell: positive above it.
  const relief = new Float32Array(W * H);
  if (s.hillshade > 0)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        let best = 0;
        for (let d = 1; d <= 3 && !best; d++)
          for (let dy = -d; dy <= d && !best; dy++)
            for (let dx = -d; dx <= d; dx++) {
              const t = tier[cell(x + dx, y + dy)] - tier[y * W + x];
              if (t) {
                best = (t < 0 ? 1 : -1) * (1 - (d - 1) / 3);
                break;
              }
            }
        relief[y * W + x] = best;
      }
  const reliefAt = (px: number, py: number) => {
    const u = (px - 8) / T,
      v = (py - 8) / T,
      x0 = Math.floor(u),
      y0 = Math.floor(v),
      fx = u - x0,
      fy = v - y0;
    const a = relief[cell(x0, y0)],
      b = relief[cell(x0 + 1, y0)],
      c = relief[cell(x0, y0 + 1)],
      d = relief[cell(x0 + 1, y0 + 1)];
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
  };

  const ground = (px: number, py: number): RGB => {
    const cx = px >> 4,
      cy = py >> 4,
      m = mat[cy * W + cx],
      n = hash(px, py, 1);
    if (m === GRASS) {
      const tuft = hash(px >> 1, py >> 1, 2) < 0.03;
      return tuft
        ? [58, 86, 58]
        : n < 0.12
          ? [70, 98, 62]
          : n > 0.9
            ? [88, 116, 72]
            : [78, 106, 66];
    }
    if (m === DIRT)
      return n < 0.15
        ? [158, 134, 92]
        : n > 0.88
          ? [190, 166, 120]
          : [176, 150, 104];
    if (m === ROAD)
      return n < 0.03 ? [92, 94, 98] : n > 0.9 ? [40, 42, 46] : [46, 48, 52];
    // Pavers, with a pale kerb against anything that is not street.
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      const j = cell((px + dx) >> 4, (py + dy) >> 4);
      if (mat[j] < PAVE) return [200, 192, 160];
    }
    const course = Math.floor(py / 8),
      jx = px + (course % 2 ? 8 : 0);
    if (py % 8 === 0 || jx % 16 === 0) return [122, 122, 116];
    return mul(
      [158, 158, 150],
      0.94 + hash(Math.floor(jx / 16), course, 3) * 0.12,
    );
  };

  const face = (
    st: number,
    r: number,
    drop: number,
    wx: number,
    wy: number,
  ): RGB => {
    if (st === WALL) {
      const m = MASONRY[s.wallMaterial];
      if (r < 2) return r ? mul(m.coping, 0.9) : m.coping;
      if (r === 2) return mul(m.stones[2], 0.6);
      const ch = [4, 5, 3, 99][s.wallMaterial];
      const course = Math.floor((r - 3) / ch);
      const bw =
        s.wallMaterial === 0
          ? 5 + Math.floor(hash(course, Math.floor(wx / 40), 7) * 4)
          : [7, 10, 6, 32][s.wallMaterial];
      const jx = wx + (course % 2 ? bw >> 1 : 0);
      let c: RGB;
      if (s.wallMaterial !== 3 && (r - 3) % ch === ch - 1) c = m.mortar;
      else if (mod(jx, bw) === 0) c = m.mortar;
      else c = m.stones[Math.floor(hash(Math.floor(jx / bw), course, 8) * 3)];
      if (s.wallMaterial === 3 && r < 10 && hash(wx, 0, 9) < 0.12)
        c = mul(c, 0.88);
      return r >= drop - 1 ? mul(c, 0.72) : c;
    }
    if (st === CRAG) {
      if (r === 0) return ROCK[3];
      if (r < 3 && hash(wx, r, 11) < 0.25) return [70, 98, 62];
      if (vnoise(wx, r * 0.35, 2.5, 77) < 0.22) return ROCK[0];
      const ledge = mod(r + Math.floor(vnoise(wx, 0, 9, 5) * 4), 6);
      let tone =
        2.2 - (r / drop) * 1.6 + (vnoise(wx, wy + r * 3, 5, 13) - 0.5) * 2;
      if (ledge === 0) tone += 1;
      if (ledge === 1) tone -= 1;
      return ROCK[Math.max(0, Math.min(3, Math.round(tone)))];
    }
    if (r === 0) return rim;
    if (r === 1) return TURF_LIP;
    if (r === 2) return mul(EARTH[0], 0.75);
    if (r < 5 && hash(wx, r, 71) < 0.3) return TURF_LIP;
    const period = 5 + Math.floor(hash(Math.floor(wx / 37), 0, 12) * 3);
    const phase = mod(wx, period) / period;
    const lobe = (Math.abs(phase - 0.5) * 2 - 0.35) * 1.6;
    let tone =
      2.6 + Math.sin((r / 4) * Math.PI) * 0.6 - lobe - (r / drop) * 1.5;
    if (r >= drop - 2) tone -= 2;
    return EARTH[Math.max(0, Math.min(3, Math.round(tone)))];
  };

  const rampColour = (px: number, py: number, sy: number, i: number): RGB => {
    const k = rampKind[i];
    if (k === STEPS)
      return [
        [104, 106, 100],
        [196, 196, 184],
        [156, 156, 146],
      ][mod(rampDir[i] === EAST ? px : sy, 3)] as RGB;
    if (k === GRADED) return mul(ground(px, py), sy % 4 === 0 ? 0.82 : 0.9);
    const u = rampDir[i] === NORTH ? px & 15 : py & 15;
    if (u < 2 || u > 13) return u === 0 || u === 15 ? EARTH[0] : EARTH[1];
    return sy % 5 === 0 && hash(px, sy, 19) < 0.6
      ? [132, 100, 66]
      : [150, 116, 78];
  };

  const turfAt = (px: number, py: number) =>
    slopePx[
      Math.max(0, Math.min(PH - 1, py)) * PW + Math.max(0, Math.min(PW - 1, px))
    ] === 1;
  const feet: [number, number, number, number][] = [];
  const edgeStyle = (px: number) => style[px >> 4];
  for (let py = 0; py < PH; py++) {
    for (let px = 0; px < PW; px++) {
      const i = (py >> 4) * W + (px >> 4);
      const h = hf[py * PW + px],
        sy = OY + py - Math.round(h * R);
      const hS = py + 1 < PH ? hf[(py + 1) * PW + px] : h;
      const next = OY + py + 1 - Math.round(hS * R);
      const gap = next - sy - 1;
      if (rampDir[i] === NORTH) {
        for (let y = sy; y < Math.max(sy + 1, next); y++)
          buf.set(px, y, rampColour(px, py, y, i));
        continue;
      }
      if (slopePx[py * PW + px]) {
        // Lit crest, then darker toward the foot.
        for (let y = sy; y < Math.max(sy + 1, next); y++) {
          const dash = y % 4 === 0 && hash(px >> 1, y, 17) < 0.4;
          buf.set(
            px,
            y,
            h > 0.93
              ? rim
              : mul(ground(px, py), (dash ? 0.72 : 0.8) + 0.14 * h),
          );
        }
        continue;
      }
      let c = rampDir[i] ? rampColour(px, py, sy, i) : ground(px, py);
      if (s.hillshade > 0)
        c = mul(c, 1 + reliefAt(px, py) * 0.16 * s.hillshade);
      const st = edgeStyle(px);
      const low = (n: number) => (h - n) * R >= 2;
      const edged =
        !rampDir[i] &&
        (low(hS) ||
          (low(hAt(px - 1, py)) && !turfAt(px - 1, py)) ||
          (low(hAt(px + 1, py)) && !turfAt(px + 1, py)) ||
          low(hAt(px, py - 1)));
      if (edged)
        c =
          st === WALL
            ? MASONRY[s.wallMaterial].coping
            : st === CRAG
              ? ROCK[3]
              : mat[i] >= PAVE
                ? [198, 194, 178]
                : rim;
      else if (
        !s.sideFace &&
        !rampDir[i] &&
        (low(hAt(px - 2, py)) || low(hAt(px + 2, py)))
      )
        c = mul(c, 0.84);
      buf.set(px, sy, c);
      if (gap <= 0) continue;
      for (let r = 0; r < gap; r++)
        buf.set(px, sy + 1 + r, face(st, r, gap, px, py));
      if (st === WALL && s.parapet && gap >= R - 1) {
        const m = MASONRY[s.wallMaterial];
        buf.set(px, sy - 3, m.coping);
        buf.set(px, sy - 2, mul(m.coping, 0.9));
        buf.set(px, sy - 1, px % 8 === 0 ? m.mortar : m.stones[0]);
        buf.set(px, sy, mul(m.stones[2], 0.7));
      }
      feet.push([px, next, st, gap]);
    }
    if (!s.sideFace) continue;
    // Side returns: a sliver of the same face along east and west drops, so
    // they read as one object with the south wall.
    for (let px = 0; px < PW; px++) {
      const i = (py >> 4) * W + (px >> 4);
      if (rampDir[i] === NORTH || slopePx[py * PW + px]) continue;
      const h = hf[py * PW + px],
        sy = OY + py - Math.round(h * R),
        st = edgeStyle(px);
      for (const side of [-1, 1]) {
        const n = hAt(px + side, py);
        const drop = Math.round((h - n) * R);
        if (drop < 3 || px + side < 0 || px + side >= PW) continue;
        if (turfAt(px + side, py)) continue;
        for (let k = 1; k <= s.sideFace; k++) {
          const r = Math.round(((k - 1) / s.sideFace) * (R - 1));
          const c = mul(face(st, r, R, sy, px), side < 0 ? 0.86 : 0.68);
          for (let y = sy; y <= sy + drop; y++) buf.set(px + side * k, y, c);
        }
      }
    }
  }

  for (const [px, y, st, gap] of feet) {
    const paved = mat[cell(px >> 4, (y - OY) >> 4)] >= PAVE;
    if (s.foot) {
      if (st === CRAG) {
        for (let k = 0; k < 4; k++)
          if (hash(px >> 1, y + k, 23) < 0.5 - k * 0.12)
            buf.set(px, y + k, ROCK[1 + (hash(px, y + k, 24) < 0.4 ? 1 : 0)]);
      } else if (paved) {
        buf.set(px, y, [70, 70, 68]);
        buf.set(px, y + 1, [170, 168, 158]);
      } else if (hash(px >> 1, y >> 1, 25) < 0.4) {
        buf.set(px, y, [58, 86, 58]);
        if (hash(px, y, 26) < 0.5) buf.set(px, y + 1, [70, 98, 62]);
      }
    }
    const reach = Math.min(s.contactShadow, gap);
    for (let k = 0; k < reach; k++)
      buf.darken(px, y + k, 0.3 * (1 - k / reach));
  }

  const walls: RGB[] = [
    [109, 127, 140],
    [141, 134, 114],
    [63, 108, 128],
    [150, 120, 96],
  ];
  for (const b of layout.buildings) {
    const wallH = 22,
      x0 = b.x * T + 2,
      x1 = (b.x + b.w) * T - 2,
      bottom = OY + (b.y + b.d) * T - b.tier * R + 8,
      top = OY + b.y * T - b.tier * R - wallH + 8,
      wall = walls[b.tone];
    for (let x = x0; x < x1; x++) {
      for (let y = top; y < bottom - wallH; y++) {
        const border =
          x < x0 + 2 || x >= x1 - 2 || y < top + 2 || y >= bottom - wallH - 2;
        buf.set(
          x,
          y,
          border
            ? mul(wall, 0.62)
            : mul([168, 160, 138], 0.95 + hash(x >> 2, y >> 2, 27) * 0.08),
        );
      }
      for (let y = bottom - wallH; y < bottom; y++) {
        const u = mod(x - x0, 26),
          v = y - (bottom - wallH);
        const glass = u >= 9 && u < 16 && v >= 5 && v < 15;
        buf.set(
          x,
          y,
          glass
            ? u === 12 || v === 9
              ? [214, 214, 200]
              : [44, 62, 74]
            : v === 0 || v === wallH - 1
              ? mul(wall, 0.7)
              : wall,
        );
      }
      for (let k = 0; k < 3; k++) buf.darken(x, bottom + k, 0.3 - k * 0.09);
    }
  }

  // A figure for scale, on the low ground by the first crossing.
  const fx = (V_ROADS[0] + 4) * T,
    fy = OY + (H - 3) * T;
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 8; x++) {
      const head = y < 7 && Math.hypot(x - 3.5, y - 3.5) < 3.8;
      const body = y >= 7 && y < 16 && x > 0 && x < 7;
      const legs = y >= 16 && (x === 2 || x === 5);
      if (head) buf.set(fx + x, fy + y, y < 3 ? [40, 30, 26] : [132, 90, 66]);
      else if (body) buf.set(fx + x, fy + y, [222, 210, 170]);
      else if (legs) buf.set(fx + x, fy + y, [92, 70, 56]);
    }
  return buf;
}
