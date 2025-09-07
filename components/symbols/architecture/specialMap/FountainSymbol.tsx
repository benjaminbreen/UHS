/**
 * FountainSymbol.tsx - Beautiful culturally-specific fountains with water animations
 * All variants are classic, ornate designs - no ugly modern fountains!
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
  const zone = culturalZone?.toUpperCase();
  
  // Get materials and colors based on culture
  const getMaterials = () => {
    switch (zone) {
      case 'EAST_ASIAN':
        return {
          stone: '#5a5a5a',
          stoneLight: '#6a6a6a',
          stoneDark: '#4a4a4a',
          water: '#4a90c8',
          waterLight: '#6aa8d8',
          waterDark: '#3a80b8',
          accent: '#cd853f',
          moss: '#4a6741'
        };
      
      case 'MENA':
      case 'NORTH_AFRICAN':
        return {
          stone: '#e8dcc6',
          stoneLight: '#f0e4ce',
          stoneDark: '#d0c4ae',
          water: '#4a9eca',
          waterLight: '#6ab8e8',
          waterDark: '#3a8eba',
          accent: '#2c5f7c',
          tile: '#1a8a9a'
        };
      
      case 'SOUTH_ASIAN':
        return {
          stone: '#8b7355',
          stoneLight: '#9b8365',
          stoneDark: '#7b6345',
          water: '#5aa8d0',
          waterLight: '#7ac8f0',
          waterDark: '#4a98c0',
          accent: '#ff6b35',
          lotus: '#ff69b4'
        };
      
      case 'SUB_SAHARAN_AFRICAN':
        return {
          stone: '#8b6f47',
          stoneLight: '#9b7f57',
          stoneDark: '#7b5f37',
          water: '#4a85b8',
          waterLight: '#6aa5d8',
          waterDark: '#3a75a8',
          accent: '#d4af37',
          earth: '#a0522d'
        };
      
      case 'NORTH_AMERICAN_PRE_COLUMBIAN':
      case 'SOUTH_AMERICAN':
        return {
          stone: '#8b7d6b',
          stoneLight: '#9b8d7b',
          stoneDark: '#7b6d5b',
          water: '#4a8ac0',
          waterLight: '#6aaae0',
          waterDark: '#3a7ab0',
          accent: '#00ff7f',
          jade: '#00cd66'
        };
      
      case 'OCEANIAN':
        return {
          stone: '#696969',
          stoneLight: '#797979',
          stoneDark: '#595959',
          water: '#4a95d0',
          waterLight: '#6ab5f0',
          waterDark: '#3a85c0',
          accent: '#ff8c00',
          coral: '#ff6347'
        };
      
      default: // EUROPEAN
        return {
          stone: '#8b8680',
          stoneLight: '#9b9690',
          stoneDark: '#7b7670',
          water: '#4682b4',
          waterLight: '#6698c8',
          waterDark: '#3672a4',
          accent: '#daa520',
          marble: '#f0f0f0'
        };
    }
  };
  
  const materials = getMaterials();
  
  // Beautiful classic fountain design that varies by culture
  const renderFountain = () => {
    // Scale up the fountain to be more prominent
    const scale = 1.2;
    const cx = size / 2;
    const cy = size * 0.6;
    
    return (
      <g transform={`scale(${scale}) translate(${-size * (scale - 1) / 2}, ${-size * (scale - 1) / 2})`}>
        {/* Shadow */}
        <ellipse cx={cx} cy={size * 0.85} rx={size * 0.45} ry={size * 0.15} fill="black" opacity={0.2} />
        
        {/* Outer basin - larger and more ornate */}
        <ellipse cx={cx} cy={cy + size * 0.15} rx={size * 0.45} ry={size * 0.2} 
                 fill={materials.stoneDark} stroke={materials.stone} strokeWidth={1.5} />
        <ellipse cx={cx} cy={cy + size * 0.13} rx={size * 0.42} ry={size * 0.18} 
                 fill={materials.stone} />
        <ellipse cx={cx} cy={cy + size * 0.13} rx={size * 0.38} ry={size * 0.16} 
                 fill={materials.stoneDark} />
        
        {/* Water in outer basin with ripples */}
        <ellipse cx={cx} cy={cy + size * 0.13} rx={size * 0.35} ry={size * 0.14} 
                 fill={materials.water} opacity={0.9} />
        <ellipse cx={cx} cy={cy + size * 0.13} rx={size * 0.32} ry={size * 0.12} 
                 fill={materials.waterLight} opacity={0.6} />
        
        {/* Animated ripples in outer basin */}
        <ellipse cx={cx} cy={cy + size * 0.13} rx={size * 0.15} ry={size * 0.06} 
                 fill="none" stroke={materials.waterLight} strokeWidth={0.5} opacity={0.4}>
          <animate attributeName="rx" from={size * 0.15} to={size * 0.35} dur="3s" repeatCount="indefinite" />
          <animate attributeName="ry" from={size * 0.06} to={size * 0.14} dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.6" to="0" dur="3s" repeatCount="indefinite" />
        </ellipse>
        
        {/* Central pedestal */}
        <rect x={cx - size * 0.08} y={cy - size * 0.05} width={size * 0.16} height={size * 0.18} 
              fill={materials.stoneLight} stroke={materials.stone} strokeWidth={1} />
        
        {/* Decorative details on pedestal based on culture */}
        {zone === 'MENA' || zone === 'NORTH_AFRICAN' ? (
          // Islamic geometric pattern
          <g>
            <line x1={cx - size * 0.06} y1={cy} x2={cx + size * 0.06} y2={cy} 
                  stroke={materials.tile} strokeWidth={0.5} />
            <line x1={cx - size * 0.06} y1={cy + size * 0.05} x2={cx + size * 0.06} y2={cy + size * 0.05} 
                  stroke={materials.tile} strokeWidth={0.5} />
            <line x1={cx} y1={cy - size * 0.02} x2={cx} y2={cy + size * 0.08} 
                  stroke={materials.tile} strokeWidth={0.5} />
          </g>
        ) : zone === 'EAST_ASIAN' ? (
          // Dragon or wave motif
          <path d={`M ${cx - size * 0.06} ${cy + size * 0.05} Q ${cx} ${cy} ${cx + size * 0.06} ${cy + size * 0.05}`} 
                stroke={materials.accent} strokeWidth={0.5} fill="none" />
        ) : (
          // Classical European flourish
          <circle cx={cx} cy={cy + size * 0.05} r={size * 0.03} 
                  fill="none" stroke={materials.accent} strokeWidth={0.5} />
        )}
        
        {/* Middle tier basin */}
        <ellipse cx={cx} cy={cy - size * 0.05} rx={size * 0.25} ry={size * 0.1} 
                 fill={materials.stone} stroke={materials.stoneLight} strokeWidth={1} />
        <ellipse cx={cx} cy={cy - size * 0.07} rx={size * 0.22} ry={size * 0.08} 
                 fill={materials.stoneDark} />
        
        {/* Water in middle basin */}
        <ellipse cx={cx} cy={cy - size * 0.07} rx={size * 0.18} ry={size * 0.06} 
                 fill={materials.water} opacity={0.8} />
        <ellipse cx={cx} cy={cy - size * 0.07} rx={size * 0.15} ry={size * 0.05} 
                 fill={materials.waterLight} opacity={0.5} />
        
        {/* Top tier with spout */}
        <rect x={cx - size * 0.04} y={cy - size * 0.25} width={size * 0.08} height={size * 0.2} 
              fill={materials.stoneLight} stroke={materials.stone} strokeWidth={0.5} />
        
        {/* Ornamental top based on culture */}
        {zone === 'SOUTH_ASIAN' ? (
          // Lotus flower top
          <g>
            <ellipse cx={cx} cy={cy - size * 0.28} rx={size * 0.06} ry={size * 0.03} 
                     fill={materials.lotus} stroke={materials.accent} strokeWidth={0.5} />
            <ellipse cx={cx} cy={cy - size * 0.26} rx={size * 0.04} ry={size * 0.02} 
                     fill={materials.lotus} opacity={0.7} />
          </g>
        ) : zone === 'EAST_ASIAN' ? (
          // Pagoda-style top
          <polygon points={`${cx - size * 0.08},${cy - size * 0.25} ${cx},${cy - size * 0.32} ${cx + size * 0.08},${cy - size * 0.25}`} 
                   fill={materials.accent} stroke={materials.stoneDark} strokeWidth={0.5} />
        ) : (
          // Classical finial
          <circle cx={cx} cy={cy - size * 0.28} r={size * 0.05} 
                  fill={materials.stone} stroke={materials.stoneLight} strokeWidth={0.5} />
        )}
        
        {/* Animated water jets */}
        <g>
          {/* Central jet going up */}
          <line x1={cx} y1={cy - size * 0.25} x2={cx} y2={cy - size * 0.35} 
                stroke={materials.waterLight} strokeWidth={2} opacity={0.7}>
            <animate attributeName="y2" from={cy - size * 0.25} to={cy - size * 0.35} dur="0.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.9" to="0.3" dur="0.5s" repeatCount="indefinite" />
          </line>
          
          {/* Falling water particles */}
          {[0, 0.2, 0.4, 0.6, 0.8].map((delay, i) => (
            <circle key={i} cx={cx + (i - 2) * size * 0.02} cy={cy - size * 0.35} r={size * 0.01} 
                    fill={materials.waterLight} opacity={0.6}>
              <animate attributeName="cy" from={cy - size * 0.35} to={cy - size * 0.07} 
                       dur="1s" begin={`${delay}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.8" to="0" 
                       dur="1s" begin={`${delay}s`} repeatCount="indefinite" />
              <animate attributeName="cx" 
                       from={cx + (i - 2) * size * 0.02} 
                       to={cx + (i - 2) * size * 0.08} 
                       dur="1s" begin={`${delay}s`} repeatCount="indefinite" />
            </circle>
          ))}
          
          {/* Side jets from middle to outer basin */}
          <path d={`M ${cx - size * 0.15} ${cy - size * 0.07} Q ${cx - size * 0.2} ${cy - size * 0.02} ${cx - size * 0.25} ${cy + size * 0.08}`} 
                stroke={materials.waterLight} strokeWidth={1.5} fill="none" opacity={0.5}>
            <animate attributeName="opacity" from="0.7" to="0.2" dur="1.5s" repeatCount="indefinite" />
          </path>
          <path d={`M ${cx + size * 0.15} ${cy - size * 0.07} Q ${cx + size * 0.2} ${cy - size * 0.02} ${cx + size * 0.25} ${cy + size * 0.08}`} 
                stroke={materials.waterLight} strokeWidth={1.5} fill="none" opacity={0.5}>
            <animate attributeName="opacity" from="0.7" to="0.2" dur="1.5s" repeatCount="indefinite" />
          </path>
        </g>
        
        {/* Splashing water effects */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const splashX = cx + Math.cos(rad) * size * 0.25;
          const splashY = cy + size * 0.13 + Math.sin(rad) * size * 0.1;
          return (
            <circle key={`splash-${i}`} cx={splashX} cy={splashY} r={size * 0.008} 
                    fill={materials.waterLight} opacity={0.4}>
              <animate attributeName="r" from={size * 0.008} to={size * 0.02} 
                       dur="2s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.6" to="0" 
                       dur="2s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
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
      <g opacity={opacity}>
        {renderFountain()}
      </g>
    </svg>
  );
};

export default FountainSymbol;