import type { Product } from "./products";

const kava = {
  good: "drink", noun: "kava",
  sources: ["https://en.wikipedia.org/wiki/Kava"],
  note: "The root pounded or chewed and steeped in water, drunk in ceremony and among men. It is not fermented; offering it for sale is inferred.",
};
const tapa = {
  good: "cloth", noun: "tapa (bark cloth)",
  sources: ["https://en.wikipedia.org/wiki/Tapa_cloth"],
  note: "Paper-mulberry bark beaten thin and painted or stamped, the cloth of Polynesia before woven cotton arrived.",
};

export const oceanianProducts: Product[] = [
  { ...kava, id: "kava-west", scope: { years: [500, 2027], bounds: [165, -23, 180, -12] } },
  { ...kava, id: "kava-east", scope: { years: [500, 2027], bounds: [-180, -23, -168, -12] } },
  { ...kava, id: "hawaiian-awa", noun: "ʻawa (kava)", scope: { years: [1000, 2027], bounds: [-161, 18.5, -154, 22.5] } },
  { ...tapa, id: "tapa-west", scope: { years: [500, 1900], bounds: [165, -23, 180, -12] } },
  { ...tapa, id: "tapa-east", scope: { years: [500, 1900], bounds: [-180, -28, -130, 22.5] } },
  {
    id: "oceanian-coconut-oil", good: "oil", noun: "coconut oil",
    scope: { years: [500, 2027], bounds: [-180, -25, -130, 22.5] },
    sources: ["https://en.wikipedia.org/wiki/Coconut_oil"],
    note: "Scented coconut oil (monoi in Tahiti) made by grating and sunning the flesh, for skin and hair as much as for food.",
  },
];
