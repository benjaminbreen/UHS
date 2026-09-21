import {
  edgeTufts,
  earthSpeckle,
  fernGlyph,
  floorMark,
  groundMotif,
  leafGlyphs,
  materialGrain,
  turfTick,
} from "./ground-motifs";
import {
  groundStyle,
  layerFor,
  styleGroundPixel,
  type GroundMaterial,
} from "./ground-style";
import { rasterStreetTile } from "./street-raster";
import { enclosed, kerbed, pavingMask, wornEdge, VERGE } from "./paving-edge";
import { pavingGrade, pavingStonePixel } from "./paving-stones";
import { mottle, shade } from "./palette";
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
} from "./material-edges";
import {
  paletteKey,
  type Ecology,
  type PaletteKey,
} from "../content/ecology/profiles";
import type { TopographyCell, TopographySample } from "../core/topography";
import type { Habitat } from "../world/v3/habitats";
import { defaultGrassArt, type GrassArt } from "../content/graphics/grass-art";
import { waterHash as hash, waterNoise as noise } from "./water-style";
import { swardHatch } from "./ground-motifs";
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
import { habitatAppearance, communityBand } from "./habitat-appearance";
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
  "tundra:polar": ["#55524a", "#726e64", "#918d80", "#aea99b", "#aaa9a4"],
};
export const banks = Object.fromEntries(
  Object.entries(bankRamps).map(([k, v]) => [k, v.map(decode)]),
) as Record<PaletteKey, number[][]>;
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
  const id = `${h.ecology}|${h.colorway ?? ""}|${h.season ?? ""}|${h.vegetation ?? ""}|${blend}|${site}`;
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
  const street = cell.feature === "paving";
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
      under = { ...cell, feature: undefined, streetMaterial: undefined, pavement: undefined, surface: n.surface, habitat: cell.habitat ?? n.habitat };
    if (!street && !lane && n?.feature === "paving") lane = n;
  }
  if (street && under === cell) return rasterStreetTile(sample, x, y, ox, oy);
  const top = street ? rasterStreetTile(sample, x, y, ox, oy).pixels : undefined;
  const tile = rasterGroundTile(sample, x, y, ox, oy, art, under);
  const pixels = tile.pixels;
  const { soilPalette: soil } = habitatRamps(under.habitat!, art);
  const gx = (x + ox) * 16,
    gy = (y + oy) * 16;
  for (let py = 0; py < 16; py++)
    for (let px = 0; px < 16; px++) {
      const i = (py * 16 + px) * 4,
        d = mask(px, py);
      if (d >= 0) {
        if (top) pixels.set(top.subarray(i, i + 4), i);
        else if (lane) {
          // A fillet in a ground cell: sunk edge stones of the street beside it.
          const stone = pavingStonePixel(gx + px, gy + py, lane.streetMaterial ?? "slab", pavingGrade(lane.pavement));
          pixels.set(d < 1 ? [169, 156, 121] : stone.map((n) => n - 8), i);
        }
        continue;
      }
      if (d < -VERGE) continue;
      // Verge: packed earth against the stones, breaking up into the turf.
      const grit = hash(gx + px, gy + py, 883),
        keep = d > -1.2 ? 1 : d > -2.6 ? 0.8 : d > -3.6 ? 0.42 : 0.16;
      if (grit > keep) continue;
      const tone = d > -1.2 ? soil[1] : soil[grit < keep * 0.35 ? 3 : 2];
      pixels[i] = tone[0];
      pixels[i + 1] = tone[1];
      pixels[i + 2] = tone[2];
    }
  return tile;
}
function rasterGroundTile(
  sample: TopographySample,
  x: number,
  y: number,
  ox: number,
  oy: number,
  art: GrassArt,
  cell: TopographyCell,
): GroundTileData {
  // Yard grass is the same turf as outside the fence; only beds are tilled.
  if (cell.field && !(cell.field.yard && cell.field.crop === "pasture"))
    return rasterFieldTile(sample, x, y, ox, oy, art);
  const h = cell.habitat!;
  const { palette, soilPalette } = habitatRamps(h, art);
  const pixels = new Uint8ClampedArray(16 * 16 * 4);
  const gx = (x + ox) * 16,
    gy = (y + oy) * 16;
  const composition = groundStyle()?.composition;
  const motifTuning = composition
    ? {
        density: composition.motifDensity,
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
    density: (motifTuning?.density ?? 1) * (0.45 + lush * 0.75),
  };
  // Grassy ecologies expose brown earth; dry and cold ones expose stone.
  const mineralGround = h.site ? ["rocky", "barren", "shore"].includes(h.site.primary) : h.vegetation === "alpine" || ["desert", "tundra"].includes(h.ecology);
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
      : a.site ? communityBand[a.site.primary] : a.exposed > 0.65
        ? 3
        : a.exposed > 0.4 &&
            !["desert", "tundra"].includes(a.ecology) &&
            nearBareGround(a.ecology, xx, yy)
          ? 1
          : a.wet > 0.61
            ? 2
            : !a.vegetation && a.ecology.includes("woodland") &&
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
  const appearances = new Map<string, ReturnType<typeof habitatAppearance>>();
  const communityPixel = (px: number, py: number) => {
    // Jittered like every other band edge: sampled straight, the winner below
    // changes along the cell lattice and the seam reads as a staircase.
    const [jx, jy] = jitter(px, py);
    const u = (px + jx + .5) / 16 - .5, v = (py + jy + .5) / 16 - .5;
    const cx = Math.floor(u), cy = Math.floor(v), tx = ease(u-cx), ty = ease(v-cy);
    const rgb = [0,0,0], bands = [0,0,0,0,0,0];
    const tones: (number[] | undefined)[] = [];
    for (const [dx,dy,w] of [[0,0,(1-tx)*(1-ty)],[1,0,tx*(1-ty)],[0,1,(1-tx)*ty],[1,1,tx*ty]]) {
      const nx=x+cx+dx, ny=y+cy+dy, near=sample(nx,ny)?.habitat ?? h;
      const key=`${nx},${ny}`;
      let a=appearances.get(key);
      if (!a) { a=habitatAppearance(near,art); appearances.set(key,a); }
      const b = near.site ? communityBand[near.site.primary] : 0;
      bands[b]+=w;
      const t = tones[b] ?? (tones[b] = [0,0,0]);
      for(let c=0;c<3;c++) { rgb[c]+=a.ground[c]*w; t[c]+=a.ground[c]*w; }
    }
    const ranked = [0,1,2,3,4,5]
      .filter((b) => bands[b] > 0)
      .sort((a, b) => bands[b] - bands[a]);
    let band = ranked[0];
    // Two communities meeting get a stipple, not a ramp: within a few pixels
    // of a tie the loser wins on a hash, so the seam breaks up at pixel scale.
    const rival = ranked[1];
    if (rival !== undefined) {
      const lead = (bands[band] - bands[rival]) / (bands[band] + bands[rival]);
      if (lead < 0.34 && hash(gx + px, gy + py, 495) > 0.5 + lead * 1.47)
        band = rival;
    }
    // Snap toward the chosen band's own colour. Within one band this is a
    // no-op, so only a real community seam sharpens.
    const own = tones[band]!;
    for (let c = 0; c < 3; c++)
      rgb[c] = rgb[c] * 0.3 + (own[c] / bands[band]) * 0.7;
    return { rgb, band };
  };
  const smoothBand = (px: number, py: number) => {
    const u = (px + 0.5) / 16 - 0.5,
      v = (py + 0.5) / 16 - 0.5;
    const cx = Math.floor(u),
      cy = Math.floor(v);
    const tx = ease(u - cx),
      ty = ease(v - cy);
    const cells = [
      sample(x + cx, y + cy),
      sample(x + cx + 1, y + cy),
      sample(x + cx, y + cy + 1),
      sample(x + cx + 1, y + cy + 1),
    ];
    if (cells.some((c) => c?.feature === "field" || c?.field))
      return jitteredBand(px, py);
    if (h.site) return communityPixel(px,py).band;
    const hs = cells.map((c) => c?.habitat ?? h);
    const w = [(1 - tx) * (1 - ty), tx * (1 - ty), (1 - tx) * ty, tx * ty];
    const mix = (k: "exposed" | "wet" | "cover") =>
      hs[0][k] * w[0] + hs[1][k] * w[1] + hs[2][k] * w[2] + hs[3][k] * w[3];
    const wx = gx + px,
      wy = gy + py;
    const n = (noise(wx, wy, 9, 491) - 0.5) * 0.09;
    const e = mix("exposed") + n,
      wet = mix("wet") - n * 0.6,
      cover = mix("cover");
    const i = (tx > 0.5 ? 1 : 0) + (ty > 0.5 ? 2 : 0);
    const near = hs[i];
    canopy[at(px, py)] = Math.round(cover * 255);
    return e > 0.65
      ? 3
      : e > 0.42 && !["desert", "tundra"].includes(near.ecology)
        ? 1
        : wet > 0.61
          ? 2
          : !near.vegetation &&
              near.ecology.includes("woodland") &&
              cover > (near.layeredForest ? 0.5 : 0.56)
            ? 4
            : 0;
  };
  const grassy = !mineralGround && !frozen;
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
  ];
  // 18x18 apron: band per pixel, and 1 = bare earth band, 2 = trodden soil.
  const apron = new Uint8Array(18 * 18);
  /** Interpolated canopy cover per pixel, 0-255, for the shade pass. */
  const canopy = new Uint8Array(18 * 18);
  const earth = new Uint8Array(18 * 18);
  // Pixels the path pass fills: the grass edge must not draw over a road.
  const trodden = new Uint8Array(18 * 18);
  const at = (px: number, py: number) => (py + 1) * 18 + px + 1;
  for (let py = -1; py <= 16; py++)
    for (let px = -1; px <= 16; px++) {
      const b = smoothBand(px, py);
      apron[at(px, py)] = b;
      // Exposed ground, litter and tilled plots are all bare earth here.
      if (grassy && b >= 3) earth[at(px, py)] = 1;
    }
  const put = (px: number, py: number, rgb: number[], dv = 0) => {
    if (px < 0 || py < 0 || px >= 16 || py >= 16) return;
    const i = (py * 16 + px) * 4,
      c = dv ? shade(rgb, dv) : rgb;
    for (let k = 0; k < 3; k++) pixels[i + k] = c[k];
    pixels[i + 3] = 255;
  };
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
        rgb = rgb.map((v, k) => Math.round(v * 0.88 + palette[1][k] * 0.12));
      if (frozen)
        rgb =
          band === 3 || tilled
            ? [181, 194, 191]
            : band === 2
              ? [195, 208, 204]
              : [215, 223, 207];
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
      const mottling = composition?.mottle ?? 0.65;
      let shaded = false;
      if (!frozen && !tilled && mottling > 0) {
        const m =
          noise(wx, wy, 23, 601) * 0.62 +
          noise(wx, wy, 8, 602) * 0.38 +
          (hash(wx >> 1, wy >> 1, 603) - 0.5) * 0.05;
        const step =
          m < 0.3 ? mottle.deep : m < 0.41 ? mottle.shade : m > 0.61 ? mottle.light : 0;
        // Turf shades toward its own dark green: the shared shadow law leans
        // blue, which turns a green field teal.
        shaded = step < 0;
        if (step && grassy && band <= 2) {
          const to = step < 0 ? palette[2] : palette[1],
            t = (Math.abs(step) / 34) * mottling;
          rgb = rgb.map((v, k) => Math.round(v * (1 - t) + to[k] * t));
        } else if (step) rgb = shade(rgb, step * mottling * (band >= 3 ? 0.6 : 1));
      }
      if (grassy && band <= 2) {
        // Blade hatch everywhere; light grass takes a softer stroke.
        // Blades gather in clumps with calm turf between them: an even
        // hatch reads as dither noise rather than as grass.
        const clump = noise(wx, wy, 12, 611) * 0.6 + noise(wx, wy, 5, 612) * 0.4;
        let mark = swardHatch(wx, wy);
        if (mark === 1 && clump < 0.5 && hash(wx, wy, 613) > 0.1) mark = 0;
        if (mark === 2 && clump < 0.56) mark = 0;
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
        else put(px, py, rgb, turfTick(wx, wy, art.motifs) ? 7 : 0);
      } else if (grassy || tilled) {
        // Fine grain alone leaves a field one flat value when the camera
        // pulls back. The broad terms are what give it shape at low zoom:
        // grazed ground pales off, hollows and shaded turf go deeper.
        const wash = Math.round(
          (noise(wx, wy, 14, 469) - 0.5) * 12 +
            (noise(wx, wy, 340, 471) - 0.5) * 14 +
            (noise(wx, wy, 88, 473) - 0.5) * 8,
        );
        put(px, py, rgb, wash + (earthSpeckle(wx, wy) ? -10 : 0));
      } else {
        const grain = materialGrain(wx, wy);
        const grainShade =
          band === 3 && !dune ? [0, -9, 7][grain] : [0, -7, 8][grain];
        put(px, py, rgb, frozen ? grainShade * 0.3 : grainShade);
      }
      // Texture describes the material: little faceted stones or composed turf.
      // No blanket of independently varied pixels behind these marks.
      const sparse = h.vegetation === "alpine" || h.ecology === "boreal-woodland";
      const colony = hash(Math.floor(wx / 37), Math.floor(wy / 29), 941);
      const ink =
        sparse && colony < 0.65 ? 0 :
        (h.vegetation === "savanna" || h.vegetation === "steppe") && band < 3
          ? (colony > 0.32 ? groundMotif("sward", wx, wy, art.motifs, motifTuning) : 0)
          : band === 1
          ? groundMotif("sward", wx, wy, undefined, motifTuning)
          : groundMotif(
              tilled || (grassy && band >= 3)
                ? "pebble"
                : band === 3 && !dune
                  ? "stone"
                  : h.ecology === "desert" ||
                      frozen ||
                      (h.layeredForest && band === 4)
                    ? "earth"
                    : "turf",
              wx,
              wy,
              art.motifs,
              grassy && band <= 2 ? turfTuning : motifTuning,
            );
      // Forest floor: a low-contrast dappled ground, sparse leaf marks off
      // any lattice, and fern clumps only in colonies. Nothing on the floor
      // is brighter than the turf's mid tone except one frond tip.
      if (band === 4 && !frozen) {
        const dapple =
          (noise(wx, wy, 32, 921) - 0.5) * 14 + (noise(wx, wy, 9, 923) - 0.5) * 6;
        const base = (h.site ? rgb : litterTone).map((v) => Math.round(v + dapple * (h.site ? .35 : 1)));
        put(px, py, base);
        const colony = hash(Math.floor(wx / 26), Math.floor(wy / 22), 925);
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
          const tones = shaded
            ? [mix(palette[5], [0, 0, 0], 0.12), palette[2], mix(palette[0], palette[1], 0.5)]
            : [palette[5], mix(palette[0], palette[1], 0.6), mix(palette[1], palette[6], 0.6)];
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
        if (scape.kind === "arroyo") {
          // Bed by colourway: a gravel wash in the Sonoran and Kalahari, a
          // darker sand wadi in the Sahara, cracked silt elsewhere.
          const c = h.colorway;
          const wash = c === "sonoran" || c === "kalahari";
          const wadi = c === "sahara";
          if (scape.cut && scape.strength < 0.9 && group < 0.7) {
            // Low cut bank on the uphill side: dark clods along the lip.
            put(px, py, soil[group < 0.35 ? 0 : 1], (noise(wx, wy, 7, 535) - 0.5) * 6);
            trodden[at(px, py)] = 1;
          } else if (scape.strength >= 0.5) {
            const g = materialGrain(wx, wy);
            if (wash) {
              // Gravel: pebbles everywhere on a grey-brown bed.
              const bed = soil[2].map((v, k) => Math.round(v * 0.85 + [150, 146, 136][k] * 0.15));
              put(px, py, bed, (noise(wx, wy, 9, 537) - 0.5) * 8);
              const ink = groundMotif("pebble", wx, wy, art.motifs, { density: 2.2, spacing: 0.7 });
              if (ink) put(px, py, soil[3], [0, -34, -18, 10][ink]);
              else if (g === 2) put(px, py, soil[1], -3);
            } else if (wadi) {
              // Wadi: darker, damp-looking sand with ripples, no stones.
              const bed = soil[1].map((v, k) => Math.round(v * 0.75 + soil[2][k] * 0.25));
              put(px, py, bed, (noise(wx, wy, 11, 527) - 0.5) * 8);
              if ((wy + Math.floor(noise(Math.floor(wx / 5), 0, 3, 539) * 3)) % 4 === 0)
                put(px, py, soil[2], 4);
            } else {
              // Bed: pale silt, dried cracks, a stone or two.
              const silt = soil[3].map((v, k) => Math.round(v * 0.8 + palette[1][k] * 0.2));
              put(px, py, silt, (noise(wx, wy, 11, 527) - 0.5) * 10);
              if (g === 1 && hash(Math.floor(wx / 8), Math.floor(wy / 8), 529) > 0.3)
                put(px, py, soil[1]);
              const ink = groundMotif("pebble", wx, wy, art.motifs);
              if (ink) put(px, py, soil[2], [0, -30, -14, 10][ink]);
            }
            trodden[at(px, py)] = 1;
          } else {
            const t = (scape.strength - 0.2) / 0.3;
            if (t > 0 && group < t * 0.7) put(px, py, soil[2], [0, -6, 5][materialGrain(wx, wy)]);
          }
        } else if (scape.kind === "pan") {
          const t = scape.strength;
          if (group < t * 0.9 || t > 0.8) {
            const pale = [230, 222, 204].map((v, k) => Math.round(v * 0.8 + soil[3][k] * 0.2));
            put(px, py, pale, (noise(wx, wy, 13, 531) - 0.5) * 8);
            // Polygonal cracks: the grain tile's dark strokes, sparsely.
            if (materialGrain(wx, wy) === 2 && hash(Math.floor(wx / 6), Math.floor(wy / 6), 533) > 0.25)
              put(px, py, soil[1], -4);
            trodden[at(px, py)] = 1;
          }
        } else if (scape.kind === "outcrop") {
          const ink = groundMotif("stone", wx, wy, art.motifs, { density: 1 + scape.strength * 1.5 });
          if (ink) put(px, py, palette[3], [0, -29, -6, 22][ink]);
          else if (group < scape.strength * 0.35) mixInto(px, py, palette[3], 0.5);
        }
      }
  }
  // Compose material boundaries over the same habitat underpainting. Only natural
  // edges are reconstructed; raised terrain and paving keep their own outlines.
  // Trodden ground and animal trails are worn ground like a path, so they
  // borrow the path field and get the same shoulder and margin treatment.
  const wearOf = (xx: number, yy: number) => {
    const c = sample(xx, yy);
    // A canal only softens the turf at its foot: the berm in the canal tile
    // carries the transition. Full wear here bled a dirt path down both banks.
    if (c?.surface === "water" && c.waterVisual?.kind === "canal") return 0.25;
    const l = c?.landscape;
    return l && (l.kind === "trample" || l.kind === "trail")
      ? l.strength * (l.kind === "trail" ? 0.82 : 0.95)
      : 0;
  };
  const hasWear = Array.from({ length: 9 }, (_, i) =>
    wearOf(x + (i % 3) - 1, y + Math.floor(i / 3) - 1),
  ).some((w) => w > 0);
  const wearAt = (xx: number, yy: number) => {
    const u = xx - 0.5,
      v = yy - 0.5;
    const cx = Math.floor(u),
      cy = Math.floor(v);
    const tx = u - cx,
      ty = v - cy;
    return (
      wearOf(cx, cy) * (1 - tx) * (1 - ty) +
      wearOf(cx + 1, cy) * tx * (1 - ty) +
      wearOf(cx, cy + 1) * (1 - tx) * ty +
      wearOf(cx + 1, cy + 1) * tx * ty
    );
  };
  const hasPath =
    !!cell.pathArt?.length ||
    Array.from({ length: 9 }, (_, i) =>
      sample(x + (i % 3) - 1, y + Math.floor(i / 3) - 1),
    ).some((n) => n?.surface === "soil" && n.height === cell.height);
  const nearShore =
    !!cell.waterVisual &&
    cell.waterVisual.distance < cell.waterVisual.shoreWidth + 1.5 &&
    (!groundStyle() || shoreOnTier(sample, x, y));
  if (paintedGround(cell) && (hasPath || hasWear || nearShore)) {
    const soil = soilPalette;
    // The apron rows exist only to mark trodden ground for the edge pass.
    for (let py = -1; py <= 16; py++)
      for (let px = -1; px <= 16; px++) {
        const inside = px >= 0 && py >= 0 && px < 16 && py < 16;
        const xx = x + (px + 0.5) / 16,
          yy = y + (py + 0.5) / 16,
          wx = gx + px,
          wy = gy + py;
        const routed = hasPath ? pathField(sample, xx, yy, ox, oy) : undefined;
        const wear = hasWear ? wearAt(xx, yy) : 0;
        const field =
          wear > (routed?.coverage ?? 0)
            ? { coverage: wear, radius: 0.7, cross: 0.5 }
            : routed;
        const path = field?.coverage ?? 0;
        // Two grouped hashes sum to a tapered offset of every wear threshold,
        // so turf survives a few pixels inside the road, grit strays a few
        // pixels out of it, and the interior bands interlock as well. Single
        // thresholds gave one clean contour and three ruled stripes.
        const interlock =
          (hash(Math.floor(wx / 2), Math.floor(wy / 2), 437) +
            hash(Math.floor(wx / 3), Math.floor(wy / 3), 439) -
            1) *
            0.08 * (composition?.pathEdgeBreakup ?? 1) +
          (noise(wx, wy, 21, 463) - 0.5) *
            0.06 * (composition?.pathEdgeBreakup ?? 1);
        // Wear is not even along a road: whole stretches sit a band lighter or
        // darker than their neighbours.
        const worn = path + interlock + (noise(wx, wy, 96, 467) - 0.5) * 0.08;
        const shoulder = 0.68 + (noise(wx, wy, 23, 377) - 0.5) * 0.055;
        // Dust and thinned turf beside the road: warm soil stippled into the
        // grass, thickest at the edge and gone within a few pixels. Patchy
        // along the road so it never reads as a second outline.
        if (field && grassy && inside && worn > 0.2 && worn <= 0.48) {
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
        // On turf the worn centre is narrower than the material boundary:
        // the shoulder is a dither of soil into grass, not a filled band.
        if (field && grassy && worn > 0.48 && worn < shoulder) {
          if (!inside) continue;
          const w = (worn - 0.48) / (shoulder - 0.48);
          if (hash(wx, wy, 471) < w * 0.85) {
            const wash = Math.round((noise(wx, wy, 44, 461) - 0.5) * 11);
            put(px, py, soil[1], wash + [0, -5, 6][materialGrain(wx, wy)]);
          } else {
            const i = (py * 16 + px) * 4,
              k0 = 0.2 + w * 0.3;
            for (let k = 0; k < 3; k++)
              pixels[i + k] = Math.round(
                pixels[i + k] * (1 - k0) + soil[3][k] * k0,
              );
          }
          continue;
        }
        if (field && worn > 0.48) {
          if (!inside) continue;
          // One broken native pixel of contact shadow. A continuous dark rim,
          // however wide, is what made the corridor read as an outlined shape.
          const contact =
            !grassy &&
            worn < 0.515 &&
            hash(Math.floor(wx / 3), Math.floor(wy / 3), 441) > 0.5;
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
          );
          // A slow wash keeps the treadway from reading as one flat fill.
          let shade =
            Math.round((noise(wx, wy, 44, 461) - 0.5) * 11) +
            (ink
              ? pebbled
                ? [0, -34, -18, 8][ink]
                : [0, -9, 4, 13][ink]
              : pebbled
                ? earthSpeckle(wx, wy)
                  ? -10
                  : 0
                : [0, -5, 6][materialGrain(wx, wy)]);
          // Cart ruts either side of the crown on wagon-width roads, dashed so
          // they never read as two ruled lines.
          if (
            field.radius > 0.95 &&
            field.cross > 0.4 &&
            field.cross < 0.55 &&
            hash(Math.floor(wx / 4), Math.floor(wy / 5), 443) > 0.58
          )
            shade -= 6;
          // Grit collects off the treadway, not on it.
          if (field.cross > 0.46) {
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
              Math.round(v * 0.45 + [196, 204, 202][k] * 0.55),
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
  // the surrounding turf instead of receiving an island outline.
  if (grassy) {
    const dark = palette[5];
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
        if (trodden[at(px, py)]) continue;
        const here = earth[at(px, py)],
          band = apron[at(px, py)];
        if (!here) {
          if (band > 2) continue;
          const rim = dirs.some(([dx, dy]) => earth[at(px + dx, py + dy)]);
          if (rim) put(px, py, dark);
          continue;
        }
        // One-pixel teeth on straight runs only: the single direction with
        // turf behind it, both along-neighbours still earth, every third
        // pixel with a slowly drifting phase. Corners never grow teeth.
        const tooth = (qx: number, qy: number) => {
          const back = dirs.filter(
            ([dx, dy]) =>
              !earth[at(qx - dx, qy - dy)] && apron[at(qx - dx, qy - dy)] <= 2,
          );
          if (back.length !== 1) return undefined;
          const [dx, dy] = back[0];
          if (!earth[at(qx + dy, qy + dx)] || !earth[at(qx - dy, qy - dx)])
            return undefined;
          const along = dx ? gy + qy : gx + qx;
          const across = dx ? gx + qx : gy + qy;
          const phase = Math.floor(
            hash(Math.floor(along / 16), Math.floor(across / 8), 453) * 3,
          );
          return mod(along + phase, 3) === 0 ? back[0] : undefined;
        };
        const d = tooth(px, py);
        if (d) {
          put(px, py, dark);
          continue;
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
  if ((hasPath || hasWear || hasBare) && tufted && colony && h.exposed < 0.65) {
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
      const tones = [
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
    } else {
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
    cell.pavement !== "verge"
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
