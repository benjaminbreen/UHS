/**
 * FishBehaviorSystem.ts - Advanced fish AI with species-specific behaviors
 * Manages fish movement patterns, attraction to bait, and environmental responses
 */

import { FishSpecies } from './fishingDataService';
import { GameFish } from './fishingGameStateService';
import { ClimateType, Season } from '../types';

export interface FishBehaviorConfig {
  climate: ClimateType;
  season: Season;
  timeOfDay: 'Dawn' | 'Morning' | 'Midday' | 'Afternoon' | 'Dusk' | 'Night';
  weather?: { precipitation: number; windSpeed: number };
  waterDepth: number;
  isFreshwater: boolean;
}

export interface BehaviorModifiers {
  speed: number;
  curiosity: number;
  caution: number;
  energy: number;
  schooling: number;
}

export class FishBehaviorSystem {
  private config: FishBehaviorConfig;
  private schoolGroups: Map<string, string[]> = new Map();
  
  constructor(config: FishBehaviorConfig) {
    this.config = config;
  }
  
  /**
   * Calculate behavior modifiers based on species and conditions
   */
  getBehaviorModifiers(species: FishSpecies): BehaviorModifiers {
    const base: BehaviorModifiers = {
      speed: 1.0,
      curiosity: 1.0,
      caution: 1.0,
      energy: 1.0,
      schooling: 0.5
    };
    
    // Time of day effects
    if (this.config.timeOfDay === 'Dawn' || this.config.timeOfDay === 'Dusk') {
      base.curiosity *= 1.5; // More active during feeding times
      base.energy *= 1.3;
    } else if (this.config.timeOfDay === 'Night') {
      base.caution *= 1.5;
      base.speed *= 0.7;
      base.curiosity *= 0.5;
    } else if (this.config.timeOfDay === 'Midday') {
      base.energy *= 0.8; // Less active in bright sun
    }
    
    // Weather effects
    if (this.config.weather) {
      if (this.config.weather.precipitation > 0.5) {
        base.curiosity *= 1.2; // Fish feed more in rain
        base.caution *= 0.8;
      }
      if (this.config.weather.windSpeed > 20) {
        base.speed *= 0.8; // Harder to swim in choppy water
        base.caution *= 1.2;
      }
    }
    
    // Season effects
    const seasonLower = this.config.season.toLowerCase();
    if (seasonLower === 'spring') {
      base.energy *= 1.2; // Spawning season
      base.curiosity *= 1.1;
    } else if (seasonLower === 'winter') {
      base.speed *= 0.6;
      base.energy *= 0.7;
      base.curiosity *= 0.8;
    }
    
    // Species-specific traits
    if (species.rarity === 'legendary') {
      base.caution *= 2.0;
      base.speed *= 1.5;
    } else if (species.rarity === 'rare') {
      base.caution *= 1.5;
      base.speed *= 1.2;
    } else if (species.rarity === 'common') {
      base.schooling *= 2.0; // Common fish school more
      base.caution *= 0.7;
    }
    
    // Depth preferences
    const depthRatio = this.config.waterDepth / 400; // Assuming max depth of 400m
    if (species.minDepth > 50) {
      // Deep water fish
      if (depthRatio < 0.3) {
        base.caution *= 1.5; // Uncomfortable in shallow water
        base.energy *= 0.8;
      }
    } else {
      // Shallow water fish
      if (depthRatio > 0.7) {
        base.caution *= 1.3;
        base.speed *= 0.9;
      }
    }
    
    return base;
  }
  
  /**
   * Check for feeding frenzy conditions
   */
  checkFeedingFrenzy(allFish: GameFish[], hookPosition: { x: number; y: number } | null): boolean {
    if (!hookPosition) return false;
    
    const nearbyFish = allFish.filter(f => {
      const dx = hookPosition.x - f.x;
      const dy = hookPosition.y - f.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < 120 && !f.hooked;
    });
    
    return nearbyFish.length >= 3; // Frenzy when 3+ fish are near bait
  }
  
  /**
   * Update fish movement based on behavior
   */
  updateFishMovement(
    fish: GameFish, 
    allFish: GameFish[], 
    hookPosition: { x: number; y: number } | null,
    deltaTime: number
  ): void {
    const modifiers = this.getBehaviorModifiers(fish.species);
    const isFrenzy = this.checkFeedingFrenzy(allFish, hookPosition);
    
    // Base movement
    let targetVx = fish.vx;
    let targetVy = fish.vy;
    
    // 1. Schooling behavior for common fish
    if (modifiers.schooling > 1.0 && !fish.hooked) {
      const nearbyFish = allFish.filter(f => 
        f.id !== fish.id && 
        f.species.id === fish.species.id &&
        Math.abs(f.x - fish.x) < 100 &&
        Math.abs(f.y - fish.y) < 50
      );
      
      if (nearbyFish.length > 0) {
        // Calculate average position and velocity of school
        const avgX = nearbyFish.reduce((sum, f) => sum + f.x, 0) / nearbyFish.length;
        const avgY = nearbyFish.reduce((sum, f) => sum + f.y, 0) / nearbyFish.length;
        const avgVx = nearbyFish.reduce((sum, f) => sum + f.vx, 0) / nearbyFish.length;
        
        // Move towards school center
        targetVx += (avgX - fish.x) * 0.001 * modifiers.schooling;
        targetVy += (avgY - fish.y) * 0.001 * modifiers.schooling;
        targetVx = (targetVx + avgVx) / 2;
      }
    }
    
    // 2. Hook attraction/avoidance
    if (hookPosition && !fish.hooked) {
      const dx = hookPosition.x - fish.x;
      const dy = hookPosition.y - fish.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 150) {
        // FEEDING FRENZY MODE - fish compete aggressively!
        if (isFrenzy && distance < 100) {
          fish.interested = true;
          
          // Much more aggressive movement during frenzy
          const frenzySpeed = 0.08 * modifiers.speed;
          targetVx = dx * frenzySpeed;
          targetVy = dy * frenzySpeed;
          
          // Add some competition jostling
          const nearbyCompetitors = allFish.filter(f => 
            f.id !== fish.id && !f.hooked &&
            Math.abs(f.x - fish.x) < 30 && 
            Math.abs(f.y - fish.y) < 30
          );
          
          if (nearbyCompetitors.length > 0) {
            // Push away from other fish slightly
            nearbyCompetitors.forEach(competitor => {
              const pushX = fish.x - competitor.x;
              const pushY = fish.y - competitor.y;
              const pushDist = Math.sqrt(pushX * pushX + pushY * pushY);
              if (pushDist > 0.1) {
                targetVx += (pushX / pushDist) * 2;
                targetVy += (pushY / pushDist) * 1;
              }
            });
          }
        } else if (fish.interested) {
          // Normal approach
          const approachSpeed = 0.02 * modifiers.curiosity / modifiers.caution;
          targetVx += dx * approachSpeed;
          targetVy += dy * approachSpeed;
          
          // Zigzag approach for cautious fish (not during frenzy)
          if (modifiers.caution > 1.2 && !isFrenzy) {
            targetVx += Math.sin(Date.now() * 0.001) * 2;
            targetVy += Math.cos(Date.now() * 0.001) * 1;
          }
        } else if (fish.escaping) {
          // Flee rapidly
          const fleeSpeed = 0.05 * modifiers.speed;
          targetVx -= dx * fleeSpeed;
          targetVy -= dy * fleeSpeed;
        } else {
          // Decide interest based on distance and curiosity
          const interestChance = isFrenzy ? 0.05 : 0.01; // Much higher during frenzy
          if (distance < 80 && Math.random() < interestChance * modifiers.curiosity) {
            fish.interested = true;
          }
        }
      }
    }
    
    // 3. Enhanced realistic swimming patterns
    if (!fish.interested && !fish.escaping && !fish.hooked) {
      // More natural swimming with less mechanical movement
      const baseTime = Date.now() * 0.00008; // Slower, more natural rhythm
      const fishPhase = fish.x * 0.008 + fish.y * 0.012 + fish.id.charCodeAt(0); // Unique per fish
      
      // Natural swimming undulation - like real fish
      const primaryWave = Math.sin(baseTime + fishPhase) * 0.4 * modifiers.energy;
      const secondaryWave = Math.sin(baseTime * 1.7 + fishPhase * 0.8) * 0.15; 
      const tertiaryWave = Math.sin(baseTime * 3.2 + fishPhase * 1.3) * 0.08; // Fine detail
      
      targetVx += primaryWave + secondaryWave + tertiaryWave;
      
      // Realistic vertical movement - fish do change depth naturally
      const verticalPattern = Math.sin(baseTime * 0.5 + fishPhase * 1.1) * 0.08 * modifiers.energy;
      const depthSeek = Math.sin(baseTime * 0.2 + fishPhase) * 0.12; // Seeking preferred depth
      targetVy += verticalPattern + depthSeek;
      
      // More natural direction changes
      if (Math.random() < 0.0003) { // Slightly more frequent but still rare
        const turnAngle = (Math.random() - 0.5) * Math.PI * 0.3; // Max 54 degree turns
        targetVx = Math.cos(turnAngle) * modifiers.speed * 0.9;
        targetVy = Math.sin(turnAngle) * modifiers.speed * 0.3;
      }
      
      // Variable current effects based on depth
      const currentY = fish.y; // Get fish Y position for depth calc
      const waterSurface = 200; // Approximate water surface Y
      const waterBottom = 400; // Approximate water bottom Y
      const depthFactor = Math.max(0, Math.min(1, (currentY - waterSurface) / (waterBottom - waterSurface)));
      targetVx += 0.08 * (1 - depthFactor * 0.5); // Weaker current at depth
    }
    
    // 4. Energy-based movement dampening
    const energyFactor = modifiers.energy;
    targetVx *= energyFactor;
    targetVy *= energyFactor;
    
    // 5. Smooth velocity changes
    fish.vx += (targetVx - fish.vx) * 0.1;
    fish.vy += (targetVy - fish.vy) * 0.1;
    
    // 6. Apply velocity limits
    const maxSpeed = 5 * modifiers.speed;
    const speed = Math.sqrt(fish.vx * fish.vx + fish.vy * fish.vy);
    if (speed > maxSpeed) {
      fish.vx = (fish.vx / speed) * maxSpeed;
      fish.vy = (fish.vy / speed) * maxSpeed;
    }
    
    // Update direction
    fish.direction = fish.vx > 0 ? 'right' : 'left';
  }
  
  /**
   * Calculate bite probability based on conditions
   */
  calculateBiteProbability(fish: GameFish, hasBait: boolean, isFrenzy: boolean = false): number {
    if (!hasBait) return 0;
    
    const modifiers = this.getBehaviorModifiers(fish.species);
    
    // Base probability (higher during frenzy)
    let probability = isFrenzy ? 0.03 : 0.01;
    
    // Time-of-day multiplier for realistic feeding patterns
    let timeMultiplier = 1.0;
    if (this.config.timeOfDay === 'Dawn' || this.config.timeOfDay === 'Dusk') {
      timeMultiplier = 2.0; // Fish are most active during feeding times
    } else if (this.config.timeOfDay === 'Morning' || this.config.timeOfDay === 'Afternoon') {
      timeMultiplier = 1.2; // Moderate activity
    } else if (this.config.timeOfDay === 'Midday') {
      timeMultiplier = 0.7; // Less active in bright sun
    } else if (this.config.timeOfDay === 'Night') {
      timeMultiplier = 0.8; // Some species active at night, others not
    }
    
    // Debug logging for time-of-day multipliers
    if (Math.random() < 0.001) { // Log occasionally to avoid spam
      console.log(`🕐 Time: ${this.config.timeOfDay}, Multiplier: ${timeMultiplier}x, Base: ${probability}, Final: ${probability * timeMultiplier}`);
    }
    
    probability *= timeMultiplier;
    
    // Adjust by curiosity and caution
    probability *= modifiers.curiosity;
    probability /= modifiers.caution;
    
    // Hungry fish bite more
    probability *= modifiers.energy > 1.0 ? 1.2 : 0.8;
    
    // Rarity affects bite rate
    if (fish.species.rarity === 'legendary') {
      probability *= 0.1;
    } else if (fish.species.rarity === 'rare') {
      probability *= 0.3;
    } else if (fish.species.rarity === 'common') {
      probability *= 1.5;
    }
    
    // Distance affects probability
    if (fish.distanceToHook > 30) {
      probability *= 0.5;
    } else if (fish.distanceToHook < 15) {
      probability *= 2.0;
    }
    
    return Math.min(probability, 0.1); // Cap at 10% per frame
  }
  
  /**
   * Calculate escape probability when hooked
   */
  calculateEscapeProbability(fish: GameFish, tension: number): number {
    const modifiers = this.getBehaviorModifiers(fish.species);
    
    // Base escape chance
    let probability = 0.001;
    
    // Higher for rare fish
    if (fish.species.rarity === 'legendary') {
      probability *= 5;
    } else if (fish.species.rarity === 'rare') {
      probability *= 3;
    }
    
    // Tension affects escape
    if (tension > 0.9) {
      probability *= 10; // Very likely to escape at high tension
    } else if (tension > 0.7) {
      probability *= 3;
    }
    
    // Low stamina fish escape less
    probability *= (fish.stamina / 100);
    
    // Speed affects escape ability
    probability *= modifiers.speed;
    
    return Math.min(probability, 0.5);
  }
  
  /**
   * Update configuration (for dynamic conditions)
   */
  updateConfig(config: Partial<FishBehaviorConfig>) {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get depth preference for species
   */
  getPreferredDepth(species: FishSpecies): number {
    const { minDepth, maxDepth } = species;
    const avgDepth = (minDepth + maxDepth) / 2;
    
    // Add some variation based on time of day
    let depthModifier = 0;
    if (this.config.timeOfDay === 'Dawn' || this.config.timeOfDay === 'Dusk') {
      depthModifier = -10; // Come closer to surface during feeding
    } else if (this.config.timeOfDay === 'Midday') {
      depthModifier = 10; // Go deeper to avoid bright sun
    }
    
    return Math.max(minDepth, Math.min(maxDepth, avgDepth + depthModifier));
  }
}