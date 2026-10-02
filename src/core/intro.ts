import { HARDSHIP, UNCOMMON_STAT, UNCOMMON_TRADE, WEATHER, settlementNoun } from "../content/intro";
import { TIDINGS } from "../content/history/tidings";
import { PLOTS } from "../content/plots";
import { matchesCharacterScope } from "../content/characters/resolve";
import { regionPhrase } from "../content/geography/region-label";
import { unusualOf } from "./unusual";
import { kinOf } from "./kin";
import { seasonAt } from "./livelihood";
import { skySeed, weatherAt } from "./weather";
import { random } from "./random";
import { concernsOf, fill, inWords, kinWord, type Concern, type IntroSpan } from "./concerns";
import type { Actor, Snapshot } from "./types";
import type { WorldSetting } from "../content/geography/types";

export type { IntroSpan } from "./concerns";
/** Paragraphs, then the one line about what is rare in this person, if anything is. */
export type Intro = { body: IntroSpan[][]; uncommon?: string };

const article = (word: string) => (/^[aeiou]/i.test(word) ? "an" : "a");
const capital = (spans: IntroSpan[]) =>
  spans.map((x, i) => (i === 0 ? { ...x, text: x.text.charAt(0).toUpperCase() + x.text.slice(1) } : x));

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

/** Who you are, and the heaviest thing on you. */
function self(s: Snapshot, top: Concern | undefined): IntroSpan[] {
  const p = s.player;
  const head = `You are ${p.name}${p.age === undefined ? "" : `, ${inWords(p.age)}`}`;
  return top ? [{ text: `${head}, and ` }, ...top.spans, { text: "." }] : [{ text: `${head}.` }];
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
function household(s: Snapshot, told: ReadonlySet<string>): IntroSpan[] {
  const home = s.player.householdId;
  if (!home) return [];
  const kin = kinOf(s).filter((k) => k.actor.householdId === home);
  // Someone the paragraph has already named is just "your sister" here.
  const named = (kind: string, a: Actor): IntroSpan[] => told.has(a.id)
    ? [{ text: `your ${kinWord(kind, a)}` }]
    : [{ text: `your ${kinWord(kind, a)} ` }, { text: a.name, ref: a.id, mark: "kin" }];
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

/** The opening paragraphs of a life: where and who you are, the heaviest
 * thing on you, the news, then the plot, or the household and what else
 * weighs on it. Every clause is dropped when its fact is missing. */
export function composeIntro(s: Snapshot, setting?: WorldSetting, place?: string): Intro {
  const here = herePhrase(place || setting?.location || "the village");
  const concerns = concernsOf(s, setting, here);
  const [top, next] = concerns;
  const first = [
    ...(setting ? sentence([{ text: scene(s, setting, here) }]) : []),
    ...sentence(self(s, top)),
    ...(setting ? tiding(setting, here, s.player.origin?.community ?? "*") : []),
  ];
  const plotted = plotParagraph(s);
  const also = next && next.weight >= 0.5 && next.kind !== top?.kind ? next : undefined;
  const told = new Set([top, also].flatMap((c) => c?.spans.flatMap((x) => (x.ref ? [x.ref] : [])) ?? []));
  const second = plotted.length ? plotted
    : [...hardship(s, setting), ...(also ? sentence([...capital(also.spans), { text: "." }]) : []), ...household(s, told)];
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
