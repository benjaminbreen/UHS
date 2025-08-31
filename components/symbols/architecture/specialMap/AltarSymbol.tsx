/**
 * AltarSymbol.tsx - Culturally and historically accurate religious altars
 * Covers all major religious traditions across different eras
 */
import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface AltarSymbolProps {
  x: number;
  y: number;
  size: number;
  culturalZone?: CulturalZone | string;
  era?: HistoricalEra;
  seed?: number;
}

export const AltarSymbol: React.FC<AltarSymbolProps> = ({ 
  x, 
  y, 
  size, 
  culturalZone = 'Europe',
  era = HistoricalEra.MEDIEVAL,
  seed = 0 
}) => {
  const zone = typeof culturalZone === 'string' ? culturalZone.toUpperCase() : culturalZone;
  const eraNum = typeof era === 'number' ? era : 1500;
  
  // Get religious style based on culture and era
  const getReligiousStyle = () => {
    if (zone.includes('ASIA')) {
      if (eraNum < 0) return 'animist';
      if (eraNum < 600) return 'buddhist_early';
      if (eraNum < 1200) return 'buddhist_mature';
      return 'buddhist_modern';
    } else if (zone.includes('MENA') || zone.includes('NORTH_AFRICAN')) {
      if (eraNum < 600) return 'ancient_semitic';
      if (eraNum < 1800) return 'islamic_classical';
      return 'islamic_modern';
    } else if (zone.includes('SOUTH_ASIAN')) {
      if (eraNum < -1000) return 'vedic';
      if (eraNum < 500) return 'hindu_classical';
      if (eraNum < 1200) return 'hindu_medieval';
      return 'hindu_modern';
    } else if (zone.includes('SUB_SAHARAN')) {
      if (eraNum < 1000) return 'traditional_african';
      if (eraNum < 1800) return 'syncretic';
      return 'modern_african';
    } else if (zone.includes('AMERICAN')) {
      if (eraNum < 1500) return 'mesoamerican';
      if (eraNum < 1800) return 'colonial_catholic';
      return 'modern_american';
    } else if (zone.includes('OCEANIA')) {
      if (eraNum < 1800) return 'polynesian';
      return 'modern_pacific';
    } else { // EUROPEAN
      if (eraNum < 0) return 'pagan';
      if (eraNum < 500) return 'roman_christian';
      if (eraNum < 1000) return 'byzantine';
      if (eraNum < 1500) return 'gothic';
      if (eraNum < 1700) return 'baroque';
      return 'modern_christian';
    }
  };
  
  const style = getReligiousStyle();
  
  // Shadow for depth
  const renderShadow = () => (
    <ellipse 
      cx={x + size * 0.5} 
      cy={y + size * 0.85} 
      rx={size * 0.35} 
      ry={size * 0.12} 
      fill="black" 
      opacity="0.3"
    />
  );
  
  switch (style) {
    case 'vedic':
    case 'hindu_classical':
    case 'hindu_medieval':
    case 'hindu_modern':
      return (
        <g>
          {renderShadow()}
          {/* Stone platform (multiple levels) */}
          <rect x={x + size * 0.15} y={y + size * 0.65} width={size * 0.7} height={size * 0.2} fill="#8b7355" stroke="#6b5345" strokeWidth="1" />
          <rect x={x + size * 0.2} y={y + size * 0.6} width={size * 0.6} height={size * 0.05} fill="#9b8365" stroke="#7b6355" strokeWidth="0.5" />
          <rect x={x + size * 0.25} y={y + size * 0.55} width={size * 0.5} height={size * 0.05} fill="#ab9375" stroke="#8b7365" strokeWidth="0.5" />
          
          {/* Sacred fire pit (havan kund) */}
          <rect x={x + size * 0.35} y={y + size * 0.48} width={size * 0.3} height={size * 0.07} fill="#4a3020" stroke="#3a2010" strokeWidth="0.5" />
          {/* Fire */}
          <path d={`M ${x + size * 0.5} ${y + size * 0.48} l -3 -5 l 2 3 l 2 -4 l 2 3 l -3 3`} fill="#ff6b35" opacity="0.9" />
          <path d={`M ${x + size * 0.5} ${y + size * 0.47} l -2 -3 l 1 2 l 1 -2 l 1 2 l -1 1`} fill="#ffaa00" opacity="0.8" />
          
          {/* Shiva lingam or deity murti */}
          <ellipse cx={x + size * 0.5} cy={y + size * 0.35} rx={size * 0.06} ry={size * 0.12} fill="#3a3a3a" stroke="#2a2a2a" strokeWidth="0.5" />
          <circle cx={x + size * 0.5} cy={y + size * 0.3} r={size * 0.04} fill="#3a3a3a" />
          
          {/* Offerings - flowers, fruits */}
          <circle cx={x + size * 0.3} cy={y + size * 0.52} r={size * 0.025} fill="#ff1493" opacity="0.8" />
          <circle cx={x + size * 0.7} cy={y + size * 0.52} r={size * 0.025} fill="#ffa500" opacity="0.8" />
          <circle cx={x + size * 0.35} cy={y + size * 0.53} r={size * 0.02} fill="#ffff00" opacity="0.7" />
          <circle cx={x + size * 0.65} cy={y + size * 0.53} r={size * 0.02} fill="#ff69b4" opacity="0.7" />
          
          {/* Incense */}
          <rect x={x + size * 0.25} y={y + size * 0.5} width={size * 0.01} height={size * 0.05} fill="#654321" />
          <rect x={x + size * 0.74} y={y + size * 0.5} width={size * 0.01} height={size * 0.05} fill="#654321" />
          <path d={`M ${x + size * 0.25} ${y + size * 0.48} Q ${x + size * 0.26} ${y + size * 0.4} ${x + size * 0.24} ${y + size * 0.3}`} stroke="#d3d3d3" strokeWidth="0.5" fill="none" opacity="0.5" />
          <path d={`M ${x + size * 0.74} ${y + size * 0.48} Q ${x + size * 0.75} ${y + size * 0.4} ${x + size * 0.73} ${y + size * 0.3}`} stroke="#d3d3d3" strokeWidth="0.5" fill="none" opacity="0.5" />
        </g>
      );
      
    case 'buddhist_early':
    case 'buddhist_mature':
    case 'buddhist_modern':
      return (
        <g>
          {renderShadow()}
          {/* Altar table with carved legs */}
          <rect x={x + size * 0.2} y={y + size * 0.6} width={size * 0.6} height={size * 0.25} fill="#3a2010" stroke="#2a1000" strokeWidth="1" />
          <rect x={x + size * 0.25} y={y + size * 0.45} width={size * 0.5} height={size * 0.15} fill="#4a3020" stroke="#3a2010" strokeWidth="0.5" />
          {/* Decorative carving */}
          <path d={`M ${x + size * 0.3} ${y + size * 0.55} Q ${x + size * 0.5} ${y + size * 0.52} ${x + size * 0.7} ${y + size * 0.55}`} stroke="#5a4030" strokeWidth="0.5" fill="none" />
          
          {/* Buddha statue */}
          <ellipse cx={x + size * 0.5} cy={y + size * 0.32} rx={size * 0.08} ry={size * 0.13} fill="#daa520" stroke="#b8860b" strokeWidth="0.5" />
          <circle cx={x + size * 0.5} cy={y + size * 0.22} r={size * 0.05} fill="#daa520" stroke="#b8860b" strokeWidth="0.5" />
          {/* Lotus throne */}
          <ellipse cx={x + size * 0.5} cy={y + size * 0.42} rx={size * 0.1} ry={size * 0.03} fill="#ff69b4" stroke="#ff1493" strokeWidth="0.5" />
          
          {/* Incense burner */}
          <rect x={x + size * 0.32} y={y + size * 0.42} width={size * 0.06} height={size * 0.04} fill="#696969" stroke="#404040" strokeWidth="0.5" />
          <ellipse cx={x + size * 0.35} cy={y + size * 0.42} rx={size * 0.04} ry={size * 0.02} fill="#696969" />
          {/* Incense smoke */}
          <path d={`M ${x + size * 0.35} ${y + size * 0.4} Q ${x + size * 0.36} ${y + size * 0.32} ${x + size * 0.34} ${y + size * 0.24} Q ${x + size * 0.36} ${y + size * 0.18} ${x + size * 0.35} ${y + size * 0.12}`} stroke="#d3d3d3" strokeWidth="1" fill="none" opacity="0.4" />
          
          {/* Offerings - rice, flowers, candles */}
          <ellipse cx={x + size * 0.5} cy={y + size * 0.43} rx={size * 0.04} ry={size * 0.02} fill="#ffffff" stroke="#e0e0e0" strokeWidth="0.3" />
          <circle cx={x + size * 0.62} cy={y + size * 0.43} r={size * 0.025} fill="#ff1493" opacity="0.8" />
          <circle cx={x + size * 0.68} cy={y + size * 0.42} r={size * 0.02} fill="#ffd700" opacity="0.9" />
          
          {/* Prayer wheels or bells */}
          <circle cx={x + size * 0.25} cy={y + size * 0.38} r={size * 0.03} fill="#cd7f32" stroke="#8b5a2b" strokeWidth="0.5" />
          <circle cx={x + size * 0.75} cy={y + size * 0.38} r={size * 0.03} fill="#cd7f32" stroke="#8b5a2b" strokeWidth="0.5" />
        </g>
      );
      
    case 'islamic_classical':
    case 'islamic_modern':
      return (
        <g>
          {renderShadow()}
          {/* Mihrab (prayer niche) with detailed arch */}
          <path d={`M ${x + size * 0.25} ${y + size * 0.8} L ${x + size * 0.25} ${y + size * 0.25} Q ${x + size * 0.5} ${y + size * 0.1} ${x + size * 0.75} ${y + size * 0.25} L ${x + size * 0.75} ${y + size * 0.8} Z`} 
                fill="#e8dcc6" stroke="#8b7566" strokeWidth="1.5" />
          {/* Inner arch with horseshoe shape */}
          <path d={`M ${x + size * 0.32} ${y + size * 0.75} L ${x + size * 0.32} ${y + size * 0.3} Q ${x + size * 0.5} ${y + size * 0.18} ${x + size * 0.68} ${y + size * 0.3} L ${x + size * 0.68} ${y + size * 0.75} Q ${x + size * 0.5} ${y + size * 0.72} ${x + size * 0.32} ${y + size * 0.75}`} 
                fill="#2c5f7c" stroke="#1a4a6a" strokeWidth="0.5" />
          
          {/* Geometric patterns */}
          <g opacity="0.7">
            {/* Star pattern */}
            <path d={`M ${x + size * 0.5} ${y + size * 0.45} l 5 0 l -4 3 l 1.5 -4.8 l 1.5 4.8 l -4 -3 Z`} fill="none" stroke="#ffd700" strokeWidth="0.5" />
            <circle cx={x + size * 0.5} cy={y + size * 0.45} r={size * 0.08} fill="none" stroke="#ffd700" strokeWidth="0.5" />
            <rect x={x + size * 0.42} y={y + size * 0.37} width={size * 0.16} height={size * 0.16} fill="none" stroke="#ffd700" strokeWidth="0.5" transform={`rotate(45 ${x + size * 0.5} ${y + size * 0.45})`} />
          </g>
          
          {/* Prayer rug */}
          <rect x={x + size * 0.3} y={y + size * 0.7} width={size * 0.4} height={size * 0.12} fill="#8b4513" stroke="#654321" strokeWidth="0.5" />
          {/* Rug pattern */}
          <rect x={x + size * 0.32} y={y + size * 0.72} width={size * 0.36} height={size * 0.08} fill="#a0522d" />
          <path d={`M ${x + size * 0.35} ${y + size * 0.76} L ${x + size * 0.65} ${y + size * 0.76}`} stroke="#daa520" strokeWidth="0.5" />
          
          {/* Quran stand */}
          <path d={`M ${x + size * 0.45} ${y + size * 0.65} L ${x + size * 0.42} ${y + size * 0.68} L ${x + size * 0.58} ${y + size * 0.68} L ${x + size * 0.55} ${y + size * 0.65} Z`} fill="#4a3020" stroke="#3a2010" strokeWidth="0.5" />
          <rect x={x + size * 0.46} y={y + size * 0.63} width={size * 0.08} height={size * 0.02} fill="#228b22" stroke="#006400" strokeWidth="0.3" />
          
          {/* Oil lamps */}
          <ellipse cx={x + size * 0.35} cy={y + size * 0.6} rx={size * 0.025} ry={size * 0.015} fill="#ffd700" stroke="#daa520" strokeWidth="0.3" />
          <ellipse cx={x + size * 0.65} cy={y + size * 0.6} rx={size * 0.025} ry={size * 0.015} fill="#ffd700" stroke="#daa520" strokeWidth="0.3" />
          <ellipse cx={x + size * 0.35} cy={y + size * 0.58} rx={size * 0.01} ry={size * 0.015} fill="#ff6347" />
          <ellipse cx={x + size * 0.65} cy={y + size * 0.58} rx={size * 0.01} ry={size * 0.015} fill="#ff6347" />
        </g>
      );
      
    case 'mesoamerican':
      return (
        <g>
          {renderShadow()}
          {/* Stone altar with steps */}
          <rect x={x + size * 0.2} y={y + size * 0.7} width={size * 0.6} height={size * 0.15} fill="#8b7d6b" stroke="#6b5d4b" strokeWidth="1" />
          <rect x={x + size * 0.25} y={y + size * 0.65} width={size * 0.5} height={size * 0.05} fill="#9b8d7b" stroke="#7b6d5b" strokeWidth="0.5" />
          <rect x={x + size * 0.3} y={y + size * 0.6} width={size * 0.4} height={size * 0.05} fill="#ab9d8b" stroke="#8b7d6b" strokeWidth="0.5" />
          <rect x={x + size * 0.35} y={y + size * 0.55} width={size * 0.3} height={size * 0.05} fill="#bbad9b" stroke="#9b8d7b" strokeWidth="0.5" />
          
          {/* Sacrificial bowl */}
          <ellipse cx={x + size * 0.5} cy={y + size * 0.52} rx={size * 0.08} ry={size * 0.04} fill="#4a4a4a" stroke="#2a2a2a" strokeWidth="0.5" />
          <ellipse cx={x + size * 0.5} cy={y + size * 0.5} rx={size * 0.06} ry={size * 0.03} fill="#5a5a5a" />
          
          {/* Jade ornaments */}
          <circle cx={x + size * 0.35} cy={y + size * 0.57} r={size * 0.025} fill="#00ff7f" stroke="#00cd66" strokeWidth="0.5" />
          <circle cx={x + size * 0.65} cy={y + size * 0.57} r={size * 0.025} fill="#00ff7f" stroke="#00cd66" strokeWidth="0.5" />
          
          {/* Feathered serpent carving */}
          <path d={`M ${x + size * 0.3} ${y + size * 0.68} Q ${x + size * 0.5} ${y + size * 0.66} ${x + size * 0.7} ${y + size * 0.68}`} stroke="#6b5d4b" strokeWidth="1" fill="none" />
          <circle cx={x + size * 0.28} cy={y + size * 0.68} r={size * 0.015} fill="#6b5d4b" />
          
          {/* Copal incense burner */}
          <rect x={x + size * 0.25} y={y + size * 0.48} width={size * 0.04} height={size * 0.06} fill="#8b4513" stroke="#654321" strokeWidth="0.3" />
          <rect x={x + size * 0.71} y={y + size * 0.48} width={size * 0.04} height={size * 0.06} fill="#8b4513" stroke="#654321" strokeWidth="0.3" />
          <path d={`M ${x + size * 0.27} ${y + size * 0.46} Q ${x + size * 0.28} ${y + size * 0.38} ${x + size * 0.26} ${y + size * 0.3}`} stroke="#a0a0a0" strokeWidth="0.8" fill="none" opacity="0.5" />
          <path d={`M ${x + size * 0.73} ${y + size * 0.46} Q ${x + size * 0.74} ${y + size * 0.38} ${x + size * 0.72} ${y + size * 0.3}`} stroke="#a0a0a0" strokeWidth="0.8" fill="none" opacity="0.5" />
        </g>
      );
      
    case 'pagan':
    case 'traditional_african':
    case 'polynesian':
      return (
        <g>
          {renderShadow()}
          {/* Natural stone altar */}
          <ellipse cx={x + size * 0.5} cy={y + size * 0.7} rx={size * 0.35} ry={size * 0.15} fill="#696969" stroke="#4a4a4a" strokeWidth="1" />
          <ellipse cx={x + size * 0.5} cy={y + size * 0.65} rx={size * 0.3} ry={size * 0.12} fill="#7a7a7a" stroke="#5a5a5a" strokeWidth="0.5" />
          
          {/* Standing stones or totems */}
          <rect x={x + size * 0.25} y={y + size * 0.3} width={size * 0.08} height={size * 0.35} fill="#5a5a5a" stroke="#3a3a3a" strokeWidth="0.5" />
          <rect x={x + size * 0.67} y={y + size * 0.25} width={size * 0.08} height={size * 0.4} fill="#5a5a5a" stroke="#3a3a3a" strokeWidth="0.5" />
          
          {/* Central fire or offering pit */}
          <ellipse cx={x + size * 0.5} cy={y + size * 0.62} rx={size * 0.08} ry={size * 0.04} fill="#2a2a2a" />
          <path d={`M ${x + size * 0.5} ${y + size * 0.6} l -2 -3 l 1 2 l 1 -2.5 l 1 2 l -1 1.5`} fill="#ff4500" opacity="0.8" />
          <path d={`M ${x + size * 0.5} ${y + size * 0.59} l -1 -1.5 l 0.5 1 l 0.5 -1 l 0.5 1 l -0.5 0.5`} fill="#ffa500" opacity="0.7" />
          
          {/* Natural offerings - shells, feathers, bones */}
          <ellipse cx={x + size * 0.35} cy={y + size * 0.63} rx={size * 0.03} ry={size * 0.02} fill="#fffaf0" stroke="#f5deb3" strokeWidth="0.3" />
          <path d={`M ${x + size * 0.65} ${y + size * 0.63} l 2 -1 l -1 1 l -1 -1 l 0 1`} fill="#8b4513" strokeWidth="0.3" />
          <circle cx={x + size * 0.4} cy={y + size * 0.64} r={size * 0.015} fill="#f0e68c" />
          <circle cx={x + size * 0.6} cy={y + size * 0.64} r={size * 0.015} fill="#deb887" />
        </g>
      );
      
    case 'gothic':
    case 'baroque':
    case 'modern_christian':
    default:
      return (
        <g>
          {renderShadow()}
          {/* Ornate altar table */}
          <rect x={x + size * 0.15} y={y + size * 0.55} width={size * 0.7} height={size * 0.3} fill="#8b8680" stroke="#5a5651" strokeWidth="1.5" />
          {/* Altar front panel with decoration */}
          <rect x={x + size * 0.17} y={y + size * 0.57} width={size * 0.66} height={size * 0.25} fill="#9b9690" stroke="#6a6661" strokeWidth="0.5" />
          
          {/* Altar cloth with embroidery */}
          <rect x={x + size * 0.13} y={y + size * 0.53} width={size * 0.74} height={size * 0.04} fill="#ffffff" stroke="#e0e0e0" strokeWidth="0.5" />
          <path d={`M ${x + size * 0.2} ${y + size * 0.55} L ${x + size * 0.8} ${y + size * 0.55}`} stroke="#ffd700" strokeWidth="0.3" opacity="0.6" />
          
          {/* Crucifix (more detailed) */}
          <rect x={x + size * 0.48} y={y + size * 0.2} width={size * 0.04} height={size * 0.33} fill="#8b4513" stroke="#654321" strokeWidth="0.5" />
          <rect x={x + size * 0.38} y={y + size * 0.28} width={size * 0.24} height={size * 0.04} fill="#8b4513" stroke="#654321" strokeWidth="0.5" />
          {/* Corpus */}
          <ellipse cx={x + size * 0.5} cy={y + size * 0.32} rx={size * 0.015} ry={size * 0.025} fill="#daa520" stroke="#b8860b" strokeWidth="0.3" />
          <circle cx={x + size * 0.5} cy={y + size * 0.26} r={size * 0.012} fill="#daa520" stroke="#b8860b" strokeWidth="0.3" />
          
          {/* Candelabras (tall) */}
          <rect x={x + size * 0.28} y={y + size * 0.45} width={size * 0.03} height={size * 0.08} fill="#ffd700" stroke="#daa520" strokeWidth="0.5" />
          <rect x={x + size * 0.27} y={y + size * 0.5} width={size * 0.05} height={size * 0.03} fill="#ffd700" stroke="#daa520" strokeWidth="0.3" />
          <ellipse cx={x + size * 0.295} cy={y + size * 0.43} rx={size * 0.015} ry={size * 0.02} fill="#ff6347" />
          
          <rect x={x + size * 0.69} y={y + size * 0.45} width={size * 0.03} height={size * 0.08} fill="#ffd700" stroke="#daa520" strokeWidth="0.5" />
          <rect x={x + size * 0.68} y={y + size * 0.5} width={size * 0.05} height={size * 0.03} fill="#ffd700" stroke="#daa520" strokeWidth="0.3" />
          <ellipse cx={x + size * 0.705} cy={y + size * 0.43} rx={size * 0.015} ry={size * 0.02} fill="#ff6347" />
          
          {/* Tabernacle (if Catholic) */}
          {style === 'baroque' || style === 'modern_christian' ? (
            <g>
              <rect x={x + size * 0.45} y={y + size * 0.38} width={size * 0.1} height={size * 0.12} fill="#ffd700" stroke="#daa520" strokeWidth="0.5" />
              <rect x={x + size * 0.46} y={y + size * 0.39} width={size * 0.08} height={size * 0.1} fill="#fff8dc" stroke="#f0e68c" strokeWidth="0.3" />
              <circle cx={x + size * 0.5} cy={y + size * 0.44} r={size * 0.015} fill="#ffd700" />
            </g>
          ) : null}
          
          {/* Bible/Missal */}
          <rect x={x + size * 0.35} y={y + size * 0.48} width={size * 0.08} height={size * 0.05} fill="#8b0000" stroke="#5c0000" strokeWidth="0.5" />
          <rect x={x + size * 0.36} y={y + size * 0.49} width={size * 0.06} height={size * 0.001} fill="#ffd700" />
          
          {/* Chalice and paten */}
          <ellipse cx={x + size * 0.6} cy={y + size * 0.48} rx={size * 0.025} ry={size * 0.015} fill="#ffd700" stroke="#daa520" strokeWidth="0.3" />
          <rect x={x + size * 0.59} y={y + size * 0.48} width={size * 0.02} height={size * 0.03} fill="#ffd700" stroke="#daa520" strokeWidth="0.3" />
          <ellipse cx={x + size * 0.6} cy={y + size * 0.51} rx={size * 0.015} ry={size * 0.01} fill="#ffd700" stroke="#daa520" strokeWidth="0.3" />
        </g>
      );
  }
};