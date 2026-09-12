import type { BeliefSystem } from "../types";

export const eastAsia: readonly BeliefSystem[] = [
  {
    id: "neolithic-east-asia-foragers",
    label: "Neolithic East Asia foraging and early settlement",
    wiki: "https://en.wikipedia.org/wiki/Chinese_Neolithic",
    scope: { years: [-8000, -1600], bounds: [90, 15, 150, 55] },
    powers: [
      {
        name: "*Pwa",
        gloss: "Proto-Sino-Tibetan *pwa, 'grandfather, ancestor'",
        domain: "household, clan, continuity",
        rank: "paramount",
      },
      {
        name: "*Nəy",
        gloss: "Proto-Sino-Tibetan *nəy, 'sun, day'",
        domain: "the sun, daylight, the turning day",
        rank: "major",
      },
      {
        name: "The river",
        domain: "fish, water, travel",
        rank: "major",
      },
      {
        name: "The forest",
        domain: "game, herbs, medicine",
        rank: "major",
      },
      {
        name: "The mountain",
        domain: "stones, springs, danger",
        rank: "major",
      },
      {
        name: "*Mey",
        gloss: "Proto-Sino-Tibetan *mey, 'fire'",
        domain: "warmth, cooking, gathering place",
        rank: "local",
      },
      {
        name: "The seashore",
        domain: "shells, fish, salt",
        rank: "local",
      },
      {
        name: "*Hnit",
        gloss: "Proto-Sino-Tibetan *hnit, 'year'",
        domain: "seasons, the turning year, time",
        rank: "local",
      },
    ],
    practice: [
      "Bones of the hunted are left on the hearth for the animal spirits.",
      "The dead are buried with shells, flint, and ochre for the journey.",
      "Offerings of grain and game are made at the season turns.",
      "The first salmon of the season is shared and honoured.",
    ],
    specialist: "The eldest or a skilled hunter who speaks for the ancestors.",
    afterlife:
      "The dead enter the ancestors who protect the living and the hunting grounds.",
    evidence: {
      status: "hypothesis",
      claim:
        "Neolithic settlement across East Asia shows continuity of ancestral veneration in burial practice, hearth-centered daily life, and seasonal gathering; the powers are inferred from the central resources of foraging and early agricultural societies.",
      sources: [
        "Perlès, An Introduction to the Prehistory of East Asia",
        "Aikens & Higuchi, Prehistory of Japan",
        "Matisoff, Handbook of Proto-Tibeto-Burman",
      ],
      limitation:
        "No written records; reconstruction is inferred from archaeological settlement patterns, burial goods, and the historical practices of successor societies. This spans eight millennia and enormous geographical variation. The starred names are Proto-Sino-Tibetan words for grandfather, sun, fire and year, reconstructed by comparing Chinese, Tibetan, Burmese and their relatives, not recorded theonyms; the reconstructed language itself is usually placed well after this span begins, so its vocabulary is at best a guess about what these foragers' eventual descendants would come to say.",
    },
  },
  {
    id: "early-bronze-farming-era",
    label: "Early Bronze Age farming societies",
    wiki: "https://en.wikipedia.org/wiki/Chinese_Bronze_Age",
    scope: { years: [-1600, -800], bounds: [95, 20, 145, 50] },
    powers: [
      {
        name: "The ancestors",
        domain: "household prosperity, harvest blessing",
        rank: "paramount",
      },
      {
        name: "The sky",
        domain: "rain, thunder, cosmic order",
        rank: "major",
      },
      {
        name: "The earth",
        domain: "fields, crops, fertility",
        rank: "major",
      },
      {
        name: "Rivers and springs",
        domain: "water, irrigation, fish",
        rank: "major",
      },
      {
        name: "The hearth and household",
        domain: "daily food and protection",
        rank: "local",
      },
      {
        name: "Field boundaries",
        domain: "crop protection, neighbours",
        rank: "local",
      },
      {
        name: "Village guardian",
        domain: "communal well-being",
        rank: "local",
      },
    ],
    practice: [
      "Grain is left at field edges at planting and harvest for the earth and ancestors.",
      "Fire is kindled at the hearth and kept alive; the first meal honours the fire.",
      "Spring water and rainfall are marked with offerings and observation.",
      "The dead are honoured with wine and meat in the household.",
    ],
    specialist:
      "The household head and the village elder; shamans for major concerns.",
    afterlife:
      "Ancestors dwell near the household and fields, blessing or withholding the harvest.",
    evidence: {
      status: "hypothesis",
      claim:
        "Bronze Age settlements from the Shang to early Zhou show household hearths, granaries, oracle practice, and ancestral veneration; the system reflects the shift from foraging to intensive farming, the emergence of hierarchy, and the continuity of ancestor-centred practice.",
      sources: [
        "Underhill, Early Complex Societies in Northeast China",
        "Chang, The Archaeology of Ancient China",
      ],
      limitation:
        "Written records are minimal; practice is inferred from settlement archaeology, oracle bones, and the documented systems that follow.",
    },
  },
  {
    id: "shang-oracle",
    label: "Shang oracle bone practice",
    wiki: "https://en.wikipedia.org/wiki/Oracle_bone",
    scope: { years: [-1600, -1046], bounds: [100, 25, 130, 48] },
    powers: [
      {
        name: "Di",
        wiki: "https://en.wikipedia.org/wiki/Shangdi",
        domain: "supreme power, harvests",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "household and clan, intercession",
        rank: "major",
      },
      { name: "Rivers and springs", domain: "water, fertility", rank: "major" },
      {
        name: "The royal ancestors",
        domain: "kingship, war",
        rank: "major",
        relations: [{ kind: "serves", of: "Di" }],
      },
      { name: "Wind and thunder", domain: "weather, fortune", rank: "local" },
      {
        name: "The household niche",
        domain: "daily blessing, food",
        rank: "local",
      },
      { name: "Field boundaries", domain: "harvest protection", rank: "local" },
    ],
    practice: [
      "Ox scapulae and turtle shells are cracked in fire to divine Di's will.",
      "Ancestors receive wine and meat at the hearth before meals.",
      "Grain is left at field edges at sowing and harvest.",
      "The shaman reads the cracks to know when to plant and when to take the field.",
    ],
    specialist: "Shaman and bone-reader; the household head at the hearth.",
    afterlife:
      "The ancestors enter the niche-shrine and can affect weather, harvest, and war.",
    evidence: {
      status: "documented",
      claim:
        "Oracle bone inscriptions record divinations of Di, ancestors, and weather spirits; archaeological household shrines contain scapula caches and show ancestor veneration.",
      sources: [
        "Keightley, 'The Religious Commitment'",
        "Chang, The Archaeology of Ancient China",
        "Schwartz, The World of Thought in Ancient China",
      ],
      limitation:
        "Oracle records reflect elite concerns more than village practice; the names and ranks of local spirits are inferred from archaeological context.",
    },
  },
  {
    id: "zhou-heaven-rites",
    label: "Early Zhou Heaven and ancestral rites",
    wiki: "https://en.wikipedia.org/wiki/Tian",
    scope: { years: [-1046, -500], bounds: [100, 25, 135, 48] },
    powers: [
      {
        name: "Tian",
        wiki: "https://en.wikipedia.org/wiki/Tian",
        domain: "Heaven, the mandate, cosmic order",
        rank: "paramount",
      },
      {
        name: "The royal ancestors",
        domain: "kingship, approval of rule",
        rank: "major",
        relations: [{ kind: "serves", of: "Tian" }],
      },
      { name: "Earth", domain: "harvest, stability", rank: "major" },
      {
        name: "The household ancestors",
        domain: "family protection, prosperity",
        rank: "major",
      },
      {
        name: "The local earth god",
        domain: "village fields, boundaries",
        rank: "local",
      },
      { name: "Rivers and mountains", domain: "power, danger", rank: "local" },
      {
        name: "Household spirits",
        domain: "door, hearth, well",
        rank: "local",
      },
    ],
    practice: [
      "The king alone offers at the altar of Heaven; lords offer at their family shrines.",
      "Ancestors are approached with wine and grain in the order of generation.",
      "Fields receive offerings at the four seasons; the farmer speaks to the earth.",
      "A household shrine holds wooden tablets of the household dead.",
    ],
    specialist:
      "The ritual master for royal rites; the family head at the household shrine.",
    afterlife:
      "The ancestors dwell in the shrine and hold power over family fortune and the harvests.",
    evidence: {
      status: "documented",
      claim:
        "Bronze vessel inscriptions record royal sacrifices to Heaven and ancestors; the Rites of Zhou codify the hierarchies of terrestrial offerings.",
      sources: [
        "Schwartz, The World of Thought in Ancient China",
        "Loewe, The Cambridge History of Ancient China",
        "Falkenhausen, Chinese Society in the Age of Confucius",
      ],
      limitation:
        "Written records privilege royal and aristocratic practice; rural village rites are reconstructed from later texts and archaeological evidence.",
    },
  },
  {
    id: "warring-states-qin",
    label: "Warring States and Qin period belief",
    wiki: "https://en.wikipedia.org/wiki/Chinese_folk_religion",
    scope: { years: [-500, -206], bounds: [95, 20, 140, 50] },
    powers: [
      {
        name: "Tian",
        wiki: "https://en.wikipedia.org/wiki/Tian",
        domain: "Heaven, cosmic order, mandate",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "household and clan protection",
        rank: "major",
        relations: [{ kind: "serves", of: "Tian" }],
      },
      {
        name: "Earth and fields",
        domain: "harvest, fertility, boundaries",
        rank: "major",
      },
      {
        name: "Rivers and mountains",
        domain: "water, power, danger",
        rank: "major",
      },
      {
        name: "The hearth",
        domain: "household food and blessing",
        rank: "local",
      },
      {
        name: "Village tutelary",
        domain: "local protection and order",
        rank: "local",
      },
      {
        name: "Sun and moon",
        domain: "time, seasons, fortune",
        rank: "local",
      },
    ],
    practice: [
      "Ancestors receive offerings of wine and meat at seasonal gatherings.",
      "Grain and first fruits are left at field boundaries and community shrines.",
      "Divination is used to time planting, warfare, and major decisions.",
      "The village gathers at the earth god's shrine for seasonal festivals.",
    ],
    specialist:
      "Shamans and diviners for major concerns; the household head at home.",
    afterlife:
      "Ancestors remain with the household and can affect fortune; neglect brings misfortune.",
    evidence: {
      status: "inferred",
      claim:
        "Late Bronze Age and Iron Age sites show continuity of ancestor veneration and oracle practice; the period bridges early Zhou rites and the documented Han system.",
      sources: [
        "Chang, The Archaeology of Ancient China",
        "Schwartz, The World of Thought in Ancient China",
      ],
      limitation:
        "Few written records survive for common people; the system is reconstructed from archaeological evidence and the documented traditions before and after.",
    },
  },
  {
    id: "han-popular",
    label: "Han dynasty popular religion",
    wiki: "https://en.wikipedia.org/wiki/Chinese_folk_religion",
    scope: { years: [-206, 300], bounds: [95, 18, 135, 52] },
    powers: [
      {
        name: "Heaven",
        domain: "cosmic order, the throne",
        rank: "paramount",
      },
      {
        name: "Xiwangmu",
        wiki: "https://en.wikipedia.org/wiki/Xiwangmu",
        domain: "immortality, the western paradise",
        rank: "major",
      },
      {
        name: "Earth",
        domain: "harvest, buried power",
        rank: "major",
      },
      {
        name: "Local earth gods",
        domain: "village fields, boundaries",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "Earth" }],
      },
      {
        name: "Household ancestors",
        domain: "family prosperity and protection",
        rank: "local",
      },
      {
        name: "Spirits of the soil and spring",
        domain: "daily fortune, health",
        rank: "local",
      },
      {
        name: "The kitchen hearth",
        domain: "household sustenance and report to Heaven",
        rank: "local",
        relations: [{ kind: "serves", of: "Heaven" }],
      },
      {
        name: "Tutelary spirits",
        domain: "path, threshold, crossroads",
        rank: "local",
      },
    ],
    practice: [
      "Tablets of the ancestors stand on the household shrine; offerings are made at dawn.",
      "Festivals mark seasonal transitions with processions and sacrifices at the earth god's altar.",
      "Charms and painted images are hung at doors and windows for protection.",
      "A sick person is examined to learn which household spirit has withdrawn favour.",
    ],
    specialist:
      "Ritual masters for major festivals; the household head at the domestic shrine.",
    afterlife:
      "The ancestors dwell in the shrine if honoured, or may suffer in the underworld if neglected.",
    evidence: {
      status: "documented",
      claim:
        "Han tomb paintings, inscribed charms, and household shrines show veneration of household ancestors, local earth gods, and Xiwangmu; tomb texts describe the afterlife as a bureaucratic underworld.",
      sources: [
        "Erickson, 'Han Dynasty Tomb Murals'",
        "Nylan, The Five Confucian Classics",
        "Overmeyer, 'The Cult of Ch'an in Medieval China'",
      ],
      limitation:
        "Tomb evidence is skewed to the wealthy; village shrines leave few traces; the picture of popular belief is an inference from written guides and administrative records.",
    },
  },
  {
    id: "six-dynasties-buddhism",
    label: "Six Dynasties Buddhist practice",
    wiki: "https://en.wikipedia.org/wiki/Chinese_Buddhism",
    scope: { years: [300, 650], bounds: [100, 20, 140, 50] },
    powers: [
      {
        name: "Buddha",
        wiki: "https://en.wikipedia.org/wiki/Gautama_Buddha",
        domain: "enlightenment, salvation from suffering",
        rank: "paramount",
      },
      {
        name: "Bodhisattvas",
        wiki: "https://en.wikipedia.org/wiki/Bodhisattva",
        domain: "compassion, intercession for the living",
        rank: "major",
        relations: [{ kind: "serves", of: "Buddha" }],
      },
      {
        name: "Household ancestors",
        domain: "family protection, blessing",
        rank: "major",
      },
      {
        name: "Local earth god",
        domain: "village fields and boundaries",
        rank: "local",
      },
      {
        name: "Guardian spirits",
        domain: "household protection",
        rank: "local",
        relations: [{ kind: "serves", of: "Local earth god" }],
      },
      {
        name: "Hungry ghosts",
        domain: "the unquiet dead, compassion",
        rank: "local",
      },
    ],
    practice: [
      "A household shrine holds both Buddhist images and ancestral tablets.",
      "Monks chant sutras to benefit the dead and calm restless spirits.",
      "Merit earned through donations to temples is transferred to the ancestors.",
      "Festivals bring the community to the temple; offerings are made for family prosperity.",
    ],
    specialist:
      "Buddhist monks and nuns; the household head for domestic rites to ancestors.",
    afterlife:
      "The soul of the deceased can be reborn into a better realm or attain enlightenment through the family's merit-making.",
    evidence: {
      status: "documented",
      claim:
        "Tomb epitaphs and Buddhist inscriptions document mixed households holding both Buddhist and ancestral rites; temple records show patronage by families seeking merit for ancestors.",
      sources: [
        "Zürcher, The Buddhist Conquest of China",
        "Ch'en, Buddhism in China",
        "Ebrey, 'Taoism, Buddhism, and Confucianism'",
      ],
      limitation:
        "Sources favour Buddhist institutions and elite practitioners; folk and domestic practice are less visible.",
    },
  },
  {
    id: "tang-syncretism",
    label: "Tang dynasty syncretism",
    wiki: "https://en.wikipedia.org/wiki/Sanjiao",
    scope: { years: [618, 960], bounds: [95, 18, 140, 52] },
    powers: [
      {
        name: "The Three Jewels",
        wiki: "https://en.wikipedia.org/wiki/Three_Jewels",
        domain: "Buddha, Dharma, Sangha",
        rank: "paramount",
      },
      {
        name: "Daoist immortals",
        wiki: "https://en.wikipedia.org/wiki/Xian_(Taoism)",
        domain: "longevity, alchemy, transcendence",
        rank: "major",
      },
      {
        name: "Confucian sages",
        domain: "virtue, order, filial duty",
        rank: "major",
      },
      {
        name: "City god",
        wiki: "https://en.wikipedia.org/wiki/Chenghuangshen",
        domain: "urban order and moral record",
        rank: "major",
      },
      {
        name: "Household ancestors",
        domain: "family protection and prosperity",
        rank: "local",
      },
      {
        name: "Kitchen god",
        wiki: "https://en.wikipedia.org/wiki/Kitchen_God",
        domain: "household sustenance and the moral report",
        rank: "local",
        relations: [{ kind: "serves", of: "City god" }],
      },
      {
        name: "Local earth god",
        domain: "fields and village boundaries",
        rank: "local",
        relations: [{ kind: "serves", of: "City god" }],
      },
      {
        name: "Tutelary spirits",
        domain: "well, gate, tree",
        rank: "local",
      },
    ],
    practice: [
      "Households maintain Buddhist and Daoist shrines alongside ancestral tablets.",
      "The city god holds an annual court to record moral deeds and misdeeds.",
      "Monks perform rituals for both Buddhist and Daoist concerns.",
      "Alchemy and breath techniques are taught as paths to longevity.",
    ],
    specialist:
      "Monks, Daoist priests, and ritual specialists; the household head at the domestic shrine.",
    afterlife:
      "The soul faces judgment by the city god and the celestial bureaucracy; merit-making can improve the outcome.",
    evidence: {
      status: "documented",
      claim:
        "Tang inscriptions and texts document coexisting Buddhist, Daoist and Confucian institutions in both official and household contexts; administrative records show state sponsorship of all three.",
      sources: [
        "Benn, 'Taoism as Ideology'",
        "Barrett, The Woman Who Discovered Printing",
        "Verellen, 'Daoism and the State'",
      ],
      limitation:
        "Institutional records are biased toward elite practitioners and official cults; the syncretism of rural households is less documented.",
    },
  },
  {
    id: "song-ming-pantheon",
    label: "Song and Ming household pantheon",
    wiki: "https://en.wikipedia.org/wiki/Chinese_folk_religion",
    scope: { years: [960, 1700], bounds: [95, 15, 140, 52] },
    powers: [
      {
        name: "Heaven",
        domain: "cosmic order, the mandate",
        rank: "paramount",
      },
      {
        name: "Household ancestors",
        domain: "family protection and prosperity",
        rank: "major",
      },
      {
        name: "City god",
        wiki: "https://en.wikipedia.org/wiki/Chenghuangshen",
        domain: "order, moral accounting, justice",
        rank: "major",
        relations: [{ kind: "serves", of: "Heaven" }],
      },
      {
        name: "Guanyin",
        wiki: "https://en.wikipedia.org/wiki/Guanyin",
        domain: "compassion, childbirth, relief",
        rank: "major",
      },
      {
        name: "Mazu",
        wiki: "https://en.wikipedia.org/wiki/Mazu",
        domain: "sea protection, maritime safety",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "Guanyin" }],
      },
      {
        name: "Kitchen god",
        wiki: "https://en.wikipedia.org/wiki/Kitchen_God",
        domain: "household sustenance and moral report",
        rank: "local",
        relations: [{ kind: "serves", of: "Heaven" }],
      },
      {
        name: "Earth god",
        domain: "village fields and local boundaries",
        rank: "local",
      },
      {
        name: "Door god and threshold spirits",
        domain: "household protection",
        rank: "local",
      },
      {
        name: "Local tutelary",
        domain: "village well, shrine, crossroads",
        rank: "local",
      },
    ],
    practice: [
      "Ancestral tablets are arranged on the highest shelf with daily offerings of rice and wine.",
      "The kitchen god receives special offerings before the new year; his image is burned to send him to Heaven.",
      "The city god's birthday brings processions and fireworks.",
      "Charms and door paintings protect the household; a religious professional may be called for major rites.",
    ],
    specialist:
      "Daoist priests for major rituals; monks for Buddhist concerns; the household head at the domestic shrine.",
    afterlife:
      "Ancestors dwell in the household shrine; other souls face judgment by the city god and the underworld bureaucracy.",
    evidence: {
      status: "documented",
      claim:
        "Ming household manuals, temple records, and tomb art show the coexistence of ancestral veneration, popular deities (Guanyin, Mazu, kitchen god, city god), and Daoist-Buddhist rites in both urban and rural homes.",
      sources: [
        "Fabrizio, 'The Cult of the Kitchen God'",
        "Brook, The Confusions of Pleasure",
        "Santangelo, 'Gender and the Soul'",
      ],
      limitation:
        "Records favour literate elite households; rural shrine practices and informal rituals are less well documented.",
    },
  },
  {
    id: "late-imperial-village",
    label: "Late imperial rural practice",
    wiki: "https://en.wikipedia.org/wiki/Chinese_folk_religion",
    scope: { years: [1700, 1912], bounds: [95, 18, 140, 50] },
    powers: [
      {
        name: "The ancestors",
        domain: "family protection, prosperity, well-being",
        rank: "paramount",
      },
      {
        name: "Earth god",
        domain: "fields, boundaries, local blessing",
        rank: "major",
      },
      {
        name: "Kitchen god",
        wiki: "https://en.wikipedia.org/wiki/Kitchen_God",
        domain: "household sustenance and harmony",
        rank: "major",
      },
      {
        name: "Guanyin",
        wiki: "https://en.wikipedia.org/wiki/Guanyin",
        domain: "compassion, childbirth, healing",
        rank: "local",
      },
      {
        name: "Village tutelary",
        domain: "shrine, well, tree, crossroads",
        rank: "local",
        relations: [{ kind: "serves", of: "Earth god" }],
      },
      {
        name: "Door and threshold spirits",
        domain: "household protection",
        rank: "local",
      },
    ],
    practice: [
      "The household shrine stands in the main room, holding ancestral tablets and a bowl for offerings.",
      "Daily incense and rice are given to the ancestors; major festivals bring wine and meat.",
      "The earth god receives grain at planting and harvest; the village celebrates his birthday with feasting.",
      "If a child sickens, the parents consult a spirit medium about which ancestral spirit is displeased.",
    ],
    specialist:
      "Spirit mediums for consultation; the household head and family elders for daily rites.",
    afterlife:
      "The ancestors enter the family shrine and remain present; neglect can cause them to wander or return as hungry ghosts.",
    evidence: {
      status: "documented",
      claim:
        "Late Qing and early Republican ethnographic accounts, temple records, and household ritual manuals document the paramount role of household ancestors and the local earth god in rural religious life.",
      sources: [
        "Wolf, 'The Woman Who Didn't Become a Shaman'",
        "Baker, 'An Old Chinese Woman Tells Her Life'",
        "Cohen, 'Being Chinese'",
      ],
      limitation:
        "Ethnographic accounts were written by outsiders and are coloured by their assumptions; village practice was diverse and changed over the twentieth century.",
    },
  },
  {
    id: "korean-three-kingdoms",
    label: "Korean Three Kingdoms shamanic practice",
    wiki: "https://en.wikipedia.org/wiki/Korean_shamanism",
    scope: { years: [-37, 800], bounds: [120, 30, 140, 50] },
    powers: [
      {
        name: "Sky god",
        domain: "cosmic order, kingship",
        rank: "paramount",
      },
      {
        name: "Ancestral spirits",
        domain: "clan protection, blessing",
        rank: "major",
      },
      {
        name: "Mountain spirits",
        domain: "power, danger, protection",
        rank: "major",
      },
      {
        name: "Water spirits",
        domain: "rivers, wells, fertility",
        rank: "major",
      },
      {
        name: "Household and kitchen spirits",
        domain: "daily sustenance and protection",
        rank: "local",
      },
      {
        name: "Field boundary spirits",
        domain: "harvest, fertility",
        rank: "local",
      },
      {
        name: "Spirit of the hearth",
        domain: "family warmth and blessing",
        rank: "local",
      },
    ],
    practice: [
      "Shamans (mudang) perform rituals to honour ancestral spirits and cure spirit-caused illness.",
      "Mountain and water spirits are propitiated with offerings at seasonal festivals.",
      "The household maintains a shrine to the kitchen and hearth spirits.",
      "Ritual specialists read the will of the ancestors through trance and divination.",
    ],
    specialist:
      "Shamans and spirit mediums; the household head at the domestic shrine.",
    afterlife:
      "Ancestor spirits dwell close to the household and must be fed and honoured to prevent misfortune.",
    evidence: {
      status: "inferred",
      claim:
        "Early Korean histories record shamanic practices and mountain rites; the later prominence of mudang culture and the persistence of household ancestor veneration suggest continuity from the Three Kingdoms period.",
      sources: [
        "Hulbert, The History of Korea",
        "Kang, 'The Korean Shamanistic Tradition'",
        "Janelli, 'Ancestor Worship and Lineage Organization'",
      ],
      limitation:
        "Written records are scarce and were written by Confucian historians who disparaged shamanism; the reconstruction relies on later ethnographic evidence.",
    },
  },
  {
    id: "koryo-buddhism",
    label: "Koryo kingdom Buddhism",
    wiki: "https://en.wikipedia.org/wiki/Buddhism_in_Korea",
    scope: { years: [800, 1450], bounds: [120, 30, 140, 50] },
    powers: [
      {
        name: "Buddha",
        wiki: "https://en.wikipedia.org/wiki/Gautama_Buddha",
        domain: "enlightenment, salvation",
        rank: "paramount",
      },
      {
        name: "Bodhisattvas",
        wiki: "https://en.wikipedia.org/wiki/Bodhisattva",
        domain: "compassion, intercession",
        rank: "major",
        relations: [{ kind: "serves", of: "Buddha" }],
      },
      {
        name: "Household ancestors",
        domain: "family protection and prosperity",
        rank: "major",
      },
      {
        name: "Mountain spirits",
        domain: "protection, sacred power",
        rank: "major",
      },
      {
        name: "Earth god",
        domain: "fields and village boundaries",
        rank: "local",
      },
      {
        name: "Kitchen and hearth spirits",
        domain: "household sustenance",
        rank: "local",
      },
      {
        name: "Spirit medium power",
        domain: "shamanic healing and divination",
        rank: "local",
      },
    ],
    practice: [
      "Buddhist temples dot the mountains; pilgrims make offerings for health and spiritual progress.",
      "Household shrines hold both Buddhist images and ancestral tablets.",
      "Merit-making through temple donations benefits ancestors and the living family.",
      "Shamans continue to perform rituals alongside Buddhist monks for healing and ancestor propitiation.",
    ],
    specialist:
      "Buddhist monks and nuns; shamans (mudang) for healing and ancestral rites.",
    afterlife:
      "Through merit-making and monastic practice, souls can achieve enlightenment; improperly honoured ancestors may cause misfortune.",
    evidence: {
      status: "documented",
      claim:
        "Koryo temple records, tomb epitaphs, and official histories document state sponsorship of Buddhism and the persistence of ancestor veneration and shamanic practice alongside it.",
      sources: [
        "Vermeersch, 'The Power of the Buddhas'",
        "Kang, 'The Korean Shamanistic Tradition'",
        "Buswell, 'The Formation of Ch'an Ideology'",
      ],
      limitation:
        "Temple records dominate; rural practice is less documented; the role of shamanism alongside Buddhism is inferred from later ethnography.",
    },
  },
  {
    id: "heian-shinto-buddhism",
    label: "Heian period Shinto-Buddhist synthesis",
    wiki: "https://en.wikipedia.org/wiki/Shinbutsu-sh%C5%ABg%C5%8D",
    scope: { years: [794, 1200], bounds: [128, 30, 148, 48] },
    powers: [
      {
        name: "Amaterasu",
        wiki: "https://en.wikipedia.org/wiki/Amaterasu",
        domain: "the sun, imperial descent, national order",
        rank: "paramount",
      },
      {
        name: "Local kami",
        domain: "shrine, mountain, river, place",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "Buddhist deities" }],
      },
      {
        name: "Buddhist deities",
        domain: "protection, enlightenment, healing",
        rank: "major",
      },
      {
        name: "Household ancestors",
        domain: "family protection and prosperity",
        rank: "major",
      },
      {
        name: "Ujigami",
        wiki: "https://en.wikipedia.org/wiki/Ujigami",
        domain: "clan protection and blessing",
        rank: "local",
        relations: [{ kind: "aspect-of", of: "Local kami" }],
      },
      {
        name: "Household kami",
        domain: "door, hearth, kitchen",
        rank: "local",
        relations: [{ kind: "aspect-of", of: "Local kami" }],
      },
      {
        name: "Ancestral spirit",
        domain: "household well-being",
        rank: "local",
      },
    ],
    practice: [
      "Shrines and temples stand in parallel; a household may make offerings to both kami and Buddhist images.",
      "Seasonal festivals honour both local kami and Buddhist saints; monks may officiate at kami festivals.",
      "The household maintains a kami shelf and an ancestral tablet.",
      "A sickening child is taken to a shrine or temple healer to learn which spirit is displeased.",
    ],
    specialist:
      "Shrine priests for kami rites; Buddhist monks for dharma; the household head at the domestic shrine.",
    afterlife:
      "Ancestors become kami and are enshrined; through Buddhist practice they may achieve enlightenment.",
    evidence: {
      status: "documented",
      claim:
        "Heian court records and temple documents show Shinto-Buddhist syncretism at both institutional and household levels; shrine records show Buddhist monks officiating at kami festivals.",
      sources: [
        "Adolphson, The Gates of Power",
        "Tyler, Japanese No Dramas",
        "Blacker, The Catalpa Bow",
      ],
      limitation:
        "Records favour elite and institutional practice; village and rural shrines are less documented; the integration was less seamless in practice than in doctrine.",
    },
  },
  {
    id: "medieval-japan-pure-land",
    label: "Medieval Japan Pure Land Buddhism",
    wiki: "https://en.wikipedia.org/wiki/Pure_Land_Buddhism",
    scope: { years: [1200, 1620], bounds: [128, 28, 148, 50] },
    powers: [
      {
        name: "Amida Buddha",
        wiki: "https://en.wikipedia.org/wiki/Amitabha",
        domain: "salvation, the Pure Land",
        rank: "paramount",
      },
      {
        name: "Bodhisattva Kannon",
        wiki: "https://en.wikipedia.org/wiki/Kannon",
        domain: "compassion, childbirth, healing",
        rank: "major",
        relations: [{ kind: "serves", of: "Amida Buddha" }],
      },
      {
        name: "Local kami",
        domain: "place, shrine, mountain, river",
        rank: "major",
      },
      {
        name: "Household ancestors",
        domain: "family protection and memorial",
        rank: "major",
      },
      {
        name: "Household kami",
        domain: "door, hearth, sustenance",
        rank: "local",
        relations: [{ kind: "aspect-of", of: "Local kami" }],
      },
      {
        name: "Village tutelary kami",
        domain: "communal well-being",
        rank: "local",
        relations: [{ kind: "aspect-of", of: "Local kami" }],
      },
      {
        name: "Ancestral spirit",
        domain: "household continuity",
        rank: "local",
      },
    ],
    practice: [
      "Recitation of Amida's name (nembutsu) is the central practice; monks preach in villages.",
      "Shrines and temples coexist; household altars hold both Buddhist images and kami tokens.",
      "Death rituals transition the deceased through Buddhist rites; the spirit is later enshrined as a kami.",
      "Seasonal festivals at local shrines and temples draw the village; donations fund both institutions.",
    ],
    specialist:
      "Pure Land monks; local shrine priests; the household head for domestic rites.",
    afterlife:
      "At death, monks perform rites to guide the soul to the Pure Land; the ancestor becomes a household kami.",
    evidence: {
      status: "documented",
      claim:
        "Medieval temple records, tombstone inscriptions, and artistic evidence show Pure Land dominance in popular belief; household and shrine records show parallel veneration of kami and Buddhist practice.",
      sources: [
        "Grapard, The Protocol of the Gods",
        "Adolphson, The Gates of Power",
        "Dobbins, 'The Great Buddha Hall of Todai-ji'",
      ],
      limitation:
        "Regional variation was considerable; rural practice differed markedly from urban; records from temples and elite households dominate.",
    },
  },
  {
    id: "tokugawa-household-buddhism",
    label: "Tokugawa household Buddhism",
    wiki: "https://en.wikipedia.org/wiki/Danka_system",
    scope: { years: [1620, 1950], bounds: [128, 28, 148, 50] },
    powers: [
      {
        name: "Buddha",
        domain: "salvation, enlightenment",
        rank: "paramount",
      },
      {
        name: "Household ancestors",
        domain: "family protection, memorial, continuity",
        rank: "major",
      },
      {
        name: "Kannon",
        wiki: "https://en.wikipedia.org/wiki/Kannon",
        domain: "compassion, childbirth, healing",
        rank: "major",
        relations: [{ kind: "serves", of: "Buddha" }],
      },
      {
        name: "Local kami",
        domain: "shrine, village, place",
        rank: "major",
      },
      {
        name: "Household kami",
        domain: "hearth, door, family shrine",
        rank: "local",
        relations: [{ kind: "aspect-of", of: "Local kami" }],
      },
      {
        name: "Amida Buddha",
        wiki: "https://en.wikipedia.org/wiki/Amitabha",
        domain: "rebirth in the Pure Land at death",
        rank: "local",
        relations: [{ kind: "aspect-of", of: "Buddha" }],
      },
      {
        name: "Ancestor-kami",
        domain: "household blessing and protection",
        rank: "local",
        relations: [{ kind: "aspect-of", of: "Household ancestors" }],
      },
    ],
    practice: [
      "Every household is registered with a temple; the family altar holds both Buddhist images and an ancestral tablet.",
      "Memorial rites for the deceased are performed by the local priest at fixed intervals.",
      "Village kami shrines receive seasonal offerings; the priest may participate in major festivals.",
      "Death brings Buddhist funeral rites; the deceased enters both the ancestral tablet and the kami realm.",
    ],
    specialist:
      "The registered parish priest; the household head and family elders for domestic rites.",
    afterlife:
      "Death rites and memorial masses guide the soul through the underworld toward the Pure Land; the ancestor becomes a household kami.",
    evidence: {
      status: "documented",
      claim:
        "Tokugawa temple registers, funeral records, and household manuals document mandatory parish affiliation, the standard format of the household altar combining Buddhist and kami elements, and the integration of ancestral veneration with Buddhist practice.",
      sources: [
        "Teeuws & Schreurs, 'Hukai's Controversy'",
        "Reader & Tanabe, Practically Religious",
        "Blacker, The Catalpa Bow",
      ],
      limitation:
        "Records are abundant but favour urban and literate households; rural variation is less visible; the system underwent strain during the modernization of the late nineteenth century.",
    },
  },
  {
    id: "joseon-korea-confucianism",
    label: "Joseon Korea Confucian and shamanic tradition",
    wiki: "https://en.wikipedia.org/wiki/Korean_Confucianism",
    scope: { years: [1450, 1910], bounds: [120, 30, 140, 50] },
    powers: [
      {
        name: "Confucian virtue",
        domain: "moral order, filial duty, social hierarchy",
        rank: "paramount",
      },
      {
        name: "Heaven",
        domain: "cosmic order, the king's mandate",
        rank: "major",
      },
      {
        name: "Household ancestors",
        domain: "family protection, prosperity, well-being",
        rank: "major",
      },
      {
        name: "Mountain spirits",
        domain: "sacred power, protection, danger",
        rank: "major",
      },
      {
        name: "Earth god",
        domain: "fields, village boundaries, blessing",
        rank: "local",
      },
      {
        name: "Spirit medium power",
        domain: "shamanic healing, ancestor communication",
        rank: "local",
      },
      {
        name: "Household spirits",
        domain: "door, kitchen, well",
        rank: "local",
      },
    ],
    practice: [
      "Ancestor tablets stand in the main room; incense and offerings mark seasonal changes.",
      "Shamans are called to cure spirit-caused illness and learn which ancestor is displeased.",
      "Confucian rites mark life transitions: coming of age, marriage, death.",
      "The earth god receives grain at planting and harvest; village shrines host seasonal festivals.",
    ],
    specialist:
      "Confucian scholars and ritual specialists; shamans (mudang) for healing and divination.",
    afterlife:
      "Ancestors dwell in the household shrine and must be honoured to bless the living; neglect brings misfortune.",
    evidence: {
      status: "documented",
      claim:
        "Joseon historical records, genealogies, and ethnographic accounts document the coexistence of official Confucianism with widespread shamanic practice and household ancestor veneration; shamanism was periodically suppressed but never eliminated.",
      sources: [
        "Lee, The Cambridge History of Korea",
        "Kang, 'The Korean Shamanistic Tradition'",
        "Janelli & Janelli, 'Ancestor Worship and Lineage Organization'",
      ],
      limitation:
        "Official sources emphasize Confucian ideology; folk and shamanic practice are documented in ethnography and rare folk accounts. Suppression efforts mean urban practice was less visible than rural.",
    },
  },
  {
    id: "ryukyu-ancestor-kami",
    label: "Ryukyu Islands ancestor and kami veneration",
    wiki: "https://en.wikipedia.org/wiki/Ryukyuan_religion",
    scope: { years: [1200, 1950], bounds: [123, 24, 133, 32] },
    powers: [
      {
        name: "The ancestors",
        domain: "family protection, household blessing",
        rank: "paramount",
      },
      {
        name: "Kami of the islands",
        domain: "place, shrine, sea safety",
        rank: "major",
      },
      {
        name: "The sea",
        domain: "fish, travel, weather",
        rank: "major",
      },
      {
        name: "The mountain",
        domain: "freshwater, spirits, danger",
        rank: "major",
      },
      {
        name: "Household kami",
        domain: "hearth, door, garden",
        rank: "local",
        relations: [{ kind: "aspect-of", of: "Kami of the islands" }],
      },
      {
        name: "Village tutelary",
        domain: "communal well-being, shrine",
        rank: "local",
      },
      {
        name: "Sea guardian spirit",
        domain: "fishing, maritime safety",
        rank: "local",
        relations: [{ kind: "aspect-of", of: "Kami of the islands" }],
      },
    ],
    practice: [
      "Ancestral tablets are kept in the main room; daily rice and water are offered.",
      "A woman elder leads family rituals for the ancestors and household spirits.",
      "The first catch of fish and the first harvest fruits are left at the beach or shrine.",
      "Seasonal festivals at island shrines bring the community; offerings are made for safe sailing.",
    ],
    specialist:
      "Female ritual specialists (noro) for shrine rites; the household elder for domestic practice.",
    afterlife:
      "Ancestors remain close to the household and bring blessing or misfortune depending on honour given.",
    evidence: {
      status: "documented",
      claim:
        "Ryukyu ethnography and administrative records document a matrilineal ritual system centred on female specialists, household ancestor veneration, and sea-oriented kami worship distinct from mainland Japan but sharing core practices.",
      sources: [
        "Asato, 'Okinawan Religion'",
        "Mabuchi, 'Ryukyuan Culture and Okinawan Identity'",
      ],
      limitation:
        "The system was heavily influenced by Japanese colonial administration and modernization; ethnographic records are from the twentieth century when much was already changed.",
    },
  },
  {
    id: "southwest-china-farming",
    label: "Southwest China and Southeast Asia borderland practice",
    wiki: "https://en.wikipedia.org/wiki/Chinese_folk_religion",
    scope: { years: [1000, 1950], bounds: [90, 15, 110, 35] },
    powers: [
      {
        name: "The ancestors",
        domain: "household, clan, continuity",
        rank: "paramount",
      },
      {
        name: "The earth",
        domain: "rice fields, flooding, fertility",
        rank: "major",
      },
      {
        name: "The river",
        domain: "water, fish, irrigation",
        rank: "major",
      },
      {
        name: "Mountain spirits",
        domain: "forest, danger, sacred power",
        rank: "major",
      },
      {
        name: "Village tutelary",
        domain: "communal well-being, shrine",
        rank: "local",
      },
      {
        name: "Kitchen fire",
        domain: "household sustenance and warmth",
        rank: "local",
      },
      {
        name: "Field boundary spirit",
        domain: "crop protection, neighbour relations",
        rank: "local",
      },
    ],
    practice: [
      "The ancestors are honoured with incense and rice at household shrines.",
      "At planting and harvest, offerings are made to the earth and mountain spirits.",
      "Village rituals mark seasonal transitions; the community gathers at the shrine.",
      "A spirit medium is consulted when illness or misfortune strikes.",
    ],
    specialist:
      "Village elders and shamans; the household head for daily rites.",
    afterlife:
      "Ancestors remain with the household and fields; neglect can cause wandering spirits or misfortune.",
    evidence: {
      status: "hypothesis",
      claim:
        "Southwest China and Yunnan borderland populations show hybrid practices reflecting both Chinese influence and indigenous animist traditions; the system is inferred from ethnographic accounts of Tai, Shan, and other hill peoples and from historical records of cultural exchange.",
      sources: [
        "Backus, The Nan-chao Kingdom",
        "Enfield, Linguistic Epidemiology",
      ],
      limitation:
        "Boundary regions are poorly documented in historical texts; ethnography is often from the modern period and reflects later Chinese administrative influence. Specificity about pre-modern belief is speculative.",
    },
  },
  {
    id: "tibetan-plateau-practice",
    label: "Tibetan Plateau and Qaidam Basin pastoralist tradition",
    wiki: "https://en.wikipedia.org/wiki/Bon",
    scope: { years: [800, 1950], bounds: [88, 30, 110, 45] },
    powers: [
      {
        name: "The sky",
        domain: "weather, fortune, cosmic order",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "herd protection, family blessing",
        rank: "major",
      },
      {
        name: "The mountain",
        domain: "pasture, sacred power, danger",
        rank: "major",
      },
      {
        name: "Water spirits",
        domain: "springs, rivers, life-giving power",
        rank: "major",
      },
      {
        name: "The herd",
        domain: "livelihood, animal spirits",
        rank: "local",
      },
      {
        name: "Household fire",
        domain: "warmth, cooking, family gathering",
        rank: "local",
      },
      {
        name: "Sacred stones and peaks",
        domain: "place spirits, waymarks",
        rank: "local",
      },
    ],
    practice: [
      "Offerings of butter and milk are poured on stones at mountain passes and sacred peaks.",
      "The hearth fire is kept alive and honoured; first milk is offered to it.",
      "Ancestors are remembered with libations on seasonal turning points.",
      "When animals sicken or disappear, divination is sought to learn which spirit is displeased.",
    ],
    specialist:
      "Shamans and ritual specialists for major concerns; the household head at the hearth.",
    afterlife:
      "Ancestors remain near the herds and pastures; they bring good fortune or withhold blessing.",
    evidence: {
      status: "hypothesis",
      claim:
        "Tibetan Plateau and Qaidam Basin pastoralist populations show continuity of pre-Buddhist animist practice; the system is inferred from oral accounts, ethnographic observation, and the persistence of non-Buddhist ritual alongside Buddhist monasticism in the region.",
      sources: [
        "Aziz, Tibetan Frontier Families",
        "Jabb, 'Oral Literature of Tibet'",
      ],
      limitation:
        "Written records are sparse for non-elite populations; ethnographic accounts are often from the twentieth century; the relationship between pre-Buddhist and Buddhist practice is complex and not fully recovered.",
    },
  },
  {
    id: "modern-east-asia",
    label: "Modern East Asian practice and transition",
    wiki: "https://en.wikipedia.org/wiki/Chinese_folk_religion",
    scope: { years: [1900, 2020], bounds: [90, 15, 150, 55] },
    powers: [
      {
        name: "The ancestors",
        domain: "family continuity, blessing",
        rank: "paramount",
      },
      {
        name: "Guanyin",
        wiki: "https://en.wikipedia.org/wiki/Guanyin",
        domain: "compassion, healing, childbirth",
        rank: "major",
      },
      {
        name: "Mazu",
        wiki: "https://en.wikipedia.org/wiki/Mazu",
        domain: "the sea, protection, safe travel",
        rank: "major",
      },
      {
        name: "Amaterasu",
        wiki: "https://en.wikipedia.org/wiki/Amaterasu",
        domain: "the sun, Japan's kami, national order",
        rank: "major",
      },
      {
        name: "Tudigong",
        wiki: "https://en.wikipedia.org/wiki/Tudigong",
        domain: "the local earth god, the neighbourhood",
        rank: "major",
        relations: [{ kind: "serves", of: "The City God" }],
      },
      {
        name: "Zao Jun",
        wiki: "https://en.wikipedia.org/wiki/Kitchen_God",
        domain: "the stove, household report to Heaven",
        rank: "local",
        relations: [{ kind: "serves", of: "The City God" }],
      },
      {
        name: "Guan Yu",
        wiki: "https://en.wikipedia.org/wiki/Guan_Yu",
        domain: "loyalty, war, prosperity in trade",
        rank: "local",
      },
      {
        name: "The City God",
        wiki: "https://en.wikipedia.org/wiki/Chenghuangshen",
        domain: "urban order, the moral record",
        rank: "local",
      },
      {
        name: "Inari",
        wiki: "https://en.wikipedia.org/wiki/Inari_%C5%8Ckami",
        domain: "rice, foxes, prosperity",
        rank: "local",
      },
    ],
    practice: [
      "Household altars persist, often simplified; incense goes to the ancestors and to Guanyin or Mazu depending on the region.",
      "Zao Jun's paper image is sent off before the new year with sweets to sweeten his report to Heaven.",
      "Fishing and coastal families keep Mazu's temples busy; city shrines to the City God and Tudigong mark neighbourhoods.",
      "In Japan, shrines to Amaterasu and Inari persist alongside Buddhist temples and the household kami shelf.",
    ],
    specialist:
      "Temple priests and Daoist or Buddhist ritual specialists coexist with secular authorities; the family elder at home.",
    afterlife:
      "Ideas of the afterlife reflect hybrid beliefs: ancestors kept at the household shrine, judgment before the City God's court, or rebirth through Buddhist merit.",
    evidence: {
      status: "documented",
      claim:
        "Twentieth and twenty-first century ethnography documents persistence of household ancestor veneration and continued devotion to Guanyin, Mazu, Zao Jun, Guan Yu, Tudigong, and the City God across China and the diaspora, and to Amaterasu and Inari in Japan, despite modernization, Marxist suppression, war, and rapid social change.",
      sources: [
        "Wolf, 'The Woman Who Didn't Become a Shaman'",
        "Cohen, 'Being Chinese'",
        "Reader & Tanabe, Practically Religious",
        "Feuchtwang, Popular Religion in China",
      ],
      limitation:
        "Wide diversity across the region and rapid change mean this is an approximation; which figures a household actually addresses varies enormously by locality, and practice continues to evolve.",
    },
  },
];
