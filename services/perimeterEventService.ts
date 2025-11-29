/**
 * Perimeter Event Service - Generates era-appropriate random events
 * when searching the perimeter of ruins
 */

import { HistoricalEra, CulturalZone } from '../types';

export interface PerimeterEventChoice {
    text: string;
    outcomes: PerimeterEventOutcome[];
}

export interface PerimeterEventOutcome {
    chance: number; // 0-1 probability
    result: 'death' | 'injury' | 'item' | 'gold_gain' | 'gold_loss' | 'item_loss' | 'nothing' | 'knowledge';
    message: string;
    value?: number | string; // Amount of gold, item ID, or knowledge text
}

export interface PerimeterEvent {
    id: string;
    prompt: string;
    choices: [PerimeterEventChoice, PerimeterEventChoice, PerimeterEventChoice];
    era: HistoricalEra;
    culturalZones?: CulturalZone[]; // If specified, only shows in these zones
    yearMin?: number; // Minimum year for this event (e.g., -500 for 500 BCE)
    yearMax?: number; // Maximum year for this event (e.g., 500 for 500 CE)
}

const PERIMETER_EVENTS: PerimeterEvent[] = [
    // PREHISTORY EVENTS - EUROPEAN
    {
        id: 'prehistory_recent_occupation',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['EUROPEAN'],
        prompt: "Fresh ash in a fire pit. Mammoth bones with cut marks - some meat still on them. Stone scrapers scattered around. Someone was here yesterday, maybe this morning. You hear movement in the rocks above.",
        choices: [
            {
                text: "Call out, announce yourself",
                outcomes: [
                    { chance: 0.35, result: 'knowledge', message: 'A group emerges cautiously. Through gestures and shared food, you learn their hunting patterns and tool-making techniques.', value: 'Paleolithic hunting methods' },
                    { chance: 0.30, result: 'death', message: 'Rocks rain down from above. They don\'t want visitors. You don\'t survive the ambush.' },
                    { chance: 0.20, result: 'item', message: 'An elder approaches. They gift you a well-made scraper as greeting. You part peacefully.', value: 'STONE_SCRAPER' },
                    { chance: 0.15, result: 'injury', message: 'A spear thuds into the ground at your feet - warning, not attack. You leave quickly, bruised from scrambling down rocks.', value: 12 }
                ]
            },
            {
                text: "Take some of the worked tools left behind",
                outcomes: [
                    { chance: 0.45, result: 'item', message: 'You pocket several excellent scrapers. No one appears to stop you.', value: 'FLINT_BLADE' },
                    { chance: 0.30, result: 'death', message: 'They were watching. Theft means death. Spears find you before you reach the treeline.' },
                    { chance: 0.25, result: 'knowledge', message: 'You study the knapping technique as you take them. Different from what you know - more efficient.', value: 'Stone tool technology' }
                ]
            },
            {
                text: "Leave quietly the way you came",
                outcomes: [
                    { chance: 0.60, result: 'nothing', message: 'You slip away unnoticed. Safer, but you learn nothing and gain nothing.' },
                    { chance: 0.25, result: 'knowledge', message: 'Observing from distance, you see their fire-management technique before withdrawing.', value: 'Fire maintenance methods' },
                    { chance: 0.15, result: 'item', message: 'In your haste, you knock over a basket. A bone needle falls out - you take it and run.', value: 'BONE_NEEDLE' }
                ]
            }
        ]
    },
    {
        id: 'prehistory_hand_stencils',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['EUROPEAN'],
        prompt: "The cave wall is covered in hand prints - red ochre, blown around living hands. Big hands, small hands, some missing fingers. One section is fresh - the ochre still slightly damp. You hear breathing deeper in the cave.",
        choices: [
            {
                text: "Add your own hand to the wall",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'As you place your hand, the breathing stops. Footsteps approach. A painter nods approval and continues their work silently.', value: 'Cave art techniques' },
                    { chance: 0.35, result: 'death', message: 'The cave dwellers emerge in rage. You\'ve violated sacred space. The last thing you see is red handprints.' },
                    { chance: 0.25, result: 'item', message: 'The painters share their ochre with you - good quality pigment, ground fine.', value: 'RED_OCHRE' }
                ]
            },
            {
                text: "Move deeper to investigate",
                outcomes: [
                    { chance: 0.30, result: 'knowledge', message: 'You find a painting chamber - animals, humans, patterns. Painters work by flickering light. They ignore you, absorbed in their work.', value: 'Paleolithic symbolism' },
                    { chance: 0.40, result: 'injury', message: 'The floor drops away in darkness. You fall into a lower chamber, landing badly. You crawl out, injured and alone.', value: 18 },
                    { chance: 0.30, result: 'item', message: 'In the deeper chamber, you find bowls of prepared pigment - yellow, black, red. You take a small amount.', value: 'PIGMENT_POWDER' }
                ]
            },
            {
                text: "Back out, don't disturb the site",
                outcomes: [
                    { chance: 0.70, result: 'nothing', message: 'You retreat quietly. Respectful, but you\'ve learned little.' },
                    { chance: 0.20, result: 'knowledge', message: 'As you leave, you count the hands - hundreds, over generations. You understand continuity.', value: 'Ritual continuity across time' },
                    { chance: 0.10, result: 'gold_gain', message: 'At the cave entrance, small carved stones lie in a pile - offerings. You take one, small enough not to be missed.', value: 50 }
                ]
            }
        ]
    },
    // PREHISTORY EVENTS - EAST_ASIAN
    {
        id: 'prehistory_oracle_bones',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['EAST_ASIAN'],
        prompt: "Cattle shoulder blades, deliberately cracked by heat, lie scattered near the ruin's foundation. Recent - you can smell burnt bone. Patterns of cracks, careful arrangements. Someone's reading the future here. Or claiming to.",
        choices: [
            {
                text: "Examine the bones, try to interpret",
                outcomes: [
                    { chance: 0.35, result: 'knowledge', message: 'You study the crack patterns. Heat, then water - thermal shock divination. The technique is clear even if the meaning isn\'t.', value: 'Early divination methods' },
                    { chance: 0.40, result: 'nothing', message: 'The patterns mean nothing to you. You\'re not trained in this. You leave them.' },
                    { chance: 0.25, result: 'death', message: 'The diviner returns, sees you handling sacred objects. A bronze dagger ends the sacrilege quickly.' }
                ]
            },
            {
                text: "Collect some for trade or study",
                outcomes: [
                    { chance: 0.40, result: 'item', message: 'You take several bones with clear crack patterns. Could be valuable to someone who reads these.', value: 'ORACLE_BONE' },
                    { chance: 0.35, result: 'death', message: 'Guards emerge from the ruins. These bones are royal property. Theft is death.' },
                    { chance: 0.25, result: 'gold_gain', message: 'You sell the bones to a diviner in the next settlement. They pay well for pre-cracked examples.', value: 120 }
                ]
            },
            {
                text: "Avoid them - ritual objects best left alone",
                outcomes: [
                    { chance: 0.60, result: 'nothing', message: 'You give the site wide berth. Smart, safe, but unrewarding.' },
                    { chance: 0.25, result: 'knowledge', message: 'Watching from distance, you see the diviner return and add more bones. You learn the ritual sequence.', value: 'Scapulimancy procedure' },
                    { chance: 0.15, result: 'item', message: 'Circling the site, you find discarded bones deemed unlucky. You take one - no spiritual danger in failures.', value: 'BONE_FRAGMENT' }
                ]
            }
        ]
    },
    {
        id: 'prehistory_jade_workshop',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['EAST_ASIAN'],
        prompt: "Stone abraders, jade dust, broken pieces. Someone's been working jade at this ruin for months - you can see the wear patterns on rocks used as workbenches. A half-finished disc sits in a stone bowl. Still damp from grinding.",
        choices: [
            {
                text: "Wait to see who returns to their work",
                outcomes: [
                    { chance: 0.35, result: 'knowledge', message: 'An artisan returns after hours. Seeing you waited respectfully, they demonstrate the grinding technique. Hours of patient work.', value: 'Jade working methods' },
                    { chance: 0.30, result: 'nothing', message: 'You wait all day. No one comes. Night falls and you must leave.' },
                    { chance: 0.20, result: 'gold_gain', message: 'The craftsperson offers you work as an assistant. Days of labor earn you payment in small jade pieces.', value: 200 },
                    { chance: 0.15, result: 'injury', message: 'The artisan arrives with guards, suspicious of your presence. You\'re driven off roughly, bruised.', value: 10 }
                ]
            },
            {
                text: "Take the finished pieces, leave the raw",
                outcomes: [
                    { chance: 0.40, result: 'item', message: 'You pocket three finished beads and two small discs. Quality work, valuable.', value: 'JADE_BEAD' },
                    { chance: 0.35, result: 'death', message: 'The craftsperson returns with warriors. Jade theft is a killing offense. No trial.' },
                    { chance: 0.25, result: 'gold_gain', message: 'You trade the stolen jade quickly in another settlement. Good price, no questions.', value: 180 }
                ]
            },
            {
                text: "Study the technique, leave everything",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'You examine the abraders, the jade dust patterns, the grinding bowl. The technique becomes clear through careful observation.', value: 'Stone polishing technology' },
                    { chance: 0.30, result: 'nothing', message: 'You study the site but lack the expertise to understand what you\'re seeing. It remains mysterious.' },
                    { chance: 0.20, result: 'item', message: 'Among the broken pieces, you find a cracked disc - flawed, discarded. You take it without guilt.', value: 'CRACKED_JADE' }
                ]
            }
        ]
    },
    // PREHISTORY EVENTS - MENA
    {
        id: 'prehistory_plastered_skull',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['MENA'],
        prompt: "A human skull, covered in plaster, painted with features - eyes, mouth. Shells for eyes. It rests in a niche in the wall, deliberately placed. Flowers beside it are wilted but recent. Someone tends this.",
        choices: [
            {
                text: "Remove it - belongs in study, not here",
                outcomes: [
                    { chance: 0.35, result: 'item', message: 'You take the skull carefully. It\'s remarkably preserved - the plaster work is exquisite. A significant find.', value: 'PLASTERED_SKULL' },
                    { chance: 0.40, result: 'death', message: 'Family members arrive as you handle their ancestor. Desecration of the dead means death. They\'re not merciful.' },
                    { chance: 0.25, result: 'gold_loss', message: 'You take it, but word spreads. The family demands compensation. Local authorities side with them. You pay heavily.', value: 300 }
                ]
            },
            {
                text: "Leave fresh flowers, show respect",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'The family returns while you arrange flowers. Grateful, they explain the ancestor veneration practice. You share a meal.', value: 'Neolithic burial customs' },
                    { chance: 0.35, result: 'nothing', message: 'You leave flowers and depart. A kind gesture, but you learn nothing more.' },
                    { chance: 0.20, result: 'gold_gain', message: 'Your respect earns the family\'s trust. They hire you to help document other ancestor shrines. You\'re paid for your discretion.', value: 150 }
                ]
            },
            {
                text: "Document location, leave undisturbed",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'You sketch the niche, note the plaster technique, document the shell type. Professional. The family later thanks you for your respect.', value: 'Archaeological documentation ethics' },
                    { chance: 0.30, result: 'nothing', message: 'You make your notes and leave. Standard archaeological practice. Nothing remarkable happens.' },
                    { chance: 0.20, result: 'item', message: 'The family sees your respectful documentation. They gift you a small shell - same type used in the skull\'s eyes.', value: 'COWRIE_SHELL' }
                ]
            }
        ]
    },
    {
        id: 'prehistory_grain_grinding',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['MENA'],
        prompt: "Grinding stones worn smooth from use - generations of use. Wild grass seeds in the cracks, some fresh. The best grinding hollow has a small pile of ground flour beside it, covered with a flat stone. Still dry.",
        choices: [
            {
                text: "Take the prepared flour",
                outcomes: [
                    { chance: 0.40, result: 'item', message: 'You take the flour - maybe a kilogram. Useful, ready to cook.', value: 'GROUND_FLOUR' },
                    { chance: 0.35, result: 'death', message: 'The woman who ground it returns, sees the theft. Her family responds. You don\'t make it far.' },
                    { chance: 0.25, result: 'knowledge', message: 'You take the flour but examine the grinding stone first. The technique for processing wild cereals becomes clear.', value: 'Wild grain processing' }
                ]
            },
            {
                text: "Use the grinding stone, add to the supply",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'You grind for hours. Back-breaking work. The woman returns, appreciates your contribution, shows you the best seeds to gather.', value: 'Natufian food processing' },
                    { chance: 0.30, result: 'nothing', message: 'You grind for a while but lack the technique. The flour is coarse, poorly done. You leave it.' },
                    { chance: 0.25, result: 'item', message: 'Your contribution is noticed. The community shares their harvest with you - seeds and prepared flour both.', value: 'WILD_EMMER' }
                ]
            },
            {
                text: "Leave it all untouched",
                outcomes: [
                    { chance: 0.60, result: 'nothing', message: 'You resist temptation and move on. Honorable, but unrewarding.' },
                    { chance: 0.25, result: 'knowledge', message: 'Watching from distance, you observe the grinding technique when workers return. You learn without taking.', value: 'Stone grinding methods' },
                    { chance: 0.15, result: 'gold_gain', message: 'Your respect for the communal resource is noticed. The community hires you as a guard for their stores. You\'re paid in grain.', value: 100 }
                ]
            }
        ]
    },
    // PREHISTORY EVENTS - NORTH_AMERICAN_PRE_COLUMBIAN
    {
        id: 'prehistory_atlatl_practice',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
        prompt: "The ruin's wall is pocked with impact marks. Broken dart shafts litter the ground. Someone uses this as target practice. Fresh marks on the wall - today, maybe hours ago. A serviceable atlatl dart lies in the grass, missed in collection.",
        choices: [
            {
                text: "Take the dart - well made",
                outcomes: [
                    { chance: 0.45, result: 'item', message: 'The dart is excellent - stone point, straight shaft, good fletching. You pocket it.', value: 'ATLATL_DART' },
                    { chance: 0.30, result: 'injury', message: 'The owner returns as you take it. They launch a warning shot - it grazes your arm. You drop the dart and flee.', value: 15 },
                    { chance: 0.25, result: 'knowledge', message: 'Examining the dart closely before taking it, you notice the binding technique - sinew and pitch combined.', value: 'Atlatl dart construction' }
                ]
            },
            {
                text: "Practice a throw yourself, leave the dart",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'You practice for an hour. The thrower returns, amused. They adjust your grip, demonstrate leverage. Generous teaching.', value: 'Atlatl throwing technique' },
                    { chance: 0.35, result: 'injury', message: 'Your throw is poor. The dart ricochets off stone and catches your leg. Painful lesson.', value: 12 },
                    { chance: 0.25, result: 'nothing', message: 'You practice until tired. Your throws improve slightly. No one appears.' }
                ]
            },
            {
                text: "Move on - interrupting someone's range",
                outcomes: [
                    { chance: 0.60, result: 'nothing', message: 'You leave the site undisturbed. Polite, but you gain nothing.' },
                    { chance: 0.25, result: 'knowledge', message: 'From a distance, you watch the thrower return and practice. You study their form, their breathing, their release.', value: 'Hunting weapon techniques' },
                    { chance: 0.15, result: 'item', message: 'Circling away from the range, you find older dart points scattered in grass - discarded broken ones. You collect several.', value: 'STONE_POINT' }
                ]
            }
        ]
    },
    {
        id: 'prehistory_pictograph_addition',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
        prompt: "Geometric patterns painted on the rock. Some ancient and faded, some fresh and bright. You watch as the paint on one symbol visibly dries - applied within the hour. Mineral pigment bowls sit nearby, still wet.",
        choices: [
            {
                text: "Wait to see who's painting",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'A young artist returns. Seeing you waited respectfully, they explain the symbols - vision markers, territorial claims, story records.', value: 'Rock art symbolism' },
                    { chance: 0.30, result: 'nothing', message: 'You wait for hours. No one comes. The paint dries. You learn nothing.' },
                    { chance: 0.30, result: 'death', message: 'The painter returns with guardians. Your presence at sacred site is violation. They show no mercy.' }
                ]
            },
            {
                text: "Add your own mark to the rock",
                outcomes: [
                    { chance: 0.35, result: 'knowledge', message: 'You paint a simple mark. The artist arrives, studies it, nods. Your addition is accepted. They show you proper pigment preparation.', value: 'Mineral pigment creation' },
                    { chance: 0.40, result: 'death', message: 'Your mark desecrates sacred space. The guardians arrive swiftly. Death is certain for such sacrilege.' },
                    { chance: 0.25, result: 'item', message: 'Your mark is judged acceptable. The artist gifts you a prepared pigment bowl - ochre and fat mixed.', value: 'PAINT_MIXTURE' }
                ]
            },
            {
                text: "Document what you see, then leave",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'You sketch the patterns, note colors and positions. Professional documentation. The artist later thanks you for not touching.', value: 'Pictograph documentation methods' },
                    { chance: 0.30, result: 'nothing', message: 'You make notes and leave quietly. Standard practice. Nothing more comes of it.' },
                    { chance: 0.20, result: 'item', message: 'Your respectful documentation impresses the artist. They give you a small bag of dried ochre powder.', value: 'OCHRE_POWDER' }
                ]
            }
        ]
    },
    // PREHISTORY EVENTS - OCEANIA
    {
        id: 'prehistory_adze_cache',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['OCEANIA'],
        prompt: "Stone adze heads, beautifully ground basalt, wrapped in bark cloth. Hidden in a crack in the ruin's wall. Ten of them - more than one person carries. Either a trader's stock or a group's shared tools. The bark is fresh, pliable.",
        choices: [
            {
                text: "Take one adze, fair finder's right",
                outcomes: [
                    { chance: 0.40, result: 'item', message: 'You take one adze - the smallest. Quality work, perfectly balanced. The rest you leave.', value: 'BASALT_ADZE' },
                    { chance: 0.35, result: 'death', message: 'The owner returns as you handle their tools. Tool theft is unforgivable. Your body joins the ruins.' },
                    { chance: 0.25, result: 'gold_gain', message: 'You trade the adze at the next island. Good stone tools command high prices. The buyer asks no questions.', value: 160 }
                ]
            },
            {
                text: "Take the whole cache",
                outcomes: [
                    { chance: 0.35, result: 'item', message: 'You take all ten adzes. Valuable haul - enough to trade for a canoe.', value: 'ADZE_SET' },
                    { chance: 0.45, result: 'death', message: 'The trading party returns, finds their cache stolen. They track you. Island justice is swift.' },
                    { chance: 0.20, result: 'gold_gain', message: 'You fence the entire set to an unscrupulous trader. Excellent payment, but you\'ve made enemies.', value: 400 }
                ]
            },
            {
                text: "Leave them hidden, mark the location",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'You study the adzes without taking them. The grinding technique is masterful - you learn through observation.', value: 'Stone tool grinding methods' },
                    { chance: 0.30, result: 'nothing', message: 'You mark the location and leave. The cache is gone when you return days later.' },
                    { chance: 0.20, result: 'gold_gain', message: 'You tell the traders where you found their tools. Grateful, they pay you a finder\'s fee and share their route knowledge.', value: 120 }
                ]
            }
        ]
    },
    {
        id: 'prehistory_navigation_school',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['OCEANIA'],
        prompt: "Stones arranged in careful patterns on flat ground near the ruin - stars, currents, island chains. A teaching ground. Someone has swept the area clean, reset the stones recently. A young person sits at the edge, studying the pattern.",
        choices: [
            {
                text: "Ask to observe the lesson",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'The navigator arrives, allows you to watch. Hours of instruction - wave patterns, star paths, bird flight. Generous sharing of sacred knowledge.', value: 'Polynesian navigation techniques' },
                    { chance: 0.30, result: 'nothing', message: 'The navigator refuses. This knowledge is for family only. You\'re dismissed politely but firmly.' },
                    { chance: 0.25, result: 'death', message: 'The navigator sees you as a threat - knowledge theft. The student watches as you\'re killed. A lesson in protection.' }
                ]
            },
            {
                text: "Study the pattern yourself, quietly",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'You memorize the stone arrangements. Later, you piece together the meaning - a star compass, wave patterns, island distances.', value: 'Star path navigation' },
                    { chance: 0.35, result: 'nothing', message: 'The patterns mean nothing without instruction. Stones are just stones to you.' },
                    { chance: 0.25, result: 'injury', message: 'The navigator arrives, sees you studying. Stealing knowledge. You\'re beaten and driven off, warned never to return.', value: 16 }
                ]
            },
            {
                text: "Leave them to their learning",
                outcomes: [
                    { chance: 0.60, result: 'nothing', message: 'You withdraw respectfully. Their knowledge, their tradition, not for you.' },
                    { chance: 0.25, result: 'knowledge', message: 'Your respect is noticed. The student later finds you, shares one piece of knowledge - how to read wave reflections off distant islands.', value: 'Wave pattern reading' },
                    { chance: 0.15, result: 'item', message: 'The navigator, impressed by your respect, gifts you a small carved navigation stone - simplified, but functional.', value: 'NAVIGATION_STONE' }
                ]
            }
        ]
    },
    // PREHISTORY EVENTS - SOUTH_ASIAN
    {
        id: 'prehistory_microliths_scatter',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['SOUTH_ASIAN'],
        prompt: "Tiny stone blades everywhere - thousands of them, some hafted in split reeds with tree resin. A recent workshop floor. Some resin is still tacky. Blood on several blades - something was butchered here today.",
        choices: [
            {
                text: "Take some hafted tools - excellently made",
                outcomes: [
                    { chance: 0.40, result: 'item', message: 'You collect a dozen hafted microliths. The composite tools are ingeniously made - more effective than single-piece blades.', value: 'MICROLITH_TOOL' },
                    { chance: 0.35, result: 'death', message: 'The hunting party returns for their tools. You\'re holding their property, standing in their blood. They don\'t ask questions.' },
                    { chance: 0.25, result: 'knowledge', message: 'Examining the hafting before taking them, you understand the technique - resin temperature, reed selection, blade angle.', value: 'Composite tool technology' }
                ]
            },
            {
                text: "Wait to see if hunters return",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'The hunting party returns at dusk. Impressed you waited, they share meat and demonstrate microlith manufacture. Hours of careful instruction.', value: 'Mesolithic hunting methods' },
                    { chance: 0.30, result: 'nothing', message: 'You wait all day. No one comes. Night forces you to leave empty-handed.' },
                    { chance: 0.30, result: 'item', message: 'The hunters return, grateful you guarded their tools. They gift you several hafted blades and a portion of meat.', value: 'STONE_BLADE_SET' }
                ]
            },
            {
                text: "Take only unhafted blades",
                outcomes: [
                    { chance: 0.50, result: 'item', message: 'You collect loose blades - hundreds available. No theft since they\'re not yet hafted into tools.', value: 'MICROLITH_BLADES' },
                    { chance: 0.30, result: 'knowledge', message: 'You study the knapping waste piles. The reduction technique becomes clear - systematic blade production from prepared cores.', value: 'Blade production technology' },
                    { chance: 0.20, result: 'nothing', message: 'You take some blades but they\'re useless without hafting knowledge. You discard them later.' }
                ]
            }
        ]
    },
    {
        id: 'prehistory_ash_mound',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['SOUTH_ASIAN'],
        prompt: "A huge mound of burnt cow dung, ash, and charcoal - deliberately built, then burned. Still warm at the center. You've heard of these - fertility ritual, or fuel storage, or territory marker. No one really knows. Fresh footprints circle it.",
        choices: [
            {
                text: "Dig into the mound, see what's inside",
                outcomes: [
                    { chance: 0.30, result: 'item', message: 'Inside the ash: ritual objects - small clay figurines, charred seeds, copper beads. You take a few items.', value: 'CLAY_FIGURINE' },
                    { chance: 0.40, result: 'death', message: 'Villagers arrive as you dig. You\'re desecrating sacred space. The punishment is immediate and brutal.' },
                    { chance: 0.30, result: 'injury', message: 'The mound collapses as you dig, hot ash and coals cascading. You\'re burned badly pulling yourself out.', value: 20 }
                ]
            },
            {
                text: "Add fuel to it, participate",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'Villagers arrive, see your addition. They explain the practice - cattle dung burning, soil enrichment, ritual purification. You\'re invited to the completion ceremony.', value: 'Neolithic ash mound practices' },
                    { chance: 0.35, result: 'nothing', message: 'You add dung and wood, but no one comes. Your participation goes unnoticed.' },
                    { chance: 0.20, result: 'item', message: 'Your respectful participation earns trust. The village headman gifts you a copper ornament from the ritual.', value: 'COPPER_BANGLE' }
                ]
            },
            {
                text: "Observe and document only",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'You sketch the mound, measure it, note the materials. Professional documentation. Villagers later appreciate your scholarly interest.', value: 'Archaeological measurement techniques' },
                    { chance: 0.30, result: 'nothing', message: 'You make notes and leave. Standard archaeological practice yields standard results.' },
                    { chance: 0.20, result: 'gold_gain', message: 'Your documentation helps the village prove ancient land claims. They reward you generously for the evidence.', value: 200 }
                ]
            }
        ]
    },
    // PREHISTORY EVENTS - SOUTH_AMERICAN
    {
        id: 'prehistory_mummy_bundle',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['SOUTH_AMERICAN'],
        prompt: "A burial bundle sits above ground in the ruin - wrapped in textiles, desiccated by dry air. It's been disturbed - wrappings partially unwound, revealing the body. Could be ancient. Could be recent. Hard to tell in this climate. Tools scattered nearby - someone was examining it.",
        choices: [
            {
                text: "Re-wrap it respectfully",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'As you re-wrap, family members arrive. Your respect for their ancestor earns trust. They explain Chinchorro mummification practices.', value: 'Ancient mummification techniques' },
                    { chance: 0.35, result: 'nothing', message: 'You re-wrap carefully and leave. No one appears. Your gesture goes unnoticed.' },
                    { chance: 0.20, result: 'item', message: 'Inside the wrappings, a small clay vessel tumbles free. You keep it - the family won\'t notice one item missing.', value: 'BURIAL_VESSEL' }
                ]
            },
            {
                text: "Examine it before re-wrapping",
                outcomes: [
                    { chance: 0.35, result: 'knowledge', message: 'You study the preservation - natural desiccation, textile quality, body position. Fascinating preservation. You document and re-wrap.', value: 'Desert preservation conditions' },
                    { chance: 0.40, result: 'death', message: 'Descendants arrive during your examination. Disturbing the dead is unforgivable. You join the ancestors.' },
                    { chance: 0.25, result: 'item', message: 'You remove a single textile sample - valuable weaving example. You re-wrap the rest carefully.', value: 'ANCIENT_TEXTILE' }
                ]
            },
            {
                text: "Leave it exactly as found",
                outcomes: [
                    { chance: 0.60, result: 'nothing', message: 'You don\'t touch it. Someone else\'s problem. You move on.' },
                    { chance: 0.25, result: 'knowledge', message: 'You photograph and measure without touching. Professional documentation. Later publications credit your restraint.', value: 'Non-invasive documentation' },
                    { chance: 0.15, result: 'gold_gain', message: 'Your report of the disturbed burial brings authorities. They pay you for protecting the site until they arrive.', value: 140 }
                ]
            }
        ]
    },
    {
        id: 'prehistory_potato_wild_patch',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['SOUTH_AMERICAN'],
        prompt: "Wild potato plants grow thick around the ruin's foundation. But they're in rows. Too regular for wild. Someone planted these, or tended wild ones into domestication. Fresh digging marks - someone harvested here recently.",
        choices: [
            {
                text: "Harvest some tubers yourself",
                outcomes: [
                    { chance: 0.40, result: 'item', message: 'You dig carefully, take a third of the tubers. Small potatoes, but edible. You leave the rest to grow.', value: 'WILD_POTATO' },
                    { chance: 0.35, result: 'death', message: 'The gardener returns, sees the theft. This plot feeds their family through winter. They can\'t let it go unpunished.' },
                    { chance: 0.25, result: 'knowledge', message: 'While harvesting, you notice the planting pattern - spacing, mounding, selective propagation. Early agriculture in action.', value: 'Potato domestication methods' }
                ]
            },
            {
                text: "Mark the location, don't disturb the crop",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'You study the patch without harvesting. The gardener arrives, appreciates your restraint, explains the multi-year selection process.', value: 'Crop improvement techniques' },
                    { chance: 0.30, result: 'nothing', message: 'You mark it and leave. When you return, the patch is harvested bare.' },
                    { chance: 0.20, result: 'item', message: 'Your respect earns the gardener\'s trust. They give you seed tubers from their best plants to start your own patch.', value: 'SEED_POTATO' }
                ]
            },
            {
                text: "Observe the planting pattern, learn the technique",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'You spend hours studying row spacing, soil mounding, plant selection. The technique becomes clear through observation.', value: 'Andean agriculture methods' },
                    { chance: 0.35, result: 'nothing', message: 'You try to understand but lack agricultural knowledge. The patterns remain mysterious.' },
                    { chance: 0.20, result: 'item', message: 'The gardener finds you studying respectfully. They gift you tubers and teach you the basics of cultivation.', value: 'CULTIVATED_POTATO' }
                ]
            }
        ]
    },
    // PREHISTORY EVENTS - SUB_SAHARAN_AFRICAN
    {
        id: 'prehistory_ostrich_eggshell',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['SUB_SAHARAN_AFRICAN'],
        prompt: "Decorated ostrich eggshell fragments - drilled for water storage, geometric incisions. Some ancient and weathered, some fresh and sharp-edged. A complete egg, carefully decorated, sits in a rock hollow. Water sloshes inside.",
        choices: [
            {
                text: "Drink from it - you're thirsty",
                outcomes: [
                    { chance: 0.35, result: 'nothing', message: 'You drink deeply. The water is cool, clean, life-saving. You leave the egg and move on, grateful.' },
                    { chance: 0.40, result: 'death', message: 'The egg\'s owner returns, finds it empty. Water theft in the desert is murder. Justice is swift.' },
                    { chance: 0.25, result: 'knowledge', message: 'As you drink, you examine the egg\'s decoration - symbolic patterns, drilling technique. You understand the technology before you go.', value: 'San water storage methods' }
                ]
            },
            {
                text: "Take just the ancient fragments for study",
                outcomes: [
                    { chance: 0.45, result: 'item', message: 'You collect weathered fragments - clearly ancient, abandoned. No current use, no theft.', value: 'DECORATED_EGGSHELL' },
                    { chance: 0.30, result: 'knowledge', message: 'Studying the old fragments, you see how decoration style has evolved over generations. Continuity of tradition.', value: 'Khoisan artistic traditions' },
                    { chance: 0.25, result: 'nothing', message: 'You take fragments but they crumble to dust in your pack. Too fragile, too old.' }
                ]
            },
            {
                text: "Leave the water cache undisturbed",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'You resist temptation. The owner arrives later, sees you nearby but hadn\'t touched their water. They share it freely and explain the decoration symbols.', value: 'Water management in arid regions' },
                    { chance: 0.30, result: 'nothing', message: 'You leave it alone and move on. Honorable but you remain thirsty and learn nothing.' },
                    { chance: 0.20, result: 'item', message: 'Your respect earns trust. The community gives you your own eggshell flask - undecorated, but functional.', value: 'OSTRICH_EGGSHELL_FLASK' }
                ]
            }
        ]
    },
    {
        id: 'prehistory_iron_bloom',
        era: HistoricalEra.PREHISTORY,
        culturalZones: ['SUB_SAHARAN_AFRICAN'],
        prompt: "A small furnace built into the ruin's wall. Iron bloom inside, partially worked. Charcoal still warm - operation ended recently, maybe because you approached. Hammers and anvil stones nearby. This is someone's forge.",
        choices: [
            {
                text: "Take the bloom - valuable material",
                outcomes: [
                    { chance: 0.35, result: 'item', message: 'You take the iron bloom - maybe two kilograms. Valuable raw material, worth considerable trade.', value: 'IRON_BLOOM' },
                    { chance: 0.45, result: 'death', message: 'The smith returns with apprentices. Stealing a smith\'s work is the gravest insult. Hammers make effective weapons.' },
                    { chance: 0.20, result: 'gold_gain', message: 'You trade the stolen bloom quickly to another smith. They pay well and ask no questions about origin.', value: 250 }
                ]
            },
            {
                text: "Wait for the smith to return",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'The smith returns cautiously. Seeing you waited respectfully, they demonstrate bloom consolidation - heating, hammering, working the iron.', value: 'Early African metallurgy' },
                    { chance: 0.30, result: 'nothing', message: 'You wait for hours. The smith doesn\'t return while you\'re present. Eventually you leave.' },
                    { chance: 0.30, result: 'item', message: 'Your patience impresses the smith. They give you a small iron knife - simple, but proof of their skill and your trustworthiness.', value: 'IRON_KNIFE' }
                ]
            },
            {
                text: "Leave everything, find another ruin",
                outcomes: [
                    { chance: 0.60, result: 'nothing', message: 'You give the forge wide berth. Smart - smiths are often protected by powerful patrons.' },
                    { chance: 0.25, result: 'knowledge', message: 'You study the furnace design from distance. Clay construction, air channels, ore selection. The technique becomes clear through observation.', value: 'Furnace construction methods' },
                    { chance: 0.15, result: 'item', message: 'Near the forge, you find discarded slag and broken tools. You collect pieces - no value to the smith, useful examples for you.', value: 'SLAG_SAMPLE' }
                ]
            }
        ]
    },
    // ANTIQUITY EVENTS
    {
        id: 'antiquity_bandits',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['EUROPEAN', 'MENA'],
        prompt: "While searching the perimeter, you notice fresh footprints leading away from the ruins. Following them, you discover a group of rough-looking men camped nearby, roasting meat over a fire.",
        choices: [
            {
                text: "Approach peacefully and offer to share information",
                outcomes: [
                    { chance: 0.4, result: 'gold_loss', message: 'They were bandits! They rob you of your coin and flee.', value: 50 },
                    { chance: 0.3, result: 'knowledge', message: 'They turn out to be local traders. They warn you about unstable sections of the ruins.', value: 'Local knowledge gained' },
                    { chance: 0.3, result: 'item', message: 'They offer you an old map they found in exchange for food.', value: 'ANCIENT_MAP' }
                ]
            },
            {
                text: "Hide and observe them from a distance",
                outcomes: [
                    { chance: 0.6, result: 'nothing', message: 'After watching for a while, they pack up and leave. You return to the ruins empty-handed.' },
                    { chance: 0.3, result: 'knowledge', message: 'You overhear them discussing dangerous wildlife in the area.', value: 'Awareness of local dangers' },
                    { chance: 0.1, result: 'death', message: 'Your foot slips on loose stone. They hear the noise and, thinking you\'re a threat, attack with spears. You don\'t survive.' }
                ]
            },
            {
                text: "Confront them and demand they leave",
                outcomes: [
                    { chance: 0.5, result: 'death', message: 'They outnumber you. Their leader draws a gladius and strikes you down.' },
                    { chance: 0.3, result: 'injury', message: 'A fight breaks out. You\'re wounded by a sling stone but manage to escape.', value: 15 },
                    { chance: 0.2, result: 'item', message: 'Intimidated by your boldness, they flee in panic, leaving behind supplies.', value: 'BRONZE_DAGGER' }
                ]
            }
        ]
    },
    {
        id: 'antiquity_cache',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['EUROPEAN', 'MENA'],
        prompt: "Near the ruins' foundation, you spot a partially buried amphora. It appears intact but sealed with ancient pitch.",
        choices: [
            {
                text: "Carefully excavate and open it",
                outcomes: [
                    { chance: 0.4, result: 'gold_gain', message: 'Inside you find 80 silver denarii, still bright despite the centuries!', value: 80 },
                    { chance: 0.3, result: 'item', message: 'The amphora contains preserved papyrus scrolls - still readable!', value: 'ANCIENT_SCROLL' },
                    { chance: 0.3, result: 'nothing', message: 'The vessel contains only dust and debris. Whatever was inside rotted long ago.' }
                ]
            },
            {
                text: "Smash it open immediately",
                outcomes: [
                    { chance: 0.5, result: 'nothing', message: 'You destroy the amphora, finding only pottery shards. Any contents are ruined.' },
                    { chance: 0.3, result: 'injury', message: 'The shattering ceramic cuts your hand deeply.', value: 8 },
                    { chance: 0.2, result: 'gold_gain', message: 'Gold coins spill out from the broken vessel!', value: 60 }
                ]
            },
            {
                text: "Leave it undisturbed - it belongs in a museum",
                outcomes: [
                    { chance: 0.7, result: 'knowledge', message: 'You make detailed notes of its location for future scholars.', value: 'Archaeological ethics' },
                    { chance: 0.3, result: 'nothing', message: 'You walk away. Later, you notice signs that someone else has taken it.' }
                ]
            }
        ]
    },
    {
        id: 'antiquity_wild_animal',
        era: HistoricalEra.ANTIQUITY,
        prompt: "You hear growling from behind a collapsed wall. A large predator - perhaps a wolf or wild cat - guards what looks like old bones and scattered metal objects.",
        choices: [
            {
                text: "Scare it away with noise and fire",
                outcomes: [
                    { chance: 0.5, result: 'item', message: 'The animal flees. Among the bones you find an ancient bronze blade.', value: 'BRONZE_DAGGER' },
                    { chance: 0.3, result: 'nothing', message: 'The animal runs off, but its den contains only bones and worthless debris.' },
                    { chance: 0.2, result: 'injury', message: 'The cornered animal attacks before fleeing, clawing your leg badly.', value: 12 }
                ]
            },
            {
                text: "Wait for it to leave naturally",
                outcomes: [
                    { chance: 0.6, result: 'nothing', message: 'After hours of waiting, you give up. The animal shows no sign of leaving.' },
                    { chance: 0.3, result: 'knowledge', message: 'Watching the animal, you notice it avoids certain areas - unstable ground you would have stepped on.', value: 'Animal behavior awareness' },
                    { chance: 0.1, result: 'item', message: 'The animal eventually leaves. You find old coins in its den.', value: 'ANCIENT_COIN' }
                ]
            },
            {
                text: "Attack it and claim the den",
                outcomes: [
                    { chance: 0.4, result: 'death', message: 'The predator is stronger and faster than expected. You don\'t survive the encounter.' },
                    { chance: 0.4, result: 'injury', message: 'You kill the beast but suffer deep wounds in the fight.', value: 20 },
                    { chance: 0.2, result: 'gold_gain', message: 'You slay the animal and find a cache of old jewelry - likely from previous victims.', value: 150 }
                ]
            }
        ]
    },
    {
        id: 'antiquity_structural_hazard',
        era: HistoricalEra.ANTIQUITY,
        prompt: "Part of the ruin\'s wall looks unstable but there\'s an opening that might lead to an intact chamber. You hear shifting stone.",
        choices: [
            {
                text: "Carefully shore up the wall before entering",
                outcomes: [
                    { chance: 0.4, result: 'item', message: 'Your caution pays off. Inside you find preserved artifacts protected from the elements.', value: 'ANCIENT_SCROLL' },
                    { chance: 0.4, result: 'nothing', message: 'After hours of careful work, you find the chamber is empty save for dust.' },
                    { chance: 0.2, result: 'gold_gain', message: 'The chamber contains intact pottery and small valuables.', value: 120 }
                ]
            },
            {
                text: "Enter quickly before it collapses",
                outcomes: [
                    { chance: 0.3, result: 'gold_gain', message: 'You dash in and grab what you can - old coins and jewelry - before the wall collapses behind you.', value: 200 },
                    { chance: 0.5, result: 'death', message: 'The wall collapses as you enter. You\'re crushed under tons of ancient stone.' },
                    { chance: 0.2, result: 'injury', message: 'You escape but falling debris breaks your arm.', value: 18 }
                ]
            },
            {
                text: "Mark the location and leave - too dangerous",
                outcomes: [
                    { chance: 0.7, result: 'nothing', message: 'You mark the spot and move on. Perhaps someone better equipped will explore it later.' },
                    { chance: 0.2, result: 'knowledge', message: 'Your notes about the structure\'s instability help you recognize similar dangers elsewhere.', value: 'Structural engineering awareness' },
                    { chance: 0.1, result: 'death', message: 'As you leave, the entire section collapses. You\'re caught in the rubble.' }
                ]
            }
        ]
    },
    {
        id: 'antiquity_shepherd_camp',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['EUROPEAN', 'MENA'],
        prompt: "A shepherd has set up camp in the ruins' sheltered corner. His flock grazes nearby. He's arranged stones as a fire pit, hung a water skin from an old column. 'Been using this spot for years,' he tells you. 'My father did too. Good shelter.' He's boiling something in a clay pot.",
        choices: [
            {
                text: "Ask about the ruins and local knowledge",
                outcomes: [
                    { chance: 0.5, result: 'knowledge', message: 'He points out safe paths, unstable walls, where water collects in cisterns. Practical information from someone who knows every stone.', value: 'Local site knowledge' },
                    { chance: 0.3, result: 'item', message: 'He shows you coins his family has found over the years. Offers to trade one for food or tools.', value: 'BRONZE_COIN' },
                    { chance: 0.2, result: 'nothing', message: 'He\'s not interested in talking. Nods politely, returns to his pot.' }
                ]
            },
            {
                text: "Share food and rest with him",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'He shares stories passed down - which stones were part of what building, who lived here. Oral history, not written records.', value: 'Generational memory of site' },
                    { chance: 0.4, result: 'nothing', message: 'You eat together. Pleasant enough. He leaves at dawn with his flock.' },
                    { chance: 0.2, result: 'gold_loss', message: 'While you sleep, he takes your coin purse. Shepherds aren\'t all honest.', value: 30 }
                ]
            },
            {
                text: "Warn him this is an archaeological site, not a campground",
                outcomes: [
                    { chance: 0.5, result: 'nothing', message: 'He stares at you. "My family has sheltered here for generations." He doesn\'t move.' },
                    { chance: 0.3, result: 'nothing', message: 'He laughs. "You think you own old stones?" Continues his business.' },
                    { chance: 0.2, result: 'knowledge', message: 'He gets defensive but talks. Turns out his family built homes from stones here. He knows where they took them from.', value: 'Stone reuse patterns' }
                ]
            }
        ]
    },
    {
        id: 'antiquity_merchant_rest',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['EAST_ASIAN'],
        prompt: "A traveling merchant has stopped at the ruins to rest. His cart is loaded with pottery and bronze goods. He's eating dried meat, checking his inventory on bamboo slips. 'Road's long,' he says. 'These walls block the wind.' His donkey grazes nearby.",
        choices: [
            {
                text: "Ask about his trade routes and goods",
                outcomes: [
                    { chance: 0.5, result: 'knowledge', message: 'He sketches routes in the dirt - market towns, safe rest stops, which officials take bribes. Practical merchant knowledge.', value: 'Trade route information' },
                    { chance: 0.3, result: 'item', message: 'He offers to trade - a bronze mirror for food or information about the road ahead.', value: 'BRONZE_MIRROR' },
                    { chance: 0.2, result: 'nothing', message: 'He\'s tired, not interested in conversation. Finishes eating and moves on.' }
                ]
            },
            {
                text: "Offer to help guard his goods while he sleeps",
                outcomes: [
                    { chance: 0.4, result: 'gold_gain', message: 'He pays you. Pleasant night, no trouble. Good honest work.', value: 50 },
                    { chance: 0.4, result: 'knowledge', message: 'Over tea, he talks about what ruins like this mean for trade - shelter, landmarks, sometimes robbers. His perspective is purely practical.', value: 'Merchant view of archaeology' },
                    { chance: 0.2, result: 'injury', message: 'Bandits do come. You fight them off but take a knife wound.', value: 12 }
                ]
            },
            {
                text: "Try to rob him - he's alone and loaded with goods",
                outcomes: [
                    { chance: 0.3, result: 'gold_gain', message: 'He\'s old and tired. You take what you can carry and run.', value: 120 },
                    { chance: 0.4, result: 'death', message: 'He travels this road for a reason - he knows how to fight. The dagger under his robe is sharp and his aim is true.' },
                    { chance: 0.3, result: 'injury', message: 'His donkey kicks you hard. He escapes while you\'re stunned.', value: 15 }
                ]
            }
        ]
    },
    {
        id: 'antiquity_stone_collectors',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['EUROPEAN'],
        yearMin: -800,
        yearMax: -300,
        prompt: "A family is carefully removing dressed stones from the ruins, loading them onto a wooden cart. Father, two sons, working methodically. 'Building a house in town,' the father explains. 'Good stone, already cut. Would be wasteful to quarry new.' They've taken maybe a dozen blocks.",
        choices: [
            {
                text: "Help them load stones in exchange for information",
                outcomes: [
                    { chance: 0.5, result: 'knowledge', message: 'While working, they point out which stones are loose, which walls are unstable. They know this place from years of harvesting material.', value: 'Structural knowledge from stone reuse' },
                    { chance: 0.3, result: 'item', message: 'One son finds a bronze fitting wedged between stones. He gives it to you as thanks.', value: 'BRONZE_FITTING' },
                    { chance: 0.2, result: 'injury', message: 'A stone slips while loading. Crushes your foot.', value: 18 }
                ]
            },
            {
                text: "Document which stones they're taking",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'You record their systematic removal pattern. Turns out they only take from certain walls - they know which are structurally important.', value: 'Pattern of stone reuse' },
                    { chance: 0.4, result: 'nothing', message: 'They don\'t care what you\'re doing. Continue their work.' },
                    { chance: 0.2, result: 'gold_loss', message: 'They think you\'re a tax assessor. They bribe you to go away. You don\'t correct them.', value: 0 }
                ]
            },
            {
                text: "Tell them they're destroying history",
                outcomes: [
                    { chance: 0.5, result: 'nothing', message: 'The father shrugs. "These stones were here before my grandfather. They\'ll outlast my grandchildren. We need a house now."' },
                    { chance: 0.3, result: 'knowledge', message: 'They get defensive but explain - every house in town has stones from here. It\'s how building works.', value: 'Vernacular architecture reuse' },
                    { chance: 0.2, result: 'injury', message: 'They don\'t take kindly to lectures. The sons encourage you to leave. Physically.', value: 10 }
                ]
            }
        ]
    },
    {
        id: 'antiquity_shepherds_shelter',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['EUROPEAN', 'MENA'],
        yearMin: -500,
        yearMax: -300,
        prompt: "Three shepherds have set up camp in the ruins with their small flock. They're cooking flatbread on heated stones and repairing a torn cloak. An older man greets you. 'We bring the sheep through here twice a year. These walls keep the wind off.' He gestures at carved stones they've stacked for their fire ring. 'Been using these same spots since my father's time.'",
        choices: [
            {
                text: "Share a meal and ask about the area",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'They know every path and water source for fifty miles. One mentions seeing armed men moving at night near the coast - useful intelligence about bandit or military activity.', value: 'Local geography and travel routes' },
                    { chance: 0.4, result: 'item', message: 'The older shepherd gives you a worn bronze fibula he found here years ago. "Might be worth something in town. We have no use for it."', value: 'BRONZE_FIBULA' },
                    { chance: 0.2, result: 'nothing', message: 'Pleasant conversation but nothing remarkable. They\'re just shepherds doing what shepherds do, twice a year, every year.' }
                ]
            },
            {
                text: "Ask if you can examine the stones they're using",
                outcomes: [
                    { chance: 0.3, result: 'knowledge', message: 'Among their fire ring stones you spot an inscription fragment - part of a dedication to a local deity. They shrug when you point it out. "Just rocks to us."', value: 'Religious inscription fragment' },
                    { chance: 0.5, result: 'nothing', message: 'The stones are unremarkable pieces of old walls. The shepherds seem puzzled by your interest in building rubble.' },
                    { chance: 0.2, result: 'injury', message: 'You disturb their fire trying to examine a stone. Hot coals scatter, burning your hand. They\'re annoyed at the disruption.', value: 8 }
                ]
            },
            {
                text: "Trade with them for wool or supplies",
                outcomes: [
                    { chance: 0.4, result: 'gold_loss', message: 'You buy fresh wool and cheese. Fair prices, honest trade. They seem pleased to make the transaction.', value: 40 },
                    { chance: 0.4, result: 'item', message: 'They need iron needles for repairs. You trade and they throw in a good sheepskin for your trouble.', value: 'SHEEPSKIN' },
                    { chance: 0.2, result: 'nothing', message: 'They don\'t need what you have, and you don\'t need wool right now. Everyone parts amicably.' }
                ]
            }
        ]
    },
    {
        id: 'antiquity_merchant_rest',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['MENA', 'EAST_ASIAN', 'SOUTH_ASIAN'],
        yearMin: -550,
        yearMax: 651,
        prompt: "A merchant caravan has stopped here for the midday heat. Pack animals stand tethered in the shade of broken walls. Two merchants argue about their route while servants unpack food. One notices you. 'You know this area? We're trying to reach the river crossing before the rains come. Local guides keep giving us different advice.'",
        choices: [
            {
                text: "Offer what you know about the routes",
                outcomes: [
                    { chance: 0.4, result: 'gold_gain', message: 'Your information saves them days of travel. They pay you a guide fee and share news from the cities they\'ve visited - valuable market intelligence.', value: 60 },
                    { chance: 0.3, result: 'knowledge', message: 'They know the caravan routes across three satrapies. In exchange for your help, they explain the seasonal trade patterns and which goods move where.', value: 'Regional trade routes and commodity flows' },
                    { chance: 0.3, result: 'nothing', message: 'Your information conflicts with what they\'ve already heard. They thank you politely but stick with their original plan.' }
                ]
            },
            {
                text: "Ask if they need anything repaired or supplied",
                outcomes: [
                    { chance: 0.4, result: 'gold_gain', message: 'They need leather strapping repaired. You fix several pack harnesses and they pay fairly.', value: 35 },
                    { chance: 0.4, result: 'item', message: 'One of their pack animals threw a load and damaged goods. They sell you water-damaged textiles at a steep discount rather than haul them.', value: 'DAMAGED_TEXTILES' },
                    { chance: 0.2, result: 'nothing', message: 'Everything is in order. They\'re well-supplied and well-organized. Professional operation.' }
                ]
            },
            {
                text: "Ask about news from the cities",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'They\'ve just come from a regional capital. Tax collectors are moving through the province, and there\'s talk of troop movements - useful information for travelers.', value: 'Current political and military movements' },
                    { chance: 0.4, result: 'nothing', message: 'Standard merchant news - prices, road conditions, weather. Nothing you didn\'t already know or couldn\'t guess.' },
                    { chance: 0.2, result: 'gold_loss', message: 'They\'re more interested in extracting information from you. You end up buying wine to keep the conversation going but learn nothing useful.', value: 25 }
                ]
            }
        ]
    },
    {
        id: 'antiquity_children_playing',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['EAST_ASIAN'],
        yearMin: -206,
        yearMax: 220,
        prompt: "Several children are playing among the ruins, using broken columns as a course for some kind of game. They've drawn characters in the dirt and are keeping score with pebbles. When they see you, an older girl calls out, 'This is our spot! We found a lucky coin here last year.' The younger ones show you small pottery shards they've collected.",
        choices: [
            {
                text: "Ask them what they know about this place",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'They tell you about a sealed chamber their parents won\'t let them enter. "Old dead people things inside," one explains. The spot would be worth investigating.', value: 'Location of sealed chamber' },
                    { chance: 0.4, result: 'item', message: 'One child offers to trade pottery shards for sweets. Among the pieces is a Han dynasty coin - not valuable, but authentic.', value: 'HAN_COIN' },
                    { chance: 0.2, result: 'nothing', message: 'They know the place as well as they know their own homes - which means they see it as a playground, not history. Nothing useful to learn.' }
                ]
            },
            {
                text: "Join their game for a bit",
                outcomes: [
                    { chance: 0.5, result: 'nothing', message: 'You play their jumping game for a while. They laugh at your attempts. It\'s pleasant but nothing more than that.' },
                    { chance: 0.3, result: 'knowledge', message: 'While playing, you notice carved characters on stones they use as markers. Fragments of an official inscription the kids can\'t read.', value: 'Administrative inscription fragments' },
                    { chance: 0.2, result: 'injury', message: 'You twist your ankle on uneven rubble trying to keep up with children who know every footfall. They find this hilarious.', value: 6 }
                ]
            },
            {
                text: "Offer them small coins for anything interesting they find",
                outcomes: [
                    { chance: 0.4, result: 'item', message: 'They return later with a bronze belt hook - corroded but intact. Worth the few coins you paid them.', value: 'BRONZE_BELT_HOOK' },
                    { chance: 0.4, result: 'gold_loss', message: 'They bring you every worthless pottery shard and rock for the next hour. You pay for junk to be polite.', value: 15 },
                    { chance: 0.2, result: 'nothing', message: 'Their parents call them home before they can search. The offer stands but they don\'t return.' }
                ]
            }
        ]
    },
    {
        id: 'antiquity_ritual_offering',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['SOUTH_ASIAN'],
        yearMin: -322,
        yearMax: -185,
        prompt: "A woman is arranging flowers and oil lamps among the ruins. Small clay figures sit in niches in the old walls. She looks up as you approach. 'My grandmother's grandmother used this place,' she explains. 'We keep the offerings going. The spirits here are old but not hostile, if you respect them.' Behind her, two helpers are cleaning debris from a carved stone.",
        choices: [
            {
                text: "Ask about the history of the offerings",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'She explains the site was a way-station centuries ago. The offerings honor travelers who died here. She describes old routes that haven\'t been used in generations.', value: 'Ancient trade route locations' },
                    { chance: 0.3, result: 'nothing', message: 'The history has become myth mixed with family tradition. She can\'t separate fact from legend. The offerings continue regardless.' },
                    { chance: 0.3, result: 'item', message: 'She shows you old oil lamps her family has collected here over years. She gives you a damaged one. "It\'s from the founding, I think. Worth more to you than me."', value: 'ANCIENT_OIL_LAMP' }
                ]
            },
            {
                text: "Offer to help clean the space",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'While clearing rubble, you uncover a carved stone with readable inscriptions - a dedication to a local deity with the names of donors.', value: 'Donor inscription with names and dates' },
                    { chance: 0.4, result: 'nothing', message: 'You help clear debris and reset some carved stones. It\'s manual labor. She thanks you but has nothing to offer in return.' },
                    { chance: 0.2, result: 'injury', message: 'A stone shifts unexpectedly. You catch it but wrench your back. She offers herbs for the pain.', value: 9 }
                ]
            },
            {
                text: "Ask if you can take rubbings of the carvings",
                outcomes: [
                    { chance: 0.5, result: 'knowledge', message: 'She allows it. The carvings include names and administrative titles from a local dynasty. Historians would value these records.', value: 'Administrative records of local officials' },
                    { chance: 0.3, result: 'gold_loss', message: 'She agrees but asks for a donation to buy more offerings. Fair request. You pay.', value: 30 },
                    { chance: 0.2, result: 'nothing', message: 'The carvings are too worn to read clearly. Your rubbings capture little of value.' }
                ]
            }
        ]
    },
    {
        id: 'antiquity_ceramic_workshop',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['SOUTH_AMERICAN'],
        yearMin: 100,
        yearMax: 800,
        prompt: "A potter has set up a temporary workspace among the ruins, using a broken wall as a windbreak for his kiln. Several painted vessels are drying in the sun. He's mixing clay and notices your interest. 'Good clay here,' he explains. 'My family has been collecting it from this spot for generations. Something about the old buildings makes it mixed right.'",
        choices: [
            {
                text: "Ask about the painted designs on the vessels",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'He explains the traditional designs - some depict old stories, others are protective symbols. He learned them from his father, who learned from his father. Continuity across centuries.', value: 'Traditional ceramic iconography meanings' },
                    { chance: 0.4, result: 'item', message: 'He has a cracked vessel he can\'t sell. He offers it to you for a small price. The painting is intricate despite the damage.', value: 'PAINTED_CERAMIC_VESSEL' },
                    { chance: 0.2, result: 'nothing', message: 'The designs are trade secrets. He\'s polite but won\'t discuss the meanings or techniques in detail.' }
                ]
            },
            {
                text: "Examine the ruins he's using for shelter",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'While looking at the wall structure, you notice fragments of painted plaster. The potter knows nothing about them, but the colors and style are distinctive.', value: 'Architectural painting fragments' },
                    { chance: 0.4, result: 'nothing', message: 'The ruins are thoroughly broken down. Generations of people taking building material have left little that\'s recognizable.' },
                    { chance: 0.2, result: 'injury', message: 'Part of the old wall is unstable. When you lean close to examine it, rubble shifts and scrapes your arm badly.', value: 7 }
                ]
            },
            {
                text: "Offer to trade for one of the finished vessels",
                outcomes: [
                    { chance: 0.4, result: 'gold_loss', message: 'He sells you a well-made vessel. Fair price, good craftsmanship. He seems pleased with the transaction.', value: 45 },
                    { chance: 0.4, result: 'item', message: 'He doesn\'t need coin but will trade for materials - you exchange some tools for a decorated vessel.', value: 'DECORATED_VESSEL' },
                    { chance: 0.2, result: 'nothing', message: 'These vessels are already promised to customers. He has nothing available for trade right now.' }
                ]
            }
        ]
    },
    {
        id: 'antiquity_material_collectors',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['EUROPEAN', 'MENA'],
        yearMin: 330,
        yearMax: 476,
        prompt: "Two men are systematically removing carved stones from a collapsed wall, loading them onto a cart. One sees you watching. 'Building a church,' he explains in Greek. 'The bishop sent us. These stones are cut square already - saves weeks of work. The old gods don't need them anymore.' They've got a dozen good blocks stacked up.",
        choices: [
            {
                text: "Ask what they know about the original structure",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'They mention finding coins and broken pottery while clearing rubble. "Old Roman stuff, probably. The site goes back to the first emperors, people say."', value: 'Site dating and prior occupancy' },
                    { chance: 0.3, result: 'item', message: 'They toss you a bronze fragment they found. "Pagan thing, no use to us. Maybe worth something to the right buyer."', value: 'BRONZE_VOTIVE_FRAGMENT' },
                    { chance: 0.3, result: 'nothing', message: 'They\'re laborers, not scholars. They know stone cutting, nothing about history. "Rock is rock," one shrugs.' }
                ]
            },
            {
                text: "Examine the stones before they load them",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'Several stones have Latin inscriptions - dedications, names, official titles. You note them down before the stones are carted away to become anonymous building material.', value: 'Inscription records of Roman officials' },
                    { chance: 0.4, result: 'nothing', message: 'Most stones are plain cut blocks. Whatever decorative elements existed have already been removed or are too weathered to read.' },
                    { chance: 0.2, result: 'injury', message: 'You get too close as they lever a stone. It shifts and pins your foot. They help free you but you\'re limping.', value: 10 }
                ]
            },
            {
                text: "Offer to help in exchange for finds they don't want",
                outcomes: [
                    { chance: 0.4, result: 'item', message: 'You work for an hour. They let you keep small carved fragments - bits of molding, a corner piece with relief work. Nothing valuable to them.', value: 'ARCHITECTURAL_FRAGMENTS' },
                    { chance: 0.4, result: 'gold_loss', message: 'They accept your help but expect payment for any decent finds. You end up buying a carved stone piece at their asking price.', value: 35 },
                    { chance: 0.2, result: 'nothing', message: 'The work is backbreaking and they find nothing but plain cut stone. You part ways with aching muscles and no finds.' }
                ]
            }
        ]
    },
    {
        id: 'antiquity_obsidian_cache',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
        yearMin: 100,
        yearMax: 550,
        prompt: "You find a hidden cache among the rubble - a sealed clay pot tucked into a wall niche. Inside are obsidian blades wrapped in old cloth, along with some small pieces of worked jade. This looks like someone's emergency supply, hidden and never retrieved. The wrapping is rotted but the stone pieces are intact.",
        choices: [
            {
                text: "Take the obsidian blades - they're valuable",
                outcomes: [
                    { chance: 0.4, result: 'item', message: 'The obsidian is expertly worked. You take the blades carefully. Someone lost these, but that was generations ago.', value: 'OBSIDIAN_BLADES' },
                    { chance: 0.3, result: 'gold_gain', message: 'The obsidian and small jade pieces fetch a good price. Craftsmanship like this is rare.', value: 120 },
                    { chance: 0.3, result: 'injury', message: 'The obsidian is sharper than you expected. One blade slices your hand deeply as you remove it from the pot.', value: 8 }
                ]
            },
            {
                text: "Examine the cache carefully before touching anything",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'The wrapping shows signs of deliberate ritual placement. This wasn\'t just hidden - it was an offering or burial cache. The position in the wall is specific.', value: 'Ritual cache placement practices' },
                    { chance: 0.3, result: 'item', message: 'You find markings on the pot that might indicate ownership or purpose. You take rubbings before removing the contents.', value: 'POT_MARKINGS' },
                    { chance: 0.3, result: 'nothing', message: 'The pot is old, the contents are stone blades. There\'s nothing more to learn from careful examination.' }
                ]
            },
            {
                text: "Leave everything and mark the location",
                outcomes: [
                    { chance: 0.5, result: 'knowledge', message: 'You document the find in place. Undisturbed caches like this are rare. Scholars might pay for accurate location information.', value: 'Documented cache location' },
                    { chance: 0.3, result: 'nothing', message: 'You mark it and leave. When you return later, someone else has already taken everything. Your restraint gains you nothing.' },
                    { chance: 0.2, result: 'knowledge', message: 'Locals see you leaving it untouched. One approaches later and explains the site\'s significance. Respect earns you real information.', value: 'Sacred site significance explained by locals' }
                ]
            }
        ]
    },
    {
        id: 'antiquity_runaway',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['EUROPEAN', 'MENA'],
        yearMin: -300,
        yearMax: 476,
        prompt: "A young woman in rough clothing rests near the ruins, eating bread. Her wrists show old scars from shackles. She notices you and tenses. 'I'm traveling to the port,' she says carefully. 'Looking for work on the ships. Free work.' The emphasis on 'free' is deliberate. You've heard the local estate is missing a weaver slave.",
        choices: [
            {
                text: "Offer food and let her go without comment",
                outcomes: [
                    { chance: 0.40, result: 'nothing', message: 'She takes the food and leaves quickly. You don\'t ask questions. She doesn\'t volunteer information. Later, you hear a ship left for Alexandria with new crew.' },
                    { chance: 0.30, result: 'knowledge', message: 'She tells you about conditions on the estate - the work, the punishments, why she left. Specific details about slave labor management. Educational and grim.', value: 'Slave labor conditions firsthand' },
                    { chance: 0.30, result: 'gold_loss', message: 'Slave hunters question you later. You gave food to a fugitive. The estate demands compensation for aiding escape. You pay or face charges.', value: 180 }
                ]
            },
            {
                text: "Report her location to the estate for the reward",
                outcomes: [
                    { chance: 0.45, result: 'gold_gain', message: 'The estate pays 80 denarii for return of property. She\'s taken back in chains. You have money. She has more years of forced labor.', value: 80 },
                    { chance: 0.30, result: 'knowledge', message: 'The estate overseer thanks you. He explains their slave management system - costs, productivity, punishments. He treats it like accounting. Which it is, to him.', value: 'Estate slave economics' },
                    { chance: 0.25, result: 'nothing', message: 'They take her back. She doesn\'t fight or plead. Just silent acceptance. You wonder if the reward was worth it. The question doesn\'t have a simple answer.' }
                ]
            },
            {
                text: "Ask what skills she has and if you could hire her",
                outcomes: [
                    { chance: 0.35, result: 'knowledge', message: 'She\'s an excellent weaver but has no papers proving freedom. You discuss the legal complications. Roman law on slavery and manumission is complex. Educational conversation about legal personhood.', value: 'Roman slavery law and manumission' },
                    { chance: 0.35, result: 'gold_loss', message: 'You try to hire her legally. The estate sues you for harboring fugitive property. Legal fees and settlement cost you heavily. She\'s returned to the estate anyway.', value: 350 },
                    { chance: 0.30, result: 'item', message: 'She quickly weaves you a small cloth as demonstration of skill, then leaves before you can decide. The weaving is exceptional. You keep it - proof of what enslaved talent produces.', value: 'WOVEN_CLOTH' }
                ]
            }
        ]
    },
    {
        id: 'antiquity_sealed_chamber',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['MENA', 'SUB_SAHARAN_AFRICAN'],
        prompt: "You find a sealed tomb entrance. Protective inscriptions carved around the doorway warn against disturbance - standard mortuary practice. Fresh flowers at the entrance mean someone still tends this grave. Through a crack in the seal, you can see painted walls and the edge of a burial chamber.",
        choices: [
            {
                text: "Force the seal open now",
                outcomes: [
                    { chance: 0.30, result: 'gold_gain', message: 'The chamber contains burial goods: faience amulets, a bronze mirror, linen wrappings with paint. Modest wealth for a minor official. You take what you can carry.', value: 180 },
                    { chance: 0.30, result: 'death', message: 'Sealed chambers concentrate gases from decomposition. The air inside hasn\'t circulated in centuries. You breathe deeply and collapse within seconds.' },
                    { chance: 0.25, result: 'injury', message: 'The ceiling was cracked. Your forced entry triggers a collapse. Falling stones break your arm and nearly bury you. You escape, badly hurt.', value: 22 },
                    { chance: 0.15, result: 'item', message: 'Among modest goods, one piece stands out: a papyrus scroll with funerary texts. The calligraphy is exceptionally fine.', value: 'FUNERARY_PAPYRUS' }
                ]
            },
            {
                text: "Wait and observe who leaves the offerings",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'An elderly priest arrives at dawn. This tomb holds his teacher - a physician who trained at temple schools. He explains Egyptian medical practice and embalming techniques.', value: 'Ancient Egyptian medicine' },
                    { chance: 0.35, result: 'item', message: 'A woman visits - maintaining family tradition across generations. Grateful you didn\'t loot her ancestor, she gifts you a name cartouche with historical context.', value: 'CARTOUCHE' },
                    { chance: 0.25, result: 'nothing', message: 'You wait three days. No one comes. The flowers might be weeks old. You\'ve lost time.' }
                ]
            },
            {
                text: "Make offerings, approach respectfully",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'Inside, burial inscriptions describe the deceased\'s medical work. Formulas for treatments, surgical procedures. Educational, not magical - real Egyptian science.', value: 'Medical papyri knowledge' },
                    { chance: 0.30, result: 'item', message: 'The tomb was partially looted long ago, but robbers missed items: an alabaster jar of preserved resin, still fragrant after centuries.', value: 'MYRRH_OIL' },
                    { chance: 0.30, result: 'gold_loss', message: 'You spend money on proper offerings and time on rituals. Inside, the chamber was already emptied by ancient tomb robbers. Only wall paintings remain.', value: 80 }
                ]
            }
        ]
    },

    // MEDIEVAL EVENTS
    {
        id: 'medieval_travelers_directions',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['EUROPEAN'],
        yearMin: 793,
        yearMax: 1066,
        prompt: "A family traveling with a cart has stopped at the ruins to rest and water their horse. They're eating bread and discussing their route. The father sees you and calls out, 'You know this area? We're trying to get to the market town before Saturday. This road doesn't look like it goes anywhere.' His wife is examining her map, which appears to be more decorative than functional.",
        choices: [
            {
                text: "Help them find the correct route",
                outcomes: [
                    { chance: 0.4, result: 'gold_gain', message: 'You point them toward the right road. They insist on paying you for the help - a fair price for saving them a day of wrong turns.', value: 45 },
                    { chance: 0.3, result: 'knowledge', message: 'They share news from the towns they\'ve passed through. Market prices, which roads are good, where there\'s been trouble with bandits. Useful information.', value: 'Current regional travel conditions' },
                    { chance: 0.3, result: 'nothing', message: 'Your directions turn out to match what they\'d already been told. They thank you but it wasn\'t really necessary.' }
                ]
            },
            {
                text: "Ask if they need anything repaired or want to trade",
                outcomes: [
                    { chance: 0.4, result: 'item', message: 'Their cart wheel is coming loose. You help them repair it and they trade you some of their goods in thanks.', value: 'TRADE_GOODS' },
                    { chance: 0.4, result: 'gold_loss', message: 'They have fresh bread and cheese. You buy some for the road - it\'s been a while since you had decent food.', value: 30 },
                    { chance: 0.2, result: 'nothing', message: 'Everything is in order and they don\'t need anything. Polite conversation, then they continue on their way.' }
                ]
            },
            {
                text: "Ask about their map - it looks unusual",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'It\'s a family heirloom, three generations old. It shows old Roman roads that aren\'t on any current maps. They let you copy some of it.', value: 'Old road network from outdated map' },
                    { chance: 0.4, result: 'nothing', message: 'The map is decorative - made by someone who never traveled these roads. It\'s pretty but inaccurate. They know it.' },
                    { chance: 0.2, result: 'gold_loss', message: 'They offer to sell you the map. You buy it out of interest, though it\'s not particularly useful for modern travel.', value: 40 }
                ]
            }
        ]
    },
    {
        id: 'medieval_herders_complaint',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['EAST_ASIAN', 'MENA', 'EUROPEAN'],
        yearMin: 1206,
        yearMax: 1368,
        prompt: "Several herders have brought their animals to graze near the ruins where there's still some grass. Two of them are arguing loudly about grazing rights while a third tries to mediate. One sees you approach. 'You're not with the tax collector, are you? Because we already paid at the river crossing. This is free grazing land, always has been.' The goats wander freely among the broken walls.",
        choices: [
            {
                text: "Assure them you're not a tax collector and ask about the area",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'They relax and tell you about local grazing patterns, which routes the herds take seasonally, and where water can be found. Practical knowledge of the region.', value: 'Seasonal grazing routes and water sources' },
                    { chance: 0.4, result: 'nothing', message: 'They share common knowledge about the area - nothing you couldn\'t have learned elsewhere. Still, they\'re friendly enough.' },
                    { chance: 0.2, result: 'gold_loss', message: 'To prove you\'re not a tax collector, you end up buying mare\'s milk from them. It\'s an expensive way to establish trust.', value: 25 }
                ]
            },
            {
                text: "Help mediate their grazing rights dispute",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'While helping them sort out whose family has traditional rights here, you learn about local land ownership patterns going back generations. Useful context.', value: 'Traditional land use and family territories' },
                    { chance: 0.3, result: 'item', message: 'They\'re grateful for your mediation. One gives you a well-made leather water skin as thanks.', value: 'LEATHER_WATER_SKIN' },
                    { chance: 0.3, result: 'nothing', message: 'They ignore your attempts to help. This is a family dispute that goes back years. An outsider can\'t solve it.' }
                ]
            },
            {
                text: "Ask if they've found anything interesting in the ruins",
                outcomes: [
                    { chance: 0.4, result: 'item', message: 'One mentions finding old coins sometimes. He shows you a handful of corroded pieces. "You want them? Goats don\'t care about this stuff."', value: 'CORRODED_COINS' },
                    { chance: 0.4, result: 'nothing', message: 'They don\'t pay attention to old stones. The ruins are just a landmark to them, a place with grass.' },
                    { chance: 0.2, result: 'knowledge', message: 'They mention their grandfather told stories about the people who lived here. The details are vague, but the timeline is useful.', value: 'Oral history timeline of site abandonment' }
                ]
            }
        ]
    },
    {
        id: 'medieval_hidden_supplies',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['EAST_ASIAN'],
        yearMin: 960,
        yearMax: 1279,
        prompt: "You notice fresh digging near a collapsed wall - someone has been burying things here recently. A partially covered basket contains rice, some copper coins, and a bundle wrapped in oiled cloth. This looks like someone's emergency cache, hidden for retrieval later. The dirt is loose, the work hasty.",
        choices: [
            {
                text: "Examine the cache without taking anything",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'The oiled cloth wrapping contains documents - family records or property deeds. Someone is hiding valuables from officials or invaders. The situation suggests instability in the region.', value: 'Evidence of regional instability and hiding behavior' },
                    { chance: 0.4, result: 'nothing', message: 'It\'s just food, coins, and cloth. Emergency supplies. Nothing reveals who buried it or why.' },
                    { chance: 0.2, result: 'injury', message: 'As you dig, the wall above shifts. Rubble falls, catching your shoulder. You scramble away before worse happens.', value: 11 }
                ]
            },
            {
                text: "Take what you need and rebury the rest",
                outcomes: [
                    { chance: 0.4, result: 'gold_gain', message: 'You take some of the coins and rice, leaving the documents and most of the supplies. Someone may need them worse than you.', value: 40 },
                    { chance: 0.3, result: 'item', message: 'The oiled cloth is valuable by itself. You take it, leaving the papers exposed to the elements. Practical choice.', value: 'OILED_CLOTH' },
                    { chance: 0.3, result: 'nothing', message: 'Someone returns while you\'re deciding what to take. They watch silently from a distance. You back away, not wanting confrontation, taking nothing.' }
                ]
            },
            {
                text: "Cover it back up and leave it undisturbed",
                outcomes: [
                    { chance: 0.5, result: 'nothing', message: 'You rebury everything carefully. Whoever hid this might desperately need it. Not your emergency to solve.' },
                    { chance: 0.3, result: 'knowledge', message: 'While covering it, you notice carved characters on the wall nearby - a marker to help find the cache again. This teaches you something about how locals use these ruins.', value: 'Local marking and caching practices' },
                    { chance: 0.2, result: 'gold_gain', message: 'Days later, someone approaches you in town. They saw you leave their cache alone. They insist on paying you a finder\'s fee for your honesty.', value: 50 }
                ]
            }
        ]
    },
    {
        id: 'medieval_water_seekers',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['MENA', 'SOUTH_ASIAN', 'SUB_SAHARAN_AFRICAN'],
        yearMin: 750,
        yearMax: 1258,
        prompt: "Three people are searching through the ruins with tools and a rope. They're looking for something specific. One explains when you approach, 'There used to be a cistern here - our grandfather mentioned it. The old water system. We're trying to find where it connects. The well in town is running low.' They've cleared debris from what looks like a stone channel.",
        choices: [
            {
                text: "Help them search for the old water system",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'You help them trace the channel to a sealed chamber - the old cistern, still holding water. They\'re grateful and share what they know about the site\'s original layout.', value: 'Ancient water system engineering and site structure' },
                    { chance: 0.3, result: 'item', message: 'While clearing rubble, you find a carved stone water spout. They let you keep it - they only need the working cistern.', value: 'CARVED_WATER_SPOUT' },
                    { chance: 0.3, result: 'injury', message: 'You descend into a promising opening to investigate. The footing is slippery with old water. You fall, twisting your knee badly.', value: 12 }
                ]
            },
            {
                text: "Ask about the site's history - they seem to know it well",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'They explain what their family has passed down - this was a caravanserai, a rest stop on old trade routes. The water system served dozens of travelers daily.', value: 'Site function as caravanserai and trade routes' },
                    { chance: 0.4, result: 'nothing', message: 'Their knowledge is purely practical - where the water is, how the channels ran. They know nothing about who built it or when.' },
                    { chance: 0.2, result: 'knowledge', message: 'While talking, they mention other ruins nearby with similar construction. Locals know them all, even if scholars don\'t.', value: 'Network of related sites known to locals' }
                ]
            },
            {
                text: "Leave them to their work and explore other parts of the ruins",
                outcomes: [
                    { chance: 0.4, result: 'item', message: 'While they\'re focused on the water system, you find a section they haven\'t disturbed. Among the rubble is a sealed clay jar with old coins inside.', value: 'SEALED_COIN_JAR' },
                    { chance: 0.4, result: 'nothing', message: 'The rest of the ruins are thoroughly picked over. Anything interesting has long since been removed by locals or fallen to complete ruin.' },
                    { chance: 0.2, result: 'knowledge', message: 'You find inscriptions on a wall section they didn\'t notice - decorative Arabic calligraphy with dates. Helps establish when the site was active.', value: 'Dated Arabic inscriptions' }
                ]
            }
        ]
    },
    {
        id: 'medieval_anchorite',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['EUROPEAN'],
        prompt: "A small stone cell is built against the ruin wall. Through the narrow window, you see an elderly person in religious habit, copying manuscripts. An anchorite - someone who chose permanent enclosure for religious contemplation. A basket by the window holds today's food delivery from the village. They look up from their work.",
        choices: [
            {
                text: "Ask about their manuscripts and the ruins",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'They\'ve lived here twelve years, copying texts. They describe how the ruins looked when they arrived, what\'s changed, what villagers have taken or added. Patient, detailed observations.', value: 'Anchorite documentation of site changes' },
                    { chance: 0.35, result: 'knowledge', message: 'They\'re copying local histories - stories villagers tell them through the window. Oral traditions written down. You read some entries. Valuable information mixed with legend.', value: 'Local oral histories transcribed' },
                    { chance: 0.20, result: 'item', message: 'They offer you a completed manuscript copy in exchange for materials - fresh ink, better parchment. They explain their copying helps support the village church.', value: 'MANUSCRIPT_COPY' }
                ]
            },
            {
                text: "Offer to help maintain their cell and bring supplies",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'Over weeks, you bring supplies and talk through the window. They explain the anchorite life - how enclosure provides time for scholarship. Their work preserving texts is deliberate, organized, important.', value: 'Anchoritic practice and manuscript preservation' },
                    { chance: 0.35, result: 'gold_loss', message: 'You provide expensive materials - parchment, ink, candles. They pray for you and continue their work. Your charity helps but costs you significantly.', value: 180 },
                    { chance: 0.25, result: 'knowledge', message: 'They teach you Latin phrases, explain the manuscript copying process. Professional instruction from someone who\'s dedicated their life to this work.', value: 'Manuscript production techniques' }
                ]
            },
            {
                text: "Respect their solitude and continue your search",
                outcomes: [
                    { chance: 0.50, result: 'nothing', message: 'You nod respectfully and move on. They return to their copying. Some choose this life deliberately. Not your business to disturb it.' },
                    { chance: 0.30, result: 'knowledge', message: 'As you work nearby over several days, you observe their routine. The discipline of religious enclosure, the practical reality of anchoritic life. Educational just to witness.', value: 'Observation of anchorite daily practice' },
                    { chance: 0.20, result: 'item', message: 'Later, you find a note weighted with a stone near your camp. They\'ve left you a blessed medallion and a brief blessing. Quiet kindness.', value: 'BLESSED_MEDALLION' }
                ]
            }
        ]
    },
    {
        id: 'medieval_burial',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['EUROPEAN'],
        prompt: "A grave marker leans against the ruin wall. Weathered stone with a simple cross and name. Fresh wildflowers in a clay jar suggest someone still visits. The ground shows signs of recent maintenance - grass trimmed, weeds pulled. You hear footsteps approaching.",
        choices: [
            {
                text: "Wait to speak with whoever tends this grave",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'An elderly woman arrives. Her grandfather is buried here. She tells you about his life, how he worked these lands, stories passed down. Three generations of local history.', value: 'Family burial traditions and local history' },
                    { chance: 0.30, result: 'knowledge', message: 'A priest approaches. He explains the grave is part of the ruin\'s history - families have buried here for centuries. Church records document everyone. Useful genealogical information.', value: 'Church burial records' },
                    { chance: 0.25, result: 'nothing', message: 'A young child places new flowers and runs off. You respect the privacy. The grave is clearly important to someone living.' }
                ]
            },
            {
                text: "Document the inscription and surrounding graves",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'You map fifteen graves around the ruins, recording names and dates. Pattern emerges - families buried together, occupations noted. Social history in stone.', value: 'Cemetery mapping and genealogy' },
                    { chance: 0.35, result: 'knowledge', message: 'The inscriptions show plague years, famine years, good years. Mortality patterns teach you about local historical events. Death records are historical data.', value: 'Mortality patterns and historical events' },
                    { chance: 0.25, result: 'item', message: 'While documenting graves, you find fragments of memorial pottery - deliberate placement by mourners. You collect shards respectfully for study.', value: 'MEMORIAL_POTTERY' }
                ]
            },
            {
                text: "Leave the grave undisturbed and search elsewhere",
                outcomes: [
                    { chance: 0.50, result: 'nothing', message: 'You work in other areas, giving the graves space. Respectful, but you learn nothing from them.' },
                    { chance: 0.30, result: 'knowledge', message: 'Locals notice your respect for the graves. An elder approaches later and shares information about the ruins - trust earned through consideration.', value: 'Local cooperation through respect' },
                    { chance: 0.20, result: 'knowledge', message: 'Avoiding the burial area, you notice the graves mark the original settlement boundary. They define the community\'s spatial organization. Useful archaeological data.', value: 'Burial patterns define settlement limits' }
                ]
            }
        ]
    },
    {
        id: 'medieval_flagellants',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['EUROPEAN'],
        yearMin: 1347,
        yearMax: 1353,
        prompt: "A group of villagers camps near the ruins, keeping distance from each other. Several have visible buboes. An older man stops you: 'Don't come closer. We left our village when the sickness started. The healthy towns won't let us in. We're waiting it out here.' Behind him, someone is digging. You count three fresh graves.",
        choices: [
            {
                text: "Leave food and water at a distance",
                outcomes: [
                    { chance: 0.5, result: 'knowledge', message: 'They survive for weeks on your supplies. Some recover. Before they leave, they share stories of how the sickness spreads - patterns you can document.', value: 'Plague transmission patterns' },
                    { chance: 0.3, result: 'death', message: 'Despite precautions, you contract plague. It kills quickly.' },
                    { chance: 0.2, result: 'knowledge', message: 'In thanks, they tell you about the ruins - their families worked this land for generations before the sickness came.', value: 'Generational knowledge of site' }
                ]
            },
            {
                text: "Your medical knowledge might help - approach carefully",
                outcomes: [
                    { chance: 0.3, result: 'knowledge', message: 'You can\'t cure them, but you ease their suffering. You document symptoms and progression carefully. Grim data, but valuable.', value: 'Plague symptom documentation' },
                    { chance: 0.4, result: 'death', message: 'You catch it despite precautions. Helping was the right thing. That thought comforts you as you die.' },
                    { chance: 0.3, result: 'nothing', message: 'They all die. You bury them, documenting names and dates. At least someone will know they existed.' }
                ]
            },
            {
                text: "Report their location to the nearest town",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'The town sends a priest with medicines and supplies. A few survive. The priest shares his observations about the plague.', value: 'Clerical medical knowledge' },
                    { chance: 0.4, result: 'nothing', message: 'The town sends armed men to drive them away from the area. The refugees scatter. You don\'t know what happens to them.' },
                    { chance: 0.2, result: 'nothing', message: 'The town doesn\'t respond. Too many of their own are dying. Resources are gone. Everyone fends for themselves now.' }
                ]
            }
        ]
    },
    {
        id: 'medieval_witch_trial',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['EUROPEAN'],
        prompt: "A woman is bound while villagers argue. 'She poisoned my well!' a farmer shouts. 'His pigs root through my garden and he does nothing!' she yells back. The priest looks exhausted. 'I've been mediating this for three months,' he tells you quietly. 'Now he's claiming she used devil's magic to sicken his livestock. His pigs look fine to me, but if I don't let them hold a trial, they'll handle it themselves.'",
        choices: [
            {
                text: "Examine the pigs and the well yourself",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'You identify natural causes - his pigs have mange, her well has sulfur. You explain both. They grumble but accept it. The priest is grateful.', value: 'Practical diagnosis prevented conflict' },
                    { chance: 0.35, result: 'nothing', message: 'Both sides reject your findings. "You don\'t know our land," the farmer says. They proceed with their own settlement.' },
                    { chance: 0.25, result: 'gold_loss', message: 'The farmer threatens you for interfering. You pay him to calm down. The woman still faces trial.', value: 120 }
                ]
            },
            {
                text: "Offer to buy the disputed land and end the conflict",
                outcomes: [
                    { chance: 0.45, result: 'gold_loss', message: 'They both accept. The conflict ends. It cost you, but it stopped a witch trial based on a property dispute.', value: 300 },
                    { chance: 0.30, result: 'gold_loss', message: 'They both demand higher prices than it\'s worth. The argument continues. Now you\'re involved too.', value: 150 },
                    { chance: 0.25, result: 'knowledge', message: 'Your offer makes them reconsider. They realize it\'s about land, not witchcraft. They agree to binding arbitration instead.', value: 'Mediated resolution' }
                ]
            },
            {
                text: "This is a local matter - keep searching the ruins",
                outcomes: [
                    { chance: 0.6, result: 'nothing', message: 'You hear later they settled it themselves. She had to leave the village but was spared trial.' },
                    { chance: 0.3, result: 'nothing', message: 'They eventually sort it out. Both continue living in the village. The priest negotiated a compromise.' },
                    { chance: 0.1, result: 'knowledge', message: 'That night you find her hiding in the ruins. She pays you to not reveal her location. She knows the ruin\'s history - her family has lived here for generations.', value: 'Local knowledge from refugee' }
                ]
            }
        ]
    },
    {
        id: 'medieval_veteran',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['EUROPEAN', 'MENA'],
        prompt: "An old man camps near the ruins. His tent contains military gear - old, well-maintained, from foreign wars. He's organized his camp with military precision. 'Twenty years I was gone,' he tells you. 'Came back and my family's land was taken. My wife remarried, thought I was dead. Can't blame her.' He pokes the fire. 'I keep my things here. Can't sell them. Can't throw them away. They're all I have from those years.'",
        choices: [
            {
                text: "Offer to help him find work using his military skills",
                outcomes: [
                    { chance: 0.35, result: 'knowledge', message: 'A local lord needs guards. The veteran is hired. He teaches you siege engineering and military logistics he learned in the east.', value: 'Crusader military knowledge' },
                    { chance: 0.30, result: 'nothing', message: 'He tries, but nobles prefer younger men they can train themselves. "They don\'t trust us," he says. "We saw too much." He returns to the ruins.' },
                    { chance: 0.20, result: 'gold_gain', message: 'A merchant caravan hires him as protection. Before leaving, he gives you some of his gear he won\'t need anymore. Quality stuff.', value: 180 },
                    { chance: 0.15, result: 'gold_loss', message: 'You vouch for him with a local garrison. He gets drunk on duty, starts a fight. They hold you responsible for recommending him.', value: 150 }
                ]
            },
            {
                text: "Listen to his experiences from the crusades",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'He describes the eastern cities, trade routes, fortifications, daily life. Not heroic stories - practical observations about how people actually lived and fought.', value: 'Crusader state realities' },
                    { chance: 0.30, result: 'knowledge', message: 'He talks about diseases, supply problems, internal conflicts between crusader groups. The logistics no one celebrates. Useful, unglamorous detail.', value: 'Military logistics and conflict' },
                    { chance: 0.25, result: 'item', message: 'He shows you a Damascus blade. "Keep it. I\'m too old to use it properly." You can tell parting with it costs him something.', value: 'DAMASCUS_BLADE' }
                ]
            },
            {
                text: "Suggest he seek help from the Church",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'The local monastery takes him in. They have several crusade veterans. The prior tells you they struggle with reintegration - the Church tries to help but resources are limited.', value: 'Institutional veteran support' },
                    { chance: 0.35, result: 'nothing', message: 'He refuses. "The Church sent us. I did what they asked. Saw things, did things... now they tell me to pray it away." He stays in the ruins.' },
                    { chance: 0.25, result: 'knowledge', message: 'The priest visits him at the ruins instead, brings food and blankets. "Many can\'t come back to normal life," he explains. "We do what we can out here."', value: 'Practical pastoral care' }
                ]
            }
        ]
    },

    // INDUSTRIAL ERA EVENTS
    {
        id: 'industrial_surveyor',
        era: HistoricalEra.INDUSTRIAL_ERA,
        prompt: "You encounter a well-dressed surveyor with theodolite and measuring chains. He claims to be mapping the area for a new railway line that will pass near the ruins.",
        choices: [
            {
                text: "Offer to share your archaeological findings",
                outcomes: [
                    { chance: 0.4, result: 'gold_gain', message: 'He\'s actually a treasure hunter! Impressed by your knowledge, he pays you for information.', value: 100 },
                    { chance: 0.3, result: 'knowledge', message: 'He shares railway company maps showing other ruins in the region.', value: 'Regional survey data' },
                    { chance: 0.3, result: 'nothing', message: 'He takes notes but offers nothing in return, mumbling about company profits.' }
                ]
            },
            {
                text: "Warn him that excavation will damage the site",
                outcomes: [
                    { chance: 0.5, result: 'knowledge', message: 'He laughs but admits the company already knows. They plan to sell artifacts.', value: 'Corporate malfeasance' },
                    { chance: 0.3, result: 'gold_loss', message: 'He becomes hostile and reports you to authorities as a trespasser. You\'re fined.', value: 75 },
                    { chance: 0.2, result: 'item', message: 'Sympathetic, he slips you a company document showing artifact locations.', value: 'SURVEY_MAP' }
                ]
            },
            {
                text: "Steal his equipment while he\'s distracted",
                outcomes: [
                    { chance: 0.3, result: 'gold_gain', message: 'You pawn the theodolite in town for good money.', value: 120 },
                    { chance: 0.4, result: 'death', message: 'His assistant sees you and shoots. Company security doesn\'t ask questions.' },
                    { chance: 0.3, result: 'item', message: 'You grab his notebook, which contains valuable excavation notes.', value: 'FIELD_NOTES' }
                ]
            }
        ]
    },
    {
        id: 'industrial_factory_workers',
        era: HistoricalEra.INDUSTRIAL_ERA,
        prompt: "A group of factory workers on strike have taken shelter near the ruins. They're hungry, desperate, and eyeing your supplies. Their leader, a coal-stained man, approaches with hands raised.",
        choices: [
            {
                text: "Share your food and offer sympathy",
                outcomes: [
                    { chance: 0.5, result: 'knowledge', message: 'Grateful, they tell you about a hidden cellar they found while exploring. They were too afraid to enter.', value: 'Cellar entrance location' },
                    { chance: 0.3, result: 'gold_loss', message: 'They take your food, then demand money too. Outnumbered, you comply.', value: 85 },
                    { chance: 0.2, result: 'item', message: 'One worker gives you his grandfather\'s old tools found in the ruins - including a valuable antique pickaxe.', value: 'ANTIQUE_PICKAXE' }
                ]
            },
            {
                text: "Hire them to help excavate",
                outcomes: [
                    { chance: 0.4, result: 'gold_loss', message: 'They work hard but demand payment upfront. The excavation yields little.', value: 100 },
                    { chance: 0.4, result: 'item', message: 'Their industrial strength uncovers a sealed chamber! You find intact artifacts.', value: 'INDUSTRIAL_LAMP' },
                    { chance: 0.2, result: 'injury', message: 'Untrained in archaeology, they collapse a wall. You\'re struck by falling masonry.', value: 18 }
                ]
            },
            {
                text: "Report them to the authorities",
                outcomes: [
                    { chance: 0.3, result: 'gold_gain', message: 'Police reward you for information on the strikers. You feel guilty.', value: 90 },
                    { chance: 0.5, result: 'death', message: 'They see you heading toward town. Desperate men do desperate things. They can\'t let you report them.' },
                    { chance: 0.2, result: 'nothing', message: 'Police don\'t care about strikers. They laugh at you for wasting their time.' }
                ]
            }
        ]
    },
    {
        id: 'industrial_photographer',
        era: HistoricalEra.INDUSTRIAL_ERA,
        prompt: "A photographer with a large plate camera is setting up to photograph the ruins. She introduces herself as working for an archaeological journal and offers to pay for a tour.",
        choices: [
            {
                text: "Give her a comprehensive guided tour",
                outcomes: [
                    { chance: 0.6, result: 'gold_gain', message: 'She pays generously and promises to credit you in the publication.', value: 150 },
                    { chance: 0.3, result: 'knowledge', message: 'She shares professional archaeological techniques she learned from university researchers.', value: 'Photographic documentation methods' },
                    { chance: 0.1, result: 'injury', message: 'While posing for a photo, scaffolding collapses beneath you.', value: 12 }
                ]
            },
            {
                text: "Demand to see her credentials first",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'She\'s legitimate! Her journal contains articles about recent Egyptian discoveries.', value: 'Modern archaeological methods' },
                    { chance: 0.3, result: 'nothing', message: 'Offended by your suspicion, she packs up and leaves without another word.' },
                    { chance: 0.3, result: 'gold_gain', message: 'She\'s a fraud but offers to split profits from selling photos to newspapers.', value: 110 }
                ]
            },
            {
                text: "Steal her camera equipment",
                outcomes: [
                    { chance: 0.4, result: 'gold_gain', message: 'The camera and plates sell for excellent money at a pawn shop.', value: 200 },
                    { chance: 0.4, result: 'gold_loss', message: 'She\'s connected to wealthy patrons. Police track you down easily. Heavy fine.', value: 250 },
                    { chance: 0.2, result: 'item', message: 'Among her plates, you find images of other unexplored ruins with location notes.', value: 'PHOTOGRAPHIC_PLATES' }
                ]
            }
        ]
    },
    {
        id: 'industrial_dynamite',
        era: HistoricalEra.INDUSTRIAL_ERA,
        prompt: "You discover a crate of old dynamite, likely left by quarry workers decades ago. The sticks are sweating nitroglycerin - highly unstable. A locked iron door blocks a promising passage.",
        choices: [
            {
                text: "Carefully use one stick to blast the door",
                outcomes: [
                    { chance: 0.3, result: 'item', message: 'Perfect! The door opens to reveal a sealed treasury with valuable artifacts.', value: 'SILVER_CHALICE' },
                    { chance: 0.4, result: 'death', message: 'The unstable explosive detonates prematurely. The blast brings down the entire section.' },
                    { chance: 0.3, result: 'injury', message: 'The explosion works but flying debris strikes you. Your ears ring for days.', value: 20 }
                ]
            },
            {
                text: "Report the dangerous explosives to authorities",
                outcomes: [
                    { chance: 0.5, result: 'knowledge', message: 'Authorities secure the area. They grant you exclusive excavation rights as thanks.', value: 'Official excavation permit' },
                    { chance: 0.3, result: 'nothing', message: 'The ruins are cordoned off for weeks. Your research is delayed significantly.' },
                    { chance: 0.2, result: 'gold_loss', message: 'You\'re blamed for trespassing on dangerous industrial land. Fined heavily.', value: 120 }
                ]
            },
            {
                text: "Leave it alone and find another way in",
                outcomes: [
                    { chance: 0.6, result: 'nothing', message: 'You search for hours but find no alternative entrance to that section.' },
                    { chance: 0.3, result: 'item', message: 'While searching, you discover a narrow chimney shaft that leads inside!', value: 'CLIMBING_ROPE' },
                    { chance: 0.1, result: 'death', message: 'Days later, summer heat detonates the dynamite while you\'re nearby. The ruins collapse.' }
                ]
            }
        ]
    },
    {
        id: 'industrial_child_laborers',
        era: HistoricalEra.INDUSTRIAL_ERA,
        culturalZones: ['EUROPEAN', 'NORTH_AMERICAN_COLONIAL'],
        prompt: "A family works the ruins - father, mother, three children. They're organized: the small ones fit into gaps, passing finds to their parents who sort and document. 'We've been coming here on Sundays for two years,' the father tells you. 'The children like it better than church.' Their collection is extensive but poorly catalogued. One of the girls shows you a coin she found. 'We're saving to buy uncle's farm,' she says.",
        choices: [
            {
                text: "Offer to help them document properly in exchange for sharing discoveries",
                outcomes: [
                    { chance: 0.5, result: 'knowledge', message: 'They agree. You spend Sundays together. Their local knowledge combined with your methods yields excellent results.', value: 'Collaborative excavation data' },
                    { chance: 0.3, result: 'nothing', message: 'They\'re suspicious. "You want to take credit for our work?" The father is polite but firm. They continue on their own.' },
                    { chance: 0.2, result: 'item', message: 'The daughter shows you their best find - they\'ve been saving it. A nearly complete mosaic piece.', value: 'MOSAIC_FRAGMENT' }
                ]
            },
            {
                text: "Explain these artifacts belong in a museum",
                outcomes: [
                    { chance: 0.4, result: 'nothing', message: 'The father listens politely. "Museums don\'t pay mortgages." They continue their work.' },
                    { chance: 0.35, result: 'knowledge', message: 'The mother argues back. She makes good points about who owns the past. You learn something.', value: 'Different perspective on ownership' },
                    { chance: 0.25, result: 'nothing', message: 'They pack up and leave. You notice they come back different days now, avoiding you.' }
                ]
            },
            {
                text: "Report them for unauthorized excavation",
                outcomes: [
                    { chance: 0.4, result: 'gold_loss', message: 'Authorities confiscate their collection. The family faces fines. You realize too late this was legal here. You pay their fine out of guilt.', value: 300 },
                    { chance: 0.35, result: 'nothing', message: 'Officials check. Everything is legal. The family has proper permission from the landowner. They look at you with contempt.' },
                    { chance: 0.25, result: 'nothing', message: 'The report goes nowhere. Understaffed office, low priority. The family continues their work, now wary of outsiders.' }
                ]
            }
        ]
    },
    {
        id: 'industrial_early_archaeologist',
        era: HistoricalEra.INDUSTRIAL_ERA,
        culturalZones: ['MENA', 'SUB_SAHARAN_AFRICAN', 'SOUTH_ASIAN', 'OCEANIA', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'SOUTH_AMERICAN'],
        prompt: "You encounter an archaeologist from the British Museum - complete with pith helmet and an entourage of local workers. He's using dynamite to 'excavate,' smashing through walls, discarding 'unimportant' pottery to reach 'valuable' pieces. His methods are destroying irreplaceable context. 'These artifacts belong in the British Museum,' he declares, 'where civilized people can appreciate them.' He's technically legal - backed by colonial authorities - but archaeologically criminal by modern standards.",
        choices: [
            {
                text: "Document his methods to expose destructive practices",
                outcomes: [
                    { chance: 0.35, result: 'knowledge', message: 'Your careful documentation becomes foundational evidence in developing modern archaeological ethics. Decades later, your reports are cited in establishing preservation standards. Context begins to matter more than treasures.', value: 'Archaeological methodology reform' },
                    { chance: 0.4, result: 'death', message: 'He has you arrested for "espionage" and "interfering with Crown expeditions." Colonial law is not kind to troublemakers. You die in a fever-ridden prison before your documentation reaches anyone who cares.' },
                    { chance: 0.25, result: 'item', message: 'While documenting, you secretly preserve items he discards as "worthless." Your collection of "common pottery" later proves to be key evidence for understanding daily life in the period.', value: 'POTTERY_COLLECTION' }
                ]
            },
            {
                text: "Join his expedition and try to influence better practices from within",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'Your subtle influence improves his methods slightly. He begins noting findspot locations and saving "mundane" items. It\'s not enough, but it\'s progress. Seeds of modern archaeology taking root.', value: 'Early stratigraphic methods' },
                    { chance: 0.35, result: 'gold_gain', message: 'He pays well. You watch in horror as priceless context is destroyed for museum showpieces. Your salary is built on archaeological destruction. The money feels tainted.', value: 400 },
                    { chance: 0.25, result: 'nothing', message: 'He ignores your suggestions entirely. "You colonials don\'t understand proper scientific methods," he sneers. You quit after watching him dynamite through an intact burial chamber to reach gold beneath.' }
                ]
            },
            {
                text: "Secretly work with local workers to preserve what he discards",
                outcomes: [
                    { chance: 0.35, result: 'item', message: 'The workers help you preserve "worthless" artifacts he throws aside. You create a hidden collection documenting the site properly. Future archaeologists will thank you.', value: 'COMPLETE_POTTERY_SET' },
                    { chance: 0.35, result: 'knowledge', message: 'Local workers share oral histories about the site - information the British archaeologist ignores as "native superstition." You record genuine historical knowledge he\'s too arrogant to hear.', value: 'Indigenous historical knowledge' },
                    { chance: 0.3, result: 'injury', message: 'His foreman catches you "stealing" discarded materials. He beats you and confiscates your notes. The workers are punished for helping you. You\'ve made things worse.', value: 20 }
                ]
            }
        ]
    },
    {
        id: 'industrial_workers_meeting',
        era: HistoricalEra.INDUSTRIAL_ERA,
        culturalZones: ['EUROPEAN', 'NORTH_AMERICAN_COLONIAL'],
        prompt: "Six factory workers sit in a circle near the ruins, speaking quietly. They look up when you approach. One explains: 'We meet here after shifts. Can't talk at the factory - foreman reports conversations to management. We're discussing a work stoppage. Twelve-hour days, six days a week. Three workers died last month - machinery accidents. No compensation for families.' Another adds: 'If we stop work together, they have to listen. But if we fail, they'll fire everyone and blacklist us. Our families will starve.'",
        choices: [
            {
                text: "Offer to help coordinate communication between shifts",
                outcomes: [
                    { chance: 0.35, result: 'knowledge', message: 'You help pass messages between day and night shifts. The coordination works. After two weeks, management agrees to ten-hour days and safety inspections. Small victory, but real.', value: 'Industrial labor negotiation tactics' },
                    { chance: 0.40, result: 'gold_loss', message: 'Management discovers your role. They bribe local police to arrest you for "criminal conspiracy." Bail and legal fees cost you significantly. The workers\' action continues without you.', value: 320 },
                    { chance: 0.25, result: 'injury', message: 'Company guards catch you carrying messages. They make an example - broken ribs, warning to stay out of labor business. The stoppage happens anyway, without coordination. Results are mixed.', value: 18 }
                ]
            },
            {
                text: "Warn them about the risks and suggest alternatives",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'You discuss petition strategies, appeals to factory inspection boards, legal approaches. They listen but ultimately proceed with the stoppage - legal channels have failed them for years. You document what happens: practical education in labor economics.', value: 'Legal versus direct action in labor disputes' },
                    { chance: 0.35, result: 'nothing', message: 'They thank you for concerns but explain you don\'t understand their situation. You don\'t work twelve-hour shifts. Your children aren\'t hungry. They proceed with their plan. You learn nothing.' },
                    { chance: 0.25, result: 'knowledge', message: 'One older worker explains previous attempts - petitions ignored, delegation fired, company promises broken. "We tried your way," he says. "Now we try ours." Historical lesson in why workers organize.', value: 'History of failed legal labor remedies' }
                ]
            },
            {
                text: "Stay neutral and document what you observe",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'You watch the process - how they debate, vote, coordinate, handle disagreements. Democratic organization developing in real time. Your notes become valuable historical documentation of grassroots labor organizing.', value: 'Labor organizing process documentation' },
                    { chance: 0.35, result: 'knowledge', message: 'They allow you to observe because you\'re not factory management. You document wages, hours, conditions, injury rates. Your neutral record later proves useful when government investigates factory practices.', value: 'Factory conditions statistical evidence' },
                    { chance: 0.25, result: 'nothing', message: 'Your presence makes them uncomfortable. Outside observer with notebook. They disperse. One tells you: "Easy to watch and write when your family isn\'t at risk." Fair criticism.' }
                ]
            }
        ]
    },

    // MODERN ERA EVENTS
    {
        id: 'modern_tourists',
        era: HistoricalEra.MODERN_ERA,
        prompt: "A group of tourists with cameras approaches the ruins. One accidentally drops their expensive camera bag while climbing over rocks.",
        choices: [
            {
                text: "Return the bag and help them",
                outcomes: [
                    { chance: 0.6, result: 'gold_gain', message: 'They\'re grateful and reward you with cash.', value: 150 },
                    { chance: 0.3, result: 'knowledge', message: 'One is an archaeologist who shares recent discoveries about the site.', value: 'Modern research findings' },
                    { chance: 0.1, result: 'nothing', message: 'They snatch it rudely and leave without thanking you.' }
                ]
            },
            {
                text: "Keep the camera equipment for yourself",
                outcomes: [
                    { chance: 0.5, result: 'gold_gain', message: 'You sell the expensive camera for a good price.', value: 300 },
                    { chance: 0.3, result: 'gold_loss', message: 'They call the police. You\'re caught and fined heavily.', value: 500 },
                    { chance: 0.2, result: 'item', message: 'The camera\'s memory card contains photos of unexplored areas.', value: 'MEMORY_CARD' }
                ]
            },
            {
                text: "Ignore them and continue exploring",
                outcomes: [
                    { chance: 0.6, result: 'nothing', message: 'They retrieve their bag and leave. You continue your work.' },
                    { chance: 0.3, result: 'item', message: 'While they\'re distracted, you find an interesting artifact they overlooked.', value: 'POTTERY_SHARD' },
                    { chance: 0.1, result: 'injury', message: 'In your haste to avoid them, you slip and twist your ankle.', value: 5 }
                ]
            }
        ]
    },
    {
        id: 'modern_drone',
        era: HistoricalEra.MODERN_ERA,
        prompt: "A loud buzzing fills the air. A high-tech drone hovers overhead, clearly filming the ruins with 4K cameras. Its operator, a young tech enthusiast, waves from a nearby hill.",
        choices: [
            {
                text: "Ask to see the drone footage - might reveal hidden features",
                outcomes: [
                    { chance: 0.5, result: 'knowledge', message: 'The aerial view reveals foundation outlines you couldn\'t see from ground level!', value: 'LiDAR survey data' },
                    { chance: 0.3, result: 'item', message: 'They offer to share the footage. You spot an unusual depression that leads to a collapsed tunnel entrance.', value: 'GPS_COORDINATES' },
                    { chance: 0.2, result: 'nothing', message: 'They refuse, claiming the footage is for their YouTube channel. Monetization concerns.' }
                ]
            },
            {
                text: "Warn them they're violating airspace regulations",
                outcomes: [
                    { chance: 0.4, result: 'gold_gain', message: 'Panicked, they offer you money to not report them to the authorities.', value: 180 },
                    { chance: 0.4, result: 'nothing', message: 'They argue they have proper permits and ignore you completely.' },
                    { chance: 0.2, result: 'injury', message: 'Distracted by arguing, you don\'t notice the drone\'s descent. It clips you painfully.', value: 8 }
                ]
            },
            {
                text: "Shoot it down with a rock - they're invading your workspace",
                outcomes: [
                    { chance: 0.3, result: 'gold_loss', message: 'You hit it! But the $3000 drone crashes. The owner threatens legal action. You settle out of court.', value: 600 },
                    { chance: 0.4, result: 'item', message: 'Lucky shot! The drone crashes, and you retrieve its memory card before they arrive.', value: 'DRONE_FOOTAGE' },
                    { chance: 0.3, result: 'death', message: 'Your rock misses. The enraged operator reports you for destruction of property. While fleeing, you fall into an unmarked excavation pit, breaking your neck.' }
                ]
            }
        ]
    },
    {
        id: 'modern_photographer',
        era: HistoricalEra.MODERN_ERA,
        prompt: "A photographer with professional equipment is documenting the ruins. She's on assignment for a travel magazine. 'They want dramatic shots,' she explains, adjusting her camera. 'Sunset lighting, mysterious angles, maybe some fog filters. Makes good copy.' You notice she's repositioning loose stones to frame shots better. Her assistant holds a reflector to create dramatic shadows. 'The editor wants it to look more... intact than it actually is. Can we just... not mention the modern graffiti in the shots?'",
        choices: [
            {
                text: "Explain the importance of accurate documentation",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'She listens and shifts approach. Her published article shows the ruins as they are - damaged, graffitied, real. The magazine runs it with honest context about preservation challenges. More valuable than pretty lies.', value: 'Ethical visual documentation practices' },
                    { chance: 0.35, result: 'nothing', message: 'She\'s polite but firm: "I shoot what the magazine pays for. If you want documentary realism, talk to National Geographic." She continues staging shots. You have no authority to stop commercial photography.' },
                    { chance: 0.25, result: 'knowledge', message: 'She agrees to shoot both versions - staged and realistic. She explains the economics of magazine photography. Educational conversation about representation versus reality in popular media.', value: 'Commercial photography economics' }
                ]
            },
            {
                text: "Offer to guide her to the most photogenic authentic angles",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'You show her perspectives that are both dramatic and honest. She\'s grateful - better shots without artifice. The magazine credits you as historical consultant. Your input shapes how thousands see the site.', value: 'Public history through visual media' },
                    { chance: 0.30, result: 'gold_gain', message: 'The magazine pays you for location scouting and historical context. Your brief paragraphs accompany her photos. Small fee but your name in print.', value: 200 },
                    { chance: 0.25, result: 'item', message: 'While guiding the shoot, you notice details you\'d missed before - foundation lines visible only in certain light. Her professional eye for composition teaches you to see the site differently.', value: 'PHOTOGRAPHIC_NOTES' }
                ]
            },
            {
                text: "Ask to see her photos before publication",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'She shares her whole portfolio - how she frames shots, chooses angles, uses light. You learn how visual media constructs historical narratives. Sometimes pretty pictures harm accurate understanding.', value: 'Visual media literacy and historical representation' },
                    { chance: 0.35, result: 'nothing', message: '"The magazine owns the images. I can\'t share unpublished work." Professional boundaries. You respect that. The article runs three months later - heavily stylized, barely recognizable.' },
                    { chance: 0.25, result: 'knowledge', message: 'She shows you before/after editing. The software "repairs" damaged walls, removes trash, enhances colors. "Everyone does it," she explains. You\'re troubled by the gap between reality and published history.', value: 'Digital manipulation of historical sites' }
                ]
            }
        ]
    },
    {
        id: 'modern_developer',
        era: HistoricalEra.MODERN_ERA,
        prompt: "A corporate developer in an expensive suit arrives with a briefcase. 'I represent Apex Realty Holdings,' he announces. 'We're prepared to offer significant compensation for your cooperation in our luxury resort development here.'",
        choices: [
            {
                text: "Accept the bribe and sign the papers",
                outcomes: [
                    { chance: 0.4, result: 'gold_gain', message: 'They pay handsomely. Within months, bulldozers destroy the ruins forever.', value: 800 },
                    { chance: 0.4, result: 'gold_loss', message: 'It\'s a scam! The company doesn\'t exist. The \'contracts\' authorize them to loot artifacts. Police can\'t help - they\'re gone.', value: 200 },
                    { chance: 0.2, result: 'death', message: 'You sign. Later, a genuine preservation group investigates. They find you\'ve aided destruction of protected heritage. You face charges, flee, and are killed in an accident while hiding.' }
                ]
            },
            {
                text: "Refuse and threaten to contact heritage protection",
                outcomes: [
                    { chance: 0.5, result: 'knowledge', message: 'Your whistleblowing triggers an investigation. The site receives protected status!', value: 'Legal protection for ruins' },
                    { chance: 0.3, result: 'gold_gain', message: 'A preservation fund rewards you for protecting cultural heritage.', value: 500 },
                    { chance: 0.2, result: 'injury', message: 'That night, corporate \'security\' delivers a warning. They break your fingers.', value: 22 }
                ]
            },
            {
                text: "Pretend to cooperate while documenting everything",
                outcomes: [
                    { chance: 0.5, result: 'knowledge', message: 'Your evidence exposes their illegal operations. The case becomes a landmark heritage law precedent.', value: 'Legal documentation of corruption' },
                    { chance: 0.3, result: 'item', message: 'They leave behind internal memos revealing other endangered sites you can help protect.', value: 'CORPORATE_FILES' },
                    { chance: 0.2, result: 'death', message: 'They discover your recordings. Corporate criminals don\'t leave witnesses.' }
                ]
            }
        ]
    },
    {
        id: 'modern_rival',
        era: HistoricalEra.MODERN_ERA,
        prompt: "You discover a competing archaeological team has set up camp near the ruins. Their leader, Dr. Chen, approaches coldly: 'We have university funding and proper permits. You're interfering with legitimate research.'",
        choices: [
            {
                text: "Propose collaboration and data sharing",
                outcomes: [
                    { chance: 0.6, result: 'knowledge', message: 'They agree! Combined resources lead to a major discovery. You co-author the publication.', value: 'Academic collaboration network' },
                    { chance: 0.3, result: 'item', message: 'They share ground-penetrating radar data showing unmapped chambers.', value: 'RADAR_SCANS' },
                    { chance: 0.1, result: 'nothing', message: 'They take your findings and publish first, giving you no credit.' }
                ]
            },
            {
                text: "Race them - work through the night to excavate first",
                outcomes: [
                    { chance: 0.3, result: 'item', message: 'You uncover a significant artifact before they arrive! Your find makes headlines.', value: 'CEREMONIAL_MASK' },
                    { chance: 0.4, result: 'injury', message: 'Rushing in darkness, you trigger a collapse. Rescued by rival team, who now have moral high ground.', value: 19 },
                    { chance: 0.3, result: 'gold_loss', message: 'Your reckless excavation damages the site. Authorities fine you and revoke access.', value: 450 }
                ]
            },
            {
                text: "Sabotage their equipment overnight",
                outcomes: [
                    { chance: 0.3, result: 'gold_gain', message: 'Their delay allows you to complete excavation and sell artifacts to a private collector first.', value: 700 },
                    { chance: 0.5, result: 'gold_loss', message: 'Security cameras catch you. Academic misconduct hearing. You\'re blacklisted from archaeology.', value: 1000 },
                    { chance: 0.2, result: 'death', message: 'While sabotaging their ground-penetrating radar, you accidentally trigger it at full power. The electromagnetic burst stops your heart.' }
                ]
            }
        ]
    },
    {
        id: 'modern_indigenous_activists',
        era: HistoricalEra.MODERN_ERA,
        prompt: "An older woman sits on a stone, eating lunch from a plastic container. She looks up as you approach. 'My grandmother used to bring me here,' she says. 'Before the fence. Before the signs.' She gestures at the ruins. 'She'd point to different stones and tell me who lived there. Names. Not the ones in your books.' She returns to her lunch. You notice she's placed small flowers on one particular foundation stone.",
        choices: [
            {
                text: "Ask if she'd be willing to share what she knows",
                outcomes: [
                    { chance: 0.5, result: 'knowledge', message: 'She tells you about three generations of oral history. Some names, some stories. You ask if you can record it. She thinks about it, then agrees.', value: 'Oral historical knowledge' },
                    { chance: 0.3, result: 'nothing', message: 'She finishes her lunch. "No offense, but we don\'t know each other." She leaves. You respect that.' },
                    { chance: 0.2, result: 'knowledge', message: 'Her nephew arrives to drive her home. He mentions their family is in legal proceedings about the site. He gives you his card.', value: 'Legal context and contacts' }
                ]
            },
            {
                text: "Apologize and leave her alone",
                outcomes: [
                    { chance: 0.6, result: 'nothing', message: 'You give her space. She finishes her lunch and leaves quietly.' },
                    { chance: 0.3, result: 'knowledge', message: 'As you work elsewhere, she calls you over. "That stone there. My grandmother said it was a doorway." She points out two others. A pattern you hadn\'t seen.', value: 'Architectural insight' },
                    { chance: 0.1, result: 'item', message: 'Later you find a note weighted with a small stone: a name, and a date. The date matches your site\'s occupation period.', value: 'HISTORICAL_NOTE' }
                ]
            },
            {
                text: "Take notes on which stones she visits",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'You map her path carefully. The stones she touched form a pattern - possibly marking significant structures or family areas.', value: 'Sacred site mapping' },
                    { chance: 0.4, result: 'nothing', message: 'She notices you watching and documenting. She picks up her container and leaves without a word.' },
                    { chance: 0.2, result: 'knowledge', message: 'Later, comparing her visited sites with excavation data, you realize she identified the living quarters while archaeologists had assumed they were storage.', value: 'Functional architecture correction' }
                ]
            }
        ]
    },
    {
        id: 'modern_climate_threat',
        era: HistoricalEra.MODERN_ERA,
        prompt: "Last year's storm revealed a foundation you hadn't seen before. This year's storm took half of it into the sea. You can see fresh earth, exposed layers, pottery sherds washing out with each tide. The next storm is forecast for this weekend. You have one afternoon.",
        choices: [
            {
                text: "Document what's visible now - photos, measurements",
                outcomes: [
                    { chance: 0.5, result: 'knowledge', message: 'You work fast. Photos, measurements, sketches. You record valuable stratigraphic data before it washes away.', value: 'Emergency documentation' },
                    { chance: 0.3, result: 'item', message: 'While photographing the exposed section, you spot intact pottery in the cliff face. You carefully extract several pieces.', value: 'POTTERY_SHARDS' },
                    { chance: 0.2, result: 'injury', message: 'The tide comes in faster than expected. You slip on wet rocks trying to finish your measurements. Sprained ankle, ruined camera.', value: 12 }
                ]
            },
            {
                text: "Excavate the exposed section while you can",
                outcomes: [
                    { chance: 0.4, result: 'item', message: 'You work frantically against the tide. You save several artifacts that would have been lost. Context is rough, but they exist.', value: 'SALVAGED_ARTIFACTS' },
                    { chance: 0.4, result: 'knowledge', message: 'In your haste, you lose track of which layer things came from. You have objects but limited understanding of their relationships.', value: 'Decontextualized finds' },
                    { chance: 0.2, result: 'item', message: 'You uncover what looks like a burial. It needs immediate attention or the sea will take it.', value: 'BURIAL_REMAINS' }
                ]
            },
            {
                text: "Contact authorities and wait for proper team",
                outcomes: [
                    { chance: 0.5, result: 'nothing', message: 'The storm comes before they respond. When you return after, the entire exposure is gone. Only your initial photos remain.' },
                    { chance: 0.3, result: 'knowledge', message: 'A rapid response team arrives with proper equipment. They excavate systematically before the storm. Slower, but better data.', value: 'Professional excavation results' },
                    { chance: 0.2, result: 'nothing', message: 'They thank you for reporting it but explain this site isn\'t a priority. The storm takes it. They have limited resources.' }
                ]
            }
        ]
    },

    // RENAISSANCE/EARLY MODERN EVENTS
    {
        id: 'renaissance_pilgrims_camp',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['MENA', 'EUROPEAN'],
        yearMin: 1299,
        yearMax: 1683,
        prompt: "A group of pilgrims has stopped at the ruins to rest. They've spread prayer rugs and are preparing food. An older man in travel-worn clothing greets you. 'Heading to the shrine,' he explains. 'We stop here every year - good shelter, spring water nearby. These old walls have heard a lot of prayers over the years.' Several younger pilgrims are exploring the ruins while the food cooks.",
        choices: [
            {
                text: "Ask about the pilgrimage route and the shrine",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'They describe the pilgrimage network - which shrines are active, where travelers can find safe rest, seasonal patterns of movement. Practical regional knowledge.', value: 'Pilgrimage routes and safe stopping points' },
                    { chance: 0.3, result: 'item', message: 'They give you a pilgrim token from the shrine. "For luck," the old man says. "You can show it at way-stations for help."', value: 'PILGRIM_TOKEN' },
                    { chance: 0.3, result: 'nothing', message: 'Standard pilgrimage information - nothing you couldn\'t learn elsewhere. But the conversation is pleasant.' }
                ]
            },
            {
                text: "Share your own provisions and join their meal",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'Over food, they share stories about the journey. One mentions seeing soldiers on the roads - warnings about which routes to avoid. Valuable safety information.', value: 'Current regional conflicts and safe routes' },
                    { chance: 0.4, result: 'nothing', message: 'You share a meal with travelers. It\'s communal, brief, and unexceptional. They move on, you move on.' },
                    { chance: 0.2, result: 'gold_loss', message: 'You contribute food but they insist on compensating you from their collection box. You end up paying more than you meant to.', value: 30 }
                ]
            },
            {
                text: "Ask if they know anything about the ruins themselves",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'One older pilgrim remembers hearing this was a caravan station. "Empty fifty years now, maybe more. The trade route shifted after the war."', value: 'Recent site history and trade route changes' },
                    { chance: 0.4, result: 'nothing', message: 'They use the ruins for shelter, not history. "Old stones," one shrugs. "Useful walls, nothing more."' },
                    { chance: 0.2, result: 'item', message: 'A younger pilgrim found a carved stone earlier. He offers it to you. "We travel light. You keep it."', value: 'CARVED_STONE_FRAGMENT' }
                ]
            }
        ]
    },
    {
        id: 'renaissance_textile_work',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['SOUTH_ASIAN'],
        yearMin: 1526,
        yearMax: 1707,
        prompt: "Women are working with dyed cloth spread across the ruins, using the flat stones as work surfaces. They're block-printing patterns onto fabric, the carved blocks clicking rhythmically. One woman looks up as you approach. 'The stones here are smooth and level,' she explains. 'Better than our workshop floor. We come here for the large pieces.' Bright patterns dry in the sun.",
        choices: [
            {
                text: "Watch the printing process and ask questions",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'They explain the traditional patterns - each design has meaning, passed down through families. The blocks are generations old. Some patterns are regional markers.', value: 'Traditional textile patterns and meanings' },
                    { chance: 0.3, result: 'item', message: 'They have damaged cloth they can\'t sell. They offer it to you cheaply - the printing is perfect but there\'s a tear in one corner.', value: 'PRINTED_TEXTILE' },
                    { chance: 0.3, result: 'nothing', message: 'The work is trade knowledge, closely held. They\'re polite but don\'t share technical details with outsiders.' }
                ]
            },
            {
                text: "Examine the stones they're using as work surfaces",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'The smooth stones are actually carved architectural elements, turned face-down. You notice inscriptions on the edges they aren\'t using. Ancient writing.', value: 'Inscribed architectural elements repurposed' },
                    { chance: 0.4, result: 'nothing', message: 'The stones are useful because they\'re flat and large. Whatever history they hold doesn\'t matter for block-printing.' },
                    { chance: 0.2, result: 'injury', message: 'You try to flip a stone to see markings underneath. It\'s heavier than expected and catches your fingers. The women scold you for disturbing their workspace.', value: 7 }
                ]
            },
            {
                text: "Offer to help in exchange for learning the craft",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'They let you help with preparation work - mixing dyes, preparing cloth. You learn the basics of the process and which patterns sell best in which markets.', value: 'Textile craft basics and market preferences' },
                    { chance: 0.3, result: 'gold_loss', message: 'They accept help but expect payment for teaching their craft. You work an afternoon and pay for the lesson.', value: 40 },
                    { chance: 0.3, result: 'nothing', message: 'This is women\'s work, family knowledge. They don\'t need or want your help. Polite refusal.' }
                ]
            }
        ]
    },
    {
        id: 'renaissance_farmers_boundary',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
        yearMin: 1428,
        yearMax: 1521,
        prompt: "Two farmers are arguing at the edge of the ruins, pointing at different stones. An older woman sits nearby, apparently mediating. She calls out to you, 'You're a traveler? Good. Neutral voice. These two say the ruins mark the boundary between their family lands. Each claims different stones. Help us settle this before they come to blows.' The fields on either side look recently planted.",
        choices: [
            {
                text: "Listen to both sides and offer judgment",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'While hearing their arguments, you learn how land boundaries work here - which families settled when, how markers are maintained, traditional territories. Local land tenure knowledge.', value: 'Local land ownership and boundary traditions' },
                    { chance: 0.3, result: 'gold_gain', message: 'You help them reach compromise. Both families give you maize and beans as thanks for preventing a feud.', value: 55 },
                    { chance: 0.3, result: 'nothing', message: 'Your judgment pleases neither side. They continue arguing after you leave. Some disputes run too deep for outsider mediation.' }
                ]
            },
            {
                text: "Examine the stones they're pointing to",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'Some stones have faint carved marks - old boundary markers, generations old. You identify which are traditional boundaries versus random rubble.', value: 'Ancient boundary marker identification' },
                    { chance: 0.4, result: 'nothing', message: 'The stones look the same to you. Whatever marks existed are worn beyond recognition. You can\'t help resolve the dispute.' },
                    { chance: 0.2, result: 'injury', message: 'While examining a stone, one farmer pushes past you impatiently. You fall against sharp rubble, cutting your arm.', value: 9 }
                ]
            },
            {
                text: "Suggest they consult village elders instead",
                outcomes: [
                    { chance: 0.5, result: 'nothing', message: 'They agree this needs official mediation. They head to the village together, still arguing. You\'ve helped by removing yourself from the situation.' },
                    { chance: 0.3, result: 'knowledge', message: 'The older woman thanks you for suggesting proper channels. She explains how land disputes are traditionally resolved in the region.', value: 'Traditional dispute resolution mechanisms' },
                    { chance: 0.2, result: 'gold_loss', message: 'They insist you accompany them to the village to testify about the stones. You waste an entire day and end up paying for drinks at the council session.', value: 35 }
                ]
            }
        ]
    },
    {
        id: 'renaissance_llama_herders',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['SOUTH_AMERICAN'],
        yearMin: 1438,
        yearMax: 1533,
        prompt: "A small group of herders has brought their llamas to graze near the ruins. The animals pick through sparse vegetation while the herders rest in the shade of old walls. One man is repairing a rope while another sorts through wool. A young boy tends a small fire. They watch you approach but don't seem concerned. 'Passing through?' one asks. 'The stream is just beyond those stones if you need water.'",
        choices: [
            {
                text: "Ask about the area and the best routes forward",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'They describe the highland paths - which passes are open, where to find shelter, seasonal weather patterns. Practical mountain travel knowledge from people who live here.', value: 'Highland routes and seasonal patterns' },
                    { chance: 0.3, result: 'item', message: 'One herder gives you some dried meat for your journey. "The road ahead is long. You\'ll need provisions."', value: 'DRIED_MEAT' },
                    { chance: 0.3, result: 'nothing', message: 'They know the immediate area but not much beyond. Their routes are local, following the herd\'s needs.' }
                ]
            },
            {
                text: "Ask if you can trade for wool or rope",
                outcomes: [
                    { chance: 0.4, result: 'gold_loss', message: 'You trade for quality llama wool and some rope. Fair prices for goods you need. They seem satisfied with the transaction.', value: 50 },
                    { chance: 0.4, result: 'item', message: 'They don\'t need coin but will trade for useful tools. You exchange and get good wool in return.', value: 'LLAMA_WOOL' },
                    { chance: 0.2, result: 'nothing', message: 'This wool is already promised to buyers. They have nothing available for trade right now.' }
                ]
            },
            {
                text: "Ask about the ruins - do they know the history?",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'The older herder says this was a tambo - a way-station on the road network. "Empty now, but the stones are still useful for shelter. Our grandfathers remember when officials lived here."', value: 'Site function as tambo in road system' },
                    { chance: 0.4, result: 'nothing', message: 'They use the ruins for shelter, nothing more. "Old buildings," one shrugs. "Been empty as long as anyone remembers."' },
                    { chance: 0.2, result: 'knowledge', message: 'The boy mentions finding carved stones with designs. His father doesn\'t pay attention to such things, but the boy shows you a fragment he kept. Clear construction style.', value: 'Architectural fragment with diagnostic style' }
                ]
            }
        ]
    },
    {
        id: 'renaissance_scholar',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['EUROPEAN'],
        prompt: "You meet a scholar in Renaissance dress, sketching the ruins with charcoal. His parchments show detailed architectural drawings.",
        choices: [
            {
                text: "Ask to examine his drawings",
                outcomes: [
                    { chance: 0.5, result: 'knowledge', message: 'He shares insights about classical proportions and ancient building techniques.', value: 'Renaissance scholarship' },
                    { chance: 0.3, result: 'item', message: 'He gifts you a copy of his sketches in exchange for describing what you\'ve found.', value: 'ARCHITECTURAL_SKETCHES' },
                    { chance: 0.2, result: 'gold_loss', message: 'While you\'re distracted, his servant picks your pocket.', value: 60 }
                ]
            },
            {
                text: "Offer to guide him through the ruins",
                outcomes: [
                    { chance: 0.6, result: 'gold_gain', message: 'He pays you handsomely for your services as a guide.', value: 90 },
                    { chance: 0.3, result: 'knowledge', message: 'He teaches you to read Latin inscriptions as you explore together.', value: 'Latin literacy' },
                    { chance: 0.1, result: 'injury', message: 'While showing him a chamber, a wall collapses on you both. He escapes unharmed.', value: 14 }
                ]
            },
            {
                text: "Accuse him of treasure hunting",
                outcomes: [
                    { chance: 0.4, result: 'nothing', message: 'Offended, he departs in a huff. His servant gives you a contemptuous look.' },
                    { chance: 0.3, result: 'gold_gain', message: 'He admits it and offers to split any profits from artifacts found.', value: 80 },
                    { chance: 0.3, result: 'death', message: 'His guards see you as a threat to their employer. They draw swords.' }
                ]
            }
        ]
    },
    {
        id: 'renaissance_art_forger',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['EUROPEAN'],
        prompt: "A man makes rubbings of inscriptions on the ruins. His bag contains several completed copies and what looks like a blank stone ready for carving. He notices you watching. 'I sell these to collectors. They think they're buying pieces of the ruins. I tell them they are.' He shrugs. 'No one gets hurt. The ruins stay intact. Rich men get decorations for their libraries.'",
        choices: [
            {
                text: "Threaten to expose him",
                outcomes: [
                    { chance: 0.4, result: 'gold_gain', message: 'He pays you monthly to stay quiet. The arrangement continues for years.', value: 250 },
                    { chance: 0.35, result: 'death', message: 'He reports YOU as a forger to authorities first. His word against yours. He has connections.' },
                    { chance: 0.25, result: 'nothing', message: 'He laughs. "Who will believe you? I\'ve been doing this for a decade." He\'s right. He continues his work.' }
                ]
            },
            {
                text: "Demand a cut of his profits",
                outcomes: [
                    { chance: 0.45, result: 'gold_gain', message: 'He agrees. You profit from forgeries for years. The ruins remain intact, at least.', value: 400 },
                    { chance: 0.30, result: 'nothing', message: 'He vanishes and sets up elsewhere. You see his "artifacts" for sale in another city months later.' },
                    { chance: 0.25, result: 'gold_loss', message: 'His patron catches you both. Turned out the patron knew they were fakes all along. You pay fines for attempted fraud.', value: 300 }
                ]
            },
            {
                text: "Suggest he make clear copies labeled as reproductions",
                outcomes: [
                    { chance: 0.3, result: 'knowledge', message: 'He considers it. "There might be a market for honest copies." He tries it. It works. Others copy the model.', value: 'Honest reproduction trade model' },
                    { chance: 0.4, result: 'nothing', message: 'He laughs. "Honest copies? For half the price? You don\'t understand my business." He continues forging.' },
                    { chance: 0.3, result: 'gold_loss', message: 'He agrees, but reports you as his competition to keep you away from collectors. You face harassment.', value: 200 }
                ]
            }
        ]
    },
    {
        id: 'renaissance_religious_contraband',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['EUROPEAN'],
        prompt: "You find pamphlets hidden under a loose stone. Dense text, cheap paper, recent printing. Someone's footsteps approach quickly.",
        choices: [
            {
                text: "Cover them and act casual",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'A young woman retrieves them, nods thanks, leaves quickly. You say nothing. She says nothing.', value: 'Unspoken understanding' },
                    { chance: 0.35, result: 'death', message: 'A priest finds you standing at the cache. Guilt by location. The Inquisition doesn\'t need more evidence.' },
                    { chance: 0.25, result: 'nothing', message: 'Soldiers arrive searching. They find the pamphlets. You weren\'t involved - you\'re just here. They tell you to leave.' }
                ]
            },
            {
                text: "Take them to read later",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'You read them. Theological arguments, political grievances. Dangerous to possess. You burn them after reading.', value: 'Religious reform context' },
                    { chance: 0.35, result: 'death', message: 'Inquisition officers search you. Finding the pamphlets is enough. Your execution is public.' },
                    { chance: 0.25, result: 'item', message: 'Among the pamphlets, a letter reveals a meeting location. You could use this information.', value: 'ENCODED_LETTER' }
                ]
            },
            {
                text: "Leave immediately",
                outcomes: [
                    { chance: 0.7, result: 'nothing', message: 'You walk away. Not your business. You hear shouting from that direction an hour later.' },
                    { chance: 0.2, result: 'nothing', message: 'Whoever comes retrieves them safely. You never learn who or why.' },
                    { chance: 0.1, result: 'item', message: 'In your haste, you knock over a loose stone. Beneath: a coin purse, forgotten.', value: 'COIN_PURSE' }
                ]
            }
        ]
    },
    {
        id: 'renaissance_scientific_instruments',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['EUROPEAN'],
        prompt: "You find astronomical instruments hidden in a hollow column - brass, glass, carefully wrapped. No note, no name. They're valuable and clearly concealed recently. You hear footsteps approaching.",
        choices: [
            {
                text: "Hide and see who comes",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'A nervous scholar retrieves them. He nods to you without speaking, clearly relieved they\'re safe.', value: 'Silent complicity' },
                    { chance: 0.35, result: 'death', message: 'Soldiers searching for contraband arrive. They find you near the hidden instruments. Close enough for suspicion.' },
                    { chance: 0.25, result: 'nothing', message: 'You wait for three days. No one comes. Eventually you leave them and move on.' }
                ]
            },
            {
                text: "Take the instruments with you",
                outcomes: [
                    { chance: 0.35, result: 'gold_gain', message: 'You sell them to a collector. Good money. You never learn whose they were or why they were hidden.', value: 400 },
                    { chance: 0.40, result: 'death', message: 'You\'re caught with banned astronomical equipment. You can\'t explain where you got them without lying.' },
                    { chance: 0.25, result: 'item', message: 'The instruments contain observational notes tucked inside. Valuable scientific data.', value: 'OBSERVATION_NOTES' }
                ]
            },
            {
                text: "Leave them but mark the location",
                outcomes: [
                    { chance: 0.6, result: 'nothing', message: 'When you return weeks later, they\'re gone. Someone retrieved them safely.' },
                    { chance: 0.25, result: 'nothing', message: 'You return to find the column destroyed, instruments smashed. Church investigators found them first.' },
                    { chance: 0.15, result: 'knowledge', message: 'Months later, a scholar thanks you. He saw your mark and knew they were safe.', value: 'Grateful contact' }
                ]
            }
        ]
    },
    {
        id: 'medieval_veteran',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['EUROPEAN', 'MENA'],
        prompt: "An old man camps near the ruins. His tent contains military gear - old, well-maintained, from foreign wars. He's organized his camp with military precision. 'Twenty years I was gone,' he tells you. 'Came back and my family's land was taken. My wife remarried, thought I was dead. Can't blame her.' He pokes the fire. 'I keep my things here. Can't sell them. Can't throw them away. They're all I have from those years.'",
        choices: [
            {
                text: "Ask about his experiences",
                outcomes: [
                    { chance: 0.5, result: 'knowledge', message: 'He shares stories about places he saw - cities, trade routes, people. The war parts he skips.', value: 'Eastern Mediterranean geography' },
                    { chance: 0.3, result: 'nothing', message: 'He becomes withdrawn. "I don\'t talk about it." He turns away. You leave him alone.' },
                    { chance: 0.2, result: 'item', message: 'He shows you a medallion from Jerusalem. "Keep it. Means nothing to me now."', value: 'HOLY_MEDALLION' }
                ]
            },
            {
                text: "Offer to help him reclaim his land",
                outcomes: [
                    { chance: 0.3, result: 'nothing', message: 'He laughs bitterly. "The new lord has the king\'s favor. I have nothing." He waves you away.' },
                    { chance: 0.4, result: 'gold_loss', message: 'You spend months on legal petitions. They go nowhere. You\'ve wasted time and money on a lost cause.', value: 200 },
                    { chance: 0.3, result: 'knowledge', message: 'Through his case you learn about land law and military service obligations. The system is clearer to you now.', value: 'Feudal legal precedent' }
                ]
            },
            {
                text: "Leave him be",
                outcomes: [
                    { chance: 0.7, result: 'nothing', message: 'You nod respectfully and move on. Some men want solitude.' },
                    { chance: 0.2, result: 'item', message: 'Weeks later you return. He\'s gone. His old sword remains, stuck in the ground like a grave marker.', value: 'CRUSADER_SWORD' },
                    { chance: 0.1, result: 'knowledge', message: 'You see him in town months later. He\'s found work as a guard. He nods to you but doesn\'t speak.', value: 'Veteran integration challenges' }
                ]
            }
        ]
    },
    {
        id: 'modern_photographer',
        era: HistoricalEra.MODERN_ERA,
        prompt: "A photographer sets up a tripod at the ruins. Professional camera, multiple lenses, reflectors. She's been here since dawn. 'The light's only right for about fifteen minutes,' she explains. 'I've been coming back for three weeks trying to get this shot.' Her laptop shows dozens of attempts - slightly different angles, lighting, compositions. 'Magazine commission.' She sighs. 'This sucks, honestly.'",
        choices: [
            {
                text: "Offer to model in the shot for scale",
                outcomes: [
                    { chance: 0.4, result: 'gold_gain', message: 'She pays you a modest modeling fee. The photo runs in the magazine. You look tiny against the stones.', value: 150 },
                    { chance: 0.4, result: 'nothing', message: '"I need emptiness, not people. Thanks though." She continues waiting for her light.' },
                    { chance: 0.2, result: 'knowledge', message: 'She shows you how she frames shots to make the ruins look larger or more mysterious. It\'s all angles and timing.', value: 'Photographic composition techniques' }
                ]
            },
            {
                text: "Share what you know about the ruins' history",
                outcomes: [
                    { chance: 0.5, result: 'knowledge', message: 'She listens politely but keeps shooting. "The editor doesn\'t want history. They want atmosphere." You understand the disconnect.', value: 'Media vs academic priorities' },
                    { chance: 0.3, result: 'gold_gain', message: 'She gets interested, changes her approach. She credits you as historical consultant. The article is better for it.', value: 200 },
                    { chance: 0.2, result: 'nothing', message: 'She nods absently, focused on her viewfinder. You realize she\'s not really listening.' }
                ]
            },
            {
                text: "Ask if you can see her previous work",
                outcomes: [
                    { chance: 0.5, result: 'knowledge', message: 'She shows you her portfolio. Ruins from six countries. Each one made beautiful and slightly unreal.', value: 'Commercial archaeology photography trends' },
                    { chance: 0.3, result: 'nothing', message: '"I\'m working right now." She\'s polite but firm. You move on.' },
                    { chance: 0.2, result: 'item', message: 'She gives you one of her published magazines. Your ruins are on page 47, between an ad for watches and a resort review.', value: 'MAGAZINE_TEARSHEET' }
                ]
            }
        ]
    },
    {
        id: 'modern_land_survey',
        era: HistoricalEra.MODERN_ERA,
        prompt: "Surveyors measure the land around the ruins. GPS equipment, boundary markers, official vests. One of them notices you and walks over. 'New resort development. Eighteen holes, spa, conference center.' He gestures at the plans on his tablet - the ruins are marked as 'Historic Feature - Preserve.' 'We're designing around it. Might actually save the site, honestly. Right now it's just getting looted and weathering away.' He seems sincere.",
        choices: [
            {
                text: "Ask to see the development plans",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'The plans show a ten-meter exclusion zone around the ruins. Small, but better than nothing. They\'ve hired an archaeologist as consultant.', value: 'Development preservation standards' },
                    { chance: 0.3, result: 'nothing', message: 'He shows you glossy renderings. The ruins look like a theme park attraction. You say nothing.' },
                    { chance: 0.3, result: 'knowledge', message: 'You spot errors in their historical timeline. When you point them out, he genuinely takes notes. Maybe the plaques will be accurate.', value: 'Developer consultation opportunity' }
                ]
            },
            {
                text: "Argue the development will destroy the site's context",
                outcomes: [
                    { chance: 0.3, result: 'nothing', message: 'He listens politely. "We don\'t make those decisions. We just measure." True enough.' },
                    { chance: 0.4, result: 'knowledge', message: 'He connects you with the project archaeologist. She shares your concerns but is pragmatic: "Better controlled development than uncontrolled decay."', value: 'Archaeological mitigation politics' },
                    { chance: 0.3, result: 'nothing', message: 'He shrugs. "Someone will develop it eventually. At least we\'re keeping the ruins." Hard to argue.' }
                ]
            },
            {
                text: "Offer to work as historical consultant",
                outcomes: [
                    { chance: 0.35, result: 'gold_gain', message: 'They hire you to write informational plaques and review their marketing materials. It pays well. You make sure the history is accurate.', value: 300 },
                    { chance: 0.35, result: 'nothing', message: '"They\'ve already got someone. Thanks though." He returns to his measurements.' },
                    { chance: 0.3, result: 'knowledge', message: 'They bring you in for one consultation meeting. You see how these projects work from the inside. Compromise at every level.', value: 'Heritage development process' }
                ]
            }
        ]
    },
    {
        id: 'industrial_expedition',
        era: HistoricalEra.INDUSTRIAL_ERA,
        culturalZones: ['EUROPEAN'],
        prompt: "An expedition team unpacks crates - tents, surveying tools, photography equipment, notebooks. The leader is methodical, middle-aged, clearly exhausted from travel. 'We're cataloguing antiquities for the Imperial Museum,' he explains. His assistant is local, hired from town. 'He knows the area, speaks the language. I don't.' The assistant looks unimpressed by the ruins. 'People have been taking stones from here for building material for fifty years,' he says. 'Now you want to write them down?'",
        choices: [
            {
                text: "Offer to help with the survey work",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'You spend weeks helping measure, sketch, and catalogue. The work is tedious but thorough. You learn systematic documentation methods.', value: 'Archaeological survey methodology' },
                    { chance: 0.3, result: 'gold_gain', message: 'They pay you as an assistant surveyor. When published, the expedition report credits you by name.', value: 250 },
                    { chance: 0.3, result: 'nothing', message: 'After a week you realize they mostly need porters, not scholars. You politely excuse yourself.' }
                ]
            },
            {
                text: "Question the ethics of removing artifacts to foreign museums",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'The leader bristles but the assistant nods vigorously. "Finally someone says it." A complicated conversation follows. No easy answers.', value: 'Colonial archaeology debates' },
                    { chance: 0.3, result: 'nothing', message: 'The leader is defensive. "We preserve what would otherwise be destroyed." He\'s not entirely wrong, which makes it harder.' },
                    { chance: 0.3, result: 'item', message: 'The assistant quietly shows you a beautiful artifact he kept aside. "Not for them. For our town museum." He winks.', value: 'PRESERVED_POTTERY' }
                ]
            },
            {
                text: "Ask what they've found so far",
                outcomes: [
                    { chance: 0.5, result: 'knowledge', message: 'They show you their sketches and notes. Thorough, detailed work. Whatever else they are, they\'re serious scholars.', value: 'Documentation standards' },
                    { chance: 0.3, result: 'item', message: 'Among their finds: duplicate pottery sherds. "We only need one for the museum. Keep this one." A small gesture of respect.', value: 'POTTERY_SHERD' },
                    { chance: 0.2, result: 'nothing', message: 'They\'re secretive about their best finds. "Museum property now," the leader says firmly.' }
                ]
            }
        ]
    },
    {
        id: 'antiquity_sealed_chamber',
        era: HistoricalEra.ANTIQUITY,
        prompt: "You find a chamber sealed with a fitted stone. No mortar - just weight and precision. The seal is intact. Fresh tool marks nearby suggest someone tried to open it recently and gave up. There's no inscription, no warning, no decoration. Just stone.",
        choices: [
            {
                text: "Try to open it yourself",
                outcomes: [
                    { chance: 0.3, result: 'item', message: 'Hours of work. The seal shifts. Inside: clay vessels, bronze tools, someone\'s household goods. Humble but intact.', value: 'BRONZE_TOOL' },
                    { chance: 0.35, result: 'injury', message: 'The stone shifts wrong. It falls. You pull back just fast enough - broken toes instead of crushed legs.', value: 18 },
                    { chance: 0.2, result: 'nothing', message: 'You can\'t budge it. Whoever placed this knew what they were doing. It stays sealed.' },
                    { chance: 0.15, result: 'death', message: 'The seal gives way all at once. The stone falls inward, and you with it. The chamber floor is ten feet down, stone.' }
                ]
            },
            {
                text: "Mark the location and leave it for experts",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'You document it carefully - measurements, sketches, location. Maybe someone will excavate it properly someday.', value: 'Archaeological site documentation' },
                    { chance: 0.35, result: 'nothing', message: 'You return months later. Someone else opened it. The chamber is empty, ransacked. You were too cautious.' },
                    { chance: 0.25, result: 'gold_gain', message: 'Years later, a proper excavation happens. They credit your documentation. A small honorarium for your contribution.', value: 180 }
                ]
            },
            {
                text: "Look for another entrance",
                outcomes: [
                    { chance: 0.35, result: 'item', message: 'You find a smaller side passage, partially collapsed. You can squeeze through. Inside: undisturbed grave goods.', value: 'ANCIENT_JEWELRY' },
                    { chance: 0.4, result: 'nothing', message: 'You search for days. If another entrance exists, it\'s long since collapsed or hidden.' },
                    { chance: 0.25, result: 'knowledge', message: 'No other entrance, but your searching reveals foundation walls you hadn\'t seen. This was part of something larger.', value: 'Architectural context' }
                ]
            }
        ]
    },
    {
        id: 'medieval_shipwreck_survivor',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['EUROPEAN'],
        prompt: "A man lies in the ruins, soaked and shivering. Salt-crusted clothes, cuts and bruises, exhausted. 'Ship went down,' he manages. 'Two days ago. I swam. Others...' He doesn't finish. His accent is foreign - Norse, maybe. Or Frisian. He's cargo crew, not a warrior - calloused hands, not sword-trained.",
        choices: [
            {
                text: "Help him back to the nearest town",
                outcomes: [
                    { chance: 0.5, result: 'gold_gain', message: 'He recovers. His shipping company pays you a finder\'s fee for returning their crewman alive.', value: 120 },
                    { chance: 0.3, result: 'knowledge', message: 'On the journey he tells you about northern trade routes, cargo prices, ship construction. Practical knowledge.', value: 'Maritime trade networks' },
                    { chance: 0.2, result: 'nothing', message: 'He recovers but has nothing to give you. He thanks you and signs onto another ship within the week.' }
                ]
            },
            {
                text: "Give him food and shelter in the ruins, let him recover",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'Over three days he regains strength. He shares stories of Iceland, cargo runs, weather patterns. You learn about a world you\'ve never seen.', value: 'Northern maritime culture' },
                    { chance: 0.3, result: 'item', message: 'He insists you take his knife - good steel, Norse make. "You saved my life. It\'s the only thing I have left."', value: 'NORSE_KNIFE' },
                    { chance: 0.3, result: 'injury', message: 'He develops fever - the seawater, the exposure. You tend him but it spreads to you. You both survive, but you lose a week to illness.', value: 8 }
                ]
            },
            {
                text: "Send word but keep your distance - could be plague ship",
                outcomes: [
                    { chance: 0.5, result: 'nothing', message: 'You alert the port authority. They come with a priest. Protocol for shipwreck survivors. You did the right thing, probably.' },
                    { chance: 0.3, result: 'knowledge', message: 'It wasn\'t plague - just a storm wreck. But your caution teaches you about quarantine procedures and port authority responses.', value: 'Maritime health protocols' },
                    { chance: 0.2, result: 'gold_gain', message: 'The survivor was carrying documents for merchants. You retrieve them, return them. The merchants reward your discretion.', value: 150 }
                ]
            }
        ]
    },
    // MEDIEVAL EVENTS - NORTH_AMERICAN_PRE_COLUMBIAN
    {
        id: 'medieval_mound_offering',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
        prompt: "Fresh earth on top of an ancient platform mound. Someone's been digging - you can see the shaft going down. Copper plates, shell beads, mica sheets scattered around the hole. Still sorting their finds, or got interrupted. A fine obsidian blade lies in the dirt.",
        choices: [
            {
                text: "Take the blade and some copper",
                outcomes: [
                    { chance: 0.40, result: 'item', message: 'You pocket the obsidian blade and several copper plates. Quality work, valuable trade goods.', value: 'OBSIDIAN_BLADE' },
                    { chance: 0.35, result: 'death', message: 'The diggers return with warriors. You\'re caught with sacred burial goods. The punishment is immediate.' },
                    { chance: 0.25, result: 'gold_gain', message: 'You trade the stolen goods quickly to a distant trader. Good payment, but you\'ve violated sacred ground.', value: 220 }
                ]
            },
            {
                text: "Wait to see who dug the shaft",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'Looters return - they offer to split the find if you help excavate. You learn about Mississippian burial practices through theft.', value: 'Platform mound archaeology' },
                    { chance: 0.30, result: 'nothing', message: 'You wait for hours. No one returns. Night falls and you must leave empty-handed.' },
                    { chance: 0.30, result: 'item', message: 'The digger returns, sees you waiting. Nervous, they pay you to forget what you saw. You take the shell beads offered.', value: 'SHELL_BEAD_NECKLACE' }
                ]
            },
            {
                text: "Report the disturbance to settlement authorities",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'The chiefs are grateful. They explain this is ancestral sacred ground. They seal the shaft properly and invite you to the reburial ceremony.', value: 'Mississippian burial protocols' },
                    { chance: 0.35, result: 'gold_gain', message: 'Your respect for sacred sites earns the community\'s trust. They hire you as a guardian. Payment in copper and provisions.', value: 180 },
                    { chance: 0.20, result: 'death', message: 'The "authorities" are the ones who ordered the dig. You\'ve revealed their sacrilege. They silence you.' }
                ]
            }
        ]
    },
    {
        id: 'medieval_plaza_cache',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
        prompt: "The plaza stones are disturbed - one lifted, leaning. Underneath: pottery vessels stacked carefully, sealed with pitch. Corn, beans, squash seeds inside - dry, viable. Enough to plant several fields. Someone's seed store, or ritual offering. Hard to tell.",
        choices: [
            {
                text: "Take some seeds - you need them",
                outcomes: [
                    { chance: 0.40, result: 'item', message: 'You fill a pouch with mixed seeds. Three Sisters planting - a season\'s worth if the weather holds.', value: 'THREE_SISTERS_SEEDS' },
                    { chance: 0.35, result: 'death', message: 'The plaza keeper returns, finds you raiding the community seed reserve. Seed theft means starvation. No mercy.' },
                    { chance: 0.25, result: 'knowledge', message: 'Taking the seeds, you notice they\'re sorted by variety - selective breeding over generations.', value: 'Crop domestication techniques' }
                ]
            },
            {
                text: "Reseal it exactly as found",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'You reseal carefully. The plaza keeper arrives later, checks the seal, nods. Your respect is noted. They explain it\'s the drought reserve.', value: 'Community resource management' },
                    { chance: 0.30, result: 'nothing', message: 'You seal it and leave. No one appears. Your honesty goes unrewarded.' },
                    { chance: 0.20, result: 'item', message: 'Your care in resealing impresses the keeper. They gift you a smaller cache of seeds - legitimately yours.', value: 'SEED_POUCH' }
                ]
            },
            {
                text: "Take vessels, leave seeds",
                outcomes: [
                    { chance: 0.40, result: 'item', message: 'The pottery is exquisite - black-on-white geometric patterns. You take three vessels, leave the seeds intact.', value: 'PUEBLO_POTTERY' },
                    { chance: 0.35, result: 'death', message: 'Ritual vessels stolen means death. The seeds were meant to renew them. Without the pots, the seeds die anyway. You\'re blamed for both.' },
                    { chance: 0.25, result: 'gold_gain', message: 'You trade the stolen pottery to collectors from the coast. Excellent payment, though you\'ve disrupted a ritual cycle.', value: 300 }
                ]
            }
        ]
    },
    // MEDIEVAL EVENTS - NORTH_AMERICAN_COLONIAL
    {
        id: 'medieval_norse_remnant',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['NORTH_AMERICAN_COLONIAL'],
        prompt: "Iron rivets scattered in the ruins - ship rivets, Norse style. Old, 300+ years maybe. But someone's collected them recently - they're arranged in rows, cleaned of rust. A leather pouch nearby contains more rivets and a small iron axe head.",
        choices: [
            {
                text: "Take the axe head - valuable iron",
                outcomes: [
                    { chance: 0.40, result: 'item', message: 'Norse iron, beautifully forged. Rare this far from the failed settlements. Worth considerable trade.', value: 'NORSE_AXE_HEAD' },
                    { chance: 0.35, result: 'death', message: 'The collector returns - local chief claiming Norse heritage. Stealing ancestral artifacts is unforgivable. Warriors enforce the claim.' },
                    { chance: 0.25, result: 'gold_gain', message: 'You fence the axe to European traders. They pay premium for "Viking relics" from the New World.', value: 280 }
                ]
            },
            {
                text: "Wait for the collector",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'An old man returns, tells stories his grandmother told him - pale strangers, timber halls, then gone. The rivets are family tradition.', value: 'Oral history of Norse contact' },
                    { chance: 0.30, result: 'nothing', message: 'You wait all day. No one comes. The pouch remains, but your patience yields nothing.' },
                    { chance: 0.30, result: 'item', message: 'The collector appreciates you guarding his work. He gifts you a single rivet and tells you where other Norse sites might be.', value: 'IRON_RIVET' }
                ]
            },
            {
                text: "Add any iron you have to the collection",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'The collector returns, moved by your addition. He shares detailed knowledge of Norse-Indigenous contact, trade, and conflict.', value: 'Vinland settlement history' },
                    { chance: 0.30, result: 'item', message: 'Your contribution earns trust. He shows you his full collection - nails, an axe, ship fittings. He gifts you a corroded knife.', value: 'NORSE_KNIFE_FRAGMENT' },
                    { chance: 0.20, result: 'nothing', message: 'You leave iron beside the pile. No one appears before you must leave.' }
                ]
            }
        ]
    },
    {
        id: 'medieval_copper_route',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['NORTH_AMERICAN_COLONIAL'],
        prompt: "The ruin sits on a portage route - you can see where canoes were dragged between waterways. Copper nuggets scattered in the grass - raw copper, Great Lakes source. Someone's been trading here recently. A birchbark container holds more copper pieces, marked with clan symbols.",
        choices: [
            {
                text: "Take the marked copper - valuable",
                outcomes: [
                    { chance: 0.35, result: 'item', message: 'You take copper marked with thunderbird and underwater panther symbols. Great Lakes trade goods, valuable anywhere.', value: 'NATIVE_COPPER' },
                    { chance: 0.40, result: 'death', message: 'The copper bearers return - they\'re clan traders under protection. Taking marked copper violates trade law. Execution is summary.' },
                    { chance: 0.25, result: 'gold_gain', message: 'You trade the stolen copper downriver. The buyer knows it\'s marked but doesn\'t care. Good payment, bad reputation.', value: 260 }
                ]
            },
            {
                text: "Wait for traders to return",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'Traders arrive at dusk - Anishinaabe, heading south. They explain the trade routes, clan territories, exchange protocols. You\'re allowed to observe.', value: 'Great Lakes trade networks' },
                    { chance: 0.30, result: 'item', message: 'The traders offer to include you in their network. You trade goods fairly and receive copper pieces as introduction gift.', value: 'COPPER_NUGGETS' },
                    { chance: 0.25, result: 'nothing', message: 'You wait through the night. No traders appear. Perhaps the season is over, or trouble along the route.' }
                ]
            },
            {
                text: "Add trade goods, participate in exchange system",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'You leave trade goods - furs, shell beads. Traders find them, reciprocate with copper and information about safe routes.', value: 'Reciprocal trade practices' },
                    { chance: 0.30, result: 'item', message: 'Your respectful participation opens the trade network. You receive copper, wampum, and an invitation to the next seasonal gathering.', value: 'WAMPUM_BELT' },
                    { chance: 0.20, result: 'gold_loss', message: 'You leave valuable goods, but raiders find them first. The traders never see your offering. You\'ve lost goods for nothing.', value: 150 }
                ]
            }
        ]
    },
    // MEDIEVAL EVENTS - OCEANIA
    {
        id: 'medieval_canoe_planks',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['OCEANIA'],
        prompt: "Massive canoe planks buried in sand near the ruin - hardwood, carved with patterns. Voyaging canoe, ocean-going. Partially excavated - someone's been digging them out. The wood is old but solid, valuable. Rope coils nearby, ready to haul.",
        choices: [
            {
                text: "Help excavate, claim a share",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'The excavator returns, accepts your help. Together you uncover a complete hull section. They explain voyaging canoe construction - lashing, caulking, sacred protocols.', value: 'Polynesian canoe technology' },
                    { chance: 0.35, result: 'item', message: 'Your labor earns a share - one carved plank, suitable for a smaller vessel. Good wood, traditional designs.', value: 'CARVED_CANOE_PLANK' },
                    { chance: 0.25, result: 'injury', message: 'The plank shifts during excavation, pins your leg. The excavator helps free you but you\'re badly bruised and strained.', value: 14 }
                ]
            },
            {
                text: "Take what's already exposed",
                outcomes: [
                    { chance: 0.35, result: 'item', message: 'You take three exposed planks. Enough to build a small outrigger. The excavator won\'t miss a few pieces from dozens.', value: 'CANOE_PLANK_SET' },
                    { chance: 0.45, result: 'death', message: 'The canoe is wahi tapu - sacred. Taking pieces without permission violates kapu. The penalty is death, enforced immediately.' },
                    { chance: 0.20, result: 'gold_gain', message: 'You sell the stolen planks to shipwrights. They recognize the quality and don\'t ask questions. Good payment.', value: 240 }
                ]
            },
            {
                text: "Document and leave it for the community",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'You sketch the carvings, measure the planks, document the burial. The community elders thank you and explain this is a legendary navigator\'s vessel.', value: 'Voyaging canoe history' },
                    { chance: 0.30, result: 'item', message: 'Your respectful documentation impresses the elders. They gift you a small carved paddle - not from this canoe, but traditional work.', value: 'CEREMONIAL_PADDLE' },
                    { chance: 0.20, result: 'nothing', message: 'You document thoroughly and report it. No one responds. Your professionalism goes unacknowledged.' }
                ]
            }
        ]
    },
    {
        id: 'medieval_pa_fortification',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['OCEANIA'],
        prompt: "The ruin was fortified - ditches, palisade post-holes, fighting platforms. Recent activity: someone's been digging the ditches deeper, sharpening stakes, repairing the defenses. Tools left out - adzes, digging sticks. Footprints everywhere. They're coming back.",
        choices: [
            {
                text: "Wait to see who's fortifying",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'A hapu returns - they\'re reoccupying the pa due to territorial disputes. They explain the defensive features, siege tactics, stored provisions.', value: 'Maori fortification strategies' },
                    { chance: 0.35, result: 'death', message: 'Warriors return, find you inside their defensive position. In time of conflict, that\'s spying. No trial needed.' },
                    { chance: 0.25, result: 'item', message: 'The builders return, cautiously accept your peaceful presence. One gifts you a sharpened patu as a gesture. "Stay on good terms," he suggests.', value: 'PATU_CLUB' }
                ]
            },
            {
                text: "Take the tools - well made",
                outcomes: [
                    { chance: 0.35, result: 'item', message: 'You take two adzes and a digging stick. Quality tools, greenstone blades. Worth considerable trade.', value: 'GREENSTONE_ADZE' },
                    { chance: 0.45, result: 'death', message: 'The hapu returns for their tools. Stealing during fortification preparation is sabotage. The punishment is swift and brutal.' },
                    { chance: 0.20, result: 'gold_gain', message: 'You trade the stolen tools to a different iwi. They pay well and ask no questions about origin.', value: 200 }
                ]
            },
            {
                text: "Add to the defenses yourself",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'You dig, sharpen stakes, clear sight lines. When the hapu returns, they\'re impressed. "You choose a side," the rangatira says. They teach you pa construction.', value: 'Defensive earthwork engineering' },
                    { chance: 0.30, result: 'item', message: 'Your labor is noted with approval. They gift you a whalebone mere and explain you\'re welcome in their pa if conflict comes.', value: 'WHALEBONE_MERE' },
                    { chance: 0.25, result: 'injury', message: 'While digging, you trigger an old trap - sharpened stakes hidden in the ditch. You\'re impaled through the leg. They help you, but you\'ll heal slowly.', value: 22 }
                ]
            }
        ]
    },
    // MEDIEVAL EVENTS - SOUTH_ASIAN
    {
        id: 'medieval_temple_looting',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['SOUTH_ASIAN'],
        prompt: "Temple ruins, stone carved with deities. Someone's been chiseling - fresh stone dust, broken sculptures. They're removing the valuable pieces systematically. A bronze lamp lies hidden behind rubble, obviously stashed for later retrieval.",
        choices: [
            {
                text: "Take the bronze lamp before they return",
                outcomes: [
                    { chance: 0.40, result: 'item', message: 'The lamp is beautiful - Chola period bronze, ritual use. Valuable to collectors, sacred to devotees.', value: 'BRONZE_LAMP' },
                    { chance: 0.35, result: 'death', message: 'The looters return - armed gang working for a corrupt official. Interfering with their operation means death.' },
                    { chance: 0.25, result: 'gold_gain', message: 'You fence the lamp quickly. The buyer is a temple patron recovering looted artifacts. They pay well, assuming you rescued it.', value: 320 }
                ]
            },
            {
                text: "Wait and confront the looters",
                outcomes: [
                    { chance: 0.30, result: 'knowledge', message: 'The looters return - desperate villagers, not professionals. Temple was abandoned after the sultanate raids. They explain the economic collapse.', value: 'Post-conquest cultural destruction' },
                    { chance: 0.40, result: 'death', message: 'The looters are soldiers, not civilians. Confronting armed men over "pagan idols" is fatal. They\'re following orders.' },
                    { chance: 0.30, result: 'injury', message: 'You confront them. A fight breaks out. You\'re beaten badly but escape with your life. The looting continues.', value: 18 }
                ]
            },
            {
                text: "Report to temple authorities",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'The priests are grateful but powerless. The temple lost its lands and protection. They explain how patronage collapse leads to looting.', value: 'Temple economics and decline' },
                    { chance: 0.35, result: 'gold_gain', message: 'The priests can\'t stop the looting but reward your loyalty. They pay from hidden reserves and bless your efforts.', value: 180 },
                    { chance: 0.25, result: 'nothing', message: 'The "authorities" are complicit in the looting. Your report goes nowhere. Nothing changes.' }
                ]
            }
        ]
    },
    {
        id: 'medieval_spice_cache',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['SOUTH_ASIAN'],
        prompt: "Clay pots sealed with wax, hidden in the ruin's wall. Broken open - black pepper, cardamom, cloves. Trade goods, valuable. Some spilled, most still in pots. Fresh footprints in the spice dust. Someone was here within the hour.",
        choices: [
            {
                text: "Fill your bag with spices",
                outcomes: [
                    { chance: 0.40, result: 'item', message: 'You take maybe two kilograms - black pepper, cardamom, cloves. Worth significant coin at market.', value: 'SPICE_CACHE' },
                    { chance: 0.35, result: 'death', message: 'The merchant returns with guards. His cache, his guards, his justice. You don\'t get a trial.' },
                    { chance: 0.25, result: 'gold_gain', message: 'You sell the spices immediately. Excellent payment - these are premium grades, probably destined for nobility.', value: 280 }
                ]
            },
            {
                text: "Wait for the merchant to return",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'The merchant returns, nervous. You waited instead of stealing - that earns trust. He explains the trade routes, monsoon timing, quality grading.', value: 'Indian Ocean spice trade' },
                    { chance: 0.30, result: 'item', message: 'Your honesty impresses him. He shares a portion of the spices - payment for guarding his cache while he fetched porters.', value: 'PEPPERCORN_SACK' },
                    { chance: 0.25, result: 'gold_gain', message: 'He offers you work as a guard for his caravan. Weeks of employment, good pay, travel to the ports.', value: 220 }
                ]
            },
            {
                text: "Reseal the pots, leave them",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'You reseal carefully. The merchant returns, checks the pots, nods. Later he finds you, explains you passed a test. Many would have stolen.', value: 'Merchant trust networks' },
                    { chance: 0.30, result: 'item', message: 'Your restraint earns a gift - the merchant gives you a small bag of cloves. "For your honesty," he says.', value: 'CLOVE_SACHET' },
                    { chance: 0.20, result: 'nothing', message: 'You seal and leave. The merchant never knows you were there. Your honor goes unrewarded.' }
                ]
            }
        ]
    },
    // MEDIEVAL EVENTS - SOUTH_AMERICAN
    {
        id: 'medieval_textile_burial',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['SOUTH_AMERICAN'],
        prompt: "Textiles exposed by erosion - woven, dyed, incredibly preserved by dry air. Someone's been cutting pieces - you can see where cloth was removed. Several complete textiles remain, partially unfolded. Scissors lie nearby, still sharp.",
        choices: [
            {
                text: "Take a complete textile",
                outcomes: [
                    { chance: 0.35, result: 'item', message: 'You carefully remove one complete piece - geometric patterns, natural dyes, masterful weaving. Museum quality.', value: 'ANDEAN_TEXTILE' },
                    { chance: 0.40, result: 'death', message: 'Descendants arrive, find you desecrating burial textiles. Disturbing the dead is unforgivable. Justice is immediate.' },
                    { chance: 0.25, result: 'gold_gain', message: 'You sell the textile to collectors. They pay premium for intact pre-Columbian pieces. You don\'t mention it\'s from a burial.', value: 340 }
                ]
            },
            {
                text: "Take only small samples",
                outcomes: [
                    { chance: 0.45, result: 'item', message: 'You cut small pieces from damaged sections - enough to study weaving techniques without destroying complete works.', value: 'TEXTILE_SAMPLES' },
                    { chance: 0.30, result: 'knowledge', message: 'Examining the samples closely, you understand the fiber preparation, dye techniques, weaving patterns. Information preserved through careful sampling.', value: 'Andean weaving technology' },
                    { chance: 0.25, result: 'death', message: 'The family finds you cutting their ancestors\' burial shrouds. Size of the sample doesn\'t matter. Sacrilege is sacrilege.' }
                ]
            },
            {
                text: "Sketch the patterns, rebury them",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'You draw the patterns carefully, note colors and techniques, then rebury everything. Respectful documentation. The family later thanks you.', value: 'Textile pattern documentation' },
                    { chance: 0.30, result: 'item', message: 'Your care impresses watching family members. They gift you a modern textile using the same traditional techniques - not burial goods, freely given.', value: 'MODERN_TRADITIONAL_TEXTILE' },
                    { chance: 0.20, result: 'nothing', message: 'You document and rebury. No one appears. Your ethical choice goes unnoticed, but the textiles are protected.' }
                ]
            }
        ]
    },
    {
        id: 'medieval_quipu_find',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['SOUTH_AMERICAN'],
        prompt: "Knotted cords - quipu - hanging from a niche in the wall. Record-keeping device. Old, but someone's been studying it - there are notes in charcoal on the wall, attempting to decode the knots. The quipu itself is fragile, fading.",
        choices: [
            {
                text: "Take the quipu for study",
                outcomes: [
                    { chance: 0.35, result: 'item', message: 'You carefully remove the quipu. The knots encode information - census data, tribute records, astronomical calculations. Undeciphered but intact.', value: 'INCA_QUIPU' },
                    { chance: 0.40, result: 'death', message: 'The quipucamayoc family returns - their ancestor was the keeper. Taking the quipu is theft of ancestral knowledge. Punishment is death.' },
                    { chance: 0.25, result: 'knowledge', message: 'You examine it intensely before taking it. The knot structure reveals numerical patterns. You\'re beginning to understand the system.', value: 'Quipu numerical encoding' }
                ]
            },
            {
                text: "Copy the knot patterns, leave original",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'You map every knot - color, position, type. The original remains safe while you preserve the information encoded within.', value: 'Quipu structure and patterns' },
                    { chance: 0.30, result: 'item', message: 'Creating your copy, you use similar fiber and knotting. The replica works as a learning tool for understanding the system.', value: 'QUIPU_REPLICA' },
                    { chance: 0.20, result: 'nothing', message: 'Your copies are too crude. Without understanding the encoding system, the patterns are meaningless. Time wasted.' }
                ]
            },
            {
                text: "Study the decoder's notes, add your own",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'The notes show someone else\'s progress. You add your observations. Together, the annotations create a partial decoding key.', value: 'Collaborative quipu decipherment' },
                    { chance: 0.30, result: 'knowledge', message: 'The decoder returns while you study. A descendant of quipucamayocs, they\'re trying to recover lost family knowledge. They cautiously share insights.', value: 'Oral quipu traditions' },
                    { chance: 0.25, result: 'death', message: 'The decoder is protective of their research. Finding you at their work site, they assume you\'re stealing their scholarship. Violence follows.' }
                ]
            }
        ]
    },
    // MEDIEVAL EVENTS - SUB_SAHARAN_AFRICAN
    {
        id: 'medieval_zimbabwe_gold',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['SUB_SAHARAN_AFRICAN'],
        prompt: "Dry-stone walling - Great Zimbabwe style, no mortar. Someone's been dismantling a section, stone by stone. Behind the wall: a small chamber. Gold beads scattered on the floor, a soapstone bird (broken), copper wire coils. The dismantler's tools lean against the wall.",
        choices: [
            {
                text: "Take the gold and bird fragment",
                outcomes: [
                    { chance: 0.35, result: 'item', message: 'You pocket gold beads and the soapstone bird fragment. Great Zimbabwe artifacts - rare, valuable to collectors.', value: 'ZIMBABWE_BIRD_FRAGMENT' },
                    { chance: 0.45, result: 'death', message: 'The excavator returns with royal guards. This is crown property - royal Zimbabwe gold. Theft means execution.' },
                    { chance: 0.20, result: 'gold_gain', message: 'You fence the artifacts through coastal traders. They pay premium prices for Zimbabwe gold. No questions asked.', value: 380 }
                ]
            },
            {
                text: "Wait for them to return to their work",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'The excavator returns - court antiquarian documenting tributary states. Seeing you waited, they explain Great Zimbabwe\'s decline and regional reorganization.', value: 'Zimbabwe state archaeology' },
                    { chance: 0.30, result: 'item', message: 'The antiquarian appreciates your patience. They share duplicate finds - small copper wire pieces and stone fragments.', value: 'COPPER_WIRE' },
                    { chance: 0.30, result: 'death', message: 'Guards return before the excavator. You\'re inside a sealed royal chamber. No explanation will save you from suspicion.' }
                ]
            },
            {
                text: "Rebuild the wall, seal it again",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'You carefully replace each stone. Elders arrive, impressed by your preservation of ancestral architecture. They explain Zimbabwe\'s history, gold trade networks.', value: 'Great Zimbabwe construction' },
                    { chance: 0.35, result: 'item', message: 'Your respect for sacred architecture earns trust. The elders gift you a modern-made soapstone carving using traditional techniques.', value: 'SOAPSTONE_CARVING' },
                    { chance: 0.20, result: 'nothing', message: 'You rebuild perfectly. No one knows you were there. The wall stays sealed for another century.' }
                ]
            }
        ]
    },
    {
        id: 'medieval_swahili_warehouse',
        era: HistoricalEra.MEDIEVAL,
        culturalZones: ['SUB_SAHARAN_AFRICAN'],
        prompt: "Coral stone foundation - Indian Ocean architecture. Trade warehouse, long abandoned. Someone's dug a trench through the floor - looking for buried goods. Chinese porcelain shards in the dirt, glass beads, cowrie shells. A complete Ming bowl sits in the trench, just uncovered.",
        choices: [
            {
                text: "Take the Ming bowl - extremely valuable",
                outcomes: [
                    { chance: 0.35, result: 'item', message: 'Blue and white porcelain, intact, Ming dynasty. Zheng He voyage era. Worth a fortune to collectors.', value: 'MING_BOWL' },
                    { chance: 0.40, result: 'death', message: 'The excavator returns - local merchant with legal claim to the site. Artifact theft from documented excavations brings swift punishment.' },
                    { chance: 0.25, result: 'gold_gain', message: 'You sell the Ming bowl to Chinese traders. They pay premium - it matches documented trade records, extremely rare survival.', value: 420 }
                ]
            },
            {
                text: "Help with the excavation, share finds",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'The digger returns, accepts your help. Together you excavate systematically. They explain Swahili coast trade with China, India, Arabia - 500+ years of commerce.', value: 'Swahili Indian Ocean trade' },
                    { chance: 0.30, result: 'item', message: 'Your labor earns a share - glass beads, cowrie shells, small porcelain fragments. The complete bowl goes to the excavator by agreement.', value: 'TRADE_BEAD_COLLECTION' },
                    { chance: 0.25, result: 'injury', message: 'The coral stone trench collapses during excavation. You\'re partially buried, suffering cuts and a badly sprained wrist.', value: 16 }
                ]
            },
            {
                text: "Document the site, report the digging",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'Authorities arrive, conduct proper excavation. You\'re credited with site preservation. The warehouse yields dozens of trade items, documented scientifically.', value: 'Archaeological site management' },
                    { chance: 0.35, result: 'gold_gain', message: 'Your report leads to licensed excavation. You\'re hired as site assistant. Months of work, proper payment, published findings.', value: 300 },
                    { chance: 0.25, result: 'nothing', message: 'The "authorities" are corrupt. They loot the site themselves. Your report enabled them. Nothing is preserved.' }
                ]
            }
        ]
    },
    {
        id: 'modern_survey_team',
        era: HistoricalEra.MODERN_ERA,
        prompt: "Another research team has set up at the ruins. University logos on their equipment, grad students taking measurements, professor reviewing data on a laptop. They notice you watching. 'Working on something here?' the professor asks. Not hostile, but territorial. You've both been coming here for months. Neither of you knew about the other.",
        choices: [
            {
                text: "Propose collaboration and data sharing",
                outcomes: [
                    { chance: 0.4, result: 'knowledge', message: 'They agree cautiously. Combined data reveals patterns neither of you saw alone. The resulting paper credits both teams.', value: 'Collaborative research methods' },
                    { chance: 0.35, result: 'nothing', message: 'They\'re polite but decline. "Our funding is competitive-grant based. We can\'t share until publication." You understand, but it stings.' },
                    { chance: 0.25, result: 'knowledge', message: 'They share some findings, you share some. Informal collaboration. No paper, but you both learn more than you would have alone.', value: 'Informal academic networks' }
                ]
            },
            {
                text: "Assert you were here first and ask them to work elsewhere",
                outcomes: [
                    { chance: 0.4, result: 'nothing', message: 'They laugh. "The ruins don\'t belong to either of us." They continue their work. They\'re right, technically.' },
                    { chance: 0.3, result: 'knowledge', message: 'A tense negotiation. You divide the site - north section for them, south for you. Awkward but functional.', value: 'Research territory protocols' },
                    { chance: 0.3, result: 'gold_loss', message: 'They complain to the site authority. You end up in bureaucratic disputes about research permits. Lawyers get involved. Nobody wins.', value: 250 }
                ]
            },
            {
                text: "Ask what they're researching - maybe your work is different enough",
                outcomes: [
                    { chance: 0.5, result: 'knowledge', message: 'They\'re studying architectural techniques. You\'re studying artifact distribution. Different questions, same site. You coordinate schedules to stay out of each other\'s way.', value: 'Complementary research approaches' },
                    { chance: 0.3, result: 'knowledge', message: 'They\'re researching the same questions you are. Professional courtesy follows - you share publication timelines to avoid scooping each other.', value: 'Academic publishing ethics' },
                    { chance: 0.2, result: 'gold_gain', message: 'They need someone with your specific expertise. They hire you as a consultant. Your name goes on their grant applications.', value: 200 }
                ]
            }
        ]
    },

    // INDUSTRIAL ERA - EAST ASIAN
    {
        id: 'industrial_tea_pickers',
        era: HistoricalEra.INDUSTRIAL_ERA,
        culturalZones: ['EAST_ASIAN'],
        prompt: "Women pick tea leaves on the hillside above the ruins. Their foreman has set up a collection station in the sheltered corner - weighing scales, baskets, a table with ledgers. 'Good shade here,' he says when he notices you. 'Keeps the leaves from wilting while we do the count.' The women work fast, experienced hands stripping leaves. One nurses an infant while sorting her basket with the other hand. You can hear them talking quietly in the local dialect.",
        choices: [
            {
                text: "Ask about the plantation and their work",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'The foreman explains the quota system - each woman must pick a certain weight per day. "The company owner lives in the provincial capital. Never even seen these hills." You notice him adjusting the scale when a woman isn\'t looking. The women see it too, say nothing. Everyone knows. What can they do?', value: 'Plantation labor exploitation' },
                    { chance: 0.30, result: 'item', message: 'One woman approaches you during a break. "You want tea? Good quality. Not the plantation stuff - this is what I keep for family." She glances at the foreman. "Trade you for food." The leaves are excellent, stolen from her own quota.', value: 'TEA_LEAVES' },
                    { chance: 0.20, result: 'nothing', message: 'They\'re too tired to talk. It\'s the middle of a twelve-hour day. They\'ll pick until sunset, walk home, do it again tomorrow.' }
                ]
            },
            {
                text: "Point out the foreman's rigged scale",
                outcomes: [
                    { chance: 0.35, result: 'knowledge', message: 'The women exchange glances. One older picker speaks up: "We know. Last year a girl complained to the overseer. She was dismissed. No work, no food. Her family nearly starved." The foreman glares at you. "This isn\'t your business, stranger. Move along." But the women nod to you slightly as you leave.', value: 'Labor resistance and consequences' },
                    { chance: 0.40, result: 'gold_loss', message: 'The foreman reports you as a labor agitator. The plantation owner has connections with local officials. You\'re fined for trespassing on company land and told if you return, it won\'t be a fine next time.', value: 150 },
                    { chance: 0.25, result: 'injury', message: 'The foreman\'s two assistants find you later on the path. "Mind your own business," one says, and they make their point with fists and a wooden stave. Your ribs ache for weeks.', value: 15 }
                ]
            },
            {
                text: "Document the ruins while staying out of their way",
                outcomes: [
                    { chance: 0.50, result: 'nothing', message: 'You work on different parts of the site. At sunset they pack up the baskets and head down the hill. The foreman locks his scales and ledgers in a wooden box. By tomorrow they\'ll be back.' },
                    { chance: 0.35, result: 'knowledge', message: 'During breaks, the women point things out to you - which walls are stable for shelter, where rainwater collects in cisterns after storms. They know these ruins better than anyone. Their mothers picked tea here, their grandmothers too. Generations of knowledge.', value: 'Generational site knowledge from laborers' },
                    { chance: 0.15, result: 'item', message: 'While clearing space for the weighing station, one woman finds a corroded coin. She hands it to you. "Bad luck to keep old money," she says. "Might anger whatever spirits still live in these stones."', value: 'BRONZE_COIN' }
                ]
            }
        ]
    },
    {
        id: 'industrial_railway_survey',
        era: HistoricalEra.INDUSTRIAL_ERA,
        culturalZones: ['EAST_ASIAN'],
        prompt: "Survey engineers have staked out a railway route that cuts directly through the ruins. A Chinese surveyor and a European engineer argue over maps spread on a folding table. The European jabs his finger at the paper: 'The grade is impossible if we curve around. Straight through.' The Chinese man replies carefully: 'There are historical structures here. Perhaps...' The European cuts him off. 'The railway company doesn't pay us to preserve rocks.' Local workers sit idle, waiting for instructions, smoking pipes.",
        choices: [
            {
                text: "Explain the archaeological importance to the European engineer",
                outcomes: [
                    { chance: 0.35, result: 'nothing', message: 'He looks at you like you\'re speaking nonsense. "Rocks. Old rocks." He taps the map. "This is progress, sir. Railways, telegraphs, civilization. Old rocks stand in the way." He dismisses you and returns to his calculations.' },
                    { chance: 0.35, result: 'knowledge', message: 'The Chinese surveyor pulls you aside after. "He won\'t listen. The route was decided in the capital months ago. Foreign investors, government contracts - it\'s all arranged." He looks genuinely pained. "I studied these sites at university. But what can I do? I need this work." He shares his notes about other ruins along the planned route.', value: 'Political economy of infrastructure development' },
                    { chance: 0.30, result: 'gold_loss', message: 'The European thinks you\'re trying to obstruct the project for money. "How much do you want? Is that it?" When you refuse, he has you removed from the site by workers. Later, local magistrates warn you about interfering with imperial railway projects.', value: 100 }
                ]
            },
            {
                text: "Ask the Chinese surveyor if the route can be adjusted",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'He shows you the maps quietly. "Maybe... if we adjust here, we save some of the main structure. The company won\'t know the difference." He makes small changes to his survey notes. It won\'t save the site, but it\'s something. "I do what I can," he says. "My grandfather was a scholar. He would want me to try."', value: 'Quiet resistance from within institutions' },
                    { chance: 0.35, result: 'nothing', message: 'He shakes his head. "I suggested that. The European engineer rejected it. Something about drainage and engineering specifications. Even if I adjust my numbers, he\'ll change them back. I have no authority here."' },
                    { chance: 0.20, result: 'injury', message: 'While discussing the route change, one of the survey poles falls. The iron tip catches your shoulder, tearing skin and muscle. The workers bandage it roughly, but you\'ll have a scar.', value: 18 }
                ]
            },
            {
                text: "Talk to the local workers about what they think",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'One older worker speaks between pipe puffs: "This was my family\'s land. My grandfather farmed here. Government sold it to the railway company three years ago. They gave us enough for one year. What do we do now? We work for the railway." Another adds: "The jobs are good. My son will operate the trains maybe. But still..." He trails off, looking at the ruins.', value: 'Displacement and economic transformation' },
                    { chance: 0.30, result: 'nothing', message: 'They won\'t talk freely with the engineers nearby. Work is scarce. They can\'t risk being seen as troublemakers. One man makes eye contact, shakes his head slightly.' },
                    { chance: 0.20, result: 'gold_gain', message: 'One worker approaches you later. "You want to know about old places? I know three more sites on the railway route. Give me money, I\'ll take you before they build." He\'s found a way to profit from the destruction.', value: 80 }
                ]
            }
        ]
    },
    {
        id: 'industrial_mission_school',
        era: HistoricalEra.INDUSTRIAL_ERA,
        culturalZones: ['SUB_SAHARAN_AFRICAN'],
        prompt: "A mission teacher has brought her students to the ruins for lessons. She points at weathered inscriptions on the walls, reading them aloud incorrectly, mixing Bible verses with whatever's actually carved there. The students - twelve to fifteen years old - copy the 'translations' onto slates. One boy traces the real letters with his finger, comparing them to what she's saying. He knows they don't match. He catches your eye, says nothing.",
        choices: [
            {
                text: "Correct the teacher's mistranslations",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'She flushes red. "I... I studied Greek, not this. The mission said close enough for teaching letters." She looks at the students, who are watching this exchange carefully. "What do they actually say?" You explain. The children lean forward, interested. She swallows her pride. "Then I suppose I learned something today too."', value: 'Colonial education contradictions' },
                    { chance: 0.35, result: 'nothing', message: 'Her face hardens. "I am teaching these children to read and write. Does it matter if the specific words are correct? They\'re learning letters, not paganism." She turns back to the students. "Continue copying, children."' },
                    { chance: 0.25, result: 'gold_loss', message: 'She reports you to the mission for "undermining Christian education and promoting heathen knowledge." The mission has influence with colonial administrators. They pressure you to make a donation to the school to avoid formal complaints.', value: 120 }
                ]
            },
            {
                text: "Offer to teach the students what the inscriptions actually say",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'The teacher hesitates, then nods. The students gather around as you explain the real text. Afterward, one boy stays behind. "My grandfather knew the old language. He wanted to teach us but..." He glances at the mission teacher. "It was forbidden. Can you write down what you taught us? I want to remember."', value: 'Generational knowledge preservation' },
                    { chance: 0.35, result: 'item', message: 'One student gives you a notebook where his grandfather wrote stories about the ruins before the mission came. "He died last year. But he wrote everything down in the letters they taught him. Wrote our stories in their writing." The irony isn\'t lost on either of you.', value: 'WRITTEN_HISTORY' },
                    { chance: 0.20, result: 'nothing', message: 'The teacher refuses. "The mission curriculum is set by the diocese. We cannot deviate. I\'m sorry." She doesn\'t sound sorry, just tired.' }
                ]
            },
            {
                text: "Observe the lesson without interfering",
                outcomes: [
                    { chance: 0.55, result: 'knowledge', message: 'You watch how education becomes colonization. The children learn to read and write - valuable skills. But they learn their own history is "paganism," that their ancestors\' achievements are building materials for Bible lessons. The boy who noticed the mismatch meets your eyes again. He knows. He\'ll remember.', value: 'Colonial education\'s double edge' },
                    { chance: 0.30, result: 'nothing', message: 'The lesson ends. The children form a line and sing a hymn as they walk back to the mission. Their voices are beautiful. The teacher looks genuinely fond of them. Everything is complicated.' },
                    { chance: 0.15, result: 'knowledge', message: 'After the students leave, the teacher sits alone. You see her looking at the inscriptions. "I know I\'m getting it wrong," she says quietly. "But if I don\'t teach them, who will? The alternative is no education at all. Is that better?" She doesn\'t expect an answer.', value: 'Moral compromise in colonial contexts' }
                ]
            }
        ]
    },
    {
        id: 'industrial_ivory_bones',
        era: HistoricalEra.INDUSTRIAL_ERA,
        culturalZones: ['SUB_SAHARAN_AFRICAN'],
        prompt: "The ruins are littered with elephant bones. Skulls, ribs, massive femurs - dozens of skeletons. Recent, maybe six months old judging by the remaining sinew. The tusks are gone, sawn off crudely. Just bones remain, left where the butchering happened. The scale is horrifying. You count at least twenty elephants. Someone used this sheltered space for the grim work of processing ivory for export.",
        choices: [
            {
                text: "Document the bones and the butchering site",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'You photograph everything, take measurements, note the saw marks on skulls where tusks were removed. Your documentation later becomes evidence in colonial reports about ivory trade routes, though by then it\'s far too late for these elephants. The bones tell a story of industrial-scale slaughter.', value: 'Ivory trade archaeological evidence' },
                    { chance: 0.30, result: 'nothing', message: 'You document everything meticulously. The photographs and notes sit in your collection for years. No one asks to see them. The ivory trade continues.' },
                    { chance: 0.25, result: 'gold_gain', message: 'An ivory trader finds your documentation before you can publish it. He offers you significant money to destroy the records - evidence of his operation could cause problems with authorities. The money is real. So is what it means to take it.', value: 200 }
                ]
            },
            {
                text: "Search for anything that might identify who did this",
                outcomes: [
                    { chance: 0.40, result: 'knowledge', message: 'You find empty ammunition boxes - British manufacture. Tool marks on the bones match industrial saw patterns. Footprints show a large crew, maybe twenty men. They were organized, professional. This wasn\'t subsistence hunting or traditional use. This was business.', value: 'Industrial ivory operation evidence' },
                    { chance: 0.35, result: 'death', message: 'You find their camp three miles north. They\'re still there. Professional ivory hunters don\'t appreciate witnesses. They can\'t let you leave knowing what you\'ve seen. You don\'t.' },
                    { chance: 0.25, result: 'item', message: 'In the debris you find a trader\'s manifest, partially burned. It lists ports, buyers, prices per pound of ivory. Dangerous knowledge, but valuable to anyone trying to track this trade.', value: 'IVORY_MANIFEST' }
                ]
            },
            {
                text: "Clear some bones to restore the site",
                outcomes: [
                    { chance: 0.40, result: 'injury', message: 'Elephant bones are massive and awkward. Moving a femur, you slip, and the bone rolls onto your leg. Something cracks. You manage to drag yourself to the path, but walking is agony for months.', value: 22 },
                    { chance: 0.40, result: 'nothing', message: 'You start moving bones but stop after an hour. There are too many. The site is overwhelmed. The bones will stay. Eventually they\'ll become part of the ruins\' archaeology - evidence of this era layered onto evidence of older ones.' },
                    { chance: 0.20, result: 'knowledge', message: 'While clearing, you notice the bones are positioned deliberately - the hunters stacked them this way intentionally, using the ruins as a  processing site because local people consider it cursed and avoid it. Practical use of superstition to hide evidence.', value: 'Tactical use of cultural beliefs' }
                ]
            }
        ]
    },
    {
        id: 'industrial_copra_workers',
        era: HistoricalEra.INDUSTRIAL_ERA,
        culturalZones: ['OCEANIA'],
        prompt: "Plantation workers dry coconut meat on the ruins' flat stones, using old columns as supports for their copra shed. The overseer - a local man in European clothes - checks moisture levels in the drying meat. Workers crack coconuts with practiced strikes, spread white meat to dry in the sun. The smell is sweet, oily, cloying in the heat. It's break time. Men and women sit in the shade, passing around water and tobacco.",
        choices: [
            {
                text: "Ask about traditional uses of this site",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'An older woman answers: "My grandmother said they held ceremonies here. Marriage ceremonies, I think. Maybe other things." She shrugs. "Now it\'s good flat stone for drying copra. The company rents the land from the chief. We just work." Another worker adds: "The old people used to leave offerings at that corner. Don\'t anymore. Company doesn\'t like it."', value: 'Transformation of sacred to commercial space' },
                    { chance: 0.30, result: 'item', message: 'During the break, one worker shows you tools his grandfather made - shell adzes, still sharp. "Found them when we built the shed. Clearing stones, you find a lot of old things. Most we sell to the traders who come for copra. Want to buy these?" He names a fair price.', value: 'SHELL_ADZE' },
                    { chance: 0.20, result: 'nothing', message: 'Break is short. Fifteen minutes. They\'re back to cracking coconuts before you finish your question. The overseer watches the clock. Production quotas don\'t care about conversations.' }
                ]
            },
            {
                text: "Point out they're damaging archaeological remains",
                outcomes: [
                    { chance: 0.45, result: 'nothing', message: 'The overseer looks at you flatly. "European company owns this land. We use what\'s here. You want to tell them they can\'t?" He gestures at the ruins. "These stones or our families eat. Which matters more?" You don\'t have a good answer.' },
                    { chance: 0.30, result: 'injury', message: 'One worker stands up, angry. "My family worked this land for ten generations. Then a man in Sydney signed a paper and now we rent it. Rent our own land! And you lecture us about stones?" He shoves you. Others pull him back, but you\'ve got a split lip and the message is clear.', value: 12 },
                    { chance: 0.25, result: 'knowledge', message: 'The overseer actually engages. "You think I don\'t know? My grandfather maintained these stones. But the plantation came and we had two choices - work for them or starve. I chose work. Maybe you think that makes me a bad person. Maybe it does. But my children eat."', value: 'Economic coercion in colonial systems' }
                ]
            },
            {
                text: "Offer to buy some copra and ask about their work",
                outcomes: [
                    { chance: 0.50, result: 'gold_loss', message: 'You buy a bag of dried copra. Good quality. While weighing it, the overseer explains the system: "Company pays us in scrip, only good at company store. Store prices are triple town prices. Most workers are in debt to the store. It\'s not called slavery anymore, but..." He trails off, counts out your copra in weighted silence.', value: 80 },
                    { chance: 0.35, result: 'knowledge', message: 'Over the transaction, workers describe how the system works - land sales to foreign companies, traditional practices made illegal, wage labor replacing subsistence. "My grandfather fished and gardened. Fed everyone. Now I crack coconuts for coins that buy less food than he grew. They call this progress."', value: 'Plantation economy transformation' },
                    { chance: 0.15, result: 'item', message: 'The overseer trades you quality copra for useful goods - metal tools, cloth, things harder to get at the company store. He\'s working angles within the system. "We all do what we must," he says.', value: 'COPRA' }
                ]
            }
        ]
    },
    {
        id: 'industrial_survey_team_indian',
        era: HistoricalEra.INDUSTRIAL_ERA,
        culturalZones: ['SOUTH_ASIAN'],
        prompt: "An Indian archaeological survey team works methodically through the ruins. All local scholars - no Europeans visible. Their equipment is old but impeccably maintained. The leader, a man in his fifties with ink-stained fingers, measures wall thicknesses while dictating notes to an assistant. Another man photographs with a large plate camera. They work with quiet efficiency, racing against something. You notice railway construction visible in the valley below.",
        choices: [
            {
                text: "Offer to assist with the survey",
                outcomes: [
                    { chance: 0.55, result: 'knowledge', message: '"You know stratigraphy?" the leader asks. When you nod, he hands you a measuring tape. "Then help." You spend the day working together. They discuss interpretations in Hindi and English, debate dating methods, share theories. One man explains: "We\'re documenting everything before the railway comes through. A maharaja in Mysore funds us - he wants records of what we lose."', value: 'Indian archaeological methodology' },
                    { chance: 0.30, result: 'gold_gain', message: 'They hire you as a daily assistant. The pay is modest but fair. The work is meticulous - every measurement triple-checked, every photograph carefully composed. "British archaeologists rush and destroy context," the leader says. "We don\'t have that luxury. This documentation is all that will remain."', value: 75 },
                    { chance: 0.15, result: 'nothing', message: 'They\'re polite but decline. "We have our system. But thank you." They continue their precise work. You watch them measure the same wall three times to ensure accuracy.' }
                ]
            },
            {
                text: "Ask about their work's purpose and funding",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'The leader shows you their published volumes - beautiful lithographs, detailed site plans, translations of inscriptions. "The British document what they take to museums. We document what stays here, what gets destroyed. Different goals." He explains the network of Indian scholars working on similar projects across the subcontinent.', value: 'Indigenous archaeology networks' },
                    { chance: 0.35, result: 'knowledge', message: '"The maharaja sees what\'s coming," one surveyor explains during lunch. "Railways, factories, cotton mills. Progress, they call it. Destruction, he calls it. So he pays us to remember what was here before." The man laughs without humor. "Ironic. He builds factories too. But at least he funds this."', value: 'Patronage in cultural preservation' },
                    { chance: 0.15, result: 'item', message: 'The leader gives you a copy of their previous survey report - professionally printed, detailed illustrations. "From last year. Same railway route, different site. We\'ll publish this one too, eventually. Help yourself to a copy."', value: 'SURVEY_REPORT' }
                ]
            },
            {
                text: "Share your own findings and observations",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'They listen intently, then one man corrects your interpretation politely. "The inscription dates to Gupta period, not Mauryan. See the letter forms?" He shows you reference materials. You\'ve been getting it wrong for months. They teach you proper paleography. Indian scholarship is more advanced than you realized.', value: 'Epigraphy and Indian chronology' },
                    { chance: 0.35, result: 'knowledge', message: 'Productive exchange. You point out architectural details they hadn\'t noticed. They explain historical context you missed. The leader nods approvingly: "Good. Archaeology works better when people actually talk to each other instead of competing." He glances toward the valley. "Too bad the railway doesn\'t ask anyone."', value: 'Collaborative archaeology benefits' },
                    { chance: 0.20, result: 'nothing', message: 'They listen politely but have their own interpretations. "Interesting theory. We see it differently." They return to their work. You notice they don\'t incorporate your suggestions.' }
                ]
            }
        ]
    },
    {
        id: 'industrial_rubber_tapper',
        era: HistoricalEra.INDUSTRIAL_ERA,
        culturalZones: ['SOUTH_AMERICAN'],
        prompt: "A man hides in the ruins' deepest chamber. His hands are scarred - burns from latex, cuts from trees. Rubber tapper. He's been here three days based on the food waste. A machete and collection pails sit within reach. When he sees you, his hand moves toward the machete, then stops. 'You're not company,' he says, more observation than question. Dark circles under his eyes. He hasn't slept much.",
        choices: [
            {
                text: "Offer food and water, ask what happened",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'He eats while talking. "They advance you supplies against your rubber quota. The debt never decreases. You work five years, you owe more than when you started. The arithmetic works for them, not you." He shows you his scarred hands. "I tried to leave. They sent men. I ran. Been hiding three days. Tomorrow I\'ll move deeper into forest, try to reach Brazil. Maybe start over."', value: 'Rubber debt slavery mechanics' },
                    { chance: 0.35, result: 'nothing', message: 'He eats your food quickly, mechanically. Doesn\'t talk much. At dawn he\'s gone. The machete and pails too. You notice his tracks head northwest, away from the river, away from the rubber routes.' },
                    { chance: 0.20, result: 'injury', message: 'He flinches when you reach for your pack, thinking you\'re drawing a weapon. The machete is in his hand before you can explain. He catches himself, stops the swing, but the blade grazes your arm. "Sorry," he says, breathing hard. "Sorry. I thought... they send scouts sometimes." The cut isn\'t deep but it bleeds freely.', value: 14 }
                ]
            },
            {
                text: "Suggest you can guide him to the next town",
                outcomes: [
                    { chance: 0.35, result: 'knowledge', message: '"To do what? The company owns the towns. The magistrates work for them. The police too." He explains the whole system - company stores, company law, company violence. "If I show up in a town, I\'m company property. They\'ll drag me back or beat me for example. Better I disappear." He knows the forest, knows where to go. He doesn\'t need a town.', value: 'Company town control mechanisms' },
                    { chance: 0.30, result: 'death', message: 'He agrees. You travel together for two days. You don\'t see the company hunters until too late. They know the forest better than you do. He was right - company property doesn\'t run away. You were with him. That makes you complicit. They don\'t ask questions.' },
                    { chance: 0.35, result: 'item', message: '"You want to help?" He pulls out a small leather pouch. "Copaiba oil. Good medicine. Tappers know forest plants the company men don\'t. Take it. I got no use for it now. Going where I don\'t need possessions." He leaves everything except his machete and one pail.', value: 'MEDICINAL_OIL' }
                ]
            },
            {
                text: "Leave him alone - this isn't your problem",
                outcomes: [
                    { chance: 0.50, result: 'nothing', message: 'He nods. "Smart. You don\'t want company trouble. They remember faces." You back away slowly. When you return the next day, he\'s gone. No trace. The ruins are empty again.' },
                    { chance: 0.30, result: 'knowledge', message: 'As you leave, he speaks: "You documenting these ruins? Then document this too - how they turn forests into rubber, rubber into money, people into debts. Write that down. Someone should know." He\'s gone by morning, but his words stay.', value: 'Extractive economics testimony' },
                    { chance: 0.20, result: 'gold_loss', message: 'You turn to leave. His voice: "Wait. You got money? Food? Anything?" The desperation is clear. You give him what you can spare. It\'s not much. He takes it without thanks, just necessity. You understand.', value: 60 }
                ]
            }
        ]
    },
    {
        id: 'industrial_petroleum_survey',
        era: HistoricalEra.INDUSTRIAL_ERA,
        culturalZones: ['MENA'],
        prompt: "Petroleum exploration camp sprawls across the ruins. European geologists and local workers share the space. Soil samples dry on old walls. Survey maps cover a makeshift table - someone's using a column as a desk. The chief geologist, Scottish by his accent, compares core samples to geological charts. Workers cook rice over an open fire. The smell of petroleum and kerosene mixes with woodsmoke.",
        choices: [
            {
                text: "Ask the geologist about the petroleum survey",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: '"Looking for anticlines," he explains, showing you maps of subsurface structure. "Oil pools in specific formations. We\'re testing across two hundred square miles." He\'s methodical, scientific. Points to the ruins on his survey map - marked as a reference point. "Your old walls make good landmarks. Easier than desert navigation."', value: 'Petroleum geology basics' },
                    { chance: 0.30, result: 'gold_gain', message: '"You know this region?" He unfolds a larger map. "I need someone who can guide us to these coordinates." He points to several locations. "Company pays well for accurate guides. We have three months to survey before the heat becomes unbearable." The money is substantial.', value: 120 },
                    { chance: 0.20, result: 'nothing', message: 'He\'s too busy checking test results. "Later," he says without looking up. His assistant shrugs apologetically. They\'re on a schedule, several sites per day. No time for chatting.' }
                ]
            },
            {
                text: "Talk to the local workers about the area",
                outcomes: [
                    { chance: 0.55, result: 'knowledge', message: 'The workers know these ruins well. "There\'s a whole city here, buried," one man explains. "My grandfather found coins, pottery, tools. The geologists don\'t care. They drill through everything looking for oil." Another adds: "But they pay good money. My village needs water pumps. The well is dry. This work buys pumps."', value: 'Local site knowledge and economics' },
                    { chance: 0.30, result: 'item', message: 'During digging, a worker found an old oil lamp - ceramic, intact. He offers to sell it. "The geologist said it\'s junk. But you collect old things, yes?" Fair price for a nice piece.', value: 'OIL_LAMP' },
                    { chance: 0.15, result: 'nothing', message: 'They\'re tired. Digging core samples in this heat is brutal work. They eat quickly, rest in the shade. The foreman calls them back to work after twenty minutes.' }
                ]
            },
            {
                text: "Document the site before petroleum work destroys it",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'You photograph and sketch quickly. The geologist notices. "Mind if we copy those? Company likes documentation - legal protection if locals complain about damage. We\'ll cite you as archaeological consultant." Strange irony - your preservation attempt becomes their legal cover. But it does create a record.', value: 'Site documentation for petroleum company archives' },
                    { chance: 0.30, result: 'nothing', message: 'You create detailed records. They find no oil here. The camp moves on within a week. The ruins survive this time. Somewhere else on their survey route, other sites won\'t be as lucky.' },
                    { chance: 0.25, result: 'knowledge', message: 'The geologist is actually interested. "I studied classics at Edinburgh before geology. These structures... fifth century?" You discuss the site\'s history. He\'s knowledgeable, genuinely curious. "Shame about the oil work. But petroleum pays better than archaeology." He shares observations from other sites he\'s surveyed.', value: 'Petroleum geologist\'s archaeological observations' }
                ]
            }
        ]
    },

    // RENAISSANCE EVENTS - EAST_ASIAN
    {
        id: 'renaissance_porcelain_collectors',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['EAST_ASIAN'],
        yearMin: 1400,
        yearMax: 1800,
        prompt: "Two men crouch in the ruins, picking through broken pottery. They work systematically, sorting shards into baskets by color and glaze quality. 'This blue - good,' one says, holding a piece to the light. 'Merchant in Jingdezhen will pay.' His companion finds a larger fragment with a dragon motif. 'Ten years ago these were everywhere. Now the kilns want them to copy old designs. Too expensive to keep master potters.' They notice you watching. 'You collecting too? We got here first.'",
        choices: [
            {
                text: "Ask about the porcelain trade and what they're looking for",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'The older collector warms to the topic. "The merchant kilns pay us to find good examples - they make copies for export. Portuguese ships, they say. Each piece we bring, they study the glaze formula, firing temperature. Sometimes they get it close." He shows you his best finds. "This color? Nobody knows how to make it anymore. So they copy from ruins."', value: 'Porcelain reproduction industry' },
                    { chance: 0.35, result: 'item', message: 'They offer to share their finds if you help dig. You spend the afternoon searching together. At day\'s end, they give you several nice blue-and-white fragments. "You work hard. Fair share." The pieces are good quality, Ming dynasty probably.', value: 'PORCELAIN_SHARDS' },
                    { chance: 0.15, result: 'nothing', message: 'They\'re polite but brief. This is their livelihood, not a conversation. They return to methodical sorting. You watch them fill three baskets by sundown.' }
                ]
            },
            {
                text: "Offer to buy some of their better pieces",
                outcomes: [
                    { chance: 0.45, result: 'gold_loss', message: 'They sell you premium fragments - celadon glaze, cobalt blue dragons, iron-red patterns. "These are worth more at the kilns but the money today is money today." You overpay slightly but get excellent specimens. They pocket the coins, already planning tomorrow\'s search route.', value: 120 },
                    { chance: 0.35, result: 'knowledge', message: 'During the transaction, they explain which kilns produce which styles, which merchants pay best, which ruins yield quality shards. "The old palace sites are picked clean now. We travel farther each month. This place? Maybe three more days of good finds." A mental map of the porcelain economy emerges.', value: 'Regional ceramic production networks' },
                    { chance: 0.20, result: 'item', message: 'They won\'t sell their best pieces but offer you the broken stems of wine cups - less valuable to kilns but interesting to collectors. "You seem like you appreciate old things. Take these." Fair price for nice items.', value: 'CERAMIC_STEMS' }
                ]
            },
            {
                text: "Warn them they're damaging an archaeological site",
                outcomes: [
                    { chance: 0.40, result: 'nothing', message: 'The younger man looks at you flatly. "My family needs to eat. These fragments feed us. You want to preserve history?" He gestures at the ruins. "Tell the merchant kilns to stop paying. Tell the Portuguese to stop buying. Tell my children they can eat preservation." He returns to sorting.' },
                    { chance: 0.35, result: 'knowledge', message: 'The older collector pauses. "You think we don\'t know? My grandfather maintained this temple. But it fell. Nobody pays to preserve it. Everybody pays for fragments. Which future do my grandchildren have - poverty with principles or food with pragmatism?" He\'s genuinely asking.', value: 'Economic pressure on heritage' },
                    { chance: 0.25, result: 'injury', message: 'You step on an unstable section while demonstrating how they\'re destabilizing walls. The rubble shifts. You fall hard, a sharp shard slicing your leg. They help bandage it but say nothing. The point is made.', value: 14 }
                ]
            }
        ]
    },
    {
        id: 'renaissance_pilgrimage_stop',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['EAST_ASIAN'],
        yearMin: 1400,
        yearMax: 1800,
        prompt: "Buddhist pilgrims rest in the ruins' shade - five people, different ages, wearing travel-stained robes. An old woman brews tea over a small fire while a younger man checks his feet for blisters. 'This used to be a proper rest house,' the woman says to you. 'My mother stopped here on her pilgrimage forty years ago. The monks fed travelers, offered shelter. All gone now.' Another pilgrim adds: 'But we still stop here. Tradition.' They pour you tea without asking.",
        choices: [
            {
                text: "Share food and ask about their pilgrimage route",
                outcomes: [
                    { chance: 0.55, result: 'knowledge', message: 'They describe the circuit - twenty-three sacred sites, three months walking. "Fewer people do it now," the old woman says. "Young people take boats, visit just the famous temples. We walk the old route." They explain which sites survive, which are ruins, which became something else. The pilgrimage persists even as infrastructure crumbles.', value: 'Buddhist pilgrimage route continuity' },
                    { chance: 0.30, result: 'item', message: 'The young man gifts you a wooden prayer token. "We carve these at each stop. Take this from here - maybe you\'ll carry it to the next site?" It\'s simple but well-made, worn smooth by handling.', value: 'PRAYER_TOKEN' },
                    { chance: 0.15, result: 'gold_gain', message: 'They hire you as a guide to the next temple. "We\'re lost. The landmarks our teachers described aren\'t here anymore." You know the region. Three days\' work, modest pay, pleasant company.', value: 90 }
                ]
            },
            {
                text: "Ask about the ruins' history as a rest house",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'The old woman remembers stories. "There were six monks here. They grew vegetables, kept a guesthouse, maintained a small library. When the emperor changed policies..." She shrugs. "The monks scattered. Some went home to families, some to other temples. The building fell into disrepair. But pilgrims still come. We keep the tradition even when the temple is gone."', value: 'Temple dissolution and persistence' },
                    { chance: 0.35, result: 'knowledge', message: 'A middle-aged pilgrim shows you his route book - hand-copied descriptions of each stop, passed down from his teacher\'s teacher. "The entry for this place is sixty years old. \'Well-maintained rest house, monks serve vegetable soup.\'" He looks at the ruins. "Things change. We adjust. We still rest here."', value: 'Pilgrimage documentation practices' },
                    { chance: 0.15, result: 'nothing', message: 'They don\'t know much history. "It\'s a rest stop. Always has been for pilgrims. That\'s enough." They finish their tea and continue walking.' }
                ]
            },
            {
                text: "Offer to help clean the traditional resting area",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'Together you clear debris from the flattest section, stack stones to improve the windbreak. The pilgrims work with practiced efficiency - they\'ve done this at other deteriorating sites. "We try to leave each stop better than we found it," the young man explains. "Small repairs. We\'re not builders but we can sweep, stack rocks, clear paths."', value: 'Pilgrim-maintained sacred sites' },
                    { chance: 0.35, result: 'nothing', message: 'You work for an hour. It helps, but the place needs real restoration. The pilgrims appreciate the effort, bow in thanks, and move on. Next year\'s pilgrims will find it slightly better than it was.' },
                    { chance: 0.15, result: 'item', message: 'While clearing, you find a small bronze bell buried in debris. The pilgrims insist you keep it. "You helped maintain this place. The bell found you for a reason." Simple folk Buddhism, genuine gratitude.', value: 'BRONZE_BELL' }
                ]
            }
        ]
    },
    {
        id: 'renaissance_confucian_scholars',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['EAST_ASIAN'],
        yearMin: 1400,
        yearMax: 1800,
        prompt: "Three scholars work at the ruins' inscribed walls. One holds paper against stone while another rubs it with ink - making rubbings of carved characters. The third sits cross-legged with a book, comparing the inscriptions to reference texts. They debate in scholarly Chinese - something about dating and attribution. 'Ming calligraphy style,' one insists. 'No, look at the radical - Song dynasty,' counters another. The third marks his notes thoughtfully. They're so absorbed they barely notice you.",
        choices: [
            {
                text: "Ask about their research and offer assistance",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'The eldest scholar looks up. "You read classical Chinese?" When you demonstrate competence, they become animated. You spend hours discussing the inscriptions - imperial edicts, memorial texts, dedication stones. They teach you epigraphic analysis, how calligraphic style indicates period. "This skill is dying," one admits. "Young scholars prefer printed books to stone rubbings. But stones don\'t burn like libraries do."', value: 'Classical Chinese epigraphy methods' },
                    { chance: 0.35, result: 'item', message: 'They give you a rubbing they made earlier. "We have three copies of this inscription. Take one. More people should study these texts - they\'re part of our heritage." The rubbing is excellent quality, clear characters, properly mounted.', value: 'STONE_RUBBING' },
                    { chance: 0.15, result: 'nothing', message: 'They\'re polite but don\'t need help. Their system works - one makes rubbings, one researches parallels, one records conclusions. You watch their methodical scholarship for a while, then leave them to it.' }
                ]
            },
            {
                text: "Listen to their scholarly debate",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'The debate is fascinating - they cite historical sources, compare grammatical constructions, analyze political contexts. One scholar argues the inscription commemorates a local official\'s achievement. Another contends it\'s later forgery meant to inflate family prestige. The third suggests compromise: "Real event, exaggerated account, carved by descendants." They cite precedents for each theory. This is how knowledge is refined.', value: 'Scholarly methodology and debate' },
                    { chance: 0.35, result: 'knowledge', message: 'During a pause, the youngest scholar explains: "We\'re compiling a regional epigraphy - every inscription within fifty miles, transcribed and analyzed. The magistrate funds us. He believes preserving local history improves governance." They\'ve documented forty sites so far. The work is meticulous, unglamorous, essential.', value: 'Regional historical documentation projects' },
                    { chance: 0.20, result: 'gold_gain', message: 'Impressed by your knowledge, they hire you to assist their survey. "We need someone who can climb - many inscriptions are high on walls. We\'re too old for that." Weeks of work, steady pay, academic company.', value: 110 }
                ]
            },
            {
                text: "Share your own observations about the ruins",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'They listen respectfully, then one scholar corrects your interpretation. "This character - you read it as \'virtue\' but in Song dynasty usage it means \'administrative district.\' Changes the entire meaning." He shows you reference texts. You\'ve been wrong for months. They teach you proper periodization and contextual reading. Humbling but educational.', value: 'Historical linguistics and context' },
                    { chance: 0.35, result: 'knowledge', message: 'Your architectural observations interest them. "We focus on texts, neglect buildings. But you\'re right - this construction style dates differently than the inscriptions. Perhaps the stones were moved here from an earlier site?" Interdisciplinary collaboration emerges spontaneously.', value: 'Combining textual and material evidence' },
                    { chance: 0.15, result: 'nothing', message: 'They nod politely but clearly consider your observations amateur. You\'re not wrong, but you lack their depth of expertise. They return to their work.' }
                ]
            }
        ]
    },
    {
        id: 'renaissance_tea_merchant_camp',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['EAST_ASIAN'],
        yearMin: 1400,
        yearMax: 1800,
        prompt: "A tea caravan camps in the ruins - twenty mules, heavy baskets wrapped in oiled cloth, six armed guards, one merchant. The merchant sits at a makeshift desk - account books, abacus, scales - calculating transport costs and profit margins. Guards cook rice over fires while mule drivers check hooves and adjust loads. The merchant looks up as you approach. 'This your land? We paid the headman in the last village. We camp here tonight, gone by morning.'",
        choices: [
            {
                text: "Ask about the tea trade and their route",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'The merchant relaxes when he realizes you\'re not demanding payment. "We carry compressed tea to the border - Mongol traders there, some Russians now. Six weeks each way if the weather holds." He explains grading, pricing, the markup chain from farmers to foreign buyers. "The farmers get almost nothing. The border traders pay premium. I\'m the middle. Everyone resents the middle." He seems tired.', value: 'Overland tea trade economics' },
                    { chance: 0.35, result: 'gold_gain', message: '"You know this region?" He unfolds a route map. "We need a guide through the next province. Bandits are active, and my usual contact died." He offers good money for five days\' work. The guards are competent. It\'s probably safe.', value: 150 },
                    { chance: 0.15, result: 'item', message: 'The merchant trades you a brick of compressed tea - good quality, the kind he reserves for bribing officials. "You seem knowledgeable. This is worth more than you\'d think at the border. Use it or sell it." Generous gesture.', value: 'TEA_BRICK' }
                ]
            },
            {
                text: "Offer to sell them supplies or information",
                outcomes: [
                    { chance: 0.45, result: 'gold_loss', message: 'They need fresh food. You trade them vegetables and grain. Fair prices, cash payment. The merchant marks it in his accounts meticulously. "Good quality. We\'ll look for you on the return journey." Steady business relationship established.', value: 80 },
                    { chance: 0.35, result: 'knowledge', message: 'You warn them about a washed-out bridge ahead. The merchant checks his maps, recalculates the route. "This saves us two days and a dangerous river crossing. Thank you." He shares information in return - which villages are friendly to caravans, which officials demand bribes, which roads are safe.', value: 'Regional trade route intelligence' },
                    { chance: 0.20, result: 'nothing', message: 'They\'re well-supplied and have their own intelligence network. Polite but they don\'t need what you\'re offering. "Appreciate the thought. We manage."' }
                ]
            },
            {
                text: "Ask about the guards and security concerns",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'One guard answers while oiling his crossbow. "Tea is valuable, light, easy to carry. Perfect for bandits. We\'ve fought twice this season." He describes the security calculus - which regions hire local escorts, which avoid through bribes, where they travel in larger convoys. "The merchant pays us well but we earn it. Last month a caravan lost everything ten miles from here."', value: 'Caravan security practices' },
                    { chance: 0.30, result: 'gold_gain', message: 'The merchant asks if you can shoot. "We need one more guard - someone quit in the last town, said the route\'s too dangerous. If you can handle a crossbow, I\'ll pay for the next leg." Risky work, decent pay.', value: 130 },
                    { chance: 0.20, result: 'injury', message: 'While examining a guard\'s crossbow, it discharges accidentally. The bolt grazes your arm - not serious but painful. The guard is mortified, treats the wound immediately. "I thought it was unloaded. I\'m sorry." Everyone is shaken.', value: 11 }
                ]
            }
        ]
    },

    // RENAISSANCE EVENTS - SUB_SAHARAN_AFRICAN
    {
        id: 'renaissance_swahili_sailors',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['SUB_SAHARAN_AFRICAN'],
        yearMin: 1400,
        yearMax: 1700,
        prompt: "Sailors from a dhow camp at the ruins, waiting for the monsoon winds to shift. They've hauled goods up from the beach - cloth bales, porcelain jars, glass bead necklaces. The nakhoda - captain - sits with his charts, plotting the next leg to Kilwa or Mogadishu. His crew plays bao under an awning, the click of seeds in wooden boards mixing with Arabic conversation and Swahili. One sailor mends a sail, another writes in a ledger. They're professional, organized, and stranded until the wind changes.",
        choices: [
            {
                text: "Ask about their trade goods and destinations",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'The nakhoda spreads his manifest. "Chinese porcelain from Mombasa, headed to Mogadishu. Then cloth from Gujarat to Kilwa. Then ivory and gold back to Calicut." He traces the circuit on his chart - monsoon patterns dictate everything. "We sail with the wind, trade while it shifts, sail back when it reverses. Two trips per year if lucky, one if not." The Indian Ocean network mapped through weather.', value: 'Monsoon-driven Indian Ocean trade' },
                    { chance: 0.35, result: 'item', message: 'A sailor shows you glass beads - Venetian manufacture, traded through multiple ports. "We buy these in Kilwa, sell them north. Or sometimes south. Depends on the market." He offers to trade you a strand for something useful. Pretty work, valuable currency in the interior.', value: 'GLASS_BEADS' },
                    { chance: 0.15, result: 'gold_gain', message: 'The nakhoda needs information about interior trade routes. "We deal with coastal merchants who go inland. You know the paths? The chiefs? The goods they want?" Your knowledge is valuable. He pays for a detailed briefing.', value: 100 }
                ]
            },
            {
                text: "Offer fresh water and local food",
                outcomes: [
                    { chance: 0.55, result: 'gold_loss', message: 'They buy everything you bring - fruit, grain, fresh meat. Ship rations are monotonous. They pay well. "In two days the wind shifts. We need to stock provisions. Bring more tomorrow if you have it." Profitable trading opportunity.', value: 90 },
                    { chance: 0.30, result: 'knowledge', message: 'Over the meal, they talk about sailing - reading stars, watching currents, understanding seasonal patterns. "My father taught me, his father taught him. Same routes for ten generations." One sailor mentions shipwrecks: "Every third voyage, you hear of someone who didn\'t make it. The sea is beautiful and it kills."', value: 'Traditional navigation and risk' },
                    { chance: 0.15, result: 'item', message: 'In thanks for the food, the nakhoda gifts you a small brass compass - not European style but Arab design, well-made. "I have two. Take this one. May it guide you on land as it guided us on water."', value: 'BRASS_COMPASS' }
                ]
            },
            {
                text: "Ask about the ruins and whether they know its history",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'An old sailor speaks up. "My grandfather said this was a customs house, three generations back. The sultan collected taxes here before Kilwa declined. Then Portuguese came, then the sultan moved north, then..." He shrugs. "Now it\'s where sailors wait for wind. Buildings rise and fall. Trade continues." Oral maritime history.', value: 'Swahili coast political shifts' },
                    { chance: 0.35, result: 'knowledge', message: 'The nakhoda knows the ruins from navigation. "We use it as a landmark - \'the old walls north of the inlet.\' Useful for piloting. I marked it on my father\'s chart, he marked it on his. Whether it was important once... maybe. It\'s a landmark now."', value: 'Navigation landmarks and memory' },
                    { chance: 0.20, result: 'nothing', message: 'They don\'t know and don\'t particularly care. "We trade, we sail. Buildings onshore are for shore people." Fair enough.' }
                ]
            }
        ]
    },
    {
        id: 'renaissance_kongo_christians',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['SUB_SAHARAN_AFRICAN'],
        yearMin: 1500,
        yearMax: 1700,
        prompt: "A Kongo family performs rituals at the ruins - Christian prayers mixed with ancestral offerings. The father holds a wooden crucifix while the mother places food at the base of a wall carved with older symbols. Their children watch, learning both traditions simultaneously. When they notice you, the father speaks: 'This is where my grandfather's grandfather is buried. We pray to God and we honor ancestors. The Portuguese priest says we must choose. But why? Both are real.'",
        choices: [
            {
                text: "Ask how they balance the two belief systems",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'The mother explains: "God created everything, including our ancestors. To honor ancestors is to honor God\'s creation. The priests don\'t understand but we do." Their children recite Pater Noster in Latin, then sing ancestral names in Kikongo. Both lists are long, both carefully memorized. Syncretism as lived practice, not theological problem.', value: 'Kongo Christian-ancestral synthesis' },
                    { chance: 0.35, result: 'knowledge', message: 'The father talks about the king\'s conversion. "The Manikongo is Christian, the court is Christian, we are Christian. But we are also Kongo. Our ancestors matter. The land matters. God understands this even if Portuguese don\'t." He shows you a brass crucifix with Kongo design elements - local metalwork, Christian symbol.', value: 'Kongo Christianity as cultural adaptation' },
                    { chance: 0.15, result: 'item', message: 'They gift you a small wooden cross, carved in Kongo style. "Our cousin makes these. Christian and Kongo together. Take it. Remember that faith can have many faces."', value: 'KONGO_CROSS' }
                ]
            },
            {
                text: "Observe their ritual without interfering",
                outcomes: [
                    { chance: 0.55, result: 'knowledge', message: 'You watch quietly. They pray in Latin, then in Kikongo. They place Christian rosaries alongside traditional offerings. They sing hymns taught by priests, then songs their grandmother taught. Everything flows together naturally - no contradiction in their practice, only in outside observers\' expectations. The children participate easily in both traditions.', value: 'Ritual syncretism in practice' },
                    { chance: 0.30, result: 'nothing', message: 'The ceremony is beautiful but unfamiliar. You don\'t fully understand the integration. They finish, gather their things, nod politely, and leave. You\'re left with more questions than answers.' },
                    { chance: 0.15, result: 'knowledge', message: 'After the ritual, the father approaches. "You watched respectfully. Most foreigners either condemn us as pagans or condemn us as bad Christians. You just watched. Thank you." He explains some of what you witnessed - which elements are Christian, which ancestral, which uniquely Kongo.', value: 'Kongo ritual explanation' }
                ]
            },
            {
                text: "Share your own religious perspective",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'They listen with interest. The mother responds: "Different paths to understanding the sacred. God is bigger than we know. Ancestors teach us this too - wisdom comes from many sources." The conversation becomes mutual exchange of perspectives. No one tries to convert anyone. Just honest discussion.', value: 'Interfaith dialogue in Kongo context' },
                    { chance: 0.35, result: 'nothing', message: 'The father nods politely but doesn\'t engage deeply. "Each person has their own relationship with God and ancestors. Your path is yours. Ours is ours." Respectful boundaries.' },
                    { chance: 0.20, result: 'knowledge', message: 'One child asks you direct questions about your beliefs. The parents translate, engage seriously with your answers. It becomes a teaching moment for the children - that different people understand the divine differently, and that\'s acceptable. You leave thinking about your own assumptions.', value: 'Religious plurality teaching' }
                ]
            }
        ]
    },
    {
        id: 'renaissance_songhai_traders',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['SUB_SAHARAN_AFRICAN'],
        yearMin: 1400,
        yearMax: 1600,
        prompt: "Trans-Saharan traders rest their camels at the ruins - seventeen animals, loaded with salt bars and leather goods. Two traders in desert-stained robes check the loads while a third consults written accounts. 'Three more days to Timbuktu,' one says. 'If the salt prices hold, we profit. If they've dropped...' He makes a cutting gesture. They've been traveling for thirty days from the northern salt mines. The camels are tired. So are the men.",
        choices: [
            {
                text: "Ask about the trans-Saharan trade routes",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'The lead trader unfolds mental maps. "Taghaza to Timbuktu - salt for gold. Standard route but dangerous. Water sources matter more than distance. We lost a man two weeks ago - heat, dehydration. Buried him at a known grave site. Others are buried there too." He explains the economics: salt mined in the north, worth its weight in gold in the south. Simple arbitrage across deadly geography.', value: 'Trans-Saharan trade mechanics and dangers' },
                    { chance: 0.35, result: 'gold_gain', message: '"You know Timbuktu market conditions? Current salt prices?" When you share information, he recalculates mentally. "That changes things. We might push to Gao instead - better prices there now." He pays you for the intelligence. "Good information is worth gold."', value: 120 },
                    { chance: 0.15, result: 'knowledge', message: 'A younger trader shows you his route journal - distances between wells, friendly settlements, dangerous stretches. "My father kept this, his father before him. Each generation adds notes. The desert changes - wells dry up, new ones appear, shifting dunes alter paths. We adapt." Centuries of accumulated knowledge in worn pages.', value: 'Generational desert route knowledge' }
                ]
            },
            {
                text: "Offer to sell them supplies for the final leg",
                outcomes: [
                    { chance: 0.45, result: 'gold_loss', message: 'They buy fresh food eagerly - dried meat, grain, dates. "We\'re sick of caravan rations. This is luxury." They pay premium for quality. "In Timbuktu we\'ll eat well, but three more days of bad food is three more days too many." They appreciate the boost to morale.', value: 95 },
                    { chance: 0.35, result: 'knowledge', message: 'While trading, they explain the supply calculus of desert crossings - what to carry, what to leave, where to resupply. "Too much weight slows camels. Too little means starvation. We calculate carefully." Every ounce matters when water sources are five days apart.', value: 'Desert caravan logistics' },
                    { chance: 0.20, result: 'item', message: 'They trade you a small leather pouch of rock salt from Taghaza. "Purest salt in the world. Worth more than you\'d think in the right market. Take it as thanks." Useful trade good or luxury seasoning.', value: 'ROCK_SALT' }
                ]
            },
            {
                text: "Ask about Songhai and news from Timbuktu",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'The traders share news from their last trip. "The Askia\'s court is magnificent - scholars from everywhere, libraries full of books, trade from Mali to Cairo. Timbuktu is wealthy now. More than my grandfather ever described." But there\'s caution too: "Wealth attracts attention. Moroccans eye it. Nothing lasts forever."', value: 'Songhai Empire at its height' },
                    { chance: 0.30, result: 'knowledge', message: 'One trader describes the city\'s manuscript trade. "Scholars buy and sell books like we trade salt. Philosophy, law, astronomy, poetry. More valuable than gold to them. Different kind of wealth." He finds it amusing and admirable. "My brother became a scribe. Makes more than I do, sleeps in a bed every night, never crosses the desert. Smart man."', value: 'Timbuktu intellectual economy' },
                    { chance: 0.20, result: 'nothing', message: 'They\'re too tired for extended conversation. "Ask in Timbuktu. We just want to finish this journey, get paid, rest before the return trip." Understandable exhaustion.' }
                ]
            }
        ]
    },

    // RENAISSANCE EVENTS - OCEANIA
    {
        id: 'renaissance_navigation_teaching',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['OCEANIA'],
        yearMin: 1500,
        yearMax: 1800,
        prompt: "An old navigator teaches two young people using the ruins' flat stones. He's arranged pebbles to represent islands, shells for currents, sticks for star paths. 'This cluster - that's home islands. This single stone - where we're going. Five days sail, south-southeast, following these stars.' He moves the shells to show seasonal current changes. The students memorize patterns, ask questions, rearrange stones to test understanding. Traditional wayfinding knowledge being passed down.",
        choices: [
            {
                text: "Ask if you can observe the lesson",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'The navigator nods permission. You watch him teach swells and wave patterns, star courses, bird flight indicators, water color changes. "No charts, no compass. Your mind is the chart. The ocean tells you where you are if you know how to listen." The students practice reading the stone-and-shell map until they can recite courses from memory.', value: 'Traditional Pacific navigation methods' },
                    { chance: 0.35, result: 'knowledge', message: 'During a break, the navigator explains why he uses the ruins. "Flat stones, protected from wind, quiet. Good teaching place. My teacher brought me here. I bring my students. The old walls shelter new knowledge - or old knowledge staying alive." He worries: "Fewer learn now. Ships with European captains, compass and charts. Easier. But if those fail..."', value: 'Navigation knowledge transmission concerns' },
                    { chance: 0.15, result: 'item', message: 'The navigator gives you one of his teaching shells - cowrie marked with notches indicating star positions. "For you. Maybe it helps you find your way too. Different ocean, same principles - observe, remember, understand."', value: 'NAVIGATION_SHELL' }
                ]
            },
            {
                text: "Share your own navigation knowledge",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'You explain compass navigation and charts. The students are fascinated. The old navigator listens carefully, then says: "Useful tools. But tools break, get lost. Your knowledge..." He taps his head. "This cannot be lost unless you forget. We teach memory because memory survives." Different epistemologies, mutual respect.', value: 'Comparative navigation systems' },
                    { chance: 0.35, result: 'knowledge', message: 'The navigator tests you. "Find north without tools." You use sun position and shadows. He nods. "Good. Now find it at night. Now during storm. Now when sick and dizzy." Each scenario removes another crutch. His students can navigate under any condition. Impressive depth of expertise.', value: 'Robust navigation training methods' },
                    { chance: 0.20, result: 'nothing', message: 'The students are polite but the navigator redirects to his lesson. "Different waters, different methods. What works for you may not work here. Focus on learning your ocean." Respectful but firm boundary.' }
                ]
            },
            {
                text: "Ask about challenges to keeping this knowledge alive",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'The navigator speaks frankly. "Ships come with European captains, metal tools, maps. Young people see these and think old ways are useless. My teacher trained fifteen navigators. I\'ll train maybe three. Who will they train?" He looks at his students. "I teach them everything I know. Whether they teach the next generation... I don\'t know."', value: 'Traditional knowledge decline pressures' },
                    { chance: 0.35, result: 'knowledge', message: 'One student answers: "I want to learn both ways - traditional and European. The old navigation for our waters, the new tools for reaching distant ports where they trade." The navigator accepts this. "Adapt or disappear. But remember the foundations. Tools fail. Knowledge persists."', value: 'Pragmatic knowledge integration' },
                    { chance: 0.15, result: 'gold_gain', message: 'The navigator asks if you know anyone who would pay to document his knowledge. "European scholars sometimes pay for information. I need money to support teaching - I don\'t fish anymore, just teach. Students\' families help but..." You connect him with someone interested. He\'s paid for his knowledge, allowing him to continue teaching.', value: 85 }
                ]
            }
        ]
    },
    {
        id: 'renaissance_mixed_community',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['OCEANIA'],
        yearMin: 1600,
        yearMax: 1800,
        prompt: "Families live in and around the ruins - mixed Indigenous and trader ancestry. Their houses blend architectural styles: traditional thatched roofs on European-style wooden frames, woven walls next to plank doors. Children play speaking both languages fluently. You hear a woman singing a lullaby that switches between Indigenous words and Portuguese. An older man repairs a fishing net using traditional knots on European-made rope. Cultural hybridization made normal through generations.",
        choices: [
            {
                text: "Ask about their community's origins",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'A middle-aged man explains: "My grandfather was a Portuguese sailor, married my grandmother from the island. His ship left, he stayed. Others came - whalers, traders, deserters. They married local women, built lives. We\'re what happened next." He gestures at the community. "Some people say we\'re not truly one thing or another. We say we\'re both. And we\'re here."', value: 'Mixed cultural communities formation' },
                    { chance: 0.35, result: 'knowledge', message: 'An older woman remembers: "When I was young, some European traders looked down on us. Some Indigenous families did too. Both sides had people who thought mixing was wrong. But we made our own community. Now we trade with both, marry both, speak both languages. Being in-between became being something new."', value: 'Identity formation in mixed communities' },
                    { chance: 0.15, result: 'item', message: 'A craftsman shows you his work - fishhooks that combine Indigenous bone-carving techniques with European metal. "Better than either alone. Indigenous design is perfect for these waters, European metal is stronger than bone. I make the best hooks in the region because I learned from both sides."', value: 'HYBRID_FISHHOOKS' }
                ]
            },
            {
                text: "Ask about their relationship with the ruins",
                outcomes: [
                    { chance: 0.55, result: 'knowledge', message: 'A young woman answers: "My Indigenous ancestors built some of these walls. My European ancestors didn\'t understand them, called them mysterious. I grew up hearing both stories. We use the ruins for shelter, for storage, but we also maintain them. They\'re part of who we are - literally. Both sides of family, both kinds of history."', value: 'Heritage interpretation in mixed identity' },
                    { chance: 0.30, result: 'knowledge', message: 'The community elder explains their approach: "We don\'t treat the ruins as sacred in the old way, but we respect them. Some knowledge was lost - my grandmother\'s grandmother was the last who knew all the traditional meanings. Now we have fragments, guesses, stories from both sides. We piece together what we can."', value: 'Fragmented cultural knowledge retention' },
                    { chance: 0.15, result: 'nothing', message: 'They shrug. "It\'s where we live. Old stones, useful walls, good shelter. The past is past. We focus on today." Pragmatic rather than historical perspective.' }
                ]
            },
            {
                text: "Observe daily life in the community",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'You spend the day watching. Children learn traditional fishing from Indigenous elders, European sailing from retired traders. Meals combine both cuisines - fish prepared in traditional earth ovens, served with European bread. Languages mix mid-sentence. Nobody seems confused. It all just works. Culture as living practice, not museum piece.', value: 'Everyday cultural hybridity' },
                    { chance: 0.30, result: 'gold_loss', message: 'They invite you to share a meal. You offer payment - they accept but serve you generously. The food is excellent, the company warm. Someone plays music that defies categorization - Indigenous rhythms, European melody, entirely local result.', value: 70 },
                    { chance: 0.20, result: 'item', message: 'A weaver gifts you a basket - Indigenous weaving technique, European-introduced fibers, local design innovation. "We make these to sell to traders. Good quality, fair price. But this one - for you, for listening to our stories."', value: 'WOVEN_BASKET' }
                ]
            }
        ]
    },

    // RENAISSANCE EVENTS - NORTH_AMERICAN_COLONIAL
    {
        id: 'renaissance_mission_builders',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['NORTH_AMERICAN_COLONIAL'],
        yearMin: 1600,
        yearMax: 1800,
        prompt: "Franciscan monks direct Indigenous laborers building a mission chapel using stones from the ruins. A friar sketches the design - Spanish colonial style adapted to local materials. Workers haul stones, mix adobe, raise walls. Some workers are converts, others work for payment or under pressure. One older laborer explains to younger ones: 'Set the stones tight - no gaps. My grandfather built these walls we're taking down. Built them to last. We build these the same way.' Mix of pride and resignation in his voice.",
        choices: [
            {
                text: "Ask the friars about their mission and goals",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'The lead friar speaks earnestly. "We bring salvation and civilization. These ruins - pagan structures from before the light of Christ. We transform them into houses of God. The stones remain but the purpose is redeemed." He seems to genuinely believe he\'s helping. "We teach them Spanish, farming, Christianity, useful trades. Better than their old ways." The paternalism is absolute.', value: 'Mission ideology and rationalization' },
                    { chance: 0.30, result: 'knowledge', message: 'A younger friar is more conflicted. "I question sometimes - we destroy their buildings to build ours, forbid their language to teach ours, replace their gods with ours. Father Superior says it\'s God\'s will. Maybe it is. But I see what we take from them." He looks troubled. "I pray about it. I don\'t know if prayer helps."', value: 'Individual missionary doubt' },
                    { chance: 0.20, result: 'gold_loss', message: 'The friars ask for donations to support the mission. "We feed the workers, provide tools, teach literacy. All requires funding." Pressure is subtle but present. You donate to avoid complications.', value: 110 }
                ]
            },
            {
                text: "Talk to the Indigenous workers about the project",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'During a break, workers speak quietly. "Some of us converted, some work for food, some were told our families would suffer if we refused. Different reasons, same result - we build their church from our ancestors\' walls." One adds: "My children go to mission school. They\'re learning Spanish, forgetting our language. The friars say this is good. My wife cries at night."', value: 'Coerced labor and cultural loss' },
                    { chance: 0.35, result: 'knowledge', message: 'An old stone mason explains his technique. "The friars think they\'re teaching us to build. We\'ve built for generations - just different buildings. I teach the young ones our methods while following Spanish designs. The knowledge survives this way, even if the purpose changes." Quiet resistance through craft.', value: 'Craft knowledge preservation under colonization' },
                    { chance: 0.20, result: 'injury', message: 'While talking, a stone being hauled into position slips. You\'re in the way. It catches your foot - painful crushing injury. Workers help you to shade, treat it with traditional medicine they\'re not supposed to use. The irony isn\'t lost on anyone.', value: 16 }
                ]
            },
            {
                text: "Document the ruins before they're fully dismantled",
                outcomes: [
                    { chance: 0.45, result: 'knowledge', message: 'You sketch and measure quickly. The workers notice, offer information. "That wall - ceremonial. This section - residential. Here - storage." They\'re preserving knowledge through you. One worker gives you a broken piece of decorated pottery from the ruins. "The friars throw these away. You keep it. Someone should remember."', value: 'Pre-mission architecture documentation' },
                    { chance: 0.35, result: 'nothing', message: 'The friars object. "We don\'t preserve paganism. If you must document, document our new construction - Christian architecture bringing light to darkness." They watch you suspiciously. You can\'t work freely.' },
                    { chance: 0.20, result: 'knowledge', message: 'Your documentation catches the attention of one friar who studied architecture. "Interesting construction. Sophisticated joinery, precise measurements. Perhaps they weren\'t entirely primitive." Tiny crack in his worldview. Probably won\'t last but it\'s something.', value: 'Challenging colonial assumptions through evidence' }
                ]
            }
        ]
    },
    {
        id: 'renaissance_fur_traders',
        era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
        culturalZones: ['NORTH_AMERICAN_COLONIAL'],
        yearMin: 1600,
        yearMax: 1800,
        prompt: "Two French coureurs de bois camp at the ruins with their Indigenous wife and children. Three canoes are hauled onto shore, loaded with beaver pelts wrapped in oiled canvas. The man checks the pelts while his wife cooks fish over a fire. Their children - mixed heritage, maybe six and eight years old - play in the ruins, switching between French and their mother's language mid-game. 'We rest here every trip north,' the trader says. 'Good shelter, fresh water. The children know this place better than our house in Montreal.'",
        choices: [
            {
                text: "Ask about the fur trade and their operation",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'The trader explains the circuit. "My wife\'s people trap, I transport to Montreal, sell to merchants who ship to France. Everybody profits - trappers get metal tools and cloth, I get pelts, European hatmakers get beaver. Three months collecting, two months transport, one month selling, then back north." His wife adds: "Before traders came, we trapped for ourselves. Now we trap for markets. More work, different life."', value: 'Fur trade networks and impacts' },
                    { chance: 0.35, result: 'gold_gain', message: '"You know the route north? We need to contact new trapping communities - our usual sources are depleted." He offers payment for guiding or introducing him to trappers. The work is legitimate but you\'re facilitating resource extraction.', value: 140 },
                    { chance: 0.15, result: 'item', message: 'He trades you a premium beaver pelt. "This one has a slight flaw - see? Won\'t get full price in Montreal. But for personal use, it\'s excellent. Make a hat, sell it locally, whatever you want." High-quality material.', value: 'BEAVER_PELT' }
                ]
            },
            {
                text: "Talk with his wife about her perspective",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'She speaks frankly. "I married him for love, but also because French traders have power now. My children will speak both languages, know both worlds. Better chances than staying in one community. My family didn\'t approve at first - some still don\'t. But my children eat well, have metal tools, learn to read. It\'s complicated." She stirs the pot thoughtfully.', value: 'Strategic intermarriage in colonial contexts' },
                    { chance: 0.35, result: 'knowledge', message: 'She points at the ruins. "My grandmother said these were built by people who lived here long ago. Not our people - older. They left, or died, or were pushed out. Now we camp here while trading. Everything changes. We try to adapt." She watches her children play. "I teach them our stories, he teaches French. They\'ll make their own way."', value: 'Multigenerational change and adaptation' },
                    { chance: 0.15, result: 'item', message: 'She offers you some of her cooking - fish prepared in traditional style. "We eat like my people when traveling, like French in Montreal. My children like both." The food is excellent. She gifts you some dried herbs: "For cooking or medicine. You helped us by talking - most traders ignore me."', value: 'MEDICINAL_HERBS' }
                ]
            },
            {
                text: "Play with the children and ask about their lives",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'The kids are sharp, confident, navigating multiple worlds easily. The older one: "In Montreal I go to school. They teach French and Latin. Mama teaches me her language at night. Papa teaches me trapping and canoeing." The younger: "I like traveling more than town. More fun." They\'re creating hybrid identities, not trapped between worlds but inhabiting both.', value: 'Mixed-heritage identity formation' },
                    { chance: 0.30, result: 'knowledge', message: 'They show you the ruins with proprietorial pride - secret passages, good climbing spots, where birds nest. "We know this place better than anyone," one boasts. Probably true. They\'re comfortable here in ways that fit neither traditional Indigenous use nor European archaeological interest. Just home.', value: 'Children\'s spatial knowledge and belonging' },
                    { chance: 0.20, result: 'item', message: 'The children give you a toy canoe one of them carved - miniature of their family boats. "Papa taught me." It\'s well-made for a child\'s work. The trader notices, looks proud. "Good hands. They\'ll make fine craftsmen or traders."', value: 'TOY_CANOE' }
                ]
            }
        ]
    },

    // ANTIQUITY EVENTS - OCEANIA
    {
        id: 'antiquity_lapita_potters',
        era: HistoricalEra.ANTIQUITY,
        culturalZones: ['OCEANIA'],
        yearMin: -1500,
        yearMax: -500,
        prompt: "A pottery workshop operates in the ruins' sheltered corner. A grandmother shapes clay while teaching a girl the technique - coil-building, smoothing, forming. Finished pots dry in the sun, each decorated with intricate dentate-stamped patterns - fine geometric designs pressed into wet clay with carved tools. 'Press firmly but not too deep,' the grandmother instructs. 'These patterns - they identify our family, our island, our lineage. Every potter marks their work.' Other family members prepare clay, tend fires, sort finished pieces for trading to other islands.",
        choices: [
            {
                text: "Ask about the pottery-making process and patterns",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'The grandmother shows you each step - clay preparation, temper addition, coil-building technique, pattern stamping. "These designs passed down from my grandmother\'s grandmother. Each family has their patterns. When you see our pottery on another island, you know it came from us." She explains how pottery travels through trade networks - utilitarian vessels carrying identity across ocean distances.', value: 'Lapita pottery production and distribution' },
                    { chance: 0.35, result: 'item', message: 'The girl gives you a small pot she made - not perfect but carefully patterned. "Practice piece. Grandmother says I\'m getting better but not ready to trade these yet. You can have it." The dentate stamping is slightly uneven but shows promise.', value: 'LAPITA_POT' },
                    { chance: 0.15, result: 'knowledge', message: 'The grandmother traces pattern evolution. "My grandmother taught me these triangles and lines. I added this curve. My granddaughter will add her own touches. The patterns stay recognizable but slowly change. Like language - same but different across generations and islands."', value: 'Cultural transmission and innovation' }
                ]
            },
            {
                text: "Offer to help with clay preparation or other tasks",
                outcomes: [
                    { chance: 0.55, result: 'knowledge', message: 'You help gather and process clay - locating the right deposits, removing stones, mixing temper (crushed shell), kneading to proper consistency. "Clay quality matters," one potter explains. "Wrong clay cracks when fired. We know which sources work. This knowledge is valuable - we don\'t share with everyone." Being allowed to help signifies trust.', value: 'Clay sourcing and preparation expertise' },
                    { chance: 0.30, result: 'nothing', message: 'You work hard but pottery-making is skilled labor. Your coils are uneven, your stamping clumsy. They appreciate the effort but gently suggest you focus on clay preparation - less skilled work you can actually help with. Humbling but fair.' },
                    { chance: 0.15, result: 'injury', message: 'While moving a loaded kiln shelf, you slip. Hot pottery tumbles onto your arm - serious burns from freshly-fired vessels. They treat you with aloe and cool water, but you\'re injured and you\'ve destroyed hours of work. Everyone is gracious about the accident but you feel terrible.', value: 17 }
                ]
            },
            {
                text: "Ask about trading pottery to other islands",
                outcomes: [
                    { chance: 0.50, result: 'knowledge', message: 'An uncle explains the trade network. "We make pottery, they grow certain taro varieties we don\'t have. Other islands have obsidian, shell, special woods. We trade for what we need. Every island specializes. The ocean connects us." He describes the navigation routes, trade relationships, gift-giving protocols that maintain inter-island connections.', value: 'Lapita exchange networks' },
                    { chance: 0.35, result: 'knowledge', message: 'The grandmother talks about pottery as communication. "When my pottery reaches a distant island, they know our family still thrives. When we receive pottery from them, we know they\'re well. Trade is economics but also connection. We stay in touch across water through the things we make and share."', value: 'Material culture as social connection' },
                    { chance: 0.15, result: 'gold_gain', message: 'They ask if you\'re traveling to other islands. "Take some of our pottery, trade for goods we need - we\'ll tell you what. Share the profit." Inter-island trading commission. The work is legitimate and builds relationships.', value: 95 }
                ]
            }
        ]
    },

];

// Generic mundane findings - applicable to any ruin in any era
const GENERIC_PERIMETER_FINDINGS = [
    "You make a thorough search and find nothing beyond a nest of mice.",
    "There are some scattered rocks that look like they may have once been a wall.",
    "You find broken pottery shards - too fragmentary to identify the period or culture.",
    "Animal tracks in the dirt - looks like foxes or wild dogs have been using this as a den.",
    "Some weathered stones with faint tool marks. Someone worked here long ago.",
    "You discover a depression in the ground - maybe a collapsed cellar or storage pit, filled with dirt and rubble.",
    "Wild plants growing through the ruins - thorny bushes that make searching difficult.",
    "You find evidence someone camped here recently - cold fire pit, scattered bones from a meal.",
    "The foundation stones are impressive - large, well-fitted blocks. But nothing portable remains.",
    "You spot some carved stonework, but it's too weathered to make out any details.",
    "A lizard darts away as you search. Nothing else of note.",
    "You find ancient mortar between stones - whoever built this knew their craft. Nothing more to find."
];

export const getRandomPerimeterEvent = (era: HistoricalEra, culturalZone?: CulturalZone, year?: number): PerimeterEvent | null => {
    const roll = Math.random();

    // 33% chance: nothing found (with modal)
    if (roll < 0.33) {
        return {
            id: 'nothing_found',
            era: era,
            prompt: "You made a thorough search but found nothing.",
            choices: [{
                text: "Continue exploring",
                outcomes: [{ chance: 1.0, result: 'nothing', message: 'You move on.' }]
            }, {
                text: "Continue exploring",
                outcomes: [{ chance: 1.0, result: 'nothing', message: 'You move on.' }]
            }, {
                text: "Continue exploring",
                outcomes: [{ chance: 1.0, result: 'nothing', message: 'You move on.' }]
            }] as [PerimeterEventChoice, PerimeterEventChoice, PerimeterEventChoice]
        };
    }

    // 33% chance: generic mundane finding (33-66% range)
    if (roll < 0.66) {
        const finding = GENERIC_PERIMETER_FINDINGS[Math.floor(Math.random() * GENERIC_PERIMETER_FINDINGS.length)];
        // Return a simple event structure for generic findings
        return {
            id: 'generic_finding',
            era: era,
            prompt: finding,
            choices: [{
                text: "Continue exploring",
                outcomes: [{ chance: 1.0, result: 'nothing', message: 'You move on.' }]
            }, {
                text: "Continue exploring",
                outcomes: [{ chance: 1.0, result: 'nothing', message: 'You move on.' }]
            }, {
                text: "Continue exploring",
                outcomes: [{ chance: 1.0, result: 'nothing', message: 'You move on.' }]
            }] as [PerimeterEventChoice, PerimeterEventChoice, PerimeterEventChoice]
        };
    }

    // 34% chance: custom event (66-100% range)
    let eraEvents = PERIMETER_EVENTS.filter(e => e.era === era);

    // Filter by year range if specified
    if (year !== undefined) {
        eraEvents = eraEvents.filter(e => {
            // If event doesn't specify year range, it's valid for all years in its era
            if (e.yearMin === undefined && e.yearMax === undefined) return true;
            // Check if year falls within the event's range
            const afterMin = e.yearMin === undefined || year >= e.yearMin;
            const beforeMax = e.yearMax === undefined || year <= e.yearMax;
            return afterMin && beforeMax;
        });
    }

    // Filter by cultural zone if specified
    if (culturalZone) {
        const zoneSpecificEvents = eraEvents.filter(e => {
            // If event doesn't specify zones, it's universal
            if (!e.culturalZones) return true;
            // Otherwise, check if current zone is in the event's allowed zones
            return e.culturalZones.includes(culturalZone);
        });

        // Use zone-specific events if any exist, otherwise fall back to universal events
        if (zoneSpecificEvents.length > 0) {
            eraEvents = zoneSpecificEvents;
        }
    }

    // Return null if no events match - better than showing anachronistic events
    if (eraEvents.length === 0) {
        console.warn(`[PerimeterEventService] No events found for era ${era}, zone ${culturalZone}, year ${year}`);
        return null;
    }
    return eraEvents[Math.floor(Math.random() * eraEvents.length)];
};

export const rollPerimeterOutcome = (outcomes: PerimeterEventOutcome[]): PerimeterEventOutcome => {
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
