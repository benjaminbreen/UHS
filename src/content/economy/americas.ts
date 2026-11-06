import type { Product } from "./products";

export const americanProducts: Product[] = [
  {
    id: "andean-chicha", good: "drink", noun: "chicha (maize beer)", input: "grain",
    scope: { years: [-1000, 2027], bounds: [-81, -35, -63, 2] },
    sources: ["https://en.wikipedia.org/wiki/Chicha"],
    note: "Maize beer brewed by women; the Inca state brewed it in quantity for work parties and feasts. Strength and recipe varied.",
  },
  {
    id: "mesoamerican-pulque", good: "drink", noun: "pulque",
    scope: { years: [-200, 2027], bounds: [-106, 13, -86, 23] },
    sources: ["https://en.wikipedia.org/wiki/Pulque"],
    note: "Fermented maguey sap. The Mexica restricted drunkenness; under Spanish rule pulquerías became a large, taxed urban trade.",
  },
  {
    id: "caribbean-rum", good: "drink", noun: "rum", trades: ["innkeeper", "publican"],
    scope: { years: [1650, 2027], bounds: [-86, 10, -59, 24] },
    sources: ["https://en.wikipedia.org/wiki/Rum"],
    note: "Distilled from molasses on the sugar estates from the mid-seventeenth century. An innkeeper selling it is inferred.",
  },
  {
    id: "mesoamerican-cotton-cloth", good: "cloth", noun: "cotton cloth",
    scope: { years: [-500, 1700], bounds: [-106, 13, -86, 23] },
    sources: ["https://en.wikipedia.org/wiki/Backstrap_loom"],
    note: "Woven on the backstrap loom; cotton mantles (quachtli) were a unit of tribute and exchange under the Mexica.",
  },
  {
    id: "andean-cloth", good: "cloth", noun: "alpaca and cotton cloth",
    scope: { years: [-1000, 2027], bounds: [-81, -35, -63, 2] },
    sources: ["https://en.wikipedia.org/wiki/Textiles_of_the_Andes"],
    note: "Camelid wool and cotton woven on backstrap and staked looms. The Inca state stored cloth as wealth; ordinary cloth (awasqa) is meant here, not fine cumbi.",
  },
];
