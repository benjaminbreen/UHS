/**
 * City Event Service - Generates era and culturally appropriate random events
 * when entering cities. These events provide immersive narrative choices.
 */

import { HistoricalEra, CulturalZone } from '../types';

export interface CityEventChoice {
    text: string;
    outcomes: CityEventOutcome[];
}

export interface CityEventOutcome {
    chance: number; // 0-1 probability
    result: 'death' | 'injury' | 'item' | 'gold_gain' | 'gold_loss' | 'item_loss' | 'nothing' | 'knowledge' | 'reputation_gain' | 'reputation_loss';
    message: string;
    value?: number | string; // Amount of gold, item ID, knowledge text, or reputation points
}

export interface CityEvent {
    id: string;
    prompt: string;
    choices: [CityEventChoice, CityEventChoice]; // Two choices: investigate/ignore
    era: HistoricalEra;
    culturalZones: CulturalZone[];
    yearMin?: number;
    yearMax?: number;
}

const CITY_EVENTS: CityEvent[] = [
    // ANTIQUITY - EUROPEAN
    {
        id: 'antiquity_european_gladiator_escape',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['EUROPEAN'],
        yearMin: -100,
        yearMax: 400,
        prompt: "As you enter the city gates, you notice a commotion near the amphitheater. A bloodied gladiator in chains is being dragged through the street by Roman guards. He locks eyes with you and mouths: 'Help me.' The crowd watches with morbid fascination.",
        choices: [
            {
                text: "Investigate - approach the guards and ask what happened",
                outcomes: [
                    { chance: 0.4, result: 'gold_loss', message: 'The guards demand a bribe to release information. You learn the gladiator killed a senator\'s son in the arena. The crowd cheers as he\'s dragged to execution.', value: 30 },
                    { chance: 0.3, result: 'knowledge', message: 'A guard drunkenly reveals the gladiator was framed - he refused to throw a fight for gambling debts. You gain insight into the corruption of Roman spectacles.', value: 'Knowledge of arena corruption' },
                    { chance: 0.2, result: 'item', message: 'In the confusion, you find a token that fell from the gladiator\'s chains - a Thracian good luck charm.', value: 'ANCIENT_AMULET' },
                    { chance: 0.1, result: 'death', message: 'You protest too loudly. The guards recognize you as a Christian sympathizer. You\'re arrested and thrown to the lions in the next games.' }
                ]
            },
            {
                text: "Ignore - this is not your business",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You avert your eyes and continue into the city. The gladiator\'s fate is sealed.' }
                ]
            }
        ]
    },

    // ANTIQUITY - EAST_ASIAN
    {
        id: 'antiquity_east_asian_silk_conspiracy',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['EAST_ASIAN'],
        yearMin: -206,
        yearMax: 220,
        prompt: "In the marketplace, a silk merchant whispers urgently to you: 'Please, you look like someone who can be trusted. Imperial inspectors are coming - they say I've been selling silk to foreign barbarians. The penalty is death. I need someone to hide a shipment. Just for one day.' His hands tremble.",
        choices: [
            {
                text: "Investigate - ask for more details about the shipment",
                outcomes: [
                    { chance: 0.35, result: 'gold_gain', message: 'He\'s telling the truth! The next day, he pays you generously. The silk was destined for Parthian traders - a capital crime, but profitable.', value: 150 },
                    { chance: 0.25, result: 'death', message: 'It\'s a trap! He\'s an imperial agent testing for conspirators. You\'re arrested for even considering treason against the Emperor\'s silk monopoly. Execution is swift.' },
                    { chance: 0.3, result: 'knowledge', message: 'You refuse to help, but he desperately explains the Silk Road economics. You learn valuable information about secret trade routes to the West.', value: 'Silk Road smuggling routes' },
                    { chance: 0.1, result: 'item', message: 'In his panic, he gives you a sample of the forbidden silk - worth a fortune in the West.', value: 'SILK_BOLT' }
                ]
            },
            {
                text: "Ignore - walk away from this dangerous situation",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You shake your head and leave quickly. The next day, you hear the merchant was publicly executed in the square.' }
                ]
            }
        ]
    },

    // ANTIQUITY - MENA
    {
        id: 'antiquity_mena_library_raid',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['MENA'],
        yearMin: -300,
        yearMax: 400,
        prompt: "In the library district, scholars rush past carrying armfuls of scrolls. An elderly librarian grabs your arm: 'Raiders from the frontier - they're coming to sack the city! We're hiding the most valuable texts in cisterns and secret chambers. We need help moving them quickly, but it's dangerous - if the raiders find us with these treasures, we'll be tortured for their location.'",
        choices: [
            {
                text: "Investigate - help hide the scrolls from raiders",
                outcomes: [
                    { chance: 0.3, result: 'knowledge', message: 'While hiding texts, a scholar shares a remarkable work - calculations of Earth\'s size and star charts. You gain valuable geographical knowledge.', value: 'Ancient astronomical knowledge' },
                    { chance: 0.25, result: 'item', message: 'In gratitude, the librarian gives you a medical text as payment - "Take it, better it survive with you than burn with us."', value: 'SCROLL' },
                    { chance: 0.25, result: 'death', message: 'Raiders catch you carrying scrolls to the cistern. They torture you for the location of the hidden library, then kill you. The texts are found and burned.' },
                    { chance: 0.2, result: 'reputation_gain', message: 'You help save dozens of irreplaceable works in hidden chambers. Scholars will remember this brave act for generations.', value: 15 }
                ]
            },
            {
                text: "Ignore - too dangerous, this is not your fight",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You slip away before the raiders arrive. The next day, you hear the library quarter was sacked, but many texts were successfully hidden.' }
                ]
            }
        ]
    },

    // ANTIQUITY - SOUTH_ASIAN
    {
        id: 'antiquity_south_asian_mauryan_spy',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['SOUTH_ASIAN'],
        yearMin: -322,
        yearMax: -185,
        prompt: "A well-dressed stranger approaches you near the palace district. 'I serve the Mauryan intelligence network - the eyes of the Emperor,' he says quietly. 'We've identified a Greek spy from the Seleucid court. We need someone... unknown... to observe his movements today. You would be well compensated.' He shows you a gold coin - proof of imperial backing.",
        choices: [
            {
                text: "Investigate - accept the assignment and track the spy",
                outcomes: [
                    { chance: 0.35, result: 'gold_gain', message: 'You successfully shadow the Greek spy and report his movements. The imperial agent pays you handsomely and thanks you for your service to the Mauryan throne.', value: 120 },
                    { chance: 0.3, result: 'death', message: 'The "spy" is actually a Mauryan loyalist. This was a test of YOUR loyalty - and you failed by accepting foreign coin. You\'re executed as a potential traitor.' },
                    { chance: 0.25, result: 'knowledge', message: 'You learn the Greek spy is actually a mathematician visiting to share astronomical knowledge. You gain insight into Hellenistic-Mauryan cultural exchange.', value: 'Knowledge of Greek-Indian relations' },
                    { chance: 0.1, result: 'item', message: 'The agent gives you a Mauryan imperial seal as proof of your service - a powerful symbol.', value: 'IMPERIAL_SEAL' }
                ]
            },
            {
                text: "Ignore - decline and walk away from this intrigue",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You politely refuse. The agent nods respectfully and melts into the crowd. Palace intrigue is too dangerous for you.' }
                ]
            }
        ]
    },

    // ANTIQUITY - SOUTH_AMERICAN
    {
        id: 'antiquity_south_american_moche_sacrifice',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['SOUTH_AMERICAN'],
        yearMin: 100,
        yearMax: 700,
        prompt: "Temple drums echo through the city. A Moche priest announces that the rains have failed - the mountain gods are angry. A young prisoner of war, bound in ropes, is being led up the pyramid steps for sacrifice. His sister breaks from the crowd, screaming that he should be ransomed, not killed. Guards move to silence her.",
        choices: [
            {
                text: "Investigate - speak up about ransom customs",
                outcomes: [
                    { chance: 0.3, result: 'reputation_gain', message: 'The priest considers your words. The captive\'s family offers tribute - ceramic vessels filled with corn beer. The gods accept this offering instead. The family blesses you.', value: 10 },
                    { chance: 0.35, result: 'gold_loss', message: 'To prevent bloodshed, you offer payment yourself. The priest accepts, but you\'ve spent heavily and gained only the gratitude of strangers.', value: 80 },
                    { chance: 0.2, result: 'death', message: 'The priest is enraged by your interference. The gods demand blood - and now they will have two sacrifices. You\'re seized and dragged up the pyramid.' },
                    { chance: 0.15, result: 'knowledge', message: 'The priest explains the sacred mathematics of sacrifice - how the gods count debts in blood. You learn the deep cosmology of the Moche faith.', value: 'Moche religious knowledge' }
                ]
            },
            {
                text: "Ignore - this is a sacred matter beyond your understanding",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You bow your head respectfully as the ritual proceeds. The drums beat louder. The rains come three days later.' }
                ]
            }
        ]
    },

    // MEDIEVAL - EUROPEAN
    {
        id: 'medieval_european_plague_doctor',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['EUROPEAN'],
        yearMin: 1300,
        yearMax: 1500,
        prompt: "A figure in a beaked mask - a plague doctor - stands at the city gates. 'Turn back!' he cries. 'Plague walks these streets. One in three are dead. The air is miasmic poison.' Behind him, you hear wailing and see smoke from burning bodies. But you need supplies from this city.",
        choices: [
            {
                text: "Investigate - enter carefully and assess the situation",
                outcomes: [
                    { chance: 0.25, result: 'death', message: 'Within days, you develop the telltale buboes. The fever comes quickly. You die in agony, one of millions claimed by the pestilence.' },
                    { chance: 0.3, result: 'item', message: 'You find an abandoned apothecary. Among the shelves: rare medicinal herbs left behind in the chaos.', value: 'MEDICINAL_HERBS' },
                    { chance: 0.25, result: 'knowledge', message: 'The plague doctor shares his observations - how the disease spreads, what treatments might help. Grim knowledge, but valuable.', value: 'Plague medicine knowledge' },
                    { chance: 0.2, result: 'gold_gain', message: 'The dead leave much behind. You find a merchant\'s strongbox, unopened. No one left alive to claim it.', value: 200 }
                ]
            },
            {
                text: "Ignore - heed the warning and turn back",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You retreat to the countryside. The city behind you becomes a graveyard. You live to see another day.' }
                ]
            }
        ]
    },

    // MEDIEVAL - EAST_ASIAN
    {
        id: 'medieval_east_asian_mongol_envoy',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['EAST_ASIAN'],
        yearMin: 1200,
        yearMax: 1350,
        prompt: "Mongol horsemen ride into the city square. Their leader dismounts and reads from a scroll: 'By order of the Great Khan - this city must submit tribute of silk, horses, and silver. Or face the fate of Samarkand and Baghdad.' The city elders whisper frantically. A merchant turns to you: 'You're a stranger here - speak honestly. Should we resist or submit?'",
        choices: [
            {
                text: "Investigate - speak with both the Mongols and the elders",
                outcomes: [
                    { chance: 0.35, result: 'knowledge', message: 'You learn the Mongols respect traders and artisans - they\'ve built an empire on the Silk Road. Submission means taxes, but also protection and trade opportunities.', value: 'Mongol administrative knowledge' },
                    { chance: 0.3, result: 'gold_gain', message: 'You negotiate as a neutral party. The Mongols reduce their tribute demand in exchange for your services as a guide. They pay you for your help.', value: 140 },
                    { chance: 0.2, result: 'death', message: 'Your advice to resist emboldens the elders. The Mongols return with an army. The city burns. No one survives the siege.' },
                    { chance: 0.15, result: 'reputation_gain', message: 'Your diplomatic skill impresses the Mongol envoy. He offers you safe passage across the entire Mongol Empire - an invaluable privilege.', value: 20 }
                ]
            },
            {
                text: "Ignore - this is not your city, not your decision",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You remain silent. The city submits. The Mongol yoke is heavy, but the alternative was annihilation.' }
                ]
            }
        ]
    },

    // MEDIEVAL - MENA
    {
        id: 'medieval_mena_golden_age_debate',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['MENA'],
        yearMin: 750,
        yearMax: 1250,
        prompt: "At the House of Wisdom, scholars are engaged in heated debate. A Greek philosopher argues with an Arab mathematician about the nature of zero and infinity. They notice you listening and invite you to join. 'You look like a traveler - bring fresh perspective!' says the mathematician. This could be valuable knowledge, or a waste of time.",
        choices: [
            {
                text: "Investigate - join the scholarly debate",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'You spend hours in discussion. The mathematician explains Arabic numerals and algebra - revolutionary concepts that will change human thought.', value: 'Advanced mathematical knowledge' },
                    { chance: 0.3, result: 'gold_loss', message: 'The debate stretches through the night. By the time you leave the House of Wisdom, pickpockets have robbed your lodgings.', value: 50 },
                    { chance: 0.2, result: 'item', message: 'The grateful scholar gifts you a translated copy of Euclid\'s Elements - worth a fortune in Europe.', value: 'BOOK' },
                    { chance: 0.1, result: 'reputation_gain', message: 'Your insights impress the scholars. They offer you a position at the House of Wisdom - recognition from the greatest minds of the age.', value: 25 }
                ]
            },
            {
                text: "Ignore - you have practical matters to attend to",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You politely decline and continue on your way. The scholars return to their eternal debates.' }
                ]
            }
        ]
    },

    // MEDIEVAL - SUB_SAHARAN_AFRICAN
    {
        id: 'medieval_subsaharan_mali_gold_caravan',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['SUB_SAHARAN_AFRICAN'],
        yearMin: 1235,
        yearMax: 1500,
        prompt: "A massive gold caravan from the Mali Empire is assembling at the city gates - hundreds of camels laden with gold dust and salt. The caravan master announces: 'We travel north to Timbuktu and then across the Sahara to Cairo. The Mansa pays well for guards and guides. Who among you is brave enough to cross the desert?'",
        choices: [
            {
                text: "Investigate - inquire about joining the caravan",
                outcomes: [
                    { chance: 0.35, result: 'gold_gain', message: 'The journey is long and hot, but successful. You reach Timbuktu and are paid in gold dust. The wealth of Mali is beyond imagination.', value: 180 },
                    { chance: 0.25, result: 'death', message: 'The desert claims you. Sandstorms, thirst, and raiders. You collapse beneath the burning sun, far from any city.' },
                    { chance: 0.25, result: 'knowledge', message: 'The caravan master teaches you the secret routes across the Sahara - knowledge worth more than gold to traders.', value: 'Trans-Saharan trade routes' },
                    { chance: 0.15, result: 'item', message: 'In Timbuktu, you trade for a leather-bound Quran manuscript - the city is famous for its book trade.', value: 'RELIGIOUS_TEXT' }
                ]
            },
            {
                text: "Ignore - the desert crossing is too dangerous",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You watch the caravan depart in a cloud of dust. Perhaps discretion is the better part of valor.' }
                ]
            }
        ]
    },

    // RENAISSANCE_EARLY_MODERN - EUROPEAN
    {
        id: 'renaissance_european_printing_press',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['EUROPEAN'],
        yearMin: 1450,
        yearMax: 1550,
        prompt: "In a basement workshop, a printer works frantically on a pamphlet. He sees you and quickly hides the pages. 'Forgive me - I'm nervous. These are... reformist texts. Criticizing the Church. If the authorities find these, I'll burn as a heretic. But the truth must be printed! I need someone to help distribute them tonight. Will you risk it?'",
        choices: [
            {
                text: "Investigate - help distribute the prohibited texts",
                outcomes: [
                    { chance: 0.3, result: 'reputation_gain', message: 'The pamphlets spread like wildfire. You become a secret hero of the Reformation - though few know your name.', value: 15 },
                    { chance: 0.3, result: 'death', message: 'Inquisitors catch you red-handed. You burn at the stake for heresy, your name added to the roll of martyrs.' },
                    { chance: 0.25, result: 'knowledge', message: 'The printer shares revolutionary ideas - Luther\'s theses, humanist philosophy, calls for reform. The printing press will change the world.', value: 'Reformation knowledge' },
                    { chance: 0.15, result: 'item', message: 'The grateful printer gives you a copy of a rare printed book - early printing is valuable beyond measure.', value: 'PRINTED_BOOK' }
                ]
            },
            {
                text: "Ignore - this is too dangerous, heresy means death",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You make your excuses and leave quickly. The next week, you hear the printer was arrested. The pamphlets never circulated.' }
                ]
            }
        ]
    },

    // RENAISSANCE_EARLY_MODERN - MENA
    {
        id: 'renaissance_mena_ottoman_janissary',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['MENA'],
        yearMin: 1450,
        yearMax: 1650,
        prompt: "A young Janissary - an elite Ottoman soldier - sits drunk in a tavern, weeping. 'They took me from my Christian family as a boy,' he sobs. 'Converted me. Trained me to kill. Now the Sultan orders us to Constantinople - there will be a great siege. I don't want to die for an empire that stole my childhood.' He looks at you desperately. 'Help me escape?'",
        choices: [
            {
                text: "Investigate - try to help him escape the Ottoman military",
                outcomes: [
                    { chance: 0.25, result: 'gold_gain', message: 'You smuggle him onto a Venetian ship. His grateful family in Serbia pays you a reward for his return.', value: 160 },
                    { chance: 0.35, result: 'death', message: 'It\'s a trap! He\'s testing for sedition. Ottoman guards arrest you as an enemy of the Sultan. Your execution is public and painful.' },
                    { chance: 0.25, result: 'knowledge', message: 'He explains the devshirme system - how the Ottomans conscript Christian boys and turn them into elite Muslim soldiers. A dark truth of empire.', value: 'Ottoman military intelligence' },
                    { chance: 0.15, result: 'item', message: 'He gives you his Janissary dagger as thanks - finely crafted Damascus steel.', value: 'DAMASCUS_DAGGER' }
                ]
            },
            {
                text: "Ignore - this could be a trap, or too dangerous either way",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You finish your drink and leave. Whether he was genuine or a spy, you\'ll never know. The Ottoman military is not to be trifled with.' }
                ]
            }
        ]
    },

    // RENAISSANCE_EARLY_MODERN - SOUTH_ASIAN
    {
        id: 'renaissance_south_asian_mughal_court',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['SOUTH_ASIAN'],
        yearMin: 1526,
        yearMax: 1700,
        prompt: "At the Mughal court, a magnificent elephant procession passes. A courtier approaches: 'The Emperor seeks talented individuals for his court - artists, scholars, musicians, warriors. Our court values excellence from all backgrounds, Hindu and Muslim alike. You have the look of someone with skills. Would you present yourself for consideration?'",
        choices: [
            {
                text: "Investigate - present yourself to the Mughal court",
                outcomes: [
                    { chance: 0.35, result: 'gold_gain', message: 'Your skills impress the court! The Emperor awards you a position and a generous stipend. The Mughal court is the richest in the world.', value: 200 },
                    { chance: 0.25, result: 'reputation_gain', message: 'Though not hired, you demonstrate excellence. The Emperor himself nods approvingly. Your name spreads among the nobility.', value: 20 },
                    { chance: 0.25, result: 'knowledge', message: 'You spend time at court observing the fusion of Persian, Hindu, and Central Asian cultures. The Mughal synthesis of traditions is remarkable.', value: 'Mughal cultural knowledge' },
                    { chance: 0.15, result: 'item', message: 'A court official gifts you a miniature painting - Mughal art at its finest.', value: 'MUGHAL_MINIATURE' }
                ]
            },
            {
                text: "Ignore - you prefer your independence to court service",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You politely decline. Court life has its dangers as well as its rewards. You prefer the freedom of the road.' }
                ]
            }
        ]
    },

    // RENAISSANCE_EARLY_MODERN - NORTH_AMERICAN_PRE_COLUMBIAN
    {
        id: 'renaissance_precolumbian_aztec_tribute',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
        yearMin: 1400,
        yearMax: 1520,
        prompt: "In the great market of Tenochtitlan, an angry crowd gathers around tribute collectors from the Emperor. A Tlaxcalan merchant shouts: 'This tribute is unjust! We already sent cacao, jade, and quetzal feathers this season. Now you demand our sons for sacrifice?' The imperial officials stand firm, hands on their obsidian-edged clubs. Violence seems imminent.",
        choices: [
            {
                text: "Investigate - try to mediate the dispute",
                outcomes: [
                    { chance: 0.3, result: 'reputation_gain', message: 'You remind both sides that tribute maintains the cosmic order - the Fifth Sun must be fed with blood. The crowd calms. The officials respect your knowledge of ritual law.', value: 15 },
                    { chance: 0.3, result: 'death', message: 'The Tlaxcalan merchant accuses you of being an imperial spy. The angry crowd turns on you, and obsidian blades flash. You die in the marketplace, another victim of the empire\'s brutal tribute system.' },
                    { chance: 0.25, result: 'knowledge', message: 'The dispute reveals the deep resentments of subject peoples - how the Aztec Empire is held together by fear. You learn which cities might rebel if given the chance.', value: 'Aztec imperial politics knowledge' },
                    { chance: 0.15, result: 'item', message: 'The grateful tribute collectors give you cacao beans as thanks for your support of imperial authority.', value: 'CACAO_BEANS' }
                ]
            },
            {
                text: "Ignore - stay out of imperial business",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You step back as temple guards arrive to enforce order. The tribute will be paid - the empire\'s demands are absolute. The resentful crowd disperses.' }
                ]
            }
        ]
    },

    // INDUSTRIAL_ERA - EUROPEAN
    {
        id: 'industrial_european_factory_child',
        era: HistoricalEra.INDUSTRIAL_ERA,
        culturalZones: ['EUROPEAN'],
        yearMin: 1800,
        yearMax: 1900,
        prompt: "Outside a textile factory, a young girl - no more than ten years old - collapses from exhaustion. Her fingers are bleeding from working the looms. A reformer rushes to help her: 'This is the face of industrialization! Children working fourteen hours a day! We must document this for Parliament - will you testify to what you've witnessed here?'",
        choices: [
            {
                text: "Investigate - agree to testify about child labor conditions",
                outcomes: [
                    { chance: 0.35, result: 'reputation_gain', message: 'Your testimony helps pass the Factory Act. Child labor restrictions save thousands of young lives. You\'re remembered as a reformer.', value: 20 },
                    { chance: 0.3, result: 'gold_loss', message: 'The factory owners blacklist you. Your business opportunities in this industrial city dry up. Standing for principle has costs.', value: 100 },
                    { chance: 0.25, result: 'knowledge', message: 'You investigate the factories deeply - learning the brutal economics of industrialization and the human cost of progress.', value: 'Industrial labor knowledge' },
                    { chance: 0.1, result: 'death', message: 'Factory thugs corner you in an alley. Reformers are bad for business. Your body is found in the river. The investigation goes nowhere.' }
                ]
            },
            {
                text: "Ignore - this is how industry works, not your concern",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You walk past the collapsed girl. The factory whistle blows. Another shift begins. Progress marches on.' }
                ]
            }
        ]
    },

    // INDUSTRIAL_ERA - EAST_ASIAN
    {
        id: 'industrial_east_asian_opium_den',
        era: HistoricalEra.INDUSTRIAL_ERA,
        culturalZones: ['EAST_ASIAN'],
        yearMin: 1840,
        yearMax: 1900,
        prompt: "In Shanghai, you pass an opium den - dozens of Chinese men lying in stupor. A Qing official stops you: 'British merchants flood our country with this poison. The Emperor banned it, but they keep smuggling. I'm gathering evidence for the court - photographs, testimony. The foreign powers must be stopped. Will you help document this national shame?'",
        choices: [
            {
                text: "Investigate - help document the opium trade's devastation",
                outcomes: [
                    { chance: 0.3, result: 'knowledge', message: 'You learn the dark economics - how Britain trades opium for tea and silver, deliberately addicting an entire nation for profit.', value: 'Opium War knowledge' },
                    { chance: 0.3, result: 'death', message: 'British merchants discover your activities. You\'re found dead in the harbor. Foreign concessions have extraterritorial rights - no investigation.' },
                    { chance: 0.25, result: 'reputation_gain', message: 'Your documentation reaches reformist circles. Chinese nationalists honor your courage in exposing foreign exploitation.', value: 18 },
                    { chance: 0.15, result: 'item', message: 'The official gives you a jade seal as thanks - a symbol of traditional China resisting foreign corruption.', value: 'JADE_SEAL' }
                ]
            },
            {
                text: "Ignore - foreign trade is a complex matter beyond you",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You decline involvement in such dangerous politics. The opium dens multiply. War with Britain looms on the horizon.' }
                ]
            }
        ]
    },

    // PREHISTORY - EUROPEAN
    {
        id: 'prehistory_european_refugee_band',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['EUROPEAN'],
        yearMin: -10000,
        yearMax: -4000,
        prompt: "A woman from another band arrives at your settlement, exhausted. 'Our hunting grounds failed. Twenty of us are starving.' Your group already struggles to feed everyone through winter. She's skilled with hide-working, but her band includes small children and two elders who can't hunt.",
        choices: [
            {
                text: "Accept them - more hands, but also more mouths",
                outcomes: [
                    { chance: 0.3, result: 'gold_loss', message: 'Shared resources are stretched thin. Your own food security drops dangerously. The hungry season will be harder than ever.', value: 50 },
                    { chance: 0.3, result: 'knowledge', message: 'They know a migration route for reindeer you didn\'t - following distant mountain ranges. This knowledge could save lives for generations.', value: 'Reindeer migration routes' },
                    { chance: 0.25, result: 'reputation_gain', message: 'Your band\'s generosity becomes known across the region. Other bands will remember this when you need help.', value: 15 },
                    { chance: 0.15, result: 'death', message: 'Disease they carry spreads through your settlement like wildfire. Within one moon cycle, half your people are dead. The survivors scatter.' }
                ]
            },
            {
                text: "Refuse - your own people come first",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You watch them leave into the forest. Some will die. You\'ll remember their faces, especially the children, for the rest of your life.' }
                ]
            }
        ]
    },

    // PREHISTORY - OCEANIA (original)
    {
        id: 'prehistory_oceania_obsidian_trade',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['OCEANIA'],
        yearMin: -1500,
        yearMax: 500,
        prompt: "The obsidian from your island makes the sharpest tools. A navigator from across the water offers: his people know where the big tuna spawn with the rains. He wants to trade knowledge - his fishing grounds for your stone quarry location. But if you show them the quarry, they might just take it.",
        choices: [
            {
                text: "Share the quarry location for fishing knowledge",
                outcomes: [
                    { chance: 0.35, result: 'knowledge', message: 'Their seasonal fishing grounds double your protein intake. The spawning grounds are rich beyond belief - the sea turns silver with fish.', value: 'Deep ocean fishing grounds' },
                    { chance: 0.3, result: 'gold_loss', message: 'They set up their own quarry, undercut your trade monopoly. Your island\'s main source of wealth evaporates within seasons.', value: 80 },
                    { chance: 0.25, result: 'reputation_gain', message: 'The trade network expands. Your island becomes a hub where distant peoples meet to exchange knowledge and goods.', value: 20 },
                    { chance: 0.1, result: 'death', message: 'They return with warriors, take the quarry by force, kill those who resist. You die defending stone.' }
                ]
            },
            {
                text: "Keep the quarry secret",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'Your obsidian trade continues, but fishing stays difficult. You wonder if you made the right choice as hunger gnaws each dry season.' }
                ]
            }
        ]
    },

    // PREHISTORY - OCEANIA (tattoo)
    {
        id: 'prehistory_oceania_tattoo_mistake',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['OCEANIA'],
        yearMin: -3000,
        yearMax: 500,
        prompt: "A young person sits while an elder taps dark pigment into their skin with a sharp tool. The pattern is specific, detailed. Blood runs. They don't flinch. You watch. Another elder approaches you: 'That pattern isn't for their family line. Someone made a mistake. Should I tell them, or is it too late to fix?'",
        choices: [
            {
                text: "Tell them about the mistake",
                outcomes: [
                    { chance: 0.4, result: 'reputation_gain', message: 'The tattoo artist is horrified, stops immediately. The young person is grateful - wrong patterns can mean exile. You saved them.', value: 18 },
                    { chance: 0.35, result: 'reputation_loss', message: 'The tattoo artist is furious you questioned their work publicly. The pattern was INTENTIONAL - adoption into a new line. You insulted everyone.', value: 20 },
                    { chance: 0.15, result: 'death', message: 'You\'ve revealed sacred knowledge you shouldn\'t have. How did you know that pattern was wrong? Only initiates know. They think you stole secrets. You die for it.' },
                    { chance: 0.1, result: 'knowledge', message: 'The elder explains the entire lineage pattern system to you - which marks mean what, how families are traced. Rare knowledge.', value: 'Polynesian tattoo lineage knowledge' }
                ]
            },
            {
                text: "Say nothing, not your business",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'The tattooing continues for hours. The pattern is permanent. Whether it was right or wrong, it\'s done now.' }
                ]
            }
        ]
    },

    // PREHISTORY - EAST_ASIAN
    {
        id: 'prehistory_east_asian_fired_clay',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['EAST_ASIAN'],
        yearMin: -8000,
        yearMax: -2000,
        prompt: "At the riverside, a woman is heating clay pots in a pit of coals. One cracks loudly. She curses, pulls it out. You watch. She notices you. 'The clay from upstream works better,' she says. 'But that's their territory. You know anyone who trades upriver?'",
        choices: [
            {
                text: "Offer to help her get upstream clay",
                outcomes: [
                    { chance: 0.35, result: 'gold_gain', message: 'You negotiate access. Her pottery becomes famous for its strength. She pays you a percentage of every pot sold. Steady income.', value: 45 },
                    { chance: 0.3, result: 'knowledge', message: 'She teaches you the firing technique in gratitude. The exact temperature, the type of wood, how to tell when it\'s ready. Valuable craft knowledge.', value: 'Pottery firing technique' },
                    { chance: 0.25, result: 'nothing', message: 'The upstream people refuse. Their clay is sacred, not for trade. She thanks you for trying, continues with inferior local clay.' },
                    { chance: 0.1, result: 'item', message: 'In gratitude, she gives you her best pot - perfectly fired, waterproof, unbreakable. One of the first ceramic vessels ever made.', value: 'ANCIENT_CERAMIC_POT' }
                ]
            },
            {
                text: "Keep walking, not your concern",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'She returns to her work. The cracked pot sits discarded. She\'ll keep trying with local clay.' }
                ]
            }
        ]
    },

    // PREHISTORY - MENA
    {
        id: 'prehistory_mena_planted_grain',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['MENA'],
        yearMin: -10000,
        yearMax: -3000,
        prompt: "You pass rows of wild grasses, clearly tended - weeded, watered. Not natural. An old man sits watching the field. 'First time seeing planted grain?' he asks. 'Most people think I'm crazy. Walking wastes of good hunting time, they say.' He gestures at the tall stalks. 'But look at it grow.'",
        choices: [
            {
                text: "Ask to learn his technique",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'He explains everything: when to plant, how deep, which grains to save for next year. You\'re learning agriculture at its birth.', value: 'Early agriculture technique' },
                    { chance: 0.3, result: 'gold_gain', message: 'He gives you seeds and teaches you. Your own planted field succeeds. Within years, you have surplus to trade. Everything changes.', value: 80 },
                    { chance: 0.2, result: 'nothing', message: 'He explains, but it seems like too much work for uncertain reward. Hunting is reliable. You stick with the old ways.' },
                    { chance: 0.1, result: 'death', message: 'The hunters find out you\'re learning farming. They see it as betrayal of the hunting way. You\'re cast out, alone. You don\'t survive the winter.' }
                ]
            },
            {
                text: "Move on, seems like wasted effort",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You continue hunting and gathering like your ancestors. The old man tends his field. One way will outlast the other. Just not today.' }
                ]
            }
        ]
    },

    // PREHISTORY - NORTH_AMERICAN_PRE_COLUMBIAN
    {
        id: 'prehistory_precolumbian_weir_dispute',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
        yearMin: -8000,
        yearMax: -1000,
        prompt: "Two groups are shouting at a salmon weir. Fish are running, jumping. One group has spears ready, the other is blocking the weir. A woman turns to you: 'Who was here first? You walked past at dawn, right?' She wants you to lie for her.",
        choices: [
            {
                text: "Lie, say she was here first",
                outcomes: [
                    { chance: 0.35, result: 'gold_gain', message: 'Her group gets the catch. Later, she shares generously with you - dried salmon, enough for weeks. The lie paid off.', value: 35 },
                    { chance: 0.35, result: 'reputation_loss', message: 'The other group saw you arrive after dawn. You couldn\'t have seen anything. They know you lied. Your word means nothing here now.', value: 25 },
                    { chance: 0.2, result: 'death', message: 'Violence erupts over the lie. Spears are thrown. You\'re caught in it, killed by a spear meant for someone else. Salmon still running.' },
                    { chance: 0.1, result: 'reputation_gain', message: 'Your lie prevented bloodshed. Both groups eventually share the weir. The woman tells others you\'re clever, worth knowing.', value: 12 }
                ]
            },
            {
                text: "Refuse to lie, say you don't know",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'They argue for another hour, then agree to share. The salmon run is short. Time wasted arguing is fish lost.' }
                ]
            }
        ]
    },

    // PREHISTORY - SOUTH_ASIAN
    {
        id: 'prehistory_south_asian_cattle_trampled',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['SOUTH_ASIAN'],
        yearMin: -7000,
        yearMax: -2000,
        prompt: "A herder drives cattle through the settlement. One bull breaks free, tramples a grain-drying area. The herder keeps moving. A man runs after him, shouting. The herder ignores him. The man looks at you: 'You saw it, right? He owes compensation.'",
        choices: [
            {
                text: "Agree to testify about the damage",
                outcomes: [
                    { chance: 0.35, result: 'gold_gain', message: 'The herder is forced to pay. The grain owner gives you a share for being honest witness. Justice, and profit.', value: 25 },
                    { chance: 0.3, result: 'nothing', message: 'Elders hear the case. They rule the grain should\'ve been stored properly. Herder pays nothing. Your testimony meant nothing.' },
                    { chance: 0.25, result: 'reputation_gain', message: 'Your honest testimony gains respect. People remember you as someone who tells truth, helps neighbors. Valuable reputation.', value: 15 },
                    { chance: 0.1, result: 'injury', message: 'The herder\'s family ambushes you on the road. Beat you badly. Message sent: don\'t testify against herders.', value: 15 }
                ]
            },
            {
                text: "Say you didn't see anything",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'The man curses you, tries to find other witnesses. The herder is long gone. The grain is ruined. Not your problem.' }
                ]
            }
        ]
    },

    // PREHISTORY - SOUTH_AMERICAN
    {
        id: 'prehistory_south_american_coca_offer',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['SOUTH_AMERICAN'],
        yearMin: -8000,
        yearMax: -1000,
        prompt: "Someone is chewing leaves, spitting them into a bowl. Their eyes are alert, too alert. They work steadily for hours without stopping. Strange. You ask what the leaves are. 'Coca. From the high valleys,' they say. 'Want to try? You won't feel hungry for days.'",
        choices: [
            {
                text: "Try the coca leaves",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'The effect is profound - exhaustion vanishes, altitude sickness fades, hunger disappears. You understand why high-valley people treasure this plant.', value: 'Coca traditional use knowledge' },
                    { chance: 0.3, result: 'gold_gain', message: 'The leaves work as promised. You travel further in one day than ever before. Your trading range expands dramatically. More opportunities.', value: 40 },
                    { chance: 0.2, result: 'injury', message: 'Your heart races too fast. You collapse, can\'t breathe right. They revive you eventually, but your heart is damaged. Never quite right again.', value: 18 },
                    { chance: 0.1, result: 'item', message: 'They give you a pouch of prepared leaves as gift. "For long journeys," they say. Valuable for mountain travel.', value: 'COCA_LEAVES' }
                ]
            },
            {
                text: "Decline, seems risky",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'They shrug, keep working with inhuman stamina. You walk on, tired and hungry like normal. Safer that way.' }
                ]
            }
        ]
    },

    // PREHISTORY - SUB_SAHARAN_AFRICAN
    {
        id: 'prehistory_subsaharan_strange_metal',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['SUB_SAHARAN_AFRICAN'],
        yearMin: -10000,
        yearMax: -2000,
        prompt: "Smoke rises from a pit where people are heating reddish rocks to extreme temperatures. Something black and liquid oozes out. Not copper - darker, harder when it cools. A boy pokes the cooled piece with a stick. It doesn't bend. 'My uncle found the rocks two valleys over,' he says. 'Nobody else knows where yet.'",
        choices: [
            {
                text: "Offer to trade for the location",
                outcomes: [
                    { chance: 0.35, result: 'knowledge', message: 'They teach you where and how to find the ore. You\'re learning iron-working before anyone else in the region. Revolutionary knowledge.', value: 'Early iron ore location' },
                    { chance: 0.3, result: 'gold_loss', message: 'You trade goods for the location. You find the rocks, but can\'t recreate the extreme heat needed. The knowledge is worthless without technique.', value: 60 },
                    { chance: 0.25, result: 'item', message: 'They sell you a blade made from the black metal. It holds an edge better than anything you\'ve seen. Worth a fortune.', value: 'PROTO_IRON_BLADE' },
                    { chance: 0.1, result: 'death', message: 'You found the site. But so did others, following you. Fight over the precious ore location. You die in the ambush.' }
                ]
            },
            {
                text: "Just watch, don't get involved",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'The boy\'s uncle guards his secret. Within a generation, iron spreads across the region. You saw it first, learned nothing.' }
                ]
            }
        ]
    },

    // PREHISTORY - EUROPEAN (amber)
    {
        id: 'prehistory_european_amber_trade',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['EUROPEAN'],
        yearMin: -6000,
        yearMax: -2000,
        prompt: "A trader displays golden stones - warm, lighter than they look. 'Amber from the cold seas,' he says. 'Protects children from sickness.' An expensive piece. A woman asks you: 'Worth it? You look like you've traveled. Is this real or is he cheating me?'",
        choices: [
            {
                text: "Tell her it's real, worth buying",
                outcomes: [
                    { chance: 0.4, result: 'reputation_gain', message: 'She buys it. Her child recovers from fever days later. Coincidence or not, she credits you. Your advice is sought after now.', value: 15 },
                    { chance: 0.3, result: 'reputation_loss', message: 'She buys it. Her child dies anyway. She blames you for encouraging the waste of resources on useless stones. Your advice cost a life.', value: 18 },
                    { chance: 0.2, result: 'gold_gain', message: 'The trader, grateful for the endorsement, gives you a commission. You just became an amber salesman. Profitable if dubious.', value: 30 },
                    { chance: 0.1, result: 'item', message: 'The trader gifts you a small piece of amber in thanks. It is beautiful, even if its power is questionable.', value: 'AMBER_PENDANT' }
                ]
            },
            {
                text: "Say you don't know, can't advise",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'She decides not to risk it. The trader packs up, moves on. You\'ll never know if the amber worked or not.' }
                ]
            }
        ]
    },

    // ANTIQUITY - EUROPEAN (Greek)
    {
        id: 'antiquity_european_greek_coin',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['EUROPEAN'],
        yearMin: -500,
        yearMax: 300,
        prompt: "In the market, a merchant holds up a coin to the light, bites it. 'This is fake,' he says flatly. The farmer who offered it looks panicked. 'No, I got it from the grain buyer last week!' A crowd forms. The merchant turns to you. 'You look traveled. Is this silver or lead covered in silver?'",
        choices: [
            {
                text: "Examine the coin and give your opinion",
                outcomes: [
                    { chance: 0.35, result: 'reputation_gain', message: 'You identify it correctly - lead core, silver coating. Your knowledge of coinage spreads. Merchants seek your expertise.', value: 15 },
                    { chance: 0.3, result: 'gold_gain', message: 'It\'s actually real silver - just worn. The grateful farmer pays you a finder\'s fee for saving his transaction.', value: 45 },
                    { chance: 0.25, result: 'reputation_loss', message: 'You call it fake but you\'re wrong - it\'s genuine Athenian silver. Both parties now think you\'re an ignorant fool.', value: 18 },
                    { chance: 0.1, result: 'item', message: 'The merchant, impressed by your knowledge, gives you a genuine Corinthian stater as payment for your expertise.', value: 'ANCIENT_COIN' }
                ]
            },
            {
                text: "Say you can't tell, not your expertise",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'They call for an official assayer. Takes three hours. The coin is fake. The farmer is arrested. You could\'ve saved time.' }
                ]
            }
        ]
    },

    // ANTIQUITY - EUROPEAN (Celtic)
    {
        id: 'antiquity_european_celtic_head',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['EUROPEAN'],
        yearMin: -400,
        yearMax: 100,
        prompt: "Outside a chieftain's hall, preserved heads are displayed on posts. Trophies from battle. Fresh one was just added - the features still recognizable. A woman weeps quietly nearby. An old warrior notices you staring. 'First time seeing our customs?' he asks. 'That head is my brother's enemy. Died with honor. Want to hear how?'",
        choices: [
            {
                text: "Listen to the warrior's story",
                outcomes: [
                    { chance: 0.35, result: 'knowledge', message: 'He explains Celtic head-taking rituals - how they preserve souls, maintain warrior honor, intimidate enemies. Dark knowledge.', value: 'Celtic warrior cult knowledge' },
                    { chance: 0.3, result: 'reputation_gain', message: 'The warrior appreciates your respect for traditions. He offers guest-friendship - protection and hospitality anywhere his tribe controls.', value: 18 },
                    { chance: 0.25, result: 'item', message: 'He gifts you a warrior\'s torc as thanks for listening. "Few outsiders understand our ways," he says.', value: 'IRON_TORC' },
                    { chance: 0.1, result: 'death', message: 'You accidentally insult the dead warrior\'s memory. His kinsmen take offense. You become the next head on a post.' }
                ]
            },
            {
                text: "Move away, this is disturbing",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You leave quickly. The heads watch with empty eyes. The woman\'s weeping follows you down the path.' }
                ]
            }
        ]
    },

    // ANTIQUITY - EAST_ASIAN (Early Bronze/Shang)
    {
        id: 'antiquity_east_asian_oracle_bones',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['EAST_ASIAN'],
        yearMin: -1600,
        yearMax: -1000,
        prompt: "A diviner sits before a fire, heating turtle shells until they crack. He reads the patterns intently, writing strange symbols on the bone with a brush. 'The ancestors say the harvest will fail unless we sacrifice three oxen,' he announces. The village headman looks worried - three oxen is everything. He glances at you. 'Stranger, you've seen omens. Does this seem right?'",
        choices: [
            {
                text: "Support the diviner's reading",
                outcomes: [
                    { chance: 0.35, result: 'reputation_gain', message: 'The sacrifice is made. The harvest succeeds - pure luck, but they credit the divination. You\'re seen as wise in spiritual matters.', value: 15 },
                    { chance: 0.3, result: 'gold_loss', message: 'Harvest fails anyway. The village blames you for supporting bad divination. You\'re forced to contribute to their losses.', value: 80 },
                    { chance: 0.25, result: 'knowledge', message: 'The diviner teaches you the ancient script on the bones - the earliest Chinese writing. Incredibly rare knowledge.', value: 'Oracle bone script knowledge' },
                    { chance: 0.1, result: 'item', message: 'The diviner gives you a cracked oracle bone with divination marks. "Keep this. Study it. Few understand the ancestors\' language."', value: 'ORACLE_BONE' }
                ]
            },
            {
                text: "Question the divination, seems excessive",
                outcomes: [
                    { chance: 0.4, result: 'reputation_loss', message: 'The diviner is furious. Villagers shun you as someone who disrespects ancestors and brings bad luck.', value: 20 },
                    { chance: 0.35, result: 'death', message: 'Your skepticism is seen as dangerous impiety. The ancestors must be appeased. You become the sacrifice instead of the oxen.' },
                    { chance: 0.25, result: 'nothing', message: 'They ignore your doubts, make the sacrifice. You\'ll never know if it was necessary or not.' }
                ]
            }
        ]
    },

    // ANTIQUITY - EAST_ASIAN (Warring States)
    {
        id: 'antiquity_east_asian_checkpoint',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['EAST_ASIAN'],
        yearMin: -475,
        yearMax: -221,
        prompt: "The border checkpoint between Wei and Zhao territories. Guards in leather armor stop everyone, demanding travel permits. The man ahead of you has no papers - just a desperate story about fleeing conscription. They're dragging him away. You have papers, but they're slightly expired. The guard hasn't noticed yet.",
        choices: [
            {
                text: "Point out your papers, hope they pass",
                outcomes: [
                    { chance: 0.4, result: 'nothing', message: 'The guard barely glances at them, waves you through. Too busy with quota arrests to scrutinize every traveler.' },
                    { chance: 0.3, result: 'gold_loss', message: 'He spots the expiration date. "This will require... administrative processing." You pay the bribe. He stamps them current.', value: 50 },
                    { chance: 0.2, result: 'death', message: 'Your papers are from an enemy state currently at war. You didn\'t know. Guards execute you as a spy at the checkpoint.' },
                    { chance: 0.1, result: 'reputation_gain', message: 'The guard recognizes your merchant guild seal. "Any friend of the guild passes free." Connections matter more than paperwork.', value: 12 }
                ]
            },
            {
                text: "Try to slip past without showing papers",
                outcomes: [
                    { chance: 0.5, result: 'injury', message: 'Caught immediately. Beaten for trying to evade. Thrown in a cell for three days before being released.', value: 20 },
                    { chance: 0.3, result: 'death', message: 'Guards assume you\'re a spy or deserter. Summary execution. Your body joins others in the ditch by the road.' },
                    { chance: 0.2, result: 'gold_gain', message: 'You slip through during a shift change. Pure luck. You\'re across the border with money saved on bribes.', value: 50 }
                ]
            }
        ]
    },

    // ANTIQUITY - MENA (Phoenician)
    {
        id: 'antiquity_mena_purple_dye',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['MENA'],
        yearMin: -1000,
        yearMax: 300,
        prompt: "Near the harbor, thousands of murex shells are piled high. The smell is overwhelming - rotting shellfish fermenting in the sun. Workers extract tiny amounts of purple dye, hands stained permanently. A dye-master calls out: 'Need workers! Good pay! The imperial purple trade!' The smell makes you gag. The pay is real money.",
        choices: [
            {
                text: "Take the dye-works job",
                outcomes: [
                    { chance: 0.35, result: 'gold_gain', message: 'The pay is excellent. You save enough to start your own business. Your hands will be purple-stained forever though.', value: 120 },
                    { chance: 0.3, result: 'injury', message: 'The chemicals and constant exposure ruin your health. Respiratory damage. You earn money but can\'t breathe right anymore.', value: 25 },
                    { chance: 0.25, result: 'knowledge', message: 'You learn the secret ratios - how many shells per gram of dye, the fermentation time. Phoenician trade secrets.', value: 'Purple dye production knowledge' },
                    { chance: 0.1, result: 'item', message: 'The master gives you a small cloth dyed true Tyrian purple as severance pay. Worth more than gold by weight.', value: 'PURPLE_DYE_CLOTH' }
                ]
            },
            {
                text: "The smell is too much, keep looking for work",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You move upwind. The purple trade makes Phoenicia rich, but you\'ll find another way to earn.' }
                ]
            }
        ]
    },

    // ANTIQUITY - MENA (Bronze Age)
    {
        id: 'antiquity_mena_cylinder_seal',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['MENA'],
        yearMin: -3000,
        yearMax: -500,
        prompt: "A merchant displays cylinder seals carved from lapis lazuli. Roll them in clay, they leave marks proving ownership, contracts, identity. 'Every civilized person needs a seal,' he says. Beautiful craftsmanship, but expensive. A scribe nearby whispers: 'Half of what he sells are forgeries. Can you tell the difference?'",
        choices: [
            {
                text: "Try to identify which seals are real",
                outcomes: [
                    { chance: 0.35, result: 'item', message: 'You identify a genuine seal from the Akkadian period. The merchant, impressed, sells it to you at a fair price.', value: 'CYLINDER_SEAL' },
                    { chance: 0.3, result: 'gold_loss', message: 'You buy what you think is genuine. It\'s fake. You learn the hard way: recent carving passed off as ancient.', value: 70 },
                    { chance: 0.25, result: 'knowledge', message: 'The scribe teaches you to read seal marks - which symbols mean what, how to date them by style. Valuable expertise.', value: 'Cylinder seal authentication' },
                    { chance: 0.1, result: 'reputation_gain', message: 'You expose the merchant\'s forgeries publicly. Honest traders appreciate this. You gain trust in the market.', value: 18 }
                ]
            },
            {
                text: "Too risky, don't buy anything",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You walk away. Without a seal, some contracts will be harder to make. But better than owning a forgery.' }
                ]
            }
        ]
    },

    // ANTIQUITY - SOUTH_ASIAN (Indus Valley)
    {
        id: 'antiquity_south_asian_standard_weights',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['SOUTH_ASIAN'],
        yearMin: -2600,
        yearMax: -1900,
        prompt: "In the marketplace, every merchant uses identical stone weights - perfectly graduated, precise ratios. A trader from the north doesn't have the standard weights. Her scales use irregular stones. 'Same weight!' she insists, but no one will trade with her. The market inspector approaches.",
        choices: [
            {
                text: "Testify that her weights seem fair",
                outcomes: [
                    { chance: 0.35, result: 'reputation_loss', message: 'The inspector checks with proper weights. Hers are off by 20%. You vouched for a cheater. Your word means less now.', value: 20 },
                    { chance: 0.3, result: 'gold_gain', message: 'You help her get proper weights. She trades successfully and shares profit with you for the assistance.', value: 40 },
                    { chance: 0.25, result: 'knowledge', message: 'The inspector explains the standardization system - same weights across hundreds of cities. You\'re witnessing early industrial standardization.', value: 'Indus Valley trade standards' },
                    { chance: 0.1, result: 'nothing', message: 'The inspector ignores your testimony, enforces standards anyway. Rules are rules in this civilization.' }
                ]
            },
            {
                text: "Stay out of trade disputes",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'She\'s expelled from the market. Standards are sacred here. You watch her pack up and leave, angry and confused.' }
                ]
            }
        ]
    },

    // ANTIQUITY - SOUTH_ASIAN (Iron Age)
    {
        id: 'antiquity_south_asian_sacred_ash',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['SOUTH_ASIAN'],
        yearMin: -600,
        yearMax: 300,
        prompt: "A wandering holy man sits by the cremation ground, smearing his body with ash from the funeral pyres. He collects some in a bowl, offers to sell it. 'Sacred ash from holy fire. Brings blessings, wards off evil spirits.' He wants silver for it. It's literally ash from burning corpses.",
        choices: [
            {
                text: "Buy the sacred ash",
                outcomes: [
                    { chance: 0.4, result: 'reputation_gain', message: 'Local people see you respect their holy men and customs. This opens doors - you\'re not just another foreign trader.', value: 15 },
                    { chance: 0.3, result: 'gold_loss', message: 'You pay for ash. It does nothing. You feel foolish. But the holy man blesses you anyway, if that matters.', value: 30 },
                    { chance: 0.2, result: 'knowledge', message: 'He explains the entire cosmology - death, rebirth, the sacred and profane. You learn deep Hindu philosophical concepts.', value: 'Hindu death ritual knowledge' },
                    { chance: 0.1, result: 'item', message: 'He gives you a genuine sacred item - a small stone lingam. "The ash was a test. You passed. Take this instead."', value: 'SACRED_STONE' }
                ]
            },
            {
                text: "Refuse, this is just corpse ash",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'He shrugs, finds another buyer within minutes. Your skepticism means nothing to faith.' }
                ]
            }
        ]
    },

    // ANTIQUITY - SOUTH_AMERICAN (Olmec)
    {
        id: 'antiquity_south_american_olmec_head',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['SOUTH_AMERICAN'],
        yearMin: -1200,
        yearMax: -400,
        prompt: "Hundreds of workers drag a massive stone head - as tall as three men. Carved features, distinctive helmet. It weighs tons. They've been moving it for weeks from the quarry. A worker collapses from exhaustion. The overseer barely notices, keeps everyone pulling. You could help. Or you could watch history being made.",
        choices: [
            {
                text: "Join the workers pulling the stone",
                outcomes: [
                    { chance: 0.35, result: 'reputation_gain', message: 'The workers remember you helped without being forced. They share food, teach you their language. You\'re accepted.', value: 18 },
                    { chance: 0.3, result: 'injury', message: 'A rope snaps. The stone shifts. You\'re caught underneath for a moment. Crushed foot. You\'ll limp forever.', value: 30 },
                    { chance: 0.25, result: 'knowledge', message: 'You learn their engineering - log rollers, rope techniques, leverage systems. Moving megalithic stones without wheels or metal.', value: 'Olmec engineering knowledge' },
                    { chance: 0.1, result: 'gold_gain', message: 'The chief pays every worker when the head is positioned. Your day\'s labor earns you jade beads.', value: 35 }
                ]
            },
            {
                text: "Watch from a safe distance",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'It takes another week, three more deaths. But the head stands now, eternal. You witnessed it but weren\'t part of it.' }
                ]
            }
        ]
    },

    // ANTIQUITY - SOUTH_AMERICAN (Early Horizon/Chavin)
    {
        id: 'antiquity_south_american_poison_gathering',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['SOUTH_AMERICAN'],
        yearMin: -900,
        yearMax: -200,
        prompt: "Coastal people gather a specific type of shellfish. They wear wrappings on their hands, work carefully. 'The poison in these kills enemies,' one explains. 'Coat arrows, darts. Paralysis, then death.' They're collecting enough to poison hundreds of weapons. They notice you watching.",
        choices: [
            {
                text: "Ask to learn about the poison",
                outcomes: [
                    { chance: 0.35, result: 'knowledge', message: 'They teach you which shellfish, how to extract safely, how to concentrate the toxin. Dangerous knowledge, but valuable.', value: 'Shellfish poison knowledge' },
                    { chance: 0.3, result: 'injury', message: 'You touch the wrong part. Immediate numbness spreads up your arm. They treat you, you survive, but nerve damage remains.', value: 20 },
                    { chance: 0.25, result: 'item', message: 'They give you a small vial of prepared poison as a gift. "For your spear. One scratch kills."', value: 'POISON_VIAL' },
                    { chance: 0.1, result: 'death', message: 'You mishandle the extraction. The poison enters through a cut. Paralysis takes you in minutes. They bury you on the beach.' }
                ]
            },
            {
                text: "Too dangerous, stay back",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You watch from upwind. They finish their harvest, pack the shellfish carefully. War is coming, clearly.' }
                ]
            }
        ]
    },

    // ANTIQUITY - SUB_SAHARAN_AFRICAN (Early Iron Age)
    {
        id: 'antiquity_subsaharan_furnace_dispute',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['SUB_SAHARAN_AFRICAN'],
        yearMin: -1000,
        yearMax: 200,
        prompt: "Two iron smelters argue over furnace design. One uses a tall shaft, the other a bowl shape. 'Mine gets hotter!' 'Mine wastes less charcoal!' They've been shouting for an hour. Both have produced iron, both designs work. Now they want you to judge which is better.",
        choices: [
            {
                text: "Try to judge the furnace designs",
                outcomes: [
                    { chance: 0.35, result: 'knowledge', message: 'Both explain their techniques in detail trying to convince you. You learn two different methods of iron smelting.', value: 'Iron smelting techniques' },
                    { chance: 0.3, result: 'reputation_loss', message: 'You choose one. The other smelter is furious, spreads word you\'re biased and ignorant. Half the smiths won\'t work with you.', value: 18 },
                    { chance: 0.25, result: 'reputation_gain', message: 'You suggest they\'re both right for different purposes. Your diplomatic wisdom impresses the elders. You\'re asked to mediate other disputes.', value: 15 },
                    { chance: 0.1, result: 'item', message: 'The winner (picked randomly) gives you an iron blade as thanks. The first iron you\'ve owned.', value: 'IRON_BLADE' }
                ]
            },
            {
                text: "Refuse to judge, not your expertise",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'The argument continues for days. Eventually both build furnaces side-by-side to prove their point. Both work. Neither admits defeat.' }
                ]
            }
        ]
    },

    // ANTIQUITY - SUB_SAHARAN_AFRICAN (Carthage/Punic)
    {
        id: 'antiquity_subsaharan_child_dedication',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['SUB_SAHARAN_AFRICAN'],
        yearMin: -814,
        yearMax: -146,
        prompt: "At the tophet, a Carthaginian merchant prepares to dedicate his infant son to Baal Hammon. The child will be... offered. It's their custom in times of crisis - plague is spreading. The merchant's Egyptian wife weeps, begs someone to intervene. Greek traders mutter disapproval. But this is Carthage, not Greece.",
        choices: [
            {
                text: "Try to talk the merchant out of it",
                outcomes: [
                    { chance: 0.3, result: 'reputation_loss', message: 'Carthaginians see you as interfering foreigner who doesn\'t understand their sacred duties. You\'re banned from the best trade guilds.', value: 20 },
                    { chance: 0.3, result: 'death', message: 'Your interference is seen as blasphemy in a holy place. The priests demand you be silenced. You are.' },
                    { chance: 0.25, result: 'gold_loss', message: 'You offer to pay for a substitute sacrifice - expensive rams instead. The priests accept your gold. The child lives.', value: 100 },
                    { chance: 0.15, result: 'knowledge', message: 'The merchant explains the theology - how child sacrifice proves devotion, how Baal demands the most precious. Dark knowledge of Punic faith.', value: 'Carthaginian religious practices' }
                ]
            },
            {
                text: "This is their custom, stay silent",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'The ritual proceeds. The mother\'s screams echo. The priests chant. You look away but can\'t unhear it.' }
                ]
            }
        ]
    },

    // ANTIQUITY - SUB_SAHARAN_AFRICAN (established)
    {
        id: 'antiquity_subsaharan_christian_conversion',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['SUB_SAHARAN_AFRICAN'],
        yearMin: 100,
        yearMax: 700,
        prompt: "In the market, a merchant's son refuses to pour libations for his dead grandfather. 'I'm Christian now,' he says loudly. 'These are pagan rites.' His father, still practicing traditional religion, is furious - without proper ancestor veneration, the family business will be cursed. Neighbors are taking sides.",
        choices: [
            {
                text: "Support the son's Christian conversion",
                outcomes: [
                    { chance: 0.3, result: 'reputation_gain', message: 'The Bishop praises your support of the new faith. Church connections open trade routes to Byzantine merchants.', value: 15 },
                    { chance: 0.3, result: 'reputation_loss', message: 'Traditional families boycott you as destroyer of customs. Elders whisper that you\'ve abandoned your own ancestors.', value: 15 },
                    { chance: 0.25, result: 'knowledge', message: 'The son teaches you Greek letters. You can read now - contracts, scripture, messages from distant cities.', value: 'Greek literacy' },
                    { chance: 0.15, result: 'gold_loss', message: 'The family splits apart publicly. The business collapses. You\'re dragged into the financial mess as a supporter.', value: 60 }
                ]
            },
            {
                text: "Stay out of family and religious disputes",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'The family\'s shouting continues for weeks. Eventually the son moves to the Christian quarter. The father dies bitter, still cursing the new god.' }
                ]
            }
        ]
    },

    // ANTIQUITY - NORTH_AMERICAN_PRE_COLUMBIAN
    {
        id: 'antiquity_precolumbian_mound_workers',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
        yearMin: -200,
        yearMax: 500,
        prompt: "The burial mound crew stops working. 'We need better food,' their leader says. 'Corn mush twice a day isn't enough for moving earth.' The chief commissioned this mound for his father's burial - if it's not finished before the next moon, he loses face with rival chiefs. But the food stores are already low.",
        choices: [
            {
                text: "Side with the workers - demand better rations",
                outcomes: [
                    { chance: 0.35, result: 'reputation_gain', message: 'Workers across the region remember you stood with them. When you need labor later, people come willingly.', value: 15 },
                    { chance: 0.3, result: 'gold_loss', message: 'The chief punishes you economically, blocks your access to the best hunting grounds and trade networks.', value: 70 },
                    { chance: 0.25, result: 'death', message: 'The chief sees this as rebellion. You\'re quietly killed as a troublemaker - found drowned in the river, "accident" they say.' },
                    { chance: 0.1, result: 'knowledge', message: 'Workers share construction techniques from other mound sites - how to prevent collapse, optimal earth mixture.', value: 'Earthwork engineering knowledge' }
                ]
            },
            {
                text: "Support the chief - the mound must be finished",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'Workers grumble but finish on schedule. Three collapse from exhaustion. The mound stands impressive. No one mentions the dead workers.' }
                ]
            }
        ]
    },

    // MEDIEVAL - SOUTH_ASIAN
    {
        id: 'medieval_south_asian_debt_servant',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['SOUTH_ASIAN'],
        yearMin: 1000,
        yearMax: 1400,
        prompt: "A Muslim merchant's ship was delayed by monsoon. The Hindu moneylenders who funded his voyage want payment today or they'll take his daughter as a debt servant until he pays. 'The cargo is coming!' he pleads. 'Just three more weeks!' The lenders are within their legal rights under local custom. The merchant looks at you desperately.",
        choices: [
            {
                text: "Loan him money to pay the debt",
                outcomes: [
                    { chance: 0.35, result: 'gold_gain', message: 'Ship arrives loaded with pepper and cinnamon. He pays you back with generous interest, grateful forever. A valuable ally gained.', value: 120 },
                    { chance: 0.3, result: 'gold_loss', message: 'The ship was actually lost at sea. He lied out of desperation. You\'re out the money, he\'s ruined, his daughter is taken anyway.', value: 100 },
                    { chance: 0.25, result: 'reputation_gain', message: 'Both Hindu and Muslim communities praise your bridge-building across religious lines. Trust grows in divided times.', value: 18 },
                    { chance: 0.1, result: 'death', message: 'The moneylenders see you as interfering with their business. They arrange an accident - bad fall from a warehouse roof.' }
                ]
            },
            {
                text: "The law is the law, stay out of it",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'The daughter is taken. You see her months later in the moneylender\'s house, serving tea to guests. She\'s twelve years old.' }
                ]
            }
        ]
    },

    // MEDIEVAL - NORTH_AMERICAN_PRE_COLUMBIAN
    {
        id: 'medieval_precolumbian_maize_mold',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
        yearMin: 1000,
        yearMax: 1300,
        prompt: "The maize stores are blackening with mold. This is disaster - the chief's prestige, the city's food supply, all threatened. Someone must have broken a taboo, angered the spirits. The priests demand you help identify the guilty party. They're already eyeing strangers and the poor quarter.",
        choices: [
            {
                text: "Help investigate - find who violated taboo",
                outcomes: [
                    { chance: 0.3, result: 'knowledge', message: 'You learn the granary was built wrong - poor ventilation caused the mold. An engineering lesson, but too late for this harvest.', value: 'Granary construction knowledge' },
                    { chance: 0.3, result: 'death', message: 'You\'re randomly chosen as the guilty party to satisfy the mob\'s need for someone to blame. You die protesting your innocence.' },
                    { chance: 0.25, result: 'reputation_loss', message: 'You identify an innocent person under pressure. They\'re killed. When the truth comes out later, your name is mud.', value: 20 },
                    { chance: 0.15, result: 'nothing', message: 'Investigation goes nowhere. The stores are lost. The city faces a hungry season. No one is satisfied.' }
                ]
            },
            {
                text: "Refuse to participate in scapegoating",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'They find someone anyway - a widow from the poor quarter. She\'s clubbed to death in the plaza while everyone watches.' }
                ]
            }
        ]
    },

    // MEDIEVAL - EUROPEAN
    {
        id: 'medieval_european_usury_trial',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['EUROPEAN'],
        yearMin: 1200,
        yearMax: 1400,
        prompt: "A Jewish moneylender is accused of demanding usury beyond what was agreed. The Christian baker who borrowed from him now refuses to pay - says the contract was sinful anyway. You witnessed the original loan agreement. You know what was actually promised. The town magistrate asks for your testimony.",
        choices: [
            {
                text: "Testify honestly - the contract was fair",
                outcomes: [
                    { chance: 0.35, result: 'reputation_gain', message: 'The Jewish community trusts you completely. This opens credit lines and trade opportunities others can\'t access.', value: 15 },
                    { chance: 0.3, result: 'reputation_loss', message: 'Christian guild members call you Jew-lover behind your back. They boycott your business, pressure others to do the same.', value: 15 },
                    { chance: 0.2, result: 'gold_gain', message: 'The moneylender, grateful for your honesty, offers you a favorable loan when you desperately need it years later.', value: 100 },
                    { chance: 0.15, result: 'death', message: 'Three days later you\'re found beaten in an alley. "Robbers," the watchmen say, not investigating very hard.' }
                ]
            },
            {
                text: "Claim you don't remember the terms",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'The moneylender loses in court. Six months later, he\'s expelled from the city. You see him leave with his family, cart loaded. He catches your eye. Says nothing.' }
                ]
            }
        ]
    },

    // RENAISSANCE_EARLY_MODERN - SUB_SAHARAN_AFRICAN
    {
        id: 'renaissance_subsaharan_inheritance_dispute',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['SUB_SAHARAN_AFRICAN'],
        yearMin: 1400,
        yearMax: 1650,
        prompt: "Your trading partner died. Half-Arab, half-African, his family is split. His Arab relatives from Oman claim his ships and goods under Islamic inheritance law. His African mother's clan claims them under local custom - sister's sons inherit. Both threaten violence. You hold his partnership shares.",
        choices: [
            {
                text: "Support Islamic law inheritance",
                outcomes: [
                    { chance: 0.35, result: 'gold_gain', message: 'Arab relatives reward you with prime access to Persian Gulf trade routes - frankincense, pearls, fine textiles.', value: 150 },
                    { chance: 0.3, result: 'reputation_loss', message: 'Local clan leaders see you as a foreign puppet. They blockade your access to ivory and gold from the interior.', value: 18 },
                    { chance: 0.25, result: 'knowledge', message: 'You learn Indian Ocean trade networks from Arab navigators - monsoon winds, safe harbors, market cycles.', value: 'Indian Ocean navigation' },
                    { chance: 0.1, result: 'death', message: 'African relatives ambush you at the docks. One partner fewer to split with, they reason. Your body joins the tide.' }
                ]
            },
            {
                text: "Support local clan inheritance law",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'The African clan takes the business. Arab merchants pull out of the town entirely. The port shrinks. Everyone loses, slowly.' }
                ]
            }
        ]
    },

    // RENAISSANCE_EARLY_MODERN - NORTH_AMERICAN_COLONIAL
    {
        id: 'renaissance_colonial_huron_choice',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['NORTH_AMERICAN_COLONIAL'],
        yearMin: 1600,
        yearMax: 1750,
        prompt: "A Huron chief asks to speak privately. 'The French want beaver pelts. The English want deer hides. Both promise guns, both promise trade goods. Both promise they're our friends.' He looks tired. 'You've dealt with both. Who lies less? We choose wrong, we're destroyed.'",
        choices: [
            {
                text: "Advise honestly about colonial powers",
                outcomes: [
                    { chance: 0.3, result: 'reputation_gain', message: 'Your honesty is rare in these times. The chief makes you a trusted advisor, gives you status in tribal councils.', value: 20 },
                    { chance: 0.3, result: 'death', message: 'Whichever colonial power you warned against finds out. You drink poisoned wine at a trading post. Natural causes, they say.' },
                    { chance: 0.25, result: 'knowledge', message: 'The chief shares traditional diplomatic strategies - centuries of inter-tribal politics, alliance-making, and survival wisdom.', value: 'Indigenous diplomacy knowledge' },
                    { chance: 0.15, result: 'nothing', message: 'They choose. War comes anyway. You watch the village burn, wondering if any advice could have saved them.' }
                ]
            },
            {
                text: "Tell him you can't advise on this",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'He nods, understanding. They choose French. Three years later, English-allied Iroquois destroy them. You hear about it from traders.' }
                ]
            }
        ]
    },

    // INDUSTRIAL_ERA - MENA
    {
        id: 'industrial_mena_textile_collapse',
        era: HistoricalEra.INDUSTRIAL_ERA,
        culturalZones: ['MENA'],
        yearMin: 1850,
        yearMax: 1900,
        prompt: "Your textile workshop employed thirty families. British machine-made cloth now costs half your price. Your workers beg you to keep the workshop open, but you're losing money every month. The only way forward: close the workshop, export raw cotton to Manchester instead. Ten times fewer workers needed.",
        choices: [
            {
                text: "Keep the workshop open, try to compete",
                outcomes: [
                    { chance: 0.25, result: 'gold_loss', message: 'You go bankrupt within a year. Creditors seize everything. Workers lose their jobs anyway, plus you\'re ruined too.', value: 200 },
                    { chance: 0.35, result: 'death', message: 'Debt collectors come for payment. It gets violent. You\'re killed over unpaid loans. Your family inherits your debts.' },
                    { chance: 0.25, result: 'knowledge', message: 'You learn about global trade mechanisms the hard way - tariffs, exchange rates, imperial preference. You teach others before you fail.', value: 'Colonial economics knowledge' },
                    { chance: 0.15, result: 'gold_gain', message: 'Tariff changes save you temporarily. You survive another decade. But the machines are coming eventually.', value: 80 }
                ]
            },
            {
                text: "Close workshop, become raw cotton exporter",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You make steady money. You see your former workers begging in the market. Two commit suicide. The profit feels cold in your hands.' }
                ]
            }
        ]
    },

    // INDUSTRIAL_ERA - SOUTH_ASIAN
    {
        id: 'industrial_south_asian_railway_labor',
        era: HistoricalEra.INDUSTRIAL_ERA,
        culturalZones: ['SOUTH_ASIAN'],
        yearMin: 1850,
        yearMax: 1900,
        prompt: "The railway company recruiter offers six months work, double farming wages. Your family could eat well, maybe buy more land. But word is the labor camps have cholera, no clean water, and men die there. Your wife is pregnant. Your parents are old. Those wages could change everything.",
        choices: [
            {
                text: "Take the railway job",
                outcomes: [
                    { chance: 0.35, result: 'gold_gain', message: 'You survive the camps, send money home regularly. Your family\'s fortune turns. You buy land. Your children will eat.', value: 180 },
                    { chance: 0.3, result: 'death', message: 'Cholera in the third month. You die in a camp far from home. They don\'t send your body back, just your final wages.' },
                    { chance: 0.25, result: 'injury', message: 'You survive but dysentery ruins your health permanently. You can\'t farm anymore. You\'re a burden now instead of help.', value: 30 },
                    { chance: 0.1, result: 'knowledge', message: 'You learn about labor organizing - how workers can band together. You bring these dangerous ideas home.', value: 'Labor organizing knowledge' }
                ]
            },
            {
                text: "Stay and farm, refuse the offer",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'Another lean year. The rains don\'t come enough. Your daughter goes to work in someone else\'s house at age ten. At least you\'re all alive.' }
                ]
            }
        ]
    },

    // INDUSTRIAL_ERA - SOUTH_AMERICAN
    {
        id: 'industrial_south_american_rubber_peonage',
        era: HistoricalEra.INDUSTRIAL_ERA,
        culturalZones: ['SOUTH_AMERICAN'],
        yearMin: 1870,
        yearMax: 1920,
        prompt: "The rubber company recruiter lays out silver coins. 'Six months work on the estate. Good pay, regular food.' Everyone knows it's debt peonage - they charge for food, tools, housing until you can never pay back. But the coins shine. Your children are thin.",
        choices: [
            {
                text: "Accept the rubber company contract",
                outcomes: [
                    { chance: 0.25, result: 'death', message: 'You\'re worked to death in the jungle within eight months. They dump your body in the river. The debt transfers to your family.' },
                    { chance: 0.35, result: 'gold_loss', message: 'Trapped in debt for years, you sign over your land to pay it. You own nothing now, not even your labor.', value: 150 },
                    { chance: 0.3, result: 'injury', message: 'You escape back home after two brutal years. You\'re missing fingers from the rubber work. Your children barely recognize you.', value: 35 },
                    { chance: 0.1, result: 'gold_gain', message: 'You\'re smart and quick. You steal rubber seeds during work, escape, start your own small grove. Dangerous, but it works.', value: 120 }
                ]
            },
            {
                text: "Refuse - find another way to survive",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'Your family struggles on, lean and hungry. Neighbors who took the silver don\'t come back. You made the right choice, probably.' }
                ]
            }
        ]
    },

    // INDUSTRIAL_ERA - SUB_SAHARAN_AFRICAN
    {
        id: 'industrial_subsaharan_congo_porters',
        era: HistoricalEra.INDUSTRIAL_ERA,
        culturalZones: ['SUB_SAHARAN_AFRICAN'],
        yearMin: 1880,
        yearMax: 1910,
        prompt: "Belgian agents need porters for an ivory expedition. Six months, they pay in cloth and salt. The last porter group didn't return, but the agents say that's rumor. Your village headman is considering the offer - the payment would help everyone. But the jungle keeps secrets.",
        choices: [
            {
                text: "Volunteer as porter",
                outcomes: [
                    { chance: 0.35, result: 'death', message: 'You\'re beaten for not meeting rubber quota, die in the forest. They leave your body for scavengers.' },
                    { chance: 0.3, result: 'injury', message: 'You return after eight months. They cut off your hand as punishment for something. You can\'t work anymore.', value: 40 },
                    { chance: 0.25, result: 'gold_gain', message: 'You survive and get paid. But what you saw in the camps - the atrocities - haunts you forever. Was the cloth worth it?', value: 60 },
                    { chance: 0.1, result: 'knowledge', message: 'You learn the routes, the weak points in colonial control. Later, you help anti-colonial resistance movements.', value: 'Resistance network knowledge' }
                ]
            },
            {
                text: "Argue against the whole village going",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'They go anyway. Four return out of twenty. They don\'t talk about what happened. Their eyes are different now.' }
                ]
            }
        ]
    },

    // MODERN_ERA - EAST_ASIAN
    {
        id: 'modern_east_asian_collaboration',
        era: HistoricalEra.MODERN_ERA,
        culturalZones: ['EAST_ASIAN'],
        yearMin: 1930,
        yearMax: 1945,
        prompt: "Japanese agents are recruiting for the new puppet government. Clerk positions, decent salary, better than farming. Your neighbor spits: 'Collaboration. Traitors.' But your mother needs medicine you can't afford. Your brother's letters from the army stopped coming months ago.",
        choices: [
            {
                text: "Take the government job",
                outcomes: [
                    { chance: 0.4, result: 'gold_gain', message: 'You feed your family, buy medicine for mother. But neighbors stop speaking to you. Children throw stones at your house.', value: 150 },
                    { chance: 0.3, result: 'death', message: 'When liberation comes, you\'re executed as a collaborator. No trial. No appeal. Your family\'s name is cursed for generations.' },
                    { chance: 0.2, result: 'knowledge', message: 'You see occupation bureaucracy from inside - witness atrocities, record them secretly. Carry this guilt and knowledge forever.', value: 'Occupation documentation' },
                    { chance: 0.1, result: 'reputation_loss', message: 'You survive the war but your family name is mud. Your children are "collaborator\'s children" forever.', value: 25 }
                ]
            },
            {
                text: "Refuse - try to survive without collaborating",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'Your mother dies that winter. Your family nearly starves. But you\'re clean. Small comfort when you\'re burying your mother.' }
                ]
            }
        ]
    },

    // MODERN_ERA - MENA
    {
        id: 'modern_mena_nationalization',
        era: HistoricalEra.MODERN_ERA,
        culturalZones: ['MENA'],
        yearMin: 1950,
        yearMax: 1970,
        prompt: "The new government is nationalizing industries. Your family's small factory - three generations built it. Foreign stockholders are fleeing. The government promises compensation 'eventually.' Your cousin says take what you can, get out to Lebanon. Your workers beg you to stay, trust the new system.",
        choices: [
            {
                text: "Stay, let the factory be nationalized",
                outcomes: [
                    { chance: 0.4, result: 'reputation_gain', message: 'You\'re honored as patriotic, get government contracts later. Your gamble on the new system pays off.', value: 20 },
                    { chance: 0.3, result: 'gold_loss', message: 'Compensation never comes. The factory is mismanaged under state control. You lose everything your grandparents built.', value: 200 },
                    { chance: 0.2, result: 'knowledge', message: 'You learn to navigate the new socialist system - see it succeed in some ways, fail in others. Complex lessons.', value: 'Socialist economics experience' },
                    { chance: 0.1, result: 'gold_gain', message: 'The factory actually thrives under state management. You\'re kept on as paid advisor. Everyone wins, surprisingly.', value: 120 }
                ]
            },
            {
                text: "Flee with assets before nationalization",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You rebuild in Beirut. Smaller operation, but it\'s yours. You never see your homeland again. Your workers cursed your name as a traitor.' }
                ]
            }
        ]
    },

    // FUTURE_ERA - MENA
    {
        id: 'future_mena_street_musician',
        era: HistoricalEra.FUTURE_ERA,
        culturalZones: ['MENA'],
        yearMin: 2020,
        yearMax: 2030,
        prompt: "A street musician plays oud under an archway. The sound echoes beautifully. Small crowd gathered. He finishes a song, notices you listening. Sets down an empty cup. The tune was genuinely good.",
        choices: [
            {
                text: "Put money in the cup",
                outcomes: [
                    { chance: 0.4, result: 'reputation_gain', message: 'He teaches you the real history of the song over tea after his set. You gain a valuable local contact who knows everyone.', value: 15 },
                    { chance: 0.3, result: 'knowledge', message: 'He starts playing a wedding song. A woman in the crowd argues about which village it\'s from. You learn regional music traditions and rivalries.', value: 'Regional music traditions' },
                    { chance: 0.2, result: 'nothing', message: 'He nods thanks, plays three more songs. Pleasant afternoon. The music fades as you continue on.' },
                    { chance: 0.1, result: 'gold_loss', message: 'While you\'re watching him play the next song, someone in the crowd picks your pocket. The music was genuinely good though.', value: 40 }
                ]
            },
            {
                text: "Don't tip, keep walking",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You hear the music fade behind you as you continue on. The melody stays in your head for hours.' }
                ]
            }
        ]
    },

    // FUTURE_ERA - EUROPEAN
    {
        id: 'future_european_lost_book',
        era: HistoricalEra.FUTURE_ERA,
        culturalZones: ['EUROPEAN'],
        yearMin: 2020,
        yearMax: 2030,
        prompt: "Someone left a book on the metro seat. Nice hardcover, bookmark halfway through. You pick it up to check for a name inside. There's an email address written on the first page in pen.",
        choices: [
            {
                text: "Take the book, email them to return it",
                outcomes: [
                    { chance: 0.35, result: 'reputation_gain', message: 'You meet to return it. They\'re interesting, you talk for an hour over coffee. Exchange numbers. Genuine new acquaintance.', value: 12 },
                    { chance: 0.3, result: 'gold_gain', message: 'They insist on buying you lunch to thank you. Tip generously. More grateful than you expected for a book.', value: 35 },
                    { chance: 0.25, result: 'nothing', message: 'Awkward handoff at a metro station. Forced small talk. Both relieved when it\'s over. At least you did the right thing.' },
                    { chance: 0.1, result: 'death', message: 'They seemed normal over email. They\'re not. You meet in a quiet area like they suggested. This was a very bad idea.' }
                ]
            },
            {
                text: "Leave it there for someone else to deal with",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'You put it back on the seat. Probably still there at the end of the line. Or some teenager took it. Not your problem.' }
                ]
            }
        ]
    },

    // FUTURE_ERA - SOUTH_ASIAN
    {
        id: 'future_south_asian_market_scale',
        era: HistoricalEra.FUTURE_ERA,
        culturalZones: ['SOUTH_ASIAN'],
        yearMin: 2020,
        yearMax: 2030,
        prompt: "A street vendor weighs your mangoes. The scale reads 2 kg. That seems heavy for three mangoes. His hand is resting near the scale platform. Could be nothing. Could be the old thumb-on-scale trick.",
        choices: [
            {
                text: "Question the weight",
                outcomes: [
                    { chance: 0.4, result: 'reputation_gain', message: 'He grins, lifts his hand - scale drops to 1.5 kg. "Smart customer! You come back, I give you good deals." He respects that you noticed.', value: 10 },
                    { chance: 0.35, result: 'gold_gain', message: 'He adjusts the price down, then throws in extra mangoes. "For paying attention," he says. You got more than you paid for.', value: 15 },
                    { chance: 0.25, result: 'nothing', message: 'He looks offended, adjusts the scale properly. Normal transaction but slightly awkward. The mangoes are good though.' }
                ]
            },
            {
                text: "Just pay what he asks",
                outcomes: [
                    { chance: 1.0, result: 'gold_loss', message: 'You probably got cheated. The mangoes are excellent though. Worth it? You\'ll never know.', value: 20 }
                ]
            }
        ]
    },

    // FUTURE_ERA - EAST_ASIAN
    {
        id: 'future_east_asian_dropped_wallet',
        era: HistoricalEra.FUTURE_ERA,
        culturalZones: ['EAST_ASIAN'],
        yearMin: 2020,
        yearMax: 2030,
        prompt: "A man drops his wallet getting out of a taxi. He doesn't notice. The taxi drives off. The wallet is on the ground. There's cash visible. He's walking away quickly, phone to his ear.",
        choices: [
            {
                text: "Pick it up, try to return it",
                outcomes: [
                    { chance: 0.45, result: 'reputation_gain', message: 'You run after him. He\'s incredibly grateful, insists on giving you a reward. Refuses to take no for an answer.', value: 15 },
                    { chance: 0.3, result: 'gold_gain', message: 'You catch up to him. He tips you generously, thanks you profusely. Some people are just decent.', value: 50 },
                    { chance: 0.15, result: 'nothing', message: 'You call out but he can\'t hear you on the phone. By the time he notices you waving the wallet, he seems suspicious. Takes it without thanks.' },
                    { chance: 0.1, result: 'gold_loss', message: 'Police see you pick it up, assume you stole it. He confirms it\'s his but claims more cash was inside. You end up paying him.', value: 80 }
                ]
            },
            {
                text: "Keep walking, not your problem",
                outcomes: [
                    { chance: 1.0, result: 'nothing', message: 'Someone else will find it. Or not. He\'ll notice eventually. You had places to be.' }
                ]
            }
        ]
    },

    // FUTURE_ERA - SUB_SAHARAN_AFRICAN
    {
        id: 'future_subsaharan_police_bribe',
        era: HistoricalEra.FUTURE_ERA,
        culturalZones: ['SUB_SAHARAN_AFRICAN'],
        yearMin: 2020,
        yearMax: 2030,
        prompt: "Two police officers stop you. 'Papers.' Your documents are in order but one of them points at your phone. 'That's a nice phone. Where'd you buy it?' The tone suggests they want something.",
        choices: [
            {
                text: "Offer them money to move on",
                outcomes: [
                    { chance: 0.5, result: 'gold_loss', message: 'They take the money and wave you through. Standard transaction. This is just how it works here.', value: 30 },
                    { chance: 0.3, result: 'gold_loss', message: 'They take the money, then ask for more. "That phone is very expensive. How do we know..." You pay again.', value: 60 },
                    { chance: 0.15, result: 'nothing', message: 'They laugh and wave you on without taking anything. "Just checking. Go on." Were they ever serious?' },
                    { chance: 0.05, result: 'death', message: 'You pulled out too much cash. They force you into an alley. This wasn\'t a shakedown anymore. This was a robbery.' }
                ]
            },
            {
                text: "Insist everything is legal, refuse to pay",
                outcomes: [
                    { chance: 0.4, result: 'nothing', message: 'They look annoyed, check your papers again, eventually let you go. You wasted an hour but paid nothing.' },
                    { chance: 0.35, result: 'gold_loss', message: 'They "find" something wrong with your papers. The fine at the station costs more than a bribe would have.', value: 100 },
                    { chance: 0.15, result: 'injury', message: 'They take offense to your attitude. Things get physical. You spend a night in a cell. Your phone is missing when they release you.', value: 20 },
                    { chance: 0.1, result: 'reputation_gain', message: 'A senior officer walks by, asks what\'s happening. They back off immediately. He apologizes to you, takes their names. Rare, but it happens.', value: 10 }
                ]
            }
        ]
    }
];

/**
 * Get a random city event for the given era and cultural zone
 * Returns null if no event should trigger (50% chance) or if no matching event exists
 */
export const getRandomCityEvent = (era: HistoricalEra, culturalZone?: CulturalZone, year?: number): CityEvent | null => {
    // 50% chance of no event
    if (Math.random() > 0.5) {
        return null;
    }

    let eraEvents = CITY_EVENTS.filter(e => e.era === era);

    // Filter by year range if specified
    if (year !== undefined) {
        eraEvents = eraEvents.filter(e => {
            if (e.yearMin === undefined && e.yearMax === undefined) return true;
            const afterMin = e.yearMin === undefined || year >= e.yearMin;
            const beforeMax = e.yearMax === undefined || year <= e.yearMax;
            return afterMin && beforeMax;
        });
    }

    // Filter by cultural zone if specified
    if (culturalZone) {
        const zoneSpecificEvents = eraEvents.filter(e => {
            return e.culturalZones.includes(culturalZone);
        });

        if (zoneSpecificEvents.length > 0) {
            eraEvents = zoneSpecificEvents;
        }
    }

    if (eraEvents.length === 0) {
        return null;
    }

    return eraEvents[Math.floor(Math.random() * eraEvents.length)];
};

/**
 * Roll for an outcome based on weighted probabilities
 */
export const rollCityEventOutcome = (outcomes: CityEventOutcome[]): CityEventOutcome => {
    const roll = Math.random();
    let cumulative = 0;

    for (const outcome of outcomes) {
        cumulative += outcome.chance;
        if (roll < cumulative) {
            return outcome;
        }
    }

    // Fallback to last outcome
    return outcomes[outcomes.length - 1];
};
