import type { FaunaProfile } from "./types";
import { study } from "./types";

const always = [-1000000, 10000] as const;

export const temperateFauna: readonly FaunaProfile[] = [
  {
    id: "red-deer",
    label: "Red deer study",
    category: "wild",
    locomotion: "ground",
    social: "herd",
    activity: "crepuscular",
    groupSize: [2, 6],
    habitats: [
      { tag: "forest-edge", weight: 1 },
      { tag: "woodland", weight: 0.75 },
      { tag: "open-grass", weight: 0.65 },
      { tag: "field", weight: 0.4 },
    ],
    // Europe, Anatolia, the Caucasus and the Atlas; the Central Asian
    // forms are close enough to draw the same way.
    presence: [{ years: always, bounds: [-11, 30, 100, 65] }],
    density: 0.18,
    pace: 1,
    settlementTolerance: 0.1,
    minimumSettlementDistance: 28,
    alertRadius: 8,
    cohesionRadius: 6,
    separationRadius: 2,
    calmDecisionSeconds: 75,
    urgentDecisionSeconds: 6,
    diet: ["grass", "plant"],
    ...study("red-deer"),
  },
  {
    id: "gray-wolf",
    label: "Gray wolf study",
    category: "wild",
    locomotion: "ground",
    social: "pack",
    activity: "flexible",
    groupSize: [1, 5],
    habitats: [
      { tag: "woodland", weight: 0.9 },
      { tag: "forest-edge", weight: 0.8 },
      { tag: "scrub", weight: 0.45 },
      { tag: "rock", weight: 0.4 },
    ],
    // Once the whole northern world. Gone from Britain and Ireland by
    // 1700, from Japan by 1905; the continental ranges hold on.
    presence: [
      { years: always, bounds: [2, 36, 180, 80] },
      { years: always, bounds: [-10, 36, 2, 50] },
      { years: [-1000000, 1700], bounds: [-11, 50, 2, 61] },
      { years: [-1000000, 1905], bounds: [128, 30, 146, 46] },
      { years: always, bounds: [-170, 15, -50, 80] },
      { years: always, bounds: [60, 5, 100, 36] },
    ],
    density: 0.08,
    pace: 1.5,
    climbs: true,
    settlementTolerance: 0.05,
    minimumSettlementDistance: 42,
    alertRadius: 9,
    cohesionRadius: 7,
    separationRadius: 2,
    calmDecisionSeconds: 90,
    urgentDecisionSeconds: 6,
    diet: ["small-animal", "ungulate"],
    preyTags: ["small-animal", "ungulate"],
    ...study("gray-wolf"),
  },
];
