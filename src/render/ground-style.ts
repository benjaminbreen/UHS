import swatchData from "./generated/turf-swatches.json" with { type: "json" };
import { DEFAULT_TERRAIN_RISE, setTerrainRise } from "./terrain-projection";

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
  /** Chance of an embedded stone per face pixel. */
  stones: number;
  shadow: number;
  fringe: number;
  outline: boolean;
  brightness: number;
  contrast: number;
  /** Pixels of lift per altitude step. Presentation only: the world model
   * still counts elevation in fixed units. */
  rise: number;
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

export type CompositionStyle = {
  motifDensity: number;
  motifSpacing: number;
  motifClustering: number;
  pathWidth: number;
  pathWobble: number;
  pathEdgeBreakup: number;
  pathFringe: number;
};

export type GroundStyle = {
  contour: ContourStyle;
  materials: Record<GroundMaterial, LayerStyle>;
  /** One entry per height tier 0–3. Any field left out inherits the material. */
  tiers: Partial<LayerStyle>[];
  bank: BankStyle;
  composition?: CompositionStyle;
};

/** Altitude steps the style panel exposes a row for. */
export const MAX_TIERS = 10;

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
  // Turf texture is the authored blade hatch in the raster; the baked
  // swatches stay a lab comparison, not part of the shipped look.
  materials.turf = { ...neutralLayer, swatch: 0, opacity: 0 };
  materials.sward = { ...neutralLayer, swatch: 5, opacity: 0 };
  materials.wet = { ...neutralLayer, swatch: 7, opacity: 0 };
  materials.earth = { ...neutralLayer, opacity: 0.05 };
  // A subtle ladder: the valley floor a touch richer, each step up a little
  // paler and greyer. Texture swatches vary by step so terraces read apart
  // even where the tone difference is slight.
  const swatches = [5, 4, 5, 8, 0, 0, 7, 6, 6, 6];
  // Flat by default: a per-tier tint or swatch turned every plateau into a
  // paler block with a cell-stepped edge beside its cliff.
  const tiers: Partial<LayerStyle>[] = swatches.map((swatch) => ({
    swatch,
    opacity: 0,
    brightness: 1,
    saturation: 1,
  }));
  while (tiers.length < MAX_TIERS) tiers.push({});
  return {
    materials,
    tiers,
    contour: { wobble: 0.95, scale: 13, smoothing: 1, sides: 2 },
    composition: {
      motifDensity: 1,
      motifSpacing: 1,
      motifClustering: 1,
      pathWidth: 1,
      pathWobble: 1,
      pathEdgeBreakup: 1,
      pathFringe: 1,
    },
    bank: {
      lip: 2,
      strata: 0.95,
      lobes: 1.1,
      roots: 0.2,
      stones: 0.035,
      shadow: 6,
      fringe: 0.55,
      outline: true,
      brightness: 0.92,
      contrast: 1.15,
      rise: 20,
    },
  };
}

/** On by default, in the game as well as the labs. The worker imports this
 * module too, so both threads start from the same style; the lab posts an
 * explicit null to compare against the older renderer. */
let active: GroundStyle | undefined = defaultGroundStyle();
setTerrainRise(active.bank.rise);
export const groundStyle = () => active;
export const setGroundStyle = (style: GroundStyle | undefined) => {
  active = style;
  setTerrainRise(style?.bank.rise ?? DEFAULT_TERRAIN_RISE);
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

/** What a pixel of a bank face is made of. The caller resolves the colour,
 * because earth is the ecology's own soil rather than one shared brown. */
export type BankPixel =
  | { kind: "turf" }
  | { kind: "crease" }
  | { kind: "stone" }
  | { kind: "earth"; tone: number };

export function styledBankPixel(
  bank: BankStyle,
  faceY: number,
  drop: number,
  worldX: number,
  worldY: number,
): BankPixel {
  if (faceY < bank.lip) return { kind: "turf" };
  if (bank.outline && bank.lip && faceY === bank.lip) return { kind: "crease" };
  // Tongues of turf hanging past the lip, so the crease is never a ruled line.
  if (
    bank.fringe &&
    faceY < bank.lip + 3 &&
    noise(worldX, faceY, 71) < bank.fringe
  )
    return { kind: "turf" };
  const depth = (faceY - bank.lip) / Math.max(1, drop - bank.lip);
  // Stones sit two pixels wide, clear of the lip and the foot.
  if (
    bank.stones &&
    faceY > bank.lip + 2 &&
    faceY < drop - 2 &&
    noise(Math.floor(worldX / 2), worldY, 57) < bank.stones
  )
    return { kind: "stone" };
  // Lobe width and phase drift along the bank, or every face lines its lobes
  // up into a row of fence posts.
  const period = 5 + Math.floor(noise(Math.floor(worldX / 37), 0, 12) * 3);
  const lobe0 = Math.floor(worldX / period) * period;
  const phase = (worldX - lobe0) / period;
  const drift = noise(lobe0, Math.floor(worldY / 24), 41) * 2 - 1;
  const lobe = bank.lobes * (Math.abs(phase - 0.5) * 2 - 0.35) * 1.6;
  const strata = Math.sin(((faceY + drift * 3) / 4) * Math.PI) * bank.strata;
  let tone = 2.6 + strata - lobe - depth * 1.5;
  // Sunlit shoulder under the lip, darkest at the foot.
  if (faceY <= bank.lip + 1) tone += 1;
  if (faceY >= drop - 2) tone -= 2;
  if (noise(worldX, worldY, 33) < bank.roots) tone = 0;
  return { kind: "earth", tone: Math.max(0, Math.min(3, Math.round(tone))) };
}

/** Brightness and contrast for the bank, applied to whatever ramp it uses. */
export function toneBank(
  rgb: readonly number[],
  bank: BankStyle,
): [number, number, number] {
  return [0, 1, 2].map((k) =>
    Math.max(
      0,
      Math.min(255, (128 + (rgb[k] - 128) * bank.contrast) * bank.brightness),
    ),
  ) as [number, number, number];
}
