import { Buffer, ramp } from "./buffer";
import { TILE, fractalNoise, hash, type Field } from "./field";
import { palettes, rgb } from "./palette";
import type { Settings } from "./settings";

export function layoutFor(field: Field, rise: number) {
  const { width, height, levels } = field.config;
  const headroom = (levels - 1) * rise;
  return {
    width: width * TILE,
    height: height * TILE + headroom + rise,
    headroom,
  };
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Ground cover as a continuous field rather than a per-tile mask: the dirt
 * boundary is decided per pixel, so it wanders across tile seams. */
function dirtness(s: Settings, px: number, py: number) {
  const { seed, dirtScale } = s.field;
  const base = fractalNoise(seed, px / TILE, py / TILE, dirtScale, 991, 3);
  const wobble =
    (fractalNoise(seed, px / 3, py / 3, 1.6, 4211, 2) - 0.5) *
    0.14 *
    s.edgeScallop;
  return base + wobble;
}

/** Both fields are sampled once per pixel up front. Everything downstream —
 * edge distance, rims, where a bank starts — is a lookup into these grids. */
class Ground {
  readonly dirtBits: Uint8Array;
  readonly levels: Int8Array;
  constructor(
    readonly width: number,
    readonly height: number,
    field: Field,
    s: Settings,
  ) {
    this.dirtBits = new Uint8Array(width * height);
    this.levels = new Int8Array(width * height);
    const max = field.config.levels - 1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        this.dirtBits[i] = dirtness(s, x, y) < s.field.dirtCoverage ? 1 : 0;
        this.levels[i] = Math.max(
          0,
          Math.min(max, this.sample(field, s, x, y)),
        );
      }
    }
    if (s.contourSmoothing) this.despeckle(s.contourSmoothing, max);
  }
  /** Wobble on its own throws off single-pixel islands that read as artefacts.
   * A modal filter keeps the curve and drops anything smaller than the brush. */
  private despeckle(radius: number, max: number) {
    const src = this.levels.slice();
    const counts = new Int32Array(max + 1);
    for (let y = 0; y < this.height; y++)
      for (let x = 0; x < this.width; x++) {
        counts.fill(0);
        for (let dy = -radius; dy <= radius; dy++)
          for (let dx = -radius; dx <= radius; dx++) {
            const sy = Math.max(0, Math.min(this.height - 1, y + dy));
            const sx = Math.max(0, Math.min(this.width - 1, x + dx));
            counts[src[sy * this.width + sx]]++;
          }
        let best = 0;
        for (let l = 1; l <= max; l++) if (counts[l] > counts[best]) best = l;
        this.levels[y * this.width + x] = best;
      }
  }
  /** Height between cell centres, so a contour crosses a tile diagonally
   * instead of snapping to its edges. Cell centres keep their exact level,
   * which is what the walkable grid will still be built from. */
  private sample(field: Field, s: Settings, px: number, py: number) {
    const u = (px - TILE / 2) / TILE,
      v = (py - TILE / 2) / TILE;
    const x0 = Math.floor(u),
      y0 = Math.floor(v),
      fx = smooth(u - x0),
      fy = smooth(v - y0);
    const a = field.level(x0, y0),
      b = field.level(x0 + 1, y0),
      c = field.level(x0, y0 + 1),
      d = field.level(x0 + 1, y0 + 1);
    const h = (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
    const wobble =
      (fractalNoise(s.field.seed, px, py, s.contourScale, 1717, 2) - 0.5) *
      s.contourWobble;
    return Math.round(h + wobble);
  }
  private clampX = (x: number) =>
    x < 0 ? 0 : x >= this.width ? this.width - 1 : x;
  private clampY = (y: number) =>
    y < 0 ? 0 : y >= this.height ? this.height - 1 : y;
  dirt(x: number, y: number) {
    return this.dirtBits[this.clampY(y) * this.width + this.clampX(x)] === 1;
  }
  level(x: number, y: number) {
    return this.levels[this.clampY(y) * this.width + this.clampX(x)];
  }
  /** Level below the bottom row is ground zero, so the map ends on a bank. */
  levelBelow(x: number, y: number) {
    return y + 1 >= this.height ? 0 : this.level(x, y + 1);
  }
  /** Distance in pixels to the nearest cover change, capped at `max`. */
  edge(x: number, y: number, max: number) {
    const here = this.dirt(x, y);
    for (let r = 1; r <= max; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (this.dirt(x + dx, y + dy) !== here) return r;
        }
    return max + 1;
  }
}

/** Blade marks are stamped as whole glyphs on a two-pixel lattice. Shading a
 * single pixel at a time is what makes procedural grass read as television
 * static instead of drawn turf. */
const BLADES = [
  ["#.#", ".#."],
  [".#.", "#.#"],
  ["##.", ".#."],
  [".##", ".#."],
];
const TICKS = [["#."], [".#"], ["##"]];

function stamp(
  buf: Buffer,
  glyph: string[],
  x: number,
  y: number,
  colour: [number, number, number],
) {
  for (let r = 0; r < glyph.length; r++)
    for (let c = 0; c < glyph[r].length; c++)
      if (glyph[r][c] === "#") buf.set(x + c, y + r, colour);
}

/** A GRASS+ swatch as normalised luma, 0 (deepest) to 1 (brightest). Keeping
 * it continuous is what lets the overlay be dialled down to a whisper. */
export type Swatch = { tiles: number[][][]; count: number };

export function prepareSwatches(turf: ImageData): Swatch {
  const cols = turf.width / TILE,
    rows = turf.height / TILE;
  const tiles: number[][][] = [];
  for (let t = 0; t < cols * rows; t++) {
    const ox = (t % cols) * TILE,
      oy = Math.floor(t / cols) * TILE;
    // Each swatch uses its own tonal range, so normalise against that range
    // rather than absolute luma or the flatter ones vanish entirely.
    let lo = 1,
      hi = 0;
    const luma: number[][] = [];
    for (let y = 0; y < TILE; y++) {
      luma[y] = [];
      for (let x = 0; x < TILE; x++) {
        const i = ((oy + y) * turf.width + ox + x) * 4;
        const l =
          (turf.data[i] * 0.3 +
            turf.data[i + 1] * 0.59 +
            turf.data[i + 2] * 0.11) /
          255;
        luma[y][x] = l;
        if (l < lo) lo = l;
        if (l > hi) hi = l;
      }
    }
    const span = Math.max(0.001, hi - lo);
    tiles.push(luma.map((row) => row.map((l) => (l - lo) / span)));
  }
  return { tiles, count: tiles.length };
}

/** Ordered dither. A hash would stipple flat ground with noise; a Bayer screen
 * lets a fractional swatch strength read as a texture instead of grain. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const bayer = (x: number, y: number) => (BAYER[y & 3][x & 3] + 0.5) / 16;

/** Brightness, saturation and contrast are folded into the ramp once, so the
 * render still only ever writes palette colours. */
function adjustRamp(
  colours: [number, number, number][],
  s: Settings,
): [number, number, number][] {
  return colours.map(([r, g, b]) => {
    const l = r * 0.3 + g * 0.59 + b * 0.11;
    const out = [r, g, b].map((c) => {
      let v = l + (c - l) * s.turfSaturation;
      v = 128 + (v - 128) * s.turfContrast;
      return Math.max(0, Math.min(255, v * s.turfBrightness));
    });
    return out as [number, number, number];
  });
}

export function renderProcedural(field: Field, s: Settings, swatch?: Swatch) {
  const p = palettes[s.palette];
  const grass = adjustRamp(ramp(p.grass), s),
    dirt = ramp(p.dirt),
    outline = rgb(p.outline),
    lip = adjustRamp([rgb(p.lip)], s)[0];
  const { width, height } = field.config;
  const size = layoutFor(field, s.rise);
  const buf = new Buffer(size.width, size.height);
  const W = width * TILE,
    H = height * TILE;
  const g = new Ground(W, H, field, s);
  const seed = s.field.seed;
  const screenY = (px: number, py: number) =>
    size.headroom + py - g.level(px, py) * s.rise;

  // Broad soft tone patches: two or three steps of the ramp across a whole
  // meadow, which is what the reference art actually does.
  const tone = (px: number, py: number, steps: number) => {
    const soft = fractalNoise(seed, px, py, s.turfScale * 3, 31, s.turfOctaves);
    const clump = fractalNoise(seed, px, py, s.turfScale * 9, 77, 2);
    const v =
      0.5 + (soft - 0.5) * s.turfVariation + (clump - 0.5) * s.clumpiness;
    return Math.max(0, Math.min(steps - 1, Math.round(v * (steps - 1))));
  };

  /** Which swatch, if any, dresses ground at this altitude. */
  const swatchFor = (px: number, py: number, level: number) => {
    if (!swatch || !swatch.count) return -1;
    if (s.turfPerLevel) return s.turfLevelSwatch[level] ?? -1;
    if (s.turfSwatchVariant >= 0) return s.turfSwatchVariant;
    // A single repeating swatch tiles visibly; drifting the pick over a slow
    // noise field breaks the repeat without breaking the weave. The pick is
    // dithered between neighbours, or the drift shows up as soap-bubble
    // outlines where one swatch gives way to the next.
    const f = fractalNoise(seed, px, py, 40, 313, 1) * swatch.count;
    const base = Math.floor(f);
    return (
      (hash(seed, px, py, 919) < f - base ? base + 1 : base) % swatch.count
    );
  };

  /** Ramp index for a patch of turf: the broad tone, then the swatch pushed
   * over it at whatever strength the overlay is set to. */
  const grassIndex = (px: number, py: number, level: number) => {
    let idx = 1 + tone(px, py, 3);
    const pick = swatchFor(px, py, level);
    if (pick >= 0 && s.turfSwatchOpacity > 0) {
      const l = swatch!.tiles[pick % swatch!.count][py % TILE][px % TILE];
      const d = (l - 0.5) * 3 * s.turfSwatchOpacity;
      const whole = Math.trunc(d);
      idx += whole;
      if (bayer(px, py) < Math.abs(d - whole)) idx += Math.sign(d);
    }
    return Math.max(0, Math.min(grass.length - 1, idx));
  };

  const surfaceRow = (py: number) => {
    for (let px = 0; px < W; px++) {
      const level = g.level(px, py);
      const sy = size.headroom + py - level * s.rise;
      const onDirt = g.dirt(px, py);
      const near = g.edge(px, py, Math.max(2, s.edgeRim + 1));
      if (onDirt) {
        buf.set(px, sy, dirt[1 + tone(px, py, 3)]);
        if (near <= 1) buf.set(px, sy, dirt[0]);
      } else {
        buf.set(px, sy, grass[grassIndex(px, py, level)]);
        if (near <= s.edgeRim) buf.set(px, sy, grass[3]);
      }
      // Rims close the silhouette of a shelf on the sides and the back, so a
      // contour running diagonally still reads as one raised piece of ground.
      if (s.bankOutline && s.bankSides) {
        const west = g.level(px - 1, py) < level,
          east = g.level(px + 1, py) < level;
        if (west || east) buf.set(px, sy, outline);
        else if (
          g.level(px - s.bankSides, py) < level ||
          g.level(px + s.bankSides, py) < level
        )
          buf.set(px, sy, dirt[1]);
        if (g.level(px, py - 1) < level) buf.set(px, sy, outline);
      }
      if (g.level(px, py - 1) > level && s.bankShadow) {
        // Depth into the shade of whatever rises immediately behind.
        let d = 0;
        while (d < s.bankShadow && g.level(px, py - d - 1) > level) d++;
        if (d > 0) {
          let run = 0;
          while (run < s.bankShadow && g.level(px, py - run) === level) run++;
          if (run <= s.bankShadow)
            buf.darken(px, sy, 0.42 * (1 - (run - 1) / s.bankShadow));
        }
      }
    }
  };

  /** Bank anatomy, top to bottom: the crease where the plateau ends, a ragged
   * turf overhang, deep shade under it, then lobed earth down to a dark base.
   * The lobes are what stop a tall drop reading as a flat brown rectangle. */
  const faceColumn = (px: number, py: number) => {
    const level = g.level(px, py);
    const below = g.levelBelow(px, py);
    const drop = (level - below) * s.rise;
    if (drop <= 0) return;
    const top = size.headroom + py - level * s.rise + 1;
    const lipRows = s.bankLip
      ? s.bankLip + Math.floor(hash(seed, px, py, 21) * 2.4)
      : 0;
    const lobe = Math.floor(px / 6) * 6;
    const lobePhase = (px - lobe) / 6;
    const lobeShade =
      s.bankLobes * (Math.abs(lobePhase - 0.5) * 2 - 0.35) * 1.6;
    const lobeDrift = hash(seed, lobe, py >> 4, 41) * 2 - 1;
    for (let r = 0; r < drop; r++) {
      const sy = top + r;
      if (r === 0) {
        buf.set(px, sy, outline);
        continue;
      }
      if (r <= lipRows) {
        buf.set(px, sy, r === 1 ? lip : grass[2]);
        continue;
      }
      const depth = (r - lipRows) / Math.max(1, drop - lipRows);
      const band =
        Math.sin(((sy + lobeDrift * 3) / 5) * Math.PI) * s.bankStrata;
      const mottle = (fractalNoise(seed, px / 2, sy / 2, 2, 555, 2) - 0.5) * 2;
      let i = 3 + band + mottle - depth * 1.9 - lobeShade;
      if (r <= lipRows + 2) i -= 2.4; // shade pooled under the overhang
      i = Math.max(0, Math.min(dirt.length - 1, Math.round(i)));
      buf.set(px, sy, dirt[i]);
      if (hash(seed, px, sy, 33) < s.bankRoots)
        buf.set(px, sy, depth < 0.4 ? outline : dirt[0]);
      if (r >= drop - 2) buf.set(px, sy, dirt[0]);
    }
    if (s.bankOutline) {
      const level2 = level;
      if (g.level(px - 1, py) < level2 || g.level(px + 1, py) < level2)
        for (let r = 0; r < drop; r++) buf.darken(px, top + r, 0.35);
    }
  };

  const detailRow = (py: number) => {
    for (let px = 0; px < W; px += 2) {
      const sy = screenY(px, py);
      const r = hash(seed, px, py, 13);
      if (g.dirt(px, py)) {
        if (r < s.edgePebbles) {
          const glyph =
            TICKS[Math.floor(hash(seed, px, py, 14) * TICKS.length)];
          stamp(buf, glyph, px, sy, dirt[0]);
          stamp(buf, glyph, px, sy - 1, dirt[4]);
        } else if (r > 1 - s.edgePebbles * 1.5) {
          stamp(buf, TICKS[2], px, sy, dirt[2]);
        }
        // Grass creeping over the rim keeps the boundary from reading as a
        // cut line, the way a mown edge never does.
        if (g.edge(px, py, 2) <= 1 && hash(seed, px, py, 5) < s.edgeFringe)
          stamp(
            buf,
            BLADES[Math.floor(hash(seed, px, py, 6) * 4)],
            px,
            sy,
            grass[1],
          );
        continue;
      }
      const base = grassIndex(px, py, g.level(px, py));
      const jx = hash(seed, px, py, 17) < 0.5 ? 0 : 1;
      if (r < s.bladeDensity)
        stamp(
          buf,
          BLADES[Math.floor(hash(seed, px, py, 15) * BLADES.length)],
          px + jx,
          sy,
          grass[Math.min(grass.length - 1, base + 2)],
        );
      else if (r > 1 - s.bladeDensity * 0.5)
        stamp(
          buf,
          TICKS[Math.floor(hash(seed, px, py, 16) * TICKS.length)],
          px + jx,
          sy,
          grass[Math.max(0, base - 1)],
        );
    }
  };

  // Runs on the last row of each cell row, after that row's surface and detail
  // passes have been laid down, or the sprites are painted straight over.
  const scatterRow = (py: number) => {
    if (py % TILE !== TILE - 1) return;
    const cy = (py - TILE + 1) / TILE;
    for (let cx = 0; cx < width; cx++) {
      const drift = fractalNoise(seed, cx, cy, 5, 808, 2);
      const bias = 1 + (drift - 0.5) * 2 * s.scatterClumping;
      for (let i = 0; i < 4; i++) {
        const r = hash(seed, cx, cy, 100 + i);
        const x = 2 + Math.floor(hash(seed, cx, cy, 200 + i) * (TILE - 4));
        const y = 3 + Math.floor(hash(seed, cx, cy, 300 + i) * (TILE - 5));
        const px = cx * TILE + x,
          pyy = cy * TILE + y;
        if (g.dirt(px, pyy)) continue;
        const sy = screenY(px, pyy);
        if (r < s.flowerDensity * bias) bloom(buf, px, sy, seed, cx, cy, i);
        else if (r < (s.flowerDensity + s.tuftDensity) * bias)
          tuft(buf, px, sy, grass);
        else if (r < (s.flowerDensity + s.tuftDensity + s.rockDensity) * bias)
          rock(buf, px, sy, outline);
      }
    }
  };

  for (let py = 0; py < H; py++) {
    surfaceRow(py);
    for (let px = 0; px < W; px++) faceColumn(px, py);
    if (py % 2 === 0) detailRow(py);
    scatterRow(py);
  }
  return buf;
}

const FLOWER_COLOURS = ["#f6f3e2", "#f4cf63", "#e8737d", "#cfd9e8"];

/** Two to four blooms in a loose knot: single pixels read as dead sprites. */
function bloom(
  buf: Buffer,
  x: number,
  y: number,
  seed: number,
  cx: number,
  cy: number,
  i: number,
) {
  const c = rgb(
    FLOWER_COLOURS[
      Math.floor(hash(seed, cx, cy, 400 + i) * FLOWER_COLOURS.length)
    ],
  );
  const count = 2 + Math.floor(hash(seed, cx, cy, 500 + i) * 3);
  for (let n = 0; n < count; n++) {
    const ox = Math.round((hash(seed, cx * 7 + n, cy, 600 + i) - 0.5) * 6);
    const oy = Math.round((hash(seed, cx, cy * 7 + n, 700 + i) - 0.5) * 5);
    stamp(buf, ["##", "##"], x + ox, y + oy, c);
    buf.darken(x + ox + 1, y + oy + 1, 0.28);
  }
}

function tuft(
  buf: Buffer,
  x: number,
  y: number,
  grass: [number, number, number][],
) {
  stamp(buf, [".#.", "#.#", ".#."], x - 1, y - 2, grass[4]);
  buf.set(x, y + 1, grass[0]);
}

function rock(
  buf: Buffer,
  x: number,
  y: number,
  outline: [number, number, number],
) {
  const body: [number, number, number] = [122, 128, 142];
  const light: [number, number, number] = [166, 172, 186];
  stamp(buf, [".##.", "####", "####"], x, y - 3, body);
  stamp(buf, [".##."], x, y - 3, light);
  stamp(buf, ["####"], x, y, outline);
}
