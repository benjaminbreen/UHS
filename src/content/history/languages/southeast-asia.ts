import type { LanguageWindow } from ".";

export const southeastAsia: LanguageWindow[] = [
  {
    id: "sea-island-early",
    years: [-10000, -2500],
    box: [[95, -11, 141, 6], [116, 5, 127, 21]],
    hypotheses: [
      { label: "Pre-Austronesian language of the islands (hypothetical)", probability: 0.75, confidence: "conjectural",
        note: "The islands were peopled tens of thousands of years before the Austronesian expansion; nothing of what those people spoke survives." },
      { label: "Papuan-related language (hypothetical)", probability: 0.25, confidence: "conjectural",
        note: "Eastern Indonesia keeps non-Austronesian languages to this day." },
    ],
  },
  {
    id: "sea-island-austronesian",
    years: [-2500, 600],
    box: [[95, -11, 141, 6], [116, 5, 127, 21]],
    hypotheses: [
      { label: "Malayo-Polynesian language of the region", probability: 0.7, confidence: "reconstructed",
        note: "Out of Taiwan by about 2500 BCE, through the Philippines and into island Southeast Asia." },
      { label: "Pre-Austronesian survival (hypothetical)", probability: 0.18, confidence: "conjectural",
        note: "Older languages persisted in the interiors and in the east long after the coasts had shifted." },
      { label: "Papuan-related language (hypothetical)", probability: 0.12, confidence: "conjectural" },
    ],
  },
  {
    id: "sea-mainland",
    years: [-10000, 600],
    box: [[92, 5, 110, 29]],
    hypotheses: [
      { label: "Austroasiatic language of the region", probability: 0.55, confidence: "reconstructed",
        note: "Mon-Khmer: the oldest widely spread family on the mainland." },
      { label: "Tai-Kadai language of the region", probability: 0.2, confidence: "inferred",
        note: "A later arrival from the north, dominant in the Chao Phraya only in the last millennium." },
      { label: "Tibeto-Burman language of the region", probability: 0.15, confidence: "inferred" },
      { label: "Austronesian language of the coast", probability: 0.1, confidence: "inferred",
        note: "Cham and its relatives held the central Vietnamese coast." },
    ],
  },
  {
    id: "backstop-southeast-asian",
    years: [-10000, 1000],
    box: [[92, -11, 141, 29]],
    hypotheses: [
      { label: "Austronesian language of the region", probability: 0.45, confidence: "inferred",
        note: "The islands, from Luzon to Timor, and the Malay peninsula." },
      { label: "Austroasiatic language of the region", probability: 0.3, confidence: "inferred",
        note: "The mainland: the ancestors of Mon, Khmer and Vietnamese." },
      { label: "Tai-Kadai language of the region", probability: 0.15, confidence: "inferred",
        note: "Spreading south out of what is now Guangxi and Guizhou." },
      { label: "Tibeto-Burman language of the region", probability: 0.1, confidence: "inferred",
        note: "The Irrawaddy and the hills behind it." },
    ],
  },
];
