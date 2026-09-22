import { within, type DetailSetting, type StreetDetail } from "./types";

export function muslimBurialStyle(s: DetailSetting): "plain" | "ottoman" | undefined {
  if (s.year < 800 || s.year >= 1900) return;
  if (s.year >= 1453 && within(s, 26, 35, 44, 42)) return "ottoman";
  if (s.culture === "north-african-west-asian" && within(s, -17, 16, 64, 38)) return "plain";
  if (s.culture === "inner-eurasian" && s.year >= 1100 && within(s, 48, 34, 74, 44)) return "plain";
  return;
}

export function westAsianDetails(s: DetailSetting): StreetDetail[] {
  if (s.year < 800 || s.year >= 1900 || !muslimBurialStyle(s)) return [];
  return [{
    id: "bazaar-stock", prop: "marketDisplay", variants: [0, 1], name: "Merchant's wares",
    description: "Small bowls of spices or folded cloth sit on a low display bench. A modest trade display, not another weighing machine.",
    spacing: 9, perBuildings: 15, limit: 6, trade: /shop|market|merchant|trader|cloth|spice|stores/i, sources: [],
  }, {
    id: "public-water-jars", prop: "waterStation", variants: [0, 1], name: "Shaded drinking jars",
    description: "Porous earthenware jars and a drinking cup stand beneath a reed shade. An inferred neighborhood water station; it does not represent a particular endowed sabil.",
    spacing: 20, perBuildings: 32, limit: 3, sources: [],
  }];
}

// Burial axes are perpendicular to the direction faced by a body on its side.
export function graveAxis(s: DetailSetting): 0 | 1 {
  const rad = Math.PI / 180, lat = s.lat * rad, mecca = 21.4225 * rad;
  const delta = (39.8262 - s.lon) * rad;
  const bearing = Math.atan2(Math.sin(delta), Math.cos(lat) * Math.tan(mecca) - Math.sin(lat) * Math.cos(delta));
  return Math.abs(Math.cos(bearing)) > Math.abs(Math.sin(bearing)) ? 1 : 0;
}
