import type { LanguageWindow } from ".";

export const oceania: LanguageWindow[] = [
  {
    id: "oc-rapa-nui",
    years: [1150, 2100],
    box: [[-110, -28, -108.5, -26.5]],
    hypotheses: [
      { label: "Rapa Nui (attested)", probability: 0.95, confidence: "attested",
        note: "Eastern Polynesian, settled from the west around 1200 CE. The island has spoken one language throughout its human history." },
      { label: "Eastern Polynesian (reconstructed)", probability: 0.05, confidence: "reconstructed",
        note: "For the earliest generations, before Rapa Nui diverged from its parent." },
    ],
  },
  {
    id: "oc-east-polynesia",
    years: [900, 2100],
    box: [[-161, 18, -154, 23], [-155, -28, -134, -7], [166, -48, 179, -34]],
    hypotheses: [
      { label: "Eastern Polynesian (reconstructed)", probability: 0.85, confidence: "reconstructed",
        note: "The last major human settlement of anywhere on earth: central East Polynesia around 1000 CE, Hawai'i and Aotearoa by about 1300." },
      { label: "Proto-Polynesian (reconstructed)", probability: 0.15, confidence: "reconstructed" },
    ],
  },
  {
    id: "oc-west-polynesia",
    years: [-900, 2100],
    box: [[-180, -23, -168, -8], [176, -21, 180, -12]],
    hypotheses: [
      { label: "Proto-Polynesian (reconstructed)", probability: 0.6, confidence: "reconstructed",
        note: "Tonga and Samoa were settled around 900 BCE and then sat still for a thousand years — the pause before the eastern voyages." },
      { label: "Central Pacific Austronesian (reconstructed)", probability: 0.4, confidence: "reconstructed",
        note: "Fijian and its relatives, which separated early from the Polynesian line." },
    ],
  },
  {
    id: "oc-new-guinea",
    years: [-10000, 2100],
    box: [[130, -12, 162, 0]],
    hypotheses: [
      { label: "Papuan highland language (hypothetical)", probability: 0.45, confidence: "inferred",
        note: "New Guinea holds several dozen unrelated families and around a fifth of the world's languages; no single name can be given honestly." },
      { label: "Trans-New Guinea (reconstructed)", probability: 0.35, confidence: "reconstructed",
        note: "The largest Papuan grouping, probably spreading with highland agriculture from about 4000 BCE." },
      { label: "Oceanic Austronesian (reconstructed)", probability: 0.2, confidence: "reconstructed",
        note: "Coastal and island fringes only, from about 1500 BCE; the interior stayed Papuan." },
    ],
  },
  {
    id: "oc-australia-pre-pn",
    years: [-10000, -2000],
    box: [[112, -44, 154, -10]],
    hypotheses: [
      { label: "Non-Pama-Nyungan Australian (hypothetical)", probability: 0.6, confidence: "inferred",
        note: "Before the Pama-Nyungan expansion the continent held far greater family-level diversity, of which the north retains the remnant." },
      { label: "Tasmanian (hypothetical)", probability: 0.2, confidence: "conjectural",
        note: "Isolated by rising sea level around 10,000 BCE and unrelated to anything on the mainland as far as the fragmentary records show." },
      { label: "Pre-Pama-Nyungan (hypothetical)", probability: 0.2, confidence: "conjectural" },
    ],
  },
  {
    id: "oc-australia-pn",
    years: [-2000, 1788],
    box: [[112, -44, 154, -10]],
    hypotheses: [
      { label: "Pama-Nyungan (reconstructed)", probability: 0.7, confidence: "reconstructed",
        note: "Expanded from the Gulf of Carpentaria about 4,000 years ago to cover nearly nine-tenths of the continent." },
      { label: "Non-Pama-Nyungan Australian (hypothetical)", probability: 0.25, confidence: "inferred",
        note: "The north and northwest were never absorbed and remain the most diverse part of the continent." },
      { label: "Tasmanian (hypothetical)", probability: 0.05, confidence: "conjectural" },
    ],
  },
  {
    id: "oc-australia-post-contact",
    years: [1788, 2100],
    box: [[112, -44, 154, -10]],
    hypotheses: [
      { label: "Western Desert language (attested)", probability: 0.3, confidence: "attested",
        note: "Pitjantjatjara, Yankunytjatjara and their neighbours across the central deserts, still spoken by thousands." },
      { label: "Arrernte (attested)", probability: 0.2, confidence: "attested",
        note: "The languages of the central ranges around Alice Springs." },
      { label: "Warlpiri (attested)", probability: 0.15, confidence: "attested",
        note: "The Tanami and the country north-west of the centre." },
      { label: "Yolngu Matha (attested)", probability: 0.1, confidence: "attested",
        note: "Northeast Arnhem Land, one of the strongest surviving language communities." },
      { label: "Australian English (attested)", probability: 0.15, confidence: "attested",
        note: "Settler and station populations, and increasingly the second language of everyone else." },
      { label: "Kriol (attested)", probability: 0.1, confidence: "attested",
        note: "The English-lexified creole of the northern cattle country, a first language for many since the twentieth century." },
    ],
  },
  {
    id: "oc-lapita",
    years: [-1500, 900],
    box: [[110, -50, 180, 20], [-180, -50, -105, 30]],
    hypotheses: [
      { label: "Proto-Oceanic (reconstructed)", probability: 0.6, confidence: "reconstructed",
        note: "The Lapita expansion carried Oceanic Austronesian from the Bismarcks into Remote Oceania within a few generations." },
      { label: "Papuan language of the islands (hypothetical)", probability: 0.25, confidence: "inferred",
        note: "Near Oceania was already occupied and stayed partly Papuan-speaking." },
      { label: "Central Pacific Austronesian (reconstructed)", probability: 0.15, confidence: "reconstructed" },
    ],
  },
  {
    id: "oc-early",
    years: [-10000, -1500],
    box: [[110, -50, 180, 20], [-180, -50, -105, 30]],
    hypotheses: [
      { label: "Papuan language of the islands (hypothetical)", probability: 0.7, confidence: "conjectural",
        note: "Near Oceania had been occupied for forty thousand years by this point, and none of it was Austronesian yet." },
      { label: "Non-Pama-Nyungan Australian (hypothetical)", probability: 0.3, confidence: "conjectural" },
    ],
  },
  {
    id: "backstop-oceania",
    years: [-10000, 1000],
    box: [[110, -50, 180, 20], [-180, -50, -105, 30]],
    hypotheses: [
      { label: "Oceanic Austronesian (reconstructed)", probability: 0.6, confidence: "inferred" },
      { label: "Papuan language of the islands (hypothetical)", probability: 0.4, confidence: "inferred" },
    ],
  },
];
