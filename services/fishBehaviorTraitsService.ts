/**
 * fishBehaviorTraitsService.ts - Species-specific fish behavior traits
 * Provides realistic behavioral patterns for different fish species
 */

export interface BehaviorTraits {
  aggressive: boolean;      // Will chase/attack lures aggressively
  ambush: boolean;          // Waits in hiding spots
  territorial: boolean;     // Defends specific areas
  schooling: boolean;       // Moves in groups
  pelagic: boolean;        // Open water swimmer
  migratory: boolean;      // Seasonal movement patterns
  bottomDweller: boolean;  // Stays near bottom
  nocturnal: boolean;      // More active at night
  scavenger: boolean;      // Feeds on bottom/dead matter
  curious: boolean;        // Investigates new objects
  skittish: boolean;       // Easily scared
  deepWater: boolean;      // Prefers deeper waters
}

export class FishBehaviorTraitsService {
  /**
   * Get behavior traits for a specific species
   */
  getBehaviorTraits(speciesId: string): BehaviorTraits {
    const defaultTraits: BehaviorTraits = {
      aggressive: false,
      ambush: false,
      territorial: false,
      schooling: false,
      pelagic: false,
      migratory: false,
      bottomDweller: false,
      nocturnal: false,
      scavenger: false,
      curious: true,
      skittish: false,
      deepWater: false
    };

    // Species-specific behaviors
    switch(speciesId) {
      // Predators
      case 'pike':
      case 'muskie':
        return {
          ...defaultTraits,
          aggressive: true,
          ambush: true,
          territorial: true,
          curious: false,
          skittish: false
        };
      
      case 'barracuda':
        return {
          ...defaultTraits,
          aggressive: true,
          pelagic: true,
          curious: true,
          territorial: false,
          schooling: false
        };
      
      case 'grouper':
        return {
          ...defaultTraits,
          ambush: true,
          territorial: true,
          bottomDweller: true,
          aggressive: true
        };
      
      // Schooling fish
      case 'herring':
      case 'sardine':
      case 'anchovy':
      case 'mackerel':
        return {
          ...defaultTraits,
          schooling: true,
          pelagic: true,
          migratory: true,
          skittish: true,
          curious: false
        };
      
      case 'parrotfish':
        return {
          ...defaultTraits,
          schooling: true,
          curious: true,
          territorial: false,
          bottomDweller: false
        };
      
      // Bottom dwellers
      case 'catfish':
      case 'sturgeon':
        return {
          ...defaultTraits,
          bottomDweller: true,
          nocturnal: true,
          scavenger: true,
          curious: false,
          skittish: false
        };
      
      case 'flounder':
      case 'halibut':
        return {
          ...defaultTraits,
          bottomDweller: true,
          ambush: true,
          nocturnal: false,
          curious: false
        };
      
      // Tropical species
      case 'yellowfin_tuna':
      case 'mahi_mahi':
        return {
          ...defaultTraits,
          pelagic: true,
          migratory: true,
          aggressive: true,
          schooling: true,
          curious: true
        };
      
      // Cold water species
      case 'arctic_char':
      case 'salmon':
      case 'trout':
        return {
          ...defaultTraits,
          migratory: true,
          curious: true,
          skittish: true,
          territorial: true
        };
      
      // Small/bait fish
      case 'minnow':
      case 'desert_pupfish':
        return {
          ...defaultTraits,
          schooling: true,
          skittish: true,
          curious: false,
          pelagic: false
        };
      
      // Bass family
      case 'bass':
      case 'sea_bass':
      case 'largemouth_bass':
        return {
          ...defaultTraits,
          aggressive: true,
          territorial: true,
          curious: true,
          ambush: true
        };
      
      // Deep water species
      case 'coelacanth':
      case 'lanternfish':
        return {
          ...defaultTraits,
          deepWater: true,
          nocturnal: true,
          curious: false,
          skittish: false
        };
      
      default:
        return defaultTraits;
    }
  }

  /**
   * Calculate behavior modifiers based on traits and conditions
   */
  getBehaviorModifiers(
    traits: BehaviorTraits,
    timeOfDay: 'Dawn' | 'Morning' | 'Midday' | 'Afternoon' | 'Dusk' | 'Night',
    depth: number
  ): {
    speedMultiplier: number;
    aggressionMultiplier: number;
    curiosityMultiplier: number;
    schoolingTightness: number;
  } {
    let speedMultiplier = 1.0;
    let aggressionMultiplier = 1.0;
    let curiosityMultiplier = 1.0;
    let schoolingTightness = 1.0;

    // Nocturnal fish are more active at night
    if (traits.nocturnal) {
      if (timeOfDay === 'Night' || timeOfDay === 'Dusk' || timeOfDay === 'Dawn') {
        speedMultiplier *= 1.5;
        aggressionMultiplier *= 1.3;
        curiosityMultiplier *= 1.4;
      } else {
        speedMultiplier *= 0.6;
        aggressionMultiplier *= 0.5;
        curiosityMultiplier *= 0.3;
      }
    }

    // Diurnal fish (opposite of nocturnal)
    if (!traits.nocturnal) {
      if (timeOfDay === 'Morning' || timeOfDay === 'Midday' || timeOfDay === 'Afternoon') {
        speedMultiplier *= 1.2;
        aggressionMultiplier *= 1.1;
      } else if (timeOfDay === 'Night') {
        speedMultiplier *= 0.7;
        aggressionMultiplier *= 0.6;
        curiosityMultiplier *= 0.5;
      }
    }

    // Bottom dwellers move slower in shallow water
    if (traits.bottomDweller) {
      if (depth < 20) {
        speedMultiplier *= 0.5;
        schoolingTightness *= 0.7;
      }
    }

    // Deep water fish are sluggish in shallow water
    if (traits.deepWater) {
      if (depth < 50) {
        speedMultiplier *= 0.4;
        aggressionMultiplier *= 0.3;
      } else if (depth > 100) {
        speedMultiplier *= 1.3;
      }
    }

    // Schooling fish stick together more when threatened
    if (traits.schooling) {
      if (traits.skittish) {
        schoolingTightness *= 1.5;
      }
    }

    // Aggressive fish are always more active
    if (traits.aggressive) {
      aggressionMultiplier *= 1.2;
      speedMultiplier *= 1.1;
    }

    // Curious fish investigate more
    if (traits.curious) {
      curiosityMultiplier *= 1.3;
    }

    // Skittish fish are less curious
    if (traits.skittish) {
      curiosityMultiplier *= 0.4;
      speedMultiplier *= 1.2; // But they're faster when fleeing
    }

    return {
      speedMultiplier,
      aggressionMultiplier,
      curiosityMultiplier,
      schoolingTightness
    };
  }

  /**
   * Determine if fish should form schools
   */
  shouldFormSchool(speciesId: string, otherFishCount: number): boolean {
    const traits = this.getBehaviorTraits(speciesId);
    
    if (!traits.schooling) return false;
    
    // Need at least 3 fish to form a school
    return otherFishCount >= 2;
  }

  /**
   * Calculate school movement pattern
   */
  getSchoolMovement(
    fishInSchool: Array<{x: number, y: number, vx: number, vy: number}>,
    traits: BehaviorTraits
  ): {centerX: number, centerY: number, avgVx: number, avgVy: number} {
    if (fishInSchool.length === 0) {
      return {centerX: 0, centerY: 0, avgVx: 0, avgVy: 0};
    }

    const centerX = fishInSchool.reduce((sum, f) => sum + f.x, 0) / fishInSchool.length;
    const centerY = fishInSchool.reduce((sum, f) => sum + f.y, 0) / fishInSchool.length;
    const avgVx = fishInSchool.reduce((sum, f) => sum + f.vx, 0) / fishInSchool.length;
    const avgVy = fishInSchool.reduce((sum, f) => sum + f.vy, 0) / fishInSchool.length;

    return {centerX, centerY, avgVx, avgVy};
  }
}

// Export singleton instance
export const fishBehaviorTraitsService = new FishBehaviorTraitsService();