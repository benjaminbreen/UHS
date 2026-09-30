import { interiorProfile, type InteriorProfile } from "./index";

export type InteriorSite = {
  lon: number;
  lat: number;
  year: number;
  /** Settlement form from the world setting: city, town, village, camp... */
  settlement?: string;
  /** Tents, shelters or other portable dwellings rather than houses. */
  camp?: boolean;
  /** Entered through the roof, as at Çatalhöyük. */
  roofHatch?: boolean;
};

type Rule = { lon: [number, number]; lat: [number, number]; from?: number; to?: number; pick: (s: InteriorSite) => string };
const urban = (s: InteriorSite) => s.settlement === "city" || s.settlement === "town";

// First match wins, so narrower regions and dates come before broader ones.
const RULES: Rule[] = [
  { lon: [25, 50], lat: [30, 42], to: -5000, pick: () => "catalhoyuk-house" },
  { lon: [-12, 2], lat: [55, 61], to: -2000, pick: () => "skara-brae-house" },
  { lon: [-10, 30], lat: [44, 58], to: -2000, pick: () => "lbk-longhouse" },
  { lon: [110, 156], lat: [-45, -10], to: 1900, pick: (s) => (s.lat > -22 ? "arnhem-bark-shelter" : "gunditjmara-stone-house") },
  { lon: [85, 125], lat: [40, 53], from: 1000, pick: () => "mongol-ger" },
  { lon: [-115, -93], lat: [30, 52], from: 1650, to: 1895, pick: () => "plains-tipi" },
  { lon: [34, 60], lat: [14, 33], pick: (s) => (s.camp || !urban(s) ? "bedouin-tent" : "maghrebi-dar") },
  { lon: [-18, 12], lat: [20, 37.5], from: 700, pick: (s) => (urban(s) ? "maghrebi-dar" : "amazigh-house") },
  { lon: [5, 30], lat: [35, 46], from: -600, to: 500, pick: (s) => (s.camp ? "roman-army-tent" : "roman-domus") },
  { lon: [-12, 32], lat: [54, 72], from: 750, to: 1100, pick: () => "norse-longhouse" },
  { lon: [2, 8], lat: [49.5, 54], from: 1550, to: 1800, pick: (s) => (urban(s) ? "flemish-townhouse" : "medieval-cottage") },
  { lon: [-11, 30], lat: [42, 60], from: 1000, to: 1700, pick: () => "medieval-cottage" },
  { lon: [128, 147], lat: [30, 46], from: 1400, to: 1945, pick: () => "japanese-minka" },
  { lon: [124, 131], lat: [33, 43.5], from: 1400, to: 1945, pick: () => "korean-ondol-room" },
  { lon: [98, 123], lat: [18, 42], from: 1300, to: 1912, pick: () => "ming-study" },
  { lon: [68, 76], lat: [22, 31], from: 1500, pick: (s) => (urban(s) ? "rajasthani-haveli" : "gangetic-village-house") },
  { lon: [68, 92], lat: [8, 32], from: 1500, pick: () => "gangetic-village-house" },
  { lon: [-130, -60], lat: [25, 55], from: 1900, to: 1960, pick: (s) => (urban(s) ? "art-deco-apartments" : "farmhouse-1930s") },
  { lon: [-180, 180], lat: [-85, 85], from: 1920, to: 1960, pick: (s) => (urban(s) ? "art-deco-apartments" : "farmhouse-1930s") },
];

/** The dwelling profile for a place and date. Falls back by era when no
 * regional rule covers the site; the fallback is a guess and says so by
 * being the plainest dwelling of its period. */
export function interiorProfileFor(site: InteriorSite): InteriorProfile {
  if (site.roofHatch) return interiorProfile("catalhoyuk-house")!;
  if (site.camp && site.year >= 1970) return interiorProfile("modern-tent")!;
  for (const r of RULES) {
    if (site.lon < r.lon[0] || site.lon > r.lon[1] || site.lat < r.lat[0] || site.lat > r.lat[1]) continue;
    if (r.from !== undefined && site.year < r.from) continue;
    if (r.to !== undefined && site.year > r.to) continue;
    const found = interiorProfile(r.pick(site));
    if (found) return found;
  }
  if (site.camp) return interiorProfile(site.year < 1700 ? "plains-tipi" : "modern-tent")!;
  if (site.year < -3000) return interiorProfile("lbk-longhouse")!;
  if (site.year < 1850) return interiorProfile("medieval-cottage")!;
  return interiorProfile("farmhouse-1930s")!;
}
