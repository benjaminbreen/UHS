/**
 * fishingGameStateService.ts - Manages shared game state for fishing minigame
 * Coordinates between FishingHutBanner visuals and game mechanics
 */

import { FishSpecies } from './fishingDataService';
import { FishBehaviorSystem, FishBehaviorConfig } from './FishBehaviorSystem';

export type RodType = 'basic' | 'good' | 'master';
export type BaitType = 'worm' | 'bread' | 'meat' | 'insect' | 'lure' | 'none';

export interface FishingLineState {
  cast: boolean;
  x: number;
  y: number;
  depth: number;
  targetDepth: number;
  hasBait: boolean;
  baitType: BaitType;
  tension: number;
  hookedFish: GameFish | null;
  reelSpeed: number;
  castPower: number;
  rodType: RodType;
}

export interface GameFish {
  id: string;
  species: FishSpecies;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  weight: number;
  direction: 'left' | 'right';
  interested: boolean;
  hooked: boolean;
  escaping: boolean;
  stamina: number;
  distanceToHook: number;
}

export interface PowerBarState {
  active: boolean;
  power: number;
  perfect: boolean;
  targetZone: { min: number; max: number };
}

export interface GameStats {
  score: number;
  combo: number;
  totalCatches: number;
  perfectCasts: number;
  totalCasts: number;
}

export interface RippleEffect {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  growthRate: number;
}

class FishingGameStateService {
  private lineState: FishingLineState = {
    cast: false,
    x: 0,
    y: 0,
    depth: 0,
    targetDepth: 0,
    hasBait: true,
    baitType: 'worm',
    tension: 0.5,
    hookedFish: null,
    reelSpeed: 0,
    castPower: 0,
    rodType: 'basic'
  };
  
  private behaviorSystem: FishBehaviorSystem | null = null;

  private powerBar: PowerBarState = {
    active: false,
    power: 0,
    perfect: false,
    targetZone: { min: 0.625, max: 0.875 }  // Bigger perfect zone for more fun
  };

  private stats: GameStats = {
    score: 0,
    combo: 0,
    totalCatches: 0,
    perfectCasts: 0,
    totalCasts: 0
  };

  private ripples: RippleEffect[] = [];
  private gameFish: Map<string, GameFish> = new Map();
  private listeners: Set<() => void> = new Set();

  // Line state management
  startCasting(x: number, waterY: number) {
    this.powerBar.active = true;
    this.powerBar.power = 0;
    this.powerBar.perfect = false;
    this.lineState.x = x;
    this.lineState.y = waterY;
    this.notifyListeners();
  }

  setRodType(rodType: RodType) {
    this.lineState.rodType = rodType;
    this.notifyListeners();
  }

  getRodType(): RodType {
    return this.lineState.rodType;
  }

  setBaitType(baitType: BaitType) {
    this.lineState.baitType = baitType;
    this.lineState.hasBait = baitType !== 'none';
    this.notifyListeners();
  }

  getBaitType(): BaitType {
    return this.lineState.baitType;
  }

  // Calculate bait effectiveness for a given fish species
  getBaitEffectiveness(species: FishSpecies): number {
    const bait = this.lineState.baitType;
    
    // Base effectiveness
    if (bait === 'none') return 0;
    
    // Worms are universally effective
    if (bait === 'worm') return 1.0;
    
    // Bread works well for common fish
    if (bait === 'bread') {
      return species.rarity === 'common' ? 1.2 : 0.7;
    }
    
    // Meat attracts predatory fish
    if (bait === 'meat') {
      // Predatory fish are typically larger
      return species.size.max > 20 ? 1.5 : 0.5;
    }
    
    // Insects work well for small fish
    if (bait === 'insect') {
      return species.size.max < 10 ? 1.3 : 0.6;
    }
    
    // Lures work for active predators
    if (bait === 'lure') {
      return species.speed > 0.6 ? 1.4 : 0.4;
    }
    
    return 0.8; // Default
  }

  updateCastPower(deltaTime: number) {
    if (!this.powerBar.active) return;
    
    this.powerBar.power += deltaTime * 0.3; // Slower power build up for easier timing
    if (this.powerBar.power > 1) {
      this.powerBar.power = 0; // Loop back
    }
    
    // Check if in perfect zone
    this.powerBar.perfect = 
      this.powerBar.power >= this.powerBar.targetZone.min && 
      this.powerBar.power <= this.powerBar.targetZone.max;
    
    this.notifyListeners();
  }

  releaseCast(maxDepth: number) {
    if (!this.powerBar.active) return;
    
    const power = this.powerBar.power;
    const isPerfect = this.powerBar.perfect;
    
    // Apply rod bonuses to cast distance
    let distanceMultiplier = 1.0;
    if (this.lineState.rodType === 'good') {
      distanceMultiplier = 1.2; // +20% distance
    } else if (this.lineState.rodType === 'master') {
      distanceMultiplier = 1.4; // +40% distance
    }
    
    // Calculate cast distance based on power and rod
    this.lineState.cast = true;
    this.lineState.targetDepth = power * maxDepth * distanceMultiplier;
    this.lineState.castPower = power;
    this.lineState.hasBait = true;
    
    // Add ripple effect at cast point
    this.addRipple(this.lineState.x, this.lineState.y, isPerfect ? 30 : 20);
    
    // Update stats for perfect cast
    if (isPerfect) {
      this.stats.perfectCasts++;
      this.stats.score += 50; // Bonus for perfect cast
    }
    
    this.powerBar.active = false;
    this.notifyListeners();
  }

  // Simple one-click casting method
  castLine(x: number, depth: number) {
    // Start casting
    this.lineState.x = x;
    this.lineState.y = this.lineState.y; // Keep current water Y
    this.lineState.cast = true;
    this.lineState.targetDepth = depth;
    this.lineState.castPower = 0.8; // Good cast power
    this.lineState.hasBait = true;
    
    // Add ripple effect
    this.addRipple(x, this.lineState.y, 25);
    
    // Update stats
    this.stats.totalCasts++;
    
    this.notifyListeners();
  }

  updateLineDepth(deltaTime: number) {
    if (!this.lineState.cast) return;
    
    const depthDiff = this.lineState.targetDepth - this.lineState.depth;
    const sinkSpeed = this.lineState.hookedFish ? 100 : 200; // Slower when fish hooked
    
    if (Math.abs(depthDiff) > 1) {
      this.lineState.depth += Math.sign(depthDiff) * sinkSpeed * deltaTime;
    } else {
      this.lineState.depth = this.lineState.targetDepth;
    }
    
    // Update line tension based on hooked fish - MORE DYNAMIC
    if (this.lineState.hookedFish) {
      const fish = this.lineState.hookedFish;
      
      // Fish fights back! Tension oscillates
      const fightStrength = (fish.stamina / 100) * 0.4;
      const fightPattern = Math.sin(Date.now() * 0.002) * fightStrength;
      
      // Base tension from fish strength
      const baseTension = 0.5 + fightPattern;
      
      // If reeling, tension increases
      if (this.lineState.reelSpeed > 0) {
        this.lineState.tension = Math.min(1, baseTension + 0.3);
      } else {
        // Not reeling, tension decreases
        this.lineState.tension = Math.max(0, baseTension - 0.2);
      }
      
      // Fish loses stamina when being reeled successfully
      if (this.lineState.tension > 0.2 && this.lineState.tension < 0.8) {
        fish.stamina = Math.max(0, fish.stamina - deltaTime * 15);
      }
      
      // Check if fish escapes (too much or too little tension)
      if (this.lineState.tension > 0.95) {
        this.fishEscaped(); // Line snapped!
      } else if (this.lineState.tension < 0.1) {
        this.fishEscaped(); // Fish got slack and escaped!
      }
    }
    
    this.notifyListeners();
  }

  // Initialize behavior system
  initializeBehaviorSystem(config: FishBehaviorConfig) {
    this.behaviorSystem = new FishBehaviorSystem(config);
  }

  updateBehaviorConfig(config: Partial<FishBehaviorConfig>) {
    if (this.behaviorSystem) {
      this.behaviorSystem.updateConfig(config);
    }
  }

  // Fish management
  registerFish(fish: GameFish) {
    this.gameFish.set(fish.id, fish);
  }

  updateFishBehavior(hookX: number, hookY: number, deltaTime: number) {
    const allFish = Array.from(this.gameFish.values());
    const hookPosition = this.lineState.cast ? { x: hookX, y: hookY } : null;
    
    this.gameFish.forEach(fish => {
      if (fish.hooked) {
        // Hooked fish follows the line with resistance
        const pullStrength = 0.1 * (1 - fish.stamina / 100);
        fish.x += (hookX - fish.x) * pullStrength;
        fish.y += (hookY - fish.y) * pullStrength;
        
        // Fish tries to escape
        if (this.behaviorSystem) {
          const escapeChance = this.behaviorSystem.calculateEscapeProbability(fish, this.lineState.tension);
          if (Math.random() < escapeChance) {
            this.fishEscaped();
          }
        }
        return;
      }

      // Calculate distance to hook
      const dx = hookX - fish.x;
      const dy = hookY - fish.y;
      fish.distanceToHook = Math.sqrt(dx * dx + dy * dy);
      
      // Use behavior system for advanced AI
      if (this.behaviorSystem) {
        this.behaviorSystem.updateFishMovement(fish, allFish, hookPosition, deltaTime);
        
        // Check for bite based on behavior - increased bite zone and chance
        if (this.lineState.cast && this.lineState.hasBait && fish.distanceToHook < 40) {
          // Fish become interested when near the hook
          if (fish.distanceToHook < 80) {
            fish.interested = true;
          }
          
          // Bite detection with more realistic chances and rod bonuses
          if (fish.interested && fish.distanceToHook < 30) {
            const isFrenzy = this.behaviorSystem.checkFeedingFrenzy(allFish, hookPosition);
            const biteChance = this.behaviorSystem.calculateBiteProbability(fish, this.lineState.hasBait, isFrenzy);
            
            // Apply rod bonus to bite rate
            let rodMultiplier = 1.0;
            if (this.lineState.rodType === 'good') {
              rodMultiplier = 1.1; // +10% bite rate
            } else if (this.lineState.rodType === 'master') {
              rodMultiplier = 1.25; // +25% bite rate
            }
            
            // Apply bait effectiveness
            const baitMultiplier = this.getBaitEffectiveness(fish.species);
            
            // Increase base bite chance with rod and bait bonuses
            // Much higher chances for more fun gameplay!
            const adjustedBiteChance = Math.min(0.4, biteChance * 15 * rodMultiplier * baitMultiplier);
            if (Math.random() < adjustedBiteChance) {
              this.hookFish(fish);
            }
          }
        }
      } else {
        // Fallback to simple behavior with better attraction
        if (this.lineState.cast && this.lineState.hasBait && fish.distanceToHook < 150) {
          fish.interested = true;
          // Stronger attraction to the hook
          fish.vx = dx * 0.05;
          fish.vy = dy * 0.03;
          
          // Much higher bite chance when close
          if (fish.distanceToHook < 30 && Math.random() < 0.15) { // Much more likely!
            this.hookFish(fish);
          }
        } else {
          fish.interested = false;
        }
      }
    });
  }

  hookFish(fish: GameFish) {
    if (this.lineState.hookedFish) return; // Already have a fish
    
    fish.hooked = true;
    fish.stamina = 100;
    this.lineState.hookedFish = fish;
    this.lineState.hasBait = false;
    
    // Add big ripple
    this.addRipple(fish.x, fish.y, 40);
    
    // Score based on rarity
    const baseScore = fish.species.rarity === 'legendary' ? 1000 :
                     fish.species.rarity === 'rare' ? 500 :
                     fish.species.rarity === 'uncommon' ? 200 : 100;
    
    this.stats.combo++;
    this.stats.score += baseScore * this.stats.combo;
    
    this.notifyListeners();
  }

  reelIn(speed: number) {
    if (!this.lineState.cast || !this.lineState.hookedFish) return;
    
    this.lineState.targetDepth = Math.max(0, this.lineState.targetDepth - speed);
    this.lineState.reelSpeed = speed;
    
    // If fish reaches surface, it's caught
    if (this.lineState.targetDepth <= 10 && this.lineState.hookedFish) {
      this.catchFish();
    }
    
    this.notifyListeners();
  }

  catchFish(): GameFish | null {
    const fish = this.lineState.hookedFish;
    if (!fish) return null;
    
    this.stats.totalCatches++;
    
    // Reset line state
    this.lineState.hookedFish = null;
    this.lineState.cast = false;
    this.lineState.depth = 0;
    this.lineState.targetDepth = 0;
    
    // Remove caught fish
    this.gameFish.delete(fish.id);
    
    this.notifyListeners();
    
    return fish;
  }
  
  // Retract the fishing line
  retractLine() {
    this.lineState.cast = false;
    this.lineState.depth = 0;
    this.lineState.targetDepth = 0;
    this.lineState.hookedFish = null;
    this.notifyListeners();
  }

  fishEscaped() {
    const fish = this.lineState.hookedFish;
    if (!fish) return;
    
    fish.hooked = false;
    fish.escaping = true;
    this.lineState.hookedFish = null;
    this.stats.combo = 0; // Reset combo on escape
    
    // Add ripple where fish escaped
    this.addRipple(fish.x, fish.y, 25);
    
    this.notifyListeners();
    
    return true; // Return true to indicate fish escaped
  }

  // Ripple effects
  addRipple(x: number, y: number, maxRadius: number) {
    this.ripples.push({
      x,
      y,
      radius: 0,
      maxRadius,
      opacity: 1,
      growthRate: maxRadius / 20 // Grow to max in 20 frames
    });
  }

  updateRipples(deltaTime: number) {
    this.ripples = this.ripples.filter(ripple => {
      ripple.radius += ripple.growthRate;
      ripple.opacity = 1 - (ripple.radius / ripple.maxRadius);
      return ripple.opacity > 0;
    });
  }

  // State getters
  getLineState() { return { ...this.lineState }; }
  getPowerBar() { return { ...this.powerBar }; }
  getStats() { return { ...this.stats }; }
  getRipples() { return [...this.ripples]; }
  getFish() { return Array.from(this.gameFish.values()); }

  // Reset game
  reset() {
    this.lineState = {
      cast: false,
      x: 0,
      y: 0,
      depth: 0,
      targetDepth: 0,
      hasBait: true,
      tension: 0.5,
      hookedFish: null,
      reelSpeed: 0,
      castPower: 0
    };
    
    this.powerBar = {
      active: false,
      power: 0,
      perfect: false,
      targetZone: { min: 0.7, max: 0.85 }
    };
    
    this.stats = {
      score: 0,
      combo: 0,
      totalCatches: 0,
      perfectCasts: 0,
      totalCasts: 0
    };
    
    this.ripples = [];
    this.gameFish.clear();
    this.notifyListeners();
  }

  // Observer pattern for React components
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

// Export singleton instance
export const fishingGameState = new FishingGameStateService();