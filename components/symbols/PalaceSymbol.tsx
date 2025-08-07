/**
 * components/symbols/PalaceSymbol.tsx - Era and culture-specific palace rendering dispatcher.
 */
import React from 'react';
import { Tile, HistoricalEra } from '../../types';
import { parseDateString } from '../../utils/dateUtils';
import FeudalKeepSymbol from './poi/FeudalKeepSymbol';
import RomanVillaSymbol from './poi/RomanVillaSymbol';
import GenericPalaceSymbol from './poi/GenericPalaceSymbol';

interface PalaceSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  date?: string;
  zone?: string;
  nightIntensity?: number;
}

const PalaceSymbol: React.FC<PalaceSymbolProps> = ({ x, y, size, seed, tile, date = "1000 CE", zone = "Europe", nightIntensity = 0 }) => {
  const { era } = parseDateString(date);
  
  const commonProps = {
    x, y, size, seed, tile,
  };

  const renderBuilding = () => {
    const type = tile.palaceType || '';
    
    // Specific name matching first
    if (type.toLowerCase().includes('keep')) {
        return <FeudalKeepSymbol {...commonProps} />;
    }
    if (type.toLowerCase().includes('villa') || type.toLowerCase().includes('domus')) {
        return <RomanVillaSymbol {...commonProps} />;
    }
    
    // Fallback based on era
    if (era === HistoricalEra.MEDIEVAL) {
        return <FeudalKeepSymbol {...commonProps} />;
    }
    if (era === HistoricalEra.ANTIQUITY) {
         return <RomanVillaSymbol {...commonProps} />;
    }

    // Generic fallback
    return <GenericPalaceSymbol {...commonProps} />;
  };

  // Palace lighting effects
  const renderPalaceLights = () => {
    if (nightIntensity < 0.2) return null;
    
    const lights = [];
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    
    // Grand palace lighting - more elaborate than regular buildings
    const numLights = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numLights; i++) {
      const angle = (i / numLights) * Math.PI * 2;
      const radius = size * 0.3;
      const lightX = centerX + Math.cos(angle) * radius;
      const lightY = centerY + Math.sin(angle) * radius;
      
      lights.push(
        <g key={`palace-light-${i}`}>
          {/* Large torch glow */}
          <circle
            cx={lightX}
            cy={lightY}
            r={size * 0.15}
            fill="rgba(255, 180, 60, 0.4)"
            opacity={nightIntensity}
            filter="blur(6px)"
          />
          {/* Bright center */}
          <circle
            cx={lightX}
            cy={lightY}
            r={size * 0.08}
            fill="rgba(255, 220, 150, 0.9)"
            opacity={nightIntensity}
          />
        </g>
      );
    }
    
    return <g opacity={nightIntensity}>{lights}</g>;
  };

  return (
    <g>
      {renderBuilding()}
      {renderPalaceLights()}
    </g>
  );
};

export default React.memo(PalaceSymbol);