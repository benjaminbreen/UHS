import type { Station } from "../../core/itinerary";
import type { Pack } from "../../core/types";
import { propDefs } from "../props/catalog";
import { propKit, techFor } from "../props/selection";
import { shownAs } from "../../core/economy";

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

/** What people in this place carry things in, and how. */
export function carryKit(pack: Pack) {
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
  return {
    vessel: as(vessel, "vessel"),
    basket: as("basket", "basket"),
    bundle: as(bundle, "bundle"),
  };
}

/** A carried prop's key and style, when a held thing is a load. */
export function parseLoad(held: string) {
  const m = /^prop:([^@]+)@(hand|head|back)$/.exec(held);
  return m ? { prop: m[1], style: m[2] as CarryStyle } : undefined;
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
) {
  const out = stations.map((s) => ({ ...s }));
  // The day is a loop: the station after the last is the first.
  const bear = (i: number, load: string) => {
    const next = out[i % out.length];
    // Nobody plays with a full water jar on their head.
    if (!next.carry && next.activity !== "play") next.carry = load;
  };
  out.forEach((s, i) => {
    if (s.activity === "visit" && bought && s.label.startsWith("Buying"))
      bear(i + 1, shownAs[bought] ?? kit.basket);
    if (s.carry) return;
    if (s.activity === "draw-water") {
      s.carry = kit.vessel;
      bear(i + 1, kit.vessel);
    } else if (s.activity === "gather") {
      s.carry = kit.basket;
      bear(i + 1, kit.basket);
    } else if (s.activity === "haul") s.carry = kit.bundle;
  });
  const product = made && shownAs[made];
  let last = -1;
  out.forEach((s, i) => s.activity === "work" && (last = i));
  if (product && last >= 0) bear(last + 1, product);
  return out;
}
