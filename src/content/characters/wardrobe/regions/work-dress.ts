import type { GarmentKit, Option } from "../types";

/**
 * What people wore over their clothes and at their hips: the trade's apron,
 * the purse and the satchel, bangles, and the neckwear that dates a European
 * street to within a generation. These slots are keyed on livelihood and
 * means more than on region, so most kits here are global and only a few are
 * cultural. A kit that names a slot must offer something to everyone it
 * offers anything to, or it shadows the global kit below it.
 */

// Sparks, hot metal, lye and stone: leather. Smiths' aprons are on Greek
// vases and Roman tomb reliefs, and in every forge after.
const leatherTrades = [
  "smith", "blacksmith", "armourer", "ironworker", "toolmaker", "tanner", "hide-worker", "leatherworker",
  "cobbler", "saddler", "mason", "stonemason", "cooper", "wheelwright", "boilermaker", "welder", "glazier",
  "lime-burner", "quarryman", "bronze-caster", "jeweller", "shipwright", "sugar-boiler",
];
// Flour, food, dye and the shop counter: linen or canvas.
export const clothTrades = [
  "baker", "cook", "brewer", "alewife", "butcher", "confectioner", "innkeeper", "publican", "dairymaid",
  "milkmaid", "domestic-servant", "housemaid", "servant", "charwoman", "scullion", "kitchen-porter", "laundress",
  "washerwoman", "laundry-worker", "shopkeeper", "grocer", "market-seller", "potter", "dyer", "fuller",
  "seamstress", "tailor", "dressmaker", "milliner", "candle-maker", "soap-boiler", "waiter", "oil-presser",
  "miller", "printer", "barber", "hairdresser", "carpenter", "cabinetmaker", "weaver", "spinner",
  "wool-comber", "nurse", "hospital-orderly", "pharmacist", "midwife", "garment-worker",
];
const purseTrades = [
  "trader", "chapman", "pedlar", "hawker", "street-hawker", "costermonger", "market-seller", "shopkeeper",
  "grocer", "money-changer", "tax-collector", "toll-keeper", "innkeeper", "publican", "guild-master",
  "street-vendor", "merchant", "moneylender", "shipowner", "comprador",
];
// Papers, tools of a calling, and the road.
const satchelTrades = [
  "scribe", "clerk", "bank-clerk", "schoolteacher", "healer", "herbalist", "midwife", "postman", "traveler",
  "religious-specialist", "storyteller", "pharmacist", "musician", "notary", "journalist", "courier",
];
export const kerchiefTrades = [
  "sailor", "boatman", "dock-worker", "dock-labourer", "navvy", "railway-labourer", "miner", "coal-miner",
  "farm-hand", "farm-labourer", "agricultural-labourer", "ranch-hand", "cattle-hand", "drover", "carter",
  "cabman", "porter", "factory-hand", "mill-worker", "construction-labourer", "ploughman",
  "rickshaw-puller", "oil-worker", "rubber-tapper", "indentured-labourer", "caravaneer",
];

export const tradeAprons: readonly Option<"none" | "cloth" | "leather">[] = [
  { value: "leather", livelihoods: leatherTrades, weight: 4 },
  { value: "none", livelihoods: leatherTrades, weight: 1 },
  { value: "cloth", livelihoods: clothTrades, weight: 3 },
  { value: "none", livelihoods: clothTrades, weight: 1 },
];
const tradeBags: readonly Option<"none" | "purse" | "satchel">[] = [
  { value: "purse", livelihoods: purseTrades, weight: 3 },
  { value: "none", livelihoods: purseTrades, weight: 2 },
  { value: "satchel", livelihoods: satchelTrades, weight: 3 },
  { value: "none", livelihoods: satchelTrades, weight: 2 },
];

export const workDress: readonly GarmentKit[] = [
  {
    // The old and the herders walk with a stick everywhere and in every era;
    // at street distance it is one of the few things that changes the outline.
    id: "staff",
    label: "A walking stick",
    scope: { years: [-100000, 10001] },
    accessory: [
      { value: "walking-cane", weight: 2, ages: ["elder"] },
      { value: "walking-cane", weight: 3, livelihoods: ["herder"] },
      { value: "none", weight: 6 },
    ],
  },
  {
    id: "work-ancient-on",
    label: "Aprons at work, purses and satchels",
    scope: { years: [-800, 3000] },
    apron: tradeAprons,
    bag: [
      ...tradeBags,
      { value: "purse", means: ["wealthy"], weight: 1 },
      { value: "none", means: ["wealthy"], weight: 3 },
    ],
  },
  {
    id: "work-kerchief",
    label: "Working neckerchiefs",
    // Printed cotton made the neckerchief cheap everywhere sailors and
    // labourers went, from the mid-eighteenth century to the mid-twentieth.
    scope: { years: [1750, 1950] },
    neckwear: [
      { value: "neckerchief", livelihoods: kerchiefTrades, weight: 3 },
      { value: "none", livelihoods: kerchiefTrades, weight: 2 },
    ],
  },
  {
    id: "europe-house-apron",
    label: "Europe · the everyday apron",
    // Women of the house and the field wore one over the kirtle or gown from
    // the later Middle Ages until the twentieth century.
    scope: { years: [1300, 1950], cultures: ["european"] },
    apron: [
      ...tradeAprons,
      { value: "cloth", sex: ["female"], means: ["poor", "common"], weight: 2 },
      { value: "none", sex: ["female"], means: ["poor", "common"], weight: 3 },
    ],
  },
  {
    id: "europe-purse",
    label: "Europe · the belt purse",
    // Hung from the girdle until pockets were sewn into breeches and skirts.
    scope: { years: [1000, 1650], cultures: ["european"] },
    bag: [
      ...tradeBags,
      { value: "purse", means: ["common", "wealthy"], weight: 1 },
      { value: "none", means: ["common", "wealthy"], weight: 2 },
    ],
  },
  {
    id: "europe-ruff",
    label: "Europe · the ruff",
    // Starched linen ruffs, from the 1560s to their fade in the 1640s.
    scope: { years: [1560, 1650], cultures: ["european"] },
    neckwear: [
      { value: "ruff", means: ["wealthy"], weight: 4 },
      { value: "none", means: ["wealthy"], weight: 1 },
      { value: "ruff", means: ["common"], weight: 1 },
      { value: "none", means: ["common"], weight: 4 },
    ],
  },
  {
    id: "europe-cravat",
    label: "Europe · the cravat and the fichu",
    // The cravat came in with the 1660s and gave way to the necktie in the
    // 1850s; women covered the neckline with a fichu across the same span.
    scope: { years: [1660, 1850], cultures: ["european"] },
    neckwear: [
      { value: "cravat", sex: ["male"], means: ["wealthy"], weight: 4 },
      { value: "cravat", sex: ["male"], means: ["common"], weight: 1 },
      { value: "none", sex: ["male"], means: ["common", "wealthy"], weight: 2 },
      { value: "neckerchief", sex: ["female"], means: ["poor", "common"], weight: 2 },
      { value: "none", sex: ["female"], means: ["poor", "common"], weight: 2 },
      { value: "neckerchief", livelihoods: kerchiefTrades, weight: 3 },
      { value: "none", livelihoods: kerchiefTrades, weight: 2 },
    ],
  },
  {
    id: "east-asia-inro",
    label: "Japan · the inro at the sash",
    // A tiered case hung from the obi by a netsuke, worn by townsmen and
    // samurai through the Edo period.
    scope: { years: [1600, 1870], cultures: ["east-asian"], bounds: [128, 30, 146, 46] },
    bag: [
      ...tradeBags,
      { value: "purse", sex: ["male"], means: ["common", "wealthy"], weight: 2 },
      { value: "none", sex: ["male"], means: ["common", "wealthy"], weight: 3 },
    ],
  },
  {
    id: "south-asia-bangles",
    label: "South Asia · bangles",
    // From the shell and terracotta bangles of the Indus cities onward, a
    // woman's bare wrist was the exception.
    scope: { years: [-3000, 3000], cultures: ["south-asian"] },
    wrist: [
      { value: "bangles", sex: ["female"], weight: 6 },
      { value: "none", sex: ["female"], weight: 1 },
    ],
  },
  ...(["west-central-african", "east-southern-african", "north-african-west-asian"] as const).map(
    (culture): GarmentKit => ({
      id: `${culture}-bangles`,
      label: "Bracelets of brass, copper, ivory and glass",
      scope: { years: [-2000, 3000], cultures: [culture] },
      wrist: [
        { value: "bangles", sex: ["female"], weight: 2 },
        { value: "none", sex: ["female"], weight: 3 },
      ],
    }),
  ),
  // Carrying on the head, on a ring of cloth: the ordinary way to move water,
  // washing and market goods across Africa, South Asia, Southeast Asia, Egypt
  // and the Levant, Mesoamerica and the Mediterranean.
  ...([
    { id: "head-loads", scope: { years: [-3000, 10001], cultures: ["west-central-african", "east-southern-african", "south-asian", "southeast-asian", "mesoamerican", "north-african-west-asian"] } },
    { id: "head-loads-mediterranean", scope: { years: [-3000, 1960], bounds: [-10, 34, 30, 42.5] } },
  ] as const).map(({ id, scope }): GarmentKit => ({
    id,
    label: "Loads carried on the head",
    scope,
    priority: 1.5,
    headLoad: [
      { value: "jar", weight: 1, livelihoods: ["water-carrier"], sex: ["female"] },
      { value: "bundle", weight: 1, livelihoods: ["laundress", "washerwoman"] },
      { value: "basket", weight: 3, livelihoods: ["street-vendor", "hawker", "pedlar", "milkmaid", "dairymaid", "market-gardener"] },
      { value: "none", weight: 2, livelihoods: ["street-vendor", "hawker", "pedlar", "milkmaid", "dairymaid", "market-gardener"] },
      { value: "jar", weight: 2, sex: ["female"], means: ["poor", "common"], ages: ["youth", "adult"] },
      { value: "basket", weight: 2, sex: ["female"], means: ["poor", "common"], ages: ["youth", "adult"] },
      { value: "bundle", weight: 1, means: ["poor", "common"], ages: ["youth", "adult"] },
      { value: "none", weight: 9, ages: ["youth", "adult", "elder"] },
    ],
  })),
  {
    // Spinning on the walk, distaff under the arm, before the wheel and the mill took it over.
    id: "distaff",
    label: "Spinning with the distaff",
    scope: { years: [-3000, 1850], cultures: ["european", "north-african-west-asian", "inner-eurasian"] },
    priority: 1.5,
    handwork: [
      { value: "distaff", weight: 1, livelihoods: ["spinner"] },
      { value: "distaff", weight: 1, sex: ["female"], means: ["poor", "common"], ages: ["adult", "elder"] },
      { value: "none", weight: 4, sex: ["female"], means: ["poor", "common"], ages: ["adult", "elder"] },
    ],
  },
  {
    // In the Andes the drop spindle never went away.
    id: "distaff-andes",
    label: "The Andes · spinning on the walk",
    scope: { years: [-1500, 10001], cultures: ["andean"] },
    priority: 1.5,
    handwork: [
      { value: "distaff", weight: 1, livelihoods: ["spinner"] },
      { value: "distaff", weight: 2, sex: ["female"], ages: ["youth", "adult", "elder"] },
      { value: "none", weight: 3, sex: ["female"], ages: ["youth", "adult", "elder"] },
    ],
  },
];

const CLERKS = ["clerk", "bank-clerk", "notary"];
/** Dress a trade could be known by across the street. */
export const tradeDress: readonly GarmentKit[] = [
  { id: "trade-butcher", label: "The butcher's striped apron", scope: { years: [1800, 3000], cultures: ["european"] }, priority: 1,
    apron: [{ value: "striped", weight: 3, livelihoods: ["butcher"] }, { value: "cloth", weight: 1, livelihoods: ["butcher"] }] },
  // Flour got into everything; millers and bakers wore pale linen it would not show on.
  { id: "trade-flour", label: "Millers and bakers in white", scope: { years: [-800, 3000] }, priority: 1,
    dye: [{ value: "bleached", weight: 2, livelihoods: ["miller", "baker"] }, { value: "undyed", weight: 1, livelihoods: ["miller", "baker"] }] },
  { id: "trade-flour-cap", label: "The miller's and baker's cap", scope: { years: [1300, 1950], cultures: ["european"] }, priority: 1,
    headwear: [{ value: "cap", livelihoods: ["miller", "baker"] }] },
  // At the desk in shirtsleeves and waistcoat, the coat on its peg.
  { id: "trade-clerk", label: "The clerk's sleeve guards", scope: { years: [1850, 1960] }, priority: 1,
    garment: [{ value: "shirt", livelihoods: CLERKS, share: 0.6 }],
    waistcoat: [{ value: "plain", livelihoods: CLERKS, share: 0.6 }],
    wrist: [{ value: "sleeve-guards", livelihoods: CLERKS, share: 0.6 }] },
  // Fisherwomen carried the catch to market in a creel on the back.
  { id: "trade-creel", label: "The fishwife's creel", scope: { years: [1500, 1960], cultures: ["european"] }, priority: 1,
    bag: [{ value: "creel", weight: 3, livelihoods: ["fisher"], sex: ["female"] }, { value: "none", weight: 1, livelihoods: ["fisher"], sex: ["female"] }] },
];

/** Shoes particular to a region, over whatever the regional kit offers. */
export const regionalShoes: readonly GarmentKit[] = [
  { id: "shoes-clogs", label: "Clogs", scope: { years: [1300, 1940], cultures: ["european"], bounds: [0.5, 46, 12, 55] }, priority: 0.8,
    footwear: [{ value: "clogs", means: ["poor", "common"], share: 0.5 }] },
  // The mill towns of Lancashire and Yorkshire.
  { id: "shoes-clogs-north", label: "Northern England · clogs", scope: { years: [1750, 1940], cultures: ["european"], bounds: [-3.5, 53, -1, 54.5] }, priority: 0.8,
    footwear: [{ value: "clogs", means: ["poor", "common"], share: 0.5 }] },
  { id: "shoes-geta", label: "Japan · geta", scope: { years: [700, 1950], bounds: [128, 30, 146, 46] }, priority: 0.8,
    footwear: [{ value: "geta", share: 0.6 }] },
  { id: "shoes-moccasins", label: "North America · moccasins", scope: { years: [-3000, 1950], cultures: ["other-indigenous-american"], bounds: [-170, 25, -50, 72] }, priority: 0.8,
    footwear: [{ value: "moccasins" }] },
  { id: "shoes-ottoman", label: "Ottoman and Persian slippers", scope: { years: [1300, 1930], cultures: ["north-african-west-asian", "inner-eurasian"], bounds: [-10, 25, 65, 45] }, priority: 0.8,
    footwear: [{ value: "slippers", means: ["common", "wealthy"], share: 0.5 }] },
  { id: "shoes-jutti", label: "South Asia · juttis and paduka", scope: { years: [-500, 3000], cultures: ["south-asian"] }, priority: 0.8,
    footwear: [{ value: "paduka", roles: ["cleric"] }, { value: "paduka", share: 0.08 }] },
  { id: "shoes-mughal", label: "Mughal India · the jutti", scope: { years: [1500, 3000], cultures: ["south-asian"] }, priority: 0.9,
    footwear: [{ value: "slippers", means: ["common", "wealthy"], share: 0.4 }] },
];

export type InfantCarry = "back" | "board" | "hip" | "arms" | "pram";
const CARRY: Record<string, InfantCarry> = {
  "west-central-african": "back", "east-southern-african": "back", "east-asian": "back", "southeast-asian": "back",
  mesoamerican: "back", andean: "back",
  "other-indigenous-american": "board", "inner-eurasian": "board",
  "south-asian": "hip", "australian-pacific": "hip",
  european: "arms", "north-african-west-asian": "arms",
};
/** How a baby went about with whoever had it. Tied on the back in a cloth:
 * the West African wrapper, the Japanese onbu and Korean podaegi, the Andean
 * lliclla, the Mesoamerican rebozo. Laced to a cradleboard carried on the
 * back across North America and the northern steppe and forest. Astride the
 * hip in South Asia and the Pacific. Swaddled and carried in the arms or a
 * shawl in Europe and West Asia, where the cradle stayed at home. Boards went
 * out of use in the twentieth century. The pram came in from Britain in the
 * 1850s and was ordinary in European and settler towns by the 1880s, and in
 * East Asian cities a century later. */
export function infantCarry(culture: string | undefined, year = 0): InfantCarry | undefined {
  const carry = CARRY[culture ?? ""];
  if (year >= 1880 && (culture === "european" || culture === "australian-pacific")) return "pram";
  if (year >= 1920 && carry === "board") return culture === "other-indigenous-american" ? "pram" : "arms";
  if (year >= 1970 && culture === "east-asian") return "pram";
  return carry;
}
