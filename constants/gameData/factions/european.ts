
/**
 * constants/gameData/factions/european.ts
 * Enhanced faction data for European cultural zones with historical granularity.
 */
import { HistoricalEra } from '../../../types';
import { FactionFile } from './types';

const MODERN_ERA = 'MODERN_ERA';

export const EUROPEAN_FACTIONS: FactionFile = {
    'EUROPEAN': {
        "British Isles": {
            [HistoricalEra.PREHISTORY]: {
                dominantPower: 'Beaker Culture',
                dominantPowerDescription: 'Bronze Age peoples who brought metalworking and distinctive pottery styles to the islands, building stone circles and burial mounds.',
                eraContextSentence: 'a time of stone monuments and bronze tools, where chieftains rule from hillforts and druids perform rituals at sacred circles.',
                allegianceGroups: [
                    { name: 'Beaker Folk', type: 'primary', description: 'Bronze Age settlers with advanced metalworking.' },
                    { name: 'Native Britons', type: 'secondary', description: 'Earlier Neolithic peoples of the islands.' },
                    { name: 'Seafaring Traders', type: 'secondary', description: 'Maritime peoples trading tin and copper.' }
                ],
                structureNames: {
                    fortress: ['Hillfort', 'Dun', 'Broch', 'Timber Palisade'],
                    quarry: ['Flint Mine', 'Tin Stream', 'Copper Pit'],
                    holy_site: ['Stone Circle', 'Burial Mound', 'Sacred Grove', 'Standing Stones', 'Ritual Enclosure'],
                    palace: ["Chieftain's Hall", 'Roundhouse Complex', 'Great Lodge'],
                },
                courtRoles: {
                    palace: ['Chieftain', 'War Leader', 'Bronze Smith', 'Druid', 'Bard', 'Elder']
                }
            },
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Roman Britain',
                dominantPowerDescription: 'The province is under the control of the Roman Empire, with legions enforcing peace and Roman-style cities flourishing.',
                eraContextSentence: "an age of imperial order, where Roman roads connect bustling towns under the watchful eye of the legions.",
                allegianceGroups: [
                    { name: 'Roman Empire', type: 'primary', description: 'The governing imperial power.' },
                    { name: 'Caledonian Tribes', type: 'rebel', description: 'Unconquered peoples to the north.' },
                    { name: 'Hibernian Clans', type: 'secondary', description: 'Tribal groups across the western sea.' }
                ],
                structureNames: {
                    fortress: ['Castrum', 'Roman Fort', 'Saxon Shore Fort', 'Legionary Fortress'],
                    quarry: ['Stone Quarry', 'Chalk Pit', 'Lead Mine'],
                    holy_site: ['Temple of Mithras', 'Celtic Shrine', 'Romano-British Temple', 'Sacred Spring'],
                    palace: ["Governor's Villa", "Civic Basilica", "Roman Forum"],
                },
                courtRoles: {
                    palace: ['Legate', 'Prefect', 'Scribe', 'Centurion', 'Decurion', 'Procurator']
                },
                mapAreaOverrides: {
                    "Hadrian's Wall": {
                        dominantPower: 'Roman Frontier Command',
                        dominantPowerDescription: 'The militarized northern frontier, where Roman legions face constant raids from unconquered Caledonian tribes.',
                        allegianceGroups: [
                            { name: 'Roman Frontier Legions', type: 'primary', description: 'Elite troops guarding the wall.' },
                            { name: 'Pictish Raiders', type: 'rebel', description: 'Warriors from beyond the wall.' },
                            { name: 'Brigantes', type: 'secondary', description: 'Local tribes integrated into frontier defense.' }
                        ]
                    },
                    "Dublin": {
                        dominantPower: 'Hibernian Tribes',
                        dominantPowerDescription: 'Beyond Roman reach, Celtic Ireland maintains its traditional warrior culture and druidic traditions.',
                        allegianceGroups: [
                            { name: 'High King of Tara', type: 'primary', description: 'The ceremonial overlord of Irish kingdoms.' },
                            { name: 'Ulster Warriors', type: 'secondary', description: 'The legendary Red Branch warriors.' },
                            { name: 'Munster Kings', type: 'secondary', description: 'Southern Irish dynasties.' }
                        ]
                    },
                    "York": {
                        dominantPower: 'Eboracum Legionary Fortress',
                        dominantPowerDescription: 'The Roman capital of northern Britain, Eboracum serves as a major legionary base and administrative center.',
                        allegianceGroups: [
                            { name: 'Ninth Legion Hispana / Sixth Victrix', type: 'primary', description: 'The Roman legion garrisoning the fortress.' },
                            { name: 'Brigantian Civitas', type: 'secondary', description: 'The local Celtic tribe, administered from the city.' },
                            { name: 'Imperial Governor', type: 'secondary', description: 'The Emperor often visited or ruled from Eboracum.' }
                        ]
                    },
                    "Thames Estuary": {
                        dominantPower: 'Saxon Shore Command',
                        dominantPowerDescription: 'A series of coastal forts built to defend against Saxon pirates, guarding the approaches to Londinium.',
                        allegianceGroups: [
                            { name: 'Classis Britannica', type: 'primary', description: 'The Roman fleet patrolling the channel.' },
                            { name: 'Saxon Raiders', type: 'rebel', description: 'Germanic pirates staging hit-and-run attacks.' },
                            { name: 'Romano-British Merchants', type: 'trade_company', description: 'Traders relying on the forts for protection.' }
                        ]
                    }
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Kingdom of England',
                dominantPowerDescription: 'A powerful feudal kingdom, often in conflict with its neighbors in Scotland, Wales, and across the channel in France.',
                eraContextSentence: 'an era of castles and crusades, where the English Crown vies for dominance over the isles.',
                allegianceGroups: [
                    { name: 'Kingdom of England', type: 'primary', description: 'The dominant feudal monarchy.' },
                    { name: 'Kingdom of Scotland', type: 'secondary', description: 'A rival kingdom to the north.' },
                    { name: 'Welsh Principalities', type: 'rebel', description: 'Independent Welsh rulers resisting English control.' },
                    { name: 'Irish Lordships', type: 'secondary', description: 'Gaelic and Norman lords in Ireland.' }
                ],
                structureNames: {
                    fortress: ['Castle Keep', 'Motte-and-bailey', 'Tower House', 'Pele Tower', 'Barbican'],
                    mill: ['Gristmill', 'Watermill', 'Windmill', 'Tide Mill'],
                    holy_site: ['Abbey', 'Monastery', 'Cathedral', 'Parish Church', 'Hermitage', 'Priory'],
                    palace: ['Royal Castle', "Baron's Hall", "Great Hall", 'Manor House'],
                },
                courtRoles: {
                    palace: ['Lord Chancellor', 'Chamberlain', 'Castellan', 'Master of the Hunt', 'Reeve', 'Seneschal', 'Marshal'],
                    holy_site: ['Abbot', 'Bishop', 'Prior', 'Keeper of Relics', 'Almoner', 'Cellarer', 'Sacristan']
                },
                mapAreaOverrides: {
                    "London": {
                        dominantPower: 'City of London Corporation',
                        dominantPowerDescription: 'A powerful and semi-independent city, growing rich from trade and defending its privileges from the Crown.',
                        allegianceGroups: [
                            { name: 'Lord Mayor of London', type: 'primary', description: 'The leader of the city\'s merchant oligarchy.' },
                            { name: 'The Crown', type: 'secondary', description: 'The monarchy, often in need of London\'s loans.' },
                            { name: 'Hanseatic League', type: 'trade_company', description: 'German merchants with a trading post at the Steelyard.' }
                        ]
                    },
                    "Edinburgh": {
                        dominantPower: 'Kingdom of Scotland',
                        dominantPowerDescription: 'A proud kingdom maintaining independence through alliance with France and fierce resistance to English expansion.',
                        allegianceGroups: [
                            { name: 'Kingdom of Scotland', type: 'primary', description: 'The Stewart monarchy.' },
                            { name: 'Highland Clans', type: 'secondary', description: 'Gaelic-speaking warrior clans.' },
                            { name: 'Kingdom of England', type: 'secondary', description: 'The southern threat.' }
                        ]
                    },
                    "Dublin": {
                        dominantPower: 'Lordship of Ireland',
                        dominantPowerDescription: 'Centered on the Pale around Dublin, English control is contested by powerful Hiberno-Norman lords and resurgent Gaelic Irish kingdoms.',
                        allegianceGroups: [
                            { name: 'English Crown', type: 'primary', description: 'Distant overlord ruling from Dublin Castle.' },
                            { name: 'Hiberno-Norman Lords', type: 'secondary', description: 'Norman invaders who have "gone native".' },
                            { name: 'Gaelic Irish Clans', type: 'rebel', description: 'Native Irish resisting foreign rule.' }
                        ]
                    }
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Tudor Dynasty',
                dominantPowerDescription: 'A period of Renaissance culture and religious turmoil, as the Tudor monarchs consolidate power and break from the Roman Church.',
                eraContextSentence: 'an age of artistic renaissance and religious reformation under the powerful Tudor monarchy.',
                allegianceGroups: [
                    { name: 'Kingdom of England', type: 'primary', description: 'The increasingly centralized Tudor state.' },
                    { name: 'Kingdom of Scotland', type: 'secondary', description: 'A neighboring kingdom, often in alliance with France.' },
                    { name: 'Irish Clans', type: 'rebel', description: 'Gaelic clans resisting Tudor expansion.' },
                    { name: 'Spanish Empire', type: 'secondary', description: 'A major Catholic rival.' }
                ],
                structureNames: {
                    fortress: ['Artillery Fort', 'Bastion', 'Citadel', 'Star Fort', 'Coastal Defense'],
                    mill: ['Water Mill', 'Fulling Mill', 'Tide Mill', 'Paper Mill'],
                    holy_site: ['Parish Church', 'Dissolved Abbey', 'Pilgrim Chapel', 'Protestant Meeting House'],
                    palace: ['Tudor Manor', 'Country Estate', 'Royal Palace', 'Prodigy House'],
                    trading_post: ['Wool Market', 'Trading Company Office', 'Guildhall', 'Custom House']
                },
                courtRoles: {
                    palace: ['Privy Councillor', 'Master of the Revels', 'Lord Treasurer', 'Captain of the Guard', 'Groom of the Stool']
                },
                mapAreaOverrides: {
                    "Cliffs of Dover": {
                        dominantPower: 'The Cinque Ports',
                        dominantPowerDescription: 'A confederation of coastal towns, including Dover, providing ships and men for the crown in exchange for legal and tax exemptions.',
                        allegianceGroups: [
                            { name: 'Lord Warden of the Cinque Ports', type: 'primary', description: 'Commander of the confederation\'s fleet and defenses.' },
                            { name: 'Spanish Armada', type: 'rebel', description: 'The Catholic threat from across the Channel.' },
                            { name: 'English Crown', type: 'secondary', description: 'Reliant on the ports for naval defense.' }
                        ]
                    }
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'British Empire',
                dominantPowerDescription: "The British Empire, upon which 'the sun never sets', is the dominant global power. Its naval supremacy and industrial might project its influence into every corner of the world.",
                eraContextSentence: "an age of steam and steel, where the industrial and naval power of the British Empire shapes global trade and politics.",
                allegianceGroups: [
                    { name: 'British Empire', type: 'primary', description: 'The dominant global industrial and colonial power.' },
                    { name: 'Irish Nationalists', type: 'rebel', description: 'Movements seeking home rule or independence for Ireland.' },
                    { name: 'French Empire', type: 'secondary', description: 'A primary colonial and military rival.' },
                    { name: 'East India Company', type: 'trade_company', description: 'A powerful trading company with its own armies.' }
                ],
                structureNames: {
                    fortress: ['Barracks', 'Naval Dockyard', 'Coastal Battery', 'Martello Tower', 'Arsenal'],
                    mill: ['Textile Mill', 'Steam Mill', 'Rolling Mill'],
                    mining_colony: ['Coal Mine', 'Tin Mine', 'Lead Mine', 'Slate Quarry'],
                    factory: ['Ironworks', 'Pottery Factory', 'Shipyard', 'Cotton Mill', 'Locomotive Works'],
                    trading_post: ['Canal Lock', 'Railway Station', 'Shipping Office', 'Stock Exchange', 'Dock Warehouse']
                },
                courtRoles: {
                    palace: ['Prime Minister', 'Cabinet Secretary', 'Admiral of the Fleet', 'Governor-General', 'Colonial Secretary']
                },
                mapAreaOverrides: {
                    "Dublin": {
                        dominantPower: 'United Kingdom of Great Britain and Ireland',
                        dominantPowerDescription: 'Dublin serves as the seat of British administration in Ireland, though nationalist sentiment grows stronger.',
                        allegianceGroups: [
                            { name: 'British Administration', type: 'primary', description: 'The vice-regal government at Dublin Castle.' },
                            { name: 'Irish Parliamentary Party', type: 'secondary', description: 'Advocates for Home Rule through politics.' },
                            { name: 'Fenian Brotherhood', type: 'rebel', description: 'Revolutionary republicans seeking independence.' }
                        ]
                    },
                    "Oxfordshire": {
                        dominantPower: 'University of Oxford',
                        dominantPowerDescription: 'A center of academic and theological debate, navigating the challenges of industrialization while preserving ancient traditions.',
                        allegianceGroups: [
                            { name: 'University Dons', type: 'primary', description: 'The academic elite governing the colleges.' },
                            { name: 'Oxford Movement', type: 'religious', description: 'A high-church Anglican revival with national influence.' },
                            { name: 'Rural Gentry', type: 'secondary', description: 'Landowners whose world is being changed by industry.' }
                        ]
                    }
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'United Kingdom',
                dominantPowerDescription: 'The United Kingdom adapts to the post-imperial world, transforming from global empire to modern European nation while maintaining significant cultural influence.',
                eraContextSentence: 'an era of transformation, where Britain adapts from empire to modern democracy in a changing world.',
                allegianceGroups: [
                    { name: 'United Kingdom', type: 'primary', description: 'The constitutional monarchy governing the isles.' },
                    { name: 'Commonwealth Nations', type: 'secondary', description: 'Former territories maintaining ties with Britain.' },
                    { name: 'European Economic Community', type: 'secondary', description: 'The continental trading bloc Britain joins in 1973.' },
                    { name: 'Irish Republicans', type: 'rebel', description: 'Groups seeking to end British rule in Northern Ireland.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Naval Dockyard', 'RAF Airfield', 'Civil Defense Bunker'],
                    factory: ['Automobile Plant', 'Steelworks', 'Electronics Factory', 'Aircraft Factory'],
                    trading_post: ['International Airport', 'Container Port', 'Motorway Services', 'Shopping Centre'],
                    quarry: ['Limestone Quarry', 'Granite Quarry', 'Slate Quarry', 'Gravel Pit'],
                    mining_colony: ['Technology Park', 'Research Facility', 'North Sea Oil Platform'],
                },
                courtRoles: {
                    palace: ['Private Secretary', 'Master of the Household', 'Lord Chamberlain', 'Equerry'],
                    holy_site: ['Archbishop', 'Dean', 'Canon', 'Verger'],
                }
            },
            "1920s": {
                dominantPower: 'British Empire at its Zenith',
                dominantPowerDescription: 'The empire reaches its greatest territorial extent after World War I, but faces growing independence movements and economic challenges.',
                eraContextSentence: 'the aftermath of the Great War, where victory brings new territories but also new burdens.',
                allegianceGroups: [
                    { name: 'British Empire', type: 'primary', description: 'The world\'s largest empire, now holding League of Nations mandates.' },
                    { name: 'Irish Free State', type: 'secondary', description: 'Newly independent dominion after the War of Independence.' },
                    { name: 'Labour Movement', type: 'secondary', description: 'Growing political force challenging the old order.' }
                ],
                mapAreaOverrides: {
                    "Dublin": {
                        dominantPower: 'Irish Free State',
                        dominantPowerDescription: 'After a bitter war of independence and civil war, Dublin is capital of the new Irish Free State, a dominion within the British Commonwealth.',
                        allegianceGroups: [
                            { name: 'Irish Free State', type: 'primary', description: 'The new government under the Anglo-Irish Treaty.' },
                            { name: 'Anti-Treaty IRA', type: 'rebel', description: 'Republicans rejecting the treaty and dominion status.' },
                            { name: 'British Commonwealth', type: 'secondary', description: 'The loose association Ireland remains part of.' }
                        ]
                    }
                }
            },
            "1940s": {
                dominantPower: 'United Kingdom at War',
                dominantPowerDescription: 'Britain stands alone against Nazi Germany before leading the Allied victory, but emerges economically devastated and facing imperial decline.',
                eraContextSentence: 'their finest hour, when Britain endures the Blitz and helps defeat fascism, but at tremendous cost.',
                allegianceGroups: [
                    { name: 'United Kingdom', type: 'primary', description: 'The wartime coalition government.' },
                    { name: 'United States', type: 'secondary', description: 'The essential ally and emerging superpower.' },
                    { name: 'Free French', type: 'secondary', description: 'Allied government-in-exile based in London.' }
                ]
            },
            "1970s": {
                dominantPower: 'United Kingdom in Crisis',
                dominantPowerDescription: 'Economic stagnation, industrial strife, and the Troubles in Northern Ireland mark a decade of British decline and uncertainty.',
                eraContextSentence: 'the winter of discontent, where strikes paralyze the nation and violence stalks Northern Ireland.',
                allegianceGroups: [
                    { name: 'United Kingdom', type: 'primary', description: 'The struggling parliamentary democracy.' },
                    { name: 'European Economic Community', type: 'secondary', description: 'The continental bloc Britain joined in 1973.' },
                    { name: 'Provisional IRA', type: 'rebel', description: 'Paramilitary group waging bombing campaign.' }
                ]
            }
        },
        "France": {
            [HistoricalEra.PREHISTORY]: {
                dominantPower: 'La Tène Culture',
                dominantPowerDescription: 'Iron Age Celtic peoples known for their elaborate metalwork, fortified oppida, and warrior culture that would later challenge Rome itself.',
                eraContextSentence: 'a time of Celtic druids and warriors, where hillforts dominate the landscape and iron weapons determine power.',
                allegianceGroups: [
                    { name: 'Gallic Tribes', type: 'primary', description: 'Powerful Celtic confederations.' },
                    { name: 'Belgae Warriors', type: 'secondary', description: 'Northern tribes known for their ferocity.' },
                    { name: 'Greek Colonies', type: 'secondary', description: 'Mediterranean traders in the south.' }
                ],
                structureNames: {
                    fortress: ['Oppidum', 'Hillfort', 'Murus Gallicus', 'Fortified Village'],
                    quarry: ['Iron Mine', 'Salt Works', 'Quarry'],
                    holy_site: ['Sacred Grove', 'Druid Circle', 'Spring Sanctuary', 'Votive Pool'],
                    palace: ["Chieftain's Hall", 'Tribal Oppidum', 'Royal Compound'],
                },
                courtRoles: {
                    palace: ['Tribal King', 'Druid', 'Champion', 'Bard', 'Smith', 'Noble Warrior']
                },
                mapAreaOverrides: {
                    "Loire Valley": {
                        dominantPower: 'Carnute Confederation',
                        dominantPowerDescription: 'A powerful Celtic tribe controlling the sacred center of Gaul, where druids gather annually for great assemblies.',
                        allegianceGroups: [
                            { name: 'Carnutes', type: 'primary', description: 'Keepers of the sacred forest.' },
                            { name: 'Aedui Alliance', type: 'secondary', description: 'Friendly neighboring tribes.' },
                            { name: 'Arverni', type: 'secondary', description: 'Rival power to the south.' }
                        ]
                    }
                }
            },
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Roman Gaul',
                dominantPowerDescription: 'Gaul is a prosperous province of the Roman Empire, integrated through a network of roads and cities, but with a lingering Celtic identity.',
                eraContextSentence: "an age of Romanization, where Gallic traditions merge with the structure and culture of the Empire.",
                allegianceGroups: [
                    { name: 'Roman Empire', type: 'primary', description: 'The governing imperial power.' },
                    { name: 'Germanic Tribes', type: 'rising', description: 'Tribes raiding across the Rhine frontier.' },
                    { name: 'Local Gallic Nobility', type: 'secondary', description: 'Gallic elites integrated into the Roman system.' }
                ],
                structureNames: {
                    fortress: ['Oppidum', 'Roman Camp', 'Walled Town', 'Hillfort'],
                    mill: ['Roman Watermill', 'Grain Mill'],
                    holy_site: ['Gallo-Roman Temple', 'Druidic Grove', 'Sacred Spring', 'Mercury Shrine'],
                    palace: ['Roman Villa', 'Praetorium', 'Gallic Noble Estate']
                },
                mapAreaOverrides: {
                    "Paris Basin": {
                        dominantPower: 'Lutetia Parisiorum',
                        dominantPowerDescription: 'A thriving Gallo-Roman city on an island in the Seine, growing wealthy from river trade.',
                        allegianceGroups: [
                            { name: 'Roman Administration', type: 'primary', description: 'Imperial governors and tax collectors.' },
                            { name: 'Parisii Tribe', type: 'secondary', description: 'The original Celtic inhabitants, now Romanized.' },
                            { name: 'Rhine Merchants', type: 'trade_company', description: 'Traders connecting Gaul to Germania.' }
                        ]
                    },
                    "Marseille Coast": {
                        dominantPower: 'Massalia',
                        dominantPowerDescription: 'Ancient Greek colony turned Roman ally, the gateway for Mediterranean culture into Gaul.',
                        allegianceGroups: [
                            { name: 'Roman Navy', type: 'primary', description: 'Fleet protecting Mediterranean trade.' },
                            { name: 'Greek Merchants', type: 'trade_company', description: 'Descendants of the original colonists.' },
                            { name: 'Ligurian Tribes', type: 'secondary', description: 'Native peoples of the coastal hills.' }
                        ]
                    }
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Kingdom of France',
                dominantPowerDescription: 'The Capetian dynasty slowly builds royal power from its base around Paris, competing with powerful vassals who often hold more land than the king.',
                eraContextSentence: 'a time of chivalry and cathedral-building, as French kings slowly expand their domain.',
                allegianceGroups: [
                    { name: 'Kingdom of France', type: 'primary', description: 'The centralizing French monarchy.' },
                    { name: 'Duchy of Normandy', type: 'secondary', description: 'A powerful vassal state, often aligned with England.' },
                    { name: 'Duchy of Burgundy', type: 'secondary', description: 'A powerful and often rebellious vassal.' },
                    { name: 'County of Toulouse', type: 'secondary', description: 'A culturally distinct southern domain.' }
                ],
                structureNames: {
                    fortress: ['Château Fort', 'Motte-and-bailey', 'Donjon', 'Barbican', 'City Walls'],
                    mill: ['Water Mill', 'Windmill', 'Tidal Mill'],
                    holy_site: ['Gothic Cathedral', 'Benedictine Abbey', 'Cluniac Priory', 'Templar Commandery', 'Pilgrimage Church'],
                    palace: ['Royal Château', "Count's Court", 'Episcopal Palace'],
                },
                courtRoles: {
                    palace: ['Seneschal', 'Constable of France', 'Chancellor', 'Grand Master', 'Chamberlain', 'Marshal'],
                    holy_site: ['Archbishop', 'Abbot', 'Canon', 'Templar Knight', 'Monk-Scribe']
                },
                mapAreaOverrides: {
                    "Normandy": {
                        dominantPower: 'Duchy of Normandy',
                        dominantPowerDescription: 'Powerful duchy whose duke also wears the English crown, creating a cross-Channel empire.',
                        allegianceGroups: [
                            { name: 'Anglo-Norman Realm', type: 'primary', description: 'The dual monarchy of England and Normandy.' },
                            { name: 'Kingdom of France', type: 'secondary', description: 'The nominal overlord with limited power.' },
                            { name: 'Breton Lords', type: 'secondary', description: 'Western neighbors often in conflict.' }
                        ]
                    },
                    "Languedoc": {
                        dominantPower: 'County of Toulouse',
                        dominantPowerDescription: 'A sophisticated southern culture where troubadours flourish and Cathar heresy takes root.',
                        allegianceGroups: [
                            { name: 'Count of Toulouse', type: 'primary', description: 'Ruler of the wealthy Occitan lands.' },
                            { name: 'Cathar Believers', type: 'religious', description: 'Dualist Christians deemed heretical by Rome.' },
                            { name: 'Kingdom of Aragon', type: 'secondary', description: 'Trans-Pyrenean influence and ally.' }
                        ]
                    },
                    "Pyrenees Foothills": {
                        dominantPower: 'Kingdom of Navarre',
                        dominantPowerDescription: 'A small Basque kingdom straddling the Pyrenees, navigating powerful neighbors France and Aragon.',
                        allegianceGroups: [
                            { name: 'Kings of Navarre', type: 'primary', description: 'The ruling house of the strategic mountain passes.' },
                            { name: 'Basque Clans', type: 'secondary', description: 'The ancient inhabitants of the region, guarding their fueros (liberties).' },
                            { name: 'Pilgrims of Santiago', type: 'religious', description: 'Travelers crossing the passes on their way to Santiago de Compostela.' }
                        ]
                    }
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Kingdom of France',
                dominantPowerDescription: 'Under powerful monarchs like Louis XIV, the absolute monarchy of France becomes the cultural and military hegemon of Europe.',
                eraContextSentence: 'an age of absolutism and artistic grandeur, where the court of the Sun King dazzles Europe.',
                allegianceGroups: [
                    { name: 'Kingdom of France', type: 'primary', description: 'The absolute monarchy centered at Versailles.' },
                    { name: 'Huguenots', type: 'rebel', description: 'French Protestants seeking religious freedom.' },
                    { name: 'Holy Roman Empire', type: 'secondary', description: 'A major rival to the east.' },
                    { name: 'Spanish Empire', type: 'secondary', description: 'A Catholic rival to the south.' }
                ],
                structureNames: {
                    fortress: ['Bastion Fort', 'Citadel', 'Star Fort', 'Vauban Fortress', 'Arsenal'],
                    mill: ['Windmill', 'Water Mill', 'Powder Mill'],
                    holy_site: ['Baroque Church', 'Seminary', 'Convent', 'Jesuit College', 'Huguenot Temple'],
                    palace: ['Château', 'Hôtel Particulier', 'Palais Royal', 'Intendant Residence'],
                    trading_post: ['Canal Port', 'Market Hall', 'Silk Exchange', 'Company Warehouse']
                },
                courtRoles: {
                    palace: ['Intendant', 'Musketeer Captain', 'Cardinal', 'Comptroller-General', 'Master of Ceremonies', 'Royal Mistress']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'French Republic/Empire',
                dominantPowerDescription: 'Revolutionary France upends Europe with radical ideas and Napoleonic conquest, before settling into industrial development.',
                eraContextSentence: 'an era of revolution and reaction, as France swings between republic, empire, and monarchy.',
                allegianceGroups: [
                    { name: 'French State', type: 'primary', description: 'The government, whether republic, empire, or monarchy.' },
                    { name: 'British Empire', type: 'secondary', description: 'The primary naval and economic rival.' },
                    { name: 'German States', type: 'secondary', description: 'Rising powers on the eastern frontier.' },
                    { name: 'Communards', type: 'rebel', description: 'Revolutionary socialists in Paris.' }
                ],
                structureNames: {
                    fortress: ['Star Fort', 'Barracks', 'Arsenal', 'Coastal Battery'],
                    mill: ['Industrial Mill', 'Textile Factory', 'Sugar Refinery'],
                    factory: ['Steelworks', 'Armory', 'Chemical Plant', 'Locomotive Works'],
                    mining_colony: ['Coal Mine', 'Iron Mine'],
                    trading_post: ['Railway Station', 'Canal Basin', 'Bourse', 'Department Store']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'French Republic',
                dominantPowerDescription: 'Modern France emerges as a leading European power, balancing republican ideals with global influence.',
                eraContextSentence: 'an era of republican resilience, where France reclaims its place as a major European power.',
                allegianceGroups: [
                    { name: 'French Republic', type: 'primary', description: 'The democratic government.' },
                    { name: 'NATO Alliance', type: 'secondary', description: 'Military alliance (France withdraws 1966-2009).' },
                    { name: 'European Community', type: 'secondary', description: 'The emerging European project.' },
                    { name: 'Colonial Independence Movements', type: 'rebel', description: 'Groups seeking freedom from French rule.' }
                ],
                structureNames: {
                    fortress: ['Military Installation', 'Air Base', 'Naval Port', 'Maginot Line Bunker'],
                    factory: ['Automotive Plant', 'Aerospace Factory', 'Nuclear Plant', 'Wine Cooperative'],
                    trading_post: ['International Airport', 'TGV Station', 'Container Terminal', 'Hypermarché'],
                    mining_colony: ['Nuclear Power Plant', 'Research Institute'],
                },
                courtRoles: {
                    palace: ['Presidential Advisor', 'Prefect', 'Ambassador', 'Cabinet Minister']
                }
            },
            "1940s": {
                dominantPower: 'Divided France',
                dominantPowerDescription: 'France falls to Nazi invasion, splits between Vichy collaboration and Free French resistance, then rebuilds as the Fourth Republic.',
                eraContextSentence: 'the dark years of occupation and resistance, followed by liberation and renewal.',
                allegianceGroups: [
                    { name: 'Free France/Provisional Government', type: 'primary', description: 'De Gaulle\'s government representing French legitimacy.' },
                    { name: 'French Resistance', type: 'rebel', description: 'Underground networks fighting occupation.' },
                    { name: 'Allied Powers', type: 'secondary', description: 'The liberating armies.' }
                ],
                mapAreaOverrides: {
                    "Paris Basin": {
                        dominantPower: 'German Occupation/Liberation',
                        dominantPowerDescription: 'Paris endures four years of Nazi occupation before its dramatic liberation in August 1944.',
                        allegianceGroups: [
                            { name: 'German Wehrmacht', type: 'primary', description: 'Occupying forces (1940-1944).' },
                            { name: 'French Resistance', type: 'rebel', description: 'FFI fighters preparing for liberation.' },
                            { name: 'Vichy Authorities', type: 'secondary', description: 'Collaborationist administration.' }
                        ]
                    }
                }
            },
            "1960s": {
                dominantPower: 'Fifth Republic',
                dominantPowerDescription: 'Under Charles de Gaulle, France pursues independent "grandeur" - nuclear weapons, withdrawal from NATO command, and managing decolonization.',
                eraContextSentence: 'the Gaullist era, where France asserts independence while students and workers challenge the old order.',
                allegianceGroups: [
                    { name: 'Gaullist Government', type: 'primary', description: 'The strong presidential system.' },
                    { name: 'Student Movement', type: 'rebel', description: 'May 1968 protesters demanding change.' },
                    { name: 'OAS', type: 'rebel', description: 'Far-right terrorists opposing Algerian independence.' }
                ]
            }
        },
        "Iberian Peninsula": {
            [HistoricalEra.PREHISTORY]: {
                dominantPower: 'Tartessian Culture',
                dominantPowerDescription: 'A sophisticated Bronze Age civilization centered in the southwest, known for metalworking and trade with Phoenician merchants.',
                eraContextSentence: 'an age of bronze and megaliths, where warrior-chiefs control rich mines and Phoenician traders bring exotic goods from the east.',
                allegianceGroups: [
                    { name: 'Tartessian Kings', type: 'primary', description: 'Wealthy rulers of the southwestern kingdoms.' },
                    { name: 'Iberian Tribes', type: 'secondary', description: 'Eastern coastal peoples with fortified towns.' },
                    { name: 'Celtic Invaders', type: 'secondary', description: 'Newcomers from beyond the Pyrenees.' }
                ],
                structureNames: {
                    fortress: ['Castro', 'Oppida', 'Fortified Village', 'Cliff Settlement'],
                    quarry: ['Copper Mine', 'Tin Workings', 'Silver Pit'],
                    holy_site: ['Dolmen', 'Rock Sanctuary', 'Sacred Cave', 'Bull Shrine'],
                    palace: ["King's Castro", 'Tribal Center', 'Fortified Acropolis'],
                },
                courtRoles: {
                    palace: ['Tribal King', 'War Chief', 'Metal Master', 'Oracle', 'Merchant Prince']
                }
            },
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Roman Hispania',
                dominantPowerDescription: 'The Iberian provinces become thoroughly Romanized, producing emperors, scholars, and serving as a vital source of metals and agricultural wealth.',
                eraContextSentence: 'an age of Roman prosperity, where Iberian cities rival those of Italy itself.',
                allegianceGroups: [
                    { name: 'Roman Empire', type: 'primary', description: 'The governing imperial power.' },
                    { name: 'Lusitanian Tribes', type: 'rebel', description: 'Resistant peoples in the west.' },
                    { name: 'Celtiberian Peoples', type: 'secondary', description: 'Tribal groups in the interior.' }
                ],
                structureNames: {
                    fortress: ['Castrum', 'Walled City', 'Coastal Watchtower'],
                    mill: ['Roman Mill', 'Olive Press'],
                    mining_colony: ['Silver Mine', 'Gold Mine', 'Copper Mine'],
                    holy_site: ['Temple of Diana', 'Mithraeum', 'Celtic Shrine'],
                    palace: ['Roman Villa', 'Forum Complex', 'Governor\'s Palace']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Caliphate of Córdoba / Taifa Kingdoms',
                dominantPowerDescription: 'The peninsula is dominated by the sophisticated Umayyad Caliphate of Córdoba, which later shatters into competing Taifa kingdoms, creating opportunities for the expansion of northern Christian realms.',
                eraContextSentence: 'an era of three faiths, where Christian, Muslim, and Jewish communities create a unique Iberian culture on a volatile frontier.',
                allegianceGroups: [
                    { name: 'Umayyad Caliphate of Córdoba', type: 'primary', description: 'The sophisticated Islamic state in the south.' },
                    { name: 'Kingdom of León', type: 'secondary', description: 'A major Christian kingdom in the north.' },
                    { name: 'Kingdom of Castile', type: 'secondary', description: 'An expanding Christian power.' },
                    { name: 'Taifa Kingdoms', type: 'secondary', description: 'Independent Muslim city-states (post-Caliphate).' }
                ],
                structureNames: {
                    fortress: ['Alcázar', 'Alcazaba', 'Castle', 'Atalaya'],
                    mill: ['Water Mill', 'Noria', 'Windmill'],
                    holy_site: ['Great Mosque', 'Cathedral', 'Synagogue', 'Monastery', 'Mozarabic Church'],
                    palace: ["Caliph's Palace", "King's Alcázar", 'Taifa Palace'],
                    trading_post: ['Souk', 'Jewish Quarter', 'Christian Market', 'Silk Exchange']
                },
                courtRoles: {
                    palace: ['Vizier', 'Hajib', 'Mayordomo', 'Alcaide', 'Royal Chronicler'],
                    holy_site: ['Imam', 'Bishop', 'Rabbi', 'Qadi', 'Prior']
                },
                mapAreaOverrides: {
                    "Andalusian Plain": {
                        dominantPower: 'Caliphate of Córdoba',
                        dominantPowerDescription: 'The jewel of Islamic Europe, where the Caliph rules from a palace city that rivals Baghdad and Constantinople.',
                        allegianceGroups: [
                            { name: 'Umayyad Caliphate', type: 'primary', description: 'The ruling dynasty claiming descent from Damascus.' },
                            { name: 'Berber Governors', type: 'secondary', description: 'North African elites in military service.' },
                            { name: 'Mozarabic Christians', type: 'religious', description: 'Arabic-speaking Christians under Muslim rule.' }
                        ]
                    },
                    "Toledo Plateau": {
                        dominantPower: 'Taifa of Toledo',
                        dominantPowerDescription: 'A cultured frontier kingdom where the three faiths collaborate in translating ancient wisdom for medieval Europe.',
                        allegianceGroups: [
                            { name: 'King of Toledo', type: 'primary', description: 'Muslim ruler of the strategic city.' },
                            { name: 'Jewish Scholars', type: 'religious', description: 'Translators and administrators.' },
                            { name: 'Castilian Tribute-Takers', type: 'secondary', description: 'Christian kingdom extracting payment.' }
                        ]
                    },
                    "Lisbon Coast": {
                        dominantPower: 'County of Portugal',
                        dominantPowerDescription: 'A new crusader state carved from Muslim lands, looking to the Atlantic for its future.',
                        allegianceGroups: [
                            { name: 'Count of Portugal', type: 'primary', description: 'Burgundian noble establishing a new realm.' },
                            { name: 'Templar Knights', type: 'religious', description: 'Military order securing the frontier.' },
                            { name: 'Moorish Population', type: 'secondary', description: 'Muslim inhabitants under Christian rule.' }
                        ]
                    },
                    "Ebro Valley": {
                        dominantPower: 'Crown of Aragon',
                        dominantPowerDescription: 'The Kingdom of Aragon expands south from the Pyrenees, reconquering the rich Ebro valley from the Taifa of Zaragoza.',
                        allegianceGroups: [
                            { name: 'King of Aragon', type: 'primary', description: 'The Christian monarch leading the Reconquista.' },
                            { name: 'Taifa of Zaragoza', type: 'secondary', description: 'The Muslim state holding the middle Ebro.' },
                            { name: 'Military Orders', type: 'religious', description: 'Knights Templar and Hospitaller securing the new frontier.' }
                        ]
                    },
                    "Galicia": {
                        dominantPower: 'Pilgrimage Center of Santiago',
                        dominantPowerDescription: 'The reputed burial site of St. James transforms Galicia into the destination of the most important pilgrimage in Christendom.',
                        allegianceGroups: [
                            { name: 'Archbishop of Santiago de Compostela', type: 'primary', description: 'The powerful spiritual and temporal ruler of the city.' },
                            { name: 'Kingdom of León-Castile', type: 'secondary', description: 'The secular power protecting the pilgrimage routes.' },
                            { name: 'Cluniac Monks', type: 'religious', description: 'French order that promoted and organized the pilgrimage.' }
                        ]
                    }
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Spanish Empire',
                dominantPowerDescription: 'The Catholic Monarchs unite Spain and launch the age of exploration, creating the first global empire on which the sun never sets.',
                eraContextSentence: 'the golden age of Spanish power, when silver from the New World funds European ambitions.',
                allegianceGroups: [
                    { name: 'Spanish Empire', type: 'primary', description: 'The global empire under the Habsburgs.' },
                    { name: 'Portuguese Empire', type: 'secondary', description: 'Iberian rival in global exploration.' },
                    { name: 'Moriscos', type: 'rebel', description: 'Forcibly converted Muslims facing persecution.' },
                    { name: 'Dutch Rebels', type: 'rebel', description: 'Protestant subjects in the Low Countries.' }
                ],
                structureNames: {
                    fortress: ['Star Fort', 'Presidio', 'Coastal Tower', 'Citadel'],
                    mill: ['Windmill', 'Tidal Mill', 'Sugar Mill', 'Olive Press'],
                    holy_site: ['Cathedral', 'Monastery', 'Convent', 'Inquisition Tribunal', 'Hermitage'],
                    palace: ["Royal Alcázar", "Viceroy's Palace", 'Escorial', 'Noble Palace'],
                    trading_post: ['Casa de Contratación', 'Port Warehouse', 'Lonja', 'Indies House']
                },
                courtRoles: {
                    palace: ['Grandee', 'Royal Secretary', 'Viceroy', 'Corregidor', 'Master of the Horse'],
                    holy_site: ['Archbishop', 'Inquisitor General', 'Confessor', 'Missionary']
                },
                mapAreaOverrides: {
                    "Lisbon Coast": {
                        dominantPower: 'Portuguese Empire',
                        dominantPowerDescription: 'Portugal maintains independence, building a global trading empire from Brazil to Macau while resisting Spanish absorption.',
                        allegianceGroups: [
                            { name: 'Kingdom of Portugal', type: 'primary', description: 'The House of Aviz pursuing oceanic empire.' },
                            { name: 'Trading Companies', type: 'trade_company', description: 'Merchants financing exploration.' },
                            { name: 'Spanish Monarchy', type: 'secondary', description: 'The threatening neighbor seeking union.' }
                        ]
                    },
                    "Catalonian Hills": {
                        dominantPower: 'Crown of Aragon under Spain',
                        dominantPowerDescription: 'Catalonia retains its laws and language under Spanish rule but faces growing centralization pressure from Madrid.',
                        allegianceGroups: [
                            { name: 'Spanish Crown', type: 'primary', description: 'The Habsburg monarchy in Madrid.' },
                            { name: 'Catalan Corts', type: 'secondary', description: 'Local parliament defending privileges.' },
                            { name: 'French Agents', type: 'secondary', description: 'Stirring trouble on the frontier.' }
                        ]
                    },
                    "Strait of Gibraltar": {
                        dominantPower: 'Key to the Mediterranean',
                        dominantPowerDescription: 'A vital chokepoint contested by Spain, Portugal, and Barbary corsairs, controlling all trade between the Atlantic and Mediterranean.',
                        allegianceGroups: [
                            { name: 'Spanish Garrison at Gibraltar', type: 'primary', description: 'The Catholic Monarchs\' fortress controlling the strait.' },
                            { name: 'Barbary Corsairs', type: 'rebel', description: 'North African pirates raiding shipping from fortified harbors.' },
                            { name: 'Portuguese Ceuta', type: 'secondary', description: 'A Portuguese stronghold on the African side.' }
                        ]
                    }
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Declining Spanish Monarchy',
                dominantPowerDescription: 'Spain loses most of its empire to independence movements while struggling with internal conflicts between liberals and traditionalists.',
                eraContextSentence: 'an era of imperial sunset and civil strife, as Spain grapples with modernity.',
                allegianceGroups: [
                    { name: 'Spanish Monarchy', type: 'primary', description: 'The Bourbon restoration.' },
                    { name: 'Carlists', type: 'rebel', description: 'Traditionalist pretenders to the throne.' },
                    { name: 'Republicans', type: 'rebel', description: 'Liberals seeking to end monarchy.' },
                    { name: 'Cuban Rebels', type: 'rebel', description: 'Independence fighters in the last colonies.' }
                ],
                structureNames: {
                    fortress: ['Military Barracks', 'Coastal Fort', 'Civil Guard Post'],
                    mill: ['Steam Mill', 'Flour Mill'],
                    factory: ['Textile Factory', 'Iron Foundry', 'Railway Workshop', 'Cork Factory'],
                    mining_colony: ['Coal Mine', 'Mercury Mine', 'Lead Mine'],
                    trading_post: ['Railway Depot', 'Port Authority', 'Customs House']
                },
                mapAreaOverrides: {
                    "Catalonian Hills": {
                        dominantPower: 'Industrial Catalonia',
                        dominantPowerDescription: 'Barcelona becomes Spain\'s industrial powerhouse, fostering both wealth and Catalan nationalist sentiment.',
                        allegianceGroups: [
                            { name: 'Spanish State', type: 'primary', description: 'The central government in Madrid.' },
                            { name: 'Catalan Industrialists', type: 'trade_company', description: 'Factory owners driving modernization.' },
                            { name: 'Anarchist Workers', type: 'rebel', description: 'Revolutionary syndicalists.' }
                        ]
                    }
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Spanish State',
                dominantPowerDescription: 'Spain experiences civil war, dictatorship, and democratic transition while Portugal undergoes its own revolution and decolonization.',
                eraContextSentence: 'a century of ideology and transformation, from civil war to European democracy.',
                allegianceGroups: [
                    { name: 'Spanish Government', type: 'primary', description: 'From republic to dictatorship to democracy.' },
                    { name: 'Portuguese State', type: 'secondary', description: 'Neighboring regime with parallel evolution.' },
                    { name: 'Separatist Movements', type: 'rebel', description: 'Basque and Catalan independence groups.' },
                    { name: 'European Community', type: 'secondary', description: 'The democratic club both nations join.' }
                ],
                structureNames: {
                    fortress: ['Military Academy', 'Air Base', 'Naval Base', 'Civil Guard Barracks'],
                    factory: ['SEAT Plant', 'Shipyard', 'Olive Oil Cooperative', 'Wine Bodega'],
                    trading_post: ['International Airport', 'AVE Station', 'Container Port', 'Tourist Resort'],
                    mining_colony: ['Solar Farm', 'Wind Farm', 'Tech Park']
                }
            },
            "1930s": {
                dominantPower: 'Spanish Republic and Civil War',
                dominantPowerDescription: 'The Second Republic\'s reforms trigger a military uprising, plunging Spain into a devastating civil war that becomes a prelude to World War II.',
                eraContextSentence: 'the Spanish tragedy, where democracy dies in a brutal civil war that divides families and invites foreign intervention.',
                allegianceGroups: [
                    { name: 'Spanish Republic', type: 'primary', description: 'The elected government defending democracy.' },
                    { name: 'Nationalist Rebels', type: 'rebel', description: 'Franco\'s military uprising backed by fascist powers.' },
                    { name: 'International Brigades', type: 'secondary', description: 'Foreign volunteers defending the Republic.' },
                    { name: 'Anarchist Collectives', type: 'rebel', description: 'Revolutionary workers in Catalonia and Aragon.' }
                ],
                mapAreaOverrides: {
                    "Catalonian Hills": {
                        dominantPower: 'Revolutionary Catalonia',
                        dominantPowerDescription: 'Barcelona becomes the heart of an anarchist revolution, with workers\' collectives running factories and farms.',
                        allegianceGroups: [
                            { name: 'CNT-FAI', type: 'primary', description: 'Anarcho-syndicalist unions controlling the economy.' },
                            { name: 'POUM', type: 'secondary', description: 'Anti-Stalinist Marxists.' },
                            { name: 'Republican Government', type: 'secondary', description: 'Trying to restore central authority.' }
                        ]
                    }
                }
            },
            "1970s": {
                dominantPower: 'Late Francoism and Transition',
                dominantPowerDescription: 'Franco\'s dictatorship weakens as Spain modernizes, leading to a carefully managed transition to democracy after his death.',
                eraContextSentence: 'the Spanish miracle, where dictatorship gives way to democracy without another civil war.',
                allegianceGroups: [
                    { name: 'Francoist State', type: 'primary', description: 'The aging dictatorship losing its grip.' },
                    { name: 'Democratic Opposition', type: 'rebel', description: 'Parties preparing for legal politics.' },
                    { name: 'ETA', type: 'rebel', description: 'Basque separatists at their most violent.' }
                ],
                mapAreaOverrides: {
                    "Lisbon Coast": {
                        dominantPower: 'Portuguese Revolution',
                        dominantPowerDescription: 'The Carnation Revolution overthrows Europe\'s oldest dictatorship as war-weary officers refuse to fight colonial wars.',
                        allegianceGroups: [
                            { name: 'Armed Forces Movement', type: 'primary', description: 'Progressive officers ending dictatorship.' },
                            { name: 'Communist Party', type: 'secondary', description: 'Organizing workers and peasants.' },
                            { name: 'Socialist Party', type: 'rising', description: 'Moderate left seeking European integration.' }
                        ]
                    }
                }
            }
        },
        "Italy": {
            [HistoricalEra.PREHISTORY]: {
                dominantPower: 'Etruscan Confederation',
                dominantPowerDescription: 'Sophisticated city-states in central Italy, masters of metalwork, engineering, and divination, whose culture would profoundly influence Rome.',
                eraContextSentence: 'an age of Etruscan princes and Greek colonies, where augurs read the flight of birds and warriors fight with bronze arms.',
                allegianceGroups: [
                    { name: 'Etruscan League', type: 'primary', description: 'The twelve cities of Etruria.' },
                    { name: 'Latin Tribes', type: 'secondary', description: 'Farming peoples of Latium.' },
                    { name: 'Greek Colonies', type: 'secondary', description: 'Magna Graecia in the south.' }
                ],
                structureNames: {
                    fortress: ['Etruscan Walls', 'Acropolis', 'Hill Town', 'Fortified Port'],
                    quarry: ['Bronze Workshop', 'Iron Mine', 'Marble Quarry'],
                    holy_site: ['Etruscan Temple', 'Augural Platform', 'Necropolis', 'Sacred Spring'],
                    palace: ['Lucumo Palace', 'Aristocratic Villa', 'Princely Tomb'],
                },
                courtRoles: {
                    palace: ['Lucumo', 'Augur', 'Haruspex', 'Bronze Master', 'Aristocrat', 'Scribe']
                }
            },
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Roman Empire',
                dominantPowerDescription: 'The heart of the greatest empire the world has ever known, where all roads lead to Rome and the legacy of the Caesars shapes civilization.',
                eraContextSentence: 'the height of imperial glory, when Rome rules from Britain to Mesopotamia.',
                allegianceGroups: [
                    { name: 'Roman Empire', type: 'primary', description: 'The eternal city and its dominions.' },
                    { name: 'Germanic Foederati', type: 'rebel', description: 'Barbarian troops serving Rome.' },
                    { name: 'Eastern Provinces', type: 'secondary', description: 'The wealthy Greek-speaking half.' }
                ],
                structureNames: {
                    fortress: ['Castra', 'Praetorian Camp', 'City Walls', 'Frontier Fort'],
                    mill: ['Roman Mill', 'Aqueduct Mill', 'Bakery Complex'],
                    holy_site: ['Pantheon', 'Temple of Jupiter', 'Catacombs', 'Vestal Temple', 'Imperial Cult Shrine'],
                    palace: ["Emperor's Palace", "Senator's Domus", 'Imperial Villa', 'Proconsul Residence']
                },
                courtRoles: {
                    palace: ['Consul', 'Praetorian Prefect', 'Master of Offices', 'Quaestor', 'Imperial Secretary'],
                    holy_site: ['Pontifex Maximus', 'Vestal Virgin', 'Augur', 'Flamen', 'Christian Bishop']
                },
                mapAreaOverrides: {
                    "Roman Campagna": {
                        dominantPower: 'The Eternal City',
                        dominantPowerDescription: 'Rome itself, caput mundi, where the Senate still meets and emperors build monuments to their glory.',
                        allegianceGroups: [
                            { name: 'Imperial Court', type: 'primary', description: 'The emperor and his household.' },
                            { name: 'Senatorial Class', type: 'secondary', description: 'Ancient families clinging to prestige.' },
                            { name: 'Praetorian Guard', type: 'rebel', description: 'Elite troops who make and unmake emperors.' }
                        ]
                    },
                    "Bay of Naples": {
                        dominantPower: 'Roman Pleasure Resort',
                        dominantPowerDescription: 'The playground of the Roman elite, where luxury villas dot the coast until Vesuvius brings sudden doom.',
                        allegianceGroups: [
                            { name: 'Imperial Family', type: 'primary', description: 'Caesars at leisure in coastal palaces.' },
                            { name: 'Greek Culturalists', type: 'secondary', description: 'Hellenic influence remains strong.' },
                            { name: 'Campanian Farmers', type: 'secondary', description: 'Locals serving the wealthy.' }
                        ]
                    }
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Fragmented Italy',
                dominantPowerDescription: 'Italy becomes a mosaic of competing powers - the Pope, the German Emperor, Byzantine holdouts, Norman adventurers, and rising city-states.',
                eraContextSentence: 'an age of municipal pride and endless warfare, where Italian cities grow rich and independent.',
                allegianceGroups: [
                    { name: 'Papal States', type: 'primary', description: 'The Pope\'s temporal domain.' },
                    { name: 'Holy Roman Empire', type: 'secondary', description: 'German emperors claiming Italy.' },
                    { name: 'Norman Sicily', type: 'secondary', description: 'A powerful kingdom in the south.' },
                    { name: 'Byzantine Empire', type: 'secondary', description: 'Greek authority in southern ports.' }
                ],
                structureNames: {
                    fortress: ['Castello', 'Byzantine Fortress', 'Ghibelline Tower'],
                    mill: ['Water Mill', 'Windmill', 'Olive Press'],
                    holy_site: ['Cathedral', 'Basilica', 'Monastery', 'Shrine', 'Baptistery'],
                    palace: ['Palazzo Comunale', 'Episcopal Palace', 'Signorial Palace'],
                    trading_post: ['Fondaco', 'Market Square', 'Port Quarter', 'Banking House']
                },
                courtRoles: {
                    palace: ['Podestà', 'Captain of the People', 'Gonfaloniere', 'Chancellor'],
                    holy_site: ['Cardinal', 'Archbishop', 'Abbot', 'Canon', 'Inquisitor']
                },
                mapAreaOverrides: {
                    "Venetian Lagoon": {
                        dominantPower: 'Most Serene Republic of Venice',
                        dominantPowerDescription: 'A maritime empire built on trade, Venice dominates the eastern Mediterranean from its impregnable lagoon.',
                        allegianceGroups: [
                            { name: 'Venetian Republic', type: 'primary', description: 'The merchant oligarchy.' },
                            { name: 'Dalmatian Colonies', type: 'secondary', description: 'Adriatic possessions.' },
                            { name: 'Genoan Rivals', type: 'secondary', description: 'Competing maritime republic.' }
                        ],
                        structureNames: {
                            fortress: ['Byzantine Fortress', 'Ghibelline Tower'],
                            palace: ['Doge\'s Palace', 'Patrician Palazzo', 'Procuratie'],
                            trading_post: ['Fondaco dei Tedeschi', 'Rialto Market']
                        }
                    },
                    "Florence Hills": {
                        dominantPower: 'Florentine Republic',
                        dominantPowerDescription: 'A republic of merchants and bankers, Florence is beginning its journey to become the cradle of the Renaissance.',
                        allegianceGroups: [
                            { name: 'Florentine Commune', type: 'primary', description: 'The guild-based government.' },
                            { name: 'Guelph Party', type: 'secondary', description: 'Pro-papal faction.' },
                            { name: 'Ghibelline Exiles', type: 'rebel', description: 'Pro-imperial faction in exile.' }
                        ]
                    },
                    "Bay of Naples": {
                        dominantPower: 'Kingdom of Sicily',
                        dominantPowerDescription: 'Norman knights rule a multicultural kingdom where Latin, Greek, and Arab traditions create a unique synthesis.',
                        allegianceGroups: [
                            { name: 'Norman Kings', type: 'primary', description: 'Descendants of northern adventurers.' },
                            { name: 'Arab Emirs', type: 'secondary', description: 'Muslim administrators and scholars.' },
                            { name: 'Greek Nobles', type: 'secondary', description: 'Byzantine aristocracy.' }
                        ]
                    },
                    "Apennine Foothills": {
                        dominantPower: 'Matilda of Tuscany',
                        dominantPowerDescription: 'A powerful Countess ruling vast territories from the Apennines, a key player in the Investiture Controversy between Pope and Emperor.',
                        allegianceGroups: [
                            { name: 'House of Canossa', type: 'primary', description: 'The dynasty of the powerful Countess Matilda.' },
                            { name: 'Papal Faction (Guelphs)', type: 'secondary', description: 'Allies supporting the authority of the Pope.' },
                            { name: 'Imperial Faction (Ghibellines)', type: 'rebel', description: 'Nobles loyal to the Holy Roman Emperor.' }
                        ]
                    }
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Italian City-States',
                dominantPowerDescription: 'The Renaissance blooms as wealthy city-states compete in art and war, while foreign powers see Italy as the prize of Europe.',
                eraContextSentence: 'the height of Renaissance glory, where Michelangelo and Machiavelli embody Italian genius.',
                allegianceGroups: [
                    { name: 'Various Italian States', type: 'primary', description: 'Competing powers from Venice to Naples.' },
                    { name: 'Papal States', type: 'religious', description: 'The Pope as temporal prince.' },
                    { name: 'Spanish Empire', type: 'secondary', description: 'Dominant foreign power in the south.' },
                    { name: 'French Kingdom', type: 'secondary', description: 'Invading force seeking Milan.' }
                ],
                structureNames: {
                    fortress: ['Byzantine Fortress', 'Citadel', 'Star Fort'],
                    mill: ['Water Mill', 'Silk Mill', 'Paper Mill'],
                    holy_site: ['Renaissance Church', 'Baroque Cathedral', 'Pilgrimage Shrine', 'Convent'],
                    palace: ['Palazzo', 'Villa', 'Ducal Residence', 'Cardinal\'s Palace'],
                    trading_post: ['Banco', 'Silk Market', 'Arte Guildhall', 'Foreign Quarter']
                },
                courtRoles: {
                    palace: ['Duke', 'Condottiere', 'Court Artist', 'Humanist Scholar', 'Ambassador'],
                    holy_site: ['Cardinal', 'Papal Legate', 'Cathedral Canon', 'Confessor']
                },
                mapAreaOverrides: {
                    "Florence Hills": {
                        dominantPower: 'Medici Florence',
                        dominantPowerDescription: 'Under Medici rule, Florence becomes the cultural capital of Europe, where banking wealth funds unprecedented artistic achievement.',
                        allegianceGroups: [
                            { name: 'Medici Dynasty', type: 'primary', description: 'Banking family turned princes.' },
                            { name: 'Republican Opposition', type: 'rebel', description: 'Those longing for the old republic.' },
                            { name: 'Papal Alliance', type: 'religious', description: 'Medici popes in Rome.' }
                        ],
                        structureNames: {
                            palace: ['Palazzo Medici', 'Uffizi', 'Palazzo Pitti'],
                            trading_post: ['Medici Bank', 'Arte della Lana', 'Mercato Nuovo']
                        }
                    },
                    "Venetian Lagoon": {
                        dominantPower: 'Venetian Empire at its Peak',
                        dominantPowerDescription: 'Venice controls a maritime empire from the Adriatic to Cyprus, though Ottoman expansion threatens its dominance.',
                        allegianceGroups: [
                            { name: 'Most Serene Republic', type: 'primary', description: 'The immortal maritime state.' },
                            { name: 'Ottoman Empire', type: 'secondary', description: 'The rising threat in the east.' },
                            { name: 'League of Cambrai', type: 'secondary', description: 'European powers jealous of Venice.' }
                        ]
                    },
                    "Roman Campagna": {
                        dominantPower: 'Papal Rome',
                        dominantPowerDescription: 'The Popes transform Rome into a Baroque showcase while ruling central Italy as Renaissance princes.',
                        allegianceGroups: [
                            { name: 'Papal States', type: 'primary', description: 'The Pope\'s temporal government.' },
                            { name: 'Roman Barons', type: 'secondary', description: 'Turbulent noble families.' },
                            { name: 'Spanish Faction', type: 'secondary', description: 'Foreign influence at the Vatican.' }
                        ]
                    }
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Kingdom of Italy',
                dominantPowerDescription: 'The Risorgimento unifies Italy under Savoy leadership, creating a new nation seeking its place among the great powers.',
                eraContextSentence: 'an era of national awakening, as Italians forge a unified state from ancient divisions.',
                allegianceGroups: [
                    { name: 'Kingdom of Italy', type: 'primary', description: 'The new constitutional monarchy.' },
                    { name: 'Austria-Hungary', type: 'secondary', description: 'The former ruler of the north.' },
                    { name: 'Papal Resistance', type: 'religious', description: 'The Pope refusing to recognize Italy.' },
                    { name: 'Southern Brigands', type: 'rebel', description: 'Bourbon loyalists and bandits.' }
                ],
                structureNames: {
                    fortress: ['Alpine Fort', 'Coastal Battery', 'Urban Barracks'],
                    mill: ['Silk Mill', 'Cotton Mill', 'Flour Mill'],
                    factory: ['Fiat Works', 'Shipyard', 'Arsenal', 'Railway Workshop'],
                    mining_colony: ['Marble Quarry', 'Sulfur Mine'],
                    trading_post: ['Port Facility', 'Stock Exchange']
                },
                mapAreaOverrides: {
                    "Po Valley": {
                        dominantPower: 'Industrial North',
                        dominantPowerDescription: 'Milan and Turin lead Italian industrialization, creating the economic power that drives unification.',
                        allegianceGroups: [
                            { name: 'House of Savoy', type: 'primary', description: 'The royal family from Piedmont.' },
                            { name: 'Industrial Bourgeoisie', type: 'trade_company', description: 'Factory owners and bankers.' },
                            { name: 'Socialist Workers', type: 'rising', description: 'The growing labor movement.' }
                        ]
                    },
                    "Bay of Naples": {
                        dominantPower: 'The Southern Question',
                        dominantPowerDescription: 'The Mezzogiorno lags behind the north, with poverty driving massive emigration to the Americas.',
                        allegianceGroups: [
                            { name: 'Italian State', type: 'primary', description: 'Often seen as northern colonizers.' },
                            { name: 'Local Notables', type: 'secondary', description: 'Landowners maintaining feudal ways.' },
                            { name: 'Camorra', type: 'rebel', description: 'Criminal organizations filling the power vacuum.' }
                        ]
                    }
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Italian Republic',
                dominantPowerDescription: 'From fascism through resistance to economic miracle, Italy becomes a founding member of the European project.',
                eraContextSentence: 'an age of extremes and renewal, where Italy transforms from fascist state to European democracy.',
                allegianceGroups: [
                    { name: 'Italian Republic', type: 'primary', description: 'The post-war democratic state.' },
                    { name: 'NATO Alliance', type: 'secondary', description: 'The Western military alliance.' },
                    { name: 'European Community', type: 'secondary', description: 'The emerging European union.' },
                    { name: 'Red Brigades', type: 'rebel', description: 'Far-left terrorists in the Years of Lead.' }
                ],
                structureNames: {
                    fortress: ['Carabinieri Station', 'NATO Base', 'Alpine Fortification'],
                    factory: ['Fiat Mirafiori', 'Olivetti Plant', 'Fashion House', 'Pirelli Works'],
                    trading_post: ['Autostrada', 'Container Port', 'Fashion District'],
                    mining_colony: ['ENI Refinery', 'Tech Park']
                }
            },
            "1920s": {
                dominantPower: 'Fascist Italy',
                dominantPowerDescription: 'Mussolini\'s Blackshirts march on Rome, establishing the first fascist state and providing a model for other dictators.',
                eraContextSentence: 'the birth of fascism, where Mussolini promises to restore Roman glory through totalitarian rule.',
                allegianceGroups: [
                    { name: 'National Fascist Party', type: 'primary', description: 'Mussolini\'s movement seizing power.' },
                    { name: 'Catholic Church', type: 'religious', description: 'Reaching accommodation with fascism.' },
                    { name: 'Socialist Opposition', type: 'rebel', description: 'Suppressed but not eliminated.' }
                ]
            },
            "1940s": {
                dominantPower: 'Italy at War',
                dominantPowerDescription: 'Mussolini\'s alliance with Hitler brings disaster, leading to invasion, resistance, and civil war before Allied victory.',
                eraContextSentence: 'from fascist hubris to partisan resistance, as Italy suffers the consequences of Mussolini\'s ambitions.',
                allegianceGroups: [
                    { name: 'Italian Social Republic', type: 'primary', description: 'Mussolini\'s Nazi puppet state (1943-45).' },
                    { name: 'Partisan Resistance', type: 'rebel', description: 'Communist and liberal fighters.' },
                    { name: 'Allied Armies', type: 'secondary', description: 'British and American liberators.' }
                ],
                mapAreaOverrides: {
                    "Roman Campagna": {
                        dominantPower: 'Open City',
                        dominantPowerDescription: 'Rome is declared an open city to avoid destruction, experiencing German occupation and partisan resistance.',
                        allegianceGroups: [
                            { name: 'German Occupation', type: 'primary', description: 'Wehrmacht controlling the eternal city.' },
                            { name: 'Vatican Neutrality', type: 'religious', description: 'The Pope providing sanctuary.' },
                            { name: 'Roman Resistance', type: 'rebel', description: 'Underground networks aiding Jews and Allied POWs.' }
                        ]
                    }
                }
            },
            "1970s": {
                dominantPower: 'Years of Lead',
                dominantPowerDescription: 'Political violence from both far-left and far-right terrorists rocks Italy while the economy struggles with oil shocks.',
                eraContextSentence: 'the leaden years, when terrorism and political instability threaten Italian democracy.',
                allegianceGroups: [
                    { name: 'Italian Government', type: 'primary', description: 'Unstable coalitions struggling to govern.' },
                    { name: 'Red Brigades', type: 'rebel', description: 'Marxist-Leninist terrorists kidnapping and killing.' },
                    { name: 'Neo-Fascist Terrorists', type: 'rebel', description: 'Right-wing bombers pursuing a "strategy of tension".' }
                ]
            }
        },
        "Germany": {
            [HistoricalEra.PREHISTORY]: {
                dominantPower: 'Urnfield Culture',
                dominantPowerDescription: 'Late Bronze Age peoples who cremated their dead and placed the ashes in urns, predecessors to the Celtic and Germanic tribes.',
                eraContextSentence: 'a time of bronze swords and sacred bogs, where warriors are buried with their weapons and amber flows along ancient trade routes.',
                allegianceGroups: [
                    { name: 'Urnfield Chieftains', type: 'primary', description: 'Bronze Age warrior elite.' },
                    { name: 'Nordic Traders', type: 'secondary', description: 'Amber merchants from the Baltic.' },
                    { name: 'Alpine Peoples', type: 'secondary', description: 'Mountain dwelling tribes.' }
                ],
                structureNames: {
                    fortress: ['Ring Fort', 'Hillfort', 'Palisade Wall', 'Lake Dwelling'],
                    quarry: ['Bronze Foundry', 'Bog Iron Works', 'Salt Mine'],
                    holy_site: ['Sacred Bog', 'Grove of the Gods', 'Burial Field', 'Solar Monument'],
                    palace: ['Chieftain Longhouse', 'Warrior Hall', 'Clan Center'],
                },
                courtRoles: {
                    palace: ['War Chief', 'Shaman', 'Bronzesmith', 'Clan Elder', 'Skald', 'Champion']
                }
            },
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Germanic Tribes',
                dominantPowerDescription: 'Beyond the Rhine frontier, Germanic tribes maintain their independence from Rome, developing a warrior culture that will eventually overwhelm the empire.',
                eraContextSentence: 'an age of tribal confederations, where Germanic peoples forge their identity in the forests beyond Rome\'s reach.',
                allegianceGroups: [
                    { name: 'Cherusci', type: 'primary', description: 'The confederation that destroyed three legions in Teutoburg Forest.' },
                    { name: 'Suebi', type: 'secondary', description: 'Powerful tribes along the upper Rhine.' },
                    { name: 'Roman Empire', type: 'secondary', description: 'The empire offering trade and war.' },
                    { name: 'Marcomanni', type: 'secondary', description: 'A kingdom in Bohemia.' }
                ],
                structureNames: {
                    fortress: ['Hill Fort', 'Tribal Stronghold', 'Sacred Grove Fort', 'River Fortress'],
                    mill: ['Hand Mill', 'Grinding Stone'],
                    holy_site: ['Sacred Grove', 'Thing Assembly', 'Wotan\'s Oak', 'Burial Mound'],
                    palace: ["Chieftain's Hall", "War Leader's Compound"]
                },
                courtRoles: {
                    palace: ['War Chief', 'Thing Speaker', 'Skald', 'Champion', 'Seeress']
                },
                mapAreaOverrides: {
                    "Black Forest": {
                        dominantPower: 'Suebi Tribes',
                        dominantPowerDescription: 'A dense, dark forest beyond the Rhine, home to fierce Suebian tribes who defy Roman conquest and maintain their ancient traditions.',
                        allegianceGroups: [
                            { name: 'Suebian Chieftains', type: 'primary', description: 'Leaders of the Germanic warrior bands.' },
                            { name: 'Roman Frontier Patrols', type: 'secondary', description: 'Legionaries attempting to control the Rhine frontier.' },
                            { name: 'Druidic Hermits', type: 'religious', description: 'Keepers of ancient Celtic and Germanic lore.' }
                        ]
                    }
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Holy Roman Empire',
                dominantPowerDescription: 'The medieval German empire claims Charlemagne\'s legacy, though its power depends on the personality of each emperor and the cooperation of the princes.',
                eraContextSentence: 'an era of imperial ambition, where German emperors dream of universal Christian monarchy.',
                allegianceGroups: [
                    { name: 'Holy Roman Emperor', type: 'primary', description: 'The elected sovereign of the Germans.' },
                    { name: 'Electoral Princes', type: 'secondary', description: 'The seven who choose the emperor.' },
                    { name: 'Duchy of Bavaria', type: 'secondary', description: 'Powerful southern duchy often rivaling the emperor.' },
                    { name: 'Hanseatic League', type: 'trade_company', description: 'Northern merchant cities with quasi-independence.' },
                    { name: 'Slavic Tribes', type: 'rebel', description: 'Pagan peoples resisting German expansion eastward.' }
                ],
                structureNames: {
                    fortress: ['Burg', 'Kaiserpfalz', 'Reichsburg', 'Ordensburg', 'Wasserburg'],
                    mill: ['Water Mill', 'Windmill', 'Monastic Mill'],
                    holy_site: ['Imperial Cathedral', 'Monastery', 'Pilgrimage Church', 'Teutonic Commandery'],
                    palace: ['Imperial Palace', "Duke's Residence", 'Archbishop\'s Palace', 'Burgrave\'s Seat'],
                    trading_post: ['Hanseatic Kontor', 'Market Square', 'Merchant Quarter', 'Fair Ground']
                },
                courtRoles: {
                    palace: ['Imperial Chancellor', 'Margrave', 'Burgrave', 'Hofmeister', 'Imperial Herald'],
                    holy_site: ['Archbishop-Elector', 'Abbot', 'Grand Master', 'Cathedral Dean']
                },
                mapAreaOverrides: {
                    "Rhine Valley": {
                        dominantPower: 'Rhenish Archbishoprics',
                        dominantPowerDescription: 'Powerful ecclesiastical princes control the Rhine, collecting tolls and electing emperors.',
                        allegianceGroups: [
                            { name: 'Archbishop of Cologne', type: 'primary', description: 'Wealthy prince-bishop and elector.' },
                            { name: 'Archbishop of Mainz', type: 'secondary', description: 'Archchancellor of Germany.' },
                            { name: 'Rhine Cities', type: 'trade_company', description: 'Urban communes seeking freedom.' }
                        ]
                    },
                    "Brandenburg Plain": {
                        dominantPower: 'Margraviate of Brandenburg',
                        dominantPowerDescription: 'A frontier march expanding into Slavic lands, laying foundations for future Prussian power.',
                        allegianceGroups: [
                            { name: 'Margrave of Brandenburg', type: 'primary', description: 'The frontier lord and elector.' },
                            { name: 'Teutonic Knights', type: 'religious', description: 'Crusading order conquering pagans.' },
                            { name: 'Wendish Tribes', type: 'rebel', description: 'Slavic peoples resisting Germanization.' }
                        ]
                    },
                    "Hamburg Coast": {
                        dominantPower: 'Hanseatic League',
                        dominantPowerDescription: 'Hamburg leads the merchant confederation that dominates Baltic and North Sea trade.',
                        allegianceGroups: [
                            { name: 'Hanseatic Council', type: 'primary', description: 'The merchant oligarchy.' },
                            { name: 'Danish Crown', type: 'secondary', description: 'Competing for Baltic dominance.' },
                            { name: 'Pirates', type: 'rebel', description: 'The Victual Brothers threatening trade.' }
                        ]
                    }
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Habsburg Holy Roman Empire',
                dominantPowerDescription: 'Under Habsburg rule, the empire faces religious division as the Reformation tears apart German unity.',
                eraContextSentence: 'an age of religious war, where Luther\'s protest divides Germany between Catholic and Protestant.',
                allegianceGroups: [
                    { name: 'Habsburg Emperor', type: 'primary', description: 'Catholic sovereign struggling to maintain unity.' },
                    { name: 'Protestant Princes', type: 'rebel', description: 'Lutheran rulers defying imperial authority.' },
                    { name: 'Catholic League', type: 'secondary', description: 'Princes loyal to Rome and emperor.' },
                    { name: 'France', type: 'secondary', description: 'Catholic power supporting Protestant rebels.' }
                ],
                structureNames: {
                    fortress: ['Festung', 'Star Fort', 'Schanze', 'Citadel', 'Baroque Fortress'],
                    mill: ['Paper Mill', 'Powder Mill', 'Fulling Mill', 'Sawmill'],
                    holy_site: ['Lutheran Church', 'Baroque Cathedral', 'Jesuit College', 'Reformed Church'],
                    palace: ['Schloss', 'Residenz', 'Fürstenhof', 'Baroque Palace'],
                    trading_post: ['Merchant House', 'Guild Hall', 'Leipzig Fair', 'Banking House']
                },
                courtRoles: {
                    palace: ['Hofmarschall', 'Kammerer', 'Court Composer', 'Leibarzt', 'Court Alchemist']
                },
                mapAreaOverrides: {
                    "Saxon Uplands": {
                        dominantPower: 'Electoral Saxony',
                        dominantPowerDescription: 'The heartland of the Lutheran Reformation, where Luther\'s protector rules and new ideas flourish.',
                        allegianceGroups: [
                            { name: 'Elector of Saxony', type: 'primary', description: 'Luther\'s protector and Protestant leader.' },
                            { name: 'Lutheran Churches', type: 'religious', description: 'The new reformed faith.' },
                            { name: 'Imperial Agents', type: 'secondary', description: 'Habsburg spies and officials.' }
                        ]
                    },
                    "Bavarian Highlands": {
                        dominantPower: 'Duchy of Bavaria',
                        dominantPowerDescription: 'The Catholic champion of southern Germany, Bavaria leads the Counter-Reformation with Jesuit fervor.',
                        allegianceGroups: [
                            { name: 'Duke of Bavaria', type: 'primary', description: 'Wittelsbach prince and Catholic champion.' },
                            { name: 'Jesuit Order', type: 'religious', description: 'Intellectual spearhead of Catholic renewal.' },
                            { name: 'Protestant Minorities', type: 'rebel', description: 'Crypto-Lutherans facing persecution.' }
                        ]
                    }
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'German Empire',
                dominantPowerDescription: 'Under Prussian leadership and Bismarck\'s guidance, Germany unifies into an industrial and military powerhouse challenging British hegemony.',
                eraContextSentence: 'an era of blood and iron, where German unification creates a new European colossus.',
                allegianceGroups: [
                    { name: 'German Empire', type: 'primary', description: 'The Prussian-dominated federal empire.' },
                    { name: 'Austria-Hungary', type: 'secondary', description: 'The excluded German power, now ally.' },
                    { name: 'France', type: 'secondary', description: 'The revanchist enemy seeking Alsace-Lorraine.' },
                    { name: 'Social Democrats', type: 'rebel', description: 'The growing workers\' movement.' }
                ],
                structureNames: {
                    fortress: ['Kaserne', 'Fortress Belt', 'Coastal Fort', 'Zitadelle'],
                    mill: ['Steel Mill', 'Rolling Mill', 'Textile Mill'],
                    factory: ['Krupp Works', 'Chemical Plant', 'Locomotive Works', 'Electrical Factory'],
                    mining_colony: ['Ruhr Coal Mine', 'Silesian Mine', 'Potash Mine'],
                    trading_post: ['Hauptbahnhof', 'Börse', 'Coal Exchange', 'Industrial Port']
                },
                courtRoles: {
                    palace: ['Reich Chancellor', 'Generalstabschef', 'Kultusminister', 'Geheimrat']
                },
                mapAreaOverrides: {
                    "Rhine Valley": {
                        dominantPower: 'Industrial Rhineland',
                        dominantPowerDescription: 'The Ruhr becomes Europe\'s industrial heartland, its coal and steel forging German power.',
                        allegianceGroups: [
                            { name: 'Prussian State', type: 'primary', description: 'Berlin\'s authority over the Rhine provinces.' },
                            { name: 'Industrial Magnates', type: 'trade_company', description: 'Coal and steel barons like Krupp and Thyssen.' },
                            { name: 'Catholic Center Party', type: 'secondary', description: 'Political voice of Rhenish Catholics.' }
                        ]
                    },
                    "Brandenburg Plain": {
                        dominantPower: 'Imperial Capital',
                        dominantPowerDescription: 'Berlin emerges as a world city, seat of the Kaiser and hub of German ambitions.',
                        allegianceGroups: [
                            { name: 'Kaiser Wilhelm II', type: 'primary', description: 'The impetuous emperor dreaming of world power.' },
                            { name: 'Prussian Junkers', type: 'secondary', description: 'The military-aristocratic elite.' },
                            { name: 'Berlin Workers', type: 'rebel', description: 'The radical proletariat of "Red Berlin".' }
                        ]
                    }
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Federal Republic of Germany',
                dominantPowerDescription: 'From the ashes of two world wars and division, Germany emerges as a democratic economic powerhouse at the heart of European integration.',
                eraContextSentence: 'an era of redemption and reunification, where Germany anchors European democracy.',
                allegianceGroups: [
                    { name: 'Federal Republic', type: 'primary', description: 'The democratic German state.' },
                    { name: 'European Union', type: 'secondary', description: 'The supranational project Germany helps lead.' },
                    { name: 'NATO', type: 'secondary', description: 'The Western military alliance.' },
                    { name: 'RAF', type: 'rebel', description: 'Red Army Faction terrorists (1970s-90s).' }
                ],
                structureNames: {
                    fortress: ['Bundeswehr Base', 'NATO Installation', 'Border Checkpoint', 'Flak Tower (ruins)'],
                    factory: ['Mercedes Plant', 'BMW Works', 'BASF Complex', 'Siemens Factory'],
                    trading_post: ['Frankfurt Airport', 'Hamburg Port', 'Autobahn Raststätte', 'Messe'],
                    mining_colony: ['Technology Park', 'Solar Farm', 'Wind Park']
                },
                courtRoles: {
                    palace: ['Bundeskanzler', 'Minister', 'Staatssekretär', 'Bundespräsident']
                }
            },
            "1920s": {
                dominantPower: 'Weimar Republic',
                dominantPowerDescription: 'Germany\'s first democracy struggles with hyperinflation, political violence, and the humiliation of Versailles.',
                eraContextSentence: 'the Weimar experiment, where democracy battles economic chaos and extremist violence.',
                allegianceGroups: [
                    { name: 'Weimar Coalition', type: 'primary', description: 'Social Democrats, Catholics, and liberals.' },
                    { name: 'Communists', type: 'rebel', description: 'KPD seeking Soviet-style revolution.' },
                    { name: 'Freikorps/Nazis', type: 'rising', description: 'Right-wing paramilitaries and Hitler\'s growing movement.' },
                    { name: 'Reparations Commission', type: 'secondary', description: 'Allied powers demanding payment.' }
                ]
            },
            "1930s": {
                dominantPower: 'Nazi Germany',
                dominantPowerDescription: 'Hitler\'s Third Reich transforms Germany into a totalitarian state bent on racial purity and territorial expansion.',
                eraContextSentence: 'the Nazi nightmare, where dictatorship prepares for war while persecuting Jews and dissidents.',
                allegianceGroups: [
                    { name: 'Nazi Party', type: 'primary', description: 'Hitler\'s totalitarian movement.' },
                    { name: 'Wehrmacht', type: 'secondary', description: 'The rearming military.' },
                    { name: 'Underground Resistance', type: 'rebel', description: 'Social Democrats, Communists, and Christians opposing the regime.' },
                    { name: 'SS', type: 'secondary', description: 'Himmler\'s racial state within a state.' }
                ]
            },
            "1940s": {
                dominantPower: 'Occupied Germany',
                dominantPowerDescription: 'Nazi Germany conquers then collapses, leaving a destroyed nation divided between Allied occupiers.',
                eraContextSentence: 'from total war to total defeat, as Germany pays the price for Hitler\'s madness.',
                allegianceGroups: [
                    { name: 'Allied Occupation', type: 'primary', description: 'Four powers dividing Germany.' },
                    { name: 'Soviet Zone', type: 'secondary', description: 'Communist transformation in the East.' },
                    { name: 'Western Allies', type: 'secondary', description: 'US, UK, France promoting democracy.' },
                    { name: 'Werewolf Resistance', type: 'rebel', description: 'Nazi diehards (quickly suppressed).' }
                ],
                mapAreaOverrides: {
                    "Brandenburg Plain": {
                        dominantPower: 'Soviet Berlin',
                        dominantPowerDescription: 'Berlin lies in ruins, divided between four powers but surrounded by the Soviet zone.',
                        allegianceGroups: [
                            { name: 'Soviet Military Administration', type: 'primary', description: 'Red Army controlling East Berlin.' },
                            { name: 'Western Allies', type: 'secondary', description: 'US, UK, French sectors forming West Berlin.' },
                            { name: 'German Communists', type: 'secondary', description: 'KPD/SED building new order.' }
                        ]
                    }
                }
            },
            "1960s": {
                dominantPower: 'Two Germanies',
                dominantPowerDescription: 'The Federal Republic enjoys economic miracle while the GDR builds socialism behind the Berlin Wall.',
                eraContextSentence: 'the divided nation, where prosperity in the West contrasts with regimentation in the East.',
                allegianceGroups: [
                    { name: 'Federal Republic', type: 'primary', description: 'Democratic West Germany in NATO.' },
                    { name: 'German Democratic Republic', type: 'secondary', description: 'Communist East Germany in Warsaw Pact.' },
                    { name: 'Student Movement', type: 'rebel', description: '1968 protesters challenging the establishment.' }
                ],
                mapAreaOverrides: {
                    "Brandenburg Plain": {
                        dominantPower: 'Divided Berlin',
                        dominantPowerDescription: 'The Berlin Wall divides the former capital, symbol of the Cold War\'s human cost.',
                        allegianceGroups: [
                            { name: 'East Berlin', type: 'primary', description: 'GDR showcase behind the Wall.' },
                            { name: 'West Berlin', type: 'secondary', description: 'Island of freedom in communist sea.' },
                            { name: 'Border Guards', type: 'secondary', description: 'Shoot-to-kill orders at the Wall.' }
                        ]
                    }
                }
            },
            "1990s": {
                dominantPower: 'Reunified Germany',
                dominantPowerDescription: 'The Wall falls and Germany reunites, facing the challenges of absorbing the bankrupt East while anchoring European unity.',
                eraContextSentence: 'the new beginning, where Germans celebrate unity while building a common future.',
                allegianceGroups: [
                    { name: 'Federal Republic', type: 'primary', description: 'The enlarged democratic state.' },
                    { name: 'European Union', type: 'secondary', description: 'The deepening European project.' },
                    { name: 'Former GDR', type: 'secondary', description: 'Eastern states undergoing painful transition.' },
                    { name: 'Neo-Nazis', type: 'rebel', description: 'Far-right exploiting eastern discontent.' }
                ]
            }
        },
        "Scandinavia": {
            [HistoricalEra.PREHISTORY]: {
                dominantPower: 'Nordic Bronze Age',
                dominantPowerDescription: 'Seafaring peoples of the north, creators of elaborate rock carvings and masters of bronze work, with connections stretching to the Mediterranean.',
                eraContextSentence: 'an age of sun worship and sea voyages, where bronze lurs sound across the fjords and ships are buried with kings.',
                allegianceGroups: [
                    { name: 'Sea Kings', type: 'primary', description: 'Maritime chieftains with longships.' },
                    { name: 'Forest Tribes', type: 'secondary', description: 'Inland hunting peoples.' },
                    { name: 'Amber Lords', type: 'secondary', description: 'Controllers of the amber trade.' }
                ],
                structureNames: {
                    fortress: ['Ring Fort', 'Coastal Fort', 'Mountain Stronghold', 'Ship Setting'],
                    quarry: ['Amber Beach', 'Bog Iron Pit', 'Flint Mine'],
                    holy_site: ['Rock Carving Site', 'Ship Burial', 'Sacred Grove', 'Sun Stone'],
                    palace: ['Jarl Hall', 'Sea King Lodge', 'Chieftain Farmstead'],
                },
                courtRoles: {
                    palace: ['Sea King', 'Skald', 'Shaman', 'Ship Builder', 'Bronze Worker', 'Warrior']
                }
            },
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Iron Age Tribes',
                dominantPowerDescription: 'Northern Germanic tribes develop a distinctive culture, trading amber southward while remaining beyond Roman reach.',
                eraContextSentence: 'an age of tribal kings and sacred bogs, where northern peoples forge their own path.',
                allegianceGroups: [
                    { name: 'Svear', type: 'primary', description: 'Tribes in central Sweden.' },
                    { name: 'Danes', type: 'secondary', description: 'Tribes in Jutland and the islands.' },
                    { name: 'Geats', type: 'secondary', description: 'Tribes in southern Sweden.' },
                    { name: 'Sami', type: 'secondary', description: 'Indigenous peoples of the far north.' }
                ],
                structureNames: {
                    fortress: ['Ring Fort', 'Hill Fort', 'Fortified Island', 'Coastal Stronghold'],
                    mill: ['Hand Mill', 'Quern Stone'],
                    holy_site: ['Sacred Grove', 'Burial Mound', 'Stone Ship', 'Rune Stone', 'Bog Sacrifice Site'],
                    palace: ["Jarl's Hall", 'Chieftain\'s Longhouse']
                },
                courtRoles: {
                    palace: ['Jarl', 'Skald', 'Völva', 'Huskarl', 'Thing-speaker']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Nordic Kingdoms',
                dominantPowerDescription: 'The Viking Age gives way to Christian kingdoms, with Denmark, Sweden, and Norway competing for Baltic dominance.',
                eraContextSentence: 'an age of Viking legacy and Christian conversion, where Nordic warriors become European kings.',
                allegianceGroups: [
                    { name: 'Kingdom of Denmark', type: 'primary', description: 'Often the strongest Nordic power.' },
                    { name: 'Kingdom of Sweden', type: 'secondary', description: 'Rising power in the Baltic.' },
                    { name: 'Kingdom of Norway', type: 'secondary', description: 'Atlantic-focused kingdom.' },
                    { name: 'Hanseatic League', type: 'trade_company', description: 'German merchants dominating trade.' }
                ],
                structureNames: {
                    fortress: ['Castle', 'Fortified Church', 'Royal Stronghold', 'Borg', 'Round Tower'],
                    mill: ['Water Mill', 'Windmill', 'Tidal Mill'],
                    holy_site: ['Cathedral', 'Monastery', 'Stave Church', 'Stone Church', 'Pilgrimage Site'],
                    palace: ['Royal Hall', 'Archbishop\'s Palace', 'Jarl\'s Residence'],
                    trading_post: ['Hanseatic Kontor', 'Market Town', 'Fishing Port', 'Merchant Quarter']
                },
                courtRoles: {
                    palace: ['Jarl', 'Marshal', 'Chancellor', 'Royal Skald', 'Hirdman'],
                    holy_site: ['Archbishop', 'Abbot', 'Canon', 'Deacon']
                },
                mapAreaOverrides: {
                    "Norwegian Fjords": {
                        dominantPower: 'Kingdom of Norway',
                        dominantPowerDescription: 'Norway looks west to the Atlantic, ruling Iceland, Greenland, and reaching even to Vinland.',
                        allegianceGroups: [
                            { name: 'Norwegian Crown', type: 'primary', description: 'Kings ruling from fjord strongholds.' },
                            { name: 'Icelandic Commonwealth', type: 'secondary', description: 'Norwegian settlers maintaining independence.' },
                            { name: 'Orkney Jarls', type: 'secondary', description: 'Norse rulers of Scottish islands.' }
                        ]
                    },
                    "Jutland Peninsula": {
                        dominantPower: 'Danish Dominance',
                        dominantPowerDescription: 'Denmark controls the straits and extracts Sound Dues from all Baltic trade.',
                        allegianceGroups: [
                            { name: 'Danish Crown', type: 'primary', description: 'Valdemar kings building an empire.' },
                            { name: 'Holstein Nobles', type: 'secondary', description: 'German vassals on the southern border.' },
                            { name: 'Wendish Pirates', type: 'rebel', description: 'Slavic raiders from across the Baltic.' }
                        ]
                    },
                    "Stockholm Archipelago": {
                        dominantPower: 'Sweden Ascending',
                        dominantPowerDescription: 'Stockholm emerges as a power center, though still overshadowed by Denmark.',
                        allegianceGroups: [
                            { name: 'Swedish Crown', type: 'primary', description: 'The Folkung dynasty consolidating power.' },
                            { name: 'Hanseatic Merchants', type: 'trade_company', description: 'Germans controlling Swedish trade.' },
                            { name: 'Finnish Tribes', type: 'secondary', description: 'Eastern subjects being Christianized.' }
                        ]
                    },
                    "Gotland": {
                        dominantPower: 'Hanseatic City of Visby',
                        dominantPowerDescription: 'The island of Gotland is a major hub for Baltic trade, dominated by the wealthy, fortified city of Visby, a key Hanseatic League member.',
                        allegianceGroups: [
                            { name: 'Merchants of Visby', type: 'primary', description: 'The German and Gotlandic elite of the city.' },
                            { name: 'Victual Brothers', type: 'rebel', description: 'Pirates who later captured the island.' },
                            { name: 'Kingdom of Sweden', type: 'secondary', description: 'The nominal ruler of the island with little real control.' }
                        ]
                    },
                    "Lapland": {
                        dominantPower: 'Sámi Peoples',
                        dominantPowerDescription: 'The indigenous Sámi people live a semi-nomadic life, paying tribute in furs to various Nordic kingdoms but maintaining their own culture.',
                        allegianceGroups: [
                            { name: 'Sámi Siidas', type: 'primary', description: 'The family-based Sámi communities.' },
                            { name: 'Norwegian Tax Collectors', type: 'secondary', description: 'Agents of the western kingdom demanding tribute.' },
                            { name: 'Novgorodian Merchants', type: 'trade_company', description: 'Traders from the east seeking valuable furs.' }
                        ]
                    }
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Swedish Empire',
                dominantPowerDescription: 'Sweden emerges as a great power, dominating the Baltic and intervening decisively in European wars under warrior kings.',
                eraContextSentence: 'the age of northern ambition, where Swedish armies march across Europe as the "Lion of the North."',
                allegianceGroups: [
                    { name: 'Swedish Empire', type: 'primary', description: 'The dominant Baltic power.' },
                    { name: 'Denmark-Norway', type: 'secondary', description: 'The rival dual monarchy.' },
                    { name: 'Poland-Lithuania', type: 'secondary', description: 'Competitor for Baltic dominance.' },
                    { name: 'Russia', type: 'secondary', description: 'The rising eastern threat.' }
                ],
                structureNames: {
                    fortress: ['Star Fort', 'Coastal Battery', 'Border Fortress', 'Citadel', 'Skans'],
                    mill: ['Iron Mill', 'Gunpowder Mill', 'Copper Works', 'Sawmill'],
                    holy_site: ['Lutheran Cathedral', 'Parish Church', 'Royal Chapel', 'University'],
                    palace: ['Royal Palace', 'Governor\'s Residence', 'Noble Manor', 'Admiralty'],
                    trading_post: ['Customs House', 'Company Warehouse', 'Stapelstad', 'Iron Port']
                },
                courtRoles: {
                    palace: ['Riksråd', 'Generalissimo', 'Riksamiral', 'Hovmästare', 'Kammarherre']
                },
                mapAreaOverrides: {
                    "Stockholm Archipelago": {
                        dominantPower: 'Great Power Sweden',
                        dominantPowerDescription: 'Stockholm commands an empire stretching from Finland to Pomerania, built on military innovation and iron exports.',
                        allegianceGroups: [
                            { name: 'House of Vasa', type: 'primary', description: 'The warrior dynasty building empire.' },
                            { name: 'Finnish Provinces', type: 'secondary', description: 'The eastern buffer against Russia.' },
                            { name: 'Baltic Germans', type: 'secondary', description: 'Noble subjects in conquered provinces.' }
                        ]
                    },
                    "Øresund Strait": {
                        dominantPower: 'Sound Dues Struggle',
                        dominantPowerDescription: 'Denmark still controls the vital straits, extracting tolls that fund the kingdom but anger rising powers.',
                        allegianceGroups: [
                            { name: 'Danish Crown', type: 'primary', description: 'Defending ancient toll rights.' },
                            { name: 'Dutch Merchants', type: 'trade_company', description: 'Seeking free passage for trade.' },
                            { name: 'Swedish Navy', type: 'secondary', description: 'Challenging Danish control.' }
                        ]
                    }
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Scandinavian Kingdoms',
                dominantPowerDescription: 'The Nordic countries industrialize while developing distinctive models of constitutional monarchy and social cooperation.',
                eraContextSentence: 'an era of peaceful progress, where Nordic nations pioneer social democracy and neutrality.',
                allegianceGroups: [
                    { name: 'Kingdom of Sweden', type: 'primary', description: 'Neutral industrial power.' },
                    { name: 'Denmark', type: 'primary', description: 'Small state adapting to German power.' },
                    { name: 'Norway', type: 'primary', description: 'Under Swedish crown until 1905.' },
                    { name: 'German Empire', type: 'secondary', description: 'The overwhelming southern neighbor.' }
                ],
                structureNames: {
                    fortress: ['Coastal Fort', 'Border Fortification', 'Naval Base', 'Garrison'],
                    mill: ['Paper Mill', 'Textile Mill', 'Sawmill', 'Grain Mill'],
                    factory: ['Shipyard', 'Match Factory', 'Dynamite Works', 'Steel Mill'],
                    mining_colony: ['Iron Mine', 'Copper Mine', 'Forestry Camp'],
                    trading_post: ['Railway Station', 'Steamship Port', 'Telegraph Office', 'Bank']
                },
                mapAreaOverrides: {
                    "Norwegian Fjords": {
                        dominantPower: 'Norway in Union',
                        dominantPowerDescription: 'Norway chafes under Swedish rule while building a merchant marine that will soon rival Britain\'s.',
                        allegianceGroups: [
                            { name: 'Swedish-Norwegian Union', type: 'primary', description: 'The dual monarchy under Swedish king.' },
                            { name: 'Norwegian Nationalists', type: 'rebel', description: 'Patriots seeking full independence.' },
                            { name: 'Shipping Magnates', type: 'trade_company', description: 'Building wealth through global trade.' }
                        ]
                    }
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Nordic Democracies',
                dominantPowerDescription: 'The Nordic nations cooperate closely while maintaining distinctive welfare state models admired worldwide.',
                eraContextSentence: 'an era of Nordic cooperation, where Scandinavian nations lead in social progress and quality of life.',
                allegianceGroups: [
                    { name: 'Nordic Governments', type: 'primary', description: 'Democratic welfare states.' },
                    { name: 'Nordic Council', type: 'secondary', description: 'Regional cooperation body.' },
                    { name: 'NATO', type: 'secondary', description: 'Denmark and Norway members, Sweden neutral.' },
                    { name: 'European Union', type: 'secondary', description: 'Denmark and Sweden members.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Civil Defense Bunker', 'Coast Guard Station'],
                    factory: ['Volvo Plant', 'Nokia Factory', 'Wind Turbine Plant', 'Pharmaceutical Lab'],
                    trading_post: ['International Airport', 'Container Port', 'IKEA', 'Ferry Terminal'],
                    mining_colony: ['Oil Platform', 'Hydroelectric Plant', 'Data Center']
                }
            },
            "1940s": {
                dominantPower: 'Scandinavia at War',
                dominantPowerDescription: 'World War II shatters Nordic unity as Norway and Denmark fall to Nazi occupation while Sweden maintains precarious neutrality.',
                eraContextSentence: 'the test of neutrality, where Nordic nations face occupation, collaboration, and resistance.',
                allegianceGroups: [
                    { name: 'Nazi Occupation', type: 'primary', description: 'German forces in Norway and Denmark.' },
                    { name: 'Resistance Movements', type: 'rebel', description: 'Underground fighters sabotaging occupiers.' },
                    { name: 'Swedish Neutrality', type: 'secondary', description: 'Walking tightrope between Allies and Axis.' },
                    { name: 'Allied Forces', type: 'secondary', description: 'British raids and eventual liberation.' }
                ],
                mapAreaOverrides: {
                    "Norwegian Fjords": {
                        dominantPower: 'Fortress Norway',
                        dominantPowerDescription: 'Hitler obsesses over Norway as the "zone of destiny," fortifying it against Allied invasion.',
                        allegianceGroups: [
                            { name: 'Wehrmacht', type: 'primary', description: 'German occupation forces.' },
                            { name: 'Quisling Regime', type: 'secondary', description: 'Norwegian collaborators.' },
                            { name: 'Milorg', type: 'rebel', description: 'Norwegian resistance organization.' }
                        ]
                    },
                    "Stockholm Archipelago": {
                        dominantPower: 'Swedish Balancing Act',
                        dominantPowerDescription: 'Sweden trades with Germany while secretly aiding Norwegian resistance and Jewish refugees.',
                        allegianceGroups: [
                            { name: 'Swedish Government', type: 'primary', description: 'Coalition maintaining neutrality.' },
                            { name: 'Pro-German Business', type: 'trade_company', description: 'Iron ore suppliers to the Reich.' },
                            { name: 'Pro-Allied Sympathizers', type: 'secondary', description: 'Those wanting to join the fight.' }
                        ]
                    }
                }
            },
            "1970s": {
                dominantPower: 'Nordic Model Emerging',
                dominantPowerDescription: 'Scandinavia develops the distinctive welfare state model while Norway discovers North Sea oil.',
                eraContextSentence: 'the Nordic golden age, where social democracy creates the world\'s most equal societies.',
                allegianceGroups: [
                    { name: 'Social Democratic Parties', type: 'primary', description: 'Dominant political force.' },
                    { name: 'Labor Unions', type: 'secondary', description: 'Partners in corporatist model.' },
                    { name: 'New Left', type: 'rising', description: 'Challenging consensus from the left.' }
                ],
                mapAreaOverrides: {
                    "Norwegian Fjords": {
                        dominantPower: 'Oil-Rich Norway',
                        dominantPowerDescription: 'North Sea oil transforms Norway from poor cousin to Scandinavia\'s richest nation.',
                        allegianceGroups: [
                            { name: 'Norwegian State', type: 'primary', description: 'Managing newfound oil wealth.' },
                            { name: 'Statoil', type: 'trade_company', description: 'State oil company building sovereign wealth.' },
                            { name: 'Environmental Movement', type: 'rebel', description: 'Early critics of oil dependency.' }
                        ]
                    }
                }
            }
        },
        "Eastern Europe": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Sarmatian Confederations',
                dominantPowerDescription: 'Nomadic Iranian peoples dominate the vast steppes, serving as intermediaries between the settled civilizations and the nomadic world.',
                eraContextSentence: 'an age of horsemen and migrations, where steppe peoples shape the destiny of Europe.',
                allegianceGroups: [
                    { name: 'Sarmatians', type: 'primary', description: 'Dominant steppe confederation.' },
                    { name: 'Dacians', type: 'secondary', description: 'Settled peoples in the Carpathians.' },
                    { name: 'Roman Empire', type: 'secondary', description: 'The empire seeking Danube frontier.' },
                    { name: 'Germanic Tribes', type: 'secondary', description: 'Peoples pressed between Rome and steppe.' }
                ],
                structureNames: {
                    fortress: ['Hill Fort', 'Dacian Fortress', 'Earthwork Camp', 'River Stronghold'],
                    mill: ['Hand Mill', 'Grinding Stone'],
                    holy_site: ['Sacred Grove', 'Sky Burial Ground', 'Kurgan', 'Fire Temple'],
                    palace: ["Chieftain's Yurt", 'Tribal Compound']
                },
                courtRoles: {
                    palace: ['Khan', 'War Chief', 'Shaman', 'Horse Master', 'Tribute Collector']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Slavic Kingdoms',
                dominantPowerDescription: 'Slavic peoples establish kingdoms between the German west and the steppe east, with Poland and Rus\' emerging as major powers.',
                eraContextSentence: 'an age of Slavic emergence, where new nations rise between cross and crescent.',
                allegianceGroups: [
                    { name: 'Kingdom of Poland', type: 'primary', description: 'Western Slavic power accepting Latin Christianity.' },
                    { name: 'Kievan Rus\'', type: 'secondary', description: 'Eastern Slavs under Byzantine influence.' },
                    { name: 'Kingdom of Hungary', type: 'secondary', description: 'Magyar state controlling the middle Danube.' },
                    { name: 'Mongol Invaders', type: 'rising', description: 'The steppe terror from the east.' }
                ],
                structureNames: {
                    fortress: ['Gród', 'Kremlin', 'Stone Castle', 'Wooden Fort', 'Border Tower'],
                    mill: ['Water Mill', 'Windmill', 'Horse Mill'],
                    holy_site: ['Cathedral', 'Monastery', 'Wooden Church', 'Orthodox Lavra', 'Shrine'],
                    palace: ['Royal Castle', 'Ducal Court', 'Boyar Manor', 'Prince\'s Tower'],
                    trading_post: ['Market Square', 'River Port', 'Merchant Quarter', 'Fair Ground']
                },
                courtRoles: {
                    palace: ['Wojewoda', 'Kanclerz', 'Kniaz', 'Hetman', 'Dvoryanin'],
                    holy_site: ['Metropolitan', 'Bishop', 'Hegumen', 'Archpriest']
                },
                mapAreaOverrides: {
                    "Dnieper River Valley": {
                        dominantPower: 'Kievan Rus\'',
                        dominantPowerDescription: 'Kiev, "Mother of Russian Cities," controls the route from Vikings to Greeks.',
                        allegianceGroups: [
                            { name: 'Grand Prince of Kiev', type: 'primary', description: 'Rurikid ruler of the Rus\'.' },
                            { name: 'Novgorod', type: 'secondary', description: 'Northern trading republic.' },
                            { name: 'Pecheneg Nomads', type: 'rebel', description: 'Steppe raiders threatening trade.' }
                        ]
                    },
                    "Carpathian Ridge": {
                        dominantPower: 'Kingdom of Hungary',
                        dominantPowerDescription: 'The Magyars have settled in the Carpathian Basin, creating a strong kingdom at Europe\'s crossroads.',
                        allegianceGroups: [
                            { name: 'Árpád Dynasty', type: 'primary', description: 'Magyar kings ruling from Buda.' },
                            { name: 'Saxon Settlers', type: 'secondary', description: 'German colonists in Transylvania.' },
                            { name: 'Vlach Shepherds', type: 'secondary', description: 'Romance-speaking mountain peoples.' }
                        ]
                    }
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Polish-Lithuanian Commonwealth',
                dominantPowerDescription: 'The largest state in Europe emerges from dynastic union, a noble republic stretching from Baltic to Black Sea.',
                eraContextSentence: 'the golden age of Polish liberty, where nobles elect kings and practice religious tolerance.',
                allegianceGroups: [
                    { name: 'Polish-Lithuanian Commonwealth', type: 'primary', description: 'The dual state under elected kings.' },
                    { name: 'Ottoman Empire', type: 'secondary', description: 'The southern threat and occasional ally.' },
                    { name: 'Muscovy/Russia', type: 'secondary', description: 'The rising eastern rival.' },
                    { name: 'Cossacks', type: 'rising', description: 'Free warriors of the borderlands.' }
                ],
                structureNames: {
                    fortress: ['Bastion Fortress', 'Border Castle', 'Cossack Sich', 'Star Fort'],
                    mill: ['Grain Mill', 'Fulling Mill', 'Windmill', 'Water Mill'],
                    holy_site: ['Baroque Church', 'Synagogue', 'Orthodox Church', 'Uniate Cathedral'],
                    palace: ['Magnate Palace', 'Royal Castle', 'Sejmik Hall', 'Hetman Residence'],
                    trading_post: ['Jewish Market', 'River Port', 'Noble Folwark', 'Armenian Quarter']
                },
                courtRoles: {
                    palace: ['Hetman Wielki', 'Kanclerz', 'Marszałek', 'Podskarbi', 'Starosta']
                },
                mapAreaOverrides: {
                    "Dnieper River Valley": {
                        dominantPower: 'Cossack Hetmanate',
                        dominantPowerDescription: 'The Zaporizhian Cossacks maintain autonomy on the wild frontier, serving and betraying various masters.',
                        allegianceGroups: [
                            { name: 'Cossack Host', type: 'primary', description: 'The warrior democracy of the Sich.' },
                            { name: 'Polish Crown', type: 'secondary', description: 'Nominal overlords offering privileges.' },
                            { name: 'Crimean Tatars', type: 'secondary', description: 'Sometimes allies, often raiders.' }
                        ]
                    },
                    "Carpathian Ridge": {
                        dominantPower: 'Transylvanian Principality',
                        dominantPowerDescription: 'A semi-independent state balancing between Habsburgs and Ottomans, haven of religious tolerance.',
                        allegianceGroups: [
                            { name: 'Prince of Transylvania', type: 'primary', description: 'Elected ruler playing great powers.' },
                            { name: 'Saxon Merchants', type: 'trade_company', description: 'German cities with ancient privileges.' },
                            { name: 'Székely Warriors', type: 'secondary', description: 'Free Hungarian frontier guards.' }
                        ]
                    }
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Partitioned Lands',
                dominantPowerDescription: 'Eastern Europe is carved up between Russian, Austrian, and Prussian empires as nationalist movements simmer.',
                eraContextSentence: 'an era of imperial domination, where Eastern European nations dream of independence.',
                allegianceGroups: [
                    { name: 'Russian Empire', type: 'primary', description: 'The dominant eastern power.' },
                    { name: 'Austria-Hungary', type: 'secondary', description: 'The multicultural empire.' },
                    { name: 'German Empire', type: 'secondary', description: 'Prussian power in the west.' },
                    { name: 'National Movements', type: 'rebel', description: 'Poles, Czechs, and others seeking freedom.' }
                ],
                structureNames: {
                    fortress: ['Fortress', 'Citadel', 'Border Fort', 'Arsenal'],
                    mill: ['Sugar Mill', 'Textile Mill', 'Steam Mill', 'Distillery'],
                    factory: ['Foundry', 'Locomotive Works', 'Sugar Refinery', 'Armaments Plant'],
                    mining_colony: ['Coal Mine', 'Salt Mine', 'Oil Well'],
                    trading_post: ['Railway Junction', 'Customs Post', 'Market Hall', 'Port']
                },
                mapAreaOverrides: {
                    "Moscow Basin": {
                        dominantPower: 'Heart of Empire',
                        dominantPowerDescription: 'Moscow emerges as the center of a vast empire stretching from Poland to the Pacific.',
                        allegianceGroups: [
                            { name: 'Tsarist Autocracy', type: 'primary', description: 'The Romanov imperial government.' },
                            { name: 'Orthodox Church', type: 'religious', description: 'Spiritual pillar of autocracy.' },
                            { name: 'Revolutionary Movements', type: 'rebel', description: 'Socialists and anarchists plotting change.' }
                        ]
                    },
                    "Carpathian Ridge": {
                        dominantPower: 'Habsburg Galicia',
                        dominantPowerDescription: 'Austrian-ruled Galicia becomes a center of Polish and Ukrainian national revivals.',
                        allegianceGroups: [
                            { name: 'Austrian Administration', type: 'primary', description: 'Habsburg bureaucracy from Vienna.' },
                            { name: 'Polish Nobility', type: 'secondary', description: 'Maintaining cultural dominance.' },
                            { name: 'Ruthenian Peasants', type: 'secondary', description: 'Ukrainian speakers seeking recognition.' }
                        ]
                    }
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Soviet Bloc',
                dominantPowerDescription: 'Eastern Europe falls under Soviet domination after World War II, later breaking free to join the European Union.',
                eraContextSentence: 'a century of ideological struggle, from communist rule to European integration.',
                allegianceGroups: [
                    { name: 'Warsaw Pact', type: 'primary', description: 'Soviet-dominated military alliance.' },
                    { name: 'Communist Parties', type: 'secondary', description: 'Moscow\'s local enforcers.' },
                    { name: 'Dissident Movements', type: 'rebel', description: 'Those daring to oppose the system.' },
                    { name: 'Catholic Church', type: 'religious', description: 'Spiritual resistance to atheist state.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Border Checkpoint', 'Secret Police HQ'],
                    factory: ['Steelworks', 'Tractor Plant', 'Chemical Kombinat', 'Shipyard'],
                    trading_post: ['State Store', 'Railway Terminal', 'Comecon Trade Center'],
                    mining_colony: ['Coal Mine', 'Uranium Mine', 'Industrial Complex']
                }
            },
            "1950s": {
                dominantPower: 'Stalinist Control',
                dominantPowerDescription: 'Stalin\'s empire reaches its peak as Eastern Europe endures show trials, collectivization, and total Soviet control.',
                eraContextSentence: 'the Iron Curtain descends, as Soviet power crushes all opposition.',
                allegianceGroups: [
                    { name: 'Soviet Occupation', type: 'primary', description: 'Red Army and advisors everywhere.' },
                    { name: 'Local Stalinists', type: 'secondary', description: 'Native communists serving Moscow.' },
                    { name: 'Underground Church', type: 'religious', description: 'Faith surviving persecution.' },
                    { name: 'Anti-Communist Partisans', type: 'rebel', description: 'Forest fighters slowly being eliminated.' }
                ],
                mapAreaOverrides: {
                    "Danube Bend": {
                        dominantPower: 'Hungarian Revolution',
                        dominantPowerDescription: 'In 1956, Budapest rises against Soviet rule before tanks crush the dream of freedom.',
                        allegianceGroups: [
                            { name: 'Revolutionary Government', type: 'primary', description: 'Imre Nagy\'s brief free government.' },
                            { name: 'Freedom Fighters', type: 'rebel', description: 'Students and workers fighting tanks.' },
                            { name: 'Soviet Forces', type: 'secondary', description: 'The crushing military response.' }
                        ]
                    }
                }
            },
            "1980s": {
                dominantPower: 'Crumbling Communism',
                dominantPowerDescription: 'Economic stagnation and Gorbachev\'s reforms unleash forces that will soon topple the communist system.',
                eraContextSentence: 'the beginning of the end, as Solidarity in Poland shows that communist power can be challenged.',
                allegianceGroups: [
                    { name: 'Communist Governments', type: 'primary', description: 'Regimes losing legitimacy and control.' },
                    { name: 'Solidarity', type: 'rebel', description: 'Polish trade union becoming a movement.' },
                    { name: 'Reform Communists', type: 'secondary', description: 'Those hoping to save socialism.' },
                    { name: 'Democratic Opposition', type: 'rebel', description: 'Dissidents preparing for change.' }
                ],
                mapAreaOverrides: {
                    "Carpathian Foothills": {
                        dominantPower: 'Ceaușescu\'s Romania',
                        dominantPowerDescription: 'A cult of personality and severe austerity mark the final years of communist rule in Romania, leading to a violent revolution.',
                        allegianceGroups: [
                            { name: 'Ceaușescu Regime', type: 'primary', description: 'The highly repressive state and its Securitate secret police.' },
                            { name: 'Hungarian Minority', type: 'secondary', description: 'Facing forced assimilation policies.' },
                            { name: 'Revolutionary Front', type: 'rebel', description: 'The disparate groups that overthrew the regime in 1989.' }
                        ]
                    }
                }
            },
            "1990s": {
                dominantPower: 'Post-Communist Transition',
                dominantPowerDescription: 'The Soviet empire collapses as Eastern Europe rushes toward democracy, capitalism, and eventual EU membership.',
                eraContextSentence: 'the return to Europe, as former communist states undergo painful but hopeful transformation.',
                allegianceGroups: [
                    { name: 'Democratic Governments', type: 'primary', description: 'New leaders navigating transition.' },
                    { name: 'European Union', type: 'secondary', description: 'The goal of integration.' },
                    { name: 'Ex-Communists', type: 'secondary', description: 'Renamed parties adapting to democracy.' },
                    { name: 'Nationalist Movements', type: 'rebel', description: 'Those exploiting economic pain.' }
                ],
                mapAreaOverrides: {
                    "Steppe Borderlands": {
                        dominantPower: 'Independent Ukraine',
                        dominantPowerDescription: 'Europe\'s largest country emerges from Soviet collapse, struggling to build a nation between East and West.',
                        allegianceGroups: [
                            { name: 'Ukrainian State', type: 'primary', description: 'New government in Kiev.' },
                            { name: 'Russian Influence', type: 'secondary', description: 'Moscow\'s continuing pull.' },
                            { name: 'Western Orientation', type: 'secondary', description: 'Those looking to Europe.' }
                        ]
                    }
                }
            }
        },
        "Balkans": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Roman Empire',
                dominantPowerDescription: 'The Balkans serve as a crucial crossroads between East and West, with Via Egnatia connecting Rome to Constantinople.',
                eraContextSentence: 'an age of Roman order, where Illyrian, Thracian, and Greek peoples adopt imperial ways.',
                allegianceGroups: [
                    { name: 'Roman Empire', type: 'primary', description: 'The ruling imperial power.' },
                    { name: 'Dacian Kingdom', type: 'rebel', description: 'Powerful kingdom north of the Danube.' },
                    { name: 'Greek Cities', type: 'secondary', description: 'Ancient poleis maintaining local traditions.' }
                ],
                structureNames: {
                    fortress: ['Legionary Fortress', 'Walled City', 'Danube Fort', 'Coastal Castrum'],
                    mill: ['Roman Mill', 'Aqueduct Mill'],
                    holy_site: ['Temple of Zeus', 'Mithraeum', 'Cybele Shrine', 'Imperial Cult Temple'],
                    palace: ["Governor's Palace", 'Forum', 'Municipal Basilica']
                },
                courtRoles: {
                    palace: ['Legatus', 'Procurator', 'Municipium Magistrate', 'Publicanus']
                },
                mapAreaOverrides: {
                    "Bosporus": {
                        dominantPower: 'Byzantion',
                        dominantPowerDescription: 'The strategic city controls passage between Europe and Asia, destined to become Constantinople.',
                        allegianceGroups: [
                            { name: 'Roman Administration', type: 'primary', description: 'Imperial control of vital straits.' },
                            { name: 'Greek Merchants', type: 'trade_company', description: 'Ancient trading networks.' },
                            { name: 'Thracian Tribes', type: 'secondary', description: 'Native peoples of the hinterland.' }
                        ]
                    },
                    "Dalmatian Coast": {
                        dominantPower: 'Roman Dalmatia',
                        dominantPowerDescription: 'Prosperous coastal province where emperors like Diocletian will build retirement palaces.',
                        allegianceGroups: [
                            { name: 'Roman Navy', type: 'primary', description: 'Fleet suppressing piracy.' },
                            { name: 'Illyrian Nobles', type: 'secondary', description: 'Romanized local elite.' },
                            { name: 'Mountain Tribes', type: 'rebel', description: 'Unsubdued peoples in the interior.' }
                        ]
                    }
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Byzantine Empire',
                dominantPowerDescription: 'Constantinople maintains varying control over the Balkans as Slavic peoples settle and new kingdoms emerge.',
                eraContextSentence: 'an era of migrations and conversions, where Byzantine, Bulgar, and Serb vie for dominance.',
                allegianceGroups: [
                    { name: 'Byzantine Empire', type: 'primary', description: 'The Greek-speaking Roman successor.' },
                    { name: 'Bulgarian Empire', type: 'rising', description: 'Powerful Slavic-Bulgar state.' },
                    { name: 'Serbian Principalities', type: 'secondary', description: 'Emerging Slavic powers.' },
                    { name: 'Croatian Kingdom', type: 'secondary', description: 'Catholic Slavs looking west.' }
                ],
                structureNames: {
                    fortress: ['Theme Fortress', 'Kastron', 'Grad', 'Stone Keep', 'Border Fort'],
                    mill: ['Water Mill', 'Monastery Mill'],
                    holy_site: ['Orthodox Monastery', 'Byzantine Church', 'Catholic Cathedral', 'Cave Hermitage'],
                    palace: ['Strategos Residence', 'Župan Court', 'Ban\'s Palace'],
                    trading_post: ['Market', 'Emporion', 'Caravan Stop', 'Port Quarter']
                },
                courtRoles: {
                    palace: ['Strategos', 'Logothete', 'Župan', 'Vojvoda', 'Kephale'],
                    holy_site: ['Metropolitan', 'Hegumen', 'Archbishop', 'Hieromonk']
                },
                mapAreaOverrides: {
                    "Bosporus": {
                        dominantPower: 'Constantinople',
                        dominantPowerDescription: 'The Queen of Cities, greatest metropolis of medieval Europe, heart of Byzantine power.',
                        allegianceGroups: [
                            { name: 'Byzantine Emperor', type: 'primary', description: 'The Roman Emperor of the East.' },
                            { name: 'Varangian Guard', type: 'mercenary', description: 'Norse warriors serving the emperor.' },
                            { name: 'Italian Merchants', type: 'trade_company', description: 'Venetians and Genoese with trade privileges.' }
                        ]
                    },
                    "Vardar Valley": {
                        dominantPower: 'Serbian Kingdoms',
                        dominantPowerDescription: 'Serbian rulers carve out kingdoms in the central Balkans, dreaming of empire.',
                        allegianceGroups: [
                            { name: 'Serbian Dynasties', type: 'primary', description: 'Nemanjić and other royal lines.' },
                            { name: 'Byzantine Empire', type: 'secondary', description: 'The fading but prestigious overlord.' },
                            { name: 'Bogomil Heretics', type: 'religious', description: 'Dualist Christians rejecting authority.' }
                        ]
                    },
                    "Thracian Plain": {
                        dominantPower: 'Bulgarian Empire',
                        dominantPowerDescription: 'The Bulgarian tsars rule from Pliska and Preslav, challenging Byzantine hegemony.',
                        allegianceGroups: [
                            { name: 'Bulgarian Tsar', type: 'primary', description: 'Ruler claiming imperial dignity.' },
                            { name: 'Bulgar Nobility', type: 'secondary', description: 'Turkic military elite.' },
                            { name: 'Slavic Peasants', type: 'secondary', description: 'The demographic majority.' }
                        ]
                    }
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Ottoman Empire',
                dominantPowerDescription: 'The Ottomans conquer the Balkans, creating a multi-religious empire where different communities maintain autonomy under the Sultan.',
                eraContextSentence: 'an age of Ottoman dominion, where Christian and Muslim communities coexist under Islamic rule.',
                allegianceGroups: [
                    { name: 'Ottoman Empire', type: 'primary', description: 'The Sultan\'s expanding domain.' },
                    { name: 'Habsburg Monarchy', type: 'secondary', description: 'Catholic power contesting the frontier.' },
                    { name: 'Venice', type: 'trade_company', description: 'Maritime republic holding coastal enclaves.' },
                    { name: 'Hajduks', type: 'rebel', description: 'Christian bandits and freedom fighters.' }
                ],
                structureNames: {
                    fortress: ['Kale', 'Hisar', 'Border Fort', 'Venetian Castle'],
                    mill: ['Water Mill', 'Horse Mill'],
                    holy_site: ['Mosque', 'Orthodox Church', 'Tekke', 'Monastery', 'Synagogue'],
                    palace: ["Pasha's Saray", 'Konak', 'Voivode Residence'],
                    trading_post: ['Bazaar', 'Han', 'Venetian Fondaco', 'Dubrovnik Quarter']
                },
                courtRoles: {
                    palace: ['Pasha', 'Defterdar', 'Kadı', 'Sipahi', 'Dragoman'],
                    holy_site: ['Mufti', 'Patriarch', 'Sheikh', 'Hegumen']
                },
                mapAreaOverrides: {
                    "Bosporus": {
                        dominantPower: 'Ottoman Imperial Capital',
                        dominantPowerDescription: 'Constantinople, now Istanbul, serves as the magnificent capital of a world empire.',
                        allegianceGroups: [
                            { name: 'Ottoman Sultan', type: 'primary', description: 'The Padishah ruling from Topkapı Palace.' },
                            { name: 'Janissary Corps', type: 'secondary', description: 'Elite slave soldiers at the capital.' },
                            { name: 'European Ambassadors', type: 'trade_company', description: 'Foreign powers seeking favor.' }
                        ]
                    },
                    "Dinaric Alps": {
                        dominantPower: 'Ottoman-Habsburg Frontier',
                        dominantPowerDescription: 'A militarized borderland where Christian and Muslim raiders wage perpetual guerrilla war.',
                        allegianceGroups: [
                            { name: 'Ottoman Border Lords', type: 'primary', description: 'Commanders of frontier fortresses.' },
                            { name: 'Habsburg Grenzers', type: 'secondary', description: 'Christian soldier-settlers.' },
                            { name: 'Uskoks', type: 'rebel', description: 'Pirate-raiders based in Senj.' }
                        ]
                    },
                    "Dalmatian Coast": {
                        dominantPower: 'Venetian Dalmatia',
                        dominantPowerDescription: 'Venice clings to coastal cities and islands, vital links in its maritime empire.',
                        allegianceGroups: [
                            { name: 'Venetian Administration', type: 'primary', description: 'Colonial governors and garrisons.' },
                            { name: 'Ragusan Republic', type: 'trade_company', description: 'Dubrovnik maintaining independence through diplomacy.' },
                            { name: 'Ottoman Pressure', type: 'secondary', description: 'The looming threat from inland.' }
                        ]
                    }
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Declining Ottoman Empire',
                dominantPowerDescription: 'As the "Sick Man of Europe" weakens, Balkan nations fight for independence while great powers compete for influence.',
                eraContextSentence: 'an era of national awakening, the Eastern Question, and the Balkan powder keg.',
                allegianceGroups: [
                    { name: 'Ottoman Empire', type: 'primary', description: 'The weakening but persistent overlord.' },
                    { name: 'Austria-Hungary', type: 'secondary', description: 'The expanding northern empire.' },
                    { name: 'Independent Serbia', type: 'rising', description: 'First among the free Balkan states.' },
                    { name: 'Kingdom of Greece', type: 'rebel', description: 'Hellas reborn and expanding.' }
                ],
                structureNames: {
                    fortress: ['Modern Fort', 'Arsenal', 'Garrison Barracks'],
                    mill: ['Steam Mill', 'Textile Mill'],
                    factory: ['Small Arms Factory', 'Tobacco Processing', 'Railway Workshop'],
                    trading_post: ['Railway Station', 'Customs House', 'National Bank'],
                    mining_colony: ['Copper Mine', 'Chrome Mine']
                },
                mapAreaOverrides: {
                    "Vardar Valley": {
                        dominantPower: 'Macedonian Question',
                        dominantPowerDescription: 'Ottoman Macedonia becomes the prize in competing Bulgarian, Greek, and Serbian nationalisms.',
                        allegianceGroups: [
                            { name: 'Ottoman Administration', type: 'primary', description: 'Trying to maintain order.' },
                            { name: 'IMRO', type: 'rebel', description: 'Macedonian revolutionaries.' },
                            { name: 'Greek Bands', type: 'rebel', description: 'Guerrillas claiming Macedonia for Hellenism.' },
                            { name: 'Serbian Agents', type: 'rebel', description: 'Belgrade\'s influence in "South Serbia".' }
                        ]
                    },
                    "Pindus Mountains": {
                        dominantPower: 'Kingdom of Greece',
                        dominantPowerDescription: 'Independent Greece expands northward, dreaming of reclaiming Constantinople and fulfilling the Megali Idea.',
                        allegianceGroups: [
                            { name: 'Greek Kingdom', type: 'primary', description: 'The Bavarian then Danish dynasty.' },
                            { name: 'British Influence', type: 'secondary', description: 'Protecting Greece as Mediterranean ally.' },
                            { name: 'Klephts', type: 'rebel', description: 'Bandits becoming national heroes.' }
                        ]
                    }
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Yugoslavia',
                dominantPowerDescription: 'The South Slav state unites then violently fragments, as the Balkans experience world wars, communism, and ethnic conflict.',
                eraContextSentence: 'a century of unity and division, from Yugoslav dream to European integration.',
                allegianceGroups: [
                    { name: 'Yugoslavia', type: 'primary', description: 'The South Slav federation.' },
                    { name: 'Soviet Union', type: 'secondary', description: 'Initial patron then rival after Tito\'s break.' },
                    { name: 'Non-Aligned Movement', type: 'secondary', description: 'Tito\'s third way.' },
                    { name: 'Ethnic Separatists', type: 'rebel', description: 'Those rejecting Yugoslav unity.' }
                ],
                structureNames: {
                    fortress: ['Army Barracks', 'Border Post', 'Civil Defense Bunker'],
                    factory: ['Heavy Industry', 'Arms Factory', 'Zastava Works'],
                    trading_post: ['International Crossing', 'Tourist Resort', 'Duty-Free Shop'],
                    mining_colony: ['Copper Mine', 'Coal Mine', 'Bauxite Mine']
                }
            },
            "1940s": {
                dominantPower: 'Axis Occupation and Resistance',
                dominantPowerDescription: 'The Balkans endure brutal occupation and genocide while partisan movements wage Europe\'s fiercest resistance war.',
                eraContextSentence: 'the darkest chapter, where occupation brings mass murder but also heroic resistance.',
                allegianceGroups: [
                    { name: 'Axis Occupiers', type: 'primary', description: 'Germans, Italians, and collaborators.' },
                    { name: 'Tito\'s Partisans', type: 'rebel', description: 'Communist-led liberation army.' },
                    { name: 'Chetniks', type: 'rebel', description: 'Serbian royalist resistance.' },
                    { name: 'Ustaše State', type: 'secondary', description: 'Croatian fascist puppet regime.' }
                ],
                mapAreaOverrides: {
                    "Dinaric Alps": {
                        dominantPower: 'Partisan Stronghold',
                        dominantPowerDescription: 'Tito\'s Partisans control mountain territories, building a parallel state while fighting occupiers.',
                        allegianceGroups: [
                            { name: 'Partisan Liberation Army', type: 'primary', description: 'Tito\'s multiethnic resistance.' },
                            { name: 'British SOE', type: 'secondary', description: 'Allied support missions.' },
                            { name: 'Axis Forces', type: 'secondary', description: 'German and Italian units hunting partisans.' }
                        ]
                    },
                    "Vardar Valley": {
                        dominantPower: 'Bulgarian Occupation',
                        dominantPowerDescription: 'Bulgaria annexes most of Macedonia, implementing harsh Bulgarization policies.',
                        allegianceGroups: [
                            { name: 'Bulgarian Administration', type: 'primary', description: 'Sofia\'s harsh occupation regime.' },
                            { name: 'Macedonian Partisans', type: 'rebel', description: 'Local resistance to occupation.' },
                            { name: 'German Oversight', type: 'secondary', description: 'Nazi supervision of their ally.' }
                        ]
                    }
                }
            },
            "1990s": {
                dominantPower: 'Yugoslav Wars',
                dominantPowerDescription: 'Yugoslavia\'s violent breakup brings ethnic cleansing and international intervention as new states emerge from the carnage.',
                eraContextSentence: 'the return of history\'s demons, as ethnic hatred tears apart Tito\'s legacy.',
                allegianceGroups: [
                    { name: 'Successor States', type: 'primary', description: 'Croatia, Bosnia, Serbia, etc. asserting independence.' },
                    { name: 'UN/NATO', type: 'secondary', description: 'International forces trying to stop the killing.' },
                    { name: 'Paramilitary Groups', type: 'rebel', description: 'Ethnic militias committing atrocities.' },
                    { name: 'War Profiteers', type: 'mercenary', description: 'Criminals exploiting chaos.' }
                ],
                mapAreaOverrides: {
                    "Dinaric Alps": {
                        dominantPower: 'Bosnian War',
                        dominantPowerDescription: 'Bosnia becomes Europe\'s bloodiest battlefield since WWII as three ethnic groups wage war.',
                        allegianceGroups: [
                            { name: 'Bosnian Government', type: 'primary', description: 'Multiethnic state fighting for survival.' },
                            { name: 'Republika Srpska', type: 'rebel', description: 'Bosnian Serb separatist entity.' },
                            { name: 'Herzeg-Bosnia', type: 'rebel', description: 'Croat separatist statelet.' },
                            { name: 'UNPROFOR', type: 'secondary', description: 'Helpless UN peacekeepers.' }
                        ]
                    },
                    "Vardar Valley": {
                        dominantPower: 'Macedonian Independence',
                        dominantPowerDescription: 'Macedonia achieves peaceful independence but faces Greek objections to its name and Albanian minority tensions.',
                        allegianceGroups: [
                            { name: 'Republic of Macedonia', type: 'primary', description: 'New state seeking recognition.' },
                            { name: 'Albanian Minority', type: 'secondary', description: 'Quarter of population seeking rights.' },
                            { name: 'Greek Blockade', type: 'secondary', description: 'Athens blocking EU/NATO membership.' }
                        ]
                    }
                }
            }
        },
        "Russia": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Scythian Confederations',
                dominantPowerDescription: 'Iranian-speaking nomads dominate the endless steppes, creating elaborate golden art and trading with Greek colonies.',
                eraContextSentence: 'an age of horse lords and golden treasures, where nomad confederations rule the grasslands.',
                allegianceGroups: [
                    { name: 'Scythians', type: 'primary', description: 'The dominant steppe confederation.' },
                    { name: 'Greek Colonies', type: 'trade_company', description: 'Black Sea trading cities.' },
                    { name: 'Sarmatians', type: 'secondary', description: 'Rising nomadic rivals from the east.' },
                    { name: 'Forest Tribes', type: 'secondary', description: 'Finno-Ugric peoples of the north.' }
                ],
                structureNames: {
                    fortress: ['Kurgan Fort', 'Greek Colony Walls', 'Earthwork Camp'],
                    mill: ['Hand Mill', 'Greek Water Mill'],
                    holy_site: ['Sacred Kurgan', 'Greek Temple', 'Sky Burial Site', 'Animal Style Shrine'],
                    palace: ["Khan's Encampment", 'Nomad Royal Tent']
                },
                courtRoles: {
                    palace: ['Khan', 'War Chief', 'Royal Shaman', 'Master of Horse', 'Greek Advisor']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Kievan Rus',
                dominantPowerDescription: 'Viking adventurers create a loose federation of principalities along river routes, bringing Orthodox Christianity from Byzantium.',
                eraContextSentence: 'an age of princes and saints, where Rus emerges at the crossroads of Viking, Byzantine, and Steppe worlds.',
                allegianceGroups: [
                    { name: 'Grand Prince of Kiev', type: 'primary', description: 'The senior Rurikid prince.' },
                    { name: 'Novgorod Republic', type: 'secondary', description: 'Wealthy northern trading city.' },
                    { name: 'Volga Bulgars', type: 'secondary', description: 'Muslim trading state to the east.' },
                    { name: 'Pechenegs', type: 'rebel', description: 'Turkic raiders threatening the south.' }
                ],
                structureNames: {
                    fortress: ['Kreml', 'Detinets', 'Wooden Fort', 'Prince\'s Tower', 'Border Ostrog'],
                    mill: ['Water Mill', 'Windmill', 'Monastery Mill'],
                    holy_site: ['Orthodox Cathedral', 'Cave Monastery', 'Wooden Church', 'Saint\'s Shrine'],
                    palace: ["Prince's Terem", 'Boyar Mansion', 'Posadnik\'s Hall'],
                    trading_post: ['Gostiny Dvor', 'River Port', 'Volok', 'Marketplace']
                },
                courtRoles: {
                    palace: ['Knyaz', 'Druzhina Commander', 'Tysyatsky', 'Posadnik', 'Boyar Council'],
                    holy_site: ['Metropolitan', 'Hegumen', 'Icon Painter', 'Hermit Saint']
                },
                mapAreaOverrides: {
                    "Dnieper River Valley": {
                        dominantPower: 'Kiev - Mother of Russian Cities',
                        dominantPowerDescription: 'The greatest city of the Rus, where Grand Princes rule and Byzantine culture flourishes.',
                        allegianceGroups: [
                            { name: 'Yaroslav the Wise', type: 'primary', description: 'Grand Prince at Rus\'s height.' },
                            { name: 'Byzantine Empire', type: 'secondary', description: 'Cultural and religious model.' },
                            { name: 'Polish Kingdom', type: 'secondary', description: 'Western neighbor and rival.' }
                        ]
                    },
                    "Novgorod Woods": {
                        dominantPower: 'Lord Novgorod the Great',
                        dominantPowerDescription: 'A merchant republic grows rich on fur trade, governed by the veche (popular assembly) rather than princes.',
                        allegianceGroups: [
                            { name: 'Novgorod Veche', type: 'primary', description: 'The citizen assembly.' },
                            { name: 'Hanseatic League', type: 'trade_company', description: 'German merchants in the Peterhof.' },
                            { name: 'Finnic Tribes', type: 'secondary', description: 'Tribute-paying natives.' }
                        ]
                    },
                    "Volga Bend": {
                        dominantPower: 'Mongol Invasion Route',
                        dominantPowerDescription: 'The Mongol storm approaches, soon to destroy the old Rus and impose the "Tatar Yoke."',
                        allegianceGroups: [
                            { name: 'Volga Bulgaria', type: 'primary', description: 'Muslim state about to be destroyed.' },
                            { name: 'Mongol Scouts', type: 'rebel', description: 'Harbingers of destruction.' },
                            { name: 'Rus Princes', type: 'secondary', description: 'Quarreling and unprepared.' }
                        ]
                    },
                    "Carpathian Ridge": {
                        dominantPower: 'Principality of Galicia–Volhynia',
                        dominantPowerDescription: 'A powerful Rus\' principality in the Carpathians, serving as a gateway to Central Europe and resisting Mongol dominance.',
                        allegianceGroups: [
                            { name: 'Rurikid Princes', type: 'primary', description: 'The rulers of the "Kingdom of Rus".' },
                            { name: 'Golden Horde', type: 'secondary', description: 'The Mongol overlords demanding tribute.' },
                            { name: 'Kingdom of Poland', type: 'secondary', description: 'A Catholic neighbor with ambitions on the principality.' }
                        ]
                    }
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Tsardom of Muscovy',
                dominantPowerDescription: 'Moscow throws off the Tatar Yoke and proclaims itself the Third Rome, expanding relentlessly in all directions.',
                eraContextSentence: 'an age of autocracy and expansion, where Russia emerges as a Eurasian empire.',
                allegianceGroups: [
                    { name: 'Tsardom of Russia', type: 'primary', description: 'The autocratic Muscovite state.' },
                    { name: 'Polish-Lithuanian Commonwealth', type: 'secondary', description: 'The western rival controlling former Rus lands.' },
                    { name: 'Ottoman Empire', type: 'secondary', description: 'The southern threat via Crimean vassals.' },
                    { name: 'Cossacks', type: 'rebel', description: 'Free warriors of the frontier.' }
                ],
                structureNames: {
                    fortress: ['Kremlin', 'Ostrog', 'Frontier Fort', 'Streltsy Barracks', 'Stone Citadel'],
                    mill: ['Water Mill', 'Windmill', 'Monastery Mill'],
                    holy_site: ['Kremlin Cathedral', 'Monastery', 'Old Believer Chapel', 'Wonder-Working Icon'],
                    palace: ["Tsar's Palace", 'Boyar Terem', 'Voivode Residence', 'Oprichnina Headquarters'],
                    trading_post: ['Gostiny Dvor', 'River Port', 'Fur Market', 'Salt Works']
                },
                courtRoles: {
                    palace: ['Boyar Duma', 'Okolnichy', 'Dyak', 'Oprichnik', 'Streltsy Colonel'],
                    holy_site: ['Patriarch', 'Metropolitan', 'Archimandrite', 'Holy Fool']
                },
                mapAreaOverrides: {
                    "Moscow Basin": {
                        dominantPower: 'Third Rome',
                        dominantPowerDescription: 'Ivan the Terrible rules from the Kremlin, crushing boyar opposition and conquering Kazan and Astrakhan.',
                        allegianceGroups: [
                            { name: 'Ivan IV', type: 'primary', description: 'The first crowned Tsar of All Russia.' },
                            { name: 'Oprichnina', type: 'secondary', description: 'The Tsar\'s terror apparatus.' },
                            { name: 'Boyar Opposition', type: 'rebel', description: 'Ancient nobility resisting autocracy.' }
                        ]
                    },
                    "Steppe Borderlands": {
                        dominantPower: 'Wild Field',
                        dominantPowerDescription: 'The dangerous frontier where Cossacks, Tatars, and Russian settlers clash in endless raids.',
                        allegianceGroups: [
                            { name: 'Don Cossacks', type: 'primary', description: 'Free warrior communities.' },
                            { name: 'Crimean Khanate', type: 'rebel', description: 'Tatar raiders taking slaves.' },
                            { name: 'Muscovite Forts', type: 'secondary', description: 'The advancing Russian frontier.' }
                        ]
                    }
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Russian Empire',
                dominantPowerDescription: 'The empire reaches from Poland to the Pacific, but serfdom and autocracy struggle against demands for modernization.',
                eraContextSentence: 'an era of empire and revolution, where Russia\'s size masks its fragility.',
                allegianceGroups: [
                    { name: 'Romanov Dynasty', type: 'primary', description: 'The autocratic imperial family.' },
                    { name: 'British Empire', type: 'secondary', description: 'Rival in the Great Game for Central Asia.' },
                    { name: 'Ottoman Empire', type: 'secondary', description: 'The declining enemy to the south.' },
                    { name: 'Revolutionary Movements', type: 'rebel', description: 'Narodniki, anarchists, and Marxists.' }
                ],
                structureNames: {
                    fortress: ['Star Fortress', 'Naval Base', 'Cossack Stanitza', 'Border Fort'],
                    mill: ['Steam Mill', 'Sugar Refinery', 'Distillery'],
                    factory: ['Putilov Works', 'Textile Factory', 'Railway Workshop', 'Arms Factory'],
                    mining_colony: ['Siberian Gold Mine', 'Ural Iron Works', 'Donbas Coal Mine'],
                    trading_post: ['Railway Station', 'River Port', 'Merchant Arcade', 'Fair']
                },
                courtRoles: {
                    palace: ['Minister', 'General-Adjutant', 'Court Chamberlain', 'Secret Police Chief']
                },
                mapAreaOverrides: {
                    "Moscow Basin": {
                        dominantPower: 'Two Capitals',
                        dominantPowerDescription: 'While St. Petersburg serves as the imperial capital, Moscow remains Russia\'s heart.',
                        allegianceGroups: [
                            { name: 'Imperial Government', type: 'primary', description: 'The Tsar and bureaucracy.' },
                            { name: 'Moscow Merchants', type: 'trade_company', description: 'Old Believer industrialists.' },
                            { name: 'Student Revolutionaries', type: 'rebel', description: 'Radical youth plotting change.' }
                        ]
                    },
                    "Steppe Borderlands": {
                        dominantPower: 'New Russia',
                        dominantPowerDescription: 'The conquered steppe becomes Russia\'s grain basket, with new cities and millions of settlers.',
                        allegianceGroups: [
                            { name: 'Imperial Administration', type: 'primary', description: 'Governors of new provinces.' },
                            { name: 'German Colonists', type: 'secondary', description: 'Invited settlers farming the steppe.' },
                            { name: 'Displaced Nomads', type: 'rebel', description: 'Tatars and others losing their lands.' }
                        ]
                    }
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Soviet Union',
                dominantPowerDescription: 'From the ashes of revolution rises a communist superpower that will shape the 20th century before its dramatic collapse.',
                eraContextSentence: 'an era of utopian dreams and dystopian realities, where Soviet power rises and falls.',
                allegianceGroups: [
                    { name: 'Communist Party', type: 'primary', description: 'The vanguard party controlling everything.' },
                    { name: 'Warsaw Pact', type: 'secondary', description: 'The satellite states.' },
                    { name: 'United States/NATO', type: 'secondary', description: 'The capitalist enemy.' },
                    { name: 'Dissidents', type: 'rebel', description: 'Those daring to think differently.' }
                ],
                structureNames: {
                    fortress: ['Military District HQ', 'Strategic Rocket Base', 'KGB Headquarters'],
                    factory: ['Tractor Plant', 'Kombinat', 'Closed City', 'Tank Factory'],
                    trading_post: ['State Store', 'Intourist Hotel', 'Hard Currency Shop'],
                    mining_colony: ['Gulag', 'Oil Field', 'Closed Nuclear City']
                }
            },
            "1910s": {
                dominantPower: 'Revolutionary Russia',
                dominantPowerDescription: 'The Romanov dynasty collapses in war and revolution as Bolsheviks seize power promising peace, land, and bread.',
                eraContextSentence: 'the end of old Russia, where world war triggers the communist revolution.',
                allegianceGroups: [
                    { name: 'Provisional Government', type: 'primary', description: 'Liberal democrats failing to control chaos.' },
                    { name: 'Bolsheviks', type: 'rising', description: 'Lenin\'s party seizing power.' },
                    { name: 'White Armies', type: 'rebel', description: 'Anti-Bolshevik forces.' },
                    { name: 'Foreign Intervention', type: 'secondary', description: 'Allied forces supporting Whites.' }
                ]
            },
            "1930s": {
                dominantPower: 'Stalin\'s Soviet Union',
                dominantPowerDescription: 'Stalin transforms the USSR through brutal collectivization and industrialization while purging millions.',
                eraContextSentence: 'the decade of terror, where Soviet power is built on millions of corpses.',
                allegianceGroups: [
                    { name: 'Stalin\'s Regime', type: 'primary', description: 'The totalitarian party-state.' },
                    { name: 'NKVD', type: 'secondary', description: 'The terror apparatus.' },
                    { name: 'Kulaks', type: 'declining', description: 'Peasants resisting collectivization.' },
                    { name: 'Old Bolsheviks', type: 'declining', description: 'Revolutionary veterans being purged.' }
                ],
                mapAreaOverrides: {
                    "Steppe Borderlands": {
                        dominantPower: 'Ukrainian Famine',
                        dominantPowerDescription: 'The Holodomor kills millions as Stalin uses hunger as a weapon against Ukrainian nationalism.',
                        allegianceGroups: [
                            { name: 'Soviet State', type: 'primary', description: 'Extracting grain while peasants starve.' },
                            { name: 'Starving Peasants', type: 'rebel', description: 'Desperate attempts at resistance.' },
                            { name: 'Communist Activists', type: 'secondary', description: 'Urban brigades seizing food.' }
                        ]
                    }
                }
            },
            "1940s": {
                dominantPower: 'USSR at War',
                dominantPowerDescription: 'The Soviet Union endures then defeats the Nazi invasion at horrific cost, emerging as a superpower.',
                eraContextSentence: 'the Great Patriotic War, where Soviet citizens pay the ultimate price for victory.',
                allegianceGroups: [
                    { name: 'Soviet State', type: 'primary', description: 'Stalin\'s war machine.' },
                    { name: 'Red Army', type: 'secondary', description: 'From disaster to triumph.' },
                    { name: 'Partisan Movement', type: 'rebel', description: 'Guerrillas behind German lines.' },
                    { name: 'Allied Powers', type: 'secondary', description: 'The uneasy wartime alliance.' }
                ],
                mapAreaOverrides: {
                    "Moscow Basin": {
                        dominantPower: 'Battle for Moscow',
                        dominantPowerDescription: 'The Wehrmacht reaches Moscow\'s gates in 1941 before the Red Army\'s desperate defense saves the capital.',
                        allegianceGroups: [
                            { name: 'Soviet Defense', type: 'primary', description: 'Zhukov\'s armies holding the line.' },
                            { name: 'Wehrmacht', type: 'secondary', description: 'German forces freezing at the gates.' },
                            { name: 'Moscow Militia', type: 'secondary', description: 'Citizens digging trenches.' }
                        ]
                    },
                    "Volga Bend": {
                        dominantPower: 'Stalingrad',
                        dominantPowerDescription: 'The battle that breaks the Wehrmacht\'s back, fought house by house in the ruins.',
                        allegianceGroups: [
                            { name: '62nd Army', type: 'primary', description: 'Soviet defenders in the rubble.' },
                            { name: '6th Army', type: 'secondary', description: 'Germans trapped in the cauldron.' },
                            { name: 'Civilians', type: 'secondary', description: 'Those who couldn\'t evacuate.' }
                        ]
                    }
                }
            },
            "1960s": {
                dominantPower: 'Khrushchev\'s Thaw',
                dominantPowerDescription: 'The USSR enters the space age and experiences cultural liberalization before Brezhnev\'s stagnation begins.',
                eraContextSentence: 'from Sputnik to stagnation, as early optimism gives way to grey conformity.',
                allegianceGroups: [
                    { name: 'CPSU', type: 'primary', description: 'The Party allowing limited reforms.' },
                    { name: 'Young Poets', type: 'secondary', description: 'The Thaw generation testing limits.' },
                    { name: 'KGB', type: 'secondary', description: 'Still watching everyone.' },
                    { name: 'Dissidents', type: 'rebel', description: 'Samizdat publishers and refuseniks.' }
                ]
            },
            "1980s": {
                dominantPower: 'Perestroika and Collapse',
                dominantPowerDescription: 'Gorbachev\'s reforms spiral out of control as the Soviet empire crumbles from within.',
                eraContextSentence: 'the empire\'s end, where glasnost reveals the rot and perestroika cannot save the system.',
                allegianceGroups: [
                    { name: 'Gorbachev\'s Reformers', type: 'primary', description: 'Trying to save socialism.' },
                    { name: 'Democratic Opposition', type: 'rebel', description: 'Yeltsin and others wanting more.' },
                    { name: 'Communist Hardliners', type: 'secondary', description: 'The August coup plotters.' },
                    { name: 'National Movements', type: 'rebel', description: 'Baltics and others seeking independence.' }
                ]
            },
            "1990s": {
                dominantPower: 'Russian Federation',
                dominantPowerDescription: 'Post-Soviet Russia endures economic collapse, oligarch rule, and the trauma of lost empire.',
                eraContextSentence: 'the wild years, where gangster capitalism replaces communist certainty.',
                allegianceGroups: [
                    { name: 'Yeltsin\'s Government', type: 'primary', description: 'Weak state losing control.' },
                    { name: 'Oligarchs', type: 'trade_company', description: 'Those who stole the state\'s wealth.' },
                    { name: 'Communist Opposition', type: 'declining', description: 'Nostalgic for Soviet times.' },
                    { name: 'Chechen Separatists', type: 'rebel', description: 'Fighting for independence.' }
                ],
                mapAreaOverrides: {
                    "Moscow Basin": {
                        dominantPower: 'Oligarch Moscow',
                        dominantPowerDescription: 'The capital becomes a playground for the ultra-rich while pensioners beg in the metro.',
                        allegianceGroups: [
                            { name: 'Kremlin', type: 'primary', description: 'Yeltsin\'s erratic rule.' },
                            { name: 'New Russians', type: 'trade_company', description: 'Oligarchs and gangsters.' },
                            { name: 'Impoverished Masses', type: 'secondary', description: 'Those left behind.' }
                        ]
                    }
                }
            }
        },
        "Central Europe": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Germanic Tribes',
                dominantPowerDescription: 'Free Germanic tribes dwelling in dark forests beyond the Rhine frontier, fiercely resisting Roman expansion.',
                eraContextSentence: 'the unconquered lands where Germanic warriors defend their sacred groves against Roman legions.',
                allegianceGroups: [
                    { name: 'Cherusci Confederation', type: 'primary', description: 'Arminius\'s alliance that destroyed three legions.' },
                    { name: 'Marcomanni Kingdom', type: 'secondary', description: 'Powerful kingdom under King Maroboduus.' },
                    { name: 'Roman Client Tribes', type: 'secondary', description: 'Germanic peoples allied with Rome.' },
                    { name: 'Suebi Tribes', type: 'secondary', description: 'Fierce warriors of the eastern forests.' }
                ],
                structureNames: {
                    fortress: ['Hill Fort', 'Tribal Stronghold', 'Forest Refuge', 'River Fort'],
                    holy_site: ['Sacred Grove', 'Wotan\'s Oak', 'Spring Shrine', 'Burial Mound'],
                    palace: ['Chieftain\'s Hall', 'King\'s Compound', 'Tribal Assembly Ground']
                },
                courtRoles: {
                    palace: ['War Chief', 'Shield Bearer', 'Skald', 'Tribal Elder', 'Seer']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Holy Roman Empire',
                dominantPowerDescription: 'The complex patchwork of the Holy Roman Empire, where hundreds of princes, bishops, and free cities vie for power under an elected Emperor.',
                eraContextSentence: 'the age of imperial dignity, where German princes elect their Emperor while maintaining fierce independence.',
                allegianceGroups: [
                    { name: 'Imperial Authority', type: 'primary', description: 'The elected Emperor and his court.' },
                    { name: 'Electoral Princes', type: 'secondary', description: 'The seven electors who choose the Emperor.' },
                    { name: 'Free Imperial Cities', type: 'trade_company', description: 'Wealthy merchant republics.' },
                    { name: 'Teutonic Order', type: 'rising', description: 'Crusading knights expanding eastward.' }
                ],
                structureNames: {
                    fortress: ['Reichsburg', 'Bishop\'s Castle', 'Ordensburg', 'City Walls'],
                    mill: ['Water Mill', 'Monastery Mill', 'Guild Mill'],
                    holy_site: ['Cathedral', 'Abbey', 'Pilgrimage Church', 'Jewish Synagogue'],
                    palace: ['Imperial Palace', 'Elector\'s Residence', 'Bishop\'s Palace'],
                    trading_post: ['Hanseatic Kontor', 'Market Square', 'Guild Hall', 'Jewish Quarter']
                },
                courtRoles: {
                    palace: ['Imperial Chancellor', 'Arch-Marshal', 'Prince-Elector', 'Hofmeister', 'Imperial Judge']
                },
                mapAreaOverrides: {
                    "Bohemian Plateau": {
                        dominantPower: 'Kingdom of Bohemia',
                        dominantPowerDescription: 'A powerful Slavic kingdom within the Holy Roman Empire, with rich silver mines and a distinct identity.',
                        allegianceGroups: [
                            { name: 'Přemyslid Dynasty', type: 'primary', description: 'The ruling kings of Bohemia.' },
                            { name: 'Holy Roman Emperor', type: 'secondary', description: 'The nominal overlord, often a rival.' },
                            { name: 'German Colonists', type: 'secondary', description: 'Miners and merchants settling in the kingdom.' }
                        ]
                    },
                    "Vienna Basin": {
                        dominantPower: 'Duchy of Austria',
                        dominantPowerDescription: 'The Babenberg dukes guard the eastern frontier of the Empire from Vienna, a growing center of trade and culture.',
                        allegianceGroups: [
                            { name: 'House of Babenberg', type: 'primary', description: 'The ruling ducal family.' },
                            { name: 'Kingdom of Hungary', type: 'secondary', description: 'The powerful Magyar kingdom to the east.' },
                            { name: 'Crusader Armies', type: 'religious', description: 'Knights passing through Vienna on their way to the Holy Land.' }
                        ]
                    }
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Habsburg Dominions',
                dominantPowerDescription: 'The Habsburg dynasty controls vast territories, though the Reformation tears the Empire apart in religious wars.',
                eraContextSentence: 'the age of religious warfare, where Protestant princes defy the Catholic Emperor in the name of conscience.',
                allegianceGroups: [
                    { name: 'Habsburg Emperor', type: 'primary', description: 'Catholic champion defending the old order.' },
                    { name: 'Protestant Union', type: 'rising', description: 'Lutheran and Calvinist princes.' },
                    { name: 'Catholic League', type: 'secondary', description: 'Bavaria and other Catholic states.' },
                    { name: 'Kingdom of France', type: 'secondary', description: 'Catholic power backing Protestants against Habsburg dominance.' }
                ],
                structureNames: {
                    fortress: ['Star Fort', 'Baroque Citadel', 'Artillery Bastion'],
                    holy_site: ['Lutheran Church', 'Jesuit College', 'Reformed Church', 'Baroque Cathedral'],
                    palace: ['Baroque Palace', 'Residenz', 'Hunting Lodge'],
                    trading_post: ['Counting House', 'Fugger Bank', 'Postal Station']
                },
                mapAreaOverrides: {
                    "Danube Bend": {
                        dominantPower: 'Ottoman-Habsburg Frontier',
                        dominantPowerDescription: 'The strategic heart of Hungary, fiercely contested between the Habsburgs and the Ottoman Empire after the Battle of Mohács.',
                        allegianceGroups: [
                            { name: 'Ottoman Empire', type: 'primary', description: 'The Turkish forces occupying Buda.' },
                            { name: 'Habsburg Monarchy', type: 'secondary', description: 'The Austrian power holding the northern and western parts.' },
                            { name: 'Hungarian Magnates', type: 'secondary', description: 'Nobles playing both sides to preserve their estates.' }
                        ]
                    },
                    "Tatra Mountains": {
                        dominantPower: 'Polish-Hungarian Borderlands',
                        dominantPowerDescription: 'A remote but strategic mountain region marking the border between two powerful kingdoms, inhabited by fiercely independent highlanders.',
                        allegianceGroups: [
                            { name: 'Kingdom of Poland', type: 'primary', description: 'The northern suzerain power.' },
                            { name: 'Kingdom of Hungary', type: 'secondary', description: 'The southern suzerain power.' },
                            { name: 'Highlander Clans', type: 'rebel', description: 'Semi-independent mountain peoples and bandits.' }
                        ]
                    }
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'German Empire',
                dominantPowerDescription: 'Bismarck\'s Prussia unifies Germany through "blood and iron," creating a new industrial and military powerhouse.',
                eraContextSentence: 'the age of unification, where Prussian militarism forges a new empire that challenges British hegemony.',
                allegianceGroups: [
                    { name: 'German Empire', type: 'primary', description: 'The Kaiserreich under Prussian leadership.' },
                    { name: 'Austria-Hungary', type: 'secondary', description: 'Former rival, now ally in the Dual Alliance.' },
                    { name: 'Social Democrats', type: 'rising', description: 'Growing workers\' movement.' },
                    { name: 'Catholic Center Party', type: 'secondary', description: 'Defending Church interests against Kulturkampf.' }
                ],
                structureNames: {
                    fortress: ['Prussian Barracks', 'Fortress Ring', 'Naval Base'],
                    factory: ['Krupp Steelworks', 'Chemical Plant', 'Locomotive Works', 'Electrical Factory'],
                    mining_colony: ['Ruhr Coal Mine', 'Iron Mine', 'Potash Mine'],
                    trading_post: ['Railway Station', 'Stock Exchange', 'Department Store']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Federal Republic of Germany',
                dominantPowerDescription: 'From Nazi catastrophe through division to reunification, Germany transforms into Europe\'s economic engine and democratic anchor.',
                eraContextSentence: 'the phoenix from ashes, where Germany overcomes its dark past to lead European integration.',
                allegianceGroups: [
                    { name: 'Federal Republic', type: 'primary', description: 'Democratic West Germany, later reunified.' },
                    { name: 'NATO Alliance', type: 'rising', description: 'Western military alliance.' },
                    { name: 'European Union', type: 'rising', description: 'Economic and political union Germany helps lead.' },
                    { name: 'East Germany (until 1990)', type: 'secondary', description: 'Communist state before reunification.' }
                ],
                structureNames: {
                    fortress: ['NATO Base', 'Bundeswehr Kaserne', 'Border Checkpoint (historical)'],
                    factory: ['Auto Plant', 'Chemical Works', 'High-Tech Factory', 'Wind Turbine Plant'],
                    trading_post: ['Frankfurt Airport', 'Container Port', 'ICE Station', 'Tech Hub']
                }
            }
        },
        "Low Countries": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Batavian Confederation',
                dominantPowerDescription: 'Germanic tribes in the Rhine delta serve as auxiliary troops for Rome while maintaining semi-independence.',
                eraContextSentence: 'the watery frontier where Batavian horsemen patrol Roman borders along endless rivers and marshes.',
                allegianceGroups: [
                    { name: 'Batavian Allies', type: 'primary', description: 'Elite cavalry serving Rome.' },
                    { name: 'Roman Gaul', type: 'secondary', description: 'The provincial administration.' },
                    { name: 'Frisian Tribes', type: 'secondary', description: 'Coastal peoples beyond the frontier.' },
                    { name: 'Frankish Raiders', type: 'rebel', description: 'Germanic warriors crossing the Rhine.' }
                ],
                structureNames: {
                    fortress: ['River Fort', 'Roman Castellum', 'Tribal Stronghold'],
                    holy_site: ['Romano-Germanic Temple', 'Sacred Spring', 'Matronae Shrine'],
                    palace: ['Tribal King\'s Hall', 'Roman Villa', 'Prefect\'s Residence']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Burgundian Netherlands',
                dominantPowerDescription: 'The wealthy cloth-producing cities of Flanders and Holland thrive under Burgundian rule, becoming Europe\'s commercial heart.',
                eraContextSentence: 'the golden age of merchant princes, where Flemish cloth and Dutch ships dominate European trade.',
                allegianceGroups: [
                    { name: 'Duchy of Burgundy', type: 'primary', description: 'The ambitious dukes rivaling kings.' },
                    { name: 'Flemish Cities', type: 'trade_company', description: 'Wealthy cloth-producing communes.' },
                    { name: 'Hanseatic League', type: 'trade_company', description: 'German merchant confederation.' },
                    { name: 'Kingdom of France', type: 'secondary', description: 'Nominal overlord seeking real control.' }
                ],
                structureNames: {
                    fortress: ['City Walls', 'Ducal Castle', 'Guild Tower', 'Water Castle'],
                    mill: ['Fulling Mill', 'Tide Mill', 'Windmill', 'Paper Mill'],
                    holy_site: ['Gothic Cathedral', 'Beguinage', 'Abbey', 'Cloth Hall Chapel'],
                    palace: ['Ducal Palace', 'Patrician Mansion', 'Guild Hall', 'Town Hall'],
                    trading_post: ['Cloth Hall', 'Bourse', 'Weigh House', 'Hanseatic Kontor']
                },
                courtRoles: {
                    palace: ['Chancellor of Burgundy', 'Captain-General', 'Receiver-General', 'Grand Bailiff']
                },
                mapAreaOverrides: {
                    "Flanders Fields": {
                        dominantPower: 'County of Flanders',
                        dominantPowerDescription: 'One of the wealthiest regions in Europe due to its powerful cloth towns like Bruges, Ghent, and Ypres, which frequently challenge the authority of their French overlords.',
                        allegianceGroups: [
                            { name: 'Flemish Communes', type: 'primary', description: 'The powerful, semi-independent cloth-producing cities.' },
                            { name: 'Count of Flanders', type: 'secondary', description: 'The nominal ruler, often caught between his cities and the French king.' },
                            { name: 'Kingdom of France', type: 'secondary', description: 'The feudal overlord seeking to control the region\'s wealth.' }
                        ]
                    },
                    "Scheldt Basin": {
                        dominantPower: 'Duchy of Brabant',
                        dominantPowerDescription: 'A rising power in the Low Countries, with its port of Antwerp beginning to challenge Bruges as the primary hub for international trade.',
                        allegianceGroups: [
                            { name: 'Duke of Brabant', type: 'primary', description: 'Ruler of a prosperous and strategic duchy.' },
                            { name: 'City of Antwerp', type: 'trade_company', description: 'A rising port city attracting English and Italian merchants.' },
                            { name: 'Prince-Bishopric of Liège', type: 'religious', description: 'A powerful and independent ecclesiastical neighbor.' }
                        ]
                    }
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Spanish Netherlands / Dutch Republic',
                dominantPowerDescription: 'The Dutch Revolt splits the region between Spanish-controlled south and the independent Dutch Republic, creating Europe\'s first modern republic.',
                eraContextSentence: 'the age of revolt and golden prosperity, where Dutch merchants challenge Spanish might.',
                allegianceGroups: [
                    { name: 'Dutch Republic', type: 'primary', description: 'The United Provinces winning independence.' },
                    { name: 'Spanish Crown', type: 'declining', description: 'Habsburg rulers of the southern provinces.' },
                    { name: 'Dutch East India Company', type: 'trade_company', description: 'The world\'s first megacorporation.' },
                    { name: 'House of Orange', type: 'rising', description: 'Stadholders leading the revolt.' }
                ],
                structureNames: {
                    fortress: ['Star Fort', 'Sea Fort', 'Spanish Citadel', 'Dutch Water Line'],
                    mill: ['Polder Mill', 'Sawmill', 'Paper Mill', 'Oil Mill'],
                    holy_site: ['Reformed Church', 'Catholic Church', 'Jewish Synagogue', 'Mennonite Meeting House'],
                    palace: ['Stadholder\'s Palace', 'Burgher Mansion', 'Town Hall', 'Exchange'],
                    trading_post: ['VOC Warehouse', 'Stock Exchange', 'Weigh House', 'Fish Market']
                },
                mapAreaOverrides: {
                    "Rhine–Meuse Delta": {
                        dominantPower: 'Dutch Sea Beggars',
                        dominantPowerDescription: 'The complex river delta becomes a stronghold for Dutch rebels fighting against Spain, using their knowledge of the waterways to raid and capture key towns.',
                        allegianceGroups: [
                            { name: 'Sea Beggars', type: 'primary', description: 'Calvinist privateers and rebels fighting for Dutch independence.' },
                            { name: 'Spanish Tercios', type: 'secondary', description: 'The elite Spanish army trying to suppress the revolt.' },
                            { name: 'House of Orange', type: 'secondary', description: 'The noble leaders of the Dutch Revolt.' }
                        ]
                    }
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Kingdom of the Netherlands / Kingdom of Belgium',
                dominantPowerDescription: 'After brief unity, the Netherlands and Belgium separate, with Belgium industrializing rapidly while the Netherlands focuses on trade and colonies.',
                eraContextSentence: 'the age of coal and colonies, where small nations punch above their weight through industry and empire.',
                allegianceGroups: [
                    { name: 'Kingdom of the Netherlands', type: 'primary', description: 'Constitutional monarchy with vast colonies.' },
                    { name: 'Kingdom of Belgium', type: 'secondary', description: 'New industrial power with African ambitions.' },
                    { name: 'Liberal Parties', type: 'secondary', description: 'Advocating free trade and reform.' },
                    { name: 'Catholic Parties', type: 'secondary', description: 'Defending traditional values.' }
                ],
                structureNames: {
                    fortress: ['Fortress Holland', 'Belgian Fort', 'Colonial Barracks'],
                    factory: ['Textile Mill', 'Steel Plant', 'Diamond Workshop', 'Philips Factory'],
                    mining_colony: ['Limburg Coal Mine', 'Walloon Iron Mine', 'Congo Rubber Plantation'],
                    trading_post: ['Railway Station', 'Port Terminal', 'Colonial Office', 'Diamond Exchange']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Benelux Union',
                dominantPowerDescription: 'The Netherlands, Belgium, and Luxembourg pioneer European integration while adapting to post-colonial realities.',
                eraContextSentence: 'the laboratory of Europe, where former empires become models of cooperation and prosperity.',
                allegianceGroups: [
                    { name: 'Kingdom of the Netherlands', type: 'primary', description: 'Liberal democracy and EU founding member.' },
                    { name: 'Kingdom of Belgium', type: 'secondary', description: 'EU capital navigating linguistic division.' },
                    { name: 'European Union', type: 'secondary', description: 'The supranational project centered in Brussels.' },
                    { name: 'NATO', type: 'secondary', description: 'Transatlantic security alliance.' }
                ],
                structureNames: {
                    fortress: ['NATO Headquarters', 'EU Quarter', 'Peace Palace'],
                    factory: ['ASML Chip Plant', 'Port Refinery', 'Chemical Complex', 'Biotech Lab'],
                    trading_post: ['Rotterdam Port', 'Schiphol Airport', 'Antwerp Diamond District', 'EU Institutions']
                },
                mapAreaOverrides: {
                    "Ardennes Forest": {
                        dominantPower: 'Battle of the Bulge',
                        dominantPowerDescription: 'The dense forest becomes the site of the last major German offensive on the Western Front during World War II, a desperate gamble that ultimately failed.',
                        allegianceGroups: [
                            { name: 'Allied Forces', type: 'primary', description: 'American and British troops who endured the surprise attack.' },
                            { name: 'German Wehrmacht', type: 'secondary', description: 'The attacking German panzer divisions.' },
                            { name: 'Belgian Resistance', type: 'rebel', description: 'Local fighters aiding the Allied forces.' }
                        ]
                    }
                }
            }
        },
        "Greece and Aegean": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Hellenistic Kingdoms',
                dominantPowerDescription: 'After Alexander, Greek culture spreads across the Mediterranean under various successor kingdoms before Roman conquest.',
                eraContextSentence: 'the twilight of Greek independence, where philosophy flourishes even as Roman power grows.',
                allegianceGroups: [
                    { name: 'Macedonian Kingdom', type: 'primary', description: 'Descendants of Alexander ruling northern Greece.' },
                    { name: 'Achaean League', type: 'secondary', description: 'Federation of Greek city-states.' },
                    { name: 'Rhodes', type: 'trade_company', description: 'Maritime republic controlling sea trade.' },
                    { name: 'Roman Republic', type: 'secondary', description: 'The rising power from the west.' }
                ],
                structureNames: {
                    fortress: ['Acropolis', 'Macedonian Fort', 'Island Fortress', 'City Walls'],
                    mill: ['Water Mill', 'Olive Press', 'Grain Mill'],
                    holy_site: ['Parthenon', 'Oracle at Delphi', 'Mystery Temple', 'Healing Sanctuary'],
                    palace: ['Royal Palace', 'Tyrant\'s Residence', 'Prytaneion', 'Gymnasiarch\'s Complex'],
                    trading_post: ['Agora', 'Emporion', 'Harbor Market', 'Banking House']
                },
                courtRoles: {
                    palace: ['Strategos', 'Royal Secretary', 'Symposiarch', 'Chief Priest', 'Harbor Master']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Byzantine Empire',
                dominantPowerDescription: 'Greece forms the heartland of the Byzantine Empire, preserving Greek learning and Orthodox Christianity.',
                eraContextSentence: 'the age of Byzantine glory, where Greek fire protects Constantinople and monks preserve ancient wisdom.',
                allegianceGroups: [
                    { name: 'Byzantine Empire', type: 'primary', description: 'The Eastern Roman Empire, Greek in character.' },
                    { name: 'Theme Commanders', type: 'secondary', description: 'Military governors of provinces.' },
                    { name: 'Venetian Traders', type: 'trade_company', description: 'Italian merchants with special privileges.' },
                    { name: 'Slavic Tribes', type: 'rebel', description: 'Settlers in the mainland.' }
                ],
                structureNames: {
                    fortress: ['Theme Fortress', 'Coastal Castle', 'Mountain Kastro', 'City Walls'],
                    holy_site: ['Orthodox Monastery', 'Byzantine Church', 'Icon Workshop', 'Pilgrimage Site'],
                    palace: ['Governor\'s Palace', 'Theme Headquarters', 'Bishop\'s Residence'],
                    trading_post: ['Venetian Quarter', 'Silk Workshop', 'Harbor Warehouse']
                },
                mapAreaOverrides: {
                    "Athens Basin": {
                        dominantPower: 'Duchy of Athens',
                        dominantPowerDescription: 'Following the Fourth Crusade, Athens is ruled by French and Catalan crusader dukes, a strange feudal court set amongst ancient ruins.',
                        allegianceGroups: [
                            { name: 'Frankish Dukes', type: 'primary', description: 'The Western European crusader nobility.' },
                            { name: 'Catalan Company', type: 'mercenary', description: 'A powerful mercenary army that later seized the duchy.' },
                            { name: 'Greek Orthodox Population', type: 'secondary', description: 'The local subjects under Catholic rule.' }
                        ]
                    },
                    "Peloponnesian Hills": {
                        dominantPower: 'Despotate of the Morea',
                        dominantPowerDescription: 'A Byzantine province centered at Mystras, experiencing a last flourishing of Greek culture and art before the Ottoman conquest.',
                        allegianceGroups: [
                            { name: 'Byzantine Despots', type: 'primary', description: 'Relatives of the Emperor in Constantinople.' },
                            { name: 'Venetian Ports', type: 'trade_company', description: 'Venice holds key coastal fortresses like Modon and Coron.' },
                            { name: 'Ottoman Raiders', type: 'rebel', description: 'Turkish forces raiding deeper into the peninsula.' }
                        ]
                    },
                    "Sicily": {
                        dominantPower: 'Kingdom of Sicily (Norman)',
                        dominantPowerDescription: 'Under Norman rule, Sicily becomes a brilliant multicultural kingdom blending Greek, Arab, and Latin traditions, with Roger II creating one of the most sophisticated courts in Europe.',
                        allegianceGroups: [
                            { name: 'Norman Kingdom', type: 'primary', description: 'Viking-descended rulers creating a unique Mediterranean kingdom.' },
                            { name: 'Greek Population', type: 'secondary', description: 'Greek-speaking communities, especially in the east.' },
                            { name: 'Arab-Sicilian Muslims', type: 'secondary', description: 'Muslim population with advanced science and arts.' },
                            { name: 'Latin Church', type: 'religious', description: 'Catholic hierarchy coexisting with Greek Orthodox and Muslim communities.' }
                        ]
                    },
                    "Cyprus": {
                        dominantPower: 'Kingdom of Cyprus (Lusignan)',
                        dominantPowerDescription: 'The Lusignan dynasty, French crusader kings, rules Cyprus as the last significant crusader state after the fall of Acre, combining Western feudalism with Greek and Oriental traditions.',
                        allegianceGroups: [
                            { name: 'Lusignan Dynasty', type: 'primary', description: 'French Catholic kings ruling from Nicosia and Famagusta.' },
                            { name: 'Knights Templar / Hospitaller', type: 'mercenary', description: 'Military orders with strong presence on the island.' },
                            { name: 'Greek Orthodox Population', type: 'secondary', description: 'The majority, governed by Catholic overlords.' },
                            { name: 'Venetian Merchants', type: 'trade_company', description: 'Italian traders with major commercial interests.' },
                            { name: 'Mamluk Sultanate', type: 'rebel', description: 'Egyptian power raiding and demanding tribute.' }
                        ]
                    }
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Ottoman Empire',
                dominantPowerDescription: 'Greece falls under Ottoman rule, with local Christian communities maintaining their identity through the Orthodox Church.',
                eraContextSentence: 'the age of the Turkish yoke, where Greeks preserve their culture in churches and secret schools.',
                allegianceGroups: [
                    { name: 'Ottoman Empire', type: 'primary', description: 'The ruling Muslim empire.' },
                    { name: 'Phanariot Greeks', type: 'secondary', description: 'Greek elite serving the Sultan.' },
                    { name: 'Orthodox Church', type: 'secondary', description: 'Preserving Greek identity.' },
                    { name: 'Klephts', type: 'rebel', description: 'Mountain bandits and freedom fighters.' }
                ],
                structureNames: {
                    fortress: ['Ottoman Fort', 'Venetian Castle', 'Mountain Hideout'],
                    holy_site: ['Orthodox Monastery', 'Hidden Church', 'Mosque', 'Dervish Lodge'],
                    palace: ['Pasha\'s Palace', 'Bey\'s Mansion', 'Archbishop\'s Residence'],
                    trading_post: ['Bazaar', 'Caravanserai', 'Venetian Factory', 'Jewish Quarter']
                },
                mapAreaOverrides: {
                    "Crete": {
                        dominantPower: 'Kingdom of Candia (Venice)',
                        dominantPowerDescription: 'As Venice\'s most important overseas colony, Crete is a bastion of the Renaissance in the Greek world, fiercely defended against the Ottomans.',
                        allegianceGroups: [
                            { name: 'Venetian Republic', type: 'primary', description: 'The colonial administration ruling the island.' },
                            { name: 'Cretan Nobles', type: 'secondary', description: 'The local Greek aristocracy, often rebelling against Venetian rule.' },
                            { name: 'Ottoman Empire', type: 'secondary', description: 'The encroaching power seeking to conquer the island.' }
                        ]
                    },
                    "Thessalian Plain": {
                        dominantPower: 'Ottoman Timariots',
                        dominantPowerDescription: 'The fertile plain is granted by the Sultan to Sipahi cavalrymen (Timariots) in exchange for military service, forming the backbone of Ottoman rural administration.',
                        allegianceGroups: [
                            { name: 'Ottoman Sipahis', type: 'primary', description: 'The Turkish feudal cavalry class.' },
                            { name: 'Greek Peasantry', type: 'secondary', description: 'The Christian population working the land.' },
                            { name: 'Monasteries of Meteora', type: 'religious', description: 'Orthodox monasteries perched on rock pillars, preserving faith and learning.' }
                        ]
                    },
                    "Sicily": {
                        dominantPower: 'Spanish Viceroyalty',
                        dominantPowerDescription: 'After the Norman-Hohenstaufen golden age, Sicily falls under Spanish rule as a viceroyalty, combining Spanish administration with local Sicilian aristocracy and a mixed Greek-Arab-Norman cultural heritage.',
                        allegianceGroups: [
                            { name: 'Spanish Viceroy', type: 'primary', description: 'Spanish Habsburg administration governing from Palermo.' },
                            { name: 'Sicilian Nobility', type: 'secondary', description: 'Local barons and landowners, often of Norman descent.' },
                            { name: 'Sicilian Commons', type: 'secondary', description: 'Greek, Arab, and Italian-speaking population.' },
                            { name: 'Barbary Pirates', type: 'rebel', description: 'North African corsairs raiding coastal towns.' }
                        ]
                    },
                    "Cyprus": {
                        dominantPower: 'Republic of Venice',
                        dominantPowerDescription: 'Cyprus is Venice\'s easternmost major possession, a crucial staging point for trade with the Levant, but increasingly threatened by Ottoman expansion.',
                        allegianceGroups: [
                            { name: 'Venetian Colonial Government', type: 'primary', description: 'Venetian administrators and military garrison.' },
                            { name: 'Greek Orthodox Population', type: 'secondary', description: 'The majority of the island, under Venetian and Lusignan rule.' },
                            { name: 'Ottoman Empire', type: 'secondary', description: 'The growing threat from the east (will conquer in 1571).' },
                            { name: 'Cypriot Nobility', type: 'secondary', description: 'Remnants of the Lusignan dynasty and Greek landowners.' }
                        ]
                    }
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Kingdom of Greece',
                dominantPowerDescription: 'Independent Greece struggles to reclaim Byzantine glory while modernizing under foreign dynasties.',
                eraContextSentence: 'the age of the Great Idea, where Greeks dream of reclaiming Constantinople and Asia Minor.',
                allegianceGroups: [
                    { name: 'Kingdom of Greece', type: 'primary', description: 'The new nation under Bavarian then Danish kings.' },
                    { name: 'Great Powers', type: 'secondary', description: 'Britain, France, and Russia as protectors.' },
                    { name: 'Cretan Rebels', type: 'rebel', description: 'Greeks under Ottoman rule seeking union.' },
                    { name: 'Ottoman Empire', type: 'secondary', description: 'The traditional enemy still holding Greek lands.' }
                ],
                structureNames: {
                    fortress: ['Royal Fort', 'Naval Base', 'Border Fort'],
                    mill: ['Olive Oil Factory', 'Flour Mill', 'Textile Mill'],
                    trading_post: ['Piraeus Port', 'Railway Station', 'Steamship Office'],
                    palace: ['Royal Palace', 'Parliament', 'Governor\'s Mansion']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Hellenic Republic',
                dominantPowerDescription: 'Modern Greece navigates between East and West, from civil war through dictatorship to EU membership.',
                eraContextSentence: 'the return to democracy, where Greece reclaims its democratic heritage in the European family.',
                allegianceGroups: [
                    { name: 'Hellenic Republic', type: 'primary', description: 'Parliamentary democracy, EU member since 1981.' },
                    { name: 'NATO', type: 'secondary', description: 'Western military alliance.' },
                    { name: 'European Union', type: 'secondary', description: 'Economic and political union.' },
                    { name: 'Cyprus Question', type: 'secondary', description: 'The divided island remains contentious.' }
                ],
                structureNames: {
                    fortress: ['NATO Base', 'Naval Station', 'Air Force Base'],
                    factory: ['Shipyard', 'Cement Factory', 'Food Processing Plant'],
                    trading_post: ['Ferry Terminal', 'Athens Airport', 'Container Port', 'Tourist Resort'],
                    holy_site: ['Orthodox Cathedral', 'Monastery', 'Archaeological Site']
                }
            }
        },
        "Ural and Arctic Europe": {
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Scythian Nomads',
                dominantPowerDescription: 'Horse nomads roam the steppes bordering the Urals, trading and raiding settled peoples to the south.',
                eraContextSentence: 'the endless grasslands where mounted warriors follow their herds and ancient trade routes.',
                allegianceGroups: [
                    { name: 'Scythian Confederation', type: 'primary', description: 'Nomadic horse warriors controlling the steppes.' },
                    { name: 'Sarmatian Tribes', type: 'secondary', description: 'Related nomadic peoples.' },
                    { name: 'Forest Tribes', type: 'secondary', description: 'Hunter-gatherers in the northern forests.' },
                    { name: 'Greek Colonies', type: 'trade_company', description: 'Trading posts on the Black Sea.' }
                ],
                structureNames: {
                    fortress: ['Kurgan', 'Nomad Camp', 'Hill Fort', 'Forest Stockade'],
                    holy_site: ['Sky Burial Ground', 'Sacred Grove', 'Shaman Circle', 'Stone Idol'],
                    palace: ['Khan\'s Yurt', 'Chieftain\'s Camp', 'Winter Settlement']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Volga Bulgaria',
                dominantPowerDescription: 'Muslim Bulgar kingdom controls Volga trade routes, connecting Scandinavia with the Islamic world.',
                eraContextSentence: 'the northern silk road, where Viking silver meets Islamic gold in Bulgar markets.',
                allegianceGroups: [
                    { name: 'Volga Bulgaria', type: 'primary', description: 'Muslim trading kingdom.' },
                    { name: 'Khazar Khaganate', type: 'secondary', description: 'Jewish-ruled steppe empire.' },
                    { name: 'Rus Principalities', type: 'secondary', description: 'Slavic states expanding eastward.' },
                    { name: 'Finno-Ugric Tribes', type: 'secondary', description: 'Indigenous forest peoples.' }
                ],
                structureNames: {
                    fortress: ['Bulgar Fort', 'Trading Post Stockade', 'River Fortress'],
                    holy_site: ['Mosque', 'Pagan Shrine', 'Orthodox Chapel', 'Jewish Synagogue'],
                    palace: ['Khan\'s Palace', 'Merchant Prince Mansion', 'Emir\'s Court'],
                    trading_post: ['Fur Market', 'Slave Market', 'Silver Exchange', 'Caravan Station']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Tsardom of Russia',
                dominantPowerDescription: 'Ivan the Terrible and successors conquer the Volga and push into Siberia, opening vast new lands.',
                eraContextSentence: 'the conquest of the east, where Cossacks and fur traders claim an empire larger than Europe.',
                allegianceGroups: [
                    { name: 'Tsardom of Russia', type: 'primary', description: 'Expanding Muscovite state.' },
                    { name: 'Cossack Hosts', type: 'mercenary', description: 'Frontier warriors serving the Tsar.' },
                    { name: 'Tatar Khanates', type: 'rebel', description: 'Remnants of the Golden Horde.' },
                    { name: 'Siberian Natives', type: 'secondary', description: 'Indigenous peoples paying fur tribute.' }
                ],
                structureNames: {
                    fortress: ['Kremlin', 'Ostrog', 'Cossack Fortress', 'Frontier Fort'],
                    holy_site: ['Orthodox Monastery', 'Old Believer Chapel', 'Mosque', 'Shaman Sacred Site'],
                    palace: ['Governor\'s Palace', 'Boyar Estate', 'Cossack Ataman House'],
                    trading_post: ['Fur Trading Post', 'Salt Works', 'Iron Works', 'Fair Ground']
                },
                mapAreaOverrides: {
                    "Ural Mountains": {
                        dominantPower: 'Stroganov Mercantile Empire',
                        dominantPowerDescription: 'The wealthy Stroganov merchant family is granted vast lands in the Urals by the Tsar to colonize, mine for salt and iron, and push into Siberia.',
                        allegianceGroups: [
                            { name: 'Stroganov Merchants', type: 'primary', description: 'The colonizing merchant-barons.' },
                            { name: 'Cossack Mercenaries', type: 'mercenary', description: 'Hired by the Stroganovs to conquer the Khanate of Sibir.' },
                            { name: 'Siberian Khanate', type: 'rebel', description: 'The Tatar state resisting Russian expansion.' }
                        ]
                    },
                    "White Sea Coast": {
                        dominantPower: 'Muscovy Company',
                        dominantPowerDescription: 'The English Muscovy Company establishes a trading post at Arkhangelsk, giving Russia its first major seaport and a direct trade link to Western Europe.',
                        allegianceGroups: [
                            { name: 'English Merchants', type: 'primary', description: 'Traders of the Muscovy Company.' },
                            { name: 'Tsarist Governors', type: 'secondary', description: 'Officials of Ivan the Terrible overseeing the trade.' },
                            { name: 'Pomors', type: 'secondary', description: 'Local Russian settlers and sea-traders.' }
                        ]
                    }
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Russian Empire',
                dominantPowerDescription: 'The Urals become Russia\'s industrial heartland, with factories and mines feeding imperial ambitions.',
                eraContextSentence: 'the empire\'s forge, where serf labor extracts the metals that arm the Tsar\'s armies.',
                allegianceGroups: [
                    { name: 'Russian Empire', type: 'primary', description: 'The autocratic tsarist state.' },
                    { name: 'Ural Factory Owners', type: 'trade_company', description: 'Industrial magnates.' },
                    { name: 'Old Believers', type: 'secondary', description: 'Religious dissidents in remote areas.' },
                    { name: 'Worker Movements', type: 'rising', description: 'Early revolutionaries in factories.' }
                ],
                structureNames: {
                    fortress: ['Imperial Fort', 'Cossack Barracks', 'Prison Camp'],
                    factory: ['Iron Works', 'Copper Smelter', 'Arms Factory', 'Railroad Works'],
                    mining_colony: ['Iron Mine', 'Copper Mine', 'Gold Mine', 'Platinum Mine'],
                    trading_post: ['Railway Station', 'Company Store', 'Fur Trading Post']
                }
            },
            [MODERN_ERA]: {
                dominantPower: 'Russian Federation',
                dominantPowerDescription: 'From Soviet industrialization through gulag system to modern resource extraction feeding global markets.',
                eraContextSentence: 'the resource frontier, where oil and metals from ancient lands fuel modern ambitions.',
                allegianceGroups: [
                    { name: 'Russian Federation', type: 'primary', description: 'Post-Soviet state controlling vast resources.' },
                    { name: 'Resource Oligarchs', type: 'trade_company', description: 'Billionaires controlling extraction.' },
                    { name: 'Indigenous Peoples', type: 'declining', description: 'Native groups seeking rights.' },
                    { name: 'Environmental Activists', type: 'rebel', description: 'Opposing ecological destruction.' }
                ],
                structureNames: {
                    fortress: ['Military Base', 'Strategic Missile Base', 'Arctic Base'],
                    factory: ['Metallurgical Combine', 'Chemical Plant', 'Nuclear Facility'],
                    mining_colony: ['Oil Field', 'Gas Field', 'Nickel Mine', 'Diamond Mine'],
                    trading_post: ['Pipeline Terminal', 'Railway Junction', 'Arctic Port']
                }
            }
        },

        "Iceland": {
            [HistoricalEra.PREHISTORY]: {
                dominantPower: 'Uninhabited Island',
                dominantPowerDescription: 'Volcanic island untouched by humans, shaped by fire and ice.',
                eraContextSentence: 'the land of fire and ice, where volcanoes meet glaciers in primordial silence.',
                allegianceGroups: [],
                structureNames: {
                    holy_site: ['Geyser', 'Volcanic Crater', 'Glacier']
                }
            },
            [HistoricalEra.ANTIQUITY]: {
                dominantPower: 'Irish Monks',
                dominantPowerDescription: 'Irish hermit monks seeking solitude in the North Atlantic.',
                eraContextSentence: 'the age of the Papar, where Irish monks pray in volcanic wilderness.',
                allegianceGroups: [
                    { name: 'Irish Papar', type: 'primary', description: 'Hermit monks from Ireland.' }
                ],
                structureNames: {
                    holy_site: ['Hermit Cell', 'Stone Cross', 'Cave Chapel']
                }
            },
            [HistoricalEra.MEDIEVAL]: {
                dominantPower: 'Icelandic Commonwealth',
                dominantPowerDescription: 'Free state of Norse settlers with the world\'s oldest parliament.',
                eraContextSentence: 'the saga age, where the Althing governs free farmers and poets compose epic tales.',
                allegianceGroups: [
                    { name: 'Icelandic Commonwealth', type: 'primary', description: 'Association of chieftains.' },
                    { name: 'Norwegian Traders', type: 'trade_company', description: 'Merchants from the homeland.' },
                    { name: 'Sturlungar', type: 'secondary', description: 'Powerful family faction.' }
                ],
                structureNames: {
                    fortress: ['Chieftain Farmstead', 'Thing Site'],
                    holy_site: ['Stave Church', 'Pagan Temple', 'Bishop Seat'],
                    trading_post: ['Coastal Trading Post', 'Fish Market']
                },
                courtRoles: {
                    palace: ['Lawspeaker', 'Godi', 'Skald', 'Bishop']
                }
            },
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: {
                dominantPower: 'Danish Crown',
                dominantPowerDescription: 'Remote Danish possession suffering from volcanic eruptions and monopoly trade.',
                eraContextSentence: 'the dark centuries, where volcanic winter and Danish monopoly impoverish the island.',
                allegianceGroups: [
                    { name: 'Kingdom of Denmark', type: 'primary', description: 'Colonial overlord.' },
                    { name: 'Danish Merchants', type: 'trade_company', description: 'Monopoly traders.' },
                    { name: 'Icelandic Farmers', type: 'declining', description: 'Impoverished population.' }
                ],
                structureNames: {
                    trading_post: ['Danish Factory', 'Monopoly Warehouse'],
                    holy_site: ['Lutheran Church', 'Bishop Residence'],
                    fortress: ['Danish Fort', 'Governor House']
                }
            },
            [HistoricalEra.INDUSTRIAL_ERA]: {
                dominantPower: 'Danish Iceland',
                dominantPowerDescription: 'Growing independence movement as fishing industry modernizes.',
                eraContextSentence: 'the national awakening, where Icelandic identity reasserts through literature and politics.',
                allegianceGroups: [
                    { name: 'Kingdom of Denmark', type: 'primary', description: 'Constitutional monarchy.' },
                    { name: 'Independence Movement', type: 'rebel', description: 'Icelandic nationalists.' },
                    { name: 'Fishing Companies', type: 'trade_company', description: 'Modernizing industry.' }
                ],
                structureNames: {
                    fortress: ['Coastal Defense', 'Government Building'],
                    factory: ['Fish Processing', 'Freezing Plant'],
                    trading_post: ['Export Dock', 'Cooperative Store']
                }
            },
            [HistoricalEra.MODERN_ERA]: {
                dominantPower: 'Republic of Iceland',
                dominantPowerDescription: 'Independent Nordic nation balancing fishing, tourism, and renewable energy.',
                eraContextSentence: 'the Nordic miracle, where geothermal power and tourism transform a volcanic island.',
                allegianceGroups: [
                    { name: 'Republic of Iceland', type: 'primary', description: 'Independent democracy.' },
                    { name: 'NATO', type: 'secondary', description: 'Defense alliance.' },
                    { name: 'Fishing Industry', type: 'trade_company', description: 'Economic backbone.' },
                    { name: 'Tourism Sector', type: 'trade_company', description: 'Growing industry.' }
                ],
                structureNames: {
                    fortress: ['NATO Base', 'Coast Guard Station'],
                    factory: ['Aluminum Smelter', 'Geothermal Plant', 'Data Center'],
                    trading_post: ['Tourist Center', 'Fish Market', 'Keflavik Airport']
                }
            }
        }
    }
};
