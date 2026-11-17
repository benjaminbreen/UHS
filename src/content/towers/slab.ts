import { clinic, flat, hotel } from "./rooms";
import { officeFor, withLift } from "../interiors/offices";
import type { InteriorProfile } from "../interiors/types";
import type { TowerStyle } from "./index";

const lobby: InteriorProfile = {
  id: "tower-lobby-slab",
  label: "Tower lobby",
  region: "American downtowns",
  period: "1952 – present",
  when: { start: { year: 1952 }, end: { year: 2100 } },
  basis: "documented",
  note: "The lobby of Lever House or the Seagram Building: glass walls to the plaza, travertine underfoot, a bank of lifts in a stone core, a guard's desk and the tenants' names in steel letters on the wall.",
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
  furnish: ["elevator", "elevator", "elevator", "counter", "clock", "plant", "sofa", "frame"],
  styles: { stool: "chair" },
  regulars: { hours: [7, 20], fill: 0.3 },
  looks: [
    { wall: "ashlar", floor: "terrazzo", wear: 0.05, soot: 0 },
    { wall: "plaster", floor: "terrazzo", dado: "ashlar", wear: 0.05, soot: 0 },
    { wall: "ashlar", floor: "tile", wear: 0.1, soot: 0 },
  ],
  colorways: [
    { name: "Travertine and bronze", wall: "#e0d4bc", trim: "#4a3a28", floor: "#ccc0a8", wood: "#5a4030", accent: "#8a6a3a" },
    { name: "Steel and green marble", wall: "#c8ccc8", trim: "#2e3a38", floor: "#b8c0bc", wood: "#5a5048", accent: "#2a6a5a" },
    { name: "Granite and walnut", wall: "#b8b4b0", trim: "#2a2828", floor: "#a8a4a0", wood: "#5a3a24", accent: "#3a4a6a" },
  ],
};

const suite: InteriorProfile = {
  ...lobby,
  id: "tower-suite-slab",
  label: "Executive suite",
  door: "lift",
  note: "The top floor a company kept for its officers: a long walnut table in the board room, Barcelona chairs, abstract paintings, and the city through floor-to-ceiling glass.",
  size: [14, 10],
  furnish: ["elevator", "desk", "table", "armchair", "armchair", "sofa", "rug", "frame", "frame", "plant", "lamp"],
  styles: {},
  regulars: { hours: [9, 18], fill: 0.4 },
  looks: [
    { wall: "panel", floor: "carpet", wear: 0.05, soot: 0, windows: 6 },
    { wall: "plaster", floor: "carpet", wear: 0, soot: 0, windows: 6 },
    { wall: "panel", floor: "broadloom", wear: 0, soot: 0, windows: 6 },
  ],
};

const typing = officeFor("Offices", 1965)!;
const offices = withLift({
  ...typing,
  colorways: [
    ...typing.colorways,
    { name: "Grey and teal", wall: "#d4d8d4", trim: "#3a4440", floor: "#7a8480", wood: "#6a5a48", accent: "#2a7a72" },
    { name: "White and orange", wall: "#e8e4dc", trim: "#3a3430", floor: "#8a7a68", wood: "#7a5a3a", accent: "#d06a2a" },
  ],
});

/** The American office tower after Lever House: a lobby behind glass, then
 * the same open floor of desks over and over, a board room on top. */
export const slab: TowerStyle = {
  id: "slab-1960",
  label: "Glass office tower",
  frames: "mod-slab-",
  storeys: [20, 52],
  lift: { name: "Otis lift", perFloor: 1.6 },
  lobby,
  section: { stone: ["#d8ccb0", "#8a7a5a", "#4a3e2e"], halves: [[0, 70]], crown: "flat" },
  rooms: { offices, bank: withLift(officeFor("Bank", 1965)!), showroom: withLift(officeFor("Department store", 1965)!), suite, flat, hotel, clinic },
};
