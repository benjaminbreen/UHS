import { sexOf, type BriefSpan, type PersonBrief, type Sex } from "./brief";
import { conditionBand } from "./time/structure";
import { goods } from "../content/economy/goods";
import type { Actor, Household, Place, SocialRelation } from "./types";

/** What a resident is to the householder, as a word. */
function kin(kind: SocialRelation["kind"] | undefined, sex: Sex) {
  const by = (f: string, m: string, n: string) =>
    sex === "female" ? f : sex === "male" ? m : n;
  if (kind === "partner") return by("wife", "husband", "partner");
  if (kind === "child") return by("daughter", "son", "child");
  if (kind === "parent") return by("mother", "father", "parent");
  if (kind === "servant" || kind === "apprentice") return kind;
  return "lodger";
}
/** The householder's relation to them, else theirs to the householder turned round. */
const INVERSE: Partial<Record<SocialRelation["kind"], SocialRelation["kind"]>> = {
  parent: "child",
  child: "parent",
  partner: "partner",
};
const possessive = (sex: Sex) =>
  sex === "female" ? "her" : sex === "male" ? "his" : "their";
const list = (parts: string[]) =>
  parts.length < 2
    ? (parts[0] ?? "")
    : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
const NUMBER = ["no", "a", "two", "three", "four", "five", "six"];
const count = (n: number, one: string, many: string) =>
  `${NUMBER[n] ?? n} ${n === 1 ? one : many}`;
const TRADE: [number, string][] = [
  [0.8, "brisk"],
  [0.62, "good"],
  [0.44, "steady"],
  [0.26, "slow"],
];
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const upper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** Relative, so it reads the same in 244 BCE as in 1400. */
const ago = (years: number) =>
  years < 1
    ? "this year"
    : years < 2
      ? "last year"
      : years < 12
        ? `${years} years ago`
        : `about ${Math.round(years / 10) * 10} years ago`;

/**
 * The focus card for a building: who holds it, what it is, and how it has
 * fared. Every part is read off what the world already knows — the household
 * and its history, the structure's age and wear, whom it buys from — so it
 * says the same kind of thing about a Sumerian storehouse as a Dutch shopfront.
 */
export function placeBrief(
  place: Place,
  year: number,
  holder: Actor | undefined,
  residents: Actor[],
  household?: Household,
  /** A household's householder, for naming who they buy from. */
  headOf: (householdId: string) => Actor | undefined = () => undefined,
): PersonBrief | undefined {
  if (!holder && !place.structure) return undefined;
  const identity: BriefSpan[] = [];
  // A guildhall has a warden, not a householder. Naming whoever holds the
  // keys as its resident turned every civic building into somebody's house.
  const institution =
    place.claim?.startsWith("venue-") || place.claim?.startsWith("civic-");
  const sex = holder ? sexOf(holder) : undefined;
  const their = possessive(sex);
  const history = (!institution && household?.history) || [];
  const latest = (kind: string) => history.filter((e) => e.kind === kind).at(-1);
  if (holder && !institution) {
    identity.push({ text: holder.name, tone: "name" });
    if (holder.role)
      identity.push(
        { text: ", " },
        { text: lower(holder.role), tone: "role" },
        { text: "," },
      );
    identity.push({ text: " lives here" });
    const others: string[] = [],
      lodgers: string[] = [];
    for (const a of residents) {
      if (a.id === holder.id) continue;
      const back = a.relations?.find((r) => r.other === holder.id)?.kind;
      const kind =
        holder.relations?.find((r) => r.other === a.id)?.kind ??
        (back && INVERSE[back]);
      const term = kin(kind, sexOf(a));
      if (term === "lodger") lodgers.push(a.name);
      else others.push(`${their} ${term} ${a.name}`);
    }
    if (lodgers.length)
      others.push(
        `${count(lodgers.length, "lodger", "lodgers")}, ${list(lodgers)}`,
      );
    const infants = household?.infants ?? 0;
    if (infants)
      others.push(infants === 1 ? "a baby" : count(infants, "", "small children"));
    identity.push(
      { text: others.length ? ` with ${list(others)}` : " alone" },
      { text: "." },
    );
  } else {
    identity.push({ text: place.description });
  }

  const moment: BriefSpan[] = [];
  const say = (text: string, tone?: BriefSpan["tone"]) =>
    moment.push(tone ? { text, tone } : { text });
  const who = holder && !institution ? holder.name : "It";
  const came = history.find((e) =>
    ["built", "inherited", "moved"].includes(e.kind),
  );
  if (place.structure) {
    const age = year - place.structure.built;
    if (came?.kind === "built")
      say(`${who} built it `), say(ago(age), "thing"), say(". ");
    else {
      say("Put up "), say(ago(age), "thing");
      if (came?.kind === "inherited")
        say(`; it came to ${objectOf(sex)} from ${their} ${came.as} ${ago(year - came.year)}`);
      else if (came)
        say(`; ${residents.length > 1 ? "they" : lower(pronounOf(sex))} took it ${ago(year - came.year)}`);
      say(". ");
    }
    const fire = latest("fire");
    if (fire) say(`Rebuilt after a fire ${ago(year - fire.year)}. `);
    say("It is "), say(conditionBand(place.condition ?? 1), "state"), say(". ");
  }
  if (holder && !institution) {
    const house = residents.length > 1 ? "the household" : lower(pronounOf(sex));
    const their2 = residents.length > 1 ? "their" : their;
    const deaths = history.filter((e) => e.kind === "died");
    const partner = deaths.find((e) => e.as === "wife" || e.as === "husband");
    const remarried = partner && history.some((e) => e.kind === "wed" && e.year > partner.year);
    if (partner)
      say(`${upper(their)} ${remarried ? "first " : ""}${partner.as} died ${ago(year - partner.year)}. `);
    const buried = deaths.length - (partner ? 1 : 0);
    if (buried) say(`${who} buried ${count(buried, "child", "children")}. `);
    const left = history.filter((e) => e.kind === "left").length;
    if (left)
      say(`${upper(count(left, "grown child has", "grown children have"))} left home. `);
    const fortune = household?.fortune ?? 0.5;
    const hard = latest("bad-year");
    const robbed = latest("robbed");
    if (robbed && year - robbed.year < 2) say("Someone has been stealing from them lately. ", "state");
    else if (fortune < 0.22) say("Times are hard. ", "state");
    else if (hard && year - hard.year < 3) say(`${upper(house)} had a bad year ${ago(year - hard.year)}. `);
    else if (fortune > 0.78) say(`${upper(house)} is well off. `, "state");
    // A debt is worth saying; otherwise whichever purchase the id lands on,
    // so a street of cards does not all name the same good.
    const buys = household?.buys ?? [];
    const pick = [...(household?.id ?? "")].reduce((n, c) => n + c.charCodeAt(0), 0);
    const buy = buys.find((b) => b.from === household!.owes) ?? buys[pick % (buys.length || 1)];
    const seller = buy && headOf(buy.from);
    if (buy && seller) {
      const noun = goods.find((g) => g.id === buy.good)?.noun ?? buy.good;
      say(`${upper(their2)} ${noun} comes from `), say(seller.name, "name");
      say(household!.owes === buy.from ? `, still owing for it. ` : ". ");
    }
  }
  if (place.access === "public" && place.trade !== undefined) {
    const band = TRADE.find(([floor]) => place.trade! >= floor)?.[1] ?? "poor";
    say("Business is "), say(band, "state"), say(".");
  }
  if (!moment.length) return undefined;
  const last = moment[moment.length - 1];
  last.text = last.text.trimEnd();
  return { identity, moment };
}
const objectOf = (sex: Sex) =>
  sex === "female" ? "her" : sex === "male" ? "him" : "them";
const pronounOf = (sex: Sex) =>
  sex === "female" ? "She" : sex === "male" ? "He" : "They";
