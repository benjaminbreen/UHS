import { clinic, flat, hotel } from "./rooms";
import { officeFor, withLift } from "../interiors/offices";
import type { InteriorProfile } from "../interiors/types";
import type { TowerStyle } from "./index";

const lobby: InteriorProfile = {
  id: "tower-lobby-tokyo",
  label: "Tower lobby",
  region: "Tokyo, Osaka, Nagoya",
  period: "1974 – present",
  when: { start: { year: 1974 }, end: { year: 2100 } },
  basis: "documented",
  note: "The ground floor of a Shinjuku or Marunouchi tower: polished granite, a reception counter with two receptionists, a bank of lifts, a board of the tenants by floor, potted palms.",
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
  furnish: ["elevator", "elevator", "elevator", "counter", "clock", "plant", "plant", "sofa", "frame"],
  styles: { stool: "chair" },
  regulars: { hours: [8, 21], fill: 0.35 },
  looks: [
    { wall: "ashlar", floor: "terrazzo", wear: 0.05, soot: 0 },
    { wall: "plaster", floor: "terrazzo", dado: "ashlar", wear: 0.05, soot: 0 },
    { wall: "ashlar", floor: "tile", wear: 0, soot: 0 },
  ],
  colorways: [
    { name: "Pink granite", wall: "#d8b8b0", trim: "#5a4a4a", floor: "#c8bcb4", wood: "#4a3a34", accent: "#3a5a8a" },
    { name: "Grey granite and steel", wall: "#c0c4c8", trim: "#3a3e44", floor: "#b8bcc0", wood: "#5a5048", accent: "#c03a4a" },
    { name: "Travertine and teak", wall: "#e0d4bc", trim: "#5a4430", floor: "#ccc0a8", wood: "#7a5032", accent: "#2a7a6a" },
  ],
};

// The low floors of a Tokyo tower are let the way a zakkyo building is: a different trade behind each lift door.
const venue = (id: string, label: string, note: string, o: Partial<InteriorProfile>): InteriorProfile =>
  withLift({
    ...lobby,
    id,
    label,
    note,
    size: [12, 9],
    furnish: [],
    styles: {},
    looks: [
      { wall: "wallpaper", floor: "carpet", wear: 0.3, soot: 0.2, windows: 2 },
      { wall: "panel", floor: "carpet", wear: 0.2, soot: 0.1, windows: 2 },
      { wall: "wallpaper", floor: "tile", wear: 0.1, soot: 0.05, windows: 3 },
    ],
    ...o,
  });

const snack = venue("tower-snack", "Snack bar", "A snack: a short counter, a mama-san behind it, the regulars' bottles on the shelf with their names on the labels, and a karaoke machine.", {
  program: "serve",
  furnish: ["bar", "stool", "stool", "stool", "stool", "sofa", "lowtable", "radio", "shelf", "lamp", "frame"],
  regulars: { hours: [19, 24], fill: 0.5 },
  colorways: [
    { name: "Plum and gold", wall: "#5a3048", trim: "#2a1a24", floor: "#4a2a3a", wood: "#3a2018", accent: "#d0a040" },
    { name: "Red velvet", wall: "#7a2a2a", trim: "#2a1418", floor: "#3a2a2a", wood: "#4a2418", accent: "#e0c080" },
  ],
});
const mahjong = venue("tower-mahjong", "Mahjong parlour", "A janso: square tables under hanging lamps, the tiles clattering, an ashtray at each corner, the house selling tea and noodles to the tables.", {
  program: "gather",
  furnish: ["table", "table", "table", "stool", "stool", "stool", "stool", "lamp", "lamp", "clock", "shelf"],
  regulars: { hours: [13, 24], fill: 0.6 },
  colorways: [
    { name: "Green baize", wall: "#c8c4a8", trim: "#3a3a2a", floor: "#6a7a5a", wood: "#4a3a28", accent: "#2a6a3a" },
  ],
});
const school = venue("tower-eikaiwa", "English school", "An eikaiwa: small classrooms where office workers and students practise English conversation with a teacher from abroad after work.", {
  program: "rows",
  furnish: ["desk", "frame", "map", "clock", "plant"],
  regulars: { hours: [10, 21], fill: 0.5 },
  looks: [
    { wall: "plaster", floor: "linoleum", wear: 0.1, soot: 0, windows: 3 },
    { wall: "plaster", floor: "broadloom", wear: 0.05, soot: 0, windows: 3 },
    { wall: "plaster", floor: "broadloom", wear: 0, soot: 0, windows: 4 },
  ],
  colorways: [{ name: "White and blue", wall: "#e8e8e0", trim: "#3a4a6a", floor: "#8a96a8", wood: "#7a6450", accent: "#c03a3a" }],
});
const lounge = venue("tower-sky-lounge", "Sky lounge", "The restaurant and bar on the top floor, where a company takes its clients to see the city lit up below.", {
  program: "serve",
  size: [16, 10],
  furnish: ["bar", "table", "table", "table", "armchair", "armchair", "sofa", "plant", "plant", "lamp"],
  regulars: { hours: [11, 24], fill: 0.4 },
  looks: [
    { wall: "panel", floor: "carpet", wear: 0.05, soot: 0, windows: 6 },
    { wall: "panel", floor: "carpet", wear: 0, soot: 0, windows: 6 },
    { wall: "deco", floor: "carpet", wear: 0, soot: 0, windows: 6 },
  ],
  colorways: [
    { name: "Midnight and brass", wall: "#2a2e3a", trim: "#b8903a", floor: "#3a2a3a", wood: "#3a2418", accent: "#b8903a" },
  ],
});
const open = officeFor("Offices", 1988)!;
const offices = withLift({
  ...open,
  colorways: [
    ...open.colorways,
    { name: "Grey and blue", wall: "#d0d4d8", trim: "#3a4048", floor: "#6a7480", wood: "#7a6a58", accent: "#2a4a8a" },
    { name: "Beige and teal", wall: "#e0d8c8", trim: "#4a4038", floor: "#7a8078", wood: "#8a7258", accent: "#2a7a72" },
  ],
});

/** A Tokyo tower of the bubble years: bars, a mahjong parlour and a school
 * low down where the street can find them, open-plan offices above, a
 * lounge on top. */
export const tokyo: TowerStyle = {
  id: "tokyo-1988",
  label: "Tokyo office tower",
  frames: "mod-bubble-",
  storeys: [18, 40],
  lift: { name: "Hitachi lift", perFloor: 1.2 },
  lobby,
  section: { stone: ["#e8ccc4", "#c8a8a0", "#6a5a5a"], halves: [[0, 74]], crown: "gable" },
  rooms: { offices, snack, mahjong, school, lounge, hotel, clinic, flat },
};
