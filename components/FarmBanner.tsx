/**
 * components/FarmBanner.tsx - A sophisticated, culturally-rich banner for farm interactions.
 * Now with educational content about historical farming techniques!
 */
import React from 'react';
import { HistoricalEra, CulturalZone, ClimateType as Climate, Season } from '../types';
import { lightenColor, addBlueishShadow } from '../utils/colorUtils';

export type Condition = 'humble' | 'prosperous';
export type CropType = string;

interface FarmBannerProps {
  era: HistoricalEra;
  culturalZone: CulturalZone;
  condition: Condition;
  cropType: CropType;
  climate: Climate;
  season: Season;
  seed?: number;
  width?: number;
  height?: number;
}

// Historical farming data by culture and era
const FARMING_SYSTEMS = {
  EUROPEAN: {
    [HistoricalEra.PREHISTORIC]: {
      technique: 'Slash-and-burn',
      tools: ['Digging stick', 'Stone hoe'],
      structures: ['Wattle fence', 'Storage pit'],
      crops: ['Emmer wheat', 'Barley', 'Lentils']
    },
    [HistoricalEra.ANCIENT]: {
      technique: 'Two-field rotation',
      tools: ['Wooden plow', 'Sickle'],
      structures: ['Granary', 'Threshing floor'],
      crops: ['Spelt', 'Rye', 'Peas']
    },
    [HistoricalEra.MEDIEVAL]: {
      technique: 'Three-field system',
      tools: ['Heavy plow', 'Scythe', 'Flail'],
      structures: ['Watermill', 'Barn', 'Manor house'],
      crops: ['Wheat', 'Barley', 'Oats', 'Turnips']
    },
    [HistoricalEra.EARLY_MODERN]: {
      technique: 'Four-course rotation',
      tools: ['Seed drill', 'Horse-drawn plow'],
      structures: ['Windmill', 'Large barn', 'Silo'],
      crops: ['Wheat', 'Turnips', 'Barley', 'Clover']
    },
    [HistoricalEra.MODERN_ERA]: {
      technique: 'Mechanized farming',
      tools: ['Tractor', 'Combine harvester'],
      structures: ['Grain elevator', 'Modern barn'],
      crops: ['Wheat', 'Corn', 'Soybeans']
    }
  },
  EAST_ASIAN: {
    [HistoricalEra.PREHISTORIC]: {
      technique: 'Wet rice cultivation',
      tools: ['Digging stick', 'Stone knife'],
      structures: ['Rice paddy', 'Raised granary'],
      crops: ['Millet', 'Early rice']
    },
    [HistoricalEra.ANCIENT]: {
      technique: 'Paddy field system',
      tools: ['Iron plow', 'Winnowing basket'],
      structures: ['Irrigation canal', 'Rice storage'],
      crops: ['Rice', 'Soybeans', 'Millet']
    },
    [HistoricalEra.MEDIEVAL]: {
      technique: 'Intensive wet-rice',
      tools: ['Water buffalo plow', 'Foot-powered pump'],
      structures: ['Terraces', 'Water wheel'],
      crops: ['Rice', 'Tea', 'Mulberry']
    },
    [HistoricalEra.EARLY_MODERN]: {
      technique: 'Double cropping',
      tools: ['Improved plow', 'Chain pump'],
      structures: ['Complex irrigation', 'Tea house'],
      crops: ['Rice', 'Silk', 'Tea', 'Cotton']
    },
    [HistoricalEra.MODERN_ERA]: {
      technique: 'Green Revolution',
      tools: ['Power tiller', 'Rice transplanter'],
      structures: ['Modern irrigation', 'Processing facility'],
      crops: ['High-yield rice', 'Vegetables']
    }
  },
  MENA: {
    [HistoricalEra.ANCIENT]: {
      technique: 'Basin irrigation',
      tools: ['Shaduf', 'Wooden plow'],
      structures: ['Mud-brick granary', 'Canal'],
      crops: ['Wheat', 'Barley', 'Dates', 'Flax']
    },
    [HistoricalEra.MEDIEVAL]: {
      technique: 'Qanat system',
      tools: ['Noria wheel', 'Iron tools'],
      structures: ['Underground canal', 'Windcatcher'],
      crops: ['Wheat', 'Cotton', 'Dates', 'Citrus']
    },
    [HistoricalEra.MODERN_ERA]: {
      technique: 'Drip irrigation',
      tools: ['Modern pump', 'Greenhouse'],
      structures: ['Desalination plant', 'Hydroponic farm'],
      crops: ['Vegetables', 'Dates', 'Citrus']
    }
  },
  SUB_SAHARAN_AFRICAN: {
    [HistoricalEra.PREHISTORIC]: {
      technique: 'Shifting cultivation',
      tools: ['Digging stick', 'Stone axe'],
      structures: ['Fence', 'Grain basket'],
      crops: ['Yam', 'Sorghum', 'Millet']
    },
    [HistoricalEra.ANCIENT]: {
      technique: 'Mixed farming',
      tools: ['Iron hoe', 'Machete'],
      structures: ['Round hut', 'Raised granary'],
      crops: ['Sorghum', 'Millet', 'Cowpeas']
    },
    [HistoricalEra.MEDIEVAL]: {
      technique: 'Terracing',
      tools: ['Iron tools', 'Basket'],
      structures: ['Stone terraces', 'Storage hut'],
      crops: ['Maize', 'Cassava', 'Plantain']
    }
  },
  SOUTH_AMERICAN: {
    [HistoricalEra.PREHISTORIC]: {
      technique: 'Chinampas',
      tools: ['Coa stick', 'Stone tools'],
      structures: ['Floating garden', 'Storage pit'],
      crops: ['Maize', 'Beans', 'Squash']
    },
    [HistoricalEra.ANCIENT]: {
      technique: 'Terrace farming',
      tools: ['Foot plow', 'Stone hoe'],
      structures: ['Andean terraces', 'Qollqa storage'],
      crops: ['Potatoes', 'Quinoa', 'Maize']
    },
    [HistoricalEra.MEDIEVAL]: {
      technique: 'Raised fields',
      tools: ['Chakitaqlla', 'Bronze tools'],
      structures: ['Waru waru', 'Stone warehouse'],
      crops: ['200+ potato varieties', 'Quinoa', 'Coca']
    }
  }
};

// Get the default farming system for cultures/eras not defined
const getDefaultFarmingSystem = (era: HistoricalEra) => {
  return {
    technique: 'Traditional farming',
    tools: ['Basic tools'],
    structures: ['Storage', 'Shelter'],
    crops: ['Local crops']
  };
};

const getFarmingSystem = (culturalZone: CulturalZone, era: HistoricalEra) => {
  const cultural = FARMING_SYSTEMS[culturalZone as keyof typeof FARMING_SYSTEMS];
  if (cultural && cultural[era]) {
    return cultural[era];
  }
  // Fallback to European system or default
  if (FARMING_SYSTEMS.EUROPEAN[era]) {
    return FARMING_SYSTEMS.EUROPEAN[era];
  }
  return getDefaultFarmingSystem(era);
};

// Historical context generator
const getHistoricalContext = (culturalZone: CulturalZone, era: HistoricalEra, technique: string): string => {
  const contexts: Record<string, string> = {
    'Three-field system': 'Revolutionized medieval agriculture by rotating crops to maintain soil fertility.',
    'Paddy field system': 'Intensive water management allowed for multiple harvests per year.',
    'Chinampas': 'Floating gardens built by Aztecs on lake beds, incredibly productive.',
    'Terrace farming': 'Allowed cultivation on steep mountain slopes, maximizing arable land.',
    'Qanat system': 'Underground channels brought water from mountains to arid regions.',
    'Basin irrigation': 'Annual Nile floods deposited fertile silt, enabling ancient Egyptian civilization.',
    'Slash-and-burn': 'Early agricultural technique that cleared forest for temporary cultivation.',
    'Four-course rotation': 'Norfolk system that increased yields by adding fodder crops.',
    'Mechanized farming': 'Steam and later diesel power transformed agriculture scale and efficiency.',
    'Green Revolution': 'High-yield varieties and synthetic fertilizers dramatically increased food production.',
    'Double cropping': 'Planting two crops per year maximized land productivity in warm climates.',
    'Wet rice cultivation': 'Labor-intensive but highly productive system supporting dense populations.',
    'Shifting cultivation': 'Sustainable forest farming when population density is low.',
    'Mixed farming': 'Combining crops and livestock for mutual benefit and risk reduction.',
    'Intensive wet-rice': 'Supported the highest population densities in pre-industrial world.',
    'Raised fields': 'Waru waru system prevented frost damage and improved drainage in Andes.',
    'Drip irrigation': 'Modern water-efficient technique crucial in arid regions.'
  };
  
  return contexts[technique] || `Traditional ${culturalZone} farming methods adapted to local conditions.`;
};

const ParticleEffects: React.FC<{ season: Season, climate: Climate, width: number, height: number, seed: number }> = ({ season, climate, width, height, seed }) => {
    const particles = [];
    const particleCount = 20;

    if (season === 'winter' && (climate === 'COLD' || climate === 'TEMPERATE')) {
        for (let i = 0; i < particleCount; i++) {
            const style = {
                left: `${Math.random() * 100}%`,
                animationDuration: `${2 + Math.random() * 3}s`,
                animationDelay: `${Math.random() * 5}s`,
                animation: `snowfall ${2 + Math.random() * 3}s linear ${Math.random() * 5}s infinite`
            };
            particles.push(<div key={`snow-${i}`} className="absolute w-1 h-1 bg-white rounded-full opacity-80" style={style}></div>);
        }
    } else if (season === 'fall') {
        const leafColors = ['#d97706', '#b45309', '#facc15', '#dc2626', '#ea580c'];
         for (let i = 0; i < particleCount / 2; i++) {
            const style = {
                left: `${Math.random() * 100}%`,
                animationDuration: `${3 + Math.random() * 4}s`,
                animationDelay: `${Math.random() * 5}s`,
                backgroundColor: leafColors[i % leafColors.length],
                animation: `leaffall ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 5}s infinite`,
                transform: `rotate(${Math.random() * 360}deg)`
            };
            particles.push(<div key={`leaf-${i}`} className="absolute w-2 h-2 rounded-sm" style={style}></div>);
        }
    } else if (season === 'spring' && Math.random() < 0.5) {
        for (let i = 0; i < particleCount; i++) {
            const style = {
                left: `${Math.random() * 100}%`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`,
                animationDelay: `${Math.random() * 2}s`,
                animation: `rainfall ${0.5 + Math.random() * 0.5}s linear ${Math.random() * 2}s infinite`
            };
            particles.push(<div key={`rain-${i}`} className="absolute w-px h-4 bg-blue-300/70" style={style}></div>);
        }
    } else if (season === 'summer') {
        // Add fireflies for summer nights
        for (let i = 0; i < 8; i++) {
            const style = {
                left: `${20 + Math.random() * 60}%`,
                top: `${40 + Math.random() * 40}%`,
                animation: `firefly ${5 + Math.random() * 3}s ease-in-out ${Math.random() * 5}s infinite`
            };
            particles.push(
                <div key={`firefly-${i}`} className="absolute w-1 h-1" style={style}>
                    <div className="w-full h-full bg-yellow-300 rounded-full animate-pulse"
                         style={{ boxShadow: '0 0 4px #fde047' }}></div>
                </div>
            );
        }
    }

    return <div className="absolute inset-0 pointer-events-none overflow-hidden">{particles}</div>;
}

const FarmBanner: React.FC<FarmBannerProps> = ({ 
  era, 
  culturalZone, 
  condition,
  cropType,
  climate,
  season,
  seed, 
  width = 600, 
  height = 150 
}) => {
  const [showEducationalOverlay, setShowEducationalOverlay] = React.useState(false);
  const [hoveredElement, setHoveredElement] = React.useState<string | null>(null);
  const actualSeed = seed ?? Math.floor(Math.random() * 1000000) + Date.now() % 1000000;
  const farmingSystem = getFarmingSystem(culturalZone, era);
  const details = { economicStatus: condition }; // For worker rendering
  
  const seededRandom = (s: number) => {
    let x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const isProsperous = condition === 'prosperous';

  // Enhanced pixel art block renderer
  const renderBlock = (x: number, y: number, blockWidth: number, blockHeight: number, color: string, key: string, addShading: boolean = true) => {
    const elements = [];
    
    elements.push(
      <rect 
        key={key} 
        x={x} 
        y={y} 
        width={blockWidth} 
        height={blockHeight} 
        fill={color} 
        style={{ shapeRendering: 'crispEdges' }}
      />
    );
    
    if (addShading && blockWidth > 4 && blockHeight > 4) {
      // Top highlight
      elements.push(
        <rect 
          key={`${key}-hl`} 
          x={x} 
          y={y} 
          width={blockWidth} 
          height={Math.max(1, Math.floor(blockHeight * 0.15))} 
          fill={lightenColor(color, 0.25)} 
          style={{ shapeRendering: 'crispEdges' }}
        />
      );
      
      // Bottom shadow
      elements.push(
        <rect 
          key={`${key}-sh`} 
          x={x} 
          y={y + blockHeight - Math.max(1, Math.floor(blockHeight * 0.15))} 
          width={blockWidth} 
          height={Math.max(1, Math.floor(blockHeight * 0.15))} 
          fill={addBlueishShadow(color, 0.25)} 
          style={{ shapeRendering: 'crispEdges' }}
        />
      );
    }
    
    return elements;
  };

  // Cultural architecture themes
  const getArchitectureTheme = () => {
    const themes = {
      EUROPEAN: {
        [HistoricalEra.MEDIEVAL]: {
          house: '#8B4513', roof: '#8B0000', accent: '#D2691E',
          style: 'timber_frame'
        },
        [HistoricalEra.EARLY_MODERN]: {
          house: '#DEB887', roof: '#800020', accent: '#F5DEB3',
          style: 'stone_cottage'
        },
        [HistoricalEra.MODERN_ERA]: {
          house: '#F5F5DC', roof: '#708090', accent: '#DC143C',
          style: 'modern_farmhouse'
        }
      },
      EAST_ASIAN: {
        [HistoricalEra.ANCIENT]: {
          house: '#8B4513', roof: '#2F4F2F', accent: '#CD853F',
          style: 'raised_floor'
        },
        [HistoricalEra.MEDIEVAL]: {
          house: '#D2691E', roof: '#8B0000', accent: '#FFD700',
          style: 'pagoda_farm'
        },
        [HistoricalEra.MODERN_ERA]: {
          house: '#F5F5DC', roof: '#4682B4', accent: '#FF6347',
          style: 'modern_asian'
        }
      },
      MENA: {
        [HistoricalEra.ANCIENT]: {
          house: '#F5DEB3', roof: '#F5DEB3', accent: '#8B7355',
          style: 'mud_brick'
        },
        [HistoricalEra.MEDIEVAL]: {
          house: '#FAEBD7', roof: '#D2691E', accent: '#4682B4',
          style: 'courtyard'
        }
      },
      SUB_SAHARAN_AFRICAN: {
        [HistoricalEra.ANCIENT]: {
          house: '#D2691E', roof: '#8B7355', accent: '#FFD700',
          style: 'round_hut'
        },
        [HistoricalEra.MEDIEVAL]: {
          house: '#8B4513', roof: '#D2691E', accent: '#FF6347',
          style: 'compound'
        }
      },
      SOUTH_AMERICAN: {
        [HistoricalEra.ANCIENT]: {
          house: '#8B4513', roof: '#228B22', accent: '#FFD700',
          style: 'thatched'
        },
        [HistoricalEra.MEDIEVAL]: {
          house: '#708090', roof: '#8B4513', accent: '#DC143C',
          style: 'stone_inca'
        }
      }
    };

    const cultural = themes[culturalZone as keyof typeof themes];
    if (cultural && cultural[era]) {
      return cultural[era];
    }
    
    // Default theme
    return {
      house: '#8B4513', roof: '#654321', accent: '#D2691E',
      style: 'generic'
    };
  };

  const architecture = getArchitectureTheme();

  // Seasonal colors
  const getSeasonalColors = () => {
    const colors = {
      spring: {
        sky: 'linear-gradient(to bottom, #87CEEB, #E0F6FF)',
        ground: '#90EE90',
        field: '#7CFC00'
      },
      summer: {
        sky: 'linear-gradient(to bottom, #4169E1, #87CEEB)',
        ground: '#228B22',
        field: '#FFD700'
      },
      fall: {
        sky: 'linear-gradient(to bottom, #FF8C00, #FFE4B5)',
        ground: '#8B4513',
        field: '#D2691E'
      },
      winter: {
        sky: 'linear-gradient(to bottom, #778899, #F0F8FF)',
        ground: '#F5F5F5',
        field: '#E0E0E0'
      }
    };
    return colors[season] || colors.summer;
  };

  const seasonalColors = getSeasonalColors();

  // Render cultural farm structures
  const renderFarmStructures = () => {
    const elements = [];
    
    // Main farmhouse based on cultural style
    if (architecture.style === 'timber_frame') {
      // European timber frame house
      const houseX = width * 0.15;
      const houseY = height * 0.4;
      elements.push(...renderBlock(houseX, houseY, 60, 40, architecture.house, 'house'));
      elements.push(...renderBlock(houseX - 5, houseY - 15, 70, 20, architecture.roof, 'roof'));
      // Chimney
      elements.push(...renderBlock(houseX + 45, houseY - 20, 8, 15, '#696969', 'chimney'));
      if (season === 'winter') {
        // Animated smoke
        elements.push(
          <g key="smoke">
            <circle cx={houseX + 48} cy={houseY - 25} r={2} fill="#C0C0C0" 
                    style={{ animation: 'smoke-drift 3s ease-out infinite' }} />
            <circle cx={houseX + 46} cy={houseY - 28} r={2.5} fill="#D3D3D3" 
                    style={{ animation: 'smoke-drift 3s ease-out 0.5s infinite' }} />
            <circle cx={houseX + 50} cy={houseY - 30} r={2} fill="#E0E0E0" 
                    style={{ animation: 'smoke-drift 3s ease-out 1s infinite' }} />
          </g>
        );
      }
    } else if (architecture.style === 'pagoda_farm') {
      // East Asian style with curved roofs
      const houseX = width * 0.15;
      const houseY = height * 0.45;
      elements.push(...renderBlock(houseX, houseY, 55, 35, architecture.house, 'house'));
      // Multi-tier roof
      elements.push(...renderBlock(houseX - 8, houseY - 8, 71, 12, architecture.roof, 'roof1'));
      elements.push(...renderBlock(houseX - 5, houseY - 16, 65, 10, architecture.roof, 'roof2'));
    } else if (architecture.style === 'mud_brick') {
      // MENA flat-roofed structure
      const houseX = width * 0.15;
      const houseY = height * 0.45;
      elements.push(...renderBlock(houseX, houseY, 65, 35, architecture.house, 'house'));
      elements.push(...renderBlock(houseX, houseY - 5, 65, 8, architecture.roof, 'roof'));
      // Courtyard wall
      elements.push(...renderBlock(houseX + 70, houseY + 10, 3, 25, architecture.house, 'wall1'));
      elements.push(...renderBlock(houseX + 70, houseY + 10, 40, 3, architecture.house, 'wall2'));
    } else if (architecture.style === 'round_hut') {
      // African round hut with conical roof
      const houseX = width * 0.15;
      const houseY = height * 0.45;
      // Circular base approximated with blocks
      elements.push(...renderBlock(houseX + 10, houseY, 35, 35, architecture.house, 'hut-base'));
      elements.push(...renderBlock(houseX + 5, houseY + 5, 45, 25, architecture.house, 'hut-mid'));
      // Conical roof
      elements.push(...renderBlock(houseX + 15, houseY - 10, 25, 15, architecture.roof, 'roof-top'));
      elements.push(...renderBlock(houseX + 5, houseY - 5, 45, 10, architecture.roof, 'roof-mid'));
    }

    // Barn or storage structure
    if (isProsperous) {
      const barnX = width * 0.65;
      const barnY = height * 0.42;
      elements.push(...renderBlock(barnX, barnY, 70, 38, '#8B0000', 'barn'));
      elements.push(...renderBlock(barnX - 3, barnY - 12, 76, 15, '#654321', 'barn-roof'));
      // Barn door
      elements.push(...renderBlock(barnX + 30, barnY + 15, 10, 23, '#4B0000', 'barn-door'));
    }

    // Cultural farming tools/structures
    if (farmingSystem.structures.includes('Watermill') || farmingSystem.structures.includes('Water wheel')) {
      // Animated water wheel
      const wheelX = width * 0.45;
      const wheelY = height * 0.5;
      elements.push(
        <g key="waterwheel" transform={`translate(${wheelX + 12}, ${wheelY + 12})`}>
          <g style={{ animation: 'windmill-rotate 8s linear infinite', transformOrigin: 'center' }}>
            <rect x={-12} y={-12} width={24} height={24} fill="#8B4513" />
            <rect x={-2} y={-15} width={4} height={30} fill="#654321" />
            <rect x={-15} y={-2} width={30} height={4} fill="#654321" />
            <rect x={-10} y={-10} width={4} height={4} fill="#4682B4" opacity={0.5} />
            <rect x={6} y={6} width={4} height={4} fill="#4682B4" opacity={0.5} />
          </g>
        </g>
      );
      // Water stream
      elements.push(...renderBlock(wheelX - 5, wheelY + 20, 35, 3, '#4682B4', 'water-stream', false));
    }

    if (farmingSystem.structures.includes('Terraces') || farmingSystem.structures.includes('Andean terraces')) {
      // Terraced fields
      for (let i = 0; i < 4; i++) {
        const terraceY = height * 0.65 + i * 8;
        elements.push(...renderBlock(width * 0.3, terraceY, width * 0.5, 3, '#8B7355', `terrace-${i}`));
      }
    }

    return elements;
  };

  // Render crops based on season and culture
  const renderCrops = () => {
    const elements = [];
    const fieldStartX = width * 0.35;
    const fieldStartY = height * 0.65;
    
    if (season === 'winter') {
      // Snow-covered fields
      elements.push(...renderBlock(fieldStartX, fieldStartY, width * 0.5, 20, '#F0F8FF', 'snow-field'));
    } else {
      // Crop rows
      const cropColor = season === 'spring' ? '#90EE90' : 
                       season === 'summer' ? '#FFD700' : 
                       season === 'fall' ? '#D2691E' : '#8B7355';
      
      for (let row = 0; row < 5; row++) {
        const rowY = fieldStartY + row * 4;
        elements.push(...renderBlock(fieldStartX, rowY, width * 0.45, 2, cropColor, `crop-row-${row}`, false));
      }

      // Add crop-specific details
      if (culturalZone === 'EAST_ASIAN' && (cropType === 'Rice' || farmingSystem.crops.includes('Rice'))) {
        // Rice paddies with water
        for (let row = 0; row < 5; row++) {
          const rowY = fieldStartY + row * 4;
          elements.push(...renderBlock(fieldStartX - 2, rowY + 1, width * 0.47, 1, '#4682B4', `water-${row}`, false));
        }
      }
    }

    // Add animated workers if prosperous
    if (isProsperous && season !== 'winter') {
      const workerX = fieldStartX + seededRandom(actualSeed + 100) * 100;
      const workerY = fieldStartY - 8;
      
      // Animated worker moving slightly
      elements.push(
        <g key="worker" transform={`translate(${workerX}, ${workerY})`}
           style={{ animation: 'worker-motion 4s ease-in-out infinite' }}>
          {/* Body */}
          <rect x={0} y={0} width={3} height={5} fill="#8B4513" />
          {/* Head */}
          <rect x={0} y={-2} width={3} height={2} fill="#F5DEB3" />
          {/* Hat */}
          <rect x={-1} y={-3} width={5} height={1} fill="#654321" />
          {/* Tool */}
          {(farmingSystem.tools.includes('Scythe') || farmingSystem.tools.includes('Sickle')) && (
            <rect x={3} y={-1} width={5} height={1} fill="#C0C0C0" />
          )}
        </g>
      );
      
      // Add second worker if very prosperous
      if (details?.economicStatus === 'prosperous') {
        const worker2X = fieldStartX + seededRandom(actualSeed + 200) * 80 + 20;
        const worker2Y = fieldStartY - 6;
        elements.push(
          <g key="worker2" transform={`translate(${worker2X}, ${worker2Y})`}
             style={{ animation: 'worker-motion 4s ease-in-out 2s infinite' }}>
            <rect x={0} y={0} width={3} height={5} fill="#8B4513" />
            <rect x={0} y={-2} width={3} height={2} fill="#DEB887" />
            <rect x={-1} y={-3} width={5} height={1} fill="#8B0000" />
          </g>
        );
      }
    }

    return elements;
  };

  // Render animals with more variety and animation
  const renderAnimals = () => {
    const elements = [];
    
    if (culturalZone === 'EAST_ASIAN' && farmingSystem.tools.includes('Water buffalo plow')) {
      // Animated water buffalo
      const buffaloX = width * 0.5;
      const buffaloY = height * 0.55;
      elements.push(
        <g key="buffalo" transform={`translate(${buffaloX}, ${buffaloY})`}
           style={{ animation: 'gentle-sway 6s ease-in-out infinite' }}>
          <rect x={0} y={0} width={12} height={8} fill="#2F4F4F" />
          <rect x={-2} y={0} width={4} height={6} fill="#2F4F4F" />
          {/* Horns */}
          <rect x={-3} y={-1} width={1} height={2} fill="#F5F5DC" />
          <rect x={0} y={-1} width={1} height={2} fill="#F5F5DC" />
        </g>
      );
    } else if (culturalZone === 'EUROPEAN' && era >= HistoricalEra.MEDIEVAL) {
      // Animated cow or horse
      const animalX = width * 0.52;
      const animalY = height * 0.56;
      elements.push(
        <g key="cow" transform={`translate(${animalX}, ${animalY})`}
           style={{ animation: 'gentle-sway 5s ease-in-out 1s infinite' }}>
          <rect x={0} y={0} width={10} height={7} fill="#8B4513" />
          <rect x={-2} y={0} width={3} height={5} fill="#8B4513" />
          {/* Spots for cow */}
          <circle cx={3} cy={3} r={1} fill="#FFFFFF" opacity={0.6} />
          <circle cx={7} cy={2} r={1.5} fill="#FFFFFF" opacity={0.6} />
        </g>
      );
    }

    // Animated chickens for all cultures
    if (isProsperous) {
      for (let i = 0; i < 3; i++) {
        const chickenX = width * 0.25 + i * 15 + seededRandom(actualSeed + 200 + i) * 10;
        const chickenY = height * 0.68;
        const pecking = i % 2 === 0;
        elements.push(
          <g key={`chicken-${i}`} transform={`translate(${chickenX}, ${chickenY})`}
             style={{ animation: pecking ? 'chicken-peck 2s ease-in-out infinite' : 'chicken-walk 3s linear infinite' }}>
            <ellipse cx={1.5} cy={1.5} rx={2} ry={2.5} fill="#FFFFFF" />
            <circle cx={0} cy={0} r={0.5} fill="#FF0000" />
            {/* Beak */}
            <polygon points="-1,0 -2,0.5 -1,1" fill="#FFA500" />
          </g>
        );
      }
    }
    
    // Add seasonal birds
    if (season === 'spring' || season === 'summer') {
      for (let i = 0; i < 2; i++) {
        const birdX = width * 0.7 + i * 30;
        const birdY = height * 0.2 + i * 10;
        elements.push(
          <g key={`bird-${i}`} transform={`translate(${birdX}, ${birdY})`}
             style={{ animation: `bird-fly ${4 + i}s ease-in-out ${i * 2}s infinite` }}>
            <path d="M0,0 L-3,-2 L0,-1 L3,-2 Z" fill="#333" />
          </g>
        );
      }
    }
    
    // Add butterflies in summer
    if (season === 'summer' && climate !== 'COLD') {
      for (let i = 0; i < 3; i++) {
        const butterflyX = width * 0.3 + seededRandom(actualSeed + 300 + i) * width * 0.4;
        const butterflyY = height * 0.4 + seededRandom(actualSeed + 400 + i) * 20;
        const colors = ['#FFD700', '#FF69B4', '#87CEEB'];
        elements.push(
          <g key={`butterfly-${i}`} transform={`translate(${butterflyX}, ${butterflyY})`}
             style={{ animation: `butterfly-float ${5 + i}s ease-in-out ${i}s infinite` }}>
            <ellipse cx={-2} cy={0} rx={2} ry={3} fill={colors[i % colors.length]} opacity={0.8} />
            <ellipse cx={2} cy={0} rx={2} ry={3} fill={colors[i % colors.length]} opacity={0.8} />
            <rect x={-0.5} y={-2} width={1} height={4} fill="#333" />
          </g>
        );
      }
    }

    return elements;
  };

  return (
    <div className="relative w-full h-full overflow-hidden group" 
         style={{ background: seasonalColors.sky }}
         onClick={() => setShowEducationalOverlay(!showEducationalOverlay)}>
      <style>{`
        @keyframes snowfall {
          0% { transform: translateY(-10px); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(${height}px); opacity: 0; }
        }
        @keyframes leaffall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
          10% { opacity: 0.9; }
          25% { transform: translateY(${height * 0.25}px) translateX(10px) rotate(90deg); }
          50% { transform: translateY(${height * 0.5}px) translateX(-5px) rotate(180deg); }
          75% { transform: translateY(${height * 0.75}px) translateX(8px) rotate(270deg); }
          90% { opacity: 0.9; }
          100% { transform: translateY(${height}px) rotate(360deg); opacity: 0; }
        }
        @keyframes rainfall {
          0% { transform: translateY(-20px); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(${height}px); opacity: 0; }
        }
        @keyframes firefly {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(20px, -10px); }
          50% { transform: translate(-10px, -20px); }
          75% { transform: translate(15px, 5px); }
        }
        @keyframes windmill-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes smoke-drift {
          0% { transform: translateY(0) translateX(0); opacity: 0.5; }
          50% { transform: translateY(-10px) translateX(5px); opacity: 0.3; }
          100% { transform: translateY(-20px) translateX(10px); opacity: 0; }
        }
        @keyframes bird-fly {
          0%, 100% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(30px) translateY(-5px); }
          50% { transform: translateX(60px) translateY(0); }
          75% { transform: translateX(30px) translateY(5px); }
        }
        @keyframes worker-motion {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(3px); }
        }
        @keyframes gentle-sway {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(2px); }
        }
        @keyframes chicken-peck {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(2px) rotate(5deg); }
        }
        @keyframes chicken-walk {
          0% { transform: translateX(0); }
          25% { transform: translateX(2px) translateY(-1px); }
          50% { transform: translateX(4px); }
          75% { transform: translateX(2px) translateY(-1px); }
          100% { transform: translateX(0); }
        }
        @keyframes butterfly-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(10px, -5px) scale(1.1); }
          50% { transform: translate(5px, -10px) scale(1); }
          75% { transform: translate(-5px, -5px) scale(0.9); }
        }
        .farm-banner-interactive:hover .hover-glow {
          opacity: 1;
        }
      `}</style>
      <svg width={width} height={height} className="absolute inset-0" style={{ imageRendering: 'pixelated' }}>
        {/* Sky gradient background */}
        <defs>
          <linearGradient id="sky-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={season === 'winter' ? '#778899' : season === 'fall' ? '#FF8C00' : '#4169E1'} />
            <stop offset="100%" stopColor={season === 'winter' ? '#F0F8FF' : season === 'fall' ? '#FFE4B5' : '#87CEEB'} />
          </linearGradient>
        </defs>
        <rect width={width} height={height} fill="url(#sky-gradient)" />
        
        {/* Sun or moon */}
        {season !== 'winter' && (
          <circle cx={width * 0.85} cy={height * 0.2} r={15} fill={season === 'fall' ? '#FFA500' : '#FFD700'} />
        )}
        
        {/* Ground */}
        <rect x={0} y={height * 0.6} width={width} height={height * 0.4} fill={seasonalColors.ground} />
        
        {/* Render all farm elements */}
        {renderFarmStructures()}
        {renderCrops()}
        {renderAnimals()}
      </svg>
      
      {/* Interactive Educational Overlay */}
      <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${
        showEducationalOverlay ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="bg-slate-800/95 rounded-lg p-4 max-w-md mx-4 border border-amber-400/50" 
             style={{ pointerEvents: showEducationalOverlay ? 'auto' : 'none' }}>
          <h3 className="text-amber-400 font-bold mb-2 text-sm flex items-center gap-2">
            <span>🌾</span> {culturalZone} Farming - {era}
          </h3>
          <div className="space-y-2 text-xs text-slate-200">
            <div className="border-l-2 border-blue-400/50 pl-2">
              <div className="font-semibold text-blue-300">Technique:</div>
              <div>{farmingSystem.technique}</div>
            </div>
            <div className="border-l-2 border-green-400/50 pl-2">
              <div className="font-semibold text-green-300">Tools:</div>
              <div>{farmingSystem.tools.join(', ')}</div>
            </div>
            <div className="border-l-2 border-purple-400/50 pl-2">
              <div className="font-semibold text-purple-300">Structures:</div>
              <div>{farmingSystem.structures.join(', ')}</div>
            </div>
            <div className="border-l-2 border-orange-400/50 pl-2">
              <div className="font-semibold text-orange-300">Crops:</div>
              <div>{farmingSystem.crops.join(', ')}</div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-600 text-[10px] text-slate-400 italic">
            {getHistoricalContext(culturalZone, era, farmingSystem.technique)}
          </div>
        </div>
      </div>
      
      {/* Quick info tooltip */}
      <div className="absolute bottom-2 left-2 text-xs text-white bg-black/70 px-2 py-1 rounded group-hover:bg-black/80 transition-colors cursor-pointer" 
           style={{ maxWidth: '300px' }}>
        <div className="font-bold flex items-center gap-1">
          {farmingSystem.technique}
          <span className="text-[10px] opacity-60">(click for details)</span>
        </div>
        <div className="text-[10px] opacity-90">
          Season: {season.charAt(0).toUpperCase() + season.slice(1)} | 
          {isProsperous ? 'Prosperous' : 'Humble'} {cropType} Farm
        </div>
      </div>
      
      <ParticleEffects season={season} climate={climate} width={width} height={height} seed={actualSeed} />
    </div>
  );
};

export default FarmBanner;