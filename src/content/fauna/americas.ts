import type { FaunaProfile } from "./types";
import { study } from "./types";

/** The animals of the Americas. Before 1492 a player standing in the Andes or
 * in Mesoamerica met almost nothing: no cattle, no sheep, no pigs, no horses.
 * What they did meet is here. */
export const americanFauna: readonly FaunaProfile[] = [
  {
    id: "llama",
    label: "Llama study",
    category: "domestic",
    locomotion: "ground",
    social: "herd",
    activity: "diurnal",
    groupSize: [3, 8],
    habitats: [
      { tag: "pasture", weight: 1 },
      { tag: "open-grass", weight: 0.9 },
      { tag: "rock", weight: 0.7 },
      { tag: "scrub", weight: 0.5 },
    ],
    // Herded on the puna from about 3500 BC; carried north and south with the
    // roads of the highland states, and never down into the lowland forest.
    presence: [
      { years: [-3500, 10000], bounds: [-77, -25, -63, -9] },
      { years: [-1000, 10000], bounds: [-80, -35, -62, -5] },
      { years: [1450, 10000], bounds: [-80, -5, -72, 3] },
    ],
    needs: "herding",
    keeping: { place: "pen" },
    density: 0,
    pace: 0.8,
    climbs: true,
    settlementTolerance: 0.8,
    minimumSettlementDistance: 0,
    alertRadius: 2,
    cohesionRadius: 4,
    separationRadius: 1.5,
    calmDecisionSeconds: 60,
    urgentDecisionSeconds: 6,
    diet: ["grass", "plant"],
    prey: "ungulate",
    ...study("llama"),
  },
  {
    id: "guinea-pig",
    label: "Guinea pig study",
    category: "domestic",
    locomotion: "ground",
    gait: "scurry",
    social: "flock",
    activity: "crepuscular",
    groupSize: [2, 6],
    habitats: [
      { tag: "settlement", weight: 1 },
      { tag: "pasture", weight: 0.4 },
      { tag: "open-grass", weight: 0.3 },
    ],
    // Kept indoors and about the yard from about 5000 BC, the length of the
    // Andes. Never a field animal: it lives where the people are.
    presence: [
      { years: [-5000, 10000], bounds: [-79, -20, -64, 2] },
      { years: [-1000, 10000], bounds: [-81, -35, -62, 3] },
    ],
    needs: "settled",
    keeping: { place: "yard" },
    density: 0,
    pace: 0.6,
    settlementTolerance: 0.95,
    minimumSettlementDistance: 0,
    alertRadius: 1.5,
    cohesionRadius: 3,
    separationRadius: 1,
    calmDecisionSeconds: 25,
    urgentDecisionSeconds: 2,
    diet: ["plant", "grass", "seed"],
    prey: "small-animal",
    ...study("guinea-pig"),
  },
  {
    id: "turkey",
    label: "Turkey study",
    category: "domestic",
    locomotion: "ground",
    gait: "scurry",
    social: "flock",
    activity: "diurnal",
    groupSize: [2, 7],
    habitats: [
      { tag: "settlement", weight: 1 },
      { tag: "field", weight: 0.7 },
      { tag: "scrub", weight: 0.3 },
    ],
    // Kept in Mesoamerica from about 800 BC and in the Puebloan southwest
    // from about AD 200. Taken to Spain in the 1520s and across Europe within
    // twenty years, which is why it reaches an English farmyard before it
    // reaches most of North America's.
    presence: [
      { years: [-800, 10000], bounds: [-105, 14, -86, 23] },
      { years: [200, 10000], bounds: [-114, 31, -103, 38] },
      { years: [1525, 10000], bounds: [-10, 35, 30, 60] },
      { years: [1550, 10000], bounds: [-11, 35, 45, 62] },
    ],
    needs: "settled",
    keeping: { place: "yard" },
    density: 0,
    pace: 0.55,
    settlementTolerance: 0.9,
    minimumSettlementDistance: 0,
    alertRadius: 1.5,
    cohesionRadius: 4,
    separationRadius: 1,
    calmDecisionSeconds: 40,
    urgentDecisionSeconds: 4,
    diet: ["seed", "plant", "invertebrate"],
    prey: "small-animal",
    ...study("turkey"),
  },
  {
    id: "wild-turkey",
    label: "Wild turkey",
    category: "wild",
    locomotion: "ground",
    gait: "scurry",
    social: "flock",
    activity: "diurnal",
    groupSize: [3, 9],
    habitats: [
      { tag: "woodland", weight: 1 },
      { tag: "forest-edge", weight: 0.9 },
      { tag: "scrub", weight: 0.5 },
      { tag: "field", weight: 0.4 },
    ],
    // The oak woods of eastern and southern North America. Shot out of much
    // of that range by 1900 and back over most of it by 1990.
    presence: [
      { years: [-1000000, 1900], bounds: [-100, 25, -70, 46] },
      { years: [-1000000, 10000], bounds: [-114, 14, -96, 40] },
      { years: [1990, 10000], bounds: [-100, 25, -70, 46] },
    ],
    density: 0.7,
    pace: 0.7,
    settlementTolerance: 0.15,
    minimumSettlementDistance: 14,
    alertRadius: 6,
    cohesionRadius: 5,
    separationRadius: 1.2,
    calmDecisionSeconds: 35,
    urgentDecisionSeconds: 3,
    diet: ["seed", "plant", "invertebrate"],
    prey: "small-animal",
    ...study("turkey"),
  },
];
