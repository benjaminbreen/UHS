/**
 * Quest Service
 * Manages quests tied to actual game world locations and mechanics
 */

import { Quest, QuestObjective, QuestChain, QuestMarker, LocationInteraction, QuestReward } from '../types/questTypes';
import { MapTile, TerrainStructure, MapData } from '../types';
import { eventService } from './eventService';
import { lootService } from './lootService';
import { questChainService } from './questChainService';
import { ProceduralQuestGenerator, QuestTemplate } from '../constants/questTemplates/historicalQuestTemplates';
import { spatialDescriptionService } from './spatialDescriptionService';
import { historicalContextEngine } from './historicalContextEngine';
import { HistoricalEra } from '../types/ambiance';
import { CulturalZone } from '../types/characterData';
import { GameModeType } from '../types/eventTypes';
import { LogService } from './logService';
import { 
  getStructureLocation, 
  getStructureType, 
  isStructureType, 
  calculateDistance,
  findStructuresInRadius,
  findNearestStructure,
  validateStructure 
} from './structureUtils';
import { questTemplateService } from './questTemplateService';
import { 
  getApplicableQuestTemplates, 
  generateQuestFromTemplate,
  EconomicQuestTemplate,
  CRISIS_QUEST_TEMPLATES
} from '../constants/questTemplates/economicQuestTemplates';
import { crisisDetectionService } from './crisisDetectionService';
import { MarketConditions } from './tradeService';
import { 
  generateVariedQuest, 
  getAvailableCategories, 
  filterDuplicateCategories 
} from './questVarietyService';
import { 
  analyzeMapContext, 
  isQuestAppropriateForContext,
  getAppropriateQuestThemes 
} from './mapContextService';
import { getOceanQuests } from './oceanQuestTemplates';
import { questRealityBinding } from './questRealityBinding';
import { worldEntityRegistry } from './worldEntityRegistry';
import { unifiedQuestPipeline, QuestGenerationContext } from './unifiedQuestPipeline';
import { debouncedStorage } from './debouncedStorageService';

export class QuestService {
  private activeQuests: Quest[] = [];
  private completedQuests: Quest[] = [];
  private questChains: QuestChain[] = [];
  private questMarkers: QuestMarker[] = [];
  private locationInteractions: Map<string, LocationInteraction> = new Map();
  private currentZone: string = '';
  private currentEra: string = '';
  private currentGameMode: string = '';
  private playerLocation: { x: number; y: number } = { x: 0, y: 0 };

  constructor() {
    // Initialize empty collections first
    this.locationInteractions.clear();
    
    // Load saved quests from localStorage
    this.loadQuests();
    
    // Clear old placeholder quests after loading
    this.clearPlaceholderQuests();
    
    // Remove old localStorage keys (we use uhs_quest_data now)
    localStorage.removeItem('activeQuests');
    localStorage.removeItem('completedQuests');
    localStorage.removeItem('questChains');
    localStorage.removeItem('questService_initialized');
    
    console.log('[QuestService] Constructor: Loaded', this.activeQuests.length, 'active quests');
  }

  /**
   * Generate economic quests based on market conditions and crises
   */
  generateEconomicQuests(
    marketConditions: MarketConditions,
    marketInventory: any[],
    merchantNpcs: NpcEntity[],
    mapData: MapData,
    marketLocation: { x: number; y: number }
  ): Quest[] {
    const generatedQuests: Quest[] = [];
    
    // Check for active crises
    const activeCrises = crisisDetectionService.getActiveCrisesForMarket(marketLocation);
    
    // Identify scarcity items (quantity < 5, excluding currency)
    const scarcityItems = marketInventory
      .filter(item => item.quantity < 5 && item.category !== 'Currency')
      .map(item => ({ itemId: item.itemId, quantity: item.quantity, name: item.name, price: item.currentPrice }));
    
    // Identify surplus items (quantity > 50, excluding currency)
    const surplusItems = marketInventory
      .filter(item => item.quantity > 50 && item.category !== 'Currency')
      .map(item => ({ itemId: item.itemId, quantity: item.quantity, name: item.name, price: item.currentPrice }));
    
    // Get applicable quest templates
    const templates: EconomicQuestTemplate[] = [];
    
    // Add crisis-specific quests
    activeCrises.forEach(crisis => {
      const crisisTemplates = getApplicableQuestTemplates(
        crisis.pattern,
        scarcityItems,
        surplusItems
      );
      templates.push(...crisisTemplates);
    });
    
    // Add scarcity/surplus quests if no crisis
    if (activeCrises.length === 0) {
      const economicTemplates = getApplicableQuestTemplates(
        undefined,
        scarcityItems,
        surplusItems
      );
      templates.push(...economicTemplates.slice(0, 2)); // Limit to 2 non-crisis quests
    }
    
    // Generate quests from templates
    const maxQuests = activeCrises.length > 0 ? 3 : 2;
    const selectedTemplates = templates.slice(0, maxQuests);
    
    selectedTemplates.forEach((template, index) => {
      // Pick a merchant to give the quest (distribute evenly if possible)
      const merchantIndex = index % merchantNpcs.length;
      const merchant = merchantNpcs[merchantIndex];
      if (!merchant) return;
      
      // Get item for quest if needed
      let questItem = scarcityItems[0] || surplusItems[0];
      if (template.type === 'scarcity' && scarcityItems.length > 0) {
        questItem = scarcityItems[Math.floor(Math.random() * scarcityItems.length)];
      } else if (template.type === 'surplus' && surplusItems.length > 0) {
        questItem = surplusItems[Math.floor(Math.random() * surplusItems.length)];
      }
      
      const questData = generateQuestFromTemplate(
        template,
        merchant.name,
        questItem?.name,
        marketLocation,
        questItem?.price
      );
      
      const quest: Quest & { merchantId?: string; merchantName?: string } = {
        ...questData as Quest,
        id: questData.id || `quest_economic_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: Date.now(),
        status: 'available',
        isEconomicQuest: true,
        merchantId: merchant.id,  // Store merchant ID for reliable matching
        merchantName: merchant.name,  // Store merchant name for display
        economicContext: {
          crisis: activeCrises[0]?.pattern.id,
          itemScarcity: scarcityItems.map(i => i.itemId),
          itemSurplus: surplusItems.map(i => i.itemId),
          targetItem: questItem?.itemId  // Store the specific item this quest is about
        },
        timeLimit: activeCrises.length > 0 ? 300000 : undefined  // 5 minute timer for crisis quests
      };
      
      generatedQuests.push(quest);
      // console.log(`[QuestService] Generated economic quest: ${quest.title}`);
    });
    
    return generatedQuests;
  }
  
  /**
   * Check if economic quests should be generated for a market
   */
  shouldGenerateEconomicQuests(marketLocation: { x: number; y: number }): boolean {
    // Check if we already have active economic quests for this location
    const hasActiveEconomicQuests = this.activeQuests.some(quest => {
      const isEconomic = (quest as any).isEconomicQuest;
      if (!isEconomic) return false;
      
      // Check if quest is for this market location
      // First check giverLocation which is more reliable for marketplace quests
      if (quest.giverLocation) {
        const distance = Math.sqrt(
          Math.pow(quest.giverLocation.x - marketLocation.x, 2) +
          Math.pow(quest.giverLocation.y - marketLocation.y, 2)
        );
        if (distance <= 5) return true; // Within 5 tiles is considered same market
      }
      
      // Also check objectives for targetLocation
      const questLocation = quest.objectives?.[0]?.targetLocation;
      if (questLocation) {
        const distance = Math.sqrt(
          Math.pow(questLocation.x - marketLocation.x, 2) +
          Math.pow(questLocation.y - marketLocation.y, 2)
        );
        return distance <= 5; // Within 5 tiles is considered same market
      }
      return false;
    });
    
    if (hasActiveEconomicQuests) {
      // console.log(`[QuestService] Already have active economic quests for this market`);
      return false;
    }
    
    // Check if there are active crises
    const activeCrises = crisisDetectionService.getActiveCrisesForMarket(marketLocation);
    if (activeCrises.length > 0) {
      // console.log(`[QuestService] Crisis active, should generate economic quests`);
      return true;
    }
    
    // Check if enough time has passed since last generation (prevent spam)
    const lastGenKey = `lastEconomicQuestGen_${marketLocation.x}_${marketLocation.y}`;
    const lastGen = localStorage.getItem(lastGenKey);
    if (lastGen) {
      const timeSinceGen = Date.now() - parseInt(lastGen);
      if (timeSinceGen < 3600000) { // 1 hour cooldown
        return false;
      }
    }
    
    // Random chance for non-crisis economic quests
    return Math.random() < 0.3; // 30% chance
  }
  
  /**
   * Mark that economic quests were generated for this market
   */
  markEconomicQuestsGenerated(marketLocation: { x: number; y: number }): void {
    const lastGenKey = `lastEconomicQuestGen_${marketLocation.x}_${marketLocation.y}`;
    localStorage.setItem(lastGenKey, Date.now().toString());
  }

  /**
   * Check if a quest is a placeholder/test quest
   */
  private isPlaceholderQuest(quest: any): boolean {
    if (!quest) return true;
    
    const title = (quest.title || '').toLowerCase();
    const description = (quest.description || '').toLowerCase();
    
    // List of placeholder indicators
    const placeholderIndicators = [
      'first sign',
      'placeholder',
      'test quest',
      'example quest',
      'sample quest',
      'debug quest',
      'dummy quest',
      'temp quest',
      'todo',
      'unfinished'
    ];
    
    // Check if any placeholder indicator is in title or description
    const hasPlaceholderText = placeholderIndicators.some(indicator => 
      title.includes(indicator) || description.includes(indicator)
    );
    
    // Check for other signs of placeholder quests
    const hasNoObjectives = !quest.objectives || quest.objectives.length === 0;
    const hasInvalidId = !quest.id || quest.id === 'test' || quest.id.includes('placeholder');
    const hasNoRewards = !quest.rewards || quest.rewards.length === 0;
    
    return hasPlaceholderText || hasNoObjectives || hasInvalidId || (hasNoRewards && !quest.isProceduralQuest);
  }
  
  /**
   * Check if a quest is valid and complete
   */
  private isValidQuest(quest: any): boolean {
    if (!quest) return false;
    if (!quest.id || typeof quest.id !== 'string') return false;
    if (!quest.title || typeof quest.title !== 'string') return false;
    if (!quest.description || typeof quest.description !== 'string') return false;
    if (!quest.objectives || !Array.isArray(quest.objectives)) return false;
    if (quest.objectives.length === 0) return false;
    if (!quest.category) return false;
    if (!quest.status) return false;
    
    // Check that objectives have required fields
    const hasValidObjectives = quest.objectives.every((obj: any) => 
      obj && obj.id && obj.description && obj.type
    );
    
    return hasValidObjectives;
  }
  
  /**
   * Clear placeholder/fake quests - now simplified since quests don't persist
   */
  private clearPlaceholderQuests(): void {
    // Since quests no longer persist, just ensure localStorage is clean
    localStorage.removeItem('activeQuests');
    localStorage.removeItem('completedQuests'); 
    localStorage.removeItem('questChains');
  }

  /**
   * Completely reset the quest service - used for fresh game starts
   */
  public resetQuestService(): void {
    // console.log('[QuestService] Full reset requested');
    this.activeQuests = [];
    this.completedQuests = [];
    this.questChains = [];
    this.questMarkers = [];
    this.locationInteractions.clear();
    
    // Clear all localStorage quest data
    localStorage.removeItem('activeQuests');
    localStorage.removeItem('completedQuests');
    localStorage.removeItem('questChains');
    localStorage.removeItem('questService_initialized');
    
    // console.log('[QuestService] Full reset completed - all quest data cleared');
  }

  /**
   * Generate a quest using historical templates and spatial awareness
   */
  generateHistoricalQuest(
    era: HistoricalEra,
    culturalZone: CulturalZone,
    gameMode: GameModeType,
    mapData: MapData,
    npcs: any[],
    playerLocation: { x: number; y: number },
    questGiver?: any
  ): Quest | null {
    // Get available structures
    const availableStructures = (mapData.terrainStructures || []).map(s => s.type as any);
    
    // Generate quest from template
    const template = ProceduralQuestGenerator.generateQuest(
      era,
      culturalZone,
      gameMode,
      availableStructures,
      npcs,
      playerLocation
    );
    
    if (!template) {
      console.warn('[QuestService] No applicable quest template found');
      return null;
    }
    
    // Find target structures for quest
    const targetStructures = this.findTargetStructures(template, mapData, playerLocation);
    if (targetStructures.length === 0) {
      console.warn('[QuestService] No suitable structures found for quest');
      return null;
    }
    
    // Generate objectives with spatial descriptions
    const objectives = this.generateObjectivesFromTemplate(
      template,
      targetStructures,
      mapData,
      culturalZone,
      playerLocation,
      questGiver
    );
    
    // Generate culturally appropriate rewards
    const rewards = this.generateCulturalRewards(template, era, culturalZone);
    
    // Create quest title and description from template
    const title = this.fillTemplate(
      template.titleTemplates[Math.floor(Math.random() * template.titleTemplates.length)],
      template,
      questGiver
    );
    
    const description = this.fillTemplate(
      template.descriptionTemplates[Math.floor(Math.random() * template.descriptionTemplates.length)],
      template,
      questGiver
    );
    
    const quest: Quest = {
      id: `quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      category: template.category as any,
      objectives,
      currentObjectiveIndex: 0,
      rewards,
      giver: questGiver?.name || 'Unknown',
      giverLocation: questGiver ? { x: questGiver.x, y: questGiver.y } : playerLocation,
      startLocation: playerLocation,
      startTime: Date.now(),
      status: 'active',
      historicalContext: `${era} - ${culturalZone}`,
      isLLMGenerated: false,
      templateId: template.id,
      acceptedTime: Date.now()
    };
    
    // Add quest markers
    this.updateQuestMarkers(quest);
    
    // Save quest
    this.addQuest(quest);
    
    return quest;
  }
  
  /**
   * Find suitable structures for quest objectives
   */
  private findTargetStructures(
    template: QuestTemplate,
    mapData: MapData,
    playerLocation: { x: number; y: number }
  ): TerrainStructure[] {
    const structures: TerrainStructure[] = [];
    const allStructures = mapData.terrainStructures || [];
    
    // Find required structures within distance range
    for (const requiredType of template.requiredStructures) {
      const matching = allStructures
        .filter(s => s.type === requiredType && s.x && s.y)
        .map(s => ({
          ...s,
          distance: Math.sqrt(Math.pow(s.x! - playerLocation.x, 2) + Math.pow(s.y! - playerLocation.y, 2))
        }))
        .filter(s => 
          s.distance >= template.variation.distanceRange[0] &&
          s.distance <= template.variation.distanceRange[1]
        )
        .sort((a, b) => a.distance - b.distance);
      
      if (matching.length > 0) {
        structures.push(matching[0]);
      }
    }
    
    return structures;
  }
  
  /**
   * Generate objectives from template with spatial descriptions
   */
  private generateObjectivesFromTemplate(
    template: QuestTemplate,
    targetStructures: TerrainStructure[],
    mapData: MapData,
    culturalZone: CulturalZone,
    playerLocation: { x: number; y: number },
    questGiver?: any
  ): QuestObjective[] {
    const objectives: QuestObjective[] = [];
    
    // For each item chain, create objectives
    for (let i = 0; i < template.itemChains.length; i++) {
      const chain = template.itemChains[i];
      const targetStructure = targetStructures[i];
      
      if (!targetStructure || !targetStructure.x || !targetStructure.y) continue;
      
      // Generate spatial description for this location
      const spatialDesc = spatialDescriptionService.describeLocationRelativeToPlayer(
        targetStructure.x,
        targetStructure.y,
        playerLocation.x,
        playerLocation.y,
        mapData,
        culturalZone,
        targetStructure
      );
      
      // Create deliver/transform objective
      objectives.push({
        id: `obj_${i}_deliver`,
        type: 'deliver_item',
        description: `Take ${chain.fromItem} to ${spatialDesc}`,
        targetLocation: { x: targetStructure.x, y: targetStructure.y },
        targetStructure: targetStructure.id,
        targetItem: chain.fromItem,
        completed: false,
        spatialDescription: spatialDesc
      });
      
      // If there's a transformation, add return objective
      if (chain.toItem !== chain.fromItem) {
        const returnDesc = questGiver ? 
          spatialDescriptionService.describeLocationRelativeToPlayer(
            questGiver.x,
            questGiver.y,
            targetStructure.x,
            targetStructure.y,
            mapData,
            culturalZone
          ) : 'the quest giver';
        
        objectives.push({
          id: `obj_${i}_return`,
          type: 'deliver_item',
          description: `Return ${chain.toItem} to ${questGiver?.name || 'the quest giver'}`,
          targetLocation: questGiver ? { x: questGiver.x, y: questGiver.y } : playerLocation,
          targetNPC: questGiver?.name,
          targetItem: chain.toItem,
          completed: false,
          spatialDescription: returnDesc
        });
      }
    }
    
    return objectives;
  }
  
  /**
   * Generate culturally appropriate rewards
   */
  private generateCulturalRewards(
    template: QuestTemplate,
    era: HistoricalEra,
    culturalZone: CulturalZone
  ): QuestReward[] {
    const rewards: QuestReward[] = [];
    
    // Base reward amount with variation
    const multiplier = template.variation.rewardMultiplier[0] + 
      Math.random() * (template.variation.rewardMultiplier[1] - template.variation.rewardMultiplier[0]);
    
    // Currency reward
    const currencyNames: Record<CulturalZone, string> = {
      EUROPEAN: 'coins',
      MENA: 'dinars',
      EAST_ASIAN: 'taels',
      SOUTH_ASIAN: 'rupees',
      NORTH_AMERICAN_PRE_COLUMBIAN: 'trade goods',
      NORTH_AMERICAN_COLONIAL: 'shillings',
      SOUTH_AMERICAN: 'pesos',
      SUB_SAHARAN_AFRICAN: 'cowries',
      OCEANIC: 'shells'
    };
    
    rewards.push({
      type: 'currency',
      amount: Math.floor(50 * multiplier),
      description: `${Math.floor(50 * multiplier)} ${currencyNames[culturalZone] || 'coins'}`
    });
    
    // Reputation reward
    if (template.category === 'religious' || template.category === 'political') {
      rewards.push({
        type: 'reputation',
        amount: Math.floor(10 * multiplier),
        description: `+${Math.floor(10 * multiplier)} reputation`
      });
    }
    
    // Experience reward
    rewards.push({
      type: 'experience',
      amount: Math.floor(100 * multiplier),
      description: `${Math.floor(100 * multiplier)} XP`
    });
    
    return rewards;
  }
  
  /**
   * Fill template strings with appropriate values
   */
  private fillTemplate(
    template: string,
    questTemplate: QuestTemplate,
    questGiver?: any
  ): string {
    let filled = template;
    
    // Replace placeholders
    filled = filled.replace('{giver}', questGiver?.name || 'Someone');
    filled = filled.replace('{owner}', questGiver?.name?.split(' ')[0] || 'Someone');
    filled = filled.replace('{season}', ['spring', 'summer', 'fall', 'winter'][Math.floor(Math.random() * 4)]);
    filled = filled.replace('{destination}', 'the destination');
    
    // Replace item types from template
    if (questTemplate.itemChains.length > 0) {
      const chain = questTemplate.itemChains[0];
      filled = filled.replace('{grain_type}', chain.fromItem);
      filled = filled.replace('{flour_type}', chain.toItem);
      filled = filled.replace('{item}', chain.fromItem);
    }
    
    // Replace structure descriptions
    filled = filled.replace('{structure_description}', 'the location');
    
    return filled;
  }

  /**
   * Create a quest from an LLM-generated event that ties to actual map locations
   */
  createQuestFromEvent(
    eventData: any,
    mapStructures: TerrainStructure[],
    currentLocation: { x: number; y: number },
    mapData?: any
  ): Quest | null {
    // Find ALL relevant structures on the map, including commonly available ones
    const marketplaces = mapStructures.filter(s => s.type === 'marketplace');
    const cities = mapStructures.filter(s => s.type === 'urban');
    const palaces = mapStructures.filter(s => s.type === 'palace');
    const holySites = mapStructures.filter(s => s.type === 'holy_site');
    const ruins = mapStructures.filter(s => s.type === 'ruins');
    const farms = mapStructures.filter(s => s.type === 'farm');
    
    // Add more common structure types that are likely to exist
    const hamlets = mapStructures.filter(s => s.type === 'hamlet' || s.name?.includes('Hamlet'));
    const bridges = mapStructures.filter(s => s.type === 'bridge');
    const mills = mapStructures.filter(s => s.type === 'mill' || s.name?.includes('Mill'));
    const fortresses = mapStructures.filter(s => s.type === 'fortress' || s.name?.includes('Base'));
    const wells = mapStructures.filter(s => s.type === 'well');
    const watchtowers = mapStructures.filter(s => s.type === 'watchtower');

    // Pick appropriate locations for the quest
    const questLocations = this.selectQuestLocations(
      eventData,
      { marketplaces, cities, palaces, holySites, ruins, farms, hamlets, bridges, mills, fortresses, wells, watchtowers },
      currentLocation,
      mapData
    );

    if (questLocations.length === 0) {
      console.warn('[QuestService] No suitable locations found for quest');
      return null;
    }

    // Create objectives based on event choices and available locations
    const objectives: QuestObjective[] = this.generateObjectives(
      eventData,
      questLocations,
      currentLocation
    );

    if (objectives.length === 0) {
      console.warn('[QuestService] Could not generate objectives');
      return null;
    }

    // Create the quest
    const quest: Quest = {
      id: `quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: eventData.title || 'New Quest',
      description: eventData.description || 'Complete the objectives',
      category: this.determineCategory(eventData),
      objectives,
      currentObjectiveIndex: 0,
      rewards: this.generateRewards(eventData),
      startLocation: currentLocation,
      startTime: Date.now(),
      status: 'active',
      historicalContext: eventData.historicalBasis,
      isLLMGenerated: true
    };

    // Add quest markers to map
    this.updateQuestMarkers(quest);

    // Save the quest
    this.addQuest(quest);

    return quest;
  }

  /**
   * Select appropriate locations for quest objectives
   */
  private selectQuestLocations(
    eventData: any,
    structures: {
      marketplaces: TerrainStructure[];
      cities: TerrainStructure[];
      palaces: TerrainStructure[];
      holySites: TerrainStructure[];
      ruins: TerrainStructure[];
      farms: TerrainStructure[];
      hamlets?: TerrainStructure[];
      bridges?: TerrainStructure[];
      mills?: TerrainStructure[];
      fortresses?: TerrainStructure[];
      wells?: TerrainStructure[];
      watchtowers?: TerrainStructure[];
    },
    currentLocation: { x: number; y: number },
    mapData?: any
  ): Array<{ structure: TerrainStructure | any; distance: number }> {
    const locations: Array<{ structure: TerrainStructure | any; distance: number }> = [];

    // Analyze event text to determine which location types are relevant
    const eventText = (eventData.description + ' ' + eventData.title).toLowerCase();
    
    const addLocationsOfType = (structureList: TerrainStructure[] | undefined, priority: number) => {
      if (!structureList) return;
      structureList.forEach(s => {
        if (s.x !== undefined && s.y !== undefined) {
          const distance = Math.sqrt(
            Math.pow(s.x - currentLocation.x, 2) + 
            Math.pow(s.y - currentLocation.y, 2)
          );
          locations.push({ structure: s, distance });
        }
      });
    };

    // Prioritize location types based on event content
    if (eventText.includes('trade') || eventText.includes('merchant') || eventText.includes('goods')) {
      addLocationsOfType(structures.marketplaces, 1);
    }
    if (eventText.includes('city') || eventText.includes('urban') || eventText.includes('settlement')) {
      addLocationsOfType(structures.cities, 1);
      addLocationsOfType(structures.hamlets, 2);
    }
    if (eventText.includes('noble') || eventText.includes('ruler') || eventText.includes('palace')) {
      addLocationsOfType(structures.palaces, 1);
      addLocationsOfType(structures.fortresses, 2);
    }
    if (eventText.includes('holy') || eventText.includes('religious') || eventText.includes('temple')) {
      addLocationsOfType(structures.holySites, 1);
    }
    if (eventText.includes('ancient') || eventText.includes('ruins') || eventText.includes('abandoned')) {
      addLocationsOfType(structures.ruins, 1);
    }
    if (eventText.includes('farm') || eventText.includes('harvest') || eventText.includes('grain')) {
      addLocationsOfType(structures.farms, 1);
      addLocationsOfType(structures.mills, 2);
    }
    if (eventText.includes('bridge') || eventText.includes('river') || eventText.includes('crossing')) {
      addLocationsOfType(structures.bridges, 1);
    }
    if (eventText.includes('defense') || eventText.includes('military') || eventText.includes('guard')) {
      addLocationsOfType(structures.fortresses, 1);
      addLocationsOfType(structures.watchtowers, 2);
    }

    // If no specific matches, add all available structures
    if (locations.length === 0) {
      Object.values(structures).forEach(structureList => {
        if (Array.isArray(structureList)) {
          addLocationsOfType(structureList, 3);
        }
      });
    }

    // If STILL no locations, create fallback wilderness locations
    if (locations.length === 0 && mapData) {
      // console.log('[QuestService] No structures found, generating wilderness locations');
      
      // Generate 3 wilderness points at different distances and directions
      const distances = [5, 10, 15];
      const angles = [0, Math.PI * 2/3, Math.PI * 4/3]; // 120 degrees apart
      
      distances.forEach((dist, i) => {
        const angle = angles[i];
        const wildernessPoint = {
          x: Math.round(currentLocation.x + Math.cos(angle) * dist),
          y: Math.round(currentLocation.y + Math.sin(angle) * dist),
          type: 'wilderness',
          name: `Wilderness location ${i + 1}`,
          id: `wilderness_${Date.now()}_${i}`
        };
        
        // Clamp to map bounds
        wildernessPoint.x = Math.max(0, Math.min(mapData.width - 1, wildernessPoint.x));
        wildernessPoint.y = Math.max(0, Math.min(mapData.height - 1, wildernessPoint.y));
        
        locations.push({ 
          structure: wildernessPoint, 
          distance: dist 
        });
      });
    }

    // Sort by distance and return closest ones
    locations.sort((a, b) => a.distance - b.distance);
    return locations.slice(0, 3); // Return up to 3 closest locations
  }

  /**
   * Generate quest objectives based on event and locations
   */
  private generateObjectives(
    eventData: any,
    locations: Array<{ structure: TerrainStructure; distance: number }>,
    currentLocation: { x: number; y: number }
  ): QuestObjective[] {
    const objectives: QuestObjective[] = [];

    // Create objectives based on event choices
    if (eventData.choices && eventData.choices.length > 0) {
      const choice = eventData.choices[0]; // Use first choice as basis
      
      // First objective: Go to the nearest relevant location
      if (locations[0]) {
        const loc = locations[0].structure;
        objectives.push({
          id: `obj_${Date.now()}_1`,
          type: 'visit_location',
          description: `Travel to the ${loc.type} at coordinates (${loc.x}, ${loc.y})`,
          targetLocation: {
            x: loc.x!,
            y: loc.y!,
            locationType: this.mapStructureTypeToLocation(loc.type)
          },
          completed: false
        });

        // Second objective: Interact at the location
        objectives.push({
          id: `obj_${Date.now()}_2`,
          type: 'talk_to_npc',
          description: `Speak with someone at the ${loc.type}`,
          targetLocation: {
            x: loc.x!,
            y: loc.y!,
            locationType: this.mapStructureTypeToLocation(loc.type)
          },
          targetNPC: 'quest_npc',
          completed: false
        });
      }

      // Third objective: Complete the quest at another location
      if (locations[1]) {
        const loc = locations[1].structure;
        objectives.push({
          id: `obj_${Date.now()}_3`,
          type: 'deliver_item',
          description: `Deliver the message to the ${loc.type}`,
          targetLocation: {
            x: loc.x!,
            y: loc.y!,
            locationType: this.mapStructureTypeToLocation(loc.type)
          },
          targetItem: 'quest_item',
          completed: false
        });
      }
    }

    return objectives;
  }

  /**
   * Map structure types to location types
   */
  private mapStructureTypeToLocation(structureType: string): 'marketplace' | 'city_center' | 'palace' | 'holy_site' | 'ruins' | 'farm' | 'hamlet' | 'wilderness' {
    switch (structureType) {
      case 'marketplace': return 'marketplace';
      case 'urban': return 'city_center';
      case 'palace': return 'palace';
      case 'holy_site': return 'holy_site';
      case 'ruins': return 'ruins';
      case 'farm': return 'farm';
      case 'hamlet': return 'hamlet';
      case 'bridge':
      case 'mill':
      case 'fortress':
      case 'well':
      case 'watchtower':
        return 'hamlet'; // Use hamlet as a generic settlement type
      case 'wilderness':
        return 'wilderness';
      default: return 'city_center';
    }
  }

  /**
   * Determine quest category from event data
   */
  private determineCategory(eventData: any): 'main' | 'trade' | 'exploration' | 'social' | 'survival' {
    const text = (eventData.description + ' ' + eventData.title).toLowerCase();
    
    if (text.includes('trade') || text.includes('merchant') || text.includes('goods')) {
      return 'trade';
    }
    if (text.includes('explore') || text.includes('discover') || text.includes('journey')) {
      return 'exploration';
    }
    if (text.includes('social') || text.includes('reputation') || text.includes('community')) {
      return 'social';
    }
    if (text.includes('survive') || text.includes('health') || text.includes('danger')) {
      return 'survival';
    }
    
    return 'main';
  }

  /**
   * Generate rewards from event effects
   */
  private generateRewards(eventData: any): QuestReward[] {
    const rewards: QuestReward[] = [];

    if (eventData.choices && eventData.choices[0] && eventData.choices[0].effects) {
      const effects = eventData.choices[0].effects.split(',');
      effects.forEach((effect: string) => {
        const [type, value] = effect.split(':');
        if (type && value) {
          rewards.push({
            type: type as any,
            value: parseInt(value) || value,
            description: `${type}: ${value}`
          });
        }
      });
    }

    // Add default reward if none specified
    if (rewards.length === 0) {
      rewards.push({
        type: 'reputation',
        value: 10,
        description: 'Reputation +10'
      });
    }

    return rewards;
  }

  /**
   * Update quest markers on the map
   */
  private updateQuestMarkers(quest: Quest): void {
    // Clear old markers for this quest
    this.questMarkers = this.questMarkers.filter(m => m.questId !== quest.id);

    // Add markers for current objective
    const currentObj = quest.objectives[quest.currentObjectiveIndex];
    if (currentObj && currentObj.targetLocation) {
      this.questMarkers.push({
        x: currentObj.targetLocation.x,
        y: currentObj.targetLocation.y,
        questId: quest.id,
        objectiveId: currentObj.id,
        type: 'primary',
        label: currentObj.description
      });
    }

    // Add markers for future objectives (as secondary)
    quest.objectives.slice(quest.currentObjectiveIndex + 1).forEach(obj => {
      if (obj.targetLocation) {
        this.questMarkers.push({
          x: obj.targetLocation.x,
          y: obj.targetLocation.y,
          questId: quest.id,
          objectiveId: obj.id,
          type: 'secondary',
          label: obj.description
        });
      }
    });
  }

  /**
   * Update game context for quest generation
   */
  updateContext(zone: string, era: string, playerLocation: { x: number; y: number }): void {
    this.currentZone = zone;
    this.currentEra = era;
    this.playerLocation = playerLocation;
    
    // Update world entity registry with player location
    worldEntityRegistry.updatePlayerLocation(playerLocation);
    
    // Update unified pipeline category weights based on context
    // This could be expanded to be more sophisticated
    unifiedQuestPipeline.updateCategoryWeights(this.currentGameMode || 'exploration');
  }

  /**
   * Set the current game mode for quest generation
   */
  public setGameMode(gameMode: string): void {
    this.currentGameMode = gameMode;
    unifiedQuestPipeline.updateCategoryWeights(gameMode);
  }

  /**
   * Generate quest using the unified pipeline (NEW)
   */
  public async generateUnifiedQuest(
    mapData: MapData,
    triggerType: 'event' | 'exploration' | 'npc' | 'crisis' | 'manual' = 'manual',
    triggerEntity?: string,
    customPrompt?: string,
    playerStats?: {
      health: number;
      reputation: number;
      wealth: number;
      intelligence: number;
      strength: number;
    }
  ): Promise<Quest | null> {
    if (!this.currentZone || !this.currentEra || !this.playerLocation) {
      console.warn('[QuestService] Cannot generate quest - context not set');
      return null;
    }

    const context: QuestGenerationContext = {
      mapData,
      playerLocation: this.playerLocation,
      playerStats,
      zone: this.currentZone,
      era: this.currentEra,
      year: new Date().getFullYear(), // This should come from game state
      season: 'spring', // This should come from game state
      gameMode: this.currentGameMode,
      triggerType,
      triggerEntity,
      customPrompt
    };

    try {
      const quest = await unifiedQuestPipeline.generateQuest(context);
      
      if (quest) {
        // Quest is already bound to reality and validated by the pipeline
        this.addQuest(quest, true); // Skip binding since already done
        console.log('[QuestService] Generated unified quest:', quest.title);
      }
      
      return quest;
    } catch (error) {
      console.error('[QuestService] Unified quest generation failed:', error);
      return null;
    }
  }

  /**
   * Generate multiple quests with variety (NEW)
   */
  public async generateVariedQuests(
    mapData: MapData,
    count: number,
    playerStats?: {
      health: number;
      reputation: number;
      wealth: number;
      intelligence: number;
      strength: number;
    }
  ): Promise<Quest[]> {
    if (!this.currentZone || !this.currentEra || !this.playerLocation) {
      console.warn('[QuestService] Cannot generate quests - context not set');
      return [];
    }

    const context: QuestGenerationContext = {
      mapData,
      playerLocation: this.playerLocation,
      playerStats,
      zone: this.currentZone,
      era: this.currentEra,
      year: new Date().getFullYear(), // This should come from game state
      season: 'spring', // This should come from game state
      gameMode: this.currentGameMode,
      triggerType: 'manual'
    };

    try {
      const quests = await unifiedQuestPipeline.generateMultipleQuests(context, count);
      
      // Add all generated quests
      for (const quest of quests) {
        this.addQuest(quest, true); // Skip binding since already done
      }
      
      console.log(`[QuestService] Generated ${quests.length} varied quests`);
      return quests;
    } catch (error) {
      console.error('[QuestService] Varied quest generation failed:', error);
      return [];
    }
  }

  /**
   * Add a new quest
   */
  addQuest(quest: Quest, skipBinding: boolean = false): void {
    // Validate quest before adding
    if (!this.isValidQuest(quest)) {
      console.warn('[QuestService] Attempted to add invalid quest:', quest.title);
      return;
    }
    
    // Check if it's a placeholder quest
    if (this.isPlaceholderQuest(quest)) {
      console.warn('[QuestService] Blocked placeholder quest:', quest.title);
      return;
    }
    
    // Bind quest to real world entities if we have context and not already bound
    if (!skipBinding && this.currentZone && this.currentEra && this.playerLocation) {
      // Check if quest is already bound (from unified pipeline)
      const boundQuest = quest as any;
      if (!boundQuest.boundEntities) {
        const realBoundQuest = questRealityBinding.bindQuestToReality(
          quest,
          this.playerLocation,
          this.currentZone,
          this.currentEra
        );
        
        // Replace quest with bound version
        Object.assign(quest, realBoundQuest);
        console.log('[QuestService] Quest bound to reality:', quest.title, 'with entities:', realBoundQuest.boundEntities);
      }
    }
    
    // Check for duplicate quests
    const isDuplicate = this.activeQuests.some(q => 
      q.id === quest.id || 
      (q.title === quest.title && q.description === quest.description)
    );
    
    if (isDuplicate) {
      console.warn('[QuestService] Blocked duplicate quest:', quest.title);
      return;
    }
    
    // Add quest markers for map display
    this.updateQuestMarkers(quest);
    
    // If this is the first quest or no quest is currently active, make it active
    const hasActiveQuest = this.activeQuests.some(q => q.isActiveQuest === true);
    if (!hasActiveQuest) {
      quest.isActiveQuest = true;
      // console.log('[QuestService] Set as active quest (first/no active):', quest.title);
    } else {
      quest.isActiveQuest = false;
    }
    
    this.activeQuests.push(quest);
    this.saveQuests();
    // console.log('[QuestService] Added quest:', quest.title);
    
    // Dispatch event for UI to listen for quest updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('questAdded', {
        detail: {
          quest,
          totalActiveQuests: this.activeQuests.length
        }
      }));
    }
  }

  /**
   * Check if player is at a quest location or has met distance requirements
   */
  checkQuestProgress(playerX: number, playerY: number, interactionType?: string, structureType?: string): void {
    const tolerance = 5; // Increased tolerance to 5 tiles for better mobile/click detection

    this.activeQuests.forEach(quest => {
      if (quest.status !== 'active') return;

      const currentObj = quest.objectives[quest.currentObjectiveIndex];
      if (!currentObj || currentObj.completed) return;

      // Check travel distance objectives
      if (currentObj.type === 'travel_distance') {
        const startLoc = quest.startLocation || { x: 50, y: 50 }; // Default to center if not set
        const distanceTraveled = Math.sqrt(
          Math.pow(playerX - startLoc.x, 2) +
          Math.pow(playerY - startLoc.y, 2)
        );
        
        const targetDistance = (currentObj as any).targetDistance || 10;
        
        if (distanceTraveled >= targetDistance) {
          // console.log(`[QuestService] 🎉 Travel objective complete! Traveled ${distanceTraveled.toFixed(1)} tiles (needed ${targetDistance})`);
          this.completeObjective(quest.id, currentObj.id);
          this.showQuestProgressToast(quest, currentObj, 'completed');
          return;
        } else {
          // Update progress display (optional)
          const progress = Math.min(100, (distanceTraveled / targetDistance) * 100);
          if (progress > 0 && progress % 20 === 0) { // Show progress at 20% intervals
            this.showQuestProgressToast(quest, currentObj, 'progress', `${Math.floor(distanceTraveled)}/${targetDistance} tiles`);
          }
        }
      }

      // Check if player is at the target location
      if (currentObj.targetLocation) {
        const distance = Math.sqrt(
          Math.pow(currentObj.targetLocation.x - playerX, 2) +
          Math.pow(currentObj.targetLocation.y - playerY, 2)
        );

        // console.log(`[QuestService] Checking objective "${currentObj.description}" - Distance: ${distance.toFixed(1)}, Tolerance: ${tolerance}`);

        if (distance <= tolerance) {
          let canComplete = false;

          // Visit location quests - just need to be nearby
          if (currentObj.type === 'visit_location') {
            canComplete = true;
            // console.log(`[QuestService] Visit location quest can complete at distance ${distance.toFixed(1)}`);
          }
          
          // NPC interaction quests - require explicit interaction trigger
          else if (currentObj.type === 'talk_to_npc' && interactionType === 'npc_interaction') {
            canComplete = true;
            // console.log(`[QuestService] NPC interaction quest triggered`);
          }
          
          // Item delivery quests - require explicit delivery trigger
          else if (currentObj.type === 'deliver_item' && interactionType === 'item_delivery') {
            canComplete = true;
            console.log(`[QuestService] Item delivery quest triggered`);
          }

          if (canComplete) {
            console.log(`[QuestService] Completing objective: ${currentObj.description} at (${playerX}, ${playerY})`);
            this.completeObjective(quest.id, currentObj.id);
            this.showQuestProgressToast(quest, currentObj, 'completed');
          }
        }
      }
    });
  }
  
  /**
   * Show toast notification for quest progress
   */
  private showQuestProgressToast(quest: Quest, objective: QuestObjective, type: 'completed' | 'progress', progressText?: string): void {
    // Dispatch custom event for toast notification
    if (typeof window !== 'undefined') {
      const message = type === 'completed' 
        ? `✅ Objective Complete: ${objective.description}`
        : `📍 Quest Progress: ${progressText || objective.description}`;
        
      window.dispatchEvent(new CustomEvent('questProgressNotification', {
        detail: {
          type,
          message,
          questTitle: quest.title,
          objective: objective.description
        }
      }));
    }
  }

  /**
   * Check for auto-completable objectives (collection, survival, etc.)
   */
  checkAutoCompletableObjectives(playerCharacter: any): void {
    if (!playerCharacter) return;
    
    this.activeQuests.forEach(quest => {
      if (quest.status !== 'active') return;
      const currentObj = quest.objectives[quest.currentObjectiveIndex];
      if (!currentObj || currentObj.completed) return;
      
      // Auto-complete collection objectives if player has the items
      if (currentObj.type === 'collect_items' && currentObj.itemsToCollect) {
        const hasAllItems = currentObj.itemsToCollect.every(item => {
          const playerItem = playerCharacter.inventory?.find((inv: any) => 
            inv.name?.toLowerCase() === item.name?.toLowerCase()
          );
          return playerItem && playerItem.quantity >= (item.quantity || 1);
        });
        
        if (hasAllItems) {
          console.log(`[QuestService] 🎉 AUTO-COMPLETING collection objective: "${currentObj.description}"`);
          this.completeObjective(quest.id, currentObj.id);
          this.showObjectiveCompleteNotification(currentObj, quest);
          window.dispatchEvent(new CustomEvent('questProgressUpdated'));
        }
      }
    });
  }
  
  /**
   * Show a notification when an objective is completed
   */
  private showObjectiveCompleteNotification(objective: any, quest: any): void {
    // Dispatch event for quest completion animation
    window.dispatchEvent(new CustomEvent('questObjectiveComplete', {
      detail: {
        objective,
        quest,
        message: `Objective Complete: ${objective.description}`
      }
    }));
  }
  
  /**
   * Get quest progress as percentage for UI display
   */
  getQuestProgress(quest: Quest): number {
    if (!quest.objectives || quest.objectives.length === 0) return 0;
    
    const completedCount = quest.objectives.filter(obj => obj.completed).length;
    return Math.round((completedCount / quest.objectives.length) * 100);
  }
  
  /**
   * Get detailed progress for current objective
   */
  getObjectiveProgress(objective: QuestObjective): string {
    if (!objective) return '';
    
    if (objective.type === 'collect_items' && objective.itemsToCollect) {
      // Return item collection progress
      const progress = objective.itemsToCollect.map(item => {
        const current = objective.currentProgress?.[item.name] || 0;
        return `${item.name}: ${current}/${item.quantity || 1}`;
      }).join(', ');
      return progress;
    }
    
    if (objective.type === 'visit_location' && objective.targetLocation) {
      return objective.completed ? 'Location reached!' : 'Travel to destination';
    }
    
    if (objective.type === 'talk_to_npc') {
      return objective.completed ? 'Conversation complete!' : 'Find and speak with NPC';
    }
    
    return objective.description;
  }

  /**
   * Complete a quest objective
   */
  completeObjective(questId: string, objectiveId: string): void {
    const quest = this.activeQuests.find(q => q.id === questId);
    if (!quest) {
      console.warn(`[QuestService] Cannot complete objective - quest ${questId} not found`);
      return;
    }

    const objective = quest.objectives.find(o => o.id === objectiveId);
    if (!objective) {
      console.warn(`[QuestService] Cannot complete objective - objective ${objectiveId} not found in quest ${questId}`);
      return;
    }

    if (objective.completed) {
      console.log(`[QuestService] Objective already completed: ${objective.description}`);
      return;
    }

    objective.completed = true;
    console.log(`[QuestService] ✅ Completed objective: "${objective.description}" for quest: "${quest.title}"`);

    // Check if all objectives are complete
    if (quest.objectives.every(o => o.completed)) {
      this.completeQuest(questId);
    } else {
      // Move to next objective
      quest.currentObjectiveIndex++;
      const nextObjective = quest.objectives[quest.currentObjectiveIndex];
      if (nextObjective) {
        console.log(`[QuestService] 🎯 Moving to next objective: "${nextObjective.description}"`);
      }
      this.updateQuestMarkers(quest);
    }

    this.saveQuests();
  }

  /**
   * Complete a quest with animation and sound!
   */
  private completeQuest(questId: string): void {
    const questIndex = this.activeQuests.findIndex(q => q.id === questId);
    if (questIndex === -1) return;

    const quest = this.activeQuests[questIndex];
    quest.status = 'completed';
    quest.completedTime = Date.now();
    
    // Play completion sound and animation
    this.playQuestCompleteEffects(quest);

    // Process rewards
    const rewardResult = this.processQuestRewards(quest);
    
    // Check if all optional objectives were completed for bonus rewards
    const allOptionalComplete = quest.objectives
      .filter(o => o.optional)
      .every(o => o.completed);
    
    if (allOptionalComplete && quest.bonusRewards) {
      const bonusResult = this.processQuestRewards({
        ...quest,
        rewards: quest.bonusRewards
      });
      console.log('[QuestService] Bonus rewards granted:', bonusResult);
    }

    // Move to completed quests
    this.completedQuests.push(quest);
    this.activeQuests.splice(questIndex, 1);

    // Clear markers
    this.questMarkers = this.questMarkers.filter(m => m.questId !== questId);

    // Check for follow-up quests
    if (quest.followUpQuests && quest.followUpQuests.length > 0) {
      console.log('[QuestService] Unlocking follow-up quests:', quest.followUpQuests);
      // TODO: Generate and add follow-up quests
    }
    
    // Progress quest chain if this quest is part of one
    if (quest.chainId) {
      questChainService.progressChain(quest.id);
    }

    console.log('[QuestService] Completed quest:', quest.title, 'Rewards:', rewardResult);
    this.saveQuests();
    
    // Add to game log
    const logService = LogService.getInstance();
    logService.addEntry({
      type: 'quest',
      content: `✅ Quest Completed: "${quest.title}"`,
      category: 'quest',
      icon: '🎯',
      timestamp: Date.now(),
      details: {
        rewards: rewardResult.appliedRewards.join(', '),
        questId: quest.id
      }
    });
    
    // Also add a showToast notification for immediate feedback
    const rewardSummary = rewardResult.appliedRewards.slice(0, 2).join(', ');
    const message = `✅ Quest Complete: ${quest.title}${rewardSummary ? ` - ${rewardSummary}` : ''}`;
    if (typeof window !== 'undefined' && (window as any).showToast) {
      (window as any).showToast(message);
    }
    
    // Dispatch event for UI to listen for quest completion
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('questCompleted', {
        detail: {
          quest,
          rewards: rewardResult,
          totalActiveQuests: this.activeQuests.length,
          totalCompletedQuests: this.completedQuests.length
        }
      }));
    }
  }

  /**
   * Process quest rewards and apply them to the player
   * This properly handles all reward types including health, reputation, etc.
   */
  private processQuestRewards(quest: Quest): {
    items: any[];
    otherRewards: any[];
    totalValue: number;
    appliedRewards: string[];
  } {
    // Get cultural zone and era from quest context
    const culturalZone = quest.culturalZone || 'EUROPEAN';
    const era = quest.era || 'MEDIEVAL';
    
    // Track what rewards were actually applied
    const appliedRewards: string[] = [];
    const otherRewards: any[] = [];
    
    // Process item rewards through loot service
    const itemRewards = quest.rewards.filter(r => r.type === 'item' || r.type === 'money');
    const rewardResult = lootService.processQuestRewards(
      itemRewards,
      culturalZone,
      era
    );
    
    // Process non-item rewards directly
    quest.rewards.forEach(reward => {
      // Check if reward should be given based on chance
      if (reward.guaranteed === false && reward.chance) {
        if (Math.random() > reward.chance) {
          return; // Skip this reward
        }
      }
      
      switch (reward.type) {
        case 'reputation':
          // Emit event for reputation change
          const repValue = reward.value as number;
          window.dispatchEvent(new CustomEvent('reputationChange', {
            detail: { 
              amount: repValue, 
              source: `Quest: ${quest.title}`,
              questId: quest.id 
            }
          }));
          appliedRewards.push(`Reputation +${repValue}`);
          otherRewards.push({ type: 'reputation', value: repValue, description: reward.description });
          break;
          
        case 'currency':
        case 'money':
          // Emit event for currency gain
          const moneyValue = (reward.value || reward.amount) as number;
          window.dispatchEvent(new CustomEvent('currencyChange', {
            detail: { 
              amount: moneyValue, 
              source: `Quest: ${quest.title}`,
              questId: quest.id,
              isEconomicQuest: (quest as any).isEconomicQuest
            }
          }));
          appliedRewards.push(`Received ${moneyValue} coins`);
          otherRewards.push({ type: 'currency', amount: moneyValue, description: reward.description });
          
          // Bonus rewards for crisis quests
          if ((quest as any).isEconomicQuest && (quest as any).economicContext?.crisis) {
            const bonus = Math.floor(moneyValue * 0.5); // 50% bonus for crisis quests
            window.dispatchEvent(new CustomEvent('currencyChange', {
              detail: { 
                amount: bonus, 
                source: `Crisis Bonus: ${quest.title}`,
                questId: quest.id 
              }
            }));
            appliedRewards.push(`Crisis bonus: +${bonus} coins`);
            otherRewards.push({ type: 'currency', amount: bonus, description: 'Crisis completion bonus' });
          }
          break;
          
        case 'health':
          // Emit event for health change
          const healthValue = reward.value as number;
          window.dispatchEvent(new CustomEvent('playerHealthChange', {
            detail: { 
              amount: healthValue, 
              source: `Quest: ${quest.title}`,
              questId: quest.id 
            }
          }));
          appliedRewards.push(`Health +${healthValue}`);
          otherRewards.push({ type: 'health', value: healthValue, description: reward.description });
          break;
          
        case 'level_up':
          // Emit event for level up
          const levelValue = reward.value as number;
          window.dispatchEvent(new CustomEvent('playerLevelUp', {
            detail: { 
              levels: levelValue, 
              source: `Quest: ${quest.title}`,
              questId: quest.id 
            }
          }));
          appliedRewards.push(`Level up! (+${levelValue} level${levelValue > 1 ? 's' : ''})`);
          otherRewards.push({ type: 'level_up', value: levelValue, description: reward.description });
          break;
          
        case 'experience':
          // Emit event for experience gain
          const expValue = reward.value as number;
          window.dispatchEvent(new CustomEvent('experienceGain', {
            detail: { 
              amount: expValue, 
              source: `Quest: ${quest.title}`,
              questId: quest.id 
            }
          }));
          appliedRewards.push(`Experience +${expValue}`);
          otherRewards.push({ type: 'experience', value: expValue, description: reward.description });
          break;
          
        case 'knowledge':
          // Emit event for knowledge gain
          window.dispatchEvent(new CustomEvent('knowledgeGain', {
            detail: { 
              knowledge: reward.value, 
              source: `Quest: ${quest.title}`,
              questId: quest.id 
            }
          }));
          appliedRewards.push(`Knowledge: ${reward.description}`);
          otherRewards.push({ type: 'knowledge', value: reward.value, description: reward.description });
          break;
          
        case 'skill':
          // Emit event for skill gain
          window.dispatchEvent(new CustomEvent('skillGain', {
            detail: { 
              skill: reward.value, 
              source: `Quest: ${quest.title}`,
              questId: quest.id 
            }
          }));
          appliedRewards.push(`Skill: ${reward.description}`);
          otherRewards.push({ type: 'skill', value: reward.value, description: reward.description });
          break;
          
        case 'blessing':
        case 'curse':
          // Emit event for blessing/curse
          window.dispatchEvent(new CustomEvent('statusEffectApplied', {
            detail: { 
              effect: reward.type,
              value: reward.value,
              description: reward.description,
              source: `Quest: ${quest.title}`,
              questId: quest.id 
            }
          }));
          appliedRewards.push(`${reward.type === 'blessing' ? 'Blessing' : 'Curse'}: ${reward.description}`);
          otherRewards.push({ type: reward.type, value: reward.value, description: reward.description });
          break;
          
        case 'title':
          // Emit event for title gain
          window.dispatchEvent(new CustomEvent('titleGranted', {
            detail: { 
              title: reward.value,
              source: `Quest: ${quest.title}`,
              questId: quest.id 
            }
          }));
          appliedRewards.push(`Title: ${reward.value}`);
          otherRewards.push({ type: 'title', value: reward.value, description: reward.description });
          break;
          
        case 'relationship':
          // Emit event for relationship change
          window.dispatchEvent(new CustomEvent('relationshipChange', {
            detail: { 
              target: reward.value,
              description: reward.description,
              source: `Quest: ${quest.title}`,
              questId: quest.id 
            }
          }));
          appliedRewards.push(`Relationship: ${reward.description}`);
          otherRewards.push({ type: 'relationship', value: reward.value, description: reward.description });
          break;
          
        case 'map_reveal':
          // Emit event for map reveal
          window.dispatchEvent(new CustomEvent('mapAreaRevealed', {
            detail: { 
              area: reward.value,
              source: `Quest: ${quest.title}`,
              questId: quest.id 
            }
          }));
          appliedRewards.push(`Map Revealed: ${reward.description}`);
          otherRewards.push({ type: 'map_reveal', value: reward.value, description: reward.description });
          break;
          
        case 'quest_unlock':
          // Unlock follow-up quest
          if (reward.value && typeof reward.value === 'string') {
            // TODO: Implement quest unlocking system
            console.log(`[QuestService] Unlocked quest: ${reward.value}`);
          }
          appliedRewards.push(`New Quest: ${reward.description}`);
          otherRewards.push({ type: 'quest_unlock', value: reward.value, description: reward.description });
          break;
          
        case 'special_ability':
          // Emit event for special ability gain
          window.dispatchEvent(new CustomEvent('specialAbilityGranted', {
            detail: { 
              ability: reward.value,
              description: reward.description,
              source: `Quest: ${quest.title}`,
              questId: quest.id 
            }
          }));
          appliedRewards.push(`Ability: ${reward.description}`);
          otherRewards.push({ type: 'special_ability', value: reward.value, description: reward.description });
          break;
      }
    });
    
    // Calculate total value
    const totalValue = rewardResult.items.reduce((sum, item) => sum + (item.value || 0), 0);
    
    // Emit comprehensive reward event for UI notification
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('questRewardsReceived', {
        detail: {
          questTitle: quest.title,
          items: rewardResult.items,
          otherRewards: [...rewardResult.otherRewards, ...otherRewards],
          appliedRewards,
          totalValue
        }
      }));
    }
    
    console.log(`[QuestService] Applied rewards for quest "${quest.title}":`, appliedRewards);
    
    return {
      items: rewardResult.items,
      otherRewards: [...rewardResult.otherRewards, ...otherRewards],
      totalValue,
      appliedRewards
    };
  }
  
  /**
   * Play quest completion effects (sound and animation)
   */
  private playQuestCompleteEffects(quest: Quest): void {
    // Play procedural completion sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a pleasant completion chord (C major triad)
      const playNote = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        // Envelope for smooth sound
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = audioContext.currentTime;
      
      // Play a pleasant completion chord (C-E-G with octave)
      playNote(261.63, now, 0.3);        // C4
      playNote(329.63, now + 0.05, 0.3); // E4
      playNote(392.00, now + 0.1, 0.3);  // G4
      playNote(523.25, now + 0.15, 0.5); // C5 (octave)
      
      // Add a little sparkle sound
      const sparkle = audioContext.createOscillator();
      const sparkleGain = audioContext.createGain();
      sparkle.connect(sparkleGain);
      sparkleGain.connect(audioContext.destination);
      
      sparkle.frequency.value = 2093; // C7 - very high
      sparkle.type = 'sine';
      sparkleGain.gain.setValueAtTime(0, now + 0.2);
      sparkleGain.gain.linearRampToValueAtTime(0.1, now + 0.25);
      sparkleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      
      sparkle.start(now + 0.2);
      sparkle.stop(now + 0.6);
      
    } catch (error) {
      console.log('[QuestService] Could not play completion sound:', error);
    }
    
    // Dispatch event for visual animation
    window.dispatchEvent(new CustomEvent('questComplete', {
      detail: {
        quest,
        rewards: quest.rewards
      }
    }));
  }

  /**
   * Get location interaction for a specific tile
   */
  getLocationInteraction(x: number, y: number): LocationInteraction | undefined {
    return this.locationInteractions.get(`${x},${y}`);
  }

  /**
   * Add special interaction for a location
   */
  addLocationInteraction(x: number, y: number, interaction: LocationInteraction): void {
    this.locationInteractions.set(`${x},${y}`, interaction);
  }

  /**
   * Get all active quests
   */
  getActiveQuests(): Quest[] {
    return this.activeQuests;
  }

  /**
   * Get a specific quest by ID
   */
  getQuest(questId: string): Quest | undefined {
    return this.activeQuests.find(q => q.id === questId) ||
           this.completedQuests.find(q => q.id === questId);
  }

  /**
   * Get all completed quests
   */
  getCompletedQuests(): Quest[] {
    return this.completedQuests;
  }
  
  /**
   * Clear all completed quests
   */
  clearCompletedQuests(): void {
    this.completedQuests = [];
    this.saveQuests();
    console.log('[QuestService] Cleared all completed quests');
  }

  /**
   * Get the currently active quest (for notifications and markers)
   */
  getCurrentlyActiveQuest(): Quest | null {
    return this.activeQuests.find(quest => quest.isActiveQuest === true) || null;
  }

  /**
   * Set a quest as the currently active one (deactivates others)
   */
  setActiveQuest(questId: string): boolean {
    const quest = this.activeQuests.find(q => q.id === questId);
    if (!quest) {
      console.warn('[QuestService] Attempted to activate non-existent quest:', questId);
      return false;
    }

    // Deactivate all other quests
    this.activeQuests.forEach(q => {
      q.isActiveQuest = false;
    });

    // Activate the selected quest
    quest.isActiveQuest = true;
    this.saveQuests();

    console.log('[QuestService] Set active quest:', quest.title);
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('activeQuestChanged', { 
      detail: { questId: questId, quest: quest }
    }));

    return true;
  }

  /**
   * Deactivate all quests (no active quest)
   */
  deactivateAllQuests(): void {
    this.activeQuests.forEach(q => {
      q.isActiveQuest = false;
    });
    this.saveQuests();
    
    console.log('[QuestService] Deactivated all quests');
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('activeQuestChanged', { 
      detail: { questId: null, quest: null }
    }));
  }
  
  /**
   * Get active economic quests for a specific market
   */
  getActiveEconomicQuests(marketLocation?: { x: number; y: number }): Quest[] {
    return this.activeQuests.filter(quest => {
      const isEconomic = (quest as any).isEconomicQuest;
      if (!isEconomic) return false;
      
      // If no location specified, return all economic quests
      if (!marketLocation) return true;
      
      // Check if quest is for this market location
      const questLocation = quest.objectives[0]?.targetLocation;
      if (questLocation) {
        const distance = Math.sqrt(
          Math.pow(questLocation.x - marketLocation.x, 2) +
          Math.pow(questLocation.y - marketLocation.y, 2)
        );
        return distance <= 5; // Within 5 tiles is considered same market
      }
      return true; // If no location set, include it
    });
  }

  /**
   * Get quest markers for map display
   */
  getQuestMarkers(): QuestMarker[] {
    return this.questMarkers;
  }

  /**
   * Check if a trade action completes any quest objectives
   */
  checkTradeObjective(
    action: 'buy' | 'sell',
    itemId: string,
    quantity: number,
    merchantId?: string,
    marketLocation?: { x: number; y: number }
  ): void {
    this.activeQuests.forEach(quest => {
      if (quest.status !== 'active') return;
      
      // Check if this is an economic quest
      const isEconomicQuest = (quest as any).isEconomicQuest;
      
      quest.objectives.forEach(objective => {
        if (objective.completed) return;
        
        // Normalize item IDs for case-insensitive comparison
        const normalizedItemId = itemId.toLowerCase();
        
        // Check for deliver item objectives
        if (objective.type === 'deliver_item' && action === 'buy') {
          // Check if we're buying the required item (case-insensitive)
          const targetItem = ((objective as any).targetItem || '').toLowerCase();
          const objectiveItemId = ((objective as any).itemId || '').toLowerCase();
          if (targetItem && (targetItem === normalizedItemId || objectiveItemId === normalizedItemId)) {
            const requiredQuantity = (objective as any).quantity || 1;
            if (quantity >= requiredQuantity) {
              console.log(`[QuestService] Trade objective completed: bought ${quantity} ${itemId} for quest ${quest.title}`);
              this.completeObjective(quest.id, objective.id);
            }
          }
        }
        
        // Check for sell item objectives
        if ((objective.type === 'trade' || objective.type === 'sell_item') && action === 'sell') {
          const targetItem = ((objective as any).targetItem || (objective as any).itemId || '').toLowerCase();
          if (targetItem && targetItem === normalizedItemId) {
            const requiredQuantity = (objective as any).quantity || 1;
            if (quantity >= requiredQuantity) {
              console.log(`[QuestService] Trade objective completed: sold ${quantity} ${itemId} for quest ${quest.title}`);
              this.completeObjective(quest.id, objective.id);
            }
          }
        }
        
        // Check for collect_item objectives (common in economic quests)
        if (objective.type === 'collect_item' && action === 'buy') {
          const targetItem = ((objective as any).targetItem || (objective as any).itemId || '').toLowerCase();
          if (targetItem && targetItem === normalizedItemId) {
            const requiredQuantity = (objective as any).targetAmount || (objective as any).quantity || 1;
            if (quantity >= requiredQuantity) {
              console.log(`[QuestService] Collect objective completed: acquired ${quantity} ${itemId} for quest ${quest.title}`);
              this.completeObjective(quest.id, objective.id);
            }
          }
        }
        
        // Check for crisis supply objectives (buying items during crisis)
        if (objective.type === 'supply_crisis' && action === 'buy' && isEconomicQuest) {
          const context = (quest as any).economicContext;
          if (context && context.itemScarcity) {
            const scarcityItems = context.itemScarcity.map((id: string) => id.toLowerCase());
            if (scarcityItems.includes(normalizedItemId)) {
              console.log(`[QuestService] Crisis supply objective completed: acquired scarce item ${itemId}`);
              this.completeObjective(quest.id, objective.id);
            }
          }
        }
        
        // Check for surplus clearing objectives (selling surplus items)
        if (objective.type === 'clear_surplus' && action === 'sell' && isEconomicQuest) {
          const context = (quest as any).economicContext;
          if (context && context.itemSurplus) {
            const surplusItems = context.itemSurplus.map((id: string) => id.toLowerCase());
            if (surplusItems.includes(normalizedItemId)) {
              const requiredQuantity = (objective as any).quantity || 10;
              if (quantity >= requiredQuantity) {
                console.log(`[QuestService] Surplus clearing objective completed: sold ${quantity} surplus ${itemId}`);
                this.completeObjective(quest.id, objective.id);
              }
            }
          }
        }
        
        // Check for location-based trade objectives
        if (objective.type === 'visit' && objective.targetLocation && marketLocation) {
          const distance = Math.sqrt(
            Math.pow(objective.targetLocation.x - marketLocation.x, 2) +
            Math.pow(objective.targetLocation.y - marketLocation.y, 2)
          );
          if (distance <= 5) {
            console.log(`[QuestService] Location trade objective completed: traded at target market`);
            this.completeObjective(quest.id, objective.id);
          }
        }
        
        // Check for merchant-specific objectives
        if ((objective as any).targetMerchant && merchantId) {
          if ((objective as any).targetMerchant === merchantId) {
            console.log(`[QuestService] Merchant-specific objective completed: traded with ${merchantId}`);
            this.completeObjective(quest.id, objective.id);
          }
        }
      });
    });
  }

  /**
   * Load quests from localStorage
   */
  private loadQuests(): void {
    try {
      // Use debounced storage which checks pending writes first
      const questData = debouncedStorage.getItem<any>('uhs_quest_data');
      if (questData) {
        this.activeQuests = questData.activeQuests || [];
        this.completedQuests = questData.completedQuests || [];
        this.questChains = questData.questChains || [];
        this.questMarkers = questData.questMarkers || [];
        console.log('[QuestService] Loaded quests from localStorage:', this.activeQuests.length, 'active,', this.completedQuests.length, 'completed');
      } else {
        // Initialize empty arrays if no saved data
        this.activeQuests = [];
        this.completedQuests = [];
        this.questChains = [];
        this.questMarkers = [];
        console.log('[QuestService] No saved quests found, initialized empty arrays');
      }
    } catch (error) {
      console.error('[QuestService] Failed to load quests from localStorage:', error);
      // Reset to empty arrays on error
      this.activeQuests = [];
      this.completedQuests = [];
      this.questChains = [];
      this.questMarkers = [];
    }
  }

  /**
   * Save quests to localStorage
   */
  private saveQuests(): void {
    try {
      const questData = {
        activeQuests: this.activeQuests,
        completedQuests: this.completedQuests,
        questChains: this.questChains,
        questMarkers: this.questMarkers,
        timestamp: Date.now()
      };
      // Use debounced storage to prevent performance issues
      debouncedStorage.setItem('uhs_quest_data', questData);
      // Logging removed - too frequent
    } catch (error) {
      console.error('[QuestService] Failed to save quests:', error);
    }
  }
  
  /**
   * Get current time of day
   */
  private getTimeOfDay(): string {
    const hour = new Date().getHours(); // This would ideally use game time
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }
  
  /**
   * Get current weather (placeholder - would be connected to weather system)
   */
  private getCurrentWeather(): string {
    const weathers = ['clear', 'rain', 'cloudy', 'snow', 'fog'];
    return weathers[Math.floor(Math.random() * weathers.length)];
  }
  
  /**
   * Get current season (placeholder - would be connected to date system)
   */
  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  /**
   * Check for expired crisis quests and fail them
   */
  checkExpiredQuests(): void {
    const now = Date.now();
    const expiredQuests = this.activeQuests.filter(quest => {
      const timeLimit = (quest as any).timeLimit;
      if (!timeLimit) return false;
      
      const elapsed = now - (quest.startTime || now);
      return elapsed > timeLimit;
    });
    
    expiredQuests.forEach(quest => {
      console.log(`[QuestService] ⏰ Quest expired: "${quest.title}"`);
      quest.status = 'failed';
      (quest as any).failureReason = 'Time limit exceeded';
      
      // Remove from active quests
      const index = this.activeQuests.findIndex(q => q.id === quest.id);
      if (index !== -1) {
        this.activeQuests.splice(index, 1);
      }
      
      // Add to completed quests as failed
      this.completedQuests.push(quest);
      
      // Emit failure event
      window.dispatchEvent(new CustomEvent('questFailed', {
        detail: {
          quest,
          reason: 'Time limit exceeded',
          penalty: 'Crisis worsened'
        }
      }));
    });
    
    if (expiredQuests.length > 0) {
      this.saveQuests();
    }
  }

  /**
   * Clear all quests (for new game)
   */
  clearAllQuests(): void {
    this.activeQuests = [];
    this.completedQuests = [];
    this.questChains = [];
    this.questMarkers = [];
    this.locationInteractions.clear();
    localStorage.removeItem('activeQuests');
    localStorage.removeItem('completedQuests');
  }

  /**
   * Generate initial procedural quests based on game mode and map
   * UPDATED: Now uses unified quest pipeline for consistency
   */
  async generateInitialQuests(
    gameMode: string,
    mapStructures: TerrainStructure[],
    playerLocation: { x: number; y: number },
    culturalZone: string,
    era: string,
    mapData?: any,
    playerStats?: any
  ): Promise<Quest[]> {
    const quests: Quest[] = [];
    
    // Note: resetQuestService() should have been called before this
    // If we already have quests at this point, they were likely added
    // after reset (e.g., ruin exploration quest), so preserve them
    if (this.activeQuests.length > 0) {
      console.log('[QuestService] Preserving', this.activeQuests.length, 'quests added after reset');
      quests.push(...this.activeQuests);
    }
    
    // Create unified quest generation context
    const context: QuestGenerationContext = {
      mapData,
      playerLocation,
      playerStats,
      zone: culturalZone,
      era,
      year: mapData?.year || parseInt(mapData?.timeSlice) || 1500, // Use actual game year
      season: mapData?.season || 'spring',
      gameMode,
      triggerType: 'manual',
      nearbyStructures: mapStructures,
      nearbyNPCs: mapData?.npcs || []
    };

    // Analyze the map context for additional intelligence
    const mapContext = analyzeMapContext(mapData);

    // Generate only ONE seasonal quest appropriate to the game mode
    // All other quests should emerge from player actions (NPCs, ruins, marketplace, etc.)
    try {
      // Generate a single seasonal quest
      const seasonalQuest = await this.generateSeasonalQuest(context, mapContext);
      
      if (seasonalQuest && isQuestAppropriateForContext(seasonalQuest.category, seasonalQuest.title, mapContext, era)) {
        quests.push(seasonalQuest);
        this.addQuest(seasonalQuest);
      } else {
        console.log(`[QuestService] No appropriate seasonal quest for current context`);
      }
      
    } catch (error) {
      console.error('[QuestService] Error generating seasonal quest:', error);
      
      // Fallback to a simple survival quest
      const fallbackQuest = this.generateSimpleFallbackQuest(context, mapContext);
      if (fallbackQuest) {
        quests.push(fallbackQuest);
        this.addQuest(fallbackQuest);
      }
    }
    
    
    return quests;
  }

  /**
   * Generate a single seasonal quest appropriate to the game mode and season
   */
  private async generateSeasonalQuest(
    context: QuestGenerationContext,
    mapContext: any
  ): Promise<Quest | null> {
    const { gameMode, season, zone, era, year } = context;
    
    // Seasonal quest templates based on game mode and season
    const seasonalTemplates: Record<string, Record<string, any>> = {
      'survival': {
        'winter': { 
          title: 'Winter Preparations', 
          description: 'Gather resources to survive the harsh winter months.',
          objectives: [{ type: 'collect_item', description: 'Collect firewood', targetAmount: 10 }],
          category: 'survival'
        },
        'spring': { 
          title: 'Spring Renewal', 
          description: 'Take advantage of the changing season to gather fresh resources.',
          objectives: [{ type: 'collect_item', description: 'Gather fresh herbs', targetAmount: 5 }],
          category: 'survival'
        },
        'summer': { 
          title: 'Summer Preparation', 
          description: 'Store resources for the coming seasons.',
          objectives: [{ type: 'collect_item', description: 'Preserve food for winter', targetAmount: 8 }],
          category: 'survival'
        },
        'autumn': { 
          title: 'Harvest Season', 
          description: 'Gather the autumn harvest before winter arrives.',
          objectives: [{ type: 'collect_item', description: 'Collect autumn harvest', targetAmount: 12 }],
          category: 'survival'
        }
      },
      'exploration': {
        'spring': { 
          title: 'Chart the Unknown', 
          description: 'Explore unmapped regions and document your discoveries.',
          objectives: [{ type: 'travel', description: 'Travel at least 10 tiles from your starting position' }],
          category: 'exploration'
        },
        'summer': { 
          title: 'Summer Expedition', 
          description: 'Use the favorable weather to explore distant lands.',
          objectives: [{ type: 'explore_area', description: 'Discover 3 new landmarks' }],
          category: 'exploration'
        }
      },
      'commerce': {
        'spring': { 
          title: 'Trading Season', 
          description: 'Establish trade connections as travel becomes easier.',
          objectives: [{ type: 'trade', description: 'Complete 3 successful trades' }],
          category: 'trade'
        }
      },
      'scholarship': {
        'winter': { 
          title: 'Winter Studies', 
          description: 'Use the quiet winter months for learning and research.',
          objectives: [{ type: 'investigate', description: 'Study ancient texts or artifacts' }],
          category: 'scholarship'
        }
      }
    };
    
    const template = seasonalTemplates[gameMode]?.[season] || seasonalTemplates['survival'][season || 'spring'];
    if (!template) return null;
    
    // Add historical context
    const historicalContext = await historicalContextEngine.getContext(zone, era, year);
    const historicalFlavor = this.getHistoricalFlavor(zone, era, historicalContext);
    
    const quest: Quest = {
      id: `seasonal_${gameMode}_${season}_${Date.now()}`,
      title: template.title,
      description: template.description + (historicalFlavor ? ` ${historicalFlavor}` : ''),
      category: template.category,
      objectives: template.objectives.map((obj: any, idx: number) => ({
        id: `obj_${idx}`,
        type: obj.type,
        description: obj.description,
        targetAmount: obj.targetAmount,
        completed: false
      })),
      currentObjectiveIndex: 0,
      rewards: [{
        type: 'experience',
        amount: 50,
        description: 'Experience gained'
      }, {
        type: 'reputation',
        amount: 10,
        description: 'Regional reputation +10'
      }],
      startLocation: context.playerLocation,
      status: 'available',
      startTime: Date.now(),
      isSeasonalQuest: true
    };
    
    return quest;
  }
  
  /**
   * Add historical flavor text based on era and zone
   */
  private getHistoricalFlavor(zone: string, era: string, context: any): string {
    const flavorMap: Record<string, Record<string, string>> = {
      'ANTIQUITY': {
        'SUB_SAHARAN_AFRICAN': 'Explorers in ANTIQUITY SUB_SAHARAN_AFRICAN were driven by curiosity and the promise of discovery.',
        'EUROPEAN': 'In ancient times, such endeavors required courage and determination.',
        'EAST_ASIAN': 'The wise ancients understood the importance of seasonal preparation.'
      },
      'MEDIEVAL': {
        'EUROPEAN': 'In these medieval times, survival depends on preparation and providence.',
        'MENA': 'The seasonal cycles guide the faithful in their daily struggles.'
      }
    };
    
    return flavorMap[era]?.[zone] || '';
  }
  
  /**
   * Generate a simple fallback quest if seasonal generation fails
   */
  private generateSimpleFallbackQuest(
    context: QuestGenerationContext,
    mapContext: any
  ): Quest | null {
    return {
      id: `fallback_${Date.now()}`,
      title: 'Establish Yourself',
      description: 'Begin your journey by exploring your immediate surroundings.',
      category: 'exploration',
      objectives: [{
        id: 'obj_1',
        type: 'explore_area',
        description: 'Explore the nearby area',
        completed: false
      }],
      currentObjectiveIndex: 0,
      rewards: [{
        type: 'experience',
        amount: 25,
        description: 'Experience gained'
      }],
      startLocation: context.playerLocation,
      status: 'available',
      startTime: Date.now()
    };
  }

  /**
   * Legacy quest generation fallback (maintains compatibility)
   */
  private generateLegacyInitialQuests(
    gameMode: string,
    mapStructures: TerrainStructure[],
    playerLocation: { x: number; y: number },
    culturalZone: string,
    era: string,
    mapData?: any,
    playerStats?: any
  ): Quest[] {
    const quests: Quest[] = [];
    
    // Special handling for ocean maps using original logic
    const mapContext = analyzeMapContext(mapData);
    if (mapContext.primaryTerrain === 'ocean' || mapContext.waterPercentage > 75) {
      console.log('[QuestService] Legacy: Generating ocean-specific quests');
      const oceanQuests = getOceanQuests(
        mapContext.waterPercentage,
        era,
        culturalZone,
        playerLocation
      );
      
      oceanQuests.slice(0, 3).forEach(quest => {
        quests.push(quest);
        this.addQuest(quest);
      });
      
      return quests;
    }
    
    // Original land-based quest generation
    const nearbyStructures = findStructuresInRadius(mapStructures, playerLocation, 50);
    const hasNearbyNPCs = mapData?.npcs && mapData.npcs.length > 0;
    
    let availableCategories = getAvailableCategories(
      gameMode,
      nearbyStructures.length > 0,
      hasNearbyNPCs
    );
    
    availableCategories = filterDuplicateCategories(availableCategories, this.activeQuests);
    
    const maxQuests = Math.min(4, availableCategories.length);
    let attempts = 0;
    const maxAttempts = maxQuests * 2;
    
    while (quests.length < maxQuests && availableCategories.length > 0 && attempts < maxAttempts) {
      attempts++;
      
      const categoryIndex = Math.floor(Math.random() * availableCategories.length);
      const category = availableCategories[categoryIndex];
      
      const quest = generateVariedQuest(
        category,
        playerLocation,
        mapStructures,
        culturalZone,
        era,
        quests.length
      );
      
      if (quest && isQuestAppropriateForContext(quest.category, quest.title, mapContext, era)) {
        quests.push(quest);
        this.addQuest(quest);
        availableCategories.splice(categoryIndex, 1);
      }
    }

    return quests;
  }
  
  /**
   * Generate a basic wilderness quest when no structures are available
   */
  private generateWildernessQuest(
    playerLocation: { x: number; y: number },
    culturalZone: string,
    era: string
  ): Quest | null {
    const wildernessQuests = [
      {
        title: 'Explore the Wilderness',
        description: 'Venture into uncharted territory and discover what lies beyond.',
        objectives: [
          {
            id: 'obj_1',
            description: 'Travel at least 10 tiles from your starting position',
            type: 'travel_distance' as const,
            targetDistance: 10,
            completed: false
          },
          {
            id: 'obj_2',
            description: 'Find a suitable campsite',
            type: 'visit_location' as const,
            targetLocation: {
              x: playerLocation.x + Math.floor(Math.random() * 20 - 10),
              y: playerLocation.y + Math.floor(Math.random() * 20 - 10)
            },
            completed: false
          }
        ],
        category: 'exploration' as const
      },
      {
        title: 'Basic Survival',
        description: 'Secure the essentials for survival in this harsh environment.',
        objectives: [
          {
            id: 'obj_1',
            description: 'Find and collect fresh water',
            type: 'visit_location' as const,
            targetLocation: {
              x: playerLocation.x + Math.floor(Math.random() * 15 - 7),
              y: playerLocation.y + Math.floor(Math.random() * 15 - 7)
            },
            completed: false
          },
          {
            id: 'obj_2',
            description: 'Gather food supplies',
            type: 'visit_location' as const,
            targetLocation: {
              x: playerLocation.x + Math.floor(Math.random() * 15 - 7),
              y: playerLocation.y + Math.floor(Math.random() * 15 - 7)
            },
            completed: false
          }
        ],
        category: 'survival' as const
      }
    ];
    
    const selected = wildernessQuests[Math.floor(Math.random() * wildernessQuests.length)];
    
    return {
      id: `quest_wilderness_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: selected.title,
      description: selected.description,
      historicalContext: this.getContextualHistory(culturalZone, era, selected.category),
      category: selected.category,
      objectives: selected.objectives,
      currentObjectiveIndex: 0,
      rewards: [
        { type: 'reputation', value: 5, description: 'Survival reputation +5' },
        { type: 'experience', value: 10, description: 'Experience gained' }
      ],
      startLocation: playerLocation,
      startTime: Date.now(),
      status: 'active',
      difficulty: 'easy'
    };
  }
  
  /**
   * Generate context-aware wilderness quest
   */
  private generateContextAwareWildernessQuest(
    playerLocation: { x: number; y: number },
    culturalZone: string,
    era: string,
    mapContext: any
  ): Quest | null {
    // Ocean/water wilderness
    if (mapContext.waterPercentage > 60) {
      return {
        id: `quest_ocean_survival_${Date.now()}`,
        title: 'Survive the Open Waters',
        description: 'Find a way to survive in these vast waters.',
        historicalContext: `Sailors of ${era} ${culturalZone} faced the endless ocean with courage and skill.`,
        category: 'survival',
        objectives: [
          {
            id: 'obj_1',
            description: 'Find any floating debris or land',
            type: 'explore_area',
            targetLocation: {
              x: playerLocation.x + Math.floor(Math.random() * 20 - 10),
              y: playerLocation.y + Math.floor(Math.random() * 20 - 10)
            },
            completed: false
          },
          {
            id: 'obj_2',
            description: 'Survive for 2 days',
            type: 'survive_time',
            targetDays: 2,
            completed: false
          }
        ],
        currentObjectiveIndex: 0,
        rewards: [
          { type: 'reputation', value: 10, description: 'Survivor reputation +10' },
          { type: 'experience', value: 20, description: 'Survival experience' }
        ],
        startLocation: playerLocation,
        startTime: Date.now(),
        status: 'active',
        difficulty: 'medium'
      };
    }
    
    // Desert wilderness
    if (mapContext.climate === 'desert') {
      return {
        id: `quest_desert_survival_${Date.now()}`,
        title: 'Desert Survival',
        description: 'The harsh desert tests your limits. Find water and shelter.',
        historicalContext: `Desert nomads of ${era} ${culturalZone} knew the secrets of surviving where others perished.`,
        category: 'survival',
        objectives: [
          {
            id: 'obj_1',
            description: 'Find an oasis or water source',
            type: 'visit_location',
            targetLocation: {
              x: playerLocation.x + Math.floor(Math.random() * 15 - 7),
              y: playerLocation.y + Math.floor(Math.random() * 15 - 7)
            },
            completed: false
          },
          {
            id: 'obj_2',
            description: 'Find shelter from the sun',
            type: 'visit_location',
            targetLocation: {
              x: playerLocation.x + Math.floor(Math.random() * 10 - 5),
              y: playerLocation.y + Math.floor(Math.random() * 10 - 5)
            },
            completed: false
          }
        ],
        currentObjectiveIndex: 0,
        rewards: [
          { type: 'reputation', value: 8, description: 'Desert survivor +8' },
          { type: 'knowledge', value: 1, description: 'Desert survival knowledge' }
        ],
        startLocation: playerLocation,
        startTime: Date.now(),
        status: 'active',
        difficulty: 'medium'
      };
    }
    
    // Default land wilderness
    return this.generateWildernessQuest(playerLocation, culturalZone, era);
  }
  
  /**
   * Get contextual historical information for a quest
   */
  private getContextualHistory(zone: string, era: string, category: string): string {
    const histories: Record<string, string[]> = {
      survival: [
        `In ${era}, travelers through ${zone} relied on local knowledge and resourcefulness to survive.`,
        `The harsh conditions of ${zone} during ${era} tested even the most prepared adventurers.`,
        `Traditional survival techniques from ${zone} were passed down through generations.`
      ],
      exploration: [
        `Explorers in ${era} ${zone} were driven by curiosity and the promise of discovery.`,
        `Maps of ${zone} from ${era} often marked unexplored regions with warnings and legends.`,
        `The uncharted territories of ${zone} held both danger and opportunity for brave souls.`
      ],
      trade: [
        `Trade routes through ${zone} in ${era} connected distant civilizations and cultures.`,
        `Merchants of ${era} built fortunes by navigating the complex markets of ${zone}.`,
        `The economy of ${zone} during ${era} depended on the flow of goods and information.`
      ]
    };
    
    const categoryHistories = histories[category] || histories.exploration;
    return categoryHistories[Math.floor(Math.random() * categoryHistories.length)];
  }
  
  /**
   * Generate procedural quests based on nearby map features
   */
  private generateProceduralQuests(
    mapStructures: TerrainStructure[],
    playerLocation: { x: number; y: number },
    culturalZone: string,
    era: string,
    mapData?: any
  ): Quest[] {
    const quests: Quest[] = [];
    const searchRadius = 20; // Increased search radius for more options
    
    // Find nearby ruins (check both type and structureType fields)
    const nearbyRuins = mapStructures.filter(s => {
      const isRuin = s.type === 'ruins' || s.structureType === 'ruins';
      if (!isRuin) return false;
      const loc = getStructureLocation(s);
      if (!loc) return false;
      const distance = Math.sqrt(
        Math.pow(loc.x - playerLocation.x, 2) + 
        Math.pow(loc.y - playerLocation.y, 2)
      );
      return distance <= searchRadius;
    });
    
    // Generate exploration quest for nearest ruin
    if (nearbyRuins.length > 0) {
      const nearestRuin = nearbyRuins.sort((a, b) => {
        const locA = getStructureLocation(a);
        const locB = getStructureLocation(b);
        if (!locA || !locB) return 0;
        const distA = Math.sqrt(
          Math.pow(locA.x - playerLocation.x, 2) + 
          Math.pow(locA.y - playerLocation.y, 2)
        );
        const distB = Math.sqrt(
          Math.pow(locB.x - playerLocation.x, 2) + 
          Math.pow(locB.y - playerLocation.y, 2)
        );
        return distA - distB;
      })[0];
      
      const ruinLoc = getStructureLocation(nearestRuin);
      if (!ruinLoc) return quests;
      
      const direction = this.getDirection(playerLocation, ruinLoc);
      const ruinName = this.generateRuinName(culturalZone, era);
      
      const distance = Math.sqrt(
        Math.pow(ruinLoc.x - playerLocation.x, 2) + 
        Math.pow(ruinLoc.y - playerLocation.y, 2)
      );
      const difficulty = distance < 5 ? 'easy' : distance < 10 ? 'medium' : 'hard';
      
      const explorationQuest: Quest = {
        id: `quest_explore_${Date.now()}`,
        title: `Explore the ${ruinName}`,
        description: `There is a ${ruinName} visible to the ${direction}. Explore it and see if it holds anything of interest. Local rumors speak of ${this.generateRumorText(culturalZone, era)}.`,
        category: 'exploration',
        objectives: [
          {
            id: 'obj_1',
            description: `Reach the ${ruinName}`,
            type: 'visit_location',
            targetLocation: ruinLoc,
            targetType: 'ruins',
            completed: false,
            isLLMEnabled: true
          },
          {
            id: 'obj_2',
            description: `Explore the ruins thoroughly`,
            type: 'explore_area',
            targetLocation: { ...ruinLoc, radius: 2 },
            completed: false,
            hidden: true, // Revealed when reaching the ruins
            isLLMEnabled: true
          },
          {
            id: 'obj_3',
            description: `Discover the secret of the ruins`,
            type: 'solve_puzzle',
            completed: false,
            hidden: true,
            optional: true // Bonus objective
          }
        ],
        currentObjectiveIndex: 0,
        rewards: [
          {
            type: 'reputation',
            value: 10 + (difficulty === 'medium' ? 5 : difficulty === 'hard' ? 10 : 0),
            description: `Explorer reputation +${10 + (difficulty === 'medium' ? 5 : difficulty === 'hard' ? 10 : 0)}`,
            guaranteed: true
          },
          {
            type: 'item',
            itemId: 'ancient_artifact',
            quantity: 1,
            description: 'Ancient artifact',
            guaranteed: false,
            chance: 0.3
          },
          {
            type: 'knowledge',
            value: 1,
            description: 'Historical knowledge',
            guaranteed: true
          }
        ],
        bonusRewards: [
          {
            type: 'map_reveal',
            value: { radius: 5, centerX: ruinLoc.x, centerY: ruinLoc.y },
            description: 'Reveal surrounding area',
            guaranteed: true
          }
        ],
        startLocation: playerLocation,
        startTime: Date.now(),
        status: 'active',
        difficulty,
        isProceduralQuest: true,
        followUpQuests: [`quest_chain_ruins_${ruinLoc.x}_${ruinLoc.y}`]
      };
      
      quests.push(explorationQuest);
    }
    
    // Generate hunting quest for most dangerous animal
    if (mapData?.animals && mapData.animals.length > 0) {
      const dangerousAnimals = mapData.animals
        .filter((a: any) => a.danger && a.danger > 50)
        .sort((a: any, b: any) => b.danger - a.danger);
      
      if (dangerousAnimals.length > 0) {
        const target = dangerousAnimals[0];
        const huntQuest: Quest = {
          id: `quest_hunt_${Date.now()}`,
          title: `Hunt the ${target.speciesName}`,
          description: `A dangerous ${target.speciesName} has been spotted in the area. Hunt it down to protect travelers and earn glory.`,
          category: 'combat',
          objectives: [{
            id: 'obj_1',
            description: `Hunt and defeat the ${target.speciesName}`,
            type: 'defeat_entity',
            targetEntity: target.id,
            completed: false
          }],
          currentObjectiveIndex: 0,
          rewards: [{
            type: 'reputation',
            value: 25,
            description: 'Hunter reputation +25'
          }, {
            type: 'item',
            value: 'animal_trophy',
            description: `${target.speciesName} trophy`
          }],
          startLocation: playerLocation,
          startTime: Date.now(),
          status: 'active',
          isProceduralQuest: true
        };
        
        quests.push(huntQuest);
      }
    }
    
    // If we don't have 2 quests yet, add a sacred site quest
    if (quests.length < 2) {
      const holySites = mapStructures.filter(s => s.type === 'holy_site' || s.structureType === 'holy_site');
      if (holySites.length > 0) {
        const targetSite = holySites[Math.floor(Math.random() * holySites.length)];
        const siteLoc = getStructureLocation(targetSite);
        if (siteLoc) {
          const pilgrimmageQuest: Quest = {
            id: `quest_pilgrimmage_${Date.now()}`,
            title: 'Sacred Pilgrimage',
            description: 'Visit a sacred site to gain spiritual insight and blessings.',
            category: 'exploration',
            objectives: [{
              id: 'obj_1',
              description: 'Reach the sacred site',
              type: 'visit_location',
              targetLocation: siteLoc,
            targetType: 'holy_site',
            completed: false
          }],
          currentObjectiveIndex: 0,
          rewards: [{
            type: 'blessing',
            value: 1,
            description: 'Divine blessing'
          }],
          startLocation: playerLocation,
          startTime: Date.now(),
          status: 'active',
          isProceduralQuest: true
        };
          
          quests.push(pilgrimmageQuest);
        }
      }
    }
    
    // Add a merchant escort quest if there are cities/hamlets nearby
    const nearbyCities = mapStructures.filter(s => {
      const isUrban = s.type === 'urban' || s.structureType === 'urban' || 
                      s.type === 'hamlet' || s.structureType === 'hamlet' ||
                      s.name?.toLowerCase().includes('hamlet');
      if (!isUrban) return false;
      const loc = getStructureLocation(s);
      if (!loc) return false;
      const distance = Math.sqrt(
        Math.pow(loc.x - playerLocation.x, 2) + 
        Math.pow(loc.y - playerLocation.y, 2)
      );
      return distance <= searchRadius && distance > 3; // Not too close, not too far
    });
    
    if (nearbyCities.length > 0 && quests.length < 2) {
      const targetCity = nearbyCities[Math.floor(Math.random() * nearbyCities.length)];
      const cityLoc = getStructureLocation(targetCity);
      if (cityLoc) {
        const escortQuest: Quest = {
        id: `quest_escort_${Date.now()}`,
        title: 'Merchant Escort',
        description: `A local merchant needs protection while traveling to ${targetCity.name || 'the nearby city'}. Bandits have been spotted along the route.`,
        category: 'social',
        objectives: [
          {
            id: 'obj_1',
            description: 'Meet the merchant at the departure point',
            type: 'talk_to_npc',
            targetLocation: playerLocation,
            completed: false
          },
          {
            id: 'obj_2',
            description: `Escort the merchant safely to ${targetCity.name || 'the city'}`,
            type: 'escort_npc',
            targetLocation: cityLoc,
            completed: false,
            timeLimit: 300 // 5 minutes game time
          }
        ],
        currentObjectiveIndex: 0,
        rewards: [
          {
            type: 'money',
            value: 50,
            description: 'Payment: 50 gold',
            guaranteed: true
          },
          {
            type: 'reputation',
            value: 15,
            description: 'Merchant guild reputation +15',
            guaranteed: true
          }
        ],
        startLocation: playerLocation,
        startTime: Date.now(),
        status: 'active',
        difficulty: 'medium',
        failureConditions: [
          {
            type: 'npc_death',
            description: 'The merchant must survive'
          },
          {
            type: 'time_limit',
            value: 600, // 10 minutes real time
            description: 'Complete within time limit'
          }
        ],
        isProceduralQuest: true
      };
        
        quests.push(escortQuest);
      }
    }
    
    // Add a mystery investigation quest for certain biomes
    if (quests.length < 2 && mapData?.biomes) {
      const mysteryQuest = this.generateMysteryQuest(mapStructures, playerLocation, culturalZone, era);
      if (mysteryQuest) {
        quests.push(mysteryQuest);
      }
    }
    
    // If we STILL don't have any quests (no structures at all), generate wilderness survival quests
    if (quests.length === 0) {
      console.log('[QuestService] No structures found, generating wilderness survival quests');
      
      // Generate a basic exploration quest
      const explorationQuest: Quest = {
        id: `quest_explore_wilderness_${Date.now()}`,
        title: 'Explore the Wilderness',
        description: 'Survey the surrounding area and discover what lies beyond the horizon.',
        category: 'exploration',
        objectives: [
          {
            id: 'obj_1',
            description: 'Travel at least 10 tiles from your starting position',
            type: 'travel_distance',
            targetDistance: 10,
            startLocation: playerLocation,
            completed: false
          },
          {
            id: 'obj_2',
            description: 'Survive for 5 days',
            type: 'survive_time',
            targetDays: 5,
            completed: false
          }
        ],
        currentObjectiveIndex: 0,
        rewards: [
          {
            type: 'experience',
            value: 50,
            description: 'Experience +50'
          },
          {
            type: 'reputation',
            value: 5,
            description: 'Explorer reputation +5'
          }
        ],
        startLocation: playerLocation,
        startTime: Date.now(),
        status: 'active',
        difficulty: 'easy',
        isProceduralQuest: true
      };
      quests.push(explorationQuest);
      
      // Generate a survival quest
      const survivalQuest: Quest = {
        id: `quest_survival_${Date.now()}`,
        title: 'Basic Survival',
        description: 'Find food and water to sustain yourself in this harsh environment.',
        category: 'survival',
        objectives: [
          {
            id: 'obj_1',
            description: 'Find or obtain food',
            type: 'collect_resource',
            resourceType: 'food',
            targetAmount: 3,
            completed: false
          },
          {
            id: 'obj_2',
            description: 'Find a water source',
            type: 'find_terrain',
            terrainType: 'water',
            completed: false
          }
        ],
        currentObjectiveIndex: 0,
        rewards: [
          {
            type: 'health',
            value: 10,
            description: 'Health +10'
          },
          {
            type: 'experience',
            value: 25,
            description: 'Experience +25'
          }
        ],
        startLocation: playerLocation,
        startTime: Date.now(),
        status: 'active',
        difficulty: 'easy',
        isProceduralQuest: true
      };
      quests.push(survivalQuest);
    }
    
    return quests.slice(0, 2); // Return max 2 procedural quests
  }
  
  /**
   * Generate mystery/investigation quest
   */
  private generateMysteryQuest(
    mapStructures: TerrainStructure[],
    playerLocation: { x: number; y: number },
    culturalZone: string,
    era: string
  ): Quest | null {
    const mysteries = [
      {
        title: 'The Missing Caravan',
        description: 'A trade caravan was supposed to arrive days ago but never made it. Investigate their disappearance.',
        objectives: [
          { type: 'gather_information', description: 'Ask locals about the missing caravan' },
          { type: 'explore_area', description: 'Search the trade route for clues' },
          { type: 'solve_puzzle', description: 'Piece together what happened' }
        ]
      },
      {
        title: 'Strange Illness',
        description: 'People in the area have been falling ill with an unknown ailment. Investigate the cause.',
        objectives: [
          { type: 'talk_to_npc', description: 'Interview the afflicted' },
          { type: 'collect_item', description: 'Gather samples for analysis' },
          { type: 'make_choice', description: 'Determine the source of illness' }
        ]
      },
      {
        title: 'Ancient Prophecy',
        description: 'An old inscription has been discovered that may foretell important events. Decipher its meaning.',
        objectives: [
          { type: 'visit_location', description: 'Examine the inscription' },
          { type: 'gather_information', description: 'Consult with scholars' },
          { type: 'solve_puzzle', description: 'Decode the prophecy' }
        ]
      }
    ];
    
    const mystery = mysteries[Math.floor(Math.random() * mysteries.length)];
    
    return {
      id: `quest_mystery_${Date.now()}`,
      title: mystery.title,
      description: mystery.description,
      category: 'mystery',
      objectives: mystery.objectives.map((obj, index) => ({
        id: `obj_${index + 1}`,
        ...obj,
        completed: false,
        hidden: index > 0 // Hide later objectives
      })),
      currentObjectiveIndex: 0,
      rewards: [
        {
          type: 'knowledge',
          value: 2,
          description: 'Valuable insights gained',
          guaranteed: true
        },
        {
          type: 'reputation',
          value: 20,
          description: 'Investigator reputation +20',
          guaranteed: true
        },
        {
          type: 'quest_unlock',
          value: 'follow_up_mystery',
          description: 'Unlock follow-up investigation',
          guaranteed: false,
          chance: 0.5
        }
      ],
      startLocation: playerLocation,
      startTime: Date.now(),
      status: 'active',
      difficulty: 'hard',
      isProceduralQuest: true
    };
  }
  
  /**
   * Generate contextual rumor text
   */
  private generateRumorText(culturalZone: string, era: string): string {
    const rumors: Record<string, string[]> = {
      'EUROPEAN': [
        'ancient treasures hidden by fleeing nobles',
        'a forgotten chapel with healing waters',
        'the ghost of a fallen knight',
        'a cache of weapons from the old wars'
      ],
      'MENA': [
        'djinn trapped in ancient vessels',
        'scrolls of forgotten wisdom',
        'a merchant\'s lost fortune',
        'sacred texts hidden from invaders'
      ],
      'EAST_ASIAN': [
        'jade artifacts of immense value',
        'the tomb of an ancient general',
        'scrolls containing lost martial techniques',
        'a hidden shrine with mystical powers'
      ],
      'default': [
        'valuable artifacts',
        'hidden treasures',
        'ancient secrets',
        'forgotten knowledge'
      ]
    };
    
    const zoneRumors = rumors[culturalZone] || rumors['default'];
    return zoneRumors[Math.floor(Math.random() * zoneRumors.length)];
  }
  
  /**
   * Generate a culturally appropriate ruin name
   */
  private generateRuinName(culturalZone: string, era: string): string {
    const ruinNames: Record<string, string[]> = {
      'EUROPEAN': ['ruined castle', 'abandoned monastery', 'ancient fort', 'crumbling tower', 'forgotten chapel'],
      'MENA': ['ruined caravanserai', 'abandoned fortress', 'ancient temple', 'forgotten palace', 'desert ruins'],
      'EAST_ASIAN': ['ruined pagoda', 'abandoned temple', 'ancient shrine', 'forgotten palace', 'mountain monastery'],
      'SOUTH_ASIAN': ['ruined stupa', 'abandoned ashram', 'ancient temple', 'forgotten palace', 'jungle ruins'],
      'SUB_SAHARAN_AFRICAN': ['ruined settlement', 'abandoned village', 'ancient ritual site', 'forgotten palace', 'stone ruins'],
      'NORTH_AMERICAN_PRE_COLUMBIAN': ['ancient mound', 'abandoned settlement', 'sacred site', 'stone circle', 'cliff dwelling'],
      'SOUTH_AMERICAN': ['ruined pyramid', 'abandoned city', 'ancient temple', 'forgotten fortress', 'mountain ruins'],
      'OCEANIA': ['ancient marae', 'abandoned village', 'sacred site', 'stone platform', 'coastal ruins']
    };
    
    const names = ruinNames[culturalZone] || ruinNames['EUROPEAN'];
    return names[Math.floor(Math.random() * names.length)];
  }
  
  /**
   * Get cardinal direction from player to target
   */
  private getDirection(from: { x: number; y: number }, to: { x: number; y: number }): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    if (angle >= -22.5 && angle < 22.5) return 'east';
    if (angle >= 22.5 && angle < 67.5) return 'southeast';
    if (angle >= 67.5 && angle < 112.5) return 'south';
    if (angle >= 112.5 && angle < 157.5) return 'southwest';
    if (angle >= 157.5 || angle < -157.5) return 'west';
    if (angle >= -157.5 && angle < -112.5) return 'northwest';
    if (angle >= -112.5 && angle < -67.5) return 'north';
    return 'northeast';
  }

  /**
   * Get quest templates based on game mode
   */
  private getQuestTemplatesForMode(gameMode: string, culturalZone: string, era: string): any[] {
    const baseTemplates = {
      'Survival Mode': [
        {
          title: 'Find Shelter',
          description: 'Locate a safe place to rest and recover',
          type: 'exploration',
          objectiveType: 'visit_location',
          targetTypes: ['urban', 'farm', 'ruins'],
          rewards: [{ type: 'health', value: 20, description: 'Health +20' }]
        },
        {
          title: 'Gather Resources',
          description: 'Find essential supplies for survival',
          type: 'survival',
          objectiveType: 'visit_location',
          targetTypes: ['marketplace', 'farm'],
          rewards: [{ type: 'item', value: 'food', description: 'Food supplies' }]
        },
        {
          title: 'Seek Medical Aid',
          description: 'Find someone who can help with injuries',
          type: 'survival',
          objectiveType: 'talk_to_npc',
          targetTypes: ['urban', 'holy_site'],
          rewards: [{ type: 'health', value: 30, description: 'Full health restoration' }]
        }
      ],
      'Exploration Mode': [
        {
          title: 'Map the Region',
          description: 'Explore and document notable locations',
          type: 'exploration',
          objectiveType: 'visit_location',
          targetTypes: ['palace', 'holy_site', 'ruins'],
          rewards: [{ type: 'reputation', value: 15, description: 'Explorer reputation +15' }]
        },
        {
          title: 'Ancient Mysteries',
          description: 'Investigate mysterious ruins or monuments',
          type: 'exploration',
          objectiveType: 'visit_location',
          targetTypes: ['ruins', 'holy_site'],
          rewards: [{ type: 'knowledge', value: 1, description: 'Historical knowledge gained' }]
        },
        {
          title: 'Trade Routes',
          description: 'Discover active marketplaces and trade centers',
          type: 'exploration',
          objectiveType: 'visit_location',
          targetTypes: ['marketplace', 'urban'],
          rewards: [{ type: 'gold', value: 50, description: 'Trade rewards' }]
        }
      ],
      'Commerce Mode': [
        {
          title: 'First Trade',
          description: 'Complete your first successful trade transaction',
          type: 'trade',
          objectiveType: 'talk_to_npc',
          targetTypes: ['marketplace'],
          rewards: [{ type: 'gold', value: 100, description: 'Trading profit' }]
        },
        {
          title: 'Supply and Demand',
          description: 'Find goods in one location and sell them in another',
          type: 'trade',
          objectiveType: 'visit_location',
          targetTypes: ['marketplace', 'farm'],
          rewards: [{ type: 'reputation', value: 20, description: 'Merchant reputation +20' }]
        },
        {
          title: 'Establish Connections',
          description: 'Meet influential traders and merchants',
          type: 'social',
          objectiveType: 'talk_to_npc',
          targetTypes: ['marketplace', 'palace'],
          rewards: [{ type: 'connections', value: 1, description: 'New trade connections' }]
        }
      ],
      'Scholarship Mode': [
        {
          title: 'Seek Knowledge',
          description: 'Visit places of learning and wisdom',
          type: 'scholarship',
          objectiveType: 'visit_location',
          targetTypes: ['holy_site', 'palace', 'ruins'],
          rewards: [{ type: 'knowledge', value: 2, description: 'Academic insights' }]
        },
        {
          title: 'Interview Locals',
          description: 'Speak with knowledgeable individuals',
          type: 'scholarship',
          objectiveType: 'talk_to_npc',
          targetTypes: ['urban', 'holy_site'],
          rewards: [{ type: 'reputation', value: 10, description: 'Scholar reputation +10' }]
        },
        {
          title: 'Document Findings',
          description: 'Record observations at significant sites',
          type: 'scholarship',
          objectiveType: 'visit_location',
          targetTypes: ['ruins', 'palace'],
          rewards: [{ type: 'knowledge', value: 3, description: 'Research completed' }]
        }
      ],
      'Leadership Mode': [
        {
          title: 'Rally Support',
          description: 'Gain the trust of local communities',
          type: 'leadership',
          objectiveType: 'talk_to_npc',
          targetTypes: ['urban', 'farm'],
          rewards: [{ type: 'reputation', value: 25, description: 'Leadership reputation +25' }]
        },
        {
          title: 'Seat of Power',
          description: 'Visit the regional center of authority',
          type: 'leadership',
          objectiveType: 'visit_location',
          targetTypes: ['palace'],
          rewards: [{ type: 'influence', value: 1, description: 'Political influence gained' }]
        },
        {
          title: 'Unite the People',
          description: 'Connect scattered communities',
          type: 'leadership',
          objectiveType: 'visit_location',
          targetTypes: ['urban', 'farm', 'marketplace'],
          rewards: [{ type: 'followers', value: 5, description: 'New followers' }]
        }
      ],
      'Livelihood Mode': [
        {
          title: 'Find Work',
          description: 'Seek employment opportunities',
          type: 'livelihood',
          objectiveType: 'talk_to_npc',
          targetTypes: ['marketplace', 'farm', 'urban'],
          rewards: [{ type: 'gold', value: 30, description: 'First wages' }]
        },
        {
          title: 'Establish Yourself',
          description: 'Make a name for yourself in the community',
          type: 'livelihood',
          objectiveType: 'visit_location',
          targetTypes: ['urban', 'marketplace'],
          rewards: [{ type: 'reputation', value: 15, description: 'Local reputation +15' }]
        },
        {
          title: 'Daily Bread',
          description: 'Secure a steady source of income',
          type: 'livelihood',
          objectiveType: 'talk_to_npc',
          targetTypes: ['farm', 'marketplace'],
          rewards: [{ type: 'employment', value: 1, description: 'Steady employment' }]
        }
      ],
      'Diplomacy Mode': [
        {
          title: 'First Contact',
          description: 'Establish diplomatic relations',
          type: 'diplomacy',
          objectiveType: 'talk_to_npc',
          targetTypes: ['palace', 'urban'],
          rewards: [{ type: 'reputation', value: 20, description: 'Diplomatic reputation +20' }]
        },
        {
          title: 'Sacred Ground',
          description: 'Visit religious or cultural sites to show respect',
          type: 'diplomacy',
          objectiveType: 'visit_location',
          targetTypes: ['holy_site'],
          rewards: [{ type: 'cultural', value: 1, description: 'Cultural understanding' }]
        },
        {
          title: 'Trade Agreement',
          description: 'Negotiate beneficial trade terms',
          type: 'diplomacy',
          objectiveType: 'talk_to_npc',
          targetTypes: ['marketplace', 'palace'],
          rewards: [{ type: 'treaty', value: 1, description: 'Trade agreement secured' }]
        }
      ],
      'Legal Mode': [
        {
          title: 'Seek Justice',
          description: 'Find the local center of law and order',
          type: 'legal',
          objectiveType: 'visit_location',
          targetTypes: ['palace', 'urban'],
          rewards: [{ type: 'reputation', value: 15, description: 'Legal reputation +15' }]
        },
        {
          title: 'Witness Testimony',
          description: 'Gather information from locals',
          type: 'legal',
          objectiveType: 'talk_to_npc',
          targetTypes: ['urban', 'marketplace'],
          rewards: [{ type: 'evidence', value: 1, description: 'Evidence gathered' }]
        },
        {
          title: 'Court of Law',
          description: 'Present your case at the appropriate venue',
          type: 'legal',
          objectiveType: 'visit_location',
          targetTypes: ['palace'],
          rewards: [{ type: 'justice', value: 1, description: 'Justice served' }]
        }
      ]
    };

    // Get templates for the mode, or default to exploration
    const modeTemplates = baseTemplates[gameMode] || baseTemplates['Exploration Mode'];
    
    // Customize templates based on cultural zone and era
    return modeTemplates.map(template => {
      const customized = { ...template };
      
      // Add cultural flavor to titles and descriptions
      if (culturalZone === 'eastAsian' && template.type === 'trade') {
        customized.title = template.title.replace('Trade', 'Silk Road');
      } else if (culturalZone === 'mena' && template.type === 'scholarship') {
        customized.title = template.title.replace('Knowledge', 'Wisdom');
      } else if (culturalZone === 'european' && era === 'medieval' && template.type === 'leadership') {
        customized.title = template.title.replace('Power', 'Castle');
      }
      
      return customized;
    });
  }

  /**
   * Create a quest from a template
   */
  private createQuestFromTemplate(
    template: any,
    mapStructures: TerrainStructure[],
    playerLocation: { x: number; y: number },
    index: number
  ): Quest | null {
    // Find suitable target locations
    const validStructures = mapStructures.filter(s => 
      template.targetTypes.includes(s.type)
    );

    if (validStructures.length === 0) {
      console.warn('[QuestService] No valid structures for quest template:', template.title);
      return null;
    }

    // Sort by distance from player
    const sortedStructures = validStructures.sort((a, b) => {
      const distA = Math.sqrt(Math.pow(a.x - playerLocation.x, 2) + Math.pow(a.y - playerLocation.y, 2));
      const distB = Math.sqrt(Math.pow(b.x - playerLocation.x, 2) + Math.pow(b.y - playerLocation.y, 2));
      return distA - distB;
    });

    // Pick a structure that's not too close but not too far
    const idealDistance = 15 + (index * 10); // Stagger quest distances
    let targetStructure = sortedStructures[0];
    
    for (const structure of sortedStructures) {
      const dist = Math.sqrt(Math.pow(structure.x - playerLocation.x, 2) + Math.pow(structure.y - playerLocation.y, 2));
      if (dist >= idealDistance) {
        targetStructure = structure;
        break;
      }
    }

    // Create objective
    const objective: QuestObjective = {
      id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: template.objectiveType,
      description: `${template.objectiveType === 'visit_location' ? 'Travel to' : 'Interact at'} the ${targetStructure.type} to the ${this.getDirection(playerLocation, targetStructure)}`,
      targetLocation: {
        x: targetStructure.x,
        y: targetStructure.y,
        locationType: targetStructure.type
      },
      completed: false
    };

    // Create quest
    const quest: Quest = {
      id: `quest_${Date.now()}_${index}`,
      title: template.title,
      description: template.description,
      category: template.type,
      objectives: [objective],
      currentObjectiveIndex: 0,
      rewards: template.rewards || [],
      startLocation: playerLocation,
      startTime: Date.now(),
      status: 'active',
      isLLMGenerated: false // These are procedurally generated
    };

    return quest;
  }

}

// Export singleton instance
export const questService = new QuestService();