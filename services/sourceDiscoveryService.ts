/**
 * Source Discovery Service
 * Tracks and manages primary source discoveries in the game
 * Provides gameplay mechanics for finding, collecting, and learning from historical sources
 */

import { PrimarySourceMetadata } from './primarySourceService';
import { PlayerCharacter, MapData } from '../types';
import { toast } from 'react-toastify';

export interface DiscoveredSource {
  sourceId: string;
  discoveredAt: number; // timestamp
  discoveredLocation: string; // e.g., "Ancient Temple Ruins"
  discoveredYear: number; // in-game year
  readCount: number; // how many times player has read it
  notes?: string[]; // player annotations
}

export interface DiscoveryStats {
  totalDiscovered: number;
  byEra: Record<string, number>;
  byZone: Record<string, number>;
  discoveryRate: number; // sources per game day
  favoriteSource?: string; // most read source
  scholarshipPoints: number; // educational reward points
}

export interface DiscoveryReward {
  type: 'SKILL' | 'KNOWLEDGE' | 'REPUTATION' | 'ITEM' | 'ACHIEVEMENT';
  value: number | string;
  description: string;
}

class SourceDiscoveryService {
  private static instance: SourceDiscoveryService;
  private discoveredSources: Map<string, DiscoveredSource> = new Map();
  private scholarshipPoints: number = 0;
  private discoveryStreak: number = 0;
  private lastDiscoveryDay: number = 0;
  
  private constructor() {
    this.loadFromLocalStorage();
  }
  
  public static getInstance(): SourceDiscoveryService {
    if (!SourceDiscoveryService.instance) {
      SourceDiscoveryService.instance = new SourceDiscoveryService();
    }
    return SourceDiscoveryService.instance;
  }
  
  /**
   * Record a new source discovery
   */
  public discoverSource(
    source: PrimarySourceMetadata,
    location: string,
    gameYear: number,
    gameDay: number,
    player?: PlayerCharacter
  ): DiscoveryReward[] {
    const rewards: DiscoveryReward[] = [];
    
    // Check if already discovered
    if (this.discoveredSources.has(source.id)) {
      const existing = this.discoveredSources.get(source.id)!;
      existing.readCount++;
      this.saveToLocalStorage();
      return []; // No rewards for re-reading (yet)
    }
    
    // New discovery!
    const discovered: DiscoveredSource = {
      sourceId: source.id,
      discoveredAt: Date.now(),
      discoveredLocation: location,
      discoveredYear: gameYear,
      readCount: 1
    };
    
    this.discoveredSources.set(source.id, discovered);
    
    // Update discovery streak
    if (gameDay === this.lastDiscoveryDay + 1) {
      this.discoveryStreak++;
    } else if (gameDay !== this.lastDiscoveryDay) {
      this.discoveryStreak = 1;
    }
    this.lastDiscoveryDay = gameDay;
    
    // Calculate rewards based on source rarity and player skills
    const basePoints = this.calculateScholarshipPoints(source);
    this.scholarshipPoints += basePoints;
    
    rewards.push({
      type: 'KNOWLEDGE',
      value: basePoints,
      description: `+${basePoints} Scholarship Points`
    });
    
    // Skill rewards for relevant discoveries
    if (player) {
      if (source.keywords.includes('military') || source.keywords.includes('war')) {
        rewards.push({
          type: 'SKILL',
          value: 1,
          description: '+1 Combat Experience'
        });
      }
      
      if (source.keywords.includes('trade') || source.keywords.includes('commerce')) {
        rewards.push({
          type: 'SKILL',
          value: 1,
          description: '+1 Trading Skill'
        });
      }
      
      if (source.keywords.includes('religion') || source.keywords.includes('philosophy')) {
        rewards.push({
          type: 'SKILL',
          value: 1,
          description: '+1 Wisdom'
        });
      }
    }
    
    // Streak bonuses
    if (this.discoveryStreak >= 3) {
      rewards.push({
        type: 'REPUTATION',
        value: this.discoveryStreak,
        description: `Scholar's Reputation (${this.discoveryStreak} day streak)`
      });
    }
    
    // Milestone achievements
    const totalDiscovered = this.discoveredSources.size;
    if (totalDiscovered === 10) {
      rewards.push({
        type: 'ACHIEVEMENT',
        value: 'Budding Scholar',
        description: 'Discovered 10 primary sources!'
      });
    } else if (totalDiscovered === 25) {
      rewards.push({
        type: 'ACHIEVEMENT',
        value: 'Dedicated Researcher',
        description: 'Discovered 25 primary sources!'
      });
    } else if (totalDiscovered === 50) {
      rewards.push({
        type: 'ACHIEVEMENT',
        value: 'Master Historian',
        description: 'Discovered 50 primary sources!'
      });
    } else if (totalDiscovered === 100) {
      rewards.push({
        type: 'ACHIEVEMENT',
        value: 'Living Library',
        description: 'Discovered 100 primary sources!'
      });
    }
    
    // Show discovery notification
    this.showDiscoveryNotification(source, rewards);
    
    // Save progress
    this.saveToLocalStorage();
    
    return rewards;
  }
  
  /**
   * Calculate scholarship points based on source characteristics
   */
  private calculateScholarshipPoints(source: PrimarySourceMetadata): number {
    let points = 10; // Base value
    
    // Older sources are more valuable
    const age = new Date().getFullYear() - source.year;
    if (age > 2000) points += 10;
    else if (age > 1000) points += 5;
    else if (age > 500) points += 3;
    
    // Longer excerpts give more points
    if (source.longExcerpt && source.longExcerpt.length > 1000) {
      points += 5;
    }
    
    // Sources with Wikisource/Internet Archive links are more valuable
    if (source.wikisourceTitle) points += 3;
    if (source.internetArchiveId) points += 3;
    
    // Rare cultural zones get bonus
    const rareZones = ['NORTH_AMERICAN_PRE_COLUMBIAN', 'OCEANIA', 'SUB_SAHARAN_AFRICAN'];
    if (source.culturalZones.some(zone => rareZones.includes(zone))) {
      points += 5;
    }
    
    return points;
  }
  
  /**
   * Show toast notification for discovery
   */
  private showDiscoveryNotification(source: PrimarySourceMetadata, rewards: DiscoveryReward[]) {
    const mainMessage = `📜 Discovered: "${source.title}" by ${source.author} (${source.year})`;
    
    const rewardMessages = rewards
      .filter(r => r.type !== 'KNOWLEDGE') // Skip basic points in toast
      .map(r => r.description)
      .join(', ');
    
    const fullMessage = rewardMessages 
      ? `${mainMessage}\n🎁 ${rewardMessages}`
      : mainMessage;
    
    toast.success(fullMessage, {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }
  
  /**
   * Get discovery statistics
   */
  public getDiscoveryStats(): DiscoveryStats {
    const byEra: Record<string, number> = {};
    const byZone: Record<string, number> = {};
    let favoriteSource: string | undefined;
    let maxReadCount = 0;
    
    this.discoveredSources.forEach((discovered, sourceId) => {
      // Track favorite (most read)
      if (discovered.readCount > maxReadCount) {
        maxReadCount = discovered.readCount;
        favoriteSource = sourceId;
      }
    });
    
    // Calculate discovery rate (would need to track game days properly)
    const discoveryRate = this.discoveredSources.size / Math.max(1, this.lastDiscoveryDay);
    
    return {
      totalDiscovered: this.discoveredSources.size,
      byEra,
      byZone,
      discoveryRate,
      favoriteSource,
      scholarshipPoints: this.scholarshipPoints
    };
  }
  
  /**
   * Check if a source has been discovered
   */
  public isDiscovered(sourceId: string): boolean {
    return this.discoveredSources.has(sourceId);
  }
  
  /**
   * Get all discovered sources
   */
  public getDiscoveredSources(): Map<string, DiscoveredSource> {
    return new Map(this.discoveredSources);
  }
  
  /**
   * Add a note to a discovered source
   */
  public addNoteToSource(sourceId: string, note: string): void {
    const discovered = this.discoveredSources.get(sourceId);
    if (discovered) {
      if (!discovered.notes) {
        discovered.notes = [];
      }
      discovered.notes.push(note);
      this.saveToLocalStorage();
    }
  }
  
  /**
   * Get discovery percentage for an era/zone
   */
  public getDiscoveryProgress(filter?: { era?: string; zone?: string }): number {
    // This would need integration with primarySourceService to get total counts
    // For now, return a placeholder
    return Math.min(100, (this.discoveredSources.size / 200) * 100);
  }
  
  /**
   * Calculate discovery chance based on various factors
   */
  public calculateDiscoveryChance(
    baseChance: number,
    player?: PlayerCharacter,
    location?: string
  ): number {
    let chance = baseChance;
    
    // Intelligence/Wisdom bonus
    if (player) {
      const intBonus = (player.skills?.intelligence || 0) * 0.02;
      const wisBonus = (player.skills?.wisdom || 0) * 0.01;
      chance += intBonus + wisBonus;
    }
    
    // Location bonuses
    if (location) {
      if (location.includes('Library') || location.includes('University')) {
        chance += 0.2;
      } else if (location.includes('Temple') || location.includes('Church')) {
        chance += 0.1;
      } else if (location.includes('Ruins') || location.includes('Ancient')) {
        chance += 0.15;
      }
    }
    
    // Streak bonus
    if (this.discoveryStreak > 0) {
      chance += Math.min(0.1, this.discoveryStreak * 0.02);
    }
    
    return Math.min(1, chance); // Cap at 100%
  }
  
  /**
   * Save to localStorage
   */
  private saveToLocalStorage(): void {
    const data = {
      discoveredSources: Array.from(this.discoveredSources.entries()),
      scholarshipPoints: this.scholarshipPoints,
      discoveryStreak: this.discoveryStreak,
      lastDiscoveryDay: this.lastDiscoveryDay
    };
    localStorage.setItem('sourceDiscoveryData', JSON.stringify(data));
  }
  
  /**
   * Load from localStorage
   */
  private loadFromLocalStorage(): void {
    const stored = localStorage.getItem('sourceDiscoveryData');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.discoveredSources = new Map(data.discoveredSources || []);
        this.scholarshipPoints = data.scholarshipPoints || 0;
        this.discoveryStreak = data.discoveryStreak || 0;
        this.lastDiscoveryDay = data.lastDiscoveryDay || 0;
      } catch (error) {
        console.error('Failed to load discovery data:', error);
      }
    }
  }
  
  /**
   * Reset all discovery data (for new game)
   */
  public reset(): void {
    this.discoveredSources.clear();
    this.scholarshipPoints = 0;
    this.discoveryStreak = 0;
    this.lastDiscoveryDay = 0;
    this.saveToLocalStorage();
  }
}

export const sourceDiscoveryService = SourceDiscoveryService.getInstance();