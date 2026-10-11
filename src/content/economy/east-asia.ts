import type { Product } from "./products";

export const eastAsianProducts: Product[] = [{
  id: "chinese-grain-wine", good: "drink", noun: "grain wine", input: "grain",
  scope: { years: [-1599, 1912], bounds: [103, 22, 122, 40] },
  sources: ["https://pubmed.ncbi.nlm.nih.gov/15590771/"],
  note: "Analyses identify cereal beverages in Shang and Western Zhou vessels. Extending this broad product family to later invented households is inferred; it does not assert one grain, recipe, or ritual use throughout China, and does not include distilled spirits.",
}];
