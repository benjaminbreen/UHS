import { featuredPlaces } from "./places";
import { settingFor } from "./resolve";
import { populateCharacter } from "./character";

/** Fresh browser entropy; featured dates keep random starts historically scoped. */
export function randomStart() {
  const draws = crypto.getRandomValues(new Uint32Array(2));
  const place = featuredPlaces[draws[0] % featuredPlaces.length];
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
