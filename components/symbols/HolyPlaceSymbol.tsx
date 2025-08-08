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
import BuddhistTempleSymbol from './poi/BuddhistTempleSymbol';
import HinduTempleSymbol from './poi/HinduTempleSymbol';
import ShintoShrineSymbol from './poi/ShintoShrineSymbol';
import SynagogueSymbol from './poi/SynagogueSymbol';

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
    const religion = tile.holyPlaceReligion || '';
    const lowerZone = zone?.toLowerCase() || 'europe';
    const lowerReligion = religion.toLowerCase();

    // Specific type matching first
    if (type.includes('Ziggurat')) return <ZigguratSymbol {...commonProps} />;
    if (type.includes('Cathedral')) return <CathedralSymbol {...commonProps} />;
    if (type.includes('Stone Circle') || type.includes('Sacred Grove') || type.includes('Burial Mound')) return <StandingStoneSymbol {...commonProps} />;
    if (type.includes('Pyramid')) return <PyramidSymbol {...commonProps} />;
    
    // Religion-based rendering
    if (lowerReligion.includes('buddhism') || lowerReligion.includes('buddhist')) {
      return <BuddhistTempleSymbol {...commonProps} />;
    }
    if (lowerReligion.includes('hinduism') || lowerReligion.includes('hindu')) {
      return <HinduTempleSymbol {...commonProps} />;
    }
    if (lowerReligion.includes('shinto')) {
      return <ShintoShrineSymbol {...commonProps} />;
    }
    if (lowerReligion.includes('judaism') || lowerReligion.includes('jewish')) {
      return <SynagogueSymbol {...commonProps} />;
    }
    if (lowerReligion.includes('islam') || lowerReligion.includes('sunni') || lowerReligion.includes('shia')) {
      return <GenericMosqueSymbol {...commonProps} />;
    }
    if (lowerReligion.includes('catholic') || lowerReligion.includes('orthodox') || lowerReligion.includes('protestant') || lowerReligion.includes('christian')) {
      // Use cathedral for important churches, generic for others
      return Math.random() > 0.7 ? <CathedralSymbol {...commonProps} /> : <GenericChurchSymbol {...commonProps} />;
    }
    if (lowerReligion.includes('druid') || lowerReligion.includes('pagan') || lowerReligion.includes('norse') || lowerReligion.includes('celtic')) {
      return <StandingStoneSymbol {...commonProps} />;
    }
    if (lowerReligion.includes('egyptian') || lowerReligion.includes('pharaonic')) {
      return <PyramidSymbol {...commonProps} />;
    }
    if (lowerReligion.includes('mesopotamian') || lowerReligion.includes('babylonian') || lowerReligion.includes('sumerian')) {
      return <ZigguratSymbol {...commonProps} />;
    }
    
    // Fallback based on cultural zone
    if (lowerZone.includes('europe')) return <GenericChurchSymbol {...commonProps} />;
    if (lowerZone.includes('mena') || lowerZone.includes('middle east')) return <GenericMosqueSymbol {...commonProps} />;
    if (lowerZone.includes('africa')) return <StandingStoneSymbol {...commonProps} />;
    if (lowerZone.includes('asia')) return <BuddhistTempleSymbol {...commonProps} />;
    if (lowerZone.includes('america')) return <StandingStoneSymbol {...commonProps} />;

    // Default fallback
    return <GenericChurchSymbol {...commonProps} />;
  };

  return <g>{renderBuilding()}</g>;
};

export default React.memo(HolyPlaceSymbol);