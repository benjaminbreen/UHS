import type { Habitat } from "../world/v3/habitats";
import type { Community } from "../content/ecology/communities";
import { paletteKey } from "../content/ecology/profiles";
import { defaultGrassArt, type GrassArt } from "../content/graphics/grass-art";
import { soils } from "./habitat-soils";

export const communityBand: Record<Community, number> = {
  water: 2,
  shore: 3,
  rocky: 3,
  barren: 3,
  grassland: 0,
  scrub: 1,
  woodland: 4,
  "riparian-woodland": 4,
  marsh: 2,
  swamp: 4,
  bog: 2,
};
/** Colour depends on these alone, and neighbouring cells almost always agree;
 * each cell holds its own Habitat object, so identity cannot be the key. */
function toneKey(h: Habitat) {
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
  return `${h.ecology}|${h.colorway ?? ""}|${h.season ?? ""}|${blend}|${site}`;
}
const toneCache = new WeakMap<GrassArt, Map<string, Appearance>>();
type Appearance = ReturnType<typeof computeAppearance>;
/** The result is shared between cells, so callers must not mutate it. */
export function habitatAppearance(h: Habitat, art: GrassArt = defaultGrassArt) {
  let cache = toneCache.get(art);
  if (!cache) toneCache.set(art, (cache = new Map()));
  const key = toneKey(h);
  let value = cache.get(key);
  if (!value) {
    value = computeAppearance(h, art);
    if (cache.size > 512) cache.clear();
    cache.set(key, value);
  }
  return value;
}
function computeAppearance(h: Habitat, art: GrassArt) {
  const parts = h.blend ?? [
    { ecology: h.ecology, colorway: h.colorway, weight: 1 },
  ];
  const mix = (a: number[], b: number[], t: number) =>
    a.map((v, i) => v * (1 - t) + b[i] * t);
  const palette = art.palettes[paletteKey(h.ecology, h.colorway)].map((_, i) =>
    [0, 1, 2].map((c) =>
      parts.reduce(
        (sum, p) =>
          sum +
          art.palettes[paletteKey(p.ecology, p.colorway)][i][c] * p.weight,
        0,
      ),
    ),
  );
  const soil = soils[paletteKey(h.ecology, h.colorway)].map((_, i) =>
    [0, 1, 2].map((c) =>
      parts.reduce(
        (sum, p) =>
          sum + soils[paletteKey(p.ecology, p.colorway)][i][c] * p.weight,
        0,
      ),
    ),
  );
  const tones: Record<Community, number[]> = {
    water: palette[7],
    shore: soil[3],
    rocky: mix(soil[4], [133, 134, 122], 0.45),
    barren: soil[2],
    grassland: palette[0],
    scrub: mix(palette[0], palette[1], 0.45),
    woodland: mix(palette[4], palette[2], 0.45),
    "riparian-woodland": mix(
      palette[2],
      art.palettes["temperate-woodland"][2],
      0.5,
    ),
    marsh: mix(palette[7], soil[4], 0.18),
    swamp: mix(palette[7], soil[0], 0.28),
    bog: mix(palette[7], soil[4], 0.45),
  };
  let ground = h.site
    ? [0, 1, 2].map((c) =>
        Object.entries(h.site!.weights).reduce(
          (sum, [id, w]) => sum + tones[id as Community][c] * w!,
          0,
        ),
      )
    : palette[0];
  const tint = wilt(h.ecology, h.season);
  if (tint) {
    // Blades and ground must turn together, or a brown autumn field keeps a
    // vivid green sward standing in it.
    const dun = mix(palette[4], palette[8], 0.4);
    for (const i of greens) palette[i] = drain(mix(palette[i], dun, tint[0]), tint[1]);
    ground = drain(mix(ground, dun, tint[0]), tint[1]);
  }
  return { palette, soil, ground: ground.map(Math.round) };
}

/** Palette rows that carry chlorophyll: base, light, dark, blade shadow, blade
 * light. The mineral, litter, wet and bare rows stay put through the year. */
const greens = [0, 1, 2, 5, 6];

// How far the sward goes toward dead-grass colour, and how much colour it
// loses, by season. A temperate meadow browns in autumn; a mediterranean or
// savanna one browns through high summer and greens up in the wet winter.
const cycles: Record<string, [number, number][]> = {
  temperate: [
    [0, 0],
    [0.12, 0.04],
    [0.38, 0.12],
    [0.34, 0.3],
  ],
  dry: [
    [0.08, 0],
    [0.46, 0.12],
    [0.3, 0.08],
    [0, 0],
  ],
  cold: [
    [0, 0],
    [0.08, 0],
    [0.3, 0.1],
    [0.22, 0.35],
  ],
};
const order = ["spring", "summer", "autumn", "winter"];
const cycleOf: Record<string, keyof typeof cycles | undefined> = {
  grassland: "temperate",
  "temperate-woodland": "temperate",
  wetland: "temperate",
  savanna: "dry",
  "dry-scrub": "dry",
  "boreal-woodland": "cold",
  tundra: "cold",
};
function wilt(ecology: string, season: string) {
  const cycle = cycleOf[ecology];
  const i = order.indexOf(season);
  if (!cycle || i < 0) return undefined;
  const step = cycles[cycle][i];
  return step[0] || step[1] ? step : undefined;
}
/** Pull a colour toward its own luminance. */
function drain(c: number[], amount: number) {
  if (!amount) return c;
  const grey = c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11;
  return c.map((v) => v * (1 - amount) + grey * amount);
}
