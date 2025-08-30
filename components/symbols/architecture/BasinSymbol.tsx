import React from 'react';
import { CulturalZone } from '../../../types';

interface BasinSymbolProps {
  culturalZone?: CulturalZone;
}

export const BasinSymbol: React.FC<BasinSymbolProps> = ({ culturalZone = 'EUROPEAN' }) => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      {/* Base/Pedestal */}
      <rect x="6" y="10" width="4" height="5" rx="0.5" fill="#f5f5dc" stroke="#8b7355" strokeWidth="0.5" />
      {/* Basin bowl */}
      <ellipse cx="8" cy="9" rx="4" ry="2.5" fill="#ffffff" stroke="#8b7355" strokeWidth="0.5" />
      {/* Water */}
      <ellipse cx="8" cy="9" rx="3.5" ry="2" fill="#87ceeb" opacity="0.6" />
      {/* Faucet */}
      <path d="M 4 6 Q 2 6, 2 8 Q 2 9, 4 9" stroke="#8b7355" strokeWidth="1" fill="none" />
      <circle cx="4" cy="9" r="0.5" fill="#8b7355" />
      {/* Handle */}
      <circle cx="2.5" cy="7" r="0.5" fill="#8b7355" />
    </svg>
  );
};