import { withLift } from "../interiors/offices";
import type { InteriorProfile } from "../interiors/types";

const room = (o: Pick<InteriorProfile, "id" | "label" | "note" | "size" | "sleep" | "furnish" | "looks" | "colorways"> & Partial<InteriorProfile>): InteriorProfile =>
  withLift({
    region: "Industrial world",
    period: "1900 – present",
    when: { start: { year: 1900 }, end: { year: 2100 } },
    basis: "documented",
    shapes: ["rect"],
    door: "door",
    windowStyle: "shutter",
    fire: "none",
    smokehole: false,
    seating: "chair",
    trades: ["household"],
    styles: { stool: "chair", shelf: "bookcase" },
    ...o,
  });

/** Storeys that are not offices, shared by every tower that has them. */
export const flat = room({
  id: "tower-flat",
  label: "Flat",
  note: "A flat high in a tower: a living room with a view, a bedroom off it, the radio or the television, and the lift outside the door.",
  size: [13, 9],
  sleep: "bed",
  furnish: ["sofa", "armchair", "table", "radio", "rug", "lamp", "shelf", "clock", "frame", "plant", "dresser"],
  clutter: ["book", "paper", "cup", "flowers", "shoes"],
  regulars: { hours: [0, 24], fill: 0.3 },
  looks: [
    { wall: "wallpaper", floor: "parquet", wear: 0.3, soot: 0.05, windows: 3 },
    { wall: "plaster", floor: "parquet", wear: 0.15, soot: 0, windows: 4 },
    { wall: "plaster", floor: "carpet", dado: "panel", wear: 0.05, soot: 0, windows: 4 },
  ],
  colorways: [
    { name: "Cream and walnut", wall: "#e4dcc4", trim: "#3a2a1e", floor: "#8a6440", wood: "#5a3a24", accent: "#8a3a2a" },
    { name: "Sage and teak", wall: "#c8d0b8", trim: "#3a3a2a", floor: "#9a7048", wood: "#7a5032", accent: "#3a5a7a" },
  ],
});

export const hotel = room({
  id: "tower-hotel",
  label: "Hotel floor",
  note: "A hotel's guest floor: a carpeted corridor of numbered doors, a room made up with a bed, a writing desk and an armchair, the maid's trolley by the lift.",
  size: [13, 9],
  sleep: "bed",
  furnish: ["desk", "armchair", "lamp", "lamp", "rug", "frame", "plant", "dresser"],
  clutter: ["paper", "cup", "flowers"],
  regulars: { hours: [0, 24], fill: 0.3 },
  looks: [
    { wall: "wallpaper", floor: "carpet", wear: 0.2, soot: 0, windows: 3 },
    { wall: "panel", floor: "carpet", wear: 0.1, soot: 0, windows: 3 },
    { wall: "wallpaper", floor: "carpet", dado: "panel", wear: 0.05, soot: 0, windows: 4 },
  ],
  colorways: [
    { name: "Gold and maroon", wall: "#e0cca0", trim: "#4a1e1e", floor: "#7a2a2a", wood: "#4a2a1e", accent: "#b8903a" },
    { name: "Blue and cream", wall: "#e8e0cc", trim: "#2a3a5a", floor: "#3a4a6a", wood: "#5a4030", accent: "#b8903a" },
  ],
});

export const clinic = room({
  id: "tower-clinic",
  label: "Doctor's practice",
  note: "A practice taking an office floor: a waiting room of chairs and magazines, a receptionist's desk, and a consulting room with a couch, a cabinet of instruments and a screen.",
  size: [13, 9],
  sleep: "bed",
  program: "ward",
  furnish: ["desk", "shelf", "clock", "plant", "frame", "lamp"],
  clutter: ["paper", "cup"],
  regulars: { hours: [9, 18], fill: 0.4 },
  looks: [
    { wall: "plaster", floor: "linoleum", wear: 0.2, soot: 0, windows: 3 },
    { wall: "plaster", floor: "tile", dado: "panel", wear: 0.1, soot: 0, windows: 3 },
    { wall: "plaster", floor: "linoleum", wear: 0.05, soot: 0, windows: 4 },
  ],
  colorways: [
    { name: "White and green", wall: "#e8ece4", trim: "#3a4a3a", floor: "#8aa094", wood: "#7a6450", accent: "#3a7a5a" },
    { name: "Cream and blue", wall: "#ece4d0", trim: "#3a4a6a", floor: "#8a94a8", wood: "#6a5442", accent: "#3a5a8a" },
  ],
});
