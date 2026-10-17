import type { CharacterScope } from "../characters/context-types";
import type { ItemDef } from "../../core/types";

/** Finished goods a shop sells: what each trade makes, and where and when.
 * `good` is the trade's good in goods.ts. Values are in small coin. */
export type Ware = ItemDef & { good: string; scope: CharacterScope };

const ALL = [-10000, 10001] as const;
const MEDITERRANEAN: CharacterScope["bounds"] = [-10, 28, 45, 47];

export const wares: Ware[] = [
  // Swords were a smith's dearest work until firearms pushed them aside.
  { id: "sword", name: "Sword", sprite: "tool", value: 40, hand: { strike: true, edge: true }, good: "ironwork", scope: { years: [-1600, 1700] },
    description: "A long blade with a crossguard, for war and for show; a year's wages for most who saw one." },
  { id: "mail-shirt", name: "Mail shirt", sprite: "tool", value: 60, good: "ironwork", scope: { years: [-300, 1600], cultures: ["european", "north-african-west-asian", "south-asian", "inner-eurasian"] },
    description: "Thousands of riveted iron rings, heavy on the shoulders and proof against a slash." },
  // Nailed horseshoes are attested in Europe from about the 5th century CE.
  { id: "horseshoe", name: "Horseshoe", sprite: "tool", value: 3, good: "ironwork", scope: { years: [450, 1950] },
    description: "A bent iron bar punched for nails, to keep a hoof from wearing on stony roads." },
  { id: "nails", name: "Nails", sprite: "tool", value: 1, good: "ironwork", scope: { years: [-800, 10001] },
    description: "A handful of hand-forged nails, square in section." },
  { id: "sickle", name: "Sickle", sprite: "tool", value: 4, hand: { strike: true, edge: true }, good: "ironwork", scope: { years: [-1200, 1950] },
    description: "A curved iron blade for cutting grain by the handful." },
  { id: "clay-pot", name: "Clay pot", sprite: "water", value: 2, good: "pots", scope: { years: [-7000, 1900] },
    description: "A round-bellied cooking pot, fired hard and blackened on the outside." },
  { id: "amphora", name: "Amphora", sprite: "water", value: 4, good: "pots", scope: { years: [-1500, 700], bounds: MEDITERRANEAN },
    description: "A tall two-handled jar with a pointed foot, for shipping wine and oil by the boatload." },
  // Hard-paste porcelain from Jingdezhen and the other Chinese kilns.
  { id: "porcelain-bowl", name: "Porcelain bowl", sprite: "water", value: 8, good: "pots", scope: { years: [600, 10001], cultures: ["east-asian", "southeast-asian"] },
    description: "A thin white bowl that rings when tapped, painted in cobalt blue." },
  { id: "wooden-bowl", name: "Wooden bowl", sprite: "wood", value: 1, good: "timber", scope: { years: [...ALL] },
    description: "A bowl turned or carved from a single block of wood." },
  { id: "candles", name: "Tallow candles", sprite: "torch", value: 2, good: "light", scope: { years: [0, 1950] },
    description: "Rendered animal fat poured round a wick; smoky, and cheaper than beeswax." },
  { id: "oil-lamp", name: "Oil lamp", sprite: "water", value: 2, good: "light", scope: { years: [-3000, 1900], cultures: ["european", "north-african-west-asian", "south-asian"] },
    description: "A small clay lamp with a spout for the wick, burning olive or sesame oil." },
  { id: "ale", name: "Ale", sprite: "water", value: 1, edible: 3, good: "drink", scope: { years: [-4000, 10001], cultures: ["european"] },
    description: "A tankard of ale, cloudy and only a little strong; safer than the well water." },
  { id: "wine", name: "Wine", sprite: "water", value: 3, edible: 2, good: "drink", scope: { years: [-3000, 10001], bounds: MEDITERRANEAN },
    description: "A bottle or jar of wine, usually drunk watered." },
  { id: "waterskin", name: "Waterskin", sprite: "water", value: 3, good: "leather", scope: { years: [...ALL] },
    description: "A goat's skin sewn up and tied at the neck, for carrying water on the road." },
  { id: "cloth-bolt", name: "Bolt of cloth", sprite: "wool", value: 8, good: "cloth", scope: { years: [-3000, 10001] },
    description: "A length of woven cloth rolled on itself, enough for a garment or two." },
  { id: "basket", name: "Basket", sprite: "reeds", value: 2, good: "pots", scope: { years: [...ALL] },
    description: "A woven basket of cane, willow or grass, for carrying and storing almost anything." },
  { id: "barrel", name: "Barrel", sprite: "wood", value: 6, good: "pots", scope: { years: [-300, 1950], cultures: ["european"] },
    description: "Bent staves bound with hoops, watertight, for ale, salt fish and anything that travels." },
  { id: "glazed-jar", name: "Glazed jar", sprite: "water", value: 5, good: "pots", scope: { years: [-200, 10001], cultures: ["east-asian", "southeast-asian"] },
    description: "A stoneware storage jar under a green glaze, for pickles, oil or rice wine." },
  { id: "cauldron", name: "Cauldron", sprite: "water", value: 15, good: "ironwork", scope: { years: [-800, 1950] },
    description: "A big iron cooking pot on three feet, the most valuable thing in many kitchens." },
  // The short-handled iron hoe was the field tool across most of Africa and much of Asia.
  { id: "hoe", name: "Hoe", sprite: "tool", value: 4, hand: { strike: true }, good: "ironwork", scope: { years: [-800, 10001], cultures: ["west-central-african", "east-southern-african", "south-asian", "east-asian", "southeast-asian"] },
    description: "An iron blade set across a short handle, for breaking and weeding the ground." },
  { id: "shears", name: "Shears", sprite: "tool", value: 5, good: "ironwork", scope: { years: [-500, 10001] },
    description: "Two blades joined by a springy bow, for clipping fleece and cloth." },
  { id: "saddle", name: "Saddle", sprite: "hide", value: 25, good: "leather", scope: { years: [-300, 10001], cultures: ["european", "north-african-west-asian", "inner-eurasian", "south-asian", "east-asian"] },
    description: "A wooden tree padded and covered in leather, with stirrups hung from it." },
  { id: "satchel", name: "Satchel", sprite: "hide", value: 4, good: "leather", scope: { years: [...ALL] },
    description: "A leather bag with a flap and a shoulder strap." },
  { id: "silk", name: "Bolt of silk", sprite: "wool", value: 30, good: "cloth", scope: { years: [-1500, 10001], cultures: ["east-asian"] },
    description: "Reeled silk woven into a glossy cloth, worth its weight in silver along the caravan roads." },
  { id: "rice-wine", name: "Rice wine", sprite: "water", value: 2, edible: 2, good: "drink", scope: { years: [-1000, 10001], cultures: ["east-asian", "southeast-asian"] },
    description: "Rice fermented with a mould starter, served warm or cold from a small flask." },
  { id: "palm-wine", name: "Palm wine", sprite: "water", value: 1, edible: 2, good: "drink", scope: { years: [...ALL], cultures: ["west-central-african"] },
    description: "Sap tapped from a palm that ferments by itself within the day; sweet in the morning, sour by night." },
  { id: "chicha", name: "Chicha", sprite: "water", value: 1, edible: 3, good: "drink", scope: { years: [...ALL], cultures: ["andean"] },
    description: "Maize beer brewed in big clay jars, drunk at every gathering and owed at every work party." },
  { id: "flatbread", name: "Flatbread", sprite: "bread", value: 1, edible: 8, good: "bread", scope: { years: [...ALL], cultures: ["north-african-west-asian", "south-asian", "inner-eurasian"] },
    description: "Dough slapped on the wall of a clay oven or a hot plate, eaten with everything." },
  { id: "tortillas", name: "Tortillas", sprite: "bread", value: 1, edible: 8, good: "bread", scope: { years: [...ALL], cultures: ["mesoamerican"] },
    description: "Lime-soaked maize ground on the metate and cooked on a clay griddle." },
  // Friction matches from the 1830s; safety matches from the 1850s.
  { id: "matches", name: "Matches", sprite: "torch", value: 1, good: "light", scope: { years: [1830, 10001] },
    description: "A box of strike-anywhere matches." },
  { id: "kerosene-lamp", name: "Kerosene lamp", sprite: "torch", value: 6, good: "light", scope: { years: [1860, 1970] },
    description: "A glass chimney over a flat wick, brighter than any candle and cheaper to burn." },
];

export const wareItems: Record<string, ItemDef> = Object.fromEntries(
  wares.map(({ good: _good, scope: _scope, ...def }) => [def.id, def]),
);
