import { birds } from "./birds";
import { domesticFauna } from "./domestic";
import { temperateFauna } from "./temperate";

export const faunaProfiles = [...birds, ...domesticFauna, ...temperateFauna];

export function faunaProfile(id: string) {
  return faunaProfiles.find((profile) => profile.id === id);
}

export type { FaunaProfile, HabitatTag, DietTag } from "./types";
