import type { CultureId } from "../history/types";
import type { WorldSetting } from "../geography/types";
import type { ItemDef } from "../../core/types";
import { hash } from "../../core/random";

export type VegetableShape = "head" | "bulb" | "root" | "pod" | "fruit" | "leaf";
export type GardenPlant = {
  name: string;
  latin: string;
  from?: number;
  to?: number;
  /** How its icon is drawn, and in what two colours. */
  shape: VegetableShape;
  colors: readonly [string, string];
};

type Garden = {
  plants: readonly GardenPlant[];
  evidence: { status: "documented" | "inferred"; note: string; sources: readonly string[] };
};

// Years are when a plant was a garden commonplace in the region, not its
// first attestation; the New World plants arrive with the Columbian exchange.
const gardens: Record<CultureId, Garden> = {
  european: {
    plants: [
      { name: "Colewort", latin: "Brassica oleracea", to: 1500, shape: "leaf", colors: ["#5f8a52", "#86b070"] },
      { name: "Cabbage", latin: "Brassica oleracea var. capitata", from: 1100, shape: "head", colors: ["#a8c878", "#6f9a48"] },
      { name: "Red cabbage", latin: "Brassica oleracea var. capitata f. rubra", from: 1300, shape: "head", colors: ["#8a3a6a", "#5a2a58"] },
      { name: "Leeks", latin: "Allium ampeloprasum", shape: "bulb", colors: ["#e6e2c8", "#5f8a3a"] },
      { name: "Onions", latin: "Allium cepa", shape: "bulb", colors: ["#c08a4a", "#6f8a3a"] },
      { name: "Garlic", latin: "Allium sativum", shape: "bulb", colors: ["#ece6d8", "#8a9a5a"] },
      { name: "Broad beans", latin: "Vicia faba", shape: "pod", colors: ["#7aa048", "#5a7a34"] },
      { name: "Peas", latin: "Pisum sativum", shape: "pod", colors: ["#8ab852", "#5f8a34"] },
      { name: "Turnips", latin: "Brassica rapa", shape: "root", colors: ["#e8dccc", "#6f9a48"] },
      { name: "Parsnips", latin: "Pastinaca sativa", shape: "root", colors: ["#e8d8a8", "#6f9a48"] },
      { name: "Carrots", latin: "Daucus carota subsp. sativus", from: 1600, shape: "root", colors: ["#e07a2a", "#5f9a3a"] },
      { name: "Kidney beans", latin: "Phaseolus vulgaris", from: 1550, shape: "pod", colors: ["#8a2a2a", "#6a8a3a"] },
      { name: "Tomatoes", latin: "Solanum lycopersicum", from: 1800, shape: "fruit", colors: ["#d0402c", "#4f8a34"] },
    ],
    evidence: {
      status: "documented",
      note: "Medieval kitchen gardens grew worts, alliums, beans and peas and roots; red cabbage is described from the fourteenth century, the orange carrot from the seventeenth.",
      sources: ["https://en.wikipedia.org/wiki/Kitchen_garden", "https://en.wikipedia.org/wiki/Red_cabbage"],
    },
  },
  "north-african-west-asian": {
    plants: [
      { name: "Onions", latin: "Allium cepa", shape: "bulb", colors: ["#c08a4a", "#6f8a3a"] },
      { name: "Garlic", latin: "Allium sativum", shape: "bulb", colors: ["#ece6d8", "#8a9a5a"] },
      { name: "Leeks", latin: "Allium ampeloprasum", shape: "bulb", colors: ["#e6e2c8", "#5f8a3a"] },
      { name: "Lettuce", latin: "Lactuca sativa", shape: "leaf", colors: ["#9cc860", "#6a9a40"] },
      { name: "Cucumbers", latin: "Cucumis sativus", from: -500, shape: "fruit", colors: ["#4f7a34", "#8ab052"] },
      { name: "Chickpeas", latin: "Cicer arietinum", shape: "pod", colors: ["#c8b070", "#7a8a44"] },
      { name: "Lentils", latin: "Lens culinaris", shape: "pod", colors: ["#b89a58", "#7a8a44"] },
      { name: "Jute mallow", latin: "Corchorus olitorius", shape: "leaf", colors: ["#4f7a34", "#7aa048"] },
      { name: "Aubergines", latin: "Solanum melongena", from: 800, shape: "fruit", colors: ["#4a2a5a", "#5f8a3a"] },
      { name: "Spinach", latin: "Spinacia oleracea", from: 900, shape: "leaf", colors: ["#3f6a30", "#5f8a3a"] },
      { name: "Okra", latin: "Abelmoschus esculentus", from: 1200, shape: "pod", colors: ["#6f9a48", "#4f7a34"] },
      { name: "Tomatoes", latin: "Solanum lycopersicum", from: 1850, shape: "fruit", colors: ["#d0402c", "#4f8a34"] },
    ],
    evidence: {
      status: "documented",
      note: "Egyptian and Mesopotamian gardens grew alliums, lettuce and pulses from the third millennium BC; aubergine and spinach spread west with the Arab agricultural expansion.",
      sources: ["https://en.wikipedia.org/wiki/Arab_Agricultural_Revolution"],
    },
  },
  "inner-eurasian": {
    plants: [
      { name: "Turnips", latin: "Brassica rapa", shape: "root", colors: ["#e8dccc", "#6f9a48"] },
      { name: "Radishes", latin: "Raphanus sativus", shape: "root", colors: ["#c84a5a", "#6f9a48"] },
      { name: "Wild onions", latin: "Allium ramosum", to: 1000, shape: "bulb", colors: ["#d8c8b8", "#6f8a3a"] },
      { name: "Onions", latin: "Allium cepa", from: 700, shape: "bulb", colors: ["#c08a4a", "#6f8a3a"] },
      { name: "Garlic", latin: "Allium sativum", from: 700, shape: "bulb", colors: ["#ece6d8", "#8a9a5a"] },
      { name: "Hemp", latin: "Cannabis sativa", shape: "leaf", colors: ["#5a7a3a", "#8a9a5a"] },
      { name: "Cabbage", latin: "Brassica oleracea var. capitata", from: 1100, shape: "head", colors: ["#a8c878", "#6f9a48"] },
      { name: "Cucumbers", latin: "Cucumis sativus", from: 1300, shape: "fruit", colors: ["#4f7a34", "#8ab052"] },
      { name: "Dill", latin: "Anethum graveolens", from: 1000, shape: "leaf", colors: ["#8ab052", "#c8c070"] },
      { name: "Potatoes", latin: "Solanum tuberosum", from: 1800, shape: "root", colors: ["#b89060", "#6f8a3a"] },
    ],
    evidence: {
      status: "inferred",
      note: "Forest-steppe and southern Siberian villages kept small plots of turnip, radish and hemp beside herding and grain; cabbage and cucumber came in with Rus' settlement.",
      sources: ["https://en.wikipedia.org/wiki/Turnip", "https://en.wikipedia.org/wiki/Russian_cuisine"],
    },
  },
  "south-asian": {
    plants: [
      { name: "Brinjal", latin: "Solanum melongena", shape: "fruit", colors: ["#5a2a6a", "#5f8a3a"] },
      { name: "Okra", latin: "Abelmoschus esculentus", shape: "pod", colors: ["#6f9a48", "#4f7a34"] },
      { name: "Bottle gourds", latin: "Lagenaria siceraria", shape: "fruit", colors: ["#a8c078", "#6f8a3a"] },
      { name: "Bitter gourds", latin: "Momordica charantia", shape: "fruit", colors: ["#5f9a3a", "#3f6a2a"] },
      { name: "Mustard greens", latin: "Brassica juncea", shape: "leaf", colors: ["#5f9a3a", "#a8b048"] },
      { name: "Cucumbers", latin: "Cucumis sativus", shape: "fruit", colors: ["#4f7a34", "#8ab052"] },
      { name: "Coriander", latin: "Coriandrum sativum", shape: "leaf", colors: ["#6a9a40", "#9cc860"] },
      { name: "Onions", latin: "Allium cepa", shape: "bulb", colors: ["#c08a4a", "#6f8a3a"] },
      { name: "Chillies", latin: "Capsicum annuum", from: 1550, shape: "fruit", colors: ["#c8302a", "#4f8a34"] },
      { name: "Tomatoes", latin: "Solanum lycopersicum", from: 1850, shape: "fruit", colors: ["#d0402c", "#4f8a34"] },
    ],
    evidence: {
      status: "documented",
      note: "Brinjal, gourds and cucumber were domesticated in or near South Asia; the chilli arrived with the Portuguese in the sixteenth century and displaced long pepper.",
      sources: ["https://en.wikipedia.org/wiki/Eggplant", "https://en.wikipedia.org/wiki/Chili_pepper"],
    },
  },
  "east-asian": {
    plants: [
      { name: "Mallow", latin: "Malva verticillata", to: 1500, shape: "leaf", colors: ["#5f8a48", "#a878a8"] },
      { name: "Chinese cabbage", latin: "Brassica rapa subsp. pekinensis", from: 600, shape: "head", colors: ["#d8e0a8", "#8ab052"] },
      { name: "Pak choi", latin: "Brassica rapa subsp. chinensis", shape: "head", colors: ["#e8ecd8", "#5f9a3a"] },
      { name: "Garlic chives", latin: "Allium tuberosum", shape: "leaf", colors: ["#4f8a34", "#e8e8d8"] },
      { name: "Scallions", latin: "Allium fistulosum", shape: "bulb", colors: ["#ecece0", "#5f9a3a"] },
      { name: "Daikon", latin: "Raphanus sativus var. longipinnatus", shape: "root", colors: ["#ece8e0", "#6f9a48"] },
      { name: "Water spinach", latin: "Ipomoea aquatica", shape: "leaf", colors: ["#5f9a3a", "#8ab052"] },
      { name: "Eggplants", latin: "Solanum melongena", from: 500, shape: "fruit", colors: ["#5a2a6a", "#5f8a3a"] },
      { name: "Chilli peppers", latin: "Capsicum annuum", from: 1650, shape: "fruit", colors: ["#c8302a", "#4f8a34"] },
    ],
    evidence: {
      status: "documented",
      note: "Mallow was the chief leaf vegetable of early China, named first among the five vegetables; the Chinese cabbage took its place in later imperial gardens.",
      sources: ["https://en.wikipedia.org/wiki/Malva_verticillata", "https://en.wikipedia.org/wiki/Chinese_cabbage"],
    },
  },
  "southeast-asian": {
    plants: [
      { name: "Water spinach", latin: "Ipomoea aquatica", shape: "leaf", colors: ["#5f9a3a", "#8ab052"] },
      { name: "Yardlong beans", latin: "Vigna unguiculata subsp. sesquipedalis", shape: "pod", colors: ["#7aa048", "#5a7a34"] },
      { name: "Lemongrass", latin: "Cymbopogon citratus", shape: "leaf", colors: ["#a8b860", "#6f8a3a"] },
      { name: "Galangal", latin: "Alpinia galanga", shape: "root", colors: ["#d8b890", "#c86a4a"] },
      { name: "Bitter gourds", latin: "Momordica charantia", shape: "fruit", colors: ["#5f9a3a", "#3f6a2a"] },
      { name: "Eggplants", latin: "Solanum melongena", shape: "fruit", colors: ["#5a2a6a", "#5f8a3a"] },
      { name: "Chillies", latin: "Capsicum frutescens", from: 1550, shape: "fruit", colors: ["#c8302a", "#4f8a34"] },
    ],
    evidence: {
      status: "inferred",
      note: "House gardens of greens, gourds, beans and aromatics beside the rice field; chillies were taken up within a century of Portuguese and Spanish contact.",
      sources: ["https://en.wikipedia.org/wiki/Home_garden"],
    },
  },
  "west-central-african": {
    plants: [
      { name: "Okra", latin: "Abelmoschus esculentus", shape: "pod", colors: ["#6f9a48", "#4f7a34"] },
      { name: "Garden eggs", latin: "Solanum aethiopicum", shape: "fruit", colors: ["#e8e0b8", "#5f8a3a"] },
      { name: "Cowpeas", latin: "Vigna unguiculata", shape: "pod", colors: ["#c8b890", "#6f8a3a"] },
      { name: "Egusi melons", latin: "Citrullus mucosospermus", shape: "fruit", colors: ["#6f9a48", "#c8d8a0"] },
      { name: "Jute mallow", latin: "Corchorus olitorius", shape: "leaf", colors: ["#4f7a34", "#7aa048"] },
      { name: "Amaranth greens", latin: "Amaranthus hybridus", shape: "leaf", colors: ["#6a8a3a", "#a84a5a"] },
      { name: "Chillies", latin: "Capsicum frutescens", from: 1550, shape: "fruit", colors: ["#c8302a", "#4f8a34"] },
      { name: "Tomatoes", latin: "Solanum lycopersicum", from: 1750, shape: "fruit", colors: ["#d0402c", "#4f8a34"] },
    ],
    evidence: {
      status: "documented",
      note: "Cowpea, okra, garden egg and egusi are West African domesticates; leaf vegetables were the bulk of the compound garden.",
      sources: ["https://en.wikipedia.org/wiki/Cowpea", "https://en.wikipedia.org/wiki/Solanum_aethiopicum"],
    },
  },
  "east-southern-african": {
    plants: [
      { name: "Cowpeas", latin: "Vigna unguiculata", shape: "pod", colors: ["#c8b890", "#6f8a3a"] },
      { name: "Amaranth greens", latin: "Amaranthus hybridus", shape: "leaf", colors: ["#6a8a3a", "#a84a5a"] },
      { name: "Spider plant", latin: "Cleome gynandra", shape: "leaf", colors: ["#5f8a3a", "#e8d8e8"] },
      { name: "African nightshade", latin: "Solanum scabrum", shape: "leaf", colors: ["#4f7a34", "#3a2a4a"] },
      { name: "Bottle gourds", latin: "Lagenaria siceraria", shape: "fruit", colors: ["#a8c078", "#6f8a3a"] },
      { name: "Pumpkins", latin: "Cucurbita maxima", from: 1600, shape: "fruit", colors: ["#d8802a", "#5f8a3a"] },
      { name: "Kale", latin: "Brassica oleracea var. acephala", from: 1900, shape: "leaf", colors: ["#3f6a4a", "#5f8a5a"] },
    ],
    evidence: {
      status: "inferred",
      note: "Gathered and grown leaf vegetables beside the sorghum and millet fields; pumpkins arrived through the Portuguese coast, sukuma kale with colonial settlement.",
      sources: ["https://en.wikipedia.org/wiki/Cleome_gynandra"],
    },
  },
  mesoamerican: {
    plants: [
      { name: "Squash", latin: "Cucurbita pepo", shape: "fruit", colors: ["#e0b040", "#5f8a3a"] },
      { name: "Chayote", latin: "Sechium edule", shape: "fruit", colors: ["#a8c870", "#6f9a48"] },
      { name: "Tomatillos", latin: "Physalis philadelphica", shape: "fruit", colors: ["#a8c060", "#d8d0a0"] },
      { name: "Chillies", latin: "Capsicum annuum", shape: "fruit", colors: ["#c8302a", "#4f8a34"] },
      { name: "Amaranth", latin: "Amaranthus hypochondriacus", shape: "leaf", colors: ["#a84a5a", "#6a8a3a"] },
      { name: "Common beans", latin: "Phaseolus vulgaris", shape: "pod", colors: ["#6f9a48", "#8a4a3a"] },
      { name: "Epazote", latin: "Dysphania ambrosioides", shape: "leaf", colors: ["#6a8a3a", "#a8b060"] },
      { name: "Onions", latin: "Allium cepa", from: 1530, shape: "bulb", colors: ["#c08a4a", "#6f8a3a"] },
    ],
    evidence: {
      status: "documented",
      note: "Chilli, squash, beans, tomatillo and amaranth were grown in Mesoamerican house gardens long before contact.",
      sources: ["https://en.wikipedia.org/wiki/Mesoamerican_cuisine"],
    },
  },
  andean: {
    plants: [
      { name: "Oca", latin: "Oxalis tuberosa", shape: "root", colors: ["#d8604a", "#6f9a48"] },
      { name: "Ulluco", latin: "Ullucus tuberosus", shape: "root", colors: ["#e0c040", "#c8506a"] },
      { name: "Mashua", latin: "Tropaeolum tuberosum", shape: "root", colors: ["#e0a040", "#6f9a48"] },
      { name: "Tarwi", latin: "Lupinus mutabilis", shape: "pod", colors: ["#8ab052", "#c8c0e0"] },
      { name: "Ají", latin: "Capsicum baccatum", shape: "fruit", colors: ["#e0a020", "#4f8a34"] },
      { name: "Broad beans", latin: "Vicia faba", from: 1550, shape: "pod", colors: ["#7aa048", "#5a7a34"] },
      { name: "Onions", latin: "Allium cepa", from: 1550, shape: "bulb", colors: ["#c08a4a", "#6f8a3a"] },
    ],
    evidence: {
      status: "documented",
      note: "The Andean tubers and tarwi lupin were grown in highland plots beside the potato; the Spanish brought fava beans and onions, which took at altitude.",
      sources: ["https://en.wikipedia.org/wiki/Oxalis_tuberosa", "https://en.wikipedia.org/wiki/Lupinus_mutabilis"],
    },
  },
  "other-indigenous-american": {
    plants: [
      { name: "Squash", latin: "Cucurbita pepo", shape: "fruit", colors: ["#e0b040", "#5f8a3a"] },
      { name: "Common beans", latin: "Phaseolus vulgaris", from: 800, shape: "pod", colors: ["#6f9a48", "#8a4a3a"] },
      { name: "Sunflowers", latin: "Helianthus annuus", shape: "leaf", colors: ["#e0c030", "#6a4a2a"] },
      { name: "Sunchokes", latin: "Helianthus tuberosus", shape: "root", colors: ["#c8a070", "#6f9a48"] },
      { name: "Goosefoot", latin: "Chenopodium berlandieri", to: 1400, shape: "leaf", colors: ["#7a9a58", "#a8a070"] },
      { name: "Cabbage", latin: "Brassica oleracea var. capitata", from: 1650, shape: "head", colors: ["#a8c878", "#6f9a48"] },
    ],
    evidence: {
      status: "documented",
      note: "The Eastern Agricultural Complex of goosefoot, sunflower and squash came before maize and beans; gardens kept squash and sunflower beside the three sisters.",
      sources: ["https://en.wikipedia.org/wiki/Eastern_Agricultural_Complex"],
    },
  },
  "australian-pacific": {
    plants: [
      { name: "Slippery cabbage", latin: "Abelmoschus manihot", shape: "leaf", colors: ["#5f9a3a", "#8ab052"] },
      { name: "Taro leaves", latin: "Colocasia esculenta", shape: "leaf", colors: ["#3f7a4a", "#8a4a6a"] },
      { name: "Kūmara", latin: "Ipomoea batatas", from: 1000, shape: "root", colors: ["#a8505a", "#6f9a48"] },
      { name: "Bottle gourds", latin: "Lagenaria siceraria", shape: "fruit", colors: ["#a8c078", "#6f8a3a"] },
      { name: "Cabbage", latin: "Brassica oleracea var. capitata", from: 1820, shape: "head", colors: ["#a8c878", "#6f9a48"] },
      { name: "Potatoes", latin: "Solanum tuberosum", from: 1800, shape: "root", colors: ["#b89060", "#6f8a3a"] },
    ],
    evidence: {
      status: "inferred",
      note: "Pacific gardens kept leaf crops such as bele beside taro and yam; kūmara reached Polynesia from South America before European contact.",
      sources: ["https://en.wikipedia.org/wiki/Abelmoschus_manihot", "https://en.wikipedia.org/wiki/Sweet_potato"],
    },
  },
};

export const vegetableId = (plant: Pick<GardenPlant, "name">) =>
  plant.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");

/** Every garden plant as something to carry and eat, each once. */
export const vegetables: Record<string, GardenPlant> = Object.fromEntries(
  Object.values(gardens).flatMap((g) => g.plants.map((p) => [vegetableId(p), p])),
);
const plantUse: Record<string, string> = {
  "colewort": "loose-leaved cabbage boiled into the daily pottage.",
  "cabbage": "tight heads that keep into winter and pickle well.",
  "red-cabbage": "purple heads, stewed or pickled, that stain the pot.",
  "leeks": "hardy stalks left in the ground and pulled all winter for soup.",
  "onions": "dried and hung in strings; they flavour nearly every pot.",
  "garlic": "pungent cloves eaten raw or cooked, and trusted as medicine.",
  "broad-beans": "large pods dried for winter, then boiled into a thick mash.",
  "peas": "eaten green in summer or dried and stewed with bacon or bread.",
  "turnips": "a plain root that feeds people and cattle through the cold months.",
  "parsnips": "a sweet pale root, sweeter still after frost.",
  "carrots": "orange roots eaten raw, boiled or stewed.",
  "kidney-beans": "dried beans soaked overnight and stewed slowly.",
  "tomatoes": "soft red fruit cooked into sauces or eaten sliced with salt.",
  "lettuce": "crisp leaves eaten raw with oil and vinegar.",
  "cucumbers": "cool, watery fruit eaten fresh or put up in brine.",
  "chickpeas": "hard little peas soaked, boiled and mashed with oil.",
  "lentils": "small dried pulses that cook quickly into a filling soup.",
  "jute-mallow": "slippery leaves chopped fine and stewed into a green soup.",
  "aubergines": "glossy fruit fried, stuffed or roasted in the embers.",
  "spinach": "tender leaves wilted in a pan or folded into pastry.",
  "okra": "green pods that thicken a stew as they cook.",
  "radishes": "quick, peppery roots eaten raw with bread and salt.",
  "wild-onions": "small sharp bulbs dug from the ground to season a meal.",
  "hemp": "grown for its tough fibre and oily seeds.",
  "dill": "feathery leaves and seeds for pickles, fish and soothing a stomach.",
  "potatoes": "starchy tubers boiled, roasted or baked; a whole winter's food from a small plot.",
  "brinjal": "purple fruit cooked soft with spices or roasted and mashed.",
  "bottle-gourds": "a pale gourd cooked young, or dried hard to make a vessel.",
  "bitter-gourds": "warty green fruit eaten for its sharp bitterness.",
  "mustard-greens": "peppery leaves cooked down with oil and spice.",
  "coriander": "fresh leaves and dried seeds that season curries, stews and breads.",
  "chillies": "hot pods eaten fresh, dried or ground to fire a dish.",
  "mallow": "soft leaves boiled as a pot-herb or stewed to a thick soup.",
  "chinese-cabbage": "tall, pale heads stir-fried, stewed or salted and fermented.",
  "pak-choi": "crisp white stalks and dark leaves, cooked quickly in a hot pan.",
  "garlic-chives": "flat green leaves with a mild garlic bite, for dumplings and noodles.",
  "scallions": "slender green onions chopped over nearly every dish.",
  "daikon": "a long white radish eaten raw, simmered or pickled.",
  "water-spinach": "hollow-stemmed greens that grow in wet ground and cook in a moment.",
  "eggplants": "long purple fruit grilled, braised or stirred into curry.",
  "chilli-peppers": "small fiery peppers pounded into pastes and sauces.",
  "yardlong-beans": "pods as long as an arm, cut up and stir-fried.",
  "lemongrass": "fragrant stalks bruised into soups and curries.",
  "galangal": "a hard, peppery rhizome sliced into soups and pastes.",
  "garden-eggs": "small bitter fruit eaten raw, or stewed into sauces.",
  "cowpeas": "black-eyed beans dried for storage and boiled into stews and fritters.",
  "egusi-melons": "grown for their seeds, ground to thicken soup.",
  "amaranth-greens": "tender leaves stewed in soups and sauces.",
  "spider-plant": "slightly bitter leaves cooked slowly, often with milk.",
  "african-nightshade": "dark leaves boiled long to soften their bitterness.",
  "pumpkins": "great hard-skinned fruit that keep for months and roast sweet.",
  "kale": "tough curly leaves that stand through winter and stew down tender.",
  "squash": "hard-skinned fruit stored whole, its flesh roasted and its seeds toasted.",
  "chayote": "a pale, crisp squash cooked like a vegetable or eaten raw.",
  "tomatillos": "small husked green fruit ground into sharp sauces.",
  "amaranth": "grown for tiny seeds popped or ground, and for its leaves.",
  "common-beans": "dried beans stewed slowly; with maize, the heart of a meal.",
  "epazote": "a pungent herb cooked with beans.",
  "oca": "small waxy tubers, sweetened in the sun before cooking.",
  "ulluco": "bright, slippery tubers boiled into highland stews.",
  "mashua": "peppery tubers cooked and eaten in the high Andes.",
  "tarwi": "bitter seeds soaked for days in running water, then eaten as a rich bean.",
  "aji": "hot peppers that season nearly every Andean dish.",
  "sunflowers": "tall heads grown for oily seeds eaten roasted or ground.",
  "sunchokes": "knobbly sweet tubers dug in autumn and eaten raw or boiled.",
  "goosefoot": "grown for its starchy seeds and its leaves, eaten as greens.",
  "slippery-cabbage": "soft leaves cooked down with coconut cream.",
  "taro-leaves": "broad leaves boiled well, often wrapped around coconut cream.",
  "kumara": "sweet potato stored in pits through winter and cooked in the earth oven.",
};
export const vegetableItems: Record<string, ItemDef> = Object.fromEntries(
  Object.entries(vegetables).map(([id, p]) => [
    id,
    { id, name: p.name, description: `${p.latin}: ${plantUse[id]}`, sprite: "greens", value: 1, edible: p.shape === "leaf" ? 3 : 5 },
  ]),
);

/** What grows in one bed of a kitchen garden. A bed is a row, so a garden
 * reads as rows of different things. */
export function gardenPlant(
  setting: Pick<WorldSetting, "culture" | "year">,
  seed: string,
  y: number,
): GardenPlant | undefined {
  const plants = gardens[setting.culture]?.plants.filter(
    (p) => setting.year >= (p.from ?? -Infinity) && setting.year < (p.to ?? Infinity),
  );
  if (!plants?.length) return undefined;
  return plants[hash(`${seed}:garden:${y}`) % plants.length];
}
