/**
 * FountainSymbol.tsx - Culturally and historically accurate fountains
 * From ancient wells to modern water features
 */
import React from 'react';

interface FountainSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  facing?: 'north' | 'south' | 'east' | 'west';
  opacity?: number;
}

const FountainSymbol: React.FC<FountainSymbolProps> = ({ 
  x, 
  y, 
  size, 
  culturalZone = 'EUROPEAN',
  era = 1500,
  facing = 'south',
  opacity = 1.0 
}) => {
  // Determine fountain style based on culture and era
  const getFountainStyle = () => {
    if (era < 0) return 'well';
    if (era < 500) return 'roman';
    if (era < 1200) return 'medieval';
    if (era < 1700) return 'renaissance';
    if (era < 1900) return 'baroque';
    return 'modern';
  };
  
  const style = getFountainStyle();
  const zone = culturalZone?.toUpperCase();
  
  // Get materials and colors based on culture
  const getMaterials = () => {
    switch (zone) {
      case 'EAST_ASIAN':
        return {
          stone: '#4a4a4a',
          stoneLight: '#5a5a5a',
          water: '#4a90c8',
          waterLight: '#6aa8d8',
          accent: '#cd853f',
          moss: '#4a6741'
        };
      
      case 'MENA':
      case 'NORTH_AFRICAN':
        return {
          stone: '#e8dcc6',
          stoneLight: '#f0e4ce',
          water: '#4a9eca',
          waterLight: '#6ab8e8',
          accent: '#2c5f7c',
          tile: '#1a8a9a'
        };
      
      case 'SOUTH_ASIAN':
        return {
          stone: '#8b7355',
          stoneLight: '#9b8365',
          water: '#5aa8d0',
          waterLight: '#7ac8f0',
          accent: '#ff6b35',
          lotus: '#ff69b4'
        };
      
      case 'SUB_SAHARAN_AFRICAN':
        return {
          stone: '#8b6f47',
          stoneLight: '#9b7f57',
          water: '#4a85b8',
          waterLight: '#6aa5d8',
          accent: '#d4af37',
          earth: '#a0522d'
        };
      
      case 'NORTH_AMERICAN_PRE_COLUMBIAN':
      case 'SOUTH_AMERICAN':
        return {
          stone: '#8b7d6b',
          stoneLight: '#9b8d7b',
          water: '#4a8ac0',
          waterLight: '#6aaae0',
          accent: '#00ff7f',
          jade: '#00cd66'
        };
      
      case 'OCEANIA':
        return {
          stone: '#696969',
          stoneLight: '#797979',
          water: '#4a95d0',
          waterLight: '#6ab5f0',
          accent: '#ff8c00',
          coral: '#ff6347'
        };
      
      default: // EUROPEAN
        return {
          stone: '#8b8680',
          stoneLight: '#9b9690',
          water: '#4682b4',
          waterLight: '#6698c8',
          accent: '#daa520',
          marble: '#f0f0f0'
        };
    }
  };
  
  const materials = getMaterials();
  
  const renderWater = (cx: number, cy: number, rx: number, ry: number, animated = true) => (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={materials.water} opacity={0.8} />
      <ellipse cx={cx} cy={cy} rx={rx * 0.9} ry={ry * 0.9} fill={materials.waterLight} opacity={0.6} />
      {animated && (
        <>
          <ellipse cx={cx} cy={cy} rx={rx * 0.3} ry={ry * 0.3} fill="none" stroke={materials.waterLight} strokeWidth={0.5} opacity={0.4}>
            <animate attributeName="rx" from={rx * 0.3} to={rx * 0.8} dur="2s" repeatCount="indefinite" />
            <animate attributeName="ry" from={ry * 0.3} to={ry * 0.8} dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
          </ellipse>
        </>
      )}
    </g>
  );
  
  const renderFountain = () => {
    switch (style) {
      case 'well':
        // Ancient well
        return (
          <g>
            {/* Well rim */}
            <ellipse cx={size/2} cy={size*0.6} rx={size*0.35} ry={size*0.15} fill={materials.stone} stroke="#3a3a3a" strokeWidth={1} />
            <ellipse cx={size/2} cy={size*0.58} rx={size*0.3} ry={size*0.12} fill="#2a2a2a" />
            
            {/* Support posts */}
            <rect x={size*0.2} y={size*0.25} width={3} height={size*0.35} fill={materials.stone} />
            <rect x={size*0.77} y={size*0.25} width={3} height={size*0.35} fill={materials.stone} />
            
            {/* Roof */}
            <polygon points={`${size*0.1},${size*0.25} ${size*0.5},${size*0.15} ${size*0.9},${size*0.25}`} fill="#8b4513" stroke="#654321" strokeWidth={0.5} />
            
            {/* Bucket and rope */}
            <line x1={size*0.5} y1={size*0.25} x2={size*0.5} y2={size*0.45} stroke="#8b7355" strokeWidth={1} />
            <rect x={size*0.47} y={size*0.45} width={size*0.06} height={size*0.05} fill="#654321" stroke="#4a3020" strokeWidth={0.5} />
            
            {/* Water */}
            {renderWater(size/2, size*0.58, size*0.25, size*0.1, false)}
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.85} rx={size*0.38} ry={size*0.12} fill="black" opacity={0.3} />
          </g>
        );
      
      case 'roman':
        // Classical Roman fountain
        return (
          <g>
            {/* Base pool */}
            <ellipse cx={size/2} cy={size*0.75} rx={size*0.4} ry={size*0.18} fill={materials.stone} stroke={materials.stoneLight} strokeWidth={1} />
            <ellipse cx={size/2} cy={size*0.72} rx={size*0.35} ry={size*0.15} fill={materials.water} />
            
            {/* Pedestal */}
            <rect x={size*0.42} y={size*0.5} width={size*0.16} height={size*0.25} fill={materials.marble || materials.stoneLight} stroke={materials.stone} strokeWidth={0.5} />
            
            {/* Middle tier */}
            <ellipse cx={size/2} cy={size*0.5} rx={size*0.2} ry={size*0.08} fill={materials.stone} stroke={materials.stoneLight} strokeWidth={0.5} />
            <ellipse cx={size/2} cy={size*0.48} rx={size*0.15} ry={size*0.06} fill={materials.water} />
            
            {/* Top spout */}
            <rect x={size*0.47} y={size*0.35} width={size*0.06} height={size*0.15} fill={materials.stoneLight} />
            <circle cx={size/2} cy={size*0.35} r={size*0.05} fill={materials.stone} stroke={materials.stoneLight} strokeWidth={0.5} />
            
            {/* Water jets */}
            <line x1={size*0.5} y1={size*0.35} x2={size*0.5} y2={size*0.48} stroke={materials.waterLight} strokeWidth={2} opacity={0.6} />
            <line x1={size*0.42} y1={size*0.48} x2={size*0.38} y2={size*0.65} stroke={materials.waterLight} strokeWidth={1.5} opacity={0.5} />
            <line x1={size*0.58} y1={size*0.48} x2={size*0.62} y2={size*0.65} stroke={materials.waterLight} strokeWidth={1.5} opacity={0.5} />
            
            {/* Water animation */}
            {renderWater(size/2, size*0.72, size*0.3, size*0.12)}
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.88} rx={size*0.4} ry={size*0.1} fill="black" opacity={0.3} />
          </g>
        );
      
      case 'medieval':
        // Medieval fountain
        if (zone === 'EAST_ASIAN') {
          // Zen water basin
          return (
            <g>
              {/* Stone basin */}
              <rect x={size*0.25} y={size*0.55} width={size*0.5} height={size*0.25} fill={materials.stone} stroke="#3a3a3a" strokeWidth={1} />
              <rect x={size*0.27} y={size*0.57} width={size*0.46} height={size*0.2} fill="#2a2a2a" />
              
              {/* Water */}
              <rect x={size*0.3} y={size*0.6} width={size*0.4} height={size*0.15} fill={materials.water} opacity={0.8} />
              
              {/* Bamboo spout */}
              <rect x={size*0.1} y={size*0.45} width={size*0.35} height={size*0.04} fill={materials.accent} stroke="#8b6914" strokeWidth={0.5} />
              <ellipse cx={size*0.1} cy={size*0.47} rx={size*0.02} ry={size*0.04} fill={materials.accent} />
              
              {/* Water flow from bamboo */}
              <path d={`M ${size*0.42} ${size*0.47} Q ${size*0.45} ${size*0.55} ${size*0.5} ${size*0.6}`} 
                    stroke={materials.waterLight} strokeWidth={1.5} fill="none" opacity={0.6} />
              
              {/* Moss on stone */}
              <ellipse cx={size*0.28} cy={size*0.75} rx={size*0.03} ry={size*0.02} fill={materials.moss} opacity={0.5} />
              <ellipse cx={size*0.7} cy={size*0.73} rx={size*0.04} ry={size*0.02} fill={materials.moss} opacity={0.5} />
              
              {/* Shadow */}
              <ellipse cx={size/2} cy={size*0.85} rx={size*0.3} ry={size*0.1} fill="black" opacity={0.3} />
            </g>
          );
        } else if (zone === 'MENA' || zone === 'NORTH_AFRICAN') {
          // Islamic geometric fountain
          return (
            <g>
              {/* Octagonal base */}
              <polygon points={`${size*0.3},${size*0.65} ${size*0.2},${size*0.75} ${size*0.3},${size*0.85} ${size*0.5},${size*0.9} ${size*0.7},${size*0.85} ${size*0.8},${size*0.75} ${size*0.7},${size*0.65} ${size*0.5},${size*0.6}`}
                      fill={materials.stone} stroke={materials.accent} strokeWidth={1} />
              
              {/* Inner pool */}
              <polygon points={`${size*0.35},${size*0.68} ${size*0.28},${size*0.75} ${size*0.35},${size*0.82} ${size*0.5},${size*0.85} ${size*0.65},${size*0.82} ${size*0.72},${size*0.75} ${size*0.65},${size*0.68} ${size*0.5},${size*0.65}`}
                      fill={materials.water} opacity={0.8} />
              
              {/* Central jet */}
              <circle cx={size/2} cy={size*0.75} r={size*0.08} fill={materials.stoneLight} stroke={materials.accent} strokeWidth={0.5} />
              <circle cx={size/2} cy={size*0.75} r={size*0.05} fill={materials.water} />
              
              {/* Water jet */}
              <line x1={size*0.5} y1={size*0.75} x2={size*0.5} y2={size*0.45} stroke={materials.waterLight} strokeWidth={2} opacity={0.7} />
              <ellipse cx={size*0.5} cy={size*0.45} rx={size*0.03} ry={size*0.05} fill={materials.waterLight} opacity={0.5} />
              
              {/* Geometric tile pattern */}
              <g opacity={0.5}>
                <line x1={size*0.35} y1={size*0.7} x2={size*0.65} y2={size*0.7} stroke={materials.tile} strokeWidth={0.5} />
                <line x1={size*0.35} y1={size*0.8} x2={size*0.65} y2={size*0.8} stroke={materials.tile} strokeWidth={0.5} />
                <line x1={size*0.4} y1={size*0.68} x2={size*0.4} y2={size*0.82} stroke={materials.tile} strokeWidth={0.5} />
                <line x1={size*0.6} y1={size*0.68} x2={size*0.6} y2={size*0.82} stroke={materials.tile} strokeWidth={0.5} />
              </g>
              
              {/* Shadow */}
              <ellipse cx={size/2} cy={size*0.92} rx={size*0.35} ry={size*0.08} fill="black" opacity={0.3} />
            </g>
          );
        } else {
          // European medieval
          return (
            <g>
              {/* Hexagonal base */}
              <polygon points={`${size*0.25},${size*0.7} ${size*0.25},${size*0.8} ${size*0.5},${size*0.85} ${size*0.75},${size*0.8} ${size*0.75},${size*0.7} ${size*0.5},${size*0.65}`}
                      fill={materials.stone} stroke="#5a5651" strokeWidth={1} />
              
              {/* Water pool */}
              <polygon points={`${size*0.3},${size*0.72} ${size*0.3},${size*0.78} ${size*0.5},${size*0.81} ${size*0.7},${size*0.78} ${size*0.7},${size*0.72} ${size*0.5},${size*0.69}`}
                      fill={materials.water} opacity={0.8} />
              
              {/* Central pillar */}
              <rect x={size*0.47} y={size*0.45} width={size*0.06} height={size*0.3} fill={materials.stoneLight} stroke={materials.stone} strokeWidth={0.5} />
              
              {/* Lion head spout */}
              <circle cx={size/2} cy={size*0.48} r={size*0.06} fill={materials.stone} stroke="#5a5651" strokeWidth={0.5} />
              <circle cx={size*0.48} cy={size*0.47} r={size*0.01} fill="#2a2a2a" />
              <circle cx={size*0.52} cy={size*0.47} r={size*0.01} fill="#2a2a2a" />
              
              {/* Water stream */}
              <path d={`M ${size*0.5} ${size*0.52} Q ${size*0.5} ${size*0.65} ${size*0.5} ${size*0.75}`} 
                    stroke={materials.waterLight} strokeWidth={2} fill="none" opacity={0.6} />
              
              {/* Shadow */}
              <ellipse cx={size/2} cy={size*0.88} rx={size*0.3} ry={size*0.1} fill="black" opacity={0.35} />
            </g>
          );
        }
      
      case 'renaissance':
      case 'baroque':
        // Ornate tiered fountain
        if (zone === 'SOUTH_ASIAN') {
          // Lotus fountain
          return (
            <g>
              {/* Base pool */}
              <ellipse cx={size/2} cy={size*0.8} rx={size*0.42} ry={size*0.15} fill={materials.stone} stroke={materials.stoneLight} strokeWidth={1} />
              <ellipse cx={size/2} cy={size*0.78} rx={size*0.37} ry={size*0.12} fill={materials.water} />
              
              {/* Lotus petals base */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
                <ellipse 
                  key={angle}
                  cx={size/2 + Math.cos(angle * Math.PI / 180) * size * 0.25} 
                  cy={size*0.78 + Math.sin(angle * Math.PI / 180) * size * 0.08}
                  rx={size*0.08} 
                  ry={size*0.03}
                  fill={materials.lotus}
                  opacity={0.7}
                  transform={`rotate(${angle} ${size/2} ${size*0.78})`}
                />
              ))}
              
              {/* Middle tier */}
              <ellipse cx={size/2} cy={size*0.55} rx={size*0.25} ry={size*0.1} fill={materials.stone} stroke={materials.stoneLight} strokeWidth={0.5} />
              <ellipse cx={size/2} cy={size*0.53} rx={size*0.2} ry={size*0.08} fill={materials.water} />
              
              {/* Top lotus */}
              <circle cx={size/2} cy={size*0.35} r={size*0.12} fill={materials.lotus} opacity={0.8} />
              {[0, 60, 120, 180, 240, 300].map(angle => (
                <ellipse 
                  key={angle}
                  cx={size/2} 
                  cy={size*0.35}
                  rx={size*0.1} 
                  ry={size*0.04}
                  fill={materials.lotus}
                  opacity={0.6}
                  transform={`rotate(${angle} ${size/2} ${size*0.35})`}
                />
              ))}
              
              {/* Water cascades */}
              <line x1={size*0.5} y1={size*0.35} x2={size*0.5} y2={size*0.53} stroke={materials.waterLight} strokeWidth={2} opacity={0.6} />
              {[20, -20].map(offset => (
                <path key={offset} d={`M ${size*0.5 + offset/100*size} ${size*0.53} Q ${size*0.5 + offset/50*size} ${size*0.65} ${size*0.5 + offset/25*size} ${size*0.78}`} 
                      stroke={materials.waterLight} strokeWidth={1.5} fill="none" opacity={0.5} />
              ))}
              
              {/* Shadow */}
              <ellipse cx={size/2} cy={size*0.9} rx={size*0.42} ry={size*0.1} fill="black" opacity={0.3} />
            </g>
          );
        } else {
          // European baroque fountain
          return (
            <g>
              {/* Large base pool */}
              <ellipse cx={size/2} cy={size*0.82} rx={size*0.45} ry={size*0.15} fill={materials.stone} stroke={materials.accent} strokeWidth={1} />
              <ellipse cx={size/2} cy={size*0.8} rx={size*0.4} ry={size*0.12} fill={materials.water} />
              
              {/* First tier */}
              <ellipse cx={size/2} cy={size*0.6} rx={size*0.3} ry={size*0.1} fill={materials.stoneLight} stroke={materials.stone} strokeWidth={0.5} />
              <ellipse cx={size/2} cy={size*0.58} rx={size*0.25} ry={size*0.08} fill={materials.water} />
              
              {/* Second tier */}
              <ellipse cx={size/2} cy={size*0.42} rx={size*0.2} ry={size*0.07} fill={materials.stoneLight} stroke={materials.stone} strokeWidth={0.5} />
              <ellipse cx={size/2} cy={size*0.4} rx={size*0.15} ry={size*0.05} fill={materials.water} />
              
              {/* Top ornament */}
              <circle cx={size/2} cy={size*0.25} r={size*0.08} fill={materials.accent} stroke={materials.stone} strokeWidth={0.5} />
              <circle cx={size/2} cy={size*0.25} r={size*0.05} fill={materials.stoneLight} />
              
              {/* Water jets */}
              <line x1={size*0.5} y1={size*0.25} x2={size*0.5} y2={size*0.4} stroke={materials.waterLight} strokeWidth={2} opacity={0.7} />
              {[-0.15, -0.05, 0.05, 0.15].map(offset => (
                <path key={offset} d={`M ${size*(0.5 + offset)} ${size*0.4} Q ${size*(0.5 + offset*1.5)} ${size*0.5} ${size*(0.5 + offset*2)} ${size*0.58}`} 
                      stroke={materials.waterLight} strokeWidth={1.5} fill="none" opacity={0.5} />
              ))}
              {[-0.2, -0.1, 0, 0.1, 0.2].map(offset => (
                <path key={offset} d={`M ${size*(0.5 + offset)} ${size*0.58} Q ${size*(0.5 + offset*1.2)} ${size*0.7} ${size*(0.5 + offset*1.5)} ${size*0.8}`} 
                      stroke={materials.waterLight} strokeWidth={1} fill="none" opacity={0.4} />
              ))}
              
              {/* Decorative dolphins/cherubs */}
              {style === 'baroque' && (
                <g>
                  <ellipse cx={size*0.35} cy={size*0.65} rx={size*0.03} ry={size*0.02} fill={materials.accent} opacity={0.7} />
                  <ellipse cx={size*0.65} cy={size*0.65} rx={size*0.03} ry={size*0.02} fill={materials.accent} opacity={0.7} />
                </g>
              )}
              
              {/* Shadow */}
              <ellipse cx={size/2} cy={size*0.92} rx={size*0.45} ry={size*0.1} fill="black" opacity={0.3} />
            </g>
          );
        }
      
      default: // modern
        // Simple modern fountain
        return (
          <g>
            {/* Rectangular pool */}
            <rect x={size*0.15} y={size*0.65} width={size*0.7} height={size*0.2} fill="#4a4a4a" stroke="#2a2a2a" strokeWidth={1} />
            <rect x={size*0.18} y={size*0.68} width={size*0.64} height={size*0.14} fill={materials.water} opacity={0.9} />
            
            {/* Modern jets */}
            {[0.3, 0.4, 0.5, 0.6, 0.7].map(pos => (
              <g key={pos}>
                <circle cx={size*pos} cy={size*0.75} r={size*0.015} fill="#6a6a6a" />
                <line x1={size*pos} y1={size*0.75} x2={size*pos} y2={size*(0.75 - (0.5 - Math.abs(pos - 0.5)) * 0.4)} 
                      stroke={materials.waterLight} strokeWidth={1} opacity={0.6} />
              </g>
            ))}
            
            {/* LED lights (if very modern) */}
            {era > 2000 && (
              <g>
                <circle cx={size*0.25} cy={size*0.75} r={size*0.01} fill="#00ffff" opacity={0.8} />
                <circle cx={size*0.75} cy={size*0.75} r={size*0.01} fill="#00ffff" opacity={0.8} />
              </g>
            )}
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.88} rx={size*0.38} ry={size*0.08} fill="black" opacity={0.3} />
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
        {renderFountain()}
      </g>
    </svg>
  );
};

export default FountainSymbol;