import React from 'react';
import { CulturalZone } from '../../../../types';

interface GuardPostSymbolProps {
  culturalZone?: CulturalZone;
}

export const GuardPostSymbol: React.FC<GuardPostSymbolProps> = ({ culturalZone = 'EUROPEAN' }) => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      {/* Base platform */}
      <rect x="3" y="12" width="10" height="3" fill="#8b7355" stroke="#654321" strokeWidth="0.5" />
      {/* Guard post structure */}
      <rect x="5" y="6" width="6" height="7" fill="#a0522d" stroke="#654321" strokeWidth="0.5" />
      {/* Roof */}
      <polygon points="4,6 8,3 12,6" fill="#8b4513" stroke="#654321" strokeWidth="0.5" />
      {/* Window/opening */}
      <rect x="6.5" y="8" width="3" height="2.5" fill="#2f2f2f" stroke="#654321" strokeWidth="0.3" />
      {/* Door */}
      <rect x="7" y="10.5" width="2" height="2.5" fill="#654321" />
      {/* Weapon rack inside */}
      <line x1="6.8" y1="9" x2="6.8" y2="10" stroke="#8b7355" strokeWidth="0.5" />
      <line x1="9.2" y1="9" x2="9.2" y2="10" stroke="#8b7355" strokeWidth="0.5" />
      {/* Spears/pikes */}
      <line x1="6.8" y1="8.5" x2="6.8" y2="7.5" stroke="#654321" strokeWidth="0.3" />
      <line x1="9.2" y1="8.5" x2="9.2" y2="7.5" stroke="#654321" strokeWidth="0.3" />
      {/* Flag/banner */}
      <line x1="12" y1="3" x2="12" y2="8" stroke="#654321" strokeWidth="0.5" />
      <rect x="12" y="3" width="3" height="2" fill="#dc143c" />
    </svg>
  );
};