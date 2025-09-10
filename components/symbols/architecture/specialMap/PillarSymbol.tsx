/**
 * PillarSymbol.tsx - Multi-tile culturally-specific pillars
 * Supports base, middle (1-3 tiles), and top sections for imposing architecture
 */
import React from 'react';
// Material type for pillar variations
type MaterialType = 'white_marble' | 'grey_stone' | 'red_lacquer' | 'sandstone' | 'wood' | 'steel';

interface PillarSymbolProps {
  x: number;
  y: number;
  size: number;
  section: 'base' | 'middle' | 'top';
  material?: MaterialType;
  culturalZone?: string;
  era?: number;
  opacity?: number;
}

const PillarSymbol: React.FC<PillarSymbolProps> = ({ 
  x, 
  y, 
  size, 
  section,
  material = 'grey_stone',
  culturalZone = 'EUROPEAN',
  era = 1500,
  opacity = 1.0 
}) => {
  // Get material colors
  const getMaterialColors = () => {
    const materials: Record<MaterialType, { main: string; light: string; dark: string; accent: string }> = {
      'white_marble': {
        main: '#f8f4ed',
        light: '#ffffff',
        dark: '#d0c4a8',
        accent: '#e8e0d0'
      },
      'grey_stone': {
        main: '#8a8578',
        light: '#a09a8c',
        dark: '#524e47',
        accent: '#6b665e'
      },
      'red_lacquer': {
        main: '#8b2c1b',
        light: '#a03828',
        dark: '#4a0f08',
        accent: '#6b1810'
      },
      'sandstone': {
        main: '#d4a574',
        light: '#e4b584',
        dark: '#a67c4b',
        accent: '#c4925f'
      },
      'wood': {
        main: '#7a5d3a',
        light: '#8a6d4a',
        dark: '#3e2e1c',
        accent: '#5c452b'
      },
      'steel': {
        main: '#b4c7d4',
        light: '#d4e7f4',
        dark: '#647380',
        accent: '#8a9ca8'
      }
    };
    return materials[material] || materials['grey_stone'];
  };

  const colors = getMaterialColors();

  // Culture-specific pillar styles
  const getPillarStyle = () => {
    switch (culturalZone?.toUpperCase()) {
      case 'EAST_ASIAN':
        return renderAsianPillar();
      case 'MENA':
      case 'AFRICAN':
        return renderIslamicPillar();
      case 'AMERICAS':
        return renderMesoamericanPillar();
      case 'OCEANIA':
        return renderPacificPillar();
      default: // EUROPEAN
        return renderClassicalPillar();
    }
  };

  const renderClassicalPillar = () => {
    switch (section) {
      case 'base':
        return (
          <g>
            {/* Wide base platform */}
            <rect x={size*0.1} y={size*0.85} width={size*0.8} height={size*0.15} fill={colors.dark} />
            <rect x={size*0.1} y={size*0.83} width={size*0.8} height={3} fill={colors.main} />
            
            {/* Torus (round molding) */}
            <ellipse cx={size/2} cy={size*0.8} rx={size*0.35} ry={size*0.08} fill={colors.main} />
            <ellipse cx={size/2} cy={size*0.78} rx={size*0.35} ry={size*0.08} fill={colors.light} />
            
            {/* Column shaft start */}
            <rect x={size*0.25} y={size*0.2} width={size*0.5} height={size*0.6} fill={colors.main} />
            
            {/* Fluting (vertical grooves) */}
            {[0.3, 0.4, 0.5, 0.6, 0.7].map(xPos => (
              <rect key={xPos} x={size*xPos-1} y={size*0.2} width={2} height={size*0.6} fill={colors.dark} opacity={0.3} />
            ))}
            
            {/* Top connection */}
            <rect x={size*0.25} y={0} width={size*0.5} height={size*0.2} fill={colors.main} />
            
            {/* Shadows and highlights */}
            <rect x={size*0.25} y={size*0.2} width={3} height={size*0.6} fill="white" opacity={0.2} />
            <rect x={size*0.72} y={size*0.2} width={3} height={size*0.6} fill="black" opacity={0.2} />
          </g>
        );
      
      case 'middle':
        return (
          <g>
            {/* Continuous shaft */}
            <rect x={size*0.25} y={0} width={size*0.5} height={size} fill={colors.main} />
            
            {/* Fluting continues */}
            {[0.3, 0.4, 0.5, 0.6, 0.7].map(xPos => (
              <rect key={xPos} x={size*xPos-1} y={0} width={2} height={size} fill={colors.dark} opacity={0.3} />
            ))}
            
            {/* Light and shadow */}
            <rect x={size*0.25} y={0} width={3} height={size} fill="white" opacity={0.2} />
            <rect x={size*0.72} y={0} width={3} height={size} fill="black" opacity={0.2} />
            
            {/* Entasis (slight bulge) for realism */}
            <ellipse cx={size/2} cy={size/2} rx={size*0.26} ry={size*0.5} fill={colors.main} opacity={0.1} />
          </g>
        );
      
      case 'top':
        return (
          <g>
            {/* Bottom of capital - connects to shaft */}
            <rect x={size*0.25} y={size*0.8} width={size*0.5} height={size*0.2} fill={colors.main} />
            
            {/* Necking */}
            <rect x={size*0.2} y={size*0.75} width={size*0.6} height={size*0.05} fill={colors.accent} />
            
            {/* Capital - Corinthian style with scrolls */}
            <path 
              d={`M ${size*0.15} ${size*0.7}
                  Q ${size*0.1} ${size*0.5}, ${size*0.2} ${size*0.4}
                  L ${size*0.8} ${size*0.4}
                  Q ${size*0.9} ${size*0.5}, ${size*0.85} ${size*0.7}
                  Z`}
              fill={colors.main}
            />
            
            {/* Volutes (scrolls) */}
            <circle cx={size*0.25} cy={size*0.5} r={size*0.08} fill="none" stroke={colors.dark} strokeWidth={1.5} />
            <circle cx={size*0.75} cy={size*0.5} r={size*0.08} fill="none" stroke={colors.dark} strokeWidth={1.5} />
            
            {/* Abacus (top square) */}
            <rect x={size*0.1} y={size*0.3} width={size*0.8} height={size*0.1} fill={colors.main} />
            <rect x={size*0.08} y={size*0.25} width={size*0.84} height={size*0.05} fill={colors.light} />
            
            {/* Decorative leaves */}
            {era > 0 && (
              <g opacity={0.4}>
                <path d={`M ${size*0.4} ${size*0.6} Q ${size*0.35} ${size*0.5}, ${size*0.4} ${size*0.45}`} 
                      stroke={colors.accent} strokeWidth={1} fill="none" />
                <path d={`M ${size*0.6} ${size*0.6} Q ${size*0.65} ${size*0.5}, ${size*0.6} ${size*0.45}`} 
                      stroke={colors.accent} strokeWidth={1} fill="none" />
              </g>
            )}
          </g>
        );
    }
  };

  const renderAsianPillar = () => {
    switch (section) {
      case 'base':
        return (
          <g>
            {/* Stone base platform */}
            <rect x={size*0.05} y={size*0.9} width={size*0.9} height={size*0.1} fill={colors.dark} />
            <rect x={size*0.1} y={size*0.85} width={size*0.8} height={size*0.05} fill={colors.main} />
            
            {/* Decorative lotus base */}
            <ellipse cx={size/2} cy={size*0.82} rx={size*0.4} ry={size*0.06} fill={colors.accent} />
            {[0.3, 0.4, 0.5, 0.6, 0.7].map(xPos => (
              <ellipse key={xPos} cx={size*xPos} cy={size*0.78} rx={size*0.05} ry={size*0.03} fill={colors.light} />
            ))}
            
            {/* Shaft with taper */}
            <polygon 
              points={`${size*0.3},${size*0.75} ${size*0.7},${size*0.75} ${size*0.65},0 ${size*0.35},0`}
              fill={colors.main}
            />
            
            {/* Lacquer shine effect */}
            {material === 'red_lacquer' && (
              <rect x={size*0.35} y={0} width={3} height={size*0.75} fill="white" opacity={0.3} />
            )}
          </g>
        );
      
      case 'middle':
        return (
          <g>
            {/* Tapered shaft continues */}
            <polygon 
              points={`${size*0.35},${size} ${size*0.65},${size} ${size*0.62},0 ${size*0.38},0`}
              fill={colors.main}
            />
            
            {/* Decorative bands */}
            <rect x={size*0.3} y={size*0.45} width={size*0.4} height={size*0.1} fill={colors.accent} opacity={0.5} />
            
            {/* Wood grain or lacquer effect */}
            {material === 'wood' && (
              <g opacity={0.2}>
                <line x1={size*0.35} y1={size*0.2} x2={size*0.38} y2={0} stroke={colors.dark} strokeWidth={0.5} />
                <line x1={size*0.65} y1={size*0.2} x2={size*0.62} y2={0} stroke={colors.dark} strokeWidth={0.5} />
              </g>
            )}
            
            {/* Highlight */}
            <polygon 
              points={`${size*0.38},${size} ${size*0.41},${size} ${size*0.39},0 ${size*0.38},0`}
              fill="white" 
              opacity={0.2}
            />
          </g>
        );
      
      case 'top':
        return (
          <g>
            {/* Bottom connection */}
            <polygon 
              points={`${size*0.38},${size} ${size*0.62},${size} ${size*0.6},${size*0.8} ${size*0.4},${size*0.8}`}
              fill={colors.main}
            />
            
            {/* Bracket system (dougong) */}
            <rect x={size*0.2} y={size*0.65} width={size*0.6} height={size*0.08} fill={colors.accent} />
            <rect x={size*0.15} y={size*0.57} width={size*0.7} height={size*0.08} fill={colors.main} />
            <rect x={size*0.1} y={size*0.49} width={size*0.8} height={size*0.08} fill={colors.accent} />
            
            {/* Decorative brackets */}
            {[0.2, 0.4, 0.6, 0.8].map(xPos => (
              <polygon key={xPos}
                points={`${size*xPos},${size*0.49} ${size*(xPos+0.1)},${size*0.49} ${size*(xPos+0.05)},${size*0.4}`}
                fill={colors.dark}
                opacity={0.5}
              />
            ))}
            
            {/* Top platform */}
            <rect x={size*0.05} y={size*0.35} width={size*0.9} height={size*0.05} fill={colors.main} />
            <rect x={size*0.03} y={size*0.3} width={size*0.94} height={size*0.05} fill={colors.light} />
          </g>
        );
    }
  };

  const renderIslamicPillar = () => {
    switch (section) {
      case 'base':
        return (
          <g>
            {/* Octagonal base */}
            <polygon 
              points={`${size*0.3},${size} ${size*0.7},${size} ${size*0.85},${size*0.85} ${size*0.85},${size*0.7} ${size*0.7},${size*0.55} ${size*0.3},${size*0.55} ${size*0.15},${size*0.7} ${size*0.15},${size*0.85}`}
              fill={colors.dark}
            />
            
            {/* Decorative star pattern */}
            <polygon 
              points={`${size/2},${size*0.65} ${size*0.6},${size*0.7} ${size*0.65},${size*0.8} ${size*0.6},${size*0.9} ${size/2},${size*0.85} ${size*0.4},${size*0.9} ${size*0.35},${size*0.8} ${size*0.4},${size*0.7}`}
              fill={colors.accent}
              opacity={0.5}
            />
            
            {/* Column shaft */}
            <rect x={size*0.3} y={0} width={size*0.4} height={size*0.65} fill={colors.main} />
            
            {/* Geometric patterns */}
            <rect x={size*0.3} y={size*0.2} width={size*0.4} height={2} fill={colors.accent} opacity={0.4} />
            <rect x={size*0.3} y={size*0.4} width={size*0.4} height={2} fill={colors.accent} opacity={0.4} />
          </g>
        );
      
      case 'middle':
        return (
          <g>
            {/* Straight shaft with patterns */}
            <rect x={size*0.3} y={0} width={size*0.4} height={size} fill={colors.main} />
            
            {/* Arabesque patterns */}
            <path 
              d={`M ${size*0.35} ${size*0.2} Q ${size*0.4} ${size*0.3}, ${size*0.5} ${size*0.3} Q ${size*0.6} ${size*0.3}, ${size*0.65} ${size*0.2}`}
              fill="none" 
              stroke={colors.accent} 
              strokeWidth={1} 
              opacity={0.4}
            />
            <path 
              d={`M ${size*0.35} ${size*0.7} Q ${size*0.4} ${size*0.8}, ${size*0.5} ${size*0.8} Q ${size*0.6} ${size*0.8}, ${size*0.65} ${size*0.7}`}
              fill="none" 
              stroke={colors.accent} 
              strokeWidth={1} 
              opacity={0.4}
            />
            
            {/* Calligraphic band */}
            <rect x={size*0.3} y={size*0.45} width={size*0.4} height={size*0.1} fill={colors.accent} opacity={0.3} />
            
            {/* Light effect */}
            <rect x={size*0.3} y={0} width={3} height={size} fill="white" opacity={0.15} />
          </g>
        );
      
      case 'top':
        return (
          <g>
            {/* Muqarnas (honeycomb) capital */}
            {[0.7, 0.6, 0.5, 0.4].map((yPos, i) => (
              <g key={yPos}>
                <rect 
                  x={size*(0.3-i*0.05)} 
                  y={size*yPos} 
                  width={size*(0.4+i*0.1)} 
                  height={size*0.08} 
                  fill={colors.main}
                />
                {/* Honeycomb cells */}
                {[0.3, 0.4, 0.5, 0.6, 0.7].map(xPos => (
                  <polygon key={`${yPos}-${xPos}`}
                    points={`${size*xPos},${size*yPos} ${size*(xPos+0.05)},${size*(yPos+0.04)} ${size*xPos},${size*(yPos+0.08)} ${size*(xPos-0.05)},${size*(yPos+0.04)}`}
                    fill={colors.accent}
                    opacity={0.3}
                  />
                ))}
              </g>
            ))}
            
            {/* Top platform */}
            <rect x={size*0.05} y={size*0.35} width={size*0.9} height={size*0.05} fill={colors.main} />
            <rect x={size*0.03} y={size*0.3} width={size*0.94} height={size*0.05} fill={colors.light} />
            
            {/* Star decoration */}
            <polygon 
              points={`${size/2},${size*0.15} ${size*0.55},${size*0.2} ${size*0.6},${size*0.15} ${size*0.55},${size*0.1} ${size/2},${size*0.05} ${size*0.45},${size*0.1} ${size*0.4},${size*0.15} ${size*0.45},${size*0.2}`}
              fill={colors.accent}
              opacity={0.5}
            />
          </g>
        );
    }
  };

  const renderMesoamericanPillar = () => {
    switch (section) {
      case 'base':
        return (
          <g>
            {/* Stepped pyramid base */}
            <rect x={size*0.1} y={size*0.9} width={size*0.8} height={size*0.1} fill={colors.dark} />
            <rect x={size*0.15} y={size*0.8} width={size*0.7} height={size*0.1} fill={colors.main} />
            <rect x={size*0.2} y={size*0.7} width={size*0.6} height={size*0.1} fill={colors.accent} />
            
            {/* Square shaft */}
            <rect x={size*0.25} y={0} width={size*0.5} height={size*0.7} fill={colors.main} />
            
            {/* Glyph carvings */}
            <rect x={size*0.35} y={size*0.3} width={size*0.3} height={size*0.2} fill={colors.dark} opacity={0.3} />
            <path d={`M ${size*0.4} ${size*0.35} L ${size*0.45} ${size*0.4} L ${size*0.4} ${size*0.45}`} 
                  stroke={colors.accent} strokeWidth={1} fill="none" opacity={0.5} />
          </g>
        );
      
      case 'middle':
        return (
          <g>
            {/* Straight shaft */}
            <rect x={size*0.25} y={0} width={size*0.5} height={size} fill={colors.main} />
            
            {/* Feathered serpent carving */}
            <path 
              d={`M ${size*0.3} ${size*0.2} 
                  Q ${size*0.35} ${size*0.3}, ${size*0.5} ${size*0.3}
                  Q ${size*0.65} ${size*0.3}, ${size*0.7} ${size*0.4}
                  Q ${size*0.65} ${size*0.5}, ${size*0.5} ${size*0.5}
                  Q ${size*0.35} ${size*0.5}, ${size*0.3} ${size*0.6}`}
              fill="none" 
              stroke={colors.dark} 
              strokeWidth={1.5} 
              opacity={0.4}
            />
            
            {/* Stone texture */}
            <rect x={size*0.25} y={size*0.4} width={size*0.5} height={1} fill={colors.dark} opacity={0.2} />
            <rect x={size*0.25} y={size*0.6} width={size*0.5} height={1} fill={colors.dark} opacity={0.2} />
          </g>
        );
      
      case 'top':
        return (
          <g>
            {/* Connection */}
            <rect x={size*0.25} y={size*0.8} width={size*0.5} height={size*0.2} fill={colors.main} />
            
            {/* Stepped capital */}
            <rect x={size*0.2} y={size*0.65} width={size*0.6} height={size*0.15} fill={colors.accent} />
            <rect x={size*0.15} y={size*0.5} width={size*0.7} height={size*0.15} fill={colors.main} />
            <rect x={size*0.1} y={size*0.35} width={size*0.8} height={size*0.15} fill={colors.accent} />
            
            {/* Jaguar head decoration */}
            {era > 0 && (
              <g opacity={0.5}>
                <circle cx={size*0.35} cy={size*0.25} r={size*0.05} fill={colors.dark} />
                <circle cx={size*0.65} cy={size*0.25} r={size*0.05} fill={colors.dark} />
                <path d={`M ${size*0.4} ${size*0.15} Q ${size*0.5} ${size*0.1}, ${size*0.6} ${size*0.15}`} 
                      stroke={colors.dark} strokeWidth={2} fill="none" />
              </g>
            )}
          </g>
        );
    }
  };

  const renderPacificPillar = () => {
    // Simplified Pacific/Oceanic style - carved wood totems
    switch (section) {
      case 'base':
        return (
          <g>
            {/* Wide carved base */}
            <rect x={size*0.2} y={size*0.8} width={size*0.6} height={size*0.2} fill={colors.dark} />
            
            {/* Tiki-style carving */}
            <rect x={size*0.3} y={0} width={size*0.4} height={size*0.8} fill={colors.main} />
            
            {/* Face carving */}
            <circle cx={size*0.4} cy={size*0.4} r={size*0.05} fill={colors.dark} opacity={0.5} />
            <circle cx={size*0.6} cy={size*0.4} r={size*0.05} fill={colors.dark} opacity={0.5} />
            <rect x={size*0.45} y={size*0.5} width={size*0.1} height={size*0.15} fill={colors.dark} opacity={0.4} />
          </g>
        );
      
      case 'middle':
        return (
          <g>
            {/* Carved shaft */}
            <rect x={size*0.3} y={0} width={size*0.4} height={size} fill={colors.main} />
            
            {/* Wave patterns */}
            <path d={`M ${size*0.3} ${size*0.3} Q ${size*0.4} ${size*0.25}, ${size*0.5} ${size*0.3} T ${size*0.7} ${size*0.3}`} 
                  stroke={colors.accent} strokeWidth={1.5} fill="none" opacity={0.4} />
            <path d={`M ${size*0.3} ${size*0.7} Q ${size*0.4} ${size*0.65}, ${size*0.5} ${size*0.7} T ${size*0.7} ${size*0.7}`} 
                  stroke={colors.accent} strokeWidth={1.5} fill="none" opacity={0.4} />
          </g>
        );
      
      case 'top':
        return (
          <g>
            {/* Carved top */}
            <rect x={size*0.3} y={size*0.6} width={size*0.4} height={size*0.4} fill={colors.main} />
            
            {/* Traditional patterns */}
            <circle cx={size/2} cy={size*0.4} r={size*0.15} fill="none" stroke={colors.accent} strokeWidth={2} opacity={0.4} />
            <path d={`M ${size*0.35} ${size*0.4} Q ${size*0.5} ${size*0.3}, ${size*0.65} ${size*0.4}`} 
                  stroke={colors.accent} strokeWidth={1.5} fill="none" opacity={0.4} />
          </g>
        );
    }
  };

  return (
    <svg 
      x={x} 
      y={y} 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: 'visible' }}
    >
      <g opacity={opacity}>
        {getPillarStyle()}
      </g>
    </svg>
  );
};

export default PillarSymbol;