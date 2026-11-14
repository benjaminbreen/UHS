import type { CultureId } from "../../../history/types";
import type { hairOrnaments, hatTrims } from "../../../../core/character";
import type { GarmentKit, Option } from "../types";

/**
 * What was worn in the hair and on the hat. Ornament in the hair is mostly
 * women's, so most of these kits say nothing to men and leave them to fall
 * through to none. A hat trim only shows on a hat that can carry it; the
 * renderer ignores it on a hood or a bare head.
 */
type Ornament = (typeof hairOrnaments)[number];
type Trim = (typeof hatTrims)[number];

const women = (options: readonly [Ornament, number][]): readonly Option<Ornament>[] =>
  options.map(([value, weight]) => ({ value, weight, sex: ["female" as const] }));

const hair = (id: string, label: string, cultures: CultureId[], years: [number, number], options: readonly Option<Ornament>[], bounds?: [number, number, number, number]): GarmentKit => ({
  id: `hair-${id}`,
  label,
  scope: { years, cultures, ...(bounds && { bounds }) },
  hairOrnament: options,
});
const hat = (id: string, label: string, years: [number, number], options: readonly Option<Trim>[], cultures?: CultureId[]): GarmentKit => ({
  id: `hat-${id}`,
  label,
  scope: { years, ...(cultures && { cultures }) },
  hatTrim: options,
});

export const headdress: readonly GarmentKit[] = [
  // Kanzashi and the lacquered kushi comb through the Edo hairstyles.
  hair("japan", "Japan · kanzashi and combs", ["east-asian"], [1600, 1900], women([["pins", 3], ["comb", 3], ["none", 2]]), [128, 30, 146, 46]),
  // Hairpins (zan, binyeo) held every married woman's knot.
  hair("east-asia", "East Asia · hairpins", ["east-asian"], [-1000, 1912], women([["pins", 4], ["flower", 1], ["none", 3]])),
  // The crespine and caul: a net of gold thread or silk over gathered hair.
  hair("europe-caul", "Europe · the hair net", ["european"], [1250, 1550], [
    { value: "net", sex: ["female"], means: ["wealthy"], weight: 3 },
    { value: "net", sex: ["female"], means: ["common"], weight: 1 },
    { value: "none", sex: ["female"], weight: 3 },
  ]),
  hair("europe-ribbon", "Europe · ribbons and combs", ["european"], [1600, 1920], women([["ribbon", 2], ["comb", 1], ["none", 4]])),
  // Jasmine strung in the braid (gajra), and ornamental pins.
  hair("south-asia", "South Asia · flowers in the braid", ["south-asian"], [-1000, 3000], women([["flower", 3], ["pins", 1], ["none", 2]])),
  hair("se-asia", "Southeast Asia · flowers and knot pins", ["southeast-asian"], [-500, 3000], women([["flower", 3], ["pins", 2], ["none", 2]])),
  hair("pacific", "Pacific · a flower behind the ear", ["australian-pacific"], [-1000, 3000], [
    { value: "flower", sex: ["female"], weight: 3 },
    { value: "none", sex: ["female"], weight: 2 },
    { value: "flower", sex: ["male"], weight: 1 },
    { value: "none", sex: ["male"], weight: 4 },
  ]),
  // Carved combs in Akan and Yoruba coiffure.
  hair("west-africa", "West Africa · carved combs", ["west-central-african"], [-500, 3000], women([["comb", 2], ["pins", 1], ["none", 3]])),
  // Braids tied off with wool or ribbon.
  hair("andes", "Andes · ties in the braids", ["andean"], [-1000, 3000], women([["ribbon", 3], ["none", 2]])),
  hair("mesoamerica", "Mesoamerica · cords and ribbons in the braid", ["mesoamerican"], [-1000, 3000], women([["ribbon", 3], ["flower", 1], ["none", 2]])),

  // Ostrich plumes on the broad hats of the late Renaissance and the cavaliers.
  hat("europe-plume", "Europe · plumed hats", [1550, 1700], [
    { value: "feather", means: ["wealthy"], weight: 4 },
    { value: "feather", means: ["common"], weight: 1 },
    { value: "none", weight: 3 },
  ], ["european"]),
  hat("europe-cockade", "Europe · cockades", [1700, 1820], [
    { value: "cockade", sex: ["male"], weight: 1 },
    { value: "feather", means: ["wealthy"], weight: 1 },
    { value: "none", weight: 4 },
  ], ["european"]),
  // Grosgrain bands on boaters, bowlers and bonnets.
  hat("hatband", "Ribbon hatbands", [1840, 1960], [
    { value: "ribbon", weight: 2 },
    { value: "none", weight: 2 },
  ]),
  // An eagle-owl feather on the cap, against the evil eye.
  hat("steppe", "Steppe · the owl feather", [-500, 3000], [
    { value: "feather", weight: 1 },
    { value: "none", weight: 3 },
  ], ["inner-eurasian"]),
  hat("americas", "Feathers in the band", [-1000, 1900], [
    { value: "feather", weight: 2 },
    { value: "none", weight: 3 },
  ], ["other-indigenous-american"]),
  ...(["mesoamerican", "andean"] as const).map((culture) =>
    hat(`${culture}-plume`, "Feathers for rank", [-1000, 1600], [
      { value: "feather", means: ["wealthy"], weight: 2 },
      { value: "none", weight: 3 },
    ], [culture]),
  ),
];

const F = ["female"] as const, M = ["male"] as const, GROWN = ["youth", "adult", "elder"] as const;
const JAPAN = [128, 30, 146, 46] as const, MED = [-10, 29, 42, 48] as const;

/** How the hair was done and the beard kept, by period and place, and what
 * the young and the old wore that others did not. */
export const hairdos: readonly GarmentKit[] = [
  { id: "cut-classical", label: "Greece and Rome · hair up in a knot", scope: { years: [-700, 450], bounds: MED },
    hairdress: [{ value: "bun", sex: F, ages: GROWN }] },
  // Roman men shaved until Hadrian wore a beard in 117.
  { id: "shave-rome", label: "Rome · shaved", scope: { years: [-300, 117], bounds: MED }, shave: [{ value: "clean", sex: M }] },
  { id: "shave-hadrian", label: "Rome · the beard after Hadrian", scope: { years: [117, 300], bounds: MED },
    shave: [{ value: "full", weight: 1, sex: M }, { value: "none", weight: 1, sex: M }] },
  // A married woman put her hair up; a girl wore it down or braided.
  { id: "cut-china", label: "China · the married woman's knot", scope: { years: [-1000, 1950], cultures: ["east-asian"], bounds: [73, 18, 124.5, 54] },
    hairdress: [{ value: "bun", sex: F, ages: ["adult", "elder"] }] },
  { id: "cut-korea", label: "Joseon · the married woman's chignon", scope: { years: [1392, 1910], bounds: [124.5, 33, 131, 43.5] },
    hairdress: [{ value: "bun", sex: F, ages: ["adult", "elder"] }] },
  { id: "cut-heian", label: "Heian · hair to the floor", scope: { years: [794, 1185], bounds: JAPAN },
    hairdress: [{ value: "heian", sex: F, ages: GROWN, means: ["wealthy"] }], hairOrnament: [{ value: "none", sex: F, means: ["wealthy"] }] },
  { id: "cut-shimada", label: "Edo · the shimada", scope: { years: [1650, 1880], bounds: JAPAN },
    hairdress: [{ value: "shimada", sex: F, ages: ["youth", "adult"] }, { value: "bun", sex: F, ages: ["elder"] }] },
  // Fulani women only, among the many peoples of the Sahel.
  { id: "cut-fulani", label: "Sahel · the Fulani crest", scope: { years: [1000, 3000], cultures: ["west-central-african"], bounds: [-17, 9, 16, 17] },
    hairdress: [{ value: "crest", sex: F, share: 0.3 }] },
  { id: "cut-victorian", label: "Europe · hair up, parted in the middle", scope: { years: [1830, 1915], cultures: ["european"] },
    hairdress: [{ value: "bun", sex: F, ages: ["adult", "elder"] }] },
  { id: "cut-bob", label: "The bob", scope: { years: [1922, 1940], cultures: ["european"] },
    hairdress: [{ value: "bob", weight: 3, sex: F, ages: ["youth", "adult"] }, { value: "none", weight: 2, sex: F }] },
  { id: "cut-beehive", label: "The beehive", scope: { years: [1959, 1968], cultures: ["european"] },
    hairdress: [{ value: "beehive", weight: 1, sex: F, ages: ["youth", "adult"] }, { value: "bob", weight: 1, sex: F }, { value: "none", weight: 3, sex: F }] },
  { id: "cut-pouf", label: "The pouf", scope: { years: [1770, 1790], cultures: ["european"] },
    hairdress: [{ value: "pouf", sex: F, ages: ["youth", "adult"], means: ["wealthy"] }] },
  { id: "cut-queue", label: "Europe · the queue and powder", scope: { years: [1700, 1800], cultures: ["european"] },
    hairdress: [{ value: "powdered", weight: 4, sex: M, ages: GROWN, means: ["wealthy"] }, { value: "tied", weight: 3, sex: M, ages: GROWN }] },
  { id: "shave-europe-18c", label: "Europe · shaved", scope: { years: [1690, 1840], cultures: ["european"] }, shave: [{ value: "clean", sex: M }] },
  // From the Crimean War to about 1900.
  { id: "shave-europe-19c", label: "Europe · the full beard", scope: { years: [1855, 1905], cultures: ["european"] },
    shave: [{ value: "full", weight: 2, sex: M, ages: ["adult", "elder"] }, { value: "none", weight: 2, sex: M }] },
  { id: "shave-europe-20c", label: "Europe · shaved", scope: { years: [1920, 1970], cultures: ["european"] },
    shave: [{ value: "clean", weight: 3, sex: M }, { value: "none", weight: 1, sex: M }] },
  { id: "shave-edo", label: "Edo · shaved", scope: { years: [1600, 1872], bounds: JAPAN }, shave: [{ value: "clean", sex: M }] },
  // Boys wore petticoats until breeched at six or so.
  { id: "child-breeching", label: "Europe · boys in skirts", scope: { years: [1550, 1900], cultures: ["european"] }, priority: 1,
    garment: [{ value: "dress", sex: M, under: 6 }] },
  { id: "child-tufts", label: "China and Japan · the child's shaved head", scope: { years: [-500, 1912], cultures: ["east-asian"], bounds: [73, 18, 146, 54], except: [[124.5, 33, 131, 43.5]] },
    hairdress: [{ value: "tufts", ages: ["child"], under: 10, share: 0.7 }] },
  { id: "elder-widow", label: "Europe · the widow's black", scope: { years: [1500, 1960], cultures: ["european"] }, priority: 1,
    dye: [{ value: "soot", sex: F, ages: ["elder"], share: 0.45 }] },
  { id: "elder-widow-south", label: "Southern Europe · the widow's black", scope: { years: [1960, 2000], cultures: ["european"], bounds: [-10, 35, 30, 45] }, priority: 1,
    dye: [{ value: "soot", sex: F, ages: ["elder"], share: 0.45 }] },
  { id: "elder-shawl", label: "Old women's shawls", scope: { years: [1000, 3000], cultures: ["european", "north-african-west-asian", "south-asian", "mesoamerican", "andean"] },
    shawl: [{ value: "plain", weight: 2, sex: F, ages: ["elder"], share: 0.6 }, { value: "fringed", weight: 1, sex: F, ages: ["elder"], share: 0.6 }] },
];
