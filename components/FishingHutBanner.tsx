/**
 * components/FishingHutBanner.tsx - Animated pixel-art banner for fishing huts
 * Features animated ocean waves, climate-specific water, and marine life
 */
import React, { useEffect, useState } from 'react';
import { TerrainStructure, ClimateType, Season, TimeOfDay, BiomeType } from '../types';

interface FishingHutBannerProps {
  structure?: TerrainStructure;
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

// Fixed ground level - but ocean will be in foreground
const GROUND_Y = 110;
const WATER_Y = GROUND_Y + 15; // Ocean starts below ground level

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

// Climate-specific ocean colors
const OCEAN_COLORS: Record<string, { shallow: string, deep: string, foam: string }> = {
  [ClimateType.COLD]: { 
    shallow: '#5A7A8C', 
    deep: '#2C4A5C', 
    foam: '#E8F4F8' 
  },
  [ClimateType.TEMPERATE]: { 
    shallow: '#4A90E2', 
    deep: '#2E5A8E', 
    foam: '#F0F8FF' 
  },
  [ClimateType.ARID]: { 
    shallow: '#6BA3D0', 
    deep: '#4A7A9C', 
    foam: '#FFF8E7' 
  },
  [ClimateType.SEMITROPICAL]: { 
    shallow: '#40E0D0', 
    deep: '#20B2AA', 
    foam: '#F0FFFF' 
  },
  [ClimateType.TROPICAL]: { 
    shallow: '#00CED1', 
    deep: '#008B8B', 
    foam: '#F0FFFF' 
  },
  [ClimateType.MEDITERRANEAN]: { 
    shallow: '#4682B4', 
    deep: '#1E5A8E', 
    foam: '#F5F5DC' 
  }
};

// Fish for tropical waters
interface Fish {
  x: number;
  y: number;
  speed: number;
  color: string;
  size: number;
  direction: 1 | -1;
}

// Ice floe for cold waters
interface IceFloe {
  x: number;
  size: number;
  drift: number;
}

const getTimeOfDayCategory = (time: TimeOfDay): 'dawn' | 'day' | 'dusk' | 'night' => {
  switch (time) {
    case 'Dawn': return 'dawn';
    case 'Dusk': return 'dusk';
    case 'Night': return 'night';
    default: return 'day';
  }
};

const FishingHutBanner: React.FC<FishingHutBannerProps> = ({
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
  const [waveOffset, setWaveOffset] = useState(0);
  const [fish, setFish] = useState<Fish[]>([]);
  const [iceFloes, setIceFloes] = useState<IceFloe[]>([]);
  const [boatX, setBoatX] = useState(0);
  const [fishermenPos, setFishermenPos] = useState<Array<{ x: number, casting: boolean }>>([]);
  
  // Parse era
  const year = parseInt(era);
  const isAncient = year < 500;
  const isMedieval = year < 1500;
  const isModern = year >= 1900;
  
  // Check climate
  const isTropical = climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL;
  const isCold = climate === ClimateType.COLD || season === 'winter';
  const isMediterranean = climate === ClimateType.MEDITERRANEAN;
  
  // Initialize random generators
  const rng = new SeededRandom(seed + (structure?.location[0] || 0) * 1000);
  const staticRng = new SeededRandom(seed + 9999);
  
  // Get colors
  const todCategory = getTimeOfDayCategory(timeOfDay);
  const skyGradient = SKY_COLORS[todCategory];
  const oceanColors = OCEAN_COLORS[climate];
  
  // Initialize fish for tropical waters
  useEffect(() => {
    if (isTropical) {
      const fishCount = 3 + Math.floor(staticRng.range(0, 4));
      const newFish: Fish[] = [];
      const fishColors = ['#FFD700', '#FF69B4', '#00FFFF', '#FFA500', '#9370DB'];
      
      for (let i = 0; i < fishCount; i++) {
        newFish.push({
          x: staticRng.range(0, width),
          y: WATER_Y + 10 + staticRng.range(0, 25),
          speed: 0.5 + staticRng.range(0, 1),
          color: fishColors[i % fishColors.length],
          size: 2 + staticRng.range(0, 2),
          direction: staticRng.next() > 0.5 ? 1 : -1
        });
      }
      setFish(newFish);
    }
    
    // Initialize ice floes for cold climates
    if (isCold) {
      const floeCount = 2 + Math.floor(staticRng.range(0, 3));
      const newFloes: IceFloe[] = [];
      
      for (let i = 0; i < floeCount; i++) {
        newFloes.push({
          x: staticRng.range(0, width),
          size: 20 + staticRng.range(0, 30),
          drift: 0.1 + staticRng.range(0, 0.2)
        });
      }
      setIceFloes(newFloes);
    }
    
    // Initialize fishermen
    const fisherCount = 1 + Math.floor(staticRng.range(0, 2));
    const newFishermen = [];
    for (let i = 0; i < fisherCount; i++) {
      newFishermen.push({
        x: staticRng.range(width * 0.3, width * 0.7),
        casting: false
      });
    }
    setFishermenPos(newFishermen);
  }, [seed, climate, season]);
  
  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame(prev => prev + 1);
      setWaveOffset(prev => (prev + 0.5) % 40);
      setBoatX(prev => Math.sin(prev * 0.02) * 10);
      
      // Update fish positions
      if (isTropical) {
        setFish(prev => prev.map(f => {
          let newX = f.x + (f.direction * f.speed);
          let newDirection = f.direction;
          
          if (newX <= -20 || newX >= width + 20) {
            newDirection = f.direction === 1 ? -1 : 1;
            newX = f.x + (newDirection * f.speed);
          }
          
          return { ...f, x: newX, direction: newDirection };
        }));
      }
      
      // Update ice floe positions
      if (isCold) {
        setIceFloes(prev => prev.map(floe => ({
          ...floe,
          x: (floe.x + floe.drift) % (width + 100) - 50
        })));
      }
      
      // Update fishermen casting animation
      setFishermenPos(prev => prev.map((f, i) => ({
        ...f,
        casting: animationFrame % 60 === i * 20
      })));
    }, 50);
    
    return () => clearInterval(interval);
  }, [width, isTropical, isCold]);
  
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
        
        {/* Seabirds */}
        {todCategory !== 'night' && (
          <>
            {[0, 1, 2].map(i => {
              const birdX = (animationFrame * (0.3 + i * 0.1) + i * 100) % (width + 100) - 50;
              const birdY = 30 + Math.sin((animationFrame + i * 30) * 0.05) * 10;
              return (
                <g key={i} transform={`translate(${birdX}, ${birdY})`}>
                  <path d="M -3 0 Q 0 -2 3 0" stroke="#1C1C1C" strokeWidth="0.5" fill="none" />
                </g>
              );
            })}
          </>
        )}
        
        {/* Clouds */}
        {[0, 1, 2].map((i) => {
          const cloudX = -100 + cloudOffset + i * 200;
          const cloudY = 20 + staticRng.range(-5, 10);
          return (
            <g key={i} opacity="0.7">
              <rect x={cloudX} y={cloudY} width="16" height="8" rx="4" fill="#F1F5F9" />
              <rect x={cloudX + 8} y={cloudY - 2} width="20" height="8" rx="4" fill="#F1F5F9" />
            </g>
          );
        })}
      </g>
    );
  };
  
  // Render distant land/horizon
  const renderHorizon = () => {
    return (
      <g>
        {/* Distant mountains or islands */}
        <polygon 
          points={`0,90 ${width * 0.1},85 ${width * 0.2},88 ${width * 0.3},86 ${width * 0.4},90 ${width},90`}
          fill="#B8C5D6"
          opacity="0.3"
        />
      </g>
    );
  };
  
  // Render beach/shoreline
  const renderShoreline = () => {
    return (
      <g>
        {/* Sandy beach or rocky shore */}
        <rect x="0" y={GROUND_Y} width={width} height="15" fill={isCold ? '#8B8682' : '#F4E4C1'} />
        
        {/* Beach details */}
        {!isCold && Array.from({ length: 20 }, (_, i) => (
          <circle
            key={i}
            cx={i * 30 + staticRng.range(-10, 10)}
            cy={GROUND_Y + staticRng.range(2, 12)}
            r="1"
            fill="#D2B48C"
            opacity="0.5"
          />
        ))}
        
        {/* Rocky shore for cold climates */}
        {isCold && Array.from({ length: 10 }, (_, i) => (
          <rect
            key={i}
            x={i * 60 + staticRng.range(-20, 20)}
            y={GROUND_Y + staticRng.range(0, 10)}
            width={staticRng.range(5, 15)}
            height={staticRng.range(3, 8)}
            fill="#696969"
          />
        ))}
      </g>
    );
  };
  
  // Render fishing hut
  const renderFishingHut = () => {
    const centerX = width / 2;
    
    // Determine hut style based on culture and era
    const hutStyle = culturalZone?.includes('asia') ? 'stilt' : 
                     culturalZone?.includes('pacific') ? 'thatched' :
                     isCold ? 'log' : 'wooden';
    
    return (
      <g>
        {/* Pier/dock extending into water */}
        <rect x={centerX - 80} y={GROUND_Y + 5} width="160" height="3" fill="#8B4513" />
        {/* Pier posts */}
        {[-70, -35, 0, 35, 70].map(offset => (
          <rect key={offset} x={centerX + offset - 1} y={GROUND_Y + 5} width="2" height="20" fill="#654321" />
        ))}
        
        {hutStyle === 'stilt' && (
          // Asian stilt house
          <>
            {/* Stilts */}
            <rect x={centerX - 25} y={GROUND_Y - 15} width="3" height="25" fill="#8B4513" />
            <rect x={centerX - 10} y={GROUND_Y - 15} width="3" height="25" fill="#8B4513" />
            <rect x={centerX + 7} y={GROUND_Y - 15} width="3" height="25" fill="#8B4513" />
            <rect x={centerX + 22} y={GROUND_Y - 15} width="3" height="25" fill="#8B4513" />
            
            {/* Platform */}
            <rect x={centerX - 28} y={GROUND_Y - 15} width="56" height="3" fill="#A0826D" />
            
            {/* House */}
            <rect x={centerX - 20} y={GROUND_Y - 30} width="40" height="15" fill="#D2B48C" stroke="#A0826D" strokeWidth="1" />
            
            {/* Sloped roof */}
            <polygon points={`${centerX - 23},${GROUND_Y - 30} ${centerX},${GROUND_Y - 38} ${centerX + 23},${GROUND_Y - 30}`}
                     fill="#8B4513" stroke="#654321" strokeWidth="1" />
          </>
        )}
        
        {hutStyle === 'thatched' && (
          // Pacific thatched hut
          <>
            <rect x={centerX - 18} y={GROUND_Y - 20} width="36" height="20" fill="#D2B48C" stroke="#A0826D" strokeWidth="1" />
            <ellipse cx={centerX} cy={GROUND_Y - 20} rx="20" ry="8" fill="#B8860B" stroke="#8B6508" strokeWidth="1" />
            <rect x={centerX - 4} y={GROUND_Y - 10} width="8" height="10" fill="#654321" />
          </>
        )}
        
        {hutStyle === 'log' && (
          // Cold climate log cabin
          <>
            {/* Log walls */}
            {[0, 4, 8, 12, 16].map(offset => (
              <rect key={offset} x={centerX - 20} y={GROUND_Y - 20 + offset} width="40" height="3" fill="#8B4513" stroke="#654321" strokeWidth="0.5" />
            ))}
            
            {/* Roof */}
            <polygon points={`${centerX - 23},${GROUND_Y - 20} ${centerX},${GROUND_Y - 30} ${centerX + 23},${GROUND_Y - 20}`}
                     fill="#696969" stroke="#4A4A4A" strokeWidth="1" />
            
            {/* Chimney with smoke */}
            <rect x={centerX + 12} y={GROUND_Y - 28} width="6" height="10" fill="#808080" />
            <circle cx={centerX + 15} cy={GROUND_Y - 30 - (animationFrame % 20) * 0.5} r="2" fill="#808080" opacity="0.4" />
            <circle cx={centerX + 15} cy={GROUND_Y - 33 - (animationFrame % 20) * 0.5} r="3" fill="#808080" opacity="0.3" />
          </>
        )}
        
        {hutStyle === 'wooden' && (
          // Standard wooden shack
          <>
            <rect x={centerX - 20} y={GROUND_Y - 25} width="40" height="25" fill="#A0826D" stroke="#8B4513" strokeWidth="1" />
            <polygon points={`${centerX - 22},${GROUND_Y - 25} ${centerX},${GROUND_Y - 35} ${centerX + 22},${GROUND_Y - 25}`}
                     fill="#8B4513" stroke="#654321" strokeWidth="1" />
            <rect x={centerX - 4} y={GROUND_Y - 12} width="8" height="12" fill="#654321" />
            <rect x={centerX - 14} y={GROUND_Y - 18} width="6" height="6" fill="#87CEEB" opacity="0.6" />
            <rect x={centerX + 8} y={GROUND_Y - 18} width="6" height="6" fill="#87CEEB" opacity="0.6" />
          </>
        )}
        
        {/* Fishing nets hanging to dry */}
        <g opacity="0.6">
          <path d={`M ${centerX - 35} ${GROUND_Y - 10} Q ${centerX - 30} ${GROUND_Y - 5} ${centerX - 25} ${GROUND_Y - 10}`}
                stroke="#8B7355" strokeWidth="0.5" fill="none" />
          {[0, 2, 4, 6, 8].map(i => (
            <line key={i} x1={centerX - 35 + i * 1.2} y1={GROUND_Y - 10 + i * 0.5} 
                  x2={centerX - 35 + i * 1.2} y2={GROUND_Y - 5 + i * 0.3}
                  stroke="#8B7355" strokeWidth="0.3" />
          ))}
        </g>
        
        {/* Fish drying rack */}
        <rect x={centerX + 30} y={GROUND_Y - 8} width="20" height="1" fill="#8B4513" />
        <rect x={centerX + 33} y={GROUND_Y - 8} width="1" height="8" fill="#654321" />
        <rect x={centerX + 46} y={GROUND_Y - 8} width="1" height="8" fill="#654321" />
        {/* Hanging fish */}
        {[0, 1, 2].map(i => (
          <ellipse key={i} cx={centerX + 36 + i * 4} cy={GROUND_Y - 6} rx="1.5" ry="3" fill="#C0C0C0" stroke="#808080" strokeWidth="0.5" />
        ))}
        
        {/* Barrels and crates */}
        <rect x={centerX - 45} y={GROUND_Y - 5} width="6" height="5" fill="#8B4513" stroke="#654321" strokeWidth="0.5" />
        <ellipse cx={centerX - 42} cy={GROUND_Y - 5} rx="3" ry="1" fill="#A0826D" />
      </g>
    );
  };
  
  // Render animated ocean waves
  const renderOcean = () => {
    return (
      <g>
        {/* Ocean layers with animated waves */}
        <defs>
          <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={oceanColors.shallow} stopOpacity="0.8" />
            <stop offset="100%" stopColor={oceanColors.deep} stopOpacity="0.95" />
          </linearGradient>
        </defs>
        
        {/* Main ocean body */}
        <rect x="0" y={WATER_Y} width={width} height={height - WATER_Y} fill="url(#oceanGradient)" />
        
        {/* Animated wave layers */}
        {[0, 1, 2].map(layer => {
          const waveY = WATER_Y + layer * 8;
          const wavePhase = waveOffset + layer * 15;
          const waveHeight = 4 - layer;
          
          return (
            <g key={layer} opacity={0.9 - layer * 0.2}>
              <path
                d={`M 0 ${waveY} ${Array.from({ length: 20 }, (_, i) => {
                  const x = i * (width / 19);
                  const y = waveY + Math.sin((x + wavePhase) * 0.02) * waveHeight;
                  return `Q ${x - 15} ${y - waveHeight} ${x} ${y}`;
                }).join(' ')} L ${width} ${height} L 0 ${height} Z`}
                fill={layer === 0 ? oceanColors.shallow : oceanColors.deep}
              />
            </g>
          );
        })}
        
        {/* Wave foam/caps */}
        {Array.from({ length: 5 }, (_, i) => {
          const foamX = (waveOffset * 2 + i * 100) % width;
          const foamY = WATER_Y + Math.sin((foamX + waveOffset) * 0.02) * 3;
          
          return (
            <ellipse
              key={i}
              cx={foamX}
              cy={foamY}
              rx="15"
              ry="2"
              fill={oceanColors.foam}
              opacity="0.7"
            />
          );
        })}
        
        {/* Tropical fish */}
        {isTropical && fish.map((f, i) => (
          <g key={i} transform={`translate(${f.x}, ${f.y})`}>
            <ellipse cx="0" cy="0" rx={f.size} ry={f.size * 0.6} fill={f.color} />
            <polygon points={`${f.direction * f.size} 0, ${f.direction * (f.size + 2)} -1, ${f.direction * (f.size + 2)} 1`} fill={f.color} />
            <circle cx={f.direction * -f.size * 0.3} cy="-0.5" r="0.5" fill="#000" />
          </g>
        ))}
        
        {/* Ice floes for cold climates */}
        {isCold && iceFloes.map((floe, i) => (
          <g key={i}>
            <rect x={floe.x} y={WATER_Y - 5} width={floe.size} height="8" rx="2" fill="#E0F7FF" stroke="#B0E0FF" strokeWidth="1" />
            <rect x={floe.x + 2} y={WATER_Y - 3} width={floe.size - 4} height="2" fill="#F0FFFF" opacity="0.8" />
          </g>
        ))}
        
        {/* Seaweed for temperate climates */}
        {climate === ClimateType.TEMPERATE && (
          <>
            {[0, 1, 2].map(i => {
              const seaweedX = 50 + i * 150;
              return (
                <g key={i} opacity="0.6">
                  <path
                    d={`M ${seaweedX} ${height} Q ${seaweedX + Math.sin(animationFrame * 0.05 + i) * 5} ${height - 20} ${seaweedX + Math.sin(animationFrame * 0.05 + i + 1) * 8} ${height - 35}`}
                    stroke="#2E8B57"
                    strokeWidth="3"
                    fill="none"
                  />
                </g>
              );
            })}
          </>
        )}
        
        {/* Coral for tropical waters */}
        {isTropical && (
          <>
            {[0, 1].map(i => {
              const coralX = 100 + i * 200;
              return (
                <g key={i} opacity="0.7">
                  <circle cx={coralX} cy={height - 10} r="8" fill="#FF6B6B" />
                  <circle cx={coralX - 5} cy={height - 8} r="6" fill="#FFB6C1" />
                  <circle cx={coralX + 6} cy={height - 12} r="5" fill="#FF69B4" />
                </g>
              );
            })}
          </>
        )}
      </g>
    );
  };
  
  // Render fishing boat
  const renderBoat = () => {
    const boatCenterX = width * 0.7 + boatX;
    
    return (
      <g transform={`translate(${boatCenterX}, ${WATER_Y - 5})`}>
        {/* Hull */}
        <path d="M -15 5 Q -15 8 -10 10 L 10 10 Q 15 8 15 5 Z" fill="#8B4513" stroke="#654321" strokeWidth="1" />
        
        {/* Mast and sail */}
        {!isModern && (
          <>
            <rect x="-0.5" y="-15" width="1" height="20" fill="#654321" />
            <polygon points="-8,-12 8,-8 8,0 -8,-4" fill="#F5F5DC" stroke="#D2B48C" strokeWidth="0.5" opacity="0.9" />
          </>
        )}
        
        {/* Motor for modern era */}
        {isModern && (
          <rect x="8" y="6" width="5" height="4" fill="#606060" stroke="#404040" strokeWidth="0.5" />
        )}
        
        {/* Fisherman in boat */}
        <g transform="translate(0, 2)">
          <rect x="-1.5" y="-5" width="3" height="4" fill="#8B4513" />
          <circle cx="0" cy="-6" r="1.5" fill="#FFDBAC" />
          <rect x="-2" y="-7" width="4" height="1" fill="#4A4A4A" />
          {/* Fishing rod */}
          <line x1="2" y1="-4" x2="6" y2="-8" stroke="#654321" strokeWidth="0.5" />
          <line x1="6" y1="-8" x2="6" y2={Math.sin(animationFrame * 0.1) * 2} stroke="#F5F5F5" strokeWidth="0.3" />
        </g>
      </g>
    );
  };
  
  // Render fishermen on pier
  const renderFishermen = () => {
    return (
      <g>
        {fishermenPos.map((fisherman, i) => (
          <g key={i} transform={`translate(${fisherman.x}, ${GROUND_Y + 7})`}>
            {/* Body */}
            <rect x="-2" y="-8" width="4" height="6" fill="#556B2F" />
            {/* Head */}
            <rect x="-1.5" y="-10" width="3" height="2" fill="#FFDBAC" />
            {/* Hat */}
            <rect x="-2.5" y="-11" width="5" height="1" fill="#8B4513" />
            <rect x="-1.5" y="-12" width="3" height="1" fill="#8B4513" />
            {/* Legs */}
            <rect x="-1.5" y="-2" width="1" height="4" fill="#654321" />
            <rect x="0.5" y="-2" width="1" height="4" fill="#654321" />
            {/* Fishing rod */}
            <rect x="2" y="-7" width="8" height="0.5" fill="#8B4513" />
            {/* Fishing line */}
            <line x1="10" y1="-7" x2="10" y2={fisherman.casting ? "5" : "10"} stroke="#F5F5F5" strokeWidth="0.3" />
            {/* Bucket */}
            <rect x="-4" y="-1" width="2" height="2" fill="#606060" />
          </g>
        ))}
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
      {renderHorizon()}
      {renderShoreline()}
      {renderFishingHut()}
      {renderFishermen()}
      {renderOcean()}
      {renderBoat()}
    </svg>
  );
};

export default React.memo(FishingHutBanner);