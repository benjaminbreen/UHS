/**
 * constants/gameData/factions/southAmerican.ts
 * Faction data for South American cultural zones.
 */
import { HistoricalEra } from '../../../types';
import { FactionFile } from './types';

const MODERN_ERA = 'MODERN_ERA';

export const SOUTH_AMERICAN_FACTIONS: FactionFile = {
    'SOUTH_AMERICAN': {
        "Andes North": {
            [HistoricalEra.PREHISTORY]: {
                dominantPower: 'Chavín Culture',
                dominantPowerDescription: 'Early Andean civilization centered on the Chavín de Huántar temple complex, spreading religious and artistic influence across Peru.',
                eraContextSentence: 'the time of the jaguar priests, where sacred temples unite the highlands and coast through shared religious visions.',
                allegianceGroups: [
                    { name: 'Chavín Cult', type: 'primary', description: 'Religious center of pilgrimage.' },
                    { name: 'Coastal Fishing Villages', type: 'secondary', description: 'Maritime communities.' },
                    { name: 'Highland Herders', type: 'secondary', description: 'Llama and alpaca pastoralists.' }
                ],
                structureNames: {
                    fortress: ['Stone Temple', 'Ceremonial Center', 'Highland Fort'],
                    quarry: ['Obsidian Mine', 'Stone Quarry', 'Gold Stream'],
                    holy_site: ['Oracle Chamber', 'Sunken Plaza', 'Sacred Gallery', 'Pilgrimage Site'],
                    palace: ["Priest's Compound", 'Temple Complex', 'Ceremonial Court'],
                },
                courtRoles: {
                    palace: ['High Priest', 'Oracle', 'Temple Guardian', 'Master Sculptor', 'Ritual Specialist']
                }
            },
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Moche Civilization',
                dominantPowerDescription: 'Sophisticated coastal and highland society with advanced metallurgy, irrigation systems, and monumental architecture in the northern Peruvian coast.',
                eraContextSentence: 'an age of coastal splendor, where the Moche create magnificent art and engineering works.',
                allegianceGroups: [
                    { name: 'Moche Civilization', type: 'primary', description: 'The dominant coastal power.'},
                    { name: 'Nazca Culture', type: 'secondary', description: 'A neighboring culture to the south, famous for geoglyphs.' },
                    { name: 'Lima Culture', type: 'secondary', description: 'A culture centered on the central coast.' },
                    { name: 'Highland Chiefdoms', type: 'secondary', description: 'Independent polities in the mountains.' }
                ],
                structureNames: {
                    fortress: ['Ceremonial Complex', 'Adobe Pyramid (Huaca)'],
                    mill: ['Irrigation Canal', 'Workshop'],
                    holy_site: ['Huaca del Sol', 'Huaca de la Luna'],
                    palace: ["Lord's Residence"]
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Chimu Empire',
                dominantPowerDescription: 'The largest pre-Columbian city in South America, Chan Chan, serves as the capital of this powerful coastal empire with sophisticated urban planning.',
                eraContextSentence: 'the age of great cities, where the Chimu build the largest urban centers in the Americas.',
                allegianceGroups: [
                    { name: 'Chimu Empire', type: 'primary', description: 'The dominant coastal empire.'},
                    { name: 'Chachapoya Culture', type: 'secondary', description: '"Cloud Warriors" of the Andean forests.' },
                    { name: 'Highland Kingdoms', type: 'secondary', description: 'Various independent kingdoms in the mountains.' },
                    { name: 'Inca Empire', type: 'secondary', description: 'A rapidly expanding power from the south.' }
                ],
                structureNames: {
                    fortress: ['Adobe Citadel', 'Walled City (Chan Chan)'],
                    mill: ['Canal System', 'Metalwork Shop'],
                    holy_site: ['Ceremonial Platform'],
                    palace: ["King's Compound"]
                },
                mapAreaOverrides: {
                    "Quito Plateau": {
                        dominantPower: 'Kingdom of Quito',
                        dominantPowerDescription: 'An advanced highland kingdom that would later be incorporated into the Inca Empire.',
                        allegianceGroups: [
                            { name: 'Kingdom of Quito', type: 'primary', description: 'The highland power controlling the northern reaches.' },
                            { name: 'Cañari Confederation', type: 'secondary', description: 'A confederation of tribes to the south.' },
                            { name: 'Shyris Dynasty', type: 'secondary', description: 'The ruling dynasty of Quito.' }
                        ]
                    }
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Spanish Colonial Empire',
                dominantPowerDescription: 'The Viceroyalty of Peru extends Spanish control throughout the northern Andes, extracting wealth while establishing colonial institutions.',
                eraContextSentence: 'an era of Spanish dominion, where colonial administration extracts the wealth of the Andes.',
                allegianceGroups: [
                    { name: 'Spanish Empire', type: 'primary', description: 'The colonial Viceroyalty of Peru.'},
                    { name: 'Indigenous Resistance', type: 'rebel', description: 'Remnant Inca and other groups resisting Spanish rule.' },
                    { name: 'Audiencia of Quito', type: 'secondary', description: 'A subordinate administrative district.' },
                    { name: 'Portuguese Brazil', type: 'secondary', description: 'A rival colonial power to the east.' }
                ],
                structureNames: {
                    fortress: ['Colonial Fort', 'Walled City'],
                    mill: ['Hacienda', 'Sugar Mill (Ingenio)'],
                    mining_colony: ['Silver Mine'],
                    holy_site: ['Mission Church', 'Cathedral'],
                    palace: ["Viceroy's Palace"]
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Gran Colombia',
                dominantPowerDescription: "Simón Bolívar's vision of a united northern South America briefly creates a powerful republic before fragmenting into separate nations.",
                eraContextSentence: "an era of republican dreams, where Bolívar's vision of continental unity shapes the struggle for independence.",
                allegianceGroups: [
                    { name: 'Republic of Gran Colombia', type: 'primary', description: 'The unified republic of Venezuela, Colombia, and Ecuador.'},
                    { name: 'Spanish Empire', type: 'rebel', description: 'Royalist forces still loyal to Spain.' },
                    { name: 'Peru', type: 'secondary', description: 'A neighboring republic.' },
                    { name: 'Empire of Brazil', type: 'secondary', description: 'A neighboring monarchy.' }
                ],
                structureNames: {
                    fortress: ['Republican Fort', 'Barracks'],
                    mill: ['Sugar Mill', 'Coffee Plantation'],
                    mining_colony: ['Silver Mine', 'Gold Mine'],
                    trading_post: ['Port Authority', 'Custom House']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Republics of Colombia & Ecuador',
                dominantPowerDescription: 'The modern nations of Colombia and Ecuador navigate political instability, economic development based on oil and agriculture, and the challenges of the drug trade.',
                eraContextSentence: 'an era of oil and conflict, as modern nations grapple with internal strife and global economic pressures.',
                allegianceGroups: [
                    { name: 'Government of Colombia', type: 'primary', description: 'The central government.'},
                    { name: 'Government of Ecuador', type: 'primary', description: 'The central government.' },
                    { name: 'Drug Cartels', type: 'rebel', description: 'Powerful and violent criminal organizations.' },
                    { name: 'United States', type: 'secondary', description: 'A major foreign power with significant influence.' },
                ],
                structureNames: {
                    fortress: ['Military Base', 'Naval Port'],
                    factory: ['Oil Refinery', 'Textile Factory', 'Flower Plantation'],
                    trading_post: ['International Airport', 'Container Port', 'Pan-American Highway Checkpoint'],
                    mining_colony: ['Oil Well', 'Emerald Mine'],
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Andean Climate Alliance',
                dominantPowerDescription: 'A regional cooperation pact between Colombia, Ecuador, and Peru focused on climate adaptation and sustainable development of mountain ecosystems.',
                eraContextSentence: 'an era of environmental cooperation, where Andean nations unite to protect glaciers and mountain watersheds.',
                allegianceGroups: [
                    { name: 'Andean Climate Alliance', type: 'primary', description: 'Regional environmental cooperation body.' },
                    { name: 'Indigenous Councils', type: 'secondary', description: 'Empowered indigenous governance structures.' },
                    { name: 'Chinese Infrastructure Consortium', type: 'trade_company', description: 'Major foreign investor in green technology.' },
                    { name: 'Amazon Defense Movement', type: 'rebel', description: 'Radical environmental protection groups.' }
                ],
                structureNames: {
                    fortress: ['Climate Monitoring Station', 'Disaster Response Center'],
                    factory: ['Vertical Farm Complex', 'Lithium Battery Plant'],
                    trading_post: ['High-Speed Rail Terminal', 'Green Energy Export Hub'],
                    mining_colony: ['Rare Earth Element Mine', 'Geothermal Plant']
                }
            }
        },
        "Andes South": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Tiwanaku Empire',
                dominantPowerDescription: 'A powerful highland empire centered around Lake Titicaca, controlling trade routes and developing advanced agricultural techniques at high altitude.',
                eraContextSentence: 'an age of high-altitude civilization, where Tiwanaku masters the challenges of Altiplano agriculture.',
                allegianceGroups: [
                    { name: 'Tiwanaku Empire', type: 'primary', description: 'The dominant highland power.'},
                    { name: 'Wari Empire', type: 'secondary', description: 'A rival empire to the north.' },
                    { name: 'Regional Kingdoms', type: 'secondary', description: 'Smaller independent polities.' },
                    { name: 'Coastal Peoples', type: 'secondary', description: 'Cultures on the Pacific coast.' }
                ],
                structureNames: {
                    fortress: ['Stone Fortress', 'Ceremonial Center'],
                    mill: ['Raised Fields (Suka Kollus)', 'Terraced Farm'],
                    holy_site: ['Gateway of the Sun'],
                    palace: ["Tiwanaku Elite Compound"]
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Inca Empire',
                dominantPowerDescription: 'The Tawantinsuyu becomes the largest empire in pre-Columbian America, uniting diverse peoples under sophisticated administrative and engineering systems.',
                eraContextSentence: 'the age of the four quarters, where Inca administration unites the Andes from Ecuador to Chile.',
                allegianceGroups: [
                    { name: 'Inca Empire', type: 'primary', description: 'The vast and centralized empire.'},
                    { name: 'Regional Ethnic Groups (Aymara, etc.)', type: 'secondary', description: 'Conquered peoples integrated into the empire.' },
                    { name: 'Mapuche Resistance', type: 'rebel', description: 'Unconquered peoples on the southern frontier.' },
                    { name: 'Coastal Kingdoms', type: 'secondary', description: 'Vassal states along the coast.' }
                ],
                structureNames: {
                    fortress: ['Pucará', 'Tambo (Waystation)'],
                    mill: ['Andenes (Terraces)', 'Qullqa (Storehouse)'],
                    holy_site: ['Coricancha (Sun Temple)', 'Sacred Rock'],
                    palace: ["Sapa Inca's Palace (Cusco)"],
                },
                courtRoles: {
                    palace: ['High Priest of the Sun', 'Inca General', 'Quipucamayoc (Knot-keeper)', 'Apu (Provincial Governor)'],
                    holy_site: ['Willaq Umu (High Priest)', 'Aclla (Chosen Woman)', 'Oracle of the Huaca']
                },
                mapAreaOverrides: {
                    "Lake Titicaca Basin": {
                        dominantPower: 'Colla Kingdom',
                        dominantPowerDescription: 'A powerful Aymara kingdom that resisted Inca expansion before eventual incorporation.',
                        allegianceGroups: [
                            { name: 'Colla Kingdom', type: 'primary', description: 'The Aymara power around Lake Titicaca.' },
                            { name: 'Lupaca Kingdom', type: 'secondary', description: 'A rival Aymara kingdom.' },
                            { name: 'Inca Empire', type: 'secondary', description: 'The expanding power from Cuzco.' }
                        ]
                    }
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Spanish Colonial Empire',
                dominantPowerDescription: 'The Viceroyalty of Peru becomes the administrative center of Spanish South America, with Lima as the capital of colonial administration.',
                eraContextSentence: 'an era of colonial extraction, where Spanish administration reorganizes Andean society around mining and tribute.',
                allegianceGroups: [
                    { name: 'Spanish Empire', type: 'primary', description: 'The colonial Viceroyalty of Peru.'},
                    { name: 'Indigenous Communities', type: 'rebel', description: 'Andean peoples in various states of resistance or assimilation.' },
                    { name: 'Audiencia of Charcas', type: 'secondary', description: 'An administrative court in the southern highlands.' },
                    { name: 'Mapuche Nation', type: 'rebel', description: 'An unconquered indigenous power to the south.' }
                ],
                structureNames: {
                    fortress: ['Presidio', 'Colonial Fort'],
                    mill: ['Obraje (Textile Workshop)', 'Hacienda'],
                    mining_colony: ['Silver Mine (Potosí)'],
                    holy_site: ['Cathedral', 'Mission'],
                    palace: ["Viceroy's Palace (Lima)"]
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Republic of Peru',
                dominantPowerDescription: 'Independent Peru struggles to maintain control over its vast territory while competing with Chile and Bolivia for regional dominance.',
                eraContextSentence: 'an era of national consolidation, where Andean republics compete for territory and resources.',
                allegianceGroups: [
                    { name: 'Republic of Peru', type: 'primary', description: 'The newly independent nation.'},
                    { name: 'Chile', type: 'secondary', description: 'An expanding rival to the south.' },
                    { name: 'Bolivia', type: 'secondary', description: 'A highland rival.' },
                    { name: 'Argentina', type: 'secondary', description: 'A growing power to the east.' }
                ],
                structureNames: {
                    fortress: ['Military Barracks', 'Border Post'],
                    mill: ['Textile Factory'],
                    mining_colony: ['Guano Works', 'Nitrate Field'],
                    factory: ['Guano Processing Plant'],
                    trading_post: ['Railway Line', 'Port of Callao']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Republics of Peru, Bolivia & Chile',
                dominantPowerDescription: 'The modern nations of the Southern Andes build their economies on vast mineral wealth while facing political instability, social inequality, and the challenges of preserving indigenous cultures.',
                eraContextSentence: 'an age of copper and lithium, where mineral wealth drives development and conflict.',
                allegianceGroups: [
                    { name: 'Republic of Peru', type: 'primary', description: 'The central government.'},
                    { name: 'Republic of Bolivia', type: 'primary', description: 'The central government.' },
                    { name: 'Republic of Chile', type: 'primary', description: 'The central government.' },
                    { name: 'Shining Path (Sendero Luminoso)', type: 'rebel', description: 'A Maoist guerrilla group in Peru.' },
                    { name: 'International Mining Corporations', type: 'trade_company', description: 'Powerful foreign companies extracting resources.' },
                ],
                structureNames: {
                    fortress: ['Military Base'],
                    factory: ['Fishmeal Plant', 'Textile Factory'],
                    mining_colony: ['Copper Mine (Chuquicamata)', 'Lithium Brine Pool (Salar de Uyuni)', 'Gas Field'],
                    trading_post: ['International Airport', 'Container Port'],
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Lithium Triangle Alliance',
                dominantPowerDescription: 'Bolivia, Chile, and Argentina form a resource cartel controlling over 60% of global lithium reserves, leveraging their position in the green energy transition.',
                eraContextSentence: 'an era of battery diplomacy, where control of lithium reserves shapes global power dynamics.',
                allegianceGroups: [
                    { name: 'Lithium Triangle Alliance', type: 'primary', description: 'The tri-national lithium cartel.' },
                    { name: 'Indigenous Resource Councils', type: 'secondary', description: 'Local communities demanding profit-sharing.' },
                    { name: 'Tesla-BYD Consortium', type: 'trade_company', description: 'Major battery manufacturers seeking stable supply.' },
                    { name: 'Water Rights Movement', type: 'rebel', description: 'Groups protesting lithium extraction water usage.' }
                ],
                structureNames: {
                    fortress: ['Environmental Protection Force Base', 'Resource Security Center'],
                    factory: ['Battery Gigafactory', 'Solar Panel Assembly Plant'],
                    mining_colony: ['Advanced Lithium Extraction Facility', 'Brine Processing Complex'],
                    trading_post: ['Electric Vehicle Charging Corridor', 'Green Metal Exchange']
                }
            }
        },
        "Amazon Basin": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Marajoara Culture',
                dominantPowerDescription: 'Advanced pottery-making societies in the Amazon River mouth develop complex earthworks and sophisticated water management in the floodplains.',
                eraContextSentence: 'an age of river mastery, where Amazonian peoples create monumental earthworks and thrive in the várzea.',
                allegianceGroups: [
                    { name: 'Marajoara Chiefdoms', type: 'primary', description: 'The dominant culture of Marajó Island.' },
                    { name: 'Tapajós Confederation', type: 'secondary', description: 'River peoples of the Tapajós.' },
                    { name: 'Upper Amazon Tribes', type: 'secondary', description: 'Diverse groups in the western Amazon.' },
                    { name: 'Arawak Traders', type: 'trade_company', description: 'Long-distance trade networks.' }
                ],
                structureNames: {
                    fortress: ['Earthen Mound', 'Palisaded Village'],
                    mill: ['Fish Weir', 'Manioc Processing House'],
                    holy_site: ['Burial Mound', 'Ceremonial Plaza'],
                    palace: ["Chief's Longhouse"]
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Amazonian Chiefdoms',
                dominantPowerDescription: 'Complex societies flourish along major rivers, creating extensive networks of raised fields, fish weirs, and forest management systems.',
                eraContextSentence: 'the age of forest gardens, where indigenous knowledge creates abundant landscapes.',
                allegianceGroups: [
                    { name: 'Omagua Confederation', type: 'primary', description: 'Powerful riverine chiefdoms.' },
                    { name: 'Munduruku Nation', type: 'secondary', description: 'Warriors of the Tapajós.' },
                    { name: 'Tikuna Peoples', type: 'secondary', description: 'Masters of the western rivers.' },
                    { name: 'Forest Peoples', type: 'secondary', description: 'Interfluvial populations.' }
                ],
                structureNames: {
                    fortress: ['Riverine Fort', 'Hilltop Refuge'],
                    mill: ['Terra Preta Garden', 'Fish Smoking House'],
                    holy_site: ['Sacred Grove', 'Ancestor House'],
                    palace: ["Paramount Chief's Maloca"]
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Portuguese Colonial Missions',
                dominantPowerDescription: 'Jesuit and Franciscan missions penetrate the Amazon, disrupting indigenous societies while Portuguese traders establish the rubber and spice trade.',
                eraContextSentence: 'an era of missions and slavery, where European diseases and slave raids devastate indigenous populations.',
                allegianceGroups: [
                    { name: 'Portuguese Brazil', type: 'primary', description: 'Colonial authorities based in Belém.' },
                    { name: 'Jesuit Missions', type: 'religious', description: 'Religious orders creating reductions.' },
                    { name: 'Bandeirantes', type: 'mercenary', description: 'Slave raiders from São Paulo.' },
                    { name: 'Resistant Tribes', type: 'rebel', description: 'Indigenous groups fleeing to the interior.' }
                ],
                structureNames: {
                    fortress: ['River Fort', 'Mission Stockade'],
                    mill: ['Sugar Engenho', 'Cacao Plantation'],
                    holy_site: ['Mission Church', 'Reduction Chapel'],
                    palace: ["Governor's Residence"],
                    trading_post: ['River Trading Post', 'Slave Market']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Rubber Baron Empire',
                dominantPowerDescription: 'The rubber boom transforms the Amazon as brutal extraction systems enrich rubber barons while enslaving indigenous peoples and importing nordestino workers.',
                eraContextSentence: 'an era of rubber fever, where the demand for latex brings wealth and horror to the rainforest.',
                allegianceGroups: [
                    { name: 'Brazilian Empire/Republic', type: 'primary', description: 'The national government with limited control.' },
                    { name: 'Rubber Barons', type: 'trade_company', description: 'Powerful extractive oligarchs.' },
                    { name: 'Nordestino Migrants', type: 'secondary', description: 'Drought refugees becoming rubber tappers.' },
                    { name: 'Indigenous Resistance', type: 'rebel', description: 'Tribes fighting enslavement.' }
                ],
                structureNames: {
                    fortress: ['Rubber Baron Fort', 'Company Barracks'],
                    mill: ['Rubber Processing Shed', 'Smoke House'],
                    factory: ['Rubber Warehouse'],
                    trading_post: ['River Port', 'Company Store'],
                    palace: ["Rubber Baron Mansion (Manaus)"]
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Brazilian Federal Republic',
                dominantPowerDescription: 'Brazil pushes development into the Amazon through massive infrastructure projects, cattle ranching, and resource extraction, sparking environmental destruction.',
                eraContextSentence: 'an era of chainsaws and cattle, as development pressures threaten the world\'s largest rainforest.',
                allegianceGroups: [
                    { name: 'Brazilian Government', type: 'primary', description: 'Federal authorities promoting development.' },
                    { name: 'Agribusiness Consortiums', type: 'trade_company', description: 'Powerful cattle and soy interests.' },
                    { name: 'Indigenous Rights Movement', type: 'rebel', description: 'Tribes defending ancestral lands.' },
                    { name: 'Environmental NGOs', type: 'secondary', description: 'International conservation groups.' }
                ],
                structureNames: {
                    fortress: ['Military Outpost', 'Federal Police Base'],
                    factory: ['Sawmill', 'Meat Packing Plant'],
                    mining_colony: ['Gold Garimpo', 'Bauxite Mine'],
                    trading_post: ['Trans-Amazonian Highway Stop', 'River Port']
                }
            },
            "1990s": {
                dominantPower: 'Brazilian Environmental State',
                dominantPowerDescription: 'Following international pressure, Brazil creates extensive protected areas and indigenous territories while illegal logging and mining continue.',
                eraContextSentence: 'an era of conservation battles, where global attention focuses on saving the rainforest.',
                allegianceGroups: [
                    { name: 'Brazilian Environmental Agency (IBAMA)', type: 'primary', description: 'Federal environmental protection.' },
                    { name: 'Indigenous Territories', type: 'secondary', description: 'Legally recognized tribal lands.' },
                    { name: 'Illegal Loggers/Miners', type: 'rebel', description: 'Criminal extraction networks.' },
                    { name: 'Sustainable Development Groups', type: 'trade_company', description: 'Eco-tourism and forest products.' }
                ]
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Amazon Bioeconomy Federation',
                dominantPowerDescription: 'A revolutionary governance model grants the Amazon legal personhood, with indigenous nations and AI systems co-managing the forest for carbon credits and biodiversity.',
                eraContextSentence: 'an era of forest sovereignty, where the Amazon itself becomes a political entity in the climate economy.',
                allegianceGroups: [
                    { name: 'Amazon Bioeconomy Federation', type: 'primary', description: 'Multi-national forest governance body.' },
                    { name: 'Indigenous Guardian Network', type: 'secondary', description: 'Traditional knowledge holders with drone technology.' },
                    { name: 'Carbon Credit Consortiums', type: 'trade_company', description: 'Global firms trading forest preservation.' },
                    { name: 'Illegal Extraction Mafias', type: 'rebel', description: 'Criminal networks resisting the new order.' }
                ],
                structureNames: {
                    fortress: ['Biodiversity Defense Station', 'Drone Monitoring Hub'],
                    factory: ['Biomaterial Laboratory', 'Pharmaceutical Research Center'],
                    trading_post: ['Carbon Credit Exchange', 'Ecotourism Gateway'],
                    holy_site: ['Forest Regeneration Center', 'Indigenous Knowledge Archive']
                }
            }
        },
        "Gran Chaco and Pampas": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Guaraní Peoples',
                dominantPowerDescription: 'Semi-nomadic peoples develop sophisticated agricultural systems in the forest-savanna mosaic, cultivating maize, manioc, and creating extensive trade networks.',
                eraContextSentence: 'an age of forest paths, where Guaraní knowledge shapes the landscape through controlled burns and gardens.',
                allegianceGroups: [
                    { name: 'Guaraní Confederations', type: 'primary', description: 'Dominant agricultural peoples.' },
                    { name: 'Guaycurú Warriors', type: 'secondary', description: 'Nomadic hunters of the Chaco.' },
                    { name: 'Charrúa Bands', type: 'secondary', description: 'Fierce warriors of the eastern plains.' },
                    { name: 'Querandí Hunters', type: 'secondary', description: 'Nomads of the pampas.' }
                ],
                structureNames: {
                    fortress: ['Palisaded Village', 'Hilltop Stronghold'],
                    mill: ['Maize Storage Pit', 'Manioc Processing Area'],
                    holy_site: ['Sacred Grove', 'Burial Ground'],
                    palace: ["Cacique's House"]
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Chaco-Pampean Confederations',
                dominantPowerDescription: 'Indigenous groups form shifting alliances, with some adopting horse culture from escaped Spanish horses, revolutionizing plains warfare and hunting.',
                eraContextSentence: 'the age of the great hunt, where indigenous mastery of horses transforms the plains.',
                allegianceGroups: [
                    { name: 'Abipón Confederation', type: 'primary', description: 'Powerful equestrian warriors.' },
                    { name: 'Mocoví Alliance', type: 'secondary', description: 'Skilled horsemen of the central Chaco.' },
                    { name: 'Tehuelche Bands', type: 'secondary', description: 'Nomads of the southern pampas.' },
                    { name: 'Diaguita Resistance', type: 'rebel', description: 'Mountain peoples resisting expansion.' }
                ],
                structureNames: {
                    fortress: ['Mobile War Camp', 'River Crossing Fort'],
                    mill: ['Hide Processing Camp', 'Seasonal Hunting Ground'],
                    holy_site: ['Sun Dance Ground', 'Vision Quest Site'],
                    palace: ["War Chief's Tent"]
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Spanish Colonial Frontier',
                dominantPowerDescription: 'Spanish colonization struggles against fierce indigenous resistance, establishing fortified towns and estancias while Jesuit missions attempt conversion.',
                eraContextSentence: 'an era of frontier warfare, where Spanish expansion meets determined indigenous resistance.',
                allegianceGroups: [
                    { name: 'Viceroyalty of Río de la Plata', type: 'primary', description: 'Spanish colonial administration.' },
                    { name: 'Jesuit Reductions', type: 'religious', description: 'Mission towns organizing Guaraní.' },
                    { name: 'Indigenous Confederations', type: 'rebel', description: 'United resistance movements.' },
                    { name: 'Portuguese Bandeirantes', type: 'mercenary', description: 'Slave raiders from Brazil.' }
                ],
                structureNames: {
                    fortress: ['Frontier Fort', 'Fortified Estancia'],
                    mill: ['Jesuit Workshop', 'Hide Processing Facility'],
                    holy_site: ['Reduction Church', 'Mission Complex'],
                    palace: ["Governor's House (Buenos Aires)"],
                    trading_post: ['Cattle Fair', 'River Port']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Argentine Republic',
                dominantPowerDescription: 'The pampas become the world\'s breadbasket as railroads, barbed wire, and European immigration transform the grasslands into agricultural powerhouse.',
                eraContextSentence: 'an era of wire and wheat, where the endless grasslands feed the world.',
                allegianceGroups: [
                    { name: 'Argentine Republic', type: 'primary', description: 'The federal government consolidating control.' },
                    { name: 'Estanciero Oligarchy', type: 'trade_company', description: 'Powerful landowners controlling vast estates.' },
                    { name: 'European Immigrants', type: 'secondary', description: 'Italian and Spanish settlers.' },
                    { name: 'Remaining Indigenous Groups', type: 'rebel', description: 'Final resistance in the Conquest of the Desert.' }
                ],
                structureNames: {
                    fortress: ['Army Fort', 'Railway Station Garrison'],
                    mill: ['Grain Elevator', 'Meat Salting Plant'],
                    factory: ['Frigorífico (Refrigerated Meatpacking)'],
                    trading_post: ['Railway Junction', 'Port Warehouse'],
                    palace: ["Estanciero Mansion"]
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Argentine Agro-Industrial Complex',
                dominantPowerDescription: 'Mechanized agriculture and cattle ranching dominate the pampas while the Gran Chaco faces deforestation for soy cultivation.',
                eraContextSentence: 'an era of soybeans and feedlots, where industrial agriculture reshapes ancient landscapes.',
                allegianceGroups: [
                    { name: 'Argentine Federal Government', type: 'primary', description: 'National authorities balancing interests.' },
                    { name: 'Agribusiness Multinationals', type: 'trade_company', description: 'Monsanto, Cargill, and other giants.' },
                    { name: 'Small Farmer Movements', type: 'rebel', description: 'Resisting agricultural concentration.' },
                    { name: 'Indigenous Land Rights Groups', type: 'rebel', description: 'Fighting for ancestral territories.' }
                ],
                structureNames: {
                    fortress: ['Border Patrol Station', 'Military Base'],
                    factory: ['Soy Processing Plant', 'Biofuel Refinery'],
                    mill: ['Grain Silo Complex', 'Feedlot'],
                    trading_post: ['Grain Export Terminal', 'Trucking Hub']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Mercosur Agricultural Federation',
                dominantPowerDescription: 'Climate change transforms the region into a crucial food security zone, with vertical farms and lab-grown meat facilities supplementing traditional agriculture.',
                eraContextSentence: 'an era of climate adaptation, where the pampas become humanity\'s emergency granary.',
                allegianceGroups: [
                    { name: 'Mercosur Agricultural Federation', type: 'primary', description: 'Regional food security alliance.' },
                    { name: 'Climate Refugee Settlements', type: 'secondary', description: 'Displaced populations from flooded coasts.' },
                    { name: 'Cellular Agriculture Corps', type: 'trade_company', description: 'Lab-grown meat consortiums.' },
                    { name: 'Traditional Farming Alliance', type: 'rebel', description: 'Defenders of conventional agriculture.' }
                ],
                structureNames: {
                    fortress: ['Climate Monitoring Station', 'Food Security Center'],
                    factory: ['Vertical Farm Tower', 'Cultured Meat Facility'],
                    mill: ['Drought-Resistant Crop Center', 'Water Recycling Plant'],
                    trading_post: ['Continental Food Exchange', 'Climate Haven Port']
                }
            }
        },
        "Atlantic Coast": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Sambaqui Builders',
                dominantPowerDescription: 'Coastal peoples construct massive shell mounds along the Atlantic, developing rich maritime cultures based on fishing and shellfish gathering.',
                eraContextSentence: 'an age of shell mountains, where coastal peoples build monumental mounds from the sea\'s bounty.',
                allegianceGroups: [
                    { name: 'Sambaqui Cultures', type: 'primary', description: 'The shell mound builders.' },
                    { name: 'Tupi Peoples', type: 'secondary', description: 'Expanding agricultural groups.' },
                    { name: 'Gê Speakers', type: 'secondary', description: 'Interior peoples trading with coast.' },
                    { name: 'Coastal Traders', type: 'trade_company', description: 'Long-distance canoe networks.' }
                ],
                structureNames: {
                    fortress: ['Shell Mound Fort', 'Coastal Palisade'],
                    mill: ['Fish Drying Rack', 'Manioc Garden'],
                    holy_site: ['Burial Mound', 'Sacred Shell Ring'],
                    palace: ["Chief's Platform House"]
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Tupinambá Confederations',
                dominantPowerDescription: 'Powerful Tupi-speaking peoples dominate the coast with large villages, sophisticated canoes, and complex alliance networks.',
                eraContextSentence: 'the age of great villages, where Tupinambá warriors control the coastal forests.',
                allegianceGroups: [
                    { name: 'Tupinambá Alliance', type: 'primary', description: 'The dominant coastal confederation.' },
                    { name: 'Tupinikin Peoples', type: 'secondary', description: 'Related groups to the south.' },
                    { name: 'Aimoré Warriors', type: 'rebel', description: 'Fierce Gê-speaking raiders.' },
                    { name: 'Tamoio Confederation', type: 'secondary', description: 'Southern Tupi alliance.' }
                ],
                structureNames: {
                    fortress: ['Palisaded Village', 'War Canoe Base'],
                    mill: ['Manioc Processing House', 'Fish Weir'],
                    holy_site: ['Ritual Plaza', 'Ancestor House'],
                    palace: ["Morubixaba's Longhouse"]
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Portuguese Brazil',
                dominantPowerDescription: 'Sugar plantations and slave labor transform the coast as Portugal establishes Brazil as its most profitable colony.',
                eraContextSentence: 'an era of sugar and slavery, where African labor creates vast wealth for Portuguese colonizers.',
                allegianceGroups: [
                    { name: 'Portuguese Crown', type: 'primary', description: 'Colonial administration from Salvador and Rio.' },
                    { name: 'Sugar Planters', type: 'trade_company', description: 'Powerful landholding elite.' },
                    { name: 'Dutch Brazil (1630-1654)', type: 'secondary', description: 'Brief Dutch control of the northeast.' },
                    { name: 'Quilombo Communities', type: 'rebel', description: 'Escaped slave settlements.' }
                ],
                structureNames: {
                    fortress: ['Coastal Fort', 'Fortified City'],
                    mill: ['Sugar Engenho', 'Casa Grande (Big House)'],
                    holy_site: ['Baroque Church', 'Jesuit College'],
                    palace: ["Governor's Palace"],
                    trading_post: ['Slave Port', 'Sugar Warehouse']
                },
                mapAreaOverrides: {
                    "Bahia Coast": {
                        dominantPower: 'Salvador Captaincy',
                        dominantPowerDescription: 'The first capital of Brazil and center of the sugar economy, with the largest slave population in the Americas.',
                        allegianceGroups: [
                            { name: 'Portuguese Crown', type: 'primary', description: 'Seat of colonial government.' },
                            { name: 'Sugar Barons', type: 'trade_company', description: 'Owners of massive plantations.' },
                            { name: 'Candomblé Practitioners', type: 'religious', description: 'African religious communities.' },
                            { name: 'Palmares Quilombo', type: 'rebel', description: 'The largest escaped slave kingdom.' }
                        ]
                    },
                    "Rio de Janeiro Bay": {
                        dominantPower: 'Portuguese Viceroyalty',
                        dominantPowerDescription: 'Strategic port controlling access to gold regions, becoming the colonial capital in 1763.',
                        allegianceGroups: [
                            { name: 'Portuguese Viceroy', type: 'primary', description: 'Colonial government seat.' },
                            { name: 'Gold Merchants', type: 'trade_company', description: 'Traders controlling mineral wealth.' },
                            { name: 'French Corsairs', type: 'mercenary', description: 'Pirates threatening the coast.' }
                        ]
                    }
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Empire of Brazil',
                dominantPowerDescription: 'Independent Brazil under Emperor Pedro II modernizes with railroads and coffee plantations while maintaining slavery until 1888.',
                eraContextSentence: 'an era of coffee and contradiction, where a modernizing empire clings to slave labor.',
                allegianceGroups: [
                    { name: 'Brazilian Empire', type: 'primary', description: 'The imperial government.' },
                    { name: 'Coffee Barons', type: 'trade_company', description: 'New economic elite of São Paulo.' },
                    { name: 'Abolitionist Movement', type: 'rebel', description: 'Groups fighting to end slavery.' },
                    { name: 'British Empire', type: 'secondary', description: 'Pressuring for end of slave trade.' }
                ],
                structureNames: {
                    fortress: ['Imperial Fort', 'Naval Base'],
                    mill: ['Coffee Fazenda', 'Cotton Mill'],
                    factory: ['Textile Factory', 'Railway Workshop'],
                    trading_post: ['Coffee Port', 'Railway Terminal'],
                    palace: ["Imperial Palace (Petrópolis)"]
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Federal Republic of Brazil',
                dominantPowerDescription: 'Rapid industrialization transforms the coast into urban megacities while favelas grow alongside gleaming business districts.',
                eraContextSentence: 'an era of concrete and contradiction, where wealth and poverty exist side by side in sprawling megacities.',
                allegianceGroups: [
                    { name: 'Brazilian Federal Government', type: 'primary', description: 'Democratic government after military rule.' },
                    { name: 'Industrial Oligarchy', type: 'trade_company', description: 'Powerful business conglomerates.' },
                    { name: 'Favela Drug Traffickers', type: 'rebel', description: 'Criminal organizations controlling slums.' },
                    { name: 'Workers Party (PT)', type: 'secondary', description: 'Political movement for social reform.' }
                ],
                structureNames: {
                    fortress: ['Military Police Base', 'BOPE Headquarters'],
                    factory: ['Automobile Plant', 'Petrochemical Complex'],
                    trading_post: ['Container Port', 'International Airport'],
                    palace: ["Presidential Palace (Brasília)"]
                }
            },
            "1960s": {
                dominantPower: 'Brazilian Military Dictatorship',
                dominantPowerDescription: 'Military coup establishes authoritarian rule, pursuing rapid industrialization through foreign debt while suppressing opposition.',
                eraContextSentence: 'an era of generals and growth, where economic miracle comes at the cost of freedom.',
                allegianceGroups: [
                    { name: 'Military Government', type: 'primary', description: 'Authoritarian regime.' },
                    { name: 'US Government', type: 'secondary', description: 'Cold War ally supporting regime.' },
                    { name: 'Student Movement', type: 'rebel', description: 'Underground resistance.' },
                    { name: 'Multinational Corporations', type: 'trade_company', description: 'Foreign investment in industry.' }
                ]
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Brazilian Coastal Resilience Union',
                dominantPowerDescription: 'Rising sea levels force massive adaptation as Brazil leads global efforts in floating cities and coastal protection while managing climate refugees.',
                eraContextSentence: 'an era of rising tides, where Brazilian innovation creates floating megacities.',
                allegianceGroups: [
                    { name: 'Coastal Resilience Government', type: 'primary', description: 'Emergency adaptation authority.' },
                    { name: 'Floating City Corporations', type: 'trade_company', description: 'Dutch-Brazilian marine engineering firms.' },
                    { name: 'Climate Refugee Councils', type: 'secondary', description: 'Displaced populations from submerged areas.' },
                    { name: 'Terra Firma Movement', type: 'rebel', description: 'Groups refusing to abandon coastal lands.' }
                ],
                structureNames: {
                    fortress: ['Hurricane Defense Platform', 'Flood Control Center'],
                    factory: ['Desalination Plant', 'Floating Solar Farm'],
                    trading_post: ['Amphibious Port', 'Submarine Cargo Terminal'],
                    palace: ["Floating Government Complex"]
                }
            }
        },
        "Guiana Shield": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Arawak Networks',
                dominantPowerDescription: 'Sophisticated riverine societies develop extensive trade networks linking the Caribbean, Andes, and Amazon through the Guiana highlands.',
                eraContextSentence: 'an age of river highways, where Arawak traders connect distant worlds through ancient waterways.',
                allegianceGroups: [
                    { name: 'Lokono (Arawak) Traders', type: 'primary', description: 'Master traders and diplomats.' },
                    { name: 'Carib Warriors', type: 'secondary', description: 'Fierce competitors for territory.' },
                    { name: 'Warao Fishers', type: 'secondary', description: 'Delta specialists.' },
                    { name: 'Highland Peoples', type: 'secondary', description: 'Mountain dwelling groups.' }
                ],
                structureNames: {
                    fortress: ['River Confluence Fort', 'Highland Refuge'],
                    mill: ['Cassava Processing Center', 'Gold Panning Site'],
                    holy_site: ['Petroglyph Site', 'Sacred Waterfall'],
                    palace: ["Cacique's River House"]
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Guiana Highland Confederations',
                dominantPowerDescription: 'Independent peoples maintain autonomy in the difficult terrain while developing unique cultures in isolation from major empires.',
                eraContextSentence: 'the age of hidden kingdoms, where the Guiana Shield protects diverse peoples from outside conquest.',
                allegianceGroups: [
                    { name: 'Makushi Federation', type: 'primary', description: 'Savanna dwelling confederation.' },
                    { name: 'Wapishana Alliance', type: 'secondary', description: 'Southern highland groups.' },
                    { name: 'Patamona Peoples', type: 'secondary', description: 'Mountain specialists.' },
                    { name: 'Coastal Traders', type: 'trade_company', description: 'Links to Caribbean networks.' }
                ],
                structureNames: {
                    fortress: ['Mountain Stronghold', 'River Rapids Defense'],
                    mill: ['Bitter Manioc Garden', 'Fish Trap Complex'],
                    holy_site: ['Mountain Oracle', 'Ancestor Cave'],
                    palace: ["Chief's Ceremonial House"]
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Dutch Guiana',
                dominantPowerDescription: 'Dutch colonizers establish plantation colonies on the coast while the interior remains largely independent, creating a stark divide.',
                eraContextSentence: 'an era of coastal slavery, where Dutch plantations contrast with free interior nations.',
                allegianceGroups: [
                    { name: 'Dutch West India Company', type: 'primary', description: 'Colonial plantation administration.' },
                    { name: 'British Guiana', type: 'secondary', description: 'Rival colonial power.' },
                    { name: 'Maroon Republics', type: 'rebel', description: 'Escaped slave communities in the interior.' },
                    { name: 'Indigenous Interior', type: 'rebel', description: 'Unconquered native peoples.' }
                ],
                structureNames: {
                    fortress: ['Coastal Fort', 'Plantation Defense'],
                    mill: ['Sugar Plantation', 'Coffee Estate'],
                    holy_site: ['Reformed Church', 'Maroon Shrine'],
                    palace: ["Governor's Mansion (Paramaribo)"],
                    trading_post: ['River Trading Post', 'Slave Depot']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Colonial Exploitation Regimes',
                dominantPowerDescription: 'British, Dutch, and French colonies extract gold, bauxite, and timber while importing indentured laborers from India and Java.',
                eraContextSentence: 'an era of mineral rush, where colonial powers strip the Shield of its resources.',
                allegianceGroups: [
                    { name: 'British Colonial Office', type: 'primary', description: 'Administering British Guiana.' },
                    { name: 'Dutch Suriname', type: 'secondary', description: 'Neighboring Dutch colony.' },
                    { name: 'French Guiana', type: 'secondary', description: 'Penal colony and territory.' },
                    { name: 'Indentured Labor Movements', type: 'rebel', description: 'Indian and Javanese workers organizing.' }
                ],
                structureNames: {
                    fortress: ['Colonial Barracks', 'Penal Colony (Devil\'s Island)'],
                    mill: ['Rice Mill', 'Timber Camp'],
                    mining_colony: ['Gold Mine', 'Bauxite Quarry'],
                    factory: ['Sugar Refinery'],
                    trading_post: ['Colonial Port', 'Railway Depot']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Independent Guianas',
                dominantPowerDescription: 'Guyana and Suriname gain independence while French Guiana remains an overseas department, all struggling with ethnic divisions and resource exploitation.',
                eraContextSentence: 'an era of fragile independence, where new nations grapple with colonial legacies and ethnic tensions.',
                allegianceGroups: [
                    { name: 'Republic of Guyana', type: 'primary', description: 'Independent nation since 1966.' },
                    { name: 'Republic of Suriname', type: 'primary', description: 'Independent nation since 1975.' },
                    { name: 'French Republic', type: 'primary', description: 'Maintaining French Guiana as territory.' },
                    { name: 'Amerindian Rights Groups', type: 'rebel', description: 'Indigenous peoples seeking autonomy.' }
                ],
                structureNames: {
                    fortress: ['Army Base', 'Border Post'],
                    factory: ['Bauxite Processing Plant', 'Timber Mill'],
                    mining_colony: ['Gold Mining Camp', 'Oil Drilling Site'],
                    trading_post: ['International Airport', 'Deep Water Port']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Guiana Space Consortium',
                dominantPowerDescription: 'The European spaceport at Kourou expands into a major launch hub while the Shield\'s minerals become crucial for space industry.',
                eraContextSentence: 'an era of rockets and rare earths, where the ancient Shield launches humanity to the stars.',
                allegianceGroups: [
                    { name: 'Guiana Space Consortium', type: 'primary', description: 'Multi-national space launch authority.' },
                    { name: 'Amerindian Sovereign Zones', type: 'secondary', description: 'Autonomous indigenous territories with resource rights.' },
                    { name: 'Chinese Mining Consortium', type: 'trade_company', description: 'Extracting rare earth elements.' },
                    { name: 'Eco-Warrior Collectives', type: 'rebel', description: 'Sabotaging extraction operations.' }
                ],
                structureNames: {
                    fortress: ['Space Defense Center', 'Orbital Tracking Station'],
                    factory: ['Rocket Assembly Facility', 'Satellite Manufacturing'],
                    mining_colony: ['Rare Earth Mine', 'Helium-3 Processing'],
                    trading_post: ['Spaceport Complex', 'Electromagnetic Launch Rail']
                }
            }
        },
        "Patagonia": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Tehuelche Nations',
                dominantPowerDescription: 'Nomadic hunters master the harsh steppes, following guanaco herds and developing rich oral traditions in the land of winds.',
                eraContextSentence: 'an age of endless horizons, where Tehuelche bands follow ancient paths across windswept plains.',
                allegianceGroups: [
                    { name: 'Northern Tehuelche', type: 'primary', description: 'Günün-a-küna peoples of the northern steppes.' },
                    { name: 'Southern Tehuelche', type: 'secondary', description: 'Aónik\'enk peoples near the straits.' },
                    { name: 'Selk\'nam Hunters', type: 'secondary', description: 'Ona peoples of Tierra del Fuego.' },
                    { name: 'Kawésqar Canoeists', type: 'secondary', description: 'Sea nomads of the channels.' }
                ],
                structureNames: {
                    fortress: ['Wind Break Camp', 'Coastal Refuge'],
                    mill: ['Hide Scraping Site', 'Tool Making Camp'],
                    holy_site: ['Painted Cave', 'Ceremonial Ground'],
                    palace: ["Elder's Shelter"]
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Mapuche Expansion',
                dominantPowerDescription: 'Mapuche peoples expand southward, bringing new technologies and political organization to northern Patagonia.',
                eraContextSentence: 'the age of southern migration, where Mapuche influence transforms Patagonian societies.',
                allegianceGroups: [
                    { name: 'Mapuche Confederations', type: 'primary', description: 'Expanding from the north.' },
                    { name: 'Tehuelche Alliances', type: 'secondary', description: 'Adapting to new pressures.' },
                    { name: 'Puelche Groups', type: 'secondary', description: 'Intermediary peoples.' },
                    { name: 'Fuegian Peoples', type: 'secondary', description: 'Isolated southern groups.' }
                ],
                structureNames: {
                    fortress: ['Strategic Camp', 'Mountain Pass Control'],
                    mill: ['Silver Working Site', 'Weaving Workshop'],
                    holy_site: ['Rewe (Sacred Tree)', 'Mountain Shrine'],
                    palace: ["Lonko's Tent"]
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Spanish Colonial Claims',
                dominantPowerDescription: 'Spain claims Patagonia but exercises minimal control, while indigenous peoples acquire horses and transform their societies.',
                eraContextSentence: 'an era of phantom empire, where Spanish claims exist on maps while indigenous peoples rule the land.',
                allegianceGroups: [
                    { name: 'Spanish Crown', type: 'primary', description: 'Theoretical sovereignty from distant Buenos Aires.' },
                    { name: 'Tehuelche Horse Lords', type: 'rebel', description: 'Masters of mounted warfare.' },
                    { name: 'Welsh Colonists', type: 'secondary', description: 'Peaceful settlers in Chubut valley.' },
                    { name: 'Maritime Explorers', type: 'mercenary', description: 'Various European expeditions.' }
                ],
                structureNames: {
                    fortress: ['Coastal Outpost', 'Failed Colony Ruins'],
                    mill: ['Guanaco Processing Camp', 'Salt Collection Site'],
                    holy_site: ['Mission Ruins', 'Indigenous Sacred Site'],
                    palace: ["Cacique's Mobile Court"]
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Argentine-Chilean Conquest',
                dominantPowerDescription: 'The Conquest of the Desert exterminates indigenous peoples as sheep ranching transforms Patagonia into wool-producing latifundias.',
                eraContextSentence: 'an era of wool and wire, where sheep replace guanacos and fences divide the endless plains.',
                allegianceGroups: [
                    { name: 'Argentine Republic', type: 'primary', description: 'Military conquest and settlement.' },
                    { name: 'Republic of Chile', type: 'secondary', description: 'Competing territorial claims.' },
                    { name: 'British Sheep Companies', type: 'trade_company', description: 'Massive wool-producing estates.' },
                    { name: 'Surviving Indigenous', type: 'rebel', description: 'Remnant groups in remote areas.' }
                ],
                structureNames: {
                    fortress: ['Military Fort', 'Border Garrison'],
                    mill: ['Sheep Shearing Shed', 'Wool Warehouse'],
                    factory: ['Meat Freezing Plant'],
                    trading_post: ['Port Warehouse', 'Railway Station'],
                    palace: ["Estancia Manor House"]
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Argentine-Chilean States',
                dominantPowerDescription: 'Oil, gas, and tourism drive development while environmental movements seek to protect pristine wilderness areas.',
                eraContextSentence: 'an era of oil and eco-tourism, where extraction competes with conservation.',
                allegianceGroups: [
                    { name: 'Argentine Federal State', type: 'primary', description: 'National government authority.' },
                    { name: 'Chilean State', type: 'primary', description: 'National government authority.' },
                    { name: 'Oil Companies', type: 'trade_company', description: 'Repsol, YPF, and international firms.' },
                    { name: 'Environmental NGOs', type: 'secondary', description: 'Conservation organizations.' }
                ],
                structureNames: {
                    fortress: ['Naval Base', 'Air Force Base'],
                    factory: ['Oil Refinery', 'Fish Processing Plant'],
                    mining_colony: ['Oil Field', 'Coal Mine'],
                    trading_post: ['Tourist Lodge', 'Cruise Ship Port']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Patagonian Wind Republic',
                dominantPowerDescription: 'The world\'s windiest region becomes a renewable energy superpower, exporting hydrogen and hosting climate refugees from flooded Buenos Aires.',
                eraContextSentence: 'an era of wind harvest, where Patagonia\'s curse becomes its greatest blessing.',
                allegianceGroups: [
                    { name: 'Patagonian Wind Republic', type: 'primary', description: 'Autonomous energy-exporting state.' },
                    { name: 'Climate Haven Cities', type: 'secondary', description: 'New settlements for coastal refugees.' },
                    { name: 'Green Hydrogen Consortium', type: 'trade_company', description: 'International renewable energy firms.' },
                    { name: 'Rewilding Movement', type: 'rebel', description: 'Restoring extinct megafauna.' }
                ],
                structureNames: {
                    fortress: ['Weather Control Station', 'Climate Defense Center'],
                    factory: ['Hydrogen Electrolysis Plant', 'Wind Turbine Gigafactory'],
                    trading_post: ['Hydrogen Export Terminal', 'Maglev Train Station'],
                    holy_site: ['Glacier Memorial', 'Megafauna Reserve']
                }
            }
        },
        "Southern Highlands": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Early Altiplano Cultures',
                dominantPowerDescription: 'Proto-Tiwanaku societies develop high-altitude agriculture and ceremonial centers around Lake Titicaca and the southern highlands.',
                eraContextSentence: 'an age of mountain mastery, where early peoples unlock the secrets of high-altitude survival.',
                allegianceGroups: [
                    { name: 'Chiripa Culture', type: 'primary', description: 'Early ceremonial center builders.' },
                    { name: 'Wankarani Culture', type: 'secondary', description: 'Highland herders and farmers.' },
                    { name: 'Coastal Traders', type: 'trade_company', description: 'Links to Pacific societies.' },
                    { name: 'Eastern Slope Peoples', type: 'secondary', description: 'Yungas forest dwellers.' }
                ],
                structureNames: {
                    fortress: ['Hilltop Pukara', 'Stone Wall Complex'],
                    mill: ['Quinoa Storage', 'Llama Corral'],
                    holy_site: ['Sunken Temple', 'Mountain Shrine'],
                    palace: ["Elite Stone House"]
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Aymara Kingdoms',
                dominantPowerDescription: 'Powerful Aymara-speaking kingdoms control the Altiplano after Tiwanaku\'s fall, resisting Inca expansion with fierce independence.',
                eraContextSentence: 'the age of warrior kingdoms, where Aymara lords defend mountain strongholds against imperial ambitions.',
                allegianceGroups: [
                    { name: 'Colla Kingdom', type: 'primary', description: 'Most powerful Aymara state.' },
                    { name: 'Lupaca Kingdom', type: 'secondary', description: 'Rich kingdom controlling trade.' },
                    { name: 'Pacajes Confederation', type: 'secondary', description: 'Alliance of smaller kingdoms.' },
                    { name: 'Inca Empire', type: 'secondary', description: 'Expanding threat from the north.' }
                ],
                structureNames: {
                    fortress: ['Chullpa Tower Fort', 'Mountain Citadel'],
                    mill: ['Freeze-Drying Station', 'Potato Storage'],
                    holy_site: ['Chullpa Burial Tower', 'Sacred Mountain'],
                    palace: ["Mallku's Stone Palace"]
                },
                mapAreaOverrides: {
                    "Potosí Region": {
                        dominantPower: 'Qaraqara-Charka Federation',
                        dominantPowerDescription: 'Confederation controlling rich mineral deposits that would later become the world\'s largest silver source.',
                        allegianceGroups: [
                            { name: 'Qaraqara Lords', type: 'primary', description: 'Northern confederation leaders.' },
                            { name: 'Charka Lords', type: 'secondary', description: 'Southern confederation partners.' },
                            { name: 'Chicha Warriors', type: 'secondary', description: 'Valley dwelling allies.' }
                        ]
                    }
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Spanish Silver Empire',
                dominantPowerDescription: 'Potosí becomes the world\'s largest source of silver, funding the Spanish Empire while killing millions of indigenous workers in the mines.',
                eraContextSentence: 'an era of silver and death, where the Cerro Rico mountain devours lives to enrich distant kings.',
                allegianceGroups: [
                    { name: 'Spanish Crown', type: 'primary', description: 'Colonial administration centered on mining.' },
                    { name: 'Mit\'a Labor System', type: 'secondary', description: 'Forced indigenous labor.' },
                    { name: 'Azogueros (Mine Owners)', type: 'trade_company', description: 'Spanish and Creole elite.' },
                    { name: 'Indigenous Resistance', type: 'rebel', description: 'Communities resisting labor drafts.' }
                ],structureNames: {
                    fortress: ['Royal Fort', 'Casa de la Moneda (Mint)'],
                    mill: ['Amalgamation Mill', 'Coca Plantation'],
                    mining_colony: ['Silver Mine Shaft', 'Mercury Mine'],
                    holy_site: ['Cathedral', 'Indigenous Shrine'],
                    palace: ["Corregidor's Palace"]
                },
                mapAreaOverrides: {
                    "Potosí Region": {
                        dominantPower: 'Villa Imperial de Potosí',
                        dominantPowerDescription: 'The richest city in the world, built on indigenous suffering, where silver flows like water and life is cheap.',
                        allegianceGroups: [
                            { name: 'Spanish Royal Treasury', type: 'primary', description: 'Crown representatives extracting wealth.' },
                            { name: 'Silver Merchants', type: 'trade_company', description: 'Traders moving wealth to ports.' },
                            { name: 'Mit\'ayos', type: 'secondary', description: 'Forced indigenous laborers.' },
                            { name: 'Kajchas (Ore Thieves)', type: 'rebel', description: 'Night workers stealing ore.' }
                        ]
                    }
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Republic of Bolivia',
                dominantPowerDescription: 'Independent Bolivia loses its coast to Chile but remains dependent on mining, now tin rather than silver, with indigenous majorities ruled by creole minorities.',
                eraContextSentence: 'an era of tin barons, where new metals feed global industry while Bolivia shrinks.',
                allegianceGroups: [
                    { name: 'Bolivian Republic', type: 'primary', description: 'Weak central government.' },
                    { name: 'Tin Barons (Patiño, Aramayo, Hochschild)', type: 'trade_company', description: 'The mining oligarchy.' },
                    { name: 'Indigenous Communities', type: 'rebel', description: 'Majority population with minimal rights.' },
                    { name: 'Chile', type: 'secondary', description: 'Victorious neighbor controlling former coast.' }
                ],
                structureNames: {
                    fortress: ['Army Barracks', 'Border Fort'],
                    mill: ['Tin Smelter', 'Coca Market'],
                    mining_colony: ['Tin Mine', 'Wolfram Mine'],
                    factory: ['Ore Processing Plant'],
                    trading_post: ['Railway Junction', 'Mule Train Station']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Plurinational State of Bolivia',
                dominantPowerDescription: 'Indigenous movements reclaim power as Bolivia nationalizes resources and seeks to break centuries of exploitation while battling continued poverty.',
                eraContextSentence: 'an era of indigenous resurgence, where the colonized become the governors.',
                allegianceGroups: [
                    { name: 'MAS Government', type: 'primary', description: 'Indigenous-led socialist party.' },
                    { name: 'Eastern Oligarchy', type: 'rebel', description: 'Lowland elites resisting change.' },
                    { name: 'Coca Growers Unions', type: 'secondary', description: 'Powerful indigenous federations.' },
                    { name: 'International Mining Corps', type: 'trade_company', description: 'Foreign companies negotiating access.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Anti-Drug Police Station'],
                    factory: ['Lithium Pilot Plant', 'Textile Cooperative'],
                    mining_colony: ['Nationalized Mine', 'Lithium Evaporation Pond'],
                    trading_post: ['Indigenous Market', 'Border Crossing']
                }
            },
            "1950s": {
                dominantPower: 'Revolutionary Bolivia',
                dominantPowerDescription: 'The 1952 Revolution nationalizes mines, grants universal suffrage, and implements land reform, transforming Bolivian society.',
                eraContextSentence: 'an era of revolution, where miners\' dynamite breaks the chains of feudalism.',
                allegianceGroups: [
                    { name: 'MNR Revolutionary Government', type: 'primary', description: 'National revolutionary party.' },
                    { name: 'COB (Miners\' Union)', type: 'secondary', description: 'Armed workers controlling mines.' },
                    { name: 'Peasant Militias', type: 'secondary', description: 'Indigenous farmers seizing land.' },
                    { name: 'Rosca (Mining Oligarchy)', type: 'rebel', description: 'Former elites plotting return.' }
                ]
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Andean Lithium Federation',
                dominantPowerDescription: 'Bolivia leads a resource federation controlling critical battery minerals, finally achieving the ocean access denied for centuries through economic leverage.',
                eraContextSentence: 'an era of white gold, where lithium transforms landlocked Bolivia into an energy superpower.',
                allegianceGroups: [
                    { name: 'Andean Lithium Federation', type: 'primary', description: 'Bolivia-led mineral cartel.' },
                    { name: 'Uyuni Preservation Movement', type: 'rebel', description: 'Protecting sacred salt flats.' },
                    { name: 'Chinese State Companies', type: 'trade_company', description: 'Primary technology partners.' },
                    { name: 'Pacific Access Alliance', type: 'secondary', description: 'Chile-Bolivia cooperation treaty.' }
                ],
                structureNames: {
                    fortress: ['Resource Protection Force', 'Cyber Defense Center'],
                    factory: ['Battery Component Factory', 'Quinoa Vertical Farm'],
                    mining_colony: ['Smart Lithium Extraction', 'Rare Earth Processing'],
                    trading_post: ['Bioceanic Railway Hub', 'Digital Mineral Exchange']
                }
            }
        },
        "Llanos and Orinoco": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Orinoco River Cultures',
                dominantPowerDescription: 'River-adapted societies thrive in the seasonal flood plains, developing sophisticated aquatic resource management and ceremonial complexes.',
                eraContextSentence: 'an age of water and grass, where river peoples follow the rhythm of floods and droughts.',
                allegianceGroups: [
                    { name: 'Achagua Chiefdoms', type: 'primary', description: 'Major riverine power.' },
                    { name: 'Guahibo Nomads', type: 'secondary', description: 'Plains hunters and gatherers.' },
                    { name: 'Otomaco Fishers', type: 'secondary', description: 'Specialists in river resources.' },
                    { name: 'Andean Traders', type: 'trade_company', description: 'Mountain goods exchange.' }
                ],
                structureNames: {
                    fortress: ['Raised Mound Village', 'River Bend Fort'],
                    mill: ['Fish Drying Platform', 'Turtle Farm'],
                    holy_site: ['Ceremonial Mound', 'Sacred Lagoon'],
                    palace: ["River Chief's House"]
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Llanos Confederations',
                dominantPowerDescription: 'Sophisticated societies manage the seasonal extremes through mobility, creating vast earthworks and maintaining long-distance trade.',
                eraContextSentence: 'the age of seasonal masters, where peoples dance between flood and drought.',
                allegianceGroups: [
                    { name: 'Casanare Alliance', type: 'primary', description: 'Major plains confederation.' },
                    { name: 'Meta River Peoples', type: 'secondary', description: 'Riverine specialists.' },
                    { name: 'Apure Horsemen', type: 'secondary', description: 'Early adopters of escaped horses.' },
                    { name: 'Caribbean Traders', type: 'trade_company', description: 'Coastal exchange networks.' }
                ],
                structureNames: {
                    fortress: ['Seasonal Fort', 'Gallery Forest Refuge'],
                    mill: ['Cassava Field', 'Deer Hunting Camp'],
                    holy_site: ['Solstice Ground', 'Shaman\'s Grove'],
                    palace: ["Seasonal Palace Complex"]
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Spanish Colonial Missions',
                dominantPowerDescription: 'Capuchin and Jesuit missions attempt to settle nomadic peoples while Spanish ranchers introduce cattle, transforming the ecosystem.',
                eraContextSentence: 'an era of crosses and cattle, where missions and ranches remake the plains.',
                allegianceGroups: [
                    { name: 'Spanish Colonial Authority', type: 'primary', description: 'Weak control from Bogotá.' },
                    { name: 'Mission Reductions', type: 'religious', description: 'Catholic settlements.' },
                    { name: 'Llanero Cowboys', type: 'secondary', description: 'Mixed-race plains riders.' },
                    { name: 'Resistant Tribes', type: 'rebel', description: 'Groups maintaining independence.' }
                ],
                structureNames: {
                    fortress: ['Mission Fort', 'Ranch Stockade'],
                    mill: ['Cattle Ranch', 'Hide Processing'],
                    holy_site: ['Mission Church', 'Indigenous Syncretism Site'],
                    palace: ["Hacendado's Manor"],
                    trading_post: ['Cattle Fair', 'River Port']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Venezuelan Republic',
                dominantPowerDescription: 'Independent Venezuela relies on llanero cavalry in its wars while establishing large cattle estates across the plains.',
                eraContextSentence: 'an era of lancers and liberty, where horsemen decide the fate of nations.',
                allegianceGroups: [
                    { name: 'Venezuelan Republic', type: 'primary', description: 'Central government from Caracas.' },
                    { name: 'Caudillo Warlords', type: 'secondary', description: 'Regional strongmen.' },
                    { name: 'Colombian Government', type: 'secondary', description: 'Disputed border control.' },
                    { name: 'Llanero Federations', type: 'mercenary', description: 'Plains cavalry for hire.' }
                ],
                structureNames: {
                    fortress: ['Cavalry Barracks', 'River Fort'],
                    mill: ['Large Cattle Estate', 'Cheese Factory'],
                    factory: ['Leather Works', 'Meat Salting Plant'],
                    trading_post: ['Cattle Market', 'River Steamer Port']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Venezuelan Oil State',
                dominantPowerDescription: 'Oil discoveries shift focus from agriculture as Venezuela becomes a petrostate, while Colombia develops the plains for ranching and oil.',
                eraContextSentence: 'an era of oil derricks, where black gold overshadows the green plains.',
                allegianceGroups: [
                    { name: 'Venezuelan Government', type: 'primary', description: 'Oil-funded central state.' },
                    { name: 'Colombian Government', type: 'primary', description: 'Developing eastern territories.' },
                    { name: 'FARC Guerrillas', type: 'rebel', description: 'Controlling remote areas.' },
                    { name: 'Oil Multinationals', type: 'trade_company', description: 'Extracting petroleum.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Pipeline Guard Post'],
                    factory: ['Oil Refinery', 'Petrochemical Plant'],
                    mining_colony: ['Oil Field', 'Heavy Crude Extraction'],
                    trading_post: ['Pipeline Terminal', 'Agroindustrial Complex']
                }
            },
            "2000s": {
                dominantPower: 'Bolivarian Venezuela',
                dominantPowerDescription: 'Hugo Chávez\'s oil-funded socialism transforms Venezuela while Colombian plains see conflict between government, paramilitaries, and guerrillas.',
                eraContextSentence: 'an era of revolution and conflict, where oil wealth funds dreams of transformation.',
                allegianceGroups: [
                    { name: 'Bolivarian Government', type: 'primary', description: 'Chávez\'s revolutionary state.' },
                    { name: 'Colombian Military', type: 'primary', description: 'Fighting multiple armed groups.' },
                    { name: 'Paramilitary Groups', type: 'mercenary', description: 'Right-wing death squads.' },
                    { name: 'Cuban Advisors', type: 'secondary', description: 'Supporting Venezuelan revolution.' }
                ]
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Orinoco Climate Refuge Zone',
                dominantPowerDescription: 'Climate refugees from Caribbean islands and coastal areas transform the Llanos into densely populated agricultural zones using Dutch water management technology.',
                eraContextSentence: 'an era of climate adaptation, where the flood plains become humanity\'s breadbasket.',
                allegianceGroups: [
                    { name: 'Orinoco Water Authority', type: 'primary', description: 'Multi-national flood management.' },
                    { name: 'Caribbean Refugee Councils', type: 'secondary', description: 'Displaced island populations.' },
                    { name: 'AgroTech Corporations', type: 'trade_company', description: 'High-tech farming consortiums.' },
                    { name: 'Traditional Rancher Alliance', type: 'rebel', description: 'Resisting land redistribution.' }
                ],
                structureNames: {
                    fortress: ['Flood Control Center', 'Climate Monitoring Station'],
                    factory: ['Protein Farm Complex', 'Aquaponics Facility'],
                    mill: ['Solar Desalination Plant', 'Bioengineered Crop Center'],
                    trading_post: ['Elevated Transport Hub', 'Drone Delivery Center']
                }
            }
        },
        "Amazon Delta": {
            [HistoricalEra.PREHISTORY]: {
                dominantPower: 'Marajoara Culture',
                dominantPowerDescription: 'Complex pre-Columbian society building mounds in the flooded delta.',
                eraContextSentence: 'the age of mound builders, where ancient peoples master the floods.',
                allegianceGroups: [
                    { name: 'Marajoara', type: 'primary', description: 'Mound-building culture.' },
                    { name: 'River Peoples', type: 'secondary', description: 'Fishing and trading communities.' }
                ],
                structureNames: {
                    holy_site: ['Burial Mound', 'Ceramic Workshop'],
                    trading_post: ['River Port', 'Canoe Landing']
                }
            },
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Tapajós Confederation',
                dominantPowerDescription: 'Advanced Amazonian civilization with large settlements and terra preta agriculture.',
                eraContextSentence: 'the hidden Amazon civilization, creating black earth and pottery.',
                allegianceGroups: [
                    { name: 'Tapajós', type: 'primary', description: 'Confederation of river cities.' },
                    { name: 'Coastal Traders', type: 'trade_company', description: 'Inter-regional merchants.' }
                ],
                structureNames: {
                    holy_site: ['Ceremonial Plaza', 'Shaman House'],
                    mill: ['Terra Preta Gardens', 'Pottery Kiln']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Portuguese Colonial Frontier',
                dominantPowerDescription: 'Early colonial outposts amid vast unconquered territories.',
                eraContextSentence: 'the conquistador era, where Europeans seek El Dorado in the green hell.',
                allegianceGroups: [
                    { name: 'Portuguese Brazil', type: 'primary', description: 'Colonial settlements.' },
                    { name: 'Jesuit Missions', type: 'religious_order', description: 'Converting natives.' },
                    { name: 'Indigenous Confederations', type: 'rebel', description: 'Resisting colonization.' },
                    { name: 'Dutch Invaders', type: 'secondary', description: 'Brief Dutch occupation.' }
                ],
                structureNames: {
                    fortress: ['Fort', 'Mission'],
                    trading_post: ['Trading Post', 'River Port'],
                    holy_site: ['Jesuit Church', 'Indigenous Maloca']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Rubber Boom Era',
                dominantPowerDescription: 'The Amazon becomes the world\'s rubber supplier, creating instant wealth and brutality.',
                eraContextSentence: 'the rubber boom, where latex is white gold and indigenous peoples are enslaved.',
                allegianceGroups: [
                    { name: 'Brazilian Empire/Republic', type: 'primary', description: 'National government.' },
                    { name: 'Rubber Barons', type: 'trade_company', description: 'Wealthy plantation owners.' },
                    { name: 'Indigenous Peoples', type: 'rebel', description: 'Enslaved and resisting.' },
                    { name: 'Foreign Companies', type: 'trade_company', description: 'American and European interests.' }
                ],
                structureNames: {
                    palace: ['Rubber Baron Mansion', 'Opera House'],
                    factory: ['Rubber Processing', 'Steamboat Dock'],
                    trading_post: ['Rubber Exchange', 'Company Store']
                }
            },
            [HistoricalEra.MODERN_ERA]: {
                dominantPower: 'Brazilian Federal Republic',
                dominantPowerDescription: 'Development versus conservation in Earth\'s lungs.',
                eraContextSentence: 'the climate crisis era, where the rainforest\'s fate determines Earth\'s future.',
                allegianceGroups: [
                    { name: 'Brazilian Government', type: 'primary', description: 'Federal and state authorities.' },
                    { name: 'Agribusiness', type: 'trade_company', description: 'Cattle and soy producers.' },
                    { name: 'Environmental NGOs', type: 'secondary', description: 'Conservation groups.' },
                    { name: 'Indigenous Rights Movement', type: 'rebel', description: 'Fighting for land rights.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Environmental Police'],
                    factory: ['Timber Mill', 'Soy Processing', 'Free Trade Zone'],
                    trading_post: ['River Port', 'Eco-Tourism Lodge']
                }
            }
        }
    }
};