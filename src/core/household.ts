import { bedridden } from "./health";
import { random } from "./random";
import { hear } from "./word";
import type { Household, Snapshot } from "./types";

/** What is going on in a household today that its people and kin act on. */
export type HouseholdCondition = {
  /** Members too ill to be up. */
  sick?: string[];
  /** Who has just died there: a name, or "one of the household". */
  mourning?: string;
  /** The burial is today. */
  burying?: true;
  /** A staple it could not get, and the head of the house it buys it from. */
  short?: { good: string; seller?: string };
  /** Households it is on bad enough terms with not to call on. */
  shuns?: string[];
  /** A member serving a public sentence today, and how: "in the stocks". */
  sentenced?: { who: string; how: string };
};

const STAPLES = ["bread", "grain", "fish", "drink"];

/** Derived from the ledger, the ailments and recent deaths; nothing is stored. */
export function householdConditions(s: Snapshot, clock = s.clock) {
  const out = new Map<string, HouseholdCondition>();
  const laid = new Set((s.ailments ?? []).filter((x) => bedridden(x, clock)).map((x) => x.who));
  const shunned = new Map<string, string[]>();
  for (const [k, v] of Object.entries(s.houseRegard ?? {})) {
    if (v > AT_ODDS) continue;
    const [from, to] = k.split(">");
    shunned.set(from, [...(shunned.get(from) ?? []), to]);
  }
  for (const h of s.households ?? []) {
    const c: HouseholdCondition = {};
    const sick = h.members.filter((id) => laid.has(id));
    if (sick.length) c.sick = sick;
    if (h.mourning && clock < h.mourning.until && h.members.length) {
      c.mourning = h.mourning.name;
      if (h.mourning.since !== undefined && clock < h.mourning.since + 86400) c.burying = true;
    }
    const good = s.economy?.short[h.id]?.find((g) => STAPLES.includes(g));
    if (good) {
      const from = h.buys?.find((b) => b.good === good)?.from;
      c.short = { good, seller: s.households!.find((x) => x.id === from)?.members[0] };
    }
    const shuns = shunned.get(h.id);
    if (shuns) c.shuns = shuns;
    if (h.sentence && clock < h.sentence.until) c.sentenced = { who: h.sentence.who, how: h.sentence.how };
    if (c.sick || c.mourning || c.short || c.shuns || c.sentenced) out.set(h.id, c);
  }
  return out;
}

/** At or below this a household will not call on another, even kin. */
export const AT_ODDS = -3;
const LIMIT = 6;
const pair = (from: string, to: string) => `${from}>${to}`;
/** What one household makes of another; 0 where it has no reason to think anything. */
export const regardBetween = (s: Snapshot, from: string, to: string) => s.houseRegard?.[pair(from, to)] ?? 0;
/** `wrong` is what `to` did, as `from` would put it to a keeper: "would not pay what they owe". */
export function swayRegard(s: Snapshot, from: string | undefined, to: string | undefined, by: number, wrong?: string) {
  if (!from || !to || from === to) return;
  const all = (s.houseRegard ??= {}), k = pair(from, to);
  const v = Math.max(-LIMIT, Math.min(LIMIT, (all[k] ?? 0) + by));
  if (wrong) (s.houseWrongs ??= {})[k] = wrong;
  if (Math.abs(v) >= 0.25) all[k] = v;
  else {
    delete all[k];
    delete s.houseWrongs?.[k];
  }
}

const OWES = "would not pay what they owe";
const headOf = (s: Snapshot, h: Household) => s.actors.find((a) => a.id === h.members[0]);
/** The nearest other households, nearest first. */
const neighbours = (s: Snapshot, h: Household) => (s.households ?? []).filter((x) => x !== h && !x.members.includes(s.player.id))
  .sort((a, b) => Math.hypot(a.home.x - h.home.x, a.home.y - h.home.y) - Math.hypot(b.home.x - h.home.x, b.home.y - h.home.y));

/**
 * What a new world already has between its households, so the first day is
 * not a blank: debts that have soured, some of them ready for the keeper, a
 * house robbed lately that thinks it knows who did it, and a house still in
 * mourning for someone it buried this year.
 */
export function seedHouseholds(s: Snapshot, year?: number) {
  const seed = s.manifest.seed, mine = s.households?.find((h) => h.members.includes(s.player.id));
  for (const h of s.households ?? []) {
    if (h.members.includes(s.player.id)) continue;
    const r = random(seed, "house-regard", h.id);
    if (h.credit) swayRegard(s, h.credit.from, h.id, -(h.credit.reason === "hardship" ? 2 + 3.5 * r : 2 * r), OWES);
    // A house in the player's debt comes round about it some day in the first week.
    if (mine && h.credit?.from === mine.id)
      (s.later ??= []).push({ card: "credit-due", at: s.clock + (1 + Math.floor(r * 6)) * 86400, who: h.credit.debtor });
    const lately = (kind: string, years: number) => year !== undefined && [...(h.history ?? [])].reverse().find((e) => e.kind === kind && year - e.year <= years);
    const dead = lately("died", 0);
    if (dead && random(seed, "mourning", h.id) < 0.25) h.mourning = { name: dead.name ?? "one of the household", until: s.clock + (0.5 + 2.5 * r) * 86400 };
    // Suspicion falls on the poorest house close by, fairly or not.
    const suspect = lately("robbed", 1) && neighbours(s, h).slice(0, 5).sort((a, b) => (a.fortune ?? 0.5) - (b.fortune ?? 0.5))[0];
    if (suspect) swayRegard(s, h.id, suspect.id, -(2.5 + 3 * r), "broke into their house and robbed it");
  }
}

/** Past this a house takes its quarrel to whoever keeps order. */
export const GRIEVANCE = -4.5;
/** The sorest quarrel that has a wrong a keeper could hear. */
export function worstGrievance(s: Snapshot, except?: string) {
  const byId = new Map((s.households ?? []).map((h) => [h.id, h]));
  let worst: { by: Household; against: Household; regard: number; wrong: string; debt: boolean } | undefined;
  for (const [k, regard] of Object.entries(s.houseRegard ?? {})) {
    const wrong = s.houseWrongs?.[k];
    if (!wrong || regard > GRIEVANCE || (worst && regard >= worst.regard)) continue;
    const [from, to] = k.split(">"), by = byId.get(from), against = byId.get(to);
    if (by && against && from !== except && to !== except) worst = { by, against, regard, wrong, debt: against.credit?.from === from };
  }
  return worst;
}

/**
 * The day's reckoning between households, at dawn. Old feeling fades. A
 * seller who let a house go short is held to it and a lender sours on a debt.
 * A house short of bread is sent grain by kin who have it, or, poor and
 * unhelped, may take it from a neighbour's store. A house in trouble warms
 * to the kin who came.
 */
export function settleRegard(s: Snapshot, conditions = householdConditions(s), year?: number) {
  const households = s.households ?? [], byId = new Map(households.map((h) => [h.id, h]));
  const stock = s.economy?.stock ?? {}, day = Math.floor(s.clock / 86400);
  for (const k of Object.keys(s.houseRegard ?? {})) {
    const [from, to] = k.split(">");
    swayRegard(s, from, to, -s.houseRegard![k] * 0.1);
  }
  const houseOf = new Map(s.actors.map((a) => [a.id, a.householdId]));
  const kin = new Map<string, Set<string>>();
  for (const a of s.actors)
    for (const r of a.relations ?? []) {
      const theirs = houseOf.get(r.other);
      if (!a.householdId || !theirs || theirs === a.householdId) continue;
      for (const [x, y] of [[a.householdId, theirs], [theirs, a.householdId]]) kin.set(x, (kin.get(x) ?? new Set()).add(y));
    }
  for (const h of households) {
    const short = s.economy?.short[h.id] ?? [], head = headOf(s, h);
    for (const good of short) {
      const seller = byId.get(h.buys?.find((b) => b.good === good)?.from ?? "");
      const theirs = seller && conditions.get(seller.id);
      // Nobody blames a house for having its baker in bed or its dead to bury.
      if (!seller || seller === h || theirs?.sick || theirs?.mourning) continue;
      swayRegard(s, h.id, seller.id, -1, `left them without ${good}`);
      const their = headOf(s, seller);
      if (head && their) hear(head, { act: `${their.name}'s household had no ${good} to sell`, tone: -3, at: s.clock, hops: 0, about: their.id, conduct: true });
    }
    // Ordinary credit rankles a little and stops there; a debt taken in hardship and not paid keeps souring.
    if (h.credit && (h.credit.reason === "hardship" || regardBetween(s, h.credit.from, h.id) > -2)) swayRegard(s, h.credit.from, h.id, -0.5, OWES);
    if (!head || h.members.includes(s.player.id) || !short.some((g) => g === "bread" || g === "grain")) continue;
    const want = h.members.length * 3;
    const spare = (x: Household) => (stock[x.id]?.grain ?? 0) > x.members.length * 20 + want;
    const give = (from: Household) => {
      stock[from.id].grain -= want;
      (stock[h.id] ??= {}).grain = (stock[h.id].grain ?? 0) + want;
    };
    const giver = [...(kin.get(h.id) ?? [])].map((id) => byId.get(id)!).find((k) => regardBetween(s, k.id, h.id) > AT_ODDS && spare(k));
    const theirs = giver && headOf(s, giver);
    if (giver) {
      give(giver);
      swayRegard(s, h.id, giver.id, 1.5);
      if (theirs) hear(head, { act: `${theirs.name}'s household sent grain round to ${head.name}'s when they had none`, tone: 3, at: s.clock, hops: 0, about: theirs.id, conduct: true });
    } else if ((h.fortune ?? 0.5) < 0.4 && random(s.manifest.seed, "take-grain", h.id, day) < 0.08) {
      const victim = neighbours(s, h).find((x) => !kin.get(h.id)?.has(x.id) && spare(x)), robbed = victim && headOf(s, victim);
      if (!victim) continue;
      give(victim);
      swayRegard(s, victim.id, h.id, -2.5, "took grain from their store");
      if (year !== undefined) (victim.history ??= []).push({ year, kind: "robbed" });
      if (robbed) hear(robbed, { act: `${head.name}'s household took grain from ${robbed.name}'s store`, tone: -4, at: s.clock, hops: 0, about: head.id, conduct: true });
    }
  }
  for (const [id, c] of conditions) {
    if (!c.mourning && !c.sick) continue;
    // Settles near +3 against the daily fade if the trouble lasts.
    for (const k of kin.get(id) ?? []) if (!conditions.get(k)?.shuns?.includes(id)) swayRegard(s, id, k, 0.3);
  }
}

/** What the street is saying about a house today, in a sentence; undefined when it is nothing. */
export function houseTalk(s: Snapshot, h: Household, c = householdConditions(s).get(h.id)) {
  const name = (id?: string) => s.actors.find((a) => a.id === id)?.name;
  if (c?.sentenced) return `${name(c.sentenced.who) ?? "One of them"} is ${c.sentenced.how} today.`;
  if (c?.mourning) return `The house is in mourning: ${c.mourning} has died${c.burying ? ", and the burial is today" : ""}.`;
  const foe = c?.shuns?.map((id) => ({ id, wrong: s.houseWrongs?.[pair(h.id, id)], v: regardBetween(s, h.id, id) })).sort((a, b) => a.v - b.v)[0];
  const their = foe && s.households?.find((x) => x.id === foe.id), head = their && headOf(s, their);
  if (foe && head) return `They have fallen out with ${head.name}'s household${foe.wrong ? `, who they say ${foe.wrong}` : ""}.`;
  if (c?.sick) return `${c.sick.length > 1 ? `${c.sick.length} of the house are` : `${name(c.sick[0]) ?? "One of the house"} is`} ill in bed.`;
}
