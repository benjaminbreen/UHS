import type { Station } from "../../core/itinerary";
import type { Pack } from "../../core/types";
import { propDefs } from "../props/catalog";
import { propKit, techFor } from "../props/selection";
import { shownAs } from "../../core/economy";
import { capabilitiesFor } from "../characters/resolve";

/** How a load is borne: in the hand, balanced on the head, or on the back. */
export type CarryStyle = "hand" | "head" | "back";
type Load = "vessel" | "basket" | "bundle";

/**
 * Head-loading water and baskets is the habit of Africa, South Asia and the
 * Near East; the tumpline and back basket, of the Andes, Mesoamerica, East
 * Asia and much of Native North America. Elsewhere, and everywhere once the
 * bucket, the barrow and the tap arrive, things go in the hand. Broad
 * defaults, not a claim that no one in Europe ever carried a jar on her head.
 */
const styles: Partial<Record<string, Partial<Record<Load, CarryStyle>>>> = {
  "west-central-african": { vessel: "head", basket: "head", bundle: "head" },
  "east-southern-african": { vessel: "head", basket: "head", bundle: "head" },
  "south-asian": { vessel: "head", basket: "head" },
  "north-african-west-asian": { vessel: "head" },
  "southeast-asian": { basket: "back" },
  "east-asian": { basket: "back", bundle: "back" },
  andean: { basket: "back", bundle: "back" },
  mesoamerican: { basket: "back", bundle: "back" },
  "other-indigenous-american": { basket: "back", bundle: "back" },
  "inner-eurasian": { bundle: "back" },
};

export type CarryKit = {
  vessel: string; basket: string; bundle: string; tool: string;
  /** Shares of people who carry these on a shoulder pole or a yoke instead. */
  poled?: Partial<Record<Load, readonly [string, number]>>;
  /** A basket to market and home again, before the shopping bag. */
  shopping?: string;
};

/** What people in this place carry things in, and how. */
export function carryKit(pack: Pack): CarryKit {
  const culture = pack.setting?.culture ?? "european";
  const year = pack.year;
  const yard = propKit(pack).contexts.yard;
  const vessel =
    year >= 1850 || (techFor(pack).cooperage && year >= 500)
      ? "bucket"
      : yard.includes("jug")
        ? "jug"
        : yard.includes("calabash")
          ? "calabash"
          : "basket";
  const bundle = year < -3000 ? "hideBag" : "sack";
  const style = (load: Load): CarryStyle =>
    year >= 1950 ? "hand" : (styles[culture]?.[load] ?? "hand");
  const as = (prop: string, load: Load) => `prop:${prop}@${style(load)}`;
  // Before contact the milpa, the Andean terrace and the Pacific garden were
  // worked with a digging stick: the coa, the chakitaqlla, the ʻōʻō. Elsewhere
  // a hoe, wooden-bladed (art variant 1) where nobody smelted.
  const contact = ["mesoamerican", "andean"].includes(culture) ? year >= 1550
    : culture === "australian-pacific" ? year >= 1800 : true;
  const metal = !pack.setting || capabilitiesFor(pack.setting).has("metallurgy");
  // Korea carried on the jige, an A-frame on the back, not the pole.
  const korea = !!pack.setting && pack.setting.lon > 124 && pack.setting.lon < 131 && pack.setting.lat > 33 && pack.setting.lat < 43;
  const poleland = ((culture === "east-asian" && !korea) || culture === "southeast-asian") && year < 1970;
  return {
    vessel: as(vessel, "vessel"),
    basket: as("basket", "basket"),
    bundle: as(bundle, "bundle"),
    tool: contact ? `prop:hoe${metal ? "" : "#1"}@hand` : "prop:digging-stick@hand",
    poled: {
      vessel: poleland ? ["water-pole", culture === "east-asian" ? 0.7 : 0.45]
        // The bucket yoke: water and milk in Europe from the 1600s until the tap.
        : culture === "european" && vessel === "bucket" && year >= 1600 && year < 1920 ? ["yoke", 0.4] : undefined,
      basket: poleland ? ["carrying-pole", 0.5] : undefined,
      bundle: poleland ? ["carrying-pole", 0.4] : undefined,
    },
    shopping: year < 1920 ? as("basket", "basket") : undefined,
  };
}

/** How this person carries a kind of load: `roll` is theirs, the same every day. */
export function borne(kit: CarryKit, load: Load, roll: number) {
  const alt = kit.poled?.[load];
  return alt && roll < alt[1] ? alt[0] : kit[load];
}

/** A carried prop's key and style, when a held thing is a load. */
export function parseLoad(held: string) {
  const m = /^prop:([^@#]+)(?:#(\d))?@(hand|head|back)$/.exec(held);
  return m ? { prop: m[1], variant: Number(m[2] ?? 0), style: m[3] as CarryStyle } : undefined;
}
export function loadName(held: string) {
  const load = parseLoad(held);
  return load && propDefs[load.prop]?.name.toLowerCase();
}

/**
 * Give a day's stations their loads: an empty vessel out to the well and a
 * full one home, a basket out to gather and back laden, a bundle on the haul,
 * and whatever was bought carried home from the shop. The load rides on the
 * walk to each station and while there, so the way home is the next station's.
 */
export function withLoads(
  stations: Station[],
  kit: ReturnType<typeof carryKit>,
  bought?: string,
  /** The good this person makes, carried from their work to the next stop. */
  made?: string,
  roll = 1,
) {
  const vessel = borne(kit, "vessel", roll), basket = borne(kit, "basket", roll);
  const out = stations.map((s) => ({ ...s }));
  // The day is a loop: the station after the last is the first.
  const bear = (i: number, load: string) => {
    const next = out[i % out.length];
    // Nobody plays with a full water jar on their head.
    if (!next.carry && next.activity !== "play") next.carry = load;
  };
  out.forEach((s, i) => {
    // The field's generic tool becomes this place's.
    if (s.carry === "tool" && (s.activity === "tend" || s.label === "At the field")) s.carry = kit.tool;
    if (s.activity === "visit" && bought && s.label.startsWith("Buying"))
      bear(i + 1, shownAs[bought] ?? basket);
    if (s.carry) return;
    if (s.activity === "draw-water") {
      s.carry = vessel;
      bear(i + 1, vessel);
    } else if (s.activity === "gather" || s.label === "Washing clothes at the water") {
      s.carry = basket;
      bear(i + 1, basket);
    } else if (s.activity === "haul") s.carry = borne(kit, "bundle", roll);
    else if (s.activity === "visit" && kit.shopping && /market|square|bazaar/i.test(s.label)) {
      s.carry = kit.shopping;
      bear(i + 1, kit.shopping);
    }
  });
  const product = made && shownAs[made];
  let last = -1;
  out.forEach((s, i) => s.activity === "work" && (last = i));
  if (product && last >= 0) bear(last + 1, product);
  return out;
}

/** Pack beasts a merchant's train will sell or hire out: worth in coin, and
 * the load each bears in the units a person carries about twenty of. */
export const BEASTS: Record<string, { name: string; value: number; load: number }> = {
  donkey: { name: "Donkey", value: 30, load: 40 },
  horse: { name: "Packhorse", value: 60, load: 50 },
  camel: { name: "Camel", value: 80, load: 100 },
  llama: { name: "Llama", value: 20, load: 25 },
  cattle: { name: "Pack ox", value: 40, load: 60 },
};
/** `beast-camel` is bought; `hire-camel-12` is hired for day 12 only. */
export function beastOf(id: string) {
  const m = /^(beast|hire)-([a-z]+)(?:-(\d+))?$/.exec(id), b = m && BEASTS[m[2]];
  return b ? { ...b, species: m![2], day: m![3] === undefined ? undefined : Number(m![3]) } : undefined;
}
