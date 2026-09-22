import type { CivicRule } from "./types";
export const europeCivic: CivicRule[] = [
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
