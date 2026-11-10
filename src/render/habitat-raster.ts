import type { Rock } from "../content/geography/rock";
import type { EarthFinish } from "../content/settlements/urban-form/types";
import { frostCover, snowCover, snowOver } from "./snow-cover";
import {
  edgeTufts,
  earthSpeckle,
  fernGlyph,
  floorMark,
  groundMotif,
  leafGlyphs,
  materialGrain,
} from "./ground-motifs";
import {
  groundStyle,
  layerFor,
  styleGroundPixel,
  type GroundMaterial,
} from "./ground-style";
import { rasterStreetTile } from "./street-raster";
import { blacktopPixel } from "./carriageway";
import { enclosed, kerbed, pavingMask, wornEdge, VERGE } from "./paving-edge";
import { dustOf, pavingGrade, pavingStonePixel, stoneUnit } from "./paving-stones";
import { mottle, shade } from "./palette";
import { kitGroundPixel, kitPalette, kitSoil, pickKit } from "./ground-kit";
import { rasterFieldTile, tilled } from "./field-raster";
import { bold, width as fenceWidth } from "./fences";
import { paintFences } from "./fence-pass";
import { standingStyle } from "../content/settlements/boundaries";
import {
  BANK,
  bankPixel,
  fenceStands,
  fieldsNear,
  headlandDepths,
  nearestField,
  troddenPixel,
  weedPixel,
} from "./headland";
import { transitionPixel, fringePixel, groundClumps } from "./terrain-tiles";
import {
  paintedGround,
  pathField,
  shoreDistance,
  shoreOnTier,
  shoreWidth,
  shorePixel,
  tidalFlat,
} from "./material-edges";
import { waterDistance } from "../core/water-field";
import {
  paletteKey,
  type Ecology,
  type PaletteKey,
} from "../content/ecology/profiles";
import type { TopographyCell, TopographySample } from "../core/topography";
import type { Habitat } from "../world/v3/habitats";
import { defaultGrassArt, type GrassArt } from "../content/graphics/grass-art";
import { waterHash as hash, waterNoise as noise } from "./water-style";
import { swardHatch, tuftColony } from "./ground-motifs";
const mod = (n: number, d: number) => ((n % d) + d) % d;

export type GroundTileData = {
  x: number;
  y: number;
  pixels: Uint8ClampedArray;
};
// Trodden earth: contact shadow, shoulder, body, worn center. Kept close in
// value to that ecology's turf and always less saturated than it, so a road
// reads as bare ground rather than as a line drawn over the ground.
export { soils } from "./habitat-soils";
import { soils } from "./habitat-soils";
import { habitatAppearance, habitatBand } from "./habitat-appearance";
import { groveEdge } from "../world/v3/habitats";
// Prevailing wind for sand seas, as a fixed heading the ripples run across.
/** Cover below this leaves the ground alone: a few trees on a meadow do not
 * shade it. */
const CANOPY_SHADE_FROM = 0.5;
const DUNE_COS = Math.cos(0.72),
  DUNE_SIN = Math.sin(0.72);
const decode = (s: string) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
// Cut bank faces: undercut, strata, body, sunlit shoulder, embedded stone.
// Wider in value than the road ramp, which is kept close to turf on purpose.
const bankRamps: Record<PaletteKey, string[]> = {
  grassland: ["#5e4030", "#7a5238", "#9a6b47", "#b8865a", "#8d8a7c"],
  tundra: ["#4f4a3e", "#6a6353", "#86806c", "#a19a84", "#9d9c94"],
  "boreal-woodland": ["#4a3c2c", "#665239", "#856b4c", "#a08761", "#8a877c"],
  "temperate-woodland": ["#55392a", "#75503a", "#956a48", "#b3875c", "#8f8a7e"],
  "tropical-woodland": ["#5a3421", "#7c4a2f", "#9e6640", "#bd8656", "#8a7d6d"],
  wetland: ["#463d2b", "#605540", "#7c705a", "#978a70", "#7f8073"],
  "dry-scrub": ["#6f5233", "#8f6d45", "#b08c5e", "#cba878", "#a09a86"],
  desert: ["#8a6a3e", "#ab895a", "#cdac78", "#e2c894", "#b7ad94"],
  "desert:sahara": ["#a8722f", "#c48f45", "#dcae62", "#ecc47e", "#c7b08a"],
  "desert:red-earth": ["#692f27", "#913c2b", "#b95233", "#dc7b48", "#edb17e"],
  savanna: ["#6b4c2c", "#8a683f", "#aa8656", "#c6a26e", "#9d9680"],
  "desert:sonoran": ["#7f592f", "#9d7548", "#bd9563", "#d0b07d", "#a89c83"],
  "desert:atacama": ["#83745b", "#a29278", "#c3b396", "#d7cbae", "#aea99c"],
  "desert:kalahari": ["#6e4137", "#985743", "#c27352", "#e79e6b", "#f9cd9c"],
  "dry-scrub:chaparral": ["#664c34", "#846546", "#a2825e", "#bb9b76", "#938e7e"],
  "dry-scrub:mallee": ["#695439", "#886f4c", "#a78d65", "#c1a87e", "#989483"],
  "dry-scrub:fynbos": ["#644833", "#816045", "#9e7c5c", "#b79573", "#90897b"],
  "dry-scrub:matorral": ["#644d36", "#816648", "#9e8260", "#b79b77", "#908b7c"],
  "dry-scrub:sahel": ["#6f542d", "#8f6f3e", "#b08e56", "#cbab70", "#a09b83"],
  "grassland:prairie": ["#5c3e2d", "#785034", "#976842", "#b48254", "#8a8779"],
  "grassland:steppe": ["#604938", "#7c5f43", "#9d7a55", "#bc976a", "#908e81"],
  "grassland:pampas": ["#634735", "#805b3e", "#a2774f", "#c19463", "#949283"],
  "grassland:montane": ["#594036", "#745242", "#926a53", "#af8467", "#868379"],
  "savanna:cerrado": ["#664427", "#835d38", "#a2794e", "#bc9464", "#958d78"],
  "savanna:eucalypt": ["#6b5439", "#8a714e", "#aa8f67", "#c6ac80", "#9d9886"],
  "savanna:monsoon": ["#6b4226", "#8a5c38", "#aa794e", "#c69565", "#9d927d"],
  "temperate-woodland:oak-hickory": ["#553928", "#755037", "#956b44", "#b38858", "#8f8a7d"],
  "temperate-woodland:east-asian": ["#573626", "#774c35", "#986542", "#b78255", "#928c7f"],
  "temperate-woodland:southern-beech": ["#4e352b", "#6c4a3b", "#896149", "#a57b5d", "#847e75"],
  "temperate-woodland:redwood": ["#4c352c", "#694b3c", "#86624b", "#a17c5f", "#817c74"],
  "temperate-woodland:conifer": ["#4c352c", "#694b3c", "#86624b", "#a17c5f", "#817c74"],
  "boreal-woodland:larch": ["#4e412e", "#6b593c", "#8c7450", "#a89266", "#918f82"],
  "boreal-woodland:coastal": ["#433325", "#5c452f", "#785a3f", "#907352", "#7c786e"],
  "tropical-woodland:monsoon": ["#5e3f29", "#825939", "#a6784d", "#c69b65", "#918775"],
  "wetland:monsoon": ["#4a3c26", "#65543b", "#827056", "#9f8b6b", "#868675"],
  "wetland:papyrus": ["#463e28", "#60563d", "#7c7157", "#978b6c", "#7e8072"],
  "wetland:pantanal": ["#473d28", "#62563c", "#7e7157", "#9a8c6c", "#818373"],
  "wetland:bog": ["#3c3728", "#524c3a", "#696451", "#807a64", "#6b6d63"],
  "wetland:swamp": ["#302f23", "#43422f", "#59523a", "#716446", "#465b4b"],
  "wetland:mangrove": ["#3c3225", "#524636", "#695c4c", "#80725f", "#6d6d62"],
  "tundra:alpine": ["#4d473b", "#685f4f", "#837b67", "#9e957f", "#9a9890"],
  "temperate-woodland:pine-oak": ["#5a4230", "#7a5a3e", "#9a7650", "#b69266", "#928c7e"],
  "temperate-woodland:temperate-rain": ["#3e3226", "#56453a", "#6e5a48", "#87705a", "#76786e"],
  "tropical-woodland:rainforest": ["#5a2e1e", "#7c4029", "#a05a38", "#c07a4e", "#8a7a6a"],
  "tropical-woodland:cloud": ["#43392c", "#5c4f3e", "#766652", "#8f7e68", "#7e8076"],
  "grassland:puna": ["#6a5440", "#8a6e52", "#a88a6a", "#c2a684", "#9a9488"],
  "grassland:paramo": ["#46392c", "#5e4e3e", "#786652", "#927e68", "#7c7c74"],
  "grassland:tibetan": ["#64503e", "#826a52", "#a2876a", "#bea384", "#9a968a"],
  "grassland:afroalpine": ["#3e3630", "#56493f", "#6e5f52", "#887868", "#7a7872"],
  "grassland:loess": ["#8a6436", "#a87c46", "#c49a5c", "#dab676", "#c2ab84"],
  "desert:reg": ["#5e4a38", "#7c624a", "#9a7e60", "#b49a7a", "#6e665c"],
  "wetland:fen": ["#4a3e2a", "#64553c", "#807056", "#9a8a6c", "#828274"],
  "tundra:ice": ["#5a7a9c", "#7a9cc0", "#a0bede", "#c6dcf0", "#e8f2fa"],
  "tundra:polar": ["#55524a", "#726e64", "#918d80", "#aea99b", "#aaa9a4"],
};
export const banks = Object.fromEntries(
  Object.entries(bankRamps).map(([k, v]) => [k, v.map(decode)]),
) as Record<PaletteKey, number[][]>;
/** Fans of faint arcs a broom leaves in swept earth, one in half of the
 * 12 px blocks, each fan facing its own way. */
function broomMark(wx: number, wy: number): boolean {
  const bx = Math.floor(wx / 12),
    by = Math.floor(wy / 12);
  if (hash(bx, by, 521) > 0.5) return false;
  const dx = wx - (bx * 12 + 6),
    dy = wy - (by * 12 + 6);
  const r = Math.hypot(dx, dy);
  const facing = hash(bx, by, 523) * Math.PI * 2;
  let off = Math.atan2(dy, dx) - facing;
  off = Math.atan2(Math.sin(off), Math.cos(off));
  return Math.abs(off) < 0.6 && [3, 5].some((ring) => Math.abs(r - ring) < 0.5);
}

const mix = (a: readonly number[], b: readonly number[], t: number) =>
  a.map((v, k) => Math.round(v * (1 - t) + b[k] * t));

/** Pixels from the nearest side whose neighbour is kept differently; made
 * ground stands a lip proud of whatever it meets. */
function lipAt(sample: TopographySample, x: number, y: number, px: number, py: number, finish: EarthFinish): number {
  if (finish === "beaten" || finish === "sand") return 9;
  const open = (dx: number, dy: number) => sample(x + dx, y + dy)?.earth !== finish;
  return Math.min(
    open(-1, 0) ? px : 9,
    open(1, 0) ? 15 - px : 9,
    open(0, -1) ? py : 9,
    open(0, 1) ? 15 - py : 9,
  );
}

/** Town ground as it is kept, on the local soil ramp: tone and shade.
 * `cross` is 0 on a path's centre line and 1 at its edge. */
function finishPixel(
  finish: EarthFinish,
  wx: number,
  wy: number,
  soil: number[][],
  cross: number,
  lip: number,
): [number[], number] {
  if (finish === "beaten") {
    // Rammed and darker than open dirt; traffic polishes the crown and water
    // runs off to darker edges. Hairline cracks where it has dried out.
    const crack = Math.abs(noise(wx, wy, 11, 533) - 0.5) < 0.02;
    const crown = Math.round((1 - Math.min(1, cross)) * 10) - (cross > 0.8 ? 8 : 0);
    return [soil[1], crack ? -16 : crown + (hash(wx, wy, 535) < 0.03 ? -8 : 0)];
  }
  if (finish === "sand") {
    // Loose and pale, rippled across the wind, pocked with footprints.
    const ripple = Math.sin(wx * 0.6 + wy * 0.22 + noise(wx, wy, 23, 531) * 5);
    const fx = Math.floor(wx / 9), fy = Math.floor(wy / 7);
    const step = hash(fx, fy, 547) < 0.18 &&
      wx === fx * 9 + 2 + Math.floor(hash(fx, fy, 549) * 5) &&
      wy - (fy * 7 + 2) >= 0 && wy - (fy * 7 + 2) < 2;
    return [mix(soil[3], [232, 212, 168], 0.55), step ? -14 : ripple > 0.8 ? 9 : ripple < -0.9 ? -8 : 0];
  }
  // Made ground: a lip where it meets anything else, lit on top, shadowed below.
  const edge = lip === 0 ? -16 : lip === 1 ? 9 : 0;
  if (finish === "swept")
    return [mix(soil[3], [255, 246, 226], 0.18), edge || (broomMark(wx, wy) ? 10 : 0)];
  if (finish === "gravel") {
    // Raked into wavering lines; the grain is the stones themselves.
    const furrow = mod(wy + Math.round(Math.sin(wx / 9) * 1.5), 3) === 0;
    return [mix(soil[3], [170, 166, 156], 0.6),
      edge || (furrow ? -13 : 5) + Math.round((hash(wx, wy, 537) - 0.5) * 16)];
  }
  if (finish === "lime") {
    // Worn through to its earth bed in patches; seams where it was relaid.
    if (!edge && noise(wx, wy, 29, 539) > 0.8) return [soil[3], -2];
    const seam = mod(wx, 48) === 0 || mod(wy, 48) === 0;
    const crack = Math.abs(noise(wx, wy, 13, 541) - 0.5) < 0.012;
    return [mix(soil[3], [234, 226, 206], 0.82),
      edge || (seam || crack ? -11 : Math.round((noise(wx, wy, 7, 543) - 0.5) * 6))];
  }
  // Daub: smoothed by hand in overlapping sweeps.
  const bx = Math.floor(wx / 10),
    by = Math.floor(wy / 10);
  const dx = wx - bx * 10 - 3 - Math.floor(hash(bx, by, 551) * 5),
    dy = wy - by * 10 - 3 - Math.floor(hash(bx, by, 553) * 5);
  const r = Math.hypot(dx, dy);
  let off = Math.atan2(dy, dx) - hash(bx, by, 555) * Math.PI * 2;
  off = Math.atan2(Math.sin(off), Math.cos(off));
  const sweep = hash(bx, by, 545) < 0.45 && Math.abs(off) < 1 &&
    [2, 4, 6].some((ring) => Math.abs(r - ring) < 0.4);
  return [mix(soil[2], [128, 112, 84], 0.45), edge || (sweep ? 7 : 0)];
}

/** A sea beach is ground-down coast, so its sand takes the colour of the
 * local rock: black on basalt, shell-white on limestone and chalk and on
 * tropical reefs, gold on sandstone; shingle likewise. Returned as a per-channel factor on the
 * habitat's own sand, which keeps its ripples and grain. */
const beachSand: Record<Rock, number[]> = {
  basalt: [104, 100, 102],
  granite: [198, 188, 170],
  limestone: [236, 228, 204],
  chalk: [238, 234, 218],
  sandstone: [226, 192, 136],
  redstone: [224, 170, 128],
  laterite: [220, 164, 124],
  shale: [180, 168, 144],
};
export function beachTint(c: TopographyCell): number[] | undefined {
  if ((c.surface !== "sand" && c.surface !== "gravel") || c.waterVisual?.kind !== "sea" || !c.rock || c.habitat?.ecology === "desert") return undefined;
  const to = c.habitat?.ecology === "tropical-woodland" && c.rock !== "basalt" ? [242, 236, 216] : beachSand[c.rock];
  return [to[0] / 214, to[1] / 198, to[2] / 152];
}

/** Creek bed stones by region: slate in cool green country, ochre gravel in
 * dry grass and scrub, iron-red on red earth, cream on the Sahara. Returns
 * bed tone, lit stone, dark stone. */
export function pebbleBed(
  ecology: Ecology,
  colorway: string | undefined,
  soil: number[][],
  turf: number[][],
): [number[], number[], number[]] {
  const mixc = (a: number[], b: number[], t: number) =>
    a.map((v, k) => Math.round(v * (1 - t) + b[k] * t));
  if (colorway === "red-earth" || colorway === "kalahari" || colorway === "sonoran")
    return [mixc(soil[2], [150, 120, 100], 0.35), [214, 170, 140], [110, 70, 52]];
  if (colorway === "sahara" || ecology === "desert")
    return [mixc(soil[3], [200, 190, 170], 0.5), [238, 226, 200], [150, 132, 104]];
  if (ecology === "savanna" || ecology === "dry-scrub" || ecology === "grassland")
    return [mixc(soil[2], [170, 160, 135], 0.55), [206, 196, 170], [112, 104, 84]];
  if (ecology === "tropical-woodland" || ecology === "wetland")
    return [mixc(soil[1], [120, 128, 110], 0.6), [172, 178, 158], [70, 78, 64]];
  // Temperate, boreal, tundra: grey slate with a cool cast.
  return [mixc(turf[4], [140, 144, 138], 0.7), [190, 194, 186], [86, 92, 90]];
}
/** Perennial ice: white firn, and bare blue ice crossed by crevasses. */
function glacierPixel(wx: number, wy: number) {
  const blue = noise(wx, wy, 52, 561) * 0.7 + noise(wx, wy, 17, 563) * 0.3;
  if (blue < 0.55) return [238, 244, 252];
  const crack = (wy + wx * 0.25 + noise(wx, wy, 23, 565) * 10) / 9;
  const phase = crack - Math.floor(crack);
  const broken = hash(Math.floor(wx / 7), Math.floor(crack), 567) < 0.35;
  if (!broken && phase < 0.1) return [70, 108, 160];
  if (!broken && phase < 0.18) return [232, 242, 252];
  return blue > 0.65 ? [158, 196, 232] : [190, 216, 240];
}
export function naturalGround(c: TopographyCell) {
  return (
    !!c.habitat &&
    !c.bridge &&
    !c.ramp &&
    !c.feature &&
    ["grass", "dry", "damp", "sand", "snow", "gravel"].includes(c.surface) &&
    (!c.waterVisual || c.waterVisual.distance >= c.waterVisual.shoreWidth + 1)
  );
}
/** Original native-pixel materials; sampled in the worker and baked into chunk pages.
 * No tile-shaped color patches, per-frame noise or additional ground GameObjects. */
/** The raster's band numbers, read as the material the style panel edits. */
function materialOf(
  band: number,
  surface: TopographyCell["surface"],
  mineral: boolean,
  frozen: boolean,
): GroundMaterial {
  if (frozen) return "snow";
  if (surface === "sand") return "sand";
  if (band === 5) return "tilled";
  if (band === 4) return "litter";
  if (band === 3) return mineral ? "stone" : "earth";
  if (band === 2) return "wet";
  if (band === 1) return "sward";
  return "turf";
}

/** Ramps for one habitat, shared between the cells that agree on them: a
 * blend is a reduce per channel per row and was rebuilt for all 256 cells. */
const rampCache = new WeakMap<GrassArt, Map<string, { palette: number[][]; soilPalette: number[][] }>>();
function habitatRamps(h: Habitat, art: GrassArt) {
  let cache = rampCache.get(art);
  if (!cache) rampCache.set(art, (cache = new Map()));
  const blend = h.blend
    ? h.blend.map((p) => `${p.ecology}:${p.colorway ?? ""}:${p.weight}`).join(",")
    : "";
  const site = h.site
    ? h.site.primary +
      ":" +
      Object.entries(h.site.weights)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([id, w]) => `${id}=${w}`)
        .join(",")
    : "";
  const id = `${h.ecology}|${h.colorway ?? ""}|${h.season ?? ""}${h.dry ? "-dry" : ""}|${h.vegetation ?? ""}|${blend}|${site}`;
  let value = cache.get(id);
  if (value) return value;
  const key = paletteKey(h.ecology, h.colorway);
  // A growth pattern borrows a drier palette only where the envelope has
  // none of its own; a savanna or steppe colourway keeps its ramp.
  let palette =
    h.vegetation === "savanna" && !["savanna", "dry-scrub"].includes(h.ecology)
      ? art.palettes["dry-scrub"]
      : h.vegetation === "steppe" && h.ecology !== "grassland"
        ? art.palettes.grassland
        : h.vegetation === "alpine" && h.ecology !== "tundra"
          ? art.palettes.tundra
          : art.palettes[key];
  const blendPalette = (ramps: Record<PaletteKey, number[][]>, fallback: number[][]) =>
    h.blend && h.blend.length > 1
      ? fallback.map((row,i) => row.map((_,c) => Math.round(h.blend!.reduce((sum,part) =>
          sum + ramps[paletteKey(part.ecology,part.colorway)][i][c] * part.weight, 0))))
      : fallback;
  palette = blendPalette(art.palettes, palette);
  const resolved = h.site ? habitatAppearance(h, art) : undefined;
  if (resolved) palette = resolved.palette;
  value = { palette, soilPalette: resolved?.soil ?? blendPalette(soils, soils[key]) };
  if (cache.size > 512) cache.clear();
  cache.set(id, value);
  return value;
}
export function rasterHabitatTile(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
  art: GrassArt = defaultGrassArt,
  cell: TopographyCell = sample(x, y)!,
): GroundTileData {
  const tile = bareHabitatTile(sample, x, y, ox, oy, art, cell);
  // The tide's mud laps into the shore's own cells along the same line the
  // water tiles draw it to, whatever the beach here is made of.
  const v = cell.waterVisual;
  if (v?.shelf !== undefined && v.distance < 1.6 && cell.surface !== "water" && cell.feature !== "paving" && !cell.bridge)
    for (let py = 0; py < 16; py++)
      for (let px = 0; px < 16; px++) {
        const d = waterDistance(sample, x + (px + 0.5) / 16, y + (py + 0.5) / 16);
        const mud = d < 0.8 ? tidalFlat(cell, d, (x + ox) * 16 + px, (y + oy) * 16 + py) : undefined;
        if (mud) tile.pixels.set(mud, (py * 16 + px) * 4);
      }
  if (snowCover() || frostCover()) snowOver(tile.pixels, sample, x, y, ox, oy, cell);
  return tile;
}

/** How far past its tile a kit path looks for the grass bank above it. */
const BANK_REACH = 5;

function bareHabitatTile(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
  art: GrassArt,
  cell: TopographyCell,
): GroundTileData {
  const street = cell.feature === "paving";
  if (street && cell.streetGeometry && cell.habitat) {
    const under = { ...cell, feature: undefined, pavement: undefined, streetMaterial: undefined, surface: "grass" as const };
    const tile = rasterGroundTile(sample, x, y, ox, oy, art, under);
    const top = rasterStreetTile(sample, x, y, ox, oy).pixels;
    for (let i = 0; i < top.length; i += 4)
      if (top[i + 3]) tile.pixels.set(top.subarray(i, i + 4), i);
    return tile;
  }
  if (street && cell.pavement === "apron" && cell.habitat) return apronTile(sample, x, y, ox, oy, art, cell);
  if (!street && (!cell.habitat || !wornEdge(cell)))
    return rasterGroundTile(sample, x, y, ox, oy, art, cell);
  if (!street && enclosed(sample, x, y)) {
    const n = [sample(x - 1, y), sample(x, y - 1)].find((c) => c?.feature === "paving") ?? ({} as Partial<TopographyCell>),
      pixels = new Uint8ClampedArray(1024);
    for (let py = 0; py < 16; py++)
      for (let px = 0; px < 16; px++)
        pixels.set(
          [...pavingStonePixel((x + ox) * 16 + px, (y + oy) * 16 + py, n.streetMaterial ?? "slab", pavingGrade(n.pavement)), 255],
          (py * 16 + px) * 4,
        );
    return { x, y, pixels };
  }
  const mask =
    cell.pavement === "dais" || kerbed(sample, x, y)
      ? undefined
      : pavingMask(sample, x, y, ox, oy);
  if (!mask)
    return street
      ? rasterStreetTile(sample, x, y, ox, oy)
      : rasterGroundTile(sample, x, y, ox, oy, art, cell);
  // The nearest worn neighbour lends a paved cell its ground.
  let under = cell,
    lane: TopographyCell | undefined;
  for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const n = sample(x + dx, y + dy);
    if (street && under === cell && n?.habitat && wornEdge(n))
      under = { ...cell, feature: undefined, streetMaterial: undefined, pavement: n.pavement, earth: n.earth, surface: n.surface, habitat: cell.habitat ?? n.habitat };
    if (!street && !lane && n?.feature === "paving") lane = n;
  }
  if (street && under === cell) return rasterStreetTile(sample, x, y, ox, oy);
  const top = street ? rasterStreetTile(sample, x, y, ox, oy).pixels : undefined;
  const tile = rasterGroundTile(sample, x, y, ox, oy, art, under);
  const pixels = tile.pixels;
  const { soilPalette: soil } = habitatRamps(under.habitat!, art);
  const loose = street ? cell.streetMaterial : lane?.streetMaterial;
  const gx = (x + ox) * 16,
    gy = (y + oy) * 16;
  for (let py = 0; py < 16; py++)
    for (let px = 0; px < 16; px++) {
      const i = (py * 16 + px) * 4,
        d = mask(px, py);
      if (d >= 0) {
        if (top) {
          pixels.set(top.subarray(i, i + 4), i);
          // The outer stones are set a little proud: a dark joint where they
          // meet the ground, a lit arris just inside it.
          if (d < 2) for (let k = 0; k < 3; k++) pixels[i + k] = Math.round(pixels[i + k] * (d < 1 ? 0.72 : 1.08));
        } else if (lane) {
          // A fillet in a ground cell: sunk edge stones of the street beside it.
          const stone = pavingStonePixel(gx + px, gy + py, lane.streetMaterial ?? "slab", pavingGrade(lane.pavement));
          pixels.set(d < 1 ? [169, 156, 121] : stone.map((n) => n - 8), i);
        }
        continue;
      }
      if (d < -VERGE) continue;
      // Setts work loose at a worn edge and lie scattered in the mud beside
      // it; slabs break, and their pieces lie a little further apart.
      const sett = loose === "cobble" || loose === "sett" || loose === "brick";
      if (loose && (sett || loose === "slab" || loose === "basalt") && d > -3.5) {
        const b = sett ? 3 : 4,
          bx = Math.floor((gx + px) / b), by = Math.floor((gy + py) / b);
        if (hash(bx, by, 887) < (sett ? 0.16 : 0.09) && mod(gx + px, b) !== b - 1 && mod(gy + py, b) !== b - 1) {
          const stone = pavingStonePixel(gx + px, gy + py, loose, "street");
          pixels.set(mod(gy + py, b) === 0 ? stone.map((n) => n + 6) : stone.map((n) => n - 14), i);
          continue;
        }
      }
      // Verge: packed earth against the stones, breaking up into the turf.
      const grit = hash(gx + px, gy + py, 883),
        keep = d > -1.6 ? 1 : 0;
      if (grit > keep) continue;
      const tone = d > -1.2 ? soil[1] : soil[grit < keep * 0.35 ? 3 : 2];
      pixels[i] = tone[0];
      pixels[i + 1] = tone[1];
      pixels[i + 2] = tone[2];
    }
  return tile;
}
/** Humble setts over trodden earth. Stones go missing toward open ground:
 * whole ones, each hole a step down with the stone above shading it. */
function apronTile(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
  art: GrassArt,
  cell: TopographyCell,
): GroundTileData {
  const under = { ...cell, feature: undefined, streetMaterial: undefined, pavement: "yard" as const, surface: "soil" as const };
  const tile = rasterGroundTile(sample, x, y, ox, oy, art, under);
  const material = cell.streetMaterial ?? "cobble";
  const gx = (x + ox) * 16,
    gy = (y + oy) * 16;
  // Missing stones per neighbour side that is not paved, read at the corners
  // and blended so the loss grades across the cell instead of by cell.
  const bare = (dx: number, dy: number) => (sample(x + dx, y + dy)?.feature === "paving" ? 0 : 1);
  const w = bare(-1, 0), e = bare(1, 0), n = bare(0, -1), s = bare(0, 1);
  const gone = (wx: number, wy: number) => {
    const u = (wx - gx) / 15,
      v = (wy - gy) / 15;
    const loss = 0.12 + 0.55 * Math.max(w * (1 - u), e * u, n * (1 - v), s * v) ** 2;
    return stoneUnit(wx, wy, material) < loss;
  };
  const pixels = tile.pixels;
  for (let py = 0; py < 16; py++)
    for (let px = 0; px < 16; px++) {
      const i = (py * 16 + px) * 4,
        wx = gx + px,
        wy = gy + py;
      if (gone(wx, wy)) {
        if (!gone(wx, wy - 1)) for (let k = 0; k < 3; k++) pixels[i + k] = Math.round(pixels[i + k] * 0.8);
        continue;
      }
      pixels.set(pavingStonePixel(wx, wy, material, "yard"), i);
    }
  return tile;
}
/** Grassy ecologies expose brown earth; dry and cold ones, and rocky sites, expose stone. */
const mineralHabitat = (h: Habitat) =>
  h.site ? ["rocky", "barren", "shore"].includes(h.site.primary) : h.vegetation === "alpine" || ["desert", "tundra"].includes(h.ecology);
/** The choices a tile makes once for its whole square. Cells that differ
 * here would meet on the tile edge, so they meet along a drawn line instead. */
const groundLook = (h: Habitat) =>
  `${pickKit(groundStyle()?.kits, h.ecology, h.colorway, h.vegetation)?.id ?? paletteKey(h.ecology, h.colorway)}|${mineralHabitat(h)}|${h.site?.primary ?? ""}|${h.dry ?? ""}`;

function rasterGroundTile(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
  art: GrassArt,
  cell: TopographyCell,
  as?: Habitat,
): GroundTileData {
  // Yard grass is the same turf as outside the fence; only beds are tilled.
  if (cell.field && !(cell.field.yard && cell.field.crop === "pasture"))
    return rasterFieldTile(sample, x, y, ox, oy, art, cell);
  const h = as ?? cell.habitat!;
  if (!as) {
    const own = groundLook(h);
    const lookOf: (string | undefined)[] = [];
    const looks = new Map<string, Habitat>();
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const c = sample(x + dx, y + dy);
        const k = c?.habitat && c.height === cell.height && c.surface !== "water" && !c.field && c.feature !== "paving"
          ? groundLook(c.habitat) : undefined;
        lookOf.push(k);
        if (k && k !== own && !looks.has(k)) looks.set(k, c!.habitat!);
      }
    if (looks.size) {
      // Each look is painted here as if this cell were its own, and every
      // pixel takes the look of the nearest cell centre, nudged by noise.
      // All world-anchored, so a neighbour drawing the same pixel agrees.
      const tile = rasterGroundTile(sample, x, y, ox, oy, art, cell, h);
      const other = new Map([...looks].map(([k, n]) => [k, rasterGroundTile(sample, x, y, ox, oy, art, cell, n).pixels]));
      const ease = (t: number) => t * t * (3 - 2 * t);
      const weight = new Map<string, number>();
      for (let py = 0; py < 16; py++)
        for (let px = 0; px < 16; px++) {
          const wx = (x + ox) * 16 + px, wy = (y + oy) * 16 + py;
          const u = (px + 0.5) / 16 - 0.5 + (noise(wx, wy, 13, 1601) - 0.5) * 0.7,
            v = (py + 0.5) / 16 - 0.5 + (noise(wx, wy, 13, 1603) - 0.5) * 0.7;
          const cx = Math.floor(u), cy = Math.floor(v), tx = ease(u - cx), ty = ease(v - cy);
          weight.clear();
          for (const [ix, iy, w] of [[cx, cy, (1 - tx) * (1 - ty)], [cx + 1, cy, tx * (1 - ty)], [cx, cy + 1, (1 - tx) * ty], [cx + 1, cy + 1, tx * ty]]) {
            const k = lookOf[(iy + 1) * 3 + ix + 1] ?? own;
            weight.set(k, (weight.get(k) ?? 0) + w);
          }
          let best = own, most = -1;
          for (const [k, w] of weight) if (w > most) [best, most] = [k, w];
          const src = other.get(best);
          if (src) tile.pixels.set(src.subarray((py * 16 + px) * 4, (py * 16 + px) * 4 + 4), (py * 16 + px) * 4);
        }
      return tile;
    }
  }
  const kits = groundStyle()?.kits;
  const kit = pickKit(kits, h.ecology, h.colorway, h.vegetation);
  // Tundra sedge and lichen take a kit over its stony ground too.
  const kitTundra = (h.ecology === "tundra" || h.vegetation === "alpine");
  let { palette, soilPalette } = habitatRamps(h, art);
  if (kit) {
    palette = kitPalette(kit);
    soilPalette = kitSoil(kit);
  }
  const pixels = new Uint8ClampedArray(16 * 16 * 4);
  const gx = (x + ox) * 16,
    gy = (y + oy) * 16;
  const composition = groundStyle()?.composition;
  const upkeep = cell.pavement === "yard" ? 0.55
    : ["court", "square", "footway", "platform"].includes(cell.pavement ?? "") ? 0.25
    : cell.pavement === "vacant" ? 0.85 : 1 - (cell.tended ?? 0) * 0.8;
  // Detail fades under the stand, not in the open: a cleared village is turf.
  const groveDetail = h.grove === undefined ? 1 : Math.max(h.grove < 0.45 ? 1 : 0, 0.18 + groveEdge(h.grove) * 0.95);
  const motifTuning = composition
    ? {
        density: composition.motifDensity * upkeep * groveDetail,
        spacing: composition.motifSpacing,
        clustering: composition.motifClustering,
      }
    : undefined;
  const frozen = cell.surface === "snow";
  // Tufts crowd where grass grows thick and wet; open dry ground stays
  // quiet, with marks scattered rather than on a full lattice.
  const lush = Math.max(
    0,
    Math.min(1, h.cover * 0.7 + h.wet * 0.5 - h.exposed * 0.5),
  );
  const turfTuning = {
    ...motifTuning,
    density: (motifTuning?.density ?? groveDetail) * (0.45 + lush * 0.75),
  };
  const mineralGround = mineralHabitat(h);
  // Sand seas expose darker sand crests, not stone.
  const dune =
    h.ecology === "desert" &&
    ["sahara", "red-earth", "kalahari"].includes(h.colorway ?? "");
  const nearBareGround = (ecology: Ecology, xx: number, yy: number) => {
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        if (Math.abs(dx) + Math.abs(dy) > 2) continue;
        const neighbor = sample(xx + dx, yy + dy)?.habitat;
        if (neighbor && neighbor.ecology === ecology && neighbor.exposed > 0.65)
          return true;
      }
    return false;
  };
  // Band 5 is tilled ground: earth in any ecology, never stone.
  const bandOf = (
    a: typeof h,
    c: TopographyCell | undefined,
    xx: number,
    yy: number,
  ) =>
    c?.feature === "field"
      ? 5
      : a.site ? habitatBand(a) : a.exposed > 0.65
        ? 3
        : a.exposed > 0.4 &&
            !["desert", "tundra"].includes(a.ecology) &&
            nearBareGround(a.ecology, xx, yy)
          ? 1
          : a.wet > 0.61
            ? 2
            : !a.vegetation && a.ecology.includes("woodland") &&
                (a.grove === undefined || a.grove >= 0.6) &&
                a.cover > (a.layeredForest ? 0.34 : 0.5)
              ? 4
              : 0;
  // Remove unsupported one-cell islands before choosing transition tiles.
  const stableBand = (xx: number, yy: number) => {
    const c = sample(xx, yy),
      own = bandOf(c?.habitat ?? h, c, xx, yy);
    const neighbors = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ].map(([dx, dy]) => {
      const n = sample(xx + dx, yy + dy);
      return bandOf(n?.habitat ?? h, n, xx + dx, yy + dy);
    });
    if (own === 1) return own;
    return neighbors.filter((b) => b === own).length === 0
      ? neighbors.sort(
          (a, b) =>
            neighbors.filter((n) => n === b).length -
            neighbors.filter((n) => n === a).length,
        )[0]
      : own;
  };
  const bandCache = new Map<number, number>();
  const bandTile = (xx: number, yy: number) => {
    const key = (xx - x + 8) * 32 + (yy - y + 8);
    let b = bandCache.get(key);
    if (b === undefined) bandCache.set(key, (b = stableBand(xx, yy)));
    return b;
  };
  // Band of any native pixel near this tile, including a two-pixel apron into
  // the neighbours, so edges can be traced without seams at tile borders.
  const bandAt = (u: number, v: number) => {
    const cx = Math.floor((u + 8) / 16),
      cy = Math.floor((v + 8) / 16);
    const tx = mod(u + 8, 16),
      ty = mod(v + 8, 16);
    const corners = [
      bandTile(x + cx - 1, y + cy - 1),
      bandTile(x + cx, y + cy - 1),
      bandTile(x + cx - 1, y + cy),
      bandTile(x + cx, y + cy),
    ];
    let result = 0;
    for (const candidate of [1, 2, 3, 4, 5]) {
      const mask = corners.reduce(
        (m, b, i) => m | (b === candidate ? 1 << i : 0),
        0,
      );
      if (transitionPixel(mask, tx, ty)) result = candidate;
    }
    return result;
  };
  // Small authored edge offsets break a ruler-straight seam without
  // moving the underlying habitat footprint by more than two pixels.
  const steps = [0, 0, 1, 1, 0, -1, -1, 0];
  const jitter = (px: number, py: number) => {
    const wx = gx + px,
      wy = gy + py;
    return [
      steps[
        (Math.floor(wy / 3) +
          Math.floor(hash(Math.floor(wx / 32), 0, 381) * 8)) &
          7
      ],
      steps[
        (Math.floor(wx / 3) +
          Math.floor(hash(0, Math.floor(wy / 32), 383) * 8)) &
          7
      ],
    ];
  };
  const jitteredBand = (px: number, py: number) => {
    const [jx, jy] = jitter(px, py);
    return bandAt(px + jx, py + jy);
  };
  // Bands read as per-pixel thresholds of the habitat fields interpolated
  // between cell centres, so an earth patch or wet hollow has a curved edge
  // that crosses tiles instead of an eight-pixel stair. Farmed cells keep
  // the authored transition tiles.
  const ease = (t: number) => t * t * (3 - 2 * t);
  // Every pixel below reads the cells from x-1..x+1, y-1..y+1 and nothing
  // else about its neighbours, so those nine are read once per tile.
  const ring: (TopographyCell | undefined)[] = [];
  const ringHabitat: Habitat[] = [];
  const ringGround: number[][] = [];
  const ringBand: number[] = [];
  const ringFarmed: boolean[] = [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const c = sample(x + dx, y + dy),
        near = c?.habitat ?? h;
      ring.push(c);
      ringHabitat.push(near);
      ringFarmed.push(c?.feature === "field" || !!c?.field);
      if (h.site) {
        ringGround.push(habitatAppearance(near, art).ground);
        ringBand.push(habitatBand(near));
      }
    }
  const ringAt = (cx: number, cy: number) => (cy + 1) * 3 + cx + 1;
  const cornerW = [0, 0, 0, 0];
  const cornerAt = [0, 0, 0, 0];
  const rgb = [0, 0, 0],
    bands = [0, 0, 0, 0, 0, 0],
    tones: (number[] | undefined)[] = [];
  const communityPixel = (px: number, py: number) => {
    // Jittered like every other band edge: sampled straight, the winner below
    // changes along the cell lattice and the seam reads as a staircase.
    const [jx, jy] = jitter(px, py);
    const u = (px + jx + .5) / 16 - .5, v = (py + jy + .5) / 16 - .5;
    const cx = Math.floor(u), cy = Math.floor(v), tx = ease(u-cx), ty = ease(v-cy);
    rgb[0] = rgb[1] = rgb[2] = 0;
    for (let b = 0; b < 6; b++) bands[b] = 0;
    tones.length = 0;
    cornerW[0] = (1-tx)*(1-ty); cornerW[1] = tx*(1-ty); cornerW[2] = (1-tx)*ty; cornerW[3] = tx*ty;
    cornerAt[0] = ringAt(cx, cy); cornerAt[1] = ringAt(cx + 1, cy); cornerAt[2] = ringAt(cx, cy + 1); cornerAt[3] = ringAt(cx + 1, cy + 1);
    for (let k = 0; k < 4; k++) {
      const w = cornerW[k], i = cornerAt[k], ground = ringGround[i];
      const b = ringBand[i];
      bands[b]+=w;
      const t = tones[b] ?? (tones[b] = [0,0,0]);
      for(let c=0;c<3;c++) { rgb[c]+=ground[c]*w; t[c]+=ground[c]*w; }
    }
    // Heaviest band first; an equal weight keeps the lower band, as the
    // stable sort this replaces did.
    let band = -1, rival: number | undefined;
    for (let b = 0; b < 6; b++) {
      if (bands[b] <= 0) continue;
      if (band < 0) band = b;
      else if (bands[b] > bands[band]) { rival = band; band = b; }
      else if (rival === undefined || bands[b] > bands[rival]) rival = b;
    }
    // Two communities meeting get a stipple, not a ramp: within a few pixels
    // of a tie the loser wins on a hash, so the seam breaks up at pixel scale.
    if (rival !== undefined) {
      const lead = (bands[band] - bands[rival]) / (bands[band] + bands[rival]);
      if (lead < 0.34 && hash(gx + px, gy + py, 495) > 0.5 + lead * 1.47)
        band = rival;
    }
    // Snap toward the chosen band's own colour. Within one band this is a
    // no-op, so only a real community seam sharpens.
    const own = tones[band]!;
    const out = [0, 0, 0];
    for (let c = 0; c < 3; c++)
      out[c] = rgb[c] * 0.3 + (own[c] / bands[band]) * 0.7;
    return { rgb: out, band };
  };
  const smoothBand = (px: number, py: number) => {
    const u = (px + 0.5) / 16 - 0.5,
      v = (py + 0.5) / 16 - 0.5;
    const cx = Math.floor(u),
      cy = Math.floor(v);
    const tx = ease(u - cx),
      ty = ease(v - cy);
    const i0 = ringAt(cx, cy),
      i1 = ringAt(cx + 1, cy),
      i2 = ringAt(cx, cy + 1),
      i3 = ringAt(cx + 1, cy + 1);
    if (ringFarmed[i0] || ringFarmed[i1] || ringFarmed[i2] || ringFarmed[i3])
      return jitteredBand(px, py);
    if (h.site) return communityPixel(px,py).band;
    const h0 = ringHabitat[i0],
      h1 = ringHabitat[i1],
      h2 = ringHabitat[i2],
      h3 = ringHabitat[i3];
    const w0 = (1 - tx) * (1 - ty),
      w1 = tx * (1 - ty),
      w2 = (1 - tx) * ty,
      w3 = tx * ty;
    const mix = (k: "exposed" | "wet" | "cover") =>
      h0[k] * w0 + h1[k] * w1 + h2[k] * w2 + h3[k] * w3;
    const wx = gx + px,
      wy = gy + py;
    const n = (noise(wx, wy, 9, 491) - 0.5) * 0.09;
    const e = mix("exposed") + n,
      wet = mix("wet") - n * 0.6,
      cover = mix("cover");
    const grove = h.grove === undefined ? undefined :
      (h0.grove ?? 0) * w0 + (h1.grove ?? 0) * w1 + (h2.grove ?? 0) * w2 + (h3.grove ?? 0) * w3;
    const i = (tx > 0.5 ? 1 : 0) + (ty > 0.5 ? 2 : 0);
    const near = i === 0 ? h0 : i === 1 ? h1 : i === 2 ? h2 : h3;
    canopy[at(px, py)] = Math.round(cover * 255);
    return e > 0.65
      ? 3
      : e > 0.42 && !["desert", "tundra"].includes(near.ecology)
        ? 1
        : wet > 0.61
          ? 2
          : !near.vegetation &&
              near.ecology.includes("woodland") &&
              (grove === undefined || grove >= 0.6) &&
              cover > (near.layeredForest ? 0.5 : 0.56)
            ? 4
            : 0;
  };
  const grassy = !mineralGround && !frozen;
  const paintedPlants = h.lushness === undefined;
  const sparse = h.vegetation === "alpine" || h.ecology === "boreal-woodland";
  const dryGrass = h.vegetation === "savanna" || h.vegetation === "steppe" ||
    ["savanna", "dry-scrub"].includes(paletteKey(h.ecology, h.colorway));
  const lightSward = palette[1].map((v, k) =>
    Math.round(v * 0.72 + palette[3][k] * 0.28),
  );
  // Woodland floor: litter softened with the turf, not a dark slab.
  const litterTone = palette[4].map((v, k) =>
    Math.round(v * 0.55 + palette[2][k] * 0.45),
  );
  const swardTones = [
    palette[5].map((v, k) => Math.round(v * 0.65 + palette[0][k] * 0.35)),
    palette[3].map((v, k) => Math.round(v * 0.82 + lightSward[k] * 0.18)),
    palette[0].map((v, k) => Math.round(v * 0.65 + palette[6][k] * 0.35)),
    palette[6].map((v, k) => Math.round(v * 0.65 + palette[4][k] * 0.35)),
  ];
  // 18x18 apron: band per pixel, and 1 = bare earth band, 2 = trodden soil.
  const apron = new Uint8Array(18 * 18);
  /** Interpolated canopy cover per pixel, 0-255, for the shade pass. */
  const canopy = new Uint8Array(18 * 18);
  const earth = new Uint8Array(18 * 18);
  // Pixels the path pass fills: the grass edge must not draw over a road.
  const trodden = new Uint8Array(18 * 18);
  // Worn ground from the path pass, apron included, which the turf rims.
  const tread = new Uint8Array(18 * 18);
  const at = (px: number, py: number) => (py + 1) * 18 + px + 1;
  const treadWide = new Uint8Array((16 + BANK_REACH * 2) ** 2);
  const wideAt = (px: number, py: number) => (py + BANK_REACH) * (16 + BANK_REACH * 2) + px + BANK_REACH;
  for (let py = -1; py <= 16; py++)
    for (let px = -1; px <= 16; px++) {
      const b = smoothBand(px, py);
      apron[at(px, py)] = b;
      // Exposed ground, litter and tilled plots are all bare earth here.
      if (grassy && b >= 3) earth[at(px, py)] = 1;
    }
  // Plants root only on open turf at this tile's height, never on a path,
  // and thin out where people walk: round doors, hearths and work spots.
  const wild = (rx: number, ry: number) => {
    const c = sample(Math.floor(rx / 16) - ox, Math.floor(ry / 16) - oy);
    if (!c || !["grass", "damp", "dry"].includes(c.surface) || c.height !== cell.height || c.pathArt?.length ||
      c.feature || c.field || c.pavement || c.ramp || c.bridge) return 0;
    return Math.max(0, 1 - Math.max(c.tended ?? 0, c.groundWear ?? 0) * (kit?.wear ?? 1));
  };
  // The trodden field between cell centres, for the commons edge.
  const tendedGrid = kit
    ? Array.from({ length: 9 }, (_, i) => {
        const c = sample(x - 1 + (i % 3), y - 1 + Math.floor(i / 3));
        if (!c) return 0;
        // Wear stays off planted ground and on its own terrace, as in the shipped raster.
        const wear = c.height === cell.height && !["garden", "park", "verge"].includes(c.pavement ?? "") ? c.groundWear ?? 0 : 0;
        return Math.max(c.tended ?? 0, wear, c.pavement === "yard" ? 0.8 : 0);
      })
    : [];
  const trod = (wx: number, wy: number) => {
    const u = Math.min(1.999, Math.max(0, wx / 16 - ox - x + 0.5)),
      v = Math.min(1.999, Math.max(0, wy / 16 - oy - y + 0.5));
    const i = Math.floor(u),
      j = Math.floor(v),
      fx = u - i,
      fy = v - j;
    const at = (a: number, b: number) => tendedGrid[b * 3 + a];
    return (at(i, j) * (1 - fx) + at(i + 1, j) * fx) * (1 - fy) + (at(i, j + 1) * (1 - fx) + at(i + 1, j + 1) * fx) * fy;
  };
  const put = (px: number, py: number, rgb: number[], dv = 0) => {
    if (px < 0 || py < 0 || px >= 16 || py >= 16) return;
    const i = (py * 16 + px) * 4,
      c = dv ? shade(rgb, dv) : rgb;
    for (let k = 0; k < 3; k++) pixels[i + k] = c[k];
    pixels[i + 3] = 255;
  };
  const beach = beachTint(cell);
  for (let py = 0; py < 16; py++)
    for (let px = 0; px < 16; px++) {
      const wx = gx + px,
        wy = gy + py;
      const band = apron[at(px, py)];
      const tilled = band === 5;
      // Wet hollows and bare earth have their own ramp entries so they read
      // at 1x; mineral ground keeps the stone tone.
      const tone = (b: number) =>
        b === 1
          ? lightSward
          : b === 5
            ? grassy
              ? palette[3]
              : soilPalette[2]
            : b === 2 && grassy
              ? palette[7]
              : b === 3 && grassy
                ? palette[8]
                : b === 4
                  ? litterTone
                  : palette[b];
      let rgb = h.site && !tilled ? communityPixel(px,py).rgb : tone(band);
      if (beach) rgb = rgb.map((v, k) => Math.min(255, Math.round(v * beach[k])));
      // Interlocking clusters only within four native pixels of a real seam.
      // The interiors of transition tiles remain solid habitat colors.
      const other = [
        [-4, 0],
        [4, 0],
        [0, -4],
        [0, 4],
      ]
        .map(([dx, dy]) => smoothBand(px + dx, py + dy))
        .find((b) => b !== band);
      // Turf tones meet in a two-pixel checker with a darker rim on the base
      // side, so a light patch sits in the sward instead of floating on it.
      if (!h.site && grassy && band <= 2 && band !== 1) {
        const near = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ].map(([dx, dy]) => apron[at(px + dx, py + dy)]);
        if (near.some((b) => b === 1))
          rgb = rgb.map((v, k) => Math.round(v * 0.62 + palette[5][k] * 0.38));
        else if (
          (wx + wy) & 1 &&
          [
            [-2, 0],
            [2, 0],
            [0, -2],
            [0, 2],
          ].some(([dx, dy]) => smoothBand(px + dx, py + dy) === 1)
        )
          rgb = tone(1);
      }
      // Grassy ground keeps solid bands: seams are drawn as outlines below.
      if (
        !h.site && other !== undefined &&
        !grassy &&
        fringePixel(
          wx,
          wy,
          Math.floor(hash(Math.floor(wx / 9), Math.floor(wy / 11), 351) * 4),
        )
      ) {
        // Turf meets earth in a hard interlock; other seams blend.
        rgb =
          (band >= 3 || other >= 3) && !mineralGround
            ? tone(other)
            : tone(band).map((v, k) => Math.round((v + tone(other)[k]) / 2));
      }
      if (
        !h.site && h.season === "autumn" &&
        !["desert", "tropical-woodland"].includes(h.ecology)
      )
        // Turning toward gold, not toward one flat tone: red up, blue down.
        rgb = [Math.min(255, Math.round(rgb[0] * 1.08 + 6)), Math.round(rgb[1] * 0.99), Math.round(rgb[2] * 0.82)];
      if (frozen && cell.landscape?.kind === "glacier" && !tilled)
        rgb = glacierPixel(wx, wy);
      else if (frozen)
        rgb =
          band === 3 || tilled
            ? [200, 215, 242]
            : band === 2
              ? [218, 229, 248]
              : [236, 242, 252];
      if (kit && !frozen && (grassy ? band <= 2 : kitTundra && band <= 3)) {
        put(px, py, kitGroundPixel(kit, h.dry ? `${h.season}-dry` : h.season, wx, wy, wild, trod, paintedPlants));
        continue;
      }
      const style = groundStyle();
      if (style)
        rgb = styleGroundPixel(
          [...rgb],
          layerFor(
            style,
            materialOf(band, cell.surface, mineralGround, frozen),
            cell.height,
          ),
          wx,
          wy,
        );
      // Broad hard-edged patches of shade and light: living ground is never
      // one value, and a fill with marks on it reads as a fill.
      const mottling = (composition?.mottle ?? 0.65) * (paintedPlants ? 1 : 0.75);
      let shaded = false;
      if (!frozen && grassy && band <= 2 && mottling > 0) {
        // Whole stretches of turf lean sunlit or deep, a scale above the mottle.
        const broad = noise(wx, wy, 160, 607) * 0.75 + noise(wx, wy, 61, 608) * 0.25;
        const lean = broad < 0.4 ? palette[2] : broad > 0.6 ? palette[1] : undefined;
        if (lean) {
          const t = 0.34 * mottling;
          rgb = rgb.map((v, k) => Math.round(v * (1 - t) + lean[k] * t));
        }
      }
      if (!frozen && !tilled && mottling > 0) {
        // Broad terms only: an 8 px term broke the patches into blotches.
        const m = noise(wx, wy, 23, 601) * 0.7 + noise(wx, wy, 48, 602) * 0.3;
        // Two close tones, no deep step: at this patch size three read as camouflage.
        const step = (m < 0.38 ? mottle.shade : m > 0.64 ? mottle.light : 0) * 0.6;
        // Turf shades toward its own dark green: the shared shadow law leans
        // blue, which turns a green field teal.
        shaded = step < 0;
        if (step && grassy && band <= 2) {
          const to = step < 0 ? palette[2] : palette[1],
            t = (Math.abs(step) / 22) * mottling;
          rgb = rgb.map((v, k) => Math.round(v * (1 - t) + to[k] * t));
        } else if (step) rgb = shade(rgb, step * mottling * (band >= 3 ? 0.6 : 1));
      }
      if (grassy && band <= 2) {
        // Blade hatch everywhere; light grass takes a softer stroke.
        // Blades gather in clumps with calm turf between them: an even
        // hatch reads as dither noise rather than as grass.
        const clump = noise(wx, wy, 12, 611) * 0.6 + noise(wx, wy, 5, 612) * 0.4;
        let mark = swardHatch(wx, wy);
        const detail = Math.min(1, (composition?.motifDensity ?? 1) * upkeep * groveDetail *
          (h.lushness === undefined ? 1 : 0.25 + h.lushness * 0.75));
        if (tuftColony(wx, wy) < 1 - detail * 0.75 || clump < 0.74) mark = 0;
        if (mark === 2 && clump < 0.8) mark = 0;
        if (mark === 1) {
          const w = band === 1 ? 0.34 : band === 2 ? 0.55 : 0.5;
          put(
            px,
            py,
            rgb.map((v, k) => Math.round(v * (1 - w) + palette[5][k] * w)),
          );
        } else if (mark === 2 && band !== 2)
          put(
            px,
            py,
            rgb.map((v, k) => Math.round(v * 0.45 + palette[6][k] * 0.55)),
          );
        else put(px, py, rgb);
      } else if (grassy || tilled) {
        // Fine grain alone leaves a field one flat value when the camera
        // pulls back. The broad terms are what give it shape at low zoom:
        // grazed ground pales off, hollows and shaded turf go deeper.
        // In steps of the ramp, not a continuous blend: a blend reads as noise.
        const wash =
          Math.round(
            ((noise(wx, wy, 14, 469) - 0.5) * 12 +
              (noise(wx, wy, 340, 471) - 0.5) * 14 +
              (noise(wx, wy, 88, 473) - 0.5) * 8) / 6,
          ) * 6;
        const grit = hash(Math.floor(wx / 16), Math.floor(wy / 16), 613) <
          (composition?.motifDensity ?? 1) * upkeep;
        put(px, py, rgb, wash + (grit && earthSpeckle(wx, wy) ? -6 : 0));
      } else {
        const grain = hash(Math.floor(wx / 16), Math.floor(wy / 16), 613) <
          (composition?.motifDensity ?? 1) * upkeep ? materialGrain(wx, wy) : 0;
        const grainShade =
          band === 3 && !dune ? [0, -5, 4][grain] : [0, -4, 4][grain];
        put(px, py, rgb, frozen ? grainShade * 0.3 : grainShade);
      }
      // Texture describes the material: little faceted stones or composed turf.
      // No blanket of independently varied pixels behind these marks.
      const colony = tuftColony(wx, wy);
      const sward = dryGrass && band < 3;
      const motif = sward || band === 1 ? "sward"
        : tilled || (grassy && band >= 3) ? "pebble"
          : band === 3 && !dune ? "stone"
            : h.ecology === "desert" || frozen || (h.layeredForest && band === 4) ? "earth" : "turf";
      const ink =
        (!paintedPlants && (motif === "sward" || motif === "turf")) ||
        (sparse && colony < 0.56) || (sward && colony <= 0.47)
          ? 0
          : groundMotif(motif, wx, wy, art.motifs,
            motif !== "sward" && grassy && band <= 2 ? turfTuning : motifTuning);
      // Forest floor: a low-contrast dappled ground, sparse leaf marks off
      // any lattice, and fern clumps only in colonies. Nothing on the floor
      // is brighter than the turf's mid tone except one frond tip.
      if (band === 4 && !frozen) {
        const dapple =
          (noise(wx, wy, 32, 921) - 0.5) * 14 + (noise(wx, wy, 9, 923) - 0.5) * 6;
        const base = (h.site ? rgb : litterTone).map((v) => Math.round(v + dapple * (h.site ? .35 : 1)));
        put(px, py, base);
        const colony = h.grove === undefined ? hash(Math.floor(wx / 26), Math.floor(wy / 22), 925) : groveEdge(h.grove);
        // Light gaps: the mottle lifts and ordinary turf shows through.
        if (!h.site && colony > 0.86 && noise(wx, wy, 7, 927) > 0.55) {
          put(px, py, palette[0].map((v, k) => Math.round(v * 0.6 + base[k] * 0.4)));
        } else {
          const leaf = floorMark(wx, wy, 7, leafGlyphs, 0.28, 931);
          if (leaf)
            put(
              px,
              py,
              leaf === 1
                ? base.map((v) => v - 12)
                : leaf === 2
                  ? palette[4].map((v, k) => Math.round(v * 0.5 + base[k] * 0.5))
                  : palette[4].map((v) => Math.min(255, v + 6)),
            );
          if (colony > 0.5 && colony < 0.86) {
            const fern = floorMark(wx, wy, 12, [fernGlyph], 0.4, 937);
            if (fern)
              put(
                px,
                py,
                fern === 1
                  ? palette[5].map((v) => v - 6)
                  : fern === 2
                    ? palette[2]
                    : palette[0].map((v, k) => Math.round((v + palette[6][k]) / 2)),
              );
          }
        }
        continue;
      }
      if (ink) {
        const mineral = band === 3;
        if (grassy && band <= 2) {
          if (band === 1) {
            put(px, py, swardTones[ink - 1]);
            continue;
          }
          // Lit blades over a dark foot. In a shade patch the whole clump
          // drops a tone, so the shadow falls across grass and ground alike.
          const mix = (a: number[], b: number[], t: number) =>
            a.map((v, k) => Math.round(v * (1 - t) + b[k] * t));
          const seed = mix(palette[6], [244, 232, 184], 0.45);
          // Dry grass reads as sunlit straw over a dark foot; it is bleached,
          // so it stands off the ground more than green turf does.
          const tones = dryGrass
            ? shaded
              ? [mix(palette[5], [0, 0, 0], 0.3), mix(palette[5], palette[1], 0.45), palette[1], mix(seed, palette[2], 0.25)]
              : [mix(palette[5], [0, 0, 0], 0.18), palette[1], palette[6], seed]
            : shaded
              ? [mix(palette[5], [0, 0, 0], 0.12), palette[2], mix(palette[0], palette[1], 0.5), mix(seed, palette[2], 0.3)]
              : [palette[5], mix(palette[0], palette[1], 0.6), mix(palette[1], palette[6], 0.6), seed];
          put(px, py, tones[ink - 1]);
          continue;
        }
        if (tilled || (grassy && band >= 3)) {
          put(px, py, rgb, frozen ? 0 : [0, -34, -18, 8][ink]);
          continue;
        }
        const shade =
          mineral && !dune ? [0, -29, -6, 22][ink] : [0, -6, 4, 11][ink];
        put(px, py, rgb, frozen ? Math.round(shade * 0.4) : shade);
      }
    }
  // Arroyo beds are drawn from a per-pixel field interpolated across cells
  // and warped by noise, so the bed follows no tile edge. Per-cell thresholds
  // gave a staircase with a checker of 2px blocks along the margin.
  const arroyoOf = (xx: number, yy: number) => {
    const l = sample(xx, yy)?.landscape;
    return l?.kind === "arroyo" ? l.strength : 0;
  };
  const cutOf = (xx: number, yy: number) => {
    const l = sample(xx, yy)?.landscape;
    return l?.kind === "arroyo" && l.cut ? 1 : 0;
  };
  const bilinear = (f: (xx: number, yy: number) => number, xx: number, yy: number) => {
    const u = xx - 0.5,
      v = yy - 0.5;
    const cx = Math.floor(u),
      cy = Math.floor(v);
    const tx = u - cx,
      ty = v - cy;
    return (
      f(cx, cy) * (1 - tx) * (1 - ty) +
      f(cx + 1, cy) * tx * (1 - ty) +
      f(cx, cy + 1) * (1 - tx) * ty +
      f(cx + 1, cy + 1) * tx * ty
    );
  };
  const nearArroyo =
    !frozen &&
    cell.surface !== "water" &&
    Array.from({ length: 9 }, (_, i) => arroyoOf(x + (i % 3) - 1, y + Math.floor(i / 3) - 1)).some((a) => a > 0);
  if (nearArroyo) {
    const soil = soilPalette;
    const c = h.colorway;
    // Bed by colourway: a gravel wash in the Sonoran and Kalahari, a darker
    // sand wadi in the Sahara, cracked silt elsewhere.
    const wash = c === "sonoran" || c === "kalahari";
    const wadi = c === "sahara";
    for (let py = 0; py < 16; py++)
      for (let px = 0; px < 16; px++) {
        const wx = gx + px,
          wy = gy + py;
        const xx = x + (px + 0.5) / 16,
          yy = y + (py + 0.5) / 16;
        const a =
          bilinear(arroyoOf, xx, yy) +
          (noise(wx, wy, 19, 541) - 0.5) * 0.3 +
          (noise(wx, wy, 5, 543) - 0.5) * 0.08;
        if (a < 0.3) continue;
        if (a < 0.5) {
          // Margin: single grains of bed sand strewn into the turf.
          if (hash(wx, wy, 545) < (a - 0.3) * 3) put(px, py, soil[2], [0, -6, 5][materialGrain(wx, wy)]);
          continue;
        }
        const cut = bilinear(cutOf, xx, yy);
        // The bank that faces the viewer stands in shade over the bed; the
        // far one is only a thin dark lip.
        if (a < (bilinear(arroyoOf, xx, yy + 0.19) > a ? 0.6 : 0.54) && !(cut > 0.35)) {
          put(px, py, soil[0], a < 0.54 ? -4 : 6);
          trodden[at(px, py)] = 1;
          continue;
        }
        if (cut > 0.35 && a < 0.62) {
          // Low cut bank on the uphill side: dark clods along the lip.
          put(px, py, soil[hash(wx >> 1, wy >> 1, 521) < 0.5 ? 0 : 1], (noise(wx, wy, 7, 535) - 0.5) * 6);
          trodden[at(px, py)] = 1;
          continue;
        }
        // Sunk below the turf: a shade band under the bank, darker again along
        // the thalweg where damp lingers.
        const depth = Math.min(1, (a - 0.5) / 0.5);
        const lift = a < 0.58 ? -9 : -depth * 8;
        const g = materialGrain(wx, wy);
        if (wash) {
          const bed = soil[2].map((v, k) => Math.round(v * 0.85 + [150, 146, 136][k] * 0.15));
          put(px, py, bed, lift + (noise(wx, wy, 9, 537) - 0.5) * 8);
          const ink = groundMotif("pebble", wx, wy, art.motifs, { density: 1.4 + depth * 1.4, spacing: 0.7 });
          if (ink) put(px, py, soil[3], [0, -34, -18, 10][ink]);
          else if (g === 2) put(px, py, soil[1], -3);
        } else if (wadi) {
          const bed = soil[1].map((v, k) => Math.round(v * 0.75 + soil[2][k] * 0.25));
          put(px, py, bed, lift + (noise(wx, wy, 11, 527) - 0.5) * 8);
          if ((wy + Math.floor(noise(Math.floor(wx / 5), 0, 3, 539) * 3)) % 4 === 0)
            put(px, py, soil[2], 4 + lift);
        } else {
          // Greyer and darker than a trodden path, so the bed does not read as a road.
          const silt = soil[2].map((v, k) => Math.round(v * 0.62 + [146, 142, 130][k] * 0.38));
          put(px, py, silt, lift + Math.round((noise(wx, wy, 11, 527) - 0.5) * 2) * 5);
          const ink = groundMotif("pebble", wx, wy, art.motifs, { density: 1.2 + depth * 1.6, spacing: 0.8 });
          if (ink) put(px, py, silt, [0, -34, -16, 16][ink]);
        }
        trodden[at(px, py)] = 1;
      }
  }
  // Landscape features over the habitat underpainting: trodden ground and
  // trails as grouped soil dither into turf, arroyo beds as cracked silt with
  // a pebble margin, salt pans as pale cracked flats, outcrops as denser stone.
  const scape = cell.landscape;
  if (scape && !frozen && cell.surface !== "water") {
    const soil = soilPalette;
    const mixInto = (px: number, py: number, rgb: number[], t: number) => {
      const i = (py * 16 + px) * 4;
      for (let k = 0; k < 3; k++)
        pixels[i + k] = Math.round(pixels[i + k] * (1 - t) + rgb[k] * t);
    };
    for (let py = 0; py < 16; py++)
      for (let px = 0; px < 16; px++) {
        const wx = gx + px,
          wy = gy + py;
        const group = hash(Math.floor(wx / 2), Math.floor(wy / 2), 521);
        if (scape.kind === "pan") {
          const t = scape.strength;
          if (group < t * 0.9 || t > 0.8) {
            const pale = [230, 222, 204].map((v, k) => Math.round(v * 0.8 + soil[3][k] * 0.2));
            put(px, py, pale, (noise(wx, wy, 13, 531) - 0.5) * 8);
            // Polygonal cracks: the grain tile's dark strokes, sparsely.
            if (materialGrain(wx, wy) === 2 && hash(Math.floor(wx / 6), Math.floor(wy / 6), 533) > 0.25)
              put(px, py, soil[1], -4);
            trodden[at(px, py)] = 1;
          }
        } else if (scape.kind === "oasis") {
          // Damp dark sand at the pond, a ring of sedge and grass around it.
          const t = scape.strength;
          if (t > 0.45) mixInto(px, py, soil[0], 0.45);
          else if (group < 0.4 + t) mixInto(px, py, [82, 112, 50], 0.35 + t * 0.6);
          trodden[at(px, py)] = 1;
        } else if (scape.kind === "qanat") {
          // A shaft mouth in its ring of spoil, lit on the north slope.
          const r = Math.hypot(px - 7.5, (py - 8) * 1.15);
          if (r < 1.8) put(px, py, [46, 36, 28], 0);
          else if (r < 2.7) put(px, py, soil[0], -12);
          else if (r < 6) put(px, py, py < 8 ? soil[3] : soil[1], (noise(wx, wy, 5, 541) - 0.5) * 8);
          else if (r < 7.3 && group < 0.55) mixInto(px, py, soil[2], 0.55);
          if (r < 7.3) trodden[at(px, py)] = 1;
        } else if (scape.kind === "scree") {
          // Angular talus in 3 px chips: lit on top, shadowed below.
          const cx = Math.floor(wx / 3),
            cy = Math.floor(wy / 3);
          if (hash(cx, cy, 541) < scape.strength * 0.6) {
            const stone = mix(soil[4], [146, 144, 136], 0.5);
            const top = mod(wy, 3) === 0,
              foot = mod(wy, 3) === 2;
            if (mod(wx, 3) !== 2 || !foot) put(px, py, stone, top ? 18 : foot ? -26 : hash(cx, cy, 543) < 0.5 ? -6 : 4);
            trodden[at(px, py)] = 1;
          }
        } else if (scape.kind === "lava" || scape.kind === "cinder") {
          // Lava: black basalt in ropy folds, mossed over where it rains.
          // Cinders: loose red-black scoria round a cone.
          const t = scape.strength;
          if (noise(wx, wy, 9, 545) < 0.2 + t * 0.9) {
            let rgb: number[];
            if (scape.kind === "lava") {
              const fold = mod(Math.round(wy + noise(wx, wy, 14, 547) * 9), 6);
              rgb = fold === 0 ? [96, 90, 88] : fold === 1 ? [44, 40, 44] : [64, 60, 62];
              if (h.wet > 0.35 && noise(wx, wy, 19, 553) > 0.5) rgb = fold === 0 ? [138, 160, 88] : [108, 132, 72];
            } else {
              const c = hash(Math.floor(wx / 3), Math.floor(wy / 3), 549);
              rgb = c < 0.12 ? (mod(wy, 3) === 0 ? [122, 78, 62] : [52, 42, 42]) : [82, 60, 56];
            }
            put(px, py, rgb);
            trodden[at(px, py)] = 1;
          }
        } else if (scape.kind === "pavement") {
          // Limestone pavement: pale clints split by dark grikes, ferns in the cracks.
          if (group < 0.3 + scape.strength * 0.8) {
            const row = Math.floor(wy / 5);
            const gx2 = wx + (row % 2) * 4 + Math.floor(noise(wx, wy, 7, 557) * 3);
            const grike = mod(wy, 5) === 4 || mod(gx2, 8) === 0;
            put(px, py, grike ? (hash(wx, wy, 559) < 0.3 ? palette[2] : [70, 70, 66]) : mod(wy, 5) === 0 ? [214, 212, 202] : [186, 184, 174]);
            trodden[at(px, py)] = 1;
          }
        } else if (scape.kind === "outcrop") {
          const ink = groundMotif("stone", wx, wy, art.motifs, { density: 1 + scape.strength * 1.5 });
          if (ink) put(px, py, palette[3], [0, -29, -6, 22][ink]);
          else if (group < scape.strength * 0.35) mixInto(px, py, palette[3], 0.5);
        }
      }
  }
  // Bog hummocks: sphagnum mounds, rust and ochre, lit on top with a wet
  // shadow at the foot, scattered between the pools.
  if (h.colorway === "bog" && !frozen && cell.surface !== "water" && !cell.field)
    for (let py = 0; py < 16; py++)
      for (let px = 0; px < 16; px++) {
        const wx = gx + px,
          wy = gy + py;
        const bx = Math.floor(wx / 7),
          by = Math.floor(wy / 6);
        if (hash(bx, by, 571) > 0.45 || trodden[at(px, py)]) continue;
        const dx = mod(wx, 7) - 3 - (hash(bx, by, 573) - 0.5) * 2,
          dy = mod(wy, 6) - 2.5;
        const d = Math.hypot(dx / 2.6, dy / 2);
        if (d > 1) continue;
        const moss = hash(bx, by, 575) < 0.5 ? [150, 92, 64] : [168, 136, 70];
        put(px, py, dy < -0.8 ? mix(moss, [230, 210, 150], 0.3) : dy > 1 ? mix(moss, [40, 44, 36], 0.45) : moss);
      }
  // Compose material boundaries over the same habitat underpainting. Only natural
  // edges are reconstructed; raised terrain and paving keep their own outlines.
  // Trodden ground and animal trails are worn ground like a path, so they
  // borrow the path field and get the same shoulder and margin treatment.
  const wearOf = (xx: number, yy: number) => {
    const c = sample(xx, yy);
    if (!c || c.height !== cell.height || c.bridge || c.ramp || c.feature === "paving" ||
      c.field?.garden || (c.field && !(c.field.yard && c.field.crop === "pasture")) ||
      ["garden", "park", "verge"].includes(c.pavement ?? "")) return 0;
    // A canal only softens the turf at its foot: the berm in the canal tile
    // carries the transition. Full wear here bled a dirt path down both banks.
    if (c?.surface === "water" && c.waterVisual?.kind === "canal") return 0.25;
    const l = c?.landscape;
    return Math.max(c.groundWear ?? 0, l && (l.kind === "trample" || l.kind === "trail")
      ? l.strength * (l.kind === "trail" ? 0.82 : 0.95)
      : 0);
  };
  const hasWear = Array.from({ length: 9 }, (_, i) =>
    wearOf(x + (i % 3) - 1, y + Math.floor(i / 3) - 1),
  ).some((w) => w > 0);
  // Cubic B-spline weights over four cell centres. Bilinear blending left
  // diamond-shaped cores and straight lobes on the cell grid.
  const spline = (t: number) => [
    (1 - t) ** 3 / 6,
    (3 * t ** 3 - 6 * t ** 2 + 4) / 6,
    (-3 * t ** 3 + 3 * t ** 2 + 3 * t + 1) / 6,
    t ** 3 / 6,
  ];
  const wearGrid = hasWear
    ? Array.from({ length: 49 }, (_, i) => wearOf(x - 3 + (i % 7), y - 3 + Math.floor(i / 7)))
    : [];
  const wearAt = (xx: number, yy: number) => {
    const wx = (xx + ox) * 16,
      wy = (yy + oy) * 16;
    // A slow wobble of the sample point, so the edge wanders off the grid.
    const u = xx - 0.5 + (noise(wx, wy, 19, 701) - 0.5) * 0.5,
      v = yy - 0.5 + (noise(wx, wy, 19, 703) - 0.5) * 0.5;
    const cx = Math.floor(u),
      cy = Math.floor(v);
    const bx = spline(u - cx),
      by = spline(v - cy);
    let sum = 0;
    for (let j = 0; j < 4; j++)
      for (let i = 0; i < 4; i++) {
        const a = cx - 1 + i - x + 3,
          b = cy - 1 + j - y + 3;
        const w =
          a >= 0 && b >= 0 && a < 7 && b < 7
            ? wearGrid[b * 7 + a]
            : wearOf(cx - 1 + i, cy - 1 + j);
        sum += w * bx[i] * by[j];
      }
    return sum;
  };
  const hasPath =
    !!cell.pathArt?.length ||
    Array.from({ length: 9 }, (_, i) =>
      sample(x + (i % 3) - 1, y + Math.floor(i / 3) - 1),
    ).some((n) => n?.surface === "soil" && n.height === cell.height);
  const nearShore =
    !!cell.waterVisual &&
    cell.waterVisual.distance < cell.waterVisual.shoreWidth + 1.5 &&
    (!groundStyle() || shoreOnTier(sample, x, y, cell.height));
  const planted = ["garden", "park", "verge"].includes(cell.pavement ?? "");
  // A planted cell still reads its neighbours' worn ground into the apron.
  if (!frozen && paintedGround(cell) && (hasPath || hasWear || nearShore)) {
    const soil = soilPalette;
    // The apron rows exist only to mark trodden ground for the edge pass;
    // a kit's bank shading looks further out, into the wider ring.
    const reach = kit ? BANK_REACH : 1;
    for (let py = -reach; py < 16 + reach; py++)
      for (let px = -reach; px < 16 + reach; px++) {
        const ring = px < -1 || py < -1 || px > 16 || py > 16;
        // Only the strips the bank test reads: five rows north and west, three south and east.
        if (ring && ((px < -1 || px > 16) === (py < -1 || py > 16) || px > 19 || py > 19)) continue;
        const inside = px >= 0 && py >= 0 && px < 16 && py < 16;
        if (planted && inside) continue;
        const xx = x + (px + 0.5) / 16,
          yy = y + (py + 0.5) / 16,
          wx = gx + px,
          wy = gy + py;
        const routed = hasPath ? pathField(sample, xx, yy, ox, oy) : undefined;
        const wear = hasWear ? wearAt(xx, yy) : 0;
        // Trodden ground joins a path in a smooth union, not a crease, and is
        // the same earth as a footpath rather than a wide road's pale centre.
        const trod = routed?.coverage ?? 0,
          blend = Math.max(0, 0.3 - Math.abs(wear - trod)) / 0.3;
        const joined = Math.min(1, Math.max(wear, trod) + blend * blend * 0.075);
        const field =
          wear > trod
            ? { coverage: joined, radius: 0.6, cross: 0.5, ruts: false as const, dung: false as const }
            : routed && { ...routed, coverage: joined };
        if (routed?.paved && field === routed && inside) {
          const tone = blacktopPixel(routed, wx, wy, dustOf(cell.biome));
          if (tone) {
            pixels.set(tone, (py * 16 + px) * 4);
            continue;
          }
        }
        const path = field?.coverage ?? 0;
        // Two grouped hashes sum to a tapered offset of every wear threshold,
        // so turf survives a few pixels inside the road, grit strays a few
        // pixels out of it, and the interior bands interlock as well. Single
        // thresholds gave one clean contour and three ruled stripes.
        // Lumps of 4-8 px: block hashes at 2-3 px read as static on bare ground.
        const interlock =
          (noise(wx, wy, 8, 437) + noise(wx, wy, 4, 439) - 1) *
            0.08 * (composition?.pathEdgeBreakup ?? 1) +
          (noise(wx, wy, 21, 463) - 0.5) *
            0.06 * (composition?.pathEdgeBreakup ?? 1);
        // Wear is not even along a road: whole stretches sit a band lighter or
        // darker than their neighbours.
        const worn = path + interlock + (noise(wx, wy, 96, 467) - 0.5) * 0.08;
        const shoulder = 0.68 + (noise(wx, wy, 23, 377) - 0.5) * 0.055;
        if (field && worn > (grassy ? (0.48 + shoulder) / 2 : 0.48)) treadWide[wideAt(px, py)] = 1;
        if (ring) continue;
        // Dust and thinned turf beside the road: warm soil stippled into the
        // grass, thickest at the edge and gone within a few pixels. Patchy
        // along the road so it never reads as a second outline.
        if (field && grassy && !kit && inside && worn > 0.2 && worn <= 0.48) {
          const w = (worn - 0.2) / 0.28,
            patch = 0.45 + noise(wx, wy, 17, 479) * 0.9;
          if (hash(wx, wy, 481) < w * w * 0.7 * patch) {
            const i = (py * 16 + px) * 4,
              k0 = 0.22 + w * 0.3;
            for (let k = 0; k < 3; k++)
              pixels[i + k] = Math.round(
                pixels[i + k] * (1 - k0) + soil[1][k] * k0,
              );
          }
        }
        // Turf and worn ground meet at one solid edge, halfway up the shoulder,
        // which the turf rims below; a dithered shoulder frayed into specks.
        if (field && grassy && worn > 0.48 && worn < (0.48 + shoulder) / 2) continue;
        if (field && worn > 0.48) {
          tread[at(px, py)] = 1;
          if (!inside) continue;
          // One broken native pixel of contact shadow. A continuous dark rim,
          // however wide, is what made the corridor read as an outlined shape.
          const contact =
            !grassy &&
            worn < 0.515 &&
            noise(wx, wy, 6, 441) > 0.5;
          const wide = field.radius > 0.62;
          const band = contact
            ? 0
            : worn < shoulder
              ? 1
              : worn > 0.87 && wide
                ? 3
                : 2;
          let tone = soil[wide ? band : Math.max(1, band)];
          // Wide trodden ground in a meadow gets pebbles and speckle like any
          // bare earth; a footpath keeps its finer grit.
          const pebbled = grassy && wide;
          const ink = groundMotif(
            pebbled ? "pebble" : "earth",
            wx,
            wy,
            art.motifs,
            motifTuning,
          );
          // A slow wash keeps the treadway from reading as one flat fill.
          let shade =
            Math.round((noise(wx, wy, 44, 461) - 0.5) * 11 / 6) * 6 +
            (ink
              ? pebbled
                ? [0, -34, -18, 8][ink]
                : [0, -9, 4, 13][ink]
              : pebbled
                ? earthSpeckle(wx, wy)
                  ? -6
                  : 0
                : grassy
                  ? [0, -3, 4][materialGrain(wx, wy)]
                  : 0);
          // Bare ground is close in value to its own soil ramp; packing it
          // one step darker is what lets the tread read without grain.
          if (!grassy) shade -= 9;
          const finish = contact ? undefined : cell.earth;
          if (finish) [tone, shade] = finishPixel(finish, wx, wy, soil, field.cross, lipAt(sample, x, y, px, py, finish));
          const worked = !finish || finish === "beaten";
          // Cart ruts either side of the crown on wagon-width roads: a dark
          // groove with a lit lip on its outer side, broken so the pair never
          // reads as two ruled lines.
          if (worked && !kit && field.radius > 0.95 && field.ruts !== false) {
            const rut = field.cross - 0.34 - (noise(wx, wy, 19, 445) - 0.5) * 0.06;
            // A faint dip on the tread colour: the shoulder tone read as ruled lines.
            if (hash(Math.floor(wx / 8), Math.floor(wy / 8), 443) > 0.45) {
              if (rut > -0.035 && rut < 0.035) shade -= 6;
              else if (rut >= 0.035 && rut < 0.065) shade += 3;
            }
          }
          // Dung pats toward the crown, straw strands toward the edges; both
          // thicker on busy roads. Blocks keep them sparse and never touching.
          if (worked && field.dung !== false) {
            const busy = Math.min(1, field.radius / 1.4);
            const bx = Math.floor(wx / 12),
              by = Math.floor(wy / 12);
            if (field.cross < 0.55 && hash(bx, by, 491) < 0.02 + busy * 0.06) {
              const sx = bx * 12 + 2 + Math.floor(hash(bx, by, 493) * 8),
                sy = by * 12 + 2 + Math.floor(hash(bx, by, 495) * 8);
              const dx = wx - sx,
                dy = wy - sy;
              if (dx >= 0 && dy >= 0 && dx <= 1 && dy <= 1 && !(dx && dy && hash(bx, by, 497) < 0.5)) {
                tone = [84, 62, 40];
                shade = dx + dy === 0 ? 14 : dy ? -12 : 0;
              }
            }
            const qx = Math.floor(wx / 5),
              qy = Math.floor(wy / 5);
            if (hash(qx, qy, 499) < 0.03 + field.cross * 0.08 + busy * 0.04) {
              const sx = qx * 5 + 1 + Math.floor(hash(qx, qy, 501) * 3),
                sy = qy * 5 + 1 + Math.floor(hash(qx, qy, 503) * 3),
                long = 1 + Math.floor(hash(qx, qy, 505) * 2);
              const across = hash(qx, qy, 507) < 0.5;
              if (across ? wy === sy && wx >= sx && wx <= sx + long : wx === sx && wy >= sy && wy <= sy + long) {
                tone = [200, 174, 104];
                shade = (across ? wx - sx : wy - sy) === long ? -14 : 0;
              }
            }
          }
          // Grit collects off the treadway, not on it.
          if (worked && field.cross > 0.46) {
            const bx = Math.floor(wx / 7),
              by = Math.floor(wy / 6);
            if (hash(bx, by, 447) > 0.82) {
              const sx = bx * 7 + 1 + Math.floor(hash(bx, by, 449) * 4),
                sy = by * 6 + 1 + Math.floor(hash(bx, by, 451) * 3);
              if (wx >= sx && wx <= sx + 1 && wy >= sy && wy <= sy + 1) {
                tone = soil[4];
                shade = wy === sy ? 11 : -14;
              }
            }
          }
          if (frozen)
            tone = tone.map((v, k) =>
              Math.round(v * 0.45 + [204, 213, 232][k] * 0.55),
            );
          put(px, py, tone, contact ? 0 : shade);
          if (!contact) trodden[at(px, py)] = 1;
        } else if (!inside) {
          continue;
        } else if (nearShore && cell.surface !== "soil") {
          const distance = shoreDistance(sample, xx, yy, ox, oy);
          // A slow wander of about half a cell plus the fine jitter: the
          // shore line curves between cell corners without going ragged.
          const jitter =
            (noise(wx, wy, 5, 333) - 0.5) * 0.32 +
            (noise(wx, wy, 13, 339) - 0.5) * 0.7;
          const width = shoreWidth(sample, xx, yy);
          const creek = width < 1.2;
          if (creek) {
            // A creek bed: a wet dark line at the water, then a narrow band
            // of pebbles on a bed tone, then single stones straying onto the
            // turf. Stone colour follows the colourway (pebbleBed).
            const [bedTone, stoneLit, stoneDark] = pebbleBed(h.ecology, h.colorway, soilPalette, palette);
            const wander = (noise(wx, wy, 6, 341) - 0.5) * 0.3;
            const bandEdge = 0.55 + wander;
            if (distance < 0.1 + jitter * 0.08) put(px, py, shorePixel(cell, distance, wx, wy));
            else if (distance < bandEdge) {
              // Bed darkens toward the water.
              const t = Math.max(0, Math.min(1, distance / bandEdge));
              const base = bedTone.map((v, k) => Math.round(v * (0.82 + t * 0.18) + stoneDark[k] * (1 - t) * 0.12));
              put(px, py, base, (noise(wx, wy, 5, 343) - 0.5) * 8);
              const ink = groundMotif("pebble", wx, wy, art.motifs, { density: 1.9, spacing: 0.75 });
              if (ink) put(px, py, ink === 3 ? stoneLit : ink === 2 ? bedTone.map((v) => v + 6) : stoneDark);
            } else if (
              distance < bandEdge + 0.7 &&
              hash(Math.floor(wx / 6), Math.floor(wy / 5), 325) > 0.72 &&
              ((wx % 6) + 6) % 6 < 2 &&
              ((wy % 5) + 5) % 5 < 2
            )
              put(px, py, ((wy % 5) + 5) % 5 === 0 ? stoneLit : stoneDark);
          } else if (distance < width + jitter)
            put(px, py, shorePixel(cell, distance, wx, wy));
          // The turf ends in a lip: a dark undercut against the sand, then a
          // broken lit edge, with blade clumps standing along it.
          else if (!frozen && distance < width + jitter + 0.1)
            put(px, py, palette[5], -6);
          else if (
            !frozen &&
            distance < width + jitter + 0.2 &&
            hash(Math.floor(wx / 2), Math.floor(wy / 2), 336) > 0.45
          )
            put(px, py, palette[1]);
          else if (
            distance < width + jitter + 0.42 &&
            hash(Math.floor(wx / 3), Math.floor(wy / 3), 335) > 0.7
          )
            put(px, py, palette[5], 12);
        } else if (path > 0.3) {
          // Trampled verge. Turf loses color as it approaches the road instead
          // of meeting the worn ground at full strength.
          const w = ((path - 0.3) / 0.18) * (grassy ? 0.2 : 0.34);
          const i = (py * 16 + px) * 4;
          for (let k = 0; k < 3; k++)
            pixels[i + k] = Math.round(
              pixels[i + k] * (1 - w) + soil[1][k] * w,
            );
        }
      }
  }
  // Grass ends in a dark serrated border: an outline on the turf side, blades
  // of one or two pixels leaning out over the earth. Light grass blends into
  // the surrounding turf instead of receiving an island outline. Worn
  // ground gets the same edge, and sits in the turf's shadow on its north side.
  if (grassy) {
    // Planted ground is cut against paving, not worn into it: rim that edge too.
    const cut = new Uint8Array(18 * 18);
    if (planted)
      for (let q = -1; q <= 16; q++)
        for (const [px, py] of [[q, -1], [q, 16], [-1, q], [16, q]])
          if (sample(x + Math.floor(px / 16), y + Math.floor(py / 16))?.feature === "paving") cut[at(px, py)] = 1;
    const bare = (q: number) => earth[q] || tread[q] || cut[q];
    const dark = kit ? kitPalette(kit)[2] : palette[5];
    const dirs = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ];
    for (let py = 0; py < 16; py++)
      for (let px = 0; px < 16; px++) {
        const wx = gx + px,
          wy = gy + py;
        if (trodden[at(px, py)] && !tread[at(px, py)]) continue;
        const here = bare(at(px, py)),
          band = apron[at(px, py)];
        if (!here) {
          if (band > 2) continue;
          const rim = dirs.some(([dx, dy]) => bare(at(px + dx, py + dy)));
          if (rim) put(px, py, dark);
          continue;
        }
        // One-pixel teeth on straight runs only: the single direction with
        // turf behind it, both along-neighbours still earth, every third
        // pixel with a slowly drifting phase. Corners never grow teeth.
        const tooth = (qx: number, qy: number) => {
          const back = dirs.filter(
            ([dx, dy]) =>
              !bare(at(qx - dx, qy - dy)) && apron[at(qx - dx, qy - dy)] <= 2,
          );
          if (back.length !== 1) return undefined;
          const [dx, dy] = back[0];
          if (!bare(at(qx + dy, qy + dx)) || !bare(at(qx - dy, qy - dx)))
            return undefined;
          const along = dx ? gy + qy : gx + qx;
          const across = dx ? gx + qx : gy + qy;
          const phase = Math.floor(
            hash(Math.floor(along / 16), Math.floor(across / 8), 453) * 3,
          );
          return mod(along + phase, 3) === 0 ? back[0] : undefined;
        };
        // Worn ground meets buildings and seams too, where teeth would float.
        const d = earth[at(px, py)] ? tooth(px, py) : undefined;
        // A kit's path sits a little below the turf: grass leans over its
        // south and east edges in lit blades.
        if (d && kit && (d[1] === -1 || d[0] === -1)) {
          put(px, py, kitPalette(kit)[6]);
          continue;
        }
        if (d) {
          put(px, py, dark);
          continue;
        }
        // ...and its north and west banks fall into shadow, a band of darker
        // soil 3-5 px deep in blocky steps rather than a ruled line.
        const turfAt = (dx: number, dy: number) => {
          const qx = px + dx,
            qy = py + dy;
          if (qx < -1 || qy < -1 || qx > 16 || qy > 16) return !treadWide[wideAt(qx, qy)];
          return !bare(at(qx, qy)) && apron[at(qx, qy)] <= 2;
        };
        if (kit && tread[at(px, py)]) {
          const deep = 3 + Math.floor(hash(Math.floor(wx / 3), Math.floor(wy / 16), 1471) * 3);
          const side = 1 + Math.floor(hash(Math.floor(wx / 8), Math.floor(wy / 3), 1473) * 2);
          if ([1, 2, 3, 4].some((k) => k <= deep && turfAt(0, -k)) || [1, 2].some((k) => k <= side && turfAt(-k, 0))) {
            const i = (py * 16 + px) * 4;
            const lip = turfAt(0, -1) || turfAt(-1, 0) ? 0.76 : 0.86;
            for (let k = 0; k < 3; k++) pixels[i + k] = Math.round((pixels[i + k] * 0.15 + soilPalette[0][k] * 0.85) * lip);
            continue;
          }
          // The far banks are out of sight, so the tread runs up to the grass.
          if ([1, 2, 3].some((k) => turfAt(0, k) || turfAt(k, 0))) {
            const i = (py * 16 + px) * 4;
            for (let k = 0; k < 3; k++) pixels[i + k] = Math.round(pixels[i + k] * 0.3 + soilPalette[2][k] * 0.7);
          }
        }
        if (tread[at(px, py)] && [1, 2].some((k) => !bare(at(px, py - k)) && apron[at(px, py - k)] <= 2)) {
          const i = (py * 16 + px) * 4;
          for (let k = 0; k < 3; k++) pixels[i + k] = Math.round(pixels[i + k] * 0.84);
        }
        // A second pixel of depth now and then, straight behind a tooth.
        for (const [dx, dy] of dirs) {
          const bx = px - dx,
            by = py - dy;
          if (bx < -1 || by < -1 || bx > 16 || by > 16) continue;
          const root = earth[at(bx, by)] ? tooth(bx, by) : undefined;
          if (
            root &&
            root[0] === dx &&
            root[1] === dy &&
            hash(
              Math.floor((dx ? wy : wx) / 3),
              Math.floor((dx ? wx : wy) / 6),
              457,
            ) < 0.35
          ) {
            put(px, py, dark);
            break;
          }
        }
      }
  }
  // Under a closed canopy the floor sits in shade all day. Without the value
  // drop a wood reads as open ground with trees standing on it, and a clearing
  // does not read as a clearing at all. Ramped in above half cover so ordinary
  // scattered trees leave the field alone.
  if (!h.site)
    for (let py = 0; py < 16; py++)
      for (let px = 0; px < 16; px++) {
        const cover = canopy[at(px, py)] / 255;
        if (cover <= CANOPY_SHADE_FROM) continue;
        const depth = Math.min(
          1,
          (cover - CANOPY_SHADE_FROM) / (0.92 - CANOPY_SHADE_FROM),
        );
        const i = (py * 16 + px) * 4;
        // Shade cools as it deepens: less red, blue nearly held.
        pixels[i] -= Math.round(depth * 17);
        pixels[i + 1] -= Math.round(depth * 14);
        pixels[i + 2] -= Math.round(depth * 8);
      }
  // Dune crests: the exposed band in a sand sea is a ridge, lit on its
  // north-west lip and shaded where it falls away.
  //
  // Open sand holds one exposure band for miles, so that pass alone leaves a
  // flat field. The surface itself comes from a world-anchored wind field:
  // long dune bodies lit on the windward rise and dark down the slip face,
  // with fine ripples running the same way. Both headings turn slowly across
  // the map, so a dune field curves instead of ruling straight to the horizon.
  if (dune) {
    const tinge = (px: number, py: number, delta: number) => {
      const i = (py * 16 + px) * 4;
      for (let k = 0; k < 3; k++) pixels[i + k] += delta;
    };
    for (let py = 0; py < 16; py++)
      for (let px = 0; px < 16; px++) {
        const band = apron[at(px, py)];
        if (band === 3) {
          if (apron[at(px, py - 1)] < 3 || apron[at(px - 1, py)] < 3)
            put(px, py, palette[6]);
        } else if (apron[at(px, py + 1)] === 3 || apron[at(px + 1, py)] === 3)
          put(px, py, palette[5].map((v, k) => Math.round((v + palette[0][k]) / 2)));
        // Bare sand only: roads, wet wadi floors and site ground keep theirs.
        if (trodden[at(px, py)] || (band !== 0 && band !== 3)) continue;
        const wx = gx + px,
          wy = gy + py;
        // One heading for the whole field, bent by noise at three scales.
        // Turning the heading itself instead would curl the level sets into
        // bullseyes wherever the rotation doubled back on itself.
        const along =
          wx * DUNE_COS +
          wy * DUNE_SIN +
          (noise(wx, wy, 190, 811) - 0.5) * 30 +
          (noise(wx, wy, 44, 813) - 0.5) * 8 +
          (noise(wx, wy, 13, 817) - 0.5) * 2;
        const body = Math.sin((along / 76) * Math.PI * 2);
        const ripple = Math.sin((along / 5) * Math.PI * 2);
        const delta =
          Math.round(body * 6) + (ripple > 0.72 ? 7 : ripple < -0.72 ? -6 : 0);
        if (delta) tinge(px, py, delta);
      }
  }
  // Tufts lining a path margin are what make it read as worn ground rather
  // than as a filled shape. They root on the verge and lean out over the worn
  // edge, so the silhouette of the road is broken by grass, not by dithering
  // alone. Several per tile where the margin crosses it, none where it does not.
  const tuftedBase = ["desert", "tundra"].includes(h.ecology)
    ? 0
    : ["dry-scrub", "wetland"].includes(h.ecology)
      ? 0.42
      : 0.68;
  const tufted = Math.min(1, tuftedBase * (composition?.pathFringe ?? 1));
  // Colonies, not a continuous fringe: whole stretches of margin stay bare.
  const colony = hash(Math.floor(gx / 26), Math.floor(gy / 26), 431) > 0.34;
  // Bare ground inside turf gets the same fringe as a road margin: grass gives
  // out at the edge instead of the patch reading as a filled shape.
  const apronAt = (px: number, py: number) =>
    px < -1 || py < -1 || px > 16 || py > 16 ? 0 : apron[at(px, py)];
  const hasBare =
    grassy && apron.some((b) => b === 3) && apron.some((b) => b !== 3);
  const bareEdge = (px: number, py: number) =>
    apronAt(px, py) !== 3 &&
    [
      [-2, 0],
      [2, 0],
      [0, -2],
      [0, 2],
      [-1, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
    ].some(([dx, dy]) => apronAt(px + dx, py + dy) === 3);
  if (paintedPlants && (hasPath || hasWear || hasBare) && tufted && colony && h.exposed < 0.65) {
    let placed = 0;
    for (const [px, py] of [
      [2, 5],
      [8, 4],
      [13, 6],
      [5, 9],
      [11, 10],
      [1, 13],
      [7, 14],
      [14, 12],
    ]) {
      if (placed > 1) break;
      // A window straddling the boundary: the base may sit just inside the
      // worn ground, which is where an overlapping tuft comes from.
      const coverage =
        hasPath || hasWear
          ? pathField(
              sample,
              x + (px + 0.5) / 16,
              y + (py + 0.5) / 16,
              ox,
              oy,
            ).coverage
          : 0;
      const margin =
        (coverage >= 0.33 && coverage <= 0.6) || (hasBare && bareEdge(px, py));
      if (!margin || hash(gx + px, gy + py, 425) > tufted) continue;
      const glyph =
        edgeTufts[Math.floor(hash(gx + px, gy + py, 427) * edgeTufts.length)];
      const flip = hash(gx + px, gy + py, 429) > 0.5;
      // Blade body is fresher turf than the surrounding sward; the lit tip
      // stays short of the full highlight or the tufts read as straw.
      // Same tones as the sward clumps, so the verge belongs to the field.
      const tones = kit
        ? [palette[2], palette[2], palette[2].map((v, k) => Math.round((v + palette[6][k]) / 2)), palette[6]]
        : [
            palette[5],
            palette[5],
            palette[0].map((v, k) => Math.round(v * 0.4 + palette[1][k] * 0.6)),
            palette[1].map((v, k) => Math.round(v * 0.4 + palette[6][k] * 0.6)),
          ];
      for (let yy = 0; yy < glyph.length; yy++)
        for (let xx = 0; xx < glyph[yy].length; xx++) {
          const ink = Number(glyph[yy][xx]);
          if (ink)
            put(
              px + (flip ? glyph[yy].length - 1 - xx : xx) - 2,
              py + yy - 4,
              tones[ink],
            );
        }
      placed++;
    }
  }
  // Sparse authored 2–6 pixel silhouettes, leaving the majority of tiles unmarked.
  const chance = hash(x + ox, y + oy, 167);
  const accent = frozen
    ? 0.025
    : h.kind === "exposed"
      ? 0.13
      : h.kind === "hollow"
        ? 0.24
        : 0.18;
  const safeAccent =
    cell.surface !== "soil" &&
    (!cell.waterVisual ||
      cell.waterVisual.distance > cell.waterVisual.shoreWidth + 0.5);
  if (
    chance < accent &&
    safeAccent &&
    (!hasPath || pathField(sample, x + 0.5, y + 0.6, ox, oy).coverage < 0.3)
  ) {
    const px = 4 + Math.floor(hash(x + ox, y + oy, 18) * 6),
      py = 7 + Math.floor(hash(x + ox, y + oy, 19) * 5);
    const dark = palette[5],
      light = palette[6];
    const mineral = h.kind === "exposed" || h.ecology === "desert" || frozen;
    if (
      h.kind === "hollow" &&
      h.wet > 0.85 &&
      h.ecology !== "desert" &&
      !frozen &&
      chance < 0.045
    ) {
      // Authored walkable wet patch; larger standing pools belong to terrain.
      const pool = ["00111100", "01111110", "11111111", "01111110", "00111000"];
      for (let yy = 0; yy < 5; yy++)
        for (let xx = 0; xx < 8; xx++)
          if (pool[yy][xx] === "1")
            put(
              px + xx - 3,
              py + yy - 3,
              yy === 0
                ? [146, 168, 157]
                : yy === 4
                  ? [102, 120, 99]
                  : [109, 148, 146],
            );
      put(px - 1, py - 2, [174, 191, 173]);
      put(px, py - 2, [174, 191, 173]);
    } else if (h.ecology === "desert" && h.kind !== "exposed") {
      for (const [dx, dy] of [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, -1],
        [4, -1],
      ])
        put(px + dx, py + dy, palette[1], -4);
    } else if (mineral) {
      // The base pass already places readable stones inside mineral bands.
    } else if (grassy) {
      // The tuft lattice is the whole turf texture; no stray clumps.
    } else if (h.kind === "woodland") {
      for (const [dx, dy] of [
        [0, 0],
        [1, 0],
        [3, -2],
        [4, -2],
      ])
        put(px + dx, py + dy, palette[1], -6);
    } else if (paintedPlants) {
      const glyph =
        groundClumps[
          Math.floor(hash(x + ox, y + oy, 359) * groundClumps.length)
        ];
      const tones = [
        dark,
        dark,
        palette[2].map((v, k) => v + (k === 1 ? 8 : 0)),
        light,
      ];
      for (let yy = 0; yy < glyph.length; yy++)
        for (let xx = 0; xx < glyph[yy].length; xx++) {
          const ink = Number(glyph[yy][xx]);
          if (ink) put(px + xx - 3, py + yy - 6, tones[ink]);
        }
    }
  }
  // Ground beside paving: dust along the seam and a few stones come loose from
  // it, so a street ends in wear rather than a ruled line. A footway keeps
  // its kerb and gets neither.
  const pavedSide = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ].map(([dx, dy]) => {
    const n = sample(x + dx, y + dy);
    return (
      !!n &&
      n.feature === "paving" &&
      !n.bridge &&
      n.pavement !== "footway" &&
      n.height === cell.height
    );
  });
  // A verge is edged by the roadway's kerb, so it takes no dust or chips.
  if (
    pavedSide.some(Boolean) &&
    cell.surface !== "water" &&
    !frozen &&
    cell.pavement !== "verge" && cell.pavement !== "garden" && cell.pavement !== "park"
  ) {
    const dust = [176, 164, 132],
      stone = [181, 175, 152];
    for (let py = 0; py < 16; py++)
      for (let px = 0; px < 16; px++) {
        const d = Math.min(
          pavedSide[0] ? py : 99,
          pavedSide[2] ? 15 - py : 99,
          pavedSide[3] ? px : 99,
          pavedSide[1] ? 15 - px : 99,
        );
        if (d > 4) continue;
        const wx = gx + px,
          wy = gy + py,
          i = (py * 16 + px) * 4;
        const chip = hash(Math.floor(wx / 3), Math.floor(wy / 2), 541);
        if (chip < 0.16 - d * 0.03) {
          const top = mod(wy, 2) === 0;
          put(px, py, stone, top ? 8 : -10);
        } else if (d === 0 && hash(wx, wy, 543) < 0.6) {
          for (let k = 0; k < 3; k++)
            pixels[i + k] = Math.round((pixels[i + k] + dust[k]) / 2);
        }
      }
  }
  // Round a neighbouring field: the trodden buffer, the bank, then the
  // fence outside it, with weeds along the bank's foot. Post and rail is
  // a standing sprite with its foot on the fence line, so it is drawn
  // over whatever ring band its post rises across.
  if (!frozen && cell.surface !== "water") {
    const style = { ecology: h.ecology, palette };
    const facing = (dx: number, dy: number) =>
      dx < 0 ? 2 : dx > 0 ? 8 : dy < 0 ? 4 : 1;
    const cx = x + ox,
      cy = y + oy;
    // A yard's grass runs up to its fence; only farmland has a headland.
    const around = fieldsNear(sample, x, y).filter((n) => !n.field.yard);
    for (let py = 0; py < 16 && around.length; py++)
      for (let px = 0; px < 16; px++) {
        const near = nearestField(around, px, py);
        if (!near) continue;
        const wx = gx + px,
          wy = gy + py;
        const { buffer, fence } = headlandDepths(wx, wy);
        // Corner-rounded and gently waved so a field's trodden apron is not
        // a ruled rectangle.
        const { dx, dy, field } = near;
        const d =
          near.d +
          (dx && dy ? 2.5 : 0) +
          (noise(wx, wy, 10, 907) - 0.5) * 3;
        const kind = field.enclosure ?? field.boundary;
        const straight = !dx || !dy;
        const bit = facing(dx, dy);
        const stands =
          kind !== "none" &&
          straight &&
          fenceStands(field, bit, cx + dx, cy + dy);
        const horizontal = !!dy;
        if (d < buffer) {
          put(px, py, troddenPixel(wx, wy, d / buffer, style));
          continue;
        }
        if (d < buffer + BANK) {
          put(px, py, bankPixel(wx, wy, d - buffer, style));
          continue;
        }
        const i = (py * 16 + px) * 4;
        const ground = [pixels[i], pixels[i + 1], pixels[i + 2]];
        if (d < buffer + BANK + 5) {
          const weed = weedPixel(wx, wy, 0.55, style);
          if (weed) put(px, py, weed);
        }
        if (!stands || standingStyle(kind) || d < fence) continue;
        const w = fenceWidth(kind);
        const r = Math.floor(d - fence);
        if (r < 0 || r >= w) continue;
        const rowFromTop = horizontal && dy > 0 ? w - 1 - r : r;
        const e = {
          fence: bit,
          edges: 0,
          boundary: kind,
          wet: !!field.wet,
          gx,
          gy,
          palette,
          soil: tilled[h.ecology],
          motifs: art.motifs,
        };
        const rgb = bold(
          e,
          rowFromTop,
          horizontal ? wx : wy,
          false,
          horizontal ? rowFromTop : 99,
          horizontal ? 99 : rowFromTop,
          ground,
          wx,
          wy,
        );
        if (rgb) put(px, py, rgb);
      }
  }
  if (!frozen)
    paintFences(sample, x, y, ox, oy, put, (px, py, v) => {
      const i = (py * 16 + px) * 4;
      for (let k = 0; k < 3; k++) pixels[i + k] = Math.max(0, pixels[i + k] - v);
    });
  return { x, y, pixels };
}
