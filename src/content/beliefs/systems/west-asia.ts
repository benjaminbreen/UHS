import type { BeliefSystem } from "../types";

export const westAsia: readonly BeliefSystem[] = [
  {
    id: "west-asia-foragers",
    label: "Foraging communities of West Asia and North Africa",
    wiki: "https://en.wikipedia.org/wiki/Paleolithic_religion",
    scope: { years: [-10000, -2000], bounds: [-20, 10, 65, 45] },
    powers: [
      {
        name: "*Rapiʔū",
        gloss: "Proto-Semitic *rapiʔ-, 'shade, healer'; cf. Ugaritic rpum",
        domain: "the first people, memory",
        rank: "paramount",
      },
      {
        name: "*Śaydu",
        gloss: "Proto-Semitic *śayd-, 'hunt, game'",
        domain: "prey animals and their spirits",
        rank: "major",
      },
      {
        name: "*Mayu",
        gloss: "Proto-Afroasiatic *maw-, 'water'",
        domain: "rivers, springs, life",
        rank: "major",
      },
      {
        name: "*Ṣuru",
        gloss: "Proto-Semitic *ṣur-, 'rock, cliff'",
        domain: "rocks, caves, shelter",
        rank: "major",
      },
      {
        name: "*Šamayu",
        gloss: "Proto-Semitic *šamay-, 'sky'",
        domain: "weather, stars, the rains",
        rank: "major",
      },
      {
        name: "The shamanic guide",
        domain: "dreams and trance",
        rank: "local",
      },
      {
        name: "*ʔIšatu",
        gloss: "Proto-Semitic *ʔiš(a)t-, 'fire'",
        domain: "the camp's fire and gathering",
        rank: "local",
      },
      {
        name: "*ʔAbnu",
        gloss: "Proto-Semitic *ʔabn-, 'stone'",
        domain: "stone, bone, making",
        rank: "local",
      },
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
        "Kogan, Proto-Semitic Lexicon",
        "Ehret, Reconstructing Proto-Afroasiatic",
      ],
      limitation:
        "No language family reaches back to the Natufian and its neighbors: Proto-Semitic and Proto-Afroasiatic are themselves millennia later than this horizon. The starred forms above are the least indefensible stand-ins available, not recovered Epipalaeolithic words, and a reconstructed word for 'rock' or 'fire' is not evidence anyone worshipped a being by that name.",
    },
  },
  {
    id: "west-asia-early-farming",
    label: "Early farming and herding communities",
    wiki: "https://en.wikipedia.org/wiki/Neolithic_religion",
    scope: { years: [-2000, 500], bounds: [-18, 12, 62, 42] },
    powers: [
      {
        name: "*ʔArṣ́u",
        gloss: "Proto-Semitic *ʔarṣ́-, 'earth, land'",
        domain: "crops, fertility, the growing year",
        rank: "paramount",
      },
      {
        name: "*Ṣaʔnu",
        gloss: "Proto-Semitic *ṣaʔn-, 'flock, sheep and goats'",
        domain: "cattle, sheep, milk and wool",
        rank: "major",
      },
      {
        name: "*Mayu",
        gloss: "Proto-Afroasiatic *maw-, 'water'",
        domain: "rain, irrigation, life",
        rank: "major",
      },
      {
        name: "*Šamšu",
        gloss: "Proto-Semitic *šamš-, 'sun'",
        domain: "the ripening of grain",
        rank: "major",
      },
      {
        name: "*Baytu",
        gloss: "Proto-Semitic *bayt-, 'house, household'",
        domain: "family and continuity",
        rank: "major",
      },
      { name: "The ancestors", domain: "the land they worked", rank: "local" },
      {
        name: "*Biʔru",
        gloss: "Proto-Semitic *biʔr-, 'well'",
        domain: "drinking water, community",
        rank: "local",
      },
      {
        name: "*Gabulu",
        gloss: "Proto-Semitic *gbl, 'border, boundary'",
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
        "Huehnergard, An Introduction to Ugaritic",
        "Ehret, Reconstructing Proto-Afroasiatic",
      ],
      limitation:
        "The starred forms are comparative reconstructions of vocabulary, not recovered theonyms: nobody is recorded speaking them, and a word for 'earth' or 'well' is not evidence of a worshipped earth-being or well-spirit by that name. Proto-Semitic itself postdates the start of this horizon by a wide margin; the Afroasiatic-level forms reach further but are correspondingly less certain. Enormous ecological and regional variation is also flattened here; this is the floor beneath all specific traditions, not a single lived religion.",
    },
  },
  {
    id: "sumerian-city-states",
    label: "Sumerian city-state religion",
    wiki: "https://en.wikipedia.org/wiki/Sumerian_religion",
    scope: { years: [-3500, -1500], bounds: [40, 28, 52, 37] },
    powers: [
      {
        name: "Enlil",
        domain: "storm, fate, kingship",
        rank: "paramount",
        wiki: "https://en.wikipedia.org/wiki/Enlil",
      },
      {
        name: "Enki",
        domain: "fresh water, wisdom, craft",
        rank: "major",
        relations: [{ kind: "sibling-of", of: "Enlil" }],
        wiki: "https://en.wikipedia.org/wiki/Enki",
      },
      {
        name: "Utu",
        domain: "the sun, justice, the boundary",
        rank: "major",
        relations: [{ kind: "sibling-of", of: "Inanna" }],
        wiki: "https://en.wikipedia.org/wiki/Utu",
      },
      {
        name: "Inanna",
        domain: "love, war, the evening star",
        rank: "major",
        wiki: "https://en.wikipedia.org/wiki/Inanna",
      },
      {
        name: "Ninhursag",
        domain: "the mountains, birth",
        rank: "major",
        relations: [{ kind: "sibling-of", of: "Enlil" }],
        wiki: "https://en.wikipedia.org/wiki/Ninhursag",
      },
      {
        name: "The city god",
        domain: "the temple and its people",
        rank: "major",
        relations: [{ kind: "serves", of: "Enlil" }],
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
    wiki: "https://en.wikipedia.org/wiki/Ancient_Mesopotamian_religion",
    scope: { years: [-2000, -1400], bounds: [40, 29, 50, 37] },
    powers: [
      {
        name: "Marduk",
        domain: "Babylon, destiny, the tablets of fate",
        rank: "paramount",
        relations: [{ kind: "child-of", of: "Ea" }],
        wiki: "https://en.wikipedia.org/wiki/Marduk",
      },
      {
        name: "Ea",
        domain: "fresh water, craft, contracts",
        rank: "major",
        wiki: "https://en.wikipedia.org/wiki/Enki",
      },
      {
        name: "Shamash",
        domain: "the sun, law, justice",
        rank: "major",
        relations: [{ kind: "child-of", of: "Sin" }],
        wiki: "https://en.wikipedia.org/wiki/Shamash",
      },
      {
        name: "Sin",
        domain: "the moon, time, the night",
        rank: "major",
        wiki: "https://en.wikipedia.org/wiki/Sin_(mythology)",
      },
      {
        name: "Ishtar",
        domain: "love, fertility, battle",
        rank: "major",
        relations: [{ kind: "sibling-of", of: "Shamash" }],
        wiki: "https://en.wikipedia.org/wiki/Ishtar",
      },
      {
        name: "Ninhursag",
        domain: "birth and the wild",
        rank: "major",
        wiki: "https://en.wikipedia.org/wiki/Ninhursag",
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
    wiki: "https://en.wikipedia.org/wiki/Ancient_Mesopotamian_religion",
    scope: { years: [-1000, -500], bounds: [38, 32, 50, 40] },
    powers: [
      {
        name: "Ashur",
        domain: "Assyria, empire, fate",
        rank: "paramount",
        wiki: "https://en.wikipedia.org/wiki/Ashur_(god)",
      },
      {
        name: "Enlil",
        domain: "storm, the word of destiny",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "Ashur" }],
        wiki: "https://en.wikipedia.org/wiki/Enlil",
      },
      {
        name: "Shamash",
        domain: "the sun, truth, law",
        rank: "major",
        wiki: "https://en.wikipedia.org/wiki/Shamash",
      },
      {
        name: "Adad",
        domain: "storm, rain, the flood",
        rank: "major",
        relations: [{ kind: "child-of", of: "Anu" }],
        wiki: "https://en.wikipedia.org/wiki/Adad",
      },
      {
        name: "Ishtar",
        domain: "war, love, the evening star",
        rank: "major",
        relations: [{ kind: "child-of", of: "Anu" }],
        wiki: "https://en.wikipedia.org/wiki/Ishtar",
      },
      {
        name: "Anu",
        domain: "the sky, power",
        rank: "major",
        wiki: "https://en.wikipedia.org/wiki/Anu",
      },
      {
        name: "The royal standard",
        domain: "the army's presence",
        rank: "local",
        relations: [{ kind: "serves", of: "Ashur" }],
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
    wiki: "https://en.wikipedia.org/wiki/Canaanite_religion",
    scope: { years: [-1500, -300], bounds: [33, 30, 40, 37] },
    powers: [
      {
        name: "El",
        domain: "sky, authority, the ancestor",
        rank: "paramount",
        wiki: "https://en.wikipedia.org/wiki/El_(deity)",
      },
      {
        name: "Baal",
        domain: "storm, rain, the living land",
        rank: "major",
        relations: [{ kind: "rival-of", of: "Mot" }],
        wiki: "https://en.wikipedia.org/wiki/Baal",
      },
      {
        name: "Asherah",
        domain: "the great mother, fertility",
        rank: "major",
        relations: [{ kind: "consort-of", of: "El" }],
        wiki: "https://en.wikipedia.org/wiki/Asherah",
      },
      {
        name: "Anat",
        domain: "war, the hunt, raw power",
        rank: "major",
        relations: [{ kind: "sibling-of", of: "Baal" }],
        wiki: "https://en.wikipedia.org/wiki/Anat",
      },
      {
        name: "Mot",
        domain: "death and drought",
        rank: "major",
        wiki: "https://en.wikipedia.org/wiki/Mot_(god)",
      },
      {
        name: "The local baal",
        domain: "a town's prosperity",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "Baal" }],
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
    wiki: "https://en.wikipedia.org/wiki/Ancient_Israelite_religion",
    scope: { years: [-1000, -400], bounds: [34, 30, 37, 34] },
    powers: [
      {
        name: "YHWH",
        domain: "the God of Israel, the covenant",
        rank: "paramount",
        wiki: "https://en.wikipedia.org/wiki/Yahweh",
      },
      {
        name: "Baal",
        domain: "storm, rain, rival worship",
        rank: "major",
        relations: [{ kind: "rival-of", of: "YHWH" }],
        wiki: "https://en.wikipedia.org/wiki/Baal",
      },
      {
        name: "Asherah",
        domain: "the great mother, household devotion",
        rank: "major",
        relations: [{ kind: "consort-of", of: "YHWH" }],
        wiki: "https://en.wikipedia.org/wiki/Asherah",
      },
      {
        name: "The angel of YHWH",
        domain: "YHWH's presence and messenger",
        rank: "major",
        relations: [{ kind: "serves", of: "YHWH" }],
        wiki: "https://en.wikipedia.org/wiki/Angel_of_the_Lord",
      },
      {
        name: "Elijah",
        domain: "zeal against Baal, fire from heaven",
        rank: "major",
        relations: [{ kind: "serves", of: "YHWH" }],
        wiki: "https://en.wikipedia.org/wiki/Elijah",
      },
      {
        name: "The king",
        domain: "YHWH's chosen, the temple patron",
        rank: "major",
        relations: [{ kind: "serves", of: "YHWH" }],
      },
      {
        name: "The high priest",
        domain: "the temple, atonement",
        rank: "major",
        relations: [{ kind: "serves", of: "YHWH" }],
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
      "Asherah poles stand beside altars in many towns despite prophetic condemnation.",
      "Prophets cry out YHWH's judgment in the streets when the king breaks covenant.",
    ],
    specialist:
      "The high priest and Levites in the temple; prophets as YHWH's mouthpiece.",
    afterlife: "Sheol, an underworld place of shade and sleep.",
    evidence: {
      status: "documented",
      claim:
        "The centrality of the Jerusalem temple, the covenant theology, and the persistence of Baal and Asherah worship alongside YHWH are documented in the Hebrew Bible, the Kuntillet Ajrud inscriptions, the Black Obelisk of Shalmaneser, and Jerusalem archaeology.",
      sources: [
        "Smith, The Early History of God: Yahweh and the Other Deities",
        "Na'aman, 'The Law of the King in the Kingdom of Judah'",
        "Finkelstein, The Bible Unearthed",
      ],
      limitation:
        "Biblical texts reflect later redaction; pre-exile practice was more polytheistic than the finished text admits. Whether Asherah was worshipped as YHWH's consort, as the Kuntillet Ajrud inscriptions ('YHWH and his Asherah') suggest, or the phrase names a cult object rather than a paired goddess, is a live scholarly argument, not a settled reading.",
    },
  },
  {
    id: "second-temple-judaism",
    label: "Second Temple Jewish practice",
    wiki: "https://en.wikipedia.org/wiki/Second_Temple_Judaism",
    scope: { years: [-500, 200], bounds: [34, 30, 37, 34] },
    powers: [
      {
        name: "YHWH",
        domain: "the God of Israel, Creator",
        rank: "paramount",
        wiki: "https://en.wikipedia.org/wiki/Yahweh",
      },
      {
        name: "Michael",
        domain: "chief archangel, Israel's champion",
        rank: "major",
        relations: [{ kind: "serves", of: "YHWH" }],
        wiki: "https://en.wikipedia.org/wiki/Michael_(archangel)",
      },
      {
        name: "Gabriel",
        domain: "angelic messenger, revelation",
        rank: "major",
        relations: [{ kind: "serves", of: "YHWH" }],
        wiki: "https://en.wikipedia.org/wiki/Gabriel",
      },
      {
        name: "The Satan",
        domain: "the accuser, the adversary",
        rank: "major",
        relations: [{ kind: "rival-of", of: "YHWH" }],
        wiki: "https://en.wikipedia.org/wiki/Satan",
      },
      {
        name: "Hokhmah",
        domain: "Wisdom, present with God at creation",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "YHWH" }],
        wiki: "https://en.wikipedia.org/wiki/Hokhmah",
      },
      {
        name: "Elijah",
        domain: "the returning prophet, herald of the end",
        rank: "major",
        relations: [{ kind: "serves", of: "YHWH" }],
        wiki: "https://en.wikipedia.org/wiki/Elijah",
      },
      {
        name: "Abraham, Isaac and Jacob",
        domain: "the patriarchs of the covenant",
        rank: "local",
        wiki: "https://en.wikipedia.org/wiki/Patriarchs_(Bible)",
      },
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
        relations: [{ kind: "serves", of: "YHWH" }],
      },
      {
        name: "The sages",
        domain: "interpretation and justice",
        rank: "major",
      },
      {
        name: "The household",
        domain: "the family's covenant",
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
      "At Passover, a family gathers to remember the escape from Egypt, and a cup is set for Elijah.",
      "The Sabbath is kept by resting and praying from sunset to sunset.",
      "Michael is invoked as Israel's angelic champion against the forces of Belial, especially at Qumran.",
      "Ben Sira and the sages hymn Hokhmah as God's first creation, sent to dwell in Israel.",
      "Tzitzit fringes on garments remind the wearer of the 613 commandments.",
    ],
    specialist:
      "Priests and Levites in the temple; sages and scribes in the community.",
    afterlife:
      "Resurrection, reward for the faithful, and judgment for the wicked.",
    evidence: {
      status: "documented",
      claim:
        "Temple records, the Dead Sea Scrolls, the book of Daniel, Ben Sira and the Wisdom of Solomon, Malachi's expectation of Elijah's return, rabbinic literature, and Josephus document Second Temple ritual, the naming of Michael and Gabriel as YHWH's chief angels, the personification of Hokhmah, and the rise of synagogue practice alongside the temple.",
      sources: [
        "Sanders, Judaism: Practice and Belief 63 BCE - 66 CE",
        "Collins, The Apocalyptic Imagination",
        "Schwartz, Imperialism and Jewish Society",
        "von Rad, Wisdom in Israel",
      ],
      limitation:
        "Sectarian diversity was high; this describes mainstream practice, not Essenes or other groups.",
    },
  },
  {
    id: "achaemenid-zoroastrian",
    label: "Achaemenid Zoroastrian Iran",
    wiki: "https://en.wikipedia.org/wiki/Zoroastrianism_in_Iran",
    scope: { years: [-700, -200], bounds: [46, 24, 63, 40] },
    powers: [
      {
        name: "Ahura Mazda",
        domain: "wisdom, creation, good",
        rank: "paramount",
        wiki: "https://en.wikipedia.org/wiki/Ahura_Mazda",
      },
      {
        name: "Angra Mainyu",
        domain: "the hostile spirit, the lie",
        rank: "major",
        relations: [{ kind: "rival-of", of: "Ahura Mazda" }],
        wiki: "https://en.wikipedia.org/wiki/Angra_Mainyu",
      },
      {
        name: "Mithra",
        domain: "contract, oath, the all-seeing sun",
        rank: "major",
        wiki: "https://en.wikipedia.org/wiki/Mithra",
      },
      {
        name: "Anahita",
        domain: "the waters, fertility, sovereignty",
        rank: "major",
        wiki: "https://en.wikipedia.org/wiki/Anahita",
      },
      {
        name: "The king",
        domain: "Ahura Mazda's chosen, order",
        rank: "major",
        relations: [{ kind: "serves", of: "Ahura Mazda" }],
      },
      {
        name: "The Amesha Spentas",
        domain:
          "Vohu Manah, Asha Vahishta, Khshathra Vairya, Spenta Armaiti, Haurvatat and Ameretat, the Bounteous Immortals of creation",
        rank: "major",
        relations: [{ kind: "serves", of: "Ahura Mazda" }],
        wiki: "https://en.wikipedia.org/wiki/Amesha_Spenta",
      },
      {
        name: "Sraosha",
        domain: "obedience, the ritual word, discipline",
        rank: "major",
        relations: [{ kind: "serves", of: "Ahura Mazda" }],
        wiki: "https://en.wikipedia.org/wiki/Sraosha",
      },
      {
        name: "Atar",
        domain: "purification, Ahura Mazda's flame",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "Ahura Mazda" }],
        wiki: "https://en.wikipedia.org/wiki/Atar",
      },
      {
        name: "The magi",
        domain: "ritual and prayer",
        rank: "major",
        relations: [{ kind: "serves", of: "Ahura Mazda" }],
      },
      {
        name: "The fravashis",
        domain: "guardian spirits of the dead and unborn",
        rank: "local",
        wiki: "https://en.wikipedia.org/wiki/Fravashi",
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
    ],
    practice: [
      "Fire is tended in the home and never allowed to die.",
      "The dead are exposed on a tower so vultures can consume them, keeping them from defiling the earth.",
      "Mithra is invoked over oaths and contracts; Anahita's waters purify at her shrines.",
      "The magi perform rituals to keep chaos at bay and reward Ahura Mazda's creation.",
      "Contracts sworn before fire are inviolable.",
    ],
    specialist: "The magi, keepers of fire and ritual.",
    afterlife:
      "A bridge test for the soul: the righteous cross into light and blessing; the wicked fall into darkness.",
    evidence: {
      status: "documented",
      claim:
        "Achaemenid royal inscriptions naming Mithra and Anahita alongside Ahura Mazda, the Zoroastrian liturgy Yasna, Herodotus, and later Pahlavi texts document the supremacy of Ahura Mazda, the king's role, and the magi's authority.",
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
    wiki: "https://en.wikipedia.org/wiki/Hellenistic_religion",
    scope: { years: [-400, 100], bounds: [32, 31, 42, 39] },
    powers: [
      {
        name: "Zeus-Baal",
        domain: "the sky, rain, kingly power",
        rank: "paramount",
        wiki: "https://en.wikipedia.org/wiki/Zeus",
      },
      {
        name: "Athena",
        domain: "wisdom, craft, the city",
        rank: "major",
        relations: [{ kind: "child-of", of: "Zeus-Baal" }],
        wiki: "https://en.wikipedia.org/wiki/Athena",
      },
      {
        name: "Aphrodite-Astarte",
        domain: "love, fertility, the evening star",
        rank: "major",
        wiki: "https://en.wikipedia.org/wiki/Astarte",
      },
      {
        name: "Apollo",
        domain: "healing, the sun, music",
        rank: "major",
        relations: [{ kind: "child-of", of: "Zeus-Baal" }],
        wiki: "https://en.wikipedia.org/wiki/Apollo",
      },
      {
        name: "Hermes",
        domain: "commerce, travelers, thieves",
        rank: "major",
        relations: [{ kind: "child-of", of: "Zeus-Baal" }],
        wiki: "https://en.wikipedia.org/wiki/Hermes",
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
    wiki: "https://en.wikipedia.org/wiki/Zoroastrianism_in_Iran",
    scope: { years: [100, 700], bounds: [46, 24, 63, 40] },
    powers: [
      {
        name: "Ahura Mazda",
        domain: "wisdom, creation, light",
        rank: "paramount",
        wiki: "https://en.wikipedia.org/wiki/Ahura_Mazda",
      },
      {
        name: "Angra Mainyu",
        domain: "the hostile spirit, darkness, the lie",
        rank: "major",
        relations: [{ kind: "rival-of", of: "Ahura Mazda" }],
        wiki: "https://en.wikipedia.org/wiki/Angra_Mainyu",
      },
      {
        name: "The Shahanshah",
        domain: "the King of Kings, justice",
        rank: "major",
        relations: [{ kind: "serves", of: "Ahura Mazda" }],
      },
      {
        name: "The Amesha Spentas",
        domain:
          "Vohu Manah, Asha Vahishta, Khshathra Vairya, Spenta Armaiti, Haurvatat and Ameretat",
        rank: "major",
        relations: [{ kind: "serves", of: "Ahura Mazda" }],
        wiki: "https://en.wikipedia.org/wiki/Amesha_Spenta",
      },
      {
        name: "Mithra",
        domain: "contract, covenant, the all-seeing sun",
        rank: "major",
        wiki: "https://en.wikipedia.org/wiki/Mithra",
      },
      {
        name: "Anahita",
        domain: "the heavenly waters, fertility, kingship",
        rank: "major",
        wiki: "https://en.wikipedia.org/wiki/Anahita",
      },
      {
        name: "Verethragna",
        domain: "victory, martial force",
        rank: "major",
        wiki: "https://en.wikipedia.org/wiki/Verethragna",
      },
      {
        name: "Sraosha",
        domain: "obedience, ritual order, protection at night",
        rank: "major",
        relations: [{ kind: "serves", of: "Ahura Mazda" }],
        wiki: "https://en.wikipedia.org/wiki/Sraosha",
      },
      {
        name: "Atar",
        domain: "purification, the sacred flame",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "Ahura Mazda" }],
        wiki: "https://en.wikipedia.org/wiki/Atar",
      },
      {
        name: "The magi",
        domain: "priests and judges",
        rank: "major",
        relations: [{ kind: "serves", of: "Ahura Mazda" }],
      },
      {
        name: "The fravashis",
        domain: "guardian spirits, protection and wisdom",
        rank: "local",
        wiki: "https://en.wikipedia.org/wiki/Fravashi",
      },
      {
        name: "The hearth",
        domain: "household blessing",
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
        "Sasanian coins, inscriptions, the Avesta, the Denkard, and later Arab histories document the state enforcement of Zoroastrianism, the magi's judicial role, the cult of Mithra, Anahita and Verethragna, and ritual practice including exposure of the dead.",
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
    wiki: "https://en.wikipedia.org/wiki/Religion_in_pre-Islamic_Arabia",
    scope: { years: [200, 650], bounds: [33, 12, 60, 34] },
    powers: [
      {
        name: "Allah",
        domain: "the high god, fate",
        rank: "paramount",
        wiki: "https://en.wikipedia.org/wiki/Allah",
      },
      {
        name: "Al-Lat",
        domain: "the goddess, the land",
        rank: "major",
        relations: [{ kind: "child-of", of: "Allah" }],
        wiki: "https://en.wikipedia.org/wiki/Al-Lat",
      },
      {
        name: "Al-Uzza",
        domain: "the mighty, the morning star",
        rank: "major",
        relations: [
          { kind: "child-of", of: "Allah" },
          { kind: "sibling-of", of: "Al-Lat" },
        ],
        wiki: "https://en.wikipedia.org/wiki/Al-Uzza",
      },
      {
        name: "Manat",
        domain: "fate and death",
        rank: "major",
        relations: [
          { kind: "child-of", of: "Allah" },
          { kind: "sibling-of", of: "Al-Lat" },
        ],
        wiki: "https://en.wikipedia.org/wiki/Manat_(goddess)",
      },
      {
        name: "The jinn",
        domain: "spirits of place and wilderness",
        rank: "major",
        wiki: "https://en.wikipedia.org/wiki/Jinn",
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
    wiki: "https://en.wikipedia.org/wiki/Early_Islam",
    scope: { years: [600, 850], bounds: [33, 12, 60, 34] },
    powers: [
      {
        name: "God",
        domain: "the Creator, judgment",
        rank: "paramount",
        wiki: "https://en.wikipedia.org/wiki/God_in_Islam",
      },
      {
        name: "Muhammad",
        domain: "the Messenger, God's word",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Muhammad",
      },
      {
        name: "Jibril",
        domain: "revelation, God's messenger",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Gabriel",
      },
      {
        name: "Mika'il",
        domain: "sustenance, rain, providence",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Michael_(archangel)",
      },
      {
        name: "Israfil",
        domain: "the trumpet of the Last Day",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Israfil",
      },
      {
        name: "Munkar and Nakir",
        domain: "questioning of the newly dead",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Munkar_and_Nakir",
      },
      {
        name: "Iblis",
        domain: "the tempter, disobedience",
        rank: "major",
        relations: [{ kind: "rival-of", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Iblis",
      },
      {
        name: "The prophets",
        domain: "Ibrahim, Musa, Isa and God's earlier messengers",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
      },
      {
        name: "Khidr",
        domain: "the hidden guide, wisdom beyond the law",
        rank: "local",
        wiki: "https://en.wikipedia.org/wiki/Khidr",
      },
      {
        name: "The imam",
        domain: "community leader and prayer",
        rank: "local",
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
      "The Quran is memorized and chanted; Jibril is named as the spirit who brought it to Muhammad.",
      "Fasting from dawn to dusk is kept during the month of Ramadan.",
      "Alms are given to the poor; the tax is one part in forty of wealth.",
      "A pilgrimage to Mecca is made once in a lifetime if means allow.",
    ],
    specialist: "The imam leads prayer; the qadi judges by God's law.",
    afterlife:
      "The grave's solitude, questioned by Munkar and Nakir, then resurrection and divine judgment on the Day of Standing.",
    evidence: {
      status: "documented",
      claim:
        "The Quran, hadith collections, early Islamic legal texts, and archaeological evidence from seventh-century Mecca and Medina document the five pillars, the naming of Jibril, Mika'il, Israfil and Iblis, and the role of community and law.",
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
    wiki: "https://en.wikipedia.org/wiki/Sunni_Islam",
    scope: { years: [700, 1600], bounds: [-18, 10, 63, 42] },
    powers: [
      {
        name: "God",
        domain: "the Almighty, justice",
        rank: "paramount",
        wiki: "https://en.wikipedia.org/wiki/God_in_Islam",
      },
      {
        name: "Muhammad",
        domain: "the Seal of Prophets",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
      },
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
        name: "Jibril",
        domain: "revelation, the angel of the Quran",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Gabriel",
      },
      {
        name: "Iblis",
        domain: "temptation, disobedience",
        rank: "major",
        relations: [{ kind: "rival-of", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Iblis",
      },
      {
        name: "The caliph",
        domain: "God's vicegerent, the community",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
      },
      {
        name: "The qadi",
        domain: "judgment and the law",
        rank: "major",
      },
      {
        name: "Abd al-Qadir al-Jilani",
        domain: "founder of the Qadiriyya order, sainthood",
        rank: "major",
        relations: [{ kind: "taught-by", of: "Khidr" }],
        wiki: "https://en.wikipedia.org/wiki/Abdul-Qadir_Gilani",
      },
      {
        name: "Khidr",
        domain: "the hidden guide who instructs saints",
        rank: "local",
        wiki: "https://en.wikipedia.org/wiki/Khidr",
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
      "Pilgrimage to Mecca, to Abd al-Qadir al-Jilani's tomb in Baghdad, and to other saints' shrines fulfills devotion.",
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
        "Legal texts from the four law schools, hadith collections, the writings of Al-Ghazali, the hagiography of Abd al-Qadir al-Jilani, travelers' accounts, and cemetery archaeology document the standardized practices of Sunni Islam by the tenth century.",
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
    wiki: "https://en.wikipedia.org/wiki/Coptic_Orthodox_Church_of_Alexandria",
    scope: { years: [1000, 1700], bounds: [23, 20, 38, 34] },
    powers: [
      {
        name: "God the Father",
        domain: "creation and judgment",
        rank: "paramount",
      },
      {
        name: "Christ",
        domain: "the Savior, redemption",
        rank: "major",
        relations: [{ kind: "child-of", of: "God the Father" }],
      },
      { name: "The Holy Spirit", domain: "grace and guidance", rank: "major" },
      {
        name: "Mary",
        domain: "intercessor, protectress",
        rank: "major",
        relations: [{ kind: "serves", of: "Christ" }],
        wiki: "https://en.wikipedia.org/wiki/Mary,_mother_of_Jesus",
      },
      {
        name: "Michael",
        domain: "archangel, protector, intercessor",
        rank: "major",
        relations: [{ kind: "serves", of: "God the Father" }],
        wiki: "https://en.wikipedia.org/wiki/Michael_(archangel)",
      },
      {
        name: "Anthony the Great",
        domain: "father of monks, desert asceticism",
        rank: "major",
        relations: [{ kind: "serves", of: "God the Father" }],
        wiki: "https://en.wikipedia.org/wiki/Anthony_the_Great",
      },
      {
        name: "Mark the Evangelist",
        domain: "apostle, founder of the Egyptian church",
        rank: "major",
        relations: [{ kind: "serves", of: "Christ" }],
        wiki: "https://en.wikipedia.org/wiki/Mark_the_Evangelist",
      },
      {
        name: "The patriarch",
        domain: "church leadership and sacrament",
        rank: "major",
      },
      {
        name: "Saint Menas",
        domain: "healing shrine, pilgrimage at Abu Mina",
        rank: "local",
        wiki: "https://en.wikipedia.org/wiki/Saint_Menas",
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
      "Pilgrims travel to Anthony's monastery in the eastern desert and to Saint Menas's shrine at Abu Mina for healing.",
      "The dead are buried facing east; the priest prays the funeral liturgy.",
    ],
    specialist:
      "The patriarch and bishops; priests who perform the sacraments.",
    afterlife:
      "Paradise for the righteous, judgment and separation for sinners after death.",
    evidence: {
      status: "documented",
      claim:
        "Coptic liturgical manuscripts, church architecture, the hagiographies of Anthony and Mark, pilgrim graffiti at Abu Mina, and accounts by Arab and European travelers document the continuation of Egyptian Christianity despite Islamic rule, with visible Coptic liturgy, veneration of saints, and monastic tradition.",
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
    wiki: "https://en.wikipedia.org/wiki/Sufism",
    scope: { years: [1350, 1850], bounds: [18, 22, 52, 45] },
    powers: [
      {
        name: "God",
        domain: "the Divine, mysteries",
        rank: "paramount",
        wiki: "https://en.wikipedia.org/wiki/God_in_Islam",
      },
      {
        name: "Muhammad",
        domain: "the Perfect Man, intercessor",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Muhammad",
      },
      {
        name: "Jalal ad-Din Rumi",
        domain: "founder of the Mevlevi order, the whirling dhikr",
        rank: "major",
        wiki: "https://en.wikipedia.org/wiki/Rumi",
      },
      {
        name: "Haci Bektas Veli",
        domain: "founder of the Bektashi order, patron of the Janissaries",
        rank: "major",
        wiki: "https://en.wikipedia.org/wiki/Haji_Bektash_Veli",
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
        relations: [{ kind: "serves", of: "God" }],
      },
      {
        name: "Khidr",
        domain: "the hidden guide of wandering dervishes",
        rank: "local",
        wiki: "https://en.wikipedia.org/wiki/Khidr",
      },
      {
        name: "The dervish",
        domain: "the ascetic seeker",
        rank: "local",
        relations: [
          { kind: "taught-by", of: "Khidr" },
          { kind: "taught-by", of: "The pir" },
        ],
      },
      {
        name: "The shrine",
        domain: "the saint's tomb, blessing",
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
      "Saints' tombs, including Rumi's at Konya, are visited; their intercession is sought for healing and blessing.",
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
        "Ottoman court records, hagiographies of Rumi and Haci Bektas Veli, travelers' accounts, tomb archaeology, and Sufi treatises document the integration of Sufism into Ottoman piety, the veneration of saints, and the role of mystical orders.",
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
    wiki: "https://en.wikipedia.org/wiki/Islam_in_Egypt",
    scope: { years: [1069, 1450], bounds: [24, 22, 36, 32] },
    powers: [
      {
        name: "God",
        domain: "the Almighty, sovereignty",
        rank: "paramount",
        wiki: "https://en.wikipedia.org/wiki/God_in_Islam",
      },
      {
        name: "Muhammad",
        domain: "the Prophet, intercession",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Muhammad",
      },
      {
        name: "Ahmad al-Badawi",
        domain: "founder of the Badawiyya order, patron of Tanta",
        rank: "major",
        relations: [{ kind: "taught-by", of: "Muhammad" }],
        wiki: "https://en.wikipedia.org/wiki/Ahmad_al-Badawi",
      },
      {
        name: "The Nile",
        domain: "annual flood, grain, blessing",
        rank: "major",
      },
      {
        name: "The qadi",
        domain: "God's law and judgment",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
      },
      {
        name: "Khidr",
        domain: "the guide who appears at holy wells",
        rank: "local",
        wiki: "https://en.wikipedia.org/wiki/Khidr",
      },
      {
        name: "The mosque",
        domain: "prayer and community",
        rank: "local",
      },
      {
        name: "The saint's tomb",
        domain:
          "blessing and intercession, above all al-Badawi's shrine at Tanta",
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
      "Pilgrims gather at Ahmad al-Badawi's shrine in Tanta for healing, protection, and blessing.",
      "The five daily prayers are performed in congregation at the mosque.",
      "Fasting during Ramadan is kept strictly; the evening meal breaks the fast communally.",
      "The dead are wrapped in simple cloth and buried facing Mecca.",
    ],
    specialist:
      "The qadi judges by Islamic law; imams lead prayer; sheikhs guide the Badawiyya and other saint cults.",
    afterlife: "Resurrection and divine judgment on the Day of Standing.",
    evidence: {
      status: "documented",
      claim:
        "Egyptian Islamic administrative records, Mamluk-era mosque inscriptions, the hagiography of Ahmad al-Badawi, travelers' accounts, and waqf endowment documents document the integration of Islamic law, Nile-centered practice, and saint veneration in medieval Egypt.",
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
    wiki: "https://en.wikipedia.org/wiki/Islam_in_Sudan",
    scope: { years: [700, 1600], bounds: [32, 14, 38, 26] },
    powers: [
      {
        name: "God",
        domain: "the Creator",
        rank: "paramount",
        wiki: "https://en.wikipedia.org/wiki/God_in_Islam",
      },
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
        name: "Ghulam Allah ibn A'id",
        domain:
          "the scholar credited with bringing Islamic law to the Nile valley",
        rank: "major",
      },
      {
        name: "Idris wad al-Arbab",
        domain: "founding saint of Sudanese Sufism, teacher of holy men",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Idris_wad_al-Arbab",
      },
      {
        name: "Jibril",
        domain: "revelation, God's messenger",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Gabriel",
      },
      {
        name: "Khidr",
        domain: "the guide at the river's edge, patron of travelers",
        rank: "local",
        wiki: "https://en.wikipedia.org/wiki/Khidr",
      },
      {
        name: "The king",
        domain: "justice and order",
        rank: "local",
        relations: [{ kind: "serves", of: "God" }],
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
      "Sacred tombs are visited and their intercession sought for healing, above all the shrines of Idris wad al-Arbab and his students.",
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
        "Nubian kingdoms (Kush, Meroe, and the Christian kingdoms) transitioned to Islamic practice after the Arab conquest; Nubian Arabic inscriptions crediting scholars such as Ghulam Allah ibn A'id and the sixteenth-century hagiography of Idris wad al-Arbab, royal tombs, and mosque archaeology show syncretism of ancestral royal reverence, Nile devotion, and Islamic law.",
      sources: [
        "Welsby, The Medieval Kingdoms of Nubia",
        "Shinnie, Meroe: A Civilization of the Sudan",
        "O'Fahey and Radtke, 'Neo-Sufism Reconsidered'",
        "O'Fahey, 'Fashoda and the Origins of Sudanese Islam'",
      ],
      limitation:
        "The shift from Christianity to Islam was gradual; this describes a snapshot after consolidation.",
    },
  },
  {
    id: "maghreb-berber-islam",
    label: "Maghrebi Berber Islamic practice",
    wiki: "https://en.wikipedia.org/wiki/Maraboutism",
    scope: { years: [600, 1800], bounds: [-20, 12, 15, 40] },
    powers: [
      {
        name: "God",
        domain: "the Divine, justice",
        rank: "paramount",
        wiki: "https://en.wikipedia.org/wiki/God_in_Islam",
      },
      {
        name: "Muhammad",
        domain: "the Prophet, exemplar",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Muhammad",
      },
      {
        name: "Abu Madyan",
        domain: "father of Maghrebi Sufism, shrine at Tlemcen",
        rank: "major",
        relations: [{ kind: "taught-by", of: "Muhammad" }],
        wiki: "https://en.wikipedia.org/wiki/Abu_Madyan",
      },
      {
        name: "Ahmad al-Tijani",
        domain: "founder of the Tijaniyya order, Fez",
        rank: "major",
        relations: [{ kind: "taught-by", of: "Muhammad" }],
        wiki: "https://en.wikipedia.org/wiki/Ahmad_al-Tijani",
      },
      {
        name: "The marabout",
        domain: "holy men as a class: healing, blessing, arbitration",
        rank: "major",
        relations: [{ kind: "taught-by", of: "Abu Madyan" }],
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
      "Marabouts' shrines mark the landscape, from Abu Madyan's tomb at Tlemcen to countless village saints; pilgrimage brings blessing and healing.",
      "A marabout leads prayer and resolves disputes; his word carries authority.",
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
        "Berber Islamic inscriptions, the hagiographies of Abu Madyan and Ahmad al-Tijani, Andalusian travel accounts, and tomb archaeology show the integration of Islamic law, marabout veneration, and Berber ancestral reverence in the Maghreb.",
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
    wiki: "https://en.wikipedia.org/wiki/Islam_in_Saudi_Arabia",
    scope: { years: [600, 1800], bounds: [30, 10, 62, 35] },
    powers: [
      {
        name: "God",
        domain: "the Almighty",
        rank: "paramount",
        wiki: "https://en.wikipedia.org/wiki/God_in_Islam",
      },
      {
        name: "Muhammad",
        domain: "the Prophet, the Seal",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Muhammad",
      },
      {
        name: "The Quran",
        domain: "God's unchanging word",
        rank: "major",
      },
      {
        name: "Jibril",
        domain: "revelation, God's messenger",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Gabriel",
      },
      {
        name: "Iblis",
        domain: "temptation, the whisperer",
        rank: "major",
        relations: [{ kind: "rival-of", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Iblis",
      },
      {
        name: "Uways al-Qarani",
        domain: "the hidden saint, patron of mystics who never met the Prophet",
        rank: "major",
        relations: [{ kind: "taught-by", of: "Muhammad" }],
        wiki: "https://en.wikipedia.org/wiki/Uwais_al-Qarani",
      },
      {
        name: "Abdullah ibn Alawi al-Haddad",
        domain: "Hadhrami saint, teacher of the litany of the sayyids",
        rank: "major",
        relations: [{ kind: "taught-by", of: "Muhammad" }],
        wiki: "https://en.wikipedia.org/wiki/Abdallah_ibn_Alawi_al-Haddad",
      },
      {
        name: "The judge",
        domain: "God's law and justice",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
      },
      {
        name: "The Kaaba",
        domain: "the house of God, pilgrimage",
        rank: "local",
        wiki: "https://en.wikipedia.org/wiki/Kaaba",
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
      "In Hadramawt, al-Haddad's litany is recited nightly and his tomb at Tarim draws pilgrims seeking blessing.",
      "Uways al-Qarani is invoked as the model of hidden, unrewarded devotion.",
      "The dead are buried wrapped in white cloth, facing Mecca.",
    ],
    specialist:
      "The qadi judges by Islamic law; the imam leads prayer; the shaykh maintains order.",
    afterlife: "Resurrection and divine judgment on the Day of Standing.",
    evidence: {
      status: "documented",
      claim:
        "Hadith collections, legal texts, pilgrimage accounts, the hagiography of Uways al-Qarani, the writings and litany of Abdullah ibn Alawi al-Haddad, and Arabic poetry document the standardization of Islamic practice across Arabia by the tenth century, the role of the Kaaba, and saint veneration.",
      sources: [
        "Peters, Muhammad and the Origins of Islam",
        "Serjeant, 'Materials for South Arabian History'",
        "Watt, The Formative Period of Islamic Thought",
        "Ho, The Graves of Tarim",
      ],
      limitation:
        "Bedouin, urban, and settled oasis practice varied significantly; this describes a common framework.",
    },
  },
  {
    id: "persian-sufi-islam",
    label: "Persian Sufi Islamic practice",
    wiki: "https://en.wikipedia.org/wiki/Sufism",
    scope: { years: [900, 1600], bounds: [48, 25, 62, 38] },
    powers: [
      {
        name: "God",
        domain: "the Divine mystery",
        rank: "paramount",
        wiki: "https://en.wikipedia.org/wiki/God_in_Islam",
      },
      {
        name: "Muhammad",
        domain: "the Perfect Man, exemplar",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Muhammad",
      },
      {
        name: "Baha-ud-Din Naqshband",
        domain: "founder of the Naqshbandi order, silent dhikr",
        rank: "major",
        relations: [{ kind: "taught-by", of: "Muhammad" }],
      },
      {
        name: "Al-Ghazali",
        domain: "philosopher-mystic, reconciler of law and Sufism",
        rank: "major",
        wiki: "https://en.wikipedia.org/wiki/Al-Ghazali",
      },
      {
        name: "The pir",
        domain: "the spiritual master",
        rank: "major",
        relations: [{ kind: "taught-by", of: "Baha-ud-Din Naqshband" }],
      },
      {
        name: "Khidr",
        domain: "the hidden guide met on the mystical path",
        rank: "local",
        wiki: "https://en.wikipedia.org/wiki/Khidr",
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
        "Sufi treatises by al-Ghazali, Rumi and Hafiz, the hagiography of Baha-ud-Din Naqshband, Persian poetry, shrine archaeology, and administrative records document the integration of Sufism into Persian Islamic practice, the veneration of saints, and the role of the mystical path.",
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
    wiki: "https://en.wikipedia.org/wiki/Islam_in_Turkey",
    scope: { years: [1300, 1700], bounds: [26, 35, 46, 42] },
    powers: [
      {
        name: "God",
        domain: "the Divine sovereign",
        rank: "paramount",
        wiki: "https://en.wikipedia.org/wiki/God_in_Islam",
      },
      {
        name: "Muhammad",
        domain: "the Prophet, intercessor",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Muhammad",
      },
      {
        name: "Yunus Emre",
        domain: "Anatolian mystic-poet, sainthood in vernacular Turkish",
        rank: "major",
        relations: [{ kind: "taught-by", of: "Muhammad" }],
        wiki: "https://en.wikipedia.org/wiki/Yunus_Emre",
      },
      {
        name: "The sultan",
        domain: "God's shadow on earth",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
      },
      {
        name: "The qadi",
        domain: "Islamic law and justice",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
      },
      {
        name: "Khidr",
        domain: "the green guide, patron of travelers",
        rank: "local",
        wiki: "https://en.wikipedia.org/wiki/Khidr",
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
      "Yunus Emre's verses are sung at gatherings; his tomb draws pilgrims seeking blessing.",
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
        "Ottoman inscriptions, waqf endowments, court records, the poetry and hagiography of Yunus Emre, and mosque archaeology document the state's role in Islam, the integration of saint veneration, and the standardization of Islamic practice.",
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
    wiki: "https://en.wikipedia.org/wiki/Islam_in_Russia",
    scope: { years: [-2000, 2000], bounds: [44, 38, 64, 45] },
    powers: [
      {
        name: "God",
        domain: "the Divine creator",
        rank: "paramount",
        wiki: "https://en.wikipedia.org/wiki/God_in_Islam",
      },
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
        name: "Imam Shamil",
        domain: "Naqshbandi resistance leader, model of pious authority",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Imam_Shamil",
      },
      {
        name: "Kunta Haji Kishiev",
        domain: "Qadiri pir, teacher of the loud dhikr",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Kunta_Haji_Kishiev",
      },
      {
        name: "Khidr",
        domain: "the guide of the high pastures and passes",
        rank: "local",
        wiki: "https://en.wikipedia.org/wiki/Khidr",
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
      "Imam Shamil's resistance is remembered as a model of pious leadership.",
      "Kunta Haji Kishiev's followers turn in the loud dhikr at his shrine and lodges.",
      "The dead are buried in family cemeteries; their memory is kept alive.",
    ],
    specialist:
      "The elder keeper of tradition; the saint as spiritual authority; the leader as temporal judge.",
    afterlife: "Presence with the ancestors; continuation in the family line.",
    evidence: {
      status: "hypothesis",
      claim:
        "The Caucasus peoples maintained complex layerings of pre-Islamic tradition, Islamic practice, and local custom from the medieval period onward, including the Naqshbandi-led resistance of Imam Shamil and the Qadiri revival led by Kunta Haji Kishiev in the nineteenth century. Mountain geography preserved ancestral reverence and community autonomy alongside Islamic law.",
      sources: [
        "Bennigsen and Wimbush, Muslims of the Soviet Empire",
        "Bulliet, The Camel and the Wheel",
        "Austin, The Bactrian Camel as an Agent of Technological Transfer",
        "Zelkina, In Quest for God and Freedom",
      ],
      limitation:
        "The enormous diversity of Caucasus peoples and practices is flattened into a single schema.",
    },
  },
  {
    id: "modern-west-asia-islam",
    label: "Modern Islamic practice in West Asia and North Africa",
    wiki: "https://en.wikipedia.org/wiki/Islam_by_country",
    scope: { years: [1750, 2100], bounds: [-18, 12, 62, 42] },
    powers: [
      {
        name: "God",
        domain: "the Creator, judge",
        rank: "paramount",
        wiki: "https://en.wikipedia.org/wiki/God_in_Islam",
      },
      {
        name: "Muhammad",
        domain: "the Prophet, the Seal",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Muhammad",
      },
      {
        name: "Jibril",
        domain: "revelation, God's messenger",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Gabriel",
      },
      {
        name: "The nation",
        domain: "the modern state, law",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
      },
      {
        name: "The Quran",
        domain: "God's word, instruction",
        rank: "major",
      },
      {
        name: "Muhammad Abduh",
        domain: "reformist scholar, model of modern ijtihad",
        rank: "major",
        relations: [{ kind: "serves", of: "God" }],
        wiki: "https://en.wikipedia.org/wiki/Muhammad_Abduh",
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
        "Census data, Islamic institutional records, the writings of reformers such as Muhammad Abduh, ethnographic studies, and observational accounts from the nineteenth century to present document the continuity of Islamic practice alongside nationalism, education, technology, and social change.",
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
