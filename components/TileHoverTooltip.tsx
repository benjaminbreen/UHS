/**
 * components/TileHoverTooltip.tsx
 * Hover tooltip for Farm and Urban tiles on the map
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Tile, NpcEntity, BiomeType, MapData } from '../types';
import { getFarmState } from '../services/farmService';

interface TileHoverTooltipProps {
  tile: Tile;
  x: number;
  y: number;
  npcs: NpcEntity[];
  culturalZone: string;
  era: string;
  visible: boolean;
  mapData?: MapData;
}

const TileHoverTooltip: React.FC<TileHoverTooltipProps> = ({
  tile,
  x,
  y,
  npcs,
  culturalZone,
  era,
  visible,
  mapData
}) => {
  const [opacity, setOpacity] = useState(0);
  
  useEffect(() => {
    if (visible) {
      // Fade in
      const timer = setTimeout(() => setOpacity(1), 10);
      return () => clearTimeout(timer);
    } else {
      // Fade out
      setOpacity(0);
    }
  }, [visible]);

  if (!tile) return null;

  // Don't render tooltips on mobile devices
  const isMobile = window.innerWidth < 640; // sm breakpoint
  if (isMobile) return null;

  // Get portal element
  const portalElement = document.getElementById('tooltip-portal');
  if (!portalElement) return null;

  // Get NPCs living/working at this tile
  const tileNpcs = npcs.filter(npc => 
    Math.floor(npc.x) === tile.x && Math.floor(npc.y) === tile.y
  );

  // Get tile-specific information
  const getTileInfo = () => {
    switch (tile.biome) {
      case BiomeType.FARMLAND: {
        // Get actual farm data from farmService if mapData is available
        let familyName = 'Farm';
        let headOfHousehold = '';
        let workers = 1;
        let economicStatus = '';
        
        if (mapData) {
          try {
            const farmState = getFarmState(tile, mapData, npcs);
            // Check if we got valid farm data
            if (farmState && farmState.family) {
              familyName = farmState.family.familyName || 'Farm';
              headOfHousehold = farmState.family.headOfHousehold || '';
              workers = farmState.workers || 1;
              economicStatus = farmState.economicStatus || '';
            }
          } catch (e) {
            console.error('Error getting farm state:', e);
          }
        }
        
        // If we still don't have a good family name, try to get it from NPCs on this tile
        if (!familyName || familyName === 'Farm' || familyName === 'Unknown Family' || familyName === ' Family') {
          const farmer = tileNpcs.find(npc => 
            npc.role?.toLowerCase().includes('farm') || 
            npc.profession?.toLowerCase().includes('farm')
          );
          if (farmer && farmer.name) {
            // Just use the farmer's name as-is, like SettlementInfoPanel does
            familyName = farmer.name;
          }
        }
        
        const cropType = tile.cropType || tile.structure?.name || 'grain';
        
        // Choose icon based on crop type
        let icon = '🚜';
        if (cropType.toLowerCase().includes('rice')) icon = '🌾';
        else if (cropType.toLowerCase().includes('vineyard') || cropType.toLowerCase().includes('grape')) icon = '🍇';
        else if (cropType.toLowerCase().includes('olive')) icon = '🫒';
        else if (cropType.toLowerCase().includes('cotton')) icon = '🌿';
        else if (cropType.toLowerCase().includes('hemp')) icon = '🌿';
        else if (cropType.toLowerCase().includes('flax')) icon = '🌾';
        else if (cropType.toLowerCase().includes('tobacco')) icon = '🍃';
        else if (cropType.toLowerCase().includes('tea')) icon = '🍵';
        else if (cropType.toLowerCase().includes('coffee')) icon = '☕';
        else if (cropType.toLowerCase().includes('hops')) icon = '🌿';
        
        const statusText = economicStatus ? ` (${economicStatus})` : '';
        
        // Format the title based on what we have
        let title = 'Farm';
        if (familyName && familyName !== 'Farm') {
          // If familyName already contains "Farm" or is just a name, use it as-is
          title = familyName.includes('Farm') ? familyName : `${familyName} Farm`;
        }
        title += statusText;
        
        return {
          icon,
          color: '#8B7355',
          title,
          subtitle: `Growing: ${cropType}`,
          details: headOfHousehold ? `Head: ${headOfHousehold} | Workers: ${workers}` : `Workers: ${workers}`
        };
      }
      
      case BiomeType.HAMLET:
      case BiomeType.LOW_DENSITY_CITY:
      case BiomeType.DENSE_CITY:
      case BiomeType.URBAN: {
        // Calculate population based on biome type and NPCs
        let basePopulation = 50;
        switch (tile.biome) {
          case BiomeType.HAMLET: basePopulation = 20; break;
          case BiomeType.LOW_DENSITY_CITY: basePopulation = 100; break;
          case BiomeType.DENSE_CITY: basePopulation = 300; break;
          case BiomeType.URBAN: basePopulation = 150; break;
        }
        
        // Add some randomization based on tile coordinates for variety
        const seed = tile.x * 23 + tile.y * 29;
        const populationVariation = (seed % 40) - 20; // -20 to +19
        const population = Math.max(5, basePopulation + populationVariation);
        
        // Get family names from NPCs or generate them
        let familyNames: string[] = [];
        if (tileNpcs.length > 0) {
          familyNames = tileNpcs.slice(0, 3).map(npc => {
            const lastName = npc.name.split(' ')[1] || npc.name.split(' ')[0];
            return lastName + ' Family';
          });
        } else {
          // Generate deterministic family names
          const allFamilyNames = ['Johnson', 'Smith', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez'];
          for (let i = 0; i < 3; i++) {
            const nameIndex = (seed + i * 7) % allFamilyNames.length;
            familyNames.push(allFamilyNames[nameIndex] + ' Family');
          }
        }
        
        const biomeDisplayName = {
          [BiomeType.HAMLET]: 'Hamlet',
          [BiomeType.LOW_DENSITY_CITY]: 'Town District',
          [BiomeType.DENSE_CITY]: 'City District',
          [BiomeType.URBAN]: 'Urban Area'
        }[tile.biome] || 'Settlement';
        
        return {
          icon: '🏘️',
          color: '#CD853F',
          title: biomeDisplayName,
          subtitle: `Population: ~${population}`,
          details: familyNames.length > 0 ? familyNames.join(', ') : 'Various families'
        };
      }
      
      case BiomeType.CITY_CENTER: {
        // For city centers, calculate total urban population on the map
        const allUrbanTiles = []; // This would need to be passed in or calculated
        // For now, estimate based on city center location
        const baseCityPopulation = 2000;
        const seed = tile.x * 17 + tile.y * 19;
        const populationVariation = (seed % 1000) - 500;
        const totalPopulation = Math.max(500, baseCityPopulation + populationVariation);
        
        return {
          icon: '🏛️',
          color: '#DAA520',
          title: 'City Center',
          subtitle: `Urban Population: ~${totalPopulation}`,
          details: 'Administrative and commercial hub'
        };
      }
      
      default: {
        return {
          icon: '📍',
          color: '#808080',
          title: 'Area',
          subtitle: tile.biome.replace(/_/g, ' '),
          details: `Coordinates: ${tile.x}, ${tile.y}`
        };
      }
    }
  };

  const info = getTileInfo();

  // Calculate position to keep tooltip on screen
  const tooltipWidth = 240;
  const tooltipHeight = 120;
  const offset = 20;

  // Position tooltip near the cursor
  let adjustedX = x + offset;
  let adjustedY = y - tooltipHeight - offset;

  // Bounds checking to keep tooltip on screen
  if (adjustedX + tooltipWidth > window.innerWidth - 10) {
    // If tooltip would go off right edge, show it to the left of cursor
    adjustedX = x - tooltipWidth - offset;
  }
  if (adjustedX < 10) {
    adjustedX = 10;
  }

  if (adjustedY < 10) {
    // Show below cursor if no room above
    adjustedY = y + offset;
  }

  const tooltipContent = (
    <div
      className="fixed pointer-events-none"
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
        opacity,
        transition: 'opacity 0.2s ease-in-out'
      }}
    >
      <div className="bg-slate-900/95 backdrop-blur-sm border border-amber-500/50 rounded-lg p-3 shadow-xl min-w-[200px] max-w-[280px]">
        {/* Header with icon */}
        <div className="flex items-center gap-2 mb-2">
          <span style={{ color: info.color }} className="text-lg">
            {info.icon}
          </span>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white truncate">{info.title}</h4>
            <p className="text-xs text-amber-400">{tile.biome.replace(/_/g, ' ')}</p>
          </div>
        </div>

        {/* Info sections */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Status:</span>
            <span className="text-white">{info.subtitle}</span>
          </div>
          <div className="pt-1 border-t border-slate-700/50">
            <p className="text-slate-300">{info.details}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(tooltipContent, portalElement);
};

export default TileHoverTooltip;