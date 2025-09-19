/**
 * components/CityModal.tsx - Modal for displaying city/settlement information
 * Shows residents, businesses, and urban activity based on time of day
 */

import React, { useMemo, useEffect, useState } from 'react';
import { Tile, PlayerCharacter, MapData, Season, TimeOfDay, HistoricalEra, CulturalZone, NpcEntity } from '../types';
import CityBanner, { Condition, CitySize } from './CityBanner';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { urbanTileRegistry } from '../services/urbanTileRegistryService';
import { BiomeType } from '../types/biomes/base';

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
    const [activeTab, setActiveTab] = useState<'overview' | 'residents' | 'businesses'>('overview');
    const [tileData, setTileData] = useState<any>(null);

    // Get all NPCs from mapData
    const allNpcs = mapData.npcs || [];

    // Map gameTimeHours to TimeOfDay
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

    useEffect(() => {
        // Get data from registry
        const data = urbanTileRegistry.getTileData(tile.x, tile.y);
        setTileData(data);
    }, [tile.x, tile.y]);

    // Get residents of this tile
    const residents = useMemo(() => {
        if (!tileData?.residences) return [];
        const residentIds = tileData.residences.flatMap(r => r.occupants);
        return allNpcs.filter(npc => residentIds.includes(npc.id));
    }, [tileData, allNpcs]);

    // Get businesses in this tile
    const businesses = useMemo(() => {
        return tileData?.businesses || [];
    }, [tileData]);

    // Get activity status for an NPC
    const getActivityStatus = (npc: NpcEntity): string => {
        const isNight = gameTimeHours < 6 || gameTimeHours >= 22;

        if (isNight) {
            if (npc.homeLocation &&
                Math.abs(npc.x - npc.homeLocation.x) <= 1 &&
                Math.abs(npc.y - npc.homeLocation.y) <= 1) {
                return '😴 Sleeping';
            }
            return '🌙 Out Late';
        }

        if (npc.activity === 'working') {
            return '⚒️ Working';
        } else if (npc.activity === 'commuting_to_work') {
            return '🚶 Commuting';
        } else if (npc.activity === 'commuting_home') {
            return '🏠 Heading Home';
        } else if (npc.activity === 'idle' && npc.homeLocation &&
            Math.abs(npc.x - npc.homeLocation.x) <= 1 &&
            Math.abs(npc.y - npc.homeLocation.y) <= 1) {
            return '🏠 At Home';
        }

        return '🚶 About Town';
    };

    // Check if a business is open
    const isBusinessOpen = (business: any): boolean => {
        if (!business.openHours) return false;
        return gameTimeHours >= business.openHours[0] &&
               gameTimeHours <= business.openHours[1];
    };

    // Get city name
    const getCityName = (): string => {
        if (tile.cityName) return tile.cityName;
        switch(tile.biome) {
            case BiomeType.HAMLET: return 'Hamlet';
            case BiomeType.LOW_DENSITY_CITY: return 'Town';
            case BiomeType.DENSE_CITY: return 'City District';
            case BiomeType.CITY_CENTER: return 'City Center';
            default: return 'Settlement';
        }
    };

    // Get population estimate
    const getPopulationEstimate = (): number => {
        if (tile.population) return tile.population;
        const baseCount = residents.length || 1;
        switch(tile.biome) {
            case BiomeType.HAMLET: return baseCount * 10;
            case BiomeType.LOW_DENSITY_CITY: return baseCount * 50;
            case BiomeType.DENSE_CITY: return baseCount * 200;
            case BiomeType.CITY_CENTER: return baseCount * 500;
            default: return baseCount * 20;
        }
    };

    const population = getPopulationEstimate();
    const condition: Condition = population > 500 ? 'prosperous' : 'humble';
    const citySize: CitySize = population > 1000 ? 'big_city' : 'smaller_city';

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
                <div className="absolute bottom-4 left-4 z-10">
                    <h2 className="text-2xl font-bold text-white drop-shadow-lg">{getCityName()}</h2>
                    <p className="text-sm text-gray-200 drop-shadow">Population: ~{population.toLocaleString()}</p>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex border-b border-slate-700 bg-slate-800/50">
                <button
                    className={`px-4 py-2 font-semibold transition-colors ${
                        activeTab === 'overview'
                            ? 'text-amber-300 border-b-2 border-amber-300'
                            : 'text-gray-400 hover:text-white'
                    }`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={`px-4 py-2 font-semibold transition-colors ${
                        activeTab === 'residents'
                            ? 'text-amber-300 border-b-2 border-amber-300'
                            : 'text-gray-400 hover:text-white'
                    }`}
                    onClick={() => setActiveTab('residents')}
                >
                    Residents ({residents.length})
                </button>
                <button
                    className={`px-4 py-2 font-semibold transition-colors ${
                        activeTab === 'businesses'
                            ? 'text-amber-300 border-b-2 border-amber-300'
                            : 'text-gray-400 hover:text-white'
                    }`}
                    onClick={() => setActiveTab('businesses')}
                >
                    Businesses ({businesses.length})
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-grow p-4 overflow-y-auto">
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-bold text-amber-300 mb-2">Settlement Information</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="text-gray-400">Type:</div>
                                <div className="text-white">{tile.biome.replace(/_/g, ' ').toLowerCase()}</div>
                                <div className="text-gray-400">Current Time:</div>
                                <div className="text-white">{Math.floor(gameTimeHours)}:00 ({timeOfDay})</div>
                                <div className="text-gray-400">Season:</div>
                                <div className="text-white">{season}</div>
                                <div className="text-gray-400">Active Businesses:</div>
                                <div className="text-white">
                                    {businesses.filter(b => isBusinessOpen(b)).length} / {businesses.length} open
                                </div>
                            </div>
                        </div>

                        {tileData?.residences && tileData.residences.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-amber-300 mb-2">Housing</h3>
                                <div className="space-y-1">
                                    {tileData.residences.map((residence, idx) => (
                                        <div key={idx} className="text-sm text-gray-300">
                                            • {residence.type.replace(/_/g, ' ')} -
                                            {' '}{residence.occupants.length} resident(s)
                                            {' '}
                                            <span className="text-gray-500">({residence.wealthLevel})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'residents' && (
                    <div className="space-y-3">
                        {residents.length === 0 ? (
                            <p className="text-gray-400 italic">No known residents in this area</p>
                        ) : (
                            residents.map(npc => (
                                <div key={npc.id} className="bg-slate-800/50 p-3 rounded-lg">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{npc.emoji}</span>
                                            <span className="font-semibold text-white">{npc.name}</span>
                                        </div>
                                        <span className="text-sm text-gray-400">{getActivityStatus(npc)}</span>
                                    </div>
                                    <div className="text-sm text-gray-300">
                                        {npc.profession || npc.role}
                                    </div>
                                    {npc.workplaceName && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            Works at: {npc.workplaceName}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'businesses' && (
                    <div className="space-y-3">
                        {businesses.length === 0 ? (
                            <p className="text-gray-400 italic">No established businesses in this area</p>
                        ) : (
                            businesses.map(business => {
                                const owner = allNpcs.find(n => n.id === business.ownerId);
                                const isOpen = isBusinessOpen(business);

                                return (
                                    <div key={business.id} className="bg-slate-800/50 p-3 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-white">{business.name}</h4>
                                            <span className={`text-sm font-medium ${
                                                isOpen ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                                {isOpen ? '✅ Open' : '❌ Closed'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="text-gray-400">Type:</div>
                                            <div className="text-gray-300">{business.type.replace(/_/g, ' ')}</div>
                                            <div className="text-gray-400">Owner:</div>
                                            <div className="text-gray-300">
                                                {owner ? `${owner.emoji} ${owner.name}` : 'Unknown'}
                                            </div>
                                            <div className="text-gray-400">Hours:</div>
                                            <div className="text-gray-300">
                                                {business.openHours ?
                                                    `${business.openHours[0]}:00 - ${business.openHours[1]}:00` :
                                                    'Unknown'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            <footer className="flex justify-end p-4 border-t border-slate-700 bg-slate-800/50 rounded-b-3xl shrink-0">
                <button
                    onClick={onClose}
                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-500 transition-colors"
                >
                    Leave
                </button>
            </footer>
        </div>
    );
};

export default CityModal;