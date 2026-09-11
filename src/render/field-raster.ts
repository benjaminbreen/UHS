import { crops } from "../content/agriculture/crops";
import type { CropId } from "../content/agriculture/types";
import { paletteKey, type Ecology } from "../content/ecology/profiles";
import type { TopographyCell, TopographySample } from "../core/topography";
import { defaultGrassArt, type GrassArt } from "../content/graphics/grass-art";
import { enclosurePixel } from "./fences";
import { headlandDepths, innerDistance, troddenPixel } from "./headland";
import { paintFences } from "./fence-pass";
import { groundMotif, turfTick } from "./ground-motifs";
import type { GroundTileData } from "./habitat-raster";
import { waterHash as hash, waterNoise as noise } from "./water-style";
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
};
export const tilled = Object.fromEntries(
  Object.entries(tilledRamps).map(([k, v]) => [k, v.map(decode)]),
) as Record<Ecology, Rgb[]>;

const paddy = {
  water: [54, 84, 90],
  deep: [42, 66, 74],
  sky: [138, 170, 178],
  mud: [88, 78, 58],
};
const tan = [190, 168, 116];
/** Plants along a ridge, in world pixels. */
const PLANT_PITCH = 10;

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
): GroundTileData {
  const cell = sample(x, y)!;
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

  // Rows run along the axis, phased on world pixels so strips in one
  // furlong share rows. The pitch is the parcel's own, so neighbouring
  // fields differ, and a parcel has its own grain: how speckled the soil
  // is and how lumpy the ridge.
  const pitch = 10 + Math.floor(hash(f.parcel, 0, 871) * 4);
  const grain = 0.05 + hash(f.parcel, 1, 871) * 0.09;
  const lumpy = 0.15 + hash(f.parcel, 2, 871) * 0.25;
  const furrow = (wx: number, wy: number) => {
    const along = axis === "x" ? wx : wy;
    const across = axis === "x" ? wy : wx;
    const band = Math.floor(across / 64);
    const drift = Math.floor(noise(along, band * 64, 96, 813) * 3) - 1;
    const shifted = across + drift;
    const p = mod(shifted, pitch);
    const row = Math.floor(shifted / pitch);
    // Height across the ridge, 0 in the trough and 1 on the crest, as a
    // rounded profile rather than flat steps; lumps along the row and a
    // per-pixel dither break the contour lines up.
    const round = 0.5 - 0.5 * Math.cos(((p + 0.5) / pitch) * Math.PI * 2);
    const lump = (noise(along, row * 7, 5, 883) - 0.5) * lumpy;
    const dither = (hash(wx, wy, 887) - 0.5) * 0.28;
    const t = Math.min(1, Math.max(0, round + lump + dither));
    return { t, along, row, dc: p - (pitch >> 1) };
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
    const u = axis === "x" ? da : dc;
    const v = axis === "x" ? dc : da;
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
        // One value per 3 px of row, so variation is along the row, not
        // pixel noise.
        const rowHash = hash(Math.floor(along / 3), row, 831);
        if (wet) {
          // Uniform still water between the bunds; the crop stands in rows.
          rgb = paddy.water;
          if (
            mod(along, 8) < 2 &&
            hash(Math.floor(along / 8), row, 835) > 0.9 &&
            !top
          )
            rgb = paddy.sky;
          const ridge = t >= 0.6;
          if (stage === "bare" || stage === "sown") {
            if (ridge) rgb = shade(paddy.mud, wash + (top ? 4 : -4));
          } else if (stage === "green") {
            if (ridge) rgb = mix(paddy.mud, leaf, top ? 0.5 : 0.3);
          } else if (stage === "ripe") {
            if (top) rgb = shade(hue, rowHash > 0.6 ? 14 : 4);
            else if (ridge) rgb = shade(hue, -18);
          } else if (ridge) rgb = shade(tan, -6);
          if (ink) rgb = leafRamp[ink - 1];
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
      // The soil stops short of the enclosure: a trodden headland with a
      // dotted lip where the last furrow ends.
      if (f.fence && !f.ditch) {
        const { inner: m } = headlandDepths(wx, wy);
        const inner = innerDistance(f.fence, px, py, m);
        if (inner <= m) {
          const s = m - inner;
          // A dark lip where the last furrow ends, broken here and there.
          if (s < 1.1)
            rgb = hash(Math.floor(wx / 5), Math.floor(wy / 5), 923) < 0.15 ? soil[1] : soil[0];
          else rgb = troddenPixel(wx, wy, 0, headland);
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
  if (f.edges & ~f.fence && !f.ditch && f.boundary !== "none") {
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
  if (!frozen)
    paintFences(sample, x, y, ox, oy, put, (px, py) => {
      const i = (py * 16 + px) * 4;
      for (let k = 0; k < 3; k++) pixels[i + k] = Math.max(0, pixels[i + k] - 22);
    });
  return { x, y, pixels };
}

/** A field cell whose enclosure stands up out of the ground, so neighbouring
 * material edges should stop at it rather than wear into it. */
export function raisedFieldEdge(c?: TopographyCell) {
  return (
    !!c?.field &&
    !!c.field.fence &&
    ["hedge", "wall", "fence", "baulk"].includes(
      c.field.enclosure ?? c.field.boundary,
    )
  );
}
