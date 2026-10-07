import data from "./regional-looks.json";

type Region = { id: string; bounds: number[]; from?: number; to?: number };
type Where = { lon: number; lat: number; year: number };

const regions = data.regions as Region[];
const fallback = data.fallback as Record<string, string>;
const looks = data.looks as Record<string, (string | null)[]>;

/** The first named region holding this place and year, if any. */
export function regionOf(where: Where): string | undefined {
  return regions.find(
    (r) =>
      where.lon >= r.bounds[0] &&
      where.lat >= r.bounds[1] &&
      where.lon <= r.bounds[2] &&
      where.lat <= r.bounds[3] &&
      where.year >= (r.from ?? -Infinity) &&
      where.year < (r.to ?? Infinity),
  )?.id;
}

/** Which numbered look of `family` (e.g. "religious-gothic", "hall-town-hall")
 * this place builds, following the region's fallbacks; undefined where the
 * family has no regional looks or none fits, so callers keep their roll. */
export function regionalLook(family: string, where?: Where): number | undefined {
  const list = looks[family];
  if (!list || !where) return undefined;
  const seen = new Set<string>();
  for (let id = regionOf(where); id && !seen.has(id); id = fallback[id]) {
    seen.add(id);
    const i = list.indexOf(id);
    if (i >= 0) return i;
  }
  return undefined;
}
