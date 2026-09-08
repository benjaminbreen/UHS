import { westernEurope } from "./western-europe";
import { northAmerica } from "./north-america";
import { globalProfiles } from "./global";
import type { RegionalProfile } from "./types";

/** Add regional data here; geometry, placement and rendering remain shared. */
export const regionalProfiles: readonly RegionalProfile[] = [
  ...globalProfiles,
  ...westernEurope,
  ...northAmerica,
];
