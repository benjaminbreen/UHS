import type { LandscapeRecipe } from "../../content/ecology/landscapes";
export type Drainage = {
  slope: number;
  lowland: number;
  saturation: number;
  /** +1 on a slope facing the pole, -1 facing the sun. */
  shade?: number;
  waterDistance: number;
};
const clamp = (n: number) => Math.max(0, Math.min(1, n));
export function drainageAt(
  height: (x: number, y: number) => number,
  x: number,
  y: number,
  water: number,
  recipe: LandscapeRecipe,
  /** 1 north of the equator, -1 south of it. */
  hemisphere = 1,
): Drainage {
  const h = height(x, y);
  const neighbors = [
    height(x - 6, y),
    height(x + 6, y),
    height(x, y - 6),
    height(x, y + 6),
  ];
  const slope = clamp((Math.max(...neighbors) - Math.min(...neighbors)) * 8);
  const depression = clamp((neighbors.reduce((a, b) => a + b, 0) / 4 - h) * 12);
  const near = clamp(1 - Math.max(0, water) / 28);
  const lowland = clamp(near * 0.8 + depression * 0.5);
  const saturation = clamp(
    recipe.moisture *
      recipe.floodability *
      (1 - slope) *
      (near * 0.95 + depression * 0.45),
  );
  // North is -y: ground falling away northward faces north.
  const shade = Math.max(-1, Math.min(1, (neighbors[3] - neighbors[2]) * 8 * hemisphere));
  return { slope, lowland, saturation, shade, waterDistance: water };
}
