import type { Material, DyeId } from "./cloth";

/**
 * What a garment is called in the century it is worn in. The wardrobe thinks
 * in silhouettes and fibres, which is right for drawing a figure and wrong for
 * naming one: nobody in 2025 owns a bleached synthetic long tunic, they own a
 * white polyester dress. Everything here is a rename at the last moment, so
 * the resolver, the ids and the saves are untouched.
 */

/** Trade names arrive with the fibre. Rayon is the pre-war one. */
const syntheticWords: readonly [number, readonly string[]][] = [
  [1960, ["rayon", "viscose"]],
  [10001, ["polyester", "nylon", "acrylic"]],
];
export function materialWord(
  material: Material,
  year: number,
  pick: (list: readonly string[]) => string,
): string {
  if (material === "synthetic")
    return pick(syntheticWords.find(([until]) => year < until)![1]);
  // A tanned skin is leather once there are tanneries selling it as such.
  if (material === "hide" && year >= 1500) return "leather";
  return material;
}

/** Colours as they are asked for in a shop, once cloth comes from a shop. */
const modernDyes: Partial<Record<DyeId, string>> = {
  bleached: "white",
  undyed: "unbleached",
  greige: "off-white",
  soot: "black",
  ash: "grey",
  bark: "brown",
  walnut: "dark brown",
  umber: "dark brown",
  russet: "rust",
  clay: "terracotta",
  ochre: "mustard",
  madder: "red",
  weld: "yellow",
  woad: "blue",
  onion: "gold",
  safflower: "coral",
  vat: "blue",
  chrome: "green",
  aniline: "mauve",
  white: "white",
};
export function dyeWord(dye: DyeId, year: number, fallback: string): string {
  return (year >= 1900 && modernDyes[dye]) || fallback;
}

/** Silhouette to shop-window name. Keyed by the garment slot value, so an
 * unlisted one keeps whatever the item catalogue calls it. */
const modernGarments: Record<string, string> = {
  tunic: "T-shirt",
  "long-tunic": "tunic dress",
  wrap: "sarong",
  "open-robe": "open jacket",
  coat: "jacket",
  gown: "evening gown",
  sarong: "sarong",
  hose: "tights",
  wide: "wide trousers",
  band: "headband",
  wrapped: "leg wraps",
};
/** `base` is an item id such as `garment-long-tunic`; the trailing part is
 * the silhouette. */
export function garmentWord(
  baseId: string,
  year: number,
  fallback: string,
): string {
  if (year < 1900) return fallback;
  const key = baseId.replace(/^(garment|headwear|leggings|footwear|belt)-/, "");
  return modernGarments[key] ?? fallback;
}

/** Post-war names that depend on the cloth as well as the cut: blue cotton
 * trousers are jeans, and a boot on a working man is a work boot. `material`
 * false means the noun already says it ("jeans", not "cotton jeans"). */
const BLUES = new Set<DyeId>(["vat", "indigo", "woad"]);
export function modernNoun(
  noun: string,
  cloth: { material: Material; dye: DyeId },
  year: number,
  pick: (list: readonly string[]) => string,
): { noun: string; material: boolean } | undefined {
  if (year < 1950) return undefined;
  if (noun === "trousers") {
    if (cloth.material === "cotton" && BLUES.has(cloth.dye))
      return { noun: "jeans", material: false };
    if (cloth.material === "cotton")
      return { noun: pick(["chinos", "work trousers", "slacks"]), material: false };
    if (cloth.material === "synthetic")
      return { noun: pick(["track pants", "slacks"]), material: true };
    return { noun: "slacks", material: true };
  }
  if (noun === "shirt")
    return {
      noun: pick(
        year >= 1970 && cloth.material === "cotton"
          ? ["button-down shirt", "work shirt", "sweatshirt", "polo shirt", "flannel shirt"]
          : ["button-down shirt", "work shirt", "shirt"],
      ),
      material: cloth.material !== "cotton",
    };
  if (noun === "boots")
    return {
      noun: pick(year >= 1975 ? ["work boots", "hiking boots", "cowboy boots"] : ["work boots"]),
      material: false,
    };
  if (noun === "shoes")
    return { noun: pick(["loafers", "dress shoes", "shoes"]), material: false };
  if (noun === "sneakers")
    return { noun: pick(year >= 1985 ? ["sneakers", "running shoes", "high-tops"] : ["sneakers"]), material: false };
  if (noun === "jacket")
    return {
      noun: pick(
        year >= 1970
          ? ["jacket", "hoodie", "windbreaker", "denim jacket", "sport coat"]
          : ["jacket", "sport coat"],
      ),
      material: true,
    };
  if (noun === "peaked cap" && year >= 1970)
    return { noun: "baseball cap", material: false };
  return undefined;
}

/** Polyester does not fray or spin well; it fades and pills. */
export const synthetic = {
  worn: ["faded", "pilled", "bobbled", "stained", "sun-bleached"],
  distinctive: ["crisp", "neatly pressed", "colourfast"],
  rare: ["brand-new", "sharply cut", "smartly finished"],
  unique: ["designer", "immaculate", "couture"],
} as const;
