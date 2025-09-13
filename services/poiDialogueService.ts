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
      "Stranger, you seek the sacred stone? I can help you.",
      "The spirits guide your path here. What do you need?",
      "These rocks hold ancient power. What would you have me craft?",
      "Welcome, traveler. The stone speaks of your coming.",
      "I have worked this quarry since the spring floods. How may I serve you?"
    ],
    services: [
      {
        id: 'buy_raw',
        nameTemplate: 'Purchase Raw {material}',
        descriptionTemplate: 'Unworked {material} stones, carefully selected',
        costTemplate: '{price} trade goods per piece',
        requirements: []
      },
      {
        id: 'commission_tools',
        nameTemplate: 'Commission {material} Tools',
        descriptionTemplate: 'Expertly knapped blades, points, and scrapers',
        costTemplate: '{price} goods + your materials',
        requirements: ['Good standing with tribe']
      },
      {
        id: 'learn_technique',
        nameTemplate: 'Learn Stone-Knapping',
        descriptionTemplate: 'Ancient knowledge of working stone',
        costTemplate: 'Time and respect for the craft',
        requirements: ['Intelligence 12+', 'Patience']
      },
      {
        id: 'blessing_tools',
        nameTemplate: 'Bless Weapons',
        descriptionTemplate: 'Ritual blessing for hunting tools',
        costTemplate: 'Sacred offerings + goodwill',
        requirements: ['Wisdom 10+']
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
      "The earth yields her treasures slowly. What do you seek?",
      "I know where the good clay hides. Perhaps we can trade.",
      "The copper veins run deep here. Are you a worker of metal?",
      "Welcome to the sacred diggings. The ancestors bless this work.",
      "These tunnels have fed our people for many seasons. What brings you?"
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
      "Good day to you! The wheel turns well today - perfect for grinding grain.",
      "Welcome to my mill. The stones are properly set and ready for your grain.",
      "God's blessing on you, traveler. What grain would you have ground?",
      "The water runs strong today - excellent milling weather. How may I serve?",
      "Step inside, friend. The mill is yours to use, for the proper fee."
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
      "The forest spirits have guided you here. What wood do you seek?",
      "Welcome to our grove. Each tree taken is honored with ceremony.",
      "I know every tree in this forest by its song. How may the wood serve you?",
      "The ancestors teach us to take only what is needed. What is your need?",
      "Good wood for good purposes - that is our way. What will you build?"
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
      "God save you, traveler. The lord's forest provides well this season.",
      "Welcome to the woodlands. Mind the forester's marks - some trees are reserved.",
      "Good timber for building, firewood for warmth - what's your need?",
      "The axe bites deep today. Looking for good oak or simple kindling?",
      "By the lord's grace, we harvest these woods. How may I serve?"
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
      "The mountain provides its bounty with wisdom. What wood speaks to your purpose?",
      "Welcome, friend. The trees grow straight and true here, perfect for building.",
      "Each tree has its destiny - in temple, home, or hearth. What is yours?",
      "The forest deity smiles upon our work today. How may I assist?",
      "Good wood, fairly cut, properly dried - this is our way."
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
      "Welcome to the mill! Steam saw's running hot - we can cut anything you need.",
      "Lumber company's working full shift today. What timber are you after?",
      "Fresh from the forest, straight to the saw. Best prices in the county!",
      "Railway ties, building lumber, furniture wood - we've got it all.",
      "The company mill never stops. How many board feet do you need?"
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
  private findTemplate(
    poiType: string,
    culturalZone: CulturalZone, 
    era: HistoricalEra
  ): DialogueTemplate | null {
    return DIALOGUE_TEMPLATES.find(
      template =>
        template.type === poiType &&
        template.culturalZone === culturalZone &&
        template.era === era
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
    const template = this.findTemplate(poiType, culturalZone, era);
    
    if (!template) {
      // Fallback dialogue for unsupported combinations
      return {
        speaker: 'Local Worker',
        greeting: `Welcome, traveler. I work this ${poiType} and can offer you services for fair payment.`,
        services: [
          {
            id: 'basic_service',
            name: `Use ${poiType} Services`,
            description: 'Basic processing and trade services',
            cost: '2-5 goods',
            available: true
          }
        ]
      };
    }

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