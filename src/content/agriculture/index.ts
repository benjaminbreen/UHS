import type { WorldSetting } from "../geography/types";
import type { Climate, CropId, CropStage, FarmSystem, FarmSystemRule, Season } from "./types";
import { crops } from "./crops";
import { farmSystems, genericFarming } from "./systems";

export * from "./types";
export { crops } from "./crops";
export { farmSystems, genericFarming } from "./systems";

/** Narrower date ranges win, so a specific period is not shadowed by a broad one. */
const rules: FarmSystemRule[] = [...farmSystems].sort(
  (a, b) => a.to - a.from - (b.to - b.from) || a.id.localeCompare(b.id),
);

const resolved = new Map<string, FarmSystem>();

type Where = Pick<WorldSetting, "culture" | "lon" | "lat" | "year" | "climate">;

export function farmSystem(s: Where): FarmSystem {
  const key = `${s.culture}|${s.lon}|${s.lat}|${s.year}|${s.climate}`;
  const memo = resolved.get(key);
  if (memo) return memo;
  const system = select(s);
  if (resolved.size >= 64) resolved.clear();
  resolved.set(key, system);
  return system;
}

function select(s: Where): FarmSystem {
  const rule = rules.find((p) => {
    const [w, south, e, n] = p.bounds;
    return (
      s.culture === p.culture &&
      s.year >= p.from &&
      s.year < p.to &&
      s.lon >= w &&
      s.lon <= e &&
      s.lat >= south &&
      s.lat <= n &&
      (!p.climates || p.climates.includes(s.climate))
    );
  });
  if (!rule) return genericFarming;
  const { from, to, bounds, culture, climates, ...system } = rule;
  return system;
}

const seasons: readonly Season[] = ["spring", "summer", "autumn", "winter"];

/** Drawn stage of a crop this season; the south is half a year out. */
export function cropStage(crop: CropId, season: Season, lat: number): CropStage {
  const shifted = lat < 0 ? seasons[(seasons.indexOf(season) + 2) % 4] : season;
  return crops[crop].calendar[shifted];
}

/** The system's crops that grow in this climate, shares renormalised. Falls
 * back to the full list when none fit, so a parcel always has a crop. */
export function cropsFor(
  system: FarmSystem,
  climate: Climate,
): { id: CropId; share: number }[] {
  const fit = system.crops.filter((c) => crops[c.id].climates.includes(climate));
  const list = fit.length ? fit : [...system.crops];
  const total = list.reduce((sum, c) => sum + c.share, 0) || 1;
  return list.map((c) => ({ id: c.id, share: c.share / total }));
}
