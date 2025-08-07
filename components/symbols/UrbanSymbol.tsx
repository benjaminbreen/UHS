/**
 * components/symbols/UrbanSymbol.tsx - Culturally and historically specific urban buildings
 */
import React, { useMemo } from 'react';
import { BiomeType, Tile, HistoricalEra } from '../../types/index';
import { ValueNoise } from '../../utils/noise';
import { parseDateString } from '../../utils/dateUtils';
import {
  AdobeBuilding3D,
  AfricanRoundHut3D,
  AfricanStoneBuilding3D,
  AztecDwelling3D,
  BarkLonghouse3D,
  EastAsianPagoda3D,
  EuropeanCottage3D,
  GeorgianRowhouse3D,
  Igloo3D,
  IndustrialBuilding3D,
  IndustrialRowhouse3D,
  Longhouse3D,
  MedievalBuilding3D,
  ModernSkyscraper3D,
  ModernCivic3D,
  NativeTeepee3D,
  OttomanTownhouse3D,
  PolynesianHouse3D,
  PrehistoricShelter3D,
  SouthAsianTemple3D,
  VikingLonghouse3D,
} from './buildings';

interface UrbanSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  date: string;
  zone: string;
  nightIntensity?: number;
}

const getCulturalStyle = (zone: string): string => {
  const zoneMap: { [key: string]: string } = {
    'EUROPEAN': 'EUROPEAN', 'EAST_ASIAN': 'EAST_ASIAN', 'SOUTH_ASIAN': 'SOUTH_ASIAN',
    'MENA': 'MENA', 'SUB_SAHARAN_AFRICAN': 'SUB_SAHARAN_AFRICAN',
    'NORTH_AMERICAN_PRE_COLUMBIAN': 'NORTH_AMERICAN_PRE_COLUMBIAN',
    'SOUTH_AMERICAN': 'SOUTH_AMERICAN', 'OCEANIA': 'OCEANIA',
  };
  
  if (zoneMap[zone]) return zoneMap[zone];
  
  const friendlyNameMap: { [key: string]: string } = {
    'europe': 'EUROPEAN', 'east asia': 'EAST_ASIAN', 'south asia': 'SOUTH_ASIAN',
    'middle east': 'MENA', 'mena': 'MENA', 'africa': 'SUB_SAHARAN_AFRICAN',
    'north america': 'NORTH_AMERICAN_PRE_COLUMBIAN', 'south america': 'SOUTH_AMERICAN',
    'oceania': 'OCEANIA'
  };

  const lowerZone = zone.toLowerCase();
  for (const [key, value] of Object.entries(friendlyNameMap)) {
    if (lowerZone.includes(key)) return value;
  }
  return 'EUROPEAN';
};

const getEraLevel = (era: HistoricalEra): number => {
  const eraMap: Record<HistoricalEra, number> = {
    [HistoricalEra.PREHISTORY]: 0, [HistoricalEra.ANTIQUITY]: 1,
    [HistoricalEra.MEDIEVAL]: 2, [HistoricalEra.RENAISSANCE_EARLY_MODERN]: 3,
    [HistoricalEra.INDUSTRIAL_ERA]: 4, [HistoricalEra.MODERN_ERA]: 5,
    [HistoricalEra.FUTURE_ERA]: 6
  };
  return eraMap[era] || 2;
};

const getClimate = (zone: string): 'temperate' | 'cold' | 'arid' | 'tropical' => {
  const lowerZone = zone.toLowerCase();
  if (lowerZone.includes('arctic') || lowerZone.includes('alaska') || lowerZone.includes('canada') || lowerZone.includes('siberia') || lowerZone.includes('greenland')) return 'cold';
  if (lowerZone.includes('desert') || lowerZone.includes('sahara') || lowerZone.includes('arabia') || lowerZone.includes('mena')) return 'arid';
  if (lowerZone.includes('amazon') || lowerZone.includes('congo') || lowerZone.includes('southeast asia') || lowerZone.includes('oceania')) return 'tropical';
  return 'temperate';
};

const getRoofPalette = (culturalStyle: string, eraLevel: number, variant: number): string => {
  const palettes: Record<string, Record<string, string[]>> = {
    'EUROPEAN': {
      'medieval': ['#8b4513', '#a0522d', '#654321'],
      'renaissance': ['#b22222', '#dc143c', '#8b0000'],
      'industrial': ['#2f4f4f', '#708090', '#696969'],
    },
    'EAST_ASIAN': { 'traditional': ['#dc143c', '#b22222', '#8b0000'] },
    'SUB_SAHARAN_AFRICAN': { 'traditional': ['#d2a679', '#a0522d', '#8b6f47'] },
    'MENA': { 'traditional': ['#deb887', '#d2b48c', '#f4a460'] },
    'SOUTH_ASIAN': { 'traditional': ['#ff8c00', '#ffa500', '#ff6347'] },
    'SOUTH_AMERICAN': { 'traditional': ['#cd853f', '#daa520', '#b8860b'] },
    'NORTH_AMERICAN_PRE_COLUMBIAN': { 'traditional': ['#8b4513', '#a0522d', '#654321'] },
    'OCEANIA': { 'traditional': ['#8b6f47', '#a0826d', '#deb887'] }
  };
  
  let paletteKey = 'traditional';
  if (eraLevel >= 4 && culturalStyle === 'EUROPEAN') paletteKey = 'industrial';
  else if (eraLevel === 3 && culturalStyle === 'EUROPEAN') paletteKey = 'renaissance';
  else if (eraLevel === 2 && culturalStyle === 'EUROPEAN') paletteKey = 'medieval';
  
  const culturePalette = palettes[culturalStyle] || palettes['EUROPEAN'];
  const colors = culturePalette[paletteKey] || culturePalette['traditional'];
  
  return colors[variant % colors.length];
};

const UrbanSymbol: React.FC<UrbanSymbolProps> = React.memo(({ x, y, size, seed, tile, date, zone, nightIntensity = 0 }) => {
  const { era } = parseDateString(date);
  const eraLevel = getEraLevel(era as HistoricalEra);
  const culturalStyle = getCulturalStyle(zone);
  const climate = getClimate(zone);
  const isCityCenter = tile.biome === BiomeType.CITY_CENTER;

  const buildingData = useMemo(() => {
    const rand = (offset: number) => new ValueNoise(seed + tile.x * 137 + tile.y * 149 + offset).random();
    const scaleDown = 0.85; 
    
    let widthFactor = 0.6, heightFactor = 0.6;
    switch (tile.biome) {
      case BiomeType.CITY_CENTER: widthFactor = 0.8; heightFactor = eraLevel >= 6 ? 1.0 : 0.8; break;
      case BiomeType.DENSE_CITY: widthFactor = 0.7; heightFactor = eraLevel >= 6 ? 0.9 : 0.7; break;
      case BiomeType.LOW_DENSITY_CITY: widthFactor = 0.55; heightFactor = 0.5; break;
      case BiomeType.HAMLET: widthFactor = 0.45; heightFactor = 0.4; break;
    }

    const width = size * widthFactor * scaleDown;
    const height = size * heightFactor * scaleDown;
    const xOffset = (size - width) / 2;
    const yOffset = size - height - size * 0.15; // Raised slightly

    const variant = Math.floor(rand(4) * 100);
    const roofColor = getRoofPalette(culturalStyle, eraLevel, variant);
    const hasTimberFrame = rand(7) > 0.5;

    return { width, height, xOffset, yOffset, rand, roofColor, hasTimberFrame };
  }, [seed, tile.x, tile.y, tile.biome, size, eraLevel, culturalStyle]);
  
  const groundPatternColor = useMemo(() => {
    const colors = ['#cd853f', '#a0826d', '#8b7355', '#696969', '#708090', '#778899'];
    return colors[Math.min(eraLevel, colors.length - 1)];
  }, [eraLevel]);

  const renderBuilding = () => {
    const { width, height, xOffset, yOffset, rand, roofColor, hasTimberFrame } = buildingData;
    const commonProps = { x: x + xOffset, y: y + yOffset, width, height, size, seed, tile, roofColor, hasTimberFrame, era: era as HistoricalEra, nightIntensity };
    
    let selectedBuilding = '';
    let buildingComponent = null;
    
    // Cultural mixing system - determine if we should use mixed architecture
    const getMixedCulture = () => {
      const year = parseInt(date.split(' ')[0]) || 1000;
      const isTransitionEra = (eraLevel === 3 && rand(100) > 0.7) || (eraLevel === 4 && rand(101) > 0.8); // Era transitions
      const isCoastalTrade = zone.toLowerCase().includes('coast') || zone.toLowerCase().includes('port') || zone.toLowerCase().includes('mediterranean');
      const isCulturalBorderland = zone.toLowerCase().includes('istanbul') || zone.toLowerCase().includes('spain') || zone.toLowerCase().includes('balkans') || zone.toLowerCase().includes('silk road');
      const isColonialPeriod = year >= 1500 && year <= 1900;
      const isUrbanCenter = tile.biome === BiomeType.CITY_CENTER || tile.biome === BiomeType.DENSE_CITY;
      
      // Determine mixing probability
      let mixingChance = 0;
      if (isCulturalBorderland) mixingChance += 0.4;
      if (isCoastalTrade) mixingChance += 0.2;
      if (isTransitionEra) mixingChance += 0.3;
      if (isColonialPeriod && culturalStyle === 'SUB_SAHARAN_AFRICAN') mixingChance += 0.3; // European colonial influence
      if (isColonialPeriod && culturalStyle === 'SOUTH_AMERICAN') mixingChance += 0.25; // Spanish colonial
      if (isUrbanCenter) mixingChance += 0.1; // Cities more cosmopolitan
      
      // Social stratification - poorer areas have older building styles
      const isSlumsArea = tile.biome === BiomeType.LOW_DENSITY_CITY && rand(150) > 0.6;
      if (isSlumsArea) mixingChance += 0.2; // More likely to have older/mixed styles
      
      if (rand(200) < mixingChance) {
        // Determine secondary culture based on context
        if (culturalStyle === 'MENA' && (isCulturalBorderland || isCoastalTrade)) return 'EUROPEAN';
        if (culturalStyle === 'EUROPEAN' && zone.toLowerCase().includes('istanbul')) return 'MENA';
        if (culturalStyle === 'SUB_SAHARAN_AFRICAN' && isColonialPeriod) return 'EUROPEAN';
        if (culturalStyle === 'SOUTH_AMERICAN' && isColonialPeriod) return 'EUROPEAN';
        if (culturalStyle === 'EAST_ASIAN' && isCoastalTrade && year >= 1800) return 'EUROPEAN';
        if (isTransitionEra && eraLevel === 4) return culturalStyle; // Same culture but mixed eras
      }
      
      return null; // No mixing
    };
    
    const mixedCulture = getMixedCulture();
    const isEraTransition = mixedCulture === culturalStyle; // Same culture, mixed eras
    const useSecondaryBuilding = mixedCulture && rand(300) > 0.5; // 50% chance to use secondary culture's building
    
    // Handle prehistoric era first
    if (eraLevel === 0 && !mixedCulture) {
      selectedBuilding = 'PrehistoricShelter3D';
      buildingComponent = <PrehistoricShelter3D {...commonProps} />;
    } else if (eraLevel >= 6) { // Future era only (post-2000) for skyscrapers
      selectedBuilding = 'ModernSkyscraper3D';
      buildingComponent = <ModernSkyscraper3D {...commonProps} />;
    } else if (eraLevel === 5) { // Modern era (20th century) - mix of building types
      // Mix of industrial, colonial, and early modern buildings for 20th century
      const modernChoice = rand(350);
      if (modernChoice > 0.7) {
        selectedBuilding = 'ModernCivic3D'; // New 20th century archetype
        buildingComponent = <ModernCivic3D {...commonProps} />;
      } else if (modernChoice > 0.5) {
        selectedBuilding = 'IndustrialBuilding3D';
        buildingComponent = <IndustrialBuilding3D {...commonProps} />;
      } else if (modernChoice > 0.25) {
        selectedBuilding = 'GeorgianRowhouse3D';
        buildingComponent = <GeorgianRowhouse3D {...commonProps} />;
      } else {
        selectedBuilding = 'IndustrialRowhouse3D';
        buildingComponent = <IndustrialRowhouse3D {...commonProps} />;
      }
    } else if (eraLevel === 4) {
      // Industrial era with possible era mixing (slums might have older buildings)
      if (isEraTransition && rand(400) > 0.6) {
        // Use earlier era building in industrial slums
        const earlyModernChoice = rand(401);
        if (earlyModernChoice > 0.5) {
          selectedBuilding = 'GeorgianRowhouse3D';
          buildingComponent = <GeorgianRowhouse3D {...commonProps} />;
        } else {
          selectedBuilding = 'MedievalBuilding3D';
          buildingComponent = <MedievalBuilding3D {...commonProps} />;
        }
      } else if (rand(5) > 0.4) {
        selectedBuilding = 'IndustrialBuilding3D';
        buildingComponent = <IndustrialBuilding3D {...commonProps} />;
      } else {
        selectedBuilding = 'IndustrialRowhouse3D';
        buildingComponent = <IndustrialRowhouse3D {...commonProps} />;
      }
    } else {
      // Use mixed culture if available
      const effectiveCulture = useSecondaryBuilding ? mixedCulture : culturalStyle;
      
      switch (effectiveCulture) {
        case 'NORTH_AMERICAN_PRE_COLUMBIAN':
          if (climate === 'cold') {
            selectedBuilding = 'Igloo3D';
            buildingComponent = <Igloo3D {...commonProps} />;
          } else if (climate === 'arid') {
            selectedBuilding = 'AdobeBuilding3D';
            buildingComponent = <AdobeBuilding3D {...commonProps} />;
          } else {
            // Forest regions - use bark longhouses and teepees
            const choice = rand(10);
            if (choice > 0.6) {
              selectedBuilding = 'BarkLonghouse3D';
              buildingComponent = <BarkLonghouse3D {...commonProps} />;
            } else if (choice > 0.3) {
              selectedBuilding = 'NativeTeepee3D';
              buildingComponent = <NativeTeepee3D {...commonProps} />;
            } else {
              selectedBuilding = 'Longhouse3D';
              buildingComponent = <Longhouse3D {...commonProps} />;
            }
          }
          break;
        case 'SOUTH_AMERICAN':
          if (rand(11) > 0.3) {
            selectedBuilding = 'AztecDwelling3D';
            buildingComponent = <AztecDwelling3D {...commonProps} />;
          } else {
            selectedBuilding = 'AdobeBuilding3D';
            buildingComponent = <AdobeBuilding3D {...commonProps} />;
          }
          break;
        case 'SUB_SAHARAN_AFRICAN': 
          if (eraLevel >= 3) {
            selectedBuilding = 'AfricanStoneBuilding3D';
            buildingComponent = <AfricanStoneBuilding3D {...commonProps} />;
          } else {
            selectedBuilding = 'AfricanRoundHut3D';
            buildingComponent = <AfricanRoundHut3D {...commonProps} />;
          }
          break;
        case 'EAST_ASIAN': 
          selectedBuilding = 'EastAsianPagoda3D';
          buildingComponent = <EastAsianPagoda3D {...commonProps} />;
          break;
        case 'SOUTH_ASIAN': 
          selectedBuilding = 'SouthAsianTemple3D';
          buildingComponent = <SouthAsianTemple3D {...commonProps} />;
          break;
        case 'MENA': 
          selectedBuilding = 'OttomanTownhouse3D';
          buildingComponent = <OttomanTownhouse3D {...commonProps} />;
          break;
        case 'OCEANIA':
          selectedBuilding = 'PolynesianHouse3D';
          buildingComponent = <PolynesianHouse3D {...commonProps} />;
          break;
        case 'EUROPEAN':
        default:
          if (tile.biome === BiomeType.HAMLET || tile.biome === BiomeType.LOW_DENSITY_CITY) {
            selectedBuilding = 'EuropeanCottage3D';
            buildingComponent = <EuropeanCottage3D {...commonProps} />;
          } else if (climate === 'cold' && eraLevel === 2) {
            selectedBuilding = 'VikingLonghouse3D';
            buildingComponent = <VikingLonghouse3D {...commonProps} />;
          } else if (eraLevel >= 3) {
            selectedBuilding = 'GeorgianRowhouse3D';
            buildingComponent = <GeorgianRowhouse3D {...commonProps} />;
          } else {
            selectedBuilding = 'MedievalBuilding3D';
            buildingComponent = <MedievalBuilding3D {...commonProps} />;
          }
          break;
      }
    }
    
    // Console logging to show which building type was selected (deterministic)
    if (rand(999) < 0.01) { // Log only 1% of buildings to avoid spam
      const mixingInfo = mixedCulture ? ` [MIXED: ${culturalStyle} + ${mixedCulture}${useSecondaryBuilding ? ' -> using secondary' : ' -> using primary'}]` : '';
      console.log(`Building selected: ${selectedBuilding} for zone: ${zone}, era: ${era}, culture: ${culturalStyle}, climate: ${climate}${mixingInfo}`);
    }
    
    return buildingComponent;
  };

  // Night lighting is now handled by individual building components

  return (
    <g>
      <rect x={x} y={y} width={size} height={size} fill={groundPatternColor} />
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

export default UrbanSymbol;