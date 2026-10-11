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
  "lime-burner", "quarryman",
];
// Flour, food, dye and the shop counter: linen or canvas.
const clothTrades = [
  "baker", "cook", "brewer", "alewife", "butcher", "confectioner", "innkeeper", "publican", "dairymaid",
  "milkmaid", "domestic-servant", "housemaid", "servant", "charwoman", "scullion", "kitchen-porter", "laundress",
  "washerwoman", "laundry-worker", "shopkeeper", "grocer", "market-seller", "potter", "dyer", "fuller",
  "seamstress", "tailor", "dressmaker", "milliner", "candle-maker", "soap-boiler", "waiter", "oil-presser",
  "miller", "printer", "barber", "hairdresser", "carpenter", "cabinetmaker", "weaver", "spinner",
  "wool-comber", "nurse", "hospital-orderly", "pharmacist", "midwife",
];
const purseTrades = [
  "trader", "chapman", "pedlar", "hawker", "street-hawker", "costermonger", "market-seller", "shopkeeper",
  "grocer", "money-changer", "tax-collector", "toll-keeper", "innkeeper", "publican", "guild-master",
  "street-vendor",
];
// Papers, tools of a calling, and the road.
const satchelTrades = [
  "scribe", "clerk", "bank-clerk", "schoolteacher", "healer", "herbalist", "midwife", "postman", "traveler",
  "religious-specialist", "storyteller", "pharmacist", "musician",
];
const kerchiefTrades = [
  "sailor", "boatman", "dock-worker", "dock-labourer", "navvy", "railway-labourer", "miner", "coal-miner",
  "farm-hand", "farm-labourer", "agricultural-labourer", "ranch-hand", "cattle-hand", "drover", "carter",
  "cabman", "porter", "factory-hand", "mill-worker", "construction-labourer", "ploughman",
];

const tradeAprons: readonly Option<"none" | "cloth" | "leather">[] = [
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
];
