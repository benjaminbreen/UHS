import { beliefOptions, beliefsFor } from "../beliefs/index";
import { religiousProfile } from "../settlements/religious";
import { officiantsBySystem } from "../beliefs/officiants.generated";
import type { ReligiousProfile } from "../settlements/religious/types";
import type { BeliefSystem, Officiant } from "../beliefs/types";
import type { WorldSetting } from "../geography/types";
import { random } from "../../core/random";
import { characterCommunity, matchesCharacterScope, populationFor } from "./resolve";
import { localLabels } from "./livelihood-labels.generated";
import { citySignatures } from "./signatures";
import { requirementMet } from "./requirements";
import type { Livelihood } from "./context-types";

/*
 * Turning one livelihood row into the religious office a place actually has.
 *
 * The belief systems already name who officiates and rank every power they
 * attend, so a priest need not be a generic "priest": in Egypt they serve
 * Amun-Ra, in Lutheran Germany they are a minister, in the Andes a curaca.
 *
 * Rarity is the point of the tiers. A settlement full of high priests would be
 * as wrong as a settlement with no shrine at all, so the household and local
 * offices are common and the paramount one is close to unique.
 */

/** Who officiates here, if anyone does. */
export function officiantsFor(s: WorldSetting, system = beliefsFor(s), site = religiousProfile(s)): readonly Officiant[] {
  const temple = (label:string): Officiant => ({label,tier:"temple",weight:2});
  if (system.offices) return system.offices.map(temple);
  const offices = (officiantsBySystem[system.id] ?? []).filter(o => !/^(teacher|doctor)$/i.test(o.label));
  const faith = site?.faith;
  if (!faith || !system.worship?.includes(faith)) return offices;
  if (site?.offices) return site.offices.map(temple);
  if (faith === "Islam" && !offices.some(o => /\bimam\b/i.test(o.label)))
    return [...offices.filter(o => /imam|faqih|marabout|qadi|qazi|muezzin|mullah|mufti|pir|ulema|household/i.test(o.label)),temple("Imam")];
  if (faith?.includes("Buddh") && !offices.some(o => /monk|bhikkhu/i.test(o.label)))
    return [...offices,temple("Monk")];
  return offices;
}

export function officeAtSanctuary(s: WorldSetting, label: string, system: BeliefSystem, site: ReligiousProfile | undefined, school?: string) {
  if (!site || !system.worship?.includes(school ?? site.faith)) return false;
  if (/missionary|itinerant|marabout|diviner|household|shaman/i.test(label)) return false;
  if (/Christian|Catholic|Anglican/i.test(site.faith) && !site.id.includes("monastery") && /monk|nun|abbot/i.test(label)) return false;
  if ((site.faith === "Buddhism" || site.faith === "Buddhist" || site.faith === "Theravada Buddhist") &&
    !/monk|nun|abbot|lama|bhikkh|bhikshu|monastic|novice/i.test(label)) return false;
  if (site.offices && !site.offices.includes(label)) return false;
  return officiantsFor(s,system,site).some(o => (o.tier === "temple" || o.tier === "paramount" || /\bimam\b/i.test(o.label)) &&
    (label === o.label || label.startsWith(o.label + " of ")));
}

function offersOffice(s:WorldSetting, system:BeliefSystem, requested:string) {
  return officiantsFor(s,system).some(o => o.tier !== "household" && o.label.toLowerCase() === requested.toLowerCase());
}

export function communityForWork(s:WorldSetting, seed:string, id:string, requested?:string) {
  const drawn = characterCommunity(s,seed,id);
  if (!requested || id !== "player" || s.characterCommunity) return drawn;
  const groups = populationFor(s)?.groups;
  const offers = (community:string) => beliefOptions(s,community).some(o => offersOffice(s,o.system,requested));
  return groups && !offers(drawn) ? groups.find(g => offers(g.community))?.community ?? drawn : drawn;
}

export function personalSystem(s:WorldSetting, seed:string, id:string, community:string, requested?:string, inherited?:string) {
  const options = beliefOptions(s,community);
  const offices = requested && options.filter(o => offersOffice(s,o.system,requested));
  const pool = offices && offices.length ? offices : options;
  const family = inherited && pool.find(o => o.system.id === inherited);
  if (family) return family.system;
  let roll = random(seed,"affiliation",id) * pool.reduce((n,o) => n+o.share,0);
  return (pool.find(o => (roll -= o.share) < 0) ?? pool[pool.length-1]).system;
}

/*
 * Offices that do not take a dedication. A dedication to a named power is how
 * a polytheistic temple cult works -- a priest of Amun-Ra serves Amun-Ra and
 * not Osiris -- and it is meaningless in a religion with one god, where the
 * office is simply the parish priest. These are the offices of those.
 */
const UNDEDICATED =
  /parish|minister|pastor|missionary|catechist|imam|rabbi|qadi|qazi|marabout|pir|monk|nun|bhikkhu|granthi|abbot|monastic|priest of the church|clergy|sexton|lector/i;

/** Offices that serve a god at all. A chieftain or an elder is not "of Sulis". */
const DEDICATED = /priest|keeper|attendant|medium|oracle|flamen/i;

/** A settlement this size can support an office of at most this standing. */
const NEEDS_SETTLEMENT: Record<Officiant["tier"], number> = {
  household: 0,
  local: 0,
  // A village has a shrine and someone who keeps it; requiring a town left
  // whole regions with no religious role at all.
  temple: 0,
  // The one office a polity has: a high priesthood, a pontifical college.
  paramount: 2,
};
const SIZE: Record<string, number> = { camp: 0, village: 1, town: 1, city: 2, port: 2 };

export function officiantFor(
  s: WorldSetting,
  seed: string,
  id: string,
  system = beliefsFor(s),
): { label: string; tier: Officiant["tier"] } | undefined {
  const all = officiantsFor(s,system);
  if (!all?.length) return undefined;
  const size = SIZE[s.settlement ?? "village"] ?? 1;
  // The household tier is what every household head does at their own hearth,
  // not a living: it belongs to domestic practice, not to the work table.
  const open = all.filter(
    (o) => o.tier !== "household" && NEEDS_SETTLEMENT[o.tier] <= size,
  );
  if (!open.length) return undefined;
  const total = open.reduce((n, o) => n + o.weight, 0);
  let roll = random(seed, "character-v1", id, "officiant") * total;
  const chosen = open.find((o) => (roll -= o.weight) < 0) ?? open[open.length - 1];
  // Name the office for the power it attends, where it attends a particular
  // one. A household elder tends whoever the household tends; a temple priest
  // serves a named god, and that is the whole point of the title.
  const powers = system.powers.filter(
    (p) =>
      p.rank === chosen.serves &&
      // A reconstructed name carries an asterisk and a concept carries an
      // article; "Priest of Hnit" and "Priest of The market" both read as
      // mistakes, so only a plainly named power takes a dedication.
      !/^(the\b|\*)/i.test(p.name),
  );
  // A pantheon is what gets divided between priesthoods, so a handful of
  // powers at this rank is the test -- except at the top, where there is
  // usually exactly one and serving it is the whole office.
  const enough = chosen.serves === "paramount" ? 1 : 2;
  if (!chosen.serves || !DEDICATED.test(chosen.label) || UNDEDICATED.test(chosen.label) || / of /.test(chosen.label) || powers.length < enough)
    return { label: chosen.label, tier: chosen.tier };
  const power = powers[Math.floor(random(seed, "character-v1", id, "power") * powers.length)];
  return {
    label: power.officiant ?? `${chosen.label} of ${power.name}`,
    tier: chosen.tier,
  };
}

/** The local name for this work, where one is authored. */
export function localLabel(
  l: Livelihood,
  s: WorldSetting,
  seed: string,
  id: string,
): string {
  const ecology = s.environment?.ecology;
  const fits: { label: string; weight?: number }[] = [...(l.labels ?? []), ...(localLabels[l.id] ?? [])].filter(
    (v) =>
      matchesCharacterScope(v.scope, s, "*") &&
      (!v.ecologies || (ecology && v.ecologies.includes(ecology))) &&
      !v.requires?.some((r) => !requirementMet(r, s)),
  );
  const signature = citySignatures
    .filter((g) => matchesCharacterScope(g.scope, s, "*"))
    .flatMap((g) => g.labels?.[l.id] ?? []);
  if (signature.length) fits.push(...(fits.length ? [] : [{ label: l.label }]), ...signature);
  if (!fits.length) return l.label;
  const total = fits.reduce((n, v) => n + (v.weight ?? 1), 0);
  let roll = random(seed, "character-v1", id, "role-label") * total;
  return (fits.find((v) => (roll -= v.weight ?? 1) < 0) ?? fits[fits.length - 1])
    .label;
}

/** Replace a belief-driven row with the office this place actually has. */
export function asOfficiant(
  l: Livelihood,
  s: WorldSetting,
  seed: string,
  id: string,
  system = beliefsFor(s),
): Livelihood | undefined {
  if (!l.fromBeliefs) {
    const local = localLabel(l, s, seed, id);
    return local === l.label ? l : { ...l, label: local };
  }
  const office = officiantFor(s, seed, id, system);
  return office ? { ...l, label: office.label } : undefined;
}
