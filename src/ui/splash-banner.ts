import type { CultureId } from "../content/history/types";

/**
 * Bottom-of-splash landscape, keyed to the era and culture zone of the random
 * start. Files live in public/banners; a missing file falls back to the
 * classical banner at render time.
 */
export const defaultBanner = "/banners/bannerclassical.png";

const byCulture: Partial<Record<CultureId, string>> = {
  "east-asian": "/banners/bannerEastAsia.png",
  "southeast-asian": "/banners/bannerSEAsia.png",
  "south-asian": "/banners/bannerSouthAsia.png",
  "north-african-west-asian": "/banners/bannerMENA.png",
  "inner-eurasian": "/banners/bannerCentralAsia.png",
  "west-central-african": "/banners/bannerAfrica.png",
  "east-southern-african": "/banners/bannerAfrica.png",
  "australian-pacific": "/banners/bannerOceania.png",
  mesoamerican: "/banners/bannerPreColumbian.png",
  andean: "/banners/bannerPreColumbian.png",
  "other-indigenous-american": "/banners/bannerPreColumbian.png",
};

/** Industrialisation reached Britain a century before most of the world. */
const earlyIndustrial = new Set(["european-british-isles"]);

export function bannerFor(culture?: CultureId, year?: number, region?: string) {
  if (year !== undefined) {
    if (year < -3000) return "/banners/bannerNeolithic.png";
    if (year >= 1980) return "/banners/bannerModern.png";
    if (year >= 1914) return "/banners/banner20th.png";
    if (year >= (region && earlyIndustrial.has(region) ? 1760 : 1870))
      return "/banners/bannerIndustrial.png";
    if (year >= 1500 && culture === "european")
      return "/banners/bannerEarlyModernEurope.png";
    if (year >= 1520 && (culture === "mesoamerican" || culture === "andean"))
      return "/banners/bannerColonialLatinAmerica.png";
  }
  if (culture === "australian-pacific" && region?.includes("australia"))
    return "/banners/bannerAustralia.png";
  return (culture && byCulture[culture]) ?? defaultBanner;
}

/** Smoke sources as fractions of the untrimmed banner, [x, y, strength]. */
export const smokeFor: Record<
  string,
  readonly (readonly [number, number, number])[]
> = {
  "/banners/bannerIndustrial.png": [
    [0.123, 0.02, 1],
    [0.222, 0.17, 0.8],
    [0.28, 0.31, 0.5],
    [0.472, 0.46, 1],
    [0.94, 0.05, 0.9],
  ],
};
