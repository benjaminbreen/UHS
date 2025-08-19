/**
 * Seed Service
 * Provides deterministic random number generation using seed values
 * Ensures reproducible game states across sessions
 */

export class SeededRandom {
  private seed: number;
  private originalSeed: string;
  
  constructor(seed?: string) {
    this.originalSeed = seed || this.generateRandomSeed();
    this.seed = this.hashSeed(this.originalSeed);
  }
  
  /**
   * Generate a random 8-character seed
   */
  private generateRandomSeed(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }
  
  /**
   * Convert string seed to numeric seed using hash
   */
  private hashSeed(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * Generate next random number using Linear Congruential Generator
   * Returns value between 0 and 1
   */
  random(): number {
    // LCG parameters (from Numerical Recipes)
    const a = 1664525;
    const c = 1013904223;
    const m = 2 ** 32;
    
    this.seed = (a * this.seed + c) % m;
    return this.seed / m;
  }
  
  /**
   * Generate random integer between min and max (inclusive)
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }
  
  /**
   * Generate random float between min and max
   */
  randomFloat(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }
  
  /**
   * Pick random element from array
   */
  randomChoice<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[this.randomInt(0, array.length - 1)];
  }
  
  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  
  /**
   * Generate random boolean with optional probability
   */
  randomBool(probability: number = 0.5): boolean {
    return this.random() < probability;
  }
  
  /**
   * Generate normally distributed random number
   */
  randomGaussian(mean: number = 0, stdDev: number = 1): number {
    // Box-Muller transform
    let u = 0, v = 0;
    while (u === 0) u = this.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = this.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z0 * stdDev + mean;
  }
  
  /**
   * Get the original seed string
   */
  getSeed(): string {
    return this.originalSeed;
  }
  
  /**
   * Create a new instance with same seed
   */
  clone(): SeededRandom {
    return new SeededRandom(this.originalSeed);
  }
}

/**
 * Global seed manager for game state
 */
export class SeedManager {
  private static instance: SeedManager;
  private mainRandom: SeededRandom;
  private contexts: Map<string, SeededRandom> = new Map();
  
  private constructor(seed?: string) {
    this.mainRandom = new SeededRandom(seed);
  }
  
  /**
   * Initialize or get singleton instance
   */
  static getInstance(seed?: string): SeedManager {
    if (!SeedManager.instance || seed) {
      SeedManager.instance = new SeedManager(seed);
    }
    return SeedManager.instance;
  }
  
  /**
   * Get the main random generator
   */
  getRandom(): SeededRandom {
    return this.mainRandom;
  }
  
  /**
   * Get or create a random generator for a specific context
   * This ensures different game systems use independent random streams
   */
  getContextRandom(context: string): SeededRandom {
    if (!this.contexts.has(context)) {
      // Create new generator with seed derived from main seed + context
      const contextSeed = this.mainRandom.getSeed() + '_' + context;
      this.contexts.set(context, new SeededRandom(contextSeed));
    }
    return this.contexts.get(context)!;
  }
  
  /**
   * Get the current seed
   */
  getSeed(): string {
    return this.mainRandom.getSeed();
  }
  
  /**
   * Reset with new seed
   */
  reset(seed?: string): void {
    this.mainRandom = new SeededRandom(seed);
    this.contexts.clear();
  }
  
  /**
   * Create shareable URL with seed
   */
  createShareableURL(baseURL: string): string {
    const seed = this.getSeed();
    const url = new URL(baseURL);
    
    // Append seed to existing path or create new path
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    // Ensure we have 4 segments (date/geography/mode/seed)
    while (pathSegments.length < 3) {
      pathSegments.push('random');
    }
    
    // Add or replace seed (4th segment)
    if (pathSegments.length >= 4) {
      pathSegments[3] = seed;
    } else {
      pathSegments.push(seed);
    }
    
    url.pathname = '/' + pathSegments.join('/');
    return url.toString();
  }
  
  /**
   * Get random contexts for different game systems
   */
  static readonly CONTEXTS = {
    MAP_GENERATION: 'map',
    NPC_GENERATION: 'npc',
    ITEM_GENERATION: 'item',
    QUEST_GENERATION: 'quest',
    EVENT_GENERATION: 'event',
    WEATHER_GENERATION: 'weather',
    DISEASE_GENERATION: 'disease',
    TRADE_GENERATION: 'trade',
    COMBAT: 'combat',
    DIALOGUE: 'dialogue'
  } as const;
}

/**
 * Hook for using seeded random in React components
 */
export function useSeededRandom(context?: string): SeededRandom {
  const manager = SeedManager.getInstance();
  return context ? manager.getContextRandom(context) : manager.getRandom();
}

/**
 * Generate a shareable game configuration code
 */
export function generateGameCode(seed: string, config?: {
  year?: number;
  culturalZone?: string;
  gameMode?: string;
}): string {
  // Encode configuration into a compact string
  const parts = [
    seed,
    config?.year?.toString() || '0',
    config?.culturalZone?.[0] || 'X',
    config?.gameMode?.[0] || 'X'
  ];
  
  return parts.join('-');
}

/**
 * Parse a game configuration code
 */
export function parseGameCode(code: string): {
  seed: string;
  year?: number;
  culturalZone?: string;
  gameMode?: string;
} {
  const parts = code.split('-');
  
  return {
    seed: parts[0] || '',
    year: parts[1] && parts[1] !== '0' ? parseInt(parts[1]) : undefined,
    culturalZone: parts[2] && parts[2] !== 'X' ? parts[2] : undefined,
    gameMode: parts[3] && parts[3] !== 'X' ? parts[3] : undefined
  };
}