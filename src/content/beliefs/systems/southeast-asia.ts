import type { BeliefSystem } from "../types";

/** Southeast Asian belief systems across the major traditions and regions.
 * From early animism through Hindu-Buddhist syncretism to Islam and Catholicism,
 * showing local spirits persisting beneath and within each great tradition. */
export const southeastAsia: readonly BeliefSystem[] = [
  {
    id: "se-asia-early-foragers",
    label: "Early forager and hunter communities",
    scope: { years: [-8000, -2000], bounds: [92, -11, 142, 25] },
    powers: [
      {
        name: "The ancestors",
        domain: "lineage, protection, the family path",
        rank: "paramount",
      },
      {
        name: "The forest",
        domain: "game, paths, abundance, danger",
        rank: "paramount",
      },
      {
        name: "The water",
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
      ],
      limitation:
        "No direct sources; inferred from material remains and continuities in later upland practice.",
    },
  },
  {
    id: "se-asia-austronesian-animism",
    label: "Austronesian ancestor and spirit practice",
    scope: { years: [-2000, 800], bounds: [92, -11, 142, 25] },
    powers: [
      {
        name: "The ancestors",
        domain: "the family line, protection, direction",
        rank: "paramount",
      },
      { name: "The rice", domain: "growth, harvest, plenty", rank: "major" },
      {
        name: "The house post",
        domain: "the household threshold and its safety",
        rank: "major",
      },
      {
        name: "The water",
        domain: "rivers, crossings, the sea's far shore",
        rank: "major",
      },
      {
        name: "The forest",
        domain: "game, paths, the edge of settled land",
        rank: "local",
      },
      {
        name: "The hearth",
        domain: "warmth, gathering, shared food",
        rank: "local",
      },
      {
        name: "The village guardian",
        domain: "boundary and watch",
        rank: "local",
      },
      {
        name: "The ground",
        domain: "burial and staying put",
        rank: "local",
      },
    ],
    practice: [
      "Rice and palm wine set out at planting and harvest for the ancestors and the rice.",
      "A post carved with faces marks the entrance to the house and the cleared land.",
      "Dead are laid in the ground or in trees, kept provisioned so they do not wander.",
      "Crocodile and python are not hunted on certain days—they are watchers for other people.",
    ],
    specialist: "The eldest, the one who remembers the names.",
    evidence: {
      status: "inferred",
      claim:
        "Austronesian-language communities across maritime Southeast Asia shared an ancestor-venerating, animate-spirits practice before Hindu or Islamic arrival, evidenced by persistent patterns in later folk practice and early colonial accounts.",
      sources: ["Fox, The Austronesian Link", "Howe, 'Malay-Muslim Animism'"],
      limitation:
        "No surviving texts; reconstruction from ethnographic continuities and regional borrowing patterns.",
    },
  },
  {
    id: "se-asia-early-hindu-buddhism",
    label: "Early Hindu-Buddhist kingdoms and villages",
    scope: { years: [-500, 1000], bounds: [92, -10, 145, 24] },
    powers: [
      {
        name: "The ancestors",
        domain: "lineage, protection, the family and village",
        rank: "paramount",
      },
      {
        name: "Shiva",
        domain: "cycles, the mountain, transformation",
        rank: "major",
      },
      {
        name: "Vishnu",
        domain: "order, preservation, cosmic balance",
        rank: "major",
      },
      {
        name: "The Buddha",
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
        name: "Local spirits",
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
      "Villagers tend rice and the local spirits as their ancestors did.",
      "Monks and Brahmins conduct state ritual; farmers and merchants live by older rhythms.",
    ],
    specialist:
      "Court priests for state rites; monks for teaching; village elders for the ancestors.",
    evidence: {
      status: "documented",
      claim:
        "Hindu-Buddhist architecture, inscriptions, and art appear across Southeast Asia from the early centuries, while ethnographic and folk accounts show local spirits and ancestor practice persisting beneath and within the great traditions.",
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
    powers: [
      {
        name: "Vishnu",
        domain: "order, kingship, preservation",
        rank: "paramount",
      },
      {
        name: "Shiva",
        domain: "cycles, dissolution, the mountain",
        rank: "paramount",
      },
      {
        name: "The Buddha",
        domain: "awakening, the refuge, the path",
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
        name: "Local spirits",
        domain: "the land's own guardians",
        rank: "local",
      },
    ],
    practice: [
      "Great temples to Vishnu and Shiva are built on river bends and hilltops; the king is the god's proxy.",
      "Monks and court Brahmins read Sanskrit and make offerings, the villagers the spirits as always.",
      "Statuary mixes Vishnu and Buddha, Shiva and local features of stone and water.",
      "The flood season is seen as Vishnu's gift; harvest follows the old calendar and the new.",
    ],
    specialist:
      "Court Brahmins for the state gods; village elders for the local spirits below.",
    evidence: {
      status: "documented",
      claim:
        "Funan and Champa inscriptions record major Hindu temples and Buddha statues from the 1st-7th centuries, while later folktales and ethnography show local spirit worship persisting in lowland practice.",
      sources: [
        "Vickery, The Khmer Empire and the Early Cham Polity",
        "Pottier, 'Funan and the Mekong Delta'",
      ],
      limitation:
        "Court inscriptions dominate; the reality of village practice is inferred from later periods.",
    },
  },
  {
    id: "se-asia-angkorian-devaraja",
    label: "Khmer Angkorian devaraja cult",
    scope: { years: [790, 1431], bounds: [102, 10, 106, 15] },
    powers: [
      {
        name: "Shiva",
        domain: "the god-king, the axis of the realm",
        rank: "paramount",
      },
      {
        name: "Vishnu",
        domain: "sustenance, the cosmic order",
        rank: "major",
      },
      {
        name: "Brahma",
        domain: "creation, the world-maker",
        rank: "major",
      },
      {
        name: "The Buddha",
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
        "Court and temple texts describe official practice; village faith inferred from archaeology and colonial accounts.",
    },
  },
  {
    id: "se-asia-theravada-burma",
    label: "Theravada Burma with nat worship",
    scope: { years: [1050, 1885], bounds: [92, 9, 102, 29] },
    powers: [
      {
        name: "The Buddha",
        domain: "the path to nirvana, the refuge",
        rank: "paramount",
      },
      {
        name: "The 37 nats",
        domain: "the spirits of earth, air, ancestors, the wild",
        rank: "paramount",
      },
      {
        name: "The Earth goddess",
        domain: "witness to deeds, the realm beneath",
        rank: "major",
      },
      {
        name: "Indra",
        domain: "rain, the season, kingship",
        rank: "major",
      },
      {
        name: "The local nat",
        domain: "the village's own guardian spirit",
        rank: "major",
      },
      {
        name: "The river nats",
        domain: "water, crossing, the path abroad",
        rank: "local",
      },
      {
        name: "The household post",
        domain: "the home's protection and threshold",
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
      "Monasteries are the heart of village life; lay people give rice and cloth to gain merit, then approach the nats for the daily fix.",
      "Nat worship happens at household shrines and at the spirit's own shrine tree or stone.",
      "A person possessed by a nat may speak as the nat; possession is courted for prophecy and healing.",
      "Water poured on a statue of Buddha becomes merit; water poured on a spirit shrine becomes propitiation.",
      "Elephant and python are nats' kin; harming them invites their vengeance.",
    ],
    specialist:
      "Monks for the dharma and merit; spirit mediums for possession and communication; the household elder for the ancestors.",
    afterlife:
      "Rebirth until merit brings cessation. Nats cycle through suffering and power without escape.",
    evidence: {
      status: "documented",
      claim:
        "Burmese chronicles and inscriptions from the Pagan period onward record Buddhist monasteries; ethnographic accounts since the 1800s consistently document nat worship as coeval and inseparable from Buddhism in village practice.",
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
    powers: [
      {
        name: "The Buddha",
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
        domain: "the sky, rain, the king's cosmic place",
        rank: "major",
      },
      {
        name: "Brahma and the Four Faces",
        domain: "the city guardian, creation",
        rank: "major",
      },
      {
        name: "The village phi",
        domain: "the community's own spirit guardian",
        rank: "major",
      },
      {
        name: "The house post spirit",
        domain: "the home's life and safety",
        rank: "local",
      },
      {
        name: "The rice",
        domain: "growth, the planter's hope",
        rank: "local",
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
      "Villages maintain wats as centers of merit-making; young men spend rains as monks to gain blessing.",
      "A household spirit house receives fruit and rice; offerings made by women after evening.",
      "The phi may sicken a family if not respected; a shaman detects which phi has taken offense.",
      "Brahmins from the city maintain the Erawan shrine and the city guardian; the village headman makes offerings at the village post.",
    ],
    specialist:
      "Monks for merit and teaching; the khru (spirit master) for divination and possession; the household elder for daily offerings.",
    afterlife:
      "Merit brings higher rebirth. The phi persist endlessly, cycling through favor and anger.",
    evidence: {
      status: "documented",
      claim:
        "Thai and Lao chronicles record Buddhist kingdoms from Sukhothai onward; ethnography and temple records from the 1800s onward consistently describe phi worship as essential village practice alongside Buddhism.",
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
    powers: [
      {
        name: "Shiva-Buddha",
        domain: "the unity of realms, the cosmic king",
        rank: "paramount",
      },
      {
        name: "Vishnu",
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
        domain: "creation and the world's fabric",
        rank: "major",
      },
      {
        name: "The Buddha",
        domain: "the teaching, merit, the way out",
        rank: "major",
      },
      {
        name: "Mount Semeru",
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
        "Court inscriptions and temple records are abundant; village practice is known chiefly through Bali's cultural continuity and ethnography.",
    },
  },
  {
    id: "se-asia-islamic-java-malay",
    label: "Islamic Java and Malay sultanates",
    scope: { years: [1200, 1900], bounds: [92, -10, 130, 10] },
    powers: [
      {
        name: "Allah",
        domain: "the ultimate source, judgment, mercy",
        rank: "paramount",
      },
      {
        name: "The Prophet Muhammad",
        domain: "the seal of prophecy, intercession",
        rank: "major",
      },
      {
        name: "The saints",
        domain: "nearness to God, healing, protection",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "blessing and watching over the family",
        rank: "major",
      },
      {
        name: "The rice",
        domain: "growth and sustenance",
        rank: "local",
      },
      {
        name: "The house spirit",
        domain: "the home's safety and abundance",
        rank: "local",
      },
      {
        name: "The water guardian",
        domain: "river and well, the crossing",
        rank: "local",
      },
      {
        name: "The earth",
        domain: "burial, rooting, the underworld's witness",
        rank: "local",
      },
      {
        name: "Local spirits",
        domain: "village guardians, the land's own voice",
        rank: "local",
      },
    ],
    practice: [
      "Prayer five times daily; the mosque is the community's gathering and direction.",
      "Saints' shrines—some ancient—are visited for blessing and healing; graves of the pious draw pilgrims.",
      "The Quran is recited at birth and death; Quranic verses worn as amulet.",
      "Peasants make offerings to ancestors and to the rice field's spirit—nothing in the Quran forbids it.",
      "Weddings and harvests follow Islamic calendar and old custom woven together.",
    ],
    specialist:
      "The imam for Islamic prayer and teaching; the mosque leader for community issues; the village elder for ancestral rites; the dukun (healer) for the spirits.",
    afterlife:
      "The faithful enter paradise; the wicked face punishment. Ancestors may intervene from their rest.",
    evidence: {
      status: "documented",
      claim:
        "Islamic sultanates of Java and the Malay Peninsula from the 1400s onward are recorded in inscriptions and foreign accounts; ethnography from the colonial period documents Islamic practice layered over and coexisting with ancestor and spirit veneration, not replacing it.",
      sources: [
        "Reid, Southeast Asia in the Age of Commerce",
        "Ricklefs, Mysticism in Java: Ideology in Indonesia",
      ],
      limitation:
        "Islamic texts and chronicles focus on political and legal Islam; the integration of local practice is best documented from ethnographic and colonial sources.",
    },
  },
  {
    id: "se-asia-vietnamese-ancestor",
    label: "Vietnamese ancestor veneration and Mahayana",
    scope: { years: [1000, 1900], bounds: [102, 8, 109, 24] },
    powers: [
      {
        name: "The ancestors",
        domain: "the family line, protection, direction",
        rank: "paramount",
      },
      {
        name: "The Buddha",
        domain: "the refuge, merit, compassion",
        rank: "major",
      },
      {
        name: "Avalokiteshvara",
        domain: "compassion, the refuge of the suffering",
        rank: "major",
      },
      {
        name: "Guan Yu",
        domain: "righteousness, loyalty, virtue",
        rank: "major",
      },
      {
        name: "The Earth goddess",
        domain: "the land, crops, stability",
        rank: "major",
      },
      {
        name: "The Jade Emperor",
        domain: "cosmic order, the record of souls",
        rank: "local",
      },
      {
        name: "The tutelary god of the village",
        domain: "guardian and fate of the community",
        rank: "local",
      },
      {
        name: "The household altar",
        domain: "the family's center, daily nourishment",
        rank: "local",
      },
      {
        name: "The rice and water",
        domain: "life and harvest",
        rank: "local",
      },
    ],
    practice: [
      "The ancestors sit on a high altar in the home and are fed daily with rice, incense and prayer.",
      "Buddhist monasteries teach the dharma; lay people gain merit by supporting monks.",
      "The moon festivals gather families to remember ancestors and ancestors to visit the living.",
      "The village temple holds statues of Guan Yu, local sages, and minor deities of craft and protection.",
      "A person's soul at death must be guided carefully by rite and feeding lest it wander or return to trouble the living.",
    ],
    specialist:
      "The household head tends the ancestor altar; Buddhist monks for teaching and merit; the village priest for the tutelary and the rites of the dead.",
    afterlife:
      "The ancestors watch and bless. The virtuous gain higher rebirth; the suffering are freed by compassion.",
    evidence: {
      status: "documented",
      claim:
        "Vietnamese texts from the 11th century onward record Buddhism and Confucian ancestor rites; ethnographic sources from the French colonial period document a sophisticated synthesis where Mahayana Buddhism and ancestor veneration form one integrated system, the spirits of the Buddhist pantheon understood as distant, the ancestors as near and daily.",
      sources: [
        "Taylor, The Birth of Vietnam",
        "Hickey, Village in Vietnam",
        "Kwanten, The Buddhistic Conquest of China",
      ],
      limitation:
        "Classical Vietnamese sources emphasize the Confucian and Buddhist elite perspective; village practice is best known from colonial-era ethnography.",
    },
  },
  {
    id: "se-asia-upland-animism",
    label: "Upland and forest animism",
    scope: { years: [1, 2000], bounds: [98, 0, 122, 25] },
    powers: [
      {
        name: "The ancestors",
        domain: "the family line, health and fortune",
        rank: "paramount",
      },
      {
        name: "The forest",
        domain: "game, paths, danger, the wild beyond",
        rank: "paramount",
      },
      {
        name: "The mountain",
        domain: "height, the sky, the far view",
        rank: "major",
      },
      {
        name: "The river",
        domain: "water, travel, the direction to the sea",
        rank: "major",
      },
      {
        name: "The rice",
        domain: "swidden and wet fields, life and work",
        rank: "major",
      },
      {
        name: "The village guardian",
        domain: "boundary and protection from the wild",
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
      "Before hunting or entering the forest, the ancestors are asked permission and promised a share.",
      "A stone pile at the clearing's edge warns spirits not to trespass on human ground.",
      "Rice given to the fields in spring and gathered in autumn with ritual attention.",
      "A death in the village requires propitiation of any forest spirits who may have taken offense.",
      "Tattoos and ornaments mark the wearer's clan and their pact with the ancestors.",
    ],
    specialist:
      "The village priest reads animal signs and dreams; the eldest tends the household and the ancestors.",
    evidence: {
      status: "inferred",
      claim:
        "Upland Austronesian and Mon-Khmer peoples of the highlands and interior of Southeast Asia maintain animist practices that appear unchanged in ethnographic records and are inferred from lowland folktales to represent the ancestral substrate beneath later Hindu-Buddhist and Islamic traditions.",
      sources: [
        "Condominas, We Have Eaten the Forest",
        "Endicott, An Analysis of Malay Magic",
      ],
      limitation:
        "Few historical sources exist for upland practice; the picture comes from modern ethnography and inferences from lowland persistence of similar elements.",
    },
  },
  {
    id: "se-asia-philippine-anito",
    label: "Philippine anito practice and Catholic syncretism",
    scope: { years: [1000, 1900], bounds: [117, 5, 127, 20] },
    powers: [
      {
        name: "The anitos",
        domain: "spirits of place, ancestors, the sacred",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "the family line, guidance and blessing",
        rank: "paramount",
      },
      {
        name: "The rice",
        domain: "growth, harvest, the people's food",
        rank: "major",
      },
      {
        name: "The sea",
        domain: "fish, travel, commerce, danger",
        rank: "major",
      },
      {
        name: "The mountain and forest",
        domain: "game, height, the boundary",
        rank: "major",
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
      "Before planting or fishing, the anitos are called and offered rice wine and meat.",
      "Shamans (babaylan) interpret dreams and diagnose spirit sickness.",
      "The ancestors are buried in the home or in trees, kept close and fed at feasts.",
      "Certain trees, stones, and springs house anitos; they are marked and respected, not disturbed.",
      "After Spanish conquest, Catholic saints and Mary take the anitos' places in form while the spirits persist in practice.",
    ],
    specialist:
      "The babaylan (shaman) for divination, healing and communication; the household head for ancestor rites; the village elder for the barangay.",
    evidence: {
      status: "documented",
      claim:
        "Early Spanish accounts (16th-17th centuries) describe elaborate anito worship and shamanic practice; later colonial and ethnographic sources document the survival and syncretism of anito practice under Catholic veneration, showing the anitos encoded as saints.",
      sources: [
        "Phelan, The Hispanization of the Philippines",
        "Jocano, Folk Christianity and Ethnic Identity in the Philippines",
      ],
      limitation:
        "Spanish friars' accounts are hostile and sparse; the fullest picture comes from 19th-century ethnography and modern practice.",
    },
  },
  {
    id: "se-asia-sulawesi-moluccas-islam",
    label: "Islamic sultanates in Sulawesi and the Moluccas",
    scope: { years: [1200, 1900], bounds: [110, -11, 145, 5] },
    powers: [
      {
        name: "Allah",
        domain: "the ultimate, judgment, mercy",
        rank: "paramount",
      },
      {
        name: "The Prophet Muhammad",
        domain: "the seal of prophecy, intercession",
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
        name: "The house guardian",
        domain: "the home's safety, family prosperity",
        rank: "local",
      },
      {
        name: "The island's spirit",
        domain: "the land itself, its boundaries and gifts",
        rank: "local",
      },
      {
        name: "The water spirits",
        domain: "springs, wells, the crossing",
        rank: "local",
      },
      {
        name: "The saints",
        domain: "healing, protection, nearness to God",
        rank: "local",
      },
    ],
    practice: [
      "Prayer five times daily; the mosque is the island's gathering place.",
      "The sultan rules by Islamic law and custom woven together.",
      "Ancestors are honored at family altars alongside Islamic practice.",
      "Traders and sailors make offerings to the sea spirits before voyage.",
      "Saints' tombs are visited for blessing; the pious seek their intercession.",
    ],
    specialist:
      "The imam and qadi for Islamic law and prayer; the village headman for kin and land; healers for the spirits.",
    afterlife:
      "The faithful enter paradise. The ancestors may intercede. Spirits persist in the land.",
    evidence: {
      status: "documented",
      claim:
        "Islamic sultanates of Ternate, Tidore, Banjarmasin and others ruled Sulawesi and the Moluccas from the 1400s onward, recorded in Portuguese, Dutch and local chronicles; ethnography documents Islamic practice coexisting with ancestor and spirit veneration in village daily life.",
      sources: [
        "Reid, Southeast Asia in the Age of Commerce",
        "Andaya, The World of Maluku",
      ],
      limitation:
        "Court and trade records focus on sultanates and spice commerce; village practice is known chiefly from colonial and ethnographic sources.",
    },
  },
  {
    id: "se-asia-colonial-modernization",
    label: "Colonial and postcolonial modernization",
    scope: { years: [1850, 2000], bounds: [92, -11, 142, 25] },
    powers: [
      {
        name: "The nation",
        domain: "unity, progress, the modern state",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "family honor, tradition, the past",
        rank: "major",
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
      "Traditional religion persists in family and household; public observance of state faith.",
      "Young people seek education in cities; return changed, causing family tension.",
      "Farmers and villagers adopt cash crops, modern tools, new obligations.",
      "Nationalism and ethnic identity compete with older religious and kinship loyalties.",
    ],
    specialist:
      "Administrators and teachers for the nation; priests and monks for the tradition; elders for custom.",
    afterlife:
      "Progress and citizenship promise a better life. Ancestors are honored but no longer rule.",
    evidence: {
      status: "documented",
      claim:
        "Colonial rule in Southeast Asia from 1850 onward (Dutch East Indies, French Indochina, British Burma, etc.) introduced state bureaucracy, schooling, and market integration; independence and modernization continued these trends. Religious traditions persisted but were reshaped by nationalism and capitalist integration, as documented in colonial reports, nationalist literature, and modern ethnography.",
      sources: [
        "Reid, A History of Southeast Asia",
        "Adas, The Burma Delta",
        "Stoler, Capitalism and Confrontation in Sumatra's Plantation Belt",
      ],
      limitation:
        "Colonial and nationalist narratives dominate; lived experience of rural and urban people is patchily documented.",
    },
  },
];
