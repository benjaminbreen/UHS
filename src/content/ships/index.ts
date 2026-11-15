import { hash } from "../../core/random";
import { personFits } from "../sewers";
import { hullById, hulls } from "./hulls";
import { shipPeople } from "./people";
import type { Hull } from "./types";

export type { BelowDeck, Hull, ShipKind } from "./types";
export { hullById, hulls, shipPeople };
export { shipItems } from "./items";

type Place = { lon: number; lat: number; year: number };

const inBox = ([w, s, e, n]: readonly number[], p: Place) => p.lat >= s && p.lat <= n && p.lon >= w && p.lon <= e;

/** The hulls that could be bound for this place in this year. */
export const hullsFor = (p: Place) => hulls.filter((h) => p.year >= h.years[0] && p.year < h.years[1] && h.where.some((b) => inBox(b, p)));

/** One hull for a voyage, by weight among those that fit, of the id or kind asked for if one fits. */
export function hullFor(p: Place, seed: string, want?: string): Hull | undefined {
  const all = hullsFor(p), named = all.filter((h) => h.id === want || h.kind === want);
  const fits = named.length ? named : all;
  let roll = (hash(`${seed}|hull`) / 0x1_0000_0000) * fits.reduce((n, h) => n + h.weight, 0);
  return fits.find((h) => (roll -= h.weight) < 0) ?? fits.at(-1);
}

/** Crew and passengers of this hull at this place and date. */
export const shipCrew = (hull: Hull, p: Place) => shipPeople.filter((who) => hull.people.includes(who.id) && personFits(who, p, hull.kind));

const NAMES: Record<string, readonly string[]> = {
  english: ["Hartwell", "Earl of Abergavenny", "Royal Charlotte", "Neptune", "Hope", "Prince of Wales", "Lady Juliana", "Brilliant", "Mary Ann", "Good Intent", "Albion", "Fortitude"],
  emigrant: ["Annie Jane", "Star of the West", "Ticonderoga", "Marco Polo", "Dunbrody", "Lord Ashley", "Bride of Erin", "Sea King", "Western Star", "Hopewell"],
  iberian: ["San José", "Nuestra Señora del Rosario", "Santa Ana", "San Pedro", "Bom Jesus", "São Gabriel", "Santiago", "La Concepción"],
  dutch: ["Batavia", "Amsterdam", "Zeelandia", "Hollandia", "Vergulde Draeck", "Witte Leeuw", "Mauritius"],
  french: ["Saint-Géran", "La Belle Poule", "Le Comte d'Artois", "L'Espérance", "La Bonne Mère", "Saint-Louis"],
  junk: ["True Star", "Golden Peace", "Abundant Harvest", "Fair Wind", "Lasting Fortune", "Golden Dragon", "Ten Thousand Li", "Smooth Voyage"],
  dhow: ["Salama", "Fath al-Khayr", "Mubarak", "al-Nasr", "Ghazi", "Bushra", "al-Hamdi", "Zahra"],
  steamer: ["City of Glasgow", "Pomerania", "Hellas", "Bavaria", "Columbia", "Rajputana", "Saxonia", "Orient", "Patria", "Rotterdam", "Lombardia", "Kiangsu"],
};

/** Who flies what at the stern, by where she is bound and when. */
export function shipNation(hull: Hull, p: Place): "english" | "iberian" | "dutch" | "french" | "us" | "none" {
  if (hull.kind === "junk" || hull.kind === "dhow") return "none";
  const { lon, lat, year } = p;
  if (year < 1830 && (inBox([-10, 36, 3.5, 44], p) || (lon < -34 && lat < 30 && lon > -120) || inBox([116, 4, 127, 20], p))) return "iberian";
  if (year < 1800 && (inBox([3, 50.5, 7.5, 53.6], p) || inBox([95, -11, 141, 6], p) || inBox([17, -35, 20, -33], p))) return "dutch";
  if (inBox([-5, 42.3, 8, 51.1], p) || (year < 1765 && inBox([-80, 42, -59, 52], p))) return "french";
  if (year >= 1790 && inBox([-125, 25, -66, 49], p)) return "us";
  return "english";
}

export function shipName(hull: Hull, p: Place, seed: string) {
  const nation = shipNation(hull, p);
  const list = hull.kind === "junk" ? NAMES.junk : hull.kind === "dhow" ? NAMES.dhow : hull.kind === "steamer" ? NAMES.steamer
    : hull.id === "emigrant-ship" && nation === "english" ? NAMES.emigrant : NAMES[nation === "us" ? "english" : nation === "none" ? "english" : nation];
  const name = list[hash(`${seed}|ship-name`) % list.length];
  return hull.kind === "steamer" ? `SS ${name}` : name;
}

/** Days of sea left when a life begins aboard. */
export function voyageDays(hull: Hull, seed: string) {
  const [lo, hi] = hull.kind === "steamer" ? [1, 3] : [2, 5];
  return lo + (hash(`${seed}|voyage`) % (hi - lo + 1));
}
