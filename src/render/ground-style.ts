import swatchData from "./generated/turf-swatches.json" with { type: "json" };

/** Experimental restyling of ground and banks, shared by the main thread and
 * the terrain worker. Off by default: with no style set every raster keeps its
 * existing output byte for byte. */

/** Material classes the habitat raster already distinguishes. Styling these
 * rather than ecologies means one swatch choice applies across every biome
 * that uses the material, in that biome's own palette. */
export const groundMaterials = [
  "turf",
  "sward",
  "wet",
  "earth",
  "litter",
  "tilled",
  "sand",
  "snow",
  "stone",
] as const;
export type GroundMaterial = (typeof groundMaterials)[number];

export type LayerStyle = {
  /** Index into the baked GRASS+ swatches, or -1 for no texture overlay. */
  swatch: number;
  opacity: number;
  contrast: number;
  brightness: number;
  saturation: number;
};

export type BankStyle = {
  lip: number;
  strata: number;
  lobes: number;
  roots: number;
  shadow: number;
  fringe: number;
  outline: boolean;
  brightness: number;
  contrast: number;
};

export type ContourStyle = {
  /** How far, in tiers, the drawn edge may stray from the interpolated one. */
  wobble: number;
  scale: number;
  /** Radius of the modal filter that removes one-pixel islands. */
  smoothing: number;
  /** Pixels of exposed earth drawn along a west/east/north rim. */
  sides: number;
};

export type GroundStyle = {
  contour: ContourStyle;
  materials: Record<GroundMaterial, LayerStyle>;
  /** One entry per height tier 0–3. Any field left out inherits the material. */
  tiers: Partial<LayerStyle>[];
  bank: BankStyle;
};

export const neutralLayer: LayerStyle = {
  swatch: -1,
  opacity: 0,
  contrast: 1,
  brightness: 1,
  saturation: 1,
};

/** Tuned in the terrain lab; exported from the panel as JSON. */
export function defaultGroundStyle(): GroundStyle {
  const materials = Object.fromEntries(
    groundMaterials.map((m) => [m, { ...neutralLayer }]),
  ) as Record<GroundMaterial, LayerStyle>;
  materials.turf = { ...neutralLayer, swatch: 0, opacity: 0.5 };
  materials.sward = { ...neutralLayer, swatch: 5, opacity: 0.35 };
  materials.wet = { ...neutralLayer, swatch: 7, opacity: 0 };
  return {
    materials,
    tiers: [
      { swatch: 5, opacity: 0, contrast: 0.9, brightness: 0.96 },
      { swatch: 4, opacity: 0.2 },
      { swatch: 5, opacity: 0.35 },
      {},
    ],
    contour: { wobble: 0.65, scale: 14, smoothing: 0, sides: 1 },
    bank: {
      lip: 1,
      strata: 0.85,
      lobes: 0.8,
      roots: 0.17,
      shadow: 9,
      fringe: 0.45,
      outline: true,
      brightness: 0.92,
      contrast: 1,
    },
  };
}

let active: GroundStyle | undefined;
export const groundStyle = () => active;
export const setGroundStyle = (style: GroundStyle | undefined) => {
  active = style;
};

const TILE = swatchData.tile;
const SWATCHES = swatchData.swatches;
export const swatchCount = SWATCHES.length;

/** Ordered dither. A hash would stipple flat ground with noise; a Bayer screen
 * lets a fractional swatch strength read as texture instead of grain. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export function layerFor(
  style: GroundStyle,
  material: GroundMaterial,
  tier: number,
): LayerStyle {
  return { ...style.materials[material], ...(style.tiers[tier] ?? {}) };
}

/** Push a colour along its own light/dark axis by the swatch weave, then apply
 * the layer's tone controls. Working in place keeps the raster allocation-free. */
export function styleGroundPixel(
  rgb: number[],
  layer: LayerStyle,
  worldX: number,
  worldY: number,
) {
  let [r, g, b] = rgb;
  if (layer.swatch >= 0 && layer.opacity > 0) {
    const tile = SWATCHES[layer.swatch % SWATCHES.length];
    const mod = (n: number, m: number) => ((n % m) + m) % m;
    const l = tile[mod(worldY, TILE) * TILE + mod(worldX, TILE)] / 255;
    // ±22% of the pixel's own value: enough to read as blades without
    // overriding the ecology palette that put the colour there.
    const push = (l - 0.5) * 2 * layer.opacity * 0.22;
    const step = BAYER[worldY & 3][worldX & 3] / 16;
    const amount = push * (0.55 + step * 0.9);
    r += r * amount;
    g += g * amount;
    b += b * amount;
  }
  const luma = r * 0.3 + g * 0.59 + b * 0.11;
  const out = [r, g, b].map((c) => {
    let v = luma + (c - luma) * layer.saturation;
    v = 128 + (v - 128) * layer.contrast;
    return Math.max(0, Math.min(255, v * layer.brightness));
  });
  rgb[0] = out[0];
  rgb[1] = out[1];
  rgb[2] = out[2];
  return rgb;
}

export function contourNoise(x: number, y: number, scale: number, seed = 17) {
  const s = Math.max(1, scale);
  const gx = x / s,
    gy = y / s;
  const x0 = Math.floor(gx),
    y0 = Math.floor(gy);
  const ease = (t: number) => t * t * (3 - 2 * t);
  const fx = ease(gx - x0),
    fy = ease(gy - y0);
  const a = noise(x0, y0, seed),
    b = noise(x0 + 1, y0, seed),
    c = noise(x0, y0 + 1, seed),
    d = noise(x0 + 1, y0 + 1, seed);
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}

function noise(x: number, y: number, salt: number) {
  let h = x * 374761393 + y * 668265263 + salt * 2246822519;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Earth ramps into the shared topography palette, darkest first.
const EARTH = [14, 15, 16, 17];
const DRY = [15, 16, 17, 18];
const SNOW = [23, 24, 25, 26];

/** Bank shading over the contour rasteriser's existing silhouette: a turf lip
 * with a ragged fringe, a crease, then lobed strata down to a dark foot. The
 * geometry is untouched — only which palette entry each pixel takes. */
export function styledBankIndex(
  bank: BankStyle,
  onTop: boolean,
  near: number,
  faceY: number,
  rise: number,
  worldX: number,
  worldY: number,
  dry: boolean,
  snow: boolean,
  sand = false,
) {
  const cap = snow
    ? near === 1
      ? 26
      : 25
    : dry
      ? near === 1
        ? 10
        : 9
      : near === 1
        ? 6
        : 4;
  if (onTop) return cap;
  const turf = snow ? 25 : dry ? 9 : 4;
  if (faceY < bank.lip) return turf;
  if (bank.outline && bank.lip && faceY === bank.lip) return snow ? 23 : 14;
  // Tongues of turf hanging past the lip, so the crease is never a ruled line.
  if (
    bank.fringe &&
    faceY < bank.lip + 3 &&
    noise(worldX, faceY, 71) < bank.fringe
  )
    return turf;
  // Sand keeps its own pale ramp; ordinary dry ground still exposes earth.
  const ramp = snow ? SNOW : dry && sand ? DRY : EARTH;
  const depth = (faceY - bank.lip) / Math.max(1, rise - bank.lip);
  // Lobe width and phase drift along the bank, or every face lines its lobes
  // up into a row of fence posts.
  const period = 5 + Math.floor(noise(Math.floor(worldX / 37), 0, 12) * 3);
  const lobe0 = Math.floor(worldX / period) * period;
  const phase = (worldX - lobe0) / period;
  const drift = noise(lobe0, Math.floor(worldY / 24), 41) * 2 - 1;
  const lobe = bank.lobes * (Math.abs(phase - 0.5) * 2 - 0.35) * 1.6;
  const strata = Math.sin(((faceY + drift * 3) / 4) * Math.PI) * bank.strata;
  let i = 2.6 + strata - lobe - depth * 1.5;
  if (faceY >= rise - 2) i -= 2;
  if (noise(worldX, worldY, 33) < bank.roots) i = 0;
  return ramp[Math.max(0, Math.min(ramp.length - 1, Math.round(i)))];
}
