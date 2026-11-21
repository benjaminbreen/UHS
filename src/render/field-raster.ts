import { crops } from "../content/agriculture/crops";
import type { CropId } from "../content/agriculture/types";
import { paletteKey, type Ecology } from "../content/ecology/profiles";
import { acrossFieldRow, type TopographyCell, type TopographySample } from "../core/topography";
import { defaultGrassArt, type GrassArt } from "../content/graphics/grass-art";
import { benchEdges, benchPixel, enclosurePixel } from "./fences";
import { headlandDepths, innerDistance, troddenPixel } from "./headland";
import { paintFences } from "./fence-pass";
import { standingStyle } from "../content/settlements/boundaries";
import { groundMotif, turfTick } from "./ground-motifs";
import type { GroundTileData } from "./habitat-raster";
import { cellHash as hash, valueNoise as noise } from "../core/noise";
import {
  bladeGlyphs,
  GLYPH_BASE,
  GLYPH_H,
  GLYPH_W,
  rosetteGlyphs,
  rosetteRipeGlyphs,
  sproutGlyphs,
  type CropGlyph,
} from "../content/graphics/crop-glyphs";

const mod = (n: number, d: number) => ((n % d) + d) % d;
type Rgb = number[];
const decode = (s: string): Rgb => [
  parseInt(s.slice(1, 3), 16),
  parseInt(s.slice(3, 5), 16),
  parseInt(s.slice(5, 7), 16),
];
const mix = (a: Rgb, b: Rgb, t: number): Rgb =>
  a.map((v, k) => Math.round(v * (1 - t) + b[k] * t));
const shade = (c: Rgb, v: number): Rgb => c.map((n) => n + v);

// Tilled soil: trough shadow, furrow side, ridge, dry ridge top. Darker and
// warmer than the trodden earth of a road, since it is turned, not packed.
const tilledRamps: Record<Ecology, string[]> = {
  grassland: ["#5a3418", "#7c4c24", "#9c6535", "#b87e48"],
  tundra: ["#4f3520", "#6c4b2d", "#89653f", "#a07c52"],
  "boreal-woodland": ["#503018", "#6e4622", "#8c5d32", "#a57444"],
  "temperate-woodland": ["#583317", "#794a22", "#9a6333", "#b47b45"],
  "tropical-woodland": ["#5c3116", "#7e4820", "#a06030", "#ba7842"],
  wetland: ["#4e331b", "#6c4827", "#896038", "#a1764a"],
  "dry-scrub": ["#633b1b", "#875a2c", "#a8743e", "#c28c52"],
  desert: ["#6a4220", "#8e5e30", "#ad7843", "#c69258"],
  savanna: ["#61391a", "#845a2b", "#a5743d", "#c08d50"],
};
export const tilled = Object.fromEntries(
  Object.entries(tilledRamps).map(([k, v]) => [k, v.map(c => mix(decode(c), decode(v[1]), 0.26))]),
) as Record<Ecology, Rgb[]>;

const paddy = {
  water: [105, 146, 141],
  deep: [69, 112, 108],
  sky: [153, 182, 171],
  mud: [88, 78, 58],
};
const flood = { water: [150, 128, 92], deep: [128, 108, 78], sky: [198, 182, 146], mud: [112, 96, 70] };
const tan = [190, 168, 116];
/** Plants along a ridge, in world pixels. */
const PLANT_PITCH = 10;

export function fieldRidge(f: NonNullable<TopographyCell["field"]>) {
  const pitch = f.garden ? 7 : 10 + Math.floor(hash(f.parcel, 0, 871) * 4);
  const scale = Math.hypot(1, f.rowSlope ?? 0);
  return (wx: number, wy: number) => {
    const along = f.axis === "x" ? wx : wy;
    const across = acrossFieldRow(f, wx, wy) / scale;
    const drift = f.garden ? 0 : Math.floor(noise(along, across, 96, 813) * 3) - 1;
    const shifted = across + drift, p = mod(shifted, pitch);
    return { along, row: Math.floor(shifted / pitch), crest: (p - (pitch >> 1)) * scale, phase: (p + 0.5) / pitch };
  };
}

/** Foliage colour of a crop: its ripe hue pulled toward leaf green, then
 * darkened, so every crop's green stage is its own green. */
function foliage(hue: Rgb): Rgb {
  const leaf = [92, 132, 58];
  return shade(mix(hue, leaf, 0.72), -8);
}

const fallbackCrop = {
  id: "fallow" as CropId,
  kind: "fallow" as const,
  height: "low" as const,
  hue: "#a08c66",
  wet: false,
};
function cropOf(id: CropId) {
  return (crops as Partial<typeof crops>)[id] ?? fallbackCrop;
}

/** Which way a ditch cell runs: along its ditch neighbours, else its axis. */
function ditchAxis(sample: TopographySample, x: number, y: number) {
  const f = sample(x, y)?.field;
  const isDitch = (dx: number, dy: number) =>
    !!sample(x + dx, y + dy)?.field?.ditch;
  const ns = isDitch(0, -1) || isDitch(0, 1);
  const ew = isDitch(-1, 0) || isDitch(1, 0);
  if (ns && !ew) return "y";
  if (ew && !ns) return "x";
  return f?.axis ?? "x";
}

/** Native-pixel farmed ground: furrowed soil, the crop by stage, and the
 * enclosure on the cell's outer pixels. Everything is keyed on world pixel
 * coordinates, so rows and fences run unbroken across chunk seams. */
export function rasterFieldTile(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
  art: GrassArt = defaultGrassArt,
  // The edge pass hands in a borrowed copy; re-sampling found no field there.
  cell: TopographyCell = sample(x, y)!,
  underPixels?: Uint8ClampedArray,
): GroundTileData {
  const f = cell.field!;
  const h = cell.habitat;
  const ecology: Ecology = h?.ecology ?? "grassland";
  const key = paletteKey(ecology, h?.colorway);
  const palette = art.palettes[key];
  const soil = tilled[ecology];
  const headland = { ecology, palette };
  const crop = cropOf(f.crop);
  const hue = decode(crop.hue);
  const leaf = foliage(hue);
  const frozen = cell.surface === "snow";
  const autumn = h?.season === "autumn";
  const pixels = new Uint8ClampedArray(1024);
  const gx = (x + ox) * 16,
    gy = (y + oy) * 16;
  const put = (px: number, py: number, rgb: Rgb) => {
    const i = (py * 16 + px) * 4;
    pixels[i] = rgb[0];
    pixels[i + 1] = rgb[1];
    pixels[i + 2] = rgb[2];
    pixels[i + 3] = 255;
  };
  const kind = crop.kind;
  // Fallow is clean tilled soil: the bare stage with regular furrows.
  const stage = kind === "fallow" ? "bare" : f.stage;
  const wet = f.wet && !f.ditch;
  const axis = f.ditch ? ditchAxis(sample, x, y) : f.axis;
  const banks = f.rowSlope === undefined ? f.edges : (f.riser ?? 0) | (f.footway ?? 0) | (f.margin ?? 0);

  // Rows run along the axis, phased on world pixels so strips in one
  // furlong share rows. The pitch is the parcel's own, so neighbouring
  // fields differ, and a parcel has its own grain: how speckled the soil
  // is and how lumpy the ridge.
  const ridge = fieldRidge(f);
  const grain = 0.05 + hash(f.parcel, 1, 871) * 0.09;
  const lumpy = 0.15 + hash(f.parcel, 2, 871) * 0.25;
  const furrow = (wx: number, wy: number) => {
    const { along, row, crest, phase } = ridge(wx, wy);
    // Height across the ridge, 0 in the trough and 1 on the crest, as a
    // rounded profile rather than flat steps; lumps along the row and a
    // per-pixel dither break the contour lines up.
    const round = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);
    const lump = (noise(along, row * 7, 5, 883) - 0.5) * lumpy;
    const dither = (hash(wx, wy, 887) - 0.5) * 0.28;
    const t = Math.min(1, Math.max(0, round + lump + dither));
    return { t, along, row, dc: crest };
  };
  // Soil tone for a ridge height: trough shadow to dry crest, with flecks
  // of lighter crumb on the crest and darker clods in the trough.
  const soilAt = (t: number, wx: number, wy: number, wash: number) => {
    const fleck = hash(wx, wy, 889);
    if (t > 0.6 && fleck < grain) return shade(soil[3], 12 + wash);
    if (t < 0.35 && fleck < grain * 0.7) return shade(soil[0], -10 + wash);
    // Troughs are wider than the crest: turned soil falls into the furrow.
    const i = t < 0.35 ? 0 : t < 0.55 ? 1 : t < 0.8 ? 2 : 3;
    return shade(soil[i], wash);
  };

  const low = crop.height === "low";
  // Which glyph set, if any, stands on the ridges at this stage.
  const glyphs: CropGlyph[] | undefined =
    kind === "fallow"
      ? undefined
      : stage === "sown"
        ? sproutGlyphs
        : stage === "green"
          ? low
            ? rosetteGlyphs
            : bladeGlyphs
          : stage === "ripe" && low
            ? rosetteRipeGlyphs
            : undefined;
  // Value at a pixel of the glyph on this row, or 0. Plants sit one per
  // PLANT_PITCH along the row, jittered a pixel, so they read as sown by
  // hand rather than stamped.
  const plant = (along: number, row: number, dc: number): number => {
    if (!glyphs) return 0;
    const k = Math.floor(along / PLANT_PITCH);
    const seed = hash(k, row, 857);
    // Sprouts are sparse; blades under standing sprites thinner than the
    // rosettes of a low crop, which are all it gets.
    const keep = stage === "sown" ? 0.3 : glyphs === bladeGlyphs ? 0.55 : 0.94;
    if (seed > keep) return 0;
    const g = glyphs[Math.floor(hash(k, row, 859) * glyphs.length)];
    const j = Math.floor(hash(k, row, 861) * 3) - 1;
    const da = along - (k * PLANT_PITCH + 4 + j);
    // Screen-vertical is across the row when rows run east-west.
    const cross = Math.round(dc + (f.rowSlope ?? 0) * da);
    const u = axis === "x" ? da : cross;
    const v = axis === "x" ? cross : da;
    const gx = u + (GLYPH_W >> 1);
    const gy = v + GLYPH_BASE;
    if (gx < 0 || gx >= GLYPH_W || gy < 0 || gy >= GLYPH_H) return 0;
    return +g[gy][gx];
  };
  const leafRamp: Rgb[] = [shade(leaf, -26), leaf, shade(leaf, 16), hue];

  for (let py = 0; py < 16; py++)
    for (let px = 0; px < 16; px++) {
      const wx = gx + px,
        wy = gy + py;
      const wash = Math.round((noise(wx, wy, 24, 469) - 0.5) * 6);
      let rgb: Rgb;
      if (f.ditch) {
        // A channel down the middle of the cell: soil banks, a wet lip,
        // then still dark water.
        const across = mod(axis === "x" ? wy : wx, 16);
        const along = axis === "x" ? wx : wy;
        const d = Math.abs(across - 7.5);
        if (d < 4) {
          const glint =
            mod(along, 8) < 2 &&
            hash(Math.floor(along / 8), Math.floor(across), 821) > 0.8;
          rgb = d < 2 ? (glint ? paddy.sky : paddy.deep) : paddy.water;
        } else if (d < 5) rgb = shade(paddy.mud, wash);
        else rgb = shade(soil[2], wash);
      } else if (kind === "pasture") {
        // Even turf with a few broad grazed patches.
        const grazed = noise(wx, wy, 20, 823) > 0.68;
        const base =
          stage === "ripe"
            ? mix(palette[0], tan, 0.14)
            : stage === "bare"
              ? mix(palette[0], soil[3], 0.18)
              : palette[0];
        rgb = grazed ? mix(base, palette[1], 0.6) : base;
        if (turfTick(wx, wy, art.motifs)) rgb = shade(rgb, grazed ? 4 : 8);
        const ink = groundMotif("turf", wx, wy, art.motifs);
        if (ink && !grazed)
          rgb = [
            shade(palette[5], -6),
            palette[5],
            mix(palette[0], palette[6], 0.5),
          ][ink - 1];
      } else {
        const { t, along, row, dc } = furrow(wx, wy);
        const trough = t < 0.3;
        const top = t >= 0.85;
        const ink = plant(along, row, dc);
        if (wet) {
          const pool = f.flood ? flood : paddy;
          const bank = Math.min(banks & 1 ? py : 32, banks & 8 ? px : 32);
          const reflection = noise(wx * 0.55, wy * 1.45, 35, 833);
          rgb = bank < 2 ? pool.deep : reflection < 0.36 ? mix(pool.water, pool.deep, 0.32)
            : reflection > 0.64 ? mix(pool.water, pool.sky, 0.42) : pool.water;
          const ripple = mod(wy + Math.floor(noise(wx, wy, 48, 831) * 3), 11) === 0 &&
            hash(Math.floor(wx / 6), wy, 835) > 0.85;
          rgb = ripple ? mix(rgb, pool.sky, 0.7) : shade(rgb, wash);
          if (!f.flood && stage !== "bare") {
            const tuft = mod(along + (row & 1) * 5, PLANT_PITCH);
            if (stage === "ripe") {
              rgb = mix(rgb, soil[2], 0.45);
              if (t > 0.68 && tuft < 7) rgb = shade(hue, tuft < 2 ? 5 : -22);
            } else if (stage === "green" && top && tuft < 6) rgb = leaf;
            else if (stage === "stubble" && top && tuft < 3) rgb = tan;
            if (ink) rgb = leafRamp[ink - 1];
          }
        } else {
          rgb = soilAt(t, wx, wy, wash);
          if (stage === "sown") {
            // Watered: the whole bed darker, the troughs darkest, in damp
            // patches rather than an even stain.
            const damp = 0.3 + noise(wx, wy, 18, 877) * 0.3;
            rgb = mix(rgb, soil[0], trough ? damp + 0.2 : damp);
          } else if (stage === "stubble") {
            // Pale straw over the ridges, soil in the troughs, and short
            // cut stalks every third pixel along the row.
            const straw = mix(tan, soil[2], 0.3);
            if (trough) rgb = shade(soil[0], wash + 6);
            else rgb = shade(straw, wash + (top ? 8 : -6));
            if (top && mod(along, 3) === 0) rgb = shade(soil[1], -6);
          }
          if (ink) rgb = leafRamp[ink - 1];
        }
      }
      if (f.fence && !f.ditch && !f.yard) {
        const { inner: m } = headlandDepths(wx, wy);
        const inner = innerDistance(f.fence, px, py, m);
        const d = inner - m;
        if (d < 3) {
          const earth = troddenPixel(wx, wy, 0, headland);
          rgb = d < -2 ? earth : mix(earth, rgb, (d + 2) / 5);
          if (d > 0 && d < 1.2 && hash(Math.floor(wx / 5), Math.floor(wy / 5), 923) > 0.32)
            rgb = shade(rgb, -8);
        }
      }
      if (autumn && !wet && kind !== "pasture")
        rgb = mix(rgb, palette[1], 0.08);
      if (frozen)
        rgb = wet
          ? mix(rgb, [196, 208, 210], 0.55)
          : mix(rgb, [206, 212, 204], 0.6);
      put(px, py, rgb);
    }

  // Thin parcel lines inside an enclosure. The enclosure itself stands
  // outside the headland and is drawn by the ground pass round the field.
  if (f.edges & ~f.fence && f.rowSlope === undefined && !f.ditch && f.boundary !== "none") {
    const enclosure = {
      fence: 0,
      edges: f.edges & ~f.fence,
      boundary: f.boundary,
      wet,
      gx,
      gy,
      palette,
      soil,
      motifs: art.motifs,
    };
    for (let py = 0; py < 16; py++)
      for (let px = 0; px < 16; px++) {
        const i = (py * 16 + px) * 4;
        const ground = [pixels[i], pixels[i + 1], pixels[i + 2]];
        let rgb = enclosurePixel(enclosure, px, py, ground);
        if (!rgb) continue;
        if (frozen) rgb = mix(rgb, [206, 212, 204], 0.5);
        put(px, py, rgb);
      }
  }
  const edges = f.rowSlope !== undefined || f.riser ? benchEdges(sample, x, y) : [];
  if (edges.length)
    for (let py = 0; py < 16; py++)
      for (let px = 0; px < 16; px++) {
        const i = (py * 16 + px) * 4;
        const ground = [pixels[i], pixels[i + 1], pixels[i + 2]];
        let rgb = benchPixel(edges, px, py, gx + px, gy + py, palette, soil, ground);
        if (!rgb) continue;
        if (frozen) rgb = mix(rgb, [206, 212, 204], 0.5);
        put(px, py, rgb);
      }
  if (f.garden && !f.ditch && kind !== "pasture")
    paintGardenBed(sample, x, y, gx, gy, f.bed ?? "earth", soil, palette[0], frozen, pixels, underPixels, put);
  if (!frozen)
    paintFences(sample, x, y, ox, oy, put, (px, py, v) => {
      const i = (py * 16 + px) * 4;
      for (let k = 0; k < 3; k++) pixels[i + k] = Math.max(0, pixels[i + k] - v);
    });
  return { x, y, pixels };
}

const BED_RAMPS = {
  timber: ["#3f2b1c", "#66462b", "#8c633e", "#b28558", "#caa072"].map(decode),
  brick: ["#4a2820", "#7e3e2c", "#a8553c", "#c67254", "#baa992"].map(decode),
  stone: ["#4f4b44", "#7e796e", "#a59f92", "#c4beb0", "#dad4c6"].map(decode),
  bamboo: ["#322c16", "#645b2c", "#8c8140", "#b2a65a", "#cec278"].map(decode),
};

/** Continuous 4-neighbour raised edging around a kitchen garden bed. */
function paintGardenBed(
  sample: TopographySample,
  x: number,
  y: number,
  gx: number,
  gy: number,
  style: NonNullable<NonNullable<TopographyCell["field"]>["bed"]>,
  soil: Rgb[],
  fallbackGround: Rgb,
  frozen: boolean,
  pixels: Uint8ClampedArray,
  underPixels: Uint8ClampedArray | undefined,
  put: (px: number, py: number, rgb: Rgb) => void,
) {
  const same = (dx: number, dy: number) => !!sample(x + dx, y + dy)?.field?.garden;
  const n = !same(0, -1), s = !same(0, 1), w = !same(-1, 0), e = !same(1, 0);
  if (!n && !s && !w && !e) return;
  const groundAt = (px: number, py: number): Rgb => {
    if (!underPixels) return fallbackGround;
    const i = (py * 16 + px) * 4;
    return [underPixels[i], underPixels[i + 1], underPixels[i + 2]];
  };
  const soilAtPx = (px: number, py: number): Rgb => {
    const i = (py * 16 + px) * 4;
    return [pixels[i], pixels[i + 1], pixels[i + 2]];
  };
  const paint = (px: number, py: number, rgb: Rgb) =>
    put(px, py, frozen ? mix(rgb, [206, 212, 204], 0.5) : rgb);

  if (style === "earth") {
    for (let py = 0; py < 16; py++)
      for (let px = 0; px < 16; px++) {
        const dx = Math.min(w ? px + 0.5 : 99, e ? 15.5 - px : 99);
        const dy = Math.min(n ? py + 0.5 : 99, s ? 15.5 - py : 99);
        const corner = Math.hypot(Math.max(0, 4.2 - dx), Math.max(0, 4.2 - dy));
        const d = 4.2 - corner + (noise(gx + px, gy + py, 10, 937) - 0.5) * 1.1;
        if (d < 1.2) {
          put(px, py, groundAt(px, py));
        } else if (d < 2.2) {
          const litSide = (n && py < 4) || (w && px < 4);
          paint(px, py, litSide ? mix(groundAt(px, py), soil[2], 0.65) : mix(groundAt(px, py), soil[0], 0.72));
        } else if (d < 3.4) {
          const litSide = (n && py < 5) || (w && px < 5);
          paint(px, py, litSide ? soil[3] : soil[1]);
        }
      }
    return;
  }

  const r = BED_RAMPS[style];
  const minX = w ? 1 : 0, maxX = e ? 14 : 15;
  const minY = n ? 1 : 0, maxY = s ? 14 : 15;
  for (let py = 0; py < 16; py++)
    for (let px = 0; px < 16; px++) {
      const wx = gx + px, wy = gy + py;
      const outN = n && py < minY, outS = s && py > maxY, outW = w && px < minX, outE = e && px > maxX;
      if (outN || outS || outW || outE) {
        const g = groundAt(px, py);
        if (outS && px >= minX && px <= maxX) put(px, py, mix(g, [24, 20, 16], 0.34));
        else if (outE && py >= minY && py <= maxY + 1) put(px, py, mix(g, [24, 20, 16], 0.18));
        else put(px, py, g);
        continue;
      }
      // Round outer corners softly on stone/bamboo beds.
      const outerCorner =
        (n && w && px === 1 && py === 1) ||
        (n && e && px === 14 && py === 1) ||
        (s && w && px === 1 && py === 14) ||
        (s && e && px === 14 && py === 14);
      if (outerCorner && (style === "stone" || style === "bamboo")) {
        put(px, py, s ? mix(groundAt(px, py), [24, 20, 16], 0.25) : groundAt(px, py));
        continue;
      }
      const onN = n && py <= 2;
      const onS = s && py >= 12;
      const onW = w && px <= 2;
      const onE = e && px >= 13;
      if (!onN && !onS && !onW && !onE) {
        // Subtle 1px inner soil shadow directly under north/west raised boards.
        if ((n && py === 3) || (w && px === 3))
          put(px, py, shade(soilAtPx(px, py), -16));
        continue;
      }
      const isCornerPost =
        (n && w && px <= 2 && py <= 2) ||
        (n && e && px >= 13 && py <= 2) ||
        (s && w && px <= 2 && py >= 12) ||
        (s && e && px >= 13 && py >= 12);
      if (style === "timber") {
        if (isCornerPost) {
          const cap = (px === 1 || px === 13) && (py === 1 || py === 12);
          paint(px, py, py === 14 || px === 14 ? r[0] : cap ? r[4] : r[1]);
        } else if (onS) {
          const seam = mod(wx, 11) === 0;
          paint(px, py, py === 14 ? r[0] : py === 12 ? (seam ? r[2] : r[4]) : seam ? r[1] : r[2]);
        } else if (onN) {
          const grain = hash(wx, wy, 941) > 0.65;
          paint(px, py, py === 1 ? (grain ? r[4] : r[3]) : r[1]);
        } else if (onW) {
          paint(px, py, px === 1 ? r[3] : r[1]);
        } else {
          paint(px, py, px === 14 ? r[0] : r[3]);
        }
      } else if (style === "brick") {
        const along = onN || onS ? wx : wy;
        const mortar = mod(along, 4) === 0;
        const v = hash(Math.floor(wx / 4), Math.floor(wy / 4), 947) > 0.5;
        if (onS) paint(px, py, py === 14 ? r[0] : py === 12 ? (mortar ? r[4] : r[3]) : mortar ? r[1] : v ? r[2] : r[1]);
        else if (onN) paint(px, py, py === 1 ? (mortar ? r[4] : r[3]) : mortar ? r[0] : r[2]);
        else if (onW) paint(px, py, px === 1 ? (mortar ? r[4] : r[3]) : r[1]);
        else paint(px, py, px === 14 ? r[0] : mortar ? r[4] : r[2]);
      } else if (style === "stone") {
        const along = onN || onS ? wx : wy;
        const cell = Math.floor(along / 4);
        const gap = mod(along, 4) === 0 && hash(cell, wy, 953) > 0.2;
        const tone = hash(cell, Math.floor((onN || onS ? wy : wx) / 3), 957);
        const body = tone > 0.65 ? r[4] : tone > 0.3 ? r[3] : r[2];
        if (onS) paint(px, py, py === 14 ? r[0] : gap ? r[1] : py === 12 ? body : r[2]);
        else if (onN) paint(px, py, gap ? r[1] : py === 1 ? body : r[2]);
        else if (onW) paint(px, py, gap ? r[1] : px === 1 ? body : r[2]);
        else paint(px, py, px === 14 ? r[0] : gap ? r[1] : body);
      } else {
        // Woven split-bamboo edging with internode joints and dark corner ties.
        const along = onN || onS ? wx : wy;
        const node = mod(along, 5) === 0;
        if (isCornerPost) paint(px, py, py === 14 || px === 14 ? r[0] : r[1]);
        else if (onS) paint(px, py, py === 14 ? r[0] : node ? r[1] : py === 12 ? r[4] : r[2]);
        else if (onN) paint(px, py, node ? r[1] : py === 1 ? r[4] : r[2]);
        else if (onW) paint(px, py, node ? r[1] : px === 1 ? r[3] : r[2]);
        else paint(px, py, px === 14 ? r[0] : node ? r[1] : r[3]);
      }
    }
}

/** A field cell whose enclosure stands up out of the ground, so neighbouring
 * material edges should stop at it rather than wear into it. */
export function raisedFieldEdge(c?: TopographyCell) {
  return (
    !!c?.field &&
    !!c.field.fence &&
    (c.field.boundary === "baulk" ||
      !!standingStyle(c.field.enclosure ?? c.field.boundary))
  );
}
