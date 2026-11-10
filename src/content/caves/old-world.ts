import { at } from "./regions";
import type { CaveFind } from "./types";

/** Africa, Europe and Asia from the first cities to the age of sail. */
export const oldWorldFinds: CaveFind[] = [
  // Egypt
  {
    id: "mummy-cache", name: "Coffins stacked in the dark", art: "coffin:egypt", on: "floor", tier: "prize", years: [-1100, 1900], where: [at.egypt], weight: 3,
    verb: "Open a coffin", time: 300, loot: { faience: [1, 3], ushabti: [1, 3], "mummy-linen": [1, 2], "gold-ring": [0, 1] },
    text: "Priests moved these dead here in a hurry, to keep them from robbers, and wrote on the wrappings who each one was. Robbers found them anyway. You are one more.",
    look: "Painted coffins piled one on another, some with the lids already off.", basis: "documented",
  },
  {
    id: "animal-mummies", name: "Jars of wrapped birds", art: "pots:tall", on: "floor", tier: "notable", years: [-700, 400], where: [at.egypt], weight: 3,
    verb: "Open a jar", time: 60, loot: { "mummy-linen": [1, 2], faience: [0, 1] },
    text: "Each jar holds an ibis wrapped in patterned linen, bought by a pilgrim and left for Thoth. There are thousands, in rows, as far as your light goes.",
    look: "Rows of sealed pottery jars along the gallery.", basis: "documented",
  },
  {
    id: "robbers-tunnel", name: "Robbers' leavings", art: "tools", on: "floor", tier: "common", years: [-2500, 1900], where: [at.egypt], weight: 2,
    verb: "Search the leavings", time: 60, loot: { faience: [0, 2], "old-coins": [0, 1], "oil-lamp": [0, 1] }, fuel: 300,
    text: "A broken basket, a copper chisel, a lamp with oil still in it. Someone cut in here looking for a tomb and left in a hurry.",
    look: "Tools and a lamp dropped at the end of a rough-cut passage.", basis: "documented",
  },
  {
    id: "quarry-marks", name: "Quarrymen's marks", art: "inscription:hieratic", on: "wall", tier: "common", years: [-2600, 1900], where: [at.egypt], weight: 2, keeps: true,
    verb: "Read the marks", time: 40,
    text: "Red ink on the cut stone: a gang's name, a tally of blocks, the day's date in a king's year. One of them drew the overseer with a donkey's ears.",
    look: "Lines in red ink on a squared face of rock.", basis: "documented",
  },
  {
    id: "hermit-cell-coptic", name: "Hermit's cell", art: "bedroll:cross", on: "floor", tier: "notable", years: [300, 1400], where: [at.egypt, at.levant, at.horn], weight: 3,
    verb: "Search the cell", time: 60, loot: { bread: [0, 2], "oil-lamp": [0, 1], papyrus: [0, 1] }, fuel: 300,
    text: "A reed mat, a water jar, a cross scratched over the sleeping place. Whoever prayed here has been gone a while. There is oil in the lamp.",
    look: "A sleeping mat and a few pots in a niche, a cross cut in the wall above.", basis: "documented",
  },
  {
    id: "buried-codices", name: "Sealed jar", art: "jar", on: "floor", tier: "prize", years: [370, 1945], where: [at.egypt], weight: 1.5,
    verb: "Break the seal", time: 60, loot: { codex: [1, 3] },
    text: "Inside are leather-bound books of papyrus in Coptic: gospels nobody reads in church any more. Someone hid them rather than burn them.",
    look: "A tall red jar with a bowl sealed over its mouth with pitch.", basis: "documented",
  },
  // Levant and West Asia
  {
    id: "scroll-jars", name: "Tall lidded jars", art: "jar", on: "floor", tier: "prize", years: [70, 1947], where: [[34.8, 30.8, 35.8, 32.2]], weight: 6,
    verb: "Lift a lid", time: 60, loot: { "old-scrolls": [1, 3] },
    text: "Leather scrolls wrapped in linen, written in Hebrew in a small square hand. They were hidden here when an army was coming, and nobody came back for them.",
    look: "Tall clay jars with bowl-shaped lids, standing against the wall.", basis: "documented",
  },
  {
    id: "rebels-refuge", name: "Refuge", art: "basket", on: "floor", tier: "notable", years: [135, 1950], where: [at.levant], weight: 2,
    verb: "Search the baskets", time: 90, loot: { "old-coins": [0, 2], "old-scrolls": [0, 1], "fine-cloth": [0, 1] },
    text: "House keys, a mirror, a bundle of letters, a child's sandal. Families hid here from the legions with what they could carry. They did not walk out.",
    look: "Baskets and bundles pushed to the back of the cave.", basis: "documented",
  },
  {
    id: "mithraeum", name: "Bull-slayer relief", art: "relief", on: "wall", tier: "prize", years: [100, 1700], where: [at.europe, at.mediterranean, at.westAsia], weight: 1.5, keeps: true,
    verb: "Look at the relief", time: 60,
    text: "A young god in a soft cap kneels on a bull and cuts its throat, with a dog, a snake and a scorpion at the wound. Benches run down both sides. Soldiers ate together here, by lamplight, and told nobody what was said.",
    look: "A carved panel at the end of a cave cut square, with benches along the walls.", basis: "documented",
  },
  {
    id: "coin-hoard", name: "Pot in a crevice", art: "hoard", on: "floor", tier: "prize", years: [-500, 1800], where: [at.europe, at.mediterranean, at.westAsia, at.india, at.maghreb], weight: 2,
    verb: "Pull out the pot", time: 40, loot: { "old-coins": [2, 5] },
    text: "The pot is heavy. Someone buried their savings in a bad year and did not live to dig them up.",
    look: "The rim of a pot showing in a crack, stopped with clay.", basis: "documented",
  },
  {
    id: "votive-cave", name: "Offerings in the rock", art: "altar", on: "floor", tier: "notable", years: [-2500, 400], where: [at.aegean, at.italy, at.levant, at.westAsia], weight: 3,
    verb: "Take the offerings", time: 60, loot: { "votive-bronze": [1, 3], potsherds: [1, 2] },
    text: "Little bronze figures with raised arms, tiny double axes, cups by the hundred, jammed into every crack of a stalagmite. People climbed up here for a thousand years to ask for things.",
    look: "A stalagmite hung about with small bronzes and broken cups.", basis: "documented",
  },
  {
    id: "bronze-hoard", name: "Bronzes under rubble", art: "axes:bronze", on: "floor", tier: "prize", years: [-2200, -600], where: [at.europe, at.westAsia, at.china], weight: 2,
    verb: "Clear the rubble", time: 180, loot: { "bronze-axe": [1, 3] },
    text: "Axe heads, a broken sword and lumps of raw metal: a smith's stock, or a gift to the dark.",
    look: "Green-stained stones heaped over something.", basis: "documented",
  },
  // Europe, late antique to early modern
  {
    id: "hermitage", name: "Hermit's cell", art: "bedroll:cross", on: "floor", tier: "notable", years: [400, 1750], where: [at.europe, at.mediterranean], depth: [1, 2], weight: 2.5,
    verb: "Search the cell", time: 60, loot: { bread: [0, 2], candles: [0, 2], beads: [0, 1] }, fuel: 300,
    text: "A bed of bracken, a bowl, a stub of candle and a cross of two sticks. People brought the hermit food and asked for prayers. Nobody has come lately.",
    look: "A bed of bracken under a cross tied from two sticks.", basis: "documented",
  },
  {
    id: "outlaw-cache", name: "Outlaws' cache", art: "chest", on: "floor", tier: "prize", years: [800, 1850], where: [at.europe, at.mediterranean, at.westAsia], weight: 2,
    verb: "Force the chest", time: 120, loot: { coin: [10, 40], sword: [0, 1], wine: [0, 2], "gold-ring": [0, 1] },
    text: "The lock gives. Purses cut from travellers, a good sword, a wineskin. The men who hid this were hanged, or will be back.",
    look: "An iron-bound chest under a pile of brushwood.", basis: "inferred",
  },
  {
    id: "smugglers-kegs", name: "Kegs above the tide", art: "barrel", on: "floor", tier: "prize", years: [1650, 1860], where: [at.britain, at.europe], kinds: ["sea"], weight: 6,
    verb: "Take what you can carry", time: 120, loot: { brandy: [2, 4], tea: [0, 3], tobacco: [0, 3] },
    text: "French brandy in small kegs made to be carried by one man, tea in oilskin, tobacco. Landed by night for people who do not pay the king his duty. They will notice it gone.",
    look: "Small kegs and oilskin bundles stacked on a ledge above the high-water mark.", basis: "documented",
  },
  {
    id: "plague-refuge", name: "Abandoned camp", art: "bedroll", on: "floor", tier: "common", years: [1347, 1720], where: [at.europe], depth: [1, 2], weight: 1.5,
    verb: "Search the camp", time: 60, loot: { candles: [0, 2], coin: [0, 6], "clay-pot": [0, 1] }, fuel: 240,
    text: "A family came up here to get away from the sickness in the town. Bedding for five, a cooking pot, a child's wooden horse.",
    look: "Bedding, a pot and a cold fire, left as if for an hour.", basis: "inferred",
  },
  {
    id: "miners-gear", name: "Old workings", art: "tools", on: "floor", tier: "common", years: [-1500, 1900], where: [at.europe, at.mediterranean, at.westAsia, at.china, at.india], depth: [2, 9], weight: 2,
    verb: "Search the workings", time: 60, loot: { ore: [1, 3], tool: [0, 1] }, fuel: 240,
    text: "A wedge, a broken pick, a basket of ore nobody carried out, and lamp niches black with soot.",
    look: "A cut face with tools left under it.", basis: "documented",
  },
  {
    id: "latin-graffiti", name: "Names in the rock", art: "inscription:latin", on: "wall", tier: "common", years: [-200, 1800], where: [at.europe, at.mediterranean, at.maghreb], weight: 1.5, keeps: true,
    verb: "Read the names", time: 30,
    text: "Visitors cut their names here, and a date, and one of them a rude remark about another.",
    look: "Letters cut into the wall at head height.", basis: "documented",
  },
  // China and its neighbours
  {
    id: "buddha-grotto", name: "Carved Buddha", art: "buddha", on: "wall", tier: "prize", years: [400, 2100], where: [at.china, at.silkRoad, at.india, at.southeastAsia, at.japan], weight: 3, keeps: true, glow: "#ffcf80",
    verb: "Stand before it", time: 60,
    text: "A seated Buddha cut from the living rock, one hand raised, traces of gold and blue still on the robe. A donor's name is carved by its knee, with a prayer for their parents.",
    look: "A figure seated in a niche cut into the wall.", basis: "documented",
  },
  {
    id: "sealed-library", name: "Walled-up niche", art: "jar:scrolls", on: "floor", tier: "prize", years: [1006, 1900], where: [at.silkRoad, at.china], weight: 2,
    verb: "Pull out the scrolls", time: 120, loot: { sutra: [2, 5] },
    text: "Behind a false wall the monks stacked their old books to the roof: sutras, contracts, a printed scroll, a star chart. Then they plastered it over and painted the plaster.",
    look: "A patch of wall that sounds hollow, the paint a different age from the rest.", basis: "documented",
  },
  {
    id: "dragon-bones", name: "Dragon bones", art: "fossil", on: "wall", tier: "notable", years: [-500, 1950], where: [at.china], weight: 3,
    verb: "Dig out the bones", time: 180, loot: { "old-bones": [2, 4] },
    text: "Old stone bones in the cave earth. Any apothecary will buy them: ground dragon bone calms the heart and stops bleeding.",
    look: "Big teeth and bones in the red clay of the wall.", basis: "documented",
  },
  {
    id: "alchemist", name: "Alchemist's hearth", art: "still:clay", on: "floor", tier: "notable", years: [-200, 1600], where: [at.china], weight: 2,
    verb: "Search the hearth", time: 60, loot: { cinnabar: [1, 3], sulphur: [0, 2], saltpetre: [0, 1] }, fuel: 240,
    text: "A clay furnace, sealed pots and red powder: someone came here to cook cinnabar into the medicine of long life. The mountain was supposed to help.",
    look: "A small clay furnace with a ring of sealed pots.", basis: "documented",
  },
  {
    id: "poem-inscription", name: "Poem on the wall", art: "inscription:han", on: "wall", tier: "common", years: [200, 2100], where: [at.eastAsia], weight: 2.5, keeps: true,
    verb: "Read the poem", time: 30,
    text: "Four lines brushed and then cut: an official on his way to a distant post stopped here, drank with a friend, and wrote that the cave was older than both their troubles.",
    look: "Columns of characters cut into a smoothed face of rock.", basis: "documented",
  },
  {
    id: "silver-cache", name: "Bandits' silver", art: "ingots", on: "floor", tier: "prize", years: [900, 1949], where: [at.china], weight: 1.5,
    verb: "Take the silver", time: 40, loot: { "silver-ingot": [1, 3], silk: [0, 2] },
    text: "Boat-shaped ingots of tax silver, with the county's stamp still on them, under a bolt of silk.",
    look: "Something wrapped in oiled cloth, pushed into a hole.", basis: "inferred",
  },
  {
    id: "cliff-coffins", name: "Hanging coffins", art: "coffin:log", on: "floor", tier: "notable", years: [-1000, 1700], where: [[100, 22, 120, 31], at.southeastAsia], weight: 2.5,
    verb: "Look inside one", time: 180, loot: { "fine-cloth": [0, 1], "bronze-axe": [0, 1], "shell-beads": [0, 2] },
    text: "Coffins cut from single logs, carried up here somehow and set on stakes. Inside, bones, a bronze knife and cloth gone to threads.",
    look: "Log coffins resting on wooden pegs high in the cave.", basis: "documented",
  },
  // South and Southeast Asia
  {
    id: "rock-cut-cell", name: "Monk's cell", art: "bedroll:stone", on: "floor", tier: "common", years: [-250, 1300], where: [at.india], weight: 3,
    verb: "Search the cell", time: 40, loot: { "alms-bowl": [0, 1], "oil-lamp": [0, 1] }, fuel: 300,
    text: "A stone bed with a stone pillow, cut square from the rock, and a niche for a lamp. The donor's name is over the door: a merchant, a nun, a guild of weavers.",
    look: "A small square room with a rock-cut bench.", basis: "documented",
  },
  {
    id: "sadhu", name: "Ascetic's fire", art: "hearth:trident", on: "floor", tier: "common", years: [-500, 2100], where: [at.india], depth: [1, 2], weight: 2, flat: true,
    verb: "Search the ashes", time: 30, loot: { beads: [0, 1] }, fuel: 240,
    text: "A fire pit kept for years, an iron trident stuck in the ground, ash heaped for smearing on the body. The holy man has moved on, or is out begging.",
    look: "A neat fire pit with a trident planted beside it.", basis: "documented",
  },
  {
    id: "painted-shelter-india", name: "Painted hunters", art: "paint:hunt", on: "wall", tier: "notable", years: [-10000, 2100], where: [at.india, at.southernAfrica, at.africa], weight: 2.5, keeps: true,
    verb: "Hold your light to the wall", time: 60,
    text: "Thin red figures run with bows after deer and an animal that might be an eland. Others dance in a line. They are small, quick and sure.",
    look: "Small figures of people and animals painted in red.", basis: "documented",
  },
  // Africa
  {
    id: "rock-church", name: "Church in the rock", art: "relief:cross", on: "wall", tier: "prize", years: [500, 2100], where: [at.horn], weight: 4, keeps: true, glow: "#ffd080",
    verb: "Look at the paintings", time: 60,
    text: "The cave has been cut into a church: pillars left standing, crosses in the roof, and saints on every wall with wide dark eyes. A drum and a prayer stick lean in the corner. The priest climbs up here on feast days.",
    look: "Pillars and a carved cross, and painted faces looking out of the dark.", basis: "documented",
  },
  {
    id: "aksum-coins", name: "Coins in a pot", art: "hoard", on: "floor", tier: "prize", years: [300, 2100], where: [at.horn], weight: 1.5,
    verb: "Take the coins", time: 30, loot: { "old-coins": [2, 4] },
    text: "Small gold and bronze coins with a king's head and a cross between ears of wheat. Kings of Aksum, a long time dead.",
    look: "A small pot tucked under a ledge.", basis: "documented",
  },
  {
    id: "iron-smelt", name: "Old furnace", art: "still:clay", on: "floor", tier: "common", years: [-500, 1900], where: [at.africa], depth: [1, 1], weight: 2,
    verb: "Search the slag", time: 60, loot: { "iron-ore": [1, 3] },
    text: "A clay furnace and a heap of black slag. Smiths worked here out of sight, because smelting is not a thing to do in front of everyone.",
    look: "A broken clay shaft and a heap of glassy slag.", basis: "documented",
  },
  {
    id: "ancestor-pots", name: "Pots for the dead", art: "pots", on: "floor", tier: "notable", years: [-500, 1950], where: [at.africa], weight: 2,
    verb: "Leave them, or look", time: 40, loot: { beads: [0, 2], potsherds: [0, 1] },
    text: "Pots with beer once in them, set down for the ancestors who are buried further in. You take very little.",
    look: "Pots set in a row before a narrow place in the rock.", basis: "documented",
  },
];
