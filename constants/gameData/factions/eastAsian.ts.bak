/**
 * constants/gameData/factions/eastAsian.ts
 * Comprehensive faction data for East Asian cultural zones.
 */
import { HistoricalEra } from '../../../types';
import { FactionFile, AllegianceGroup } from './types';

const MODERN_ERA = 'MODERN_ERA';
const FUTURE_ERA = 'FUTURE_ERA';

export const EAST_ASIAN_FACTIONS: FactionFile = {
    'EAST_ASIAN': {
        "North China Plain": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Han Dynasty',
                dominantPowerDescription: 'The Han Dynasty establishes the template for Chinese civilization, creating a unified empire with sophisticated administration and cultural achievements.',
                eraContextSentence: 'an age of Han glory, where Chinese civilization reaches its classical form.',
                allegianceGroups: [
                    { name: 'Han Dynasty', type: 'primary', description: 'The unified imperial government.' },
                    { name: 'Xiongnu Confederacy', type: 'rebel', description: 'A powerful nomadic confederation to the north.' },
                    { name: 'Regional Warlords', type: 'rebel', description: 'Ambitious generals and governors.' },
                    { name: 'Korean Kingdoms', type: 'secondary', description: 'Neighboring kingdoms to the east.' }
                ],
                structureNames: {
                    fortress: ['Imperial Palace', 'Garrison Town', 'Great Wall Section', 'Watchtower', 'Border Fort'],
                    factory: ['Iron Foundry', 'State Workshop', 'Armory'],
                    trading_post: ['State Granary', 'Market Town', 'Border Trading Post'],
                    holy_site: ['Confucian Temple', 'Taoist Shrine', 'Ancestral Hall', 'Imperial Shrine'],
                    palace: ["Emperor's Palace", "Prefect's Yamen", 'Provincial Capital'],
                },
                courtRoles: {
                    palace: ['Grand Chancellor', 'Imperial Censor', 'General of the Army', 'Court Eunuch', 'Palace Scribe', 'Imperial Astronomer']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Tang Dynasty',
                dominantPowerDescription: "The Tang Dynasty creates one of the greatest empires in Chinese history, with Chang'an as the world's largest city and China as the center of Asian civilization.",
                eraContextSentence: 'the golden age of China, where Tang civilization represents the height of medieval achievement.',
                allegianceGroups: [
                    { name: 'Tang Dynasty', type: 'primary', description: 'The cosmopolitan imperial government.' },
                    { name: 'Tibetan Empire', type: 'secondary', description: 'A powerful rival to the west.' },
                    { name: 'Korean Kingdoms', type: 'secondary', description: 'Tributary states to the east.' },
                    { name: 'Japanese Embassies', type: 'secondary', description: 'Diplomatic missions from Japan.' }
                ],
                structureNames: {
                    fortress: ['Tang Palace', 'City Walls', 'Garrison', 'Mountain Fortress', 'Border Citadel'],
                    factory: ['State Workshop', 'Porcelain Kiln', 'Silk Mill'],
                    trading_post: ['Grand Canal Lock', 'Silk Road Market', 'Canal Port', 'Caravanserai'],
                    holy_site: ['Buddhist Monastery', 'Pagoda', 'Taoist Temple', 'Confucian Academy'],
                    palace: ["Emperor's Palace Complex", "Chancellor's Residence", 'Provincial Palace'],
                },
                courtRoles: {
                    palace: ['Chancellor', 'Grand General', 'Court Astrologer', 'Imperial Scholar', 'Palace Guard Captain', 'Minister of Rites'],
                    holy_site: ['Abbot', 'Senior Monk', 'Temple Guardian', 'Scholarly Monk']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Ming Dynasty',
                dominantPowerDescription: 'The Ming Dynasty restores native Chinese rule and creates a powerful empire, building the Forbidden City and extending Chinese influence across Asia.',
                eraContextSentence: 'an era of Ming grandeur, where Chinese emperors rule from the Forbidden City.',
                allegianceGroups: [
                    { name: 'Ming Dynasty', type: 'primary', description: 'The native Han Chinese imperial government.' },
                    { name: 'Mongol Remnants', type: 'rebel', description: 'The Northern Yuan and other Mongol groups.' },
                    { name: 'Japanese Pirates (Wokou)', type: 'rebel', description: 'Pirates raiding the coastlines.' },
                    { name: 'Manchu Tribes', type: 'secondary', description: 'A rising power to the northeast.' }
                ],
                structureNames: {
                    fortress: ['Forbidden City', 'Great Wall Fortress', 'City Garrison', 'Imperial Guard Post', 'Coastal Defense'],
                    factory: ['Imperial Workshop', 'Porcelain Manufactory', 'Gunpowder Mill'],
                    trading_post: ['Canal Granary', 'Grand Canal Port', 'Marketplace', 'Imperial Storehouse'],
                    holy_site: ['Temple of Heaven', 'Lama Temple', 'Pagoda', 'Confucian Academy', 'Imperial Shrine'],
                    palace: ['Forbidden City', "Prince's Mansion", 'Governor General Palace'],
                },
                courtRoles: {
                    palace: ['Grand Secretary', 'Minister of War', 'Imperial Guard Commander', 'Court Eunuch', 'Palace Historian', 'Imperial Physician']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Qing Dynasty',
                dominantPowerDescription: 'The Manchu Qing Dynasty rules the largest Chinese empire in history but faces increasing pressure from Western powers and internal rebellions.',
                eraContextSentence: 'an era of Manchu rule and Western pressure, where the Qing Empire struggles to maintain traditional authority.',
                allegianceGroups: [
                    { name: 'Qing Dynasty', type: 'primary', description: 'The Manchu-led imperial government.' },
                    { name: 'British Empire', type: 'secondary', description: 'A foreign power forcing open trade through the Opium Wars.' },
                    { name: 'Russian Empire', type: 'secondary', description: 'A rival empire expanding from the north.' },
                    { name: 'Taiping Rebellion', type: 'rebel', description: 'A massive and devastating civil war.' }
                ],
                structureNames: {
                    fortress: ['Qing Palace', 'Banner Garrison', 'Coastal Fort', 'Railway Station Guard', 'Telegraph Station'],
                    factory: ['Arsenal', 'Shipyard', 'Modern Factory', 'Steam Mill'],
                    trading_post: ['Custom House', 'Railway Line', 'Telegraph Office', 'Foreign Quarter'],
                    holy_site: ['Traditional Temple', 'Christian Mission', 'Mosque', 'Ancestral Hall'],
                    palace: ['Imperial Palace', 'Governor General Residence', 'Banner Headquarters'],
                },
                courtRoles: {
                    palace: ['Grand Council Member', 'Viceroy', 'Banner General', 'Foreign Affairs Minister', 'Modernization Advisor']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'People\'s Republic of China',
                dominantPowerDescription: 'After a century of turmoil, civil war, and invasion, the Communist Party establishes control, transforming China into a unified and rapidly industrializing socialist state.',
                eraContextSentence: 'an age of revolution and reconstruction, as China is forged into a modern world power.',
                allegianceGroups: [
                    { name: 'Communist Party of China', type: 'primary', description: 'The sole ruling party.' },
                    { name: 'Republic of China (Taiwan)', type: 'rebel', description: 'The rival government that retreated to Taiwan.' },
                    { name: 'Soviet Union', type: 'secondary', description: 'An early ally and later rival.' },
                    { name: 'United States', type: 'secondary', description: 'A primary ideological and geopolitical rival.' }
                ],
                structureNames: {
                    fortress: ['Military Headquarters', 'Garrison', 'Air Base', 'Missile Base', 'Border Command'],
                    factory: ['State-Owned Enterprise', 'Steel Plant', 'Heavy Industry Complex', 'Electronics Factory', 'Auto Plant'],
                    trading_post: ['Railway Station', 'Port Authority', 'Airport', 'Logistics Hub'],
                    holy_site: ['Revolutionary Monument', 'Mausoleum', 'Memorial Hall', 'Party History Museum'],
                    palace: ['Great Hall of the People', 'Zhongnanhai Compound', 'Party Headquarters', 'Government Building'],
                },
                courtRoles: {
                    palace: ['Party Secretary', 'Premier', 'Politburo Member', 'Military Commission Chair', 'State Council Minister']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'Chinese Federation',
                dominantPowerDescription: 'China evolves into a technologically advanced federation balancing traditional values with cutting-edge innovation, leading global efforts in space colonization and climate restoration.',
                eraContextSentence: 'an era of technological renaissance, where ancient wisdom guides humanity toward the stars.',
                allegianceGroups: [
                    { name: 'Chinese Federation', type: 'primary', description: 'The federal government balancing regions and technology.' },
                    { name: 'Global Climate Consortium', type: 'secondary', description: 'International climate restoration alliance.' },
                    { name: 'Mars Colonial Authority', type: 'secondary', description: 'Joint interplanetary governance body.' },
                    { name: 'Neo-Traditionalist Movement', type: 'rebel', description: 'Groups seeking return to pre-technological society.' }
                ],
                structureNames: {
                    fortress: ['Orbital Defense Platform', 'Quantum Security Grid', 'Climate Shield Station', 'Digital Fortress'],
                    factory: ['Fusion Power Plant', 'Nano-Manufacturing Hub', 'Orbital Assembly Station', 'Biotech Laboratory'],
                    trading_post: ['Hyperloop Terminal', 'Space Elevator Port', 'Quantum Communication Hub', 'Neural Network Node'],
                    holy_site: ['Digital Memory Palace', 'Harmony Temple', 'Ancestors\' Virtual Shrine', 'Meditation Pod Complex'],
                    palace: ['Federal Neural Command', 'Quantum Governance Center', 'Harmony Council Complex', 'Wisdom Synthesis Palace'],
                },
                courtRoles: {
                    palace: ['Neural Federation President', 'Quantum Policy Director', 'Harmony Coordinator', 'Interplanetary Liaison', 'AI Ethics Council Chair']
                }
            }
        },
        "South China": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Han Empire',
                dominantPowerDescription: 'Han expansion brings South China under imperial control, though local cultures and languages persist alongside Chinese administration.',
                eraContextSentence: 'an age of imperial expansion, where Han civilization extends into the southern lands.',
                allegianceGroups: [
                    { name: 'Han Empire', type: 'primary', description: 'The central imperial government.' },
                    { name: 'Yue Peoples', type: 'rebel', description: 'Various non-Han peoples of the south.' },
                    { name: 'Nanyue Kingdom', type: 'secondary', description: 'A semi-independent kingdom in the far south.' },
                    { name: 'Local Chieftains', type: 'secondary', description: 'Local leaders of various southern tribes.' }
                ],
                structureNames: {
                    fortress: ['Han Garrison', 'Watchtower', 'River Fort', 'Mountain Outpost'],
                    factory: ['Bronze Workshop', 'Salt Works'],
                    trading_post: ['Rice Terrace', 'Water Mill', 'River Port', 'Trading Post'],
                    holy_site: ['Local Shrine', 'Ancestor Temple', 'Mountain Shrine'],
                    palace: ['Prefect Palace', 'Military Headquarters']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Song Dynasty',
                dominantPowerDescription: 'The Song Dynasty, though militarily weaker than its predecessors, achieves unprecedented economic and cultural development in South China.',
                eraContextSentence: 'an era of Song prosperity, where South China becomes the economic heart of the empire.',
                allegianceGroups: [
                    { name: 'Southern Song Dynasty', type: 'primary', description: 'The imperial government based in the south.' },
                    { name: 'Jin Dynasty', type: 'secondary', description: 'The Jurchen dynasty controlling the north.' },
                    { name: 'Western Xia', type: 'secondary', description: 'A Tangut kingdom to the northwest.' },
                    { name: 'Dali Kingdom', type: 'secondary', description: 'An independent kingdom in Yunnan.' }
                ],
                structureNames: {
                    fortress: ['Song Citadel', 'Naval Base', 'River Defense', 'City Walls'],
                    factory: ['Water-powered Mill', 'Silk Workshop', 'Porcelain Kiln'],
                    trading_post: ['Rice Paddy Network', 'Commercial Port (Quanzhou)', 'Tea Market', 'Silk Road Terminus'],
                    holy_site: ['Buddhist Temple', 'Academy', 'Pagoda', 'Scholars\' Hall'],
                    palace: ['Imperial Palace', 'Governor Palace', 'Academy Complex']
                },
                courtRoles: {
                    palace: ['Imperial Chancellor', 'Naval Commander', 'Commerce Minister', 'Scholar-Official'],
                    holy_site: ['Academy Master', 'Senior Scholar', 'Temple Abbot']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Ming Dynasty',
                dominantPowerDescription: 'Ming rule brings stability and prosperity to South China, with Guangzhou becoming a major center of international trade.',
                eraContextSentence: 'an age of Ming trade, where South China connects the empire to the wider world.',
                allegianceGroups: [
                    { name: 'Ming Dynasty', type: 'primary', description: 'The imperial government.' },
                    { name: 'Portuguese Traders', type: 'trade_company', description: 'European traders establishing a presence in Macau.' },
                    { name: 'Japanese Pirates (Wokou)', type: 'rebel', description: 'Pirates raiding the coast.' },
                    { name: 'Local Merchant Guilds', type: 'secondary', description: 'Powerful guilds controlling local trade.' }
                ],
                structureNames: {
                    fortress: ['Ming Fort', 'Coastal Fortress', 'Naval Station', 'Guard Tower'],
                    factory: ['Silk Filature', 'Porcelain Kiln', 'Tea Processing House', 'Shipyard'],
                    trading_post: ['Trading Factory (Canton)', 'Porcelain Market', 'Tea Warehouse', 'Spice Market'],
                    holy_site: ['Confucian Temple', 'Buddhist Monastery', 'Ancestor Hall', 'Maritime Temple'],
                    palace: ['Governor Palace', 'Prefect Yamen', 'Trading Commissioner Palace']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Qing Dynasty',
                dominantPowerDescription: 'Qing rule faces particular challenges in South China, with the Taiping Rebellion and increasing Western commercial pressure.',
                eraContextSentence: 'an era of rebellion and reform, where South China becomes the center of resistance to traditional authority.',
                allegianceGroups: [
                    { name: 'Qing Dynasty', type: 'primary', description: 'The imperial government.' },
                    { name: 'Taiping Heavenly Kingdom', type: 'rebel', description: 'A massive rebellion aiming to overthrow the Qing.' },
                    { name: 'British Empire', type: 'trade_company', description: 'The dominant Western power, controlling Hong Kong.' },
                    { name: 'Guangdong Merchants', type: 'secondary', description: 'Powerful merchant groups in Canton.' }
                ],
                structureNames: {
                    fortress: ['Qing Barracks', 'Opium War Fort', 'Coastal Battery', 'Foreign Quarter Guard'],
                    factory: ['Steam-powered Silk Mill', 'Modern Shipyard', 'Arsenal', 'Railway Workshop'],
                    trading_post: ['Teahouse', 'Treaty Port', 'European Concession', 'Customs House', 'Railway Terminal'],
                    holy_site: ['Traditional Temple', 'Christian Church', 'Ancestor Hall', 'Revolutionary Meeting Hall'],
                    palace: ['Viceroy Palace', 'Foreign Affairs Office', 'Merchant Guild Hall']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'People\'s Republic of China',
                dominantPowerDescription: 'South China becomes the engine of the nation\'s economic miracle, with Special Economic Zones transforming fishing villages into global megacities.',
                eraContextSentence: 'an era of explosive growth, where the south becomes the workshop of the world.',
                allegianceGroups: [
                    { name: 'Communist Party of China', type: 'primary', description: 'The ruling party.' },
                    { name: 'Hong Kong (British until 1997)', type: 'secondary', description: 'A British colony and global financial hub.' },
                    { name: 'Foreign Investors', type: 'trade_company', description: 'International corporations driving manufacturing.' },
                    { name: 'Taiwan Business Networks', type: 'secondary', description: 'Cross-strait economic connections.' }
                ],
                structureNames: {
                    fortress: ['People\'s Liberation Army Base', 'Border Garrison', 'Coastal Defense'],
                    factory: ['Special Economic Zone (Shenzhen)', 'Electronics Factory', 'Garment Factory', 'Auto Assembly Plant', 'Tech Manufacturing Hub'],
                    trading_post: ['Container Port (Hong Kong)', 'International Airport', 'High-Tech Park', 'Logistics Center', 'Financial District'],
                    holy_site: ['Revolutionary Monument', 'Ancestor Temple', 'Economic Miracle Memorial'],
                    palace: ['Provincial Government Building', 'Party Committee Headquarters', 'SEZ Administration']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'Southern China Innovation Federation',
                dominantPowerDescription: 'The Pearl River Delta evolves into humanity\'s primary technological innovation hub, pioneering sustainable manufacturing and ocean cities.',
                eraContextSentence: 'an era of innovation leadership, where southern ingenuity shapes the future of human civilization.',
                allegianceGroups: [
                    { name: 'Innovation Federation', type: 'primary', description: 'Autonomous region focused on technological advancement.' },
                    { name: 'Global Ocean Cities Alliance', type: 'secondary', description: 'Network of floating sustainable cities.' },
                    { name: 'Interplanetary Trade Consortium', type: 'secondary', description: 'Earth-space commerce alliance.' },
                    { name: 'Neo-Luddite Resistance', type: 'rebel', description: 'Anti-technology traditionalist groups.' }
                ],
                structureNames: {
                    fortress: ['Cyber Security Complex', 'Ocean Defense Platform', 'Quantum Shield Array'],
                    factory: ['Molecular Assembly Plant', 'Ocean City Constructor', 'Space Elevator Manufacturing', 'Carbon Capture Facility'],
                    trading_post: ['Interplanetary Trade Hub', 'Ocean City Port', 'Quantum Teleportation Center', 'Neural Commerce Interface'],
                    holy_site: ['Innovation Shrine', 'Entrepreneur Memorial', 'Tech Pioneer Hall'],
                    palace: ['Innovation Council Complex', 'Tech Democracy Center', 'Sustainable Future Palace']
                }
            }
        },
        "Mongolia and Manchuria": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Xiongnu Confederacy',
                dominantPowerDescription: 'The Xiongnu create the first great nomadic empire, dominating the steppes and challenging the Han Dynasty to the south.',
                eraContextSentence: 'an age of nomadic power, where horse warriors rule the endless grasslands.',
                allegianceGroups: [
                    { name: 'Xiongnu Confederacy', type: 'primary', description: 'The dominant nomadic confederation.' },
                    { name: 'Han Dynasty', type: 'secondary', description: 'The Chinese empire to the south.' },
                    { name: 'Donghu Tribes', type: 'rebel', description: 'Eastern nomadic peoples.' },
                    { name: 'Wusun', type: 'secondary', description: 'Western steppe peoples.' }
                ],
                structureNames: {
                    fortress: ['Nomad Camp', 'Winter Quarters', 'Tribal Stronghold', 'Sacred Mountain Fort'],
                    factory: ['Horse Pen', 'Weapons Cache', 'Leather Workshop'],
                    trading_post: ['Trading Ground', 'Seasonal Market', 'Caravan Stop'],
                    holy_site: ['Sky Shrine', 'Ancestor Mound', 'Shaman Circle'],
                    palace: ['Khan\'s Ordu', 'Royal Tent', 'Tribal Council Ground']
                },
                courtRoles: {
                    palace: ['Khan', 'War Chief', 'Shaman', 'Horse Master', 'Tribal Elder']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Mongol Empire',
                dominantPowerDescription: 'Under Genghis Khan and his successors, the Mongols create the largest contiguous land empire in history, conquering from China to Eastern Europe.',
                eraContextSentence: 'the age of Mongol conquest, where the steppes give birth to world empire.',
                allegianceGroups: [
                    { name: 'Mongol Empire', type: 'primary', description: 'The vast nomadic empire under the Great Khan.' },
                    { name: 'Song Dynasty', type: 'secondary', description: 'Chinese resistance in the south.' },
                    { name: 'Jin Dynasty', type: 'secondary', description: 'Jurchen kingdom in northern China.' },
                    { name: 'Khwarazm Empire', type: 'secondary', description: 'Central Asian Muslim empire.' }
                ],
                structureNames: {
                    fortress: ['Khan\'s Ordu', 'Siege Camp', 'Mountain Fortress', 'Border Watch'],
                    factory: ['Siege Workshop', 'Arrow Manufactory', 'Horse Breeding Ground'],
                    trading_post: ['Silk Road Station', 'Yam (Postal Relay)', 'Trading Ordu', 'Caravan Depot'],
                    holy_site: ['Tengri Shrine', 'Ancestor Ovoo', 'Sacred Grove', 'Sky Burial Ground'],
                    palace: ['Great Khan\'s Palace', 'Regional Khan Court', 'Tribal Assembly']
                },
                courtRoles: {
                    palace: ['Great Khan', 'Orlok (General)', 'Yam Master', 'Shaman', 'Chinese Advisor', 'Muslim Administrator']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Northern Yuan Dynasty',
                dominantPowerDescription: 'After being expelled from China, the Mongols maintain the Northern Yuan, controlling Mongolia while the Ming Dynasty rules China.',
                eraContextSentence: 'an era of divided legacy, where Mongol khans preserve steppe traditions while China modernizes.',
                allegianceGroups: [
                    { name: 'Northern Yuan Dynasty', type: 'primary', description: 'Mongol continuation government in Mongolia.' },
                    { name: 'Ming Dynasty', type: 'secondary', description: 'Chinese empire to the south.' },
                    { name: 'Various Mongol Tribes', type: 'rebel', description: 'Independent tribal confederations.' },
                    { name: 'Russian Empire', type: 'secondary', description: 'Expanding empire from the north.' }
                ],
                structureNames: {
                    fortress: ['Khan\'s Fortress', 'Tribal Stronghold', 'Border Fort', 'Mountain Citadel'],
                    factory: ['Gunpowder Mill', 'Weapons Workshop', 'Livestock Processing'],
                    trading_post: ['Trading Post', 'Mongol-Chinese Border Market', 'Livestock Market'],
                    holy_site: ['Buddhist Monastery', 'Tengri Shrine', 'Ovoo (Sacred Cairn)', 'Lamaist Temple'],
                    palace: ['Khan\'s Palace', 'Tribal Council Ger', 'Regional Governor Palace']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Qing Dynasty',
                dominantPowerDescription: 'The Manchu Qing Dynasty incorporates Mongolia into their empire, while Russian expansion pressures the northern borders.',
                eraContextSentence: 'an era of imperial control, where traditional nomadic life adapts to new political realities.',
                allegianceGroups: [
                    { name: 'Qing Dynasty', type: 'primary', description: 'Manchu empire controlling Mongolia.' },
                    { name: 'Russian Empire', type: 'secondary', description: 'Expanding power from the north.' },
                    { name: 'Mongol Princes', type: 'secondary', description: 'Traditional leaders under Qing rule.' },
                    { name: 'Buddhist Monasteries', type: 'secondary', description: 'Influential religious institutions.' }
                ],
                structureNames: {
                    fortress: ['Qing Garrison', 'Banner Camp', 'Frontier Fort', 'Railway Guard Post'],
                    factory: ['Mining Operation', 'Felt Factory', 'Leather Processing'],
                    trading_post: ['Trans-Siberian Station', 'Tea Caravan Route', 'Livestock Market', 'Trading Outpost'],
                    holy_site: ['Lamaist Monastery', 'Traditional Ovoo', 'Buddhist Temple'],
                    palace: ['Qing Administrative Center', 'Mongol Prince Palace', 'Banner Headquarters']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'People\'s Republic of China / Mongolian People\'s Republic',
                dominantPowerDescription: 'Mongolia becomes divided between Soviet-influenced Outer Mongolia and Chinese-controlled Inner Mongolia, both undergoing rapid modernization.',
                eraContextSentence: 'an era of socialist transformation, where ancient nomadic lands become modern nations.',
                allegianceGroups: [
                    { name: 'People\'s Republic of China (Inner Mongolia)', type: 'primary', description: 'Chinese administration of southern Mongolia.' },
                    { name: 'Mongolian People\'s Republic', type: 'secondary', description: 'Soviet-aligned independent Mongolia.' },
                    { name: 'Soviet Union', type: 'secondary', description: 'Major influence on Outer Mongolia.' },
                    { name: 'Traditional Herders', type: 'rebel', description: 'Nomads resisting collectivization.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Border Guard Station', 'Air Defense Site'],
                    factory: ['Mining Complex', 'Steel Mill', 'Wool Processing Plant', 'Heavy Industry'],
                    trading_post: ['Railway Junction', 'Truck Stop', 'Supply Depot', 'Market Town'],
                    holy_site: ['Revolutionary Memorial', 'Traditional Ovoo', 'State Museum'],
                    palace: ['Party Headquarters', 'Government Building', 'Administrative Center']
                }
            },
            [FUTURE_ERA]: {
    dominantPower: 'People\'s Republic of China / Mongolia',
    dominantPowerDescription: 'Chinese economic dominance shapes Mongolia’s urban and rural transformation, with mineral wealth and renewable energy projects driving growth amid persistent inequality and environmental strain.',
    eraContextSentence: 'an era of global entanglement and accelerated change, where old and new ways of life collide under the shadow of resource extraction and climate anxiety.',
    allegianceGroups: [
        { name: 'State-backed Mining Consortiums', type: 'primary', description: 'Joint ventures extracting coal, copper, and rare earths, with substantial foreign investment.' },
        { name: 'Mongolian Urban Middle Class', type: 'secondary', description: 'A rising population in Ulaanbaatar and regional cities, balancing opportunity and precarity.' },
        { name: 'Nomadic Pastoralists', type: 'rebel', description: 'Traditional herders adapting or resisting as climate, land grabs, and market forces disrupt centuries-old livelihoods.' },
        { name: 'Chinese Infrastructure Interests', type: 'secondary', description: 'Belt and Road initiatives expanding transit, energy, and logistics networks across the region.' }
    ],
    structureNames: {
        fortress: ['Border Surveillance Outpost', 'Critical Infrastructure Security Base', 'Resource Protection Barracks'],
        factory: ['Coal Processing Plant', 'Copper Smelting Facility', 'Wind Turbine Farm', 'Battery Assembly Plant'],
        trading_post: ['High-Speed Rail Terminal', 'Logistics Center', 'Cross-Border Free Market'],
        holy_site: ['Restored Monastery', 'Chinggis Khan Memorial', 'Urban Meditation Park'],
        palace: ['Presidential Residence', 'Belt and Road HQ', 'Parliament House']
    }
}

        },
        "Japan": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Yamato State',
                dominantPowerDescription: 'The Yamato clan consolidates power in central Japan, establishing the foundations of imperial rule and absorbing Chinese cultural influences.',
                eraContextSentence: 'an age of imperial formation, where Japan begins to emerge as a unified nation.',
                allegianceGroups: [
                    { name: 'Yamato Imperial Court', type: 'primary', description: 'The emerging imperial government.' },
                    { name: 'Regional Clans (Uji)', type: 'secondary', description: 'Powerful local aristocratic families.' },
                    { name: 'Korean Kingdoms', type: 'secondary', description: 'Source of cultural and technological exchange.' },
                    { name: 'Emishi Tribes', type: 'rebel', description: 'Indigenous peoples in northern Japan.' }
                ],
                structureNames: {
                    fortress: ['Imperial Palace', 'Clan Stronghold', 'Frontier Fort', 'Mountain Citadel'],
                    factory: ['Iron Workshop', 'Rice Processing', 'Textile Mill'],
                    trading_post: ['Harbor Village', 'Mountain Pass Station', 'Clan Trading Post'],
                    holy_site: ['Shinto Shrine', 'Buddhist Temple', 'Clan Ancestor Shrine', 'Sacred Mountain'],
                    palace: ['Imperial Court', 'Clan Palace', 'Regional Capital']
                },
                courtRoles: {
                    palace: ['Emperor', 'Regent', 'Clan Head', 'Court Scribe', 'Military Commander'],
                    holy_site: ['Shinto Priest', 'Buddhist Monk', 'Shrine Maiden']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Kamakura Shogunate',
                dominantPowerDescription: 'The rise of the samurai class creates a military government, with real power held by the shogun while the emperor remains a figurehead.',
                eraContextSentence: 'the age of the warrior, where samurai create a new form of military rule.',
                allegianceGroups: [
                    { name: 'Kamakura Shogunate', type: 'primary', description: 'The military government led by the Minamoto clan.' },
                    { name: 'Imperial Court', type: 'secondary', description: 'The traditional but powerless imperial government.' },
                    { name: 'Taira Clan Remnants', type: 'rebel', description: 'Survivors of the defeated Taira.' },
                    { name: 'Buddhist Monasteries', type: 'secondary', description: 'Powerful religious institutions with warrior monks.' }
                ],
                structureNames: {
                    fortress: ['Shogun Castle', 'Samurai Stronghold', 'Mountain Fortress', 'Coastal Defense'],
                    factory: ['Sword Smithy', 'Armor Workshop', 'Sake Brewery'],
                    trading_post: ['Port Town', 'Mountain Trading Post', 'Monastery Market'],
                    holy_site: ['Zen Temple', 'Shinto Shrine', 'Warrior Monastery', 'Imperial Shrine'],
                    palace: ['Shogun Palace', 'Daimyo Residence', 'Imperial Court']
                },
                courtRoles: {
                    palace: ['Shogun', 'Regent (Shikken)', 'High Constable', 'Military Governor', 'Court Noble'],
                    holy_site: ['Zen Master', 'Warrior Monk', 'Shinto Priest', 'Temple Abbott']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Tokugawa Shogunate',
                dominantPowerDescription: 'After a century of civil war, the Tokugawa create a stable military government, implementing sakoku (isolation) while maintaining internal peace.',
                eraContextSentence: 'an era of great peace, where Japan develops in isolation under Tokugawa rule.',
                allegianceGroups: [
                    { name: 'Tokugawa Shogunate', type: 'primary', description: 'The unified military government.' },
                    { name: 'Daimyo Domains', type: 'secondary', description: 'Regional lords under shogun control.' },
                    { name: 'Imperial Court', type: 'secondary', description: 'Ceremonial imperial government in Kyoto.' },
                    { name: 'Christian Converts', type: 'rebel', description: 'Hidden Christians after the ban.' }
                ],
                structureNames: {
                    fortress: ['Edo Castle', 'Domain Castle', 'Border Checkpoint', 'Coastal Watch'],
                    factory: ['Handicraft Workshop', 'Sake Distillery', 'Textile Mill', 'Pottery Kiln'],
                    trading_post: ['Licensed Trading House', 'Domain Market', 'Inland Checkpoint', 'Port Authority'],
                    holy_site: ['Buddhist Temple', 'Shinto Shrine', 'Confucian Academy', 'Hidden Christian Site'],
                    palace: ['Shogun Palace', 'Daimyo Residence', 'Imperial Palace', 'Magistrate Office']
                },
                courtRoles: {
                    palace: ['Shogun', 'Senior Counselor', 'Daimyo', 'Magistrate', 'Confucian Scholar']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Meiji Emperor',
                dominantPowerDescription: 'The Meiji Restoration overthrows the shogunate and rapidly modernizes Japan, transforming it from isolated feudal state to industrial power.',
                eraContextSentence: 'an era of dramatic transformation, where Japan races to join the modern world.',
                allegianceGroups: [
                    { name: 'Meiji Government', type: 'primary', description: 'The modernizing imperial government.' },
                    { name: 'Former Samurai', type: 'rebel', description: 'Displaced warrior class opposing change.' },
                    { name: 'Western Powers', type: 'secondary', description: 'European and American advisors and traders.' },
                    { name: 'Peasant Uprisings', type: 'rebel', description: 'Rural resistance to modernization.' }
                ],
                structureNames: {
                    fortress: ['Imperial Army Base', 'Naval Station', 'Coastal Artillery', 'Modern Fortress'],
                    factory: ['Textile Mill', 'Steel Works', 'Shipyard', 'Munitions Factory', 'Railway Workshop'],
                    trading_post: ['Railway Station', 'Modern Port', 'Telegraph Office', 'Bank'],
                    holy_site: ['State Shinto Shrine', 'Buddhist Temple', 'Christian Church', 'Confucian Academy'],
                    palace: ['Imperial Palace', 'Government Building', 'Prefectural Office', 'Modern Mansion']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Empire of Japan / Post-War Japan',
                dominantPowerDescription: 'Japan becomes a major imperial power, then after WWII defeat, transforms into a pacifist democracy and economic powerhouse.',
                eraContextSentence: 'an era of empire, defeat, and rebirth as a peaceful industrial democracy.',
                allegianceGroups: [
                    { name: 'Japanese Government', type: 'primary', description: 'Constitutional monarchy and later parliamentary democracy.' },
                    { name: 'United States', type: 'secondary', description: 'Post-war ally and security partner.' },
                    { name: 'Korean Independence Movement', type: 'rebel', description: 'Resistance to Japanese rule in Korea.' },
                    { name: 'Peace Movement', type: 'secondary', description: 'Post-war anti-militarization advocates.' }
                ],
                structureNames: {
                    fortress: ['Self-Defense Force Base', 'Coast Guard Station', 'US Military Base'],
                    factory: ['Auto Plant', 'Electronics Factory', 'Shipyard', 'Steel Mill', 'Precision Manufacturing'],
                    trading_post: ['Container Port', 'Bullet Train Station', 'International Airport', 'Trading House'],
                    holy_site: ['Peace Memorial', 'Traditional Shrine', 'Modern Temple', 'War Memorial'],
                    palace: ['Imperial Palace', 'Diet Building', 'Corporate Headquarters', 'Prefecture Office']
                }
            },
            [FUTURE_ERA]: {
    dominantPower: 'State of Japan',
    dominantPowerDescription: 'Japan is steered by a stable but aging political and business elite, managing slow growth, demographic decline, and technological adaptation through policy and industry cooperation.',
    eraContextSentence: 'an era of managed decline and anxious adaptation, as society ages, cities shrink, and technology becomes both a lifeline and a coping mechanism.',
    allegianceGroups: [
        { name: 'Ruling Coalition (LDP & Komeito)', type: 'primary', description: 'The dominant center-right political coalition navigating demographic and economic headwinds.' },
        { name: 'Keidanren & Tech Industry', type: 'secondary', description: 'Business federations and major corporations driving automation and export strategies.' },
    ],
    structureNames: {
        fortress: ['Coast Guard Station', 'Missile Defense Base', 'Disaster Response Center'],
        factory: ['Robotics Assembly Plant', 'Battery Gigafactory', 'Aging Support Device Workshop', 'Green Hydrogen Facility'],
        trading_post: ['Regional Logistics Hub', 'Aging Population Care Market', 'Port Authority Office'],
        holy_site: ['Shinto Shrine', 'Civic War Memorial', 'Abandoned Temple'],
        palace: ['Diet Building', 'Metropolitan Government Tower', 'Keidanren Headquarters']
    }
}
        },
        "Korea": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Three Kingdoms Period',
                dominantPowerDescription: 'Korea is divided between Goguryeo, Baekje, and Silla, each developing distinct cultures while competing for dominance.',
                eraContextSentence: 'an age of three kingdoms, where Korean civilization develops through competition and cultural exchange.',
                allegianceGroups: [
                    { name: 'Silla Kingdom', type: 'primary', description: 'Southeastern kingdom with strong Buddhist culture.' },
                    { name: 'Goguryeo Kingdom', type: 'secondary', description: 'Northern kingdom defending against Chinese expansion.' },
                    { name: 'Baekje Kingdom', type: 'secondary', description: 'Southwestern kingdom with close Japanese ties.' },
                    { name: 'Gaya Confederacy', type: 'rebel', description: 'Small southern states between the major kingdoms.' }
                ],
                structureNames: {
                    fortress: ['Mountain Fortress', 'Royal Citadel', 'Border Fort', 'River Defense'],
                    factory: ['Iron Smithy', 'Pottery Workshop', 'Textile Mill'],
                    trading_post: ['Royal Market', 'Border Trading Post', 'River Port'],
                    holy_site: ['Buddhist Temple', 'Confucian Academy', 'Ancestor Shrine', 'Mountain Shrine'],
                    palace: ['Royal Palace', 'Regional Capital', 'Noble Residence']
                },
                courtRoles: {
                    palace: ['King', 'Chief Minister', 'Military Commander', 'Court Scholar'],
                    holy_site: ['Buddhist Monk', 'Confucian Scholar', 'Shaman']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Goryeo Dynasty',
                dominantPowerDescription: 'The Goryeo Dynasty unifies Korea and develops a sophisticated Buddhist culture, while defending against Mongol invasions.',
                eraContextSentence: 'the age of Goryeo glory, where unified Korea becomes a center of Buddhist learning.',
                allegianceGroups: [
                    { name: 'Goryeo Dynasty', type: 'primary', description: 'The unified Korean kingdom.' },
                    { name: 'Mongol Empire', type: 'secondary', description: 'Powerful northern empire demanding submission.' },
                    { name: 'Song Dynasty', type: 'secondary', description: 'Chinese ally and cultural influence.' },
                    { name: 'Military Officers', type: 'rebel', description: 'Military strongmen challenging royal authority.' }
                ],
                structureNames: {
                    fortress: ['Royal Palace Fortress', 'Mountain Citadel', 'Coastal Defense', 'Border Watch'],
                    factory: ['Celadon Kiln', 'Printing Workshop', 'Metalwork Shop'],
                    trading_post: ['Silk Road Terminus', 'Royal Warehouse', 'Merchant Quarter'],
                    holy_site: ['Buddhist Monastery', 'Confucian Academy', 'Royal Temple', 'Mountain Hermitage'],
                    palace: ['Goryeo Palace', 'Provincial Capital', 'Military Headquarters']
                },
                courtRoles: {
                    palace: ['King', 'Chancellor', 'Military Commissioner', 'Royal Scholar'],
                    holy_site: ['Buddhist Abbot', 'Zen Master', 'Confucian Teacher']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Joseon Dynasty',
                dominantPowerDescription: 'The Joseon Dynasty establishes a Confucian state, creating the Korean alphabet (Hangul) and surviving Japanese invasions.',
                eraContextSentence: 'an era of Confucian achievement, where Korea develops its unique cultural identity.',
                allegianceGroups: [
                    { name: 'Joseon Dynasty', type: 'primary', description: 'The Confucian Korean kingdom.' },
                    { name: 'Ming Dynasty', type: 'secondary', description: 'Chinese suzerain and cultural model.' },
                    { name: 'Japanese Invasions', type: 'rebel', description: 'Toyotomi Hideyoshi\'s invasion forces.' },
                    { name: 'Yangban Aristocracy', type: 'secondary', description: 'Confucian scholar-officials.' }
                ],
                structureNames: {
                    fortress: ['Hwaseong Fortress', 'Mountain Fortress', 'Coastal Battery', 'Border Garrison'],
                    factory: ['Royal Kiln', 'Printing House', 'Weapons Workshop', 'Textile Workshop'],
                    trading_post: ['Tribute Goods Warehouse', 'Market Town', 'Port Authority'],
                    holy_site: ['Confucian Academy (Seowon)', 'Royal Shrine', 'Buddhist Temple', 'Village School'],
                    palace: ['Gyeongbok Palace', 'Secondary Palace', 'Provincial Capital', 'Yangban Residence']
                },
                courtRoles: {
                    palace: ['King', 'Chief State Councilor', 'Royal Secretary', 'Court Painter', 'Royal Guard']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Korean Empire / Japanese Colonial Government',
                dominantPowerDescription: 'Korea briefly modernizes as the Korean Empire before falling under Japanese colonial rule, leading to resistance movements.',
                eraContextSentence: 'an era of lost independence, where Korea struggles under foreign rule while preserving its culture.',
                allegianceGroups: [
                    { name: 'Japanese Colonial Government', type: 'primary', description: 'Japanese administration of Korea.' },
                    { name: 'Korean Independence Movement', type: 'rebel', description: 'Underground resistance to Japanese rule.' },
                    { name: 'Pro-Japanese Collaborators', type: 'secondary', description: 'Koreans working with the colonial government.' },
                    { name: 'Traditional Scholars', type: 'rebel', description: 'Confucian intellectuals opposing modernization.' }
                ],
                structureNames: {
                    fortress: ['Japanese Garrison', 'Police Station', 'Gendarmerie Post'],
                    factory: ['Colonial Factory', 'Mining Operation', 'Railway Workshop', 'Textile Mill'],
                    trading_post: ['Railway Station', 'Colonial Trading Post', 'Modern Port'],
                    holy_site: ['Resistance Meeting Place', 'Traditional Shrine', 'Christian Church', 'Independence Memorial'],
                    palace: ['Governor-General Building', 'Colonial Administrative Office', 'Japanese Residence']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Republic of Korea / Democratic People\'s Republic of Korea',
                dominantPowerDescription: 'After liberation and civil war, Korea divides into two competing states, with South Korea becoming a democracy and economic powerhouse.',
                eraContextSentence: 'an era of division and miracle, where one nation becomes two, each following different paths.',
                allegianceGroups: [
                    { name: 'Republic of Korea (South)', type: 'primary', description: 'Democratic capitalist state.' },
                    { name: 'Democratic People\'s Republic of Korea (North)', type: 'rebel', description: 'Communist state across the DMZ.' },
                    { name: 'United States', type: 'secondary', description: 'Major ally and security guarantor.' },
                    { name: 'People\'s Republic of China', type: 'secondary', description: 'Major regional power and North Korean ally.' }
                ],
                structureNames: {
                    fortress: ['DMZ Guard Post', 'Military Base', 'Air Defense Site'],
                    factory: ['Chaebol Headquarters', 'Electronics Plant', 'Shipyard', 'Auto Factory', 'Steel Mill'],
                    trading_post: ['International Airport', 'Container Port', 'Technology Hub', 'Financial Center'],
                    holy_site: ['War Memorial', 'Traditional Temple', 'Christian Megachurch', 'Democracy Monument'],
                    palace: ['Blue House', 'National Assembly', 'Corporate Tower', 'Government Complex']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'United Korean Federation',
                dominantPowerDescription: 'After peaceful reunification, Korea becomes a leader in virtual reality, cultural technology, and sustainable urban development.',
                eraContextSentence: 'an era of reunion and innovation, where Korean creativity shapes global culture and technology.',
                allegianceGroups: [
                    { name: 'Korean Federation', type: 'primary', description: 'Reunified democratic Korea.' },
                    { name: 'Global Cultural Alliance', type: 'secondary', description: 'International soft power cooperation.' },
                    { name: 'Northeast Asian Union', type: 'secondary', description: 'Regional integration bloc.' },
                    { name: 'Isolation Remnants', type: 'rebel', description: 'Former North Korean hardliners opposing integration.' }
                ],
                structureNames: {
                    fortress: ['Cyber Defense Center', 'Cultural Protection Unit', 'Reunification Security'],
                    factory: ['Virtual Reality Complex', 'Cultural Content Studio', 'Sustainable Tech Lab'],
                    trading_post: ['Global Culture Hub', 'Virtual Commerce Center', 'Reunification Exchange'],
                    holy_site: ['Reunification Memorial', 'Digital Culture Shrine', 'Peace Harmony Temple'],
                    palace: ['Federation Capital', 'Cultural Democracy Center', 'Innovation Governance Complex']
                }
            }
        },
        "Taiwan and Ryukyu": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Indigenous Austronesian Peoples',
                dominantPowerDescription: 'Taiwan is inhabited by diverse Austronesian tribes, while the Ryukyu Islands develop their own distinct culture.',
                eraContextSentence: 'an age of island peoples, where Austronesian cultures flourish across scattered islands.',
                allegianceGroups: [
                    { name: 'Taiwanese Indigenous Tribes', type: 'primary', description: 'Various Austronesian tribal groups.' },
                    { name: 'Ryukyu Islanders', type: 'secondary', description: 'Proto-Okinawan peoples.' },
                    { name: 'Coastal Chinese Traders', type: 'secondary', description: 'Occasional mainland visitors.' },
                    { name: 'Maritime Southeast Asian Peoples', type: 'secondary', description: 'Related Austronesian groups.' }
                ],
                structureNames: {
                    fortress: ['Mountain Village', 'Coastal Fortification', 'Tribal Stronghold'],
                    factory: ['Stone Tool Workshop', 'Pottery Making Site'],
                    trading_post: ['Beach Landing', 'Island Trading Ground'],
                    holy_site: ['Ancestor Shrine', 'Sacred Grove', 'Mountain Spirit Site'],
                    palace: ['Chief\'s House', 'Tribal Meeting Ground']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Ryukyu Kingdom',
                dominantPowerDescription: 'The Ryukyu Kingdom emerges as a major maritime trading power, while Taiwan remains largely inhabited by indigenous peoples.',
                eraContextSentence: 'an era of island kingdoms, where Ryukyu becomes a bridge between East and Southeast Asia.',
                allegianceGroups: [
                    { name: 'Ryukyu Kingdom', type: 'primary', description: 'Maritime trading kingdom in the Ryukyu Islands.' },
                    { name: 'Ming Dynasty', type: 'secondary', description: 'Chinese suzerain and major trading partner.' },
                    { name: 'Taiwanese Indigenous Peoples', type: 'secondary', description: 'Island inhabitants with minimal outside contact.' },
                    { name: 'Southeast Asian Traders', type: 'secondary', description: 'Maritime merchants from the south.' }
                ],
                structureNames: {
                    fortress: ['Shuri Castle', 'Coastal Defense', 'Trading Post Fort'],
                    factory: ['Lacquerware Workshop', 'Textile Mill', 'Pottery Kiln'],
                    trading_post: ['Royal Trading House', 'International Port', 'Merchant Quarter'],
                    holy_site: ['Ryukyu Temple', 'Ancestor Shrine', 'Sacred Island'],
                    palace: ['Royal Palace (Shuri)', 'Regional Capital', 'Noble Residence']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Dutch Colonial Taiwan / Satsuma-controlled Ryukyu',
                dominantPowerDescription: 'Dutch colonists establish Fort Zeelandia in Taiwan, while Japan\'s Satsuma domain takes control of the Ryukyu Kingdom.',
                eraContextSentence: 'an era of foreign control, where European and Japanese powers compete for island dominance.',
                allegianceGroups: [
                    { name: 'Dutch East India Company', type: 'primary', description: 'European colonial power in Taiwan.' },
                    { name: 'Satsuma Domain', type: 'primary', description: 'Japanese control over Ryukyu.' },
                    { name: 'Chinese Ming Loyalists', type: 'rebel', description: 'Refugees from Manchu conquest.' },
                    { name: 'Indigenous Taiwanese', type: 'rebel', description: 'Native peoples resisting colonization.' }
                ],
                structureNames: {
                    fortress: ['Fort Zeelandia', 'Japanese Garrison', 'Coastal Battery'],
                    factory: ['Sugar Mill', 'Colonial Workshop', 'Trading Warehouse'],
                    trading_post: ['Dutch Trading Post', 'Japanese Trading House', 'Chinese Merchant Quarter'],
                    holy_site: ['Christian Mission', 'Buddhist Temple', 'Indigenous Sacred Site'],
                    palace: ['Colonial Governor Residence', 'Japanese Administrative Center']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Japanese Taiwan / Japanese Okinawa',
                dominantPowerDescription: 'Japan incorporates both Taiwan and the Ryukyu Kingdom (as Okinawa Prefecture) into its empire, modernizing the islands.',
                eraContextSentence: 'an era of Japanese integration, where island peoples are incorporated into the modern Japanese state.',
                allegianceGroups: [
                    { name: 'Japanese Colonial Government', type: 'primary', description: 'Imperial Japanese administration.' },
                    { name: 'Taiwanese Resistance', type: 'rebel', description: 'Anti-Japanese resistance movements.' },
                    { name: 'Traditional Ryukyu Nobility', type: 'secondary', description: 'Former royal family under Japanese rule.' },
                    { name: 'Western Powers', type: 'secondary', description: 'Foreign powers with interests in the region.' }
                ],
                structureNames: {
                    fortress: ['Japanese Military Base', 'Colonial Police Station', 'Coastal Defense'],
                    factory: ['Sugar Refinery', 'Modern Factory', 'Railway Workshop'],
                    trading_post: ['Modern Port', 'Railway Station', 'Colonial Trading House'],
                    holy_site: ['Shinto Shrine', 'Buddhist Temple', 'Traditional Sacred Site'],
                    palace: ['Governor-General Building', 'Japanese Administrative Office', 'Modern Government Building']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Republic of China (Taiwan) / US-administered then Japanese Okinawa',
                dominantPowerDescription: 'After WWII, Taiwan becomes the refuge of the Republic of China, while Okinawa is occupied by the US before returning to Japan.',
                eraContextSentence: 'an era of contested sovereignty, where Taiwan and Okinawa navigate between great powers.',
                allegianceGroups: [
                    { name: 'Republic of China (Taiwan)', type: 'primary', description: 'Chinese Nationalist government in exile.' },
                    { name: 'People\'s Republic of China', type: 'rebel', description: 'Mainland China claiming Taiwan.' },
                    { name: 'United States', type: 'secondary', description: 'Major security partner and Okinawa administrator.' },
                    { name: 'Japan (Okinawa)', type: 'secondary', description: 'Resumed control of Okinawa in 1972.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'US Base (Okinawa)', 'Coastal Defense', 'Air Defense Site'],
                    factory: ['Electronics Factory', 'Semiconductor Plant', 'Textile Mill', 'Heavy Industry'],
                    trading_post: ['International Port', 'Export Processing Zone', 'Technology Park'],
                    holy_site: ['Memorial Hall', 'Traditional Temple', 'War Memorial'],
                    palace: ['Presidential Office', 'Government Building', 'Corporate Headquarters']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'Taiwan Digital Republic / Okinawan Autonomy',
                dominantPowerDescription: 'Taiwan becomes a leader in digital democracy and semiconductor technology, while Okinawa gains autonomy as a peace and cultural center.',
                eraContextSentence: 'an era of digital sovereignty, where islands lead innovation in governance and sustainable development.',
                allegianceGroups: [
                    { name: 'Taiwan Digital Republic', type: 'primary', description: 'Advanced democratic digital state.' },
                    { name: 'Global Democracy Alliance', type: 'secondary', description: 'International digital governance cooperation.' },
                    { name: 'Okinawan Autonomous Region', type: 'secondary', description: 'Self-governing peace and culture zone.' },
                    { name: 'Pacific Island Federation', type: 'secondary', description: 'Regional island cooperation bloc.' }
                ],
                structureNames: {
                    fortress: ['Cyber Democracy Shield', 'Digital Sovereignty Center', 'Peace Guardian Station'],
                    factory: ['Quantum Chip Fabrication', 'Sustainable Tech Complex', 'Ocean Energy Plant'],
                    trading_post: ['Digital Commerce Hub', 'Global Democracy Exchange', 'Innovation Trading Post'],
                    holy_site: ['Digital Democracy Shrine', 'Peace Harmony Center', 'Innovation Memorial'],
                    palace: ['Digital Governance Center', 'Citizen Participation Palace', 'Autonomous Council Complex']
                }
            }
        },
        "Siberia": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Various Indigenous Peoples',
                dominantPowerDescription: 'Siberia is inhabited by diverse indigenous groups including Turkic, Mongolic, and Paleo-Siberian peoples living as nomads and hunters.',
                eraContextSentence: 'an age of endless taiga, where diverse peoples adapt to the harsh northern lands.',
                allegianceGroups: [
                    { name: 'Turkic Tribes', type: 'primary', description: 'Various Turkic-speaking nomadic groups.' },
                    { name: 'Mongolic Peoples', type: 'secondary', description: 'Related to southern Mongol groups.' },
                    { name: 'Paleo-Siberian Tribes', type: 'secondary', description: 'Ancient indigenous hunting peoples.' },
                    { name: 'Arctic Coastal Peoples', type: 'secondary', description: 'Maritime-adapted northern tribes.' }
                ],
                structureNames: {
                    fortress: ['Winter Camp', 'Tribal Stronghold', 'Mountain Refuge'],
                    factory: ['Reindeer Pen', 'Hunting Camp', 'Tool Workshop'],
                    trading_post: ['Seasonal Trading Ground', 'River Crossing', 'Mountain Pass Station'],
                    holy_site: ['Sacred Grove', 'Shaman Circle', 'Ancestor Burial Ground'],
                    palace: ['Chief\'s Tent', 'Tribal Gathering Place']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Mongol Empire / Various Khanates',
                dominantPowerDescription: 'Parts of Siberia fall under Mongol control, while other regions remain dominated by local tribes and emerging Turkic khanates.',
                eraContextSentence: 'an era of nomadic empires, where Mongol power extends into the northern forests.',
                allegianceGroups: [
                    { name: 'Golden Horde', type: 'primary', description: 'Mongol khanate controlling western Siberia.' },
                    { name: 'Sibir Khanate', type: 'secondary', description: 'Turkic successor state.' },
                    { name: 'Independent Tribes', type: 'rebel', description: 'Various groups maintaining independence.' },
                    { name: 'Russian Principalities', type: 'secondary', description: 'Emerging power from the west.' }
                ],
                structureNames: {
                    fortress: ['Khan\'s Fortress', 'Tribal Stronghold', 'River Fort'],
                    factory: ['Fur Processing', 'Weapons Workshop', 'Metalworking Site'],
                    trading_post: ['Fur Trading Post', 'River Trading Station', 'Caravan Stop'],
                    holy_site: ['Islamic Mosque', 'Tengri Shrine', 'Shamanic Sacred Site'],
                    palace: ['Khan\'s Palace', 'Tribal Council Hall']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Russian Empire',
                dominantPowerDescription: 'Russian Cossacks and explorers conquer Siberia, establishing forts and trading posts while extracting furs and tribute from native peoples.',
                eraContextSentence: 'an era of Russian conquest, where Cossacks claim the vast Siberian wilderness for the Tsar.',
                allegianceGroups: [
                    { name: 'Russian Empire', type: 'primary', description: 'Expanding Tsarist state.' },
                    { name: 'Sibir Khanate', type: 'rebel', description: 'Declining Turkic state resisting Russian rule.' },
                    { name: 'Indigenous Tribute Peoples', type: 'secondary', description: 'Native groups paying yasak (tribute).' },
                    { name: 'Cossack Pioneers', type: 'secondary', description: 'Semi-independent military colonists.' }
                ],
                structureNames: {
                    fortress: ['Russian Fort (Ostrog)', 'Cossack Stronghold', 'Trading Fort'],
                    factory: ['Fur Processing Center', 'Blacksmith Shop', 'Boat Building Yard'],
                    trading_post: ['Fur Trading Post', 'River Station', 'Administrative Center'],
                    holy_site: ['Orthodox Church', 'Traditional Sacred Site', 'Missionary Station'],
                    palace: ['Governor\'s Residence', 'Cossack Headquarters', 'Administrative Building']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Russian Empire',
                dominantPowerDescription: 'The Trans-Siberian Railway transforms Siberia, bringing settlers, industry, and modern administration to the vast region.',
                eraContextSentence: 'an era of steel rails, where the Trans-Siberian Railway opens Siberia to the modern world.',
                allegianceGroups: [
                    { name: 'Russian Empire', type: 'primary', description: 'Tsarist government modernizing Siberia.' },
                    { name: 'Railway Workers', type: 'secondary', description: 'Builders and operators of the Trans-Siberian.' },
                    { name: 'Siberian Regionalists', type: 'rebel', description: 'Groups advocating for Siberian autonomy.' },
                    { name: 'Indigenous Peoples', type: 'secondary', description: 'Native groups adapting to modernization.' }
                ],
                structureNames: {
                    fortress: ['Railway Guard Station', 'Military Garrison', 'Border Fort'],
                    factory: ['Mining Operation', 'Lumber Mill', 'Railway Workshop'],
                    trading_post: ['Railway Station', 'Trading Post', 'Telegraph Office'],
                    holy_site: ['Orthodox Church', 'Traditional Shrine', 'Sectarian Meeting House'],
                    palace: ['Governor\'s Palace', 'Railway Administration', 'Regional Capital']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Soviet Union / Russian Federation',
                dominantPowerDescription: 'Under Soviet rule, Siberia becomes heavily industrialized with gulags, resource extraction, and closed cities, later transitioning to Russian Federation control.',
                eraContextSentence: 'an era of industrial transformation, where Siberia becomes the Soviet Union\'s resource powerhouse and strategic depth.',
                allegianceGroups: [
                    { name: 'Soviet Union / Russian Federation', type: 'primary', description: 'Central government controlling Siberian development.' },
                    { name: 'Indigenous Rights Movement', type: 'rebel', description: 'Native peoples fighting for land and cultural rights.' },
                    { name: 'Regional Oligarchs', type: 'secondary', description: 'Post-Soviet business leaders controlling resources.' },
                    { name: 'Environmental Activists', type: 'rebel', description: 'Groups opposing destructive industrial practices.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Nuclear Facility', 'Border Guard Station', 'Strategic Missile Base'],
                    factory: ['Heavy Industry Complex', 'Mining Operation', 'Oil Refinery', 'Closed City', 'Aluminum Smelter'],
                    trading_post: ['Railway Junction', 'Pipeline Terminal', 'Airport', 'Resource Export Hub'],
                    holy_site: ['War Memorial', 'Revolutionary Monument', 'Traditional Sacred Site'],
                    palace: ['Regional Administration', 'Party Headquarters', 'Oligarch Mansion', 'Government Complex']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'Siberian Ecological Federation',
                dominantPowerDescription: 'Siberia transforms into a model of sustainable development, balancing resource extraction with environmental restoration and indigenous rights.',
                eraContextSentence: 'an era of ecological renaissance, where Siberia leads global efforts in climate restoration and sustainable development.',
                allegianceGroups: [
                    { name: 'Ecological Federation', type: 'primary', description: 'Sustainable governance balancing all stakeholders.' },
                    { name: 'Global Climate Restoration Alliance', type: 'secondary', description: 'International environmental cooperation.' },
                    { name: 'Indigenous Peoples Council', type: 'secondary', description: 'Autonomous native governance structures.' },
                    { name: 'Resource Extraction Lobby', type: 'rebel', description: 'Groups opposing environmental restrictions.' }
                ],
                structureNames: {
                    fortress: ['Climate Defense Station', 'Ecological Monitoring Center', 'Restoration Guard Post'],
                    factory: ['Carbon Sequestration Plant', 'Sustainable Mining Complex', 'Renewable Energy Hub', 'Reforestation Center'],
                    trading_post: ['Eco-Resource Exchange', 'Carbon Credit Trading Post', 'Sustainable Goods Hub'],
                    holy_site: ['Earth Harmony Shrine', 'Indigenous Cultural Center', 'Ecological Memorial'],
                    palace: ['Ecological Council Complex', 'Indigenous Governance Center', 'Sustainability Coordination Palace']
                }
            }
        },
        "Central Asian Oases": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Sogdian City-States',
                dominantPowerDescription: 'Sogdian merchants control the Central Asian trade routes, establishing prosperous oasis cities that facilitate exchange between East and West.',
                eraContextSentence: 'an age of merchant princes, where Sogdian traders control the crossroads of the world.',
                allegianceGroups: [
                    { name: 'Sogdian Merchant Republics', type: 'primary', description: 'Wealthy trading city-states.' },
                    { name: 'Sassanid Empire', type: 'secondary', description: 'Persian empire to the west.' },
                    { name: 'Chinese Han Dynasty', type: 'secondary', description: 'Eastern terminus of trade routes.' },
                    { name: 'Nomadic Tribes', type: 'rebel', description: 'Various steppe peoples threatening trade.' }
                ],
                structureNames: {
                    fortress: ['Oasis Citadel', 'Caravan Fortress', 'Mountain Stronghold'],
                    factory: ['Silk Workshop', 'Metalworking Shop', 'Leather Goods Workshop'],
                    trading_post: ['Caravanserai', 'Silk Road Station', 'Desert Trading Post', 'Oasis Market'],
                    holy_site: ['Zoroastrian Fire Temple', 'Buddhist Monastery', 'Merchant Shrine'],
                    palace: ['Merchant Prince Palace', 'Trading Guild Hall', 'City Governor Residence']
                },
                courtRoles: {
                    palace: ['Merchant Prince', 'Caravan Master', 'Guild Leader', 'Foreign Diplomat']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Islamic Sultanates',
                dominantPowerDescription: 'Islamic conquest brings the region into the Islamic world, with various sultanates and emirates controlling the oasis cities and trade routes.',
                eraContextSentence: 'an era of Islamic civilization, where Central Asian cities become centers of learning and trade in the Muslim world.',
                allegianceGroups: [
                    { name: 'Samanid Dynasty', type: 'primary', description: 'Persian Muslim dynasty controlling much of Central Asia.' },
                    { name: 'Abbasid Caliphate', type: 'secondary', description: 'Islamic empire providing religious authority.' },
                    { name: 'Turkic Tribes', type: 'rebel', description: 'Nomadic groups converting to Islam and challenging settled powers.' },
                    { name: 'Chinese Tang Dynasty', type: 'secondary', description: 'Eastern empire competing for influence.' }
                ],
                structureNames: {
                    fortress: ['Islamic Citadel', 'Border Fortress', 'Mountain Castle'],
                    factory: ['Textile Workshop', 'Papermaking Mill', 'Metalworking Shop'],
                    trading_post: ['Covered Bazaar', 'Caravanserai', 'Silk Road Depot', 'Spice Market'],
                    holy_site: ['Grand Mosque', 'Madrasa', 'Sufi Lodge', 'Scholar\'s Academy'],
                    palace: ['Sultan\'s Palace', 'Emir\'s Residence', 'Governor\'s Compound']
                },
                courtRoles: {
                    palace: ['Sultan', 'Vizier', 'Military Commander', 'Court Scholar'],
                    holy_site: ['Imam', 'Scholar', 'Sufi Master', 'Madrasa Teacher']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Uzbek Khanates',
                dominantPowerDescription: 'Turkic Uzbek dynasties establish powerful khanates in Bukhara, Khiva, and Kokand, maintaining Islamic civilization while facing pressure from expanding empires.',
                eraContextSentence: 'an era of Uzbek power, where ancient oasis cities maintain their Islamic heritage under Turkic rule.',
                allegianceGroups: [
                    { name: 'Bukhara Khanate', type: 'primary', description: 'Most powerful Central Asian state.' },
                    { name: 'Khiva Khanate', type: 'secondary', description: 'Northwestern rival state.' },
                    { name: 'Kokand Khanate', type: 'secondary', description: 'Eastern rival in the Ferghana Valley.' },
                    { name: 'Safavid Persia', type: 'secondary', description: 'Shiite Persian empire to the southwest.' }
                ],
                structureNames: {
                    fortress: ['Khan\'s Citadel', 'Oasis Fortress', 'Caravan Defense Post'],
                    factory: ['Silk Weaving Workshop', 'Carpet Making Center', 'Metalcraft Shop'],
                    trading_post: ['Grand Bazaar', 'Caravanserai', 'Custom House', 'Merchant Quarter'],
                    holy_site: ['Central Mosque', 'Madrasa Complex', 'Sufi Shrine', 'Scholars\' Library'],
                    palace: ['Khan\'s Palace', 'Royal Court Complex', 'Governor\'s Residence']
                },
                courtRoles: {
                    palace: ['Khan', 'Chief Minister', 'Military Commander', 'Court Poet']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Russian Empire',
                dominantPowerDescription: 'Russian expansion conquers the Central Asian khanates, incorporating them into the Tsarist empire and beginning modernization efforts.',
                eraContextSentence: 'an era of Russian conquest, where ancient Islamic civilization encounters European imperial power.',
                allegianceGroups: [
                    { name: 'Russian Empire', type: 'primary', description: 'Conquering European empire.' },
                    { name: 'Local Islamic Leaders', type: 'secondary', description: 'Traditional authorities under Russian rule.' },
                    { name: 'Basmachi Resistance', type: 'rebel', description: 'Islamic resistance to Russian and later Soviet rule.' },
                    { name: 'Jadid Reformers', type: 'secondary', description: 'Muslim modernization movement.' }
                ],
                structureNames: {
                    fortress: ['Russian Garrison', 'Imperial Fortress', 'Border Guard Post'],
                    factory: ['Cotton Processing Mill', 'Railway Workshop', 'Modern Factory'],
                    trading_post: ['Railway Station', 'Russian Trading House', 'Telegraph Office'],
                    holy_site: ['Traditional Mosque', 'Orthodox Church', 'Reformist School'],
                    palace: ['Governor-General Palace', 'Russian Administrative Building', 'Colonial Residence']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Soviet Central Asian Republics',
                dominantPowerDescription: 'The Soviet Union creates separate Central Asian republics, industrializing the region while suppressing Islamic culture and promoting socialist development.',
                eraContextSentence: 'an era of Soviet transformation, where ancient oasis cities become modern socialist republics.',
                allegianceGroups: [
                    { name: 'Soviet Union', type: 'primary', description: 'Communist central government.' },
                    { name: 'Local Communist Parties', type: 'secondary', description: 'Regional Soviet authorities.' },
                    { name: 'Islamic Underground', type: 'rebel', description: 'Hidden religious resistance.' },
                    { name: 'Independence Movements', type: 'rebel', description: 'National liberation groups emerging in late Soviet era.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Border Guard Station', 'Strategic Facility'],
                    factory: ['Cotton Processing Complex', 'Heavy Industry Plant', 'Chemical Works', 'Collective Farm'],
                    trading_post: ['Railway Hub', 'Airport', 'State Distribution Center'],
                    holy_site: ['Soviet Memorial', 'Underground Mosque', 'State Museum'],
                    palace: ['Party Headquarters', 'Government Building', 'Soviet Palace of Culture']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'Central Asian Sustainability Union',
                dominantPowerDescription: 'Independent Central Asian nations form a union focused on water management, renewable energy, and reviving traditional crafts for the global market.',
                eraContextSentence: 'an era of sustainable renaissance, where ancient wisdom guides modern solutions to climate and resource challenges.',
                allegianceGroups: [
                    { name: 'Sustainability Union', type: 'primary', description: 'Regional cooperation focused on environmental and economic sustainability.' },
                    { name: 'Global Water Management Alliance', type: 'secondary', description: 'International cooperation on water resources.' },
                    { name: 'Islamic Cultural Revival Movement', type: 'secondary', description: 'Peaceful restoration of traditional culture.' },
                    { name: 'Resource Extraction Corporations', type: 'rebel', description: 'International companies opposing sustainability measures.' }
                ],
                structureNames: {
                    fortress: ['Water Security Command', 'Climate Defense Center', 'Resource Protection Station'],
                    factory: ['Solar-Wind Energy Complex', 'Sustainable Textile Mill', 'Water Purification Plant', 'Organic Agriculture Center'],
                    trading_post: ['Green Silk Road Hub', 'Sustainable Goods Exchange', 'Cultural Tourism Center'],
                    holy_site: ['Restored Islamic Complex', 'Eco-Spirituality Center', 'Cultural Heritage Site'],
                    palace: ['Union Council Palace', 'Sustainability Coordination Center', 'Cultural Democracy Complex']
                }
            }
        },
        "Xinjiang": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Various Nomadic Peoples',
                dominantPowerDescription: 'The Tarim Basin is inhabited by Indo-European speaking peoples including the Tocharians, alongside various nomadic groups controlling the Silk Road oases.',
                eraContextSentence: 'an age of desert kingdoms, where Tocharian cities control the western reaches of the Silk Road.',
                allegianceGroups: [
                    { name: 'Tocharian City-States', type: 'primary', description: 'Indo-European speaking oasis dwellers.' },
                    { name: 'Xiongnu Confederacy', type: 'secondary', description: 'Nomadic empire controlling northern routes.' },
                    { name: 'Han Dynasty', type: 'secondary', description: 'Chinese empire extending influence westward.' },
                    { name: 'Sogdian Merchants', type: 'secondary', description: 'Central Asian traders.' }
                ],
                structureNames: {
                    fortress: ['Oasis Citadel', 'Desert Fortress', 'Mountain Stronghold'],
                    factory: ['Textile Workshop', 'Jade Carving Shop', 'Metalworking Center'],
                    trading_post: ['Silk Road Station', 'Caravanserai', 'Desert Trading Post', 'Oasis Market'],
                    holy_site: ['Buddhist Monastery', 'Tocharian Temple', 'Sacred Oasis'],
                    palace: ['City King Palace', 'Oasis Ruler Residence', 'Tribal Chief Compound']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Turkic Khaganates',
                dominantPowerDescription: 'Various Turkic groups, including the Western Turkic Khaganate, control the region while Buddhism and later Islam spread through the oasis cities.',
                eraContextSentence: 'an era of Turkic ascendancy, where nomadic empires control the crossroads between East and West.',
                allegianceGroups: [
                    { name: 'Western Turkic Khaganate', type: 'primary', description: 'Turkic nomadic empire.' },
                    { name: 'Tang Dynasty', type: 'secondary', description: 'Chinese empire competing for control.' },
                    { name: 'Tibetan Empire', type: 'secondary', description: 'Expanding Tibetan power from the south.' },
                    { name: 'Islamic Caliphate', type: 'secondary', description: 'Arab empire bringing Islam.' }
                ],
                structureNames: {
                    fortress: ['Turkic Fortress', 'Oasis Citadel', 'Mountain Defense'],
                    factory: ['Carpet Weaving Center', 'Metalworking Shop', 'Leather Goods Workshop'],
                    trading_post: ['Silk Road Depot', 'Turkic Trading Post', 'Cultural Exchange Center'],
                    holy_site: ['Buddhist Cave Temple', 'Islamic Mosque', 'Tengri Shrine'],
                    palace: ['Khagan Palace', 'Regional Ruler Residence', 'Tribal Assembly Hall']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Chagatai Khanate Successors',
                dominantPowerDescription: 'Various Turkic and Mongol successor states to the Chagatai Khanate control different parts of the region, while Islam becomes the dominant religion.',
                eraContextSentence: 'an era of fragmented rule, where Islamic Turkic states compete for control of the Silk Road.',
                allegianceGroups: [
                    { name: 'Yarkent Khanate', type: 'primary', description: 'Turkic Islamic state in the Tarim Basin.' },
                    { name: 'Dzungar Khanate', type: 'secondary', description: 'Buddhist Mongol state in northern Xinjiang.' },
                    { name: 'Ming Dynasty', type: 'secondary', description: 'Chinese empire with indirect influence.' },
                    { name: 'Central Asian Khanates', type: 'secondary', description: 'Related Turkic states to the west.' }
                ],
                structureNames: {
                    fortress: ['Islamic Citadel', 'Oasis Defense', 'Mountain Fortress'],
                    factory: ['Silk Workshop', 'Carpet Manufacturing', 'Jade Processing'],
                    trading_post: ['Grand Bazaar', 'Caravanserai', 'Silk Road Terminus'],
                    holy_site: ['Central Mosque', 'Sufi Shrine', 'Islamic School'],
                    palace: ['Khan Palace', 'Islamic Court Complex', 'Governor Residence']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Qing Dynasty',
                dominantPowerDescription: 'The Qing Dynasty conquers and integrates Xinjiang into the Chinese empire, establishing firm control over the region and its trade routes.',
                eraContextSentence: 'an era of Chinese integration, where the Qing Empire brings Xinjiang under firm imperial control.',
                allegianceGroups: [
                    { name: 'Qing Dynasty', type: 'primary', description: 'Manchu empire consolidating control.' },
                    { name: 'Local Islamic Leaders', type: 'secondary', description: 'Traditional authorities under Chinese rule.' },
                    { name: 'Russian Empire', type: 'secondary', description: 'Expanding power competing for influence.' },
                    { name: 'Yakub Beg State', type: 'rebel', description: 'Short-lived independent Islamic state.' }
                ],
                structureNames: {
                    fortress: ['Qing Garrison', 'Imperial Fort', 'Border Defense Post'],
                    factory: ['Modern Workshop', 'Traditional Craft Center', 'Mining Operation'],
                    trading_post: ['Imperial Trading Post', 'Custom House', 'Transport Station'],
                    holy_site: ['Imperial Mosque', 'Buddhist Temple', 'Confucian School'],
                    palace: ['Governor Palace', 'Imperial Administration', 'Military Headquarters']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'People\'s Republic of China',
                dominantPowerDescription: 'Under Communist rule, Xinjiang is developed as an autonomous region with significant Han Chinese settlement, while maintaining its designation as a Uyghur homeland.',
                eraContextSentence: 'an era of socialist development, where Xinjiang becomes integrated into modern China while maintaining its cultural autonomy.',
                allegianceGroups: [
                    { name: 'People\'s Republic of China', type: 'primary', description: 'Communist central government.' },
                    { name: 'Uyghur Autonomous Government', type: 'secondary', description: 'Regional ethnic autonomous administration.' },
                    { name: 'Han Chinese Settlers', type: 'secondary', description: 'Economic migrants from eastern China.' },
                    { name: 'Traditional Uyghur Leaders', type: 'secondary', description: 'Cultural and religious community leaders.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Border Guard Station', 'Strategic Facility'],
                    factory: ['Oil Refinery', 'Cotton Processing Plant', 'Heavy Industry Complex', 'Mining Operation'],
                    trading_post: ['Railway Station', 'Highway Junction', 'Border Crossing', 'Economic Development Zone'],
                    holy_site: ['Mosque', 'Buddhist Temple', 'Cultural Center', 'Memorial Hall'],
                    palace: ['Regional Government Building', 'Party Headquarters', 'Administrative Complex']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'Xinjiang Harmony Federation',
                dominantPowerDescription: 'Xinjiang evolves into a model of multicultural cooperation, balancing development with cultural preservation and serving as a bridge between China and Central Asia.',
                eraContextSentence: 'an era of cultural synthesis, where diverse peoples create a harmonious model of multicultural development.',
                allegianceGroups: [
                    { name: 'Harmony Federation', type: 'primary', description: 'Multicultural regional government.' },
                    { name: 'Silk Road Revival Alliance', type: 'secondary', description: 'International trade and cultural cooperation.' },
                    { name: 'Cultural Preservation Council', type: 'secondary', description: 'Indigenous and minority rights organization.' },
                    { name: 'Assimilationist Movement', type: 'rebel', description: 'Groups opposing multicultural policies.' }
                ],
                structureNames: {
                    fortress: ['Cultural Protection Center', 'Harmony Security Station', 'Border Friendship Post'],
                    factory: ['Renewable Energy Complex', 'Cultural Goods Manufacturing', 'Sustainable Development Center'],
                    trading_post: ['New Silk Road Hub', 'Cultural Exchange Center', 'Multicultural Commerce Zone'],
                    holy_site: ['Interfaith Harmony Center', 'Cultural Heritage Complex', 'Wisdom Synthesis Temple'],
                    palace: ['Multicultural Governance Center', 'Harmony Council Palace', 'Cultural Democracy Complex']
                }
            }
        },
        "West China and Tibet": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Various Tibetan Tribes',
                dominantPowerDescription: 'The Tibetan plateau is inhabited by various nomadic and semi-nomadic tribes practicing Bon religion, while Chinese influence is minimal.',
                eraContextSentence: 'an age of highland tribes, where Tibetan peoples develop their unique culture on the roof of the world.',
                allegianceGroups: [
                    { name: 'Tibetan Tribal Confederations', type: 'primary', description: 'Various highland tribal groups.' },
                    { name: 'Qiang Peoples', type: 'secondary', description: 'Related highland peoples in eastern regions.' },
                    { name: 'Han Dynasty', type: 'secondary', description: 'Chinese empire with limited western influence.' },
                    { name: 'Central Asian Nomads', type: 'secondary', description: 'Various steppe peoples.' }
                ],
                structureNames: {
                    fortress: ['Mountain Stronghold', 'Highland Fort', 'Tribal Citadel'],
                    factory: ['Yak Processing Center', 'Wool Workshop', 'Metal Workshop'],
                    trading_post: ['Highland Trading Post', 'Caravan Stop', 'Tribal Market'],
                    holy_site: ['Bon Temple', 'Sacred Mountain Shrine', 'Sky Burial Site'],
                    palace: ['Tribal Chief Palace', 'Highland Ruler Residence', 'Council Hall']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Tibetan Empire',
                dominantPowerDescription: 'The Tibetan Empire emerges as a major power, rivaling Tang China and controlling vast territories while Buddhism is introduced and begins to spread.',
                eraContextSentence: 'the age of Tibetan empire, where highland warriors challenge China and embrace Buddhism.',
                allegianceGroups: [
                    { name: 'Tibetan Empire', type: 'primary', description: 'Unified Tibetan imperial state.' },
                    { name: 'Tang Dynasty', type: 'secondary', description: 'Major rival Chinese empire.' },
                    { name: 'Abbasid Caliphate', type: 'secondary', description: 'Islamic empire to the west.' },
                    { name: 'Indian Buddhist Kingdoms', type: 'secondary', description: 'Source of Buddhist teaching.' }
                ],
                structureNames: {
                    fortress: ['Imperial Citadel', 'Mountain Fortress', 'Border Defense'],
                    factory: ['Armor Workshop', 'Textile Mill', 'Religious Craft Center'],
                    trading_post: ['Empire Trading Post', 'Silk Road Station', 'Buddhist Pilgrimage Center'],
                    holy_site: ['Buddhist Monastery', 'Bon Temple', 'Imperial Temple', 'Sacred Cave'],
                    palace: ['Tsenpo Palace', 'Imperial Court', 'Regional Capital']
                },
                courtRoles: {
                    palace: ['Tsenpo (Emperor)', 'Imperial Minister', 'Military Commander', 'Buddhist Advisor'],
                    holy_site: ['Buddhist Abbot', 'Bon Priest', 'Tantric Master']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Ganden Phodrang (Dalai Lama Government)',
                dominantPowerDescription: 'Tibet becomes a theocratic state under the Dalai Lamas, supported by Mongol patrons and maintaining independence from Chinese control.',
                eraContextSentence: 'an era of Buddhist theocracy, where the Dalai Lamas rule Tibet as god-kings.',
                allegianceGroups: [
                    { name: 'Ganden Phodrang Government', type: 'primary', description: 'Theocratic government under the Dalai Lama.' },
                    { name: 'Mongol Patrons', type: 'secondary', description: 'Mongol supporters of Tibetan Buddhism.' },
                    { name: 'Ming Dynasty', type: 'secondary', description: 'Chinese empire with nominal suzerainty.' },
                    { name: 'Tibetan Noble Families', type: 'secondary', description: 'Aristocratic families supporting the theocracy.' }
                ],
                structureNames: {
                    fortress: ['Potala Palace Fortress', 'Monastery Fortress', 'Mountain Citadel'],
                    factory: ['Monastery Workshop', 'Religious Art Center', 'Textile Mill'],
                    trading_post: ['Lhasa Market', 'Monastery Trading Post', 'Caravan Station'],
                    holy_site: ['Great Monastery (Sera, Drepung, Ganden)', 'Potala Palace', 'Sacred Lake Shrine'],
                    palace: ['Potala Palace', 'Dalai Lama Residence', 'Noble Family Palace']
                },
                courtRoles: {
                    palace: ['Dalai Lama', 'Regent', 'Kashag Minister', 'Monastic Official'],
                    holy_site: ['Geshe Scholar', 'Rinpoche', 'Monastery Abbot']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Qing Dynasty / British Influence',
                dominantPowerDescription: 'Tibet remains nominally under Qing suzerainty while maintaining practical independence, with increasing British interest from India creating the "Great Game" dynamics.',
                eraContextSentence: 'an era of great power competition, where Tibet becomes a prize in the imperial rivalry between Britain, China, and Russia.',
                allegianceGroups: [
                    { name: 'Tibetan Government', type: 'primary', description: 'Traditional theocratic administration.' },
                    { name: 'Qing Dynasty', type: 'secondary', description: 'Nominal Chinese suzerain.' },
                    { name: 'British Empire', type: 'secondary', description: 'Imperial power seeking influence from India.' },
                    { name: 'Russian Empire', type: 'secondary', description: 'Competing imperial influence.' }
                ],
                structureNames: {
                    fortress: ['Traditional Fortress', 'Border Defense', 'Monastery Citadel'],
                    factory: ['Traditional Craft Workshop', 'Monastery Production Center'],
                    trading_post: ['Cross-Border Trading Post', 'Pilgrimage Center', 'Caravan Station'],
                    holy_site: ['Major Monastery', 'Sacred Site', 'Pilgrimage Destination'],
                    palace: ['Potala Palace', 'Government Building', 'Noble Residence']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'People\'s Republic of China',
                dominantPowerDescription: 'China incorporates Tibet as an autonomous region, implementing socialist reforms while preserving some aspects of Tibetan culture and Buddhism.',
                eraContextSentence: 'an era of socialist transformation, where Tibet is integrated into modern China while maintaining its autonomous status.',
                allegianceGroups: [
                    { name: 'People\'s Republic of China', type: 'primary', description: 'Communist central government.' },
                    { name: 'Tibet Autonomous Region Government', type: 'secondary', description: 'Regional administration.' },
                    { name: 'Tibetan Buddhist Monasteries', type: 'secondary', description: 'Religious institutions under state oversight.' },
                    { name: 'Dalai Lama Government-in-Exile', type: 'rebel', description: 'Exiled traditional government in India.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Border Guard Station', 'Strategic Outpost'],
                    factory: ['Mining Operation', 'Hydroelectric Plant', 'Textile Factory', 'Traditional Craft Center'],
                    trading_post: ['Railway Station', 'Highway Junction', 'Border Trading Post'],
                    holy_site: ['Restored Monastery', 'Cultural Heritage Site', 'Memorial Hall'],
                    palace: ['Regional Government Building', 'Party Headquarters', 'Administrative Complex']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'Tibet Ecological Sanctuary',
                dominantPowerDescription: 'Tibet becomes a global model for high-altitude ecosystem preservation, balancing traditional Buddhism with environmental science and sustainable development.',
                eraContextSentence: 'an era of ecological enlightenment, where ancient wisdom guides global environmental restoration efforts.',
                allegianceGroups: [
                    { name: 'Ecological Sanctuary Administration', type: 'primary', description: 'Environmental governance balancing tradition and science.' },
                    { name: 'Global Climate Research Alliance', type: 'secondary', description: 'International scientific cooperation.' },
                    { name: 'Buddhist Environmental Movement', type: 'secondary', description: 'Religious groups promoting ecological dharma.' },
                    { name: 'Development Pressure Groups', type: 'rebel', description: 'Forces seeking intensive resource extraction.' }
                ],
                structureNames: {
                    fortress: ['Ecosystem Defense Station', 'Climate Monitoring Center', 'Sacred Site Protection'],
                    factory: ['Renewable Energy Installation', 'Sustainable Development Center', 'Ecological Research Lab'],
                    trading_post: ['Eco-Tourism Hub', 'Sustainable Goods Exchange', 'Pilgrimage-Science Center'],
                    holy_site: ['Ecological Buddhist Monastery', 'Sacred Nature Shrine', 'Enlightenment-Environment Center'],
                    palace: ['Ecological Wisdom Council', 'Environmental Dharma Palace', 'Sanctuary Coordination Center']
                }
            }
        },
        "Kazakh Steppes": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Scythian Confederation',
                dominantPowerDescription: 'Nomadic horse warriors control vast grasslands, mastering mounted archery and creating elaborate golden art.',
                eraContextSentence: 'the endless steppe where warriors follow seasonal pastures and bury their kings with golden treasures.',
                allegianceGroups: [
                    { name: 'Royal Scythians', type: 'primary', description: 'The ruling warrior elite.' },
                    { name: 'Saka Tribes', type: 'secondary', description: 'Eastern Scythian peoples.' },
                    { name: 'Sarmatian Clans', type: 'secondary', description: 'Related Iranian nomads.' },
                    { name: 'Greek Trading Colonies', type: 'trade_company', description: 'Black Sea merchants.' }
                ],
                structureNames: {
                    fortress: ['Kurgan', 'Nomad Camp', 'Defensive Earthwork'],
                    holy_site: ['Sky Burial Ground', 'Shamanistic Circle', 'Golden Man Tomb'],
                    palace: ['Khan\'s Mobile Court', 'Royal Yurt Complex'],
                    trading_post: ['Silk Road Caravanserai', 'Horse Market', 'Gold Exchange']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Turkic Khaganate',
                dominantPowerDescription: 'Turkic confederations dominate the steppes, controlling Silk Road trade and influencing settled civilizations.',
                eraContextSentence: 'the age of the eternal blue sky, where Turkic khans rule from the Altai to the Caspian.',
                allegianceGroups: [
                    { name: 'Western Turkic Khaganate', type: 'primary', description: 'The dominant steppe empire.' },
                    { name: 'Khazar Khaganate', type: 'secondary', description: 'Jewish-converted trading empire.' },
                    { name: 'Kipchak Confederation', type: 'secondary', description: 'Cumans and related tribes.' },
                    { name: 'Sogdian Merchants', type: 'trade_company', description: 'Silk Road middlemen.' }
                ],
                structureNames: {
                    fortress: ['Ordu (Military Camp)', 'Stone Balbals', 'Steppe Fortress'],
                    holy_site: ['Tengrist Shrine', 'Ancestor Stones', 'Sacred Mountain'],
                    palace: ['Khagan\'s Ordu', 'Noble Yurt Circle'],
                    trading_post: ['Silk Road Station', 'Fur Market', 'Slave Market']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Kazakh Khanate',
                dominantPowerDescription: 'The Kazakhs establish their khanate, maintaining nomadic traditions while resisting Russian and Chinese expansion.',
                eraContextSentence: 'the last free steppes, where Kazakh hordes preserve ancient ways against encroaching empires.',
                allegianceGroups: [
                    { name: 'Kazakh Khanate', type: 'primary', description: 'United Kazakh tribes under the khan.' },
                    { name: 'Great Horde', type: 'secondary', description: 'Senior Kazakh confederation.' },
                    { name: 'Middle Horde', type: 'secondary', description: 'Central Kazakh tribes.' },
                    { name: 'Junior Horde', type: 'secondary', description: 'Western Kazakh confederation.' }
                ],
                structureNames: {
                    fortress: ['Khan\'s Stronghold', 'Border Fort', 'Tribal Gathering Ground'],
                    holy_site: ['Muslim Mosque', 'Sufi Lodge', 'Ancestral Burial Ground'],
                    palace: ['Khan\'s Palace', 'Sultan\'s Court'],
                    trading_post: ['Russian Trading Post', 'Chinese Trade Station', 'Cattle Market']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Russian Empire',
                dominantPowerDescription: 'The Great Game unfolds as Russia conquers the steppes, settling Slavic farmers and exploiting resources.',
                eraContextSentence: 'the closing of the frontier, where Cossack forts and settler towns transform ancient pastures.',
                allegianceGroups: [
                    { name: 'Russian Colonial Administration', type: 'primary', description: 'Tsarist governors and military.' },
                    { name: 'Kazakh Nobility', type: 'secondary', description: 'Co-opted traditional leaders.' },
                    { name: 'Slavic Settlers', type: 'secondary', description: 'Farming colonists.' },
                    { name: 'Resistance Movements', type: 'rebel', description: 'Kazakh freedom fighters.' }
                ],
                structureNames: {
                    fortress: ['Cossack Fort', 'Russian Garrison', 'Railway Guard Post'],
                    factory: ['Cotton Mill', 'Mining Operation', 'Railway Workshop'],
                    trading_post: ['Railway Station', 'Grain Market', 'Colonial Trading Post'],
                    palace: ['Governor\'s Residence', 'Military Headquarters']
                }
            },
            [HistoricalEra.MODERN_ERA]: {
                dominantPower: 'Republic of Kazakhstan',
                dominantPowerDescription: 'Independent Kazakhstan balances its nomadic heritage with oil wealth and geopolitical importance.',
                eraContextSentence: 'the new Great Game, where oil pipelines cross ancient caravan routes.',
                allegianceGroups: [
                    { name: 'Republic of Kazakhstan', type: 'primary', description: 'Independent nation since 1991.' },
                    { name: 'Russian Federation', type: 'secondary', description: 'Former colonial power, major partner.' },
                    { name: 'China', type: 'secondary', description: 'Growing economic influence.' },
                    { name: 'Western Oil Companies', type: 'trade_company', description: 'Extracting Caspian oil.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Border Guard Station', 'Baikonur Cosmodrome'],
                    factory: ['Oil Refinery', 'Uranium Mine', 'Steel Plant'],
                    trading_post: ['Oil Pipeline Terminal', 'China-Europe Railway Hub', 'Grain Export Terminal'],
                    palace: ['Presidential Palace', 'Akorda', 'Regional Akimat']
                }
            }
        },
        "Taiwan and East China Sea": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Austronesian Peoples',
                dominantPowerDescription: 'Indigenous Austronesian tribes inhabit Taiwan, origin point for Pacific island migrations.',
                eraContextSentence: 'the ancestral homeland, where seafaring peoples perfect navigation before spreading across the Pacific.',
                allegianceGroups: [
                    { name: 'Plains Tribes', type: 'primary', description: 'Lowland agricultural peoples.' },
                    { name: 'Mountain Tribes', type: 'secondary', description: 'Highland hunter-gatherers.' },
                    { name: 'Coastal Peoples', type: 'secondary', description: 'Maritime fishing communities.' }
                ],
                structureNames: {
                    fortress: ['Tribal Stockade', 'Mountain Refuge', 'Coastal Defense'],
                    holy_site: ['Ancestor House', 'Sacred Grove', 'Spirit Stone'],
                    palace: ['Chief\'s Longhouse', 'Tribal Council Hall'],
                    trading_post: ['Beach Market', 'Mountain Pass Trading Post']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Song Dynasty Maritime Networks',
                dominantPowerDescription: 'Chinese maritime trade flourishes, with Taiwan serving as a waystation for merchants and pirates.',
                eraContextSentence: 'the age of maritime commerce, where Chinese junks and Japanese wako contest the Eastern seas.',
                allegianceGroups: [
                    { name: 'Chinese Merchants', type: 'trade_company', description: 'Song and Yuan traders.' },
                    { name: 'Indigenous Kingdoms', type: 'primary', description: 'Native Taiwanese polities.' },
                    { name: 'Japanese Pirates (Wako)', type: 'rebel', description: 'Raiders from Japan.' },
                    { name: 'Ryukyu Kingdom', type: 'secondary', description: 'Okinawan maritime traders.' }
                ],
                structureNames: {
                    fortress: ['Coastal Fort', 'Pirate Haven', 'Trading Post Defense'],
                    holy_site: ['Buddhist Temple', 'Indigenous Sacred Site', 'Mazu Sea Goddess Shrine'],
                    palace: ['Tribal King\'s Hall', 'Chinese Prefect\'s Compound'],
                    trading_post: ['Maritime Trading Port', 'Smuggler\'s Cove', 'Fish Market']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Dutch Formosa / Zheng Maritime Network',
                dominantPowerDescription: 'Dutch colonizers compete with Chinese Ming loyalists for control of Taiwan\'s profitable trade.',
                eraContextSentence: 'the contested island, where European colonialism meets Chinese resistance and indigenous resilience.',
                allegianceGroups: [
                    { name: 'Dutch East India Company', type: 'trade_company', description: 'Colonial trading monopoly.' },
                    { name: 'Kingdom of Tungning (Zheng)', type: 'primary', description: 'Ming loyalist maritime kingdom.' },
                    { name: 'Qing Dynasty', type: 'secondary', description: 'Mainland Chinese empire.' },
                    { name: 'Indigenous Tribes', type: 'rebel', description: 'Native resistance.' }
                ],
                structureNames: {
                    fortress: ['Fort Zeelandia', 'Chinese Naval Base', 'Indigenous Stronghold'],
                    mill: ['Sugar Mill', 'Rice Processing', 'Camphor Refinery'],
                    holy_site: ['Confucian Temple', 'Dutch Reformed Church', 'Indigenous Spirit House'],
                    palace: ['Dutch Governor\'s House', 'Zheng Family Palace'],
                    trading_post: ['VOC Trading Post', 'Chinese Merchant Quarter', 'Deer Hide Market']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Japanese Taiwan',
                dominantPowerDescription: 'Japan modernizes Taiwan as a model colony, building infrastructure while suppressing Chinese culture.',
                eraContextSentence: 'the model colony, where Japanese efficiency transforms the beautiful island into an industrial powerhouse.',
                allegianceGroups: [
                    { name: 'Japanese Colonial Government', type: 'primary', description: 'Imperial administration.' },
                    { name: 'Taiwanese Gentry', type: 'secondary', description: 'Collaborating local elite.' },
                    { name: 'Han Resistance', type: 'rebel', description: 'Chinese cultural preservation.' },
                    { name: 'Indigenous Peoples', type: 'rebel', description: 'Mountain tribe resistance.' }
                ],
                structureNames: {
                    fortress: ['Japanese Garrison', 'Police Station', 'Coastal Defense'],
                    factory: ['Sugar Refinery', 'Camphor Factory', 'Railroad Workshop'],
                    trading_post: ['Colonial Export Dock', 'Railway Station', 'Japanese Bank'],
                    palace: ['Governor-General\'s Office', 'Shinto Shrine Complex']
                }
            },
            [HistoricalEra.MODERN_ERA]: {
                dominantPower: 'Republic of China (Taiwan)',
                dominantPowerDescription: 'Democratic Taiwan becomes an economic powerhouse while navigating complex cross-strait relations.',
                eraContextSentence: 'the island democracy, where silicon chips and freedom flourish in China\'s shadow.',
                allegianceGroups: [
                    { name: 'Republic of China', type: 'primary', description: 'Democratic government in Taipei.' },
                    { name: 'People\'s Republic of China', type: 'secondary', description: 'Claims sovereignty from Beijing.' },
                    { name: 'United States', type: 'secondary', description: 'Security guarantor.' },
                    { name: 'Tech Corporations', type: 'trade_company', description: 'TSMC and electronics giants.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Missile Defense Site', 'Naval Base'],
                    factory: ['Semiconductor Fab', 'Electronics Factory', 'Precision Manufacturing'],
                    trading_post: ['Container Port', 'International Airport', 'Tech Hub'],
                    palace: ['Presidential Office', 'Legislative Yuan', 'Taipei 101']
                }
            }
        },
        "Indochina Interior": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Funan Kingdom',
                dominantPowerDescription: 'Early Indianized kingdom controls Mekong Delta trade routes, blending Hindu-Buddhist culture with local traditions.',
                eraContextSentence: 'the dawn of Indianization, where Sanskrit prayers echo through monsoon forests.',
                allegianceGroups: [
                    { name: 'Funan Kingdom', type: 'primary', description: 'Early Khmer-speaking empire.' },
                    { name: 'Chenla', type: 'secondary', description: 'Inland Khmer polity.' },
                    { name: 'Champa', type: 'secondary', description: 'Coastal Austronesian kingdom.' },
                    { name: 'Mon City-States', type: 'secondary', description: 'Buddhist trading centers.' }
                ],
                structureNames: {
                    fortress: ['Moated City', 'Hill Fort', 'River Stronghold'],
                    holy_site: ['Hindu Temple', 'Buddhist Stupa', 'Ancestor Shrine'],
                    palace: ['God-King\'s Palace', 'Mandala Center'],
                    trading_post: ['River Port', 'Forest Product Market', 'Indian Ocean Entrepot']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Khmer Empire',
                dominantPowerDescription: 'Angkor commands a vast hydraulic civilization, building the world\'s largest religious monuments.',
                eraContextSentence: 'the age of god-kings, where Angkor Wat rises from the jungle as mountains made by human hands.',
                allegianceGroups: [
                    { name: 'Khmer Empire', type: 'primary', description: 'The Angkorian state at its height.' },
                    { name: 'Dai Viet', type: 'secondary', description: 'Vietnamese kingdom to the east.' },
                    { name: 'Pagan Kingdom', type: 'secondary', description: 'Burmese empire to the west.' },
                    { name: 'Srivijaya', type: 'trade_company', description: 'Maritime trading empire.' }
                ],
                structureNames: {
                    fortress: ['Temple-Mountain', 'Moated Citadel', 'Border Garrison'],
                    mill: ['Rice Paddy Complex', 'Irrigation Works', 'Fish Pond System'],
                    holy_site: ['Angkor Wat', 'Bayon Temple', 'Buddhist Monastery'],
                    palace: ['Royal Palace', 'Provincial Governor\'s Court'],
                    trading_post: ['Great Market', 'Chinese Quarter', 'River Trade Port']
                },
                courtRoles: {
                    palace: ['Devaraja (God-King)', 'Purohita (High Priest)', 'Senapati (General)', 'Mantri (Minister)']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Ayutthaya and Rival Kingdoms',
                dominantPowerDescription: 'Siamese, Burmese, and Vietnamese kingdoms compete for dominance while European traders arrive.',
                eraContextSentence: 'the age of gunpowder empires, where Buddhist kings adopt European weapons to fight ancient enemies.',
                allegianceGroups: [
                    { name: 'Ayutthaya Kingdom', type: 'primary', description: 'Siamese trading empire.' },
                    { name: 'Toungoo Burma', type: 'secondary', description: 'Expansionist Burmese empire.' },
                    { name: 'Dai Viet', type: 'secondary', description: 'Northern Vietnamese state.' },
                    { name: 'European Traders', type: 'trade_company', description: 'Portuguese, Dutch, and French merchants.' }
                ],
                structureNames: {
                    fortress: ['Star Fort', 'River Fortress', 'Mountain Stronghold'],
                    mill: ['Rice Mill', 'Teak Sawmill', 'Spice Processing'],
                    holy_site: ['Golden Pagoda', 'Theravada Monastery', 'Spirit House'],
                    palace: ['Royal Palace', 'Mandarin\'s Compound', 'European Factor\'s House'],
                    trading_post: ['International Quarter', 'River Port', 'Caravan Terminal']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'French Indochina',
                dominantPowerDescription: 'France colonizes Vietnam, Laos, and Cambodia, exploiting resources while "civilizing" the natives.',
                eraContextSentence: 'the colonial extraction, where rubber plantations and opium profits fuel the French empire.',
                allegianceGroups: [
                    { name: 'French Colonial Administration', type: 'primary', description: 'Governor-General in Saigon.' },
                    { name: 'Siam (Thailand)', type: 'secondary', description: 'Independent buffer state.' },
                    { name: 'Vietnamese Resistance', type: 'rebel', description: 'Anti-colonial movements.' },
                    { name: 'Traditional Monarchies', type: 'secondary', description: 'Puppet kings in Cambodia and Laos.' }
                ],
                structureNames: {
                    fortress: ['French Fort', 'Colonial Garrison', 'Border Post'],
                    factory: ['Rubber Plantation', 'Rice Export Mill', 'Opium Refinery'],
                    trading_post: ['Colonial Bank', 'Export Dock', 'Railway Station'],
                    palace: ['Governor\'s Palace', 'Puppet King\'s Palace', 'French Club']
                }
            },
            [HistoricalEra.MODERN_ERA]: {
                dominantPower: 'ASEAN Nations',
                dominantPowerDescription: 'Southeast Asian nations pursue development and regional cooperation after decades of war and revolution.',
                eraContextSentence: 'the Asian miracle, where war-torn nations become manufacturing hubs and tourist destinations.',
                allegianceGroups: [
                    { name: 'Socialist Vietnam', type: 'primary', description: 'Communist party embracing markets.' },
                    { name: 'Kingdom of Thailand', type: 'secondary', description: 'Regional economic hub.' },
                    { name: 'ASEAN', type: 'secondary', description: 'Regional cooperation bloc.' },
                    { name: 'China', type: 'secondary', description: 'Growing regional hegemon.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Border Checkpoint', 'Naval Base'],
                    factory: ['Electronics Assembly', 'Textile Factory', 'Auto Plant'],
                    trading_post: ['Special Economic Zone', 'Tourist Resort', 'Container Port'],
                    palace: ['Presidential Palace', 'Party Headquarters', 'Royal Palace']
                }
            }
        }
    }
};
