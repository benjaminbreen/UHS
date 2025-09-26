/**
 * Atmospheric Context Service
 *
 * Tracks celestial phenomena and atmospheric conditions for NPC integration.
 * Provides context data that NPCs can react to in their dialogue.
 */

export enum PhenomenonType {
  METEOR_SHOWER = 'meteor_shower',
  AURORA = 'aurora',
  RAINBOW = 'rainbow',
  COMET = 'comet',
  ECLIPSE = 'eclipse',
  HALO = 'halo',
  FULL_MOON = 'full_moon',
  NEW_MOON = 'new_moon',
  PLANET_VISIBLE = 'planet_visible'
}

export interface AtmosphericPhenomenon {
  type: PhenomenonType;
  intensity: number; // 0-1
  description: string;
  npcReactionPrompt: string;
  duration?: number; // in days
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare';
}

export interface AtmosphericContext {
  phenomena: AtmosphericPhenomenon[];
  moonPhase: string;
  moonPhaseValue: number;
  visiblePlanets: string[];
  specialEvents: string[];
  timeOfDay: string;
  weather: string;
  season: string;
  overallMood: 'mysterious' | 'ominous' | 'peaceful' | 'magical' | 'dramatic' | 'serene';
}

export interface WeatherState {
  condition: string;
  cloudCover: number;
  isRaining: boolean;
  isSnowing: boolean;
  temperature: number;
}

export interface GameTimeState {
  timeOfDay: string;
  hours: number;
  minutes: number;
  totalMinutes: number;
}

export interface GameDateState {
  year: number;
  month: number;
  day: number;
}

class AtmosphericContextService {
  /**
   * Get current atmospheric context for NPC integration
   */
  getContext(
    gameTime: GameTimeState,
    gameDate: GameDateState,
    weather: WeatherState
  ): AtmosphericContext {
    const phenomena: AtmosphericPhenomenon[] = [];
    const visiblePlanets: string[] = [];
    const specialEvents: string[] = [];

    // Calculate moon phase
    const moonPhaseValue = ((gameDate.day % 29.5) + 29.5) % 29.5 / 29.5;
    const moonPhase = this.getMoonPhaseDescription(moonPhaseValue);

    // Check for meteor showers
    const meteorShower = this.checkMeteorShower(gameDate);
    if (meteorShower) {
      phenomena.push(meteorShower);
    }

    // Check for aurora (only at night in cold weather)
    if (gameTime.timeOfDay === 'Night' && weather.temperature < 5 && weather.cloudCover < 0.4) {
      const aurora = this.checkAurora(gameDate, gameTime);
      if (aurora) {
        phenomena.push(aurora);
      }
    }

    // Check for rainbow (after rain with sun)
    if (!weather.isRaining && weather.cloudCover > 0.3 &&
        (gameTime.timeOfDay === 'Morning' || gameTime.timeOfDay === 'Afternoon')) {
      const rainbow = this.checkRainbow(gameDate, weather);
      if (rainbow) {
        phenomena.push(rainbow);
      }
    }

    // Check for comets
    const comet = this.checkComet(gameDate);
    if (comet) {
      phenomena.push(comet);
      specialEvents.push(`Great Comet visible in the sky`);
    }

    // Check for visible planets
    const planets = this.getVisiblePlanets(gameTime, gameDate);
    visiblePlanets.push(...planets);

    // Moon phase phenomena
    if (moonPhaseValue < 0.05 || moonPhaseValue > 0.95) {
      phenomena.push({
        type: PhenomenonType.NEW_MOON,
        intensity: 1,
        description: 'The moon is new, creating a dark night sky',
        npcReactionPrompt: 'The new moon makes for darker nights and better stargazing.',
        rarity: 'common'
      });
    } else if (moonPhaseValue > 0.45 && moonPhaseValue < 0.55) {
      phenomena.push({
        type: PhenomenonType.FULL_MOON,
        intensity: 1,
        description: 'The full moon illuminates the night',
        npcReactionPrompt: 'The full moon is shining bright tonight, casting strong shadows.',
        rarity: 'common'
      });
    }

    // Calculate overall atmospheric mood
    const overallMood = this.calculateMood(phenomena, weather, gameTime);

    return {
      phenomena,
      moonPhase,
      moonPhaseValue,
      visiblePlanets,
      specialEvents,
      timeOfDay: gameTime.timeOfDay,
      weather: weather.condition,
      season: this.getSeason(gameDate.month),
      overallMood
    };
  }

  /**
   * Generate NPC prompt additions based on atmospheric context
   */
  getNpcPromptAdditions(context: AtmosphericContext): string {
    if (context.phenomena.length === 0 && context.visiblePlanets.length === 0) {
      return '';
    }

    let promptAdditions: string[] = [];

    // Add atmospheric phenomena
    for (const phenomenon of context.phenomena) {
      if (phenomenon.intensity > 0.3) { // Only mention significant phenomena
        promptAdditions.push(phenomenon.npcReactionPrompt);
      }
    }

    // Add visible planets
    if (context.visiblePlanets.length > 0 && context.timeOfDay === 'Night') {
      const planetList = context.visiblePlanets.slice(0, 3).join(', '); // Limit to 3 planets
      promptAdditions.push(`The planets ${planetList} are clearly visible in the night sky.`);
    }

    // Add moon phase context
    if (context.moonPhase === 'Full Moon' && context.timeOfDay === 'Night') {
      promptAdditions.push('The full moon provides excellent illumination tonight.');
    } else if (context.moonPhase === 'New Moon' && context.timeOfDay === 'Night') {
      promptAdditions.push('The new moon makes for an especially dark night.');
    }

    // Add special events
    for (const event of context.specialEvents) {
      promptAdditions.push(event);
    }

    if (promptAdditions.length === 0) {
      return '';
    }

    return `\n\nCurrent atmospheric conditions: ${promptAdditions.join(' ')} NPCs may comment on these celestial phenomena if appropriate to the conversation.`;
  }

  /**
   * Check for meteor showers based on game date
   */
  private checkMeteorShower(gameDate: GameDateState): AtmosphericPhenomenon | null {
    const showers = [
      { month: 1, name: 'Quadrantids', intensity: 0.7, peak: 3 },
      { month: 4, name: 'Lyrids', intensity: 0.5, peak: 22 },
      { month: 8, name: 'Perseids', intensity: 0.9, peak: 12 },
      { month: 10, name: 'Orionids', intensity: 0.6, peak: 21 },
      { month: 11, name: 'Leonids', intensity: 0.8, peak: 17 },
      { month: 12, name: 'Geminids', intensity: 0.8, peak: 14 }
    ];

    const currentShower = showers.find(s => s.month === gameDate.month);
    if (!currentShower) return null;

    // Peak activity ±3 days
    const daysDifference = Math.abs(gameDate.day - currentShower.peak);
    if (daysDifference > 3) return null;

    const intensity = currentShower.intensity * (1 - daysDifference / 3);

    return {
      type: PhenomenonType.METEOR_SHOWER,
      intensity,
      description: `The ${currentShower.name} meteor shower is active`,
      npcReactionPrompt: `The ${currentShower.name} meteor shower is streaking across the night sky.`,
      rarity: currentShower.name === 'Perseids' ? 'rare' : 'uncommon'
    };
  }

  /**
   * Check for aurora activity
   */
  private checkAurora(gameDate: GameDateState, gameTime: GameTimeState): AtmosphericPhenomenon | null {
    // Aurora more likely during equinoxes and winter
    const month = gameDate.month;
    const isAuroraMonth = month >= 9 || month <= 3; // Sept-March

    if (!isAuroraMonth) return null;

    // Simple solar activity simulation (11-year cycle)
    const solarCycle = (gameDate.year % 11) / 11;
    const solarActivity = Math.sin(solarCycle * Math.PI); // Peak at year 5.5

    // Random chance based on solar activity
    const auroraChance = solarActivity * 0.3; // Max 30% chance
    const random = ((gameDate.day * 17 + gameTime.totalMinutes) % 100) / 100;

    if (random > auroraChance) return null;

    return {
      type: PhenomenonType.AURORA,
      intensity: solarActivity,
      description: 'Aurora borealis dances across the northern sky',
      npcReactionPrompt: 'The northern lights are putting on a spectacular display tonight.',
      rarity: 'rare'
    };
  }

  /**
   * Check for rainbow conditions
   */
  private checkRainbow(gameDate: GameDateState, weather: WeatherState): AtmosphericPhenomenon | null {
    // Rainbow requires recent rain + sun + clouds
    if (weather.cloudCover < 0.3 || weather.isRaining) return null;

    // Simple chance based on weather conditions
    const rainbowChance = weather.cloudCover * 0.4; // Max 40% with optimal clouds
    const random = ((gameDate.day * 23 + gameDate.month * 7) % 100) / 100;

    if (random > rainbowChance) return null;

    const isDoubleRainbow = random < 0.1; // 10% chance for double rainbow

    return {
      type: PhenomenonType.RAINBOW,
      intensity: isDoubleRainbow ? 0.9 : 0.6,
      description: isDoubleRainbow ? 'A brilliant double rainbow arcs across the sky' : 'A rainbow arcs across the sky',
      npcReactionPrompt: isDoubleRainbow
        ? 'Look at that magnificent double rainbow!'
        : 'A beautiful rainbow has appeared after the rain.',
      rarity: isDoubleRainbow ? 'very_rare' : 'uncommon'
    };
  }

  /**
   * Check for visible comets
   */
  private checkComet(gameDate: GameDateState): AtmosphericPhenomenon | null {
    // Great comets are rare - maybe 1-2 per decade
    const cometPeriod = 3650; // ~10 years in days
    const daysSinceEpoch = gameDate.year * 365 + gameDate.month * 30 + gameDate.day;
    const cometCycle = (daysSinceEpoch % cometPeriod) / cometPeriod;

    // Comet visible for ~30 days every 10 years
    const visibilityWindow = 30 / cometPeriod; // ~0.008

    if (cometCycle < visibilityWindow || cometCycle > (1 - visibilityWindow)) {
      const intensity = cometCycle < visibilityWindow
        ? (visibilityWindow - cometCycle) / visibilityWindow
        : (cometCycle - (1 - visibilityWindow)) / visibilityWindow;

      return {
        type: PhenomenonType.COMET,
        intensity,
        description: 'A great comet with a brilliant tail dominates the sky',
        npcReactionPrompt: 'That magnificent comet has been visible for days now - some say it\'s an omen.',
        duration: 30,
        rarity: 'very_rare'
      };
    }

    return null;
  }

  /**
   * Get visible planets for the current time/date
   */
  private getVisiblePlanets(gameTime: GameTimeState, gameDate: GameDateState): string[] {
    const planets: string[] = [];

    // Simple visibility calculation based on time of year and time of day
    if (gameTime.timeOfDay === 'Night' || gameTime.timeOfDay === 'Dusk' || gameTime.timeOfDay === 'Dawn') {
      // Venus (evening/morning star)
      if (gameTime.timeOfDay === 'Dusk' || gameTime.timeOfDay === 'Dawn') {
        planets.push('Venus');
      }

      // Mars (varies by opposition cycle)
      const marsOpposition = (gameDate.year % 2) * 365 + gameDate.month * 30;
      if (marsOpposition < 60 || marsOpposition > 670) { // ~2 month window every 2 years
        planets.push('Mars');
      }

      // Jupiter (visible most of the year when above horizon)
      const jupiterVisible = ((gameDate.month + 6) % 12) < 8; // 8 months visible
      if (jupiterVisible) {
        planets.push('Jupiter');
      }

      // Saturn
      const saturnVisible = ((gameDate.month + 4) % 12) < 6; // 6 months visible
      if (saturnVisible) {
        planets.push('Saturn');
      }
    }

    return planets;
  }

  /**
   * Get moon phase description from phase value
   */
  private getMoonPhaseDescription(phase: number): string {
    if (phase < 0.05 || phase > 0.95) return "New Moon";
    if (phase < 0.2) return "Waxing Crescent";
    if (phase < 0.3) return "First Quarter";
    if (phase < 0.45) return "Waxing Gibbous";
    if (phase < 0.55) return "Full Moon";
    if (phase < 0.7) return "Waning Gibbous";
    if (phase < 0.8) return "Last Quarter";
    return "Waning Crescent";
  }

  /**
   * Get season from month
   */
  private getSeason(month: number): string {
    if (month >= 3 && month <= 5) return 'Spring';
    if (month >= 6 && month <= 8) return 'Summer';
    if (month >= 9 && month <= 11) return 'Autumn';
    return 'Winter';
  }

  /**
   * Calculate overall atmospheric mood
   */
  private calculateMood(
    phenomena: AtmosphericPhenomenon[],
    weather: WeatherState,
    gameTime: GameTimeState
  ): 'mysterious' | 'ominous' | 'peaceful' | 'magical' | 'dramatic' | 'serene' {
    // Start with base mood from time and weather
    let mood: 'mysterious' | 'ominous' | 'peaceful' | 'magical' | 'dramatic' | 'serene' = 'peaceful';

    if (gameTime.timeOfDay === 'Night') {
      mood = 'mysterious';
    }

    if (weather.isRaining || weather.isSnowing) {
      mood = weather.cloudCover > 0.8 ? 'ominous' : 'dramatic';
    }

    // Phenomena can override base mood
    for (const phenomenon of phenomena) {
      switch (phenomenon.type) {
        case PhenomenonType.AURORA:
          mood = 'magical';
          break;
        case PhenomenonType.METEOR_SHOWER:
          mood = phenomenon.intensity > 0.7 ? 'magical' : 'mysterious';
          break;
        case PhenomenonType.COMET:
          mood = 'ominous'; // Historically considered omens
          break;
        case PhenomenonType.RAINBOW:
          mood = 'peaceful';
          break;
        case PhenomenonType.FULL_MOON:
          mood = gameTime.timeOfDay === 'Night' ? 'serene' : mood;
          break;
      }
    }

    return mood;
  }
}

// Export singleton instance
export const atmosphericContextService = new AtmosphericContextService();