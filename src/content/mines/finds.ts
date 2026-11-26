import type { Box, SewerFind } from "../sewers/types";

const POTOSI_ANDES: Box = [-70, -23, -63, -14];
const CORNWALL: Box = [-6, 49.9, -4.1, 50.9];
const WIELICZKA: Box = [19.8, 49.8, 20.3, 50.2];
const HALLSTATT: Box = [13.3, 47.3, 13.9, 47.8];
const ROMAN_MINES: readonly Box[] = [[-9.5, 36, 3.5, 44], [-6, 50, 2, 55.5], [23.6, 37.5, 24.3, 38]];
const CATHOLIC: readonly Box[] = [[-10, 36, 25, 56], [-120, -56, -34, 33]];
const US: Box = [-125, 24, -66, 49.5];

/** What is found in a mine. "ore" in a loot stands for whatever this mine works. */
export const mineFinds: readonly SewerFind[] = [
  // Underfoot, anywhere.
  {
    id: "spilled-ore", name: "Spilled ore", art: "ore", on: "floor", tier: "common", kinds: ["metal"], weight: 5, flat: true,
    verb: "Gather up the ore", time: 30, loot: { ore: [1, 3] },
    text: "Lumps knocked off a passing tub and left where they fell. Nobody stops to pick up a few pounds.",
    look: "A scatter of heavy, glinting stones beside the rails.", basis: "inferred",
  },
  {
    id: "spilled-coal", name: "Spilled coal", art: "ore", on: "floor", tier: "common", kinds: ["coal"], weight: 5, flat: true,
    verb: "Gather up the coal", time: 30, loot: { coal: [2, 5] },
    text: "Coal shaken off the tubs on the bend. The boys gather it at the end of the shift to take home for the fire.",
    look: "Black lumps scattered along the road.", basis: "documented",
  },
  {
    id: "salt-lumps", name: "Salt lumps", art: "ore", on: "floor", tier: "common", kinds: ["salt"], weight: 5, flat: true,
    verb: "Pick up the salt", time: 20, loot: { salt: [1, 3] },
    text: "Grey lumps of rock salt trimmed off the blocks. Lick one and it's sharp and clean.",
    look: "Grey crystalline lumps on the floor.", basis: "inferred",
  },
  {
    id: "snap-tin", name: "Snap tin", art: "snap", on: "floor", tier: "common", years: [1800, 10001], weight: 3,
    verb: "Open the tin", time: 15, loot: { pasty: 1 },
    text: "Somebody's dinner in a dented tin, set on a ledge out of the rats' reach and forgotten. Still good.",
    look: "A battered tin box on a ledge.", basis: "inferred",
  },
  {
    id: "pasty-crust", name: "Pasty crust", art: "crust", on: "floor", tier: "common", where: [CORNWALL], weight: 2, flat: true, keeps: true,
    verb: "Leave it for the knockers", time: 5,
    text: "You leave it where it is. Miners here leave a corner of crust for the knockers, the little people of the mine. It costs nothing to be polite.",
    look: "A crust of pastry left on a stone, on purpose.", basis: "documented",
  },
  {
    id: "dropped-tools", name: "Tools", art: "tools", on: "floor", tier: "common", weight: 3,
    verb: "Take the tools", time: 20, loot: { tool: 1 },
    text: "A pick with a split shaft and a blunt gad, left for the smith to collect. They'll still do.",
    look: "A pick and a gad against the wall.", basis: "inferred",
  },
  {
    id: "candle-stubs", name: "Candle ends", art: "candles", on: "floor", tier: "common", years: [1300, 1930], kinds: ["metal", "salt"], weight: 3, flat: true,
    verb: "Take the candles", time: 10, loot: { candles: 1 }, fuel: 1800,
    text: "Tallow ends pressed into a lump of clay, the way the men stick them to their hats. Enough light for a while yet.",
    look: "Candle stubs stuck in a lump of clay.", basis: "documented",
  },
  {
    id: "carbide-tin", name: "Carbide tin", art: "snap", on: "floor", tier: "common", years: [1900, 1960], weight: 2,
    verb: "Take the carbide", time: 15, loot: { carbide: 1 }, fuel: 2400,
    text: "A screw-top tin of carbide for the lamps. You refill yours, and it hisses brighter.",
    look: "A small screw-top tin.", basis: "documented",
  },
  {
    id: "spare-lamp", name: "Safety lamp", art: "lamp", on: "floor", tier: "common", years: [1816, 1990], kinds: ["coal"], weight: 2,
    verb: "Take the oil", time: 20, fuel: 3000,
    text: "A spare lamp hung on a nail at the district. You top up your own from its oil.",
    look: "A brass safety lamp on a nail.", basis: "inferred",
  },
  {
    id: "pit-check", name: "Brass check", art: "tally", on: "floor", tier: "common", years: [1850, 1990], weight: 2, flat: true,
    verb: "Pick up the check", time: 5, loot: { "pit-check": 1 },
    text: "A numbered brass token. Each man hands one in at the top on the way down and takes it back on the way up. That is how they know who is still below.",
    look: "A small numbered brass disc in the dust.", basis: "documented",
  },
  {
    id: "abandoned-tub", name: "Empty tub", art: "tub", on: "floor", tier: "common", years: [1550, 10001], weight: 2, keeps: true,
    verb: "Look in the tub", time: 5,
    text: "Empty, with a wheel off. Somebody chalked a number on the side, so it gets counted at the top.",
    look: "A wooden tub off its rails.", basis: "documented",
  },
  // On the walls.
  {
    id: "rich-vein", name: "Rich vein", art: "vein", on: "wall", tier: "notable", kinds: ["metal"], weight: 3,
    verb: "Break out the ore", time: 90, loot: { "ore-rich": [1, 2] },
    text: "You knock along the vein till the rock rings different, and the good ore comes away in your hand.",
    look: "A bright streak of ore running across the rock.", basis: "inferred",
  },
  {
    id: "fern-fossil", name: "Fossil fern", art: "fossil", on: "wall", tier: "notable", kinds: ["coal"], weight: 2,
    verb: "Prise it loose", time: 60, loot: { "fern-fossil": 1 },
    text: "The roof shale here is full of them: fronds of fern three hundred million years old, as sharp as if they'd been pressed in a book.",
    look: "The print of a fern leaf in the roof.", basis: "documented",
  },
  {
    id: "chalk-marks", name: "Chalk marks", art: "chalk", on: "wall", tier: "common", weight: 2, keeps: true,
    verb: "Read the marks", time: 10,
    text: "Tallies of tubs filled, initials, a date and a warning: an X where the roof is bad. Every shift leaves its marks.",
    look: "Chalk marks on the rock.", basis: "documented",
  },
  {
    id: "st-barbara", name: "Shrine of Saint Barbara", art: "barbara", on: "wall", tier: "notable", where: CATHOLIC, years: [1300, 10001], weight: 1.5, keeps: true, heal: 5,
    verb: "Say a prayer", time: 30,
    text: "A painted saint in a niche, with a tower beside her and a candle burning. Barbara keeps miners from sudden death. You say what words you have.",
    look: "A little painted figure in a niche, a candle in front.", basis: "documented",
  },
  {
    id: "tio", name: "El Tío", art: "tio", on: "floor", tier: "notable", where: [POTOSI_ANDES], years: [1600, 10001], weight: 2, keeps: true, heal: 3,
    verb: "Leave coca for the Tío", time: 30,
    text: "A clay figure with horns and a huge grin, his lap full of coca leaves, cigarette ends and spilt drink. He owns the mine's riches and its dangers. You leave him something.",
    look: "A horned clay figure sitting in a niche, covered in offerings.", basis: "documented",
  },
  {
    id: "salt-relief", name: "Salt carving", art: "relief", on: "wall", tier: "notable", where: [WIELICZKA], years: [1600, 10001], weight: 3, keeps: true,
    verb: "Look closer", time: 20,
    text: "A carved scene in the grey salt: miners at work, a saint, a dragon. Carved by miners in their own time, with the same picks.",
    look: "Figures carved in the salt wall.", basis: "documented",
  },
  {
    id: "crystal-pocket", name: "Crystal pocket", art: "crystals", on: "wall", tier: "prize", kinds: ["metal"], depths: ["workings", "old"], weight: 1,
    verb: "Prise out a crystal", time: 120, loot: { "rock-crystal": [1, 2] },
    text: "The drill broke into a hollow lined with clear crystals, each one perfect. Miners keep these, or sell them to collectors.",
    look: "A hollow in the rock, glittering inside.", basis: "documented", glow: "#dff4ff",
  },
  {
    id: "trapped-men-board", name: "Chalked board", art: "board", on: "wall", tier: "notable", years: [1850, 1990], kinds: ["coal"], depths: ["old"], weight: 0.6, keeps: true,
    verb: "Read it", time: 30,
    text: "A board with messages written in chalk and coal: names, the time, 'the air is getting bad', 'tell my wife'. Men trapped after an explosion wrote like this. Some were found alive.",
    look: "Writing on a board nailed across a road.", basis: "documented",
  },
  // Rich, rare or old.
  {
    id: "nugget", name: "Nugget", art: "nugget", on: "floor", tier: "prize", kinds: ["metal"], ores: ["gold"], weight: 1,
    verb: "Pick up the nugget", time: 15, loot: { "gold-nugget": 1 },
    text: "A lump of gold the size of a bean, washed into a crack. Your heart goes fast.",
    look: "Something yellow in a crack in the floor.", basis: "inferred", glow: "#ffd860",
  },
  {
    id: "rich-ore-sack", name: "Hidden ore", art: "rucksack", on: "floor", tier: "prize", kinds: ["metal"], weight: 1,
    verb: "Open the sack", time: 30, loot: { "ore-rich": [2, 4] },
    text: "A sack of the best ore, hidden behind the timber by someone who meant to carry it out at the end of the shift.",
    look: "A sack tucked behind a prop.", basis: "inferred",
  },
  {
    id: "hallstatt-rucksack", name: "Ancient backpack", art: "rucksack", on: "floor", tier: "prize", where: [HALLSTATT], depths: ["old"], years: [1700, 10001], weight: 2,
    verb: "Lift it out of the salt", time: 90, loot: { salt: 2 },
    text: "A leather backpack with a wooden frame, kept by the salt for three thousand years. Bronze Age miners carried the salt up in these.",
    look: "Leather and wood poking out of the salt.", basis: "documented",
  },
  {
    id: "roman-lamp", name: "Roman lamp", art: "candles", on: "floor", tier: "prize", where: ROMAN_MINES, depths: ["old"], years: [1500, 10001], weight: 1, flat: true,
    verb: "Pick up the lamp", time: 15, loot: { "terracotta-lamp": 1 },
    text: "A clay lamp of the kind the Roman miners used, soot still at its nozzle, lying where it went out.",
    look: "A small clay lamp in the old workings.", basis: "documented",
  },
  {
    id: "roman-wheel", name: "Drainage wheel", art: "wheel", on: "wall", tier: "prize", where: ROMAN_MINES, depths: ["old"], years: [1500, 10001], weight: 1, keeps: true,
    verb: "Look at the wheel", time: 30,
    text: "A great wooden wheel, set in a chamber cut to fit it. Men trod it to lift water from the deep workings, one wheel above another. The Romans drained this mine by hand and foot.",
    look: "The rotted rim of a huge wooden wheel.", basis: "documented",
  },
  {
    id: "pony-harness", name: "Pony harness", art: "harness", on: "floor", tier: "notable", kinds: ["coal", "salt"], depths: ["old"], years: [1780, 10001], weight: 1.5, flat: true, keeps: true,
    verb: "Look at the harness", time: 15,
    text: "A pony's harness and a nameplate from a stall: Captain. Left behind when this district was sealed.",
    look: "A leather harness with brass on it.", basis: "inferred",
  },
  {
    id: "powder-keg", name: "Powder keg", art: "powder", on: "floor", tier: "notable", years: [1627, 1900], kinds: ["metal", "coal"], weight: 1.5, keeps: true,
    verb: "Leave it well alone", time: 5,
    text: "Black powder, the keg half full. You keep your lamp well away from it.",
    look: "A small wooden keg marked with a flame.", basis: "documented",
  },
  {
    id: "first-aid-station", name: "First-aid box", art: "snap", on: "floor", tier: "notable", years: [1900, 10001], depths: ["level"], weight: 1.5, heal: 25,
    verb: "Use the first-aid box", time: 60,
    text: "Bandages, splints and iodine in a box at the shaft bottom, as the law requires. You clean yourself up.",
    look: "A painted box with a red cross.", basis: "documented",
  },
  {
    id: "self-rescuer", name: "Self-rescuer", art: "snap", on: "floor", tier: "notable", years: [1960, 10001], kinds: ["coal"], weight: 1,
    verb: "Take the self-rescuer", time: 15, loot: { "gas-mask": 1 },
    text: "A filter self-rescuer: clamp it in your mouth and it turns carbon monoxide into something you can breathe for an hour.",
    look: "A steel canister on a belt clip.", basis: "documented",
  },
  {
    id: "canary-cage", name: "Canary", art: "cage", on: "floor", tier: "notable", years: [1896, 1986], kinds: ["coal"], weight: 1.5,
    verb: "Take the canary", time: 10, loot: { canary: 1 },
    text: "A canary in a small brass cage, hopping and chirping. It feels bad air before you do. Carry it.",
    look: "A little cage with a yellow bird in it.", basis: "documented",
  },
  {
    id: "us-scrip", name: "Company scrip", art: "tally", on: "floor", tier: "common", where: [US], years: [1880, 1950], kinds: ["coal"], weight: 1.5, flat: true,
    verb: "Pick up the scrip", time: 5, loot: { coin: 1 },
    text: "A brass token from the company store, stamped with the coal company's name. Good there and nowhere else.",
    look: "A small brass token.", basis: "documented",
  },
];
