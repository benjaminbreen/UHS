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
