import type { InteriorProfile, RoomTemplate } from "./types";
import type { Kind } from "../../render/interiors/room";

/**
 * A shop is the house it stands in with a shop room put in front: stock
 * along its back wall in the keeper's line (`styles.stock`), a counter in the
 * form of the place and date (`styles.counter`), the trade's own fixture.
 * The kind is read from the keeper's livelihood, first match wins.
 */
type ShopKind = { id: string; label: string; match: RegExp; fixture?: Kind[] };
export const shopKinds: ShopKind[] = [
  { id: "bread", label: "Bakehouse", match: /bak|bread|oven|pastr|confection/, fixture: ["fixture"] },
  { id: "meat", label: "Butcher's shop", match: /butch|meat|slaughter|poulter|flesh/, fixture: ["fixture"] },
  { id: "fish", label: "Fish stall", match: /fish/ },
  { id: "tools", label: "Smithy", match: /smith|iron|forge|farrier|cutler|nail|armou?r/, fixture: ["fixture", "anvil"] },
  { id: "timber", label: "Workshop", match: /carpent|joiner|cooper|wheelwright|cabinet|turner|timber|wood/, fixture: ["fixture"] },
  { id: "pots", label: "Pottery", match: /pot|ceram|porcelain|kiln|tile/, fixture: ["throw"] },
  { id: "cloth", label: "Draper's shop", match: /weav|cloth|draper|mercer|tailor|silk|dye|linen|wool|textile|sew/ },
  { id: "leather", label: "Leather shop", match: /leather|tann|cobbl|shoe|saddl|glov|cord/, fixture: ["fixture"] },
  { id: "candles", label: "Chandlery", match: /candle|chandl|soap|tallow|wax/ },
  { id: "apothecary", label: "Apothecary", match: /apothec|drug|herb|physic|spice|perfum/ },
  { id: "tea", label: "Tea shop", match: /\btea\b/ },
  { id: "fine", label: "Workshop", match: /lacquer|paint|jewel|gold|silver|engrav|print|book|scribe|clock|glass/, fixture: ["fixture"] },
  { id: "drink", label: "Wine shop", match: /brew|wine|vint|distil|sake|ale\b/ },
  { id: "oil", label: "Oil shop", match: /\boil|press/ },
  { id: "general", label: "Shop", match: /trad|merchant|broker|factor|deal|grocer|shop|peddl|market|sell|monger|vendor/ },
];
const BY_GOOD: Record<string, string> = {
  bread: "bread", meat: "meat", fish: "fish", ironwork: "tools", timber: "timber", pots: "pots",
  cloth: "cloth", leather: "leather", light: "candles", drink: "drink", oil: "oil", grain: "general",
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
  if (lon >= -10 && lon <= 50 && lat >= 24 && lat <= 56 && year >= -300 && year <= 500) return "taberna";
  if (lon >= 95 && lon <= 146 && lat >= 8 && lat <= 50) return "platform";
  if (lon >= -18 && lon <= 75 && lat >= 5 && lat <= 46 && year >= 650 && year < 1920 && !(lat > 36 && lon < 20)) return "platform";
  if (year >= 1850) return "glazed";
  return "counter";
}

const shops = new Map<string, InteriorProfile>();
export function shopFor(home: InteriorProfile, kind: ShopKind, site: { lon: number; lat: number; year: number }): InteriorProfile {
  const form = counterForm(site.lon, site.lat, site.year);
  const key = `${home.id}:${kind.id}:${form}`;
  const known = shops.get(key);
  if (known) return known;
  const shop: RoomTemplate = {
    id: "shop",
    label: kind.label,
    role: "entry",
    program: "shop",
    size: [11, 8],
    trades: ["shopkeep"],
    fire: "none",
    sleep: "none",
    furnish: [...(kind.fixture ?? []), "lamp"],
    styles: { stock: kind.id, shopcounter: form },
    clutter: ["paper"],
  };
  const rooms = (home.rooms ?? [{ id: "home", label: home.label, role: "hall" as const, size: home.size, shapes: home.shapes }])
    .map((r) => {
      const trades = (r.trades ?? home.trades).filter((t) => t !== "merchant");
      return { ...r, trades: trades.length ? trades : ["household" as const] };
    });
  const profile: InteriorProfile = { ...home, id: `shop-${kind.id}-${home.id}`, rooms: [shop, ...rooms] };
  shops.set(key, profile);
  return profile;
}
