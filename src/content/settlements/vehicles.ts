import catalog from "../graphics/vehicles.generated.json" with { type: "json" };
import type { WorldSetting } from "../geography/types";
import { modernity } from "./modernity";

export type VehicleModel = keyof typeof catalog;

/** The cars on a region's streets, with relative weights. A model is only
 * drawn while its own dates in the catalogue cover the year, so one list can
 * run from the 1920s to now; `from` and `to` narrow a model to when it was
 * common here. Weights are art frequencies, not registration figures. */
type Pool = { model: VehicleModel; weight: number; from?: number; to?: number }[];

const american: Pool = [
  { model: "tourer-1915", weight: 3 },
  { model: "sedan-1935", weight: 3 },
  { model: "fastback-1948", weight: 3 },
  { model: "hardtop-1957", weight: 4 },
  { model: "sedan-1968", weight: 4 },
  { model: "pickup-1975", weight: 2 },
  { model: "compact-1985", weight: 3 },
  { model: "sedan-2005", weight: 4 },
  { model: "suv-2010", weight: 3, from: 2000 },
  { model: "van", weight: 1, from: 1960, to: 1980 },
  { model: "beetle", weight: 1, from: 1955, to: 1980 },
];

const pools: Record<string, Pool> = {
  "north-america": american,
  australasia: [
    ...american.filter((p) => p.model !== "hardtop-1957"),
    { model: "mini", weight: 2, to: 1990 },
  ],
  britain: [
    { model: "tourer-1915", weight: 2 },
    { model: "sedan-1935", weight: 3 },
    { model: "mini", weight: 4 },
    { model: "cab-uk", weight: 1 },
    { model: "beetle", weight: 1 },
    { model: "compact-1985", weight: 3 },
    { model: "lada", weight: 1, from: 1975, to: 1995 },
    { model: "van", weight: 1, to: 1985 },
    { model: "sedan-2005", weight: 4 },
    { model: "suv-2010", weight: 1, from: 2005 },
  ],
  "western-europe": [
    { model: "tourer-1915", weight: 2 },
    { model: "sedan-1935", weight: 3 },
    { model: "beetle", weight: 4 },
    { model: "city-car", weight: 3 },
    { model: "deux-chevaux", weight: 3 },
    { model: "mini", weight: 1 },
    { model: "van", weight: 1, to: 1985 },
    { model: "compact-1985", weight: 3 },
    { model: "sedan-2005", weight: 4 },
    { model: "suv-2010", weight: 1, from: 2008 },
  ],
  "eastern-europe": [
    { model: "sedan-1935", weight: 1 },
    { model: "volga", weight: 3 },
    { model: "city-car", weight: 2, from: 1960 },
    { model: "lada", weight: 5 },
    { model: "compact-1985", weight: 1, from: 1995 },
    { model: "sedan-2005", weight: 3, from: 2000 },
    { model: "suv-2010", weight: 2, from: 2005 },
  ],
  japan: [
    { model: "sedan-1935", weight: 1, to: 1955 },
    { model: "city-car", weight: 3, from: 1958, to: 1975 },
    { model: "kei", weight: 5 },
    { model: "sedan-1968", weight: 1, from: 1965, to: 1985 },
    { model: "compact-1985", weight: 4 },
    { model: "van", weight: 1 },
    { model: "sedan-2005", weight: 3 },
  ],
  "south-asia": [
    { model: "sedan-1935", weight: 1, to: 1960 },
    { model: "ambassador", weight: 6 },
    { model: "kei", weight: 3, from: 1983 },
    { model: "sedan-2005", weight: 2, from: 2000 },
    { model: "suv-2010", weight: 1, from: 2005 },
  ],
  "east-asia": [
    { model: "volga", weight: 2, to: 1995 },
    { model: "compact-1985", weight: 4, from: 1985 },
    { model: "van", weight: 1, from: 1985 },
    { model: "sedan-2005", weight: 4 },
    { model: "suv-2010", weight: 2, from: 2005 },
  ],
  "latin-america": [
    { model: "sedan-1935", weight: 2 },
    { model: "fastback-1948", weight: 2 },
    // Havana kept its fifties cars running for half a century.
    { model: "hardtop-1957", weight: 3, to: 2030 },
    { model: "beetle", weight: 5 },
    { model: "sedan-1968", weight: 3 },
    { model: "pickup-1975", weight: 2 },
    { model: "compact-1985", weight: 3 },
    { model: "sedan-2005", weight: 3 },
  ],
  "sub-saharan-africa": [
    { model: "sedan-1935", weight: 1 },
    { model: "beetle", weight: 2, to: 1990 },
    { model: "compact-1985", weight: 4 },
    { model: "pickup-1975", weight: 3 },
    { model: "van", weight: 3 },
    { model: "sedan-2005", weight: 3 },
  ],
  "southern-africa": [
    { model: "beetle", weight: 2 },
    { model: "sedan-1968", weight: 2 },
    { model: "compact-1985", weight: 3 },
    { model: "pickup-1975", weight: 4 },
    { model: "van", weight: 2 },
    { model: "sedan-2005", weight: 3 },
  ],
  "west-asia-north-africa": [
    { model: "sedan-1935", weight: 1 },
    { model: "sedan-1968", weight: 2 },
    { model: "compact-1985", weight: 5 },
    { model: "pickup-1975", weight: 2 },
    { model: "van", weight: 2 },
    { model: "sedan-2005", weight: 3 },
  ],
  "southeast-asia": [
    { model: "compact-1985", weight: 3 },
    { model: "kei", weight: 3 },
    { model: "pickup-1975", weight: 3 },
    { model: "van", weight: 2 },
    { model: "sedan-2005", weight: 3 },
  ],
};

export type ParkedCar = {
  model: VehicleModel;
  paint: number;
  label: string;
  about: string;
};

/** Models on the street at this place and date, weighted. A model stays on
 * the road for a decade and more after it stops being built, fewer each year. */
export function vehiclePool(s: WorldSetting) {
  const pool = pools[modernity(s).id] ?? american;
  return pool.flatMap((p) => {
    const [a, b] = catalog[p.model].era;
    const from = Math.max(a, p.from ?? a),
      to = Math.min(b, p.to ?? b);
    if (s.year < from || s.year >= to + 15) return [];
    const fade = s.year < to ? 1 : 1 - (s.year - to) / 15;
    return [{ ...p, weight: p.weight * fade }];
  });
}

/** Share of kerb space taken by parked cars: a few cars in the first
 * motoring years, rising toward the motor onset and after it. */
export function parkingShare(s: WorldSetting) {
  const { motor } = modernity(s);
  const t = (s.year - (motor - 25)) / 45;
  return Math.max(0.04, Math.min(0.85, t));
}

/** One car, from a stable roll in [0, 1) for the model and one for its paint. */
export function parkedCar(
  pool: ReturnType<typeof vehiclePool>,
  roll: number,
  paintRoll: number,
): ParkedCar | undefined {
  const total = pool.reduce((n, p) => n + p.weight, 0);
  let at = roll * total;
  for (const p of pool) {
    at -= p.weight;
    if (at > 0) continue;
    const entry = catalog[p.model];
    return {
      model: p.model,
      paint: Math.floor(paintRoll * entry.paints),
      label: entry.label,
      about: entry.about,
    };
  }
  return undefined;
}

/** Cells a parked car covers along its street. */
export const carLength = (model: VehicleModel, axis: "x" | "y") =>
  Math.ceil(catalog[model].cells[axis]);
