/**
 * Service for generating and caching special map backgrounds
 */

import { SpecialMapArchetype, SpecialMapConfig } from '../types/specialMapTypes';
import { HistoricalEra } from '../types';

// IndexedDB configuration
const DB_NAME = 'SpecialMapBackgrounds';
const DB_VERSION = 1;
const STORE_NAME = 'backgrounds';
const CACHE_EXPIRY_DAYS = 30;

interface BackgroundCacheEntry {
  key: string;
  imageUrl: string;
  prompt: string;
  timestamp: number;
  archetype: SpecialMapArchetype;
  culturalZone: string;
  era: HistoricalEra;
}

class SpecialMapBackgroundService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB for caching
   */
  private async initDB(): Promise<void> {
    if (this.db) return;
    
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[BackgroundService] Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[BackgroundService] IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('archetype', 'archetype', { unique: false });
        }
      };
    });

    await this.initPromise;
  }

  /**
   * Generate a unique cache key for a special map configuration
   */
  private generateCacheKey(config: SpecialMapConfig): string {
    return `${config.archetype}_${config.culturalZone}_${config.era}_${config.region || 'default'}`;
  }

  /**
   * Generate appropriate prompt for background image
   */
  private generatePrompt(config: SpecialMapConfig): string {
    const { archetype, culturalZone, era } = config;
    
    // Base prompts by archetype
    const archetypePrompts: Record<SpecialMapArchetype, string> = {
      [SpecialMapArchetype.PALACE_COMPLEX]: 'ornate palace interior, grand hall',
      [SpecialMapArchetype.MARKET_BAZAAR]: 'bustling covered market, merchant stalls',
      [SpecialMapArchetype.GOVERNMENT_FORUM]: 'government assembly hall, official chamber',
      [SpecialMapArchetype.MILITARY_FORTRESS]: 'fortress interior, military stronghold',
      [SpecialMapArchetype.SACRED_COMPLEX]: 'sacred temple interior, religious sanctuary',
      [SpecialMapArchetype.UNIVERSITY]: 'academic library, university hall',
      [SpecialMapArchetype.THEATER]: 'theater interior, performance venue',
      [SpecialMapArchetype.ARENA]: 'arena interior, sports venue',
      [SpecialMapArchetype.EXHIBITION]: 'exhibition hall, museum interior',
      [SpecialMapArchetype.OPEN_FIELD]: 'ceremonial field, outdoor gathering'
    };
    
    // Cultural modifiers
    const culturalModifiers: Record<string, string> = {
      'EAST_ASIAN': 'East Asian architecture, wooden beams, paper screens',
      'MENA': 'Islamic architecture, geometric patterns, arched doorways',
      'EUROPEAN': 'European architecture, stone walls, vaulted ceilings',
      'AFRICAN': 'African architecture, earthen walls, traditional patterns',
      'AMERICAS': 'Pre-Columbian architecture, stone carvings, ceremonial space',
      'OCEANIA': 'Pacific Island architecture, wooden structures, open design',
      'NOMADIC': 'nomadic tent interior, fabric walls, portable structure'
    };
    
    // Era modifiers
    const eraModifiers: Record<HistoricalEra, string> = {
      [HistoricalEra.PREHISTORY]: 'prehistoric, primitive, ancient cave',
      [HistoricalEra.ANTIQUITY]: 'classical antiquity, ancient civilization',
      [HistoricalEra.MEDIEVAL]: 'medieval period, middle ages',
      [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 'renaissance period, ornate decorations',
      [HistoricalEra.INDUSTRIAL_ERA]: 'industrial era, Victorian style',
      [HistoricalEra.MODERN_ERA]: 'early 20th century, art deco',
      [HistoricalEra.CONTEMPORARY]: 'mid-20th century, modernist'
    };
    
    // Special additions for specific combinations
    let specialAdditions = '';
    
    if (archetype === SpecialMapArchetype.PALACE_COMPLEX) {
      if (culturalZone === 'EAST_ASIAN') {
        specialAdditions = ', red pillars, golden dragons, imperial throne';
      } else if (culturalZone === 'MENA') {
        specialAdditions = ', marble floors, fountain courtyard, arabesque tiles';
      } else if (culturalZone === 'EUROPEAN' && era === HistoricalEra.MEDIEVAL) {
        specialAdditions = ', tapestries, coat of arms, throne room';
      }
    } else if (archetype === SpecialMapArchetype.SACRED_COMPLEX) {
      if (culturalZone === 'MENA') {
        specialAdditions = ', mosque interior, mihrab, calligraphy';
      } else if (culturalZone === 'EUROPEAN') {
        specialAdditions = ', cathedral interior, stained glass, altar';
      } else if (culturalZone === 'EAST_ASIAN') {
        specialAdditions = ', temple interior, Buddha statue, incense';
      }
    }
    
    // Construct final prompt
    const basePrompt = archetypePrompts[archetype] || 'historical interior';
    const cultural = culturalModifiers[culturalZone] || '';
    const temporal = eraModifiers[era] || '';
    
    return `${basePrompt}, ${cultural}, ${temporal}${specialAdditions}, architectural photography, wide angle view, natural lighting, highly detailed, photorealistic`;
  }

  /**
   * Get cached background or generate new one
   */
  async getBackground(config: SpecialMapConfig): Promise<string> {
    await this.initDB();
    
    const cacheKey = this.generateCacheKey(config);
    
    // Check cache first
    const cached = await this.getCachedBackground(cacheKey);
    if (cached) {
      console.log('[BackgroundService] Using cached background for:', cacheKey);
      return cached.imageUrl;
    }
    
    // Generate new background
    console.log('[BackgroundService] Generating new background for:', cacheKey);
    const prompt = this.generatePrompt(config);
    
    // For now, return a gradient fallback
    // In production, this would call the Imagen API
    const fallbackGradient = this.getFallbackGradient(config);
    
    // Cache the result
    await this.cacheBackground({
      key: cacheKey,
      imageUrl: fallbackGradient,
      prompt,
      timestamp: Date.now(),
      archetype: config.archetype,
      culturalZone: config.culturalZone,
      era: config.era
    });
    
    return fallbackGradient;
  }

  /**
   * Get cached background from IndexedDB
   */
  private async getCachedBackground(key: string): Promise<BackgroundCacheEntry | null> {
    if (!this.db) return null;
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const entry = request.result as BackgroundCacheEntry | undefined;
        
        if (entry) {
          // Check if cache is expired
          const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
          if (Date.now() - entry.timestamp > expiryTime) {
            console.log('[BackgroundService] Cache expired for:', key);
            this.removeCachedBackground(key);
            resolve(null);
          } else {
            resolve(entry);
          }
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => {
        console.error('[BackgroundService] Failed to get cached background:', request.error);
        resolve(null);
      };
    });
  }

  /**
   * Cache a background in IndexedDB
   */
  private async cacheBackground(entry: BackgroundCacheEntry): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(entry);
      
      request.onsuccess = () => {
        console.log('[BackgroundService] Cached background:', entry.key);
        resolve();
      };
      
      request.onerror = () => {
        console.error('[BackgroundService] Failed to cache background:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Remove expired cached background
   */
  private async removeCachedBackground(key: string): Promise<void> {
    if (!this.db) return;
    
    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(key);
  }

  /**
   * Get fallback gradient for when image generation fails
   */
  private getFallbackGradient(config: SpecialMapConfig): string {
    const { archetype, culturalZone } = config;
    
    // Return CSS gradient strings
    const gradients: Record<string, string> = {
      'PALACE_EAST_ASIAN': 'linear-gradient(180deg, #8B0000 0%, #FFD700 50%, #8B0000 100%)',
      'PALACE_MENA': 'linear-gradient(180deg, #1E3A8A 0%, #FFD700 50%, #1E3A8A 100%)',
      'PALACE_EUROPEAN': 'linear-gradient(180deg, #4B0082 0%, #FFD700 50%, #4B0082 100%)',
      'MARKET_MENA': 'linear-gradient(180deg, #8B4513 0%, #FFE4B5 50%, #8B4513 100%)',
      'SACRED_MENA': 'linear-gradient(180deg, #006400 0%, #FFD700 50%, #006400 100%)',
      'SACRED_EUROPEAN': 'linear-gradient(180deg, #191970 0%, #87CEEB 50%, #191970 100%)',
      'DEFAULT': 'linear-gradient(180deg, #2D3748 0%, #4A5568 50%, #2D3748 100%)'
    };
    
    const key = `${archetype.split('_')[0]}_${culturalZone}`;
    return gradients[key] || gradients.DEFAULT;
  }

  /**
   * Clear all cached backgrounds
   */
  async clearCache(): Promise<void> {
    if (!this.db) return;
    
    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
    console.log('[BackgroundService] Cache cleared');
  }
}

// Export singleton instance
export const specialMapBackgroundService = new SpecialMapBackgroundService();