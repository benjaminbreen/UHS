import { whyLeft } from "../content/bonds";
import { outlookOf } from "./outlook";
import { kinOf } from "./kin";
import { sexOf } from "./brief";
import { random } from "./random";
import { ailmentDef, conditionsOf, forHowLong, healthPerson, nameFor, severity } from "./health";
import type { Actor, Snapshot } from "./types";
import type { WorldSetting } from "../content/geography/types";

/** A run of the opening text. `ref` names someone the reader can ask about;
 * `note` glosses a term. */
export type IntroSpan = { text: string; ref?: string; mark?: "kin" | "plot" | "person" | "note"; note?: string };

/** One thing weighing on a life, as a clause that reads after "and " or,
 * capitalised, as a sentence of its own. */
export type Concern = { kind: string; weight: number; about?: string; spans: IntroSpan[] };

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
export function inWords(n: number) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : "");
  return String(n);
}

/** A line with `{key}` slots, each filled with a span or with plain words. */
export function fill(line: string, slot: (key: string) => IntroSpan | IntroSpan[] | string | undefined): IntroSpan[] {
  return line.split(/(\{\w[\w ]*\})/).flatMap((part) => {
    if (!/^\{.+\}$/.test(part)) return part ? [{ text: part }] : [];
    const got = slot(part.slice(1, -1));
    return got === undefined ? [] : typeof got === "string" ? [{ text: got }] : Array.isArray(got) ? got : [got];
  });
}

const KIN_WORD: Record<string, [string, string, string]> = {
  partner: ["wife", "husband", "partner"],
  child: ["daughter", "son", "child"],
  parent: ["mother", "father", "parent"],
  sibling: ["sister", "brother", "sibling"],
};
/** "wife", "son", "mother" for a relation kind, by the other's sex. */
export const kinWord = (kind: string, a: Actor) => {
  const sex = sexOf(a);
  return (KIN_WORD[kind] ?? [kind, kind, kind])[sex === "female" ? 0 : sex === "male" ? 1 : 2];
};
const pronouns = (a: Actor) => {
  const sex = sexOf(a);
  return sex === "female" ? { she: "she", her: "her" } : sex === "male" ? { she: "he", her: "his" } : { she: "they", her: "their" };
};
const ago = (n: number) => (n <= 0 ? "this year" : n === 1 ? "last year" : `${inWords(n)} years ago`);

/** The player's own people and household, by what each is to the player. */
function ownPeople(s: Snapshot) {
  const out = new Map<string, { actor: Actor; word: string; kind: string }>();
  for (const k of kinOf(s)) out.set(k.actor.id, { actor: k.actor, word: kinWord(k.kind, k.actor), kind: k.kind });
  const byId = new Map(s.actors.map((a) => [a.id, a]));
  for (const r of s.player.relations ?? []) {
    const a = byId.get(r.other);
    if (!a || a.dead || out.has(a.id) || a.kind !== "human") continue;
    if (r.kind === "servant" || r.kind === "apprentice") out.set(a.id, { actor: a, word: r.kind, kind: r.kind });
  }
  return out;
}

/** Everything weighing on this life, heaviest first. */
export function concernsOf(s: Snapshot, setting: WorldSetting | undefined, here: string): Concern[] {
  const p = s.player, seed = s.manifest.seed, clock = s.clock;
  const jitter = (...k: string[]) => random(seed, "concern", ...k) * 0.08;
  const pick = <T,>(xs: readonly T[], ...k: string[]) => xs[Math.floor(random(seed, "concern-line", ...k) * xs.length)];
  const people = ownPeople(s);
  const byId = new Map(s.actors.map((a) => [a.id, a]));
  const who = (id: string): IntroSpan[] => {
    const own = people.get(id), a = byId.get(id);
    return own ? [{ text: `your ${own.word} ` }, { text: own.actor.name, ref: id, mark: "kin" }]
      : a ? [{ text: a.name, ref: id, mark: "person" }] : [];
  };
  const out: Concern[] = [];
  const add = (kind: string, weight: number, spans: IntroSpan[], about?: string) =>
    out.push({ kind, weight: weight + jitter(kind, about ?? ""), spans, about });

  for (const ail of s.ailments ?? []) {
    const sev = severity(ail, clock);
    if (sev <= 0) continue;
    const def = ailmentDef(ail.id), name = nameFor(def, setting);
    const slots = (key: string) => (key === "for" ? forHowLong(ail, clock, inWords) : key === "name" ? { text: name, mark: "note" as const, note: def.gloss } : undefined);
    if (ail.who === p.id) add("ill", 0.85, fill(def.you, slots), p.id);
    else if (people.has(ail.who)) {
      const child = (people.get(ail.who)!.actor.age ?? 30) < 15;
      add("ill", 0.78 + (child ? 0.05 : 0) + (sev > 0.6 ? 0.05 : 0), fill(def.of, (k) => (k === "who" ? who(ail.who) : slots(k))), ail.who);
    }
  }

  const household = s.households?.find((h) => h.members.includes(p.id));
  const history = household?.history ?? [];
  const year = setting?.year;
  const since = (y: number) => (year === undefined ? Infinity : year - y);
  const latest = (kind: string, as?: string[]) =>
    [...history].reverse().find((e) => e.kind === kind && (!as || as.includes(e.as ?? "")));
  const partner = kinOf(s).find((k) => k.kind === "partner")?.actor;

  const lost = !partner && latest("died", ["wife", "husband", "partner"]);
  if (lost && since(lost.year) <= 1) add("widowed", 0.72, [{ text: "you are newly widowed" }]);
  else if (lost && since(lost.year) <= 12) add("widowed", 0.45, [{ text: `you have been widowed these ${inWords(since(lost.year))} years` }]);
  const buried = [...history].reverse().find((e) => e.kind === "died" && ["son", "daughter", "mother", "father"].includes(e.as ?? "") && since(e.year) <= 2);
  if (buried) {
    const n = since(buried.year);
    const whose = buried.as === "son" || buried.as === "daughter" ? "a" : "your";
    add("grief", n <= 0 ? 0.76 : n === 1 ? 0.62 : 0.46, [{ text: `you buried ${whose} ${buried.as} ${ago(n)}` }]);
  }
  const lostChildren = history.filter((e) => e.kind === "died" && (e.as === "son" || e.as === "daughter") && e !== buried);
  if (lostChildren.length >= 2)
    add("grief", 0.42, [{ text: pick([`you have buried ${inWords(lostChildren.length)} of your children`, `${inWords(lostChildren.length)} of your children are in the ground`], "buried") }]);
  else if (lostChildren.length === 1) {
    const as = lostChildren[0].as!;
    add("grief", 0.3, [{ text: pick([`you lost a ${as} when ${as === "son" ? "he" : "she"} was small`, `a ${as} of yours died young`], "lost") }]);
  }
  const age = p.age ?? 30;
  const born = history.some((e) => e.kind === "born" || (e.kind === "died" && (e.as === "son" || e.as === "daughter")));
  if (partner && !born && age >= 24 && age <= 50)
    add("childless", 0.32, [{ text: `you and your ${kinWord("partner", partner)} ` }, { text: partner.name, ref: partner.id, mark: "kin" },
      { text: age < 38 ? " have no children yet" : " never had children" }], partner.id);
  if (!partner && age >= 35 && (year ?? 0) < 1900 && !history.some((e) => e.kind === "wed" || e.kind === "joined" && ["wife", "husband", "partner"].includes(e.as ?? "")) && !lost)
    add("unwed", 0.16, [{ text: pick(["you have never married", "you have never married, and people have stopped asking why"], "unwed") }]);
  for (const { actor, kind } of people.values()) {
    if (actor.householdId !== p.householdId) continue;
    const pro = pronouns(actor), a = actor.age ?? 0;
    if (kind === "parent" && a >= 70)
      add("elder", 0.36, [...who(actor.id), { text: ` is ${inWords(a)}, and needs more looking after than ${pro.she} will admit` }], actor.id);
    if (kind === "child" && !actor.relations?.some((r) => r.kind === "partner") && (sexOf(actor) === "female" ? a >= 15 && a <= 19 : a >= 17 && a <= 22))
      add("of-age", 0.3, [...who(actor.id), { text: " is of an age to marry" }], actor.id);
  }
  const children = [...people.values()].filter((x) => x.kind === "child" && x.actor.householdId === p.householdId).length + (household?.infants ?? 0);
  if (children >= 4) add("crowded", 0.24, [{ text: `you have ${inWords(children)} children under your roof` }]);
  const moved = latest("moved");
  if (moved && since(moved.year) <= 1) add("moved", 0.5, [{ text: `you are newly come to ${here}` }]);
  else if (moved && since(moved.year) <= 5) add("moved", 0.34, [{ text: `you have been in ${here} only ${inWords(since(moved.year))} years` }]);
  const wed = latest("wed") ?? latest("joined", ["wife", "husband", "partner"]);
  if (wed && partner && since(wed.year) <= 1) add("wed", 0.45, [{ text: "you are newly married" }]);
  if (history.some((e) => e.kind === "born" && since(e.year) <= 0) && (household?.infants ?? 0) > 0)
    add("baby", 0.45, [{ text: "there is a new baby in the house" }]);
  const left = [...history].reverse().find((e) => e.kind === "left" && (e.as === "son" || e.as === "daughter") && since(e.year) <= 8);
  if (left) {
    const why = whyLeft(left.as!, setting, random(seed, "left", String(left.year)));
    const far = /sea|soldier|America/.test(why);
    add("away", far ? 0.44 : 0.3, [{ text: `your ${left.as} ${why} ${ago(since(left.year))}${far && random(seed, "left-word") < 0.5 ? ", and there has been no word since" : ""}` }]);
  }

  const own = conditionsOf(seed, p, setting);
  for (const c of own) {
    const line = pick(c.you(healthPerson(p, setting)), c.id);
    add("condition", c.salience * 0.85, fill(line, (k) => (k === "name" ? { text: nameFor(c, setting), mark: "note", note: c.gloss } : undefined)), p.id);
  }
  for (const { actor } of people.values()) {
    const c = conditionsOf(seed, actor, setting).find((x) => x.salience >= 0.5);
    if (!c) continue;
    const line = pick(c.of(healthPerson(actor, setting)), c.id, actor.id);
    const pro = pronouns(actor);
    add("condition", c.salience * 0.55, [
      ...who(actor.id),
      { text: " " },
      ...fill(line, (k) => (k === "name" ? { text: nameFor(c, setting), mark: "note", note: c.gloss } : k === "her" ? pro.her : k === "she" ? pro.she : undefined)),
    ], actor.id);
  }

  const beloved = s.bonds?.find((b) => b.kind === "beloved");
  const lover = beloved && byId.get(beloved.with);
  for (const b of s.bonds ?? []) {
    const a = byId.get(b.with);
    if (!a) continue;
    const pro = pronouns(a), them = who(a.id);
    if (b.kind === "beloved") {
      const same = sexOf(a) === sexOf(p);
      const line = b.secret ? "you think more often than you should about {them}, and have told nobody why"
        : same && b.mutual ? "you and {them} are lovers"
        : same ? "you think of little but {them}"
        : b.mutual && b.opposed ? `you and {them} hope to marry, though ${pro.her} family will not hear of it`
        : b.mutual ? "you and {them} have an understanding, though nothing has been said to your families"
        : "you think more often than you should about {them}, who does not know it";
      add("love", 0.6, fill(line, (k) => (k === "them" ? them : undefined)), a.id);
    } else if (b.kind === "match") {
      const parent = kinOf(s).find((k) => k.kind === "parent" && k.actor.householdId === p.householdId)?.actor;
      add("match", 0.66, [
        { text: `your ${parent ? kinWord("parent", parent) : "family"} ${parent ? "is" : "are"} arranging a match for you with ` },
        ...them,
        ...(lover && lover.id !== a.id ? [{ text: ", though it is " }, ...who(lover.id), { text: " you think about" }] : []),
      ], a.id);
    } else if (b.kind === "rival")
      add("rival", 0.4, [{ text: "you and " }, ...them, { text: `, the other ${p.role.toLowerCase()} in ${here}, have not spoken since last winter` }], a.id);
    else if (b.kind === "estranged")
      add("estranged", 0.35, [{ text: "you have not spoken to " }, ...them, { text: ` in ${inWords(2 + Math.floor(random(seed, "estranged") * 7))} years` }], a.id);
  }

  // A belief earns its place only where it collides with the life.
  if (s.plot?.id === "debt" && !s.plot.ended && setting &&
    outlookOf(seed, p, setting).stances.some((v) => v.id === "general.usury-is-theft"))
    add("belief", 0.55, [{ text: "you have always called lending at interest theft" }]);

  // A person a love and a match both name once is enough.
  const matched = out.some((c) => c.kind === "match");
  const seen = new Set<string>();
  return out
    .filter((c) => !(matched && c.kind === "love"))
    .sort((a, b) => b.weight - a.weight)
    .filter((c) => !c.about || c.about === p.id || (!seen.has(c.about) && seen.add(c.about)));
}
