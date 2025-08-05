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
  AztecDwelling3D,
  EastAsianPagoda3D,
  EuropeanCottage3D,
  GeorgianRowhouse3D,
  Igloo3D,
  IndustrialBuilding3D,
  IndustrialRowhouse3D,
  Longhouse3D,
  MedievalBuilding3D,
  ModernSkyscraper3D,
  NativeTeepee3D,
  OttomanTownhouse3D,
  SouthAsianTemple3D,
} from './buildings';

interface UrbanSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  date: string;
  zone: string;
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

const UrbanSymbol: React.FC<UrbanSymbolProps> = React.memo(({ x, y, size, seed, tile, date, zone }) => {
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
      case BiomeType.CITY_CENTER: widthFactor = 0.8; heightFactor = eraLevel >= 5 ? 1.0 : 0.8; break;
      case BiomeType.DENSE_CITY: widthFactor = 0.7; heightFactor = eraLevel >= 5 ? 0.9 : 0.7; break;
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
    const commonProps = { x: x + xOffset, y: y + yOffset, width, height, size, seed, tile, roofColor, hasTimberFrame, era: era as HistoricalEra };
    
    if (eraLevel >= 5) return <ModernSkyscraper3D {...commonProps} />;
    
    if (eraLevel === 4) {
      return rand(5) > 0.4 ? <IndustrialBuilding3D {...commonProps} /> : <IndustrialRowhouse3D {...commonProps} />;
    }

    switch (culturalStyle) {
      case 'NORTH_AMERICAN_PRE_COLUMBIAN':
        if (climate === 'cold') return <Igloo3D {...commonProps} />;
        if (climate === 'arid') return <AdobeBuilding3D {...commonProps} />;
        return rand(10) > 0.5 ? <NativeTeepee3D {...commonProps} /> : <Longhouse3D {...commonProps} />;
      case 'SOUTH_AMERICAN':
        return rand(11) > 0.3 ? <AztecDwelling3D {...commonProps} /> : <AdobeBuilding3D {...commonProps} />;
      case 'SUB_SAHARAN_AFRICAN': return <AfricanRoundHut3D {...commonProps} />;
      case 'EAST_ASIAN': return <EastAsianPagoda3D {...commonProps} />;
      case 'SOUTH_ASIAN': return <SouthAsianTemple3D {...commonProps} />;
      case 'MENA': return <OttomanTownhouse3D {...commonProps} />;
      case 'EUROPEAN':
      case 'OCEANIA':
      default:
         if (tile.biome === BiomeType.HAMLET || tile.biome === BiomeType.LOW_DENSITY_CITY) {
            return <EuropeanCottage3D {...commonProps} />;
        }
        if(eraLevel >= 3) return <GeorgianRowhouse3D {...commonProps} />;
        return <MedievalBuilding3D {...commonProps} />;
    }
  };

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