import type { BeliefSystem } from "../types";
import {
  orthodoxTrinity,
  russianOrthodoxHolyFigures,
  russianOrthodoxPatronOptions,
} from "../kits/christian";

export const innerEurasia: readonly BeliefSystem[] = [
  {
    id: "inner-eurasia-foragers",
    label: "Inner Eurasian forager and early pastoral practice",
    wiki: "https://en.wikipedia.org/wiki/Prehistoric_religion",
    scope: { years: [-8000, -1200], bounds: [25, 25, 180, 82] },
    powers: [
      {
        name: "*Ilma",
        gloss: "Proto-Uralic *ilma, 'sky, air, weather'",
        domain: "weather, the high places, destiny",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "the camp's lineage and identity",
        rank: "major",
      },
      {
        name: "*Tuli",
        gloss: "Proto-Uralic *tuli, 'fire'",
        domain: "the camp, protection, daily sustenance",
        rank: "major",
      },
      {
        name: "*Qu'j",
        gloss:
          "Proto-Yeniseian *qu'j, 'wolverine', standing for the taiga's fiercest hunter",
        domain: "game and herds, the hunt's success",
        rank: "major",
      },
      {
        name: "*Wete",
        gloss: "Proto-Uralic *wete, 'water'",
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
        "Rédei, Uralisches etymologisches Wörterbuch",
        "Starostin, Sino-Caucasian and Yeniseian reconstructions",
      ],
      limitation:
        "The starred forms are comparative reconstructions of vocabulary, not recovered theonyms: nobody speaking this early is recorded using them, and a word for 'sky' or 'water' is not evidence of a sky god or water spirit by that name. Proto-Uralic and Proto-Yeniseian are themselves dated well after this entry's opening, and each covers only part of the huge west-east range given here, not the whole of it; no single reconstructed vocabulary honestly spans Volga forest to Pacific taiga, so most of this pantheon stays in the terms of function rather than word.",
    },
  },
  {
    id: "steppe-bronze-age",
    label: "Bronze Age steppe pastoralist practice",
    wiki: "https://en.wikipedia.org/wiki/Proto-Indo-European_religion",
    scope: { years: [-2000, -800], bounds: [25, 38, 150, 65] },
    powers: [
      {
        name: "*Dyēus Ph₂tḗr",
        wiki: "https://en.wikipedia.org/wiki/Dyeus",
        gloss: "Proto-Indo-European *dyēus ph₂tḗr, 'sky father'",
        domain: "the sky father, oaths, the far height",
        rank: "paramount",
      },
      {
        name: "*Perkʷunos",
        wiki: "https://en.wikipedia.org/wiki/Perkwunos",
        gloss: "Proto-Indo-European *perkʷunos, 'the striking one, thunder'",
        domain: "thunder, the storm, the warrior's weapon",
        rank: "major",
      },
      {
        name: "*H₂éwsōs",
        wiki: "https://en.wikipedia.org/wiki/Hausos",
        gloss: "Proto-Indo-European *h₂éwsōs, 'dawn'",
        domain: "the dawn, the opening of the day",
        rank: "major",
        relations: [{ kind: "child-of", of: "*Dyēus Ph₂tḗr" }],
      },
      {
        name: "*Seh₂wl̥",
        gloss: "Proto-Indo-European *seh₂wl̥ (nom. *sóh₂wl̥), 'sun'",
        domain: "the sun's journey across the sky",
        rank: "major",
        relations: [{ kind: "child-of", of: "*Dyēus Ph₂tḗr" }],
      },
      {
        name: "The ancestors",
        domain: "the herd's prosperity, lineage",
        rank: "major",
      },
      {
        name: "The master of the mountain",
        domain: "a named peak and its passes",
        rank: "local",
      },
      {
        name: "*H₂ep",
        gloss: "Proto-Indo-European *h₂ep-, 'water, river'",
        domain: "rivers, wells, safe drinking",
        rank: "local",
      },
      {
        name: "*H₁éḱwos",
        gloss: "Proto-Indo-European *h₁éḱwos, 'horse'",
        domain: "fertility and survival of the herd",
        rank: "local",
      },
      {
        name: "*Dʰéǵʰōm",
        gloss: "Proto-Indo-European *dʰéǵʰōm, 'earth'",
        domain: "campsites, burial, the underworld",
        rank: "local",
      },
      {
        name: "*H₁n̥gʷnis",
        gloss: "Proto-Indo-European *h₁n̥gʷnis, 'fire'",
        domain: "the hearth, purification, the offered portion",
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
      status: "hypothesis",
      claim:
        "Comparative linguistics reconstructs a Proto-Indo-European sky father and a separate thunder-wielding warrior god from cognate deity names across Vedic, Greek, Baltic, and Germanic traditions descended from Bronze Age steppe speech communities. Kurgan burials with horses and weapons, and stone arrangements on high ground, match the reconstructed cult.",
      sources: [
        "Anthony, The Horse, the Wheel, and Language",
        "Mallory and Adams, The Oxford Introduction to Proto-Indo-European and the Proto-Indo-European World",
        "West, Indo-European Poetry and Myth",
      ],
      limitation:
        "Every starred form here is a linguistic reconstruction, not a name anyone on the Bronze Age steppe is recorded as speaking; each is inferred backward from cognate vocabulary in daughter traditions attested a thousand years or more later, and a reconstructed word for 'horse' or 'water' is not itself proof that the community personified it as a power. The dawn and sun as daughters of the sky father follow comparative Indo-European poetics (West), not any single attested genealogy.",
    },
  },
  {
    id: "caucasus-early-peoples",
    label: "Caucasian mountain and foothill practice",
    wiki: "https://en.wikipedia.org/wiki/Circassian_mythology",
    scope: { years: [-2000, 1400], bounds: [35, 40, 60, 50] },
    powers: [
      {
        name: "Tha",
        domain: "the high peaks, sky, creation",
        rank: "paramount",
      },
      {
        name: "Shible",
        domain: "thunder, oaths, justice",
        rank: "major",
      },
      {
        name: "Psykhoguashe",
        domain: "rivers, the sea, fertility",
        rank: "major",
        relations: [{ kind: "consort-of", of: "Tha" }],
      },
      {
        name: "Mezitha",
        domain: "the forest, game, the hunt",
        rank: "major",
        relations: [{ kind: "child-of", of: "Tha" }],
      },
      {
        name: "The ancestors",
        domain: "the clan and its lands",
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
        name: "Sozeresh",
        domain: "agriculture, the harvest, fertility of the field",
        rank: "local",
        relations: [{ kind: "child-of", of: "Tha" }],
      },
    ],
    practice: [
      "A stone pillar marks a sacred place; oaths are sworn touching it.",
      "The dead are buried in a cairn or tower; weapons and goods accompany them.",
      "A river crossing receives an offering to Psykhoguashe; water is addressed respectfully.",
      "A hunt begins with invocation to Mezitha and to Tha above.",
    ],
    specialist: "The eldest of the clan; a person marked by visions.",
    afterlife:
      "The ancestors remain near their burial places; they aid and judge the living.",
    evidence: {
      status: "documented",
      claim:
        "Circassian and broader Northwest Caucasian ethnography, recorded from the nineteenth century and preserved in the Nart sagas, names Tha as supreme sky god with Shible, Psykhoguashe, Mezitha, and Sozeresh as a recognizable pantheon beneath him. Tower tombs and stone arrangements match the described practice.",
      sources: [
        "Colarusso, Nart Sagas from the Caucasus",
        "Tuite, 'Highland Georgian Paganism'",
        "Chirikba, 'Between Christianity and Islam: Heathen Amulets in the Caucasus'",
      ],
      limitation:
        "This pantheon is best recorded for Circassian-speaking peoples; neighboring Caucasus groups had cognate but distinct names, and this entry flattens that variation across a wide span of mountains and centuries. The family ties drawn here between Tha and Psykhoguashe, Mezitha, and Sozeresh follow composite Nart-saga tellings that vary between recorded versions, not one fixed genealogy.",
    },
  },
  {
    id: "volga-uralic-peoples",
    label: "Volga and Uralic peoples' early practice",
    wiki: "https://en.wikipedia.org/wiki/Proto-Uralic_religion",
    scope: { years: [-1500, 900], bounds: [42, 48, 70, 62] },
    powers: [
      {
        name: "*Num",
        gloss: "Proto-Uralic *num-/*lu-, 'sky, weather'",
        domain: "the sky, weather, the high realm",
        rank: "paramount",
      },
      {
        name: "The ancestors",
        domain: "the lineage, the land",
        rank: "major",
      },
      {
        name: "*Kala",
        gloss: "Proto-Uralic *kala, 'fish'",
        domain: "the Volga's fish and flow, travel by water",
        rank: "major",
      },
      {
        name: "*Ńoša",
        gloss: "Proto-Uralic *ńoša, 'hare'",
        domain: "the forest's hunted game, berries, the wild",
        rank: "major",
      },
      {
        name: "*Tuli",
        gloss: "Proto-Uralic *tuli, 'fire'",
        domain: "the house, family, blessing",
        rank: "local",
      },
      {
        name: "*Wete",
        gloss: "Proto-Uralic *wete, 'water'",
        domain: "wells, springs, water-crossings",
        rank: "local",
      },
      {
        name: "*Maa",
        gloss: "Proto-Uralic *maa, 'earth, land'",
        domain: "crops, fertility, the growing season",
        rank: "local",
      },
      {
        name: "The house spirit",
        domain: "the dwelling and its fortune",
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
      status: "hypothesis",
      claim:
        "Comparative Uralic linguistics reconstructs *num- as a Proto-Uralic sky/weather term, reflected in the Nenets Num, the Khanty and Mansi Torum, and cognate figures across the family; Rédei's etymological dictionary and Napolskikh's reconstruction of the Proto-Uralic world picture supply *kala, *ńoša, *tuli, *wete and *maa as securely comparable vocabulary for fish, game, fire, water and land. Archaeological evidence from Volga settlement and burial sites independently shows continuity of forest-river settlement, ancestor veneration, and fire ritual through this span.",
      sources: [
        "Napolskikh, 'Proto-Uralic World Picture: A Reconstruction'",
        "Rédei, Uralisches etymologisches Wörterbuch",
        "Chernykh, The Steppes and the Sown",
        "Khazanov, Nomads and the Outside World",
      ],
      limitation:
        "The starred forms are reconstructed words, not recovered names of powers: nobody in this period is recorded calling the sky *num or the fish *kala as an address to a spirit, and the reconstruction is built from far later, geographically scattered daughter languages. The specific Permic and Mari pantheon later attested on the Volga (Inmar, Keremet, and their kin) postdates this entry and is not projected backward here.",
    },
  },
  {
    id: "scythian-practice",
    label: "Scythian religious practice",
    wiki: "https://en.wikipedia.org/wiki/Scythian_religion",
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
        relations: [{ kind: "consort-of", of: "Papaios" }],
      },
      { name: "Papaios", domain: "ancestor of all Scythians", rank: "major" },
      {
        name: "Goitosyros",
        domain: "the sun, healing, prophecy",
        rank: "major",
      },
      {
        name: "Argimpasa",
        domain: "love, the moon, royal legitimacy",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the royal and warrior dead",
        rank: "major",
        relations: [{ kind: "child-of", of: "Papaios" }],
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
        "Herodotus names Tabiti, Papaios, Api, Goitosyros, and Argimpasa as the Scythians' own names for gods he equates with Hestia, Zeus, Gaia, Apollo, and Aphrodite Urania, and describes Scythian altars, sacrifice, and priestesses; archaeological evidence of kurgan burials, sacrificed horses, and the iron sword cult confirms the pattern.",
      sources: [
        "Herodotus, Histories Book 4",
        "Davis-Kimball, Warrior Women",
        "Rolle, The World of the Scythians",
      ],
      limitation:
        "Herodotus wrote from a Greek outsider's perspective and gives no native name for Ares' Scythian equivalent; the iron sword cult is inferred from burials rather than contemporary texts.",
    },
  },
  {
    id: "post-scythian-steppe",
    label: "Post-Scythian steppe and Central Asian pastoral practice",
    wiki: "https://en.wikipedia.org/wiki/Tengrism",
    scope: { years: [-250, 550], bounds: [40, 38, 110, 56] },
    powers: [
      {
        name: "Tengri",
        wiki: "https://en.wikipedia.org/wiki/Tengri",
        domain: "the sky, destiny, the chiefs",
        rank: "paramount",
      },
      {
        name: "Umai",
        wiki: "https://en.wikipedia.org/wiki/Umay",
        domain: "mothers, children, fertility",
        rank: "major",
        relations: [
          { kind: "consort-of", of: "Tengri" },
          { kind: "aspect-of", of: "Etügen" },
        ],
      },
      {
        name: "Etügen",
        wiki: "https://en.wikipedia.org/wiki/Etugen",
        domain: "the land, fertility, the camps",
        rank: "major",
      },
      {
        name: "Ötüken",
        wiki: "https://en.wikipedia.org/wiki/%C3%96t%C3%BCken",
        domain: "the sacred mountain forest, the seat of chiefs",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the shamanic dead and past leaders",
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
      "Ötüken is marked with a pile of stones; travelers add stones and speak their need.",
    ],
    specialist:
      "The shamans who maintain the hidden world; the chief as Tengri's voice.",
    afterlife:
      "The shamans claim the dead return to the sky; shamans consult them for the living.",
    evidence: {
      status: "hypothesis",
      claim:
        "Tengri, Umai, Etügen, and Ötüken are directly attested only from later Old Turkic inscriptions; Chinese sources describe post-Scythian steppe peoples with sky reverence, shamanic mediation, and ancestor consultation consistent with this cosmology, and continuity is assumed backward across the gap.",
      sources: [
        "Di Cosmo, The Jurchens and Khitans",
        "Barfield, The Perilous Frontier",
        "Christian, A History of Russia, Central Asia and Mongolia",
      ],
      limitation:
        "The named pantheon here is projected back from Old Turkic sources several centuries later; no text from this period itself gives these names to the peoples of the post-Scythian steppe.",
    },
  },
  {
    id: "xiongnu-steppe",
    label: "Xiongnu steppe confederation practice",
    wiki: "https://en.wikipedia.org/wiki/Tengrism",
    scope: { years: [-300, 200], bounds: [60, 38, 140, 62] },
    powers: [
      {
        name: "Tengri",
        wiki: "https://en.wikipedia.org/wiki/Tengri",
        domain: "the sky, destiny, the khans",
        rank: "paramount",
      },
      {
        name: "Etügen",
        wiki: "https://en.wikipedia.org/wiki/Etugen",
        domain: "the land, prosperity, the camps",
        rank: "major",
        relations: [{ kind: "consort-of", of: "Tengri" }],
      },
      {
        name: "The ancestors",
        domain: "the shamanic dead and past khans",
        rank: "major",
      },
      {
        name: "Ötüken",
        wiki: "https://en.wikipedia.org/wiki/%C3%96t%C3%BCken",
        domain: "a sacred mountain forest where khans take power",
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
      "Ötüken is marked with a pile of stones; travelers add stones and speak their need.",
    ],
    specialist:
      "The shamans who maintain the hidden world; the khan as Tengri's earthly voice.",
    afterlife:
      "The shamans claim the dead return to the sky but are consulted by the shamans.",
    evidence: {
      status: "hypothesis",
      claim:
        "Chinese sources transliterate a Xiongnu sky-title, 'Chengli', widely read as cognate with Tengri, alongside descriptions of Xiongnu sky worship and shamanism; later Mongol and Turkic practice preserves Etügen and Ötüken, suggesting continuity of a shared steppe cosmology.",
      sources: [
        "Sima Qian, Records of the Grand Historian",
        "Di Cosmo, The Jurchens and Khitans",
        "Barfield, The Perilous Frontier",
      ],
      limitation:
        "Chinese sources are outsiders' accounts and the Xiongnu left no written record of their own beliefs; the fuller named pantheon is drawn from centuries-later Turkic and Mongol continuity, not Xiongnu texts.",
    },
  },
  {
    id: "turkic-tengrism",
    label: "Early Turkic Tengrism",
    wiki: "https://en.wikipedia.org/wiki/Tengrism",
    scope: { years: [550, 900], bounds: [50, 38, 130, 58] },
    powers: [
      {
        name: "Tengri",
        wiki: "https://en.wikipedia.org/wiki/Tengri",
        domain: "the sky, destiny, the khans",
        rank: "paramount",
      },
      {
        name: "Umai",
        wiki: "https://en.wikipedia.org/wiki/Umay",
        domain: "the land, fertility, the tent",
        rank: "major",
        relations: [{ kind: "consort-of", of: "Tengri" }],
      },
      {
        name: "Yer-Sub",
        domain: "the sacred land and waters, oaths",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "guidance of the living khans",
        rank: "major",
      },
      {
        name: "Ötüken",
        wiki: "https://en.wikipedia.org/wiki/%C3%96t%C3%BCken",
        domain: "center of the world, the khans' seat",
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
      "A new khan is legitimized by Tengri; oath-taking invokes Yer-Sub, land and water together.",
      "Ötüken is visited by shamans seeking Tengri's will.",
      "Fire is protected and honored; a woman stepping over it brings shame.",
      "Springs are left undisturbed and marked with stones and cloth.",
    ],
    specialist: "Shamans who ascend to Tengri; the khan as his chosen vessel.",
    afterlife:
      "The spirit joins Tengri in the sky; shamans become guide-ancestors.",
    evidence: {
      status: "documented",
      claim:
        "The Orkhon inscriptions name Tengri, Umai, and the Yer-Sub (land-water) complex directly, tie khanly legitimacy to Tengri's mandate, and place Ötüken as the sacred seat of power; later Mongol and Islamic sources preserve shamanic elements consistent with this cosmology.",
      sources: [
        "Orkun, The History of Turkish Language",
        "Golden, An Introduction to the History of the Turkic Peoples",
        "Sinor, The Turks in the Early Islamic World",
      ],
      limitation:
        "The Orkhon inscriptions are royal and formulaic; ordinary practice beneath the khanly cult is inferred from later Mongol continuity and Islamic accounts of pre-conversion belief.",
    },
  },
  {
    id: "sogdian-zoroastrianism",
    label: "Sogdian Zoroastrian and Manichaean practice",
    wiki: "https://en.wikipedia.org/wiki/Zoroastrianism",
    scope: { years: [-300, 1000], bounds: [50, 35, 80, 50] },
    powers: [
      {
        name: "Ahura Mazda",
        wiki: "https://en.wikipedia.org/wiki/Ahura_Mazda",
        domain: "wisdom, light, the good creation",
        rank: "paramount",
      },
      {
        name: "The good spirits",
        domain: "health, righteousness, increase",
        rank: "major",
        relations: [{ kind: "serves", of: "Ahura Mazda" }],
      },
      {
        name: "Ahriman",
        wiki: "https://en.wikipedia.org/wiki/Angra_Mainyu",
        domain: "darkness, deceit, disease",
        rank: "major",
        relations: [{ kind: "rival-of", of: "Ahura Mazda" }],
      },
      {
        name: "Fire",
        domain: "purification, the sacred element",
        rank: "local",
        relations: [{ kind: "child-of", of: "Ahura Mazda" }],
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
        "Sogdian merchant colonies in China and Central Asia maintain fire temples; texts preserve Zoroastrian and Manichaean prayers naming Ahura Mazda and Ahriman and their cosmology.",
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
    wiki: "https://en.wikipedia.org/wiki/Bon",
    scope: { years: [-800, 1200], bounds: [75, 25, 105, 40] },
    powers: [
      {
        name: "Shenlha Okar",
        wiki: "https://en.wikipedia.org/wiki/Shenlha_Okar",
        domain: "light, compassion, the highest heaven",
        rank: "paramount",
      },
      {
        name: "Sipe Gyalmo",
        domain: "protection, fate, the Bon teachings",
        rank: "major",
        relations: [{ kind: "serves", of: "Tonpa Shenrab" }],
      },
      {
        name: "Tonpa Shenrab",
        wiki: "https://en.wikipedia.org/wiki/Tonpa_Shenrab",
        domain: "the Bon teachings, the founder's wisdom",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "Shenlha Okar" }],
      },
      {
        name: "Sa Yi Lha Mo",
        domain: "the earth, fertility, crops",
        rank: "major",
      },
      {
        name: "Nyenchen Thanglha",
        wiki: "https://en.wikipedia.org/wiki/Nyenchen_Tanglha",
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
    ],
    practice: [
      "A stone cairn (lha-rtse) is built on a pass; people add stones and circle clockwise.",
      "Nyenchen Thanglha is walked around to honor its master; prayer flags are strung on high places.",
      "The dead are offered water; sky burial returns the body to the birds.",
      "Ritual fire is lit at dawn; juniper smoke marks the beginning of the day.",
    ],
    specialist:
      "The Bon po priest or shaman; the head of a clan for family rites.",
    afterlife:
      "The spirit ascends to the sky or returns through rebirth; the body is returned to nature.",
    evidence: {
      status: "documented",
      claim:
        "Tibetan Bon texts name Shenlha Okar, Tonpa Shenrab, Sipe Gyalmo, and Sa Yi Lha Mo among their pantheon, and Buddhist accounts describe Bon practice in detail as they encountered and absorbed it. Sky burial, sacred mountains such as Nyenchen Thanglha, and water worship appear in both traditions.",
      sources: [
        "Karmay, The Arrow and the Spindle",
        "Blondeau, Religions of Tibet in Practice",
        "Samuel, Civilized Shamans",
      ],
      limitation:
        "Bon texts were recorded late and often intermixed with Buddhist material; early Bon is reconstructed from critique by Buddhist sources. Tonpa Shenrab as an emanation of Shenlha Okar reflects later systematized Bon cosmology rather than a single founding account.",
    },
  },
  {
    id: "siberian-shamanism",
    label: "Siberian shamanic practice",
    wiki: "https://en.wikipedia.org/wiki/Siberian_shamanism",
    scope: { years: [-1000, 1950], bounds: [25, 35, 180, 90] },
    powers: [
      {
        name: "Numi-Torum",
        domain: "the high realm, destiny, creation",
        rank: "paramount",
      },
      {
        name: "Kaltash-Ekwa",
        domain: "the earth, birth, fate",
        rank: "major",
        relations: [{ kind: "consort-of", of: "Numi-Torum" }],
      },
      {
        name: "Ulgen",
        wiki: "https://en.wikipedia.org/wiki/Ulgen",
        domain: "the upper world, creation's order, benevolence",
        rank: "major",
      },
      {
        name: "Erlik",
        wiki: "https://en.wikipedia.org/wiki/Erlik",
        domain: "the underworld, death, judgment",
        rank: "major",
        relations: [
          { kind: "sibling-of", of: "Ulgen" },
          { kind: "rival-of", of: "Ulgen" },
        ],
      },
      {
        name: "The ancestors",
        domain: "guidance, shamanic power",
        rank: "major",
      },
      {
        name: "Bayanai",
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
      "The first kill of a hunt is offered to Bayanai with gratitude.",
      "A bear killed in the hunt is honored with a feast; its skull is set high in a tree or on a pole.",
      "A drum hangs in the house to ward off malicious spirits.",
      "At the solstice, offerings of fat and meat are left in the forest for the masters.",
    ],
    specialist:
      "The shaman, marked by illness or inheritance, who travels between realms.",
    afterlife:
      "A shaman's soul may become a helper spirit; the ordinary dead join Kaltash-Ekwa in the earth.",
    evidence: {
      status: "documented",
      claim:
        "Ob-Ugric ethnography names Numi-Torum and Kaltash-Ekwa as the high sky-earth pair; Altai and Turkic-Mongol Siberian traditions attest Ulgen and Erlik as opposed upper- and under-world rulers; Yakut ethnography names Bayanai as master of the taiga and the hunt. The bear ceremony is documented across Siberian and circumpolar peoples alike.",
      sources: [
        "Eliade, Shamanism",
        "Dioszegi, Popular Beliefs and Folklore Tradition in Siberia",
        "Humphrey, Shamans and Elders",
      ],
      limitation:
        "This entry merges pantheons from distinct language families (Ob-Ugric, Turkic, Mongolic, Yakut) under one Siberian umbrella; no single community held all of these names at once. The brotherhood and rivalry given here for Ulgen and Erlik follow one strand of Altai tradition (Anokhin); other tellings treat them as independent rather than kin.",
    },
  },
  {
    id: "central-asian-islam",
    label: "Central Asian Islamic practice with Sufi and shrine elements",
    wiki: "https://en.wikipedia.org/wiki/Islam_in_Central_Asia",
    scope: { years: [900, 1900], bounds: [45, 32, 85, 50] },
    powers: [
      {
        name: "Allah",
        wiki: "https://en.wikipedia.org/wiki/Allah",
        domain: "the divine, creation, judgment",
        rank: "paramount",
      },
      {
        name: "Muhammad",
        wiki: "https://en.wikipedia.org/wiki/Muhammad",
        domain: "the messenger, intercession",
        rank: "major",
        relations: [{ kind: "serves", of: "Allah" }],
      },
      {
        name: "Khoja Ahmad Yasawi",
        wiki: "https://en.wikipedia.org/wiki/Ahmad_Yasawi",
        domain: "sainthood, the Yasawi order, intercession",
        rank: "major",
        relations: [{ kind: "taught-by", of: "Muhammad" }],
      },
      {
        name: "Khizr",
        wiki: "https://en.wikipedia.org/wiki/Khidr",
        domain: "hidden guidance, water, the traveler's protector",
        rank: "major",
        relations: [{ kind: "serves", of: "Allah" }],
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
      "The graves of the pious, and of masters in Khoja Ahmad Yasawi's line, are visited at festival time with food, cloth, and prayer.",
    ],
    specialist:
      "The mullah and the Sufi teacher; the keeper of a shrine or holy site.",
    afterlife:
      "Judgment by Allah and eternal reward or punishment; the righteous intercede.",
    evidence: {
      status: "documented",
      claim:
        "Medieval Islamic geographies and later ethnographic accounts describe shrine devotion, the Yasawi Sufi order founded by Khoja Ahmad Yasawi, veneration of Khizr, and local practice across Central Asia; archaeological evidence of mazar complexes confirms long histories.",
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
    wiki: "https://en.wikipedia.org/wiki/Mongolian_shamanism",
    scope: { years: [1150, 1280], bounds: [55, 38, 135, 58] },
    powers: [
      {
        name: "Tengri",
        wiki: "https://en.wikipedia.org/wiki/Tengri",
        domain: "the sky, Chinggis's mandate",
        rank: "paramount",
      },
      {
        name: "Etügen",
        wiki: "https://en.wikipedia.org/wiki/Etugen",
        domain: "the land and its fertility",
        rank: "major",
        relations: [{ kind: "consort-of", of: "Tengri" }],
      },
      {
        name: "Umai",
        wiki: "https://en.wikipedia.org/wiki/Umay",
        domain: "children, the ger's fertility, protection",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "Etügen" }],
      },
      {
        name: "Erlik",
        wiki: "https://en.wikipedia.org/wiki/Erlik",
        domain: "the underworld, judgment of the dead",
        rank: "major",
        relations: [{ kind: "rival-of", of: "Tengri" }],
      },
      {
        name: "The ancestors",
        domain: "Chinggis's lineage, shamanic guide-spirits",
        rank: "major",
      },
      {
        name: "Burhan Khaldun",
        wiki: "https://en.wikipedia.org/wiki/Burkhan_Khaldun",
        domain: "the sacred mountain, center of power",
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
        "Mongol sources (The Secret History), Persian historians (Rashid al-Din), and Chinese accounts all describe Tengri worship, ancestor veneration, and sacred geography under Chinggis, naming Burhan Khaldun directly as his mountain of refuge and worship.",
      sources: [
        "Secret History of the Mongols",
        "Rashid al-Din, Jami' al-tawarikh",
        "Allsen, The Cultural Mosaic of the Mongol Empire",
      ],
      limitation:
        "Accounts mix shamanism, ancestor cults, and later Buddhist and Islamic influences; Erlik's role as underworld judge is better attested in later Mongol Buddhist tradition than in Chinggis's own lifetime.",
    },
  },
  {
    id: "siberian-russian-hybrid",
    label: "Russian Orthodox Christianity in Siberia",
    wiki: "https://en.wikipedia.org/wiki/Russian_Orthodox_Church",
    scope: {
      years: [1600, 1900],
      cultures: ["european"],
      bounds: [60, 48, 180, 80],
    },
    powers: [...orthodoxTrinity, ...russianOrthodoxHolyFigures],
    patronOptions: russianOrthodoxPatronOptions,
    practice: [
      "The Divine Liturgy, baptisms, marriages, and burials order communal life.",
      "Icons of Christ, the Theotokos, and the saints stand in the household icon corner.",
      "Fasts and feasts shape the year; a person's name saint receives particular devotion.",
      "The dead are remembered in prayer and at annual commemorations.",
    ],
    specialist:
      "The Orthodox parish priest; monks and bishops serve wider areas.",
    afterlife: "Resurrection, judgement, and the life of the world to come.",
    evidence: {
      status: "documented",
      claim:
        "Church and colonial records document Russian Orthodox parishes, monasteries, icons, sacraments, feast days, and saint veneration across Russian settlements in Siberia.",
      sources: [
        "Slezkine, Arctic Mirrors",
        "Ivanits, Russian Folk Belief",
        "Anderson, Living in the Land of Hunger",
      ],
      limitation:
        "This is the Orthodox profile, not a claim that every Siberian community was Russian or Christian. Indigenous traditions and mixed practices require their own community-scoped profiles.",
    },
  },
  {
    id: "tarim-basin-peoples",
    label: "Tarim Basin oasis and desert practice",
    wiki: "https://en.wikipedia.org/wiki/Silk_Road_transmission_of_Buddhism",
    scope: { years: [-1000, 1900], bounds: [75, 35, 95, 44] },
    powers: [
      {
        name: "Vaiśravaṇa",
        wiki: "https://en.wikipedia.org/wiki/Vaishravana",
        domain: "kingship, guardianship, the north",
        rank: "paramount",
      },
      {
        name: "Maitreya",
        wiki: "https://en.wikipedia.org/wiki/Maitreya",
        domain: "the future Buddha, salvation, pilgrimage",
        rank: "major",
      },
      {
        name: "Hariti",
        wiki: "https://en.wikipedia.org/wiki/Hariti",
        domain: "childbirth, protection of children",
        rank: "major",
      },
      {
        name: "Mahākāla",
        wiki: "https://en.wikipedia.org/wiki/Mahakala",
        domain: "wrathful protection, disease, the desert's dangers",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "the oasis settlement and its dead",
        rank: "major",
      },
      {
        name: "The water spirits",
        domain: "rivers, aquifers, oases",
        rank: "local",
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
    ],
    practice: [
      "A well is offered libations at dawn and dusk; water is treated with reverence.",
      "The dead are buried at the oasis edge; stones mark graves against sandstorm burial.",
      "A shrine to Vaiśravaṇa or Maitreya marks a monastery; travelers leave offerings for safe passage.",
      "Rituals mark the seasons and the date harvest; ancestors are called upon.",
    ],
    specialist: "A monk, or an elder who knows the spirits of the oasis.",
    afterlife:
      "Rebirth under Maitreya's eventual coming; the dead may also dwell in the underworld but return to aid the oasis and its living.",
    evidence: {
      status: "documented",
      claim:
        "Kingdom of Khotan coinage and murals name Vaiśravaṇa as royal patron guardian; Kizil and Kucha cave paintings and pilgrim accounts (Xuanzang) attest widespread Maitreya devotion and the cults of Hariti and Mahākāla across Tarim Basin Buddhist kingdoms.",
      sources: [
        "Wood, The Silk Road",
        "Whitfield, The Silk Road: Trade, Travel, War and Faith",
        "Mallory and Mair, The Tarim Mummies",
      ],
      limitation:
        "This entry spans three millennia and layers a well-documented Buddhist cult over an earlier, largely unattested indigenous Tarim religion; the desert and oasis spirits beneath it have no recoverable names of their own.",
    },
  },
  {
    id: "post-mongol-steppe",
    label: "Post-Mongol Turkic and Tatar steppe practice",
    wiki: "https://en.wikipedia.org/wiki/Tengrism",
    scope: { years: [1300, 1700], bounds: [40, 40, 120, 60] },
    powers: [
      {
        name: "Tengri",
        wiki: "https://en.wikipedia.org/wiki/Tengri",
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
        name: "Etügen",
        wiki: "https://en.wikipedia.org/wiki/Etugen",
        domain: "the land, fertility, camps",
        rank: "major",
        relations: [{ kind: "consort-of", of: "Tengri" }],
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
        "Chinese and Persian sources describe post-Mongol Turkic practices; Crimean Tatar and Kazakh ethnographic records show continuity of Tengri and Etügen worship and shamanic leadership.",
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
    wiki: "https://en.wikipedia.org/wiki/Shamanism_in_Siberia",
    scope: { years: [-2000, 1950], bounds: [25, 35, 180, 90] },
    powers: [
      {
        name: "Kutkh",
        wiki: "https://en.wikipedia.org/wiki/Kutkh",
        domain: "creation, trickery, the raven's cunning",
        rank: "paramount",
      },
      {
        name: "Keretkun",
        domain: "the sea, whales, walrus, safe hunting",
        rank: "major",
      },
      {
        name: "*Sila",
        gloss: "Proto-Eskimo *sila, 'weather, outer world, wisdom'",
        domain: "the weather, the encompassing world, the shaman's insight",
        rank: "major",
      },
      {
        name: "The ancestors",
        domain: "guide-spirits and the shamanic dead",
        rank: "major",
      },
      {
        name: "The master of the animals",
        domain: "caribou, land game, the tundra's herds",
        rank: "major",
      },
      {
        name: "The fire",
        domain: "the hearth, warmth, protection",
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
      "A shaman drums for a lost soul or speaks with Keretkun and the animal masters.",
      "The first seal or whale is offered with ceremony; bones are kept sacred.",
      "The hearth fire receives a portion of every meal and hunt.",
      "The dead are buried with goods; shamans guide them to the ancestors, and to Kutkh who made the world.",
    ],
    specialist:
      "The shaman, marked by dreams and illness, who travels between worlds.",
    afterlife:
      "Shamans join the guide-ancestors; ordinary dead aid the people through them.",
    evidence: {
      status: "hypothesis",
      claim:
        "Chukchi, Koryak, and Siberian Yupik ethnography name Kutkh, the creator raven, as a central figure across the region, and Keretkun as master of sea mammals and the hunt; Russian colonial records and later ethnographic studies describe shamanism and animal-respect rituals built around them. Fortescue's comparative Eskimo-Aleut dictionary independently reconstructs *sila for the Yupik-speaking part of this same population, covering weather, the outer world, and shamanic wisdom.",
      sources: [
        "Bogoras, The Chukchee",
        "Jochelson, The Koryak",
        "Eliade, Shamanism",
        "Fortescue, Comparative Eskimo Dictionary",
      ],
      limitation:
        "Kutkh and Keretkun are best attested among the Chukchi and Koryak specifically; other peoples of this vast region had cognate but distinct figures, flattened here into one entry. *Sila is a comparative reconstruction of vocabulary, not a recovered theonym, and reaches only the Eskimo-Aleut branch of this population; Chukotko-Kamchatkan comparative reconstruction remains too thin to responsibly extend the same treatment to Kutkh and Keretkun's own language family.",
    },
  },
  {
    id: "volga-river-peoples-medieval",
    label: "Medieval and early modern Volga river peoples",
    wiki: "https://en.wikipedia.org/wiki/Mari_native_religion",
    scope: { years: [600, 1800], bounds: [40, 48, 70, 65] },
    powers: [
      {
        name: "Inmar",
        domain: "the sky, creation, fate",
        rank: "paramount",
      },
      {
        name: "Kugu Jumo",
        domain: "the sky, the world's order",
        rank: "major",
        relations: [{ kind: "aspect-of", of: "Inmar" }],
      },
      {
        name: "Keremet",
        domain: "misfortune, sacrifice, the wild grove",
        rank: "major",
        relations: [
          { kind: "sibling-of", of: "Inmar" },
          { kind: "rival-of", of: "Inmar" },
        ],
      },
      {
        name: "Vu-murt",
        domain: "rivers, lakes, water, drowning",
        rank: "major",
      },
      {
        name: "Nyulesmurt",
        domain: "the forest, game",
        rank: "local",
      },
      {
        name: "Vörsa",
        domain: "the field edge, boundary, crops",
        rank: "local",
      },
      {
        name: "Kylchin",
        domain: "the granary, harvest, household luck",
        rank: "local",
      },
      {
        name: "The hearth fire",
        domain: "the house, family, blessing",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the settlement and lineage",
        rank: "local",
      },
    ],
    practice: [
      "A sacred grove is kept for Keremet, apart from the village, where dark animals are offered.",
      "A new household is blessed; fire marks transitions and ceremonies.",
      "The dead are buried with goods; mounds mark graves and Vörsa is asked to keep the field boundary.",
      "Spring and autumn bring collective offerings to Inmar and Vu-murt, and shamanic consultation.",
    ],
    specialist: "The eldest; a priest (kart) who knows the spirits.",
    afterlife:
      "The dead dwell with ancestors; priests and diviners consult them for the living.",
    evidence: {
      status: "documented",
      claim:
        "Nineteenth- and twentieth-century ethnography of the Udmurt and Mari names Inmar and Kugu Jumo as supreme sky gods, Keremet as a rival sacrificial power, and Vu-murt, Nyulesmurt, Vörsa, and Kylchin as recognized spirit-masters of water, forest, field, and granary, in a system with deep roots along the Volga.",
      sources: [
        "Napolskikh, 'Udmurt Mythology'",
        "Holmberg, Finno-Ugric, Siberian Mythology",
        "Vasilyev, Mari Native Religion",
      ],
      limitation:
        "Full written record is nineteenth-century and later, from outsiders; practice by 600 CE certainly differed and blended increasingly with incoming Islam and Orthodoxy over this span. Kugu Jumo is treated here as the Mari name for the same high sky god as the Udmurt Inmar, and Keremet's kinship with Inmar follows the Udmurt-Mari dualist myth of a rebellious younger brother; both are interpretive rather than plain fact for every community this entry covers.",
    },
  },
];
