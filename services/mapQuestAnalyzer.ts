/**
 * Map Quest Analyzer
 * Extracts quest-relevant locations from generated maps for WorldWeaver integration
 */

import { MapData, BiomeType } from '../types';

export interface QuestLocation {
  type: string;
  coordinates: { x: number; y: number };
  description: string;
  suitable_for: string[];
  distance: number;
  biome: BiomeType;
}

export class MapQuestAnalyzer {

  /**
   * Extract all quest-relevant locations from the map
   */
  extractQuestLocations(mapData: MapData, playerLocation: { x: number; y: number }): QuestLocation[] {
    const locations: QuestLocation[] = [];
    const QUEST_BIOMES = [
      BiomeType.CITY_CENTER,
      BiomeType.MARKETPLACE,
      BiomeType.PALACE,
      BiomeType.HOLY_SITE,
      BiomeType.RUINS,
      BiomeType.FARMLAND,
      BiomeType.DENSE_CITY,
      BiomeType.LOW_DENSITY_CITY,
      BiomeType.GOVERNMENT_DISTRICT,
      BiomeType.HARBOR_DISTRICT,
      BiomeType.INDUSTRIAL_DISTRICT
    ];

    console.log('[MapQuestAnalyzer] Scanning map for quest locations...');

    // Scan all tiles for quest-relevant locations
    mapData.tiles.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (QUEST_BIOMES.includes(tile.biome)) {
          const distance = this.getDistance({ x, y }, playerLocation);

          // Only include locations within reasonable range (8-60 tiles)
          if (distance >= 8 && distance <= 60) {
            locations.push({
              type: this.biomeToQuestType(tile.biome),
              coordinates: { x, y },
              description: this.generateLocationDescription(tile.biome, x, y, playerLocation),
              suitable_for: this.getSuitableQuestTypes(tile.biome),
              distance,
              biome: tile.biome
            });
          }
        }
      });
    });

    console.log(`[MapQuestAnalyzer] Found ${locations.length} potential quest locations`);

    // Sort by distance and return top 8 locations for variety
    const sortedLocations = locations
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 8);

    console.log(`[MapQuestAnalyzer] Selected ${sortedLocations.length} locations for quest generation:`,
      sortedLocations.map(loc => `${loc.type} at (${loc.coordinates.x}, ${loc.coordinates.y})`));

    return sortedLocations;
  }

  /**
   * Convert biome type to human-readable quest location type
   */
  private biomeToQuestType(biome: BiomeType): string {
    const mapping = {
      [BiomeType.CITY_CENTER]: 'city center',
      [BiomeType.MARKETPLACE]: 'marketplace',
      [BiomeType.PALACE]: 'palace',
      [BiomeType.HOLY_SITE]: 'temple',
      [BiomeType.RUINS]: 'ancient ruins',
      [BiomeType.FARMLAND]: 'farm',
      [BiomeType.DENSE_CITY]: 'urban district',
      [BiomeType.LOW_DENSITY_CITY]: 'town district',
      [BiomeType.GOVERNMENT_DISTRICT]: 'government building',
      [BiomeType.HARBOR_DISTRICT]: 'harbor',
      [BiomeType.INDUSTRIAL_DISTRICT]: 'workshop district'
    };
    return mapping[biome] || 'location';
  }

  /**
   * Determine what quest objective types are suitable for each location type
   */
  private getSuitableQuestTypes(biome: BiomeType): string[] {
    const suitability = {
      [BiomeType.MARKETPLACE]: ['talk_to_npc', 'collect_item', 'deliver_item'],
      [BiomeType.FARMLAND]: ['talk_to_npc', 'collect_item'],
      [BiomeType.PALACE]: ['talk_to_npc', 'deliver_item'],
      [BiomeType.GOVERNMENT_DISTRICT]: ['talk_to_npc', 'deliver_item'],
      [BiomeType.HOLY_SITE]: ['visit_location', 'talk_to_npc'],
      [BiomeType.RUINS]: ['visit_location', 'collect_item'],
      [BiomeType.CITY_CENTER]: ['talk_to_npc', 'deliver_item'],
      [BiomeType.DENSE_CITY]: ['talk_to_npc', 'visit_location'],
      [BiomeType.LOW_DENSITY_CITY]: ['talk_to_npc', 'visit_location'],
      [BiomeType.HARBOR_DISTRICT]: ['talk_to_npc', 'collect_item'],
      [BiomeType.INDUSTRIAL_DISTRICT]: ['talk_to_npc', 'collect_item', 'deliver_item']
    };
    return suitability[biome] || ['visit_location'];
  }

  /**
   * Generate natural language description of location relative to player
   */
  private generateLocationDescription(biome: BiomeType, x: number, y: number, playerLocation: { x: number; y: number }): string {
    const direction = this.getCardinalDirection(playerLocation, { x, y });
    const distance = this.getDistance({ x, y }, playerLocation);
    const distanceDesc = this.getDistanceDescription(distance);

    const locationName = this.biomeToQuestType(biome);

    return `${locationName} ${distanceDesc} to the ${direction}`;
  }

  /**
   * Get cardinal direction from one point to another
   */
  private getCardinalDirection(from: { x: number; y: number }, to: { x: number; y: number }): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    // Use angle to determine direction
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    if (angle >= -22.5 && angle < 22.5) return 'east';
    if (angle >= 22.5 && angle < 67.5) return 'southeast';
    if (angle >= 67.5 && angle < 112.5) return 'south';
    if (angle >= 112.5 && angle < 157.5) return 'southwest';
    if (angle >= 157.5 || angle < -157.5) return 'west';
    if (angle >= -157.5 && angle < -112.5) return 'northwest';
    if (angle >= -112.5 && angle < -67.5) return 'north';
    if (angle >= -67.5 && angle < -22.5) return 'northeast';

    return 'nearby';
  }

  /**
   * Convert distance to natural language description
   */
  private getDistanceDescription(distance: number): string {
    if (distance < 15) return 'a short walk';
    if (distance < 30) return 'a moderate walk';
    if (distance < 50) return 'a long walk';
    return 'far away';
  }

  /**
   * Calculate Euclidean distance between two points
   */
  private getDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) +
      Math.pow(point2.y - point1.y, 2)
    );
  }

  /**
   * Format locations for LLM prompt
   */
  formatLocationsForPrompt(locations: QuestLocation[]): string {
    return locations.map(loc =>
      `- ${loc.type} at coordinates (${loc.coordinates.x}, ${loc.coordinates.y}): ${loc.description}, suitable for: ${loc.suitable_for.join(', ')}`
    ).join('\n');
  }

  /**
   * Find the nearest location of a specific type
   */
  findNearestLocationType(locations: QuestLocation[], type: string): QuestLocation | null {
    const matching = locations.filter(loc => loc.type === type);
    if (matching.length === 0) return null;

    return matching.sort((a, b) => a.distance - b.distance)[0];
  }

  /**
   * Get location summary for debugging
   */
  getLocationSummary(locations: QuestLocation[]): { [key: string]: number } {
    const summary: { [key: string]: number } = {};
    locations.forEach(loc => {
      summary[loc.type] = (summary[loc.type] || 0) + 1;
    });
    return summary;
  }
}

// Export singleton instance
export const mapQuestAnalyzer = new MapQuestAnalyzer();