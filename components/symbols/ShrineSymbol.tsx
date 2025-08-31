/**
 * ShrineSymbol.tsx - Culturally and historically accurate shrines
 * Small religious structures and sacred spaces across cultures
 */
import React from 'react';

interface ShrineSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  facing?: 'north' | 'south' | 'east' | 'west';
  opacity?: number;
}

const ShrineSymbol: React.FC<ShrineSymbolProps> = ({ 
  x, 
  y, 
  size, 
  culturalZone = 'EUROPEAN',
  era = 1500,
  facing = 'south',
  opacity = 1.0 
}) => {
  const zone = culturalZone?.toUpperCase();
  
  // Determine shrine type based on culture and era
  const getShrineType = () => {
    if (zone.includes('ASIA')) {
      if (era < 500) return 'shinto_early';
      if (era < 1500) return 'shinto_buddhist';
      return 'shinto_modern';
    } else if (zone.includes('MENA') || zone.includes('NORTH_AFRICAN')) {
      if (era < 600) return 'ancient_shrine';
      return 'islamic_shrine';
    } else if (zone.includes('SOUTH_ASIAN')) {
      if (era < 0) return 'vedic_shrine';
      if (era < 1200) return 'hindu_shrine';
      return 'hindu_modern';
    } else if (zone.includes('SUB_SAHARAN')) {
      return 'ancestral_shrine';
    } else if (zone.includes('AMERICAN')) {
      if (era < 1500) return 'spirit_house';
      return 'roadside_shrine';
    } else if (zone.includes('OCEANIA')) {
      return 'tiki_shrine';
    } else { // EUROPEAN
      if (era < 0) return 'household_gods';
      if (era < 1000) return 'wayside_cross';
      if (era < 1700) return 'chapel_shrine';
      return 'grotto_shrine';
    }
  };
  
  const shrineType = getShrineType();
  const rotation = { north: 180, south: 0, east: 270, west: 90 }[facing];
  
  const renderShrine = () => {
    switch (shrineType) {
      case 'shinto_early':
      case 'shinto_buddhist':
      case 'shinto_modern':
        // Japanese Shinto shrine
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Torii gate */}
            <rect x={size*0.15} y={size*0.3} width={3} height={size*0.4} fill="#dc143c" />
            <rect x={size*0.82} y={size*0.3} width={3} height={size*0.4} fill="#dc143c" />
            <rect x={size*0.1} y={size*0.28} width={size*0.8} height={4} fill="#dc143c" />
            <rect x={size*0.05} y={size*0.35} width={size*0.9} height={3} fill="#dc143c" />
            
            {/* Shrine building */}
            <rect x={size*0.3} y={size*0.5} width={size*0.4} height={size*0.25} fill="#8b4513" stroke="#654321" strokeWidth={0.5} />
            {/* Roof */}
            <polygon points={`${size*0.25},${size*0.5} ${size*0.5},${size*0.4} ${size*0.75},${size*0.5}`} 
                    fill="#4a4a4a" stroke="#3a3a3a" strokeWidth={0.5} />
            {/* Curved roof edges */}
            <path d={`M ${size*0.25} ${size*0.5} Q ${size*0.2} ${size*0.48} ${size*0.15} ${size*0.48}`} 
                  fill="#4a4a4a" stroke="#3a3a3a" strokeWidth={0.5} />
            <path d={`M ${size*0.75} ${size*0.5} Q ${size*0.8} ${size*0.48} ${size*0.85} ${size*0.48}`} 
                  fill="#4a4a4a" stroke="#3a3a3a" strokeWidth={0.5} />
            
            {/* Sacred rope (shimenawa) */}
            <path d={`M ${size*0.3} ${size*0.45} Q ${size*0.5} ${size*0.43} ${size*0.7} ${size*0.45}`} 
                  stroke="#d4af37" strokeWidth={2} fill="none" />
            {/* Paper streamers (shide) */}
            <path d={`M ${size*0.4} ${size*0.45} L ${size*0.38} ${size*0.52} L ${size*0.4} ${size*0.5} L ${size*0.38} ${size*0.55}`} 
                  fill="#ffffff" stroke="#e0e0e0" strokeWidth={0.5} />
            <path d={`M ${size*0.6} ${size*0.45} L ${size*0.62} ${size*0.52} L ${size*0.6} ${size*0.5} L ${size*0.62} ${size*0.55}`} 
                  fill="#ffffff" stroke="#e0e0e0" strokeWidth={0.5} />
            
            {/* Offering box */}
            <rect x={size*0.45} y={size*0.65} width={size*0.1} height={size*0.08} fill="#654321" stroke="#4a3020" strokeWidth={0.5} />
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.85} rx={size*0.35} ry={size*0.1} fill="black" opacity={0.3} />
          </g>
        );
      
      case 'islamic_shrine':
        // Islamic shrine/maqam
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Dome structure */}
            <rect x={size*0.3} y={size*0.5} width={size*0.4} height={size*0.3} fill="#e8dcc6" stroke="#8b7566" strokeWidth={1} />
            <ellipse cx={size/2} cy={size*0.5} rx={size*0.22} ry={size*0.18} fill="#4a9eca" stroke="#2c5f7c" strokeWidth={0.5} />
            {/* Dome top */}
            <circle cx={size/2} cy={size*0.35} r={size*0.03} fill="#ffd700" />
            <path d={`M ${size*0.5} ${size*0.32} Q ${size*0.48} ${size*0.28} ${size*0.5} ${size*0.25} Q ${size*0.52} ${size*0.28} ${size*0.5} ${size*0.32}`} 
                  fill="#ffd700" stroke="#daa520" strokeWidth={0.5} />
            
            {/* Entrance arch */}
            <path d={`M ${size*0.42} ${size*0.8} L ${size*0.42} ${size*0.6} Q ${size*0.5} ${size*0.55} ${size*0.58} ${size*0.6} L ${size*0.58} ${size*0.8}`} 
                  fill="#2a2a2a" opacity={0.5} />
            
            {/* Geometric patterns */}
            <g opacity={0.6}>
              <circle cx={size*0.35} cy={size*0.65} r={size*0.03} fill="none" stroke="#ffd700" strokeWidth={0.5} />
              <circle cx={size*0.65} cy={size*0.65} r={size*0.03} fill="none" stroke="#ffd700" strokeWidth={0.5} />
            </g>
            
            {/* Prayer flags/banners */}
            <rect x={size*0.2} y={size*0.4} width={2} height={size*0.35} fill="#8b7566" />
            <rect x={size*0.18} y={size*0.4} width={size*0.08} height={size*0.15} fill="#228b22" stroke="#006400" strokeWidth={0.3} />
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.85} rx={size*0.3} ry={size*0.1} fill="black" opacity={0.35} />
          </g>
        );
      
      case 'vedic_shrine':
      case 'hindu_shrine':
      case 'hindu_modern':
        // Hindu roadside shrine
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Shrine structure with pyramid roof */}
            <polygon points={`${size*0.3},${size*0.8} ${size*0.3},${size*0.5} ${size*0.5},${size*0.35} ${size*0.7},${size*0.5} ${size*0.7},${size*0.8}`} 
                    fill="#8b7355" stroke="#6b5345" strokeWidth={1} />
            
            {/* Inner sanctum */}
            <rect x={size*0.35} y={size*0.55} width={size*0.3} height={size*0.25} fill="#2a2a2a" opacity={0.7} />
            
            {/* Deity figure */}
            <ellipse cx={size/2} cy={size*0.65} rx={size*0.05} ry={size*0.08} fill="#daa520" stroke="#b8860b" strokeWidth={0.5} />
            <circle cx={size/2} cy={size*0.58} r={size*0.03} fill="#daa520" stroke="#b8860b" strokeWidth={0.5} />
            
            {/* Om symbol */}
            <text x={size*0.5} y={size*0.45} fontSize={size*0.08} fill="#ff6b35" textAnchor="middle">ॐ</text>
            
            {/* Bells */}
            <circle cx={size*0.32} cy={size*0.48} r={size*0.02} fill="#cd7f32" stroke="#8b5a2b" strokeWidth={0.3} />
            <circle cx={size*0.68} cy={size*0.48} r={size*0.02} fill="#cd7f32" stroke="#8b5a2b" strokeWidth={0.3} />
            
            {/* Offerings platform */}
            <rect x={size*0.35} y={size*0.75} width={size*0.3} height={size*0.05} fill="#9b8365" stroke="#7b6355" strokeWidth={0.5} />
            {/* Flowers */}
            <circle cx={size*0.4} cy={size*0.74} r={size*0.015} fill="#ff1493" opacity={0.8} />
            <circle cx={size*0.5} cy={size*0.73} r={size*0.015} fill="#ffff00" opacity={0.8} />
            <circle cx={size*0.6} cy={size*0.74} r={size*0.015} fill="#ffa500" opacity={0.8} />
            
            {/* Incense */}
            <rect x={size*0.45} y={size*0.72} width={1} height={size*0.03} fill="#654321" />
            <path d={`M ${size*0.455} ${size*0.7} Q ${size*0.46} ${size*0.65} ${size*0.45} ${size*0.6}`} 
                  stroke="#d3d3d3" strokeWidth={0.5} fill="none" opacity={0.5} />
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.85} rx={size*0.25} ry={size*0.08} fill="black" opacity={0.3} />
          </g>
        );
      
      case 'ancestral_shrine':
        // African ancestral shrine
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Thatched roof hut */}
            <polygon points={`${size*0.25},${size*0.55} ${size*0.5},${size*0.35} ${size*0.75},${size*0.55}`} 
                    fill="#d2691e" stroke="#a0522d" strokeWidth={1} />
            {/* Thatch texture */}
            <line x1={size*0.3} y1={size*0.52} x2={size*0.35} y2={size*0.45} stroke="#a0522d" strokeWidth={0.5} />
            <line x1={size*0.4} y1={size*0.52} x2={size*0.43} y2={size*0.42} stroke="#a0522d" strokeWidth={0.5} />
            <line x1={size*0.6} y1={size*0.52} x2={size*0.57} y2={size*0.42} stroke="#a0522d" strokeWidth={0.5} />
            <line x1={size*0.7} y1={size*0.52} x2={size*0.65} y2={size*0.45} stroke="#a0522d" strokeWidth={0.5} />
            
            {/* Mud walls */}
            <rect x={size*0.3} y={size*0.55} width={size*0.4} height={size*0.25} fill="#8b6f47" stroke="#6b5537" strokeWidth={0.5} />
            
            {/* Entrance */}
            <rect x={size*0.45} y={size*0.65} width={size*0.1} height={size*0.15} fill="#2a2a2a" opacity={0.7} />
            
            {/* Carved posts */}
            <rect x={size*0.28} y={size*0.5} width={3} height={size*0.3} fill="#4a3020" stroke="#3a2010" strokeWidth={0.5} />
            <rect x={size*0.69} y={size*0.5} width={3} height={size*0.3} fill="#4a3020" stroke="#3a2010" strokeWidth={0.5} />
            {/* Carved patterns */}
            <circle cx={size*0.295} cy={size*0.6} r={size*0.01} fill="#6b5537" />
            <circle cx={size*0.295} cy={size*0.65} r={size*0.01} fill="#6b5537" />
            <circle cx={size*0.705} cy={size*0.6} r={size*0.01} fill="#6b5537" />
            <circle cx={size*0.705} cy={size*0.65} r={size*0.01} fill="#6b5537" />
            
            {/* Offerings */}
            <ellipse cx={size*0.4} cy={size*0.78} rx={size*0.03} ry={size*0.02} fill="#ffd700" opacity={0.7} />
            <ellipse cx={size*0.6} cy={size*0.78} rx={size*0.03} ry={size*0.02} fill="#cd853f" opacity={0.7} />
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.85} rx={size*0.3} ry={size*0.1} fill="black" opacity={0.35} />
          </g>
        );
      
      case 'spirit_house':
        // Native American/Pre-Columbian spirit house
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Wooden structure */}
            <rect x={size*0.35} y={size*0.45} width={size*0.3} height={size*0.35} fill="#8b4513" stroke="#654321" strokeWidth={1} />
            
            {/* Peaked roof */}
            <polygon points={`${size*0.32},${size*0.45} ${size*0.5},${size*0.32} ${size*0.68},${size*0.45}`} 
                    fill="#654321" stroke="#4a3020" strokeWidth={0.5} />
            
            {/* Spirit opening */}
            <circle cx={size/2} cy={size*0.55} r={size*0.05} fill="#2a2a2a" opacity={0.8} />
            
            {/* Painted symbols */}
            <g opacity={0.7}>
              <path d={`M ${size*0.4} ${size*0.65} L ${size*0.45} ${size*0.7} L ${size*0.4} ${size*0.75}`} 
                    stroke="#ff4500" strokeWidth={1} fill="none" />
              <path d={`M ${size*0.6} ${size*0.65} L ${size*0.55} ${size*0.7} L ${size*0.6} ${size*0.75}`} 
                    stroke="#ff4500" strokeWidth={1} fill="none" />
              <circle cx={size/2} cy={size*0.38} r={size*0.025} fill="#ffd700" />
            </g>
            
            {/* Feathers and beads */}
            <path d={`M ${size*0.3} ${size*0.5} L ${size*0.25} ${size*0.55}`} stroke="#8b4513" strokeWidth={1} />
            <ellipse cx={size*0.24} cy={size*0.57} rx={size*0.02} ry={size*0.03} fill="#f0e68c" opacity={0.8} />
            <path d={`M ${size*0.7} ${size*0.5} L ${size*0.75} ${size*0.55}`} stroke="#8b4513" strokeWidth={1} />
            <ellipse cx={size*0.76} cy={size*0.57} rx={size*0.02} ry={size*0.03} fill="#f0e68c" opacity={0.8} />
            
            {/* Offerings */}
            <circle cx={size*0.42} cy={size*0.78} r={size*0.02} fill="#00ff7f" opacity={0.7} />
            <circle cx={size*0.58} cy={size*0.78} r={size*0.02} fill="#ff6347" opacity={0.7} />
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.85} rx={size*0.25} ry={size*0.08} fill="black" opacity={0.3} />
          </g>
        );
      
      case 'tiki_shrine':
        // Polynesian tiki shrine
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Tiki statue */}
            <rect x={size*0.42} y={size*0.4} width={size*0.16} height={size*0.4} fill="#8b4513" stroke="#654321" strokeWidth={1} />
            
            {/* Tiki face */}
            <ellipse cx={size/2} cy={size*0.48} rx={size*0.06} ry={size*0.08} fill="#a0522d" stroke="#654321" strokeWidth={0.5} />
            {/* Eyes */}
            <circle cx={size*0.47} cy={size*0.46} r={size*0.015} fill="#2a2a2a" />
            <circle cx={size*0.53} cy={size*0.46} r={size*0.015} fill="#2a2a2a" />
            {/* Mouth */}
            <ellipse cx={size/2} cy={size*0.52} rx={size*0.03} ry={size*0.02} fill="#2a2a2a" />
            
            {/* Arms */}
            <rect x={size*0.38} y={size*0.6} width={size*0.04} height={size*0.15} fill="#8b4513" stroke="#654321" strokeWidth={0.5} />
            <rect x={size*0.58} y={size*0.6} width={size*0.04} height={size*0.15} fill="#8b4513" stroke="#654321" strokeWidth={0.5} />
            
            {/* Lei/garland */}
            <ellipse cx={size/2} cy={size*0.58} rx={size*0.08} ry={size*0.03} fill="none" stroke="#ff69b4" strokeWidth={2} opacity={0.7} />
            
            {/* Torch posts */}
            <rect x={size*0.25} y={size*0.5} width={2} height={size*0.3} fill="#654321" />
            <rect x={size*0.73} y={size*0.5} width={2} height={size*0.3} fill="#654321" />
            {/* Flames */}
            <ellipse cx={size*0.26} cy={size*0.48} rx={size*0.02} ry={size*0.03} fill="#ff6347" opacity={0.8} />
            <ellipse cx={size*0.74} cy={size*0.48} rx={size*0.02} ry={size*0.03} fill="#ff6347" opacity={0.8} />
            
            {/* Stone platform */}
            <rect x={size*0.3} y={size*0.78} width={size*0.4} height={size*0.07} fill="#696969" stroke="#4a4a4a" strokeWidth={0.5} />
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.88} rx={size*0.3} ry={size*0.08} fill="black" opacity={0.35} />
          </g>
        );
      
      case 'wayside_cross':
      case 'chapel_shrine':
        // European wayside cross/chapel
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {shrineType === 'chapel_shrine' ? (
              <>
                {/* Small chapel structure */}
                <rect x={size*0.35} y={size*0.5} width={size*0.3} height={size*0.3} fill="#8b8680" stroke="#5a5651" strokeWidth={1} />
                {/* Roof */}
                <polygon points={`${size*0.32},${size*0.5} ${size*0.5},${size*0.38} ${size*0.68},${size*0.5}`} 
                        fill="#8b4513" stroke="#654321" strokeWidth={0.5} />
                {/* Door */}
                <rect x={size*0.45} y={size*0.65} width={size*0.1} height={size*0.15} fill="#4a3020" stroke="#3a2010" strokeWidth={0.5} />
                {/* Window */}
                <circle cx={size/2} cy={size*0.55} r={size*0.03} fill="#4682b4" stroke="#2a4a6a" strokeWidth={0.5} opacity={0.7} />
              </>
            ) : (
              <>
                {/* Stone base */}
                <rect x={size*0.45} y={size*0.7} width={size*0.1} height={size*0.1} fill="#8b8680" stroke="#5a5651" strokeWidth={0.5} />
                <rect x={size*0.43} y={size*0.75} width={size*0.14} height={size*0.05} fill="#9b9690" stroke="#6a6661" strokeWidth={0.5} />
              </>
            )}
            
            {/* Cross */}
            <rect x={size*0.48} y={size*0.25} width={size*0.04} height={size*0.45} fill="#8b4513" stroke="#654321" strokeWidth={0.5} />
            <rect x={size*0.4} y={size*0.35} width={size*0.2} height={size*0.04} fill="#8b4513" stroke="#654321" strokeWidth={0.5} />
            
            {/* INRI plaque */}
            <rect x={size*0.47} y={size*0.28} width={size*0.06} height={size*0.03} fill="#f5deb3" stroke="#d2b48c" strokeWidth={0.3} />
            
            {/* Flowers at base */}
            <circle cx={size*0.43} cy={size*0.78} r={size*0.015} fill="#ff69b4" opacity={0.7} />
            <circle cx={size*0.47} cy={size*0.79} r={size*0.015} fill="#ffffff" opacity={0.7} />
            <circle cx={size*0.53} cy={size*0.79} r={size*0.015} fill="#ffff00" opacity={0.7} />
            <circle cx={size*0.57} cy={size*0.78} r={size*0.015} fill="#ff69b4" opacity={0.7} />
            
            {/* Candle */}
            <rect x={size*0.38} y={size*0.73} width={size*0.02} height={size*0.05} fill="#fffacd" stroke="#f0e68c" strokeWidth={0.3} />
            <ellipse cx={size*0.39} cy={size*0.72} rx={size*0.008} ry={size*0.012} fill="#ff6347" opacity={0.8} />
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.85} rx={size*0.25} ry={size*0.08} fill="black" opacity={0.3} />
          </g>
        );
      
      case 'grotto_shrine':
        // Modern European grotto shrine (e.g., Marian grotto)
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Rock grotto */}
            <ellipse cx={size/2} cy={size*0.55} rx={size*0.35} ry={size*0.3} fill="#696969" stroke="#4a4a4a" strokeWidth={1} />
            <ellipse cx={size/2} cy={size*0.55} rx={size*0.25} ry={size*0.22} fill="#3a3a3a" opacity={0.7} />
            
            {/* Statue niche */}
            <ellipse cx={size/2} cy={size*0.5} rx={size*0.15} ry={size*0.18} fill="#2a2a2a" opacity={0.8} />
            
            {/* Mary statue */}
            <ellipse cx={size/2} cy={size*0.5} rx={size*0.04} ry={size*0.08} fill="#87ceeb" stroke="#6ab5d8" strokeWidth={0.5} />
            <circle cx={size/2} cy={size*0.42} r={size*0.025} fill="#fffaf0" stroke="#f0e6d6" strokeWidth={0.5} />
            {/* Crown/halo */}
            <circle cx={size/2} cy={size*0.38} r={size*0.035} fill="none" stroke="#ffd700" strokeWidth={0.5} opacity={0.7} />
            
            {/* Kneeler */}
            <rect x={size*0.42} y={size*0.72} width={size*0.16} height={size*0.06} fill="#8b4513" stroke="#654321" strokeWidth={0.5} />
            
            {/* Candles */}
            <rect x={size*0.35} y={size*0.68} width={size*0.02} height={size*0.04} fill="#fffacd" stroke="#f0e68c" strokeWidth={0.3} />
            <ellipse cx={size*0.36} cy={size*0.67} rx={size*0.008} ry={size*0.01} fill="#ff6347" opacity={0.8} />
            <rect x={size*0.63} y={size*0.68} width={size*0.02} height={size*0.04} fill="#fffacd" stroke="#f0e68c" strokeWidth={0.3} />
            <ellipse cx={size*0.64} cy={size*0.67} rx={size*0.008} ry={size*0.01} fill="#ff6347" opacity={0.8} />
            
            {/* Flowers */}
            <g opacity={0.7}>
              <circle cx={size*0.38} cy={size*0.75} r={size*0.02} fill="#ff1493" />
              <circle cx={size*0.42} cy={size*0.76} r={size*0.02} fill="#ffffff" />
              <circle cx={size*0.58} cy={size*0.76} r={size*0.02} fill="#ffff00" />
              <circle cx={size*0.62} cy={size*0.75} r={size*0.02} fill="#ff69b4" />
            </g>
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.88} rx={size*0.35} ry={size*0.1} fill="black" opacity={0.35} />
          </g>
        );
      
      default:
        // Generic shrine
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            <rect x={size*0.35} y={size*0.45} width={size*0.3} height={size*0.35} fill="#8b7355" stroke="#6b5345" strokeWidth={1} />
            <polygon points={`${size*0.32},${size*0.45} ${size*0.5},${size*0.32} ${size*0.68},${size*0.45}`} 
                    fill="#a0522d" stroke="#8a4522" strokeWidth={0.5} />
            <rect x={size*0.45} y={size*0.6} width={size*0.1} height={size*0.2} fill="#2a2a2a" opacity={0.7} />
            <ellipse cx={size/2} cy={size*0.85} rx={size*0.25} ry={size*0.08} fill="black" opacity={0.3} />
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
        {renderShrine()}
      </g>
    </svg>
  );
};

export default ShrineSymbol;