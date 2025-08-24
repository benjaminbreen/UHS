/**
 * services/farmerMarketService.ts - Manages farmer NPCs traveling to market
 */

import { NpcEntity, Tile, MapData, TerrainStructure } from '../types';
import { shouldFarmerGoToMarket, getFarmState, updateFarmState } from './farmService';

interface FarmerMarketMovement {
  farmerId: string;
  farmTile: [number, number];
  marketTile: [number, number];
  currentPosition: [number, number];
  targetPosition: [number, number];
  isReturning: boolean;
  arrivalTime?: number;
}

// Track active farmer movements
const activeFarmerMovements = new Map<string, FarmerMarketMovement>();

/**
 * Find the nearest marketplace to a given tile
 */
function findNearestMarketplace(
  fromTile: Tile,
  structures: TerrainStructure[]
): TerrainStructure | null {
  const marketplaces = structures.filter(s => s.type === 'MARKETPLACE');
  
  if (marketplaces.length === 0) return null;
  
  let nearest = marketplaces[0];
  let minDistance = Math.hypot(
    fromTile.x - nearest.location[0],
    fromTile.y - nearest.location[1]
  );
  
  for (const marketplace of marketplaces) {
    const distance = Math.hypot(
      fromTile.x - marketplace.location[0],
      fromTile.y - marketplace.location[1]
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearest = marketplace;
    }
  }
  
  return nearest;
}

/**
 * Update farmer positions for market travel
 * Called each game tick/hour
 */
export function updateFarmerMarketMovements(
  npcs: NpcEntity[],
  mapData: MapData,
  currentGameDay: number,
  currentHour: number
): void {
  // Only send farmers to market during morning hours (6am-10am)
  const isMarketTime = currentHour >= 6 && currentHour <= 10;
  
  // Check each farm tile for farmers that should go to market
  if (isMarketTime) {
    const farmTiles = mapData.tiles.flat().filter(t => t.biome === 'FARMLAND');
    
    for (const farmTile of farmTiles) {
      const farmState = getFarmState(farmTile, mapData, npcs);
      
      // Check if this farmer should go to market today
      if (shouldFarmerGoToMarket(farmState, currentGameDay)) {
        // Find the farmer NPC if they exist
        const farmer = npcs.find(npc => npc.id === farmState.family.farmerId);
        
        if (farmer && !activeFarmerMovements.has(farmer.id)) {
          // Find nearest marketplace
          const marketplace = findNearestMarketplace(farmTile, mapData.structures || []);
          
          if (marketplace) {
            // Start farmer movement to market
            const movement: FarmerMarketMovement = {
              farmerId: farmer.id,
              farmTile: [farmTile.x, farmTile.y],
              marketTile: marketplace.location,
              currentPosition: [farmer.x, farmer.y],
              targetPosition: marketplace.location,
              isReturning: false
            };
            
            activeFarmerMovements.set(farmer.id, movement);
            
            // Update farm state to record market trip
            updateFarmState(farmState.tileKey, { lastMarketDay: currentGameDay });
            
            // Update NPC activity
            farmer.activity = 'Going to market';
          }
        }
      }
    }
  }
  
  // Update positions of farmers currently traveling
  for (const [farmerId, movement] of activeFarmerMovements) {
    const farmer = npcs.find(npc => npc.id === farmerId);
    if (!farmer) {
      activeFarmerMovements.delete(farmerId);
      continue;
    }
    
    // Calculate movement speed (tiles per hour)
    const speed = 0.5; // Half a tile per hour
    
    // Calculate direction to target
    const dx = movement.targetPosition[0] - movement.currentPosition[0];
    const dy = movement.targetPosition[1] - movement.currentPosition[1];
    const distance = Math.hypot(dx, dy);
    
    if (distance < 0.5) {
      // Arrived at destination
      if (!movement.isReturning) {
        // At market - stay for 2 hours
        if (!movement.arrivalTime) {
          movement.arrivalTime = currentHour;
          farmer.activity = 'Trading at market';
        } else if (currentHour - movement.arrivalTime >= 2) {
          // Start returning home
          movement.isReturning = true;
          movement.targetPosition = movement.farmTile;
          movement.arrivalTime = undefined;
          farmer.activity = 'Returning from market';
        }
      } else {
        // Back at farm
        farmer.x = movement.farmTile[0];
        farmer.y = movement.farmTile[1];
        farmer.activity = 'Working';
        activeFarmerMovements.delete(farmerId);
      }
    } else {
      // Move towards target
      const moveX = (dx / distance) * speed;
      const moveY = (dy / distance) * speed;
      
      movement.currentPosition[0] += moveX;
      movement.currentPosition[1] += moveY;
      
      // Update NPC position
      farmer.x = movement.currentPosition[0];
      farmer.y = movement.currentPosition[1];
    }
  }
}

/**
 * Check if a farmer is currently traveling
 */
export function isFarmerTraveling(farmerId: string): boolean {
  return activeFarmerMovements.has(farmerId);
}

/**
 * Get farmer's current market status
 */
export function getFarmerMarketStatus(farmerId: string): string {
  const movement = activeFarmerMovements.get(farmerId);
  if (!movement) return 'At farm';
  
  if (movement.arrivalTime !== undefined) return 'At market';
  if (movement.isReturning) return 'Returning from market';
  return 'Going to market';
}

/**
 * Clear all active movements (for game reset)
 */
export function clearFarmerMovements(): void {
  activeFarmerMovements.clear();
}