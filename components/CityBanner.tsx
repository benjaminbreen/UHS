/**
 * components/CityBanner.tsx - Pixel-art city banner matching TerrainStructureBanner aesthetic
 */
import React, { useEffect, useState, useMemo } from 'react';
import { HistoricalEra, CulturalZone, ClimateType as Climate, Season, MapData, TimeOfDay } from '../types';

export type Condition = 'humble' | 'prosperous';
export type ElevationLevel = 'low' | 'normal' | 'high';
export type CitySize = 'smaller_city' | 'big_city';

interface CityBannerProps {
  era: HistoricalEra;
  culturalZone: CulturalZone;
  condition: Condition;
  climate: Climate;
  season: Season;
  nextToWater?: boolean;
  harbor?: boolean;
  elevationLevel?: ElevationLevel;
  size?: CitySize;
  timeOfDay?: TimeOfDay;
  seed: number;
  width?: number;
  height?: number;
  mapData?: MapData;
}

// Enhanced color palettes matching TerrainStructureBanner
const SKY_COLORS: Record<string, string[]> = {
  dawn: ['#FF9A8B', '#A8E6CF', '#FFD3BA'],
  day: ['#87CEEB', '#98D8E8', '#B8E6B8'],
  dusk: ['#FF8C42', '#FF6B6B', '#C44569'],
  night: ['#2C3E50', '#34495E', '#4A6741']
};

const CLIMATE_PALETTES: Record<string, { ground: string, vegetation: string, accent: string }> = {
  [Climate.COLD]: { ground: '#A8E6A3', vegetation: '#4A7C59', accent: '#6B9080' },
  [Climate.TEMPERATE]: { ground: '#86EFAC', vegetation: '#22C55E', accent: '#16A34A' },
  [Climate.ARID]: { ground: '#D2B48C', vegetation: '#8B7355', accent: '#CD853F' },
  [Climate.SEMITROPICAL]: { ground: '#6EE7B7', vegetation: '#32CD32', accent: '#228B22' },
  [Climate.TROPICAL]: { ground: '#6EE7B7', vegetation: '#059669', accent: '#047857' }
};

// Cultural building colors
const CULTURAL_COLORS: Record<CulturalZone, { primary: string, secondary: string, accent: string }> = {
  'EUROPEAN': { primary: '#8B4513', secondary: '#654321', accent: '#DC143C' },
  'EAST_ASIAN': { primary: '#8B0000', secondary: '#DC143C', accent: '#FFD700' },
  'SOUTH_ASIAN': { primary: '#FF6347', secondary: '#FF8C00', accent: '#FFD700' },
  'MENA': { primary: '#DEB887', secondary: '#F4A460', accent: '#4169E1' },
  'SUB_SAHARAN_AFRICAN': { primary: '#8B4513', secondary: '#D2691E', accent: '#FF8C00' },
  'NORTH_AMERICAN_PRE_COLUMBIAN': { primary: '#8B4513', secondary: '#A0522D', accent: '#FF6347' },
  'NORTH_AMERICAN_COLONIAL': { primary: '#8B4513', secondary: '#A0522D', accent: '#4169E1' },
  'SOUTH_AMERICAN': { primary: '#CD853F', secondary: '#DEB887', accent: '#32CD32' },
  'OCEANIA': { primary: '#8B4513', secondary: '#D2691E', accent: '#20B2AA' }
};

// Character animation data
interface Character {
  id: string;
  x: number;
  y: number;
  direction: 1 | -1;
  type: 'noble' | 'merchant' | 'worker' | 'guard' | 'child' | 'clergy';
  color: string;
  speed: number;
}

// Seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

const getTimeOfDayCategory = (time?: TimeOfDay): 'dawn' | 'day' | 'dusk' | 'night' => {
  if (!time) return 'day';
  switch (time) {
    case 'Dawn': return 'dawn';
    case 'Dusk': return 'dusk';
    case 'Night': return 'night';
    case 'Morning':
    case 'Midday':
    case 'Afternoon':
    default: return 'day';
  }
};

const CityBanner: React.FC<CityBannerProps> = ({
  era, culturalZone, condition, climate, season, nextToWater, harbor,
  elevationLevel = 'normal', size = 'smaller_city', timeOfDay = 'day' as TimeOfDay,
  seed, width = 900, height = 220, mapData
}) => {
  const [animationFrame, setAnimationFrame] = useState(0);
  const [characters, setCharacters] = useState<Character[]>([]);
  
  const rng = new SeededRandom(seed);
  const cityInfo = mapData?.majorCity;
  
  const palette = CLIMATE_PALETTES[climate];
  const todCategory = getTimeOfDayCategory(timeOfDay);
  const skyGradient = SKY_COLORS[todCategory];
  const culturalColors = CULTURAL_COLORS[culturalZone];

  // Initialize characters based on city type
  useEffect(() => {
    const generateCharacters = () => {
      const newCharacters: Character[] = [];
      const characterCount = size === 'big_city' ? 8 + Math.floor(rng.next() * 4) : 4 + Math.floor(rng.next() * 3);

      const characterTypes = condition === 'prosperous' 
        ? ['noble', 'merchant', 'merchant', 'guard', 'clergy', 'worker']
        : ['worker', 'worker', 'worker', 'merchant', 'guard'];

      const colors = {
        'noble': '#4B0082',
        'merchant': '#8B4513',
        'worker': '#654321',
        'guard': '#2F4F4F',
        'child': '#8B7355',
        'clergy': '#000000'
      };

      for (let i = 0; i < characterCount; i++) {
        const type = characterTypes[i % characterTypes.length] as Character['type'];
        newCharacters.push({
          id: `char-${i}`,
          x: rng.range(100, width - 100),
          y: height * 0.7 + rng.range(-5, 5),
          direction: rng.next() > 0.5 ? 1 : -1,
          type,
          color: colors[type],
          speed: 0.3 + rng.range(0, 0.4)
        });
      }

      return newCharacters;
    };

    setCharacters(generateCharacters());
  }, [seed, size, condition]);

  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame(prev => prev + 1);
      
      setCharacters(prev => prev.map(char => {
        let newX = char.x + (char.direction * char.speed);
        let newDirection: 1 | -1 = char.direction;

        // Bounce off edges
        if (newX <= 50 || newX >= width - 50) {
          newDirection = char.direction === 1 ? -1 : 1;
          newX = char.x + (newDirection * char.speed);
        }

        return { ...char, x: newX, direction: newDirection };
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [width]);

  // Render animated sky with parallax clouds (matching TerrainStructureBanner)
  const renderSky = () => {
    const cloudOffset = (animationFrame * 0.1) % (width + 100);
    
    return (
      <g>
        {/* Sky gradient */}
        <defs>
          <linearGradient id={`skyGradient-${seed}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={skyGradient[0]} />
            <stop offset="50%" stopColor={skyGradient[1]} />
            <stop offset="100%" stopColor={skyGradient[2] || skyGradient[1]} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={width} height={height * 0.65} fill={`url(#skyGradient-${seed})`} />
        
        {/* Sun/Moon */}
        {todCategory === 'night' ? (
          <g>
            <circle cx={width - 80} cy="25" r="12" fill="#F7FAFC" />
            <circle cx={width - 77} cy="22" r="2" fill={skyGradient[0]} />
            <circle cx={width - 82} cy="28" r="1.5" fill={skyGradient[0]} />
            {/* Stars */}
            {Array.from({ length: 12 }, (_, i) => (
              <rect
                key={i}
                x={20 + i * 70 + rng.range(-10, 10)}
                y={10 + rng.range(0, 20)}
                width="2"
                height="2"
                fill="#F7FAFC"
                opacity="0.8"
              />
            ))}
          </g>
        ) : (
          <circle cx={width - 80} cy="25" r="15" fill="#FDE047" />
        )}
        
        {/* Animated clouds */}
        {Array.from({ length: 4 }, (_, i) => {
          const cloudX = -100 + cloudOffset + i * 180;
          const cloudY = 20 + rng.range(-5, 10);
          return (
            <g key={i} opacity="0.8">
              <rect x={cloudX} y={cloudY} width="16" height="8" rx="4" fill="#F1F5F9" />
              <rect x={cloudX + 8} y={cloudY - 2} width="20" height="8" rx="4" fill="#F1F5F9" />
              <rect x={cloudX + 4} y={cloudY + 4} width="12" height="6" rx="3" fill="#F1F5F9" />
            </g>
          );
        })}
      </g>
    );
  };

  // Render layered mountain background (matching TerrainStructureBanner)
  const renderMountains = () => {
    const mountainLayers = [
      { color: '#8B9DC3', opacity: 0.3, height: 40, offset: 0 },
      { color: '#6B8CAF', opacity: 0.5, height: 35, offset: 20 },
      { color: '#4A6B8A', opacity: 0.7, height: 30, offset: 40 }
    ];

    return (
      <g>
        {mountainLayers.map((layer, layerIndex) => {
          const points = [];
          for (let i = 0; i <= width + 40; i += 40) {
            const baseY = height * 0.65 - layer.height;
            const peakY = baseY - rng.range(5, 15);
            const nextBaseY = height * 0.65 - layer.height;
            
            if (i === 0) points.push(`${i - 20},${height * 0.65}`);
            points.push(`${i},${baseY}`);
            points.push(`${i + 20},${peakY}`);
            points.push(`${i + 40},${nextBaseY}`);
            if (i >= width) points.push(`${width + 20},${height * 0.65}`);
          }
          
          return (
            <polygon
              key={layerIndex}
              points={points.join(' ') + ` ${width + 20},${height * 0.65} -20,${height * 0.65}`}
              fill={layer.color}
              opacity={layer.opacity}
            />
          );
        })}
      </g>
    );
  };

  // Render pixel-art buildings
  const renderBuildings = () => {
    const buildings: JSX.Element[] = [];
    const buildingCount = size === 'big_city' ? 10 : 6;
    
    // Background buildings (smaller, less detailed)
    for (let i = 0; i < buildingCount; i++) {
      const buildingX = (width / (buildingCount + 1)) * (i + 1) + rng.range(-20, 20);
      const buildingHeight = 30 + rng.range(0, 25);
      const buildingWidth = 25 + rng.range(0, 15);
      const buildingY = height * 0.65;
      
      buildings.push(
        <g key={`bg-building-${i}`} opacity="0.6">
          {/* Base building */}
          <rect 
            x={buildingX - buildingWidth/2} 
            y={buildingY - buildingHeight} 
            width={buildingWidth} 
            height={buildingHeight} 
            fill={culturalColors.primary}
            stroke="#654321"
            strokeWidth="1"
          />
          
          {/* Simple roof based on culture */}
          {culturalZone === 'EAST_ASIAN' ? (
            <polygon
              points={`${buildingX - buildingWidth/2 - 3},${buildingY - buildingHeight} ${buildingX},${buildingY - buildingHeight - 10} ${buildingX + buildingWidth/2 + 3},${buildingY - buildingHeight}`}
              fill={culturalColors.secondary}
            />
          ) : (
            <polygon
              points={`${buildingX - buildingWidth/2},${buildingY - buildingHeight} ${buildingX},${buildingY - buildingHeight - 8} ${buildingX + buildingWidth/2},${buildingY - buildingHeight}`}
              fill="#8B0000"
            />
          )}
        </g>
      );
    }
    
    // Foreground buildings (larger, more detailed)
    for (let i = 0; i < buildingCount / 2; i++) {
      const buildingX = (width / (buildingCount / 2 + 1)) * (i + 1);
      const buildingHeight = 40 + rng.range(0, 30);
      const buildingWidth = 35 + rng.range(0, 20);
      const buildingY = height * 0.65;
      
      buildings.push(
        <g key={`fg-building-${i}`}>
          {/* Base building */}
          <rect 
            x={buildingX - buildingWidth/2} 
            y={buildingY - buildingHeight} 
            width={buildingWidth} 
            height={buildingHeight} 
            fill={culturalColors.primary}
            stroke="#654321"
            strokeWidth="1"
          />
          
          {/* Windows */}
          {Array.from({ length: 2 }, (_, w) => (
            <rect
              key={w}
              x={buildingX - buildingWidth/2 + 6 + w * 12}
              y={buildingY - buildingHeight + 10}
              width="6"
              height="8"
              fill={todCategory === 'night' ? '#FFD700' : '#1C1C1C'}
            />
          ))}
          
          {/* Door */}
          <rect 
            x={buildingX - 4} 
            y={buildingY - 12} 
            width="8" 
            height="12" 
            fill="#2C1810" 
          />
          
          {/* Roof */}
          {renderRoofByEra(buildingX, buildingY - buildingHeight, buildingWidth, buildingHeight)}
          
          {/* Era-specific details */}
          {era === HistoricalEra.INDUSTRIAL_ERA && (
            <rect 
              x={buildingX + buildingWidth/4} 
              y={buildingY - buildingHeight - 15} 
              width="4" 
              height="15" 
              fill="#4A4A4A" 
            />
          )}
        </g>
      );
    }
    
    return buildings;
  };

  // Render roof based on era and culture
  const renderRoofByEra = (x: number, y: number, width: number, height: number) => {
    if (culturalZone === 'EAST_ASIAN' && (era === HistoricalEra.ANTIQUITY)) {
      // Pagoda style
      return (
        <g>
          <polygon
            points={`${x - width/2 - 5},${y} ${x},${y - 12} ${x + width/2 + 5},${y}`}
            fill={culturalColors.secondary}
          />
          <rect x={x - width/2 - 5} y={y - 2} width={width + 10} height="2" fill={culturalColors.accent} />
        </g>
      );
    } else if (culturalZone === 'MENA') {
      // Dome
      return (
        <ellipse cx={x} cy={y} rx={width/3} ry={height/6} fill={culturalColors.accent} />
      );
    } else if (era === HistoricalEra.MEDIEVAL || era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
      // Steep European roof
      return (
        <polygon
          points={`${x - width/2 - 2},${y} ${x},${y - height/3} ${x + width/2 + 2},${y}`}
          fill="#8B0000"
        />
      );
    } else {
      // Default triangular roof
      return (
        <polygon
          points={`${x - width/2},${y} ${x},${y - 10} ${x + width/2},${y}`}
          fill="#8B0000"
        />
      );
    }
  };

  // Render animated pixel people (matching TerrainStructureBanner style)
  const renderCharacters = () => {
    return (
      <g>
        {characters.map((char) => {
          const walkCycle = Math.floor(animationFrame / 8) % 2;
          const legOffset = walkCycle * char.direction;
          
          return (
            <g key={char.id} transform={`translate(${char.x}, ${char.y})`}>
              {/* Body */}
              <rect x="-2" y="-8" width="4" height="6" fill={char.color} />
              {/* Head */}
              <rect x="-1.5" y="-10" width="3" height="2" fill="#FFDBAC" />
              {/* Legs */}
              <rect x={-1.5 + legOffset} y="-2" width="1" height="4" fill="#654321" />
              <rect x={0.5 - legOffset} y="-2" width="1" height="4" fill="#654321" />
              {/* Arms */}
              <rect x="-3" y="-6" width="1" height="3" fill="#FFDBAC" />
              <rect x="2" y="-6" width="1" height="3" fill="#FFDBAC" />
              
              {/* Character type specific accessories */}
              {char.type === 'guard' && (
                <>
                  <rect x="-1" y="-11" width="2" height="1" fill="#C0C0C0" />
                  <rect x="2" y="-7" width="1" height="4" fill="#8B4513" />
                </>
              )}
              {char.type === 'noble' && (
                <rect x="-1" y="-11" width="2" height="1" fill="#FFD700" />
              )}
              {char.type === 'merchant' && (
                <rect x="-4" y="-6" width="8" height="2" fill="#8B4513" />
              )}
              {char.type === 'clergy' && (
                <rect x="-2" y="-8" width="4" height="6" fill="#000000" />
              )}
            </g>
          );
        })}
      </g>
    );
  };

  // Ground and grass (matching TerrainStructureBanner)
  const renderGround = () => {
    return (
      <g>
        {/* Ground */}
        <rect x="0" y="110" width={width} height="40" fill={palette.ground} />
        
        {/* Grass detail */}
        {Array.from({ length: width / 8 }, (_, i) => (
          <rect
            key={i}
            x={i * 8 + rng.range(-2, 2)}
            y={108 + rng.range(-2, 2)}
            width="2"
            height="4"
            fill={palette.vegetation}
            opacity="0.6"
          />
        ))}
        
        {/* Cobblestone path for cities */}
        <rect x="0" y="118" width={width} height="6" fill="#696969" opacity="0.7" />
        {Array.from({ length: width / 10 }, (_, i) => (
          <rect
            key={`cobble-${i}`}
            x={i * 10 + 1}
            y={118 + 1}
            width="8"
            height="4"
            fill="#808080"
            opacity="0.8"
          />
        ))}
        
        {/* Water if harbor */}
        {nextToWater && (
          <rect x="0" y={height * 0.85} width={width} height={height * 0.15} fill="#4A90E2" opacity="0.8" />
        )}
      </g>
    );
  };

  // Special features for historical cities
  const renderHistoricalFeatures = () => {
    if (!cityInfo?.isHistorical) return null;
    
    const features: JSX.Element[] = [];
    
    // Venice canals
    if (cityInfo.name?.includes('Venice')) {
      features.push(
        <g key="venice-canals" opacity="0.7">
          <rect x={width * 0.3} y={height * 0.78} width="60" height="8" fill="#4682B4" />
          <rect x={width * 0.6} y={height * 0.78} width="60" height="8" fill="#4682B4" />
          {/* Gondola */}
          <rect x={width * 0.32} y={height * 0.77} width="20" height="4" fill="#2C1810" />
          <rect x={width * 0.36} y={height * 0.75} width="2" height="8" fill="#4A4A4A" />
        </g>
      );
    }
    
    return features;
  };

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{ imageRendering: 'pixelated' }}
      className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-t-lg"
    >
      {renderSky()}
      {renderMountains()}
      {renderBuildings()}
      {renderGround()}
      {renderHistoricalFeatures()}
      {renderCharacters()}
      
      {/* Night overlay */}
      {todCategory === 'night' && (
        <rect x="0" y="0" width={width} height={height} fill="#000033" opacity="0.2" />
      )}
    </svg>
  );
};

export default React.memo(CityBanner);