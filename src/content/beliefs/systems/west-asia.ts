import type { BeliefSystem } from "../types";

export const westAsia: readonly BeliefSystem[] = [
  {
    id: "west-asia-foragers",
    label: "Foraging communities of West Asia and North Africa",
    scope: { years: [-10000, -2000], bounds: [-20, 10, 65, 45] },
    powers: [
      {
        name: "The ancestors",
        domain: "the first people, memory",
        rank: "paramount",
      },
      {
        name: "The hunt",
        domain: "prey animals and their spirits",
        rank: "major",
      },
      { name: "The water", domain: "rivers, springs, life", rank: "major" },
      { name: "The land", domain: "rocks, caves, shelter", rank: "major" },
      { name: "The sky", domain: "weather, stars, the rains", rank: "major" },
      {
        name: "The shamanic guide",
        domain: "dreams and trance",
        rank: "local",
      },
      {
        name: "The hearth",
        domain: "the camp's fire and gathering",
        rank: "local",
      },
      { name: "The tool", domain: "stone, bone, making", rank: "local" },
    ],
    practice: [
      "Kill sites are marked with stones as thanks to the animal's spirit.",
      "The first person to drink from a spring pours back water as a greeting.",
      "Ochre marks are made on the skin before a dangerous hunt.",
      "The oldest person speaks the names of the dead at gathering.",
    ],
    specialist: "The elder who remembers; the tracker who reads animal signs.",
    afterlife:
      "Return to the earth; the body feeds the animals and becomes soil.",
    evidence: {
      status: "hypothesis",
      claim:
        "Before pottery and writing, West Asian and North African foragers left stone tools, ochre deposits, and kill sites. Their beliefs in animism and ancestor veneration are inferred from later continuities and ethnographic parallels.",
      sources: [
        "Mellars, The Neanderthal Legacy",
        "Gamble, Timewalkers: The Prehistory of Global Colonization",
        "Conkey and Spector, 'Archaeology and the Study of Gender'",
      ],
      limitation:
        "No oral tradition survives; this is a reconstruction from material evidence and cross-cultural pattern.",
    },
  },
  {
    id: "west-asia-early-farming",
    label: "Early farming and herding communities",
    scope: { years: [-2000, 500], bounds: [-18, 12, 62, 42] },
    powers: [
      {
        name: "The earth",
        domain: "crops, fertility, the growing year",
        rank: "paramount",
      },
      {
        name: "The herd",
        domain: "cattle, sheep, milk and wool",
        rank: "major",
      },
      { name: "The water", domain: "rain, irrigation, life", rank: "major" },
      { name: "The sun", domain: "the ripening of grain", rank: "major" },
      { name: "The household", domain: "family and continuity", rank: "major" },
      { name: "The ancestors", domain: "the land they worked", rank: "local" },
      { name: "The well", domain: "drinking water, community", rank: "local" },
      {
        name: "The boundary stone",
        domain: "fields and their limits",
        rank: "local",
      },
    ],
    practice: [
      "The first fruits of harvest are left at the field's edge before the household eats.",
      "The herd is blessed at the spring gathering before the herders depart.",
      "The hearth is tended by the household mother; its fire is never allowed to die.",
      "The dead are buried in or near the house; their presence guards the family.",
    ],
    specialist: "The elder who knows the weather and the planting signs.",
    afterlife:
      "Presence in the family's land and continued care by descendants.",
    evidence: {
      status: "hypothesis",
      claim:
        "Neolithic and Bronze Age settlements across West Asia, the Levant, North Africa and the Nile show evidence of agriculture, herding, household shrines, and ancestor burial. This describes the common layer beneath more specialized local practices.",
      sources: [
        "Hodder, The Domestication of Europe",
        "Mithen, The Prehistory of the Mind",
        "Crabtree and Campana, 'Early Sedentism and Its Consequences'",
      ],
      limitation:
        "Enormous variation existed by ecology and era. This is the floor beneath all specific traditions.",
    },
  },
  {
    id: "sumerian-city-states",
    label: "Sumerian city-state religion",
    scope: { years: [-3500, -1500], bounds: [40, 28, 52, 37] },
    powers: [
      { name: "Enlil", domain: "storm, fate, kingship", rank: "paramount" },
      { name: "Enki", domain: "fresh water, wisdom, craft", rank: "major" },
      { name: "Utu", domain: "the sun, justice, the boundary", rank: "major" },
      { name: "Inanna", domain: "love, war, the evening star", rank: "major" },
      {
        name: "Ninhursag",
        domain: "the mountains, birth",
        rank: "major",
      },
      {
        name: "The city god",
        domain: "the temple and its people",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the underworld, memory",
        rank: "local",
      },
      {
        name: "The spring",
        domain: "drinking water, health",
        rank: "local",
      },
      {
        name: "The boundary stone",
        domain: "fields and their disputes",
        rank: "local",
      },
    ],
    practice: [
      "The city god is given bread and beer daily in the temple by priests.",
      "Farmers leave grain and oil at the boundary stone before the plow.",
      "The dead are poured offerings to keep them quiet in the below.",
      "Omens are read from the livers of sheep before any venture.",
    ],
    specialist:
      "Temple priests for the city god and Enlil; diviners for the liver omens.",
    afterlife: "A grey, thirsty below where the dead depend on the living.",
    evidence: {
      status: "documented",
      claim:
        "The paramount status of Enlil at Nippur, the temple's economic role, and the divine structure of city-states are attested in cuneiform records, temple architecture and votive figurines.",
      sources: [
        "Bottéro, Religion in Ancient Mesopotamia",
        "Michalowski, 'The Religious Architecture of the Ancient Near East'",
        "Luckenbill, The Annals of the Kings of Assyria",
      ],
      limitation:
        "Sumerian practice varied by city; Nippur's Enlil theology may not reflect every shrine.",
    },
  },
  {
    id: "old-babylonian",
    label: "Old Babylonian practice",
    scope: { years: [-2000, -1400], bounds: [40, 29, 50, 37] },
    powers: [
      {
        name: "Marduk",
        domain: "Babylon, destiny, the tablets of fate",
        rank: "paramount",
      },
      { name: "Ea", domain: "fresh water, craft, contracts", rank: "major" },
      { name: "Shamash", domain: "the sun, law, justice", rank: "major" },
      {
        name: "Sin",
        domain: "the moon, time, the night",
        rank: "major",
      },
      {
        name: "Ishtar",
        domain: "love, fertility, battle",
        rank: "major",
      },
      {
        name: "Ninhursag",
        domain: "birth and the wild",
        rank: "major",
      },
      {
        name: "The doorkeeper",
        domain: "the house threshold",
        rank: "local",
      },
      {
        name: "The tutelary spirit",
        domain: "a family's fortune",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the family tomb",
        rank: "local",
      },
    ],
    practice: [
      "Oil and beer are set at the threshold each dawn.",
      "A child is shown to Shamash at the window before the sun fully rises.",
      "A merchant sacrifices a kid to Ea before traveling the canal.",
      "Amulets bearing the name of the household spirit are worn by all.",
    ],
    specialist:
      "Temple priests for the great gods; the household head at home.",
    afterlife:
      "Passage to the dark house, where even kings become shadows without the living's sustenance.",
    evidence: {
      status: "documented",
      claim:
        "Marduk's rise to supremacy under Hammurabi, household deities in legal texts, and household shrines are documented in administrative records, law codes, and settlement archaeology.",
      sources: [
        "Charpin, Writing, Law, and Kingship in Old Babylonia",
        "Lambert, Babylonian Wisdom Literature",
        "Postgate, Early Mesopotamia: Society and Economy",
      ],
      limitation:
        "Evidence skews toward elite households and temple property; village practice may have been less centered on Marduk.",
    },
  },
  {
    id: "neo-assyrian",
    label: "Neo-Assyrian state religion",
    scope: { years: [-1000, -500], bounds: [38, 32, 50, 40] },
    powers: [
      {
        name: "Ashur",
        domain: "Assyria, empire, fate",
        rank: "paramount",
      },
      {
        name: "Enlil",
        domain: "storm, the word of destiny",
        rank: "major",
        relation: { kind: "aspect-of", of: "Ashur" },
      },
      {
        name: "Shamash",
        domain: "the sun, truth, law",
        rank: "major",
      },
      { name: "Adad", domain: "storm, rain, the flood", rank: "major" },
      {
        name: "Ishtar",
        domain: "war, love, the evening star",
        rank: "major",
      },
      { name: "Anu", domain: "the sky, power", rank: "major" },
      {
        name: "The royal standard",
        domain: "the army's presence",
        rank: "local",
      },
      {
        name: "The garrison spirit",
        domain: "the settlement's safety",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the family tomb",
        rank: "local",
      },
    ],
    practice: [
      "The king performs Ashur's festival at the new year and offers the fattest beast.",
      "Omen-takers read bird entrails before battles and hunts.",
      "Household shrines hold oil and grain for the local spirit.",
      "A soldier drinks from the king's cup before facing battle.",
    ],
    specialist: "Temple priests for Ashur; the king as Ashur's representative.",
    afterlife: "The realm of the dead, sustained by the living's remembrance.",
    evidence: {
      status: "documented",
      claim:
        "Neo-Assyrian royal inscriptions, the state omen series Enuma Anu Enlil, and temple records show Ashur's supremacy, the king's ritual role, and the importance of divination.",
      sources: [
        "Liverani, The Ancient Near East: History, Society and Economy",
        "Reade, 'Ideology and Propaganda in Assyrian Art'",
        "Brown, David, Mesopotamian Planetary Astronomy-Astrology",
      ],
      limitation:
        "Most evidence concerns the court; village practice around garrisons is less certain.",
    },
  },
  {
    id: "levantine-canaanite",
    label: "Levantine Canaanite religion",
    scope: { years: [-1500, -300], bounds: [33, 30, 40, 37] },
    powers: [
      { name: "El", domain: "sky, authority, the ancestor", rank: "paramount" },
      {
        name: "Baal",
        domain: "storm, rain, the living land",
        rank: "major",
      },
      {
        name: "Asherah",
        domain: "the great mother, fertility",
        rank: "major",
        relation: { kind: "consort-of", of: "El" },
      },
      {
        name: "Anat",
        domain: "war, the hunt, raw power",
        rank: "major",
      },
      {
        name: "Mot",
        domain: "death and drought",
        rank: "major",
      },
      {
        name: "The local basal",
        domain: "a town's prosperity",
        rank: "major",
      },
      {
        name: "The stone pillar",
        domain: "the family shrine",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the tomb, counsel",
        rank: "local",
      },
      {
        name: "The spring",
        domain: "water and healing",
        rank: "local",
      },
    ],
    practice: [
      "Stone pillars mark the shrine where oil and wine are poured.",
      "The dead are kept in the town tomb and consulted at times of crisis.",
      "A heifer is slaughtered before plowing, its meat eaten by the family.",
      "Children are brought to the spring at dawn in a time of drought.",
    ],
    specialist:
      "Priests at the temple of the local baal; elders consult the dead.",
    afterlife: "Dwelling in the family tomb among the ancestors.",
    evidence: {
      status: "documented",
      claim:
        "El's supremacy, Baal's role as storm god, Asherah's role as goddess of fertility, and household shrine practice are attested in the Ugaritic texts, temple remains, and pillar figurines.",
      sources: [
        "Wyatt, Religious Texts from Ugarit",
        "Ackerman, 'The Gender of Divine Wisdom'",
        "Meyers, Discovering Eve: Ancient Israelite Women in Context",
      ],
      limitation:
        "Ugaritic evidence dominates; other Canaanite towns may have practiced differently.",
    },
  },
  {
    id: "israelite-judahite",
    label: "Judahite monarchy religion",
    scope: { years: [-1000, -400], bounds: [34, 30, 37, 34] },
    powers: [
      {
        name: "YHWH",
        domain: "the God of Israel, the covenant",
        rank: "paramount",
      },
      {
        name: "The king",
        domain: "YHWH's chosen, the temple patron",
        rank: "major",
      },
      {
        name: "The high priest",
        domain: "the temple, atonement",
        rank: "major",
      },
      {
        name: "The prophets",
        domain: "YHWH's word and warning",
        rank: "major",
      },
      {
        name: "The blessing of Zion",
        domain: "Jerusalem's safety",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the family and nation's past",
        rank: "local",
      },
      {
        name: "The doorpost",
        domain: "the household's protection",
        rank: "local",
      },
      {
        name: "The sacred well",
        domain: "healing and cleansing",
        rank: "local",
      },
    ],
    practice: [
      "Three times each year, the people go up to Jerusalem for the festivals.",
      "The king and priests offer at the altar to avert YHWH's anger.",
      "A family marks the doorposts with blood at the feast of the escape from Egypt.",
      "Prophets cry out YHWH's judgment in the streets when the king breaks covenant.",
    ],
    specialist:
      "The high priest and Levites in the temple; prophets as YHWH's mouthpiece.",
    afterlife: "Sheol, an underworld place of shade and sleep.",
    evidence: {
      status: "documented",
      claim:
        "The centrality of the Jerusalem temple, the covenant theology, and household ritual practice are documented in the Hebrew Bible, the Black Obelisk of Shalmaneser, and Jerusalem archaeology.",
      sources: [
        "Smith, The Early History of God: Yahweh and the Other Deities",
        "Na'aman, 'The Law of the King in the Kingdom of Judah'",
        "Finkelstein, The Bible Unearthed",
      ],
      limitation:
        "Biblical texts reflect later redaction; pre-exile practice may have been less monotheistic.",
    },
  },
  {
    id: "second-temple-judaism",
    label: "Second Temple Jewish practice",
    scope: { years: [-500, 200], bounds: [34, 30, 37, 34] },
    powers: [
      { name: "YHWH", domain: "the God of Israel, Creator", rank: "paramount" },
      {
        name: "The Torah",
        domain: "YHWH's word and law",
        rank: "major",
      },
      {
        name: "The temple",
        domain: "atonement and sacrifice",
        rank: "major",
      },
      {
        name: "The high priest",
        domain: "the Day of Atonement",
        rank: "major",
      },
      {
        name: "The sages",
        domain: "interpretation and justice",
        rank: "major",
      },
      {
        name: "The angels",
        domain: "YHWH's messengers",
        rank: "major",
      },
      {
        name: "The household",
        domain: "the family's covenant",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the faithful departed",
        rank: "local",
      },
      {
        name: "The synagogue",
        domain: "prayer and study",
        rank: "local",
      },
    ],
    practice: [
      "The Torah is studied in groups and its commandments kept strictly.",
      "At Passover, a family gathers to remember the escape from Egypt.",
      "The Sabbath is kept by resting and praying from sunset to sunset.",
      "Tzitzit fringes on garments remind the wearer of the 613 commandments.",
      "Purity rules govern what is eaten and what touches the body.",
    ],
    specialist:
      "Priests and Levites in the temple; sages and scribes in the community.",
    afterlife:
      "Resurrection, reward for the faithful, and judgment for the wicked.",
    evidence: {
      status: "documented",
      claim:
        "Temple records, the Dead Sea Scrolls, rabbinic literature, and Josephus document Second Temple ritual, Torah study, and the rise of synagogue practice alongside the temple.",
      sources: [
        "Sanders, Judaism: Practice and Belief 63 BCE - 66 CE",
        "Collins, The Apocalyptic Imagination",
        "Schwartz, Imperialism and Jewish Society",
      ],
      limitation:
        "Sectarian diversity was high; this describes mainstream practice, not Essenes or other groups.",
    },
  },
  {
    id: "achaemenid-zoroastrian",
    label: "Achaemenid Zoroastrian Iran",
    scope: { years: [-700, -200], bounds: [46, 24, 63, 40] },
    powers: [
      {
        name: "Ahura Mazda",
        domain: "wisdom, creation, good",
        rank: "paramount",
      },
      {
        name: "The king",
        domain: "Ahura Mazda's chosen, order",
        rank: "major",
        relation: { kind: "serves", of: "Ahura Mazda" },
      },
      {
        name: "The Amesha Spenta",
        domain: "the archangels of creation",
        rank: "major",
      },
      {
        name: "Fire",
        domain: "purification, Ahura Mazda's flame",
        rank: "major",
      },
      {
        name: "The magi",
        domain: "ritual and prayer",
        rank: "major",
      },
      {
        name: "The threshold",
        domain: "the boundary of order",
        rank: "local",
      },
      {
        name: "The hearth",
        domain: "family prosperity",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "wisdom passed down",
        rank: "local",
      },
    ],
    practice: [
      "Fire is tended in the home and never allowed to die.",
      "The dead are exposed on a tower so vultures can consume them, keeping them from defiling the earth.",
      "The magi perform rituals to keep chaos at bay and reward Ahura Mazda's creation.",
      "Contracts sworn before fire are inviolable.",
    ],
    specialist: "The magi, keepers of fire and ritual.",
    afterlife:
      "A bridge test for the soul: the righteous cross into light and blessing; the wicked fall into darkness.",
    evidence: {
      status: "documented",
      claim:
        "Achaemenid royal inscriptions, the Zoroastrian liturgy Yasna, Herodotus, and later Pahlavi texts document the supremacy of Ahura Mazda, the king's role, and the magi's authority.",
      sources: [
        "Briant, From Cyrus to Alexander",
        "Boyce, Zoroastrianism: Their Religious Beliefs and Practices",
        "Gnoli, The Idea of Iran",
      ],
      limitation:
        "The Younger Avesta's date is disputed; Achaemenid practice may have been less systematized than later texts suggest.",
    },
  },
  {
    id: "hellenistic-syria",
    label: "Hellenistic Syrian syncretism",
    scope: { years: [-400, 100], bounds: [32, 31, 42, 39] },
    powers: [
      {
        name: "Zeus-Baal",
        domain: "the sky, rain, kingly power",
        rank: "paramount",
      },
      {
        name: "Athena",
        domain: "wisdom, craft, the city",
        rank: "major",
      },
      {
        name: "Aphrodite-Astarte",
        domain: "love, fertility, the evening star",
        rank: "major",
      },
      {
        name: "Apollo",
        domain: "healing, the sun, music",
        rank: "major",
      },
      {
        name: "Hermes",
        domain: "commerce, travelers, thieves",
        rank: "major",
      },
      {
        name: "The altar of the agora",
        domain: "oaths and trade",
        rank: "local",
      },
      {
        name: "The household gods",
        domain: "family continuity",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the hero dead",
        rank: "local",
      },
    ],
    practice: [
      "The city god receives a great sacrifice during the spring festival.",
      "Traders swear oaths at the marketplace altar and mark them with wine.",
      "Young men pour libations to Hermes before a journey.",
      "Small clay figures are left at household shrines for the gods' attention.",
    ],
    specialist:
      "Greek priests at the city temples; local leaders at family shrines.",
    afterlife: "Either Elysium or Hades, depending on piety and virtue.",
    evidence: {
      status: "documented",
      claim:
        "Hellenistic inscriptions, temple archaeology, coins bearing combined Greek and local divine names, and Seleucid administrative records show widespread syncretism between Greek and Levantine cults.",
      sources: [
        "Cohen, The Seleucid Colonies",
        "Walbank, The Hellenistic World",
        "Downey, A History of Antioch in Syria",
      ],
      limitation:
        "Syncretism varied by town and period; this describes one Seleucid city's practice.",
    },
  },
  {
    id: "sasanian-zoroastrian",
    label: "Sasanian Zoroastrian Iran",
    scope: { years: [100, 700], bounds: [46, 24, 63, 40] },
    powers: [
      {
        name: "Ahura Mazda",
        domain: "wisdom, creation, light",
        rank: "paramount",
      },
      {
        name: "The Shahanshah",
        domain: "the King of Kings, justice",
        rank: "major",
        relation: { kind: "serves", of: "Ahura Mazda" },
      },
      {
        name: "The Amesha Spenta",
        domain: "the divine qualities",
        rank: "major",
      },
      {
        name: "The yazata spirits",
        domain: "the beneficent powers",
        rank: "major",
      },
      {
        name: "Fire",
        domain: "purification, the sacred flame",
        rank: "major",
      },
      {
        name: "Water",
        domain: "cleansing and life",
        rank: "major",
      },
      {
        name: "The magi",
        domain: "priests and judges",
        rank: "major",
      },
      {
        name: "The hearth",
        domain: "household blessing",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "protection and wisdom",
        rank: "local",
      },
    ],
    practice: [
      "Fire is kept burning at home and in temples; a dying flame is ill omen.",
      "The dead are exposed on a tower to be consumed by birds.",
      "Water is never polluted with corpses; washing before prayer is law.",
      "The Avesta is chanted by magi who interpret law and settle disputes.",
    ],
    specialist:
      "The magi, organized into a priesthood; the Shahanshah as defender of Zoroastrianism.",
    afterlife:
      "The bridge test: the righteous see Ahura Mazda's light; the wicked suffer Angra Mainyu's darkness.",
    evidence: {
      status: "documented",
      claim:
        "Sasanian coins, inscriptions, the Avesta, the Denkard, and later Arab histories document the state enforcement of Zoroastrianism, the magi's judicial role, and ritual practice including exposure of the dead.",
      sources: [
        "Christensen, L'Iran sous les Sassanides",
        "Shaul Shaked, Dualism in Transformation",
        "Foltz, Spirituality in the Land of the Noble",
      ],
      limitation:
        "Late Sasanian practice included heterodox sects; this describes orthodox court religion.",
    },
  },
  {
    id: "pre-islamic-arabia",
    label: "Pre-Islamic Arabian polytheism",
    scope: { years: [200, 650], bounds: [33, 12, 60, 34] },
    powers: [
      { name: "Allah", domain: "the high god, fate", rank: "paramount" },
      {
        name: "Al-Lat",
        domain: "the goddess, the land",
        rank: "major",
      },
      {
        name: "Al-Uzza",
        domain: "the mighty, the morning star",
        rank: "major",
      },
      {
        name: "Manat",
        domain: "fate and death",
        rank: "major",
      },
      {
        name: "The jinn",
        domain: "spirits of place and wilderness",
        rank: "major",
      },
      {
        name: "The tribal ancestor",
        domain: "the lineage and honor",
        rank: "major",
      },
      {
        name: "The shrine stone",
        domain: "the town's sacred place",
        rank: "local",
      },
      {
        name: "The well",
        domain: "water and oasis blessing",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the family dead and their pride",
        rank: "local",
      },
    ],
    practice: [
      "The shrine at Mecca holds three goddess idols and is visited at pilgrimage.",
      "A young man is sworn to secrecy by an oath at the tribal grave.",
      "The dead are buried in the sands with care; the grave's sanctity is kept.",
      "Offerings of wine, dates and milk are left at the well.",
    ],
    specialist:
      "The keepers of the shrine; the tribal shaykh as judge and custodian.",
    afterlife: "Shadowy existence in the ground near the family tomb.",
    evidence: {
      status: "documented",
      claim:
        "The Quran names Al-Lat, Al-Uzza and Manat; classical Arabic poetry and early Islamic sources describe the shrine cult at Mecca and the role of tribal and place spirits.",
      sources: [
        "Hawting, The Idea of Idolatry and the Rise of Islam",
        "Shahid, Byzantium and the Semitic North",
        "Peters, Muhammad and the Origins of Islam",
      ],
      limitation:
        "Most evidence comes from Islamic sources hostile to pre-Islamic religion; the fuller picture is lost.",
    },
  },
  {
    id: "early-islamic",
    label: "Early Islamic practice",
    scope: { years: [600, 850], bounds: [33, 12, 60, 34] },
    powers: [
      { name: "God", domain: "the Creator, judgment", rank: "paramount" },
      {
        name: "Muhammad",
        domain: "the Messenger, God's word",
        rank: "major",
      },
      {
        name: "The angels",
        domain: "God's servants",
        rank: "major",
      },
      {
        name: "The prophets",
        domain: "God's earlier messengers",
        rank: "major",
      },
      {
        name: "The saints",
        domain: "those near to God",
        rank: "major",
      },
      {
        name: "The imam",
        domain: "community leader and prayer",
        rank: "major",
      },
      {
        name: "The dead in the tomb",
        domain: "the family's honored",
        rank: "local",
      },
      {
        name: "The mosque",
        domain: "prayer, community, law",
        rank: "local",
      },
    ],
    practice: [
      "Prayer is performed five times daily facing Mecca, alone or in congregation.",
      "The Quran is memorized and chanted; its words are God's own.",
      "Fasting from dawn to dusk is kept during the month of Ramadan.",
      "Alms are given to the poor; the tax is one part in forty of wealth.",
      "A pilgrimage to Mecca is made once in a lifetime if means allow.",
    ],
    specialist: "The imam leads prayer; the qadi judges by God's law.",
    afterlife:
      "The grave's solitude, then resurrection and divine judgment on the Day of Standing.",
    evidence: {
      status: "documented",
      claim:
        "The Quran, hadith collections, early Islamic legal texts, and archaeological evidence from seventh-century Mecca and Medina document the five pillars, Quranic centrality, and the role of community and law.",
      sources: [
        "Peters, Muhammad and the Origins of Islam",
        "Watt, The Formative Period of Islamic Thought",
        "Lapidus, A History of Islamic Societies",
      ],
      limitation:
        "Early Islamic practice was fluid; this describes the normative pattern emerging by the eighth century.",
    },
  },
  {
    id: "medieval-sunni-islam",
    label: "Medieval Sunni Islamic practice",
    scope: { years: [700, 1600], bounds: [-18, 10, 63, 42] },
    powers: [
      { name: "God", domain: "the Almighty, justice", rank: "paramount" },
      { name: "Muhammad", domain: "the Seal of Prophets", rank: "major" },
      {
        name: "The Quran",
        domain: "God's unchanging word",
        rank: "major",
      },
      {
        name: "The Sunnah",
        domain: "the Prophet's example",
        rank: "major",
      },
      {
        name: "The caliph",
        domain: "God's vicegerent, the community",
        rank: "major",
      },
      {
        name: "The qadi",
        domain: "judgment and the law",
        rank: "major",
      },
      {
        name: "The sheikh",
        domain: "teaching and wisdom",
        rank: "major",
      },
      {
        name: "The saint's tomb",
        domain: "blessing and intercession",
        rank: "local",
      },
      {
        name: "The mosque",
        domain: "prayer and community",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the faithful family",
        rank: "local",
      },
    ],
    practice: [
      "The five daily prayers are performed in congregation when possible.",
      "The Quran is recited publicly during Ramadan; scholars debate its meaning.",
      "Pilgrimage to Mecca, to saints' tombs, and to holy sites fulfills devotion.",
      "The dead are washed and wrapped in white cloth; the grave's direction is marked.",
      "Alms, fasting, and truthful witnessing are duties of faith.",
    ],
    specialist:
      "The qadi judges using the law schools; the imam leads prayer and the faithful.",
    afterlife:
      "The interrogation of the grave, then resurrection and judgment before God on the Day of Reckoning.",
    evidence: {
      status: "documented",
      claim:
        "Legal texts from the four law schools, hadith collections, the writings of Al-Ghazali, travelers' accounts, and cemetery archaeology document the standardized practices of Sunni Islam by the tenth century.",
      sources: [
        "Lapidus, A History of Islamic Societies",
        "Makdisi, The Rise of Colleges",
        "Rashed, The Development of Arabic Mathematics",
      ],
      limitation:
        "Urban elite practice is better attested than village Islam; regional variation was significant.",
    },
  },
  {
    id: "coptic-orthodox",
    label: "Coptic Orthodox Christianity",
    scope: { years: [1000, 1700], bounds: [23, 20, 38, 34] },
    powers: [
      {
        name: "God the Father",
        domain: "creation and judgment",
        rank: "paramount",
      },
      { name: "Christ", domain: "the Savior, redemption", rank: "major" },
      { name: "The Holy Spirit", domain: "grace and guidance", rank: "major" },
      {
        name: "Mary",
        domain: "intercessor, protectress",
        rank: "major",
      },
      {
        name: "The saints",
        domain: "Christ's witnesses, helpers",
        rank: "major",
      },
      {
        name: "The patriarch",
        domain: "church leadership and sacrament",
        rank: "major",
      },
      {
        name: "The priest",
        domain: "the Eucharist and absolution",
        rank: "local",
      },
      {
        name: "The church icon",
        domain: "presence of the holy",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the faithful departed in peace",
        rank: "local",
      },
    ],
    practice: [
      "The liturgy is performed in Coptic on Sundays; bread and wine become Christ's body.",
      "Fasting is kept before major feasts and on Wednesdays and Fridays.",
      "Icons are venerated but not worshiped; they are windows to the holy.",
      "The dead are buried facing east; the priest prays the funeral liturgy.",
      "Saints' feast days are marked with processions and gathering at the shrine.",
    ],
    specialist:
      "The patriarch and bishops; priests who perform the sacraments.",
    afterlife:
      "Paradise for the righteous, judgment and separation for sinners after death.",
    evidence: {
      status: "documented",
      claim:
        "Coptic liturgical manuscripts, church architecture, hagiographies, and accounts by Arab and European travelers document the continuation of Egyptian Christianity despite Islamic rule, with visible Coptic liturgy, veneration of saints, and monastic tradition.",
      sources: [
        "Mango, Byzantine Architecture",
        "Al-Mas'udi, Meadows of Gold",
        "Grossmann, Coptic Architecture and Sculpture",
      ],
      limitation:
        "Monasticism and city practice were different; village Christianity is less well documented.",
    },
  },
  {
    id: "ottoman-sufi",
    label: "Ottoman Sufi-inflected Islam",
    scope: { years: [1350, 1850], bounds: [18, 22, 52, 45] },
    powers: [
      { name: "God", domain: "the Divine, mysteries", rank: "paramount" },
      {
        name: "Muhammad",
        domain: "the Perfect Man, intercessor",
        rank: "major",
      },
      {
        name: "The saint",
        domain: "God's beloved, blessing",
        rank: "major",
      },
      {
        name: "The pir",
        domain: "the spiritual guide",
        rank: "major",
      },
      {
        name: "The mufti",
        domain: "Islamic law and opinion",
        rank: "major",
      },
      {
        name: "The dervish",
        domain: "the ascetic seeker",
        rank: "major",
      },
      {
        name: "The shrine",
        domain: "the saint's tomb, blessing",
        rank: "local",
      },
      {
        name: "The tariqah",
        domain: "the mystical order",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "blessing through lineage",
        rank: "local",
      },
    ],
    practice: [
      "The dhikr is chanted in the lodge; God's names are repeated to achieve presence.",
      "A spiritual guide leads a disciple through stages of knowledge toward union.",
      "Saints' tombs are visited; their intercession is sought for healing and blessing.",
      "The poor are fed at the saint's feast; the festival is the town's gathered joy.",
      "The dead are buried in shrouds washed in water blessed by a saint.",
    ],
    specialist:
      "The pir guides the mystical path; the mufti judges in sharia; the imam leads community prayer.",
    afterlife:
      "Union with God for the perfected saints; the garden or hell for others by their deeds.",
    evidence: {
      status: "documented",
      claim:
        "Ottoman court records, hagiographies of Sufi saints, travelers' accounts, tomb archaeology, and Sufi treatises document the integration of Sufism into Ottoman piety, the veneration of saints, and the role of mystical orders.",
      sources: [
        "Kunt and Woodhead, Süleymân the Magnificent and His Age",
        "Trimingham, The Sufi Orders in Islam",
        "Karamustafa, God's Unruly Friends",
      ],
      limitation:
        "Ottoman Islam encompassed diverse schools and practices; this describes one widely attested pattern.",
    },
  },
  {
    id: "post-1069-egypt",
    label: "Post-Fatimid Egyptian Islamic practice",
    scope: { years: [1069, 1450], bounds: [24, 22, 36, 32] },
    powers: [
      { name: "God", domain: "the Almighty, sovereignty", rank: "paramount" },
      {
        name: "Muhammad",
        domain: "the Prophet, intercession",
        rank: "major",
      },
      {
        name: "The Nile",
        domain: "annual flood, grain, blessing",
        rank: "major",
      },
      {
        name: "The saint",
        domain: "God's friends, healing",
        rank: "major",
      },
      {
        name: "The qadi",
        domain: "God's law and judgment",
        rank: "major",
      },
      {
        name: "The mosque",
        domain: "prayer and community",
        rank: "local",
      },
      {
        name: "The saint's tomb",
        domain: "blessing and intercession",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the family's honor and faith",
        rank: "local",
      },
    ],
    practice: [
      "The Nile's rise is watched and celebrated; prayers are offered for abundance.",
      "Saints' tombs are visited for healing, protection, and blessing.",
      "The five daily prayers are performed in congregation at the mosque.",
      "Fasting during Ramadan is kept strictly; the evening meal breaks the fast communally.",
      "The dead are wrapped in simple cloth and buried facing Mecca.",
    ],
    specialist:
      "The qadi judges by Islamic law; imams lead prayer; sheikhs guide saint cults.",
    afterlife: "Resurrection and divine judgment on the Day of Standing.",
    evidence: {
      status: "documented",
      claim:
        "Egyptian Islamic administrative records, Mamluk-era mosque inscriptions, travelers' accounts, and waqf endowment documents document the integration of Islamic law, Nile-centered practice, and saint veneration in medieval Egypt.",
      sources: [
        "Al-Maqrizi, Description of Egypt",
        "Lapidus, A History of Islamic Societies",
        "Dykstra, Intervening in the Islamic World",
      ],
      limitation:
        "Urban and elite practice is better attested than village faith; rural Egypt's syncretism with Coptic and Pharaonic memory is less visible.",
    },
  },
  {
    id: "nubian-nile-islam",
    label: "Nubian Nile and Islamic practice",
    scope: { years: [700, 1600], bounds: [32, 14, 38, 26] },
    powers: [
      { name: "God", domain: "the Creator", rank: "paramount" },
      {
        name: "The Nile",
        domain: "water, grain, life",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the royal line, protection",
        rank: "major",
      },
      {
        name: "The saint",
        domain: "God's chosen, blessing",
        rank: "major",
      },
      {
        name: "The king",
        domain: "justice and order",
        rank: "local",
      },
      {
        name: "The mosque",
        domain: "prayer and law",
        rank: "local",
      },
      {
        name: "The sacred tomb",
        domain: "the dead's blessing",
        rank: "local",
      },
    ],
    practice: [
      "The Nile's annual flood is celebrated with prayer and offering.",
      "The king performs court ceremonies before the assembled people.",
      "Saints' tombs are visited and their intercession sought for healing.",
      "The five prayers are performed; Friday prayer gathers the community.",
      "The dead are buried with their goods and face east toward Mecca.",
    ],
    specialist:
      "The qadi applies Islamic law; the king administers justice; sheikhs tend shrines.",
    afterlife:
      "Resurrection and divine judgment; continuation of the soul with the ancestors.",
    evidence: {
      status: "documented",
      claim:
        "Nubian kingdoms (Kush, Meroe, and the Christian kingdoms) transitioned to Islamic practice after the Arab conquest; Nubian Arabic inscriptions, royal tombs, and mosque archaeology show syncretism of ancestral royal reverence, Nile devotion, and Islamic law.",
      sources: [
        "Welsby, The Medieval Kingdoms of Nubia",
        "Shinnie, Meroe: A Civilization of the Sudan",
        "O'Fahey and Radtke, 'Neo-Sufism Reconsidered'",
      ],
      limitation:
        "The shift from Christianity to Islam was gradual; this describes a snapshot after consolidation.",
    },
  },
  {
    id: "maghreb-berber-islam",
    label: "Maghrebi Berber Islamic practice",
    scope: { years: [600, 1800], bounds: [-20, 12, 15, 40] },
    powers: [
      { name: "God", domain: "the Divine, justice", rank: "paramount" },
      {
        name: "Muhammad",
        domain: "the Prophet, exemplar",
        rank: "major",
      },
      {
        name: "The saint",
        domain: "God's friends, blessing",
        rank: "major",
      },
      {
        name: "The marabout",
        domain: "the holy man, healing",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the lineage, protection",
        rank: "major",
      },
      {
        name: "The land",
        domain: "the Maghreb, home",
        rank: "local",
      },
      {
        name: "The well",
        domain: "water in the dry lands",
        rank: "local",
      },
      {
        name: "The kasbah",
        domain: "fortress and gathering",
        rank: "local",
      },
    ],
    practice: [
      "Saint shrines mark the landscape; pilgrimage brings blessing and healing.",
      "The marabout leads prayer and resolves disputes; his word carries authority.",
      "The ancestors are honored; their tombs are tended and visited.",
      "Ramadan is observed with fasting and nightly gathering.",
      "The dead are wrapped and buried in the family cemetery facing Mecca.",
    ],
    specialist:
      "The marabout guides Islamic practice and judges disputes; families tend ancestral shrines.",
    afterlife:
      "Resurrection and divine judgment; the blessed enter God's garden.",
    evidence: {
      status: "documented",
      claim:
        "Berber Islamic inscriptions, saint hagiographies, Andalusian travel accounts, and tomb archaeology show the integration of Islamic law, saint veneration, and Berber ancestral reverence in the Maghreb.",
      sources: [
        "Bencheneb, 'Le culte des saints dans l'Islam algérien'",
        "Ibn Khaldun, The Muqaddimah",
        "McDougall and Scheele, Claiming the Desert",
      ],
      limitation:
        "Moroccan Sufi saint cults are better documented than Algerian and Tunisian practice; rural variations were significant.",
    },
  },
  {
    id: "arabian-peninsula-broader",
    label: "Islamic practice across the Arabian Peninsula",
    scope: { years: [600, 1800], bounds: [30, 10, 62, 35] },
    powers: [
      { name: "God", domain: "the Almighty", rank: "paramount" },
      {
        name: "Muhammad",
        domain: "the Prophet, the Seal",
        rank: "major",
      },
      {
        name: "The Quran",
        domain: "God's unchanging word",
        rank: "major",
      },
      {
        name: "The saint",
        domain: "God's friends, intercession",
        rank: "major",
      },
      {
        name: "The judge",
        domain: "God's law and justice",
        rank: "major",
      },
      {
        name: "The Kaaba",
        domain: "the house of God, pilgrimage",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the family line and honor",
        rank: "local",
      },
      {
        name: "The well",
        domain: "water and gathering",
        rank: "local",
      },
      {
        name: "The tribal leader",
        domain: "justice and order",
        rank: "local",
      },
    ],
    practice: [
      "The Kaaba is circumambulated during pilgrimage; millions gather for the hajj.",
      "The five prayers are performed daily, facing Mecca.",
      "Fasting during Ramadan is the mark of the faithful.",
      "Saints' tombs are visited for healing and blessing; their intercession is sought.",
      "The dead are buried wrapped in white cloth, facing Mecca.",
    ],
    specialist:
      "The qadi judges by Islamic law; the imam leads prayer; the shaykh maintains order.",
    afterlife: "Resurrection and divine judgment on the Day of Standing.",
    evidence: {
      status: "documented",
      claim:
        "Hadith collections, legal texts, pilgrimage accounts, and Arabic poetry document the standardization of Islamic practice across Arabia by the tenth century, the role of the Kaaba, and saint veneration.",
      sources: [
        "Peters, Muhammad and the Origins of Islam",
        "Serjeant, 'Materials for South Arabian History'",
        "Watt, The Formative Period of Islamic Thought",
      ],
      limitation:
        "Bedouin, urban, and settled oasis practice varied significantly; this describes a common framework.",
    },
  },
  {
    id: "persian-sufi-islam",
    label: "Persian Sufi Islamic practice",
    scope: { years: [900, 1600], bounds: [48, 25, 62, 38] },
    powers: [
      { name: "God", domain: "the Divine mystery", rank: "paramount" },
      {
        name: "Muhammad",
        domain: "the Perfect Man, exemplar",
        rank: "major",
      },
      {
        name: "The saint",
        domain: "God's beloved, guide",
        rank: "major",
      },
      {
        name: "The pir",
        domain: "the spiritual master",
        rank: "major",
      },
      {
        name: "The mystical path",
        domain: "union with God",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "blessing and wisdom",
        rank: "local",
      },
      {
        name: "The shrine",
        domain: "the saint's tomb, intercession",
        rank: "local",
      },
      {
        name: "Fire and water",
        domain: "purification, blessing",
        rank: "local",
      },
      {
        name: "The gathering",
        domain: "community and dhikr",
        rank: "local",
      },
    ],
    practice: [
      "The dhikr is chanted to achieve divine presence; God's names are repeated in rhythm.",
      "A disciple serves a spiritual master for years to reach enlightenment.",
      "Saints' tombs are centers of pilgrimage; their presence brings healing.",
      "Poetry and music are paths to the Divine; the beloved speaks in every verse.",
      "The dead are buried wrapped in white cloth; the saint's shrine receives prayers.",
    ],
    specialist:
      "The pir guides the path; the qadi judges God's law; poets speak the Divine.",
    afterlife:
      "Union with God for those perfected; the garden or separation for others by their love.",
    evidence: {
      status: "documented",
      claim:
        "Sufi treatises (Ghazali, Rumi, Hafiz), Persian poetry, shrine archaeology, and administrative records document the integration of Sufism into Persian Islamic practice, the veneration of saints, and the role of the mystical path.",
      sources: [
        "Schimmel, My Soul is a Woman",
        "Lewisohn, The Heritage of Sufism",
        "Safiri, 'Saints and Sanctuaries in Medieval Isfahan'",
      ],
      limitation:
        "Persian Sufism was diverse; urban orders and rural practice, orthodox and heterodox, varied widely.",
    },
  },
  {
    id: "anatolian-ottoman-islam",
    label: "Anatolian Ottoman Islamic practice",
    scope: { years: [1300, 1700], bounds: [26, 35, 46, 42] },
    powers: [
      { name: "God", domain: "the Divine sovereign", rank: "paramount" },
      {
        name: "Muhammad",
        domain: "the Prophet, intercessor",
        rank: "major",
      },
      {
        name: "The sultan",
        domain: "God's shadow on earth",
        rank: "major",
      },
      {
        name: "The qadi",
        domain: "Islamic law and justice",
        rank: "major",
      },
      {
        name: "The saint",
        domain: "God's beloved, blessing",
        rank: "major",
      },
      {
        name: "The mosque",
        domain: "prayer and community",
        rank: "local",
      },
      {
        name: "The shrine",
        domain: "the saint's tomb, intercession",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "family lineage and honor",
        rank: "local",
      },
    ],
    practice: [
      "The sultan performs public ceremonies; his piety is displayed in mosque endowments.",
      "The five prayers gather the faithful; Friday prayer brings community together.",
      "Saints' tombs are visited for healing; their saints' feast days bring crowds.",
      "Fasting during Ramadan and the pilgrimage to Mecca are duties.",
      "The dead are washed, wrapped in white cloth, and buried in the cemetery.",
    ],
    specialist:
      "The qadi judges by sharia; the imam leads prayer; the mufti interprets law.",
    afterlife:
      "Resurrection and divine judgment; the righteous enter God's garden.",
    evidence: {
      status: "documented",
      claim:
        "Ottoman inscriptions, waqf endowments, court records, and mosque archaeology document the state's role in Islam, the integration of saint veneration, and the standardization of Islamic practice.",
      sources: [
        "Faroqhi, Pilgrims and Sultans",
        "Kafadar, Between Two Worlds",
        "Veinstein, 'The Ottoman Empire and Islamic Law'",
      ],
      limitation:
        "Court Islam and village practice differed; Christian minorities and folk practices are less visible in sources.",
    },
  },
  {
    id: "caucasus-caspian-islam",
    label: "Caucasus and Caspian Islamic and traditional practice",
    scope: { years: [-2000, 2000], bounds: [44, 38, 64, 45] },
    powers: [
      { name: "God", domain: "the Divine creator", rank: "paramount" },
      {
        name: "The mountains",
        domain: "shelter, hunting, identity",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the lineage, protection",
        rank: "major",
      },
      {
        name: "The leader",
        domain: "the clan or tribe, justice",
        rank: "major",
      },
      {
        name: "The saint",
        domain: "blessing and intercession",
        rank: "major",
      },
      {
        name: "The hearth",
        domain: "the family and home",
        rank: "local",
      },
      {
        name: "The sanctuary",
        domain: "sacred ground, refuge",
        rank: "local",
      },
      {
        name: "The gathering place",
        domain: "community and tradition",
        rank: "local",
      },
    ],
    practice: [
      "The high peaks are honored as sacred; pilgrims climb them for blessing.",
      "The ancestors are invoked for protection and counsel in times of crisis.",
      "The clan leader holds court and settles disputes by custom and oath.",
      "Saints' tombs dot the landscape; their intercession is sought for healing.",
      "The dead are buried in family cemeteries; their memory is kept alive.",
    ],
    specialist:
      "The elder keeper of tradition; the saint as spiritual authority; the leader as temporal judge.",
    afterlife: "Presence with the ancestors; continuation in the family line.",
    evidence: {
      status: "hypothesis",
      claim:
        "The Caucasus peoples maintained complex layerings of pre-Islamic tradition, Islamic practice, and local custom from the medieval period onward. Mountain geography preserved ancestral reverence and community autonomy alongside Islamic law.",
      sources: [
        "Bennigsen and Wimbush, Muslims of the Soviet Empire",
        "Bulliet, The Camel and the Wheel",
        "Austin, The Bactrian Camel as an Agent of Technological Transfer",
      ],
      limitation:
        "The enormous diversity of Caucasus peoples and practices is flattened into a single schema.",
    },
  },
  {
    id: "modern-west-asia-islam",
    label: "Modern Islamic practice in West Asia and North Africa",
    scope: { years: [1750, 2100], bounds: [-18, 12, 62, 42] },
    powers: [
      { name: "God", domain: "the Creator, judge", rank: "paramount" },
      {
        name: "Muhammad",
        domain: "the Prophet, the Seal",
        rank: "major",
      },
      {
        name: "The nation",
        domain: "the modern state, law",
        rank: "major",
      },
      {
        name: "The Quran",
        domain: "God's word, instruction",
        rank: "major",
      },
      {
        name: "The scholar",
        domain: "interpretation of faith",
        rank: "major",
      },
      {
        name: "The mosque",
        domain: "prayer and community",
        rank: "local",
      },
      {
        name: "The school",
        domain: "education and tradition",
        rank: "local",
      },
      {
        name: "The family",
        domain: "honor, continuity, faith",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the faithful past",
        rank: "local",
      },
    ],
    practice: [
      "The five daily prayers remain central; they are performed at home, work, or mosque.",
      "Ramadan's fasting is observed; television and radio broadcast Quranic recitation.",
      "The pilgrimage to Mecca remains a goal for those who can afford it.",
      "Quranic schools teach children to memorize and recite God's word.",
      "The dead are buried facing Mecca; prayers are said at the mosque and cemetery.",
    ],
    specialist:
      "The imam leads prayer and teaches; the mufti and scholars interpret for modern times.",
    afterlife:
      "Resurrection and judgment; eternal reward or punishment in God's presence.",
    evidence: {
      status: "documented",
      claim:
        "Census data, Islamic institutional records, ethnographic studies, and observational accounts from the nineteenth century to present document the continuity of Islamic practice alongside nationalism, education, technology, and social change.",
      sources: [
        "Lapidus, A History of Islamic Societies",
        "Anderson, 'Law as Instrument of Change in the Middle East'",
        "Roy, The Globalized Islam",
      ],
      limitation:
        "Sectarian, regional, and class variations are enormous; secularism, reformism, and fundamentalism compete within Islam.",
    },
  },
];
