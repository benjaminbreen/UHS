/**
 * components/TerrainStructureBanner.tsx - Dynamic pixel-art SVG banner for terrain structures
 */
import React, { useEffect, useState } from 'react';
import { TerrainStructure, MapData, BiomeType, ClimateType, TimeOfDay, Season, Tile } from '../types';

interface TerrainStructureBannerProps {
  structure?: TerrainStructure;
  mapData?: MapData;
  width?: number;
  height?: number;
  timeOfDay: TimeOfDay;
  season: Season;
}

// Enhanced color palettes to match your aesthetic
const SKY_COLORS: Record<string, string[]> = {
  dawn: ['#FF9A8B', '#A8E6CF', '#FFD3BA'],
  day: ['#87CEEB', '#98D8E8', '#B8E6B8'],
  dusk: ['#FF8C42', '#FF6B6B', '#C44569'],
  night: ['#2C3E50', '#34495E', '#4A6741']
};

const CLIMATE_PALETTES: Record<string, { ground: string, vegetation: string, accent: string }> = {
  [ClimateType.COLD]: { ground: '#A8E6A3', vegetation: '#4A7C59', accent: '#6B9080' },
  [ClimateType.TEMPERATE]: { ground: '#86EFAC', vegetation: '#22C55E', accent: '#16A34A' },
  [ClimateType.ARID]: { ground: '#D2B48C', vegetation: '#8B7355', accent: '#CD853F' },
  [ClimateType.SEMITROPICAL]: { ground: '#6EE7B7', vegetation: '#32CD32', accent: '#228B22' },
  [ClimateType.TROPICAL]: { ground: '#6EE7B7', vegetation: '#059669', accent: '#047857' },
  [ClimateType.MEDITERRANEAN]: { ground: '#C4B5A0', vegetation: '#6B8E23', accent: '#8B7355' }
};

// Character animation data
interface Character {
  id: string;
  x: number;
  y: number;
  direction: 1 | -1;
  type: 'worker' | 'guard' | 'merchant' | 'miner';
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

const getTimeOfDayCategory = (time: TimeOfDay): 'dawn' | 'day' | 'dusk' | 'night' => {
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

const TerrainStructureBanner: React.FC<TerrainStructureBannerProps> = ({
  structure,
  mapData,
  width = 600,
  height = 250,
  timeOfDay,
  season,
}) => {
  const [animationFrame, setAnimationFrame] = useState(0);
  const [characters, setCharacters] = useState<Character[]>([]);

  // Extract actual game data or use defaults
  const currentStructure = structure || {
    id: 'demo-fortress',
    structureType: 'fortress' as const,
    location: [10, 10] as [number, number],
    state: 'active' as const,
    npcAnchor: 'soldiers'
  };

  const currentMapData = mapData || {
    seed: 12345,
    climate: 'TEMPERATE' as const,
    tiles: [[{ biome: BiomeType.GRASSLAND, x: 10, y: 10 } as Tile]]
  };

  const rng = new SeededRandom(currentMapData.seed + currentStructure.location[0] * 1000);

  // Get biome data
  const tileY = Math.min(currentStructure.location[1], currentMapData.tiles.length - 1);
  const tileX = Math.min(currentStructure.location[0], currentMapData.tiles[0]?.length - 1 || 0);
  const tile = currentMapData.tiles[tileY]?.[tileX] || { biome: BiomeType.GRASSLAND, x: tileX, y: tileY };

  const palette = CLIMATE_PALETTES[currentMapData.climate];
  const todCategory = getTimeOfDayCategory(timeOfDay);
  const skyGradient = SKY_COLORS[todCategory];

  // Initialize characters based on structure type and NPC anchor
  useEffect(() => {
    const generateCharacters = () => {
      const newCharacters: Character[] = [];
      const characterCount = currentStructure.state === 'active' ? 3 + Math.floor(rng.next() * 3) : 1;

      const characterTypes = {
        'fortress': ['guard', 'guard', 'worker'],
        'mill': ['worker', 'merchant', 'worker'],
        'mining_colony': ['miner', 'miner', 'worker'],
        'settlement': ['worker', 'merchant', 'guard'],
        'outpost': ['guard', 'worker']
      };

      const colors = ['#8B4513', '#2F4F4F', '#8B0000', '#4B0082', '#006400'];
      const types = characterTypes[currentStructure.structureType as keyof typeof characterTypes] || ['worker'];

      for (let i = 0; i < characterCount; i++) {
        newCharacters.push({
          id: `char-${i}`,
          x: rng.range(100, width - 100),
          y: 120 + rng.range(-5, 5),
          direction: rng.next() > 0.5 ? 1 : -1,
          type: types[i % types.length] as any,
          color: colors[i % colors.length],
          speed: 0.3 + rng.range(0, 0.4)
        });
      }

      return newCharacters;
    };

    setCharacters(generateCharacters());
  }, [currentStructure.id, currentMapData.seed]);

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

  // Render animated sky with parallax clouds
  const renderSky = () => {
    const cloudOffset = (animationFrame * 0.1) % (width + 100);
    
    return (
      <g>
        {/* Sky gradient */}
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={skyGradient[0]} />
            <stop offset="50%" stopColor={skyGradient[1]} />
            <stop offset="100%" stopColor={skyGradient[2] || skyGradient[1]} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={width} height="90" fill="url(#skyGradient)" />
        
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
                x={20 + i * 45 + rng.range(-10, 10)}
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

  // Render layered mountain background
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
            const baseY = 90 - layer.height;
            const peakY = baseY - rng.range(5, 15);
            const nextBaseY = 90 - layer.height;
            
            if (i === 0) points.push(`${i - 20},90`);
            points.push(`${i},${baseY}`);
            points.push(`${i + 20},${peakY}`);
            points.push(`${i + 40},${nextBaseY}`);
            if (i >= width) points.push(`${width + 20},90`);
          }
          
          return (
            <polygon
              key={layerIndex}
              points={points.join(' ') + ` ${width + 20},90 -20,90`}
              fill={layer.color}
              opacity={layer.opacity}
            />
          );
        })}
      </g>
    );
  };

  // Render main structure in your pixel art style
  const renderStructure = () => {
    const centerX = width / 2;
    const groundY = 110;
    const isRuined = currentStructure.state === 'ruined';

    switch (currentStructure.structureType) {
      case 'fortress':
        return (
          <g opacity={isRuined ? 0.7 : 1}>
            {/* Main keep - pixel perfect rectangles */}
            <rect x={centerX - 32} y={groundY - 40} width="64" height="40" fill="#8B7355" stroke="#654321" strokeWidth="1" />
            
            {/* Crenellations */}
            {Array.from({ length: 8 }, (_, i) => (
              <rect
                key={i}
                x={centerX - 32 + i * 8}
                y={groundY - 44}
                width="6"
                height="6"
                fill="#8B7355"
              />
            ))}
            
            {/* Gate */}
            <rect x={centerX - 6} y={groundY - 16} width="12" height="16" fill="#2C1810" />
            <rect x={centerX - 4} y={groundY - 14} width="2" height="12" fill="#8B4513" />
            <rect x={centerX + 2} y={groundY - 14} width="2" height="12" fill="#8B4513" />
            
            {/* Side towers */}
            <rect x={centerX - 48} y={groundY - 32} width="16" height="32" fill="#8B7355" stroke="#654321" strokeWidth="1" />
            <rect x={centerX + 32} y={groundY - 32} width="16" height="32" fill="#8B7355" stroke="#654321" strokeWidth="1" />
            
            {/* Tower tops */}
            <rect x={centerX - 48} y={groundY - 36} width="4" height="4" fill="#8B7355" />
            <rect x={centerX - 40} y={groundY - 36} width="4" height="4" fill="#8B7355" />
            <rect x={centerX + 32} y={groundY - 36} width="4" height="4" fill="#8B7355" />
            <rect x={centerX + 40} y={groundY - 36} width="4" height="4" fill="#8B7355" />
            
            {/* Flag */}
            {!isRuined && (
              <>
                <rect x={centerX - 1} y={groundY - 56} width="2" height="16" fill="#4A4A4A" />
                <rect x={centerX + 1} y={groundY - 56} width="12" height="8" fill="#DC143C" />
              </>
            )}
            
            {/* Windows */}
            <rect x={centerX - 20} y={groundY - 30} width="4" height="6" fill="#1C1C1C" />
            <rect x={centerX + 16} y={groundY - 30} width="4" height="6" fill="#1C1C1C" />
          </g>
        );

      case 'mill':
        return (
          <g>
            {/* Mill building */}
            <rect x={centerX - 20} y={groundY - 28} width="40" height="28" fill="#8B4513" stroke="#654321" strokeWidth="1" />
            {/* Roof */}
            <polygon
              points={`${centerX - 24},${groundY - 28} ${centerX},${groundY - 40} ${centerX + 24},${groundY - 28}`}
              fill="#8B0000"
              stroke="#654321"
              strokeWidth="1"
            />
            
            {/* Water wheel */}
            <circle cx={centerX + 30} cy={groundY - 14} r="14" fill="#654321" stroke="#2C1810" strokeWidth="2" />
            {Array.from({ length: 8 }, (_, i) => (
              <rect
                key={i}
                x={centerX + 28}
                y={groundY - 16}
                width="4"
                height="8"
                fill="#4A4A4A"
                transform={`rotate(${i * 45 + animationFrame * 2} ${centerX + 30} ${groundY - 14})`}
              />
            ))}
            
            {/* Water stream */}
            <rect x={centerX + 45} y={groundY - 8} width="20" height="3" fill="#4A90E2" opacity="0.8" />
            
            {/* Door and windows */}
            <rect x={centerX - 4} y={groundY - 12} width="8" height="12" fill="#2C1810" />
            <rect x={centerX - 12} y={groundY - 20} width="4" height="6" fill="#1C1C1C" />
            <rect x={centerX + 8} y={groundY - 20} width="4" height="6" fill="#1C1C1C" />
          </g>
        );

      case 'mining_colony':
        return (
          <g>
            {/* Mine shaft in hill */}
            <polygon
              points={`${centerX - 40},${groundY} ${centerX - 16},${groundY - 24} ${centerX + 40},${groundY}`}
              fill="#A0A0A0"
              stroke="#666666"
              strokeWidth="1"
            />
            {/* Mine entrance */}
            <rect x={centerX - 12} y={groundY - 16} width="16" height="16" rx="8" fill="#1C1C1C" />
            
            {/* Mine cart tracks */}
            <rect x={centerX - 30} y={groundY - 2} width="60" height="2" fill="#4A4A4A" />
            {Array.from({ length: 6 }, (_, i) => (
              <rect key={i} x={centerX - 30 + i * 10} y={groundY - 4} width="2" height="2" fill="#4A4A4A" />
            ))}
            
            {/* Mine cart */}
            <rect x={centerX + 12} y={groundY - 8} width="12" height="6" fill="#2C1810" stroke="#1C1C1C" strokeWidth="1" />
            <circle cx={centerX + 15} cy={groundY - 2} r="2" fill="#1C1C1C" />
            <circle cx={centerX + 21} cy={groundY - 2} r="2" fill="#1C1C1C" />
            
            {/* Ore pile */}
            <rect x={centerX + 28} y={groundY - 4} width="4" height="4" fill="#FFD700" />
            <rect x={centerX + 30} y={groundY - 8} width="4" height="4" fill="#FFD700" />
            <rect x={centerX + 32} y={groundY - 4} width="4" height="4" fill="#FFD700" />
            
            {/* Support beams */}
            <rect x={centerX - 8} y={groundY - 16} width="2" height="12" fill="#8B4513" />
            <rect x={centerX + 6} y={groundY - 16} width="2" height="12" fill="#8B4513" />
            <rect x={centerX - 8} y={groundY - 16} width="16" height="2" fill="#8B4513" />
          </g>
        );

      default:
        return (
          <g>
            <rect x={centerX - 16} y={groundY - 20} width="32" height="20" fill="#8B7355" stroke="#654321" strokeWidth="1" />
            <polygon points={`${centerX - 20},${groundY - 20} ${centerX},${groundY - 28} ${centerX + 20},${groundY - 20}`} fill="#8B0000" />
          </g>
        );
    }
  };

  // Render animated pixel people
  const renderCharacters = () => {
    return (
      <g>
        {characters.map((char, index) => {
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
              {char.type === 'miner' && (
                <rect x="-2" y="-12" width="4" height="2" fill="#FFD700" />
              )}
              {char.type === 'merchant' && (
                <rect x="-4" y="-6" width="8" height="2" fill="#8B4513" />
              )}
            </g>
          );
        })}
      </g>
    );
  };

  // Ground and grass
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
        {/* Dirt path */}
        <rect x="0" y="118" width={width} height="4" fill="#8B4513" opacity="0.3" />
      </g>
    );
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
      {renderGround()}
      {renderStructure()}
      {renderCharacters()}
    </svg>
  );
};

export default React.memo(TerrainStructureBanner);
