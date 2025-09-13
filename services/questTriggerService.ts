/**
 * Quest Trigger Service
 * Manages organic, event-driven quest generation based on player actions
 */

import { questService } from './questService';
import { Quest } from '../types/questTypes';
import { PlayerCharacter, MapData, Tile, BiomeType } from '../types';
import { NpcEntity } from '../types/npcTypes';
import { TerrainStructure } from '../types/structures';
import { HistoricalEra, CulturalZone } from '../types';

interface QuestTriggerContext {
  player: PlayerCharacter;
  tile: Tile;
  mapData: MapData;
  culturalZone: CulturalZone;
  era: HistoricalEra;
  gameMode?: string;
}

interface TriggerState {
  climatesVisited: Set<string>;
  npcInteractionCount: Map<string, number>;
  structureTypesVisited: Set<string>;
  shipEmbarkCount: number;
  ruinsVisited: number;
  daysPlayed: number;
  tilesExplored: number;
  lastClimate?: string;
  hasFirstQuest: boolean;
  questsUnlocked: Set<string>;
}

class QuestTriggerService {
  private triggerState: TriggerState = {
    climatesVisited: new Set(),
    npcInteractionCount: new Map(),
    structureTypesVisited: new Set(),
    shipEmbarkCount: 0,
    ruinsVisited: 0,
    daysPlayed: 0,
    tilesExplored: 0,
    hasFirstQuest: false,
    questsUnlocked: new Set()
  };

  constructor() {
    this.loadState();
  }

  /**
   * Save trigger state to localStorage
   */
  private saveState(): void {
    try {
      const stateToSave = {
        climatesVisited: Array.from(this.triggerState.climatesVisited),
        npcInteractionCount: Array.from(this.triggerState.npcInteractionCount.entries()),
        structureTypesVisited: Array.from(this.triggerState.structureTypesVisited),
        shipEmbarkCount: this.triggerState.shipEmbarkCount,
        ruinsVisited: this.triggerState.ruinsVisited,
        daysPlayed: this.triggerState.daysPlayed,
        tilesExplored: this.triggerState.tilesExplored,
        lastClimate: this.triggerState.lastClimate,
        hasFirstQuest: this.triggerState.hasFirstQuest,
        questsUnlocked: Array.from(this.triggerState.questsUnlocked)
      };
      localStorage.setItem('questTriggerState', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('[QuestTrigger] Failed to save state:', error);
    }
  }

  /**
   * Load trigger state from localStorage
   */
  private loadState(): void {
    try {
      const savedState = localStorage.getItem('questTriggerState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        this.triggerState = {
          climatesVisited: new Set(parsed.climatesVisited || []),
          npcInteractionCount: new Map(parsed.npcInteractionCount || []),
          structureTypesVisited: new Set(parsed.structureTypesVisited || []),
          shipEmbarkCount: parsed.shipEmbarkCount || 0,
          ruinsVisited: parsed.ruinsVisited || 0,
          daysPlayed: parsed.daysPlayed || 0,
          tilesExplored: parsed.tilesExplored || 0,
          lastClimate: parsed.lastClimate,
          hasFirstQuest: parsed.hasFirstQuest || false,
          questsUnlocked: new Set(parsed.questsUnlocked || [])
        };
      }
    } catch (error) {
      console.error('[QuestTrigger] Failed to load state:', error);
    }
  }

  /**
   * Reset trigger state for new game
   */
  reset(): void {
    this.triggerState = {
      climatesVisited: new Set(),
      npcInteractionCount: new Map(),
      structureTypesVisited: new Set(),
      shipEmbarkCount: 0,
      ruinsVisited: 0,
      daysPlayed: 0,
      tilesExplored: 0,
      hasFirstQuest: false,
      questsUnlocked: new Set()
    };
    localStorage.removeItem('questTriggerState');
  }

  /**
   * Check if player moved to a new climate zone
   */
  onPlayerMove(context: QuestTriggerContext): void {
    // Track tiles explored
    this.triggerState.tilesExplored++;
    
    // Get climate from biome
    const climate = this.getClimateFromBiome(context.tile.biome);
    
    // First movement - offer a simple survival quest
    if (!this.triggerState.hasFirstQuest && this.triggerState.tilesExplored > 5) {
      this.generateFirstQuest(context);
      this.triggerState.hasFirstQuest = true;
    }
    
    // Climate change detection
    if (climate && climate !== this.triggerState.lastClimate) {
      if (this.triggerState.lastClimate && !this.triggerState.climatesVisited.has(climate)) {
        // First time in this climate - generate climate-appropriate quest
        this.generateClimateQuest(context, climate);
        this.triggerState.climatesVisited.add(climate);
      }
      this.triggerState.lastClimate = climate;
    }
    
    // Check for structures on tile
    if (context.tile.structure) {
      const structureType = context.tile.structure.type || context.tile.structure.structureType;
      if (structureType && !this.triggerState.structureTypesVisited.has(structureType)) {
        this.generateStructureQuest(context, structureType);
        this.triggerState.structureTypesVisited.add(structureType);
      }
      
      // Special handling for ruins
      if (structureType === 'ruin' || structureType === 'ruins') {
        this.triggerState.ruinsVisited++;
        if (this.triggerState.ruinsVisited === 1) {
          this.generateRuinsQuest(context);
        }
      }
    }
    
    this.saveState();
  }

  /**
   * Handle NPC interaction
   */
  onNPCInteraction(context: QuestTriggerContext, npc: NpcEntity): void {
    const npcId = npc.id;
    const interactionCount = (this.triggerState.npcInteractionCount.get(npcId) || 0) + 1;
    this.triggerState.npcInteractionCount.set(npcId, interactionCount);
    
    // Second interaction with same NPC - offer personal quest
    if (interactionCount === 2) {
      this.generateNPCQuest(context, npc);
    }
    
    // Fifth interaction - deeper relationship quest
    if (interactionCount === 5) {
      this.generateDeepNPCQuest(context, npc);
    }
    
    this.saveState();
  }

  /**
   * Handle ship embarkation
   */
  onShipEmbark(context: QuestTriggerContext): void {
    this.triggerState.shipEmbarkCount++;
    
    // First re-embarkation after initial - naval quest
    if (this.triggerState.shipEmbarkCount === 2) {
      this.generateNavalQuest(context);
    }
    
    this.saveState();
  }

  /**
   * Handle day change
   */
  onDayChange(context: QuestTriggerContext): void {
    this.triggerState.daysPlayed++;
    
    // After 7 days - time-based quest
    if (this.triggerState.daysPlayed === 7 && !this.triggerState.questsUnlocked.has('week_survival')) {
      this.generateTimeBasedQuest(context, 'week');
      this.triggerState.questsUnlocked.add('week_survival');
    }
    
    this.saveState();
  }

  /**
   * Get climate type from biome
   */
  private getClimateFromBiome(biome: BiomeType): string | null {
    const climateMap: Record<string, string> = {
      [BiomeType.TUNDRA]: 'arctic',
      [BiomeType.TAIGA]: 'cold',
      [BiomeType.TEMPERATE_FOREST]: 'temperate',
      [BiomeType.TROPICAL_FOREST]: 'tropical',
      [BiomeType.DESERT]: 'arid',
      [BiomeType.SAVANNA]: 'dry',
      [BiomeType.WETLAND]: 'humid',
      [BiomeType.MOUNTAIN]: 'alpine',
      [BiomeType.COASTAL]: 'coastal'
    };
    
    return climateMap[biome] || null;
  }

  /**
   * Generate the first quest - simple and tutorial-like
   */
  private generateFirstQuest(context: QuestTriggerContext): void {
    const quest: Partial<Quest> = {
      id: `first_quest_${Date.now()}`,
      title: "Finding Your Bearings",
      description: "You've arrived in a new land. Take time to explore your surroundings and gather basic supplies.",
      category: 'exploration',
      objectives: [
        {
          id: 'explore_area',
          type: 'travel_distance',
          description: 'Explore the area by traveling at least 10 tiles',
          targetDistance: 10,
          completed: false,
          progress: this.triggerState.tilesExplored,
          total: 10
        }
      ],
      rewards: [
        {
          type: 'experience',
          value: 10,
          description: '+10 XP for exploring'
        }
      ],
      status: 'active',
      startTime: Date.now(),
      currentObjectiveIndex: 0,
      isActiveQuest: true // First quest is automatically active
    };
    
    questService.addQuest(quest as Quest);
    console.log('[QuestTrigger] Generated first quest: Finding Your Bearings');
  }

  /**
   * Generate climate-specific quest
   */
  private generateClimateQuest(context: QuestTriggerContext, climate: string): void {
    const climateQuests: Record<string, Partial<Quest>> = {
      arctic: {
        title: "Surviving the Cold",
        description: "The freezing temperatures here are dangerous. Find warm clothing or shelter.",
        category: 'survival',
        objectives: [
          {
            id: 'find_warmth',
            type: 'collect_item',
            description: 'Find or craft warm clothing',
            targetItem: 'fur_coat',
            targetAmount: 1,
            completed: false
          }
        ]
      },
      tropical: {
        title: "Tropical Abundance",
        description: "This lush environment offers many resources. Gather tropical fruits and materials.",
        category: 'exploration',
        objectives: [
          {
            id: 'gather_tropical',
            type: 'collect_resource',
            description: 'Gather tropical resources',
            resourceType: 'fruit',
            targetAmount: 5,
            completed: false
          }
        ]
      },
      arid: {
        title: "Desert Survival",
        description: "Water is scarce in this arid land. Secure a water source.",
        category: 'survival',
        objectives: [
          {
            id: 'find_water',
            type: 'collect_item',
            description: 'Find or collect fresh water',
            targetItem: 'water',
            targetAmount: 3,
            completed: false
          }
        ]
      }
    };
    
    const questTemplate = climateQuests[climate];
    if (questTemplate) {
      const quest: Quest = {
        ...questTemplate,
        id: `climate_${climate}_${Date.now()}`,
        rewards: [
          {
            type: 'experience',
            value: 25,
            description: `+25 XP for adapting to ${climate} climate`
          }
        ],
        status: 'active',
        startTime: Date.now(),
        currentObjectiveIndex: 0
      } as Quest;
      
      questService.addQuest(quest);
      console.log(`[QuestTrigger] Generated climate quest for ${climate}: ${quest.title}`);
    }
  }

  /**
   * Generate structure-specific quest
   */
  private generateStructureQuest(context: QuestTriggerContext, structureType: string): void {
    const structureQuests: Record<string, Partial<Quest>> = {
      marketplace: {
        title: "Market Opportunities",
        description: "You've discovered a marketplace. Perhaps you can find work or trade here.",
        category: 'trade',
        objectives: [
          {
            id: 'first_trade',
            type: 'trade',
            description: 'Complete your first trade at the marketplace',
            completed: false
          }
        ]
      },
      palace: {
        title: "Royal Audience",
        description: "A palace stands before you. The nobility might have tasks that need doing.",
        category: 'diplomatic',
        objectives: [
          {
            id: 'palace_visit',
            type: 'visit_location',
            description: 'Enter the palace and speak with someone of importance',
            targetLocation: { x: context.tile.x, y: context.tile.y },
            completed: false
          }
        ]
      },
      temple: {
        title: "Sacred Grounds",
        description: "You've found a holy site. The faithful here might need assistance.",
        category: 'social',
        objectives: [
          {
            id: 'temple_help',
            type: 'talk_to_npc',
            description: 'Speak with a priest or holy person',
            targetNPC: 'priest',
            completed: false
          }
        ]
      }
    };
    
    const questTemplate = structureQuests[structureType];
    if (questTemplate) {
      const quest: Quest = {
        ...questTemplate,
        id: `structure_${structureType}_${Date.now()}`,
        rewards: [
          {
            type: 'reputation',
            value: 5,
            description: '+5 reputation'
          }
        ],
        status: 'active',
        startTime: Date.now(),
        currentObjectiveIndex: 0
      } as Quest;
      
      questService.addQuest(quest);
      console.log(`[QuestTrigger] Generated structure quest for ${structureType}: ${quest.title}`);
    }
  }

  /**
   * Generate ruins exploration quest
   */
  private generateRuinsQuest(context: QuestTriggerContext): void {
    const quest: Quest = {
      id: `ruins_explore_${Date.now()}`,
      title: "Echoes of the Past",
      description: "These ancient ruins might hold valuable artifacts or knowledge. Explore carefully.",
      category: 'exploration',
      objectives: [
        {
          id: 'explore_ruins',
          type: 'explore_area',
          description: 'Search the ruins thoroughly',
          targetLocation: { 
            x: context.tile.x, 
            y: context.tile.y,
            radius: 2
          },
          completed: false
        }
      ],
      rewards: [
        {
          type: 'item',
          value: 1,
          description: 'Ancient artifact'
        },
        {
          type: 'knowledge',
          value: 1,
          description: 'Historical knowledge'
        }
      ],
      status: 'active',
      startTime: Date.now(),
      currentObjectiveIndex: 0,
      historicalContext: "These ruins date back centuries, holding secrets of those who came before."
    } as Quest;
    
    questService.addQuest(quest);
    console.log('[QuestTrigger] Generated ruins exploration quest');
  }

  /**
   * Generate NPC-specific quest after multiple interactions
   */
  private generateNPCQuest(context: QuestTriggerContext, npc: NpcEntity): void {
    const quest: Quest = {
      id: `npc_${npc.id}_quest_${Date.now()}`,
      title: `${npc.name}'s Request`,
      description: `${npc.name} has begun to trust you and has a personal request.`,
      category: 'social',
      objectives: [
        {
          id: 'help_npc',
          type: 'deliver_item',
          description: `Help ${npc.name} with their problem`,
          targetNPC: npc.id,
          targetItem: 'any',
          completed: false
        }
      ],
      rewards: [
        {
          type: 'relationship',
          value: 10,
          description: `Improved relationship with ${npc.name}`
        }
      ],
      status: 'active',
      startTime: Date.now(),
      currentObjectiveIndex: 0
    } as Quest;
    
    questService.addQuest(quest);
    console.log(`[QuestTrigger] Generated NPC quest for ${npc.name}`);
  }

  /**
   * Generate deeper NPC quest after many interactions
   */
  private generateDeepNPCQuest(context: QuestTriggerContext, npc: NpcEntity): void {
    const quest: Quest = {
      id: `npc_deep_${npc.id}_${Date.now()}`,
      title: `${npc.name}'s Trust`,
      description: `${npc.name} considers you a friend and needs help with something important.`,
      category: 'social',
      objectives: [
        {
          id: 'important_task',
          type: 'complete_task',
          description: `Complete an important task for ${npc.name}`,
          targetNPC: npc.id,
          completed: false
        }
      ],
      rewards: [
        {
          type: 'relationship',
          value: 25,
          description: `Deep friendship with ${npc.name}`
        },
        {
          type: 'item',
          value: 1,
          description: 'Special gift from friend'
        }
      ],
      status: 'active',
      startTime: Date.now(),
      currentObjectiveIndex: 0
    } as Quest;
    
    questService.addQuest(quest);
    console.log(`[QuestTrigger] Generated deep relationship quest for ${npc.name}`);
  }

  /**
   * Generate naval/maritime quest
   */
  private generateNavalQuest(context: QuestTriggerContext): void {
    const quest: Quest = {
      id: `naval_${Date.now()}`,
      title: "Call of the Sea",
      description: "You've taken to the waters again. Perhaps there are opportunities on distant shores.",
      category: 'exploration',
      objectives: [
        {
          id: 'sail_distance',
          type: 'travel_distance',
          description: 'Sail to a distant land',
          targetDistance: 20,
          completed: false
        }
      ],
      rewards: [
        {
          type: 'experience',
          value: 30,
          description: '+30 XP for maritime exploration'
        }
      ],
      status: 'active',
      startTime: Date.now(),
      currentObjectiveIndex: 0
    } as Quest;
    
    questService.addQuest(quest);
    console.log('[QuestTrigger] Generated naval quest');
  }

  /**
   * Generate time-based quest
   */
  private generateTimeBasedQuest(context: QuestTriggerContext, timeframe: string): void {
    const quest: Quest = {
      id: `time_${timeframe}_${Date.now()}`,
      title: "A Week's Journey",
      description: "You've survived a week in this land. Your experience grows.",
      category: 'survival',
      objectives: [
        {
          id: 'week_milestone',
          type: 'survive_duration',
          description: 'Continue thriving in this land',
          targetDays: 3,
          completed: false
        }
      ],
      rewards: [
        {
          type: 'experience',
          value: 50,
          description: '+50 XP for surviving a week'
        }
      ],
      status: 'active',
      startTime: Date.now(),
      currentObjectiveIndex: 0
    } as Quest;
    
    questService.addQuest(quest);
    console.log('[QuestTrigger] Generated time-based quest');
  }
}

// Export singleton instance
export const questTriggerService = new QuestTriggerService();