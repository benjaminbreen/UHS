import type { CultureId } from "../../../history/types";
import type { DyeId, Material } from "../cloth";
import type { GarmentKit, Option } from "../types";

/**
 * What cloth was available, and what colour could be got onto it. One entry
 * per culture region, split at the synthetic dyes: before them a colour costs
 * what the dyestuff costs, after them it costs almost nothing, which is the
 * single largest change in the history of how people look.
 *
 * `plain` is what anyone wears, `fine` wants some money, `costly` is for the
 * few. Broad by design — a first pass, not a dye survey.
 */
type Palette = {
  fibres: readonly Material[];
  /** Skins: real, but never the common stuff of an everyday garment. */
  skins?: readonly Material[];
  rich?: readonly Material[];
  plain: readonly DyeId[];
  fine?: readonly DyeId[];
  costly?: readonly DyeId[];
};
const palettes: Record<CultureId, Palette> = {
  european: {
    fibres: ["wool", "linen", "hemp", "felt"],
    skins: ["hide", "fur"],
    rich: ["silk", "wool"],
    plain: ["undyed", "greige", "ochre", "umber", "russet", "ash", "walnut", "bark"],
    fine: ["woad", "madder", "weld", "bleached"],
    costly: ["kermes", "tyrian", "goldthread"],
  },
  "north-african-west-asian": {
    fibres: ["linen", "wool", "cotton", "felt", "hemp"],
    rich: ["silk", "cotton"],
    plain: ["undyed", "greige", "ochre", "umber", "clay", "ash", "bark"],
    fine: ["henna", "pomegranate", "madder", "bleached", "indigo"],
    costly: ["saffron", "kermes", "tyrian", "goldthread"],
  },
  "inner-eurasian": {
    fibres: ["wool", "felt", "hemp"],
    skins: ["hide", "fur"],
    rich: ["silk", "wool"],
    plain: ["undyed", "umber", "bark", "ochre", "ash", "walnut", "soot"],
    fine: ["madder", "indigo", "weld"],
    costly: ["goldthread", "vermilion"],
  },
  "south-asian": {
    fibres: ["cotton", "hemp", "linen", "ramie"],
    rich: ["silk", "cotton"],
    plain: ["undyed", "greige", "ochre", "clay", "bark", "umber"],
    fine: ["turmeric", "madder", "henna", "safflower", "pomegranate", "indigo"],
    costly: ["lac", "saffron", "goldthread"],
  },
  "east-asian": {
    fibres: ["hemp", "ramie", "cotton", "felt", "wool"],
    rich: ["silk"],
    plain: ["undyed", "greige", "ash", "soot", "bark", "umber"],
    fine: ["indigo", "kariyasu", "kuchinashi", "safflower"],
    costly: ["murasaki", "vermilion", "goldthread"],
  },
  "southeast-asian": {
    fibres: ["cotton", "barkcloth", "hemp", "ramie"],
    rich: ["silk", "cotton"],
    plain: ["undyed", "greige", "bark", "soot", "ochre", "clay"],
    fine: ["morinda", "indigo", "sappan", "turmeric"],
    costly: ["goldthread", "lac"],
  },
  "west-central-african": {
    fibres: ["cotton", "barkcloth", "jute"],
    skins: ["hide"],
    rich: ["cotton", "silk"],
    plain: ["undyed", "greige", "ochre", "clay", "bark", "soot"],
    fine: ["indigo", "morinda", "henna"],
    costly: ["goldthread", "lac"],
  },
  "east-southern-african": {
    fibres: ["cotton", "barkcloth", "wool"],
    skins: ["hide"],
    rich: ["cotton"],
    plain: ["undyed", "ochre", "clay", "bark", "soot", "umber"],
    fine: ["indigo", "madder"],
    costly: ["goldthread"],
  },
  mesoamerican: {
    fibres: ["cotton", "barkcloth", "jute"],
    skins: ["hide"],
    rich: ["cotton"],
    plain: ["undyed", "greige", "ochre", "clay", "bark", "umber"],
    fine: ["indigo", "logwood", "weld"],
    costly: ["cochineal", "tyrian"],
  },
  andean: {
    fibres: ["wool", "cotton"],
    skins: ["hide"],
    rich: ["wool", "cotton"],
    plain: ["undyed", "greige", "ochre", "umber", "clay", "bark"],
    fine: ["indigo", "weld", "walnut"],
    costly: ["cochineal", "vermilion"],
  },
  "other-indigenous-american": {
    fibres: ["barkcloth", "cotton"],
    skins: ["hide", "fur"],
    rich: ["hide", "cotton"],
    plain: ["undyed", "ochre", "clay", "bark", "umber", "soot"],
    fine: ["walnut", "madder"],
    costly: ["vermilion"],
  },
  "australian-pacific": {
    fibres: ["barkcloth", "jute", "cotton"],
    skins: ["hide"],
    rich: ["barkcloth", "cotton"],
    plain: ["undyed", "ochre", "clay", "bark", "soot", "greige"],
    fine: ["morinda", "turmeric"],
    costly: ["goldthread"],
  },
};
/** Anywhere, once colour stopped costing what the dyestuff cost. */
const SYNTHETIC: readonly DyeId[] = ["vat", "chrome", "white", "bleached"];
/** Kept off men once colour is coded by sex; see `kit`. */
const FEMININE: readonly DyeId[] = ["aniline"];
const opts = <T,>(
  values: readonly T[],
  weight: number,
  means?: readonly ("poor" | "common" | "wealthy")[],
): Option<T>[] => values.map((value) => ({ value, weight, ...(means && { means }) }));

/** How loud cloth is allowed to be. Dyeing at scale wants a dyehouse and
 * something to trade it for, so before the first states a bright garment is a
 * rarity rather than a quarter of the street; `modern` is the other end, where
 * colour costs nothing. */
type Era = "early" | "settled" | "modern" | "contemporary";

function kit(
  culture: CultureId,
  p: Palette,
  years: readonly [number, number],
  era: Era,
): GarmentKit {
  const modern = era === "modern" || era === "contemporary";
  // After the war nearly everything is bought: cotton and synthetics, a
  // little wool. Hemp and felt survive as rarities, not as a work shirt.
  const bought = era === "contemporary";
  return {
    id: `cloth-${culture}${era === "settled" ? "" : `-${era}`}`,
    label: `${culture} cloth`,
    scope: { years, cultures: [culture] },
    // Below ordinary dress: a kit that names the local dyes for a place and a
    // date is closer to the truth than a palette for a whole culture region,
    // whichever of the two happens to be narrower in years.
    priority: -1,
    material: [
      ...(bought
        ? opts(
            p.fibres.filter((f) => f !== "cotton" && f !== "wool"),
            1,
          )
        : opts(p.fibres, 6)),
      ...(bought ? [] : opts(p.skins ?? [], 1)),
      ...opts(p.rich ?? [], 3, ["wealthy"]),
      ...(modern ? opts(["cotton", "synthetic"] as Material[], 6) : []),
      ...(bought ? opts(["cotton"] as Material[], 10) : []),
      ...(bought ? opts(["wool"] as Material[], 2) : []),
    ],
    dye: [
      ...opts(p.plain, 6),
      ...opts(p.fine ?? [], era === "early" ? 1 : 3, ["common", "wealthy"]),
      // Tyrian purple and gold thread are not what money buys in 2009.
      ...(era === "early" || bought
        ? []
        : opts(p.costly ?? [], 2, ["wealthy"])),
      ...(modern ? opts(SYNTHETIC, 5) : []),
      // Mauve reads as a women's colour by the late twentieth century.
      ...(bought
        ? FEMININE.map((value) => ({ value, weight: 4, sex: ["female" as const] }))
        : []),
    ],
  };
}
export const clothPalettes: readonly GarmentKit[] = Object.entries(
  palettes,
).flatMap(([culture, p]) => [
  kit(culture as CultureId, p, [-1000000, -500], "early"),
  kit(culture as CultureId, p, [-500, 1850], "settled"),
  kit(culture as CultureId, p, [1850, 1950], "modern"),
  kit(culture as CultureId, p, [1950, 10001], "contemporary"),
]);
