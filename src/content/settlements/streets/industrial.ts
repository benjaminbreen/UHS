import type { WorldSetting } from "../../geography/types";
import { industrialized, modernity } from "../modernity";
import type { StreetPalette } from "./palettes";

/** Street surfaces of industrial-age cities, by region and date. Granite
 * setts carried the heavy traffic of the railway age; American cities laid
 * vitrified brick from the 1880s and poured concrete from the 1910s; asphalt
 * spread with the car. Colonial and later cities often paved only their main
 * roads. Periods are regional art defaults, not a survey of any one city. */
type Stage = { until: number; palette: StreetPalette };

const setts: StreetPalette = {
  main: ["sett"],
  local: ["sett", "sett", "cobble"],
  lane: ["cobble", "sett"],
  square: ["slab", "sett"],
  footway: ["slab"],
};
const settsAndFlags = (main: "sett" | "asphalt"): StreetPalette => ({
  main: [main],
  local: [main],
  lane: ["sett"],
  square: ["slab"],
  footway: ["slab"],
});
const motorCity: StreetPalette = {
  main: ["asphalt"],
  local: ["asphalt"],
  lane: ["asphalt"],
  square: ["concrete"],
  footway: ["concrete"],
};
const mainOnly = (local: "earth" | "asphalt"): StreetPalette => ({
  main: ["asphalt"],
  local: [local],
  lane: ["earth"],
  square: ["concrete"],
  footway: [local === "earth" ? "earth" : "concrete"],
});

const stages: Record<string, Stage[]> = {
  "north-america": [
    { until: 1885, palette: setts },
    {
      until: 1915,
      palette: {
        main: ["brick", "asphalt"],
        local: ["brick"],
        lane: ["brick", "earth"],
        square: ["slab"],
        footway: ["brick", "concrete"],
      },
    },
    {
      until: 1960,
      palette: {
        main: ["asphalt"],
        local: ["concrete", "asphalt"],
        lane: ["concrete"],
        square: ["concrete"],
        footway: ["concrete"],
      },
    },
  ],
  britain: [
    { until: 1935, palette: settsAndFlags("sett") },
    { until: 1975, palette: settsAndFlags("asphalt") },
  ],
  "western-europe": [
    { until: 1960, palette: setts },
    { until: 1990, palette: settsAndFlags("asphalt") },
  ],
  "eastern-europe": [{ until: 1955, palette: setts }],
  japan: [{ until: 1955, palette: mainOnly("earth") }],
  australasia: [{ until: 1925, palette: mainOnly("earth") }],
};

/** Undefined before the region industrialises or outside its cities. */
export function industrialStreets(s: WorldSetting): StreetPalette | undefined {
  if (!industrialized(s) || (s.settlement !== "city" && s.settlement !== "port"))
    return;
  const id = modernity(s).id;
  const own = stages[id];
  if (own) return own.find((stage) => s.year < stage.until)?.palette ?? motorCity;
  // Elsewhere the main roads were metalled first and the rest caught up late.
  return s.year < 1975 ? mainOnly(s.year < 1950 ? "earth" : "asphalt") : motorCity;
}
