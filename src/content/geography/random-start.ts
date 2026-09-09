import { places } from "./places";
import { settingFor } from "./resolve";
import { populateCharacter } from "./character";

/**
 * Fresh browser entropy across the entire atlas. Each atlas location retains
 * its authored default date/context; the curated examples are not a hidden
 * random-start pool.
 */
export function randomStartFromDraws(draws: Uint32Array) {
  const place = places[draws[0] % places.length];
  const seed = `world-${crypto.randomUUID()}`;
  const roles =
    place.year < -10000
      ? ["Gatherer", "Hunter", "Traveler"]
      : ["Farmer", "Herder", "Craftsperson", "Trader", "Traveler"];
  const role = roles[draws[1] % roles.length];
  const setting = populateCharacter(
    { ...settingFor(place, place.year), role },
    seed,
  );
  return { seed, setting };
}

export function randomStart() {
  return randomStartFromDraws(crypto.getRandomValues(new Uint32Array(2)));
}
