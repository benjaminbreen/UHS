import type { Product } from "./products";

export const westEurasianProducts: Product[] = [
  {
    id: "british-ale", good: "drink", noun: "ale", input: "grain",
    scope: { years: [1400, 1900], bounds: [-8, 49.5, 2, 59] },
    sources: ["https://www.britishmuseum.org/blog/how-cook-medieval-feast-11-recipes-middle-ages"],
    note: "A fifteenth-century English recipe names ale. Broader regional use and later continuity are inferred; this does not claim a constant recipe or exclude hopped beer and other drinks.",
  },
  {
    id: "mesopotamian-barley-beer", good: "drink", noun: "barley beer", input: "grain",
    scope: { years: [-2999, -499], bounds: [38, 29, 50, 38] },
    sources: ["https://www.penn.museum/sites/expedition/bread-and-beer/"],
    note: "Third-millennium Mesopotamian brewing is documented in tablets. Applying barley beer to later invented suppliers in this region is an inference, not a uniform recipe or consumption rate.",
  },
  {
    id: "roman-wine", good: "drink", noun: "wine", trades: ["innkeeper", "publican"],
    scope: { years: [-99, 476], bounds: [8, 36, 19, 47] },
    sources: ["https://www.britishmuseum.org/collection/object/G_1805-0703-219"],
    note: "Roman wine amphorae document the commodity; an innkeeper supplying it is inferred. This sale does not imply the innkeeper grows grapes, or that a grain brewer makes wine.",
  },
];
