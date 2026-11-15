import { places } from "./places";
import population from "./population.generated.json" with { type: "json" };
import { settingFor, tillersHome } from "./resolve";
import { populateCharacter } from "./character";
import { resolveCharacterContext } from "../characters/resolve";
import { characterSex } from "../characters/generate";
import { cavePeople } from "../caves/people";
import { personFits, sewerPeople, startTimes } from "../sewers";
import { random } from "../../core/random";

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

const catchmentYears = population.catchmentYears as number[];
const catchments = population.catchments as Record<string, number[]>;
const urbanYears = population.urbanYears as number[];
const urban = population.urban as Record<string, number[]>;

function nearestIndex(years: readonly number[], year: number) {
  let best = 0;
  for (let i = 1; i < years.length; i++)
    if (Math.abs(years[i] - year) < Math.abs(years[best] - year)) best = i;
  return best;
}

const unit = (draw: number) => (draw >>> 0) / 0x1_0000_0000;
const townKinds = new Set(["city", "port"]);

/** People in each country's catchments, all places and town places only. */
const countryCatchment = catchmentYears.map((_, k) => {
  const all: Record<string, number> = {};
  const towns: Record<string, number> = {};
  for (const p of places) {
    const code = mapped[p.id];
    const people = catchments[p.id]?.[k] ?? 0;
    all[code] = (all[code] ?? 0) + people;
    if (townKinds.has(p.settlement)) towns[code] = (towns[code] ?? 0) + people;
  }
  return { all, towns };
});

/**
 * A place drawn in proportion to the people alive near it that year: its
 * country's total, split by the share of that country living nearer to it than
 * to any other place. Before 1850 the split is the 1850 one.
 */
function populationWeightedPlace(draw: number, year: number) {
  const at = nearestIndex(slices, year);
  const k = nearestIndex(catchmentYears, year);
  const weights = places.map((p) => {
    const code = mapped[p.id];
    const total = countryCatchment[k].all[code];
    return total > 0 ? (byCountry[code][at] * (catchments[p.id]?.[k] ?? 0)) / total : 0;
  });
  const total = weights.reduce((sum, w) => sum + w, 0);
  let remaining = unit(draw) * total;
  for (let i = 0; i < places.length; i++) {
    remaining -= weights[i];
    if (remaining < 0) return places[i];
  }
  return places[places.length - 1];
}

/**
 * Whether a start at a town place is in the town or the country around it.
 * Town places hold most of a country's catchment, so the odds are scaled up to
 * land the country's urban share overall rather than that share of the towns.
 */
function inTown(draw: number, place: (typeof places)[number], year: number) {
  const code = mapped[place.id];
  const share = urban[code]?.[nearestIndex(urbanYears, year)];
  if (share === undefined) return true;
  const k = nearestIndex(catchmentYears, year);
  const towns = countryCatchment[k].towns[code] / countryCatchment[k].all[code];
  return unit(draw) < share / 100 / towns;
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
  let base = settingFor(place, year);
  if (mode === "realistic" && townKinds.has(base.settlement) && !inTown(draws[3] ?? 0, place, year))
    base = { ...base, settlement: "village", population: undefined };
  const sex = characterSex(seed, "player");
  // Far more than their share of history, for the fun of it: one start in a
  // thousand for each cave life that fits, two for each sewer life (towns are
  // a small share of starts), more where a life was common, and at least
  // 0.3% in all wherever any fits.
  const here = { lon: base.lon, lat: base.lat, year };
  const town = townKinds.has(base.settlement);
  const under = [
    ...cavePeople.filter((p) => !town && personFits(p, here, p.kinds?.[0] ?? "karst")).map((p) => ({ who: p, below: "cave" as const, odds: 0.001 * startTimes(p, here) })),
    ...sewerPeople.filter((p) => town && personFits(p, here, p.kinds?.[0] ?? "brick")).map((p) => ({ who: p, below: "sewer" as const, odds: 0.002 * startTimes(p, here) })),
  ].filter(({ who }) => (sex === "female" ? who.women > 0 : who.women < 1));
  const sum = under.reduce((n, u) => n + u.odds, 0);
  let odd = random(seed, "underground-start") / (sum && sum < 0.003 ? 0.003 / sum : 1);
  const life = under.find((u) => (odd -= u.odds) < 0);
  if (life) {
    const { who, below } = life;
    const setting = populateCharacter({ ...base, role: who.label, characterName: who.label, below, brief: { ...base.brief, work: who.dress } }, seed);
    return { seed, setting };
  }
  // The work available here, rather than a fixed five; a Kyoto start can be a
  // dyer and a Manchester one a match worker.
  const work = resolveCharacterContext(base).livelihoods;
  let pick = unit(draws[1] ?? 0) * work.reduce((sum, l) => sum + (l.weight ?? 1), 0);
  const role = (work.find((l) => (pick -= l.weight ?? 1) < 0) ?? work[work.length - 1]).label;
  const setting = populateCharacter({ ...base, role, settlement: tillersHome(base, role) }, seed);
  return { seed, setting };
}

export function randomStart(mode: StartMode = "realistic") {
  return randomStartFromDraws(crypto.getRandomValues(new Uint32Array(4)), mode);
}
