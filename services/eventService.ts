/**
 * Event Service
 * Core logic for the event system - handles triggering, resolution, and history
 */

import { 
  GameMode, 
  EventArchetype, 
  EventInstance, 
  EventOutcome,
  EventEffect,
  EventTrigger,
  EventContext,
  EventHistoryEntry,
  GameModeType,
  VictoryCondition,
  APIUsageStats,
  EventSettings
} from '../types/eventTypes';
import { PlayerCharacter } from '../types/playerCharacter';
import { MapTile } from '../types';
import { questService } from './questService';
import { Quest } from '../types/questTypes';

/**
 * Main event service class
 */
export class EventService {
  private currentMode: GameMode | null = null;
  private eventQueue: EventInstance[] = [];
  private eventHistory: EventHistoryEntry[] = [];
  private customEventArchetypes: EventArchetype[] = []; // Store LLM-generated events
  private llmHistory: Array<{ timestamp: number; input: string; output: string }> = [];
  private initialEventShown: boolean = false;
  private apiUsageStats: APIUsageStats = {
    totalCalls: 0,
    sessionCalls: 0
  };
  private settings: EventSettings = {
    frequency: 'moderate',
    historicalAccuracy: 'balanced',
    showRealOutcomes: 'on_completion',
    anachronismWarnings: true,
    autoPauseOnEvent: true
  };
  private lastEventTime: number = 0;
  private eventCooldown: number = 60000; // 1 minute minimum between events

  constructor() {
    // Load saved API usage stats from localStorage
    const savedStats = localStorage.getItem('eventApiUsage');
    if (savedStats) {
      this.apiUsageStats = JSON.parse(savedStats);
    }

    // Load saved settings
    const savedSettings = localStorage.getItem('eventSettings');
    if (savedSettings) {
      this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
    }
    
    // Load saved LLM history
    const savedHistory = localStorage.getItem('llmHistory');
    if (savedHistory) {
      try {
        this.llmHistory = JSON.parse(savedHistory);
      } catch (e) {
        console.error('Failed to load LLM history:', e);
        this.llmHistory = [];
      }
    }

    // Set cooldown based on frequency setting
    this.updateEventCooldown();
  }

  /**
   * Set the current game mode
   */
  setGameMode(mode: GameMode): void {
    this.currentMode = mode;
    console.log(`[EventService] Game mode set to: ${mode.name}`);
  }

  /**
   * Clear the current game mode (for new games)
   */
  clearGameMode(): void {
    this.currentMode = null;
    console.log(`[EventService] Game mode cleared`);
  }

  /**
   * Add disease-related events to the event system
   */
  addDiseaseEvents(): void {
    const diseaseEvents: EventArchetype[] = [
      {
        id: 'disease_outbreak_local',
        template: 'Reports reach you of [DISEASE] spreading through [LOCATION]. The local authorities are [RESPONSE].',
        triggers: [
          { type: 'time_based', condition: 'day % 20 == 0', probability: 0.15 },
          { type: 'near_location', condition: 'near_city', probability: 0.2 }
        ],
        variables: [
          { key: 'DISEASE', options: ['the plague', 'cholera', 'smallpox', 'typhus', 'dysentery', 'influenza'], contextual: true },
          { key: 'LOCATION', options: ['the market district', 'the poor quarters', 'nearby villages', 'the port area', 'the castle'], contextual: true },
          { key: 'RESPONSE', options: ['overwhelmed', 'organizing quarantine', 'calling for help', 'fleeing', 'denying the reports'] }
        ],
        outcomes: [
          {
            id: 'help_organize',
            buttonText: 'Help organize response',
            description: 'Assist in coordinating medical aid',
            effects: [
              { type: 'reputation', target: 'reputation', value: 15 },
              { type: 'fatigue', target: 'fatigue', value: -20 }
            ],
            weight: 1,
            statChecks: [{ stat: 'charisma', minimum: 11, description: 'Charisma 11+' }],
            historicalNote: 'Community response was crucial in containing disease outbreaks'
          },
          {
            id: 'investigate_source',
            buttonText: 'Investigate the source',
            description: 'Try to find the origin of the outbreak',
            effects: [
              { type: 'stat_change', target: 'intelligence', value: 1 },
              { type: 'health', target: 'health', value: -10 }
            ],
            weight: 1,
            statChecks: [{ stat: 'wisdom', minimum: 12, description: 'Wisdom 12+' }],
            historicalNote: 'Early epidemiologists often traced disease sources to prevent spread'
          },
          {
            id: 'avoid_area',
            buttonText: 'Avoid the affected area',
            description: 'Stay away from the outbreak zone',
            effects: [
              { type: 'reputation', target: 'reputation', value: -5 }
            ],
            weight: 1
          }
        ]
      },
      {
        id: 'diseased_traveler',
        template: 'A [TRAVELER_TYPE] approaches your camp, clearly suffering from [SYMPTOMS]. They beg for [REQUEST].',
        triggers: [
          { type: 'random', condition: 'true', probability: 0.1 }
        ],
        variables: [
          { key: 'TRAVELER_TYPE', options: ['merchant', 'pilgrim', 'refugee', 'soldier', 'peasant family'] },
          { key: 'SYMPTOMS', options: ['fever and chills', 'violent coughing', 'skin lesions', 'weakness and pallor', 'stomach distress'] },
          { key: 'REQUEST', options: ['food and water', 'shelter for the night', 'directions to a healer', 'medicine', 'help with burial'] }
        ],
        outcomes: [
          {
            id: 'help_traveler',
            buttonText: 'Help them',
            description: 'Provide aid despite the risk',
            effects: [
              { type: 'reputation', target: 'reputation', value: 10 },
              { type: 'health', target: 'health', value: -5 }
            ],
            weight: 1,
            historicalNote: 'Hospitality was a moral duty, even during dangerous times'
          },
          {
            id: 'careful_help',
            buttonText: 'Help cautiously',
            description: 'Provide aid while maintaining distance',
            effects: [
              { type: 'reputation', target: 'reputation', value: 5 }
            ],
            weight: 1,
            statChecks: [{ stat: 'wisdom', minimum: 10, description: 'Wisdom 10+' }]
          },
          {
            id: 'turn_away',
            buttonText: 'Turn them away',
            description: 'Refuse to risk exposure',
            effects: [
              { type: 'reputation', target: 'reputation', value: -10 }
            ],
            weight: 1
          }
        ]
      },
      {
        id: 'medical_discovery_opportunity',
        template: 'While treating [PATIENT], you notice [OBSERVATION]. This could lead to [POTENTIAL_DISCOVERY].',
        triggers: [
          { type: 'random', condition: 'true', probability: 0.05 },
          { type: 'profession_based', condition: 'healer', probability: 0.15 }
        ],
        variables: [
          { key: 'PATIENT', options: ['a sick child', 'an elderly person', 'a pregnant woman', 'a wounded soldier', 'a fellow healer'] },
          { key: 'OBSERVATION', options: ['an unusual recovery pattern', 'unexpected symptoms', 'a treatment working differently', 'a new combination of herbs showing promise'] },
          { key: 'POTENTIAL_DISCOVERY', options: ['a new remedy', 'better understanding of the disease', 'a preventive measure', 'an improved treatment method'] }
        ],
        outcomes: [
          {
            id: 'document_finding',
            buttonText: 'Carefully document this',
            description: 'Record your observations for future study',
            effects: [
              { type: 'stat_change', target: 'intelligence', value: 2 },
              { type: 'reputation', target: 'reputation', value: 10 }
            ],
            weight: 1,
            statChecks: [{ stat: 'intelligence', minimum: 13, description: 'Intelligence 13+' }],
            historicalNote: 'Medical documentation was crucial for advancing treatments'
          },
          {
            id: 'test_theory',
            buttonText: 'Test your theory',
            description: 'Experiment with this new approach',
            effects: [
              { type: 'stat_change', target: 'wisdom', value: 1 }
            ],
            weight: 1,
            statChecks: [{ stat: 'intelligence', minimum: 12, description: 'Intelligence 12+' }]
          },
          {
            id: 'ignore_discovery',
            buttonText: 'Focus on current patient',
            description: 'Prioritize immediate care',
            effects: [
              { type: 'health', target: 'patient_health', value: 20 }
            ],
            weight: 1
          }
        ]
      },
      {
        id: 'quarantine_decision',
        template: 'The local authorities ask you to help decide whether to implement [QUARANTINE_TYPE] for [AFFECTED_GROUP]. The disease appears to be [SEVERITY].',
        triggers: [
          { type: 'near_location', condition: 'near_city', probability: 0.1 },
          { type: 'time_based', condition: 'day % 25 == 0', probability: 0.12 }
        ],
        variables: [
          { key: 'QUARANTINE_TYPE', options: ['strict isolation', 'partial restrictions', 'voluntary isolation', 'mandatory reporting', 'trade barriers'] },
          { key: 'AFFECTED_GROUP', options: ['the entire district', 'travelers from affected areas', 'certain professions', 'all incoming ships', 'specific households'] },
          { key: 'SEVERITY', options: ['highly contagious', 'deadly but contained', 'spreading rapidly', 'mild but widespread', 'unknown in its effects'] }
        ],
        outcomes: [
          {
            id: 'recommend_strict',
            buttonText: 'Recommend strict measures',
            description: 'Advise maximum containment',
            effects: [
              { type: 'reputation', target: 'reputation', value: -10 },
              { type: 'health', target: 'community_health', value: 25 }
            ],
            weight: 1,
            historicalNote: 'Quarantine was one of the few effective tools against epidemic disease'
          },
          {
            id: 'recommend_moderate',
            buttonText: 'Suggest balanced approach',
            description: 'Balance health and economic concerns',
            effects: [
              { type: 'reputation', target: 'reputation', value: 5 }
            ],
            weight: 1,
            statChecks: [{ stat: 'wisdom', minimum: 11, description: 'Wisdom 11+' }]
          },
          {
            id: 'oppose_quarantine',
            buttonText: 'Oppose restrictions',
            description: 'Argue against quarantine measures',
            effects: [
              { type: 'reputation', target: 'reputation', value: 10 },
              { type: 'health', target: 'community_health', value: -15 }
            ],
            weight: 1
          }
        ]
      },
      {
        id: 'medicine_shortage_crisis',
        template: 'A critical shortage of [MEDICINE] has developed. [AFFECTED_GROUP] are suffering without treatment, and [ALTERNATIVE_SOURCE] might help.',
        triggers: [
          { type: 'random', condition: 'true', probability: 0.08 },
          { type: 'season_based', condition: 'winter', probability: 0.15 }
        ],
        variables: [
          { key: 'MEDICINE', options: ['willow bark', 'medicinal herbs', 'opium', 'mercury', 'imported spices', 'clean bandages'], contextual: true },
          { key: 'AFFECTED_GROUP', options: ['the elderly', 'children', 'pregnant women', 'wounded soldiers', 'the working poor'] },
          { key: 'ALTERNATIVE_SOURCE', options: ['distant traders', 'growing your own', 'substituting with local plants', 'negotiating with neighboring healers', 'rationing current supplies'] }
        ],
        outcomes: [
          {
            id: 'seek_alternatives',
            buttonText: 'Search for alternatives',
            description: 'Look for substitute medicines',
            effects: [
              { type: 'stat_change', target: 'wisdom', value: 1 },
              { type: 'fatigue', target: 'fatigue', value: -15 }
            ],
            weight: 1,
            statChecks: [{ stat: 'intelligence', minimum: 11, description: 'Intelligence 11+' }],
            historicalNote: 'Herbalists had to adapt when traditional medicines were unavailable'
          },
          {
            id: 'organize_expedition',
            buttonText: 'Organize supply expedition',
            description: 'Send people to find the needed medicine',
            effects: [
              { type: 'reputation', target: 'reputation', value: 15 }
            ],
            weight: 1,
            statChecks: [{ stat: 'charisma', minimum: 12, description: 'Charisma 12+' }]
          },
          {
            id: 'ration_supplies',
            buttonText: 'Ration existing supplies',
            description: 'Make current medicine last longer',
            effects: [
              { type: 'health', target: 'community_health', value: -10 }
            ],
            weight: 1
          }
        ]
      }
    ];

    // Add these events to the custom events array
    this.customEventArchetypes.push(...diseaseEvents);
    console.log(`[EventService] Added ${diseaseEvents.length} disease-related events`);
  }

  /**
   * Get current game mode
   */
  getGameMode(): GameMode | null {
    return this.currentMode;
  }

  /**
   * Check if any event triggers are met
   */
  checkTriggers(
    player: PlayerCharacter, 
    tile: MapTile, 
    gameTime: number,
    context: EventContext
  ): EventInstance | null {
    if (!this.currentMode) return null;

    // Check cooldown
    if (gameTime - this.lastEventTime < this.eventCooldown) {
      return null;
    }

    // Combine custom events with mode events
    const allArchetypes = [
      ...this.customEventArchetypes, // Check custom events first (higher priority)
      ...this.currentMode.eventArchetypes
    ];

    // Check each archetype's triggers with enhanced probability calculation
    for (const archetype of allArchetypes) {
      if (this.evaluateTriggers(archetype.triggers, player, tile, gameTime)) {
        // Import context service for probability calculation
        const { eventContextService } = require('./eventContextService');
        
        // Calculate context-aware probability
        const contextProbability = eventContextService.calculateEventProbability(archetype, context);
        
        // Apply probability check
        if (Math.random() < contextProbability) {
          // Generate an event instance from this archetype
          const event = this.generateEventInstance(archetype, context);
          this.lastEventTime = gameTime;
          return event;
        }
      }
    }

    return null;
  }

  /**
   * Evaluate if triggers are met
   */
  private evaluateTriggers(
    triggers: EventTrigger[],
    player: PlayerCharacter,
    tile: MapTile,
    gameTime: number
  ): boolean {
    for (const trigger of triggers) {
      let triggered = false;

      switch (trigger.type) {
        case 'always':
          triggered = true;
          break;
          
        case 'low_resource':
          // Check if any resource is low
          if (trigger.condition.includes('health')) {
            triggered = player.health < 30;
          } else if (trigger.condition.includes('fatigue')) {
            triggered = player.fatigue < 30;
          }
          break;

        case 'near_location':
          // Check if near a city or structure
          triggered = trigger.condition === 'near_city' && tile.structureType !== null;
          break;

        case 'time_based':
          // Evaluate time-based conditions
          if (trigger.condition.includes('day')) {
            const day = Math.floor(gameTime / (24 * 60 * 60 * 1000));
            triggered = eval(trigger.condition.replace('day', day.toString()));
          }
          break;

        case 'stat_check':
          // Check player stats
          const statMatch = trigger.condition.match(/(\w+)\s*([<>=]+)\s*(\d+)/);
          if (statMatch) {
            const [_, stat, operator, value] = statMatch;
            const playerStat = (player as any)[stat];
            if (playerStat !== undefined) {
              triggered = eval(`${playerStat} ${operator} ${value}`);
            }
          }
          break;

        case 'random':
          triggered = Math.random() < trigger.probability;
          break;
      }

      // Apply probability modifier
      if (triggered && Math.random() > trigger.probability) {
        triggered = false;
      }

      if (!triggered) return false;
    }

    return true;
  }

  /**
   * Generate an event instance from an archetype
   */
  private generateEventInstance(
    archetype: EventArchetype,
    context: EventContext
  ): EventInstance {
    // Fill in template variables based on context using enhanced system
    const filledDescription = this.fillTemplate(archetype.template, context);
    
    // Import context service for additional enhancements
    const { eventContextService } = require('./eventContextService');
    
    // Create base event instance
    const eventInstance: EventInstance = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      archetypeId: archetype.id,
      title: this.generateTitle(archetype.id),
      description: filledDescription,
      outcomes: archetype.outcomes.map(outcome => ({
        ...outcome,
        // Fill any template variables in outcome button text
        buttonText: this.fillTemplate(outcome.buttonText, context)
      })),
      timestamp: Date.now(),
      isLLMGenerated: false,
      historicalContext: eventContextService.getHistoricalContext(context, archetype.id),
      relatedSources: eventContextService.getRelevantSources(archetype.id, context)
    };
    
    // Enhance event with additional contextual details
    return eventContextService.enhanceEventWithContext(eventInstance, context);
  }

  /**
   * Fill template with context-appropriate variables using enhanced system
   */
  private fillTemplate(template: string, context: EventContext): string {
    // Import the enhanced template system
    const { fillTemplate: enhancedFillTemplate, getContextVariables: getEnhancedVariables } = require('../utils/eventTemplates');
    const { eventContextService } = require('./eventContextService');
    
    // Get comprehensive context variables
    const variables = getEnhancedVariables(context);
    
    // Use context service to filter and select appropriate variables
    const filteredVariables = eventContextService.selectContextualVariables(variables, context);
    
    // Fill template with enhanced variable system
    return enhancedFillTemplate(template, filteredVariables, context);
  }

  /**
   * Get variables based on historical context (now delegated to enhanced system)
   */
  private getContextVariables(context: EventContext): Record<string, string[]> {
    // Use the enhanced context variables from eventTemplates
    const { getContextVariables: getEnhancedVariables } = require('../utils/eventTemplates');
    return getEnhancedVariables(context);
  }

  /**
   * Generate a title for an event
   */
  private generateTitle(archetypeId: string): string {
    const titles: Record<string, string> = {
      'resource_crisis': 'Resource Shortage',
      'environmental_threat': 'Environmental Hazard',
      'health_emergency': 'Health Crisis',
      'discovery_opportunity': 'Discovery',
      'navigation_challenge': 'Obstacle Ahead',
      'local_encounter': 'Local Encounter',
      'market_opportunity': 'Market News',
      'competition': 'Business Competition',
      'work_challenge': 'Work Opportunity',
      'cultural_misunderstanding': 'Cultural Tension',
      'legal_dilemma': 'Legal Matter'
    };

    return titles[archetypeId] || 'Event';
  }

  /**
   * Resolve an event outcome
   */
  resolveOutcome(event: EventInstance, choiceIndex: number): EventEffect[] {
    const outcome = event.outcomes[choiceIndex];
    if (!outcome) return [];

    // Record in history
    this.eventHistory.push({
      event,
      choiceIndex,
      outcome,
      timestamp: Date.now()
    });

    // Save history to localStorage (keep last 50 events)
    const historyToSave = this.eventHistory.slice(-50);
    localStorage.setItem('eventHistory', JSON.stringify(historyToSave));

    return outcome.effects;
  }

  /**
   * Get victory progress for current mode
   */
  getVictoryProgress(): VictoryCondition[] {
    if (!this.currentMode) return [];
    return this.currentMode.victoryConditions;
  }

  /**
   * Update event cooldown based on frequency setting
   */
  private updateEventCooldown(): void {
    switch (this.settings.frequency) {
      case 'realistic':
        this.eventCooldown = 5 * 60000; // 5 minutes
        break;
      case 'moderate':
        this.eventCooldown = 2 * 60000; // 2 minutes
        break;
      case 'frequent':
        this.eventCooldown = 30000; // 30 seconds
        break;
    }
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<EventSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem('eventSettings', JSON.stringify(this.settings));
    this.updateEventCooldown();
  }

  /**
   * Get current settings
   */
  getSettings(): EventSettings {
    return this.settings;
  }

  /**
   * Track API usage
   */
  trackAPICall(input?: string, output?: string): void {
    this.apiUsageStats.totalCalls++;
    this.apiUsageStats.sessionCalls++;
    this.apiUsageStats.lastCallTimestamp = Date.now();
    
    // Estimate cost (rough estimate: $0.01 per call)
    this.apiUsageStats.costEstimate = this.apiUsageStats.totalCalls * 0.01;
    
    // Add to LLM history if input/output provided
    if (input && output) {
      this.llmHistory.unshift({
        timestamp: Date.now(),
        input,
        output
      });
      
      // Keep only last 10 entries
      if (this.llmHistory.length > 10) {
        this.llmHistory = this.llmHistory.slice(0, 10);
      }
      
      // Save to localStorage
      localStorage.setItem('llmHistory', JSON.stringify(this.llmHistory));
    }
    
    localStorage.setItem('eventApiUsage', JSON.stringify(this.apiUsageStats));
  }

  /**
   * Get API usage stats
   */
  getAPIUsageStats(): APIUsageStats {
    return this.apiUsageStats;
  }

  /**
   * Get LLM history
   */
  getLLMHistory(): Array<{ timestamp: number; input: string; output: string }> {
    return this.llmHistory;
  }

  /**
   * Export LLM history as text
   */
  exportLLMHistoryAsText(): string {
    if (this.llmHistory.length === 0) {
      return 'No LLM history available';
    }
    
    let text = 'LLM API Call History\n';
    text += '===================\n\n';
    
    this.llmHistory.forEach((entry, index) => {
      const date = new Date(entry.timestamp);
      text += `Call #${this.llmHistory.length - index}\n`;
      text += `Time: ${date.toLocaleString()}\n`;
      text += `\nINPUT:\n${entry.input}\n`;
      text += `\nOUTPUT:\n${entry.output}\n`;
      text += '\n-------------------\n\n';
    });
    
    return text;
  }

  /**
   * Reset session API calls
   */
  resetSessionCalls(): void {
    this.apiUsageStats.sessionCalls = 0;
  }

  /**
   * Get event history
   */
  getEventHistory(): EventHistoryEntry[] {
    return this.eventHistory;
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
    localStorage.removeItem('eventHistory');
  }

  /**
   * Set custom event archetypes (from LLM generation)
   */
  setCustomEventArchetypes(archetypes: EventArchetype[]): void {
    this.customEventArchetypes = archetypes;
    console.log(`[EventService] Set ${archetypes.length} custom event archetypes`);
  }

  /**
   * Get custom event archetypes
   */
  getCustomEventArchetypes(): EventArchetype[] {
    return this.customEventArchetypes;
  }

  /**
   * Clear custom events
   */
  clearCustomEvents(): void {
    this.customEventArchetypes = [];
  }

  /**
   * Generate initial event for game start and create quest from it
   */
  generateInitialEvent(
    context: EventContext, 
    isWorldWeaver: boolean = false,
    mapStructures?: any[],
    currentLocation?: { x: number; y: number }
  ): EventInstance | null {
    if (this.initialEventShown) {
      return null;
    }
    
    this.initialEventShown = true;
    
    let event: EventInstance | null = null;
    
    // For WorldWeaver scenarios, check if we have custom events
    if (isWorldWeaver && this.customEventArchetypes.length > 0) {
      // Use the first custom event as the initial event
      const archetype = this.customEventArchetypes[0];
      event = this.generateEventInstance(archetype, context);
    } else if (this.currentMode) {
      // For standard games, generate a welcome/orientation event
      const initialArchetype = this.currentMode.eventArchetypes.find(arch => 
        arch.triggers.some(t => t.type === 'always' || t.type === 'random')
      );
      
      if (initialArchetype) {
        event = this.generateEventInstance(initialArchetype, context);
      }
    }
    
    // Create a quest from this initial event if we have map data
    if (event && mapStructures && currentLocation) {
      const quest = questService.createQuestFromEvent(
        {
          title: event.title,
          description: event.description,
          choices: event.outcomes.map(o => ({
            text: o.buttonText,
            effects: o.effects?.map(e => `${e.type}:${e.value}`).join(',') || ''
          })),
          historicalBasis: event.historicalContext
        },
        mapStructures,
        currentLocation
      );
      
      if (quest) {
        console.log('[EventService] Created quest from initial event:', quest.title);
      }
    }
    
    return event;
  }

  /**
   * Check if initial event has been shown
   */
  hasShownInitialEvent(): boolean {
    return this.initialEventShown;
  }

  /**
   * Reset initial event flag (for new games)
   */
  resetInitialEventFlag(): void {
    this.initialEventShown = false;
  }
}

// Export singleton instance
export const eventService = new EventService();