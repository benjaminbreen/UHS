import type { InteriorProfile, RoomTemplate } from "./types";
import type { Kind } from "../../render/interiors/room";
import { FITS } from "../../render/interiors/fits";

/**
 * A shop is the house it stands in with a shop room put in front: stock
 * along its back wall in the keeper's line (`styles.stock`), a counter in the
 * form of the place and date (`styles.counter`), the trade's own fixture.
 * The kind is read from the keeper's livelihood, first match wins; its
 * `goods` are what the keeper sells over the counter, whatever their own trade.
 */
type ShopKind = { id: string; label: string; match: RegExp; fixture?: Kind[]; goods?: string[]; serves?: true };
export const shopKinds: ShopKind[] = [
  { id: "bread", label: "Bakehouse", match: /bak|bread|oven|pastr|confection|donut/, fixture: ["fixture"], goods: ["bread"] },
  { id: "meat", label: "Butcher's shop", match: /butch|meat|slaughter|poulter|flesh/, fixture: ["fixture"], goods: ["meat"] },
  { id: "fish", label: "Fish stall", match: /fish/, goods: ["fish"] },
  { id: "tools", label: "Smithy", match: /smith|iron|forge|farrier|cutler|nail|armou?r/, fixture: ["fixture", "anvil"], goods: ["ironwork"] },
  { id: "timber", label: "Workshop", match: /carpent|joiner|cooper|wheelwright|cabinet|turner|timber|wood/, fixture: ["fixture"], goods: ["timber"] },
  { id: "pots", label: "Pottery", match: /pot|ceram|porcelain|kiln|tile/, fixture: ["throw"], goods: ["pots"] },
  { id: "cloth", label: "Draper's shop", match: /weav|fuller|cloth|draper|mercer|tailor|silk|dye|linen|wool|textile|sew/, goods: ["cloth"] },
  { id: "leather", label: "Leather shop", match: /leather|tann|cobbl|shoe|saddl|glov|cord/, fixture: ["fixture"], goods: ["leather"] },
  { id: "candles", label: "Chandlery", match: /candle|chandl|soap|tallow|wax/, goods: ["light"] },
  { id: "apothecary", label: "Apothecary", match: /apothec|drug|herb|physic|spice|perfum|pharmac|clinic/, goods: ["oil"] },
  { id: "cafe", label: "Café", match: /caf[eé]|coffee|ice cream|tea ?(house|room)/, goods: ["drink"], serves: true },
  { id: "pub", label: "Taproom", match: /publican|innkeep|tavern|bartend|barkeep|saloon|hotel/, goods: ["drink"], serves: true },
  { id: "eatery", label: "Eating house", match: /diner|burger|pizz|cook|waiter|restaura|noodle/, goods: ["drink"], serves: true },
  { id: "tea", label: "Tea shop", match: /\btea\b/, goods: ["drink"] },
  { id: "books", label: "Bookshop", match: /print|book|stationer|scribe/, goods: ["books"] },
  { id: "fine", label: "Workshop", match: /lacquer|paint|jewel|gold|silver|engrav|clock|watch|glass/, fixture: ["fixture"], goods: ["finery"] },
  { id: "drink", label: "Wine shop", match: /brew|wine|vint|distil|sake|ale\b/, goods: ["drink"] },
  { id: "oil", label: "Oil shop", match: /\boil|press/, goods: ["oil"] },
  { id: "tobacco", label: "Tobacconist", match: /tobacc|snuff|cigar|paan|betel/, goods: ["tobacco"] },
  { id: "pet", label: "Pet shop", match: /pet shop|bird-?sell|bird fancier|canary|aquarium|menagerie/, goods: ["grain"] },
  { id: "music", label: "Music shop", match: /music shop|instrument|luthier|piano maker|harpsichord/, goods: ["instruments"] },
  { id: "grocery", label: "Grocer's shop", match: /grocer|provision/, goods: ["grain", "salt", "oil", "light", "tobacco"] },
  { id: "general", label: "Shop", match: /trad|merchant|broker|factor|deal|grocer|shop|peddl|market|sell|monger|vendor|store|barber|hairdress|laund|station|mechanic|goods/, goods: ["grain", "salt", "oil", "light", "tobacco"] },
];
const BY_GOOD: Record<string, string> = {
  bread: "bread", meat: "meat", fish: "fish", ironwork: "tools", timber: "timber", pots: "pots",
  cloth: "cloth", leather: "leather", light: "candles", tobacco: "tobacco", drink: "drink", oil: "oil", grain: "general",
};

/** The kind of shop a keeper's livelihood or goods make, if any. */
export function shopKind(text: string, good?: string) {
  const t = text.toLowerCase();
  return shopKinds.find((k) => k.match.test(t)) ?? shopKinds.find((k) => k.id === (good && BY_GOOD[good]));
}

/** How a counter was built here and now: a Roman taberna's masonry, a bazaar
 * or East Asian shop's raised platform, an industrial-age glazed case, or a
 * plain board. */
function counterForm(lon: number, lat: number, year: number) {
  // Goods laid out on mats and the seller sitting by them: Africa south of the
  // Sahara, the Americas before the conquest, Southeast Asia and Oceania.
  if (lon > -20 && lon < 52 && lat < 18 && lat > -36 && year < 1900) return "ground";
  if (lon < -30 && year < 1550) return "ground";
  if (lon > 92 && lon < 180 && lat < 18 && lat > -50 && year < 1850 && !(lon > 110 && lat < -10 && year >= 1788)) return "ground";
  if (lon >= -10 && lon <= 50 && lat >= 24 && lat <= 56 && year >= -300 && year <= 500) return "taberna";
  if (lon >= 95 && lon <= 146 && lat >= 8 && lat <= 50) return "platform";
  if (lon >= -18 && lon <= 75 && lat >= 5 && lat <= 46 && year >= 650 && year < 1920 && !(lat > 36 && lon < 20)) return "platform";
  if (year >= 1850) return "glazed";
  return "counter";
}

const shops = new Map<string, InteriorProfile>();
/** What a bakehouse bakes at, where it is not the domed bread oven: the
 * household's tannur or metate, or in north China the steamer its wheat went
 * into. */
function breadFixture(site: { lon: number; lat: number }, bench?: string) {
  if (bench === "tannur" || bench === "metate") return bench;
  if (site.lon > 100 && site.lon < 146 && site.lat > 20 && site.lat < 50) return "steamer";
  return undefined;
}
/** The carved figure that marked a tobacconist's: the cigar-store Indian in
 * North America from the 1840s until city ordinances cleared pavements in the
 * 1910s and 20s; the snuff-taking Highlander in Britain from the 1720s. */
function shopFigure(kind: ShopKind, { lon, lat, year }: { lon: number; lat: number; year: number }) {
  if (kind.id !== "tobacco") return undefined;
  if (lon > -130 && lon < -52 && lat > 24 && lat < 56 && year >= 1840 && year < 1930) return "indian";
  if (lon > -11 && lon < 2 && lat > 49.8 && lat < 59 && year >= 1720 && year < 1900) return "highlander";
  return undefined;
}

/** What a house kept for eating and drinking pours, here and now, and what
 * its front room is called. `cafe`, `beer` and `diner` are the modern bars. */
export function served(kind: Pick<ShopKind, "id">, { lon, lat, year }: { lon: number; lat: number; year: number }): [string, string] {
  const japan = lon > 128 && lon < 146 && lat > 30 && lat < 46, eastAsia = lon > 95 && lon < 146 && lat > 8 && lat < 50;
  const steppe = lon >= 62 && lon < 100 && lat > 25 && lat < 48, islam = lon >= -18 && lon < 62 && lat >= 12 && lat <= 45 && !(lat > 36 && lon < 20) && year >= 1510;
  if (kind.id === "cafe") {
    if (eastAsia) return ["tea", "Teahouse"];
    if (steppe) return ["chai", "Chaikhana"];
    if (islam) return ["coffee", "Coffee house"];
    return year >= 1650 ? ["cafe", year < 1900 ? "Coffee room" : "Café"] : ["ale", "Taproom"];
  }
  if (japan) return ["sake", kind.id === "pub" ? "Sake shop" : "Izakaya"];
  if (eastAsia) return ["tea", kind.id === "pub" ? "Wine shop" : "Eating house"];
  if (islam) return ["coffee", "Coffee house"];
  // The American diner from the lunch wagons of the 1920s; elsewhere the modern room to eat in is a café.
  if (kind.id === "eatery") return lon < -30 && year >= 1920 ? ["diner", "Diner"] : year >= 1900 ? ["cafe", "Dining room"] : ["ale", "Eating house"];
  if (year < 1850) return ["ale", "Taproom"];
  return ["beer", lon > -11 && lon < 2 && lat > 49.8 && lat < 61 ? "Public bar" : "Bar"];
}

/** A house whose front room serves: a counter and back bar, tables, and
 * neighbours in the seats while it is open. */
function servingHouse(home: InteriorProfile, kind: ShopKind, site: { lon: number; lat: number; year: number }): InteriorProfile {
  const [bar, label] = served(kind, site);
  const key = `${home.id}:${kind.id}:${bar}:${label}:${site.year < 1905}:${site.year >= 1990}`;
  const known = shops.get(key);
  if (known) return known;
  const modern = bar === "cafe" || bar === "beer" || bar === "diner";
  const room: RoomTemplate = {
    id: "taproom",
    label,
    role: "entry",
    program: "serve",
    size: [13, 10],
    trades: ["host"],
    fire: !modern && home.fire === "hearth" ? "hearth" : "none",
    sleep: "none",
    seating: bar === "coffee" || bar === "chai" || bar === "sake" ? "floor" : "chair",
    ...(home.windowStyle === "shutter" && site.year >= 1700 ? { windowStyle: "glazed" as const } : {}),
    furnish: ["tally", "frame", ...(site.year >= 1650 ? ["clock" as const] : []), "plant", ...(bar === "ale" ? ["tankards" as const] : modern ? ["frame" as const] : [])],
    // Small round tables and chairs in a café or bar; a diner keeps its booths.
    styles: { bar, ...(bar === "cafe" || bar === "beer" ? { table: "round" } : {}), ...(modern ? { stool: "chair" } : {}), ...(bar === "cafe" && site.year < 1905 ? { machine: "urn" } : {}) },
    clutter: ["cup", "cup"],
  };
  const rooms = (home.rooms ?? [{ id: "home", label: home.label, role: "hall" as const, size: home.size, shapes: home.shapes }])
    .map((r) => ({ ...r, trades: ["household" as const] }));
  const hours: [number, number] = kind.id === "cafe" ? [7, 19] : kind.id === "eatery" ? [7, 22] : site.year >= 1850 ? [11, 24] : [16, 24];
  const profile: InteriorProfile = {
    ...home,
    shopKind: kind.id,
    id: `serve-${bar}-${home.id}`,
    rooms: [room, ...rooms],
    regulars: { hours, fill: 0.35 },
    ...(modern ? { staff: [{ work: "waiter", doing: bar === "beer" ? "Pulling pints" : "Waiting on tables", role: bar === "beer" ? "Bartender" : bar === "diner" ? "Server" : site.year >= 1990 ? "Barista" : "Waiter", spot: "work" as const }] } : {}),
  };
  shops.set(key, profile);
  return profile;
}

export function shopFor(home: InteriorProfile, kind: ShopKind, site: { lon: number; lat: number; year: number }, bench?: string): InteriorProfile {
  if (kind.serves) return servingHouse(home, kind, site);
  const form = counterForm(site.lon, site.lat, site.year);
  const fixture = kind.id === "bread" ? breadFixture(site, bench) : undefined;
  const tool: Kind | undefined = bench?.includes("loom") ? "loom" : bench === "workbench" ? "fixture" : undefined;
  const figure = shopFigure(kind, site);
  // The fitted shops (`FITS`): a Roman bar, and the grocer of packets and tins.
  const stock = form === "taberna" && (kind.id === "drink" || kind.id === "tea")
    ? "thermopolium"
    : kind.id === "pet" || kind.id === "music" || (kind.id === "grocery" && site.year < 1890)
      ? "general"
      : kind.id;
  const key = `${home.id}:${kind.id}:${stock}:${form}:${fixture ?? ""}:${tool ?? ""}:${figure ?? ""}`;
  const known = shops.get(key);
  if (known) return known;
  const shop: RoomTemplate = {
    id: "shop",
    label: kind.label,
    role: "entry",
    program: "shop",
    size: [12, 9],
    trades: ["shopkeep"],
    fire: "none",
    sleep: "none",
    // Glazed sashes in the shop, wherever the house still has shutters, from the eighteenth century.
    ...(home.windowStyle === "shutter" && site.year >= 1700 ? { windowStyle: "glazed" as const } : {}),
    furnish: [...(tool && !kind.fixture?.includes(tool) ? [tool] : []), ...(kind.fixture ?? []), ...(figure ? ["effigy" as const] : []), ...Array<"frame">(FITS[stock]?.hung.length ?? 1).fill("frame"), ...(site.year >= 1650 ? ["clock" as const] : []), "plant", "chest"],
    styles: { stock, shopcounter: form, ...(fixture ? { fixture } : {}), ...(figure ? { effigy: figure } : {}) },
    clutter: [],
  };
  const rooms = (home.rooms ?? [{ id: "home", label: home.label, role: "hall" as const, size: home.size, shapes: home.shapes }])
    .map((r) => {
      const trades = (r.trades ?? home.trades).filter((t) => t !== "merchant");
      return { ...r, trades: trades.length ? trades : ["household" as const] };
    });
  const profile: InteriorProfile = { ...home, shopKind: kind.id, id: `shop-${kind.id}-${home.id}`, rooms: [shop, ...rooms] };
  shops.set(key, profile);
  return profile;
}
