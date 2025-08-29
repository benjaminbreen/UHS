/**
 * Historical Quest Template System
 * Procedurally generates culturally and historically accurate quests
 */

import { HistoricalEra } from '../../types/ambiance';
import { CulturalZone } from '../../types/characterData';
import { GameModeType } from '../../types/eventTypes';
import { StructureType } from '../../types';

export interface QuestTemplate {
  id: string;
  category: QuestCategory;
  
  // Game mode compatibility
  availableInModes: GameModeType[] | 'all'; // 'all' means available in any mode
  modeSpecific: boolean; // false for general quests
  
  // Historical context
  eras: HistoricalEra[] | 'all';
  culturalZones: CulturalZone[] | 'all';
  
  // Template strings with placeholders
  titleTemplates: string[];
  descriptionTemplates: string[];
  
  // Required world features
  requiredStructures: StructureType[];
  optionalStructures?: StructureType[];
  
  // NPC roles that can give this quest
  questGiverRoles: string[];
  
  // Item transformations
  itemChains: ItemTransformation[];
  
  // Dialogue templates with spatial awareness
  dialogueTemplates: {
    initiation: string[];
    reminder: string[];
    completion: string[];
    failure?: string[];
  };
  
  // Procedural variation parameters
  variation: {
    distanceRange: [number, number]; // min/max tiles from quest giver
    timeLimit?: [number, number]; // min/max game hours
    rewardMultiplier: [number, number]; // reward variation
  };
}

export interface ItemTransformation {
  fromItem: string;
  toItem: string;
  requiredStructure?: StructureType;
  requiredAction?: string;
  culturalVariations: {
    [zone in CulturalZone]?: {
      fromName: string;
      toName: string;
      process?: string;
    };
  };
  eraVariations?: {
    [era in HistoricalEra]?: {
      fromName: string;
      toName: string;
    };
  };
}

export type QuestCategory = 
  | 'trade'
  | 'social' 
  | 'exploration'
  | 'survival'
  | 'religious'
  | 'military'
  | 'scholarly'
  | 'political'
  | 'economic'
  | 'medical'
  | 'crafting'
  | 'justice';

/**
 * Base items that exist across all eras/cultures with variations
 */
export const BASE_QUEST_ITEMS = {
  // Grains and processed foods
  GRAIN: {
    base: 'grain_bundle',
    cultural: {
      EUROPEAN: 'wheat_sheaf',
      MENA: 'barley_bundle',
      EAST_ASIAN: 'rice_sack',
      SOUTH_ASIAN: 'millet_basket',
      NORTH_AMERICAN_PRE_COLUMBIAN: 'maize_bundle',
      NORTH_AMERICAN_COLONIAL: 'corn_bushel',
      SOUTH_AMERICAN: 'quinoa_sack',
      SUB_SAHARAN_AFRICAN: 'sorghum_bundle',
      OCEANIC: 'taro_basket'
    }
  },
  FLOUR: {
    base: 'flour_sack',
    cultural: {
      EUROPEAN: 'wheat_flour',
      MENA: 'barley_flour',
      EAST_ASIAN: 'rice_powder',
      SOUTH_ASIAN: 'atta_flour',
      NORTH_AMERICAN_PRE_COLUMBIAN: 'cornmeal',
      NORTH_AMERICAN_COLONIAL: 'corn_flour',
      SOUTH_AMERICAN: 'cassava_flour',
      SUB_SAHARAN_AFRICAN: 'millet_flour',
      OCEANIC: 'breadfruit_flour'
    }
  },
  // Trade goods
  FABRIC: {
    base: 'cloth_bundle',
    cultural: {
      EUROPEAN: 'wool_cloth',
      MENA: 'cotton_fabric',
      EAST_ASIAN: 'silk_bolt',
      SOUTH_ASIAN: 'muslin_cloth',
      NORTH_AMERICAN_PRE_COLUMBIAN: 'woven_blanket',
      NORTH_AMERICAN_COLONIAL: 'linen_cloth',
      SOUTH_AMERICAN: 'alpaca_wool',
      SUB_SAHARAN_AFRICAN: 'kente_cloth',
      OCEANIC: 'tapa_cloth'
    }
  },
  MEDICINE: {
    base: 'medicine_bundle',
    cultural: {
      EUROPEAN: 'herb_poultice',
      MENA: 'medicinal_oils',
      EAST_ASIAN: 'herbal_remedy',
      SOUTH_ASIAN: 'ayurvedic_medicine',
      NORTH_AMERICAN_PRE_COLUMBIAN: 'healing_herbs',
      NORTH_AMERICAN_COLONIAL: 'apothecary_tonic',
      SOUTH_AMERICAN: 'coca_medicine',
      SUB_SAHARAN_AFRICAN: 'traditional_remedy',
      OCEANIC: 'kava_medicine'
    }
  }
};

/**
 * Universal quest templates that work across all eras and cultures
 */
export const UNIVERSAL_QUEST_TEMPLATES: QuestTemplate[] = [
  {
    id: 'mill_grain_delivery',
    category: 'economic',
    availableInModes: 'all',
    modeSpecific: false,
    eras: 'all',
    culturalZones: 'all',
    titleTemplates: [
      'Mill the {grain_type}',
      'Process {owner}\'s grain',
      'Urgent milling needed'
    ],
    descriptionTemplates: [
      '{giver} needs their {grain_type} milled into {flour_type}.',
      'The harvest is in and {giver} requires milling services.',
      '{giver}\'s family needs {flour_type} for the coming {season}.'
    ],
    requiredStructures: ['mill'],
    questGiverRoles: ['farmer', 'merchant', 'baker', 'villager'],
    itemChains: [
      {
        fromItem: 'grain_bundle',
        toItem: 'flour_sack',
        requiredStructure: 'mill',
        requiredAction: 'mill_grain',
        culturalVariations: {
          EUROPEAN: { fromName: 'wheat sheaf', toName: 'wheat flour', process: 'grinding at the watermill' },
          MENA: { fromName: 'barley bundle', toName: 'barley flour', process: 'stone grinding' },
          EAST_ASIAN: { fromName: 'rice sack', toName: 'rice powder', process: 'pounding in mortars' },
          SOUTH_ASIAN: { fromName: 'millet basket', toName: 'atta flour', process: 'chakki grinding' },
          NORTH_AMERICAN_PRE_COLUMBIAN: { fromName: 'maize bundle', toName: 'cornmeal', process: 'metate grinding' },
          SUB_SAHARAN_AFRICAN: { fromName: 'sorghum bundle', toName: 'sorghum flour', process: 'mortar pounding' }
        }
      }
    ],
    dialogueTemplates: {
      initiation: [
        'Take my {grain_type} to the {structure_description}. They\'ll know what to do.',
        'I need this {grain_type} milled. The {structure_description} should be able to help.',
        'Would you deliver this to the {structure_description}? I need it processed into {flour_type}.'
      ],
      reminder: [
        'Have you taken the {grain_type} to the {structure_description} yet?',
        'The {structure_description} is waiting for that {grain_type}.',
        'Please hurry with the milling, we need that {flour_type} soon.'
      ],
      completion: [
        'Excellent! This {flour_type} is perfectly milled. Here\'s your payment.',
        'Thank you for getting this done. The {flour_type} looks good.',
        'You\'ve saved us much trouble. Please accept this reward.'
      ]
    },
    variation: {
      distanceRange: [5, 20],
      rewardMultiplier: [0.8, 1.5]
    }
  },
  
  {
    id: 'fishing_delivery',
    category: 'trade',
    availableInModes: 'all',
    modeSpecific: false,
    eras: 'all',
    culturalZones: 'all',
    titleTemplates: [
      'Fresh fish delivery',
      'Transport the catch',
      '{owner}\'s fish order'
    ],
    descriptionTemplates: [
      'Deliver fresh fish from the {structure_description} to {destination}.',
      '{giver} has arranged for fish to be picked up and delivered.',
      'The day\'s catch needs to reach {destination} before it spoils.'
    ],
    requiredStructures: ['fishing_hut'],
    optionalStructures: ['marketplace', 'inn'],
    questGiverRoles: ['fisherman', 'merchant', 'innkeeper', 'cook'],
    itemChains: [
      {
        fromItem: 'fresh_fish',
        toItem: 'preserved_fish',
        requiredStructure: 'fishing_hut',
        requiredAction: 'preserve_fish',
        culturalVariations: {
          EUROPEAN: { fromName: 'fresh herring', toName: 'salted herring' },
          MENA: { fromName: 'fresh catch', toName: 'dried fish' },
          EAST_ASIAN: { fromName: 'fresh fish', toName: 'fermented fish' },
          SOUTH_ASIAN: { fromName: 'river fish', toName: 'fish curry base' },
          NORTH_AMERICAN_COLONIAL: { fromName: 'fresh cod', toName: 'salt cod' },
          SUB_SAHARAN_AFRICAN: { fromName: 'tilapia', toName: 'smoked fish' },
          OCEANIC: { fromName: 'reef fish', toName: 'dried fish' }
        }
      }
    ],
    dialogueTemplates: {
      initiation: [
        'I need someone to collect fish from the {structure_description} and bring them to {destination}.',
        'The fishermen at the {structure_description} have my order ready. Can you fetch it?',
        'Go to the {structure_description} and tell them I sent you for today\'s catch.'
      ],
      reminder: [
        'The fish will spoil if you don\'t hurry to the {structure_description}.',
        'Have you collected the fish from the {structure_description} yet?'
      ],
      completion: [
        'Fresh as promised! Here\'s your payment.',
        'Perfect timing, the fish are still fresh. Well done.'
      ]
    },
    variation: {
      distanceRange: [3, 15],
      timeLimit: [2, 6], // hours before fish spoil
      rewardMultiplier: [0.9, 1.3]
    }
  },
  
  {
    id: 'fortress_message',
    category: 'military',
    availableInModes: 'all',
    modeSpecific: false,
    eras: 'all',
    culturalZones: 'all',
    titleTemplates: [
      'Urgent military dispatch',
      'Fortress correspondence',
      'Guard captain\'s message'
    ],
    descriptionTemplates: [
      'Deliver this sealed message to the {structure_description}.',
      'The garrison at {structure_description} must receive this immediately.',
      'Carry these orders to the commander at {structure_description}.'
    ],
    requiredStructures: ['fortress'],
    questGiverRoles: ['guard', 'captain', 'noble', 'messenger'],
    itemChains: [
      {
        fromItem: 'sealed_message',
        toItem: 'response_letter',
        requiredStructure: 'fortress',
        culturalVariations: {
          EUROPEAN: { fromName: 'wax-sealed orders', toName: 'garrison response' },
          MENA: { fromName: 'sultan\'s decree', toName: 'commander\'s reply' },
          EAST_ASIAN: { fromName: 'imperial orders', toName: 'general\'s report' },
          SOUTH_ASIAN: { fromName: 'raja\'s command', toName: 'fort acknowledgment' },
          NORTH_AMERICAN_COLONIAL: { fromName: 'colonial dispatch', toName: 'fort status report' },
          SUB_SAHARAN_AFRICAN: { fromName: 'war chief\'s message', toName: 'warrior\'s response' }
        }
      }
    ],
    dialogueTemplates: {
      initiation: [
        'Take this sealed message to the {structure_description}. Do not open it.',
        'The commander at the {structure_description} awaits these orders. Make haste.',
        'This dispatch must reach the {structure_description} before sundown.'
      ],
      reminder: [
        'Why haven\'t you left for the {structure_description} yet? Time is critical!',
        'The {structure_description} still awaits that message.'
      ],
      completion: [
        'Good, the commander has sent his response. You\'ve done well.',
        'Your swift delivery may have saved lives. Take this reward.'
      ]
    },
    variation: {
      distanceRange: [10, 30],
      timeLimit: [3, 8],
      rewardMultiplier: [1.2, 2.0]
    }
  },
  
  {
    id: 'mine_ore_transport',
    category: 'economic',
    availableInModes: 'all',
    modeSpecific: false,
    eras: 'all',
    culturalZones: 'all',
    titleTemplates: [
      'Ore shipment needed',
      'Mining delivery',
      'Transport raw materials'
    ],
    descriptionTemplates: [
      'Collect ore samples from the {structure_description} for the assayer.',
      'The {structure_description} has materials ready for transport.',
      'Deliver mining equipment to the {structure_description} and bring back ore.'
    ],
    requiredStructures: ['mine'],
    optionalStructures: ['marketplace', 'fortress'],
    questGiverRoles: ['miner', 'merchant', 'blacksmith', 'assayer'],
    itemChains: [
      {
        fromItem: 'raw_ore',
        toItem: 'refined_metal',
        requiredStructure: 'mine',
        culturalVariations: {
          EUROPEAN: { fromName: 'iron ore', toName: 'iron ingots' },
          MENA: { fromName: 'copper ore', toName: 'copper bars' },
          EAST_ASIAN: { fromName: 'silver ore', toName: 'silver taels' },
          SOUTH_ASIAN: { fromName: 'precious stones', toName: 'cut gems' },
          NORTH_AMERICAN_COLONIAL: { fromName: 'coal', toName: 'processed coal' },
          SUB_SAHARAN_AFRICAN: { fromName: 'gold ore', toName: 'gold dust' },
          OCEANIC: { fromName: 'volcanic minerals', toName: 'refined minerals' }
        }
      }
    ],
    dialogueTemplates: {
      initiation: [
        'The {structure_description} has ore ready. Bring it back for processing.',
        'I need someone to check on the {structure_description} and collect today\'s yield.',
        'Take these tools to the {structure_description} and return with whatever they\'ve extracted.'
      ],
      reminder: [
        'The miners at the {structure_description} are waiting.',
        'We need that ore from the {structure_description} soon.'
      ],
      completion: [
        'Good haul from the {structure_description}. Here\'s your share.',
        'This ore will fetch a good price. Well done.'
      ]
    },
    variation: {
      distanceRange: [8, 25],
      rewardMultiplier: [1.0, 1.8]
    }
  }
];

/**
 * Era-specific quest templates
 */
export const ERA_SPECIFIC_TEMPLATES: Partial<Record<HistoricalEra, QuestTemplate[]>> = {
  [HistoricalEra.MEDIEVAL]: [
    {
      id: 'monastery_tithe',
      category: 'religious',
      availableInModes: 'all',
      modeSpecific: false,
      eras: [HistoricalEra.MEDIEVAL],
      culturalZones: ['EUROPEAN'],
      titleTemplates: [
        'Deliver tithes to the monastery',
        'Church tax collection',
        'Abbey provisions needed'
      ],
      descriptionTemplates: [
        'The monastery requires its monthly tithe of grain and goods.',
        'Deliver these offerings to the abbey for the brothers.',
        'The church expects its due from the harvest.'
      ],
      requiredStructures: ['holy_site'],
      questGiverRoles: ['priest', 'monk', 'farmer', 'noble'],
      itemChains: [
        {
          fromItem: 'tithe_bundle',
          toItem: 'blessing_scroll',
          requiredStructure: 'holy_site',
          culturalVariations: {
            EUROPEAN: { fromName: 'tithe offering', toName: 'blessed parchment' }
          }
        }
      ],
      dialogueTemplates: {
        initiation: [
          'Take these tithes to the {structure_description}. The brothers are expecting them.',
          'The {structure_description} requires its portion of the harvest. Deliver this.',
          'God\'s work requires earthly support. Bring this to the {structure_description}.'
        ],
        reminder: ['The monks at the {structure_description} await the tithe.'],
        completion: ['Bless you, child. The monastery is grateful for this offering.']
      },
      variation: {
        distanceRange: [5, 20],
        rewardMultiplier: [0.5, 1.0] // Religious quests give less material reward
      }
    },
    {
      id: 'plague_medicine',
      category: 'medical',
      availableInModes: ['survival'],
      modeSpecific: false,
      eras: [HistoricalEra.MEDIEVAL],
      culturalZones: ['EUROPEAN', 'MENA'],
      titleTemplates: [
        'Plague remedies urgently needed',
        'Medicine for the sick',
        'Herb collection for pestilence'
      ],
      descriptionTemplates: [
        'The plague has struck {destination}. They need medicine immediately.',
        'Collect herbs and deliver them to the afflicted at {destination}.',
        'The sick at {destination} require remedies against the pestilence.'
      ],
      requiredStructures: [],
      optionalStructures: ['holy_site', 'marketplace'],
      questGiverRoles: ['physician', 'priest', 'herbalist', 'noble'],
      itemChains: [
        {
          fromItem: 'medicinal_herbs',
          toItem: 'plague_remedy',
          culturalVariations: {
            EUROPEAN: { fromName: 'wormwood and sage', toName: 'plague poultice' },
            MENA: { fromName: 'frankincense and myrrh', toName: 'medicinal incense' }
          }
        }
      ],
      dialogueTemplates: {
        initiation: [
          'The pestilence spreads! Take these herbs to {destination} immediately.',
          'God help us, the plague is at {destination}. Bring them these remedies.',
          'The sick at {destination} need medicine. Hurry before it\'s too late.'
        ],
        reminder: ['People are dying at {destination}! Deliver the medicine!'],
        completion: ['You may have saved lives today. God bless you.']
      },
      variation: {
        distanceRange: [3, 15],
        timeLimit: [2, 4],
        rewardMultiplier: [1.5, 2.5]
      }
    }
  ],
  
  [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
    {
      id: 'guild_masterpiece',
      category: 'crafting',
      availableInModes: ['commerce', 'livelihood'],
      modeSpecific: false,
      eras: [HistoricalEra.RENAISSANCE_EARLY_MODERN],
      culturalZones: ['EUROPEAN'],
      titleTemplates: [
        'Guild commission',
        'Masterwork delivery',
        'Artisan\'s request'
      ],
      descriptionTemplates: [
        'The guild requires a masterpiece delivered to {destination}.',
        'Transport this commissioned work to the patron at {destination}.',
        'This artisan\'s creation must reach {destination} safely.'
      ],
      requiredStructures: ['marketplace'],
      questGiverRoles: ['artisan', 'guild_master', 'merchant', 'noble'],
      itemChains: [
        {
          fromItem: 'raw_materials',
          toItem: 'finished_goods',
          requiredStructure: 'marketplace',
          culturalVariations: {
            EUROPEAN: { fromName: 'fine materials', toName: 'guild masterpiece' }
          }
        }
      ],
      dialogueTemplates: {
        initiation: [
          'The guild has finished this commission. Deliver it to {destination}.',
          'This masterwork must reach the patron at {destination} intact.',
          'Transport this carefully to {destination}. The guild\'s reputation depends on it.'
        ],
        reminder: ['The patron at {destination} grows impatient for their commission.'],
        completion: ['Excellent! The guild\'s reputation remains intact. Your payment.']
      },
      variation: {
        distanceRange: [10, 25],
        rewardMultiplier: [1.5, 2.5]
      }
    }
  ],
  
  [HistoricalEra.INDUSTRIAL_ERA]: [
    {
      id: 'factory_supply_chain',
      category: 'economic',
      availableInModes: ['commerce', 'livelihood'],
      modeSpecific: false,
      eras: [HistoricalEra.INDUSTRIAL_ERA],
      culturalZones: ['EUROPEAN', 'NORTH_AMERICAN_COLONIAL'],
      titleTemplates: [
        'Factory supply delivery',
        'Industrial materials transport',
        'Manufacturing supplies needed'
      ],
      descriptionTemplates: [
        'The factory at {destination} needs raw materials from the {structure_description}.',
        'Transport coal and iron to the manufactory at {destination}.',
        'Industrial supplies must reach the {destination} before the shift change.'
      ],
      requiredStructures: ['mine'],
      optionalStructures: ['marketplace'],
      questGiverRoles: ['foreman', 'industrialist', 'engineer', 'merchant'],
      itemChains: [
        {
          fromItem: 'raw_materials',
          toItem: 'manufactured_goods',
          culturalVariations: {
            EUROPEAN: { fromName: 'coal and iron', toName: 'steel products' },
            NORTH_AMERICAN_COLONIAL: { fromName: 'raw cotton', toName: 'textile goods' }
          }
        }
      ],
      dialogueTemplates: {
        initiation: [
          'The factory needs supplies from the {structure_description}. Time is money.',
          'Transport these materials to the manufactory at {destination}.',
          'The production line at {destination} awaits these supplies.'
        ],
        reminder: ['The factory at {destination} has stopped production waiting for supplies!'],
        completion: ['Good, production can resume. Here\'s your wages.']
      },
      variation: {
        distanceRange: [15, 35],
        timeLimit: [4, 8],
        rewardMultiplier: [1.2, 2.0]
      }
    }
  ]
};

/**
 * Culture-specific quest templates
 */
export const CULTURE_SPECIFIC_TEMPLATES: Partial<Record<CulturalZone, QuestTemplate[]>> = {
  EAST_ASIAN: [
    {
      id: 'tea_ceremony_supplies',
      category: 'social',
      availableInModes: 'all',
      modeSpecific: false,
      eras: 'all',
      culturalZones: ['EAST_ASIAN'],
      titleTemplates: [
        'Tea ceremony preparations',
        'Deliver ceremonial items',
        'Tea master\'s request'
      ],
      descriptionTemplates: [
        'The tea master at {destination} requires special items for a ceremony.',
        'Deliver these ceremonial goods for an important tea gathering.',
        'A tea ceremony at {destination} cannot proceed without these items.'
      ],
      requiredStructures: [],
      optionalStructures: ['marketplace', 'holy_site'],
      questGiverRoles: ['tea_master', 'noble', 'merchant', 'monk'],
      itemChains: [
        {
          fromItem: 'tea_leaves',
          toItem: 'prepared_tea',
          culturalVariations: {
            EAST_ASIAN: { fromName: 'fresh tea leaves', toName: 'ceremonial tea' }
          }
        }
      ],
      dialogueTemplates: {
        initiation: [
          'The tea ceremony at {destination} requires these items. Handle them with care.',
          'Deliver this to the tea house at {destination}. They await your arrival.',
          'These ceremonial items must reach {destination} for tomorrow\'s gathering.'
        ],
        reminder: ['The tea master at {destination} cannot begin without those items.'],
        completion: ['Your punctuality honors us. The ceremony can proceed.']
      },
      variation: {
        distanceRange: [5, 15],
        rewardMultiplier: [1.0, 1.5]
      }
    }
  ],
  
  MENA: [
    {
      id: 'caravan_escort',
      category: 'trade',
      availableInModes: ['commerce', 'exploration'],
      modeSpecific: false,
      eras: 'all',
      culturalZones: ['MENA'],
      titleTemplates: [
        'Caravan guard needed',
        'Desert trade escort',
        'Merchant protection'
      ],
      descriptionTemplates: [
        'Escort the caravan safely to {destination} through the desert.',
        'The merchants need protection on the route to {destination}.',
        'Guard these goods on the journey to {destination}.'
      ],
      requiredStructures: ['marketplace'],
      questGiverRoles: ['caravan_master', 'merchant', 'trader'],
      itemChains: [
        {
          fromItem: 'trade_goods',
          toItem: 'payment_receipt',
          culturalVariations: {
            MENA: { fromName: 'spices and silks', toName: 'merchant\'s payment' }
          }
        }
      ],
      dialogueTemplates: {
        initiation: [
          'The caravan to {destination} needs guards. The desert holds many dangers.',
          'Join our caravan to {destination}. We pay well for protection.',
          'The road to {destination} is treacherous. We need your sword.'
        ],
        reminder: ['The caravan to {destination} leaves soon. Do not delay.'],
        completion: ['We arrived safely thanks to you. Here is your payment, as promised.']
      },
      variation: {
        distanceRange: [20, 50],
        timeLimit: [12, 24],
        rewardMultiplier: [2.0, 3.5]
      }
    }
  ],
  
  NORTH_AMERICAN_PRE_COLUMBIAN: [
    {
      id: 'tribal_messenger',
      category: 'political',
      availableInModes: 'all',
      modeSpecific: false,
      eras: [HistoricalEra.PREHISTORY, HistoricalEra.ANTIQUITY, HistoricalEra.MEDIEVAL],
      culturalZones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
      titleTemplates: [
        'Tribal message',
        'Council summons',
        'Peace offering delivery'
      ],
      descriptionTemplates: [
        'Deliver this message to the council at {destination}.',
        'Carry this peace offering to the tribe at {destination}.',
        'The elders at {destination} must receive this immediately.'
      ],
      requiredStructures: [],
      questGiverRoles: ['chief', 'elder', 'warrior', 'shaman'],
      itemChains: [
        {
          fromItem: 'wampum_belt',
          toItem: 'treaty_agreement',
          culturalVariations: {
            NORTH_AMERICAN_PRE_COLUMBIAN: { fromName: 'wampum message', toName: 'peace agreement' }
          }
        }
      ],
      dialogueTemplates: {
        initiation: [
          'Take this wampum to the council at {destination}. It carries important words.',
          'The tribe at {destination} awaits this message. Travel swiftly.',
          'This offering must reach {destination} before the new moon.'
        ],
        reminder: ['The council at {destination} still waits for the message.'],
        completion: ['The message was received with honor. The council sends their thanks.']
      },
      variation: {
        distanceRange: [10, 30],
        rewardMultiplier: [1.0, 2.0]
      }
    }
  ]
};

/**
 * Procedural quest generator that combines templates with context
 */
export class ProceduralQuestGenerator {
  /**
   * Generate a quest based on current context
   */
  static generateQuest(
    era: HistoricalEra,
    culturalZone: CulturalZone,
    gameMode: GameModeType,
    availableStructures: StructureType[],
    availableNPCs: any[],
    playerLocation: { x: number; y: number }
  ): QuestTemplate | null {
    // Find applicable templates
    const applicableTemplates = this.findApplicableTemplates(
      era,
      culturalZone,
      gameMode,
      availableStructures
    );
    
    if (applicableTemplates.length === 0) return null;
    
    // Select random template
    const template = applicableTemplates[Math.floor(Math.random() * applicableTemplates.length)];
    
    // Apply procedural variations
    return this.applyVariations(template, era, culturalZone);
  }
  
  /**
   * Find all templates that match current context
   */
  static findApplicableTemplates(
    era: HistoricalEra,
    culturalZone: CulturalZone,
    gameMode: GameModeType,
    availableStructures: StructureType[]
  ): QuestTemplate[] {
    const templates: QuestTemplate[] = [];
    
    // Check universal templates
    for (const template of UNIVERSAL_QUEST_TEMPLATES) {
      if (this.isTemplateApplicable(template, era, culturalZone, gameMode, availableStructures)) {
        templates.push(template);
      }
    }
    
    // Check era-specific templates
    const eraTemplates = ERA_SPECIFIC_TEMPLATES[era] || [];
    for (const template of eraTemplates) {
      if (this.isTemplateApplicable(template, era, culturalZone, gameMode, availableStructures)) {
        templates.push(template);
      }
    }
    
    // Check culture-specific templates
    const cultureTemplates = CULTURE_SPECIFIC_TEMPLATES[culturalZone] || [];
    for (const template of cultureTemplates) {
      if (this.isTemplateApplicable(template, era, culturalZone, gameMode, availableStructures)) {
        templates.push(template);
      }
    }
    
    return templates;
  }
  
  /**
   * Check if a template is applicable in current context
   */
  static isTemplateApplicable(
    template: QuestTemplate,
    era: HistoricalEra,
    culturalZone: CulturalZone,
    gameMode: GameModeType,
    availableStructures: StructureType[]
  ): boolean {
    // Check game mode
    if (template.availableInModes !== 'all' && !template.availableInModes.includes(gameMode)) {
      return false;
    }
    
    // Check era
    if (template.eras !== 'all' && !template.eras.includes(era)) {
      return false;
    }
    
    // Check cultural zone
    if (template.culturalZones !== 'all' && !template.culturalZones.includes(culturalZone)) {
      return false;
    }
    
    // Check required structures
    for (const required of template.requiredStructures) {
      if (!availableStructures.includes(required)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Apply procedural variations to template
   */
  static applyVariations(
    template: QuestTemplate,
    era: HistoricalEra,
    culturalZone: CulturalZone
  ): QuestTemplate {
    const varied = { ...template };
    
    // Apply cultural variations to items
    varied.itemChains = template.itemChains.map(chain => {
      const culturalVar = chain.culturalVariations[culturalZone];
      const eraVar = chain.eraVariations?.[era];
      
      return {
        ...chain,
        fromItem: culturalVar?.fromName || eraVar?.fromName || chain.fromItem,
        toItem: culturalVar?.toName || eraVar?.toName || chain.toItem
      };
    });
    
    // Vary distance based on era (longer distances in modern eras)
    const eraMultiplier = {
      [HistoricalEra.PREHISTORY]: 0.5,
      [HistoricalEra.ANTIQUITY]: 0.7,
      [HistoricalEra.MEDIEVAL]: 1.0,
      [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 1.2,
      [HistoricalEra.INDUSTRIAL_ERA]: 1.5,
      [HistoricalEra.MODERN_ERA]: 2.0,
      [HistoricalEra.FUTURE_ERA]: 2.5
    };
    
    const mult = eraMultiplier[era] || 1.0;
    varied.variation.distanceRange = [
      Math.floor(varied.variation.distanceRange[0] * mult),
      Math.floor(varied.variation.distanceRange[1] * mult)
    ];
    
    return varied;
  }
}