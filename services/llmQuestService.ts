/**
 * LLM Quest Service
 * Generates contextual, historically-grounded quests using Gemini Flash 2.5 Lite
 * Ensures merchants persist as NPCs on the map after meeting them
 */

import { GoogleGenAI, Type } from "@google/genai";
import { Quest, QuestObjective, QuestReward } from '../types/questTypes';
import { NpcEntity, PlayerCharacter, MapData, TerrainStructure } from '../types';
import { questService } from './questService';
import { eventService } from './eventService';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';

interface QuestContext {
  historicalPeriod: string;
  year: number;
  location: string;
  culturalZone: string;
  player: {
    name: string;
    profession: string;
    level: number;
    reputation: number;
    recentActions?: string[];
  };
  npc: {
    id: string;
    name: string;
    role: string;
    personality?: string;
    wealthLevel?: string;
    age: number;
  };
  availableLocations: {
    type: string;
    description: string;
    distance: number;
  }[];
  mapData: MapData;
}

interface RawQuestData {
  title: string;
  description: string;
  historicalContext: string;
  category: 'trade' | 'social' | 'mystery' | 'diplomatic' | 'survival' | 'exploration';
  objectives: {
    type: string;
    description: string;
    targetLocationType?: string;
    dialogue?: string;
    clues?: string[];
    requiresItem?: string;
    providesItem?: string;
  }[];
  rewards: {
    type: string;
    value: number;
    description: string;
  }[];
  narrativeBeats?: string[];
  specialInstructions?: string;
}

export interface MerchantMemory {
  playerId: string;
  firstMeeting: number;
  lastMeeting: number;
  questsGiven: string[];
  questsCompleted: string[];
  relationship: 'stranger' | 'acquaintance' | 'friend' | 'trusted' | 'rival';
  transactions: number;
  notes: string[];
}

class LLMQuestService {
  private genAI: GoogleGenAI | null = null;
  private merchantMemories: Map<string, MerchantMemory> = new Map();
  private persistedMerchants: Map<string, NpcEntity> = new Map();
  private questCache: Map<string, Quest> = new Map();
  private questGenerationInProgress: Set<string> = new Set();

  constructor() {
    // Use the same pattern as llmService.ts
    this.genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Load persisted merchants from localStorage
    this.loadPersistedMerchants();
    this.loadMerchantMemories();
  }

  /**
   * Generate a contextual quest for a merchant NPC
   */
  async generateContextualQuest(
    npc: NpcEntity,
    player: PlayerCharacter,
    mapData: MapData,
    availableStructures: TerrainStructure[],
    currentLocation: { x: number; y: number }
  ): Promise<Quest | null> {
    try {
      // Prevent duplicate generation requests
      const generationKey = `${npc.id}_${player.id}`;
      if (this.questGenerationInProgress.has(generationKey)) {
        console.log('[LLMQuestService] Quest generation already in progress for this NPC');
        return null;
      }
      
      // Build rich context
      const context = this.buildQuestContext(npc, player, mapData, availableStructures, currentLocation);
      
      // Check if we've already generated a quest for this NPC recently
      const cacheKey = `${npc.id}_${player.id}_${Math.floor(Date.now() / 3600000)}`; // Cache for 1 hour
      if (this.questCache.has(cacheKey)) {
        return this.questCache.get(cacheKey) || null;
      }
      
      // Clean old cache entries (keep only last 20)
      if (this.questCache.size > 20) {
        const firstKey = this.questCache.keys().next().value;
        this.questCache.delete(firstKey);
      }
      
      // Mark as in progress
      this.questGenerationInProgress.add(generationKey);
      
      // Generate quest via Gemini
      const rawQuest = await this.callGeminiWithSchema(context);
      
      if (!rawQuest) {
        console.warn('[LLMQuestService] No quest data returned from LLM');
        return null;
      }
      
      // Validate and fix quest for actual map
      const validatedQuest = await this.validateAndFixQuest(rawQuest, availableStructures, currentLocation);
      
      // Enrich with game-specific data
      const enrichedQuest = this.enrichQuest(validatedQuest, npc, currentLocation);
      
      // Cache the quest
      this.questCache.set(cacheKey, enrichedQuest);
      
      // DON'T persist merchant here - wait until quest is accepted
      // this.persistMerchant(npc, currentLocation);
      
      // Update merchant memory
      this.updateMerchantMemory(npc.id, player.id, enrichedQuest.id);
      
      // Clear in-progress flag
      this.questGenerationInProgress.delete(generationKey);
      
      return enrichedQuest;
    } catch (error) {
      console.error('[LLMQuestService] Error generating quest:', error);
      // Clear in-progress flag on error
      const generationKey = `${npc.id}_${player.id}`;
      this.questGenerationInProgress.delete(generationKey);
      return null;
    }
  }

  /**
   * Build rich context for quest generation
   */
  private buildQuestContext(
    npc: NpcEntity,
    player: PlayerCharacter,
    mapData: MapData,
    structures: TerrainStructure[],
    currentLocation: { x: number; y: number }
  ): QuestContext {
    const dateInfo = parseDateString(mapData.timeSlice || '1500');
    const culturalZone = mapLocationToCulture(mapData.continent || 'Europe', dateInfo.year);
    
    // Categorize available structures by type and distance
    const availableLocations = this.categorizeStructures(structures, currentLocation);
    
    // Get player's recent actions from event history
    const recentActions = this.getPlayerRecentActions();
    
    return {
      historicalPeriod: dateInfo.era,
      year: dateInfo.year,
      location: `${mapData.localArea || mapData.continent || 'Unknown'}`,
      culturalZone,
      player: {
        name: player.name,
        profession: player.profession || 'wanderer',
        level: player.level || 1,
        reputation: player.reputation || 0,
        recentActions
      },
      npc: {
        id: npc.id,
        name: npc.name,
        role: npc.role || 'merchant',
        personality: npc.personality,
        wealthLevel: npc.wealthLevel,
        age: npc.age
      },
      availableLocations,
      mapData
    };
  }

  /**
   * Call Gemini with strict JSON schema for quest generation
   */
  private async callGeminiWithSchema(context: QuestContext): Promise<RawQuestData | null> {
    // genAI is always initialized in constructor with process.env.API_KEY

    // Check merchant's memory for relationship context
    const memory = this.merchantMemories.get(context.npc.id);
    const relationshipContext = memory ? 
      `The merchant ${memory.relationship === 'stranger' ? 'has never met' : 
       memory.relationship === 'friend' ? 'knows and trusts' : 
       memory.relationship === 'rival' ? 'has a complicated history with' : 
       'is acquainted with'} ${context.player.name}.` : '';

    const prompt = `You are creating a quest for a historical simulation game set in ${context.year} ${context.location}.

HISTORICAL CONTEXT:
Period: ${context.historicalPeriod}
Year: ${context.year}
Location: ${context.location}
Cultural Zone: ${context.culturalZone}

PLAYER CHARACTER:
Name: ${context.player.name}
Profession: ${context.player.profession}
Level: ${context.player.level}
Reputation: ${context.player.reputation}
${context.player.recentActions?.length ? `Recent Actions: ${context.player.recentActions.join(', ')}` : ''}

NPC QUESTGIVER:
Name: ${context.npc.name}
Role: ${context.npc.role}
Age: ${context.npc.age}
${context.npc.personality ? `Personality: ${context.npc.personality}` : ''}
${context.npc.wealthLevel ? `Wealth: ${context.npc.wealthLevel}` : ''}
${relationshipContext}

AVAILABLE LOCATIONS (by distance):
${context.availableLocations.map(loc => `- ${loc.type} (${loc.distance} tiles away): ${loc.description}`).join('\n')}

Create a unique, historically-grounded quest that:
1. Reflects ${context.npc.name}'s personality, role, and economic status
2. Is deeply rooted in the historical realities of ${context.year} ${context.location}
3. Uses ONLY the available location types listed above
4. Has 2-4 objectives that tell a compelling story
5. Reflects real concerns of a ${context.npc.role} in this period

Focus on historically authentic scenarios like:
- Trade disputes or opportunities specific to ${context.year}
- Local political tensions of the era
- Economic challenges (inflation, scarcity, new trade routes)
- Social conflicts between classes or cultures
- Religious or cultural obligations
- Family or guild matters
- Historical events happening nearby

The quest should feel personal to ${context.npc.name} while being historically accurate.
DO NOT create generic fetch quests. Create quests with moral complexity and historical authenticity.`;

    try {
      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1200,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Quest title, specific to the NPC" },
              description: { type: Type.STRING, description: "Detailed quest description with historical context" },
              historicalContext: { type: Type.STRING, description: "Brief historical background" },
              category: { 
                type: Type.STRING, 
                enum: ['trade', 'social', 'mystery', 'diplomatic', 'survival', 'exploration'],
                description: "Quest category"
              },
              objectives: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { 
                      type: Type.STRING,
                      enum: ['visit_location', 'talk_to_npc', 'investigate', 'gather_information', 'make_choice', 'deliver_item', 'collect_item'],
                      description: "Objective type"
                    },
                    description: { type: Type.STRING, description: "What the player needs to do" },
                    targetLocationType: { 
                      type: Type.STRING,
                      enum: ['marketplace', 'palace', 'holy_site', 'urban', 'ruins', 'farm', 'hamlet', 'bridge', 'mill', 'fortress', 'any'],
                      description: "Type of location to visit"
                    },
                    dialogue: { type: Type.STRING, description: "Optional: What NPC says at this stage" },
                    requiresItem: { type: Type.STRING, description: "Optional: Item needed" },
                    providesItem: { type: Type.STRING, description: "Optional: Item given" }
                  },
                  required: ['type', 'description']
                }
              },
              rewards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { 
                      type: Type.STRING,
                      enum: ['currency', 'reputation', 'item', 'knowledge', 'relationship'],
                      description: "Reward type" 
                    },
                    value: { type: Type.NUMBER, description: "Reward amount or quantity" },
                    description: { type: Type.STRING, description: "Description of the reward" }
                  },
                  required: ['type', 'value', 'description']
                }
              },
              narrativeBeats: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Story progression points"
              },
              specialInstructions: { 
                type: Type.STRING, 
                description: "Special mechanics or notes for this quest" 
              }
            },
            required: ['title', 'description', 'category', 'objectives', 'rewards']
          }
        }
      });

      // When using responseMimeType: "application/json" with schema, 
      // the response should already be parsed JSON
      let questData: RawQuestData;
      
      if (typeof result.text === 'string') {
        // If it's a string, try to parse it
        try {
          // Clean up response if it contains markdown formatting
          let cleanedResponse = result.text;
          
          // Remove markdown code blocks if present
          cleanedResponse = cleanedResponse.replace(/```json\s*/g, '');
          cleanedResponse = cleanedResponse.replace(/```\s*/g, '');
          
          // Remove any leading markdown headers
          cleanedResponse = cleanedResponse.replace(/^#+\s+.*$/gm, '');
          
          // Trim whitespace
          cleanedResponse = cleanedResponse.trim();
          
          // Find the first { and last } to extract JSON
          const jsonStart = cleanedResponse.indexOf('{');
          const jsonEnd = cleanedResponse.lastIndexOf('}');
          
          if (jsonStart !== -1 && jsonEnd !== -1) {
            cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
          }
          
          questData = JSON.parse(cleanedResponse) as RawQuestData;
          
          // Track API call
          eventService.trackAPICall(prompt, cleanedResponse);
        } catch (parseError) {
          console.error('[LLMQuestService] Failed to parse response:', result.text);
          throw parseError;
        }
      } else {
        // Response is already parsed
        questData = result.text as unknown as RawQuestData;
        
        // Track API call
        eventService.trackAPICall(prompt, JSON.stringify(questData));
      }
      
      return questData;
    } catch (error) {
      console.error('[LLMQuestService] Gemini API error:', error);
      return null;
    }
  }

  /**
   * Validate and fix quest to work with actual map
   */
  private validateAndFixQuest(
    rawQuest: RawQuestData,
    structures: TerrainStructure[],
    currentLocation: { x: number; y: number }
  ): Promise<Quest> {
    const objectives: QuestObjective[] = [];
    
    for (let i = 0; i < rawQuest.objectives.length; i++) {
      const rawObj = rawQuest.objectives[i];
      const objective: QuestObjective = {
        id: `obj_${Date.now()}_${i}`,
        type: rawObj.type as any,
        description: rawObj.description,
        completed: false,
        hidden: i > 0, // Hide later objectives initially
        optional: false
      };
      
      // Match location-based objectives to real structures
      if (rawObj.targetLocationType && rawObj.targetLocationType !== 'any') {
        const matching = structures.filter(s => 
          this.structureMatchesType(s, rawObj.targetLocationType!)
        );
        
        if (matching.length > 0) {
          // Sort by distance and pick appropriate one
          const sorted = matching.sort((a, b) => {
            const distA = Math.sqrt(Math.pow((a.x || 0) - currentLocation.x, 2) + 
                                   Math.pow((a.y || 0) - currentLocation.y, 2));
            const distB = Math.sqrt(Math.pow((b.x || 0) - currentLocation.x, 2) + 
                                   Math.pow((b.y || 0) - currentLocation.y, 2));
            return distA - distB;
          });
          
          // Pick not the closest but a reasonable distance (5-20 tiles)
          const target = sorted.find(s => {
            const dist = Math.sqrt(Math.pow((s.x || 0) - currentLocation.x, 2) + 
                                  Math.pow((s.y || 0) - currentLocation.y, 2));
            return dist >= 5 && dist <= 20;
          }) || sorted[0];
          
          objective.targetLocation = {
            x: target.x || currentLocation.x + 10,
            y: target.y || currentLocation.y + 10,
            locationType: rawObj.targetLocationType as any
          };
        } else {
          // Fallback to wilderness location
          const angle = Math.random() * Math.PI * 2;
          const distance = 8 + Math.random() * 12;
          objective.targetLocation = {
            x: Math.round(currentLocation.x + Math.cos(angle) * distance),
            y: Math.round(currentLocation.y + Math.sin(angle) * distance)
          };
          objective.type = 'explore_area';
        }
      }
      
      // Handle item requirements
      if (rawObj.requiresItem) {
        objective.targetItem = rawObj.requiresItem;
      }
      
      objectives.push(objective);
    }
    
    // Convert rewards
    const rewards: QuestReward[] = rawQuest.rewards.map(r => ({
      type: r.type as any,
      value: r.value,
      description: r.description,
      guaranteed: true
    }));
    
    // Add merchant relationship reward
    rewards.push({
      type: 'relationship',
      value: 1,
      description: `Improved relationship with ${rawQuest.title.includes("'s") ? rawQuest.title.split("'s")[0] : 'the merchant'}`,
      guaranteed: true
    });
    
    return {
      id: `quest_llm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: rawQuest.title,
      description: rawQuest.description,
      category: rawQuest.category,
      objectives,
      currentObjectiveIndex: 0,
      rewards,
      startTime: Date.now(),
      status: 'active',
      historicalContext: rawQuest.historicalContext,
      isLLMGenerated: true,
      difficulty: this.assessDifficulty(objectives, rewards)
    };
  }

  /**
   * Enrich quest with additional game data
   */
  private enrichQuest(quest: Quest, npc: NpcEntity, location: { x: number; y: number }): Quest {
    return {
      ...quest,
      giver: npc.name,
      giverLocation: location,
      startLocation: location,
      dialogueOptions: this.generateDialogueOptions(quest, npc),
      culturalZone: npc.culturalContext || 'european',
      era: npc.era || 'medieval'
    };
  }

  /**
   * Persist merchant to appear on specific map
   * Should be called when quest is ACCEPTED, not when generated
   */
  persistMerchant(npc: NpcEntity, marketLocation: { x: number; y: number }, mapSeed: number): void {
    // Set merchant to wander near the marketplace
    const persistedNpc: NpcEntity = {
      ...npc,
      x: marketLocation.x + Math.floor(Math.random() * 6 - 3),
      y: marketLocation.y + Math.floor(Math.random() * 6 - 3),
      wanderRadius: 10, // Stay near marketplace
      isPersistent: true,
      homeLocation: marketLocation,
      behaviorMode: 'merchant_wandering',
      dialogueMemory: [],
      mapSeed // Track which map this merchant belongs to
    };

    // Store using map-specific key
    const mapKey = `${npc.id}_${mapSeed}`;
    this.persistedMerchants.set(mapKey, persistedNpc);
    this.savePersistedMerchants();

    // Dispatch event to add NPC to map
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('merchantPersisted', {
        detail: { npc: persistedNpc, mapSeed }
      }));
    }
  }

  /**
   * Update merchant's memory of interactions
   */
  updateMerchantMemory(npcId: string, playerId: string, questId: string, completed: boolean = false): void {
    let memory = this.merchantMemories.get(npcId);
    
    if (!memory) {
      memory = {
        playerId,
        firstMeeting: Date.now(),
        lastMeeting: Date.now(),
        questsGiven: [questId],
        questsCompleted: [],
        relationship: 'acquaintance',
        transactions: 0,
        notes: [`First met ${new Date().toLocaleDateString()}`]
      };
    } else {
      memory.lastMeeting = Date.now();
      if (!memory.questsGiven.includes(questId)) {
        memory.questsGiven.push(questId);
      }
      
      if (completed && !memory.questsCompleted.includes(questId)) {
        memory.questsCompleted.push(questId);
        memory.transactions++;
      }
      
      // Upgrade relationship based on interactions
      if (memory.questsGiven.length >= 3 && memory.relationship === 'acquaintance') {
        memory.relationship = 'friend';
      } else if (memory.questsCompleted.length >= 2 && memory.relationship === 'friend') {
        memory.relationship = 'trusted';
      }
    }
    
    this.merchantMemories.set(npcId, memory);
    this.saveMerchantMemories();
  }

  /**
   * Check if merchant recognizes player
   */
  getMerchantMemory(npcId: string, playerId: string): MerchantMemory | null {
    const memory = this.merchantMemories.get(npcId);
    return memory && memory.playerId === playerId ? memory : null;
  }

  /**
   * Get persisted merchants for specific map
   */
  getPersistedMerchants(mapSeed?: number): NpcEntity[] {
    if (!mapSeed) {
      // Return all merchants if no map seed specified (for backwards compatibility)
      return Array.from(this.persistedMerchants.values());
    }

    // Return only merchants for the specified map
    const merchantsForMap: NpcEntity[] = [];
    for (const [key, merchant] of this.persistedMerchants.entries()) {
      if (merchant.mapSeed === mapSeed) {
        merchantsForMap.push(merchant);
      }
    }
    return merchantsForMap;
  }

  /**
   * Clear persisted merchants for a specific map
   */
  clearPersistedMerchantsForMap(mapSeed: number): void {
    const keysToRemove: string[] = [];
    for (const [key, merchant] of this.persistedMerchants.entries()) {
      if (merchant.mapSeed === mapSeed) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      this.persistedMerchants.delete(key);
    }

    if (keysToRemove.length > 0) {
      this.savePersistedMerchants();
      console.log(`[LLMQuestService] Cleared ${keysToRemove.length} merchants for map ${mapSeed}`);
    }
  }

  /**
   * Clear all persisted merchants
   */
  clearAllPersistedMerchants(): void {
    this.persistedMerchants.clear();
    this.savePersistedMerchants();
    console.log('[LLMQuestService] Cleared all persisted merchants');
  }

  /**
   * Helper: Categorize structures by type and distance
   */
  private categorizeStructures(
    structures: TerrainStructure[],
    currentLocation: { x: number; y: number }
  ): { type: string; description: string; distance: number }[] {
    const categorized: Map<string, { description: string; distance: number }> = new Map();
    
    structures.forEach(s => {
      const type = s.type || s.structureType || 'unknown';
      const distance = Math.round(Math.sqrt(
        Math.pow((s.x || 0) - currentLocation.x, 2) + 
        Math.pow((s.y || 0) - currentLocation.y, 2)
      ));
      
      if (!categorized.has(type) || categorized.get(type)!.distance > distance) {
        categorized.set(type, {
          description: this.describeStructureType(type, s.name),
          distance
        });
      }
    });
    
    return Array.from(categorized.entries()).map(([type, data]) => ({
      type,
      ...data
    })).sort((a, b) => a.distance - b.distance);
  }

  /**
   * Helper: Describe structure type
   */
  private describeStructureType(type: string, name?: string): string {
    const descriptions: Record<string, string> = {
      marketplace: 'A bustling marketplace with various traders',
      palace: 'The seat of local authority',
      holy_site: 'A sacred place of worship',
      urban: 'A populated settlement',
      ruins: 'Ancient abandoned structures',
      farm: 'Agricultural lands',
      hamlet: 'A small village',
      bridge: 'A river crossing',
      mill: 'A grain processing facility',
      fortress: 'A military stronghold'
    };
    
    return name || descriptions[type] || `A ${type}`;
  }

  /**
   * Helper: Check if structure matches type
   */
  private structureMatchesType(structure: TerrainStructure, targetType: string): boolean {
    const structureType = structure.type || structure.structureType || '';
    
    if (structureType === targetType) return true;
    
    // Handle name-based matching
    if (targetType === 'hamlet' && structure.name?.toLowerCase().includes('hamlet')) return true;
    if (targetType === 'mill' && structure.name?.toLowerCase().includes('mill')) return true;
    if (targetType === 'fortress' && structure.name?.toLowerCase().includes('base')) return true;
    
    return false;
  }

  /**
   * Helper: Get player's recent actions
   */
  private getPlayerRecentActions(): string[] {
    // This would pull from event history
    return [];
  }

  /**
   * Helper: Assess quest difficulty
   */
  private assessDifficulty(objectives: QuestObjective[], rewards: QuestReward[]): 'easy' | 'medium' | 'hard' {
    const totalDistance = objectives.reduce((sum, obj) => {
      if (obj.targetLocation) {
        return sum + 10; // Rough estimate
      }
      return sum;
    }, 0);
    
    if (totalDistance < 20 && objectives.length <= 2) return 'easy';
    if (totalDistance > 40 || objectives.length >= 4) return 'hard';
    return 'medium';
  }

  /**
   * Helper: Generate dialogue options
   */
  private generateDialogueOptions(quest: Quest, npc: NpcEntity): any[] {
    return [
      {
        trigger: 'on_start',
        text: `Ah, ${quest.title.includes('help') ? "I'm glad you're willing to help" : "I have something important to discuss"}.`,
        npcId: npc.id
      },
      {
        trigger: 'on_progress',
        text: `How goes the task? ${quest.objectives[0].description}`,
        npcId: npc.id
      },
      {
        trigger: 'on_complete',
        text: `Excellent work! You've proven yourself most capable.`,
        npcId: npc.id
      }
    ];
  }

  /**
   * Save/Load persistence
   */
  private savePersistedMerchants(): void {
    const data = Array.from(this.persistedMerchants.entries());
    localStorage.setItem('uhs_persisted_merchants', JSON.stringify(data));
  }

  private loadPersistedMerchants(): void {
    // Try new key first
    let saved = localStorage.getItem('uhs_persisted_merchants');

    // Migration: check old key and migrate data
    if (!saved) {
      const oldSaved = localStorage.getItem('persistedMerchants');
      if (oldSaved) {
        console.log('[LLMQuestService] Migrating persisted merchants from old storage format');
        // Clear old data - it was global and causing the bug
        localStorage.removeItem('persistedMerchants');
        console.log('[LLMQuestService] Cleared old global merchant data');
        // Don't migrate - let fresh location-specific data be generated
        return;
      }
    }

    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.persistedMerchants = new Map(data);
        console.log(`[LLMQuestService] Loaded ${this.persistedMerchants.size} persisted merchants`);
      } catch (e) {
        console.error('Failed to load persisted merchants:', e);
      }
    }
  }

  private saveMerchantMemories(): void {
    const data = Array.from(this.merchantMemories.entries());
    localStorage.setItem('merchantMemories', JSON.stringify(data));
  }

  private loadMerchantMemories(): void {
    const saved = localStorage.getItem('merchantMemories');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.merchantMemories = new Map(data);
      } catch (e) {
        console.error('Failed to load merchant memories:', e);
      }
    }
  }
}

// Export singleton instance
export const llmQuestService = new LLMQuestService();