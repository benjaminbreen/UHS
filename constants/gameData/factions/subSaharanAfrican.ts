/**
 * constants/gameData/factions/subSaharanAfrican.ts
 * Faction data for Sub-Saharan African cultural zones.
 */
import { HistoricalEra } from '../../../types';
import { FactionFile } from './types';

const MODERN_ERA = 'MODERN_ERA';
const FUTURE_ERA = 'FUTURE_ERA';

export const SUB_SAHARAN_AFRICAN_FACTIONS: FactionFile = {
    'SUB_SAHARAN_AFRICAN': {
        "Sahel": {
            [HistoricalEra.PREHISTORY]: {
                dominantPower: 'Nok Culture',
                dominantPowerDescription: 'Iron Age peoples creating sophisticated terracotta sculptures and early iron smelting technology, laying foundations for West African civilizations.',
                eraContextSentence: 'the dawn of iron in Africa, where terracotta heads watch over villages and iron tools transform agriculture.',
                allegianceGroups: [
                    { name: 'Nok Settlements', type: 'primary', description: 'Iron-working communities.' },
                    { name: 'Pastoral Nomads', type: 'secondary', description: 'Cattle herders of the grasslands.' },
                    { name: 'Forest Peoples', type: 'secondary', description: 'Hunter-gatherers of the southern forests.' }
                ],
                structureNames: {
                    fortress: ['Earth Wall', 'Hill Settlement', 'River Fort'],
                    quarry: ['Iron Smelter', 'Clay Pit', 'Quarry'],
                    holy_site: ['Sacred Grove', 'Ancestor Shrine', 'Spirit Rock', 'Terracotta Workshop'],
                    palace: ["Chief's Compound", 'Council House', 'Iron Master Lodge'],
                },
                courtRoles: {
                    palace: ['Village Chief', 'Iron Master', 'Spirit Keeper', 'Elder', 'Warrior Leader']
                }
            },
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Trans-Saharan Trading Peoples',
                dominantPowerDescription: 'Various Berber and proto-Fulani peoples control the trade routes across the Sahel, facilitating commerce between North and West Africa.',
                eraContextSentence: 'an age of desert trade, where caravans cross the Sahel carrying salt, gold, and knowledge.',
                allegianceGroups: [
                    { name: 'Trans-Saharan Traders', type: 'primary', description: 'The dominant trading groups.' },
                    { name: 'Garamantian Kingdom', type: 'secondary', description: 'A powerful Berber kingdom to the north.' },
                    { name: 'Local Chiefdoms', type: 'secondary', description: 'Smaller settled communities.' },
                    { name: 'Nomadic Peoples', type: 'secondary', description: 'Mobile groups of the desert fringe.' }
                ],
                structureNames: {
                    trading_post: ['Trading Post', 'Salt Caravan Depot'],
                    fortress: ['Oasis Fort'],
                    holy_site: ['Sacred Rock'],
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Empire of Mali',
                dominantPowerDescription: 'The Mali Empire dominates the western Sahel, controlling gold mines and trade routes while spreading Islam and creating a powerful centralized state.',
                eraContextSentence: 'the age of Mansa Musa, where the Mali Empire becomes one of the wealthiest states in the world.',
                allegianceGroups: [
                    { name: 'Empire of Mali', type: 'primary', description: 'The dominant gold-trading empire.' },
                    { name: 'Songhai Empire', type: 'secondary', description: 'A rising power on the Niger Bend.' },
                    { name: 'Kanem-Bornu Empire', type: 'secondary', description: 'A powerful empire to the east.' },
                    { name: 'Mossi Kingdoms', type: 'rebel', description: 'Independent kingdoms resisting imperial control.' }
                ],
                structureNames: {
                    fortress: ['Sudanese Fort', 'Walled City'],
                    mill: ['Gold Mine', 'Salt Mine'],
                    holy_site: ['Great Mosque of Djenné', 'University of Sankore'],
                    palace: ["Mansa's Palace"],
                    trading_post: ['Caravanserai', 'Gold Market']
                },
                courtRoles: {
                    palace: ['Mansa', 'Farba', 'Qadi', 'Court Griot']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Songhai Empire',
                dominantPowerDescription: 'The Songhai Empire becomes the largest empire in African history, controlling vast territories along the Niger River and trans-Saharan trade.',
                eraContextSentence: 'the age of Songhai expansion, where Timbuktu becomes a center of Islamic learning and trade.',
                allegianceGroups: [
                    { name: 'Songhai Empire', type: 'primary', description: 'The dominant imperial power.' },
                    { name: 'Moroccan Sultanate', type: 'secondary', description: 'A northern power that will eventually invade.' },
                    { name: 'Kanem-Bornu', type: 'secondary', description: 'A rival empire to the east.' },
                    { name: 'Fulani Jihads', type: 'rebel', description: 'Islamic reformist movements.' }
                ],
                structureNames: {
                    fortress: ['Imperial Garrison', 'Clay Fortress'],
                    mill: ['Trading Center', 'Salt Flat'],
                    holy_site: ['Mosque', 'Islamic University'],
                    palace: ["Askia's Palace"],
                    trading_post: ['Trans-Saharan Terminal', 'Book Market']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'French Colonial Empire',
                dominantPowerDescription: 'French colonial expansion brings European rule to much of the Sahel, transforming traditional states into colonial territories.',
                eraContextSentence: 'an era of colonial conquest, where French arms impose European rule on the ancient Sahel kingdoms.',
                allegianceGroups: [
                    { name: 'French Colonial Empire', type: 'primary', description: 'The dominant European power.' },
                    { name: 'Sokoto Caliphate', type: 'secondary', description: 'A powerful Fulani empire resisting colonization.' },
                    { name: 'Tijaniyya Movement', type: 'rebel', description: 'An Islamic Sufi order often resisting French rule.' },
                    { name: 'British Empire', type: 'secondary', description: 'A rival colonial power.' }
                ],
                structureNames: {
                    fortress: ['Colonial Post', 'Foreign Legion Fort'],
                    mill: ['Administrative Station', 'Groundnut Mill'],
                    mining_colony: ['Export Center', 'Gum Arabic Plantation'],
                    trading_post: ['River Port', 'Railway Terminus']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Sahelian Nations',
                dominantPowerDescription: 'Newly independent nations like Mali, Niger, and Chad face immense challenges of desertification, political instability, and poverty while preserving rich cultural traditions.',
                eraContextSentence: 'an era of independence and hardship, where nations on the desert edge forge their own destinies.',
                allegianceGroups: [
                    { name: 'National Governments', type: 'primary', description: 'The central governments of post-colonial states.' },
                    { name: 'Tuareg Rebels', type: 'rebel', description: 'Nomadic peoples fighting for autonomy or independence.' },
                    { name: 'Al-Qaeda in the Islamic Maghreb', type: 'rebel', description: 'A transnational jihadist group.' },
                    { name: 'France', type: 'secondary', description: 'The former colonial power, maintaining military and economic influence.' },
                ],
                structureNames: {
                    fortress: ['Military Base', 'Gendarmerie Post'],
                    factory: ['Cotton Gin', 'Textile Factory'],
                    mining_colony: ['Uranium Mine', 'Gold Mine'],
                    trading_post: ['International Airport', 'Cross-Border Market', 'NGO Compound'],
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'Sahel Alliance',
                dominantPowerDescription: 'Regional cooperation emerges to combat desertification and security threats while harnessing solar energy potential.',
                eraContextSentence: 'an age of regional solidarity, where desert nations unite against climate change and instability.',
                allegianceGroups: [
                    { name: 'Sahel Alliance', type: 'primary', description: 'Regional cooperation organization.' },
                    { name: 'African Union', type: 'secondary', description: 'Continental governance body.' },
                    { name: 'China', type: 'secondary', description: 'Major infrastructure investor.' },
                    { name: 'Climate Militias', type: 'rebel', description: 'Groups fighting over scarce water resources.' }
                ],
                structureNames: {
                    fortress: ['Regional Security Hub', 'Drone Base'],
                    factory: ['Solar Farm', 'Desalination Plant'],
                    trading_post: ['Digital Payment Hub', 'Climate Refugee Center']
                }
            }
        },
        "West African Coast": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Nok Culture',
                dominantPowerDescription: 'The Nok people develop sophisticated ironworking and create distinctive terracotta sculptures, influencing the entire region.',
                eraContextSentence: 'an age of iron and artistry, where the Nok culture flourishes in the forests and savannas.',
                allegianceGroups: [
                    { name: 'Nok Culture', type: 'primary', description: 'The dominant iron-working civilization.' },
                    { name: 'Coastal Traders', type: 'trade_company', description: 'Early maritime merchants.' },
                    { name: 'Forest Peoples', type: 'secondary', description: 'Various groups in the rainforest.' }
                ],
                structureNames: {
                    fortress: ['Hillfort', 'Earthen Rampart'],
                    mill: ['Iron Smelter', 'Potter\'s Workshop'],
                    holy_site: ['Sacred Grove', 'Ancestor Shrine']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Yoruba City-States',
                dominantPowerDescription: 'Powerful Yoruba city-states like Ife and Oyo dominate the region, creating sophisticated bronze art and complex political systems.',
                eraContextSentence: 'an age of bronze and kingship, where Yoruba city-states create Africa\'s finest sculptures.',
                allegianceGroups: [
                    { name: 'Ife Kingdom', type: 'primary', description: 'The spiritual center of Yorubaland.' },
                    { name: 'Oyo Empire', type: 'secondary', description: 'A rising military power.' },
                    { name: 'Benin Kingdom', type: 'secondary', description: 'A powerful neighbor to the east.' },
                    { name: 'Hausa Traders', type: 'trade_company', description: 'Merchants from the north.' }
                ],
                structureNames: {
                    fortress: ['City Walls', 'Royal Compound'],
                    holy_site: ['Orisha Temple', 'Sacred Forest'],
                    palace: ["Oba's Palace", 'Royal Court'],
                    trading_post: ['Market Square', 'Craft Quarter']
                },
                courtRoles: {
                    palace: ['Oba', 'Ogboni Elder', 'Royal Diviner', 'War Chief']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Ashanti Empire',
                dominantPowerDescription: 'The Ashanti Empire rises to dominate the Gold Coast, controlling gold mines and engaging in the Atlantic trade system.',
                eraContextSentence: 'an age of gold and guns, where African kingdoms engage with European traders on the coast.',
                allegianceGroups: [
                    { name: 'Ashanti Empire', type: 'primary', description: 'The dominant Gold Coast power.' },
                    { name: 'Dahomey Kingdom', type: 'secondary', description: 'A militaristic rival kingdom.' },
                    { name: 'Portuguese Traders', type: 'trade_company', description: 'Early European coastal traders.' },
                    { name: 'Dutch West India Company', type: 'trade_company', description: 'Major European trading presence.' }
                ],
                structureNames: {
                    fortress: ['Fort', 'Coastal Castle'],
                    mill: ['Gold Mine', 'Palm Oil Press'],
                    palace: ['Golden Stool Palace', 'Asantehene\'s Court'],
                    trading_post: ['European Factory', 'Slave Port']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'British Colonial Empire',
                dominantPowerDescription: 'British colonial rule transforms West Africa, creating Nigeria and the Gold Coast while exploiting resources and disrupting traditional structures.',
                eraContextSentence: 'an era of colonial exploitation, where European powers carve up ancient kingdoms.',
                allegianceGroups: [
                    { name: 'British Empire', type: 'primary', description: 'The dominant colonial power.' },
                    { name: 'French West Africa', type: 'secondary', description: 'Neighboring French colonies.' },
                    { name: 'Lagos Merchants', type: 'trade_company', description: 'African commercial elite.' },
                    { name: 'Traditional Rulers', type: 'secondary', description: 'Subordinated indigenous authorities.' }
                ],
                structureNames: {
                    fortress: ['Colonial Fort', 'District Office'],
                    factory: ['Palm Oil Factory', 'Cocoa Processing Plant'],
                    trading_post: ['Railway Station', 'Colonial Port'],
                    mining_colony: ['Tin Mine', 'Rubber Plantation']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Nigeria',
                dominantPowerDescription: 'Africa\'s most populous nation emerges as a regional power, blessed with oil wealth but challenged by corruption and ethnic tensions.',
                eraContextSentence: 'an era of oil and ambition, where West African nations seek prosperity amid challenges.',
                allegianceGroups: [
                    { name: 'Federal Republic of Nigeria', type: 'primary', description: 'The regional giant.' },
                    { name: 'ECOWAS', type: 'secondary', description: 'Regional economic community.' },
                    { name: 'Boko Haram', type: 'rebel', description: 'Islamist insurgency in the northeast.' },
                    { name: 'Niger Delta Militants', type: 'rebel', description: 'Groups fighting for oil revenue control.' }
                ],
                structureNames: {
                    fortress: ['Military Barracks', 'Naval Base'],
                    factory: ['Oil Refinery', 'Cement Plant', 'Nollywood Studio'],
                    trading_post: ['International Airport', 'Container Port', 'Tech Hub'],
                    mining_colony: ['Offshore Oil Platform', 'Natural Gas Terminal']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'West African Federation',
                dominantPowerDescription: 'ECOWAS evolves into a true federation as the region leverages its youth population and tech innovation.',
                eraContextSentence: 'an age of African renaissance, where Lagos becomes a global tech capital.',
                allegianceGroups: [
                    { name: 'West African Federation', type: 'primary', description: 'The unified regional state.' },
                    { name: 'African Continental Union', type: 'secondary', description: 'Pan-African government.' },
                    { name: 'Chinese Investors', type: 'trade_company', description: 'Major infrastructure partners.' },
                    { name: 'Climate Refugees', type: 'rebel', description: 'Displaced Sahelian populations.' }
                ],
                structureNames: {
                    fortress: ['Cybersecurity Center', 'Climate Defense Hub'],
                    factory: ['Tech Campus', 'Solar Panel Factory', 'Vertical Farm'],
                    trading_post: ['Digital Currency Exchange', 'Drone Port', 'Hyperloop Terminal']
                }
            }
        },
        "Horn of Africa": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Kingdom of Kush',
                dominantPowerDescription: 'The Nubian kingdom of Kush rivals Egypt in power, controlling the Nile trade and developing its own pyramid-building tradition.',
                eraContextSentence: 'an age of black pharaohs, where Kush challenges Egypt for control of the Nile.',
                allegianceGroups: [
                    { name: 'Kingdom of Kush', type: 'primary', description: 'The Nubian empire.' },
                    { name: 'Ptolemaic Egypt', type: 'secondary', description: 'The Hellenistic rival to the north.' },
                    { name: 'Kingdom of Aksum', type: 'secondary', description: 'Rising power in the Ethiopian highlands.' },
                    { name: 'Red Sea Traders', type: 'trade_company', description: 'Maritime merchants.' }
                ],
                structureNames: {
                    fortress: ['Nubian Fortress', 'Desert Outpost'],
                    holy_site: ['Pyramid Complex', 'Temple of Amun'],
                    palace: ['Royal Palace of Meroë'],
                    trading_post: ['Nile Port', 'Caravan Station']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Ethiopian Empire',
                dominantPowerDescription: 'Christian Ethiopia maintains its independence, claiming descent from Solomon while developing unique rock-hewn churches.',
                eraContextSentence: 'an age of faith carved in stone, where Ethiopian Christianity creates architectural wonders.',
                allegianceGroups: [
                    { name: 'Ethiopian Empire', type: 'primary', description: 'The Christian highland empire.' },
                    { name: 'Sultanate of Adal', type: 'secondary', description: 'Muslim rival on the coast.' },
                    { name: 'Zagwe Dynasty', type: 'secondary', description: 'Rulers who built Lalibela.' },
                    { name: 'Coptic Church', type: 'religious', description: 'The Ethiopian Orthodox hierarchy.' }
                ],
                structureNames: {
                    fortress: ['Mountain Fortress', 'Royal Camp'],
                    holy_site: ['Rock-Hewn Church', 'Monastery', 'Holy Spring'],
                    palace: ['Imperial Palace', 'Provincial Castle'],
                    trading_post: ['Highland Market', 'Coffee Trading Post']
                },
                courtRoles: {
                    palace: ['Negus', 'Ras', 'Dejazmach', 'Court Chronicler'],
                    holy_site: ['Abuna', 'Monk-Scholar', 'Deacon']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Swahili City-States',
                dominantPowerDescription: 'Independent Swahili cities like Kilwa and Mombasa dominate Indian Ocean trade, blending African and Islamic cultures.',
                eraContextSentence: 'an age of monsoon merchants, where Swahili cities connect Africa to Asia.',
                allegianceGroups: [
                    { name: 'Kilwa Sultanate', type: 'primary', description: 'The wealthiest Swahili city-state.' },
                    { name: 'Portuguese Empire', type: 'secondary', description: 'European intruders seeking control.' },
                    { name: 'Omani Sultanate', type: 'secondary', description: 'Arab power from across the ocean.' },
                    { name: 'Ethiopian Empire', type: 'secondary', description: 'The highland Christian power.' }
                ],
                structureNames: {
                    fortress: ['Coral Stone Fort', 'Portuguese Fort'],
                    holy_site: ['Great Mosque', 'Sufi Shrine'],
                    palace: ['Sultan\'s Palace', 'Merchant Mansion'],
                    trading_post: ['Dhow Harbor', 'Indian Ocean Warehouse', 'Ivory Market']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'British East Africa',
                dominantPowerDescription: 'British colonialism transforms East Africa with the Uganda Railway, while Ethiopia uniquely maintains independence.',
                eraContextSentence: 'an era of the scramble for Africa, where only Ethiopia escapes European colonization.',
                allegianceGroups: [
                    { name: 'British Empire', type: 'primary', description: 'Colonial ruler of Kenya and Uganda.' },
                    { name: 'Ethiopian Empire', type: 'secondary', description: 'The sole independent African nation.' },
                    { name: 'German East Africa', type: 'secondary', description: 'Colonial Tanganyika.' },
                    { name: 'Maasai Warriors', type: 'rebel', description: 'Pastoralists resisting colonial encroachment.' }
                ],
                structureNames: {
                    fortress: ['Colonial Fort', 'Railway Station Fort'],
                    factory: ['Coffee Processing Plant', 'Sisal Plantation'],
                    trading_post: ['Railway Depot', 'Colonial Administrative Center'],
                    mining_colony: ['Tea Plantation', 'Cattle Ranch']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Kenya',
                dominantPowerDescription: 'Kenya emerges as East Africa\'s economic hub, balancing ethnic diversity with development while Ethiopia remains a regional power.',
                eraContextSentence: 'an era of safari tourism and Silicon Savannah, where East Africa charts its development path.',
                allegianceGroups: [
                    { name: 'Republic of Kenya', type: 'primary', description: 'The regional economic leader.' },
                    { name: 'Ethiopia', type: 'secondary', description: 'The populous highland nation.' },
                    { name: 'East African Community', type: 'secondary', description: 'Regional integration bloc.' },
                    { name: 'Al-Shabaab', type: 'rebel', description: 'Somali-based terrorist group.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Anti-Poaching Unit'],
                    factory: ['Flower Farm', 'Mobile Phone Assembly', 'Coffee Roastery'],
                    trading_post: ['Safari Lodge', 'Nairobi Tech Hub', 'Port of Mombasa'],
                    mining_colony: ['Geothermal Plant', 'Rare Earth Mine']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'East African Federation',
                dominantPowerDescription: 'The long-discussed federation finally emerges, with Nairobi as capital and ambitious infrastructure projects.',
                eraContextSentence: 'an age of integration and innovation, where the cradle of humanity leads in green technology.',
                allegianceGroups: [
                    { name: 'East African Federation', type: 'primary', description: 'The unified regional state.' },
                    { name: 'African Space Agency', type: 'secondary', description: 'Continental space program based in Kenya.' },
                    { name: 'Nile Basin Initiative', type: 'secondary', description: 'Water-sharing agreement participants.' },
                    { name: 'Pastoralist Movement', type: 'rebel', description: 'Traditional herders resisting modernization.' }
                ],
                structureNames: {
                    fortress: ['Drone Command Center', 'Climate Monitoring Station'],
                    factory: ['Geothermal Complex', 'Biotech Research Lab', 'Space Component Factory'],
                    trading_post: ['Hyperloop Station', 'Digital Free Trade Zone', 'Carbon Credit Exchange']
                }
            }
        },
        "Central Africa": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Bantu Expansion',
                dominantPowerDescription: 'Bantu-speaking peoples spread across Central Africa, bringing iron technology and agricultural practices.',
                eraContextSentence: 'an age of migration and iron, as Bantu peoples transform the heart of Africa.',
                allegianceGroups: [
                    { name: 'Bantu Peoples', type: 'primary', description: 'The expanding agricultural societies.' },
                    { name: 'Pygmy Groups', type: 'secondary', description: 'Indigenous forest dwellers.' },
                    { name: 'Nilotic Peoples', type: 'secondary', description: 'Northern pastoralist groups.' }
                ],
                structureNames: {
                    fortress: ['Stockaded Village', 'Hill Settlement'],
                    mill: ['Iron Forge', 'Grinding Stone'],
                    holy_site: ['Ancestor Grove', 'Rain Shrine']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Kingdom of Kongo',
                dominantPowerDescription: 'The Kingdom of Kongo emerges as a powerful centralized state, controlling trade routes and maintaining sophisticated political institutions.',
                eraContextSentence: 'an age of divine kingship, where the Kongo kingdom dominates Central Africa.',
                allegianceGroups: [
                    { name: 'Kingdom of Kongo', type: 'primary', description: 'The dominant regional power.' },
                    { name: 'Luba Kingdom', type: 'secondary', description: 'A rival state to the east.' },
                    { name: 'Lunda Empire', type: 'secondary', description: 'An expanding power.' },
                    { name: 'Forest Chiefdoms', type: 'secondary', description: 'Smaller polities in the rainforest.' }
                ],
                structureNames: {
                    fortress: ['Royal Enclosure', 'Border Fort'],
                    holy_site: ['Royal Burial Ground', 'Spirit House'],
                    palace: ['Manikongo\'s Court', 'Provincial Palace'],
                    trading_post: ['Ivory Market', 'Copper Exchange']
                },
                courtRoles: {
                    palace: ['Manikongo', 'Mwene', 'Royal Judge', 'Keeper of Customs']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Kingdom of Kongo (Portuguese Contact)',
                dominantPowerDescription: 'Kongo engages with Portuguese traders and missionaries, adopting Christianity while struggling to control the growing slave trade.',
                eraContextSentence: 'an age of crosses and captives, where European contact transforms Central African societies.',
                allegianceGroups: [
                    { name: 'Kingdom of Kongo', type: 'primary', description: 'The Christianized African kingdom.' },
                    { name: 'Portuguese Traders', type: 'trade_company', description: 'European slave traders and missionaries.' },
                    { name: 'Imbangala Warriors', type: 'mercenary', description: 'Military bands disrupting the region.' },
                    { name: 'Luba-Lunda States', type: 'secondary', description: 'Interior kingdoms avoiding European contact.' }
                ],
                structureNames: {
                    fortress: ['Portuguese Fort', 'Kongo Stronghold'],
                    holy_site: ['Catholic Church', 'Traditional Shrine'],
                    palace: ['Christianized Royal Court'],
                    trading_post: ['Slave Port', 'Ivory Warehouse']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Congo Free State',
                dominantPowerDescription: 'King Leopold II\'s personal colony becomes synonymous with colonial brutality, exploiting rubber through forced labor.',
                eraContextSentence: 'an era of rubber and horror, where colonial greed creates unprecedented suffering.',
                allegianceGroups: [
                    { name: 'Congo Free State', type: 'primary', description: 'Leopold\'s brutal personal colony.' },
                    { name: 'Force Publique', type: 'mercenary', description: 'The colonial military force.' },
                    { name: 'Catholic Missions', type: 'religious', description: 'European missionary presence.' },
                    { name: 'Resistance Movements', type: 'rebel', description: 'Various groups fighting colonial rule.' }
                ],
                structureNames: {
                    fortress: ['Colonial Post', 'Rubber Collection Station'],
                    factory: ['Rubber Processing Plant', 'Ivory Warehouse'],
                    mining_colony: ['Copper Mine', 'Diamond Mine'],
                    trading_post: ['River Station', 'Railway Depot']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Democratic Republic of Congo',
                dominantPowerDescription: 'The DRC struggles with the resource curse, as vast mineral wealth fuels conflict rather than development.',
                eraContextSentence: 'an era of minerals and militias, where Congo\'s riches become its curse.',
                allegianceGroups: [
                    { name: 'DRC Government', type: 'primary', description: 'The weak central government in Kinshasa.' },
                    { name: 'UN Peacekeepers', type: 'secondary', description: 'International stabilization force.' },
                    { name: 'M23 Rebels', type: 'rebel', description: 'One of many armed groups in the east.' },
                    { name: 'Chinese Mining Companies', type: 'trade_company', description: 'Major mineral extractors.' }
                ],
                structureNames: {
                    fortress: ['Army Base', 'UN Compound'],
                    factory: ['Copper Smelter', 'Coltan Processing'],
                    mining_colony: ['Cobalt Mine', 'Diamond Field', 'Coltan Mine'],
                    trading_post: ['Border Crossing', 'Mineral Trading Post', 'NGO Base']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'Congo Basin Federation',
                dominantPowerDescription: 'Central African nations unite to protect the rainforest while developing sustainable extraction of critical minerals for the green economy.',
                eraContextSentence: 'an age of green gold, where the rainforest and rare minerals shape global climate solutions.',
                allegianceGroups: [
                    { name: 'Congo Basin Federation', type: 'primary', description: 'Environmental protection alliance.' },
                    { name: 'Global Climate Fund', type: 'secondary', description: 'International forest preservation backers.' },
                    { name: 'Eco-Warriors', type: 'rebel', description: 'Radical forest defenders.' },
                    { name: 'Mineral Cartels', type: 'trade_company', description: 'Companies controlling battery minerals.' }
                ],
                structureNames: {
                    fortress: ['Eco-Ranger Station', 'Anti-Poaching Drone Base'],
                    factory: ['Sustainable Mining Complex', 'Carbon Capture Forest', 'Battery Component Plant'],
                    trading_post: ['Green Mineral Exchange', 'Eco-Tourism Hub', 'Research Station']
                }
            }
        },
        "Southern Africa": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'San Hunter-Gatherers',
                dominantPowerDescription: 'San peoples maintain ancient hunting and gathering traditions, creating sophisticated rock art across the region.',
                eraContextSentence: 'an age of ancient wisdom, where the first people follow the rains and paint their dreams on stone.',
                allegianceGroups: [
                    { name: 'San Peoples', type: 'primary', description: 'The indigenous hunter-gatherers.' },
                    { name: 'Khoekhoe Herders', type: 'secondary', description: 'Pastoralist groups with cattle.' },
                    { name: 'Early Bantu Settlers', type: 'secondary', description: 'Iron Age farmers arriving from the north.' }
                ],
                structureNames: {
                    fortress: ['Rock Shelter', 'Hilltop Camp'],
                    holy_site: ['Rock Art Site', 'Trance Dance Ground'],
                    trading_post: ['Seasonal Camp', 'Trade Meeting Point']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Great Zimbabwe',
                dominantPowerDescription: 'The stone city of Great Zimbabwe controls gold trade routes between the interior and the Swahili coast.',
                eraContextSentence: 'an age of stone and gold, where Great Zimbabwe rises as Africa\'s most impressive stone architecture.',
                allegianceGroups: [
                    { name: 'Kingdom of Zimbabwe', type: 'primary', description: 'The builders of the stone city.' },
                    { name: 'Mutapa Empire', type: 'secondary', description: 'A successor state to the north.' },
                    { name: 'Swahili Traders', type: 'trade_company', description: 'Coastal merchants seeking gold.' },
                    { name: 'Nguni Peoples', type: 'secondary', description: 'Various groups in the coastal lowlands.' }
                ],
                structureNames: {
                    fortress: ['Stone Enclosure', 'Hill Complex'],
                    holy_site: ['Sacred Pool', 'Ancestral Cave'],
                    palace: ['Great Enclosure', 'Royal Hill Complex'],
                    trading_post: ['Gold Trading Post', 'Ivory Market'],
                    mill: ['Gold Mine', 'Grain Storage']
                },
                courtRoles: {
                    palace: ['Mambo', 'Royal Diviner', 'Keeper of the Sacred Fire', 'Trade Minister']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Mutapa Empire',
                dominantPowerDescription: 'The Mutapa Empire engages with Portuguese traders while trying to maintain control over gold production.',
                eraContextSentence: 'an age of gold and guns, where African kingdoms navigate European ambitions.',
                allegianceGroups: [
                    { name: 'Mutapa Empire', type: 'primary', description: 'The dominant Shona state.' },
                    { name: 'Portuguese Traders', type: 'trade_company', description: 'European gold seekers.' },
                    { name: 'Rozvi Empire', type: 'secondary', description: 'A rival Shona power.' },
                    { name: 'Tsonga Traders', type: 'trade_company', description: 'Intermediaries with the coast.' }
                ],
                structureNames: {
                    fortress: ['Zimbabwe Fort', 'Portuguese Trading Fort'],
                    palace: ['Mutapa\'s Court', 'Provincial Dare'],
                    trading_post: ['Gold Fair', 'Portuguese Feitoria'],
                    mill: ['Gold Washing Site', 'Copper Mine']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'British South Africa',
                dominantPowerDescription: 'The discovery of diamonds and gold transforms the region as British colonialism establishes racial hierarchies.',
                eraContextSentence: 'an era of diamonds and dispossession, where mineral wealth drives colonial conquest.',
                allegianceGroups: [
                    { name: 'British Empire', type: 'primary', description: 'The colonial power.' },
                    { name: 'Boer Republics', type: 'secondary', description: 'Afrikaner states resisting British rule.' },
                    { name: 'Zulu Kingdom', type: 'rebel', description: 'The last independent African power.' },
                    { name: 'Mining Magnates', type: 'trade_company', description: 'Rhodes and other empire builders.' }
                ],
                structureNames: {
                    fortress: ['British Fort', 'Boer Laager'],
                    factory: ['Gold Mine Compound', 'Diamond Processing'],
                    mining_colony: ['Kimberley Mine', 'Witwatersrand Gold Mine'],
                    trading_post: ['Railway Station', 'Mining Town']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Republic of South Africa',
                dominantPowerDescription: 'South Africa transforms from apartheid state to rainbow nation, becoming Africa\'s most industrialized economy.',
                eraContextSentence: 'an era of transformation, where the rainbow nation emerges from apartheid\'s shadow.',
                allegianceGroups: [
                    { name: 'Republic of South Africa', type: 'primary', description: 'The post-apartheid democracy.' },
                    { name: 'SADC', type: 'secondary', description: 'Southern African Development Community.' },
                    { name: 'ANC', type: 'secondary', description: 'The ruling liberation movement party.' },
                    { name: 'EFF', type: 'rebel', description: 'Radical economic transformation movement.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Private Security Complex'],
                    factory: ['Auto Assembly Plant', 'Platinum Refinery', 'Wine Estate'],
                    mining_colony: ['Deep Gold Mine', 'Platinum Mine', 'Diamond Mine'],
                    trading_post: ['Container Port', 'OR Tambo Airport', 'Tech Hub']
                }
            },
            "1980s": {
                dominantPower: 'Apartheid South Africa',
                dominantPowerDescription: 'The apartheid regime faces international isolation and internal resistance while dominating regional politics.',
                eraContextSentence: 'an era of sanctions and struggle, as apartheid enters its final decade.',
                allegianceGroups: [
                    { name: 'Apartheid Government', type: 'primary', description: 'The white minority regime.' },
                    { name: 'ANC/MK', type: 'rebel', description: 'The banned liberation movement.' },
                    { name: 'Frontline States', type: 'secondary', description: 'Neighboring countries supporting liberation.' },
                    { name: 'Conservative West', type: 'secondary', description: 'Cold War allies of apartheid.' }
                ]
            },
            [FUTURE_ERA]: {
                dominantPower: 'Southern African Union',
                dominantPowerDescription: 'SADC deepens into a true union, leveraging solar power and critical minerals while managing water scarcity.',
                eraContextSentence: 'an age of solar abundance, where Southern Africa powers the continent\'s renaissance.',
                allegianceGroups: [
                    { name: 'Southern African Union', type: 'primary', description: 'The integrated regional bloc.' },
                    { name: 'BRICS+', type: 'secondary', description: 'Alternative global economic alliance.' },
                    { name: 'Water Defense Force', type: 'rebel', description: 'Groups fighting over scarce water.' },
                    { name: 'Renewable Energy Consortium', type: 'trade_company', description: 'Green power developers.' }
                ],
                structureNames: {
                    fortress: ['Water Security Base', 'Climate Refugee Center'],
                    factory: ['Solar Gigafactory', 'Hydrogen Plant', 'Desalination Complex'],
                    mining_colony: ['Lithium Mine', 'Rare Earth Extraction'],
                    trading_post: ['BRICS Trade Hub', 'Carbon Credit Exchange', 'Digital Rand Center']
                }
            }
        },
        "West African Forests": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Nok Culture',
                dominantPowerDescription: 'The Nok people develop sophisticated ironworking and create distinctive terracotta sculptures across the Nigerian plateau.',
                eraContextSentence: 'an age of iron and clay, where master sculptors shape both metal and sacred art.',
                allegianceGroups: [
                    { name: 'Nok Culture', type: 'primary', description: 'The iron-working civilization.' },
                    { name: 'Forest Peoples', type: 'secondary', description: 'Various groups in the dense forests.' },
                    { name: 'River Traders', type: 'trade_company', description: 'Early merchants along waterways.' }
                ],
                structureNames: {
                    fortress: ['Hill Settlement', 'Forest Stockade'],
                    mill: ['Iron Furnace', 'Clay Works'],
                    holy_site: ['Sacred Grove', 'Terracotta Shrine']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Yoruba City-States',
                dominantPowerDescription: 'Powerful Yoruba city-states like Ife and later Oyo dominate the region with sophisticated bronze art and complex political systems.',
                eraContextSentence: 'an age of divine kingship, where bronze-casting reaches artistic heights rivaling any civilization.',
                allegianceGroups: [
                    { name: 'Ife Kingdom', type: 'primary', description: 'The spiritual center of Yorubaland.' },
                    { name: 'Oyo Empire', type: 'secondary', description: 'A rising cavalry power.' },
                    { name: 'Benin Kingdom', type: 'secondary', description: 'A powerful eastern neighbor.' },
                    { name: 'Igbo Communities', type: 'secondary', description: 'Decentralized trading communities.' }
                ],
                structureNames: {
                    fortress: ['City Walls', 'Palace Complex'],
                    holy_site: ['Orisha Temple', 'Sacred Forest', 'Ifa Divination House'],
                    palace: ["Oba's Palace", 'Ogboni Lodge'],
                    trading_post: ['Market Square', 'Brass Casters Quarter']
                },
                courtRoles: {
                    palace: ['Oba', 'Ogboni Chief', 'Bashorun', 'Royal Diviner'],
                    holy_site: ['Oni', 'Babalawo', 'Iyalode']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Benin Empire',
                dominantPowerDescription: 'The Benin Empire reaches its height, famous for bronze plaques and controlling trade with arriving Europeans.',
                eraContextSentence: 'an age of bronze and blood, where African art meets European greed.',
                allegianceGroups: [
                    { name: 'Benin Empire', type: 'primary', description: 'The dominant regional power.' },
                    { name: 'Portuguese Traders', type: 'trade_company', description: 'Early European coastal traders.' },
                    { name: 'Oyo Empire', type: 'secondary', description: 'Powerful Yoruba state to the west.' },
                    { name: 'Itsekiri Kingdom', type: 'secondary', description: 'Coastal trading kingdom.' }
                ],
                structureNames: {
                    fortress: ['Benin City Walls', 'Coastal Fort'],
                    palace: ['Oba\'s Palace', 'Chief\'s Compound'],
                    holy_site: ['Royal Ancestral Shrine', 'Bronze Casters Guild'],
                    trading_post: ['Portuguese Factory', 'Slave Barracoon']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'British Nigeria',
                dominantPowerDescription: 'Britain amalgamates diverse peoples into Nigeria, exploiting palm oil and later establishing indirect rule.',
                eraContextSentence: 'an era of palm oil and colonial ports, where ancient kingdoms become British protectorates.',
                allegianceGroups: [
                    { name: 'British Colonial Administration', type: 'primary', description: 'The imperial government.' },
                    { name: 'Royal Niger Company', type: 'trade_company', description: 'Chartered company controlling trade.' },
                    { name: 'Traditional Rulers', type: 'secondary', description: 'Co-opted indigenous authorities.' },
                    { name: 'Aro Confederacy', type: 'rebel', description: 'Resistant trading network.' }
                ],
                structureNames: {
                    fortress: ['Colonial Fort', 'District Headquarters'],
                    factory: ['Palm Oil Mill', 'Groundnut Pyramid'],
                    trading_post: ['River Port', 'Railway Terminus'],
                    mining_colony: ['Coal Mine', 'Tin Mine']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Federal Republic of Nigeria',
                dominantPowerDescription: 'Africa\'s most populous nation struggles with oil wealth, ethnic tensions, and Boko Haram insurgency while maintaining regional influence.',
                eraContextSentence: 'an era of oil booms and busts, where Africa\'s giant seeks its destiny.',
                allegianceGroups: [
                    { name: 'Nigerian Government', type: 'primary', description: 'The federal republic.' },
                    { name: 'Oil Companies', type: 'trade_company', description: 'Shell, Chevron, and national oil company.' },
                    { name: 'Boko Haram', type: 'rebel', description: 'Islamist insurgency in the northeast.' },
                    { name: 'IPOB', type: 'rebel', description: 'Biafran separatist movement.' }
                ],
                structureNames: {
                    fortress: ['Military Cantonment', 'JTF Base'],
                    factory: ['Oil Refinery', 'Dangote Cement Plant', 'Nollywood Studio'],
                    trading_post: ['Alaba International Market', 'Computer Village'],
                    mining_colony: ['Niger Delta Oil Field', 'Jos Tin Mine']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'Federal Republic of Nigeria',
                dominantPowerDescription: 'Nigeria leverages its massive youth population and growing tech sector while managing security challenges and climate impacts on the Niger Delta.',
                eraContextSentence: 'an era of youth and technology, where Lagos emerges as Africa\'s fintech capital.',
                allegianceGroups: [
                    { name: 'Nigerian Government', type: 'primary', description: 'The federal system managing 200+ million people.' },
                    { name: 'Tech Ecosystem', type: 'trade_company', description: 'Flutterwave, Paystack, and other unicorns.' },
                    { name: 'Islamic State West Africa', type: 'rebel', description: 'Evolved form of Boko Haram.' },
                    { name: 'Chinese Infrastructure Partners', type: 'trade_company', description: 'Major construction and loan providers.' }
                ],
                structureNames: {
                    fortress: ['Counter-Terrorism Center', 'Drone Surveillance Base'],
                    factory: ['Eko Atlantic City', 'Solar Assembly Plant', 'EV Assembly Line'],
                    trading_post: ['Lagos Tech Hub', 'Cryptocurrency Exchange', 'Chinese Industrial Zone']
                }
            }
        },
        "Upper Guinea": {
       
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Kingdom of Aksum',
                dominantPowerDescription: 'Aksum emerges as a major trading empire, controlling Red Sea commerce and developing its own script and coinage.',
                eraContextSentence: 'an age of obelisks and trade winds, where Aksum links Africa to Arabia and Rome.',
                allegianceGroups: [
                    { name: 'Kingdom of Aksum', type: 'primary', description: 'The Red Sea trading empire.' },
                    { name: 'Kingdom of Kush', type: 'secondary', description: 'The declining Nubian power.' },
                    { name: 'Himyarite Kingdom', type: 'secondary', description: 'Arabian allies across the Red Sea.' },
                    { name: 'Blemmyes Nomads', type: 'rebel', description: 'Desert raiders.' }
                ],
                structureNames: {
                    fortress: ['Aksumite Palace', 'Red Sea Fort'],
                    holy_site: ['Stelae Field', 'Church of Mary Zion'],
                    palace: ['Royal Complex', 'Governor\'s Residence'],
                    trading_post: ['Adulis Port', 'Incense Market']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Sultanate of Adal',
                dominantPowerDescription: 'Islamic sultanates control the coast while Christian Ethiopia dominates the highlands in centuries of conflict.',
                eraContextSentence: 'an age of faith and conflict, where Islam and Christianity clash in the Horn.',
                allegianceGroups: [
                    { name: 'Sultanate of Adal', type: 'primary', description: 'The dominant Muslim power.' },
                    { name: 'Ethiopian Empire', type: 'secondary', description: 'The Christian highland rival.' },
                    { name: 'Sultanate of Mogadishu', type: 'secondary', description: 'A wealthy Somali trading city.' },
                    { name: 'Oromo Peoples', type: 'rebel', description: 'Expanding pastoralist groups.' }
                ],
                structureNames: {
                    fortress: ['Coastal Fort', 'Mountain Stronghold'],
                    holy_site: ['Grand Mosque', 'Sufi Tomb'],
                    palace: ['Sultan\'s Palace', 'Emir\'s Court'],
                    trading_post: ['Spice Market', 'Slave Port']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Ethiopian Empire (Gondar Period)',
                dominantPowerDescription: 'Ethiopia enters its Gondar period, building castles and maintaining independence while the Somali coast fragments.',
                eraContextSentence: 'an age of castles in Africa, where Gondar rises as Ethiopia\'s Camelot.',
                allegianceGroups: [
                    { name: 'Ethiopian Empire', type: 'primary', description: 'The Christian empire at its architectural peak.' },
                    { name: 'Ottoman Empire', type: 'secondary', description: 'Controlling parts of the Red Sea coast.' },
                    { name: 'Omani Sultanate', type: 'secondary', description: 'Expanding influence on Somali coast.' },
                    { name: 'Oromo Kingdoms', type: 'secondary', description: 'Newly settled former pastoralists.' }
                ],
                structureNames: {
                    fortress: ['Gondar Castle', 'Mountain Fortress'],
                    holy_site: ['Royal Church', 'Monastery'],
                    palace: ['Emperor\'s Castle', 'Regional Lord\'s Compound'],
                    trading_post: ['Highland Market', 'Coffee Trading Post']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Ethiopian Empire (Menelik II)',
                dominantPowerDescription: 'Ethiopia defeats Italy at Adwa, maintaining independence while modernizing under Emperor Menelik II.',
                eraContextSentence: 'an era of African victory, where Ethiopia proves European armies can be defeated.',
                allegianceGroups: [
                    { name: 'Ethiopian Empire', type: 'primary', description: 'The victorious independent empire.' },
                    { name: 'Italian Colonial Forces', type: 'secondary', description: 'Defeated European invaders.' },
                    { name: 'British Somaliland', type: 'secondary', description: 'Colonial territory on the coast.' },
                    { name: 'Mahdist Sudan', type: 'secondary', description: 'Islamic state to the west.' }
                ],
                structureNames: {
                    fortress: ['Modern Fort', 'Arsenal'],
                    factory: ['Rifle Factory', 'Textile Mill'],
                    palace: ['Imperial Palace', 'Modern Ministry'],
                    trading_post: ['Railway Project', 'Arms Market']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Ethiopia',
                dominantPowerDescription: 'Ethiopia remains a regional power hosting the African Union, while Somalia struggles with state collapse.',
                eraContextSentence: 'an era of pride and pain, where the Horn faces famine, war, and dreams of unity.',
                allegianceGroups: [
                    { name: 'Federal Democratic Republic of Ethiopia', type: 'primary', description: 'The regional hegemon.' },
                    { name: 'Somali Federal Government', type: 'secondary', description: 'The internationally recognized but weak state.' },
                    { name: 'Eritrea', type: 'secondary', description: 'The militarized Red Sea state.' },
                    { name: 'Al-Shabaab', type: 'rebel', description: 'Islamist insurgency in Somalia.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'AU Peacekeeping Base'],
                    factory: ['Textile Factory', 'Coffee Processing Plant'],
                    trading_post: ['Bole International Airport', 'Port of Djibouti'],
                    mill: ['Grand Renaissance Dam', 'Wind Farm']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'Horn of Africa Federation',
                dominantPowerDescription: 'Climate crisis forces regional cooperation as the Horn manages refugees and harnesses renewable energy.',
                eraContextSentence: 'an age of necessity, where water scarcity drives either cooperation or catastrophe.',
                allegianceGroups: [
                    { name: 'Horn Federation', type: 'primary', description: 'Climate-driven regional union.' },
                    { name: 'Nile Basin Authority', type: 'secondary', description: 'Water-sharing mechanism.' },
                    { name: 'Climate Refugees', type: 'rebel', description: 'Millions displaced by drought.' },
                    { name: 'Red Sea Alliance', type: 'secondary', description: 'Maritime security partnership.' }
                ],
                structureNames: {
                    fortress: ['Climate Resilience Center', 'Refugee Processing Hub'],
                    factory: ['Solar Farm', 'Geothermal Plant', 'Desalination Facility'],
                    trading_post: ['Digital Port', 'Renewable Energy Export Terminal']
                }
            }
        },
        "Madagascar and Islands": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Austronesian Settlers',
                dominantPowerDescription: 'Seafaring peoples from Southeast Asia settle Madagascar, bringing rice cultivation and outrigger canoes.',
                eraContextSentence: 'an age of ocean voyagers, where Asian sailors discover Africa\'s largest island.',
                allegianceGroups: [
                    { name: 'Austronesian Settlers', type: 'primary', description: 'The founding population from across the Indian Ocean.' },
                    { name: 'African Arrivals', type: 'secondary', description: 'Bantu peoples from the mainland.' },
                    { name: 'Vazimba', type: 'secondary', description: 'Mysterious early inhabitants.' }
                ],
                structureNames: {
                    fortress: ['Hillfort', 'Coastal Settlement'],
                    mill: ['Rice Paddy', 'Fishing Weir'],
                    holy_site: ['Ancestral Tomb', 'Sacred Forest']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Sakalava Kingdoms',
                dominantPowerDescription: 'Powerful kingdoms emerge on the west coast, controlling trade with Africa and the Middle East.',
                eraContextSentence: 'an age of kingdoms rising, where Malagasy culture blends Asian and African traditions.',
                allegianceGroups: [
                    { name: 'Sakalava Kingdoms', type: 'primary', description: 'The dominant western coastal powers.' },
                    { name: 'Antemoro Kingdom', type: 'secondary', description: 'Islamic-influenced southeastern kingdom.' },
                    { name: 'Highland Clans', type: 'secondary', description: 'Various groups in the central plateau.' },
                    { name: 'Arab Traders', type: 'trade_company', description: 'Muslim merchants from the Swahili coast.' }
                ],
                structureNames: {
                    fortress: ['Royal Rova', 'Coastal Fort'],
                    holy_site: ['Royal Tomb', 'Sacred Lake'],
                    palace: ['King\'s Compound', 'Queen\'s Residence'],
                    trading_post: ['Coastal Market', 'Cattle Fair']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Kingdom of Imerina',
                dominantPowerDescription: 'The highland Merina kingdom begins expanding, eventually unifying most of Madagascar.',
                eraContextSentence: 'an age of unification, where the Merina forge a unified Malagasy state.',
                allegianceGroups: [
                    { name: 'Kingdom of Imerina', type: 'primary', description: 'The expanding highland kingdom.' },
                    { name: 'Betsimisaraka Confederation', type: 'secondary', description: 'Eastern coastal alliance.' },
                    { name: 'French Traders', type: 'trade_company', description: 'European merchants seeking influence.' },
                    { name: 'British Missionaries', type: 'religious', description: 'Protestant influence at court.' }
                ],
                structureNames: {
                    fortress: ['Highland Fort', 'Royal Rova'],
                    palace: ['Queen\'s Palace', 'Noble\'s Manor'],
                    holy_site: ['Royal Tomb Complex', 'Protestant Church'],
                    trading_post: ['Slave Port', 'Rice Market']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'French Madagascar',
                dominantPowerDescription: 'France colonizes Madagascar after overthrowing the Merina monarchy, exploiting the island\'s resources.',
                eraContextSentence: 'an era of colonial exploitation, where France transforms the Great Red Island.',
                allegianceGroups: [
                    { name: 'French Colonial Administration', type: 'primary', description: 'The European colonial power.' },
                    { name: 'Merina Aristocracy', type: 'secondary', description: 'The subordinated traditional elite.' },
                    { name: 'Menalamba Rebellion', type: 'rebel', description: 'Anti-colonial resistance movement.' },
                    { name: 'Coastal Peoples', type: 'secondary', description: 'Groups often favored by French over Merina.' }
                ],
                structureNames: {
                    fortress: ['Colonial Garrison', 'Administrative Post'],
                    factory: ['Coffee Plantation', 'Vanilla Processing'],
                    trading_post: ['Colonial Port', 'Railway Station'],
                    mining_colony: ['Graphite Mine', 'Mica Quarry']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Republic of Madagascar',
                dominantPowerDescription: 'Independent Madagascar struggles with political instability and poverty while protecting unique biodiversity.',
                eraContextSentence: 'an era of endangered wonders, where unique wildlife faces human poverty.',
                allegianceGroups: [
                    { name: 'Malagasy Government', type: 'primary', description: 'The often-unstable central government.' },
                    { name: 'France', type: 'secondary', description: 'The former colonial power maintaining influence.' },
                    { name: 'Conservation NGOs', type: 'trade_company', description: 'International groups protecting biodiversity.' },
                    { name: 'Dahalo Bandits', type: 'rebel', description: 'Cattle raiders in the south.' }
                ],
                structureNames: {
                    fortress: ['Gendarmerie Post', 'Presidential Guard Base'],
                    factory: ['Textile Factory', 'Vanilla Cooperative'],
                    trading_post: ['Eco-Tourism Lodge', 'Sapphire Market'],
                    mining_colony: ['Sapphire Mine', 'Ilmenite Mine']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'Madagascar Ecological Republic',
                dominantPowerDescription: 'Madagascar pioneers a development model balancing human needs with biodiversity conservation.',
                eraContextSentence: 'an age of green innovation, where Madagascar\'s unique nature becomes its greatest asset.',
                allegianceGroups: [
                    { name: 'Ecological Government', type: 'primary', description: 'The green development state.' },
                    { name: 'Global Conservation Fund', type: 'secondary', description: 'International biodiversity funders.' },
                    { name: 'Indian Ocean Commission', type: 'secondary', description: 'Regional climate alliance.' },
                    { name: 'Resource Extractors', type: 'rebel', description: 'Groups illegally exploiting protected areas.' }
                ],
                structureNames: {
                    fortress: ['Ranger Station', 'Anti-Poaching Drone Base'],
                    factory: ['Sustainable Spice Farm', 'Solar Panel Assembly', 'Biodiversity Research Lab'],
                    trading_post: ['Carbon Credit Exchange', 'Eco-Tourism Hub', 'Digital Conservation Center']
                }
            }
        },
        "Swahili Coast": {
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Kilwa Sultanate',
                dominantPowerDescription: 'A wealthy maritime power controlling the gold and ivory trade with the interior.',
                eraContextSentence: 'an age of monsoon trade, where dhows carry gold from Zimbabwe to Arabia.',
                allegianceGroups: [
                    { name: 'Kilwa Sultanate', type: 'primary', description: 'The dominant Swahili city-state.' },
                    { name: 'Mogadishu', type: 'secondary', description: 'A rival northern city-state.' },
                    { name: 'Arab Merchants', type: 'secondary', description: 'Traders from Yemen and Oman.' }
                ],
                structureNames: {
                    fortress: ['Stone Fort'],
                    palace: ['Sultan\'s Palace'],
                    trading_post: ['Dhow Harbor'],
                    holy_site: ['Great Mosque']
                },
                courtRoles: {
                    palace: ['Sultan', 'Vizier', 'Harbor Master', 'Chief Merchant']
                }
            }
        },
        "Rwanda Burundi Highlands": {
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Kingdom of Rwanda',
                dominantPowerDescription: 'A centralized kingdom with sophisticated political institutions.',
                eraContextSentence: 'an age of highland kingdoms, where cattle wealth determines social status.',
                allegianceGroups: [
                    { name: 'Kingdom of Rwanda', type: 'primary', description: 'The ruling Tutsi dynasty.' },
                    { name: 'Hutu Farmers', type: 'secondary', description: 'The agricultural majority.' },
                    { name: 'Twa Hunters', type: 'secondary', description: 'Forest-dwelling peoples.' }
                ],
                structureNames: {
                    fortress: ['Royal Hill'],
                    palace: ['Mwami\'s Court'],
                    holy_site: ['Sacred Grove']
                }
            }
        },
        "Okavango Delta": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'San Peoples',
                dominantPowerDescription: 'Hunter-gatherer bands with ancient knowledge of the delta\'s seasonal cycles.',
                eraContextSentence: 'an age of harmony with nature, where the flood brings life to the desert.',
                allegianceGroups: [
                    { name: 'San Peoples', type: 'primary', description: 'The indigenous hunter-gatherers.' },
                    { name: 'Bantu Migrants', type: 'secondary', description: 'Iron-working farmers arriving from the north.' }
                ],
                structureNames: {
                    holy_site: ['Rock Art Site'],
                    mill: ['Fish Weir']
                }
            }
        },
        "Nubian Desert": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Kingdom of Kush',
                dominantPowerDescription: 'The ancient Nubian kingdom, once conquerors of Egypt.',
                eraContextSentence: 'an age of black pharaohs, where Nubian pyramids rise from the desert.',
                allegianceGroups: [
                    { name: 'Kingdom of Kush', type: 'primary', description: 'The Nubian royal dynasty.' },
                    { name: 'Desert Nomads', type: 'secondary', description: 'Bedouin tribes of the Eastern Desert.' },
                    { name: 'Egyptian Traders', type: 'secondary', description: 'Merchants from the north.' }
                ],
                structureNames: {
                    fortress: ['Desert Fort'],
                    palace: ['Royal Palace'],
                    holy_site: ['Temple of Amun']
                }
            }
        },
        "Lower Guinea and Congo Basin": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Bantu Migration',
                dominantPowerDescription: 'Bantu-speaking peoples spread through the Congo Basin, bringing iron technology and agricultural practices to the rainforest.',
                eraContextSentence: 'an age of migration and iron, as Bantu peoples transform the heart of Africa.',
                allegianceGroups: [
                    { name: 'Bantu Peoples', type: 'primary', description: 'The expanding agricultural societies.' },
                    { name: 'Pygmy Groups', type: 'secondary', description: 'Indigenous forest dwellers.' },
                    { name: 'Coastal Traders', type: 'trade_company', description: 'Early maritime merchants.' }
                ],
                structureNames: {
                    fortress: ['Stockaded Village', 'Forest Settlement'],
                    mill: ['Iron Forge', 'Palm Oil Press'],
                    holy_site: ['Ancestor Grove', 'Forest Shrine']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Kingdom of Kongo',
                dominantPowerDescription: 'The Kingdom of Kongo emerges as the dominant power, controlling trade routes and developing sophisticated political institutions.',
                eraContextSentence: 'an age of divine kingship, where the Kongo kingdom dominates the Lower Guinea coast.',
                allegianceGroups: [
                    { name: 'Kingdom of Kongo', type: 'primary', description: 'The dominant coastal power.' },
                    { name: 'Kingdom of Loango', type: 'secondary', description: 'A rival coastal kingdom to the north.' },
                    { name: 'Luba Kingdom', type: 'secondary', description: 'An interior trading partner.' },
                    { name: 'Forest Chiefdoms', type: 'secondary', description: 'Smaller polities in the rainforest interior.' }
                ],
                structureNames: {
                    fortress: ['Royal Enclosure', 'Coastal Fort'],
                    holy_site: ['Royal Burial Ground', 'Nkisi House'],
                    palace: ['Manikongo\'s Court', 'Provincial Palace'],
                    trading_post: ['Ivory Market', 'Copper Exchange']
                },
                courtRoles: {
                    palace: ['Manikongo', 'Mwene', 'Royal Judge', 'Keeper of Customs']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Kingdom of Kongo (Portuguese Alliance)',
                dominantPowerDescription: 'Kongo forms alliances with Portuguese traders and adopts Christianity, while struggling to control the growing Atlantic slave trade.',
                eraContextSentence: 'an age of crosses and captives, where European contact transforms Central African societies.',
                allegianceGroups: [
                    { name: 'Kingdom of Kongo', type: 'primary', description: 'The Christianized African kingdom.' },
                    { name: 'Portuguese Traders', type: 'trade_company', description: 'European slave traders and missionaries.' },
                    { name: 'Imbangala Warriors', type: 'mercenary', description: 'Military bands serving as slave raiders.' },
                    { name: 'Kingdom of Ndongo', type: 'secondary', description: 'Angolan kingdom resisting Portuguese expansion.' }
                ],
                structureNames: {
                    fortress: ['Portuguese Fort', 'Kongo Stronghold'],
                    holy_site: ['Catholic Church', 'Traditional Shrine'],
                    palace: ['Christianized Royal Court'],
                    trading_post: ['Slave Port', 'Ivory Warehouse']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Belgian Congo',
                dominantPowerDescription: 'King Leopold II\'s Congo Free State becomes synonymous with colonial brutality, exploiting rubber and minerals through forced labor.',
                eraContextSentence: 'an era of rubber terror, where colonial greed creates unprecedented suffering.',
                allegianceGroups: [
                    { name: 'Congo Free State', type: 'primary', description: 'Leopold\'s brutal personal colony.' },
                    { name: 'Force Publique', type: 'mercenary', description: 'The colonial military force.' },
                    { name: 'Catholic Missions', type: 'religious', description: 'European missionary presence.' },
                    { name: 'Resistance Movements', type: 'rebel', description: 'Various groups fighting colonial rule.' }
                ],
                structureNames: {
                    fortress: ['Colonial Post', 'Rubber Collection Station'],
                    factory: ['Rubber Processing Plant', 'Palm Oil Factory'],
                    mining_colony: ['Copper Mine', 'Diamond Mine'],
                    trading_post: ['River Station', 'Railway Depot']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Democratic Republic of Congo',
                dominantPowerDescription: 'The DRC struggles with the "resource curse" as vast mineral wealth fuels conflict rather than development in the post-colonial era.',
                eraContextSentence: 'an era of minerals and militias, where Congo\'s riches become its curse.',
                allegianceGroups: [
                    { name: 'DRC Government', type: 'primary', description: 'The weak central government in Kinshasa.' },
                    { name: 'UN Peacekeepers', type: 'secondary', description: 'International stabilization force.' },
                    { name: 'M23 Rebels', type: 'rebel', description: 'One of many armed groups in the east.' },
                    { name: 'Chinese Mining Companies', type: 'trade_company', description: 'Major mineral extractors.' }
                ],
                structureNames: {
                    fortress: ['Army Base', 'UN Compound'],
                    factory: ['Copper Smelter', 'Coltan Processing'],
                    mining_colony: ['Cobalt Mine', 'Diamond Field', 'Coltan Mine'],
                    trading_post: ['Border Crossing', 'Mineral Trading Post', 'NGO Base']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'Congo Basin Federation',
                dominantPowerDescription: 'Central African nations unite to protect the rainforest while developing sustainable extraction of critical minerals for the green economy.',
                eraContextSentence: 'an age of green gold, where the rainforest and rare minerals shape global climate solutions.',
                allegianceGroups: [
                    { name: 'Congo Basin Federation', type: 'primary', description: 'Environmental protection alliance.' },
                    { name: 'Global Climate Fund', type: 'secondary', description: 'International forest preservation backers.' },
                    { name: 'Eco-Warriors', type: 'rebel', description: 'Radical forest defenders.' },
                    { name: 'Mineral Cartels', type: 'trade_company', description: 'Companies controlling battery minerals.' }
                ],
                structureNames: {
                    fortress: ['Eco-Ranger Station', 'Anti-Poaching Drone Base'],
                    factory: ['Sustainable Mining Complex', 'Carbon Capture Forest', 'Battery Component Plant'],
                    trading_post: ['Green Mineral Exchange', 'Eco-Tourism Hub', 'Research Station']
                }
            }
        },
        "East African Rift": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Early Cushitic Peoples',
                dominantPowerDescription: 'Cushitic-speaking peoples establish pastoral and agricultural communities around the Great Rift lakes, developing complex social systems.',
                eraContextSentence: 'an age of first farmers, where Cushitic peoples domesticate the highlands of East Africa.',
                allegianceGroups: [
                    { name: 'Cushitic Peoples', type: 'primary', description: 'The dominant pastoralist groups.' },
                    { name: 'Nilotic Migrants', type: 'secondary', description: 'Cattle herders from the north.' },
                    { name: 'Hunter-Gatherer Bands', type: 'secondary', description: 'Indigenous Khoisan-related peoples.' }
                ],
                structureNames: {
                    fortress: ['Highland Stockade', 'Lakeside Settlement'],
                    mill: ['Cattle Pen', 'Grinding Stone'],
                    holy_site: ['Sacred Hill', 'Ancestral Cave']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Great Lakes Kingdoms',
                dominantPowerDescription: 'Powerful kingdoms like Buganda, Rwanda, and Burundi emerge around Lake Victoria, developing sophisticated political hierarchies based on cattle wealth.',
                eraContextSentence: 'an age of cattle kings, where the Great Lakes kingdoms create Africa\'s most centralized states.',
                allegianceGroups: [
                    { name: 'Kingdom of Buganda', type: 'primary', description: 'The most powerful Great Lakes kingdom.' },
                    { name: 'Kingdom of Rwanda', type: 'secondary', description: 'A highly centralized highland state.' },
                    { name: 'Kingdom of Burundi', type: 'secondary', description: 'A rival highland kingdom.' },
                    { name: 'Maasai Pastoralists', type: 'secondary', description: 'Nilotic warrior-herders of the plains.' }
                ],
                structureNames: {
                    fortress: ['Royal Hill', 'Cattle Enclosure'],
                    holy_site: ['Sacred Drum House', 'Royal Burial Ground'],
                    palace: ['Kabaka\'s Court', 'Mwami\'s Residence'],
                    trading_post: ['Cattle Market', 'Iron Trading Post']
                },
                courtRoles: {
                    palace: ['Kabaka', 'Katikkiro', 'Royal Drummer', 'Cattle Chief']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Buganda Empire',
                dominantPowerDescription: 'Buganda expands around Lake Victoria, developing sophisticated governance while the Maasai dominate the Rift Valley plains.',
                eraContextSentence: 'an age of expansion, where Buganda becomes the Prussia of Africa.',
                allegianceGroups: [
                    { name: 'Kingdom of Buganda', type: 'primary', description: 'The expanding lakeside empire.' },
                    { name: 'Maasai Confederation', type: 'secondary', description: 'Warrior pastoralists controlling the plains.' },
                    { name: 'Swahili Traders', type: 'trade_company', description: 'Coastal merchants seeking ivory and slaves.' },
                    { name: 'Arab Merchants', type: 'trade_company', description: 'Muslim traders from Zanzibar.' }
                ],
                structureNames: {
                    fortress: ['Royal Enclosure', 'Warrior Manyatta'],
                    palace: ['Kabaka\'s Palace', 'Provincial Governor\'s Compound'],
                    holy_site: ['Royal Tomb', 'Sacred Forest'],
                    trading_post: ['Ivory Market', 'Slave Caravan Route']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'German East Africa',
                dominantPowerDescription: 'German colonial rule transforms the region with the construction of railways, while British rule extends over Uganda and the lake kingdoms.',
                eraContextSentence: 'an era of the scramble for Africa, where European powers carve up the Great Lakes region.',
                allegianceGroups: [
                    { name: 'German East Africa', type: 'primary', description: 'Colonial administration of Tanganyika.' },
                    { name: 'British Uganda', type: 'secondary', description: 'Protectorate over the lake kingdoms.' },
                    { name: 'Maji Maji Rebels', type: 'rebel', description: 'Anti-German resistance movement.' },
                    { name: 'Traditional Rulers', type: 'secondary', description: 'Subordinated indigenous authorities under indirect rule.' }
                ],
                structureNames: {
                    fortress: ['Colonial Fort', 'Railway Station Fort'],
                    factory: ['Sisal Plantation', 'Coffee Processing Plant'],
                    trading_post: ['Railway Depot', 'Administrative Center'],
                    mining_colony: ['Diamond Mine', 'Gold Mine']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'East African Community',
                dominantPowerDescription: 'Kenya, Tanzania, and Uganda form the East African Community while Rwanda and Burundi recover from genocide and civil war.',
                eraContextSentence: 'an era of integration and recovery, where East Africa seeks unity amid diversity.',
                allegianceGroups: [
                    { name: 'Kenya', type: 'primary', description: 'The regional economic leader.' },
                    { name: 'Tanzania', type: 'secondary', description: 'The largest East African nation.' },
                    { name: 'East African Community', type: 'secondary', description: 'Regional integration organization.' },
                    { name: 'Lord\'s Resistance Army', type: 'rebel', description: 'Insurgent group operating across borders.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Border Post'],
                    factory: ['Tea Processing Plant', 'Flower Farm', 'Mobile Phone Assembly'],
                    trading_post: ['Safari Lodge', 'Cross-Border Market', 'Tech Hub'],
                    mining_colony: ['Gold Mine', 'Tanzanite Mine']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'East African Community',
                dominantPowerDescription: 'The Nairobi-Kampala corridor rapidly urbanizes.',
                eraContextSentence: 'an age of rapid change and recovery from disaster.',
                allegianceGroups: [
                    { name: 'East African Federation', type: 'primary', description: 'The unified regional state.' },

                    { name: 'Great Lakes Development Bank', type: 'trade_company', description: 'Regional financial institution.' },
                    { name: 'Pastoralist Rights Movement', type: 'rebel', description: 'Traditional herders resisting modernization.' }
                ],
                structureNames: {
                    fortress: ['UN Peacekeepers', 'Border Post'],
                    factory: ['Geothermal Complex', 'Electric Vehicle Assembly', 'Vertical Farm'],
                    mining_colony: ['Gold Mine', 'Tanzanite Mine']
                }
            }
        }
    }
};