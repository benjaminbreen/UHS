import type { GarmentKit, Option } from "../types";
import type { masks } from "../../../../core/character";

/**
 * North Africa and West Asia. Loose covering cloth against sun and dust is the
 * constant: a long shift to the ankle, an open outer robe over it, and a cloth
 * on the head that can be wound, draped or dropped across the face. So
 * `long-tunic` and `open-robe` carry the region and `wrap` carries the head.
 *
 * The fez is deliberately late. It is an Ottoman standardisation of the 1820s
 * and after, not a general Islamic or Middle Eastern hat, and putting it in
 * earlier bands would be the commonest way to get this region wrong.
 */
type Wrap = { id: string; label: string; years: [number, number]; bounds: [number, number, number, number]; communities?: string[]; except?: [number, number, number, number][]; colors: string[]; masks: [(typeof masks)[number], number][] };
const women = { sex: ["female"], ages: ["youth", "adult", "elder"] } as const;
function streetWraps(wraps: Wrap[]): GarmentKit[] {
  return wraps.map(({ id, label, years, bounds, communities, except, colors, masks }): GarmentKit => ({
    id,
    label,
    scope: { years, bounds, communities, except },
    priority: 1.5,
    over: [{ value: "shroud", weight: 5, ...women, means: ["common", "wealthy", "elite"] }, { value: "none", weight: 1, ...women, means: ["common", "wealthy", "elite"] },
      { value: "shroud", weight: 2, ...women, means: ["poor"] }, { value: "none", weight: 3, ...women, means: ["poor"] }],
    overColor: colors.map((value): Option<string> => ({ value, weight: 1, ...women })),
    headwear: [{ value: "veil", weight: 1, ...women }],
    mask: [...masks.map(([value, weight]): Option<(typeof masks)[number][0]> => ({ value, weight, ...women, means: ["common", "wealthy", "elite"] })),
      { value: "none", weight: 1, ...women, means: ["poor"] }],
  }));
}

/** Townspeople of Mecca, Basra and Timbuktu did not dress as the herders. */
const herdersOnly = (k: GarmentKit): GarmentKit =>
  Object.fromEntries(Object.entries(k).map(([key, v]) =>
    [key, Array.isArray(v) ? v.map((o) => ({ ...o, livelihoods: ["herder", "caravaneer"] })) : v])) as GarmentKit;

export const westAsiaNorthAfrica: readonly GarmentKit[] = [
  {
    id: "wana-ancient",
    label: "West Asia & North Africa · linen and the draped cloth",
    scope: { years: [-1000000, 650], cultures: ["north-african-west-asian"] },
    sleeves: [{ value: "long", weight: 6 }, { value: "loose", weight: 3, garments: ["robe", "open-robe", "long-tunic"] }, { value: "short", weight: 2, garments: ["tunic", "shirt"] }],
    motif: [{ value: "plain", weight: 8 }, { value: "band", weight: 2, garments: ["robe", "open-robe", "long-tunic"] }],
    garment: [
      { value: "long-tunic", weight: 5 },
      { value: "wrap", weight: 4 },
      { value: "tunic", weight: 4 },
      { value: "loincloth", weight: 2, means: ["poor"], sex: ["male"] },
      { value: "none", weight: 2, means: ["poor"], sex: ["male"] },
    ],
    leggings: [
      { value: "none", weight: 6 },
      { value: "sarong", weight: 2 },
      { value: "wrapped", weight: 2 },
    ],
    headwear: [
      { value: "none", weight: 4 },
      { value: "wrap", weight: 5 },
      { value: "band", weight: 3 },
      { value: "brimmed", weight: 2, livelihoods: ["farmer", "herder"] },
      { value: "veil", weight: 2, sex: ["female"] },
      { value: "fillet", weight: 1, means: ["wealthy"] },
    ],
    footwear: [
      { value: "sandals", weight: 6 },
      { value: "none", weight: 4 },
      { value: "shoes", weight: 2, means: ["wealthy"] },
    ],
    belt: [
      { value: "sash", weight: 4 },
      { value: "cord", weight: 3 },
      { value: "leather", weight: 2 },
      { value: "none", weight: 2 },
    ],
    over: [
      { value: "none", weight: 5 },
      { value: "mantle", weight: 3 },
      { value: "cloak", weight: 2 },
    ],
  },
  {
    id: "wana-medieval",
    label: "West Asia & North Africa · the robe over the shift",
    scope: { years: [650, 1500], cultures: ["north-african-west-asian"] },
    sleeves: [{ value: "long", weight: 6 }, { value: "loose", weight: 3, garments: ["robe", "open-robe", "long-tunic"] }, { value: "short", weight: 2, garments: ["tunic", "shirt"] }],
    motif: [{ value: "plain", weight: 8 }, { value: "band", weight: 2, garments: ["robe", "open-robe", "long-tunic"] }],
    garment: [
      { value: "long-tunic", weight: 5 },
      { value: "open-robe", weight: 5 },
      { value: "robe", weight: 3 },
      { value: "tunic", weight: 2 },
      { value: "none", weight: 1, means: ["poor"], sex: ["male"] },
    ],
    leggings: [
      { value: "none", weight: 4 },
      { value: "wide", weight: 4 },
      { value: "sarong", weight: 2 },
    ],
    headwear: [
      { value: "wrap", weight: 7 },
      { value: "veil", weight: 4, sex: ["female"] },
      { value: "none", weight: 2 },
      { value: "cap", weight: 2 },
      { value: "brimmed", weight: 1, livelihoods: ["farmer", "herder"] },
    ],
    footwear: [
      { value: "sandals", weight: 5 },
      { value: "shoes", weight: 4 },
      { value: "none", weight: 2, means: ["poor"] },
    ],
    belt: [{ value: "sash", weight: 7 }, { value: "leather", weight: 2 }],
    over: [
      { value: "none", weight: 5 },
      { value: "cloak", weight: 3 },
      { value: "mantle", weight: 2 },
    ],
  },
  {
    id: "wana-early-modern",
    label: "West Asia & North Africa · kaftan and turban",
    scope: { years: [1500, 1850], cultures: ["north-african-west-asian"] },
    sleeves: [{ value: "long", weight: 6 }, { value: "loose", weight: 3, garments: ["robe", "open-robe", "long-tunic"] }, { value: "short", weight: 2, garments: ["tunic", "shirt"] }],
    motif: [{ value: "plain", weight: 8 }, { value: "band", weight: 2, garments: ["robe", "open-robe", "long-tunic"] }],
    garment: [
      { value: "open-robe", weight: 6 },
      { value: "long-tunic", weight: 5 },
      { value: "robe", weight: 3 },
      { value: "none", weight: 1, means: ["poor"], sex: ["male"] },
    ],
    leggings: [
      { value: "wide", weight: 6 },
      { value: "none", weight: 3 },
      { value: "hose", weight: 1 },
    ],
    headwear: [
      { value: "wrap", weight: 7 },
      { value: "veil", weight: 4, sex: ["female"] },
      { value: "cap", weight: 2 },
      { value: "none", weight: 2 },
    ],
    footwear: [
      { value: "shoes", weight: 5 },
      { value: "sandals", weight: 4 },
      { value: "boots", weight: 2, means: ["wealthy"] },
      { value: "none", weight: 2, means: ["poor"] },
    ],
    belt: [{ value: "sash", weight: 8 }, { value: "leather", weight: 2 }],
  },
  {
    id: "wana-modern",
    label: "West Asia & North Africa · the fez, then the shirt",
    // Turkey banned the fez in 1925 and Iran never wore it.
    scope: { years: [1850, 1925], cultures: ["north-african-west-asian"], except: [[44, 25, 63.5, 39.8]] },
    sleeves: [{ value: "long", weight: 6 }, { value: "loose", weight: 3, garments: ["robe", "open-robe", "long-tunic"] }, { value: "short", weight: 2, garments: ["tunic", "shirt"] }],
    motif: [{ value: "plain", weight: 8 }, { value: "band", weight: 2, garments: ["robe", "open-robe", "long-tunic"] }],
    garment: [
      { value: "long-tunic", weight: 5 },
      { value: "shirt", weight: 5 },
      { value: "open-robe", weight: 3 },
      { value: "coat", weight: 2 },
      { value: "robe", weight: 2 },
    ],
    leggings: [
      { value: "trousers", weight: 5 },
      { value: "wide", weight: 4 },
      { value: "none", weight: 2 },
    ],
    headwear: [
      { value: "wrap", weight: 5 },
      { value: "veil", weight: 4, sex: ["female"] },
      { value: "headscarf", weight: 3, sex: ["female"] },
      { value: "fez", weight: 3, sex: ["male"] },
      { value: "cap", weight: 2 },
      { value: "none", weight: 3 },
    ],
    footwear: [
      { value: "shoes", weight: 6 },
      { value: "sandals", weight: 4 },
      { value: "boots", weight: 2 },
    ],
  },
  {
    id: "wana-modern-later",
    label: "West Asia & North Africa · the shirt",
    scope: { years: [1925, 10001], cultures: ["north-african-west-asian"] },
    sleeves: [{ value: "long", weight: 6 }, { value: "loose", weight: 3, garments: ["robe", "open-robe", "long-tunic"] }, { value: "short", weight: 2, garments: ["tunic", "shirt"] }],
    motif: [{ value: "plain", weight: 8 }, { value: "band", weight: 2, garments: ["robe", "open-robe", "long-tunic"] }],
    garment: [
      { value: "long-tunic", weight: 5 },
      { value: "shirt", weight: 5 },
      { value: "open-robe", weight: 3 },
      { value: "coat", weight: 2 },
      { value: "robe", weight: 2 },
    ],
    leggings: [
      { value: "trousers", weight: 5 },
      { value: "wide", weight: 4 },
      { value: "none", weight: 2 },
    ],
    headwear: [
      { value: "wrap", weight: 5 },
      { value: "veil", weight: 4, sex: ["female"] },
      { value: "headscarf", weight: 3, sex: ["female"] },
      { value: "cap", weight: 2 },
      { value: "none", weight: 3 },
    ],
    footwear: [
      { value: "shoes", weight: 6 },
      { value: "sandals", weight: 4 },
      { value: "boots", weight: 2 },
    ],
  },
  {
    id: "wana-modern-iran",
    label: "Qajar Iran · the lambskin kolah",
    scope: { years: [1850, 1925], cultures: ["north-african-west-asian"], bounds: [44, 25, 63.5, 39.8] },
    sleeves: [{ value: "long", weight: 6 }, { value: "loose", weight: 3, garments: ["robe", "open-robe", "long-tunic"] }, { value: "short", weight: 2, garments: ["tunic", "shirt"] }],
    motif: [{ value: "plain", weight: 8 }, { value: "band", weight: 2, garments: ["robe", "open-robe", "long-tunic"] }],
    garment: [
      { value: "long-tunic", weight: 5 },
      { value: "shirt", weight: 5 },
      { value: "open-robe", weight: 3 },
      { value: "coat", weight: 2 },
      { value: "robe", weight: 2 },
    ],
    leggings: [
      { value: "trousers", weight: 5 },
      { value: "wide", weight: 4 },
      { value: "none", weight: 2 },
    ],
    headwear: [
      { value: "wrap", weight: 5 },
      { value: "veil", weight: 4, sex: ["female"] },
      { value: "headscarf", weight: 3, sex: ["female"] },
      { value: "cap", weight: 3, sex: ["male"] },
      { value: "cap", weight: 2 },
      { value: "none", weight: 3 },
    ],
    footwear: [
      { value: "shoes", weight: 6 },
      { value: "sandals", weight: 4 },
      { value: "boots", weight: 2 },
    ],
  },
  herdersOnly({
    // Camel and goat herders of the Arabian and Syrian desert: a long shirt
    // (thawb), a head cloth held by a cord, the cloak (aba) of camel or goat
    // hair; women in long dark gowns, veiled.
    id: "bedouin",
    label: "Bedouin · thawb, head cloth and aba",
    scope: { years: [-1000, 1950], bounds: [37, 18, 52, 33] },
    garment: [{ value: "robe", weight: 7 }, { value: "long-tunic", weight: 3 }, { value: "dress", weight: 6, sex: ["female"] }],
    sleeves: [{ value: "long", weight: 8 }],
    headwear: [
      { value: "headscarf", weight: 7, sex: ["male"] },
      { value: "wrap", weight: 3, sex: ["male"] },
      { value: "veil", weight: 8, sex: ["female"] },
    ],
    leggings: [{ value: "none", weight: 6 }, { value: "wide", weight: 2 }],
    footwear: [{ value: "sandals", weight: 6 }, { value: "none", weight: 3, means: ["poor"] }],
    over: [{ value: "cloak", weight: 6 }, { value: "none", weight: 3 }],
    material: [{ value: "wool", weight: 5 }, { value: "cotton", weight: 4 }],
    dye: [{ value: "undyed", weight: 6 }, { value: "soot", weight: 4 }, { value: "indigo", weight: 3 }, { value: "bark", weight: 2 }],
  }),
  herdersOnly({
    // Tuareg men veil the face with the tagelmust, the indigo staining the
    // skin blue; women go unveiled under a head cloth. Wide robes and trousers.
    id: "tuareg",
    label: "Tuareg · the indigo veil",
    scope: { years: [500, 1950], bounds: [-4, 16, 12, 26] },
    garment: [{ value: "robe", weight: 6 }, { value: "open-robe", weight: 3 }, { value: "dress", weight: 5, sex: ["female"] }],
    headwear: [{ value: "veil", weight: 9, sex: ["male"], ages: ["adult", "elder"] }, { value: "wrap", weight: 4, sex: ["male"] }, { value: "headscarf", weight: 7, sex: ["female"] }],
    leggings: [{ value: "wide", weight: 7 }],
    footwear: [{ value: "sandals", weight: 8 }],
    neck: [{ value: "beads", weight: 3 }, { value: "none", weight: 4 }],
    sidearm: [{ value: "sword", weight: 2, sex: ["male"], means: ["common", "wealthy"] }, { value: "none", weight: 6 }],
    dye: [{ value: "indigo", weight: 8 }, { value: "undyed", weight: 3 }, { value: "soot", weight: 2 }],
  }),
  {
    // The Persepolis reliefs: Persians in the long pleated robe and fluted
    // hat, Medes in the riding coat, trousers and rounded felt cap.
    id: "persia-achaemenid",
    label: "Achaemenid Iran · the court robe and the Median coat",
    scope: { years: [-550, -330], bounds: [44, 25, 65, 40] },
    garment: [{ value: "robe", weight: 5 }, { value: "coat", weight: 4, sex: ["male"] }, { value: "dress", weight: 6, sex: ["female"] }],
    sleeves: [{ value: "loose", weight: 5, garments: ["robe"] }, { value: "long", weight: 5 }],
    leggings: [{ value: "trousers", weight: 6 }, { value: "none", weight: 3 }],
    headwear: [{ value: "cap", weight: 6, sex: ["male"] }, { value: "fillet", weight: 2, means: ["wealthy"] }, { value: "veil", weight: 5, sex: ["female"] }],
    footwear: [{ value: "shoes", weight: 7 }, { value: "boots", weight: 2 }],
    belt: [{ value: "sash", weight: 6 }, { value: "leather", weight: 3 }],
    dye: [{ value: "undyed", weight: 4 }, { value: "madder", weight: 3 }, { value: "kermes", weight: 2, means: ["wealthy"] }, { value: "indigo", weight: 2 }],
  },
  {
    // Parthian and Sasanian dress from the rock reliefs and silver plates:
    // a belted tunic over baggy trousers, the riding coat, ribbons streaming
    // from the cap of the well born.
    id: "persia-parthian-sasanian",
    label: "Parthian and Sasanian Iran · tunic and trousers",
    scope: { years: [-250, 651], bounds: [44, 25, 65, 40] },
    garment: [{ value: "tunic", weight: 6, sex: ["male"] }, { value: "coat", weight: 3, sex: ["male"] }, { value: "dress", weight: 6, sex: ["female"] }],
    sleeves: [{ value: "long", weight: 8 }],
    leggings: [{ value: "wide", weight: 6 }, { value: "trousers", weight: 3 }],
    headwear: [{ value: "cap", weight: 6, sex: ["male"] }, { value: "fillet", weight: 2, means: ["wealthy"] }, { value: "veil", weight: 5, sex: ["female"] }],
    footwear: [{ value: "boots", weight: 4 }, { value: "shoes", weight: 5 }],
    belt: [{ value: "leather", weight: 5 }, { value: "sash", weight: 4 }],
    hatTrim: [{ value: "ribbon", weight: 2, means: ["wealthy"] }, { value: "none", weight: 6 }],
    dye: [{ value: "madder", weight: 4 }, { value: "undyed", weight: 4 }, { value: "indigo", weight: 2 }, { value: "kermes", weight: 1, means: ["wealthy"] }],
    trimPattern: [{ value: "diamond", weight: 3 }, { value: "dots", weight: 3 }, { value: "none", weight: 3 }],
  },
  {
    // Safavid Iran: the long coat (qaba) sashed at the waist and the turban
    // wound round a tall cap; Isfahan's silks for those who could pay.
    id: "persia-safavid",
    label: "Safavid and Qajar Iran · qaba, sash and turban",
    scope: { years: [1501, 1900], bounds: [44, 25, 65, 40] },
    garment: [{ value: "open-robe", weight: 6 }, { value: "robe", weight: 4 }, { value: "dress", weight: 6, sex: ["female"] }],
    headwear: [{ value: "turban", weight: 7, sex: ["male"] }, { value: "cap", weight: 2, sex: ["male"] }, { value: "veil", weight: 7, sex: ["female"] }],
    leggings: [{ value: "wide", weight: 6 }, { value: "trousers", weight: 2 }],
    belt: [{ value: "sash", weight: 9 }],
    material: [{ value: "cotton", weight: 6 }, { value: "silk", weight: 3, means: ["wealthy"] }, { value: "wool", weight: 2 }],
    dye: [{ value: "madder", weight: 3 }, { value: "indigo", weight: 3 }, { value: "pomegranate", weight: 2 }, { value: "undyed", weight: 3 }, { value: "goldthread", weight: 1, means: ["wealthy"] }],
  },
  // Women's street wraps, head to ankle, in the towns: the outdoor dress of
  // respectable women. Field and herding women went less covered, so the poor
  // wear them less.
  // The Ottoman communities north of 35°: turbans for Muslims and coloured
  // caps or turbans for Christians and Jews, then the fez for nearly everyone
  // after Mahmud II's reform of 1829. Above the European hat kits, which
  // otherwise put tricornes and bowlers on Salonica.
  {
    id: "ottoman-men-muslim",
    label: "Ottoman towns · the turban",
    scope: { years: [1450, 1829], bounds: [18, 35, 45, 46], communities: ["ottoman-muslim"] },
    priority: 1.4,
    headwear: [{ value: "turban", weight: 8, sex: ["male"] }, { value: "cap", weight: 2, sex: ["male"] }],
  },
  {
    id: "ottoman-dhimmi",
    label: "Ottoman Christians and Jews · cap, turban and kerchief",
    scope: { years: [1450, 1829], bounds: [18, 35, 45, 46], communities: ["ottoman-christian", "ottoman-jewish"] },
    priority: 1.4,
    headwear: [{ value: "cap", weight: 5, sex: ["male"] }, { value: "turban", weight: 3, sex: ["male"] },
      { value: "headscarf", weight: 6, sex: ["female"] }, { value: "none", weight: 2, sex: ["female"] }],
  },
  {
    id: "ottoman-fez",
    label: "Ottoman towns · the fez",
    scope: { years: [1829, 1923], bounds: [18, 35, 45, 46], communities: ["ottoman-muslim", "ottoman-christian", "ottoman-jewish"] },
    priority: 1.4,
    headwear: [{ value: "fez", weight: 8, sex: ["male"] }, { value: "turban", weight: 1, sex: ["male"] },
      { value: "headscarf", weight: 5, sex: ["female"] }, { value: "none", weight: 3, sex: ["female"] }],
  },
  ...streetWraps([
    // Qajar street dress paired the wrap with a separate white openwork face veil.
    { id: "iran-chador", label: "Iran · chador and ruband", years: [1500, 1926], bounds: [44, 25, 63.5, 39.8], except: [[53, 37.3, 63.5, 39.8]], colors: ["#24222a", "#24222a", "#2c3550"], masks: [["ruband", 3], ["none", 2]] },
    ...([[1926, 1936], [1941, 10001]] as [number, number][]).map(years => ({
      id: `iran-open-chador-${years[0]}`, label: "Iran · open-faced chador", years, bounds: [44, 25, 63.5, 39.8] as Wrap["bounds"],
      except: [[53, 37.3, 63.5, 39.8]] as Wrap["except"], colors: ["#24222a", "#302e36"], masks: [["none", 1]] as Wrap["masks"],
    })),
    // The Ottoman ferace, a long coat in a colour, with the white yaşmak below the eyes.
    // North of 35° the Ottoman population draws each person's faith, and
    // Christian and Jewish women there did not take the yaşmak or the çarşaf.
    { id: "ottoman-ferace", label: "Ottoman towns · the ferace and yaşmak", years: [1500, 1880], bounds: [18, 35, 45, 46], communities: ["ottoman-muslim"], colors: ["#3b4a62", "#5a3a5e", "#3e5a3a", "#5a4030"], masks: [["yashmak", 5], ["none", 1]] },
    { id: "ottoman-ferace-levant", label: "Ottoman Levant · the ferace and yaşmak", years: [1500, 1880], bounds: [20, 29.5, 45, 35], colors: ["#3b4a62", "#5a3a5e", "#3e5a3a", "#5a4030"], masks: [["yashmak", 5], ["none", 1]] },
    // From the 1880s the black çarşaf and the peçe over the face.
    { id: "ottoman-carsaf", label: "Ottoman towns · the çarşaf", years: [1880, 1925], bounds: [18, 35, 45, 46], communities: ["ottoman-muslim"], colors: ["#24222a"], masks: [["niqab", 3], ["none", 2]] },
    { id: "ottoman-carsaf-levant", label: "Ottoman Levant · the çarşaf", years: [1880, 1925], bounds: [20, 29.5, 45, 35], colors: ["#24222a"], masks: [["niqab", 3], ["none", 2]] },
    // Cairo and the Hijaz: the black habara and the long burqu' from the nose to the chest.
    // Not Christian Ethiopia, nor Sudan, where women wore the tobe.
    { id: "egypt-habara", label: "Egypt and Arabia · the habara and burqu'", years: [1500, 1925], bounds: [24, 12, 45, 31.5], except: [[35, 6, 43, 16.5], [24, 12, 36.5, 18]], colors: ["#24222a", "#24222a", "#3a2e3e"], masks: [["niqab", 5], ["none", 1]] },
    // The white wool haik, drawn across the face to leave one eye.
    { id: "maghreb-haik", label: "The Maghreb · the haik", years: [900, 1492], bounds: [-10, 27, 11.5, 37.5], colors: ["#ebe3cc"], masks: [["haik", 4], ["yashmak", 2], ["none", 1]] },
    // After Granada the box's northern strip is Christian Andalusia.
    { id: "maghreb-haik-after-granada", label: "The Maghreb · the haik", years: [1492, 1960], bounds: [-10, 27, 11.5, 37.5], except: [[-10, 36.2, -1, 37.5]], colors: ["#ebe3cc"], masks: [["haik", 4], ["yashmak", 2], ["none", 1]] },
    // The pleated burqa with its grille, Kabul to Peshawar.
    { id: "afghan-burqa", label: "Afghanistan · the burqa", years: [1800, 10001], bounds: [60, 29, 72, 38.5], colors: ["#4a6a9a", "#ebe3cc", "#7a6a4a"], masks: [["grille", 1]] },
  ]),
];
