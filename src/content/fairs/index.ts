import type { ItemDef } from "../../core/types";
import { chicago1893 } from "./chicago-1893";
import { fairFinds, fairItems } from "./finds";
import { london1884, londonItems } from "./london-1884";
import { paris1889 } from "./paris-1889";
import { random } from "../../core/random";
import { buckingham } from "../palaces/buckingham";
import { plannedPalaces } from "../palaces/plan";
import { versailles, versaillesItems } from "../palaces/versailles";
import { whiteHouse } from "../palaces/white-house";
import type { Fair } from "./types";

export type { Fair, FairArchetype, FairArea, FairArt, FairBuilding, FairFind, FairPost, PavilionStyle } from "./types";
export { FAIR_ART, FAIR_SIZES } from "./types";
export { fairFinds };
export { fairPeople } from "./people";

/** Every venue planned as areas: the fairs, and the palaces, which are laid out and walked the same way. */
export const fairs: readonly Fair[] = [chicago1893, london1884, paris1889, versailles, buckingham, whiteHouse, ...plannedPalaces];
export const fairById = (id: string) => fairs.find((f) => f.id === id);
const finds = new Map(fairs.flatMap((fair) => fair.finds).map((f) => [f.id, f]));
export const fairFind = (id: string) => finds.get(id);

/** The fair a prompt names, if it names one. */
export const fairFromPrompt = (q: string) => fairs.find((f) => f.prompt.test(q));

/** The fair a prompt starts in at this year: the one it names, or one of the generated plans of the kind it asks for, by the seed. */
export function venueFor(q: string, year: number, seed: string, lon: number, lat: number) {
  const named = fairs.find((f) => !f.generated && f.prompt.test(q));
  if (named) return named;
  const fit = fairs.filter((f) => f.generated && (f.asks ?? f.prompt).test(q) && year >= f.years[0] && year <= f.years[1] &&
    (!f.within || (lon >= f.within[0] && lat >= f.within[1] && lon <= f.within[2] && lat <= f.within[3])));
  // A kind the prompt names by its people or its period before one that only its place and year allow.
  const own = fit.filter((f) => f.named?.test(q)), pool = own.length ? own : fit;
  return pool.length ? pool[Math.floor(random(seed, "venue") * pool.length)] : undefined;
}

/** The post in a palace that a prompt names: its title and the work it is. */
export function postFor(fair: Fair, q: string) {
  const titled = fair.posts?.find(([role]) => role && new RegExp(`\\b${role.toLowerCase().replace(/-/g, "[- ]")}\\b`).test(q));
  if (titled) return { role: titled[0], work: titled[2] };
  for (const [role, words, work] of fair.posts ?? []) {
    const m = words.exec(q);
    if (m) return { role: role || m[0][0].toUpperCase() + m[0].slice(1), work };
  }
}

/** The share of those in a capital who name no work and are found in its ruler's household. */
const COURT_SHARE = 0.25;

/** A start in the ruler's household for someone in a city who named no work: now and then, where and when a palace of some kind stood. */
export function courtStart(q: string, year: number, seed: string, lon: number, lat: number) {
  if (random(seed, "court-start", q) >= COURT_SHARE) return undefined;
  const fit = fairs.filter((f) => f.generated && f.within && f.posts && year >= f.years[0] && year <= f.years[1] && lon >= f.within[0] && lat >= f.within[1] && lon <= f.within[2] && lat <= f.within[3]);
  if (!fit.length) return undefined;
  const venue = fit[Math.floor(random(seed, "court-venue", q) * fit.length)], total = venue.posts!.reduce((n, p) => n + p[3], 0);
  let at = random(seed, "court-post", q) * total;
  const [role, , work] = venue.posts!.find((p) => (at -= p[3]) < 0) ?? venue.posts![venue.posts!.length - 1];
  return { venue, role, work };
}

/** The fair open at this place and year, if there is one. */
export function fairAt(lon: number, lat: number, year: number) {
  return fairs.find((f) => year >= f.years[0] && year <= f.years[1] && lon >= f.where[0] && lat >= f.where[1] && lon <= f.where[2] && lat <= f.where[3]);
}

export const fairItemDefs: Record<string, ItemDef> = Object.fromEntries(Object.entries({ ...fairItems, ...londonItems, ...versaillesItems }).map(([id, [name, sprite, value, description]]) =>
  [id, { id, name, sprite, value, description, ...(id === "chocolate-square" ? { edible: 2 } : {}) }]));
