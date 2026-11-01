import type { Accessory, GarmentKit, Option } from "../types";

/**
 * Who you would know on a street by their dress and what they carry: clergy,
 * officials, water-sellers and porters, lamplighters and sweeps, musicians.
 * Each option is keyed on livelihoods, so a kit dresses only those trades and
 * falls through for everyone else. Priority 2: over regional dress, under the
 * guards.
 *
 * Attested in the main (the friar's cord and hood, the imam's white turban,
 * the Theravada monk's saffron and alms bowl, the Chinese official's winged
 * gauze cap, the Ottoman water-seller, the shoulder pole from Bengal to Edo,
 * the lamplighter's pole); weights and colours are art direction.
 */

const CLERGY = ["religious-specialist"];
const OFFICIALS = ["scribe", "tax-collector", "toll-keeper", "clerk", "money-changer"];
const WATER = ["water-carrier"];
const NIGHT_SOIL = ["night-soil-collector"];
const PORTERS = ["porter"];
const MUSIC = ["musician", "storyteller"];

// Children take their parents' trade as a label; the gear is for grown hands.
const on = (livelihoods: string[]) => <T>(value: T, weight = 1): Option<T> => ({ value, weight, livelihoods, ages: ["adult", "elder"] });
const clergy = on(CLERGY), official = on(OFFICIALS), water = on(WATER), soil = on(NIGHT_SOIL), porter = on(PORTERS), music = on(MUSIC);

type Kit = Omit<GarmentKit, "id" | "label" | "scope" | "priority">;
const kit = (id: string, label: string, scope: GarmentKit["scope"], parts: Kit): GarmentKit => ({
  id: `street-${id}`, label, scope, priority: 2, ...parts,
});
const held = (f: typeof clergy, ...xs: [Accessory, number][]) => xs.map(([v, w]) => f(v, w));

export const street: readonly GarmentKit[] = [
  // ---- clergy
  kit("clergy-latin", "Monk, friar and priest: the habit, the cord, the beads", { years: [500, 1900], cultures: ["european"] }, {
    garment: [clergy("robe")], dye: [clergy("walnut", 3), clergy("soot", 3), clergy("greige", 2)],
    belt: [clergy("cord")], hood: [clergy("down", 3), clergy("none", 1)], headwear: [clergy("none")],
    accessory: held(clergy, ["beads", 4], ["censer", 1], ["none", 1]),
  }),
  kit("clergy-islamic", "Imam and scholar: white turban, robe, prayer beads", { years: [650, 1950], cultures: ["north-african-west-asian", "inner-eurasian"] }, {
    garment: [clergy("open-robe", 2), clergy("robe", 2)], dye: [clergy("bleached", 3), clergy("greige", 1)],
    headwear: [clergy("turban")], accessory: held(clergy, ["beads", 3], ["ledger", 1]),
  }),
  { ...kit("clergy-imam", "Imam and qazi east of Persia", { years: [700, 1950], cultures: ["south-asian", "southeast-asian", "east-asian"] }, {
    garment: [{ value: "open-robe", weight: 1, roles: ["imam"] }], dye: [{ value: "bleached", weight: 1, roles: ["imam"] }],
    headwear: [{ value: "turban", weight: 1, roles: ["imam"] }], accessory: [{ value: "beads", weight: 1, roles: ["imam"] }],
  }), priority: 3 },
  kit("clergy-theravada", "The saffron robe and the alms bowl", { years: [-250, 1950], cultures: ["southeast-asian"] }, {
    garment: [clergy("wrap")], dye: [clergy("saffron", 3), clergy("turmeric", 2)],
    headwear: [clergy("none")], footwear: [clergy("none")], accessory: held(clergy, ["alms-bowl", 4], ["beads", 1]),
  }),
  kit("clergy-east-asia", "Buddhist monk: grey robe, begging bowl, a wide hat on the road", { years: [300, 1950], cultures: ["east-asian"] }, {
    garment: [clergy("robe")], dye: [clergy("ash", 3), clergy("soot", 2), clergy("ochre", 1)],
    headwear: [clergy("none", 3), clergy("conical", 1)], footwear: [clergy("sandals")],
    accessory: held(clergy, ["alms-bowl", 3], ["beads", 2]),
  }),
  kit("clergy-south-asia", "Brahmin and ascetic: the wrap, bare chest, the mala", { years: [-1000, 1950], cultures: ["south-asian"] }, {
    garment: [clergy("none", 3), clergy("wrap", 2)], dye: [clergy("saffron", 2), clergy("bleached", 2)],
    headwear: [clergy("none")], footwear: [clergy("none")], accessory: held(clergy, ["beads", 3], ["alms-bowl", 1]),
  }),
  kit("clergy-tibet", "Maroon robes of the Himalaya", { years: [800, 1950], cultures: ["inner-eurasian"], bounds: [78, 27, 100, 36] }, {
    garment: [clergy("robe")], dye: [clergy("madder")], headwear: [clergy("none")], accessory: held(clergy, ["beads", 3], ["alms-bowl", 1]),
  }),
  kit("clergy-mesoamerica", "Priest: black robe, long hair, the copal burner", { years: [-800, 1530], cultures: ["mesoamerican"] }, {
    garment: [clergy("robe")], dye: [clergy("soot")], headwear: [clergy("none")], accessory: held(clergy, ["censer", 3], ["none", 1]),
  }),

  // ---- officials
  kit("official-china", "The scholar-official: winged gauze cap and the robe of rank", { years: [600, 1650], cultures: ["east-asian"] }, {
    garment: [official("robe")], dye: [official("safflower", 2), official("kariyasu", 2), official("indigo", 2)],
    headwear: [official("official-cap")], footwear: [official("boots")], accessory: held(official, ["ledger", 1]),
  }),
  kit("official-islamic", "Kadi and scribe: the great turban and the register", { years: [700, 1900], cultures: ["north-african-west-asian", "south-asian"] }, {
    garment: [official("open-robe", 2), official("long-tunic", 1)], headwear: [official("turban")], accessory: held(official, ["ledger", 1]),
  }),
  kit("official-europe", "Clerk and collector: the black gown and the book", { years: [1100, 1800], cultures: ["european"] }, {
    garment: [official("robe", 2), official("coat", 1)], dye: [official("soot", 3), official("walnut", 1)],
    headwear: [official("cap", 2), official("flat-cap", 1)], accessory: held(official, ["ledger", 1]),
  }),

  // ---- carriers
  kit("water-west-asia", "The water-seller: a pair of pails, a brass cup", { years: [700, 1930], cultures: ["north-african-west-asian", "south-asian"] }, {
    accessory: held(water, ["water-pole", 1]),
  }),
  kit("water-east-asia", "Shoulder pole and pails", { years: [-500, 1930], cultures: ["east-asian", "southeast-asian"] }, {
    headwear: [water("conical")], accessory: held(water, ["water-pole", 1]),
  }),
  kit("water-europe", "Yoke and pails at the conduit", { years: [1100, 1880], cultures: ["european"] }, {
    accessory: held(water, ["water-pole", 1]),
  }),
  kit("night-soil", "Pails on a pole to the fields", { years: [-500, 1950], cultures: ["east-asian"] }, {
    accessory: held(soil, ["water-pole", 1]),
  }),
  kit("porter-asia", "Baskets on a shoulder pole", { years: [-1000, 1950], cultures: ["east-asian", "southeast-asian", "south-asian"] }, {
    headwear: [porter("conical", 2), porter("wrap", 1)], accessory: held(porter, ["carrying-pole", 1]),
  }),

  // ---- the lit street
  kit("lamplighter", "The lamplighter's pole", { years: [1700, 1930], cultures: ["european"] }, {
    accessory: [{ value: "lamp-pole", weight: 1, livelihoods: ["lamplighter"] }],
  }),
  kit("chimney-sweep", "Brushes and soot", { years: [1600, 1930], cultures: ["european"] }, {
    dye: [{ value: "soot", weight: 1, livelihoods: ["chimney-sweep"] }],
    headwear: [{ value: "cap", weight: 1, livelihoods: ["chimney-sweep"] }],
    accessory: [{ value: "sweep-brush", weight: 1, livelihoods: ["chimney-sweep"] }],
  }),

  // ---- music
  kit("music-europe-west-asia", "Lute, oud, drum", { years: [-500, 1900], cultures: ["european", "north-african-west-asian", "inner-eurasian", "south-asian"] }, {
    accessory: held(music, ["lute", 3], ["drum", 1], ["flute", 1]),
  }),
  kit("music-east-asia", "Pipa, biwa, the bamboo flute", { years: [-500, 1900], cultures: ["east-asian", "southeast-asian"] }, {
    accessory: held(music, ["lute", 2], ["flute", 2], ["drum", 1]),
  }),
  kit("music-africa", "The kora and the talking drum", { years: [-500, 1950], cultures: ["west-central-african", "east-southern-african"] }, {
    accessory: held(music, ["drum", 3], ["lute", 2]),
  }),
  kit("music-americas", "Drum and flute", { years: [-3000, 1600], cultures: ["mesoamerican", "andean", "other-indigenous-american"] }, {
    accessory: held(music, ["drum", 2], ["flute", 3]),
  }),
];
