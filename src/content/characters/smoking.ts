import type { WorldSetting } from "../geography/types";
import type { HealthPerson } from "../health/conditions";

export type SmokeForm = "clay-pipe" | "long-pipe" | "kiseru" | "cigar" | "cigarette" | "chillum" | "snuff" | "betel";

/**
 * Tobacco left the Americas after 1550 and was everywhere within a century;
 * these are the decades it took hold. Rates before about 1900 are inferred
 * from travellers, import tallies and pipe finds, not surveys; after, from
 * surveys (British men about 80% in 1948, Americans about 55% in the 1950s).
 */
const ARRIVED: Partial<Record<string, number>> = {
  european: 1590,
  "north-african-west-asian": 1600,
  "southeast-asian": 1590,
  "west-central-african": 1600,
  "south-asian": 1605,
  "east-asian": 1610,
  "inner-eurasian": 1620,
  "east-southern-african": 1640,
  "australian-pacific": 1800,
};
/** Share of grown men and women who smoked once the habit was settled, before cigarettes. */
const SETTLED: Record<string, readonly [number, number]> = {
  european: [0.45, 0.06],
  "north-african-west-asian": [0.55, 0.1],
  "inner-eurasian": [0.4, 0.15],
  "south-asian": [0.4, 0.08],
  // Late imperial China and Edo Japan: women smoked nearly as freely as men.
  "east-asian": [0.6, 0.35],
  "southeast-asian": [0.5, 0.3],
  "west-central-african": [0.45, 0.25],
  "east-southern-african": [0.4, 0.2],
  // Before contact: ritual and medicine as much as habit, and the Andes took it as snuff.
  mesoamerican: [0.15, 0.02],
  andean: [0.05, 0.01],
  "other-indigenous-american": [0.3, 0.05],
  "australian-pacific": [0.4, 0.3],
};
const BETEL: Partial<Record<string, number>> = { "southeast-asian": 0.45, "south-asian": 0.3 };

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));

/** What this person smokes, chews or takes, if anything. Two rolls in [0, 1). */
export function smokingHabit(setting: WorldSetting | undefined, p: HealthPerson, roll: number, formRoll: number): SmokeForm | undefined {
  if (!setting || p.age < 16) return undefined;
  const y = setting.year, c = setting.culture, male = p.sex !== "female";
  const japan = c === "east-asian" && setting.lon > 129;
  // Betel was chewed by men and women alike, for two thousand years before tobacco.
  const betel = (BETEL[c] ?? 0) * (y < -500 ? 0 : y >= 1950 ? 0.4 : 1);
  if (roll < betel) return "betel";
  roll -= betel;
  const americas = c === "mesoamerican" || c === "andean" || c === "other-indigenous-american";
  const arrived = americas ? -1000 : ARRIVED[c] ?? 1600;
  const [men, women] = SETTLED[c] ?? SETTLED.european;
  let rate = (male ? men : women) * Math.max(0, Math.min(1, (y - arrived) / 40));
  // The cigarette: the West's peak in mid-century, and the long fall after.
  const west = c === "european" || (americas && y >= 1700);
  if (y >= 1890 && west) rate = y < 1960 ? lerp(rate, male ? 0.75 : 0.4, (y - 1890) / 60) : lerp(male ? 0.75 : 0.4, male ? 0.2 : 0.14, (y - 1960) / 60);
  else if (y >= 1900 && c === "east-asian") rate = male ? lerp(0.6, japan ? 0.3 : 0.5, (y - 1970) / 50) : lerp(0.35, 0.03, (y - 1900) / 60);
  else if (y >= 1900) rate = lerp(rate, male ? 0.45 : rate * 0.6, (y - 1900) / 60);
  if (/\b(sailor|seaman|mariner|soldier|docker|longshoreman|fisherman|porter)\b/i.test(p.role)) rate *= 1.3;
  if (roll >= rate) return undefined;
  const cigarettes = Math.max(0, Math.min(1, (y - 1885) / 35)) * (p.age > 55 ? 0.6 : 1);
  if (formRoll < cigarettes) return "cigarette";
  if (y >= 1700 && y < 1880 && c === "european" && /\b(merchant|gentleman|lady|lord|clerk|lawyer|physician|banker|scholar|priest)\b/i.test(p.role))
    return formRoll < 0.7 ? "snuff" : "clay-pipe";
  if (c === "european" && y >= 1830 && formRoll > 0.8) return "cigar";
  if (c === "southeast-asian" || c === "mesoamerican") return "cigar";
  if (c === "andean") return "snuff";
  return pipeFor(setting);
}

/** The pipe a place smoked its tobacco in. */
export function pipeFor(setting: WorldSetting | undefined): SmokeForm {
  const c = setting?.culture;
  if (c === "east-asian") return (setting?.lon ?? 0) > 129 ? "kiseru" : "long-pipe";
  if (c === "north-african-west-asian" || c === "inner-eurasian") return "long-pipe";
  if (c === "south-asian") return "chillum";
  return "clay-pipe";
}

/** What each carried thing is taken as; tobacco goes in the local pipe. */
const TAKEN: Record<string, SmokeForm | "pipe"> = {
  cigarettes: "cigarette", cigars: "cigar", "pipe-tobacco": "pipe", tobacco: "pipe", snuff: "snuff", betel: "betel",
};
const SUPPLY: Partial<Record<SmokeForm, string>> = { cigarette: "cigarettes", cigar: "cigars", snuff: "snuff", betel: "betel" };

/** What someone carrying these things would smoke or chew now, and from which. */
export function smokingFrom(inventory: Partial<Record<string, number>>, setting: WorldSetting | undefined) {
  const item = Object.keys(TAKEN).find((id) => (inventory[id] ?? 0) > 0);
  if (!item) return undefined;
  const form = TAKEN[item];
  return { item, form: form === "pipe" ? pipeFor(setting) : form };
}

/** The thing a habit is bought as: raw leaf before the trade in cut tobacco. */
export function supplyFor(form: SmokeForm, year: number) {
  return SUPPLY[form] ?? (year < 1600 ? "tobacco" : "pipe-tobacco");
}
