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
import { HistoricalEra } from '../types/ambiance';
import { CulturalZone } from '../types/characterData';
import { GameModeType } from '../types/eventTypes';

export class QuestService {
  private activeQuests: Quest[] = [];
  private completedQuests: Quest[] = [];
  private questChains: QuestChain[] = [];
  private questMarkers: QuestMarker[] = [];
  private locationInteractions: Map<string, LocationInteraction> = new Map();

  constructor() {
    // Clear old placeholder quests on initialization
    this.clearPlaceholderQuests();
    
    // Load saved quests from localStorage
    const savedActive = localStorage.getItem('activeQuests');
    if (savedActive) {
      try {
        const quests = JSON.parse(savedActive);
        // Only keep LLM-generated quests
        this.activeQuests = quests.filter((quest: Quest) => quest.isLLMGenerated === true);
      } catch (e) {
        console.error('Failed to load active quests:', e);
      }
    }

    const savedCompleted = localStorage.getItem('completedQuests');
    if (savedCompleted) {
      try {
        const quests = JSON.parse(savedCompleted);
        // Only keep LLM-generated quests
        this.completedQuests = quests.filter((quest: Quest) => quest.isLLMGenerated === true);
      } catch (e) {
        console.error('Failed to load completed quests:', e);
      }
    }
  }

  /**
   * Clear placeholder/fake quests that might be in localStorage
   */
  private clearPlaceholderQuests(): void {
    try {
      const savedActive = localStorage.getItem('activeQuests');
      if (savedActive) {
        const quests = JSON.parse(savedActive);
        const placeholderQuests = quests.filter((quest: any) => 
          !quest.isLLMGenerated || 
          quest.title?.toLowerCase().includes('first sign') ||
          quest.title?.toLowerCase().includes('placeholder') ||
          quest.title?.toLowerCase().includes('test quest')
        );
        
        if (placeholderQuests.length > 0) {
          console.log(`[QuestService] Clearing ${placeholderQuests.length} placeholder quests`);
          // Remove placeholder quests and save clean list
          const cleanQuests = quests.filter((quest: any) => quest.isLLMGenerated === true);
          localStorage.setItem('activeQuests', JSON.stringify(cleanQuests));
        }
      }
    } catch (e) {
      console.error('Error clearing placeholder quests:', e);
      // If there's an error, clear all quests to start fresh
      localStorage.removeItem('activeQuests');
      localStorage.removeItem('completedQuests');
    }
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
      console.log('[QuestService] No structures found, generating wilderness locations');
      
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
   * Add a new quest
   */
  addQuest(quest: Quest): void {
    this.activeQuests.push(quest);
    this.saveQuests();
    console.log('[QuestService] Added quest:', quest.title);
    
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
   * Check if player is at a quest location
   */
  checkQuestProgress(playerX: number, playerY: number, interactionType?: string, structureType?: string): void {
    const tolerance = 5; // Increased tolerance to 5 tiles for better mobile/click detection

    this.activeQuests.forEach(quest => {
      if (quest.status !== 'active') return;

      const currentObj = quest.objectives[quest.currentObjectiveIndex];
      if (!currentObj || currentObj.completed) return;

      // Check if player is at the target location
      if (currentObj.targetLocation) {
        const distance = Math.sqrt(
          Math.pow(currentObj.targetLocation.x - playerX, 2) +
          Math.pow(currentObj.targetLocation.y - playerY, 2)
        );

        console.log(`[QuestService] Checking objective "${currentObj.description}" - Distance: ${distance.toFixed(1)}, Tolerance: ${tolerance}`);

        if (distance <= tolerance) {
          let canComplete = false;

          // Visit location quests - just need to be nearby
          if (currentObj.type === 'visit_location') {
            canComplete = true;
            console.log(`[QuestService] Visit location quest can complete at distance ${distance.toFixed(1)}`);
          }
          
          // NPC interaction quests - require explicit interaction trigger
          else if (currentObj.type === 'talk_to_npc' && interactionType === 'npc_interaction') {
            canComplete = true;
            console.log(`[QuestService] NPC interaction quest triggered`);
          }
          
          // Item delivery quests - require explicit delivery trigger
          else if (currentObj.type === 'deliver_item' && interactionType === 'item_delivery') {
            canComplete = true;
            console.log(`[QuestService] Item delivery quest triggered`);
          }

          if (canComplete) {
            console.log(`[QuestService] Completing objective: ${currentObj.description} at (${playerX}, ${playerY})`);
            this.completeObjective(quest.id, currentObj.id);
          }
        }
      }
    });
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
   * Complete a quest
   */
  private completeQuest(questId: string): void {
    const questIndex = this.activeQuests.findIndex(q => q.id === questId);
    if (questIndex === -1) return;

    const quest = this.activeQuests[questIndex];
    quest.status = 'completed';
    quest.completedTime = Date.now();

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
   * Process quest rewards using the loot service
   */
  private processQuestRewards(quest: Quest): {
    items: any[];
    otherRewards: any[];
    totalValue: number;
  } {
    // Get cultural zone and era from quest context
    const culturalZone = quest.culturalZone || 'EUROPEAN';
    const era = quest.era || 'MEDIEVAL';
    
    // Process rewards through loot service
    const rewardResult = lootService.processQuestRewards(
      quest.rewards,
      culturalZone,
      era
    );
    
    // Calculate total value
    const totalValue = rewardResult.items.reduce((sum, item) => sum + item.value, 0);
    
    // Emit reward event for UI notification
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('questRewardsReceived', {
        detail: {
          questTitle: quest.title,
          items: rewardResult.items,
          otherRewards: rewardResult.otherRewards,
          totalValue
        }
      }));
    }
    
    return {
      items: rewardResult.items,
      otherRewards: rewardResult.otherRewards,
      totalValue
    };
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
   * Get all completed quests
   */
  getCompletedQuests(): Quest[] {
    return this.completedQuests;
  }

  /**
   * Get quest markers for map display
   */
  getQuestMarkers(): QuestMarker[] {
    return this.questMarkers;
  }

  /**
   * Save quests to localStorage
   */
  private saveQuests(): void {
    localStorage.setItem('activeQuests', JSON.stringify(this.activeQuests));
    localStorage.setItem('completedQuests', JSON.stringify(this.completedQuests));
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
   */
  generateInitialQuests(
    gameMode: string,
    mapStructures: TerrainStructure[],
    playerLocation: { x: number; y: number },
    culturalZone: string,
    era: string,
    mapData?: any
  ): Quest[] {
    const quests: Quest[] = [];
    
    // Always generate 1-2 procedural quests based on nearby features
    const proceduralQuests = this.generateProceduralQuests(
      mapStructures,
      playerLocation,
      culturalZone,
      era,
      mapData
    );
    
    // Add the procedural quests first (guaranteed)
    proceduralQuests.forEach(quest => {
      if (quest) {
        quests.push(quest);
        this.addQuest(quest);
      }
    });
    
    // Then add mode-specific quests if we have room (max 3 total)
    if (quests.length < 3) {
      const questTemplates = this.getQuestTemplatesForMode(gameMode, culturalZone, era);
      const shuffled = questTemplates.sort(() => Math.random() - 0.5);
      const numModeQuests = Math.min(1, 3 - quests.length);
      const selectedTemplates = shuffled.slice(0, numModeQuests);
      
      selectedTemplates.forEach((template, index) => {
        const quest = this.createQuestFromTemplate(
          template,
          mapStructures,
          playerLocation,
          quests.length + index
        );
        if (quest) {
          quests.push(quest);
          this.addQuest(quest);
        }
      });
    }
    
    // Potentially start a quest chain based on game mode and context
    if (Math.random() < 0.3) { // 30% chance to start with a quest chain
      const availableChains = questChainService.getAvailableChains(culturalZone);
      if (availableChains.length > 0) {
        const chainTemplate = availableChains[Math.floor(Math.random() * availableChains.length)];
        const chain = questChainService.startQuestChain(
          chainTemplate.id,
          playerLocation,
          culturalZone,
          era as any
        );
        if (chain) {
          console.log('[QuestService] Started quest chain:', chain.name);
        }
      }
    }

    return quests;
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
    
    // Helper to get location from structure (handles different field names)
    const getStructureLocation = (s: TerrainStructure): { x: number; y: number } | null => {
      if (s.location) return s.location;
      if (s.x !== undefined && s.y !== undefined) return { x: s.x, y: s.y };
      return null;
    };
    
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