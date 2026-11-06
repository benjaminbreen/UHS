import type { CivicRule } from "./types";
export const americasCivic: CivicRule[] = [
  {
    id: "inca-kallanka",
    from: 1400,
    to: 1572,
    bounds: [-80, -22, -65, -6],
    culture: "andean",
    label: "Kallanka",
    square: "Plaza",
    form: "hall",
    about:
      "The kallanka: a long hall with many doors onto the plaza, where officials, soldiers and corvée workers were lodged and the state's feasts were held.",
    evidence: {
      status: "inferred",
      sources: ["https://en.wikipedia.org/wiki/Kallanka"],
      note: "Kallanka are recorded beside the plazas of Huánuco Pampa, Incallajta and other Inca administrative centres.",
    },
  },
  {
    id: "aztec-tecpan",
    from: 1300,
    to: 1521,
    bounds: [-101, 17, -96, 21],
    culture: "mesoamerican",
    label: "Tecpan",
    square: "Plaza",
    form: "colonnade",
    about:
      "The tecpan, the lord's palace and the seat of the town's government: rooms round a court behind a pillared front, where the ruler heard disputes and the tribute was stored.",
    evidence: {
      status: "inferred",
      sources: ["https://en.wikipedia.org/wiki/Tecpan"],
      note: "The Codex Mendoza draws Moctezuma's palace with its judges' halls. A town's tecpan is drawn here as a pillared hall on the plaza.",
    },
  },
];
