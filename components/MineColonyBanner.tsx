/**
 * components/MineColonyBanner.tsx - Simple pixel-art banner for mining colonies
 * Following TerrainStructureBanner's approach with deep customization
 */
import React, { useEffect, useState } from 'react';
import { TerrainStructure, ClimateType, Season, TimeOfDay, BiomeType } from '../types';

interface MineColonyBannerProps {
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

// Material colors for different mine types
const MINE_COLORS: Record<string, { ore: string, cart: string, entrance: string }> = {
  gold: { ore: '#FFD700', cart: '#8B4513', entrance: '#2C1810' },
  silver: { ore: '#C0C0C0', cart: '#606060', entrance: '#1C1C1C' },
  copper: { ore: '#B87333', cart: '#8B4513', entrance: '#4A3A2A' },
  iron: { ore: '#708090', cart: '#404040', entrance: '#2C2C2C' },
  coal: { ore: '#1C1C1C', cart: '#2C1810', entrance: '#000000' },
  tin: { ore: '#D3D3D3', cart: '#808080', entrance: '#3C3C3C' },
  salt: { ore: '#F5F5F5', cart: '#D2B48C', entrance: '#8B7355' },
  diamond: { ore: '#B9F2FF', cart: '#606060', entrance: '#1C1C1C' },
  jade: { ore: '#2E8B57', cart: '#8B4513', entrance: '#4A3A2A' },
  ruby: { ore: '#DC143C', cart: '#4A4A4A', entrance: '#2C1810' },
  emerald: { ore: '#50C878', cart: '#654321', entrance: '#3C3C3C' },
  sapphire: { ore: '#0F52BA', cart: '#505050', entrance: '#1C1C1C' },
  uranium: { ore: '#90EE90', cart: '#FFD700', entrance: '#000000' }
};

const getTimeOfDayCategory = (time: TimeOfDay): 'dawn' | 'day' | 'dusk' | 'night' => {
  switch (time) {
    case 'Dawn': return 'dawn';
    case 'Dusk': return 'dusk';
    case 'Night': return 'night';
    default: return 'day';
  }
};

const MineColonyBanner: React.FC<MineColonyBannerProps> = ({
  structure,
  era = '1500',
  culturalZone = 'european',
  climate = ClimateType.TEMPERATE,
  season,
  timeOfDay,
  width = 600,
  height = 250,
  seed = 12345,
  adjacentBiomes = []
}) => {
  const [animationFrame, setAnimationFrame] = useState(0);
  const [miners, setMiners] = useState<Array<{ x: number, direction: 1 | -1, speed: number, hasOre: boolean }>>([]);
  const [cartPosition, setCartPosition] = useState(0);
  
  // Get material type
  const material = Object.keys(structure.mineralDeposits || {})[0]?.toLowerCase() || 'iron';
  const mineColors = MINE_COLORS[material] || MINE_COLORS.iron;
  
  // Parse era
  const year = parseInt(era);
  const isMedieval = year < 1500;
  const isAncient = year < 500;
  const isModern = year >= 1900;
  const isIndustrial = year >= 1800 && year < 1900;
  
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
  
  // Initialize miners
  useEffect(() => {
    const minerCount = 2 + Math.floor(staticRng.range(0, 2));
    const newMiners = [];
    for (let i = 0; i < minerCount; i++) {
      newMiners.push({
        x: staticRng.range(100, width - 100),
        direction: staticRng.next() > 0.5 ? 1 : -1 as 1 | -1,
        speed: 0.25 + staticRng.range(0, 0.25),
        hasOre: staticRng.next() > 0.5
      });
    }
    setMiners(newMiners);
  }, [seed]);
  
  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame(prev => prev + 1);
      
      // Update miner positions
      setMiners(prev => prev.map(miner => {
        let newX = miner.x + (miner.direction * miner.speed);
        let newDirection = miner.direction;
        let newHasOre = miner.hasOre;
        
        // Check if miner reaches mine entrance
        const centerX = width / 2;
        if (Math.abs(newX - centerX) < 20) {
          newHasOre = !miner.hasOre; // Toggle ore carrying
        }
        
        if (newX <= 50 || newX >= width - 50) {
          newDirection = miner.direction === 1 ? -1 : 1;
          newX = miner.x + (newDirection * miner.speed);
        }
        
        return { ...miner, x: newX, direction: newDirection, hasOre: newHasOre };
      }));
      
      // Update cart position
      setCartPosition(prev => (prev + 0.5) % 100);
    }, 50);
    
    return () => clearInterval(interval);
  }, [width]);
  
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
        
        {/* Simple clouds */}
        {[0, 1, 2, 3].map((i) => {
          const cloudX = -100 + cloudOffset + i * 180;
          const cloudY = 20 + staticRng.range(-5, 10);
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
  
  // Render mountains
  const renderMountains = () => {
    const mountainLayers = [
      { color: '#8B9DC3', opacity: 0.3, height: 40 },
      { color: '#6B8CAF', opacity: 0.5, height: 35 },
      { color: '#4A6B8A', opacity: 0.7, height: 30 }
    ];
    
    // Mountain mine - darker mountains
    if (nearMountains || material === 'gold' || material === 'silver') {
      mountainLayers[0].color = '#606060';
      mountainLayers[1].color = '#4A4A4A';
      mountainLayers[2].color = '#3C3C3C';
    }
    
    // Desert mine
    if (nearDesert || material === 'salt') {
      mountainLayers[0].color = '#D2B48C';
      mountainLayers[1].color = '#C19A6B';
      mountainLayers[2].color = '#A0826D';
    }
    
    return (
      <g>
        {mountainLayers.map((layer, layerIndex) => {
          const points = [];
          for (let i = 0; i <= width + 40; i += 40) {
            const baseY = 90 - layer.height;
            const peakY = baseY - staticRng.range(5, 15);
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
  
  // Render ground
  const renderGround = () => {
    const isSnowy = (climate === ClimateType.COLD || (climate === ClimateType.TEMPERATE && season === 'winter'));
    const isDesert = climate === ClimateType.ARID;
    
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


        
        {/* Rocky ground for mines */}
        {Array.from({ length: width / 12 }, (_, i) => (
          <rect
            key={i}
            x={i * 12 + staticRng.range(-3, 3)}
            y={GROUND_Y + staticRng.range(0, 3)}
            width={staticRng.range(3, 6)}
            height={staticRng.range(2, 4)}
            fill={isSnowy ? "#E0E8EF" : "#808080"}
            opacity="0.3"
          />
        ))}
        
        {/* Snow drifts if winter/cold */}
        {isSnowy && (
          Array.from({ length: 6 }, (_, i) => (
            <ellipse
              key={`snow-${i}`}
              cx={i * (width / 5) + staticRng.range(-20, 20)}
              cy={GROUND_Y + 6}
              rx={25 + staticRng.range(-10, 10)}
              ry="7"
              fill="#FFFFFF"
              opacity="0.7"
            />
          ))
        )}
        
        {/* Mine cart tracks */}
        <rect x="0" y={GROUND_Y + 10} width={width} height="2" fill="#4A4A4A" opacity={isSnowy ? "0.5" : "1"} />
        <rect x="0" y={GROUND_Y + 14} width={width} height="2" fill="#4A4A4A" opacity={isSnowy ? "0.5" : "1"} />
        {/* Track ties */}
        {Array.from({ length: width / 20 }, (_, i) => (
          <rect key={i} x={i * 20} y={GROUND_Y + 9} width="3" height="8" fill="#654321" opacity={isSnowy ? "0.6" : "1"} />
        ))}
      </g>
    );
  };

  const PATH_OFFSET = 70;                 // tweak between 50–100 to taste
  const PATH_Y = GROUND_Y + PATH_OFFSET;  // baseline for the walking path & figures
  
  // Render mine
  const renderMine = () => {
    const centerX = width / 2;
    
    return (
      <g>
        {/* Mine hill/mountain */}
        <polygon
          points={`${centerX - 60},${GROUND_Y} ${centerX - 30},${GROUND_Y - 35} ${centerX + 30},${GROUND_Y - 35} ${centerX + 60},${GROUND_Y}`}
          fill="#8B7355"
          stroke="#654321"
          strokeWidth="1"
        />
        
        {/* Mine entrance */}
        <rect x={centerX - 15} y={GROUND_Y - 20} width="30" height="20" rx="15" fill={mineColors.entrance} />
        
        {/* Support beams */}
        <rect x={centerX - 12} y={GROUND_Y - 20} width="3" height="20" fill="#8B4513" />
        <rect x={centerX + 9} y={GROUND_Y - 20} width="3" height="20" fill="#8B4513" />
        <rect x={centerX - 12} y={GROUND_Y - 20} width="24" height="3" fill="#8B4513" />
        
        {/* Mine cart */}
        <g transform={`translate(${cartPosition * 2 - 50}, 0)`}>
          <rect x={centerX - 40} y={GROUND_Y + 5} width="16" height="8" fill={mineColors.cart} stroke="#1C1C1C" strokeWidth="1" />
          <circle cx={centerX - 35} cy={GROUND_Y + 14} r="2" fill="#1C1C1C" />
          <circle cx={centerX - 29} cy={GROUND_Y + 14} r="2" fill="#1C1C1C" />
          {/* Ore in cart */}
          <rect x={centerX - 37} y={GROUND_Y + 3} width="4" height="4" fill={mineColors.ore} />
          <rect x={centerX - 32} y={GROUND_Y + 2} width="3" height="3" fill={mineColors.ore} />
        </g>
        
        {/* Period-specific equipment */}
        {isModern && (
          // Modern: Electric lights
          <>
            <circle cx={centerX - 8} cy={GROUND_Y - 15} r="2" fill="#FFFF99" />
            <circle cx={centerX + 8} cy={GROUND_Y - 15} r="2" fill="#FFFF99" />
            <rect x={centerX - 10} y={GROUND_Y - 17} width="20" height="1" fill="#404040" />
          </>
        )}
        
        {isIndustrial && material === 'coal' && (
          // Industrial coal mine: Steam engine
          <>
            <rect x={centerX + 35} y={GROUND_Y - 25} width="20" height="25" fill="#606060" stroke="#404040" strokeWidth="1" />
            <rect x={centerX + 42} y={GROUND_Y - 35} width="6" height="10" fill="#404040" />
            {/* Steam puffs */}
            <circle cx={centerX + 45} cy={GROUND_Y - 40 - (animationFrame % 20)} r="3" fill="#F5F5F5" opacity="0.6" />
            <circle cx={centerX + 45} cy={GROUND_Y - 45 - (animationFrame % 20)} r="4" fill="#F5F5F5" opacity="0.4" />
          </>
        )}
        
        {isMedieval && (
          // Medieval: Windlass
          <>
            <rect x={centerX - 25} y={GROUND_Y - 15} width="2" height="15" fill="#8B4513" />
            <rect x={centerX - 27} y={GROUND_Y - 16} width="6" height="2" fill="#8B4513" />
            <circle cx={centerX - 24} cy={GROUND_Y - 10} r="4" fill="none" stroke="#654321" strokeWidth="1" />
          </>
        )}
        
        {/* Ore pile */}
        <polygon points={`${centerX + 25},${GROUND_Y} ${centerX + 30},${GROUND_Y - 8} ${centerX + 35},${GROUND_Y}`} 
                 fill={mineColors.ore} stroke={material === 'coal' ? '#2C2C2C' : mineColors.cart} strokeWidth="1" />
        
        {/* Mining equipment shed */}
        <rect x={centerX - 55} y={GROUND_Y - 12} width="16" height="12" fill="#8B7355" stroke="#654321" strokeWidth="1" />
        <polygon points={`${centerX - 57},${GROUND_Y - 12} ${centerX - 47},${GROUND_Y - 18} ${centerX - 37},${GROUND_Y - 12}`} 
                 fill="#8B4513" stroke="#654321" strokeWidth="1" />
        <rect x={centerX - 51} y={GROUND_Y - 6} width="6" height="6" fill="#2C1810" />
        
        {/* Biome-specific additions */}
        {nearForest && (
          // Wooden supports stacked
          <>
            <rect x={centerX - 70} y={GROUND_Y - 3} width="8" height="3" fill="#8B4513" />
            <rect x={centerX - 69} y={GROUND_Y - 6} width="6" height="3" fill="#8B4513" />
            <rect x={centerX - 68} y={GROUND_Y - 9} width="4" height="3" fill="#8B4513" />
          </>
        )}
        
        {material === 'salt' && nearOcean && (
          // Salt evaporation ponds hint
          <rect x={centerX + 60} y={GROUND_Y - 2} width="20" height="2" fill="#87CEEB" opacity="0.4" />
        )}
        
        {material === 'diamond' && (
          // Security fence
          <>
            <rect x={centerX - 80} y={GROUND_Y - 15} width="1" height="15" fill="#606060" />
            <rect x={centerX - 60} y={GROUND_Y - 15} width="1" height="15" fill="#606060" />
            <rect x={centerX + 60} y={GROUND_Y - 15} width="1" height="15" fill="#606060" />
            <rect x={centerX + 80} y={GROUND_Y - 15} width="1" height="15" fill="#606060" />
            <rect x={centerX - 80} y={GROUND_Y - 12} width="160" height="1" fill="#606060" />
          </>
        )}
      </g>
    );
  };
  
  // Render miners
  const renderMiners = () => {
    return (
      <g>
        {miners.map((miner, i) => {
          const walkCycle = Math.floor(animationFrame / 8) % 2;
          const legOffset = walkCycle * miner.direction;
          
          return (
            <g key={i} transform={`translate(${miner.x}, ${GROUND_Y + 8})`}>
              {/* Body */}
              <rect x="-2" y="-8" width="4" height="6" fill="#4A4A4A" />
              {/* Head with helmet */}
              <rect x="-1.5" y="-10" width="3" height="2" fill="#FFDBAC" />
              <rect x="-2" y="-11" width="4" height="2" fill={material === 'coal' ? '#1C1C1C' : '#FFD700'} />
              {/* Helmet lamp for modern era */}
              {isModern && <circle cx="0" cy="-11" r="1" fill="#FFFF99" />}
              {/* Legs */}
              <rect x={-1.5 + legOffset} y="-2" width="1" height="4" fill="#2C2C2C" />
              <rect x={0.5 - legOffset} y="-2" width="1" height="4" fill="#2C2C2C" />
              {/* Arms */}
              <rect x="-3" y="-6" width="1" height="3" fill="#FFDBAC" />
              <rect x="2" y="-6" width="1" height="3" fill="#FFDBAC" />
              {/* Carrying ore */}
              {miner.hasOre && (
                <rect x="-4" y="-7" width="3" height="3" fill={mineColors.ore} />
              )}
              {/* Pickaxe */}
              {!miner.hasOre && i === 0 && (
                <>
                  <rect x="2" y="-7" width="1" height="5" fill="#8B4513" />
                  <rect x="2" y="-8" width="3" height="1" fill="#606060" />
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
      {renderMountains()}
      {renderGround()}
      {renderMine()}
      {renderMiners()}
    </svg>
  );
};

export default React.memo(MineColonyBanner);