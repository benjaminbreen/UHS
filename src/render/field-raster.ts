import { crops } from "../content/agriculture/crops";
import type { CropId } from "../content/agriculture/types";
import type { Ecology } from "../content/ecology/profiles";
import type { TopographyCell, TopographySample } from "../core/topography";
import { defaultGrassArt, type GrassArt } from "../content/graphics/grass-art";
import { enclosurePixel } from "./fences";
import { groundMotif, turfTick } from "./ground-motifs";
import type { GroundTileData } from "./habitat-raster";
import { waterHash as hash, waterNoise as noise } from "./water-style";

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
  grassland: ["#5e4128", "#7a5636", "#96704a", "#ab865c"],
  tundra: ["#4f4634", "#6b6047", "#857a5e", "#978c70"],
  "boreal-woodland": ["#4e3f2b", "#6a583d", "#846f50", "#968264"],
  "temperate-woodland": ["#57402a", "#74573a", "#8f6f4c", "#a4845e"],
  "tropical-woodland": ["#5d3c26", "#7c5334", "#996a46", "#ad7d55"],
  wetland: ["#4c4230", "#665a43", "#7f735a", "#918669"],
  "dry-scrub": ["#6f5636", "#8f7249", "#ab8c5f", "#bf9f70"],
  desert: ["#8b7148", "#a98c5f", "#c2a574", "#d3b886"],
};
const tilled = Object.fromEntries(
  Object.entries(tilledRamps).map(([k, v]) => [k, v.map(decode)]),
) as Record<Ecology, Rgb[]>;

const paddy = {
  water: [54, 84, 90],
  deep: [42, 66, 74],
  sky: [138, 170, 178],
  mud: [88, 78, 58],
};
const tan = [190, 168, 116];
/** Furrow pitch in world pixels. */
const PITCH = 4;

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
  const palette = art.palettes[ecology];
  const soil = tilled[ecology];
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

  // Rows run along the axis at a fixed pitch. The row drifts at most one
  // pixel over a long wavelength so it stays ruled without being a grid.
  const furrow = (wx: number, wy: number) => {
    const along = axis === "x" ? wx : wy;
    const across = axis === "x" ? wy : wx;
    const band = Math.floor(across / 64);
    const drift = Math.floor(noise(along, band * 64, 96, 813) * 3) - 1;
    const shifted = across + drift;
    // 0 trough, 1 side, 2 ridge top, 3 shoulder.
    return { p: mod(shifted, PITCH), along, row: Math.floor(shifted / PITCH) };
  };

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
          const glint = mod(along, 8) < 2 && hash(Math.floor(along / 8), Math.floor(across), 821) > 0.8;
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
          rgb = [shade(palette[5], -6), palette[5], mix(palette[0], palette[6], 0.5)][ink - 1];
      } else {
        const { p, along, row } = furrow(wx, wy);
        const top = p === 2;
        const trough = p === 0;
        const side = p === 1;
        // One value per 3 px of row, so variation is along the row, not
        // pixel noise.
        const rowHash = hash(Math.floor(along / 3), row, 831);
        if (wet) {
          // Uniform still water between the bunds; the crop stands in rows.
          rgb = paddy.water;
          if (mod(along, 8) < 2 && hash(Math.floor(along / 8), row, 835) > 0.9 && !top)
            rgb = paddy.sky;
          if (stage === "bare") {
            if (top) rgb = shade(paddy.mud, wash);
          } else if (stage === "sown") {
            if (top) rgb = rowHash > 0.35 ? mix(leaf, paddy.water, 0.3) : shade(paddy.mud, wash);
          } else if (stage === "green") {
            if (top) rgb = shade(leaf, rowHash > 0.6 ? 10 : 0);
            else if (side) rgb = shade(leaf, -12);
          } else if (stage === "ripe") {
            if (top) rgb = shade(hue, rowHash > 0.6 ? 14 : 4);
            else if (side) rgb = shade(hue, -18);
          } else if (top) rgb = shade(tan, -6);
        } else {
          const base = trough ? soil[0] : side ? soil[1] : top ? soil[3] : soil[2];
          rgb = shade(base, wash);
          if (stage === "bare") {
            // Clean tilled soil.
          } else if (stage === "sown") {
            if (top && rowHash > 0.4) rgb = mix(rgb, leaf, 0.65);
          } else if (stage === "green") {
            if (top) rgb = shade(leaf, rowHash > 0.66 ? 12 : 0);
            else if (side) rgb = shade(leaf, -14);
            else if (trough) rgb = shade(soil[0], wash);
            else rgb = shade(leaf, -22);
          } else if (stage === "ripe") {
            if (top) rgb = shade(hue, rowHash > 0.6 ? 16 : 6);
            else if (side) rgb = shade(hue, -16);
            else if (trough) rgb = mix(shade(hue, -40), soil[0], 0.5);
            else rgb = shade(hue, -26);
          } else {
            // Stubble: pale straw over the ridges, soil in the troughs, and
            // short cut stalks every third pixel along the row.
            const straw = mix(tan, soil[2], 0.3);
            if (trough) rgb = shade(soil[0], wash + 6);
            else rgb = shade(straw, wash + (top ? 8 : -6));
            if (top && mod(along, 3) === 0) rgb = shade(soil[1], -6);
          }
        }
      }
      if (autumn && !wet && kind !== "pasture") rgb = mix(rgb, palette[1], 0.08);
      if (frozen)
        rgb = wet ? mix(rgb, [196, 208, 210], 0.55) : mix(rgb, [206, 212, 204], 0.6);
      put(px, py, rgb);
    }

  // Enclosure and parcel lines over the outer pixels.
  if ((f.fence || f.edges) && !f.ditch && f.boundary !== "none") {
    const enclosure = {
      fence: f.fence,
      edges: f.edges,
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
  return { x, y, pixels };
}

/** A field cell whose enclosure stands up out of the ground, so neighbouring
 * material edges should stop at it rather than wear into it. */
export function raisedFieldEdge(c?: TopographyCell) {
  return (
    !!c?.field &&
    !!c.field.fence &&
    ["hedge", "wall", "fence", "baulk"].includes(c.field.boundary)
  );
}
