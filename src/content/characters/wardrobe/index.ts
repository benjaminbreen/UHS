import type { CharacterAppearance } from "../../../core/character";
import type { WorldSetting } from "../../geography/types";
import { random } from "../../../core/random";
import { matchesCharacterScope } from "../resolve";
import { garmentKits } from "./kits";
import type { Cloth, DyeId, Material } from "./cloth";
import { dyeAt, dyes } from "./cloth";
import {
  ageBandOf,
  wardrobeSlots,
  type GarmentKit,
  type Means,
  type Option,
  type WardrobeSlot,
  type Sex,
  type Wearer,
  type WearerScope,
} from "./types";

export * from "./types";
export * from "./cloth";
export * from "./roles";
export { garmentKits, eraFloors, regionalKits } from "./kits";

/** How many axes a kit constrains. A culture-scoped kit beats a global one
 * outright rather than on score: a floor spanning a narrow band of years is
 * still a floor, and folding culture into a years-times-degrees number lets it
 * win on arithmetic. Beliefs prefer a culture match the same way. */
function rank(k: GarmentKit) {
  const s = k.scope;
  return (
    (s.places ? 8 : 0) +
    (s.bounds ? 4 : 0) +
    (s.communities ? 2 : 0) +
    (s.cultures ? 1 : 0)
  );
}
/** Years times degrees, to order kits that constrain the same axes. */
function specificity(k: GarmentKit) {
  const box = k.scope.bounds;
  const area = box ? (box[2] - box[0]) * (box[3] - box[1]) : 360 * 180;
  return (k.scope.years[1] - k.scope.years[0]) * Math.max(1, area);
}
function fits(o: WearerScope, w: Wearer, band: ReturnType<typeof ageBandOf>) {
  return (
    (!o.sex || o.sex.includes(w.sex ?? "unspecified")) &&
    (!o.ages || o.ages.includes(band)) &&
    // Anything a merchant could buy, a monarch could too.
    (!o.means ||
      o.means.includes(w.means ?? "common") ||
      (w.means === "elite" && o.means.includes("wealthy"))) &&
    (!o.standing || (!!w.standing && o.standing.includes(w.standing))) &&
    (!o.livelihoods ||
      (!!w.livelihood && o.livelihoods.includes(w.livelihood))) &&
    (!o.roles || (w.roles ?? []).some((r) => o.roles!.includes(r)))
  );
}
/** Most people are neither poor nor rich. Seeded per person so a street has a
 * spread without the world model carrying a wealth field. */
/** Dressing needs something to key on. Where the record says nothing, a
 * seeded answer keeps the whole outfit coherent — better than letting one
 * person draw a veil from one pool and a loincloth from another. It decides
 * only what this figure wears. */
function sexOf(w: Wearer): Sex {
  if (w.sex && w.sex !== "unspecified") return w.sex;
  return random(w.id, "wardrobe-sex") < 0.5 ? "female" : "male";
}
export function meansOf(w: Wearer): Means {
  if (w.means) return w.means;
  if (w.standing === "unfree") return "poor";
  if ((w.roles ?? []).includes("aristocrat")) return "elite";
  const r = random(w.id, "wardrobe-means");
  // One in five hundred. A world of a thousand people holds a couple of them,
  // which is about right for the people who got painted.
  if (r > 0.998) return "elite";
  return r < 0.28 ? "poor" : r < 0.88 ? "common" : "wealthy";
}
/**
 * The narrowest kit with something to say about this slot *to this person*.
 * A kit whose options are all gated behind a role or a rank the wearer does
 * not have has nothing to say to them, and must not shadow the kit below —
 * otherwise a pressure suit's white paint becomes everyone's palette.
 */
function slotOptions<T>(
  kits: readonly GarmentKit[],
  key: WardrobeSlot,
  usable: (o: Option<T>) => boolean,
): readonly Option<T>[] {
  for (const kit of kits) {
    const options = (kit[key] ?? []) as readonly Option<T>[];
    const mine = options.filter(usable);
    if (mine.length) return mine;
  }
  return [];
}
/** What goes under a skirt or a gown: a stocking or nothing, never trousers. */
function skirted(
  garment: CharacterAppearance["wearing"]["garment"],
  legs: NonNullable<CharacterAppearance["wearing"]["leggings"]>,
  id: string,
) {
  if (garment !== "dress" && garment !== "skirt" && garment !== "gown")
    return legs;
  if (legs === "none" || legs === "hose" || legs === "wrapped") return legs;
  return random(id, "under-skirt") < 0.55 ? "hose" : "none";
}
/** Cloth that repays fine work, best first. A masterpiece is made of the best
 * thing the place had, not merely of something better than jute. */
const FINE_FIBRES: readonly Material[] = [
  "silk",
  "cotton",
  "linen",
  "ramie",
  "wool",
];
function weighted<T>(
  options: readonly Option<T>[],
  id: string,
  key: string,
): T | undefined {
  if (!options.length) return undefined;
  const total = options.reduce((n, o) => n + (o.weight ?? 1), 0);
  let roll = random(id, "wardrobe-v2", key) * total;
  for (const o of options) if ((roll -= o.weight ?? 1) < 0) return o.value;
  return options[options.length - 1].value;
}
function pick<T>(
  options: readonly Option<T>[],
  w: Wearer,
  band: ReturnType<typeof ageBandOf>,
  key: string,
): T | undefined {
  const usable = options.filter((o) => fits(o, w, band));
  if (!usable.length) return undefined;
  const total = usable.reduce((n, o) => n + (o.weight ?? 1), 0);
  let roll = random(w.id, "wardrobe-v2", key) * total;
  for (const o of usable) if ((roll -= o.weight ?? 1) < 0) return o.value;
  return usable[usable.length - 1].value;
}
/** Kits covering this place and date, narrowest first. */
export function kitsFor(
  setting: WorldSetting | undefined,
  year: number,
  pool: readonly GarmentKit[] = garmentKits,
) {
  return pool
    .filter((k) =>
      setting
        ? matchesCharacterScope(k.scope, setting)
        : // No setting to match against: only kits that ask nothing of place.
          year >= k.scope.years[0] &&
          year < k.scope.years[1] &&
          !k.scope.cultures &&
          !k.scope.bounds &&
          !k.scope.places &&
          !k.scope.communities,
    )
    .sort(
      (a, b) =>
        (b.priority ?? 0) - (a.priority ?? 0) ||
        rank(b) - rank(a) ||
        specificity(a) - specificity(b),
    );
}
/**
 * What this person's cloth is: the fibre, the colour on it, and how well it
 * was made. Quality is seeded and skewed by means — most cloth anywhere was
 * ordinary, fine work was expensive, and a poor wearer's is often worn out.
 */
export function clothFor(
  wearer: Wearer,
  place: { year: number; setting?: WorldSetting },
  pool: readonly GarmentKit[] = garmentKits,
  /** The colour the figure is already drawn in. Cloth and appearance are
   * resolved separately, and two independent dye rolls put a yellow tunic in
   * the item list on a man drawn in brown. */
  drawn?: string,
): Cloth {
  const kits = kitsFor(place.setting, place.year, pool);
  const band = ageBandOf(wearer.age);
  const w = { ...wearer, sex: sexOf(wearer), means: meansOf(wearer) };
  const r = random(w.id, "cloth-quality");
  const quality =
    w.means === "wealthy"
      ? r < 0.18
        ? 3
        : r < 0.5
          ? 2
          : r < 0.82
            ? 1
            : 0
      : w.means === "poor"
        ? r < 0.42
          ? -1
          : r < 0.94
            ? 0
            : 1
        : r < 0.12
          ? -1
          : r < 0.86
            ? 0
            : r < 0.98
              ? 1
              : 2;
  // Fine work went onto good cloth: nobody spends a season on undyed hemp.
  // So a garment that came out rare or unique draws its fibre and its colour
  // from what money could reach, whoever ended up wearing it.
  const buyer = { ...w, means: quality >= 2 ? ("wealthy" as const) : w.means };
  const dyeOptions = slotOptions<DyeId>(kits, "dye", (x) =>
    fits(x, buyer, band),
  );
  const fibreOptions = slotOptions<Material>(kits, "material", (x) =>
    fits(x, buyer, band),
  );
  // Work worth naming went onto cloth worth the work: a season's weaving does
  // not end up undyed, and a masterpiece is not jute.
  const fineDyes = dyeOptions.filter((o) => dyes[o.value].tier !== "common");
  const best = FINE_FIBRES.find((m) => fibreOptions.some((o) => o.value === m));
  const fineFibres = fibreOptions.filter((o) =>
    quality >= 3
      ? o.value === best
      : FINE_FIBRES.includes(o.value),
  );
  const material =
    weighted(
      quality >= 2 && fineFibres.length ? fineFibres : fibreOptions,
      w.id,
      "material",
    ) ?? "wool";
  let dye =
    weighted(
      quality >= 2 && fineDyes.length ? fineDyes : dyeOptions,
      w.id,
      "dye",
    ) ?? "undyed";
  const shown = dyeAt(drawn);
  if (shown && material !== "hide" && material !== "fur")
    return { material, dye: shown, quality };
  // A skin takes the colour it had. Bark cloth was painted and dyed; hide and
  // fur were not.
  if (material === "hide" || material === "fur") {
    const plain: DyeId[] = ["undyed", "bark", "umber", "walnut", "ochre"];
    dye = plain[Math.floor(random(w.id, "hide-tone") * plain.length)];
  }
  return { material, dye, quality };
}
/**
 * Dress one person. Resolution is per slot, not per kit: the narrowest kit
 * that has something to say about hats decides the hat, and a kit that says
 * nothing about shoes leaves them to whatever covers this place more broadly.
 * That way a city kit can be three lines long.
 */
export function wardrobeFor(
  wearer: Wearer,
  place: { year: number; setting?: WorldSetting },
  base: CharacterAppearance["wearing"],
  /** Overridable so a kit can be resolved against without registering it. */
  pool: readonly GarmentKit[] = garmentKits,
): CharacterAppearance["wearing"] {
  const kits = kitsFor(place.setting, place.year, pool);
  const band = ageBandOf(wearer.age);
  const w = { ...wearer, sex: sexOf(wearer), means: meansOf(wearer) };
  const chosen: Partial<Record<WardrobeSlot, unknown>> = {};
  for (const slot of wardrobeSlots)
    for (const kit of kits) {
      const options = kit[slot];
      if (!options?.length) continue;
      const value = pick(options as readonly Option<unknown>[], w, band, slot);
      if (value !== undefined) {
        chosen[slot] = value;
        break;
      }
    }
  const garment =
    (chosen.garment as CharacterAppearance["wearing"]["garment"]) ??
    base.garment;
  const dye = chosen.dye as DyeId | undefined;
  // Trim and lower cloth come from the same palette, or a figure ends up with
  // a period-correct body and an anachronistic hem. They must not land on the
  // body's own colour, though: banding drawn in the garment's colour is
  // invisible, which is the whole point of the pattern.
  const palette = slotOptions<DyeId>(
    kits,
    "dye",
    (o) => fits(o, w, band) && o.value !== dye,
  );
  const lower = weighted(palette, w.id, "dye-lower");
  const trim = weighted(
    palette.filter((o) => o.value !== lower),
    w.id,
    "dye-trim",
  );
  const over = chosen.over as
    | "none"
    | "cloak"
    | "mantle"
    | "shoulder-cloth"
    | undefined;
  return {
    ...base,
    // The kit's own dye beats the generic palette roll: that palette is what
    // put a saturated teal on a Neolithic villager.
    ...(dye ? { color: dyes[dye].hex } : {}),
    ...(lower ? { lowerColor: dyes[lower].hex } : {}),
    ...(trim ? { trim: dyes[trim].hex } : {}),
    ...(lower ? { cloakColor: dyes[lower].hex } : {}),
    garment,
    sleeves:
      (chosen.sleeves as CharacterAppearance["wearing"]["sleeves"]) ??
      (garment === "wrap" || garment === "none"
        ? "none"
        : garment === "robe"
          ? "loose"
          : garment === "coat"
            ? "long"
            : random(w.id, "wardrobe-v2", "sleeves") < 0.34
              ? "long"
              : "short"),
    hem:
      garment === "wrap"
        ? "slanted"
        : random(w.id, "wardrobe-v2", "hem") < 0.34
          ? "split"
          : "plain",
    headwear:
      (chosen.headwear as CharacterAppearance["wearing"]["headwear"]) ??
      base.headwear,
    // A flared skirt over a pair of trousers is nobody's dress, anywhere in
    // this atlas. The slots are resolved independently, so the pairing has to
    // be enforced here.
    leggings: skirted(
      garment,
      (chosen.leggings as CharacterAppearance["wearing"]["leggings"]) ?? "none",
      w.id,
    ),
    footwear:
      (chosen.footwear as CharacterAppearance["wearing"]["footwear"]) ?? "none",
    belt: (chosen.belt as CharacterAppearance["wearing"]["belt"]) ?? base.belt,
    motif: chosen.motif as CharacterAppearance["wearing"]["motif"],
    cloak: over === "cloak",
    mantle: over === "mantle",
    shoulderCloth: over === "shoulder-cloth",
  };
}
