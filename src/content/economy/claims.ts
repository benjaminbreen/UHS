import { capabilitiesFor, matchesCharacterScope } from "../characters/resolve";
import { ruled } from "../history/order";
import type { CharacterScope } from "../characters/context-types";
import type { WorldSetting } from "../geography/types";

/** What a farming household owes whoever holds the land or rules it, once a
 * year: a share of the grain, taken in kind in the season after the harvest,
 * and whether its men also owe labour. */
export type Claim = {
  /** Who it goes to, as said in a sentence: "the temple". */
  to: string;
  /** The role that comes round for it; the leading household's head where nobody has it. */
  collector: RegExp;
  share: number;
  due: "spring" | "summer" | "autumn" | "winter";
  /** The claimant holds the land, so falling short is rent unpaid, not tax. */
  landlord: boolean;
  labour: boolean;
};
type Scoped = Claim & { scope: CharacterScope; evidence: "documented" | "inferred"; source: string };

const claims: Scoped[] = [
  {
    scope: { years: [-3100, -30], bounds: [24, 22, 35, 32] },
    to: "the temple", collector: /scribe|steward|overseer/i, share: 0.25, due: "summer", landlord: true, labour: true,
    evidence: "inferred", source: "Wilbour Papyrus field assessments; corvée on dykes and canals",
  },
  {
    scope: { years: [-3000, -500], bounds: [38, 29, 50, 38] },
    to: "the temple", collector: /steward|scribe|overseer/i, share: 1 / 3, due: "summer", landlord: true, labour: true,
    evidence: "documented", source: "Laws of Hammurabi §46: a field let for a third or a half of the crop; ilku service",
  },
  {
    scope: { years: [-206, 220], bounds: [100, 20, 125, 42] },
    to: "the county", collector: /village head|headman|clerk|official/i, share: 1 / 30, due: "winter", landlord: false, labour: true,
    evidence: "documented", source: "Han land tax of one-thirtieth from Emperor Jing; a month's labour a year for adult men",
  },
  {
    scope: { years: [960, 1949], bounds: [100, 20, 125, 42] },
    to: "the landlord", collector: /landlord|agent|steward/i, share: 0.5, due: "winter", landlord: true, labour: false,
    evidence: "documented", source: "Song to Republican tenancy: rent commonly half the main crop",
  },
  {
    scope: { years: [1603, 1868], bounds: [129, 30, 146, 46] },
    to: "the domain", collector: /headman|nanushi|sh[oō]ya|village head|official/i, share: 0.4, due: "winter", landlord: false, labour: true,
    evidence: "documented", source: "Tokugawa nengu, 'four to the lord, six to the people', paid in rice through the village head",
  },
  {
    scope: { years: [1556, 1857], bounds: [66, 8, 92, 35] },
    to: "the zamindar", collector: /zamindar|patwari|headman|amil|official/i, share: 1 / 3, due: "winter", landlord: false, labour: false,
    evidence: "documented", source: "Ain-i-Akbari: Akbar's revenue set at a third of the average crop",
  },
  {
    scope: { years: [1066, 1500], bounds: [-8, 49.5, 2, 59] },
    to: "the lord", collector: /reeve|bailiff|steward/i, share: 0.25, due: "winter", landlord: true, labour: true,
    evidence: "inferred", source: "Manorial villeinage: rents and dues in kind, week-work and boon-work",
  },
  {
    scope: { years: [800, 1789], bounds: [-10, 36, 25, 60] },
    to: "the lord", collector: /steward|bailiff|reeve|official/i, share: 0.2, due: "winter", landlord: true, labour: true,
    evidence: "inferred", source: "Seigneurial dues and the church's tithe of a tenth, with corvée",
  },
  {
    scope: { years: [-200, 450], bounds: [-10, 28, 30, 46] },
    to: "the landowner", collector: /steward|vilicus|bailiff|agent/i, share: 1 / 3, due: "autumn", landlord: true, labour: false,
    evidence: "documented", source: "Lex Manciana: coloni in Africa owed a third of grain, wine and oil",
  },
  {
    scope: { years: [1350, 1839], bounds: [19, 35, 45, 43] },
    to: "the sipahi", collector: /sipahi|official|headman|steward/i, share: 0.1, due: "autumn", landlord: false, labour: false,
    evidence: "inferred", source: "Ottoman tithe (öşür) to the timar holder, nominally a tenth",
  },
  {
    scope: { years: [1428, 1521], bounds: [-106, 14, -94, 23] },
    to: "Tenochtitlan", collector: /calpixqui|tribute|official|headman/i, share: 0.2, due: "winter", landlord: false, labour: true,
    evidence: "inferred", source: "Codex Mendoza tribute rolls, collected by calpixque",
  },
  {
    // The Inca took labour on state and temple fields, not a share of a household's own.
    scope: { years: [1438, 1533], bounds: [-81, -20, -66, 2] },
    to: "the Inca", collector: /curaca|official|headman/i, share: 0, due: "winter", landlord: false, labour: true,
    evidence: "documented", source: "Mit'a labour on state and religious fields",
  },
];

/** The scoped claim, else where land was held and written down, the share
 * the fishing rules already assume: a quarter, or a tenth where coin was used. */
export function claimFor(s: WorldSetting): Claim | undefined {
  const scoped = claims.find((c) => matchesCharacterScope(c.scope, s, "*"));
  if (scoped) return scoped;
  const can = capabilitiesFor(s);
  if (s.year >= 1850 || !(can.has("heritable_land") || (can.has("writing") && can.has("settled_agriculture")))) return;
  const landlord = can.has("heritable_land");
  return {
    to: landlord ? "the landlord" : "the temple",
    collector: /steward|bailiff|headman|official|scribe/i,
    share: can.has("coinage") ? 0.1 : 0.25,
    due: "winter",
    landlord,
    labour: ruled(s),
  };
}

/** A share in words, rounded to the nearest fraction a person would say. */
export function shareWords(share: number) {
  const words: [number, string][] = [[1 / 2, "half"], [2 / 5, "two fifths"], [1 / 3, "a third"], [1 / 4, "a quarter"], [1 / 5, "a fifth"], [1 / 10, "a tenth"], [1 / 30, "a thirtieth"]];
  return words.reduce((a, b) => (Math.abs(b[0] - share) < Math.abs(a[0] - share) ? b : a))[1];
}
