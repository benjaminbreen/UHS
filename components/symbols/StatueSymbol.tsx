/**
 * StatueSymbol.tsx - Culturally and historically accurate statues
 * From ancient idols to modern sculptures across all civilizations
 */
import React from 'react';

interface StatueSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: string;
  era?: number;
  facing?: 'north' | 'south' | 'east' | 'west';
  opacity?: number;
}

const StatueSymbol: React.FC<StatueSymbolProps> = ({ 
  x, 
  y, 
  size, 
  culturalZone = 'EUROPEAN',
  era = 1500,
  facing = 'south',
  opacity = 1.0 
}) => {
  const zone = culturalZone?.toUpperCase();
  
  // Determine statue style based on culture and era
  const getStatueStyle = () => {
    if (zone.includes('ASIA')) {
      if (era < 0) return 'terracotta_warrior';
      if (era < 800) return 'buddha_statue';
      if (era < 1500) return 'guardian_lion';
      return 'modern_asian';
    } else if (zone.includes('MENA') || zone.includes('NORTH_AFRICAN')) {
      if (era < -2000) return 'sphinx';
      if (era < 0) return 'pharaoh';
      if (era < 1500) return 'islamic_calligraphy';
      return 'modern_mena';
    } else if (zone.includes('SOUTH_ASIAN')) {
      if (era < 0) return 'dancing_shiva';
      if (era < 1200) return 'ganesha';
      return 'modern_indian';
    } else if (zone.includes('SUB_SAHARAN')) {
      if (era < 1500) return 'ancestral_figure';
      return 'modern_african';
    } else if (zone.includes('AMERICAN')) {
      if (era < 0) return 'olmec_head';
      if (era < 1500) return 'totem_pole';
      if (era < 1800) return 'colonial_monument';
      return 'modern_american';
    } else if (zone.includes('OCEANIA')) {
      if (era < 1800) return 'moai';
      return 'modern_pacific';
    } else { // EUROPEAN
      if (era < -500) return 'kouros';
      if (era < 500) return 'roman_emperor';
      if (era < 1400) return 'medieval_knight';
      if (era < 1700) return 'renaissance_david';
      if (era < 1900) return 'neoclassical';
      return 'modern_abstract';
    }
  };
  
  const statueStyle = getStatueStyle();
  const rotation = { north: 180, south: 0, east: 270, west: 90 }[facing];
  
  const renderStatue = () => {
    switch (statueStyle) {
      case 'terracotta_warrior':
      case 'buddha_statue':
        // Asian Buddha or warrior
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Base pedestal */}
            <rect x={size*0.3} y={size*0.7} width={size*0.4} height={size*0.15} fill="#8b7355" stroke="#6b5345" strokeWidth={1} />
            <rect x={size*0.32} y={size*0.68} width={size*0.36} height={size*0.04} fill="#9b8365" />
            
            {statueStyle === 'buddha_statue' ? (
              <>
                {/* Buddha body */}
                <ellipse cx={size/2} cy={size*0.5} rx={size*0.15} ry={size*0.2} fill="#daa520" stroke="#b8860b" strokeWidth={0.5} />
                {/* Head */}
                <circle cx={size/2} cy={size*0.35} r={size*0.08} fill="#daa520" stroke="#b8860b" strokeWidth={0.5} />
                {/* Ushnisha (top knot) */}
                <circle cx={size/2} cy={size*0.28} r={size*0.03} fill="#daa520" />
                {/* Eyes */}
                <line x1={size*0.47} y1={size*0.34} x2={size*0.48} y2={size*0.35} stroke="#8b6914" strokeWidth={0.5} />
                <line x1={size*0.52} y1={size*0.35} x2={size*0.53} y2={size*0.34} stroke="#8b6914" strokeWidth={0.5} />
                {/* Meditation pose hands */}
                <ellipse cx={size/2} cy={size*0.55} rx={size*0.06} ry={size*0.03} fill="#daa520" />
                {/* Lotus base */}
                <ellipse cx={size/2} cy={size*0.68} rx={size*0.12} ry={size*0.04} fill="#ff69b4" stroke="#ff1493" strokeWidth={0.5} opacity={0.7} />
              </>
            ) : (
              <>
                {/* Warrior body */}
                <rect x={size*0.4} y={size*0.45} width={size*0.2} height={size*0.25} fill="#8b7355" stroke="#6b5345" strokeWidth={0.5} />
                {/* Armor plates */}
                <rect x={size*0.41} y={size*0.47} width={size*0.18} height={size*0.05} fill="#6b5345" />
                <rect x={size*0.41} y={size*0.53} width={size*0.18} height={size*0.05} fill="#6b5345" />
                <rect x={size*0.41} y={size*0.59} width={size*0.18} height={size*0.05} fill="#6b5345" />
                {/* Head */}
                <circle cx={size/2} cy={size*0.38} r={size*0.06} fill="#8b7355" stroke="#6b5345" strokeWidth={0.5} />
                {/* Helmet */}
                <path d={`M ${size*0.44} ${size*0.35} Q ${size*0.5} ${size*0.32} ${size*0.56} ${size*0.35}`} fill="#5b4335" />
                {/* Arms */}
                <rect x={size*0.36} y={size*0.48} width={size*0.04} height={size*0.15} fill="#8b7355" stroke="#6b5345" strokeWidth={0.5} />
                <rect x={size*0.6} y={size*0.48} width={size*0.04} height={size*0.15} fill="#8b7355" stroke="#6b5345" strokeWidth={0.5} />
              </>
            )}
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.88} rx={size*0.25} ry={size*0.08} fill="black" opacity={0.3} />
          </g>
        );
      
      case 'guardian_lion':
        // Chinese guardian lion/foo dog
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Base */}
            <rect x={size*0.3} y={size*0.72} width={size*0.4} height={size*0.12} fill="#8b7355" stroke="#6b5345" strokeWidth={1} />
            
            {/* Body */}
            <ellipse cx={size/2} cy={size*0.6} rx={size*0.18} ry={size*0.15} fill="#cd853f" stroke="#a0522d" strokeWidth={0.5} />
            
            {/* Head */}
            <circle cx={size/2} cy={size*0.42} r={size*0.12} fill="#cd853f" stroke="#a0522d" strokeWidth={0.5} />
            {/* Mane */}
            <circle cx={size*0.42} cy={size*0.4} r={size*0.04} fill="#daa520" opacity={0.7} />
            <circle cx={size*0.58} cy={size*0.4} r={size*0.04} fill="#daa520" opacity={0.7} />
            <circle cx={size*0.45} cy={size*0.35} r={size*0.04} fill="#daa520" opacity={0.7} />
            <circle cx={size*0.55} cy={size*0.35} r={size*0.04} fill="#daa520" opacity={0.7} />
            
            {/* Face features */}
            <circle cx={size*0.46} cy={size*0.41} r={size*0.015} fill="#2a2a2a" />
            <circle cx={size*0.54} cy={size*0.41} r={size*0.015} fill="#2a2a2a" />
            <path d={`M ${size*0.48} ${size*0.46} Q ${size*0.5} ${size*0.48} ${size*0.52} ${size*0.46}`} stroke="#2a2a2a" strokeWidth={1} fill="none" />
            
            {/* Paws */}
            <ellipse cx={size*0.4} cy={size*0.7} rx={size*0.05} ry={size*0.03} fill="#cd853f" />
            <ellipse cx={size*0.6} cy={size*0.7} rx={size*0.05} ry={size*0.03} fill="#cd853f" />
            
            {/* Ball under paw */}
            <circle cx={size*0.4} cy={size*0.68} r={size*0.03} fill="#ff6347" opacity={0.8} />
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.88} rx={size*0.28} ry={size*0.08} fill="black" opacity={0.3} />
          </g>
        );
      
      case 'sphinx':
      case 'pharaoh':
        // Egyptian statue
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Base */}
            <rect x={size*0.25} y={size*0.75} width={size*0.5} height={size*0.1} fill="#e8dcc6" stroke="#c8bca6" strokeWidth={1} />
            
            {statueStyle === 'sphinx' ? (
              <>
                {/* Sphinx body */}
                <rect x={size*0.3} y={size*0.55} width={size*0.4} height={size*0.2} fill="#d4af37" stroke="#b8860b" strokeWidth={0.5} />
                {/* Human head */}
                <rect x={size*0.43} y={size*0.35} width={size*0.14} height={size*0.2} fill="#d4af37" stroke="#b8860b" strokeWidth={0.5} />
                {/* Nemes headdress */}
                <polygon points={`${size*0.4},${size*0.35} ${size*0.5},${size*0.28} ${size*0.6},${size*0.35} ${size*0.58},${size*0.45} ${size*0.42},${size*0.45}`} 
                        fill="#4169e1" stroke="#1e90ff" strokeWidth={0.5} />
                {/* Face */}
                <line x1={size*0.46} y1={size*0.4} x2={size*0.47} y2={size*0.4} stroke="#8b6914" strokeWidth={1} />
                <line x1={size*0.53} y1={size*0.4} x2={size*0.54} y2={size*0.4} stroke="#8b6914" strokeWidth={1} />
                <line x1={size*0.48} y1={size*0.43} x2={size*0.52} y2={size*0.43} stroke="#8b6914" strokeWidth={0.5} />
                {/* Paws */}
                <rect x={size*0.28} y={size*0.68} width={size*0.08} height={size*0.07} fill="#d4af37" />
                <rect x={size*0.64} y={size*0.68} width={size*0.08} height={size*0.07} fill="#d4af37" />
              </>
            ) : (
              <>
                {/* Pharaoh body */}
                <rect x={size*0.38} y={size*0.45} width={size*0.24} height={size*0.3} fill="#d4af37" stroke="#b8860b" strokeWidth={0.5} />
                {/* Head */}
                <rect x={size*0.43} y={size*0.3} width={size*0.14} height={size*0.15} fill="#d4af37" stroke="#b8860b" strokeWidth={0.5} />
                {/* Crown */}
                <polygon points={`${size*0.42},${size*0.3} ${size*0.5},${size*0.22} ${size*0.58},${size*0.3}`} 
                        fill="#dc143c" stroke="#8b0000" strokeWidth={0.5} />
                {/* Arms crossed */}
                <path d={`M ${size*0.38} ${size*0.5} L ${size*0.45} ${size*0.55} L ${size*0.55} ${size*0.55} L ${size*0.62} ${size*0.5}`} 
                      stroke="#b8860b" strokeWidth={2} fill="none" />
                {/* Hieroglyphs */}
                <text x={size*0.42} y={size*0.65} fontSize={size*0.04} fill="#8b6914">𓂀𓏏𓈖</text>
              </>
            )}
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.88} rx={size*0.3} ry={size*0.08} fill="black" opacity={0.35} />
          </g>
        );
      
      case 'dancing_shiva':
      case 'ganesha':
        // Hindu deity statue
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Pedestal */}
            <rect x={size*0.3} y={size*0.72} width={size*0.4} height={size*0.12} fill="#8b7355" stroke="#6b5345" strokeWidth={1} />
            
            {statueStyle === 'ganesha' ? (
              <>
                {/* Ganesha body */}
                <ellipse cx={size/2} cy={size*0.55} rx={size*0.18} ry={size*0.15} fill="#ff6b35" stroke="#ff4500" strokeWidth={0.5} />
                {/* Elephant head */}
                <ellipse cx={size/2} cy={size*0.38} rx={size*0.12} ry={size*0.1} fill="#ff6b35" stroke="#ff4500" strokeWidth={0.5} />
                {/* Trunk */}
                <path d={`M ${size*0.5} ${size*0.42} Q ${size*0.48} ${size*0.48} ${size*0.52} ${size*0.52}`} 
                      stroke="#ff4500" strokeWidth={2} fill="none" />
                {/* Crown */}
                <path d={`M ${size*0.44} ${size*0.32} Q ${size*0.5} ${size*0.28} ${size*0.56} ${size*0.32}`} 
                      fill="#ffd700" stroke="#daa520" strokeWidth={0.5} />
                {/* Multiple arms */}
                <ellipse cx={size*0.35} cy={size*0.5} rx={size*0.03} ry={size*0.08} fill="#ff6b35" />
                <ellipse cx={size*0.65} cy={size*0.5} rx={size*0.03} ry={size*0.08} fill="#ff6b35" />
                <ellipse cx={size*0.32} cy={size*0.52} rx={size*0.03} ry={size*0.08} fill="#ff6b35" />
                <ellipse cx={size*0.68} cy={size*0.52} rx={size*0.03} ry={size*0.08} fill="#ff6b35" />
              </>
            ) : (
              <>
                {/* Shiva Nataraja - dancing in ring of fire */}
                {/* Ring of fire */}
                <circle cx={size/2} cy={size*0.45} r={size*0.25} fill="none" stroke="#ff6347" strokeWidth={2} opacity={0.7} />
                <circle cx={size/2} cy={size*0.45} r={size*0.23} fill="none" stroke="#ffa500" strokeWidth={1} opacity={0.5} />
                {/* Body */}
                <ellipse cx={size/2} cy={size*0.5} rx={size*0.08} ry={size*0.12} fill="#4169e1" stroke="#1e90ff" strokeWidth={0.5} />
                {/* Head */}
                <circle cx={size/2} cy={size*0.38} r={size*0.05} fill="#4169e1" stroke="#1e90ff" strokeWidth={0.5} />
                {/* Dancing pose - raised leg */}
                <path d={`M ${size*0.48} ${size*0.58} L ${size*0.45} ${size*0.65} L ${size*0.43} ${size*0.7}`} 
                      stroke="#1e90ff" strokeWidth={2} fill="none" />
                <path d={`M ${size*0.52} ${size*0.58} L ${size*0.55} ${size*0.48} L ${size*0.58} ${size*0.45}`} 
                      stroke="#1e90ff" strokeWidth={2} fill="none" />
                {/* Four arms */}
                <line x1={size*0.45} y1={size*0.45} x2={size*0.35} y2={size*0.4} stroke="#1e90ff" strokeWidth={1.5} />
                <line x1={size*0.55} y1={size*0.45} x2={size*0.65} y2={size*0.4} stroke="#1e90ff" strokeWidth={1.5} />
                <line x1={size*0.45} y1={size*0.48} x2={size*0.35} y2={size*0.53} stroke="#1e90ff" strokeWidth={1.5} />
                <line x1={size*0.55} y1={size*0.48} x2={size*0.65} y2={size*0.53} stroke="#1e90ff" strokeWidth={1.5} />
                {/* Drum in hand */}
                <circle cx={size*0.65} cy={size*0.4} r={size*0.02} fill="#8b4513" />
              </>
            )}
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.88} rx={size*0.28} ry={size*0.08} fill="black" opacity={0.35} />
          </g>
        );
      
      case 'olmec_head':
      case 'totem_pole':
        // Pre-Columbian American
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {statueStyle === 'olmec_head' ? (
              <>
                {/* Colossal Olmec head */}
                <ellipse cx={size/2} cy={size*0.6} rx={size*0.28} ry={size*0.25} fill="#696969" stroke="#4a4a4a" strokeWidth={1} />
                {/* Helmet/headdress */}
                <path d={`M ${size*0.25} ${size*0.45} Q ${size*0.5} ${size*0.35} ${size*0.75} ${size*0.45}`} 
                      fill="#5a5a5a" stroke="#3a3a3a" strokeWidth={0.5} />
                {/* Face features */}
                <ellipse cx={size*0.42} cy={size*0.55} rx={size*0.03} ry={size*0.02} fill="#3a3a3a" />
                <ellipse cx={size*0.58} cy={size*0.55} rx={size*0.03} ry={size*0.02} fill="#3a3a3a" />
                {/* Broad nose */}
                <ellipse cx={size/2} cy={size*0.6} rx={size*0.06} ry={size*0.03} fill="#4a4a4a" />
                {/* Lips */}
                <path d={`M ${size*0.42} ${size*0.66} Q ${size*0.5} ${size*0.68} ${size*0.58} ${size*0.66}`} 
                      stroke="#3a3a3a" strokeWidth={2} fill="none" />
              </>
            ) : (
              <>
                {/* Totem pole */}
                <rect x={size*0.4} y={size*0.25} width={size*0.2} height={size*0.55} fill="#8b4513" stroke="#654321" strokeWidth={1} />
                
                {/* Top figure - eagle */}
                <ellipse cx={size/2} cy={size*0.3} rx={size*0.08} ry={size*0.06} fill="#654321" stroke="#4a3020" strokeWidth={0.5} />
                {/* Wings */}
                <path d={`M ${size*0.35} ${size*0.3} L ${size*0.3} ${size*0.28} L ${size*0.35} ${size*0.32}`} fill="#4a3020" />
                <path d={`M ${size*0.65} ${size*0.3} L ${size*0.7} ${size*0.28} L ${size*0.65} ${size*0.32}`} fill="#4a3020" />
                {/* Beak */}
                <polygon points={`${size*0.5},${size*0.3} ${size*0.48},${size*0.32} ${size*0.52},${size*0.32}`} fill="#ffd700" />
                
                {/* Middle figure - bear */}
                <circle cx={size/2} cy={size*0.5} r={size*0.07} fill="#4a3020" stroke="#3a2010" strokeWidth={0.5} />
                {/* Eyes and snout */}
                <circle cx={size*0.47} cy={size*0.48} r={size*0.01} fill="#ffffff" />
                <circle cx={size*0.53} cy={size*0.48} r={size*0.01} fill="#ffffff" />
                <ellipse cx={size/2} cy={size*0.52} rx={size*0.03} ry={size*0.02} fill="#3a2010" />
                
                {/* Bottom figure - human */}
                <ellipse cx={size/2} cy={size*0.7} rx={size*0.07} ry={size*0.08} fill="#654321" stroke="#4a3020" strokeWidth={0.5} />
                {/* Face paint */}
                <line x1={size*0.45} y1={size*0.68} x2={size*0.47} y2={size*0.7} stroke="#dc143c" strokeWidth={1} />
                <line x1={size*0.55} y1={size*0.68} x2={size*0.53} y2={size*0.7} stroke="#dc143c" strokeWidth={1} />
              </>
            )}
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.88} rx={size*0.3} ry={size*0.08} fill="black" opacity={0.35} />
          </g>
        );
      
      case 'moai':
        // Easter Island moai
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Moai body */}
            <rect x={size*0.35} y={size*0.45} width={size*0.3} height={size*0.35} fill="#696969" stroke="#4a4a4a" strokeWidth={1} />
            
            {/* Head */}
            <rect x={size*0.37} y={size*0.25} width={size*0.26} height={size*0.22} fill="#696969" stroke="#4a4a4a" strokeWidth={0.5} />
            
            {/* Prominent brow */}
            <rect x={size*0.38} y={size*0.32} width={size*0.24} height={size*0.03} fill="#5a5a5a" />
            
            {/* Deep-set eyes */}
            <ellipse cx={size*0.43} cy={size*0.35} rx={size*0.02} ry={size*0.01} fill="#3a3a3a" />
            <ellipse cx={size*0.57} cy={size*0.35} rx={size*0.02} ry={size*0.01} fill="#3a3a3a" />
            
            {/* Long nose */}
            <rect x={size*0.49} y={size*0.36} width={size*0.02} height={size*0.06} fill="#5a5a5a" />
            
            {/* Lips */}
            <rect x={size*0.45} y={size*0.43} width={size*0.1} height={size*0.02} fill="#5a5a5a" />
            
            {/* Arms/hands on belly */}
            <ellipse cx={size*0.42} cy={size*0.6} rx={size*0.03} ry={size*0.05} fill="#5a5a5a" />
            <ellipse cx={size*0.58} cy={size*0.6} rx={size*0.03} ry={size*0.05} fill="#5a5a5a" />
            
            {/* Pukao (red stone hat) - optional */}
            {era < 1700 && (
              <ellipse cx={size/2} cy={size*0.23} rx={size*0.12} ry={size*0.04} fill="#cd5c5c" stroke="#a52a2a" strokeWidth={0.5} />
            )}
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.85} rx={size*0.25} ry={size*0.08} fill="black" opacity={0.35} />
          </g>
        );
      
      case 'kouros':
      case 'roman_emperor':
      case 'renaissance_david':
        // Classical European
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Pedestal */}
            <rect x={size*0.32} y={size*0.75} width={size*0.36} height={size*0.1} fill="#f0f0f0" stroke="#d0d0d0" strokeWidth={1} />
            
            {/* Body */}
            <rect x={size*0.42} y={size*0.48} width={size*0.16} height={size*0.27} fill="#f0f0f0" stroke="#d0d0d0" strokeWidth={0.5} />
            
            {/* Head */}
            <circle cx={size/2} cy={size*0.38} r={size*0.06} fill="#f0f0f0" stroke="#d0d0d0" strokeWidth={0.5} />
            
            {statueStyle === 'roman_emperor' && (
              <>
                {/* Toga draping */}
                <path d={`M ${size*0.42} ${size*0.48} Q ${size*0.38} ${size*0.55} ${size*0.42} ${size*0.65}`} 
                      stroke="#d0d0d0" strokeWidth={0.5} fill="none" />
                <path d={`M ${size*0.58} ${size*0.48} Q ${size*0.62} ${size*0.55} ${size*0.58} ${size*0.65}`} 
                      stroke="#d0d0d0" strokeWidth={0.5} fill="none" />
                {/* Laurel wreath */}
                <ellipse cx={size/2} cy={size*0.35} rx={size*0.07} ry={size*0.03} fill="none" stroke="#daa520" strokeWidth={0.5} />
              </>
            )}
            
            {statueStyle === 'renaissance_david' && (
              <>
                {/* Muscular definition */}
                <line x1={size*0.5} y1={size*0.48} x2={size*0.5} y2={size*0.65} stroke="#d0d0d0" strokeWidth={0.3} />
                <path d={`M ${size*0.45} ${size*0.52} Q ${size*0.5} ${size*0.51} ${size*0.55} ${size*0.52}`} 
                      stroke="#d0d0d0" strokeWidth={0.3} fill="none" />
                {/* Contrapposto pose - bent arm */}
                <path d={`M ${size*0.42} ${size*0.5} L ${size*0.38} ${size*0.45} L ${size*0.4} ${size*0.42}`} 
                      stroke="#d0d0d0" strokeWidth={1} fill="none" />
              </>
            )}
            
            {/* Arms */}
            <rect x={size*0.38} y={size*0.5} width={size*0.04} height={size*0.18} fill="#f0f0f0" stroke="#d0d0d0" strokeWidth={0.5} />
            <rect x={size*0.58} y={size*0.5} width={size*0.04} height={size*0.18} fill="#f0f0f0" stroke="#d0d0d0" strokeWidth={0.5} />
            
            {/* Legs */}
            <rect x={size*0.44} y={size*0.65} width={size*0.05} height={size*0.1} fill="#f0f0f0" stroke="#d0d0d0" strokeWidth={0.5} />
            <rect x={size*0.51} y={size*0.65} width={size*0.05} height={size*0.1} fill="#f0f0f0" stroke="#d0d0d0" strokeWidth={0.5} />
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.88} rx={size*0.25} ry={size*0.08} fill="black" opacity={0.3} />
          </g>
        );
      
      case 'medieval_knight':
        // Medieval armored figure
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Stone base */}
            <rect x={size*0.32} y={size*0.75} width={size*0.36} height={size*0.1} fill="#8b8680" stroke="#5a5651" strokeWidth={1} />
            
            {/* Body in armor */}
            <rect x={size*0.4} y={size*0.45} width={size*0.2} height={size*0.3} fill="#4a4a4a" stroke="#2a2a2a" strokeWidth={0.5} />
            
            {/* Chainmail texture */}
            <g opacity={0.5}>
              <circle cx={size*0.45} cy={size*0.5} r={size*0.005} fill="#6a6a6a" />
              <circle cx={size*0.47} cy={size*0.5} r={size*0.005} fill="#6a6a6a" />
              <circle cx={size*0.49} cy={size*0.5} r={size*0.005} fill="#6a6a6a" />
              <circle cx={size*0.51} cy={size*0.5} r={size*0.005} fill="#6a6a6a" />
              <circle cx={size*0.53} cy={size*0.5} r={size*0.005} fill="#6a6a6a" />
              <circle cx={size*0.55} cy={size*0.5} r={size*0.005} fill="#6a6a6a" />
            </g>
            
            {/* Helmet */}
            <rect x={size*0.44} y={size*0.35} width={size*0.12} height={size*0.1} fill="#4a4a4a" stroke="#2a2a2a" strokeWidth={0.5} />
            {/* Visor slit */}
            <rect x={size*0.46} y={size*0.38} width={size*0.08} height={size*0.01} fill="#2a2a2a" />
            
            {/* Shield arm */}
            <rect x={size*0.35} y={size*0.48} width={size*0.05} height={size*0.2} fill="#4a4a4a" stroke="#2a2a2a" strokeWidth={0.5} />
            {/* Shield */}
            <path d={`M ${size*0.32} ${size*0.5} L ${size*0.32} ${size*0.65} Q ${size*0.35} ${size*0.68} ${size*0.38} ${size*0.65} L ${size*0.38} ${size*0.5}`} 
                  fill="#dc143c" stroke="#8b0000" strokeWidth={0.5} />
            {/* Heraldry on shield */}
            <path d={`M ${size*0.35} ${size*0.55} L ${size*0.33} ${size*0.58} L ${size*0.35} ${size*0.61} L ${size*0.37} ${size*0.58}`} 
                  fill="#ffd700" />
            
            {/* Sword arm */}
            <rect x={size*0.6} y={size*0.48} width={size*0.05} height={size*0.2} fill="#4a4a4a" stroke="#2a2a2a" strokeWidth={0.5} />
            {/* Sword */}
            <rect x={size*0.62} y={size*0.3} width={size*0.02} height={size*0.35} fill="#c0c0c0" stroke="#808080" strokeWidth={0.5} />
            <rect x={size*0.6} y={size*0.42} width={size*0.06} height={size*0.02} fill="#8b4513" />
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.88} rx={size*0.28} ry={size*0.08} fill="black" opacity={0.35} />
          </g>
        );
      
      default: // modern_abstract
        // Modern abstract sculpture
        return (
          <g transform={`rotate(${rotation} ${size/2} ${size/2})`}>
            {/* Metal base */}
            <rect x={size*0.35} y={size*0.75} width={size*0.3} height={size*0.08} fill="#4a4a4a" stroke="#2a2a2a" strokeWidth={0.5} />
            
            {/* Abstract forms */}
            <ellipse cx={size*0.45} cy={size*0.5} rx={size*0.15} ry={size*0.25} fill="#ff6347" opacity={0.8} 
                    transform={`rotate(20 ${size*0.45} ${size*0.5})`} />
            <ellipse cx={size*0.55} cy={size*0.45} rx={size*0.12} ry={size*0.2} fill="#4682b4" opacity={0.8} 
                    transform={`rotate(-30 ${size*0.55} ${size*0.45})`} />
            <circle cx={size/2} cy={size*0.35} r={size*0.08} fill="#ffd700" opacity={0.7} />
            
            {/* Connecting elements */}
            <rect x={size*0.48} y={size*0.4} width={size*0.04} height={size*0.35} fill="#2a2a2a" 
                  transform={`rotate(10 ${size*0.5} ${size*0.55})`} />
            
            {/* Shadow */}
            <ellipse cx={size/2} cy={size*0.85} rx={size*0.25} ry={size*0.08} fill="black" opacity={0.25} />
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
        {renderStatue()}
      </g>
    </svg>
  );
};

export default StatueSymbol;