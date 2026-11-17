import { clinic, flat, hotel } from "./rooms";
import { officeFor, withLift } from "../interiors/offices";
import type { InteriorProfile } from "../interiors/types";
import type { TowerStyle } from "./index";

const lobby: InteriorProfile = {
  id: "tower-lobby-tropic",
  label: "Tower lobby",
  region: "Bangkok, Kuala Lumpur, Singapore, Jakarta, Manila",
  period: "1990 – present",
  when: { start: { year: 1990 }, end: { year: 2100 } },
  basis: "documented",
  note: "The ground floor of a tower on Sathorn or Jalan Sudirman: polished granite, the air conditioning turned up high, a reception desk and security gates, a spirit house or a prayer room near the door, and the mall's escalators beyond.",
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
  furnish: ["elevator", "elevator", "elevator", "elevator", "counter", "clock", "plant", "plant", "sofa", "frame"],
  styles: { stool: "chair" },
  regulars: { hours: [7, 22], fill: 0.4 },
  looks: [
    { wall: "ashlar", floor: "terrazzo", wear: 0, soot: 0 },
    { wall: "plaster", floor: "tile", dado: "ashlar", wear: 0.05, soot: 0 },
    { wall: "ashlar", floor: "tile", wear: 0.1, soot: 0.05 },
  ],
  colorways: [
    { name: "Black granite and gold", wall: "#3a3838", trim: "#c8a040", floor: "#d8d0c4", wood: "#4a3020", accent: "#c8a040" },
    { name: "Cream marble and teak", wall: "#e8e0d0", trim: "#5a4028", floor: "#d8ccb8", wood: "#7a5032", accent: "#2a6a8a" },
  ],
};

const suite: InteriorProfile = {
  ...lobby,
  id: "tower-suite-tropic",
  label: "Executive suite",
  door: "lift",
  note: "The group chairman's floor: a teak board room, leather sofas for guests, a gilt-framed portrait of the founder, and the river through the glass.",
  size: [14, 10],
  furnish: ["elevator", "desk", "table", "armchair", "armchair", "sofa", "rug", "frame", "frame", "plant", "plant", "lamp"],
  styles: {},
  regulars: { hours: [9, 19], fill: 0.4 },
  looks: [
    { wall: "panel", floor: "carpet", wear: 0.05, soot: 0, windows: 6 },
    { wall: "panel", floor: "carpet", wear: 0, soot: 0, windows: 6 },
    { wall: "plaster", floor: "broadloom", wear: 0, soot: 0, windows: 6 },
  ],
};

const bar: InteriorProfile = {
  ...lobby,
  id: "tower-rooftop-bar",
  label: "Rooftop bar",
  door: "lift",
  program: "serve",
  note: "A bar and restaurant on the roof, open to the warm night air, where tourists and the city's young money pay hotel prices to look down on the traffic.",
  size: [16, 10],
  furnish: ["elevator", "bar", "table", "table", "table", "armchair", "armchair", "sofa", "plant", "plant", "lamp"],
  styles: {},
  regulars: { hours: [17, 24], fill: 0.5 },
  looks: [
    { wall: "panel", floor: "tile", wear: 0.1, soot: 0, windows: 8 },
    { wall: "panel", floor: "tile", wear: 0, soot: 0, windows: 8 },
    { wall: "plaster", floor: "terrazzo", wear: 0, soot: 0, windows: 8 },
  ],
  colorways: [{ name: "Night and gold", wall: "#2a2a34", trim: "#c8a040", floor: "#3a3438", wood: "#3a2418", accent: "#c8a040" }],
};

const open = officeFor("Offices", 2005)!;
const offices = withLift({
  ...open,
  colorways: [
    ...open.colorways,
    { name: "White and blue", wall: "#e8eaec", trim: "#3a4450", floor: "#8a94a0", wood: "#7a6450", accent: "#2a5a9a" },
    { name: "Grey and red", wall: "#d4d0cc", trim: "#3a3434", floor: "#6a6a6a", wood: "#5a4a40", accent: "#b03030" },
  ],
});

/** A tower of the Southeast Asian boom: a mall in the podium, offices,
 * serviced flats or a hotel above, a bar on the roof. */
export const tropic: TowerStyle = {
  id: "tropic-2005",
  label: "Office tower",
  frames: "mod-tropic-",
  storeys: [25, 60],
  lift: { name: "Mitsubishi lift", perFloor: 1 },
  lobby,
  section: { stone: ["#e8e8e4", "#b8bcc0", "#5a6068"], halves: [[0, 74], [0.1, 56]], crown: "dome" },
  rooms: { offices, bank: withLift(officeFor("Bank", 2005)!), showroom: withLift(officeFor("Department store", 2005)!), suite, lounge: bar, flat, hotel, clinic },
};
