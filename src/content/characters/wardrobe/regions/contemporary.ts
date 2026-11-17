import type { GarmentKit, Option } from "../types";

/**
 * The clothes the whole world came to share: the T-shirt, jeans and trainers,
 * a zipped jacket, a printed dress, a backpack. They reach a share of people
 * in each place and leave the rest in what the region already wore, so a
 * street in Delhi or Kano keeps its saris and robes beside them. Shares are
 * art direction, not survey figures.
 */
const west = ["european", "mesoamerican", "andean", "other-indigenous-american", "australian-pacific"] as const;
const east = ["east-asian", "southeast-asian"] as const;
const beside = ["south-asian", "north-african-west-asian", "west-central-african", "east-southern-african", "inner-eurasian"] as const;

function casual(id: string, label: string, years: [number, number], cultures: NonNullable<GarmentKit["scope"]["cultures"]>, men: number, women: number, late: boolean, sunHat: "brimmed" | "conical" = "brimmed"): GarmentKit {
  // Every option carries its sex's share, so a person takes the whole look or none of it.
  const both = <const T,>(value: T, weight: number, more: Partial<Option<T>> = {}): Option<T>[] => [
    { value, weight, sex: ["male"], share: men, ...more },
    { value, weight, sex: ["female"], share: women, ...more },
  ];
  const her = <const T,>(value: T, weight: number, more: Partial<Option<T>> = {}): Option<T> => ({ value, weight, sex: ["female"], share: women, ...more });
  const his = <const T,>(value: T, weight: number, more: Partial<Option<T>> = {}): Option<T> => ({ value, weight, sex: ["male"], share: men, ...more });
  const young = ["child", "youth", "adult"] as const;
  return {
    id,
    label,
    scope: { years, cultures },
    priority: 0.6,
    garment: [...both("shirt", 8), her("dress", 3), her("skirt", 1)],
    motif: [
      ...both("tee", 5, { garments: ["shirt"] }),
      ...both("graphic", late ? 3 : 1, { garments: ["shirt"], ages: young }),
      ...both("placket", 2, { garments: ["shirt"] }),
      ...both("stripes", 1, { garments: ["shirt"] }),
      ...both("plaid", 1, { garments: ["shirt"] }),
      his("jersey", 1, { garments: ["shirt"], ages: ["child", "youth"] }),
      her("floral", 4, { garments: ["dress", "skirt"] }),
      her("plain", 3, { garments: ["dress", "skirt"] }),
    ],
    sleeves: [...both("short", 6, { garments: ["shirt", "dress"] }), ...both("long", 3)],
    leggings: [
      his("jeans", 6), his("trousers", 3), his("shorts", 2, { ages: young }),
      her("jeans", 5), her("trousers", 2), her("shorts", 1, { ages: young }), her("hose", 2),
    ],
    footwear: [...both("sneakers", 7), ...both("shoes", 2), ...both("sandals", 2), ...both("boots", 1)],
    waistcoat: [...both("jacket", 3, { garments: ["shirt"] }), ...both("none", 6)],
    bag: late ? [...both("backpack", 3, { ages: ["child", "youth"] }), ...both("backpack", 1, { ages: ["adult"] }), ...both("none", 7)] : undefined,
    // Bare-headed or a cap; a head cloth where women kept it; a straw hat still in the fields.
    headwear: [
      ...both("none", 8), his("ball-cap", 3), her("ball-cap", 1), ...both("cap", 1),
      ...(cultures.includes("south-asian") ? [her("headscarf", 5)] : []),
      ...both(sunHat, 8, { livelihoods: ["farmer", "fisher", "herder", "rice-farmer", "field-labourer", "farm-labourer"] }),
    ],
    shawl: both("none", 1),
    belt: [...both("none", 5), ...both("leather", 2)],
    over: both("none", 1),
    neckwear: both("none", 1),
    material: [...both("cotton", 6), ...both("synthetic", late ? 4 : 2)],
    dye: [
      ...both("white", 4), ...both("soot", 4), ...both("vat", 3), ...both("ash", 3), ...both("vermilion", 2),
      ...both("madder", 2), ...both("woad", 2), ...both("bleached", 2), ...both("chrome", 1), ...both("weld", 1), her("aniline", 1),
    ],
  };
}

export const contemporary: readonly GarmentKit[] = [
  casual("casual-early", "Jeans and T-shirts reach the young", [1970, 1995], west, 0.4, 0.3, false),
  casual("casual-early-east", "Jeans and T-shirts reach the young", [1970, 1995], east, 0.4, 0.3, false, "conical"),
  casual("casual-early-beside", "Jeans and T-shirts beside regional dress", [1970, 1995], beside, 0.2, 0.08, false),
  casual("casual", "T-shirt, jeans and trainers", [1995, 2040], west, 0.85, 0.8, true),
  casual("casual-east", "T-shirt, jeans and trainers", [1995, 2040], east, 0.85, 0.8, true, "conical"),
  casual("casual-beside", "T-shirt, jeans and trainers beside regional dress", [1995, 2040], beside, 0.6, 0.25, true),
];
