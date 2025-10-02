/**
 * services/poiDialogueService.ts - Procedural dialogue generation for POI workers
 */
import { HistoricalEra } from '../types';
import { CulturalZone } from '../types/characterData';

export interface WorkerDialogue {
  speaker: string;
  greeting: string;
  services: ServiceOption[];
}

export interface ServiceOption {
  id: string;
  name: string;
  description: string;
  cost: string;
  requirements?: string[];
  available?: boolean;
}

interface DialogueTemplate {
  type: 'mine' | 'quarry' | 'mill' | 'factory' | 'fortress' | 'woodcutter';
  culturalZone: CulturalZone;
  era: HistoricalEra;
  speakerTitles: string[];
  greetings: string[];
  services: ServiceTemplate[];
}

interface ServiceTemplate {
  id: string;
  nameTemplate: string;
  descriptionTemplate: string;
  costTemplate: string;
  requirements?: string[];
}

// Dialogue templates organized by culture/era/type
const DIALOGUE_TEMPLATES: DialogueTemplate[] = [
  // North America - Antiquity - Quarry
  {
    type: 'quarry',
    culturalZone: 'North America',
    era: HistoricalEra.ANTIQUITY,
    speakerTitles: [
      'Stone-Keeper',
      'Master Knapper', 
      'Elder Craftsman',
      'Rock Breaker',
      'Stone Singer'
    ],
    greetings: [
      "Hmph. Another traveler looking for stone.",
      "*glances up, then looks away* ...What?",
      "You lost? This is a quarry.",
      "*stares at you, says nothing*",
      "Move along if you're not buying.",
      "The hell do you want?",
      "*spits* Yeah?"
    ],
    services: [
      {
        id: 'buy',
        nameTemplate: 'Buy Stone',
        descriptionTemplate: 'Purchase raw or cut stone',
        costTemplate: '{price} {currency}',
        requirements: []
      },
      {
        id: 'sell',
        nameTemplate: 'Sell Stone',
        descriptionTemplate: 'Trade your stone for coin',
        costTemplate: 'Market rate',
        requirements: []
      },
      {
        id: 'craft',
        nameTemplate: 'Cut Stone',
        descriptionTemplate: 'Shape your raw stone into blocks',
        costTemplate: 'Uses your materials',
        requirements: ['Have stone in inventory']
      }
    ]
  },
  // North America - Antiquity - Mine
  {
    type: 'mine',
    culturalZone: 'North America',
    era: HistoricalEra.ANTIQUITY,
    speakerTitles: [
      'Earth-Worker',
      'Copper Singer',
      'Deep Digger',
      'Clay Finder',
      'Metal Keeper'
    ],
    greetings: [
      "*covered in dirt, doesn't look up* We're working here.",
      "You're not from the company. Get out.",
      "*coughs from dust* ...What now?",
      "This is dangerous ground, stranger.",
      "*wipes sweat* If you're not buying ore, move along."
    ],
    services: [
      {
        id: 'buy_raw',
        nameTemplate: 'Purchase {material}',
        descriptionTemplate: 'Fresh-dug {material}, still bearing earth-power',
        costTemplate: '{price} goods per basket',
        requirements: []
      },
      {
        id: 'trade_refined',
        nameTemplate: 'Trade Refined {material}',
        descriptionTemplate: 'Processed and purified for immediate use',
        costTemplate: '{price} goods for quality work',
        requirements: []
      },
      {
        id: 'mining_rights',
        nameTemplate: 'Arrange Mining Rights',
        descriptionTemplate: 'Permission to work a section yourself',
        costTemplate: 'Significant goods + ongoing tribute',
        requirements: ['Reputation with clan', 'Strength 13+']
      },
      {
        id: 'earth_blessing',
        nameTemplate: 'Earth Blessing',
        descriptionTemplate: 'Ritual protection for dangerous work',
        costTemplate: 'Ritual herbs + respect',
        requirements: ['Wisdom 11+']
      }
    ]
  },
  // Europe - Antiquity - Quarry
  {
    type: 'quarry',
    culturalZone: 'Europe', 
    era: HistoricalEra.ANTIQUITY,
    speakerTitles: [
      'Quarry Master',
      'Stone Engineer',
      'Block Supervisor',
      'Roman Foreman',
      'Imperial Contractor'
    ],
    greetings: [
      "Good citizen, these stones will build the Empire. What do you require?",
      "Quality marble for quality coin. What brings you to our operation?",
      "The finest stone in the province comes from these quarries. Your business?",
      "Welcome to the Imperial stone works. We serve Rome's greatest projects.",
      "These blocks will grace temples and forums. How may we assist you?"
    ],
    services: [
      {
        id: 'buy_blocks',
        nameTemplate: 'Purchase Dressed Blocks',
        descriptionTemplate: 'Precisely cut stones, Roman standard',
        costTemplate: '{price} denarii per block',
        requirements: ['Roman citizenship or permits']
      },
      {
        id: 'custom_carving',
        nameTemplate: 'Commission Custom Work',
        descriptionTemplate: 'Specialized carving and architectural elements',
        costTemplate: '{price} denarii + time',
        requirements: ['Substantial deposit', 'Approved designs']
      },
      {
        id: 'bulk_contract',
        nameTemplate: 'Arrange Bulk Delivery',
        descriptionTemplate: 'Large orders for major construction',
        costTemplate: 'Negotiated rates + transport',
        requirements: ['Imperial contracts', 'Verified funding']
      },
      {
        id: 'stone_consultation',
        nameTemplate: 'Engineering Consultation',
        descriptionTemplate: 'Expert advice on stone selection and use',
        costTemplate: '{price} denarii per consultation',
        requirements: ['Serious construction project']
      }
    ]
  },
  // Europe - Medieval - Mill
  {
    type: 'mill',
    culturalZone: 'Europe',
    era: HistoricalEra.MEDIEVAL,
    speakerTitles: [
      'Master Miller',
      'Millwright',
      'Grain Miller',
      'Village Miller',
      'Mill Keeper'
    ],
    greetings: [
      "*doesn't stop working the stones* Got grain or not?",
      "Mill's busy. Wait your turn.",
      "*covered in flour dust* ...What?",
      "The lord takes his cut first. You understand that?",
      "*spits* Another mouth to feed. Make it quick."
    ],
    services: [
      {
        id: 'grind_grain',
        nameTemplate: 'Grind Your Grain',
        descriptionTemplate: 'Fresh grinding of wheat, barley, or oats',
        costTemplate: 'One-sixteenth of grain as payment',
        requirements: ['Bring your own grain']
      },
      {
        id: 'buy_flour',
        nameTemplate: 'Purchase Ground Flour',
        descriptionTemplate: 'Fresh-ground flour, ready for baking',
        costTemplate: '{price} pence per pound',
        requirements: []
      },
      {
        id: 'mill_maintenance',
        nameTemplate: 'Millstone Sharpening',
        descriptionTemplate: 'Professional maintenance of grinding stones',
        costTemplate: '{price} shillings + materials',
        requirements: ['Own millstones']
      },
      {
        id: 'water_rights',
        nameTemplate: 'Discuss Water Rights',
        descriptionTemplate: 'Arrangements for mill use and water access',
        costTemplate: 'Variable fees + agreements',
        requirements: ['Land ownership', 'Lord\'s permission']
      }
    ]
  },
  
  // ==================== WOODCUTTER DIALOGUES ====================
  // North America - Antiquity - Woodcutter
  {
    type: 'woodcutter',
    culturalZone: 'North America',
    era: HistoricalEra.ANTIQUITY,
    speakerTitles: [
      'Tree Keeper',
      'Wood Gatherer',
      'Forest Elder',
      'Bark Stripper',
      'Lodge Builder'
    ],
    greetings: [
      "*swinging axe, doesn't look up* This is sacred ground.",
      "You shouldn't be in these woods alone.",
      "*stares silently* ...State your business.",
      "The trees don't like strangers. What do you want?",
      "*grips axe handle* Wood's not free, outsider."
    ],
    services: [
      {
        id: 'select_timber',
        nameTemplate: 'Select Blessed Timber',
        descriptionTemplate: 'Choose wood blessed by forest spirits',
        costTemplate: 'Offering of tobacco or cornmeal',
        requirements: ['Respect for traditions']
      },
      {
        id: 'bark_stripping',
        nameTemplate: 'Harvest Bark',
        descriptionTemplate: 'Medicine bark for healing or building',
        costTemplate: 'Trade goods or assistance',
        requirements: ['Proper season']
      },
      {
        id: 'firewood_bundle',
        nameTemplate: 'Gather Firewood',
        descriptionTemplate: 'Dry wood bundled for carrying',
        costTemplate: 'Help with gathering'
      },
      {
        id: 'learn_trees',
        nameTemplate: 'Learn Tree Wisdom',
        descriptionTemplate: 'Knowledge of which trees serve which purpose',
        costTemplate: 'Time and attention'
      }
    ]
  },
  
  // Europe - Medieval - Woodcutter
  {
    type: 'woodcutter',
    culturalZone: 'Europe',
    era: HistoricalEra.MEDIEVAL,
    speakerTitles: [
      'Master Forester',
      'Woodward',
      'Charcoal Burner',
      'Timber Merchant',
      'Forest Reeve'
    ],
    greetings: [
      "*looks up from chopping* These are the lord's woods. Move along.",
      "Poachers hang. Remember that.",
      "*wipes sweat, scowls* What now?",
      "Wood's for the manor. Not for wanderers.",
      "*hefts axe* State your business or leave."
    ],
    services: [
      {
        id: 'building_timber',
        nameTemplate: 'Purchase Building Timber',
        descriptionTemplate: 'Oak beams and planks for construction',
        costTemplate: '3 silver per beam',
        requirements: ['Lord\'s permission for large orders']
      },
      {
        id: 'firewood_load',
        nameTemplate: 'Buy Firewood',
        descriptionTemplate: 'Seasoned wood for hearth and home',
        costTemplate: '2 copper per bundle'
      },
      {
        id: 'charcoal_sack',
        nameTemplate: 'Purchase Charcoal',
        descriptionTemplate: 'High-heat charcoal for smithing',
        costTemplate: '5 copper per sack'
      },
      {
        id: 'custom_cutting',
        nameTemplate: 'Commission Special Cuts',
        descriptionTemplate: 'Specific sizes for your project',
        costTemplate: 'Negotiable + labor',
        requirements: ['Detailed specifications']
      }
    ]
  },
  
  // Asia - Classical - Woodcutter
  {
    type: 'woodcutter',
    culturalZone: 'Asia',
    era: HistoricalEra.CLASSICAL,
    speakerTitles: [
      'Mountain Woodsman',
      'Bamboo Master',
      'Temple Forester',
      'Timber Sage',
      'Wood Merchant'
    ],
    greetings: [
      "*barely glances up* Mountain paths are dangerous for strangers.",
      "This grove is spoken for. Move on.",
      "*continues working* Temple gets first pick. You get what's left.",
      "Hmm. Another trader. Wood costs more than you think.",
      "*sharpening blade* ...Lost?"
    ],
    services: [
      {
        id: 'temple_wood',
        nameTemplate: 'Sacred Temple Wood',
        descriptionTemplate: 'Blessed timber for religious buildings',
        costTemplate: 'Donation to forest shrine',
        requirements: ['Temple authorization']
      },
      {
        id: 'bamboo_poles',
        nameTemplate: 'Fresh Bamboo',
        descriptionTemplate: 'Flexible poles for construction',
        costTemplate: '1 bronze coin per dozen'
      },
      {
        id: 'aromatic_wood',
        nameTemplate: 'Incense Wood',
        descriptionTemplate: 'Fragrant wood for ceremonies',
        costTemplate: '3 bronze coins per bundle'
      },
      {
        id: 'boat_timber',
        nameTemplate: 'Shipwright Wood',
        descriptionTemplate: 'Curved timbers for boat building',
        costTemplate: 'Market price + selection fee',
        requirements: ['Master shipwright reference']
      }
    ]
  },
  
  // Industrial Era - Europe - Woodcutter
  {
    type: 'woodcutter',
    culturalZone: 'Europe',
    era: HistoricalEra.INDUSTRIAL,
    speakerTitles: [
      'Lumber Foreman',
      'Mill Operator',
      'Timber Boss',
      'Company Agent',
      'Log Driver'
    ],
    greetings: [
      "*over machine noise* Company orders only! Get out!",
      "Mill's dangerous. You got papers or not?",
      "*spits tobacco* Another city fool wanting cheap lumber.",
      "Union workers only past this point.",
      "*doesn't stop the saw* Make it quick, we're on quota."
    ],
    services: [
      {
        id: 'milled_lumber',
        nameTemplate: 'Purchase Milled Lumber',
        descriptionTemplate: 'Machine-cut boards and planks',
        costTemplate: 'Market rates per board foot'
      },
      {
        id: 'railway_ties',
        nameTemplate: 'Railway Ties',
        descriptionTemplate: 'Standard ties for rail construction',
        costTemplate: 'Bulk pricing available',
        requirements: ['Railway company contract']
      },
      {
        id: 'specialty_cuts',
        nameTemplate: 'Custom Millwork',
        descriptionTemplate: 'Precise cuts to specification',
        costTemplate: 'Premium rates + setup'
      },
      {
        id: 'sawdust_delivery',
        nameTemplate: 'Sawdust & Shavings',
        descriptionTemplate: 'For livestock bedding or ice storage',
        costTemplate: 'Nearly free - just haul it'
      }
    ]
  },
  
  // ==================== FORTRESS DIALOGUES ====================
  // Europe - Medieval - Fortress (FEUDAL CASTLE, not military base)
  {
    type: 'fortress',
    culturalZone: 'Europe',
    era: HistoricalEra.MEDIEVAL,
    speakerTitles: [
      'Gate Guard',
      'Castellan',
      'Man-at-Arms',
      'Knight',
      'Chamberlain'
    ],
    greetings: [
      "*hand on sword hilt* State your business with my lord.",
      "The castle gates close at dusk. State your purpose.",
      "*looks you up and down* Are you a vassal of this realm?",
      "This is the lord's castle. What brings you here?",
      "*from the gatehouse* My lord sees visitors by appointment only."
    ],
    services: [
      {
        id: 'garrison_supplies',
        nameTemplate: 'Military Provisions',
        descriptionTemplate: 'Basic rations and equipment',
        costTemplate: 'Military requisition only',
        requirements: ['Military authorization']
      },
      {
        id: 'safe_passage',
        nameTemplate: 'Request Safe Passage',
        descriptionTemplate: 'Written pass for travel',
        costTemplate: 'Subject to approval',
        requirements: ['Clean record', 'Valid reason']
      },
      {
        id: 'mercenary_contract',
        nameTemplate: 'Enlist as Mercenary',
        descriptionTemplate: 'Short-term military service',
        costTemplate: 'Daily wages if accepted',
        requirements: ['Combat skills', 'Own weapons']
      }
    ]
  },
  
  // Asia - Antiquity - Fortress (GARRISON FORT - bureaucrat-general)
  {
    type: 'fortress',
    culturalZone: 'Asia',
    era: HistoricalEra.ANTIQUITY,
    speakerTitles: [
      'Gate Keeper',
      'Garrison Scribe',
      'Military Magistrate',
      'Watch Captain',
      'Border Inspector'
    ],
    greetings: [
      "*scribe looks up from records* State your business at this garrison.",
      "Travelers must present documents. The magistrate's orders.",
      "*from gate* This garrison guards the frontier. Papers?",
      "The garrison commander requires written authorization for entry.",
      "*military official* What brings you to this imperial outpost?"
    ],
    services: [
      {
        id: 'travel_papers',
        nameTemplate: 'Border Crossing Papers',
        descriptionTemplate: 'Official seal for passage',
        costTemplate: 'Substantial bribe required',
        requirements: ['No criminal record']
      },
      {
        id: 'military_escort',
        nameTemplate: 'Hire Military Escort',
        descriptionTemplate: 'Protection through dangerous lands',
        costTemplate: 'Negotiable based on distance',
        requirements: ['Legitimate merchant']
      }
    ]
  },
  
  // North America - Prehistory/Antiquity - Fortress (PALISADED VILLAGE, not fortress)
  {
    type: 'fortress',
    culturalZone: 'North America',
    era: HistoricalEra.ANTIQUITY,
    speakerTitles: [
      'War Leader',
      'Warrior',
      'Village Elder',
      'Clan Guardian',
      'War Chief'
    ],
    greetings: [
      "*warrior steps forward* State your clan and purpose.",
      "These lands are protected by our warriors. What do you seek?",
      "*elder speaks* All who come in peace may speak.",
      "We are watchful. The village must be defended.",
      "*gestures to fire* Sit. Tell us why you come."
    ],
    services: [
      {
        id: 'safe_passage',
        nameTemplate: 'Request Safe Passage',
        descriptionTemplate: 'Ask permission to travel through clan territory',
        costTemplate: 'Tribute or peaceful intent',
        requirements: ['Respect for traditions']
      },
      {
        id: 'clan_alliance',
        nameTemplate: 'Discuss Alliance',
        descriptionTemplate: 'Negotiate mutual protection agreements',
        costTemplate: 'Significant gifts and promises',
        requirements: ['High reputation', 'Clan leadership']
      }
    ]
  },
  
  // Europe - Antiquity - Fortress (ROMAN CASTRUM - professional military)
  {
    type: 'fortress',
    culturalZone: 'Europe',
    era: HistoricalEra.ANTIQUITY,
    speakerTitles: [
      'Centurion',
      'Optio',
      'Camp Prefect',
      'Legion Centurion',
      'Gate Sentry'
    ],
    greetings: [
      "Halt! State your business with the Legion.",
      "This is a Roman military camp. Civilians require authorization.",
      "*adjusts armor* Papers, if you have them, citizen.",
      "The castrum is closed to civilians without proper documents.",
      "*hand on gladius* What brings a civilian to the legion's gates?"
    ],
    services: [
      {
        id: 'military_supplies',
        nameTemplate: 'Purchase Military Supplies',
        descriptionTemplate: 'Standard legion equipment and provisions',
        costTemplate: 'Military prices in denarii',
        requirements: ['Roman citizenship or allied status']
      },
      {
        id: 'auxiliary_recruitment',
        nameTemplate: 'Auxiliary Enlistment',
        descriptionTemplate: 'Join the auxiliary forces',
        costTemplate: 'Service commitment required',
        requirements: ['Physical fitness', 'No criminal record']
      }
    ]
  },
  
  // Europe - Industrial - Fortress  
  {
    type: 'fortress',
    culturalZone: 'Europe',
    era: HistoricalEra.INDUSTRIAL_ERA,
    speakerTitles: [
      'Artillery Officer',
      'Infantry Captain',
      'Fortress Commander',
      'Military Engineer',
      'Garrison Sergeant'
    ],
    greetings: [
      "*in military uniform* This is a restricted military facility.",
      "Civilians are not permitted without proper authorization.",
      "*checking papers* State your business with the garrison.",
      "The fortress is on heightened alert. Move along.",
      "*formal salute* How may the army assist you, citizen?"
    ],
    services: [
      {
        id: 'military_contracts',
        nameTemplate: 'Military Supply Contracts',
        descriptionTemplate: 'Provisions and equipment for the army',
        costTemplate: 'Government contract rates',
        requirements: ['Approved vendor status']
      },
      {
        id: 'army_enlistment',
        nameTemplate: 'Army Enlistment',
        descriptionTemplate: 'Join the regular army forces',
        costTemplate: 'Military service and training',
        requirements: ['Medical examination', 'Age requirements']
      }
    ]
  },
  
  // ==================== FACTORY DIALOGUES ====================
  // Europe - Industrial - Factory
  {
    type: 'factory',
    culturalZone: 'Europe',
    era: HistoricalEra.INDUSTRIAL,
    speakerTitles: [
      'Factory Foreman',
      'Shift Manager',
      'Works Overseer',
      'Company Inspector',
      'Mill Boss'
    ],
    greetings: [
      "*shouting over machinery* No visitors during shift hours!",
      "Factory's closed to outsiders. Company policy.",
      "*covered in soot* Lost? Get out before you get hurt.",
      "Union meeting's tomorrow. Today we work.",
      "*checking clipboard* Not on the roster. Move along."
    ],
    services: [
      {
        id: 'bulk_textiles',
        nameTemplate: 'Purchase Factory Goods',
        descriptionTemplate: 'Mass-produced textiles and materials',
        costTemplate: 'Wholesale only',
        requirements: ['Merchant license']
      },
      {
        id: 'machine_repair',
        nameTemplate: 'Equipment Maintenance',
        descriptionTemplate: 'Repair services for machinery',
        costTemplate: 'Premium rates',
        requirements: ['Technical knowledge']
      },
      {
        id: 'factory_work',
        nameTemplate: 'Apply for Factory Work',
        descriptionTemplate: '12-hour shifts, six days a week',
        costTemplate: 'Minimal wages',
        requirements: ['Strong constitution', 'No union ties']
      }
    ]
  },
  
  // Asia - Modern - Factory
  {
    type: 'factory',
    culturalZone: 'Asia',
    era: HistoricalEra.MODERN,
    speakerTitles: [
      'Production Manager',
      'Floor Supervisor',
      'Quality Inspector',
      'Shift Leader',
      'Assembly Chief'
    ],
    greetings: [
      "*wearing safety gear* Authorized personnel only.",
      "No tours today. Check with head office.",
      "*busy with production line* Can't stop. Quota to meet.",
      "Safety violation. You need proper equipment to be here.",
      "*points to exit* Visitors out. Now."
    ],
    services: [
      {
        id: 'wholesale_electronics',
        nameTemplate: 'Bulk Electronics Order',
        descriptionTemplate: 'Minimum 1000 units',
        costTemplate: 'Contact sales department',
        requirements: ['Business registration']
      },
      {
        id: 'assembly_contract',
        nameTemplate: 'Contract Manufacturing',
        descriptionTemplate: 'Custom assembly services',
        costTemplate: 'Volume-based pricing',
        requirements: ['Technical specifications', 'Large order']
      }
    ]
  },

  // ==================== MIDDLE EAST DIALOGUES ====================
  // Middle East - Antiquity - Mill
  {
    type: 'mill',
    culturalZone: 'Middle East',
    era: HistoricalEra.ANTIQUITY,
    speakerTitles: [
      'Mill Overseer',
      'Grain Master',
      'Qanat Keeper',
      'Water Wheel Operator',
      'Flour Merchant'
    ],
    greetings: [
      "*dusting flour from robes* Peace be upon you, traveler.",
      "The wheel turns by the grace of the waters. What brings you?",
      "*checking grain sacks* The harvest has been good this season.",
      "Welcome to my mill. The finest flour in the valley!",
      "*adjusting the water channel* Careful near the wheel, friend."
    ],
    services: [
      {
        id: 'grain_grinding',
        nameTemplate: 'Grind Grain',
        descriptionTemplate: 'Turn your wheat or barley into flour',
        costTemplate: 'One tenth of the grain',
        requirements: ['Bring your own grain']
      },
      {
        id: 'flour_purchase',
        nameTemplate: 'Purchase Flour',
        descriptionTemplate: 'Fresh ground wheat and barley flour',
        costTemplate: '3-5 shekels per sack',
        requirements: []
      },
      {
        id: 'water_rights',
        nameTemplate: 'Negotiate Water Access',
        descriptionTemplate: 'Share of the qanat flow for irrigation',
        costTemplate: 'Seasonal tribute',
        requirements: ['Local landowner']
      }
    ]
  },

  // Middle East - Medieval - Mill
  {
    type: 'mill',
    culturalZone: 'Middle East',
    era: HistoricalEra.MEDIEVAL,
    speakerTitles: [
      'Mill Muqaddam',
      'Flour Master',
      'Waterwheel Engineer',
      'Grain Assessor',
      'Mill Guardian'
    ],
    greetings: [
      "*in the name of Allah* Welcome to the sultan's mill.",
      "The water flows strong today. A blessing for all.",
      "*counting sacks* Another caravan from Damascus arrives soon.",
      "Peace, traveler. The mill serves all who bring grain.",
      "*maintaining the gears* Ancient Persian engineering at work!"
    ],
    services: [
      {
        id: 'grain_milling',
        nameTemplate: 'Mill Your Grain',
        descriptionTemplate: 'Expert milling with fine stones',
        costTemplate: 'Mill tax plus one dirham',
        requirements: ['Grain to mill']
      },
      {
        id: 'flour_varieties',
        nameTemplate: 'Select Flour Grade',
        descriptionTemplate: 'Coarse, standard, or fine white flour',
        costTemplate: '5-15 dirhams per sack',
        requirements: []
      },
      {
        id: 'waqf_distribution',
        nameTemplate: 'Charitable Flour',
        descriptionTemplate: 'Free flour for the poor (waqf endowment)',
        costTemplate: 'Free for the needy',
        requirements: ['Proof of hardship']
      }
    ]
  },

  // Middle East - Renaissance - Mill
  {
    type: 'mill',
    culturalZone: 'Middle East',
    era: HistoricalEra.RENAISSANCE,
    speakerTitles: [
      'Ottoman Mill Administrator',
      'Master Miller',
      'Waterworks Supervisor',
      'Imperial Grain Inspector',
      'Mill Ağa'
    ],
    greetings: [
      "*reviewing ledgers* The Sultan's mills never rest.",
      "Merhaba! Our stones grind the finest flour in the empire.",
      "*checking Ottoman water clock* Right on schedule, effendi.",
      "Welcome to the imperial mill complex. State your business.",
      "*proud gesture* Three waterwheels, the pride of the province!"
    ],
    services: [
      {
        id: 'commercial_milling',
        nameTemplate: 'Commercial Milling Service',
        descriptionTemplate: 'Large scale grain processing',
        costTemplate: 'Guild rates in akçe',
        requirements: ['Merchant guild member']
      },
      {
        id: 'specialty_flours',
        nameTemplate: 'Specialty Flour Blends',
        descriptionTemplate: 'Baklava flour, semolina, and more',
        costTemplate: '10-25 akçe per okka',
        requirements: []
      },
      {
        id: 'mill_contract',
        nameTemplate: 'Seasonal Milling Contract',
        descriptionTemplate: 'Reserved milling times for harvest',
        costTemplate: 'Advance payment required',
        requirements: ['Land ownership proof']
      }
    ]
  },

  // Middle East - Antiquity - Quarry
  {
    type: 'quarry',
    culturalZone: 'Middle East',
    era: HistoricalEra.ANTIQUITY,
    speakerTitles: [
      'Quarry Master',
      'Stone Cutter Chief',
      'Babylonian Overseer',
      'Rock Face Supervisor',
      'Temple Contractor'
    ],
    greetings: [
      "*wiping limestone dust* The temple needs more blocks!",
      "By Marduk's hammer, these stones will build eternity.",
      "*shouting over chisel strikes* What do you want here?",
      "Careful! We're moving a ten-ton block today.",
      "*examining stone grain* Only the finest for the ziggurat."
    ],
    services: [
      {
        id: 'building_stone',
        nameTemplate: 'Purchase Building Stone',
        descriptionTemplate: 'Limestone and sandstone blocks',
        costTemplate: '50-200 shekels per block',
        requirements: ['Transport arrangements']
      },
      {
        id: 'carved_stone',
        nameTemplate: 'Commission Carved Stone',
        descriptionTemplate: 'Decorative reliefs and inscriptions',
        costTemplate: 'Price varies by complexity',
        requirements: ['Design approval']
      },
      {
        id: 'quarry_labor',
        nameTemplate: 'Join Work Crew',
        descriptionTemplate: 'Hard labor, regular pay',
        costTemplate: 'Daily wages in barley',
        requirements: ['Strong back']
      }
    ]
  },

  // Middle East - Medieval - Quarry
  {
    type: 'quarry',
    culturalZone: 'Middle East',
    era: HistoricalEra.MEDIEVAL,
    speakerTitles: [
      'Quarry Raís',
      'Master Stonecutter',
      'Mamluk Overseer',
      'Stone Guild Elder',
      'Mosque Builder'
    ],
    greetings: [
      "*pointing to marble veins* Allah has blessed us with fine stone.",
      "The new mosque requires our finest white marble.",
      "*supervising workers* Mind the geometric cuts - Islamic precision!",
      "Salaam. We supply stone from here to Cairo.",
      "*proudly* Our stone built the greatest madrasas."
    ],
    services: [
      {
        id: 'mosque_stone',
        nameTemplate: 'Mosque Construction Stone',
        descriptionTemplate: 'Pre-cut for arches and domes',
        costTemplate: 'Negotiable in dinars',
        requirements: ['Religious authority approval']
      },
      {
        id: 'decorative_marble',
        nameTemplate: 'Decorative Marble',
        descriptionTemplate: 'For mihrab and fountain work',
        costTemplate: '100-500 dinars per load',
        requirements: ['Master craftsman reference']
      },
      {
        id: 'apprentice_training',
        nameTemplate: 'Stonecutting Apprenticeship',
        descriptionTemplate: 'Learn geometric stone cutting',
        costTemplate: 'Seven years service',
        requirements: ['Youth and dedication']
      }
    ]
  },

  // Middle East - Antiquity - Mine
  {
    type: 'mine',
    culturalZone: 'Middle East',
    era: HistoricalEra.ANTIQUITY,
    speakerTitles: [
      'Mine Overseer',
      'Copper Master',
      'Persian Mine Chief',
      'Royal Inspector',
      'Ore Assessor'
    ],
    greetings: [
      "*covered in copper dust* The king's mines yield well.",
      "These tunnels reach deep into the earth's treasures.",
      "*examining ore* Malachite and azurite - the gods' own colors.",
      "Watch your head, stranger. Low ceilings ahead.",
      "*proudly* We've mined here since Cyrus's time."
    ],
    services: [
      {
        id: 'raw_copper',
        nameTemplate: 'Purchase Raw Copper',
        descriptionTemplate: 'Unrefined copper ore',
        costTemplate: '20-40 shekels per talent',
        requirements: ['Smelting capability']
      },
      {
        id: 'precious_stones',
        nameTemplate: 'Turquoise and Lapis',
        descriptionTemplate: 'Semi-precious stones for jewelry',
        costTemplate: 'Market rates in silver',
        requirements: ['Jeweler license']
      },
      {
        id: 'mining_rights',
        nameTemplate: 'Lease Mining Claim',
        descriptionTemplate: 'Work your own shaft',
        costTemplate: 'Royal tax plus percentage',
        requirements: ['Local permission', 'Equipment']
      }
    ]
  },

  // Middle East - Medieval - Mine
  {
    type: 'mine',
    culturalZone: 'Middle East',
    era: HistoricalEra.MEDIEVAL,
    speakerTitles: [
      'Mine Emir',
      'Chief Excavator',
      'Silver Master',
      'Alchemist Miner',
      'Guild Supervisor'
    ],
    greetings: [
      "*holding oil lamp* The depths hold silver and lead.",
      "By the Caliph's decree, these mines stay productive.",
      "*checking support beams* Persian mining techniques, Arab management.",
      "Welcome to the mines. Don't stray from marked paths.",
      "*weighing silver* A good vein this month, alhamdulillah."
    ],
    services: [
      {
        id: 'refined_silver',
        nameTemplate: 'Pure Silver Ingots',
        descriptionTemplate: 'Refined and stamped silver',
        costTemplate: 'Current market in dinars',
        requirements: ['Merchant credentials']
      },
      {
        id: 'alchemical_minerals',
        nameTemplate: 'Alchemical Supplies',
        descriptionTemplate: 'Sulfur, mercury, and salts',
        costTemplate: 'Special rates for scholars',
        requirements: ['Alchemist reference']
      },
      {
        id: 'mine_investment',
        nameTemplate: 'Mine Partnership',
        descriptionTemplate: 'Invest in new shaft development',
        costTemplate: 'Minimum 1000 dinars',
        requirements: ['Wealth verification']
      }
    ]
  },

  // Middle East - Antiquity - Fortress (PALACE-FORTRESS - governor with military)
  {
    type: 'fortress',
    culturalZone: 'Middle East',
    era: HistoricalEra.ANTIQUITY,
    speakerTitles: [
      'Fortress Governor',
      'Royal Scribe',
      'Garrison Captain',
      'Gate Keeper',
      'Palace Guard'
    ],
    greetings: [
      "*scribe at desk* State your petition for the governor.",
      "This fortress serves the king. What business brings you here?",
      "*from the walls* Travelers must state their purpose.",
      "The governor's scribes will record your request.",
      "*guard gestures* Wait here. The officials will see you."
    ],
    services: [
      {
        id: 'safe_passage',
        nameTemplate: 'Request Safe Passage',
        descriptionTemplate: 'Military escort through dangerous lands',
        costTemplate: 'Tribute to the garrison',
        requirements: ['Valid travel documents']
      },
      {
        id: 'military_supplies',
        nameTemplate: 'Sell Military Supplies',
        descriptionTemplate: 'The garrison needs provisions',
        costTemplate: 'Competitive prices',
        requirements: ['Quality goods']
      },
      {
        id: 'mercenary_contract',
        nameTemplate: 'Hire Garrison Soldiers',
        descriptionTemplate: 'Trained warriors for hire',
        costTemplate: 'Daily rate in silver',
        requirements: ['Legitimate purpose']
      }
    ]
  },

  // Middle East - Medieval - Fortress
  {
    type: 'fortress',
    culturalZone: 'Middle East',
    era: HistoricalEra.MEDIEVAL,
    speakerTitles: [
      'Fortress Emir',
      'Mamluk Commander',
      'Citadel Captain',
      'Military Qadi',
      'Castle Warden'
    ],
    greetings: [
      "*from battlements* Who seeks entry to the Sultan's fortress?",
      "This citadel has never fallen. State your business.",
      "*checking credentials* Crusaders were turned back here.",
      "The fortress serves the Caliph. Why do you come?",
      "*military bearing* Discipline and faith guard these walls."
    ],
    services: [
      {
        id: 'military_training',
        nameTemplate: 'Mamluk Training',
        descriptionTemplate: 'Elite military instruction',
        costTemplate: 'Years of service',
        requirements: ['Young age', 'Physical fitness']
      },
      {
        id: 'fortress_smithy',
        nameTemplate: 'Damascus Steel Weapons',
        descriptionTemplate: 'Finest blades from the fortress forge',
        costTemplate: 'Premium prices',
        requirements: ['Warrior status']
      },
      {
        id: 'intelligence_report',
        nameTemplate: 'Regional Intelligence',
        descriptionTemplate: 'Information on threats and opportunities',
        costTemplate: 'Information trade',
        requirements: ['Valuable intelligence to share']
      }
    ]
  },

  // Middle East - Renaissance - Fortress
  {
    type: 'fortress',
    culturalZone: 'Middle East',
    era: HistoricalEra.RENAISSANCE,
    speakerTitles: [
      'Ottoman Fortress Ağa',
      'Janissary Commander',
      'Artillery Captain',
      'Fortress Pasha',
      'Military Engineer'
    ],
    greetings: [
      "*in Ottoman uniform* The Sultan's fortress controls this region.",
      "Our cannons command every approach. State your purpose.",
      "*military inspection* Janissaries patrol these walls day and night.",
      "Welcome to the Ottoman stronghold. Papers, effendi?",
      "*proudly* Italian engineers designed these star walls."
    ],
    services: [
      {
        id: 'janissary_escort',
        nameTemplate: 'Janissary Protection',
        descriptionTemplate: 'Elite guard escort service',
        costTemplate: 'Negotiated in Ottoman gold',
        requirements: ['Official permission']
      },
      {
        id: 'cannon_demonstration',
        nameTemplate: 'Artillery Display',
        descriptionTemplate: 'Witness Ottoman firepower',
        costTemplate: 'Donation to garrison',
        requirements: ['No security concerns']
      },
      {
        id: 'military_commission',
        nameTemplate: 'Officer Commission',
        descriptionTemplate: 'Join the Ottoman military',
        costTemplate: 'Merit and connections',
        requirements: ['Military experience', 'Muslim faith preferred']
      }
    ]
  }
];

// Pricing data for different eras and materials
const PRICING_DATA = {
  'North America': {
    [HistoricalEra.ANTIQUITY]: {
      quarry: { price: '2-5', currency: 'trade goods' },
      mine: { price: '3-8', currency: 'goods' }
    }
  },
  'Europe': {
    [HistoricalEra.ANTIQUITY]: {
      quarry: { price: '50-200', currency: 'denarii' }
    },
    [HistoricalEra.MEDIEVAL]: {
      mill: { price: '2-6', currency: 'pence' }
    }
  }
};

class POIDialogueService {
  private mapCulturalZone(zone: CulturalZone): string {
    const mapping: Record<CulturalZone, string> = {
      'EUROPEAN': 'Europe',
      'EAST_ASIAN': 'Asia', 
      'MENA': 'Middle East',
      'NORTH_AMERICAN_PRE_COLUMBIAN': 'North America',
      'NORTH_AMERICAN_COLONIAL': 'North America',
      'OCEANIA': 'Oceania',
      'SOUTH_ASIAN': 'Asia',
      'SOUTH_AMERICAN': 'South America',
      'SUB_SAHARAN_AFRICAN': 'Africa'
    };
    return mapping[zone] || 'Europe'; // Fallback to Europe
  }

  private findTemplate(
    poiType: string,
    culturalZone: CulturalZone, 
    era: HistoricalEra
  ): DialogueTemplate | null {
    const mappedZone = this.mapCulturalZone(culturalZone);
    
    // Convert era to string to ensure comparison works
    const eraString = typeof era === 'string' ? era : (era ? era.toString() : 'MEDIEVAL');
    
    return DIALOGUE_TEMPLATES.find(
      template => {
        // Safe conversion with fallback
        const templateEraString = typeof template.era === 'string' 
          ? template.era 
          : (template.era ? template.era.toString() : 'MEDIEVAL');
        return (
          template.type === poiType &&
          template.culturalZone === mappedZone &&
          templateEraString === eraString
        );
      }
    ) || null;
  }

  private pickRandom<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private getPricing(
    culturalZone: CulturalZone,
    era: HistoricalEra,
    poiType: string
  ): { price: string; currency: string } {
    const pricing = PRICING_DATA[culturalZone]?.[era]?.[poiType as keyof typeof PRICING_DATA[typeof culturalZone][typeof era]];
    return pricing || { price: '2-5', currency: 'goods' };
  }

  private substituteServiceVariables(
    service: ServiceTemplate,
    materialType: string,
    pricing: { price: string; currency: string }
  ): ServiceOption {
    return {
      id: service.id,
      name: service.nameTemplate.replace('{material}', materialType),
      description: service.descriptionTemplate.replace('{material}', materialType),
      cost: service.costTemplate
        .replace('{price}', pricing.price)
        .replace('{currency}', pricing.currency),
      requirements: service.requirements,
      available: true
    };
  }

  public generateDialogue(
    poiType: string,
    culturalZone: CulturalZone,
    era: HistoricalEra,
    materialType: string = 'stone'
  ): WorkerDialogue {
    console.log('[POI Dialogue] Generating dialogue for:', {
      poiType,
      culturalZone,
      era,
      materialType
    });
    
    const template = this.findTemplate(poiType, culturalZone, era);
    
    if (!template) {
      console.log('[POI Dialogue] No template found, using fallback');
      // Fallback dialogue for unsupported combinations
      return {
        speaker: 'Worker',
        greeting: `What? This is a ${poiType}. Who are you again?`,
        services: [
          {
            id: 'buy',
            name: `Buy Materials`,
            description: 'Purchase what we produce',
            cost: 'Market rate',
            available: true
          },
          {
            id: 'sell',
            name: `Sell Materials`,
            description: 'Trade your goods for coin',
            cost: 'Market rate',
            available: true
          }
        ]
      };
    }
    
    console.log('[POI Dialogue] Template found:', template.type, template.culturalZone, template.era);

    const pricing = this.getPricing(culturalZone, era, poiType);
    
    // Generate dialogue
    const speaker = this.pickRandom(template.speakerTitles);
    const greeting = this.pickRandom(template.greetings);
    
    // Convert service templates to actual services
    const services = template.services.map(serviceTemplate => 
      this.substituteServiceVariables(serviceTemplate, materialType, pricing)
    );

    return {
      speaker,
      greeting,
      services
    };
  }

  public getAvailableCombinations(): Array<{
    type: string;
    culturalZone: CulturalZone;
    era: HistoricalEra;
  }> {
    return DIALOGUE_TEMPLATES.map(template => ({
      type: template.type,
      culturalZone: template.culturalZone,
      era: template.era
    }));
  }

  public generateRandomDialogue(): WorkerDialogue {
    const combinations = this.getAvailableCombinations();
    const randomCombo = this.pickRandom(combinations);
    
    return this.generateDialogue(
      randomCombo.type,
      randomCombo.culturalZone,
      randomCombo.era
    );
  }
}

export const poiDialogueService = new POIDialogueService();