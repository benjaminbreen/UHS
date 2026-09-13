import { birds } from "./birds";
import { domesticFauna } from "./domestic";
import { temperateFauna } from "./temperate";
import type { WorldSetting } from "../geography/types";
import {
  matchesCharacterScope,
  subsistenceFor,
} from "../characters/resolve";

export const faunaProfiles = [...birds, ...domesticFauna, ...temperateFauna];

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

export type { FaunaProfile, HabitatTag, DietTag } from "./types";
