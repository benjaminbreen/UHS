import { Engine } from "../engine";
import { random } from "../random";
import { formatHistoricalYear } from "../calendar";
import { sexOf } from "../brief";
import { kinOf } from "../kin";
import { kinWord, inWords } from "../concerns";
import { standingOf } from "../standing";
import { rollStats } from "../stats";
import { conditionsOf, healthPerson } from "../health";
import { inheritLikeness } from "../character";
import { plotLine, plotTemplate, startPlot } from "../plot";
import { ensureLifeAim } from "../life-aim";
import { causeOfDeath, epidemic } from "../../content/history/deaths";
import { TIDINGS } from "../../content/history/tidings";
import { householdWays, type Ways } from "../../content/history/households";
import { matchesCharacterScope } from "../../content/characters/resolve";
import { generateCharacter } from "../../content/characters/generate";
import type { Rank } from "../../content/characters/context-types";
import type { WorldSetting } from "../../content/geography/types";
import type { Actor, HouseholdEvent, Pack, Position, Snapshot, WorldModel } from "../types";
import { childbedRisk, yearlyRisk } from "./mortality";

type Sex = "male" | "female" | undefined;
export type Kind = "partner" | "child" | "parent" | "sibling" | "in-law" | "grandchild" | "servant" | "apprentice" | "household";
export type Person = {
  id: string;
  name: string;
  first: string;
  sex: Sex;
  born: number;
  kind: Kind;
  role: string;
  /** Lived elsewhere from the start: kin across town. */
  away?: boolean;
  /** A grandchild's parent; an in-law's spouse. */
  of?: string;
  /** The other parent, for a child born in the years. */
  with?: string;
  died?: number;
  cause?: string;
  left?: number;
  wed?: number;
  /** Someone the years brought: as first drawn, and drawn again at the age the world meets them. */
  drawn?: Drawn;
  make?: (age: number) => Drawn;
};
type Drawn = ReturnType<typeof generateCharacter>;
export type YearLine = {
  text: string;
  /** The plot's name, over its ending. */
  label?: string;
  kind: HouseholdEvent["kind"] | "news" | "body" | "plot" | "death";
  who?: string;
  note?: string;
};
export type Year = {
  year: number;
  age: number;
  lines: YearLine[];
  events: HouseholdEvent[];
  /** Who lives in the house at the year's end, the player first while alive. */
  home: string[];
  fortune: number;
};
export type Life = {
  from: number;
  born: number;
  years: Year[];
  people: Record<string, Person>;
  died?: { year: number; age: number; cause: string };
  plot?: { year: number; ending: string };
};

const TARGET: Record<Rank, number> = { destitute: 0.15, labouring: 0.35, middling: 0.55, gentry: 0.75, elite: 0.9 };
const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const article = (s: string) => (/^[aeiou]/i.test(s) ? "an" : "a");
const firstOf = (a: Pick<Actor, "name" | "origin">) => a.origin?.namePersonal ?? a.name.split(" ")[0];
const offspring = (sex: Sex) => (sex === "female" ? "daughter" : sex === "male" ? "son" : "child");
const spouseWord = (sex: Sex) => (sex === "female" ? "wife" : sex === "male" ? "husband" : "partner");
const theirs = (sex: Sex) => (sex === "female" ? "her" : sex === "male" ? "his" : "their");
const GOOD_END = /^(paid|repaid|cleared|settled|saved|recovered|mended|found|passed|kept|thanked|married|trusted|vouched|excused|upheld|helped|terms|truce|welcome|friends?|forgiven|grateful|glad|proud|honoured|rescued|spared|remitted|refunded|compensated|exempted|surety|respite|worked|returned|rebuilt|reaped|good|pleased|safe|yours|owned|eased|softened|thanks|kind|delivered|supplied|shared|bought|full)$/;
const BAD_END = /^(seized|judged|lost|caught|shamed|condemned|fled|absent|missed|late|taken|hurt|raided|stripped|scorned|exposed|driven|blamed|faulted|broke|broken|short|empty|spoiled|cut|denied|refused|offended|rebuffed|let-down|dismissed|docked|halved|unsolved|owed|alone|ran|gone|swamped|soaked|sour|tired|weak|ignored|outdone|outsworn|outgave|kill)$/;

const YEARS: Record<Ways["living"], { good: string[]; bad: string[]; robbed: string }> = {
  market: {
    good: [
      "A good year. Work was steady and money came in.",
      "A good year. There was money put by at the end of it.",
      "Work came in all year, and every debt was paid on time.",
    ],
    bad: [
      "A hard year. Work was scarce and food cost more than it should.",
      "A bad year. Customers were few, and the household cut back on everything.",
      "Prices rose all year. The household sold what it could spare to get by.",
    ],
    robbed: "Thieves broke in and took what they could carry.",
  },
  farm: {
    good: [
      "A good harvest. There was food to spare.",
      "The weather held, and the store was full after the harvest.",
      "A fat year. The animals did well and the harvest was heavy.",
    ],
    bad: [
      "The harvest failed, and the household went hungry before the next one.",
      "Blight took much of the crop. The household ate seed it should have kept.",
      "A dry year. What came in barely lasted until the next harvest.",
    ],
    robbed: "Thieves broke into the store and took what they could carry.",
  },
  herd: {
    good: [
      "A good year for the herd. Many young were born and few were lost.",
      "The grass was good all year, and the animals came through fat.",
    ],
    bad: [
      "Sickness went through the herd, and many animals died.",
      "The grass failed, and many animals starved before it came back.",
      "Hard weather killed many of the animals.",
    ],
    robbed: "Raiders drove off part of the herd.",
  },
  forage: {
    good: [
      "A good year. Game and fish were plentiful, and the stores were full.",
      "Everything ripened at once, and there was more food than the household could eat.",
    ],
    bad: [
      "A lean year. Game was scarce, and the household went hungry.",
      "The fish ran thin, and the stores were empty long before the season turned.",
    ],
    robbed: "Someone raided the household's stores while everyone was away.",
  },
};

/** What the household is and who belongs to it, read from the world. */
function cast(engine: Engine) {
  const s = engine.state, seed = s.manifest.seed, setting = engine.world.pack.setting!;
  const from = setting.year, p = s.player;
  const h = s.households?.find((x) => x.members.includes(p.id));
  const people: Record<string, Person> = {};
  const relation = new Map((p.relations ?? []).map((r) => [r.other, r.kind]));
  const add = (a: Actor, kind: Kind, away = false) => {
    people[a.id] = { id: a.id, name: a.name, first: firstOf(a), sex: sexOf(a), born: from - (a.age ?? 30), kind, role: a.role, away };
  };
  const byId = new Map(s.actors.map((a) => [a.id, a]));
  for (const id of h?.members ?? []) {
    const a = byId.get(id);
    if (!a || a.kind !== "human" || a.dead || id === p.id) continue;
    const r = relation.get(id);
    add(a, r === "partner" || r === "child" || r === "parent" || r === "servant" || r === "apprentice" ? r : "household");
  }
  for (const k of kinOf(s)) if (!people[k.actor.id]) add(k.actor, k.kind, true);
  // Babies counted, not drawn: given a name now, so the years can speak of them.
  const partner = Object.values(people).find((x) => x.kind === "partner");
  for (let i = 0; i < (h?.infants ?? 0); i++) {
    const id = `${h!.id}-infant-${i}`, sex: Sex = random(seed, id, "sex") < 0.5 ? "female" : "male";
    const born = from - Math.floor(random(seed, id, "age") * 4);
    const make = child(engine, id, born, sex, p, partner && byId.get(partner.id)), drawn = make(from - born);
    people[id] = { id, name: drawn.name, first: firstOf(drawn), sex, born, kind: "child", role: "Child", with: partner?.id, drawn, make };
  }
  return { h, people, rank: standingOf(seed, p)?.rank ?? "labouring" };
}

/** A newborn drawn with the family's name and looks; drawn again older, the
 * name and face kept, the work and clothes their age's. */
function child(engine: Engine, id: string, born: number, sex: Sex, a?: Partial<Actor>, b?: Partial<Actor>, avoid?: ReadonlySet<string>) {
  const seed = engine.state.manifest.seed;
  const father = [a, b].find((x) => x?.origin?.sex === "male" || x?.appearance?.physique?.sex === "male") ?? a;
  const mother = father === a ? b : a;
  const format = father?.origin?.nameFormat;
  const families = format === "family-personal" || format === "personal-family"
    ? father?.origin?.nameFamilies
    : format === "personal-two-families" && father?.origin?.nameFamilies?.[0] && mother?.origin?.nameFamilies?.[0]
      ? [father.origin.nameFamilies[0], mother.origin.nameFamilies[0]]
      : undefined;
  const looks = [a?.appearance, b?.appearance].filter((x): x is NonNullable<typeof x> => !!x);
  let first: Drawn | undefined;
  return (age: number): Drawn => {
    const drawn = generateCharacter({ ...engine.world.pack.setting!, year: born + age }, seed, id, age, age < 14 ? "Child" : undefined, first?.name, families,
      sex, father?.origin?.nameTradition, { community: father?.origin?.community, parentPersonal: father?.origin?.namePersonal, avoid });
    if (drawn.appearance && looks.length) drawn.appearance = inheritLikeness(drawn.appearance, looks, seed, id);
    if (first) drawn.origin = { ...drawn.origin, nameFormat: first.origin.nameFormat, nameFamilies: first.origin.nameFamilies, namePersonal: first.origin.namePersonal };
    first ??= drawn;
    return drawn;
  };
}

/**
 * The player's life run forward a year at a time from today, to their death:
 * deaths, births, marriages, children leaving, good and bad years, the news,
 * the body ageing, and how the plot came out. Seeded by the world and the
 * year, so the same life passes the same way however often it is watched.
 */
export function liveYears(engine: Engine): Life {
  const s = engine.state, seed = s.manifest.seed, setting = engine.world.pack.setting!;
  const p = s.player, from = setting.year, born = from - (p.age ?? 30);
  const { h, people, rank } = cast(engine);
  const byId = new Map(s.actors.map((a) => [a.id, a]));
  const life: Life = { from, born, years: [], people };
  const pSex = sexOf(p);
  const fabric = 0.004;
  let fortune = h?.fortune ?? TARGET[rank];
  const lastBirth = new Map<string, number>();
  let widowed: number | undefined;
  const told = new Set<string>();
  const role = p.role.toLowerCase();
  const community = p.origin?.community ?? "*";
  const conditionsThen = new Set(conditionsOf(seed, p, setting).map((c) => c.id));
  const aging = [
    { id: "grey", at: 40 + Math.floor(random(seed, "years", "grey") * 16), text: "Your hair has gone grey." },
    { id: "teeth", at: 44 + Math.floor(random(seed, "years", "teeth") * 14), text: "You have lost several teeth, and chew on one side.", before: 1900 },
    { id: "sight", at: 44 + Math.floor(random(seed, "years", "sight") * 6), text: "You need more light than you used to for close work." },
    { id: "slow", at: 56 + Math.floor(random(seed, "years", "slow") * 8), text: "You can't work the hours you once could. The young ones take the heavy work." },
  ];

  const alive = (x: Person, y: number) => x.died === undefined || x.died > y;
  const athome = (x: Person, y: number) => !x.away && alive(x, y) && (x.left === undefined || x.left > y) && x.born <= y;
  const ageOf = (x: Person, y: number) => y - x.born;
  const actorOf = (x: Person): Partial<Actor> | undefined => byId.get(x.id) ?? x.drawn;
  const title = (x: Person) => {
    if (x.kind === "partner") return `your ${spouseWord(x.sex)} ${x.first}`;
    if (x.kind === "child") return `your ${offspring(x.sex)} ${x.first}`;
    if (x.kind === "parent") return `your ${x.sex === "female" ? "mother" : x.sex === "male" ? "father" : "parent"} ${x.first}`;
    if (x.kind === "sibling") return `your ${x.sex === "female" ? "sister" : x.sex === "male" ? "brother" : "sibling"} ${x.first}`;
    if (x.kind === "grandchild") return `your grand${offspring(x.sex)} ${x.first}`;
    if (x.kind === "in-law") return `your ${offspring(people[x.of!]?.sex)}'s ${spouseWord(x.sex)} ${x.first}`;
    if (x.kind === "apprentice") return `your apprentice ${x.first}`;
    if (x.kind === "servant") return `your servant ${x.first}`;
    return `${x.name}, who lived with you`;
  };
  const as = (x: Person) => (x.kind === "household" ? undefined
    : x.kind === "in-law" ? `${offspring(people[x.of!]?.sex)}'s ${spouseWord(x.sex)}`
    : x.kind === "grandchild" ? `grand${offspring(x.sex)}`
    : kinWord(x.kind, { name: x.name, origin: { sex: x.sex } } as Actor));
  const settingIn = (year: number): WorldSetting => ({ ...setting, year });
  const deathPerson = (age: number, sex: Sex, who: string, year: number) => ({ age, sex, role: who.toLowerCase(), setting: settingIn(year) });

  for (let year = from + 1; year <= from + 120; year++) {
    const age = year - born;
    const lines: YearLine[] = [], events: HouseholdEvent[] = [];
    const r = (...k: (string | number)[]) => random(seed, "years", year, ...k);
    const event = (kind: HouseholdEvent["kind"], x?: Person) => events.push({ year, kind, ...(x ? { name: x.name, ...(as(x) ? { as: as(x) } : {}) } : {}) });
    let bad = false;
    const ways = householdWays(settingIn(year), p.role);
    const living = YEARS[ways.living];

    // The plot comes out one way or another within the year.
    const plot = s.plot;
    if (plot && !plot.ended && year === from + 1 && plotTemplate(plot)) {
      const endings = [...new Set(plotTemplate(plot)!.endings.map((e) => e.id))].filter((id) => plotLine(plot, id));
      const weigh = (id: string) => (GOOD_END.test(id) ? fortune + 0.3 : BAD_END.test(id) ? 1.3 - fortune : 0.5);
      let draw = r("plot") * endings.reduce((n, id) => n + weigh(id), 0);
      const ending = endings.find((id) => (draw -= weigh(id)) < 0) ?? endings.at(-1);
      if (ending) {
        life.plot = { year, ending };
        lines.push({ text: plotLine(plot, ending), kind: "plot", label: plot.title });
        fortune += GOOD_END.test(ending) ? 0.02 : BAD_END.test(ending) ? -0.1 : 0;
      }
    }

    fortune += (TARGET[rank] - fortune) * 0.1 + (r("drift") - 0.5) * 0.06;
    const one = (list: string[], key: string) => list[Math.floor(r(key) * list.length)];
    if (r("good") < 0.07 + fortune * 0.04) {
      lines.push({ kind: "good-year", text: one(living.good, "good-text") });
      event("good-year");
      fortune += 0.08;
    } else if (r("bad") < 0.08 * (epidemic(deathPerson(age, pSex, role, year), year) > 1 ? 2 : 1)) {
      bad = true;
      lines.push({ kind: "bad-year", text: one(living.bad, "bad-text") });
      event("bad-year");
      fortune -= 0.1;
    }
    if (r("fire") < fabric) {
      lines.push({ kind: "fire", text: "A fire broke out at home. It was put out, but much was lost." });
      event("fire");
      fortune -= 0.15;
    } else if (r("robbed") < 0.008) {
      lines.push({ kind: "robbed", text: living.robbed });
      event("robbed");
      fortune -= 0.05;
    }
    fortune = clamp(fortune, 0.02, 0.98);
    const want = 1 + (0.5 - fortune) * 0.6;

    const news = TIDINGS.find((t) => t.scope.years[0] === year && matchesCharacterScope(t.scope, settingIn(year), community));
    if (news)
      lines.push({ kind: "news", text: news.text.replace(/\{here\}/g, setting.location).replace(/[{}]/g, ""), note: news.note });

    // Births, then marriages, then deaths, so a newborn meets its first year.
    const couples: [Person | "player", Person][] = [];
    const spouses = Object.values(people).filter((x) => x.kind === "partner" && athome(x, year - 1));
    for (const x of spouses) couples.push(["player", x]);
    for (const x of Object.values(people))
      if (x.kind === "in-law" && athome(x, year - 1) && people[x.of!] && athome(people[x.of!], year - 1)) couples.push([people[x.of!], x]);
    for (const [a, b] of couples) {
      const aSex = a === "player" ? pSex : a.sex;
      const mother = aSex === "female" ? a : b.sex === "female" ? b : undefined;
      if (!mother || aSex === b.sex) continue;
      const mAge = mother === "player" ? age - 1 : ageOf(mother, year - 1);
      const key = a === "player" ? b.id : a.id;
      const kids = Object.values(people).filter((x) => (a === "player" ? x.kind === "child" && (x.with === b.id || spouses.length === 1) : x.of === key) && x.born > from - 30).length;
      const recent = year - (lastBirth.get(key) ?? -99) < 2;
      const odds = year < 1900 ? (recent ? 0.1 : 0.4) : year < 1950 ? (kids >= 4 ? 0 : recent ? 0.05 : 0.2) : kids >= 3 ? 0 : recent ? 0.03 : 0.15;
      if (mAge < 18 || mAge > 42 || r("birth", key) > odds * (mAge > 38 ? 0.5 : 1)) continue;
      lastBirth.set(key, year);
      const id = `${h?.id ?? "player"}-born-${year}-${key}`;
      const sex: Sex = r("sex", key) < 0.5 ? "female" : "male";
      const parents = [a === "player" ? p : actorOf(a), actorOf(b)];
      const taken = new Set([p.name, firstOf(p), ...Object.values(people).filter((x) => alive(x, year)).flatMap((x) => [x.name, x.first])]);
      const make = child(engine, id, year, sex, parents[0], parents[1], taken), drawn = make(0);
      const baby: Person = { id, name: drawn.name, first: firstOf(drawn), sex, born: year, kind: a === "player" ? "child" : "grandchild", role: "Child",
        drawn, make, ...(a === "player" ? { with: b.id } : { of: a.id, with: b.id }) };
      people[id] = baby;
      event("born", baby);
      lines.push({
        kind: "born", who: id,
        text: a === "player"
          ? pSex === "female" ? `You had a ${offspring(sex)}, ${baby.first}.` : `${b.first} had a ${offspring(sex)}, ${baby.first}.`
          : `Your ${offspring(a.sex)} ${a.first} and ${b.first} had a ${offspring(sex)}, ${baby.first}.`,
      });
      if (r("childbed", key) < childbedRisk(year, setting)) {
        const cause = "in childbirth";
        if (mother === "player") {
          life.died = { year, age, cause };
        } else {
          mother.died = year;
          mother.cause = cause;
          event("died", mother);
          lines.push({ kind: "died", who: mother.id, text: `${cap(title(mother))} died ${cause}.` });
        }
      }
    }

    const children = Object.values(people).filter((x) => x.kind === "child" && athome(x, year - 1)).sort((x, y) => x.born - y.born);
    const staying = children.filter((x) => x.sex === (ways.stays === "son" ? "male" : "female"));
    const heir = ways.stays === "none" ? undefined : (ways.heir === "youngest" ? staying.at(-1) : staying[0]) ?? children[0];
    const named = new Set([p.name, firstOf(p), ...Object.values(people).flatMap((x) => [x.name, x.first])]);
    for (const x of children) {
      const n = ageOf(x, year);
      const [lo, hi] = ways.marries[x.sex ?? "male"];
      if (!x.wed && n >= lo && n <= hi && r("wed", x.id) < 0.15) {
        x.wed = year;
        const id = `${x.id}-spouse`, sex: Sex = x.sex === "female" ? "male" : "female";
        const m = Math.max(16, n + Math.round((r("gap", x.id) - (sex === "female" ? 0.7 : 0.2)) * 8));
        const drawn = generateCharacter(settingIn(year), seed, id, m, undefined, undefined, undefined, sex, undefined, { avoid: named });
        const work = drawn.role && drawn.role !== "Child" ? `, ${article(drawn.role)} ${drawn.role.toLowerCase()}` : "";
        if (x === heir) {
          people[id] = { id, name: drawn.name, first: firstOf(drawn), sex, born: year - m, kind: "in-law", role: drawn.role, of: x.id, drawn,
            make: (age) => generateCharacter(settingIn(year), seed, id, age, undefined, drawn.name, undefined, sex) };
          event("wed", x);
          lines.push({ kind: "wed", who: x.id, text: `${cap(title(x))} married ${drawn.name}${work}, who came to live with you.` });
        } else {
          x.left = year;
          event("wed", x);
          const away = ways.stays === "none" || staying.includes(x) ? "and they set up a home of their own" : `and went to live with ${theirs(sex)} family`;
          lines.push({ kind: "wed", who: x.id, text: `${cap(title(x))} married ${drawn.name}${work}, ${away}.` });
        }
      } else if (ways.leaves && x !== heir && !x.wed && n >= 13 && n <= 20 && r("leave", x.id) < 0.05) {
        x.left = year;
        event("left", x);
        lines.push({ kind: "left", who: x.id, text: `${cap(title(x))} left home ${ways.leaves(x.sex)}.` });
      }
    }
    for (const x of Object.values(people)) {
      if (!athome(x, year - 1)) continue;
      const n = ageOf(x, year);
      const go = x.kind === "apprentice" ? (n >= 21 || year - from >= 7 ? 0.5 : 0) : x.kind === "servant" ? 0.12 : x.kind === "household" ? 0.15 : 0;
      if (!go || r("go", x.id) >= go) continue;
      x.left = year;
      event("left", x);
      if (x.kind !== "household") lines.push({
        kind: "left", who: x.id,
        text: x.kind === "apprentice" ? `${cap(title(x))} finished the apprenticeship and set up on ${theirs(x.sex)} own.` : `${cap(title(x))} left your service.`,
      });
    }
    const married = Object.values(people).some((x) => x.kind === "partner");
    const [lo, hi] = ways.marries[pSex ?? "male"];
    const window = !married ? [lo, hi + 6] : [0, pSex === "female" ? 42 : 55];
    const odds = !married ? (year < 1900 ? 0.2 : 0.15) : year >= 1900 ? 0.1 : pSex === "female" ? 0.12 : 0.25;
    const another = pSex === "male" && spouses.length > 0 && spouses.length < ways.wives && fortune >= 0.55 && age >= 28 && age <= 55;
    if (((!spouses.length && (widowed === undefined || year - widowed >= 1) && age >= window[0] && age <= window[1]) || another) &&
      r("wed", "player") < (another ? 0.05 : odds)) {
      const id = `player-partner-${year}`, sex: Sex = pSex === "female" ? "male" : "female";
      const n = pSex === "female" ? age + Math.floor(r("wed-age") * 8) : Math.max(lo, age - 2 - Math.floor(r("wed-age") * (married ? 12 : 6)));
      const drawn = generateCharacter(settingIn(year), seed, id, n, undefined, undefined, undefined, sex, undefined, { avoid: named });
      const work = drawn.role && drawn.role !== "Child" && sex === "male" ? `, ${article(drawn.role)} ${drawn.role.toLowerCase()}` : "";
      people[id] = { id, name: drawn.name, first: firstOf(drawn), sex, born: year - n, kind: "partner", role: drawn.role, drawn,
        make: (age) => generateCharacter(settingIn(year), seed, id, age, undefined, drawn.name, undefined, sex) };
      event("wed", people[id]);
      const joins = ways.stays === (pSex === "female" ? "daughter" : "son") ? ", who came to live with you" : "";
      lines.push({
        kind: "wed", who: id,
        text: another ? `You took another wife, ${drawn.name}.` : married ? `You married again, to ${drawn.name}${work}.` : `You married ${drawn.name}${work}${joins}.`,
      });
      widowed = undefined;
    }

    for (const x of Object.values(people)) {
      if (!alive(x, year - 1) || x.born > year || (x.left !== undefined && x.left <= year && !x.away) || x.died !== undefined) continue;
      const n = ageOf(x, year);
      const who = deathPerson(n, x.sex, x.role, year);
      const risk = yearlyRisk(n, year, rank, epidemic(who, year) * (x.away ? 1 : want) * (bad ? 1.2 : 1), setting);
      if (r("die", x.id) >= risk) continue;
      x.died = year;
      x.cause = causeOfDeath(who, year, r("cause", x.id));
      event("died", x);
      const when = x.kind === "child" || x.kind === "grandchild" || x.kind === "parent" ? (n < 1 ? "" : `, aged ${inWords(n)}`) : "";
      const baby = n < 1 && (x.kind === "child" || x.kind === "grandchild") ? `${title(x)}`.replace(/^your /, "your baby ") : title(x);
      lines.push({ kind: "died", who: x.id, text: `${cap(baby)} died ${x.cause}${when}.` });
      if (x.kind === "partner") widowed = year;
    }

    if (!life.died) {
      const now = { ...p, age };
      const conditions = conditionsOf(seed, now, settingIn(year));
      for (const c of conditions) {
        if (conditionsThen.has(c.id)) continue;
        conditionsThen.add(c.id);
        const line = c.you(healthPerson(now, settingIn(year)))[0];
        // Lines about a childhood or a lifelong mark would be false news at fifty.
        if (line && !/since you were|since a .* youth|since a fall|born with|as a child|never been|ever since|have never|years ago|as many people|as most who/.test(line)) lines.push({ kind: "body", text: `${cap(line.replace("{name}", c.names.at(-1)!.name))}.` });
      }
      for (const a of aging)
        if (a.at === age && !told.has(a.id) && (!a.before || year < a.before)) {
          told.add(a.id);
          lines.push({ kind: "body", text: a.text });
        }
      const who = deathPerson(age, pSex, role, year);
      const ill = conditions.some((c) => c.id === "consumption");
      const ailing = year === from + 1 ? (s.ailments ?? []).filter((a) => a.who === p.id && a.course === "die") : [];
      const risk = Math.min(0.95, yearlyRisk(age, year, rank, epidemic(who, year) * want * (bad ? 1.2 : 1) * (ill ? 2.5 : 1), setting) + ailing.length * 0.15);
      if (age >= 105 || r("die", "player") < risk)
        life.died = {
          year, age,
          cause: causeOfDeath(who, year, r("cause", "player"), ill ? { text: "of consumption (tuberculosis)", weight: 3 } : undefined),
        };
    }
    if (life.died?.year === year) {
      events.push({ year, kind: "died", name: p.name });
      lines.push({ kind: "death", text: `You died ${life.died.cause}, aged ${inWords(age)}.` });
    }

    life.years.push({
      year, age, lines, events, fortune,
      home: [...(life.died ? [] : ["player"]), ...Object.values(people).filter((x) => athome(x, year)).sort((x, y) => x.born - y.born).map((x) => x.id)],
    });
    if (life.died) break;
  }
  return life;
}

/** A free cell beside `at`, outdoors, away from anyone standing there. */
function besideHome(engine: Engine, at: Position, taken: Actor[]) {
  for (let r = 1; r < 8; r++)
    for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r], [r, r], [-r, -r]]) {
      const x = at.x + dx, y = at.y + dy;
      if (!engine.world.blocked(x, y, "outside") && !taken.some((a) => a.pos.space === "outside" && a.pos.x === x && a.pos.y === y))
        return { x, y, space: "outside" };
    }
  return { ...at, space: "outside" };
}

/**
 * The world `year`, as the life left it: the same house and town, the player
 * older, the household as the years made it, the town's other people aged,
 * some gone and their houses taken by others. The morning is the same morning
 * of the year; the day's work starts fresh.
 */
export function liveOn(engine: Engine, life: Life, year: number): Engine {
  const s: Snapshot = engine.snapshot();
  const seed = s.manifest.seed, base = engine.world.pack.setting!;
  const setting: WorldSetting = { ...base, year };
  const date = (d: string) => d.replace(formatHistoricalYear(life.from), formatHistoricalYear(year));
  const later = new Map<Pack, Pack>();
  const moved = (pack: Pack) => {
    if (!later.has(pack)) later.set(pack, { ...pack, year, date: date(pack.date), ...(pack.setting ? { setting: { ...pack.setting, year } } : {}) });
    return later.get(pack)!;
  };
  const geography = engine.world.geography;
  const world: WorldModel = {
    ...engine.world,
    pack: { ...moved(engine.world.pack), setting },
    geography: geography && { ...geography, packAt: (x: number, y: number) => { const p = geography.packAt(x, y); return p && moved(p); } },
  };
  const span = year - life.from;
  const p = s.player;
  const h = s.households?.find((x) => x.members.includes(p.id));
  const rank = standingOf(seed, p)?.rank ?? "labouring";
  const upto = life.years.filter((y) => y.year <= year);
  const last = upto.at(-1);
  const people = life.people;
  const byId = new Map(s.actors.map((a) => [a.id, a]));
  const gone = new Set<string>();

  for (const x of Object.values(people)) {
    const a = byId.get(x.id);
    const dead = x.died !== undefined && x.died <= year;
    const left = x.left !== undefined && x.left <= year && !x.away;
    if (dead || left) {
      if (a) gone.add(x.id);
      continue;
    }
    if (x.born > year) continue;
    const n = year - x.born;
    if (a) {
      a.age = n;
      if (a.role === "Child" && n >= 15) a.role = p.role;
      continue;
    }
    if (x.away || !h || n < 5 || !x.drawn) continue;
    const at = h.home;
    const relations: Actor["relations"] = [];
    if (x.kind === "child") relations.push({ other: p.id, kind: "parent" }, ...(x.with ? [{ other: x.with, kind: "parent" as const }] : []));
    else if (x.kind === "partner") relations.push({ other: p.id, kind: "partner" });
    else if (x.kind === "in-law") relations.push({ other: x.of!, kind: "partner" }, { other: p.id, kind: "co-resident" });
    else if (x.kind === "grandchild") relations.push({ other: x.of!, kind: "parent" }, ...(x.with ? [{ other: x.with, kind: "parent" as const }] : []), { other: p.id, kind: "co-resident" });
    const actor: Actor = {
      kind: "human",
      pos: besideHome(engine, at, s.actors), home: { ...at }, work: { ...at },
      sprite: "human-0-2", hunger: 8, fatigue: 0, activity: "At home", trust: 1,
      memories: [], direction: 2, knownResources: [], householdId: h.id,
      ...(x.make?.(n) ?? x.drawn),
      id: x.id, age: n, relations,
    };
    if (actor.role === "Child" && n >= 15) actor.role = p.role;
    s.actors.push(actor);
    byId.set(x.id, actor);
    h.members.push(x.id);
  }
  // Ties run both ways; the new people's are added from their side.
  for (const a of s.actors.filter((a) => people[a.id]?.drawn))
    for (const r of a.relations ?? []) {
      const other = r.other === p.id ? p : byId.get(r.other);
      const back = r.kind === "parent" ? "child" : r.kind === "partner" ? "partner" : "co-resident";
      if (other && !other.relations?.some((q) => q.other === a.id)) (other.relations ??= []).push({ other: a.id, kind: back });
    }

  // The rest of the town: older, and some gone, their house taken by someone new.
  const households = new Map((s.households ?? []).map((x) => [x.id, x]));
  for (const a of s.actors) {
    if (a.kind !== "human" || people[a.id] || a.id === p.id) continue;
    const age0 = a.age ?? 30, own = standingOf(seed, a)?.rank ?? rank;
    let died: number | undefined;
    for (let y = life.from + 1; y <= year && died === undefined; y++) {
      const n = age0 + (y - life.from);
      const who = { age: n, sex: sexOf(a), role: a.role.toLowerCase(), setting: { ...base, year: y } };
      if (random(seed, "years-town", a.id, y) < yearlyRisk(n, y, own, epidemic(who, y), base)) died = y;
    }
    const hh = a.householdId ? households.get(a.householdId) : undefined;
    if (died === undefined) {
      a.age = age0 + span;
      if (a.role === "Child" && a.age >= 15) {
        const head = hh?.members.map((id) => byId.get(id)).filter((b) => b && b.role !== "Child").sort((x, y) => (y!.age ?? 0) - (x!.age ?? 0))[0];
        a.role = head?.role ?? "Labourer";
      }
      continue;
    }
    if (hh) (hh.history ??= []).push({ year: died, kind: "died", name: a.name });
    if (random(seed, "years-town", a.id, "newcomer") < 0.7) {
      const n = 18 + Math.floor(random(seed, "years-town", a.id, "newcomer-age") * 22) + Math.min(span, year - died);
      Object.assign(a, generateCharacter({ ...base, year: died }, seed, `${a.id}@${died}`, n), { age: n, relations: [], memories: [] });
      if (hh) hh.history!.push({ year: died + 1, kind: "joined", name: a.name });
      for (const b of s.actors) if (b.relations) b.relations = b.relations.filter((r) => r.other !== a.id);
      if (p.relations) p.relations = p.relations.filter((r) => r.other !== a.id);
    } else gone.add(a.id);
  }

  s.actors = s.actors.filter((a) => !gone.has(a.id));
  for (const x of s.households ?? []) x.members = x.members.filter((id) => !gone.has(id));
  const here = new Set(s.actors.map((a) => a.id));
  for (const a of [p, ...s.actors]) if (a.relations) a.relations = a.relations.filter((r) => r.other === p.id || here.has(r.other));
  s.bonds = s.bonds?.filter((b) => here.has(b.with));

  if (h) {
    h.history = [...(h.history ?? []), ...upto.flatMap((y) => y.events)];
    const before = h.fortune ?? 0.5;
    h.fortune = last?.fortune ?? before;
    h.infants = Object.values(people).filter((x) => !x.away && x.born <= year && year - x.born < 5 && !byId.has(x.id) &&
      (x.died === undefined || x.died > year) && (x.left === undefined || x.left > year)).length;
    if (p.inventory.coin) p.inventory.coin = Math.max(0, Math.round(p.inventory.coin * clamp(h.fortune / Math.max(0.05, before), 0.2, 3)));
  }

  p.age = (p.age ?? 30) + span;
  p.stats = rollStats(seed, p);
  Object.assign(p, { health: 100, hunger: 10, fatigue: 0, activity: "Exploring" });
  delete p.injury;
  delete p.dead;
  if (s.manifest.setting) s.manifest.setting.year = year;
  if (s.plot && !s.plot.ended && life.plot) {
    s.plot.ended = life.plot.ending;
    s.lifeAim = s.plot.aim;
  }
  for (const key of ["workday", "today", "evening", "care", "kin", "encounter", "relationships"] as const) delete s[key];
  if (s.economy) delete s.economy.work;
  s.ailments = [];
  s.introduced = false;
  if (s.lifeAim?.subjects?.some((id) => id !== p.id && !here.has(id))) s.lifeAim = undefined;
  if (!life.died || life.died.year > year) {
    if (!s.plot || s.plot.ended) {
      const aim = s.lifeAim;
      s.plot = undefined;
      const plot = startPlot(s, setting, undefined, year);
      if (plot) plot.aim = aim;
    }
    ensureLifeAim(s, setting);
  }
  return new Engine(world, engine.items, s);
}

/** The world at the year of the player's death, the player dead in it. */
export function endOfLife(engine: Engine, life: Life): Engine {
  const died = life.died!;
  const next = liveOn(engine, life, died.year);
  const p = next.state.player;
  p.dead = died.cause;
  p.health = 0;
  p.activity = "Dead";
  return next;
}
