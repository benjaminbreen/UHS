import type { WorldSetting } from "../geography/types";

/** The one tree a place plants or spares on purpose: by its well or on its
 * meeting ground ("common"), or at its church, temple or shrine ("shrine").
 * First match wins, so narrower places come before the broad ones. */
type LandmarkRule = {
  /** [west, south, east, north] in degrees. */
  bounds: readonly [number, number, number, number];
  from?: number;
  to?: number;
  common?: string;
  shrine?: string;
  status: "documented" | "inferred";
  note: string;
};

const rules: readonly LandmarkRule[] = [
  {
    bounds: [129, 30, 146, 46],
    from: 1200,
    common: "nature-cherry",
    shrine: "nature-ginkgo",
    status: "documented",
    note: "Ginkgo stands at Japanese temples and shrines from the Kamakura period; mountain cherries were planted and admired by villages and temples from the Heian period.",
  },
  {
    bounds: [129, 30, 146, 46],
    from: 700,
    common: "nature-cherry",
    shrine: "nature-japanese-maple",
    status: "inferred",
    note: "Before the ginkgo was common in Japan, temple grounds are drawn with the native maple.",
  },
  {
    bounds: [124, 33, 131, 43],
    from: 400,
    common: "nature-ginkgo",
    shrine: "nature-ginkgo",
    status: "documented",
    note: "Korean villages kept a guardian tree (dangsan namu), often a ginkgo or zelkova, and ginkgos stand at Confucian schools and temples.",
  },
  {
    bounds: [97, 18, 123, 27],
    common: "nature-banyan",
    shrine: "nature-ginkgo",
    status: "documented",
    note: "South China villages kept a banyan or camphor at the entrance as a fengshui tree; ginkgos were planted at Buddhist temples.",
  },
  {
    bounds: [97, 27, 125, 42],
    shrine: "nature-ginkgo",
    status: "documented",
    note: "Ginkgos survive mostly as temple plantings in north China.",
  },
  {
    bounds: [66, 5, 125, 30],
    common: "nature-banyan",
    shrine: "nature-banyan",
    status: "documented",
    note: "The banyan or pipal on its raised platform is the South Asian village's meeting place and shrine; the same fig trees are sacred across mainland and island Southeast Asia.",
  },
  {
    bounds: [-18, 12, 40, 18],
    common: "nature-baobab",
    shrine: "nature-baobab",
    status: "documented",
    note: "Sahelian villages meet under a baobab, which is also a shrine and burial tree for griots.",
  },
  {
    bounds: [-18, -10, 30, 12],
    common: "nature-ceiba",
    shrine: "nature-ceiba",
    status: "documented",
    note: "The silk-cotton tree is the West and Central African palaver tree, spared when the bush is cleared and home to spirits.",
  },
  {
    bounds: [-118, 7, -59, 24],
    to: 1600,
    common: "nature-ceiba",
    shrine: "nature-ceiba",
    status: "documented",
    note: "The ceiba (Maya yaxche) was the world tree and stood in plazas; the Taíno held it sacred as well.",
  },
  {
    bounds: [34, 29, 50, 34],
    common: "nature-date-palm",
    status: "inferred",
    note: "Lowland Mesopotamian and Levantine villages are drawn with a date palm at the well.",
  },
  {
    bounds: [19, 29, 78, 45],
    common: "nature-plane",
    shrine: "nature-cypress",
    status: "documented",
    note: "The oriental plane (chinar, platanos) shades squares and springs from Greece and Anatolia to Persia and Kashmir; cypresses stand at mosques, churches and graves.",
  },
  {
    bounds: [-17, 15, 60, 32],
    common: "nature-date-palm",
    shrine: "nature-date-palm",
    status: "inferred",
    note: "North African and Arabian villages are drawn with a date palm at the well and mosque.",
  },
  {
    bounds: [-11, 49, 2, 61],
    from: 600,
    common: "nature-oak",
    shrine: "nature-yew",
    status: "documented",
    note: "British and Irish churchyards keep yews, some older than the churches; the village oak marked meeting and boundary places.",
  },
  {
    bounds: [-5, 46, 8, 51.5],
    from: 600,
    common: "nature-oak",
    shrine: "nature-yew",
    status: "documented",
    note: "Normandy and northern France plant yews in churchyards; a great oak or lime stood on the village green.",
  },
  {
    bounds: [-10, 35, 19, 46],
    common: "nature-olive",
    shrine: "nature-cypress",
    status: "inferred",
    note: "Iberian and Italian villages are drawn with an olive in the square and cypresses at church and cemetery.",
  },
  {
    bounds: [-10, 46, 40, 60],
    from: 600,
    common: "nature-oak",
    shrine: "nature-yew",
    status: "inferred",
    note: "The village lime or oak of central Europe is drawn as an oak; yews were planted in churchyards there too.",
  },
];

export function landmarkTree(
  s: WorldSetting | undefined,
  role: "common" | "shrine",
): string | undefined {
  if (!s) return;
  for (const r of rules) {
    const [w, south, e, n] = r.bounds;
    if (s.lon < w || s.lon > e || s.lat < south || s.lat > n) continue;
    if ((r.from !== undefined && s.year < r.from) || (r.to !== undefined && s.year > r.to)) continue;
    if (r[role]) return r[role];
  }
}
