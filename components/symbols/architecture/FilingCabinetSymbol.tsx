import React from 'react';
import { CulturalZone, HistoricalEra } from '../../../types';

interface FilingCabinetSymbolProps {
  culturalZone?: CulturalZone;
  era?: HistoricalEra;
}

export const FilingCabinetSymbol: React.FC<FilingCabinetSymbolProps> = ({ 
  culturalZone = 'EUROPEAN',
  era = HistoricalEra.MEDIEVAL 
}) => {
  // For historical periods, show document chest/cabinet
  const isModern = era === HistoricalEra.MODERN || era === HistoricalEra.CONTEMPORARY;
  
  if (isModern) {
    // Modern filing cabinet
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        {/* Cabinet body */}
        <rect x="3" y="3" width="10" height="12" fill="#d3d3d3" stroke="#696969" strokeWidth="0.5" />
        {/* Drawer 1 */}
        <rect x="3.5" y="4" width="9" height="2.5" fill="#e6e6e6" stroke="#696969" strokeWidth="0.3" />
        <rect x="11" y="4.8" width="0.8" height="0.9" fill="#696969" />
        {/* Drawer 2 */}
        <rect x="3.5" y="7" width="9" height="2.5" fill="#e6e6e6" stroke="#696969" strokeWidth="0.3" />
        <rect x="11" y="7.8" width="0.8" height="0.9" fill="#696969" />
        {/* Drawer 3 */}
        <rect x="3.5" y="10" width="9" height="2.5" fill="#e6e6e6" stroke="#696969" strokeWidth="0.3" />
        <rect x="11" y="10.8" width="0.8" height="0.9" fill="#696969" />
        {/* Drawer 4 */}
        <rect x="3.5" y="13" width="9" height="1.5" fill="#e6e6e6" stroke="#696969" strokeWidth="0.3" />
        <rect x="11" y="13.3" width="0.8" height="0.9" fill="#696969" />
      </svg>
    );
  }
  
  // Historical document storage
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      {/* Wooden cabinet */}
      <rect x="3" y="4" width="10" height="11" fill="#8b4513" stroke="#654321" strokeWidth="0.5" />
      {/* Door panels */}
      <rect x="3.5" y="4.5" width="4" height="10" fill="#a0522d" stroke="#654321" strokeWidth="0.3" />
      <rect x="8.5" y="4.5" width="4" height="10" fill="#a0522d" stroke="#654321" strokeWidth="0.3" />
      {/* Door handles */}
      <circle cx="7" cy="9.5" r="0.3" fill="#8b7355" />
      <circle cx="9" cy="9.5" r="0.3" fill="#8b7355" />
      {/* Scroll/document indication */}
      <rect x="4" y="6" width="3" height="0.5" fill="#f5f5dc" opacity="0.8" />
      <rect x="9" y="7" width="3" height="0.5" fill="#f5f5dc" opacity="0.8" />
      <rect x="4" y="8" width="3" height="0.5" fill="#f5f5dc" opacity="0.8" />
      <rect x="9" y="9" width="3" height="0.5" fill="#f5f5dc" opacity="0.8" />
      {/* Base */}
      <rect x="2.5" y="14.5" width="11" height="1" fill="#654321" />
    </svg>
  );
};