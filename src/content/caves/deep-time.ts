import { at } from "./regions";
import type { CaveFind } from "./types";

const ICE_AGE = [-1000000, -9700] as const;

/** The Pleistocene and the first farmers: when a cave was a house, a
 * shrine and a grave. */
export const deepTimeFinds: CaveFind[] = [
  {
    id: "painted-beasts", name: "Painted animals", art: "paint:beasts", on: "wall", tier: "prize", years: [-40000, -9000], where: [at.europe, at.innerAsia], depth: [2, 9], weight: 4, keeps: true,
    verb: "Hold your light to the wall", time: 120,
    text: "Horses, bison and a lion run along the rock in black and red, and the bulges of the wall are their shoulders. In the moving light they seem to breathe. Someone made these far from daylight, on purpose.",
    look: "Animals painted on the wall in charcoal and ochre.", basis: "documented",
  },
  {
    id: "painted-recent", name: "Old paintings", art: "paint:beasts", on: "wall", tier: "prize", years: [-9000, 2100], where: [at.francoCantabria], depth: [3, 9], weight: 1.2, keeps: true,
    verb: "Hold your light to the wall", time: 120,
    text: "Bison and horses in black and red, under a skin of clear stone. Nobody alive knows who painted them, or that they are here.",
    look: "Animals painted on the wall, glazed over with flowstone.", basis: "documented",
  },
  {
    id: "hand-stencils", name: "Hand stencils", art: "paint:hands", on: "wall", tier: "notable", years: [-45000, -3000], weight: 3, keeps: true,
    where: [at.europe, at.southeastAsia, at.australia, at.southAmerica, at.maghreb],
    verb: "Lay your hand on one", time: 60,
    text: "Red hands, blown around with ochre from the mouth. Some are small. One is missing a finger joint. Yours fits over one almost exactly.",
    look: "Outlines of hands sprayed on the wall in red.", basis: "documented",
  },
  {
    id: "stone-lamp", name: "Stone lamp", art: "lamp", on: "floor", tier: "common", years: [-40000, -8000], where: [at.europe, at.innerAsia, at.westAsia], weight: 2, flat: true,
    verb: "Take the lamp", time: 10, loot: { "stone-lamp": 1 }, fuel: 240,
    text: "A hollowed stone with a crust of old fat. There is enough left to feed your own light.",
    look: "A shallow stone bowl, burnt black inside, set down on a ledge and never picked up.", basis: "documented",
  },
  {
    id: "bear-skulls", name: "Bear skulls", art: "bearskull", on: "floor", tier: "common", years: [-300000, -15000], where: [at.europe, at.innerAsia], weight: 3,
    verb: "Take the teeth", time: 60, loot: { "bear-tooth": [1, 3] },
    text: "Cave bears came here to sleep through the winter for thousands of years, and some never woke. You work the long teeth out of a jaw.",
    look: "Huge skulls with domed foreheads, among claw-polished rock.", basis: "documented",
  },
  {
    id: "ivory-figure", name: "Figure on a ledge", art: "figure", on: "floor", tier: "prize", years: [-40000, -10000], where: [at.europe, at.innerAsia], weight: 1.5,
    verb: "Take the figure", time: 10, loot: { "carved-figure": 1 },
    text: "A small carved figure, heavy-hipped and faceless, polished by many hands. It was put here carefully.",
    look: "A small carving standing on a ledge of rock.", basis: "documented",
  },
  {
    id: "bone-flute", name: "Flute among the ashes", art: "hearth", on: "floor", tier: "prize", years: [-42000, -10000], where: [at.europe], weight: 1, flat: true,
    verb: "Search the hearth", time: 60, loot: { "bone-flute": 1 }, fuel: 120,
    text: "In the old ash there is a vulture's wing bone with five holes cut in it. You blow, and it gives a thin clear note.",
    look: "An old hearth, the charcoal still black.", basis: "documented",
  },
  {
    id: "mammoth-ivory", name: "Tusk in the gravel", art: "tusk", on: "floor", tier: "notable", years: ICE_AGE, where: [at.europe, at.innerAsia, at.northAmerica], weight: 2,
    verb: "Dig out the tusk", time: 240, loot: { ivory: [1, 2] },
    text: "You dig the tusk out of the cave earth. The outside flakes; the core is good ivory.",
    look: "The curve of a tusk standing out of the floor.", basis: "documented",
  },
  {
    id: "old-hearth", name: "Old hearth", art: "hearth", on: "floor", tier: "common", years: [-400000, 1900], depth: [1, 2], weight: 3, flat: true,
    verb: "Search the hearth", time: 40, loot: { flint: [0, 2], "bone-needle": [0, 1] }, fuel: 180,
    text: "Ash, burnt bone and flakes of worked stone. People sat here. A few half-burnt brands will still take a flame.",
    look: "A ring of blackened stones and old ash.", basis: "documented",
  },
  {
    id: "ochre-burial", name: "Grave under ochre", art: "burial", on: "floor", tier: "prize", years: [-40000, -4000], weight: 2,
    verb: "Lift the grave goods", time: 300, loot: { "shell-beads": [1, 3], ochre: [1, 2], arrowheads: [0, 2] },
    text: "Someone was laid here on their side under red earth, with hundreds of pierced shells sewn to what they wore. You take the beads. The bones you leave as they lie.",
    look: "A shallow grave, the bones stained red, beads still lying in rows.", basis: "documented",
  },
  {
    id: "neanderthal", name: "Very old bones", art: "burial:plain", on: "floor", tier: "notable", years: [-300000, -38000], where: [at.europe, at.westAsia], weight: 2, keeps: true,
    verb: "Look closely", time: 60,
    text: "The skull is long and low with a heavy brow. Whoever this was, the others carried them in here and laid them down.",
    look: "A skeleton in a scooped hollow, the legs drawn up.", basis: "documented",
  },
  {
    id: "collective-burial", name: "Bones of many people", art: "ossuary", on: "floor", tier: "notable", years: [-7000, -1500], where: [at.europe, at.mediterranean, at.maghreb, at.levant], weight: 3,
    verb: "Search among the bones", time: 240, loot: { "stone-axe": [0, 1], "shell-beads": [0, 2], arrowheads: [1, 3], potsherds: [1, 2] },
    text: "A village buried its dead here for generations, moving the old bones aside for the new. Among them are the things they were given.",
    look: "Skulls set in a row along the wall, long bones stacked beside them.", basis: "documented",
  },
  {
    id: "snail-midden", name: "Snail-shell midden", art: "midden", on: "floor", tier: "common", years: [-9000, -3000], where: [at.maghreb], weight: 4, flat: true,
    verb: "Dig through the midden", time: 120, loot: { arrowheads: [0, 2], "shell-beads": [0, 1], "bone-needle": [0, 1], flint: [1, 2] },
    text: "Thousands of land-snail shells, ash and fire-cracked stone: people ate here season after season. There are worked flints in it, and an ostrich-eggshell bead.",
    look: "A grey heap of snail shells and ash against the wall.", basis: "documented",
  },
  {
    id: "cattle-paintings", name: "Painted herds", art: "paint:cattle", on: "wall", tier: "prize", years: [-6500, -1000], where: [at.maghreb, at.horn], weight: 4, keeps: true,
    verb: "Hold your light to the wall", time: 90,
    text: "Piebald cattle with lyre horns, and thin people walking with them, bows on their shoulders. Whoever painted this lived as you do, with their animals.",
    look: "Cattle and herders painted in red and white.", basis: "documented",
  },
  {
    id: "axe-hoard", name: "Axes under a stone", art: "axes", on: "floor", tier: "prize", years: [-5500, -2000], where: [at.europe, at.mediterranean], weight: 1.5,
    verb: "Lift the stone", time: 60, loot: { "stone-axe": [2, 4] },
    text: "Under the slab are polished axes of green stone laid edge up, never used. A gift to the ground, or a store someone never came back for.",
    look: "A flat stone that does not belong where it lies.", basis: "documented",
  },
  {
    id: "grain-pots", name: "Offering pots", art: "pots", on: "floor", tier: "common", years: [-7000, 500], weight: 2.5,
    where: [at.europe, at.mediterranean, at.westAsia, at.maghreb, at.india, at.china],
    verb: "Look in the pots", time: 40, loot: { potsherds: [1, 2], grain: [0, 2] },
    text: "Pots set under the drip to catch the water, some with burnt grain in them. A gift for a good year.",
    look: "Small pots placed where water falls from the roof.", basis: "documented",
  },
  {
    id: "rock-engravings", name: "Cut marks", art: "petroglyph", on: "wall", tier: "common", years: [-30000, 1800], weight: 2, keeps: true,
    verb: "Trace the marks", time: 40,
    text: "Lines, cups and a few animals pecked into the rock. You follow them with a finger. They meant something exact to someone.",
    look: "Figures and signs cut into the wall.", basis: "documented",
  },
  {
    id: "dreaming-art", name: "Painted ancestors", art: "paint:figures", on: "wall", tier: "prize", years: [-28000, 2100], where: [at.australia], weight: 5, keeps: true,
    verb: "Look, and do not touch", time: 90,
    text: "Tall figures with haloed heads and no mouths, painted in white, red and yellow, and repainted by the people whose place this is. You are a visitor here.",
    look: "Figures painted on the shelter wall, some fresh, some very old.", basis: "documented",
  },
  {
    id: "ochre-mine", name: "Old ochre workings", art: "seam:ochre", on: "wall", tier: "notable", years: [-40000, 1900], where: [at.australia, at.southernAfrica], weight: 3,
    verb: "Dig out ochre", time: 120, loot: { ochre: [3, 6] },
    text: "People have mined this red for longer than anyone can count. Stone hammers still lie under the face.",
    look: "A red seam, hollowed deep by old digging.", basis: "documented",
  },
  {
    id: "hobbit-bones", name: "Small bones", art: "burial:plain", on: "floor", tier: "notable", years: [-190000, -50000], where: [[116, -11, 127, -7]], weight: 5, keeps: true,
    verb: "Look closely", time: 60,
    text: "A grown person, by the teeth, but no taller than a child of four, with long arms and a head the size of a grapefruit. Stone flakes and the bones of dwarf elephants lie around.",
    look: "The skeleton of someone very small.", basis: "documented",
  },
];
