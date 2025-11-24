/**
 * railroadNetworkService.ts - Service for analyzing railroad connections and managing fast travel
 * Updated to support cross-map railroad travel using crossMapTravelService
 */
import { MapData, Tile, PathType } from '../types';
import { BiomeType } from '../types/enums';
import { HistoricalEra } from '../types';
import {
  getRailroadDestinations,
  TravelDestination,
  TravelMode
} from './crossMapTravelService';

export interface RailroadStation {
  name: string;
  x: number;
  y: number;
  tile?: Tile; // Optional for cross-map stations
  mapAreaName?: string; // For cross-map destinations
}

export interface RailroadConnection {
  from: RailroadStation;
  to: RailroadStation;
  distance: number;
  travelTime: number;
  fare: number;
  isCrossMap?: boolean; // True if destination is in another map area
  routeDescription?: string; // Route path description
}

export class RailroadNetworkService {
  private mapData: MapData | null = null;
  private stations: RailroadStation[] = [];
  private connections: Map<string, RailroadStation[]> = new Map();
  private currentMapArea: string | null = null;
  private currentYear: number | null = null;
  private currentEra: HistoricalEra | null = null;
  private crossMapDestinations: TravelDestination[] = [];

  /**
   * Initialize the railroad network from map data
   * Now includes cross-map destinations from adjacent areas
   */
  initialize(
    mapData: MapData,
    currentYear?: number,
    currentEra?: HistoricalEra
  ): void {
    this.mapData = mapData;
    this.stations = [];
    this.connections.clear();
    this.currentMapArea = mapData.mapAreaName || mapData.localArea || null;
    this.currentYear = currentYear || null;
    this.currentEra = currentEra || null;
    this.crossMapDestinations = [];

    // Find all railroad station tiles in current map
    const stationTiles = mapData.tiles.flat().filter(tile =>
      tile.biome === BiomeType.RAILROAD_STATION
    );

    console.log(`[RailroadNetwork] Found ${stationTiles.length} station tiles in current map`);

    // Create station objects with names
    this.stations = stationTiles.map((tile, idx) => ({
      name: tile.cityName || `Station ${idx + 1}`,
      x: tile.x,
      y: tile.y,
      tile
    }));

    // Build connection map by analyzing railroad paths (same-map stations)
    this.buildConnectionMap();

    // Get cross-map destinations if we have the required data
    if (this.currentMapArea && this.currentYear && this.currentEra) {
      this.loadCrossMapDestinations();
    }

    console.log(`[RailroadNetwork] Initialized with ${this.stations.length} local stations and ${this.crossMapDestinations.length} cross-map destinations`);
  }

  /**
   * Load cross-map railroad destinations from adjacent areas
   */
  private loadCrossMapDestinations(): void {
    if (!this.currentMapArea || !this.currentYear || !this.currentEra) {
      return;
    }

    try {
      this.crossMapDestinations = getRailroadDestinations(this.currentMapArea, {
        mode: TravelMode.RAILROAD,
        currentYear: this.currentYear,
        currentEra: this.currentEra,
        maxHops: 4
      });

      console.log(`[RailroadNetwork] Loaded ${this.crossMapDestinations.length} cross-map destinations`);
    } catch (error) {
      console.error('[RailroadNetwork] Error loading cross-map destinations:', error);
      this.crossMapDestinations = [];
    }
  }

  /**
   * Build map of which stations connect to which
   */
  private buildConnectionMap(): void {
    if (!this.mapData) return;

    // Get all railroad paths
    const railPaths = this.mapData.pathObjects?.filter(p => p.type === PathType.RAILROAD) || [];

    // For each station, find other stations it connects to
    for (const station of this.stations) {
      const connected: RailroadStation[] = [];

      for (const otherStation of this.stations) {
        if (station === otherStation) continue;

        // Check if there's a railroad path connecting these stations
        const hasConnection = this.checkRailConnection(
          station.x, station.y,
          otherStation.x, otherStation.y,
          railPaths
        );

        if (hasConnection) {
          connected.push(otherStation);
        }
      }

      this.connections.set(this.getStationKey(station), connected);
      console.log(`[RailroadNetwork] Station "${station.name}" connects to ${connected.length} other stations`);
    }
  }

  /**
   * Check if two stations are connected by railroad
   */
  private checkRailConnection(
    x1: number, y1: number,
    x2: number, y2: number,
    railPaths: any[]
  ): boolean {
    // Simple distance-based check for now
    // In reality, we'd trace the actual railroad paths
    const distance = Math.hypot(x2 - x1, y2 - y1);

    // If stations are within reasonable rail distance and we have rail paths
    if (distance < 80 && railPaths.length > 0) {
      return true;
    }

    return false;
  }

  /**
   * Get key for station in connection map
   */
  private getStationKey(station: RailroadStation): string {
    return `${station.x},${station.y}`;
  }

  /**
   * Find station at given coordinates
   */
  findStationAt(x: number, y: number): RailroadStation | null {
    return this.stations.find(s => s.x === x && s.y === y) || null;
  }

  /**
   * Get all stations connected to the given station
   */
  getConnectedStations(station: RailroadStation): RailroadStation[] {
    return this.connections.get(this.getStationKey(station)) || [];
  }

  /**
   * Calculate connection details (distance, time, fare)
   */
  getConnectionDetails(from: RailroadStation, to: RailroadStation): {
    distance: number;
    travelTime: number;
    fare: number;
  } {
    const distance = Math.hypot(to.x - from.x, to.y - from.y);

    // Calculate travel time (faster than walking)
    // Assume railroad speed is ~10 tiles per hour
    const travelTime = Math.ceil(distance / 10);

    // Calculate fare based on distance
    // Base fare of 5 coins + 2 coins per 10 tiles
    const fare = 5 + Math.floor(distance / 10) * 2;

    return {
      distance: Math.round(distance),
      travelTime,
      fare
    };
  }

  /**
   * Get all connections from a station with details
   * Now includes both same-map stations AND cross-map destinations
   */
  getConnectionsWithDetails(station: RailroadStation): Array<{
    station: RailroadStation;
    distance: number;
    travelTime: number;
    fare: number;
    isCrossMap?: boolean;
    routeDescription?: string;
  }> {
    const results: Array<{
      station: RailroadStation;
      distance: number;
      travelTime: number;
      fare: number;
      isCrossMap?: boolean;
      routeDescription?: string;
    }> = [];

    // Add same-map connections
    const connected = this.getConnectedStations(station);
    for (const dest of connected) {
      const details = this.getConnectionDetails(station, dest);
      results.push({
        station: dest,
        ...details,
        isCrossMap: false
      });
    }

    // Add cross-map destinations
    for (const crossMapDest of this.crossMapDestinations) {
      results.push({
        station: {
          name: crossMapDest.cityName,
          x: -1, // Not on current map
          y: -1, // Not on current map
          mapAreaName: crossMapDest.mapAreaName
        },
        distance: crossMapDest.distance,
        travelTime: crossMapDest.travelTime,
        fare: crossMapDest.fare,
        isCrossMap: true,
        routeDescription: crossMapDest.routeDescription
      });
    }

    return results;
  }

  /**
   * Get all stations in the network
   */
  getAllStations(): RailroadStation[] {
    return this.stations;
  }

  /**
   * Check if railroad network exists (has stations)
   */
  hasNetwork(): boolean {
    return this.stations.length > 0;
  }

  /**
   * Get network statistics
   */
  getNetworkStats(): {
    totalStations: number;
    totalConnections: number;
    averageConnections: number;
  } {
    let totalConnections = 0;
    this.connections.forEach(connections => {
      totalConnections += connections.length;
    });

    return {
      totalStations: this.stations.length,
      totalConnections: totalConnections / 2, // Divide by 2 since connections are bidirectional
      averageConnections: this.stations.length > 0 ? totalConnections / this.stations.length : 0
    };
  }
}

// Singleton instance
export const railroadNetworkService = new RailroadNetworkService();
