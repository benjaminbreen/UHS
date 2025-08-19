/**
 * Event Context Service
 * Provides context-aware event generation based on game state
 */

import { EventContext, EventInstance, EventArchetype } from '../types/eventTypes';
import { PlayerCharacter } from '../types/playerCharacter';
import { MapTile, BiomeType } from '../types';
import { HistoricalEra } from '../constants/historicalEras';
import { CulturalZone } from '../constants/geography';
import { fillTemplate, getContextVariables, generateEventDescription } from '../utils/eventTemplates';
import { getSeasonFromDate } from '../utils/dateUtils';
import { GameDate } from '../types';

/**
 * Service for managing event context and generation
 * Provides sophisticated context-aware event generation with historical accuracy
 */
export class EventContextService {
  /**
   * Build event context from game state
   */
  buildContext(
    player: PlayerCharacter,
    tile: MapTile,
    gameDate: GameDate,
    culturalZone: CulturalZone
  ): EventContext {
    return {
      era: this.getEraFromPlayer(player),
      culturalZone,
      biome: tile.biome,
      season: getSeasonFromDate(gameDate),
      nearCity: this.isNearCity(tile),
      playerWealth: this.getWealthLevel(player),
      playerProfession: player.occupation
    };
  }

  /**
   * Get historical era from player or year
   */
  private getEraFromPlayer(player: PlayerCharacter): HistoricalEra {
    // If player has explicit era, use it
    if (player.historicalEra) {
      return player.historicalEra;
    }
    
    // Otherwise, derive from year if available
    const year = player.year || 1000;
    
    if (year < -3000) return 'ancient' as HistoricalEra;
    if (year < 500) return 'ancient' as HistoricalEra;
    if (year < 1453) return 'medieval' as HistoricalEra;
    if (year < 1800) return 'earlyModern' as HistoricalEra;
    return 'modern' as HistoricalEra;
  }

  /**
   * Check if tile is near a city
   */
  private isNearCity(tile: MapTile): boolean {
    return tile.structureType === 'urban' || 
           tile.structureType === 'palace' ||
           tile.structureType === 'marketplace';
  }

  /**
   * Determine player wealth level
   */
  private getWealthLevel(player: PlayerCharacter): 'poor' | 'modest' | 'wealthy' {
    const inventory = player.inventory || [];
    
    // Count valuable items
    const valuableCount = inventory.filter(item => 
      item.type === 'valuable' ||
      item.name?.toLowerCase().includes('gold') ||
      item.name?.toLowerCase().includes('silver') ||
      item.name?.toLowerCase().includes('jewel')
    ).length;
    
    // Simple wealth calculation
    if (valuableCount >= 5 || inventory.length > 30) return 'wealthy';
    if (valuableCount >= 1 || inventory.length > 10) return 'modest';
    return 'poor';
  }

  /**
   * Enhance event with contextual details
   */
  enhanceEventWithContext(
    event: EventInstance,
    context: EventContext
  ): EventInstance {
    // Get context-specific variables
    const variables = getContextVariables(context);
    
    // Replace any remaining template variables in description
    if (event.description.includes('[')) {
      event.description = fillTemplate(event.description, variables);
    }
    
    // Enhance outcome button text with context
    event.outcomes = event.outcomes.map(outcome => {
      if (outcome.buttonText.includes('[')) {
        outcome.buttonText = fillTemplate(outcome.buttonText, variables);
      }
      return outcome;
    });
    
    return event;
  }

  /**
   * Get historical context string for education
   */
  getHistoricalContext(
    context: EventContext,
    eventType: string
  ): string {
    const era = context.era;
    const zone = context.culturalZone;
    
    // Build educational context based on era and event type
    const contextMap: Record<string, Record<string, string>> = {
      'resource_crisis': {
        'medieval_european': 'During the medieval period, most Europeans lived at subsistence level. A single bad harvest could mean starvation, and communities had few safety nets beyond church charity.',
        'ancient_eastAsian': 'Ancient Chinese dynasties maintained granaries to prevent famine, but local officials often sold the grain for profit, leaving peasants vulnerable.',
        'medieval_mena': 'Islamic law required wealthy Muslims to give zakat (charity) to the poor, creating a social safety net that was advanced for its time.',
        'default': 'Throughout history, resource scarcity has been the norm rather than the exception for most people.'
      },
      'trade': {
        'medieval_european': 'Medieval European trade was dominated by guilds that controlled prices, quality, and who could practice trades. Breaking guild rules meant economic ruin.',
        'ancient_mediterranean': 'Mediterranean trade networks were sophisticated, with standard weights, measures, and even credit systems dating back to ancient times.',
        'earlyModern_global': 'The first global trade networks emerged in the 1500s, bringing unprecedented wealth but also exploitation and disease.',
        'default': 'Trade has always involved trust, reputation, and complex social relationships beyond simple exchange.'
      },
      'health': {
        'medieval': 'Medieval medicine was based on humoral theory - balancing blood, phlegm, yellow and black bile. Most treatments were ineffective or harmful.',
        'ancient': 'Ancient civilizations had surprising medical knowledge - surgery, dentistry, and herbal remedies - but no understanding of germs.',
        'earlyModern': 'The Scientific Revolution began transforming medicine, but most people still relied on folk healers and home remedies.',
        'modern': 'Modern medicine emerged rapidly after the discovery of germs, but access remained limited by class and location.',
        'default': 'Before modern medicine, most people faced illness with prayer, folk remedies, and resignation to fate.'
      }
    };
    
    // Find matching context
    const eventContexts = contextMap[eventType] || contextMap['default'] || {};
    const key = `${era}_${zone}`;
    
    return eventContexts[key] || 
           eventContexts[era] || 
           eventContexts['default'] || 
           'Historical events were shaped by the constraints and possibilities of their time.';
  }

  /**
   * Validate historical accuracy of an event
   */
  validateHistoricalAccuracy(
    event: EventInstance,
    context: EventContext
  ): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for anachronisms in description
    const anachronisms = this.checkAnachronisms(event.description, context.era);
    issues.push(...anachronisms);
    
    // Validate that outcomes make sense for the era
    event.outcomes.forEach(outcome => {
      const outcomeIssues = this.checkAnachronisms(outcome.buttonText, context.era);
      issues.push(...outcomeIssues);
    });
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Check for anachronistic terms or concepts
   */
  private checkAnachronisms(text: string, era: HistoricalEra): string[] {
    const issues: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Define anachronistic terms by era
    const anachronisms: Record<string, string[]> = {
      'ancient': ['gun', 'cannon', 'printing', 'compass', 'paper money', 'university'],
      'medieval': ['gun', 'printing press', 'telescope', 'democracy', 'capitalism'],
      'earlyModern': ['electricity', 'railroad', 'telegraph', 'photograph', 'airplane'],
    };
    
    // Check for anachronistic terms
    const problematicTerms = anachronisms[era] || [];
    problematicTerms.forEach(term => {
      if (lowerText.includes(term)) {
        issues.push(`Term "${term}" is anachronistic for ${era} era`);
      }
    });
    
    return issues;
  }

  /**
   * Get relevant primary sources for an event
   */
  getRelevantSources(
    eventType: string,
    context: EventContext
  ): string[] {
    // This would connect to the primary source system
    // For now, return placeholder source references
    const sources: Record<string, string[]> = {
      'plague': [
        'Chronicle of the Black Death - Agnolo di Tura',
        'The Decameron - Boccaccio',
        'Papal Bull of Pope Clement VI'
      ],
      'trade': [
        'The Travels of Marco Polo',
        'Merchant Handbook of Pegolotti',
        'Hanseatic League Records'
      ],
      'famine': [
        'Irish Famine Reports - 1847',
        'Chronicle of the Great Famine - John of Reading',
        'Chinese Famine Stele Inscriptions'
      ]
    };
    
    // Find relevant sources based on event keywords
    for (const [key, sourcelist] of Object.entries(sources)) {
      if (eventType.toLowerCase().includes(key)) {
        return sourcelist;
      }
    }
    
    return [];
  }

  /**
   * Calculate event probability based on context
   */
  calculateEventProbability(
    archetype: EventArchetype,
    context: EventContext
  ): number {
    let probability = 0.3; // Base probability (lowered for more realistic frequency)
    
    // Trade-related events
    if (archetype.id.includes('trade') || archetype.id.includes('market')) {
      if (context.nearCity) probability += 0.3;
      if (context.playerWealth === 'wealthy') probability += 0.2;
      if (context.season === 'summer' || context.season === 'autumn') probability += 0.1;
    }
    
    // Resource crisis events
    if (archetype.id.includes('resource') || archetype.id.includes('crisis')) {
      if (context.playerWealth === 'poor') probability += 0.4;
      if (context.season === 'winter') probability += 0.2;
      if (context.season === 'spring') probability += 0.1; // Food stores low before harvest
    }
    
    // Health-related events
    if (archetype.id.includes('health') || archetype.id.includes('illness')) {
      if (context.season === 'winter') probability += 0.2;
      if (context.season === 'summer') probability += 0.1; // Disease spreads faster in heat
      if (context.playerWealth === 'poor') probability += 0.2;
    }
    
    // Work/profession events
    if (archetype.id.includes('work') || archetype.id.includes('professional')) {
      if (context.playerProfession) probability += 0.2;
      if (context.season === 'summer' || context.season === 'autumn') probability += 0.1; // Busy seasons
    }
    
    // Exploration events
    if (archetype.id.includes('discovery') || archetype.id.includes('exploration')) {
      if (!context.nearCity) probability += 0.2; // More likely in wilderness
      if (context.season === 'spring' || context.season === 'summer') probability += 0.2;
    }
    
    // Biome-specific adjustments
    if (context.biome) {
      switch (context.biome) {
        case BiomeType.DESERT:
          if (archetype.id.includes('water') || archetype.id.includes('heat')) probability += 0.4;
          if (archetype.id.includes('trade')) probability += 0.1; // Trade routes through deserts
          break;
        case BiomeType.TUNDRA:
          if (archetype.id.includes('cold') || archetype.id.includes('survival')) probability += 0.4;
          if (archetype.id.includes('resource')) probability += 0.2;
          break;
        case BiomeType.JUNGLE:
          if (archetype.id.includes('disease') || archetype.id.includes('danger')) probability += 0.3;
          if (archetype.id.includes('discovery')) probability += 0.2;
          break;
        case BiomeType.MOUNTAIN:
          if (archetype.id.includes('navigation') || archetype.id.includes('challenge')) probability += 0.3;
          break;
        case BiomeType.COASTAL:
          if (archetype.id.includes('trade') || archetype.id.includes('travel')) probability += 0.2;
          break;
      }
    }
    
    // Era-specific adjustments
    switch (context.era) {
      case 'ancient':
        if (archetype.id.includes('survival') || archetype.id.includes('resource')) probability += 0.1;
        break;
      case 'medieval':
        if (archetype.id.includes('plague') || archetype.id.includes('war')) probability += 0.1;
        break;
      case 'earlyModern':
        if (archetype.id.includes('trade') || archetype.id.includes('exploration')) probability += 0.1;
        break;
      case 'modern':
        if (archetype.id.includes('economic') || archetype.id.includes('technology')) probability += 0.1;
        break;
    }
    
    // Cultural zone adjustments
    switch (context.culturalZone) {
      case 'european':
        if (archetype.id.includes('guild') || archetype.id.includes('feudal')) probability += 0.1;
        break;
      case 'eastAsian':
        if (archetype.id.includes('scholarly') || archetype.id.includes('bureaucratic')) probability += 0.1;
        break;
      case 'mena':
        if (archetype.id.includes('trade') || archetype.id.includes('caravan')) probability += 0.1;
        break;
      case 'northAmerican':
        if (archetype.id.includes('tribal') || archetype.id.includes('seasonal')) probability += 0.1;
        break;
    }
    
    return Math.min(1.0, Math.max(0.05, probability)); // Ensure between 5% and 100%
  }
  
  /**
   * Select most appropriate variables for template filling
   */
  selectContextualVariables(
    availableVars: Record<string, string[]>,
    context: EventContext,
    maxPerCategory: number = 3
  ): Record<string, string[]> {
    const filtered: Record<string, string[]> = {};
    
    Object.entries(availableVars).forEach(([key, options]) => {
      if (!options || options.length === 0) return;
      
      // Filter options based on historical accuracy and context appropriateness
      let filteredOptions = options.filter(option => 
        this.isHistoricallyAppropriate(option, context)
      );
      
      // If we filtered out everything, fall back to original options
      if (filteredOptions.length === 0) {
        filteredOptions = options;
      }
      
      // Limit number of options to prevent overwhelming variety
      if (filteredOptions.length > maxPerCategory) {
        // Randomly sample but prefer more contextually appropriate options
        const shuffled = this.shuffleArray([...filteredOptions]);
        filteredOptions = shuffled.slice(0, maxPerCategory);
      }
      
      filtered[key] = filteredOptions;
    });
    
    return filtered;
  }
  
  /**
   * Check if a variable option is historically appropriate for the context
   */
  private isHistoricallyAppropriate(option: string, context: EventContext): boolean {
    const lowerOption = option.toLowerCase();
    
    // Era-specific anachronism checks
    const anachronisms = {
      'ancient': ['gun', 'cannon', 'printing', 'telescope', 'automobile', 'electricity', 'computer', 'airplane'],
      'medieval': ['gun', 'printing press', 'telescope', 'automobile', 'electricity', 'computer', 'airplane', 'radio'],
      'earlyModern': ['automobile', 'electricity', 'computer', 'airplane', 'radio', 'television', 'internet'],
      'modern': [] // No restrictions for modern era
    };
    
    const problematicTerms = anachronisms[context.era] || [];
    
    // Check if option contains anachronistic terms
    for (const term of problematicTerms) {
      if (lowerOption.includes(term.toLowerCase())) {
        return false;
      }
    }
    
    // Cultural appropriateness checks
    if (context.culturalZone === 'northAmerican' && context.era === 'ancient') {
      // Pre-Columbian North America shouldn't have Old World animals/crops
      const oldWorldTerms = ['horse', 'cow', 'pig', 'wheat', 'rice', 'iron', 'steel'];
      for (const term of oldWorldTerms) {
        if (lowerOption.includes(term)) {
          return false;
        }
      }
    }
    
    // Biome appropriateness
    if (context.biome === BiomeType.DESERT) {
      const inappropriateTerms = ['ice', 'snow', 'fur', 'whale', 'seal', 'forest'];
      for (const term of inappropriateTerms) {
        if (lowerOption.includes(term)) {
          return false;
        }
      }
    }
    
    if (context.biome === BiomeType.TUNDRA) {
      const inappropriateTerms = ['desert', 'palm', 'tropical', 'jungle', 'coral'];
      for (const term of inappropriateTerms) {
        if (lowerOption.includes(term)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Shuffle array utility function
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  /**
   * Generate difficulty-scaled events based on player progression
   */
  calculateDifficultyMultiplier(
    context: EventContext,
    playerExperience?: number
  ): number {
    let multiplier = 1.0;
    
    // Base difficulty on wealth (higher wealth = more complex problems)
    switch (context.playerWealth) {
      case 'poor': multiplier = 0.8; break;
      case 'modest': multiplier = 1.0; break;
      case 'wealthy': multiplier = 1.3; break;
    }
    
    // Adjust for era complexity
    switch (context.era) {
      case 'ancient': multiplier *= 1.1; // Survival more challenging
      case 'medieval': multiplier *= 1.0;
      case 'earlyModern': multiplier *= 1.2; // More complex societies
      case 'modern': multiplier *= 1.3; // Most complex systems
    }
    
    // Factor in player experience if available
    if (playerExperience !== undefined) {
      // Experienced players get slightly harder events
      multiplier *= (1 + (playerExperience / 100) * 0.2);
    }
    
    return Math.max(0.5, Math.min(2.0, multiplier));
  }
}

// Export singleton instance
export const eventContextService = new EventContextService();