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
  /** What a public building is for, from its claim (`buildingUse`). */
  use?: string;
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

// Where each public interior stands; it serves only the venues its profile lists.
const PUBLIC: Rule[] = [
  { lon: [-11, 25], lat: [47, 62], from: 1450, to: 1850, pick: () => "english-tavern" },
  { lon: [128, 146], lat: [30, 46], from: 1700, pick: () => "izakaya" },
  { lon: [128, 146], lat: [30, 46], from: 1590, pick: () => "sento" },
  // Coffee houses from Cairo and Mecca in the 1510s, Istanbul in 1554, Persia by 1600, in the lands
  // under Ottoman, Safavid and Moroccan rule: not Christian Italy, Spain or Greece outside it.
  { lon: [19, 30], lat: [39, 45], from: 1510, to: 1912, pick: () => "kahvehane" },
  { lon: [26, 45], lat: [36, 42], from: 1510, pick: () => "kahvehane" },
  { lon: [34, 62], lat: [12, 40], from: 1510, pick: () => "kahvehane" },
  { lon: [-18, -1.5], lat: [20, 35.9], from: 1510, pick: () => "kahvehane" },
  { lon: [-1.5, 12], lat: [20, 37.4], from: 1510, pick: () => "kahvehane" },
  { lon: [12, 34], lat: [20, 33], from: 1510, pick: () => "kahvehane" },
  { lon: [-114, -104], lat: [31, 40], from: 700, pick: () => "kiva" },
  { lon: [-10, 50], lat: [24, 56], from: -200, to: 500, pick: () => "roman-gaming-house" },
  { lon: [-11, 45], lat: [34, 72], from: 1400, to: 1950, pick: () => "gaming-house" },
  { lon: [128, 146], lat: [30, 46], from: 1600, to: 1900, pick: () => "bakuchi-den" },
  { lon: [98, 128], lat: [18, 46], from: 1100, to: 1950, pick: () => "chinese-gaming-house" },
  { lon: [-106, -84], lat: [12, 24], from: 1550, pick: () => "pulqueria" },
  { lon: [-82, -62], lat: [-25, 2], from: 1400, pick: () => "chicheria" },
  { lon: [128, 146], lat: [30, 46], from: 1400, to: 1950, pick: () => "chaya" },
  { lon: [98, 128], lat: [18, 46], from: 800, pick: () => "chinese-teahouse" },
  { lon: [50, 100], lat: [25, 48], from: 1400, pick: () => "chaikhana" },
  // In Mesoamerica the sweat bath is the temazcal, whichever row brought it.
  { lon: [-106, -84], lat: [12, 24], pick: () => "temazcal" },
  { lon: [-170, -52], lat: [24, 72], pick: () => "sweat-lodge" },
  // Bathing under Rome, then under Islam: the bath houses of a box and its centuries.
  { lon: [-10, 20], lat: [35, 56], from: -200, to: 550, pick: () => "roman-baths" },
  { lon: [-10, 50], lat: [24, 45], from: -200, to: 640, pick: () => "roman-baths" },
  { lon: [-10, 0], lat: [36, 42.5], from: 750, to: 1492, pick: () => "hammam" },
  { lon: [19, 30], lat: [39, 45], from: 1400, to: 1912, pick: () => "hammam" },
  { lon: [26, 45], lat: [36, 42], from: 1100, pick: () => "hammam" },
  { lon: [34, 62], lat: [12, 40], from: 660, pick: () => "hammam" },
  { lon: [-18, -1.5], lat: [20, 35.9], from: 680, pick: () => "hammam" },
  { lon: [-1.5, 12], lat: [20, 37.4], from: 680, pick: () => "hammam" },
  { lon: [12, 34], lat: [20, 33], from: 680, pick: () => "hammam" },
  // Churches by confession and age: the Orthodox east, Protestant north, Catholic south and New Spain, medieval everywhere before.
  { lon: [19.5, 30], lat: [34, 46], from: 500, to: 1453, pick: () => "orthodox-church" },
  { lon: [20, 30], lat: [34, 44], from: 500, pick: () => "orthodox-church" },
  { lon: [22, 30], lat: [43.5, 48.5], from: 500, pick: () => "orthodox-church" },
  { lon: [24, 60], lat: [44, 70], from: 988, pick: () => "orthodox-church" },
  { lon: [-11, 32], lat: [36, 72], from: 900, to: 1150, pick: () => "romanesque-church" },
  { lon: [-11, 32], lat: [50, 72], from: 1540, to: 1900, pick: () => "reformed-church" },
  { lon: [-10, 18], lat: [36, 49], from: 1600, to: 1900, pick: () => "baroque-church" },
  { lon: [-125, -34], lat: [-56, 38], from: 1520, to: 1900, pick: () => "baroque-church" },
  { lon: [-11, 32], lat: [36, 72], from: 1150, to: 1900, pick: () => "gothic-church" },
  { lon: [-18, 75], lat: [5, 46], from: 650, pick: () => "mosque" },
  { lon: [128, 146], lat: [30, 46], from: 600, pick: () => "japanese-temple" },
  { lon: [95, 128], lat: [8, 50], from: 500, pick: () => "chinese-temple" },
  { lon: [92, 110], lat: [5, 25], from: 1250, pick: () => "wat" },
  { lon: [60, 95], lat: [5, 36], from: 500, pick: () => "hindu-temple" },
  { lon: [-10, 50], lat: [28, 48], from: -600, to: 400, pick: () => "classical-temple" },
  { lon: [25, 60], lat: [28, 42], from: -3000, to: -500, pick: () => "mesopotamian-temple" },
  { lon: [-106, -84], lat: [12, 24], from: 250, to: 1550, pick: () => "maya-temple" },
  { lon: [-11, 32], lat: [36, 72], from: 1200, to: 1900, pick: () => "council-chamber" },
  { lon: [-10, 30], lat: [35, 48], from: -130, to: 400, pick: () => "roman-basilica" },
  { lon: [-11, 32], lat: [36, 72], from: 1400, to: 1850, pick: () => "grammar-school" },
  { lon: [-180, 180], lat: [-60, 75], from: 1850, to: 1960, pick: () => "board-school" },
  { lon: [128, 146], lat: [30, 46], from: 1600, to: 1880, pick: () => "terakoya" },
  { lon: [-18, 75], lat: [5, 46], from: 1000, pick: () => "madrasa" },
  { lon: [-18, 25], lat: [5, 22], from: 1100, pick: () => "quranic-school" },
  ...["wharenui", "council-longhouse", "haus-tambaran", "age-set-house", "telpochcalli", "calmecac", "gurukula", "union-hall"].map((id) => ({ lon: [-180, 180] as [number, number], lat: [-90, 90] as [number, number], pick: () => id })),
  { lon: [-11, 2], lat: [49.5, 61], from: 1570, to: 1660, pick: () => "elizabethan-playhouse" },
  { lon: [-11, 45], lat: [34, 72], from: 1660, to: 1950, pick: () => "proscenium-playhouse" },
  { lon: [-11, 45], lat: [34, 72], from: 1680, to: 1950, pick: () => "opera-house" },
  { lon: [128, 146], lat: [30, 46], from: 1400, to: 1950, pick: () => "noh-theatre" },
  { lon: [128, 146], lat: [30, 46], from: 1650, to: 1950, pick: () => "kabuki-theatre" },
  { lon: [-180, 180], lat: [-60, 75], from: 1910, pick: () => "cinema" },
];

/** A place's claim as the key its interior is chosen by: `venue-venue.x` is
 * `venue.x`, `religious-x` and `civic-x` are `religious.x` and `civic.x`. */
export function buildingUse(claim: string) {
  if (claim.startsWith("venue-")) return claim.slice(6);
  if (/^(religious|civic)-/.test(claim)) return claim.replace("-", ".");
}

const halls = new Map<string, InteriorProfile>();
/** Where nobody has researched a town's institutions, its hall is built the
 * way its houses are: the same walls, floors and colours, laid out to face a
 * plain dais. Illustrative, and its note says so. */
function meetingHall(site: InteriorSite): InteriorProfile {
  const home = interiorProfileFor({ ...site, use: undefined });
  const known = halls.get(home.id);
  if (known) return known;
  const floor = home.seating === "floor";
  const hall: InteriorProfile = {
    ...home,
    id: `meeting-hall-${home.id}`,
    label: "Meeting hall",
    uses: ["civic.illustrative-public-hall"],
    program: "rows",
    regulars: { hours: [17, 20], fill: 0.3 },
    rooms: undefined,
    styles: { ...home.styles, altar: "dais-plain" },
    furnish: floor ? ["cushions", "lamp", "frame"] : ["lamp", "frame"],
    kits: undefined,
    shapes: [home.shapes[0] === "round" || home.shapes[0] === "oval" ? home.shapes[0] : "rect"],
    size: [13, 11],
    fire: "none",
    sleep: "none",
    pole: false,
    trades: ["household"],
    basis: "reconstructed",
    note: `An illustrative hall, built as ${home.label.toLowerCase()}s are: the institution and its form have not been researched for this place and date.`,
  };
  halls.set(home.id, hall);
  return hall;
}

/** The interior a public building has here and now, if one has been made. */
export function publicInteriorFor(site: InteriorSite): InteriorProfile | undefined {
  if (!site.use) return;
  if (site.use === "civic.illustrative-public-hall") return meetingHall(site);
  for (const r of PUBLIC) {
    if (site.lon < r.lon[0] || site.lon > r.lon[1] || site.lat < r.lat[0] || site.lat > r.lat[1]) continue;
    if (r.from !== undefined && site.year < r.from) continue;
    if (r.to !== undefined && site.year > r.to) continue;
    const found = interiorProfile(r.pick(site));
    if (found?.uses?.includes(site.use)) return found;
  }
}

/** Whether whoever keeps a venue lives in it: yes over a taproom, no in a
 * kiva or a bath house, whose keepers lodge nearby. */
export function keeperLivesIn(site: InteriorSite) {
  const pr = publicInteriorFor(site);
  return !pr || (pr.program ?? pr.rooms?.[0].program) === "serve";
}

/** The dwelling profile for a place and date. Falls back by era when no
 * regional rule covers the site; the fallback is a guess and says so by
 * being the plainest dwelling of its period. */
export function interiorProfileFor(site: InteriorSite): InteriorProfile {
  const venue = publicInteriorFor(site);
  if (venue) return venue;
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
