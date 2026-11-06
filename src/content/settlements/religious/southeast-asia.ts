import { over, type ReligiousRule } from "./types";

const sea = "southeast-asian";

export const southeastAsiaReligious: ReligiousRule[] = [
  ...over(
    {
      id: "early-sea-stupa",
      faith: "Buddhist",
      recipe: "stupa",
      labels: { small: "Stupa", medium: "Stupa", large: "Monastery" },
      culture: [sea, "south-asian"],
      from: 200,
      to: 1050,
      side: "north",
      about:
        "The stupa over its relics, monks in the monastery beside it, and lay people bringing flowers and lamps on the holy days.",
      forecourt: 2,
      evidence: {
        status: "inferred",
        sources: [],
        note: "The Pyu cities (Sri Ksetra), the Mon kingdom of Dvaravati and Srivijaya on Sumatra (Muara Takus) built brick stupas from the early centuries CE.",
      },
    },
    [92, 9.5, 98.5, 28.5],
    [98.5, 12, 103, 18],
    [98, -6, 106, 4],
  ),
  {
    id: "burmese-pagoda",
    faith: "Theravada Buddhist",
    recipe: "burmese-pagoda",
    labels: { small: "Pagoda", medium: "Pagoda", large: "Great pagoda" },
    culture: sea,
    from: 1050,
    to: 2100,
    bounds: [92, 9.5, 98.5, 28.5],
    side: "north",
    about:
      "The pagoda over its relics, gilded or whitewashed, the monastery beside it: people climb barefoot to its terrace to light candles, strike the bell and pour water on their day's planet post.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "From Anawrahta's Pagan in the eleventh century: the bell-shaped zedi on its terraces with banana-bud spire and hti umbrella, after the Shwezigon, the Shwedagon and the Bagan temples.",
    },
  },
  {
    id: "khmer-temple",
    faith: "Hindu and Buddhist",
    recipe: "khmer-temple",
    labels: { small: "Prasat", medium: "Temple", large: "Temple mountain" },
    culture: sea,
    from: 600,
    to: 1400,
    bounds: [101, 9, 107.4, 16.5],
    side: "north",
    about:
      "The god's tower on its stepped platform behind the gate: Brahmin priests serve the image and the king's cult, and the rice fields round it pay for its dancers and lamps.",
    forecourt: 3,
    warded: true,
    evidence: {
      status: "inferred",
      sources: [],
      note: "Pre-Angkor brick towers (Sambor Prei Kuk), then the Angkorian sandstone prasats from the ninth century, Banteay Srei and Angkor Wat. Theravada monasteries replaced them as the towns' temples in the fourteenth century.",
    },
  },
  {
    id: "wat",
    faith: "Theravada Buddhist",
    recipe: "wat",
    labels: { small: "Wat", medium: "Wat", large: "Royal wat" },
    culture: sea,
    from: 1250,
    to: 2100,
    bounds: [98.5, 5.5, 107.4, 23],
    side: "north",
    about:
      "The wat: the ordination hall under its tiered roofs, the chedi over its relics, the monks' houses, and the boys who come to learn to read; the town feeds the monks on their alms round each morning.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "Sukhothai's Theravada wats from the thirteenth century, then Lanna, Ayutthaya, Lan Xang and Cambodia: the ubosot with stacked gabled roofs, chofa finials and naga bargeboards, after Wat Phra Si Sanphet, Wat Xieng Thong and Wat Phra That Lampang Luang.",
    },
  },
  {
    id: "cham-tower",
    faith: "Hindu",
    recipe: "cham-tower",
    labels: { small: "Kalan", medium: "Temple", large: "Temple" },
    from: 600,
    to: 1700,
    bounds: [107.4, 10.5, 109.5, 16.5],
    side: "north",
    about:
      "The brick tower of Shiva on its hill: the linga inside, Brahmin priests, and the king's offerings on the god's days.",
    forecourt: 2,
    warded: true,
    evidence: {
      status: "inferred",
      sources: [],
      note: "The Cham kalan of fine-laid brick with sandstone carvings, after My Son, Po Nagar at Nha Trang and Po Klong Garai.",
    },
  },
  {
    id: "javanese-candi",
    faith: "Hindu and Buddhist",
    recipe: "javanese-candi",
    labels: { small: "Candi", medium: "Candi", large: "Temple" },
    from: 700,
    to: 1500,
    bounds: [105, -9, 114.4, -5.5],
    side: "north",
    about:
      "The candi on its stepped base: the god or the Buddha in its chamber, priests at its offerings, and the villages round it bound to keep it.",
    forecourt: 2,
    warded: true,
    evidence: {
      status: "inferred",
      sources: [],
      note: "Central Javanese andesite candi of the eighth and ninth centuries (the Dieng group, Prambanan, Borobudur) and the brick temples of Majapahit in the east. Java's towns built mosques from the fifteenth and sixteenth centuries, not yet drawn.",
    },
  },
  {
    id: "balinese-pura",
    faith: "Balinese Hindu",
    recipe: "balinese-pura",
    labels: { small: "Pura", medium: "Pura", large: "Great pura" },
    from: 900,
    to: 2100,
    bounds: [114.4, -9, 116, -8],
    side: "north",
    about:
      "The village temple behind its split gate: tiered meru shrines for the gods and the ancestors, the slit-drum tower that calls the village, and offerings of flowers and rice set out every day.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "The Balinese pura, its split gate, walled courts and meru with black palm-fibre roofs of odd tiers, after Besakih and the village temples; the form was settled under Majapahit influence from the fourteenth century.",
    },
  },
];
