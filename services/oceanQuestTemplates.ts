/**
 * Ocean Quest Templates
 * Specific quests for ocean/maritime environments
 */

import { Quest, QuestObjective } from '../types/questTypes';

interface OceanQuestTemplate {
  title: string;
  description: string;
  historicalContext: (era: string, zone: string) => string;
  objectives: QuestObjective[];
  category: Quest['category'];
  difficulty: Quest['difficulty'];
  minWaterPercentage: number; // Minimum water % for this quest
}

export const OCEAN_QUEST_TEMPLATES: OceanQuestTemplate[] = [
  // Pure Ocean Survival
  {
    title: 'Lost at Sea',
    description: 'You find yourself adrift in open waters. Survival depends on finding land or rescue.',
    historicalContext: (era, zone) => {
      const contexts: Record<string, string> = {
        ancient: `Ancient mariners of ${zone} relied on stars and birds to navigate these treacherous waters.`,
        medieval: `Medieval sailors feared these waters, believing sea monsters lurked in the depths.`,
        renaissance: `The age of exploration brought many souls to these waters, not all returned.`,
        modern: `Even with modern navigation, these waters remain dangerous and unpredictable.`
      };
      return contexts[era] || contexts.ancient;
    },
    objectives: [
      {
        id: 'obj_1',
        description: 'Survive for 3 days at sea',
        type: 'survive_time',
        targetDays: 3,
        completed: false
      },
      {
        id: 'obj_2',
        description: 'Find any sign of land',
        type: 'explore_area',
        completed: false
      },
      {
        id: 'obj_3',
        description: 'Signal for rescue (optional)',
        type: 'complete_task',
        optional: true,
        completed: false
      }
    ],
    category: 'survival',
    difficulty: 'hard',
    minWaterPercentage: 80
  },
  
  // Navigation Challenge
  {
    title: 'Navigate by the Stars',
    description: 'Use celestial navigation to find your way across open waters.',
    historicalContext: (era, zone) => {
      return `Navigators in ${era} ${zone} used the stars, sun, and ocean currents to traverse vast distances.`;
    },
    objectives: [
      {
        id: 'obj_1',
        description: 'Travel 15 tiles maintaining direction',
        type: 'travel_distance',
        targetDistance: 15,
        completed: false
      },
      {
        id: 'obj_2',
        description: 'Reach the target coordinates',
        type: 'visit_location',
        completed: false
      }
    ],
    category: 'exploration',
    difficulty: 'medium',
    minWaterPercentage: 70
  },
  
  // Ocean Exploration
  {
    title: 'Chart Unknown Waters',
    description: 'Explore and map these uncharted seas for future navigators.',
    historicalContext: (era, zone) => {
      return `Explorers of ${era} risked everything to map the unknown waters of ${zone}.`;
    },
    objectives: [
      {
        id: 'obj_1',
        description: 'Explore at least 20 tiles of ocean',
        type: 'explore_area',
        targetAmount: 20,
        completed: false
      },
      {
        id: 'obj_2',
        description: 'Document any islands or land masses',
        type: 'complete_task',
        completed: false
      },
      {
        id: 'obj_3',
        description: 'Note dangerous waters or currents',
        type: 'observe_event',
        optional: true,
        completed: false
      }
    ],
    category: 'exploration',
    difficulty: 'easy',
    minWaterPercentage: 60
  },
  
  // Fishing/Resource Gathering
  {
    title: 'Harvest from the Sea',
    description: 'The ocean provides, if you know where to look.',
    historicalContext: (era, zone) => {
      const contexts: Record<string, string> = {
        ancient: `Ancient peoples of ${zone} developed sophisticated fishing techniques passed down through generations.`,
        medieval: `Fishing guilds of ${zone} guarded their secret fishing grounds jealously.`,
        modern: `Commercial fishing has transformed these waters, but traditional methods still persist.`
      };
      return contexts[era] || contexts.ancient;
    },
    objectives: [
      {
        id: 'obj_1',
        description: 'Find a good fishing spot',
        type: 'visit_location',
        completed: false
      },
      {
        id: 'obj_2',
        description: 'Catch enough fish to sustain yourself',
        type: 'collect_resource',
        resourceType: 'fish',
        targetAmount: 5,
        completed: false
      }
    ],
    category: 'survival',
    difficulty: 'easy',
    minWaterPercentage: 50
  },
  
  // Storm Survival
  {
    title: 'Weather the Storm',
    description: 'A massive storm approaches. Prepare and survive nature\'s fury.',
    historicalContext: (era, zone) => {
      return `Sailors in ${era} ${zone} had no weather forecasts - reading the sky and sea saved lives.`;
    },
    objectives: [
      {
        id: 'obj_1',
        description: 'Find shelter or safe waters',
        type: 'visit_location',
        completed: false
      },
      {
        id: 'obj_2',
        description: 'Survive the storm',
        type: 'survive_duration',
        timeLimit: 60,
        completed: false
      },
      {
        id: 'obj_3',
        description: 'Assess and repair damage',
        type: 'complete_task',
        completed: false
      }
    ],
    category: 'survival',
    difficulty: 'medium',
    minWaterPercentage: 40
  },
  
  // Island Discovery (for island maps)
  {
    title: 'Island Reconnaissance',
    description: 'Explore this island to determine if it\'s suitable for settlement.',
    historicalContext: (era, zone) => {
      return `Island peoples of ${zone} in ${era} carefully evaluated new lands before settling.`;
    },
    objectives: [
      {
        id: 'obj_1',
        description: 'Scout for fresh water sources',
        type: 'visit_location',
        completed: false
      },
      {
        id: 'obj_2',
        description: 'Identify food sources',
        type: 'explore_area',
        completed: false
      },
      {
        id: 'obj_3',
        description: 'Check for hostile inhabitants',
        type: 'patrol_area',
        completed: false
      }
    ],
    category: 'exploration',
    difficulty: 'easy',
    minWaterPercentage: 30
  }
];

/**
 * Get ocean quests appropriate for the current context
 */
export function getOceanQuests(
  waterPercentage: number,
  era: string,
  zone: string,
  playerLocation: { x: number; y: number }
): Quest[] {
  const appropriateTemplates = OCEAN_QUEST_TEMPLATES.filter(template => 
    waterPercentage >= template.minWaterPercentage
  );
  
  // Convert templates to actual quests
  return appropriateTemplates.map((template, index) => {
    // Add location data to objectives that need it
    const objectives = template.objectives.map(obj => ({
      ...obj,
      targetLocation: obj.type === 'visit_location' ? {
        x: playerLocation.x + Math.floor(Math.random() * 20 - 10),
        y: playerLocation.y + Math.floor(Math.random() * 20 - 10)
      } : undefined
    }));
    
    return {
      id: `ocean_quest_${Date.now()}_${index}`,
      title: template.title,
      description: template.description,
      historicalContext: template.historicalContext(era, zone),
      category: template.category,
      objectives,
      currentObjectiveIndex: 0,
      rewards: generateOceanRewards(template.difficulty),
      startLocation: playerLocation,
      startTime: Date.now(),
      status: 'active' as const,
      difficulty: template.difficulty
    };
  });
}

/**
 * Generate appropriate rewards for ocean quests
 */
function generateOceanRewards(difficulty?: string): any[] {
  const baseRewards = [
    { type: 'experience', value: 10, description: 'Navigation experience' }
  ];
  
  switch (difficulty) {
    case 'hard':
      baseRewards.push(
        { type: 'reputation', value: 25, description: 'Master Navigator reputation +25' },
        { type: 'item', itemId: 'navigation_charts', quantity: 1, description: 'Ancient navigation charts' }
      );
      break;
    case 'medium':
      baseRewards.push(
        { type: 'reputation', value: 15, description: 'Seasoned Sailor reputation +15' },
        { type: 'knowledge', value: 1, description: 'Maritime knowledge' }
      );
      break;
    default:
      baseRewards.push(
        { type: 'reputation', value: 5, description: 'Sailor reputation +5' }
      );
  }
  
  return baseRewards;
}