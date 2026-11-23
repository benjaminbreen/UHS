import { sexOf, type BriefSpan, type PersonBrief, type Sex } from "./brief";
import { random } from "./random";
import { conditionBand, conditionWord } from "./time/structure";
import { goodName } from "../content/economy/products";
import { buildingPhrase } from "../content/settlements/about-buildings";
import type { Actor, Household, Place, SocialRelation } from "./types";

/** What a resident is to the householder, as a word. */
function kin(kind: SocialRelation["kind"] | undefined, sex: Sex) {
  const by = (f: string, m: string, n: string) =>
    sex === "female" ? f : sex === "male" ? m : n;
  if (kind === "partner") return by("wife", "husband", "partner");
  if (kind === "child") return by("daughter", "son", "child");
  if (kind === "parent") return by("mother", "father", "parent");
  if (kind === "servant" || kind === "apprentice") return kind;
  if (kind === "parent-in-law") return `${by("mother", "father", "parent")}-in-law`;
  if (kind === "child-in-law") return `${by("daughter", "son", "child")}-in-law`;
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
const objectOf = (sex: Sex) =>
  sex === "female" ? "her" : sex === "male" ? "him" : "them";
const pronounOf = (sex: Sex) =>
  sex === "female" ? "She" : sex === "male" ? "He" : "They";
const list = (parts: string[]) =>
  parts.length < 2
    ? (parts[0] ?? "")
    : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
const NUMBER = ["no", "a", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const number = (n: number) => (n === 1 ? "one" : (NUMBER[n] ?? String(n)));
const count = (n: number, one: string, many: string) =>
  `${NUMBER[n] ?? n} ${n === 1 ? one : many}`;
const article = (word: string) => (/^[aeiou]/i.test(word) ? "an" : "a");
const TRADE: [number, string][] = [
  [0.8, "brisk"],
  [0.62, "good"],
  [0.44, "steady"],
  [0.26, "slow"],
];
// Roles are title-cased for headings: "Rice Farmer" reads "rice farmer" mid-sentence.
const lowerRole = (s: string) => s.replace(/\b[A-Z](?=[a-z])/g, (c) => c.toLowerCase());
const upper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** Relative, so it reads the same in 244 BCE as in 1400. */
const ago = (years: number) =>
  years < 1
    ? "this year"
    : years < 2
      ? "last year"
      : years < 12
        ? `${years} years ago`
        : years < 45 || (years >= 65 && years < 90)
          ? `about ${Math.round(years / 10) * 10} years ago`
          : years < 65
            ? "about half a century ago"
            : years < 150
              ? "about a century ago"
              : `about ${number(Math.round(years / 100))} centuries ago`;
/** A neighbouring map's name as it reads after "from": "the slopes of Xiaoqing Shan". */
const placeName = (n: string) =>
  /^[A-Z][a-z]+ (of|north|south|east|west)\b/.test(n)
    ? `the ${n.charAt(0).toLowerCase()}${n.slice(1)}`
    : /\b(valley|plain|hills|mountains|coast|delta|marshes|forest)$/i.test(n)
      ? `the ${n}`
      : n;

/** A bad year as it is remembered, by what went wrong. */
function badYear(cause: string | undefined, when: string, sex: Sex, many: boolean) {
  const their = many ? "their" : possessive(sex);
  const they = many ? "they" : pronounOf(sex).toLowerCase();
  const Pron = pronounOf(sex);
  const was = sex ? "was" : "were";
  switch (cause) {
    case "drought": return `Drought ruined ${their} harvest ${when}.`;
    case "blight": return `Blight took most of ${their} crop ${when}.`;
    case "flood": return `Floods drowned ${their} fields ${when}.`;
    case "hail": return `Hail flattened ${their} crop ${when}.`;
    case "murrain": return `Sickness went through ${their} animals ${when}, and many died.`;
    case "pasture": return `The grazing failed ${when}, and ${they} lost many animals.`;
    case "scarcity": return `Game and fish were scarce ${when}, and ${they} went hungry.`;
    case "prices": return `Food prices soared ${when}, and ${they} sold what ${they} could spare.`;
    case "illness": return `${Pron} fell ill ${when} and could not work for months.`;
    case "injury": return `${Pron} ${was} badly hurt ${when} and could not work for months.`;
    case "slack": return `Work dried up ${when}, and ${they} had to cut back.`;
  }
  return `${upper(many ? "the household" : they)} had a hard year ${when}.`;
}
/** Animals a household keeps, by species, as the card counts them. */
export type KeptAnimals = { species: string; n: number };
const ANIMAL: Record<string, [string, string]> = {
  chicken: ["hen", "hens"],
  sheep: ["sheep", "sheep"],
  goose: ["goose", "geese"],
  cattle: ["cow", "head of cattle"],
  "water-buffalo": ["water buffalo", "water buffalo"],
  yak: ["yak", "yaks"],
};
const PETS = new Set(["dog", "cat"]);
function animal({ species, n }: KeptAnimals) {
  const plain = species.replace(/-/g, " ");
  const [one, many] = ANIMAL[species] ?? [plain, `${plain}s`];
  return n === 1 ? `${article(one)} ${one}` : `${NUMBER[n] ?? n} ${many}`;
}

/**
 * The focus card for a building: who holds it, what it is, and how it has
 * fared. Every part is read off what the world already knows: the household
 * and its history, the structure's age and wear, its animals, whom it buys
 * from. Past the house and how the family came by it, the card keeps the few
 * facts that most mark this household out, so a street of cards does not all
 * say the same things in the same order.
 */
export function placeBrief(
  place: Place,
  year: number,
  holder: Actor | undefined,
  residents: Actor[],
  household?: Household,
  /** A household's householder, for naming who they buy from. */
  headOf: (householdId: string, sellerId?: string) => Actor | undefined = () => undefined,
  /** Needed goods it went short of this hour. */
  short: string[] = [],
  animals: KeptAnimals[] = [],
  /** What the street is saying about the house today (`houseTalk`). */
  talk?: string,
): PersonBrief | undefined {
  if (!holder && !place.structure) return undefined;
  const identity: BriefSpan[] = [];
  // A guildhall has a warden, not a householder. Naming whoever holds the
  // keys as its resident turned every civic building into somebody's house.
  const institution =
    place.claim?.startsWith("venue-") || place.claim?.startsWith("civic-");
  const sex = holder ? sexOf(holder) : undefined;
  const their = possessive(sex);
  const Pron = pronounOf(sex);
  const home = !!holder && !institution && household?.residence === place.id;
  const history = (home && household?.history) || [];
  const latest = (kind: string) => history.filter((e) => e.kind === kind).at(-1);
  const role = holder?.role ? lowerRole(holder.role) : undefined;
  if (home) {
    identity.push({ text: holder.name, tone: "name" });
    if (role) identity.push({ text: ", " }, { text: role, tone: "role" }, { text: "," });
    identity.push({ text: " lives here" });
    const others: string[] = [],
      lodgers: string[] = [];
    for (const a of residents) {
      if (a.id === holder.id) continue;
      const back = a.relations?.find((r) => r.other === holder.id)?.kind;
      const kind =
        holder.relations?.find((r) => r.other === a.id)?.kind ??
        (back && INVERSE[back]);
      const term = kind === "servant" && a.origin?.standing === "unfree" ? "bound servant" : kin(kind, sexOf(a));
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
  } else if (holder && !institution) {
    identity.push({ text: "Belongs to " }, { text: holder.name, tone: "name" });
    if (role) identity.push({ text: `, ${article(role)} ` }, { text: role, tone: "role" });
    identity.push({ text: "." });
  } else {
    identity.push({ text: place.description });
  }

  const moment: BriefSpan[] = [];
  const say = (text: string, tone?: BriefSpan["tone"]) =>
    moment.push(tone ? { text, tone } : { text });
  const who = home ? holder.name : "It";
  const came = history.find((e) =>
    ["built", "inherited", "moved"].includes(e.kind),
  );
  const fire = latest("fire");
  if (place.structure) {
    const age = year - place.structure.built;
    const condition = place.condition ?? 1;
    const word = age < 3 && condition >= 0.82 ? "new" : conditionWord(condition);
    const phrase = buildingPhrase(place.sprite, word);
    if (phrase) {
      const [before, after] = phrase.split(word);
      say(before), say(word, "state"), say(after);
      // A tent is remade from its felts and poles; its age is not worth telling.
      if (!/\btent$/.test(phrase)) {
        say(came?.kind === "built" ? `, which ${who} built ` : ", built "), say(ago(age), "thing");
        if (fire) say(` and rebuilt after a fire ${ago(year - fire.year)}`);
      }
      say(". ");
    } else {
      if (holder && !institution) say(`${place.description} `);
      if (came?.kind === "built") say(`${who} built it `);
      else say("Built ");
      say(ago(age), "thing");
      if (fire) say(` and rebuilt after a fire ${ago(year - fire.year)}`);
      say(came?.kind === "built" ? "; it is " : ", it is "), say(conditionBand(condition), "state"), say(". ");
    }
  } else if (holder && !institution) say(`${place.description} `);

  if (home) {
    if (came?.kind === "inherited")
      say(`It came to ${objectOf(sex)} from ${their} ${came.as} ${ago(year - came.year)}. `);
    else if (came?.kind === "moved")
      say(came.name
        ? `${Pron} came here from ${placeName(came.name)} ${ago(year - came.year)}. `
        : `${Pron} moved in ${ago(year - came.year)}. `);

    // Each fact bids for a place on the card; the few that bid highest are
    // told, in the order a neighbour would tell them.
    const facts: { weight: number; spans: BriefSpan[] }[] = [];
    const bid = (kind: string, weight: number, ...spans: BriefSpan[]) =>
      facts.push({ weight: weight + random(household!.id, "brief", kind) * 0.1, spans });
    const deaths = history.filter((e) => e.kind === "died");
    const partner = deaths.find((e) => e.as === "wife" || e.as === "husband" || e.as === "partner");
    if (partner) {
      const remarried = history.some((e) => (e.kind === "wed" || e.kind === "joined") && e.year > partner.year);
      const since = year - partner.year;
      bid("widowed", since <= 3 ? 0.8 : 0.5, { text: `${upper(their)} ${remarried ? "first " : ""}${partner.as} died ${ago(since)}. ` });
    }
    const child = (as?: string) => as === "son" || as === "daughter";
    const buried = deaths.filter((e) => child(e.as));
    const left = history.filter((e) => e.kind === "left" && child(e.as)).length;
    const total = history.filter((e) => e.kind === "born" && child(e.as)).length + buried.length;
    if (total === 1 && (buried.length || left)) {
      const only = buried[0] ?? history.find((e) => e.kind === "born" && child(e.as))!;
      bid("children", 0.5, { text: `${upper(their)} only child, a ${only.as}, ${buried.length ? "died young" : "has left home"}. ` });
    } else if (buried.length || left) {
      const all = (n: number) => (n === total ? `all ${number(n)}` : number(n));
      const parts = [
        buried.length && `${all(buried.length)} ${buried.length === 1 ? "is" : "are"} buried`,
        left && `${all(left)} ${left === 1 ? "has" : "have"} left home`,
      ].filter((p): p is string => !!p);
      bid("children", 0.45 + 0.05 * Math.min(buried.length, 4),
        { text: `${Pron} ${sex ? "has" : "have"} had ${NUMBER[total] ?? total} children. ${upper(parts.join(", and "))}. ` });
    }
    const pets = animals.filter((a) => PETS.has(a.species));
    if (residents.length <= 1 && pets.length) {
      const named = list(pets.map(animal));
      const many = pets.length > 1 || pets[0].n > 1;
      bid("animals", 0.6, { text: many ? `${upper(named)} are ${their} only company. ` : `${upper(their)} sole companion is ${named}. ` });
      const stock = animals.filter((a) => !PETS.has(a.species));
      if (stock.length) bid("stock", 0.3, { text: `${Pron} ${sex ? "keeps" : "keep"} ${list(stock.map(animal))}. ` });
    } else if (animals.length) {
      bid("animals", 0.35, { text: `${residents.length > 1 ? "The household keeps" : `${Pron} ${sex ? "keeps" : "keep"}`} ${list(animals.map(animal))}. ` });
    }

    const house = residents.length > 1 ? "the household" : pronounOf(sex).toLowerCase();
    const fortune = household?.fortune ?? 0.5;
    const hard = latest("bad-year");
    const robbed = latest("robbed");
    if (talk) bid("talk", 0.95, { text: `${talk} `, tone: "state" });
    const without = short.map((g) => goodName(g, household?.buys?.find((b) => b.good === g)?.product ?? household?.products?.[g]));
    if (without.length) bid("fortune", 0.9, { text: `${upper(house)} ${house === "they" ? "are" : "is"} going without ${list(without)}. `, tone: "state" });
    else if (robbed && year - robbed.year < 2) bid("fortune", 0.8, { text: "Someone has been stealing from them lately. ", tone: "state" });
    else if (fortune < 0.22) bid("fortune", 0.6, { text: "Times are hard. ", tone: "state" });
    else if (hard && year - hard.year < 3) bid("fortune", 0.5, { text: `${badYear(hard.as, ago(year - hard.year), sex, residents.length > 1)} ` });
    else if (fortune > 0.78) bid("fortune", 0.4, { text: `${upper(house)} ${house === "they" ? "are" : "is"} well off. `, tone: "state" });

    // A debt is worth telling; an ordinary purchase only fills an empty card.
    // Which one turns on the id, so a street of cards does not all name the same good.
    const buys = household?.buys ?? [];
    const pick = [...(household?.id ?? "")].reduce((n, c) => n + c.charCodeAt(0), 0);
    const owing = household?.credit ?? buys.find((b) => b.from === household!.owes);
    const buy = owing ?? buys[pick % (buys.length || 1)];
    const seller = buy && headOf(buy.from, buy.seller);
    if (buy && seller && (owing || !facts.length)) {
      const noun = goodName(buy.good, buy.product);
      const plural = /[^suia]s$/.test(noun);
      const their2 = residents.length > 1 ? "their" : their;
      bid("supplier", 0.55,
        { text: `${upper(their2)} ${noun} ${plural ? "come" : "comes"} from ` },
        { text: seller.name, tone: "name" },
        { text: owing ? `, still owing for ${plural ? "them" : "it"}. ` : ". " });
    }
    const told = new Set([...facts].sort((a, b) => b.weight - a.weight).slice(0, 3));
    for (const f of facts) if (told.has(f)) moment.push(...f.spans);
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
