import { clinic, flat, hotel } from "./rooms";
import { officeFor, withLift } from "../interiors/offices";
import type { InteriorProfile } from "../interiors/types";
import type { TowerStyle } from "./index";

const STALIN = [
  { name: "Marble and oak", wall: "#e4dcc8", trim: "#5a3a24", floor: "#9a6a40", wood: "#5a3420", accent: "#9a2a22" },
  { name: "Red granite and bronze", wall: "#c8a89a", trim: "#4a2a24", floor: "#b8a890", wood: "#4a2a1e", accent: "#b8903a" },
  { name: "Green and walnut", wall: "#b8c4a8", trim: "#3a3a2a", floor: "#8a6440", wood: "#4a3020", accent: "#8a2a22" },
];

const lobby: InteriorProfile = {
  id: "tower-lobby-stalin",
  label: "High-rise vestibule",
  region: "Moscow, Warsaw, Riga",
  period: "1949 – 1991",
  when: { start: { year: 1949 }, end: { year: 1991 } },
  basis: "documented",
  note: "The vestibules of the Moscow high-rises: marble walls, bronze lamps and a coffered ceiling, a bank of lifts, a porter's desk where passes were checked, and portraits on the walls.",
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
  furnish: ["elevator", "elevator", "counter", "clock", "frame", "frame", "plant", "lamp", "lamp"],
  styles: { counter: "deco", stool: "chair" },
  regulars: { hours: [8, 19], fill: 0.3 },
  looks: [
    { wall: "ashlar", floor: "parquet", wear: 0.2, soot: 0.05 },
    { wall: "ashlar", floor: "terrazzo", dado: "panel", wear: 0.1, soot: 0 },
    { wall: "panel", floor: "terrazzo", dado: "panel", wear: 0.05, soot: 0 },
  ],
  colorways: STALIN,
};

const suite: InteriorProfile = {
  ...lobby,
  id: "tower-suite-stalin",
  label: "Minister's office",
  door: "lift",
  note: "A minister's office at the top of a ministry: oak panelling, a long table for the collegium under a portrait, a desk with three telephones, a carpet runner from the door.",
  size: [14, 10],
  furnish: ["elevator", "desk", "table", "armchair", "armchair", "rug", "clock", "frame", "frame", "plant", "lamp", "radio"],
  styles: { shelf: "bookcase" },
  regulars: { hours: [9, 18], fill: 0.4 },
  looks: [
    { wall: "panel", floor: "parquet", wear: 0.1, soot: 0, windows: 5 },
    { wall: "panel", floor: "carpet", dado: "panel", wear: 0.05, soot: 0, windows: 5 },
    { wall: "panel", floor: "carpet", dado: "panel", wear: 0, soot: 0, windows: 6 },
  ],
};

const BUREAUS = [
  { name: "Pale green and oak", wall: "#c4d0b4", trim: "#3a3a2a", floor: "#8a6a44", wood: "#5a4028", accent: "#2a4a3a" },
  { name: "Cream and brown", wall: "#e0d4b4", trim: "#3a2a1e", floor: "#7a5a3a", wood: "#4a3020", accent: "#7a2a22" },
];
const typing = officeFor("Offices", 1955)!;
const offices = withLift({ ...typing, colorways: [...typing.colorways, ...BUREAUS] });
const store = withLift(officeFor("Department store", 1955)!);

/** The seven Moscow high-rises of 1947-1957 and their copies in Warsaw and
 * Riga: offices in the tiers, a shop low down, a suite at the top. */
export const moscow: TowerStyle = {
  id: "moscow-1955",
  label: "Moscow high-rise",
  frames: "mod-vysotka-",
  storeys: [20, 32],
  lift: { name: "KMZ lift", perFloor: 3 },
  lobby,
  section: { stone: ["#f0e6cc", "#d8c8a4", "#8a4a3a"], halves: [[0, 80], [0.4, 60], [0.66, 44], [0.87, 30]], crown: "spire" },
  rooms: { offices, store, suite, flat, hotel, clinic },
};
