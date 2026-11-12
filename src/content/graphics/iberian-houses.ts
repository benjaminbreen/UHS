import type { WorldSetting } from "../geography/types";

/** Looks drawn by scripts/art/front_iberia.py: frames `casa-<look>-<0..2>`
 * and their street forms. */
export type CasaLook =
  | "oaxaca"
  | "mexico"
  | "puebla"
  | "lima"
  | "caribe"
  | "andes"
  | "brasil"
  | "lusa"
  | "andalucia"
  | "castilla"
  | "portugal"
  | "toscana"
  | "toscana-early"
  | "egeo"
  | "bahay"
  | "bahay-early"
  | "goa";

/** Spain, Portugal and the towns they founded from Mexico to the Plata, which
 * built stuccoed, tile-roofed courtyard houses rather than British rows. The
 * British, French and Dutch Caribbean and the Guianas are left out. */
export function iberianTown(setting: WorldSetting) {
  const { lon, lat, year, settlement } = setting;
  if (year >= 1900 || (settlement !== "city" && settlement !== "port")) return false;
  if (setting.culture === "european" && lon >= -10 && lon <= 3.5 && lat >= 36 && lat <= 44) return year >= 1500;
  const outside = ([[-78.5, 17.5, -76, 18.6], [-74.5, 17.9, -71.6, 20.1], [-63.2, 10.5, -59, 18.3], [-61, 1.5, -51.5, 9]] as const)
    .some(([w, s, e, n]) => lon >= w && lon <= e && lat >= s && lat <= n);
  return year >= 1550 && lon < -30 && lat < 24.5 && !outside;
}

const near = (s: WorldSetting, lon: number, lat: number, d: number) =>
  Math.abs(s.lon - lon) < d && Math.abs(s.lat - lat) < d;

/** The house of the Iberian world and the Mediterranean a settlement builds,
 * or undefined where another family does. Dates are when the look's marks
 * became common: glass sashes and tile fronts in the Portuguese world,
 * louvred shutters in Italy, capiz windows in the Philippines. */
export function casaLook(setting: WorldSetting): CasaLook | undefined {
  const { lon, lat, year, culture, settlement } = setting;
  if (year >= 1900 || settlement === "camp") return undefined;
  const town = settlement === "city" || settlement === "port";
  if (lon < -30) {
    if (!iberianTown(setting)) return undefined;
    if (lon >= -57.5 && lat >= -33.7 && lat < 5.5) return year >= 1750 ? "brasil" : "lusa";
    if (lat >= 13 && lon < -86) {
      if (near(setting, -99.13, 19.43, 0.6)) return "mexico";
      if (near(setting, -98.2, 19.04, 0.5)) return "puebla";
      return "oaxaca";
    }
    if (lat >= 7.5) return "caribe";
    // The rainless coast of Peru built flat; the highlands behind it in tile.
    if (lon < -75.3 && lat < -3 && lat > -18.5) return "lima";
    if (lon <= -62.5) return "andes";
    // The Plata and Paraguay: flat-roofed azotea houses, as in New Spain.
    return "oaxaca";
  }
  if (culture === "european") {
    if (lon >= -10 && lon <= 3.5 && lat >= 36 && lat <= 44 && year >= 1250) {
      const portugal = (lon < -7 && lat < 42.1) || (lon < -6.3 && lat > 40 && lat < 42);
      if (portugal) return year >= 1830 ? "portugal" : year >= 1750 ? "brasil" : "lusa";
      return lat < 38.7 ? "andalucia" : "castilla";
    }
    // Italy, without the Dalmatian shore across from it.
    if (lon >= 7 && lon <= 18.5 && lat >= 36.5 && lat <= 45.9 && !(lon > 13.8 && lat > 42.5) && year >= 1100)
      return year >= 1700 ? "toscana" : "toscana-early";
    if (lon >= 22.8 && lon <= 28.3 && lat >= 35 && lat <= 39.3 && year >= 1200) return "egeo";
  }
  // Spanish Manila was stone below and timber above after the 1645 earthquake.
  if (
    culture === "southeast-asian" && town && year >= 1650 &&
    lon >= 116.8 && lon <= 127 && lat >= 4.6 && lat <= 20.9 && !(lon < 119.5 && lat < 7.6)
  )
    return year >= 1780 ? "bahay" : "bahay-early";
  if (lon >= 73.6 && lon <= 74.4 && lat >= 14.85 && lat <= 15.85 && year >= 1550 && (town || year >= 1750))
    return "goa";
  return undefined;
}

export function casaHouses(setting: WorldSetting): string[] {
  const look = casaLook(setting);
  return look ? [0, 1, 2].map((i) => `casa-${look}-${i}`) : [];
}
