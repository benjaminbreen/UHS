import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../../types';

interface KitchenStoveSymbolProps {
  culturalZone?: CulturalZone;
  era?: HistoricalEra;
}

export const KitchenStoveSymbol: React.FC<KitchenStoveSymbolProps> = ({ 
  culturalZone = 'EUROPEAN',
  era = HistoricalEra.MEDIEVAL 
}) => {
  const isModern = era === HistoricalEra.MODERN || era === HistoricalEra.CONTEMPORARY;
  
  if (isModern) {
    // Modern stove
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        {/* Stove body */}
        <rect x="2" y="6" width="12" height="9" fill="#d3d3d3" stroke="#696969" strokeWidth="0.5" />
        {/* Top surface */}
        <rect x="2" y="4" width="12" height="2" fill="#2f2f2f" stroke="#696969" strokeWidth="0.5" />
        {/* Burner 1 */}
        <circle cx="5" cy="5" r="1.2" fill="#1a1a1a" stroke="#696969" strokeWidth="0.3" />
        <circle cx="5" cy="5" r="0.6" fill="#ff4500" opacity="0.8" />
        {/* Burner 2 */}
        <circle cx="8.5" cy="5" r="1.2" fill="#1a1a1a" stroke="#696969" strokeWidth="0.3" />
        {/* Burner 3 */}
        <circle cx="11.5" cy="5" r="1.2" fill="#1a1a1a" stroke="#696969" strokeWidth="0.3" />
        {/* Oven door */}
        <rect x="3" y="8" width="10" height="6" fill="#e6e6e6" stroke="#696969" strokeWidth="0.5" />
        <circle cx="12" cy="11" r="0.4" fill="#696969" />
      </svg>
    );
  }
  
  // Historical hearth/cooking fire
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      {/* Stone hearth base */}
      <rect x="1" y="10" width="14" height="5" fill="#8b7355" stroke="#654321" strokeWidth="0.5" />
      {/* Fire pit */}
      <ellipse cx="8" cy="12" rx="5" ry="2" fill="#2f2f2f" stroke="#654321" strokeWidth="0.5" />
      {/* Flames */}
      <path d="M 5 12 Q 4 8, 6 6 Q 7 8, 5 12" fill="#ff4500" opacity="0.8" />
      <path d="M 8 12 Q 7 7, 9 5 Q 10 8, 8 12" fill="#ff6500" opacity="0.8" />
      <path d="M 11 12 Q 10 8, 12 6 Q 13 8, 11 12" fill="#ff4500" opacity="0.8" />
      {/* Smoke */}
      <path d="M 8 5 Q 6 3, 8 2 Q 10 1, 8 0" stroke="#696969" strokeWidth="0.8" fill="none" opacity="0.6" />
      {/* Cooking pot */}
      <ellipse cx="8" cy="9" rx="2.5" ry="1" fill="#2f2f2f" stroke="#1a1a1a" strokeWidth="0.5" />
      <rect x="5.5" y="8" width="5" height="2" fill="#2f2f2f" stroke="#1a1a1a" strokeWidth="0.5" />
      {/* Handle */}
      <path d="M 5.5 9 Q 4 9, 4 8.5" stroke="#1a1a1a" strokeWidth="0.5" fill="none" />
    </svg>
  );
};