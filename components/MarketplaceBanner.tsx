import React, { useEffect, useState, useMemo } from 'react';
import { MapData, TerrainStructure, BiomeType, Season, ItemCategory, TimeOfDay } from '../types';
import { ITEM_DEFINITIONS } from '../constants/index';
import { STRUCTURE_BLUEPRINTS } from '../constants/index';
import { calculatePrices } from '../services/economyService';

export type Condition = 'humble' | 'prosperous';

interface MarketplaceBannerProps {
  width?: number;
  height?: number;
  era?: string;
  culturalZone?: string;
  condition?: Condition;
  climate?: string;
  season?: string;
  timeOfDay?: TimeOfDay;
  seed?: number;
  mapData: MapData;
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

// Simplified character type
interface MarketCharacter {
  id: string;
  x: number;
  baseY: number;
  speed: number;
  direction: 1 | -1;
  type: 'villager' | 'merchant' | 'child';
  color: string;
}

const MarketplaceBanner: React.FC<MarketplaceBannerProps> = ({
  width = 1100,
  height = 180,
  era = 'medieval',
  culturalZone = 'european',
  condition = 'humble',
  climate = 'temperate',
  season = 'spring',
  timeOfDay = 'midday',
  seed = 12345,
  mapData
}) => {
  
  const [animationFrame, setAnimationFrame] = useState(0);
  const [characters, setCharacters] = useState<MarketCharacter[]>([]);
  
  // Seeded random
  const seededRandom = useMemo(() => {
    let currentSeed = seed;
    return () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
  }, [seed]);

  // Climate and time-based color palettes
  const palette = useMemo(() => {
    const climates = {
      temperate: {
        ground: '#7A6A4E',
        grass: '#6B8E23',
        mountain: '#8B7D6B',
        tree: '#228B22'
      },
      arid: {
        ground: '#C19A6B',
        grass: '#BDB76B',
        mountain: '#CD853F',
        tree: '#8B7355'
      },
      tropical: {
        ground: '#8B6914',
        grass: '#32CD32',
        mountain: '#696969',
        tree: '#228B22'
      },
      cold: {
        ground: '#A0A0A0',
        grass: '#4F7942',
        mountain: '#778899',
        tree: '#2F4F4F'
      }
    };

    const times = {
      dawn: {
        skyTop: '#FFB6C1',
        skyMid: '#E6B8D1',
        skyBottom: '#FFA07A',
        sunColor: '#FF6347',
        lightIntensity: 0.6,
        shadowIntensity: 0.3
      },
      morning: {
        skyTop: '#87CEEB',
        skyMid: '#ADD8E6',
        skyBottom: '#F0E68C',
        sunColor: '#FFD700',
        lightIntensity: 0.8,
        shadowIntensity: 0.2
      },
      midday: {
        skyTop: '#00BFFF',
        skyMid: '#87CEFA',
        skyBottom: '#B0E0E6',
        sunColor: '#FFFF00',
        lightIntensity: 1.0,
        shadowIntensity: 0.15
      },
      afternoon: {
        skyTop: '#4682B4',
        skyMid: '#87CEEB',
        skyBottom: '#FFE4B5',
        sunColor: '#FFA500',
        lightIntensity: 0.9,
        shadowIntensity: 0.2
      },
      dusk: {
        skyTop: '#4B0082',
        skyMid: '#8B4789',
        skyBottom: '#FF8C00',
        sunColor: '#FF4500',
        lightIntensity: 0.5,
        shadowIntensity: 0.4
      },
      night: {
        skyTop: '#191970',
        skyMid: '#2F4F8F',
        skyBottom: '#483D8B',
        sunColor: '#F8F8FF',
        lightIntensity: 0.3,
        shadowIntensity: 0.6
      }
    };

    return {
      ...climates[climate as keyof typeof climates] || climates.temperate,
      ...times[timeOfDay] || times.midday
    };
  }, [climate, timeOfDay]);

  // Cultural architecture styles (simplified)
  const archStyle = useMemo(() => {
    const styles = {
      medieval: {
        european: {
          roof: '#8B4513', wall: '#D2B48C', detail: '#654321',
          roofShape: 'triangular', decoration: 'timber'
        },
        asian: {
          roof: '#8B0000', wall: '#F5DEB3', detail: '#FFD700',
          roofShape: 'curved', decoration: 'lanterns'
        },
        middle_eastern: {
          roof: '#DAA520', wall: '#F0E68C', detail: '#CD853F',
          roofShape: 'dome', decoration: 'arches'
        }
      },
      renaissance: {
        european: {
          roof: '#A52A2A', wall: '#FAEBD7', detail: '#D2691E',
          roofShape: 'triangular', decoration: 'columns'
        },
        asian: {
          roof: '#DC143C', wall: '#FFF8DC', detail: '#FF6347',
          roofShape: 'pagoda', decoration: 'screens'
        },
        middle_eastern: {
          roof: '#4169E1', wall: '#F0F8FF', detail: '#1E90FF',
          roofShape: 'onion', decoration: 'tiles'
        }
      },
      industrial: {
        european: {
          roof: '#696969', wall: '#D3D3D3', detail: '#2F4F4F',
          roofShape: 'flat', decoration: 'brick'
        },
        asian: {
          roof: '#708090', wall: '#DCDCDC', detail: '#778899',
          roofShape: 'modern', decoration: 'signs'
        },
        middle_eastern: {
          roof: '#A9A9A9', wall: '#F5F5F5', detail: '#808080',
          roofShape: 'flat', decoration: 'modern'
        }
      }
    };
    
    const eraStyles = styles[era as keyof typeof styles] || styles.medieval;
    return eraStyles[culturalZone as keyof typeof eraStyles] || eraStyles.european;
  }, [era, culturalZone]);

  // Generate simple background mountains/hills
  const backgroundElements = useMemo(() => {
    const elements = [];
    const rand = seededRandom;
    
    // Distant mountains
    for (let i = 0; i < 3; i++) {
      elements.push({
        type: 'mountain',
        x: i * width / 3 + rand() * 100 - 50,
        height: 40 + rand() * 30,
        color: palette.mountain
      });
    }
    
    // Trees
    for (let i = 0; i < 5; i++) {
      elements.push({
        type: 'tree',
        x: 100 + i * 200 + rand() * 50,
        y: height * 0.55,
        size: 15 + rand() * 10
      });
    }
    
    return elements;
  }, [seed, width, height, palette]);

  // Generate market stalls (static)
  const marketStalls = useMemo(() => {
    const stalls = [];
    const numStalls = condition === 'prosperous' ? 5 : 3;
    const rand = seededRandom;
    
    // Get goods from nearby structures with proper null checking
    const nearbyGoods: string[] = [];
    if (mapData?.terrainStructures) {
      mapData.terrainStructures.forEach(structure => {
        if (structure.outputGoods) {
          nearbyGoods.push(...structure.outputGoods);
        }
      });
    }
    
    // Fallback goods if no structures found
    if (nearbyGoods.length === 0) {
      nearbyGoods.push('BREAD', 'VEGETABLES', 'TOOLS');
    }
    
    const stallWidth = 80;
    const spacing = (width - 200) / numStalls;
    
    const categoryColors: Record<ItemCategory, string> = {
        'Tool': '#a1a1aa',
        'Weapon': '#ef4444',
        'Material': '#ca8a04',
        'Apparel': '#3b82f6',
        'Food': '#22c55e',
        'Special': '#a855f7',
        'Document': '#f5f5f4',
        'Consumable': '#ec4899',
    };

    for (let i = 0; i < numStalls; i++) {
      const goodId = nearbyGoods[i % nearbyGoods.length];
      const itemDef = ITEM_DEFINITIONS[goodId];
      const color = itemDef ? categoryColors[itemDef.category] : '#DEB887';
      
      stalls.push({
        id: i,
        x: 100 + i * spacing,
        y: height * 0.6,
        width: stallWidth,
        height: 50,
        goodId,
        color: color,
        awningStripes: culturalZone === 'european' ? 'red-white' : 
                       culturalZone === 'asian' ? 'red-gold' : 'blue-white'
      });
    }
    
    return stalls;
  }, [seed, width, height, condition, mapData, culturalZone]);

  // Initialize characters
  useEffect(() => {
    const rand = seededRandom;
    const newCharacters: MarketCharacter[] = [];
    const count = condition === 'prosperous' ? 12 : 6;
    
    const colors = {
      villager: ['#8B4513', '#A0522D', '#D2691E'],
      merchant: ['#4B0082', '#8B0000', '#006400'],
      child: ['#FF6347', '#4682B4', '#32CD32']
    };
    
    for (let i = 0; i < count; i++) {
      const type = rand() < 0.6 ? 'villager' : rand() < 0.9 ? 'child' : 'merchant';
      const colorSet = colors[type];
      
      newCharacters.push({
        id: `char-${i}`,
        x: rand() * width,
        baseY: height * 0.85 + rand() * 10 - 5,
        speed: type === 'child' ? 1.5 : 0.8,
        direction: rand() > 0.5 ? 1 : -1,
        type,
        color: colorSet[Math.floor(rand() * colorSet.length)]
      });
    }
    
    setCharacters(newCharacters);
  }, [seed, width, height, condition]);

  // Simple animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame(prev => prev + 1);
      
      setCharacters(prev => prev.map(char => {
        let newX = char.x + char.direction * char.speed;
        
        if (newX < -20 || newX > width + 20) {
          newX = char.direction === 1 ? -20 : width + 20;
        }
        
        return { ...char, x: newX };
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [width]);

  // Render functions
  const renderSky = () => {
    const { skyTop, skyMid, skyBottom, sunColor } = palette;
    const sunX = width * 0.85;
    const sunY = timeOfDay === 'midday' ? 30 : timeOfDay === 'dawn' || timeOfDay === 'dusk' ? 50 : 40;
    
    return (
      <g>
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={skyTop} />
            <stop offset="50%" stopColor={skyMid} />
            <stop offset="100%" stopColor={skyBottom} />
          </linearGradient>
          
          <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>
        
        {/* Sky */}
        <rect x="0" y="0" width={width} height={height * 0.6} fill="url(#skyGradient)" />
        
        {/* Sun/Moon */}
        <circle cx={sunX} cy={sunY} r="15" fill={sunColor} filter="url(#blur)" opacity="0.8" />
        <circle cx={sunX} cy={sunY} r="12" fill={sunColor} />
        
        {/* Simple clouds */}
        {[0, 1, 2].map(i => {
          const cloudX = ((i * 300 + animationFrame * 0.1) % (width + 200)) - 100;
          return (
            <g key={i} opacity="0.7">
              <rect x={cloudX} y={20 + i * 10} width="40" height="15" rx="7" fill="#FFFFFF" />
              <rect x={cloudX + 10} y={15 + i * 10} width="30" height="15" rx="7" fill="#FFFFFF" />
              <rect x={cloudX + 20} y={20 + i * 10} width="35" height="15" rx="7" fill="#FFFFFF" />
            </g>
          );
        })}
        
        {/* Stars for night */}
        {timeOfDay === 'night' && [...Array(15)].map((_, i) => (
          <rect key={i} 
                x={50 + (i * 70 + seededRandom() * 30)} 
                y={10 + seededRandom() * 40}
                width="2" height="2" 
                fill="#FFFFFF" 
                opacity={0.6 + seededRandom() * 0.4} />
        ))}
      </g>
    );
  };

  const renderBackground = () => {
    return (
      <g>
        {/* Mountains */}
        {backgroundElements.filter(el => el.type === 'mountain').map((mountain, i) => (
          <g key={`mountain-${i}`}>
            <polygon
              points={`${mountain.x},${height * 0.6} ${mountain.x + 100},${height * 0.6 - mountain.height} ${mountain.x + 200},${height * 0.6}`}
              fill={mountain.color}
              opacity="0.6"
            />
            <polygon
              points={`${mountain.x},${height * 0.6} ${mountain.x + 100},${height * 0.6 - mountain.height} ${mountain.x + 80},${height * 0.6}`}
              fill={shadeColor(mountain.color, -20)}
              opacity="0.6"
            />
          </g>
        ))}
        
        {/* Trees */}
        {backgroundElements.filter(el => el.type === 'tree').map((tree, i) => (
          <g key={`tree-${i}`} opacity="0.8">
            {/* Trunk */}
            <rect x={tree.x - 2} y={tree.y - tree.size} width="4" height={tree.size} fill="#654321" />
            {/* Foliage (simple squares for pixel art style) */}
            <rect x={tree.x - 6} y={tree.y - tree.size - 8} width="12" height="8" fill={palette.tree} />
            <rect x={tree.x - 8} y={tree.y - tree.size - 4} width="16" height="8" fill={palette.tree} />
            <rect x={tree.x - 6} y={tree.y - tree.size} width="12" height="8" fill={palette.tree} />
          </g>
        ))}
      </g>
    );
  };

  const renderGround = () => {
    const groundY = height * 0.6;
    
    return (
      <g>
        {/* Main ground */}
        <rect x="0" y={groundY} width={width} height={height * 0.4} fill={palette.ground} />
        
        {/* Ground shading */}
        <rect x="0" y={groundY} width={width} height="4" fill={shadeColor(palette.ground, 20)} />
        
        {/* Marketplace floor (cobblestones) */}
        <rect x="0" y={height * 0.75} width={width} height={height * 0.25} fill={shadeColor(palette.ground, -10)} />
        
        {/* Simple grass patches */}
        {[...Array(8)].map((_, i) => (
          <rect key={i}
                x={i * 140 + 20}
                y={groundY + 10}
                width="60"
                height="8"
                fill={palette.grass}
                opacity="0.5" />
        ))}
        
        {/* Season-specific ground details */}
        {season === 'winter' && (
          <rect x="0" y={groundY} width={width} height={height * 0.4} fill="#FFFFFF" opacity="0.3" />
        )}
        {season === 'autumn' && [...Array(6)].map((_, i) => (
          <rect key={i}
                x={seededRandom() * width}
                y={groundY + 20 + seededRandom() * 20}
                width="6" height="6"
                fill={['#D2691E', '#FF8C00', '#CD853F'][i % 3]}
                transform={`rotate(${seededRandom() * 45})`} />
        ))}
      </g>
    );
  };

  const renderStalls = () => {
    return marketStalls.map(stall => {
      const shadow = shadeColor(palette.ground, -30);
      
      return (
        <g key={stall.id}>
          {/* Shadow */}
          <rect x={stall.x + 4} y={stall.y + 4} width={stall.width} height={stall.height}
                fill={shadow} opacity="0.3" />
          
          {/* Stall base */}
          <rect x={stall.x} y={stall.y} width={stall.width} height={stall.height}
                fill={archStyle.wall} />
          
          {/* Counter */}
          <rect x={stall.x} y={stall.y + stall.height - 15} width={stall.width} height="15"
                fill={shadeColor(archStyle.wall, -20)} />
          
          {/* Roof/Awning */}
          {archStyle.roofShape === 'triangular' && (
            <polygon points={`${stall.x - 10},${stall.y} ${stall.x + stall.width/2},${stall.y - 20} ${stall.x + stall.width + 10},${stall.y}`}
                     fill={archStyle.roof} />
          )}
          {archStyle.roofShape === 'curved' && (
            <path d={`M ${stall.x - 10},${stall.y} Q ${stall.x + stall.width/2},${stall.y - 25} ${stall.x + stall.width + 10},${stall.y}`}
                  fill={archStyle.roof} />
          )}
          {archStyle.roofShape === 'dome' && (
            <ellipse cx={stall.x + stall.width/2} cy={stall.y} rx={stall.width/2 + 10} ry="15"
                     fill={archStyle.roof} />
          )}
          
          {/* Awning stripes */}
          {stall.awningStripes === 'red-white' && [0, 1, 2, 3].map(i => (
            <rect key={i} x={stall.x - 10 + i * 25} y={stall.y - 10} width="12" height="12"
                  fill={i % 2 ? '#FFFFFF' : '#DC143C'} opacity="0.8" />
          ))}
          
          {/* Goods display (simple) */}
          <rect x={stall.x + 10} y={stall.y + 20} width="15" height="15" rx="2"
                fill={stall.color} />
          <rect x={stall.x + 30} y={stall.y + 22} width="12" height="12" rx="2"
                fill={shadeColor(stall.color, -20)} />
          <rect x={stall.x + 45} y={stall.y + 18} width="18" height="18" rx="2"
                fill={shadeColor(stall.color, 20)} />
          
          {/* Merchant (simplified pixel person) */}
          <g transform={`translate(${stall.x + stall.width/2}, ${stall.y + stall.height - 8})`}>
            <rect x="-4" y="-12" width="8" height="10" fill={archStyle.detail} />
            <rect x="-3" y="-15" width="6" height="4" fill="#DEB887" />
            <rect x="-3" y="-17" width="6" height="2" fill="#654321" />
          </g>
          
          {/* Cultural decorations */}
          {archStyle.decoration === 'lanterns' && (
            <g transform={`translate(${stall.x + stall.width - 15}, ${stall.y - 5})`}>
              <rect x="0" y="0" width="8" height="10" fill="#DC143C" />
              <rect x="2" y="2" width="4" height="6" fill="#FFD700" opacity="0.8" />
            </g>
          )}
        </g>
      );
    });
  };

  const renderCharacters = () => {
    return characters.map(char => {
      const walkFrame = Math.floor(animationFrame / 10) % 2;
      const legOffset = walkFrame * char.direction;
      
      return (
        <g key={char.id} transform={`translate(${Math.floor(char.x)}, ${Math.floor(char.baseY)})`}>
          {/* Shadow */}
          <ellipse cx="0" cy="4" rx="6" ry="2" fill="#000000" opacity="0.2" />
          
         {/* Simple pixel character */}
          <rect x="-3" y="-2" width="2" height="5" fill="#654321" /> {/* Left leg */}
          <rect x="1" y="-2" width="2" height="5" fill="#654321" />  {/* Right leg */}
          <rect x="-4" y="-10" width="8" height="8" fill={char.color} /> {/* Body */}
          <rect x="-3" y="-14" width="6" height="4" fill="#DEB887" /> {/* Head */}
          <rect x="-3" y="-16" width="6" height="2" fill="#654321" /> {/* Hair */}
          
          {/* Type-specific details */}
          {char.type === 'merchant' && (
            <rect x="-2" y="-17" width="4" height="1" fill="#FFD700" /> // Hat
          )}
          {char.type === 'child' && (
            <rect x="4" y="-8" width="3" height="3" fill="#FF6347" /> // Toy
          )}
        </g>
      );
    });
  };

  const renderAtmosphere = () => {
    const { lightIntensity, shadowIntensity } = palette;
    
    return (
      <g>
        {/* Ambient lighting overlay */}
        <rect x="0" y="0" width={width} height={height} 
              fill={timeOfDay === 'night' ? '#000033' : '#FFFFFF'} 
              opacity={timeOfDay === 'night' ? shadowIntensity * 0.5 : (1 - lightIntensity) * 0.2} />
        
        {/* Weather effects */}
        {season === 'winter' && [...Array(15)].map((_, i) => (
          <rect key={i}
                x={(i * 73 + animationFrame * 0.5) % width}
                y={(animationFrame + i * 50) % height}
                width="3" height="3"
                fill="#FFFFFF"
                opacity="0.7" />
        ))}
        
        {/* Simple fog for dawn/dusk */}
        {(timeOfDay === 'dawn' || timeOfDay === 'dusk') && (
          <rect x="0" y={height * 0.7} width={width} height={height * 0.3}
                fill={timeOfDay === 'dawn' ? '#FFE4E1' : '#DDA0DD'}
                opacity="0.2" />
        )}
      </g>
    );
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ imageRendering: 'pixelated' }}
    >
      {renderSky()}
      {renderBackground()}
      {renderGround()}
      {renderStalls()}
      {renderCharacters()}
      {renderAtmosphere()}
    </svg>
  );
};

export default MarketplaceBanner;
