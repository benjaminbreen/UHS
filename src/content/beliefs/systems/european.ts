import type { BeliefSystem } from "../types";

export const european: readonly BeliefSystem[] = [
  {
    id: "europe-foragers",
    label: "European forager practice",
    scope: { years: [-40000, -3000], bounds: [-25, 34, 48, 72] },
    powers: [
      {
        name: "The hunt",
        domain: "game animals, the chase, weapons",
        rank: "paramount",
      },
      {
        name: "The forest",
        domain: "trees, shelter, plant food",
        rank: "major",
      },
      {
        name: "The river",
        domain: "fish, water, travel",
        rank: "major",
      },
      {
        name: "The sky",
        domain: "weather, seasons, stars",
        rank: "major",
      },
      {
        name: "Fire",
        domain: "warmth, cooking, gathering",
        rank: "major",
      },
      {
        name: "The animals",
        domain: "their spirits, their help",
        rank: "major",
      },
      {
        name: "The elders",
        domain: "knowledge, stories, the past",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the dead of the band",
        rank: "local",
      },
      {
        name: "The camp",
        domain: "shelter, gathering place",
        rank: "local",
      },
      {
        name: "The place itself",
        domain: "the land, its spirits",
        rank: "local",
      },
    ],
    practice: [
      "Successful hunters share their kill with the band.",
      "Plants gathered seasonally are preserved and stored.",
      "Fire is kept alive; hearths mark camp and kin.",
      "The dead are buried with ochre and grave goods.",
    ],
    specialist: "An elder or shaman knows the songs and stories.",
    afterlife:
      "The dead join the ancestors; the living speak to them in dreams.",
    evidence: {
      status: "hypothesis",
      claim:
        "European forager practice 8000–3000 BCE is inferred from archaeological sites with hearths, animal bones, stone tools, ochre graves and band-level camps across the continent.",
      sources: [
        "Bailey & Milner, Archaeology of Prehistoric Britain",
        "Gamble, The Paleolithic Societies of Europe",
        "Mithen, The Prehistory of the Mind",
      ],
      limitation:
        "Spiritual practice leaves no direct evidence; this is a plausible reconstruction from material culture and ethnographic parallels.",
    },
  },
  {
    id: "europe-early-farming",
    label: "European early farming practice",
    scope: { years: [-3000, 400], bounds: [-25, 34, 48, 72] },
    powers: [
      {
        name: "The earth mother",
        domain: "grain, soil, fertility",
        rank: "paramount",
      },
      {
        name: "The sky father",
        domain: "rain, lightning, storms",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the land of the dead, the herd",
        rank: "major",
      },
      {
        name: "The herd",
        domain: "cattle, sheep, prosperity",
        rank: "major",
      },
      {
        name: "The fire",
        domain: "the hearth, the home",
        rank: "major",
      },
      {
        name: "The waters",
        domain: "rivers, springs, wells",
        rank: "major",
      },
      {
        name: "The sacred tree",
        domain: "the oak, the shrine",
        rank: "local",
      },
      {
        name: "The house spirit",
        domain: "the dwelling, its fortune",
        rank: "local",
      },
      {
        name: "The fields",
        domain: "boundaries, property",
        rank: "local",
      },
      {
        name: "The stones",
        domain: "markers, passage graves",
        rank: "local",
      },
    ],
    practice: [
      "Seed grain is blessed before planting.",
      "The first harvest is offered at a shrine.",
      "Animals are sacrificed at boundary stones.",
      "The dead are buried in communal tombs with the family's goods.",
    ],
    specialist: "An elder or priest tends the shrine.",
    afterlife:
      "The dead dwell with the ancestors in the earth; the living leave offerings.",
    evidence: {
      status: "hypothesis",
      claim:
        "Early farming practice 3000–500 BCE is inferred from settlement patterns, passage graves, cultivation remains, sacrifice sites, and archaeological evidence of household shrines.",
      sources: [
        "Renfrew, Before Civilization",
        "Scarre, Prehistoric Europe",
        "Insoll, Archaeology of Religion",
      ],
      limitation:
        "Extremely diverse region and timescale; this is a synthetic sketch covering vast variation.",
    },
  },

  {
    id: "aegean-bronze-age",
    label: "Mycenaean Aegean practice",
    scope: { years: [-1600, -1100], bounds: [19, 35, 29, 42] },
    powers: [
      { name: "Zeus", domain: "sky, kingship, oaths", rank: "paramount" },
      {
        name: "Hera",
        domain: "the palace, women, cattle",
        rank: "major",
        relation: { kind: "consort-of", of: "Zeus" },
      },
      {
        name: "Poseidon",
        domain: "the sea, horses, earthquakes",
        rank: "major",
      },
      { name: "Athena", domain: "craft, war, cities", rank: "major" },
      {
        name: "Ares",
        domain: "battle, bloodshed",
        rank: "major",
        relation: { kind: "child-of", of: "Zeus" },
      },
      { name: "Apollo", domain: "plague, healing, prophecy", rank: "major" },
      { name: "Artemis", domain: "wild animals, the hunt", rank: "major" },
      { name: "The palace hearth", domain: "the house, fire", rank: "local" },
      { name: "Hermes", domain: "flocks, travel, boundaries", rank: "local" },
      {
        name: "The ancestors",
        domain: "the lineage of the house",
        rank: "local",
      },
    ],
    practice: [
      "Burnt offerings at the palace altar for the great gods.",
      "The hearth fire keeps household members safe and bound.",
      "Travelers leave stones or branches at boundary marks for Hermes.",
      "Graves hold goods for the dead to use in the next world.",
    ],
    specialist: "The king or a palace priest.",
    afterlife:
      "The dead go to a shadowy realm beneath the earth; the living must remember them.",
    evidence: {
      status: "documented",
      claim:
        "Palace shrines and Linear B tablets show Zeus, Hera, Poseidon and Athena were worshipped in the Mycenaean world; the domestic hearth cult and belief in an underworld are attested by grave goods and shrine practice.",
      sources: [
        "Chadwick, The Mycenaean World",
        "Ventris & Chadwick, Documents in Mycenaean Greek",
        "Wright, 'A Survey of Aegean Symbols'",
      ],
      limitation:
        "Palace religion may not reflect village practice; most detail comes from later Greek sources projected backwards.",
    },
  },
  {
    id: "classical-greek",
    label: "Classical Greek practice",
    scope: { years: [-500, -323], bounds: [19, 36, 29, 42] },
    powers: [
      { name: "Zeus", domain: "sky, oaths, justice", rank: "paramount" },
      {
        name: "Hera",
        domain: "marriage, the city-state",
        rank: "major",
        relation: { kind: "consort-of", of: "Zeus" },
      },
      { name: "Athena", domain: "wisdom, craft, war", rank: "major" },
      { name: "Apollo", domain: "prophecy, music, medicine", rank: "major" },
      { name: "Poseidon", domain: "the sea, horses", rank: "major" },
      { name: "Aphrodite", domain: "desire, beauty", rank: "major" },
      { name: "Ares", domain: "slaughter, violence", rank: "major" },
      { name: "Hephaestus", domain: "smithcraft, fire", rank: "major" },
      { name: "Hermes", domain: "commerce, travel, theft", rank: "local" },
      { name: "The household gods", domain: "domestic rites", rank: "local" },
      {
        name: "The ancestors",
        domain: "the family line",
        rank: "local",
      },
    ],
    practice: [
      "Public worship at temples on festival days, with animal sacrifice and procession.",
      "Household shrines hold daily offerings of wine, honey and grain.",
      "Omens from bird flight and animal entrails guide major decisions.",
      "The dead receive libations at their tombs on set days.",
    ],
    specialist:
      "Temple priests for state gods; household head for domestic rites.",
    afterlife:
      "Shades pass to the underworld; the virtuous may reach the Elysian fields.",
    evidence: {
      status: "documented",
      claim:
        "The 12 Olympians are well documented in Homer, inscriptions and archaeology; domestic household cult and the role of omens are confirmed by grave goods, shrines in homes, and literary sources.",
      sources: [
        "Burkert, Greek Religion",
        "Parker, Polytheism and Society in Classical Athens",
        "Bruit-Zaidman & Schmitt-Pantel, Religion in the Ancient Greek City",
      ],
      limitation:
        "The picture is largely Athenian; other city-states and rural areas had variant practices.",
    },
  },
  {
    id: "republican-roman",
    label: "Republican Roman practice",
    scope: { years: [-509, -27], bounds: [8, 38, 18, 48] },
    powers: [
      { name: "Jupiter", domain: "the sky, the state, war", rank: "paramount" },
      {
        name: "Juno",
        domain: "the city, women",
        rank: "major",
        relation: { kind: "consort-of", of: "Jupiter" },
      },
      { name: "Mars", domain: "war, agriculture, the wild", rank: "major" },
      { name: "Minerva", domain: "wisdom, craft, the city", rank: "major" },
      { name: "Neptune", domain: "the sea, springs", rank: "major" },
      { name: "Diana", domain: "the hunt, wild places", rank: "major" },
      { name: "Vesta", domain: "the hearth, the city hearth", rank: "major" },
      { name: "Mercury", domain: "commerce, travel, theft", rank: "local" },
      { name: "The lar", domain: "the household, its field", rank: "local" },
      { name: "Penates", domain: "the pantry, plenty", rank: "local" },
      { name: "The ancestors", domain: "the family line", rank: "local" },
    ],
    practice: [
      "Public offerings to Jupiter for the welfare of the state and army.",
      "Each household keeps oil and wine for the lar; a small shrine holds their image.",
      "Augurs read bird flight to determine the gods' will before action.",
      "The dead receive annual gifts on their birthday.",
    ],
    specialist:
      "State priests of the pontifical college; the household head for domestic rites.",
    afterlife: "Shades dwell in a sunless realm ruled by Pluto and Proserpina.",
    evidence: {
      status: "documented",
      claim:
        "Jupiter's paramount position, the triad Jupiter-Juno-Minerva, household lar cult, and augury are well documented in Livy, Ovid, inscriptions and archaeological household shrines.",
      sources: [
        "Scullard, Festivals and Ceremonies of the Roman Republic",
        "Beard et al., Religions of Rome",
        "Fabbri, Lararium: Domestic Religious Spaces",
      ],
      limitation:
        "Republican practice evolved significantly over centuries; rural and urban rites diverged.",
    },
  },
  {
    id: "imperial-roman",
    label: "Imperial Roman practice",
    scope: { years: [-27, 400], bounds: [-20, 15, 50, 72] },
    powers: [
      {
        name: "The Emperor",
        domain: "the state, war, peace",
        rank: "paramount",
      },
      { name: "Jupiter", domain: "sky, justice, empire", rank: "major" },
      {
        name: "Juno",
        domain: "the city, the empress",
        rank: "major",
        relation: { kind: "consort-of", of: "Jupiter" },
      },
      { name: "Mars", domain: "war, soldiers", rank: "major" },
      { name: "Minerva", domain: "craft, wisdom", rank: "major" },
      { name: "Vesta", domain: "fire, continuity, the state", rank: "major" },
      { name: "Neptune", domain: "the sea, trade routes", rank: "major" },
      {
        name: "Diana",
        domain: "the hunt, wild women",
        rank: "major",
      },
      { name: "Mercury", domain: "commerce, gain", rank: "local" },
      { name: "The lar", domain: "the household and field", rank: "local" },
      {
        name: "Penates",
        domain: "storage, grain, enough",
        rank: "local",
      },
      {
        name: "The household dead",
        domain: "ancestors, the family line",
        rank: "local",
      },
    ],
    practice: [
      "The imperial cult unites the empire; towns hold festivals for the Emperor's day.",
      "Each house maintains a shrine to the lar with oil, wine and bread.",
      "Amulets ward against the evil eye; salt and iron are kept for protection.",
      "Graves hold coins for the ferryman and goods for the afterlife.",
    ],
    specialist:
      "Imperial priests and town magistrates for state cults; the household head at home.",
    afterlife:
      "Shades cross the river Styx with a coin; most dwell in the underworld.",
    evidence: {
      status: "documented",
      claim:
        "The imperial cult is attested across inscriptions and cities; household lares and Penates appear in Pompeian shrines, literature, and legal texts. Amulet use is shown by archaeological finds.",
      sources: [
        "Price, Rituals and Power",
        "Taylor, Roman Household Religious Objects",
        "Wallace-Hadrill, Houses and Society in Pompeii and Herculaneum",
      ],
      limitation:
        "The empire spanned centuries and continents; this summarizes the Mediterranean core.",
    },
  },
  {
    id: "celtic-britain",
    label: "Iron Age British Celtic practice",
    scope: { years: [-100, 400], bounds: [-25, 40, 5, 72] },
    powers: [
      {
        name: "The ancestors",
        domain: "the tribe, its land, its dead",
        rank: "paramount",
      },
      {
        name: "The war god",
        domain: "battle, weapons, the warrior",
        rank: "major",
      },
      {
        name: "The sovereignty goddess",
        domain: "the land, the tribe, cattle",
        rank: "major",
      },
      {
        name: "The sun",
        domain: "light, time, healing",
        rank: "major",
      },
      {
        name: "The waters",
        domain: "rivers, lakes, the sea",
        rank: "major",
      },
      {
        name: "The head",
        domain: "the warrior's strength, soul",
        rank: "major",
      },
      { name: "The hearth", domain: "the roundhouse, family", rank: "local" },
      {
        name: "The well or spring",
        domain: "healing water, fortune",
        rank: "local",
      },
      {
        name: "The hero of the tribe",
        domain: "protection, precedent",
        rank: "local",
      },
      {
        name: "The household dead",
        domain: "ancestors in the hill",
        rank: "local",
      },
    ],
    practice: [
      "Heads of fallen enemies are displayed to retain their power.",
      "Weapons and treasures are thrown into lakes as gifts to the gods.",
      "Wells and springs are visited for healing and prophecy.",
      "The dead are buried with weapons, food and ornaments.",
    ],
    specialist: "The druid or bard; the chieftain for war-gods.",
    afterlife:
      "The dead dwell in the ancestral mound or a land across the sea, unchanged.",
    evidence: {
      status: "inferred",
      claim:
        "No written accounts exist; the practice is inferred from archaeological deposits (weapon burials, votive hoards in water, trepanned skulls), Roman accounts of British Celts, and later Irish texts mentioning druids.",
      sources: [
        "Cunliffe, Iron Age Britain",
        "Green, Dying for the Gods: Human Sacrifice in Iron Age and Roman Europe",
        "Caesar, Gallic Wars (on British druids)",
      ],
      limitation:
        "Iron Age Britain likely had varied practices; the picture is a scholarly reconstruction.",
    },
  },
  {
    id: "celtic-gaul",
    label: "Iron Age Gallic practice",
    scope: { years: [-500, 100], bounds: [-5, 42, 8, 51] },
    powers: [
      { name: "The tribe", domain: "unity, the land, war", rank: "paramount" },
      {
        name: "Toutatis",
        domain: "the people, protection",
        rank: "major",
      },
      {
        name: "Taranis",
        domain: "thunder, war, the wheel",
        rank: "major",
      },
      {
        name: "Esus",
        domain: "timber, horses, war",
        rank: "major",
      },
      {
        name: "Epona",
        domain: "horses, fertility, the road",
        rank: "major",
      },
      {
        name: "The waters",
        domain: "rivers, rivers' power",
        rank: "major",
      },
      {
        name: "Belenos",
        domain: "sun, healing, crafts",
        rank: "local",
      },
      {
        name: "The well",
        domain: "spring water, healing",
        rank: "local",
      },
      {
        name: "The hearth",
        domain: "the house, fire",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "lineage, the dead",
        rank: "local",
      },
    ],
    practice: [
      "Weapons and torcs are thrown into rivers as gifts.",
      "Springs and wells are tended; sick people bathe in them.",
      "The druid reads omens in bird flight and the entrails of dogs.",
      "Warriors wear amulets and horned helmets for battle strength.",
    ],
    specialist: "Druids oversee all major rites.",
    afterlife:
      "The soul transmigrates to another body; the dead are buried with weapons and food.",
    evidence: {
      status: "inferred",
      claim:
        "Celtic Gaul left no writing; practice is inferred from archaeological deposits (votive hoards, weapons in rivers), Celtic coin inscriptions, and Greek and Roman accounts of the Gauls.",
      sources: [
        "Brunaux, Sanctuaries of Gaul",
        "Cunliffe, The Celts",
        "Strabo & Diodorus Siculus, on Gallic practices",
      ],
      limitation:
        "Gaul spanned centuries and diverse tribes; this is a schematic composite.",
    },
  },
  {
    id: "norse-scandinavia",
    label: "Viking Age Norse practice",
    scope: { years: [700, 1300], bounds: [-26, 45, 50, 72] },
    powers: [
      { name: "Odin", domain: "war, death, wisdom, poetry", rank: "paramount" },
      {
        name: "Thor",
        domain: "thunder, strength, oaths",
        rank: "major",
        relation: { kind: "child-of", of: "Odin" },
      },
      { name: "Freyja", domain: "beauty, love, warriors' hall", rank: "major" },
      { name: "Freyr", domain: "summer, fertility, peace", rank: "major" },
      { name: "Tyr", domain: "war, law, oath-keeping", rank: "major" },
      { name: "Loki", domain: "fire, chaos, mischief", rank: "major" },
      {
        name: "The ancestors",
        domain: "the lineage, the dead",
        rank: "major",
      },
      {
        name: "The household spirit",
        domain: "the farm, its luck",
        rank: "local",
      },
      {
        name: "The hearth fire",
        domain: "warmth, gathering, fate",
        rank: "local",
      },
      {
        name: "The river or sea",
        domain: "passage, power",
        rank: "local",
      },
    ],
    practice: [
      "Mead and blood are poured onto the ground for the gods.",
      "Warriors dying in battle are chosen for Odin's hall.",
      "Ships and treasures are burned with the dead.",
      "Stones mark oaths sworn to gods and other men.",
    ],
    specialist:
      "A godi or völva (ritual expert), often the chieftain or a woman.",
    afterlife:
      "Warriors chosen by Odin go to his hall to feast and fight; others reach Hel's realm.",
    evidence: {
      status: "inferred",
      claim:
        "Practices are inferred from Norse sagas, poetry, rune stones, archaeological burials with weapons and ships, and accounts by Arab and Christian travelers.",
      sources: [
        "Sturluson, The Prose Edda",
        "Ellis Davidson, Gods and Myths of Northern Europe",
        "Jesch, Women in the Viking World",
      ],
      limitation:
        "The sagas were written centuries after events; archaeology is incomplete and regional practice varied widely.",
    },
  },
  {
    id: "slavic-paganism",
    label: "Pre-Christian Slavic practice",
    scope: { years: [400, 1100], bounds: [15, 45, 40, 60] },
    powers: [
      {
        name: "Perun",
        domain: "thunder, war, the sky-father",
        rank: "paramount",
      },
      {
        name: "Veles",
        domain: "cattle, wealth, the underworld",
        rank: "major",
        relation: { kind: "child-of", of: "Perun" },
      },
      {
        name: "The Mother Earth",
        domain: "fertility, the fields, grain",
        rank: "major",
      },
      {
        name: "The Water Spirit",
        domain: "rivers, lakes, fish",
        rank: "major",
      },
      {
        name: "Stribog",
        domain: "wind, air, fate",
        rank: "major",
      },
      {
        name: "Dazhbog",
        domain: "the sun, light, wealth",
        rank: "major",
      },
      {
        name: "The fire",
        domain: "the hearth, purification",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the lineage, protection",
        rank: "local",
      },
      {
        name: "The house spirit",
        domain: "the household and its luck",
        rank: "local",
      },
      {
        name: "The tree",
        domain: "the sacred grove, rites",
        rank: "local",
      },
    ],
    practice: [
      "Animals are sacrificed at sacred groves and burned as offerings.",
      "The hearth fire is kept alive; to let it die is catastrophe.",
      "Libations of honey and mead are poured for the dead.",
      "The land and waters are treated as living and aware.",
    ],
    specialist: "A priest or chieftain at the sacred grove.",
    afterlife: "The ancestors remain near the family, watching and guiding.",
    evidence: {
      status: "inferred",
      claim:
        "No contemporary Slavic writings survive; practice is inferred from medieval Christian texts describing pagan rites, place names, folklore, and archaeological shrine sites.",
      sources: [
        "Gimbutas, The Slavs",
        "Rospond, 'Mythological Nomenclature in Slavic Pagan Religion'",
        "The Russian Primary Chronicle, on pre-Christian rites",
      ],
      limitation:
        "Descriptions are by Christian clergy and later folklorists; accuracy is uncertain.",
    },
  },
  {
    id: "frankish-christian-early",
    label: "Early medieval Frankish Christian practice",
    scope: { years: [500, 850], bounds: [-15, 30, 45, 72] },
    powers: [
      { name: "God", domain: "the creator, all power", rank: "paramount" },
      {
        name: "Christ",
        domain: "redemption, salvation",
        rank: "major",
        relation: { kind: "child-of", of: "God" },
      },
      { name: "Mary", domain: "intercession, mercy", rank: "major" },
      {
        name: "The Holy Spirit",
        domain: "sanctity, inspiration",
        rank: "major",
        relation: { kind: "aspect-of", of: "God" },
      },
      { name: "Michael", domain: "war, protection, judgement", rank: "major" },
      { name: "The saints", domain: "intercession, healing", rank: "major" },
      {
        name: "The local saint",
        domain: "the church, the parish",
        rank: "local",
      },
      {
        name: "The Christian dead",
        domain: "the church cemetery, prayer",
        rank: "local",
      },
      {
        name: "The holy cross",
        domain: "protection, blessing",
        rank: "local",
      },
    ],
    practice: [
      "Mass is held on the Lord's day in the church.",
      "Reliquaries of saints are processed for healing and protection.",
      "Crosses are marked on houses and fields.",
      "The dead are buried in consecrated ground by the church.",
    ],
    specialist: "The priest; the abbot or bishop oversees the region.",
    afterlife:
      "The saved reach paradise after judgement; the damned descend to hell.",
    evidence: {
      status: "documented",
      claim:
        "Early medieval Christian practice is documented in Frankish royal decrees, papal letters, penitential texts, and archaeological church and cemetery sites.",
      sources: [
        "Brown, The Rise of Western Christendom",
        "Mitchell, Early Medieval Christianity",
        "Larue, Penitential Practices",
      ],
      limitation:
        "Pagan practices were not fully eradicated; syncretism was widespread and regional.",
    },
  },
  {
    id: "catholic-high-medieval",
    label: "High medieval Catholic practice",
    scope: { years: [1000, 1300], bounds: [-15, 35, 40, 65] },
    powers: [
      {
        name: "God",
        domain: "all power, judgement, eternity",
        rank: "paramount",
      },
      {
        name: "Christ",
        domain: "salvation, the Eucharist, the cross",
        rank: "major",
        relation: { kind: "child-of", of: "God" },
      },
      { name: "Mary", domain: "intercession, mothers, mercy", rank: "major" },
      { name: "Michael", domain: "war, good against evil", rank: "major" },
      { name: "Gabriel", domain: "messages, annunciations", rank: "major" },
      {
        name: "Saint Peter",
        domain: "the Church, keys to heaven",
        rank: "major",
      },
      { name: "The Devil", domain: "temptation, damnation", rank: "major" },
      {
        name: "The local saint",
        domain: "the shrine, miracles, the parish",
        rank: "local",
      },
      {
        name: "The Holy Communion",
        domain: "the bread, Christ present",
        rank: "local",
      },
      { name: "The saints", domain: "aid and healing", rank: "local" },
      {
        name: "The Christian dead",
        domain: "purgatory, prayer by the living",
        rank: "local",
      },
    ],
    practice: [
      "Mass is attended each Sunday; the priest consecrates the bread and wine.",
      "Pilgrims travel to shrines seeking healing and penance.",
      "Reliquaries of saints are processed in procession.",
      "Purgatory exists; the living pray and pay for masses for the dead.",
    ],
    specialist: "The parish priest; bishops and monks oversee wider areas.",
    afterlife:
      "The soul is judged, reaches purgatory for cleansing, then heaven or hell.",
    evidence: {
      status: "documented",
      claim:
        "High medieval Catholic practice is documented in liturgical texts, pilgrim accounts, shrine records, monastic chronicles, and archaeological evidence from churches and shrines.",
      sources: [
        "Sumption, Pilgrimage: An Image of Mediaeval Religion",
        "Bynum, Wonderful Blood: Theology and Practice in Late Medieval Northern Germany",
        "Farmer, Syncretism in High Medieval Christianity",
      ],
      limitation:
        "Rural practice often retained older folk elements; the picture is elite.",
    },
  },
  {
    id: "reformation-protestant",
    label: "Reformation Protestant practice",
    scope: { years: [1500, 1800], bounds: [-26, 30, 50, 72] },
    powers: [
      { name: "God", domain: "all power, predestination", rank: "paramount" },
      {
        name: "Christ",
        domain: "salvation, faith, the Word",
        rank: "major",
        relation: { kind: "child-of", of: "God" },
      },
      {
        name: "The Holy Spirit",
        domain: "faith, inspiration, grace",
        rank: "major",
        relation: { kind: "aspect-of", of: "God" },
      },
      {
        name: "The Bible",
        domain: "God's word, authority",
        rank: "major",
      },
      { name: "The Devil", domain: "temptation, opposition", rank: "major" },
      {
        name: "The Holy Communion",
        domain: "remembrance, grace",
        rank: "major",
      },
      {
        name: "Conscience",
        domain: "individual faith, duty",
        rank: "local",
      },
      {
        name: "The parish",
        domain: "community worship, discipline",
        rank: "local",
      },
      {
        name: "The Christian dead",
        domain: "rest after death; no purgatory",
        rank: "local",
      },
    ],
    practice: [
      "Sermons focus on scripture and salvation by faith alone.",
      "Images and reliquaries are removed from churches.",
      "Individuals study the Bible in their own language.",
      "The dead are simply buried; no prayers or masses for them.",
    ],
    specialist: "The minister, often educated and married.",
    afterlife: "Judgment is swift; paradise or damnation, no middle state.",
    evidence: {
      status: "documented",
      claim:
        "Protestant practice is documented in Reformed confessions, sermons, church records, and the removal and destruction of Catholic imagery attested archaeologically.",
      sources: [
        "Pettegree, The Book in the Renaissance",
        "Ginzburg, The Night Battles",
        "Karant-Nunn, The Reformation of Ritual",
      ],
      limitation:
        "Varied widely by region and sect; this summarizes the mainstream Reformed tradition.",
    },
  },
  {
    id: "orthodox-russia",
    label: "Orthodox Russian practice",
    scope: { years: [1000, 1700], bounds: [15, 40, 50, 72] },
    powers: [
      { name: "God", domain: "all power, eternity", rank: "paramount" },
      {
        name: "Christ",
        domain: "salvation, the Eucharist, icons",
        rank: "major",
        relation: { kind: "child-of", of: "God" },
      },
      {
        name: "Mary",
        domain: "mercy, the protection of Russia",
        rank: "major",
      },
      { name: "Michael", domain: "war, protection", rank: "major" },
      {
        name: "Saint Nicholas",
        domain: "travelers, protection",
        rank: "major",
      },
      {
        name: "The local saint",
        domain: "the city, miracles",
        rank: "major",
      },
      {
        name: "The icon",
        domain: "the presence of the holy",
        rank: "local",
      },
      {
        name: "The Orthodox dead",
        domain: "commemoration, prayer",
        rank: "local",
      },
      {
        name: "The monastery",
        domain: "prayer for the world",
        rank: "local",
      },
    ],
    practice: [
      "Liturgy is sung in Church Slavonic; icons are venerated.",
      "Reliquaries of saints are kept in churches.",
      "Fasting precedes Holy Communion and major feast days.",
      "The dead are commemorated for 40 days then annually.",
    ],
    specialist:
      "The Orthodox priest; metropolitan and monks oversee wider areas.",
    afterlife: "The soul reaches paradise or Hades; the living pray for it.",
    evidence: {
      status: "documented",
      claim:
        "Orthodox Russian practice is documented in liturgical texts, chronicles including the Russian Primary Chronicle, monastic records, and icon traditions.",
      sources: [
        "Mango, Byzantine Architecture",
        "Cormack, Byzantine Art",
        "Ostrowski, 'Church Polemics and Social Doctrine'",
      ],
      limitation:
        "This covers Kievan Rus and the Mongol period; practice evolved significantly.",
    },
  },
  {
    id: "catholic-early-modern",
    label: "Early modern Catholic practice",
    scope: { years: [1500, 1800], bounds: [-26, 30, 50, 72] },
    powers: [
      { name: "God", domain: "all power, creation", rank: "paramount" },
      {
        name: "Christ",
        domain: "salvation, the Eucharist",
        rank: "major",
        relation: { kind: "child-of", of: "God" },
      },
      { name: "Mary", domain: "intercession, mercy, mothers", rank: "major" },
      { name: "Michael", domain: "war, judgement", rank: "major" },
      { name: "The saints", domain: "aid and intercession", rank: "major" },
      {
        name: "Saint James",
        domain: "pilgrims, Spain",
        rank: "major",
      },
      { name: "The Devil", domain: "temptation, possession", rank: "major" },
      {
        name: "The local saint",
        domain: "the shrine, healing",
        rank: "local",
      },
      {
        name: "Purgatory",
        domain: "the dead's cleansing, prayer",
        rank: "local",
      },
      {
        name: "The Eucharist",
        domain: "Christ present in bread",
        rank: "local",
      },
    ],
    practice: [
      "Pilgrims journey to Santiago de Compostela and other shrines.",
      "The Inquisition seeks and punishes heresy.",
      "Reliquaries and images fill churches.",
      "The rosary is said daily in many households.",
    ],
    specialist: "The priest; bishops and the Inquisition hold power.",
    afterlife:
      "Purgatorial cleansing before heaven; the living must pray for the dead.",
    evidence: {
      status: "documented",
      claim:
        "Early modern Catholic practice is documented in confessional manuals, pilgrimage guides, Inquisition records, and church ornaments and altarpieces.",
      sources: [
        "Freedberg, The Power of Images",
        "Christian, Local Religion in Early Modern France",
        "Beltrame, The Cult of Mary in Medieval and Early Modern Literature",
      ],
      limitation:
        "Highly regional; Italy, Spain and France had differing emphases and folk elements.",
    },
  },
  {
    id: "european-enlightenment",
    label: "European Enlightenment-era practice",
    scope: { years: [1700, 1850], bounds: [-26, 30, 50, 72] },
    powers: [
      {
        name: "God",
        domain: "reason, nature, order",
        rank: "paramount",
      },
      {
        name: "Christ",
        domain: "morality, the church",
        rank: "major",
        relation: { kind: "child-of", of: "God" },
      },
      {
        name: "Mary",
        domain: "intercession, the Virgin",
        rank: "major",
      },
      {
        name: "Nature",
        domain: "the natural world, reason",
        rank: "major",
      },
      {
        name: "The nation",
        domain: "law, progress, duty",
        rank: "major",
      },
      {
        name: "The saints",
        domain: "local veneration, healing",
        rank: "major",
      },
      {
        name: "The Church",
        domain: "ritual, community, doctrine",
        rank: "local",
      },
      {
        name: "The family",
        domain: "household rites, inheritance",
        rank: "local",
      },
      {
        name: "The cemetery",
        domain: "burial, commemoration",
        rank: "local",
      },
    ],
    practice: [
      "Sunday mass continues; some attend to reason about faith.",
      "Pilgrimages are undertaken by tradition; the educated are skeptical.",
      "Christenings and burials follow church law and folk custom.",
      "Saints' days are marked both as holy and as seasonal festivals.",
    ],
    specialist: "The priest, less absolute; the educated household head.",
    afterlife:
      "Heaven, hell or annihilation; intellectuals dispute the question.",
    evidence: {
      status: "documented",
      claim:
        "Enlightenment practice is documented in parish records, private diaries, philosophical texts, and changed patterns of church attendance and private devotion.",
      sources: [
        "Taylor, Secularization and the Rise of Neo-paganism in Europe",
        "Bradley, Religion and the Rise of the British Middle Class",
        "Heinz-Gerhard Haupt, Charlotte Ulrich, eds., National Colonialism in Europe",
      ],
      limitation:
        "Elite and popular practice diverged; rural areas retained older faith.",
    },
  },
  {
    id: "european-industrial",
    label: "Industrial-era European practice",
    scope: { years: [1850, 2000], bounds: [-26, 30, 50, 72] },
    powers: [
      {
        name: "Progress",
        domain: "technology, improvement, the future",
        rank: "paramount",
      },
      {
        name: "The nation",
        domain: "community, duty, identity",
        rank: "major",
      },
      {
        name: "God or nature",
        domain: "source or not, debated",
        rank: "major",
      },
      {
        name: "The family",
        domain: "continuity, inheritance",
        rank: "major",
      },
      {
        name: "Science",
        domain: "explanation, prediction, mastery",
        rank: "major",
      },
      {
        name: "Work",
        domain: "livelihood, dignity, exploitation",
        rank: "major",
      },
      {
        name: "The Church",
        domain: "tradition, community, ritual",
        rank: "local",
      },
      {
        name: "The dead",
        domain: "memory, commemoration",
        rank: "local",
      },
      {
        name: "The workplace",
        domain: "solidarity, mutual aid",
        rank: "local",
      },
    ],
    practice: [
      "Religious observance declines in cities; persists in villages.",
      "Weddings and funerals follow church or civil law.",
      "National holidays and monuments replace or compete with religious ones.",
      "Mutual aid societies and workers' groups substitute for religious brotherhood.",
    ],
    specialist:
      "The priest, increasingly marginalized; secular officials, teachers, doctors.",
    afterlife: "Belief ranges from religious hope to secular skepticism.",
    evidence: {
      status: "documented",
      claim:
        "Industrial-era practice is documented in census records showing religious adherence, church records, labor organization files, and personal accounts.",
      sources: [
        "McLeod, Religion and the Working Class in Nineteenth-Century Britain",
        "Callahan, The Catholic Church in Spain 1875-1998",
        "Enquête Commission, Mémoires du Travail",
      ],
      limitation:
        "Enormous regional and sectarian variation; secularization was uneven.",
    },
  },
  {
    id: "byzantine-orthodox",
    label: "Byzantine Orthodox practice",
    scope: { years: [330, 1460], bounds: [12, 33, 48, 49] },
    powers: [
      { name: "God", domain: "creation, judgement", rank: "paramount" },
      {
        name: "Christ Pantokrator",
        domain: "salvation, the icon in the dome",
        rank: "major",
        relation: { kind: "aspect-of", of: "God" },
      },
      {
        name: "The Theotokos",
        domain: "intercession, the defence of the city",
        rank: "major",
      },
      {
        name: "The saints",
        domain: "particular needs and trades",
        rank: "major",
      },
      {
        name: "Saint Nicholas",
        domain: "sailors, merchants, children",
        rank: "major",
        relation: { kind: "serves", of: "God" },
      },
      {
        name: "The archangel Michael",
        domain: "armies, the hour of death",
        rank: "major",
      },
      {
        name: "The parish icon",
        domain: "the village's own protector",
        rank: "local",
      },
      { name: "The holy spring", domain: "healing water", rank: "local" },
      {
        name: "The household dead",
        domain: "the family remembered at liturgy",
        rank: "local",
      },
      {
        name: "The evil eye",
        domain: "envy, sudden misfortune",
        rank: "local",
      },
    ],
    practice: [
      "Oil and candles before the icon at home and at the church door.",
      "Fasts before Easter and Christmas, kept by the household together.",
      "Name days rather than birthdays; the saint is the person's patron.",
      "Blue beads, salt and spitting against the eye, alongside the priest's blessing.",
    ],
    specialist:
      "Parish priests and monks; the bishop for anything beyond the village.",
    afterlife: "Judgement, then the prayers of the living for the dead.",
    evidence: {
      status: "documented",
      claim:
        "Icon veneration, the cult of the Theotokos and the saints, fasting, name days and parallel protective practice against the eye are well attested across the Byzantine world and its successor Orthodox populations.",
      sources: [
        "Cormack, Byzantine Art",
        "Kaldellis, The Byzantine Republic",
        "Hart, Time, Religion and Social Experience in Rural Greece",
      ],
      limitation:
        "One entry for a thousand years and a wide territory; monastic, urban and village practice differed, and the later centuries fall under Ottoman rule.",
    },
  },
  {
    id: "post-roman-christian-mediterranean",
    label: "Post-Roman Christian practice",
    scope: { years: [380, 1000], bounds: [-12, 34, 25, 58] },
    powers: [
      { name: "God", domain: "creation, judgement", rank: "paramount" },
      {
        name: "Christ",
        domain: "salvation",
        rank: "major",
        relation: { kind: "aspect-of", of: "God" },
      },
      { name: "The Virgin", domain: "intercession", rank: "major" },
      {
        name: "The local saint",
        domain: "the relic the church was built around",
        rank: "major",
      },
      {
        name: "The bishop's saint",
        domain: "the diocese and its protection",
        rank: "major",
      },
      {
        name: "The Devil",
        domain: "temptation, plague, bad harvests",
        rank: "major",
      },
      {
        name: "The household dead",
        domain: "the family's own graves",
        rank: "local",
      },
      {
        name: "The spring and the grove",
        domain: "older powers the church absorbed",
        rank: "local",
      },
      {
        name: "The saint's relic",
        domain: "oaths, cures, the year's procession",
        rank: "local",
      },
    ],
    practice: [
      "Oaths sworn on a relic, which is more binding than a spoken promise.",
      "The fields walked and blessed before the harvest.",
      "Older wells and stones kept, renamed for a saint.",
      "Charms and church blessing used together against illness.",
    ],
    specialist:
      "Priests and monks; a local holy man or woman where no church stood.",
    afterlife: "Judgement, softened by the intercession of the saints.",
    evidence: {
      status: "inferred",
      claim:
        "Relic cult, oath-taking on relics, rogation processions and the christening of older sacred places are documented across the post-Roman west and Mediterranean, though unevenly by region.",
      sources: [
        "Brown, The Cult of the Saints",
        "Geary, Living with the Dead in the Middle Ages",
      ],
      limitation:
        "A broad floor for six centuries; the depth of Christianization varied enormously between town, countryside and frontier.",
    },
  },
  {
    id: "latin-christendom-late-medieval",
    label: "Late medieval Latin Christian practice",
    scope: { years: [1300, 1520], bounds: [-10, 35, 30, 62] },
    powers: [
      { name: "God", domain: "creation, judgement", rank: "paramount" },
      { name: "Christ", domain: "the Passion, the mass", rank: "major" },
      {
        name: "The Virgin",
        domain: "mercy, intercession, plague",
        rank: "major",
      },
      {
        name: "Saint Christopher",
        domain: "travellers, sudden death",
        rank: "major",
      },
      { name: "Saint Sebastian", domain: "plague", rank: "major" },
      { name: "The Devil", domain: "temptation, the deathbed", rank: "major" },
      {
        name: "The guild's patron",
        domain: "the trade and its feast day",
        rank: "local",
      },
      {
        name: "The parish saint",
        domain: "the village's own day",
        rank: "local",
      },
      {
        name: "The souls in purgatory",
        domain: "the household's dead, waiting",
        rank: "local",
      },
    ],
    practice: [
      "Masses bought for the dead, who are waiting and can be helped.",
      "The guild keeps its patron's feast and buries its own.",
      "Pilgrimage to a shrine for a cure or a vow discharged.",
      "Plague brings processions, new altars and flagellant bands.",
    ],
    specialist: "Parish priests, friars, and the guild's chantry chaplain.",
    afterlife:
      "Purgatory, shortened by the prayers and payments of the living.",
    evidence: {
      status: "documented",
      claim:
        "Purgatory, intercessory masses, guild and parish patronal cults, pilgrimage and plague devotion are extensively documented in late medieval western Europe.",
      sources: [
        "Duffy, The Stripping of the Altars",
        "Le Goff, The Birth of Purgatory",
      ],
      limitation:
        "Weighted towards northern and western practice; the entry does not track Hussite, Waldensian or other dissenting currents.",
    },
  },
];
