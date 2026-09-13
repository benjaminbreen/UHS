import type { FaunaProfile } from "./types";
import { frames } from "./types";

const birdArt = (id: string) =>
  frames(id, {
    forage: 2,
    perch: 2,
    takeoff: 3,
    flight: 4,
    approach: 2,
    landing: 3,
  });

export const birds: readonly FaunaProfile[] = [
  {
    id: "house-sparrow",
    label: "House sparrow study",
    category: "commensal",
    locomotion: "ground-and-flight",
    social: "flock",
    activity: "diurnal",
    groupSize: [3, 9],
    habitats: [
      { tag: "settlement", weight: 1 },
      { tag: "field", weight: 0.8 },
      { tag: "scrub", weight: 0.35 },
    ],
    settlementTolerance: 0.95,
    minimumSettlementDistance: 0,
    alertRadius: 4,
    cohesionRadius: 5,
    separationRadius: 1,
    calmDecisionSeconds: 45,
    urgentDecisionSeconds: 6,
    diet: ["seed", "invertebrate"],
    palette: ["#3d392f", "#5c4b37", "#826a49", "#b7a378", "#d2ad61"],
    art: birdArt("house-sparrow"),
  },
  {
    id: "rock-dove",
    label: "Rock dove study",
    category: "commensal",
    locomotion: "ground-and-flight",
    social: "flock",
    activity: "diurnal",
    groupSize: [2, 8],
    habitats: [
      { tag: "settlement", weight: 1 },
      { tag: "rock", weight: 0.7 },
      { tag: "field", weight: 0.4 },
    ],
    settlementTolerance: 1,
    minimumSettlementDistance: 0,
    alertRadius: 3,
    cohesionRadius: 5,
    separationRadius: 1,
    calmDecisionSeconds: 60,
    urgentDecisionSeconds: 6,
    diet: ["seed", "plant"],
    palette: ["#343b3e", "#536c68", "#777b78", "#aeb0a5", "#b89a63"],
    art: birdArt("rock-dove"),
  },
];
