import type { WorldSetting } from "../../geography/types";
import { streetMaterial, type StreetMaterial } from "./index";
import { newYorkStreets } from "./north-america";
export type StreetSurface = StreetMaterial | "earth";
export type StreetRole = "main" | "local" | "lane" | "square" | "footway";
type Mix = readonly StreetSurface[];
export type StreetPalette = Record<StreetRole, Mix>;

/** Repeated entries are relative art weights, not measured historical shares.
 * Kits describe street function; regional files only override a kit where useful.
 */
const stoneTown = (stone: StreetMaterial): StreetPalette => ({
  main: [stone],
  local: [stone, stone, "cobble"],
  lane: ["earth", "earth", "cobble"],
  square: ["slab", "slab", stone],
  footway: ["slab", stone],
});
const kits = Object.fromEntries(
  (["basalt", "cobble", "slab", "brick", "sett"] as const).map((m) => [
    m,
    stoneTown(m),
  ]),
) as Record<StreetMaterial, StreetPalette>;

const modernCity: StreetPalette = {
  main: ["asphalt"],
  local: ["asphalt"],
  lane: ["asphalt"],
  square: ["concrete"],
  footway: ["concrete"],
};

export function streetPalette(setting: WorldSetting): StreetPalette {
  if (
    setting.year >= 1900 &&
    (setting.settlement === "city" || setting.settlement === "port")
  )
    return modernCity;
  const p = newYorkStreets;
  const [w, s, e, n] = p.bounds;
  if (
    setting.year >= p.from &&
    setting.year < p.to &&
    setting.lon >= w &&
    setting.lon <= e &&
    setting.lat >= s &&
    setting.lat <= n
  )
    return p.palette;
  return kits[streetMaterial(setting)];
}

/** Choose once per route/frontage, never per tile. Caller supplies a stable draw. */
export function chooseStreetSurface(
  palette: StreetPalette,
  role: StreetRole,
  draw: number,
): StreetSurface {
  const mix = palette[role];
  return mix[
    Math.min(mix.length - 1, Math.max(0, Math.floor(draw * mix.length)))
  ];
}
