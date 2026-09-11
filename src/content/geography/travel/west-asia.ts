import type { TravelLocation } from "../../../world/travel/types";
const source =
  "https://orias.berkeley.edu/resources-teachers/travels-ibn-battuta";
const city = (
  id: string,
  name: string,
  landscape: string,
  lon: number,
  lat: number,
): TravelLocation => ({
  id,
  name,
  landscape,
  lon,
  lat,
  kind: "settlement",
  importance: 3,
  settlement: { from: 1200, to: 1400, rank: "city", source },
  note: "Inferred 1200–1400 urban scenario; the review route is not Ibn Battuta’s literal itinerary.",
});
const land = (
  id: string,
  name: string,
  lon: number,
  lat: number,
): TravelLocation => ({
  id,
  name,
  landscape: name,
  lon,
  lat,
  kind: "landscape",
  importance: 2,
});
export const westAsiaTravel = [
  city("gaza", "Gaza", "Southern Levant coast", 34.45, 31.5),
  city("damascus", "Damascus", "Ghouta plain", 36.29, 33.51),
  city("baghdad", "Baghdad", "Tigris plain", 44.36, 33.31),
  city("isfahan", "Isfahan", "Zayandeh valley", 51.67, 32.65),
  city("herat", "Herat", "Hari valley", 62.2, 34.35),
  city("kabul", "Kabul", "Kabul valley", 69.17, 34.55),
  city("multan", "Multan", "Chenab plain", 71.47, 30.2),
  city("delhi", "Delhi", "Yamuna plain", 77.23, 28.61),
  city("calicut", "Calicut", "Malabar coast", 75.78, 11.26),
  land("syrian-steppe", "Syrian steppe", 39.1, 33.4),
  land("euphrates", "Euphrates valley", 42.5, 33.5),
  land("zagros", "Zagros foothills", 46.9, 33.8),
  land("persian-uplands", "Persian uplands", 49.4, 33.3),
  land("persian-routes", "Eastern Persian caravan routes", 57.3, 33.0),
  land("afghan-highlands", "Afghan highlands", 65.8, 34.4),
  land("khyber", "Khyber passage", 71.12, 34.08),
  land("indus", "Indus valley", 72.2, 32.3),
  land("punjab", "Punjab plain", 74.3, 30.1),
  land("western-ghats", "Western Ghats", 74.7, 14.0),
];
