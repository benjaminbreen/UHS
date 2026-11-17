import { clinic, flat, hotel } from "./rooms";
import { officeFor, withLift } from "../interiors/offices";
import type { InteriorProfile } from "../interiors/types";
import type { TowerStyle } from "./index";

const DECO = [
  { name: "Walnut and brass", wall: "#d8ccb0", trim: "#3a2a1e", floor: "#c8b89c", wood: "#4a2e1e", accent: "#b8903a" },
  { name: "Black marble and gold", wall: "#2e2a2a", trim: "#b8903a", floor: "#d8ccb4", wood: "#2a1e1a", accent: "#b8903a" },
  { name: "Rose and silver", wall: "#e0c0a8", trim: "#5a6a7a", floor: "#d0c4b4", wood: "#5a3a2a", accent: "#8a9aaa" },
];

const lobby: InteriorProfile = {
  id: "tower-lobby-deco",
  label: "Skyscraper lobby",
  region: "New York, Chicago, Detroit",
  period: "1923 – 1955",
  when: { start: { year: 1923 }, end: { year: 1955 } },
  basis: "documented",
  note: "The lobbies of the Chrysler, Chanin and Fisher buildings: marble walls, a terrazzo floor, a bank of lifts with bronze doors and dial indicators, the building's directory, a cigar and newspaper stand by the door.",
  shapes: ["rect"],
  size: [18, 9],
  door: "door",
  windowStyle: "shutter",
  fire: "none",
  smokehole: false,
  seating: "chair",
  sleep: "none",
  trades: ["household"],
  uses: ["office"],
  furnish: ["elevator", "elevator", "clock", "counter", "plant", "plant", "frame", "armchair", "lamp"],
  styles: { counter: "deco", stool: "chair" },
  regulars: { hours: [8, 19], fill: 0.3 },
  looks: [
    { wall: "deco", floor: "terrazzo", wear: 0.2, soot: 0.05 },
    { wall: "deco", floor: "terrazzo", dado: "panel", wear: 0.1, soot: 0 },
    { wall: "deco", floor: "terrazzo", dado: "panel", wear: 0.02, soot: 0 },
  ],
  colorways: DECO,
};

const suite: InteriorProfile = {
  ...lobby,
  id: "tower-suite-deco",
  label: "Executive suite",
  door: "lift",
  note: "The top-floor offices a company kept for its own officers: panelled walls, a deep carpet, a partner's desk and club chairs, the city through every window.",
  size: [14, 10],
  furnish: ["elevator", "desk", "armchair", "armchair", "sofa", "rug", "clock", "frame", "frame", "plant", "lamp", "radio"],
  styles: { shelf: "bookcase" },
  regulars: { hours: [9, 17], fill: 0.4 },
  looks: [
    { wall: "panel", floor: "carpet", wear: 0.1, soot: 0, windows: 5 },
    { wall: "panel", floor: "carpet", dado: "panel", wear: 0.05, soot: 0, windows: 5 },
    { wall: "deco", floor: "carpet", dado: "panel", wear: 0, soot: 0, windows: 6 },
  ],
};

// Each firm fitted its own floor; these widen the two office colourings so neighbours differ.
const FIRMS = [
  { name: "Grey and oxblood", wall: "#c4c0b8", trim: "#2e2a28", floor: "#6a5a4a", wood: "#4a3428", accent: "#7a2a2a" },
  { name: "Pale blue and walnut", wall: "#b8c8d0", trim: "#2a3038", floor: "#7a6448", wood: "#5a3a24", accent: "#2a4a6a" },
  { name: "Buff and mahogany", wall: "#e0cca0", trim: "#3a2416", floor: "#8a6040", wood: "#4a2414", accent: "#8a5a2a" },
  { name: "Rose and walnut", wall: "#d8bcb0", trim: "#3a2a2a", floor: "#7a5a48", wood: "#4a3020", accent: "#5a3a5a" },
];
const typing = officeFor("Offices", 1930)!;
const offices = withLift({ ...typing, colorways: [...typing.colorways, ...FIRMS] });
const bank = withLift(officeFor("Bank", 1930)!);
const store = withLift(officeFor("Department store", 1930)!);

/** The New York office tower between the 1916 zoning law and the glass slab:
 * a lobby of lifts, a banking hall or showroom low down, then floor after
 * floor of offices. */
export const newYork: TowerStyle = {
  id: "new-york-1930",
  label: "New York office tower",
  frames: "mod-deco-",
  storeys: [22, 64],
  lift: { name: "Otis lift", perFloor: 2.5 },
  lobby,
  section: { stone: ["#e2d2ac", "#c8b48c", "#8a7658"], halves: [[0, 74], [0.72, 58], [0.94, 42]], crown: "step" },
  rooms: { offices, bank, showroom: store, suite, flat, hotel, clinic },
};
