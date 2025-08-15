/**
 * components/symbols/UrbanSymbol.tsx - Culturally and historically specific urban buildings
 */
import React, { useMemo } from 'react';
import { BiomeType, Tile, HistoricalEra } from '../../types/index';
import { ValueNoise } from '../../utils/noise';
import { parseDateString } from '../../utils/dateUtils';
import { getLocationCulturalStyle, shouldIncludePrehistoricBuildings, getCulturalBuildingStyle } from '../../utils/culturalMappingUtils';

// Type declaration for debug logging
declare global {
  interface Window {
    urbanSymbolLogged?: boolean;
  }
}
import {
  AboriginalHut3D,
  AdobeBuilding3D,
  AfricanRoundHut3D,
  AfricanStoneBuilding3D,
  AztecDwelling3D,
  BambooHouse3D,
  BarkLonghouse3D,
  EastAsianPagoda3D,
  EuropeanCottage3D,
  GeorgianRowhouse3D,
  GreekHouse3D,
  Igloo3D,
  IncaStoneHouse3D,
  IndustrialBuilding3D,
  IndustrialRowhouse3D,
  JapaneseHouse3D,
  Longhouse3D,
  MedievalBuilding3D,
  MediterraneanBuilding3D,
  ModernSkyscraper3D,
  ModernCivic3D,
  NativeTeepee3D,
  OttomanTownhouse3D,
  PolynesianHouse3D,
  PrehistoricShelter3D,
  RomanInsula3D,
  RomanVilla3D,
  SouthAsianTemple3D,
  SouthAsianBuilding3D,
  StiltHouse3D,
  TropicalHut3D,
  VikingLonghouse3D,
  Yurt3D,
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
  location?: string; // Add location prop for better mapping
}

const getCulturalStyle = (zone: string): string => {
  const zoneMap: { [key: string]: string } = {
    'EUROPEAN': 'EUROPEAN', 'EAST_ASIAN': 'EAST_ASIAN', 'SOUTH_ASIAN': 'SOUTH_ASIAN',
    'MENA': 'MENA', 'SUB_SAHARAN_AFRICAN': 'SUB_SAHARAN_AFRICAN',
    'NORTH_AMERICAN_PRE_COLUMBIAN': 'NORTH_AMERICAN_PRE_COLUMBIAN',
    'SOUTH_AMERICAN': 'SOUTH_AMERICAN', 'OCEANIA': 'OCEANIA', 'ABORIGINAL_AUSTRALIAN': 'ABORIGINAL_AUSTRALIAN',
  };
  
  if (zoneMap[zone]) return zoneMap[zone];
  
  const friendlyNameMap: { [key: string]: string } = {
    'europe': 'EUROPEAN', 'east asia': 'EAST_ASIAN', 'south asia': 'SOUTH_ASIAN',
    'middle east': 'MENA', 'mena': 'MENA', 'africa': 'SUB_SAHARAN_AFRICAN',
    'north america': 'NORTH_AMERICAN_PRE_COLUMBIAN', 'south america': 'SOUTH_AMERICAN',
    'oceania': 'OCEANIA', 'australia': 'ABORIGINAL_AUSTRALIAN', 'aboriginal': 'ABORIGINAL_AUSTRALIAN'
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
      'traditional': ['#8b4513', '#a0522d', '#654321'] // Add fallback
    },
    'EAST_ASIAN': { 'traditional': ['#dc143c', '#b22222', '#8b0000'] },
    'SUB_SAHARAN_AFRICAN': { 'traditional': ['#d2a679', '#a0522d', '#8b6f47'] },
    'MENA': { 'traditional': ['#deb887', '#d2b48c', '#f4a460'] },
    'SOUTH_ASIAN': { 'traditional': ['#ff8c00', '#ffa500', '#ff6347'] },
    'SOUTH_AMERICAN': { 'traditional': ['#cd853f', '#daa520', '#b8860b'] },
    'NORTH_AMERICAN_PRE_COLUMBIAN': { 'traditional': ['#8b4513', '#a0522d', '#654321'] },
    'OCEANIA': { 'traditional': ['#8b6f47', '#a0826d', '#deb887'] },
    'MESOAMERICAN': { 'traditional': ['#b22222', '#dc143c', '#8b0000'] },
    'NORTH_AMERICAN': { 'traditional': ['#8b4513', '#654321', '#704214'] },
    'MONGOLIAN': { 'traditional': ['#deb887', '#d2b48c', '#f4a460'] }
  };
  
  let paletteKey = 'traditional';
  if (eraLevel >= 4 && culturalStyle === 'EUROPEAN') paletteKey = 'industrial';
  else if (eraLevel === 3 && culturalStyle === 'EUROPEAN') paletteKey = 'renaissance';
  else if (eraLevel === 2 && culturalStyle === 'EUROPEAN') paletteKey = 'medieval';
  
  const culturePalette = palettes[culturalStyle] || palettes['EUROPEAN'];
  const colors = culturePalette[paletteKey] || culturePalette['traditional'] || ['#8b4513', '#a0522d', '#654321'];
  
  // Safety check to prevent undefined.length error
  if (!colors || !Array.isArray(colors) || colors.length === 0) {
    return '#8b4513'; // Default brown roof color
  }
  
  return colors[variant % colors.length];
};

const UrbanSymbol: React.FC<UrbanSymbolProps> = React.memo(({ x, y, size, seed, tile, date, zone, nightIntensity = 0, location }) => {
  const { era } = parseDateString(date);
  const eraLevel = getEraLevel(era as HistoricalEra);
  
  // Parse year from formatted date like "June 3, 238 BC" or "June 3, 1500 CE"
  const yearMatch = date.match(/(\d+)\s*(BC|BCE|AD|CE)?/);
  let year = yearMatch ? parseInt(yearMatch[1]) : 0;
  if (yearMatch && (yearMatch[2] === 'BC' || yearMatch[2] === 'BCE')) {
    year = -year;
  }
  
  // Use the new cultural mapping system
  const culturalMapping = getLocationCulturalStyle(location || zone, year);
  const culturalStyle = getCulturalBuildingStyle(culturalMapping.primaryCulture);
  const secondaryCulture = culturalMapping.secondaryCulture ? getCulturalBuildingStyle(culturalMapping.secondaryCulture) : null;
  const mixRatio = culturalMapping.mixRatio || 0;
  const specialBuildings = culturalMapping.specialBuildings || [];
  
  // Debug logging for Pacific Coast issue
  if (location && location.toLowerCase().includes('pacific') && year < 1492) {
    console.log('[UrbanSymbol] Pacific Coast detection:', {
      location,
      year,
      culturalMapping,
      culturalStyle,
      specialBuildings
    });
  }
  
  const climate = getClimate(zone);
  const isCityCenter = tile.biome === BiomeType.CITY_CENTER;

  const buildingData = useMemo(() => {
    // Create a single seeded PRNG instance for this tile - this is the key fix!
    const uniqueTileSeed = seed + tile.x * 137 + tile.y * 149;
    const localRand = new ValueNoise(uniqueTileSeed);
    const rand = (offset: number = 0) => {
      // Use the same instance but with a small offset for different random values
      return new ValueNoise(uniqueTileSeed + offset).random();
    };
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
  
  const groundPattern = useMemo(() => {
    // Era-appropriate ground patterns
    const patternId = `ground-${tile.x}-${tile.y}`;
    const baseColors = ['#cd853f', '#a0826d', '#8b7355', '#696969', '#708090', '#778899'];
    const baseColor = baseColors[Math.min(eraLevel, baseColors.length - 1)];
    
    return { patternId, baseColor };
  }, [eraLevel, tile.x, tile.y]);

  // Memoized building selection to prevent random changes on re-renders
  const selectedBuildingData = useMemo(() => {
    const { rand } = buildingData;
    
    // Determine if we should use secondary culture or special buildings
    const useSecondaryBuilding = secondaryCulture && rand(300) < mixRatio;
    const includePrehistoric = shouldIncludePrehistoricBuildings(year, tile.biome === BiomeType.HAMLET ? 'HAMLET' : 'CITY', culturalMapping);
    
    // Check for special building selection
    const selectSpecialBuilding = () => {
      if (!specialBuildings || specialBuildings.length === 0) return null;
      
      // Match special building types to components
      const buildingMap: { [key: string]: any } = {
        'VikingLonghouse3D': VikingLonghouse3D,
        'MediterraneanBuilding3D': MediterraneanBuilding3D,
        'RomanInsula3D': RomanInsula3D,
        'RomanVilla3D': RomanVilla3D,
        'GreekHouse3D': GreekHouse3D,
        'EgyptianBuilding3D': AfricanStoneBuilding3D, // Using as fallback
        'PrehistoricShelter3D': PrehistoricShelter3D,
        'AfricanStoneBuilding3D': AfricanStoneBuilding3D,
        'AfricanRoundHut3D': AfricanRoundHut3D,
        'MesopotamianBuilding3D': OttomanTownhouse3D, // Using as fallback
        'OttomanTownhouse3D': OttomanTownhouse3D,
        'SouthAsianBuilding3D': SouthAsianBuilding3D,
        'EastAsianPagoda3D': EastAsianPagoda3D,
        'JapaneseHouse3D': JapaneseHouse3D,
        'BambooHouse3D': BambooHouse3D,
        'StiltHouse3D': StiltHouse3D,
        'PolynesianHouse3D': PolynesianHouse3D,
        'MaoriPa3D': PolynesianHouse3D, // Using as fallback
        'AboriginalHut3D': AboriginalHut3,
        'Igloo3D': Igloo3D,
        'AdobeBuilding3D': AdobeBuilding3D,
        'NativeTeepee3D': NativeTeepee3D,
        'Longhouse3D': Longhouse3D,
        'BarkLonghouse3D': BarkLonghouse3D,
        'AztecDwelling3D': AztecDwelling3D,
        'IncaStoneHouse3D': IncaStoneHouse3D,
        'TropicalHut3D': TropicalHut3D,
        'Yurt3D': Yurt3D
      };
      
      // Select a building from special buildings list
      const buildingName = specialBuildings[Math.floor(rand(400) * specialBuildings.length)];
      return buildingMap[buildingName] || null;
    };
    
    const SpecialBuilding = selectSpecialBuilding();
    
    let selectedBuilding = '';
    let buildingComponent = null;
    
    // Handle prehistoric buildings or special buildings first
    if (includePrehistoric && rand(450) > 0.7) {
      selectedBuilding = 'PrehistoricShelter3D';
      buildingComponent = PrehistoricShelter3D;
    } else if (SpecialBuilding && rand(451) > 0.05) {
      // Use special buildings 95% of the time when available
      selectedBuilding = 'SpecialBuilding';
      buildingComponent = SpecialBuilding;
    } else if (eraLevel >= 5) {
      // Modern era buildings (20th century onwards)
      const modernChoice = rand(350);
      if (modernChoice > 0.7) {
        selectedBuilding = 'ModernCivic3D'; // New 20th century archetype
        buildingComponent = ModernCivic3D;
      } else if (modernChoice > 0.4) {
        selectedBuilding = 'ModernSkyscraper3D';
        buildingComponent = ModernSkyscraper3D;
      } else {
        selectedBuilding = 'IndustrialBuilding3D';
        buildingComponent = IndustrialBuilding3D;
      }
    } else if (eraLevel === 4) {
      // Industrial era buildings with some Georgian holdovers
      const isEraTransition = tile.biome === BiomeType.LOW_DENSITY_CITY || tile.biome === BiomeType.HAMLET;
      if (isEraTransition && rand(400) > 0.6) {
        // Use earlier era building in industrial slums
        const earlyModernChoice = rand(401);
        if (earlyModernChoice > 0.5) {
          selectedBuilding = 'GeorgianRowhouse3D';
          buildingComponent = GeorgianRowhouse3D;
        } else {
          selectedBuilding = 'EuropeanCottage3D';
          buildingComponent = EuropeanCottage3D;
        }
      } else if (rand(5) > 0.4) {
        selectedBuilding = 'IndustrialBuilding3D';
        buildingComponent = IndustrialBuilding3D;
      } else {
        selectedBuilding = 'IndustrialRowhouse3D';
        buildingComponent = IndustrialRowhouse3D;
      }
    } else {
      // Pre-industrial buildings (Prehistory through Renaissance)
      const cultureToUse = useSecondaryBuilding ? secondaryCulture : culturalStyle;
      switch (cultureToUse) {
        case 'ROMAN':
          if (rand(6) > 0.5) {
            selectedBuilding = 'MediterraneanBuilding3D';
            buildingComponent = MediterraneanBuilding3D;
          } else {
            selectedBuilding = 'EuropeanCottage3D';
            buildingComponent = EuropeanCottage3D;
          }
          break;
        case 'MESOAMERICAN':
          // Use Mediterranean style for colonial and modern Latin America
          if (eraLevel >= 3 && rand(12) > 0.4) {
            selectedBuilding = 'MediterraneanBuilding3D';
            buildingComponent = MediterraneanBuilding3D;
          } else if (rand(11) > 0.3) {
            selectedBuilding = 'AztecDwelling3D';
            buildingComponent = AztecDwelling3D;
          } else {
            selectedBuilding = 'EuropeanCottage3D';
            buildingComponent = EuropeanCottage3D;
          }
          break;
        case 'SUB_SAHARAN_AFRICAN':
          // Colonial era buildings for Africa (1800s+)
          if (year >= 1800 && tile.biome !== BiomeType.HAMLET) {
            // Mix of Mediterranean colonial and some traditional
            if (rand(20) > 0.3) {
              selectedBuilding = 'MediterraneanBuilding3D';
              buildingComponent = MediterraneanBuilding3D;
            } else {
              selectedBuilding = 'AfricanRoundHut3D';
              buildingComponent = AfricanRoundHut3D;
            }
          } else if (year >= 1800 && tile.biome === BiomeType.HAMLET) {
            // Hamlets in colonial era are mostly Mediterranean style
            if (rand(21) > 0.15) {
              selectedBuilding = 'MediterraneanBuilding3D';
              buildingComponent = MediterraneanBuilding3D;
            } else {
              selectedBuilding = 'AfricanRoundHut3D';
              buildingComponent = AfricanRoundHut3D;
            }
          } else {
            // Pre-colonial era - traditional buildings
            selectedBuilding = 'AfricanRoundHut3D';
            buildingComponent = AfricanRoundHut3D;
          }
          break;
        case 'MENA':
          // Colonial/modern era shows more Mediterranean influence
          if (year >= 1850 && rand(22) > 0.4) {
            selectedBuilding = 'MediterraneanBuilding3D';
            buildingComponent = MediterraneanBuilding3D;
          } else {
            selectedBuilding = 'OttomanTownhouse3D';
            buildingComponent = OttomanTownhouse3D;
          }
          break;
        case 'EAST_ASIAN':
          selectedBuilding = 'EastAsianPagoda3D';
          buildingComponent = EastAsianPagoda3D;
          break;
        case 'SOUTH_ASIAN':
          selectedBuilding = 'SouthAsianBuilding3D';
          buildingComponent = SouthAsianBuilding3D;
          break;
        case 'SOUTHEAST_ASIAN':
          selectedBuilding = 'SouthAsianBuilding3D'; // Default fallback
          buildingComponent = SouthAsianBuilding3D;
          break;
        case 'MONGOLIAN':
          selectedBuilding = 'Yurt3D';
          buildingComponent = Yurt3D;
          break;
        case 'ARCTIC':
          selectedBuilding = 'Igloo3D';
          buildingComponent = Igloo3D;
          break;
        case 'NORTH_AMERICAN_PRE_COLUMBIAN':
          // Regional building selection based on geography
          const regionName = zone.toLowerCase();
          if (climate === 'cold' || regionName.includes('arctic') || regionName.includes('alaska')) {
            selectedBuilding = 'Igloo3D';
            buildingComponent = Igloo3D;
          } else if (climate === 'arid' || regionName.includes('southwest') || regionName.includes('desert')) {
            selectedBuilding = 'AdobeBuilding3D';
            buildingComponent = AdobeBuilding3D;
          } else if (regionName.includes('plains') || regionName.includes('great plains')) {
            selectedBuilding = 'NativeTeepee3D';
            buildingComponent = NativeTeepee3D;
          } else if (regionName.includes('pacific') || regionName.includes('northwest')) {
            selectedBuilding = 'Longhouse3D';
            buildingComponent = Longhouse3D;
          } else {
            selectedBuilding = 'BarkLonghouse3D';
            buildingComponent = BarkLonghouse3D;
          }
          break;
        case 'SOUTH_AMERICAN':
          if (eraLevel >= 3 && rand(12) > 0.4) {
            selectedBuilding = 'MediterraneanBuilding3D';
            buildingComponent = MediterraneanBuilding3D;
          } else {
            selectedBuilding = 'AdobeBuilding3D';
            buildingComponent = AdobeBuilding3D;
          }
          break;
        case 'ANDEAN':
          selectedBuilding = 'IncaStoneHouse3D';
          buildingComponent = IncaStoneHouse3D;
          break;
        case 'OCEANIA':
          selectedBuilding = 'PolynesianHouse3D';
          buildingComponent = PolynesianHouse3D;
          break;
        case 'ABORIGINAL_AUSTRALIAN':
          selectedBuilding = 'AboriginalHut3D';
          buildingComponent = AboriginalHut3D;
          break;
        case 'VIKING':
          selectedBuilding = 'VikingLonghouse3D';
          buildingComponent = VikingLonghouse3D;
          break;
        case 'MEDITERRANEAN':
        case 'GREEK':
        case 'CLASSICAL_GREEK':
          selectedBuilding = 'GreekHouse3D';
          buildingComponent = GreekHouse3D;
          break;
        case 'BYZANTINE':
        case 'SLAVIC':
          selectedBuilding = 'MedievalBuilding3D';
          buildingComponent = MedievalBuilding3D;
          break;
        case 'EGYPTIAN':
        case 'ANCIENT_EGYPTIAN':
          selectedBuilding = 'AfricanStoneBuilding3D';
          buildingComponent = AfricanStoneBuilding3D;
          break;
        case 'MESOPOTAMIAN':
        case 'ANCIENT_MESOPOTAMIAN':
          // Use appropriate building for ancient Mesopotamia/Persia
          selectedBuilding = 'OttomanTownhouse3D';
          buildingComponent = OttomanTownhouse3D;
          break;
        case 'EUROPEAN':
          const isMediterraneanEurope = zone?.toLowerCase().includes('mediterranean') || 
                                     zone?.toLowerCase().includes('italy') || 
                                     zone?.toLowerCase().includes('spain') || 
                                     zone?.toLowerCase().includes('portugal') ||
                                     zone?.toLowerCase().includes('greece') ||
                                     zone?.toLowerCase().includes('southern');
          
          // Mediterranean regions or colonial contexts get Mediterranean buildings
          if ((isMediterraneanEurope || climate === 'arid' || climate === 'tropical') && eraLevel >= 1) {
            if (rand(13) > 0.2) {
              selectedBuilding = 'MediterraneanBuilding3D';
              buildingComponent = MediterraneanBuilding3D;
            } else {
              selectedBuilding = 'EuropeanCottage3D';
              buildingComponent = EuropeanCottage3D;
            }
          } else if (tile.biome === BiomeType.HAMLET) {
            // Hamlets in later eras often use Mediterranean style
            if (eraLevel >= 3 && rand(14) > 0.4) {
              selectedBuilding = 'MediterraneanBuilding3D';
              buildingComponent = MediterraneanBuilding3D;
            } else if (eraLevel >= 2 && rand(15) > 0.5) {
              selectedBuilding = 'GeorgianRowhouse3D';
              buildingComponent = GeorgianRowhouse3D;
            } else if (eraLevel >= 1 && rand(16) > 0.4) {
              selectedBuilding = 'MedievalBuilding3D';
              buildingComponent = MedievalBuilding3D;
            } else {
              selectedBuilding = 'EuropeanCottage3D';
              buildingComponent = EuropeanCottage3D;
            }
          } else if (tile.biome === BiomeType.LOW_DENSITY_CITY) {
            if (eraLevel >= 2 && rand(14) > 0.5) {
              selectedBuilding = 'GeorgianRowhouse3D';
              buildingComponent = GeorgianRowhouse3D;
            } else if (eraLevel >= 1 && rand(15) > 0.4) {
              selectedBuilding = 'MedievalBuilding3D';
              buildingComponent = MedievalBuilding3D;
            } else {
              selectedBuilding = 'EuropeanCottage3D';
              buildingComponent = EuropeanCottage3D;
            }
          } else {
            // Dense city areas
            if (eraLevel >= 2 && rand(16) > 0.3) {
              selectedBuilding = 'GeorgianRowhouse3D';
              buildingComponent = GeorgianRowhouse3D;
            } else if (eraLevel >= 1 && rand(17) > 0.6) {
              selectedBuilding = 'MedievalBuilding3D';
              buildingComponent = MedievalBuilding3D;
            } else {
              selectedBuilding = 'EuropeanCottage3D';
              buildingComponent = EuropeanCottage3D;
            }
          }
          break;
        default:
          // Better default fallback - use special buildings if available
          if (SpecialBuilding) {
            selectedBuilding = 'SpecialBuilding';
            buildingComponent = SpecialBuilding;
          } else {
            // Culturally appropriate fallback based on primary culture
            const primaryCultureFallback = culturalMapping.primaryCulture;
            
            // Map primary cultures to appropriate fallback buildings
            if (primaryCultureFallback === 'EAST_ASIAN') {
              selectedBuilding = 'EastAsianPagoda3D';
              buildingComponent = EastAsianPagoda3D;
            } else if (primaryCultureFallback === 'SOUTH_ASIAN') {
              selectedBuilding = 'SouthAsianBuilding3D';
              buildingComponent = SouthAsianBuilding3D;
            } else if (primaryCultureFallback === 'SUB_SAHARAN_AFRICAN') {
              selectedBuilding = 'AfricanRoundHut3D';
              buildingComponent = AfricanRoundHut3D;
            } else if (primaryCultureFallback === 'MENA') {
              selectedBuilding = 'OttomanTownhouse3D';
              buildingComponent = OttomanTownhouse3D;
            } else if (primaryCultureFallback === 'NORTH_AMERICAN_PRE_COLUMBIAN') {
              selectedBuilding = 'AztecDwelling3D';
              buildingComponent = AztecDwelling3D;
            } else if (primaryCultureFallback === 'SOUTH_AMERICAN') {
              selectedBuilding = 'AdobeBuilding3D';
              buildingComponent = AdobeBuilding3D;
            } else if (primaryCultureFallback === 'OCEANIA') {
              selectedBuilding = 'PolynesianHouse3D';
              buildingComponent = PolynesianHouse3D;
            } else if (primaryCultureFallback === 'ABORIGINAL_AUSTRALIAN') {
              selectedBuilding = 'AboriginalHut3D';
              buildingComponent = AboriginalHut3D;
            } else if (primaryCultureFallback === 'ARCTIC') {
              selectedBuilding = 'Igloo3D';
              buildingComponent = Igloo3D;
            } else {
              // Last resort for truly unknown cultures
              selectedBuilding = 'EuropeanCottage3D';
              buildingComponent = EuropeanCottage3D;
            }
          }
          break;
      }
    }

    return { selectedBuilding, buildingComponent };
  }, [buildingData, secondaryCulture, mixRatio, year, culturalMapping, specialBuildings, eraLevel, tile.biome, culturalStyle, zone, climate]);

  const renderBuilding = () => {
    const { width, height, xOffset, yOffset, roofColor, hasTimberFrame } = buildingData;
    const { selectedBuilding, buildingComponent } = selectedBuildingData;
    const commonProps = { x: x + xOffset, y: y + yOffset, width, height, size, seed, tile, roofColor, hasTimberFrame, era: era as HistoricalEra, nightIntensity };
    
    // Building selection is now memoized above to prevent changes on re-renders
    if (!buildingComponent) {
      console.error(`[UrbanSymbol] No building component selected! culturalStyle: ${culturalStyle}, era: ${era}, eraLevel: ${eraLevel}, year: ${year}`);
      return null; // Fallback if no building component selected
    }
    
    // Render the memoized building component
    const buildingElement = React.createElement(buildingComponent, commonProps);
    
    // Debug logging - only log one building to avoid spam  
    const shouldLog = tile.x === 0 && tile.y === 0 && !window.urbanSymbolLogged;
    if (shouldLog) {
      window.urbanSymbolLogged = true;
      const mixingInfo = secondaryCulture ? ` [MIXED: ${culturalStyle} + ${secondaryCulture}]` : '';
      const specialInfo = specialBuildings.length > 0 ? ` [SPECIAL: ${specialBuildings.join(', ')}]` : '';
      console.log(`[UrbanSymbol] Debug Info:
        - location param: "${location}"
        - zone param: "${zone}"
        - year: ${year}
        - culturalMapping.primaryCulture: "${culturalMapping.primaryCulture}"
        - culturalStyle (after mapping): "${culturalStyle}"
        - secondaryCulture: "${secondaryCulture}"
        - selectedBuilding: "${selectedBuilding}"
        ${mixingInfo}${specialInfo}`);
      // Reset after 5 seconds so we can see logs again if map regenerates
      setTimeout(() => { window.urbanSymbolLogged = false; }, 5000);
    }
    
    return buildingElement;
  };

  // Night lighting is now handled by individual building components

  return (
    <g>
      <defs>
        {/* Era-appropriate ground patterns */}
        <pattern id={groundPattern.patternId} patternUnits="userSpaceOnUse" width={eraLevel >= 4 ? "12" : "10"} height={eraLevel >= 4 ? "12" : "10"}>
          {eraLevel === 0 && (
            // Prehistory - dirt
            <>
              <rect width="10" height="10" fill={groundPattern.baseColor} opacity="0.3"/>
              <circle cx="2" cy="2" r="1" fill="rgba(139,69,19,0.2)"/>
              <circle cx="7" cy="5" r="0.8" fill="rgba(160,82,45,0.15)"/>
              <circle cx="4" cy="8" r="0.6" fill="rgba(139,69,19,0.15)"/>
            </>
          )}
          {(eraLevel === 1 || eraLevel === 2) && (
            // Antiquity/Medieval - cobblestone
            <>
              <rect width="10" height="10" fill={groundPattern.baseColor} opacity="0.35"/>
              <rect x="0" y="0" width="4.5" height="4.5" fill="rgba(105,105,105,0.2)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.3"/>
              <rect x="5" y="0" width="4.5" height="4.5" fill="rgba(119,136,153,0.2)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.3"/>
              <rect x="0" y="5" width="4.5" height="4.5" fill="rgba(119,136,153,0.2)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.3"/>
              <rect x="5" y="5" width="4.5" height="4.5" fill="rgba(105,105,105,0.2)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.3"/>
            </>
          )}
          {eraLevel === 3 && (
            // Renaissance - brick
            <>
              <rect width="10" height="10" fill={groundPattern.baseColor} opacity="0.35"/>
              <rect x="0" y="0" width="4.8" height="2.3" fill="rgba(178,34,34,0.25)" stroke="rgba(0,0,0,0.15)" strokeWidth="0.2"/>
              <rect x="5" y="0" width="4.8" height="2.3" fill="rgba(160,82,45,0.25)" stroke="rgba(0,0,0,0.15)" strokeWidth="0.2"/>
              <rect x="0" y="2.5" width="4.8" height="2.3" fill="rgba(160,82,45,0.25)" stroke="rgba(0,0,0,0.15)" strokeWidth="0.2"/>
              <rect x="5" y="2.5" width="4.8" height="2.3" fill="rgba(178,34,34,0.25)" stroke="rgba(0,0,0,0.15)" strokeWidth="0.2"/>
              <rect x="0" y="5" width="4.8" height="2.3" fill="rgba(178,34,34,0.25)" stroke="rgba(0,0,0,0.15)" strokeWidth="0.2"/>
              <rect x="5" y="5" width="4.8" height="2.3" fill="rgba(160,82,45,0.25)" stroke="rgba(0,0,0,0.15)" strokeWidth="0.2"/>
              <rect x="0" y="7.5" width="4.8" height="2.3" fill="rgba(160,82,45,0.25)" stroke="rgba(0,0,0,0.15)" strokeWidth="0.2"/>
              <rect x="5" y="7.5" width="4.8" height="2.3" fill="rgba(178,34,34,0.25)" stroke="rgba(0,0,0,0.15)" strokeWidth="0.2"/>
            </>
          )}
          {(eraLevel === 4 || eraLevel === 5) && (
            // Industrial/Modern - stone/concrete
            <>
              <rect width="12" height="12" fill={groundPattern.baseColor} opacity="0.3"/>
              <rect x="0" y="0" width="5.8" height="5.8" fill="rgba(112,128,144,0.2)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.2"/>
              <rect x="6" y="0" width="5.8" height="5.8" fill="rgba(128,128,128,0.2)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.2"/>
              <rect x="0" y="6" width="5.8" height="5.8" fill="rgba(128,128,128,0.2)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.2"/>
              <rect x="6" y="6" width="5.8" height="5.8" fill="rgba(112,128,144,0.2)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.2"/>
            </>
          )}
          {eraLevel >= 6 && (
            // Future - asphalt
            <>
              <rect width="12" height="12" fill={groundPattern.baseColor} opacity="0.25"/>
              <rect x="0" y="5.5" width="12" height="1" fill="rgba(255,255,255,0.15)"/>
              <rect x="5.5" y="0" width="1" height="12" fill="rgba(255,255,255,0.15)"/>
              <circle cx="3" cy="3" r="0.3" fill="rgba(64,64,64,0.3)"/>
              <circle cx="9" cy="9" r="0.3" fill="rgba(64,64,64,0.3)"/>
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

export default UrbanSymbol;