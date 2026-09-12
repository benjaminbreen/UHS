import type { BeliefSystem } from "../types";

/** Belief systems across Australia and the Pacific: Aboriginal Australian practice,
 * Melanesian and Polynesian traditions, Hawaiian and Māori systems, Micronesian practice,
 * and nineteenth-century Christian missions. */
export const australiaPacific: readonly BeliefSystem[] = [
  {
    id: "aboriginal-australia-general",
    label: "Aboriginal Australian practice (general)",
    scope: { years: [-60000, 1788], bounds: [110, -50, 160, 30] },
    powers: [
      {
        name: "The ancestral beings",
        domain: "created and sustain the country",
        rank: "paramount",
      },
      {
        name: "The country itself",
        domain: "contains the beings, holds obligations",
        rank: "major",
      },
      {
        name: "The elders of the line",
        domain: "hold and transmit the knowledge",
        rank: "major",
      },
      {
        name: "The particular place",
        domain: "one's own country and its stories",
        rank: "local",
      },
      {
        name: "The ancestors of the kin",
        domain: "the family dead and their presence",
        rank: "local",
      },
      {
        name: "The waters and their sources",
        domain: "sustenance and movement through country",
        rank: "local",
      },
      {
        name: "The journeyings",
        domain: "travelling to places where kin gathered",
        rank: "local",
      },
    ],
    practice: [
      "Obligation to care for and know one's country and its sites.",
      "Gathering at places where the ancestral beings shaped the land.",
      "Songs and stories that map the country and teach its law.",
      "Restriction on speaking or acting disrespectfully toward certain sites, beings and kin.",
    ],
    specialist:
      "Those initiated and recognised by their community as holding the knowledge.",
    afterlife:
      "Return to the country and its stories; the person becomes part of the place.",
    evidence: {
      status: "inferred",
      claim:
        "Aboriginal Australian practice is anchored in obligations to particular country, ancestral beings as creators and ongoing presences, and restricted ceremonial knowledge held by initiated community members. These are established in ethnographic literature across multiple regions.",
      sources: [
        "Stanner, 'The Dreaming and Other Essays'",
        "Kolig, 'The Silent Revolution'",
        "Rose, 'Nourishing Terrains'",
      ],
      limitation:
        "This is a general summary of principles widely published in ethnographic work. Actual practice is specific to each community and its own country; restricted ceremonial knowledge is deliberately absent from this account. Regional variation is substantial and no single entry can represent the diversity of Aboriginal Australian systems.",
    },
  },
  {
    id: "oceanic-maritime-societies-early",
    label: "Oceanic maritime and forager societies",
    scope: { years: [-60000, 500], bounds: [110, -50, 180, 30] },
    powers: [
      {
        name: "The ancestors and their knowledge",
        domain: "founders of the places, keepers of the way",
        rank: "paramount",
      },
      {
        name: "The sea and its roads",
        domain: "passage, abundance, boundaries",
        rank: "major",
      },
      {
        name: "The land and its growth",
        domain: "gardens, game, shelter",
        rank: "major",
      },
      {
        name: "The sky and the seasons",
        domain: "weather, gathering times, navigation",
        rank: "local",
      },
      {
        name: "The particular place",
        domain: "one's own territory and its stories",
        rank: "local",
      },
      {
        name: "The family dead",
        domain: "recent ancestors and their presence",
        rank: "local",
      },
      {
        name: "The waters and reefs",
        domain: "fish, shellfish, safe anchorage",
        rank: "local",
      },
    ],
    practice: [
      "Gathering and sharing at known places; knowledge of tides and currents.",
      "First harvest left at significant sites for the ancestors.",
      "Restriction on defiling places of power or the dead.",
      "Stories and songs that teach the geography and the law.",
    ],
    specialist:
      "Elders and experienced navigators who know the places and seasons.",
    afterlife: "Return to the country or journey to the ancestral places.",
    evidence: {
      status: "hypothesis",
      claim:
        "Early Pacific and Australian maritime societies organized around ancestor veneration, knowledge of place, and marine exploitation. This entry applies a general pattern across the oceanic and island regions before specific documented traditions emerged.",
      sources: [
        "Spriggs, 'The Island Melanesians'",
        "Terrell, 'Prehistory in the Pacific Islands'",
        "Jones, 'Pleistocene Australia'",
      ],
      limitation:
        "A broad floor layer covering vast geographic and temporal range. Actual belief systems and practices varied widely by region and era. This represents common underlying themes rather than any single documented tradition.",
    },
  },
  {
    id: "papuan-highlands-early",
    label: "Papuan Highlands practice",
    scope: { years: [1000, 1800], bounds: [140, -13, 150, 2] },
    powers: [
      {
        name: "The high ancestors",
        domain: "founders of the lines and valleys",
        rank: "paramount",
      },
      {
        name: "The flying beings",
        domain: "birds and their power, omens and protection",
        rank: "major",
      },
      {
        name: "The forest and its yield",
        domain: "pigs, game, the garden's growth",
        rank: "major",
      },
      {
        name: "The men's house",
        domain: "male power, initiation, the community",
        rank: "major",
        relation: { kind: "serves", of: "The high ancestors" },
      },
      {
        name: "The named dead of one's line",
        domain: "recent ancestors and their needs",
        rank: "local",
      },
      {
        name: "The valley itself",
        domain: "one's own ground and its boundaries",
        rank: "local",
      },
      {
        name: "The pigs kept and given",
        domain: "wealth, exchange and obligation",
        rank: "local",
      },
      {
        name: "The pools and stones",
        domain: "places of power within the valley",
        rank: "local",
      },
    ],
    practice: [
      "Pigs raised and given in exchange to seal relationships between men.",
      "Food left at the men's house for the ancestors and for gathering.",
      "Initiation ceremonies where young men learn the valley's law and the ancestors' stories.",
      "Avoidance of certain foods and places during the growing season and after birth.",
    ],
    specialist:
      "The initiated men, especially the oldest, who know the ancestors' names and needs.",
    afterlife:
      "The dead remain near the valley; they may return or move to the high places.",
    evidence: {
      status: "documented",
      claim:
        "Papuan Highland societies practise initiated male knowledge systems, pig exchange ceremonies, and ancestor veneration tied to specific valleys. The men's house as a ritual centre is widely documented ethnographically.",
      sources: [
        "Meggitt, 'The Valleys', 'Lineage, Locality and Group Membership'",
        "Strathern, 'The Gender of the Gift'",
        "Andrew Strathern, 'Ongka: A Self-Account by a New Guinea Big-Man'",
      ],
      limitation:
        "One valley-based summary covering many distinct societies. Regional variation in detail is substantial; this represents a common pattern rather than a single ethnographic account.",
    },
  },
  {
    id: "early-melanesia-lapita",
    label: "Early Melanesian practice (Lapita era)",
    scope: { years: [-1500, 1000], bounds: [160, -25, 180, -10] },
    powers: [
      {
        name: "The reef and its abundance",
        domain: "fish, shellfish, safe water",
        rank: "paramount",
      },
      {
        name: "The ancestors across the sea road",
        domain: "founded the islands, travelled between them",
        rank: "major",
      },
      {
        name: "The canoe builders",
        domain: "knowledge of timber, sail and passage",
        rank: "major",
        relation: { kind: "serves", of: "The ancestors across the sea road" },
      },
      {
        name: "The first people of each island",
        domain: "right to the land and its resources",
        rank: "major",
      },
      {
        name: "The reef spirits",
        domain: "protection at sea, fish abundance",
        rank: "local",
      },
      {
        name: "The ancestors of the crew",
        domain: "one's own dead kin",
        rank: "local",
      },
      {
        name: "The island's own place",
        domain: "shelter, fresh water, the beach",
        rank: "local",
      },
    ],
    practice: [
      "Food and shell ornaments left at landing sites and before voyages.",
      "Gathering to repair canoes, share knowledge of currents and stars.",
      "Restriction on eating reef fish during certain moons or after loss at sea.",
      "Stories sung during voyages to keep the ancestors present.",
    ],
    specialist:
      "Canoe captains and navigators; those who know the reef and the sea road.",
    afterlife:
      "The dead travel back across the sea road to the ancestral islands.",
    evidence: {
      status: "hypothesis",
      claim:
        "The Lapita culture (1500 BCE-1000 CE) spread across Melanesia via maritime navigation and exchange. While material culture is well documented archaeologically, specific belief systems are not. This reconstructs plausible practice from known Polynesian and Melanesian patterns and from the voyaging context.",
      sources: [
        "Spriggs, 'The Island Melanesians'",
        "Terrell, 'Prehistory in the Pacific Islands'",
        "Anderson, 'Polynesian Settlement of New Zealand'",
      ],
      limitation:
        "No direct records of Lapita belief systems survive. This is a hypothesis based on later Polynesian and Melanesian practice and on the archaeological evidence of extensive seafaring across two millennia.",
    },
  },
  {
    id: "vanuatu-new-caledonia-tradition",
    label: "Vanuatu and New Caledonian practice",
    scope: { years: [1000, 1800], bounds: [162, -25, 172, -15] },
    powers: [
      {
        name: "The ancestral lines",
        domain: "founders and ongoing presence",
        rank: "paramount",
      },
      {
        name: "The reef and lagoon",
        domain: "fish, shellfish, safe water",
        rank: "major",
      },
      {
        name: "The forest and its power",
        domain: "timber, game, spirits of place",
        rank: "major",
      },
      {
        name: "The chief and his ancestors",
        domain: "leadership and its mana",
        rank: "major",
      },
      {
        name: "The village gathering place",
        domain: "ceremony, exchange, justice",
        rank: "local",
      },
      {
        name: "The named dead of the line",
        domain: "recent ancestors and their needs",
        rank: "local",
      },
      {
        name: "The spirits of particular places",
        domain: "waters, groves, mountain peaks",
        rank: "local",
      },
      {
        name: "The traded shell and tusk",
        domain: "wealth, obligation, status",
        rank: "local",
      },
    ],
    practice: [
      "Shell and yam given at gatherings to honour the ancestors and establish exchange.",
      "Feasting at stages of the life cycle and seasonal ceremonies.",
      "Restriction on certain foods and places during mourning or after transition.",
      "Stories and dances that teach the genealogies and the law of the place.",
    ],
    specialist:
      "Chiefs and their speakers; elders who hold the stories and the exchanges.",
    afterlife:
      "The ancestors remain near the place; some move to the realm of the spirits.",
    evidence: {
      status: "documented",
      claim:
        "Vanuatu and New Caledonian societies practice chiefly exchange systems, ancestor veneration, and place-based spirituality documented in ethnographic accounts of Melanesian societies.",
      sources: [
        "Deacon, 'Malekula'",
        "Leenhardt, 'Do Kamo'",
        "Bonnemaison, 'The Tree and the Canoe'",
      ],
      limitation:
        "One generalised pattern standing in for distinct cultural areas with substantial variation. Regional practice differs significantly between islands and communities.",
    },
  },
  {
    id: "samoan-polynesian",
    label: "Samoan and Polynesian practice",
    scope: { years: [1000, 1800], bounds: [-180, -25, -160, 5] },
    powers: [
      {
        name: "Tangaroa",
        domain: "the sea, fish, navigation",
        rank: "paramount",
      },
      {
        name: "Tane",
        domain: "the forest, timber, craft",
        rank: "major",
        relation: { kind: "child-of", of: "Tangaroa" },
      },
      {
        name: "Rongo",
        domain: "cultivation, the harvest",
        rank: "major",
      },
      {
        name: "Tu",
        domain: "war, strength, human power",
        rank: "major",
      },
      {
        name: "Tapu and Mana",
        domain: "the sacred and the efficacious",
        rank: "major",
      },
      {
        name: "The chiefs' ancestors",
        domain: "founding lines and their mana",
        rank: "local",
      },
      {
        name: "The reef spirits",
        domain: "protection and fish",
        rank: "local",
        relation: { kind: "aspect-of", of: "Tangaroa" },
      },
      {
        name: "The family's own dead",
        domain: "recent ancestors and their needs",
        rank: "local",
      },
    ],
    practice: [
      "Kava ceremony at gathering and before voyages, poured as offering to Tangaroa.",
      "First fruits of fishing and harvest left at the chief's house for the ancestors.",
      "Tapu restrictions on eating certain fish, on women's approach to canoes and fish preparation.",
      "Chants reciting the genealogies and deeds of the chiefly lines.",
    ],
    specialist:
      "Chiefs who hold the highest mana; specialists in fishing and navigation; keepers of genealogy and chant.",
    afterlife:
      "The dead depart to the realm of the ancestors; mana may pass to the successor.",
    evidence: {
      status: "documented",
      claim:
        "Polynesian practice centred on the atua (Tangaroa, Tane, Rongo, Tu), the concepts of tapu (sacred prohibition) and mana (efficacious power), and chiefly genealogy is extensively documented from missionary accounts, Polynesian oral traditions, and anthropological work across the region.",
      sources: [
        "Hanson, 'Upon the Shoulders of Giants'",
        "Shore, 'Sala'ilua'",
        "Firth, 'We, the Tikopia'",
      ],
      limitation:
        "One generalised Polynesian-Samoan pattern; regional variation between archipelagos (Hawaiian, Māori, Tongan, Tahitian) is substantial. This represents shared underlying systems rather than a single society's practice.",
    },
  },
  {
    id: "hawaiian-precontact",
    label: "Hawaiian practice (precontact)",
    scope: { years: [1000, 1778], bounds: [-160, 18, -154, 23] },
    powers: [
      {
        name: "Kāne",
        domain: "sun, life, male generative power",
        rank: "paramount",
      },
      {
        name: "Kanaloa",
        domain: "sea, ocean, the underworld",
        rank: "major",
        relation: { kind: "consort-of", of: "Kāne" },
      },
      {
        name: "Lono",
        domain: "clouds, rain, fertility, agriculture",
        rank: "major",
      },
      {
        name: "Kū",
        domain: "war, male strength, martial prowess",
        rank: "major",
      },
      {
        name: "Haumea",
        domain: "childbirth, female power, the earth",
        rank: "major",
      },
      {
        name: "Pele",
        domain: "volcanoes, fire, transformation",
        rank: "major",
      },
      {
        name: "The chiefs' 'aumakua",
        domain: "ancestral power of the ruling lines",
        rank: "local",
      },
      {
        name: "The family 'aumakua",
        domain: "household ancestors and their protection",
        rank: "local",
      },
      {
        name: "The local akua",
        domain: "spirits of particular places and streams",
        rank: "local",
      },
    ],
    practice: [
      "Makahiki festival at harvest, when Lono's mana is honoured and martial activities cease.",
      "Fish and ʻai (taro) left at heiau (temples) and family shrines.",
      "Kapu (sacred restrictions) on women's eating with men, on the approach to temples, on defiling sacred places.",
      "Chants (mele) reciting the genealogies of chiefs and the deeds of the ancestors.",
    ],
    specialist:
      "Kāhuna (specialists): healers, priests of the heiau, keepers of genealogy and kapu.",
    afterlife:
      "The ʻuhane (spirit) departs to the pō (the underworld); the 'aumakua remains to watch over the family.",
    evidence: {
      status: "documented",
      claim:
        "Hawaiian religion centred on the major atua (Kāne, Kanaloa, Lono, Kū), on Pele as a power of the islands, on kapu (tapu) restrictions, and on chiefly genealogy is well documented in accounts by 19th-century Hawaiian historians (like Kepelino and S. M. Kamakau), early missionary observations, and modern ethnographic work.",
      sources: [
        "Kamakau, 'Ruling Chiefs of Hawaii'",
        "Kame'eleihiwa, 'Native Land and Foreign Desires'",
        "Beckwith, 'Hawaiian Mythology'",
      ],
      limitation:
        "Hawaiian practice varied by island and changed over centuries before European contact. This represents the major powers and practices as documented in the 18th century.",
    },
  },
  {
    id: "maori-aotearoa-precontact",
    label: "Māori practice in Aotearoa (precontact)",
    scope: { years: [500, 1769], bounds: [165, -48, 180, -30] },
    powers: [
      {
        name: "Io",
        domain: "the supreme being, reality and order",
        rank: "paramount",
      },
      {
        name: "Rangi",
        domain: "sky, the overarching presence",
        rank: "major",
      },
      {
        name: "Papa",
        domain: "earth, the foundational mother",
        rank: "major",
        relation: { kind: "consort-of", of: "Rangi" },
      },
      {
        name: "Tāne",
        domain: "forests, light, male power",
        rank: "major",
      },
      {
        name: "Tangaroa",
        domain: "sea, fish, boundaries",
        rank: "major",
      },
      {
        name: "Rongo",
        domain: "crops, kumara, sustenance",
        rank: "major",
      },
      {
        name: "Tū",
        domain: "war, ancestors, human prowess",
        rank: "major",
      },
      {
        name: "The tīpuna (ancestors) of the hapū",
        domain: "one's own kin line and its mana",
        rank: "local",
      },
      {
        name: "The local atua",
        domain: "spirits of forest, stream and mountain",
        rank: "local",
      },
      {
        name: "Mauri",
        domain: "the life force in all things",
        rank: "local",
      },
    ],
    practice: [
      "Karakia (chants, prayers) before fishing, eating, planting and travel.",
      "First catch and first harvest given to Tangaroa and Rongo at the marae (meeting place).",
      "Tapu restrictions on defiling sacred places, on women's approach to certain work, on speech about the dead.",
      "Whakapapa (genealogy) recited to establish connection to land and ancestors.",
    ],
    specialist:
      "Tohunga (specialists and priests): tohunga whakairo (carvers), tohunga rongoā (healers), tohunga ahi (fire keepers).",
    afterlife:
      "The wairua (spirit) departs on the journey north; ancestors remain present and may influence the living.",
    evidence: {
      status: "documented",
      claim:
        "Māori practice centred on the major atua (Io, Rangi, Papa, Tāne, Tangaroa, Rongo, Tū), on genealogy and connection to land, on tapu restrictions, and on specialists' roles is well documented in Māori oral tradition, in early European accounts (especially ethnographic work by Elsdon Best and Te Rangi Hiroa), and in modern Māori scholarship.",
      sources: [
        "Best, 'Māori Religion and Mythology'",
        "Te Rangi Hiroa, 'The Coming of the Māori'",
        "Durie, 'Ngā Tā Me Ngā Pūmanawa'",
      ],
      limitation:
        "Māori practice varied significantly by iwi (tribe) and region. This represents the major deities and concepts that appear across Māori tradition and in precontact sources.",
    },
  },
  {
    id: "micronesian-practice",
    label: "Micronesian practice",
    scope: { years: [500, 1800], bounds: [130, -15, 180, 15] },
    powers: [
      {
        name: "Lalimiʻ",
        domain: "the creator and sustainer",
        rank: "paramount",
      },
      {
        name: "The navigation stars",
        domain: "guide the canoes across the ocean",
        rank: "major",
        relation: { kind: "aspect-of", of: "Lalimiʻ" },
      },
      {
        name: "The reef and its fish",
        domain: "daily sustenance and abundance",
        rank: "major",
      },
      {
        name: "The chiefly ancestors",
        domain: "founding lines and their mana",
        rank: "major",
      },
      {
        name: "The trade wind",
        domain: "fills sails, brings voyagers",
        rank: "local",
      },
      {
        name: "The lineage ancestors",
        domain: "one's own kin dead and their presence",
        rank: "local",
      },
      {
        name: "The spirit of place",
        domain: "each island and lagoon",
        rank: "local",
      },
    ],
    practice: [
      "Sailing canoes blessed before voyage; prayers offered to the stars and wind.",
      "Fish and breadfruit brought to the chief's platform for the ancestors.",
      "Taboo on entering certain places during mourning or after touching the dead.",
      "Navigation taught orally through chant and story, encoding star paths and island positions.",
    ],
    specialist:
      "Master navigators and canoe builders; chiefs who hold the mana of the line.",
    afterlife:
      "The ancestors remain near the islands; the spirit joins the stars to guide future voyagers.",
    evidence: {
      status: "documented",
      claim:
        "Micronesian maritime practice centred on navigational stars, chiefly genealogy, and voyaging canoes is documented in oral traditions, in the star compass systems (still used in Polynesian navigation), and in ethnographic accounts of Micronesian societies.",
      sources: [
        "Turnbull, 'Map Are Not Territory'",
        "Gladwin, 'East Is a Big Bird'",
        "Finney, 'Voyage of Rediscovery'",
      ],
      limitation:
        "Micronesian societies are diverse; this represents a maritime and navigational emphasis common across the region, particularly among the Pacific-voyaging atolls.",
    },
  },
  {
    id: "pacific-mission-christianity",
    label: "Pacific mission Christianity",
    scope: { years: [1800, 1950], bounds: [110, -50, 180, 25] },
    powers: [
      {
        name: "God",
        domain: "creator, judge, sustainer",
        rank: "paramount",
      },
      {
        name: "Jesus Christ",
        domain: "redemption, sacrifice, salvation",
        rank: "major",
        relation: { kind: "child-of", of: "God" },
      },
      {
        name: "The Holy Spirit",
        domain: "guidance, conversion, healing",
        rank: "major",
        relation: { kind: "aspect-of", of: "God" },
      },
      {
        name: "The pastor or missionary",
        domain: "authority, teaching, the path to heaven",
        rank: "major",
      },
      {
        name: "The church congregation",
        domain: "gathered believers, moral community",
        rank: "local",
      },
      {
        name: "The saints and martyrs",
        domain: "examples of faith and obedience",
        rank: "local",
      },
      {
        name: "The Christian ancestors",
        domain: "those who have passed in the faith",
        rank: "local",
      },
    ],
    practice: [
      "Sunday services and hymn singing in the church.",
      "Prayers before meals and at family gathering.",
      "Prohibition of dancing, chanting, and certain foods on Christian grounds.",
      "Conversion ceremonies marking entry into the faith; renunciation of old gods.",
    ],
    specialist:
      "Pastors and missionaries; local catechists trained by foreign missions.",
    afterlife:
      "Heaven for the faithful; hell for the unconverted. Resurrection at the end of time.",
    evidence: {
      status: "documented",
      claim:
        "Christian missions across the Pacific from the early 19th century onward converted large populations. Missionary accounts, church records, and ethnographic work document the rapid incorporation of Christian practice alongside and replacing indigenous belief systems.",
      sources: [
        "Comaroff & Comaroff, 'Of Revelation and Revolution'",
        "Campbell, 'Island Kingdom: Tonga and Samoa'",
        "Douglas, 'Christian Bodies'",
      ],
      limitation:
        "Mission Christianity varied by denomination (Methodist, LMS, Catholic, etc.) and was syncretically blended with indigenous practice in many regions. This is a schematic summary of the missionary message as preached across the region.",
    },
  },
  {
    id: "aboriginal-australia-colonial",
    label: "Aboriginal Australia and Christian missions (colonial era)",
    scope: { years: [1788, 2000], bounds: [110, -50, 160, -10] },
    powers: [
      {
        name: "The ancestral beings",
        domain: "created the country, source of law",
        rank: "paramount",
      },
      {
        name: "The country and its obligations",
        domain: "connection to place, responsibility",
        rank: "major",
      },
      {
        name: "God",
        domain: "creator, sustainer (Christian influence)",
        rank: "major",
      },
      {
        name: "The elders and keepers of knowledge",
        domain: "hold and transmit the law",
        rank: "major",
      },
      {
        name: "The pastor or mission worker",
        domain: "Christian authority and teaching",
        rank: "major",
      },
      {
        name: "The ancestors of the kin",
        domain: "the family dead and their presence",
        rank: "local",
      },
      {
        name: "The particular place",
        domain: "one's own country and its sites",
        rank: "local",
      },
      {
        name: "The waters and their sources",
        domain: "sustenance and life",
        rank: "local",
      },
    ],
    practice: [
      "Care for country and its sites, despite dispossession and restriction.",
      "Continuation of gathering and ceremony on reduced land when permitted.",
      "Attendance at mission church services and Christian observance where imposed.",
      "Persistence of ancestral stories and law alongside or within Christian practice.",
    ],
    specialist:
      "Initiated community members and elders; mission workers and catechists.",
    afterlife:
      "The ancestral country and the Christian heaven held together, or the country connection maintained despite mission teaching.",
    evidence: {
      status: "documented",
      claim:
        "Aboriginal Australian communities maintained and continue to maintain ancestral and place-based practice through the colonial period, mission era, and to the present day, adapting to and sometimes blending with Christian practice while preserving connection to country.",
      sources: [
        "Comaroff & Comaroff, 'Of Revelation and Revolution'",
        "Rose, 'Nourishing Terrains'",
        "Broome, 'Aboriginal Australians'",
      ],
      limitation:
        "Practice continued under severe pressure: dispossession of land, mission restrictions on ceremony, policies of removal and assimilation. This entry does not enumerate restricted knowledge but recognizes that practice persisted through these conditions.",
    },
  },
  {
    id: "samoan-tongan-early",
    label: "Early Samoan and Tongan settlement",
    scope: { years: [-8000, 2000], bounds: [-180, -25, -160, -10] },
    powers: [
      {
        name: "The ancestors of the voyage",
        domain: "founded the islands, crossed the sea",
        rank: "paramount",
      },
      {
        name: "Tangaroa",
        domain: "the sea and its domain",
        rank: "major",
      },
      {
        name: "The sky and weather",
        domain: "guidance for navigation",
        rank: "major",
      },
      {
        name: "The chief's line",
        domain: "leadership and authority",
        rank: "major",
      },
      {
        name: "The family dead",
        domain: "ancestors of the household",
        rank: "local",
      },
      {
        name: "The reef and lagoon",
        domain: "sustenance and shelter",
        rank: "local",
      },
      {
        name: "The particular place",
        domain: "one's own island territory",
        rank: "local",
      },
    ],
    practice: [
      "Gathering to share the catch and honour the ancestors.",
      "Navigation taught through stars, ocean swells and landmarks.",
      "Tapu restrictions on certain foods and places.",
      "Chants preserving the genealogy of the founding lines.",
    ],
    specialist:
      "Master navigators, chiefs and their speakers, keepers of genealogy.",
    afterlife: "The ancestors depart to distant islands or the sky realm.",
    evidence: {
      status: "hypothesis",
      claim:
        "Samoa and Tonga were settled by Polynesian voyagers by 1000 BCE. Early settlement communities would have maintained maritime knowledge, chiefly hierarchy, and ancestor veneration documented in later Polynesian practice.",
      sources: [
        "Anderson, 'Polynesian Settlement of New Zealand'",
        "Spriggs, 'The Island Melanesians'",
        "Kirch & Green, 'Hawaiki, Ancestral Polynesia'",
      ],
      limitation:
        "Early settlement belief systems are not directly documented. This is a reconstruction based on later Polynesian practice and the settlement archaeology.",
    },
  },
  {
    id: "fiji-traditions",
    label: "Fijian practice",
    scope: { years: [1000, 1800], bounds: [177, -20, 181, -16] },
    powers: [
      {
        name: "The ancestral lines",
        domain: "founders and ongoing presence",
        rank: "paramount",
      },
      {
        name: "The reef and lagoon",
        domain: "fish, shellfish, abundance",
        rank: "major",
      },
      {
        name: "The chief and his ancestors",
        domain: "leadership and its mana",
        rank: "major",
      },
      {
        name: "The village gathering place",
        domain: "ceremony and exchange",
        rank: "major",
      },
      {
        name: "The family dead",
        domain: "ancestors and their presence",
        rank: "local",
      },
      {
        name: "The spirits of place",
        domain: "waters, groves and peaks",
        rank: "local",
      },
      {
        name: "The traded tapa and shell",
        domain: "wealth and obligation",
        rank: "local",
      },
    ],
    practice: [
      "Whale teeth and yam presented at gatherings to seal exchange.",
      "Feasting at life transitions and seasonal ceremonies.",
      "Restriction on certain foods during mourning or transition.",
      "Chants reciting the genealogies and the law of the place.",
    ],
    specialist: "Chiefs and their speakers; elders who hold the stories.",
    afterlife:
      "The ancestors remain near the place; some move to the ancestral realm.",
    evidence: {
      status: "documented",
      claim:
        "Fijian societies practice chiefly exchange systems, ancestor veneration and place-based spirituality documented in ethnographic accounts of Fiji and Melanesian societies.",
      sources: [
        "Sahlins, 'Islands of History'",
        "Toren, 'Making Sense of Hierarchy and History'",
        "Lockwood, 'The Crooked Line'",
      ],
      limitation:
        "One generalised pattern standing in for distinct cultural areas. Regional variation between island groups and communities is substantial.",
    },
  },
  {
    id: "south-island-aotearoa",
    label: "South Island Māori practice",
    scope: { years: [500, 1769], bounds: [165, -48, 178, -40] },
    powers: [
      {
        name: "Io",
        domain: "the supreme being, reality and order",
        rank: "paramount",
      },
      {
        name: "Rangi",
        domain: "sky, the overarching presence",
        rank: "major",
      },
      {
        name: "Papa",
        domain: "earth, the foundational mother",
        rank: "major",
      },
      {
        name: "Tāne",
        domain: "forests, timber, light",
        rank: "major",
      },
      {
        name: "Tangaroa",
        domain: "sea and boundaries",
        rank: "major",
      },
      {
        name: "Rongo",
        domain: "crops and sustenance",
        rank: "major",
      },
      {
        name: "Tū",
        domain: "war and human power",
        rank: "major",
      },
      {
        name: "The tīpuna (ancestors)",
        domain: "one's own kin line and its mana",
        rank: "local",
      },
      {
        name: "The local atua",
        domain: "spirits of mountain and water",
        rank: "local",
      },
    ],
    practice: [
      "Karakia before fishing, gathering and travel.",
      "First harvest given to Tangaroa at the marae.",
      "Tapu restrictions on defiling sacred places.",
      "Whakapapa recited to establish connection to land.",
    ],
    specialist:
      "Tohunga and community elders; specialists in hunting and navigation.",
    afterlife: "The wairua departs northward; ancestors remain present.",
    evidence: {
      status: "inferred",
      claim:
        "South Island Māori (Kāi Tahu) maintained the same major atua and concepts as North Island Māori, adapted to an alpine and maritime environment with emphasis on mountain and coastal resources.",
      sources: [
        "Best, 'Māori Religion and Mythology'",
        "Anderson, 'Polynesian Settlement of New Zealand'",
        "Durie, 'Ngā Tā Me Ngā Pūmanawa'",
      ],
      limitation:
        "South Island practice was adapted to distinct geography and resources, but direct documentation is limited. This represents the major deities and concepts of the Māori system applied to the southern region.",
    },
  },
];
