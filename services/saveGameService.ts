/**
 * Save Game Service
 * Manages saving and loading game states to localStorage
 * Phases 1-2: Core state + NPCs, Quests, Inventory
 */

import { PlayerCharacter, MapData, NpcEntity, HomeAnchor } from '../types';
import { Quest } from '../types/questTypes';
import { EventHistoryEntry } from '../types/eventTypes';
import { GameLogEntry, PlayerJournalEntry, JournalQuote } from '../types/journal';
import { AssessmentSession, AssessmentLogState, AssessmentLLMResult } from '../types/assessment';

/**
 * Complete saved game state
 */
export interface SavedGame {
  // Metadata
  id: string;
  name: string;
  timestamp: number;
  thumbnailEmoji: string;
  version: string;
  playTime: number; // minutes played

  // Phase 1: Core state
  playerCharacter: PlayerCharacter;
  mapData: MapData;
  mapSeed: string;
  currentLocation: { x: number; y: number };
  year: number;
  month: number;
  day: number;
  timeOfDay: number;
  gameMode: string;
  zone: string;
  region: string;
  mapArea: string;
  homeAnchor?: HomeAnchor | null;

  // Phase 2: Extended state
  npcs?: NpcEntity[];
  activeQuests?: Quest[];
  completedQuests?: Quest[];
  eventHistory?: EventHistoryEntry[];
  reputation?: number;
  mapReputation?: number;

  // Phase 3: Assessment & Educational Data
  gameLog?: GameLogEntry[];
  playerJournal?: PlayerJournalEntry[];
  assessmentSession?: AssessmentSession | null;
  assessmentLogs?: AssessmentLogState;
  llmAnalysis?: AssessmentLLMResult | null;
  learningProgress?: any[];
  journalQuotes?: JournalQuote[];

  // Additional context
  isInSpecialMap?: boolean;
  specialMapData?: any;
  weatherState?: any;
  ambianceState?: any;
}

/**
 * Service for managing saved games
 */
class SaveGameService {
  private readonly MAX_SAVES = 10;
  private readonly STORAGE_KEY = 'uhs_saved_games';
  private readonly VERSION = '1.0.0';
  
  /**
   * Get all saved games from localStorage
   */
  getSavedGames(): SavedGame[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return [];
      
      const games = JSON.parse(saved);
      // Sort by timestamp, newest first
      return games.sort((a: SavedGame, b: SavedGame) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('[SaveGameService] Error loading saved games:', error);
      return [];
    }
  }
  
  /**
   * Save the current game state
   */
  saveGame(
    name: string,
    gameState: {
      playerCharacter: PlayerCharacter;
      mapData: MapData;
      mapSeed: string;
      currentLocation: { x: number; y: number };
      year: number;
      month: number;
      day: number;
      timeOfDay: number;
      gameMode: string;
      zone: string;
      region: string;
      mapArea: string;
      homeAnchor?: HomeAnchor | null;
      npcs?: NpcEntity[];
      activeQuests?: Quest[];
      completedQuests?: Quest[];
      eventHistory?: EventHistoryEntry[];
      gameLog?: GameLogEntry[];
      playerJournal?: PlayerJournalEntry[];
      assessmentSession?: AssessmentSession | null;
      assessmentLogs?: AssessmentLogState;
      llmAnalysis?: AssessmentLLMResult | null;
      learningProgress?: any[];
      journalQuotes?: JournalQuote[];
      isInSpecialMap?: boolean;
      specialMapData?: any;
      weatherState?: any;
      ambianceState?: any;
      playTime?: number;
    }
  ): { success: boolean; error?: string; saveId?: string } {
    try {
      const saves = this.getSavedGames();
      
      // Generate unique ID
      const saveId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create thumbnail emoji based on location/terrain
      const thumbnailEmoji = this.getLocationEmoji(gameState.mapData, gameState.zone);
      
      // Create new save
      const newSave: SavedGame = {
        id: saveId,
        name: name || `Save ${saves.length + 1}`,
        timestamp: Date.now(),
        thumbnailEmoji,
        version: this.VERSION,
        playTime: gameState.playTime || 0,

        // Core state
        playerCharacter: this.cleanPlayerCharacter(gameState.playerCharacter),
        mapData: this.compressMapData(gameState.mapData),
        mapSeed: gameState.mapSeed,
        currentLocation: gameState.currentLocation,
        year: gameState.year,
        month: gameState.month,
        day: gameState.day,
        timeOfDay: gameState.timeOfDay,
        gameMode: gameState.gameMode,
        zone: gameState.zone,
        region: gameState.region,
        mapArea: gameState.mapArea,
        homeAnchor: gameState.homeAnchor,

        // Extended state
        npcs: gameState.npcs ? this.cleanNpcs(gameState.npcs) : undefined,
        activeQuests: gameState.activeQuests,
        completedQuests: gameState.completedQuests,
        eventHistory: gameState.eventHistory,
        reputation: gameState.playerCharacter.reputation,
        mapReputation: gameState.playerCharacter.mapReputation,

        // Assessment & Educational Data
        gameLog: gameState.gameLog,
        playerJournal: gameState.playerJournal,
        assessmentSession: gameState.assessmentSession,
        assessmentLogs: gameState.assessmentLogs,
        llmAnalysis: gameState.llmAnalysis,
        learningProgress: gameState.learningProgress,
        journalQuotes: gameState.journalQuotes,

        // Additional context
        isInSpecialMap: gameState.isInSpecialMap,
        specialMapData: gameState.specialMapData,
        weatherState: gameState.weatherState,
        ambianceState: gameState.ambianceState
      };
      
      // Check storage limit
      if (saves.length >= this.MAX_SAVES) {
        // Remove oldest save
        saves.pop();
      }
      
      // Add new save at the beginning
      saves.unshift(newSave);
      
      // Save to localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saves));
      
      console.log(`[SaveGameService] Game saved successfully: ${name}`);
      return { success: true, saveId };
      
    } catch (error) {
      console.error('[SaveGameService] Error saving game:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  /**
   * Load a saved game by ID
   */
  loadGame(saveId: string): SavedGame | null {
    try {
      const saves = this.getSavedGames();
      const save = saves.find(s => s.id === saveId);
      
      if (!save) {
        console.error(`[SaveGameService] Save not found: ${saveId}`);
        return null;
      }
      
      // Decompress map data
      if (save.mapData) {
        save.mapData = this.decompressMapData(save.mapData);
      }
      
      console.log(`[SaveGameService] Game loaded: ${save.name}`);
      return save;
      
    } catch (error) {
      console.error('[SaveGameService] Error loading game:', error);
      return null;
    }
  }
  
  /**
   * Delete a saved game
   */
  deleteGame(saveId: string): boolean {
    try {
      const saves = this.getSavedGames();
      const filtered = saves.filter(s => s.id !== saveId);
      
      if (filtered.length === saves.length) {
        console.warn(`[SaveGameService] Save not found for deletion: ${saveId}`);
        return false;
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      console.log(`[SaveGameService] Game deleted: ${saveId}`);
      return true;
      
    } catch (error) {
      console.error('[SaveGameService] Error deleting game:', error);
      return false;
    }
  }
  
  /**
   * Clear all saved games
   */
  clearAllSaves(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('[SaveGameService] All saves cleared');
  }
  
  /**
   * Get a descriptive emoji for the current location
   */
  private getLocationEmoji(mapData: MapData, zone: string): string {
    // Check for special map types
    if (mapData.specialMapType) {
      const specialEmojis: Record<string, string> = {
        'palace': '🏛️',
        'government': '⚖️',
        'marketplace': '🏪',
        'temple': '🛕',
        'sacred': '⛪',
        'fortress': '🏰',
        'estate': '🏡',
        'court': '👑'
      };
      
      for (const [key, emoji] of Object.entries(specialEmojis)) {
        if (mapData.specialMapType.toLowerCase().includes(key)) {
          return emoji;
        }
      }
    }
    
    // Zone-based emojis
    const zoneEmojis: Record<string, string> = {
      'Europe': '🏰',
      'MENA': '🕌',
      'Africa': '🦁',
      'Asia': '🏯',
      'Americas': '🦅',
      'Oceania': '🏝️',
      'North America': '🏔️',
      'South America': '🌳',
      'East Asia': '⛩️',
      'South Asia': '🕉️',
      'Southeast Asia': '🛕',
      'Central Asia': '🏇'
    };
    
    // Check terrain composition
    if (mapData.tiles) {
      let waterCount = 0;
      let forestCount = 0;
      let desertCount = 0;
      let mountainCount = 0;
      
      const sampleSize = Math.min(100, mapData.tiles.length);
      for (let i = 0; i < sampleSize; i++) {
        const tile = mapData.tiles[i];
        if (tile.terrain === 'water' || tile.terrain === 'ocean') waterCount++;
        else if (tile.terrain === 'forest') forestCount++;
        else if (tile.terrain === 'desert') desertCount++;
        else if (tile.terrain === 'mountain') mountainCount++;
      }
      
      if (waterCount > 50) return '🌊';
      if (forestCount > 30) return '🌲';
      if (desertCount > 30) return '🏜️';
      if (mountainCount > 20) return '⛰️';
    }
    
    return zoneEmojis[zone] || '🗺️';
  }
  
  /**
   * Clean player character data for storage
   */
  private cleanPlayerCharacter(pc: PlayerCharacter): PlayerCharacter {
    // Remove circular references and unnecessary data
    const cleaned = { ...pc };
    
    // Remove any potential circular references
    if (cleaned.party) {
      cleaned.party = cleaned.party.map(member => ({
        ...member,
        mapData: undefined // Remove map reference from party members
      } as any));
    }
    
    return cleaned;
  }
  
  /**
   * Compress map data to reduce storage size
   */
  private compressMapData(mapData: MapData): MapData {
    // For now, just remove very large arrays that can be regenerated
    const compressed = { ...mapData };
    
    // Keep essential tile data but remove visual-only properties
    if (compressed.tiles && compressed.tiles.length > 1000) {
      // Store only a subset of tiles or compress them
      // For Phase 1, we'll keep all tiles but could optimize later
    }
    
    return compressed;
  }
  
  /**
   * Decompress map data after loading
   */
  private decompressMapData(mapData: MapData): MapData {
    // Restore any compressed data
    return mapData;
  }
  
  /**
   * Clean NPC data for storage
   */
  private cleanNpcs(npcs: NpcEntity[]): NpcEntity[] {
    return npcs.map(npc => ({
      ...npc,
      mapData: undefined // Remove map reference
    } as any));
  }
  
  /**
   * Format a relative time string
   */
  formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    
    return new Date(timestamp).toLocaleDateString();
  }
}

// Export singleton instance
export const saveGameService = new SaveGameService();
