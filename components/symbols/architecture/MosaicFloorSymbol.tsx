import React from 'react';
import { CulturalZone } from '../../../types';

interface MosaicFloorSymbolProps {
  culturalZone?: CulturalZone;
  variant?: 'center' | 'border' | 'regular';
}

export const MosaicFloorSymbol: React.FC<MosaicFloorSymbolProps> = ({ 
  culturalZone = 'EUROPEAN', 
  variant = 'regular' 
}) => {
  const getPattern = () => {
    switch (culturalZone) {
      case 'EUROPEAN':
        // Roman-style geometric mosaic
        if (variant === 'center') {
          return (
            <>
              <rect x="1" y="1" width="14" height="14" fill="#c4a57b" />
              <rect x="3" y="3" width="10" height="10" fill="#8b6f47" />
              <rect x="5" y="5" width="6" height="6" fill="#d4af37" />
              <circle cx="8" cy="8" r="2" fill="#8b4513" />
            </>
          );
        } else if (variant === 'border') {
          return (
            <>
              <rect x="0" y="0" width="16" height="16" fill="#a0826d" />
              <rect x="1" y="1" width="14" height="14" fill="#c4a57b" />
              <rect x="0" y="0" width="4" height="4" fill="#8b4513" />
              <rect x="12" y="0" width="4" height="4" fill="#8b4513" />
              <rect x="0" y="12" width="4" height="4" fill="#8b4513" />
              <rect x="12" y="12" width="4" height="4" fill="#8b4513" />
            </>
          );
        }
        // Regular Roman pattern
        return (
          <>
            <rect x="0" y="0" width="16" height="16" fill="#c4a57b" />
            <rect x="2" y="2" width="4" height="4" fill="#8b6f47" />
            <rect x="10" y="2" width="4" height="4" fill="#8b6f47" />
            <rect x="2" y="10" width="4" height="4" fill="#8b6f47" />
            <rect x="10" y="10" width="4" height="4" fill="#8b6f47" />
            <rect x="6" y="6" width="4" height="4" fill="#d4af37" />
          </>
        );
        
      case 'MENA':
        // Islamic geometric star pattern
        if (variant === 'center') {
          return (
            <>
              <rect x="0" y="0" width="16" height="16" fill="#2c5f7c" />
              <polygon points="8,2 10,6 14,6 11,9 12,13 8,10 4,13 5,9 2,6 6,6" fill="#ffd700" />
              <circle cx="8" cy="8" r="2" fill="#ffffff" />
            </>
          );
        }
        // Regular Islamic pattern
        return (
          <>
            <rect x="0" y="0" width="16" height="16" fill="#2c5f7c" />
            <polygon points="8,0 11,5 16,5 12,8 14,13 8,9 2,13 4,8 0,5 5,5" fill="#4a8caf" />
            <polygon points="8,3 9.5,6 12,6 9.5,7.5 10.5,10 8,8 5.5,10 6.5,7.5 4,6 6.5,6" fill="#ffd700" />
          </>
        );
        
      case 'EAST_ASIAN':
        // East Asian cloud pattern
        if (variant === 'center') {
          return (
            <>
              <rect x="0" y="0" width="16" height="16" fill="#1a1a2e" />
              <circle cx="5" cy="8" r="3" fill="#ff6b6b" />
              <circle cx="8" cy="8" r="3" fill="#ff6b6b" />
              <circle cx="11" cy="8" r="3" fill="#ff6b6b" />
              <circle cx="6" cy="6" r="2" fill="#ff6b6b" />
              <circle cx="10" cy="6" r="2" fill="#ff6b6b" />
            </>
          );
        }
        // Regular East Asian pattern
        return (
          <>
            <rect x="0" y="0" width="16" height="16" fill="#2d3436" />
            <path d="M 2 8 Q 4 6, 6 8 T 10 8 T 14 8" stroke="#ff6b6b" strokeWidth="1" fill="none" />
            <circle cx="4" cy="4" r="1" fill="#ffd700" />
            <circle cx="12" cy="12" r="1" fill="#ffd700" />
          </>
        );
        
      default:
        // Generic star pattern
        return (
          <>
            <rect x="0" y="0" width="16" height="16" fill="#8b7355" />
            <polygon points="8,3 9,6 12,6 9.5,8 10.5,11 8,9 5.5,11 6.5,8 4,6 7,6" fill="#d4af37" />
          </>
        );
    }
  };

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      {getPattern()}
    </svg>
  );
};