import type { WorldSetting } from "../../geography/types";
import { modernity } from "../modernity";

/** When a region's cities ran street tramways, electric or horse-drawn, on
 * their main streets. Many closed after the war and some came back; these are
 * the broad windows, not any one city's line. */
const windows: Record<string, [number, number]> = {
  "north-america": [1888, 1950],
  britain: [1880, 1960],
  "western-europe": [1880, 2030],
  "eastern-europe": [1890, 2030],
  japan: [1895, 1970],
  australasia: [1885, 1960],
  "latin-america": [1880, 1960],
  "south-asia": [1900, 1970],
  "east-asia": [1905, 1975],
  "southern-africa": [1900, 1960],
  "west-asia-north-africa": [1900, 1960],
  "southeast-asia": [1900, 1960],
};

export function tramways(s: WorldSetting) {
  const w = windows[modernity(s).id];
  return !!w && s.year >= w[0] && s.year < w[1];
}
