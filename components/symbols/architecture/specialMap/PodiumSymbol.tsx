import React from 'react';
import { CulturalZone } from '../../../../types';

interface PodiumSymbolProps {
  culturalZone?: CulturalZone;
}

export const PodiumSymbol: React.FC<PodiumSymbolProps> = ({ culturalZone = 'EUROPEAN' }) => {
  const getDesign = () => {
    switch (culturalZone) {
      case 'MENA':
        // Islamic-style with geometric patterns
        return (
          <>
            {/* Base */}
            <rect x="4" y="10" width="8" height="5" fill="#2c5f7c" stroke="#1a3b52" strokeWidth="0.5" />
            {/* Platform */}
            <rect x="3" y="8" width="10" height="2" fill="#4a8caf" stroke="#2c5f7c" strokeWidth="0.5" />
            {/* Geometric pattern */}
            <polygon points="8,9 9,9.5 8,10 7,9.5" fill="#ffd700" />
            <polygon points="6,9.2 7,9.7 6,10.2 5,9.7" fill="#ffd700" />
            <polygon points="10,9.2 11,9.7 10,10.2 9,9.7" fill="#ffd700" />
            {/* Steps */}
            <rect x="2" y="12" width="12" height="1" fill="#1a3b52" />
            <rect x="1" y="13" width="14" height="1" fill="#1a3b52" />
          </>
        );
        
      case 'EAST_ASIAN':
        // East Asian style with curved elements
        return (
          <>
            {/* Base */}
            <rect x="4" y="10" width="8" height="5" fill="#8b4513" stroke="#654321" strokeWidth="0.5" />
            {/* Platform with curved edge */}
            <path d="M 3 8 Q 8 6, 13 8 L 13 10 L 3 10 Z" fill="#a0522d" stroke="#654321" strokeWidth="0.5" />
            {/* Decorative elements */}
            <circle cx="6" cy="9" r="0.5" fill="#ffd700" />
            <circle cx="10" cy="9" r="0.5" fill="#ffd700" />
            <circle cx="8" cy="8.5" r="0.3" fill="#ff6b6b" />
            {/* Steps */}
            <rect x="2" y="12" width="12" height="1" fill="#654321" />
            <rect x="1" y="13" width="14" height="1" fill="#654321" />
          </>
        );
        
      default:
        // European/Classical style
        return (
          <>
            {/* Base */}
            <rect x="4" y="10" width="8" height="5" fill="#d2b48c" stroke="#8b7355" strokeWidth="0.5" />
            {/* Platform */}
            <rect x="3" y="8" width="10" height="2" fill="#f5f5dc" stroke="#8b7355" strokeWidth="0.5" />
            {/* Classical columns */}
            <rect x="4" y="10" width="1" height="5" fill="#e6e6e6" />
            <rect x="11" y="10" width="1" height="5" fill="#e6e6e6" />
            {/* Column caps */}
            <rect x="3.5" y="9.5" width="2" height="0.5" fill="#d3d3d3" />
            <rect x="10.5" y="9.5" width="2" height="0.5" fill="#d3d3d3" />
            {/* Steps */}
            <rect x="2" y="12" width="12" height="1" fill="#8b7355" />
            <rect x="1" y="13" width="14" height="1" fill="#8b7355" />
          </>
        );
    }
  };

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      {getDesign()}
    </svg>
  );
};