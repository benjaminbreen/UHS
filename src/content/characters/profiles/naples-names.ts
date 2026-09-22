import type { NameKit } from "../context-types";
export const naplesNameKits: NameKit[] = [
  {
    id: "names-naples-duchy",
    label: "Naples · late antiquity and the duchy",
    scope: {
      years: [476, 1139],
      places: ["city-naples", "naples", "neapolis"],
      bounds: [14.1, 40.7, 14.5, 41.0],
    },
    names: [
      "Sergius",
      "Gregorius",
      "Stephanus",
      "Johannes",
      "Georgius",
      "Theodorus",
      "Maria",
      "Anna",
      "Anastasia",
      "Theodora",
    ],
    sources: ["https://whc.unesco.org/en/list/726/", "https://dmnes.org/"],
    note: "An inferred local sample of Latin and Greek Christian name forms for Byzantine-connected Naples. Individual people and frequencies are fictional; the display forms do not reconstruct spoken Neapolitan. Keeps the broad Italian fallback's Norman-French forms out of this pre-Norman local setting.",
  },
];
