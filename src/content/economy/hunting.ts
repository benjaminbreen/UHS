import type { WorldSetting } from "../geography/types";
import type { SeasonId } from "../../core/season";
import { capabilitiesFor } from "../characters/resolve";
import { catchFate, type CatchFate } from "./fishing";

/**
 * How game was hunted, from what a place and date allowed: the weapon a
 * hunter carried, and whether they also kept a line of snares. Worked out
 * from the society's tools and its contact with others rather than per region.
 */
export type HuntWeapon = "spear" | "atlatl" | "bow" | "crossbow" | "firearm";
type Weights = Partial<Record<HuntWeapon, number>>;

export function weaponWeights(s: WorldSetting): Weights {
  const y = s.year, c = s.culture;
  const americas = c === "mesoamerican" || c === "andean" || c === "other-indigenous-american";
  // Thrusting and throwing spears from Schöningen, c. 300,000 years ago.
  const w: Weights = { spear: 1 };
  // Spear-throwers from the Solutrean and Magdalenian of France, c. 17,000 BCE.
  if (y >= -17000) w.atlatl = 3;
  // Arrow points at Sibudu, South Africa, c. 62,000 BCE; in Europe the
  // Stellmoor arrows, c. 9500 BCE. In most of North America the bow replaced
  // the atlatl around 500 CE; Mesoamerica kept the atlatl to the conquest, and
  // mainland Australia never took up the bow at all.
  const bowFrom = c === "west-central-african" || c === "east-southern-african" ? -60000
    : americas ? 500 : c === "australian-pacific" ? Infinity : -12000;
  if (y >= bowFrom) Object.assign(w, { bow: 6, atlatl: c === "mesoamerican" ? 2 : 0.3, spear: 0.5 });
  // Bronze trigger locks from Warring States China, c. 500 BCE; in Europe the
  // hunting crossbow from about 1000 CE into the seventeenth century.
  if ((c === "east-asian" && y >= -500) || (c === "european" && y >= 1000 && y < 1700)) w.crossbow = 2;
  // Guns came with European traders: Japan in 1543, the North American fur
  // trade from the 1600s, West Africa's gun trade at hundreds of thousands a
  // year by the 1700s. Matchlocks were poor hunting guns; breech-loaders after
  // 1850 drove out the bow nearly everywhere.
  const guns = y >= 1500 && (capabilitiesFor(s).has("european_contact") || (c === "west-central-african" && y >= 1650));
  if (guns) w.firearm = y < 1700 ? 1 : y < 1850 ? 4 : 30;
  return w;
}

/** What each weapon plays as. The crossbow and the gun use the bow until they have art of their own. */
export const weaponHand: Record<HuntWeapon, "spear" | "bow"> = { spear: "spear", atlatl: "spear", bow: "bow", crossbow: "bow", firearm: "bow" };

/** A hunter's weapon. `roll` is the hunter's; `hand` keeps the choice to what they actually carry. */
export function huntWeapon(s: WorldSetting, roll: number, hand?: "spear" | "bow"): HuntWeapon {
  const entries = (Object.entries(weaponWeights(s)) as [HuntWeapon, number][])
    .filter(([k, n]) => n > 0 && (!hand || weaponHand[k] === hand));
  let left = roll * entries.reduce((n, [, v]) => n + v, 0);
  for (const [k, v] of entries) if ((left -= v) < 0) return k;
  return entries.at(-1)?.[0] ?? hand ?? "spear";
}

/** Whether a hunter also keeps snares. Snares and pitfalls are older than any
 * record of them; fur trapping made them the main work in the boreal north. */
export function keepsTraps(s: WorldSetting, roll: number, label = "") {
  return /trap|fowl/i.test(label) || roll < (s.climate === "boreal" || s.climate === "tundra" ? 0.6 : 0.35);
}

export const huntWords: Record<HuntWeapon, { weapon: string; ready: string }> = {
  spear: { weapon: "the spear", ready: "Sharpen the spear and harden its point in the fire" },
  atlatl: { weapon: "the spear-thrower", ready: "Straighten the darts and check the spear-thrower" },
  bow: { weapon: "the bow", ready: "String the bow and check the arrows" },
  crossbow: { weapon: "the crossbow", ready: "Wax the crossbow string and check the bolts" },
  firearm: { weapon: "the gun", ready: "Clean the gun and measure out powder and shot" },
};

// Autumn is the hunter's season nearly everywhere: the animals are fat, the
// rut makes deer careless, and bare woods show them. Summer leaf hides them.
// Dry seasons pull game to the waterholes; the monsoon's rains scatter it.
const seasons: Record<WorldSetting["climate"], Record<SeasonId, number>> = {
  temperate: { spring: 0.85, summer: 0.8, autumn: 1.3, winter: 0.95 },
  boreal: { spring: 0.8, summer: 0.85, autumn: 1.3, winter: 1 },
  tundra: { spring: 1.1, summer: 1, autumn: 1.3, winter: 0.6 },
  mediterranean: { spring: 0.9, summer: 0.8, autumn: 1.25, winter: 1 },
  arid: { spring: 1, summer: 1.2, autumn: 1, winter: 0.85 },
  monsoon: { spring: 1.2, summer: 0.6, autumn: 0.9, winter: 1.15 },
  tropical: { spring: 1, summer: 1, autumn: 1, winter: 1 },
};

/** How good a day it is for game against an ordinary one, and why. Game moves
 * at dawn and dusk and lies up through the heat of the day. */
export function gameOf(s: WorldSetting, season: SeasonId, hour: number, roll: number) {
  const time = hour < 5 || hour >= 21 ? 0.6 : hour < 8 ? 1.3 : hour < 11 ? 1 : hour < 16 ? 0.75 : 1.2;
  const sea = seasons[s.climate][season];
  const lean = sea < 0.85 || time < 0.9;
  const why = sea < 0.85
    ? season === "summer" && s.climate === "monsoon" ? "The rains have scattered the game." : season === "winter" ? "The animals are thin and few, and keep to shelter." : "The leaves are thick and the animals stay in cover."
    : time < 0.9 ? hour < 5 || hour >= 21 ? "It is too dark to follow a track." : "Out in the heat of the day, when the animals lie up."
    : sea > 1.1 ? season === "autumn" ? "The animals are fat and moving this time of year." : "The animals are gathering at the water."
    : time > 1.1 ? "Out early, when the animals were moving." : "";
  return { factor: sea * time * (0.6 + 0.8 * roll), why, lean };
}

/** Something that could turn on a hunter here. */
export function dangerOf(s: WorldSetting) {
  if (s.culture === "australian-pacific") return "a big old kangaroo";
  if (s.climate === "boreal" || s.climate === "tundra") return "a bear";
  if (s.climate === "arid" || s.climate === "tropical" || s.climate === "monsoon") return "a big cat";
  return ["mesoamerican", "andean", "other-indigenous-american"].includes(s.culture) ? "a bear" : "a wild boar";
}

/** Hours on the hunt before a hunter can give it up and go home. */
export const GIVE_UP_HOURS = 4;

/** Where the kill goes. Sold as meat where people bought and sold; otherwise
 * shared round the kin, as foragers almost everywhere shared a big kill. Where
 * land was held the game was the lord's: forest law reserved deer to the
 * crown in Norman England, and on the Continent hunting rights went with
 * lordship until 1789–1848. Chiefs in farming societies took a set part of a
 * big kill, the Zulu and Shona chief's leg or breast, the "ground tusk" of an
 * elephant; early farming villages like Çatalhöyük show no chiefs to take it. */
export function huntFate(s: WorldSetting): CatchFate {
  const can = capabilitiesFor(s), { sold } = catchFate(s);
  const to = s.year >= 1850 ? undefined : can.has("heritable_land") ? "the lord"
    : s.year >= -4000 && can.has("settled_agriculture") && !can.has("writing") ? "the chief" : undefined;
  return {
    sold,
    buyer: !sold ? "your kin" : can.has("coinage") ? "the butcher" : "the market",
    ...(to ? { owed: { to, share: 0.25 } } : {}),
  };
}
