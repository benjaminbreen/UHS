import { matchesCharacterScope } from "../characters/resolve";
import { venues } from "./table";
import type { Venue } from "./types";
import type { WorldSetting } from "../geography/types";

export { venues } from "./table";
export { venueKinds } from "./types";
export type { Venue, VenueKind } from "./types";

/**
 * Which venues this settlement can support. Scope decides what exists here at
 * all; the building count decides what a place this size could carry. One per
 * archetype, heaviest first, so a town gets a coffee house or a tea house and
 * never both.
 */
export const venueById = new Map(venues.map((v) => [v.id, v]));
/** The venue a place was built for, from its claim. */
export const venueOfClaim = (claim: string) =>
  claim.startsWith("venue-") ? venueById.get(claim.slice(6)) : undefined;

/** The frame family a venue is built from at this date. */
export const venueBuilding = (venue: Venue, setting: WorldSetting) =>
  venue.eras?.find(
    (e) =>
      setting.year >= e.from &&
      setting.year < e.to &&
      (!e.cultures || e.cultures.includes(setting.culture)),
  )?.building ?? venue.building;

export function venuesFor(
  setting: WorldSetting | undefined,
  buildings: number,
): Venue[] {
  if (!setting) return venues.filter((v) => v.open && v.minBuildings === 0);
  // Narrowest first, as the community profiles resolve: a chichería beats the
  // generic tavern in the Andes however the weights fall, because somebody
  // wrote it for that country and nobody wrote the tavern for anywhere.
  const reach = (v: Venue) =>
    (v.scope.bounds ? 0 : 2) + (v.scope.cultures ? 0 : 1);
  const eligible = venues
    .filter(
      (v) =>
        v.minBuildings <= buildings && matchesCharacterScope(v.scope, setting),
    )
    .sort(
      (a, b) =>
        reach(a) - reach(b) || b.weight - a.weight || a.id.localeCompare(b.id),
    );
  // One per archetype, except where a second row admits a different rank: a
  // city with a noh stage should also have a kabuki theatre, because the two
  // exist precisely because their audiences did not mix.
  const kept: Venue[] = [];
  const disjoint = (a: Venue, b: Venue) =>
    !!a.ranks && !!b.ranks && !a.ranks.some((r) => b.ranks!.includes(r));
  for (const v of eligible) {
    const same = kept.filter((k) => k.kind === v.kind);
    if (!same.length || (same.length < 2 && same.every((k) => disjoint(k, v))))
      kept.push(v);
  }
  return kept;
}
