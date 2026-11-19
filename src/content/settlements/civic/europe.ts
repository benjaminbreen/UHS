import type { CivicRule, RoyalGround } from "./types";
import type { WorldSetting } from "../../geography/types";

export function europeanGround(s: WorldSetting, place: string, roll: number): RoyalGround | undefined {
  if (s.culture !== "european") return;
  if (s.year >= 1701 && s.year <= 1789 && /^versailles$/i.test(place) && Math.abs(s.lon - 2.12) < .12 && Math.abs(s.lat - 48.8) < .1)
    return { id: "versailles", name: "Palace of Versailles", position: "garden", palace: "royal",
      rooms: { residence: "guard-room", "north-wing": "state", "south-wing": "queens" } };
  const britain = s.lon >= -5.8 && s.lon <= 2 && s.lat >= 50 && s.lat < 55.8;
  const northernFrance = s.lon >= -1.9 && s.lon <= 4.7 && s.lat >= 47.4 && s.lat <= 50.3;
  if (northernFrance && s.year >= 1673 && s.year <= 1789) {
    if (/^sceaux$/i.test(place) && Math.abs(s.lon - 2.296) < .09 && Math.abs(s.lat - 48.774) < .09)
      return { id: "sceaux", name: "Château de Sceaux", position: "garden", palace: "country" };
    if (roll < .09 && !/^(paris|versailles)$/i.test(place))
      return { id: "country-court", name: "Château grounds", position: "garden", palace: "country" };
  }
  if ((!britain && !northernFrance) || s.year < 1100 || s.year >= 1500) return;
  const early = s.year < 1200;
  const castle: RoyalGround["castle"] = early
    ? { hall: "hall-keep", material: "masonry", tower: "b", approach: "ditch", paving: "cobble", service: "yard-byre-wattle" }
    : { hall: "great-hall", material: "masonry", tower: "a", approach: "ditch", paving: "cobble", service: "yard-byre-stone" };
  if (/^conwy$/i.test(place) && Math.abs(s.lon + 3.83) < .18 && Math.abs(s.lat - 53.28) < .12)
    return s.year >= 1287 ? { id: "conwy-ward", name: "Castle ward", position: "rise", castle } : undefined;
  if (/^(city of )?london$/i.test(place) && Math.abs(s.lon + .1) < .45 && Math.abs(s.lat - 51.5) < .2)
    return { id: "tower-ward", name: "Tower ward", position: "wall",
      castle: { ...castle, approach: s.year >= 1280 ? "moat" : "ditch" } };
  if (roll < (early ? .22 : .32)) return { id: "castle-ward", name: "Castle ward", position: "rise", castle };
}

export const beurs: CivicRule = {
  id:"amsterdam-beurs", label:"Amsterdam Beurs", interior:"exchange", form:"colonnade", square:"Exchange square",
  from:1611,to:1800,bounds:[4.77,52.29,5.02,52.45],culture:"european",
  about:"Meet brokers and private lenders at the numbered pillars. Trade warehouse lots, buy company stock or find freight work.",
  evidence:{status:"inferred",sources:["https://www.amsterdam.nl/stadsarchief/canon/venster/11/"],
    note:"The Rokin exchange had a colonnaded courtyard with numbered meeting places. The arcade offices and game-scale lots are reconstructed."},
};
export const europeCivic: CivicRule[] = [
  beurs,
  {
    id: "english-market-hall",
    from: 1400,
    to: 1800,
    bounds: [-6, 50, 2, 56],
    culture: "european",
    label: "Market hall",
    square: "Market square",
    form: "hall",
    about:
      "The market hall. Traders set up under the open ground floor on market days, and the town's officers meet in the room above.",
    evidence: {
      status: "inferred",
      sources: [
        "https://historicengland.org.uk/education/schools-resources/educational-images/guildhall-market-place-lavenham-suffolk-cc001481",
      ],
      note: "The timber-framed guildhall at Lavenham's market place informs the assembly of a hall and square. Regional distribution, dimensions and date coverage here are illustrative.",
    },
  },
];
