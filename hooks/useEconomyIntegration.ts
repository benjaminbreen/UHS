/**
 * Hook for integrating economic structures (farms, factories, marketplaces)
 * Creates supply chains and trade routes between structures
 */

import { useEffect, useCallback, useMemo } from 'react';
import { MapData, TerrainStructure, NpcEntity } from '../types';
import { tradeService, TradeRoute } from '../services/tradeService';
import { factoryEconomyService } from '../services/factoryEconomyService';

interface UseEconomyIntegrationProps {
  mapData: MapData | null;
  npcs: NpcEntity[];
  onEconomicEvent?: (event: string) => void;
}

interface EconomicNetwork {
  producers: TerrainStructure[];
  processors: TerrainStructure[];
  markets: TerrainStructure[];
  tradeRoutes: TradeRoute[];
  supplyChains: Map<string, string[]>; // structureId -> connected structures
}

export function useEconomyIntegration({
  mapData,
  npcs,
  onEconomicEvent
}: UseEconomyIntegrationProps) {
  
  // Build economic network from structures
  const economicNetwork = useMemo<EconomicNetwork>(() => {
    if (!mapData?.terrainStructures) {
      return {
        producers: [],
        processors: [],
        markets: [],
        tradeRoutes: [],
        supplyChains: new Map()
      };
    }
    
    const network: EconomicNetwork = {
      producers: [],
      processors: [],
      markets: [],
      tradeRoutes: [],
      supplyChains: new Map()
    };
    
    // Categorize structures
    mapData.terrainStructures.forEach(structure => {
      switch (structure.structureType) {
        case 'farm':
        case 'fishing_hut':
        case 'mining_colony':
        case 'lumber_camp':
          network.producers.push(structure);
          break;
          
        case 'factory':
        case 'mill':
          network.processors.push(structure);
          break;
          
        case 'marketplace':
        case 'trading_post':
          network.markets.push(structure);
          break;
      }
    });
    
    // Create supply chains
    network.processors.forEach(processor => {
      const connections: string[] = [];
      
      // Find nearby producers that supply this processor
      network.producers.forEach(producer => {
        if (canSupply(producer, processor)) {
          const distance = calculateDistance(producer, processor);
          if (distance < 30) { // Within 30 tiles
            connections.push(producer.id);
            
            // Create trade route
            const route = tradeService.createTradeRoute(
              producer,
              processor,
              producer.outputGoods || []
            );
            network.tradeRoutes.push(route);
          }
        }
      });
      
      // Find nearby markets to sell to
      network.markets.forEach(market => {
        const distance = calculateDistance(processor, market);
        if (distance < 40) { // Within 40 tiles
          connections.push(market.id);
          
          // Create trade route
          const route = tradeService.createTradeRoute(
            processor,
            market,
            processor.outputGoods || []
          );
          network.tradeRoutes.push(route);
        }
      });
      
      network.supplyChains.set(processor.id, connections);
    });
    
    // Connect producers directly to markets if no processors nearby
    network.producers.forEach(producer => {
      const connections: string[] = [];
      let hasProcessor = false;
      
      // Check if connected to any processor
      network.processors.forEach(processor => {
        if (canSupply(producer, processor)) {
          const distance = calculateDistance(producer, processor);
          if (distance < 30) {
            hasProcessor = true;
          }
        }
      });
      
      // If no processor, connect directly to markets
      if (!hasProcessor) {
        network.markets.forEach(market => {
          const distance = calculateDistance(producer, market);
          if (distance < 40) {
            connections.push(market.id);
            
            // Create direct trade route
            const route = tradeService.createTradeRoute(
              producer,
              market,
              producer.outputGoods || []
            );
            network.tradeRoutes.push(route);
          }
        });
      }
      
      if (connections.length > 0) {
        network.supplyChains.set(producer.id, connections);
      }
    });
    
    return network;
  }, [mapData]);
  
  // Initialize economic connections
  useEffect(() => {
    if (!mapData || economicNetwork.tradeRoutes.length === 0) return;
    
    // Log network creation
    console.log(`[Economy] Created economic network with ${economicNetwork.tradeRoutes.length} trade routes`);
    
    // Notify about major trade routes
    economicNetwork.tradeRoutes.forEach(route => {
      const frequency = route.frequency === 'daily' ? 'daily' :
                       route.frequency === 'weekly' ? 'weekly' :
                       'monthly';
      
      if (onEconomicEvent && Math.random() < 0.1) { // 10% chance to announce
        onEconomicEvent(`Trade route established: ${frequency} shipments between structures`);
      }
    });
  }, [economicNetwork, mapData, onEconomicEvent]);
  
  // Simulate economic activity
  const simulateEconomicActivity = useCallback(() => {
    if (!mapData || !economicNetwork) return;
    
    // Simulate production flow through supply chains
    economicNetwork.supplyChains.forEach((connections, structureId) => {
      const structure = mapData.terrainStructures?.find(s => s.id === structureId);
      if (!structure) return;
      
      // Check if structure has enough inputs from suppliers
      let hasInputs = true;
      if (structure.inputGoods) {
        // This is simplified - in reality would check actual inventory
        hasInputs = connections.length > 0;
      }
      
      if (hasInputs && structure.outputGoods) {
        // Structure is producing
        if (Math.random() < 0.05 && onEconomicEvent) { // 5% chance to announce
          onEconomicEvent(`${structure.name} is producing ${structure.outputGoods.join(', ')}`);
        }
      }
    });
    
    // Simulate merchant movement along trade routes
    economicNetwork.tradeRoutes.forEach(route => {
      if (!route.active) return;
      
      // Check if trade happens based on frequency
      let shouldTrade = false;
      const hour = new Date().getHours();
      
      switch (route.frequency) {
        case 'daily':
          shouldTrade = hour === 6 || hour === 18; // Twice daily
          break;
        case 'weekly':
          shouldTrade = hour === 12 && new Date().getDay() === 1; // Monday noon
          break;
        case 'monthly':
          shouldTrade = hour === 12 && new Date().getDate() === 1; // First of month
          break;
      }
      
      if (shouldTrade && Math.random() < route.reliability) {
        // Successful trade
        if (Math.random() < 0.1 && onEconomicEvent) {
          onEconomicEvent(`Merchants completed trade route delivery`);
        }
      }
    });
  }, [economicNetwork, mapData, onEconomicEvent]);
  
  // Update merchant NPCs based on trade routes
  const updateMerchantBehaviors = useCallback(() => {
    if (!economicNetwork || !npcs) return;
    
    const merchants = npcs.filter(npc => 
      npc.role?.toLowerCase().includes('merchant') ||
      npc.role?.toLowerCase().includes('trader')
    );
    
    merchants.forEach(merchant => {
      // Find nearest trade route
      let nearestRoute: TradeRoute | null = null;
      let minDistance = Infinity;
      
      economicNetwork.tradeRoutes.forEach(route => {
        const origin = mapData?.terrainStructures?.find(s => s.id === route.origin);
        if (origin) {
          const distance = Math.hypot(
            merchant.x - origin.location[0],
            merchant.y - origin.location[1]
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestRoute = route;
          }
        }
      });
      
      // Set merchant to follow trade route
      if (nearestRoute && minDistance < 10) {
        const origin = mapData?.terrainStructures?.find(s => s.id === nearestRoute.origin);
        const destination = mapData?.terrainStructures?.find(s => s.id === nearestRoute.destination);
        
        if (origin && destination) {
          // Merchant travels between origin and destination
          merchant.movement = {
            type: 'patrol',
            path: [
              { x: origin.location[0], y: origin.location[1] },
              { x: destination.location[0], y: destination.location[1] }
            ]
          };
          merchant.activity = 'traveling';
        }
      }
    });
  }, [economicNetwork, npcs, mapData]);
  
  // Run economic simulation periodically
  useEffect(() => {
    const interval = setInterval(() => {
      simulateEconomicActivity();
      updateMerchantBehaviors();
    }, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [simulateEconomicActivity, updateMerchantBehaviors]);
  
  return {
    economicNetwork,
    simulateEconomicActivity,
    updateMerchantBehaviors
  };
}

// Helper functions
function canSupply(producer: TerrainStructure, processor: TerrainStructure): boolean {
  if (!producer.outputGoods || !processor.inputGoods) return false;
  
  // Check if any producer output matches processor input
  return producer.outputGoods.some(output => 
    processor.inputGoods?.includes(output)
  );
}

function calculateDistance(a: TerrainStructure, b: TerrainStructure): number {
  return Math.hypot(
    a.location[0] - b.location[0],
    a.location[1] - b.location[1]
  );
}