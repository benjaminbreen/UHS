import { hash } from "../../core/random";
import { personFits } from "../sewers";
import { hullById, hulls } from "./hulls";
import { shipPeople } from "./people";
import type { Hull, Medium } from "./types";

export type { BelowDeck, Hull, Medium, ShipKind } from "./types";
export { hullById, hulls, shipPeople };
export { shipItems } from "./items";

type Place = { lon: number; lat: number; year: number };

const inBox = ([w, s, e, n]: readonly number[], p: Place) => p.lat >= s && p.lat <= n && p.lon >= w && p.lon <= e;

/** The hulls that could be bound for this place in this year. */
export const hullsFor = (p: Place) => hulls.filter((h) => p.year >= h.years[0] && p.year < h.years[1] && h.where.some((b) => inBox(b, p)));

/** One hull for a voyage, by weight among those that fit, of the id or kind asked for if one fits. */
export function hullFor(p: Place, seed: string, want?: string): Hull | undefined {
  const all = hullsFor(p), named = all.filter((h) => h.id === want || h.kind === want);
  const fits = named.length ? named : all.filter((h) => h.weight > 0);
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
  if (hull.medium) return hull.label;
  const nation = shipNation(hull, p);
  const list = hull.kind === "junk" ? NAMES.junk : hull.kind === "dhow" ? NAMES.dhow : hull.kind === "steamer" ? NAMES.steamer
    : hull.id === "emigrant-ship" && nation === "english" ? NAMES.emigrant : NAMES[nation === "us" ? "english" : nation === "none" ? "english" : nation];
  const name = list[hash(`${seed}|ship-name`) % list.length];
  return hull.kind === "steamer" ? `SS ${name}` : name;
}

/** Days of sea left when a life begins aboard. */
export function voyageDays(hull: Hull, seed: string) {
  if (hull.kind === "nowhere") return 36500;
  if (hull.kind === "capsule" || hull.kind === "aircraft" || hull.kind === "basket") return 1;
  const [lo, hi] = hull.kind === "steamer" ? [1, 3] : [2, 5];
  return lo + (hash(`${seed}|voyage`) % (hi - lo + 1));
}

/** How each surround is spoken of: the line under the screen, what is seen out of the window, arriving and getting out. */
export const mediumWords: Record<Medium, { under: string; view: string; arrive: string; out: string; leave: string }> = {
  orbit: { under: "IN ORBIT", view: "The Earth turns below: cloud over blue water, a brown coast, the thin bright line of the air at the edge. Above it the sky is black.",
    arrive: "The retro-rockets fire. The capsule comes down through the air under its parachutes and hits the sea. You can get out.", out: "Climb out", leave: "You climb out into daylight. Your legs do not want to hold you." },
  lunar: { under: "IN LUNAR ORBIT", view: "The Moon slides by below, grey and pitted, with long black shadows in the craters. The Earth is a small blue half-disc above the horizon.",
    arrive: "The long fall home ends in the sea under three parachutes. You can get out.", out: "Climb out", leave: "You climb out into daylight. Your legs do not want to hold you." },
  stars: { under: "ADRIFT AMONG THE STARS", view: "Stars in every direction, steady and sharp, more than you have ever seen. Nothing is near.",
    arrive: "The capsule comes down through the air and hits the sea. You can get out.", out: "Climb out", leave: "You are back on solid ground." },
  deep: { under: "SUBMERGED", view: "Nothing to see but the dials. Outside the hull the water is black, and the boat creaks as she goes deeper.",
    arrive: "\"Surface!\" The tanks blow, the hatch opens and fresh air pours in. The boat is alongside. You can go ashore.", out: "Go ashore", leave: "You climb the ladder into the wind and step ashore. The air tastes of something other than diesel." },
  sky: { under: "IN THE AIR", view: "Cloud lies below like a white floor with holes in it. Through the holes there are fields, a river, the shadow of a cloud crossing a town.",
    arrive: "The ground comes up, then the bump and the long run to a stop. You can get out.", out: "Climb out", leave: "You climb down onto the grass. The ground feels very still." },
  mist: { under: "IN THE MIST", view: "Mist in every direction, pale and slow. Shapes move in it and are gone before you can say what they were.",
    arrive: "The mist thins. There is a shore. You can walk out onto it.", out: "Walk out", leave: "The mist is behind you. You are somewhere again." },
};
