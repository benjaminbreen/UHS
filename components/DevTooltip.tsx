/**
 * DevTooltip.tsx - Comprehensive tile information display with strategic analysis
 * 
 * This enhanced tooltip provides exhaustive information about any tile including:
 * - Complete tile properties and qualities
 * - Strategic assessments and recommendations
 * - Nearby features analysis
 * - Environmental context and relationships
 * - Gameplay implications and tactical considerations
 * 
 * The tooltip uses color coding, icons, and contextual descriptions to help
 * players understand the complex strategic implications of each tile.
 * Now includes support for new biome type: Dense Forest and Riverbank.
 * Features a collapsible interface, can be pinned open with Command-Click or ⌘⌥T,
 * and closes when clicking outside or via its toggle.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Tile, BiomeType, ClimateType, MapArchetype, DevTooltipDisplayData, AnyTile, VegetationEntity, TerrainStructure } from '../types/index';
import { MAP_WIDTH_TILES, MAP_HEIGHT_TILES } from '../constants/index';

const getBiomeDescription = (biome: BiomeType): { description: string; characteristics: string[] } => {
  switch (biome) {
    case BiomeType.DEEP_OCEAN: return { description: "Vast, deep expanses of open water far from land. Home to large marine life and subject to powerful storms.", characteristics: ["Significant depth", "Low light penetration", "Often turbulent", "Supports large marine creatures"] };
    case BiomeType.SHALLOW_OCEAN: return { description: "Coastal waters that are relatively shallow, allowing sunlight to penetrate. Supports diverse marine ecosystems and often calmer than deep ocean.", characteristics: ["Near coastlines", "Sunlit waters", "Rich in marine life", "Suitable for fishing"] };
    case BiomeType.BEACH: return { description: "Sandy or pebbly shores where land meets the ocean or large bodies of water. A transitional zone shaped by tides and waves.", characteristics: ["Coastal interface", "Often sandy/gravelly", "Tidal influence", "Potential for landing sites"] };
    case BiomeType.GRASSLAND: return { description: "Open plains dominated by grasses with few trees. Suitable for grazing animals and agriculture if fertile and water is available.", characteristics: ["Open terrain", "Dominantly grass", "Variable fertility", "Good visibility"] };
    case BiomeType.FOREST: return { description: "Areas predominantly covered by trees and other woody vegetation. Supports a wide range of flora and fauna, providing timber and cover.", characteristics: ["Tree cover", "Source of timber", "Diverse wildlife", "Moderate fire risk"] };
    case BiomeType.DENSE_FOREST: return { description: "Thick, old-growth forests with a dense canopy and limited undergrowth. Often feels ancient, secluded, and difficult to traverse.", characteristics: ["Very dense tree cover", "Reduced sunlight on forest floor", "Rich in old-growth resources", "Difficult navigation"] };
    case BiomeType.HILLS: return { description: "Elevated terrain with rolling slopes, less rugged than mountains. Often offers good views, defensible positions, and varied microclimates.", characteristics: ["Rolling terrain", "Moderate elevation", "Strategic vantage points", "Potential for terraced farming"] };
    case BiomeType.MOUNTAIN: return { description: "High, rugged landforms with steep slopes and significant elevation. Often difficult to traverse and build upon, rich in minerals.", characteristics: ["High elevation", "Steep slopes", "Potential for mining", "Natural barrier"] };
    case BiomeType.HIGH_PEAK: return { description: "The highest points of mountain ranges, often barren rock exposed to harsh weather. A symbol of remoteness and challenge.", characteristics: ["Extreme elevation", "Barren rock", "Harsh climate", "Often sacred or mystical"] };
    case BiomeType.SNOW: return { description: "Areas permanently or seasonally covered in snow and ice. Extremely cold and challenging for survival, requiring special adaptation.", characteristics: ["Snow/ice cover", "Very cold", "Difficult terrain", "Limited resources"] };
    case BiomeType.RIVER: return { description: "Flowing bodies of freshwater that carve paths through the land, eventually reaching larger water bodies. Supports riparian ecosystems.", characteristics: ["Flowing fresh water", "Supports riparian ecosystems", "Transportation routes", "Source of drinking water"] };
    case BiomeType.MAJOR_RIVER: return { description: "Large, wide rivers capable of supporting significant boat traffic. Key arteries for trade, settlement, and transport.", characteristics: ["Wide freshwater channel", "Navigable by larger vessels", "Important for commerce", "Fertile floodplains nearby"] };
    case BiomeType.RIVERBANK: return { description: "Fertile land immediately adjacent to rivers, enriched by alluvial deposits and consistent water supply. Ideal for agriculture.", characteristics: ["Adjacent to rivers", "Fertile soil", "Rich in local flora/fauna", "Good for farming"] };
    case BiomeType.HAMLET: return { description: "A small rural settlement, typically consisting of a few houses and basic amenities. Often agrarian and self-sufficient.", characteristics: ["Small population", "Rural setting", "Basic infrastructure", "Close-knit community"] };
    case BiomeType.LOW_DENSITY_CITY: return { description: "Suburban or town-like areas with spread-out housing, some commercial activity, and organized infrastructure.", characteristics: ["Moderate population density", "Organized layout", "Mix of residential/commercial", "Basic services available"] };
    case BiomeType.DENSE_CITY: return { description: "The bustling core of a large urban area, characterized by closely packed buildings, high population density, and significant commerce and culture.", characteristics: ["High population density", "Concentrated buildings", "Major commercial hub", "Advanced services and infrastructure"] };
    case BiomeType.URBAN: return { description: "General urbanized area. This category is largely superseded by more specific settlement types like Hamlet, Low Density, and Dense City.", characteristics: ["Developed land", "Human settlement", "Infrastructure present", "Legacy classification"] };
    case BiomeType.JUNGLE: return { description: "Dense, tropical forests with high rainfall, humidity, and extremely rich biodiversity. Challenging to navigate and can harbor diseases.", characteristics: ["Tropical, dense vegetation", "High humidity and rainfall", "Exceptional biodiversity", "Difficult travel, disease risk"] };
    case BiomeType.DESERT: return { description: "Arid landscapes with sparse vegetation, extreme temperatures, and limited water sources. Survival is difficult without preparation.", characteristics: ["Arid, dry conditions", "Sparse vegetation", "Extreme temperatures", "Water scarcity"] };
    case BiomeType.OASIS: return { description: "A fertile spot in a desert where water is found, supporting vegetation and life. Vital for desert survival and often contested.", characteristics: ["Water source in desert", "Supports local flora/fauna", "Crucial resource point", "Strategic value"] };
    case BiomeType.WETLANDS: return { description: "Areas saturated with water, such as swamps, marshes, or bogs. Characterized by water-tolerant plants and unique ecosystems, often difficult to cross.", characteristics: ["Water-saturated land", "Unique ecosystem", "Often difficult to traverse", "Rich in specific resources, potential diseases"] };
    case BiomeType.REEF: return { description: "Underwater structures made of coral, typically found in warm, shallow ocean waters. Teeming with marine life but hazardous for navigation.", characteristics: ["Coral formations", "Shallow, warm waters", "High marine biodiversity", "Navigation hazard"] };
    case BiomeType.SCRUB: return { description: "Dry areas covered with low-growing shrubs and hardy vegetation. Often found in semi-arid regions or as a transition zone between biomes.", characteristics: ["Low-growing shrubs", "Dry conditions", "Hardy vegetation", "Moderate resources"] };
    case BiomeType.TUNDRA: return { description: "Cold, treeless plains with permafrost. Vegetation is limited to low-growing plants like mosses, lichens, and dwarf shrubs.", characteristics: ["Permafrost", "Treeless", "Low-growing vegetation", "Harsh, cold climate"] };
    case BiomeType.STEPPE: return { description: "Expansive, semi-arid grasslands with few trees, often found in continental interiors. Characterized by temperature extremes.", characteristics: ["Semi-arid grassland", "Few trees", "Temperature extremes", "Supports grazing herds"] };
    case BiomeType.MANGROVE: return { description: "Coastal wetlands in tropical/subtropical regions dominated by salt-tolerant mangrove trees. Important nursery for marine life.", characteristics: ["Salt-tolerant trees", "Coastal wetland", "Rich marine nursery", "Difficult to traverse"] };
    case BiomeType.VOLCANIC_SOIL: return { description: "Land covered in fertile soil derived from volcanic ash and rock. Excellent for agriculture once weathered.", characteristics: ["Rich in minerals", "Fertile when weathered", "Near volcanic activity", "Can be unstable"] };
    case BiomeType.VOLCANIC_ROCK: return { description: "Barren landscapes formed by recent lava flows or volcanic ejecta. Difficult to cultivate or build upon.", characteristics: ["Recent lava/rock", "Barren terrain", "Difficult to develop", "Geologically active"] };
    case BiomeType.ACTIVE_LAVA: return { description: "Areas with flowing or recently solidified molten rock. Extremely dangerous and constantly changing.", characteristics: ["Molten rock", "Extreme heat", "Highly dangerous", "Dynamic terrain"] };
    case BiomeType.SHOALS_TILE: return { description: "Shallow, often submerged or partially exposed land in a body of water, hazardous to navigation.", characteristics: ["Shallow water hazard", "Submerged/exposed land", "Navigational challenge", "Rich in fish/shellfish"] };
    case BiomeType.SALT_FLATS: return { description: "Flat expanses of land covered with salt and other minerals, usually found in deserts where water has evaporated.", characteristics: ["Salt-covered", "Flat terrain", "Arid environment", "Often barren"] };
    case BiomeType.HOT_SPRINGS: return { description: "Geothermally heated groundwater emerging from the Earth's crust. Often rich in minerals and can support unique ecosystems.", characteristics: ["Geothermal heated water", "Mineral-rich", "Can be therapeutic", "Unique local ecosystem"] };
    case BiomeType.FARMLAND: return { description: "Land actively cultivated for agriculture. Supports crops and livestock, usually found near settlements.", characteristics: ["Cultivated land", "Supports crops/livestock", "Usually near settlements", "Human-modified landscape"] };
    case BiomeType.RUINS: return { description: "Remains of ancient or abandoned structures, hinting at past civilizations or events. May contain valuable artifacts or dangers.", characteristics: ["Ancient structures", "Abandoned", "Historical significance", "Potential treasures/dangers"] };
    case BiomeType.CLIFF: return { description: "Steep, often vertical rock faces, typically found at coastlines or along river gorges. Can be dramatic and offer strategic views but are hazardous.", characteristics: ["Steep rock face", "Hazardous terrain", "Often coastal or riverine", "Potential for views/defense"] };
    case BiomeType.PALACE: return { description: "A grand residence, often the seat of power for a ruler or noble. Well-defended and opulent.", characteristics: ["Seat of power", "Opulent architecture", "High security", "Political center"] };
    case BiomeType.HOLY_SITE: return { description: "A location of profound religious or spiritual importance, attracting pilgrims and devotees.", characteristics: ["Spiritually significant", "Pilgrimage destination", "Often isolated", "High sacrality"] };
    case BiomeType.MARKETPLACE: return { description: "An open area dedicated to commerce, filled with stalls, merchants, and shoppers. A hub of economic activity.", characteristics: ["Commercial hub", "Open-air stalls", "High foot traffic", "Economic center"] };
    case BiomeType.GOVERNMENT_DISTRICT: return { description: "An area with imposing administrative buildings, courthouses, and plazas. The center of civic power and bureaucracy.", characteristics: ["Administrative center", "Formal architecture", "High security", "Political power"] };
    default: return { description: "An unknown or undefined area.", characteristics: ["No specific data available"] };
  }
};

interface DevTooltipProps {
  hoveredData: DevTooltipDisplayData | null;
  pinnedData: DevTooltipDisplayData | null;
  isPinnedOpen: boolean;
  onCondense: () => void;
}


const getQualityColor = (value: number, reverse: boolean = false): string => {
  if (reverse) {
    if (value >= 0.8) return 'text-red-500'; if (value >= 0.6) return 'text-orange-400'; if (value >= 0.4) return 'text-yellow-400'; if (value >= 0.2) return 'text-green-400'; return 'text-green-500';
  } else {
    if (value >= 0.8) return 'text-green-500'; if (value >= 0.6) return 'text-green-400'; if (value >= 0.4) return 'text-yellow-400'; if (value >= 0.2) return 'text-orange-400'; return 'text-red-500';
  }
};

const getQualityBar = (value: number, reverse: boolean = false): JSX.Element => {
  const percentage = Math.max(0, Math.min(100, Math.round(value * 100)));
  const colorClass = reverse 
    ? value >= 0.7 ? 'bg-red-500' : value >= 0.4 ? 'bg-yellow-500' : 'bg-green-500'
    : value >= 0.7 ? 'bg-green-500' : value >= 0.4 ? 'bg-yellow-500' : 'bg-red-500';
  return (<div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden"><div className={`h-full ${colorClass} transition-all duration-300`} style={{ width: `${percentage}%` }}/></div>);
};

const getDetailedQualityDescription = (value: number, qualityType: string): { description: string; tactics: string } => {
  const ranges = {
    flammability: { veryHigh: { description: 'Extreme Fire Hazard', tactics: 'Avoid during dry seasons, firebreaks essential' }, high: { description: 'High Fire Risk', tactics: 'Monitor weather, prepare firefighting resources' }, medium: { description: 'Moderate Fire Risk', tactics: 'Standard fire precautions sufficient' }, low: { description: 'Low Fire Risk', tactics: 'Safe for most activities year-round' }, veryLow: { description: 'Fire Resistant', tactics: 'Excellent for storing flammables' } },
    biodiversity: { veryHigh: { description: 'Pristine Ecosystem', tactics: 'Excellent hunting/foraging, research value' }, high: { description: 'Rich Wildlife', tactics: 'Good hunting grounds, medicinal plants' }, medium: { description: 'Moderate Life', tactics: 'Some wildlife, basic resources' }, low: { description: 'Sparse Life', tactics: 'Limited resources, poor foraging' }, veryLow: { description: 'Ecological Desert', tactics: 'Bring all supplies, no local resources' } },
    healthiness: { veryHigh: { description: 'Pristine Environment', tactics: 'Ideal for settlements, healing locations' }, high: { description: 'Healthy Climate', tactics: 'Safe for long-term habitation' }, medium: { description: 'Moderate Health Risk', tactics: 'Basic medical preparations needed' }, low: { description: 'Disease Environment', tactics: 'Medical support essential, avoid if possible' }, veryLow: { description: 'Severe Health Hazard', tactics: 'Extreme danger - protective gear required' } },
    sacrality: { veryHigh: { description: 'Sacred Sanctuary', tactics: 'Religious significance, potential temples' }, high: { description: 'Holy Ground', tactics: 'Spiritual value, pilgrimage destination' }, medium: { description: 'Some Significance', tactics: 'Minor cultural importance' }, low: { description: 'Mundane Location', tactics: 'No special cultural considerations' }, veryLow: { description: 'Profane Ground', tactics: 'May have negative spiritual associations' } },
    safety: { veryHigh: { description: 'Extremely Secure', tactics: 'Perfect for valuable storage, VIP housing' }, high: { description: 'Very Safe', tactics: 'Excellent settlement location' }, medium: { description: 'Moderate Security', tactics: 'Standard precautions sufficient' }, low: { description: 'Dangerous Area', tactics: 'Armed escorts recommended' }, veryLow: { description: 'Extreme Danger', tactics: 'Avoid or bring significant protection' } }
  };
  const qualityRanges = ranges[qualityType as keyof typeof ranges];
  if (!qualityRanges) return { description: 'Unknown', tactics: 'No data available' };
  if (value >= 0.8) return qualityRanges.veryHigh; if (value >= 0.6) return qualityRanges.high; if (value >= 0.4) return qualityRanges.medium; if (value >= 0.2) return qualityRanges.low; return qualityRanges.veryLow;
};

const analyzeNearbyFeatures = (tile: Tile, tiles: Tile[][]): { nearestWater: number; nearestUrban: number; nearestMountain: number; coastalAccess: boolean; riverAccess: boolean; resourceDensity: string; } => {
  const { x, y } = tile; let nearestWater = Infinity; let nearestUrban = Infinity; let nearestMountain = Infinity; let coastalAccess = false; let riverAccess = false;
  const waterBiomes = new Set([BiomeType.RIVER, BiomeType.MAJOR_RIVER, BiomeType.SHALLOW_OCEAN, BiomeType.DEEP_OCEAN, BiomeType.WETLANDS, BiomeType.OASIS, BiomeType.REEF, BiomeType.SHOALS_TILE, BiomeType.HOT_SPRINGS]);
  const urbanBiomes = new Set([BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.URBAN, BiomeType.PALACE]);
  const mountainBiomes = new Set([BiomeType.MOUNTAIN, BiomeType.HIGH_PEAK, BiomeType.SNOW]);
  const maxRadius = 15;
  for (let radius = 1; radius <= maxRadius; radius++) { for (let dy = -radius; dy <= radius; dy++) { for (let dx = -radius; dx <= radius; dx++) { if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue; const checkX = x + dx; const checkY = y + dy; if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) { const checkTile = tiles[checkY][checkX]; const distance = Math.sqrt(dx * dx + dy * dy); if (waterBiomes.has(checkTile.biome) && distance < nearestWater) nearestWater = distance; if (urbanBiomes.has(checkTile.biome) && distance < nearestUrban) nearestUrban = distance; if (mountainBiomes.has(checkTile.biome) && distance < nearestMountain) nearestMountain = distance; } } } if (nearestWater < Infinity && nearestUrban < Infinity && nearestMountain < Infinity && radius > 1) break; }
  for (let dy = -1; dy <= 1; dy++) { for (let dx = -1; dx <= 1; dx++) { if (dx === 0 && dy === 0) continue; const checkX = x + dx; const checkY = y + dy; if (checkX >= 0 && checkX < MAP_WIDTH_TILES && checkY >= 0 && checkY < MAP_HEIGHT_TILES) { const checkTile = tiles[checkY][checkX]; if (checkTile.biome === BiomeType.SHALLOW_OCEAN || checkTile.biome === BiomeType.DEEP_OCEAN || checkTile.biome === BiomeType.REEF) coastalAccess = true; if (checkTile.biome === BiomeType.RIVER || checkTile.biome === BiomeType.MAJOR_RIVER) riverAccess = true; } } }
  let resourceDensity = 'Unknown'; if (tile.qualities.biodiversity >= 0.7) resourceDensity = 'Abundant'; else if (tile.qualities.biodiversity >= 0.4) resourceDensity = 'Moderate'; else if (tile.qualities.biodiversity >= 0.2) resourceDensity = 'Sparse'; else resourceDensity = 'Barren';
  return { nearestWater: nearestWater === Infinity ? -1 : nearestWater, nearestUrban: nearestUrban === Infinity ? -1 : nearestUrban, nearestMountain: nearestMountain === Infinity ? -1 : nearestMountain, coastalAccess, riverAccess, resourceDensity };
};

const generateStrategicRecommendations = (tile: Tile, analysis: ReturnType<typeof analyzeNearbyFeatures>, climate: ClimateType): string[] => {
  const recommendations: string[] = [];
  if (tile.qualities.safety > 0.6 && tile.qualities.healthiness > 0.6 && tile.isLand) { if (analysis.coastalAccess || analysis.riverAccess) recommendations.push('🏰 Excellent location for major settlement'); else recommendations.push('🏘️ Good location for inland settlement'); }
  if (tile.qualities.biodiversity > 0.7) recommendations.push('🌿 Prime hunting and foraging grounds');
  if ((tile.biome === BiomeType.FOREST || tile.biome === BiomeType.DENSE_FOREST) && tile.qualities.flammability < 0.5) recommendations.push('🌲 Sustainable timber resource');
  if (tile.biome === BiomeType.DENSE_FOREST) recommendations.push('🌳 Premium hardwood and rare botanicals');
  if (tile.biome === BiomeType.RIVERBANK) recommendations.push('🌾 Fertile agricultural land');
  if (tile.biome === BiomeType.HILLS || tile.biome === BiomeType.MOUNTAIN) recommendations.push('⛰️ Potential mining opportunities');
  if (analysis.coastalAccess && tile.qualities.safety > 0.5) recommendations.push('⚓ Strategic port location');
  if (analysis.riverAccess && tile.qualities.safety > 0.4) recommendations.push('🚢 River trade route access');
  if (tile.altitude > 0.6 && tile.qualities.safety > 0.7) recommendations.push('🛡️ Natural fortress position');
  if (tile.qualities.flammability > 0.7) recommendations.push('🔥 Requires fire prevention measures');
  if (tile.qualities.sacrality > 0.6) recommendations.push('✨ Consider for religious structures');
  if (climate === ClimateType.ARID && tile.biome === BiomeType.OASIS) recommendations.push('💧 Critical water source - heavily guard');
  if (climate === ClimateType.TROPICAL && tile.qualities.healthiness < 0.3) recommendations.push('🏥 Disease prevention essential');
  if (tile.qualities.safety < 0.3) recommendations.push('⚠️ High danger - avoid or fortify heavily');
  if (tile.qualities.healthiness < 0.2 && tile.isLand) recommendations.push('☣️ Health hazard - medical support required');
  return recommendations.slice(0, 6);
};

const DevTooltip: React.FC<DevTooltipProps> = ({ hoveredData, pinnedData, isPinnedOpen, onCondense }) => {
  const [isLocallyExpanded, setIsLocallyExpanded] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentDisplayData = isPinnedOpen && pinnedData ? pinnedData : hoveredData;
  const actuallyExpanded = isPinnedOpen || isLocallyExpanded;

  useEffect(() => {
    // Force expansion if pinned, collapse if unpinned
    setIsLocallyExpanded(isPinnedOpen);
  }, [isPinnedOpen]);

  // Add keyboard shortcuts for expanding/collapsing
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if tooltip is visible
      if (!currentDisplayData) return;
      
      // E key to expand/collapse (when tooltip is visible)
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setIsLocallyExpanded(prev => !prev);
      }
      
      // Escape to close pinned tooltip
      if (e.key === 'Escape' && isPinnedOpen) {
        onCondense();
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentDisplayData, isPinnedOpen, onCondense]);

  useEffect(() => {
    // Click outside to close if pinned
    const handleClickOutside = (event: MouseEvent) => {
      if (isPinnedOpen && tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        onCondense();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPinnedOpen, onCondense]);

  if (!currentDisplayData) {
    return null;
  }

  const { tile, viewMode, mapContext, vegetation, structure } = currentDisplayData;
  const isStandardTile = 'isLand' in tile;

  const biomeInfo = isStandardTile ? getBiomeDescription(tile.biome) : null;
  const nearbyAnalysis = isStandardTile && mapContext ? analyzeNearbyFeatures(tile, mapContext.tiles) : null;
  const strategicRecs = isStandardTile && nearbyAnalysis && mapContext ? generateStrategicRecommendations(tile, nearbyAnalysis, mapContext.climate) : null;

  const formatString = (str: string | undefined) => {
    if (!str) return 'Unknown';
    return str.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div ref={tooltipRef} className={`fixed bottom-4 right-4 z-40 w-80 max-w-sm p-4 bg-gray-800/80 backdrop-blur-md rounded-lg shadow-2xl border border-gray-600/50 text-white text-xs font-sans transition-all duration-300 ${actuallyExpanded ? 'max-h-[80vh] overflow-y-auto' : 'max-h-24 overflow-hidden'}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm text-blue-300">
          {isStandardTile ? `Tile (${tile.x}, ${tile.y})` : `Interior (${tile.x}, ${tile.y})`}
        </h3>
        <div className="flex gap-2 items-center">
          <span className="text-gray-500 text-xs mr-2">[E] expand</span>
          <button onClick={() => setIsLocallyExpanded(!actuallyExpanded)} className="text-gray-400 hover:text-white text-xs">
            {actuallyExpanded ? '▼ Condense' : '▲ Expand'}
          </button>
          {isPinnedOpen && <button onClick={onCondense} className="text-red-400 hover:text-red-300 text-xs font-bold">X</button>}
        </div>
      </div>

      {/* Condensed View */}
      <div className={`transition-opacity duration-200 ${actuallyExpanded ? 'opacity-0 h-0 invisible' : 'opacity-100'}`}>
        {isStandardTile && <p><strong>Biome:</strong> {formatString(tile.biome)}</p>}
        {!isStandardTile && <p><strong>Type:</strong> {formatString(tile.type)}</p>}
        {structure && <p><strong>Structure:</strong> {structure.name}</p>}
        {vegetation && <p><strong>Vegetation:</strong> {vegetation.speciesName}</p>}
        {currentDisplayData?.componentInfo && (
          <p className="text-cyan-400 text-xs mt-1">
            {currentDisplayData.componentInfo.fileName || currentDisplayData.componentInfo.symbolName}
          </p>
        )}
      </div>

      {/* Expanded View */}
      <div className={`space-y-3 transition-opacity duration-300 ${actuallyExpanded ? 'opacity-100' : 'opacity-0 h-0 invisible'}`}>
        {isStandardTile && biomeInfo && (
          <div>
            <p className="font-semibold text-blue-400">{formatString(tile.biome)}</p>
            <p className="text-gray-400 italic">{biomeInfo.description}</p>
          </div>
        )}
        {!isStandardTile && (
          <div>
            <p className="font-semibold text-blue-400">{formatString(tile.type)}</p>
            <p>Material: {formatString(tile.material)}</p>
          </div>
        )}
        <hr className="border-gray-600" />
        
        {structure && (
          <div>
            <p className="font-semibold text-green-400">Structure: {structure.name}</p>
            <p>Type: {formatString(structure.structureType)}</p>
          </div>
        )}
        {vegetation && (
          <div>
            <p className="font-semibold text-green-400">Vegetation: {vegetation.speciesName}</p>
            <p className="italic text-gray-400">{vegetation.linnaeanName}</p>
          </div>
        )}
        
        {currentDisplayData?.componentInfo && (
          <div className="border-t border-gray-600 pt-2">
            <p className="font-semibold text-cyan-400 text-xs">Component Info:</p>
            {currentDisplayData.componentInfo.fileName && (
              <p className="text-cyan-300 text-xs">File: {currentDisplayData.componentInfo.fileName}</p>
            )}
            {currentDisplayData.componentInfo.symbolName && (
              <p className="text-cyan-300 text-xs">Symbol: {currentDisplayData.componentInfo.symbolName}</p>
            )}
            {currentDisplayData.componentInfo.variant && (
              <p className="text-cyan-300 text-xs">Variant: {currentDisplayData.componentInfo.variant}</p>
            )}
          </div>
        )}
        
        {isStandardTile && (
          <>
            <div>
              <p>Altitude: {tile.altitude.toFixed(3)}</p>
              <p>Is Coast: {tile.isCoast ? 'Yes' : 'No'}</p>
            </div>
            <hr className="border-gray-600" />
            <div>
              <p className="font-semibold mb-1">Qualities:</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2"><span className={getQualityColor(tile.qualities.safety)}>Safety</span> {getQualityBar(tile.qualities.safety)}</div>
                <div className="flex items-center justify-between gap-2"><span className={getQualityColor(tile.qualities.healthiness)}>Health</span> {getQualityBar(tile.qualities.healthiness)}</div>
                <div className="flex items-center justify-between gap-2"><span className={getQualityColor(tile.qualities.biodiversity)}>Biodiversity</span> {getQualityBar(tile.qualities.biodiversity)}</div>
                <div className="flex items-center justify-between gap-2"><span className={getQualityColor(tile.qualities.flammability, true)}>Fire Risk</span> {getQualityBar(tile.qualities.flammability, true)}</div>
                <div className="flex items-center justify-between gap-2"><span className={getQualityColor(tile.qualities.sacrality)}>Sacrality</span> {getQualityBar(tile.qualities.sacrality)}</div>
              </div>
            </div>
            
            {nearbyAnalysis && (
              <>
                <hr className="border-gray-600" />
                <div>
                  <p className="font-semibold mb-1">Nearby Features:</p>
                  <p>Nearest Water: {nearbyAnalysis.nearestWater > -1 ? `${nearbyAnalysis.nearestWater.toFixed(1)} tiles` : 'N/A'}</p>
                  <p>Nearest Urban: {nearbyAnalysis.nearestUrban > -1 ? `${nearbyAnalysis.nearestUrban.toFixed(1)} tiles` : 'N/A'}</p>
                </div>
              </>
            )}
            
            {strategicRecs && strategicRecs.length > 0 && (
              <>
                <hr className="border-gray-600" />
                <div>
                  <p className="font-semibold mb-1">Strategic Notes:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    {strategicRecs.map((rec, i) => <li key={i}>{rec}</li>)}
                  </ul>
                </div>
              </>
            )}
          </>
        )}
      </div>
      
      {/* Help text */}
      <div className="mt-2 pt-2 border-t border-gray-700 text-center">
        <span className="text-gray-500 text-xs">[D] toggle tooltip • [E] expand/collapse</span>
      </div>
    </div>
  );
};

export default DevTooltip;