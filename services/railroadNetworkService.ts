/**
 * railroadNetworkService.ts - Service for analyzing railroad connections and managing fast travel
 */
import { MapData, Tile, PathType } from '../types';
import { BiomeType } from '../types/enums';

export interface RailroadStation {
  name: string;
  x: number;
  y: number;
  tile: Tile;
}

export interface RailroadConnection {
  from: RailroadStation;
  to: RailroadStation;
  distance: number;
  travelTime: number;
  fare: number;
}

export class RailroadNetworkService {
  private mapData: MapData | null = null;
  private stations: RailroadStation[] = [];
  private connections: Map<string, RailroadStation[]> = new Map();

  /**
   * Initialize the railroad network from map data
   */
  initialize(mapData: MapData): void {
    this.mapData = mapData;
    this.stations = [];
    this.connections.clear();

    // Find all railroad station tiles
    const stationTiles = mapData.tiles.flat().filter(tile =>
      tile.biome === BiomeType.RAILROAD_STATION
    );

    console.log(`[RailroadNetwork] Found ${stationTiles.length} station tiles`);

    // Create station objects with names
    this.stations = stationTiles.map((tile, idx) => ({
      name: tile.cityName || `Station ${idx + 1}`,
      x: tile.x,
      y: tile.y,
      tile
    }));

    // Build connection map by analyzing railroad paths
    this.buildConnectionMap();

    console.log(`[RailroadNetwork] Initialized with ${this.stations.length} stations`);
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
   */
  getConnectionsWithDetails(station: RailroadStation): Array<{
    station: RailroadStation;
    distance: number;
    travelTime: number;
    fare: number;
  }> {
    const connected = this.getConnectedStations(station);

    return connected.map(dest => {
      const details = this.getConnectionDetails(station, dest);
      return {
        station: dest,
        ...details
      };
    });
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
