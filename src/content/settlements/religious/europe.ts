import type { ReligiousRule } from "./types";

export const europeReligious: ReligiousRule[] = [
  {
    id: "romanesque-parish",
    faith: "Latin Christian",
    recipe: "romanesque-church",
    labels: {
      small: "Chapel",
      medium: "Parish church",
      large: "Abbey church",
    },
    culture: "european",
    from: 900,
    to: 1550,
    bounds: [-10, 36, 30, 62],
    side: "north",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "A stone church beside the market, sized to the town, follows the Romanesque parish and abbey churches of western and central Europe. The date range is broad on purpose: Gothic detail is not yet modelled, so the Romanesque form stands in until 1550.",
    },
  },
];
