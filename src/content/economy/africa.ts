import type { Product } from "./products";

export const africanProducts: Product[] = [
  {
    id: "egyptian-barley-beer", good: "drink", noun: "barley beer", input: "grain",
    scope: { years: [-3099, -29], bounds: [24, 22, 36, 32] },
    sources: ["https://www.britishmuseum.org/collection/object/Y_EA36269"],
    note: "Bread and beer were the standard rations of Egyptian workers; tomb models show the brewing. A thick, low-strength beer is assumed; recipes varied.",
  },
  {
    id: "west-african-palm-wine", good: "drink", noun: "palm wine", trades: ["innkeeper", "publican"],
    scope: { years: [500, 2027], bounds: [-18, 4, 12, 10] },
    sources: ["https://en.wikipedia.org/wiki/Palm_wine"],
    note: "Tapped from oil and raffia palms and drunk within the day before it sours. Selling it is inferred; most was shared at home and at gatherings.",
  },
  {
    id: "ethiopian-tej", good: "drink", noun: "tej (honey wine)", trades: ["innkeeper", "publican"],
    scope: { years: [1000, 2027], bounds: [33, 3, 48, 15] },
    sources: ["https://en.wikipedia.org/wiki/Tej"],
    note: "Honey fermented with gesho leaves, served at the Ethiopian court and in tej houses. Household beer (tella) was commoner.",
  },
  {
    id: "sorghum-beer", good: "drink", noun: "sorghum beer", input: "grain",
    scope: { years: [-1000, 2027], bounds: [-18, -35, 52, 16] },
    sources: ["https://en.wikipedia.org/wiki/Sorghum_beer"],
    note: "Beer brewed from sorghum or millet malt, mostly by women, is widespread south of the Sahara. Which grain and how strong varied by region; an Ethiopian or Bantu-speaking household's brew is not distinguished.",
  },
  {
    id: "shea-butter", good: "oil", noun: "shea butter",
    scope: { years: [100, 2027], bounds: [-17, 8, 16, 15] },
    sources: ["https://en.wikipedia.org/wiki/Shea_butter"],
    note: "Fat from shea nuts, boiled and churned by women in the savanna belt; used for cooking, lamps and skin. Dates of the trade before the fourteenth century are inferred.",
  },
  {
    id: "west-african-palm-oil", good: "oil", noun: "palm oil",
    scope: { years: [-1000, 2027], bounds: [-18, -10, 30, 10] },
    sources: ["https://en.wikipedia.org/wiki/Palm_oil"],
    note: "Red palm oil boiled and pounded from the fruit of the oil palm, the cooking fat of the West and Central African forest zone.",
  },
  {
    id: "west-african-strip-cloth", good: "cloth", noun: "strip-woven cotton cloth",
    scope: { years: [1000, 2027], bounds: [-18, 4, 16, 16] },
    sources: ["https://en.wikipedia.org/wiki/Kente_cloth"],
    note: "Narrow strips from a treadle loom sewn edge to edge. Strip cloth also served as currency in parts of the Sahel.",
  },
  {
    id: "saharan-rock-salt", good: "salt", noun: "rock salt",
    scope: { years: [1000, 1950], bounds: [-17, 10, 16, 25] },
    sources: ["https://en.wikipedia.org/wiki/Taoudenni"],
    note: "Slabs cut at Taghaza and later Taoudenni and carried south by camel caravan to Timbuktu and the Niger markets.",
  },
];
