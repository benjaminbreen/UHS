import { places } from "./places";
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

/**
 * Fresh browser entropy across the entire atlas and 10,000 BCE–present. A
 * start's year is population-weighted; curated examples/default years are not
 * hidden random-start inputs.
 */
export function randomStartFromDraws(draws: Uint32Array) {
  const place = places[draws[0] % places.length];
  const year = randomPopulationWeightedYear(draws[2] ?? 0);
  const seed = `world-${crypto.randomUUID()}`;
  const base = settingFor(place, year);
  // The work available here, rather than a fixed five; a Kyoto start can be a
  // dyer and a Manchester one a match worker.
  const work = resolveCharacterContext(base).livelihoods;
  const role = work[draws[1] % work.length].label;
  const setting = populateCharacter({ ...base, role }, seed);
  return { seed, setting };
}

export function randomStart() {
  return randomStartFromDraws(crypto.getRandomValues(new Uint32Array(3)));
}
