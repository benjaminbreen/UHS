import { directionalStudy, type FaunaProfile } from "./types";

const always = [-1000000, 10000] as const;

const snake = (
  id: Parameters<typeof directionalStudy>[0],
  label: string,
  latin: string,
  activity: FaunaProfile["activity"],
  presence: FaunaProfile["presence"],
  density: number,
): FaunaProfile => ({
  id,
  label,
  latin,
  category: "wild",
  locomotion: "ground",
  social: "solitary",
  activity,
  groupSize: [1, 1],
  habitats: [
    { tag: "scrub", weight: 1 },
    { tag: "rock", weight: 0.8 },
    { tag: "field", weight: 0.7 },
    { tag: "open-grass", weight: 0.6 },
    { tag: "woodland", weight: 0.5 },
    { tag: "forest-edge", weight: 0.4 },
    // Rats bring them in to the grain stores and the house walls.
    { tag: "settlement", weight: 0.15 },
  ],
  presence,
  density,
  pace: 0.6,
  settlementTolerance: 0.4,
  minimumSettlementDistance: 0,
  alertRadius: 3,
  cohesionRadius: 1,
  separationRadius: 4,
  calmDecisionSeconds: 120,
  urgentDecisionSeconds: 3,
  // It strikes at a foot that comes this close, not at one passing by.
  defends: 1.2,
  diet: ["rodent", "small-animal"],
  preyTags: ["rodent"],
  ...directionalStudy(id),
});

const crocodile = (
  id: Parameters<typeof directionalStudy>[0],
  label: string,
  latin: string,
  presence: FaunaProfile["presence"],
  density: number,
  coast = false,
): FaunaProfile => ({
  id,
  label,
  latin,
  category: "wild",
  locomotion: "ground",
  social: "solitary",
  activity: "flexible",
  groupSize: [1, 3],
  habitats: [
    { tag: "water", weight: 1 },
    { tag: "wetland", weight: 0.9 },
    { tag: "shore", weight: coast ? 1 : 0.7 },
  ],
  presence,
  density,
  pace: 0.7,
  swims: true,
  leaps: 0,
  settlementTolerance: 0.1,
  minimumSettlementDistance: 6,
  alertRadius: 5,
  cohesionRadius: 4,
  separationRadius: 3,
  calmDecisionSeconds: 150,
  urgentDecisionSeconds: 2,
  defends: 2,
  // Takes what comes down to drink: antelope, cattle, dogs, people.
  diet: ["ungulate", "small-animal"],
  preyTags: ["ungulate", "small-animal"],
  ...directionalStudy(id),
});

/** The animals that kill people in warm country: the venomous snakes, the
 * crocodiles and the hippopotamus. */
export const dangerousFauna: FaunaProfile[] = [
  snake("indian-cobra", "Indian cobra", "Naja naja", "nocturnal",
    [{ years: always, bounds: [60, 6, 92, 34] }], 0.05),
  // The asp of Egypt, the uraeus on the pharaoh's crown.
  snake("egyptian-cobra", "Egyptian cobra", "Naja haje", "nocturnal", [
    { years: always, bounds: [-17, 3, 40, 35] },
    { years: always, bounds: [35, 12, 46, 20] },
  ], 0.04),
  snake("russells-viper", "Russell's viper", "Daboia russelii", "nocturnal",
    [{ years: always, bounds: [66, 5, 122, 33] }], 0.05),
  snake("saw-scaled-viper", "Saw-scaled viper", "Echis carinatus", "nocturnal", [
    { years: always, bounds: [-17, 4, 45, 30] },
    { years: always, bounds: [35, 8, 88, 38] },
  ], 0.06),
  snake("black-mamba", "Black mamba", "Dendroaspis polylepis", "diurnal", [
    { years: always, bounds: [10, -30, 45, 15] },
    { years: always, bounds: [-17, 6, 10, 15] },
  ], 0.03),
  snake("western-diamondback", "Western diamondback rattlesnake", "Crotalus atrox", "crepuscular",
    [{ years: always, bounds: [-118, 22, -93, 37] }], 0.05),
  // Bounties and clearing took it out of Maine, southern Ontario and most of
  // New England around 1900.
  snake("timber-rattlesnake", "Timber rattlesnake", "Crotalus horridus", "diurnal", [
    { years: [-1000000, 1900], bounds: [-97, 28, -69, 45.5] },
    { years: [1900, 10000], bounds: [-97, 28, -72, 43] },
  ], 0.04),
  snake("european-adder", "European adder", "Vipera berus", "diurnal", [
    { years: always, bounds: [-6, 43, 40, 68] },
    { years: always, bounds: [40, 45, 140, 62] },
  ], 0.06),
  // Herodotus saw them in the Nile at Thebes; the last below Aswan were shot
  // in the 1890s. A remnant lived in the Crocodile River of Palestine until
  // about 1910.
  crocodile("nile-crocodile", "Nile crocodile", "Crocodylus niloticus", [
    { years: always, bounds: [-17, -30, 42, 17] },
    { years: always, bounds: [43, -26, 51, -12] },
    { years: [-1000000, 1890], bounds: [24, 17, 36, 31.5] },
    { years: [-1000000, 1910], bounds: [34.5, 32, 35.2, 33] },
  ], 0.08),
  crocodile("mugger-crocodile", "Mugger crocodile", "Crocodylus palustris",
    [{ years: always, bounds: [58, 5, 92, 32] }], 0.08),
  crocodile("saltwater-crocodile", "Saltwater crocodile", "Crocodylus porosus", [
    { years: always, bounds: [80, -20, 155, 22] },
    { years: always, bounds: [79, 5, 82, 10] },
  ], 0.06, true),
  crocodile("american-alligator", "American alligator", "Alligator mississippiensis",
    [{ years: always, bounds: [-100, 25, -75, 36] }], 0.1),
  {
    id: "hippopotamus",
    label: "Hippopotamus",
    latin: "Hippopotamus amphibius",
    category: "wild",
    locomotion: "ground",
    social: "herd",
    activity: "nocturnal",
    groupSize: [3, 12],
    habitats: [
      { tag: "water", weight: 1 },
      { tag: "wetland", weight: 0.9 },
      { tag: "shore", weight: 0.8 },
      { tag: "open-grass", weight: 0.4 },
      { tag: "field", weight: 0.2 },
    ],
    // Gone from the Delta by about 1800 and from the Sudanese Nile north of
    // Khartoum through the 1800s; shot out of the Cape by 1850.
    presence: [
      { years: always, bounds: [-17, -30, 42, 16] },
      { years: [-1000000, 1850], bounds: [17, -35, 33, -30] },
      { years: [-1000000, 1800], bounds: [29, 22, 33, 31.5] },
      { years: [-1000000, 1900], bounds: [29, 16, 35, 22] },
    ],
    density: 0.1,
    pace: 0.9,
    swims: true,
    leaps: 0,
    wallows: true,
    settlementTolerance: 0.05,
    minimumSettlementDistance: 8,
    alertRadius: 6,
    cohesionRadius: 5,
    separationRadius: 2,
    calmDecisionSeconds: 120,
    urgentDecisionSeconds: 3,
    // It goes for anything between it and the water.
    defends: 3,
    diet: ["grass"],
    ...directionalStudy("hippopotamus"),
  },
];
