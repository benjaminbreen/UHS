/**
 * components/symbols/HolyPlaceSymbol.tsx - Era and culture-specific holy place rendering dispatcher.
 */
import React from 'react';
import { Tile } from '../../types';
import ZigguratSymbol from './poi/ZigguratSymbol';
import CathedralSymbol from './poi/CathedralSymbol';
import StandingStoneSymbol from './poi/StandingStoneSymbol';
import PyramidSymbol from './poi/PyramidSymbol';
import GenericChurchSymbol from './poi/GenericChurchSymbol';
import GenericMosqueSymbol from './poi/GenericMosqueSymbol';

interface HolyPlaceSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  date?: string;
  zone?: string;
}

const HolyPlaceSymbol: React.FC<HolyPlaceSymbolProps> = ({ x, y, size, seed, tile, date = "1000 CE", zone = "Europe" }) => {
  const commonProps = {
    x, y, size, seed, tile,
  };

  const renderBuilding = () => {
    const type = tile.holyPlaceType || '';
    const lowerZone = zone?.toLowerCase() || 'europe';

    // Specific type matching first
    if (type.includes('Ziggurat')) return <ZigguratSymbol {...commonProps} />;
    if (type.includes('Cathedral')) return <CathedralSymbol {...commonProps} />;
    if (type.includes('Stone Circle') || type.includes('Sacred Grove') || type.includes('Burial Mound')) return <StandingStoneSymbol {...commonProps} />;
    if (type.includes('Pyramid')) return <PyramidSymbol {...commonProps} />;
    
    // Fallback based on cultural zone
    if (lowerZone.includes('europe')) return <GenericChurchSymbol {...commonProps} />;
    if (lowerZone.includes('mena') || lowerZone.includes('middle east')) return <GenericMosqueSymbol {...commonProps} />;
    if (lowerZone.includes('africa')) return <StandingStoneSymbol {...commonProps} />;

    // Default fallback
    return <GenericChurchSymbol {...commonProps} />;
  };

  return <g>{renderBuilding()}</g>;
};

export default React.memo(HolyPlaceSymbol);