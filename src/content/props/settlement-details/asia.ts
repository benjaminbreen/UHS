import { within, type DetailSetting, type StreetDetail } from "./types";

export function asianDetails(s: DetailSetting): StreetDetail[] {
  const details: StreetDetail[] = [];
  if (s.culture === "east-asian" && s.year >= 1200 && s.year < 1950) {
    if (within(s, 130, 30, 146, 46)) details.push({
      id: "jizo", prop: "jizo", variants: s.year < 1600 ? [0] : [0, 1, 2], name: "Roadside Jizō",
      description: "A small stone Jizō stands on a worn base beside the lane. Later variants carry a red bib or a timber shelter. The neighborhood setting is inferred.",
      spacing: 15, perBuildings: 24, limit: 4,
      sources: ["https://www.metmuseum.org/art/collection/search/42589"],
    });
    else details.push({
      id: "town-notices", prop: "streetNotice", variants: [2], name: "Public notices",
      description: "Paper announcements are sheltered beneath a small tiled cap. Fine marks indicate text at game scale, without invented legible proclamations.",
      spacing: 22, perBuildings: 35, limit: 3, sources: [],
    });
    details.push({
      id: "east-asian-goods", prop: "marketDisplay", variants: [1, 2], name: "Shopfront goods",
      description: "Folded cloth and filled woven baskets make a quiet shopfront display. Goods identify the trade without a large sign or scale.",
      spacing: 9, perBuildings: 15, limit: 6, trade: /shop|market|merchant|trader|cloth|stores/i, sources: [],
    });
  }
  if ((s.culture === "south-asian" || s.culture === "southeast-asian") && s.year >= 500 && s.year < 1950) details.push({
    id: "water-pots", prop: "waterStation", variants: [0, 1, 2], name: "Water pots and cup",
    description: "Earthen water pots stand on a low ledge for passers-by. The modest shade and porous clay are an inferred local arrangement, not a universal regional institution.",
    spacing: 18, perBuildings: 25, limit: 4, sources: [],
  }, {
    id: "cloth-and-spices", prop: "marketDisplay", variants: [0, 1], name: "Cloth and spice display",
    description: "Bolts of cloth or shallow spice bowls stand on a low wooden bench beside the seller's premises.",
    spacing: 9, perBuildings: 15, limit: 6, trade: /shop|market|merchant|trader|cloth|stores/i, sources: [],
  });
  return details;
}
