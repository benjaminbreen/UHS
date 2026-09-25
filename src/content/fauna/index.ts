import { americanFauna } from "./americas";
import { birds } from "./birds";
import { directionalFauna } from "./directional";
import { domesticFauna } from "./domestic";
import { foxes } from "./foxes";
import { temperateFauna } from "./temperate";
import { workingFauna } from "./working";
import type { WorldSetting } from "../geography/types";
import { matchesCharacterScope, subsistenceFor } from "../characters/resolve";

export const faunaProfiles = [
  ...americanFauna,
  ...birds,
  ...domesticFauna,
  ...workingFauna,
  ...temperateFauna,
  ...directionalFauna,
  ...foxes,
];

export function faunaProfile(id: string) {
  return faunaProfiles.find((profile) => profile.id === id);
}

/** The species that occur at a setting: range and date first, then whether
 * the people there keep the animal at all. */
export function faunaAt(setting: WorldSetting) {
  const herding = subsistenceFor(setting)?.shares.herding ?? 0;
  return faunaProfiles.filter(
    (p) =>
      p.presence.some((scope) => matchesCharacterScope(scope, setting, "*")) &&
      (p.needs !== "herding" || herding >= 0.05) &&
      (p.needs !== "settled" || setting.settlement !== "camp"),
  );
}

export type { FaunaProfile, HabitatTag, DietTag, FaunaFacing } from "./types";
export { faunaFacings, faunaFrames, habitatTags } from "./types";
export { faunaCombat } from "./combat";
export { faunaLook, faunaCoats, type FaunaLook } from "./looks";
export type { FaunaCombat, Temper } from "./combat";
