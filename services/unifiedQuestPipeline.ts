/**
 * Unified Quest Pipeline
 * Single source of truth for all quest generation
 * 
 * Architecture Overview:
 * =====================
 * This service consolidates all quest generation into a single, coherent pipeline.
 * Previously, quest generation was scattered across 7+ different services and files.
 * 
 * Quest Generation Flow:
 * 1. Context Creation → Build QuestGenerationContext with map, player, zone, era data
 * 2. Historical Context → Fetch era/zone-appropriate historical data (cached)
 * 3. Entity Registry → Query world entities (NPCs, structures) near player
 * 4. Template Selection → Choose appropriate quest template based on context
 * 5. Quest Generation → Generate quest with historical flavor text
 * 6. Reality Binding → Replace generic placeholders with actual NPC/location names
 * 7. Historical Validation → Ensure quest is historically appropriate
 * 8. Game State Validation → Verify quest is achievable in current game state
 * 9. Auto-Repair → Fix broken references if entities have moved/disappeared
 * 
 * Integration Points:
 * - questService.ts → Uses generateInitialQuests() for game start
 * - eventService.ts → Uses generateQuest() for event-triggered quests
 * - useCoreLoops.ts → Async quest generation on map load
 * 
 * Legacy Systems Integrated:
 * - questVarietyService → generateVarietyQuest()
 * - oceanQuestTemplates → generateOceanQuest()
 * - economicQuestTemplates → generateEconomicQuest()
 * 
 * Performance Optimizations:
 * - Historical context caching (5 minute TTL)
 * - Quest generation history tracking
 * - Weighted template selection
 * 
 * @author Benjamin Breen
 * @since December 2024
 */

import { Quest, QuestObjective } from '../types/questTypes';
import { MapData, NpcEntity, TerrainStructure } from '../types';
import { worldEntityRegistry } from './worldEntityRegistry';
import { questRealityBinding } from './questRealityBinding';
import { questValidationService } from './questValidationService';
import { historicalContextEngine } from './historicalContextEngine';
import { getAvailableCategories, filterDuplicateCategories } from './questVarietyService';
import { getOceanQuests } from './oceanQuestTemplates';
import { getApplicableQuestTemplates, generateQuestFromTemplate } from '../constants/questTemplates/economicQuestTemplates';
import { CulturalZone, HistoricalEra } from '../types/characterData';

export interface QuestGenerationContext {
  mapData: MapData;
  playerLocation: { x: number; y: number };
  playerStats?: {
    health: number;
    reputation: number;
    wealth: number;
    intelligence: number;
    strength: number;
  };
  zone: string;
  era: string;
  year: number;
  season?: string;
  gameMode?: string;
  triggerType?: 'event' | 'exploration' | 'npc' | 'crisis' | 'manual';
  triggerEntity?: string; // Entity ID that triggered quest
  customPrompt?: string; // For LLM-generated quests
}

export interface QuestTemplate {
  id: string;
  name: string;
  category: 'survival' | 'exploration' | 'trade' | 'social' | 'combat' | 'diplomacy' | 'scholarship';
  minReputation?: number;
  requiredEntities?: Array<'npc' | 'ruler' | 'structure' | 'settlement'>;
  culturalZones?: CulturalZone[];
  eras?: HistoricalEra[];
  weight: number; // Priority weight for selection
  generator: (context: QuestGenerationContext) => Promise<Quest | null>;
}

class UnifiedQuestPipeline {
  private templates: Map<string, QuestTemplate> = new Map();
  private categoryWeights: Map<string, number> = new Map();
  private generationHistory: Map<string, number> = new Map(); // Track recently generated types
  private historicalContextCache: Map<string, any> = new Map(); // Cache historical context lookups
  private cacheTimeout: number = 300000; // 5 minutes cache
  
  constructor() {
    this.initializeTemplates();
    this.initializeCategoryWeights();
    this.startCacheCleanup();
  }

  /**
   * Periodic cache cleanup to prevent memory leaks
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.historicalContextCache.entries()) {
        if (value.timestamp && now - value.timestamp > this.cacheTimeout) {
          this.historicalContextCache.delete(key);
        }
      }
    }, this.cacheTimeout);
  }

  /**
   * Get historical context with caching
   */
  private async getCachedHistoricalContext(
    zone: string,
    era: string,
    year: number
  ): Promise<any> {
    const cacheKey = `${zone}_${era}_${year}`;
    
    // Check cache first
    if (this.historicalContextCache.has(cacheKey)) {
      const cached = this.historicalContextCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }
    
    // Fetch fresh context
    const context = await historicalContextEngine.getContext(zone, era, year);
    
    // Cache it
    this.historicalContextCache.set(cacheKey, {
      data: context,
      timestamp: Date.now()
    });
    
    return context;
  }

  /**
   * Initialize all quest templates
   */
  private initializeTemplates(): void {
    // Register core quest templates
    this.registerCoreTemplates();
    
    // Initialize historical validation
    
    // Templates will be populated from various sources
    // This consolidates all the scattered quest generation logic
  }

  /**
   * Register core quest templates that work across all zones/eras
   */
  private registerCoreTemplates(): void {
    // Survival Templates
    this.registerTemplate({
      id: 'find_shelter',
      name: 'Find Shelter',
      category: 'survival',
      weight: 10,
      generator: async (context) => {
        const historicalContext = await this.getCachedHistoricalContext(
          context.zone, context.era, context.year
        );
        return this.generateFindShelterQuest(context, historicalContext);
      }
    });

    this.registerTemplate({
      id: 'gather_resources',
      name: 'Gather Resources',
      category: 'survival',
      weight: 8,
      generator: async (context) => {
        const historicalContext = await this.getCachedHistoricalContext(
          context.zone, context.era, context.year
        );
        return this.generateGatherResourcesQuest(context, historicalContext);
      }
    });

    // Exploration Templates
    this.registerTemplate({
      id: 'explore_landmark',
      name: 'Explore Landmark',
      category: 'exploration',
      requiredEntities: ['structure'],
      weight: 7,
      generator: async (context) => {
        const historicalContext = await this.getCachedHistoricalContext(
          context.zone, context.era, context.year
        );
        return this.generateExploreLandmarkQuest(context, historicalContext);
      }
    });

    // Social Templates
    this.registerTemplate({
      id: 'deliver_message',
      name: 'Deliver Message',
      category: 'social',
      requiredEntities: ['npc'],
      minReputation: 5,
      weight: 6,
      generator: async (context) => {
        const historicalContext = await this.getCachedHistoricalContext(
          context.zone, context.era, context.year
        );
        return this.generateDeliverMessageQuest(context, historicalContext);
      }
    });

    // Trade Templates
    this.registerTemplate({
      id: 'trade_route',
      name: 'Establish Trade Route',
      category: 'trade',
      requiredEntities: ['npc', 'settlement'],
      minReputation: 10,
      weight: 5,
      generator: async (context) => {
        const historicalContext = await this.getCachedHistoricalContext(
          context.zone, context.era, context.year
        );
        return this.generateTradeRouteQuest(context, historicalContext);
      }
    });
  }

  /**
   * Initialize category weights based on game mode
   */
  private initializeCategoryWeights(): void {
    // Default weights
    this.categoryWeights.set('survival', 1.0);
    this.categoryWeights.set('exploration', 1.0);
    this.categoryWeights.set('trade', 1.0);
    this.categoryWeights.set('social', 1.0);
    this.categoryWeights.set('combat', 1.0);
    this.categoryWeights.set('diplomacy', 1.0);
    this.categoryWeights.set('scholarship', 1.0);
  }

  /**
   * Register a quest template
   */
  public registerTemplate(template: QuestTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Main quest generation method - single entry point
   */
  public async generateQuest(context: QuestGenerationContext): Promise<Quest | null> {
    // Step 1: Validate context
    if (!this.validateContext(context)) {
      console.warn('[UnifiedQuestPipeline] Invalid context for quest generation');
      return null;
    }

    // Step 2: Update world entity registry
    worldEntityRegistry.updatePlayerLocation(context.playerLocation);

    // Step 3: Get historical context (with caching)
    const historicalContext = await this.getCachedHistoricalContext(
      context.zone,
      context.era,
      context.year
    );

    // Step 4: Determine quest type based on context
    const questType = this.determineQuestType(context, historicalContext);

    // Step 5: Generate quest based on type
    let quest: Quest | null = null;

    if (context.customPrompt) {
      // LLM-generated quest from prompt
      quest = await this.generateLLMQuest(context, historicalContext);
    } else if (questType === 'crisis') {
      // Crisis-triggered quest
      quest = this.generateCrisisQuest(context, historicalContext);
    } else {
      // Template-based quest
      quest = this.generateTemplateQuest(context, historicalContext, questType);
    }

    if (!quest) {
      console.warn('[UnifiedQuestPipeline] Failed to generate quest');
      return null;
    }

    // Step 6: Bind quest to reality
    const boundQuest = questRealityBinding.bindQuestToReality(
      quest,
      context.playerLocation,
      context.zone,
      context.era
    );

    // Step 7: Historical validation
    const historicallyValid = await this.validateHistoricalAccuracy(boundQuest, context);
    if (!historicallyValid) {
      console.warn('[UnifiedQuestPipeline] Quest failed historical validation');
      return null;
    }

    // Step 8: Game state validation
    const validation = questValidationService.validateQuest(boundQuest, {
      mapData: context.mapData,
      npcs: worldEntityRegistry.queryEntities({ type: 'npc', active: true }) as any[],
      structures: worldEntityRegistry.queryEntities({ type: 'structure', active: true }) as any[],
      playerLocation: context.playerLocation,
      timeOfDay: 12, // Default noon
      season: context.season || 'spring'
    });

    if (!validation.isValid) {
      // Try to auto-repair
      const repaired = questValidationService.autoRepairQuest(boundQuest, {
        mapData: context.mapData,
        npcs: worldEntityRegistry.queryEntities({ type: 'npc', active: true }) as any[],
        structures: worldEntityRegistry.queryEntities({ type: 'structure', active: true }) as any[],
        playerLocation: context.playerLocation,
        timeOfDay: 12,
        season: context.season || 'spring'
      });

      if (!repaired) {
        console.warn('[UnifiedQuestPipeline] Quest validation failed and could not be repaired');
        return null;
      }

      return repaired as Quest;
    }

    // Step 8: Record generation for diversity
    this.recordGeneration(quest.category);

    return boundQuest as Quest;
  }

  /**
   * Generate multiple quests ensuring variety
   */
  public async generateMultipleQuests(
    context: QuestGenerationContext,
    count: number
  ): Promise<Quest[]> {
    const quests: Quest[] = [];
    const usedCategories = new Set<string>();
    const usedTemplates = new Set<string>();

    for (let i = 0; i < count; i++) {
      // Modify context to encourage variety
      const modifiedContext = {
        ...context,
        excludeCategories: Array.from(usedCategories),
        excludeTemplates: Array.from(usedTemplates)
      };

      const quest = await this.generateQuest(modifiedContext);
      
      if (quest) {
        quests.push(quest);
        usedCategories.add(quest.category);
        
        // Track template if it has one
        const templateId = (quest as any).templateId;
        if (templateId) {
          usedTemplates.add(templateId);
        }
      }
    }

    return quests;
  }

  /**
   * Validate generation context
   */
  private validateContext(context: QuestGenerationContext): boolean {
    if (!context.mapData || !context.playerLocation) {
      return false;
    }

    if (!context.zone || !context.era) {
      return false;
    }

    return true;
  }

  /**
   * Determine quest type based on context and triggers
   */
  private determineQuestType(
    context: QuestGenerationContext,
    historicalContext: any
  ): string {
    // Priority order for quest type determination
    
    // 1. Crisis takes precedence
    if (context.triggerType === 'crisis') {
      return 'crisis';
    }

    // 2. Event-triggered quests
    if (context.triggerType === 'event') {
      return 'event';
    }

    // 3. NPC-triggered quests
    if (context.triggerType === 'npc' && context.triggerEntity) {
      return 'social';
    }

    // 4. Game mode specific
    if (context.gameMode) {
      switch (context.gameMode) {
        case 'survival': return 'survival';
        case 'exploration': return 'exploration';
        case 'commerce': return 'trade';
        case 'scholarship': return 'scholarship';
        case 'diplomacy': return 'diplomacy';
        default: break;
      }
    }

    // 5. Context-based selection
    const availableEntities = this.getAvailableEntityTypes(context);
    
    if (availableEntities.includes('npc') && Math.random() < 0.3) {
      return 'social';
    }
    
    if (availableEntities.includes('structure') && Math.random() < 0.4) {
      return 'exploration';
    }

    // 6. Default to survival or exploration
    return Math.random() < 0.5 ? 'survival' : 'exploration';
  }

  /**
   * Get available entity types in current context
   */
  private getAvailableEntityTypes(context: QuestGenerationContext): string[] {
    const types: string[] = [];
    
    const npcs = worldEntityRegistry.queryEntities({
      type: 'npc',
      maxDistance: 50,
      active: true
    });
    
    if (npcs.length > 0) types.push('npc');
    
    const structures = worldEntityRegistry.queryEntities({
      type: 'structure',
      maxDistance: 50,
      active: true
    });
    
    if (structures.length > 0) types.push('structure');
    
    const rulers = worldEntityRegistry.queryEntities({
      type: 'ruler',
      active: true
    });
    
    if (rulers.length > 0) types.push('ruler');
    
    const settlements = worldEntityRegistry.queryEntities({
      type: 'settlement',
      maxDistance: 100,
      active: true
    });
    
    if (settlements.length > 0) types.push('settlement');
    
    return types;
  }

  /**
   * Generate LLM quest from custom prompt (placeholder for future implementation)
   */
  private async generateLLMQuest(
    context: QuestGenerationContext,
    historicalContext: any
  ): Promise<Quest | null> {
    // TODO: Implement proper LLM quest generation
    // For now, fall back to template-based generation
    console.warn('[UnifiedQuestPipeline] LLM quest generation not yet implemented, using template fallback');
    
    // Use the custom prompt to influence template selection
    let preferredType = 'exploration'; // default
    
    if (context.customPrompt) {
      const prompt = context.customPrompt.toLowerCase();
      if (prompt.includes('trade') || prompt.includes('merchant')) {
        preferredType = 'trade';
      } else if (prompt.includes('fight') || prompt.includes('combat')) {
        preferredType = 'combat';
      } else if (prompt.includes('talk') || prompt.includes('social')) {
        preferredType = 'social';
      } else if (prompt.includes('survive') || prompt.includes('food')) {
        preferredType = 'survival';
      } else if (prompt.includes('explore') || prompt.includes('find')) {
        preferredType = 'exploration';
      }
    }
    
    return await this.generateTemplateQuest(context, historicalContext, preferredType);
  }

  /**
   * Add historical validation to generated quests
   */
  private async validateHistoricalAccuracy(
    quest: Quest, 
    context: QuestGenerationContext
  ): Promise<boolean> {
    // Check quest elements against historical context
    const elements = [
      quest.title,
      quest.description,
      ...quest.objectives.map(obj => obj.description)
    ];

    for (const element of elements) {
      const isAppropriate = historicalContextEngine.isHistoricallyAppropriate(
        element,
        context.zone,
        context.era
      );
      
      if (!isAppropriate) {
        console.warn(`[UnifiedQuestPipeline] Quest element "${element}" is historically inappropriate for ${context.era} ${context.zone}`);
        return false; // Reject the quest
      }
    }

    return true;
  }

  /**
   * Generate crisis-triggered quest
   */
  private generateCrisisQuest(
    context: QuestGenerationContext,
    historicalContext: any
  ): Quest | null {
    // This would integrate with crisis detection service
    // For now, generate a survival quest
    return this.generateTemplateQuest(context, historicalContext, 'survival');
  }

  /**
   * Generate template-based quest
   */
  private async generateTemplateQuest(
    context: QuestGenerationContext,
    historicalContext: any,
    preferredType: string
  ): Promise<Quest | null> {
    // Get eligible templates
    const eligibleTemplates = this.getEligibleTemplates(context, preferredType);
    
    if (eligibleTemplates.length === 0) {
      console.warn('[UnifiedQuestPipeline] No eligible templates found');
      return null;
    }

    // Select template based on weights
    const template = this.selectWeightedTemplate(eligibleTemplates);
    
    if (!template) {
      return null;
    }

    // Generate quest from template
    const quest = await template.generator(context);
    
    if (quest) {
      // Add template ID for tracking
      (quest as any).templateId = template.id;
      
      // Add historical flavor
      quest.historicalContext = historicalContext.questContext || historicalContext.summary;
    }

    return quest;
  }

  /**
   * Get eligible templates based on context
   */
  private getEligibleTemplates(
    context: QuestGenerationContext,
    preferredType: string
  ): QuestTemplate[] {
    const eligible: QuestTemplate[] = [];
    const availableEntities = this.getAvailableEntityTypes(context);

    for (const template of this.templates.values()) {
      // Check category match
      if (preferredType && template.category !== preferredType) {
        continue;
      }

      // Check reputation requirement
      if (template.minReputation && context.playerStats) {
        if (context.playerStats.reputation < template.minReputation) {
          continue;
        }
      }

      // Check required entities
      if (template.requiredEntities) {
        const hasRequired = template.requiredEntities.every(entity => 
          availableEntities.includes(entity)
        );
        
        if (!hasRequired) {
          continue;
        }
      }

      // Check cultural zone
      if (template.culturalZones && template.culturalZones.length > 0) {
        if (!template.culturalZones.includes(context.zone as CulturalZone)) {
          continue;
        }
      }

      // Check era
      if (template.eras && template.eras.length > 0) {
        if (!template.eras.includes(context.era as HistoricalEra)) {
          continue;
        }
      }

      eligible.push(template);
    }

    return eligible;
  }

  /**
   * Select template based on weights
   */
  private selectWeightedTemplate(templates: QuestTemplate[]): QuestTemplate | null {
    if (templates.length === 0) return null;
    
    // Calculate total weight
    let totalWeight = 0;
    const weightedTemplates = templates.map(template => {
      // Adjust weight based on recent generation
      const recentCount = this.generationHistory.get(template.category) || 0;
      const adjustedWeight = template.weight * Math.pow(0.8, recentCount);
      totalWeight += adjustedWeight;
      
      return { template, weight: adjustedWeight };
    });

    // Random selection
    const random = Math.random() * totalWeight;
    let cumulative = 0;
    
    for (const { template, weight } of weightedTemplates) {
      cumulative += weight;
      if (random <= cumulative) {
        return template;
      }
    }

    return templates[0]; // Fallback
  }

  /**
   * Record quest generation for diversity tracking
   */
  private recordGeneration(category: string): void {
    const current = this.generationHistory.get(category) || 0;
    this.generationHistory.set(category, current + 1);
    
    // Decay history over time
    setTimeout(() => {
      const count = this.generationHistory.get(category) || 0;
      if (count > 0) {
        this.generationHistory.set(category, count - 1);
      }
    }, 300000); // 5 minutes
  }

  /**
   * Update category weights based on game mode
   */
  public updateCategoryWeights(gameMode: string): void {
    // Reset to defaults
    this.initializeCategoryWeights();
    
    // Adjust based on game mode
    switch (gameMode) {
      case 'survival':
        this.categoryWeights.set('survival', 2.0);
        this.categoryWeights.set('exploration', 1.5);
        this.categoryWeights.set('combat', 0.5);
        break;
      
      case 'exploration':
        this.categoryWeights.set('exploration', 2.0);
        this.categoryWeights.set('scholarship', 1.5);
        this.categoryWeights.set('combat', 0.3);
        break;
      
      case 'commerce':
        this.categoryWeights.set('trade', 2.0);
        this.categoryWeights.set('social', 1.5);
        this.categoryWeights.set('diplomacy', 1.3);
        break;
      
      case 'combat':
        this.categoryWeights.set('combat', 2.0);
        this.categoryWeights.set('survival', 1.5);
        this.categoryWeights.set('scholarship', 0.3);
        break;
    }
  }

  // Quest generator implementations - Enhanced with Historical Context
  private async generateFindShelterQuest(
    context: QuestGenerationContext, 
    historicalContext: any
  ): Promise<Quest> {
    const structures = worldEntityRegistry.queryEntities({
      type: 'structure',
      maxDistance: 30,
      active: true
    });

    const shelter = structures.find(s => 
      ['hamlet', 'fortress', 'watchtower', 'mill'].includes(s.attributes.structureType)
    ) || structures[0];

    // Historical context influences the quest narrative
    let title = 'Find Shelter Before Nightfall';
    let description = 'The sun is setting and you need to find shelter for the night.';
    
    // Add historical context based on current conflicts/events
    if (historicalContext.conflicts?.length > 0) {
      const conflict = historicalContext.conflicts[0];
      if (conflict.includes('viking') || conflict.includes('raid')) {
        title = 'Seek Refuge from Raiders';
        description = `${conflict} threaten the countryside. You must find secure shelter before dark.`;
      } else if (conflict.includes('war') || conflict.includes('invasion')) {
        title = 'Escape the War Zone';  
        description = `The ${conflict} has made travel dangerous. Find sanctuary until it passes.`;
      } else if (conflict.includes('plague') || conflict.includes('disease')) {
        title = 'Find Quarantine Shelter';
        description = `${conflict} spreads through the region. You need isolation until the danger passes.`;
      }
    }

    // Add weather/seasonal context if available
    if (context.season) {
      if (context.season === 'winter') {
        title = 'Find Winter Shelter';
        description = `The harsh ${context.season} weather requires immediate shelter. ${description}`;
      } else if (historicalContext.conflicts?.length === 0) {
        // Peaceful seasonal version
        description = `Night falls during the ${context.season} season. Traditional hospitality customs require finding proper lodging.`;
      }
    }

    return {
      id: `quest_shelter_${Date.now()}`,
      title,
      description,
      historicalContext: historicalContext.questContext,
      category: 'survival',
      objectives: [
        {
          id: 'obj_1',
          description: shelter ? 
            `Reach ${shelter.name}` : 
            'Find suitable shelter',
          type: 'visit_location',
          targetLocation: shelter?.location || {
            x: context.playerLocation.x + Math.floor(Math.random() * 20 - 10),
            y: context.playerLocation.y + Math.floor(Math.random() * 20 - 10)
          },
          completed: false
        }
      ],
      currentObjectiveIndex: 0,
      rewards: historicalContext.getAppropriateRewards ? 
        historicalContext.getAppropriateRewards(context.zone, context.era, 'easy') :
        [{ type: 'experience', value: 10, description: 'Survival experience' }],
      startLocation: context.playerLocation,
      startTime: Date.now(),
      status: 'active',
      timeLimit: 600000 // 10 minutes
    };
  }

  private async generateGatherResourcesQuest(
    context: QuestGenerationContext, 
    historicalContext: any
  ): Promise<Quest> {
    // Use historical context to determine appropriate resources
    const resources = historicalContext.availableResources || ['food', 'water'];
    const tradeGoods = historicalContext.tradeGoods || [];
    
    let title = 'Gather Essential Supplies';
    let description = 'You need to gather resources to survive.';
    let primaryResource = resources[0] || 'food';
    let secondaryResource = resources[1] || 'water';

    // Historical context adaptation
    if (historicalContext.conflicts?.some((c: string) => c.includes('siege'))) {
      title = 'Stockpile for Siege';
      description = 'With the city under siege, you must gather supplies before they run out.';
      primaryResource = 'grain';
      secondaryResource = 'preserved food';
    } else if (historicalContext.conflicts?.some((c: string) => c.includes('famine'))) {
      title = 'Seek Food in Times of Scarcity';
      description = 'Famine spreads across the land. Find whatever sustenance you can.';
      primaryResource = resources.find(r => r.includes('grain') || r.includes('wheat')) || 'wild roots';
    } else if (context.season === 'winter') {
      title = 'Prepare for Winter';
      description = `Gather supplies to survive the harsh ${context.season} months ahead.`;
      primaryResource = 'firewood';
      secondaryResource = 'preserved food';
    } else if (tradeGoods.length > 0) {
      // Peaceful times - gather valuable trade goods
      title = 'Collect Valuable Materials';
      description = `Local traders seek ${tradeGoods[0]}. Gather these valuable resources.`;
      primaryResource = tradeGoods[0];
      secondaryResource = tradeGoods[1] || resources[0];
    }

    // Era-specific resource gathering methods
    let gatheringMethod = 'foraging';
    if (historicalContext.technology?.includes('agriculture') || historicalContext.technology?.includes('farming')) {
      gatheringMethod = 'farming';
    } else if (historicalContext.technology?.includes('mining')) {
      gatheringMethod = 'mining';
      if (resources.includes('iron') || resources.includes('copper')) {
        primaryResource = resources.find(r => r.includes('iron') || r.includes('copper')) || primaryResource;
      }
    }

    return {
      id: `quest_gather_${Date.now()}`,
      title,
      description,
      historicalContext: historicalContext.questContext,
      category: 'survival',
      objectives: [
        {
          id: 'obj_1',
          description: `Gather 5 units of ${primaryResource}`,
          type: 'collect_resource',
          resourceType: primaryResource,
          targetAmount: 5,
          currentAmount: 0,
          completed: false
        },
        {
          id: 'obj_2',
          description: `Find ${secondaryResource}`,
          type: 'collect_resource',
          resourceType: secondaryResource,
          targetAmount: 1,
          currentAmount: 0,
          completed: false
        }
      ],
      currentObjectiveIndex: 0,
      rewards: historicalContext.getAppropriateRewards ? 
        historicalContext.getAppropriateRewards(context.zone, context.era, 'easy') :
        [{ type: 'experience', value: 15, description: `${gatheringMethod} experience` }],
      startLocation: context.playerLocation,
      startTime: Date.now(),
      status: 'active'
    };
  }

  private async generateExploreLandmarkQuest(
    context: QuestGenerationContext, 
    historicalContext: any
  ): Promise<Quest | null> {
    const structures = worldEntityRegistry.queryEntities({
      type: 'structure',
      maxDistance: 50,
      active: true
    });

    if (structures.length === 0) return null;

    const landmark = structures[Math.floor(Math.random() * structures.length)];
    
    let title = `Investigate the ${landmark.name}`;
    let description = `There are rumors about the ${landmark.name}. You should investigate.`;
    let searchDescription = 'Search for anything interesting';

    // Historical context adaptation
    if (landmark.attributes.structureType === 'ruins') {
      // Era-appropriate archaeology/exploration
      if (context.era === 'MODERN' || (context.era === 'INDUSTRIAL' && context.year > 1850)) {
        title = `Archaeological Survey of ${landmark.name}`;
        description = `The ruins of ${landmark.name} may hold artifacts from ancient times.`;
        searchDescription = 'Carefully excavate and document findings';
      } else {
        title = `Explore Ancient Ruins`;
        description = `The old stones of ${landmark.name} whisper of forgotten times. Local legends speak of treasure or danger.`;
        searchDescription = 'Search among the ancient stones';
      }
    } else if (landmark.attributes.structureType === 'holy_site') {
      title = `Pilgrimage to ${landmark.name}`;
      description = `The sacred ${landmark.name} draws pilgrims from across the land. `;
      if (historicalContext.religiousContext) {
        description += historicalContext.religiousContext;
      }
      searchDescription = 'Pay respects and seek spiritual insight';
    } else if (landmark.attributes.structureType === 'fortress' || landmark.attributes.structureType === 'castle') {
      if (historicalContext.conflicts?.length > 0) {
        title = `Scout the Fortifications`;
        description = `With ${historicalContext.conflicts[0]} threatening the region, ${landmark.name} may provide strategic intelligence.`;
        searchDescription = 'Assess military strength and defenses';
      } else {
        title = `Visit the ${landmark.name}`;
        description = `The imposing ${landmark.name} dominates the landscape. Perhaps its lord has need of services.`;
        searchDescription = 'Seek audience or investigate opportunities';
      }
    }

    // Add cultural context
    if (historicalContext.culturalTaboos?.length > 0) {
      const taboo = historicalContext.culturalTaboos[0];
      description += ` Be careful not to commit ${taboo}.`;
    }

    return {
      id: `quest_explore_${Date.now()}`,
      title,
      description,
      historicalContext: historicalContext.questContext,
      category: 'exploration',
      objectives: [
        {
          id: 'obj_1',
          description: `Travel to ${landmark.name}`,
          type: 'visit_location',
          targetLocation: landmark.location,
          completed: false
        },
        {
          id: 'obj_2',
          description: searchDescription,
          type: 'explore_area',
          targetLocation: landmark.location,
          radius: 5,
          completed: false
        }
      ],
      currentObjectiveIndex: 0,
      rewards: historicalContext.getAppropriateRewards ? 
        historicalContext.getAppropriateRewards(context.zone, context.era, 'medium') :
        [
          { type: 'experience', value: 20, description: 'Exploration experience' },
          { type: 'reputation', value: 5, description: 'Local reputation' }
        ],
      startLocation: context.playerLocation,
      startTime: Date.now(),
      status: 'active'
    };
  }

  private async generateDeliverMessageQuest(
    context: QuestGenerationContext, 
    historicalContext: any
  ): Promise<Quest | null> {
    const npcs = worldEntityRegistry.queryEntities({
      type: 'npc',
      maxDistance: 40,
      active: true
    });

    if (npcs.length < 2) return null;

    // Try to find NPCs with historically appropriate professions
    const sender = npcs.find(n => 
      historicalContext.commonProfessions?.includes(n.attributes.profession)
    ) || npcs[0];
    
    const recipient = npcs.find(n => 
      n.id !== sender.id && 
      historicalContext.commonProfessions?.includes(n.attributes.profession)
    ) || npcs[1];

    let title = 'Urgent Message';
    let description = `${sender.name} needs you to deliver an urgent message.`;
    let messageContent = 'a private message';

    // Historical context for message content
    if (historicalContext.conflicts?.length > 0) {
      const conflict = historicalContext.conflicts[0];
      title = 'War Dispatch';
      description = `${sender.name} the ${sender.attributes.profession} has urgent news about ${conflict}.`;
      messageContent = `intelligence about ${conflict}`;
    } else if (sender.attributes.profession?.includes('merchant') && recipient.attributes.profession?.includes('merchant')) {
      title = 'Trade Intelligence';
      description = `${sender.name} has news about valuable ${historicalContext.tradeGoods?.[0] || 'goods'} for ${recipient.name}.`;
      messageContent = `trade opportunities involving ${historicalContext.tradeGoods?.[0] || 'valuable goods'}`;
    } else if (sender.attributes.profession?.includes('priest') || sender.attributes.profession?.includes('monk')) {
      title = 'Sacred Message';
      description = `${sender.name} the ${sender.attributes.profession} needs to send word about religious matters.`;
      messageContent = 'sacred correspondence';
    } else if (historicalContext.socialStructure?.[0]) {
      // Message between social classes
      const socialContext = historicalContext.socialStructure[0];
      title = 'Noble Communication';
      description = `${sender.name} serves the ${socialContext} and needs this message delivered with discretion.`;
      messageContent = 'correspondence regarding court matters';
    }

    // Add urgency based on historical context
    if (historicalContext.conflicts?.some((c: string) => c.includes('siege'))) {
      description += ' Time is critical with the siege ongoing.';
    } else if (context.season === 'winter') {
      description += ' Winter weather makes this delivery urgent.';
    }

    return {
      id: `quest_deliver_${Date.now()}`,
      title,
      description,
      historicalContext: historicalContext.questContext,
      category: 'social',
      objectives: [
        {
          id: 'obj_1',
          description: `Receive ${messageContent} from ${sender.name}`,
          type: 'talk_to_npc',
          targetNpcId: sender.id,
          targetLocation: sender.location,
          completed: false
        },
        {
          id: 'obj_2',
          description: `Deliver ${messageContent} to ${recipient.name}`,
          type: 'deliver_to_npc',
          targetNpcId: recipient.id,
          targetLocation: recipient.location,
          completed: false
        }
      ],
      currentObjectiveIndex: 0,
      rewards: historicalContext.getAppropriateRewards ? 
        historicalContext.getAppropriateRewards(context.zone, context.era, 'medium') :
        [
          { type: 'reputation', value: 10, description: 'Messenger reputation' },
          { type: 'currency', value: 5, description: `Payment in ${historicalContext.currency || 'coins'}` }
        ],
      startLocation: context.playerLocation,
      startTime: Date.now(),
      status: 'active'
    };
  }

  private async generateTradeRouteQuest(
    context: QuestGenerationContext, 
    historicalContext: any
  ): Promise<Quest | null> {
    const merchants = worldEntityRegistry.queryEntities({
      type: 'npc',
      attributes: { profession: 'merchant' },
      maxDistance: 50,
      active: true
    });

    const settlements = worldEntityRegistry.queryEntities({
      type: 'settlement',
      maxDistance: 100,
      active: true
    });

    if (merchants.length === 0 || settlements.length === 0) return null;

    const merchant = merchants[0];
    const settlement = settlements[0];
    
    // Use historical trade goods
    const tradeGood = historicalContext.tradeGoods?.[0] || 'goods';
    const currency = historicalContext.currency || 'coins';
    
    let title = 'Establish Trade Route';
    let description = `Help ${merchant.name} establish a new trade route.`;
    let routeContext = '';

    // Historical context adaptation
    if (historicalContext.conflicts?.length > 0) {
      const conflict = historicalContext.conflicts[0];
      title = 'Secure Trade During Conflict';
      description = `${conflict} has disrupted trade routes. ${merchant.name} needs a safe path to sell ${tradeGood}.`;
      routeContext = `Check for ${conflict.includes('bandit') ? 'bandit activity' : 'military presence'}`;
    } else if (historicalContext.zone === 'MENA' || historicalContext.zone === 'CENTRAL_ASIAN') {
      title = 'Caravan Route Survey';
      description = `${merchant.name} seeks to join the great trade networks carrying ${tradeGood} across distant lands.`;
      routeContext = 'Assess water sources and caravanserai locations';
    } else if (historicalContext.zone === 'OCEANIA') {
      title = 'Maritime Trade Route';
      description = `${merchant.name} needs to establish sea routes for trading ${tradeGood} between islands.`;
      routeContext = 'Check harbor conditions and seasonal winds';
    } else if (context.era === 'MEDIEVAL') {
      title = 'Guild-Sanctioned Trade';
      description = `The merchant guild has authorized ${merchant.name} to expand trade in ${tradeGood}.`;
      routeContext = 'Verify guild recognition and trading rights';
    } else if (context.era === 'INDUSTRIAL') {
      title = 'Railway Commerce Route';
      description = `${merchant.name} seeks to utilize the new transportation networks for ${tradeGood}.`;
      routeContext = 'Survey railway connections and schedules';
    }

    return {
      id: `quest_trade_${Date.now()}`,
      title,
      description,
      historicalContext: historicalContext.questContext,
      category: 'trade',
      objectives: [
        {
          id: 'obj_1',
          description: `Discuss ${tradeGood} trade prospects with ${merchant.name}`,
          type: 'talk_to_npc',
          targetNpcId: merchant.id,
          targetLocation: merchant.location,
          completed: false
        },
        {
          id: 'obj_2',
          description: `Survey the route to ${settlement.name}${routeContext ? ` - ${routeContext}` : ''}`,
          type: 'visit_location',
          targetLocation: settlement.location,
          completed: false
        },
        {
          id: 'obj_3',
          description: 'Report findings and establish the trade agreement',
          type: 'return_to_npc',
          targetNpcId: merchant.id,
          targetLocation: merchant.location,
          completed: false
        }
      ],
      currentObjectiveIndex: 0,
      rewards: historicalContext.getAppropriateRewards ? 
        historicalContext.getAppropriateRewards(context.zone, context.era, 'hard') :
        [
          { type: 'reputation', value: 15, description: 'Merchant reputation' },
          { type: 'currency', value: 20, description: `Payment in ${currency}` },
          { type: 'item', itemId: tradeGood.toUpperCase(), quantity: 1, description: `Sample of ${tradeGood}` }
        ],
      startLocation: context.playerLocation,
      startTime: Date.now(),
      status: 'active'
    };
  }

  // Week 2: Consolidation Methods - Route all external quest systems through unified pipeline

  /**
   * Check if location is near water (for ocean quests)
   * Enhanced with better water detection and edge case handling
   */
  private isNearWater(context: QuestGenerationContext): boolean {
    const { mapData, playerLocation } = context;
    if (!mapData || !mapData.tiles || !playerLocation) return false;
    
    // Validate map dimensions
    const width = mapData.width || 100;
    const height = mapData.height || 100;
    
    // Check surrounding tiles for water (expanded radius for better detection)
    const radius = 3;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = playerLocation.x + dx;
        const y = playerLocation.y + dy;
        
        // Boundary checks
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        
        const tileIndex = y * width + x;
        
        if (tileIndex >= 0 && tileIndex < mapData.tiles.length) {
          const tile = mapData.tiles[tileIndex];
          
          // More comprehensive water check
          if (tile) {
            const terrain = tile.terrain || tile.type || '';
            const terrainStr = terrain.toString().toLowerCase();
            
            if (terrainStr.includes('water') || 
                terrainStr.includes('ocean') || 
                terrainStr.includes('sea') || 
                terrainStr.includes('river') ||
                terrainStr.includes('lake') ||
                terrainStr.includes('coast') ||
                terrainStr === 'w') { // Sometimes water is just 'w'
              return true;
            }
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Generate quest using questVarietyService (legacy integration)
   */
  public async generateVarietyQuest(
    context: QuestGenerationContext,
    preferredCategory?: string
  ): Promise<Quest | null> {
    try {
      // Get available categories from questVarietyService
      const availableCategories = getAvailableCategories(
        context.gameMode || 'exploration',
        context.nearbyStructures?.length > 0 || false,
        context.nearbyNPCs?.length > 0 || false
      );

      // Filter out duplicate categories if player has active quests
      const filteredCategories = filterDuplicateCategories(
        availableCategories,
        [] // Would need active quests list here
      );

      // Select category
      const category = preferredCategory || 
        filteredCategories[Math.floor(Math.random() * filteredCategories.length)] ||
        'exploration';

      // Generate quest with historical context
      const historicalContext = await historicalContextEngine.getContext(
        context.zone,
        context.era,
        context.year
      );

      // Use existing quest variety service but enhance with historical data
      const questVarietyService = await import('./questVarietyService');
      const structures = context.nearbyStructures || [];
      
      const baseQuest = questVarietyService.generateVariedQuest(
        category,
        context.playerLocation,
        structures,
        context.zone,
        context.era,
        0 // index
      );

      if (!baseQuest) return null;

      // Enhance with historical context
      if (historicalContext.questContext) {
        baseQuest.historicalContext = historicalContext.questContext;
      }

      // Apply historical validation and binding through unified pipeline
      return await this.processLegacyQuest(baseQuest, context);

    } catch (error) {
      console.error('[UnifiedQuestPipeline] Error generating variety quest:', error);
      return null;
    }
  }

  /**
   * Generate ocean-specific quest (legacy integration)
   */
  public async generateOceanQuest(context: QuestGenerationContext): Promise<Quest | null> {
    try {
      if (!this.isNearWater(context)) {
        return null; // Not applicable
      }

      // Get historical context first
      const historicalContext = await historicalContextEngine.getContext(
        context.zone,
        context.era,
        context.year
      );

      // Import and use ocean quest templates
      const oceanQuests = getOceanQuests(context.zone, context.era);
      
      if (!oceanQuests || oceanQuests.length === 0) {
        return null;
      }

      // Select appropriate quest based on context
      const availableQuests = oceanQuests.filter(quest => {
        // Filter based on historical appropriateness
        return historicalContext.maritimeActivities?.some((activity: string) => 
          quest.title.toLowerCase().includes(activity.toLowerCase()) ||
          quest.description.toLowerCase().includes(activity.toLowerCase())
        ) || true; // Fallback to allowing all if no maritime context
      });

      const selectedQuest = availableQuests[Math.floor(Math.random() * availableQuests.length)];
      
      // Enhance quest with historical context
      if (historicalContext.maritimeContext) {
        selectedQuest.historicalContext = historicalContext.maritimeContext;
      }

      // Process through unified pipeline
      return await this.processLegacyQuest(selectedQuest, context);

    } catch (error) {
      console.error('[UnifiedQuestPipeline] Error generating ocean quest:', error);
      return null;
    }
  }

  /**
   * Generate economic quest (legacy integration)
   */
  public async generateEconomicQuest(context: QuestGenerationContext): Promise<Quest | null> {
    try {
      if (!context.nearbyStructures || context.nearbyStructures.length === 0) {
        return null; // Economic quests require structures
      }

      // Get historical context
      const historicalContext = await historicalContextEngine.getContext(
        context.zone,
        context.era,
        context.year
      );

      // Get applicable economic quest templates
      const applicableTemplates = getApplicableQuestTemplates(
        context.zone,
        context.era,
        context.playerStats?.reputation || 0
      );

      if (!applicableTemplates || applicableTemplates.length === 0) {
        return null;
      }

      // Select template based on historical trade goods
      let selectedTemplate = applicableTemplates[0];
      
      if (historicalContext.tradeGoods && historicalContext.tradeGoods.length > 0) {
        // Prefer templates that match historical trade goods
        const matchingTemplate = applicableTemplates.find(template =>
          historicalContext.tradeGoods.some((good: string) =>
            template.description.toLowerCase().includes(good.toLowerCase())
          )
        );
        
        if (matchingTemplate) {
          selectedTemplate = matchingTemplate;
        }
      }

      // Generate quest from template
      const quest = generateQuestFromTemplate(
        selectedTemplate,
        context.playerLocation,
        context.nearbyStructures,
        context.nearbyNPCs || []
      );

      if (!quest) return null;

      // Enhance with economic context
      if (historicalContext.economicContext) {
        quest.historicalContext = historicalContext.economicContext;
      }

      // Process through unified pipeline
      return await this.processLegacyQuest(quest, context);

    } catch (error) {
      console.error('[UnifiedQuestPipeline] Error generating economic quest:', error);
      return null;
    }
  }

  /**
   * Process a quest from legacy systems through the unified pipeline
   */
  private async processLegacyQuest(
    quest: Quest,
    context: QuestGenerationContext
  ): Promise<Quest | null> {
    // Step 1: Bind quest to reality
    const boundQuest = questRealityBinding.bindQuestToReality(
      quest,
      context.playerLocation,
      context.zone,
      context.era
    );

    // Step 2: Historical validation
    const historicallyValid = await this.validateHistoricalAccuracy(boundQuest, context);
    if (!historicallyValid) {
      console.warn('[UnifiedQuestPipeline] Legacy quest failed historical validation');
      return null;
    }

    // Step 3: Game state validation
    const validation = questValidationService.validateQuest(boundQuest, {
      mapData: context.mapData,
      npcs: worldEntityRegistry.queryEntities({ type: 'npc', active: true }) as any[],
      structures: worldEntityRegistry.queryEntities({ type: 'structure', active: true }) as any[],
      playerLocation: context.playerLocation,
      timeOfDay: 12,
      season: context.season || 'spring'
    });

    if (!validation.isValid) {
      // Try to auto-repair
      const repaired = questValidationService.autoRepairQuest(boundQuest, {
        mapData: context.mapData,
        npcs: worldEntityRegistry.queryEntities({ type: 'npc', active: true }) as any[],
        structures: worldEntityRegistry.queryEntities({ type: 'structure', active: true }) as any[],
        playerLocation: context.playerLocation,
        timeOfDay: 12,
        season: context.season || 'spring'
      });

      if (!repaired) {
        console.warn('[UnifiedQuestPipeline] Legacy quest validation failed and could not be repaired');
        return null;
      }

      return repaired as Quest;
    }

    return boundQuest as Quest;
  }

  /**
   * Enhanced quest generation that tries all sources in priority order
   */
  public async generateQuestWithFallbacks(context: QuestGenerationContext): Promise<Quest | null> {
    // Try ocean quests first if near water
    if (this.isNearWater(context)) {
      const oceanQuest = await this.generateOceanQuest(context);
      if (oceanQuest) return oceanQuest;
    }

    // Try economic quests if structures available
    if (context.nearbyStructures && context.nearbyStructures.length > 0) {
      const economicQuest = await this.generateEconomicQuest(context);
      if (economicQuest) return economicQuest;
    }

    // Try variety service quest
    const varietyQuest = await this.generateVarietyQuest(context);
    if (varietyQuest) return varietyQuest;

    // Fall back to core template-based generation
    return await this.generateQuest(context);
  }
}

// Export singleton instance
export const unifiedQuestPipeline = new UnifiedQuestPipeline();

// Also export class for testing
export default UnifiedQuestPipeline;