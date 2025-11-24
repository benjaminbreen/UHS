import { CulturalZone } from '../types';
import { HistoricalEra } from '../types';

export interface HistoricalEncounter {
    id: string;
    title: string;
    era: HistoricalEra;
    culturalZone: CulturalZone;
    year?: number;
    location?: string;
    description: string;
    contextText: string; // Historical background
    encounterText: string; // What the player experiences
    artifacts?: string[]; // Items/documents found
    choices: EncounterChoice[];
    historicalNote?: string; // Educational note about real history
}

export interface EncounterChoice {
    id: string;
    text: string;
    requirements?: {
        intelligence?: number;
        wisdom?: number;
        charisma?: number;
        items?: string[];
    };
    outcome: {
        description: string;
        effects: {
            health?: number;
            reputation?: number;
            items?: string[];
            primarySources?: string[];
            knowledge?: string; // What the player learns
        };
        historicalAccuracy: 'authentic' | 'plausible' | 'speculative';
    };
}

// Encounter templates by era and culture
const encounterTemplates: Record<string, HistoricalEncounter[]> = {
    // EUROPEAN - MEDIEVAL
    'EUROPEAN_MEDIEVAL': [
        {
            id: 'medieval_scriptorium',
            title: 'The Illuminated Manuscript',
            era: 'MEDIEVAL' as HistoricalEra,
            culturalZone: 'EUROPEAN' as CulturalZone,
            year: 1347,
            location: 'Abbey of Saint-Denis, France',
            description: 'A Benedictine monastery during the Black Death',
            contextText: 'The Black Death ravages Europe. One-third of the population will perish. Monasteries, centers of learning and medicine, struggle to cope with the dying while preserving knowledge.',
            encounterText: 'You discover Brother Thomas hunched over an illuminated manuscript, his hands trembling. "The pestilence has taken the Abbot," he whispers. "I must finish copying Galen\'s medical treatise before..." He coughs, revealing buboes on his neck. The half-completed manuscript glows with gold leaf depicting the four humors.',
            artifacts: ['Illuminated page of Galen\'s De Medicina', 'Monastic seal', 'Vial of theriac'],
            choices: [
                {
                    id: 'help_complete',
                    text: 'Help complete the manuscript using your knowledge of Latin',
                    requirements: { intelligence: 12 },
                    outcome: {
                        description: 'You work through the night, your quill racing across vellum. Brother Thomas guides your hand with failing strength. As dawn breaks, the manuscript is complete - a beacon of medical knowledge preserved for future generations. Thomas passes peacefully, knowing his life\'s work is finished.',
                        effects: {
                            reputation: 10,
                            primarySources: ['Galen\'s De Medicina (1347 copy)', 'Brother Thomas\'s marginalia on plague symptoms'],
                            knowledge: 'Medieval medicine relied on Galenic theory of four humors: blood, phlegm, yellow bile, and black bile. Monks preserved classical medical knowledge through painstaking hand-copying.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'steal_manuscript',
                    text: 'Take the valuable manuscript while the monk is weak',
                    outcome: {
                        description: 'You snatch the manuscript. Brother Thomas lunges forward but collapses, crying "The knowledge... it must survive!" His final words haunt you. The manuscript, though valuable, remains forever incomplete - the final chapters on treating pestilence lost to greed.',
                        effects: {
                            reputation: -15,
                            items: ['Incomplete Galen Manuscript (valuable but cursed)'],
                            knowledge: 'Illuminated manuscripts could take years to complete and were worth fortunes. The loss of even one represented irreplaceable knowledge.'
                        },
                        historicalAccuracy: 'plausible'
                    }
                },
                {
                    id: 'comfort_dying',
                    text: 'Comfort the dying monk and record his final observations about the plague',
                    requirements: { wisdom: 10 },
                    outcome: {
                        description: 'You hold Brother Thomas as he describes the plague\'s progression: "First the fever, then the buboes... some cough blood, others merely waste away." His observations, different from ancient texts, represent new medical knowledge born from tragedy. You carefully record every word.',
                        effects: {
                            health: -5,
                            primarySources: ['First-hand plague observations, 1347', 'Brother Thomas\'s deviation from Galenic theory'],
                            knowledge: 'The Black Death forced medieval physicians to question classical authorities. Direct observation began to challenge ancient medical texts, planting seeds of empirical medicine.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                }
            ],
            historicalNote: 'Monasteries were centers of learning during the Black Death (1347-1351). Many monks died copying texts, ensuring knowledge survived the apocalyptic plague that killed 75-200 million people.'
        },
        {
            id: 'medieval_heretic',
            title: 'The Waldensian Bible',
            era: 'MEDIEVAL' as HistoricalEra,
            culturalZone: 'EUROPEAN' as CulturalZone,
            year: 1184,
            location: 'Lyon, France',
            description: 'A secret meeting of Waldensian preachers',
            contextText: 'The Waldensians, followers of Peter Waldo, preach apostolic poverty and translate the Bible into vernacular languages - acts the Church deems heretical. The Third Lateran Council has just condemned them.',
            encounterText: 'In a hidden cellar, you find Marie de Montpellier teaching peasants from a hand-copied Bible in Occitan. "Christ\'s words belong to all, not just those who speak Latin," she declares. Suddenly, footsteps above - the Inquisition approaches. Marie thrusts the Bible at you: "Whatever happens, the Word must survive!"',
            artifacts: ['Occitan Bible fragment', 'Waldensian preaching notes', 'Poor of Lyon identification'],
            choices: [
                {
                    id: 'hide_bible',
                    text: 'Hide the Bible in your clothes and claim ignorance',
                    requirements: { charisma: 11 },
                    outcome: {
                        description: 'You conceal the Bible beneath your cloak. When Inquisitors burst in, you convincingly play a lost traveler. They arrest Marie and the others, but the vernacular Bible survives. Years later, it inspires new translations, bringing scripture to common people.',
                        effects: {
                            items: ['Hidden Waldensian Bible (Occitan, 1184)'],
                            primarySources: ['Early vernacular Bible translation', 'Waldensian sermon notes'],
                            knowledge: 'Waldensians pioneered Bible translation 200 years before the Protestant Reformation. They believed apostolic poverty and direct access to scripture were essential to faith.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'defend_heretics',
                    text: 'Stand with the Waldensians and argue theology with the Inquisitors',
                    requirements: { intelligence: 13, wisdom: 12 },
                    outcome: {
                        description: 'You quote scripture and Church fathers, arguing that Christ preached to common people in Aramaic, not Latin. The Dominican inquisitor pauses, impressed by your learning, then declares: "The Devil can cite Scripture for his purpose." You\'re arrested but your defense is recorded in trial documents, preserving Waldensian theology.',
                        effects: {
                            reputation: -10,
                            health: -20,
                            primarySources: ['Inquisition trial transcript, Lyon 1184', 'Waldensian theological arguments'],
                            knowledge: 'Medieval heresy trials, though persecutory, created detailed records of alternative Christian movements. These documents provide insights into popular religion beyond official Church doctrine.'
                        },
                        historicalAccuracy: 'plausible'
                    }
                },
                {
                    id: 'betray_location',
                    text: 'Reveal the gathering to authorities for reward',
                    outcome: {
                        description: 'You slip away and alert the Inquisition for 30 silver deniers. They raid the cellar, burning the vernacular Bibles and executing Marie. The crowd watching the burning murmurs: some in approval, others whispering prayers for the "Poor of Lyon." Your betrayal enriches you but haunts your conscience.',
                        effects: {
                            items: ['30 silver deniers (blood money)'],
                            reputation: -20,
                            knowledge: 'The Inquisition relied on informants and offered rewards for reporting heretics. This system created a climate of fear and suspicion in medieval communities.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                }
            ],
            historicalNote: 'The Waldensians, founded around 1173, were one of the earliest Protestant movements. Despite centuries of persecution, they survived and joined the Reformation in 1532.'
        }
    ],

    // EAST_ASIAN - MEDIEVAL
    'EAST_ASIAN_MEDIEVAL': [
        {
            id: 'tang_examination',
            title: 'The Imperial Examination Hall',
            era: 'MEDIEVAL' as HistoricalEra,
            culturalZone: 'EAST_ASIAN' as CulturalZone,
            year: 755,
            location: 'Chang\'an, Tang Dynasty',
            description: 'The night before the An Lushan Rebellion',
            contextText: 'Chang\'an, the world\'s largest city with over one million inhabitants, hosts the imperial examinations. Tomorrow, the general An Lushan will rebel, beginning a civil war that will claim 36 million lives - the deadliest conflict until World War II.',
            encounterText: 'In the examination compound, you find Scholar Wei burning scrolls. "An Lushan marches on the capital," he gasps. "These are the only copies of Du Fu\'s anti-war poems and the new astronomical observations from the Grand Astrologer. I cannot carry both to safety." Thunder rumbles - the rebellion has begun.',
            artifacts: ['Du Fu\'s manuscript poems', 'Tang astronomical charts', 'Imperial examination seal'],
            choices: [
                {
                    id: 'save_poetry',
                    text: 'Preserve Du Fu\'s poetry that captures the human cost of war',
                    outcome: {
                        description: 'You rescue Du Fu\'s poems. His verses - "The nation shattered, mountains and rivers remain" - survive to become China\'s most treasured poetry. The astronomical charts burn. Centuries later, scholars mourn the lost observations that might have advanced science by decades.',
                        effects: {
                            primarySources: ['Du Fu\'s "Spring View" (original manuscript)', 'Poems on the An Lushan Rebellion'],
                            knowledge: 'Du Fu (712-770) is considered China\'s greatest poet. His works documenting the An Lushan Rebellion provide invaluable historical testimony of war\'s impact on common people.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'save_astronomy',
                    text: 'Save the astronomical charts showing supernovae and comet paths',
                    requirements: { intelligence: 12 },
                    outcome: {
                        description: 'You grab the astronomical scrolls detailing the "guest star" (supernova) of 754 CE and precise comet observations. This data proves invaluable for later astronomers. Du Fu\'s poems burn - his condemnation of war\'s cruelty lost, though he continues writing in exile.',
                        effects: {
                            primarySources: ['Tang astronomical records, 754-755 CE', 'Supernova SN 754 observations'],
                            knowledge: 'Tang astronomers recorded supernovae, calling them "guest stars." Their observations, combined with Islamic and European records, help modern astronomers date cosmic events.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'warn_palace',
                    text: 'Abandon both and race to warn the Emperor',
                    requirements: { wisdom: 11 },
                    outcome: {
                        description: 'You leave the scrolls and rush to the palace. The Emperor Xuanzong, infatuated with his concubine Yang Guifei, dismisses your warning: "An Lushan is my loyal son!" Within days, he flees the capital. Both the poems and astronomical records burn, but your warning saves several court scholars who escape with other texts.',
                        effects: {
                            reputation: 15,
                            knowledge: 'Emperor Xuanzong\'s favoritism toward An Lushan and obsession with Yang Guifei blinded him to rebellion. His flight from Chang\'an marked the Tang Dynasty\'s decline from its golden age.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                }
            ],
            historicalNote: 'The An Lushan Rebellion (755-763) killed an estimated 36 million people - roughly 1/6 of the world\'s population. It marked the beginning of the Tang Dynasty\'s decline.'
        },
        {
            id: 'song_printing',
            title: 'The Movable Type Workshop',
            era: 'MEDIEVAL' as HistoricalEra,
            culturalZone: 'EAST_ASIAN' as CulturalZone,
            year: 1041,
            location: 'Bianjing (Kaifeng), Song Dynasty',
            description: 'Bi Sheng\'s printing workshop',
            contextText: 'Bi Sheng has invented movable type printing using clay characters - 400 years before Gutenberg. The Song Dynasty leads the world in technology: blast furnaces, the compass, and now this revolution in knowledge dissemination.',
            encounterText: 'Master Bi Sheng lies dying, his workshop in disarray. "My clay type... the merchants want to destroy it. It threatens their woodblock monopoly." He shows you thousands of clay characters and the molds to make more. "But I also discovered something else..." He reveals a hidden box: "Porcelain type - harder, reusable infinitely. Choose what to preserve."',
            artifacts: ['Clay movable type set', 'Porcelain type prototype', 'Bi Sheng\'s technical notes'],
            choices: [
                {
                    id: 'spread_clay_type',
                    text: 'Take the clay type system and openly teach the technique',
                    outcome: {
                        description: 'You publicize Bi Sheng\'s clay type method. Within years, printing houses proliferate across China. Books become affordable for the merchant class. The woodblock carvers riot, but the spread of knowledge is unstoppable. The porcelain innovation is lost.',
                        effects: {
                            reputation: 20,
                            primarySources: ['Dream Pool Essays describing movable type', 'Original clay type specimens'],
                            knowledge: 'Bi Sheng\'s movable type (1041) preceded Gutenberg by 400 years. Clay type was fragile but revolutionary, making books affordable for China\'s growing merchant class.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'protect_porcelain',
                    text: 'Hide the porcelain type and secretly develop it further',
                    requirements: { intelligence: 13 },
                    outcome: {
                        description: 'You conceal the porcelain type, working in secret to perfect it. The technique spreads slowly through trusted craftsmen. Korea later adopts and improves it, creating the world\'s first metal type. Your secrecy delays mass printing in China but ensures the technology\'s eventual perfection.',
                        effects: {
                            items: ['Secret porcelain type set'],
                            primarySources: ['Hidden technical manual for porcelain type', 'Early Korean metal type inspirations'],
                            knowledge: 'Porcelain and later metal type were more durable than clay. Korea\'s later innovations with metal type (1230s) built upon Chinese ceramic techniques.'
                        },
                        historicalAccuracy: 'speculative'
                    }
                },
                {
                    id: 'sell_to_merchants',
                    text: 'Sell the invention to the woodblock merchant guild',
                    outcome: {
                        description: 'You sell Bi Sheng\'s secrets to the merchants for 1000 strings of cash. They destroy the type and suppress the technique. Bi Sheng dies heartbroken. China continues using expensive woodblocks for centuries. Your wealth cannot ease your conscience as you watch knowledge remain locked away from common people.',
                        effects: {
                            items: ['1000 strings of Song Dynasty cash'],
                            reputation: -25,
                            knowledge: 'Guild monopolies often suppressed innovations that threatened their business. The high cost of woodblock printing kept literacy limited to the elite.'
                        },
                        historicalAccuracy: 'plausible'
                    }
                }
            ],
            historicalNote: 'Bi Sheng invented movable type around 1040 CE. While it didn\'t immediately replace woodblock printing in China due to the complexity of Chinese characters, it inspired printing revolutions in Korea and later Europe.'
        }
    ],

    // MENA - ANTIQUITY
    'MENA_ANTIQUITY': [
        {
            id: 'library_alexandria',
            title: 'The Last Scrolls of Alexandria',
            era: 'ANTIQUITY' as HistoricalEra,
            culturalZone: 'MENA' as CulturalZone,
            year: 48,
            location: 'Alexandria, Ptolemaic Egypt',
            description: 'Caesar\'s siege of Alexandria',
            contextText: 'Julius Caesar is besieged in Alexandria\'s royal quarter. His soldiers prepare to burn the Egyptian fleet. The Great Library, holding 400,000 scrolls - the accumulated knowledge of the ancient world - stands dangerously close to the harbor.',
            encounterText: 'Demetrius, the last librarian, frantically loads scrolls onto carts. "Caesar\'s fire will spread from the ships!" He shows you two collections: "Here, Aristotle\'s lost dialogues and the complete works of Sappho. There, Eratosthenes\' calculation of Earth\'s circumference and Aristarchus\' heliocentric theory. I can save only one cart before the flames arrive!"',
            artifacts: ['Aristotle\'s lost dialogues', 'Eratosthenes\' calculations', 'Library seal of Alexandria'],
            choices: [
                {
                    id: 'save_philosophy',
                    text: 'Save Aristotle\'s lost works and Sappho\'s complete poetry',
                    outcome: {
                        description: 'You rush the philosophical works to safety. Aristotle\'s dialogues on justice and Sappho\'s nine books of lyric poetry survive. The scientific works burn. Without Aristarchus\' heliocentric theory, Copernicus must rediscover what the ancients already knew, delaying the Scientific Revolution by centuries.',
                        effects: {
                            primarySources: ['Aristotle\'s "On Justice" (complete)', 'Sappho\'s nine books of lyric poetry'],
                            knowledge: 'The Library of Alexandria contained works now lost forever. Aristotle wrote dialogues like Plato; we have only his lecture notes. Of Sappho\'s 10,000 lines of poetry, only 650 survive today.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'save_science',
                    text: 'Preserve the scientific and mathematical treatises',
                    requirements: { intelligence: 12 },
                    outcome: {
                        description: 'You save the scientific scrolls. Eratosthenes\' proof of Earth\'s circumference and Aristarchus\' heliocentric model survive. Science advances rapidly with this knowledge. But Sappho\'s poetry and Aristotle\'s dialogues burn - the ancient world\'s artistic soul diminished forever.',
                        effects: {
                            primarySources: ['Eratosthenes\' "On the Measurement of the Earth"', 'Aristarchus\' heliocentric calculations'],
                            knowledge: 'Eratosthenes calculated Earth\'s circumference to within 2% accuracy in 240 BCE. Aristarchus proposed heliocentrism 1,800 years before Copernicus.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'create_catalogue',
                    text: 'Abandon both to quickly copy the library\'s complete catalogue',
                    requirements: { wisdom: 14 },
                    outcome: {
                        description: 'You grab blank papyrus and frantically copy the Pinakes - the library\'s complete catalogue. The scrolls burn, but your catalogue preserves titles and summaries of 120,000 works. Future scholars know exactly what was lost, inspiring centuries of searches for copies in distant libraries.',
                        effects: {
                            primarySources: ['Complete Pinakes catalogue of Alexandria', 'Index of lost works'],
                            reputation: 15,
                            knowledge: 'The Pinakes, created by Callimachus, was the world\'s first library catalog. It organized all Greek literature into genres and included biographical information about authors.'
                        },
                        historicalAccuracy: 'speculative'
                    }
                }
            ],
            historicalNote: 'The Library of Alexandria\'s destruction occurred gradually over centuries. Caesar\'s fire in 48 BCE was one incident among many. The loss of this knowledge repository remains one of history\'s greatest intellectual catastrophes.'
        },
        {
            id: 'house_of_wisdom',
            title: 'The Translation Movement',
            era: 'MEDIEVAL' as HistoricalEra,
            culturalZone: 'MENA' as CulturalZone,
            year: 832,
            location: 'Baghdad, Abbasid Caliphate',
            description: 'The House of Wisdom at its peak',
            contextText: 'Caliph al-Ma\'mun\'s House of Wisdom leads the world in scholarship. Here, Greek, Persian, and Indian knowledge is translated into Arabic. The scholars\' work will preserve ancient learning through Europe\'s Dark Ages and inspire the Renaissance.',
            encounterText: 'You find Hunayn ibn Ishaq, the great translator, with two scholars in heated debate. A Persian astronomer holds Hindu numerals calculating planetary orbits, while a Greek physician clutches Galen\'s anatomy. "The Caliph funds only one more translation project," Hunayn explains. "Choose: India\'s mathematics or Greece\'s medicine?"',
            artifacts: ['Brahmagupta\'s Siddhanta', 'Galen\'s anatomical treatises', 'House of Wisdom seal'],
            choices: [
                {
                    id: 'translate_mathematics',
                    text: 'Translate Indian mathematical texts introducing zero and decimal system',
                    requirements: { intelligence: 13 },
                    outcome: {
                        description: 'You convince Hunayn to translate Brahmagupta\'s Brahmasphutasiddhanta. The concept of zero and decimal notation revolutionizes Islamic mathematics. Al-Khwarizmi uses it to invent algebra. These "Arabic numerals" spread to Europe, enabling the Scientific Revolution. Medical advances slow without Galen\'s complete works.',
                        effects: {
                            primarySources: ['First Arabic translation of Hindu numerals', 'Al-Khwarizmi\'s "Algebra" manuscript'],
                            knowledge: 'The Hindu-Arabic numeral system, including zero, transformed mathematics. The word "algebra" comes from al-Khwarizmi\'s "al-jabr," meaning "restoration."'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'translate_medicine',
                    text: 'Translate Greek medical texts to advance Islamic medicine',
                    requirements: { wisdom: 12 },
                    outcome: {
                        description: 'You advocate for Galen\'s medical works. The translations enable Ibn Sina (Avicenna) to write his Canon of Medicine, the world\'s most influential medical text for 600 years. However, without Indian numerals, Islamic mathematics develops slowly, delaying astronomical advances.',
                        effects: {
                            primarySources: ['Hunayn\'s Galen translations', 'Early draft of Ibn Sina\'s Canon'],
                            knowledge: 'Hunayn ibn Ishaq translated 129 works of Galen. His translations were so accurate that many Greek originals could be reconstructed from his Arabic versions.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'propose_synthesis',
                    text: 'Suggest combining both traditions into a new unified work',
                    requirements: { intelligence: 14, wisdom: 13 },
                    outcome: {
                        description: 'You propose synthesizing both traditions - using Indian mathematics to quantify Greek medicine. This revolutionary approach creates mathematical medicine: drug dosages calculated by body weight, statistical tracking of disease patterns. Islamic civilization leaps forward, though purists condemn mixing traditions.',
                        effects: {
                            reputation: 25,
                            primarySources: ['First mathematical medicine treatise', 'Statistical plague records'],
                            knowledge: 'Islamic scholars pioneered evidence-based medicine, requiring empirical testing and peer review 1000 years before modern clinical trials.'
                        },
                        historicalAccuracy: 'speculative'
                    }
                }
            ],
            historicalNote: 'The Abbasid Translation Movement (8th-10th centuries) preserved and transmitted knowledge between civilizations. Without it, much ancient learning would have been lost forever.'
        }
    ],

    // SUB_SAHARAN_AFRICAN - MEDIEVAL
    'SUB_SAHARAN_AFRICAN_MEDIEVAL': [
        {
            id: 'timbuktu_manuscripts',
            title: 'The Sankore Manuscript Crisis',
            era: 'MEDIEVAL' as HistoricalEra,
            culturalZone: 'SUB_SAHARAN_AFRICAN' as CulturalZone,
            year: 1468,
            location: 'Timbuktu, Songhai Empire',
            description: 'The Sankore University during Sonni Ali\'s conquest',
            contextText: 'Timbuktu, the "Athens of Africa," houses 700,000 manuscripts in its libraries. The Songhai conqueror Sonni Ali approaches. Though Muslim, he opposes the scholarly elite. The scholars of Sankore University prepare to hide their precious texts.',
            encounterText: 'Ahmed Baba al-Sudani, the young scholar, struggles with two collections. "These astronomical treatises track the monsoons - vital for farmers. But these..." he indicates genealogical chronicles, "prove the ancient connections between Songhai, Ghana, and Egypt. Sonni Ali burns what threatens him. Help me choose what to save in the underground vaults."',
            artifacts: ['Songhai astronomical tables', 'Royal genealogies of Sudan', 'Sankore University seal'],
            choices: [
                {
                    id: 'save_astronomy',
                    text: 'Preserve the astronomical and agricultural treatises',
                    outcome: {
                        description: 'You hide the astronomical works. These detailed observations of stars, seasons, and rainfall patterns help West African farmers for generations. The genealogies burn. Without written proof of ancient kingdoms\' sophistication, European colonizers later claim Africa had no history before their arrival.',
                        effects: {
                            primarySources: ['Timbuktu astronomical manuscripts', 'Monsoon prediction tables'],
                            knowledge: 'Timbuktu scholars tracked celestial movements with remarkable accuracy, creating agricultural calendars that precisely predicted seasonal floods of the Niger River.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'save_genealogies',
                    text: 'Protect the historical chronicles and royal genealogies',
                    requirements: { wisdom: 12 },
                    outcome: {
                        description: 'You preserve the genealogies tracing Songhai royalty to ancient Egypt and chronicling trade with China. These documents prove Africa\'s central role in medieval global trade. The astronomical works are lost, causing agricultural disruption, but Africa\'s history survives colonialism\'s attempted erasure.',
                        effects: {
                            primarySources: ['Chronicle of the Sudan', 'Royal lineages of West Africa'],
                            reputation: 15,
                            knowledge: 'The Tarikh al-Sudan and Tarikh al-Fattash chronicle West African history from ancient times, proving sophisticated governance existed centuries before European contact.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'create_copies',
                    text: 'Quickly train scribes to create multiple copies',
                    requirements: { intelligence: 13, charisma: 12 },
                    outcome: {
                        description: 'You organize a copying marathon. Students work day and night creating duplicates. When Sonni Ali arrives, you present him with "all" the manuscripts (keeping copies hidden). Impressed by your apparent cooperation, he spares the university. Both collections survive through clever deception.',
                        effects: {
                            primarySources: ['Complete Sankore manuscript collection', 'Secret copying techniques manual'],
                            reputation: 20,
                            knowledge: 'Timbuktu\'s manuscript tradition involved families secretly copying and hiding texts for centuries, preserving African intellectual heritage through invasion, colonization, and attempted destruction.'
                        },
                        historicalAccuracy: 'plausible'
                    }
                }
            ],
            historicalNote: 'Timbuktu\'s libraries contained more books than most European universities. These manuscripts covered law, medicine, astronomy, and history, proving medieval Africa\'s intellectual sophistication.'
        },
        {
            id: 'great_zimbabwe',
            title: 'The Bird of Zimbabwe',
            era: 'MEDIEVAL' as HistoricalEra,
            culturalZone: 'SUB_SAHARAN_AFRICAN' as CulturalZone,
            year: 1450,
            location: 'Great Zimbabwe',
            description: 'The mysterious abandonment',
            contextText: 'Great Zimbabwe, the massive stone city, is being abandoned. Climate change and overgrazing force its 18,000 inhabitants to leave. The city controlled gold trade from the interior to the Swahili coast.',
            encounterText: 'The last keeper of the Sacred Enclosure offers you a choice. "The Arab traders approach from the coast, and our people scatter to found new kingdoms. Take either our stone-carving techniques - the knowledge of building without mortar - or these gold trade route maps showing mines and paths to Kilwa. Both cannot be carried through the dangerous journey ahead."',
            artifacts: ['Zimbabwe bird soapstone carving', 'Gold trade route maps', 'Sacred Enclosure ritual items'],
            choices: [
                {
                    id: 'preserve_architecture',
                    text: 'Learn and preserve the dry-stone building techniques',
                    requirements: { intelligence: 12 },
                    outcome: {
                        description: 'You memorize the techniques: cutting granite along natural fractures, balancing forces without mortar. You teach these methods to the Rozvi and Mutapa kingdoms. Their impressive stone structures continue the tradition. The trade routes are lost, disrupting gold commerce for decades.',
                        effects: {
                            primarySources: ['Stone-cutting technique manual', 'Architectural principles of Great Zimbabwe'],
                            knowledge: 'Great Zimbabwe\'s walls, built without mortar, have stood for 900 years. The technique required precise understanding of weight distribution and stone grain.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'secure_trade_routes',
                    text: 'Take the gold trade maps to maintain commercial networks',
                    outcome: {
                        description: 'You secure the trade maps showing gold mines and caravan routes to Kilwa and Sofala. The Mutapa Empire uses these to maintain Zimbabwe\'s commercial dominance. However, without stone-building knowledge, later kingdoms build less impressive structures, allowing Europeans to claim Africans couldn\'t have built Great Zimbabwe.',
                        effects: {
                            items: ['Ancient gold trade route maps'],
                            primarySources: ['Medieval African trade documentation', 'Gold mine locations of the Zimbabwe Plateau'],
                            knowledge: 'Great Zimbabwe controlled trade between inland gold mines and coastal Swahili cities, connecting Africa to Indian Ocean trade networks reaching China and India.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'document_culture',
                    text: 'Instead document the city\'s social and religious practices',
                    requirements: { wisdom: 13 },
                    outcome: {
                        description: 'You spend final days interviewing elders, documenting rituals, governance, and the meaning of the Zimbabwe birds. Your record preserves the culture if not the technology. This oral history, passed through generations, maintains Shona identity despite colonial attempts at cultural erasure.',
                        effects: {
                            primarySources: ['Oral history of Great Zimbabwe', 'Ritual significance of Zimbabwe birds', 'Shona governance systems'],
                            reputation: 20,
                            knowledge: 'The Zimbabwe birds, carved from soapstone, likely represented ancestral spirits or totems. Eight were carved; they became Zimbabwe\'s national symbol.'
                        },
                        historicalAccuracy: 'speculative'
                    }
                }
            ],
            historicalNote: 'Great Zimbabwe (1100-1450 CE) was Sub-Saharan Africa\'s largest medieval city. European colonizers refused to believe Africans built it until archaeological evidence proved otherwise in the 20th century.'
        }
    ],

    // NORTH_AMERICAN_PRE_COLUMBIAN - MEDIEVAL
    'NORTH_AMERICAN_PRE_COLUMBIAN_MEDIEVAL': [
        {
            id: 'cahokia_mounds',
            title: 'The Cahokia Cosmic Calendar',
            era: 'MEDIEVAL' as HistoricalEra,
            culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone,
            year: 1250,
            location: 'Cahokia, Mississippi River Valley',
            description: 'North America\'s largest pre-Columbian city at its peak',
            contextText: 'Cahokia, with 20,000 inhabitants, rivals London in size. Its 120 earthen mounds align with celestial events. The city is beginning its mysterious decline - perhaps from climate change, deforestation, or political upheaval.',
            encounterText: 'The Keeper of the Woodhenge - the circle of posts marking celestial events - is dying. "The knowledge must survive our city\'s end," she gasps. She shows you two bark manuscripts: "This one records the movements of Venus and lunar eclipses for planting ceremonies. That one contains the Mound Builder\'s engineering secrets - how we moved millions of baskets of earth. Choose quickly, the floods come."',
            artifacts: ['Woodhenge astronomical calculations', 'Mound construction techniques', 'Cahokian shell gorget'],
            choices: [
                {
                    id: 'save_astronomy',
                    text: 'Preserve the astronomical observations and ceremonial calendar',
                    outcome: {
                        description: 'You save the celestial records. This knowledge passes to other Mississippian cultures, allowing them to maintain agricultural ceremonies. The engineering knowledge is lost. When Europeans arrive, they cannot believe Native Americans built such monuments, fabricating myths about lost white civilizations.',
                        effects: {
                            primarySources: ['Cahokian astronomical records', 'Woodhenge calendar calculations'],
                            knowledge: 'Cahokia\'s Woodhenge, like England\'s Stonehenge, marked solstices and equinoxes. This knowledge coordinated planting and harvesting across the Mississippi Valley.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'save_engineering',
                    text: 'Protect the engineering knowledge of mound construction',
                    requirements: { intelligence: 12 },
                    outcome: {
                        description: 'You preserve the engineering texts detailing labor organization, earth-moving techniques, and architectural planning. This knowledge helps other centers like Moundville and Spiro. The astronomical knowledge fades, disrupting agricultural timing and hastening societal collapse.',
                        effects: {
                            primarySources: ['Mound Builder engineering manual', 'Labor organization records'],
                            knowledge: 'Monks Mound at Cahokia contains 22 million cubic feet of earth, all moved by hand in baskets. Its construction required sophisticated engineering and social organization.'
                        },
                        historicalAccuracy: 'speculative'
                    }
                },
                {
                    id: 'seek_migration_routes',
                    text: 'Instead map where Cahokians are migrating to preserve the diaspora',
                    requirements: { wisdom: 13 },
                    outcome: {
                        description: 'You track fleeing families, recording where Cahokians resettle - some join the Osage, others the Natchez or distant Pueblo communities. Your map preserves connections between cultures that archaeologists will discover centuries later through pottery styles and religious practices.',
                        effects: {
                            primarySources: ['Cahokian diaspora map', 'Cultural connection records'],
                            reputation: 15,
                            knowledge: 'Cahokia\'s collapse around 1350 CE dispersed its people across North America. Their influence appears in later cultures\' art, religion, and urban planning.'
                        },
                        historicalAccuracy: 'plausible'
                    }
                }
            ],
            historicalNote: 'Cahokia (600-1400 CE) was larger than London and Paris during its peak. Its planned streets, plazas, and mounds show sophisticated urban planning that influenced Native American cultures for centuries.'
        },
        {
            id: 'pueblo_revolt',
            title: 'The Knotted Cord Conspiracy',
            era: 'RENAISSANCE_EARLY_MODERN' as HistoricalEra,
            culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone,
            year: 1680,
            location: 'Taos Pueblo, New Mexico',
            description: 'Planning the Pueblo Revolt',
            contextText: 'After 82 years of Spanish rule, Pueblo peoples plan revolt. The medicine man Po\'pay organizes resistance across dozens of villages, coordinating the uprising for August 11, 1680 - the only successful expulsion of European colonizers in North American history.',
            encounterText: 'Po\'pay shows you knotted cords - each knot represents a day until the revolt. "The Spanish have forbidden our ceremonies, enslaved our people, burned our kivas. But they haven\'t found these..." He reveals two hidden caches: "Sacred masks and ritual items here, Spanish weapon locations and patrol schedules there. We can only evacuate one before the Spanish search tomorrow."',
            artifacts: ['Knotted counting cords', 'Kachina masks', 'Spanish intelligence documents'],
            choices: [
                {
                    id: 'save_sacred_items',
                    text: 'Hide the ceremonial masks and religious artifacts',
                    requirements: { wisdom: 12 },
                    outcome: {
                        description: 'You secret away the kachina masks and ceremonial items. When the revolt succeeds, these objects allow immediate restoration of traditional religion. The lost intelligence means higher casualties, but Pueblo spirituality survives intact. The Spanish are expelled for 12 years.',
                        effects: {
                            primarySources: ['Pre-revolt Pueblo religious artifacts', 'Hidden kiva ceremonial items'],
                            reputation: 15,
                            knowledge: 'The Pueblo Revolt succeeded partly because it preserved indigenous religion. When Spanish returned in 1692, they were forced to tolerate Native practices.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'keep_intelligence',
                    text: 'Preserve the Spanish military intelligence for tactical advantage',
                    outcome: {
                        description: 'You save the intelligence. The revolt is devastatingly effective - coordinated attacks overwhelm every Spanish position simultaneously. 400 Spanish are killed, 2,000 flee. However, without ceremonial items, restoring traditional practices takes years. Some rituals are lost forever.',
                        effects: {
                            primarySources: ['Spanish colonial military documents', 'Pueblo Revolt tactical plans'],
                            knowledge: 'The Pueblo Revolt was the most successful Native American uprising, expelling Spanish from New Mexico for 12 years and preserving Pueblo culture to this day.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'warn_spanish_allies',
                    text: 'Warn Pueblo peoples who allied with Spanish to stay neutral',
                    requirements: { charisma: 13 },
                    outcome: {
                        description: 'You secretly warn Pueblos who might side with Spanish, convincing them to remain neutral. This prevents civil war among Native peoples. The revolt succeeds with unified action. Your diplomacy creates lasting unity, though some call you soft for not punishing collaborators.',
                        effects: {
                            reputation: 10,
                            primarySources: ['Inter-Pueblo diplomatic correspondence', 'Unity agreement documents'],
                            knowledge: 'Not all Pueblos initially supported the revolt. Creating unity among diverse Pueblo peoples was Po\'pay\'s greatest achievement.'
                        },
                        historicalAccuracy: 'plausible'
                    }
                }
            ],
            historicalNote: 'The Pueblo Revolt of 1680 expelled Spanish from New Mexico for 12 years. It preserved Pueblo languages, religions, and cultures that survive today - a rare colonial-era indigenous victory.'
        }
    ],

    // SOUTH_ASIAN - ANTIQUITY
    'SOUTH_ASIAN_ANTIQUITY': [
        {
            id: 'nalanda_destruction',
            title: 'The Burning of Nalanda',
            era: 'MEDIEVAL' as HistoricalEra,
            culturalZone: 'SOUTH_ASIAN' as CulturalZone,
            year: 1193,
            location: 'Nalanda University, Bihar',
            description: 'The world\'s first residential university faces destruction',
            contextText: 'Nalanda University, operating for 700 years, houses 10,000 students and 2,000 teachers from across Asia. Bakhtiyar Khilji\'s Turkish army approaches. The library, Dharmaganja, contains 9 million manuscripts - the largest collection of Buddhist and Hindu knowledge in the world.',
            encounterText: 'Master Rahula Sribhadra, the last head librarian, faces an impossible choice. "The cavalry arrives at dawn. I have two carts." He gestures to endless shelves: "Here, Aryabhata\'s mathematical treatises and astronomical calculations that track eclipses for the next thousand years. There, the only copies of Buddhist logic texts and medical surgeries, including brain operations. The rest will burn."',
            artifacts: ['Aryabhata\'s Aryabhatiya', 'Sushruta Samhita surgical text', 'Nalanda University seal'],
            choices: [
                {
                    id: 'save_mathematics',
                    text: 'Rescue the mathematical and astronomical treatises',
                    requirements: { intelligence: 13 },
                    outcome: {
                        description: 'You save Aryabhata\'s works. His concept of zero, trigonometry, and prediction of eclipses survives. Islamic scholars translate these, revolutionizing mathematics. The medical texts burn. Surgical knowledge including cataract surgery and rhinoplasty is lost, not rediscovered in the West for 500 years.',
                        effects: {
                            primarySources: ['Aryabhata\'s mathematical proofs', 'Astronomical eclipse tables for 1000 years'],
                            knowledge: 'Aryabhata (476-550 CE) calculated π to four decimal places and proposed that Earth rotates on its axis. His work influenced Islamic and European mathematics.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'save_medicine',
                    text: 'Preserve the medical and surgical knowledge',
                    requirements: { wisdom: 12 },
                    outcome: {
                        description: 'You rescue the Sushruta Samhita and surgical texts describing 300 surgical procedures and 120 surgical instruments. This knowledge reaches the Islamic world, advancing medicine. The mathematical works burn. Without Aryabhata\'s calculations, astronomical navigation remains primitive for centuries.',
                        effects: {
                            primarySources: ['Sushruta Samhita complete text', 'Buddhist medical commentaries'],
                            knowledge: 'Sushruta described plastic surgery in 600 BCE. Indian surgeons performed cataract surgery and cesarean sections 2000 years before Europe.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'save_philosophy',
                    text: 'Focus on Buddhist philosophy and logic texts',
                    outcome: {
                        description: 'You prioritize Buddhist philosophical works on logic and consciousness. These texts preserve sophisticated debates on epistemology and mind. They inspire Tibetan Buddhism\'s development. The scientific works burn. Humanity loses detailed knowledge of mathematics and medicine that took centuries to redevelop.',
                        effects: {
                            primarySources: ['Dignaga\'s logic treatises', 'Consciousness philosophy texts'],
                            reputation: 10,
                            knowledge: 'Nalanda\'s Buddhist logicians developed formal logic systems 1500 years before similar developments in European philosophy.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                }
            ],
            historicalNote: 'Nalanda University (427-1193 CE) attracted students from China, Korea, Japan, Tibet, and Southeast Asia. Its destruction eliminated centuries of accumulated knowledge, particularly in Buddhism and science.'
        },
        {
            id: 'ashoka_edicts',
            title: 'The Kalinga Revelation',
            era: 'ANTIQUITY' as HistoricalEra,
            culturalZone: 'SOUTH_ASIAN' as CulturalZone,
            year: -261,
            location: 'Kalinga (modern Odisha)',
            description: 'Emperor Ashoka after the Kalinga War',
            contextText: 'The Kalinga War has ended. 300,000 are dead. Emperor Ashoka, victor of the bloodiest war in Indian history, stands among the corpses. This moment will transform him from Ashoka the Terrible to Ashoka the Great, creating the world\'s first Buddhist state.',
            encounterText: 'You find Ashoka drafting his famous edicts. "I have won an empire but lost my soul. These edicts will spread across my realm in local languages." He shows two versions: "This proclaims religious tolerance and non-violence for all beings. That one details practical governance - hospitals, roads, wells. My scribes say the stones can only bear one message clearly."',
            artifacts: ['Original Ashoka edict drafts', 'Brahmi script key', 'Lion capital design'],
            choices: [
                {
                    id: 'spread_dhamma',
                    text: 'Carve the moral and religious edicts about non-violence',
                    requirements: { wisdom: 13 },
                    outcome: {
                        description: 'The moral edicts spread across India. Ashoka\'s message of ahimsa (non-violence) and religious tolerance influences Indian civilization permanently. However, without practical governance instructions, local administrators struggle. The empire fragments after Ashoka\'s death, though his ethical legacy endures.',
                        effects: {
                            primarySources: ['Original Dhamma edicts', 'Religious tolerance proclamations'],
                            reputation: 20,
                            knowledge: 'Ashoka\'s edicts were the first written records of Buddhism and the earliest example of religious tolerance as state policy, 2300 years ago.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'spread_governance',
                    text: 'Inscribe the practical governance and public welfare instructions',
                    requirements: { intelligence: 12 },
                    outcome: {
                        description: 'The governance edicts spread, detailing hospital construction, veterinary care, and road building. The Mauryan Empire prospers with excellent infrastructure. However, without moral guidance, later rulers abandon Buddhist principles. The empire remains strong but loses its ethical foundation.',
                        effects: {
                            primarySources: ['Administrative reform edicts', 'Public welfare instructions'],
                            knowledge: 'Ashoka created the world\'s first public healthcare system, including hospitals for humans and animals, 2300 years before modern universal healthcare.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'create_bilingual',
                    text: 'Suggest bilingual edicts in both Brahmi and Greek for his western provinces',
                    requirements: { intelligence: 14 },
                    outcome: {
                        description: 'You propose bilingual edicts. Ashoka embraces this innovation. The Greek versions reach Hellenistic kingdoms, influencing Stoic philosophy. The cultural exchange between Buddhist India and Greek philosophy creates Gandhara art and accelerates philosophical development in both civilizations.',
                        effects: {
                            primarySources: ['Bilingual Kandahar edicts', 'Greek-Brahmi translation keys'],
                            reputation: 15,
                            knowledge: 'Ashoka\'s bilingual edicts in Greek and Aramaic prove extensive cultural exchange existed between ancient India and the Hellenistic world following Alexander\'s invasion.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                }
            ],
            historicalNote: 'Ashoka\'s edicts (269-232 BCE) are the earliest preserved Indian written records. His conversion to Buddhism after the Kalinga War created the first state based on non-violence and religious tolerance.'
        }
    ],

    // OCEANIA - MEDIEVAL
    'OCEANIA_MEDIEVAL': [
        {
            id: 'rapa_nui_collapse',
            title: 'The Last Moai',
            era: 'MEDIEVAL' as HistoricalEra,
            culturalZone: 'OCEANIA' as CulturalZone,
            year: 1680,
            location: 'Rapa Nui (Easter Island)',
            description: 'The collapse of moai construction',
            contextText: 'Rapa Nui\'s ecosystem is collapsing. The forests are gone, cut to move the giant moai statues. Without trees for canoes, the islanders cannot fish deep waters. Clan warfare has begun. The magnificent moai civilization is ending.',
            encounterText: 'Hotu, the last master carver, kneels before an unfinished moai. "Our rongorongo script holds the stories of our ancestors\' voyages across the Pacific, the star maps that guided us here. But this," he touches the moai, "this shows how to read the stars from the statues\' positions - they\'re an astronomical calendar. The warriors come to topple the moai. I can save one secret. Choose."',
            artifacts: ['Rongorongo tablet', 'Moai astronomical alignments', 'Obsidian carving tools'],
            choices: [
                {
                    id: 'save_rongorongo',
                    text: 'Preserve the rongorongo script and navigation knowledge',
                    requirements: { intelligence: 12 },
                    outcome: {
                        description: 'You hide the rongorongo tablets in a sealed cave. The script survives but remains undeciphered. The astronomical knowledge of the moai is lost when rivals topple them. Polynesian navigation techniques are partially preserved, but the full story of Pacific colonization remains mysterious.',
                        effects: {
                            primarySources: ['Preserved rongorongo tablets', 'Star navigation charts'],
                            knowledge: 'Rongorongo remains one of the world\'s few undeciphered scripts. It may contain the history of Polynesian expansion across the Pacific.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'save_astronomy',
                    text: 'Document the moai astronomical alignment system',
                    requirements: { wisdom: 13 },
                    outcome: {
                        description: 'You map how moai positions mark solstices, equinoxes, and star rises. This knowledge shows Rapa Nui as sophisticated astronomers, not just statue builders. The rongorongo is lost in the warfare. Without written records, oral history fragments, and European diseases nearly eliminate Rapa Nui culture.',
                        effects: {
                            primarySources: ['Moai astronomical positioning map', 'Seasonal calendar calculations'],
                            knowledge: 'Recent studies confirm moai were positioned to mark astronomical events, suggesting they served as a giant calendar for agricultural and ceremonial purposes.'
                        },
                        historicalAccuracy: 'speculative'
                    }
                },
                {
                    id: 'negotiate_peace',
                    text: 'Try to negotiate peace between clans to preserve both',
                    requirements: { charisma: 14 },
                    outcome: {
                        description: 'You broker a desperate peace, arguing that destroying their heritage ensures everyone\'s doom. The clans agree to preserve knowledge collectively. Some moai remain standing, some rongorongo survives. When Europeans arrive, enough culture remains for partial reconstruction of this remarkable civilization.',
                        effects: {
                            reputation: 25,
                            primarySources: ['Peace agreement between clans', 'Combined knowledge preservation'],
                            knowledge: 'Rapa Nui\'s collapse wasn\'t just ecological but also social. Inter-clan competition for resources led to the toppling of rivals\' moai in "statue wars."'
                        },
                        historicalAccuracy: 'plausible'
                    }
                }
            ],
            historicalNote: 'Rapa Nui (Easter Island) developed in isolation from 300-1680 CE. Its ecological collapse from deforestation remains a cautionary tale about resource management. Only 111 indigenous Rapa Nui survived to 1877.'
        }
    ],

    // SOUTH_AMERICAN - RENAISSANCE
    'SOUTH_AMERICAN_RENAISSANCE_EARLY_MODERN': [
        {
            id: 'quipu_preservation',
            title: 'The Forbidden Quipu',
            era: 'RENAISSANCE_EARLY_MODERN' as HistoricalEra,
            culturalZone: 'SOUTH_AMERICAN' as CulturalZone,
            year: 1583,
            location: 'Cusco, Viceroyalty of Peru',
            description: 'Spanish destruction of Inca records',
            contextText: 'The Spanish have declared quipu - the Inca knotted recording system - as "devil\'s work." The Third Council of Lima orders all quipu burned. These intricate knots record everything: census data, histories, astronomical observations, even poetry.',
            encounterText: 'Amaru, the last quipucamayoc (quipu keeper), hides in the ruins of Qorikancha. "Each knot\'s position, color, and twist has meaning. This quipu records the true history of the Inca - not Spanish lies. This one tracks El Niño patterns for 500 years, predicting floods and droughts. Tomorrow they burn them all. Choose what survives."',
            artifacts: ['Master historical quipu', 'El Niño prediction quipu', 'Quipu reading manual'],
            choices: [
                {
                    id: 'save_history',
                    text: 'Preserve the historical quipu recording Inca civilization',
                    requirements: { wisdom: 12 },
                    outcome: {
                        description: 'You save the historical quipu. Hidden for centuries, it preserves the Inca perspective on their conquest, population data, and social organization. When finally decoded, it revolutionizes understanding of pre-Columbian America. The climate data is lost, causing agricultural failures.',
                        effects: {
                            primarySources: ['Inca imperial history quipu', 'Population census knots'],
                            reputation: 15,
                            knowledge: 'Quipu recorded numerical and potentially narrative information through knot types, positions, and colors. Recent studies suggest they may represent a complete writing system.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'save_climate',
                    text: 'Keep the climate data for agricultural predictions',
                    requirements: { intelligence: 13 },
                    outcome: {
                        description: 'You preserve the climate quipu. Indigenous farmers secretly use it to predict El Niño events, maintaining agricultural productivity despite Spanish exploitation. The historical records burn. Spanish accounts become the only "history," portraying Incas as primitives needing civilization.',
                        effects: {
                            primarySources: ['500-year El Niño records', 'Agricultural timing quipu'],
                            knowledge: 'Inca astronomers tracked El Niño cycles with remarkable accuracy. This knowledge allowed them to prepare for climate fluctuations across their vast empire.'
                        },
                        historicalAccuracy: 'speculative'
                    }
                },
                {
                    id: 'teach_spanish',
                    text: 'Teach a sympathetic Spanish priest the quipu system',
                    requirements: { charisma: 13, intelligence: 12 },
                    outcome: {
                        description: 'You secretly teach Father Bernardo, who genuinely respects indigenous knowledge. He documents the system in a "confession manual," hiding it in plain sight. This preservation allows partial quipu decoding centuries later, though much nuance is lost in translation.',
                        effects: {
                            primarySources: ['Secret quipu translation guide', 'Spanish-Quechua conversion tables'],
                            reputation: 10,
                            knowledge: 'Some Spanish clergy, particularly Jesuits, secretly preserved indigenous knowledge while appearing to suppress it, creating hidden archives in religious documents.'
                        },
                        historicalAccuracy: 'plausible'
                    }
                }
            ],
            historicalNote: 'The Spanish destroyed thousands of quipu, eliminating Inca written history. Only about 600 quipu survive today, most still undecoded. This destruction parallels the burning of Maya codices, erasing millennia of indigenous knowledge.'
        }
    ],

    // EUROPEAN - INDUSTRIAL ERA
    'EUROPEAN_INDUSTRIAL_ERA': [
        {
            id: 'ada_lovelace_algorithm',
            title: 'The First Algorithm',
            era: 'INDUSTRIAL_ERA' as HistoricalEra,
            culturalZone: 'EUROPEAN' as CulturalZone,
            year: 1843,
            location: 'London, England',
            description: 'Ada Lovelace\'s revolutionary notes on computing',
            contextText: 'Ada Lovelace, daughter of Lord Byron, works on Charles Babbage\'s Analytical Engine. Her notes describe the first computer algorithm and envision computers composing music and creating art - ideas a century ahead of their time.',
            encounterText: 'Ada, gravely ill from her cancer treatments (bloodletting with leeches), hands you two manuscripts. "Babbage sees only numbers. I see the future - machines that think, create, compose symphonies! This manuscript contains my algorithm for computing Bernoulli numbers. This other... my vision of artificial intelligence, what machines might become. My husband will burn anything too \'unfeminine.\' Choose what survives."',
            artifacts: ['Bernoulli number algorithm', 'AI vision manuscript', 'Analytical Engine notes'],
            choices: [
                {
                    id: 'save_algorithm',
                    text: 'Preserve the technical algorithm that proves computational possibility',
                    requirements: { intelligence: 13 },
                    outcome: {
                        description: 'You save the algorithm. Published as "Note G," it becomes recognized as the first computer program. This concrete proof inspires later computer pioneers. The AI vision is lost. Without Lovelace\'s philosophical insights, early computers are seen as mere calculators, delaying AI research by decades.',
                        effects: {
                            primarySources: ['Note G - First computer algorithm', 'Analytical Engine technical notes'],
                            knowledge: 'Ada Lovelace\'s algorithm predated actual computers by a century. She understood computers could manipulate symbols, not just numbers - the foundation of all modern computing.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'save_vision',
                    text: 'Protect her visionary ideas about artificial intelligence',
                    requirements: { wisdom: 14 },
                    outcome: {
                        description: 'You preserve Ada\'s AI vision describing machines that learn, create art, and exhibit intelligence. Dismissed as fantasy initially, it inspires Alan Turing\'s work on machine intelligence a century later. The technical algorithm is lost, making her seem a dreamer rather than a rigorous mathematician.',
                        effects: {
                            primarySources: ['Lovelace\'s AI predictions', 'Machine consciousness theories'],
                            reputation: 10,
                            knowledge: 'Lovelace predicted computers would compose music, create art, and develop beyond mere calculation - ideas not seriously considered again until the 1950s.'
                        },
                        historicalAccuracy: 'speculative'
                    }
                },
                {
                    id: 'create_cipher',
                    text: 'Encode both works in a cipher hidden in her published notes',
                    requirements: { intelligence: 14, wisdom: 13 },
                    outcome: {
                        description: 'You help Ada create a cipher, hiding her radical ideas within the mathematical notation of her published notes. Decades later, the code is discovered. Both her algorithm and AI vision survive, establishing her as history\'s first computer scientist and AI theorist.',
                        effects: {
                            primarySources: ['Complete Lovelace notes with cipher', 'Decoded AI and algorithm texts'],
                            reputation: 25,
                            knowledge: 'Victorian women often hid radical ideas in acceptable formats. Lovelace\'s translation notes contained more original thought than the work she was supposedly just translating.'
                        },
                        historicalAccuracy: 'plausible'
                    }
                }
            ],
            historicalNote: 'Ada Lovelace (1815-1852) wrote the first computer algorithm in 1843, a century before computers existed. Her vision of computer potential went far beyond contemporary understanding.'
        }
    ],

    // MODERN ERA examples
    'NORTH_AMERICAN_COLONIAL_MODERN_ERA': [
        {
            id: 'manhattan_project',
            title: 'The Atomic Secret',
            era: 'MODERN_ERA' as HistoricalEra,
            culturalZone: 'NORTH_AMERICAN_COLONIAL' as CulturalZone,
            year: 1945,
            location: 'Los Alamos, New Mexico',
            description: 'The Manhattan Project\'s moral crisis',
            contextText: 'The Trinity test has succeeded. The atomic bomb works. Scientists who created it now face the moral implications. Some want to demonstrate it to Japan without casualties; others believe only its use will end the war.',
            encounterText: 'You find Dr. Leo Szilard, who first conceived the nuclear chain reaction, burning papers. "I\'m destroying my notes on the hydrogen bomb - a thousand times more powerful. But these..." He shows another folder: "Peaceful uses - nuclear medicine, power generation. The military wants everything. I can only hide one set. Choose humanity\'s nuclear future."',
            artifacts: ['H-bomb theoretical notes', 'Nuclear medicine research', 'Szilard\'s moral petition'],
            choices: [
                {
                    id: 'destroy_weapons',
                    text: 'Destroy the H-bomb research to slow the arms race',
                    requirements: { wisdom: 14 },
                    outcome: {
                        description: 'You burn the H-bomb notes. The Soviet Union and US take years longer to develop thermonuclear weapons, possibly preventing several near-nuclear wars. However, without Szilard\'s medical isotope work, cancer treatment advances slowly, costing millions of lives.',
                        effects: {
                            reputation: 20,
                            primarySources: ['Szilard\'s petition against nuclear weapons', 'Last H-bomb calculations (fragments)'],
                            knowledge: 'Leo Szilard patented the nuclear chain reaction in 1934 and later campaigned against nuclear weapons. His petition to President Truman was classified and ignored.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'save_medicine',
                    text: 'Preserve the medical applications of nuclear technology',
                    requirements: { intelligence: 13 },
                    outcome: {
                        description: 'You save the medical research. Nuclear medicine advances rapidly, saving millions through cancer treatment and medical imaging. The H-bomb is developed anyway by 1952. The arms race proceeds unchecked, bringing humanity to the brink of annihilation multiple times.',
                        effects: {
                            primarySources: ['Early nuclear medicine protocols', 'Radioactive tracer techniques'],
                            knowledge: 'Nuclear medicine emerged directly from Manhattan Project research. Today, 20 million nuclear medicine procedures are performed annually in the US alone.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                },
                {
                    id: 'contact_soviets',
                    text: 'Share the research with Soviet scientists to prevent arms race monopoly',
                    outcome: {
                        description: 'You secretly share both sets of research with Soviet scientists through back channels. Nuclear weapons proliferate faster, but so does nuclear medicine. The balance of terror is achieved sooner, possibly preventing use of nuclear weapons in Korea. You\'re later investigated for espionage.',
                        effects: {
                            reputation: -15,
                            primarySources: ['Secret nuclear proliferation documents', 'International scientist correspondence'],
                            knowledge: 'Several Manhattan Project scientists, including Klaus Fuchs, shared information with the Soviets, believing nuclear monopoly was more dangerous than proliferation.'
                        },
                        historicalAccuracy: 'authentic'
                    }
                }
            ],
            historicalNote: 'The Manhattan Project (1942-1946) involved 130,000 workers and cost $2 billion ($28 billion today). Many scientists involved later opposed nuclear weapons proliferation.'
        }
    ]
};

// Service functions to get encounters
export function getHistoricalEncounter(
    culturalZone: CulturalZone,
    era: HistoricalEra,
    specificYear?: number
): HistoricalEncounter | null {
    const key = `${culturalZone}_${era}`;
    const encounters = encounterTemplates[key];

    if (!encounters || encounters.length === 0) {
        // Try to find a close match
        const fallbackKeys = Object.keys(encounterTemplates).filter(k =>
            k.includes(culturalZone) || k.includes(era)
        );

        if (fallbackKeys.length > 0) {
            const fallbackEncounters = encounterTemplates[fallbackKeys[0]];
            return fallbackEncounters[Math.floor(Math.random() * fallbackEncounters.length)];
        }

        return null;
    }

    // If specific year provided, try to find closest match
    if (specificYear) {
        const closestEncounter = encounters.reduce((prev, curr) => {
            if (!curr.year) return prev;
            if (!prev.year) return curr;
            return Math.abs(curr.year - specificYear) < Math.abs(prev.year - specificYear) ? curr : prev;
        });
        return closestEncounter;
    }

    // Return random encounter from the era/culture
    return encounters[Math.floor(Math.random() * encounters.length)];
}

// Generate procedural variations
export function generateProceduralEncounter(
    baseEncounter: HistoricalEncounter,
    playerStats?: { intelligence: number; wisdom: number; charisma: number }
): HistoricalEncounter {
    // Create variations in descriptions while maintaining historical accuracy
    const modifiedEncounter = { ...baseEncounter };

    // Add procedural elements to the encounter text
    const weatherOptions = ['A storm approaches', 'The sun sets', 'Mist rises', 'Dawn breaks'];
    const atmosphere = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];

    modifiedEncounter.encounterText = `${atmosphere}. ${modifiedEncounter.encounterText}`;

    // Adjust choice availability based on player stats
    if (playerStats) {
        modifiedEncounter.choices = modifiedEncounter.choices.map(choice => {
            const modifiedChoice = { ...choice };
            if (choice.requirements) {
                // Make requirements visible to player
                const reqText = [];
                if (choice.requirements.intelligence) {
                    reqText.push(`Int ${choice.requirements.intelligence}+`);
                }
                if (choice.requirements.wisdom) {
                    reqText.push(`Wis ${choice.requirements.wisdom}+`);
                }
                if (choice.requirements.charisma) {
                    reqText.push(`Cha ${choice.requirements.charisma}+`);
                }
                if (reqText.length > 0) {
                    modifiedChoice.text += ` [Requires: ${reqText.join(', ')}]`;
                }
            }
            return modifiedChoice;
        });
    }

    return modifiedEncounter;
}

// Check if player meets requirements for a choice
export function canSelectChoice(
    choice: EncounterChoice,
    playerStats: { intelligence: number; wisdom: number; charisma: number },
    playerInventory?: string[]
): boolean {
    if (!choice.requirements) return true;

    const req = choice.requirements;

    if (req.intelligence && playerStats.intelligence < req.intelligence) return false;
    if (req.wisdom && playerStats.wisdom < req.wisdom) return false;
    if (req.charisma && playerStats.charisma < req.charisma) return false;

    if (req.items && playerInventory) {
        for (const requiredItem of req.items) {
            if (!playerInventory.includes(requiredItem)) return false;
        }
    }

    return true;
}

// Export for use in components
export const historicalEncounterService = {
    getHistoricalEncounter,
    generateProceduralEncounter,
    canSelectChoice,
    encounterTemplates
};