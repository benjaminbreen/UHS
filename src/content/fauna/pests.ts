import type { FaunaProfile } from "./types";
import { study } from "./types";

const always = [-1000000, 10000] as const;

/** Birds that live off the sown fields. They are about in small numbers any
 * day; a raid is a flock come down on a crop. */
const fieldBird = (
  id: string,
  label: string,
  latin: string,
  art: "crow" | "house-sparrow",
  presence: FaunaProfile["presence"],
  groupSize: readonly [number, number],
): FaunaProfile => ({
  id,
  label,
  latin,
  category: "wild",
  locomotion: "ground-and-flight",
  gait: "hop",
  social: "flock",
  activity: "diurnal",
  groupSize,
  habitats: [
    { tag: "field", weight: 1 },
    { tag: "pasture", weight: 0.6 },
    { tag: "forest-edge", weight: 0.4 },
  ],
  presence,
  density: art === "crow" ? 0.4 : 0.6,
  pace: art === "crow" ? 0.6 : 0.5,
  settlementTolerance: 0.6,
  minimumSettlementDistance: 2,
  // Wary birds: a crow has the measure of a person a long way off.
  alertRadius: art === "crow" ? 4 : 2.5,
  cohesionRadius: 4,
  separationRadius: 1,
  calmDecisionSeconds: 35,
  urgentDecisionSeconds: 4,
  prey: "small-animal",
  diet: ["seed", "plant", "invertebrate"],
  ...study(art),
});

/** A swarm. Locusts do not scare the way birds do; they drift off a crop
 * that is beaten and smoked, and settle again further on. */
const locust = (
  id: string,
  label: string,
  latin: string,
  presence: FaunaProfile["presence"],
): FaunaProfile => ({
  id,
  label,
  latin,
  category: "wild",
  locomotion: "ground-and-flight",
  gait: "hop",
  social: "flock",
  activity: "diurnal",
  groupSize: [14, 24],
  habitats: [
    { tag: "field", weight: 1 },
    { tag: "open-grass", weight: 0.8 },
    { tag: "scrub", weight: 0.5 },
  ],
  presence,
  // Only ever a swarm on a crop; nobody meets a plague by chance.
  density: 0,
  pace: 0.8,
  settlementTolerance: 1,
  minimumSettlementDistance: 0,
  alertRadius: 1.2,
  cohesionRadius: 5,
  separationRadius: 1,
  calmDecisionSeconds: 20,
  urgentDecisionSeconds: 2,
  diet: ["plant", "grass"],
  ...study("locust"),
});

export const pests: readonly FaunaProfile[] = [
  // The rook of the ploughed field and the sown one, from Ireland to the Altai.
  fieldBird("rook", "Rook", "Corvus frugilegus", "crow",
    [{ years: always, bounds: [-11, 36, 95, 64] }], [4, 9]),
  fieldBird("house-crow", "House crow", "Corvus splendens", "crow",
    [{ years: always, bounds: [58, 0, 110, 35] }], [3, 7]),
  fieldBird("jungle-crow", "Large-billed crow", "Corvus macrorhynchos", "crow",
    [{ years: always, bounds: [95, -10, 146, 50] }], [2, 6]),
  fieldBird("american-crow", "American crow", "Corvus brachyrhynchos", "crow",
    [{ years: always, bounds: [-130, 25, -60, 60] }], [3, 8]),
  // The weaver that comes down on sorghum and millet in flocks of millions.
  fieldBird("red-billed-quelea", "Red-billed quelea", "Quelea quelea", "house-sparrow",
    [{ years: always, bounds: [-18, -35, 52, 20] }], [8, 16]),
  // Mao's Four Pests campaign of 1958 was fought against this bird.
  fieldBird("tree-sparrow", "Eurasian tree sparrow", "Passer montanus", "house-sparrow",
    [{ years: always, bounds: [95, 18, 145, 55] }], [5, 12]),
  locust("desert-locust", "Desert locust", "Schistocerca gregaria", [
    { years: always, bounds: [-18, 0, 80, 38] },
  ]),
  locust("migratory-locust", "Migratory locust", "Locusta migratoria", [
    { years: always, bounds: [-18, -35, 52, 0] },
    { years: always, bounds: [80, 18, 125, 45] },
    { years: always, bounds: [10, 38, 60, 50] },
  ]),
  // Darkened the Great Plains in the 1870s and was extinct by 1902.
  locust("rocky-mountain-locust", "Rocky Mountain locust", "Melanoplus spretus", [
    { years: [-1000000, 1902], bounds: [-115, 30, -88, 55] },
  ]),
  locust("south-american-locust", "South American locust", "Schistocerca cancellata", [
    { years: always, bounds: [-72, -42, -48, -15] },
  ]),
  locust("australian-plague-locust", "Australian plague locust", "Chortoicetes terminifera", [
    { years: always, bounds: [113, -40, 154, -18] },
  ]),
];
