import type { CivicRule } from "./types";
export const asiaCivic: CivicRule[] = [
  {
    id: "bazaar",
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
  {
    id: "japanese-machi-bugyo",
    from: 1603,
    to: 1868,
    bounds: [128, 30, 146, 46],
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
  {
    id: "korean-dongheon",
    from: 1392,
    to: 1910,
    bounds: [124, 33, 131, 43.5],
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
  },
  {
    id: "mughal-kotwali",
    from: 1526,
    to: 1857,
    bounds: [66, 8, 92, 35],
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
  },
];
