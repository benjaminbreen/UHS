import { AILMENTS, type Season } from "../health/ailments";
import type { HealthPerson } from "../health/conditions";
import type { WorldSetting } from "../geography/types";
import { matchesCharacterScope } from "../characters/resolve";

/**
 * What people died of, for the years. Infections come from the ailments the
 * played day already models, weighted by how often each strikes and kills
 * here and now; the rest are the slow and sudden deaths a day never shows.
 * Shares are educated guesses from historical cause-of-death series (London
 * bills of mortality, the Registrar General from 1837, WHO tables), not data.
 * Every `text` follows "died ".
 */
export type DeathPerson = HealthPerson & { sex?: "male" | "female" };
type Box = readonly [number, number, number, number];
type Cause = { text: string; weight: (p: DeathPerson, year: number) => number };

const WEST_EURASIA: Box = [-12, 25, 50, 62];
const EUROPE: Box = [-12, 35, 45, 62];
const NORTH_AMERICA: Box = [-130, 24, -52, 60];
const AMERICAS: Box = [-170, -56, -34, 72];
const inBox = (s: WorldSetting | undefined, ...boxes: Box[]) =>
  !!s && boxes.some((b) => s.lon >= b[0] && s.lat >= b[1] && s.lon <= b[2] && s.lat <= b[3]);
const urban = (s?: WorldSetting) => s?.settlement === "city" || s?.settlement === "port";
const adult = (p: DeathPerson) => p.age >= 16 && p.age < 62;
const works = (p: DeathPerson, re: RegExp) => adult(p) && re.test(p.role);

/** Share of deaths from infection, by age, falling with sanitation (from the
 * 1870s) and antibiotics (from the 1940s). */
export function infectiousShare(age: number, year: number) {
  const band = age < 15 ? 0 : age < 50 ? 1 : age < 70 ? 2 : 3;
  return (year < 1880 ? [0.85, 0.6, 0.35, 0.15] : year < 1945 ? [0.7, 0.4, 0.2, 0.1] : [0.3, 0.15, 0.1, 0.05])[band];
}

const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];
/** An ailment's yearly toll on someone like this, relative to the others. */
function toll(id: string, p: DeathPerson) {
  const def = AILMENTS.find((a) => a.id === id)!;
  return SEASONS.reduce((n, season) => n + def.rate({ ...p, season }) * def.deadly(p), 0) / 4;
}
function ailmentText(id: string, setting?: WorldSetting) {
  const def = AILMENTS.find((a) => a.id === id)!;
  const name = (setting && def.names.find((n) => n.scope && matchesCharacterScope(n.scope, setting)))?.name ?? def.names.at(-1)!.name;
  return def.died.replace("{name}", name);
}

const INFECTIONS: { id: string; text?: string; weight?: Cause["weight"] }[] = [
  { id: "fever" },
  { id: "flux" },
  { id: "cough" },
  { id: "smallpox" },
  { id: "measles" },
  { id: "plague" },
  {
    id: "consumption",
    text: "of consumption (tuberculosis)",
    weight: (p, y) => (y >= 1600 && y < 1950 && p.age >= 15 && p.age < 60 ? 0.0012 * (urban(p.setting) ? 2 : 1) : 0),
  },
  {
    id: "cholera",
    text: "of cholera",
    // The pandemics that reached Europe and North America, 1831 to 1866.
    weight: (p, y) => ([1832, 1849, 1854, 1866].includes(y) && inBox(p.setting, EUROPE, NORTH_AMERICA) ? 0.004 * (urban(p.setting) ? 3 : 1) : 0),
  },
  {
    id: "influenza",
    text: "of the influenza",
    weight: (_p, y) => (y === 1918 || y === 1919 ? 0.01 : y >= 1890 ? 0.0004 : 0),
  },
  { id: "pneumonia", text: "of pneumonia", weight: (p, y) => (y >= 1880 && (p.age < 5 || p.age >= 60) ? 0.0015 : 0) },
  { id: "infant", text: "in the first weeks of life", weight: (p) => (p.age === 0 ? 0.02 : 0) },
];

const OTHER: Cause[] = [
  { text: "of old age", weight: (p) => Math.max(0, p.age - 64) * 0.4 },
  { text: "of a stroke", weight: (p) => (p.age >= 45 ? 1 + (p.age - 45) * 0.06 : 0) },
  { text: "of a weak heart", weight: (p, y) => (p.age >= 45 ? (y >= 1900 ? 2.2 : 1) : 0) },
  { text: "of a growth nobody could treat", weight: (p, y) => (p.age >= 40 && y < 1900 ? 0.7 : 0) },
  { text: "of cancer", weight: (p, y) => (p.age >= 40 && y >= 1900 ? 1.6 : 0) },
  { text: "of a wasting sickness", weight: (p) => (p.age >= 16 ? 0.8 : 0) },
  { text: "of a sudden pain in the belly", weight: (p) => (p.age >= 5 ? 0.4 : 0) },
  { text: "of a sickness of the kidneys", weight: (p) => (p.age >= 30 ? 0.3 : 0) },
  { text: "in an accident", weight: (p) => (adult(p) ? 0.3 : p.age >= 3 ? 0.15 : 0) },
  { text: "in a fall", weight: (p) => (p.age >= 70 ? 0.6 : p.age >= 2 && p.age < 12 ? 0.2 : 0) },
  { text: "in a fight", weight: (p) => (adult(p) && p.sex === "male" ? 0.25 : 0) },
  { text: "by drowning", weight: (p) => (works(p, /fish|sail|boat|ferry|whal|wharf|dock|pearl/i) ? 3 : p.age >= 2 && p.age < 12 ? 0.3 : 0) },
  { text: "in a fall from a roof", weight: (p) => (works(p, /mason|build|roof|thatch|carpent|joiner|tiler/i) ? 2.5 : 0) },
  { text: "in a rock fall", weight: (p) => (works(p, /mine|miner|quarr|collier|pit/i) ? 3.5 : 0) },
  { text: "of burns from the forge", weight: (p) => (works(p, /smith|forge|found|smelt|glass/i) ? 1 : 0) },
  { text: "in an accident with a cart", weight: (p) => (works(p, /cart|carrier|carter|drover|groom|porter|wagon/i) ? 2 : 0) },
  { text: "in an accident at harvest", weight: (p) => (works(p, /farm|peasant|cultiv|plough|reap|labourer|rice|field/i) ? 1.2 : 0) },
  { text: "in a machine accident", weight: (p, y) => (y >= 1800 && works(p, /mill|factory|loom|spinner|machin|weaver/i) ? 1.5 : 0) },
  { text: "under a train", weight: (p, y) => (y >= 1840 && works(p, /rail|navvy|platelayer|signal/i) ? 2 : 0) },
  { text: "in battle", weight: (p) => (works(p, /soldier|warrior|guard|legion|knight|samurai|mercenar/i) ? 4 : 0) },
  {
    text: "in the war",
    weight: (p, y) => (p.sex === "male" && p.age >= 18 && p.age <= 45 && inBox(p.setting, EUROPE) && ((y >= 1914 && y <= 1918) || (y >= 1939 && y <= 1945)) ? 6 : 0),
  },
  { text: "in a road accident", weight: (_p, y) => (y >= 1920 ? 0.5 : 0) },
];

/** Years a disease swept through, which raise everyone's risk that year. */
export function epidemic(p: DeathPerson, year: number): number {
  if (toll("plague", p) > 0) return 3;
  if (year === 1918 || year === 1919) return 1.6;
  if ([1832, 1849, 1854, 1866].includes(year) && inBox(p.setting, EUROPE, NORTH_AMERICA) && urban(p.setting)) return 1.3;
  if (inBox(p.setting, WEST_EURASIA) && (year === 1315 || year === 1316)) return 1.4;
  // Smallpox, measles and influenza arriving with Europeans; most of the Americas lost well over half its people by 1650.
  if (inBox(p.setting, AMERICAS) && year >= 1519 && year < 1650) return 1.5;
  return 1;
}

/** How someone like this died here in `year`, drawn from `u` in [0, 1). */
export function causeOfDeath(p: DeathPerson, year: number, u: number, extra?: { text: string; weight: number }): string {
  const infectious = INFECTIONS.map((c) => ({
    text: c.text ?? ailmentText(c.id, p.setting),
    w: c.weight ? c.weight(p, year) : toll(c.id, p),
  }));
  const other = OTHER.map((c) => ({ text: c.text, w: c.weight(p, year) }));
  const total = (list: { w: number }[]) => list.reduce((n, c) => n + c.w, 0);
  const share = infectiousShare(p.age, year);
  const ti = total(infectious), to = total(other);
  const pool = [
    ...infectious.map((c) => ({ text: c.text, w: ti ? (c.w / ti) * share : 0 })),
    ...other.map((c) => ({ text: c.text, w: to ? (c.w / to) * (ti ? 1 - share : 1) : 0 })),
    ...(extra ? [{ text: extra.text, w: extra.weight }] : []),
  ].filter((c) => c.w > 0);
  let draw = u * total(pool);
  return (pool.find((c) => (draw -= c.w) < 0) ?? pool.at(-1))?.text ?? "of a fever";
}
