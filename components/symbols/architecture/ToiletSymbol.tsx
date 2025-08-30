import React from 'react';
import { CulturalZone } from '../../../types';

interface ToiletSymbolProps {
  culturalZone?: CulturalZone;
}

export const ToiletSymbol: React.FC<ToiletSymbolProps> = ({ culturalZone = 'EUROPEAN' }) => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      {/* Base */}
      <rect x="4" y="10" width="8" height="5" rx="1" fill="#f5f5dc" stroke="#8b7355" strokeWidth="0.5" />
      {/* Bowl */}
      <ellipse cx="8" cy="10" rx="3" ry="2" fill="#ffffff" stroke="#8b7355" strokeWidth="0.5" />
      {/* Seat */}
      <ellipse cx="8" cy="10" rx="3" ry="2" fill="none" stroke="#8b4513" strokeWidth="0.5" />
      <ellipse cx="8" cy="10" rx="1.5" ry="1" fill="none" stroke="#8b4513" strokeWidth="0.5" />
      {/* Tank/Back */}
      <rect x="5" y="5" width="6" height="6" rx="0.5" fill="#e6e6e6" stroke="#8b7355" strokeWidth="0.5" />
      {/* Handle/Flush */}
      <rect x="10.5" y="7" width="1" height="2" rx="0.2" fill="#8b7355" />
    </svg>
  );
};