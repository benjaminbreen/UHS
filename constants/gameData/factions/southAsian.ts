/**
 * constants/gameData/factions/southAsian.ts
 * Faction data for South Asian cultural zones.
 */
import { HistoricalEra } from '../../../types';
import { FactionFile } from './types';

const MODERN_ERA = 'MODERN_ERA';

export const SOUTH_ASIAN_FACTIONS: FactionFile = {
    'SOUTH_ASIAN': {
        "Indus Valley": {
            [HistoricalEra.PREHISTORY]: {
                dominantPower: 'Harappan Civilization',
                dominantPowerDescription: 'One of the world\'s earliest urban civilizations flourishes with planned cities, sophisticated drainage systems, and extensive trade networks.',
                eraContextSentence: 'an age of urban planning, where the Indus cities showcase humanity\'s first great civic engineering.',
                allegianceGroups: [
                    { name: 'Harappan City-States', type: 'primary', description: 'Major urban centers like Harappa and Mohenjo-daro.' },
                    { name: 'Mesopotamian Traders', type: 'trade_company', description: 'Long-distance merchants from Sumer.' },
                    { name: 'Baluchistan Peoples', type: 'secondary', description: 'Highland communities to the west.' },
                    { name: 'Gujarat Settlements', type: 'secondary', description: 'Coastal trading communities.' }
                ],
                structureNames: {
                    fortress: ['Citadel', 'City Walls'],
                    mill: ['Granary', 'Craft Workshop'],
                    holy_site: ['Great Bath', 'Fire Altar'],
                    palace: ['Assembly Hall'],
                    trading_post: ['Dockyard', 'Caravan Stop']
                },
                courtRoles: {
                    palace: ['City Administrator', 'Chief Merchant', 'Water Engineer']
                }
            },
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Vedic Kingdoms',
                dominantPowerDescription: 'Indo-Aryan kingdoms establish the foundations of Hindu civilization, composing the Vedas and epic literature.',
                eraContextSentence: 'the age of the Mahabharata, where dharma guides kings and great sages compose eternal truths.',
                allegianceGroups: [
                    { name: 'Kuru Kingdom', type: 'primary', description: 'Center of Vedic culture.' },
                    { name: 'Panchala', type: 'secondary', description: 'Allied kingdom of scholars.' },
                    { name: 'Gandhara', type: 'secondary', description: 'Northwestern kingdom with Persian ties.' }
                ],
                structureNames: {
                    fortress: ['Raja Fort', 'River Citadel'],
                    holy_site: ['Vedic Fire Altar', 'Ashram', 'Sacred Grove'],
                    palace: ['Raja Sabha', 'Royal Court'],
                },
                courtRoles: {
                    palace: ['Raja', 'Purohit', 'Senapati', 'Court Poet']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Chalukya-Rashtrakuta Dynasties',
                dominantPowerDescription: 'Powerful Deccan empires patronize architecture and literature while competing with both northern and southern Indian powers.',
                eraContextSentence: 'an age of architectural marvels, where rock-cut temples reach new heights of artistry.',
                allegianceGroups: [
                    { name: 'Chalukya Empire', type: 'primary', description: 'Dynasty controlling western Deccan.' },
                    { name: 'Rashtrakuta Empire', type: 'primary', description: 'Successors expanding across India.' },
                    { name: 'Kakatiya Kingdom', type: 'secondary', description: 'Eastern Deccan power.' },
                    { name: 'Hoysala Kingdom', type: 'secondary', description: 'Southern Deccan dynasty.' }
                ],
                structureNames: {
                    fortress: ['Daulatabad Fort', 'Hill Citadel'],
                    mill: ['Step Well', 'Weaving Center'],
                    holy_site: ['Ellora Caves', 'Chalukya Temple', 'Jain Basadi'],
                    palace: ['Royal Durbar', 'Queen\'s Palace'],
                    trading_post: ['Diamond Market', 'Silk Bazaar']
                },
                courtRoles: {
                    palace: ['Chakravartin', 'Mahasandhivigrahika', 'Dandanayaka', 'Mahakavi']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Deccan Sultanates',
                dominantPowerDescription: 'Five Muslim sultanates dominate the Deccan after breaking from the Bahmani Sultanate, creating a unique Indo-Islamic culture.',
                eraContextSentence: 'an era of sultanate splendor, where Persianate culture flourishes in the Deccan.',
                allegianceGroups: [
                    { name: 'Bijapur Sultanate', type: 'primary', description: 'Powerful Adil Shahi dynasty.' },
                    { name: 'Golconda Sultanate', type: 'primary', description: 'Qutb Shahi rulers of diamond mines.' },
                    { name: 'Ahmadnagar Sultanate', type: 'secondary', description: 'Nizam Shahi dynasty.' },
                    { name: 'Maratha Confederacy', type: 'rebel', description: 'Hindu revival under Shivaji.' }
                ],
                structureNames: {
                    fortress: ['Golconda Fort', 'Bijapur Citadel'],
                    mill: ['Diamond Workshop', 'Bidri Craft Center'],
                    holy_site: ['Gol Gumbaz', 'Charminar', 'Hindu Temple'],
                    palace: ['Sultan\'s Palace', 'Char Bagh Garden'],
                    trading_post: ['Diamond Bazaar', 'Persian Merchants Quarter']
                },
                courtRoles: {
                    palace: ['Sultan', 'Peshwa', 'Mir Jumla', 'Malik-ut-Tujjar']
                },
                mapAreaOverrides: {
                    "Hyderabad Region": {
                        dominantPower: 'Golconda Sultanate',
                        dominantPowerDescription: 'The Qutb Shahi dynasty controls the world\'s diamond mines while building architectural marvels.',
                        allegianceGroups: [
                            { name: 'Golconda Sultanate', type: 'primary', description: 'Wealthy dynasty from diamond trade.' },
                            { name: 'Diamond Merchants', type: 'trade_company', description: 'International gem traders.' },
                            { name: 'Telugu Warriors', type: 'secondary', description: 'Local military elites.' }
                        ]
                    }
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Princely States under British Paramountcy',
                dominantPowerDescription: 'The Nizam of Hyderabad becomes the world\'s richest man while other Deccan states maintain nominal independence under British oversight.',
                eraContextSentence: 'an era of princely opulence, where maharajas and nizams rule under British protection.',
                allegianceGroups: [
                    { name: 'Hyderabad State', type: 'primary', description: 'Largest princely state under the Nizam.' },
                    { name: 'Mysore Kingdom', type: 'secondary', description: 'Progressive Hindu kingdom.' },
                    { name: 'British Residents', type: 'secondary', description: 'Colonial advisors controlling policy.' },
                    { name: 'Telangana Peasants', type: 'rebel', description: 'Rural movements against feudalism.' }
                ],
                structureNames: {
                    fortress: ['Nizam\'s Army Base', 'British Residency'],
                    mill: ['Cotton Ginning Factory', 'Silk Mill'],
                    factory: ['Railway Workshop', 'Textile Mill'],
                    mining_colony: ['Coal Mine', 'Iron Ore Mine'],
                    trading_post: ['Princely State Capital', 'British Cantonment'],
                    palace: ['Falaknuma Palace', 'Mysore Palace']
                },
                courtRoles: {
                    palace: ['Nizam/Maharaja', 'Diwan', 'British Resident', 'State Forces Commander']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Republic of India',
                dominantPowerDescription: 'The Deccan becomes India\'s IT hub with Bangalore and Hyderabad leading technological transformation while rural areas lag behind.',
                eraContextSentence: 'an era of silicon dreams, where ancient kingdoms transform into cyber cities.',
                allegianceGroups: [
                    { name: 'Indian State Governments', type: 'primary', description: 'Karnataka, Telangana, Maharashtra administrations.' },
                    { name: 'IT Corporations', type: 'trade_company', description: 'Global tech companies and Indian giants.' },
                    { name: 'Farmer Movements', type: 'rebel', description: 'Agrarian crisis and suicide epidemic.' },
                    { name: 'Real Estate Mafia', type: 'secondary', description: 'Land grab syndicates.' }
                ],
                structureNames: {
                    fortress: ['Military Station', 'Police Commissionerate'],
                    factory: ['IT Campus', 'Biotech Park', 'Aerospace Complex'],
                    trading_post: ['Tech Hub', 'International Airport', 'SEZ'],
                    holy_site: ['Tirupati Balaji', 'Shirdi Sai Baba', 'Mega Church'],
                    palace: ['State Assembly', 'Raj Bhavan']
                },
                courtRoles: {
                    palace: ['Chief Minister', 'Governor', 'IT Secretary', 'Police Commissioner']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Republic of India',
                dominantPowerDescription: 'The Deccan leads India\'s space and defense technology while managing severe water crisis and urban sprawl in megacities.',
                eraContextSentence: 'an era of rockets and drought, where high-tech cities face water wars.',
                allegianceGroups: [
                    { name: 'Indian State Governments', type: 'primary', description: 'Competing states fighting over river water.' },
                    { name: 'Space & Defense Industry', type: 'trade_company', description: 'ISRO and private space companies.' },
                    { name: 'Water Mafias', type: 'rebel', description: 'Criminal networks controlling water supply.' },
                    { name: 'Chinese Tech Investors', type: 'trade_company', description: 'Despite restrictions, maintaining presence.' }
                ],
                structureNames: {
                    fortress: ['Space Command Center', 'Drone Base'],
                    factory: ['Satellite Manufacturing', 'Defense Electronics Hub', 'AI Research Center'],
                    trading_post: ['Spaceport', 'Hyperloop Terminal', 'Crypto Exchange'],
                    mining_colony: ['Rare Earth Urban Mining', 'Solar Farm Complex'],
                    holy_site: ['Water Conservation Temple', 'Tech Ashram']
                }
            }
        },
        "Bengal and Northeast": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Mahajanapadas and Tribes',
                dominantPowerDescription: 'Ancient kingdoms and tribal confederations control the fertile Ganges delta and forested hills, developing early urban centers.',
                eraContextSentence: 'an age of river kingdoms, where the Ganges delta nurtures early civilizations.',
                allegianceGroups: [
                    { name: 'Anga Kingdom', type: 'primary', description: 'Major kingdom on the Ganges.' },
                    { name: 'Pundra Kingdom', type: 'secondary', description: 'Ancient Bengali state.' },
                    { name: 'Kirata Tribes', type: 'secondary', description: 'Hill peoples of the northeast.' },
                    { name: 'Kalinga Traders', type: 'trade_company', description: 'Coastal merchants.' }
                ],
                structureNames: {
                    fortress: ['River Fort', 'Mud Wall City'],
                    mill: ['Rice Paddy', 'Fishing Village'],
                    holy_site: ['River Goddess Temple', 'Buddhist Vihara', 'Tribal Sacred Grove'],
                    palace: ['Raja\'s Court'],
                    trading_post: ['River Port', 'Forest Product Market']
                },
                courtRoles: {
                    palace: ['Raja', 'Senapati', 'Purohita', 'Bhandagarika']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Pala Empire',
                dominantPowerDescription: 'Buddhist empire controls Bengal and Bihar, patronizing learning at Nalanda while maintaining extensive trade networks.',
                eraContextSentence: 'an age of Buddhist learning, where Bengal supports the world\'s great universities.',
                allegianceGroups: [
                    { name: 'Pala Dynasty', type: 'primary', description: 'Buddhist imperial dynasty.' },
                    { name: 'Sena Dynasty', type: 'secondary', description: 'Hindu successors from Karnataka.' },
                    { name: 'Kamarupa Kingdom', type: 'secondary', description: 'Assamese power.' },
                    { name: 'Tibetan Empire', type: 'secondary', description: 'Northern Buddhist connections.' }
                ],
                structureNames: {
                    fortress: ['Fortified Monastery', 'River Citadel'],
                    mill: ['Royal Tank', 'Silk Workshop'],
                    holy_site: ['Nalanda University', 'Somapura Mahavihara', 'Kamakhya Temple'],
                    palace: ['Pala Palace', 'Vikramshila Complex'],
                    trading_post: ['Tamralipta Port', 'Silk Road Connection']
                },
                courtRoles: {
                    palace: ['Maharajadhiraja', 'Mahasamanta', 'Mahasenapati', 'Dharmadhyaksha'],
                    holy_site: ['Mahaacharya', 'Upadhyaya', 'Temple Devadasi']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Mughal Bengal',
                dominantPowerDescription: 'Bengal becomes the wealthiest Mughal province, "Paradise of Nations," with thriving textile industry and maritime trade.',
                eraContextSentence: 'an era of golden Bengal, where Mughal wealth flows from deltaic abundance.',
                allegianceGroups: [
                    { name: 'Mughal Subah of Bengal', type: 'primary', description: 'Provincial government under nawabs.' },
                    { name: 'European Trading Companies', type: 'trade_company', description: 'Portuguese, Dutch, French, English competing.' },
                    { name: 'Ahom Kingdom', type: 'secondary', description: 'Independent Assamese state.' },
                    { name: 'Arakanese Pirates', type: 'mercenary', description: 'Magh raiders from Burma.' }
                ],
                structureNames: {
                    fortress: ['Nawabi Fort', 'European Factory Fort'],
                    mill: ['Muslin Workshop', 'Silk Karkhanah'],
                    holy_site: ['Grand Mosque', 'Kali Temple', 'Church'],
                    palace: ['Nawab\'s Palace', 'Zamindar Rajbari'],
                    trading_post: ['European Factory', 'River Market', 'Muslin Bazaar']
                },
                courtRoles: {
                    palace: ['Nawab', 'Diwan', 'Bakshi', 'Faujdar']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'British Raj',
                dominantPowerDescription: 'Calcutta becomes capital of British India while Bengal\'s wealth is drained, leading to famines and the rise of nationalism.',
                eraContextSentence: 'an era of exploitation and awakening, where Bengal births Indian nationalism.',
                allegianceGroups: [
                    { name: 'British Raj', type: 'primary', description: 'Colonial government centered in Calcutta.' },
                    { name: 'Bengali Renaissance', type: 'secondary', description: 'Intellectual and cultural revival.' },
                    { name: 'Revolutionary Groups', type: 'rebel', description: 'Armed resistance movements.' },
                    { name: 'Muslim League', type: 'secondary', description: 'Growing separatist movement.' }
                ],
                structureNames: {
                    fortress: ['Fort William', 'Police Headquarters'],
                    mill: ['Jute Mill', 'Tea Factory'],
                    factory: ['Railway Workshop', 'Ordnance Factory'],
                    trading_post: ['Writers\' Building', 'Howrah Bridge', 'New Market'],
                    palace: ['Government House', 'Victoria Memorial'],
                    holy_site: ['Dakshineswar Temple', 'St. Paul\'s Cathedral']
                },
                courtRoles: {
                    palace: ['Governor-General/Viceroy', 'Executive Council', 'Bengal Governor', 'Police Commissioner']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'India and Bangladesh',
                dominantPowerDescription: 'Partition divides Bengal between India and East Pakistan (later Bangladesh), with Calcutta declining while Dhaka rises.',
                eraContextSentence: 'an era of partition trauma, where Bengal\'s heart is torn between two nations.',
                allegianceGroups: [
                    { name: 'Government of India', type: 'primary', description: 'Indian states of West Bengal and Northeast.' },
                    { name: 'Government of Bangladesh', type: 'primary', description: 'Independent since 1971.' },
                    { name: 'Naxalite/Maoist Groups', type: 'rebel', description: 'Revolutionary movements in both countries.' },
                    { name: 'Insurgent Groups (Northeast)', type: 'rebel', description: 'Various ethnic separatist movements.' }
                ],
                structureNames: {
                    fortress: ['BSF Border Post', 'Army Base (Northeast)'],
                    factory: ['Jute Mill (declining)', 'Garment Factory', 'IT Park'],
                    trading_post: ['Petrapole Border', 'Chittagong Port', 'Kolkata Port'],
                    holy_site: ['Kalighat', 'Dhakeshwari Temple', 'Hazratbal'],
                    palace: ['Writers\' Building', 'Bangabhaban']
                },
                courtRoles: {
                    palace: ['Chief Minister (WB)', 'Prime Minister (Bangladesh)', 'Governor', 'Army Chief']
                }
            },
            "1971": {
                dominantPower: 'Bangladesh Liberation',
                dominantPowerDescription: 'East Pakistan fights for independence with Indian support, creating Bangladesh through a bloody liberation war.',
                eraContextSentence: 'an era of liberation, where Bengali nationalism creates a new nation.',
                allegianceGroups: [
                    { name: 'Mukti Bahini', type: 'primary', description: 'Bengali freedom fighters.' },
                    { name: 'Indian Armed Forces', type: 'secondary', description: 'Supporting Bangladesh liberation.' },
                    { name: 'Pakistan Army', type: 'rebel', description: 'Occupying force committing genocide.' },
                    { name: 'Awami League', type: 'secondary', description: 'Political leadership of independence.' }
                ]
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'India and Bangladesh',
                dominantPowerDescription: 'Bengal faces severe climate impacts with rising seas threatening Bangladesh while Kolkata struggles with flooding and migration.',
                eraContextSentence: 'an era of rising waters, where the delta confronts climate catastrophe.',
                allegianceGroups: [
                    { name: 'Government of India', type: 'primary', description: 'Managing climate refugees and border security.' },
                    { name: 'Government of Bangladesh', type: 'primary', description: 'Fighting for survival against rising seas.' },
                    { name: 'Climate Refugees', type: 'secondary', description: 'Millions displaced by flooding.' },
                    { name: 'China', type: 'trade_company', description: 'Infrastructure projects and influence.' }
                ],
                structureNames: {
                    fortress: ['Climate Shelter', 'Border Security Complex'],
                    factory: ['Textile Automation Hub', 'Pharmaceutical Complex', 'Shrimp Processing'],
                    trading_post: ['Deep Sea Port', 'Digital Trade Corridor', 'Refugee Processing Center'],
                    holy_site: ['Sundarbans Memorial', 'Climate Mosque', 'Unity Temple'],
                    mining_colony: ['Seabed Mining Base', 'Flood Defense System']
                }
            }
        },
        "Tamil Nadu and South": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Sangam Age Kingdoms',
                dominantPowerDescription: 'The Chera, Chola, and Pandya kingdoms flourish with sophisticated Tamil literature, extensive trade networks, and distinctive Dravidian culture.',
                eraContextSentence: 'an age of Tamil glory, where poet-kings rule and ships sail to Rome.',
                allegianceGroups: [
                    { name: 'Chola Dynasty', type: 'primary', description: 'Powerful kingdom of the Kaveri delta.' },
                    { name: 'Pandya Dynasty', type: 'secondary', description: 'Ancient dynasty of Madurai.' },
                    { name: 'Chera Dynasty', type: 'secondary', description: 'Controllers of the Western Ghats.' },
                    { name: 'Roman Traders', type: 'trade_company', description: 'Mediterranean merchants seeking spices and textiles.' }
                ],
                structureNames: {
                    fortress: ['Fort City', 'Port Fortress'],
                    mill: ['Irrigation Tank', 'Weaver Colony'],
                    holy_site: ['Murugan Temple', 'Buddhist Monastery', 'Jain Cave'],
                    palace: ['Chola Palace', 'Pandya Court'],
                    trading_post: ['Roman Trading Station', 'Pearl Fishery']
                },
                courtRoles: {
                    palace: ['Perumal/Vendan', 'Senapati', 'Otrar', 'Kavirayar'],
                    holy_site: ['Sivacharya', 'Buddhist Thera', 'Temple Devadasi']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Chola Empire',
                dominantPowerDescription: 'The Cholas create a maritime empire reaching Southeast Asia, with magnificent temples and efficient administration.',
                eraContextSentence: 'an age of naval conquest, where Chola fleets dominate the Indian Ocean.',
                allegianceGroups: [
                    { name: 'Chola Empire', type: 'primary', description: 'Imperial power with naval dominance.' },
                    { name: 'Chalukya Rivals', type: 'secondary', description: 'Deccan competitors.' },
                    { name: 'Sri Lankan Kingdoms', type: 'rebel', description: 'Resisting Chola occupation.' },
                    { name: 'Southeast Asian Allies', type: 'trade_company', description: 'Srivijaya and other maritime partners.' }
                ],
                structureNames: {
                    fortress: ['Naval Base', 'Border Fort'],
                    mill: ['Temple Tank', 'Bronze Workshop'],
                    holy_site: ['Brihadeswara Temple', 'Chidambaram', 'Buddhist Vihara'],
                    palace: ['Chola Royal Palace', 'Provincial Viceroy Residence'],
                    trading_post: ['International Port', 'Guild Market']
                },
                courtRoles: {
                    palace: ['Chakravartin', 'Mahamandalesvara', 'Senathipati', 'Olainayakam']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Vijayanagara Empire',
                dominantPowerDescription: 'The last great Hindu empire controls South India, fostering art and architecture while resisting Islamic expansion.',
                eraContextSentence: 'an era of Hindu resurgence, where Vijayanagara stands as dharma\'s defender.',
                allegianceGroups: [
                    { name: 'Vijayanagara Empire', type: 'primary', description: 'Hindu empire based in Hampi.' },
                    { name: 'Nayaka Kingdoms', type: 'secondary', description: 'Regional governors becoming independent.' },
                    { name: 'Bahmani/Deccan Sultanates', type: 'rebel', description: 'Muslim enemies to the north.' },
                    { name: 'Portuguese Goa', type: 'trade_company', description: 'European coastal enclave.' }
                ],
                structureNames: {
                    fortress: ['Hampi Fortifications', 'Nayaka Fort'],
                    mill: ['Temple Workshop', 'Diamond Cutting'],
                    holy_site: ['Virupaksha Temple', 'Meenakshi Temple', 'Jesuit Church'],
                    palace: ['Lotus Mahal', 'Nayaka Palace'],
                    trading_post: ['Pulicat', 'Portuguese Factory']
                },
                courtRoles: {
                    palace: ['Raya', 'Mahapradhana', 'Dandanayaka', 'Rayasam']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'British Madras Presidency',
                dominantPowerDescription: 'British rule centers on Madras, transforming the region into a colonial economy while Tamil culture adapts and resists.',
                eraContextSentence: 'an era of colonial transformation, where ancient Tamil culture confronts British modernity.',
                allegianceGroups: [
                    { name: 'British Raj', type: 'primary', description: 'Madras Presidency administration.' },
                    { name: 'Princely States', type: 'secondary', description: 'Mysore, Travancore, and others.' },
                    { name: 'Justice Party', type: 'secondary', description: 'Non-Brahmin political movement.' },
                    { name: 'Indian National Congress', type: 'rebel', description: 'Independence movement.' }
                ],
                structureNames: {
                    fortress: ['Fort St. George', 'Cantonment'],
                    mill: ['Cotton Mill', 'Coffee Plantation'],
                    factory: ['Railway Workshop', 'Leather Factory'],
                    trading_post: ['Madras Harbor', 'Coffee Auction House'],
                    palace: ['Government House', 'Maharaja\'s Palace'],
                    holy_site: ['Kapaleeshwarar Temple', 'San Thome Cathedral']
                },
                courtRoles: {
                    palace: ['Governor', 'Executive Council', 'Dewan (Princely States)', 'Collector']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Republic of India',
                dominantPowerDescription: 'Tamil Nadu becomes an industrial and cultural powerhouse with strong regional identity, Dravidian politics, and growing IT sector.',
                eraContextSentence: 'an era of Dravidian assertion, where Tamil identity shapes modern development.',
                allegianceGroups: [
                    { name: 'Tamil Nadu Government', type: 'primary', description: 'Dravidian party rule.' },
                    { name: 'Kerala Government', type: 'secondary', description: 'Communist-influenced state.' },
                    { name: 'Sri Lankan Tamils', type: 'rebel', description: 'LTTE and refugee crisis.' },
                    { name: 'Auto/IT Industries', type: 'trade_company', description: 'Manufacturing and software hubs.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Coast Guard Station'],
                    factory: ['Auto Plant', 'Textile Mill', 'IT Park'],
                    trading_post: ['Chennai Port', 'TIDEL Park', 'Koyambedu Market'],
                    holy_site: ['Meenakshi Temple', 'Velankanni Church', 'Marina Memorial'],
                    palace: ['Fort St. George Secretariat', 'Raj Bhavan']
                },
                courtRoles: {
                    palace: ['Chief Minister', 'Governor', 'DGP', 'Chief Secretary']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Republic of India',
                dominantPowerDescription: 'Tamil Nadu leads renewable energy transition while Chennai faces water crisis and rising seas threaten coastal areas.',
                eraContextSentence: 'an era of water scarcity and wind power, where Tamil innovation confronts climate change.',
                allegianceGroups: [
                    { name: 'Tamil Nadu Government', type: 'primary', description: 'Regional party managing resources.' },
                    { name: 'Water Sharing States', type: 'secondary', description: 'Karnataka and Kerala in river disputes.' },
                    { name: 'Renewable Energy Corps', type: 'trade_company', description: 'Wind and solar giants.' },
                    { name: 'Fisher Communities', type: 'rebel', description: 'Coastal peoples losing livelihoods.' }
                ],
                structureNames: {
                    fortress: ['Coastal Defense System', 'Space Launch Facility'],
                    factory: ['Electric Vehicle Hub', 'Desalination Megaplant', 'Wind Turbine Manufacturing'],
                    trading_post: ['Smart Port', 'Medical Tourism Complex', 'Data Center Cluster'],
                    holy_site: ['Water Conservation Memorial', 'Eco-Tourism Ashram', 'Resilient Temple'],
                    mining_colony: ['Offshore Wind Farm', 'Tidal Energy Station']
                }
            }
        },
        "Sri Lanka": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Anuradhapura Kingdom',
                dominantPowerDescription: 'Ancient Sinhalese kingdom establishes Buddhism as state religion while developing sophisticated irrigation systems.',
                eraContextSentence: 'an age of Buddhist kings, where massive stupas and tanks transform the dry zone.',
                allegianceGroups: [
                    { name: 'Sinhalese Kingdom', type: 'primary', description: 'Buddhist monarchy at Anuradhapura.' },
                    { name: 'Tamil Traders', type: 'secondary', description: 'Merchants from South India.' },
                    { name: 'Buddhist Sangha', type: 'religious', description: 'Powerful monastic order.' },
                    { name: 'Veddah Tribes', type: 'secondary', description: 'Indigenous forest dwellers.' }
                ],
                structureNames: {
                    fortress: ['Royal Citadel', 'Monastery Fort'],
                    mill: ['Irrigation Tank', 'Royal Workshop'],
                    holy_site: ['Ruwanwelisaya Stupa', 'Bodhi Tree Temple', 'Cave Monastery'],
                    palace: ['Royal Palace Complex'],
                    trading_post: ['Port Mantota', 'Silk Road Connection']
                },
                courtRoles: {
                    palace: ['Maharaja', 'Adipada', 'Senapati', 'Mahasangharaja']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Polonnaruwa Kingdom',
                dominantPowerDescription: 'Sinhalese power shifts southeast while Tamil Chola occupation brings South Indian influence, creating a synthesis culture.',
                eraContextSentence: 'an age of cultural fusion, where Sinhalese resilience meets Tamil power.',
                allegianceGroups: [
                    { name: 'Polonnaruwa Dynasty', type: 'primary', description: 'Sinhalese kings after defeating Cholas.' },
                    { name: 'Chola Occupation', type: 'secondary', description: 'Tamil imperial presence.' },
                    { name: 'Ruhuna Kingdom', type: 'secondary', description: 'Southern Sinhalese resistance.' },
                    { name: 'Pandyan Invaders', type: 'mercenary', description: 'South Indian military adventures.' }
                ],
                structureNames: {
                    fortress: ['Parakrama Citadel', 'Tamil Fort'],
                    mill: ['Giant Reservoir', 'Craft Guild'],
                    holy_site: ['Gal Vihara', 'Hindu Kovil', 'Tooth Relic Temple'],
                    palace: ['Parakramabahu Palace', 'Council Chamber'],
                    trading_post: ['Spice Port', 'Gem Market']
                },
                courtRoles: {
                    palace: ['Chakravartin', 'Mahadipada', 'Camunayaka', 'Adhikari']
                },
                mapAreaOverrides: {
                    "Maldives": {
                        dominantPower: 'Maldive Sultanate',
                        dominantPowerDescription: 'After converting from Buddhism to Islam in the 12th century, the Maldives develops as an independent Islamic sultanate controlling vital Indian Ocean trade routes.',
                        allegianceGroups: [
                            { name: 'Maldivian Sultan', type: 'primary', description: 'Islamic monarchy ruling from Malé.' },
                            { name: 'Arab Traders', type: 'trade_company', description: 'Muslim merchants connecting East and West.' },
                            { name: 'Local Atolls', type: 'secondary', description: 'Semi-autonomous island communities.' },
                            { name: 'Buddhist Remnants', type: 'secondary', description: 'Traces of pre-Islamic culture and monuments.' }
                        ]
                    }
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Colonial Competition',
                dominantPowerDescription: 'Portuguese, Dutch, and British successively control coastal areas while the Kandyan Kingdom maintains independence in the highlands.',
                eraContextSentence: 'an era of colonial encroachment, where the highland kingdom resists European dominance.',
                allegianceGroups: [
                    { name: 'Kingdom of Kandy', type: 'primary', description: 'Last independent Sinhalese kingdom.' },
                    { name: 'Dutch Ceylon', type: 'primary', description: 'Colonial control of coasts.' },
                    { name: 'Tamil Kingdom of Jaffna', type: 'secondary', description: 'Northern Tamil polity.' },
                    { name: 'Portuguese/Dutch Burghers', type: 'trade_company', description: 'Mixed European communities.' }
                ],
                structureNames: {
                    fortress: ['Kandy Fortress', 'Dutch Fort', 'British Fort'],
                    mill: ['Cinnamon Plantation', 'Spice Garden'],
                    holy_site: ['Temple of the Tooth', 'Dutch Reformed Church', 'Nallur Temple'],
                    palace: ['Kandyan Palace', 'Dutch Governor\'s House'],
                    trading_post: ['Colombo Port', 'Galle Harbor', 'Spice Warehouse']
                },
                courtRoles: {
                    palace: ['King of Kandy', 'Adigar', 'Disava', 'Dutch Governor']
                },
                mapAreaOverrides: {
                    "Maldives": {
                        dominantPower: 'Maldive Sultanate',
                        dominantPowerDescription: 'The Maldives maintains its independence as an Islamic sultanate while facing increasing Portuguese and Dutch pressure, eventually accepting protection from the Dutch and later the British.',
                        allegianceGroups: [
                            { name: 'Maldivian Sultan', type: 'primary', description: 'Independent Islamic monarchy facing European encroachment.' },
                            { name: 'Portuguese Traders', type: 'secondary', description: 'Portuguese attempts at control (briefly occupied in 1558).' },
                            { name: 'Dutch East India Company', type: 'secondary', description: 'VOC seeking trade monopoly.' },
                            { name: 'Local Atolls', type: 'secondary', description: 'Island communities with traditional governance.' }
                        ]
                    }
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'British Ceylon',
                dominantPowerDescription: 'British unify the island, establishing tea plantations with Tamil labor while modernizing infrastructure and administration.',
                eraContextSentence: 'an era of tea and railways, where British plantations transform the highlands.',
                allegianceGroups: [
                    { name: 'British Colonial Government', type: 'primary', description: 'Unified administration from Colombo.' },
                    { name: 'Sinhalese Elite', type: 'secondary', description: 'English-educated collaborators.' },
                    { name: 'Tamil Laborers', type: 'secondary', description: 'Indian workers on plantations.' },
                    { name: 'Buddhist Revival', type: 'religious', description: 'Anti-colonial religious movement.' }
                ],
                structureNames: {
                    fortress: ['British Garrison', 'Police Station'],
                    mill: ['Tea Factory', 'Rubber Plantation'],
                    factory: ['Railway Workshop', 'Tea Processing'],
                    trading_post: ['Colombo Commercial Hub', 'Tea Auction House'],
                    palace: ['Governor\'s Residence', 'Queen\'s House'],
                    holy_site: ['Buddhist Revival Temple', 'St. Paul\'s Church']
                },
                courtRoles: {
                    palace: ['Governor', 'Colonial Secretary', 'Chief Justice', 'Tea Planter Representative']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Democratic Socialist Republic of Sri Lanka',
                dominantPowerDescription: 'Independent Ceylon becomes Sri Lanka, facing ethnic civil war between Sinhalese majority and Tamil minority.',
                eraContextSentence: 'an era of ethnic conflict, where paradise island becomes a battlefield.',
                allegianceGroups: [
                    { name: 'Sri Lankan Government', type: 'primary', description: 'Sinhalese-dominated state.' },
                    { name: 'LTTE (Tamil Tigers)', type: 'rebel', description: 'Tamil separatist insurgency.' },
                    { name: 'Indian Peacekeepers', type: 'secondary', description: 'Failed intervention force.' },
                    { name: 'Buddhist Nationalists', type: 'religious', description: 'Hardline Sinhalese groups.' }
                ],
                structureNames: {
                    fortress: ['Army Base', 'LTTE Stronghold'],
                    factory: ['Garment Factory', 'Tea Estate'],
                    trading_post: ['Colombo Port City', 'Free Trade Zone'],
                    holy_site: ['Temple of Tooth', 'Jaffna Library (destroyed)', 'War Memorial'],
                    palace: ['Presidential Palace', 'Parliament Complex']
                },
                courtRoles: {
                    palace: ['President', 'Prime Minister', 'Army Commander', 'Chief Monk']
                }
            },
            "2009": {
                dominantPower: 'Post-War Sri Lanka',
                dominantPowerDescription: 'Government military victory ends civil war but ethnic tensions remain amid authoritarian drift and Chinese investment.',
                eraContextSentence: 'an era of victors\' peace, where military triumph brings uneasy quiet.',
                allegianceGroups: [
                    { name: 'Rajapaksa Government', type: 'primary', description: 'Authoritarian victor regime.' },
                    { name: 'Defeated Tamils', type: 'secondary', description: 'Occupied population in north.' },
                    { name: 'China', type: 'trade_company', description: 'Major infrastructure investor.' },
                    { name: 'War Crimes Activists', type: 'rebel', description: 'Demanding accountability.' }
                ]
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Democratic Socialist Republic of Sri Lanka',
                dominantPowerDescription: 'Sri Lanka balances between India and China while developing as a transshipment hub and dealing with climate impacts.',
                eraContextSentence: 'an era of strategic balance, where location becomes destiny in the Indo-Pacific.',
                allegianceGroups: [
                    { name: 'Sri Lankan Government', type: 'primary', description: 'Coalition managing competing pressures.' },
                    { name: 'Chinese Interests', type: 'trade_company', description: 'Port and infrastructure control.' },
                    { name: 'Indian Security Concerns', type: 'secondary', description: 'Worried southern neighbor.' },
                    { name: 'Tamil Diaspora', type: 'secondary', description: 'Demanding justice and autonomy.' }
                ],
                structureNames: {
                    fortress: ['Hambantota Chinese Base', 'Indian Radar Station'],
                    factory: ['Transshipment Complex', 'IT City', 'Pharmaceutical Plant'],
                    trading_post: ['Colombo Port City', 'Digital Financial Hub', 'Belt & Road Gateway'],
                    holy_site: ['Reconciliation Center', 'Climate Refugee Temple', 'Interfaith Complex'],
                    mining_colony: ['Graphite Mine (Battery Material)', 'Offshore Energy Platform']
                }
            }
        },
        "Mainland Southeast Asia": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Funan and Early Kingdoms',
                dominantPowerDescription: 'The Mekong Delta civilization of Funan controls trade routes between China and India while other early kingdoms emerge along river valleys.',
                eraContextSentence: 'an age of river empires, where monsoon trade creates the first Southeast Asian states.',
                allegianceGroups: [
                    { name: 'Funan Empire', type: 'primary', description: 'Mekong Delta maritime empire.' },
                    { name: 'Dvaravati Kingdoms', type: 'secondary', description: 'Mon Buddhist states in Thailand.' },
                    { name: 'Chinese Traders', type: 'trade_company', description: 'Han dynasty merchants.' },
                    { name: 'Indian Brahmins', type: 'religious', description: 'Hindu cultural advisors.' }
                ],
                structureNames: {
                    fortress: ['River Fort', 'Coastal Citadel'],
                    mill: ['Rice Paddy System', 'Port Workshop'],
                    holy_site: ['Hindu Temple', 'Buddhist Wat', 'Ancestor Shrine'],
                    palace: ['Royal Water Palace'],
                    trading_post: ['River Port', 'Trade Emporium']
                },
                courtRoles: {
                    palace: ['Raja', 'Brahmin Advisor', 'Port Master', 'Military Chief']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Khmer Empire and Regional Kingdoms',
                dominantPowerDescription: 'Angkor becomes the world\'s largest pre-industrial city while Thai, Burmese, and Vietnamese kingdoms emerge as regional powers.',
                eraContextSentence: 'an age of temple mountains, where god-kings rule from Angkor\'s stone splendor.',
                allegianceGroups: [
                    { name: 'Khmer Empire', type: 'primary', description: 'Angkor-based hydraulic empire.' },
                    { name: 'Pagan Kingdom', type: 'secondary', description: 'Burmese Buddhist empire.' },
                    { name: 'Sukhothai Kingdom', type: 'secondary', description: 'Early Thai kingdom.' },
                    { name: 'Dai Viet', type: 'secondary', description: 'Vietnamese kingdom resisting Chinese rule.' }
                ],
                structureNames: {
                    fortress: ['Angkor Thom', 'Pagan Fortress'],
                    mill: ['Baray Reservoir', 'Temple Workshop'],
                    holy_site: ['Angkor Wat', 'Buddhist Pagoda', 'Hindu Temple'],
                    palace: ['Khmer Royal Palace', 'Burmese Palace'],
                    trading_post: ['Temple Market', 'River Trading Post']
                },
                courtRoles: {
                    palace: ['Devaraja', 'Brahmin Purohita', 'Senabati', 'Buddhist Sangharaja']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Ayutthaya and Regional Powers',
                dominantPowerDescription: 'The Thai kingdom of Ayutthaya dominates mainland Southeast Asia while Burma, Vietnam, and a declining Cambodia compete for regional influence.',
                eraContextSentence: 'an era of golden kingdoms, where Ayutthaya\'s spires rise above flooded plains.',
                allegianceGroups: [
                    { name: 'Ayutthaya Kingdom', type: 'primary', description: 'Powerful Thai maritime empire.' },
                    { name: 'Toungoo Dynasty', type: 'secondary', description: 'Burmese empire threatening neighbors.' },
                    { name: 'Le Dynasty Vietnam', type: 'secondary', description: 'Vietnamese expansion southward.' },
                    { name: 'European Traders', type: 'trade_company', description: 'Portuguese, Dutch, and others.' }
                ],
                structureNames: {
                    fortress: ['Ayutthaya Fortress', 'Burmese Stockade'],
                    mill: ['Royal Workshop', 'Floating Market'],
                    holy_site: ['Wat Temple', 'Buddhist Pagoda', 'Catholic Church'],
                    palace: ['Thai Royal Palace', 'Burmese Palace'],
                    trading_post: ['River Port', 'European Factory']
                },
                courtRoles: {
                    palace: ['King of Siam', 'Burmese King', 'Mandarin', 'European Captain']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'British and French Colonial Empires',
                dominantPowerDescription: 'European powers colonize most of mainland Southeast Asia, with only Thailand remaining independent as a buffer state.',
                eraContextSentence: 'an era of colonial partition, where European flags fly over ancient kingdoms.',
                allegianceGroups: [
                    { name: 'British Burma', type: 'primary', description: 'Colonial administration extracting resources.' },
                    { name: 'French Indochina', type: 'primary', description: 'Colonial federation of Vietnam, Laos, Cambodia.' },
                    { name: 'Kingdom of Siam', type: 'secondary', description: 'Independent buffer state.' },
                    { name: 'Independence Movements', type: 'rebel', description: 'Early nationalist resistance.' }
                ],
                structureNames: {
                    fortress: ['Colonial Fort', 'British Cantonment'],
                    mill: ['Rice Mill', 'Teak Processing'],
                    factory: ['Railway Workshop', 'Colonial Factory'],
                    trading_post: ['Colonial Port', 'Railway Station'],
                    palace: ['Governor General\'s Palace', 'Thai Royal Palace'],
                    holy_site: ['Colonial Church', 'Buddhist Temple']
                },
                courtRoles: {
                    palace: ['Governor General', 'Resident', 'King of Siam', 'Colonial Administrator']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Independent Southeast Asian Nations',
                dominantPowerDescription: 'Newly independent nations face civil wars, authoritarian rule, and Cold War proxy conflicts while building modern states.',
                eraContextSentence: 'an era of independence struggles, where new nations emerge from colonial ashes.',
                allegianceGroups: [
                    { name: 'ASEAN Governments', type: 'primary', description: 'Regional bloc of independent states.' },
                    { name: 'Communist Movements', type: 'rebel', description: 'Marxist insurgencies and governments.' },
                    { name: 'United States', type: 'secondary', description: 'Cold War ally supporting anti-communist regimes.' },
                    { name: 'Military Juntas', type: 'secondary', description: 'Authoritarian military governments.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Police Headquarters'],
                    factory: ['Manufacturing Plant', 'Electronics Assembly'],
                    trading_post: ['ASEAN Trade Hub', 'Export Processing Zone'],
                    holy_site: ['National Temple', 'Independence Monument', 'War Memorial'],
                    palace: ['Presidential Palace', 'Parliament Building']
                },
                courtRoles: {
                    palace: ['President', 'Prime Minister', 'Military Commander', 'Party Secretary']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'ASEAN Plus China',
                dominantPowerDescription: 'Southeast Asian nations balance between China\'s Belt and Road Initiative and Western partnerships while managing climate change impacts.',
                eraContextSentence: 'an era of great power competition, where ancient rivers become contested waterways.',
                allegianceGroups: [
                    { name: 'ASEAN Governments', type: 'primary', description: 'Regional bloc managing big power competition.' },
                    { name: 'China', type: 'trade_company', description: 'Major investor and trade partner.' },
                    { name: 'United States', type: 'secondary', description: 'Security partner and democratic ally.' },
                    { name: 'Climate Refugees', type: 'secondary', description: 'Populations displaced by rising seas.' }
                ],
                structureNames: {
                    fortress: ['Regional Security Complex', 'Climate Defense Center'],
                    factory: ['High-Tech Manufacturing Hub', 'Green Energy Plant'],
                    trading_post: ['Digital Trade Center', 'Belt & Road Terminal', 'ASEAN Market'],
                    holy_site: ['ASEAN Cultural Center', 'Climate Temple', 'Peace Memorial'],
                    mining_colony: ['Offshore Gas Platform', 'Rare Earth Processing']
                }
            }
        },
        "Maritime Southeast Asia": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Srivijaya and Early Trading Kingdoms',
                dominantPowerDescription: 'Maritime empires control the spice trade routes, with Srivijaya dominating the Strait of Malacca and smaller kingdoms across the archipelago.',
                eraContextSentence: 'an age of spice routes, where maritime kingdoms bridge East and West.',
                allegianceGroups: [
                    { name: 'Srivijaya Empire', type: 'primary', description: 'Buddhist maritime empire controlling straits.' },
                    { name: 'Local Trading Kingdoms', type: 'secondary', description: 'Island rulers controlling spice sources.' },
                    { name: 'Chinese Merchants', type: 'trade_company', description: 'Tang dynasty traders.' },
                    { name: 'Indian Traders', type: 'trade_company', description: 'Chola and other South Indian merchants.' }
                ],
                structureNames: {
                    fortress: ['Coastal Fort', 'Island Citadel'],
                    mill: ['Spice Processing', 'Boat Building'],
                    holy_site: ['Buddhist Candi', 'Hindu Temple', 'Animist Shrine'],
                    palace: ['Floating Palace', 'Datu\'s Residence'],
                    trading_post: ['Spice Port', 'Trading Emporium']
                },
                courtRoles: {
                    palace: ['Maharaja', 'Datu', 'Buddhist Monk', 'Port Master']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Majapahit and Islamic Sultanates',
                dominantPowerDescription: 'The Hindu-Buddhist Majapahit Empire rules Java while Islam spreads through trade, creating powerful sultanates across the archipelago.',
                eraContextSentence: 'an age of faiths converging, where Hindu temples stand beside Islamic mosques.',
                allegianceGroups: [
                    { name: 'Majapahit Empire', type: 'primary', description: 'Javanese Hindu-Buddhist empire.' },
                    { name: 'Islamic Sultanates', type: 'primary', description: 'Muslim trading kingdoms.' },
                    { name: 'Javanese Principalities', type: 'secondary', description: 'Local rulers under Majapahit.' },
                    { name: 'Arab Traders', type: 'trade_company', description: 'Muslim merchants spreading Islam.' }
                ],
                structureNames: {
                    fortress: ['Majapahit Kraton', 'Sultan\'s Fort'],
                    mill: ['Rice Terraces', 'Batik Workshop'],
                    holy_site: ['Hindu Candi', 'Great Mosque', 'Buddhist Temple'],
                    palace: ['Javanese Kraton', 'Sultan\'s Palace'],
                    trading_post: ['Islamic Port', 'Spice Market']
                },
                courtRoles: {
                    palace: ['Raja', 'Sultan', 'Bendahara', 'Syahbandar']
                },
                mapAreaOverrides: {
                    "Bali": {
                        dominantPower: 'Hindu Balinese Kingdoms',
                        dominantPowerDescription: 'As Islam spreads through Java, Bali remains the last major Hindu stronghold in the archipelago, preserving Javanese Hindu-Buddhist court culture after Majapahit\'s fall.',
                        allegianceGroups: [
                            { name: 'Balinese Rajas', type: 'primary', description: 'Hindu kingdoms preserving Majapahit traditions.' },
                            { name: 'Brahmin Priests', type: 'religious', description: 'Hindu religious authorities and advisors.' },
                            { name: 'Javanese Refugees', type: 'secondary', description: 'Hindu nobles and artists fleeing Islamic Java.' },
                            { name: 'Islamic Traders', type: 'trade_company', description: 'Muslim merchants from Java and Sumatra.' }
                        ]
                    }
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Islamic Sultanates and European Companies',
                dominantPowerDescription: 'Powerful Islamic sultanates like Aceh and Mataram compete with Portuguese, Dutch, and British trading companies for control of the spice trade.',
                eraContextSentence: 'an era of competing empires, where Islamic sultans face European companies.',
                allegianceGroups: [
                    { name: 'Aceh Sultanate', type: 'primary', description: 'Powerful Islamic state controlling northern Sumatra.' },
                    { name: 'Dutch East India Company', type: 'primary', description: 'VOC controlling Java and eastern spices.' },
                    { name: 'Mataram Sultanate', type: 'secondary', description: 'Central Javanese Islamic kingdom.' },
                    { name: 'Portuguese/Spanish Traders', type: 'trade_company', description: 'European competitors for spice trade.' }
                ],
                structureNames: {
                    fortress: ['Sultan\'s Kraton', 'Dutch Fort'],
                    mill: ['Spice Plantation', 'Islamic School'],
                    holy_site: ['Grand Mosque', 'Catholic Church', 'Hindu Temple'],
                    palace: ['Sultan\'s Palace', 'Dutch Governor\'s Residence'],
                    trading_post: ['Spice Warehouse', 'VOC Factory']
                },
                courtRoles: {
                    palace: ['Sultan', 'Dutch Governor', 'Bendahara', 'Company Director']
                },
                mapAreaOverrides: {
                    "Bali": {
                        dominantPower: 'Hindu Balinese Kingdoms',
                        dominantPowerDescription: 'Bali maintains its Hindu identity and political independence longer than neighboring islands, with rival kingdoms resisting Dutch encroachment through complex diplomacy and warfare.',
                        allegianceGroups: [
                            { name: 'Balinese Rajas', type: 'primary', description: 'Competing Hindu kingdoms (Klungkung, Buleleng, Karangasem, etc.).' },
                            { name: 'Brahmin Caste', type: 'religious', description: 'Hindu priests maintaining ritual authority.' },
                            { name: 'Dutch East India Company', type: 'secondary', description: 'VOC gradually expanding influence through trade and conquest.' },
                            { name: 'Sasak Rebels', type: 'rebel', description: 'Muslim population of Lombok under Balinese rule.' }
                        ]
                    }
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Dutch East Indies and British Malaya',
                dominantPowerDescription: 'European colonial powers consolidate control, establishing plantation economies while traditional rulers maintain ceremonial roles.',
                eraContextSentence: 'an era of colonial extraction, where European plantations replace spice kingdoms.',
                allegianceGroups: [
                    { name: 'Dutch East Indies', type: 'primary', description: 'Colonial government in Batavia.' },
                    { name: 'British Malaya', type: 'primary', description: 'Colonial administration in Singapore.' },
                    { name: 'Traditional Sultans', type: 'secondary', description: 'Ceremonial rulers under colonial protection.' },
                    { name: 'Independence Movements', type: 'rebel', description: 'Early nationalist resistance.' }
                ],
                structureNames: {
                    fortress: ['Colonial Fort', 'Police Station'],
                    mill: ['Sugar Mill', 'Rubber Plantation'],
                    factory: ['Tin Processing', 'Colonial Factory'],
                    trading_post: ['Colonial Port', 'Plantation Hub'],
                    palace: ['Governor General\'s Palace', 'Sultan\'s Istana'],
                    holy_site: ['Colonial Church', 'Mosque', 'Chinese Temple']
                },
                courtRoles: {
                    palace: ['Governor General', 'Resident', 'Sultan', 'Plantation Manager']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Independent Southeast Asian Nations',
                dominantPowerDescription: 'Newly independent Indonesia, Malaysia, Singapore, and Brunei navigate post-colonial challenges while building modern economies.',
                eraContextSentence: 'an era of nation building, where archipelago peoples forge modern identities.',
                allegianceGroups: [
                    { name: 'Republic of Indonesia', type: 'primary', description: 'Largest archipelago nation under Sukarno/Suharto.' },
                    { name: 'Malaysia and Singapore', type: 'secondary', description: 'Smaller states pursuing rapid development.' },
                    { name: 'Brunei Sultanate', type: 'secondary', description: 'Oil-rich traditional monarchy.' },
                    { name: 'ASEAN', type: 'trade_company', description: 'Regional economic cooperation.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Navy Headquarters'],
                    factory: ['Manufacturing Plant', 'Oil Refinery'],
                    trading_post: ['Port Authority', 'Free Trade Zone'],
                    holy_site: ['National Mosque', 'Independence Monument', 'Traditional Temple'],
                    palace: ['Presidential Palace', 'Parliament House']
                },
                courtRoles: {
                    palace: ['President', 'Prime Minister', 'Sultan', 'Military Commander']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Maritime Southeast Asian Nations',
                dominantPowerDescription: 'The region becomes a major economic hub while facing climate threats from rising seas and competing influences from China and the West.',
                eraContextSentence: 'an era of rising seas and rising powers, where ancient trade routes face modern challenges.',
                allegianceGroups: [
                    { name: 'ASEAN Maritime States', type: 'primary', description: 'Regional bloc managing maritime security.' },
                    { name: 'China', type: 'trade_company', description: 'Major trade partner with territorial claims.' },
                    { name: 'United States-Australia', type: 'secondary', description: 'Security partners balancing Chinese influence.' },
                    { name: 'Climate Adaptation Alliance', type: 'secondary', description: 'International cooperation on climate resilience and managing rising sea levels.' }
                ],
                structureNames: {
                    fortress: ['Maritime Security Center', 'Climate Defense Wall', 'Automated Naval Base'],
                    factory: ['Automated Port', 'EV Battery Plant', 'Semiconductor Back-end Fab'],
                    trading_post: ['Digital Free Trade Zone', 'ASEAN Data Hub', 'Trans-Archipelago Logistics Node'],
                    holy_site: ['Interfaith Climate Center', 'Sinking Cities Memorial', 'Digital Nomad Temple'],
                    mining_colony: ['Deep Sea Mining Rig', 'Offshore Geothermal Plant', 'Plastic Reclamation Facility']
                }
            }
        },
        "Philippines and Taiwan Strait": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Austronesian Maritime Polities',
                dominantPowerDescription: 'Numerous seafaring societies thrive, from the indigenous tribes of Taiwan, the origin point of Austronesian expansion, to the barangay city-states in the Philippines engaged in extensive inter-island trade.',
                eraContextSentence: 'an age of jade and canoes, where the sea is a highway connecting countless islands.',
                allegianceGroups: [
                    { name: 'Filipino Barangay States', type: 'primary', description: 'Small coastal kingdoms and city-states led by Datus.' },
                    { name: 'Taiwanese Indigenous Tribes', type: 'primary', description: 'Diverse linguistic and cultural groups inhabiting Taiwan.' },
                    { name: 'Sa Huynh Culture Traders', type: 'trade_company', description: 'Vietnam-based traders exchanging goods across the South China Sea.' },
                    { name: 'Han Dynasty Mariners', type: 'secondary', description: 'Occasional Chinese explorers and traders mapping the seas.' }
                ],
                structureNames: {
                    fortress: ['Kuta (Earthen Fort)', 'Hilltop Palisade'],
                    mill: ['Taro Terrace', 'Jade Workshop', 'Boat Building Yard'],
                    holy_site: ['Ancestral Shrine', 'Sacred Grove', 'Burial Jar Site'],
                    palace: ['Datu\'s Longhouse', 'Chieftain\'s Hut'],
                    trading_post: ['Coastal Trading Post', 'River Mouth Market']
                },
                courtRoles: {
                    palace: ['Datu/Rajah', 'Babaylan (Shaman)', 'Panday (Craftsman)', 'Atubang sa Datu (Advisor)']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Thalassocratic Confederations',
                dominantPowerDescription: 'Larger, more centralized kingdoms and confederations emerge, such as Tondo and Butuan, controlling regional trade while the Sultanate of Sulu rises in the south, bringing Islam to the archipelago.',
                eraContextSentence: 'an age of rajas and sultans, where maritime kingdoms vie for trade and tribute.',
                allegianceGroups: [
                    { name: 'Kingdom of Tondo', type: 'primary', description: 'A powerful kingdom in the Luzon region trading with China.' },
                    { name: 'Sultanate of Sulu', type: 'primary', description: 'An Islamic sultanate dominating trade in the southern seas.' },
                    { name: 'Rajanate of Butuan', type: 'secondary', description: 'A Hindu-Buddhist kingdom in Mindanao known for its gold.' },
                    { name: 'Chinese Junk Traders', type: 'trade_company', description: 'Merchants from the Song and Yuan dynasties.' }
                ],
                structureNames: {
                    fortress: ['Stone Kuta', 'Walled City (Kota)'],
                    mill: ['Rice Paddies', 'Gold Working Shop'],
                    holy_site: ['Mosque', 'Hindu-Buddhist Shrine', 'Royal Cemetery'],
                    palace: ['Rajah\'s Palace', 'Sultan\'s Istana'],
                    trading_post: ['International Port', 'Barter Market']
                },
                courtRoles: {
                    palace: ['Rajah', 'Sultan', 'Lakan', 'Dayang (Princess)'],
                    holy_site: ['Imam', 'Buddhist Monk', 'Shaman']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Spanish and Dutch Imperial Contest',
                dominantPowerDescription: 'Spain establishes a permanent colony in the Philippines, centered in Manila, creating a vital link in the galleon trade, while the Dutch and the Kingdom of Koxinga contest control of Taiwan.',
                eraContextSentence: 'an era of silver galleons and trading forts, where European powers impose new orders.',
                allegianceGroups: [
                    { name: 'Spanish Empire', type: 'primary', description: 'Colonial government ruling the Philippines.' },
                    { name: 'Moro Sultanates', type: 'rebel', description: 'Islamic states in the south resisting Spanish rule.' },
                    { name: 'Dutch East India Company', type: 'trade_company', description: 'Controlling trade and territory in Formosa (Taiwan).' },
                    { name: 'Kingdom of Tungning', type: 'secondary', description: 'A pro-Ming state established by Koxinga in Taiwan.' }
                ],
                structureNames: {
                    fortress: ['Intramuros (Manila)', 'Fort Zeelandia (Taiwan)', 'Moro Kota'],
                    mill: ['Hacienda', 'Galleon Shipyard'],
                    holy_site: ['Catholic Cathedral', 'Mosque', 'Confucian Temple'],
                    palace: ['Palacio del Gobernador', 'Koxinga\'s Palace'],
                    trading_post: ['Parian (Chinese Market)', 'Galleon Port']
                },
                courtRoles: {
                    palace: ['Governor-General', 'Archbishop', 'Oidor (Judge)', 'Sultan']
                }
            },
           [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'US and Japanese Colonial Expansion',
                dominantPowerDescription: 'Following the Spanish-American War, the US takes control of the Philippines, suppressing a revolution. Meanwhile, after the First Sino-Japanese War, Japan annexes Taiwan, beginning a period of industrialization.',
                eraContextSentence: 'an era of new masters, where American and Japanese ambitions reshape the islands.',
                allegianceGroups: [
                    { name: 'United States Colonial Government', type: 'primary', description: 'American military and civilian administration in the Philippines.' },
                    { name: 'Japanese Colonial Government', type: 'primary', description: 'Imperial Japanese rule over Taiwan (Formosa).' },
                    { name: 'Philippine Republic (Malolos)', type: 'rebel', description: 'Revolutionary government fighting for independence.' },
                    { name: 'Qing Dynasty Remnants', type: 'secondary', description: 'Briefly asserting control before Japanese takeover of Taiwan.' }
                ],
                structureNames: {
                    fortress: ['Fort Santiago', 'American Army Base', 'Japanese Garrison'],
                    mill: ['Sugar Central', 'Tobacco Plantation', 'Camphor Distillery'],
                    factory: ['Railway Workshop', 'Sugar Refinery'],
                    trading_post: ['Port of Manila', 'Keelung Harbor', 'Provincial Capitol'],
                    palace: ['Malacañang Palace', 'Governor-General\'s Residence (Taihoku)'],
                    holy_site: ['Protestant Church', 'Shinto Shrine', 'Catholic Basilica']
                },
                courtRoles: {
                    palace: ['American Governor-General', 'Japanese Governor-General', 'Filipino Assemblyman', 'Taiwanese Community Leader']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Divided Sovereignty',
                dominantPowerDescription: 'The Philippines gains independence but faces political instability and insurgency. The Republic of China government retreats to Taiwan after the Chinese Civil War, beginning a period of authoritarian rule and economic growth.',
                eraContextSentence: 'an era of Cold War fault lines, where new nations chart uncertain paths.',
                allegianceGroups: [
                    { name: 'Republic of the Philippines', type: 'primary', description: 'An independent republic allied with the US.' },
                    { name: 'Republic of China (Taiwan)', type: 'primary', description: 'The KMT-led government, claiming to be the sole ruler of China.' },
                    { name: 'US Military', type: 'secondary', description: 'Maintaining large bases in the Philippines and a defense pact with Taiwan.' },
                    { name: 'Communist/Separatist Rebels', type: 'rebel', description: 'The NPA in the Philippines and Moro groups.' }
                ],
                structureNames: {
                    fortress: ['Clark Air Base', 'Subic Naval Base', 'Kinmen Island Fortifications'],
                    factory: ['Export Processing Zone', 'Electronics Assembly Plant', 'Textile Mill'],
                    trading_post: ['Manila International Airport', 'Kaohsiung Harbor', 'Financial District'],
                    holy_site: ['People Power Monument', 'Chiang Kai-shek Memorial Hall'],
                    palace: ['Batasang Pambansa Complex', 'Presidential Office Building (Taipei)']
                },
                courtRoles: {
                    palace: ['President (PH)', 'President (ROC)', 'Military Chief of Staff', 'Technocrat']
                }
            },
            "1970s": {
                dominantPower: 'Authoritarian Rule',
                dominantPowerDescription: 'Ferdinand Marcos declares martial law in the Philippines, while the Kuomintang\'s one-party state continues its "White Terror" period in Taiwan, both regimes backed by the United States.',
                eraContextSentence: 'an era of dictatorship, where economic development is paired with political repression.',
                allegianceGroups: [
                    { name: 'Marcos Regime (Philippines)', type: 'primary', description: 'Authoritarian government under martial law.' },
                    { name: 'Kuomintang (Taiwan)', type: 'primary', description: 'One-party state under Chiang Ching-kuo.' },
                    { name: 'Anti-Marcos Opposition', type: 'rebel', description: 'Political rivals, students, and armed rebels.' },
                    { name: 'Dangwai Movement (Taiwan)', type: 'rebel', description: 'Pro-democracy activists operating outside the KMT.' }
                ]
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Geopolitical Flashpoint',
                dominantPowerDescription: 'Taiwan stands as a democratic, high-tech powerhouse at the center of US-China tensions, while the Philippines navigates its strategic position between the two superpowers and faces climate change threats.',
                eraContextSentence: 'an era of semiconductor diplomacy, where the fate of nations hinges on silicon chips and naval patrols.',
                allegianceGroups: [
                    { name: 'Republic of China (Taiwan)', type: 'primary', description: 'Defending its sovereignty amid Chinese pressure.' },
                    { name: 'Republic of the Philippines', type: 'primary', description: 'Modernizing its military and balancing alliances.' },
                    { name: 'People\'s Republic of China', type: 'rebel', description: 'Asserting territorial claims with military and economic power.' },
                    { name: 'United States', type: 'secondary', description: 'A key security partner upholding regional stability.' },
                    { name: 'Global Tech Giants', type: 'trade_company', description: 'Heavily reliant on Taiwanese semiconductor manufacturing.' }
                ],
                structureNames: {
                    fortress: ['Patriot Missile Battery', 'Naval Base with US Access', 'Cyber Warfare Command'],
                    factory: ['Semiconductor Gigafab (TSMC/UMC)', 'Renewable Energy Farm', 'Defense Industry Complex'],
                    trading_post: ['Taoyuan International Airport', 'Subic Bay Freeport Zone', 'Data Center Hub'],
                    holy_site: ['Democracy Memorial', 'Climate Resilience Shrine', 'Indigenous Culture Center'],
                    palace: ['Presidential Palace (Taipei)', 'Malacañang Palace (Manila)']
                }
            }
        },
        "Western Ghats and Konkan": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Satavahana-Kalinga Influence',
                dominantPowerDescription: 'Ancient trade routes through the Western Ghats connect interior kingdoms with Arabian Sea ports, fostering cosmopolitan cultures.',
                eraContextSentence: 'an age of monsoon traders, where the Ghats guard secrets of spices and gold.',
                allegianceGroups: [
                    { name: 'Satavahana Traders', type: 'primary', description: 'Controlling mountain passes.' },
                    { name: 'Coastal Principalities', type: 'secondary', description: 'Small port kingdoms.' },
                    { name: 'Roman Merchants', type: 'trade_company', description: 'Seeking pepper and spices.' },
                    { name: 'Buddhist Monks', type: 'religious', description: 'Establishing cave monasteries.' }
                ],
                structureNames: {
                    fortress: ['Hill Fort', 'Coastal Watchtower'],
                    mill: ['Spice Garden', 'Boat Building Yard'],
                    holy_site: ['Rock-cut Caves', 'Coastal Temple', 'Jewish Synagogue'],
                    palace: ['Chieftain\'s Residence'],
                    trading_post: ['Muziris Port', 'Mountain Pass Market']
                },
                courtRoles: {
                    palace: ['Raja', 'Sarthavaha (Caravan Leader)', 'Port Master']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Kadamba-Rashtrakuta Dynasties',
                dominantPowerDescription: 'Regional powers control strategic ports and passes while Arab traders establish permanent communities on the coast.',
                eraContextSentence: 'an age of Arab connection, where monsoon winds bring Islam to Malabar.',
                allegianceGroups: [
                    { name: 'Kadamba Dynasty', type: 'primary', description: 'Rulers of Konkan region.' },
                    { name: 'Arab Traders', type: 'trade_company', description: 'Establishing Mappila communities.' },
                    { name: 'Alupa Dynasty', type: 'secondary', description: 'Coastal Karnataka rulers.' },
                    { name: 'Hoysala Influence', type: 'secondary', description: 'Interior Karnataka power.' }
                ],
                structureNames: {
                    fortress: ['Laterite Fort', 'Coastal Defense'],
                    mill: ['Coconut Processing', 'Ship Building'],
                    holy_site: ['Shiva Temple', 'Juma Masjid', 'Jain Basadi'],
                    palace: ['Coastal Palace', 'Hill Station'],
                    trading_post: ['Arab Trading Post', 'Spice Warehouse']
                },
                courtRoles: {
                    palace: ['Raya', 'Nakhuda (Ship Captain)', 'Mappila Chief']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Portuguese Estado da Índia & Maratha Rise',
                dominantPowerDescription: 'The Portuguese establish a maritime empire based in Goa, controlling the spice trade, while the formidable Maratha power emerges from the Ghats, challenging both the Mughals and the Sultanates.',
                eraContextSentence: 'an era of cannons and cavalry, where European forts dot the coast and Maratha warriors rise in the hills.',
                allegianceGroups: [
                    { name: 'Portuguese Estado da Índia', type: 'primary', description: 'Colonial power controlling key ports like Goa and Mumbai.' },
                    { name: 'Maratha Confederacy', type: 'rebel', description: 'A rising Hindu power under Shivaji, mastering guerrilla warfare in the Ghats.' },
                    { name: 'Bijapur Sultanate', type: 'secondary', description: 'Deccan Sultanate controlling much of the Konkan coast before Maratha and Portuguese gains.' },
                    { name: 'Zamorin of Calicut', type: 'secondary', description: 'Hindu ruler on the Malabar coast resisting Portuguese dominance.' }
                ],
                structureNames: {
                    fortress: ['Portuguese Fort', 'Maratha Hill Fort', 'Naval Base'],
                    mill: ['Spice Plantation', 'Shipyard', 'Cashew Farm'],
                    holy_site: ['Catholic Basilica', 'Hindu Temple', 'Synagogue'],
                    palace: ['Viceroy\'s Palace', 'Maratha Durbar'],
                    trading_post: ['Goa Harbor', 'Spice Market', 'Portuguese Factory']
                },
                courtRoles: {
                    palace: ['Portuguese Viceroy', 'Peshwa', 'Sardar', 'Zamorin']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'British Bombay Presidency & Princely States',
                dominantPowerDescription: 'The British Empire solidifies its control through the Bombay Presidency, a major hub for trade and military power, while integrating coastal princely states and suppressing the last of the Maratha power.',
                eraContextSentence: 'an era of steamships and railways, where Bombay becomes the gateway to British India.',
                allegianceGroups: [
                    { name: 'British Raj (Bombay Presidency)', type: 'primary', description: 'The center of British power in Western India.' },
                    { name: 'Princely States (Kolhapur, Travancore)', type: 'secondary', description: 'Local rulers maintaining nominal autonomy under British suzerainty.' },
                    { name: 'Parsi Merchants', type: 'trade_company', description: 'A prominent community in Mumbai, leading in trade, industry, and shipbuilding.' },
                    { name: 'Mappila Rebels', type: 'rebel', description: 'Periodic uprisings by Muslim communities on the Malabar coast against British rule.' }
                ],
                structureNames: {
                    fortress: ['British Cantonment', 'Coastal Battery'],
                    mill: ['Cotton Textile Mill', 'Coir Factory', 'Coffee Plantation'],
                    factory: ['Railway Terminus', 'Dockyard'],
                    trading_post: ['Bombay Port', 'VT Station', 'Commercial District'],
                    palace: ['Governor\'s House', 'Maharaja\'s Palace'],
                    holy_site: ['Gothic Church', 'Fire Temple', 'Hindu Temple']
                },
                courtRoles: {
                    palace: ['Governor of Bombay', 'Maharaja/Raja', 'Dewan', 'Industrialist']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Republic of India',
                dominantPowerDescription: 'The region, particularly Mumbai, becomes India\'s financial capital and the hub of the Bollywood film industry. Kerala develops a unique political identity with strong social indicators.',
                eraContextSentence: 'an era of stock markets and cinema, where the dreams of modern India are made.',
                allegianceGroups: [
                    { name: 'Indian State Governments (MH, GA, KL)', type: 'primary', description: 'The modern states of Maharashtra, Goa, and Kerala.' },
                    { name: 'Bollywood Film Industry', type: 'trade_company', description: 'The powerful and influential Hindi cinema hub.' },
                    { name: 'Underworld Syndicates', type: 'rebel', description: 'Criminal networks operating in major cities like Mumbai.' },
                    { name: 'Communist Parties (Kerala)', type: 'secondary', description: 'A major political force in Kerala, often forming the government.' }
                ],
                structureNames: {
                    fortress: ['Naval Command HQ', 'Police Headquarters'],
                    factory: ['Film City', 'IT Park', 'Pharmaceutical Plant'],
                    trading_post: ['Mumbai Stock Exchange', 'Jawaharlal Nehru Port', 'International Airport'],
                    holy_site: ['Siddhivinayak Temple', 'Mount Mary Basilica', 'Sabarimala Temple'],
                    palace: ['State Assembly', 'Governor\'s Residence']
                },
                courtRoles: {
                    palace: ['Chief Minister', 'Governor', 'Police Commissioner', 'Film Director']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Republic of India',
                dominantPowerDescription: 'Mumbai and the Konkan coast face extreme climate risks from rising sea levels and intensified monsoons, driving massive investment in climate resilience and transforming the region into a hub for green finance and technology.',
                eraContextSentence: 'an era of sea walls and green bonds, where India\'s financial heartland battles the rising tide.',
                allegianceGroups: [
                    { name: 'Indian State Governments', type: 'primary', description: 'Implementing massive climate adaptation projects.' },
                    { name: 'Green Technology Firms', type: 'trade_company', description: 'Companies specializing in climate resilience, renewable energy, and sustainable infrastructure.' },
                    { name: 'Coastal Communities', type: 'rebel', description: 'Fishing villages and urban slum dwellers displaced by flooding and development.' },
                    { name: 'International Climate Funds', type: 'secondary', description: 'Global organizations providing finance for adaptation projects.' }
                ],
                structureNames: {
                    fortress: ['Coastal Defense System', 'Climate Monitoring Center'],
                    factory: ['Climate Adaptation Tech Hub', 'Desalination Plant', 'EV Manufacturing'],
                    trading_post: ['Green Stock Exchange', 'Smart Port', 'Sustainable Tourism Hub'],
                    holy_site: ['Climate Memorial', 'Eco-Tourism Ashram', 'Resilient Temple'],
                    mining_colony: ['Offshore Wind Farm', 'Tidal Energy Station']
                }
            }
        },
        "Himalayas and Northeast": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Tibetan Kingdoms and Tribal States',
                dominantPowerDescription: 'High mountain kingdoms and tribal confederations control strategic passes and trade routes, developing unique Buddhist and animist traditions.',
                eraContextSentence: 'an age of mountain kings, where high passes guard the roof of the world.',
                allegianceGroups: [
                    { name: 'Tibetan Kingdoms', type: 'primary', description: 'High altitude Buddhist rulers.' },
                    { name: 'Tribal Confederations', type: 'secondary', description: 'Hill people controlling valleys.' },
                    { name: 'Silk Road Traders', type: 'trade_company', description: 'Trans-Himalayan merchants.' },
                    { name: 'Bon Religious Orders', type: 'religious', description: 'Ancient mountain spiritual traditions.' }
                ],
                structureNames: {
                    fortress: ['Mountain Dzong', 'Pass Fortress'],
                    mill: ['Yak Herding Station', 'Prayer Wheel Mill'],
                    holy_site: ['Mountain Monastery', 'Sacred Lake', 'Sky Burial Site'],
                    palace: ['Potala-style Palace', 'Chieftain\'s Residence'],
                    trading_post: ['Pass Market', 'Caravan Stop']
                },
                courtRoles: {
                    palace: ['Gyal-po', 'Depa', 'Chipon', 'Lama Advisor']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Tibetan Empire and Ahom Kingdom',
                dominantPowerDescription: 'The Tibetan Empire extends influence over the Himalayas while the Ahom Kingdom rises in Assam, both creating sophisticated Buddhist administrations.',
                eraContextSentence: 'an age of dharma rulers, where Buddhist kingdoms span from Tibet to Assam.',
                allegianceGroups: [
                    { name: 'Tibetan Empire', type: 'primary', description: 'Powerful Buddhist empire from Lhasa.' },
                    { name: 'Ahom Kingdom', type: 'primary', description: 'Tai dynasty ruling Assam.' },
                    { name: 'Pala Alliance', type: 'secondary', description: 'Buddhist connections to Bengal.' },
                    { name: 'Mountain Monasteries', type: 'religious', description: 'Powerful Buddhist institutions.' }
                ],
                structureNames: {
                    fortress: ['Tibetan Dzong', 'Ahom Stockade'],
                    mill: ['Monastery Workshop', 'Rice Terraces'],
                    holy_site: ['Jokhang Temple', 'Kamakhya Temple', 'Mountain Gompa'],
                    palace: ['Potala Palace', 'Ahom Royal Palace'],
                    trading_post: ['Lhasa Market', 'Assam River Port']
                },
                courtRoles: {
                    palace: ['Dalai Lama', 'Regent', 'Ahom Swargadeo', 'Borgohain']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Dalai Lama\'s Tibet and Ahom Kingdom',
                dominantPowerDescription: 'Tibet under the Dalai Lamas becomes a theocratic state while the Ahom Kingdom successfully resists Mughal expansion into the northeast.',
                eraContextSentence: 'an era of theocratic rule, where lama-kings govern mountain realms.',
                allegianceGroups: [
                    { name: 'Gelug Theocracy', type: 'primary', description: 'Dalai Lama\'s religious government.' },
                    { name: 'Ahom Kingdom', type: 'primary', description: 'Independent Tai dynasty resisting Mughals.' },
                    { name: 'Mughal Invaders', type: 'rebel', description: 'Failed attempts to conquer Assam.' },
                    { name: 'Mongolian Protectors', type: 'secondary', description: 'Mongol patrons of Tibetan Buddhism.' }
                ],
                structureNames: {
                    fortress: ['Potala Fortress', 'Ahom Hill Fort'],
                    mill: ['Monastery Estate', 'Tea Garden'],
                    holy_site: ['Gelug Monastery', 'Sakti Pitha', 'Bon Temple'],
                    palace: ['Dalai Lama Palace', 'Ahom Royal Seat'],
                    trading_post: ['Tibet-Mongolia Route', 'Brahmaputra Port']
                },
                courtRoles: {
                    palace: ['Dalai Lama', 'Regent', 'Kashag Council', 'Ahom Minister']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'British Protectorates and Chinese Expansion',
                dominantPowerDescription: 'British establish protectorates over Himalayan states while China asserts control over Tibet, transforming traditional societies.',
                eraContextSentence: 'an era of imperial competition, where great powers partition the roof of the world.',
                allegianceGroups: [
                    { name: 'British Indian Empire', type: 'primary', description: 'Protectorates over hill states.' },
                    { name: 'Qing Dynasty', type: 'primary', description: 'Chinese control over Tibet.' },
                    { name: 'Himalayan Monarchies', type: 'secondary', description: 'Nepal, Bhutan, Sikkim under protection.' },
                    { name: 'Tea Planters', type: 'trade_company', description: 'British plantation interests.' }
                ],
                structureNames: {
                    fortress: ['British Residency', 'Chinese Garrison'],
                    mill: ['Tea Plantation', 'Hill Station'],
                    factory: ['Tea Processing Factory', 'Border Post'],
                    trading_post: ['Darjeeling Market', 'Tibet Trade Mart'],
                    palace: ['Maharaja\'s Palace', 'British Governor\'s House'],
                    holy_site: ['Buddhist Monastery', 'Hindu Temple']
                },
                courtRoles: {
                    palace: ['British Resident', 'Himalayan Maharaja', 'Chinese Amban', 'Tea Estate Manager']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Republic of India and People\'s Republic of China',
                dominantPowerDescription: 'The region becomes a flashpoint between India and China, with disputed borders and insurgencies in the northeast states.',
                eraContextSentence: 'an era of border tensions, where mountain peaks become battlegrounds.',
                allegianceGroups: [
                    { name: 'Government of India', type: 'primary', description: 'Controlling seven sister states.' },
                    { name: 'People\'s Republic of China', type: 'primary', description: 'Occupying Tibet and claiming territory.' },
                    { name: 'Insurgent Groups', type: 'rebel', description: 'Ethnic separatist movements.' },
                    { name: 'Tibetan Government in Exile', type: 'secondary', description: 'Based in Dharamshala.' }
                ],
                structureNames: {
                    fortress: ['Army Base', 'Border Outpost'],
                    factory: ['Hydroelectric Plant', 'Border Roads Project'],
                    trading_post: ['Nathu La Pass', 'Northeast State Capital'],
                    holy_site: ['Dalai Lama Residence', 'Kamakhya Temple', 'Buddhist Monastery'],
                    palace: ['Governor\'s House', 'State Assembly']
                },
                courtRoles: {
                    palace: ['Chief Minister', 'Governor', 'Army Commander', 'Dalai Lama']
                }
            },
            "1962": {
                dominantPower: 'Sino-Indian War',
                dominantPowerDescription: 'China and India fight a brief but decisive war over border disputes, with China gaining control of Aksai Chin.',
                eraContextSentence: 'an era of high-altitude warfare, where neighbors become enemies over mountain lines.',
                allegianceGroups: [
                    { name: 'People\'s Liberation Army', type: 'primary', description: 'Chinese forces advancing rapidly.' },
                    { name: 'Indian Army', type: 'primary', description: 'Defending against Chinese offensive.' },
                    { name: 'Local Populations', type: 'secondary', description: 'Caught between competing armies.' },
                    { name: 'International Community', type: 'secondary', description: 'Attempting mediation.' }
                ]
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Republic of India and People\'s Republic of China',
                dominantPowerDescription: 'Climate change threatens Himalayan glaciers while India and China compete for water resources and strategic advantage.',
                eraContextSentence: 'an era of melting glaciers, where water becomes the new currency of power.',
                allegianceGroups: [
                    { name: 'Government of India', type: 'primary', description: 'Defending water interests and territory.' },
                    { name: 'People\'s Republic of China', type: 'primary', description: 'Controlling upstream water sources.' },
                    { name: 'Climate Refugees', type: 'secondary', description: 'Displaced by environmental change.' },
                    { name: 'International Water Authority', type: 'trade_company', description: 'Managing transboundary rivers.' }
                ],
                structureNames: {
                    fortress: ['High-Altitude Military Base', 'Climate Monitoring Station'],
                    factory: ['Hydroelectric Megaproject', 'Border Infrastructure Hub'],
                    trading_post: ['Himalayan Economic Corridor', 'Climate Adaptation Center'],
                    holy_site: ['Pilgrimage Circuit', 'Environmental Temple', 'Peace Memorial'],
                    mining_colony: ['Rare Earth Mine', 'Glacier Water Harvesting']
                }
            }
        },
        "Central India": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Tribal Kingdoms and Forest States',
                dominantPowerDescription: 'The Vindhya and Satpura ranges shelter diverse tribal kingdoms and early urban centers, forming a buffer between north and south India.',
                eraContextSentence: 'an age of forest kingdoms, where tribal chiefs rule dense woodlands.',
                allegianceGroups: [
                    { name: 'Tribal Confederations', type: 'primary', description: 'Forest dwelling communities.' },
                    { name: 'Kalinga Kingdom', type: 'secondary', description: 'Eastern coastal power.' },
                    { name: 'Satavahana Influence', type: 'secondary', description: 'Deccan connections.' },
                    { name: 'Buddhist Monasteries', type: 'religious', description: 'Cave complexes in hills.' }
                ],
                structureNames: {
                    fortress: ['Hill Fort', 'Forest Stockade'],
                    mill: ['Tribal Workshop', 'Forest Product Center'],
                    holy_site: ['Cave Temple', 'Sacred Grove', 'Stupa'],
                    palace: ['Tribal Chief\'s Residence'],
                    trading_post: ['Forest Market', 'River Crossing']
                },
                courtRoles: {
                    palace: ['Tribal Chief', 'War Leader', 'Forest Priest', 'Trade Elder']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Chandela and Paramara Dynasties',
                dominantPowerDescription: 'Rajput dynasties rule from magnificent temple cities like Khajuraho, creating a unique synthesis of power and devotion.',
                eraContextSentence: 'an age of temple builders, where stone sculptures celebrate divine and human love.',
                allegianceGroups: [
                    { name: 'Chandela Dynasty', type: 'primary', description: 'Builders of Khajuraho temples.' },
                    { name: 'Paramara Dynasty', type: 'primary', description: 'Rulers of Malwa plateau.' },
                    { name: 'Kachchhapaghata Dynasty', type: 'secondary', description: 'Gwalior fort controllers.' },
                    { name: 'Jain Communities', type: 'religious', description: 'Wealthy merchant-patrons.' }
                ],
                structureNames: {
                    fortress: ['Gwalior Fort', 'Hill Citadel'],
                    mill: ['Temple Workshop', 'Artisan Quarter'],
                    holy_site: ['Khajuraho Temple', 'Jain Temple', 'Shiva Shrine'],
                    palace: ['Rajput Palace', 'Fort Palace'],
                    trading_post: ['Malwa Market', 'Pilgrimage Center']
                },
                courtRoles: {
                    palace: ['Raja', 'Mantri', 'Senapati', 'Temple Architect']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Mughal Province and Maratha Expansion',
                dominantPowerDescription: 'Central India becomes a contested region between Mughal administration and rising Maratha power, with local rulers playing both sides.',
                eraContextSentence: 'an era of shifting loyalties, where local rulers navigate between Mughal and Maratha power.',
                allegianceGroups: [
                    { name: 'Mughal Empire', type: 'primary', description: 'Imperial governors and administrators.' },
                    { name: 'Maratha Confederacy', type: 'primary', description: 'Expanding Hindu power from the Deccan.' },
                    { name: 'Local Rajput Chiefs', type: 'secondary', description: 'Traditional rulers seeking autonomy.' },
                    { name: 'Bundela Ranas', type: 'secondary', description: 'Local dynasty of Bundelkhand.' }
                ],
                structureNames: {
                    fortress: ['Mughal Fort', 'Maratha Stronghold'],
                    mill: ['Revenue Collection Center', 'Military Workshop'],
                    holy_site: ['Mughal Mosque', 'Hindu Temple', 'Jain Shrine'],
                    palace: ['Mughal Palace', 'Maratha Residence'],
                    trading_post: ['Imperial Bazaar', 'Maratha Market']
                },
                courtRoles: {
                    palace: ['Mughal Subahdar', 'Maratha Peshwa', 'Local Raja', 'Revenue Collector']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'British Central Provinces',
                dominantPowerDescription: 'British create the Central Provinces to administer the region\'s forests and minerals, while princely states maintain nominal independence.',
                eraContextSentence: 'an era of resource extraction, where British railways carry away forest wealth.',
                allegianceGroups: [
                    { name: 'British Raj', type: 'primary', description: 'Colonial administration exploiting resources.' },
                    { name: 'Princely States', type: 'secondary', description: 'Nominally independent rulers.' },
                    { name: 'Adivasi Resistance', type: 'rebel', description: 'Tribal uprisings against colonial rule.' },
                    { name: 'Forest Department', type: 'trade_company', description: 'Controlling timber extraction.' }
                ],
                structureNames: {
                    fortress: ['British Cantonment', 'Princely Army Base'],
                    mill: ['Timber Mill', 'Cotton Gin'],
                    factory: ['Railway Workshop', 'Mining Operation'],
                    mining_colony: ['Coal Mine', 'Iron Ore Mine'],
                    trading_post: ['Railway Junction', 'Forest Depot'],
                    palace: ['British Residency', 'Maharaja\'s Palace']
                },
                courtRoles: {
                    palace: ['Chief Commissioner', 'British Resident', 'Maharaja', 'Forest Officer']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Republic of India',
                dominantPowerDescription: 'Central Indian states struggle with Naxalite insurgency, tribal rights, and industrial development while managing rich mineral resources.',
                eraContextSentence: 'an era of red corridors, where Maoist rebels challenge state power in tribal forests.',
                allegianceGroups: [
                    { name: 'State Governments', type: 'primary', description: 'MP, Chhattisgarh, and Jharkhand administrations.' },
                    { name: 'Naxalite Groups', type: 'rebel', description: 'Maoist insurgency in tribal areas.' },
                    { name: 'Mining Corporations', type: 'trade_company', description: 'Extracting coal, iron, and bauxite.' },
                    { name: 'Adivasi Rights Groups', type: 'secondary', description: 'Tribal communities fighting displacement.' }
                ],
                structureNames: {
                    fortress: ['CRPF Base', 'State Police Headquarters'],
                    factory: ['Steel Plant', 'Aluminum Refinery', 'Power Plant'],
                    mining_colony: ['Coal Mining Complex', 'Iron Ore Mine'],
                    trading_post: ['Industrial Hub', 'Tribal Market', 'Railway Junction'],
                    holy_site: ['Tribal Sacred Grove', 'Ancient Temple', 'Pilgrimage Circuit'],
                    palace: ['State Secretariat', 'Raj Bhavan']
                },
                courtRoles: {
                    palace: ['Chief Minister', 'Governor', 'Police Chief', 'Tribal Welfare Secretary']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Republic of India',
                dominantPowerDescription: 'Central India becomes India\'s green energy hub while managing tribal displacement from mega-projects and climate-induced migration.',
                eraContextSentence: 'an era of green transition, where solar farms replace coal mines in tribal lands.',
                allegianceGroups: [
                    { name: 'State Governments', type: 'primary', description: 'Managing renewable energy transition.' },
                    { name: 'Renewable Energy Corps', type: 'trade_company', description: 'Solar and wind power giants.' },
                    { name: 'Climate Displaced Tribes', type: 'rebel', description: 'Indigenous communities losing forests.' },
                    { name: 'Carbon Credit Traders', type: 'trade_company', description: 'International environmental finance.' }
                ],
                structureNames: {
                    fortress: ['Green Security Force Base', 'Environmental Monitoring Station'],
                    factory: ['Solar Panel Manufacturing', 'Battery Recycling Plant', 'Green Hydrogen Hub'],
                    mining_colony: ['Lithium Extraction', 'Rare Earth Processing'],
                    trading_post: ['Carbon Credit Exchange', 'Renewable Energy Market'],
                    holy_site: ['Forest Temple', 'Climate Memorial', 'Tribal Heritage Center']
                }
            }
        },

        "Gangetic Plain": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Mauryan Empire',
                dominantPowerDescription: 'The first great pan-Indian empire emerges from Magadha, unifying the Gangetic plains under Chandragupta and reaching its zenith under Ashoka.',
                eraContextSentence: 'an age of imperial unity, where the sacred Ganges witnesses the rise of India\'s first great empire.',
                allegianceGroups: [
                    { name: 'Mauryan Empire', type: 'primary', description: 'Imperial dynasty ruling from Pataliputra.' },
                    { name: 'Magadha Kingdom', type: 'primary', description: 'Core kingdom and imperial heartland.' },
                    { name: 'Kosala Kingdom', type: 'secondary', description: 'Ancient kingdom along the Ganges.' },
                    { name: 'Videha Republic', type: 'secondary', description: 'Republican confederation in Bihar.' }
                ],
                structureNames: {
                    fortress: ['Pataliputra Citadel', 'Garrison Fort'],
                    mill: ['Royal Granary', 'Artisan Workshop'],
                    holy_site: ['Buddhist Stupa', 'Brahmanical Temple', 'Jain Shrine'],
                    palace: ['Mauryan Palace', 'Provincial Court'],
                    trading_post: ['Royal Market', 'River Wharf']
                },
                courtRoles: {
                    palace: ['Chakravartin', 'Mahamatya', 'Senapati', 'Purohita', 'Yukta']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Gupta Empire',
                dominantPowerDescription: 'The Classical Age of India flourishes under the Guptas, with unprecedented achievements in arts, sciences, and literature centered in the Gangetic heartland.',
                eraContextSentence: 'an age of golden splendor, where the Gupta court becomes the beacon of Hindu civilization.',
                allegianceGroups: [
                    { name: 'Gupta Empire', type: 'primary', description: 'Classical Indian empire at its zenith.' },
                    { name: 'Harsha\'s Empire', type: 'primary', description: 'Later empire reviving Gupta glory.' },
                    { name: 'Hun Invasions', type: 'rebel', description: 'Central Asian tribes threatening the plains.' },
                    { name: 'Feudal Rajas', type: 'secondary', description: 'Local rulers acknowledging imperial supremacy.' }
                ],
                structureNames: {
                    fortress: ['Imperial Citadel', 'Border Garrison'],
                    mill: ['Royal Workshop', 'Craft Guild'],
                    holy_site: ['Nalanda University', 'Vishnu Temple', 'Buddhist Monastery'],
                    palace: ['Gupta Rajasabha', 'Feudal Court'],
                    trading_post: ['Royal Mint', 'Silk Road Station']
                },
                courtRoles: {
                    palace: ['Maharajadhiraja', 'Mahadandanayaka', 'Kumaramatya', 'Sandhivigrahika'],
                    holy_site: ['Acharya', 'Purohita', 'Buddhist Abbot']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Mughal Empire',
                dominantPowerDescription: 'The Gangetic Plain becomes the heartland of Mughal India, with Agra and Delhi as twin capitals of a vast Islamic empire blending Persian and Indian traditions.',
                eraContextSentence: 'an era of Mughal grandeur, where Indo-Islamic culture reaches its magnificent peak.',
                allegianceGroups: [
                    { name: 'Mughal Empire', type: 'primary', description: 'Central imperial administration.' },
                    { name: 'Rajput Kingdoms', type: 'secondary', description: 'Allied Hindu principalities.' },
                    { name: 'Sikh Gurus', type: 'secondary', description: 'Rising religious community in Punjab.' },
                    { name: 'Maratha Confederacy', type: 'rebel', description: 'Deccan power challenging Mughal hegemony.' }
                ],
                structureNames: {
                    fortress: ['Red Fort', 'Mughal Qila'],
                    mill: ['Imperial Karkhana', 'Weaving Center'],
                    holy_site: ['Jama Masjid', 'Taj Mahal', 'Hindu Mandir'],
                    palace: ['Diwan-i-Khas', 'Zenana'],
                    trading_post: ['Imperial Bazaar', 'Caravanserai']
                },
                courtRoles: {
                    palace: ['Badshah', 'Wazir', 'Mir Bakshi', 'Sadr-us-Sudur', 'Diwan']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'British Raj',
                dominantPowerDescription: 'The Gangetic Plain becomes the administrative and military heart of British India, with the Grand Trunk Road and railways transforming the ancient heartland.',
                eraContextSentence: 'an era of imperial railways, where British steel tracks crisscross the sacred plains.',
                allegianceGroups: [
                    { name: 'British Raj', type: 'primary', description: 'Colonial government with twin capitals.' },
                    { name: 'Indian National Congress', type: 'secondary', description: 'Growing independence movement.' },
                    { name: 'Muslim League', type: 'secondary', description: 'Separate Muslim political organization.' },
                    { name: 'Revolutionary Societies', type: 'rebel', description: 'Armed resistance groups.' }
                ],
                structureNames: {
                    fortress: ['British Cantonment', 'Police Lines'],
                    factory: ['Railway Workshop', 'Cotton Mill', 'Sugar Refinery'],
                    mill: ['Flour Mill', 'Rice Mill'],
                    trading_post: ['Railway Station', 'Civil Lines', 'Cloth Market'],
                    palace: ['Government House', 'Collector\'s Residence'],
                    holy_site: ['Colonial Church', 'Reformed Temple']
                },
                courtRoles: {
                    palace: ['Viceroy', 'Chief Commissioner', 'District Collector', 'Deputy Commissioner']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Republic of India',
                dominantPowerDescription: 'Post-independence India\'s political heartland struggles with poverty, caste politics, and development challenges while remaining central to national democracy.',
                eraContextSentence: 'an era of democratic awakening, where the Gangetic heartland shapes India\'s political destiny.',
                allegianceGroups: [
                    { name: 'Government of India', type: 'primary', description: 'Federal and state governments.' },
                    { name: 'Regional Parties', type: 'secondary', description: 'Caste and community-based politics.' },
                    { name: 'Naxalite Groups', type: 'rebel', description: 'Maoist insurgency in eastern regions.' },
                    { name: 'Hindu Nationalist Organizations', type: 'secondary', description: 'Ideological movements.' }
                ],
                structureNames: {
                    fortress: ['Police Headquarters', 'Army Base'],
                    factory: ['Steel Plant', 'Fertilizer Factory', 'IT Park'],
                    mill: ['Rice Mill', 'Sugar Mill'],
                    trading_post: ['Railway Junction', 'Wholesale Market', 'Industrial Estate'],
                    palace: ['State Assembly', 'Raj Bhavan'],
                    holy_site: ['Ram Mandir', 'Gurdwara', 'Modern Mosque']
                },
                courtRoles: {
                    palace: ['Chief Minister', 'Governor', 'District Magistrate', 'Police Superintendent']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Republic of India',
                dominantPowerDescription: 'The Gangetic Plain confronts massive internal migration from climate change.',
                eraContextSentence: 'an era of climate crisis, where the sacred Ganges basin adapts to a changing world.',
                allegianceGroups: [
                    { name: 'Federal Government', type: 'primary', description: 'Managing climate adaptation programs.' },
                    { name: 'Climate Migration Agency', type: 'trade_company', description: 'Managing internal population displacement.' },
                    { name: 'River Restoration Councils', type: 'secondary', description: 'Ganga cleanup and flood management.' },

                ],
                structureNames: {
                    fortress: ['Climate Security Base', 'Flood Control Center'],
                    factory: ['Solar Panel Manufacturing', 'Water Recycling Plant', 'Vertical Farm'],
                    trading_post: ['Climate Refugee Center', 'Green Energy Exchange'],
                    holy_site: ['Restored Ganga Ghat', 'Climate Memorial', 'Digital Ashram']
                }
            }
        },

        "Deccan Plateau": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Satavahana Dynasty',
                dominantPowerDescription: 'The Satavahanas rule the Deccan for over 400 years, creating a stable empire that bridges North and South India through trade and cultural exchange.',
                eraContextSentence: 'an age of Deccan unity, where the Satavahanas forge the first great South Indian empire.',
                allegianceGroups: [
                    { name: 'Satavahana Empire', type: 'primary', description: 'Long-ruling Deccan dynasty.' },
                    { name: 'Western Kshatraps', type: 'secondary', description: 'Saka rulers in western regions.' },
                    { name: 'Ikshvaku Dynasty', type: 'secondary', description: 'Successors in Andhra region.' },
                    { name: 'Roman Traders', type: 'trade_company', description: 'Mediterranean merchants seeking spices.' }
                ],
                structureNames: {
                    fortress: ['Hill Fort', 'Rock Citadel'],
                    mill: ['Royal Workshop', 'Mining Settlement'],
                    holy_site: ['Buddhist Chaitya', 'Hindu Cave Temple', 'Jain Basadi'],
                    palace: ['Royal Court', 'Summer Palace'],
                    trading_post: ['Caravan Stop', 'Port Market']
                },
                courtRoles: {
                    palace: ['Maharaja', 'MahaSenapati', 'Maharathi', 'Mahabhoja']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Chalukya-Rashtrakuta Dynasties',
                dominantPowerDescription: 'The Western Chalukyas and Rashtrakutas create architectural marvels and extensive trade networks, making the Deccan a center of art and learning.',
                eraContextSentence: 'an age of architectural glory, where Deccan kings carve temples from living rock.',
                allegianceGroups: [
                    { name: 'Western Chalukya Empire', type: 'primary', description: 'Powerful Deccan dynasty.' },
                    { name: 'Rashtrakuta Empire', type: 'primary', description: 'Successors expanding across India.' },
                    { name: 'Kakatiya Dynasty', type: 'secondary', description: 'Eastern Deccan power in Telangana.' },
                    { name: 'Yadava Dynasty', type: 'secondary', description: 'Maharashtra-based kingdom.' }
                ],
                structureNames: {
                    fortress: ['Devagiri Fort', 'Mountain Citadel'],
                    mill: ['Step Well', 'Textile Center'],
                    holy_site: ['Ellora Caves', 'Kailasa Temple', 'Hoysaleshwara Temple'],
                    palace: ['Royal Durbar', 'Queen\'s Palace'],
                    trading_post: ['Diamond Market', 'Spice Bazaar']
                },
                courtRoles: {
                    palace: ['Maharajadhiraja', 'Mahasamanta', 'Mahapradhana', 'Dharmadhikari'],
                    holy_site: ['Royal Guru', 'Temple Architect', 'Court Poet']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Deccan Sultanates',
                dominantPowerDescription: 'Five Deccan Sultanates emerge after the Bahmani Kingdom\'s collapse, creating a unique Indo-Islamic culture while resisting Mughal expansion.',
                eraContextSentence: 'an era of Deccan defiance, where Muslim sultans forge a distinctive culture independent of Delhi.',
                allegianceGroups: [
                    { name: 'Adil Shahi (Bijapur)', type: 'primary', description: 'Powerful sultanate with advanced artillery.' },
                    { name: 'Qutb Shahi (Golconda)', type: 'primary', description: 'Diamond-rich sultanate.' },
                    { name: 'Nizam Shahi (Ahmadnagar)', type: 'secondary', description: 'Northwestern sultanate.' },
                    { name: 'Maratha Confederacy', type: 'rebel', description: 'Rising Hindu power under Shivaji.' }
                ],
                structureNames: {
                    fortress: ['Golconda Fort', 'Bijapur Citadel'],
                    mill: ['Royal Karkhana', 'Diamond Cutting Workshop'],
                    holy_site: ['Gol Gumbaz', 'Charminar', 'Hindu Temple'],
                    palace: ['Sultan\'s Palace', 'Durbar Hall'],
                    trading_post: ['Diamond Market', 'Spice Exchange', 'Portuguese Factory']
                },
                courtRoles: {
                    palace: ['Sultan', 'Wazir', 'Mir Jumla', 'Kotwal']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Hyderabad State',
                dominantPowerDescription: 'The Nizam of Hyderabad rules the largest princely state, balancing British paramountcy with internal autonomy while modernizing administration.',
                eraContextSentence: 'an era of princely reform, where the Nizam modernizes while maintaining independence.',
                allegianceGroups: [
                    { name: 'Hyderabad State', type: 'primary', description: 'Largest and richest princely state.' },
                    { name: 'British Residency', type: 'secondary', description: 'Colonial oversight and advice.' },
                    { name: 'Mysore Kingdom', type: 'secondary', description: 'Neighboring progressive princely state.' },
                    { name: 'Peasant Movements', type: 'rebel', description: 'Telangana and other rural uprisings.' }
                ],
                structureNames: {
                    fortress: ['British Cantonment', 'State Forces Base'],
                    factory: ['Textile Mill', 'Railway Workshop'],
                    mill: ['Rice Mill', 'Cotton Ginning'],
                    trading_post: ['Railway Station', 'Modern Market'],
                    palace: ['Nizam\'s Palace', 'Residency'],
                    holy_site: ['Hindu Temple', 'Colonial Church', 'Sufi Shrine']
                },
                courtRoles: {
                    palace: ['Nizam', 'Prime Minister', 'British Resident', 'Military Commander']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Indian States',
                dominantPowerDescription: 'The Deccan is reorganized into linguistic states (Maharashtra, Karnataka, Andhra Pradesh, Telangana) becoming India\'s technology and pharmaceutical hub.',
                eraContextSentence: 'an era of technological emergence, where the Deccan becomes India\'s Silicon Valley.',
                allegianceGroups: [
                    { name: 'State Governments', type: 'primary', description: 'Maharashtra, Karnataka, Andhra Pradesh, Telangana.' },
                    { name: 'IT Industry', type: 'trade_company', description: 'Bangalore, Hyderabad, Pune tech centers.' },
                    { name: 'Regional Parties', type: 'secondary', description: 'Linguistic and caste-based politics.' },
                    { name: 'Naxalite Movement', type: 'rebel', description: 'Maoist insurgency in tribal areas.' }
                ],
                structureNames: {
                    fortress: ['Police Headquarters', 'Anti-Terrorist Squad Base'],
                    factory: ['Pharmaceutical Plant', 'Auto Manufacturing', 'IT Park'],
                    mill: ['Sugar Mill', 'Textile Mill'],
                    trading_post: ['Software Export Zone', 'Wholesale Market'],
                    palace: ['State Assembly', 'High-Tech City'],
                    holy_site: ['Tirupati Temple']
                },
                courtRoles: {
                    palace: ['Chief Minister', 'IT Secretary', 'Police Commissioner', 'Industrial Development Minister']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Republic of India',
                dominantPowerDescription: 'The Deccan states grapple massive technological and social changes.',
                eraContextSentence: 'an era of technological emergence, where the Deccan becomes India\'s Silicon Valley.',
                allegianceGroups: [
                   { name: 'State Governments', type: 'primary', description: 'Maharashtra, Karnataka, Andhra Pradesh, Telangana.' },
                    { name: 'IT Industry', type: 'trade_company', description: 'Bangalore, Hyderabad, Pune tech centers.' },
                    { name: 'Regional Parties', type: 'secondary', description: 'Linguistic and caste-based politics.' },
                ],
                structureNames: {
                    fortress: ['Climate Security Hub', 'Biotech Research Facility'],
                    factory: ['Genetic Engineering Lab', 'Solar Manufacturing', 'Vertical Farm'],
                    trading_post: ['Carbon Credit Exchange', 'Biotech Patent Office'],
                    holy_site: ['Tirupati Temple']
                }
            }
        },
        "Sundarbans Delta": {
            [HistoricalEra.PREHISTORY]: {
                dominantPower: 'Early Delta Settlements',
                dominantPowerDescription: 'Fishing and farming communities adapting to the massive river delta.',
                eraContextSentence: 'the birth of delta civilization, where humans learn to live with tigers and tides.',
                allegianceGroups: [
                    { name: 'Delta Fishers', type: 'primary', description: 'Maritime communities.' },
                    { name: 'Rice Cultivators', type: 'secondary', description: 'Early agricultural settlements.' }
                ],
                structureNames: {
                    holy_site: ['River Shrine', 'Tiger God Temple'],
                    mill: ['Fish Drying Platform', 'Rice Store']
                }
            },
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Gangaridai Kingdom',
                dominantPowerDescription: 'Powerful kingdom that deterred Alexander the Great with war elephants and wealth.',
                eraContextSentence: 'the age when even Alexander feared to cross the Ganges.',
                allegianceGroups: [
                    { name: 'Gangaridai', type: 'primary', description: 'Wealthy delta kingdom.' },
                    { name: 'Mauryan Empire', type: 'secondary', description: 'Expanding northern empire.' }
                ],
                structureNames: {
                    fortress: ['River Fort', 'Elephant Garrison'],
                    trading_post: ['Delta Port', 'Spice Market']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Pala Empire',
                dominantPowerDescription: 'Buddhist empire controlling Bengal and patronizing Nalanda University.',
                eraContextSentence: 'the Buddhist golden age, where Pala kings send teachers across Asia.',
                allegianceGroups: [
                    { name: 'Pala Dynasty', type: 'primary', description: 'Buddhist empire of Bengal.' },
                    { name: 'Sena Dynasty', type: 'secondary', description: 'Hindu successors.' },
                    { name: 'Arab Traders', type: 'trade_company', description: 'Muslim merchants.' }
                ],
                structureNames: {
                    holy_site: ['Buddhist Vihara', 'Hindu Temple'],
                    palace: ['Raja Palace', 'Governor Bhavan'],
                    trading_post: ['Arab Quarter', 'River Ghat']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Mughal Bengal',
                dominantPowerDescription: 'The wealthiest province of the Mughal Empire, producing half the world\'s textiles.',
                eraContextSentence: 'the age when Bengal clothed the world in muslin and silk.',
                allegianceGroups: [
                    { name: 'Mughal Subah', type: 'primary', description: 'Provincial Mughal government.' },
                    { name: 'Zamindars', type: 'secondary', description: 'Local landholding aristocracy.' },
                    { name: 'European Factories', type: 'trade_company', description: 'Portuguese, Dutch, French, English traders.' },
                    { name: 'Maratha Raiders', type: 'rebel', description: 'Hindu raiders from the west.' }
                ],
                structureNames: {
                    fortress: ['Mughal Fort', 'European Factory'],
                    mill: ['Muslin Workshop', 'Silk Weaving'],
                    trading_post: ['European Quarter', 'Native Bazaar']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'British Raj',
                dominantPowerDescription: 'Colonial exploitation transforms the world\'s workshop into a raw material supplier.',
                eraContextSentence: 'the deindustrialization of Bengal, as Manchester mills destroy local weavers.',
                allegianceGroups: [
                    { name: 'British Raj', type: 'primary', description: 'Colonial government from Calcutta.' },
                    { name: 'Zamindars', type: 'secondary', description: 'Collaborating landowners.' },
                    { name: 'Indian National Congress', type: 'rebel', description: 'Independence movement.' },
                    { name: 'Muslim League', type: 'rebel', description: 'Muslim separatist movement.' }
                ],
                structureNames: {
                    fortress: ['Fort William', 'Cantonment'],
                    factory: ['Jute Mill', 'Tea Processing'],
                    trading_post: ['Writers Building', 'Dalhousie Square']
                }
            },
            [HistoricalEra.MODERN_ERA]: {
                dominantPower: 'India and Bangladesh',
                dominantPowerDescription: 'Two nations share the delta, facing climate change and mass migration.',
                eraContextSentence: 'the climate crisis era, where rising seas threaten millions.',
                allegianceGroups: [
                    { name: 'Republic of India', type: 'primary', description: 'West Bengal state government.' },
                    { name: 'Bangladesh', type: 'primary', description: 'Independent nation since 1971.' },
                    { name: 'Climate Refugees', type: 'secondary', description: 'Displaced populations.' }
                ],
                structureNames: {
                    fortress: ['Border Security', 'Cyclone Shelter'],
                    factory: ['Garment Factory', 'Tech Park'],
                    trading_post: ['Export Zone', 'Shrimp Farm']
                }
            }
        }
    }
};