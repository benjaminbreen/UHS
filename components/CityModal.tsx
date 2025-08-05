/**
 * components/CityModal.tsx - A modal for city interactions.
 * NOTE: This is a template showing the correct TimeOfDay mapping pattern
 */
import React, { useMemo } from 'react';
import { Tile, PlayerCharacter, MapData, Season, TimeOfDay, HistoricalEra, CulturalZone } from '../types';
import CityBanner, { Condition, CitySize } from './CityBanner'; // Assuming CityBanner exists and takes similar props
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';

interface CityModalProps {
    tile: Tile;
    playerCharacter: PlayerCharacter;
    mapData: MapData;
    gameTimeHours: number;
    season: Season;
    onClose: () => void;
}

const CityModal: React.FC<CityModalProps> = ({ 
    tile, playerCharacter, mapData, gameTimeHours, season, onClose 
}) => {
    
    // FIXED: Properly map gameTimeHours to TimeOfDay enum instead of 'day'/'night'
    const timeOfDay: TimeOfDay = useMemo(() => {
        if (gameTimeHours >= 5 && gameTimeHours < 8) return 'Dawn';
        if (gameTimeHours >= 8 && gameTimeHours < 12) return 'Morning';
        if (gameTimeHours >= 12 && gameTimeHours < 16) return 'Midday';
        if (gameTimeHours >= 16 && gameTimeHours < 19) return 'Afternoon';
        if (gameTimeHours >= 19 && gameTimeHours < 21) return 'Dusk';
        return 'Night';
    }, [gameTimeHours]);

    const { era, culturalZone } = useMemo(() => {
        const dateInfo = parseDateString(mapData.timeSlice || '1650');
        const culture = mapLocationToCulture(mapData.continent || 'Europe', dateInfo.year);
        return { era: dateInfo.era as HistoricalEra, culturalZone: culture as CulturalZone };
    }, [mapData.timeSlice, mapData.continent]);

    const condition: Condition = tile.population && tile.population > 500 ? 'prosperous' : 'humble';
    const citySize: CitySize = tile.population && tile.population > 1000 ? 'big_city' : 'smaller_city';

    return (
        <div className="w-full h-full flex flex-col bg-slate-900 border-2 border-slate-600 rounded-3xl shadow-2xl animate-popIn">
            <header className="relative w-full h-[180px] rounded-t-3xl overflow-hidden shrink-0">
                <CityBanner 
                    era={era}
                    culturalZone={culturalZone}
                    condition={condition}
                    climate={mapData.climate}
                    seed={mapData.seed}
                    size={citySize}
                    timeOfDay={timeOfDay}
                    season={season}
                    mapData={mapData}
                />
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-red-600/80 text-white text-lg font-bold rounded-full hover:bg-red-500 transition-colors shadow-lg z-10"
                >
                    ×
                </button>
            </header>
            
            {/* Rest of the modal content */}
            <div className="flex-grow p-4">
                <h2 className="text-xl font-bold text-amber-300">City Center</h2>
                {/* City content here */}
            </div>
            
            <footer className="flex justify-end p-4 border-t border-slate-700 bg-slate-800/50 rounded-b-3xl shrink-0">
                <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-500">
                    Leave
                </button>
            </footer>
        </div>
    );
};

export default CityModal;
