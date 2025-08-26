/**
 * components/HorizonLayer.tsx - Dynamic horizon artwork system
 * Creates contextual horizon lines based on map type, climate, weather and time
 */

import React, { useMemo } from 'react';
import { ClimateType, BiomeType, TimeOfDay, MapArchetype } from '../types';
import { WeatherState } from '../services/weatherService';
import { 
  TemperateHorizon, 
  TropicalHorizon,
  AridHorizon,
  ColdHorizon,
  MediterraneanHorizon,
  SemitropicalHorizon,
  OpenOceanHorizon,
  ShoalsHorizon
} from './horizons';

interface HorizonLayerProps {
  climate: ClimateType;
  mapType?: MapArchetype;
  weather?: WeatherState;
  timeOfDay: TimeOfDay;
  width?: number;
  height?: number;
  hasWater?: boolean;
  hasCities?: boolean;
  hasVolcano?: boolean;
  biomes?: BiomeType[];
}

type HorizonType = 
  | 'open_ocean'
  | 'desert_dunes'
  | 'mountain_range'
  | 'tropical_island'
  | 'arctic_wasteland'
  | 'forest_canopy'
  | 'savanna_plains'
  | 'urban_skyline'
  | 'river_valley'
  | 'volcanic_landscape'
  | 'steppe_prairie'
  | 'mediterranean_coast';

const HorizonLayer: React.FC<HorizonLayerProps> = ({
  climate,
  mapType,
  weather,
  timeOfDay,
  width = window.innerWidth,
  height = 120,
  hasWater = false,
  hasCities = false,
  hasVolcano = false,
  biomes = []
}) => {
  // Color schemes based on time of day
  const colors = useMemo(() => {
    const baseColors = {
      Dawn: {
        sky: '#4a5568',
        primary: '#5b4d6d',
        secondary: '#6b5b7b', 
        accent: '#8b7aa1',
        water: '#4a5f7a',
        waterAccent: '#5a6f8a'
      },
      Day: {
        sky: '#cbd5e0',
        primary: '#2d3748',
        secondary: '#4a5568',
        accent: '#718096',
        water: '#3182ce',
        waterAccent: '#4299e1'
      },
      Dusk: {
        sky: '#744780',
        primary: '#553c70',
        secondary: '#6b4c80',
        accent: '#8b6c90',
        water: '#4c5f80',
        waterAccent: '#5c7090'
      },
      Night: {
        sky: '#1a202c',
        primary: '#0d1117',
        secondary: '#1a202c',
        accent: '#2d3748',
        water: '#1e3a5f',
        waterAccent: '#2e4a6f'
      },
      Midday: {
        sky: '#e2e8f0',
        primary: '#2d3748',
        secondary: '#4a5568',
        accent: '#718096',
        water: '#2b6cb4',
        waterAccent: '#3b7cc4'
      }
    };

    return baseColors[timeOfDay] || baseColors.Day;
  }, [timeOfDay]);

  // Generate horizon based on climate and water presence
  const horizonSvg = useMemo(() => {
    const isWaterMap = hasWater;
    
    switch(climate) {
      case ClimateType.TEMPERATE:
        if (isWaterMap) {
          // Temperate coastal/lake - rolling hills meeting water
          return (
            <>
              {/* Distant mountains */}
              <path 
                d={`M 0 ${height * 0.4} 
                    Q ${width * 0.15} ${height * 0.3} ${width * 0.3} ${height * 0.35}
                    T ${width * 0.6} ${height * 0.3}
                    Q ${width * 0.8} ${height * 0.25} ${width} ${height * 0.4}
                    L ${width} ${height} L 0 ${height} Z`}
                fill={colors.accent}
                opacity="0.4"
              />
              {/* Mid-ground hills */}
              <path 
                d={`M 0 ${height * 0.5}
                    C ${width * 0.2} ${height * 0.4} ${width * 0.3} ${height * 0.45} ${width * 0.5} ${height * 0.5}
                    S ${width * 0.8} ${height * 0.45} ${width} ${height * 0.5}
                    L ${width} ${height} L 0 ${height} Z`}
                fill={colors.secondary}
                opacity="0.6"
              />
              {/* Trees along shore */}
              {[0.1, 0.25, 0.4, 0.6, 0.75, 0.9].map((x, i) => (
                <g key={i}>
                  <rect x={width * x - 3} y={height * 0.55} width="6" height="15" fill={colors.primary} opacity="0.7" />
                  <ellipse cx={width * x} cy={height * 0.52} rx="12" ry="18" fill={colors.secondary} opacity="0.8" />
                </g>
              ))}
              {/* Water line */}
              <rect x="0" y={height * 0.7} width={width} height={height * 0.3} fill={colors.water} opacity="0.3" />
              <path d={`M 0 ${height * 0.7} L ${width} ${height * 0.7}`} stroke={colors.waterAccent} strokeWidth="2" opacity="0.5" />
            </>
          );
        } else {
          // Temperate landlocked - rolling hills and forests
          return (
            <>
              {/* Far mountains */}
              <path 
                d={`M 0 ${height * 0.3}
                    L ${width * 0.2} ${height * 0.2} L ${width * 0.35} ${height * 0.28}
                    L ${width * 0.5} ${height * 0.15} L ${width * 0.65} ${height * 0.25}
                    L ${width * 0.8} ${height * 0.18} L ${width} ${height * 0.3}
                    L ${width} ${height} L 0 ${height} Z`}
                fill={colors.accent}
                opacity="0.3"
              />
              {/* Rolling hills */}
              <path 
                d={`M 0 ${height * 0.5}
                    Q ${width * 0.25} ${height * 0.4} ${width * 0.5} ${height * 0.45}
                    T ${width} ${height * 0.5}
                    L ${width} ${height} L 0 ${height} Z`}
                fill={colors.secondary}
                opacity="0.5"
              />
              {/* Forest line */}
              {Array.from({length: 15}, (_, i) => (
                <path 
                  key={i}
                  d={`M ${width * (i / 14)} ${height * 0.6} 
                      L ${width * (i / 14) - 8} ${height * 0.45} 
                      L ${width * (i / 14)} ${height * 0.4} 
                      L ${width * (i / 14) + 8} ${height * 0.45} Z`}
                  fill={colors.primary}
                  opacity={0.6 + Math.random() * 0.2}
                />
              ))}
            </>
          );
        }

      case ClimateType.ARID:
        if (isWaterMap) {
          // Desert oasis/coast - mesas meeting water
          return (
            <>
              {/* Distant mesas */}
              <rect x={width * 0.1} y={height * 0.3} width={width * 0.15} height={height * 0.7} fill={colors.accent} opacity="0.3" />
              <rect x={width * 0.4} y={height * 0.25} width={width * 0.2} height={height * 0.75} fill={colors.accent} opacity="0.35" />
              <rect x={width * 0.75} y={height * 0.35} width={width * 0.15} height={height * 0.65} fill={colors.accent} opacity="0.3" />
              
              {/* Sand dunes */}
              <path 
                d={`M 0 ${height * 0.6}
                    C ${width * 0.2} ${height * 0.5} ${width * 0.3} ${height * 0.55} ${width * 0.5} ${height * 0.6}
                    S ${width * 0.8} ${height * 0.55} ${width} ${height * 0.6}
                    L ${width} ${height} L 0 ${height} Z`}
                fill={colors.secondary}
                opacity="0.5"
              />
              
              {/* Palm trees near water */}
              {[0.2, 0.5, 0.8].map((x, i) => (
                <g key={i}>
                  <rect x={width * x - 2} y={height * 0.55} width="4" height="20" fill={colors.primary} opacity="0.6" />
                  <path d={`M ${width * x - 15} ${height * 0.5} Q ${width * x} ${height * 0.48} ${width * x + 15} ${height * 0.5}`} 
                        stroke={colors.secondary} strokeWidth="3" fill="none" opacity="0.7" />
                </g>
              ))}
              
              {/* Water */}
              <rect x="0" y={height * 0.75} width={width} height={height * 0.25} fill={colors.water} opacity="0.4" />
            </>
          );
        } else {
          // Desert landscape - mesas and dunes
          return (
            <>
              {/* Mesa formations */}
              <rect x={width * 0.05} y={height * 0.4} width={width * 0.12} height={height * 0.6} fill={colors.accent} opacity="0.4" rx="2" />
              <rect x={width * 0.25} y={height * 0.3} width={width * 0.18} height={height * 0.7} fill={colors.secondary} opacity="0.5" rx="2" />
              <rect x={width * 0.5} y={height * 0.35} width={width * 0.15} height={height * 0.65} fill={colors.accent} opacity="0.45" rx="2" />
              <rect x={width * 0.75} y={height * 0.45} width={width * 0.2} height={height * 0.55} fill={colors.secondary} opacity="0.4" rx="2" />
              
              {/* Sand dunes */}
              <path 
                d={`M 0 ${height * 0.7}
                    Q ${width * 0.25} ${height * 0.6} ${width * 0.5} ${height * 0.65}
                    T ${width} ${height * 0.7}
                    L ${width} ${height} L 0 ${height} Z`}
                fill={colors.primary}
                opacity="0.6"
              />
              
              {/* Cacti */}
              {[0.15, 0.35, 0.7, 0.85].map((x, i) => (
                <g key={i}>
                  <rect x={width * x - 2} y={height * 0.65} width="4" height="12" fill={colors.primary} opacity="0.7" />
                  <rect x={width * x - 6} y={height * 0.68} width="4" height="6" fill={colors.primary} opacity="0.7" />
                  <rect x={width * x + 2} y={height * 0.66} width="4" height="8" fill={colors.primary} opacity="0.7" />
                </g>
              ))}
            </>
          );
        }

      case ClimateType.TROPICAL:
        if (isWaterMap) {
          // Tropical coast/river - dense jungle meeting water
          return (
            <>
              {/* Mountain backdrop */}
              <path 
                d={`M 0 ${height * 0.3}
                    L ${width * 0.3} ${height * 0.15} L ${width * 0.6} ${height * 0.25}
                    L ${width * 0.8} ${height * 0.1} L ${width} ${height * 0.3}
                    L ${width} ${height} L 0 ${height} Z`}
                fill={colors.accent}
                opacity="0.25"
              />
              
              {/* Dense jungle canopy */}
              {Array.from({length: 20}, (_, i) => (
                <ellipse 
                  key={i}
                  cx={width * (i / 19)}
                  cy={height * 0.45 + Math.sin(i) * 10}
                  rx={width * 0.08}
                  ry={height * 0.25}
                  fill={colors.secondary}
                  opacity={0.4 + (i % 3) * 0.1}
                />
              ))}
              
              {/* Palm trees along water */}
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((x, i) => (
                <g key={i}>
                  <path d={`M ${width * x} ${height * 0.7} L ${width * x - 3} ${height * 0.5}`} 
                        stroke={colors.primary} strokeWidth="3" opacity="0.6" />
                  <path d={`M ${width * x - 20} ${height * 0.45} Q ${width * x} ${height * 0.43} ${width * x + 20} ${height * 0.45}`} 
                        stroke={colors.secondary} strokeWidth="4" fill="none" opacity="0.8" />
                </g>
              ))}
              
              {/* Water with mangroves */}
              <rect x="0" y={height * 0.75} width={width} height={height * 0.25} fill={colors.water} opacity="0.5" />
              <path d={`M 0 ${height * 0.75} Q ${width * 0.5} ${height * 0.73} ${width} ${height * 0.75}`} 
                    stroke={colors.waterAccent} strokeWidth="3" fill="none" opacity="0.6" />
            </>
          );
        } else {
          // Tropical inland - dense rainforest
          return (
            <>
              {/* Misty mountains */}
              <path 
                d={`M 0 ${height * 0.25}
                    C ${width * 0.3} ${height * 0.1} ${width * 0.6} ${height * 0.2} ${width} ${height * 0.25}
                    L ${width} ${height} L 0 ${height} Z`}
                fill={colors.accent}
                opacity="0.2"
              />
              
              {/* Multiple canopy layers */}
              {/* Back layer */}
              {Array.from({length: 12}, (_, i) => (
                <ellipse 
                  key={`back-${i}`}
                  cx={width * (i / 11)}
                  cy={height * 0.4}
                  rx={width * 0.1}
                  ry={height * 0.3}
                  fill={colors.accent}
                  opacity="0.3"
                />
              ))}
              {/* Mid layer */}
              {Array.from({length: 15}, (_, i) => (
                <ellipse 
                  key={`mid-${i}`}
                  cx={width * (i / 14) + 20}
                  cy={height * 0.5}
                  rx={width * 0.09}
                  ry={height * 0.28}
                  fill={colors.secondary}
                  opacity="0.5"
                />
              ))}
              {/* Front layer */}
              {Array.from({length: 10}, (_, i) => (
                <ellipse 
                  key={`front-${i}`}
                  cx={width * (i / 9)}
                  cy={height * 0.6}
                  rx={width * 0.11}
                  ry={height * 0.32}
                  fill={colors.primary}
                  opacity="0.7"
                />
              ))}
            </>
          );
        }

      case ClimateType.COLD:
        if (isWaterMap) {
          // Arctic coast/fjord - ice mountains meeting frozen water
          return (
            <>
              {/* Jagged peaks */}
              <path 
                d={`M 0 ${height * 0.4}
                    L ${width * 0.15} ${height * 0.1} L ${width * 0.25} ${height * 0.3}
                    L ${width * 0.4} ${height * 0.05} L ${width * 0.5} ${height * 0.25}
                    L ${width * 0.65} ${height * 0.15} L ${width * 0.8} ${height * 0.35}
                    L ${width * 0.95} ${height * 0.08} L ${width} ${height * 0.4}
                    L ${width} ${height} L 0 ${height} Z`}
                fill={colors.secondary}
                opacity="0.4"
              />
              
              {/* Snow caps */}
              <path 
                d={`M ${width * 0.15} ${height * 0.1} L ${width * 0.1} ${height * 0.2} L ${width * 0.2} ${height * 0.2} Z`}
                fill="white"
                opacity="0.3"
              />
              <path 
                d={`M ${width * 0.4} ${height * 0.05} L ${width * 0.35} ${height * 0.15} L ${width * 0.45} ${height * 0.15} Z`}
                fill="white"
                opacity="0.3"
              />
              
              {/* Pine forest */}
              {Array.from({length: 18}, (_, i) => (
                <path 
                  key={i}
                  d={`M ${width * (i / 17)} ${height * 0.65}
                      L ${width * (i / 17) - 6} ${height * 0.5}
                      L ${width * (i / 17)} ${height * 0.45}
                      L ${width * (i / 17) + 6} ${height * 0.5} Z`}
                  fill={colors.primary}
                  opacity={0.5 + (i % 3) * 0.15}
                />
              ))}
              
              {/* Icy water */}
              <rect x="0" y={height * 0.75} width={width} height={height * 0.25} fill={colors.water} opacity="0.6" />
              {/* Ice floes */}
              <rect x={width * 0.2} y={height * 0.76} width={width * 0.1} height="4" fill="white" opacity="0.4" />
              <rect x={width * 0.5} y={height * 0.77} width={width * 0.08} height="3" fill="white" opacity="0.4" />
              <rect x={width * 0.75} y={height * 0.76} width={width * 0.12} height="4" fill="white" opacity="0.4" />
            </>
          );
        } else {
          // Arctic tundra - snowy mountains and pines
          return (
            <>
              {/* Mountain range */}
              <path 
                d={`M 0 ${height * 0.35}
                    L ${width * 0.2} ${height * 0.05} L ${width * 0.35} ${height * 0.25}
                    L ${width * 0.5} ${height * 0.1} L ${width * 0.65} ${height * 0.3}
                    L ${width * 0.85} ${height * 0.02} L ${width} ${height * 0.35}
                    L ${width} ${height} L 0 ${height} Z`}
                fill={colors.secondary}
                opacity="0.5"
              />
              
              {/* Snow coverage */}
              <path 
                d={`M 0 ${height * 0.6}
                    Q ${width * 0.5} ${height * 0.55} ${width} ${height * 0.6}
                    L ${width} ${height} L 0 ${height} Z`}
                fill="white"
                opacity="0.15"
              />
              
              {/* Scattered pines */}
              {[0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 0.95].map((x, i) => (
                <path 
                  key={i}
                  d={`M ${width * x} ${height * 0.7}
                      L ${width * x - 8} ${height * 0.5}
                      L ${width * x} ${height * 0.4}
                      L ${width * x + 8} ${height * 0.5} Z`}
                  fill={colors.primary}
                  opacity="0.6"
                />
              ))}
            </>
          );
        }

      case ClimateType.MEDITERRANEAN:
        if (isWaterMap) {
          // Mediterranean coast - cypress trees and cliffs
          return (
            <>
              {/* Coastal cliffs */}
              <path 
                d={`M 0 ${height * 0.5}
                    L ${width * 0.2} ${height * 0.3} L ${width * 0.3} ${height * 0.45}
                    L ${width * 0.5} ${height * 0.25} L ${width * 0.6} ${height * 0.4}
                    L ${width * 0.8} ${height * 0.35} L ${width} ${height * 0.5}
                    L ${width} ${height} L 0 ${height} Z`}
                fill={colors.secondary}
                opacity="0.4"
              />
              
              {/* Cypress trees */}
              {[0.15, 0.35, 0.55, 0.75, 0.9].map((x, i) => (
                <g key={i}>
                  <rect x={width * x - 2} y={height * 0.4} width="4" height="25" fill={colors.primary} opacity="0.5" />
                  <ellipse cx={width * x} cy={height * 0.35} rx="6" ry="15" fill={colors.secondary} opacity="0.6" />
                </g>
              ))}
              
              {/* Distant islands */}
              <ellipse cx={width * 0.7} cy={height * 0.65} rx={width * 0.08} ry="8" fill={colors.accent} opacity="0.3" />
              <ellipse cx={width * 0.85} cy={height * 0.68} rx={width * 0.06} ry="6" fill={colors.accent} opacity="0.25" />
              
              {/* Sparkling sea */}
              <rect x="0" y={height * 0.72} width={width} height={height * 0.28} fill={colors.water} opacity="0.5" />
              <path d={`M 0 ${height * 0.72} L ${width} ${height * 0.72}`} stroke={colors.waterAccent} strokeWidth="2" opacity="0.7" />
            </>
          );
        } else {
          // Mediterranean inland - olive groves and hills
          return (
            <>
              {/* Rolling hills */}
              <path 
                d={`M 0 ${height * 0.4}
                    C ${width * 0.3} ${height * 0.3} ${width * 0.6} ${height * 0.35} ${width} ${height * 0.4}
                    L ${width} ${height} L 0 ${height} Z`}
                fill={colors.accent}
                opacity="0.3"
              />
              
              <path 
                d={`M 0 ${height * 0.55}
                    Q ${width * 0.5} ${height * 0.45} ${width} ${height * 0.55}
                    L ${width} ${height} L 0 ${height} Z`}
                fill={colors.secondary}
                opacity="0.5"
              />
              
              {/* Olive trees and cypresses */}
              {Array.from({length: 12}, (_, i) => {
                const x = width * (i / 11);
                const isCypress = i % 3 === 0;
                if (isCypress) {
                  return (
                    <g key={i}>
                      <rect x={x - 2} y={height * 0.5} width="4" height="20" fill={colors.primary} opacity="0.6" />
                      <ellipse cx={x} cy={height * 0.45} rx="5" ry="12" fill={colors.secondary} opacity="0.7" />
                    </g>
                  );
                } else {
                  return (
                    <g key={i}>
                      <rect x={x - 1} y={height * 0.55} width="2" height="8" fill={colors.primary} opacity="0.5" />
                      <ellipse cx={x} cy={height * 0.52} rx="8" ry="6" fill={colors.secondary} opacity="0.6" />
                    </g>
                  );
                }
              })}
            </>
          );
        }

      case ClimateType.SEMITROPICAL:
      default:
        if (isWaterMap) {
          // Semitropical wetlands/bayou
          return (
            <>
              {/* Low hills */}
              <path 
                d={`M 0 ${height * 0.45}
                    C ${width * 0.4} ${height * 0.35} ${width * 0.7} ${height * 0.4} ${width} ${height * 0.45}
                    L ${width} ${height} L 0 ${height} Z`}
                fill={colors.accent}
                opacity="0.3"
              />
              
              {/* Mixed vegetation with Spanish moss */}
              {Array.from({length: 14}, (_, i) => (
                <g key={i}>
                  <rect x={width * (i / 13) - 2} y={height * 0.5} width="4" height="18" fill={colors.primary} opacity="0.5" />
                  <ellipse cx={width * (i / 13)} cy={height * 0.45} rx="10" ry="12" fill={colors.secondary} opacity="0.6" />
                  {/* Spanish moss */}
                  <path d={`M ${width * (i / 13) - 8} ${height * 0.48} Q ${width * (i / 13)} ${height * 0.52} ${width * (i / 13) + 8} ${height * 0.48}`}
                        stroke={colors.accent} strokeWidth="1" fill="none" opacity="0.4" strokeDasharray="2,1" />
                </g>
              ))}
              
              {/* Wetland water */}
              <rect x="0" y={height * 0.7} width={width} height={height * 0.3} fill={colors.water} opacity="0.4" />
              {/* Lily pads */}
              {[0.2, 0.4, 0.6, 0.8].map((x, i) => (
                <ellipse key={i} cx={width * x} cy={height * 0.73} rx="6" ry="3" fill={colors.secondary} opacity="0.3" />
              ))}
            </>
          );
        } else {
          // Semitropical savanna
          return (
            <>
              {/* Gentle hills */}
              <path 
                d={`M 0 ${height * 0.5}
                    Q ${width * 0.5} ${height * 0.4} ${width} ${height * 0.5}
                    L ${width} ${height} L 0 ${height} Z`}
                fill={colors.accent}
                opacity="0.35"
              />
              
              {/* Grassland */}
              <rect x="0" y={height * 0.65} width={width} height={height * 0.35} fill={colors.secondary} opacity="0.3" />
              
              {/* Scattered trees */}
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((x, i) => (
                <g key={i}>
                  <rect x={width * x - 2} y={height * 0.55} width="4" height="12" fill={colors.primary} opacity="0.6" />
                  <ellipse cx={width * x} cy={height * 0.5} rx="12" ry="10" fill={colors.secondary} opacity="0.7" />
                </g>
              ))}
            </>
          );
        }
    }
  }, [climate, colors, width, height, hasWater]);

  // Weather overlay effects
  const weatherOverlay = useMemo(() => {
    if (!weather) return null;

    if (weather.special === 'fog' || weather.special === 'mist') {
      const opacity = weather.special === 'fog' ? 0.6 : 0.3;
      return (
        <rect 
          x="0" 
          y="0" 
          width={width} 
          height={height} 
          fill="rgba(200, 200, 200, 1)" 
          opacity={opacity}
        />
      );
    }

    if (weather.precipitation === 'rain' || weather.precipitation === 'snow') {
      return (
        <rect 
          x="0" 
          y="0" 
          width={width} 
          height={height} 
          fill="rgba(150, 150, 150, 1)" 
          opacity="0.2"
        />
      );
    }

    return null;
  }, [weather, width, height]);

  // Read CSS variables from TimeAwareBackground
  const readCssVar = (name: string, fallback: string) => {
    if (typeof window === 'undefined') return fallback;
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return v || fallback;
  };

  // Sky colors derived from TimeAwareBackground
  const sky = useMemo(() => ({
    top: readCssVar('--sky-top', '#4A90E2'),
    mid: readCssVar('--sky-mid', '#87CEEB'),
    bottom: readCssVar('--sky-bottom', '#E6F3FF'),
    hazeDark: readCssVar('--sky-haze-dark', '#A8B6D1'),
    hazeLight: readCssVar('--sky-haze-light', '#CDD7EA'),
    water: readCssVar('--sky-water', '#4F7CA6'),
    fog: readCssVar('--sky-fog', '#B8C6DB'),
    mountainFar: readCssVar('--sky-mountain-far', '#6B7280'),
    mountainMid: readCssVar('--sky-mountain-mid', '#4B5563'),
    mountainNear: readCssVar('--sky-mountain-near', '#374151'),
  }), [timeOfDay, weather?.cloudCover, weather?.precipitation]);

  // Night-time overlay to ensure color consistency with TimeAwareBackground
  const nightOverlay = useMemo(() => {
    // Map TimeOfDay to the same color schemes used by TimeAwareBackground
    if (timeOfDay === 'Night') {
      // Deep night colors matching MIDNIGHT palette
      return {
        topColor: '#000814',     // Very deep blue (matching TimeAwareBackground MIDNIGHT)
        midColor: '#001d3d',     // Deep blue
        bottomColor: '#003566',  // Slightly lighter deep blue
        opacity: 0.85           // Strong overlay to unify colors
      };
    } else if (timeOfDay === 'Dusk') {
      // Dusk colors matching TimeAwareBackground
      return {
        topColor: '#1F2937',     // Dark blue-gray (matching TimeAwareBackground DUSK)
        midColor: '#2E3A5F',     // Twilight blue
        bottomColor: '#4B5C8A',  // Lighter twilight
        opacity: 0.6            // Moderate overlay for twilight transition
      };
    } else if (timeOfDay === 'Dawn') {
      // Dawn colors with darker top matching TimeAwareBackground
      return {
        topColor: '#2B3E5C',     // Darker blue at top (matching TimeAwareBackground DAWN)
        midColor: '#4a5568',     // Pre-dawn gray-blue
        bottomColor: '#5b4d6d',  // Purple-gray dawn
        opacity: 0.5            // Lighter overlay for dawn
      };
    }
    return null;
  }, [timeOfDay]);

  // Use new modular horizons for better quality
  const useNewHorizons = true; // Feature flag to switch between old and new
  
  // Detect if this is a water-based map that should show water on horizons
  const isWaterMap = mapType === MapArchetype.ISLAND || 
                     mapType === MapArchetype.BAY || 
                     mapType === MapArchetype.PENINSULA || 
                     mapType === MapArchetype.SHOALS ||
                     mapType === MapArchetype.ATOLL ||
                     mapType === MapArchetype.BARRIER_ISLAND ||
                     mapType === 'ISLAND' || 
                     mapType === 'BAY' || 
                     mapType === 'PENINSULA' || 
                     mapType === 'SHOALS' ||
                     mapType === 'ATOLL' ||
                     mapType === 'BARRIER_ISLAND';
  
  // Detect if this map has central water (delta, lake)
  const hasCentralWater = mapType === MapArchetype.DELTA || 
                          mapType === MapArchetype.FRESHWATER_LAKE ||
                          mapType === 'DELTA' || 
                          mapType === 'FRESHWATER_LAKE';
  
  if (useNewHorizons) {
    // Check for specific map types first
    if (mapType === MapArchetype.OPEN_OCEAN || mapType === 'OPEN_OCEAN') {
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <OpenOceanHorizon 
            timeOfDay={timeOfDay}
            width={width}
            height={height}
            sky={sky}
          />
          {/* Night/twilight overlay for color consistency */}
          {nightOverlay && (
            <svg 
              width={width} 
              height={height} 
              style={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0,
                pointerEvents: 'none'
              }}
            >
              <defs>
                <linearGradient id="night-overlay-gradient-ocean" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={nightOverlay.topColor} />
                  <stop offset="50%" stopColor={nightOverlay.midColor} />
                  <stop offset="100%" stopColor={nightOverlay.bottomColor} />
                </linearGradient>
              </defs>
              <rect 
                x="0" 
                y="0" 
                width={width} 
                height={height} 
                fill="url(#night-overlay-gradient-ocean)"
                opacity={nightOverlay.opacity}
              />
            </svg>
          )}
          {weatherOverlay && (
            <svg width={width} height={height} style={{ position: 'absolute', bottom: 0, left: 0 }}>
              {weatherOverlay}
            </svg>
          )}
        </div>
      );
    }
    
    if (mapType === MapArchetype.SHOALS || mapType === 'SHOALS') {
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <ShoalsHorizon 
            timeOfDay={timeOfDay}
            width={width}
            height={height}
            sky={sky}
          />
          {/* Night/twilight overlay for color consistency */}
          {nightOverlay && (
            <svg 
              width={width} 
              height={height} 
              style={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0,
                pointerEvents: 'none'
              }}
            >
              <defs>
                <linearGradient id="night-overlay-gradient-shoals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={nightOverlay.topColor} />
                  <stop offset="50%" stopColor={nightOverlay.midColor} />
                  <stop offset="100%" stopColor={nightOverlay.bottomColor} />
                </linearGradient>
              </defs>
              <rect 
                x="0" 
                y="0" 
                width={width} 
                height={height} 
                fill="url(#night-overlay-gradient-shoals)"
                opacity={nightOverlay.opacity}
              />
            </svg>
          )}
          {weatherOverlay && (
            <svg width={width} height={height} style={{ position: 'absolute', bottom: 0, left: 0 }}>
              {weatherOverlay}
            </svg>
          )}
        </div>
      );
    }
    
    // Use the new high-quality modular horizons based on climate
    switch(climate) {
      case ClimateType.TEMPERATE:
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <TemperateHorizon 
              timeOfDay={timeOfDay}
              weather={weather}
              width={width}
              height={height}
              hasWater={isWaterMap}
              hasCentralWater={hasCentralWater}
              isUrban={hasCities}
              sky={sky}
            />
            {/* Night/twilight overlay for color consistency */}
            {nightOverlay && (
              <svg 
                width={width} 
                height={height} 
                style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0,
                  pointerEvents: 'none'
                }}
              >
                <defs>
                  <linearGradient id="night-overlay-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={nightOverlay.topColor} />
                    <stop offset="50%" stopColor={nightOverlay.midColor} />
                    <stop offset="100%" stopColor={nightOverlay.bottomColor} />
                  </linearGradient>
                </defs>
                <rect 
                  x="0" 
                  y="0" 
                  width={width} 
                  height={height} 
                  fill="url(#night-overlay-gradient)"
                  opacity={nightOverlay.opacity}
                />
              </svg>
            )}
            {weatherOverlay && (
              <svg width={width} height={height} style={{ position: 'absolute', bottom: 0, left: 0 }}>
                {weatherOverlay}
              </svg>
            )}
          </div>
        );
      
      case ClimateType.TROPICAL:
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <TropicalHorizon 
              timeOfDay={timeOfDay}
              weather={weather}
              width={width}
              height={height}
              hasWater={isWaterMap}
              hasCentralWater={hasCentralWater}
              isUrban={hasCities}
              hasVolcano={hasVolcano}
              sky={sky}
            />
            {/* Night/twilight overlay for color consistency */}
            {nightOverlay && (
              <svg 
                width={width} 
                height={height} 
                style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0,
                  pointerEvents: 'none'
                }}
              >
                <defs>
                  <linearGradient id="night-overlay-gradient-tropical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={nightOverlay.topColor} />
                    <stop offset="50%" stopColor={nightOverlay.midColor} />
                    <stop offset="100%" stopColor={nightOverlay.bottomColor} />
                  </linearGradient>
                </defs>
                <rect 
                  x="0" 
                  y="0" 
                  width={width} 
                  height={height} 
                  fill="url(#night-overlay-gradient-tropical)"
                  opacity={nightOverlay.opacity}
                />
              </svg>
            )}
            {weatherOverlay && (
              <svg width={width} height={height} style={{ position: 'absolute', bottom: 0, left: 0 }}>
                {weatherOverlay}
              </svg>
            )}
          </div>
        );
      
      case ClimateType.ARID:
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <AridHorizon 
              timeOfDay={timeOfDay}
              weather={weather}
              width={width}
              height={height}
              hasWater={isWaterMap}
              hasCentralWater={hasCentralWater}
              isUrban={hasCities}
              sky={sky}
            />
            {/* Night/twilight overlay for color consistency */}
            {nightOverlay && (
              <svg 
                width={width} 
                height={height} 
                style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0,
                  pointerEvents: 'none'
                }}
              >
                <defs>
                  <linearGradient id="night-overlay-gradient-arid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={nightOverlay.topColor} />
                    <stop offset="50%" stopColor={nightOverlay.midColor} />
                    <stop offset="100%" stopColor={nightOverlay.bottomColor} />
                  </linearGradient>
                </defs>
                <rect 
                  x="0" 
                  y="0" 
                  width={width} 
                  height={height} 
                  fill="url(#night-overlay-gradient-arid)"
                  opacity={nightOverlay.opacity}
                />
              </svg>
            )}
            {weatherOverlay && (
              <svg width={width} height={height} style={{ position: 'absolute', bottom: 0, left: 0 }}>
                {weatherOverlay}
              </svg>
            )}
          </div>
        );
      
      case ClimateType.COLD:
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <ColdHorizon 
              timeOfDay={timeOfDay}
              weather={weather}
              width={width}
              height={height}
              hasWater={isWaterMap}
              hasCentralWater={hasCentralWater}
              isUrban={hasCities}
              sky={sky}
            />
            {/* Night/twilight overlay for color consistency */}
            {nightOverlay && (
              <svg 
                width={width} 
                height={height} 
                style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0,
                  pointerEvents: 'none'
                }}
              >
                <defs>
                  <linearGradient id="night-overlay-gradient-cold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={nightOverlay.topColor} />
                    <stop offset="50%" stopColor={nightOverlay.midColor} />
                    <stop offset="100%" stopColor={nightOverlay.bottomColor} />
                  </linearGradient>
                </defs>
                <rect 
                  x="0" 
                  y="0" 
                  width={width} 
                  height={height} 
                  fill="url(#night-overlay-gradient-cold)"
                  opacity={nightOverlay.opacity}
                />
              </svg>
            )}
            {weatherOverlay && (
              <svg width={width} height={height} style={{ position: 'absolute', bottom: 0, left: 0 }}>
                {weatherOverlay}
              </svg>
            )}
          </div>
        );
      
      case ClimateType.MEDITERRANEAN:
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <MediterraneanHorizon 
              timeOfDay={timeOfDay}
              weather={weather}
              width={width}
              height={height}
              hasWater={isWaterMap}
              hasCentralWater={hasCentralWater}
              isUrban={hasCities}
              sky={sky}
            />
            {/* Night/twilight overlay for color consistency */}
            {nightOverlay && (
              <svg 
                width={width} 
                height={height} 
                style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0,
                  pointerEvents: 'none'
                }}
              >
                <defs>
                  <linearGradient id="night-overlay-gradient-med" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={nightOverlay.topColor} />
                    <stop offset="50%" stopColor={nightOverlay.midColor} />
                    <stop offset="100%" stopColor={nightOverlay.bottomColor} />
                  </linearGradient>
                </defs>
                <rect 
                  x="0" 
                  y="0" 
                  width={width} 
                  height={height} 
                  fill="url(#night-overlay-gradient-med)"
                  opacity={nightOverlay.opacity}
                />
              </svg>
            )}
            {weatherOverlay && (
              <svg width={width} height={height} style={{ position: 'absolute', bottom: 0, left: 0 }}>
                {weatherOverlay}
              </svg>
            )}
          </div>
        );
      
      case ClimateType.SEMITROPICAL:
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <SemitropicalHorizon 
              timeOfDay={timeOfDay}
              weather={weather}
              width={width}
              height={height}
              hasWater={isWaterMap}
              hasCentralWater={hasCentralWater}
              isUrban={hasCities}
              sky={sky}
            />
            {/* Night/twilight overlay for color consistency */}
            {nightOverlay && (
              <svg 
                width={width} 
                height={height} 
                style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0,
                  pointerEvents: 'none'
                }}
              >
                <defs>
                  <linearGradient id="night-overlay-gradient-semi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={nightOverlay.topColor} />
                    <stop offset="50%" stopColor={nightOverlay.midColor} />
                    <stop offset="100%" stopColor={nightOverlay.bottomColor} />
                  </linearGradient>
                </defs>
                <rect 
                  x="0" 
                  y="0" 
                  width={width} 
                  height={height} 
                  fill="url(#night-overlay-gradient-semi)"
                  opacity={nightOverlay.opacity}
                />
              </svg>
            )}
            {weatherOverlay && (
              <svg width={width} height={height} style={{ position: 'absolute', bottom: 0, left: 0 }}>
                {weatherOverlay}
              </svg>
            )}
          </div>
        );
      
      // This should never happen now that all climates are implemented
      default:
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg 
              width={width} 
              height={height} 
              style={{ 
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
            >
              {horizonSvg}
              {weatherOverlay}
            </svg>
          </div>
        );
    }
  }
  
  // Original implementation as fallback
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg 
        width={width} 
        height={height} 
        style={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      >
        {horizonSvg}
        {weatherOverlay}
      </svg>
    </div>
  );
};

export default HorizonLayer;