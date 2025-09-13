/**
 * Quest Template Service
 * Provides context-aware quest generation with variety and cultural specificity
 */

import { Quest, QuestObjective, QuestReward } from '../types/questTypes';
import { HistoricalEra } from '../types/ambiance';
import { CulturalZone } from '../types/characterData';
import { 
  getStructureLocation, 
  calculateDistance,
  findStructuresInRadius,
  findNearestStructure,
  isStructureType
} from './structureUtils';

interface QuestContext {
  playerLocation: { x: number; y: number };
  playerStats?: {
    health?: number;
    reputation?: number;
    wealth?: number;
    intelligence?: number;
    strength?: number;
  };
  nearbyStructures: any[];
  timeOfDay?: string;
  weather?: string;
  currentSeason?: string;
  recentEvents?: string[];
  culturalZone: CulturalZone | string;
  era: HistoricalEra | string;
  gameMode?: string;
}

interface DynamicQuestTemplate {
  id: string;
  name: string;
  baseDescription: string;
  category: 'exploration' | 'trade' | 'social' | 'survival' | 'combat' | 'scholarship' | 'mystery' | 'diplomatic';
  minStructures?: number;
  requiredStructureTypes?: string[];
  optionalStructureTypes?: string[];
  minDistance?: number;
  maxDistance?: number;
  contextRequirements?: {
    minHealth?: number;
    minReputation?: number;
    minWealth?: number;
    specificEras?: string[];
    specificZones?: string[];
    weather?: string[];
    timeOfDay?: string[];
  };
  generateObjectives: (context: QuestContext) => QuestObjective[];
  generateRewards: (context: QuestContext, difficulty: string) => QuestReward[];
  culturalVariants?: Record<string, any>;
  difficultyModifiers?: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export class QuestTemplateService {
  private static instance: QuestTemplateService;
  private templates: Map<string, DynamicQuestTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  public static getInstance(): QuestTemplateService {
    if (!QuestTemplateService.instance) {
      QuestTemplateService.instance = new QuestTemplateService();
    }
    return QuestTemplateService.instance;
  }

  private initializeTemplates(): void {
    // Exploration Templates
    this.addTemplate({
      id: 'explore_distant_landmark',
      name: 'Distant Discovery',
      baseDescription: 'Explore a distant landmark that has caught your attention',
      category: 'exploration',
      minDistance: 15,
      maxDistance: 50,
      generateObjectives: (context) => {
        const distant = this.findDistantInterestingLocation(context);
        if (!distant) return [];
        
        return [
          {
            id: 'obj_travel',
            type: 'visit_location',
            description: `Travel to the ${this.getLocationDescription(distant, context)}`,
            targetLocation: getStructureLocation(distant)!,
            completed: false
          },
          {
            id: 'obj_explore',
            type: 'explore_area',
            description: 'Explore the area thoroughly',
            targetLocation: { ...getStructureLocation(distant)!, radius: 3 },
            completed: false,
            hidden: true
          }
        ];
      },
      generateRewards: (context, difficulty) => {
        const baseRewards: QuestReward[] = [
          {
            type: 'level_up',
            value: 1,
            description: 'Level up!'
          },
          {
            type: 'map_reveal',
            value: { radius: 10 },
            description: 'Revealed surrounding area'
          }
        ];
        
        // Add chance for special discovery
        if (Math.random() < 0.3) {
          baseRewards.push({
            type: 'item',
            value: this.generateDiscoveryItem(context),
            description: 'Found during exploration',
            guaranteed: false,
            chance: 0.5
          });
        }
        
        return baseRewards;
      }
    });

    // Trade Templates
    this.addTemplate({
      id: 'merchant_delivery',
      name: 'Merchant Delivery',
      baseDescription: 'A merchant needs help delivering goods',
      category: 'trade',
      requiredStructureTypes: ['marketplace', 'hamlet', 'urban'],
      minStructures: 2,
      generateObjectives: (context) => {
        const start = findNearestStructure(context.nearbyStructures, context.playerLocation, ['marketplace', 'hamlet']);
        const end = this.findDifferentStructure(context.nearbyStructures, start, ['marketplace', 'urban', 'hamlet']);
        
        if (!start || !end) return [];
        
        return [
          {
            id: 'obj_pickup',
            type: 'visit_location',
            description: `Pick up goods from ${this.getLocationDescription(start, context)}`,
            targetLocation: getStructureLocation(start)!,
            completed: false
          },
          {
            id: 'obj_deliver',
            type: 'deliver_item',
            description: `Deliver goods to ${this.getLocationDescription(end, context)}`,
            targetLocation: getStructureLocation(end)!,
            targetItem: 'trade_goods',
            completed: false
          }
        ];
      },
      generateRewards: (context, difficulty) => [
        {
          type: 'money',
          value: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 25 : 50,
          description: 'Payment for delivery'
        },
        {
          type: 'reputation',
          value: 5,
          description: 'Improved merchant reputation'
        }
      ]
    });

    // Survival Templates
    this.addTemplate({
      id: 'resource_gathering',
      name: 'Resource Gathering',
      baseDescription: 'Gather essential resources for survival',
      category: 'survival',
      contextRequirements: {
        minHealth: 20
      },
      generateObjectives: (context) => {
        const objectives: QuestObjective[] = [];
        
        // Find different resource locations
        const waterSource = this.findNearbyWaterSource(context);
        const foodSource = this.findNearbyFoodSource(context);
        
        if (waterSource) {
          objectives.push({
            id: 'obj_water',
            type: 'collect_item',
            description: 'Find and collect fresh water',
            targetLocation: waterSource,
            targetItem: 'water',
            completed: false,
            progress: 0,
            total: 3
          });
        }
        
        if (foodSource) {
          objectives.push({
            id: 'obj_food',
            type: 'collect_item',
            description: 'Gather food supplies',
            targetLocation: foodSource,
            targetItem: 'food',
            completed: false,
            progress: 0,
            total: 5
          });
        }
        
        // Add shelter building if no structures nearby
        if (context.nearbyStructures.length < 2) {
          objectives.push({
            id: 'obj_shelter',
            type: 'survive_duration',
            description: 'Build shelter and survive the night',
            timeLimit: 480, // 8 game hours
            completed: false
          });
        }
        
        return objectives;
      },
      generateRewards: (context, difficulty) => [
        {
          type: 'health',
          value: 10,
          description: 'Restored health from rest and sustenance'
        },
        {
          type: 'item',
          value: { type: 'survival_kit', quantity: 1 },
          description: 'Basic survival supplies'
        }
      ]
    });

    // Mystery/Investigation Templates
    this.addTemplate({
      id: 'mysterious_disappearance',
      name: 'The Disappearance',
      baseDescription: 'Someone has gone missing under mysterious circumstances',
      category: 'mystery',
      requiredStructureTypes: ['hamlet', 'urban'],
      minStructures: 1,
      contextRequirements: {
        minReputation: 10
      },
      generateObjectives: (context) => {
        const settlement = findNearestStructure(context.nearbyStructures, context.playerLocation, ['hamlet', 'urban']);
        if (!settlement) return [];
        
        // Generate clue locations around the settlement
        const clueLocations = this.generateClueLocations(settlement, 3);
        
        const objectives: QuestObjective[] = [
          {
            id: 'obj_investigate',
            type: 'talk_to_npc',
            description: 'Talk to locals about the disappearance',
            targetLocation: getStructureLocation(settlement)!,
            targetNPC: 'worried_villager',
            completed: false
          }
        ];
        
        clueLocations.forEach((loc, index) => {
          objectives.push({
            id: `obj_clue_${index}`,
            type: 'gather_information',
            description: `Search for clues`,
            targetLocation: loc,
            completed: false,
            hidden: index > 0 // Hide subsequent clues until previous found
          });
        });
        
        objectives.push({
          id: 'obj_solve',
          type: 'make_choice',
          description: 'Determine what happened',
          requiredChoice: 'solve_mystery',
          completed: false,
          hidden: true
        });
        
        return objectives;
      },
      generateRewards: (context, difficulty) => [
        {
          type: 'reputation',
          value: 15,
          description: 'Gratitude of the community'
        },
        {
          type: 'knowledge',
          value: 'local_secrets',
          description: 'Knowledge of local mysteries'
        },
        {
          type: 'special_ability',
          value: 'investigator',
          description: 'Improved investigation skills',
          guaranteed: false,
          chance: 0.3
        }
      ]
    });

    // Diplomatic Templates
    this.addTemplate({
      id: 'faction_mediation',
      name: 'Mediate Dispute',
      baseDescription: 'Two groups need an impartial mediator',
      category: 'diplomatic',
      requiredStructureTypes: ['hamlet', 'urban', 'government_district'],
      minStructures: 2,
      contextRequirements: {
        minReputation: 20
      },
      generateObjectives: (context) => {
        const faction1 = findNearestStructure(context.nearbyStructures, context.playerLocation, ['hamlet', 'urban']);
        const faction2 = this.findDifferentStructure(context.nearbyStructures, faction1, ['hamlet', 'urban']);
        
        if (!faction1 || !faction2) return [];
        
        return [
          {
            id: 'obj_meet1',
            type: 'talk_to_npc',
            description: `Meet with the first party`,
            targetLocation: getStructureLocation(faction1)!,
            targetNPC: 'faction_leader_1',
            completed: false
          },
          {
            id: 'obj_meet2',
            type: 'talk_to_npc',
            description: `Meet with the second party`,
            targetLocation: getStructureLocation(faction2)!,
            targetNPC: 'faction_leader_2',
            completed: false
          },
          {
            id: 'obj_negotiate',
            type: 'make_choice',
            description: 'Negotiate a settlement',
            requiredChoice: 'diplomatic_solution',
            completed: false
          }
        ];
      },
      generateRewards: (context, difficulty) => [
        {
          type: 'reputation',
          value: 20,
          description: 'Respected as a mediator'
        },
        {
          type: 'title',
          value: 'Peacemaker',
          description: 'Earned the title of Peacemaker',
          guaranteed: false,
          chance: 0.5
        },
        {
          type: 'relationship',
          value: { faction1: '+10', faction2: '+10' },
          description: 'Improved relations with both parties'
        }
      ]
    });

    // Combat/Defense Templates
    this.addTemplate({
      id: 'defend_settlement',
      name: 'Defend the Settlement',
      baseDescription: 'A settlement is under threat and needs defenders',
      category: 'combat',
      requiredStructureTypes: ['hamlet', 'urban', 'fortress'],
      minStructures: 1,
      contextRequirements: {
        minHealth: 30,
        minReputation: 5
      },
      generateObjectives: (context) => {
        const settlement = findNearestStructure(context.nearbyStructures, context.playerLocation, ['hamlet', 'urban', 'fortress']);
        if (!settlement) return [];
        
        const settlementLoc = getStructureLocation(settlement)!;
        
        return [
          {
            id: 'obj_reach',
            type: 'visit_location',
            description: `Reach the settlement before the attack`,
            targetLocation: settlementLoc,
            timeLimit: 300, // 5 game hours
            completed: false
          },
          {
            id: 'obj_prepare',
            type: 'gather_information',
            description: 'Help prepare defenses',
            targetLocation: settlementLoc,
            completed: false
          },
          {
            id: 'obj_defend',
            type: 'defeat_entity',
            description: 'Defend against attackers',
            targetEntity: 'bandit_group',
            targetLocation: { ...settlementLoc, radius: 5 },
            completed: false
          }
        ];
      },
      generateRewards: (context, difficulty) => [
        {
          type: 'reputation',
          value: 25,
          description: 'Hero of the settlement'
        },
        {
          type: 'item',
          value: { type: 'weapon', quality: 'fine' },
          description: 'Reward from grateful defenders'
        },
        {
          type: 'money',
          value: difficulty === 'easy' ? 20 : difficulty === 'medium' ? 40 : 75,
          description: 'Bounty for defeating bandits'
        }
      ]
    });

    // Scholarship/Knowledge Templates
    this.addTemplate({
      id: 'ancient_knowledge',
      name: 'Seek Ancient Knowledge',
      baseDescription: 'Search for lost knowledge or artifacts',
      category: 'scholarship',
      requiredStructureTypes: ['ruins', 'holy_site'],
      contextRequirements: {
        minReputation: 10
      },
      generateObjectives: (context) => {
        const sites = context.nearbyStructures.filter(s => 
          isStructureType(s, ['ruins', 'holy_site'])
        );
        
        if (sites.length === 0) return [];
        
        const objectives: QuestObjective[] = [];
        const maxSites = Math.min(3, sites.length);
        
        for (let i = 0; i < maxSites; i++) {
          const site = sites[i];
          const loc = getStructureLocation(site);
          if (loc) {
            objectives.push({
              id: `obj_study_${i}`,
              type: 'gather_information',
              description: `Study the ${this.getLocationDescription(site, context)}`,
              targetLocation: loc,
              completed: false
            });
          }
        }
        
        objectives.push({
          id: 'obj_compile',
          type: 'solve_puzzle',
          description: 'Compile and understand the knowledge',
          completed: false,
          hidden: true
        });
        
        return objectives;
      },
      generateRewards: (context, difficulty) => [
        {
          type: 'level_up',
          value: 1,
          description: 'Level up!'
        },
        {
          type: 'experience',
          value: difficulty === 'easy' ? 15 : difficulty === 'medium' ? 30 : 50,
          description: 'Experience gained'
        }
      ]
    });
  }

  private addTemplate(template: DynamicQuestTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Generate contextually appropriate quests
   */
  public generateContextualQuests(
    context: QuestContext,
    count: number = 3
  ): Quest[] {
    const quests: Quest[] = [];
    const availableTemplates = this.filterTemplatesByContext(context);
    
    // Shuffle and select templates
    const shuffled = [...availableTemplates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);
    
    selected.forEach(template => {
      const quest = this.createQuestFromTemplate(template, context);
      if (quest && quest.objectives.length > 0) {
        quests.push(quest);
      }
    });
    
    return quests;
  }

  private filterTemplatesByContext(context: QuestContext): DynamicQuestTemplate[] {
    return Array.from(this.templates.values()).filter(template => {
      // Check structure requirements
      if (template.requiredStructureTypes && template.requiredStructureTypes.length > 0) {
        const hasRequired = template.requiredStructureTypes.some(type =>
          context.nearbyStructures.some(s => isStructureType(s, type))
        );
        if (!hasRequired) return false;
      }
      
      if (template.minStructures && context.nearbyStructures.length < template.minStructures) {
        return false;
      }
      
      // Check context requirements
      if (template.contextRequirements) {
        const req = template.contextRequirements;
        
        if (req.minHealth && context.playerStats?.health && context.playerStats.health < req.minHealth) {
          return false;
        }
        
        if (req.minReputation && context.playerStats?.reputation && context.playerStats.reputation < req.minReputation) {
          return false;
        }
        
        if (req.specificEras && !req.specificEras.includes(String(context.era))) {
          return false;
        }
        
        if (req.specificZones && !req.specificZones.includes(String(context.culturalZone))) {
          return false;
        }
      }
      
      return true;
    });
  }

  private createQuestFromTemplate(
    template: DynamicQuestTemplate,
    context: QuestContext
  ): Quest | null {
    const objectives = template.generateObjectives(context);
    if (objectives.length === 0) return null;
    
    const difficulty = this.calculateDifficulty(context, objectives);
    const rewards = template.generateRewards(context, difficulty);
    
    // Apply cultural variants if available
    let title = template.name;
    let description = template.baseDescription;
    
    if (template.culturalVariants && template.culturalVariants[String(context.culturalZone)]) {
      const variant = template.culturalVariants[String(context.culturalZone)];
      title = variant.title || title;
      description = variant.description || description;
    }
    
    return {
      id: `quest_${template.id}_${Date.now()}`,
      title: this.personalizeTitle(title, context),
      description: this.personalizeDescription(description, context),
      category: template.category,
      objectives,
      currentObjectiveIndex: 0,
      rewards,
      startLocation: context.playerLocation,
      startTime: Date.now(),
      status: 'active',
      difficulty,
      isProceduralQuest: true,
      culturalZone: String(context.culturalZone),
      era: String(context.era),
      historicalContext: this.generateHistoricalContext(context)
    };
  }

  private calculateDifficulty(context: QuestContext, objectives: QuestObjective[]): 'easy' | 'medium' | 'hard' {
    let difficultyScore = 0;
    
    // Distance factor
    objectives.forEach(obj => {
      if (obj.targetLocation) {
        const distance = calculateDistance(context.playerLocation, obj.targetLocation);
        if (distance > 30) difficultyScore += 2;
        else if (distance > 15) difficultyScore += 1;
      }
    });
    
    // Objective count factor
    difficultyScore += objectives.length;
    
    // Time limit factor
    if (objectives.some(o => o.timeLimit)) {
      difficultyScore += 2;
    }
    
    // Combat factor
    if (objectives.some(o => o.type === 'defeat_entity')) {
      difficultyScore += 3;
    }
    
    if (difficultyScore >= 7) return 'hard';
    if (difficultyScore >= 4) return 'medium';
    return 'easy';
  }

  // Helper methods
  private findDistantInterestingLocation(context: QuestContext): any | null {
    const interesting = context.nearbyStructures.filter(s => {
      const loc = getStructureLocation(s);
      if (!loc) return false;
      const distance = calculateDistance(context.playerLocation, loc);
      return distance >= 15 && distance <= 50;
    });
    
    if (interesting.length === 0) return null;
    return interesting[Math.floor(Math.random() * interesting.length)];
  }

  private findDifferentStructure(structures: any[], exclude: any, types?: string[]): any | null {
    const candidates = structures.filter(s => {
      if (s === exclude) return false;
      if (types && !types.some(t => isStructureType(s, t))) return false;
      return true;
    });
    
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  private findNearbyWaterSource(context: QuestContext): { x: number; y: number } | null {
    // Generate a water source location near player
    const angle = Math.random() * Math.PI * 2;
    const distance = 5 + Math.random() * 10;
    return {
      x: context.playerLocation.x + Math.cos(angle) * distance,
      y: context.playerLocation.y + Math.sin(angle) * distance
    };
  }

  private findNearbyFoodSource(context: QuestContext): { x: number; y: number } | null {
    // Check for farms first
    const farm = findNearestStructure(context.nearbyStructures, context.playerLocation, ['farm']);
    if (farm) return getStructureLocation(farm);
    
    // Otherwise generate a foraging location
    const angle = Math.random() * Math.PI * 2;
    const distance = 3 + Math.random() * 7;
    return {
      x: context.playerLocation.x + Math.cos(angle) * distance,
      y: context.playerLocation.y + Math.sin(angle) * distance
    };
  }

  private generateClueLocations(centerStructure: any, count: number): { x: number; y: number }[] {
    const center = getStructureLocation(centerStructure);
    if (!center) return [];
    
    const locations: { x: number; y: number }[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      const distance = 3 + Math.random() * 5;
      locations.push({
        x: center.x + Math.cos(angle) * distance,
        y: center.y + Math.sin(angle) * distance
      });
    }
    return locations;
  }

  private getLocationDescription(structure: any, context: QuestContext): string {
    const type = structure.structureType || structure.type || 'location';
    const name = structure.name || '';
    
    if (name) return name;
    
    // Generate descriptive name based on type and culture
    const culturalDescriptors: Record<string, Record<string, string>> = {
      'EUROPEAN': {
        'ruins': 'ancient castle ruins',
        'hamlet': 'small village',
        'marketplace': 'market square',
        'holy_site': 'old church',
        'fortress': 'fortified keep'
      },
      'MENA': {
        'ruins': 'desert ruins',
        'hamlet': 'oasis settlement',
        'marketplace': 'bazaar',
        'holy_site': 'sacred shrine',
        'fortress': 'desert fortress'
      },
      'EAST_ASIAN': {
        'ruins': 'ancient temple ruins',
        'hamlet': 'rural village',
        'marketplace': 'trading post',
        'holy_site': 'mountain shrine',
        'fortress': 'walled compound'
      }
      // Add more cultural variants as needed
    };
    
    const zoneDescriptors = culturalDescriptors[String(context.culturalZone)] || culturalDescriptors['EUROPEAN'];
    return zoneDescriptors[type] || type.replace(/_/g, ' ');
  }

  private generateDiscoveryItem(context: QuestContext): any {
    const items = [
      { type: 'artifact', name: 'Ancient Artifact', value: 50 },
      { type: 'map', name: 'Old Map', value: 25 },
      { type: 'book', name: 'Dusty Tome', value: 30 },
      { type: 'jewelry', name: 'Lost Jewelry', value: 40 }
    ];
    return items[Math.floor(Math.random() * items.length)];
  }

  private generateKnowledgeType(context: QuestContext): string {
    const knowledgeTypes = [
      'ancient_history',
      'lost_languages',
      'forgotten_rituals',
      'astronomical_observations',
      'medical_practices',
      'architectural_techniques'
    ];
    return knowledgeTypes[Math.floor(Math.random() * knowledgeTypes.length)];
  }

  private personalizeTitle(title: string, context: QuestContext): string {
    // Add era-specific prefixes
    const eraPrefix: Record<string, string> = {
      'MEDIEVAL': 'Medieval',
      'RENAISSANCE_EARLY_MODERN': 'Renaissance',
      'INDUSTRIAL_ERA': 'Industrial',
      'MODERN_ERA': 'Modern'
    };
    
    const prefix = eraPrefix[String(context.era)];
    if (prefix && Math.random() < 0.3) {
      return `${prefix} ${title}`;
    }
    
    return title;
  }

  private personalizeDescription(description: string, context: QuestContext): string {
    // Add contextual details
    if (context.weather === 'rain' && Math.random() < 0.5) {
      description += ' The rain makes travel more difficult.';
    }
    
    if (context.timeOfDay === 'night' && Math.random() < 0.5) {
      description += ' Best undertaken during daylight.';
    }
    
    return description;
  }

  private generateHistoricalContext(context: QuestContext): string {
    const contexts: Record<string, Record<string, string>> = {
      'MEDIEVAL': {
        'EUROPEAN': 'In these feudal times, loyalty and honor guide your actions.',
        'MENA': 'The golden age of learning flourishes in these lands.',
        'EAST_ASIAN': 'The imperial court\'s influence reaches even these remote areas.'
      },
      'RENAISSANCE_EARLY_MODERN': {
        'EUROPEAN': 'The Renaissance brings new ideas and opportunities.',
        'MENA': 'Trade routes connect distant lands and cultures.',
        'EAST_ASIAN': 'Traditional ways meet new foreign influences.'
      }
    };
    
    const eraContexts = contexts[String(context.era)] || contexts['MEDIEVAL'];
    return eraContexts[String(context.culturalZone)] || null;
  }
}

// Export singleton instance
export const questTemplateService = QuestTemplateService.getInstance();