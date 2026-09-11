import { places } from "../places";
import type { TravelLocation } from "../../../world/travel/types";
import { britainTravel } from "./britain";
import { northAfricaTravel } from "./north-africa";
import { westAsiaTravel } from "./west-asia";
export const authoredTravel = [
  ...britainTravel,
  ...northAfricaTravel,
  ...westAsiaTravel,
];
const authoredNames = new Set(authoredTravel.map((p) => p.name.toLowerCase()));
const authoredIds = new Set(authoredTravel.map((p) => p.id));
export const travelLocations: TravelLocation[] = [
  ...authoredTravel,
  ...places
    .filter(
      (p) => !authoredIds.has(p.id) && !authoredNames.has(p.name.toLowerCase()),
    )
    .map((p) => ({
      id: p.id,
      name: p.name,
      landscape:
        p.id.startsWith("area-") || p.name.length > 28
          ? p.name
          : `${p.name} area`,
      lon: p.lon,
      lat: p.lat,
      kind: p.id.startsWith("area-")
        ? ("landscape" as const)
        : ("settlement" as const),
      importance: 0,
      note: "Geographic catalog anchor; historical settlement existence and scale are unresearched here. The catalog’s sample year is not a founding date.",
    })),
];
export const travelById = new Map(travelLocations.map((p) => [p.id, p]));
export const travelPresets = {
  britain: {
    label: "London → Oxford → Edinburgh",
    from: "london",
    to: "edinburgh",
    via: ["western-thames", "oxford"],
    year: 1300,
    spacing: 500,
    mode: "land" as const,
  },
  battuta: {
    label: "Morocco → Cairo → Delhi",
    from: "marrakesh",
    to: "delhi",
    via: [
      "fez",
      "tlemcen",
      "tunis",
      "tripoli",
      "alexandria",
      "cairo",
      "damascus",
      "baghdad",
      "isfahan",
      "herat",
      "kabul",
    ],
    year: 1325,
    spacing: 500,
    mode: "land" as const,
  },
  iceland: {
    label: "Iceland → Scotland · sea",
    from: "area-iceland",
    to: "edinburgh",
    via: [],
    year: 1300,
    spacing: 500,
    mode: "sea" as const,
  },
};
export function settlementAt(p: TravelLocation, year: number) {
  if (p.kind === "landscape") return "none" as const;
  const s = p.settlement;
  if (s && year >= s.from && year < (s.to ?? Infinity)) return s.rank;
  return "unresearched" as const;
}
export function locationName(p: TravelLocation, year: number) {
  const status = settlementAt(p, year);
  return status === "city" || status === "town" ? p.name : p.landscape;
}
