import React, { useState, useEffect, useMemo } from 'react';
import { Tile, FarmDetails, MapData, PlayerCharacter, Item, Season, HistoricalEra, NpcEntity } from '../types';
import { generateFarmDetails } from '../services/farmGenerator';
import { calculatePrices } from '../services/economyService';
import { ITEM_DEFINITIONS } from '../constants/index';
import FarmBanner from './FarmBanner';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';

interface FarmPanelProps {
    tile: Tile;
    mapData: MapData;
    playerCharacter: PlayerCharacter;
    npcs: NpcEntity[];
    onClose: () => void;
    onBuy: (itemBaseId: string, price: number) => void;
    onSell: (item: Item, price: number) => void;
    useLlm: boolean;
    season: Season;
}

interface PriceInfo {
    buyPrice: number;
    sellPrice: number;
}

const FarmPanel: React.FC<FarmPanelProps> = ({ 
    tile, mapData, playerCharacter, npcs, onClose, onBuy, useLlm, season 
}) => {
    const [details, setDetails] = useState<FarmDetails | null>(null);
    const [prices, setPrices] = useState<PriceInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFarmData = async () => {
            setIsLoading(true);
            try {
                const farmDetailsPromise = generateFarmDetails(
                    tile,
                    { date: mapData.timeSlice || '1750', location: mapData.continent || 'Europe', climate: mapData.climate },
                    useLlm
                );
                const priceInfo = tile.cropType ? calculatePrices(tile.cropType.toUpperCase().replace(/ /g, '_'), mapData, npcs) : null;
                const farmDetails = await farmDetailsPromise;

                setDetails(farmDetails);
                setPrices(priceInfo);
            } catch (error) {
                console.error("Failed to fetch farm data:", error);
                setDetails({
                    farmName: `${tile.cropType || 'Local'} Farm`,
                    farmerName: 'A Weary Farmer',
                    farmerAge: 58,
                    farmDescription: 'A modest farmstead with neatly tended fields. It seems to have seen better days but is still functional.',
                    economicStatus: 'humble'
                });
            }
            setIsLoading(false);
        };

        fetchFarmData();
    }, [tile, mapData, useLlm, npcs]);

    const cropItem = useMemo(() => 
        tile.cropType ? ITEM_DEFINITIONS[tile.cropType.toUpperCase().replace(/ /g, '_')] : null, 
        [tile.cropType]
    );

    const { era, culturalZone, year } = useMemo(() => {
        const dateInfo = parseDateString(mapData.timeSlice || '1650');
        return {
            era: dateInfo.era as HistoricalEra,
            culturalZone: mapLocationToCulture(mapData.continent || 'Europe', dateInfo.year),
            year: dateInfo.year
        };
    }, [mapData.timeSlice, mapData.continent]);

    const farmDetails = useMemo(() => {
        if (!details) return null;
        
        // Generate farm-specific demographics
        const cropYield = tile.cropType ? 'Good' : 'Poor';
        const farmSize = details.economicStatus === 'prosperous' ? 'Large' : 'Small';
        const seasonalWorkers = details.economicStatus === 'prosperous' ? '2-4' : '1-2';
        
        return {
            ...details,
            cropYield,
            farmSize,
            seasonalWorkers,
            soilQuality: tile.altitude > 0.5 ? 'Rocky' : 'Fertile',
            waterAccess: 'Well & Rain'
        };
    }, [details, tile.cropType, tile.altitude]);

    if (isLoading) {
        return (
            <div className="h-[280px] bg-slate-900/95 backdrop-blur-sm border-t-2 border-slate-600 animate-panelSlideUp rounded-t-3xl">
                <div className="flex items-center justify-center h-full text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-300"></div>
                    <span className="ml-3">Approaching the farm...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[280px] bg-slate-900/95 backdrop-blur-sm border-t-2 border-slate-600 animate-panelSlideUp shadow-2xl rounded-t-3xl overflow-hidden">
            {/* Farm Banner Header - Larger to cover more area */}
            <div className="relative w-full h-[140px] overflow-hidden">
                {details && tile.cropType && (
                    <FarmBanner
                        era={era}
                        culturalZone={culturalZone}
                        condition={details.economicStatus as 'humble' | 'prosperous'}
                        cropType={tile.cropType}
                        climate={mapData.climate}
                        season={season}
                        seed={mapData.seed}
                        height={140}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent p-4 flex flex-col justify-end">
                    <h2 className="text-xl font-bold text-amber-200" style={{textShadow: '1px 1px 2px #000'}}>
                        {details?.farmName}
                    </h2>
                    <p className="text-sm text-slate-200" style={{textShadow: '1px 1px 2px #000'}}>
                        Proprietor: {details?.farmerName} (Age {details?.farmerAge})
                    </p>
                </div>
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-red-600/80 text-white text-lg font-bold rounded-full hover:bg-red-500 transition-colors shadow-lg"
                >
                    ×
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-grow p-4 overflow-hidden bg-slate-800/50">
                <div className="grid grid-cols-2 gap-4 h-full">
                    {/* Left: Goods for Sale with Wallet */}
                    <div className="bg-slate-900/40 border border-slate-700 rounded-md p-3 flex flex-col">
                        <h4 className="font-semibold text-green-300 text-sm mb-3 text-center">Fresh Produce</h4>
                        <div className="flex-grow">
                            {cropItem && prices ? (
                                <div className="flex items-center p-2 rounded-md bg-slate-700/50 mb-3">
                                    <span className="text-2xl mr-3 w-8 text-center">{cropItem.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate text-slate-200 text-sm">{cropItem.name}</p>
                                        <p className="text-xs text-slate-400 italic">{cropItem.description}</p>
                                    </div>
                                    <div className="text-right mr-2">
                                        <p className="font-semibold text-yellow-300 text-sm">{prices.buyPrice}🪙</p>
                                    </div>
                                    <button 
                                        onClick={() => onBuy(cropItem.baseId, prices.buyPrice)} 
                                        disabled={playerCharacter.currency < prices.buyPrice} 
                                        className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
                                    >
                                        Buy
                                    </button>
                                </div>
                            ) : (
                                <p className="text-center text-slate-500 italic py-4 text-xs">Nothing for sale today.</p>
                            )}
                        </div>
                        {/* Wallet info at bottom of goods section */}
                        <div className="border-t border-slate-600 pt-2 mt-2">
                            <p className="text-center text-yellow-300 font-semibold text-sm">
                                Your Wallet: {playerCharacter.currency} 🪙
                            </p>
                        </div>
                    </div>

                    {/* Right: Farm Demographics */}
                    <div className="bg-slate-900/40 border border-slate-700 rounded-md p-3 flex flex-col">
                        <h4 className="font-semibold text-cyan-300 text-sm mb-3 text-center flex items-center justify-center gap-2">
                            <span>🏡</span> Farm Details
                        </h4>
                        <div className="flex-grow space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Farm Size:</span>
                                <span className="text-white font-semibold">{farmDetails?.farmSize}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Crop Type:</span>
                                <span className="text-white font-semibold">{tile.cropType || 'Mixed'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Soil Quality:</span>
                                <span className="text-white font-semibold">{farmDetails?.soilQuality}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Water Access:</span>
                                <span className="text-white font-semibold">{farmDetails?.waterAccess}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Crop Yield:</span>
                                <span className="text-white font-semibold">{farmDetails?.cropYield}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Workers:</span>
                                <span className="text-white font-semibold">{farmDetails?.seasonalWorkers}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Status:</span>
                                <span className="text-white font-semibold capitalize">{details?.economicStatus}</span>
                            </div>
                            
                            {/* Farm Description */}
                            <div className="border-t border-slate-600 pt-3 mt-3">
                                <p className="text-slate-300 italic text-xs leading-relaxed">
                                    "{details?.farmDescription}"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FarmPanel;