import { within, type DetailSetting, type StreetDetail } from "./types";
import { muslimBurialStyle } from "./west-asia";

export function europeanDetails(s: DetailSetting): StreetDetail[] {
  if (s.culture !== "european" || muslimBurialStyle(s)) return [];
  const details: StreetDetail[] = [];
  const medievalWest = s.year >= 1000 && s.year < 1530 && within(s, -11, 36, 25, 59);
  const laterCatholic = s.year >= 1530 && s.year < 1900 && (
    within(s, -10, 36, 3, 44) || within(s, 6, 37, 19, 47) ||
    within(s, 14, 47, 25, 54) || within(s, -11, 51, -6, 56)
  );
  if (medievalWest || laterCatholic) details.push({
    id: "saint-niches", prop: "saintNiche", variants: s.lat < 46 ? [1, 2] : [0, 1],
    name: "Wayside saint's shrine", description: "A sheltered image of a saint, with a small ledge for candles and flowers. An inferred neighborhood devotional place; no particular saint or surviving monument is claimed.",
    spacing: 12, perBuildings: 18, limit: 5,
    sources: ["https://historicengland.org.uk/images-books/publications/dssg-religion-ritual-postad410/heag251-religion-and-ritual-post-ad410-ssg/"],
  });
  if (s.year >= -100 && s.year < 450 && within(s, -10, 35, 36, 52)) details.push({
    id: "roman-water", prop: "streetFountain", variants: [0, 1, 2],
    name: "Public drinking fountain", description: "A stone spout feeds a shallow street basin. Its carved face and worn lip follow Roman public fountains; this is an inferred working water point.",
    spacing: 20, perBuildings: 28, limit: 3,
    sources: ["https://pompeiisites.org/wp-content/uploads/A-Guide-to-the-Pompeii-Excavations-2.pdf"],
  }, {
    id: "roman-notices", prop: "streetNotice", variants: [0],
    name: "Public notice tablet", description: "A whitened tablet carries civic announcements. The pixel marks suggest writing without inventing a readable historical document.",
    spacing: 22, perBuildings: 45, limit: 2, sources: [],
  });
  if (s.year >= 1550 && s.year < 1950) details.push({
    id: "printed-notices", prop: "streetNotice", variants: [1], name: "Posted broadsides",
    description: "Printed announcements overlap on a timber notice board, their corners lifting from the weathered wood. The notices are illustrative, not transcriptions.",
    spacing: 20, perBuildings: 35, limit: 3, sources: [],
  });
  return details;
}
