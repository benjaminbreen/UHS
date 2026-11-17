import { clinic, flat } from "./rooms";
import { officeFor, withLift } from "../interiors/offices";
import type { InteriorProfile } from "../interiors/types";
import type { TowerStyle } from "./index";

/** Lifts went into office blocks from the 1890s, and into flats only where
 * there were six storeys or more to climb. */
const lifted = (year: number, storeys: number, offices: boolean) => year >= 1890 && (offices || storeys >= 6);

const stair = (p: InteriorProfile): InteriorProfile => ({ ...p, styles: { ...p.styles, elevator: "stair" } });

const hall = (year: number): InteriorProfile => ({
  id: "block-hall",
  label: "Entrance hall",
  region: "Industrial world",
  period: "1870 – present",
  when: { start: { year: 1870 }, end: { year: 2100 } },
  basis: "documented",
  note: "The ground floor of an office building: a hall with a porter's desk, a board of the firms upstairs, and the stairs or the lift.",
  shapes: ["rect"],
  size: [10, 7],
  door: "door",
  windowStyle: "shutter",
  fire: "none",
  smokehole: false,
  seating: "chair",
  sleep: "none",
  trades: ["household"],
  uses: ["office"],
  furnish: ["elevator", "counter", "clock", "plant", "frame"],
  styles: { stool: "chair" },
  regulars: { hours: [8, 19], fill: 0.2 },
  looks: [
    { wall: "plaster", floor: year < 1930 ? "tile" : "terrazzo", dado: "panel", wear: 0.3, soot: 0.1 },
    { wall: "plaster", floor: "terrazzo", wear: 0.15, soot: 0.05 },
    { wall: "plaster", floor: "tile", wear: 0.05, soot: 0 },
  ],
  colorways: [
    { name: "Cream and brown", wall: "#e0d6c0", trim: "#3a2a1e", floor: "#b8a88c", wood: "#5a3a24", accent: "#6a3a2a" },
    { name: "Grey and green", wall: "#ccd0c8", trim: "#2e3a32", floor: "#a8aca4", wood: "#5a4a3a", accent: "#2a5a4a" },
  ],
});

const SECTION: TowerStyle["section"] = { stone: ["#d8d0c0", "#a8a090", "#5a5448"], halves: [[0, 70]], crown: "flat" };
const made = new Map<string, TowerStyle>();

/** A building of four to nine storeys, as tall as it is drawn: let floor by
 * floor as offices, or a block of flats above the family on the ground floor. */
export function blockStyle(kind: "offices" | "flats", year: number, storeys: number): TowerStyle {
  const up = lifted(year, storeys, kind === "offices");
  const key = `${kind}-${year}-${storeys}-${up}`;
  const known = made.get(key);
  if (known) return known;
  const fit = up ? (p: InteriorProfile) => p : stair;
  const offices = officeFor("Offices", year)!;
  const style: TowerStyle = {
    id: `${kind}-block`,
    label: kind === "offices" ? "Office building" : "Block of flats",
    frames: "",
    storeys: [storeys, storeys],
    lift: up ? { name: "Lift", perFloor: 5 } : { name: "Stairs", perFloor: 14 },
    lobby: kind === "offices" ? fit(hall(year)) : undefined,
    section: SECTION,
    rooms: kind === "offices" ? { offices: fit(withLift(offices)), clinic: fit(clinic), flat: fit(flat) } : { flat: fit(flat) },
  };
  made.set(key, style);
  return style;
}
