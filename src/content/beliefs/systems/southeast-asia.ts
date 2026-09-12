import type { BeliefSystem } from "../types";

/** Southeast Asian belief systems across the major traditions and regions.
 * From early animism through Hindu-Buddhist syncretism to Islam and Catholicism,
 * showing local spirits persisting beneath and within each great tradition. */
export const southeastAsia: readonly BeliefSystem[] = [
  {
    id: "se-asia-early-foragers",
    label: "Early forager and hunter communities",
    scope: { years: [-8000, -2000], bounds: [92, -11, 142, 25] },
    wiki: "https://en.wikipedia.org/wiki/Prehistory_of_Southeast_Asia",
    powers: [
      {
        name: "*Kmoc",
        gloss: "Proto-Austroasiatic *kmoc, 'corpse, spirit of the dead'",
        domain: "lineage, protection, the family path",
        rank: "paramount",
      },
      {
        name: "*Bri",
        gloss: "Proto-Austroasiatic *briʔ, 'forest'",
        domain: "game, paths, abundance, danger",
        rank: "paramount",
      },
      {
        name: "*Ɗaːk",
        gloss: "Proto-Austroasiatic *ɗaːk, 'water'",
        domain: "fish, travel, crossings, sustenance",
        rank: "major",
      },
      {
        name: "The mountain",
        domain: "height, weather, distant hunting",
        rank: "major",
      },
      {
        name: "The hearth",
        domain: "gathering, warmth, the camp's center",
        rank: "major",
      },
      {
        name: "The stone",
        domain: "tools, shelter, dwelling places",
        rank: "local",
      },
      {
        name: "The animal spirits",
        domain: "deer, boar, python—kinship and respect",
        rank: "local",
      },
    ],
    practice: [
      "The ancestors are invoked before the hunt and provisioned after a kill.",
      "Camps move with the seasons and the animals.",
      "Caves and rock shelters are marked as dwelling places of the ancestors.",
      "Fire is kept and shared; loss of fire is catastrophe.",
    ],
    specialist:
      "The eldest tracker, keeper of paths and seasons; the one who speaks to the ancestors.",
    evidence: {
      status: "hypothesis",
      claim:
        "Forager and hunter-gatherer communities across Southeast Asia before the adoption of farming and fixed settlement practiced ancestor veneration and animate-spirits belief, reconstructed from archaeological evidence of long occupation sites, burials with grave goods, and ethnographic parallels from surviving forager groups.",
      sources: [
        "Bellwood, Prehistory of the Indo-Malaysian Archipelago",
        "Higham, The Archaeology of Mainland Southeast Asia",
        "Sidwell, The Austroasiatic Languages",
      ],
      limitation:
        "No direct sources; inferred from material remains and continuities in later upland practice. The starred names are Proto-Austroasiatic words reconstructed from later Mon-Khmer and Munda languages, not recorded theonyms, and Proto-Austroasiatic itself is usually dated well after this span begins; nothing here shows these foragers spoke an Austroasiatic language, only that it is the best-attested substrate candidate for the region.",
    },
  },
  {
    id: "se-asia-austronesian-animism",
    label: "Austronesian ancestor and spirit practice",
    scope: { years: [-2000, 800], bounds: [92, -11, 142, 25] },
    wiki: "https://en.wikipedia.org/wiki/Austronesian_peoples",
    powers: [
      {
        name: "The Hyang",
        wiki: "https://en.wikipedia.org/wiki/Hyang",
        domain: "ancestral and divine spirits, blessing, the unseen",
        rank: "paramount",
      },
      {
        name: "Dewi Sri",
        wiki: "https://en.wikipedia.org/wiki/Dewi_Sri",
        domain: "growth, harvest, plenty",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "The Hyang" }],
      },
      {
        name: "*Rumaq",
        gloss: "Proto-Austronesian *Rumaq, 'house'",
        domain: "the household threshold and its safety",
        rank: "major",
      },
      {
        name: "The Naga",
        wiki: "https://en.wikipedia.org/wiki/Naga",
        domain: "rivers, crossings, the sea's far shore",
        rank: "major",
      },
      {
        name: "*Qalas",
        gloss: "Proto-Austronesian *qalas, 'forest, wilderness'",
        domain: "game, paths, the edge of settled land",
        rank: "local",
      },
      {
        name: "*Sapuy",
        gloss: "Proto-Austronesian *Sapuy, 'fire'",
        domain: "warmth, gathering, shared food",
        rank: "local",
      },
      {
        name: "The danyang",
        domain: "the village boundary and its watch",
        rank: "local",
        relations: [{ kind: "aspect-of", of: "The Hyang" }],
      },
      {
        name: "*Taneq",
        gloss: "Proto-Austronesian *taneq, 'earth, land, soil'",
        domain: "burial and staying put",
        rank: "local",
      },
    ],
    practice: [
      "Rice and palm wine are set out at planting and harvest for the Hyang and for Dewi Sri.",
      "A post carved with faces marks the entrance to the house and the cleared land.",
      "The dead are laid in the ground or in trees, kept provisioned so they join the Hyang without wandering.",
      "Crocodile and python go unhunted on certain days, taken for the Naga's kin.",
    ],
    specialist:
      "The eldest, who remembers the names and speaks first to the Hyang.",
    evidence: {
      status: "hypothesis",
      claim:
        "Austronesian-language communities across maritime Southeast Asia shared an ancestor- and spirit-venerating practice before Hindu or Islamic arrival. The Hyang, Dewi Sri, and the naga are attested in the earliest Old Malay, Old Javanese, and Old Sundanese inscriptions and persist in later folk practice across the archipelago.",
      sources: [
        "Fox, The Austronesian Link",
        "Howe, 'Malay-Muslim Animism'",
        "Zoetmulder, Old Javanese-English Dictionary",
        "Blust, The Austronesian Languages",
      ],
      limitation:
        "No texts survive from the earliest centuries of this span; the named figures are attested only once writing appears, and are projected back onto the practice that preceded it. The starred names are Proto-Austronesian words for house, forest, fire and land, reconstructed by the comparative method from daughter languages across the Pacific and archipelago, not recorded names for spirits of the house or the forest.",
    },
  },
  {
    id: "se-asia-early-hindu-buddhism",
    label: "Early Hindu-Buddhist kingdoms and villages",
    scope: { years: [-500, 1000], bounds: [92, -10, 145, 24] },
    wiki: "https://en.wikipedia.org/wiki/Greater_India",
    powers: [
      {
        name: "The ancestors",
        domain: "lineage, protection, the family and village",
        rank: "paramount",
      },
      {
        name: "Shiva",
        wiki: "https://en.wikipedia.org/wiki/Shiva",
        domain: "cycles, the mountain, transformation",
        rank: "major",
      },
      {
        name: "Vishnu",
        wiki: "https://en.wikipedia.org/wiki/Vishnu",
        domain: "order, preservation, cosmic balance",
        rank: "major",
      },
      {
        name: "The Buddha",
        wiki: "https://en.wikipedia.org/wiki/Gautama_Buddha",
        domain: "the path, awakening, the refuge",
        rank: "major",
      },
      {
        name: "The river",
        domain: "life, trade, the delta's gifts",
        rank: "major",
      },
      {
        name: "The rice",
        domain: "growth, harvest, the people's year",
        rank: "major",
      },
      {
        name: "The neak ta",
        wiki: "https://en.wikipedia.org/wiki/Neak_ta",
        domain: "the land's guardians, village boundaries",
        rank: "local",
      },
      {
        name: "The sacred mountain",
        domain: "the axis mundi, the realm's center",
        rank: "local",
      },
    ],
    practice: [
      "Temples to Shiva and Buddha rise on hills and river bends.",
      "The king rules as the gods' representative, anchoring cosmic order.",
      "Villagers tend rice and the neak ta as their ancestors did.",
      "Monks and Brahmins conduct state ritual; farmers and merchants live by older rhythms.",
    ],
    specialist:
      "Court priests for state rites; monks for teaching; village elders for the ancestors.",
    evidence: {
      status: "documented",
      claim:
        "Hindu-Buddhist architecture, inscriptions, and art appear across Southeast Asia from the early centuries, while ethnographic and folk accounts show land-guardian spirits such as the neak ta and ancestor practice persisting beneath and within the great traditions.",
      sources: [
        "Hall, A History of Early Southeast Asia",
        "Vickery, The Khmer Empire and the Early Cham Polity",
      ],
      limitation:
        "Court sources dominate; village practice is reconstructed from archaeology and later accounts.",
    },
  },
  {
    id: "se-asia-funan-hindu-buddhism",
    label: "Funan and early Champa Hindu-Buddhist courts",
    scope: { years: [1, 650], bounds: [99, 8, 108, 16] },
    wiki: "https://en.wikipedia.org/wiki/Funan",
    powers: [
      {
        name: "Vishnu",
        wiki: "https://en.wikipedia.org/wiki/Vishnu",
        domain: "order, kingship, preservation",
        rank: "paramount",
      },
      {
        name: "Shiva",
        wiki: "https://en.wikipedia.org/wiki/Shiva",
        domain: "cycles, dissolution, the mountain",
        rank: "paramount",
      },
      {
        name: "The Buddha",
        wiki: "https://en.wikipedia.org/wiki/Gautama_Buddha",
        domain: "awakening, the refuge, the path",
        rank: "major",
      },
      {
        name: "Po Nagar",
        wiki: "https://en.wikipedia.org/wiki/Po_Nagar",
        domain: "the land, motherhood, the realm's fertility",
        rank: "major",
      },
      {
        name: "The river",
        domain: "life, trade, the Mekong's gifts",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the royal line, blessing the throne",
        rank: "local",
      },
      {
        name: "The sacred mountain",
        domain: "the axis mundi, the court's axis",
        rank: "local",
      },
      {
        name: "The rice",
        domain: "the peasant's year, the realm's wealth",
        rank: "local",
      },
      {
        name: "The neak ta",
        wiki: "https://en.wikipedia.org/wiki/Neak_ta",
        domain: "the land's own guardians",
        rank: "local",
      },
    ],
    practice: [
      "Great temples to Vishnu and Shiva are built on river bends and hilltops; the king is the god's proxy.",
      "Monks and court Brahmins read Sanskrit and make offerings; villagers keep the neak ta as always.",
      "Cham communities honor Po Nagar, mother of the land, whose coastal shrine draws pilgrims across faiths.",
      "Statuary mixes Vishnu and Buddha, Shiva and local features of stone and water.",
      "The flood season is seen as Vishnu's gift; harvest follows the old calendar and the new.",
    ],
    specialist:
      "Court Brahmins for the state gods; village elders for the neak ta below.",
    evidence: {
      status: "documented",
      claim:
        "Funan and Champa inscriptions record major Hindu temples and Buddha statues from the 1st-7th centuries, while later folktales and ethnography show Po Nagar and the neak ta persisting in lowland practice.",
      sources: [
        "Vickery, The Khmer Empire and the Early Cham Polity",
        "Pottier, 'Funan and the Mekong Delta'",
      ],
      limitation:
        "Court inscriptions dominate; Po Nagar's cult is best attested from the stone temple raised after this period, and is extended back here by continuity of Cham practice.",
    },
  },
  {
    id: "se-asia-angkorian-devaraja",
    label: "Khmer Angkorian devaraja cult",
    scope: { years: [790, 1431], bounds: [102, 10, 106, 15] },
    wiki: "https://en.wikipedia.org/wiki/Devaraja",
    powers: [
      {
        name: "Shiva",
        wiki: "https://en.wikipedia.org/wiki/Shiva",
        domain: "the god-king, the axis of the realm",
        rank: "paramount",
      },
      {
        name: "Vishnu",
        wiki: "https://en.wikipedia.org/wiki/Vishnu",
        domain: "sustenance, the cosmic order",
        rank: "major",
      },
      {
        name: "Brahma",
        wiki: "https://en.wikipedia.org/wiki/Brahma",
        domain: "creation, the world-maker",
        rank: "major",
        relations: [{ kind: "child-of", of: "Vishnu" }],
      },
      {
        name: "The Buddha",
        wiki: "https://en.wikipedia.org/wiki/Gautama_Buddha",
        domain: "refuge, merit, escape from suffering",
        rank: "major",
      },
      {
        name: "The mountain at the center",
        domain: "the cosmic pivot, the king's seat",
        rank: "major",
      },
      {
        name: "The Tonle Sap",
        domain: "the waters, the flood, the realm's lifeblood",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the royal line reborn in each king",
        rank: "local",
      },
      {
        name: "Local spirits and guardians",
        domain: "the land itself and its village thresholds",
        rank: "local",
      },
      {
        name: "The rice",
        domain: "the peasant's share in the cosmos",
        rank: "local",
      },
    ],
    practice: [
      "The king IS Shiva on earth, approached only through ritual and temple courts.",
      "Hydraulic festivals mark the flood's pulse; offerings to Shiva atop the Central Mountain in the capital.",
      "Peasants tend their rice, make merit at Buddhist monasteries, and keep the ancestors provisioned.",
      "The great temples house thousands of stones carved with the cosmology; the village shrine is small and close.",
    ],
    specialist:
      "Court Brahmin purohita, who maintains the king's divinity; Buddhist monks for the common refuge; village headmen for the small spirits.",
    afterlife:
      "The virtuous gain merit and escape the wheel. The king's soul joins Shiva in the Central Mountain.",
    evidence: {
      status: "documented",
      claim:
        "Khmer inscriptions of the 9th-13th centuries, particularly Jayavarman II's proclamation and the temple record from Angkor Wat and Ta Prohm, confirm the devaraja cult; later accounts show local spirits coexisting with state religion.",
      sources: [
        "Briggs, The Ancient Khmer Empire",
        "Coe, Angkor and the Khmer Civilization",
        "Hall, A History of Early Southeast Asia",
      ],
      limitation:
        "Court and temple texts describe official practice; village faith inferred from archaeology and colonial accounts. Brahma's birth from Vishnu, shown in Angkor's own temple reliefs, is a Vaishnava telling that sits awkwardly beside this cult's own Shiva-centered kingship.",
    },
  },
  {
    id: "se-asia-theravada-burma",
    label: "Theravada Burma with nat worship",
    scope: { years: [1050, 1885], bounds: [92, 9, 102, 29] },
    wiki: "https://en.wikipedia.org/wiki/Buddhism_in_Myanmar",
    powers: [
      {
        name: "The Buddha",
        wiki: "https://en.wikipedia.org/wiki/Gautama_Buddha",
        domain: "the path to nirvana, the refuge",
        rank: "paramount",
      },
      {
        name: "Thagyamin",
        wiki: "https://en.wikipedia.org/wiki/Thagyamin",
        domain: "king of the nats, the sky, rain, kingship",
        rank: "paramount",
      },
      {
        name: "Min Mahagiri",
        domain: "Mount Popa, the household's guardian, the coconut shrine",
        rank: "major",
        relations: [{ kind: "serves", of: "Thagyamin" }],
      },
      {
        name: "Wathondaye",
        domain: "witness to deeds, the realm beneath",
        rank: "major",
        relations: [{ kind: "serves", of: "The Buddha" }],
      },
      {
        name: "Shin Byu Shin",
        domain: "royal nat lineage, guardianship of the court",
        rank: "major",
        relations: [{ kind: "serves", of: "Thagyamin" }],
      },
      {
        name: "The Taungbyon brothers",
        domain: "brotherhood, festival, protection from illness",
        rank: "local",
        relations: [{ kind: "serves", of: "Thagyamin" }],
      },
      {
        name: "The river nats",
        domain: "water, crossing, the path abroad",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the family line, blessing the living",
        rank: "local",
      },
      {
        name: "The rice",
        domain: "growth and sustenance",
        rank: "local",
      },
    ],
    practice: [
      "Monasteries anchor village life; lay people give rice and cloth to gain merit, then turn to the nats for the daily fix.",
      "A coconut wrapped in cloth hangs from the house post for Min Mahagiri, guardian of hearth and home.",
      "Mediums are possessed by Shin Byu Shin, Thagyamin, or another nat and speak with the spirit's voice.",
      "The Taungbyon festival each August draws mediums and pilgrims to dance for the two brother nats.",
      "Elephant and python are counted the nats' kin; harming them invites vengeance.",
    ],
    specialist:
      "Monks for the dharma and merit; nat mediums for possession, healing, and the Taungbyon rites; the household elder for the ancestors.",
    afterlife:
      "Rebirth continues until merit brings cessation. The nats cycle through suffering and power without escape.",
    evidence: {
      status: "documented",
      claim:
        "Burmese chronicles and inscriptions from the Pagan period onward record Buddhist monasteries; ethnographic accounts since the 1800s consistently document Thagyamin, Min Mahagiri, the Taungbyon brothers, and dozens of other named nats as coeval and inseparable from Buddhism in village practice.",
      sources: [
        "Aung-Thwin, The Mrauk-U Empire and Southeast Asian State Formation",
        "Spiro, Burmese Supernaturalism",
      ],
      limitation:
        "Colonial-era observers often characterized nats as 'superstition' against 'true' Buddhism; modern scholarship shows the synthesis as ancient.",
    },
  },
  {
    id: "se-asia-theravada-siam",
    label: "Theravada Siam and Lao practice",
    scope: { years: [1238, 1885], bounds: [99, 13, 108, 21] },
    wiki: "https://en.wikipedia.org/wiki/Religion_in_Thailand",
    powers: [
      {
        name: "The Buddha",
        wiki: "https://en.wikipedia.org/wiki/Gautama_Buddha",
        domain: "the path, the refuge, enlightenment",
        rank: "paramount",
      },
      {
        name: "The phi",
        domain: "local spirits, ancestors, the animate land",
        rank: "paramount",
      },
      {
        name: "Indra",
        wiki: "https://en.wikipedia.org/wiki/Indra",
        domain: "the sky, rain, the king's cosmic place",
        rank: "major",
        relations: [{ kind: "serves", of: "The Buddha" }],
      },
      {
        name: "Phra Phrom",
        wiki: "https://en.wikipedia.org/wiki/Phra_Phrom",
        domain: "the city guardian, creation, four-faced protection",
        rank: "major",
        relations: [{ kind: "serves", of: "The Buddha" }],
      },
      {
        name: "Lak Mueang",
        domain: "the community's own spirit guardian, the city's pillar",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "The phi" }],
      },
      {
        name: "Chao Thi",
        domain: "the home's land and safety",
        rank: "local",
        relations: [{ kind: "aspect-of", of: "The phi" }],
      },
      {
        name: "Mae Posop",
        wiki: "https://en.wikipedia.org/wiki/Phosop",
        domain: "growth, the planter's hope, the rice spirit",
        rank: "local",
        relations: [{ kind: "aspect-of", of: "The phi" }],
      },
      {
        name: "The ancestors",
        domain: "the family, blessing and watching",
        rank: "local",
      },
      {
        name: "The water and its spirits",
        domain: "river, stream, well, and the naiads within",
        rank: "local",
      },
    ],
    practice: [
      "Villages maintain wats as centers of merit-making; young men spend a rains retreat as monks to gain blessing.",
      "A spirit house for Chao Thi stands in the yard and receives fruit and rice from the women each evening.",
      "The phi may sicken a family if slighted; a khru diagnoses which phi has taken offense.",
      "Mae Posop is thanked at planting and harvest, sometimes carried in effigy from the field to the granary.",
      "City pillars for Lak Mueang and shrines to Phra Phrom stand at the town's center; the village headman tends the humbler post at its edge.",
    ],
    specialist:
      "Monks for merit and teaching; the khru (spirit master) for divination and possession; the household elder for daily offerings to Chao Thi.",
    afterlife:
      "Merit brings higher rebirth. The phi persist endlessly, cycling through favor and anger.",
    evidence: {
      status: "documented",
      claim:
        "Thai and Lao chronicles record Buddhist kingdoms from Sukhothai onward; ethnography and temple records from the 1800s onward consistently describe Phra Phrom, Lak Mueang, Chao Thi, Mae Posop, and the wider phi as essential village practice alongside Buddhism.",
      sources: [
        "Baker & Pasuk, A History of Thailand",
        "Tambiah, The Buddhist Saints of the Forest and the Cult of Amulets",
      ],
      limitation:
        "Scholarly focus has long been on monarchy and monasteries; village phi practice is best documented from 1900 onward.",
    },
  },
  {
    id: "se-asia-majapahit",
    label: "Majapahit Hindu-Buddhist Java",
    scope: { years: [1200, 1600], bounds: [100, -11, 130, -4] },
    wiki: "https://en.wikipedia.org/wiki/Majapahit",
    powers: [
      {
        name: "Shiva-Buddha",
        domain: "the unity of realms, the cosmic king",
        rank: "paramount",
      },
      {
        name: "Vishnu",
        wiki: "https://en.wikipedia.org/wiki/Vishnu",
        domain: "preservation, the dharma, the order",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the royal line's divinity, protection",
        rank: "major",
      },
      {
        name: "Brahma",
        wiki: "https://en.wikipedia.org/wiki/Brahma",
        domain: "creation and the world's fabric",
        rank: "major",
        relations: [{ kind: "child-of", of: "Vishnu" }],
      },
      {
        name: "The Buddha",
        wiki: "https://en.wikipedia.org/wiki/Gautama_Buddha",
        domain: "the teaching, merit, the way out",
        rank: "major",
      },
      {
        name: "Mount Semeru",
        wiki: "https://en.wikipedia.org/wiki/Mount_Semeru",
        domain: "the realm's center, the axis",
        rank: "local",
      },
      {
        name: "The rice",
        domain: "irrigation, harvest, the people's life",
        rank: "local",
      },
      {
        name: "The household ancestor",
        domain: "the family's prosperity and line",
        rank: "local",
      },
      {
        name: "The village guardian",
        domain: "boundary and protection",
        rank: "local",
      },
      {
        name: "The sacred springs",
        domain: "purity, healing, the land's blessing",
        rank: "local",
      },
    ],
    practice: [
      "The king is Shiva-Buddha, whose power flows down through courts and temples.",
      "Peasants work the rice terraces with ritual attention to the waters and the season.",
      "Temples combine Hindu carvings and Buddhist teaching; both are the dharma.",
      "The ancestors are fed and honored at household altars; offerings of rice and oil.",
      "A sacred spring at a village's edge is visited for healing and for witness to oaths.",
    ],
    specialist:
      "Court priests for state ritual; Buddhist monks for teaching and merit; village elders for the ancestors.",
    afterlife:
      "The virtuous gain higher rebirth and eventual escape. The king's ancestor soul joins the gods.",
    evidence: {
      status: "documented",
      claim:
        "Majapahit inscriptions, temple reliefs, and Japanese chronicles describe a sophisticated synthesis of Hindu and Buddhist practice under Gajah Mada and the Majapahit kings; the system shows Hindu and Buddhist deities coexisting and serving a unified cosmology.",
      sources: [
        "Hall, A History of Early Southeast Asia",
        "Vickers, Bali: A Paradise Created",
      ],
      limitation:
        "Court inscriptions and temple records are abundant; village practice is known chiefly through Bali's cultural continuity and ethnography. Brahma's birth from Vishnu is a Vaishnava Puranic telling, one strand among several the Majapahit court drew on.",
    },
  },
  {
    id: "se-asia-islamic-java-malay",
    label: "Islamic Java and Malay sultanates",
    scope: { years: [1200, 1900], bounds: [92, -10, 130, 10] },
    wiki: "https://en.wikipedia.org/wiki/Islam_in_Southeast_Asia",
    powers: [
      {
        name: "Allah",
        wiki: "https://en.wikipedia.org/wiki/Allah",
        domain: "the ultimate source, judgment, mercy",
        rank: "paramount",
      },
      {
        name: "The Prophet Muhammad",
        wiki: "https://en.wikipedia.org/wiki/Muhammad",
        domain: "the seal of prophecy, intercession",
        rank: "major",
        relations: [{ kind: "serves", of: "Allah" }],
      },
      {
        name: "The Wali Songo",
        wiki: "https://en.wikipedia.org/wiki/Wali_Sanga",
        domain: "nearness to God, healing, the spread of Islam",
        rank: "major",
        relations: [{ kind: "taught-by", of: "The Prophet Muhammad" }],
      },
      {
        name: "Batara Guru",
        wiki: "https://en.wikipedia.org/wiki/Batara_Guru",
        domain: "the old high god, kingship, the unseen order",
        rank: "major",
      },
      {
        name: "Nyai Roro Kidul",
        wiki: "https://en.wikipedia.org/wiki/Nyai_Roro_Kidul",
        domain:
          "the southern sea, the sultan's spirit consort, danger and power",
        rank: "major",
      },
      {
        name: "Dewi Sri",
        wiki: "https://en.wikipedia.org/wiki/Dewi_Sri",
        domain: "growth and sustenance",
        rank: "local",
      },
      {
        name: "Semar and the punakawan",
        wiki: "https://en.wikipedia.org/wiki/Semar",
        domain: "wisdom, comic wisdom, protection of the ordinary",
        rank: "local",
        relations: [{ kind: "sibling-of", of: "Batara Guru" }],
      },
      {
        name: "The ancestors",
        domain: "blessing and watching over the family",
        rank: "local",
      },
      {
        name: "The earth",
        domain: "burial, rooting, the underworld's witness",
        rank: "local",
      },
    ],
    practice: [
      "Prayer five times daily; the mosque is the community's gathering and direction.",
      "The Wali Songo are honored at their tomb-shrines, visited for blessing and intercession across the island.",
      "Sultans of Yogyakarta and Surakarta renew their pact with Nyai Roro Kidul, queen of the southern sea, each year.",
      "Wayang gives Batara Guru's court its due, but it is Semar and the punakawan, servants wiser than their masters, whom audiences love.",
      "Peasants make offerings to Dewi Sri and the ancestors—nothing in the Quran forbids it.",
    ],
    specialist:
      "The imam for prayer and teaching; the kyai at the pesantren; the dukun for Dewi Sri, Nyai Roro Kidul, and the old spirits beneath Islam.",
    afterlife:
      "The faithful enter paradise; the wicked face punishment. Ancestors may intervene from their rest.",
    evidence: {
      status: "documented",
      claim:
        "Islamic sultanates of Java and the Malay Peninsula from the 1400s onward are recorded in inscriptions and foreign accounts; Javanese literature and ethnography document Batara Guru, Semar, Dewi Sri, and Nyai Roro Kidul persisting alongside Islam, carried by the Wali Songo tradition rather than erased by it.",
      sources: [
        "Reid, Southeast Asia in the Age of Commerce",
        "Ricklefs, Mysticism in Java: Ideology in Indonesia",
      ],
      limitation:
        "Islamic texts and chronicles focus on political and legal Islam; the integration of local practice is best documented from ethnographic and colonial sources. Semar's tie to Batara Guru as his brother Ismaya comes from Javanese wayang cosmology, not a single canonical scripture.",
    },
  },
  {
    id: "se-asia-vietnamese-ancestor",
    label: "Vietnamese ancestor veneration and Mahayana",
    scope: { years: [1000, 1900], bounds: [102, 8, 109, 24] },
    wiki: "https://en.wikipedia.org/wiki/Vietnamese_folk_religion",
    powers: [
      {
        name: "The ancestors",
        domain: "the family line, protection, direction",
        rank: "paramount",
      },
      {
        name: "The Buddha",
        wiki: "https://en.wikipedia.org/wiki/Gautama_Buddha",
        domain: "the refuge, merit, compassion",
        rank: "major",
      },
      {
        name: "Avalokiteshvara",
        wiki: "https://en.wikipedia.org/wiki/Avalokiteshvara",
        domain: "compassion, the refuge of the suffering",
        rank: "major",
        relations: [{ kind: "serves", of: "The Buddha" }],
      },
      {
        name: "Guan Yu",
        wiki: "https://en.wikipedia.org/wiki/Guan_Yu",
        domain: "righteousness, loyalty, virtue",
        rank: "major",
      },
      {
        name: "Thanh Mau",
        wiki: "https://en.wikipedia.org/wiki/%C4%90%E1%BA%A1o_M%E1%BA%ABu",
        domain: "the land, crops, motherhood, the Four Palaces",
        rank: "major",
      },
      {
        name: "Tan Vien",
        wiki: "https://en.wikipedia.org/wiki/T%E1%BA%A3n_Vi%C3%AAn_S%C6%A1n_Th%C3%A1nh",
        domain: "the mountain, flood control, guardian of the realm",
        rank: "major",
      },
      {
        name: "The Jade Emperor",
        wiki: "https://en.wikipedia.org/wiki/Jade_Emperor",
        domain: "cosmic order, the record of souls",
        rank: "local",
      },
      {
        name: "Ong Tao",
        wiki: "https://en.wikipedia.org/wiki/T%C3%A1o_Qu%C3%A2n",
        domain: "the hearth, household deeds, the yearly report to heaven",
        rank: "local",
        relations: [{ kind: "serves", of: "The Jade Emperor" }],
      },
      {
        name: "The rice and water",
        domain: "life and harvest",
        rank: "local",
      },
    ],
    practice: [
      "The ancestors sit on a high altar in the home and are fed daily with rice, incense and prayer.",
      "Buddhist monasteries teach the dharma; lay people gain merit and call on Avalokiteshvara's mercy.",
      "The moon festival gathers families to remember ancestors and welcomes them back to visit the living.",
      "Mediums of the Thanh Mau enter trance to channel the Mother Goddesses and their court of spirits.",
      "Ong Tao, the kitchen god, rides a carp to heaven each New Year to report the household's deeds to the Jade Emperor.",
    ],
    specialist:
      "The household head tends the ancestor altar and the kitchen shrine to Ong Tao; Buddhist monks for teaching and merit; mediums for the Thanh Mau; the village priest for Tan Vien and the tutelary spirits.",
    afterlife:
      "The ancestors watch and bless. The virtuous gain higher rebirth; the suffering are freed by compassion.",
    evidence: {
      status: "documented",
      claim:
        "Vietnamese texts from the 11th century onward record Buddhism and Confucian ancestor rites; ethnographic sources from the French colonial period onward document a synthesis where Mahayana Buddhism, the Thanh Mau spirit-medium cult, Tan Vien and the other tutelary spirits, and household ancestor veneration form one integrated system.",
      sources: [
        "Taylor, The Birth of Vietnam",
        "Hickey, Village in Vietnam",
        "Fjelstad & Nguyen, Possessed by the Spirits",
      ],
      limitation:
        "Classical Vietnamese sources emphasize the Confucian and Buddhist elite perspective; the Thanh Mau cult and village practice are best known from colonial-era and later ethnography.",
    },
  },
  {
    id: "se-asia-upland-animism",
    label: "Upland and forest animism",
    scope: { years: [1, 2000], bounds: [98, 0, 122, 25] },
    wiki: "https://en.wikipedia.org/wiki/Kaharingan",
    powers: [
      {
        name: "The sangiang",
        domain: "lineage, protection, the deified ancestors",
        rank: "paramount",
      },
      {
        name: "*Bri",
        gloss: "Proto-Austroasiatic *briʔ, 'forest'",
        domain: "game, paths, danger, the wild beyond",
        rank: "paramount",
      },
      {
        name: "Mahatala",
        wiki: "https://en.wikipedia.org/wiki/Mahatala",
        domain: "height, the sky, cosmic order, the far view",
        rank: "major",
      },
      {
        name: "Jata",
        domain: "water, the underworld, fertility, travel to the sea",
        rank: "major",
        relations: [{ kind: "consort-of", of: "Mahatala" }],
      },
      {
        name: "The rice",
        domain: "swidden and wet fields, life and work",
        rank: "major",
      },
      {
        name: "Y'wa",
        domain: "creation, moral order, the sky father of the Karen hills",
        rank: "local",
      },
      {
        name: "The house post",
        domain: "the home's threshold and gathering place",
        rank: "local",
      },
      {
        name: "The stone and the old tree",
        domain: "long residence, power, strangeness",
        rank: "local",
      },
      {
        name: "The animal spirits",
        domain: "tiger, boar, python—respect or danger",
        rank: "local",
      },
    ],
    practice: [
      "Before hunting or entering the forest, the sangiang are asked permission and promised a share.",
      "Longhouses carve hornbills for Mahatala and serpents for Jata, keeping sky and underworld in balance.",
      "A stone pile at the clearing's edge warns spirits not to trespass on human ground.",
      "Karen households invoke Y'wa at planting and at illness, alongside the sangiang.",
      "Tattoos and ornaments mark the wearer's clan and their pact with the ancestors.",
    ],
    specialist:
      "The village priest reads animal signs and dreams; the eldest tends the household and the sangiang.",
    evidence: {
      status: "hypothesis",
      claim:
        "Upland Austronesian and Mon-Khmer peoples of the highlands and interior of Southeast Asia maintain animist practices inferred to represent the ancestral substrate beneath later Hindu-Buddhist and Islamic traditions. Mahatala and Jata, the paired sky and underworld deities of the Ngaju Dayak, and Y'wa, the Karen sky father, are two well-documented instances of a much broader upland pattern.",
      sources: [
        "Condominas, We Have Eaten the Forest",
        "Endicott, An Analysis of Malay Magic",
        "Scharer, Ngaju Religion: The Conception of God among a South Borneo People",
        "Sidwell, The Austroasiatic Languages",
      ],
      limitation:
        "Few historical sources exist for upland practice generally; Mahatala, Jata, and Y'wa are drawn from two well-studied groups and stand in here for a pattern that varies in name and detail across dozens of highland peoples. *Bri is a Proto-Austroasiatic word for forest, reconstructed from Mon-Khmer and Munda languages spoken across the mainland uplands generally; it is not a word the Ngaju Dayak (Austronesian speakers) or the Karen (Tibeto-Burman speakers) named here ever used themselves, and stands in for the wider Austroasiatic-speaking upland pattern this system otherwise generalizes from. Mahatala and Jata are paired as upperworld and underworld in Ngaju cosmology; some tellings unite them as a single totality rather than a married couple.",
    },
  },
  {
    id: "se-asia-philippine-anito",
    label: "Philippine anito practice and Catholic syncretism",
    scope: { years: [1000, 1900], bounds: [117, 5, 127, 20] },
    wiki: "https://en.wikipedia.org/wiki/Philippine_mythology",
    powers: [
      {
        name: "Bathala",
        wiki: "https://en.wikipedia.org/wiki/Bathala",
        domain: "the sky, creation, the supreme order",
        rank: "paramount",
      },
      {
        name: "The anitos",
        wiki: "https://en.wikipedia.org/wiki/Anito",
        domain: "spirits of place, ancestors, the sacred",
        rank: "paramount",
      },
      {
        name: "Lakapati",
        domain: "farmland, fertility, the harvest's protector",
        rank: "major",
      },
      {
        name: "Apolaki",
        domain: "the sun, war, valor",
        rank: "major",
        relations: [
          { kind: "child-of", of: "Bathala" },
          { kind: "sibling-of", of: "Mayari" },
        ],
      },
      {
        name: "Mayari",
        wiki: "https://en.wikipedia.org/wiki/Mayari",
        domain: "the moon, night, one-eyed justice",
        rank: "major",
        relations: [
          { kind: "child-of", of: "Bathala" },
          { kind: "sibling-of", of: "Tala" },
        ],
      },
      {
        name: "Maria Makiling",
        wiki: "https://en.wikipedia.org/wiki/Maria_Makiling",
        domain: "the mountain, the forest's game, guardianship of the wild",
        rank: "major",
      },
      {
        name: "Tala",
        domain: "the night sky, guidance for travelers and sailors",
        rank: "local",
        relations: [{ kind: "child-of", of: "Bathala" }],
      },
      {
        name: "The house",
        domain: "safety, family, the hearth",
        rank: "local",
      },
      {
        name: "The barangay guardian",
        domain: "the village's spirit and fate",
        rank: "local",
      },
      {
        name: "The water spirit",
        domain: "river, well, and the crossing",
        rank: "local",
      },
    ],
    practice: [
      "Before planting or fishing, the anitos are called and Lakapati is thanked for the harvest to come.",
      "Babaylan shamans interpret dreams, diagnose spirit sickness, and mediate with Bathala and the anitos.",
      "The dead are buried in the home or in trees, kept close and fed at feasts.",
      "Maria Makiling and other diwata are said to guard particular mountains and springs; travelers leave a small offering before passing.",
      "After Spanish conquest, Catholic saints and Mary take Bathala's and the anitos' places in form while the old names persist in story.",
    ],
    specialist:
      "The babaylan (shaman) for divination, healing and communication with Bathala and the anitos; the household head for ancestor rites; the village elder for the barangay guardian.",
    evidence: {
      status: "documented",
      claim:
        "Early Spanish accounts (16th-17th centuries) describe elaborate anito worship, the diwata class of nature spirits, and named deities including Bathala, Lakapati, Apolaki, and Mayari; later colonial and ethnographic sources document the survival and syncretism of this practice under Catholic veneration.",
      sources: [
        "Phelan, The Hispanization of the Philippines",
        "Jocano, Folk Christianity and Ethnic Identity in the Philippines",
        "Scott, Barangay: Sixteenth-Century Philippine Culture and Society",
      ],
      limitation:
        "Spanish friars' accounts are hostile and sparse, and the pantheon they record varies by region and chronicler; the fullest picture comes from 19th-century ethnography and modern practice. The sibling genealogy uniting Apolaki, Mayari, and Tala as Bathala's children follows a specific compiled Tagalog telling, not one attested uniformly across every colonial or regional source.",
    },
  },
  {
    id: "se-asia-sulawesi-moluccas-islam",
    label: "Islamic sultanates in Sulawesi and the Moluccas",
    scope: { years: [1200, 1900], bounds: [110, -11, 145, 5] },
    wiki: "https://en.wikipedia.org/wiki/Islam_in_Indonesia",
    powers: [
      {
        name: "Allah",
        wiki: "https://en.wikipedia.org/wiki/Allah",
        domain: "the ultimate, judgment, mercy",
        rank: "paramount",
      },
      {
        name: "The Prophet Muhammad",
        wiki: "https://en.wikipedia.org/wiki/Muhammad",
        domain: "the seal of prophecy, intercession",
        rank: "major",
        relations: [{ kind: "serves", of: "Allah" }],
      },
      {
        name: "Patotoqe",
        domain: "fate, the order set before creation, the high god above",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "blessing the family, watching the land",
        rank: "major",
      },
      {
        name: "The rice",
        domain: "wet fields and swidden, sustenance",
        rank: "major",
      },
      {
        name: "The sea and its spirits",
        domain: "fish, trade, the horizon",
        rank: "major",
      },
      {
        name: "We Nyiliq Timoq",
        domain:
          "royal ancestry, the descent from the sky, founding of dynasties",
        rank: "local",
        relations: [{ kind: "child-of", of: "Patotoqe" }],
      },
      {
        name: "The house guardian",
        domain: "the home's safety, family prosperity",
        rank: "local",
      },
      {
        name: "Nunusaku",
        domain: "the ancestral tree, the origin of clans, the land's memory",
        rank: "local",
      },
      {
        name: "The saints",
        domain: "healing, protection, nearness to God",
        rank: "local",
        relations: [{ kind: "serves", of: "Allah" }],
      },
    ],
    practice: [
      "Prayer five times daily; the mosque is the island's gathering place.",
      "The sultan rules by Islamic law and by the older order Patotoqe is said to have fixed before the world began.",
      "Bugis genealogies trace royal houses back to We Nyiliq Timoq, said to have descended from the upper world.",
      "Traders and sailors make offerings to the sea spirits before voyage.",
      "Clans across the Moluccas trace their origin to Nunusaku, the ancestral tree, and gather at its remembered site.",
    ],
    specialist:
      "The imam and qadi for Islamic law and prayer; Bugis genealogists and elders for Patotoqe's order and the royal descent; healers for the local spirits.",
    afterlife:
      "The faithful enter paradise. The ancestors may intercede. The order Patotoqe set still shapes fate.",
    evidence: {
      status: "documented",
      claim:
        "Islamic sultanates of Ternate, Tidore, Banjarmasin and others ruled Sulawesi and the Moluccas from the 1400s onward, recorded in Portuguese, Dutch and local chronicles. Bugis cosmology—Patotoqe and the descent of We Nyiliq Timoq, preserved in the La Galigo cycle—and the Nunusaku origin-tree tradition of Central Maluku are documented as coexisting with Islamic practice in daily and dynastic life.",
      sources: [
        "Reid, Southeast Asia in the Age of Commerce",
        "Andaya, The World of Maluku",
        "Pelras, The Bugis",
      ],
      limitation:
        "Court and trade records focus on sultanates and spice commerce; the Bugis and Moluccan material is best attested from the oral epic and clan tradition, best recorded in the modern period though claiming much older roots. We Nyiliq Timoq's descent as Patotoqe's ordained act is one reading of the La Galigo cycle's account of the first rulers' arrival from the upper world.",
    },
  },
  {
    id: "se-asia-colonial-modernization",
    label: "Colonial and postcolonial modernization",
    scope: { years: [1850, 2000], bounds: [92, -11, 142, 25] },
    wiki: "https://en.wikipedia.org/wiki/History_of_Southeast_Asia",
    powers: [
      {
        name: "The nation",
        domain: "unity, progress, the modern state",
        rank: "paramount",
      },
      {
        name: "Ho Chi Minh",
        wiki: "https://en.wikipedia.org/wiki/Ho_Chi_Minh",
        domain: "revolutionary founding, moral example, the people's father",
        rank: "major",
        relations: [{ kind: "serves", of: "The nation" }],
      },
      {
        name: "The great tradition",
        domain: "Buddhism, Islam, Christianity—the received faith",
        rank: "major",
      },
      {
        name: "The land",
        domain: "home, belonging, national identity",
        rank: "major",
      },
      {
        name: "Education and knowledge",
        domain: "schooling, books, the modern path",
        rank: "major",
      },
      {
        name: "Jose Rizal",
        wiki: "https://en.wikipedia.org/wiki/Jos%C3%A9_Rizal",
        domain: "martyrdom, the Filipino awakening, folk sainthood",
        rank: "local",
        relations: [{ kind: "serves", of: "The nation" }],
      },
      {
        name: "The market",
        domain: "commerce, labor, the cash economy",
        rank: "local",
      },
      {
        name: "The city",
        domain: "opportunity, corruption, strangeness",
        rank: "local",
      },
      {
        name: "Local custom",
        domain: "the village way, ritual, kinship",
        rank: "local",
      },
    ],
    practice: [
      "Colonial rulers and later national governments shape law and public order.",
      "Traditional religion persists in family and household; public observance follows the state's chosen faith.",
      "In parts of the Philippines, folk movements venerate Jose Rizal as a martyred saint alongside the old religion.",
      "In Vietnam, some households keep a photograph of Ho Chi Minh on the ancestor altar, folded into ancestor veneration rather than replacing it.",
      "Young people seek education in cities; return changed, causing family tension.",
    ],
    specialist:
      "Administrators and teachers for the nation; priests and monks for the tradition; elders for custom.",
    afterlife:
      "Progress and citizenship promise a better life. Ancestors are honored but no longer rule.",
    evidence: {
      status: "documented",
      claim:
        "Colonial rule in Southeast Asia from 1850 onward (Dutch East Indies, French Indochina, British Burma, etc.) introduced state bureaucracy, schooling, and market integration; independence and modernization continued these trends. Religious traditions persisted but were reshaped by nationalism, and in some cases produced genuinely quasi-religious veneration of founding figures, as with Jose Rizal in Rizalista folk movements and household veneration of Ho Chi Minh in Vietnam.",
      sources: [
        "Reid, A History of Southeast Asia",
        "Adas, The Burma Delta",
        "Ileto, Pasyon and Revolution: Popular Movements in the Philippines, 1840-1910",
      ],
      limitation:
        "Colonial and nationalist narratives dominate; most powers listed here are structural forces without personal names by nature, and named figures like Rizal and Ho Chi Minh are documented exceptions rather than the rule.",
    },
  },
];
