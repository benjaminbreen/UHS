import type { WorldSetting } from "../../geography/types";
import type { CivicRule, RoyalGround } from "./types";
const korean: Omit<CivicRule, "bounds"> = {
  id: "korean-dongheon",
  interior: "magistracy",
  from: 1392,
  to: 1910,
  culture: "east-asian",
  label: "Magistrate's hall",
  square: "Hall forecourt",
  form: "hall",
  about:
    "The dongheon, where the county magistrate sent from the capital heard cases, collected taxes and governed the county.",
  evidence: {
    status: "inferred",
    sources: ["https://en.wikipedia.org/wiki/Eupseong"],
    note: "Surviving dongheon in walled county towns such as Naganeupseong inform the hall. Dimensions are illustrative.",
  },
};
export const asiaCivic: CivicRule[] = [
  {
    id: "bazaar",
    interior: "bazaar",
    from: 700,
    to: 1900,
    bounds: [-10, 12, 65, 42],
    culture: "north-african-west-asian",
    label: "Covered bazaar",
    square: "Bazaar square",
    form: "colonnade",
    about:
      "The covered market: rows of shops under vaults or awnings, each trade on its own lane, with the market inspector (muhtasib) checking weights and prices.",
    evidence: {
      status: "inferred",
      sources: ["https://en.wikipedia.org/wiki/Bazaar", "https://en.wikipedia.org/wiki/Hisba"],
      note: "Covered markets by the main mosque, policed by the muhtasib, are attested from Abbasid Baghdad to Safavid Isfahan. The arcade here stands for the type, not a particular bazaar.",
    },
  },
  {
    id: "chinese-yamen",
    forecourt: true,
    interior: "magistracy",
    from: -200,
    to: 1912,
    bounds: [97, 18, 126, 45],
    culture: "east-asian",
    label: "Magistrate's yamen",
    square: "Yamen forecourt",
    form: "hall",
    about:
      "The county magistrate's yamen: a walled compound of halls behind a gate with a drum for petitioners, where taxes are collected, cases heard and the emperor's orders posted.",
    evidence: {
      status: "inferred",
      sources: ["https://en.wikipedia.org/wiki/Yamen", "https://en.wikipedia.org/wiki/Neixiang_County_Yamen"],
      note: "The surviving Qing yamen at Neixiang and Pingyao inform the hall and forecourt. Earlier dynasties' county offices followed a similar axial plan but are less well preserved.",
    },
  },
  // Before Japan's box, which would otherwise take Busan; Kyushu stays Japanese.
  ...([[124, 33, 129.4, 43.5], [129.4, 38, 131, 43.5]] as const).map((bounds): CivicRule => ({ ...korean, bounds })),
  {
    id: "japanese-machi-bugyo",
    interior: "magistracy",
    from: 1603,
    to: 1868,
    bounds: [129.4, 30, 146, 46],
    culture: "east-asian",
    label: "Town magistrate's office",
    square: "Office forecourt",
    form: "hall",
    about:
      "The machi bugyō's office: the shogunate's magistrate for the commoners' town, who heard suits, ran the watch and the fire brigades and fixed prices.",
    evidence: {
      status: "inferred",
      sources: ["https://en.wikipedia.org/wiki/Machi-bugy%C5%8D"],
      note: "Edo had north and south bugyō offices; castle towns had their own town magistrates. The hall here stands for the type.",
    },
  },
  // Mughal India: north of the Tamil country and south of Nepal.
  ...([[66, 15, 80, 35], [80, 15, 92, 26.4]] as const).map((bounds): CivicRule => ({
    id: "mughal-kotwali",
    interior: "magistracy",
    from: 1526,
    to: 1857,
    bounds,
    culture: "south-asian",
    label: "Kotwali",
    square: "Chowk",
    form: "hall",
    about:
      "The kotwal's office: the city's chief of police and market supervisor, who kept the watch, checked weights and measures and held offenders.",
    evidence: {
      status: "inferred",
      sources: ["https://en.wikipedia.org/wiki/Kotwal"],
      note: "The kotwal's duties are set out in the Ain-i-Akbari; the building itself varied and is drawn as a generic hall on the chowk.",
    },
  })),
];

export function citadelGround(s: WorldSetting, place: string, roll: number): RoyalGround | undefined {
  if (s.culture !== "north-african-west-asian" || s.year < 1250 || s.year >= 1517) return;
  const lowerNile = s.lon >= 29 && s.lon <= 32.6 && s.lat >= 27.5 && s.lat <= 31.4;
  const levant = s.year >= 1260 && s.lon >= 34.4 && s.lon <= 38.2 && s.lat >= 31.5 && s.lat <= 36.8;
  if ((lowerNile || levant) && (/^(cairo|aleppo|damascus)$/i.test(place) || roll < .28))
    return { id: "citadel-ward", name: "Citadel court", position: "rise",
      castle: { hall: "audience-hall", material: "limestone", tower: "a", approach: "forecourt", paving: "slab" } };
}
