import type { BeliefSystem } from "../types";

export const innerEurasia: readonly BeliefSystem[] = [
  {
    id: "inner-eurasia-foragers",
    label: "Inner Eurasian forager and early pastoral practice",
    scope: { years: [-8000, -1200], bounds: [25, 25, 180, 82] },
    powers: [
      {
        name: "The sky",
        domain: "weather, the high places, destiny",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "the camp's lineage and identity",
        rank: "major",
      },
      {
        name: "The hearth fire",
        domain: "the camp, protection, daily sustenance",
        rank: "major",
      },
      {
        name: "The master of animals",
        domain: "game and herds, the hunt's success",
        rank: "major",
      },
      {
        name: "The water spirits",
        domain: "rivers, lakes, wells, safe drinking",
        rank: "local",
      },
      {
        name: "The mountain master",
        domain: "passes, peaks, danger and shelter",
        rank: "local",
      },
      {
        name: "The earth below",
        domain: "burial grounds, the underworld",
        rank: "local",
      },
      {
        name: "The wind and storms",
        domain: "travel, weather, the open steppe",
        rank: "local",
      },
    ],
    practice: [
      "The first kill is offered to the master of animals; bones are kept with respect.",
      "The hearth fire receives a portion of every meal.",
      "The dead are buried with goods and sometimes animals for the journey below.",
      "A stone cairn marks a dangerous place or honors a safe passage.",
    ],
    specialist: "The eldest or one marked by dreams and illness.",
    afterlife:
      "Continued life below or in the sky, aided by the ancestors and the herd.",
    evidence: {
      status: "inferred",
      claim:
        "Archaeological evidence from across the steppe and taiga shows persistent patterns: burial with animals and goods, hearth fire use, stone arrangements on high ground, bone and antler sacred objects, and hunting-focused economy for thousands of years before agriculture.",
      sources: [
        "Mallory, In Search of the Indo-Europeans",
        "Anthony, The Horse, the Wheel, and Language",
        "Pitulko, Arctic Odysseys",
      ],
      limitation:
        "No written records; practices varied across vast regions and millennia. This entry flattens real diversity into a single generalized system.",
    },
  },
  {
    id: "steppe-bronze-age",
    label: "Bronze Age steppe pastoralist practice",
    scope: { years: [-2000, -800], bounds: [25, 38, 150, 65] },
    powers: [
      {
        name: "The sky",
        domain: "weather, the high pastures, fate",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "the herd's prosperity, lineage",
        rank: "major",
      },
      {
        name: "The hearth fire",
        domain: "the tent, protection, daily life",
        rank: "major",
      },
      {
        name: "The master of the mountain",
        domain: "a named peak and its passes",
        rank: "local",
      },
      {
        name: "The water spirits",
        domain: "rivers, wells, safe drinking",
        rank: "local",
      },
      {
        name: "The horse herds",
        domain: "fertility and survival of stock",
        rank: "local",
      },
      {
        name: "The earth below",
        domain: "campsites, burial, the underworld",
        rank: "local",
      },
    ],
    practice: [
      "The hearth fire is given first of any meat or drink.",
      "A stone cairn marks a dangerous pass; stones are added in gratitude for safe crossing.",
      "The dead are buried with horses and goods for the journey below.",
      "The spring migration and autumn gather include offerings to water and mountain.",
    ],
    specialist: "The eldest or a person marked by the spirits.",
    afterlife:
      "Continued life below ground with the herd and the ancestors' aid.",
    evidence: {
      status: "inferred",
      claim:
        "Kurgan burials with horses and weapons, stone arrangements on high ground, and the long continuity of steppe pastoralist cosmology suggest an early sky worship and ancestor cult rooted in herding life.",
      sources: [
        "Anthony, The Horse, the Wheel, and Language",
        "Gimbutas, The Kurgan Hypothesis and Indo-European Origins",
        "Mallory, In Search of the Indo-Europeans",
      ],
      limitation:
        "No written records; evidence is archaeological and linguistic, mediated through later steppe traditions that may have altered core beliefs.",
    },
  },
  {
    id: "caucasus-early-peoples",
    label: "Caucasian mountain and foothill practice",
    scope: { years: [-2000, 1400], bounds: [35, 40, 60, 50] },
    powers: [
      {
        name: "The high mountain",
        domain: "the peaks, weather, danger",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "the clan and its lands",
        rank: "major",
      },
      {
        name: "The river spirits",
        domain: "water and valleys, fertility",
        rank: "major",
      },
      {
        name: "The forest master",
        domain: "trees, game, the wild",
        rank: "local",
      },
      {
        name: "The hearth fire",
        domain: "the house, protection, kinship",
        rank: "local",
      },
      {
        name: "Sacred stones",
        domain: "markers, oaths, boundaries",
        rank: "local",
      },
      {
        name: "The sky father",
        domain: "thunder, oaths, justice",
        rank: "major",
      },
    ],
    practice: [
      "A stone pillar marks a sacred place; oaths are sworn touching it.",
      "The dead are buried in a cairn or tower; weapons and goods accompany them.",
      "A river crossing receives an offering; water is addressed respectfully.",
      "A hunt begins with invocation to the forest master and the sky.",
    ],
    specialist: "The eldest of the clan; a person marked by visions.",
    afterlife:
      "The ancestors remain near their burial places; they aid and judge the living.",
    evidence: {
      status: "inferred",
      claim:
        "Archaeological evidence of tower tombs, stone arrangements, and burial goods; later ethnographic accounts describe mountain worship, ancestor veneration, and oath-taking practices continuous into modern times.",
      sources: [
        "Anthony, The Horse, the Wheel, and Language",
        "Woolley, Excavations at Ur",
        "Tsutsiev, Atlas of the Caucasus",
      ],
      limitation:
        "Early records are sparse; most sources are from later periods or ethnographic reconstruction.",
    },
  },
  {
    id: "volga-uralic-peoples",
    label: "Volga and Uralic peoples' early practice",
    scope: { years: [-1500, 900], bounds: [42, 48, 70, 62] },
    powers: [
      {
        name: "The sky",
        domain: "thunder, weather, the high realm",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "the lineage, the land",
        rank: "major",
      },
      {
        name: "The river",
        domain: "the Volga's flow, fishing, travel",
        rank: "major",
      },
      {
        name: "The forest",
        domain: "game, berries, the wild",
        rank: "major",
      },
      {
        name: "The hearth fire",
        domain: "the house, family, blessing",
        rank: "local",
      },
      {
        name: "Water spirits",
        domain: "wells, springs, water-crossings",
        rank: "local",
      },
      {
        name: "The earth mother",
        domain: "crops, fertility, the growing season",
        rank: "local",
      },
    ],
    practice: [
      "Offerings of bread and honey are left in the forest; the first catch goes to the water.",
      "A new dwelling is blessed by circling fire; a post is planted for the house spirit.",
      "The dead are buried with goods; a mound or stone marks the grave.",
      "The spring and autumn mark gathering times when offerings rise from every household.",
    ],
    specialist: "The eldest or a shaman; a woman who knows the herbs.",
    afterlife:
      "The dead dwell in the earth or return to the forest; shamans speak with them.",
    evidence: {
      status: "inferred",
      claim:
        "Archaeological evidence from settlement and burial sites along the Volga shows continuity of forest-river settlement patterns, ancestor veneration, and fire rituals. Later accounts describe forest and water worship among Finno-Ugric and Turkic peoples.",
      sources: [
        "Chernykh, The Steppes and the Sown",
        "Dolukhanov, The Early Slavs",
        "Khazanov, Nomads and the Outside World",
      ],
      limitation:
        "Early written records are late and often from outsiders; this entry combines diverse Finno-Ugric and proto-Turkic traditions across centuries.",
    },
  },
  {
    id: "scythian-practice",
    label: "Scythian religious practice",
    scope: { years: [-900, 100], bounds: [25, 38, 130, 60] },
    powers: [
      { name: "Tabiti", domain: "the sky, the herd", rank: "paramount" },
      {
        name: "Thagimasadas",
        domain: "the hearth, the tent, family",
        rank: "major",
      },
      {
        name: "Api",
        domain: "the earth, crops, fertility",
        rank: "major",
      },
      { name: "Papaios", domain: "ancestor of all Scythians", rank: "major" },
      {
        name: "The ancestors",
        domain: "the royal and warrior dead",
        rank: "major",
      },
      {
        name: "Ares",
        domain: "war and weapons, iron swords",
        rank: "local",
      },
      {
        name: "The spring or well",
        domain: "water of a camp or grazing ground",
        rank: "local",
      },
    ],
    practice: [
      "An iron sword planted upright is an altar to Ares and receives blood-oath sacrifices.",
      "A great horse is sacrificed at the death of a king; the dead king is embalmed and buried with horses, weapons and slaves.",
      "Mares' milk is given to the sky at dawn.",
      "A priestess-oracle speaks for Tabiti in her temple or outdoor sanctuary.",
    ],
    specialist: "The priestess oracle; the king for royal sacrifice.",
    afterlife: "A joining with the ancestors and Papaios in a sky realm.",
    evidence: {
      status: "documented",
      claim:
        "Herodotus describes Scythian altars, sacrifice, and priestesses; archaeological evidence of kurgan burials, sacrificed horses, and the iron sword cult confirms the pattern.",
      sources: [
        "Herodotus, Histories Book 4",
        "Davis-Kimball, Warrior Women",
        "Rolle, The World of the Scythians",
      ],
      limitation:
        "Herodotus wrote from Greek outsiders' perspective; the iron sword cult is inferred from burials rather than contemporary texts.",
    },
  },
  {
    id: "post-scythian-steppe",
    label: "Post-Scythian steppe and Central Asian pastoral practice",
    scope: { years: [-250, 550], bounds: [40, 38, 110, 56] },
    powers: [
      {
        name: "Tengri",
        domain: "the sky, destiny, the chiefs",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "the shamanic dead and past leaders",
        rank: "major",
      },
      {
        name: "The Earth",
        domain: "the land, fertility, the camps",
        rank: "major",
      },
      {
        name: "The spirit of the mountain",
        domain: "sacred peaks where power passes",
        rank: "major",
      },
      {
        name: "The fire",
        domain: "purification, home, offerings",
        rank: "local",
      },
      {
        name: "Water and springs",
        domain: "fertility, safe passage, health",
        rank: "local",
      },
      {
        name: "The shamans' spirits",
        domain: "illness, recovery, the hidden world",
        rank: "local",
      },
    ],
    practice: [
      "The chief sacrifices a white horse to Tengri at the spring gathering.",
      "Fire is circled around a new bride and around the tent at night for protection.",
      "Shamans drum and speak in ancestor voices to diagnose sickness and guide decisions.",
      "A mountain is marked with a pile of stones; travelers add stones and speak their need.",
    ],
    specialist:
      "The shamans who maintain the hidden world; the chief as Tengri's voice.",
    afterlife:
      "The shamans claim the dead return to the sky; shamans consult them for the living.",
    evidence: {
      status: "inferred",
      claim:
        "The transition between Scythian iron-sword practice and later Turkic Tengri worship shows continuity in sky reverence, shamanic mediation, and ancestor consultation. Chinese sources describe post-Scythian steppe peoples with these practices.",
      sources: [
        "Di Cosmo, The Jurchens and Khitans",
        "Barfield, The Perilous Frontier",
        "Christian, A History of Russia, Central Asia and Mongolia",
      ],
      limitation:
        "Few direct sources; continuity is inferred from archaeological distribution and later ethnographic accounts.",
    },
  },
  {
    id: "xiongnu-steppe",
    label: "Xiongnu steppe confederation practice",
    scope: { years: [-300, 200], bounds: [60, 38, 140, 62] },
    powers: [
      {
        name: "Tengri",
        domain: "the sky, destiny, the khans",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "the shamanic dead and past khans",
        rank: "major",
      },
      {
        name: "The Earth",
        domain: "the land, prosperity, the camps",
        rank: "major",
      },
      {
        name: "The spirit of the mountain",
        domain: "a sacred peak where khans take power",
        rank: "local",
      },
      {
        name: "The fire",
        domain: "purification, home, offerings",
        rank: "local",
      },
      {
        name: "Water and springs",
        domain: "fertility, safe passage, health",
        rank: "local",
      },
      {
        name: "The shamans' spirits",
        domain: "illness, recovery, the hidden world",
        rank: "local",
      },
    ],
    practice: [
      "The khan sacrifices a white horse to Tengri at the great spring gathering.",
      "Fire is passed under a new bride's feet and circled around the tent at night.",
      "Shamans drum at night and speak in the voice of ancestors to diagnose sickness.",
      "A mountain is marked with a pile of stones; travelers add stones and speak their need.",
    ],
    specialist:
      "The shamans who maintain the hidden world; the khan as Tengri's earthly voice.",
    afterlife:
      "The shamans claim the dead return to the sky but are consulted by the shamans.",
    evidence: {
      status: "inferred",
      claim:
        "Chinese sources describe Xiongnu sky worship and shamanism; later Mongol practice preserves elements suggesting continuity of a steppe cosmology centered on Tengri and ancestral shamans.",
      sources: [
        "Sima Qian, Records of the Grand Historian",
        "Di Cosmo, The Jurchens and Khitans",
        "Barfield, The Perilous Frontier",
      ],
      limitation:
        "Chinese sources are outsiders' accounts; the Xiongnu left no written records of their own beliefs.",
    },
  },
  {
    id: "turkic-tengrism",
    label: "Early Turkic Tengrism",
    scope: { years: [550, 900], bounds: [50, 38, 130, 58] },
    powers: [
      {
        name: "Tengri",
        domain: "the sky, destiny, the khans",
        rank: "paramount",
      },
      {
        name: "The Earth Mother",
        domain: "the land, fertility, the tent",
        rank: "major",
        relation: { kind: "consort-of", of: "Tengri" },
      },
      {
        name: "The ancestors",
        domain: "guidance of the living khans",
        rank: "major",
      },
      {
        name: "The sacred mountain",
        domain: "center of the world, the khans' seat",
        rank: "local",
      },
      {
        name: "The water spirits",
        domain: "rivers and springs, purification",
        rank: "local",
      },
      {
        name: "The fire",
        domain: "the home, blessing, sacred oaths",
        rank: "local",
      },
      {
        name: "The spirits of animals",
        domain: "horses, hunting, the wild",
        rank: "local",
      },
    ],
    practice: [
      "A new khan is legitimized by Tengri; oath-taking involves fire and water.",
      "The sacred mountain is visited by shamans seeking Tengri's will.",
      "Fire is protected and honored; a woman stepping over it brings shame.",
      "Springs are left undisturbed and marked with stones and cloth.",
    ],
    specialist: "Shamans who ascend to Tengri; the khan as his chosen vessel.",
    afterlife:
      "The spirit joins Tengri in the sky; shamans become guide-ancestors.",
    evidence: {
      status: "inferred",
      claim:
        "Early Turkic inscriptions and tomb stones mention Tengri and khans; later Mongol and Islamic sources preserve shamanic elements suggesting an organized Turkic cosmology.",
      sources: [
        "Orkun, The History of Turkish Language",
        "Golden, An Introduction to the History of the Turkic Peoples",
        "Sinor, The Turks in the Early Islamic World",
      ],
      limitation:
        "Turkic runic inscriptions are sparse and formulaic; much is inferred from later Mongol practice and Islamic accounts of pre-conversion beliefs.",
    },
  },
  {
    id: "sogdian-zoroastrianism",
    label: "Sogdian Zoroastrian and Manichaean practice",
    scope: { years: [-300, 1000], bounds: [50, 35, 80, 50] },
    powers: [
      {
        name: "Ahura Mazda",
        domain: "wisdom, light, the good creation",
        rank: "paramount",
      },
      {
        name: "The good spirits",
        domain: "health, righteousness, increase",
        rank: "major",
      },
      {
        name: "Ahriman",
        domain: "darkness, deceit, disease",
        rank: "major",
      },
      {
        name: "Fire",
        domain: "purification, the sacred element",
        rank: "local",
      },
      {
        name: "Water",
        domain: "cleansing, protection, life",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "aid to the merchant house",
        rank: "local",
      },
    ],
    practice: [
      "Fire temples are maintained; the sacred fire is fed sandalwood and ceremonies mark the seasons.",
      "At meals, a portion is set aside for the poor and the spirits.",
      "A corpse is exposed on a tower to avoid defiling the earth and fire.",
      "A merchant wears a sacred cord and mark; business oaths are sworn on fire.",
    ],
    specialist: "Fire priests who tend the temple; a magi for rituals.",
    afterlife:
      "The soul crosses a bridge; the righteous go to light, the wicked to darkness.",
    evidence: {
      status: "documented",
      claim:
        "Sogdian merchant colonies in China and Central Asia maintain fire temples; texts preserve Zoroastrian and Manichaean prayers and cosmology.",
      sources: [
        "Daryaee, Sasanian Persia",
        "Lieu, Manichaeism in Central Asia and China",
        "Litvinsky, The Twilight of Zoroastrianism",
      ],
      limitation:
        "Most sources are from the cosmopolitan cities; rural Sogdian practice may have differed, and Manichaeism's overlay is later.",
    },
  },
  {
    id: "tibetan-bon",
    label: "Tibetan Bon tradition",
    scope: { years: [-800, 1200], bounds: [75, 25, 105, 40] },
    powers: [
      { name: "The sky", domain: "the high realm, purity", rank: "paramount" },
      {
        name: "The earth",
        domain: "the lower realm, fertility, crops",
        rank: "major",
      },
      {
        name: "Water and rivers",
        domain: "life, purification, flow",
        rank: "major",
      },
      {
        name: "The mountain master",
        domain: "a sacred peak, protection, danger",
        rank: "local",
      },
      {
        name: "The valley spirits",
        domain: "local water, pasture, settlement",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the clan and its lands",
        rank: "local",
      },
      {
        name: "The hearth",
        domain: "the house, protection, luck",
        rank: "local",
      },
      {
        name: "Wild animals and demons",
        domain: "the untamed landscape",
        rank: "local",
      },
    ],
    practice: [
      "A stone cairn (lha-rtse) is built on a pass; people add stones and circle clockwise.",
      "A mountain is walked around to honor its master; prayer flags are strung on high places.",
      "The dead are offered water; sky burial returns the body to the birds.",
      "Ritual fire is lit at dawn; juniper smoke marks the beginning of the day.",
    ],
    specialist:
      "The Bon po priest or shaman; the head of a clan for family rites.",
    afterlife:
      "The spirit ascends to the sky or returns through rebirth; the body is returned to nature.",
    evidence: {
      status: "inferred",
      claim:
        "Tibetan texts preserve Bon teachings; Buddhist accounts describe Bon practice in detail as they encountered and absorbed it. Sky burial, sacred mountains, and water worship appear in both traditions.",
      sources: [
        "Karmay, The Arrow and the Spindle",
        "Blondeau, Religions of Tibet in Practice",
        "Samuel, Civilized Shamans",
      ],
      limitation:
        "Bon texts were recorded late and often intermixed with Buddhist material; early Bon is reconstructed from critique by Buddhist sources.",
    },
  },
  {
    id: "siberian-shamanism",
    label: "Siberian shamanic practice",
    scope: { years: [-1000, 1950], bounds: [25, 35, 180, 90] },
    powers: [
      {
        name: "The sky father",
        domain: "the high realm, destiny",
        rank: "paramount",
      },
      {
        name: "The earth mother",
        domain: "the lower realm, animals, fertility",
        rank: "major",
        relation: { kind: "consort-of", of: "The sky father" },
      },
      {
        name: "The ancestors",
        domain: "guidance, shamanic power",
        rank: "major",
      },
      {
        name: "The master of the taiga",
        domain: "bears, game, the forest",
        rank: "local",
      },
      {
        name: "The water master",
        domain: "rivers, fish, safe travel",
        rank: "local",
      },
      {
        name: "The house spirit",
        domain: "the hearth, protection, prosperity",
        rank: "local",
      },
    ],
    practice: [
      "A shaman drums through the night to journey to the sky and retrieve a lost soul.",
      "The first kill of a hunt is offered to the master of the animals with gratitude.",
      "A drum hangs in the house to ward off malicious spirits.",
      "At the solstice, offerings of fat and meat are left in the forest for the masters.",
    ],
    specialist:
      "The shaman, marked by illness or inheritance, who travels between realms.",
    afterlife:
      "A shaman's soul may become a helper spirit; the ordinary dead join the earth mother.",
    evidence: {
      status: "documented",
      claim:
        "Russian colonial records, ethnographic studies from the 19th and 20th centuries, and contemporary indigenous practice describe shamanic cosmology, drum use, and animal sacrifice across Siberian peoples.",
      sources: [
        "Eliade, Shamanism",
        "Dioszegi, Popular Beliefs and Folklore Tradition in Siberia",
        "Humphrey, Shamans and Elders",
      ],
      limitation:
        "Russian colonial and Soviet ethnography sometimes misinterpreted or distorted shamanic practice; 20th-century practices reflect centuries of disruption and change.",
    },
  },
  {
    id: "central-asian-islam",
    label: "Central Asian Islamic practice with Sufi and shrine elements",
    scope: { years: [900, 1900], bounds: [45, 32, 85, 50] },
    powers: [
      {
        name: "Allah",
        domain: "the divine, creation, judgment",
        rank: "paramount",
      },
      {
        name: "The Prophet Muhammad",
        domain: "the messenger, intercession",
        rank: "major",
      },
      {
        name: "The saints",
        domain: "blessing, healing, intercession with Allah",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "continued presence at sacred tombs",
        rank: "local",
      },
      {
        name: "A holy man's tomb or shrine",
        domain: "a pilgrimage site, local blessing",
        rank: "local",
      },
      {
        name: "The sacred water of a spring or well",
        domain: "healing, blessing, fertility",
        rank: "local",
      },
    ],
    practice: [
      "A shrine tomb (mazar) is visited with gifts of cloth and coin; women pray for children.",
      "A Sufi teacher's circle gathers to sing, dance, and seek closeness to Allah.",
      "A wedding includes a mullah's blessing and the bride circling fire or walking over salt.",
      "The graves of the pious are visited at festival time with food, cloth, and prayer.",
    ],
    specialist:
      "The mullah and the Sufi teacher; the keeper of a shrine or holy site.",
    afterlife:
      "Judgment by Allah and eternal reward or punishment; the righteous intercede.",
    evidence: {
      status: "documented",
      claim:
        "Medieval Islamic geographies and later ethnographic accounts describe shrine devotion, Sufi orders, and local practice across Central Asia; archaeological evidence of mazar complexes confirms long histories.",
      sources: [
        "Al-Muqaddasi, The Best Divisions for Knowledge of the Regions",
        "DeWeese, Islamization and Native Religion in the Golden Horde",
        "Abramson and Karatayev, Central Asia in the Quranic Tradition",
      ],
      limitation:
        "Islamic scholars sometimes criticized shrine practice as heterodox; ethnographic accounts from Soviet-era researchers are ideologically colored.",
    },
  },
  {
    id: "mongol-chinggis",
    label: "Mongol practice under Chinggis Khan",
    scope: { years: [1150, 1280], bounds: [55, 38, 135, 58] },
    powers: [
      {
        name: "Tengri",
        domain: "the sky, Chinggis's mandate",
        rank: "paramount",
      },
      {
        name: "The Earth Mother",
        domain: "the land and its fertility",
        rank: "major",
        relation: { kind: "consort-of", of: "Tengri" },
      },
      {
        name: "The ancestors",
        domain: "Chinggis's lineage, shamanic guide-spirits",
        rank: "major",
      },
      {
        name: "The sacred mountain",
        domain: "Burhan Khaldun, center of power",
        rank: "local",
      },
      {
        name: "Sacred waters",
        domain: "rivers, springs, life",
        rank: "local",
      },
      {
        name: "The fire",
        domain: "purification, honor, the clan",
        rank: "local",
      },
      {
        name: "The spirits of enemies' lands",
        domain: "conquered territories and their masters",
        rank: "local",
      },
    ],
    practice: [
      "A great kurultai gathers at sacred Burhan Khaldun for offerings and oath-swearing.",
      "A rider never crosses running water carelessly; rivers are addressed with respect.",
      "Fire is central to a ger; a person is never struck over fire.",
      "A new conquest brings shamanic consultation and offerings to the spirits of the land.",
    ],
    specialist:
      "Shamans who speak for Tengri and guide-ancestors; the khan as Tengri's agent.",
    afterlife:
      "The soul joins the ancestors and Tengri; shamans bridge the living and dead.",
    evidence: {
      status: "documented",
      claim:
        "Mongol sources (The Secret History), Persian historians (Rashid al-Din), and Chinese accounts all describe Tengri worship, ancestor veneration, and sacred geography under Chinggis.",
      sources: [
        "Secret History of the Mongols",
        "Rashid al-Din, Jami' al-tawarikh",
        "Allsen, The Cultural Mosaic of the Mongol Empire",
      ],
      limitation:
        "Accounts mix shamanism, ancestor cults, and later Buddhist and Islamic influences; the core Mongol practice is sometimes obscured.",
    },
  },
  {
    id: "siberian-russian-hybrid",
    label: "Russian colonial-era Siberian hybrid practice",
    scope: { years: [1600, 1900], bounds: [60, 48, 180, 80] },
    powers: [
      {
        name: "God",
        domain: "the Orthodox Christian divine",
        rank: "paramount",
      },
      {
        name: "The saints",
        domain: "intercession, protection, healing",
        rank: "major",
      },
      {
        name: "The spirits of the land",
        domain: "the taiga, rivers, mountains",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the settlement, guidance",
        rank: "local",
      },
      {
        name: "The master of the taiga",
        domain: "bears, game, the wild",
        rank: "local",
      },
      {
        name: "The house spirit",
        domain: "the hearth, luck, protection",
        rank: "local",
      },
    ],
    practice: [
      "A church and an icon corner mark a settlement; Orthodox rituals frame the calendar.",
      "Offerings are still left in the forest for the master of animals.",
      "A shaman may be consulted quietly despite Orthodox prohibition.",
      "A shrine to a local spirit coexists with Orthodox chapels and village rituals.",
    ],
    specialist:
      "The Orthodox priest; the elder or shaman continues in unofficial practice.",
    afterlife:
      "Orthodox heaven and hell compete with older beliefs in the spirit world.",
    evidence: {
      status: "documented",
      claim:
        "Russian colonial records, 19th-century ethnographers, and Soviet-era anthropology document the coexistence and tension between Orthodox Christianity and indigenous Siberian shamanism.",
      sources: [
        "Slezkine, Arctic Mirrors",
        "Crummey, Old Believers in Russian Society",
        "Anderson, Living in the Land of Hunger",
      ],
      limitation:
        "Orthodox authorities emphasized conversion; actual practice was syncretic and varied widely by region and community.",
    },
  },
  {
    id: "tarim-basin-peoples",
    label: "Tarim Basin oasis and desert practice",
    scope: { years: [-1000, 1900], bounds: [75, 35, 95, 44] },
    powers: [
      {
        name: "The sky",
        domain: "weather, drought, survival",
        rank: "paramount",
      },
      {
        name: "The water spirits",
        domain: "rivers, aquifers, oases",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the oasis settlement and its dead",
        rank: "major",
      },
      {
        name: "The spirits of the desert",
        domain: "demons, mirages, the wasteland",
        rank: "major",
      },
      {
        name: "The oasis master",
        domain: "a sacred grove or spring",
        rank: "local",
      },
      {
        name: "The hearth fire",
        domain: "the house, family, warmth",
        rank: "local",
      },
      {
        name: "Protection spirits",
        domain: "against demons and sandstorm",
        rank: "local",
      },
    ],
    practice: [
      "A well is offered libations at dawn and dusk; water is treated with reverence.",
      "The dead are buried at the oasis edge; stones mark graves against sandstorm burial.",
      "A shrine to a spirit marks an oasis; travelers leave offerings for safe passage.",
      "Rituals mark the seasons and the date harvest; ancestors are called upon.",
    ],
    specialist: "An elder or healer who knows the spirits of the oasis.",
    afterlife:
      "The dead dwell in the underworld but return to aid the oasis and its living.",
    evidence: {
      status: "inferred",
      claim:
        "Archaeological sites in the Tarim Basin show long continuity of oasis settlement, cemetery practices, and evidence of water worship. Texts describe desert demons and oasis spirits in later accounts.",
      sources: [
        "Wood, The Silk Road",
        "Mallory and Mair, The Tarim Mummies",
        "Pletcher, The Silk Road",
      ],
      limitation:
        "Early records are sparse; this entry combines varied oasis traditions into one generalized system.",
    },
  },
  {
    id: "post-mongol-steppe",
    label: "Post-Mongol Turkic and Tatar steppe practice",
    scope: { years: [1300, 1700], bounds: [40, 40, 120, 60] },
    powers: [
      {
        name: "Tengri",
        domain: "the sky, destiny, power",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "the khans and the shamans",
        rank: "major",
      },
      {
        name: "The sacred mountain",
        domain: "peaks where khans gather",
        rank: "major",
      },
      {
        name: "The Earth Mother",
        domain: "the land, fertility, camps",
        rank: "major",
      },
      {
        name: "Fire",
        domain: "purification, the ger, honor",
        rank: "local",
      },
      {
        name: "Water and springs",
        domain: "blessing, crossing, fertility",
        rank: "local",
      },
      {
        name: "The shamans' spirits",
        domain: "communication with Tengri",
        rank: "local",
      },
    ],
    practice: [
      "A new leader takes oath at a sacred mountain; shamans confirm Tengri's choice.",
      "Fire is central to all ceremonies; water and fire are used in purification.",
      "The ancestors are consulted through shamans; their guidance shapes decisions.",
      "Springs and mountain passes receive offerings; stones are added by travelers.",
    ],
    specialist:
      "Shamans who commune with Tengri; the leader as Tengri's vessel.",
    afterlife:
      "The spirit joins Tengri; shamans become guide-ancestors to their heirs.",
    evidence: {
      status: "documented",
      claim:
        "Chinese and Persian sources describe post-Mongol Turkic practices; Crimean Tatar and Kazakh ethnographic records show continuity of Tengri worship and shamanic leadership.",
      sources: [
        "Reubreni, History of the Tatars",
        "Khazanov, Nomads and the Outside World",
        "Finkel, Osman's Dream",
      ],
      limitation:
        "Islamic conversion was gradual; accounts show layering of Tengri practice and Islamic practice in the same communities.",
    },
  },
  {
    id: "far-northeast-siberia",
    label: "Far northeast Siberia and Arctic peoples",
    scope: { years: [-2000, 1950], bounds: [25, 35, 180, 90] },
    powers: [
      {
        name: "The sky",
        domain: "weather, spirits, the high realm",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "guide-spirits and the shamanic dead",
        rank: "major",
      },
      {
        name: "The master of the animals",
        domain: "seals, whales, walrus, fish",
        rank: "major",
      },
      {
        name: "The fire",
        domain: "the hearth, warmth, protection",
        rank: "local",
      },
      {
        name: "The sea spirits",
        domain: "safe hunting and passage",
        rank: "local",
      },
      {
        name: "The mountain master",
        domain: "peaks, passes, shelter",
        rank: "local",
      },
      {
        name: "The spirits of illness",
        domain: "shamanic work, healing",
        rank: "local",
      },
    ],
    practice: [
      "A shaman drums for a lost soul or speaks with the animal masters.",
      "The first seal or whale is offered with ceremony; bones are kept sacred.",
      "The hearth fire receives a portion of every meal and hunt.",
      "The dead are buried with goods; shamans guide them to the ancestors.",
    ],
    specialist:
      "The shaman, marked by dreams and illness, who travels between worlds.",
    afterlife:
      "Shamans join the guide-ancestors; ordinary dead aid the people through them.",
    evidence: {
      status: "documented",
      claim:
        "Russian colonial records, ethnographic studies from Chukchi, Siberian Yupik, and other Arctic peoples describe shamanism, animal respect, and seal hunting rituals.",
      sources: [
        "Eliade, Shamanism",
        "Dioszegi, Popular Beliefs and Folklore Tradition in Siberia",
        "Humphrey, Shamans and Elders",
      ],
      limitation:
        "Most accounts from 19th-20th centuries; Soviet ethnography sometimes distorted practices.",
    },
  },
  {
    id: "volga-river-peoples-medieval",
    label: "Medieval and early modern Volga river peoples",
    scope: { years: [600, 1800], bounds: [40, 48, 70, 65] },
    powers: [
      {
        name: "The sky",
        domain: "thunder, fate, the high realm",
        rank: "paramount",
      },
      {
        name: "The river",
        domain: "the Volga, trade, life",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the settlement and lineage",
        rank: "major",
      },
      {
        name: "The forest",
        domain: "game, furs, the wild",
        rank: "major",
      },
      {
        name: "Water spirits",
        domain: "wells, springs, crossings",
        rank: "local",
      },
      {
        name: "The hearth fire",
        domain: "the house, family, blessing",
        rank: "local",
      },
      {
        name: "The earth and crops",
        domain: "fertility, the harvest",
        rank: "local",
      },
    ],
    practice: [
      "Offerings to the river and forest mark the seasons and trade ventures.",
      "A new household is blessed; fire marks transitions and ceremonies.",
      "The dead are buried with goods; mounds mark graves.",
      "Spring and autumn bring collective offerings and shamanic consultation.",
    ],
    specialist: "The eldest; shamans and healers who know the spirits.",
    afterlife:
      "The dead dwell with ancestors; shamans consult them for the living.",
    evidence: {
      status: "inferred",
      claim:
        "Archaeological sites along the Volga show settlement continuity, burial mounds, and ritual practices. Later ethnographic accounts describe Finno-Ugric and early Turkic traditions of forest and water worship.",
      sources: [
        "Chernykh, The Steppes and the Sown",
        "DeWeese, Islamization and Native Religion in the Golden Horde",
        "Khazanov, Nomads and the Outside World",
      ],
      limitation:
        "Early records are from outsiders; practices blended with incoming Islam and Orthodoxy.",
    },
  },
];
