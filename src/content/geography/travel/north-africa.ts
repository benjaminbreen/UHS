import type { TravelLocation } from "../../../world/travel/types";
const source =
  "https://orias.berkeley.edu/resources-teachers/travels-ibn-battuta/journey/across-north-africa-cairo-1325";
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
  note: "Broad 1200–1400 scenario coverage and inferred urban scale, not a founding date or reconstruction of the full itinerary.",
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
export const northAfricaTravel = [
  city("marrakesh", "Marrakesh", "Haouz plain", -7.9811, 31.6295),
  city("fez", "Fez", "Saiss plain", -5.0, 34.034),
  city("tlemcen", "Tlemcen", "Tlemcen foothills", -1.315, 34.883),
  city("bejaia", "Béjaïa", "Kabyle coast", 5.067, 36.75),
  city("constantine", "Constantine", "Constantine plateau", 6.6147, 36.365),
  city("tunis", "Tunis", "Tunisian coast", 10.18, 36.807),
  city("tripoli", "Tripoli", "Tripolitanian coast", 13.191, 32.887),
  city("alexandria", "Alexandria", "Western Nile Delta", 29.92, 31.2),
  city("cairo", "Cairo", "Lower Nile valley", 31.2357, 30.0444),
  land("atlas-foothills", "Atlas foothills", -6.3, 32.65),
  land("moroccan-steppe", "Eastern Moroccan steppe", -2.5, 34.25),
  land("tell-foothills", "Tell foothills", 2.4, 35.85),
  land("tunisian-steppe", "Tunisian steppe", 10.0, 34.55),
  land("sirte-coast", "Gulf of Sirte", 17.4, 30.5),
  land("cyrenaica", "Cyrenaican uplands", 21.7, 32.5),
  land("marmarica", "Marmarica", 25.4, 31.35),
  land("delta-fields", "Nile Delta", 30.7, 30.65),
  land("sinai", "Northern Sinai", 33.6, 30.9),
];
