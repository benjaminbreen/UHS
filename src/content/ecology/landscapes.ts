import type { Colorway, Ecology } from "./profiles";

export type LandscapeRecipe = {
  moisture: number;
  canopy: number;
  mineral: number;
  floodability: number;
};
const recipes: Record<Ecology, LandscapeRecipe> = {
  "tropical-woodland": {
    moisture: 0.86,
    canopy: 0.86,
    mineral: 0.06,
    floodability: 0.8,
  },
  "temperate-woodland": {
    moisture: 0.67,
    canopy: 0.72,
    mineral: 0.09,
    floodability: 0.85,
  },
  "boreal-woodland": {
    moisture: 0.62,
    canopy: 0.62,
    mineral: 0.15,
    floodability: 0.9,
  },
  grassland: { moisture: 0.5, canopy: 0.16, mineral: 0.14, floodability: 0.45 },
  savanna: { moisture: 0.48, canopy: 0.23, mineral: 0.18, floodability: 0.55 },
  wetland: { moisture: 0.94, canopy: 0.18, mineral: 0.02, floodability: 1 },
  "dry-scrub": {
    moisture: 0.42,
    canopy: 0.26,
    mineral: 0.24,
    floodability: 0.55,
  },
  desert: { moisture: 0.1, canopy: 0.025, mineral: 0.87, floodability: 0.02 },
  tundra: { moisture: 0.42, canopy: 0, mineral: 0.5, floodability: 0.5 },
};
const variants: Partial<Record<Colorway, Partial<LandscapeRecipe>>> = {
  swamp: { moisture: 0.97, canopy: 0.74, floodability: 1 },
  mangrove: { moisture: 0.97, canopy: 0.7, floodability: 1 },
  bog: { canopy: 0.22, floodability: 1 },
  pantanal: { canopy: 0.24, floodability: 1 },
  prairie: { canopy: 0.06 },
  steppe: { moisture: 0.32, canopy: 0.025, mineral: 0.27 },
  pampas: { canopy: 0.035 },
  montane: { moisture: 0.36, canopy: 0.015, mineral: 0.45 },
  alpine: { canopy: 0, mineral: 0.6 },
  coastal: { moisture: 0.86, canopy: 0.83 },
  atacama: { moisture: 0.025, canopy: 0, mineral: 0.97 },
  highland: { moisture: 0.18, canopy: 0.02, mineral: 0.72 },
};
export type EcologyPart = {
  ecology: Ecology;
  colorway?: Colorway;
  weight: number;
};
export function landscapeRecipe(parts: EcologyPart[]): LandscapeRecipe {
  const result = { moisture: 0, canopy: 0, mineral: 0, floodability: 0 };
  for (const part of parts) {
    const recipe = {
      ...recipes[part.ecology],
      ...(part.ecology === "tropical-woodland" && part.colorway === "monsoon"
        ? { canopy: 0.58, moisture: 0.7, floodability: 0.85 }
        : {}),
      ...(part.colorway ? variants[part.colorway] : {}),
    };
    for (const key of Object.keys(result) as (keyof LandscapeRecipe)[])
      result[key] += recipe[key] * part.weight;
  }
  return result;
}
