/**
 * constants/gameData/factions/oceania.ts
 * Faction data for Oceanian cultural zones.
 */
import { HistoricalEra } from '../../../types';
import { FactionFile } from './types';

const MODERN_ERA = 'MODERN_ERA';

export const OCEANIA_FACTIONS: FactionFile = {
    'OCEANIA': {
        "Australia – Southeast": {
            [HistoricalEra.PREHISTORY]: {
                dominantPower: 'First Peoples',
                dominantPowerDescription: 'The original inhabitants who crossed from New Guinea when sea levels were lower, developing unique cultures and the world\'s oldest continuous traditions.',
                eraContextSentence: 'the Dreamtime, when the ancestors shaped the land and established the laws that govern all living things.',
                allegianceGroups: [
                    { name: 'First Peoples', type: 'primary', description: 'The original inhabitants.' },
                    { name: 'Coastal Bands', type: 'secondary', description: 'Groups exploiting marine resources.' },
                    { name: 'Inland Hunters', type: 'secondary', description: 'Groups following megafauna.' }
                ],
                structureNames: {
                    fortress: ['Rock Shelter', 'Defensive Camp', 'Cliff Dwelling'],
                    quarry: ['Ochre Mine', 'Stone Tool Quarry', 'Shell Midden'],
                    holy_site: ['Dreaming Site', 'Rock Art Cave', 'Sacred Waterhole', 'Increase Site'],
                    palace: ["Elder's Camp", 'Ceremonial Ground', 'Meeting Place'],
                },
                courtRoles: {
                    palace: ['Keeper of Law', 'Dreamtime Singer', 'Fire Keeper', 'Tool Maker']
                }
            },
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Aboriginal Peoples',
                dominantPowerDescription: 'Complex Aboriginal societies with sophisticated land management, trade networks, and cultural systems spanning tens of thousands of years.',
                eraContextSentence: "an age of ancient wisdom, where Aboriginal peoples maintain the world's oldest continuous civilization.",
                allegianceGroups: [
                    { name: 'Aboriginal Peoples', type: 'primary', description: 'The indigenous inhabitants.' },
                    { name: 'Regional Clan Groups', type: 'secondary', description: 'Distinct family and language groups.' },
                    { name: 'Trading Networks', type: 'secondary', description: 'Established routes for exchange of goods and knowledge.' }
                ],
                structureNames: {
                    fortress: ['Fortified Camp'],
                    holy_site: ['Sacred Site', 'Rock Art Gallery'],
                    trading_post: ['Meeting Place', 'Coastal Trading Site']
                },
                courtRoles: {
                    holy_site: ['Elder', 'Knowledge Keeper', 'Songline Guardian']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Aboriginal Confederations',
                dominantPowerDescription: 'Well-established Aboriginal groups with complex social organization, seasonal camps, and extensive trade relationships across southeastern Australia.',
                eraContextSentence: 'an era of traditional law, where Aboriginal peoples perfect their sustainable relationship with the land.',
                allegianceGroups: [
                    { name: 'Aboriginal Confederations', type: 'primary', description: 'Alliances of various clan groups.' },
                    { name: 'Coastal Peoples', type: 'secondary', description: 'Groups specializing in marine resources.' },
                    { name: 'Mountain Clans', type: 'secondary', description: 'Clans inhabiting the Great Dividing Range.' }
                ],
                structureNames: {
                    fortress: ['Meeting Ground', 'Ceremonial Ground'],
                    mill: ['Fish Trap', 'Eel Farm'],
                    holy_site: ['Sacred Mountain', 'Dreaming Site', 'Bora Ring'],
                    trading_post: ['Seasonal Camp', 'Trade Gathering Site']
                },
                courtRoles: {
                    holy_site: ['Senior Elder', 'Ceremonial Leader', 'Medicine Person']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Aboriginal Peoples',
                dominantPowerDescription: 'Aboriginal societies continue their traditional ways while remaining isolated from the European expansion happening elsewhere in the world.',
                eraContextSentence: 'an era of continuity, where Aboriginal Australia maintains ancient traditions undisturbed.',
                allegianceGroups: [
                    { name: 'Aboriginal Peoples', type: 'primary', description: 'The sole inhabitants of the continent.' },
                    { name: 'Kulin Nation', type: 'secondary', description: 'Confederation around Port Phillip Bay.' },
                    { name: 'Eora People', type: 'secondary', description: 'Groups around Sydney Harbour.' }
                ],
                structureNames: {
                    fortress: ['Defensive Camp'],
                    mill: ['Fish Weir', 'Yam Daisy Garden'],
                    holy_site: ['Sacred River Bend', 'Story Place', 'Initiation Ground'],
                    trading_post: ['Exchange Meeting Site', 'Coastal Camp']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'British Empire',
                dominantPowerDescription: 'British colonization transforms southeastern Australia through settlement, agriculture, and the discovery of gold, while devastating Aboriginal populations.',
                eraContextSentence: 'an era of colonial settlement, where British expansion transforms the ancient continent.',
                allegianceGroups: [
                    { name: 'British Empire', type: 'primary', description: 'The colonial government.' },
                    { name: 'Aboriginal Peoples', type: 'rebel', description: 'Indigenous groups resisting colonization.' },
                    { name: 'Free Settlers', type: 'secondary', description: 'European immigrants establishing farms.' },
                    { name: 'Gold Miners', type: 'secondary', description: 'Prospectors during the gold rushes.' }
                ],
                structureNames: {
                    fortress: ['Colonial Barracks', 'Stockade', 'Police Station'],
                    mill: ['Wool Station', 'Gristmill', 'Sawmill'],
                    mining_colony: ['Gold Mine', 'Coal Mine', 'Diggings'],
                    factory: ['Wool Scour', 'Tannery', 'Brewery'],
                    trading_post: ['Port Melbourne', 'General Store', 'Railway Station'],
                    palace: ['Government House', 'Colonial Mansion']
                },
                courtRoles: {
                    palace: ['Governor', 'Colonial Secretary', 'Chief Justice', 'Surveyor General']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Commonwealth of Australia',
                dominantPowerDescription: 'Australia develops into a modern, multicultural nation, with Melbourne and Sydney becoming global cities while grappling with its colonial past.',
                eraContextSentence: 'an era of prosperity and reconciliation, as Australia becomes a Pacific power.',
                allegianceGroups: [
                    { name: 'Commonwealth of Australia', type: 'primary', description: 'The federal government.' },
                    { name: 'State Governments', type: 'secondary', description: 'NSW and Victoria state administrations.' },
                    { name: 'Indigenous Land Councils', type: 'secondary', description: 'Aboriginal self-governance bodies.' },
                    { name: 'Multinational Mining Corps', type: 'trade_company', description: 'Global resource extraction companies.' }
                ],
                structureNames: {
                    fortress: ['Defence Base', 'ASIO Building'],
                    factory: ['Car Manufacturing Plant', 'Tech Hub', 'Financial Tower'],
                    trading_post: ['International Airport', 'Container Terminal', 'CBD Office Complex'],
                    holy_site: ['War Memorial', 'St Paul\'s Cathedral', 'Aboriginal Cultural Centre'],
                    palace: ['Parliament House', 'Premier\'s Office']
                },
                courtRoles: {
                    palace: ['Prime Minister', 'State Premier', 'Chief of Defence', 'Reserve Bank Governor']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Commonwealth of Australia',
                dominantPowerDescription: 'Australia navigates climate change impacts, Asian economic integration, and energy transition while strengthening Indigenous rights and managing water scarcity.',
                eraContextSentence: 'an era of climate adaptation, where Australia balances resource wealth with environmental challenges.',
                allegianceGroups: [
                    { name: 'Australian Government', type: 'primary', description: 'Federal government managing climate and economic transitions.' },
                    { name: 'China', type: 'trade_company', description: 'Major trading partner and investor.' },
                    { name: 'Indigenous Voice', type: 'secondary', description: 'Constitutional Indigenous representation body.' },
                    { name: 'Climate Action Groups', type: 'rebel', description: 'Activists demanding faster environmental action.' }
                ],
                structureNames: {
                    fortress: ['Cybersecurity Centre', 'Climate Monitoring Station'],
                    factory: ['Battery Manufacturing', 'Renewable Energy Hub', 'Desalination Plant'],
                    trading_post: ['Smart Port', 'Data Centre', 'Hydrogen Export Terminal'],
                    holy_site: ['National Apology Memorial', 'Climate Refugee Centre']
                }
            }
        },
        "Australia – Outback and Center": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Aboriginal Desert Peoples',
                dominantPowerDescription: 'Desert Aboriginal groups with sophisticated knowledge of water sources, seasonal movements, and survival in one of Earth\'s harshest environments.',
                eraContextSentence: 'an age of desert mastery, where Aboriginal peoples thrive in the red heart of the continent.',
                allegianceGroups: [
                    { name: 'Desert Peoples', type: 'primary', description: 'Aboriginal groups of central Australia.' },
                    { name: 'Arrernte People', type: 'secondary', description: 'Groups around the MacDonnell Ranges.' },
                    { name: 'Western Desert Peoples', type: 'secondary', description: 'Widespread cultural bloc.' }
                ],
                structureNames: {
                    fortress: ['Rock Shelter', 'Defensive Position'],
                    holy_site: ['Uluru', 'Sacred Waterhole', 'Tjurunga Site'],
                    trading_post: ['Ochre Mine', 'Stone Quarry']
                },
                courtRoles: {
                    holy_site: ['Keeper of Sacred Objects', 'Water Knowledge Holder', 'Ceremony Leader']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Aboriginal Desert Nations',
                dominantPowerDescription: 'Well-organized desert societies maintaining vast territories through detailed knowledge of water sources and complex ceremonial cycles.',
                eraContextSentence: 'an era of ceremonial exchange, where songlines connect the desert peoples.',
                allegianceGroups: [
                    { name: 'Central Desert Peoples', type: 'primary', description: 'Interconnected desert groups.' },
                    { name: 'Pitjantjatjara', type: 'secondary', description: 'Major cultural group of the western desert.' },
                    { name: 'Trade Network Participants', type: 'trade_company', description: 'Groups controlling valuable resources.' }
                ],
                structureNames: {
                    fortress: ['Hidden Spring', 'Mountain Refuge'],
                    mill: ['Seed Grinding Stone', 'Water Collection System'],
                    holy_site: ['Kata Tjuta', 'Sacred Cave', 'Men\'s Ceremonial Ground'],
                    trading_post: ['Trading Ceremony Site', 'Pituri Distribution Point']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Aboriginal Desert Confederations',
                dominantPowerDescription: 'Desert peoples maintain their traditional ways, with complex trade networks extending to the coasts for shells, tools, and ceremonial items.',
                eraContextSentence: 'an era of continental connection, where desert tracks link distant peoples.',
                allegianceGroups: [
                    { name: 'Desert Confederations', type: 'primary', description: 'Allied desert groups.' },
                    { name: 'Edge Peoples', type: 'secondary', description: 'Groups on desert margins facilitating trade.' },
                    { name: 'Ceremonial Partners', type: 'secondary', description: 'Distant groups linked by ritual.' }
                ],
                structureNames: {
                    fortress: ['Fortified Waterhole', 'Escarpment Camp'],
                    holy_site: ['Rainbow Serpent Site', 'Women\'s Sacred Place', 'Increase Site'],
                    trading_post: ['Desert Edge Market', 'Ceremonial Exchange Ground']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'British Colonial Frontier',
                dominantPowerDescription: 'Pastoral expansion and mining ventures penetrate the interior, bringing conflict and disease while Aboriginal groups resist and adapt.',
                eraContextSentence: 'an era of frontier violence, where pastoralists and prospectors invade the desert.',
                allegianceGroups: [
                    { name: 'Colonial Administration', type: 'primary', description: 'Distant government asserting control.' },
                    { name: 'Aboriginal Resistance', type: 'rebel', description: 'Desert peoples defending their lands.' },
                    { name: 'Pastoralists', type: 'secondary', description: 'Cattle and sheep station owners.' },
                    { name: 'Afghan Cameleers', type: 'trade_company', description: 'Muslim traders operating camel trains.' }
                ],
                structureNames: {
                    fortress: ['Police Outpost', 'Telegraph Station'],
                    mill: ['Bore Pump', 'Station Homestead'],
                    mining_colony: ['Gold Field', 'Opal Mine'],
                    trading_post: ['General Store', 'Camel Depot', 'Mission Station']
                },
                courtRoles: {
                    palace: ['Police Magistrate', 'Protector of Aborigines', 'Station Manager']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Commonwealth of Australia',
                dominantPowerDescription: 'The Outback becomes a resource extraction frontier while Aboriginal land rights movements achieve recognition and mining towns boom and bust.',
                eraContextSentence: 'an era of mining wealth and land rights, where ancient claims meet modern law.',
                allegianceGroups: [
                    { name: 'Federal/State Government', type: 'primary', description: 'Governments managing vast territories.' },
                    { name: 'Aboriginal Land Trusts', type: 'secondary', description: 'Indigenous bodies with native title.' },
                    { name: 'Mining Corporations', type: 'trade_company', description: 'Companies extracting minerals and energy.' },
                    { name: 'Tourism Industry', type: 'trade_company', description: 'Operators around iconic sites.' }
                ],
                structureNames: {
                    fortress: ['Mining Camp Security', 'Military Training Area'],
                    factory: ['Mine Site', 'Processing Plant', 'Solar Farm'],
                    mining_colony: ['Iron Ore Mine', 'Uranium Mine', 'Coal Seam Gas Field'],
                    trading_post: ['Roadhouse', 'Tourist Resort', 'FIFO Airport'],
                    holy_site: ['Uluru-Kata Tjuta National Park', 'Aboriginal Art Centre']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Commonwealth of Australia',
                dominantPowerDescription: 'The Outback transforms into a renewable energy powerhouse while extreme heat makes some areas uninhabitable and Indigenous joint management expands.',
                eraContextSentence: 'an era of solar boom and climate extremes, where the desert powers the nation.',
                allegianceGroups: [
                    { name: 'Australian Government', type: 'primary', description: 'Federal oversight of energy transition.' },
                    { name: 'Indigenous Corporations', type: 'secondary', description: 'Aboriginal groups as renewable energy partners.' },
                    { name: 'Asian Energy Buyers', type: 'trade_company', description: 'Nations purchasing Australian renewable energy.' },
                    { name: 'Climate Refugees', type: 'secondary', description: 'Internal migrants from uninhabitable areas.' }
                ],
                structureNames: {
                    fortress: ['Automated Mine Site', 'Climate Shelter'],
                    factory: ['Massive Solar Array', 'Battery Storage Facility', 'Hydrogen Plant'],
                    trading_post: ['Energy Export Hub', 'Underground Town', 'Drone Supply Base'],
                    holy_site: ['Climate Memorial', 'Digital Keeping Place']
                }
            }
        },
        "Australia – North and Queensland": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Torres Strait Peoples',
                dominantPowerDescription: 'Maritime peoples of the Torres Strait and northern coasts maintain trade with New Guinea and practice advanced navigation and horticulture.',
                eraContextSentence: 'an age of maritime connection, where island peoples bridge Australia and New Guinea.',
                allegianceGroups: [
                    { name: 'Torres Strait Islanders', type: 'primary', description: 'Seafaring peoples of the strait.' },
                    { name: 'Cape York Peoples', type: 'secondary', description: 'Aboriginal groups of the peninsula.' },
                    { name: 'Arnhem Land Peoples', type: 'secondary', description: 'Groups with Asian trade contacts.' }
                ],
                structureNames: {
                    fortress: ['Coastal Lookout', 'Island Fort'],
                    mill: ['Fish Trap', 'Yam Garden'],
                    holy_site: ['Dari Site', 'Crocodile Dreaming Place'],
                    trading_post: ['Beach Market', 'Canoe Landing']
                },
                courtRoles: {
                    holy_site: ['Zogo Keeper', 'Navigation Master', 'Trade Chief']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Northern Maritime Networks',
                dominantPowerDescription: 'Complex societies engage in regular trade with Indonesian fishermen and New Guinea, exchanging goods and cultural practices.',
                eraContextSentence: 'an era of oceanic exchange, where Makassan traders visit Australian shores.',
                allegianceGroups: [
                    { name: 'Yolngu Confederations', type: 'primary', description: 'Arnhem Land groups trading with Makassans.' },
                    { name: 'Makassan Traders', type: 'trade_company', description: 'Indonesian trepang fishermen.' },
                    { name: 'Torres Strait Networks', type: 'secondary', description: 'Island trading societies.' }
                ],
                structureNames: {
                    fortress: ['Stone Fish Trap', 'Defensive Beach Camp'],
                    mill: ['Trepang Processing Site', 'Dugout Canoe Workshop'],
                    holy_site: ['Makassan Prayer Site', 'Sacred Reef', 'Initiation Ground'],
                    trading_post: ['Trepang Camp', 'Trade Beach', 'Pearling Ground']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Indigenous Trading Societies',
                dominantPowerDescription: 'Northern peoples continue their international connections while southern areas remain isolated, with distinct cultural regions maintaining their traditions.',
                eraContextSentence: 'an era of sustained tradition, where northern waters connect diverse peoples.',
                allegianceGroups: [
                    { name: 'Coastal Peoples', type: 'primary', description: 'Groups controlling maritime resources.' },
                    { name: 'Rainforest Peoples', type: 'secondary', description: 'Groups of the wet tropics.' },
                    { name: 'Asian Visitors', type: 'trade_company', description: 'Seasonal traders and fishermen.' }
                ],
                structureNames: {
                    fortress: ['Hilltop Refuge', 'Mangrove Hideout'],
                    mill: ['Cycad Processing Site', 'Net Making Camp'],
                    holy_site: ['Bora Ground', 'Sacred Waterfall', 'Ancestor Cave'],
                    trading_post: ['International Beach', 'Shell Money Exchange']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'British Colonial Queensland',
                dominantPowerDescription: 'Violent frontier expansion for cattle and sugar brings devastating conflict, while pearling and mining industries exploit Indigenous and imported labor.',
                eraContextSentence: 'an era of brutal colonization, where sugar and gold drive the frontier north.',
                allegianceGroups: [
                    { name: 'Colonial Queensland', type: 'primary', description: 'Separate colony from 1859.' },
                    { name: 'Aboriginal Resistance', type: 'rebel', description: 'Warriors defending their lands.' },
                    { name: 'South Sea Islanders', type: 'secondary', description: 'Kidnapped Pacific laborers.' },
                    { name: 'Chinese Miners', type: 'secondary', description: 'Gold field workers facing discrimination.' }
                ],
                structureNames: {
                    fortress: ['Native Police Barracks', 'Frontier Fort'],
                    mill: ['Sugar Mill', 'Cattle Station'],
                    mining_colony: ['Palmer Goldfield', 'Tin Mine'],
                    factory: ['Meat Works', 'Sugar Refinery'],
                    trading_post: ['Pearling Lugger Port', 'Chinese Quarter', 'Pacific Islander Barracks']
                },
                courtRoles: {
                    palace: ['Colonial Governor', 'Police Commissioner', 'Sugar Baron', 'Pearling Master']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Commonwealth of Australia',
                dominantPowerDescription: 'Queensland develops through mining, tourism, and agriculture while the north remains a strategic frontier facing Asia and the Pacific.',
                eraContextSentence: 'an era of tropical development, where reef tourism meets military buildup.',
                allegianceGroups: [
                    { name: 'Australian Government', type: 'primary', description: 'Federal and Queensland state control.' },
                    { name: 'Indigenous Groups', type: 'secondary', description: 'Land councils and native title holders.' },
                    { name: 'Mining Giants', type: 'trade_company', description: 'Coal and mineral corporations.' },
                    { name: 'Tourism Industry', type: 'trade_company', description: 'Reef and rainforest operators.' }
                ],
                structureNames: {
                    fortress: ['RAAF Base', 'Naval Port', 'Joint US Facility'],
                    factory: ['Alumina Refinery', 'Sugar Mill', 'Coal Port'],
                    mining_colony: ['Coal Mine', 'Bauxite Mine', 'Gas Field'],
                    trading_post: ['Cairns Airport', 'Bulk Terminal', 'Resort Complex'],
                    holy_site: ['ANZAC Memorial', 'Aboriginal Cultural Centre']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Commonwealth of Australia',
                dominantPowerDescription: 'Northern Australia becomes a critical defense and economic zone facing Asia while managing climate impacts on the Great Barrier Reef and tropical diseases.',
                eraContextSentence: 'an era of northern focus, where Australia\'s tropical frontier faces climate and strategic challenges.',
                allegianceGroups: [
                    { name: 'Australian Defence Force', type: 'primary', description: 'Enhanced military presence facing potential threats.' },
                    { name: 'Indonesian Partnership', type: 'secondary', description: 'Growing economic and security cooperation.' },
                    { name: 'Chinese Investors', type: 'trade_company', description: 'Major infrastructure and resource investments.' },
                    { name: 'Environmental Movement', type: 'rebel', description: 'Groups fighting reef destruction and deforestation.' }
                ],
                structureNames: {
                    fortress: ['Integrated Defence Hub', 'Space Monitoring Station'],
                    factory: ['Reef Restoration Facility', 'Tropical Medicine Centre', 'Rare Earth Processing'],
                    trading_post: ['Darwin Tech Port', 'Climate Haven Resort', 'Evacuation Centre'],
                    holy_site: ['Reef Memorial', 'Reconciliation Park']
                }
            }
        },
        "Australia – West and Desert": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Western Desert Peoples',
                dominantPowerDescription: 'Aboriginal groups across vast Western Australia maintain distinct cultures from coastal fishing societies to desert nomads.',
                eraContextSentence: 'an age of continental isolation, where western peoples develop unique traditions.',
                allegianceGroups: [
                    { name: 'Western Desert Peoples', type: 'primary', description: 'Diverse Aboriginal groups across the west.' },
                    { name: 'Coastal Peoples', type: 'secondary', description: 'Groups utilizing rich marine resources.' },
                    { name: 'Kimberley Peoples', type: 'secondary', description: 'Groups of the tropical north.' }
                ],
                structureNames: {
                    fortress: ['Coastal Shell Mound', 'Rock Shelter'],
                    holy_site: ['Wandjina Art Site', 'Sacred Spring', 'Law Ground'],
                    trading_post: ['Shell Exchange Site', 'Ochre Quarry']
                },
                courtRoles: {
                    holy_site: ['Law Keeper', 'Wandjina Custodian', 'Senior Woman']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Western Aboriginal Nations',
                dominantPowerDescription: 'Sophisticated societies manage vast territories through fire, maintain continental trade networks, and create elaborate rock art traditions.',
                eraContextSentence: 'an era of cultural flowering, where western peoples perfect desert survival.',
                allegianceGroups: [
                    { name: 'Desert Nations', type: 'primary', description: 'Interconnected desert societies.' },
                    { name: 'Pilbara Peoples', type: 'secondary', description: 'Groups of the ancient rocky lands.' },
                    { name: 'Southwest Nations', type: 'secondary', description: 'Groups of the forested corner.' }
                ],
                structureNames: {
                    fortress: ['Hidden Gorge', 'Fortified Spring'],
                    mill: ['Grass Seed Processing', 'Fish Weir'],
                    holy_site: ['Increase Ceremony Site', 'Gwion Gwion Gallery', 'Men\'s Sacred Area'],
                    trading_post: ['Desert Meeting Point', 'Coastal Exchange']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Aboriginal West',
                dominantPowerDescription: 'Western Aboriginal societies continue uninterrupted while Dutch ships occasionally wreck on the coast without establishing settlement.',
                eraContextSentence: 'an era of brief contact, where Dutch ships glimpse an unwelcoming shore.',
                allegianceGroups: [
                    { name: 'Aboriginal Nations', type: 'primary', description: 'Sole inhabitants of the west.' },
                    { name: 'Dutch Shipwrecks', type: 'secondary', description: 'Occasional European castaways.' },
                    { name: 'Northern Traders', type: 'trade_company', description: 'Asian fishermen in northern waters.' }
                ],
                structureNames: {
                    fortress: ['Defensive Coastal Camp', 'Desert Stronghold'],
                    holy_site: ['Sacred Island', 'Ceremonial Valley', 'Women\'s Place'],
                    trading_post: ['Inter-group Meeting Site', 'Salvage Beach']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'British Western Australia',
                dominantPowerDescription: 'Late and initially reluctant colonization accelerates with gold discoveries, while pearling industries exploit Aboriginal divers.',
                eraContextSentence: 'an era of gold rush and pearls, transforming the isolated west.',
                allegianceGroups: [
                    { name: 'Swan River Colony', type: 'primary', description: 'British settlement expanding inland.' },
                    { name: 'Aboriginal Resistance', type: 'rebel', description: 'Groups fighting colonization.' },
                    { name: 'Gold Prospectors', type: 'secondary', description: 'Fortune seekers in the goldfields.' },
                    { name: 'Pearling Masters', type: 'trade_company', description: 'Exploiting northern waters.' }
                ],
                structureNames: {
                    fortress: ['Convict Prison', 'Goldfields Police Post'],
                    mill: ['Timber Mill', 'Wheat Farm'],
                    mining_colony: ['Kalgoorlie Goldfield', 'Copper Mine'],
                    trading_post: ['Fremantle Port', 'Goldfields Supply Store', 'Pearling Fleet Base']
                },
                courtRoles: {
                    palace: ['Colonial Governor', 'Gold Warden', 'Pearling Inspector']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Commonwealth of Australia',
                dominantPowerDescription: 'Western Australia becomes a global mining powerhouse, shipping iron ore and gas to Asia while Perth grows into an isolated but wealthy metropolis.',
                eraContextSentence: 'an era of mineral wealth, where red dirt funds modern prosperity.',
                allegianceGroups: [
                    { name: 'State of Western Australia', type: 'primary', description: 'Resource-rich state government.' },
                    { name: 'Mining Corporations', type: 'trade_company', description: 'Global giants extracting minerals.' },
                    { name: 'Indigenous Native Title', type: 'secondary', description: 'Traditional owners negotiating with miners.' },
                    { name: 'Asian Markets', type: 'trade_company', description: 'China, Japan, Korea buying resources.' }
                ],
                structureNames: {
                    fortress: ['Naval Base', 'US Communications Facility'],
                    factory: ['LNG Plant', 'Lithium Processing', 'Alumina Refinery'],
                    mining_colony: ['Iron Ore Megamine', 'Offshore Gas Platform', 'Gold Mine'],
                    trading_post: ['Bulk Ore Port', 'Perth Financial Centre', 'FIFO Hub'],
                    holy_site: ['Kings Park Memorial', 'Aboriginal Heritage Site']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Commonwealth of Australia',
                dominantPowerDescription: 'Western Australia leverages critical minerals for the energy transition while Perth faces water crisis and the north develops as a space industry hub.',
                eraContextSentence: 'an era of critical minerals and cosmic ambitions, where the west powers the future.',
                allegianceGroups: [
                    { name: 'WA Government', type: 'primary', description: 'State controlling key transition minerals.' },
                    { name: 'Battery Manufacturers', type: 'trade_company', description: 'Global companies needing lithium and rare earths.' },
                    { name: 'Space Industry', type: 'trade_company', description: 'Companies using clear skies and empty land.' },
                    { name: 'Water Crisis Coalition', type: 'rebel', description: 'Groups demanding action on scarcity.' }
                ],
                structureNames: {
                    fortress: ['Space Tracking Station', 'Automated Port Security'],
                    factory: ['Battery Gigafactory', 'Hydrogen Export Plant', 'Desalination Megaplant'],
                    trading_post: ['Autonomous Shipping Port', 'Space Launch Facility', 'Digital Mining Hub'],
                    holy_site: ['Water Conservation Memorial', 'First Nations Treaty Centre']
                }
            }
        },
        "New Zealand": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Pre-Settlement Era',
                dominantPowerDescription: 'New Zealand remains uninhabited by humans, with unique flora and fauna evolving in isolation, including giant flightless birds.',
                eraContextSentence: 'an age before humanity, where giant moa roam forests untouched by mankind.',
                allegianceGroups: [
                    { name: 'None', type: 'primary', description: 'No human inhabitants yet.' }
                ],
                structureNames: {
                    holy_site: ['Future Sacred Mountain', 'Future Sacred Lake']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Early Māori',
                dominantPowerDescription: 'Polynesian navigators discover and settle Aotearoa, establishing iwi (tribes) and beginning to transform the landscape.',
                eraContextSentence: 'an era of discovery and settlement, where Polynesian voyagers become tangata whenua.',
                allegianceGroups: [
                    { name: 'Early Iwi', type: 'primary', description: 'Founding Māori tribes.' },
                    { name: 'Waka Groups', type: 'secondary', description: 'Communities descended from voyaging canoes.' },
                    { name: 'Moa Hunters', type: 'secondary', description: 'Groups pursuing megafauna.' }
                ],
                structureNames: {
                    fortress: ['Pā Site', 'Coastal Defense'],
                    mill: ['Kumara Garden', 'Eel Weir'],
                    holy_site: ['Marae', 'Sacred Mountain', 'Burial Cave'],
                    trading_post: ['Jade Source', 'Obsidian Quarry']
                },
                courtRoles: {
                    holy_site: ['Tohunga', 'Rangatira', 'Keeper of Whakapapa']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Māori Iwi',
                dominantPowerDescription: 'Māori society develops complex political structures, fortified pā, and extensive cultivation while maintaining oral traditions and warfare.',
                eraContextSentence: 'an era of tribal confederation, where great pā crown the hills.',
                allegianceGroups: [
                    { name: 'Major Iwi', type: 'primary', description: 'Powerful tribal confederations.' },
                    { name: 'Hapū Alliances', type: 'secondary', description: 'Sub-tribal political groups.' },
                    { name: 'Tohunga Schools', type: 'religious', description: 'Keepers of sacred knowledge.' }
                ],
                structureNames: {
                    fortress: ['Fortified Pā', 'Gunfighter Pā', 'Refuge Pā'],
                    mill: ['Kumara Storage Pit', 'Flax Processing Site'],
                    holy_site: ['Wharenui', 'Urupā', 'Sacred Forest'],
                    palace: ['Paramount Chief\'s Pā'],
                    trading_post: ['Pounamu Trading Post', 'Coastal Market']
                },
                courtRoles: {
                    palace: ['Ariki', 'War Chief', 'Senior Tohunga', 'Master Carver']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'British New Zealand',
                dominantPowerDescription: 'After the Treaty of Waitangi, British colonization accelerates through wars, land confiscation, and mass immigration while Māori resist and adapt.',
                eraContextSentence: 'an era of colonization and conflict, where two worlds collide over land and sovereignty.',
                allegianceGroups: [
                    { name: 'British Crown', type: 'primary', description: 'Colonial government asserting control.' },
                    { name: 'Māori Resistance', type: 'rebel', description: 'Iwi fighting land loss and cultural destruction.' },
                    { name: 'Colonial Settlers', type: 'secondary', description: 'British and other European immigrants.' },
                    { name: 'Māori Kupapa', type: 'secondary', description: 'Māori allied with government.' }
                ],
                structureNames: {
                    fortress: ['British Redoubt', 'Modern Pā', 'Blockhouse'],
                    mill: ['Timber Mill', 'Flour Mill', 'Flax Mill'],
                    factory: ['Freezing Works', 'Dairy Factory'],
                    trading_post: ['Colonial Port', 'Native Land Court', 'General Store'],
                    palace: ['Government House', 'Provincial Council']
                },
                courtRoles: {
                    palace: ['Governor', 'Premier', 'Native Minister', 'Land Court Judge']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'New Zealand',
                dominantPowerDescription: 'New Zealand develops as a progressive democracy, grappling with its colonial past through the Treaty settlement process while building a unique bicultural identity.',
                eraContextSentence: 'an era of reconciliation and identity, where Aotearoa charts its own Pacific course.',
                allegianceGroups: [
                    { name: 'New Zealand Government', type: 'primary', description: 'Westminster democracy with MMP system.' },
                    { name: 'Iwi Authorities', type: 'secondary', description: 'Māori governance structures post-settlement.' },
                    { name: 'Foreign Investors', type: 'trade_company', description: 'International capital in property and business.' },
                    { name: 'Environmental Movement', type: 'secondary', description: 'Strong conservation advocacy.' }
                ],
                structureNames: {
                    fortress: ['Defence Headquarters', 'SAS Base'],
                    factory: ['Dairy Processing Plant', 'Film Studio', 'Tech Startup Hub'],
                    trading_post: ['Auckland Port', 'International Airport', 'Tourism Centre'],
                    holy_site: ['Waitangi Treaty Grounds', 'War Memorial', 'Restored Marae'],
                    palace: ['Beehive Parliament', 'Premier House']
                },
                courtRoles: {
                    palace: ['Prime Minister', 'Governor-General', 'Māori Party Leader', 'Chief Justice']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Aotearoa New Zealand',
                dominantPowerDescription: 'New Zealand balances its clean, green image with economic pressures while strengthening Pacific ties and managing climate refugee flows.',
                eraContextSentence: 'an era of Pacific leadership, where Aotearoa navigates rising seas and global instability.',
                allegianceGroups: [
                    { name: 'Coalition Government', type: 'primary', description: 'Politically fragmented democracy.' },
                    { name: 'Pacific Climate Alliance', type: 'secondary', description: 'Regional cooperation on climate impacts.' },
                    { name: 'Chinese Economic Presence', type: 'trade_company', description: 'Major trade partner and investor.' },
                    { name: 'Climate Refugee Advocates', type: 'rebel', description: 'Groups demanding open borders.' }
                ],
                structureNames: {
                    fortress: ['Biosecurity Centre', 'Climate Monitoring Station'],
                    factory: ['Renewable Energy Plant', 'Vertical Farm Complex', 'Water Export Facility'],
                    trading_post: ['Pacific Development Hub', 'Carbon Credit Exchange', 'Tech Export Centre'],
                    holy_site: ['Climate Refugee Welcome Centre', 'Bicultural Constitution Monument']
                }
            }
        },
        "New Guinea and Melanesia": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Highland Societies',
                dominantPowerDescription: 'Independent agricultural societies in the highlands develop sophisticated farming systems while coastal peoples maintain maritime trade networks.',
                eraContextSentence: 'an age of agricultural innovation, where highland gardens feed complex societies.',
                allegianceGroups: [
                    { name: 'Highland Clans', type: 'primary', description: 'Agricultural societies of the interior.' },
                    { name: 'Coastal Traders', type: 'secondary', description: 'Maritime peoples connecting islands.' },
                    { name: 'Lowland Sago Peoples', type: 'secondary', description: 'River and swamp communities.' }
                ],
                structureNames: {
                    fortress: ['Hilltop Stockade', 'Clan Fighting Ground'],
                    mill: ['Taro Garden', 'Sago Processing Site'],
                    holy_site: ['Haus Tambaran', 'Sacred Grove', 'Ancestor Shrine'],
                    trading_post: ['Coastal Market', 'Highland Exchange']
                },
                courtRoles: {
                    holy_site: ['Big Man', 'Ritual Expert', 'Garden Magician']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Melanesian Networks',
                dominantPowerDescription: 'Complex trading systems like the Kula ring connect island societies while highland populations grow through agricultural intensification.',
                eraContextSentence: 'an era of ceremonial exchange, where shell valuables circle the islands.',
                allegianceGroups: [
                    { name: 'Trading Confederations', type: 'primary', description: 'Island networks linked by exchange.' },
                    { name: 'Highland Alliances', type: 'secondary', description: 'Clan groups in shifting coalitions.' },
                    { name: 'Specialized Craft Villages', type: 'trade_company', description: 'Pottery and tool making centers.' }
                ],
                structureNames: {
                    fortress: ['Island Fort', 'Mountain Refuge'],
                    mill: ['Stone Axe Quarry', 'Salt Production Site'],
                    holy_site: ['Men\'s House', 'Initiation Ground', 'Skull House'],
                    trading_post: ['Kula Beach', 'Highland Market', 'Pottery Village']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Indigenous Societies',
                dominantPowerDescription: 'Melanesian societies continue their traditional patterns while occasional European explorers visit the coasts without establishing permanent presence.',
                eraContextSentence: 'an era of continuity, where ancient patterns persist despite distant European sails.',
                allegianceGroups: [
                    { name: 'Coastal Kingdoms', type: 'primary', description: 'Emerging centralized societies.' },
                    { name: 'Highland Confederations', type: 'secondary', description: 'Large clan alliances.' },
                    { name: 'European Visitors', type: 'trade_company', description: 'Occasional ships seeking spices.' }
                ],
                structureNames: {
                    fortress: ['Coastal Stronghold', 'Highland Fighting Wall'],
                    mill: ['Breadfruit Preparation', 'Pig Feast Ground'],
                    holy_site: ['Cargo Cult Site', 'Traditional Temple', 'Secret Society Lodge'],
                    palace: ['Paramount Chief House'],
                    trading_post: ['Inter-island Port', 'European Contact Point']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Colonial Division',
                dominantPowerDescription: 'Germany, Britain, and the Netherlands divide New Guinea and nearby islands, introducing plantations, labor trade, and missionaries.',
                eraContextSentence: 'an era of imperial partition, where European flags divide ancient lands.',
                allegianceGroups: [
                    { name: 'German New Guinea', type: 'primary', description: 'Northern areas under German control.' },
                    { name: 'British Papua', type: 'primary', description: 'Southern areas under British rule.' },
                    { name: 'Dutch East Indies', type: 'primary', description: 'Western half controlled by Netherlands.' },
                    { name: 'Indigenous Resistance', type: 'rebel', description: 'Groups fighting colonial intrusion.' }
                ],
                structureNames: {
                    fortress: ['Colonial Station', 'Mission Compound'],
                    mill: ['Copra Plantation', 'Coffee Estate'],
                    factory: ['Trading Company Warehouse'],
                    trading_post: ['Colonial Port', 'Labor Recruiting Station', 'Trade Store'],
                    palace: ['District Officer Residence']
                },
                courtRoles: {
                    palace: ['Colonial Administrator', 'Plantation Manager', 'Mission Leader', 'Kiap (Patrol Officer)']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Independent States',
                dominantPowerDescription: 'Papua New Guinea and Pacific island nations achieve independence but struggle with development, corruption, and maintaining unity across diverse populations.',
                eraContextSentence: 'an era of challenging independence, where young nations confront colonial legacies.',
                allegianceGroups: [
                    { name: 'National Governments', type: 'primary', description: 'Weak central states with limited reach.' },
                    { name: 'Mining Corporations', type: 'trade_company', description: 'Foreign companies extracting resources.' },
                    { name: 'Tribal/Regional Groups', type: 'rebel', description: 'Local identities resisting central authority.' },
                    { name: 'Australian Influence', type: 'secondary', description: 'Former colonial power maintaining involvement.' }
                ],
                structureNames: {
                    fortress: ['Police Station', 'PNG Defence Barracks'],
                    factory: ['Gold Mine', 'Logging Operation', 'Palm Oil Plantation'],
                    mining_colony: ['Ok Tedi Mine', 'Porgera Mine', 'Nickel Mine'],
                    trading_post: ['Provincial Capital', 'Australian Aid Post', 'Chinese Trade Store'],
                    palace: ['Parliament House', 'Provincial Headquarters']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'PNG and Island States',
                dominantPowerDescription: 'Pacific nations face rising seas and climate impacts while resource extraction continues amid governance challenges and geopolitical competition.',
                eraContextSentence: 'an era of sinking islands and resource struggles, where climate reshapes everything.',
                allegianceGroups: [
                    { name: 'National Governments', type: 'primary', description: 'States managing climate crisis.' },
                    { name: 'Chinese Development', type: 'trade_company', description: 'Belt and Road infrastructure projects.' },
                    { name: 'Australian/NZ Aid', type: 'secondary', description: 'Traditional partners competing with China.' },
                    { name: 'Climate Displaced', type: 'rebel', description: 'Communities losing land to rising seas.' }
                ],
                structureNames: {
                    fortress: ['Climate Refugee Centre', 'Chinese Security Facility'],
                    factory: ['Seabed Mining Platform', 'Solar Power Station', 'Fish Processing Plant'],
                    trading_post: ['Chinese-built Port', 'Climate Adaptation Hub', 'Digital Gateway'],
                    holy_site: ['Sunken Island Memorial', 'Traditional Knowledge Centre']
                }
            }
        },
        "Polynesia": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Early Polynesian Voyagers',
                dominantPowerDescription: 'Master navigators begin settling central Pacific islands, establishing the foundations of Polynesian culture and beginning expansion.',
                eraContextSentence: 'an age of voyaging, where navigators read stars and swells to find new lands.',
                allegianceGroups: [
                    { name: 'Voyaging Communities', type: 'primary', description: 'Seafaring peoples spreading across the Pacific.' },
                    { name: 'Lapita Descendants', type: 'secondary', description: 'Earlier pottery-making peoples.' },
                    { name: 'Navigator Guilds', type: 'religious', description: 'Keepers of wayfinding knowledge.' }
                ],
                structureNames: {
                    fortress: ['Coastal Settlement', 'Fortified Headland'],
                    mill: ['Taro Terrace', 'Fish Pond'],
                    holy_site: ['Marae', 'Navigator\'s Temple', 'First Canoe Site'],
                    trading_post: ['Inter-island Port', 'Canoe Harbor']
                },
                courtRoles: {
                    holy_site: ['Master Navigator', 'High Priest', 'Genealogy Keeper']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Polynesian Chiefdoms',
                dominantPowerDescription: 'Stratified societies develop across the Pacific islands with powerful chiefs, monumental architecture, and long-distance voyaging networks.',
                eraContextSentence: 'an era of divine chiefs, where mana flows through royal bloodlines.',
                allegianceGroups: [
                    { name: 'Paramount Chiefs', type: 'primary', description: 'Sacred rulers claiming divine descent.' },
                    { name: 'Lesser Chiefs', type: 'secondary', description: 'District rulers owing allegiance.' },
                    { name: 'Priest Classes', type: 'religious', description: 'Mediators with the divine.' },
                    { name: 'Warrior Societies', type: 'secondary', description: 'Elite fighters serving chiefs.' }
                ],
                structureNames: {
                    fortress: ['Hill Fort', 'Stone Platform'],
                    mill: ['Irrigated Taro Field', 'Breadfruit Grove'],
                    holy_site: ['Royal Marae', 'Heiau Temple', 'Burial Platform'],
                    palace: ['Chiefly Compound', 'Royal Residence'],
                    trading_post: ['Voyaging Center', 'Tribute Collection Point']
                },
                courtRoles: {
                    palace: ['Ali\'i Nui (High Chief)', 'Kahuna (Priest)', 'Talking Chief', 'Royal Navigator']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Island Kingdoms',
                dominantPowerDescription: 'Powerful Polynesian kingdoms reach their height with complex political systems, while some islands experience ecological crisis from overexploitation.',
                eraContextSentence: 'an era of island empires, where some thrive while others face environmental collapse.',
                allegianceGroups: [
                    { name: 'Hawaiian Kingdom', type: 'primary', description: 'Unified kingdom under Kamehameha.' },
                    { name: 'Tongan Empire', type: 'primary', description: 'Maritime empire influencing Fiji and Samoa.' },
                    { name: 'Tahitian Kingdoms', type: 'secondary', description: 'Competing chiefdoms in Society Islands.' },
                    { name: 'Rapa Nui', type: 'rebel', description: 'Easter Island facing ecological collapse.' }
                ],
                structureNames: {
                    fortress: ['Pu\'uhonua (Place of Refuge)', 'War Temple', 'Fortified Village'],
                    mill: ['Fishpond Complex', 'Intensive Agriculture'],
                    holy_site: ['Moai Statues', 'Oracle Tower', 'Royal Burial Ground'],
                    palace: ['King\'s Compound', 'Sacred Chief\'s House'],
                    trading_post: ['Sandalwood Port', 'European Contact Point']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Colonial Powers',
                dominantPowerDescription: 'European and American powers colonize or dominate Polynesian islands through gunboat diplomacy, disease decimates populations, and missionaries transform societies.',
                eraContextSentence: 'an era of foreign domination, where island kingdoms fall to imperial ambitions.',
                allegianceGroups: [
                    { name: 'Colonial Administrators', type: 'primary', description: 'European and American control.' },
                    { name: 'Missionary Churches', type: 'religious', description: 'Christian denominations competing for converts.' },
                    { name: 'Surviving Royalty', type: 'secondary', description: 'Deposed or puppet monarchs.' },
                    { name: 'Indigenous Resistance', type: 'rebel', description: 'Groups fighting cultural destruction.' }
                ],
                structureNames: {
                    fortress: ['Colonial Fort', 'Naval Coaling Station'],
                    mill: ['Sugar Plantation', 'Copra Processing'],
                    factory: ['Whaling Station', 'Guano Mining'],
                    trading_post: ['Colonial Port', 'Mission Station', 'Trading Company Store'],
                    palace: ['Governor\'s Mansion', 'Deposed Royal Palace']
                },
                courtRoles: {
                    palace: ['Colonial Governor', 'High Commissioner', 'Missionary Bishop', 'Puppet King']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Mixed Governance',
                dominantPowerDescription: 'Some islands achieve independence while others remain territories, all facing challenges of isolation, climate change, and cultural preservation.',
                eraContextSentence: 'an era of limited sovereignty, where island nations navigate between tradition and modernity.',
                allegianceGroups: [
                    { name: 'Independent States', type: 'primary', description: 'Samoa, Tonga, and others with sovereignty.' },
                    { name: 'French Polynesia', type: 'primary', description: 'French overseas territories.' },
                    { name: 'American Territories', type: 'primary', description: 'Hawaii as US state, American Samoa.' },
                    { name: 'Cultural Movements', type: 'secondary', description: 'Indigenous renaissance groups.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Nuclear Test Site'],
                    factory: ['Tourism Resort', 'Tuna Cannery', 'Pearl Farm'],
                    trading_post: ['International Airport', 'Cruise Ship Port', 'Duty-Free Zone'],
                    holy_site: ['Restored Marae', 'National Cultural Center', 'Christian Cathedral'],
                    palace: ['Parliament Building', 'Royal Palace of Tonga']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Pacific Island States',
                dominantPowerDescription: 'Island nations lead global climate advocacy while facing existential threats from rising seas, strengthening regional cooperation and cultural identity.',
                eraContextSentence: 'an era of rising waters, where island nations fight for survival and justice.',
                allegianceGroups: [
                    { name: 'Pacific Island Forum', type: 'primary', description: 'Regional cooperation body gaining power.' },
                    { name: 'Climate Vulnerable Nations', type: 'secondary', description: 'Alliance demanding global action.' },
                    { name: 'China-Pacific Partnership', type: 'trade_company', description: 'Growing Chinese investment and influence.' },
                    { name: 'Diaspora Networks', type: 'secondary', description: 'Overseas communities supporting homelands.' }
                ],
                structureNames: {
                    fortress: ['Climate Monitoring Station', 'Seawall Defense'],
                    factory: ['Ocean Thermal Energy Plant', 'Floating Farm', 'Water Maker'],
                    trading_post: ['Digital Nomad Hub', 'Blockchain Registry', 'Climate Finance Center'],
                    holy_site: ['Voyaging Revival Center', 'Climate Justice Monument']
                }
            }
        },
        "Micronesia": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Early Micronesian Settlers',
                dominantPowerDescription: 'Austronesian peoples settle the scattered islands of Micronesia, developing unique navigation techniques and island adaptations.',
                eraContextSentence: 'an age of island settlement, where navigators master the vast ocean.',
                allegianceGroups: [
                    { name: 'Island Settlers', type: 'primary', description: 'Founding populations of various islands.' },
                    { name: 'Navigator Clans', type: 'secondary', description: 'Families maintaining sailing knowledge.' },
                    { name: 'Atoll Communities', type: 'secondary', description: 'Peoples adapting to coral islands.' }
                ],
                structureNames: {
                    fortress: ['Beach Defense', 'Reef Passage Control'],
                    mill: ['Taro Pit', 'Coconut Processing'],
                    holy_site: ['Spirit House', 'Navigation School', 'First Landing Site'],
                    trading_post: ['Inter-atoll Meeting Point']
                },
                courtRoles: {
                    holy_site: ['Master Navigator', 'Weather Reader', 'Genealogy Keeper']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Island Chiefdoms',
                dominantPowerDescription: 'Complex societies develop on larger islands like Pohnpei with monumental architecture, while atoll societies maintain maritime networks.',
                eraContextSentence: 'an era of stone cities, where Nan Madol rises from the reef.',
                allegianceGroups: [
                    { name: 'Saudeleur Dynasty', type: 'primary', description: 'Rulers of Pohnpei\'s stone city.' },
                    { name: 'Yapese Empire', type: 'secondary', description: 'Stone money traders influencing region.' },
                    { name: 'Atoll Alliances', type: 'secondary', description: 'Networks of smaller islands.' },
                    { name: 'Chuukese Warriors', type: 'rebel', description: 'Lagoon-based fighting societies.' }
                ],
                structureNames: {
                    fortress: ['Nan Madol', 'Hill Fort', 'Lagoon Stronghold'],
                    mill: ['Sakau (Kava) Garden', 'Breadfruit Preservation'],
                    holy_site: ['Stone Platform', 'Sacred Islet', 'Ancestor Shrine'],
                    palace: ['Dynasty Compound', 'Chief\'s Meeting House'],
                    trading_post: ['Stone Money Quarry', 'Canoe Exchange']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Indigenous Networks',
                dominantPowerDescription: 'Micronesian societies maintain traditional patterns while Spanish galleons pass through, establishing limited missionary presence on some islands.',
                eraContextSentence: 'an era of passing ships, where Spanish galleons bring new diseases and ideas.',
                allegianceGroups: [
                    { name: 'Traditional Chiefs', type: 'primary', description: 'Indigenous leadership structures.' },
                    { name: 'Spanish Missions', type: 'religious', description: 'Catholic presence on some islands.' },
                    { name: 'Inter-island Traders', type: 'trade_company', description: 'Traditional exchange networks.' },
                    { name: 'Isolated Atolls', type: 'secondary', description: 'Islands avoiding foreign contact.' }
                ],
                structureNames: {
                    fortress: ['Traditional Fortification', 'Mission Wall'],
                    mill: ['Copra Making', 'Traditional Crafts'],
                    holy_site: ['Catholic Church', 'Traditional Sacred Site', 'Navigator Training Ground'],
                    trading_post: ['Spanish Galleon Stop', 'Traditional Market']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Colonial Competition',
                dominantPowerDescription: 'Spain sells to Germany, Japan mandates after WWI, then US control after WWII, as Micronesians endure successive colonial regimes.',
                eraContextSentence: 'an era of changing flags, where island peoples endure successive foreign rules.',
                allegianceGroups: [
                    { name: 'German Administration', type: 'primary', description: 'Early colonial period.' },
                    { name: 'Japanese Mandate', type: 'primary', description: 'Interwar militarization.' },
                    { name: 'American Trust', type: 'primary', description: 'Post-WWII administration.' },
                    { name: 'Islander Resistance', type: 'rebel', description: 'Various forms of cultural preservation.' }
                ],
                structureNames: {
                    fortress: ['Colonial Headquarters', 'Japanese Fortification', 'US Naval Base'],
                    mill: ['Copra Plantation', 'Phosphate Mine'],
                    factory: ['Japanese Sugar Mill', 'Military Workshop'],
                    trading_post: ['Colonial Trading Post', 'Military Supply Depot'],
                    palace: ['Governor\'s Residence', 'Military Command']
                },
                courtRoles: {
                    palace: ['Colonial Governor', 'Military Commander', 'Native Magistrate', 'Company Manager']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Compact States',
                dominantPowerDescription: 'Micronesian nations achieve independence through Compacts of Free Association with the US, balancing sovereignty with economic dependence.',
                eraContextSentence: 'an era of complex sovereignty, where independence comes with strings attached.',
                allegianceGroups: [
                    { name: 'National Governments', type: 'primary', description: 'FSM, Palau, Marshall Islands governments.' },
                    { name: 'United States', type: 'secondary', description: 'Defense responsibility and funding.' },
                    { name: 'Traditional Leaders', type: 'secondary', description: 'Chiefs maintaining cultural authority.' },
                    { name: 'Taiwanese Relations', type: 'trade_company', description: 'Recognition politics and aid.' }
                ],
                structureNames: {
                    fortress: ['US Missile Range', 'Coast Guard Station'],
                    factory: ['Tuna Processing', 'Government Office Complex'],
                    trading_post: ['International Airport', 'Compact Impact Port', 'Dive Tourism Center'],
                    holy_site: ['WWII Memorial', 'Traditional Meeting House', 'Mormon Temple'],
                    palace: ['Presidential Office', 'State Capitol']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Micronesian States',
                dominantPowerDescription: 'Island nations face severe climate threats while becoming strategic prizes in US-China competition, leveraging their position for climate finance.',
                eraContextSentence: 'an era of sinking atolls and strategic value, where geography is destiny.',
                allegianceGroups: [
                    { name: 'National Governments', type: 'primary', description: 'States maximizing strategic position.' },
                    { name: 'US Military', type: 'secondary', description: 'Expanding presence against China.' },
                    { name: 'Chinese Outreach', type: 'trade_company', description: 'Infrastructure and aid competition.' },
                    { name: 'Climate Migration Planning', type: 'rebel', description: 'Groups preparing for evacuation.' }
                ],
                structureNames: {
                    fortress: ['Advanced Radar Station', 'Climate Bunker'],
                    factory: ['Floating Solar Farm', 'Aquaculture System', 'Emergency Desalination'],
                    trading_post: ['Satellite Ground Station', 'Climate Finance Hub', 'Digital Services Center'],
                    holy_site: ['Ancestor Reburial Site', 'Climate Prayer Center']
                }
            }
        },
        "Hawaii and Central Pacific": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Early Polynesian Settlers',
                dominantPowerDescription: 'Polynesian voyagers discover and settle the Hawaiian islands, establishing the foundations of Hawaiian culture in isolation.',
                eraContextSentence: 'an age of discovery, where voyagers find paradise in the vast Pacific.',
                allegianceGroups: [
                    { name: 'First Settlers', type: 'primary', description: 'Founding Polynesian population.' },
                    { name: 'Navigator Families', type: 'secondary', description: 'Maintaining connection to homeland.' },
                    { name: 'Island Communities', type: 'secondary', description: 'Separate settlements on different islands.' }
                ],
                structureNames: {
                    fortress: ['Coastal Settlement', 'Valley Refuge'],
                    mill: ['Taro Lo\'i', 'Fish Pond'],
                    holy_site: ['First Temple', 'Navigator\'s Shrine', 'Burial Cave'],
                    trading_post: ['Inter-island Landing']
                },
                courtRoles: {
                    holy_site: ['Kahuna Nui', 'Navigator Priest', 'Keeper of Genealogies']}
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Hawaiian Chiefdoms',
                dominantPowerDescription: 'Complex chiefdoms develop across the islands with sophisticated agricultural systems, religious practices, and inter-island warfare.',
                eraContextSentence: 'an era of rising chiefs, where ali\'i compete for mana and land.',
                allegianceGroups: [
                    { name: 'Island Ali\'i', type: 'primary', description: 'High chiefs ruling island districts.' },
                    { name: 'Kahuna Orders', type: 'religious', description: 'Priestly classes with specialized knowledge.' },
                    { name: 'Maka\'ainana', type: 'secondary', description: 'Commoner farmers and fishers.' },
                    { name: 'Koa Warriors', type: 'secondary', description: 'Professional warrior class.' }
                ],
                structureNames: {
                    fortress: ['Pu\'ukohola', 'Refuge City', 'Cliff Fort'],
                    mill: ['Extensive Lo\'i System', 'Fishpond Complex'],
                    holy_site: ['Heiau Temple', 'Pu\'uhonua (Refuge)', 'Royal Burial Site'],
                    palace: ['Ali\'i Compound', 'Chiefly Residence'],
                    trading_post: ['Ahupua\'a Center', 'Canoe Landing']
                },
                courtRoles: {
                    palace: ['Ali\'i Nui', 'Kalaimoku (Chief Advisor)', 'Kahuna Pule', 'Kuhina (Treasurer)']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Kingdom of Hawaii',
                dominantPowerDescription: 'Kamehameha I unifies the Hawaiian Islands through conquest, creating a centralized kingdom just as European contact begins.',
                eraContextSentence: 'an era of unification and contact, where Hawaiian kingdom meets the outside world.',
                allegianceGroups: [
                    { name: 'Kamehameha Dynasty', type: 'primary', description: 'Unified Hawaiian kingdom.' },
                    { name: 'District Chiefs', type: 'secondary', description: 'Ali\'i serving the king.' },
                    { name: 'Foreign Traders', type: 'trade_company', description: 'Early European and American visitors.' },
                    { name: 'Traditional Priests', type: 'religious', description: 'Kahuna maintaining old ways.' }
                ],
                structureNames: {
                    fortress: ['Royal Fort', 'Coastal Battery', 'Nu\'uanu Pali'],
                    mill: ['Sandalwood Collection', 'Expanded Agriculture'],
                    holy_site: ['State Heiau', 'Christian Mission', 'Royal Mausoleum'],
                    palace: ['Kamehameha\'s Compound', 'Iolani Palace (early)'],
                    trading_post: ['Honolulu Harbor', 'Sandalwood Station', 'Whaling Supply Port']
                },
                courtRoles: {
                    palace: ['Mō\'ī (King)', 'Kuhina Nui (Premier)', 'Foreign Advisor', 'Kahuna Nui']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Kingdom of Hawaii (Declining)',
                dominantPowerDescription: 'The Hawaiian Kingdom modernizes rapidly while American planters gain power, culminating in the illegal overthrow of Queen Liliuokalani.',
                eraContextSentence: 'an era of sovereignty lost, where sugar barons steal a nation.',
                allegianceGroups: [
                    { name: 'Hawaiian Monarchy', type: 'primary', description: 'Constitutional monarchy under threat.' },
                    { name: 'American Planters', type: 'rebel', description: 'Sugar interests seeking annexation.' },
                    { name: 'Native Hawaiians', type: 'secondary', description: 'Population devastated by disease.' },
                    { name: 'Asian Laborers', type: 'secondary', description: 'Imported plantation workers.' }
                ],
                structureNames: {
                    fortress: ['Royal Barracks', 'Planter Militia Post'],
                    mill: ['Sugar Mill', 'Pineapple Plantation'],
                    factory: ['Sugar Refinery', 'Railroad Depot'],
                    trading_post: ['Pearl Harbor', 'Plantation Store', 'Chinatown Market'],
                    palace: ['Iolani Palace', 'Queen\'s Residence (Washington Place)']
                },
                courtRoles: {
                    palace: ['Queen/King', 'Cabinet Ministers', 'American Advisors', 'Royal Guard Captain']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'United States of America',
                dominantPowerDescription: 'Hawaii becomes a US territory then the 50th state, transforming into a military bastion and tourist destination while Native Hawaiians seek sovereignty.',
                eraContextSentence: 'an era of statehood and struggle, where paradise serves American interests.',
                allegianceGroups: [
                    { name: 'US Federal Government', type: 'primary', description: 'American state and military control.' },
                    { name: 'State of Hawaii', type: 'secondary', description: 'Local government with limited autonomy.' },
                    { name: 'Hawaiian Sovereignty Movement', type: 'rebel', description: 'Native Hawaiians seeking independence.' },
                    { name: 'Tourism Industry', type: 'trade_company', description: 'Global hospitality corporations.' }
                ],
                structureNames: {
                    fortress: ['Pearl Harbor Naval Base', 'Hickam Air Force Base', 'Pacific Command'],
                    factory: ['Tourism Infrastructure', 'Tech Industry', 'Astronomy Facilities'],
                    trading_post: ['Waikiki Hotels', 'Ala Moana Center', 'Cruise Ship Terminal'],
                    holy_site: ['USS Arizona Memorial', 'Pu\'uhonua o Hōnaunau', 'Iolani Palace Museum'],
                    palace: ['State Capitol', 'Washington Place']
                },
                courtRoles: {
                    palace: ['Governor', 'Military Commander', 'Tourism Authority Chair', 'OHA Trustee']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'United States (Contested)',
                dominantPowerDescription: 'Hawaii remains a crucial US military hub for Indo-Pacific strategy while climate change, overtourism, and sovereignty movements intensify tensions.',
                eraContextSentence: 'an era of strategic importance and cultural resurgence, where Hawaii navigates multiple futures.',
                allegianceGroups: [
                    { name: 'US Indo-Pacific Command', type: 'primary', description: 'Enhanced military presence for China containment.' },
                    { name: 'Hawaiian Nation', type: 'rebel', description: 'Strengthened sovereignty movement with international support.' },
                    { name: 'Climate Refugee Influx', type: 'secondary', description: 'Pacific islanders fleeing rising seas.' },
                    { name: 'Chinese Influence', type: 'trade_company', description: 'Economic presence despite security concerns.' }
                ],
                structureNames: {
                    fortress: ['Integrated Defense Complex', 'Missile Defense System', 'Space Force Base'],
                    factory: ['Renewable Energy Complex', 'Vertical Farm System', 'Water Reclamation Plant'],
                    trading_post: ['Sustainable Tourism Hub', 'Pacific Climate Center', 'Digital Nomad Quarter'],
                    holy_site: ['Mauna Kea Protection Zone', 'Sovereignty Memorial', 'Climate Refugee Center']
                }
            }
        },
        "Croatia and Environs": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Illyrian Tribes',
                dominantPowerDescription: 'Indo-European Illyrian tribes control the Dalmatian coast and inland valleys, engaged in piracy, trade, and conflict with Greek colonies and later Rome.',
                eraContextSentence: 'an age of tribal kingdoms, where Illyrian pirates rule the Adriatic shores.',
                allegianceGroups: [
                    { name: 'Illyrian Tribes', type: 'primary', description: 'Dalmatae, Liburni, and other coastal peoples.' },
                    { name: 'Greek Colonies', type: 'trade_company', description: 'Trading posts on islands and coasts.' },
                    { name: 'Dacian Peoples', type: 'secondary', description: 'Thracian groups in Transylvanian highlands.' },
                    { name: 'Celtic Tribes', type: 'secondary', description: 'La Tène culture groups in northern areas.' }
                ],
                structureNames: {
                    fortress: ['Hill Fort', 'Coastal Stronghold', 'Mountain Refuge'],
                    mill: ['Salt Production', 'Iron Smelting'],
                    holy_site: ['Sacred Grove', 'Hilltop Sanctuary', 'Ancestral Burial Mound'],
                    trading_post: ['Pirate Harbor', 'Greek Trading Post', 'Alpine Pass Control']
                },
                courtRoles: {
                    palace: ['Tribal King', 'War Leader', 'Druid Priest', 'Trade Master']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Croat Duchies',
                dominantPowerDescription: 'Slavic Croats establish duchies along the Adriatic while Hungarians control Transylvania and Venice expands its maritime empire.',
                eraContextSentence: 'an era of emerging kingdoms, where Croats, Magyars, and Venetians compete for dominance.',
                allegianceGroups: [
                    { name: 'Croatian Kingdom', type: 'primary', description: 'Unified Croatian state under native dynasties.' },
                    { name: 'Hungarian Kingdom', type: 'primary', description: 'Magyar control over Transylvania and inland areas.' },
                    { name: 'Venetian Republic', type: 'trade_company', description: 'Maritime empire controlling coastal cities.' },
                    { name: 'Byzantine Empire', type: 'secondary', description: 'Declining eastern influence.' }
                ],
                structureNames: {
                    fortress: ['Royal Fortress', 'Venetian Citadel', 'Hungarian Castle'],
                    mill: ['Monastic Farm', 'Salt Works', 'Mining Village'],
                    holy_site: ['Benedictine Abbey', 'Orthodox Monastery', 'Royal Chapel'],
                    palace: ['Ban\'s Court', 'Doge\'s Palace', 'Voivode\'s Residence'],
                    trading_post: ['Adriatic Port', 'Hungarian Market Town', 'Alpine Trade Route']
                },
                courtRoles: {
                    palace: ['Ban of Croatia', 'Hungarian Voivode', 'Venetian Doge', 'Church Bishop']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Ottoman Empire',
                dominantPowerDescription: 'Ottoman expansion brings most of the region under Turkish control, while Habsburg Austria controls northern areas and Venice maintains coastal footholds.',
                eraContextSentence: 'an era of three empires, where Ottoman, Habsburg, and Venetian powers divide the land.',
                allegianceGroups: [
                    { name: 'Ottoman Empire', type: 'primary', description: 'Turkish control over most of the Balkans.' },
                    { name: 'Habsburg Austria', type: 'primary', description: 'Austrian control of northern Croatia and Transylvania.' },
                    { name: 'Venetian Republic', type: 'secondary', description: 'Dalmatian coastal cities and islands.' },
                    { name: 'Military Frontier', type: 'secondary', description: 'Habsburg-organized border defense against Ottomans.' }
                ],
                structureNames: {
                    fortress: ['Ottoman Fortress', 'Habsburg Border Fort', 'Venetian Sea Fortress'],
                    mill: ['Turkish Timar Estate', 'Austrian Manor', 'Venetian Villa'],
                    holy_site: ['Mosque', 'Catholic Cathedral', 'Orthodox Church'],
                    palace: ['Pasha\'s Palace', 'Habsburg Residenz', 'Venetian Governor\'s Palace'],
                    trading_post: ['Ottoman Bazaar', 'Venetian Fondaco', 'Habsburg Market']
                },
                courtRoles: {
                    palace: ['Ottoman Pasha', 'Austrian Governor', 'Venetian Provveditore', 'Military Frontier Commander']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Austro-Hungarian Empire',
                dominantPowerDescription: 'After Ottoman withdrawal, Austria-Hungary modernizes the region through railroads and industry while South Slavs develop national consciousness.',
                eraContextSentence: 'an era of imperial modernization and national awakening, where railways bring progress and rebellion.',
                allegianceGroups: [
                    { name: 'Austro-Hungarian Empire', type: 'primary', description: 'Dual monarchy controlling the region.' },
                    { name: 'South Slav Nationalists', type: 'rebel', description: 'Croats, Serbs, and others seeking independence.' },
                    { name: 'Hungarian Nobility', type: 'secondary', description: 'Magyar aristocrats in Transylvania.' },
                    { name: 'German Settlers', type: 'secondary', description: 'Saxon communities, especially in Transylvania.' }
                ],
                structureNames: {
                    fortress: ['Imperial Fortress', 'Police Station', 'Border Post'],
                    mill: ['Steam Mill', 'Timber Processing', 'Agricultural Estate'],
                    factory: ['Textile Factory', 'Iron Works', 'Brewery'],
                    trading_post: ['Railway Station', 'Imperial Port', 'Commercial Bank'],
                    palace: ['Governor\'s Palace', 'County Hall', 'Imperial Villa']
                },
                courtRoles: {
                    palace: ['Imperial Governor', 'Ban of Croatia', 'County Prefect', 'Military Commander']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Yugoslavia/Independent States',
                dominantPowerDescription: 'After WWI, the region joins Yugoslavia, endures WWII occupation and communist rule, then achieves independence in the 1990s through violent breakup.',
                eraContextSentence: 'an era of union and division, where Yugoslav unity gives way to national independence.',
                allegianceGroups: [
                    { name: 'Socialist Yugoslavia', type: 'primary', description: 'Tito\'s federal communist state.' },
                    { name: 'Independent Croatia', type: 'primary', description: 'Post-1991 independent republic.' },
                    { name: 'Independent Romania', type: 'secondary', description: 'Romanian control of Transylvania.' },
                    { name: 'European Union', type: 'trade_company', description: 'Growing integration with Western Europe.' }
                ],
                structureNames: {
                    fortress: ['JNA Barracks', 'Border Guards', 'NATO Base'],
                    factory: ['Socialist Factory', 'Tourism Complex', 'EU-Funded Plant'],
                    trading_post: ['Adriatic Port', 'International Airport', 'EU Trade Center'],
                    holy_site: ['Partisan Memorial', 'Catholic Shrine', 'War Victims Memorial'],
                    palace: ['Parliament Building', 'Presidential Palace', 'EU Office']
                },
                courtRoles: {
                    palace: ['President', 'Prime Minister', 'EU Commissioner', 'Military Chief']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'European Union',
                dominantPowerDescription: 'Croatia and Romania fully integrate into the EU while managing demographic decline, climate migration, and tensions between European and national identity.',
                eraContextSentence: 'an era of European integration and population decline, where ancient lands adapt to new realities.',
                allegianceGroups: [
                    { name: 'European Union', type: 'primary', description: 'Integrated European governance and economy.' },
                    { name: 'National Governments', type: 'secondary', description: 'Croatian and Romanian state institutions.' },
                    { name: 'Climate Migrants', type: 'secondary', description: 'Refugees from Mediterranean and Africa.' },
                    { name: 'Diaspora Networks', type: 'trade_company', description: 'Emigrant communities supporting homelands.' }
                ],
                structureNames: {
                    fortress: ['EU Border Agency', 'Climate Defense System'],
                    factory: ['Renewable Energy Hub', 'Agricultural Automation', 'Tech Innovation Center'],
                    trading_post: ['Digital Services Hub', 'Climate Adaptation Center', 'Diaspora Investment Office'],
                    holy_site: ['European Values Memorial', 'Multicultural Center']
                }
            }
        },
        "Indonesian and Melanesian Islands": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Austronesian Peoples',
                dominantPowerDescription: 'Austronesian seafarers settle the vast island chains, developing diverse maritime cultures, trade networks, and agricultural systems adapted to tropical islands.',
                eraContextSentence: 'an age of island settlement, where seafaring peoples master the tropical archipelago.',
                allegianceGroups: [
                    { name: 'Austronesian Settlers', type: 'primary', description: 'Founding populations across the islands.' },
                    { name: 'Melanesian Peoples', type: 'secondary', description: 'Earlier inhabitants of eastern islands.' },
                    { name: 'Maritime Traders', type: 'trade_company', description: 'Inter-island exchange networks.' },
                    { name: 'Highland Societies', type: 'secondary', description: 'Mountain-dwelling communities.' }
                ],
                structureNames: {
                    fortress: ['Coastal Fortification', 'Hilltop Refuge', 'Island Stronghold'],
                    mill: ['Rice Terrace', 'Sago Processing', 'Spice Garden'],
                    holy_site: ['Ancestor Shrine', 'Sacred Mountain', 'Sea Spirit Temple'],
                    trading_post: ['Island Harbor', 'Coastal Market', 'Spice Trading Post']
                },
                courtRoles: {
                    holy_site: ['High Priest', 'Navigation Master', 'Ancestor Keeper', 'Island Chief']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Hindu-Buddhist Kingdoms',
                dominantPowerDescription: 'Powerful maritime empires like Srivijaya and Majapahit dominate trade routes, spreading Hindu-Buddhist culture while local chiefs maintain traditional authority.',
                eraContextSentence: 'an era of spice empires, where Hindu-Buddhist kings rule the sea lanes.',
                allegianceGroups: [
                    { name: 'Srivijaya Empire', type: 'primary', description: 'Sumatran maritime empire controlling trade.' },
                    { name: 'Majapahit Empire', type: 'primary', description: 'Javanese kingdom extending across archipelago.' },
                    { name: 'Local Rajahs', type: 'secondary', description: 'Indigenous rulers maintaining autonomy.' },
                    { name: 'Buddhist Monasteries', type: 'religious', description: 'Centers of learning and trade.' }
                ],
                structureNames: {
                    fortress: ['Royal Kraton', 'Island Fort', 'Trade Route Control'],
                    mill: ['Spice Plantation', 'Rice Estate', 'Textile Workshop'],
                    holy_site: ['Buddhist Temple', 'Hindu Shrine', 'Royal Mausoleum'],
                    palace: ['Sultan\'s Palace', 'Rajah\'s Compound', 'Trade Guild Hall'],
                    trading_post: ['Spice Entrepôt', 'Monastery Market', 'Royal Trading House']
                },
                courtRoles: {
                    palace: ['Sultan/Rajah', 'Prime Minister', 'Trade Master', 'High Priest']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Islamic Sultanates',
                dominantPowerDescription: 'Islam spreads through trade networks, establishing sultanates across the islands while maintaining Hindu-Buddhist traditions and local customs.',
                eraContextSentence: 'an era of Islamic conversion, where new faith mixes with ancient traditions.',
                allegianceGroups: [
                    { name: 'Islamic Sultanates', type: 'primary', description: 'Muslim rulers across major islands.' },
                    { name: 'Hindu-Buddhist Kingdoms', type: 'secondary', description: 'Remaining non-Islamic states like Bali.' },
                    { name: 'Portuguese Traders', type: 'trade_company', description: 'First European trading presence.' },
                    { name: 'Local Chiefs', type: 'secondary', description: 'Traditional leaders adapting to Islam.' }
                ],
                structureNames: {
                    fortress: ['Sultanate Fort', 'Portuguese Factory', 'Island Citadel'],
                    mill: ['Clove Plantation', 'Nutmeg Grove', 'Islamic School'],
                    holy_site: ['Grand Mosque', 'Hindu Temple', 'Sacred Grave'],
                    palace: ['Sultan\'s Istana', 'Portuguese Governor\'s House', 'Traditional Chief\'s Hall'],
                    trading_post: ['Islamic Trading House', 'Portuguese Factory', 'Spice Market']
                },
                courtRoles: {
                    palace: ['Sultan', 'Islamic Scholar', 'Portuguese Captain', 'Traditional Elder']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Dutch East Indies',
                dominantPowerDescription: 'The Dutch VOC and later colonial government establish control over most islands, introducing plantation agriculture and extractive economy while suppressing local rulers.',
                eraContextSentence: 'an era of colonial exploitation, where Dutch rule transforms ancient kingdoms into plantations.',
                allegianceGroups: [
                    { name: 'Dutch Colonial Government', type: 'primary', description: 'Netherlands Indies administration.' },
                    { name: 'Indigenous Resistance', type: 'rebel', description: 'Local rulers and peoples fighting colonization.' },
                    { name: 'Plantation Companies', type: 'trade_company', description: 'Dutch and European agricultural enterprises.' },
                    { name: 'Chinese Merchants', type: 'secondary', description: 'Trading communities serving colonial economy.' }
                ],
                structureNames: {
                    fortress: ['Dutch Fort', 'Colonial Barracks', 'Resistance Stronghold'],
                    mill: ['Sugar Plantation', 'Coffee Estate', 'Rubber Plantation'],
                    factory: ['Sugar Mill', 'Tobacco Processing', 'Colonial Workshop'],
                    trading_post: ['Colonial Port', 'Company Trading House', 'Chinese Quarter'],
                    palace: ['Governor\'s Palace', 'Resident\'s House', 'Deposed Sultan\'s Palace']
                },
                courtRoles: {
                    palace: ['Governor-General', 'Resident', 'Plantation Manager', 'Chinese Captain']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Republic of Indonesia',
                dominantPowerDescription: 'After independence struggle, Indonesia unifies the archipelago under Pancasila ideology while managing ethnic diversity, separatist movements, and economic development.',
                eraContextSentence: 'an era of national unity and diversity, where one nation encompasses thousands of islands.',
                allegianceGroups: [
                    { name: 'Indonesian Government', type: 'primary', description: 'Central government in Jakarta.' },
                    { name: 'Regional Autonomy', type: 'secondary', description: 'Provincial and local governments.' },
                    { name: 'Separatist Movements', type: 'rebel', description: 'Groups seeking independence in various regions.' },
                    { name: 'Foreign Investors', type: 'trade_company', description: 'International corporations and countries.' }
                ],
                structureNames: {
                    fortress: ['TNI Base', 'Police Station', 'Border Post'],
                    factory: ['Palm Oil Mill', 'Textile Factory', 'Mining Operation'],
                    trading_post: ['International Port', 'Tourism Resort', 'Industrial Zone'],
                    holy_site: ['National Monument', 'Islamic Center', 'Cultural Heritage Site'],
                    palace: ['Governor\'s Office', 'Presidential Palace', 'Regency Hall']
                },
                courtRoles: {
                    palace: ['President', 'Governor', 'Military Commander', 'Religious Leader']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Indonesian Federation',
                dominantPowerDescription: 'Indonesia navigates climate change impacts, rising seas threatening low-lying islands, and tensions between central authority and regional autonomy in a changing world.',
                eraContextSentence: 'an era of sinking islands and federal adaptation, where unity faces environmental and political challenges.',
                allegianceGroups: [
                    { name: 'Federal Indonesian Government', type: 'primary', description: 'Evolved central authority managing crisis.' },
                    { name: 'Climate Displaced', type: 'secondary', description: 'Populations fleeing rising seas.' },
                    { name: 'Chinese Belt and Road', type: 'trade_company', description: 'Major infrastructure investment partner.' },
                    { name: 'Regional Autonomy Movements', type: 'rebel', description: 'Regions seeking greater self-rule.' }
                ],
                structureNames: {
                    fortress: ['Climate Defense Center', 'Floating Military Base'],
                    factory: ['Renewable Energy Plant', 'Floating Agriculture', 'Seaweed Farm'],
                    trading_post: ['Climate Adaptation Hub', 'Digital Services Center', 'Refugee Processing'],
                    holy_site: ['Sunken Island Memorial', 'Interfaith Climate Center']
                }
            }
        },
        "Major Seas and Oceans": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Open Waters',
                dominantPowerDescription: 'Vast ocean expanses with minimal human presence, occasionally crossed by early navigators and traders but largely empty of permanent settlement.',
                eraContextSentence: 'an age of empty seas, where only the bravest navigators dare cross the endless waters.',
                allegianceGroups: [
                    { name: 'Polynesian Navigators', type: 'trade_company', description: 'Rare voyaging expeditions.' },
                    { name: 'Coastal Fishermen', type: 'secondary', description: 'Small-scale near-shore activities.' },
                    { name: 'Ocean Spirits', type: 'religious', description: 'Supernatural forces believed to control the seas.' }
                ],
                structureNames: {
                    trading_post: ['Temporary Fishing Camp', 'Navigator\'s Rest Stop'],
                    holy_site: ['Sacred Island', 'Sea Spirit Shrine']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Maritime Trade Routes',
                dominantPowerDescription: 'Established sea lanes connect distant lands through regular trading voyages, but the open ocean remains largely uninhabited except for passing vessels.',
                eraContextSentence: 'an era of trade winds, where merchant ships follow ancient routes across empty seas.',
                allegianceGroups: [
                    { name: 'Arab Traders', type: 'trade_company', description: 'Islamic merchants crossing Indian Ocean.' },
                    { name: 'Chinese Junks', type: 'trade_company', description: 'Imperial trading fleets.' },
                    { name: 'Polynesian Voyagers', type: 'secondary', description: 'Continued Pacific exploration.' },
                    { name: 'Pirates and Raiders', type: 'rebel', description: 'Occasional maritime predators.' }
                ],
                structureNames: {
                    fortress: ['Pirate Haven', 'Naval Patrol Base'],
                    trading_post: ['Supply Station', 'Merchant Fleet Harbor', 'Caravanserai of the Sea']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'European Naval Powers',
                dominantPowerDescription: 'European exploration and trade create regular shipping lanes across major oceans, with naval bases and trading posts but limited permanent settlement in open waters.',
                eraContextSentence: 'an era of great voyages, where European ships open new sea routes to distant lands.',
                allegianceGroups: [
                    { name: 'Portuguese Empire', type: 'primary', description: 'Pioneer of oceanic exploration.' },
                    { name: 'Spanish Empire', type: 'primary', description: 'Pacific and Atlantic trade routes.' },
                    { name: 'Dutch East India Company', type: 'trade_company', description: 'Dominant Indian Ocean traders.' },
                    { name: 'Pirates and Privateers', type: 'rebel', description: 'Maritime raiders preying on trade.' }
                ],
                structureNames: {
                    fortress: ['Naval Base', 'Pirate Stronghold', 'Coastal Battery'],
                    trading_post: ['Supply Station', 'Trading Company Post', 'Merchant Marine Harbor']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'British Naval Empire',
                dominantPowerDescription: 'British naval dominance secures global shipping lanes with coaling stations and naval bases, while steamships make ocean travel more regular and predictable.',
                eraContextSentence: 'an era of steam and steel, where British naval power rules the waves.',
                allegianceGroups: [
                    { name: 'Royal Navy', type: 'primary', description: 'British naval supremacy worldwide.' },
                    { name: 'Merchant Marine', type: 'trade_company', description: 'Commercial shipping companies.' },
                    { name: 'Other Naval Powers', type: 'secondary', description: 'German, French, American, and Japanese fleets.' },
                    { name: 'Telegraph Cable Companies', type: 'trade_company', description: 'Underwater communication networks.' }
                ],
                structureNames: {
                    fortress: ['Naval Coaling Station', 'Cable Relay Station', 'Lighthouse Complex'],
                    trading_post: ['Steamship Line Terminal', 'Marine Insurance Office', 'Weather Station'],
                    factory: ['Ship Repair Facility', 'Cable Manufacturing']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'International Waters',
                dominantPowerDescription: 'Global shipping networks carry most international trade while naval powers patrol sea lanes, but vast ocean areas remain under international maritime law with minimal permanent presence.',
                eraContextSentence: 'an era of global commerce, where container ships and naval patrols cross regulated international waters.',
                allegianceGroups: [
                    { name: 'International Maritime Organization', type: 'primary', description: 'Global shipping regulations.' },
                    { name: 'Major Naval Powers', type: 'secondary', description: 'US, Russian, Chinese, and allied fleets.' },
                    { name: 'Commercial Shipping', type: 'trade_company', description: 'Global cargo and passenger lines.' },
                    { name: 'Fishing Fleets', type: 'trade_company', description: 'Industrial fishing operations.' }
                ],
                structureNames: {
                    fortress: ['Naval Patrol Base', 'Coast Guard Station', 'Submarine Base'],
                    factory: ['Offshore Oil Platform', 'Floating Factory Ship', 'Research Vessel'],
                    trading_post: ['Container Ship Route', 'Cruise Ship Terminal', 'Fishing Fleet Base'],
                    holy_site: ['Maritime Memorial', 'Environmental Monitoring Station']
                }
            },
            [HistoricalEra.FUTURE_ERA]: {
                dominantPower: 'Climate-Affected Waters',
                dominantPowerDescription: 'Rising seas and changing weather patterns disrupt traditional shipping while new technologies create floating cities, sea-based energy farms, and ocean-based solutions to climate change.',
                eraContextSentence: 'an era of rising waters and floating solutions, where humanity adapts to life on the changing seas.',
                allegianceGroups: [
                    { name: 'Maritime Climate Alliance', type: 'primary', description: 'International cooperation on ocean-based climate solutions.' },
                    { name: 'Floating Nation States', type: 'secondary', description: 'Artificial islands and sea-based communities.' },
                    { name: 'Ocean Engineering Corps', type: 'trade_company', description: 'Companies building sea-based infrastructure.' },
                    { name: 'Climate Pirates', type: 'rebel', description: 'Groups exploiting weakened maritime security.' }
                ],
                structureNames: {
                    fortress: ['Floating Defense Platform', 'Ocean Patrol Drone Base'],
                    factory: ['Ocean Energy Farm', 'Floating City Module', 'Seaweed Agriculture Platform'],
                    trading_post: ['Autonomous Shipping Hub', 'Climate Refugee Port', 'Ocean Resource Exchange'],
                    holy_site: ['Sunken Land Memorial', 'Ocean Conservation Shrine']
                }
            }
        }
    }
};