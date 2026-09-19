import { places } from "./places";
import population from "./population.generated.json" with { type: "json" };
import { settingFor } from "./resolve";
import { populateCharacter } from "./character";
import { resolveCharacterContext } from "../characters/resolve";

const firstRandomYear = -9999; // 10,000 BCE in astronomical numbering
const onePastPresent = 2027;
/**
 * Approximate global population anchors, in millions.  The historical series
 * follows HYDE's long-run reconstruction, with recent UN-derived values via
 * Our World in Data: https://ourworldindata.org/grapher/population
 *
 * They weight *when* a start occurs by the number of people alive, not the
 * chance that the selected atlas place held that share of population. Regional
 * population weighting needs a separately reviewed spatial dataset.
 */
const globalPopulationMillions = [
  [firstRandomYear, 2],
  [-4999, 18],
  [0, 188],
  [500, 210],
  [1000, 295],
  [1500, 461],
  [1600, 554],
  [1700, 603],
  [1800, 989],
  [1900, 1654],
  [1950, 2545],
  [2000, 6145],
  [onePastPresent, 8200],
] as const;

type PopulationSegment = {
  start: number;
  end: number;
  startPopulation: number;
  endPopulation: number;
  area: number;
};

const populationSegments: PopulationSegment[] = globalPopulationMillions
  .slice(0, -1)
  .map(([start, startPopulation], i) => {
    const [end, endPopulation] = globalPopulationMillions[i + 1];
    return {
      start,
      end,
      startPopulation,
      endPopulation,
      // Trapezoidal person-years under this linearly interpolated segment.
      area: ((startPopulation + endPopulation) * (end - start)) / 2,
    };
  });

const populationArea = populationSegments.reduce(
  (sum, segment) => sum + segment.area,
  0,
);

/** Draw a year from the population-weighted historical timeline. */
export function randomPopulationWeightedYear(draw: number) {
  const unit = (draw >>> 0) / 0x1_0000_0000;
  let remaining = unit * populationArea;
  const segment =
    populationSegments.find((candidate) => {
      if (remaining < candidate.area) return true;
      remaining -= candidate.area;
      return false;
    }) ?? populationSegments.at(-1)!;
  const duration = segment.end - segment.start;
  const change = segment.endPopulation - segment.startPopulation;
  // Invert the integral of a linear population curve within the segment.
  const offset =
    change === 0
      ? remaining / segment.startPopulation
      : (2 * remaining) /
        (segment.startPopulation +
          Math.sqrt(
            segment.startPopulation ** 2 + (2 * change * remaining) / duration,
          ));
  return Math.min(segment.end - 1, segment.start + Math.floor(offset));
}

/** How a start picks its place. The year is population-weighted either way. */
export type StartMode = "any" | "realistic";

/* Per-country population, and the country each place stands in. See
 * scripts/prepare_population.py for what the two are and are not. */
const slices = population.years as number[];
const byCountry = population.countries as Record<string, number[]>;
const mapped = population.places as Record<string, string>;
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
 * Fresh browser entropy across the entire atlas and 10,000 BCE–present. A
 * start's year is population-weighted; curated examples/default years are not
 * hidden random-start inputs.
 */
export function randomStartFromDraws(
  draws: Uint32Array,
  mode: StartMode = "any",
) {
  const year = randomPopulationWeightedYear(draws[2] ?? 0);
  const place =
    mode === "realistic"
      ? populationWeightedPlace(draws[0], year)
      : places[draws[0] % places.length];
  const seed = `world-${crypto.randomUUID()}`;
  const base = settingFor(place, year);
  // The work available here, rather than a fixed five; a Kyoto start can be a
  // dyer and a Manchester one a match worker.
  const work = resolveCharacterContext(base).livelihoods;
  const role = work[draws[1] % work.length].label;
  const setting = populateCharacter({ ...base, role }, seed);
  return { seed, setting };
}

export function randomStart(mode: StartMode = "any") {
  return randomStartFromDraws(crypto.getRandomValues(new Uint32Array(3)), mode);
}
