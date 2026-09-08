import type { CivicRule } from "./types";
export const italyCivic: CivicRule[] = [
  {
    id: "republican-imperial-italy",
    from: -129,
    to: 400,
    bounds: [7, 36, 19, 47],
    culture: "european",
    label: "Civic basilica",
    square: "Public square",
    form: "colonnade",
    evidence: {
      status: "inferred",
      sources: [
        "https://pompeiisites.org/wp-content/uploads/A-Guide-to-the-Pompeii-Excavations-2.pdf",
      ],
      note: "The Pompeii basilica is dated to 130–120 BCE. Its relationship to a public square informs this game-scale Italian urban kit. This is not the plan of a particular building in Rome; the regional/date extent is an authoring interpretation.",
    },
  },
];
