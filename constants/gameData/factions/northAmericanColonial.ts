/**
 * constants/gameData/factions/northAmericanColonial.ts
 * Comprehensive faction data for North American cultural zones.
 */
import { HistoricalEra } from '../../../types';
import { FactionFile } from './types';

const MODERN_ERA = 'MODERN_ERA';
const FUTURE_ERA = 'FUTURE_ERA';

export const NORTH_AMERICAN_COLONIAL_FACTIONS: FactionFile = {
    'NORTH_AMERICAN_COLONIAL': {
        "Pacific Coast": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Pacific Northwest Indigenous Nations',
                dominantPowerDescription: 'Complex hunter-gatherer societies develop sophisticated cultures based on salmon runs and cedar forests.',
                eraContextSentence: 'an age of salmon and cedar, where coastal peoples build rich cultures from the sea\'s bounty.',
                allegianceGroups: [
                    { name: 'Coastal Salish Peoples', type: 'primary', description: 'Dominant cultural group of the region.' },
                    { name: 'Interior Plateau Tribes', type: 'secondary', description: 'Mountain and inland peoples.' },
                    { name: 'Northern Pacific Peoples', type: 'secondary', description: 'Alaska and northern BC tribes.' }
                ],
                structureNames: {
                    fortress: ['Fortified Village', 'Cliff Stronghold'],
                    factory: ['Salmon Processing Site', 'Cedar Workshop'],
                    trading_post: ['Seasonal Trading Ground', 'River Confluence Market'],
                    holy_site: ['Sacred Grove', 'Salmon Ceremony Site'],
                    palace: ['Chief\'s Longhouse', 'Potlatch House']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Pacific Northwest Cultural Complex',
                dominantPowerDescription: 'Sophisticated chiefdoms emerge with elaborate art, potlatch ceremonies, and monumental architecture.',
                eraContextSentence: 'an era of great houses and potlatch, where wealth flows like salmon up the rivers.',
                allegianceGroups: [
                    { name: 'Haida Confederacy', type: 'primary', description: 'Powerful maritime chiefdom.' },
                    { name: 'Tlingit Clans', type: 'secondary', description: 'Northern coastal peoples.' },
                    { name: 'Chinook Trading Network', type: 'secondary', description: 'Columbia River trading culture.' }
                ],
                structureNames: {
                    fortress: ['Hillfort Village', 'Island Stronghold'],
                    palace: ['Great House', 'Ceremonial Longhouse']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Spanish/Russian/British Colonial Competition',
                dominantPowerDescription: 'European maritime empires compete for control while indigenous societies adapt and resist.',
                eraContextSentence: 'an era of three empires, where Spanish, Russian, and British powers contest the Pacific rim.',
                allegianceGroups: [
                    { name: 'Spanish Empire', type: 'primary', description: 'Colonial power from California.' },
                    { name: 'Russian America Company', type: 'secondary', description: 'Fur trading enterprise from Alaska.' },
                    { name: 'British Empire', type: 'secondary', description: 'Hudson\'s Bay Company operations.' },
                    { name: 'Indigenous Confederations', type: 'rebel', description: 'Native resistance and adaptation.' }
                ],
                structureNames: {
                    fortress: ['Presidio', 'Russian Fort', 'Hudson\'s Bay Fort'],
                    factory: ['Spanish Mission', 'Fur Trading Post'],
                    trading_post: ['Manila Galleon Port', 'Russian Trading Post']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'American expansion reaches the Pacific with gold rushes, transcontinental railroad, and rapid settlement.',
                eraContextSentence: 'an era of manifest destiny, where gold and rails bind the Pacific to the nation.',
                allegianceGroups: [
                    { name: 'United States', type: 'primary', description: 'Expanding federal authority.' },
                    { name: 'California Gold Rush Miners', type: 'secondary', description: 'Independent prospectors and companies.' },
                    { name: 'Railroad Companies', type: 'trade_company', description: 'Central Pacific and other rail corporations.' },
                    { name: 'Native American Tribes', type: 'rebel', description: 'Displaced indigenous peoples.' }
                ],
                structureNames: {
                    fortress: ['Army Fort', 'Coastal Battery'],
                    factory: ['Lumber Mill', 'Salmon Cannery', 'Gold Processing Plant'],
                    trading_post: ['Railroad Terminal', 'Steamship Port']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The Pacific Coast becomes America\'s gateway to Asia and a center of innovation, entertainment, and technology.',
                eraContextSentence: 'an era of Pacific power, where California dreams shape global culture and commerce.',
                allegianceGroups: [
                    { name: 'United States', type: 'primary', description: 'Federal and state governments.' },
                    { name: 'Tech Industry', type: 'trade_company', description: 'Silicon Valley corporations.' },
                    { name: 'Entertainment Industry', type: 'trade_company', description: 'Hollywood studios and media.' },
                    { name: 'Environmental Movement', type: 'secondary', description: 'Conservation and ecology advocates.' }
                ],
                structureNames: {
                    fortress: ['Naval Base', 'Air Force Base', 'Coast Guard Station'],
                    factory: ['Tech Campus', 'Movie Studio', 'Aerospace Plant'],
                    trading_post: ['International Airport', 'Container Port', 'Tech Hub']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The Pacific Coast remains economically dominant but faces political polarization, climate challenges, and growing wealth inequality amid technological advancement.',
                eraContextSentence: 'an era of innovation and division, where tech prosperity coexists with political fragmentation and climate stress.',
                allegianceGroups: [
                    { name: 'United States Federal Government', type: 'primary', description: 'Increasingly polarized federal authority.' },
                    { name: 'Tech Industry', type: 'trade_company', description: 'Dominant economic force with growing political influence.' },
                    { name: 'Climate Action Movement', type: 'secondary', description: 'Environmental advocacy amid increasing disasters.' },
                    { name: 'Anti-Government Militias', type: 'rebel', description: 'Armed groups challenging federal authority.' }
                ],
                structureNames: {
                    factory: ['Tech Campus', 'Climate Adaptation Infrastructure', 'Wildfire Defense System'],
                    trading_post: ['Digital Commerce Hub', 'Climate Refugee Processing Center']
                }
            }
        },
        "Southwest": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Ancestral Puebloan Culture',
                dominantPowerDescription: 'Agricultural peoples develop sophisticated irrigation and monumental architecture in the desert.',
                eraContextSentence: 'an age of cliff dwellings and great kivas, where desert farmers build enduring stone cities.',
                allegianceGroups: [
                    { name: 'Ancestral Puebloans', type: 'primary', description: 'Advanced agricultural civilization.' },
                    { name: 'Mogollon Culture', type: 'secondary', description: 'Mountain-dwelling agricultural peoples.' },
                    { name: 'Hohokam Culture', type: 'secondary', description: 'Desert irrigation specialists.' }
                ],
                structureNames: {
                    fortress: ['Cliff Dwelling', 'Mesa-top Pueblo'],
                    factory: ['Pottery Workshop', 'Irrigation System'],
                    holy_site: ['Great Kiva', 'Sun Temple'],
                    palace: ['Great House', 'Ceremonial Complex']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Pueblo Confederations',
                dominantPowerDescription: 'Pueblo peoples establish enduring settlements while nomadic groups migrate into the region.',
                eraContextSentence: 'an era of ancient ways renewed, where pueblo dwellers perfect desert agriculture.',
                allegianceGroups: [
                    { name: 'Rio Grande Pueblos', type: 'primary', description: 'Eastern pueblo confederations.' },
                    { name: 'Western Pueblo Groups', type: 'secondary', description: 'Hopi and Zuni peoples.' },
                    { name: 'Athabaskan Migrants', type: 'secondary', description: 'Incoming Navajo and Apache groups.' }
                ],
                structureNames: {
                    fortress: ['Pueblo Complex', 'Defensive Village'],
                    trading_post: ['Seasonal Market', 'Trade Plaza']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Spanish Empire',
                dominantPowerDescription: 'Spanish colonization establishes missions and presidios while indigenous peoples adapt and resist.',
                eraContextSentence: 'an era of cross and sword, where Spanish colonial order meets ancient pueblo wisdom.',
                allegianceGroups: [
                    { name: 'Spanish Empire', type: 'primary', description: 'Colonial administration from Mexico.' },
                    { name: 'Pueblo Nations', type: 'secondary', description: 'Indigenous peoples under Spanish rule.' },
                    { name: 'Comanche Empire', type: 'rebel', description: 'Powerful nomadic confederation.' },
                    { name: 'Apache Bands', type: 'rebel', description: 'Raiding groups resisting colonization.' }
                ],
                structureNames: {
                    fortress: ['Presidio', 'Mission Compound'],
                    holy_site: ['Catholic Mission', 'Pueblo Ceremonial Site'],
                    trading_post: ['Spanish Trading Post', 'Camino Real Station']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'American expansion brings mining, railroads, and territorial government while conducting wars against Apache and other tribes.',
                eraContextSentence: 'an era of territorial expansion, where American miners and soldiers claim the desert Southwest.',
                allegianceGroups: [
                    { name: 'United States', type: 'primary', description: 'Territorial and later state governments.' },
                    { name: 'Apache Nations', type: 'rebel', description: 'Fierce resistance led by leaders like Geronimo.' },
                    { name: 'Mining Companies', type: 'trade_company', description: 'Silver and copper extraction enterprises.' },
                    { name: 'Mexican-American Communities', type: 'secondary', description: 'Former Mexican citizens under new rule.' }
                ],
                structureNames: {
                    fortress: ['Army Fort', 'Apache Scout Base'],
                    factory: ['Copper Mine', 'Silver Mine', 'Cattle Ranch'],
                    trading_post: ['Railroad Depot', 'Mining Supply Center']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The Southwest becomes a center of defense industries, aerospace, and population growth, while Native American nations gain greater autonomy.',
                eraContextSentence: 'an era of Sun Belt growth, where desert cities bloom with defense contracts and retirees.',
                allegianceGroups: [
                    { name: 'United States', type: 'primary', description: 'Federal and state governments.' },
                    { name: 'Native American Nations', type: 'secondary', description: 'Sovereign tribal governments.' },
                    { name: 'Defense Contractors', type: 'trade_company', description: 'Aerospace and weapons manufacturers.' },
                    { name: 'Mexican Immigration', type: 'secondary', description: 'Large immigrant communities.' }
                ],
                structureNames: {
                    fortress: ['Air Force Base', 'Nuclear Test Site', 'Border Patrol Station'],
                    factory: ['Aerospace Plant', 'Electronics Manufacturing', 'Solar Panel Factory'],
                    trading_post: ['International Airport', 'Border Crossing', 'Interstate Highway Hub']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The Southwest faces severe climate stress with water shortages, extreme heat, and mass migration while political conflicts intensify over immigration and federal authority.',
                eraContextSentence: 'an era of climate crisis and border tensions, where the desert confronts environmental limits and political extremism.',
                allegianceGroups: [
                    { name: 'United States Federal Government', type: 'primary', description: 'Strained federal authority managing multiple crises.' },
                    { name: 'Border Militias', type: 'rebel', description: 'Armed groups patrolling immigration routes.' },
                    { name: 'Climate Refugees', type: 'secondary', description: 'Mass internal migration from environmental disasters.' },
                    { name: 'Water Rights Coalitions', type: 'secondary', description: 'Multi-state cooperation over dwindling water resources.' }
                ],
                structureNames: {
                    factory: ['Desalination Plant', 'Border Security Complex', 'Climate Migration Center'],
                    trading_post: ['Water Trading Hub', 'Cross-Border Manufacturing']
                }
            }
        },
        "Great Plains": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Plains Village Cultures',
                dominantPowerDescription: 'Agricultural peoples establish earth lodge villages along rivers while nomadic groups follow bison herds.',
                eraContextSentence: 'an age of earth and grass, where village farmers and bison hunters share the endless plains.',
                allegianceGroups: [
                    { name: 'Plains Village Peoples', type: 'primary', description: 'Agricultural communities along major rivers.' },
                    { name: 'Nomadic Hunting Groups', type: 'secondary', description: 'Mobile bison hunting societies.' },
                    { name: 'Woodland Edge Peoples', type: 'secondary', description: 'Transitional forest-plains cultures.' }
                ],
                structureNames: {
                    fortress: ['Fortified Village', 'Hilltop Stronghold'],
                    factory: ['Bison Processing Site', 'Hide Workshop'],
                    trading_post: ['River Crossing Market', 'Seasonal Gathering'],
                    holy_site: ['Medicine Wheel', 'Sacred Grove'],
                    palace: ['Chief\'s Lodge', 'Council House']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Plains Agricultural Societies',
                dominantPowerDescription: 'Sophisticated agricultural communities flourish while developing extensive trade networks across the continent.',
                eraContextSentence: 'an era of great villages, where plains farmers build trade empires from corn and bison.',
                allegianceGroups: [
                    { name: 'Central Plains Villages', type: 'primary', description: 'Major agricultural centers.' },
                    { name: 'Northern Plains Hunters', type: 'secondary', description: 'Specialized bison hunting cultures.' },
                    { name: 'Eastern Woodland Traders', type: 'secondary', description: 'Forest peoples engaging in trade.' }
                ],
                structureNames: {
                    trading_post: ['Great Trading Center', 'Intertribal Market'],
                    palace: ['Great Lodge', 'Ceremonial Center']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Horse Culture Nations',
                dominantPowerDescription: 'Introduction of horses revolutionizes Plains culture, creating powerful nomadic confederations centered on bison hunting.',
                eraContextSentence: 'an era of horse and bison, where mounted warriors rule the grassland empire.',
                allegianceGroups: [
                    { name: 'Lakota Confederacy', type: 'primary', description: 'Powerful Sioux alliance.' },
                    { name: 'Comanche Empire', type: 'secondary', description: 'Dominant southern plains power.' },
                    { name: 'Cheyenne-Arapaho Alliance', type: 'secondary', description: 'Central plains confederation.' },
                    { name: 'European Colonial Powers', type: 'secondary', description: 'Distant but growing influence.' }
                ],
                structureNames: {
                    fortress: ['Winter Camp', 'Sacred Mountain Stronghold'],
                    trading_post: ['Horse Market', 'Fur Trading Rendezvous'],
                    holy_site: ['Sun Dance Lodge', 'Vision Quest Site']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'American expansion destroys the bison herds and defeats Native resistance, transforming the plains into cattle ranches and wheat farms.',
                eraContextSentence: 'an era of steel rails and broken treaties, where the frontier closes with blood and grain.',
                allegianceGroups: [
                    { name: 'United States', type: 'primary', description: 'Expanding federal authority.' },
                    { name: 'Plains Indian Nations', type: 'rebel', description: 'Resistance led by figures like Sitting Bull.' },
                    { name: 'Railroad Companies', type: 'trade_company', description: 'Transcontinental and regional lines.' },
                    { name: 'Cattle Barons', type: 'trade_company', description: 'Large-scale ranching operations.' }
                ],
                structureNames: {
                    fortress: ['Cavalry Fort', 'Railroad Guard Station'],
                    factory: ['Cattle Ranch', 'Grain Elevator', 'Meat Packing Plant'],
                    trading_post: ['Railroad Town', 'Cattle Shipping Point']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The Great Plains becomes America\'s breadbasket and energy producer, while facing challenges from climate change and economic consolidation.',
                eraContextSentence: 'an era of amber waves and black gold, where the plains feed and fuel the nation.',
                allegianceGroups: [
                    { name: 'United States', type: 'primary', description: 'Federal and state governments.' },
                    { name: 'Agricultural Corporations', type: 'trade_company', description: 'Large farming and food processing companies.' },
                    { name: 'Energy Companies', type: 'trade_company', description: 'Oil, gas, and wind power producers.' },
                    { name: 'Native American Nations', type: 'secondary', description: 'Reservation governments with growing sovereignty.' }
                ],
                structureNames: {
                    fortress: ['Air Force Base', 'Missile Silo', 'National Guard Armory'],
                    factory: ['Mega Farm', 'Food Processing Plant', 'Wind Turbine Farm', 'Oil Refinery'],
                    trading_post: ['Grain Terminal', 'Interstate Truck Stop', 'Regional Airport']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The Great Plains experiences severe agricultural disruption from climate change while becoming more politically conservative and resistant to federal environmental regulations.',
                eraContextSentence: 'an era of failing harvests and rising anger, where traditional farming communities confront environmental collapse and political radicalization.',
                allegianceGroups: [
                    { name: 'United States Federal Government', type: 'primary', description: 'Federal authority increasingly challenged by rural resistance.' },
                    { name: 'Agricultural Corporations', type: 'trade_company', description: 'Agribusiness adapting to climate disruption.' },
                    { name: 'Rural Militia Networks', type: 'rebel', description: 'Armed groups opposing federal environmental policies.' },
                    { name: 'Climate Adaptation Scientists', type: 'secondary', description: 'Researchers developing drought-resistant agriculture.' }
                ],
                structureNames: {
                    factory: ['Drought-Resistant Crop Research', 'Abandoned Farmland', 'Water Conservation System'],
                    trading_post: ['Climate Commodity Exchange', 'Agricultural Crisis Center']
                }
            }
        },
        "Mississippi Valley": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Woodland Cultures',
                dominantPowerDescription: 'Sophisticated societies develop along the great river system, building earthwork monuments and extensive trade networks.',
                eraContextSentence: 'an age of mounds and rivers, where ancient peoples shape the earth into sacred forms.',
                allegianceGroups: [
                    { name: 'Hopewell Culture', type: 'primary', description: 'Widespread cultural and trade network.' },
                    { name: 'Adena Culture', type: 'secondary', description: 'Earlier mound-building tradition.' },
                    { name: 'Archaic River Peoples', type: 'secondary', description: 'Hunter-gatherer communities.' }
                ],
                structureNames: {
                    fortress: ['Hilltop Enclosure', 'River Bluff Fort'],
                    holy_site: ['Sacred Mound', 'Earthwork Complex'],
                    trading_post: ['River Confluence Market', 'Shell Trading Center'],
                    palace: ['Elite Burial Mound', 'Ceremonial Center']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Mississippian Culture',
                dominantPowerDescription: 'Agricultural chiefdoms build large towns with temple mounds, reaching their peak at Cahokia near present-day St. Louis.',
                eraContextSentence: 'an era of great towns and temple mounds, where Cahokia rivals the cities of the world.',
                allegianceGroups: [
                    { name: 'Cahokia Chiefdom', type: 'primary', description: 'The largest pre-Columbian settlement north of Mexico.' },
                    { name: 'Regional Mississippian Centers', type: 'secondary', description: 'Smaller but significant chiefdoms.' },
                    { name: 'Outlying Woodland Groups', type: 'secondary', description: 'Less complex societies on the periphery.' }
                ],
                structureNames: {
                    fortress: ['Palisaded Town', 'Bluff Fort'],
                    factory: ['Craft Specialization Center', 'Agricultural Complex'],
                    holy_site: ['Great Temple Mound', 'Sacred Plaza'],
                    palace: ['Chief\'s Mound', 'Elite Residential Complex']
                },
                courtRoles: {
                    palace: ['Great Chief', 'Sub-chief', 'Warrior Leader', 'Shaman-Priest']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'French Colonial Empire',
                dominantPowerDescription: 'French exploration and trade creates a vast but sparsely populated colony dependent on Native American alliances and the fur trade.',
                eraContextSentence: 'an era of coureurs de bois and grand designs, where France claims the heart of the continent.',
                allegianceGroups: [
                    { name: 'French Empire', type: 'primary', description: 'Colonial administration of Louisiana.' },
                    { name: 'Illinois Confederacy', type: 'secondary', description: 'Major Native American alliance with France.' },
                    { name: 'Spanish Empire', type: 'secondary', description: 'Rival colonial power in the lower Mississippi.' },
                    { name: 'British Empire', type: 'secondary', description: 'Eastern competitor for Native allegiance.' }
                ],
                structureNames: {
                    fortress: ['French Fort', 'River Defense'],
                    factory: ['Fur Trading Post', 'Colonial Plantation'],
                    trading_post: ['River Port', 'Voyageur Depot'],
                    holy_site: ['Catholic Mission', 'Native Sacred Site']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The Mississippi becomes America\'s highway, with steamboats, cotton plantations, and growing industrial cities transforming the region.',
                eraContextSentence: 'an era of steamboats and cotton kingdoms, where the great river carries the nation\'s commerce.',
                allegianceGroups: [
                    { name: 'United States', type: 'primary', description: 'Federal authority and state governments.' },
                    { name: 'Confederate States', type: 'rebel', description: 'Seceded states during the Civil War.' },
                    { name: 'Steamboat Companies', type: 'trade_company', description: 'River transportation monopolies.' },
                    { name: 'Cotton Planters', type: 'trade_company', description: 'Wealthy plantation owners.' }
                ],
                structureNames: {
                    fortress: ['River Fort', 'Civil War Fortification'],
                    factory: ['Cotton Plantation', 'Steamboat Yard', 'Cotton Mill'],
                    trading_post: ['River Port', 'Cotton Exchange', 'Railroad Junction']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The Mississippi Valley industrializes with agriculture, manufacturing, and transportation, while grappling with the legacy of slavery and segregation.',
                eraContextSentence: 'an era of industrial rivers and social change, where America confronts its past while building its future.',
                allegianceGroups: [
                    { name: 'United States', type: 'primary', description: 'Federal and state governments.' },
                    { name: 'Agricultural Interests', type: 'trade_company', description: 'Large farming and food processing operations.' },
                    { name: 'Civil Rights Movement', type: 'secondary', description: 'Organizations fighting for racial equality.' },
                    { name: 'Industrial Labor', type: 'secondary', description: 'Manufacturing workers and unions.' }
                ],
                structureNames: {
                    fortress: ['Army Corps of Engineers Base', 'National Guard Facility'],
                    factory: ['Barge Terminal', 'Grain Processing Plant', 'Petrochemical Complex'],
                    trading_post: ['River Port', 'Interstate Highway Hub', 'Regional Airport']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The Mississippi Valley faces increasing flood disasters and economic decline while political polarization deepens between urban and rural areas.',
                eraContextSentence: 'an era of rising waters and falling trust, where climate disasters amplify political divisions along the great river.',
                allegianceGroups: [
                    { name: 'United States Federal Government', type: 'primary', description: 'Federal authority managing repeated climate disasters.' },
                    { name: 'Army Corps of Engineers', type: 'secondary', description: 'Military engineers battling failing flood control systems.' },
                    { name: 'Rural Separatist Movements', type: 'rebel', description: 'Groups seeking independence from federal oversight.' },
                    { name: 'Climate Refugee Communities', type: 'secondary', description: 'Displaced populations from repeated flooding.' }
                ],
                structureNames: {
                    factory: ['Flood Control Infrastructure', 'Disaster Recovery Center', 'Agricultural Adaptation Facility'],
                    trading_post: ['Emergency Supply Hub', 'Climate Resilience Exchange']
                }
            }
        },
        "Northeast Woodlands": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Woodland Cultures',
                dominantPowerDescription: 'Forest peoples develop sophisticated societies based on hunting, gathering, and early agriculture.',
                eraContextSentence: 'an age of forest wisdom, where woodland peoples master the secrets of the eastern forests.',
                allegianceGroups: [
                    { name: 'Eastern Woodland Peoples', type: 'primary', description: 'Various Algonquian and Iroquoian groups.' },
                    { name: 'Coastal Peoples', type: 'secondary', description: 'Maritime-adapted communities.' },
                    { name: 'Interior Mountain Peoples', type: 'secondary', description: 'Highland hunting groups.' }
                ],
                structureNames: {
                    fortress: ['Hilltop Village', 'Fortified Settlement'],
                    factory: ['Stone Tool Workshop', 'Pottery Center'],
                    trading_post: ['Trail Junction', 'River Crossing'],
                    holy_site: ['Sacred Grove', 'Medicine Lodge'],
                    palace: ['Chief\'s Longhouse', 'Council House']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Iroquois Confederacy',
                dominantPowerDescription: 'The Five Nations create a sophisticated democratic confederation while agricultural villages flourish throughout the region.',
                eraContextSentence: 'an era of the Great Peace, where the Iroquois Confederacy brings unity to the eastern woodlands.',
                allegianceGroups: [
                    { name: 'Iroquois Confederacy', type: 'primary', description: 'Five Nations democratic alliance.' },
                    { name: 'Algonquian Peoples', type: 'secondary', description: 'Various eastern woodland tribes.' },
                    { name: 'Huron Confederacy', type: 'secondary', description: 'Northern Iroquoian confederation.' }
                ],
                structureNames: {
                    fortress: ['Palisaded Village', 'Confederacy Stronghold'],
                    holy_site: ['Council Fire', 'Longhouse Ceremony'],
                    palace: ['Grand Council Longhouse', 'Clan Mother\'s Lodge']
                },
                courtRoles: {
                    palace: ['Sachem', 'Clan Mother', 'War Chief', 'Faith Keeper']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'British Colonial Empire',
                dominantPowerDescription: 'English colonization creates permanent settlements while the Iroquois maintain power as crucial allies.',
                eraContextSentence: 'an era of two worlds meeting, where English colonists and Iroquois diplomats reshape the continent.',
                allegianceGroups: [
                    { name: 'British Empire', type: 'primary', description: 'Colonial government and settlers.' },
                    { name: 'Iroquois Confederacy', type: 'secondary', description: 'Native American diplomatic power.' },
                    { name: 'French Empire', type: 'secondary', description: 'Rival colonial power to the north.' },
                    { name: 'Dutch Empire', type: 'secondary', description: 'Trading presence in the Hudson Valley.' }
                ],
                structureNames: {
                    fortress: ['Colonial Fort', 'Frontier Stockade'],
                    factory: ['Colonial Mill', 'Ironworks'],
                    trading_post: ['Colonial Trading Post', 'Fur Trading Center'],
                    holy_site: ['Puritan Meetinghouse', 'Anglican Church', 'Native Council Fire']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The region becomes the industrial and financial heart of the expanding nation, with massive cities and factory complexes.',
                eraContextSentence: 'an era of steam and steel, where the Northeast forges the industrial destiny of America.',
                allegianceGroups: [
                    { name: 'United States', type: 'primary', description: 'Federal and state governments.' },
                    { name: 'Industrial Capitalists', type: 'trade_company', description: 'Factory owners and financial magnates.' },
                    { name: 'Immigrant Communities', type: 'secondary', description: 'European immigrants providing labor.' },
                    { name: 'Labor Organizations', type: 'rebel', description: 'Early labor unions and worker movements.' }
                ],
                structureNames: {
                    fortress: ['Coastal Fort', 'Naval Yard'],
                    factory: ['Textile Mill', 'Steel Works', 'Railroad Shop'],
                    trading_post: ['Railroad Terminal', 'Commercial Port', 'Financial Center']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The Northeast remains the political and financial center of America while transitioning from manufacturing to services and technology.',
                eraContextSentence: 'an era of global influence, where decisions in Manhattan and Washington shape the world.',
                allegianceGroups: [
                    { name: 'United States Federal Government', type: 'primary', description: 'Political center in Washington DC.' },
                    { name: 'Financial Industry', type: 'trade_company', description: 'Wall Street and banking sector.' },
                    { name: 'Academic Institutions', type: 'secondary', description: 'Ivy League and major universities.' },
                    { name: 'Organized Crime', type: 'rebel', description: 'Mafia and crime syndicates.' }
                ],
                structureNames: {
                    fortress: ['Pentagon', 'Naval Academy', 'West Point'],
                    factory: ['Financial District', 'University Campus', 'Tech Research Center'],
                    trading_post: ['International Airport', 'Financial Exchange', 'Port Authority'],
                    palace: ['White House', 'Capitol Building', 'Federal Reserve']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The Northeast remains the center of American power but faces increasing political instability, infrastructure decay, and climate-related migration pressures.',
                eraContextSentence: 'an era of crumbling empire, where the centers of power struggle with internal division and external pressure.',
                allegianceGroups: [
                    { name: 'United States Federal Government', type: 'primary', description: 'Increasingly dysfunctional federal authority.' },
                    { name: 'Financial Corporations', type: 'trade_company', description: 'Wall Street maintaining global influence despite domestic chaos.' },
                    { name: 'Political Extremist Groups', type: 'rebel', description: 'Both left and right-wing organizations challenging the system.' },
                    { name: 'International Allies', type: 'secondary', description: 'Foreign governments concerned about American stability.' }
                ],
                structureNames: {
                    factory: ['Failing Infrastructure Complex', 'Political Crisis Center', 'Financial Fortress'],
                    trading_post: ['International Crisis Management Hub', 'Political Refugee Processing']
                }
            }
        },
        "Southeast": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Southeastern Woodland Cultures',
                dominantPowerDescription: 'Diverse cultures develop in the region\'s forests, rivers, and coastal areas with sophisticated pottery and early agriculture.',
                eraContextSentence: 'an age of rivers and forests, where southeastern peoples master diverse landscapes.',
                allegianceGroups: [
                    { name: 'Southeastern Peoples', type: 'primary', description: 'Various cultural groups across the region.' },
                    { name: 'Coastal Peoples', type: 'secondary', description: 'Maritime-adapted communities.' },
                    { name: 'Mountain Peoples', type: 'secondary', description: 'Highland hunting and gathering groups.' }
                ],
                structureNames: {
                    fortress: ['Shell Ring Settlement', 'River Bluff Village'],
                    factory: ['Pottery Workshop', 'Shell Tool Center'],
                    trading_post: ['River Confluence', 'Coastal Trading Ground'],
                    holy_site: ['Sacred Mound', 'Ancestor Site']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Mississippian Chiefdoms',
                dominantPowerDescription: 'Agricultural chiefdoms build temple mound centers across the Southeast, creating complex hierarchical societies.',
                eraContextSentence: 'an era of temple mounds and great chiefs, where southeastern societies reach new heights.',
                allegianceGroups: [
                    { name: 'Southeastern Mississippian Chiefdoms', type: 'primary', description: 'Hierarchical agricultural societies.' },
                    { name: 'Regional Centers', type: 'secondary', description: 'Smaller chiefdoms and towns.' },
                    { name: 'Peripheral Groups', type: 'secondary', description: 'Less complex societies on the margins.' }
                ],
                structureNames: {
                    fortress: ['Palisaded Town', 'Mound Center'],
                    holy_site: ['Temple Mound', 'Ceremonial Plaza'],
                    palace: ['Chief\'s Mound', 'Elite Compound']
                },
                courtRoles: {
                    palace: ['Great Chief', 'Priest-Chief', 'War Leader', 'Sun Priest']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Native American Confederations',
                dominantPowerDescription: 'After European contact devastates earlier societies, new confederations emerge including the Creek, Cherokee, and Choctaw nations.',
                eraContextSentence: 'an era of survival and adaptation, where southeastern nations rebuild in the face of European pressure.',
                allegianceGroups: [
                    { name: 'Creek Confederacy', type: 'primary', description: 'Powerful alliance in the central Southeast.' },
                    { name: 'Cherokee Nation', type: 'secondary', description: 'Mountain people adapting to new challenges.' },
                    { name: 'Choctaw Nation', type: 'secondary', description: 'Mississippi River valley confederation.' },
                    { name: 'European Colonial Powers', type: 'secondary', description: 'Spanish, French, and English competitors.' }
                ],
                structureNames: {
                    fortress: ['Town Stockade', 'Mountain Stronghold'],
                    trading_post: ['Deerskin Trading Post', 'European Trade Center'],
                    holy_site: ['Council Ground', 'Sacred Fire Temple']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'American expansion forces Native removal while establishing a plantation economy based on enslaved African labor.',
                eraContextSentence: 'an era of cotton and chains, where the Southeast builds wealth through human bondage.',
                allegianceGroups: [
                    { name: 'United States', type: 'primary', description: 'Federal and state governments.' },
                    { name: 'Confederate States', type: 'rebel', description: 'Seceded states defending slavery.' },
                    { name: 'Plantation Elite', type: 'trade_company', description: 'Wealthy slaveholders and cotton planters.' },
                    { name: 'Enslaved African Americans', type: 'rebel', description: 'Resistance through various means.' }
                ],
                structureNames: {
                    fortress: ['Coastal Fort', 'Confederate Fortification'],
                    factory: ['Cotton Plantation', 'Tobacco Plantation', 'Naval Yard'],
                    trading_post: ['Cotton Port', 'Railroad Junction', 'River Landing']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The Southeast industrializes and diversifies its economy while confronting the legacy of slavery through the Civil Rights Movement.',
                eraContextSentence: 'an era of transformation and reckoning, where the South confronts its past while embracing change.',
                allegianceGroups: [
                    { name: 'United States', type: 'primary', description: 'Federal and state governments.' },
                    { name: 'Civil Rights Movement', type: 'secondary', description: 'Organizations fighting for racial equality.' },
                    { name: 'Industrial Development', type: 'trade_company', description: 'Manufacturing and service companies.' },
                    { name: 'White Supremacist Groups', type: 'rebel', description: 'Organizations resisting racial equality.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'NASA Space Center', 'Coast Guard Station'],
                    factory: ['Automotive Plant', 'Aerospace Facility', 'Petrochemical Complex'],
                    trading_post: ['International Airport', 'Container Port', 'Interstate Hub']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The Southeast experiences severe climate impacts including sea-level rise and hurricanes while political conservatism hardens against federal climate policies.',
                eraContextSentence: 'an era of storms and resistance, where coastal communities face environmental catastrophe amid political deadlock.',
                allegianceGroups: [
                    { name: 'United States Federal Government', type: 'primary', description: 'Federal authority challenged by state resistance.' },
                    { name: 'State Governments', type: 'secondary', description: 'Conservative states opposing federal climate policy.' },
                    { name: 'Climate Disaster Communities', type: 'secondary', description: 'Coastal populations facing repeated displacement.' },
                    { name: 'Christian Nationalist Groups', type: 'rebel', description: 'Religious extremist organizations gaining political power.' }
                ],
                structureNames: {
                    factory: ['Hurricane Recovery Center', 'Sea Wall Construction', 'Oil Refinery (Legacy)'],
                    trading_post: ['Climate Refugee Hub', 'Disaster Capitalism Center']
                }
            }
        },
        "Arctic and Subarctic": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Arctic Peoples',
                dominantPowerDescription: 'Specialized hunter-gatherer societies develop sophisticated technologies for surviving in the Arctic environment.',
                eraContextSentence: 'an age of ice and ingenuity, where Arctic peoples master the harshest environments on Earth.',
                allegianceGroups: [
                    { name: 'Thule Culture', type: 'primary', description: 'Sophisticated Arctic whale hunters.' },
                    { name: 'Dorset Culture', type: 'secondary', description: 'Earlier Arctic tradition.' },
                    { name: 'Subarctic Peoples', type: 'secondary', description: 'Boreal forest hunting groups.' }
                ],
                structureNames: {
                    fortress: ['Winter Village', 'Ice House Settlement'],
                    factory: ['Whale Processing Site', 'Tool Workshop'],
                    trading_post: ['Summer Gathering', 'Trading Rendezvous'],
                    holy_site: ['Sacred Cairn', 'Shaman Site']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Inuit Culture',
                dominantPowerDescription: 'Inuit peoples perfect Arctic survival while maintaining connections across the vast Arctic archipelago.',
                eraContextSentence: 'an era of Arctic mastery, where Inuit culture spreads across the polar world.',
                allegianceGroups: [
                    { name: 'Inuit Groups', type: 'primary', description: 'Arctic peoples across northern Canada and Alaska.' },
                    { name: 'Subarctic Athabaskan Peoples', type: 'secondary', description: 'Interior forest hunters.' },
                    { name: 'Norse Contact', type: 'secondary', description: 'Brief European contact in the eastern Arctic.' }
                ],
                structureNames: {
                    trading_post: ['Seasonal Trading Ground', 'Summer Fish Camp']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Indigenous Arctic Nations',
                dominantPowerDescription: 'Arctic peoples maintain their traditional ways while beginning contact with European whalers and explorers.',
                eraContextSentence: 'an era of first contact, where Arctic peoples encounter European explorers seeking the Northwest Passage.',
                allegianceGroups: [
                    { name: 'Inuit Nations', type: 'primary', description: 'Arctic peoples maintaining sovereignty.' },
                    { name: 'Subarctic First Nations', type: 'secondary', description: 'Boreal forest peoples.' },
                    { name: 'European Explorers', type: 'secondary', description: 'Seeking Arctic passages and resources.' }
                ],
                structureNames: {
                    trading_post: ['Whaling Station', 'Fur Trading Post'],
                    holy_site: ['Traditional Sacred Site', 'Inuksuk Monument']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Canada/United States',
                dominantPowerDescription: 'European-derived governments assert sovereignty while Arctic peoples face disruption from whaling, mining, and missionary activity.',
                eraContextSentence: 'an era of imposed boundaries, where southern governments claim Arctic lands while disrupting ancient ways.',
                allegianceGroups: [
                    { name: 'Canadian Government', type: 'primary', description: 'Colonial and later federal authority.' },
                    { name: 'United States', type: 'secondary', description: 'Alaskan territorial government.' },
                    { name: 'Arctic Indigenous Peoples', type: 'secondary', description: 'Native communities under government control.' },
                    { name: 'Whaling Companies', type: 'trade_company', description: 'Commercial whaling operations.' }
                ],
                structureNames: {
                    fortress: ['Royal Canadian Mounted Police Post', 'Territorial Government Station'],
                    factory: ['Whaling Station', 'Trading Post', 'Mission Station'],
                    trading_post: ['Northern Trading Company Post', 'Government Supply Depot']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Canada/United States',
                dominantPowerDescription: 'The Arctic becomes strategically important during the Cold War while indigenous peoples fight for land rights and cultural survival.',
                eraContextSentence: 'an era of Cold War and awakening, where the Arctic becomes a frontier of superpower rivalry and indigenous rights.',
                allegianceGroups: [
                    { name: 'Canadian Government', type: 'primary', description: 'Federal authority with growing indigenous recognition.' },
                    { name: 'United States', type: 'secondary', description: 'Alaskan state and federal presence.' },
                    { name: 'Inuit and First Nations Governments', type: 'secondary', description: 'Increasingly autonomous indigenous authorities.' },
                    { name: 'Resource Extraction Companies', type: 'trade_company', description: 'Oil, gas, and mining operations.' }
                ],
                structureNames: {
                    fortress: ['DEW Line Station', 'Military Base', 'Coast Guard Station'],
                    factory: ['Oil Drilling Platform', 'Mining Operation', 'Research Station'],
                    trading_post: ['Northern Store', 'Air Transport Hub', 'Government Service Center']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'Canada/United States',
                dominantPowerDescription: 'The Arctic becomes increasingly contested as climate change opens new shipping routes while indigenous peoples assert greater sovereignty amid political instability.',
                eraContextSentence: 'an era of melting sovereignty, where disappearing ice reshapes geopolitics and indigenous rights.',
                allegianceGroups: [
                    { name: 'Canadian Government', type: 'primary', description: 'Federal authority managing Arctic sovereignty claims.' },
                    { name: 'United States', type: 'secondary', description: 'Alaskan interests and military presence.' },
                    { name: 'Indigenous Arctic Governments', type: 'secondary', description: 'Autonomous native authorities with growing power.' },
                    { name: 'International Resource Corporations', type: 'trade_company', description: 'Companies exploiting newly accessible resources.' }
                ],
                structureNames: {
                    factory: ['Melting Permafrost Research Station', 'Resource Extraction Platform', 'Indigenous Cultural Center'],
                    trading_post: ['Arctic Shipping Route Hub', 'Climate Research Exchange']
                }
            }
        },
        "Mexico and Central Highlands": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Olmec Culture',
                dominantPowerDescription: 'The Olmec develop Mesoamerica\'s first complex civilization with monumental architecture and sophisticated art.',
                eraContextSentence: 'an age of colossal heads and jade, where the Olmec create the foundation of Mesoamerican civilization.',
                allegianceGroups: [
                    { name: 'Olmec Centers', type: 'primary', description: 'La Venta and other major ceremonial centers.' },
                    { name: 'Regional Chiefdoms', type: 'secondary', description: 'Smaller communities in Olmec sphere.' },
                    { name: 'Highland Peoples', type: 'secondary', description: 'Mountain valley agricultural groups.' }
                ],
                structureNames: {
                    fortress: ['Ceremonial Center', 'Elite Compound'],
                    holy_site: ['Colossal Head Plaza', 'Sacred Ballcourt'],
                    palace: ['Elite Platform', 'Ruler\'s Complex']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Aztec Empire',
                dominantPowerDescription: 'The Aztec Triple Alliance dominates central Mexico from their island capital of Tenochtitlan, the largest city in the Americas.',
                eraContextSentence: 'an era of feathered serpents and eagle warriors, where Tenochtitlan rules an empire from a lake.',
                allegianceGroups: [
                    { name: 'Aztec Empire', type: 'primary', description: 'Triple Alliance centered on Tenochtitlan.' },
                    { name: 'Tributary States', type: 'secondary', description: 'Conquered peoples paying tribute.' },
                    { name: 'Independent Enemies', type: 'rebel', description: 'Unconquered peoples like Tlaxcala.' },
                    { name: 'Maya City-States', type: 'secondary', description: 'Sophisticated civilization to the southeast.' }
                ],
                structureNames: {
                    fortress: ['Tenochtitlan Fortifications', 'Military Garrison'],
                    factory: ['Chinampas Agricultural System', 'Craft Workshop Quarter'],
                    holy_site: ['Great Temple (Templo Mayor)', 'Sacred Ballcourt'],
                    palace: ['Huey Tlatoani Palace', 'Noble Residence'],
                    trading_post: ['Great Market (Tlatelolco)', 'Tribute Collection Center']
                },
                courtRoles: {
                    palace: ['Huey Tlatoani', 'Cihuacoatl', 'Tlacaelel', 'High Priest', 'Eagle Warrior Captain']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Spanish Empire',
                dominantPowerDescription: 'Spanish conquest destroys the Aztec Empire and establishes the Viceroyalty of New Spain, creating a colonial society.',
                eraContextSentence: 'an era of conquest and conversion, where Spanish colonial rule transforms ancient Mexico.',
                allegianceGroups: [
                    { name: 'Spanish Empire', type: 'primary', description: 'Colonial viceroyalty government.' },
                    { name: 'Indigenous Nobles', type: 'secondary', description: 'Native aristocracy under Spanish rule.' },
                    { name: 'Mestizo Population', type: 'secondary', description: 'Mixed Spanish-indigenous peoples.' },
                    { name: 'Rebellious Tribes', type: 'rebel', description: 'Unconquered indigenous groups.' }
                ],
                structureNames: {
                    fortress: ['Spanish Presidio', 'Colonial Fort'],
                    factory: ['Silver Mine', 'Hacienda', 'Colonial Workshop'],
                    holy_site: ['Catholic Cathedral', 'Colonial Mission'],
                    palace: ['Viceregal Palace', 'Spanish Governor Residence'],
                    trading_post: ['Colonial Market', 'Silver Transport Center']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Mexico',
                dominantPowerDescription: 'Independent Mexico struggles with internal conflicts, foreign interventions, and the challenge of modernization.',
                eraContextSentence: 'an era of independence and turmoil, where Mexico fights to define itself as a modern nation.',
                allegianceGroups: [
                    { name: 'Mexican Republic', type: 'primary', description: 'Independent national government.' },
                    { name: 'United States', type: 'secondary', description: 'Expanding neighbor taking Mexican territory.' },
                    { name: 'French Empire', type: 'secondary', description: 'Intervention and imposed monarchy.' },
                    { name: 'Regional Caudillos', type: 'rebel', description: 'Local strongmen challenging central authority.' }
                ],
                structureNames: {
                    fortress: ['National Fort', 'State Military Base'],
                    factory: ['Modern Mine', 'Textile Factory', 'Railroad Workshop'],
                    trading_post: ['Railroad Terminal', 'Port Facility', 'Commercial District']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Mexico',
                dominantPowerDescription: 'Mexico modernizes and industrializes while maintaining complex relationships with the United States and managing internal social challenges.',
                eraContextSentence: 'an era of revolution and growth, where Mexico becomes a major regional power while preserving its cultural identity.',
                allegianceGroups: [
                    { name: 'Mexican Government', type: 'primary', description: 'Federal republic with strong presidency.' },
                    { name: 'United States', type: 'secondary', description: 'Major trading partner and cultural influence.' },
                    { name: 'Drug Cartels', type: 'rebel', description: 'Criminal organizations challenging state authority.' },
                    { name: 'Indigenous Rights Movement', type: 'secondary', description: 'Organizations advocating for native peoples.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Federal Police Station', 'Border Guard Post'],
                    factory: ['Maquiladora', 'Oil Refinery', 'Auto Assembly Plant'],
                    trading_post: ['International Airport', 'NAFTA Border Crossing', 'Container Port']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'Mexico',
                dominantPowerDescription: 'Mexico faces increasing pressure from climate migration, drug cartel violence, and complex relationships with an increasingly unstable United States.',
                eraContextSentence: 'an era of pressure and adaptation, where Mexico navigates between cartels, climate refugees, and American chaos.',
                allegianceGroups: [
                    { name: 'Mexican Government', type: 'primary', description: 'Federal republic managing multiple crises.' },
                    { name: 'Drug Cartels', type: 'rebel', description: 'Criminal organizations with territorial control.' },
                    { name: 'United States', type: 'secondary', description: 'Unstable neighbor creating refugee flows.' },
                    { name: 'Central American Climate Migrants', type: 'secondary', description: 'Mass migration due to environmental collapse.' }
                ],
                structureNames: {
                    factory: ['Border Security Complex', 'Climate Refugee Processing Center', 'Cartel Territory'],
                    trading_post: ['Cross-Border Trade Hub', 'Migrant Services Center']
                }
            }
        },
        "Northern Rockies": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Plateau Peoples',
                dominantPowerDescription: 'Hunter-gatherer societies develop sophisticated seasonal rounds exploiting diverse mountain and plateau resources.',
                eraContextSentence: 'an age of high country, where mountain peoples follow ancient paths between peaks and valleys.',
                allegianceGroups: [
                    { name: 'Plateau Peoples', type: 'primary', description: 'Interior mountain and plateau cultures.' },
                    { name: 'Northern Plains Peoples', type: 'secondary', description: 'Buffalo hunting groups to the east.' },
                    { name: 'Pacific Northwest Peoples', type: 'secondary', description: 'Coastal trading partners.' }
                ],
                structureNames: {
                    fortress: ['Mountain Refuge', 'Winter Village'],
                    factory: ['Root Processing Site', 'Hide Workshop'],
                    trading_post: ['Mountain Pass Trading Ground', 'Seasonal Gathering'],
                    holy_site: ['Sacred Peak', 'Vision Quest Site']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Interior Plateau Cultures',
                dominantPowerDescription: 'Sophisticated societies develop based on salmon fishing, root gathering, and extensive trade networks.',
                eraContextSentence: 'an era of salmon and camas, where plateau peoples perfect mountain living.',
                allegianceGroups: [
                    { name: 'Plateau Confederations', type: 'primary', description: 'Allied groups sharing seasonal territories.' },
                    { name: 'Mountain Hunting Bands', type: 'secondary', description: 'Specialized high-altitude hunters.' },
                    { name: 'River Valley Peoples', type: 'secondary', description: 'Salmon-dependent communities.' }
                ],
                structureNames: {
                    trading_post: ['Intertribal Gathering', 'Trade Rendezvous'],
                    holy_site: ['Sacred Fishing Site', 'Mountain Spirit Lodge']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Native American Nations',
                dominantPowerDescription: 'Plains horse culture influences mountain peoples while European trade goods arrive through indigenous networks.',
                eraContextSentence: 'an era of horses and change, where mountain peoples adapt to new ways while keeping old wisdom.',
                allegianceGroups: [
                    { name: 'Blackfoot Confederacy', type: 'primary', description: 'Powerful plains-mountain confederation.' },
                    { name: 'Shoshone Nations', type: 'secondary', description: 'Mountain and basin peoples.' },
                    { name: 'Nez Perce', type: 'secondary', description: 'Plateau horse culture specialists.' },
                    { name: 'European Trade Networks', type: 'secondary', description: 'Distant but growing influence.' }
                ],
                structureNames: {
                    trading_post: ['Horse Trading Rendezvous', 'Fur Trading Post'],
                    holy_site: ['Medicine Wheel', 'Sacred Hot Springs']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'American expansion brings miners, railroads, and territorial government while displacing Native peoples.',
                eraContextSentence: 'an era of gold fever and broken treaties, where prospectors and soldiers invade sacred mountains.',
                allegianceGroups: [
                    { name: 'United States', type: 'primary', description: 'Territorial and state governments.' },
                    { name: 'Native American Tribes', type: 'rebel', description: 'Resistance to land loss and confinement.' },
                    { name: 'Mining Companies', type: 'trade_company', description: 'Gold, silver, and copper extraction.' },
                    { name: 'Railroad Corporations', type: 'trade_company', description: 'Transcontinental transportation.' }
                ],
                structureNames: {
                    fortress: ['Army Fort', 'Mining Camp Defense'],
                    factory: ['Mining Operation', 'Smelter', 'Lumber Mill'],
                    trading_post: ['Railroad Town', 'Mining Supply Center', 'Cattle Ranch']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The Northern Rockies balance resource extraction with conservation while Native tribes regain some autonomy.',
                eraContextSentence: 'an era of wilderness and wealth, where conservation battles extraction in America\'s last frontier.',
                allegianceGroups: [
                    { name: 'United States', type: 'primary', description: 'Federal and state governments.' },
                    { name: 'Environmental Movement', type: 'secondary', description: 'Conservation and wilderness advocacy.' },
                    { name: 'Resource Industries', type: 'trade_company', description: 'Logging, mining, and energy companies.' },
                    { name: 'Tribal Governments', type: 'secondary', description: 'Sovereign Native American nations.' }
                ],
                structureNames: {
                    fortress: ['Air Force Base', 'National Guard Facility'],
                    factory: ['Logging Operation', 'Mine', 'Ski Resort', 'National Park'],
                    trading_post: ['Interstate Highway Hub', 'Tourist Center', 'Commodity Shipping']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The Northern Rockies become a refuge for political and climate migrants while resource extraction intensifies amid weakening federal environmental protection.',
                eraContextSentence: 'an era of last refuge, where mountain communities face an influx of climate refugees and corporate exploitation.',
                allegianceGroups: [
                    { name: 'United States Federal Government', type: 'primary', description: 'Weakened federal authority with reduced regulatory power.' },
                    { name: 'Resource Extraction Corporations', type: 'trade_company', description: 'Mining and energy companies with increased political influence.' },
                    { name: 'Climate Refugee Communities', type: 'secondary', description: 'Internal migrants seeking cooler climates.' },
                    { name: 'Militia and Survivalist Groups', type: 'rebel', description: 'Armed groups preparing for social collapse.' }
                ],
                structureNames: {
                    factory: ['Emergency Mining Operation', 'Climate Refugee Settlement', 'Militia Compound'],
                    trading_post: ['Resource Export Hub', 'Survivalist Supply Center']
                }
            }
        },
        "Atlantic Coast": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Eastern Woodland Peoples',
                dominantPowerDescription: 'Diverse hunter-gatherer societies develop along the Atlantic coast, exploiting both marine and terrestrial resources.',
                eraContextSentence: 'an age of shell and forest, where coastal peoples master the meeting of land and sea.',
                allegianceGroups: [
                    { name: 'Coastal Peoples', type: 'primary', description: 'Maritime-adapted communities.' },
                    { name: 'Interior Forest Peoples', type: 'secondary', description: 'Woodland hunter-gatherers.' },
                    { name: 'River Valley Peoples', type: 'secondary', description: 'Communities along major rivers.' }
                ],
                structureNames: {
                    fortress: ['Coastal Village', 'Shell Midden Settlement'],
                    factory: ['Shell Tool Workshop', 'Fish Processing Site'],
                    trading_post: ['Coastal Trading Ground', 'River Mouth Market'],
                    holy_site: ['Sacred Mound', 'Ancestor Shell Ring']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Atlantic Woodland Cultures',
                dominantPowerDescription: 'Agricultural societies flourish along the coast while maintaining extensive trade networks with inland peoples.',
                eraContextSentence: 'an era of three sisters and trade, where coastal farmers connect forest to sea.',
                allegianceGroups: [
                    { name: 'Coastal Agricultural Peoples', type: 'primary', description: 'Farming communities along the coast.' },
                    { name: 'Interior Trading Partners', type: 'secondary', description: 'Woodland peoples participating in trade.' },
                    { name: 'Northern Confederations', type: 'secondary', description: 'Iroquoian and Algonquian alliances.' }
                ],
                structureNames: {
                    fortress: ['Palisaded Coastal Town', 'Fortified Village'],
                    trading_post: ['Intertribal Trading Center', 'Coastal Exchange']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'British Colonial Empire',
                dominantPowerDescription: 'English colonization establishes permanent settlements, creating a new society while displacing indigenous peoples.',
                eraContextSentence: 'an era of two worlds colliding, where English planters create new societies on ancient shores.',
                allegianceGroups: [
                    { name: 'British Empire', type: 'primary', description: 'Colonial government and English settlers.' },
                    { name: 'Native American Confederations', type: 'rebel', description: 'Indigenous resistance to colonization.' },
                    { name: 'Dutch Empire', type: 'secondary', description: 'Rival colonial power in Mid-Atlantic.' },
                    { name: 'African Enslaved Peoples', type: 'rebel', description: 'Forced laborers resisting bondage.' }
                ],
                structureNames: {
                    fortress: ['Colonial Fort', 'Plantation House', 'Blockhouse'],
                    factory: ['Tobacco Plantation', 'Rice Plantation', 'Naval Stores'],trading_post: ['Colonial Port', 'Tobacco Wharf', 'Slave Market'],
                    holy_site: ['Anglican Church', 'Puritan Meetinghouse', 'Catholic Mission']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'American independence transforms the Atlantic Coast into the commercial and political heart of the new republic.',
                eraContextSentence: 'an era of new nationhood, where former colonies become the foundation of American power.',
                allegianceGroups: [
                    { name: 'United States', type: 'primary', description: 'The new federal republic.' },
                    { name: 'British Empire', type: 'secondary', description: 'Former colonial master and ongoing rival.' },
                    { name: 'Merchant Capitalists', type: 'trade_company', description: 'Commercial elites driving economic growth.' },
                    { name: 'Enslaved African Americans', type: 'rebel', description: 'Continuing resistance to bondage.' }
                ],
                structureNames: {
                    fortress: ['Coastal Defense Fort', 'Naval Base', 'Harbor Fort'],
                    factory: ['Textile Mill', 'Shipyard', 'Iron Works', 'Cotton Mill'],
                    trading_post: ['Commercial Port', 'Railroad Terminal', 'Custom House'],
                    palace: ['State Capitol', 'Federal Building', 'Merchant Mansion']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The Atlantic Coast becomes the global center of American financial and political power, with massive cities dominating the economy.',
                eraContextSentence: 'an era of global dominance, where the Atlantic corridor commands world finance and politics.',
                allegianceGroups: [
                    { name: 'United States Federal Government', type: 'primary', description: 'Center of American political power.' },
                    { name: 'Wall Street Financial Sector', type: 'trade_company', description: 'Global financial center.' },
                    { name: 'Academic Elite', type: 'secondary', description: 'Ivy League and major universities.' },
                    { name: 'Organized Crime', type: 'rebel', description: 'Mafia and criminal syndicates.' }
                ],
                structureNames: {
                    fortress: ['Pentagon', 'Naval Station', 'Air Base'],
                    factory: ['Financial District', 'Corporate Headquarters', 'Media Complex'],
                    trading_post: ['International Airport', 'Container Port', 'Stock Exchange'],
                    palace: ['White House', 'Capitol Building', 'Federal Reserve']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The Atlantic Coast faces increasing climate disasters and political instability while remaining the center of declining American hegemony.',
                eraContextSentence: 'an era of imperial twilight, where the centers of power confront rising seas and falling legitimacy.',
                allegianceGroups: [
                    { name: 'United States Federal Government', type: 'primary', description: 'Increasingly dysfunctional federal authority.' },
                    { name: 'Financial Corporations', type: 'trade_company', description: 'Wall Street maintaining influence despite domestic chaos.' },
                    { name: 'Climate Refugee Populations', type: 'secondary', description: 'Internal migrants from climate disasters.' },
                    { name: 'Political Extremist Networks', type: 'rebel', description: 'Groups challenging federal authority.' }
                ],
                structureNames: {
                    factory: ['Flood Barrier System', 'Financial Fortress', 'Climate Crisis Center'],
                    trading_post: ['International Crisis Hub', 'Refugee Processing Center']
                }
            }
        }
    }
};