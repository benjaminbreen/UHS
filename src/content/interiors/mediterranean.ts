import { bce } from "../history/dates";
import type { InteriorProfile } from "./types";

export const mediterranean: InteriorProfile[] = [
  {
    id: "roman-domus",
    styles: { shelf: "open", table: "round" },
    clutter: ["bowl", "cup", "cloth", "toy", "pot"],
    label: "Roman house",
    region: "Italy",
    period: "1st century BCE – 2nd century CE",
    when: { start: bce(100), end: { year: 200 } },
    basis: "documented",
    note: "Pompeii, Herculaneum and Ostia preserve painted panel walls, opus signinum and mosaic floors, lararia and braziers. The atrium's open impluvium is drawn as a courtyard pool.",
    shapes: ["rect", "courtyard", "L"],
    size: [12, 9],
    door: "door",
    windowStyle: "shutter",
    fire: "brazier",
    smokehole: false,
    seating: "chair",
    sleep: "bed",
    trades: ["household", "weaver", "merchant", "potter", "scholar"],
    furnish: ["shrine", "jars", "chest", "lamp", "basket", "plant", "shelf", "rug", "cat"],
    looks: [
      { wall: "plaster", floor: "earth", wear: 0.55, soot: 0.3 },
      { wall: "panel", floor: "tile", wear: 0.3, soot: 0.12 },
      { wall: "panel", floor: "carpet", dado: "stripe", wear: 0.05, soot: 0, furnish: ["tapestry"] },
    ],
    colorways: [
      { name: "Pompeian red", wall: "#9e3b2c", trim: "#2b2320", floor: "#b8683f", wood: "#6b4a30", accent: "#d9b24a" },
      { name: "Ostia ochre", wall: "#d9b48a", trim: "#8f4a32", floor: "#b8683f", wood: "#7a5234", accent: "#a33a2a" },
      { name: "Herculaneum black", wall: "#34302c", trim: "#a33a2a", floor: "#c8b89a", wood: "#5a3b26", accent: "#d9b24a" },
      { name: "Villa white", wall: "#e6dccb", trim: "#5f7f6a", floor: "#a89880", wood: "#7a5234", accent: "#3f6f8a" },
    ],
  },
];
