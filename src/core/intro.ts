import { HARDSHIP, UNCOMMON_STAT, UNCOMMON_TRADE, UNTAUGHT_TRADE, WEATHER, settlementNoun } from "../content/intro";
import { learnerArrangementFor } from "../content/households/learners";
import { residenceFor } from "../content/households/residence";
import { pluralMarriageFor } from "../content/households/plural-marriage";
import { bondageFor } from "../content/households/bondage";
import { nursingFor } from "../content/households/nursing";
import { ritualKinFor } from "../content/households/ritual-kin";
import { TIDINGS } from "../content/history/tidings";
import { PLOTS } from "../content/plots";
import { matchesCharacterScope } from "../content/characters/resolve";
import { regionPhrase } from "../content/geography/region-label";
import { unusualOf } from "./unusual";
import { kinOf } from "./kin";
import { plotKnown, plotRoleKnown } from "./plot";
import { seasonAt } from "./livelihood";
import { skySeed, weatherAt } from "./weather";
import { random } from "./random";
import { sexOf } from "./brief";
import { concernsOf, fill, inWords, kinWord, type Concern, type IntroSpan } from "./concerns";
import { herdCount } from "../content/fauna/herding";
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
  const wording = plot && !plot.ended && plotKnown(plot) ? PLOTS.find((t) => t.id === plot.id)?.wording : undefined;
  const lines = wording && { ...wording.at(-1)!.lines, ...wording[plot!.wording]?.lines };
  if (!plot || !lines) return [];
  const slot = (key: string): IntroSpan | string | undefined => {
    const id = plot.refs?.[key];
    const text = plot.words[key];
    if (text === undefined) return;
    return id ? { text, ref: id, mark: plotRoleKnown(plot, id) ? "plot" : "kin" } : text;
  };
  const pledge = lines.pledge && plot.words.child ? lines.pledge : undefined;
  return [lines.intro, pledge ?? lines.threat, !pledge && plot.words.partner ? lines.partner : undefined]
    .flatMap((line) => (line ? sentence(fill(line, slot)) : []));
}

/** Whoever in the house is learning the player's trade. */
function learnerOf(s: Snapshot) {
  const home = s.player.householdId;
  const ids = (s.player.relations ?? []).filter((r) => r.kind === "apprentice").map((r) => r.other);
  return s.actors.find((a) => ids.includes(a.id) && !a.dead && a.householdId === home);
}

const PRONOUNS = {
  female: { she: "she", her: "her", him: "her", She: "She", Her: "Her" },
  male: { she: "he", her: "his", him: "him", She: "He", Her: "His" },
};
const pronounsOf = (a: Actor) => PRONOUNS[sexOf(a) === "female" ? "female" : "male"];
const ofSex = (a: Actor, female: string, male: string) => (sexOf(a) === "female" ? female : male);
const person = (a: Actor): IntroSpan => ({ text: a.name, ref: a.id, mark: "kin" });

/** One custom's line, with its people as marked names and the rest as words. */
const say = (line: string, people: Record<string, Actor>, words: Record<string, string>) =>
  sentence(capital(fill(line, (k) => (people[k] ? person(people[k]) : words[k]))));
const pickLine = (s: Snapshot, lines: readonly string[], ...k: string[]) =>
  lines[Math.floor(random(s.manifest.seed, "intro", ...k) * lines.length)];

/** The learner, in the terms this place and time set for the arrangement. */
function learnerSentence(s: Snapshot, setting: WorldSetting | undefined, a: Actor): IntroSpan[] {
  const way = learnerArrangementFor(setting);
  const own = s.player.relations?.some((r) => r.other === a.id && r.kind === "child");
  const lines = own ? way.lines.own : a.origin?.standing === "unfree" && way.lines.bound?.length ? way.lines.bound : way.lines.taken;
  const as = way.word[sexOf(a) === "female" ? 0 : 1];
  const history = s.households?.find((h) => h.id === s.player.householdId)?.history ?? [];
  const joined = [...history].reverse().find((e) => e.kind === "joined" && e.as === as);
  const left = way.term && Math.max(1, way.term - (setting && joined ? setting.year - joined.year : 0));
  const p = pronounsOf(a);
  const words: Record<string, string> = { ...p, as, child: ofSex(a, "daughter", "son"),
    left: !left ? "" : left === 1 ? `This is ${p.her} last year` : `${p.She} has ${inWords(left)} more years to serve` };
  return say(pickLine(s, lines, "learner", a.id), { name: a }, words);
}

type Custom = { about: string[]; spans: IntroSpan[]; item?: IntroSpan[] };

/** What this house holds that its time and place made: a second wife, a
 * married-in child or parent-in-law, someone bound to it, a nurse, kin by
 * ceremony. Each says its own sentence; `item` names them in the household
 * list instead when there is no room for the sentence. */
function customs(s: Snapshot, setting: WorldSetting | undefined, partners: Actor[]): Custom[] {
  const home = s.player.householdId;
  const byId = new Map(s.actors.map((a) => [a.id, a]));
  const related = (kind: string) => (s.player.relations ?? []).filter((r) => r.kind === kind)
    .map((r) => byId.get(r.other)).filter((a): a is Actor => !!a && !a.dead && a.kind === "human");
  const out: Custom[] = [];

  const residence = residenceFor(setting);
  for (const a of related("parent-in-law").filter((a) => a.householdId === home)) {
    const as = ofSex(a, "mother-in-law", "father-in-law");
    out.push({ about: [a.id], item: [{ text: `your ${as} ` }, person(a)],
      spans: residence ? say(pickLine(s, residence.lines.parent, "in-law", a.id), { name: a }, { ...pronounsOf(a), as }) : [] });
  }
  for (const a of related("child-in-law").filter((a) => a.householdId === home)) {
    const kid = a.relations?.map((r) => r.kind === "partner" ? byId.get(r.other) : undefined).find((b) => b && !b.dead);
    if (!kid) continue;
    out.push({ about: [a.id, kid.id], item: [{ text: `your ${ofSex(kid, "daughter", "son")}'s ${ofSex(a, "wife", "husband")} ` }, person(a)],
      spans: residence ? say(pickLine(s, residence.lines.child, "in-law", a.id), { name: a, kid },
        { as: ofSex(a, "wife", "husband"), child: ofSex(kid, "daughter", "son") }) : [] });
  }

  const plural = pluralMarriageFor(setting);
  if (partners.length > 1) {
    const [first, ...later] = partners;
    for (const a of later)
      out.push({ about: [a.id, first.id], item: [{ text: `your ${plural?.word ?? "second wife"} ` }, person(a)],
        spans: plural ? say(pickLine(s, plural.lines, "plural", a.id), { name: a, first }, { as: plural.word }) : [] });
  }

  const learner = learnerOf(s);
  if (learner) out.push({ about: [learner.id], spans: learnerSentence(s, setting, learner) });

  const bondage = bondageFor(setting);
  const servants = related("servant").filter((a) => a.householdId === home);
  for (const a of servants.filter((a) => a.origin?.standing === "unfree" && a.role !== "Wet nurse").slice(0, 1))
    if (bondage)
      out.push({ about: [a.id], spans: say(pickLine(s, bondage.lines, "bound", a.id), { name: a },
        { ...pronounsOf(a), as: bondage.word[sexOf(a) === "female" ? 0 : 1] }) });

  const nursing = nursingFor(setting);
  const nurse = servants.find((a) => a.role === "Wet nurse");
  if (nursing && nurse && nursing.mode === "in")
    out.push({ about: [nurse.id], spans: say(pickLine(s, nursing.lines, "nurse", nurse.id), { name: nurse }, {}) });
  if (nursing && nursing.mode === "out" && s.households?.find((h) => h.id === home)?.nurse === "out")
    out.push({ about: [], spans: sentence([{ text: pickLine(s, nursing.lines, "nurse-out") }]) });

  const tie = ritualKinFor(setting);
  const sworn = related("ritual-kin")[0];
  if (tie && sworn) {
    const kid = kinOf(s).filter((k) => k.kind === "child").map((k) => k.actor).sort((p, q) => (q.age ?? 0) - (p.age ?? 0))[0];
    const lines = kid && tie.lines.child ? tie.lines.child : tie.lines.other;
    out.push({ about: [sworn.id], spans: say(pickLine(s, lines, "ritual-kin", sworn.id), { name: sworn, ...(kid ? { kid } : {}) },
      { ...pronounsOf(sworn), as: tie.word[sexOf(sworn) === "female" ? 0 : 1], child: kid ? ofSex(kid, "daughter", "son") : "" }) });
  }
  return out;
}

/** Who shares the house, for a life without a plot to introduce them, then
 * the two things about it most particular to its time and place. */
function household(s: Snapshot, told: ReadonlySet<string>, setting: WorldSetting | undefined): IntroSpan[] {
  const home = s.player.householdId;
  if (!home) return [];
  const kin = kinOf(s).filter((k) => k.actor.householdId === home);
  const of = (kind: string) => kin.filter((k) => k.kind === kind).map((k) => k.actor)
    .sort((a, b) => (b.age ?? 0) - (a.age ?? 0));
  const all = customs(s, setting, of("partner"));
  const said = all.filter((c) => c.spans.length).slice(0, 2);
  const quiet = new Set(said.flatMap((c) => c.about));
  // Someone the paragraph has already named is just "your sister" here.
  const named = (kind: string, a: Actor): IntroSpan[] => told.has(a.id)
    ? [{ text: `your ${kinWord(kind, a)}` }]
    : [{ text: `your ${kinWord(kind, a)} ` }, person(a)];
  const items: IntroSpan[][] = of("partner").slice(0, 1).filter((a) => !quiet.has(a.id)).map((a) => named("partner", a));
  const children = of("child").filter((a) => !quiet.has(a.id));
  if (children.length === 1) items.push(named("child", children[0]));
  else if (children.length === 2)
    items.push([{ text: "your children " }, person(children[0]), { text: " and " }, person(children[1])]);
  else if (children.length > 2) items.push([{ text: `your ${inWords(children.length)} children` }]);
  items.push(...of("parent").map((a) => named("parent", a)));
  items.push(...all.filter((c) => c.item && !c.about.some((id) => quiet.has(id))).map((c) => c.item!));
  const siblings = of("sibling");
  if (siblings.length === 1) items.push(named("sibling", siblings[0]));
  else if (siblings.length > 1) items.push([{ text: `your ${inWords(siblings.length)} brothers and sisters` }]);
  const list = items.slice(0, 3);
  const extra = said.flatMap((c) => c.spans);
  if (!list.length)
    return extra.length ? extra : s.households?.find((h) => h.id === home)?.members.length === 1 ? [{ text: "You live alone. " }] : [];
  return [...sentence([
    { text: "You share the house with " },
    ...list.flatMap((item, i) => [...(i === 0 ? [] : [{ text: i === list.length - 1 ? " and " : ", " }]), ...item]),
    { text: "." },
  ]), ...extra];
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
  const trade = learnerOf(s) ? UNCOMMON_TRADE : [...UNCOMMON_TRADE, ...UNTAUGHT_TRADE];
  for (const u of unusualOf(s.manifest.seed, s.player, setting, s.actors)) {
    const line = u.kind === "stat" ? UNCOMMON_STAT[`${u.stat}:${u.high ? "high" : "low"}`]
      : trade[Math.floor(random(s.manifest.seed, "intro", "trade", s.player.id) * trade.length)];
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
    : [...hardship(s, setting), ...(also ? sentence([...capital(also.spans), { text: "." }]) : []), ...household(s, told, setting)];
  const herd = s.fauna?.find((g) => g.owner === "player" && g.members.length);
  if (herd) second.push(...sentence([{ text: `Your ${herdCount(herd.speciesId, herd.members.length).replace(/^\d+/, (n) => inWords(+n))} ${herd.members.length === 1 ? "is" : "are"} ${herd.gateId ? "in the pen by your house" : "grazing close by"}.` }]));
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
