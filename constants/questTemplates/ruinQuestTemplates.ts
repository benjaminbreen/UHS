/**
 * Ruin Exploration Quest Templates
 * Era-specific quest templates for exploring ruins and retrieving relics
 */

import { Quest, QuestObjective, QuestReward } from '../../types/questTypes';
import { HistoricalEra } from '../../types/characterData';

export interface RuinQuestTemplate {
  id: string;
  type: 'exploration' | 'retrieval' | 'investigation' | 'preservation';
  title: string;
  descriptionTemplate: string;
  objectiveTemplates: Array<{
    type: QuestObjective['type'];
    descriptionTemplate: string;
    targetAmount?: number;
  }>;
  rewardTemplates: Array<{
    type: QuestReward['type'];
    amount?: number;
    description?: string;
  }>;
  applicableEras: HistoricalEra[];
  priority: number;
}

/**
 * Automatic ruin entry quests by era
 */
export const RUIN_ENTRY_QUESTS: Record<HistoricalEra, RuinQuestTemplate[]> = {
  'Ancient': [
    {
      id: 'ancient_explore_sacred',
      type: 'exploration',
      title: 'Sacred Ground',
      descriptionTemplate: 'You have entered the ruins of {ruinType}. The ancients who built this place left it for a reason. Explore carefully and see what remains.',
      objectiveTemplates: [
        {
          type: 'explore_area',
          descriptionTemplate: 'Search the ruins thoroughly'
        },
        {
          type: 'collect_item',
          descriptionTemplate: 'Find any remaining artifacts',
          targetAmount: 1
        }
      ],
      rewardTemplates: [
        {
          type: 'experience',
          amount: 50,
          description: 'Knowledge of the ancients'
        },
        {
          type: 'item',
          description: 'Ancient artifact'
        }
      ],
      applicableEras: ['Ancient'],
      priority: 5
    },
    {
      id: 'ancient_tomb_raiders',
      type: 'investigation',
      title: 'Tomb of the Forgotten',
      descriptionTemplate: 'These ruins appear to be an ancient burial site. Disturbing the dead may bring curses, but treasures often lie within.',
      objectiveTemplates: [
        {
          type: 'investigate',
          descriptionTemplate: 'Search for the burial chamber'
        },
        {
          type: 'moral_choice',
          descriptionTemplate: 'Decide whether to take the grave goods'
        }
      ],
      rewardTemplates: [
        {
          type: 'currency',
          amount: 100,
          description: 'Ancient coins and jewelry'
        },
        {
          type: 'reputation',
          amount: -10,
          description: 'Tomb raider reputation'
        }
      ],
      applicableEras: ['Ancient'],
      priority: 4
    }
  ],
  
  'Classical': [
    {
      id: 'classical_lost_library',
      type: 'exploration',
      title: 'Repository of Knowledge',
      descriptionTemplate: 'You\'ve discovered the ruins of {ruinType}. Stone tablets and scrolls may still contain valuable knowledge from the classical world.',
      objectiveTemplates: [
        {
          type: 'explore_area',
          descriptionTemplate: 'Search for intact writings'
        },
        {
          type: 'collect_item',
          descriptionTemplate: 'Recover any readable texts',
          targetAmount: 2
        }
      ],
      rewardTemplates: [
        {
          type: 'experience',
          amount: 75,
          description: 'Ancient wisdom gained'
        },
        {
          type: 'item',
          description: 'Ancient scroll or tablet'
        }
      ],
      applicableEras: ['Classical'],
      priority: 5
    }
  ],
  
  'Medieval': [
    {
      id: 'medieval_haunted_ruins',
      type: 'investigation',
      title: 'The Abandoned Keep',
      descriptionTemplate: 'You\'ve entered the ruins of {ruinType}. Local villagers claim it is haunted, but valuable relics from the old lords may remain.',
      objectiveTemplates: [
        {
          type: 'explore_area',
          descriptionTemplate: 'Search the ruins despite local superstitions'
        },
        {
          type: 'investigate',
          descriptionTemplate: 'Discover what happened here'
        }
      ],
      rewardTemplates: [
        {
          type: 'currency',
          amount: 50,
          description: 'Old coins and trinkets'
        },
        {
          type: 'reputation',
          amount: 5,
          description: 'Brave explorer reputation'
        }
      ],
      applicableEras: ['Medieval'],
      priority: 4
    },
    {
      id: 'medieval_lost_chapel',
      type: 'preservation',
      title: 'Forgotten Chapel',
      descriptionTemplate: 'These ruins were once a place of worship. Holy relics and religious texts may still be found among the rubble.',
      objectiveTemplates: [
        {
          type: 'explore_area',
          descriptionTemplate: 'Search for religious artifacts'
        },
        {
          type: 'moral_choice',
          descriptionTemplate: 'Decide whether to return findings to the Church'
        }
      ],
      rewardTemplates: [
        {
          type: 'reputation',
          amount: 15,
          description: 'Church reputation (if returned)'
        },
        {
          type: 'item',
          description: 'Religious relic'
        }
      ],
      applicableEras: ['Medieval'],
      priority: 4
    }
  ],
  
  'EarlyModern': [
    {
      id: 'early_modern_colonial_ruins',
      type: 'exploration',
      title: 'Colonial Remnants',
      descriptionTemplate: 'You\'ve discovered the ruins of {ruinType} from an earlier colonial period. Maps, documents, or trade goods might remain.',
      objectiveTemplates: [
        {
          type: 'explore_area',
          descriptionTemplate: 'Search for colonial artifacts'
        },
        {
          type: 'collect_item',
          descriptionTemplate: 'Recover any valuable items',
          targetAmount: 2
        }
      ],
      rewardTemplates: [
        {
          type: 'currency',
          amount: 75,
          description: 'Colonial coins and goods'
        },
        {
          type: 'item',
          description: 'Old map or document'
        }
      ],
      applicableEras: ['EarlyModern'],
      priority: 4
    }
  ],
  
  'Industrial': [
    {
      id: 'industrial_factory_ruins',
      type: 'investigation',
      title: 'Industrial Archaeology',
      descriptionTemplate: 'You\'ve entered the ruins of {ruinType}. Historians and collectors would pay well for industrial artifacts and machinery parts.',
      objectiveTemplates: [
        {
          type: 'explore_area',
          descriptionTemplate: 'Document the industrial ruins'
        },
        {
          type: 'collect_item',
          descriptionTemplate: 'Salvage machinery parts',
          targetAmount: 3
        }
      ],
      rewardTemplates: [
        {
          type: 'currency',
          amount: 100,
          description: 'Payment from collectors'
        },
        {
          type: 'reputation',
          amount: 10,
          description: 'Industrial archaeologist reputation'
        }
      ],
      applicableEras: ['Industrial'],
      priority: 4
    }
  ],
  
  'Modern': [
    {
      id: 'modern_archaeological_survey',
      type: 'preservation',
      title: 'Archaeological Survey',
      descriptionTemplate: 'You\'ve entered protected ruins of {ruinType}. Document your findings for the archaeological society without disturbing the site.',
      objectiveTemplates: [
        {
          type: 'investigate',
          descriptionTemplate: 'Photograph and document the ruins'
        },
        {
          type: 'explore_area',
          descriptionTemplate: 'Create a detailed site map'
        }
      ],
      rewardTemplates: [
        {
          type: 'currency',
          amount: 150,
          description: 'Archaeological society grant'
        },
        {
          type: 'reputation',
          amount: 20,
          description: 'Academic reputation'
        },
        {
          type: 'experience',
          amount: 100,
          description: 'Archaeological expertise'
        }
      ],
      applicableEras: ['Modern'],
      priority: 5
    },
    {
      id: 'modern_urban_exploration',
      type: 'exploration',
      title: 'Urban Exploration',
      descriptionTemplate: 'You\'ve entered the abandoned {ruinType}. Document this piece of recent history before it\'s demolished or forgotten.',
      objectiveTemplates: [
        {
          type: 'explore_area',
          descriptionTemplate: 'Explore and photograph the site'
        },
        {
          type: 'investigate',
          descriptionTemplate: 'Learn the history of this place'
        }
      ],
      rewardTemplates: [
        {
          type: 'experience',
          amount: 50,
          description: 'Urban exploration experience'
        },
        {
          type: 'reputation',
          amount: 5,
          description: 'Urban explorer reputation'
        }
      ],
      applicableEras: ['Modern'],
      priority: 3
    }
  ],
  
  'Future': [
    {
      id: 'future_tech_salvage',
      type: 'retrieval',
      title: 'Tech Salvage Operation',
      descriptionTemplate: 'You\'ve entered the ruins of {ruinType}. Advanced technology from before the collapse might still function.',
      objectiveTemplates: [
        {
          type: 'explore_area',
          descriptionTemplate: 'Scan for functional technology'
        },
        {
          type: 'collect_item',
          descriptionTemplate: 'Salvage working tech components',
          targetAmount: 2
        }
      ],
      rewardTemplates: [
        {
          type: 'item',
          description: 'Advanced technology component'
        },
        {
          type: 'currency',
          amount: 200,
          description: 'Tech salvage value'
        }
      ],
      applicableEras: ['Future'],
      priority: 5
    }
  ]
};

/**
 * NPC-requested relic retrieval quests
 */
export const RELIC_RETRIEVAL_QUESTS: RuinQuestTemplate[] = [
  {
    id: 'scholar_artifact_hunt',
    type: 'retrieval',
    title: 'The Scholar\'s Request',
    descriptionTemplate: '{npcName} has asked you to retrieve {itemType} from the nearby ruins. They believe it holds great historical value.',
    objectiveTemplates: [
      {
        type: 'travel',
        descriptionTemplate: 'Travel to the ruins at {location}'
      },
      {
        type: 'explore_area',
        descriptionTemplate: 'Search the ruins for the artifact'
      },
      {
        type: 'collect_item',
        descriptionTemplate: 'Retrieve the {itemType}',
        targetAmount: 1
      },
      {
        type: 'deliver_to_npc',
        descriptionTemplate: 'Return to {npcName} with the artifact'
      }
    ],
    rewardTemplates: [
      {
        type: 'currency',
        amount: 100,
        description: 'Payment for the artifact'
      },
      {
        type: 'reputation',
        amount: 15,
        description: 'Scholar reputation'
      }
    ],
    applicableEras: ['Classical', 'Medieval', 'EarlyModern', 'Industrial', 'Modern'],
    priority: 4
  },
  {
    id: 'collector_rare_relic',
    type: 'retrieval',
    title: 'Collector\'s Commission',
    descriptionTemplate: '{npcName}, a wealthy collector, wants you to retrieve a specific relic from the dangerous ruins of {ruinType}.',
    objectiveTemplates: [
      {
        type: 'travel',
        descriptionTemplate: 'Navigate to the specified ruins'
      },
      {
        type: 'combat',
        descriptionTemplate: 'Deal with any dangers in the ruins'
      },
      {
        type: 'collect_item',
        descriptionTemplate: 'Find and retrieve the rare relic',
        targetAmount: 1
      },
      {
        type: 'deliver_to_npc',
        descriptionTemplate: 'Deliver the relic to {npcName}'
      }
    ],
    rewardTemplates: [
      {
        type: 'currency',
        amount: 250,
        description: 'Generous payment'
      },
      {
        type: 'item',
        description: 'Collector\'s map to other ruins'
      }
    ],
    applicableEras: ['Medieval', 'EarlyModern', 'Industrial', 'Modern'],
    priority: 5
  },
  {
    id: 'merchant_trade_goods',
    type: 'retrieval',
    title: 'Lost Cargo Recovery',
    descriptionTemplate: '{npcName} knows of valuable trade goods left in the ruins of {ruinType} after a caravan was attacked. They\'ll split the profits with you.',
    objectiveTemplates: [
      {
        type: 'travel',
        descriptionTemplate: 'Find the ruins where the caravan was lost'
      },
      {
        type: 'explore_area',
        descriptionTemplate: 'Search for the lost cargo'
      },
      {
        type: 'collect_item',
        descriptionTemplate: 'Recover trade goods',
        targetAmount: 5
      },
      {
        type: 'deliver_to_npc',
        descriptionTemplate: 'Return to {npcName} with the goods'
      }
    ],
    rewardTemplates: [
      {
        type: 'currency',
        amount: 150,
        description: 'Your share of the profits'
      },
      {
        type: 'reputation',
        amount: 10,
        description: 'Merchant reputation'
      }
    ],
    applicableEras: ['Ancient', 'Classical', 'Medieval', 'EarlyModern'],
    priority: 3
  },
  {
    id: 'priest_holy_relic',
    type: 'retrieval',
    title: 'Sacred Relic Recovery',
    descriptionTemplate: '{npcName} of the local temple seeks a holy relic lost in the ruins of {ruinType}. This is a matter of great spiritual importance.',
    objectiveTemplates: [
      {
        type: 'travel',
        descriptionTemplate: 'Journey to the sacred ruins'
      },
      {
        type: 'investigate',
        descriptionTemplate: 'Find clues about the relic\'s location'
      },
      {
        type: 'collect_item',
        descriptionTemplate: 'Recover the holy relic',
        targetAmount: 1
      },
      {
        type: 'deliver_to_npc',
        descriptionTemplate: 'Return the relic to {npcName}'
      }
    ],
    rewardTemplates: [
      {
        type: 'reputation',
        amount: 25,
        description: 'Religious reputation'
      },
      {
        type: 'item',
        description: 'Blessed item'
      }
    ],
    applicableEras: ['Ancient', 'Classical', 'Medieval', 'EarlyModern'],
    priority: 5
  }
];

/**
 * Generate a ruin exploration quest based on era and context
 */
export function generateRuinQuest(
  era: HistoricalEra,
  ruinType: string,
  isAutomatic: boolean,
  npcName?: string,
  location?: { x: number; y: number }
): Partial<Quest> {
  let template: RuinQuestTemplate;
  
  if (isAutomatic) {
    // Get era-specific automatic quest
    const eraQuests = RUIN_ENTRY_QUESTS[era] || RUIN_ENTRY_QUESTS['Medieval'];
    template = eraQuests[Math.floor(Math.random() * eraQuests.length)];
  } else {
    // Get NPC-requested quest
    const applicableQuests = RELIC_RETRIEVAL_QUESTS.filter(q => 
      q.applicableEras.includes(era)
    );
    template = applicableQuests[Math.floor(Math.random() * applicableQuests.length)];
  }
  
  // Replace template variables
  const replaceVars = (text: string) => {
    return text
      .replace('{ruinType}', ruinType || 'ancient structure')
      .replace('{npcName}', npcName || 'the quest giver')
      .replace('{location}', location ? `[${location.x}, ${location.y}]` : 'the marked location')
      .replace('{itemType}', getRandomArtifactType(era));
  };
  
  const objectives: QuestObjective[] = template.objectiveTemplates.map((objTemplate, idx) => ({
    id: `obj_${idx}`,
    type: objTemplate.type,
    description: replaceVars(objTemplate.descriptionTemplate),
    targetAmount: objTemplate.targetAmount,
    targetLocation: location,
    completed: false
  }));
  
  const rewards: QuestReward[] = template.rewardTemplates.map(rewardTemplate => ({
    type: rewardTemplate.type,
    amount: rewardTemplate.amount || 100,
    description: rewardTemplate.description || `${rewardTemplate.amount} coins`
  }));
  
  return {
    id: `ruin_quest_${template.id}_${Date.now()}`,
    title: replaceVars(template.title),
    description: replaceVars(template.descriptionTemplate),
    category: 'exploration',
    objectives,
    currentObjectiveIndex: 0,
    rewards,
    giver: isAutomatic ? 'Your Curiosity' : npcName,
    giverLocation: location,
    startLocation: location,
    status: 'available',
    isRuinQuest: true
  };
}

/**
 * Get a random artifact type based on era
 */
function getRandomArtifactType(era: HistoricalEra): string {
  const artifactsByEra: Record<HistoricalEra, string[]> = {
    'Ancient': ['ancient pottery', 'stone tablet', 'bronze figurine', 'jade amulet'],
    'Classical': ['marble statue fragment', 'ancient scroll', 'mosaic tile', 'amphora'],
    'Medieval': ['illuminated manuscript', 'coat of arms', 'ancient weapon', 'noble signet'],
    'EarlyModern': ['navigation instrument', 'old map', 'trade ledger', 'colonial artifact'],
    'Industrial': ['machinery part', 'factory blueprint', 'worker\'s tool', 'company seal'],
    'Modern': ['historical document', 'vintage photograph', 'cultural artifact', 'archival material'],
    'Future': ['data storage device', 'AI core', 'quantum processor', 'fusion cell']
  };
  
  const artifacts = artifactsByEra[era] || artifactsByEra['Medieval'];
  return artifacts[Math.floor(Math.random() * artifacts.length)];
}