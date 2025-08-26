/**
 * services/attributeBadgeService.ts - Generates and manages character attribute badges
 */

import { AttributeBadge, AttributeRarity, RARITY_WEIGHTS } from '../types/attributeTypes';
import { PlayerCharacter } from '../types';
import { NpcEntity } from '../types/npcTypes';
import { UNIVERSAL_ATTRIBUTES, CULTURAL_ATTRIBUTES, getApplicableAttributes } from '../constants/attributeDefinitions';

export class AttributeBadgeService {
  /**
   * Generate random attributes for a character based on their stats, era, and culture
   */
  static generateAttributes(
    character: PlayerCharacter | NpcEntity,
    year: number,
    geography: string,
    maxBadges: number = 3
  ): AttributeBadge[] {
    // Get all applicable attributes
    const applicable = getApplicableAttributes(character, year, geography);
    
    if (applicable.length === 0) return [];
    
    // Determine how many badges (0-maxBadges)
    const numBadges = this.rollBadgeCount(maxBadges);
    if (numBadges === 0) return [];
    
    // Select badges based on rarity
    const selected: AttributeBadge[] = [];
    const used = new Set<string>();
    
    for (let i = 0; i < numBadges && applicable.length > 0; i++) {
      const rarity = this.rollRarity();
      
      // Filter by rarity and not already used
      const candidates = applicable.filter(
        attr => attr.rarity === rarity && !used.has(attr.id)
      );
      
      if (candidates.length > 0) {
        const badge = candidates[Math.floor(Math.random() * candidates.length)];
        
        // Check exclusions
        if (badge.excludes) {
          const hasExcluded = badge.excludes.some(id => used.has(id));
          if (hasExcluded) continue;
        }
        
        // Check requirements
        if (badge.requires) {
          const hasRequired = badge.requires.every(id => used.has(id));
          if (!hasRequired) continue;
        }
        
        selected.push(badge);
        used.add(badge.id);
      }
    }
    
    return selected;
  }
  
  /**
   * Roll for number of badges (weighted towards fewer)
   */
  private static rollBadgeCount(max: number): number {
    const roll = Math.random();
    if (roll < 0.4) return 0; // 40% have no badges
    if (roll < 0.7) return 1; // 30% have 1 badge
    if (roll < 0.9) return Math.min(2, max); // 20% have 2 badges
    return Math.min(3, max); // 10% have 3 badges
  }
  
  /**
   * Roll for attribute rarity
   */
  private static rollRarity(): AttributeRarity {
    const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    
    for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
      roll -= weight;
      if (roll <= 0) {
        return rarity as AttributeRarity;
      }
    }
    
    return 'common';
  }
  
  /**
   * Get specific attribute by ID
   */
  static getAttributeById(id: string): AttributeBadge | undefined {
    return [...UNIVERSAL_ATTRIBUTES, ...CULTURAL_ATTRIBUTES].find(attr => attr.id === id);
  }
  
  /**
   * Apply attribute effects to character
   */
  static applyAttributeEffects(
    character: PlayerCharacter | NpcEntity,
    attributes: AttributeBadge[]
  ): void {
    for (const attr of attributes) {
      if (!attr.effect) continue;
      
      // Parse effect strings and apply
      // This would be expanded based on specific effect implementations
      if (attr.effect.includes('+')) {
        const match = attr.effect.match(/\+(\d+) to (\w+)/);
        if (match) {
          const [, value, stat] = match;
          // Apply stat modification
          if (stat === 'combat' && 'combat' in character) {
            (character as any).combatBonus = ((character as any).combatBonus || 0) + parseInt(value);
          }
        }
      }
    }
  }
  
  /**
   * Check if character should have a specific attribute
   */
  static shouldHaveAttribute(
    character: PlayerCharacter | NpcEntity,
    attributeId: string,
    year: number,
    geography: string
  ): boolean {
    const attr = this.getAttributeById(attributeId);
    if (!attr) return false;
    
    // Check year range
    if (attr.yearRange) {
      if (year < attr.yearRange[0] || year > attr.yearRange[1]) {
        return false;
      }
    }
    
    // Check geography
    if (attr.requiredGeography && !attr.requiredGeography.includes(geography)) {
      return false;
    }
    
    // Check condition
    if (attr.condition && !attr.condition(character)) {
      return false;
    }
    
    return true;
  }
}