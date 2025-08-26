/**
 * components/symbols/NPCBoatSymbol.tsx - Schematic isometric boats matching game aesthetic
 * Fixed orientation with era and culture-specific designs
 */
import React from 'react';

interface NPCBoatSymbolProps {
  x: number;
  y: number;
  size: number;
  rotation: number; // Still passed but not used for sprite rotation
  boatType: 'fishing' | 'cargo' | 'ferry';
  era?: string;
  culture?: string;
  scale?: number; // Size multiplier
}

const NPCBoatSymbol: React.FC<NPCBoatSymbolProps> = ({ 
  x, y, size, rotation, boatType, era = 'medieval', culture = 'european', scale = 1.0 
}) => {
  // Parse era to determine boat style
  const getEraCategory = (eraStr: string): 'prehistoric' | 'ancient' | 'medieval' | 'early_modern' | 'industrial' | 'modern' => {
    const yearMatch = eraStr.match(/\d+/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0]);
      if (year < -500) return 'prehistoric';
      if (year < 500) return 'ancient';
      if (year < 1500) return 'medieval';
      if (year < 1800) return 'early_modern';
      if (year < 1950) return 'industrial';
      return 'modern';
    }
    const e = eraStr.toLowerCase();
    if (e.includes('prehistor')) return 'prehistoric';
    if (e.includes('ancient') || e.includes('antiquity')) return 'ancient';
    if (e.includes('medieval')) return 'medieval';
    if (e.includes('early') || e.includes('renaissance')) return 'early_modern';
    if (e.includes('industrial')) return 'industrial';
    if (e.includes('modern')) return 'modern';
    return 'medieval';
  };

  const eraCategory = getEraCategory(era);
  
  // Size varies by era - prehistoric smallest, modern largest
  const eraSizeMultiplier = {
    prehistoric: 0.5,
    ancient: 0.6,
    medieval: 0.7,
    early_modern: 0.85,
    industrial: 0.95,
    modern: 1.0
  }[eraCategory];
  
  // Actual size with all multipliers (reduced from before)
  const actualSize = size * scale * eraSizeMultiplier * 0.75; // 75% of previous size
  
  // Color schemes by culture and boat type
  const getColors = () => {
    const baseColors = {
      fishing: { hull: '#CD853F', sail: '#FFF8DC', accent: '#8B4513' },
      cargo: { hull: '#8B6F47', sail: '#F5DEB3', accent: '#654321' },
      ferry: { hull: '#B8860B', sail: '#FFFACD', accent: '#D2691E' }
    };
    
    // Culture-specific color overrides
    if (culture === 'mena' || culture === 'middle_eastern') {
      return {
        hull: '#D2691E',
        sail: '#FAEBD7',
        accent: '#8B4513',
        flag: '#DC143C'
      };
    }
    if (culture === 'east_asian' || culture === 'chinese' || culture === 'japanese') {
      return {
        hull: '#8B4513',
        sail: '#FFE4B5',
        accent: '#A0522D',
        flag: '#FF6347'
      };
    }
    if (culture === 'nordic' || culture === 'scandinavian') {
      return {
        hull: '#4B4B4D',
        sail: '#F0E68C',
        accent: '#2F4F4F',
        flag: '#4169E1'
      };
    }
    
    const colors = baseColors[boatType];
    return { ...colors, flag: boatType === 'ferry' ? '#FF6B6B' : boatType === 'cargo' ? '#4A90E2' : '#FFD700' };
  };
  
  const colors = getColors();
  
  // Calculate wake direction based on rotation (for visual effect only)
  const wakeRotation = rotation;
  
  // Render different boat designs based on era
  const renderBoat = () => {
    switch (eraCategory) {
      case 'prehistoric':
        // Simple dugout canoe or raft
        return (
          <g>
            {/* Simple log raft */}
            <rect x={-actualSize * 0.4} y={-actualSize * 0.15} width={actualSize * 0.8} height={actualSize * 0.06} fill="#8B6239" />
            <rect x={-actualSize * 0.35} y={-actualSize * 0.08} width={actualSize * 0.7} height={actualSize * 0.06} fill="#A0826D" />
            <rect x={-actualSize * 0.3} y={-actualSize * 0.01} width={actualSize * 0.6} height={actualSize * 0.06} fill="#8B6239" />
            {/* Paddle/pole */}
            <rect x={actualSize * 0.1} y={-actualSize * 0.2} width={actualSize * 0.03} height={actualSize * 0.4} fill="#654321" />
            {/* Person */}
            <circle cx={0} cy={-actualSize * 0.08} r={actualSize * 0.05} fill="#8B7355" />
          </g>
        );
        
      case 'ancient':
        // Greek/Roman galley style
        return (
          <g>
            {/* Hull - elongated */}
            <path
              d={`M ${-actualSize * 0.45} 0 
                  L ${actualSize * 0.45} 0 
                  L ${actualSize * 0.35} ${actualSize * 0.2} 
                  L ${-actualSize * 0.35} ${actualSize * 0.2} Z`}
              fill={colors.hull}
              stroke="#654321"
              strokeWidth="0.5"
            />
            {/* Deck */}
            <rect x={-actualSize * 0.4} y={-actualSize * 0.05} width={actualSize * 0.8} height={actualSize * 0.08} fill="#A0826D" />
            {/* Square sail */}
            <rect x={-actualSize * 0.02} y={-actualSize * 0.35} width={actualSize * 0.04} height={actualSize * 0.3} fill="#654321" />
            <rect x={-actualSize * 0.2} y={-actualSize * 0.3} width={actualSize * 0.4} height={actualSize * 0.2} fill={colors.sail} opacity="0.9" />
            {/* Oar indications */}
            {[-0.3, -0.2, -0.1, 0.1, 0.2, 0.3].map(pos => (
              <rect key={pos} x={pos * actualSize} y={actualSize * 0.05} width={actualSize * 0.02} height={actualSize * 0.15} fill="#8B6239" />
            ))}
          </g>
        );
        
      case 'medieval':
        // Classic medieval cog
        return (
          <g>
            {/* Hull */}
            <path
              d={`M ${-actualSize * 0.35} 0 
                  L ${actualSize * 0.35} 0 
                  L ${actualSize * 0.25} ${actualSize * 0.25} 
                  L ${-actualSize * 0.25} ${actualSize * 0.25} Z`}
              fill={colors.hull}
              stroke="#5D4E37"
              strokeWidth="0.5"
            />
            {/* Castle structures */}
            <rect x={-actualSize * 0.3} y={-actualSize * 0.1} width={actualSize * 0.15} height={actualSize * 0.15} fill="#8B7355" />
            <rect x={actualSize * 0.15} y={-actualSize * 0.1} width={actualSize * 0.15} height={actualSize * 0.15} fill="#8B7355" />
            {/* Mast and sail */}
            <rect x={-actualSize * 0.02} y={-actualSize * 0.4} width={actualSize * 0.04} height={actualSize * 0.4} fill="#654321" />
            <path
              d={`M ${actualSize * 0.02} ${-actualSize * 0.35} 
                  Q ${actualSize * 0.25} ${-actualSize * 0.2} 
                  ${actualSize * 0.02} ${-actualSize * 0.05}`}
              fill={colors.sail}
              opacity="0.95"
            />
            {/* Cross on sail for European */}
            {culture === 'european' && (
              <g>
                <rect x={actualSize * 0.08} y={-actualSize * 0.25} width={actualSize * 0.08} height={actualSize * 0.02} fill="#DC143C" opacity="0.7" />
                <rect x={actualSize * 0.11} y={-actualSize * 0.28} width={actualSize * 0.02} height={actualSize * 0.08} fill="#DC143C" opacity="0.7" />
              </g>
            )}
          </g>
        );
        
      case 'early_modern':
        // Age of sail - larger ships
        return (
          <g>
            {/* Hull */}
            <path
              d={`M ${-actualSize * 0.4} 0 
                  L ${actualSize * 0.4} 0 
                  L ${actualSize * 0.3} ${actualSize * 0.3} 
                  L ${-actualSize * 0.3} ${actualSize * 0.3} Z`}
              fill={colors.hull}
              stroke="#4A3C28"
              strokeWidth="0.8"
            />
            {/* Deck details */}
            <rect x={-actualSize * 0.35} y={-actualSize * 0.05} width={actualSize * 0.7} height={actualSize * 0.08} fill="#A0826D" />
            {/* Multiple masts */}
            <rect x={-actualSize * 0.2} y={-actualSize * 0.45} width={actualSize * 0.03} height={actualSize * 0.4} fill="#654321" />
            <rect x={0} y={-actualSize * 0.5} width={actualSize * 0.03} height={actualSize * 0.45} fill="#654321" />
            <rect x={actualSize * 0.2} y={-actualSize * 0.4} width={actualSize * 0.03} height={actualSize * 0.35} fill="#654321" />
            {/* Multiple sails */}
            <path d={`M ${-actualSize * 0.18} ${-actualSize * 0.4} Q ${-actualSize * 0.05} ${-actualSize * 0.25} ${-actualSize * 0.18} ${-actualSize * 0.1}`} fill={colors.sail} opacity="0.9" />
            <path d={`M ${actualSize * 0.03} ${-actualSize * 0.45} Q ${actualSize * 0.2} ${-actualSize * 0.3} ${actualSize * 0.03} ${-actualSize * 0.1}`} fill={colors.sail} opacity="0.9" />
            <path d={`M ${actualSize * 0.22} ${-actualSize * 0.35} Q ${actualSize * 0.32} ${-actualSize * 0.25} ${actualSize * 0.22} ${-actualSize * 0.1}`} fill={colors.sail} opacity="0.9" />
            {/* Gun ports for warships */}
            {boatType === 'cargo' && [0.1, 0.2, 0.3].map(pos => (
              <rect key={pos} x={pos * actualSize} y={actualSize * 0.1} width={actualSize * 0.03} height={actualSize * 0.03} fill="#1C1C1C" />
            ))}
          </g>
        );
        
      case 'industrial':
        // Steam ships
        return (
          <g>
            {/* Hull - iron/steel colored */}
            <path
              d={`M ${-actualSize * 0.4} 0 
                  L ${actualSize * 0.4} 0 
                  L ${actualSize * 0.35} ${actualSize * 0.25} 
                  L ${-actualSize * 0.35} ${actualSize * 0.25} Z`}
              fill="#708090"
              stroke="#2F4F4F"
              strokeWidth="0.8"
            />
            {/* Superstructure */}
            <rect x={-actualSize * 0.2} y={-actualSize * 0.15} width={actualSize * 0.4} height={actualSize * 0.2} fill="#696969" />
            <rect x={-actualSize * 0.15} y={-actualSize * 0.25} width={actualSize * 0.3} height={actualSize * 0.1} fill="#808080" />
            {/* Smokestack */}
            <rect x={actualSize * 0.05} y={-actualSize * 0.35} width={actualSize * 0.08} height={actualSize * 0.25} fill="#2F4F4F" />
            <rect x={actualSize * 0.04} y={-actualSize * 0.37} width={actualSize * 0.1} height={actualSize * 0.04} fill="#1C1C1C" />
            {/* Smoke puffs */}
            <circle cx={actualSize * 0.09} cy={-actualSize * 0.42} r={actualSize * 0.04} fill="#A9A9A9" opacity="0.6" />
            <circle cx={actualSize * 0.11} cy={-actualSize * 0.46} r={actualSize * 0.05} fill="#A9A9A9" opacity="0.4" />
            {/* Windows */}
            <rect x={-actualSize * 0.1} y={-actualSize * 0.2} width={actualSize * 0.04} height={actualSize * 0.04} fill="#87CEEB" opacity="0.8" />
            <rect x={0} y={-actualSize * 0.2} width={actualSize * 0.04} height={actualSize * 0.04} fill="#87CEEB" opacity="0.8" />
            <rect x={actualSize * 0.1} y={-actualSize * 0.2} width={actualSize * 0.04} height={actualSize * 0.04} fill="#87CEEB" opacity="0.8" />
          </g>
        );
        
      case 'modern':
        // Modern tugboat/cargo vessel
        return (
          <g>
            {/* Hull - modern colors */}
            <path
              d={`M ${-actualSize * 0.35} 0 
                  L ${actualSize * 0.35} 0 
                  L ${actualSize * 0.3} ${actualSize * 0.2} 
                  L ${-actualSize * 0.3} ${actualSize * 0.2} Z`}
              fill={boatType === 'ferry' ? '#FF6347' : '#4682B4'}
              stroke="#2F4F4F"
              strokeWidth="0.8"
            />
            {/* White waterline */}
            <rect x={-actualSize * 0.35} y={actualSize * 0.08} width={actualSize * 0.7} height={actualSize * 0.02} fill="#FFFFFF" />
            {/* Bridge/wheelhouse */}
            <rect x={-actualSize * 0.15} y={-actualSize * 0.2} width={actualSize * 0.3} height={actualSize * 0.25} fill="#F5F5F5" />
            <rect x={-actualSize * 0.12} y={-actualSize * 0.25} width={actualSize * 0.24} height={actualSize * 0.05} fill="#4169E1" />
            {/* Windows */}
            <rect x={-actualSize * 0.12} y={-actualSize * 0.18} width={actualSize * 0.24} height={actualSize * 0.08} fill="#87CEEB" />
            {/* Antenna/radar */}
            <rect x={actualSize * 0.05} y={-actualSize * 0.32} width={actualSize * 0.02} height={actualSize * 0.08} fill="#696969" />
            <circle cx={actualSize * 0.06} cy={-actualSize * 0.34} r={actualSize * 0.03} fill="#FF0000" opacity="0.8" />
            {/* Cargo containers for cargo ships */}
            {boatType === 'cargo' && (
              <>
                <rect x={-actualSize * 0.25} y={actualSize * 0.02} width={actualSize * 0.15} height={actualSize * 0.1} fill="#FF6347" />
                <rect x={-actualSize * 0.08} y={actualSize * 0.02} width={actualSize * 0.15} height={actualSize * 0.1} fill="#4169E1" />
                <rect x={actualSize * 0.1} y={actualSize * 0.02} width={actualSize * 0.15} height={actualSize * 0.1} fill="#32CD32" />
              </>
            )}
          </g>
        );
        
      default:
        return null;
    }
  };
  
  // Wake effect based on movement direction (uses rotation for wake only)
  const renderWake = () => {
    return (
      <g transform={`rotate(${wakeRotation})`} opacity="0.4">
        <path
          d={`M ${-actualSize * 0.5} 0 
              Q ${-actualSize * 0.3} ${actualSize * 0.1} 
              ${-actualSize * 0.6} ${actualSize * 0.2}`}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={actualSize * 0.03}
        />
        <path
          d={`M ${-actualSize * 0.5} 0 
              Q ${-actualSize * 0.3} ${-actualSize * 0.1} 
              ${-actualSize * 0.6} ${-actualSize * 0.2}`}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={actualSize * 0.02}
        />
      </g>
    );
  };

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Wake behind boat */}
      {renderWake()}
      
      {/* Boat itself - always same orientation */}
      {renderBoat()}
      
      {/* Flag or identifier */}
      <rect
        x={actualSize * 0.15}
        y={-actualSize * 0.5}
        width={actualSize * 0.12}
        height={actualSize * 0.08}
        fill={colors.flag}
        opacity="0.8"
      />
    </g>
  );
};

export default NPCBoatSymbol;