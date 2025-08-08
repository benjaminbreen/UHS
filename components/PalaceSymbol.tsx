/**
 * components/symbols/PalaceSymbol.tsx - Era and culture-specific palace rendering dispatcher.
 */
import React from 'react';
import { Tile, HistoricalEra } from '../types';
import { parseDateString } from '../utils/dateUtils';
import { 
    FeudalKeepSymbol, 
    RomanVillaSymbol, 
    GenericPalaceSymbol,
    VikingHallSymbol,
    JapaneseCastleSymbol
} from './symbols/poi';

interface PalaceSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  date?: string;
  zone?: string;
}

const PalaceSymbol: React.FC<PalaceSymbolProps> = ({ x, y, size, seed, tile, date = "1000 CE", zone = "Europe" }) => {
  const { era } = parseDateString(date);
  
  const commonProps = {
    x, y, size, seed, tile,
  };

  const renderBuilding = () => {
    const type = tile.palaceType || '';
    
    // Specific name matching first
    if (type.toLowerCase().includes('keep')) return <FeudalKeepSymbol {...commonProps} />;
    if (type.toLowerCase().includes('villa') || type.toLowerCase().includes('domus')) return <RomanVillaSymbol {...commonProps} />;
    if (type.toLowerCase().includes('viking') || type.toLowerCase().includes('longhouse')) return <VikingHallSymbol {...commonProps} />;
    if (type.toLowerCase().includes('japanese castle')) return <JapaneseCastleSymbol {...commonProps} />;
    
    // Fallback based on era
    if (era === HistoricalEra.MEDIEVAL && zone.toLowerCase().includes('scandinavia')) {
        return <VikingHallSymbol {...commonProps} />;
    }
    if (era === HistoricalEra.MEDIEVAL) {
        return <FeudalKeepSymbol {...commonProps} />;
    }
    if (era === HistoricalEra.ANTIQUITY) {
         return <RomanVillaSymbol {...commonProps} />;
    }

    // Generic fallback
    return <GenericPalaceSymbol {...commonProps} />;
  };

  return <g>{renderBuilding()}</g>;
};

export default React.memo(PalaceSymbol);