/**
 * components/FortressBanner.tsx - Animated pixel-art banner for fortress structures
 * 8 historical variants with deep customization and charm
 */
import React, { useEffect, useState } from 'react';
import { TerrainStructure, ClimateType, Season, TimeOfDay, BiomeType } from '../types';

interface FortressBannerProps {
  structure: TerrainStructure;
  era?: string;
  culturalZone?: string;
  climate?: ClimateType;
  season: Season;
  timeOfDay: TimeOfDay;
  width?: number;
  height?: number;
  seed?: number;
  adjacentBiomes?: BiomeType[];
  fortressType?: string;
}

// Fixed ground level - matching TerrainStructureBanner exactly
const GROUND_Y = 110;

// Seeded random
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

// Sky colors from TerrainStructureBanner
const SKY_COLORS: Record<string, string[]> = {
  dawn: ['#FF9A8B', '#A8E6CF', '#FFD3BA'],
  day: ['#87CEEB', '#98D8E8', '#B8E6B8'],
  dusk: ['#FF8C42', '#FF6B6B', '#C44569'],
  night: ['#2C3E50', '#34495E', '#4A6741']
};

// Get ground color based on climate and season
const getGroundColor = (climate: ClimateType, season: Season): { ground: string, vegetation: string, accent: string } => {
  // Winter snow for cold and temperate climates
  if (season === 'winter') {
    if (climate === ClimateType.COLD) {
      return { ground: '#F0F8FF', vegetation: '#E0E8EF', accent: '#C0D0E0' }; // Always snow
    }
    if (climate === ClimateType.TEMPERATE) {
      return { ground: '#E8F0F8', vegetation: '#D0E0F0', accent: '#B0C0D0' }; // Winter snow
    }
    if (climate === ClimateType.MEDITERRANEAN) {
      return { ground: '#86EFAC', vegetation: '#22C55E', accent: '#16A34A' }; // Green in winter
    }
  }
  
  // Cold climate - always snow
  if (climate === ClimateType.COLD) {
    return { ground: '#F0F8FF', vegetation: '#E0E8EF', accent: '#C0D0E0' };
  }
  
  // Arid climate - always desert colors
  if (climate === ClimateType.ARID) {
    return { ground: '#D2B48C', vegetation: '#CD853F', accent: '#A0826D' };
  }
  
  // Mediterranean - seasonal changes
  if (climate === ClimateType.MEDITERRANEAN) {
    if (season === 'summer') {
      return { ground: '#C4B5A0', vegetation: '#A08060', accent: '#8B7355' }; // Arid summer
    }
    if (season === 'spring' || season === 'fall') {
      return { ground: '#B4C5A0', vegetation: '#8B9070', accent: '#7A8060' }; // Yellow-green
    }
  }
  
  // Tropical - lush green with mud
  if (climate === ClimateType.TROPICAL) {
    return { ground: '#4A7C59', vegetation: '#059669', accent: '#047857' };
  }
  
  // Semitropical - lush green
  if (climate === ClimateType.SEMITROPICAL) {
    return { ground: '#6EE7B7', vegetation: '#32CD32', accent: '#228B22' };
  }
  
  // Default temperate
  return { ground: '#86EFAC', vegetation: '#22C55E', accent: '#16A34A' };
};

// Guard/soldier types for different fortress variants
interface Guard {
  x: number;
  direction: 1 | -1;
  speed: number;
  type: string; // 'knight', 'samurai', 'musketeer', etc.
  patrolling: boolean;
}

const getTimeOfDayCategory = (time: TimeOfDay): 'dawn' | 'day' | 'dusk' | 'night' => {
  switch (time) {
    case 'Dawn': return 'dawn';
    case 'Dusk': return 'dusk';
    case 'Night': return 'night';
    default: return 'day';
  }
};

// Determine fortress variant based on type, era, and culture
const getFortressVariant = (
  fortressType?: string,
  era?: string,
  culturalZone?: string
): string => {
  // If explicit type is provided, use it
  if (fortressType) {
    return fortressType;
  }
  
  const year = parseInt(era || '1500');
  const zone = culturalZone?.toLowerCase() || 'european';
  
  // Era and culture-based selection
  if (zone.includes('japan') || zone.includes('asia')) {
    if (year >= 1400 && year <= 1600) return 'japanese-castle';
  }
  
  if (zone.includes('mena') || zone.includes('arab') || zone.includes('islamic')) {
    return 'desert-fort';
  }
  
  if (zone.includes('america')) {
    if (year >= 1750 && year <= 1890) return 'frontier-fort';
    if (year >= 1500 && year <= 1750) return 'presidio';
  }
  
  if (year >= 1950) return 'modern-base';
  if (year >= 1500 && year <= 1700) return 'star-fort';
  if (year >= 1000 && year <= 1200) return 'motte-bailey';
  if (year < 500) return 'hill-fort';
  if (year >= 500 && year <= 1000) return 'byzantine';
  
  // Default to medieval castle
  return 'medieval-castle';
};

const FortressBanner: React.FC<FortressBannerProps> = ({
  structure,
  era = '1500',
  culturalZone = 'european',
  climate = ClimateType.TEMPERATE,
  season,
  timeOfDay,
  width = 600,
  height = 250,
  seed = 12345,
  adjacentBiomes = [],
  fortressType
}) => {
  const [animationFrame, setAnimationFrame] = useState(0);
  const [guards, setGuards] = useState<Guard[]>([]);
  const [flagWave, setFlagWave] = useState(0);
  
  // Get fortress variant
  const variant = getFortressVariant(fortressType, era, culturalZone);
  
  // Parse era
  const year = parseInt(era);
  
  // Check biomes
  const nearOcean = adjacentBiomes.includes(BiomeType.SHALLOW_OCEAN) || adjacentBiomes.includes(BiomeType.DEEP_OCEAN);
  const nearForest = adjacentBiomes.includes(BiomeType.FOREST) || adjacentBiomes.includes(BiomeType.RAINFOREST);
  const nearMountains = adjacentBiomes.includes(BiomeType.MOUNTAIN);
  const nearDesert = adjacentBiomes.includes(BiomeType.DESERT);
  
  // Initialize random generators
  const rng = new SeededRandom(seed + (structure?.location[0] || 0) * 1000);
  const staticRng = new SeededRandom(seed + 9999);
  
  // Get time and palette
  const todCategory = getTimeOfDayCategory(timeOfDay);
  const skyGradient = SKY_COLORS[todCategory];
  const palette = getGroundColor(climate, season);
  
  // Initialize guards based on variant
  useEffect(() => {
    const guardTypes: Record<string, string[]> = {
      'medieval-castle': ['knight', 'archer', 'man-at-arms'],
      'japanese-castle': ['samurai', 'ashigaru', 'archer'],
      'desert-fort': ['guard', 'archer', 'merchant'],
      'star-fort': ['musketeer', 'cannoneer', 'officer'],
      'motte-bailey': ['norman', 'archer', 'serf'],
      'frontier-fort': ['militia', 'scout', 'trader'],
      'modern-base': ['soldier', 'patrol', 'sentry'],
      'hill-fort': ['warrior', 'druid', 'hunter'],
      'byzantine': ['cataphract', 'archer', 'spearman'],
      'presidio': ['conquistador', 'musketeer', 'native']
    };
    
    const types = guardTypes[variant] || ['guard', 'guard', 'guard'];
    const guardCount = 2 + Math.floor(staticRng.range(0, 2));
    const newGuards: Guard[] = [];
    
    for (let i = 0; i < guardCount; i++) {
      newGuards.push({
        x: staticRng.range(100, width - 100),
        direction: staticRng.next() > 0.5 ? 1 : -1,
        speed: 0.2 + staticRng.range(0, 0.2),
        type: types[i % types.length],
        patrolling: i < 2 // First two guards patrol
      });
    }
    setGuards(newGuards);
  }, [seed, variant]);
  
  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame(prev => prev + 1);
      setFlagWave(prev => prev + 0.1);
      
      // Update guard positions
      setGuards(prev => prev.map(guard => {
        if (!guard.patrolling) return guard;
        
        let newX = guard.x + (guard.direction * guard.speed);
        let newDirection = guard.direction;
        
        // Patrol boundaries depend on variant
        const leftBound = variant === 'star-fort' ? 150 : 100;
        const rightBound = variant === 'star-fort' ? width - 150 : width - 100;
        
        if (newX <= leftBound || newX >= rightBound) {
          newDirection = guard.direction === 1 ? -1 : 1;
          newX = guard.x + (newDirection * guard.speed);
        }
        
        return { ...guard, x: newX, direction: newDirection };
      }));
    }, 50);
    
    return () => clearInterval(interval);
  }, [width, variant]);
  
  // Render sky
  const renderSky = () => {
    const cloudOffset = (animationFrame * 0.1) % (width + 100);
    
    return (
      <g>
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
          </g>
        ) : (
          <circle cx={width - 80} cy="25" r="15" fill="#FDE047" />
        )}
        
        {/* Clouds */}
        {[0, 1, 2, 3].map((i) => {
          const cloudX = -100 + cloudOffset + i * 180;
          const cloudY = 20 + staticRng.range(-5, 10);
          return (
            <g key={i} opacity="0.8">
              <rect x={cloudX} y={cloudY} width="16" height="8" rx="4" fill="#F1F5F9" />
              <rect x={cloudX + 8} y={cloudY - 2} width="20" height="8" rx="4" fill="#F1F5F9" />
            </g>
          );
        })}
      </g>
    );
  };
  
  // Render mountains/background
  const renderBackground = () => {
    const layers = variant === 'desert-fort' ? 
      [
        { color: '#D2B48C', opacity: 0.3, height: 40 },
        { color: '#C19A6B', opacity: 0.5, height: 35 },
        { color: '#A0826D', opacity: 0.7, height: 30 }
      ] : nearMountains || variant === 'hill-fort' ?
      [
        { color: '#606060', opacity: 0.3, height: 45 },
        { color: '#4A4A4A', opacity: 0.5, height: 40 },
        { color: '#3C3C3C', opacity: 0.7, height: 35 }
      ] :
      [
        { color: '#8B9DC3', opacity: 0.3, height: 40 },
        { color: '#6B8CAF', opacity: 0.5, height: 35 },
        { color: '#4A6B8A', opacity: 0.7, height: 30 }
      ];
    
    return (
      <g>
        {layers.map((layer, layerIndex) => {
          const points = [];
          for (let i = 0; i <= width + 40; i += 40) {
            const baseY = 90 - layer.height;
            const peakY = baseY - staticRng.range(5, 15);
            
            if (i === 0) points.push(`${i - 20},90`);
            points.push(`${i},${baseY}`);
            points.push(`${i + 20},${peakY}`);
            points.push(`${i + 40},${baseY}`);
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
  
  // Render ground
  const renderGround = () => {
    const isSnowy = (climate === ClimateType.COLD || (climate === ClimateType.TEMPERATE && season === 'winter'));
    const isDesert = climate === ClimateType.ARID || variant === 'desert-fort';
    
    return (
      <g>
        {/* Extended ground gradient to bottom (like ocean in fishing hut) */}
        <defs>
          <linearGradient id="groundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={palette.ground} stopOpacity="1" />
            <stop offset="50%" stopColor={palette.ground} stopOpacity="0.95" />
            <stop offset="100%" stopColor={palette.accent} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        
        {/* Main ground extending to bottom */}
        <rect x="0" y={GROUND_Y} width={width} height={height - GROUND_Y} fill="url(#groundGradient)" />
        
        {/* Path/road */}
        <rect x="0" y={GROUND_Y + 8} width={width} height="4" fill="#8B4513" opacity={isSnowy ? "0.2" : "0.3"} />
        
        {/* Snow drifts if winter/cold */}
        {isSnowy && (
          Array.from({ length: 8 }, (_, i) => (
            <ellipse
              key={`snow-${i}`}
              cx={i * (width / 7) + staticRng.range(-20, 20)}
              cy={GROUND_Y + 5}
              rx={30 + staticRng.range(-10, 10)}
              ry="8"
              fill="#FFFFFF"
              opacity="0.8"
            />
          ))
        )}
        
        {/* Desert features */}
        {isDesert && (
          <>
            {/* Sand dunes */}
            {Array.from({ length: 5 }, (_, i) => (
              <ellipse
                key={`dune-${i}`}
                cx={i * (width / 4) + staticRng.range(-30, 30)}
                cy={GROUND_Y + 8}
                rx={40 + staticRng.range(-15, 15)}
                ry="6"
                fill="#D2B48C"
                opacity="0.4"
              />
            ))}
            {/* Desert rocks */}
            {Array.from({ length: 3 }, (_, i) => (
              <rect
                key={`rock-${i}`}
                x={60 + i * 180 + staticRng.range(-20, 20)}
                y={GROUND_Y + 2}
                width={12 + staticRng.range(-4, 4)}
                height="6"
                fill="#A0826D"
                opacity="0.6"
              />
            ))}
          </>
        )}
        
        {/* Grass/vegetation if not snow or desert */}
        {!isSnowy && !isDesert && Array.from({ length: width / 8 }, (_, i) => (
          <rect
            key={i}
            x={i * 8 + staticRng.range(-2, 2)}
            y={GROUND_Y - 2 + staticRng.range(-2, 2)}
            width="2"
            height="4"
            fill={palette.vegetation}
            opacity="0.6"
          />
        ))}
      </g>
    );
  };
  
  // Render fortress based on variant
  const renderFortress = () => {
    const centerX = width / 2;
    
    switch (variant) {
      case 'medieval-castle':
        return renderMedievalCastle(centerX);
      case 'japanese-castle':
        return renderJapaneseCastle(centerX);
      case 'desert-fort':
        return renderDesertFort(centerX);
      case 'star-fort':
        return renderStarFort(centerX);
      case 'motte-bailey':
        return renderMotteBailey(centerX);
      case 'frontier-fort':
        return renderFrontierFort(centerX);
      case 'modern-base':
        return renderModernBase(centerX);
      case 'hill-fort':
        return renderHillFort(centerX);
      case 'byzantine':
        return renderByzantineFortress(centerX);
      case 'presidio':
        return renderPresidio(centerX);
      default:
        return renderMedievalCastle(centerX);
    }
  };
  
  // Medieval Castle (European, 1000-1400)
  const renderMedievalCastle = (centerX: number) => {
    return (
      <g>
        {/* Main keep */}
        <rect x={centerX - 35} y={GROUND_Y - 45} width="70" height="45" fill="#8B7355" stroke="#654321" strokeWidth="1" />
        
        {/* Crenellations */}
        {[-35, -25, -15, -5, 5, 15, 25].map(offset => (
          <rect key={offset} x={centerX + offset} y={GROUND_Y - 50} width="8" height="5" fill="#8B7355" />
        ))}
        
        {/* Side towers */}
        <rect x={centerX - 50} y={GROUND_Y - 35} width="15" height="35" fill="#8B7355" stroke="#654321" strokeWidth="1" />
        <rect x={centerX + 35} y={GROUND_Y - 35} width="15" height="35" fill="#8B7355" stroke="#654321" strokeWidth="1" />
        
        {/* Tower tops */}
        <polygon points={`${centerX - 52},${GROUND_Y - 35} ${centerX - 42.5},${GROUND_Y - 42} ${centerX - 33},${GROUND_Y - 35}`} 
                 fill="#8B4513" stroke="#654321" strokeWidth="1" />
        <polygon points={`${centerX + 33},${GROUND_Y - 35} ${centerX + 42.5},${GROUND_Y - 42} ${centerX + 52},${GROUND_Y - 35}`} 
                 fill="#8B4513" stroke="#654321" strokeWidth="1" />
        
        {/* Gate */}
        <rect x={centerX - 8} y={GROUND_Y - 20} width="16" height="20" rx="8" fill="#2C1810" />
        <rect x={centerX - 6} y={GROUND_Y - 18} width="2" height="16" fill="#8B4513" />
        <rect x={centerX + 4} y={GROUND_Y - 18} width="2" height="16" fill="#8B4513" />
        
        {/* Windows */}
        <rect x={centerX - 20} y={GROUND_Y - 35} width="3" height="5" fill="#1C1C1C" />
        <rect x={centerX} y={GROUND_Y - 35} width="3" height="5" fill="#1C1C1C" />
        <rect x={centerX + 17} y={GROUND_Y - 35} width="3" height="5" fill="#1C1C1C" />
        
        {/* Flag with wave animation */}
        <rect x={centerX - 1} y={GROUND_Y - 65} width="2" height="20" fill="#4A4A4A" />
        <path d={`M ${centerX + 1} ${GROUND_Y - 65} 
                  Q ${centerX + 8 + Math.sin(flagWave) * 2} ${GROUND_Y - 63} 
                  ${centerX + 15} ${GROUND_Y - 62}
                  L ${centerX + 15} ${GROUND_Y - 57}
                  Q ${centerX + 8 + Math.sin(flagWave) * 2} ${GROUND_Y - 58}
                  ${centerX + 1} ${GROUND_Y - 60}
                  Z`} 
              fill="#DC143C" />
        
        {/* Moat if near water */}
        {nearOcean && (
          <rect x={centerX - 80} y={GROUND_Y + 5} width="160" height="3" fill="#4A90E2" opacity="0.6" />
        )}
      </g>
    );
  };
  
  // Japanese Castle (1400-1600)
  const renderJapaneseCastle = (centerX: number) => {
    return (
      <g>
        {/* Stone base */}
        <polygon points={`${centerX - 45},${GROUND_Y} ${centerX - 35},${GROUND_Y - 20} ${centerX + 35},${GROUND_Y - 20} ${centerX + 45},${GROUND_Y}`}
                 fill="#808080" stroke="#606060" strokeWidth="1" />
        
        {/* Main structure - multi-tiered */}
        <rect x={centerX - 30} y={GROUND_Y - 35} width="60" height="15" fill="#F5F5F0" stroke="#D4D4D4" strokeWidth="1" />
        <rect x={centerX - 25} y={GROUND_Y - 45} width="50" height="10" fill="#F5F5F0" stroke="#D4D4D4" strokeWidth="1" />
        <rect x={centerX - 20} y={GROUND_Y - 53} width="40" height="8" fill="#F5F5F0" stroke="#D4D4D4" strokeWidth="1" />
        
        {/* Curved roofs */}
        <path d={`M ${centerX - 35} ${GROUND_Y - 35} Q ${centerX} ${GROUND_Y - 40} ${centerX + 35} ${GROUND_Y - 35}`}
              fill="#2C2C2C" stroke="#1C1C1C" strokeWidth="1" />
        <path d={`M ${centerX - 30} ${GROUND_Y - 45} Q ${centerX} ${GROUND_Y - 49} ${centerX + 30} ${GROUND_Y - 45}`}
              fill="#2C2C2C" stroke="#1C1C1C" strokeWidth="1" />
        <path d={`M ${centerX - 25} ${GROUND_Y - 53} Q ${centerX} ${GROUND_Y - 56} ${centerX + 25} ${GROUND_Y - 53}`}
              fill="#2C2C2C" stroke="#1C1C1C" strokeWidth="1" />
        
        {/* Roof ornaments */}
        <rect x={centerX - 1} y={GROUND_Y - 58} width="2" height="5" fill="#FFD700" />
        
        {/* Windows */}
        <rect x={centerX - 15} y={GROUND_Y - 30} width="4" height="4" fill="#2C1C1C" />
        <rect x={centerX - 2} y={GROUND_Y - 30} width="4" height="4" fill="#2C1C1C" />
        <rect x={centerX + 11} y={GROUND_Y - 30} width="4" height="4" fill="#2C1C1C" />
        
        {/* Cherry blossoms if spring */}
        {season === 'spring' && (
          <>
            {[0, 1, 2, 3, 4].map(i => (
              <circle key={i} 
                      cx={centerX - 60 + staticRng.range(-10, 10)} 
                      cy={GROUND_Y - 20 - staticRng.range(0, 20)} 
                      r="1.5" 
                      fill="#FFB7C5" 
                      opacity="0.8" />
            ))}
            {/* Cherry tree */}
            <rect x={centerX - 60} y={GROUND_Y - 15} width="4" height="15" fill="#8B4513" />
            <circle cx={centerX - 58} cy={GROUND_Y - 20} r="8" fill="#FFB7C5" opacity="0.6" />
          </>
        )}
      </g>
    );
  };
  
  // Desert Fort (MENA, 800-1500)
  const renderDesertFort = (centerX: number) => {
    return (
      <g>
        {/* Adobe walls */}
        <rect x={centerX - 40} y={GROUND_Y - 30} width="80" height="30" fill="#D2B48C" stroke="#A0826D" strokeWidth="1" />
        
        {/* Crenellations */}
        {[-38, -26, -14, -2, 10, 22, 34].map(offset => (
          <rect key={offset} x={centerX + offset} y={GROUND_Y - 34} width="10" height="4" fill="#D2B48C" />
        ))}
        
        {/* Central tower with minaret */}
        <rect x={centerX - 10} y={GROUND_Y - 45} width="20" height="45" fill="#C19A6B" stroke="#A0826D" strokeWidth="1" />
        <rect x={centerX - 3} y={GROUND_Y - 50} width="6" height="5" fill="#C19A6B" />
        <polygon points={`${centerX - 4},${GROUND_Y - 50} ${centerX},${GROUND_Y - 55} ${centerX + 4},${GROUND_Y - 50}`} 
                 fill="#FFD700" />
        
        {/* Arched gate */}
        <path d={`M ${centerX - 8} ${GROUND_Y} L ${centerX - 8} ${GROUND_Y - 12} Q ${centerX} ${GROUND_Y - 18} ${centerX + 8} ${GROUND_Y - 12} L ${centerX + 8} ${GROUND_Y}`}
              fill="#2C1810" />
        
        {/* Windows */}
        <path d={`M ${centerX - 25} ${GROUND_Y - 20} L ${centerX - 25} ${GROUND_Y - 17} Q ${centerX - 23} ${GROUND_Y - 19} ${centerX - 21} ${GROUND_Y - 17} L ${centerX - 21} ${GROUND_Y - 20}`}
              fill="#1C1C1C" />
        <path d={`M ${centerX + 21} ${GROUND_Y - 20} L ${centerX + 21} ${GROUND_Y - 17} Q ${centerX + 23} ${GROUND_Y - 19} ${centerX + 25} ${GROUND_Y - 17} L ${centerX + 25} ${GROUND_Y - 20}`}
              fill="#1C1C1C" />
        
        {/* Date palms */}
        <rect x={centerX - 55} y={GROUND_Y - 12} width="3" height="12" fill="#8B4513" />
        <g transform={`translate(${centerX - 53.5}, ${GROUND_Y - 15})`}>
          {[0, 60, 120, 180, 240, 300].map(angle => (
            <rect key={angle} 
                  x="-0.5" y="-6" 
                  width="1" height="6" 
                  fill="#228B22" 
                  transform={`rotate(${angle} 0 0)`} />
          ))}
        </g>
        
        {/* Water well */}
        <circle cx={centerX + 50} cy={GROUND_Y - 3} r="4" fill="none" stroke="#808080" strokeWidth="1" />
        <rect x={centerX + 48} y={GROUND_Y - 8} width="4" height="5" fill="#8B4513" />
      </g>
    );
  };
  
  // Star Fort (Renaissance, 1500-1700)
  const renderStarFort = (centerX: number) => {
    const bastionPoints = [
      { x: -50, y: -15 }, { x: -35, y: -25 }, { x: -20, y: -20 },
      { x: 0, y: -25 }, { x: 20, y: -20 }, { x: 35, y: -25 }, { x: 50, y: -15 }
    ];
    
    return (
      <g>
        {/* Star-shaped walls */}
        <polygon points={bastionPoints.map(p => `${centerX + p.x},${GROUND_Y + p.y}`).join(' ') + ` ${centerX + 50},${GROUND_Y} ${centerX - 50},${GROUND_Y}`}
                 fill="#808080" stroke="#606060" strokeWidth="1" />
        
        {/* Inner fort */}
        <rect x={centerX - 25} y={GROUND_Y - 20} width="50" height="20" fill="#909090" stroke="#707070" strokeWidth="1" />
        
        {/* Cannons on bastions */}
        <rect x={centerX - 40} y={GROUND_Y - 22} width="8" height="2" fill="#1C1C1C" />
        <circle cx={centerX - 42} cy={GROUND_Y - 21} r="2" fill="#1C1C1C" />
        
        <rect x={centerX + 32} y={GROUND_Y - 22} width="8" height="2" fill="#1C1C1C" />
        <circle cx={centerX + 42} cy={GROUND_Y - 21} r="2" fill="#1C1C1C" />
        
        {/* Cannon smoke animation */}
        {animationFrame % 60 < 5 && (
          <>
            <circle cx={centerX - 48} cy={GROUND_Y - 21} r="3" fill="#F5F5F5" opacity="0.6" />
            <circle cx={centerX - 50} cy={GROUND_Y - 22} r="4" fill="#F5F5F5" opacity="0.4" />
          </>
        )}
        
        {/* Gunpowder barrels */}
        <rect x={centerX - 15} y={GROUND_Y - 5} width="4" height="5" fill="#8B4513" />
        <rect x={centerX - 10} y={GROUND_Y - 5} width="4" height="5" fill="#8B4513" />
        
        {/* Gate */}
        <rect x={centerX - 5} y={GROUND_Y - 10} width="10" height="10" fill="#2C1810" />
        
        {/* Flag */}
        <rect x={centerX - 1} y={GROUND_Y - 35} width="2" height="15" fill="#4A4A4A" />
        <rect x={centerX + 1} y={GROUND_Y - 35} width="12" height="8" fill="#FF6B6B" />
      </g>
    );
  };
  
  // Motte and Bailey (Norman, 1000-1200)
  const renderMotteBailey = (centerX: number) => {
    return (
      <g>
        {/* Motte (hill) */}
        <polygon points={`${centerX - 40},${GROUND_Y} ${centerX - 20},${GROUND_Y - 25} ${centerX + 20},${GROUND_Y - 25} ${centerX + 40},${GROUND_Y}`}
                 fill="#8B7355" stroke="#6B5345" strokeWidth="1" />
        
        {/* Wooden tower on motte */}
        <rect x={centerX - 12} y={GROUND_Y - 40} width="24" height="15" fill="#8B4513" stroke="#654321" strokeWidth="1" />
        <polygon points={`${centerX - 14},${GROUND_Y - 40} ${centerX},${GROUND_Y - 48} ${centerX + 14},${GROUND_Y - 40}`}
                 fill="#654321" stroke="#4A3A2A" strokeWidth="1" />
        
        {/* Palisade around tower */}
        {[-10, -6, -2, 2, 6, 10].map(offset => (
          <rect key={offset} x={centerX + offset - 1} y={GROUND_Y - 30} width="2" height="8" fill="#654321" />
        ))}
        
        {/* Bailey (lower enclosure) */}
        {[-60, -50, -40, 40, 50, 60].map(x => (
          <rect key={x} x={centerX + x} y={GROUND_Y - 10} width="3" height="10" fill="#8B4513" />
        ))}
        
        {/* Livestock in bailey */}
        <rect x={centerX - 55} y={GROUND_Y - 3} width="4" height="3" fill="#F5F5F5" />
        <rect x={centerX - 54} y={GROUND_Y - 4} width="1" height="1" fill="#FFB7C5" />
        
        {/* Cooking fire smoke */}
        <circle cx={centerX + 45} cy={GROUND_Y - 8 - (animationFrame % 15) * 0.5} r="2" fill="#808080" opacity="0.4" />
        <circle cx={centerX + 45} cy={GROUND_Y - 12 - (animationFrame % 15) * 0.5} r="3" fill="#808080" opacity="0.3" />
      </g>
    );
  };
  
  // Frontier Fort (American, 1750-1890)
  const renderFrontierFort = (centerX: number) => {
    return (
      <g>
        {/* Log palisade */}
        {Array.from({ length: 15 }, (_, i) => (
          <rect key={i} x={centerX - 45 + i * 6} y={GROUND_Y - 20} width="4" height="20" fill="#8B4513" stroke="#654321" strokeWidth="0.5" />
        ))}
        
        {/* Blockhouses at corners */}
        <rect x={centerX - 50} y={GROUND_Y - 25} width="12" height="25" fill="#A0826D" stroke="#8B4513" strokeWidth="1" />
        <rect x={centerX + 38} y={GROUND_Y - 25} width="12" height="25" fill="#A0826D" stroke="#8B4513" strokeWidth="1" />
        
        {/* Blockhouse roofs */}
        <polygon points={`${centerX - 52},${GROUND_Y - 25} ${centerX - 44},${GROUND_Y - 32} ${centerX - 36},${GROUND_Y - 25}`}
                 fill="#654321" />
        <polygon points={`${centerX + 36},${GROUND_Y - 25} ${centerX + 44},${GROUND_Y - 32} ${centerX + 52},${GROUND_Y - 25}`}
                 fill="#654321" />
        
        {/* Gate */}
        <rect x={centerX - 8} y={GROUND_Y - 15} width="16" height="15" fill="#654321" />
        <rect x={centerX - 6} y={GROUND_Y - 13} width="12" height="13" fill="#2C1810" />
        
        {/* American flag (if era appropriate) */}
        {year >= 1776 && (
          <>
            <rect x={centerX + 20} y={GROUND_Y - 40} width="2" height="20" fill="#4A4A4A" />
            <rect x={centerX + 22} y={GROUND_Y - 40} width="15" height="10" fill="#B22234" />
            <rect x={centerX + 22} y={GROUND_Y - 40} width="15" height="2" fill="#F5F5F5" />
            <rect x={centerX + 22} y={GROUND_Y - 36} width="15" height="2" fill="#F5F5F5" />
            <rect x={centerX + 22} y={GROUND_Y - 32} width="15" height="2" fill="#F5F5F5" />
            <rect x={centerX + 22} y={GROUND_Y - 40} width="6" height="6" fill="#3C3B6E" />
          </>
        )}
        
        {/* Trading post sign */}
        <rect x={centerX - 35} y={GROUND_Y - 15} width="20" height="8" fill="#D2B48C" stroke="#8B4513" strokeWidth="0.5" />
        <rect x={centerX - 32} y={GROUND_Y - 13} width="14" height="1" fill="#2C1810" />
        <rect x={centerX - 30} y={GROUND_Y - 11} width="10" height="1" fill="#2C1810" />
      </g>
    );
  };
  
  // Modern Military Base (1950-2000)
  const renderModernBase = (centerX: number) => {
    return (
      <g>
        {/* Concrete bunkers */}
        <rect x={centerX - 40} y={GROUND_Y - 15} width="30" height="15" fill="#C0C0C0" stroke="#808080" strokeWidth="1" />
        <rect x={centerX + 10} y={GROUND_Y - 15} width="30" height="15" fill="#C0C0C0" stroke="#808080" strokeWidth="1" />
        
        {/* Observation slits */}
        <rect x={centerX - 30} y={GROUND_Y - 10} width="10" height="2" fill="#1C1C1C" />
        <rect x={centerX + 20} y={GROUND_Y - 10} width="10" height="2" fill="#1C1C1C" />
        
        {/* Radar dish */}
        <rect x={centerX - 1} y={GROUND_Y - 30} width="2" height="15" fill="#606060" />
        <circle cx={centerX} cy={GROUND_Y - 35} r="8" fill="none" stroke="#808080" strokeWidth="2" />
        <line x1={centerX} y1={GROUND_Y - 35} x2={centerX + 5 * Math.cos(animationFrame * 0.05)} y2={GROUND_Y - 35 + 5 * Math.sin(animationFrame * 0.05)} 
              stroke="#FF0000" strokeWidth="1" />
        
        {/* Communication tower */}
        <rect x={centerX + 45} y={GROUND_Y - 25} width="2" height="25" fill="#606060" />
        <rect x={centerX + 44} y={GROUND_Y - 25} width="4" height="1" fill="#606060" />
        <rect x={centerX + 43} y={GROUND_Y - 20} width="6" height="1" fill="#606060" />
        <circle cx={centerX + 46} cy={GROUND_Y - 27} r="1" fill="#FF0000" />
        
        {/* Fence */}
        <rect x={centerX - 60} y={GROUND_Y - 8} width="120" height="1" fill="#606060" />
        {Array.from({ length: 13 }, (_, i) => (
          <rect key={i} x={centerX - 60 + i * 10} y={GROUND_Y - 8} width="1" height="8" fill="#606060" />
        ))}
        
        {/* Helicopter pad */}
        <rect x={centerX - 20} y={GROUND_Y - 1} width="20" height="1" fill="#FFFF00" />
        <rect x={centerX - 10} y={GROUND_Y - 5} width="1" height="5" fill="#FFFF00" />
        <rect x={centerX - 15} y={GROUND_Y - 3} width="10" height="1" fill="#FFFF00" />
      </g>
    );
  };
  
  // Hill Fort (Celtic/Ancient, 500 BC - 500 AD)
  const renderHillFort = (centerX: number) => {
    return (
      <g>
        {/* Earthwork ramparts */}
        <ellipse cx={centerX} cy={GROUND_Y - 8} rx="60" ry="15" fill="#8B7355" stroke="#6B5345" strokeWidth="1" />
        <ellipse cx={centerX} cy={GROUND_Y - 10} rx="45" ry="10" fill="#9B8976" />
        
        {/* Wooden palisade */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const px = centerX + Math.cos(angle) * 40;
          const py = GROUND_Y - 10 + Math.sin(angle) * 8;
          return <rect key={i} x={px - 1} y={py - 10} width="2" height="10" fill="#654321" />;
        })}
        
        {/* Round houses */}
        <circle cx={centerX - 15} cy={GROUND_Y - 10} r="6" fill="#A0826D" stroke="#8B4513" strokeWidth="1" />
        <circle cx={centerX + 10} cy={GROUND_Y - 8} r="5" fill="#A0826D" stroke="#8B4513" strokeWidth="1" />
        
        {/* Conical roofs */}
        <polygon points={`${centerX - 21},${GROUND_Y - 10} ${centerX - 15},${GROUND_Y - 18} ${centerX - 9},${GROUND_Y - 10}`}
                 fill="#8B7355" stroke="#6B5345" strokeWidth="1" />
        <polygon points={`${centerX + 5},${GROUND_Y - 8} ${centerX + 10},${GROUND_Y - 14} ${centerX + 15},${GROUND_Y - 8}`}
                 fill="#8B7355" stroke="#6B5345" strokeWidth="1" />
        
        {/* Standing stone */}
        <rect x={centerX + 30} y={GROUND_Y - 12} width="4" height="12" fill="#808080" stroke="#606060" strokeWidth="1" />
        
        {/* Torch flames */}
        <rect x={centerX - 30} y={GROUND_Y - 8} width="1" height="6" fill="#654321" />
        <ellipse cx={centerX - 29.5} cy={GROUND_Y - 9 - Math.abs(Math.sin(animationFrame * 0.1))} 
                 rx="1.5" ry="2" fill="#FF6B6B" opacity="0.8" />
        
        <rect x={centerX + 25} y={GROUND_Y - 8} width="1" height="6" fill="#654321" />
        <ellipse cx={centerX + 25.5} cy={GROUND_Y - 9 - Math.abs(Math.sin(animationFrame * 0.1 + 1))} 
                 rx="1.5" ry="2" fill="#FF6B6B" opacity="0.8" />
      </g>
    );
  };
  
  // Byzantine Fortress
  const renderByzantineFortress = (centerX: number) => {
    return (
      <g>
        {/* Thick walls */}
        <rect x={centerX - 45} y={GROUND_Y - 30} width="90" height="30" fill="#A0A0A0" stroke="#808080" strokeWidth="1" />
        
        {/* Round towers */}
        <circle cx={centerX - 40} cy={GROUND_Y - 15} r="12" fill="#A0A0A0" stroke="#808080" strokeWidth="1" />
        <circle cx={centerX + 40} cy={GROUND_Y - 15} r="12" fill="#A0A0A0" stroke="#808080" strokeWidth="1" />
        
        {/* Central dome */}
        <ellipse cx={centerX} cy={GROUND_Y - 30} rx="20" ry="12" fill="#D4AF37" stroke="#B8860B" strokeWidth="1" />
        <rect x={centerX - 1} y={GROUND_Y - 45} width="2" height="8" fill="#FFD700" />
        <rect x={centerX - 3} y={GROUND_Y - 47} width="6" height="2" fill="#FFD700" />
        
        {/* Arched windows */}
        <path d={`M ${centerX - 20} ${GROUND_Y - 15} Q ${centerX - 18} ${GROUND_Y - 18} ${centerX - 16} ${GROUND_Y - 15}`} 
              fill="#1C1C1C" />
        <path d={`M ${centerX - 2} ${GROUND_Y - 15} Q ${centerX} ${GROUND_Y - 18} ${centerX + 2} ${GROUND_Y - 15}`} 
              fill="#1C1C1C" />
        <path d={`M ${centerX + 16} ${GROUND_Y - 15} Q ${centerX + 18} ${GROUND_Y - 18} ${centerX + 20} ${GROUND_Y - 15}`} 
              fill="#1C1C1C" />
        
        {/* Gate */}
        <path d={`M ${centerX - 8} ${GROUND_Y} L ${centerX - 8} ${GROUND_Y - 12} Q ${centerX} ${GROUND_Y - 16} ${centerX + 8} ${GROUND_Y - 12} L ${centerX + 8} ${GROUND_Y}`}
              fill="#2C1810" />
      </g>
    );
  };
  
  // Spanish Presidio
  const renderPresidio = (centerX: number) => {
    return (
      <g>
        {/* Adobe walls */}
        <rect x={centerX - 45} y={GROUND_Y - 25} width="90" height="25" fill="#D2B48C" stroke="#A0826D" strokeWidth="1" />
        
        {/* Corner bastions */}
        <rect x={centerX - 50} y={GROUND_Y - 20} width="10" height="20" fill="#C19A6B" stroke="#A0826D" strokeWidth="1" />
        <rect x={centerX + 40} y={GROUND_Y - 20} width="10" height="20" fill="#C19A6B" stroke="#A0826D" strokeWidth="1" />
        
        {/* Chapel */}
        <rect x={centerX - 8} y={GROUND_Y - 35} width="16" height="35" fill="#F5F5F0" stroke="#D4D4D4" strokeWidth="1" />
        <polygon points={`${centerX - 10},${GROUND_Y - 35} ${centerX},${GROUND_Y - 42} ${centerX + 10},${GROUND_Y - 35}`}
                 fill="#8B4513" stroke="#654321" strokeWidth="1" />
        <rect x={centerX - 1} y={GROUND_Y - 45} width="2" height="8" fill="#606060" />
        <rect x={centerX - 2} y={GROUND_Y - 47} width="4" height="2" fill="#606060" />
        
        {/* Bell tower */}
        <rect x={centerX - 3} y={GROUND_Y - 40} width="6" height="5" fill="#2C1810" />
        
        {/* Arched entrance */}
        <path d={`M ${centerX - 6} ${GROUND_Y} L ${centerX - 6} ${GROUND_Y - 10} Q ${centerX} ${GROUND_Y - 14} ${centerX + 6} ${GROUND_Y - 10} L ${centerX + 6} ${GROUND_Y}`}
              fill="#2C1810" />
        
        {/* Spanish flag if appropriate */}
        {year >= 1500 && year <= 1821 && (
          <>
            <rect x={centerX + 25} y={GROUND_Y - 35} width="2" height="15" fill="#4A4A4A" />
            <rect x={centerX + 27} y={GROUND_Y - 35} width="12" height="8" fill="#FFC400" />
            <rect x={centerX + 27} y={GROUND_Y - 33} width="12" height="1" fill="#AD1519" />
            <rect x={centerX + 27} y={GROUND_Y - 29} width="12" height="1" fill="#AD1519" />
          </>
        )}
      </g>
    );
  };
  
  // Render guards/soldiers
  const renderGuards = () => {
    return (
      <g>
        {guards.map((guard, i) => {
          const walkCycle = Math.floor(animationFrame / 8) % 2;
          const legOffset = walkCycle * guard.direction;
          
          // Different uniforms per guard type
          const uniformColors: Record<string, string> = {
            knight: '#808080',
            samurai: '#8B0000',
            guard: '#8B4513',
            musketeer: '#4169E1',
            norman: '#654321',
            militia: '#556B2F',
            soldier: '#4A5F4A',
            warrior: '#8B4513',
            archer: '#228B22',
            conquistador: '#606060'
          };
          
          const uniformColor = uniformColors[guard.type] || '#8B4513';
          
          return (
            <g key={i} transform={`translate(${guard.x}, ${GROUND_Y + 7})`}>
              {/* Body */}
              <rect x="-2" y="-8" width="4" height="6" fill={uniformColor} />
              
              {/* Head */}
              <rect x="-1.5" y="-10" width="3" height="2" fill="#FFDBAC" />
              
              {/* Helmet/hat based on type */}
              {guard.type === 'knight' && (
                <rect x="-2" y="-11" width="4" height="2" fill="#606060" />
              )}
              {guard.type === 'samurai' && (
                <polygon points="-3,-11 0,-13 3,-11" fill="#2C2C2C" />
              )}
              {guard.type === 'musketeer' && (
                <rect x="-2.5" y="-11" width="5" height="1" fill="#1C1C1C" />
              )}
              
              {/* Legs */}
              <rect x={-1.5 + legOffset} y="-2" width="1" height="4" fill="#654321" />
              <rect x={0.5 - legOffset} y="-2" width="1" height="4" fill="#654321" />
              
              {/* Arms */}
              <rect x="-3" y="-6" width="1" height="3" fill="#FFDBAC" />
              <rect x="2" y="-6" width="1" height="3" fill="#FFDBAC" />
              
              {/* Weapon */}
              {(guard.type === 'knight' || guard.type === 'samurai' || guard.type === 'warrior') && (
                <rect x="2" y="-8" width="1" height="6" fill="#C0C0C0" />
              )}
              {(guard.type === 'musketeer' || guard.type === 'militia') && (
                <rect x="2" y="-7" width="1" height="5" fill="#654321" />
              )}
              {guard.type === 'archer' && (
                <>
                  <rect x="-4" y="-7" width="1" height="4" fill="#8B4513" />
                  <line x1="-3.5" y1="-7" x2="-3.5" y2="-3" stroke="#F5F5F5" strokeWidth="0.5" />
                </>
              )}
            </g>
          );
        })}
      </g>
    );
  };
  
  // Calculate zoomed viewBox for center-focused zoom
  const zoomLevel = 1.5;
  const zoomedWidth = width / zoomLevel;
  const zoomedHeight = height / zoomLevel;
  const zoomOffsetX = (width - zoomedWidth) / 2;
  const zoomOffsetY = (height - zoomedHeight) / 3;
  
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`${zoomOffsetX} ${zoomOffsetY} ${zoomedWidth} ${zoomedHeight}`}
      style={{ imageRendering: 'pixelated' }}
      className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-t-lg"
    >
      {renderSky()}
      {renderBackground()}
      {renderGround()}
      {renderFortress()}
      {renderGuards()}
    </svg>
  );
};

export default React.memo(FortressBanner);