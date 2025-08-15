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
import { getFactorySymbol } from './symbols/factories/FactorySymbols';
import { getFortressSymbol } from './symbols/fortresses/FortressSymbolsImproved';
import { getMillSymbol } from './symbols/mills/MillSymbols';
import { getMineSymbol } from './symbols/mines/MineSymbols';
import { getQuarrySymbol } from './symbols/quarries/QuarrySymbols';
import { getHolySiteSymbol } from './symbols/poi/getHolySiteSymbol';

interface POISymbolProps {
    structure: TerrainStructure;
    size: number;
    mapSeed?: number;
}

const POISymbol: React.FC<POISymbolProps> = ({ structure, size, mapSeed = 0 }) => {
    // Use the same seed calculation as MapDisplayOptimized.tsx
    const tileSeed = mapSeed + structure.location[0] * 31 + structure.location[1] * 37;
    
    const commonProps = {
        x: 0,
        y: 0,
        size: size,
        seed: tileSeed,
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
                // Use improved holy site symbols with proper era/culture detection
                // First use the stored religion if available
                let holyReligion = (structure as any).religion || '';
                
                // If no religion stored, try to infer from the name
                if (!holyReligion) {
                    const typeLower = type.toLowerCase();
                    if (typeLower.includes('stupa') || typeLower.includes('dagoba') || typeLower.includes('vihara')) {
                        holyReligion = 'buddhist stupa';
                    } else if (typeLower.includes('temple')) {
                        if (typeLower.includes('hindu') || typeLower.includes('kovil') || typeLower.includes('devalaya')) {
                            holyReligion = 'hindu';
                        } else if (typeLower.includes('buddhist')) {
                            holyReligion = 'buddhist';
                        } else {
                            holyReligion = 'temple';
                        }
                    } else if (typeLower.includes('cathedral') || typeLower.includes('church') || typeLower.includes('abbey')) {
                        holyReligion = 'christian';
                    } else if (typeLower.includes('mosque')) {
                        holyReligion = 'islam';
                    } else if (typeLower.includes('pagoda')) {
                        holyReligion = 'buddhist';
                    } else if (typeLower.includes('shrine')) {
                        holyReligion = 'shinto';
                    } else if (typeLower.includes('ziggurat')) {
                        holyReligion = 'mesopotamian';
                    } else if (typeLower.includes('pyramid')) {
                        holyReligion = typeLower.includes('mesoamerican') ? 'maya' : 'egyptian';
                    } else if (typeLower.includes('stone circle') || typeLower.includes('sacred grove')) {
                        holyReligion = 'pagan';
                    } else {
                        // Pass the actual name as the religion for better detection
                        holyReligion = type.toLowerCase();
                    }
                }
                
                const culturalZone = (structure as any).culturalZone || (structure as any).culture || '';
                const HolySiteComponent = getHolySiteSymbol(holyReligion, culturalZone);
                return <HolySiteComponent {...commonProps} />;

            case 'palace':
                if (type.includes('Keep')) return <FeudalKeepSymbol {...commonProps} />;
                if (type.includes('Villa') || type.includes('Domus')) return <RomanVillaSymbol {...commonProps} />;
                if (type.includes('Viking') || type.includes('Longhouse')) return <VikingHallSymbol {...commonProps} />;
                if (type.includes('Japanese Castle')) return <JapaneseCastleSymbol {...commonProps} />;
                return <GenericPalaceSymbol {...commonProps} />;

            case 'ruin':
                return <RuinsSymbol {...commonProps} />;

            case 'factory':
                // Check if the structure has a factory symbol type
                const factorySymbolType = (structure as any).factorySymbolType;
                if (factorySymbolType) {
                    const FactoryComponent = getFactorySymbol(factorySymbolType);
                    return <FactoryComponent {...commonProps} />;
                }
                // Fallback to generic factory icon
                return <text fontSize={size * 0.8}>🏭</text>;

            case 'fortress':
                // Get appropriate fortress symbol based on name, era, and cultural zone
                const FortressComponent = getFortressSymbol(
                    structure.name || '', 
                    (structure as any).era || '',
                    (structure as any).culturalZone || (structure as any).culture || ''
                );
                return <FortressComponent {...commonProps} fortressType={structure.name} />;

            case 'mill':
                // Get appropriate mill symbol based on name, era, and cultural zone
                const MillComponent = getMillSymbol(
                    structure.name || '', 
                    (structure as any).era || '',
                    (structure as any).culturalZone || (structure as any).culture || ''
                );
                return <MillComponent {...commonProps} millType={structure.name} />;

            case 'mine':
                // Get appropriate mine symbol based on era
                const MineComponent = getMineSymbol((structure as any).era || '');
                return <MineComponent {...commonProps} />;

            case 'quarry':
                // Get appropriate quarry symbol based on era
                const QuarryComponent = getQuarrySymbol((structure as any).era || '');
                return <QuarryComponent {...commonProps} />;

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