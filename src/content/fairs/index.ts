import type { ItemDef } from "../../core/types";
import { fairFinds, fairItems } from "./finds";
import { london1884, londonItems } from "./london-1884";
import { paris1889 } from "./paris-1889";
import { versailles, versaillesItems } from "../palaces/versailles";
import type { Fair } from "./types";

export type { Fair, FairArchetype, FairArea, FairArt, FairBuilding, FairFind, PavilionStyle } from "./types";
export { FAIR_ART } from "./types";
export { fairFinds };
export { fairPeople } from "./people";

/** Every venue planned as areas: the fairs, and the palaces, which are laid out and walked the same way. */
export const fairs: readonly Fair[] = [paris1889, london1884, versailles];
export const fairById = (id: string) => fairs.find((f) => f.id === id);
const finds = new Map(fairs.flatMap((fair) => fair.finds).map((f) => [f.id, f]));
export const fairFind = (id: string) => finds.get(id);

/** The fair a prompt names, if it names one. */
export const fairFromPrompt = (q: string) => fairs.find((f) => f.prompt.test(q));

/** The fair open at this place and year, if there is one. */
export function fairAt(lon: number, lat: number, year: number) {
  return fairs.find((f) => year >= f.years[0] && year <= f.years[1] && lon >= f.where[0] && lat >= f.where[1] && lon <= f.where[2] && lat <= f.where[3]);
}

export const fairItemDefs: Record<string, ItemDef> = Object.fromEntries(Object.entries({ ...fairItems, ...londonItems, ...versaillesItems }).map(([id, [name, sprite, value, description]]) =>
  [id, { id, name, sprite, value, description, ...(id === "chocolate-square" ? { edible: 2 } : {}) }]));
