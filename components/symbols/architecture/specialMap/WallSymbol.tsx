/**
 * WallSymbol.tsx - Culture-specific wall rendering
 * Stardew Valley inspired with dollhouse perspective
 */
import React from 'react';
// Material type for wall variations
type MaterialType = 'white_marble' | 'grey_stone' | 'red_lacquer' | 'sandstone' | 'wood' | 'steel';

interface WallSymbolProps {
  x: number;
  y: number;
  size: number;
  material?: MaterialType;
  culturalZone?: string;
  era?: number;
  opacity?: number;
}

const WallSymbol: React.FC<WallSymbolProps> = ({ 
  x, 
  y, 
  size, 
  material = 'grey_stone',
  culturalZone = 'EUROPEAN',
  era = 1500,
  opacity = 1.0 
}) => {
  // Determine style based on culture and material
  const getWallStyle = () => {
    const baseStyles: Record<MaterialType, {
      primary: string;
      secondary: string;
      accent: string;
      texture: string;
    }> = {
      'white_marble': {
        primary: '#f8f4ed',
        secondary: '#e8e0d0',
        accent: '#d0c4a8',
        texture: 'smooth'
      },
      'grey_stone': {
        primary: '#8a8578',
        secondary: '#6b665e',
        accent: '#524e47',
        texture: 'rough'
      },
      'red_lacquer': {
        primary: '#8b2c1b',
        secondary: '#6b1810',
        accent: '#4a0f08',
        texture: 'glossy'
      },
      'sandstone': {
        primary: '#d4a574',
        secondary: '#c4925f',
        accent: '#a67c4b',
        texture: 'grainy'
      },
      'wood': {
        primary: '#7a5d3a',
        secondary: '#5c452b',
        accent: '#3e2e1c',
        texture: 'wooden'
      },
      'steel': {
        primary: '#b4c7d4',
        secondary: '#8a9ca8',
        accent: '#647380',
        texture: 'metallic'
      }
    };

    return baseStyles[material] || baseStyles['grey_stone'];
  };

  const style = getWallStyle();
  const renderWall = () => {
    // Culture-specific decorative patterns
    const getCulturePattern = () => {
      switch (culturalZone?.toUpperCase()) {
        case 'EAST_ASIAN':
          // Chinese/Japanese style with lattice patterns
          return (
            <g>
              {/* Lattice pattern */}
              <rect x={2} y={2} width={size-4} height={2} fill={style.accent} opacity={0.3} />
              <rect x={2} y={size-4} width={size-4} height={2} fill={style.accent} opacity={0.3} />
              <rect x={size/3} y={0} width={2} height={size} fill={style.accent} opacity={0.2} />
              <rect x={2*size/3} y={0} width={2} height={size} fill={style.accent} opacity={0.2} />
            </g>
          );
        
        case 'MENA':
        case 'AFRICAN':
          // Islamic/African geometric patterns
          return (
            <g>
              {/* Geometric star pattern */}
              <polygon 
                points={`${size/2},${size/4} ${3*size/4},${size/2} ${size/2},${3*size/4} ${size/4},${size/2}`}
                fill={style.accent} 
                opacity={0.2} 
              />
              <circle cx={size/2} cy={size/2} r={size/6} fill="none" stroke={style.accent} strokeWidth={1} opacity={0.3} />
            </g>
          );
        
        case 'AMERICAS':
          // Mesoamerican step patterns
          return (
            <g>
              {/* Step/pyramid pattern */}
              <rect x={size/4} y={2} width={size/2} height={3} fill={style.accent} opacity={0.3} />
              <rect x={size/3} y={5} width={size/3} height={3} fill={style.accent} opacity={0.25} />
              <rect x={5*size/12} y={8} width={size/6} height={3} fill={style.accent} opacity={0.2} />
            </g>
          );
        
        case 'OCEANIA':
          // Pacific wave/spiral patterns
          return (
            <g>
              {/* Wave pattern */}
              <path 
                d={`M 0,${size/2} Q ${size/4},${size/3} ${size/2},${size/2} T ${size},${size/2}`}
                fill="none" 
                stroke={style.accent} 
                strokeWidth={2} 
                opacity={0.25} 
              />
            </g>
          );
        
        default: // EUROPEAN
          // Classical European brick/stone pattern
          return (
            <g>
              {/* Brick pattern */}
              <rect x={0} y={size/4} width={size/2-1} height={3} fill={style.accent} opacity={0.2} />
              <rect x={size/2+1} y={size/4} width={size/2-1} height={3} fill={style.accent} opacity={0.2} />
              <rect x={size/4} y={size/2} width={size/2} height={3} fill={style.accent} opacity={0.2} />
              <rect x={0} y={3*size/4} width={size/2-1} height={3} fill={style.accent} opacity={0.2} />
              <rect x={size/2+1} y={3*size/4} width={size/2-1} height={3} fill={style.accent} opacity={0.2} />
            </g>
          );
      }
    };

    // Material-specific textures
    const getMaterialTexture = () => {
      switch (material) {
        case 'white_marble':
          // Marble veining
          return (
            <g opacity={0.15}>
              <path d={`M 0,${size/3} Q ${size/2},${size/2} ${size},${size/4}`} 
                    stroke={style.accent} strokeWidth={1} fill="none" />
              <path d={`M ${size/4},0 Q ${size/2},${size/3} ${3*size/4},${size}`} 
                    stroke={style.accent} strokeWidth={0.5} fill="none" />
            </g>
          );
        
        case 'wood':
          // Wood grain
          return (
            <g opacity={0.2}>
              <line x1={0} y1={size/3} x2={size} y2={size/3} stroke={style.accent} strokeWidth={1} />
              <line x1={0} y1={2*size/3} x2={size} y2={2*size/3} stroke={style.accent} strokeWidth={1} />
              <path d={`M 0,${size/2} Q ${size/4},${size/2-2} ${size/2},${size/2}`} 
                    stroke={style.accent} strokeWidth={0.5} fill="none" />
            </g>
          );
        
        case 'steel':
          // Metallic rivets
          return (
            <g>
              <circle cx={4} cy={4} r={1.5} fill={style.accent} opacity={0.4} />
              <circle cx={size-4} cy={4} r={1.5} fill={style.accent} opacity={0.4} />
              <circle cx={4} cy={size-4} r={1.5} fill={style.accent} opacity={0.4} />
              <circle cx={size-4} cy={size-4} r={1.5} fill={style.accent} opacity={0.4} />
            </g>
          );
        
        default:
          return null;
      }
    };

    return (
      <g transform={`translate(${x}, ${y})`} opacity={opacity}>
        {/* Main wall body with 3D effect */}
        <rect 
          x={0} 
          y={0} 
          width={size} 
          height={size} 
          fill={style.primary}
        />
        
        {/* Top edge (lighter) - dollhouse perspective */}
        <rect 
          x={0} 
          y={0} 
          width={size} 
          height={4} 
          fill={style.secondary}
          opacity={0.7}
        />
        
        {/* Right edge (darker) - cast shadow */}
        <rect 
          x={size-3} 
          y={0} 
          width={3} 
          height={size} 
          fill={style.accent}
          opacity={0.5}
        />
        
        {/* Bottom edge (darkest) - ground shadow */}
        <rect 
          x={0} 
          y={size-2} 
          width={size} 
          height={2} 
          fill={style.accent}
          opacity={0.6}
        />
        
        {/* Material texture */}
        {getMaterialTexture()}
        
        {/* Cultural decorative pattern */}
        {getCulturePattern()}
        
        {/* Highlight for 3D effect */}
        <rect 
          x={1} 
          y={1} 
          width={size-2} 
          height={2} 
          fill="white"
          opacity={0.15}
        />
        
        {/* Era-specific details */}
        {era < 0 && ( // Prehistoric - rough edges
          <rect x={0} y={0} width={size} height={size} 
                fill="none" stroke={style.accent} 
                strokeWidth={1} strokeDasharray="2,3" opacity={0.3} />
        )}
        
        {era > 1950 && material === 'steel' && ( // Modern - glass panels
          <rect x={size/4} y={size/4} width={size/2} height={size/2} 
                fill="#a8c4d4" opacity={0.3} />
        )}
      </g>
    );
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
      {renderWall()}
    </svg>
  );
};

export default WallSymbol;