import { over, type ReligiousRule } from "./types";

// The atlas has tagged Ethiopia, the Swahili coast and Nubia as West and
// Central African; the rules for those places key on bounds alone.
const mosque = { small: "Mosque", medium: "Friday mosque", large: "Great mosque" };

export const africaReligious: ReligiousRule[] = [
  {
    id: "ethiopian-church",
    faith: "Ethiopian Orthodox Christian",
    recipe: "ethiopian-church",
    labels: { small: "Church", medium: "Church", large: "Cathedral" },
    from: 330,
    to: 2100,
    bounds: [35.5, 6, 43, 16.5],
    side: "north",
    about:
      "The church in its walled yard of junipers: the tabot, the tablet of the Ark, lies hidden in the inner sanctuary, priests and deacons sing the liturgy in Ge'ez, and the people stand outside the door on feast days.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "King Ezana of Aksum took Christianity in the 330s. The round thatched church with its ring of sanctuaries is the common later form; Lalibela's churches were cut from the rock around 1200, and Debre Damo keeps the Aksumite banded masonry of timber and stone.",
    },
  },
  {
    id: "coptic-church",
    faith: "Coptic Christian",
    recipe: "coptic-church",
    labels: { small: "Church", medium: "Church", large: "Great church" },
    culture: "north-african-west-asian",
    from: 392,
    to: 900,
    bounds: [24, 22, 36, 31.7],
    side: "north",
    about:
      "The church behind its plain walls: the screened sanctuary at the east end, the liturgy in Coptic and Greek, the bell over the gate, and the town's saints painted on the walls.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "Egypt was mostly Christian from the late fourth century until Muslims became the majority, by the usual estimate in the ninth or tenth. Domed mud-brick churches follow those of Old Cairo and the Wadi Natrun; the White Monastery at Sohag is the stone basilica.",
    },
  },
  {
    id: "nubian-church",
    faith: "Nubian Christian",
    recipe: "coptic-church",
    labels: { small: "Church", medium: "Church", large: "Cathedral" },
    from: 550,
    to: 1450,
    bounds: [29, 12, 36, 22],
    side: "north",
    about:
      "The church of the Nubian kingdom, its walls painted inside with saints and bishops, the liturgy in Greek and Old Nubian.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "Nobadia, Makuria and Alodia took Christianity in the 540s and 570s. The domed brick basilicas follow the excavated cathedral at Faras and the churches of Old Dongola.",
    },
  },
  ...over(
    {
      id: "sahel-mosque",
      faith: "Islam",
      recipe: "sahel-mosque",
      labels: mosque,
      culture: ["west-central-african", "north-african-west-asian"],
      from: 1000,
      to: 2100,
      side: "north",
      about:
        "The Friday mosque of rendered mud, its towers bristling with palm-wood beams: the whole town turns out each year to plaster it again before the rains.",
      forecourt: 2,
      evidence: {
        status: "inferred",
        sources: [],
        note: "Gao, Takrur and the Ghana capital had mosques by the eleventh century; Djenné's is dated to the thirteenth and the Djinguereber at Timbuktu to 1327. The Sudano-Sahelian mud mosque, its buttresses, pinnacles and toron beams, follows Djenné, Timbuktu, Agadez and Larabanga.",
      },
    },
    [-17, 13.5, 16, 20],
  ),
  ...over(
    {
      id: "sahel-mosque-south",
      faith: "Islam",
      recipe: "sahel-mosque",
      labels: mosque,
      culture: ["west-central-african", "north-african-west-asian"],
      from: 1300,
      to: 2100,
      side: "north",
      about:
        "The Friday mosque of rendered mud, its towers bristling with palm-wood beams: the whole town turns out each year to plaster it again before the rains.",
      forecourt: 2,
      evidence: {
        status: "inferred",
        sources: [],
        note: "Islam spread south with the Dyula traders and to the Hausa cities in the fourteenth century: Kano, Bobo-Dioulasso, Kong and Larabanga built mud mosques. The Mossi and many smaller peoples of this belt kept their own religions, which this rule does not tell apart.",
      },
    },
    [-17, 9, 16, 13.5],
  ),
  ...over(
    {
      id: "swahili-mosque",
      faith: "Islam",
      recipe: "swahili-mosque",
      labels: mosque,
      from: 1000,
      to: 2100,
      side: "north",
      about:
        "The mosque of coral stone and lime: the cistern by the door for washing, the long hall of piers under its little domes and vaults, and the carved niche facing Mecca.",
      forecourt: 2,
      evidence: {
        status: "inferred",
        sources: [],
        note: "Coral-rag mosques stood at Shanga by the tenth century; the Great Mosque at Kilwa, rebuilt in the fourteenth with domes and fluted vaults, and the flat-roofed mosques of Lamu and Gedi follow. The coast built few minarets before the nineteenth century. Harar's whitewashed mosques share the rule.",
      },
    },
    [38.9, -12, 46, 4],
    [40, -16, 41, -14],
    [42.0, 9.2, 42.3, 9.45],
  ),
  {
    id: "asante-shrine",
    faith: "Akan",
    recipe: "asante-shrine",
    labels: { small: "Shrine", medium: "Shrine house", large: "Shrine house" },
    from: 1600,
    to: 1900,
    bounds: [-3.3, 5.5, 0.5, 8.2],
    side: "north",
    about:
      "The house of an obosom, a god of a river or a hill: the god's brass pan stands in the room open on the court, its priest dances possessed on its days, and the town brings eggs, gin and sheep.",
    forecourt: 2,
    evidence: {
      status: "inferred",
      sources: [],
      note: "The abosomfie shrine houses round a court, with polished red lower walls, white raised reliefs and steep thatch, follow the ten that survive near Kumasi (Besease, Ejisu, Asawase).",
    },
  },
  ...over(
    {
      id: "orisha-shrine",
      faith: "Yoruba, Edo and Fon",
      recipe: "yoruba-shrine",
      labels: { small: "Shrine", medium: "Shrine house", large: "Shrine house" },
      from: 1000,
      to: 1900,
      side: "north",
      about:
        "The shrine of the town's god: the carved posts of its veranda, the god's pots and emblems inside, the priest's white cloth, and drumming on its festival days.",
      forecourt: 2,
      evidence: {
        status: "inferred",
        sources: [],
        note: "Orisha shrines of Ife and Oyo with carved veranda posts, the stepped turreted roofs of Benin's shrines and palace, and the Fon vodun houses of Abomey and Ouidah. Which a town builds follows its region.",
      },
    },
    [2.6, 6.3, 5.8, 9.2],
    [5.4, 5.8, 6.6, 7.0],
    [1.6, 6.2, 2.6, 8.0],
  ),
  {
    id: "sacred-grove",
    faith: "West and Central African",
    recipe: "sacred-grove",
    labels: { small: "Shrine", medium: "Sacred grove", large: "Sacred grove" },
    culture: ["west-central-african"],
    from: -500,
    to: 1900,
    bounds: [-17, -12, 32, 9],
    side: "north",
    about:
      "The grove of old trees where the town's spirits live: no one cuts a branch there, the shrine under the trees takes the offerings, and only the priests go further in.",
    forecourt: 2,
    warded: true,
    evidence: {
      status: "inferred",
      sources: [],
      note: "Sacred groves held the shrines of earth and ancestral spirits across the forest belt, from the Igbo and the Akan to the Kongo (Osun-Osogbo and the Kaya forests survive). The grove, its stake fence and white cloth are a general form, not one people's.",
    },
  },
];
