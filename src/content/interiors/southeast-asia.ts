import type { InteriorProfile } from "./types";

export const southeastAsia: InteriorProfile[] = [
  {
    id: "stilt-house",
    clutter: ["bowl", "pot", "grain", "yarn"],
    label: "House on posts",
    region: "Mainland and island Southeast Asia",
    period: "Neolithic to the present",
    when: { start: { year: -2000 }, end: { year: 2000 } },
    basis: "documented",
    note: "One raised room of timber posts, bamboo or plank floor and woven-palm walls under a steep thatch, reached by a ladder; mats to sit and sleep on and a hearth box of earth on the floor. Recorded across the region from Thai and Malay houses to Dayak dwellings; archaeological post rows run back to the Neolithic.",
    shapes: ["rect"],
    size: [10, 7],
    door: "opening",
    windowStyle: "shutter",
    fire: "firepit",
    smokehole: false,
    seating: "floor",
    sleep: "mat",
    trades: ["household", "weaver", "hunter"],
    furnish: ["basket", "jars", "pegs", "loom", "chest", "lamp"],
    looks: [
      { wall: "reed", floor: "mat", wear: 0.5, soot: 0.4, windows: 0 },
      { wall: "timber", floor: "plank", wear: 0.3, soot: 0.3, windows: 1 },
      { wall: "timber", floor: "plank", wear: 0.15, soot: 0.2, windows: 1, furnish: ["tapestry"] },
    ],
    colorways: [
      { name: "Bamboo and palm", wall: "#b09a62", trim: "#5a4a2a", floor: "#a08a58", wood: "#6a5232", accent: "#2a6a4a" },
      { name: "Teak", wall: "#7a5638", trim: "#3a2618", floor: "#8a6440", wood: "#4e3420", accent: "#b8302a" },
    ],
  },
];
