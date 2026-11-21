import { normalize } from "../geography/situation";
import type { ItemDef } from "../../core/types";
import { chicago1893 } from "./chicago-1893";
import { fairPeople } from "./people";
import { fairFinds, fairItems } from "./finds";
import { london1884, londonItems } from "./london-1884";
import { paris1889 } from "./paris-1889";
import { random } from "../../core/random";
import { capitol } from "../palaces/capitol";
import { buckingham } from "../palaces/buckingham";
import { plannedPalaces } from "../palaces/plan";
import { versailles, versaillesItems } from "../palaces/versailles";
import { whiteHouse, westWing } from "../palaces/white-house";
import type { Fair } from "./types";

export type { Fair, FairArchetype, FairArea, FairArt, FairBuilding, FairFind, FairPost, PavilionStyle } from "./types";
export { FAIR_ART, FAIR_SIZES } from "./types";
export { fairFinds, fairPeople };

/** Every venue planned as areas: the fairs, and the palaces, which are laid out and walked the same way. */
export const fairs: readonly Fair[] = [chicago1893, london1884, paris1889, versailles, buckingham, whiteHouse, westWing, capitol, ...plannedPalaces];
export const fairById = (id: string) => fairs.find((f) => f.id === id);
const finds = new Map(fairs.flatMap((fair) => fair.finds).map((f) => [f.id, f]));
export const fairFind = (id: string) => finds.get(id);

/** The fair a prompt names, if it names one. */
export function fairFromPrompt(q: string, place?: { id?: string; lon: number; lat: number }) {
  const matches = fairs.filter((f) => f.prompt.test(q));
  const local = place && fairs.filter((f) => f.generated && f.within && contains(f.within, place.lon, place.lat) && f.asks?.test(q));
  return matches.find((f) => !f.generated) ?? local?.find((f) => f.named?.test(q))
    ?? matches.find((f) => f.named?.test(q)) ?? local?.find((f) => f.place === place?.id)
    ?? local?.[0] ?? matches[0];
}
const contains = (box: readonly number[], lon: number, lat: number) =>
  lon >= box[0] && lat >= box[1] && lon <= box[2] && lat <= box[3];

/** The fair a prompt starts in at this year: the one it names, or one of the generated plans of the kind it asks for, by the seed. */
export function venueFor(q: string, year: number, seed: string, lon: number, lat: number) {
  const named = fairs.filter((f) => !f.generated && f.prompt.test(q));
  if (named.length) return named.find((f) => year >= f.years[0] && year <= f.years[1] && contains(f.where, lon, lat));
  const fit = fairs.filter((f) => f.generated && (f.asks ?? f.prompt).test(q) && year >= f.years[0] && year <= f.years[1] &&
    (!f.within || (lon >= f.within[0] && lat >= f.within[1] && lon <= f.within[2] && lat <= f.within[3])));
  // A kind the prompt names by its people or its period before one that only its place and year allow.
  const own = fit.filter((f) => f.named?.test(q));
  const local = own.length ? own : fit;
  const houses = local.filter((f) => ` ${q} `.includes(` ${f.name.replace(/^the /, "")} `));
  const pool = houses.length ? houses : local;
  const byRoom = pool.map((f) => ({ f, score: requestedRoom(f, q)?.label.length ?? 0 }));
  const best = Math.max(0, ...byRoom.map((v) => v.score));
  const plans = best ? byRoom.filter((v) => v.score === best).map((v) => v.f) : pool;
  return plans[Math.floor(random(seed, "venue") * plans.length)];
}

type Resident = { venue: Fair; person: NonNullable<Fair["residents"]>[number]; aliases: string[] };
const residents = new Map<string, Resident[]>();
for (const venue of fairs) for (const person of venue.residents ?? []) {
  const name = normalize(person[0]);
  const aliases = [...new Set([name, name.replace(/\b[a-z] /g, "")])];
  for (const alias of aliases) {
    const group = residents.get(alias) ?? [];
    group.push({ venue, person, aliases });
    residents.set(alias, group);
  }
}

export function residentFromPrompt(q: string, seed: string, year: number) {
  const subject = q.replace(/^(?:(?:play|start|begin) as |as )/, "");
  const office = /^(president|senator) /.exec(subject)?.[1];
  const words = subject.replace(/^(?:president|senator) /, "").split(" ");
  for (let n = Math.min(words.length, 10); n > 0; n--) {
    const hits = residents.get(words.slice(0, n).join(" "))?.filter((h) => !office || h.person[1].toLowerCase() === office);
    if (!hits?.length) continue;
    const dated = hits.filter(({ person }) => year >= person[4] && year <= person[5]);
    const pool = dated.length ? dated : hits, first = pool[0];
    if (pool.some((h) => h.person[3] !== first.person[3] || h.person[0] !== first.person[0])) return;
    const plans = pool.filter((h) => h.person === first.person);
    return plans[Math.floor(random(seed, "venue") * plans.length)];
  }
}

export function requestedRoom(fair: Fair, q: string) {
  const locations = q.split(/\s+(?:in|inside|at)\s+/).slice(1).map((s) => s.replace(/^(?:the|a|an) /, ""));
  for (const location of locations) {
    const rooms = fair.areas.flatMap((area) => [normalize(area.name).replace(/^(?:the|a|an) /, ""), area.id.replace(/-/g, " ")]
      .filter((label) => location === label || location.startsWith(label + " ")).map((label) => ({ area, label })));
    if (rooms.length) return rooms.sort((a, b) => b.label.length - a.label.length)[0];
  }
}

const roomForWork: Record<string, string[]> = {
  cook: ["kitchen"], soldier: ["guard", "vestibule"], scribe: ["office", "tablinum", "library"],
  ruler: ["atrium", "hall", "office", "drawing"], courtier: ["atrium", "drawing", "antechamber", "hall"], landowner: ["atrium", "hall"],
  "high-priest": ["chapel"], servant: ["antechamber", "vestibule", "kitchen"],
};
const people = new Map(fairPeople.map((p) => [p.id, p]));

export function postFor(fair: Fair, q: string) {
  const opening = q.split(/\s+(?:in|at|inside)\s+/)[0];
  const subject = opening.split(/\s+(?:serving|with|under|for)\s+/)[0];
  if (/^(?:a |the )?visitor$/.test(subject)) return { role: "Visitor", work: "traveler", room: fair.entry, match: "visitor", sex: undefined };
  const lead = q.replace(/^(?:a|an|the) /, "").replace(/-/g, " ") + " ";
  const mentions = (label: string) => {
    const words = normalize(label).replace(/-/g, " ");
    return lead.startsWith(words + " ") || ` ${subject.replace(/-/g, " ")} `.includes(` ${words} `);
  };
  const titled = fair.posts?.filter(([role]) => role && mentions(role)).sort((a, b) => b[0].length - a[0].length)[0];
  const roster = new Set([...Object.values(fair.staff ?? {}), ...fair.areas.flatMap((a) => a.people ?? [])]);
  const staff = [...roster].flatMap((id) => people.get(id) ?? [])
    .filter((p) => (p.ages?.[1] ?? 90) >= 18 && mentions(p.label))
    .sort((a, b) => b.label.length - a.label.length)[0];
  const post = staff && staff.label.length > (titled?.[0].length ?? 0) ? undefined
    : titled ?? fair.posts?.find(([, words]) => words.test(subject));
  const rank = /\b(?:noblewoman|nobleman|aristocrat|empress|emperor|princess|prince|duchess|duke)\b/.exec(subject)?.[0];
  if (!post && !staff && !(rank && fair.palace)) return;
  const match = post ? (post === titled ? post[0] : post[1].exec(subject)![0]) : staff?.label ?? rank!;
  const work = post?.[2] ?? staff?.dress ?? (/^(?:emperor|empress)$/.test(rank ?? "") ? "ruler" : "courtier");
  const title = !titled && work === "ruler" && /\b(?:king|queen|prince|princess|emperor|empress|duke|duchess)\b/.exec(subject)?.[0];
  const label = title || post?.[0] || match;
  const role = label[0].toUpperCase() + label.slice(1);
  const sex = /\b(?:noblewoman|matron|lady|queen|princess|duchess|empress|woman|female|priestess)\b/.test(subject + " " + role.toLowerCase()) ? "female" as const
    : /\b(?:nobleman|king|prince|duke|emperor|man|male)\b/.test(subject) ? "male" as const : undefined;
  const rooms = fair.areas.filter((a) => a.kind === "gallery");
  const office = fair.residents?.find((p) => p[1] === role)?.[6];
  const room = office ?? (roomForWork[work] ?? []).map((kind) =>
    rooms.find((a) => (a.palace?.room ?? fair.palace?.room) === kind || a.stands?.tags.includes(kind))?.id).find(Boolean)
    ?? rooms.find((a) => staff && a.people?.includes(staff.id))?.id ?? rooms[0]?.id;
  return { role, work, sex: sex ?? (staff?.women === 1 ? "female" : staff?.women === 0 ? "male" : undefined), room, match };
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

/** A world's fair (not a palace) open at this place and year, if there is one. */
export function worldsFairAt(lon: number, lat: number, year: number) {
  return fairs.find((f) => !f.palace && year >= f.years[0] && year <= f.years[1] && contains(f.where, lon, lat));
}

/** A palace complex matching this place and year (named first, else a generated plan by region and seed). */
export function palaceFor(lon: number, lat: number, year: number, seed: string) {
  const named = fairs.find((f) => f.palace && !f.generated && year >= f.years[0] && year <= f.years[1] && contains(f.where, lon, lat));
  if (named) return named;
  const fit = fairs.filter(
    (f) => f.palace && f.generated && year >= f.years[0] && year <= f.years[1] && (!f.within || contains(f.within, lon, lat)),
  );
  return fit.length ? fit[Math.floor(random(seed, "palace-door") * fit.length)] : undefined;
}

export const fairItemDefs: Record<string, ItemDef> = Object.fromEntries(Object.entries({ ...fairItems, ...londonItems, ...versaillesItems }).map(([id, [name, sprite, value, description]]) =>
  [id, { id, name, sprite, value, description, ...(id === "chocolate-square" ? { edible: 2 } : {}) }]));
