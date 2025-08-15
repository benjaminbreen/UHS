/**
 * components/symbols/UrbanSymbolRefactored.tsx - Simplified urban building with unified selection
 */
import React, { useMemo } from 'react';
import { BiomeType, Tile, HistoricalEra } from '../../types/index';
import { ValueNoise } from '../../utils/noise';
import { parseDateString } from '../../utils/dateUtils';
import { selectBuilding } from '../../utils/buildingSelectionSystem';
import { getLocationCulturalStyle } from '../../utils/culturalMappingUtils';

interface UrbanSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  date: string;
  zone: string;
  nightIntensity?: number;
  location?: string;
}

const UrbanSymbolRefactored: React.FC<UrbanSymbolProps> = React.memo(({ 
  x, y, size, seed, tile, date, zone, nightIntensity = 0, location 
}) => {
  const { era } = parseDateString(date);
  
  // Parse year from formatted date
  const yearMatch = date.match(/(\d+)\s*(BC|BCE|AD|CE)?/);
  let year = yearMatch ? parseInt(yearMatch[1]) : 0;
  if (yearMatch && (yearMatch[2] === 'BC' || yearMatch[2] === 'BCE')) {
    year = -year;
  }
  
  // Get cultural mapping (simplified - no special buildings)
  const culturalMapping = getLocationCulturalStyle(location || zone, year);
  const culture = culturalMapping.primaryCulture;
  
  // Building data calculations
  const buildingData = useMemo(() => {
    const uniqueTileSeed = seed + tile.x * 137 + tile.y * 149;
    const localRand = new ValueNoise(uniqueTileSeed);
    const rand = (offset: number = 0) => {
      return new ValueNoise(uniqueTileSeed + offset).random();
    };
    const scaleDown = 0.85;
    
    let widthFactor = 0.6, heightFactor = 0.6;
    switch (tile.biome) {
      case BiomeType.CITY_CENTER: 
        widthFactor = 0.8; 
        heightFactor = era === HistoricalEra.MODERN_ERA || era === HistoricalEra.FUTURE_ERA ? 1.0 : 0.8; 
        break;
      case BiomeType.DENSE_CITY: 
        widthFactor = 0.7; 
        heightFactor = era === HistoricalEra.MODERN_ERA || era === HistoricalEra.FUTURE_ERA ? 0.9 : 0.7; 
        break;
      case BiomeType.LOW_DENSITY_CITY: 
        widthFactor = 0.55; 
        heightFactor = 0.5; 
        break;
      case BiomeType.HAMLET: 
        widthFactor = 0.45; 
        heightFactor = 0.4; 
        break;
    }

    const width = size * widthFactor * scaleDown;
    const height = size * heightFactor * scaleDown;
    const xOffset = (size - width) / 2;
    const yOffset = size - height - size * 0.15;

    return { width, height, xOffset, yOffset, rand, seed: uniqueTileSeed };
  }, [seed, tile.x, tile.y, tile.biome, size, era]);
  
  // Ground pattern (simplified)
  const groundPattern = useMemo(() => {
    const patternId = `ground-${tile.x}-${tile.y}`;
    const eraLevel = {
      [HistoricalEra.PREHISTORY]: 0,
      [HistoricalEra.ANTIQUITY]: 1,
      [HistoricalEra.MEDIEVAL]: 2,
      [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 3,
      [HistoricalEra.INDUSTRIAL_ERA]: 4,
      [HistoricalEra.MODERN_ERA]: 5,
      [HistoricalEra.FUTURE_ERA]: 6,
    }[era as HistoricalEra] || 2;
    
    const baseColors = ['#cd853f', '#a0826d', '#8b7355', '#696969', '#708090', '#778899'];
    const baseColor = baseColors[Math.min(eraLevel, baseColors.length - 1)];
    
    return { patternId, baseColor, eraLevel };
  }, [era, tile.x, tile.y]);

  // USE THE NEW UNIFIED SELECTION SYSTEM
  const selectedBuildingData = useMemo(() => {
    // Enable logging for debugging
    const enableLogging = tile.x === 0 && tile.y === 0;
    
    const selection = selectBuilding({
      year,
      location: location || zone,
      culture,
      density: tile.biome,
      era: era as HistoricalEra,
      seed: buildingData.seed,
      enableLogging
    });
    
    return selection;
  }, [year, location, zone, culture, tile.biome, era, buildingData.seed, tile.x, tile.y]);

  const renderBuilding = () => {
    const { width, height, xOffset, yOffset } = buildingData;
    const { component: BuildingComponent, name } = selectedBuildingData;
    
    if (!BuildingComponent) {
      console.error(`[UrbanSymbolRefactored] No building component selected!`);
      return null;
    }
    
    const commonProps = { 
      x: x + xOffset, 
      y: y + yOffset, 
      width, 
      height, 
      size, 
      seed: buildingData.seed, 
      tile, 
      nightIntensity 
    };
    
    return React.createElement(BuildingComponent, commonProps);
  };

  const isCityCenter = tile.biome === BiomeType.CITY_CENTER;

  return (
    <g>
      <defs>
        {/* Era-appropriate ground patterns */}
        <pattern id={groundPattern.patternId} patternUnits="userSpaceOnUse" width="10" height="10">
          <rect width="10" height="10" fill={groundPattern.baseColor} opacity="0.3"/>
          {groundPattern.eraLevel <= 2 && (
            // Medieval cobblestone
            <>
              <rect x="0" y="0" width="4.5" height="4.5" fill="rgba(105,105,105,0.2)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.3"/>
              <rect x="5" y="0" width="4.5" height="4.5" fill="rgba(119,136,153,0.2)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.3"/>
              <rect x="0" y="5" width="4.5" height="4.5" fill="rgba(119,136,153,0.2)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.3"/>
              <rect x="5" y="5" width="4.5" height="4.5" fill="rgba(105,105,105,0.2)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.3"/>
            </>
          )}
          {groundPattern.eraLevel >= 4 && (
            // Modern concrete
            <>
              <rect x="0" y="0" width="4.8" height="4.8" fill="rgba(112,128,144,0.2)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.2"/>
              <rect x="5" y="0" width="4.8" height="4.8" fill="rgba(128,128,128,0.2)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.2"/>
              <rect x="0" y="5" width="4.8" height="4.8" fill="rgba(128,128,128,0.2)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.2"/>
              <rect x="5" y="5" width="4.8" height="4.8" fill="rgba(112,128,144,0.2)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.2"/>
            </>
          )}
        </pattern>
      </defs>
      
      <rect x={x} y={y} width={size} height={size} fill={`url(#${groundPattern.patternId})`} />
      
      {renderBuilding()}
      
      {isCityCenter && (
        <g>
          <circle cx={x + size * 0.15} cy={y + size * 0.15} r={size * 0.12} fill="rgba(255,215,0,0.2)" />
          <text x={x + size * 0.15} y={y + size * 0.18} textAnchor="middle" fontSize={size * 0.15} fill="#ffd700" stroke="#ff8c00" strokeWidth="0.8" style={{ fontWeight: 'bold' }}>★</text>
        </g>
      )}
    </g>
  );
});

export default UrbanSymbolRefactored;