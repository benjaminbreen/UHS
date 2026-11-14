import type { Box, SewerFind } from "./types";

const LONDON: Box = [-0.6, 51.3, 0.35, 51.7];
const PARIS: Box = [2.1, 48.7, 2.6, 49.0];
const MOSCOW: Box = [37.2, 55.5, 38.0, 56.0];
const BUCHAREST: Box = [25.9, 44.3, 26.3, 44.6];
const WARSAW: Box = [20.8, 52.1, 21.3, 52.4];
const NEW_YORK: Box = [-74.3, 40.45, -73.65, 40.95];
const CHICAGO: Box = [-88.3, 41.6, -87.5, 42.2];
const LAS_VEGAS: Box = [-115.4, 35.9, -114.9, 36.4];
const NOGALES: Box = [-111.05, 31.25, -110.85, 31.4];
const MEXICO_CITY: Box = [-99.4, 19.1, -98.9, 19.7];
const GREATER_TOKYO: Box = [139.3, 35.4, 140.2, 36.1];
const SOUTH_ASIA: Box = [60, 5, 93, 37];
const AUSTRALIA: Box = [112, -44, 154, -10];
const US: Box = [-125, 24, -66, 49.5];
const EUROPE: Box = [-11, 35, 40, 60];
// Where Roman towns stood under later ones: Britain to the Rhine, the Mediterranean, the Levant.
const ROMAN: readonly Box[] = [[-6, 50, 2, 55.5], [-10, 36, 8.5, 51.5], [8.5, 36, 16.5, 48.5], [16.5, 36, 30, 46], [26, 30, 42, 42], [-10, 30, 12, 37.5]];
const OLD_EUROPE: readonly Box[] = [EUROPE];

export const sewerFinds: readonly SewerFind[] = [
  // Caught in the silt and the grates.
  {
    id: "small-change", name: "Coins in the silt", art: "glint", on: "floor", tier: "common", weight: 5,
    verb: "Pick up the coins", time: 10, loot: { coin: [1, 4] },
    text: "Small change washed down through the gratings and settled where the flow slows. Every one a little blackened.",
    look: "Something glints in the mud by the channel.", basis: "inferred",
  },
  {
    id: "lost-ring", name: "Ring", art: "jewel", on: "floor", tier: "notable", weight: 1.5,
    verb: "Pick up the ring", time: 10, loot: { "gold-ring": 1 },
    text: "A wedding ring, gone down a basin plughole with the soap. Somebody hunted for it for a week.",
    look: "A small bright circle caught in a crack.", basis: "inferred",
  },
  {
    id: "lost-watch", name: "Wristwatch", art: "glint", on: "floor", tier: "notable", years: [1920, 2030], weight: 1.2,
    verb: "Pick up the watch", time: 10, loot: { wristwatch: 1 },
    text: "A wristwatch on a snapped strap, stopped at twenty past four.",
    look: "A watch face in the mud.", basis: "inferred",
  },
  {
    id: "lost-wallet", name: "Wallet", art: "purse", on: "floor", tier: "common", weight: 2.5,
    verb: "Open the wallet", time: 20, loot: { wallet: 1, coin: [0, 3] },
    text: "Thrown down a drain after the money was taken out, mostly. The thief missed a few coins in the back.",
    look: "A sodden wallet against the grate.", basis: "inferred",
  },
  {
    id: "lost-keys", name: "Keys", art: "keys", on: "floor", tier: "common", weight: 3,
    verb: "Pick up the keys", time: 5, loot: { "key-ring": 1 },
    text: "Dropped through a grating while somebody fumbled at a car door. They never saw them again.",
    look: "A ring of keys hooked on a grate bar.", basis: "inferred",
  },
  {
    id: "false-teeth", name: "False teeth", art: "glint", on: "floor", tier: "common", weight: 1.5,
    verb: "Pick them up, gingerly", time: 5, loot: { "false-teeth": 1 },
    text: "A full upper plate. Sewer workers say it is one of the commonest things they find, after rings and phones.",
    look: "A pink plate of teeth grinning out of the silt.", basis: "documented",
  },
  {
    id: "lost-phone", name: "Phone", art: "phone", on: "floor", tier: "notable", years: [2000, 2030], weight: 2.5,
    verb: "Pick up the phone", time: 5, loot: { "mobile-phone": 1 },
    text: "A phone that slipped from a back pocket in a toilet stall. The screen is cracked and dark.",
    look: "A flat black slab half under the water.", basis: "documented",
  },
  {
    id: "lost-toy", name: "Toy", art: "toy", on: "floor", tier: "common", weight: 2.5,
    verb: "Pick up the toy", time: 5, loot: { "lost-toy": 1 },
    text: "Washed through a gutter grating in a storm. Somebody cried about it.",
    look: "A small bright toy stranded on the ledge.", basis: "inferred",
  },
  {
    id: "old-bottle", name: "Old bottle", art: "bottle", on: "floor", tier: "common", depths: ["street", "old"], weight: 2.5,
    verb: "Take the bottle", time: 10, loot: { "old-bottle": 1 },
    text: "Heavy glass with a maker's name moulded in it. Bottle collectors dig old sewers and tips for these.",
    look: "A thick glass bottle in the silt.", basis: "documented",
  },
  {
    id: "rat-bones", name: "Rat bones", art: "bones", on: "floor", tier: "common", weight: 2, keeps: true,
    verb: "Look closer", time: 5,
    text: "A rat's skeleton, picked clean by other rats.",
    look: "Tiny bones on the ledge.", basis: "inferred",
  },
  {
    id: "silt-heap", name: "Silt bank", art: "silt-heap", on: "floor", tier: "common", depths: ["street", "trunk"], weight: 3,
    verb: "Sift the silt", time: 60, loot: { coin: [0, 3], "key-ring": [0, 1] },
    text: "Grit, gravel and everything heavy enough to sink. You rake through it with your fingers.",
    look: "A bank of grey silt where the channel bends.", basis: "documented",
  },
  {
    id: "letters", name: "Bundle of letters", art: "papers", on: "floor", tier: "notable", weight: 1,
    verb: "Pick up the letters", time: 20, loot: { letters: 1 },
    text: "Letters tied with string and thrown down a drain. Somebody wanted rid of them; the ink has run, but a name and a date are still clear.",
    look: "A wet bundle of paper.", basis: "fiction",
  },
  {
    id: "jewellers-silt", name: "Gold-bearing silt", art: "glint", on: "floor", tier: "notable", where: [SOUTH_ASIA], kinds: ["tropical", "concrete"], depths: ["street"], weight: 2,
    verb: "Pan the silt", time: 90, loot: { "gold-scrapings": 1 },
    text: "Below a row of jewellers' workshops the drain silt sparkles. Swirl it in water and the gold settles.",
    look: "Silt with a faint yellow sparkle.", basis: "documented",
  },

  // Workers' things.
  {
    id: "tool-locker", name: "Tool locker", art: "locker", on: "floor", tier: "notable", depths: ["street", "trunk"], weight: 1.5,
    verb: "Open the locker", time: 30, loot: { waders: 1, "flask-tea": [0, 1] },
    text: "A steel locker chained to a ring in the wall: waders, spare gloves, a flask somebody forgot.",
    look: "A dented steel locker.", basis: "inferred",
  },
  {
    id: "flushers-bag", name: "Toolbag", art: "toolbag", on: "floor", tier: "common", depths: ["street", "trunk"], weight: 2,
    verb: "Look in the bag", time: 15, loot: { tool: 1, rope: [0, 1] },
    text: "Rods, a scraper and a short shovel, left for the next shift.",
    look: "A canvas bag of tools on the ledge.", basis: "inferred",
  },
  {
    id: "safety-lamp", name: "Flame safety lamp", art: "toolbag", on: "floor", tier: "notable", years: [1900, 1960], depths: ["street", "trunk"], weight: 1,
    verb: "Take the lamp", time: 10, loot: { "kerosene-lamp": 1 }, fuel: 1200,
    text: "A gauze-shielded lamp lowered down the shaft before anyone follows. A flame that stretches tall means gas.",
    look: "A brass lamp with a wire gauze chimney.", basis: "documented",
  },
  {
    id: "gas-monitor", name: "Gas monitor", art: "toolbag", on: "floor", tier: "notable", years: [1975, 2030], depths: ["street", "trunk"], weight: 1,
    verb: "Pick up the monitor", time: 10,
    text: "A clip-on gas meter, still on. It reads normal air. You clip it on and feel slightly better about the dark.",
    look: "A yellow box with a blinking light.", basis: "documented",
  },
  {
    id: "carbide-tin", name: "Tin of carbide", art: "tin", on: "floor", tier: "common", years: [1900, 1955], weight: 2,
    verb: "Refill your lamp", time: 20, loot: { carbide: [0, 2] }, fuel: 3000,
    text: "A screw-top tin of carbide lumps, kept dry. You charge your lamp and pocket the rest.",
    look: "A rusty tin with a screw lid.", basis: "documented",
  },
  {
    id: "batteries", name: "Batteries", art: "tin", on: "floor", tier: "common", years: [1950, 2030], weight: 2,
    verb: "Change your batteries", time: 15, loot: { battery: [0, 2] }, fuel: 3500,
    text: "A packet of batteries still in the wrapper. Your light brightens.",
    look: "A small packet on a ledge.", basis: "inferred",
  },
  {
    id: "first-aid-box", name: "First-aid box", art: "locker", on: "floor", tier: "notable", depths: ["street", "trunk"], weight: 1.2,
    verb: "Open the box", time: 30, loot: { "first-aid-kit": [0, 1] }, heal: 25,
    text: "Bandages, iodine and an eyewash bottle. A card inside says to report any cut, however small: rat urine carries Weil's disease.",
    look: "A box with a cross on the lid.", basis: "documented",
  },
  {
    id: "logbook", name: "Gang logbook", art: "papers", on: "floor", tier: "common", depths: ["street", "trunk"], weight: 1,
    verb: "Read the logbook", time: 30, loot: { ledger: 1 },
    text: "Dates, names and work done: silt cleared, a cracked arch reported, gas found in a branch and the branch closed.",
    look: "A grease-stained notebook in a tin.", basis: "inferred",
  },
  {
    id: "tea-flask", name: "Forgotten flask", art: "bottle", on: "floor", tier: "common", depths: ["street", "trunk"], weight: 1.2,
    verb: "Drink from the flask", time: 10, loot: { "flask-tea": [0, 1] }, heal: 5,
    text: "Still warm. Strong tea with a lot of sugar.",
    look: "A vacuum flask standing on the ledge.", basis: "inferred",
  },

  // On the walls.
  {
    id: "builders-plaque", name: "Builder's plate", art: "plaque", on: "wall", tier: "common", weight: 2, keeps: true,
    verb: "Read the plate", time: 15,
    text: "A cast plate with the year this sewer was built and the engineer who signed it off.",
    look: "A cast-iron plate set into the wall.", basis: "documented",
  },
  {
    id: "bazalgette-plaque", name: "Board of Works plate", art: "plaque", on: "wall", tier: "notable", where: [LONDON], kinds: ["brick"], depths: ["street", "trunk"], weight: 3, keeps: true,
    verb: "Read the plate", time: 15,
    text: "The Metropolitan Board of Works, and a date in the 1860s. Joseph Bazalgette's interceptors were built after the Great Stink of 1858 and still carry London's sewage east.",
    look: "A plate in the brickwork, the lettering filled with grime.", basis: "inferred",
  },
  {
    id: "paris-street-plate", name: "Street-name plate", art: "plaque", on: "wall", tier: "notable", where: [PARIS], kinds: ["gallery"], depths: ["street"], weight: 4,
    verb: "Unscrew the plate", time: 60, loot: { "street-plaque": 1 },
    text: "Each gallery carries the name of the street above on a blue enamel plate, with the house numbers it serves. You work the screws loose.",
    look: "A blue enamel plate: a street name, white on blue.", basis: "documented",
  },
  {
    id: "pneumatic-tube", name: "Pneumatic post tube", art: "valve", on: "wall", tier: "notable", years: [1900, 1984], where: [PARIS], kinds: ["gallery"], depths: ["street"], weight: 2, keeps: true,
    verb: "Put your ear to the tube", time: 15,
    text: "A whoosh and a rattle goes past inside the iron pipe: a capsule of letters shot across Paris by compressed air.",
    look: "An iron tube clamped along the vault.", basis: "documented",
  },
  {
    id: "flow-gauge", name: "Flow gauge", art: "gauge", on: "wall", tier: "common", years: [1920, 2030], depths: ["street", "trunk"], weight: 2, keeps: true,
    verb: "Read the gauge", time: 10,
    text: "A painted depth board and a recorder. The ink line shows last night's storm as a tall spike: the water came up past your head.",
    look: "A gauge board marked in feet or metres.", basis: "documented",
  },
  {
    id: "sluice-valve", name: "Sluice valve", art: "valve", on: "wall", tier: "common", depths: ["street", "trunk"], weight: 2, keeps: true,
    verb: "Turn the wheel", time: 30,
    text: "The wheel gives a quarter turn and stops. Somewhere downstream a gate shifts and the water note changes.",
    look: "A big iron hand wheel on a spindle.", basis: "inferred",
  },
  {
    id: "junction-box", name: "Junction box", art: "fusebox", on: "wall", tier: "common", years: [1930, 2030], depths: ["street", "trunk"], weight: 1.5, keeps: true,
    verb: "Open the box", time: 15,
    text: "Telephone pairs and power for the pumps, labelled in faded marker. Running cables through a sewer saves digging up a street.",
    look: "A grey metal box with conduit running out of it.", basis: "documented",
  },
  {
    id: "storm-notice", name: "Storm notice", art: "notice", on: "wall", tier: "common", years: [1900, 1969], weight: 1.5, keeps: true,
    verb: "Read the notice", time: 10,
    text: "IN HEAVY RAIN ALL MEN TO LEAVE THE SEWER AT ONCE BY THE NEAREST SHAFT.",
    look: "A painted board by the ladder.", basis: "inferred",
  },
  {
    id: "confined-space-notice", name: "Confined space sign", art: "notice", on: "wall", tier: "common", years: [1970, 2030], weight: 1.5, keeps: true,
    verb: "Read the sign", time: 10,
    text: "DANGER. CONFINED SPACE. DO NOT ENTER WITHOUT A PERMIT, A GAS TEST AND A STANDBY PERSON.",
    look: "A yellow and black sign.", basis: "documented",
  },
  {
    id: "collector-notice", name: "Collector notice", art: "notice", on: "wall", tier: "common", years: [1950, 2030], kinds: ["collector"], weight: 2, keeps: true,
    verb: "Read the notice", time: 10,
    text: "WORK IN THE COLLECTOR ONLY WITH A PERMIT. HOT WATER MAIN: DO NOT TOUCH. The stencil is in Cyrillic or the local language, and the paint is decades old.",
    look: "Stencilled letters on the concrete.", basis: "inferred",
  },
  {
    id: "heating-main", name: "Heating main", art: "valve", on: "wall", tier: "notable", kinds: ["collector"], depths: ["street", "trunk"], weight: 3, keeps: true, glow: "#ff9a50",
    verb: "Warm your hands", time: 60, heal: 10,
    text: "Hot water from the power station runs in this lagged pipe all winter. Where the lagging has fallen off, it is too hot to touch. You warm yourself at a safe distance.",
    look: "A fat lagged pipe and a valve, steaming faintly.", basis: "documented",
  },
  {
    id: "tokyo-discharge-channel", name: "Discharge channel plate", art: "plaque", on: "wall", tier: "notable", years: [2006, 2030], where: [GREATER_TOKYO], depths: ["trunk"], weight: 3, keeps: true,
    verb: "Read the plate", time: 15,
    text: "The Metropolitan Area Outer Underground Discharge Channel, finished in 2006: shafts and a tunnel that carry floodwater to a tank held up by fifty-nine pillars, which people call the temple.",
    look: "A plate beside a staircase going down into a vast pillared hall.", basis: "documented",
  },
  {
    id: "tideway-plaque", name: "Tideway plaque", art: "plaque", on: "wall", tier: "notable", years: [2025, 2030], where: [LONDON], depths: ["trunk"], weight: 3, keeps: true,
    verb: "Read the plaque", time: 15,
    text: "The Thames Tideway Tunnel: 25 kilometres under the river, to catch the overflows that used to pour into it every time it rained.",
    look: "A new plaque on clean concrete.", basis: "documented",
  },
  {
    id: "deep-tunnel-notice", name: "Deep Tunnel notice", art: "notice", on: "wall", tier: "notable", years: [1985, 2030], where: [CHICAGO], depths: ["trunk"], weight: 3, keeps: true,
    verb: "Read the notice", time: 10,
    text: "TUNNEL AND RESERVOIR PLAN. A tunnel cut through bedrock to hold storm water that used to flood basements and foul the lake.",
    look: "A stencilled notice at a drop shaft.", basis: "documented",
  },
  {
    id: "drenaje-profundo", name: "Deep drainage plate", art: "plaque", on: "wall", tier: "notable", years: [1975, 2030], where: [MEXICO_CITY], depths: ["trunk"], weight: 3, keeps: true,
    verb: "Read the plate", time: 15,
    text: "The Deep Drainage System, opened in 1975. The city sank so far by pumping out its own groundwater that the old canal stopped flowing downhill.",
    look: "A plate on the curved wall of a huge tunnel.", basis: "documented",
  },

  // People who live down here.
  {
    id: "bedroll", name: "Bedroll", art: "bedroll", on: "floor", tier: "common", years: [1929, 2030], depths: ["street", "trunk"], weight: 1.5, flat: true,
    verb: "Lie down a while", time: 600, heal: 15,
    text: "Cardboard under a blanket on the highest ledge. You rest your legs and listen to the water.",
    look: "A blanket over flattened cardboard.", basis: "documented",
  },
  {
    id: "camp", name: "Camp", art: "camp", on: "floor", tier: "notable", years: [1929, 2030], depths: ["street", "trunk"], weight: 1, glow: "#ffb060", keeps: true,
    verb: "Sit by the stove", time: 300, heal: 30, loot: { "tinned-food": [0, 1] },
    text: "Someone's home: a camping stove, a pan, mattresses, a shelf of paperbacks. Nobody is in. You warm up and eat something from the shelf.",
    look: "A stove and bedding in a dry side tunnel.", basis: "documented",
  },
  {
    id: "heating-chamber-camp", name: "Camp on the heating pipes", art: "camp", on: "floor", tier: "notable", years: [1990, 2015], where: [BUCHAREST], kinds: ["collector"], depths: ["street"], weight: 4, glow: "#ffb060", keeps: true,
    verb: "Sit on the warm pipes", time: 300, heal: 30,
    text: "Blankets laid over the hot-water mains in a chamber under the street near the station. It is warm here when it is twenty below up top.",
    look: "Blankets and a candle on a nest of lagged pipes.", basis: "documented",
  },
  {
    id: "flood-tunnel-camp", name: "Tunnel camp", art: "camp", on: "floor", tier: "notable", years: [2000, 2030], where: [LAS_VEGAS], depths: ["street"], weight: 4, glow: "#ffb060", keeps: true,
    verb: "Rest a while", time: 300, heal: 30, loot: { water: [0, 2] },
    text: "A bed frame, a dresser and a rug, carried in piece by piece. A line on the wall shows how high the last flash flood came.",
    look: "Furniture in a concrete flood tunnel.", basis: "documented",
  },
  {
    id: "shrine", name: "Candle shrine", art: "shrine", on: "floor", tier: "notable", years: [1950, 2030], depths: ["street", "trunk"], weight: 1, keeps: true, glow: "#ffcc66",
    verb: "Stand a moment", time: 30, heal: 5,
    text: "A candle in a jar, a photograph and plastic flowers, for someone who lived down here and drowned when the water came. People keep the candle lit.",
    look: "A small flame and a photograph on a ledge.", basis: "inferred",
  },

  // Paint.
  {
    id: "tags", name: "Tags", art: "graffiti", on: "wall", tier: "common", years: [1980, 2030], weight: 2.5, keeps: true,
    verb: "Look at the tags", time: 10,
    text: "Names in spray paint, some fresh and some decades old, layered over each other. Explorers sign the furthest point they reached.",
    look: "Spray-painted names.", basis: "documented",
  },
  {
    id: "mural", name: "Mural", art: "mural", on: "wall", tier: "notable", years: [1985, 2030], depths: ["street", "trunk"], weight: 1, keeps: true,
    verb: "Look at the mural", time: 30,
    text: "A whole wall painted by torchlight: faces, a city skyline, letters three metres high. Nobody will ever paint over it.",
    look: "A painted wall bright under your light.", basis: "documented",
  },
  {
    id: "cave-clan-mark", name: "Cave Clan mark", art: "graffiti", on: "wall", tier: "notable", years: [1986, 2030], where: [AUSTRALIA], depths: ["street", "trunk"], weight: 3, keeps: true,
    verb: "Look at the mark", time: 10,
    text: "The Cave Clan's sign and a name for this drain, painted by drainers who mapped it. The clan started in Melbourne in 1986.",
    look: "A painted logo and a drain name.", basis: "documented",
  },
  {
    id: "diggers-mark", name: "Diggers' marks", art: "graffiti", on: "wall", tier: "notable", years: [1990, 2030], where: [MOSCOW], weight: 3, keeps: true,
    verb: "Read the marks", time: 15,
    text: "Arrows, dates and names in Cyrillic, chalk and paint: the route marks of Moscow's diggers, so the next group can find the way out.",
    look: "Chalk arrows and painted dates.", basis: "documented",
  },
  {
    id: "cataphile-carving", name: "Quarry room carvings", art: "mural", on: "wall", tier: "notable", years: [1970, 2030], where: [PARIS], depths: ["old"], weight: 4, keeps: true,
    verb: "Look at the walls", time: 30,
    text: "Sculpted heads, a painted wave, the names of quarrymen from two centuries ago in black candle soot, and cataphiles' paintings over them.",
    look: "A carved and painted limestone room.", basis: "documented",
  },
  {
    id: "freedom-mural", name: "Tunnel mural", art: "mural", on: "wall", tier: "notable", years: [1985, 2030], where: [NEW_YORK], weight: 3, keeps: true,
    verb: "Look at the mural", time: 30,
    text: "A huge painted copy of a famous picture, done where the light falls through a grating. Painters worked down here for years among the people who lived in the tunnels.",
    look: "A mural lit by a shaft of daylight.", basis: "documented",
  },

  // Blockages and rubbish.
  {
    id: "fatberg", name: "Fatberg", art: "fatberg", on: "floor", tier: "notable", years: [2000, 2030], kinds: ["brick", "concrete", "gallery"], depths: ["street"], weight: 1.5,
    verb: "Dig into it", time: 180, loot: { "gold-ring": [0, 1], "false-teeth": [0, 1] },
    text: "Cooking fat, wet wipes and nappies set hard as stone. It smells beyond description. You dig a hand in and pull something out.",
    look: "A grey-white mass filling half the tunnel.", basis: "documented",
  },
  {
    id: "london-fatberg", name: "Fatberg", art: "fatberg", on: "floor", tier: "notable", years: [2010, 2030], where: [LONDON], kinds: ["brick"], depths: ["street"], weight: 4,
    verb: "Dig into it", time: 180, loot: { "gold-ring": [0, 1], "mobile-phone": [0, 1] },
    text: "A mass of fat and wipes like the one found under Whitechapel in 2017, which weighed about 130 tonnes. Things are stuck in it: a ring, a phone.",
    look: "A grey wall of fat filling the brick sewer.", basis: "documented",
  },
  {
    id: "trolley", name: "Shopping trolley", art: "trolley", on: "floor", tier: "common", years: [1955, 2030], depths: ["street", "trunk"], weight: 1.5, keeps: true,
    verb: "Look at the trolley", time: 10,
    text: "A supermarket trolley, rolled into a storm drain and carried a long way by the flood.",
    look: "A wire trolley on its side.", basis: "documented",
  },
  {
    id: "bicycle", name: "Bicycle", art: "bicycle", on: "floor", tier: "common", depths: ["street", "trunk"], weight: 1.2, keeps: true,
    verb: "Look at the bicycle", time: 10,
    text: "Stolen, ridden, and dropped down an open shaft. The wheels are bent.",
    look: "A rusting bicycle in the channel.", basis: "inferred",
  },
  {
    id: "drum", name: "Leaking drum", art: "barrel", on: "floor", tier: "common", years: [1920, 2030], depths: ["street", "trunk"], weight: 1, keeps: true,
    verb: "Look at the drum", time: 10,
    text: "An oil drum dumped down a manhole by someone who didn't want to pay for disposal. Something oily rainbows the water below it.",
    look: "A rusting steel drum.", basis: "documented",
  },
  {
    id: "flood-sandbags", name: "Sandbags", art: "sandbags", on: "floor", tier: "common", depths: ["street", "trunk"], weight: 1, keeps: true,
    verb: "Look at the sandbags", time: 10,
    text: "Sandbags piled to block a side branch during works, and left when the works were done.",
    look: "A wall of sandbags across a branch.", basis: "inferred",
  },
  {
    id: "storm-debris", name: "Storm debris", art: "silt-heap", on: "floor", tier: "common", kinds: ["tropical"], depths: ["street"], weight: 3,
    verb: "Pick through it", time: 45, loot: { coin: [0, 2], "lost-toy": [0, 1] },
    text: "Leaves, coconut husks, sandals and plastic washed off the street in the last downpour.",
    look: "A drift of wet rubbish against a slab.", basis: "documented",
  },

  // Older and stranger things below.
  {
    id: "smugglers-stash", name: "Smuggler's stash", art: "crate", on: "floor", tier: "prize", years: [1920, 2030], depths: ["trunk", "old"], weight: 0.8,
    verb: "Open the crate", time: 60, loot: { banknotes: [1, 2], cigarettes: [0, 2] },
    text: "A crate pushed into a dry side tunnel and never collected. Whoever hid it was arrested, or worse.",
    look: "A crate wrapped in plastic.", basis: "fiction",
  },
  {
    id: "rum-cache", name: "Bootlegger's cache", art: "crate", on: "floor", tier: "prize", years: [1920, 1933], where: [US], depths: ["trunk", "old"], weight: 2,
    verb: "Open the crate", time: 60, loot: { moonshine: [1, 3], brandy: [0, 2] },
    text: "Bottles in straw, packed in a crate in a dry old culvert. Prohibition made a lot of tunnels useful.",
    look: "A wooden crate stencilled as machine parts.", basis: "hypothesis",
  },
  {
    id: "nogales-tunnel", name: "Smuggling tunnel", art: "crate", on: "floor", tier: "prize", years: [1990, 2030], where: [NOGALES], depths: ["street", "trunk"], weight: 4,
    verb: "Search the tunnel mouth", time: 60, loot: { banknotes: [1, 3] },
    text: "A hole cut through the side of the storm drain into a narrow tunnel, shored with timber, running toward the other side of the border.",
    look: "A rough hole in the concrete, a crate inside.", basis: "documented",
  },
  {
    id: "wartime-cache", name: "Wartime cache", art: "crate", on: "floor", tier: "prize", years: [1939, 1960], where: OLD_EUROPE, depths: ["trunk", "old"], weight: 1.5,
    verb: "Open the cache", time: 90, loot: { ammunition: [1, 2], rifle: [0, 1], "tinned-food": [0, 2] },
    text: "Weapons wrapped in oilcloth, hidden from the occupation or from the peace that followed it.",
    look: "Oilcloth bundles in a bricked-up niche.", basis: "inferred",
  },
  {
    id: "warsaw-dispatch", name: "Dropped dispatch case", art: "papers", on: "floor", tier: "prize", years: [1944, 1960], where: [WARSAW], depths: ["street", "trunk"], weight: 4,
    verb: "Open the case", time: 30, loot: { dispatch: 1 },
    text: "A courier's case, lost in the dark during the Uprising of 1944. The papers are reports and orders between districts the Germans had cut off.",
    look: "A small leather case in the muck.", basis: "inferred",
  },
  {
    id: "gas-mask-crate", name: "Gas masks", art: "crate", on: "floor", tier: "notable", years: [1939, 1991], depths: ["trunk", "old"], weight: 1,
    verb: "Take a mask", time: 20, loot: { "gas-mask": 1 },
    text: "Masks still in their boxes, issued for a war that either came or did not.",
    look: "A crate of cardboard boxes.", basis: "documented",
  },
  {
    id: "shelter-rations", name: "Shelter stores", art: "crate", on: "floor", tier: "notable", years: [1955, 2030], depths: ["old"], weight: 2,
    verb: "Open the stores", time: 60, loot: { "tinned-food": [2, 4], water: [0, 2] }, heal: 15,
    text: "A Cold War shelter's stores: water drums, survival biscuits in tins, a hand-cranked radio. The biscuits are still edible, just about.",
    look: "Stacked tins and water drums.", basis: "documented",
  },
  {
    id: "resistance-plaque", name: "Resistance headquarters", art: "plaque", on: "wall", tier: "prize", years: [1945, 2030], where: [PARIS], depths: ["old"], weight: 3, keeps: true,
    verb: "Read the plaque", time: 20,
    text: "In August 1944 Colonel Rol-Tanguy directed the rising that freed Paris from a shelter here, twenty-six metres under the Place Denfert-Rochereau.",
    look: "A plaque by a steel door.", basis: "documented",
  },
  {
    id: "fleet-culvert", name: "The River Fleet", art: "plaque", on: "wall", tier: "notable", where: [LONDON], depths: ["old"], weight: 3, keeps: true,
    verb: "Read the stone", time: 15,
    text: "A carved stone marks the old River Fleet, which once gave Fleet Street its name. It was bricked over in stages from the 1730s and now runs as a sewer.",
    look: "A worn stone in an older brick vault.", basis: "inferred",
  },
  {
    id: "neglinnaya", name: "The Neglinnaya", art: "plaque", on: "wall", tier: "notable", where: [MOSCOW], depths: ["old"], weight: 3, keeps: true,
    verb: "Read the date", time: 15,
    text: "A date cut in the brick: 1819. The Neglinnaya river was put in this tunnel under the city then, and still flows past the Kremlin walls into the Moskva.",
    look: "A date in the brick of a low vault.", basis: "inferred",
  },
  {
    id: "clay-pipes", name: "Clay pipes", art: "glint", on: "floor", tier: "common", where: OLD_EUROPE, depths: ["old"], weight: 2.5,
    verb: "Pick up a pipe", time: 10, loot: { "clay-pipe": [1, 2] },
    text: "White clay pipe bowls and stems, thrown away by the thousand in the centuries when everyone smoked them.",
    look: "White fragments in the silt.", basis: "documented",
  },
  {
    id: "pilgrim-badge", name: "Pilgrim badge", art: "glint", on: "floor", tier: "prize", where: OLD_EUROPE, depths: ["old"], weight: 1,
    verb: "Pick up the badge", time: 10, loot: { "pilgrim-badge": 1 },
    text: "A cast pewter saint, small as a thumbnail. Medieval pilgrims bought these at shrines and lost them in the town ditches that became these culverts.",
    look: "A grey metal shape in the black mud.", basis: "documented",
  },
  {
    id: "roman-coins", name: "Roman coins", art: "glint", on: "floor", tier: "prize", where: ROMAN, depths: ["old"], weight: 1.5,
    verb: "Pick up the coins", time: 20, loot: { "old-coins": 1 },
    text: "Bronze coins with an emperor's head, green and worn. The culvert cuts through the Roman town under the modern one.",
    look: "Green discs in the mud.", basis: "documented",
  },
  {
    id: "roman-lamp", name: "Roman lamp", art: "niche", on: "wall", tier: "prize", where: ROMAN, depths: ["old"], weight: 1,
    verb: "Take the lamp", time: 20, loot: { "terracotta-lamp": 1 }, fuel: 300,
    text: "A clay oil lamp in a niche of a Roman drain, its top moulded with a gladiator. There is a little congealed oil still in it.",
    look: "A small clay lamp in a niche in old stonework.", basis: "documented",
  },
  {
    id: "old-sewer-vault", name: "Blocked arch", art: "niche", on: "wall", tier: "common", depths: ["old"], weight: 2, keeps: true,
    verb: "Look through the gap", time: 15,
    text: "An older sewer, bricked off when the new one was cut past it. Through a gap the air is still and very cold.",
    look: "A bricked-up arch with a gap at the top.", basis: "inferred",
  },
];
