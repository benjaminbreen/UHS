/**
 * components/FortressBanner.tsx - Animated pixel-art banner for fortress structures
 * V2: Improved composition with climate/season awareness, better vertical layout
 * - More sky visible (fortress centered vertically)
 * - Fortress inset into landscape with shadows and depth
 * - Climate/season affects landscape rendering
 * - Matches quality of FishingHutBanner and CityBanner
 */
import React, { useEffect, useMemo, useState } from 'react';
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

// IMPROVED: Ground positioned lower for better sky visibility
// Fortress will be inset slightly into ground for depth
const GROUND_Y = 160; // Balanced to show sky but not push fortress to horizon
const HORIZON_Y = 105; // Far background elements
const FORTRESS_Y = 135; // Fortress base position - higher than ground for proper placement

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

// IMPROVED: Get ground/landscape colors based on climate and season
const getGroundColor = (climate: ClimateType, season: Season): {
  ground: string;  // Main ground color
  vegetation: string;  // Vegetation/grass color
  accent: string;  // Secondary terrain features
  shadow: string;  // Shadow color for depth
  highlight: string;  // Highlight color
} => {
  // Winter snow for cold and temperate climates
  if (season === 'winter') {
    if (climate === ClimateType.COLD) {
      return {
        ground: '#F0F8FF',
        vegetation: '#E0E8EF',
        accent: '#C0D0E0',
        shadow: '#B0C5D8',
        highlight: '#FFFFFF'
      }; // Always snow
    }
    if (climate === ClimateType.TEMPERATE) {
      return {
        ground: '#E8F0F8',
        vegetation: '#D0E0F0',
        accent: '#B0C0D0',
        shadow: '#A0B0C0',
        highlight: '#F5FAFF'
      }; // Winter snow
    }
    if (climate === ClimateType.MEDITERRANEAN) {
      return {
        ground: '#9BC5A0',
        vegetation: '#6B8E70',
        accent: '#557A5A',
        shadow: '#4A6850',
        highlight: '#B5D5BA'
      }; // Green in winter
    }
  }

  // Cold climate - always snow/ice
  if (climate === ClimateType.COLD) {
    return {
      ground: '#F0F8FF',
      vegetation: '#E0E8EF',
      accent: '#C0D0E0',
      shadow: '#B0C5D8',
      highlight: '#FFFFFF'
    };
  }

  // Arid climate - desert colors with seasonal variation
  if (climate === ClimateType.ARID) {
    if (season === 'summer') {
      return {
        ground: '#E5D4B8',
        vegetation: '#D9A668',
        accent: '#C89850',
        shadow: '#9A7A50',
        highlight: '#F2E6D0'
      }; // Hot, bleached sand
    }
    return {
      ground: '#D2B48C',
      vegetation: '#CD853F',
      accent: '#A0826D',
      shadow: '#8B7355',
      highlight: '#E8D7C0'
    }; // Standard desert
  }

  // Mediterranean - strong seasonal changes
  if (climate === ClimateType.MEDITERRANEAN) {
    if (season === 'summer') {
      return {
        ground: '#D4C5A0',
        vegetation: '#B8A080',
        accent: '#9A8565',
        shadow: '#7A6850',
        highlight: '#E8DCC0'
      }; // Dry, golden summer
    }
    if (season === 'spring') {
      return {
        ground: '#AAC58F',
        vegetation: '#7AA857',
        accent: '#5F8A45',
        shadow: '#4A6835',
        highlight: '#C5E0A8'
      }; // Lush spring green
    }
    if (season === 'fall') {
      return {
        ground: '#B4A88F',
        vegetation: '#9A8570',
        accent: '#7A6850',
        shadow: '#5A4A35',
        highlight: '#D0C0A8'
      }; // Autumn browns
    }
  }

  // Tropical - lush green with rich earth, wet in summer
  if (climate === ClimateType.TROPICAL) {
    if (season === 'summer') {
      return {
        ground: '#4A7C59',
        vegetation: '#047857',
        accent: '#036849',
        shadow: '#024A35',
        highlight: '#5F9A70'
      }; // Deep wet green
    }
    return {
      ground: '#5A8C69',
      vegetation: '#059669',
      accent: '#047857',
      shadow: '#035A42',
      highlight: '#6FAA80'
    }; // Standard tropical
  }

  // Semitropical - vibrant green
  if (climate === ClimateType.SEMITROPICAL) {
    return {
      ground: '#7ED6A4',
      vegetation: '#32CD32',
      accent: '#228B22',
      shadow: '#1A6B1A',
      highlight: '#98E6B8'
    };
  }

  // Default temperate - seasonal variation
  if (season === 'summer') {
    return {
      ground: '#96F5AC',
      vegetation: '#32D550',
      accent: '#22A540',
      shadow: '#1A7A32',
      highlight: '#B0FFCC'
    }; // Bright summer green
  }
  if (season === 'spring') {
    return {
      ground: '#A0E8B0',
      vegetation: '#40D060',
      accent: '#28B048',
      shadow: '#1A8035',
      highlight: '#C0F5D0'
    }; // Fresh spring green
  }
  if (season === 'fall') {
    return {
      ground: '#B8C098',
      vegetation: '#8A9870',
      accent: '#6A7850',
      shadow: '#4A5835',
      highlight: '#D0D8B0'
    }; // Autumn yellow-green
  }

  // Default temperate
  return {
    ground: '#86EFAC',
    vegetation: '#22C55E',
    accent: '#16A34A',
    shadow: '#107830',
    highlight: '#A8FFCC'
  };
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
// IMPROVED: Era-first logic for historical authenticity
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

  // === PREHISTORY (< -3000 BCE) ===
  // Simple earthworks, wooden palisades, no stone construction
  if (year < -3000) {
    if (zone.includes('europe')) return 'earth-berm';
    if (zone.includes('mena')) return 'earth-berm';
    if (zone.includes('east_asian') || zone.includes('asia')) return 'palisade-fort';
    if (zone.includes('america')) return 'palisade-fort';
    if (zone.includes('africa')) return 'thorn-enclosure';
    if (zone.includes('oceania')) return 'palisade-fort';
    return 'earth-berm'; // Default prehistoric
  }

  // === BRONZE AGE / EARLY ANTIQUITY (-3000 to -500 BCE) ===
  // Mix of earthworks, early stone, wooden stockades
  if (year < -500) {
    if (zone.includes('europe')) return 'hill-fort'; // Celtic/Iberian hill forts
    if (zone.includes('mena')) return 'adobe-fortress'; // Mesopotamian/Egyptian mud brick
    if (zone.includes('east_asian') || zone.includes('asia')) return 'rammed-earth-fort'; // Chinese stamped earth
    if (zone.includes('america')) return 'adobe-fortress'; // Adobe in Americas
    if (zone.includes('africa')) return 'stone-enclosure'; // African stone works
    if (zone.includes('oceania')) return 'pa-fortification'; // Maori pa
    return 'hill-fort'; // Default bronze age
  }

  // === CLASSICAL ANTIQUITY (-500 BCE to 500 CE) ===
  // Professional military architecture begins
  if (year < 500) {
    if (zone.includes('europe')) return 'roman-castrum'; // Roman military camps
    if (zone.includes('mena')) return 'desert-fort'; // Nabataean/Persian forts
    if (zone.includes('east_asian') || zone.includes('asia')) return 'rammed-earth-fort'; // Qin/Han fortifications
    if (zone.includes('south_asian') || zone.includes('india')) return 'stone-fortress'; // Indian stone forts
    if (zone.includes('america')) return 'adobe-fortress'; // Maya/Zapotec
    if (zone.includes('africa')) return 'stone-fortress'; // Aksumite/Kushite
    return 'hill-fort'; // Default classical
  }

  // === MEDIEVAL (500-1500 CE) ===
  if (year >= 500 && year < 1500) {
    // Early Medieval (500-1000)
    if (year < 1000) {
      if (zone.includes('europe')) return 'motte-bailey'; // Norman/Saxon
      if (zone.includes('mena')) return 'desert-fort'; // Islamic fortifications
      if (zone.includes('east_asian') || zone.includes('japan')) return 'japanese-castle'; // Early Japanese yamajiro
      if (zone.includes('asia')) return 'rammed-earth-fort'; // Tang/Song fortifications
      return 'byzantine'; // Byzantine default for this era
    }

    // High Medieval (1000-1500)
    if (zone.includes('japan') || zone.includes('east_asian')) return 'japanese-castle';
    if (zone.includes('mena') || zone.includes('arab') || zone.includes('islamic')) return 'desert-fort';
    if (zone.includes('india') || zone.includes('south_asian')) return 'stone-fortress';
    return 'medieval-castle'; // European default
  }

  // === EARLY MODERN (1500-1800) ===
  if (year >= 1500 && year < 1800) {
    if (zone.includes('america')) {
      if (zone.includes('colonial')) {
        if (year >= 1750) return 'frontier-fort'; // American frontier
        return 'presidio'; // Spanish colonial
      }
      return 'adobe-fortress'; // Indigenous fortifications
    }
    if (zone.includes('japan')) return 'japanese-castle'; // Azuchi-Momoyama/Edo castles
    if (zone.includes('europe')) return 'star-fort'; // Trace italienne
    if (zone.includes('mena')) return 'desert-fort'; // Ottoman fortifications
    return 'star-fort'; // Default early modern
  }

  // === INDUSTRIAL (1800-1950) ===
  if (year >= 1800 && year < 1950) {
    if (zone.includes('america') && year >= 1750 && year <= 1890) return 'frontier-fort';
    return 'star-fort'; // Late bastioned fortifications
  }

  // === MODERN (1950+) ===
  if (year >= 1950) return 'modern-base';

  // Fallback to medieval castle (shouldn't reach here)
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
  
  // IMPROVED: Render sky with better vertical proportions
  const renderSky = () => {
    const cloudOffset = (animationFrame * 0.1) % (width + 100);

    return (
      <g>
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={skyGradient[0]} />
            <stop offset="40%" stopColor={skyGradient[1]} />
            <stop offset="100%" stopColor={skyGradient[2] || skyGradient[1]} />
          </linearGradient>
        </defs>
        {/* Sky now extends much lower to show more sky */}
        <rect x="0" y="0" width={width} height={HORIZON_Y} fill="url(#skyGradient)" />

        {/* Sun/Moon - positioned higher in expanded sky */}
        {todCategory === 'night' ? (
          <g>
            <circle cx={width - 80} cy="40" r="14" fill="#F7FAFC" opacity="0.95" />
            <circle cx={width - 77} cy="37" r="2.5" fill={skyGradient[0]} />
            <circle cx={width - 82} cy="42" r="1.5" fill={skyGradient[0]} />
          </g>
        ) : todCategory === 'dusk' || todCategory === 'dawn' ? (
          <circle cx={width - 80} cy="40" r="18" fill="#FF8C42" opacity="0.85" />
        ) : (
          <circle cx={width - 80} cy="40" r="18" fill="#FDE047" opacity="0.9" />
        )}

        {/* More clouds with better depth */}
        {todCategory !== 'night' && [0, 1, 2, 3, 4].map((i) => {
          const cloudX = -100 + cloudOffset + i * 150;
          const cloudY = 25 + staticRng.range(-10, 15);
          const cloudSize = 0.8 + staticRng.range(0, 0.4);
          return (
            <g key={i} opacity={0.7 + staticRng.range(0, 0.2)}>
              <rect x={cloudX} y={cloudY} width={16 * cloudSize} height={8 * cloudSize} rx="4" fill="#F1F5F9" />
              <rect x={cloudX + 8 * cloudSize} y={cloudY - 2 * cloudSize} width={20 * cloudSize} height={8 * cloudSize} rx="4" fill="#F1F5F9" />
              <rect x={cloudX + 12 * cloudSize} y={cloudY + 1 * cloudSize} width={12 * cloudSize} height={6 * cloudSize} rx="3" fill="#F1F5F9" />
            </g>
          );
        })}
      </g>
    );
  };
  
  // IMPROVED: Render mountains/background positioned at horizon
  const renderBackground = () => {
    const layers = variant === 'desert-fort' || climate === ClimateType.ARID ?
      [
        { color: '#D2B48C', opacity: 0.25, height: 40 },
        { color: '#C19A6B', opacity: 0.4, height: 35 },
        { color: '#A0826D', opacity: 0.6, height: 30 }
      ] : nearMountains || variant === 'hill-fort' || variant === 'motte-bailey' ?
      [
        { color: '#707080', opacity: 0.25, height: 50 },
        { color: '#5A5A6A', opacity: 0.4, height: 45 },
        { color: '#4A4A5A', opacity: 0.6, height: 40 }
      ] :
      [
        { color: palette.accent, opacity: 0.2, height: 35 },
        { color: palette.vegetation, opacity: 0.35, height: 30 },
        { color: palette.shadow, opacity: 0.5, height: 25 }
      ];

    return (
      <g>
        {layers.map((layer, layerIndex) => {
          const points = [];
          for (let i = 0; i <= width + 40; i += 40) {
            const baseY = HORIZON_Y - layer.height;
            const peakY = baseY - staticRng.range(5, 20);

            if (i === 0) points.push(`${i - 20},${HORIZON_Y}`);
            points.push(`${i},${baseY}`);
            points.push(`${i + 20},${peakY}`);
            points.push(`${i + 40},${baseY}`);
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
  
  // IMPROVED: Render ground with transition zone, shadows, and climate-specific features
  const renderGround = () => {
    const isSnowy = (climate === ClimateType.COLD || (climate === ClimateType.TEMPERATE && season === 'winter'));
    const isDesert = climate === ClimateType.ARID || variant === 'desert-fort';
    const isTropical = climate === ClimateType.TROPICAL || climate === ClimateType.SEMITROPICAL;

    return (
      <g>
        {/* Atmospheric haze - subtle fade from horizon to sky */}
        <defs>
          <linearGradient id="hazeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={palette.ground} stopOpacity="0.15" />
            <stop offset="50%" stopColor={palette.accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor={palette.ground} stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id="groundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={palette.ground} stopOpacity="1" />
            <stop offset="80%" stopColor={palette.ground} stopOpacity="1" />
            <stop offset="100%" stopColor={palette.shadow} stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Atmospheric haze band - subtle transition */}
        <rect x="0" y={HORIZON_Y} width={width} height={GROUND_Y - HORIZON_Y} fill="url(#hazeGradient)" />

        {/* Main foreground extending to bottom - MUCH softer gradient */}
        <rect x="0" y={GROUND_Y} width={width} height={height - GROUND_Y} fill="url(#groundGradient)" />

        {/* Fortress shadow zone - positioned at fortress base */}
        <ellipse
          cx={width / 2}
          cy={FORTRESS_Y + 5}
          rx="95"
          ry="10"
          fill={palette.shadow}
          opacity="0.25"
        />

        {/* Path/road approaching fortress */}
        <path
          d={`M ${width / 2 - 25} ${height} Q ${width / 2} ${GROUND_Y + 10} ${width / 2 + 25} ${height}`}
          fill={isSnowy ? palette.accent : '#8B6F47'}
          opacity={isSnowy ? "0.15" : "0.25"}
        />
        <path
          d={`M ${width / 2 - 20} ${height} Q ${width / 2} ${GROUND_Y + 12} ${width / 2 + 20} ${height}`}
          fill={isSnowy ? palette.shadow : '#6B5337'}
          opacity={isSnowy ? "0.1" : "0.2"}
        />

        {/* Climate-specific ground features */}
        {isSnowy && (
          <>
            {/* Snow drifts with better depth */}
            {Array.from({ length: 12 }, (_, i) => (
              <ellipse
                key={`snow-${i}`}
                cx={i * (width / 11) + staticRng.range(-15, 15)}
                cy={GROUND_Y + staticRng.range(-5, 20)}
                rx={25 + staticRng.range(-10, 15)}
                ry={6 + staticRng.range(-2, 4)}
                fill={palette.highlight}
                opacity={0.7 + staticRng.range(0, 0.2)}
              />
            ))}
            {/* Ice patches */}
            {Array.from({ length: 5 }, (_, i) => (
              <ellipse
                key={`ice-${i}`}
                cx={staticRng.range(50, width - 50)}
                cy={GROUND_Y + staticRng.range(5, 30)}
                rx={12 + staticRng.range(0, 8)}
                ry={4 + staticRng.range(0, 3)}
                fill="#E0F0FF"
                opacity="0.6"
              />
            ))}
          </>
        )}

        {isDesert && (
          <>
            {/* Sand dunes with proper layering */}
            {Array.from({ length: 8 }, (_, i) => {
              const duneX = i * (width / 7) + staticRng.range(-20, 20);
              const duneY = GROUND_Y + staticRng.range(0, 25);
              return (
                <ellipse
                  key={`dune-${i}`}
                  cx={duneX}
                  cy={duneY}
                  rx={35 + staticRng.range(-10, 20)}
                  ry={8 + staticRng.range(-2, 4)}
                  fill={i % 2 === 0 ? palette.highlight : palette.accent}
                  opacity={0.3 + staticRng.range(0, 0.2)}
                />
              );
            })}
            {/* Desert rocks and stones */}
            {Array.from({ length: 6 }, (_, i) => (
              <rect
                key={`rock-${i}`}
                x={staticRng.range(30, width - 30)}
                y={GROUND_Y + staticRng.range(0, 20)}
                width={8 + staticRng.range(-3, 6)}
                height={5 + staticRng.range(-2, 4)}
                fill={palette.shadow}
                opacity={0.5 + staticRng.range(0, 0.2)}
              />
            ))}
          </>
        )}

        {isTropical && (
          <>
            {/* Lush vegetation patches */}
            {Array.from({ length: 10 }, (_, i) => {
              const patchX = i * (width / 9) + staticRng.range(-10, 10);
              const patchY = GROUND_Y + staticRng.range(-5, 15);
              return (
                <ellipse
                  key={`vegetation-${i}`}
                  cx={patchX}
                  cy={patchY}
                  rx={15 + staticRng.range(-5, 10)}
                  ry={6 + staticRng.range(-2, 3)}
                  fill={palette.accent}
                  opacity={0.4 + staticRng.range(0, 0.2)}
                />
              );
            })}
            {/* Palm fronds or tropical plants in foreground */}
            {Array.from({ length: 4 }, (_, i) => (
              <g key={`plant-${i}`}>
                <rect
                  x={staticRng.range(20, width - 20)}
                  y={GROUND_Y + staticRng.range(0, 20)}
                  width="3"
                  height={8 + staticRng.range(0, 6)}
                  fill={palette.vegetation}
                  opacity="0.6"
                />
              </g>
            ))}
          </>
        )}

        {/* Temperate grass/vegetation if not special climate */}
        {!isSnowy && !isDesert && !isTropical && Array.from({ length: width / 6 }, (_, i) => (
          <rect
            key={`grass-${i}`}
            x={i * 6 + staticRng.range(-3, 3)}
            y={GROUND_Y + staticRng.range(-8, 12)}
            width="2"
            height={4 + staticRng.range(0, 3)}
            fill={palette.vegetation}
            opacity={0.5 + staticRng.range(0, 0.3)}
          />
        ))}

        {/* Rocks and pebbles (all climates except desert) */}
        {!isDesert && Array.from({ length: 8 }, (_, i) => (
          <circle
            key={`pebble-${i}`}
            cx={staticRng.range(20, width - 20)}
            cy={GROUND_Y + staticRng.range(5, 25)}
            r={2 + staticRng.range(0, 2)}
            fill={palette.shadow}
            opacity={0.4 + staticRng.range(0, 0.2)}
          />
        ))}
      </g>
    );
  };
  
  // Helper: Scale fortress coordinates
  const scaleY = (y: number, scale: number = 1.25) => {
    // Translate GROUND_Y references to FORTRESS_Y and scale
    if (y <= 0) return FORTRESS_Y + (y * scale);
    return FORTRESS_Y - (Math.abs(y) * scale);
  };

  // Render fortress based on variant
  const renderFortress = () => {
    const centerX = width / 2;
    const fortressScale = 1.25; // Make all fortresses 25% bigger

    switch (variant) {
      // Existing variants
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

      // NEW: Prehistoric/Bronze Age variants
      case 'earth-berm':
        return renderEarthBerm(centerX);
      case 'palisade-fort':
        return renderPalisadeFort(centerX);
      case 'thorn-enclosure':
        return renderThornEnclosure(centerX);
      case 'adobe-fortress':
        return renderAdobeFortress(centerX);
      case 'rammed-earth-fort':
        return renderRammedEarthFort(centerX);
      case 'stone-enclosure':
        return renderStoneEnclosure(centerX);
      case 'pa-fortification':
        return renderPaFortification(centerX);
      case 'roman-castrum':
        return renderRomanCastrum(centerX);
      case 'stone-fortress':
        return renderStoneFortress(centerX);

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
  
  // Hill Fort (Celtic/Ancient, 500 BC - 500 AD) - IMPROVED
  const renderHillFort = (centerX: number) => {
    const baseY = FORTRESS_Y;
    const scale = 1.4; // 40% bigger for better visibility

    return (
      <g>
        {/* Earthwork ramparts - layered mounds */}
        <ellipse
          cx={centerX}
          cy={baseY - 10 * scale}
          rx={70 * scale}
          ry={18 * scale}
          fill="#8B7355"
          stroke="#6B5345"
          strokeWidth="1.5"
          opacity="0.9"
        />
        <ellipse
          cx={centerX}
          cy={baseY - 14 * scale}
          rx={55 * scale}
          ry={13 * scale}
          fill="#9B8976"
          opacity="0.95"
        />

        {/* Wooden palisade - more posts for better detail */}
        {Array.from({ length: 18 }, (_, i) => {
          const angle = (i / 18) * Math.PI * 2;
          const px = centerX + Math.cos(angle) * (48 * scale);
          const py = baseY - 14 * scale + Math.sin(angle) * (10 * scale);
          const height = 12 * scale + staticRng.range(-1, 1);
          return (
            <rect
              key={`palisade-${i}`}
              x={px - 1.2}
              y={py - height}
              width="2.5"
              height={height}
              fill="#654321"
              stroke="#4A2810"
              strokeWidth="0.5"
              opacity="0.9"
            />
          );
        })}

        {/* Round houses - bigger and more detailed */}
        <circle cx={centerX - 18 * scale} cy={baseY - 12 * scale} r={8 * scale} fill="#A0826D" stroke="#8B4513" strokeWidth="1.5" />
        <circle cx={centerX + 12 * scale} cy={baseY - 10 * scale} r={7 * scale} fill="#A0826D" stroke="#8B4513" strokeWidth="1.5" />

        {/* Conical thatch roofs */}
        <polygon
          points={`${centerX - 26 * scale},${baseY - 12 * scale} ${centerX - 18 * scale},${baseY - 24 * scale} ${centerX - 10 * scale},${baseY - 12 * scale}`}
          fill="#8B7355"
          stroke="#6B5345"
          strokeWidth="1.2"
        />
        <polygon
          points={`${centerX + 5 * scale},${baseY - 10 * scale} ${centerX + 12 * scale},${baseY - 20 * scale} ${centerX + 19 * scale},${baseY - 10 * scale}`}
          fill="#8B7355"
          stroke="#6B5345"
          strokeWidth="1.2"
        />

        {/* Standing stone marker */}
        <rect
          x={centerX + 35 * scale}
          y={baseY - 16 * scale}
          width={5 * scale}
          height={16 * scale}
          fill="#808080"
          stroke="#606060"
          strokeWidth="1"
        />

        {/* Torch flames - animated */}
        <rect x={centerX - 36 * scale} y={baseY - 10 * scale} width="1.5" height={8 * scale} fill="#654321" />
        <ellipse
          cx={centerX - 35.25 * scale}
          cy={baseY - 12 * scale - Math.abs(Math.sin(animationFrame * 0.1)) * 2}
          rx="2"
          ry="3"
          fill="#FF6B6B"
          opacity="0.85"
        />
        <ellipse
          cx={centerX - 35.25 * scale}
          cy={baseY - 13 * scale - Math.abs(Math.sin(animationFrame * 0.1)) * 2}
          rx="1.5"
          ry="2"
          fill="#FFD700"
          opacity="0.7"
        />

        <rect x={centerX + 30 * scale} y={baseY - 10 * scale} width="1.5" height={8 * scale} fill="#654321" />
        <ellipse
          cx={centerX + 30.75 * scale}
          cy={baseY - 12 * scale - Math.abs(Math.sin(animationFrame * 0.1 + 1)) * 2}
          rx="2"
          ry="3"
          fill="#FF6B6B"
          opacity="0.85"
        />
        <ellipse
          cx={centerX + 30.75 * scale}
          cy={baseY - 13 * scale - Math.abs(Math.sin(animationFrame * 0.1 + 1)) * 2}
          rx="1.5"
          ry="2"
          fill="#FFD700"
          opacity="0.7"
        />
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

  // ============================================
  // NEW FORTRESS TYPES - Prehistoric/Bronze Age
  // ============================================

  // Earth Berm (Prehistory, < -3000 BCE)
  // Simple earthen mound with wooden stakes
  const renderEarthBerm = (centerX: number) => {
    return (
      <g>
        {/* Earthen rampart - irregular mound */}
        <ellipse cx={centerX} cy={GROUND_Y - 5} rx="60" ry="15" fill="#8B7355" stroke="#6B5345" strokeWidth="1" opacity="0.9" />
        <ellipse cx={centerX} cy={GROUND_Y - 8} rx="50" ry="12" fill="#9B8976" opacity="0.8" />

        {/* Wooden stakes/palisade on top - crude and irregular */}
        {Array.from({ length: 16 }, (_, i) => {
          const angle = (i / 16) * Math.PI;
          const px = centerX + Math.cos(angle) * 45 - Math.cos(angle) * 5;
          const py = GROUND_Y - 8 + Math.sin(angle) * 10;
          const height = 8 + staticRng.range(-2, 2);
          return (
            <rect
              key={`stake-${i}`}
              x={px - 1}
              y={py - height}
              width="2"
              height={height}
              fill="#654321"
              opacity="0.8"
            />
          );
        })}

        {/* Standing stone or marker */}
        <rect x={centerX + 25} y={GROUND_Y - 10} width="4" height="10" fill="#808080" stroke="#606060" strokeWidth="0.5" />

        {/* Fire pit visible inside */}
        <circle cx={centerX - 10} cy={GROUND_Y - 6} r="3" fill="#FF6B6B" opacity="0.6" />
        <circle cx={centerX - 10} cy={GROUND_Y - 8} r="2" fill="#FFD700" opacity="0.7" />
      </g>
    );
  };

  // Palisade Fort (Prehistory, wooden stockade)
  const renderPalisadeFort = (centerX: number) => {
    return (
      <g>
        {/* Wooden palisade wall - tight vertical logs */}
        {Array.from({ length: 22 }, (_, i) => {
          const x = centerX - 55 + i * 5;
          const logHeight = 18 + staticRng.range(-2, 2);
          return (
            <rect
              key={`log-${i}`}
              x={x}
              y={GROUND_Y - logHeight}
              width="4"
              height={logHeight}
              fill="#8B4513"
              stroke="#654321"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Entrance gap with crude gate */}
        <rect x={centerX - 8} y={GROUND_Y - 14} width="16" height="14" fill="#654321" />
        <rect x={centerX - 6} y={GROUND_Y - 12} width="12" height="12" fill="#2C1810" />

        {/* Watch platform */}
        <rect x={centerX + 30} y={GROUND_Y - 22} width="12" height="4" fill="#A0826D" />
        <rect x={centerX + 34} y={GROUND_Y - 18} width="1" height="4" fill="#654321" />
        <rect x={centerX + 37} y={GROUND_Y - 18} width="1" height="4" fill="#654321" />

        {/* Warrior figure on platform */}
        <rect x={centerX + 35} y={GROUND_Y - 26} width="3" height="4" fill="#8B4513" />
      </g>
    );
  };

  // Thorn Enclosure (African, prehistoric)
  const renderThornEnclosure = (centerX: number) => {
    return (
      <g>
        {/* Circular thorn barrier - irregular spiky appearance */}
        {Array.from({ length: 30 }, (_, i) => {
          const angle = (i / 30) * Math.PI * 2;
          const radius = 50 + staticRng.range(-5, 5);
          const px = centerX + Math.cos(angle) * radius;
          const py = GROUND_Y - 5 + Math.sin(angle) * 10;

          return (
            <g key={`thorn-${i}`}>
              {/* Thorn branch */}
              <line
                x1={px} y1={py}
                x2={px + staticRng.range(-3, 3)}
                y2={py - 6 - staticRng.range(0, 4)}
                stroke="#654321"
                strokeWidth="1.5"
              />
              {/* Thorns */}
              <line x1={px} y1={py - 2} x2={px - 2} y2={py - 4} stroke="#8B4513" strokeWidth="0.5" />
              <line x1={px} y1={py - 4} x2={px + 2} y2={py - 5} stroke="#8B4513" strokeWidth="0.5" />
            </g>
          );
        })}

        {/* Central hut */}
        <ellipse cx={centerX} cy={GROUND_Y - 6} rx="15" ry="8" fill="#A0826D" />
        <polygon points={`${centerX - 18},${GROUND_Y - 6} ${centerX},${GROUND_Y - 18} ${centerX + 18},${GROUND_Y - 6}`}
                 fill="#8B7355" stroke="#6B5345" strokeWidth="1" />

        {/* Entrance through thorns */}
        <rect x={centerX - 3} y={GROUND_Y - 4} width="6" height="4" fill="#2C1810" />
      </g>
    );
  };

  // Adobe Fortress (Bronze Age MENA/Americas)
  const renderAdobeFortress = (centerX: number) => {
    return (
      <g>
        {/* Adobe/mud brick walls - rounded, organic appearance */}
        <rect x={centerX - 45} y={GROUND_Y - 25} width="90" height="25" fill="#D2B48C" stroke="#A0826D" strokeWidth="1" rx="2" />

        {/* Corner towers - rounded */}
        <rect x={centerX - 50} y={GROUND_Y - 28} width="12" height="28" fill="#C19A6B" stroke="#A0826D" strokeWidth="1" rx="2" />
        <rect x={centerX + 38} y={GROUND_Y - 28} width="12" height="28" fill="#C19A6B" stroke="#A0826D" strokeWidth="1" rx="2" />

        {/* Battlements - adobe style (rounded crenellations) */}
        {[-40, -25, -10, 5, 20, 35].map(offset => (
          <rect key={offset} x={centerX + offset} y={GROUND_Y - 28} width="8" height="3" fill="#D2B48C" rx="1" />
        ))}

        {/* Entrance - arched */}
        <path d={`M ${centerX - 7} ${GROUND_Y} L ${centerX - 7} ${GROUND_Y - 12} Q ${centerX} ${GROUND_Y - 16} ${centerX + 7} ${GROUND_Y - 12} L ${centerX + 7} ${GROUND_Y}`}
              fill="#2C1810" />

        {/* Decorative bands */}
        <rect x={centerX - 45} y={GROUND_Y - 15} width="90" height="1" fill="#A0826D" opacity="0.5" />
      </g>
    );
  };

  // Rammed Earth Fort (Chinese, Bronze Age+)
  const renderRammedEarthFort = (centerX: number) => {
    return (
      <g>
        {/* Rammed earth walls - horizontal layering visible */}
        <rect x={centerX - 50} y={GROUND_Y - 30} width="100" height="30" fill="#A0826D" stroke="#8B7355" strokeWidth="1" />

        {/* Horizontal layers showing rammed earth construction */}
        {Array.from({ length: 8 }, (_, i) => (
          <line
            key={`layer-${i}`}
            x1={centerX - 50}
            y1={GROUND_Y - 4 - i * 3}
            x2={centerX + 50}
            y2={GROUND_Y - 4 - i * 3}
            stroke="#8B7355"
            strokeWidth="0.5"
            opacity="0.6"
          />
        ))}

        {/* Corner watchtowers */}
        <rect x={centerX - 55} y={GROUND_Y - 35} width="10" height="35" fill="#8B7355" stroke="#6B5345" strokeWidth="1" />
        <rect x={centerX + 45} y={GROUND_Y - 35} width="10" height="35" fill="#8B7355" stroke="#6B5345" strokeWidth="1" />

        {/* Tower roofs - Chinese style */}
        <path d={`M ${centerX - 58} ${GROUND_Y - 35} L ${centerX - 50} ${GROUND_Y - 38} L ${centerX - 42} ${GROUND_Y - 35}`}
              fill="#2C2C2C" stroke="#1C1C1C" strokeWidth="0.5" />
        <path d={`M ${centerX + 42} ${GROUND_Y - 35} L ${centerX + 50} ${GROUND_Y - 38} L ${centerX + 58} ${GROUND_Y - 35}`}
              fill="#2C2C2C" stroke="#1C1C1C" strokeWidth="0.5" />

        {/* Gate - wooden with reinforcement */}
        <rect x={centerX - 8} y={GROUND_Y - 16} width="16" height="16" fill="#654321" />
        <rect x={centerX - 1} y={GROUND_Y - 14} width="2" height="14" fill="#8B4513" />
      </g>
    );
  };

  // Stone Enclosure (African Bronze Age)
  const renderStoneEnclosure = (centerX: number) => {
    return (
      <g>
        {/* Dry stone walls - irregular but fitted */}
        <path
          d={`M ${centerX - 55} ${GROUND_Y}
              L ${centerX - 50} ${GROUND_Y - 18}
              L ${centerX - 45} ${GROUND_Y - 20}
              L ${centerX - 20} ${GROUND_Y - 22}
              L ${centerX} ${GROUND_Y - 23}
              L ${centerX + 20} ${GROUND_Y - 22}
              L ${centerX + 45} ${GROUND_Y - 20}
              L ${centerX + 50} ${GROUND_Y - 18}
              L ${centerX + 55} ${GROUND_Y}
              Z`}
          fill="#808080"
          stroke="#606060"
          strokeWidth="1"
        />

        {/* Stone texture - individual blocks */}
        {Array.from({ length: 40 }, (_, i) => {
          const x = centerX - 50 + staticRng.range(0, 100);
          const y = GROUND_Y - staticRng.range(2, 20);
          return (
            <rect
              key={`stone-${i}`}
              x={x} y={y}
              width={4 + staticRng.range(0, 3)}
              height={2 + staticRng.range(0, 2)}
              fill="none"
              stroke="#505050"
              strokeWidth="0.5"
              opacity="0.4"
            />
          );
        })}

        {/* Entrance - gap in wall */}
        <rect x={centerX - 6} y={GROUND_Y - 12} width="12" height="12" fill="#A0826D" />
      </g>
    );
  };

  // Pa Fortification (Maori/Polynesian)
  const renderPaFortification = (centerX: number) => {
    return (
      <g>
        {/* Terraced earthworks */}
        <ellipse cx={centerX} cy={GROUND_Y - 3} rx="65" ry="12" fill="#8B7355" opacity="0.7" />
        <ellipse cx={centerX} cy={GROUND_Y - 8} rx="52" ry="10" fill="#9B8976" opacity="0.8" />
        <ellipse cx={centerX} cy={GROUND_Y - 13} rx="40" ry="8" fill="#A0826D" opacity="0.9" />

        {/* Wooden palisade on top terrace */}
        {Array.from({ length: 18 }, (_, i) => {
          const angle = (i / 18) * Math.PI;
          const px = centerX + Math.cos(angle) * 38;
          const py = GROUND_Y - 13 + Math.sin(angle) * 7;
          return (
            <rect
              key={`palisade-${i}`}
              x={px - 1.5}
              y={py - 10}
              width="3"
              height="10"
              fill="#8B4513"
              stroke="#654321"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Carved posts/totems */}
        <rect x={centerX - 35} y={GROUND_Y - 18} width="4" height="12" fill="#654321" />
        <rect x={centerX - 35} y={GROUND_Y - 20} width="6" height="3" fill="#8B4513" /> {/* carved detail */}

        <rect x={centerX + 31} y={GROUND_Y - 18} width="4" height="12" fill="#654321" />
        <rect x={centerX + 31} y={GROUND_Y - 20} width="6" height="3" fill="#8B4513" />
      </g>
    );
  };

  // Roman Castrum (Classical Antiquity)
  const renderRomanCastrum = (centerX: number) => {
    return (
      <g>
        {/* Rectangular Roman walls - precise geometry */}
        <rect x={centerX - 48} y={GROUND_Y - 28} width="96" height="28" fill="#A0A0A0" stroke="#808080" strokeWidth="1" />

        {/* Corner towers - square Roman style */}
        <rect x={centerX - 53} y={GROUND_Y - 33} width="10" height="33" fill="#909090" stroke="#707070" strokeWidth="1" />
        <rect x={centerX + 43} y={GROUND_Y - 33} width="10" height="33" fill="#909090" stroke="#707070" strokeWidth="1" />

        {/* Crenellations - precise Roman battlement */}
        {[-45, -35, -25, -15, -5, 5, 15, 25, 35].map(offset => (
          <rect key={offset} x={centerX + offset} y={GROUND_Y - 31} width="8" height="3" fill="#A0A0A0" />
        ))}

        {/* Gate - Roman arch */}
        <path d={`M ${centerX - 9} ${GROUND_Y} L ${centerX - 9} ${GROUND_Y - 14} Q ${centerX} ${GROUND_Y - 18} ${centerX + 9} ${GROUND_Y - 14} L ${centerX + 9} ${GROUND_Y}`}
              fill="#2C1810" stroke="#654321" strokeWidth="1" />

        {/* Roman standards/flags */}
        <rect x={centerX - 40} y={GROUND_Y - 40} width="2" height="12" fill="#8B4513" />
        <rect x={centerX - 40} y={GROUND_Y - 40} width="8" height="5" fill="#DC143C" />
        <text x={centerX - 37} y={GROUND_Y - 36} fontSize="4" fill="#FFD700">SPQR</text>
      </g>
    );
  };

  // Stone Fortress (Generic strong stone fortification)
  const renderStoneFortress = (centerX: number) => {
    return (
      <g>
        {/* Massive stone walls */}
        <rect x={centerX - 45} y={GROUND_Y - 32} width="90" height="32" fill="#808080" stroke="#606060" strokeWidth="1.5" />

        {/* Large corner bastions */}
        <circle cx={centerX - 45} cy={GROUND_Y - 16} r="14" fill="#909090" stroke="#707070" strokeWidth="1" />
        <circle cx={centerX + 45} cy={GROUND_Y - 16} r="14" fill="#909090" stroke="#707070" strokeWidth="1" />

        {/* Central tower */}
        <rect x={centerX - 12} y={GROUND_Y - 42} width="24" height="42" fill="#707070" stroke="#505050" strokeWidth="1" />

        {/* Tower battlements */}
        {[-10, -4, 2, 8].map(offset => (
          <rect key={offset} x={centerX + offset} y={GROUND_Y - 45} width="4" height="3" fill="#808080" />
        ))}

        {/* Gate - fortified entrance */}
        <rect x={centerX - 10} y={GROUND_Y - 18} width="20" height="18" fill="#654321" stroke="#2C1810" strokeWidth="1" />
        <rect x={centerX - 8} y={GROUND_Y - 16} width="16" height="16" fill="#2C1810" />

        {/* Murder holes */}
        <rect x={centerX - 5} y={GROUND_Y - 20} width="2" height="2" fill="#1C1C1C" />
        <rect x={centerX + 3} y={GROUND_Y - 20} width="2" height="2" fill="#1C1C1C" />
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