import { over, type ReligiousRule } from "./types";

const temple = { small: "Shrine", medium: "Temple", large: "Great temple" };
const hindu = {
  faith: "Hindu",
  labels: temple,
  culture: "south-asian",
  side: "north",
  forecourt: 2,
} as const;

export const southAsiaReligious: ReligiousRule[] = [
  {
    id: "early-stupa",
    faith: "Buddhist",
    recipe: "stupa",
    labels: { small: "Stupa", medium: "Stupa", large: "Monastery" },
    culture: "south-asian",
    from: -250,
    to: 500,
    bounds: [67, 10, 92, 36],
    side: "north",
    about:
      "The stupa over the relics of the Buddha or a saint: pilgrims walk round it clockwise inside the railing, leave flowers and lamps, and the monks of the monastery beside it teach and beg in the town.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "Ashoka's stupas from the third century BCE, then Sanchi, Bharhut, Amaravati and the Gandharan monasteries. Brahmanical shrines of the same centuries were small and mostly of wood, and are not drawn.",
    },
  },
  {
    id: "pala-vihara",
    faith: "Buddhist",
    recipe: "stupa",
    labels: { small: "Stupa", medium: "Stupa", large: "Monastery" },
    culture: "south-asian",
    from: 500,
    to: 1200,
    bounds: [83, 21, 92, 27.5],
    side: "north",
    about:
      "The monastery and its stupa: monks study in the cells round the court, and the town's lay people bring alms and come to hear the teaching.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "Bihar and Bengal kept their great monasteries (Nalanda, Vikramashila, Somapura) under the Pala kings until the conquests of about 1200.",
    },
  },
  {
    ...hindu,
    id: "nagara-temple",
    recipe: "nagara-temple",
    from: 500,
    to: 2100,
    bounds: [67, 17, 92, 36],
    about:
      "The god's house: the image in the dark inner shrine under the tower, the hall where the town gathers, priests offering lamps and food at dawn and dusk, and processions on festival days.",
    evidence: {
      status: "inferred",
      sources: [],
      note: "The north Indian Nagara temple, its curved tower over the shrine and the stepped roofs of its halls, after the Gupta brick temples, Khajuraho and the Odisha temples of Bhubaneswar.",
    },
  },
  ...over(
    {
      ...hindu,
      id: "dravida-temple",
      recipe: "dravida-temple",
      from: 600,
      to: 2100,
      about:
        "The temple inside its walls: the gate tower over the street, the god in the inner shrine under the stepped tower, the tank, the halls of pillars, and the chariot drawn round the streets at the festival.",
      evidence: {
        status: "inferred",
        sources: [],
        note: "The Dravida temple from the Pallava shore temples and the Chola vimana at Thanjavur to the painted gopurams the Nayaks raised at Madurai and Srirangam in the sixteenth and seventeenth centuries.",
      },
    },
    [73.5, 7.5, 81, 17],
    [79.6, 9.3, 80.6, 10],
  ),
  {
    id: "lanka-dagoba",
    faith: "Buddhist",
    recipe: "dagoba",
    labels: { small: "Dagoba", medium: "Dagoba", large: "Great dagoba" },
    culture: "south-asian",
    from: -250,
    to: 2100,
    bounds: [79.4, 5.8, 82, 10],
    side: "north",
    about:
      "The white dagoba over its relics, the image house and the bodhi tree beside it: monks in their robes, pilgrims in white bringing flowers on the full-moon days.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "Theravada Buddhism came to Sri Lanka in the third century BCE. The bell-shaped dagoba on its terraces follows the Ruwanwelisaya and Thuparamaya at Anuradhapura, rebuilt and whitewashed through the centuries.",
    },
  },
  ...over(
    {
      id: "jain-temple",
      faith: "Jain",
      recipe: "jain-temple",
      labels: { small: "Temple", medium: "Temple", large: "Temple city" },
      from: 900,
      to: 2100,
      side: "north",
      about:
        "The Jain temple of white marble: the tirthankaras sit in the shrines, worshippers bathe the images and bring rice and flowers, and the monks in white pass through on foot.",
      forecourt: 2,
      evidence: {
        status: "inferred",
        sources: [],
        note: "The great Jain pilgrim towns: Palitana, the Dilwara temples at Mount Abu, Ranakpur, Shravanabelagola and Sammed Shikhar. Elsewhere Jains worshipped in temples among Hindu ones.",
      },
    },
    [71.7, 21.4, 71.9, 21.6],
    [72.6, 24.5, 72.8, 24.7],
    [73.4, 25.05, 73.55, 25.2],
    [76.4, 12.8, 76.6, 12.95],
    [86.1, 23.9, 86.2, 24.0],
  ),
  {
    id: "gurdwara",
    faith: "Sikh",
    recipe: "gurdwara",
    labels: { small: "Gurdwara", medium: "Gurdwara", large: "Great gurdwara" },
    from: 1600,
    to: 2100,
    bounds: [74.45, 30.3, 76.6, 32.2],
    side: "north",
    about:
      "The gurdwara, the Guru's door: the scripture read under its canopy, the saffron flag outside, and the free kitchen where anyone who comes sits on the floor in a row to eat.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "The Harmandir Sahib at Amritsar was finished in 1604. White domed gurdwaras with gilded domes and the Nishan Sahib follow the central Punjab, where Sikhs were most of the villagers; elsewhere in Punjab towns were mostly Muslim or Hindu.",
    },
  },
  ...over(
    {
      id: "indo-islamic-mosque",
      faith: "Islam",
      recipe: "persian-mosque",
      labels: { small: "Mosque", medium: "Friday mosque", large: "Great mosque" },
      culture: "south-asian",
      from: 1200,
      to: 2100,
      side: "north",
      about:
        "The Friday mosque: its court and pool, the arched prayer hall under its domes, and the call to prayer from the minarets over the bazaar.",
      forecourt: 2,
      evidence: {
        status: "inferred",
        sources: [],
        note: "Sindh, western Punjab and Kashmir were mostly Muslim by the later Middle Ages. The Iranian court-and-iwan mosque stands for their tiled mosques (Thatta, Wazir Khan's at Lahore); the red sandstone Mughal mosque is not yet drawn.",
      },
    },
    [66, 23, 74.45, 36],
  ),
  {
    id: "newar-temple",
    faith: "Hindu and Buddhist",
    recipe: "newar-temple",
    labels: temple,
    from: 600,
    to: 2100,
    bounds: [85.1, 27.5, 85.6, 27.85],
    side: "north",
    about:
      "The temple of tiered roofs on the square: the god's image behind the carved doors, bells hung at the steps, and the town's Hindus and Buddhists both bringing offerings.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "The Newar pagoda temple of brick and carved wood under two to five roofs, after the squares of Kathmandu, Patan and Bhaktapur (the Nyatapola, 1702).",
    },
  },
];
