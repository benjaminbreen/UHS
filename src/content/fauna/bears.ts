import type { FaunaProfile } from "./types";
import { directionalStudy } from "./types";

const always = [-1000000, 10000] as const;

const bear = {
  category: "wild",
  locomotion: "ground",
  social: "solitary",
  activity: "crepuscular",
  groupSize: [1, 1],
  pace: 1.1,
  settlementTolerance: 0.03,
  minimumSettlementDistance: 25,
  alertRadius: 7,
  cohesionRadius: 2,
  separationRadius: 1,
  calmDecisionSeconds: 90,
  urgentDecisionSeconds: 5,
} as const;

/** The bears, one rig: see scripts/art/ursid.py. */
export const bears: readonly FaunaProfile[] = [
  {
    ...bear,
    id: "brown-bear",
    label: "Brown bear",
    latin: "Ursus arctos",
    habitats: [
      { tag: "woodland", weight: 1 },
      { tag: "forest-edge", weight: 0.9 },
      { tag: "scrub", weight: 0.7 },
      { tag: "rock", weight: 0.6 },
      { tag: "open-grass", weight: 0.5 },
      { tag: "shore", weight: 0.4 },
    ],
    // Across the northern world, and pushed back to the mountains wherever
    // people farmed: gone from Britain in the early Middle Ages, from the
    // lowlands of western Europe by about 1800, from the Atlas in the 1870s,
    // from California in 1924 and Mexico in the 1960s. It holds on in the
    // Pyrenees, the Alps' edges, the Carpathians and Balkans, Scandinavia,
    // Russia, the Caucasus, Iran, the Himalaya, Hokkaido, Alaska and the
    // Rockies.
    presence: [
      { years: [-1000000, 700], bounds: [-11, 49.8, 2, 61] },
      { years: [-1000000, 1800], bounds: [-10, 36, 20, 58] },
      { years: always, bounds: [-2, 42, 3, 43.5] },
      { years: always, bounds: [10, 45, 16, 47.5] },
      { years: always, bounds: [16, 39, 30, 50] },
      { years: always, bounds: [5, 55, 180, 72] },
      { years: always, bounds: [26, 34, 70, 45] },
      { years: [-1000000, 1870], bounds: [-10, 28, 11, 37] },
      { years: always, bounds: [70, 27, 100, 40] },
      { years: always, bounds: [100, 40, 135, 55] },
      { years: always, bounds: [139, 41, 146, 46] },
      { years: always, bounds: [-170, 48, -100, 72] },
      { years: always, bounds: [-116, 42, -104, 49] },
      { years: [-1000000, 1924], bounds: [-125, 32, -95, 48] },
      { years: [-1000000, 1964], bounds: [-110, 25, -100, 32] },
    ],
    density: 0.12,
    diet: ["plant", "seed", "invertebrate", "rodent", "small-animal"],
    preyTags: ["rodent", "small-animal"],
    ...directionalStudy("brown-bear"),
  },
  {
    ...bear,
    id: "polar-bear",
    label: "Polar bear",
    latin: "Ursus maritimus",
    activity: "flexible",
    habitats: [
      { tag: "shore", weight: 1 },
      { tag: "open-grass", weight: 0.8 },
      { tag: "rock", weight: 0.7 },
    ],
    // The sea ice round the pole and the coasts it freezes to, south to
    // Hudson Bay and James Bay.
    presence: [
      { years: always, bounds: [-180, 62, 180, 85] },
      { years: always, bounds: [-96, 51, -76, 62] },
    ],
    density: 0.2,
    pace: 1.2,
    diet: ["small-animal", "invertebrate"],
    ...directionalStudy("polar-bear"),
  },
  {
    ...bear,
    id: "cave-bear",
    label: "Cave bear",
    latin: "Ursus spelaeus",
    habitats: [
      { tag: "rock", weight: 1 },
      { tag: "woodland", weight: 0.8 },
      { tag: "forest-edge", weight: 0.8 },
      { tag: "scrub", weight: 0.6 },
    ],
    // Europe to the Urals, wintering in caves it wore smooth over thousands
    // of years. Gone about 22,000 BC, well before the end of the Ice Age.
    presence: [{ years: [-1000000, -22000], bounds: [-10, 36, 60, 56] }],
    density: 0.12,
    diet: ["plant", "seed", "invertebrate"],
    ...directionalStudy("cave-bear"),
  },
  {
    ...bear,
    id: "short-faced-bear",
    label: "Short-faced bear",
    latin: "Arctodus simus",
    habitats: [
      { tag: "open-grass", weight: 1 },
      { tag: "scrub", weight: 0.8 },
      { tag: "forest-edge", weight: 0.6 },
    ],
    // Alaska to Mexico. Whether it hunted or drove other hunters off their
    // kills is argued; it is given the choice here. Gone about 11,000 BC.
    presence: [{ years: [-1000000, -11000], bounds: [-165, 20, -60, 70] }],
    density: 0.06,
    pace: 1.4,
    diet: ["ungulate", "small-animal", "plant"],
    preyTags: ["ungulate", "small-animal"],
    ...directionalStudy("short-faced-bear"),
  },
];
