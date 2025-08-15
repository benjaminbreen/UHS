/**
 * components/symbols/HolyPlaceSymbol.tsx - Era and culture-specific holy place rendering dispatcher.
 */
import React from 'react';
import { Tile } from '../../types';
import { 
    ZigguratSymbol, 
    CathedralSymbol, 
    StandingStoneSymbol, 
    PyramidSymbol, 
    GenericChurchSymbol, 
    GenericMosqueSymbol,
    BaroqueChurchSymbol,
    OttomanMosqueSymbol,
    PagodaSymbol,
    MesoamericanPyramidSymbol,
    ShrineSymbol
} from './symbols/poi';
import { AfricanSacredGrove3D, TribalFire3D } from './symbols/buildings';

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
    if (type.includes('Cathedral') && type.includes('Baroque')) return <BaroqueChurchSymbol {...commonProps} />;
    if (type.includes('Cathedral')) return <CathedralSymbol {...commonProps} />;
    if (type.includes('Stone Circle')) return <StandingStoneSymbol {...commonProps} />;
    if (type.includes('Sacred Grove')) return <AfricanSacredGrove3D {...commonProps} width={size} height={size} />;
    if (type.includes('Tribal Fire') || type.includes('Council Fire')) return <TribalFire3D {...commonProps} width={size} height={size} />;
    if (type.includes('Pyramid') && type.includes('Mesoamerican')) return <MesoamericanPyramidSymbol {...commonProps} />;
    if (type.includes('Pyramid')) return <PyramidSymbol {...commonProps} />;
    if (type.includes('Mosque') && type.includes('Ottoman')) return <OttomanMosqueSymbol {...commonProps} />;
    if (type.includes('Mosque')) return <GenericMosqueSymbol {...commonProps} />;
    if (type.includes('Pagoda')) return <PagodaSymbol {...commonProps} />;
    if (type.includes('Shrine')) return <ShrineSymbol {...commonProps} />;
    
    // Enhanced fallback based on cultural zone and context
    if (lowerZone.includes('europe')) return <GenericChurchSymbol {...commonProps} />;
    if (lowerZone.includes('mena') || lowerZone.includes('middle east')) return <GenericMosqueSymbol {...commonProps} />;
    if (lowerZone.includes('africa')) {
      // Check tile density/urbanization for appropriate African holy site
      const isUrban = tile.biome?.toString().includes('CITY') || tile.biome?.toString().includes('URBAN');
      const isPastoral = !isUrban && (tile.biome?.toString().includes('GRASSLAND') || tile.biome?.toString().includes('SAVANNA'));
      const isNomadic = tile.biome?.toString().includes('DESERT') || tile.biome?.toString().includes('STEPPE');
      
      if (isNomadic) {
        return <TribalFire3D {...commonProps} width={size} height={size} />;
      } else if (isPastoral) {
        return <AfricanSacredGrove3D {...commonProps} width={size} height={size} />;
      } else {
        return <StandingStoneSymbol {...commonProps} />;
      }
    }
    if (lowerZone.includes('east asia')) return <PagodaSymbol {...commonProps} />;
    if (lowerZone.includes('north america') || lowerZone.includes('australia')) {
      return <TribalFire3D {...commonProps} width={size} height={size} />;
    }

    // Default fallback
    return <GenericChurchSymbol {...commonProps} />;
  };

  return <g>{renderBuilding()}</g>;
};

export default React.memo(HolyPlaceSymbol);