import { regionsByArea } from "../characters/resolve";
import type { CultureId } from "../history/types";

/**
 * A map label for a coordinate. The naming atlas already divides the world into
 * named regions with boxes, so it doubles as the region layer; the narrowest
 * box containing the point wins, and a tie falls to the earlier id.
 */
const byArea = regionsByArea;
export function regionAt(
  lon: number,
  lat: number,
): { id: string; label: string; culture: CultureId } | undefined {
  return byArea.find(
    (r) =>
      lon >= r.bounds[0] &&
      lon <= r.bounds[2] &&
      lat >= r.bounds[1] &&
      lat <= r.bounds[3],
  );
}

/**
 * The narrowest *named* region, skipping the continental backstops.
 *
 * The backstops exist so that every coordinate gets some name pool, not to
 * describe anywhere. Reading one back as a label is how a start in the Sierra
 * Madre Oriental came to announce itself as "North America" — the vaguest
 * thing on the map, next to a place name that is one of the most specific.
 */
export function describedRegionAt(lon: number, lat: number) {
  return byArea.find(
    (r) =>
      !r.id.startsWith("backstop-") &&
      lon >= r.bounds[0] &&
      lon <= r.bounds[2] &&
      lat >= r.bounds[1] &&
      lat <= r.bounds[3],
  );
}

/* A few naming-atlas labels are filing conventions rather than names for
 * anywhere: "Cape York Peninsula, Australia – North and Queensland" is not
 * something a person would say. */
const asQualifier: Record<string, string> = {
  "oceania-australia-southeast": "Southeast Australia",
  "oceania-australia-outback-and-center": "the Australian interior",
  "oceania-australia-north-and-queensland": "northern Australia",
  "oceania-australia-west-and-desert": "Western Australia",
};

const words = (s: string) => s.toLowerCase().split(/[^a-z]+/i).filter(Boolean);

/** Labels that read badly after "in" however the article falls. */
const inPhrase: Record<string, string> = {
  "Croatia and Environs": "Croatia",
  "Greece and Aegean": "Greece and the Aegean",
  "Maldives and Laccadives": "the Maldives",
  "Mexico and Central Highlands": "the Mexican highlands",
  "Himalayas and Northeast": "the Himalayas",
  "Hawaii and Central Pacific": "Hawaii and the central Pacific",
  "Taiwan and East China Sea": "Taiwan and the East China Sea",
  "Ural and Arctic Europe": "the Urals and Arctic Europe",
  "Llanos and Orinoco": "the Llanos and the Orinoco",
  "Madagascar and Islands": "Madagascar",
  "Hudson Bay": "the Hudson Bay lowlands",
  "Andes North": "the northern Andes",
  "Andes South": "the southern Andes",
};
const takesThe = new Set(["Valley", "Plateau", "Archipelago", "Basin", "Lowlands", "Plain", "Plains", "Delta", "Region", "Islands", "Isles", "Hinterland", "Peninsula", "Coast", "Isthmus", "Countries", "Antilles", "Highlands", "Fjords", "Slopes", "Foothills", "Corridor", "Mountains", "Shield", "Seaboard", "Lands", "Interior", "Woodlands", "Forests", "Rift", "Oases", "Rockies", "Steppes", "Strait", "Headwaters", "Territory", "Lakes", "Upper", "Lower", "Middle", "Horn"]);
const namesTakingThe = new Set(["Levant", "Bosporus", "Caucasus", "Philippines", "Balkans", "Southwest", "Southeast", "Maghreb", "Sahel", "Sahara", "Amur", "Zambezi", "Arctic", "Azores", "Gran Chaco"]);

/** The region as it reads after "in": "the Levant", "Anatolia". Undefined
 * where there is none or it would repeat the place's own name. */
export function regionPhrase(place: { location: string; lon: number; lat: number }) {
  const region = describedRegionAt(place.lon, place.lat);
  if (!region) return;
  const label = asQualifier[region.id] ?? region.label;
  const had = new Set(words(place.location));
  if (words(label).every((w) => had.has(w))) return;
  if (inPhrase[label]) return inPhrase[label];
  if (/^the /i.test(label)) return `the ${label.slice(4)}`;
  const head = label.split(/ and | – /)[0];
  const parts = [head.split(" ")[0], head.split(" ").at(-1)!, label.split(" ").at(-1)!];
  return parts.some((w) => takesThe.has(w)) || namesTakingThe.has(head) ? `the ${label}` : label;
}

/**
 * Place first, region second: "Sierra Madre Oriental, Mexican Highlands". One
 * name is specific and one is an anchor the reader already holds, and neither
 * does that job alone.
 *
 * The region is dropped where it repeats the place — "Valley of Mexico,
 * Valley of Mexico" — or where nothing but a backstop covers the point.
 */
export function placeLabel(place: { location: string; lon: number; lat: number }) {
  const region = describedRegionAt(place.lon, place.lat);
  if (!region) return place.location;
  const label = asQualifier[region.id] ?? region.label;
  const had = new Set(words(place.location));
  const repeats = words(label).every((w) => had.has(w));
  return repeats ? place.location : `${place.location}, ${label}`;
}
