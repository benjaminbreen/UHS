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
const OFFICIALS = ["scribe", "tax-collector", "toll-keeper", "clerk", "notary"];
const DOCTORS = ["physician"];
const MONEY = ["money-changer", "moneylender", "jeweller", "broker", "banker"];
const DESKS = ["office-worker", "civil-servant", "notary", "banker", "broker", "clerk", "bank-clerk", "journalist", "engineer", "comprador", "shipowner", "merchant"];
const WOMEN_AT_DESKS = ["typist", "telephone-operator"];
const WATER = ["water-carrier"];
const NIGHT_SOIL = ["night-soil-collector"];
const PORTERS = ["porter"];
const MUSIC = ["musician", "storyteller", "griot", "entertainer"];

// Children take their parents' trade as a label; the gear is for grown hands.
const on = (livelihoods: string[]) => <T>(value: T, weight = 1): Option<T> => ({ value, weight, livelihoods, ages: ["adult", "elder"] });
const doctor = on(DOCTORS), money = on(MONEY), desk = on(DESKS), typist = on(WOMEN_AT_DESKS);
const clergy = on(CLERGY), official = on(OFFICIALS), water = on(WATER), soil = on(NIGHT_SOIL), porter = on(PORTERS), music = on(MUSIC);

type Kit = Omit<GarmentKit, "id" | "label" | "scope" | "priority">;
const kit = (id: string, label: string, scope: GarmentKit["scope"], parts: Kit): GarmentKit => ({
  id: `street-${id}`, label, scope, priority: 2, ...parts,
});
const held = (f: typeof clergy, ...xs: [Accessory, number][]) => xs.map(([v, w]) => f(v, w));

// Clergy by the office the role names: an Orthodox priest, deacon, monk or bishop.
const as = (...roles: string[]) => <T>(value: T, weight = 1): Option<T> => ({ value, weight, livelihoods: CLERGY, ages: ["adult", "elder"], roles });
const cleric = as("cleric"), deacon = as("deacon"), bishop = as("bishop"), monastic = as("monastic");
type Box = readonly [number, number, number, number];
// Greece and the Balkans, Romania, Rus, Belarus, the Caucasus, the Levant, Egypt and Nubia.
const ORTHODOX: Box[] = [
  [19.5, 34, 45, 45.5], [24.5, 43.5, 30, 48.5], [28.5, 44, 60, 70], [24.5, 48.5, 28.5, 54],
  [41.4, 38.5, 46, 43.6], [34, 29, 44, 37.5], [24, 12, 36, 31.7],
];
const orthodox: GarmentKit[] = ORTHODOX.flatMap((bounds, i) => [
  kit(`clergy-orthodox-${i}`, "Orthodox priest: black cassock, soft cap, the censer", { years: [330, 1950], bounds }, {
    garment: [cleric("robe")], dye: [cleric("soot", 4), cleric("walnut", 1)], belt: [cleric("sash")],
    headwear: [cleric("cap")], accessory: [cleric("censer", 2), cleric("beads", 2), cleric("none", 1)],
  }),
  // The tall kamilavka hat is post-Byzantine.
  kit(`clergy-orthodox-late-${i}`, "Orthodox priest's kamilavka", { years: [1600, 1950], bounds }, { headwear: [cleric("fez")] }),
  { ...kit(`clergy-orthodox-office-${i}`, "Monk's veil, deacon's vestment, bishop's staff and panagia", { years: [330, 1950], bounds }, {
    headwear: [monastic("veil"), bishop("veil"), deacon("none")],
    dye: [deacon("goldthread", 1), deacon("bleached", 1)],
    accessory: [bishop("walking-cane"), deacon("censer"), monastic("beads")],
    neck: [bishop("chain")],
  }), priority: 3 },
]);

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
  ...orthodox,
  kit("clergy-ethiopia", "Ethiopian priest: white shamma, turban, prayer staff", { years: [330, 1950], bounds: [35.5, 6, 43, 16.5] }, {
    garment: [cleric("robe")], dye: [cleric("bleached")], over: [cleric("mantle")], headwear: [cleric("turban")],
    accessory: [cleric("walking-cane", 2), cleric("censer", 1)],
  }),
  { ...kit("clergy-ethiopia-office", "Ethiopian monk's yellow and the bare-headed deacon", { years: [330, 1950], bounds: [35.5, 6, 43, 16.5] }, {
    dye: [monastic("turmeric", 2), monastic("ochre", 1)], headwear: [monastic("cap"), deacon("none")],
  }), priority: 3 },
  kit("clergy-pharaonic", "Egyptian priest: shaven head, white linen, the censer", { years: [-3000, -332], bounds: [24, 15, 36, 32] }, {
    garment: [clergy("long-tunic")], dye: [clergy("bleached")], headwear: [clergy("none")], footwear: [clergy("sandals")],
    accessory: held(clergy, ["censer", 2], ["none", 1]),
  }),
  kit("clergy-burma", "Burmese monk: the dark red robe and the alms bowl", { years: [-250, 1950], cultures: ["southeast-asian"], bounds: [92, 9.5, 98.5, 28.5] }, {
    garment: [monastic("wrap")], dye: [monastic("madder", 3), monastic("russet", 1)], headwear: [monastic("none")],
    footwear: [monastic("none")], accessory: [monastic("alms-bowl", 3), monastic("beads", 1)],
  }),
  { ...kit("clergy-faiths-by-office", "Bhikkhu, Jain monk, granthi, mobad and Brahmin by their dress", { years: [-1000, 1950] }, {
    garment: [as("jain")("wrap"), as("granthi")("long-tunic"), as("mobad")("robe"), as("brahmin")("wrap")],
    dye: [as("jain")("bleached"), as("granthi")("bleached", 2), as("granthi")("saffron", 1), as("mobad")("bleached"), as("brahmin")("bleached")],
    headwear: [as("granthi")("turban"), as("mobad")("wrap"), as("jain")("none"), as("brahmin")("none")],
    footwear: [as("jain")("none"), as("brahmin")("none")],
    sidearm: [as("granthi")("dagger")],
    accessory: [as("jain")("alms-bowl"), as("mobad")("censer"), as("granthi")("beads")],
  }), priority: 3 },
  kit("clergy-south-asian-monk", "Bhikkhu: the saffron robe and the bowl", { years: [-500, 1950], cultures: ["south-asian"] }, {
    garment: [monastic("wrap")], dye: [monastic("saffron", 2), monastic("ochre", 2)], footwear: [monastic("none")], accessory: [monastic("alms-bowl")],
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

  // ---- physicians
  kit("doctor-europe", "The physician's black gown and coat", { years: [1300, 1880], cultures: ["european"] }, {
    garment: [doctor("robe", 2), doctor("coat", 2)], dye: [doctor("soot", 4), doctor("walnut", 1)],
    headwear: [doctor("cap", 2), doctor("brimmed", 1)], accessory: held(doctor, ["ledger", 1], ["none", 2]),
  }),
  kit("doctor-victorian", "Frock coat, bowler, the black bag", { years: [1800, 1900], cultures: ["european"] }, {
    garment: [doctor("coat")], dye: [doctor("soot", 4), doctor("walnut", 1)], headwear: [doctor("bowler")],
    neckwear: [doctor("cravat", 2), doctor("necktie", 1)], accessory: held(doctor, ["doctor-bag", 4], ["none", 1]),
  }),
  // Lister's white coat spread from the operating theatre to every doctor by about 1900.
  kit("doctor-modern", "The white coat and the bag", { years: [1890, 10001] }, {
    garment: [doctor("coat")], dye: [doctor("white", 4), doctor("bleached", 2)], headwear: [doctor("none")],
    eyewear: [doctor("glasses", 2), doctor("none", 3)], neckwear: [doctor("necktie", 2), doctor("none", 1)],
    accessory: held(doctor, ["doctor-bag", 4], ["none", 1]),
  }),
  kit("doctor-hakim", "Hakim: the turban, the robe, the scales for drugs", { years: [700, 1950], cultures: ["north-african-west-asian", "south-asian", "inner-eurasian"] }, {
    garment: [doctor("open-robe", 2), doctor("long-tunic", 1)], dye: [doctor("bleached", 2), doctor("greige", 1), doctor("woad", 1)],
    headwear: [doctor("turban")], accessory: held(doctor, ["scales", 2], ["beads", 1], ["none", 1]),
  }),
  kit("doctor-china", "The Chinese doctor's long gown", { years: [-300, 1950], cultures: ["east-asian"] }, {
    garment: [doctor("robe", 2), doctor("long-tunic", 1)], dye: [doctor("indigo", 2), doctor("ash", 2), doctor("soot", 1)],
    headwear: [doctor("cap", 2), doctor("none", 1)], accessory: held(doctor, ["scales", 1], ["none", 2]),
  }),

  // ---- money, deals and desks
  kit("money", "The money changer's scales", { years: [-600, 1900] }, {
    accessory: held(money, ["scales", 4], ["ledger", 1], ["none", 1]),
  }),
  kit("desk-hat", "The office: necktie, a felt hat, the briefcase", { years: [1900, 1960] }, {
    garment: [desk("coat", 3), desk("shirt", 1), typist("dress", 3), typist("shirt", 1)],
    leggings: [desk("trousers")], neckwear: [desk("necktie", 4), desk("bow-tie", 1)],
    headwear: [desk("fedora", 3), desk("bowler", 1), desk("none", 2), typist("cloche", 1), typist("none", 3)],
    accessory: held(desk, ["briefcase", 2], ["ledger", 1], ["none", 3]),
  }),
  kit("desk", "The office: shirt, tie, glasses, the briefcase", { years: [1960, 10001] }, {
    garment: [desk("coat", 2), desk("shirt", 3), typist("dress", 2), typist("shirt", 2)],
    leggings: [desk("trousers")], neckwear: [desk("necktie", 3), desk("none", 2)], headwear: [desk("none"), typist("none")],
    eyewear: [desk("glasses", 2), desk("none", 3)], accessory: held(desk, ["briefcase", 3], ["none", 3]),
  }),
  kit("laboratory", "The lab coat", { years: [1880, 10001] }, {
    garment: [on(["scientist"])("coat")], dye: [on(["scientist"])("white", 3), on(["scientist"])("bleached", 1)],
    eyewear: [on(["scientist", "programmer"])("glasses", 2), on(["scientist", "programmer"])("none", 2)],
  }),

  // ---- estates, oilfields, the road
  kit("overseer", "The overseer: a wide hat, boots, the tally book", { years: [1450, 1960] }, {
    headwear: [on(["overseer"])("brimmed")], footwear: [on(["overseer"])("boots")],
    accessory: held(on(["overseer"]), ["ledger", 2], ["walking-cane", 2], ["none", 1]),
  }),
  kit("overseer-tropics", "The estate manager's pith helmet", { years: [1870, 1960], bounds: [-180, -35, 180, 30] }, {
    headwear: [on(["overseer"])("pith-helmet", 3), on(["overseer"])("brimmed", 1)], dye: [on(["overseer"])("bleached", 2), on(["overseer"])("ochre", 2)],
  }),
  kit("oilfield", "Overalls and the hard hat", { years: [1857, 10001] }, {
    apron: [on(["oil-worker"])("overalls", 3), on(["oil-worker"])("none", 1)], footwear: [on(["oil-worker"])("boots")],
    headwear: [on(["oil-worker"])("helmet", 3), on(["oil-worker"])("flat-cap", 1), on(["oil-worker"])("ball-cap", 1)],
  }),
  kit("tapper", "Rubber tapper: a hat against the dawn and the drip", { years: [1850, 10001] }, {
    garment: [on(["rubber-tapper"])("shirt", 2), on(["rubber-tapper"])("none", 1)],
    headwear: [on(["rubber-tapper"])("brimmed", 2), on(["rubber-tapper"])("conical", 1), on(["rubber-tapper"])("headscarf", 1)],
  }),
  kit("rickshaw", "Rickshaw puller: a hat, a singlet, bare feet or sandals", { years: [1870, 10001] }, {
    garment: [on(["rickshaw-puller"])("shirt", 2), on(["rickshaw-puller"])("none", 1), on(["rickshaw-puller"])("tunic", 1)],
    headwear: [on(["rickshaw-puller"])("conical", 2), on(["rickshaw-puller"])("brimmed", 1), on(["rickshaw-puller"])("wrap", 1), on(["rickshaw-puller"])("none", 1)],
    footwear: [on(["rickshaw-puller"])("sandals", 2), on(["rickshaw-puller"])("none", 2)],
  }),
  kit("rider", "Helmet and a bag across the back", { years: [1980, 10001] }, {
    headwear: [on(["delivery-rider"])("helmet")], footwear: [on(["delivery-rider"])("sneakers")], bag: [on(["delivery-rider", "courier"])("satchel")],
  }),
  kit("courier", "The runner's bag", { years: [-1000, 1980] }, {
    bag: [on(["courier"])("satchel", 3), on(["courier"])("none", 1)], footwear: [on(["courier"])("sandals", 2), on(["courier"])("none", 1)],
  }),
  kit("caravan", "The cameleer's wrapped head and robe", { years: [-1000, 1980] }, {
    garment: [on(["caravaneer"])("robe")], headwear: [on(["caravaneer"])("turban", 3), on(["caravaneer"])("wrap", 2)],
    accessory: held(on(["caravaneer"]), ["walking-cane", 2], ["none", 1]),
  }),

  // ---- the sea
  kit("wayfinder", "The steering paddle", { years: [-1500, 1950], cultures: ["australian-pacific"] }, {
    accessory: held(on(["navigator"]), ["paddle", 3], ["none", 1]),
  }),
  kit("harpooner", "The harpoon and its line", { years: [-3000, 10001] }, {
    accessory: [{ value: "harpoon", weight: 3, roles: ["harpooner"], ages: ["youth", "adult"] }, { value: "none", weight: 1, roles: ["harpooner"] }],
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
  kit("griot", "The griot's robe and the kora", { years: [1200, 10001], cultures: ["west-central-african"] }, {
    garment: [on(["griot"])("open-robe", 3), on(["griot"])("robe", 1)], headwear: [on(["griot"])("cap", 2), on(["griot"])("none", 1)],
    accessory: held(on(["griot"]), ["lute", 3], ["drum", 2]),
  }),
  kit("diviner", "Beads and the tools of reading", { years: [-3000, 10001] }, {
    accessory: held(on(["diviner"]), ["beads", 3], ["censer", 1], ["none", 1]), neck: [on(["diviner"])("beads", 2), on(["diviner"])("none", 1)],
  }),
  kit("courtesan", "The fan, the instrument, the pins in the hair", { years: [-700, 10001] }, {
    accessory: held(on(["courtesan"]), ["fan", 3], ["lute", 2], ["none", 1]),
    hairOrnament: [on(["courtesan"])("pins", 3), on(["courtesan"])("comb", 2), on(["courtesan"])("flower", 2)],
    neck: [on(["courtesan"])("chain", 2), on(["courtesan"])("beads", 1)],
  }),
  kit("music-americas", "Drum and flute", { years: [-3000, 1600], cultures: ["mesoamerican", "andean", "other-indigenous-american"] }, {
    accessory: held(music, ["drum", 2], ["flute", 3]),
  }),
];
