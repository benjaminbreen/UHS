import type { ReligiousRule } from "./types";

export const europeReligious: ReligiousRule[] = [
  {
    id: "romanesque-parish",
    faith: "Latin Christian",
    recipe: "parish-church",
    labels: {
      small: "Chapel",
      medium: "Parish church",
      large: "Abbey church",
    },
    culture: "european",
    from: 900,
    to: 1800,
    bounds: [-10, 36, 30, 62],
    side: "north",
    about:
      "The parish church, where people come to Mass, are baptised, married and buried, and where the bells mark the hours of the day.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "A stone church beside the market, sized to the town, follows the Romanesque parish and abbey churches of western and central Europe. One towered parish form stands in for the whole range; Romanesque and Gothic are not yet told apart.",
    },
  },
];
