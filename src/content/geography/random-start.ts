import { places } from "./places";
import population from "./population.generated.json" with { type: "json" };
import { settingFor, tillersHome } from "./resolve";
import { populateCharacter } from "./character";
import { resolveCharacterContext } from "../characters/resolve";

const firstRandomYear = -12999; // 13,000 BCE in astronomical numbering
const onePastPresent = 2027;

/* Per-country population, and the country each place stands in. See
 * scripts/prepare_population.py for what the two are and are not. */
const slices = population.years as number[];
const byCountry = population.countries as Record<string, number[]>;
const mapped = population.places as Record<string, string>;

/* World population per slice, summed from the same table the place draw uses.
 * Years between slices are interpolated in log space: growth compounds, and a
 * straight line from 5000 BCE to 1 CE drew half again too many starts in
 * between. Before the first slice and after the last, the edge value holds. */
const world = slices.map((_, i) =>
  Object.values(byCountry).reduce((sum, series) => sum + series[i], 0),
);
const cumulative = new Float64Array(onePastPresent - firstRandomYear + 1);
for (let year = firstRandomYear, i = 1, k = 0; year < onePastPresent; year++, i++) {
  while (k < slices.length - 1 && slices[k + 1] <= year) k++;
  const next = Math.min(k + 1, slices.length - 1);
  const t = next > k && year > slices[k] ? (year - slices[k]) / (slices[next] - slices[k]) : 0;
  const alive = Math.exp(Math.log(world[k]) * (1 - t) + Math.log(world[next]) * t);
  cumulative[i] = cumulative[i - 1] + alive;
}

/** Draw a year in proportion to the people alive in it. */
export function randomPopulationWeightedYear(draw: number) {
  const target = ((draw >>> 0) / 0x1_0000_0000) * cumulative[cumulative.length - 1];
  let lo = 0,
    hi = cumulative.length - 2;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cumulative[mid + 1] <= target) lo = mid + 1;
    else hi = mid;
  }
  return firstRandomYear + lo;
}

/** How a start picks its place. The year is population-weighted either way. */
export type StartMode = "any" | "realistic";

/* The curated anchors in places.ts are not in the generated table, so they take
 * the country of the nearest place that is. Without this the best-authored
 * starts in the game — Rome, London, Delhi — would be undrawable. */
const placeCountry: Record<string, string> = {};
for (const p of places) {
  if (mapped[p.id]) {
    placeCountry[p.id] = mapped[p.id];
    continue;
  }
  let best: { code: string; distance: number } | undefined;
  for (const other of places) {
    const code = mapped[other.id];
    if (!code) continue;
    const dx = (other.lon - p.lon) * Math.cos((p.lat * Math.PI) / 180);
    const distance = Math.hypot(dx, other.lat - p.lat);
    if (!best || distance < best.distance) best = { code, distance };
  }
  if (best) placeCountry[p.id] = best.code;
}
/** Places sharing a country, so a country's people are split between them. */
const countryPlaces = places.reduce<Record<string, number>>((count, p) => {
  const code = placeCountry[p.id];
  if (code) count[code] = (count[code] ?? 0) + 1;
  return count;
}, {});

function sliceFor(year: number) {
  let best = 0;
  for (let i = 1; i < slices.length; i++)
    if (Math.abs(slices[i] - year) < Math.abs(slices[best] - year)) best = i;
  return best;
}

/**
 * A place drawn in proportion to the people alive in its country that year.
 * A country's population is split evenly between its places, so this decides
 * which country you are born in, not which kind of place within it: the atlas
 * is ranked by modern prominence, so medieval France still means Paris.
 */
function populationWeightedPlace(draw: number, year: number) {
  const at = sliceFor(year);
  const weights = places.map((p) => {
    const code = placeCountry[p.id];
    const series = code ? byCountry[code] : undefined;
    return series ? series[at] / countryPlaces[code] : 0;
  });
  const total = weights.reduce((sum, w) => sum + w, 0);
  // No country in the table holds anyone that year: fall back to an even draw
  // rather than returning nothing.
  if (!(total > 0)) return places[draw % places.length];
  let remaining = ((draw >>> 0) / 0x1_0000_0000) * total;
  for (let i = 0; i < places.length; i++) {
    remaining -= weights[i];
    if (remaining < 0) return places[i];
  }
  return places[places.length - 1];
}

/**
 * Fresh browser entropy across the entire atlas and 13,000 BCE–present. A
 * start's year is population-weighted; curated examples/default years are not
 * hidden random-start inputs.
 */
export function randomStartFromDraws(
  draws: Uint32Array,
  mode: StartMode = "realistic",
  seed = `world-${crypto.randomUUID()}`,
) {
  const year = randomPopulationWeightedYear(draws[2] ?? 0);
  const place =
    mode === "realistic"
      ? populationWeightedPlace(draws[0], year)
      : places[draws[0] % places.length];
  const base = settingFor(place, year);
  // The work available here, rather than a fixed five; a Kyoto start can be a
  // dyer and a Manchester one a match worker.
  const work = resolveCharacterContext(base).livelihoods;
  let pick = ((draws[1] ?? 0) / 0x1_0000_0000) * work.reduce((sum, l) => sum + (l.weight ?? 1), 0);
  const role = (work.find((l) => (pick -= l.weight ?? 1) < 0) ?? work[work.length - 1]).label;
  const setting = populateCharacter({ ...base, role, settlement: tillersHome(base, role) }, seed);
  return { seed, setting };
}

export function randomStart(mode: StartMode = "realistic") {
  return randomStartFromDraws(crypto.getRandomValues(new Uint32Array(3)), mode);
}
