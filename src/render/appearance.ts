import type { LightingId } from "./lighting";
import { random } from "../core/random";
import type { Terrain } from "../core/types";
export type RenderOptions = {
  onReady?: () => void;
  debug?: boolean;
  freeze?: boolean;
  /** Allow water motion in otherwise stationary art previews. */
  waterAnimation?: boolean;
  lighting?: LightingId;
  colorGrade?: boolean;
  shadows?: boolean;
  lab?: boolean;
  overview?: boolean;
  center?: { x: number; y: number };
};
/** Quiet patches share detail density across several cells; detail is not uniform static. */
export function terrainVariant(
  seed: string,
  terrain: Terrain,
  x: number,
  y: number,
) {
  const n = random(seed, "art", x, y);
  if (terrain === "grass" || terrain === "dry") {
    const patch = random(
      seed,
      "meadow-patch",
      Math.floor(x / 5),
      Math.floor(y / 5),
    );
    return patch > 0.73 && n > 0.4 ? 6 + Math.floor(n * 2) : Math.floor(n * 6);
  }
  return Math.floor(
    n * (["dirt", "sand", "water", "field"].includes(terrain) ? 8 : 4),
  );
}
