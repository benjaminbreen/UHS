import type { LanguageWindow } from ".";

const NEAR_EAST: [number, number, number, number] = [26, 12, 62, 42];
const SUMER: [number, number, number, number] = [44, 29, 49, 33.5];
const ANATOLIA: [number, number, number, number] = [26, 36, 45, 42];
const EGYPT: [number, number, number, number] = [24, 22, 36, 32];

export const nearEast: LanguageWindow[] = [
  {
    id: "egypt-predynastic",
    years: [-10000, -3200],
    box: [EGYPT],
    hypotheses: [
      { label: "Pre-Dynastic Egyptian (inferred)", probability: 0.55, confidence: "inferred",
        note: "The ancestor of Egyptian was in the valley well before writing.",
        draw: "Old Egyptian back-projected with Afroasiatic comparanda (Loprieno, Allen); vocalised Egyptian from Coptic evidence." },
      { label: "Proto-Afroasiatic (reconstructed)", probability: 0.25, confidence: "reconstructed",
        note: "Ehret places the family's origin in north-east Africa at this depth.",
        draw: "Ehret's Proto-Afroasiatic." },
      { label: "Nilo-Saharan ancestor (hypothetical)", probability: 0.2, confidence: "conjectural",
        note: "Upriver and west, the early Nile was probably not Afroasiatic." },
    ],
  },
  {
    id: "sumer-ubaid",
    years: [-6000, -3200],
    box: [SUMER],
    hypotheses: [
      { label: "Pre-literate Sumerian (inferred)", probability: 0.5, confidence: "inferred",
        note: "Spoken in the south before it was written; an isolate.",
        draw: "Early Sumerian (Jagersma, Zólyomi), with archaic phonology." },
      { label: "Ubaid substrate language (hypothetical)", probability: 0.3, confidence: "conjectural",
        note: "Landsberger's 'Proto-Euphratean': non-Sumerian craft words like nangar 'carpenter' and simug 'smith'.",
        draw: "The disyllabic substrate words in Sumerian (nangar, simug, engar, ašgab)." },
      { label: "Proto-Semitic (reconstructed)", probability: 0.2, confidence: "reconstructed", note: "Up the rivers and in the desert margins." },
    ],
  },
  {
    id: "anatolia-hattic",
    years: [-6000, -2000],
    box: [ANATOLIA],
    hypotheses: [
      { label: "Hattic ancestor (hypothetical)", probability: 0.45, confidence: "conjectural",
        note: "Hattic, recorded later in Hittite ritual texts, is the best candidate for the older language of central Anatolia.",
        draw: "Hattic (Soysal), prefixing and non-Indo-European." },
      { label: "Proto-Anatolian (reconstructed)", probability: 0.35, confidence: "reconstructed",
        note: "The first branch to leave Indo-European, arriving from the Balkans or Caucasus by about 3000 BCE.",
        draw: "Melchert's Proto-Anatolian." },
      { label: "Hurrian ancestor (hypothetical)", probability: 0.2, confidence: "conjectural", note: "The east and the hills." },
    ],
  },
  {
    id: "anatolia-hittite",
    years: [-2000, -1180],
    box: [ANATOLIA],
    hypotheses: [
      { label: "Hittite (attested)", probability: 0.5, confidence: "attested", note: "The palace language of Hattusa.",
        draw: "Hoffner and Melchert's grammar; Kloekhorst's dictionary." },
      { label: "Luwian (attested)", probability: 0.35, confidence: "attested", note: "The most widely spoken Anatolian language by the late empire." },
      { label: "Hattic or Hurrian (attested)", probability: 0.15, confidence: "attested", note: "Cult and the east." },
    ],
  },
  {
    id: "near-east-ppn",
    years: [-10000, -6000],
    box: [NEAR_EAST],
    hypotheses: [
      { label: "Pre-Pottery Neolithic Levantine (hypothetical)", probability: 0.45, confidence: "conjectural",
        note: "The first farming villages are linguistically silent; nothing survives of what was spoken at Jericho, Göbekli Tepe or Çatalhöyük.",
        draw: "Build it from the Afroasiatic-adjacent profile (triconsonantal tendency, pharyngeals) or from substrate words shared by Sumerian and Semitic for farming." },
      { label: "Proto-Afroasiatic (reconstructed)", probability: 0.3, confidence: "reconstructed",
        note: "Its homeland is argued between the Levant and north-east Africa.",
        draw: "Ehret's or Orel and Stolbova's Proto-Afroasiatic." },
      { label: "Pre-Sumerian Mesopotamian (hypothetical)", probability: 0.25, confidence: "conjectural",
        note: "Whatever Sumerian descends from was in the region by now." },
    ],
  },
  {
    id: "near-east-chalcolithic",
    years: [-6000, -3200],
    box: [NEAR_EAST],
    hypotheses: [
      { label: "Proto-Semitic (reconstructed)", probability: 0.45, confidence: "reconstructed",
        note: "Semitic separating from the rest of Afroasiatic.",
        draw: "Huehnergard's Proto-Semitic; Kogan's lexicon." },
      { label: "Proto-Afroasiatic (reconstructed)", probability: 0.25, confidence: "reconstructed", note: "Deeper stage." },
      { label: "Hurro-Urartian ancestor (hypothetical)", probability: 0.3, confidence: "conjectural",
        note: "The northern hills held languages unrelated to Semitic or Indo-European." },
    ],
  },
  {
    id: "near-east-bronze",
    years: [-3200, -1200],
    box: [NEAR_EAST],
    hypotheses: [
      { label: "Akkadian or Sumerian (attested)", probability: 0.35, confidence: "attested", note: "Mesopotamia." },
      { label: "West Semitic: Amorite, Ugaritic, Canaanite (attested)", probability: 0.3, confidence: "attested", note: "The Levant and Syria." },
      { label: "Hurrian or Elamite (attested)", probability: 0.2, confidence: "attested", note: "The northern and eastern edges." },
      { label: "Egyptian (attested)", probability: 0.15, confidence: "attested", note: "The Nile." },
    ],
  },
  {
    id: "backstop-mena",
    years: [-10000, 1000],
    box: [[-17, 12, 62, 42]],
    hypotheses: [
      { label: "Afroasiatic language of the region", probability: 0.8, confidence: "inferred" },
      { label: "Non-Afroasiatic survival (hypothetical)", probability: 0.2, confidence: "conjectural" },
    ],
  },
];
