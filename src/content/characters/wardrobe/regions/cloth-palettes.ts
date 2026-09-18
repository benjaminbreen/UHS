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
    fine: ["indigo", "safflower", "weld", "walnut"],
    costly: ["vermilion", "goldthread", "saffron"],
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
const SYNTHETIC: readonly DyeId[] = ["vat", "chrome", "white", "aniline", "bleached"];
const opts = <T,>(
  values: readonly T[],
  weight: number,
  means?: readonly ("poor" | "common" | "wealthy")[],
): Option<T>[] => values.map((value) => ({ value, weight, ...(means && { means }) }));

function kit(
  culture: CultureId,
  p: Palette,
  years: readonly [number, number],
  modern: boolean,
): GarmentKit {
  return {
    id: `cloth-${culture}${modern ? "-modern" : ""}`,
    label: `${culture} cloth`,
    scope: { years, cultures: [culture] },
    material: [
      ...opts(p.fibres, 6),
      ...opts(p.skins ?? [], 1),
      ...opts(p.rich ?? [], 3, ["wealthy"]),
      ...(modern ? opts(["cotton", "synthetic"] as Material[], 6) : []),
    ],
    dye: [
      ...opts(p.plain, 6),
      ...opts(p.fine ?? [], 3, ["common", "wealthy"]),
      ...opts(p.costly ?? [], 2, ["wealthy"]),
      ...(modern ? opts(SYNTHETIC, 5) : []),
    ],
  };
}
export const clothPalettes: readonly GarmentKit[] = Object.entries(
  palettes,
).flatMap(([culture, p]) => [
  kit(culture as CultureId, p, [-1000000, 1850], false),
  kit(culture as CultureId, p, [1850, 10001], true),
]);
