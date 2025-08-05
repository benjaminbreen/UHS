/**
 * constants/gameData/factions/northAmericanPreColumbian.ts
 * Faction data for Pre-Columbian North American cultural zones.
 */
import { HistoricalEra } from '../../../types';
import { FactionFile } from './types';

const MODERN_ERA = 'MODERN_ERA';

export const NORTH_AMERICAN_PRE_COLUMBIAN_FACTIONS: FactionFile = {
    'NORTH_AMERICAN_PRE_COLUMBIAN': {
        "Pacific Coast": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Pacific Northwest Peoples',
                dominantPowerDescription: 'Complex hunter-gatherer societies with rich material cultures, elaborate ceremonies, and sophisticated resource management systems.',
                eraContextSentence: 'an age of salmon runs and cedar longhouses, where potlatch ceremonies display the wealth of coastal peoples.',
                allegianceGroups: [
                    { name: 'Pacific Northwest Peoples', type: 'primary', description: 'The dominant cultural group.'},
                    { name: 'Coastal Salish', type: 'secondary', description: 'A major language and cultural group along the coast.' },
                    { name: 'Haida Confederations', type: 'secondary', description: 'Powerful seafaring peoples of the northern coast.' }
                ],
                structureNames: {
                    fortress: ['Palisaded Village', 'Fortified Longhouse'],
                    holy_site: ['Ceremonial Longhouse', 'Totem Field'],
                    palace: ["Clan Chief's Longhouse"],
                },
                courtRoles: {
                    palace: ['Clan Elder', 'War Chief', 'Shaman', 'Master Carver']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Pacific Chiefdoms',
                dominantPowerDescription: 'Hierarchical societies with elaborate art traditions, controlling coastal resources and trade networks extending far inland.',
                eraContextSentence: 'an era of coastal prosperity, where hereditary chiefs command vast resources and artistic traditions flourish.',
                allegianceGroups: [
                    { name: 'Pacific Chiefdoms', type: 'primary', description: 'The dominant cultural group.'},
                    { name: 'Interior Trading Peoples', type: 'secondary', description: 'Tribal groups from inland areas who trade with the coast.' },
                    { name: 'Island Communities', type: 'secondary', description: 'Distinct communities on the coastal islands.' }
                ],
                structureNames: {
                    fortress: ['Fortified Longhouse', 'Palisaded Village'],
                    mill: ['Fish Weir', 'Smokehouse'],
                    holy_site: ['Potlatch House', 'Totem Field'],
                    palace: ["Hereditary Chief's Longhouse"],
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Native Coastal Peoples',
                dominantPowerDescription: 'Indigenous societies maintain their traditional ways while beginning to encounter European explorers and traders arriving by sea.',
                eraContextSentence: 'an era of first contact, where ancient traditions meet the arrival of distant strangers from across the ocean.',
                allegianceGroups: [
                    { name: 'Native Coastal Peoples', type: 'primary', description: 'The indigenous inhabitants.'},
                    { name: 'Spanish Explorers', type: 'secondary', description: 'Explorers mapping the coastline from the south.' },
                    { name: 'Russian Traders', type: 'secondary', description: 'Fur traders arriving from the north.' }
                ],
                structureNames: {
                    fortress: ['Fortified Village'],
                    mill: ['Fishing Station', 'Smokehouse'],
                    trading_post: ['Trading Cove', 'Barter Beach']
                }
            }
        },
        "Southwest": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Ancestral Puebloans',
                dominantPowerDescription: 'Advanced agricultural societies building impressive cliff dwellings and developing complex irrigation systems in the desert.',
                eraContextSentence: 'an age of cliff cities and corn cultivation, where desert peoples create oases of civilization.',
                allegianceGroups: [
                    { name: 'Ancestral Puebloans', type: 'primary', description: 'The dominant cultural group.'},
                    { name: 'Hohokam Culture', type: 'secondary', description: 'A neighboring culture known for irrigation.' },
                    { name: 'Mogollon Peoples', type: 'secondary', description: 'Peoples inhabiting the mountainous regions.' }
                ],
                structureNames: {
                    fortress: ['Cliff Dwelling', 'Great House'],
                    mill: ['Irrigation System', 'Corn Grinding Stone'],
                    holy_site: ['Great Kiva', 'Petroglyph Site'],
                    palace: ["Chacoan Great House"],
                },
                courtRoles: {
                    palace: ['Clan Elder', 'Sun Priest', 'War Captain', 'Keeper of the Corn']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Pueblo Peoples',
                dominantPowerDescription: 'Sophisticated agricultural communities with complex religious and social systems, living in permanent settlements and trading widely.',
                eraContextSentence: 'an era of pueblo communities, where settled peoples create elaborate ceremonies and trade networks.',
                allegianceGroups: [
                    { name: 'Pueblo Peoples', type: 'primary', description: 'The dominant cultural group.'},
                    { name: 'Apache Bands', type: 'secondary', description: 'Nomadic raiders and trading partners.' },
                    { name: 'Navajo Clans', type: 'secondary', description: 'Pastoral groups in the region.' }
                ],
                structureNames: {
                    fortress: ['Pueblo Complex', 'Mesa Top Village'],
                    mill: ['Corn Mill', 'Cotton Loom'],
                    holy_site: ['Kiva', 'Plaza'],
                    palace: ["Cacique's Dwelling"],
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Spanish Colonial Empire',
                dominantPowerDescription: 'Spanish conquistadors and missionaries establish colonial control, converting native peoples and extracting wealth for the crown.',
                eraContextSentence: 'an era of Spanish conquest, where missions and presidios extend imperial control into the northern frontier.',
                allegianceGroups: [
                    { name: 'Spanish Empire', type: 'primary', description: 'The colonial power of New Spain.'},
                    { name: 'Pueblo Peoples', type: 'rebel', description: 'Indigenous groups, sometimes in revolt.' },
                    { name: 'Apache Confederations', type: 'rebel', description: 'Powerful nomadic groups resisting Spanish control.' },
                    { name: 'Comanche Empire', type: 'secondary', description: 'An expanding power on the plains.' }
                ],
                structureNames: {
                    fortress: ['Presidio', 'Mission Compound'],
                    mill: ['Mission Mill', 'Hacienda Workshop'],
                    holy_site: ['Mission Church', 'Pueblo Kiva'],
                    palace: ["Governor's Palace (Santa Fe)"],
                }
            }
        },
        "Great Plains": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Plains Hunting Peoples',
                dominantPowerDescription: 'Mobile societies following bison herds on foot, developing sophisticated hunting techniques and seasonal migration patterns.',
                eraContextSentence: 'an age of the great hunt, where peoples follow the endless herds across the vast grasslands.',
                allegianceGroups: [
                    { name: 'Plains Hunting Peoples', type: 'primary', description: 'The dominant cultural group.'},
                    { name: 'Woodland Edge Peoples', type: 'secondary', description: 'Groups living on the edge of the plains and forests.' },
                    { name: 'Desert Margin Tribes', type: 'secondary', description: 'Tribes bordering the arid regions.' }
                ],
                structureNames: {
                    fortress: ['Seasonal Camp', 'Buffalo Jump Site'],
                    holy_site: ['Medicine Wheel', 'Sacred Butte']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Plains Village Peoples',
                dominantPowerDescription: 'Semi-sedentary societies combining agriculture with buffalo hunting, creating permanent villages along river valleys.',
                eraContextSentence: 'an era of earth lodges and corn hills, where peoples balance the hunt with the harvest.',
                allegianceGroups: [
                    { name: 'Plains Village Peoples', type: 'primary', description: 'The dominant cultural group.'},
                    { name: 'Nomadic Hunters', type: 'secondary', description: 'Mobile hunting bands.' },
                    { name: 'River Valley Farmers', type: 'secondary', description: 'Agricultural communities along rivers.' }
                ],
                structureNames: {
                    fortress: ['Fortified Village', 'Earth Lodge Settlement'],
                    mill: ['Corn Cache', 'Drying Rack'],
                    holy_site: ['Ceremonial Lodge']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Horse-Mounted Plains Tribes',
                dominantPowerDescription: 'The introduction of horses revolutionizes Plains culture, creating mobile warrior societies with unprecedented military power.',
                eraContextSentence: 'the age of the horse, where mounted warriors become masters of the Great Plains.',
                allegianceGroups: [
                    { name: 'Horse-Mounted Plains Tribes', type: 'primary', description: 'The dominant cultural group.'},
                    { name: 'Lakota Confederation', type: 'secondary', description: 'A powerful alliance of Siouan peoples.' },
                    { name: 'Comanche Empire', type: 'secondary', description: 'A dominant equestrian power to the south.' },
                    { name: 'Cheyenne Alliance', type: 'secondary', description: 'An alliance of Algonquian-speaking peoples.' }
                ],
                structureNames: {
                    fortress: ['War Camp', 'Winter Camp'],
                    mill: ['Trading Post', 'Buffalo Processing Camp'],
                    holy_site: ['Sun Dance Arbor']
                }
            }
        },
        "Mississippi Valley": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Adena-Hopewell Culture',
                dominantPowerDescription: 'Early mound-building cultures with extensive trade networks, elaborate burial practices, and sophisticated earthwork construction.',
                eraContextSentence: 'an age of the mound builders, where earthen monuments mark the centers of ancient civilizations.',
                allegianceGroups: [
                    { name: 'Adena-Hopewell Culture', type: 'primary', description: 'The dominant cultural group.'},
                    { name: 'Local Woodland Peoples', type: 'secondary', description: 'Neighboring tribal groups.' },
                    { name: 'River Trading Groups', type: 'secondary', description: 'Groups controlling trade along the rivers.' }
                ],
                structureNames: {
                    fortress: ['Mound Complex', 'Fortified Village'],
                    holy_site: ['Burial Mound', 'Ceremonial Earthwork']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Mississippian Culture',
                dominantPowerDescription: 'Complex chiefdoms centered around major settlements like Cahokia, with hierarchical societies and monumental architecture.',
                eraContextSentence: 'the age of great towns, where the Mississippian peoples build the largest cities north of Mexico.',
                allegianceGroups: [
                    { name: 'Mississippian Culture', type: 'primary', description: 'The dominant cultural group.'},
                    { name: 'Cahokia Chiefdom', type: 'secondary', description: 'The largest and most influential polity.' },
                    { name: 'Moundville Polity', type: 'secondary', description: 'A major ceremonial center to the south.' },
                    { name: 'Spiro Culture', type: 'secondary', description: 'A major center to the west.' }
                ],
                structureNames: {
                    fortress: ['Palisaded Town', 'Temple Mound Complex'],
                    mill: ['Corn Storage', 'Shell Bead Workshop'],
                    holy_site: ["Chief's Burial Mound", 'Plaza'],
                    palace: ["Great Chief's House"],
                },
                courtRoles: {
                    palace: ['Sun Chief', 'War Chief', 'Priest', 'Clan Elder']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Post-Mississippian Peoples',
                dominantPowerDescription: 'Descendants of the Mississippian culture adapt to changing conditions, with some groups encountering early European explorers.',
                eraContextSentence: 'an era of transition, where ancient mound centers give way to new confederations.',
                allegianceGroups: [
                    { name: 'Post-Mississippian Peoples', type: 'primary', description: 'Descendants of the mound builders.' },
                    { name: 'Spanish Explorers', type: 'secondary', description: 'De Soto expedition and successors.' },
                    { name: 'French Traders', type: 'secondary', description: 'Early French explorers and fur traders.' },
                    { name: 'Natchez Nation', type: 'secondary', description: 'Last of the great mound-building societies.' }
                ],
                structureNames: {
                    fortress: ['Fortified Village', 'River Stronghold'],
                    mill: ['Corn Field', 'Hide Processing'],
                    holy_site: ['Temple Mound', 'Sacred Fire'],
                    trading_post: ['River Landing', 'Trade Path Junction']
                }
            }
        },
        "Northeast Woodlands": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Woodland Peoples',
                dominantPowerDescription: 'Diverse hunting and gathering societies with seasonal settlements, developing early agricultural practices and complex trade networks.',
                eraContextSentence: 'an age of forest peoples, where hunting, gathering, and early farming sustain diverse communities.',
                allegianceGroups: [
                    { name: 'Woodland Peoples', type: 'primary', description: 'The dominant cultural group.'},
                    { name: 'Coastal Peoples', type: 'secondary', description: 'Groups specializing in marine resources.' },
                    { name: 'Interior Forest Tribes', type: 'secondary', description: 'Tribes living deep within the woodlands.' }
                ],
                structureNames: {
                    fortress: ['Fortified Camp', 'Palisaded Village'],
                    holy_site: ['Burial Mound', 'Sacred Rock']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Iroquoian Peoples',
                dominantPowerDescription: 'Agricultural societies with permanent villages, developing the Three Sisters agriculture and complex political confederations.',
                eraContextSentence: 'an era of longhouses and confederations, where Iroquoian peoples create powerful political alliances.',
                allegianceGroups: [
                    { name: 'Iroquoian Peoples', type: 'primary', description: 'The dominant cultural group.'},
                    { name: 'Algonquian Tribes', type: 'secondary', description: 'Neighboring groups of the Algonquian language family.' },
                    { name: 'Coastal Confederations', type: 'secondary', description: 'Alliances of coastal peoples.' }
                ],
                structureNames: {
                    fortress: ['Palisaded Village', 'Longhouse Settlement'],
                    mill: ['Three Sisters Garden', 'Drying Rack'],
                    holy_site: ['Council House', 'Ceremonial Longhouse']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Iroquois Confederacy',
                dominantPowerDescription: 'The powerful Six Nations confederation controls much of the region through diplomatic skill and military power, playing European powers against each other.',
                eraContextSentence: 'the age of the Great League of Peace, where Iroquois diplomacy shapes the balance of power.',
                allegianceGroups: [
                    { name: 'Iroquois Confederacy', type: 'primary', description: 'The powerful Haudenosaunee league.'},
                    { name: 'British Empire', type: 'secondary', description: 'A colonial power seeking alliances and land.' },
                    { name: 'French Empire', type: 'secondary', description: 'A rival colonial power focused on the fur trade.' },
                    { name: 'Algonquian Confederations', type: 'rebel', description: 'Traditional rivals of the Iroquois, often allied with the French.' }
                ],
                structureNames: {
                    fortress: ['Council House', 'Fortified Longhouse Village'],
                    mill: ['Trading House', 'Corn Pounder'],
                    holy_site: ['Great Council Fire'],
                    palace: ["Sachem's Longhouse"],
                },
                courtRoles: {
                    palace: ['Sachem', 'War Chief', 'Faithkeeper', 'Clan Mother']
                }
            }
        },
        "Southeast": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Woodland Period Peoples',
                dominantPowerDescription: 'Early agricultural societies developing pottery, building burial mounds, and establishing long-distance trade networks.',
                eraContextSentence: 'an age of early farmers, where woodland peoples begin transforming the landscape with mounds and gardens.',
                allegianceGroups: [
                    { name: 'Woodland Period Peoples', type: 'primary', description: 'Early agricultural societies.' },
                    { name: 'Swift Creek Culture', type: 'secondary', description: 'Peoples known for distinctive pottery.' },
                    { name: 'Weeden Island Culture', type: 'secondary', description: 'Gulf Coast societies.' }
                ],
                structureNames: {
                    fortress: ['Circular Village', 'River Bend Settlement'],
                    holy_site: ['Burial Mound', 'Ceremonial Ground'],
                    mill: ['Pottery Workshop', 'Stone Tool Making Site']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Mississippian Chiefdoms',
                dominantPowerDescription: 'Powerful chiefdoms with platform mounds, complex ceremonial life, and extensive maize agriculture throughout the Southeast.',
                eraContextSentence: 'an era of temple mounds, where powerful chiefs rule from atop earthen pyramids.',
                allegianceGroups: [
                    { name: 'Mississippian Chiefdoms', type: 'primary', description: 'Platform mound societies.' },
                    { name: 'Etowah Chiefdom', type: 'secondary', description: 'Major center in present-day Georgia.' },
                    { name: 'Coosa Paramountcy', type: 'secondary', description: 'Powerful confederation in the Appalachian region.' },
                    { name: 'Calusa Kingdom', type: 'secondary', description: 'Non-agricultural chiefdom in Florida.' }
                ],
                structureNames: {
                    fortress: ['Palisaded Town', 'Mound Center'],
                    mill: ['Corn Storage House', 'Craft Workshop'],
                    holy_site: ['Temple Mound', 'Charnel House', 'Plaza'],
                    palace: ["Paramount Chief's House"],
                },
                courtRoles: {
                    palace: ['Mico (Chief)', 'War Leader', 'Beloved Woman', 'Priest']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Native Confederations',
                dominantPowerDescription: 'Powerful indigenous confederations like the Creek, Cherokee, and Choctaw dominate the region while beginning to interact with European colonizers.',
                eraContextSentence: 'an era of confederations and contact, where southeastern peoples navigate the arrival of European powers.',
                allegianceGroups: [
                    { name: 'Creek Confederacy', type: 'primary', description: 'Powerful Muskogean-speaking confederation.' },
                    { name: 'Cherokee Nation', type: 'secondary', description: 'Iroquoian-speaking mountain peoples.' },
                    { name: 'Choctaw Nation', type: 'secondary', description: 'Major power in present-day Mississippi.' },
                    { name: 'Spanish Florida', type: 'trade_company', description: 'Colonial presence on the coasts.' }
                ],
                structureNames: {
                    fortress: ['Town Square Ground', 'Fortified Town'],
                    mill: ['Council House', 'Trade Warehouse'],
                    holy_site: ['Sacred Fire', 'Green Corn Ceremony Ground'],
                    palace: ["Principal Chief's House"],
                    trading_post: ['Trading Path Station', 'Deerskin Warehouse']
                },
                courtRoles: {
                    palace: ['Principal Chief', 'Second Chief', 'Beloved Man/Woman', 'Town King']
                }
            }
        },
        "Arctic and Subarctic": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Paleo-Arctic Peoples',
                dominantPowerDescription: 'Ancient Arctic peoples developing specialized tools and techniques for survival in the far north, following caribou and sea mammals.',
                eraContextSentence: 'an age of ice mastery, where peoples learn to thrive in the harshest environments on Earth.',
                allegianceGroups: [
                    { name: 'Paleo-Arctic Peoples', type: 'primary', description: 'Early Arctic inhabitants.' },
                    { name: 'Dorset Culture', type: 'secondary', description: 'Pre-Inuit Arctic peoples.' },
                    { name: 'Subarctic Hunters', type: 'secondary', description: 'Forest and tundra peoples.' }
                ],
                structureNames: {
                    fortress: ['Snow House Village', 'Coastal Camp'],
                    holy_site: ['Shaman Site', 'Sacred Inukshuk']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Thule Culture',
                dominantPowerDescription: 'Advanced Arctic peoples spreading across the north with sophisticated technology including dog sleds, kayaks, and toggling harpoons.',
                eraContextSentence: 'an era of Arctic expansion, where Thule peoples master both land and sea.',
                allegianceGroups: [
                    { name: 'Thule Culture', type: 'primary', description: 'Ancestors of modern Inuit.' },
                    { name: 'Subarctic Peoples', type: 'secondary', description: 'Dene and other forest peoples.' },
                    { name: 'Norse Visitors', type: 'trade_company', description: 'Brief Viking presence in the eastern Arctic.' }
                ],
                structureNames: {
                    fortress: ['Winter Village', 'Whalebone House'],
                    mill: ['Seal Processing Site', 'Cache Pit'],
                    holy_site: ['Ceremonial House', 'Whale Shrine']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Inuit and Subarctic Nations',
                dominantPowerDescription: 'Established Arctic and Subarctic peoples maintaining traditional ways while beginning encounters with European whalers and explorers.',
                eraContextSentence: 'an era of endurance, where northern peoples maintain ancient ways in isolation.',
                allegianceGroups: [
                    { name: 'Inuit Peoples', type: 'primary', description: 'Arctic maritime specialists.' },
                    { name: 'Dene Nations', type: 'secondary', description: 'Subarctic forest peoples.' },
                    { name: 'European Whalers', type: 'trade_company', description: 'Seasonal visitors seeking whale oil.' },
                    { name: 'Russian Traders', type: 'trade_company', description: 'Fur traders from across the Bering Strait.' }
                ],
                structureNames: {
                    fortress: ['Fortified Camp', 'Trading Post'],
                    mill: ['Fish Camp', 'Caribou Processing'],
                    holy_site: ['Shaman Lodge', 'Gathering Place'],
                    trading_post: ['Fur Trading Post', 'Whaling Station']
                }
            }
        },
        "Mexico and Central Highlands": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Teotihuacan',
                dominantPowerDescription: 'Massive urban center dominating central Mexico with monumental pyramids, extensive trade networks, and cultural influence across Mesoamerica.',
                eraContextSentence: 'an age of the pyramid builders, where Teotihuacan rises as one of the world\'s great cities.',
                allegianceGroups: [
                    { name: 'Teotihuacan', type: 'primary', description: 'The dominant metropolis.' },
                    { name: 'Maya City-States', type: 'secondary', description: 'Trading partners to the south.' },
                    { name: 'Zapotec Kingdom', type: 'secondary', description: 'Monte Albán in Oaxaca.' },
                    { name: 'West Mexican Cultures', type: 'secondary', description: 'Shaft tomb cultures.' }
                ],
                structureNames: {
                    fortress: ['Citadel', 'Fortified Compound'],
                    mill: ['Obsidian Workshop', 'Pottery District'],
                    holy_site: ['Pyramid of the Sun', 'Temple of Quetzalcoatl'],
                    palace: ['Palace Complex', 'Noble Compound'],
                    trading_post: ['Great Market', 'Merchant Quarter']
                },
                courtRoles: {
                    palace: ['Divine Ruler', 'High Priest', 'Military Commander', 'Master of Merchants']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Toltec Empire',
                dominantPowerDescription: 'Militaristic empire centered at Tula, spreading the cult of Quetzalcoatl and influencing cultures across Mesoamerica.',
                eraContextSentence: 'an era of warrior-priests, where Toltec influence shapes the destiny of Mesoamerica.',
                allegianceGroups: [
                    { name: 'Toltec Empire', type: 'primary', description: 'The militaristic hegemon.' },
                    { name: 'Chichimeca Peoples', type: 'secondary', description: 'Northern nomadic groups.' },
                    { name: 'Maya Kingdoms', type: 'trade_company', description: 'Trading partners maintaining independence.' },
                    { name: 'Mixtec City-States', type: 'secondary', description: 'Oaxacan polities.' }
                ],
                structureNames: {
                    fortress: ['Warrior Temple', 'Fortified Acropolis'],
                    mill: ['Turquoise Workshop', 'Featherwork Shop'],
                    holy_site: ['Temple of Tlahuizcalpantecuhtli', 'Ball Court'],
                    palace: ['Burnt Palace', 'Ruler\'s Complex'],
                    trading_post: ['Long-Distance Trade Depot', 'Tribute Collection Point']
                },
                courtRoles: {
                    palace: ['Huey Tlatoani', 'Eagle Warrior Captain', 'Jaguar Warrior Captain', 'Chief Priest']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Aztec Empire',
                dominantPowerDescription: 'The Triple Alliance dominates central Mexico from Tenochtitlan, extracting tribute from subject peoples until Spanish conquest.',
                eraContextSentence: 'an era of imperial glory, where the Aztec Empire reaches its zenith before catastrophic collapse.',
                allegianceGroups: [
                    { name: 'Aztec Triple Alliance', type: 'primary', description: 'Tenochtitlan, Texcoco, and Tlacopan.' },
                    { name: 'Tlaxcala', type: 'rebel', description: 'Independent enemies of the Aztecs.' },
                    { name: 'Subject Peoples', type: 'secondary', description: 'Tribute-paying conquered nations.' },
                    { name: 'Spanish Conquistadors', type: 'mercenary', description: 'Cortés and his expedition.' }
                ],
                structureNames: {
                    fortress: ['Teocalli', 'Fortified Island'],
                    mill: ['Chinampas', 'Craft Calpulli'],
                    holy_site: ['Templo Mayor', 'Tzompantli'],
                    palace: ['Moctezuma\'s Palace', 'Axayacatl Palace'],
                    trading_post: ['Tlatelolco Market', 'Pochteca Guild House']
                },
                courtRoles: {
                    palace: ['Huey Tlatoani', 'Cihuacoatl', 'Tlacochcalcatl', 'Pochteca Elder'],
                    holy_site: ['Quetzalcoatl Priest', 'Tlaloc Priest', 'Sacrificial Priest']
                },
                mapAreaOverrides: {
                    "Valley of Mexico": {
                        dominantPower: 'Tenochtitlan',
                        dominantPowerDescription: 'The Aztec capital built on an island in Lake Texcoco, one of the world\'s largest cities.',
                        allegianceGroups: [
                            { name: 'Tenochtitlan', type: 'primary', description: 'The imperial capital.' },
                            { name: 'Texcoco', type: 'secondary', description: 'Allied city of learning.' },
                            { name: 'Tlacopan', type: 'secondary', description: 'Junior partner in Triple Alliance.' },
                            { name: 'Xochimilco', type: 'secondary', description: 'Chinampas specialists.' }
                        ]
                    }
                }
            }
        },
        "Northern Rockies": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Plateau Peoples',
                dominantPowerDescription: 'River-oriented societies along the Columbia and Snake rivers, developing complex fishing technologies and trade networks.',
                eraContextSentence: 'an age of salmon abundance, where river peoples prosper at the great fishing sites.',
                allegianceGroups: [
                    { name: 'Plateau Peoples', type: 'primary', description: 'River-dwelling societies.' },
                    { name: 'Mountain Peoples', type: 'secondary', description: 'Highland hunting groups.' },
                    { name: 'Plains Traders', type: 'trade_company', description: 'Groups from the east bringing goods.' }
                ],
                structureNames: {
                    fortress: ['Fishing Camp', 'Winter Village'],
                    holy_site: ['First Salmon Ceremony Site', 'Vision Quest Peak']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Plateau Trading Networks',
                dominantPowerDescription: 'Sophisticated trading societies controlling key river crossings and maintaining extensive networks from coast to plains.',
                eraContextSentence: 'an era of trade prosperity, where Plateau peoples serve as crucial intermediaries.',
                allegianceGroups: [
                    { name: 'Plateau Trading Networks', type: 'primary', description: 'Controllers of trade routes.' },
                    { name: 'Shoshonean Peoples', type: 'secondary', description: 'Great Basin connections.' },
                    { name: 'Coastal Traders', type: 'trade_company', description: 'Bringing shells and coastal goods.' }
                ],
                structureNames: {
                    fortress: ['Fortified Fishing Site', 'Trading Village'],
                    mill: ['Root Processing Ground', 'Pemmican Cache'],
                    holy_site: ['Camas Prairie Ceremony Ground', 'Rock Art Gallery'],
                    trading_post: ['The Dalles Trading Center', 'Celilo Falls Market']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Horse-Culture Plateau Peoples',
                dominantPowerDescription: 'Plateau peoples adopt horses, transforming their societies and increasing mobility while maintaining fishing traditions.',
                eraContextSentence: 'an era of transformation, where horses bring new power to ancient river peoples.',
                allegianceGroups: [
                    { name: 'Nez Perce Nation', type: 'primary', description: 'Powerful horse-breeding people.' },
                    { name: 'Yakama Confederacy', type: 'secondary', description: 'Alliance of Plateau groups.' },
                    { name: 'Blackfoot Confederacy', type: 'rebel', description: 'Plains rivals to the east.' },
                    { name: 'Early Fur Traders', type: 'trade_company', description: 'French and British traders.' }
                ],
                structureNames: {
                    fortress: ['Winter Camp', 'Summer Gathering Ground'],
                    mill: ['Camas Oven', 'Horse Breeding Ground'],
                    holy_site: ['Sacred Mountain', 'Treaty Ground'],
                    trading_post: ['Rendezvous Site', 'Fur Trading Post']
                }
            }
        },
        "Atlantic Coast": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Coastal Woodland Peoples',
                dominantPowerDescription: 'Maritime-adapted societies combining fishing, shellfishing, and hunting with seasonal agriculture along the Atlantic.',
                eraContextSentence: 'an age of coastal abundance, where shell middens mark millennia of prosperous settlement.',
                allegianceGroups: [
                    { name: 'Coastal Woodland Peoples', type: 'primary', description: 'Maritime-oriented societies.' },
                    { name: 'Inland Traders', type: 'secondary', description: 'Groups bringing stone and furs.' },
                    { name: 'Northern Maritime Peoples', type: 'secondary', description: 'Cold-adapted coastal groups.' }
                ],
                structureNames: {
                    fortress: ['Palisaded Coastal Village', 'Shell Midden Fort'],
                    holy_site: ['Shell Ring', 'Burial Ground'],
                    mill: ['Fish Weir', 'Oyster Processing Site']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Algonquian Confederations',
                dominantPowerDescription: 'Powerful confederations of Algonquian-speaking peoples dominate the coast with sophisticated political alliances and thriving agriculture.',
                eraContextSentence: 'an era of confederate power, where Algonquian alliances control the coastal regions.',
                allegianceGroups: [
                    { name: 'Powhatan Confederacy', type: 'primary', description: 'Powerful Chesapeake alliance.' },
                    { name: 'Wampanoag Federation', type: 'secondary', description: 'New England coastal power.' },
                    { name: 'Lenape Peoples', type: 'secondary', description: 'Delaware River societies.' },
                    { name: 'Susquehannock Nation', type: 'secondary', description: 'Powerful inland traders.' }
                ],
                structureNames: {
                    fortress: ['Fortified Town', 'Palisaded Village'],
                    mill: ['Corn Field', 'Fish Smoking House'],
                    holy_site: ['Sacred Grove', 'Ossuary'],
                    palace: ["Werowance's Longhouse"],
                },
                courtRoles: {
                    palace: ['Werowance (Chief)', 'War Captain', 'Priest', 'Council Speaker']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Native Coastal Nations',
                dominantPowerDescription: 'Indigenous nations encounter and initially trade with European colonizers, soon facing devastating diseases and territorial pressure.',
                eraContextSentence: 'an era of fateful contact, where European ships bring both trade and catastrophe.',
                allegianceGroups: [
                    { name: 'Native Coastal Nations', type: 'primary', description: 'Indigenous peoples facing colonization.' },
                    { name: 'English Colonies', type: 'secondary', description: 'Jamestown, Plymouth, and others.' },
                    { name: 'Dutch New Netherland', type: 'trade_company', description: 'Trading colony on the Hudson.' },
                    { name: 'French Acadia', type: 'secondary', description: 'Northern colonial presence.' }
                ],
                structureNames: {
                    fortress: ['Native Fort', 'Fortified Village'],
                    mill: ['Trading House', 'Wampum Workshop'],
                    holy_site: ['Traditional Ceremony Ground', 'Praying Town'],
                    trading_post: ['Fur Trading Post', 'Treaty Ground'],
                    palace: ["Sachem's House"]
                }
            }
        }
    }
};