import { HARDSHIP, UNCOMMON_STAT, UNCOMMON_TRADE, WEATHER, settlementNoun } from "../content/intro";
import { TIDINGS } from "../content/history/tidings";
import { PLOTS } from "../content/plots";
import { matchesCharacterScope } from "../content/characters/resolve";
import { regionPhrase } from "../content/geography/region-label";
import { outlookOf } from "./outlook";
import { unusualOf } from "./unusual";
import { kinOf } from "./kin";
import { sexOf } from "./brief";
import { seasonAt } from "./livelihood";
import { skySeed, weatherAt } from "./weather";
import { random } from "./random";
import type { Actor, Snapshot } from "./types";
import type { WorldSetting } from "../content/geography/types";

/** A run of the opening text. `ref` names someone the reader can ask about;
 * `note` glosses a term from the wider world. */
export type IntroSpan = { text: string; ref?: string; mark?: "kin" | "plot" | "note"; note?: string };
/** Paragraphs, then the one line about what is rare in this person, if anything is. */
export type Intro = { body: IntroSpan[][]; uncommon?: string };

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
export function inWords(n: number) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : "");
  return String(n);
}

/** "takes the sacred text exactly as written" as said to the holder. */
export function secondPerson(clause: string) {
  const [verb, ...rest] = clause.split(" ");
  const said =
    verb === "is" ? "are" : verb === "has" ? "have" : verb === "does" ? "do" : verb === "goes" ? "go"
      : verb.endsWith("ies") ? `${verb.slice(0, -3)}y`
      : /(ss|sh|ch|x|z)es$/.test(verb) ? verb.slice(0, -2)
      : verb.endsWith("s") && !verb.endsWith("ss") ? verb.slice(0, -1)
      : verb;
  return [said, ...rest].join(" ");
}

const article = (word: string) => (/^[aeiou]/i.test(word) ? "an" : "a");
const KIN_WORD: Record<string, [string, string, string]> = {
  partner: ["wife", "husband", "partner"],
  child: ["daughter", "son", "child"],
  parent: ["mother", "father", "parent"],
  sibling: ["sister", "brother", "sibling"],
};
const kinWord = (kind: string, a: Actor) => {
  const sex = sexOf(a);
  return KIN_WORD[kind][sex === "female" ? 0 : sex === "male" ? 1 : 2];
};

/** A line with `{key}` slots, each filled with a span or with plain words. */
function fill(line: string, slot: (key: string) => IntroSpan | string | undefined): IntroSpan[] {
  return line.split(/(\{\w[\w ]*\})/).flatMap((part) => {
    if (!/^\{.+\}$/.test(part)) return part ? [{ text: part }] : [];
    const got = slot(part.slice(1, -1));
    return got === undefined ? [] : typeof got === "string" ? [{ text: got }] : [got];
  });
}

/** Plain runs joined, so a paragraph is as few spans as it can be. */
function tidy(spans: IntroSpan[]) {
  return spans.reduce<IntroSpan[]>((out, s) => {
    const last = out.at(-1);
    if (last && !last.ref && !last.mark && !s.ref && !s.mark) last.text += s.text;
    else out.push({ ...s });
    return out;
  }, []);
}

const sentence = (spans: IntroSpan[]) => [...spans, { text: " " }];

/** A name that is a stretch of country rather than a settlement: "Hula valley". */
const AREA = /\s(coast|shore|plain|plains|valley|highlands|hills|basin|delta|bend|steppe|plateau|lowlands|uplands|forest|desert|islands|marshes|fens|downs|interior|savanna|mountains)$/i;
/** How the place reads mid-sentence: "Kadasa", or "the Hula valley". */
export const herePhrase = (name: string) => (AREA.test(name) ? `the ${name}` : name);

function scene(s: Snapshot, setting: WorldSetting, here: string) {
  const role = s.player.role.toLowerCase();
  const region = regionPhrase({ ...setting, location: here });
  const hilly = setting.relief > 0.6;
  const urban = setting.settlement === "city" || setting.settlement === "port";
  const noun = settlementNoun(setting.architecture === "shelter" ? setting.settlement : setting.settlement === "camp" ? "village" : setting.settlement, setting.population, hilly);
  const inland = /\b(Valley|Plateau|Basin|Highlands|Interior|Steppes|Plains?|Foothills|Slopes|Mountains|Rift)\b/.test(region ?? "");
  const where = !region ? ""
    : setting.water.startsWith("coast") && !hilly && !urban && !inland ? ` on the coast of ${region}`
    : setting.water.startsWith("river") && !hilly && !urban ? ` on a river in ${region}`
    : setting.water === "lake" && !hilly && !urban ? ` on a lake in ${region}`
    : ` in ${region}`;
  const w = weatherAt(skySeed(s.manifest), setting.climate, setting.season, s.clock);
  const hour = Math.floor(s.clock / 3600) % 24;
  const seasonal = setting.climate !== "tropical";
  const season = seasonAt(setting.season, s.clock);
  const options = WEATHER[w.condition]({
    season: seasonal ? season : "",
    part: hour < 5 || hour >= 21 ? "night" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening",
    cold: w.tempC < 6,
    hot: w.tempC >= 30,
    monsoon: setting.climate === "monsoon" && season === "summer",
  });
  const sky = options[Math.floor(random(s.manifest.seed, "intro", "sky") * options.length)];
  if (here.startsWith("the "))
    return `You begin another day as ${article(role)} ${role} in ${article(noun)} ${noun} ${/(coast|shore)$/i.test(here) ? "on" : "in"} ${here}, ${sky}.`;
  // A place named for its region already says where it is.
  const gloss = region ? `, ${article(noun)} ${noun}${where}` : "";
  return `You begin another day as ${article(role)} ${role} in ${here}${gloss}, ${sky}.`;
}

/** One thing that makes this person someone in particular: a loss or a
 * change in the household lately, else the rarest view they hold. */
function self(s: Snapshot, setting: WorldSetting | undefined, here: string, partner: Actor | undefined) {
  const p = s.player;
  const head = `You are ${p.name}${p.age === undefined ? "" : `, ${inWords(p.age)}`}`;
  const history = s.households?.find((h) => h.members.includes(p.id))?.history ?? [];
  const ago = (year: number) => (setting ? setting.year - year : Infinity);
  const latest = (kind: string, as?: string[]) =>
    [...history].reverse().find((e) => e.kind === kind && (!as || as.includes(e.as ?? "")));
  const lost = !partner && latest("died", ["wife", "husband", "partner"]);
  if (lost && ago(lost.year) <= 1) return `${head}, and newly widowed.`;
  if (lost && ago(lost.year) <= 12) return `${head}, and widowed these ${inWords(ago(lost.year))} years.`;
  const moved = latest("moved");
  if (moved && ago(moved.year) <= 1) return `${head}, and newly come to ${here}.`;
  if (moved && ago(moved.year) <= 5) return `${head}, and only ${inWords(ago(moved.year))} years in ${here}.`;
  const wed = latest("wed");
  if (wed && partner && ago(wed.year) <= 1) return `${head}, and newly married.`;
  // A view peculiar to this time and place says more than one held everywhere.
  const held = setting ? outlookOf(s.manifest.seed, p, setting).stances : [];
  // How someone holds beliefs at all needs more context than what they believe.
  const general = held.filter((v) => v.kind !== "temper");
  const pool = general.length ? general : held;
  const view = held.find((v) => v.scope.cultures || v.scope.bounds || v.scope.places || v.scope.communities) ??
    pool[Math.floor(random(s.manifest.seed, "intro", "view") * pool.length)];
  return view ? `${head}, and you ${secondPerson(view.clause)}.` : `${head}.`;
}

function tiding(setting: WorldSetting, here: string, community: string): IntroSpan[] {
  const t = TIDINGS.find((x) => matchesCharacterScope(x.scope, setting, community));
  if (!t) return [];
  return fill(t.text, (key) => (key === "here" ? here : { text: key, mark: "note", note: t.note }));
}

/** The plot's own paragraph: what is owed and to whom, then who it will
 * fall on. */
function plotParagraph(s: Snapshot): IntroSpan[] {
  const plot = s.plot;
  const lines = plot && !plot.ended ? PLOTS.find((t) => t.id === plot.id)?.wording[plot.wording]?.lines : undefined;
  if (!plot || !lines) return [];
  const cast = new Set(Object.values(plot.cast));
  const slot = (key: string): IntroSpan | string | undefined => {
    const id = plot.refs?.[key];
    const text = plot.words[key];
    if (text === undefined) return;
    return id ? { text, ref: id, mark: cast.has(id) ? "plot" : "kin" } : text;
  };
  const pledge = lines.pledge && plot.words.child ? lines.pledge : undefined;
  return [lines.intro, pledge ?? lines.threat, !pledge && plot.words.partner ? lines.partner : undefined]
    .flatMap((line) => (line ? sentence(fill(line, slot)) : []));
}

/** Who shares the house, for a life without a plot to introduce them. */
function household(s: Snapshot): IntroSpan[] {
  const home = s.player.householdId;
  if (!home) return [];
  const kin = kinOf(s).filter((k) => k.actor.householdId === home);
  const named = (kind: string, a: Actor): IntroSpan[] =>
    [{ text: `your ${kinWord(kind, a)} ` }, { text: a.name, ref: a.id, mark: "kin" }];
  const of = (kind: string) => kin.filter((k) => k.kind === kind).map((k) => k.actor)
    .sort((a, b) => (b.age ?? 0) - (a.age ?? 0));
  const items: IntroSpan[][] = of("partner").map((a) => named("partner", a));
  const children = of("child");
  if (children.length === 1) items.push(named("child", children[0]));
  else if (children.length === 2)
    items.push([{ text: "your children " }, { text: children[0].name, ref: children[0].id, mark: "kin" },
      { text: " and " }, { text: children[1].name, ref: children[1].id, mark: "kin" }]);
  else if (children.length > 2) items.push([{ text: `your ${inWords(children.length)} children` }]);
  items.push(...of("parent").map((a) => named("parent", a)));
  const siblings = of("sibling");
  if (siblings.length === 1) items.push(named("sibling", siblings[0]));
  else if (siblings.length > 1) items.push([{ text: `your ${inWords(siblings.length)} brothers and sisters` }]);
  const list = items.slice(0, 3);
  if (!list.length)
    return s.households?.find((h) => h.id === home)?.members.length === 1 ? [{ text: "You live alone. " }] : [];
  return sentence([
    { text: "You share the house with " },
    ...list.flatMap((item, i) => [...(i === 0 ? [] : [{ text: i === list.length - 1 ? " and " : ", " }]), ...item]),
    { text: "." },
  ]);
}

function hardship(s: Snapshot, setting: WorldSetting | undefined): IntroSpan[] {
  const history = s.households?.find((h) => h.members.includes(s.player.id))?.history ?? [];
  const e = [...history].reverse().find((x) => x.kind === "bad-year" || x.kind === "fire" || x.kind === "robbed");
  const ago = e && setting ? setting.year - e.year : Infinity;
  if (!e || ago > 2) return [];
  const when = ago <= 0 ? "this year" : ago === 1 ? "last year" : "two years ago";
  return sentence([{ text: HARDSHIP[e.kind as keyof typeof HARDSHIP](when) }]);
}

function uncommon(s: Snapshot, setting: WorldSetting | undefined, here: string) {
  for (const u of unusualOf(s.manifest.seed, s.player, setting, s.actors)) {
    const line = u.kind === "stat" ? UNCOMMON_STAT[`${u.stat}:${u.high ? "high" : "low"}`] : UNCOMMON_TRADE;
    if (line) return line.replace("{here}", here).replace("{role}", s.player.role.toLowerCase());
  }
}

/** The opening paragraphs of a life: where and who you are, the news, then
 * the plot or the household. Every clause is dropped when its fact is missing. */
export function composeIntro(s: Snapshot, setting?: WorldSetting, place?: string): Intro {
  const here = herePhrase(place || setting?.location || "the village");
  const partner = kinOf(s).find((k) => k.kind === "partner")?.actor;
  const first = setting
    ? [
        ...sentence([{ text: scene(s, setting, here) }]),
        ...sentence([{ text: self(s, setting, here, partner) }]),
        ...tiding(setting, here, s.player.origin?.community ?? "*"),
      ]
    : sentence([{ text: self(s, setting, here, partner) }]);
  const plotted = plotParagraph(s);
  const second = plotted.length ? plotted : [...hardship(s, setting), ...household(s)];
  const trim = (p: IntroSpan[]) => {
    const spans = tidy(p);
    const last = spans.at(-1);
    if (last) last.text = last.text.trimEnd();
    return spans;
  };
  return { body: [first, second].filter((p) => p.length).map(trim), uncommon: uncommon(s, setting, here) };
}

/** The world's own name for the settlement, without the year some packs append. */
export const settlementName = (packName: string) => packName.replace(/,\s*\d+\s*(BCE|CE)$/, "");

export const introText = (intro: Intro) =>
  [...intro.body.map((p) => p.map((x) => x.text).join("")), intro.uncommon ?? ""].filter(Boolean).join("\n\n");
