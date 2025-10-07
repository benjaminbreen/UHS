
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
        "Northern California": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Californian Indigenous Peoples',
                dominantPowerDescription: 'Diverse hunter-gatherer societies like the Miwok, Pomo, and Ohlone thrive on acorns, fish, and game, developing complex social structures.',
                eraContextSentence: 'an age of oak and salmon, where hundreds of tribelets build a rich and complex world.',
                allegianceGroups: [
                    { name: 'Miwok Peoples', type: 'primary', description: 'Dominant group of the Central Valley and Sierra foothills.' },
                    { name: 'Ohlone Peoples', type: 'secondary', description: 'Coastal groups of the San Francisco Bay area.' },
                    { name: 'Pomo Peoples', type: 'secondary', description: 'Skilled basket makers of the northern coast ranges.' }
                ],
                structureNames: {
                    fortress: ['Fortified Village', 'Hilltop Refuge'],
                    factory: ['Acorn Processing Site', 'Basket Weaving Center'],
                    holy_site: ['Sacred Grove', 'Ceremonial Roundhouse'],
                    palace: ['Headman\'s Dwelling', 'Council Lodge']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Regional Tribal Confederacies',
                dominantPowerDescription: 'Inter-tribal trade and diplomacy flourish, with complex networks for obsidian, shells, and other goods connecting the coast to the interior.',
                eraContextSentence: 'an era of trade and tradition, where ancient pathways connect diverse peoples and cultures.',
                allegianceGroups: [
                    { name: 'Bay Area Confederacies', type: 'primary', description: 'Alliances of Ohlone and Miwok villages.' },
                    { name: 'Interior Valley Tribes', type: 'secondary', description: 'Patwin and Nisenan peoples of the Sacramento Valley.' },
                    { name: 'Northern Coastal Tribes', type: 'secondary', description: 'Yurok and Karuk peoples.' }
                ],
                structureNames: {
                    trading_post: ['Obsidian Trade Hub', 'Shell Bead Market']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Spanish Empire / Russian Colonialism',
                dominantPowerDescription: 'The Spanish establish missions along the coast while Russian fur traders build a presence at Fort Ross, disrupting native life.',
                eraContextSentence: 'an era of missions and forts, where Spanish and Russian empires encroach upon ancient tribal lands.',
                allegianceGroups: [
                    { name: 'Spanish Empire', type: 'primary', description: 'Mission system centered in the Bay Area.' },
                    { name: 'Russian-American Company', type: 'secondary', description: 'Fur trading outpost at Fort Ross.' },
                    { name: 'Californian Native Peoples', type: 'rebel', description: 'Resistance and adaptation to colonial pressures.' },
                    { name: 'Mexican Republic', type: 'secondary', description: 'Inherits control from Spain after 1821.' }
                ],
                structureNames: {
                    fortress: ['Spanish Presidio', 'Fort Ross'],
                    factory: ['Mission Workshop', 'Sea Otter Hunting Post'],
                    holy_site: ['Mission Dolores', 'Native Sacred Site']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The Gold Rush triggers a massive influx of settlers, leading to California statehood, the genocide of native peoples, and rapid development.',
                eraContextSentence: 'an era of gold fever and statehood, where a tidal wave of humanity reshapes the land forever.',
                allegianceGroups: [
                    { name: 'United States', type: 'primary', description: 'State and federal government.' },
                    { name: 'Gold Rush Miners', type: 'secondary', description: 'The "Forty-Niners" from around the world.' },
                    { name: 'Railroad Barons', type: 'trade_company', description: 'Builders of the transcontinental railroad.' },
                    { name: 'Surviving Native Tribes', type: 'rebel', description: 'Remnants of indigenous populations resisting annihilation.' }
                ],
                structureNames: {
                    fortress: ['US Army Fort', 'Vigilante Committee Headquarters'],
                    factory: ['Hydraulic Mine', 'Lumber Mill', 'Railroad Yard'],
                    trading_post: ['Mining Supply Town', 'San Francisco Port', 'Railroad Depot']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The region becomes a global center of technology, counter-culture, and finance, centered on the San Francisco Bay Area.',
                eraContextSentence: 'an era of silicon and innovation, where Bay Area visionaries change the world.',
                allegianceGroups: [
                    { name: 'United States', type: 'primary', description: 'Federal and state governments.' },
                    { name: 'Tech Industry (Silicon Valley)', type: 'trade_company', description: 'Dominant global technology corporations.' },
                    { name: 'Counter-Culture Movements', type: 'secondary', description: 'Social and political activists.' },
                    { name: 'Agricultural Corporations', type: 'trade_company', description: 'Industrial farming in the Central Valley.' }
                ],
                structureNames: {
                    fortress: ['Naval Base Alameda', 'Presidio of San Francisco (former)'],
                    factory: ['Tech Campus', 'Skyscraper Financial District', 'Winery'],
                    trading_post: ['San Francisco International Airport', 'Port of Oakland', 'Venture Capital Hub']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'Northern California grapples with extreme wealth inequality, catastrophic wildfires, and political battles over resources and technology\'s role in society.',
                eraContextSentence: 'an era of fire and code, where technological utopias clash with climate dystopias.',
                allegianceGroups: [
                    { name: 'United States Federal Government', type: 'primary', description: 'Often in conflict with state policies.' },
                    { name: 'Big Tech Corporations', type: 'trade_company', description: 'Increasingly powerful quasi-governmental entities.' },
                    { name: 'Climate Resilience Movement', type: 'secondary', description: 'Groups focused on wildfire and sea-level rise adaptation.' },
                    { name: 'Secessionist Movements', type: 'rebel', description: 'Groups advocating for regional independence.' }
                ],
                structureNames: {
                    factory: ['AI Development Center', 'Wildfire Defense Grid', 'Managed Retreat Zone'],
                    trading_post: ['Global Tech Hub', 'Climate Data Analysis Center']
                }
            }
        },
        "Central California Coast": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Chumash and Salinan Peoples',
                dominantPowerDescription: 'Sophisticated maritime cultures thrive, with the Chumash developing advanced plank canoes (tomols) for fishing and trade.',
                eraContextSentence: 'an age of sea and coast, where the Chumash people build a civilization from the ocean\'s bounty.',
                allegianceGroups: [
                    { name: 'Chumash Peoples', type: 'primary', description: 'Dominant maritime society.' },
                    { name: 'Salinan Peoples', type: 'secondary', description: 'Inland and coastal groups to the north.' },
                    { name: 'Esselen Peoples', type: 'secondary', description: 'Tribes of the Big Sur coast.' }
                ],
                structureNames: {
                    fortress: ['Coastal Village', 'Hilltop Settlement'],
                    factory: ['Tomol Building Site', 'Shell Bead Workshop'],
                    trading_post: ['Coastal Trading Village', 'Inland Trade Route']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Chumash Chiefdoms',
                dominantPowerDescription: 'Large, densely populated villages are governed by chiefs, participating in a wide-ranging trade network connecting the coast, islands, and interior.',
                eraContextSentence: 'an era of powerful chiefs, where tomol canoes ply the waters of a thriving coastal economy.',
                allegianceGroups: [
                    { name: 'Coastal Chumash Chiefdoms', type: 'primary', description: 'Hierarchical societies along the Santa Barbara Channel.' },
                    { name: 'Interior Chumash', type: 'secondary', description: 'Groups in the inland valleys.' },
                    { name: 'Neighboring Tribes', type: 'secondary', description: 'Salinan and Yokuts trading partners.' }
                ],
                structureNames: {
                    palace: ['Chief\'s Residence', 'Ceremonial Dance Ground']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Spanish Empire',
                dominantPowerDescription: 'Spanish colonization establishes missions and the presidio at Monterey, which becomes the capital of Alta California.',
                eraContextSentence: 'an era of cross and crown, where Monterey stands as the capital of Spain\'s California colony.',
                allegianceGroups: [
                    { name: 'Spanish Empire', type: 'primary', description: 'Colonial administration centered in Monterey.' },
                    { name: 'Missionized Native Peoples', type: 'secondary', description: 'Chumash and Salinan populations under mission control.' },
                    { name: 'Mexican Republic', type: 'secondary', description: 'Assumes control after 1821.' }
                ],
                structureNames: {
                    fortress: ['Presidio of Monterey', 'Mission Compound'],
                    factory: ['Mission Farm', 'Cattle Ranch'],
                    trading_post: ['Colonial Port of Monterey', 'El Camino Real stop']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'Following American acquisition, the region develops an economy based on agriculture, fishing, and cattle ranching.',
                eraContextSentence: 'an era of fields and fisheries, where the Salinas Valley becomes the nation\'s salad bowl.',
                allegianceGroups: [
                    { name: 'United States', type: 'primary', description: 'State and local governments.' },
                    { name: 'Agricultural Barons', type: 'trade_company', description: 'Large landowners in the Salinas Valley.' },
                    { name: 'Fishing Industry', type: 'trade_company', description: 'Whaling and sardine canning in Monterey.' }
                ],
                structureNames: {
                    factory: ['Sardine Cannery', 'Industrial Farm', 'Cattle Ranch'],
                    trading_post: ['Fishing Wharf', 'Railroad Depot']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The region becomes a major center for tourism, agriculture, and marine science, with a strong military presence.',
                eraContextSentence: 'an era of tourism and science, where coastal beauty drives a modern economy.',
                allegianceGroups: [
                    { name: 'United States', type: 'primary', description: 'Federal, state, and local governments.' },
                    { name: 'Tourism Industry', type: 'trade_company', description: 'Hotels, resorts, and attractions.' },
                    { name: 'Agribusiness', type: 'trade_company', description: 'Large-scale agriculture.' },
                    { name: 'Scientific Community', type: 'secondary', description: 'Marine research institutions.' }
                ],
                structureNames: {
                    fortress: ['Fort Hunter Liggett', 'Naval Postgraduate School'],
                    factory: ['Winery', 'Artichoke Farm', 'Marine Research Lab'],
                    trading_post: ['Tourist Resort', 'Agricultural Shipping Hub']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The Central Coast faces critical challenges from sea-level rise, water shortages for agriculture, and increasing wildfire threats.',
                eraContextSentence: 'an era of rising tides and thirsty fields, where communities struggle to balance nature and economy.',
                allegianceGroups: [
                    { name: 'United States Government', type: 'primary', description: 'Managing climate and resource conflicts.' },
                    { name: 'Water Management Agencies', type: 'secondary', description: 'Controlling scarce water resources.' },
                    { name: 'Environmental Protection Groups', type: 'secondary', description: 'Advocating for conservation and managed retreat.' },
                    { name: 'Agricultural Technology Firms', type: 'trade_company', description: 'Developing drought-resistant farming methods.' }
                ],
                structureNames: {
                    factory: ['Desalination Plant', 'Coastal Retreat Project', 'Agri-Tech Research Center'],
                    trading_post: ['Water Rights Market', 'Climate Adaptation Hub']
                }
            }
        },
        "Southern California": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Tongva and Kumeyaay Peoples',
                dominantPowerDescription: 'Complex hunter-gatherer societies establish large villages and trade networks between the coast and the inland deserts.',
                eraContextSentence: 'an age of coastal villages, where the Tongva and Kumeyaay peoples master a sun-drenched landscape.',
                allegianceGroups: [
                    { name: 'Tongva Peoples', type: 'primary', description: 'Dominant group of the Los Angeles Basin.' },
                    { name: 'Kumeyaay Peoples', type: 'secondary', description: 'Tribes of the San Diego region.' },
                    { name: 'Chumash Peoples', type: 'secondary', description: 'Coastal groups to the north.' }
                ],
                structureNames: {
                    fortress: ['Large Village', 'Coastal Settlement'],
                    factory: ['Shell Fishhook Workshop', 'Oak Grove Processing'],
                    trading_post: ['Coastal-Inland Trade Route', 'Island Trade Ferry']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Regional Chiefdoms',
                dominantPowerDescription: 'The population grows, and social complexity increases, with powerful chiefs managing trade, resources, and ritual.',
                eraContextSentence: 'an era of powerful chiefs, where coastal societies flourish before the arrival of outsiders.',
                allegianceGroups: [
                    { name: 'Tongva Chiefdoms', type: 'primary', description: 'Alliances centered on major villages like Yaanga.' },
                    { name: 'Kumeyaay Bands', type: 'secondary', description: 'Independent but related groups.' }
                ],
                structureNames: {
                    palace: ['Chief\'s Dwelling Complex', 'Ceremonial Plaza']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Spanish Empire',
                dominantPowerDescription: 'Spain establishes missions at San Diego and Los Angeles, creating the foundation for the region\'s major cities.',
                eraContextSentence: 'an era of pueblos and missions, where Spain lays the groundwork for a new California.',
                allegianceGroups: [
                    { name: 'Spanish Empire', type: 'primary', description: 'Colonial rule through missions, pueblos, and presidios.' },
                    { name: 'Pueblo de Los Ángeles', type: 'secondary', description: 'The nascent civilian settlement.' },
                    { name: 'Native Resistance', type: 'rebel', description: 'Indigenous revolts against Spanish domination.' }
                ],
                structureNames: {
                    fortress: ['Presidio of San Diego', 'Mission San Gabriel Arcángel'],
                    factory: ['Cattle Rancho', 'Mission Vineyard'],
                    holy_site: ['Catholic Mission Church', 'Native Sacred Site']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'After the Mexican-American War, the region experiences land booms, the discovery of oil, and the birth of the Hollywood film industry.',
                eraContextSentence: 'an era of oil, oranges, and celluloid, where a new American dream is born under the California sun.',
                allegianceGroups: [
                    { name: 'United States', type: 'primary', description: 'State and federal authority.' },
                    { name: 'Land Speculators', type: 'trade_company', description: 'Promoters of the region\'s growth.' },
                    { name: 'Oil Barons', type: 'trade_company', description: 'Early petroleum industry leaders.' },
                    { name: 'Early Film Studios', type: 'trade_company', description: 'The founders of Hollywood.' }
                ],
                structureNames: {
                    fortress: ['Coastal Artillery Fort', 'Army Post'],
                    factory: ['Oil Derrick', 'Citrus Packing House', 'Movie Studio'],
                    trading_post: ['Port of Los Angeles', 'Railroad Terminus']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'Southern California becomes a sprawling megalopolis, driven by the aerospace, defense, and entertainment industries.',
                eraContextSentence: 'an era of freeways and suburbs, where Southern California becomes a global cultural and economic powerhouse.',
                allegianceGroups: [
                    { name: 'United States', type: 'primary', description: 'Federal, state, and local governments.' },
                    { name: 'Entertainment Industry', type: 'trade_company', description: 'Hollywood studios and media giants.' },
                    { name: 'Aerospace & Defense Contractors', type: 'trade_company', description: 'Major suppliers for the military-industrial complex.' },
                    { name: 'Diverse Immigrant Communities', type: 'secondary', description: 'Populations from around the world, especially Latin America and Asia.' }
                ],
                structureNames: {
                    fortress: ['Naval Base San Diego', 'Edwards Air Force Base', 'Marine Corps Base Camp Pendleton'],
                    factory: ['Movie Studio Backlot', 'Aerospace Plant', 'Suburban Development'],
                    trading_post: ['Los Angeles International Airport (LAX)', 'Container Port Complex', 'Freeway Interchange']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The region faces an existential crisis due to extreme water shortages, wildfires, and immense social stratification, leading to political instability.',
                eraContextSentence: 'an era of drought and division, where the California dream is threatened by environmental limits and social fractures.',
                allegianceGroups: [
                    { name: 'United States Government', type: 'primary', description: 'Struggling to manage cascading crises.' },
                    { name: 'Water Authorities', type: 'secondary', description: 'Powerful entities rationing a dwindling resource.' },
                    { name: 'Private Security Forces', type: 'rebel', description: 'Protecting wealthy enclaves from social unrest.' },
                    { name: 'Climate Migrant Communities', type: 'secondary', description: 'Populations displaced by fire and drought.' }
                ],
                structureNames: {
                    factory: ['Water Recycling Plant', 'Gated Community Fortress', 'Firefighting Super-Hub'],
                    trading_post: ['Border Checkpoint', 'Resource Rationing Center']
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
        "Northeastern Seaboard": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Woodland Cultures',
                dominantPowerDescription: 'Forest peoples develop sophisticated societies based on hunting, gathering, and early agriculture in the forests and along the coasts.',
                eraContextSentence: 'an age of forest wisdom, where woodland peoples master the secrets of the eastern forests and shores.',
                allegianceGroups: [
                    { name: 'Eastern Algonquian Peoples', type: 'primary', description: 'Various coastal and riverine groups.' },
                    { name: 'Early Iroquoian Groups', type: 'secondary', description: 'Inland peoples of the Great Lakes region.' },
                    { name: 'Maritime Archaic Peoples', type: 'secondary', description: 'Coastal hunting and fishing groups.' }
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
                dominantPowerDescription: 'The Five Nations (Haudenosaunee) create a sophisticated democratic confederation while agricultural villages flourish throughout the region.',
                eraContextSentence: 'an era of the Great Peace, where the Iroquois Confederacy brings unity to the eastern woodlands.',
                allegianceGroups: [
                    { name: 'Iroquois Confederacy', type: 'primary', description: 'Five Nations democratic alliance.' },
                    { name: 'Algonquian Peoples', type: 'secondary', description: 'Various eastern woodland tribes, often rivals of the Iroquois.' },
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
                dominantPowerDescription: 'English, Dutch, and French colonization creates permanent settlements while the Iroquois maintain power as crucial allies and rivals.',
                eraContextSentence: 'an era of new beginnings and conflict, where European colonists and Native diplomats reshape the continent.',
                allegianceGroups: [
                    { name: 'British Empire', type: 'primary', description: 'Colonial government and settlers in New England and Mid-Atlantic.' },
                    { name: 'Iroquois Confederacy', type: 'secondary', description: 'Native American diplomatic and military power.' },
                    { name: 'French Empire', type: 'secondary', description: 'Rival colonial power to the north.' },
                    { name: 'Dutch Republic', type: 'secondary', description: 'Trading presence in the Hudson Valley (New Netherland).' }
                ],
                structureNames: {
                    fortress: ['Colonial Fort (e.g., Fort Ticonderoga)', 'Frontier Stockade'],
                    factory: ['Colonial Mill', 'Shipyard', 'Ironworks'],
                    trading_post: ['Colonial Port (e.g., Boston, New York)', 'Fur Trading Center'],
                    holy_site: ['Puritan Meetinghouse', 'Anglican Church', 'Native Council Fire']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The region becomes the industrial and financial heart of the expanding nation, with massive cities, factory complexes, and waves of immigration.',
                eraContextSentence: 'an era of steam and steel, where the Northeast forges the industrial destiny of America.',
                allegianceGroups: [
                    { name: 'United States', type: 'primary', description: 'Federal and state governments.' },
                    { name: 'Industrial Capitalists', type: 'trade_company', description: 'Factory owners and financial magnates.' },
                    { name: 'European Immigrant Communities', type: 'secondary', description: 'Irish, German, Italian, and other immigrants providing labor.' },
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
                dominantPowerDescription: 'The Northeast remains the political, financial, and cultural center of America while transitioning from manufacturing to services and technology.',
                eraContextSentence: 'an era of global influence, where decisions in Manhattan and Washington shape the world.',
                allegianceGroups: [
                    { name: 'United States Federal Government', type: 'primary', description: 'Political center in Washington DC.' },
                    { name: 'Financial Industry', type: 'trade_company', description: 'Wall Street and banking sector.' },
                    { name: 'Academic Institutions', type: 'secondary', description: 'Ivy League and major universities.' },
                    { name: 'Organized Crime', type: 'rebel', description: 'Mafia and crime syndicates.' }
                ],
                structureNames: {
                    fortress: ['The Pentagon', 'Naval Academy', 'West Point'],
                    factory: ['Financial District', 'University Campus', 'Tech Research Center'],
                    trading_post: ['International Airport', 'Financial Exchange', 'Port Authority'],
                    palace: ['The White House', 'U.S. Capitol Building', 'Federal Reserve']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'United States',
                dominantPowerDescription: 'The Northeast remains the center of American power but faces increasing political instability, infrastructure decay, and climate-related pressures from sea-level rise.',
                eraContextSentence: 'an era of crumbling empire, where the centers of power struggle with internal division and rising tides.',
                allegianceGroups: [
                    { name: 'United States Federal Government', type: 'primary', description: 'Increasingly dysfunctional federal authority.' },
                    { name: 'Financial Corporations', type: 'trade_company', description: 'Wall Street maintaining global influence despite domestic chaos.' },
                    { name: 'Political Extremist Groups', type: 'rebel', description: 'Both left and right-wing organizations challenging the system.' },
                    { name: 'International Allies', type: 'secondary', description: 'Foreign governments concerned about American stability.' }
                ],
                structureNames: {
                    factory: ['Failing Infrastructure Complex', 'Political Crisis Center', 'Sea Wall Project'],
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
        "Canada": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'First Nations',
                dominantPowerDescription: 'A vast and diverse population of indigenous peoples, from Iroquoian farmers in the east to Algonquian hunters of the Shield and Plains bison hunters.',
                eraContextSentence: 'an age of countless nations, where peoples live in balance with a vast and challenging land.',
                allegianceGroups: [
                    { name: 'Algonquian Peoples', type: 'primary', description: 'Widespread hunter-gatherers of the boreal forest.' },
                    { name: 'Iroquoian Peoples', type: 'secondary', description: 'Agriculturalists of the Great Lakes region.' },
                    { name: 'Plains First Nations', type: 'secondary', description: 'Bison-hunting cultures of the prairies.' }
                ],
                structureNames: {
                    fortress: ['Fortified Village', 'Seasonal Camp'],
                    factory: ['Tool Workshop', 'Hide Processing Site'],
                    trading_post: ['River Confluence Market', 'Trail Rendezvous']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Indigenous Confederacies',
                dominantPowerDescription: 'Sophisticated political entities like the Huron-Wendat and Iroquois Confederacies emerge, while Norse explorers make brief contact in the east.',
                eraContextSentence: 'an era of confederacies and councils, where powerful First Nations govern their territories.',
                allegianceGroups: [
                    { name: 'Huron-Wendat Confederacy', type: 'primary', description: 'Powerful Iroquoian confederacy in the Great Lakes.' },
                    { name: 'Iroquois Confederacy', type: 'secondary', description: 'The Five Nations south of the St. Lawrence.' },
                    { name: 'Norse Explorers', type: 'secondary', description: 'Brief settlements in Newfoundland (Vinland).' }
                ],
                structureNames: {
                    fortress: ['Palisaded Longhouse Village', 'Defensive Earthwork'],
                    palace: ['Council Longhouse', 'Chief\'s Residence']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'French and British Colonial Competition',
                dominantPowerDescription: 'France establishes New France along the St. Lawrence, driven by the fur trade, while Britain founds the Hudson\'s Bay Company and seizes Acadia.',
                eraContextSentence: 'an era of fur and faith, where European empires compete for control of the continent\'s northern half.',
                allegianceGroups: [
                    { name: 'French Empire (New France)', type: 'primary', description: 'Colonial power centered in Quebec.' },
                    { name: 'British Empire (Hudson\'s Bay Company)', type: 'secondary', description: 'Fur trading monopoly controlling the north.' },
                    { name: 'First Nations Allies', type: 'secondary', description: 'Indigenous groups allied with European powers.' },
                    { name: 'Iroquois Confederacy', type: 'rebel', description: 'Independent power playing empires against each other.' }
                ],
                structureNames: {
                    fortress: ['Stone Fort (e.g., Quebec City)', 'Hudson\'s Bay Company Fort'],
                    factory: ['Fur Trading Post', 'Seigneurial Farm'],
                    trading_post: ['Voyageur Canoe Depot', 'Coastal Fishing Station']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Dominion of Canada',
                dominantPowerDescription: 'Following British conquest, the colonies unite in Confederation (1867) and expand westward via the railway, suppressing native and Metis resistance.',
                eraContextSentence: 'an era of steel rails and dominion, where a new nation is forged from sea to sea.',
                allegianceGroups: [
                    { name: 'Dominion of Canada', type: 'primary', description: 'The newly formed semi-independent nation within the British Empire.' },
                    { name: 'British Empire', type: 'secondary', description: 'The overarching imperial power.' },
                    { name: 'Metis Nation', type: 'rebel', description: 'Led by Louis Riel in resistance to Canadian expansion.' },
                    { name: 'Canadian Pacific Railway', type: 'trade_company', description: 'The corporation binding the country together.' }
                ],
                structureNames: {
                    fortress: ['RCMP Fort', 'Militia Barracks', 'Coastal Defense Battery'],
                    factory: ['Grain Elevator', 'Lumber Mill', 'Textile Factory'],
                    trading_post: ['Railway Station', 'Prairie Town', 'Great Lakes Port']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Canada',
                dominantPowerDescription: 'Canada comes of age as a fully independent nation, playing a significant role in world affairs and developing a resource-based economy and social safety net.',
                eraContextSentence: 'an era of middle power, where Canada defines its identity through multiculturalism, peacekeeping, and resource wealth.',
                allegianceGroups: [
                    { name: 'Government of Canada', type: 'primary', description: 'The federal parliamentary democracy.' },
                    { name: 'United States', type: 'secondary', description: 'Dominant neighbor and trading partner.' },
                    { name: 'Quebec Separatist Movement', type: 'rebel', description: 'Advocates for Quebec\'s independence.' },
                    { name: 'Resource Corporations', type: 'trade_company', description: 'Oil, mining, and forestry companies.' }
                ],
                structureNames: {
                    fortress: ['Canadian Forces Base', 'NORAD Station'],
                    factory: ['Oil Sands Plant', 'Hydroelectric Dam', 'Automotive Assembly Plant'],
                    trading_post: ['International Airport', 'St. Lawrence Seaway Lock', 'Trans-Canada Highway Hub']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'Canada',
                dominantPowerDescription: 'As the Arctic melts, Canada faces challenges to its sovereignty and environment, while potentially becoming a global refuge from climate change and political instability.',
                eraContextSentence: 'an era of melting borders, where Canada navigates the opportunities and perils of a warming world.',
                allegianceGroups: [
                    { name: 'Government of Canada', type: 'primary', description: 'Asserting Arctic sovereignty and managing climate migration.' },
                    { name: 'Indigenous Governments', type: 'secondary', description: 'First Nations with increasing autonomy and land control.' },
                    { name: 'International Powers', type: 'secondary', description: 'Nations contesting Arctic shipping routes.' },
                    { name: 'Climate Migrants', type: 'secondary', description: 'Populations moving north to escape worse climate impacts.' }
                ],
                structureNames: {
                    factory: ['Arctic Deepwater Port', 'Climate Adaptation Research Center', 'Freshwater Export Facility'],
                    trading_post: ['Northern Sea Route Toll Station', 'Climate Refugee Processing Center']
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
                dominantPower: 'Teotihuacan Civilization',
                dominantPowerDescription: 'The great city of Teotihuacan dominates Mesoamerica, building monumental pyramids and influencing cultures from the Maya to the Zapotec.',
                eraContextSentence: 'an age of gods and pyramids, where the city of Teotihuacan casts its shadow over all of Mesoamerica.',
                allegianceGroups: [
                    { name: 'Teotihuacan', type: 'primary', description: 'The dominant metropolis of the Classic Period.' },
                    { name: 'Olmec Precursors', type: 'secondary', description: 'The foundational "mother culture" of Mesoamerica.' },
                    { name: 'Zapotec Civilization', type: 'secondary', description: 'Rival power centered at Monte Albán.' }
                ],
                structureNames: {
                    fortress: ['Citadel', 'Fortified Palace Compound'],
                    factory: ['Obsidian Workshop', 'Mass Pottery Production'],
                    holy_site: ['Pyramid of the Sun', 'Pyramid of the Moon'],
                    palace: ['Palace of Quetzalpapalotl', 'Avenue of the Dead Complex'],
                    trading_post: ['Great Compound Market', 'Foreign Merchant Barrio']
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
                    { name: 'Post-Classic Maya City-States', type: 'secondary', description: 'Declining but still sophisticated civilization to the southeast.' }
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
                dominantPowerDescription: 'Mexico modernizes and industrializes while managing complex relationships with the United States and internal social challenges.',
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
        "Central America": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Pre-Classic Maya Civilization',
                dominantPowerDescription: 'Early Maya city-states emerge in the lowlands, developing sophisticated writing, calendars, and monumental architecture.',
                eraContextSentence: 'an age of emerging kings, where the foundations of Maya civilization are laid among the jungle pyramids.',
                allegianceGroups: [
                    { name: 'Early Maya City-States', type: 'primary', description: 'Centers like El Mirador and Nakbe.' },
                    { name: 'Olmec Influence', type: 'secondary', description: 'Cultural inheritance from the earlier Gulf Coast civilization.' },
                    { name: 'Isthmian Cultures', type: 'secondary', description: 'Peoples of the Panama and Costa Rica region.' }
                ],
                structureNames: {
                    fortress: ['Ceremonial Complex', 'Early Pyramid'],
                    holy_site: ['Stela with Glyphs', 'Early Ballcourt']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Classic Maya Civilization',
                dominantPowerDescription: 'A network of powerful, warring city-states like Tikal, Calakmul, and Copan reaches its artistic and intellectual peak before a mysterious decline.',
                eraContextSentence: 'an era of divine kings and jungle cities, where Maya civilization blossoms in a landscape of war and ritual.',
                allegianceGroups: [
                    { name: 'Tikal Hegemony', type: 'primary', description: 'One of the two major Maya superpowers.' },
                    { name: 'Calakmul Hegemony (Snake Kingdom)', type: 'rebel', description: 'The primary rival to Tikal.' },
                    { name: 'Independent City-States', type: 'secondary', description: 'Cities like Copan and Palenque navigating between the superpowers.' }
                ],
                structureNames: {
                    fortress: ['Fortified City Center', 'Royal Acropolis'],
                    holy_site: ['Great Temple-Pyramid', 'Astronomical Observatory'],
                    palace: ['Royal Palace Complex', 'Court of Captives']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Spanish Empire',
                dominantPowerDescription: 'Spanish conquistadors subdue the fragmented post-classic Maya and other indigenous groups, incorporating the region into the Viceroyalty of New Spain.',
                eraContextSentence: 'an era of conquest and resistance, where the Spanish impose their rule over the remnants of Maya glory.',
                allegianceGroups: [
                    { name: 'Spanish Empire', type: 'primary', description: 'Colonial administration under the Captaincy General of Guatemala.' },
                    { name: 'Resistant Maya Kingdoms', type: 'rebel', description: 'Groups like the Itza kingdom of Tayasal that held out for centuries.' },
                    { name: 'Encomienda Landowners', type: 'secondary', description: 'Spanish lords granted control over native labor.' }
                ],
                structureNames: {
                    fortress: ['Colonial Fort', 'Walled City of Campeche'],
                    factory: ['Cacao Plantation', 'Indigo Works'],
                    holy_site: ['Catholic Church built on Maya temple', 'Mission']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Central American Republics / US Influence',
                dominantPowerDescription: 'After independence, the region fractures into unstable republics dominated by landed elites and increasingly, the economic power of US fruit companies.',
                eraContextSentence: 'an era of "banana republics", where foreign corporations wield more power than local governments.',
                allegianceGroups: [
                    { name: 'Conservative Elites', type: 'primary', description: 'Landed aristocracy controlling the new republics.' },
                    { name: 'Liberal Reformers', type: 'rebel', description: 'Groups attempting to modernize and reduce church power.' },
                    { name: 'United Fruit Company', type: 'trade_company', description: 'A powerful US corporation that dominated regional politics.' },
                    { name: 'British Empire', type: 'secondary', description: 'Colonial presence in Belize and the Mosquito Coast.' }
                ],
                structureNames: {
                    factory: ['Banana Plantation', 'Coffee Finca', 'Railroad Line'],
                    trading_post: ['Company Port', 'Railroad Terminus']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'United States (Hegemon)',
                dominantPowerDescription: 'The region becomes a Cold War battleground, with the US backing right-wing dictatorships against socialist movements, leading to decades of civil war.',
                eraContextSentence: 'an era of civil war and intervention, where the Cold War is fought hot in the jungles and cities.',
                allegianceGroups: [
                    { name: 'US-Backed Dictatorships', type: 'primary', description: 'Authoritarian regimes in Guatemala, El Salvador, Nicaragua (pre-1979).' },
                    { name: 'Leftist Guerrillas', type: 'rebel', description: 'Groups like the FMLN and Sandinistas fighting for revolution.' },
                    { name: 'United States (CIA)', type: 'secondary', description: 'Covertly funding and training anti-communist forces.' },
                    { name: 'Panamanian Government', type: 'secondary', description: 'Managing the Panama Canal after the handover.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Counter-Insurgency School', 'Panama Canal Zone'],
                    factory: ['Maquiladora (Assembly Plant)', 'Offshore Bank'],
                    trading_post: ['Panama Canal', 'International Airport']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'Fragmented States',
                dominantPowerDescription: 'Ravaged by climate change (droughts and hurricanes), gang violence, and political instability, the region becomes a major source of global migration.',
                eraContextSentence: 'an era of exodus, where climate and violence force millions to flee north, leaving fragile states behind.',
                allegianceGroups: [
                    { name: 'Struggling National Governments', type: 'primary', description: 'Governments with limited control outside of capitals.' },
                    { name: 'Transnational Gangs (Maras)', type: 'rebel', description: 'Criminal organizations that act as de facto governments.' },
                    { name: 'Climate Migrants', type: 'secondary', description: 'Masses of people fleeing environmental disaster.' },
                    { name: 'Foreign Aid Organizations', type: 'secondary', description: 'NGOs providing essential services.' }
                ],
                structureNames: {
                    factory: ['Abandoned Farmland', 'Humanitarian Aid Center', 'Gang-Controlled Territory'],
                    trading_post: ['Migrant Caravan Staging Ground', 'Remittance Office']
                }
            }
        },
        "The Caribbean": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Arawak (Taíno) Peoples',
                dominantPowerDescription: 'Agricultural peoples migrating from South America establish villages across the Greater Antilles, developing a sophisticated culture based on cassava farming.',
                eraContextSentence: 'an age of canoes and cassava, where the Taíno people spread across the islands of the sea.',
                allegianceGroups: [
                    { name: 'Taíno Peoples', type: 'primary', description: 'The dominant Arawakan-speaking groups of the Greater Antilles.' },
                    { name: 'Island Caribs', type: 'secondary', description: 'Migrating groups expanding into the Lesser Antilles.' }
                ],
                structureNames: {
                    fortress: ['Village with Palisade', 'Coastal Settlement'],
                    holy_site: ['Ballcourt (Batey)', 'Cave with Petroglyphs']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Taíno Chiefdoms',
                dominantPowerDescription: 'Complex, hierarchical chiefdoms emerge, particularly on Hispaniola and Puerto Rico, with powerful leaders (caciques) ruling over large populations.',
                eraContextSentence: 'an era of powerful caciques, where Taíno society reaches its peak just before the world changes.',
                allegianceGroups: [
                    { name: 'Taíno Chiefdoms', type: 'primary', description: 'The five major chiefdoms of Hispaniola and others.' },
                    { name: 'Carib Warriors', type: 'rebel', description: 'Expanding peoples of the Lesser Antilles, often raiding the Taíno.' }
                ],
                structureNames: {
                    palace: ['Cacique\'s Village (Yucayeque)', 'Ceremonial Plaza']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Spanish Empire / Age of Piracy',
                dominantPowerDescription: 'Spanish colonization decimates the indigenous population and establishes the first European colonies in the Americas, which soon become a battleground for pirates and rival empires.',
                eraContextSentence: 'an era of gold, sugar, and pirates, where the Caribbean becomes the treasure chest and battleground of European empires.',
                allegianceGroups: [
                    { name: 'Spanish Empire', type: 'primary', description: 'The first and largest colonial power in the region.' },
                    { name: 'Buccaneers and Privateers', type: 'rebel', description: 'Based in Tortuga and Port Royal, preying on Spanish shipping.' },
                    { name: 'British, French, and Dutch Empires', type: 'secondary', description: 'Competing powers seizing islands for sugar plantations.' },
                    { name: 'Enslaved Africans', type: 'rebel', description: 'Forcibly brought to work the sugar plantations.' }
                ],
                structureNames: {
                    fortress: ['Spanish Fort (e.g., El Morro)', 'Pirate Haven (e.g., Port Royal)'],
                    factory: ['Sugar Plantation', 'Silver Smelter'],
                    trading_post: ['Treasure Fleet Port (Havana)', 'Slave Market']
                },
                mapAreaOverrides: {
                    "Cuba": {
                        dominantPower: 'Spanish Crown',
                        dominantPowerDescription: 'Cuba becomes the jewel of the Spanish Caribbean, with Havana serving as the assembly point for the treasure fleets returning to Spain.',
                        allegianceGroups: [
                            { name: 'Spanish Colonial Government', type: 'primary', description: 'Royal officials and military garrison controlling the island.' },
                            { name: 'Creole Elite', type: 'secondary', description: 'Spanish-descended planters developing tobacco and sugar estates.' },
                            { name: 'Enslaved Africans', type: 'rebel', description: 'Growing slave population working plantations.' },
                            { name: 'Pirates and Privateers', type: 'rebel', description: 'Threatening Spanish shipping from nearby havens.' }
                        ]
                    },
                    "Hispaniola": {
                        dominantPower: 'Spanish and French Colonies',
                        dominantPowerDescription: 'The island is divided between Spanish Santo Domingo (declining) and French Saint-Domingue (becoming the wealthiest colony in the world through brutal sugar production).',
                        allegianceGroups: [
                            { name: 'French Saint-Domingue', type: 'primary', description: 'The western third, becoming the world\'s most profitable sugar colony.' },
                            { name: 'Spanish Santo Domingo', type: 'secondary', description: 'The declining eastern portion, eclipsed by its French neighbor.' },
                            { name: 'Enslaved Africans', type: 'rebel', description: 'Massive slave population (will launch the Haitian Revolution).' },
                            { name: 'Maroons', type: 'rebel', description: 'Escaped slaves establishing independent communities in the mountains.' }
                        ]
                    },
                    "Jamaica": {
                        dominantPower: 'British Empire',
                        dominantPowerDescription: 'Seized from Spain in 1655, Jamaica becomes a major British sugar colony and haven for buccaneers at Port Royal, the "wickedest city on Earth."',
                        allegianceGroups: [
                            { name: 'British Colonial Government', type: 'primary', description: 'Royal governors and the plantocracy controlling the island.' },
                            { name: 'Sugar Planters', type: 'secondary', description: 'Wealthy British plantation owners.' },
                            { name: 'Enslaved Africans', type: 'rebel', description: 'The majority population working brutal sugar plantations.' },
                            { name: 'Maroons', type: 'rebel', description: 'Free Black communities in the interior, descended from escaped slaves.' },
                            { name: 'Port Royal Buccaneers', type: 'mercenary', description: 'Pirates operating with tacit British approval (until 1692 earthquake).' }
                        ]
                    }
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'European Colonial Empires',
                dominantPowerDescription: 'The Haitian Revolution sends shockwaves through the region as sugar colonies reach peak profitability, followed by the long process of slave emancipation.',
                eraContextSentence: 'an era of revolution and sugar kings, where the dream of freedom clashes with the brutal reality of the plantation.',
                allegianceGroups: [
                    { name: 'British Empire', type: 'primary', description: 'Dominant naval power with key sugar islands like Jamaica and Barbados.' },
                    { name: 'French Empire', type: 'secondary', description: 'Loses its most valuable colony, Haiti, but retains others.' },
                    { name: 'Republic of Haiti', type: 'rebel', description: 'The first independent Black republic, born from a slave revolt.' },
                    { name: 'Spanish Empire', type: 'secondary', description: 'Clings to Cuba and Puerto Rico, the last major slave societies.' }
                ],
                structureNames: {
                    fortress: ['Naval Base', 'Colonial Garrison'],
                    factory: ['Sugar Mill', 'Rum Distillery', 'Tobacco Plantation'],
                    trading_post: ['Sugar Port', 'Coaling Station']
                },
                mapAreaOverrides: {
                    "Cuba": {
                        dominantPower: 'Spanish Colonial Empire',
                        dominantPowerDescription: 'Cuba remains Spain\'s most valuable colony, a major sugar and tobacco producer worked by hundreds of thousands of slaves, becoming one of the last bastions of slavery in the Americas.',
                        allegianceGroups: [
                            { name: 'Spanish Colonial Government', type: 'primary', description: 'Conservative Spanish authorities resisting independence movements.' },
                            { name: 'Cuban Sugar Planters', type: 'secondary', description: 'Creole elite dependent on slavery, torn between Spain and independence.' },
                            { name: 'Cuban Independence Movement', type: 'rebel', description: 'Intellectuals and landowners seeking independence (José Martí, etc.).' },
                            { name: 'Enslaved Africans', type: 'rebel', description: 'Large slave population (not emancipated until 1886).' }
                        ]
                    },
                    "Hispaniola": {
                        dominantPower: 'Republic of Haiti / Spanish Santo Domingo',
                        dominantPowerDescription: 'Haiti becomes the first Black republic after the only successful slave revolt in history (1791-1804), while the eastern part remains under Spanish then Dominican control.',
                        allegianceGroups: [
                            { name: 'Republic of Haiti', type: 'primary', description: 'Independent Black republic in the western third, facing international isolation.' },
                            { name: 'Dominican Republic', type: 'secondary', description: 'The eastern portion, struggling with Haitian occupation and Spanish restoration.' },
                            { name: 'Haitian Elite', type: 'secondary', description: 'Mulatto and Black ruling class in Port-au-Prince.' },
                            { name: 'European Powers', type: 'secondary', description: 'France, Spain, and others seeking to contain the revolutionary example.' }
                        ]
                    },
                    "Jamaica": {
                        dominantPower: 'British Empire',
                        dominantPowerDescription: 'Jamaica remains a major British sugar colony even after the abolition of slavery (1834), with a complex system of indentured labor and growing resistance to colonial rule.',
                        allegianceGroups: [
                            { name: 'British Colonial Government', type: 'primary', description: 'Royal governors maintaining firm control after the Morant Bay Rebellion (1865).' },
                            { name: 'Planter Class', type: 'secondary', description: 'White plantation owners adapting to post-emancipation labor.' },
                            { name: 'Free Black Population', type: 'secondary', description: 'Former slaves and their descendants, demanding political rights.' },
                            { name: 'Indian and Chinese Indentured Workers', type: 'secondary', description: 'Imported laborers replacing slave labor on plantations.' }
                        ]
                    }
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'United States (Hegemon)',
                dominantPowerDescription: 'After the Spanish-American War, the US becomes the dominant power. The 20th century sees decolonization, the Cuban Revolution, and the rise of tourism.',
                eraContextSentence: 'an era of American influence and independence, where islands navigate the currents of the Cold War and mass tourism.',
                allegianceGroups: [
                    { name: 'United States', type: 'primary', description: 'The regional hegemon, with direct control or strong influence.' },
                    { name: 'Independent Caribbean Nations', type: 'secondary', description: 'Newly independent states of the British Commonwealth and elsewhere.' },
                    { name: 'Communist Cuba', type: 'rebel', description: 'A key Cold War adversary of the United States.' },
                    { name: 'Tourism Industry', type: 'trade_company', description: 'The dominant economic driver for many islands.' }
                ],
                structureNames: {
                    fortress: ['Guantanamo Bay Naval Base', 'National Army Barracks'],
                    factory: ['Tourist Resort', 'Cruise Ship Terminal', 'Offshore Financial Center'],
                    trading_post: ['International Airport', 'Container Port']
                }
            },
            [FUTURE_ERA]: {
                dominantPower: 'Climate and Economic Vulnerability',
                dominantPowerDescription: 'The Caribbean faces an existential threat from sea-level rise and increasingly powerful hurricanes, while economies remain dependent on fragile tourism.',
                eraContextSentence: 'an era of rising seas and stronger storms, where island nations fight for their very existence against a changing climate.',
                allegianceGroups: [
                    { name: 'Caribbean Community (CARICOM)', type: 'primary', description: 'Regional bloc attempting to coordinate a response.' },
                    { name: 'International Lenders (IMF/World Bank)', type: 'secondary', description: 'Holding significant power over indebted island economies.' },
                    { name: 'Climate Disaster Agencies', type: 'secondary', description: 'International groups responding to increasingly frequent disasters.' },
                    { name: 'Foreign Powers (e.g., China)', type: 'trade_company', description: 'Offering infrastructure investment in exchange for influence.' }
                ],
                structureNames: {
                    factory: ['Disaster-Resilient Infrastructure', 'Abandoned Coastal Resort', 'Renewable Energy Project'],
                    trading_post: ['Humanitarian Aid Distribution Hub', 'Climate Finance Negotiation Center']
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
        }
    }
};