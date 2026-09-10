/** Shared test ground for both terrain approaches: an integer height field with
 * dirt patches on top, so the two renderers can be compared on identical data. */

export type FieldConfig = {
  seed: number;
  width: number;
  height: number;
  levels: number;
  reliefScale: number;
  plateauBias: number;
  dirtCoverage: number;
  dirtScale: number;
};

export type Field = {
  config: FieldConfig;
  level: (x: number, y: number) => number;
  dirt: (x: number, y: number) => boolean;
};

export const TILE = 16;

/** Deterministic per-coordinate hash. Same inputs, same pixel, every reload. */
export function hash(seed: number, x: number, y: number, salt = 0) {
  let h =
    (x | 0) * 374761393 +
    (y | 0) * 668265263 +
    seed * 2246822519 +
    salt * 3266489917;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

function valueNoise(seed: number, x: number, y: number, salt: number) {
  const x0 = Math.floor(x),
    y0 = Math.floor(y),
    fx = smooth(x - x0),
    fy = smooth(y - y0);
  const a = hash(seed, x0, y0, salt),
    b = hash(seed, x0 + 1, y0, salt),
    c = hash(seed, x0, y0 + 1, salt),
    d = hash(seed, x0 + 1, y0 + 1, salt);
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}

export function fractalNoise(
  seed: number,
  x: number,
  y: number,
  scale: number,
  salt = 0,
  octaves = 3,
) {
  let sum = 0,
    amp = 1,
    total = 0,
    freq = 1 / Math.max(1, scale);
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(seed, x * freq, y * freq, salt + i * 17) * amp;
    total += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / total;
}

export function makeField(config: FieldConfig): Field {
  const { seed, width, height, levels, reliefScale, plateauBias } = config;
  const heights = new Int8Array(width * height);
  const dirts = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let t = fractalNoise(seed, x, y, reliefScale, 0, 2);
      // Bias pushes samples toward the middle of each band, so levels read as
      // flat shelves with clean edges rather than a dithered gradient.
      const band = t * levels;
      const frac = band - Math.floor(band);
      const pulled = Math.floor(band) + (frac - 0.5) * (1 - plateauBias) + 0.5;
      t = pulled / levels;
      heights[y * width + x] = Math.max(
        0,
        Math.min(levels - 1, Math.floor(t * levels)),
      );
      const d = fractalNoise(seed, x, y, config.dirtScale, 991, 3);
      dirts[y * width + x] = d < config.dirtCoverage ? 1 : 0;
    }
  }
  const at = (x: number, y: number) =>
    y * width + Math.max(0, Math.min(width - 1, x));
  const clampY = (y: number) => Math.max(0, Math.min(height - 1, y));
  return {
    config,
    level: (x, y) => heights[at(x, clampY(y))],
    dirt: (x, y) => dirts[at(x, clampY(y))] === 1,
  };
}

/** Eight-neighbour blob mask, clockwise from north. A corner bit only counts
 * when both of its edges are also set — the rule the 47-tile sheets assume. */
export const N = 1,
  NE = 2,
  E = 4,
  SE = 8,
  S = 16,
  SW = 32,
  W = 64,
  NW = 128;

export function blobMask(
  same: (x: number, y: number) => boolean,
  x: number,
  y: number,
) {
  let m = 0;
  if (same(x, y - 1)) m |= N;
  if (same(x + 1, y)) m |= E;
  if (same(x, y + 1)) m |= S;
  if (same(x - 1, y)) m |= W;
  if (same(x + 1, y - 1) && m & N && m & E) m |= NE;
  if (same(x + 1, y + 1) && m & S && m & E) m |= SE;
  if (same(x - 1, y + 1) && m & S && m & W) m |= SW;
  if (same(x - 1, y - 1) && m & N && m & W) m |= NW;
  return m;
}
