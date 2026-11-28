import type { DeviceText } from "./en";
import { ar } from "./ar";
import { de } from "./de";
import { es } from "./es";
import { fr } from "./fr";
import { hi } from "./hi";
import { id } from "./id";
import { it } from "./it";
import { ja } from "./ja";
import { ko } from "./ko";
import { pt } from "./pt";
import { ru } from "./ru";
import { sw } from "./sw";
import { th } from "./th";
import { tr } from "./tr";
import { uk } from "./uk";
import { vi } from "./vi";
import { zh } from "./zh";

export { en, type DeviceText } from "./en";

type Box = readonly [west: number, south: number, east: number, north: number];
/** The everyday written language of a place in the age of pocket electronics, by rough borders.
 * The first row whose box holds the place wins, so small countries come before the big ones around them;
 * `undefined` marks a place whose language has no file yet. English-speaking places are simply absent. */
const regions: readonly (readonly [DeviceText | undefined, ...Box[]])[] = [
  [ko, [124.5, 33, 129.3, 43]],
  [ja, [129.3, 30, 146, 46]],
  [th, [97.5, 5.5, 105.6, 20.5]],
  [vi, [102, 8, 110, 23.5]],
  [zh, [98, 21, 123, 42], [115, 38, 135, 54], [73, 30, 98, 42]],
  [id, [95, -11, 141, 7]],
  [hi, [68, 17, 89, 33]],
  [sw, [29, -11.8, 41.9, 4.7]],
  [pt, [-9.6, 36.9, -6.2, 42.2], [-57.5, -33.8, -34, 5.3], [-74, -11, -57.5, 5.3]],
  [es, [-9.5, 36, 3.5, 43.8], [-118, 7, -77, 32.5], [-82, -56, -34, 13]],
  [fr, [-5, 42.3, 7.6, 51.1], [-80, 44.9, -57, 62]],
  // Czech lands, inside the German box.
  [undefined, [12.4, 48.6, 18.9, 50.9]],
  [de, [5.9, 47.3, 15, 55.1], [9.5, 46.4, 17.2, 49]],
  [it, [6.6, 36.6, 13.9, 47.1], [13.9, 36.6, 18.6, 42.5]],
  [tr, [26, 36.8, 44.8, 42.1]],
  [uk, [22.1, 44.3, 38.5, 52.4]],
  // Iran and Mongolia, inside the Arabic and Russian boxes.
  [undefined, [44, 25, 63.5, 40], [88, 41.5, 115, 52]],
  [ar, [-17, 19, 37, 37.5], [34, 12, 60, 37.5], [22, 12, 38, 22]],
  [ru, [27, 41, 180, 78]],
];

export const deviceTexts: readonly DeviceText[] = [...new Set(regions.flatMap(([text]) => text ?? []))];

/** The local language's words for a device here, if this folder has them. English-speaking places have none. */
export function localDeviceText(lon: number, lat: number): DeviceText | undefined {
  return regions.find(([, ...boxes]) => boxes.some(([w, s, e, n]) => lon >= w && lon <= e && lat >= s && lat <= n))?.[0];
}
