/**
 * Quest Variety Service
 * Generates diverse, contextually appropriate quests with rich historical context
 */

import { Quest, QuestObjective } from '../types/questTypes';

interface QuestTemplate {
  title: string;
  descriptionTemplate: string;
  historicalContextTemplate: string;
  objectiveTemplates: Array<{
    description: string;
    type: string;
    optional?: boolean;
  }>;
  category: 'survival' | 'exploration' | 'trade' | 'social' | 'combat' | 'diplomacy' | 'scholarship';
  difficulty: 'easy' | 'medium' | 'hard';
  minReputation?: number;
}

// Quest templates organized by category to prevent duplicates
const QUEST_TEMPLATES: Record<string, QuestTemplate[]> = {
  survival: [
    {
      title: 'Resource Gathering',
      descriptionTemplate: 'Gather essential resources for survival. Best undertaken during daylight.',
      historicalContextTemplate: 'In {era} {zone}, travelers relied on local knowledge to find sustenance.',
      objectiveTemplates: [
        { description: 'Find and collect fresh water', type: 'visit_location' },
        { description: 'Gather food supplies', type: 'visit_location' }
      ],
      category: 'survival',
      difficulty: 'easy'
    },
    {
      title: 'Shelter from the Storm',
      descriptionTemplate: 'Find or build shelter before nightfall. The weather is turning.',
      historicalContextTemplate: 'Traditional {zone} shelters used local materials and ancient techniques.',
      objectiveTemplates: [
        { description: 'Find a suitable location', type: 'visit_location' },
        { description: 'Gather building materials', type: 'collect_items' },
        { description: 'Construct basic shelter', type: 'craft_item', optional: true }
      ],
      category: 'survival',
      difficulty: 'medium'
    },
    {
      title: 'Winter Preparations',
      descriptionTemplate: 'Prepare for the harsh season ahead by stockpiling essential supplies.',
      historicalContextTemplate: 'In {era}, communities in {zone} worked together to survive harsh winters.',
      objectiveTemplates: [
        { description: 'Collect firewood', type: 'collect_resource' },
        { description: 'Preserve food for storage', type: 'craft_item' },
        { description: 'Trade for warm clothing', type: 'trade', optional: true }
      ],
      category: 'survival',
      difficulty: 'hard'
    }
  ],
  exploration: [
    {
      title: 'Chart the Unknown',
      descriptionTemplate: 'Explore unmapped regions and document your discoveries.',
      historicalContextTemplate: 'Explorers in {era} {zone} were driven by curiosity and the promise of discovery.',
      objectiveTemplates: [
        { description: 'Travel at least 10 tiles from your starting position', type: 'travel_distance' },
        { description: 'Document three landmarks', type: 'explore_area' },
        { description: 'Return with your findings', type: 'return_to_start', optional: true }
      ],
      category: 'exploration',
      difficulty: 'medium'
    },
    {
      title: 'Lost Caravan Route',
      descriptionTemplate: 'Rediscover an ancient trade route mentioned in old texts.',
      historicalContextTemplate: 'Trade routes through {zone} connected distant civilizations in {era}.',
      objectiveTemplates: [
        { description: 'Find the old waystation ruins', type: 'visit_location' },
        { description: 'Follow the trail markers', type: 'follow_path' },
        { description: 'Map the complete route', type: 'explore_area' }
      ],
      category: 'exploration',
      difficulty: 'hard'
    },
    {
      title: 'Scout the Territory',
      descriptionTemplate: 'Survey the surrounding area for resources and potential dangers.',
      historicalContextTemplate: 'Scouts were essential for {zone} settlements in {era}, providing vital intelligence.',
      objectiveTemplates: [
        { description: 'Identify water sources', type: 'visit_location' },
        { description: 'Locate any settlements', type: 'visit_location' },
        { description: 'Report dangerous wildlife', type: 'observe_entity', optional: true }
      ],
      category: 'exploration',
      difficulty: 'easy'
    }
  ],
  trade: [
    {
      title: 'Merchant\'s Errand',
      descriptionTemplate: 'Complete a trading circuit to establish commercial relationships.',
      historicalContextTemplate: 'Merchants in {era} {zone} built wealth through careful negotiation and reliable delivery.',
      objectiveTemplates: [
        { description: 'Acquire trade goods', type: 'collect_items' },
        { description: 'Find a buyer at the market', type: 'visit_location' },
        { description: 'Complete the transaction', type: 'trade' }
      ],
      category: 'trade',
      difficulty: 'easy'
    },
    {
      title: 'Rare Commodities',
      descriptionTemplate: 'Source and deliver rare items to discerning clients.',
      historicalContextTemplate: 'Luxury goods from {zone} were highly prized across the known world in {era}.',
      objectiveTemplates: [
        { description: 'Locate the rare item source', type: 'visit_location' },
        { description: 'Negotiate with the supplier', type: 'talk_to_npc' },
        { description: 'Deliver to the client', type: 'deliver_item' },
        { description: 'Establish ongoing supply', type: 'trade', optional: true }
      ],
      category: 'trade',
      difficulty: 'hard'
    }
  ],
  social: [
    {
      title: 'Building Bridges',
      descriptionTemplate: 'Foster relationships with local inhabitants to gain their trust.',
      historicalContextTemplate: 'In {era} {zone}, social bonds were essential for survival and prosperity.',
      objectiveTemplates: [
        { description: 'Introduce yourself to three locals', type: 'talk_to_npc' },
        { description: 'Help with a community task', type: 'complete_task' },
        { description: 'Share a meal with new friends', type: 'social_interaction', optional: true }
      ],
      category: 'social',
      difficulty: 'easy'
    },
    {
      title: 'Diplomatic Mission',
      descriptionTemplate: 'Mediate a dispute between two quarreling parties.',
      historicalContextTemplate: 'Skilled mediators were valued in {zone} society during {era}.',
      objectiveTemplates: [
        { description: 'Speak with the first party', type: 'talk_to_npc' },
        { description: 'Hear the second party\'s grievances', type: 'talk_to_npc' },
        { description: 'Propose a fair solution', type: 'negotiate' },
        { description: 'Ensure lasting peace', type: 'observe_outcome', optional: true }
      ],
      category: 'social',
      difficulty: 'medium'
    }
  ],
  combat: [
    {
      title: 'Defend the Settlement',
      descriptionTemplate: 'Protect innocent villagers from imminent threats.',
      historicalContextTemplate: 'Communities in {era} {zone} relied on brave defenders in times of danger.',
      objectiveTemplates: [
        { description: 'Scout for incoming threats', type: 'patrol_area' },
        { description: 'Fortify defensive positions', type: 'prepare_defenses' },
        { description: 'Repel the attackers', type: 'defeat_enemies' }
      ],
      category: 'combat',
      difficulty: 'hard'
    },
    {
      title: 'Clear the Roads',
      descriptionTemplate: 'Make travel safer by dealing with bandits on the trade routes.',
      historicalContextTemplate: 'Safe roads were essential for commerce in {era} {zone}.',
      objectiveTemplates: [
        { description: 'Locate the bandit camp', type: 'visit_location' },
        { description: 'Confront the bandits', type: 'defeat_entity' },
        { description: 'Recover stolen goods', type: 'collect_items', optional: true }
      ],
      category: 'combat',
      difficulty: 'medium'
    }
  ],
  scholarship: [
    {
      title: 'Document Local Customs',
      descriptionTemplate: 'Study and record the traditions of this region for posterity.',
      historicalContextTemplate: 'Scholars in {era} preserved the rich cultural heritage of {zone}.',
      objectiveTemplates: [
        { description: 'Interview local elders', type: 'talk_to_npc' },
        { description: 'Observe a traditional ceremony', type: 'observe_event' },
        { description: 'Record your findings', type: 'create_document' }
      ],
      category: 'scholarship',
      difficulty: 'medium'
    },
    {
      title: 'Archaeological Survey',
      descriptionTemplate: 'Investigate ancient ruins to uncover historical artifacts.',
      historicalContextTemplate: 'The ruins of {zone} hold secrets from civilizations predating {era}.',
      objectiveTemplates: [
        { description: 'Locate the excavation site', type: 'visit_location' },
        { description: 'Carefully excavate artifacts', type: 'explore_area' },
        { description: 'Catalog your discoveries', type: 'create_document' },
        { description: 'Share findings with scholars', type: 'deliver_item', optional: true }
      ],
      category: 'scholarship',
      difficulty: 'hard'
    }
  ],
  diplomacy: [
    {
      title: 'Treaty Negotiations',
      descriptionTemplate: 'Facilitate peaceful relations between neighboring communities.',
      historicalContextTemplate: 'Diplomatic alliances shaped the political landscape of {zone} in {era}.',
      objectiveTemplates: [
        { description: 'Meet with the first delegation', type: 'talk_to_npc' },
        { description: 'Convey terms to the second party', type: 'deliver_message' },
        { description: 'Witness the treaty signing', type: 'observe_event' }
      ],
      category: 'diplomacy',
      difficulty: 'medium'
    }
  ]
};

/**
 * Get contextually appropriate historical context
 */
function getHistoricalContext(
  template: string,
  zone: string,
  era: string
): string {
  const zoneNames: Record<string, string> = {
    'europe': 'European lands',
    'africa': 'African territories',
    'oceania': 'Oceanic islands',
    'mena': 'Middle Eastern regions',
    'north-america': 'North American territories',
    'south-america': 'South American lands',
    'central-asia': 'Central Asian steppes',
    'east-asia': 'East Asian kingdoms',
    'south-asia': 'South Asian realms',
    'southeast-asia': 'Southeast Asian waters'
  };
  
  const eraDescriptions: Record<string, string> = {
    'ancient': 'ancient times',
    'medieval': 'the medieval period',
    'renaissance': 'the Renaissance',
    'enlightenment': 'the Age of Enlightenment',
    'industrial': 'the Industrial Revolution',
    'modern': 'the modern era'
  };
  
  return template
    .replace('{zone}', zoneNames[zone] || zone)
    .replace('{era}', eraDescriptions[era] || era);
}

/**
 * Generate a diverse quest with proper categorization
 */
export function generateVariedQuest(
  category: string,
  playerLocation: { x: number; y: number },
  structures: any[],
  zone: string,
  era: string,
  index: number
): Quest | null {
  const templates = QUEST_TEMPLATES[category];
  if (!templates || templates.length === 0) return null;
  
  // Select template based on index to avoid duplicates
  const template = templates[index % templates.length];
  
  // Find suitable locations for objectives
  const nearbyStructures = structures
    .map(s => {
      const loc = s.location ? 
        { x: s.location[0], y: s.location[1] } : 
        { x: s.x || 0, y: s.y || 0 };
      const distance = Math.sqrt(
        Math.pow(loc.x - playerLocation.x, 2) + 
        Math.pow(loc.y - playerLocation.y, 2)
      );
      return { ...s, loc, distance };
    })
    .filter(s => s.distance <= 30)
    .sort((a, b) => a.distance - b.distance);
  
  // Generate objectives with varied locations
  const objectives: QuestObjective[] = template.objectiveTemplates.map((objTemplate, idx) => {
    const targetStructure = nearbyStructures[idx % Math.max(1, nearbyStructures.length)];
    const targetLocation = targetStructure ? targetStructure.loc : {
      x: playerLocation.x + Math.floor(Math.random() * 20 - 10),
      y: playerLocation.y + Math.floor(Math.random() * 20 - 10)
    };
    
    return {
      id: `obj_${idx + 1}`,
      description: objTemplate.description,
      type: objTemplate.type as any,
      targetLocation,
      completed: false,
      optional: objTemplate.optional
    };
  });
  
  const questId = `quest_${category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: questId,
    title: template.title,
    description: template.descriptionTemplate,
    historicalContext: getHistoricalContext(template.historicalContextTemplate, zone, era),
    category: template.category,
    objectives,
    currentObjectiveIndex: 0,
    rewards: generateRewards(template.difficulty),
    startLocation: playerLocation,
    startTime: Date.now(),
    status: 'active',
    difficulty: template.difficulty
  };
}

/**
 * Generate appropriate rewards based on difficulty
 */
function generateRewards(difficulty: string): any[] {
  const baseRewards = [];
  
  switch (difficulty) {
    case 'easy':
      baseRewards.push(
        { type: 'reputation', value: 5, description: 'Local reputation +5' },
        { type: 'experience', value: 10, description: 'Experience gained' }
      );
      break;
    case 'medium':
      baseRewards.push(
        { type: 'reputation', value: 10, description: 'Regional reputation +10' },
        { type: 'experience', value: 25, description: 'Experience gained' },
        { type: 'item', itemId: 'trade_goods', quantity: 1, description: 'Trade goods' }
      );
      break;
    case 'hard':
      baseRewards.push(
        { type: 'reputation', value: 20, description: 'Renowned reputation +20' },
        { type: 'experience', value: 50, description: 'Experience gained' },
        { type: 'item', itemId: 'rare_artifact', quantity: 1, description: 'Rare artifact' },
        { type: 'knowledge', value: 1, description: 'Ancient knowledge' }
      );
      break;
  }
  
  return baseRewards;
}

/**
 * Get available quest categories based on game state
 */
export function getAvailableCategories(
  gameMode: string,
  hasNearbyStructures: boolean,
  hasNearbyNPCs: boolean
): string[] {
  const categories = ['survival', 'exploration']; // Always available
  
  if (hasNearbyStructures) {
    categories.push('trade', 'scholarship');
  }
  
  if (hasNearbyNPCs) {
    categories.push('social', 'diplomacy');
  }
  
  if (gameMode === 'combat' || gameMode === 'survival') {
    categories.push('combat');
  }
  
  return categories;
}

/**
 * Ensure no duplicate categories in active quests
 */
export function filterDuplicateCategories(
  availableCategories: string[],
  activeQuests: Quest[]
): string[] {
  const activeCategories = new Set(activeQuests.map(q => q.category));
  return availableCategories.filter(cat => !activeCategories.has(cat as any));
}