import { within, type DetailSetting, type StreetDetail } from "./types";

export function americanDetails(s: DetailSetting): StreetDetail[] {
  const details: StreetDetail[] = [];
  if (s.year >= 1550 && s.year < 1900 && within(s, -118, -35, -35, 30)) details.push({
    id: "colonial-devotion", prop: "saintNiche", variants: [1, 2], name: "Neighborhood devotional niche",
    description: "A plastered niche shelters a painted holy image and a few votive offerings. This represents a Catholic colonial neighborhood practice, not the beliefs of every resident.",
    spacing: 12, perBuildings: 18, limit: 5, sources: [],
  }, {
    id: "plaza-goods", prop: "marketDisplay", variants: [1, 2], name: "Market goods",
    description: "Folded cloth and woven produce baskets stand in a low display beside the plaza's shops.",
    spacing: 9, perBuildings: 15, limit: 6, trade: /shop|market|merchant|trader|stores/i, sources: [],
  });
  if (s.year >= 1880 && s.year < 1950 && within(s, -125, 25, -66, 50)) details.push({
    id: "us-newsstands", prop: "newsstand", variants: s.year < 1900 ? [0] : s.year < 1925 ? [0, 1] : [1, 2],
    name: "Newspaper stand", description: "Folded papers and periodicals fill a compact sidewalk stand. The visible columns and masthead blocks evoke printed sheets without fictitious readable headlines.",
    spacing: 18, perBuildings: 22, limit: 4,
    sources: ["https://www.loc.gov/resource/nclc.03651/", "https://www.loc.gov/item/2017780128/"],
  }, {
    id: "us-bulletins", prop: "streetNotice", variants: [1], name: "Neighborhood bulletin board",
    description: "Printed notices and handbills share a small public board, with overlapping sheets and weathered paper edges.",
    spacing: 22, perBuildings: 40, limit: 2, sources: [],
  });
  return details;
}
