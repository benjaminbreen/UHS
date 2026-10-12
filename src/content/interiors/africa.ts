import type { InteriorProfile } from "./types";

// Round houses south of the Sahara are chosen by their building (forms.ts);
// these are the square-built traditions.
export const africa: InteriorProfile[] = [
  {
    id: "sahel-mud-house",
    rooms: [
      { id: "zaure", label: "Entrance room", role: "entry", size: [7, 6], fire: "none", sleep: "none", furnish: ["jars", "mat", "pegs"], clutter: ["shoes"] },
      { id: "court", label: "Courtyard", role: "hall", size: [10, 9], shapes: ["courtyard"], fire: "firepit", sleep: "none", furnish: ["jars", "quern", "basket", "firewood"], clutter: ["pot", "grain", "bowl"] },
      { id: "room", label: "Sleeping room", role: "sleep", size: [7, 6], fire: "none", sleep: "mat", furnish: ["chest", "jars", "pegs"], clutter: ["cloth"] },
      { id: "store", label: "Granary room", role: "store", size: [6, 5], fire: "none", sleep: "none", furnish: ["jars", "sacks", "basket"], clutter: ["grain"] },
    ],
    styles: { shelf: "niche", cushions: "hide" },
    clutter: ["grain", "pot", "bowl", "cloth"],
    label: "Sahelian mud house",
    region: "Middle Niger and the Sahel",
    period: "1000 – 1950",
    when: { start: { year: 1000 }, end: { year: 1950 } },
    basis: "documented",
    note: "Banco (sun-dried mud) rooms round a courtyard where the cooking is done, flat roofs on palm beams, an entrance room that keeps the household from the street, as recorded at Djenné and Timbuktu. Earlier dates follow the excavated houses of Jenne-jeno.",
    shapes: ["courtyard", "rect"],
    size: [10, 9],
    door: "door",
    windowStyle: "lattice",
    fire: "firepit",
    smokehole: false,
    seating: "floor",
    sleep: "mat",
    trades: ["household", "weaver", "merchant", "potter", "scholar"],
    furnish: ["jars", "basket", "quern", "chest", "pegs", "rug"],
    looks: [
      { wall: "mud", floor: "earth", wear: 0.5, soot: 0.4, windows: 0 },
      { wall: "mud", floor: "sand", wear: 0.3, soot: 0.3, windows: 1 },
      { wall: "plaster", floor: "carpet", wear: 0.15, soot: 0.2, windows: 1, furnish: ["tapestry", "scrolls"] },
    ],
    colorways: [
      { name: "Banco", wall: "#b0784a", trim: "#5a3a22", floor: "#a07048", wood: "#5e4026", accent: "#3a5a8a" },
      { name: "Niger ochre", wall: "#c4925a", trim: "#5e3e22", floor: "#b08454", wood: "#62442a", accent: "#a8302a" },
    ],
  },
];
