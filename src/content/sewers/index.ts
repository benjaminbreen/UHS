import type { CharacterScope } from "../characters/context-types";
import { sewerFinds } from "./finds";
import { sewerPeople } from "./people";
import { mineFinds } from "../mines/finds";
import { minePeople } from "../mines/people";
import { cavePeople } from "../caves/people";
import { shipPeople } from "../ships/people";
import { fairPeople } from "../fairs/people";
import { prisonPeople } from "../prisons/people";
import type { Box, SewerFind, SewerKind, SewerPerson, TunnelDepth, TunnelKind } from "./types";
import type { CaveKind } from "../caves/types";
import type { ShipKind } from "../ships/types";

export type { Box, FolkDeal, MineDepth, MineKind, SewerArt, SewerDepth, SewerFind, SewerKind, SewerPerson, TunnelDepth, TunnelKind } from "./types";
export { SEWER_ART } from "./types";
export { sewerItems } from "./items";
export { sewerFinds, sewerPeople };

const byId = new Map([...sewerFinds, ...mineFinds].map((f) => [f.id, f]));
/** A find in any tunnels, sewer or mine. */
export const sewerFind = (id: string) => byId.get(id);
const people = new Map([...sewerPeople, ...minePeople, ...cavePeople, ...shipPeople, ...fairPeople, ...prisonPeople].map((p) => [p.id, p]));
/** Someone met in a complex or aboard: a sewer, a mine, a cave, a fair or a ship. */
export const tunnelPerson = (id: string) => people.get(id);

export type SewerPlace = { lon: number; lat: number; year: number };

/** West > east crosses 180°. */
const inBox = ([w, s, e, n]: Box, lon: number, lat: number) =>
  lat >= s && lat <= n && (w <= e ? lon >= w && lon <= e : lon >= w || lon <= e);
const inAny = (boxes: readonly Box[], p: SewerPlace) => boxes.some((b) => inBox(b, p.lon, p.lat));

const levelFits = <K extends string, D extends string>(kinds: readonly K[] | undefined, depths: readonly D[] | undefined, kind: K, depth?: D) =>
  (!kinds || kinds.includes(kind)) && (!depths || !depth || depths.includes(depth));

/** Finds' years are inclusive. */
export function findFits(f: SewerFind, place: SewerPlace, kind: TunnelKind, depth: TunnelDepth, ore?: string) {
  return (
    (!f.years || (place.year >= f.years[0] && place.year <= f.years[1])) &&
    (!f.where || inAny(f.where, place)) &&
    (!f.ores || (!!ore && f.ores.includes(ore))) &&
    levelFits(f.kinds, f.depths, kind, depth)
  );
}

/** Scope years are end-exclusive, as everywhere a CharacterScope is read. */
const scopeFits = (s: CharacterScope, p: SewerPlace) =>
  p.year >= s.years[0] && p.year < s.years[1] && (!s.bounds || inBox(s.bounds, p.lon, p.lat)) && !(s.except && inAny(s.except, p));

/** Without a depth, whether they belong anywhere in this town's sewers. */
export function personFits(p: SewerPerson, place: SewerPlace, kind: TunnelKind | CaveKind | ShipKind, depth?: TunnelDepth | "mouth" | "deep" | "deck" | "below", ore?: string) {
  return scopeFits(p.scope, place) && (!p.where || inAny(p.where, place)) && levelFits<string, string>(p.kinds, p.depths, kind, depth) && (!p.ores || (!!ore && p.ores.includes(ore)));
}

/** How much likelier than usual a random start as them is here. */
export function startTimes(p: SewerPerson, place: SewerPlace) {
  const boost = p.start?.find((b) => place.year >= b.years[0] && place.year < b.years[1] && (!b.where || inAny(b.where, place)));
  return boost?.times ?? 1;
}

// France, Belgium, Vienna, Barcelona.
const GALLERY: Box[] = [[-5, 42.3, 6, 51.1], [6, 43, 7.7, 49.1], [2.5, 49.5, 5.9, 51.5], [16.1, 48.1, 16.6, 48.35], [1.9, 41.3, 2.3, 41.5]];
// Poland to the Urals and on across Soviet Asia and Mongolia.
const BLOC: Box[] = [[14.1, 41.2, 30, 55], [20, 41, 180, 78], [52, 37.2, 81, 46], [43.5, 38.5, 51, 41]];
// Austria, Italy, Finland, Turkey, Japan and China, leaving Mongolia in.
const NOT_BLOC: Box[] = [
  [9.5, 46.4, 16.95, 49], [12, 39, 18.6, 42.9], [20, 59.7, 27.5, 70.1], [27.5, 61, 31.6, 70.1], [26, 36, 41.5, 42.1],
  [139, 30, 150, 46], [129, 30, 139, 41.5], [87, 18, 131, 41.5], [120, 41.5, 131, 49.5], [80, 41.5, 90, 47],
];
const SOUTH_ASIA: Box = [60, 5, 93, 30];
const DRY: Box[] = [[-18, 15, 60, 35], [-82, -30, -69, -3], [112, -32, 140, -18], [-118, 22, -100, 32]];
const OLD_BRICK: Box[] = [
  [-11, 49.8, 2, 61], [5.8, 47.2, 15.1, 55.1], [3.3, 50.7, 7.3, 53.6], [8, 54.5, 13, 58], [4.5, 57.9, 31, 71],
  [112, -44, 154, -25], [165, -48, 179, -34], [-100, 42, -52, 60],
];
const NORTH_AMERICA: Box = [-170, 14, -50, 72];

/** Which sewers a town has, by where it is and when; a town founded in the
 * motor age has concrete pipes whatever its region's older cores have. */
export function sewerKindFor(place: SewerPlace, townFounded?: number): SewerKind {
  const p = place;
  const founded = townFounded ?? -Infinity;
  if (p.year >= 1950 && inAny(BLOC, p) && !inAny(NOT_BLOC, p)) return "collector";
  if (inAny(GALLERY, p) && founded < 1945) return "gallery";
  if (inBox(SOUTH_ASIA, p.lon, p.lat) || (Math.abs(p.lat) <= 24 && !inAny(DRY, p))) return "tropical";
  if (inAny(OLD_BRICK, p)) return founded < 1945 ? "brick" : "concrete";
  if (inBox(NORTH_AMERICA, p.lon, p.lat))
    return p.year < 1920 || (p.lon > -100 && founded < 1880) ? "brick" : "concrete";
  return p.year < 1950 && founded < 1900 ? "brick" : "concrete";
}
