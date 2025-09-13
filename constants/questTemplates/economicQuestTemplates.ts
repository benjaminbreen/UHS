/**
 * Economic Quest Templates
 * Dynamic quest templates that respond to market conditions and crises
 */

import { Quest, QuestObjective, QuestReward } from '../../types/questTypes';
import { CrisisPattern } from '../../services/crisisDetectionService';
import { TradeGood } from '../../services/tradeService';

export interface EconomicQuestTemplate {
  id: string;
  type: 'scarcity' | 'surplus' | 'crisis' | 'arbitrage' | 'supply_chain' | 'protection';
  title: string;
  descriptionTemplate: string;
  objectiveTemplates: Array<{
    type: QuestObjective['type'];
    descriptionTemplate: string;
    targetAmount?: number;
    targetItem?: string;
  }>;
  rewardTemplates: Array<{
    type: QuestReward['type'];
    amountFormula?: string; // e.g., "basePrice * 2"
    description?: string;
  }>;
  triggerConditions: {
    minScarcity?: number; // Item quantity threshold
    maxSurplus?: number; // Item quantity threshold
    requiredCrisis?: string[]; // Crisis IDs that trigger this
    priceRatio?: number; // Price difference threshold
  };
  priority: number; // 1-5, higher = more important
}

// Crisis-specific quest templates
export const CRISIS_QUEST_TEMPLATES: Record<string, EconomicQuestTemplate[]> = {
  'raiders': [
    {
      id: 'defend_caravan',
      type: 'protection',
      title: 'Escort the Supply Caravan',
      descriptionTemplate: '{merchant} needs protection for a vital supply caravan. The {crisis} have made travel dangerous.',
      objectiveTemplates: [
        {
          type: 'escort',
          descriptionTemplate: 'Escort the caravan to {destination}',
        },
        {
          type: 'combat',
          descriptionTemplate: 'Defend against any attacks',
        }
      ],
      rewardTemplates: [
        {
          type: 'currency',
          amountFormula: '150',
          description: '150 coins for protection services'
        },
        {
          type: 'reputation',
          amountFormula: '20',
          description: 'Merchant reputation +20'
        }
      ],
      triggerConditions: {
        requiredCrisis: ['raiders', 'bandits']
      },
      priority: 4
    },
    {
      id: 'supply_weapons',
      type: 'crisis',
      title: 'Urgent: Weapons Needed',
      descriptionTemplate: 'With {crisis} threatening the area, {merchant} desperately needs weapons for the town guard.',
      objectiveTemplates: [
        {
          type: 'collect_item',
          descriptionTemplate: 'Deliver {amount} weapons',
          targetAmount: 5,
          targetItem: 'weapon'
        }
      ],
      rewardTemplates: [
        {
          type: 'currency',
          amountFormula: 'basePrice * 3',
          description: 'Triple market price'
        }
      ],
      triggerConditions: {
        requiredCrisis: ['raiders', 'war', 'rebellion']
      },
      priority: 5
    },
    {
      id: 'bandit_negotiation',
      type: 'crisis',
      title: 'Unusual Request',
      descriptionTemplate: 'A shadowy figure approaches. The {crisis} are willing to pay handsomely for {item}... no questions asked.',
      objectiveTemplates: [
        {
          type: 'moral_choice',
          descriptionTemplate: 'Decide whether to help the bandits',
        },
        {
          type: 'deliver_item',
          descriptionTemplate: 'Deliver {amount} {item} to the specified location',
          targetAmount: 3
        }
      ],
      rewardTemplates: [
        {
          type: 'currency',
          amountFormula: 'basePrice * 4',
          description: 'Quadruple market price'
        },
        {
          type: 'reputation',
          amountFormula: '-15',
          description: 'Merchant reputation -15 (if discovered)'
        }
      ],
      triggerConditions: {
        requiredCrisis: ['raiders', 'bandits']
      },
      priority: 3
    }
  ],
  
  'drought': [
    {
      id: 'find_water_source',
      type: 'crisis',
      title: 'Desperate for Water',
      descriptionTemplate: 'The {crisis} has dried up all water sources. {merchant} will pay anything for clean water.',
      objectiveTemplates: [
        {
          type: 'collect_item',
          descriptionTemplate: 'Find and deliver {amount} units of water',
          targetAmount: 10,
          targetItem: 'water'
        }
      ],
      rewardTemplates: [
        {
          type: 'currency',
          amountFormula: '100',
          description: '100 coins'
        },
        {
          type: 'item',
          description: 'Rare desert survival gear'
        }
      ],
      triggerConditions: {
        requiredCrisis: ['drought']
      },
      priority: 5
    },
    {
      id: 'emergency_food_delivery',
      type: 'crisis',
      title: 'Famine Relief',
      descriptionTemplate: 'People are starving due to the {crisis}. {merchant} is organizing emergency food distribution.',
      objectiveTemplates: [
        {
          type: 'collect_item',
          descriptionTemplate: 'Gather {amount} units of any food',
          targetAmount: 20,
          targetItem: 'food'
        },
        {
          type: 'deliver_item',
          descriptionTemplate: 'Distribute to the affected areas'
        }
      ],
      rewardTemplates: [
        {
          type: 'reputation',
          amountFormula: '50',
          description: 'Hero reputation +50'
        },
        {
          type: 'currency',
          amountFormula: '75',
          description: '75 coins'
        }
      ],
      triggerConditions: {
        requiredCrisis: ['drought', 'harvest_failure', 'floods']
      },
      priority: 5
    }
  ],
  
  'plague': [
    {
      id: 'medicine_quest',
      type: 'crisis',
      title: 'Medicine Desperately Needed',
      descriptionTemplate: 'The {crisis} is spreading rapidly. {merchant} needs medicine immediately or many will die.',
      objectiveTemplates: [
        {
          type: 'collect_item',
          descriptionTemplate: 'Find {amount} units of medicine or herbs',
          targetAmount: 8,
          targetItem: 'medicine'
        }
      ],
      rewardTemplates: [
        {
          type: 'currency',
          amountFormula: 'basePrice * 5',
          description: 'Five times market price'
        },
        {
          type: 'reputation',
          amountFormula: '30',
          description: 'Healer reputation +30'
        }
      ],
      triggerConditions: {
        requiredCrisis: ['plague', 'disease']
      },
      priority: 5
    },
    {
      id: 'quarantine_supplies',
      type: 'crisis',
      title: 'Quarantine Supplies',
      descriptionTemplate: 'With the {crisis} spreading, {merchant} needs supplies for those in quarantine.',
      objectiveTemplates: [
        {
          type: 'collect_item',
          descriptionTemplate: 'Gather {amount} units of food',
          targetAmount: 15,
          targetItem: 'food'
        },
        {
          type: 'collect_item',
          descriptionTemplate: 'Gather {amount} units of clean water',
          targetAmount: 10,
          targetItem: 'water'
        }
      ],
      rewardTemplates: [
        {
          type: 'currency',
          amountFormula: '200',
          description: '200 coins hazard pay'
        }
      ],
      triggerConditions: {
        requiredCrisis: ['plague', 'disease']
      },
      priority: 4
    }
  ],
  
  'rebellion': [
    {
      id: 'smuggle_supplies',
      type: 'crisis',
      title: 'Smuggling Run',
      descriptionTemplate: 'The {crisis} has cut off supply lines. {merchant} needs someone to smuggle in vital goods.',
      objectiveTemplates: [
        {
          type: 'stealth',
          descriptionTemplate: 'Avoid detection by authorities'
        },
        {
          type: 'deliver_item',
          descriptionTemplate: 'Smuggle {amount} units of {item}',
          targetAmount: 10
        }
      ],
      rewardTemplates: [
        {
          type: 'currency',
          amountFormula: 'basePrice * 3',
          description: 'Triple hazard pay'
        },
        {
          type: 'item',
          description: 'Smuggler\'s tools'
        }
      ],
      triggerConditions: {
        requiredCrisis: ['rebellion', 'civil_war']
      },
      priority: 4
    },
    {
      id: 'choose_side',
      type: 'crisis',
      title: 'A Matter of Loyalty',
      descriptionTemplate: 'With the {crisis} intensifying, {merchant} wants to know whose side you\'re on.',
      objectiveTemplates: [
        {
          type: 'moral_choice',
          descriptionTemplate: 'Choose to support rebels or loyalists'
        },
        {
          type: 'deliver_item',
          descriptionTemplate: 'Deliver supplies to your chosen faction',
          targetAmount: 5
        }
      ],
      rewardTemplates: [
        {
          type: 'reputation',
          amountFormula: '40',
          description: 'Faction reputation +40'
        },
        {
          type: 'currency',
          amountFormula: '100'
        }
      ],
      triggerConditions: {
        requiredCrisis: ['rebellion']
      },
      priority: 3
    }
  ]
};

// Scarcity-based quest templates (triggered by low stock)
export const SCARCITY_QUEST_TEMPLATES: EconomicQuestTemplate[] = [
  {
    id: 'urgent_resupply',
    type: 'scarcity',
    title: 'Urgent Resupply Needed',
    descriptionTemplate: '{merchant} is almost out of {item}. The shortage is causing panic among customers.',
    objectiveTemplates: [
      {
        type: 'collect_item',
        descriptionTemplate: 'Find and deliver {amount} units of {item}',
        targetAmount: 5
      }
    ],
    rewardTemplates: [
      {
        type: 'currency',
        amountFormula: 'basePrice * 2.5',
        description: 'Premium price for urgent delivery'
      },
      {
        type: 'reputation',
        amountFormula: '15'
      }
    ],
    triggerConditions: {
      minScarcity: 3 // Triggers when item quantity < 3
    },
    priority: 4
  },
  {
    id: 'find_alternative_source',
    type: 'scarcity',
    title: 'Find Alternative Supplier',
    descriptionTemplate: 'With {item} running critically low, {merchant} needs you to find a new supplier.',
    objectiveTemplates: [
      {
        type: 'investigate',
        descriptionTemplate: 'Search nearby settlements for {item} suppliers'
      },
      {
        type: 'negotiate',
        descriptionTemplate: 'Negotiate a supply deal'
      }
    ],
    rewardTemplates: [
      {
        type: 'currency',
        amountFormula: '150',
        description: 'Finder\'s fee'
      },
      {
        type: 'unlock',
        description: 'Unlock new trade route'
      }
    ],
    triggerConditions: {
      minScarcity: 2
    },
    priority: 3
  }
];

// Surplus-based quest templates (triggered by high stock)
export const SURPLUS_QUEST_TEMPLATES: EconomicQuestTemplate[] = [
  {
    id: 'bulk_delivery',
    type: 'surplus',
    title: 'Bulk Delivery Contract',
    descriptionTemplate: '{merchant} has too much {item} in stock. Help deliver the surplus to {destination}.',
    objectiveTemplates: [
      {
        type: 'deliver_item',
        descriptionTemplate: 'Transport {amount} units of {item} to {destination}',
        targetAmount: 20
      }
    ],
    rewardTemplates: [
      {
        type: 'currency',
        amountFormula: 'basePrice * quantity * 0.3',
        description: 'Delivery commission'
      }
    ],
    triggerConditions: {
      maxSurplus: 50 // Triggers when item quantity > 50
    },
    priority: 2
  },
  {
    id: 'market_promotion',
    type: 'surplus',
    title: 'Help Clear Inventory',
    descriptionTemplate: '{merchant}\'s warehouse is overflowing with {item}. Help find buyers.',
    objectiveTemplates: [
      {
        type: 'social',
        descriptionTemplate: 'Convince {amount} NPCs to buy {item}',
        targetAmount: 5
      }
    ],
    rewardTemplates: [
      {
        type: 'currency',
        amountFormula: '50',
        description: 'Sales commission'
      },
      {
        type: 'item',
        description: 'Free sample of surplus goods'
      }
    ],
    triggerConditions: {
      maxSurplus: 40
    },
    priority: 2
  }
];

// Arbitrage quest templates (price differences between markets)
export const ARBITRAGE_QUEST_TEMPLATES: EconomicQuestTemplate[] = [
  {
    id: 'price_arbitrage',
    type: 'arbitrage',
    title: 'Profitable Trade Route',
    descriptionTemplate: '{merchant} has discovered {item} is selling for much less in {source}. Bring some back for profit.',
    objectiveTemplates: [
      {
        type: 'travel',
        descriptionTemplate: 'Travel to {source} market'
      },
      {
        type: 'trade',
        descriptionTemplate: 'Buy {amount} units of {item} at low price',
        targetAmount: 10
      },
      {
        type: 'deliver_item',
        descriptionTemplate: 'Return and sell for profit'
      }
    ],
    rewardTemplates: [
      {
        type: 'currency',
        amountFormula: 'priceDifference * 0.5',
        description: 'Share of profits'
      },
      {
        type: 'unlock',
        description: 'Permanent trade route discount'
      }
    ],
    triggerConditions: {
      priceRatio: 1.5 // Triggers when price difference > 50%
    },
    priority: 3
  }
];

// Supply chain quest templates
export const SUPPLY_CHAIN_QUEST_TEMPLATES: EconomicQuestTemplate[] = [
  {
    id: 'missing_ingredient',
    type: 'supply_chain',
    title: 'Production Halted',
    descriptionTemplate: '{merchant} can\'t produce {product} without {ingredient}. The entire supply chain is breaking down.',
    objectiveTemplates: [
      {
        type: 'collect_item',
        descriptionTemplate: 'Find {amount} units of {ingredient}',
        targetAmount: 8
      }
    ],
    rewardTemplates: [
      {
        type: 'currency',
        amountFormula: 'basePrice * 2',
        description: 'Double market price'
      },
      {
        type: 'item',
        description: 'Free {product} once production resumes'
      }
    ],
    triggerConditions: {
      minScarcity: 0 // When ingredient is completely out
    },
    priority: 4
  },
  {
    id: 'establish_supply_chain',
    type: 'supply_chain',
    title: 'Establish Supply Chain',
    descriptionTemplate: '{merchant} wants to start producing {product} but needs reliable suppliers for materials.',
    objectiveTemplates: [
      {
        type: 'investigate',
        descriptionTemplate: 'Find suppliers for each required material'
      },
      {
        type: 'negotiate',
        descriptionTemplate: 'Negotiate supply contracts'
      },
      {
        type: 'deliver_item',
        descriptionTemplate: 'Deliver initial batch of materials',
        targetAmount: 5
      }
    ],
    rewardTemplates: [
      {
        type: 'currency',
        amountFormula: '300',
        description: 'Setup bonus'
      },
      {
        type: 'reputation',
        amountFormula: '25'
      },
      {
        type: 'unlock',
        description: 'Permanent discount on {product}'
      }
    ],
    triggerConditions: {},
    priority: 3
  }
];

/**
 * Get all applicable quest templates for current conditions
 */
export function getApplicableQuestTemplates(
  crisis?: CrisisPattern,
  scarcityItems?: Array<{ itemId: string; quantity: number }>,
  surplusItems?: Array<{ itemId: string; quantity: number }>,
  priceDiscrepancies?: Array<{ itemId: string; localPrice: number; remotePrice: number }>
): EconomicQuestTemplate[] {
  const templates: EconomicQuestTemplate[] = [];
  
  // Add crisis-specific quests
  if (crisis) {
    const crisisQuests = CRISIS_QUEST_TEMPLATES[crisis.id];
    if (crisisQuests) {
      templates.push(...crisisQuests);
    }
  }
  
  // Add scarcity quests
  if (scarcityItems) {
    scarcityItems.forEach(item => {
      SCARCITY_QUEST_TEMPLATES.forEach(template => {
        if (template.triggerConditions.minScarcity && 
            item.quantity <= template.triggerConditions.minScarcity) {
          templates.push(template);
        }
      });
    });
  }
  
  // Add surplus quests
  if (surplusItems) {
    surplusItems.forEach(item => {
      SURPLUS_QUEST_TEMPLATES.forEach(template => {
        if (template.triggerConditions.maxSurplus && 
            item.quantity >= template.triggerConditions.maxSurplus) {
          templates.push(template);
        }
      });
    });
  }
  
  // Add arbitrage quests
  if (priceDiscrepancies) {
    priceDiscrepancies.forEach(discrepancy => {
      const ratio = discrepancy.remotePrice / discrepancy.localPrice;
      ARBITRAGE_QUEST_TEMPLATES.forEach(template => {
        if (template.triggerConditions.priceRatio && 
            ratio >= template.triggerConditions.priceRatio) {
          templates.push(template);
        }
      });
    });
  }
  
  // Add supply chain quests (always available)
  templates.push(...SUPPLY_CHAIN_QUEST_TEMPLATES);
  
  // Sort by priority
  return templates.sort((a, b) => b.priority - a.priority);
}

/**
 * Generate a quest from a template
 */
export function generateQuestFromTemplate(
  template: EconomicQuestTemplate,
  merchantName: string,
  itemName?: string,
  location?: { x: number; y: number },
  basePrice?: number
): Partial<Quest> {
  // Replace template variables
  const replaceVars = (text: string) => {
    return text
      .replace('{merchant}', merchantName)
      .replace('{item}', itemName || 'goods')
      .replace('{product}', itemName || 'goods')
      .replace('{ingredient}', 'materials')
      .replace('{crisis}', 'current crisis')
      .replace('{destination}', 'nearby settlement')
      .replace('{source}', 'distant market')
      .replace('{amount}', '10');
  };
  
  const objectives: QuestObjective[] = template.objectiveTemplates.map((objTemplate, idx) => {
    // Normalize item IDs for consistent checking
    const normalizedItem = (objTemplate.targetItem || itemName || '').toLowerCase().replace(/\s+/g, '_');
    
    return {
      id: `obj_${idx}`,
      type: objTemplate.type,
      description: replaceVars(objTemplate.descriptionTemplate),
      targetAmount: objTemplate.targetAmount,
      targetItem: normalizedItem,  // Normalized for checking
      itemId: normalizedItem,       // Also normalized
      quantity: objTemplate.targetAmount || 1,
      targetLocation: location,
      completed: false
    } as QuestObjective;
  });
  
  const rewards: QuestReward[] = template.rewardTemplates.map(rewardTemplate => {
    let amount = 100; // default
    if (rewardTemplate.amountFormula) {
      // Simple formula evaluation (in production, use a safe math parser)
      if (rewardTemplate.amountFormula.includes('basePrice')) {
        amount = (basePrice || 50) * 2;
      } else if (rewardTemplate.amountFormula.includes('*')) {
        const parts = rewardTemplate.amountFormula.split('*');
        amount = parseInt(parts[0]) * (parseInt(parts[1]) || 1);
      } else {
        amount = parseInt(rewardTemplate.amountFormula) || 100;
      }
    }
    
    return {
      type: rewardTemplate.type,
      amount,
      description: rewardTemplate.description || `${amount} coins`
    };
  });
  
  return {
    id: `quest_${template.id}_${Date.now()}`,
    title: replaceVars(template.title),
    description: replaceVars(template.descriptionTemplate),
    category: template.type === 'protection' ? 'combat' : 'trade',
    objectives,
    currentObjectiveIndex: 0,
    rewards,
    giver: merchantName,
    giverLocation: location,
    startLocation: location,
    status: 'available',
    isEconomicQuest: true
  };
}