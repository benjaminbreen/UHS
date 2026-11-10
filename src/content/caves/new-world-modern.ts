import { at } from "./regions";
import type { CaveFind } from "./types";

/** The Americas and the Pacific before and after contact. */
export const americasFinds: CaveFind[] = [
  {
    id: "rain-offerings", name: "Pots for the rain god", art: "pots", on: "floor", tier: "notable", years: [-1000, 1700], where: [at.mesoamerica], weight: 4,
    verb: "Look in the pots", time: 60, loot: { copal: [1, 3], jade: [0, 1], potsherds: [1, 2] },
    text: "Jars set under the drip to catch virgin water, each with a hole knocked in it to let its spirit go. Lumps of copal, a jade bead. The rain comes from places like this.",
    look: "Big jars standing in pools, glazed over with white stone.", basis: "documented",
  },
  {
    id: "crystal-skeleton", name: "Skeleton under flowstone", art: "burial:crystal", on: "floor", tier: "prize", years: [900, 2100], where: [at.mesoamerica], depth: [2, 9], weight: 2.5, keeps: true, glow: "#d8f0ff",
    verb: "Look, and step back", time: 60,
    text: "A young person lies where they were killed for the rain in a bad drought, and the dripping water has coated every bone in sparkling stone. Nobody has touched them since.",
    look: "A skeleton glittering as if frosted.", basis: "documented",
  },
  {
    id: "cave-glyphs", name: "Painted glyphs", art: "inscription:maya", on: "wall", tier: "notable", years: [-300, 2100], where: [at.mesoamerica], weight: 2, keeps: true,
    verb: "Look at the writing", time: 40,
    text: "Black glyphs and two lords facing each other: a date, a name, a visit to this cave by someone important. The paint is charcoal; the hand is quick.",
    look: "Blocks of painted signs on a smooth stretch of wall.", basis: "documented",
  },
  {
    id: "mummy-bundle", name: "Seated bundles", art: "mummy", on: "floor", tier: "prize", years: [-1000, 1800], where: [at.andes], weight: 4,
    verb: "Unwrap a bundle", time: 240, loot: { "fine-cloth": [1, 2], coca: [0, 2], quipu: [0, 1], turquoise: [0, 1] },
    text: "The dead sit wrapped in cloth with their knees to their chins, in the dry cold. Their families brought them food and news. Inside the wrappings are coca, a sling, a bag of knotted cords.",
    look: "Bundles the size of a crouching person, set in a row.", basis: "documented",
  },
  {
    id: "basket-cache", name: "Cached baskets", art: "basket", on: "floor", tier: "notable", years: [-9000, 1880], where: [at.southwest, at.northAmerica], weight: 3,
    verb: "Open the cache", time: 60, loot: { seeds: [1, 3], arrowheads: [0, 2], "grass-fibre": [0, 2], feathers: [0, 2] },
    text: "Baskets of seed, a net, sandals woven from sagebrush bark, duck decoys made of reeds with the feathers still on. Someone meant to come back in the autumn.",
    look: "Baskets and bundles under a slab at the dry back of the shelter.", basis: "documented",
  },
  {
    id: "pictographs", name: "Painted figures", art: "paint:figures", on: "wall", tier: "notable", years: [-4000, 1900], where: [at.northAmerica, at.southAmerica], weight: 2.5, keeps: true,
    verb: "Hold your light to the wall", time: 60,
    text: "Tall figures with no arms and staring eyes, in dark red, and beside them sheep, snakes and a spiral. A person came here alone to see something, and painted what they saw.",
    look: "Figures painted in red on the back wall.", basis: "documented",
  },
  {
    id: "turquoise-offering", name: "Prayer sticks", art: "altar:sticks", on: "floor", tier: "notable", years: [500, 2100], where: [at.southwest], weight: 2,
    verb: "Leave them be, or look", time: 30, loot: { turquoise: [0, 2], feathers: [0, 2] },
    text: "Painted sticks tied with feathers, standing in the dust with turquoise at their feet. These are prayers and they are still working. You take little, if anything.",
    look: "Feathered sticks planted in a row in the cave earth.", basis: "documented",
  },
  {
    id: "ground-sloth", name: "Dung of a giant", art: "guano", on: "floor", tier: "notable", years: [-40000, 2100], where: [at.southwest, at.southAmerica], weight: 1.5, flat: true,
    verb: "Dig into the heap", time: 90, loot: { "old-bones": [1, 2], hide: [0, 1] },
    text: "Dry dung in balls the size of a fist, deep as your knee, and in it a claw as long as your hand and a patch of coarse yellow hair. Whatever lived here was the size of an ox.",
    look: "A deep dry layer of something that is not earth.", basis: "documented",
  },
  {
    id: "pirate-cache", name: "Chest in the sand", art: "chest", on: "floor", tier: "prize", years: [1560, 1830], where: [at.caribbean], kinds: ["sea"], weight: 4,
    verb: "Force the chest", time: 120, loot: { "old-coins": [2, 5], "gold-ring": [0, 2], sword: [0, 1] },
    text: "Cut silver, a few gold coins, a cutlass. Mostly it is somebody's share of a small ship, hidden while they were sober.",
    look: "The corner of a chest showing above the sand at the back of the cave.", basis: "inferred",
  },
  {
    id: "maroon-camp", name: "Hidden camp", art: "bedroll", on: "floor", tier: "notable", years: [1520, 1870], where: [at.caribbean, at.southAmerica, at.usa], depth: [1, 2], weight: 2,
    verb: "Search the camp", time: 60, loot: { "clay-pot": [0, 1], tool: [0, 1], roots: [0, 2], tobacco: [0, 2] }, fuel: 240,
    text: "People who walked off a plantation lived here: a hearth screened so the smoke would not show, a cutlass, a hoe, a drum. They chose somewhere a horse cannot follow.",
    look: "Sleeping places and a screened hearth, well back from the mouth.", basis: "documented",
  },
  {
    id: "saltpetre-works", name: "Saltpetre vats", art: "vats", on: "floor", tier: "notable", years: [1775, 1870], where: [at.appalachia], weight: 5,
    verb: "Scrape the vats", time: 120, loot: { saltpetre: [2, 5] }, fuel: 300,
    text: "Wooden leaching vats, a trough of hollowed logs, and ox tracks baked into the clay. The cave earth was washed here for saltpetre to make powder for a war. Much of the digging was done by enslaved men.",
    look: "Square wooden vats and troughs standing in the dark.", basis: "documented",
  },
  {
    id: "moonshine-still", name: "Copper still", art: "still", on: "floor", tier: "prize", years: [1870, 1960], where: [at.usa], depth: [1, 2], weight: 4,
    verb: "Fill your jars", time: 120, loot: { moonshine: [2, 5] }, fuel: 300,
    text: "A copper pot, a worm in a barrel of spring water, and a row of jars. Corn liquor, made where the smoke goes up a crack and nobody sees it. The mash is still warm.",
    look: "A copper pot on a stone firebox, with a coil running into a barrel.", basis: "documented",
  },
];

/** The age of dynamite, plastic and cheap rifles. */
export const modernFinds: CaveFind[] = [
  {
    id: "guano-miners", name: "Guano miners' gear", art: "tools:cart", on: "floor", tier: "common", years: [1840, 1930], weight: 2,
    verb: "Search the gear", time: 60, loot: { guano: [2, 5], rope: [0, 1], candles: [0, 2] }, fuel: 300,
    text: "A barrow, sacks, a sieve and candle stubs. Guano went out of here by the ton to fields on the other side of the world.",
    look: "A barrow and a stack of sacks.", basis: "documented",
  },
  {
    id: "dynamite-box", name: "Wooden box", art: "crate:dynamite", on: "floor", tier: "notable", years: [1870, 1990], weight: 1.5,
    verb: "Open it very carefully", time: 60, loot: { dynamite: [1, 4], rope: [0, 1] },
    text: "Sticks of dynamite, sweating. Quarrymen or prospectors left it. You lift them out one at a time and do not breathe.",
    look: "A small wooden box with a faded red warning.", basis: "documented",
  },
  {
    id: "names-and-dates", name: "Names and dates", art: "inscription:graffiti", on: "wall", tier: "common", years: [1800, 2100], depth: [1, 2], weight: 2.5, keeps: true,
    verb: "Read the wall", time: 20,
    text: "Initials in candle smoke and paint, a heart, a regiment, a date from before your grandparents were born, and under it another from last year.",
    look: "Names smoked and scratched on the wall.", basis: "documented",
  },
  {
    id: "partisan-cache", name: "Crates under a tarpaulin", art: "crate:arms", on: "floor", tier: "prize", years: [1936, 1960], where: [at.europe, at.mediterranean, at.southeastAsia, at.china, at.japan], weight: 3,
    verb: "Prise open a crate", time: 120, loot: { rifle: [1, 2], ammunition: [2, 4], "tinned-food": [1, 3] },
    text: "Rifles in grease, ammunition, tins of meat and a radio with a dead battery. Fighters hid here during the war. Some of them never came back for it.",
    look: "Wooden crates with stencilled numbers, under rotting canvas.", basis: "documented",
  },
  {
    id: "war-refuge", name: "Shelter from the bombing", art: "bedroll", on: "floor", tier: "common", years: [1936, 1975], where: [at.europe, at.mediterranean, at.southeastAsia, at.eastAsia, at.horn], depth: [1, 2], weight: 2,
    verb: "Search the shelter", time: 60, loot: { candles: [0, 2], "tinned-food": [0, 2], matches: [0, 1] }, fuel: 300,
    text: "Mattresses, a cooking pot, a school exercise book. Families from the village slept here when the planes came over.",
    look: "Mattresses and pots along a dry wall.", basis: "documented",
  },
  {
    id: "arms-cache", name: "Arms cache", art: "crate:arms", on: "floor", tier: "prize", years: [1961, 2100], where: [at.horn, at.africa, at.westAsia, at.arabia, at.southeastAsia, at.southAmerica, at.mesoamerica, [60, 29, 75, 38]], weight: 3.5,
    verb: "Open a crate", time: 120, loot: { kalashnikov: [1, 3], ammunition: [2, 5], banknotes: [0, 1] },
    text: "Kalashnikovs wrapped in oiled sacking, with Cyrillic and Chinese stamps, and tins of ammunition. An army left them, or a front, or a man who sells to both. They have not been here long.",
    look: "Long wooden crates, one with the lid loose.", basis: "documented",
  },
  {
    id: "fighters-camp", name: "Fighters' camp", art: "bedroll:radio", on: "floor", tier: "notable", years: [1961, 2100], where: [at.horn, at.africa, at.westAsia, at.southeastAsia, at.southAmerica, at.mesoamerica], weight: 2.5,
    verb: "Search the camp", time: 60, loot: { "tinned-food": [1, 3], battery: [1, 3], ammunition: [0, 2], khat: [0, 2] }, fuel: 400,
    text: "Blankets, a radio, a field hospital's worth of bandages and a blackboard with the alphabet on it. A front lived, taught and operated in these caves for years, under the bombers.",
    look: "Blankets, a radio set and a blackboard propped on stones.", basis: "documented",
  },
  {
    id: "cocaine-bales", name: "Bales in plastic", art: "bale", on: "floor", tier: "prize", years: [1975, 2100], where: [at.caribbean, at.southAmerica, at.mesoamerica, [-10, 35, 5, 44], [-18, 4, -8, 16]], weight: 4,
    verb: "Take a bale", time: 60, loot: { cocaine: [1, 2], banknotes: [0, 1] },
    text: "Square bales taped in black plastic, each stamped with a scorpion. A boat dropped them and somebody is meant to collect. Whoever that is will be armed, and will know roughly how many there were.",
    look: "Black plastic bales stacked above the tide line, covered with a net.", basis: "documented",
  },
  {
    id: "grow-op", name: "Drying racks", art: "racks", on: "floor", tier: "notable", years: [1968, 2100], where: [at.usa, at.europe, at.mesoamerica, at.maghreb, at.southeastAsia], depth: [1, 2], weight: 1.5,
    verb: "Strip the racks", time: 90, loot: { cannabis: [2, 5] },
    text: "Strings of plants hung to dry out of sight of helicopters, and a camp stove. The smell reaches the mouth of the cave.",
    look: "Lines strung between stalagmites, heavy with drying plants.", basis: "inferred",
  },
  {
    id: "cavers-gear", name: "Cavers' depot", art: "pack", on: "floor", tier: "common", years: [1950, 2100], depth: [2, 9], weight: 2.5,
    verb: "Borrow from the depot", time: 30, loot: { rope: [1, 2], battery: [1, 3], "tinned-food": [0, 2] }, fuel: 900,
    text: "A sealed drum with spare batteries, a carbide tin, chocolate, and a survey notebook with this passage drawn in pencil. The last entry says the cave goes on.",
    look: "A blue plastic drum and a coil of rope, left neatly.", basis: "documented",
  },
  {
    id: "lost-caver", name: "Someone who did not get out", art: "skeleton:modern", on: "floor", tier: "notable", years: [1900, 2100], depth: [3, 9], weight: 1,
    verb: "Search the remains", time: 60, loot: { battery: [0, 2], banknotes: [0, 1], matches: [0, 1] },
    text: "Boots, a helmet, and a lamp with the switch still on. He sat down against the wall to wait. There is a letter in the breast pocket, which you leave where it is.",
    look: "A figure sitting against the wall, in a helmet.", basis: "inferred",
  },
  {
    id: "toxic-drums", name: "Leaking drums", art: "drums", on: "floor", tier: "common", years: [1960, 2100], where: [at.usa, at.europe, at.italy], depth: [1, 2], weight: 1, keeps: true,
    verb: "Look, and keep back", time: 20,
    text: "Rusted drums with the labels scraped off, dumped down here by a firm that was paid to take them somewhere else. The pool beside them has a skin on it.",
    look: "Rusting steel drums, one split, in a stain of something green.", basis: "documented",
  },
  {
    id: "beer-cans", name: "Party leavings", art: "tins", on: "floor", tier: "common", years: [1955, 2100], depth: [1, 1], weight: 2, flat: true,
    verb: "Pick through it", time: 20, loot: { matches: [0, 1], "beer-bottle": [0, 2] }, fuel: 200,
    text: "A fire ring, crushed cans, a cassette tape pulled out in loops and a half-burnt candle in a bottle.",
    look: "A ring of stones, cans and bottles.", basis: "documented",
  },
  {
    id: "bat-loggers", name: "Scientists' instruments", art: "radio:logger", on: "floor", tier: "common", years: [1985, 2100], weight: 1, keeps: true,
    verb: "Read the tag", time: 20,
    text: "A grey box blinking once a minute, counting bats as they leave. The tag gives a university and asks you, politely, not to move it.",
    look: "A small grey box strapped to a stalagmite.", basis: "documented",
  },
  {
    id: "smugglers-fuel", name: "Jerrycans and sacks", art: "drums:jerry", on: "floor", tier: "notable", years: [1950, 2100], where: [at.maghreb, at.westAsia, at.arabia, at.horn, [60, 24, 75, 38]], weight: 2.5,
    verb: "Take what is useful", time: 60, loot: { tobacco: [1, 4], tea: [0, 2], banknotes: [0, 1] }, fuel: 900,
    text: "Jerrycans of fuel, cartons of cigarettes and sacks of sugar, waiting for the next truck across the border at night. You top up your lamp.",
    look: "Jerrycans and cartons stacked on pallets.", basis: "inferred",
  },
];
