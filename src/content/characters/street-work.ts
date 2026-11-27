import type { Livelihood } from "./context-types";

// Itinerant trades that walk a round through a town crying their wares or
// their service. Their kit is in wardrobe/regions/street.ts, their days in
// economy/street-recipes.ts.

const BRITAIN: Livelihood["bounds"] = [-8.5, 49.8, 2, 61];
const GERMAN_LANDS: Livelihood["bounds"] = [5.8, 45.8, 17, 55];
const FRANCE: Livelihood["bounds"] = [-5, 42.3, 5.8, 51.1];
const NORTH_AMERICA: Livelihood["bounds"] = [-170, 15, -50, 72];
const EGYPT: Livelihood["bounds"] = [24, 22, 35, 32];
const LEVANT: Livelihood["bounds"] = [34, 29.5, 39, 37.5];
const ANATOLIA: Livelihood["bounds"] = [26, 36.5, 45, 42.2];

export const streetLivelihoods: readonly Livelihood[] = [
  // The grindstone on a wheeled frame worked by a treadle, pushed from door
  // to door; in China a long bench on the shoulder and a string of iron
  // clappers, with the cry "sharpen scissors, hone cleavers".
  { id: "knife-grinder", label: "Knife Grinder", activity: "At the workbench", tier: "town", years: [1500, 1990],
    cultures: ["european", "east-asian"], weight: 0.15, sex: "male", rank: "labouring", inventory: { water: 1, coin: 1, tool: 1 },
    labels: [
      { scope: { years: [1500, 1990], bounds: GERMAN_LANDS }, label: "Scissors Grinder" },
      { scope: { years: [1850, 1990], bounds: NORTH_AMERICA }, label: "Scissors Grinder" },
      // The afiladores of Ourense walked as far as Argentina, announcing
      // themselves on a pan pipe and talking among themselves in their own argot.
      { scope: { years: [1700, 1990], bounds: [-9.3, 41.8, -6.7, 43.8] }, label: "Afilador" },
      { scope: { years: [1600, 1990], bounds: [100, 20, 125, 42] }, label: "Scissors and Cleaver Grinder" },
    ] },
  // Paid by the town to read out its orders, sales and lost property, and by
  // anyone else who paid the fee.
  { id: "town-crier", label: "Town Crier", activity: "Holding office", tier: "town", years: [1300, 1900],
    cultures: ["european"], bounds: [-125, 25, 17, 61], weight: 0.06, sex: "male", rank: "labouring", inventory: { water: 1, coin: 2 },
    labels: [
      { scope: { years: [1300, 1900], bounds: BRITAIN }, label: "Town Crier", weight: 2 },
      { scope: { years: [1300, 1900], bounds: BRITAIN }, label: "Bellman" },
      { scope: { years: [1300, 1900], bounds: FRANCE }, label: "Public Crier" },
    ] },
  // Mostly Italian, often bound to a padrone who hired out the organ; New
  // York licensed them off its streets in 1935.
  { id: "organ-grinder", label: "Organ Grinder", activity: "Working the crowd", tier: "town", years: [1800, 1940],
    cultures: ["european"], weight: 0.08, sex: "male", rank: "destitute", inventory: { water: 1, coin: 1 } },
  // Rubber toy balloons from the 1880s and 1890s, filled with coal gas or
  // hydrogen until helium was cheap.
  { id: "balloon-seller", label: "Balloon Seller", activity: "Exchanging goods", tier: "town", years: [1890, 10001],
    weight: 0.05, rank: "destitute", inventory: { water: 1, coin: 1 } },
  // Edo's summer kingyo-uri walked with two tubs on a pole, calling the fish.
  { id: "goldfish-seller", label: "Goldfish Seller", activity: "Exchanging goods", tier: "town", years: [1750, 1960],
    bounds: [129, 30, 146, 46], weight: 0.12, sex: "male", rank: "labouring", inventory: { water: 2, coin: 1 } },
  // Licorice, tamarind and carob, and sherbet in Istanbul, poured from an
  // urn on the chest to the clack of brass cups.
  { id: "juice-seller", label: "Juice Seller", activity: "Exchanging goods", tier: "town", years: [1700, 10001],
    cultures: ["north-african-west-asian"], bounds: [24, 22, 45, 42.2], weight: 0.2, sex: "male", rank: "labouring",
    inventory: { water: 2, coin: 1 },
    labels: [
      { scope: { years: [1700, 10001], bounds: EGYPT }, label: "Licorice Seller", weight: 2 },
      { scope: { years: [1700, 10001], bounds: EGYPT }, label: "Tamarind Seller" },
      { scope: { years: [1700, 10001], bounds: LEVANT }, label: "Licorice Seller" },
      { scope: { years: [1700, 10001], bounds: LEVANT }, label: "Juice Seller" },
      { scope: { years: [1700, 10001], bounds: ANATOLIA }, label: "Sherbet Seller" },
    ] },
  { id: "rag-and-bone", label: "Rag-and-Bone Man", activity: "Clearing waste", tier: "town", years: [1800, 1975],
    cultures: ["european"], bounds: BRITAIN, weight: 0.2, sex: "male", rank: "destitute", inventory: { water: 1, coin: 2 } },
];
