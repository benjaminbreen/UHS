/**
 * constants/gameData/factions/mena.ts
 * Faction data for Middle Eastern and North African cultural zones.
 */
import { HistoricalEra } from '../../../types';
import { FactionFile } from './types';

const MODERN_ERA = 'MODERN_ERA';

export const MENA_FACTIONS: FactionFile = {
    'MENA': {
        "Nile Valley": {
            [HistoricalEra.PREHISTORY]: {
                dominantPower: 'Predynastic Kingdoms',
                dominantPowerDescription: 'Early Egyptian kingdoms along the Nile, developing hieroglyphic writing, monumental architecture, and the foundations of pharaonic civilization.',
                eraContextSentence: 'a time before the pharaohs, when the Two Lands are divided and the gods walk among mortals.',
                allegianceGroups: [
                    { name: 'Upper Egyptian Kings', type: 'primary', description: 'Rulers of the southern Nile valley.' },
                    { name: 'Lower Egyptian Princes', type: 'declining', description: 'Delta chieftains of the north.' },
                    { name: 'Nubian Tribes', type: 'secondary', description: 'Southern peoples with gold and ivory.' }
                ],
                structureNames: {
                    fortress: ['Mud Brick Fort', 'River Fort', 'Desert Outpost'],
                    quarry: ['Gold Mine', 'Granite Quarry', 'Natron Pit'],
                    holy_site: ['Proto-Temple', 'Sacred Burial', 'Nile Shrine', 'Animal Necropolis'],
                    palace: ['Mud Palace', 'Royal Compound', 'Proto-Mastaba'],
                },
                courtRoles: {
                    palace: ['Divine King', 'High Priest', 'Royal Scribe', 'Nomarch', 'Overseer of Gold']
                }
            },
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Roman Egypt',
                dominantPowerDescription: 'Egypt serves as the granary of the Roman Empire, its ancient traditions continuing under imperial administration while Alexandria remains a center of learning.',
                eraContextSentence: 'an age of Roman order, where ancient Egypt provides grain for the eternal city.',
                allegianceGroups: [
                    { name: 'Roman Empire', type: 'primary', description: 'The governing imperial power.' },
                    { name: 'Nubian Kingdoms', type: 'secondary', description: 'Independent kingdoms to the south.' },
                    { name: 'Desert Peoples', type: 'rebel', description: 'Nomadic tribes of the Eastern and Western deserts.' },
                    { name: 'Early Christians', type: 'religious', description: 'A growing religious minority, often persecuted.' }
                ],
                structureNames: {
                    fortress: ['Castra', 'Roman Fort'],
                    mill: ['Nilometer', 'Shaduf'],
                    holy_site: ['Ptolemaic Temple', 'Serapeum', 'Catacomb'],
                    palace: ["Prefect's Residence", 'Library of Alexandria'],
                    trading_post: ['Grain Port', 'Red Sea Port']
                },
                courtRoles: {
                    palace: ['Prefect of Egypt', 'Dux Ripae', 'Scribe', 'Tax Collector']
                },
                // Year-specific overrides for the different powers that ruled Egypt during ANTIQUITY
                yearRangeOverrides: [
                    {
                        yearMin: -2686, yearMax: -2181,
                        data: {
                            dominantPower: 'Old Kingdom Egypt',
                            dominantPowerDescription: 'The age of pyramid builders. Pharaohs command the resources of a unified Egypt to construct monuments that will endure for millennia. Memphis serves as the capital of a divine kingdom.',
                            eraContextSentence: 'the age of pyramids, when god-kings raise monuments to eternity.',
                            allegianceGroups: [
                                { name: 'Pharaonic Court', type: 'primary', description: 'The divine king and his administration.' },
                                { name: 'Temple Priesthoods', type: 'secondary', description: 'Powerful religious establishments.' },
                                { name: 'Nomarchs', type: 'secondary', description: 'Provincial governors of increasing independence.' }
                            ],
                            courtRoles: {
                                palace: ['Pharaoh', 'Vizier', 'High Priest of Ptah', 'Royal Architect', 'Overseer of Works']
                            }
                        }
                    },
                    {
                        yearMin: -2181, yearMax: -2055,
                        data: {
                            dominantPower: 'First Intermediate Period',
                            dominantPowerDescription: 'Central authority has collapsed. Rival dynasties at Heracleopolis and Thebes contend for supremacy while nomarchs rule their provinces as petty kings.',
                            eraContextSentence: 'a time of chaos, when the Two Lands are again divided and famine stalks the land.',
                            allegianceGroups: [
                                { name: 'Heracleopolitan Dynasty', type: 'primary', description: 'Northern claimants to the throne.' },
                                { name: 'Theban Dynasty', type: 'rebel', description: 'Southern rivals gathering strength.' },
                                { name: 'Independent Nomarchs', type: 'secondary', description: 'Provincial lords ruling their own domains.' }
                            ]
                        }
                    },
                    {
                        yearMin: -2055, yearMax: -1650,
                        data: {
                            dominantPower: 'Middle Kingdom Egypt',
                            dominantPowerDescription: 'Egypt reunified under Theban pharaohs who restore order and expand into Nubia. Literature and art flourish in a classical age of Egyptian civilization.',
                            eraContextSentence: 'a classical age, when pharaohs restore the glory of the Two Lands.',
                            allegianceGroups: [
                                { name: 'Pharaonic Court', type: 'primary', description: 'The restored central monarchy.' },
                                { name: 'Nubian Territories', type: 'secondary', description: 'Conquered lands to the south.' },
                                { name: 'Asiatic Settlers', type: 'secondary', description: 'Immigrants from the Levant settling in the Delta.' }
                            ],
                            courtRoles: {
                                palace: ['Pharaoh', 'Vizier of Upper Egypt', 'Vizier of Lower Egypt', 'Chancellor', 'Chief Steward']
                            }
                        }
                    },
                    {
                        yearMin: -1650, yearMax: -1550,
                        data: {
                            dominantPower: 'Hyksos Dynasty',
                            dominantPowerDescription: 'Foreign rulers from the Levant control Lower Egypt from their capital at Avaris, introducing the horse and chariot. Native dynasties hold out in Upper Egypt.',
                            eraContextSentence: 'a time of foreign rule, when Asiatic kings sit upon the throne of the Delta.',
                            allegianceGroups: [
                                { name: 'Hyksos Kings', type: 'primary', description: 'Foreign dynasty ruling from Avaris.' },
                                { name: 'Theban Dynasty', type: 'rebel', description: 'Native Egyptian resistance in the south.' },
                                { name: 'Nubian Kingdom of Kush', type: 'secondary', description: 'Independent kingdom to the south.' }
                            ]
                        }
                    },
                    {
                        yearMin: -1550, yearMax: -1077,
                        data: {
                            dominantPower: 'New Kingdom Egypt',
                            dominantPowerDescription: 'The Egyptian Empire at its zenith. Warrior pharaohs like Thutmose III and Ramesses II create an empire stretching from Nubia to Syria. Thebes becomes the greatest city in the world.',
                            eraContextSentence: 'the imperial age, when Egypt\'s armies march from Kush to the Euphrates.',
                            allegianceGroups: [
                                { name: 'Pharaonic Empire', type: 'primary', description: 'The Egyptian imperial state at its height.' },
                                { name: 'Amun Priesthood', type: 'secondary', description: 'Wealthy and powerful temple establishment.' },
                                { name: 'Nubian Viceroyalty', type: 'secondary', description: 'Egyptian-ruled territories in the south.' },
                                { name: 'Levantine Vassals', type: 'secondary', description: 'Client states in Canaan and Syria.' }
                            ],
                            courtRoles: {
                                palace: ['Pharaoh', 'Great Royal Wife', 'Vizier', 'High Priest of Amun', 'General of the Army', 'Viceroy of Kush']
                            }
                        }
                    },
                    {
                        yearMin: -1077, yearMax: -664,
                        data: {
                            dominantPower: 'Third Intermediate Period',
                            dominantPowerDescription: 'Egypt fragments among rival dynasties. Libyan generals, Nubian conquerors, and native pharaohs compete for control while the great temples maintain their wealth and influence.',
                            eraContextSentence: 'an age of division, when Libyan warriors and Nubian kings contest for the throne.',
                            allegianceGroups: [
                                { name: 'Libyan Dynasties', type: 'primary', description: 'Military rulers of Libyan descent.' },
                                { name: 'Nubian Dynasty', type: 'rebel', description: 'Kushite pharaohs claiming Egyptian heritage.' },
                                { name: 'Theban Priesthood', type: 'secondary', description: 'Temple state of Amun at Thebes.' },
                                { name: 'Delta Principalities', type: 'secondary', description: 'Petty kingdoms in Lower Egypt.' }
                            ]
                        }
                    },
                    {
                        yearMin: -664, yearMax: -332,
                        data: {
                            dominantPower: 'Late Period Egypt',
                            dominantPowerDescription: 'Native dynasties struggle to maintain independence against Assyrian and Persian invasions. Brief revivals alternate with foreign domination until Alexander\'s conquest.',
                            eraContextSentence: 'an age of struggle, when ancient Egypt fights to preserve its independence.',
                            allegianceGroups: [
                                { name: 'Saite Dynasty', type: 'primary', description: 'Native rulers reviving Egyptian traditions.' },
                                { name: 'Persian Empire', type: 'rebel', description: 'Foreign conquerors ruling Egypt as a satrapy.' },
                                { name: 'Greek Mercenaries', type: 'secondary', description: 'Foreign soldiers serving Egyptian kings.' },
                                { name: 'Temple Establishments', type: 'secondary', description: 'Ancient religious institutions.' }
                            ],
                            courtRoles: {
                                palace: ['Pharaoh', 'Vizier', 'Persian Satrap', 'High Priest', 'Greek Commander']
                            }
                        }
                    },
                    {
                        yearMin: -332, yearMax: -30,
                        data: {
                            dominantPower: 'Ptolemaic Egypt',
                            dominantPowerDescription: 'Greek pharaohs rule from Alexandria, the greatest city of the Hellenistic world. Greek and Egyptian cultures blend while the Library and Museum make Alexandria the intellectual center of the Mediterranean.',
                            eraContextSentence: 'the Hellenistic age, when Greek kings rule as pharaohs and Alexandria lights the world.',
                            allegianceGroups: [
                                { name: 'Ptolemaic Dynasty', type: 'primary', description: 'Macedonian rulers of Egypt.' },
                                { name: 'Greek Settlers', type: 'secondary', description: 'Colonists holding privileged positions.' },
                                { name: 'Egyptian Priesthood', type: 'secondary', description: 'Native religious establishment maintaining traditions.' },
                                { name: 'Seleucid Empire', type: 'rebel', description: 'Rival Hellenistic kingdom to the east.' }
                            ],
                            courtRoles: {
                                palace: ['Ptolemy', 'Royal Sister-Wife', 'Dioiketes', 'Strategos', 'High Priest of Alexandria']
                            }
                        }
                    },
                    {
                        yearMin: -30, yearMax: 395,
                        data: {
                            dominantPower: 'Roman Egypt',
                            dominantPowerDescription: 'Egypt serves as the granary of the Roman Empire, its ancient traditions continuing under imperial administration while Alexandria remains a center of learning.',
                            eraContextSentence: 'an age of Roman order, where ancient Egypt provides grain for the eternal city.',
                            allegianceGroups: [
                                { name: 'Roman Empire', type: 'primary', description: 'The governing imperial power.' },
                                { name: 'Alexandrian Greeks', type: 'secondary', description: 'The educated Greek-speaking elite.' },
                                { name: 'Egyptian Priesthoods', type: 'secondary', description: 'Ancient temples maintaining traditions.' },
                                { name: 'Early Christians', type: 'religious', description: 'A growing religious minority.' }
                            ]
                        }
                    },
                    {
                        yearMin: 395, yearMax: 500,
                        data: {
                            dominantPower: 'Byzantine Egypt',
                            dominantPowerDescription: 'Egypt becomes a crucial province of the Eastern Roman Empire, its grain feeding Constantinople while Alexandria remains a center of Christian theology and Coptic culture.',
                            eraContextSentence: 'an age of Christian Egypt, where ancient and new faiths coexist along the Nile.',
                            allegianceGroups: [
                                { name: 'Byzantine Empire', type: 'primary', description: 'The Eastern Roman administration.' },
                                { name: 'Coptic Church', type: 'secondary', description: 'The native Egyptian Christian church.' },
                                { name: 'Alexandrian Patriarchate', type: 'secondary', description: 'Powerful church leadership.' },
                                { name: 'Desert Monasteries', type: 'religious', description: 'Centers of ascetic Christianity.' }
                            ]
                        }
                    }
                ]
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Fatimid Caliphate',
                dominantPowerDescription: 'The Fatimid dynasty rules from Cairo, creating a powerful Islamic state that controls trade between the Mediterranean and Indian Ocean.',
                eraContextSentence: 'an era of Islamic prosperity, where Cairo becomes a major center of Islamic learning and trade.',
                allegianceGroups: [
                    { name: 'Fatimid Caliphate', type: 'primary', description: 'The ruling Shia Ismaili caliphate.' },
                    { name: 'Ayyubid Dynasty', type: 'rising', description: 'A rising Sunni power that will eventually supplant the Fatimids.' },
                    { name: 'Nubian Kingdoms', type: 'secondary', description: 'Christian kingdoms on the southern border.' },
                    { name: 'Coptic Christians', type: 'secondary', description: 'The indigenous Christian population.' }
                ],
                structureNames: {
                    fortress: ["Qal'a", 'Citadel', 'Walled City'],
                    mill: ['Waterwheel', 'Sugar Press'],
                    holy_site: ['Al-Azhar Mosque', 'Coptic Monastery', 'Synagogue'],
                    palace: ["Caliph's Palace", "Vizier's Residence"],
                    trading_post: ['Caravanserai', 'Spice Market']
                },
                courtRoles: {
                    palace: ['Caliph', 'Grand Vizier', 'Qadi', 'Court Physician'],
                    holy_site: ['Grand Imam', 'Coptic Pope', 'Rabbi']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Ottoman Empire',
                dominantPowerDescription: 'Egypt becomes an important Ottoman province, though Mamluk influence persists and the region maintains significant autonomy under Ottoman rule.',
                eraContextSentence: 'an era of Ottoman administration, where Egypt serves as a crucial province linking Africa and Asia.',
                allegianceGroups: [
                    { name: 'Ottoman Empire', type: 'primary', description: 'The imperial power based in Istanbul.' },
                    { name: 'Mamluk Beys', type: 'declining', description: 'The former ruling class, retaining local power.' },
                    { name: 'Bedouin Tribes', type: 'rebel', description: 'Nomadic tribes controlling desert routes.' },
                    { name: 'Coptic Communities', type: 'secondary', description: 'The indigenous Christian minority.' }
                ],
                structureNames: {
                    fortress: ['Kale', 'Garrison', 'Citadel of Cairo'],
                    mill: ['Saqiya', 'Windmill'],
                    holy_site: ['Ottoman Mosque', 'Sufi Lodge (Tekke)', 'Monastery'],
                    palace: ["Pasha's Residence", "Mamluk Bey's House"],
                    trading_post: ['Wakala (Urban Caravanserai)', 'Coffee House']
                },
                courtRoles: {
                    palace: ['Pasha', 'Defterdar', 'Agha', 'Mamluk Emir'],
                    holy_site: ['Sheikh al-Islam', 'Coptic Patriarch', 'Sufi Master']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Khedivate of Egypt',
                dominantPowerDescription: 'Under Muhammad Ali and his successors, Egypt pursues modernization and industrialization while nominally remaining part of the Ottoman Empire.',
                eraContextSentence: 'an era of modernization, where Egypt attempts to join the ranks of modern nations.',
                allegianceGroups: [
                    { name: 'Khedivate of Egypt', type: 'primary', description: 'The semi-independent state under Muhammad Ali\'s dynasty.' },
                    { name: 'Ottoman Empire', type: 'secondary', description: 'The nominal sovereign power.' },
                    { name: 'British Empire', type: 'secondary', description: 'A growing economic and political influence, especially after the Suez Canal.' },
                    { name: 'French Empire', type: 'secondary', description: 'A rival European power with cultural influence.' }
                ],
                structureNames: {
                    fortress: ['Modern Fortress', 'Barracks'],
                    mill: ['Cotton Mill', 'Sugar Refinery'],
                    factory: ['Textile Factory', 'Armaments Factory'],
                    mining_colony: ['Canal Works', 'Dam Construction Site'],
                    trading_post: ['Suez Canal Office', 'Railway Station', 'Cotton Exchange']
                },
                courtRoles: {
                    palace: ['Khedive', 'Prime Minister', 'European Advisor', 'Minister of Public Works']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Arab Republic of Egypt',
                dominantPowerDescription: 'Post-colonial Egypt experiences revolution, nationalism, and conflict, seeking to lead the Arab world while navigating the pressures of the Cold War and beyond.',
                eraContextSentence: 'an age of nationalism and nation-building, defined by grand projects and regional conflicts.',
                allegianceGroups: [
                    { name: 'Government of Egypt', type: 'primary', description: 'The central government in Cairo.' },
                    { name: 'Muslim Brotherhood', type: 'rebel', description: 'A powerful Islamist political and social movement.' },
                    { name: 'United States', type: 'secondary', description: 'A major foreign superpower and financial backer.' },
                    { name: 'Soviet Union (until 1991)', type: 'secondary', description: 'A rival superpower and former ally.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Air Defense Site'],
                    factory: ['Aswan High Dam', 'Steel Mill', 'Textile Factory'],
                    trading_post: ['Suez Canal Authority', 'Cairo International Airport', 'Tourist Bazaar'],
                    holy_site: ['Al-Azhar University', 'Saint Catherine\'s Monastery'],
                    palace: ['Presidential Palace']
                },
                courtRoles: {
                    palace: ['President', 'Prime Minister', 'Defense Minister', 'Intelligence Chief']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Arab Republic of Egypt',
                dominantPowerDescription: 'Egypt grapples with climate change, water scarcity from Ethiopian dams, and economic diversification while maintaining its role as a regional power.',
                eraContextSentence: 'an era of environmental challenges and technological adaptation in the ancient land.',
                allegianceGroups: [
                    { name: 'Egyptian Government', type: 'primary', description: 'The central state pursuing economic diversification.' },
                    { name: 'Gulf States', type: 'secondary', description: 'Regional powers providing investment and influence.' },
                    { name: 'China', type: 'trade_company', description: 'Major economic partner in infrastructure and technology.' },
                    { name: 'Environmental Activists', type: 'rebel', description: 'Groups demanding action on Nile water rights and climate.' }
                ],
                structureNames: {
                    fortress: ['Cybersecurity Center', 'Border Control Station'],
                    factory: ['Solar Panel Factory', 'Desalination Plant', 'Tech Hub'],
                    trading_post: ['New Administrative Capital', 'Smart Port of Alexandria'],
                    holy_site: ['Grand Egyptian Museum', 'Interfaith Dialogue Center']
                }
            }
        },
        "Levant": {
            [HistoricalEra.PREHISTORY]: {
                dominantPower: 'Canaanite City-States',
                dominantPowerDescription: 'Bronze Age city-states along the coast and valleys, centers of early alphabetic writing and maritime trade with Egypt and the Aegean.',
                eraContextSentence: 'an age of walled cities and merchant princes, where Baal and Astarte are worshipped and purple dye brings wealth.',
                allegianceGroups: [
                    { name: 'Coastal Cities', type: 'primary', description: 'Phoenician trading centers.' },
                    { name: 'Inland Kingdoms', type: 'secondary', description: 'Agricultural city-states.' },
                    { name: 'Desert Nomads', type: 'secondary', description: 'Bedouin tribes of the interior.' }
                ],
                structureNames: {
                    fortress: ['Cyclopean Walls', 'Gate Tower', 'Coastal Fort', 'Desert Keep'],
                    quarry: ['Cedar Grove', 'Purple Dye Works', 'Copper Mine'],
                    holy_site: ['High Place', 'Baal Temple', 'Asherah Grove', 'Sacred Pillar'],
                    palace: ['Merchant Palace', 'City-King Residence', 'Trading Hall'],
                },
                courtRoles: {
                    palace: ['City King', 'High Priest', 'Master Merchant', 'Scribe', 'Harbor Master']
                }
            },
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Roman Syria',
                dominantPowerDescription: 'The crossroads of empires, Syria-Palestine thrives under Roman rule as a vital link between East and West, with diverse populations maintaining their ancient traditions.',
                eraContextSentence: 'an age of imperial prosperity, where caravans cross the desert and ships ply the Mediterranean.',
                allegianceGroups: [
                    { name: 'Roman Empire', type: 'primary', description: 'The imperial authority from Rome.' },
                    { name: 'Nabataean Kingdom', type: 'secondary', description: 'Arab kingdom controlling trade routes to Arabia.' },
                    { name: 'Jewish Communities', type: 'rebel', description: 'Restive population seeking independence.' },
                    { name: 'Greek Cities', type: 'secondary', description: 'Hellenistic city-states maintaining autonomy.' }
                ],
                structureNames: {
                    fortress: ['Roman Castrum', 'Desert Fort', 'Herodian Fortress'],
                    mill: ['Olive Press', 'Water Mill'],
                    holy_site: ['Temple of Jupiter', 'Jewish Synagogue', 'Nabataean Temple'],
                    palace: ["Governor's Palace", 'Herodian Palace'],
                    trading_post: ['Damascus Market', 'Petra Treasury', 'Coastal Port']
                },
                courtRoles: {
                    palace: ['Procurator', 'Tetrarch', 'High Priest', 'Strategos']
                },
                // Year-specific overrides for the different powers that controlled the Levant during ANTIQUITY
                yearRangeOverrides: [
                    {
                        yearMin: -3000, yearMax: -1200,
                        data: {
                            dominantPower: 'Canaanite City-States',
                            dominantPowerDescription: 'Bronze Age city-states along the coast and valleys flourish under Egyptian influence. Phoenician ports trade purple dye and cedars while Ugarit develops the alphabet.',
                            eraContextSentence: 'an age of merchant princes and chariot warriors, when Egypt and Hatti struggle for mastery of Canaan.',
                            allegianceGroups: [
                                { name: 'Canaanite Cities', type: 'primary', description: 'Independent city-states of the coastal plain.' },
                                { name: 'Egyptian Empire', type: 'secondary', description: 'Southern overlords claiming tribute.' },
                                { name: 'Hittite Empire', type: 'rebel', description: 'Northern power contesting Egyptian influence.' },
                                { name: 'Habiru Bands', type: 'rebel', description: 'Outlaw groups in the hill country.' }
                            ]
                        }
                    },
                    {
                        yearMin: -1200, yearMax: -722,
                        data: {
                            dominantPower: 'Israelite and Phoenician Kingdoms',
                            dominantPowerDescription: 'The Bronze Age collapse brings new peoples. Israel and Judah worship Yahweh in the hills while Phoenician cities dominate Mediterranean trade. Philistines hold the southern coast.',
                            eraContextSentence: 'the Iron Age, when David and Solomon rule and Phoenician ships reach the ends of the earth.',
                            allegianceGroups: [
                                { name: 'Kingdom of Israel', type: 'primary', description: 'Northern Hebrew kingdom based at Samaria.' },
                                { name: 'Kingdom of Judah', type: 'secondary', description: 'Southern Hebrew kingdom based at Jerusalem.' },
                                { name: 'Phoenician Cities', type: 'secondary', description: 'Tyre, Sidon, and Byblos commanding the sea.' },
                                { name: 'Philistine Cities', type: 'rebel', description: 'Sea Peoples settled on the southern coast.' },
                                { name: 'Aramean Kingdoms', type: 'secondary', description: 'Damascus and other Syrian states.' }
                            ],
                            courtRoles: {
                                palace: ['King', 'Prophet', 'High Priest', 'Royal Scribe', 'Commander of the Host']
                            }
                        }
                    },
                    {
                        yearMin: -722, yearMax: -539,
                        data: {
                            dominantPower: 'Assyrian and Babylonian Empires',
                            dominantPowerDescription: 'The great Mesopotamian empires swallow the small kingdoms. Assyria destroys Israel, then Babylon conquers Judah and destroys Jerusalem. Phoenicia pays tribute to survive.',
                            eraContextSentence: 'an age of conquest, when great empires crush the small kingdoms and carry their peoples into exile.',
                            allegianceGroups: [
                                { name: 'Assyrian/Babylonian Empire', type: 'primary', description: 'Mesopotamian overlords ruling through terror.' },
                                { name: 'Kingdom of Judah', type: 'declining', description: 'Last Hebrew kingdom struggling to survive.' },
                                { name: 'Phoenician Cities', type: 'secondary', description: 'Tribute-paying merchant states.' },
                                { name: 'Egyptian Kingdom', type: 'rebel', description: 'Southern power offering false hope to rebels.' }
                            ]
                        }
                    },
                    {
                        yearMin: -539, yearMax: -330,
                        data: {
                            dominantPower: 'Persian Levant',
                            dominantPowerDescription: 'Cyrus permits the Jews to return from exile and rebuild the Temple. The Levant becomes a peaceful satrapy where Phoenician fleets serve Persian kings and Jerusalem rebuilds its walls.',
                            eraContextSentence: 'the Persian peace, when exiles return and the Temple rises again in Jerusalem.',
                            allegianceGroups: [
                                { name: 'Persian Empire', type: 'primary', description: 'The Achaemenid administration.' },
                                { name: 'Jewish Community', type: 'secondary', description: 'Returned exiles rebuilding Judah.' },
                                { name: 'Phoenician Cities', type: 'secondary', description: 'Naval power serving Persian interests.' },
                                { name: 'Samaritan Community', type: 'rebel', description: 'Northern rivals of the Jerusalem cult.' }
                            ],
                            courtRoles: {
                                palace: ['Persian Satrap', 'Jewish Governor', 'High Priest', 'Phoenician King']
                            }
                        }
                    },
                    {
                        yearMin: -330, yearMax: -63,
                        data: {
                            dominantPower: 'Hellenistic Levant',
                            dominantPowerDescription: 'Alexander conquers, then his successors fight for the prize. Ptolemies and Seleucids battle over the land while Greek culture spreads. The Maccabees revolt against forced Hellenization.',
                            eraContextSentence: 'the Hellenistic age, when Greek kings rule and traditional ways face foreign challenge.',
                            allegianceGroups: [
                                { name: 'Seleucid Empire', type: 'primary', description: 'Syrian Greek dynasty based at Antioch.' },
                                { name: 'Ptolemaic Egypt', type: 'rebel', description: 'Egyptian Greek dynasty contesting control.' },
                                { name: 'Hasmonean Kingdom', type: 'rebel', description: 'Jewish state won through Maccabean revolt.' },
                                { name: 'Greek Cities', type: 'secondary', description: 'Autonomous Hellenistic city-states.' }
                            ]
                        }
                    },
                    {
                        yearMin: -63, yearMax: 395,
                        data: {
                            dominantPower: 'Roman Syria',
                            dominantPowerDescription: 'The crossroads of empires, Syria-Palestine thrives under Roman rule. Herod builds grand monuments, then Rome destroys Jerusalem. Christianity is born and spreads.',
                            eraContextSentence: 'an age of Roman peace, then revolt and transformation, as new faiths reshape the ancient land.',
                            allegianceGroups: [
                                { name: 'Roman Empire', type: 'primary', description: 'The imperial authority from Rome.' },
                                { name: 'Herodian Dynasty', type: 'secondary', description: 'Client kings ruling Judea.' },
                                { name: 'Jewish Zealots', type: 'rebel', description: 'Resistance movements against Rome.' },
                                { name: 'Nabataean Kingdom', type: 'secondary', description: 'Arab kingdom controlling trade routes.' }
                            ],
                            courtRoles: {
                                palace: ['Roman Governor', 'Tetrarch', 'High Priest', 'Centurion', 'Tax Collector']
                            }
                        }
                    },
                    {
                        yearMin: 395, yearMax: 500,
                        data: {
                            dominantPower: 'Byzantine Levant',
                            dominantPowerDescription: 'The Eastern Roman Empire rules a Christian Holy Land. Pilgrims flock to Jerusalem while great churches rise over sacred sites. The Syrian desert breeds monks and heresies.',
                            eraContextSentence: 'an age of Christian pilgrimage, when the Holy Land draws the faithful from across the empire.',
                            allegianceGroups: [
                                { name: 'Byzantine Empire', type: 'primary', description: 'The Eastern Roman administration.' },
                                { name: 'Church of Jerusalem', type: 'secondary', description: 'Powerful ecclesiastical establishment.' },
                                { name: 'Monastic Communities', type: 'religious', description: 'Desert monasteries and hermits.' },
                                { name: 'Samaritan Communities', type: 'secondary', description: 'Ancient sect maintaining distinct identity.' }
                            ]
                        }
                    }
                ]
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Abbasid Caliphate',
                dominantPowerDescription: 'Under Islamic rule, the Levant becomes a prosperous region linking Baghdad to Cairo, with Damascus emerging as a major center of Islamic culture.',
                eraContextSentence: 'an era of Islamic golden age, where scholars translate ancient wisdom and merchants trade from China to Spain.',
                allegianceGroups: [
                    { name: 'Abbasid Caliphate', type: 'primary', description: 'The ruling caliphate based in Baghdad.' },
                    { name: 'Fatimid Caliphate', type: 'rebel', description: 'Rival Shia power based in Egypt.' },
                    { name: 'Byzantine Empire', type: 'rebel', description: 'Christian empire seeking to reclaim lost territories.' },
                    { name: 'Crusader States', type: 'rebel', description: 'European Christian kingdoms established by conquest.' }
                ],
                structureNames: {
                    fortress: ['Krak des Chevaliers', 'Citadel of Aleppo', 'Coastal Ribat'],
                    mill: ['Norias of Hama', 'Windmill'],
                    holy_site: ['Umayyad Mosque', 'Church of the Holy Sepulchre', 'Dome of the Rock'],
                    palace: ["Emir's Palace", 'Crusader Castle'],
                    trading_post: ['Souk of Damascus', 'Frankish Quarter', 'Silk Road Caravanserai']
                },
                courtRoles: {
                    palace: ['Emir', 'Wazir', 'Qadi', 'Atabeg'],
                    holy_site: ['Imam', 'Patriarch', 'Knight Templar']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Ottoman Empire',
                dominantPowerDescription: 'The Ottomans bring stability to the Levant, organizing it into provinces while respecting local traditions and maintaining the region as a crucial trade hub.',
                eraContextSentence: 'an era of Ottoman peace, where the empire\'s reach extends from the Balkans to Arabia.',
                allegianceGroups: [
                    { name: 'Ottoman Empire', type: 'primary', description: 'The imperial government in Istanbul.' },
                    { name: 'Local Arab Notables', type: 'secondary', description: 'Traditional elite families maintaining local power.' },
                    { name: 'Druze Emirs', type: 'secondary', description: 'Mountain chiefs with significant autonomy.' },
                    { name: 'European Merchants', type: 'trade_company', description: 'Venetian and French traders in coastal cities.' }
                ],
                structureNames: {
                    fortress: ['Ottoman Kale', 'Coastal Fort', 'Mountain Stronghold'],
                    mill: ['Soap Factory', 'Silk Workshop'],
                    holy_site: ['Imperial Mosque', 'Mar Saba Monastery', 'Druze Khalwa'],
                    palace: ["Pasha's Serai", "Emir's Palace"],
                    trading_post: ['Khan al-Umdan', 'French Fondouk', 'Silk Market']
                },
                courtRoles: {
                    palace: ['Wali', 'Defterdar', 'Janissary Commander', 'Dragoman'],
                    holy_site: ['Mufti', 'Greek Orthodox Patriarch', 'Chief Rabbi']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Ottoman Empire (Declining)',
                dominantPowerDescription: 'The weakening Ottoman Empire faces European encroachment and rising Arab nationalism, while modernization efforts struggle against traditional structures.',
                eraContextSentence: 'an era of awakening and anxiety, as old empires crumble and new identities emerge.',
                allegianceGroups: [
                    { name: 'Ottoman Empire', type: 'primary', description: 'The declining but still sovereign power.' },
                    { name: 'Arab Nationalists', type: 'rebel', description: 'Intellectuals and officers seeking Arab independence.' },
                    { name: 'European Powers', type: 'secondary', description: 'France and Britain increasing their influence.' },
                    { name: 'Zionist Movement', type: 'secondary', description: 'Jewish settlers establishing agricultural colonies.' }
                ],
                structureNames: {
                    fortress: ['Telegraph Station', 'Railway Guard Post'],
                    mill: ['Steam-Powered Mill', 'Modern Soap Factory'],
                    factory: ['Textile Mill', 'Tobacco Processing Plant'],
                    trading_post: ['Railway Station', 'European Quarter', 'Modern Port Facility'],
                    holy_site: ['Reformed Mosque', 'Mission School', 'Zionist Settlement']
                },
                courtRoles: {
                    palace: ['Mutasarrif', 'European Consul', 'Telegraph Operator', 'Railway Administrator']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Multiple Nation-States',
                dominantPowerDescription: 'The Levant fragments into Syria, Lebanon, Jordan, and Israel/Palestine, each pursuing different paths amid ongoing conflicts and superpower intervention.',
                eraContextSentence: 'an age of division and conflict, where ancient lands are carved by modern borders.',
                allegianceGroups: [
                    { name: 'Syrian Arab Republic', type: 'primary', description: 'Ba\'athist state aligned with Soviet Union/Russia.' },
                    { name: 'State of Israel', type: 'primary', description: 'Jewish state established in 1948.' },
                    { name: 'Palestinian Groups', type: 'rebel', description: 'Various factions seeking Palestinian statehood.' },
                    { name: 'Lebanese Factions', type: 'secondary', description: 'Complex mix of sectarian militias and parties.' }
                ],
                structureNames: {
                    fortress: ['Military Checkpoint', 'Air Base', 'Border Wall'],
                    factory: ['Pharmaceutical Plant', 'Diamond Cutting Facility', 'Weapons Factory'],
                    trading_post: ['Free Trade Zone', 'Tech Startup Hub', 'Refugee Camp'],
                    holy_site: ['Western Wall', 'Al-Aqsa Mosque', 'Church of the Nativity'],
                    palace: ['Presidential Palace', 'Parliament Building']
                },
                courtRoles: {
                    palace: ['President', 'Prime Minister', 'Intelligence Chief', 'Military Commander']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Regional Federation',
                dominantPowerDescription: 'Climate pressures and water scarcity force unprecedented cooperation, while high-tech industries and renewable energy reshape the ancient crossroads.',
                eraContextSentence: 'an era of forced cooperation, where water is more precious than oil.',
                allegianceGroups: [
                    { name: 'Levantine Water Authority', type: 'primary', description: 'Multinational body managing scarce water resources.' },
                    { name: 'Tech Conglomerates', type: 'trade_company', description: 'Major technology companies based in the region.' },
                    { name: 'Climate Refugees', type: 'secondary', description: 'Displaced populations from more affected regions.' },
                    { name: 'Traditional Communities', type: 'rebel', description: 'Groups resisting technological change.' }
                ],
                structureNames: {
                    fortress: ['Climate Monitoring Station', 'Automated Border Control'],
                    factory: ['Desalination Megaplant', 'Vertical Farm Complex', 'Quantum Computing Center'],
                    trading_post: ['Digital Free Zone', 'Renewable Energy Hub'],
                    holy_site: ['Interfaith Peace Center', 'Virtual Pilgrimage Site']
                }
            }
        },
        "Anatolia": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Roman Asia',
                dominantPowerDescription: 'Anatolia prospers as the wealthy eastern provinces of Rome, with Greek cities maintaining their ancient culture while new Roman infrastructure binds the region together.',
                eraContextSentence: 'an age of marble and prosperity, where Greek tradition meets Roman power.',
                allegianceGroups: [
                    { name: 'Roman Empire', type: 'primary', description: 'The imperial administration from Rome.' },
                    { name: 'Parthian Empire', type: 'rebel', description: 'Eastern rival threatening the frontier.' },
                    { name: 'Greek City-States', type: 'secondary', description: 'Ancient poleis maintaining local autonomy.' },
                    { name: 'Armenian Kingdom', type: 'secondary', description: 'Buffer state between Rome and Parthia.' }
                ],
                structureNames: {
                    fortress: ['Roman Castrum', 'Hilltop Acropolis', 'Frontier Fort'],
                    mill: ['Water Mill', 'Marble Quarry'],
                    holy_site: ['Temple of Artemis', 'Mithraeum', 'Imperial Cult Temple'],
                    palace: ["Proconsul's Villa", 'Royal Palace'],
                    trading_post: ['Agora', 'Harbor Emporium', 'Silk Road Station']
                },
                courtRoles: {
                    palace: ['Proconsul', 'Asiarch', 'Strategos', 'Publicanus']
                },
                // Year-specific overrides for the different powers that ruled Anatolia during ANTIQUITY
                yearRangeOverrides: [
                    {
                        yearMin: -3000, yearMax: -1650,
                        data: {
                            dominantPower: 'Hatti and Early Anatolian Kingdoms',
                            dominantPowerDescription: 'Bronze Age city-states dot the Anatolian plateau. The Hatti people build the foundations upon which the Hittites will rise. Assyrian merchants establish trading colonies.',
                            eraContextSentence: 'an early age, when Assyrian merchants trade tin for silver and the foundations of empire are laid.',
                            allegianceGroups: [
                                { name: 'Hatti City-States', type: 'primary', description: 'Indigenous kingdoms of central Anatolia.' },
                                { name: 'Assyrian Merchants', type: 'secondary', description: 'Trading colonies from Mesopotamia.' },
                                { name: 'Hurrian Peoples', type: 'secondary', description: 'Eastern peoples with distinct culture.' }
                            ]
                        }
                    },
                    {
                        yearMin: -1650, yearMax: -1180,
                        data: {
                            dominantPower: 'Hittite Empire',
                            dominantPowerDescription: 'The Hittites forge the first great Anatolian empire, challenging Egypt for mastery of the Near East. From Hattusa they rule with iron weapons and diplomatic cunning.',
                            eraContextSentence: 'the age of the Hittites, when the Land of Hatti contests Egypt for mastery of the world.',
                            allegianceGroups: [
                                { name: 'Hittite Empire', type: 'primary', description: 'The Great Kingdom ruling from Hattusa.' },
                                { name: 'Egyptian Empire', type: 'rebel', description: 'Southern rival contesting Syria.' },
                                { name: 'Mitanni Kingdom', type: 'declining', description: 'Hurrian kingdom absorbed by Hatti and Assyria.' },
                                { name: 'Arzawa Lands', type: 'secondary', description: 'Western Anatolian vassals and rivals.' }
                            ],
                            courtRoles: {
                                palace: ['Great King', 'Tawananna (Queen)', 'Chief of Scribes', 'Chief of Wine', 'Commander of Chariots']
                            }
                        }
                    },
                    {
                        yearMin: -1180, yearMax: -700,
                        data: {
                            dominantPower: 'Neo-Hittite and Phrygian Kingdoms',
                            dominantPowerDescription: 'The Bronze Age collapse destroys the Hittite Empire. Neo-Hittite states survive in the southeast while Phrygians dominate central Anatolia under legendary King Midas.',
                            eraContextSentence: 'an age of new kingdoms rising from old ruins, when Midas turns all to gold and Greeks settle the coasts.',
                            allegianceGroups: [
                                { name: 'Phrygian Kingdom', type: 'primary', description: 'Successor state in central Anatolia.' },
                                { name: 'Neo-Hittite States', type: 'secondary', description: 'Surviving Hittite successor kingdoms.' },
                                { name: 'Greek Colonies', type: 'secondary', description: 'Ionian and Aeolian settlements on the coast.' },
                                { name: 'Urartian Kingdom', type: 'rebel', description: 'Eastern rival in the Armenian highlands.' }
                            ]
                        }
                    },
                    {
                        yearMin: -700, yearMax: -546,
                        data: {
                            dominantPower: 'Lydian Kingdom',
                            dominantPowerDescription: 'Lydia dominates western Anatolia, inventing coinage and accumulating legendary wealth. King Croesus rules from Sardis until Cyrus the Persian changes the world.',
                            eraContextSentence: 'the age of Croesus, when Lydia invents money and becomes a byword for wealth.',
                            allegianceGroups: [
                                { name: 'Lydian Kingdom', type: 'primary', description: 'Wealthy realm of Croesus based at Sardis.' },
                                { name: 'Greek Ionian Cities', type: 'secondary', description: 'Wealthy trading cities under Lydian suzerainty.' },
                                { name: 'Median Empire', type: 'secondary', description: 'Eastern neighbor and sometime ally.' },
                                { name: 'Cimmerian Raiders', type: 'rebel', description: 'Nomadic invaders from the steppes.' }
                            ],
                            courtRoles: {
                                palace: ['King of Lydia', 'Royal Treasurer', 'Commander of the Guard', 'Court Diviner']
                            }
                        }
                    },
                    {
                        yearMin: -546, yearMax: -330,
                        data: {
                            dominantPower: 'Persian Anatolia',
                            dominantPowerDescription: 'Cyrus conquers Croesus and Anatolia becomes the western frontier of the Persian Empire. The Ionian Revolt and Persian Wars fail to shake Persian control.',
                            eraContextSentence: 'the Persian peace, when the Great King rules from the Aegean to the Indus.',
                            allegianceGroups: [
                                { name: 'Persian Empire', type: 'primary', description: 'The Achaemenid administration.' },
                                { name: 'Greek City-States', type: 'rebel', description: 'Ionian cities chafing under Persian rule.' },
                                { name: 'Persian Satraps', type: 'secondary', description: 'Provincial governors, sometimes rebellious.' },
                                { name: 'Carian and Lycian Kingdoms', type: 'secondary', description: 'Semi-autonomous client states.' }
                            ]
                        }
                    },
                    {
                        yearMin: -330, yearMax: -133,
                        data: {
                            dominantPower: 'Hellenistic Anatolia',
                            dominantPowerDescription: 'Alexander conquers, dies, and his generals divide the spoils. Seleucids, Antigonids, and local dynasties contest Anatolia while Greek culture spreads throughout the peninsula.',
                            eraContextSentence: 'the Hellenistic age, when successor kings war and Greek cities flourish.',
                            allegianceGroups: [
                                { name: 'Seleucid Empire', type: 'primary', description: 'Syrian Greek dynasty claiming Anatolia.' },
                                { name: 'Kingdom of Pergamon', type: 'secondary', description: 'Wealthy Attalid realm of western Anatolia.' },
                                { name: 'Kingdom of Pontus', type: 'secondary', description: 'Persian-Greek dynasty on the Black Sea.' },
                                { name: 'Galatian Celts', type: 'rebel', description: 'Celtic settlers in central Anatolia.' }
                            ]
                        }
                    },
                    {
                        yearMin: -133, yearMax: 395,
                        data: {
                            dominantPower: 'Roman Asia',
                            dominantPowerDescription: 'Anatolia prospers as the wealthy eastern provinces of Rome, with Greek cities maintaining their ancient culture while new Roman infrastructure binds the region together.',
                            eraContextSentence: 'an age of marble and prosperity, where Greek tradition meets Roman power.',
                            allegianceGroups: [
                                { name: 'Roman Empire', type: 'primary', description: 'The imperial administration from Rome.' },
                                { name: 'Parthian Empire', type: 'rebel', description: 'Eastern rival threatening the frontier.' },
                                { name: 'Greek City-States', type: 'secondary', description: 'Ancient poleis maintaining local autonomy.' },
                                { name: 'Armenian Kingdom', type: 'secondary', description: 'Buffer state between Rome and Parthia.' }
                            ]
                        }
                    },
                    {
                        yearMin: 395, yearMax: 500,
                        data: {
                            dominantPower: 'Byzantine Anatolia',
                            dominantPowerDescription: 'The Eastern Roman Empire centers on Anatolia, with Constantinople commanding the straits. Christianity is now triumphant while ancient cities transform into medieval strongholds.',
                            eraContextSentence: 'the age of Christian empire, when Constantinople becomes the New Rome.',
                            allegianceGroups: [
                                { name: 'Byzantine Empire', type: 'primary', description: 'The Eastern Roman state.' },
                                { name: 'Orthodox Church', type: 'secondary', description: 'The established Christian church.' },
                                { name: 'Sasanian Persia', type: 'rebel', description: 'Eastern rival on the frontier.' },
                                { name: 'Isaurian Bandits', type: 'rebel', description: 'Mountain peoples resisting central control.' }
                            ]
                        }
                    }
                ]
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Byzantine Empire',
                dominantPowerDescription: 'As the heartland of Byzantium, Anatolia provides soldiers and resources for the empire while facing constant pressure from Arab raids and later Turkish migration.',
                eraContextSentence: 'an era of faith and fortification, where Christian empire confronts Islamic expansion.',
                allegianceGroups: [
                    { name: 'Byzantine Empire', type: 'primary', description: 'The Eastern Roman Empire centered in Constantinople.' },
                    { name: 'Seljuk Turks', type: 'rebel', description: 'Nomadic conquerors establishing the Sultanate of Rum.' },
                    { name: 'Armenian Principalities', type: 'secondary', description: 'Christian lords in the eastern mountains.' },
                    { name: 'Arab Raiders', type: 'rebel', description: 'Muslim forces launching seasonal campaigns.' }
                ],
                structureNames: {
                    fortress: ['Theodosian Walls', 'Theme Kastron', 'Mountain Fortress'],
                    mill: ['Monastery Mill', 'Village Waterwheel'],
                    holy_site: ['Hagia Sophia', 'Rock Churches of Cappadocia', 'Armenian Cathedral'],
                    palace: ['Imperial Palace', "Theme Strategos' Residence"],
                    trading_post: ['Constantinople Forum', 'Trebizond Port', 'Anatolian Market Town']
                },
                courtRoles: {
                    palace: ['Basileus', 'Logothete', 'Strategos', 'Patriarch'],
                    holy_site: ['Ecumenical Patriarch', 'Hegumen', 'Bishop']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Ottoman Empire',
                dominantPowerDescription: 'Anatolia becomes the core of the Ottoman Empire, with Turkish settlement complete and the region serving as the recruitment ground for the empire\'s elite forces.',
                eraContextSentence: 'an era of Ottoman ascendancy, where the sultans rule from the crossroads of continents.',
                allegianceGroups: [
                    { name: 'Ottoman Empire', type: 'primary', description: 'The dominant imperial power.' },
                    { name: 'Safavid Persia', type: 'rebel', description: 'Shia rival empire to the east.' },
                    { name: 'Turkmen Tribes', type: 'secondary', description: 'Nomadic groups in eastern Anatolia.' },
                    { name: 'Greek Orthodox Communities', type: 'secondary', description: 'Christian subjects maintaining their faith.' }
                ],
                structureNames: {
                    fortress: ['Rumeli Hisarı', 'Anatolian Castle', 'Janissary Barracks'],
                    mill: ['Watermill', 'Windmill'],
                    holy_site: ['Süleymaniye Mosque', 'Greek Monastery', 'Mevlevi Lodge'],
                    palace: ['Topkapı Palace', "Provincial Governor's Mansion"],
                    trading_post: ['Grand Bazaar', 'Caravanserai', 'Port of Smyrna']
                },
                courtRoles: {
                    palace: ['Sultan', 'Grand Vizier', 'Janissary Agha', 'Sheikh ul-Islam'],
                    holy_site: ['Chief Mufti', 'Greek Patriarch', 'Sufi Sheikh']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Ottoman Empire (Modernizing)',
                dominantPowerDescription: 'The Ottoman heartland undergoes rapid modernization as railroads and telegraphs connect ancient cities, while ethnic tensions begin to threaten imperial unity.',
                eraContextSentence: 'an era of reform and resistance, as the empire struggles to modernize while preserving tradition.',
                allegianceGroups: [
                    { name: 'Ottoman Empire', type: 'primary', description: 'The modernizing but struggling empire.' },
                    { name: 'Young Turks', type: 'rising', description: 'Reformist movement seeking constitutional government.' },
                    { name: 'Armenian Revolutionaries', type: 'rebel', description: 'Nationalist groups seeking autonomy or independence.' },
                    { name: 'European Powers', type: 'secondary', description: 'Foreign states with growing economic influence.' }
                ],
                structureNames: {
                    fortress: ['Modern Fort', 'Telegraph Station'],
                    mill: ['Steam Mill', 'Tobacco Factory'],
                    factory: ['Arms Factory', 'Railway Workshop'],
                    trading_post: ['Orient Express Terminal', 'Modern Port', 'European Quarter'],
                    palace: ['Dolmabahçe Palace', 'Provincial Government House']
                },
                courtRoles: {
                    palace: ['Sultan', 'Tanzimat Minister', 'European Military Advisor', 'Provincial Vali']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Republic of Turkey',
                dominantPowerDescription: 'Modern Turkey emerges from Ottoman collapse, pursuing aggressive westernization and secularization while maintaining its position between Europe and Asia.',
                eraContextSentence: 'an age of nation-building and modernization, where ancient lands embrace new identities.',
                allegianceGroups: [
                    { name: 'Turkish Republic', type: 'primary', description: 'The secular nationalist state.' },
                    { name: 'Kurdish Groups', type: 'rebel', description: 'Ethnic minority seeking recognition or independence.' },
                    { name: 'NATO', type: 'secondary', description: 'Western military alliance.' },
                    { name: 'Political Islamists', type: 'rebel', description: 'Groups challenging secular governance.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Border Fortification'],
                    factory: ['Automobile Plant', 'Steel Mill', 'Textile Factory'],
                    trading_post: ['Atatürk Airport', 'Free Trade Zone', 'Tourist Resort'],
                    holy_site: ['Restored Byzantine Church', 'Modern Mosque', 'Atatürk Mausoleum'],
                    palace: ['Presidential Palace', 'Parliament Building']
                },
                courtRoles: {
                    palace: ['President', 'Prime Minister', 'Chief of General Staff', 'Constitutional Court Judge']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Turkish Federation',
                dominantPowerDescription: 'Turkey leverages its geographic position to become a renewable energy hub, while managing water disputes and refugee flows from climate-affected regions.',
                eraContextSentence: 'an era of energy transition, where ancient trade routes carry electricity instead of silk.',
                allegianceGroups: [
                    { name: 'Turkish Government', type: 'primary', description: 'Federal state balancing competing interests.' },
                    { name: 'European Energy Union', type: 'trade_company', description: 'Major customer for renewable energy exports.' },
                    { name: 'Kurdish Autonomous Region', type: 'secondary', description: 'Self-governing area with water resources.' },
                    { name: 'Climate Migration Authority', type: 'secondary', description: 'International body managing refugee flows.' }
                ],
                structureNames: {
                    fortress: ['Drone Command Center', 'Climate Monitoring Station'],
                    factory: ['Solar Panel Gigafactory', 'Lithium Battery Plant', 'Vertical Farm'],
                    trading_post: ['Energy Exchange', 'Digital Silk Road Hub'],
                    holy_site: ['Hagia Sophia Museum Complex', 'Interfaith Council Building']
                }
            }
        },
        "Mesopotamia": {
            [HistoricalEra.PREHISTORY]: {
                dominantPower: 'Sumerian City-States',
                dominantPowerDescription: 'The world\'s first cities rise between the rivers, inventing writing, law codes, and monumental architecture under priest-kings.',
                eraContextSentence: 'the dawn of civilization, where ziggurats reach toward heaven and cuneiform tablets record the first laws.',
                allegianceGroups: [
                    { name: 'Uruk', type: 'primary', description: 'The greatest of the early cities.' },
                    { name: 'Ur', type: 'secondary', description: 'Rival city of royal tombs.' },
                    { name: 'Eridu', type: 'secondary', description: 'The first city, sacred to Enki.' }
                ],
                structureNames: {
                    fortress: ['City Walls', 'Gate of Ishtar', 'River Fort'],
                    quarry: ['Clay Pit', 'Reed Marsh', 'Bitumen Seep'],
                    holy_site: ['Ziggurat', 'Temple Complex', 'Sacred Precinct', 'House of Tablets'],
                    palace: ['Lugal Palace', 'Temple Estate', 'Royal Treasury'],
                },
                courtRoles: {
                    palace: ['Lugal', 'Ensi', 'High Priestess', 'Cup Bearer', 'Chief Scribe', 'Diviner']
                }
            },
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Parthian Empire',
                dominantPowerDescription: 'The Parthians rule from Ctesiphon, maintaining the ancient traditions of Mesopotamia while serving as Rome\'s greatest eastern rival.',
                eraContextSentence: 'an age of cavalry and commerce, where Parthian arrows check Roman ambition.',
                allegianceGroups: [
                    { name: 'Parthian Empire', type: 'primary', description: 'The Arsacid dynasty ruling from Ctesiphon.' },
                    { name: 'Roman Empire', type: 'declining', description: 'Western rival seeking to control the region.' },
                    { name: 'Arab Kingdoms', type: 'secondary', description: 'Buffer states like Hatra between the empires.' },
                    { name: 'Jewish Exilarchs', type: 'secondary', description: 'Leaders of the ancient Jewish community.' }
                ],
                structureNames: {
                    fortress: ['Ctesiphon Walls', 'Desert Fort', 'River Citadel'],
                    mill: ['Irrigation Wheel', 'Date Press'],
                    holy_site: ['Fire Temple', 'Jewish Academy', 'Temple of Bel'],
                    palace: ['Palace of Ctesiphon', "Satrap's Residence"],
                    trading_post: ['Silk Road Emporium', 'River Port', 'Caravan Station']
                },
                courtRoles: {
                    palace: ['King of Kings', 'Wuzurg Framadar', 'Satrap', 'Chief Magus']
                },
                // Year-specific overrides for the different empires that ruled Mesopotamia during ANTIQUITY
                yearRangeOverrides: [
                    {
                        yearMin: -2350, yearMax: -2150,
                        data: {
                            dominantPower: 'Akkadian Empire',
                            dominantPowerDescription: 'The world\'s first empire, founded by Sargon of Akkad, unites Mesopotamia under Semitic rulers who claim dominion from the Upper to the Lower Sea.',
                            eraContextSentence: 'the age of Sargon, when the first empire stretches from sea to sea.',
                            allegianceGroups: [
                                { name: 'Akkadian Empire', type: 'primary', description: 'The empire of Sargon and his successors.' },
                                { name: 'Sumerian Cities', type: 'declining', description: 'Former city-states under Akkadian rule.' },
                                { name: 'Gutian Tribes', type: 'rebel', description: 'Mountain peoples threatening from the east.' }
                            ]
                        }
                    },
                    {
                        yearMin: -2150, yearMax: -2000,
                        data: {
                            dominantPower: 'Third Dynasty of Ur',
                            dominantPowerDescription: 'The Sumerian renaissance under the kings of Ur, who rebuild civilization after the Gutian chaos and establish a highly bureaucratic state.',
                            eraContextSentence: 'the Sumerian renaissance, when Ur-Nammu\'s law code brings order to the land.',
                            allegianceGroups: [
                                { name: 'Kingdom of Ur', type: 'primary', description: 'The neo-Sumerian empire centered at Ur.' },
                                { name: 'Amorite Tribes', type: 'rebel', description: 'Western nomads pressing against the borders.' },
                                { name: 'Elamite Kingdom', type: 'secondary', description: 'Eastern neighbor and sometime rival.' }
                            ]
                        }
                    },
                    {
                        yearMin: -2000, yearMax: -1600,
                        data: {
                            dominantPower: 'Old Babylonian Empire',
                            dominantPowerDescription: 'Babylon rises to dominance under Hammurabi, whose famous law code brings justice to the land. Merchants trade copper from Dilmun and textiles from the workshops.',
                            eraContextSentence: 'the age of Hammurabi, when Babylon\'s laws govern from the Euphrates to the Tigris.',
                            allegianceGroups: [
                                { name: 'Babylon', type: 'primary', description: 'The kingdom of Hammurabi and his dynasty.' },
                                { name: 'Larsa', type: 'declining', description: 'Former rival absorbed into the empire.' },
                                { name: 'Assyria', type: 'secondary', description: 'Northern trading kingdom.' },
                                { name: 'Mari', type: 'secondary', description: 'Upper Euphrates trade center.' }
                            ],
                            courtRoles: {
                                palace: ['King of Babylon', 'Crown Prince', 'Chief Judge', 'Royal Scribe', 'Temple Administrator', 'Tax Collector']
                            }
                        }
                    },
                    {
                        yearMin: -1600, yearMax: -1150,
                        data: {
                            dominantPower: 'Kassite Babylon',
                            dominantPowerDescription: 'The Kassites, mountain warriors from the east, rule Babylon for four centuries, preserving Mesopotamian traditions while introducing horses and new gods.',
                            eraContextSentence: 'the Kassite centuries, when foreign kings preserve ancient ways.',
                            allegianceGroups: [
                                { name: 'Kassite Babylon', type: 'primary', description: 'The long-ruling Kassite dynasty.' },
                                { name: 'Middle Assyria', type: 'secondary', description: 'Northern power growing in strength.' },
                                { name: 'Elam', type: 'rebel', description: 'Eastern rival threatening from the mountains.' }
                            ]
                        }
                    },
                    {
                        yearMin: -1150, yearMax: -612,
                        data: {
                            dominantPower: 'Neo-Assyrian Empire',
                            dominantPowerDescription: 'The Assyrian war machine dominates the ancient world, its disciplined armies, iron weapons, and calculated terror subjecting all of Mesopotamia to the kings of Nineveh.',
                            eraContextSentence: 'the Assyrian age, when the empire\'s armies march from Egypt to Elam.',
                            allegianceGroups: [
                                { name: 'Assyrian Empire', type: 'primary', description: 'The mighty empire ruling from Nineveh.' },
                                { name: 'Babylonia', type: 'declining', description: 'Southern region under Assyrian control.' },
                                { name: 'Chaldean Tribes', type: 'rebel', description: 'Aramean peoples resisting Assyrian rule.' },
                                { name: 'Median Kingdom', type: 'secondary', description: 'Eastern Iranian power growing in strength.' }
                            ]
                        }
                    },
                    {
                        yearMin: -612, yearMax: -539,
                        data: {
                            dominantPower: 'Neo-Babylonian Empire',
                            dominantPowerDescription: 'Babylon rises again under Nebuchadnezzar, who destroys Jerusalem, builds the Ishtar Gate, and makes his city the wonder of the ancient world.',
                            eraContextSentence: 'the Chaldean restoration, when Babylon\'s hanging gardens amaze the world.',
                            allegianceGroups: [
                                { name: 'Babylon', type: 'primary', description: 'The restored Babylonian empire under Nebuchadnezzar.' },
                                { name: 'Median Empire', type: 'secondary', description: 'Eastern ally against Assyria.' },
                                { name: 'Egyptian Kingdom', type: 'rebel', description: 'Southern rival contesting the Levant.' },
                                { name: 'Jewish Exiles', type: 'secondary', description: 'Captive community by the rivers of Babylon.' }
                            ]
                        }
                    },
                    {
                        yearMin: -539, yearMax: -330,
                        data: {
                            dominantPower: 'Persian Achaemenid Empire',
                            dominantPowerDescription: 'Cyrus the Great conquers Babylon, beginning two centuries of Persian rule. Mesopotamia becomes a wealthy satrapy, its ancient traditions protected by the King of Kings.',
                            eraContextSentence: 'the Persian peace, when the King of Kings rules from India to Egypt.',
                            allegianceGroups: [
                                { name: 'Achaemenid Empire', type: 'primary', description: 'The Persian empire of Cyrus and his heirs.' },
                                { name: 'Babylonian Priesthood', type: 'secondary', description: 'Temple authorities maintaining tradition.' },
                                { name: 'Greek City-States', type: 'rebel', description: 'Western rivals who burned Sardis and defied the Great King.' }
                            ]
                        }
                    },
                    {
                        yearMin: -330, yearMax: -140,
                        data: {
                            dominantPower: 'Seleucid Empire',
                            dominantPowerDescription: 'Alexander\'s generals divide his conquests. Seleucus claims the east, founding Seleucia on the Tigris and ruling a vast realm where Greek and Babylonian cultures mingle.',
                            eraContextSentence: 'the Hellenistic age, when Macedonian kings rule from new cities built in the eastern style.',
                            allegianceGroups: [
                                { name: 'Seleucid Kingdom', type: 'primary', description: 'The Greek dynasty ruling from Antioch and Seleucia.' },
                                { name: 'Parthian Kingdom', type: 'rebel', description: 'Iranian nomads growing powerful on the eastern frontier.' },
                                { name: 'Greek Cities', type: 'secondary', description: 'Colonies of settlers maintaining Hellenic culture.' }
                            ]
                        }
                    },
                    {
                        yearMin: -140, yearMax: 224,
                        data: {
                            dominantPower: 'Parthian Empire',
                            dominantPowerDescription: 'The Parthians rule from Ctesiphon, maintaining the ancient traditions of Mesopotamia while serving as Rome\'s greatest eastern rival.',
                            eraContextSentence: 'an age of cavalry and commerce, where Parthian arrows check Roman ambition.',
                            allegianceGroups: [
                                { name: 'Parthian Empire', type: 'primary', description: 'The Arsacid dynasty ruling from Ctesiphon.' },
                                { name: 'Roman Empire', type: 'declining', description: 'Western rival seeking to control the region.' },
                                { name: 'Arab Kingdoms', type: 'secondary', description: 'Buffer states like Hatra between the empires.' },
                                { name: 'Jewish Exilarchs', type: 'secondary', description: 'Leaders of the ancient Jewish community.' }
                            ]
                        }
                    },
                    {
                        yearMin: 224, yearMax: 500,
                        data: {
                            dominantPower: 'Sasanian Empire',
                            dominantPowerDescription: 'The Sasanians overthrow the Parthians and revive the glory of ancient Persia. From Ctesiphon, they challenge Rome and Byzantium for mastery of the world.',
                            eraContextSentence: 'the Sasanian restoration, when Zoroastrian fire temples rise beside ancient shrines.',
                            allegianceGroups: [
                                { name: 'Sasanian Empire', type: 'primary', description: 'The new Persian dynasty claiming the legacy of Cyrus.' },
                                { name: 'Roman/Byzantine Empire', type: 'rebel', description: 'Western rival in perpetual conflict.' },
                                { name: 'Nestorian Christians', type: 'secondary', description: 'Growing Christian community in the East.' },
                                { name: 'Jewish Academies', type: 'secondary', description: 'Rabbinical scholars compiling the Babylonian Talmud.' }
                            ]
                        }
                    }
                ]
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Abbasid Caliphate',
                dominantPowerDescription: 'Baghdad becomes the glittering capital of the Islamic world, where caliphs patronize scholars and poets while managing a vast empire.',
                eraContextSentence: 'an era of learning and luxury, where the House of Wisdom preserves ancient knowledge.',
                allegianceGroups: [
                    { name: 'Abbasid Caliphate', type: 'primary', description: 'The caliphate ruling from Baghdad.' },
                    { name: 'Buyid Dynasty', type: 'secondary', description: 'Persian military rulers controlling the caliph.' },
                    { name: 'Byzantine Empire', type: 'rebel', description: 'Christian empire on the northwestern frontier.' },
                    { name: 'Bedouin Tribes', type: 'rebel', description: 'Nomadic raiders from the desert.' }
                ],
                structureNames: {
                    fortress: ['Round City Walls', 'River Fort', 'Desert Ribat'],
                    mill: ['Waterwheel', 'Paper Mill'],
                    holy_site: ['Grand Mosque of Baghdad', 'Shrine of Ali', 'Nestorian Church'],
                    palace: ["Caliph's Palace", 'House of Wisdom'],
                    trading_post: ['Baghdad Bazaar', 'River Wharf', 'Silk Road Caravanserai']
                },
                courtRoles: {
                    palace: ['Caliph', 'Grand Vizier', 'Chief Qadi', 'Court Poet'],
                    holy_site: ['Chief Imam', 'Nestorian Catholicos', 'Jewish Exilarch']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Ottoman-Safavid Contested',
                dominantPowerDescription: 'Mesopotamia becomes a battleground between Ottoman Turks and Safavid Persians, with Baghdad changing hands multiple times as the region suffers from constant warfare.',
                eraContextSentence: 'an era of sectarian conflict, where Sunni and Shia empires clash over ancient lands.',
                allegianceGroups: [
                    { name: 'Ottoman Empire', type: 'primary', description: 'Sunni Turkish empire claiming the region.' },
                    { name: 'Safavid Empire', type: 'rebel', description: 'Shia Persian empire contesting control.' },
                    { name: 'Arab Tribes', type: 'secondary', description: 'Local tribes playing both sides.' },
                    { name: 'Kurdish Emirates', type: 'secondary', description: 'Mountain chiefs maintaining autonomy.' }
                ],
                structureNames: {
                    fortress: ['Ottoman Fort', 'Safavid Citadel', 'Tribal Stronghold'],
                    mill: ['Date Processing', 'Grain Mill'],
                    holy_site: ['Shia Shrine', 'Sunni Mosque', 'Christian Monastery'],
                    palace: ["Pasha's Palace", "Governor's Residence"],
                    trading_post: ['Bazaar', 'River Port', 'Desert Outpost']
                },
                courtRoles: {
                    palace: ['Pasha', 'Safavid Governor', 'Tribal Sheikh', 'Religious Judge']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Ottoman Empire (British Influence)',
                dominantPowerDescription: 'The discovery of oil begins to transform Mesopotamia as British influence grows, while Arab nationalism stirs among the population.',
                eraContextSentence: 'an era of oil and empire, where ancient Babylon yields black gold.',
                allegianceGroups: [
                    { name: 'Ottoman Empire', type: 'primary', description: 'Nominal sovereign power.' },
                    { name: 'British Empire', type: 'secondary', description: 'Growing influence through oil concessions.' },
                    { name: 'Arab Nationalists', type: 'rebel', description: 'Intellectuals and officers seeking independence.' },
                    { name: 'Kurdish Tribes', type: 'secondary', description: 'Northern groups seeking autonomy.' }
                ],
                structureNames: {
                    fortress: ['Telegraph Fort', 'Oil Field Guard Post'],
                    mill: ['Modern Flour Mill', 'Date Packing Plant'],
                    factory: ['Oil Refinery', 'Railway Workshop'],
                    mining_colony: ['Oil Drilling Site', 'Pipeline Station'],
                    trading_post: ['Railway Terminal', 'Modern Port', 'Oil Company Office']
                },
                courtRoles: {
                    palace: ['Ottoman Vali', 'British Advisor', 'Arab Notable', 'Oil Company Representative']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Republic of Iraq',
                dominantPowerDescription: 'Iraq struggles through monarchy, revolution, dictatorship, and invasion, its oil wealth both blessing and curse as competing forces tear at the ancient land.',
                eraContextSentence: 'an age of oil and blood, where ancient civilizations\' homeland becomes a global battleground.',
                allegianceGroups: [
                    { name: 'Iraqi Government', type: 'primary', description: 'Central authority, varying by period.' },
                    { name: 'Kurdish Parties', type: 'rebel', description: 'Northern groups seeking autonomy or independence.' },
                    { name: 'Shia Opposition', type: 'rebel', description: 'Southern majority often excluded from power.' },
                    { name: 'United States', type: 'secondary', description: 'Superpower with military presence.' }
                ],
                structureNames: {
                    fortress: ['Republican Guard Base', 'Green Zone', 'Coalition Base'],
                    factory: ['Oil Refinery', 'Petrochemical Plant', 'Date Processing Plant'],
                    trading_post: ['Oil Terminal', 'Border Crossing', 'Baghdad International Airport'],
                    holy_site: ['Imam Hussein Shrine', 'Abu Hanifa Mosque', 'Chaldean Cathedral'],
                    palace: ['Presidential Palace', 'Parliament Building']
                },
                courtRoles: {
                    palace: ['President', 'Prime Minister', 'Oil Minister', 'Military Commander']
                }
            },
            "2000s": {
                dominantPower: 'Coalition Provisional Authority',
                dominantPowerDescription: 'Iraq under American occupation struggles with insurgency, sectarian violence, and the challenge of rebuilding after dictatorship.',
                eraContextSentence: 'an age of occupation and insurgency, where ancient hatreds resurface amid foreign intervention.',
                allegianceGroups: [
                    { name: 'Coalition Forces', type: 'primary', description: 'US-led occupation authority.' },
                    { name: 'Iraqi Government', type: 'secondary', description: 'New government with limited authority.' },
                    { name: 'Sunni Insurgents', type: 'rebel', description: 'Former regime elements and jihadists.' },
                    { name: 'Shia Militias', type: 'rebel', description: 'Armed groups backed by Iran.' }
                ],
                structureNames: {
                    fortress: ['Forward Operating Base', 'Checkpoint', 'Blast Wall'],
                    factory: ['Damaged Refinery', 'Reconstruction Project'],
                    trading_post: ['Military Exchange', 'Secured Market', 'Border Point'],
                    palace: ['Green Zone Government Building', 'Provincial Council']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Mesopotamian Water Compact',
                dominantPowerDescription: 'Climate change and upstream dams force Iraq to lead regional cooperation on water management while transitioning beyond oil dependency.',
                eraContextSentence: 'an era of environmental crisis, where the land between two rivers faces the loss of both.',
                allegianceGroups: [
                    { name: 'Iraqi Federal Government', type: 'primary', description: 'Central state managing crisis.' },
                    { name: 'Kurdistan Region', type: 'secondary', description: 'Autonomous area with vital water sources.' },
                    { name: 'Turkey-Iran Water Alliance', type: 'secondary', description: 'Upstream nations controlling river flow.' },
                    { name: 'Climate Refugees', type: 'rebel', description: 'Displaced farmers demanding action.' }
                ],
                structureNames: {
                    fortress: ['Water Defense Installation', 'Climate Monitoring Center'],
                    factory: ['Solar Farm', 'Desalination Plant', 'Drought-Resistant Crop Center'],
                    trading_post: ['Carbon Credit Exchange', 'Regional Water Market'],
                    holy_site: ['Restored Babylon', 'Inter-sect Reconciliation Center']
                }
            }
        },
        "Maghreb": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Roman Africa',
                dominantPowerDescription: 'North Africa flourishes as Rome\'s granary, with prosperous cities dotting the coast while Berber tribes maintain independence in the mountains and desert.',
                eraContextSentence: 'an age of Roman prosperity, where African grain feeds the empire.',
                allegianceGroups: [
                    { name: 'Roman Empire', type: 'primary', description: 'Imperial authority from Rome.' },
                    { name: 'Berber Kingdoms', type: 'secondary', description: 'Indigenous rulers in the interior.' },
                    { name: 'Desert Nomads', type: 'rebel', description: 'Saharan tribes raiding the frontier.' },
                    { name: 'Donatist Christians', type: 'rebel', description: 'North African Christian sect opposing Rome.' }
                ],
                structureNames: {
                    fortress: ['Roman Castrum', 'Limes Fort', 'Coastal Watchtower'],
                    mill: ['Olive Press', 'Grain Mill'],
                    holy_site: ['Temple of Saturn', 'Christian Basilica', 'Berber Shrine'],
                    palace: ["Proconsul's Villa", 'Berber Chief\'s Hall'],
                    trading_post: ['Forum', 'Harbor Market', 'Oasis Trading Post']
                },
                courtRoles: {
                    palace: ['Proconsul', 'Civitas Magistrate', 'Berber King', 'Bishop']
                },
                // Year-specific overrides for the different powers that controlled North Africa during ANTIQUITY
                yearRangeOverrides: [
                    {
                        yearMin: -3000, yearMax: -814,
                        data: {
                            dominantPower: 'Libyan and Berber Tribes',
                            dominantPowerDescription: 'Indigenous Berber and Libyan peoples control North Africa, organized into tribal confederations. Egyptian pharaohs fight endless wars against Libyan raiders from the west.',
                            eraContextSentence: 'an age of tribal peoples, when Libyan warriors threaten Egypt and the coast awaits foreign settlers.',
                            allegianceGroups: [
                                { name: 'Libyan Tribes', type: 'primary', description: 'Indigenous peoples of the coast and mountains.' },
                                { name: 'Egyptian Empire', type: 'rebel', description: 'Eastern power fighting Libyan incursions.' },
                                { name: 'Phoenician Traders', type: 'trade_company', description: 'Early Levantine merchants establishing trading posts.' }
                            ]
                        }
                    },
                    {
                        yearMin: -814, yearMax: -264,
                        data: {
                            dominantPower: 'Carthaginian Empire',
                            dominantPowerDescription: 'Phoenician Carthage rises to dominate the western Mediterranean. From their great city, Carthaginian merchants and admirals build a commercial empire spanning Africa, Spain, and the islands.',
                            eraContextSentence: 'the age of Carthage, when Phoenician ships command the western seas and African silver flows to the great city.',
                            allegianceGroups: [
                                { name: 'Carthage', type: 'primary', description: 'The great Phoenician city-state.' },
                                { name: 'Numidian Kingdoms', type: 'secondary', description: 'Berber cavalry allies and subjects.' },
                                { name: 'Greek Colonies', type: 'rebel', description: 'Rival traders in Sicily and Cyrenaica.' },
                                { name: 'Phoenician Colonies', type: 'secondary', description: 'Allied trading posts across the coast.' }
                            ],
                            courtRoles: {
                                palace: ['Suffetes', 'Council of Elders', 'Sacred Band Commander', 'Admiral', 'Chief Merchant']
                            }
                        }
                    },
                    {
                        yearMin: -264, yearMax: -146,
                        data: {
                            dominantPower: 'Carthaginian Empire (Punic Wars)',
                            dominantPowerDescription: 'Carthage fights for survival against Rome in the Punic Wars. Hannibal crosses the Alps and shakes Roman power, but Rome proves implacable. The final destruction approaches.',
                            eraContextSentence: 'the age of the Punic Wars, when Hannibal threatens Rome and the fate of the Mediterranean hangs in the balance.',
                            allegianceGroups: [
                                { name: 'Carthage', type: 'primary', description: 'The embattled Phoenician power.' },
                                { name: 'Roman Republic', type: 'rebel', description: 'Implacable enemy seeking Carthage\'s destruction.' },
                                { name: 'Numidian Kings', type: 'secondary', description: 'Berber cavalry switching sides between powers.' },
                                { name: 'Iberian Allies', type: 'secondary', description: 'Spanish subjects of Carthaginian Spain.' }
                            ],
                            courtRoles: {
                                palace: ['Suffetes', 'General', 'Admiral', 'Council Elder', 'Mercenary Captain']
                            }
                        }
                    },
                    {
                        yearMin: -146, yearMax: -46,
                        data: {
                            dominantPower: 'Numidian Kingdoms',
                            dominantPowerDescription: 'With Carthage destroyed, Berber Numidia briefly flourishes as Rome\'s ally. Kings like Masinissa and Jugurtha build a wealthy kingdom, until Jugurtha\'s war brings Roman conquest.',
                            eraContextSentence: 'the Numidian age, when Berber kings rule the ruins of Carthage until Rome devours them too.',
                            allegianceGroups: [
                                { name: 'Kingdom of Numidia', type: 'primary', description: 'Berber kingdom allied with then opposing Rome.' },
                                { name: 'Roman Republic', type: 'secondary', description: 'Patron turning into conqueror.' },
                                { name: 'Mauretanian Kingdom', type: 'secondary', description: 'Western Berber realm.' },
                                { name: 'Gaetulian Tribes', type: 'rebel', description: 'Southern nomadic peoples.' }
                            ],
                            courtRoles: {
                                palace: ['King of Numidia', 'Royal Cavalry Commander', 'Chief Elder', 'Roman Advisor']
                            }
                        }
                    },
                    {
                        yearMin: -46, yearMax: 429,
                        data: {
                            dominantPower: 'Roman Africa',
                            dominantPowerDescription: 'North Africa flourishes as Rome\'s granary, with prosperous cities dotting the coast while Berber tribes maintain independence in the mountains and desert.',
                            eraContextSentence: 'an age of Roman prosperity, where African grain feeds the empire.',
                            allegianceGroups: [
                                { name: 'Roman Empire', type: 'primary', description: 'Imperial authority from Rome.' },
                                { name: 'Berber Kingdoms', type: 'secondary', description: 'Indigenous rulers in the interior.' },
                                { name: 'Desert Nomads', type: 'rebel', description: 'Saharan tribes raiding the frontier.' },
                                { name: 'African Christians', type: 'religious', description: 'Growing Christian communities.' }
                            ]
                        }
                    },
                    {
                        yearMin: 429, yearMax: 500,
                        data: {
                            dominantPower: 'Vandal Kingdom',
                            dominantPowerDescription: 'Germanic Vandals cross from Spain to conquer Roman Africa. From Carthage reborn they raid the Mediterranean, even sacking Rome itself, while Berber chiefs regain their independence.',
                            eraContextSentence: 'the Vandal age, when Germanic warriors rule from Carthage and raid the dying Roman world.',
                            allegianceGroups: [
                                { name: 'Vandal Kingdom', type: 'primary', description: 'Germanic rulers based at Carthage.' },
                                { name: 'Roman/Byzantine Empire', type: 'rebel', description: 'Former rulers plotting reconquest.' },
                                { name: 'Berber Chiefs', type: 'secondary', description: 'Independent mountain and desert rulers.' },
                                { name: 'Catholic Church', type: 'rebel', description: 'Persecuted by Arian Vandals.' }
                            ]
                        }
                    }
                ]
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Almoravid Dynasty',
                dominantPowerDescription: 'Berber dynasties unite the Maghreb under Islamic rule, creating powerful empires that stretch from Spain to the Sahel.',
                eraContextSentence: 'an era of Berber power, where desert warriors build empires spanning the Sahara.',
                allegianceGroups: [
                    { name: 'Almoravid Dynasty', type: 'primary', description: 'Berber empire from the Sahara.' },
                    { name: 'Local Arab Tribes', type: 'secondary', description: 'Arab settlers from earlier conquests.' },
                    { name: 'Christian Kingdoms', type: 'rebel', description: 'Iberian powers threatening from the north.' },
                    { name: 'Sub-Saharan Traders', type: 'trade_company', description: 'Gold merchants from Ghana and Mali.' }
                ],
                structureNames: {
                    fortress: ['Kasbah', 'Ribat', 'Mountain Fort'],
                    mill: ['Wind Mill', 'Olive Oil Press'],
                    holy_site: ['Great Mosque', 'Sufi Zawiya', 'Jewish Mellah'],
                    palace: ["Sultan's Palace", "Governor's Dar"],
                    trading_post: ['Souk', 'Funduq', 'Trans-Saharan Terminal']
                },
                courtRoles: {
                    palace: ['Sultan', 'Vizier', 'Qadi', 'Sahib al-Shurta'],
                    holy_site: ['Grand Imam', 'Sufi Master', 'Chief Rabbi']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Barbary States',
                dominantPowerDescription: 'The Maghreb fragments into corsair states nominally under Ottoman suzerainty, profiting from piracy and slavery while maintaining complex relations with European powers.',
                eraContextSentence: 'an era of corsairs and captives, where the Barbary coast terrorizes Christian shipping.',
                allegianceGroups: [
                    { name: 'Barbary Deys', type: 'primary', description: 'Corsair rulers of coastal cities.' },
                    { name: 'Ottoman Empire', type: 'secondary', description: 'Nominal suzerain providing legitimacy.' },
                    { name: 'European Powers', type: 'trade_company', description: 'Nations paying tribute or mounting raids.' },
                    { name: 'Berber Tribes', type: 'rebel', description: 'Interior peoples resisting coastal authority.' }
                ],
                structureNames: {
                    fortress: ['Corsair Harbor Fort', 'Kasbah', 'Slave Prison'],
                    mill: ['Windmill', 'Tidewater Mill'],
                    holy_site: ['Pasha Mosque', 'Marabout Shrine', 'Synagogue'],
                    palace: ["Dey's Palace", "Rais' Mansion"],
                    trading_post: ['Slave Market', 'European Fondouk', 'Corsair Prize Court']
                },
                courtRoles: {
                    palace: ['Dey', 'Rais (Corsair Captain)', 'Agha of Janissaries', 'European Consul']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'French Colonial Empire',
                dominantPowerDescription: 'France conquers and colonizes much of the Maghreb, imposing direct rule while extracting resources and settling European colonists on the best lands.',
                eraContextSentence: 'an era of colonial domination, where French settlers remake ancient lands.',
                allegianceGroups: [
                    { name: 'French Colonial Administration', type: 'primary', description: 'Direct rule from Paris.' },
                    { name: 'Spanish Morocco', type: 'secondary', description: 'Spanish protectorate in the north.' },
                    { name: 'Indigenous Resistance', type: 'rebel', description: 'Various tribal and religious resistance movements.' },
                    { name: 'Italian Libya', type: 'secondary', description: 'Italian colonial venture in the east.' }
                ],
                structureNames: {
                    fortress: ['Foreign Legion Fort', 'Colonial Barracks'],
                    mill: ['Wine Cooperative', 'Colonial Mill'],
                    factory: ['Phosphate Processing', 'Colonial Workshop'],
                    mining_colony: ['Phosphate Mine', 'Iron Ore Extraction'],
                    trading_post: ['Colonial Quarter', 'Railway Station', 'European Market']
                },
                courtRoles: {
                    palace: ['Governor-General', 'Military Commander', 'Colonial Judge', 'Native Affairs Officer']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Independent Nation-States',
                dominantPowerDescription: 'The Maghreb states achieve independence, each pursuing different paths - from socialist experiments to traditional monarchies to military dictatorships.',
                eraContextSentence: 'an age of independence and struggle, where new nations seek their place in the world.',
                allegianceGroups: [
                    { name: 'National Governments', type: 'primary', description: 'Various forms from kingdoms to republics.' },
                    { name: 'Islamist Movements', type: 'rebel', description: 'Religious opposition to secular regimes.' },
                    { name: 'Berber Activists', type: 'rebel', description: 'Indigenous people seeking cultural rights.' },
                    { name: 'European Union', type: 'trade_company', description: 'Major economic partner and migration destination.' }
                ],
                structureNames: {
                    fortress: ['Army Base', 'Border Post'],
                    factory: ['Textile Factory', 'Automotive Assembly Plant', 'Phosphate Refinery'],
                    trading_post: ['Port Terminal', 'Free Trade Zone', 'Tourist Resort'],
                    holy_site: ['National Mosque', 'Independence Monument', 'Ancient Ruins Tourist Site'],
                    palace: ['Royal Palace', 'Presidential Palace']
                },
                courtRoles: {
                    palace: ['King/President', 'Prime Minister', 'Security Chief', 'Economic Planning Minister']
                }
            },
            "1990s": {
                dominantPower: 'Algerian Military Government',
                dominantPowerDescription: 'Algeria descends into civil war between the military government and Islamist insurgents, while neighboring states struggle with their own challenges.',
                eraContextSentence: 'an age of civil conflict, where the dream of independence turns to nightmare.',
                allegianceGroups: [
                    { name: 'Military Government', type: 'primary', description: 'Army-backed regime.' },
                    { name: 'Armed Islamic Group (GIA)', type: 'rebel', description: 'Radical Islamist insurgents.' },
                    { name: 'Islamic Salvation Front (FIS)', type: 'rebel', description: 'Political Islamist movement.' },
                    { name: 'France', type: 'secondary', description: 'Former colonial power providing support.' }
                ],
                structureNames: {
                    fortress: ['Security Checkpoint', 'Fortified Village'],
                    factory: ['Sabotaged Oil Facility', 'Protected Industrial Zone'],
                    trading_post: ['Secured Market', 'Military-Controlled Port']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Maghreb Solar Union',
                dominantPowerDescription: 'The Maghreb nations unite around massive solar energy projects, exporting power to Europe while managing climate migration from the expanding Sahara.',
                eraContextSentence: 'an era of sun and sand, where desert nations power the north.',
                allegianceGroups: [
                    { name: 'Maghreb Solar Union', type: 'primary', description: 'Economic confederation based on energy.' },
                    { name: 'European Energy Buyers', type: 'trade_company', description: 'Major customers for renewable power.' },
                    { name: 'Sahel Climate Refugees', type: 'secondary', description: 'Displaced populations moving north.' },
                    { name: 'Water Rights Activists', type: 'rebel', description: 'Groups fighting over scarce water.' }
                ],
                structureNames: {
                    fortress: ['Solar Farm Security', 'Migration Control Center'],
                    factory: ['Solar Panel Factory', 'Desalination Plant', 'Battery Storage Facility'],
                    trading_post: ['Energy Export Terminal', 'Trans-Mediterranean Cable Station'],
                    holy_site: ['Green Islam Center', 'Climate Adaptation Mosque']
                }
            }
        },
        "Arabian Peninsula": {
            [HistoricalEra.PREHISTORY]: {
                dominantPower: 'Sabaean Kingdom',
                dominantPowerDescription: 'Early Arabian kingdoms controlling the incense trade, with sophisticated irrigation systems and monumental temples in the desert.',
                eraContextSentence: 'an age of incense and myrrh, where camel caravans cross endless sands and the Queen of Sheba rules from her palace.',
                allegianceGroups: [
                    { name: 'Kingdom of Saba', type: 'primary', description: 'Controllers of the incense trade.' },
                    { name: 'Minaean Traders', type: 'secondary', description: 'Northern Arabian merchants.' },
                    { name: 'Bedouin Tribes', type: 'secondary', description: 'Desert nomads and raiders.' }
                ],
                structureNames: {
                    fortress: ['Desert Fort', 'Oasis Tower', 'Mountain Refuge', 'Wadi Stronghold'],
                    quarry: ['Frankincense Grove', 'Salt Flat', 'Date Palm Oasis'],
                    holy_site: ['Moon Temple', 'Sacred Well', 'Rock Sanctuary', 'Pilgrimage Site'],
                    palace: ['Mukarrib Palace', 'Oasis Palace', 'Incense Hall'],
                },
                courtRoles: {
                    palace: ['Mukarrib', 'Priest of Almaqah', 'Caravan Master', 'Water Guardian', 'Scribe']
                }
            },
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Himyarite Kingdom',
                dominantPowerDescription: 'Southern Arabia prospers from the incense trade, while northern tribes maintain independence between the Roman and Persian empires.',
                eraContextSentence: 'an age of frankincense and myrrh, where camel caravans cross endless sands.',
                allegianceGroups: [
                    { name: 'Himyarite Kingdom', type: 'primary', description: 'South Arabian kingdom controlling trade routes.' },
                    { name: 'Nabataean Kingdom', type: 'secondary', description: 'Northern Arab kingdom allied with Rome.' },
                    { name: 'Bedouin Confederations', type: 'secondary', description: 'Nomadic tribes of the interior.' },
                    { name: 'Aksumite Empire', type: 'rebel', description: 'Ethiopian power competing for trade.' }
                ],
                structureNames: {
                    fortress: ['Desert Fort', 'Oasis Tower', 'Mountain Stronghold'],
                    mill: ['Irrigation System', 'Date Press'],
                    holy_site: ['Kaaba', 'Temple of Almaqah', 'Jewish Synagogue'],
                    palace: ["King's Palace", 'Tribal Majlis'],
                    trading_post: ['Incense Market', 'Caravan Station', 'Port of Aden']
                },
                courtRoles: {
                    palace: ['Mukarrib (King)', 'Kabir (Noble)', 'Priest', 'Caravan Master']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Abbasid Caliphate',
                dominantPowerDescription: 'The birthplace of Islam sends pilgrims to Mecca and Medina while various dynasties control different regions, from Yemen to the Gulf.',
                eraContextSentence: 'an era of pilgrimage and piety, where the faithful journey to Islam\'s holy cities.',
                allegianceGroups: [
                    { name: 'Abbasid Caliphate', type: 'primary', description: 'Nominal religious authority from Baghdad.' },
                    { name: 'Local Arab Dynasties', type: 'secondary', description: 'Various emirates and sheikhdoms.' },
                    { name: 'Qarmatians', type: 'rebel', description: 'Radical Ismaili state in eastern Arabia.' },
                    { name: 'Fatimid Caliphate', type: 'rebel', description: 'Rival caliphate competing for influence.' }
                ],
                structureNames: {
                    fortress: ['Desert Citadel', 'Coastal Fort', 'Mountain Castle'],
                    mill: ['Wind Tower', 'Camel Mill'],
                    holy_site: ['Grand Mosque of Mecca', 'Prophet\'s Mosque', 'Sufi Shrine'],
                    palace: ["Sharif's Palace", "Emir's Fort"],
                    trading_post: ['Hajj Waystation', 'Pearl Market', 'Spice Souk']
                },
                courtRoles: {
                    palace: ['Sharif of Mecca', 'Emir', 'Qadi', 'Hajj Administrator'],
                    holy_site: ['Guardian of the Holy Places', 'Chief Imam', 'Muezzin']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Ottoman Empire',
                dominantPowerDescription: 'The Ottomans control the holy cities and the coasts while the interior remains under tribal control, with the first Saudi state rising in Najd.',
                eraContextSentence: 'an era of Ottoman oversight and tribal independence, where Wahhabi reform begins.',
                allegianceGroups: [
                    { name: 'Ottoman Empire', type: 'primary', description: 'Imperial control over holy cities and coasts.' },
                    { name: 'First Saudi State', type: 'rebel', description: 'Wahhabi emirate in central Arabia.' },
                    { name: 'Omani Empire', type: 'secondary', description: 'Maritime power in the southeast.' },
                    { name: 'Yemeni Imams', type: 'secondary', description: 'Zaydi rulers in the mountains.' }
                ],
                structureNames: {
                    fortress: ['Ottoman Fort', 'Tribal Tower', 'Wahhabi Stronghold'],
                    mill: ['Falaj Irrigation', 'Coffee Mill'],
                    holy_site: ['Ottoman Mosque', 'Wahhabi Masjid', 'Zaydi Mosque'],
                    palace: ["Sharif's Residence", "Sheikh's Compound"],
                    trading_post: ['Coffee Port', 'Hajj Caravanserai', 'Pearl Diving Harbor']
                },
                courtRoles: {
                    palace: ['Ottoman Wali', 'Sharif', 'Tribal Sheikh', 'Wahhabi Preacher']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'British Protectorates',
                dominantPowerDescription: 'Britain controls the coasts and protects various emirates while Ibn Saud conquers the interior, just as oil is about to transform everything.',
                eraContextSentence: 'an era of British treaties and Saudi conquest, on the eve of the oil age.',
                allegianceGroups: [
                    { name: 'British Empire', type: 'primary', description: 'Protecting Gulf sheikhdoms and Aden.' },
                    { name: 'Saudi State', type: 'secondary', description: 'Ibn Saud unifying central Arabia.' },
                    { name: 'Hashemite Kingdom', type: 'rebel', description: 'Sharifs of Mecca backed by Britain.' },
                    { name: 'Ottoman Empire', type: 'rebel', description: 'Weakening grip on remaining territories.' }
                ],
                structureNames: {
                    fortress: ['British Residency', 'Ikhwan Settlement', 'Coastal Fort'],
                    mill: ['Date Plantation', 'Modern Well'],
                    trading_post: ['British Agency', 'Arms Market', 'Pilgrim Port'],
                    palace: ["Sheikh's Palace", 'British Political Agent Residence']
                },
                courtRoles: {
                    palace: ['British Resident', 'Sheikh', 'Ibn Saud', 'Tribal Elder']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Saudi Arabia and Gulf States',
                dominantPowerDescription: 'Oil transforms tribal societies into wealthy nations, with Saudi Arabia dominating while smaller Gulf states pursue different development models.',
                eraContextSentence: 'an age of oil and opulence, where desert kingdoms reshape the global economy.',
                allegianceGroups: [
                    { name: 'Kingdom of Saudi Arabia', type: 'primary', description: 'Dominant regional power with vast oil wealth.' },
                    { name: 'Gulf Cooperation Council', type: 'secondary', description: 'Alliance of oil-rich monarchies.' },
                    { name: 'United States', type: 'secondary', description: 'Security guarantor and oil customer.' },
                    { name: 'Iran', type: 'rebel', description: 'Regional rival promoting Shia influence.' }
                ],
                structureNames: {
                    fortress: ['Military City', 'US Air Base', 'Missile Defense Site'],
                    factory: ['Oil Refinery', 'Petrochemical Complex', 'Desalination Plant'],
                    trading_post: ['Oil Terminal', 'Hajj Airport', 'Dubai Free Zone'],
                    holy_site: ['Expanded Grand Mosque', 'Wahhabi University', 'Shia Mosque'],
                    palace: ['Royal Palace', 'Crown Prince Court']
                },
                courtRoles: {
                    palace: ['King', 'Crown Prince', 'Oil Minister', 'Religious Police Chief']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Arabian Economic Federation',
                dominantPowerDescription: 'Post-oil economies focus on technology, renewable energy, and space industries while managing extreme heat and water scarcity.',
                eraContextSentence: 'an era beyond oil, where desert cities reach for the stars.',
                allegianceGroups: [
                    { name: 'Saudi-UAE Tech Alliance', type: 'primary', description: 'Leading powers in economic transformation.' },
                    { name: 'NEOM Megacity', type: 'trade_company', description: 'Autonomous tech zone with own governance.' },
                    { name: 'Traditional Councils', type: 'rebel', description: 'Groups resisting rapid social change.' },
                    { name: 'Climate Haven Seekers', type: 'secondary', description: 'Wealthy refugees from uninhabitable regions.' }
                ],
                structureNames: {
                    fortress: ['Drone Defense Grid', 'Climate Shelter Complex'],
                    factory: ['Solar Gigafactory', 'Hydrogen Plant', 'Space Launch Facility'],
                    trading_post: ['Hyperloop Terminal', 'Virtual Hajj Center', 'Crypto Exchange'],
                    holy_site: ['Climate-Controlled Grand Mosque', 'Interfaith Dialogue Center']
                }
            }
        },
        "Persian Plateau": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Parthian Empire',
                dominantPowerDescription: 'The Parthians rule from Ctesiphon, reviving Persian traditions while serving as Rome\'s greatest eastern rival through cavalry and trade.',
                eraContextSentence: 'an age of mounted nobility, where Parthian shots humble Roman eagles.',
                allegianceGroups: [
                    { name: 'Parthian Empire', type: 'primary', description: 'The Arsacid dynasty and their feudal nobles.' },
                    { name: 'Roman Empire', type: 'rebel', description: 'Western rival seeking eastern expansion.' },
                    { name: 'Kushan Empire', type: 'secondary', description: 'Eastern neighbor controlling the Silk Road.' },
                    { name: 'Armenian Kingdom', type: 'secondary', description: 'Buffer state between the empires.' }
                ],
                structureNames: {
                    fortress: ['Fire Temple Fort', 'Mountain Citadel', 'Frontier Castle'],
                    mill: ['Qanat System', 'Wind Tower'],
                    holy_site: ['Fire Temple', 'Mithraeum', 'Buddhist Stupa'],
                    palace: ['Paradise Garden Palace', "Satrap's Court"],
                    trading_post: ['Silk Road Caravanserai', 'Bazaar', 'Royal Road Station']
                },
                courtRoles: {
                    palace: ['Shahanshah', 'Wuzurg Framadar', 'Spahbed', 'Chief Magus']
                },
                // Year-specific overrides for the different powers that ruled Persia during ANTIQUITY
                yearRangeOverrides: [
                    {
                        yearMin: -3000, yearMax: -678,
                        data: {
                            dominantPower: 'Elamite Kingdoms',
                            dominantPowerDescription: 'Ancient Elam dominates the Iranian plateau, its sophisticated civilization rivaling Mesopotamia. Susa serves as the capital of a kingdom with its own unique script and culture.',
                            eraContextSentence: 'an age before the Persians, when Elamite kings rule from Susa.',
                            allegianceGroups: [
                                { name: 'Kingdom of Elam', type: 'primary', description: 'Ancient civilization of the Iranian highlands.' },
                                { name: 'Mesopotamian Powers', type: 'rebel', description: 'Rival kingdoms to the west.' },
                                { name: 'Mountain Tribes', type: 'secondary', description: 'Iranian peoples of the Zagros.' }
                            ]
                        }
                    },
                    {
                        yearMin: -678, yearMax: -550,
                        data: {
                            dominantPower: 'Median Empire',
                            dominantPowerDescription: 'The Medes, Iranian kinsmen of the Persians, forge the first great Iranian empire. From Ecbatana they overthrow Assyria and dominate the ancient Near East.',
                            eraContextSentence: 'the age of the Medes, when Iranian horsemen first unite the plateau.',
                            allegianceGroups: [
                                { name: 'Median Kingdom', type: 'primary', description: 'The first great Iranian empire.' },
                                { name: 'Persian Tribes', type: 'secondary', description: 'Subject peoples destined to overthrow their overlords.' },
                                { name: 'Babylonian Empire', type: 'secondary', description: 'Ally against Assyria.' },
                                { name: 'Scythian Tribes', type: 'rebel', description: 'Nomadic raiders from the steppes.' }
                            ],
                            courtRoles: {
                                palace: ['King of the Medes', 'Satrap', 'Chief Magus', 'Commander of Cavalry']
                            }
                        }
                    },
                    {
                        yearMin: -550, yearMax: -330,
                        data: {
                            dominantPower: 'Achaemenid Persian Empire',
                            dominantPowerDescription: 'The greatest empire the world has yet seen. Cyrus the Great and his heirs rule from India to Egypt, building the Royal Road, respecting local customs, and calling themselves King of Kings.',
                            eraContextSentence: 'the age of the Great Kings, when Persia rules from the Indus to the Nile.',
                            allegianceGroups: [
                                { name: 'Achaemenid Dynasty', type: 'primary', description: 'The Persian royal house descended from Cyrus.' },
                                { name: 'Satrapies', type: 'secondary', description: 'Provincial governments across the empire.' },
                                { name: 'Greek City-States', type: 'rebel', description: 'Western peoples who resist and then conquer the empire.' },
                                { name: 'Zoroastrian Priesthood', type: 'religious', description: 'Guardians of the sacred fire.' }
                            ],
                            courtRoles: {
                                palace: ['King of Kings', 'Hazarapatis', 'Royal Cupbearer', 'Chief Satrap', 'Commander of the Immortals']
                            }
                        }
                    },
                    {
                        yearMin: -330, yearMax: -247,
                        data: {
                            dominantPower: 'Seleucid Empire',
                            dominantPowerDescription: 'Alexander\'s generals divide his conquests. Seleucus and his heirs rule Persia, founding Greek cities and blending Hellenic and Iranian cultures across the plateau.',
                            eraContextSentence: 'the Hellenistic age, when Macedonian kings rule from Seleucia.',
                            allegianceGroups: [
                                { name: 'Seleucid Kingdom', type: 'primary', description: 'Greek dynasty ruling the eastern realms.' },
                                { name: 'Greek Settlers', type: 'secondary', description: 'Colonists maintaining Hellenic culture.' },
                                { name: 'Iranian Nobility', type: 'secondary', description: 'Persian aristocrats serving new masters.' },
                                { name: 'Parthian Tribes', type: 'rebel', description: 'Iranian nomads gaining strength on the frontier.' }
                            ]
                        }
                    },
                    {
                        yearMin: -247, yearMax: 224,
                        data: {
                            dominantPower: 'Parthian Empire',
                            dominantPowerDescription: 'The Parthians rule from Ctesiphon, reviving Persian traditions while serving as Rome\'s greatest eastern rival through cavalry and trade.',
                            eraContextSentence: 'an age of mounted nobility, where Parthian shots humble Roman eagles.',
                            allegianceGroups: [
                                { name: 'Parthian Empire', type: 'primary', description: 'The Arsacid dynasty and their feudal nobles.' },
                                { name: 'Roman Empire', type: 'rebel', description: 'Western rival seeking eastern expansion.' },
                                { name: 'Kushan Empire', type: 'secondary', description: 'Eastern neighbor controlling the Silk Road.' },
                                { name: 'Armenian Kingdom', type: 'secondary', description: 'Buffer state between the empires.' }
                            ]
                        }
                    },
                    {
                        yearMin: 224, yearMax: 500,
                        data: {
                            dominantPower: 'Sasanian Empire',
                            dominantPowerDescription: 'The Sasanians overthrow the Parthians and revive the glory of ancient Persia. Zoroastrianism becomes the state religion as the empire challenges Rome and Byzantium for mastery of the world.',
                            eraContextSentence: 'the Sasanian restoration, when the King of Kings claims the legacy of Cyrus.',
                            allegianceGroups: [
                                { name: 'Sasanian Empire', type: 'primary', description: 'The new Persian dynasty claiming Achaemenid heritage.' },
                                { name: 'Roman/Byzantine Empire', type: 'rebel', description: 'Western rival in perpetual conflict.' },
                                { name: 'Zoroastrian Church', type: 'religious', description: 'State religion with enormous influence.' },
                                { name: 'Nestorian Christians', type: 'secondary', description: 'Tolerated minority in the eastern provinces.' }
                            ],
                            courtRoles: {
                                palace: ['Shahanshah', 'Wuzurg Framadar', 'Mobadan Mobad', 'Spahbed', 'Royal Chamberlain']
                            }
                        }
                    }
                ]
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Abbasid Caliphate (Persian Influence)',
                dominantPowerDescription: 'Persia becomes the cultural heart of the Islamic world, with Persian administrators, scholars, and poets shaping the caliphate from Baghdad.',
                eraContextSentence: 'an era of Persian renaissance, where ancient wisdom meets Islamic faith.',
                allegianceGroups: [
                    { name: 'Abbasid Caliphate', type: 'primary', description: 'Arab caliphate with Persian administration.' },
                    { name: 'Samanid Dynasty', type: 'secondary', description: 'Persian dynasty reviving national culture.' },
                    { name: 'Buyid Dynasty', type: 'secondary', description: 'Shia Persian military rulers.' },
                    { name: 'Ghaznavid Empire', type: 'rebel', description: 'Turkish dynasty on the eastern frontier.' }
                ],
                structureNames: {
                    fortress: ['Arg (Citadel)', 'Mountain Fort', 'Ribat'],
                    mill: ['Windmill', 'Water Wheel'],
                    holy_site: ['Friday Mosque', 'Imamzadeh Shrine', 'Zoroastrian Tower'],
                    palace: ["Caliph's Palace", "Emir's Garden Palace"],
                    trading_post: ['Grand Bazaar', 'Silk Workshop', 'Caravanserai']
                },
                courtRoles: {
                    palace: ['Caliph', 'Persian Vizier', 'Amir', 'Court Poet'],
                    holy_site: ['Grand Ayatollah', 'Zoroastrian Mobad', 'Sufi Master']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Safavid Empire',
                dominantPowerDescription: 'The Safavids create a powerful Shia state, making Twelver Shiism the official religion while achieving new heights in art and architecture.',
                eraContextSentence: 'an era of Shia power and Persian glory, where Isfahan becomes half the world.',
                allegianceGroups: [
                    { name: 'Safavid Dynasty', type: 'primary', description: 'Shia empire unifying Iran.' },
                    { name: 'Ottoman Empire', type: 'secondary', description: 'Sunni rival to the west.' },
                    { name: 'Mughal Empire', type: 'secondary', description: 'Persian-influenced empire in India.' },
                    { name: 'Qizilbash Tribes', type: 'rising', description: 'Turkish tribal military elite.' }
                ],
                structureNames: {
                    fortress: ['Shah\'s Citadel', 'Border Fort', 'Qizilbash Tower'],
                    mill: ['Silk Workshop', 'Carpet Loom'],
                    holy_site: ['Shah Mosque', 'Imam Reza Shrine', 'Armenian Cathedral'],
                    palace: ['Ali Qapu Palace', 'Garden of Eight Paradises'],
                    trading_post: ['Isfahan Bazaar', 'Silk Road Khan', 'Armenian Quarter']
                },
                courtRoles: {
                    palace: ['Shahanshah', 'Grand Vizier', 'Qurchibashi', 'Court Miniaturist'],
                    holy_site: ['Sadr al-Ulama', 'Armenian Catholicos', 'Jewish Exilarch']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Qajar Dynasty',
                dominantPowerDescription: 'Persia struggles against Russian and British encroachment while attempting modernization, losing territory but maintaining nominal independence.',
                eraContextSentence: 'an era of foreign pressure and faltering reform, as ancient Persia confronts modern imperialism.',
                allegianceGroups: [
                    { name: 'Qajar Dynasty', type: 'primary', description: 'Weakening monarchy caught between powers.' },
                    { name: 'Russian Empire', type: 'secondary', description: 'Northern neighbor taking territory and influence.' },
                    { name: 'British Empire', type: 'secondary', description: 'Southern influence through India and oil interests.' },
                    { name: 'Constitutional Movement', type: 'rebel', description: 'Modernizers seeking parliamentary government.' }
                ],
                structureNames: {
                    fortress: ['Cossack Brigade Barracks', 'Telegraph Fort'],
                    mill: ['Textile Mill', 'Sugar Refinery'],
                    factory: ['Arms Factory', 'Modern Mint'],
                    trading_post: ['Russian Trade Mission', 'British Bank', 'Traditional Bazaar'],
                    palace: ['Golestan Palace', 'Provincial Governor Mansion']
                },
                courtRoles: {
                    palace: ['Shah', 'Grand Vizier', 'Russian Advisor', 'British Advisor']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Islamic Republic of Iran',
                dominantPowerDescription: 'After the Shah\'s modernization and the Islamic Revolution, Iran becomes a theocratic republic challenging Western influence while dealing with sanctions and regional conflicts.',
                eraContextSentence: 'an age of revolution and resistance, where political Islam confronts global powers.',
                allegianceGroups: [
                    { name: 'Islamic Republic', type: 'primary', description: 'Clerical government system.' },
                    { name: 'Revolutionary Guards', type: 'secondary', description: 'Ideological military force.' },
                    { name: 'Reform Movement', type: 'rebel', description: 'Groups seeking democratic change.' },
                    { name: 'Regional Proxies', type: 'secondary', description: 'Shia allies across the Middle East.' }
                ],
                structureNames: {
                    fortress: ['Revolutionary Guard Base', 'Nuclear Facility', 'Missile Site'],
                    factory: ['Petrochemical Plant', 'Arms Factory', 'Pharmaceutical Plant'],
                    trading_post: ['Free Trade Zone', 'Oil Terminal', 'Sanctions-Busting Port'],
                    holy_site: ['Imam Khomeini Shrine', 'Qom Seminary', 'Friday Prayer Ground'],
                    palace: ['Supreme Leader Complex', 'Presidential Palace']
                },
                courtRoles: {
                    palace: ['Supreme Leader', 'President', 'Revolutionary Guard Commander', 'Chief Justice']
                }
            },
            "1950s": {
                dominantPower: 'Pahlavi Dynasty',
                dominantPowerDescription: 'The Shah pursues rapid modernization and westernization with American support after the CIA-backed coup against Mosaddegh.',
                eraContextSentence: 'an age of oil nationalism and foreign intervention, setting the stage for revolution.',
                allegianceGroups: [
                    { name: 'Pahlavi Monarchy', type: 'primary', description: 'Western-aligned modernizing monarchy.' },
                    { name: 'United States', type: 'secondary', description: 'Cold War patron after 1953 coup.' },
                    { name: 'National Front', type: 'rebel', description: 'Nationalist movement of Mosaddegh.' },
                    { name: 'Tudeh Party', type: 'rebel', description: 'Communist party with Soviet ties.' }
                ],
                structureNames: {
                    fortress: ['SAVAK Headquarters', 'US Military Mission'],
                    factory: ['Oil Refinery', 'Steel Mill', 'Assembly Plant'],
                    trading_post: ['Tehran Bazaar', 'Modern Shopping District'],
                    palace: ['Marble Palace', 'Saadabad Complex']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Islamic Republic of Iran',
                dominantPowerDescription: 'Amid climate change and regional crises, Iran leverages its educated population to remain a regional power.',
                eraContextSentence: 'an era of environmental adaptation, where ancient qanat wisdom meets modern technology.',
                allegianceGroups: [
                    { name: 'Federal Government', type: 'primary', description: 'Post-theocratic system balancing regions.' },
                    { name: 'Caspian States Alliance', type: 'secondary', description: 'Regional cooperation on sea level crisis.' },
                    { name: 'Tech Diaspora Network', type: 'trade_company', description: 'Iranian entrepreneurs returning with investment.' },
                    { name: 'Water Rights Movements', type: 'rebel', description: 'Groups fighting over disappearing rivers.' }
                ],
                structureNames: {
                    fortress: ['Cyber Defense Center', 'Climate Monitoring Station'],
                    factory: ['Solar Panel Plant', 'Lithium Extraction Facility', 'Quantum Lab'],
                    trading_post: ['Crypto-Rial Exchange', 'Regional Energy Hub'],
                    holy_site: ['Persepolis Heritage Center', 'Interfaith Council Building']
                }
            }
        },
        "Caucasus": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Armenian Kingdom',
                dominantPowerDescription: 'The Caucasus serves as a mountainous buffer between Rome and Parthia, with ancient kingdoms maintaining precarious independence through diplomacy and fortress walls.',
                eraContextSentence: 'an age of mountain kingdoms, where eagles nest between empires.',
                allegianceGroups: [
                    { name: 'Armenian Kingdom', type: 'primary', description: 'Ancient kingdom playing Rome against Parthia.' },
                    { name: 'Kingdom of Iberia', type: 'secondary', description: 'Georgian kingdom in the central Caucasus.' },
                    { name: 'Albanian Tribes', type: 'secondary', description: 'Diverse peoples of the eastern Caucasus.' },
                    { name: 'Sarmatian Nomads', type: 'rebel', description: 'Steppe raiders from the north.' }
                ],
                structureNames: {
                    fortress: ['Mountain Citadel', 'Gorge Fort', 'Stone Tower'],
                    mill: ['Mountain Stream Mill', 'Wine Press'],
                    holy_site: ['Fire Temple', 'Christian Church', 'Pagan Shrine'],
                    palace: ['Royal Fortress', 'Noble\'s Tower House'],
                    trading_post: ['Mountain Pass Station', 'Valley Market', 'River Port']
                },
                courtRoles: {
                    palace: ['King', 'Sparapet (Commander)', 'Nakharar (Noble)', 'Court Chronicler']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Georgian Golden Age',
                dominantPowerDescription: 'Georgia reaches its zenith under the Bagrationi dynasty, dominating the Caucasus while Armenian and Albanian principalities maintain local power.',
                eraContextSentence: 'an era of mountain glory, where Georgian knights defend Christian kingdoms.',
                allegianceGroups: [
                    { name: 'Kingdom of Georgia', type: 'primary', description: 'Powerful Christian kingdom at its peak.' },
                    { name: 'Armenian Principalities', type: 'secondary', description: 'Noble houses maintaining autonomy.' },
                    { name: 'Seljuk Turks', type: 'rebel', description: 'Muslim invaders from the south.' },
                    { name: 'Byzantine Empire', type: 'secondary', description: 'Christian ally and cultural influence.' }
                ],
                structureNames: {
                    fortress: ['Cliff Monastery', 'Royal Castle', 'Border Tower'],
                    mill: ['Monastery Mill', 'Noble\'s Winery'],
                    holy_site: ['Cathedral', 'Cave Monastery', 'Armenian Apostolic Church'],
                    palace: ['Royal Court', 'Duke\'s Palace'],
                    trading_post: ['Silk Road Station', 'Mountain Fair', 'Wine Market']
                },
                courtRoles: {
                    palace: ['King', 'Atabeg', 'Catholicos', 'Court Poet'],
                    holy_site: ['Patriarch', 'Bishop', 'Abbot']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Persian-Ottoman Battleground',
                dominantPowerDescription: 'The Caucasus becomes a contested frontier between Ottoman and Safavid empires, with local princes switching allegiances to survive.',
                eraContextSentence: 'an era of imperial rivalry, where mountain peoples navigate between Islamic empires.',
                allegianceGroups: [
                    { name: 'Safavid Persia', type: 'primary', description: 'Shia empire controlling eastern areas.' },
                    { name: 'Ottoman Empire', type: 'rebel', description: 'Sunni empire pushing from the west.' },
                    { name: 'Georgian Princes', type: 'secondary', description: 'Divided nobility serving both empires.' },
                    { name: 'Circassian Tribes', type: 'secondary', description: 'Independent mountain peoples.' }
                ],
                structureNames: {
                    fortress: ['Persian Fort', 'Ottoman Kale', 'Prince\'s Stronghold'],
                    mill: ['Silk Workshop', 'Grain Mill'],
                    holy_site: ['Shia Mosque', 'Georgian Church', 'Armenian Monastery'],
                    palace: ['Vali\'s Residence', 'Prince\'s Court'],
                    trading_post: ['Border Market', 'Slave Market', 'Caravan Stop']
                },
                courtRoles: {
                    palace: ['Wali', 'Georgian Prince', 'Persian Governor', 'Ottoman Pasha']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Russian Empire',
                dominantPowerDescription: 'Russia conquers the Caucasus in a series of brutal wars, imposing direct rule while local peoples resist through rebellion and brigandage.',
                eraContextSentence: 'an era of imperial conquest, where Cossacks pacify ancient mountains.',
                allegianceGroups: [
                    { name: 'Russian Empire', type: 'primary', description: 'Expanding southern frontier by force.' },
                    { name: 'Circassian Resistance', type: 'rebel', description: 'Mountain peoples fighting conquest.' },
                    { name: 'Armenian Merchants', type: 'secondary', description: 'Trading class benefiting from Russian rule.' },
                    { name: 'Georgian Nobility', type: 'secondary', description: 'Aristocrats integrated into Russian system.' }
                ],
                structureNames: {
                    fortress: ['Cossack Fort', 'Military Road Checkpoint'],
                    mill: ['Oil Derrick', 'Textile Mill'],
                    factory: ['Weapons Factory', 'Railway Workshop'],
                    mining_colony: ['Copper Mine', 'Oil Field'],
                    trading_post: ['Railway Station', 'Military Supply Depot', 'Bazaar']
                },
                courtRoles: {
                    palace: ['Viceroy', 'Military Governor', 'Orthodox Bishop', 'Secret Police Chief']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Soviet Union/Independent States',
                dominantPowerDescription: 'The Caucasus experiences Soviet rule, then fragments into independent states plagued by ethnic conflicts, frozen wars, and great power competition.',
                eraContextSentence: 'an age of nations and conflicts, where ancient grudges meet modern weapons.',
                allegianceGroups: [
                    { name: 'National Governments', type: 'primary', description: 'Georgia, Armenia, Azerbaijan as independent states.' },
                    { name: 'Russia', type: 'secondary', description: 'Former ruler maintaining influence and bases.' },
                    { name: 'Separatist Regions', type: 'rebel', description: 'Abkhazia, South Ossetia, Nagorno-Karabakh.' },
                    { name: 'Turkey/Iran', type: 'secondary', description: 'Regional powers with ethnic ties.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Peacekeeping Checkpoint', 'Border Fort'],
                    factory: ['Wine Bottling Plant', 'Weapons Factory', 'Hydroelectric Dam'],
                    trading_post: ['Pipeline Terminal', 'Border Crossing', 'Black Sea Port'],
                    holy_site: ['National Cathedral', 'War Memorial', 'Ancient Church'],
                    palace: ['Presidential Palace', 'Parliament Building']
                },
                courtRoles: {
                    palace: ['President', 'Prime Minister', 'Defense Minister', 'Oligarch']
                }
            },
            "1990s": {
                dominantPower: 'Post-Soviet Chaos',
                dominantPowerDescription: 'The newly independent Caucasus states face civil wars, ethnic cleansing, and economic collapse as the Soviet system disintegrates.',
                eraContextSentence: 'an age of breakdown and bloodshed, where neighbors become enemies.',
                allegianceGroups: [
                    { name: 'Nationalist Governments', type: 'primary', description: 'New states asserting independence.' },
                    { name: 'Ethnic Militias', type: 'rebel', description: 'Armed groups fighting for territory.' },
                    { name: 'Russian "Peacekeepers"', type: 'secondary', description: 'Moscow maintaining influence through conflict.' },
                    { name: 'Criminal Networks', type: 'rising', description: 'Mafias filling the power vacuum.' }
                ],
                structureNames: {
                    fortress: ['Militia Checkpoint', 'Refugee Camp', 'Abandoned Soviet Base'],
                    factory: ['Looted Factory', 'Black Market Warehouse'],
                    trading_post: ['Smuggling Route', 'Humanitarian Aid Station']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Caucasus Climate Alliance',
                dominantPowerDescription: 'Climate change forces cooperation as melting glaciers threaten water supplies and all states face environmental catastrophe together.',
                eraContextSentence: 'an era of forced unity, where melting mountains demand peace.',
                allegianceGroups: [
                    { name: 'Caucasus Water Compact', type: 'primary', description: 'Multilateral body managing resources.' },
                    { name: 'China-BRI', type: 'trade_company', description: 'Infrastructure investor and trade partner.' },
                    { name: 'Eco-Nationalist Movements', type: 'rebel', description: 'Groups blaming neighbors for environmental damage.' },
                    { name: 'Tech Corridor Initiative', type: 'secondary', description: 'Attempt to become regional tech hub.' }
                ],
                structureNames: {
                    fortress: ['Climate Monitoring Post', 'Water Defense Installation'],
                    factory: ['Hydroelectric Complex', 'Rare Earth Processing', 'Data Center'],
                    trading_post: ['Digital Silk Road Node', 'Green Energy Exchange'],
                    holy_site: ['Noah\'s Ark Climate Museum', 'Peace Park']
                }
            }
        },
        "Eastern Desert and Red Sea": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Ptolemaic Egypt',
                dominantPowerDescription: 'The Red Sea coast serves Ptolemaic trade with India and Arabia, while desert nomads control the interior and Nubian kingdoms maintain southern independence.',
                eraContextSentence: 'an age of maritime adventure, where Egyptian ships seek Indian spices.',
                allegianceGroups: [
                    { name: 'Ptolemaic Kingdom', type: 'primary', description: 'Greek dynasty ruling from Alexandria.' },
                    { name: 'Kingdom of Kush', type: 'secondary', description: 'Nubian state centered at Meroe.' },
                    { name: 'Blemmyes Nomads', type: 'rebel', description: 'Desert raiders threatening trade routes.' },
                    { name: 'Nabataean Traders', type: 'trade_company', description: 'Arab merchants controlling northern routes.' }
                ],
                structureNames: {
                    fortress: ['Coastal Fort', 'Desert Outpost', 'Mountain Stronghold'],
                    mill: ['Gold Crushing Mill', 'Grain Storage'],
                    holy_site: ['Isis Temple', 'Desert Shrine', 'Nubian Pyramid'],
                    palace: ['Governor\'s Residence', 'Kushite Palace'],
                    trading_post: ['Myos Hormos', 'Berenice Port', 'Desert Way Station']
                },
                courtRoles: {
                    palace: ['Strategos', 'Epistrategos', 'Nubian Qore', 'Harbor Master']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Fatimid Caliphate',
                dominantPowerDescription: 'The Red Sea becomes a vital link for Islamic trade and pilgrimage, with various Muslim dynasties controlling the African coast.',
                eraContextSentence: 'an era of faith and commerce, where pilgrims and merchants share the sacred routes.',
                allegianceGroups: [
                    { name: 'Fatimid Caliphate', type: 'primary', description: 'Shia dynasty controlling Egypt and Hijaz.' },
                    { name: 'Beja Kingdoms', type: 'secondary', description: 'Islamized nomadic confederations.' },
                    { name: 'Ethiopian Empire', type: 'rebel', description: 'Christian kingdom across the sea.' },
                    { name: 'Yemeni Dynasties', type: 'secondary', description: 'Powers controlling the Arabian shore.' }
                ],
                structureNames: {
                    fortress: ['Ribat', 'Coastal Tower', 'Mountain Refuge'],
                    mill: ['Wind Catcher', 'Camel Mill'],
                    holy_site: ['Mosque', 'Sufi Tomb', 'Coptic Monastery'],
                    palace: ['Emir\'s Fort', 'Governor\'s Compound'],
                    trading_post: ['Aydhab Port', 'Hajj Station', 'Spice Market']
                },
                courtRoles: {
                    palace: ['Wali', 'Beja King', 'Port Administrator', 'Hajj Protector']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Ottoman Empire',
                dominantPowerDescription: 'The Ottomans control the Red Sea to protect the holy cities and Indian Ocean trade from Portuguese encroachment, while local rulers maintain autonomy.',
                eraContextSentence: 'an era of gunpowder and galleys, where Ottoman fleets guard Muslim waters.',
                allegianceGroups: [
                    { name: 'Ottoman Empire', type: 'primary', description: 'Imperial navy protecting Islamic trade.' },
                    { name: 'Funj Sultanate', type: 'secondary', description: 'Muslim kingdom in Sudan.' },
                    { name: 'Portuguese Empire', type: 'rebel', description: 'Christian intruders seeking trade dominance.' },
                    { name: 'Bedouin Confederations', type: 'secondary', description: 'Desert tribes controlling land routes.' }
                ],
                structureNames: {
                    fortress: ['Ottoman Naval Base', 'Coastal Battery', 'Desert Fort'],
                    mill: ['Coffee Processing', 'Dhow Shipyard'],
                    holy_site: ['Ottoman Mosque', 'Saint\'s Tomb', 'Coptic Church'],
                    palace: ['Pasha\'s Residence', 'Sultan\'s Palace'],
                    trading_post: ['Suakin Port', 'Coffee Warehouse', 'Slave Market']
                },
                courtRoles: {
                    palace: ['Ottoman Admiral', 'Funj Sultan', 'Sharif', 'Portuguese Factor']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'British/Egyptian Control',
                dominantPowerDescription: 'The Suez Canal transforms the region into a vital imperial artery, while European powers compete for influence along the African coast.',
                eraContextSentence: 'an era of steam and strategy, where the canal shortens empires.',
                allegianceGroups: [
                    { name: 'British Empire', type: 'primary', description: 'Controlling Suez and Red Sea routes.' },
                    { name: 'Khedivate of Egypt', type: 'secondary', description: 'Nominal authority under British influence.' },
                    { name: 'Mahdist State', type: 'rebel', description: 'Islamic revival movement in Sudan.' },
                    { name: 'Italian Eritrea', type: 'secondary', description: 'New colonial presence on African shore.' }
                ],
                structureNames: {
                    fortress: ['Canal Defense', 'Coaling Station', 'Telegraph Post'],
                    mill: ['Cotton Gin', 'Salt Works'],
                    factory: ['Canal Workshop', 'Railway Depot'],
                    trading_post: ['Port Sudan', 'Suez Terminal', 'Aden Refueling Base'],
                    palace: ['Governor\'s House', 'Residency']
                },
                courtRoles: {
                    palace: ['British Commissioner', 'Egyptian Governor', 'Naval Commander', 'Canal Administrator']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Egypt/Saudi Arabia',
                dominantPowerDescription: 'The Red Sea becomes a flashpoint for regional rivalries, piracy, and proxy conflicts while maintaining its role as a crucial shipping lane.',
                eraContextSentence: 'an age of oil tankers and tensions, where ancient waters bear modern conflicts.',
                allegianceGroups: [
                    { name: 'Egyptian Navy', type: 'primary', description: 'Protecting Suez revenues and territory.' },
                    { name: 'Saudi Arabia', type: 'secondary', description: 'Controlling holy sites and oil routes.' },
                    { name: 'Somali Pirates', type: 'rebel', description: 'Modern raiders threatening shipping.' },
                    { name: 'Israel', type: 'rebel', description: 'Red Sea access through Eilat.' }
                ],
                structureNames: {
                    fortress: ['Naval Base', 'Radar Station', 'Anti-Ship Missile Battery'],
                    factory: ['Desalination Plant', 'Port Facility', 'Tourism Complex'],
                    trading_post: ['Container Terminal', 'Free Zone', 'Diving Resort'],
                    holy_site: ['Saint Catherine\'s Monastery', 'Modern Mosque'],
                    palace: ['Military Command Center', 'Governor\'s Office']
                },
                courtRoles: {
                    palace: ['Admiral', 'Intelligence Chief', 'Port Authority Director', 'Tourism Minister']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Egypt/Saudi Arabia',
                dominantPowerDescription: 'Climate change and technological advancement create new dynamics as automated shipping and underwater cities emerge while traditional states struggle with heat and water.',
                eraContextSentence: 'an era of extreme heat and innovation, where ancient trade routes go digital.',
                allegianceGroups: [
                    { name: 'Suez Smart Canal Authority', type: 'primary', description: 'AI-managed waterway corporation.' },
                    { name: 'NEOM Maritime', type: 'trade_company', description: 'Saudi megaproject controlling northern waters.' },
                    { name: 'Climate Pirates', type: 'rebel', description: 'Desperate groups hijacking water shipments.' },
                    
                ],
                structureNames: {
                    fortress: ['Drone Port Defense', 'Climate Bunker'],
                    factory: ['Floating Solar Farm', 'Underwater Mining Rig', 'Automated Port'],
                    trading_post: ['Digital Transit Hub', 'Hyperloop Terminal'],
                    holy_site: ['Virtual Pilgrimage Center', 'Climate Memorial']
                }
            }
        },
        "Hejaz Mountains": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Quraysh Tribe',
                dominantPowerDescription: 'The merchant tribe controlling Mecca and the lucrative caravan trade between Yemen and Syria.',
                eraContextSentence: 'an age of tribal alliances and caravan trade, where the Kaaba draws pilgrims from across Arabia.',
                allegianceGroups: [
                    { name: 'Quraysh Tribe', type: 'primary', description: 'The ruling merchant tribe of Mecca.' },
                    { name: 'Bedouin Tribes', type: 'secondary', description: 'Nomadic tribes of the desert.' },
                    { name: 'Yemeni Traders', type: 'secondary', description: 'Merchants from the prosperous south.' }
                ],
                structureNames: {
                    fortress: ['Tribal Fortress'],
                    holy_site: ['The Kaaba', 'Sacred Well of Zamzam'],
                    trading_post: ['Caravan Station']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Abbasid Caliphate',
                dominantPowerDescription: 'The Islamic empire controlling the holy cities and the pilgrimage routes.',
                eraContextSentence: 'an age of Islamic glory, where the hajj brings believers from Cordoba to Samarkand.',
                allegianceGroups: [
                    { name: 'Abbasid Caliphate', type: 'primary', description: 'The ruling Islamic dynasty.' },
                    { name: 'Sharifs of Mecca', type: 'secondary', description: 'Descendants of the Prophet governing the holy city.' },
                    { name: 'Pilgrim Caravans', type: 'secondary', description: 'Protected convoys of the faithful.' }
                ],
                structureNames: {
                    fortress: ['Citadel'],
                    holy_site: ['Grand Mosque', 'Prophet\'s Mosque'],
                    palace: ['Sharif\'s Palace']
                },
                courtRoles: {
                    palace: ['Sharif', 'Qadi', 'Captain of Guards', 'Keeper of the Kaaba']
                }
            }
        },
        "Khuzestan Plain": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Sassanid Empire',
                dominantPowerDescription: 'The Persian empire with its ancient capital at Ctesiphon nearby.',
                eraContextSentence: 'an age of Persian grandeur, where fire temples illuminate the ancient plains.',
                allegianceGroups: [
                    { name: 'Sassanid Empire', type: 'primary', description: 'The Persian imperial dynasty.' },
                    { name: 'Arab Tribes', type: 'secondary', description: 'Desert peoples on the western frontier.' },
                    { name: 'Mesopotamian Merchants', type: 'secondary', description: 'Traders from the river valleys.' }
                ],
                structureNames: {
                    fortress: ['Persian Fortress'],
                    palace: ['Satrap\'s Palace'],
                    holy_site: ['Fire Temple']
                }
            }
        },
        "Khorasan": {
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Samanid Empire',
                dominantPowerDescription: 'A Persian dynasty fostering Islamic learning and Persian culture.',
                eraContextSentence: 'an age of Persian renaissance, where scholars and poets flourish under enlightened rule.',
                allegianceGroups: [
                    { name: 'Samanid Empire', type: 'primary', description: 'The ruling Persian dynasty.' },
                    { name: 'Turkic Mercenaries', type: 'secondary', description: 'Nomadic warriors in imperial service.' },
                    { name: 'Silk Road Merchants', type: 'secondary', description: 'Traders on the great eastern route.' }
                ],
                structureNames: {
                    fortress: ['Citadel'],
                    trading_post: ['Caravanserai'],
                    palace: ['Emir\'s Palace']
                }
            }
        },
        "Transoxiana": {
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Khwarazmian Empire',
                dominantPowerDescription: 'A powerful Central Asian empire controlling the Silk Road trade.',
                eraContextSentence: 'an age of prosperity along the Silk Road, before the Mongol storm.',
                allegianceGroups: [
                    { name: 'Khwarazmian Empire', type: 'primary', description: 'The ruling dynasty.' },
                    { name: 'Silk Road Merchants', type: 'secondary', description: 'International traders.' },
                    { name: 'Turkic Nomads', type: 'secondary', description: 'Steppe peoples.' }
                ],
                structureNames: {
                    fortress: ['Fortified City'],
                    trading_post: ['Great Bazaar'],
                    palace: ['Shah\'s Palace']
                }
            }
        },
        "Nubian Corridor": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Kingdom of Kush',
                dominantPowerDescription: 'The ancient Nubian kingdom controls the gold mines and trade routes between Egypt and sub-Saharan Africa, occasionally conquering Egypt itself.',
                eraContextSentence: 'the land of black pharaohs, where Nubian kings rule from Meroe with wealth from gold and ivory.',
                allegianceGroups: [
                    { name: 'Kingdom of Kush', type: 'primary', description: 'The Nubian royal dynasty at Meroe.' },
                    { name: 'Egyptian Priests', type: 'secondary', description: 'Temple hierarchies maintaining ancient traditions.' },
                    { name: 'Desert Nomads', type: 'secondary', description: 'Blemmyes and other desert peoples.' },
                    { name: 'Axumite Traders', type: 'trade_company', description: 'Ethiopian merchants from the south.' }
                ],
                structureNames: {
                    fortress: ['Nubian Fortress', 'Desert Fort', 'Nile Stronghold'],
                    holy_site: ['Temple of Amun', 'Royal Pyramid', 'Desert Shrine'],
                    palace: ['Candace\'s Palace', 'Royal Complex', 'Governor\'s Residence'],
                    trading_post: ['Gold Market', 'Ivory Exchange', 'Slave Market'],
                    quarry: ['Gold Mine', 'Granite Quarry', 'Emerald Mine']
                },
                courtRoles: {
                    palace: ['Candace (Queen Mother)', 'Paqar (Prince)', 'High Priest of Amun', 'Royal Scribe', 'Commander of Bowmen']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Makurian Kingdom',
                dominantPowerDescription: 'Christian Nubia maintains independence between Islamic Egypt and Ethiopia, with sophisticated administration and monumental churches.',
                eraContextSentence: 'the African kingdom of the cross, where Christian kings resist Islamic expansion for centuries.',
                allegianceGroups: [
                    { name: 'Kingdom of Makuria', type: 'primary', description: 'The Christian Nubian state.' },
                    { name: 'Coptic Church', type: 'secondary', description: 'The Christian hierarchy.' },
                    { name: 'Fatimid Caliphate', type: 'secondary', description: 'Muslim rulers to the north.' },
                    { name: 'Beja Tribes', type: 'rebel', description: 'Nomadic peoples of the Eastern Desert.' }
                ],
                structureNames: {
                    fortress: ['Castle of Dongola', 'Border Fort', 'Monastery Fortress'],
                    holy_site: ['Cathedral of Faras', 'Rock Church', 'Coptic Monastery', 'Desert Hermitage'],
                    palace: ['King\'s Palace', 'Eparch\'s Residence', 'Bishop\'s Palace'],
                    trading_post: ['Nile Port', 'Caravan Station', 'Market Square']
                },
                courtRoles: {
                    palace: ['King of Makuria', 'Eparch of Nobadia', 'Great Scribe', 'Lord of the Horse', 'Keeper of the Royal Seal']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Funj Sultanate',
                dominantPowerDescription: 'An Islamic kingdom controls the Blue Nile region, blending Arab and African traditions in a unique Sudanese culture.',
                eraContextSentence: 'the age of the Black Sultanate, where African Muslim kings rule from Sennar.',
                allegianceGroups: [
                    { name: 'Funj Sultanate', type: 'primary', description: 'The ruling dynasty at Sennar.' },
                    { name: 'Arab Tribes', type: 'secondary', description: 'Nomadic groups claiming descent from Arabia.' },
                    { name: 'Ottoman Egypt', type: 'secondary', description: 'The northern neighbor seeking expansion.' },
                    { name: 'Ethiopian Empire', type: 'secondary', description: 'Christian power to the southeast.' }
                ],
                structureNames: {
                    fortress: ['Sultan\'s Fort', 'River Fortress', 'Tribal Stronghold'],
                    holy_site: ['Grand Mosque', 'Sufi Lodge', 'Saint\'s Tomb', 'Quranic School'],
                    palace: ['Sultan\'s Palace', 'Governor\'s Compound', 'Sheikh\'s Manor'],
                    trading_post: ['Slave Market', 'Gold Exchange', 'Gum Arabic Market']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Anglo-Egyptian Sudan',
                dominantPowerDescription: 'After the Mahdist revolt, British and Egyptian forces jointly control Sudan, exploiting its resources while suppressing resistance.',
                eraContextSentence: 'the age of empire on the Nile, where Gordon\'s death at Khartoum symbolizes colonial ambitions and African resistance.',
                allegianceGroups: [
                    { name: 'Anglo-Egyptian Administration', type: 'primary', description: 'The colonial condominium government.' },
                    { name: 'Mahdist Remnants', type: 'rebel', description: 'Islamic resistance fighters.' },
                    { name: 'Tribal Chiefs', type: 'secondary', description: 'Traditional leaders co-opted by colonialism.' },
                    { name: 'Egyptian Bureaucrats', type: 'secondary', description: 'Administrative class from Cairo.' }
                ],
                structureNames: {
                    fortress: ['British Garrison', 'River Fort', 'Desert Outpost'],
                    factory: ['Cotton Gin', 'Railway Workshop', 'Gum Processing Plant'],
                    trading_post: ['Railway Station', 'Steamboat Port', 'Cotton Exchange'],
                    palace: ['Governor-General\'s Palace', 'District Commissioner\'s House']
                },
                mapAreaOverrides: {
                    "Khartoum": {
                        dominantPower: 'Mahdist State',
                        dominantPowerDescription: 'The Mahdi\'s revolutionary Islamic state controls Sudan after destroying Egyptian rule, until British reconquest.',
                        allegianceGroups: [
                            { name: 'Mahdist State', type: 'primary', description: 'The Mahdi\'s theocratic government.' },
                            { name: 'Ansar Warriors', type: 'secondary', description: 'Religious warriors of the Mahdi.' },
                            { name: 'British Forces', type: 'secondary', description: 'Preparing reconquest from Egypt.' }
                        ]
                    }
                }
            },
            [HistoricalEra.MODERN_ERA]: {
                dominantPower: 'Republic of Sudan',
                dominantPowerDescription: 'Independent Sudan struggles with civil war between Arab-dominated north and African south, before South Sudan\'s secession.',
                eraContextSentence: 'a fractured nation, where ethnic and religious divisions fuel Africa\'s longest civil war.',
                allegianceGroups: [
                    { name: 'Sudanese Government', type: 'primary', description: 'The Khartoum-based regime.' },
                    { name: 'SPLA/South Sudan', type: 'rebel', description: 'Southern rebels seeking independence.' },
                    { name: 'Darfur Rebels', type: 'rebel', description: 'Western groups fighting marginalization.' },
                    { name: 'Arab League', type: 'secondary', description: 'Regional bloc Sudan belongs to.' }
                ],
                structureNames: {
                    fortress: ['Army Base', 'Paramilitary Camp', 'UN Compound'],
                    factory: ['Oil Refinery', 'Sugar Plant', 'Textile Factory'],
                    trading_post: ['Oil Pipeline Terminal', 'Airport', 'River Port'],
                    mining_colony: ['Oil Field', 'Gold Mine', 'Gum Arabic Plantation']
                }
            }
        }
    }
};