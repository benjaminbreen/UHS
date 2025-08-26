/**
 * components/QuarryBanner.tsx - Simple pixel-art banner for quarries
 * Following TerrainStructureBanner's approach with deep customization
 */
import React, { useEffect, useState } from 'react';
import { TerrainStructure, ClimateType, Season, TimeOfDay, BiomeType } from '../types';

interface QuarryBannerProps {
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
  isRuined?: boolean;
}

// Fixed ground level - matching TerrainStructureBanner exactly
// --- TOP OF FILE: replace the single `const GROUND_Y = 110;` with this block ---
const HORIZON_SHIFT = 50;         // push horizon down by ~50px (more sky)
const SKY_BASE = 90;
const SKY_HEIGHT = SKY_BASE + HORIZON_SHIFT;
const HORIZON_Y = SKY_HEIGHT;

const GROUND_BASE = 110;
const GROUND_Y = GROUND_BASE + HORIZON_SHIFT;

const PATH_OFFSET = 40;           // tweak 30–100 to taste
const PATH_Y = GROUND_Y + PATH_OFFSET;


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

// Material colors
const MATERIAL_COLORS: Record<string, { primary: string, secondary: string, accent: string }> = {
  limestone: { primary: '#E8E0D5', secondary: '#D4C4B0', accent: '#C0B0A0' },
  marble: { primary: '#F5F5F0', secondary: '#E8E8E0', accent: '#FFD700' },
  granite: { primary: '#A0A0A0', secondary: '#808080', accent: '#606060' },
  sandstone: { primary: '#D2B48C', secondary: '#C19A6B', accent: '#A0826D' },
  slate: { primary: '#708090', secondary: '#2F4F4F', accent: '#1C1C1C' },
  obsidian: { primary: '#1C1C1C', secondary: '#0A0A0A', accent: '#4A0080' },
  clay: { primary: '#CD853F', secondary: '#A0522D', accent: '#8B4513' },
  basalt: { primary: '#3C3C3C', secondary: '#2C2C2C', accent: '#1C1C1C' }
};

const getTimeOfDayCategory = (time: TimeOfDay): 'dawn' | 'day' | 'dusk' | 'night' => {
  switch (time) {
    case 'Dawn': return 'dawn';
    case 'Dusk': return 'dusk';
    case 'Night': return 'night';
    default: return 'day';
  }
};

const QuarryBanner: React.FC<QuarryBannerProps> = ({
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
  isRuined = false
}) => {
  const [animationFrame, setAnimationFrame] = useState(0);
  const [workers, setWorkers] = useState<Array<{ x: number, direction: 1 | -1, speed: number }>>([]);
  
  // Get material type
  const material = Object.keys(structure.mineralDeposits || {})[0]?.toLowerCase() || 'limestone';
  const materialColors = MATERIAL_COLORS[material] || MATERIAL_COLORS.limestone;
  
  // Parse era
  const year = parseInt(era);
  const isMedieval = year < 1500;
  const isAncient = year < 500;
  const isModern = year >= 1900;
  
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
  
  // Initialize workers (none for ruined quarries)
  useEffect(() => {
    if (isRuined) {
      setWorkers([]);
      return;
    }
    const workerCount = 2 + Math.floor(staticRng.range(0, 3));
    const newWorkers = [];
    for (let i = 0; i < workerCount; i++) {
      newWorkers.push({
        x: staticRng.range(100, width - 100),
        direction: staticRng.next() > 0.5 ? 1 : -1 as 1 | -1,
        speed: 0.3 + staticRng.range(0, 0.3)
      });
    }
    setWorkers(newWorkers);
  }, [seed, isRuined]);
  
  // Animation loop (disabled for ruined quarries)
  useEffect(() => {
    if (isRuined) return; // No animation for ruined quarries
    const interval = setInterval(() => {
      setAnimationFrame(prev => prev + 1);
      
      // Update worker positions
      setWorkers(prev => prev.map(worker => {
        let newX = worker.x + (worker.direction * worker.speed);
        let newDirection = worker.direction;
        
        if (newX <= 50 || newX >= width - 50) {
          newDirection = worker.direction === 1 ? -1 : 1;
          newX = worker.x + (newDirection * worker.speed);
        }
        
        return { ...worker, x: newX, direction: newDirection };
      }));
    }, 50);
    
    return () => clearInterval(interval);
  }, [width]);
  
  // Render sky (simplified from TerrainStructureBanner)
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
        <rect x="0" y="0" width={width} height={SKY_HEIGHT} fill="url(#skyGradient)" />
        
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
  
  // Render mountains (exactly like TerrainStructureBanner)
  const renderMountains = () => {
    const mountainLayers = [
      { color: '#8B9DC3', opacity: 0.3, height: 40 },
      { color: '#6B8CAF', opacity: 0.5, height: 35 },
      { color: '#4A6B8A', opacity: 0.7, height: 30 }
    ];
    
    // Add ocean-specific mountains if near ocean
    if (nearOcean) {
      mountainLayers[0].color = '#7BA7BC';
      mountainLayers[1].color = '#5A8A9F';
      mountainLayers[2].color = '#3A6A7F';
    }
    
    // Desert mountains
    if (nearDesert) {
      mountainLayers[0].color = '#D2B48C';
      mountainLayers[1].color = '#C19A6B';
      mountainLayers[2].color = '#A0826D';
    }
    
    return (
      <g>
        {mountainLayers.map((layer, layerIndex) => {
       const points = [];
for (let i = 0; i <= width + 40; i += 40) {
  const baseY = HORIZON_Y - layer.height;
  const peakY = baseY - staticRng.range(5, 15);
  const nextBaseY = HORIZON_Y - layer.height;

  if (i === 0) points.push(`${i - 20},${HORIZON_Y}`);
  points.push(`${i},${baseY}`);
  points.push(`${i + 20},${peakY}`);
  points.push(`${i + 40},${nextBaseY}`);
  if (i >= width) points.push(`${width + 20},${HORIZON_Y}`);
}
          
          return (
            <polygon
              key={layerIndex}
              points={points.join(' ') + ` ${width + 20},${HORIZON_Y} -20,${HORIZON_Y}`}
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
        {/* Extended ground that fills to bottom of banner (like ocean in fishing hut) */}
        <defs>
          <linearGradient id="groundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={palette.ground} stopOpacity="1" />
            <stop offset="50%" stopColor={palette.ground} stopOpacity="0.95" />
            <stop offset="100%" stopColor={palette.accent} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        
        {/* Main ground extending to bottom */}
        <rect x="0" y={GROUND_Y} width={width} height={height - GROUND_Y} fill="url(#groundGradient)" />
        
        {/* Surface texture */}
        {isSnowy && (
          /* Snow drifts */
          Array.from({ length: 8 }, (_, i) => (
            <ellipse
              key={i}
              cx={i * (width / 7) + staticRng.range(-20, 20)}
              cy={GROUND_Y + 5}
              rx={30 + staticRng.range(-10, 10)}
              ry="8"
              fill="#FFFFFF"
              opacity="0.8"
            />
          ))
        )}
        
        {isDesert && (
          /* Desert rocks and cacti */
          <>
            {Array.from({ length: 3 }, (_, i) => (
              <g key={`cactus-${i}`}>
                <rect
                  x={50 + i * 150 + staticRng.range(-20, 20)}
                  y={GROUND_Y - 15}
                  width="4"
                  height="15"
                  fill="#4A7C59"
                />
                <ellipse
                  cx={52 + i * 150 + staticRng.range(-20, 20)}
                  cy={GROUND_Y - 18}
                  rx="6"
                  ry="3"
                  fill="#4A7C59"
                />
              </g>
            ))}
            {Array.from({ length: 5 }, (_, i) => (
              <ellipse
                key={`rock-${i}`}
                cx={i * (width / 4) + staticRng.range(-30, 30)}
                cy={GROUND_Y + 3}
                rx={8 + staticRng.range(-3, 3)}
                ry="4"
                fill="#A0826D"
                opacity="0.7"
              />
            ))}
          </>
        )}
        
        {/* Grass detail if not snow or desert */}
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
        
        {/* Road/path slightly visible */}
       <rect x="0" y={PATH_Y} width={width} height="4" fill="#8B4513" opacity="0.3" />
      </g>
    );
  };

  
  // Render quarry (SIMPLIFIED)
  const renderQuarry = () => {
    const centerX = width / 2;
    
    // Quarry pit - simple stepped rectangles going down
    const pitDepth = material === 'limestone' ? 25 : 20;
    const pitWidth = 120;
    
    return (
      <g>
        {/* Quarry pit - stepped cuts into ground */}
        <rect x={centerX - pitWidth/2} y={GROUND_Y} width={pitWidth} height={5} fill="#000" opacity="0.3" />
        <rect x={centerX - pitWidth/2 + 10} y={GROUND_Y + 5} width={pitWidth - 20} height={5} fill="#000" opacity="0.4" />
        <rect x={centerX - pitWidth/2 + 20} y={GROUND_Y + 10} width={pitWidth - 40} height={5} fill="#000" opacity="0.5" />
        <rect x={centerX - pitWidth/2 + 30} y={GROUND_Y + 15} width={pitWidth - 60} height={5} fill="#000" opacity="0.6" />
        
        {/* Stone blocks extracted */}
        <rect x={centerX - 50} y={GROUND_Y - 8} width="12" height="8" fill={materialColors.primary} stroke={materialColors.secondary} strokeWidth="1" />
        <rect x={centerX - 36} y={GROUND_Y - 8} width="12" height="8" fill={materialColors.primary} stroke={materialColors.secondary} strokeWidth="1" />
        <rect x={centerX - 43} y={GROUND_Y - 16} width="12" height="8" fill={materialColors.primary} stroke={materialColors.secondary} strokeWidth="1" />
        
        {/* Period-specific equipment (not shown if ruined) */}
        {isModern && !isRuined && (
          // Modern: Simple crane
          <>
            <rect x={centerX + 40} y={GROUND_Y - 50} width="4" height="50" fill="#606060" />
            <rect x={centerX + 30} y={GROUND_Y - 50} width="24" height="2" fill="#606060" />
            <rect x={centerX + 50} y={GROUND_Y - 48} width="1" height="20" fill="#404040" />
            <rect x={centerX + 46} y={GROUND_Y - 28} width="8" height="4" fill={materialColors.primary} />
          </>
        )}
        
        {isMedieval && !isRuined && (
          // Medieval: Water wheel for cutting (not shown if ruined)
          <>
            <circle cx={centerX + 50} cy={GROUND_Y - 12} r="12" fill="none" stroke="#8B4513" strokeWidth="2" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
              const rad = (angle + animationFrame * 2) * Math.PI / 180;
              const x1 = centerX + 50;
              const y1 = GROUND_Y - 12;
              const x2 = x1 + Math.cos(rad) * 10;
              const y2 = y1 + Math.sin(rad) * 10;
              return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#654321" strokeWidth="1" />;
            })}
          </>
        )}
        
        {isAncient && (
          // Ancient: Simple wooden scaffold
          <>
            <rect x={centerX - 30} y={GROUND_Y - 20} width="2" height="20" fill="#8B4513" />
            <rect x={centerX - 10} y={GROUND_Y - 20} width="2" height="20" fill="#8B4513" />
            <rect x={centerX - 30} y={GROUND_Y - 20} width="22" height="2" fill="#8B4513" />
          </>
        )}
        
        {/* Small work shelter */}
        <rect x={centerX + 20} y={GROUND_Y - 15} width="20" height="15" fill={isRuined ? "#6B5D54" : "#8B7355"} stroke="#654321" strokeWidth="1" />
        <polygon points={`${centerX + 18},${GROUND_Y - 15} ${centerX + 30},${GROUND_Y - 22} ${centerX + 42},${GROUND_Y - 15}`} 
                 fill={isRuined ? "#6B4F47" : "#8B4513"} stroke="#654321" strokeWidth="1" />
        {/* Door/window - boarded if ruined */}
        {isRuined ? (
          <>
            {/* Boarded door */}
            <rect x={centerX + 26} y={GROUND_Y - 8} width="8" height="8" fill="#4A3C28" />
            <rect x={centerX + 27} y={GROUND_Y - 7} width="6" height="1" fill="#3A2C18" />
            <rect x={centerX + 27} y={GROUND_Y - 5} width="6" height="1" fill="#3A2C18" />
            <rect x={centerX + 27} y={GROUND_Y - 3} width="6" height="1" fill="#3A2C18" />
          </>
        ) : (
          <rect x={centerX + 26} y={GROUND_Y - 8} width="8" height="8" fill="#2C1810" />
        )}
        
        {/* Tools or debris */}
        {isRuined ? (
          <>
            {/* Debris and abandoned materials */}
            <rect x={centerX + 5} y={GROUND_Y - 1} width="8" height="1" fill="#4A3C28" opacity="0.7" />
            <rect x={centerX - 20} y={GROUND_Y - 2} width="5" height="2" fill="#6B5D54" opacity="0.8" />
            <rect x={centerX + 15} y={GROUND_Y - 1} width="3" height="1" fill="#4A3C28" opacity="0.6" />
          </>
        ) : (
          <>
            <rect x={centerX + 5} y={GROUND_Y - 2} width="8" height="1" fill="#606060" />
            <rect x={centerX + 11} y={GROUND_Y - 4} width="2" height="4" fill="#8B4513" />
          </>
        )}
        
        {/* Biome-specific additions */}
        {nearForest && (
          // Trees in background
          <>
            <rect x={centerX - 80} y={GROUND_Y - 25} width="4" height="25" fill="#8B4513" />
            <rect x={centerX - 84} y={GROUND_Y - 35} width="12" height="12" rx="6" fill="#228B22" opacity="0.7" />
            <rect x={centerX + 75} y={GROUND_Y - 20} width="3" height="20" fill="#8B4513" />
            <rect x={centerX + 72} y={GROUND_Y - 28} width="10" height="10" rx="5" fill="#32CD32" opacity="0.6" />
          </>
        )}
        
        {nearOcean && (
          // Hint of water in distance
          <rect x="0" y={GROUND_Y - 30} width={width} height="2" fill="#4A90E2" opacity="0.3" />
        )}
      </g>
    );
  };
  
  // Render workers (simplified)
  const renderWorkers = () => {
    return (
      <g>
        {workers.map((worker, i) => {
          const walkCycle = Math.floor(animationFrame / 8) % 2;
          const legOffset = walkCycle * worker.direction;
          
          return (
            <g key={i} transform={`translate(${worker.x}, ${PATH_Y - 2})`}>
              {/* Body */}
              <rect x="-2" y="-8" width="4" height="6" fill="#8B4513" />
              {/* Head */}
              <rect x="-1.5" y="-10" width="3" height="2" fill="#FFDBAC" />
              {/* Legs */}
              <rect x={-1.5 + legOffset} y="-2" width="1" height="4" fill="#654321" />
              <rect x={0.5 - legOffset} y="-2" width="1" height="4" fill="#654321" />
              {/* Arms */}
              <rect x="-3" y="-6" width="1" height="3" fill="#FFDBAC" />
              <rect x="2" y="-6" width="1" height="3" fill="#FFDBAC" />
              {/* Tool */}
              {i === 0 && <rect x="2" y="-7" width="1" height="4" fill="#606060" />}
            </g>
          );
        })}
      </g>
    );
  };
  
  // Calculate zoomed viewBox for center-focused zoom (matching FishingHutBanner effect)
  const zoomLevel = 1.5; // Fixed zoom for better visibility
  const zoomedWidth = width / zoomLevel;
  const zoomedHeight = height / zoomLevel;
  const zoomOffsetX = (width - zoomedWidth) / 2;
  const zoomOffsetY = (height - zoomedHeight) / 3; // Offset towards top to focus on structures
  
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
      {renderQuarry()}
      {renderWorkers()}
    </svg>
  );
};

export default React.memo(QuarryBanner);