import type { ItemDef } from "../../core/types";
import { fairFinds, fairItems } from "./finds";
import { london1884, londonItems } from "./london-1884";
import { paris1889 } from "./paris-1889";
import { random } from "../../core/random";
import { buckingham } from "../palaces/buckingham";
import { plannedPalaces } from "../palaces/plan";
import { versailles, versaillesItems } from "../palaces/versailles";
import { whiteHouse } from "../palaces/white-house";
import type { Fair } from "./types";

export type { Fair, FairArchetype, FairArea, FairArt, FairBuilding, FairFind, PavilionStyle } from "./types";
export { FAIR_ART } from "./types";
export { fairFinds };
export { fairPeople } from "./people";

/** Every venue planned as areas: the fairs, and the palaces, which are laid out and walked the same way. */
export const fairs: readonly Fair[] = [paris1889, london1884, versailles, buckingham, whiteHouse, ...plannedPalaces];
export const fairById = (id: string) => fairs.find((f) => f.id === id);
const finds = new Map(fairs.flatMap((fair) => fair.finds).map((f) => [f.id, f]));
export const fairFind = (id: string) => finds.get(id);

/** The fair a prompt names, if it names one. */
export const fairFromPrompt = (q: string) => fairs.find((f) => f.prompt.test(q));

/** The fair a prompt starts in at this year: the one it names, or one of the generated plans of the kind it asks for, by the seed. */
export function venueFor(q: string, year: number, seed: string) {
  const named = fairs.find((f) => !f.generated && f.prompt.test(q));
  if (named) return named;
  const fit = fairs.filter((f) => f.generated && (f.asks ?? f.prompt).test(q) && year >= f.years[0] && year <= f.years[1]);
  return fit.length ? fit[Math.floor(random(seed, "venue") * fit.length)] : undefined;
}

/** The fair open at this place and year, if there is one. */
export function fairAt(lon: number, lat: number, year: number) {
  return fairs.find((f) => year >= f.years[0] && year <= f.years[1] && lon >= f.where[0] && lat >= f.where[1] && lon <= f.where[2] && lat <= f.where[3]);
}

export const fairItemDefs: Record<string, ItemDef> = Object.fromEntries(Object.entries({ ...fairItems, ...londonItems, ...versaillesItems }).map(([id, [name, sprite, value, description]]) =>
  [id, { id, name, sprite, value, description, ...(id === "chocolate-square" ? { edible: 2 } : {}) }]));
