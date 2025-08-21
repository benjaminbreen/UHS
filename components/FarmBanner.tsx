/**
 * components/FarmBanner.tsx - Enhanced farm banner with animated elements and seasonal variations
 */
import React, { useEffect, useState, useMemo } from 'react';
import { HistoricalEra, CulturalZone, ClimateType, Season, TimeOfDay } from '../types';

export type Condition = 'humble' | 'prosperous';
export type CropType = string;

interface FarmBannerProps {
  era: HistoricalEra;
  culturalZone: CulturalZone;
  condition: Condition;
  cropType: CropType;
  climate: ClimateType;
  season: Season;
  seed?: number;
  width?: number;
  height?: number;
  timeOfDay?: TimeOfDay;
  farmName?: string;
  farmerName?: string;
}

// Seasonal color palettes
const SEASONAL_PALETTES = {
  'spring': {
    skyTop: '#87CEEB',
    skyMid: '#98FB98', 
    skyBottom: '#F0E68C',
    ground: '#8B7355',
    crops: '#90EE90',
    accent: '#FFB6C1'
  },
  'summer': {
    skyTop: '#00BFFF',
    skyMid: '#87CEFA',
    skyBottom: '#FFE4B5',
    ground: '#D2691E',
    crops: '#FFD700',
    accent: '#FF8C00'
  },
  'fall': {
    skyTop: '#FF8C69',
    skyMid: '#FFA07A',
    skyBottom: '#F4A460',
    ground: '#8B4513',
    crops: '#DAA520',
    accent: '#FF6347'
  },
  'winter': {
    skyTop: '#B0C4DE',
    skyMid: '#D3D3D3',
    skyBottom: '#E6E6FA',
    ground: '#A9A9A9',
    crops: '#F5F5DC',
    accent: '#4682B4'
  }
};

// Crop growth stages by season
const CROP_STAGES = {
  'spring': 'planting',
  'summer': 'growing',
  'fall': 'harvest',
  'winter': 'fallow'
};

// Animated character for the farm
interface FarmCharacter {
  id: string;
  x: number;
  y: number;
  type: 'farmer' | 'worker' | 'animal' | 'bird';
  direction: 1 | -1;
  speed: number;
}

// Seeded random for consistent generation
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

const FarmBanner: React.FC<FarmBannerProps> = ({
  era,
  culturalZone,
  condition,
  cropType,
  climate,
  season,
  seed = 12345,
  width = 1100,
  height = 180,
  timeOfDay = 'Midday',
  farmName,
  farmerName
}) => {
  const [animationFrame, setAnimationFrame] = useState(0);
  const [characters, setCharacters] = useState<FarmCharacter[]>([]);
  const [weatherParticles, setWeatherParticles] = useState<React.ReactNode[]>([]);
  
  const rng = useMemo(() => new SeededRandom(seed), [seed]);
  const palette = SEASONAL_PALETTES[season];
  const cropStage = CROP_STAGES[season];
  
  // Initialize animated characters
  useEffect(() => {
    const newCharacters: FarmCharacter[] = [];
    
    // Add farmer
    newCharacters.push({
      id: 'farmer',
      x: width * 0.3,
      y: height * 0.65,
      type: 'farmer',
      direction: 1,
      speed: 0.5
    });
    
    // Add workers if prosperous
    if (condition === 'prosperous') {
      for (let i = 0; i < 2; i++) {
        newCharacters.push({
          id: `worker-${i}`,
          x: rng.range(200, width - 200),
          y: height * 0.65 + rng.range(-5, 5),
          type: 'worker',
          direction: rng.next() > 0.5 ? 1 : -1,
          speed: 0.3 + rng.next() * 0.3
        });
      }
    }
    
    // Add farm animals
    const animalCount = condition === 'prosperous' ? 3 : 1;
    for (let i = 0; i < animalCount; i++) {
      newCharacters.push({
        id: `animal-${i}`,
        x: rng.range(100, width - 100),
        y: height * 0.7 + rng.range(-10, 10),
        type: 'animal',
        direction: rng.next() > 0.5 ? 1 : -1,
        speed: 0.2 + rng.next() * 0.2
      });
    }
    
    // Add birds
    for (let i = 0; i < 3; i++) {
      newCharacters.push({
        id: `bird-${i}`,
        x: rng.range(0, width),
        y: rng.range(20, height * 0.3),
        type: 'bird',
        direction: 1,
        speed: 1 + rng.next() * 0.5
      });
    }
    
    setCharacters(newCharacters);
  }, [seed, condition, width, height]);
  
  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame(prev => prev + 1);
      
      setCharacters(prev => prev.map(char => {
        let newX = char.x + (char.direction * char.speed);
        let newDirection = char.direction;
        
        // Bounce or wrap depending on type
        if (char.type === 'bird') {
          if (newX > width + 50) {
            newX = -50;
          }
        } else {
          if (newX <= 50 || newX >= width - 50) {
            newDirection = newDirection === 1 ? -1 : 1;
            newX = char.x + (newDirection * char.speed);
          }
        }
        
        return { ...char, x: newX, direction: newDirection };
      }));
    }, 50);
    
    return () => clearInterval(interval);
  }, [width]);
  
  // Generate weather particles
  useEffect(() => {
    const particles: React.ReactNode[] = [];
    
    if (season === 'winter' && (climate === ClimateType.COLD || climate === ClimateType.TEMPERATE)) {
      // Snow
      for (let i = 0; i < 20; i++) {
        particles.push(
          <circle
            key={`snow-${i}`}
            cx={rng.range(0, width)}
            cy={-10}
            r="2"
            fill="white"
            opacity="0.8"
          >
            <animate
              attributeName="cy"
              from="-10"
              to={height + 10}
              dur={`${3 + rng.next() * 2}s`}
              begin={`${rng.next() * 3}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="cx"
              values={`${rng.range(0, width)};${rng.range(0, width) + 20};${rng.range(0, width)}`}
              dur={`${3 + rng.next() * 2}s`}
              begin={`${rng.next() * 3}s`}
              repeatCount="indefinite"
            />
          </circle>
        );
      }
    } else if (season === 'spring' && rng.next() < 0.3) {
      // Rain
      for (let i = 0; i < 15; i++) {
        const x = rng.range(0, width);
        particles.push(
          <line
            key={`rain-${i}`}
            x1={x}
            y1="-5"
            x2={x - 5}
            y2="5"
            stroke="#6B9BD1"
            strokeWidth="1"
            opacity="0.6"
          >
            <animate
              attributeName="y1"
              from="-5"
              to={height}
              dur={`${0.5 + rng.next() * 0.3}s`}
              begin={`${rng.next() * 2}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="y2"
              from="5"
              to={height + 10}
              dur={`${0.5 + rng.next() * 0.3}s`}
              begin={`${rng.next() * 2}s`}
              repeatCount="indefinite"
            />
          </line>
        );
      }
    }
    
    setWeatherParticles(particles);
  }, [season, climate, seed, width, height]);
  
  // Render crop fields based on stage
  const renderCrops = () => {
    const rows = [];
    const rowCount = 5;
    const startY = height * 0.55;
    
    for (let i = 0; i < rowCount; i++) {
      const y = startY + (i * 8);
      const plantCount = 20 + Math.floor(rng.next() * 10);
      const plants = [];
      
      for (let j = 0; j < plantCount; j++) {
        const x = (width / plantCount) * j + rng.range(-5, 5);
        
        if (cropStage === 'planting') {
          // Small sprouts
          plants.push(
            <circle key={`plant-${i}-${j}`} cx={x} cy={y} r="1" fill="#90EE90" />
          );
        } else if (cropStage === 'growing') {
          // Growing plants
          plants.push(
            <rect key={`plant-${i}-${j}`} x={x - 2} y={y - 4} width="4" height="6" fill={palette.crops} />
          );
        } else if (cropStage === 'harvest') {
          // Ready to harvest
          plants.push(
            <g key={`plant-${i}-${j}`}>
              <rect x={x - 2} y={y - 8} width="4" height="10" fill={palette.crops} />
              <circle cx={x} cy={y - 8} r="2" fill="#FFD700" />
            </g>
          );
        } else {
          // Winter - bare field
          plants.push(
            <line key={`plant-${i}-${j}`} x1={x} y1={y} x2={x} y2={y - 2} stroke="#8B7355" strokeWidth="1" />
          );
        }
      }
      
      rows.push(<g key={`row-${i}`}>{plants}</g>);
    }
    
    return rows;
  };
  
  return (
    <svg width={width} height={height} className="w-full h-full">
      {/* Sky gradient */}
      <defs>
        <linearGradient id={`farmSky-${seed}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={palette.skyTop} />
          <stop offset="50%" stopColor={palette.skyMid} />
          <stop offset="100%" stopColor={palette.skyBottom} />
        </linearGradient>
      </defs>
      
      <rect x="0" y="0" width={width} height={height} fill={`url(#farmSky-${seed})`} />
      
      {/* Sun/Moon */}
      {timeOfDay === 'Night' ? (
        <circle cx={width - 80} cy="30" r="15" fill="#F7FAFC" opacity="0.9" />
      ) : (
        <circle cx={width - 80} cy="30" r="20" fill="#FFD700" opacity="0.8">
          <animate attributeName="opacity" values="0.8;1;0.8" dur="4s" repeatCount="indefinite" />
        </circle>
      )}
      
      {/* Background hills */}
      <ellipse cx={width * 0.2} cy={height * 0.5} rx="150" ry="40" fill="#8B7D6B" opacity="0.3" />
      <ellipse cx={width * 0.8} cy={height * 0.5} rx="120" ry="35" fill="#8B7D6B" opacity="0.25" />
      
      {/* Ground */}
      <rect x="0" y={height * 0.5} width={width} height={height * 0.5} fill={palette.ground} />
      
      {/* Farm buildings */}
      {/* Barn */}
      <g transform={`translate(${width * 0.15}, ${height * 0.35})`}>
        <rect x="0" y="0" width="80" height="60" fill="#8B4513" />
        <polygon points="0,0 40,-25 80,0" fill="#654321" />
        <rect x="30" y="20" width="20" height="30" fill="#4B0000" />
        <rect x="10" y="10" width="15" height="15" fill="#87CEEB" opacity="0.5" />
        <rect x="55" y="10" width="15" height="15" fill="#87CEEB" opacity="0.5" />
      </g>
      
      {/* Farmhouse */}
      {condition === 'prosperous' && (
        <g transform={`translate(${width * 0.7}, ${height * 0.4})`}>
          <rect x="0" y="0" width="60" height="40" fill="#DEB887" />
          <polygon points="0,0 30,-20 60,0" fill="#8B4513" />
          <rect x="20" y="15" width="20" height="25" fill="#654321" />
          <rect x="5" y="5" width="12" height="12" fill="#FFD700" opacity="0.6" />
          <rect x="43" y="5" width="12" height="12" fill="#FFD700" opacity="0.6" />
          {/* Smoke from chimney */}
          <circle cx="45" cy="-15" r="3" fill="#808080" opacity="0.5">
            <animate attributeName="cy" values="-15;-25;-35" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.3;0" dur="3s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
      
      {/* Windmill or well */}
      {era !== HistoricalEra.PREHISTORIC && (
        <g transform={`translate(${width * 0.45}, ${height * 0.3})`}>
          {climate === ClimateType.TEMPERATE || climate === ClimateType.COLD ? (
            // Windmill
            <>
              <rect x="-5" y="0" width="10" height="50" fill="#8B7355" />
              <g transform={`rotate(${animationFrame * 2} 0 0)`}>
                <rect x="-1" y="-25" width="2" height="50" fill="#654321" />
                <rect x="-25" y="-1" width="50" height="2" fill="#654321" />
              </g>
            </>
          ) : (
            // Well
            <>
              <ellipse cx="0" cy="40" rx="15" ry="8" fill="#696969" />
              <rect x="-2" y="0" width="4" height="40" fill="#8B4513" />
              <rect x="-10" y="-5" width="20" height="8" fill="#654321" />
            </>
          )}
        </g>
      )}
      
      {/* Crop fields */}
      <g>{renderCrops()}</g>
      
      {/* Animated characters */}
      {characters.map(char => {
        if (char.type === 'farmer') {
          return (
            <g key={char.id} transform={`translate(${char.x}, ${char.y})`}>
              <ellipse cx="0" cy="0" rx="4" ry="8" fill="#8B4513" />
              <circle cx="0" cy="-8" r="3" fill="#FDBCB4" />
              <rect x="-1" y="-5" width="2" height="8" fill="#4B0082" />
            </g>
          );
        } else if (char.type === 'worker') {
          return (
            <g key={char.id} transform={`translate(${char.x}, ${char.y})`}>
              <ellipse cx="0" cy="0" rx="3" ry="6" fill="#654321" />
              <circle cx="0" cy="-6" r="2" fill="#FDBCB4" />
            </g>
          );
        } else if (char.type === 'animal') {
          return (
            <g key={char.id} transform={`translate(${char.x}, ${char.y})`}>
              <ellipse cx="0" cy="0" rx="6" ry="4" fill="#8B7355" />
              <circle cx={char.direction === 1 ? 4 : -4} cy="-2" r="2" fill="#8B7355" />
            </g>
          );
        } else if (char.type === 'bird') {
          return (
            <g key={char.id} transform={`translate(${char.x}, ${char.y})`}>
              <path d="M0,0 L-3,-2 L0,-1 L3,-2 Z" fill="#000000" />
            </g>
          );
        }
        return null;
      })}
      
      {/* Weather particles */}
      {weatherParticles}
      
      {/* Fence in foreground */}
      {Array.from({ length: Math.floor(width / 40) }, (_, i) => (
        <g key={`fence-${i}`} transform={`translate(${i * 40}, ${height * 0.75})`}>
          <rect x="0" y="0" width="3" height="20" fill="#654321" />
          {i < Math.floor(width / 40) - 1 && (
            <rect x="3" y="5" width="37" height="2" fill="#654321" />
          )}
        </g>
      ))}
    </svg>
  );
};

export default FarmBanner;