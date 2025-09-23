/**
 * Dream Service - Generates simple dreams based on recent gamelog entries
 */

import { GameLogEntry } from '../types/journal';

class DreamService {
  private static instance: DreamService;

  private constructor() {}

  public static getInstance(): DreamService {
    if (!DreamService.instance) {
      DreamService.instance = new DreamService();
    }
    return DreamService.instance;
  }

  /**
   * Extract memorable elements from gamelog entries
   */
  private extractElements(logs: GameLogEntry[]): { locations: string[], npcs: string[], items: string[], actions: string[] } {
    const locations: string[] = [];
    const npcs: string[] = [];
    const items: string[] = [];
    const actions: string[] = [];

    logs.forEach(log => {
      // Extract locations from MAP_ENTRY logs
      if (log.type === 'MAP_ENTRY' && log.summary) {
        const match = log.summary.match(/Entered (.+)$/);
        if (match) locations.push(match[1]);
      }

      // Extract NPCs from DIALOGUE logs
      if (log.type === 'DIALOGUE' && log.summary) {
        const match = log.summary.match(/Spoke with (.+)$/);
        if (match) npcs.push(match[1]);
      }

      // Extract items from ITEM_ACQUIRED or TRADE logs
      if ((log.type === 'ITEM_ACQUIRED' || log.type === 'TRADE') && log.summary) {
        const itemMatch = log.summary.match(/(?:Found|Bought|Sold) (.+?)(?:\s+for|$)/);
        if (itemMatch) items.push(itemMatch[1]);
      }

      // Extract combat entities
      if (log.type === 'COMBAT' && log.summary) {
        const combatMatch = log.summary.match(/(?:Fought|Defeated) (.+)$/);
        if (combatMatch) npcs.push(combatMatch[1]);
      }
    });

    // Add some fallback elements if we don't have enough data
    if (locations.length === 0) locations.push('a distant land', 'the void', 'nowhere');
    if (npcs.length === 0) npcs.push('a stranger', 'someone you forgot', 'yourself');
    if (items.length === 0) items.push('something precious', 'nothing', 'a memory');

    return { locations, npcs, items, actions };
  }

  /**
   * Generate a simple one-sentence dream based on gamelog
   */
  public generateDreamFromGamelog(gamelog: GameLogEntry[]): string {
    const elements = this.extractElements(gamelog);

    // Helper to get random element
    const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    // If we have real elements from the gamelog, use them
    if (elements.locations.length > 0 && !elements.locations.includes('a distant land')) {
      const options = [
        `You dreamt of ${pick(elements.locations)}.`,
        `You dreamt of ${pick(elements.npcs)}.`,
        `You dreamt of ${pick(elements.items)}.`,
      ];
      return pick(options);
    }

    // Otherwise fall back to simple animal dreams
    return this.generateSimpleDream();
  }

  /**
   * Simple fallback dream using animals from the game
   */
  public generateSimpleDream(): string {
    // Common animals from the game
    const animals = [
      'a deer grazing in moonlight',
      'wolves howling in the distance',
      'a bear fishing in a stream',
      'foxes playing in the snow',
      'an eagle soaring overhead',
      'rabbits in a meadow',
      'a boar rooting through leaves',
      'butterflies in a garden',
      'fish swimming upstream',
      'horses running free',
      'cats stalking through shadows',
      'dogs by a warm fire',
      'sheep on a hillside',
      'cattle in a field',
      'chickens pecking at grain'
    ];

    return `You dreamt of ${animals[Math.floor(Math.random() * animals.length)]}.`;
  }

  /**
   * Generate dream emojis
   */
  public getDreamEmojis(): string {
    const dreamEmojis = ['🌙', '⭐', '☁️', '🌊', '🔮', '🦋', '🌈', '💫', '🕯️', '🎭', '🗝️', '🌸'];
    const count = 3 + Math.floor(Math.random() * 3); // 3-5 emojis
    let sequence = '';

    for (let i = 0; i < count; i++) {
      sequence += dreamEmojis[Math.floor(Math.random() * dreamEmojis.length)];
      if (i < count - 1) sequence += ' ';
    }

    return sequence;
  }
}

export const dreamService = DreamService.getInstance();
export default dreamService;