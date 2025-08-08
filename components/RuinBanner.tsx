import React, { useEffect, useState, useMemo } from 'react';
import { MapData, Tile, BiomeType } from '../types';

interface RuinBannerProps {
  ruinName: string;
  ruinAge: string;
  tile: Tile;
  mapData: MapData;
  width?: number;
  height?: number;
}

// Simple color utilities  
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

const shadeColor = (color: string, percent: number): string => {
  const rgb = hexToRgb(color);
  return rgbToHex(
    rgb.r + (percent > 0 ? (255 - rgb.r) * percent / 100 : rgb.r * percent / 100),
    rgb.g + (percent > 0 ? (255 - rgb.g) * percent / 100 : rgb.g * percent / 100),
    rgb.b + (percent > 0 ? (255 - rgb.b) * percent / 100 : rgb.b * percent / 100)
  );
};

// Animal characters for the ruin scene
interface RuinAnimal {
  id: string;
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  type: 'dog' | 'rabbit' | 'bird';
  color: string;
}

const RuinBanner: React.FC<RuinBannerProps> = ({
  ruinName,
  ruinAge,
  tile,
  mapData,
  width = 1100,
  height = 180
}) => {
  const [animals, setAnimals] = useState<RuinAnimal[]>([]);

  const biomeColors = useMemo(() => {
    const baseColors: Record<BiomeType, { primary: string; secondary: string; accent: string }> = {
      'GRASSLAND': { primary: '#4a6741', secondary: '#6b8c62', accent: '#8fbc8f' },
      'FOREST': { primary: '#2d5016', secondary: '#4a6741', accent: '#228b22' },
      'DESERT': { primary: '#cd853f', secondary: '#daa520', accent: '#f4a460' },
      'MOUNTAIN': { primary: '#696969', secondary: '#778899', accent: '#a9a9a9' },
      'COASTAL': { primary: '#4682b4', secondary: '#87ceeb', accent: '#e0f6ff' },
      'TUNDRA': { primary: '#d3d3d3', secondary: '#e6e6fa', accent: '#f0f8ff' },
      'SAVANNA': { primary: '#b8860b', secondary: '#daa520', accent: '#ffb347' },
      'SCRUB': { primary: '#8b7355', secondary: '#a0522d', accent: '#d2b48c' },
      'WETLAND': { primary: '#556b2f', secondary: '#6b8e23', accent: '#9acd32' },
      'VOLCANIC': { primary: '#2f4f4f', secondary: '#708090', accent: '#778899' },
      'ESTUARY': { primary: '#4682b4', secondary: '#5f9ea0', accent: '#87ceeb' },
      'REEF': { primary: '#008b8b', secondary: '#20b2aa', accent: '#48d1cc' },
      'SALT_FLATS': { primary: '#f5f5dc', secondary: '#f0f8ff', accent: '#ffffff' },
      'MANGROVE': { primary: '#556b2f', secondary: '#808000', accent: '#9acd32' }
    };
    return baseColors[tile.biome] || baseColors['GRASSLAND'];
  }, [tile.biome]);

  // Initialize animals
  useEffect(() => {
    const seed = tile.x * 31 + tile.y * 17;
    const rng = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    const animalTypes: RuinAnimal['type'][] = ['dog', 'rabbit', 'rabbit', 'bird'];
    const newAnimals: RuinAnimal[] = [];

    // Create 2-4 animals wandering around
    const animalCount = 2 + Math.floor(rng(seed) * 3);
    
    for (let i = 0; i < animalCount; i++) {
      const animalSeed = seed + i * 7;
      const type = animalTypes[Math.floor(rng(animalSeed) * animalTypes.length)];
      
      newAnimals.push({
        id: `animal-${i}`,
        x: 50 + rng(animalSeed + 1) * (width - 200),
        y: height * 0.6 + rng(animalSeed + 2) * (height * 0.2),
        speed: type === 'bird' ? 0.8 : (type === 'rabbit' ? 0.6 : 0.3),
        direction: rng(animalSeed + 3) > 0.5 ? 1 : -1,
        type,
        color: type === 'dog' ? '#8b4513' : type === 'rabbit' ? '#d2b48c' : '#696969'
      });
    }

    setAnimals(newAnimals);
  }, [tile.x, tile.y, width, height]);

  // Animate animals
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimals(prev => prev.map(animal => {
        let newX = animal.x + animal.speed * animal.direction;
        let newDirection = animal.direction;

        // Reverse direction at boundaries
        if (newX <= 50 || newX >= width - 50) {
          newDirection = -newDirection as 1 | -1;
          newX = animal.x + animal.speed * newDirection;
        }

        return {
          ...animal,
          x: newX,
          direction: newDirection
        };
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [width]);

  // Render animal based on type
  const renderAnimal = (animal: RuinAnimal) => {
    const size = animal.type === 'dog' ? 12 : animal.type === 'rabbit' ? 6 : 4;
    
    switch (animal.type) {
      case 'dog':
        return (
          <g key={animal.id}>
            {/* Dog body */}
            <ellipse
              cx={animal.x}
              cy={animal.y}
              rx={size}
              ry={size * 0.6}
              fill={animal.color}
            />
            {/* Dog head */}
            <circle
              cx={animal.x + (animal.direction * size * 0.8)}
              cy={animal.y - 2}
              r={size * 0.5}
              fill={shadeColor(animal.color, 10)}
            />
            {/* Tail */}
            <path
              d={`M ${animal.x - (animal.direction * size)} ${animal.y} Q ${animal.x - (animal.direction * size * 1.5)} ${animal.y - 4} ${animal.x - (animal.direction * size * 1.2)} ${animal.y - 6}`}
              stroke={animal.color}
              strokeWidth="2"
              fill="none"
            />
          </g>
        );
      
      case 'rabbit':
        return (
          <g key={animal.id}>
            {/* Rabbit body */}
            <ellipse
              cx={animal.x}
              cy={animal.y}
              rx={size}
              ry={size * 0.8}
              fill={animal.color}
            />
            {/* Ears */}
            <ellipse
              cx={animal.x + (animal.direction * 2)}
              cy={animal.y - size}
              rx={2}
              ry={size * 0.8}
              fill={shadeColor(animal.color, -10)}
            />
            <ellipse
              cx={animal.x + (animal.direction * 4)}
              cy={animal.y - size}
              rx={2}
              ry={size * 0.8}
              fill={shadeColor(animal.color, -10)}
            />
          </g>
        );
      
      case 'bird':
        return (
          <g key={animal.id}>
            {/* Bird body */}
            <ellipse
              cx={animal.x}
              cy={animal.y}
              rx={size}
              ry={size * 0.5}
              fill={animal.color}
            />
            {/* Wing */}
            <ellipse
              cx={animal.x}
              cy={animal.y}
              rx={size * 1.2}
              ry={size * 0.3}
              fill={shadeColor(animal.color, -15)}
            />
          </g>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full bg-gradient-to-b from-slate-800 to-slate-700 rounded-t-2xl overflow-hidden">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
      >
        {/* Sky gradient */}
        <defs>
          <linearGradient id="ruinSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4a5568" />
            <stop offset="100%" stopColor={biomeColors.secondary} />
          </linearGradient>
          
          {/* Ground gradient */}
          <linearGradient id="ruinGround" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={biomeColors.primary} />
            <stop offset="100%" stopColor={shadeColor(biomeColors.primary, -20)} />
          </linearGradient>
        </defs>
        
        {/* Sky */}
        <rect width={width} height={height * 0.6} fill="url(#ruinSky)" />
        
        {/* Ground */}
        <rect y={height * 0.6} width={width} height={height * 0.4} fill="url(#ruinGround)" />
        
        {/* Ruin structures */}
        <g>
          {/* Main ruin structure - broken walls */}
          <rect x={width * 0.2} y={height * 0.3} width={40} height={height * 0.3} fill="#8b7355" />
          <rect x={width * 0.25} y={height * 0.25} width={30} height={height * 0.35} fill="#696969" />
          
          {/* Broken pillar */}
          <rect x={width * 0.4} y={height * 0.4} width={15} height={height * 0.2} fill="#a0522d" />
          <rect x={width * 0.42} y={height * 0.35} width={11} height={height * 0.05} fill="#8b7355" />
          
          {/* Collapsed section */}
          <polygon
            points={`${width * 0.5},${height * 0.6} ${width * 0.6},${height * 0.45} ${width * 0.65},${height * 0.5} ${width * 0.7},${height * 0.6}`}
            fill="#8b7355"
          />
          
          {/* Rubble and debris */}
          <circle cx={width * 0.15} cy={height * 0.65} r={8} fill="#696969" />
          <circle cx={width * 0.18} cy={height * 0.62} r={6} fill="#8b7355" />
          <circle cx={width * 0.75} cy={height * 0.68} r={10} fill="#a0522d" />
          <circle cx={width * 0.8} cy={height * 0.65} r={7} fill="#696969" />
          
          {/* Overgrown vegetation */}
          {tile.biome === 'FOREST' && (
            <>
              <ellipse cx={width * 0.3} cy={height * 0.5} rx={20} ry={25} fill="#228b22" opacity={0.7} />
              <ellipse cx={width * 0.6} cy={height * 0.55} rx={15} ry={20} fill="#32cd32" opacity={0.6} />
            </>
          )}
        </g>
        
        {/* Animals */}
        {animals.map(renderAnimal)}
        
        {/* Weather effects based on biome */}
        {tile.biome === 'DESERT' && (
          <g opacity={0.3}>
            {/* Sand particles */}
            <circle cx={width * 0.1} cy={height * 0.2} r={1} fill="#daa520" />
            <circle cx={width * 0.3} cy={height * 0.15} r={1} fill="#daa520" />
            <circle cx={width * 0.7} cy={height * 0.25} r={1} fill="#daa520" />
          </g>
        )}
      </svg>
      
      {/* Text overlay */}
      <div className="absolute inset-0 flex flex-col justify-center items-center text-center">
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
          {ruinName}
        </h1>
        <p className="text-lg text-slate-300 drop-shadow-md">
          {ruinAge} • {tile.biome.toLowerCase().replace('_', ' ')} ruins
        </p>
      </div>
    </div>
  );
};

export default RuinBanner;