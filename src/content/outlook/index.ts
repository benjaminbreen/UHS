import type { CultureId } from "../history/types";
import type { Stance } from "./types";
import { andes } from "./stances/andes";
import { australiaPacific } from "./stances/australia-pacific";
import { eastAsia } from "./stances/east-asia";
import { eastSouthernAfrica } from "./stances/east-southern-africa";
import { european } from "./stances/european";
import { generals } from "./stances/general";
import { indigenousAmericas } from "./stances/indigenous-americas";
import { innerEurasia } from "./stances/inner-eurasia";
import { mesoamerica } from "./stances/mesoamerica";
import { modern } from "./stances/modern";
import { southAsia } from "./stances/south-asia";
import { southeastAsia } from "./stances/southeast-asia";
import { tempers } from "./stances/tempers";
import { westAsia } from "./stances/west-asia";
import { westCentralAfrica } from "./stances/west-central-africa";

/** Tagging the culture on import, as the belief systems do, so a region file's
 * scope boxes can stay generous without winning in the next region. */
const from = (stances: readonly Stance[], culture: CultureId): Stance[] =>
  stances.map((s) => ({
    ...s,
    scope: { ...s.scope, cultures: s.scope.cultures ?? [culture] },
  }));

export const stances: readonly Stance[] = [
  // Unscoped by culture on purpose: a temper is not regional, a general
  // covers the places with no named tradition authored, and the modern
  // ideologies were taken up well outside the culture that stated them.
  ...tempers,
  ...generals.map((s) => ({ ...s, fallback: true })),
  ...modern,
  ...from(andes, "andean"),
  ...from(australiaPacific, "australian-pacific"),
  ...from(eastAsia, "east-asian"),
  ...from(eastSouthernAfrica, "east-southern-african"),
  ...from(european, "european"),
  ...from(indigenousAmericas, "other-indigenous-american"),
  ...from(innerEurasia, "inner-eurasian"),
  ...from(mesoamerica, "mesoamerican"),
  ...from(southAsia, "south-asian"),
  ...from(southeastAsia, "southeast-asian"),
  ...from(westAsia, "north-african-west-asian"),
  ...from(westCentralAfrica, "west-central-african"),
];
export const stanceById = new Map(stances.map((s) => [s.id, s]));
export type { Stance } from "./types";
