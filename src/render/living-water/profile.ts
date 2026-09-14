import type { ShorePolish } from "./polish";
import type { TopographyCell, TopographySample } from "../../core/topography";
import type { Ecology } from "../../content/ecology/profiles";
import { defaults, type Settings } from "./model";
import { waterNoise } from "../water-style";

export const ecologyOrder: Ecology[] = [
  "grassland",
  "temperate-woodland",
  "boreal-woodland",
  "tropical-woodland",
  "wetland",
  "dry-scrub",
  "desert",
  "tundra",
];
export function livingProfile(cell: TopographyCell): Settings {
  const ecology =
    cell.waterVisual?.ecology ?? cell.habitat?.ecology ?? "grassland";
  const kind =
    cell.waterVisual?.kind === "sea"
      ? "coast"
      : cell.waterVisual?.kind === "lake"
        ? cell.waterVisual.shoreWidth < 1
          ? "pond"
          : "lake"
        : (cell.waterVisual?.shoreWidth ?? 3) < 1.2
          ? "creek"
          : "river";
  const palette =
    ecology === "tundra"
      ? "polar"
      : ecology === "wetland"
        ? "green"
        : ["temperate-woodland", "boreal-woodland"].includes(ecology)
          ? "blue"
          : "tropical";
  const swamp = cell.habitat?.colorway === "swamp";
  const frozen = !!cell.waterVisual?.frozenMargin;
  const red = ecology === "desert" && cell.habitat?.colorway === "red-earth";
  return {
    ...defaults,
    kind,
    palette: swamp ? "swamp" : palette,
    bankClimate: ecology,
    // A creek bed is pebbles (sand only in a desert): the same beach
    // gradient as a river, in stone tones and a fraction of the width.
    bankMaterial: frozen
      ? "snow"
      : red
        ? "clay"
        : kind === "coast" || ecology === "desert"
          ? "sand"
          : kind === "creek"
            ? "pebbles"
            : "mud",
    clarity: swamp ? 0.25 : defaults.clarity,
    rocks: swamp ? 0.05 : defaults.rocks,
    plantType: swamp ? "reeds" : defaults.plantType,
    customBankColors: !frozen && !red && kind !== "creek",
    bankDryColor: swamp ? "#706449" : defaults.bankDryColor,
    bankWetColor:
      swamp ? "#464c37" : ecology === "desert" && !red ? "#b69a6c" : defaults.bankWetColor,
    bankContactColor:
      swamp ? "#2e4235" : palette === "polar" ? "#a8c9cb" : defaults.bankContactColor,
    beachWidth: kind === "coast" ? 8 : kind === "river" ? 1.5 : kind === "creek" ? 0.18 : 1,
    strength:
      kind === "coast"
        ? 1.5
        : kind === "river" || kind === "creek"
          ? 1
          : kind === "lake"
            ? 0.65
            : 0.2,
    direction:
      (Math.atan2(
        cell.waterVisual?.flow[1] ?? 1,
        cell.waterVisual?.flow[0] ?? 0,
      ) *
        180) /
      Math.PI,
    // Wind and rain are not yet present in the renderer's presentation context.
    surfaceRipples: false,
    plants: ecology === "tundra" ? 0 : defaults.plants,
  };
}
export function livingBeachWidth(
  sample: TopographySample,
  x: number,
  y: number,
  ox = 0,
  oy = 0,
  settings?: ShorePolish,
) {
  const cell = sample(x, y)!;
  const profile = livingProfile(cell);
  let rise = 0;
  for (const [dx, dy] of [
    [-2, 0],
    [2, 0],
    [0, -2],
    [0, 2],
  ])
    rise = Math.max(
      rise,
      (sample(x + dx, y + dy)?.height ?? cell.height) - cell.height,
    );
  const slope = rise >= 3 ? 0.12 : rise >= 2 ? 0.4 : rise >= 1 ? 0.7 : 1;
  return (
    (profile.kind === "coast"
      ? (settings?.coastBeachWidth ?? 8)
      : profile.beachWidth) *
    slope *
    (0.9 + waterNoise(x + ox, y + oy, 37, 864) * 0.2)
  );
}
