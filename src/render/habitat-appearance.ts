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
export function habitatAppearance(h: Habitat, art: GrassArt = defaultGrassArt) {
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
  if (
    h.season === "autumn" &&
    !["desert", "tropical-woodland"].includes(h.ecology)
  )
    ground = mix(ground, palette[1], 0.12);
  return { palette, soil, ground: ground.map(Math.round) };
}
