import type { Product } from "./products";

export const southeastAsianProducts: Product[] = [
  {
    id: "southeast-asian-rice-wine", good: "drink", noun: "rice wine", input: "grain",
    scope: { years: [500, 2027], bounds: [92, -11, 141, 24] },
    sources: ["https://en.wikipedia.org/wiki/Tuak"],
    note: "Fermented rice drinks, called tuak, tapai or ruou by region, brewed at home and for feasts. One noun stands in for many local recipes.",
  },
  {
    id: "southeast-asian-coconut-oil", good: "oil", noun: "coconut oil",
    scope: { years: [500, 2027], bounds: [92, -11, 141, 24] },
    sources: ["https://en.wikipedia.org/wiki/Coconut_oil"],
    note: "Oil boiled out of grated coconut for cooking and lamps. Copra for export is a later, colonial trade.",
  },
  {
    id: "javanese-batik", good: "cloth", noun: "batik cloth",
    scope: { years: [1600, 2027], bounds: [105, -9, 115, -5] },
    sources: ["https://ich.unesco.org/en/RL/indonesian-batik-00170"],
    note: "Cotton patterned with wax resist and dyed in indigo and soga brown. Hand-drawn batik is assumed; stamped batik came in the nineteenth century.",
  },
];
