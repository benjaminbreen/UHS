/**
 * components/POISymbol.tsx - Renders a large, high-fidelity symbol for a Point of Interest.
 * Used in modal headers to provide a visually engaging icon.
 */
import React from 'react';
import { TerrainStructure, Tile } from '../types';
import { 
    ZigguratSymbol, 
    CathedralSymbol, 
    StandingStoneSymbol, 
    PyramidSymbol, 
    GenericChurchSymbol, 
    GenericMosqueSymbol,
    FeudalKeepSymbol,
    RomanVillaSymbol,
    GenericPalaceSymbol,
    BaroqueChurchSymbol,
    OttomanMosqueSymbol,
    PagodaSymbol,
    MesoamericanPyramidSymbol,
    ShrineSymbol,
    VikingHallSymbol,
    JapaneseCastleSymbol
} from './symbols/poi';
import RuinsSymbol from './symbols/RuinsSymbol';

interface POISymbolProps {
    structure: TerrainStructure;
    size: number;
}

const POISymbol: React.FC<POISymbolProps> = ({ structure, size }) => {
    const commonProps = {
        x: 0,
        y: 0,
        size: size,
        seed: structure.location[0] + structure.location[1],
        // Create a dummy tile as some symbol components might expect it
        tile: { 
            x: structure.location[0], 
            y: structure.location[1],
            holyPlaceType: structure.structureType === 'holy_site' ? structure.name : undefined,
            palaceType: structure.structureType === 'palace' ? structure.name : undefined,
            ruinType: structure.structureType === 'ruin' ? structure.name : undefined,
        } as Tile,
    };

    const renderSymbol = () => {
        const type = structure.name || '';

        switch (structure.structureType) {
            case 'holy_site':
                if (type.includes('Ziggurat')) return <ZigguratSymbol {...commonProps} />;
                if (type.includes('Baroque Cathedral')) return <BaroqueChurchSymbol {...commonProps} />;
                if (type.includes('Cathedral')) return <CathedralSymbol {...commonProps} />;
                if (type.includes('Stone Circle') || type.includes('Sacred Grove')) return <StandingStoneSymbol {...commonProps} />;
                if (type.includes('Mesoamerican Pyramid')) return <MesoamericanPyramidSymbol {...commonProps} />;
                if (type.includes('Pyramid')) return <PyramidSymbol {...commonProps} />;
                if (type.includes('Ottoman Mosque')) return <OttomanMosqueSymbol {...commonProps} />;
                if (type.includes('Mosque')) return <GenericMosqueSymbol {...commonProps} />;
                if (type.includes('Pagoda')) return <PagodaSymbol {...commonProps} />;
                if (type.includes('Shrine')) return <ShrineSymbol {...commonProps} />;
                return <GenericChurchSymbol {...commonProps} />;

            case 'palace':
                if (type.includes('Keep')) return <FeudalKeepSymbol {...commonProps} />;
                if (type.includes('Villa') || type.includes('Domus')) return <RomanVillaSymbol {...commonProps} />;
                if (type.includes('Viking') || type.includes('Longhouse')) return <VikingHallSymbol {...commonProps} />;
                if (type.includes('Japanese Castle')) return <JapaneseCastleSymbol {...commonProps} />;
                return <GenericPalaceSymbol {...commonProps} />;

            case 'ruin':
                return <RuinsSymbol {...commonProps} />;

            default:
                return <text fontSize={size * 0.8}>📍</text>;
        }
    };

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated' }}>
            {renderSymbol()}
        </svg>
    );
};

export default POISymbol;