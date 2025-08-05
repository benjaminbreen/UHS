/**
 * components/MarketplaceModal.tsx - A sophisticated modal for marketplace interactions.
 */
import React, { useState, useMemo, useEffect } from 'react';
import { Tile, PlayerCharacter, Item, MapData, MapAnalysisData, Season, HistoricalEra, ClimateType, CulturalZone, TimeOfDay, NpcEntity } from '../types';
import { ITEM_DEFINITIONS } from '../constants/index';
import { calculatePrices, getMarketInventory } from '../services/economyService';
import MarketplaceBanner, { Condition } from './MarketplaceBanner';
import { generateMarketplaceDescription, CitySize } from '../services/marketplaceDescriptionGenerator';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';

interface MarketplaceModalProps {
    tile: Tile;
    playerCharacter: PlayerCharacter;
    mapData: MapData;
    npcs: NpcEntity[]; // Added to factor into economy
    mapAnalysisData: MapAnalysisData;
    gameTimeHours: number;
    season: Season;
    onClose: () => void;
    onBuy: (itemBaseId: string, price: number) => void;
    onSell: (item: Item, price: number) => void;
}

type SortKey = 'name' | 'buyPrice' | 'sellPrice';
type SortDirection = 'asc' | 'desc';

const MarketplaceModal: React.FC<MarketplaceModalProps> = ({ 
    tile, playerCharacter, mapData, npcs, mapAnalysisData, gameTimeHours, season,
    onClose, onBuy, onSell 
}) => {
    const [description, setDescription] = useState('');
    const [marketCondition, setMarketCondition] = useState<Condition>('humble');
    const [buySortConfig, setBuySortConfig] = useState<{ key: SortKey, direction: SortDirection }>({ key: 'name', direction: 'asc' });
    const [sellSortConfig, setSellSortConfig] = useState<{ key: SortKey, direction: SortDirection }>({ key: 'name', direction: 'asc' });
    const [selectedSellItem, setSelectedSellItem] = useState<Item & { sellPrice: number } | null>(null);

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
        const parsedEra = dateInfo.era;
        const parsedCulture = mapLocationToCulture(mapData.continent || 'Europe', dateInfo.year);
        return { era: parsedEra as HistoricalEra, culturalZone: parsedCulture };
    }, [mapData.timeSlice, mapData.continent]);

    const marketplaceName = useMemo(() => {
        const market = mapData.marketplaces?.find(m => m.x === tile.x && m.y === tile.y);
        return market?.name || "The Marketplace";
    }, [mapData.marketplaces, tile.x, tile.y]);

    useEffect(() => {
        const condition: Condition = (mapAnalysisData?.urbanTileCount ?? 0) > 10 ? 'prosperous' : 'humble';
        setMarketCondition(condition);
        
        const size: CitySize = (mapAnalysisData?.urbanTileCount ?? 0) > 35 ? 'big_city' : 'smaller_city';
        
        const desc = generateMarketplaceDescription({
            era: era as HistoricalEra,
            culturalZone: culturalZone as CulturalZone,
            condition,
            climate: mapData.climate,
            mapData,
            size,
            gameTimeHours
        });
        setDescription(desc);
    }, [mapData, mapAnalysisData, era, culturalZone, gameTimeHours]);

    const marketInventory = useMemo(() => {
        return getMarketInventory(mapData, era, culturalZone, npcs);
    }, [mapData, era, culturalZone, npcs]);

    const playerSellableInventory = useMemo(() => {
        const sellable = playerCharacter.inventory.map(item => {
             const sellPrice = calculatePrices(item.baseId, mapData, npcs).sellPrice;
             return { ...item, sellPrice };
        });
        
        return sellable.sort((a, b) => {
            if (a[sellSortConfig.key] < b[sellSortConfig.key]) return sellSortConfig.direction === 'asc' ? -1 : 1;
            if (a[sellSortConfig.key] > b[sellSortConfig.key]) return sellSortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [playerCharacter.inventory, mapData, npcs, sellSortConfig]);

    useEffect(() => {
        if (playerSellableInventory.length > 0 && !selectedSellItem) {
            setSelectedSellItem(playerSellableInventory[0]);
        } else if (playerSellableInventory.length === 0) {
            setSelectedSellItem(null);
        }
    }, [playerSellableInventory, selectedSellItem]);

    const sortedMarketInventory = useMemo(() => {
        return [...marketInventory].sort((a, b) => {
            if (a[buySortConfig.key] < b[buySortConfig.key]) return buySortConfig.direction === 'asc' ? -1 : 1;
            if (a[buySortConfig.key] > b[buySortConfig.key]) return buySortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [marketInventory, buySortConfig]);

    const handleBuySort = (key: SortKey) => setBuySortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    const handleSellSort = (key: SortKey) => setSellSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));

    return (
        <div className="w-full h-full flex flex-col bg-slate-900 border-2 border-slate-600 rounded-3xl shadow-2xl animate-popIn" onClick={e => e.stopPropagation()}>
            <header className="relative w-full h-[180px] rounded-t-3xl overflow-hidden shrink-0">
                <MarketplaceBanner 
                    era={era} 
                    culturalZone={culturalZone} 
                    condition={marketCondition} 
                    climate={mapData.climate} 
                    season={season} 
                    timeOfDay={timeOfDay} 
                    seed={mapData.seed} 
                    width={1100} 
                    height={180}
                    mapData={mapData}
                />
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-red-600/80 text-white text-lg font-bold rounded-full hover:bg-red-500 transition-colors shadow-lg z-10"
                >
                    ×
                </button>
            </header>
            <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                <h2 className="text-xl font-bold text-amber-300">{marketplaceName}</h2>
                <p className="text-sm italic text-slate-400 mt-1">{description}</p>
            </div>
            <div className="flex-grow grid grid-cols-2 gap-4 p-4 overflow-hidden">
                {/* Goods for Sale */}
                <div className="flex flex-col bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                    <h4 className="font-semibold text-lg text-green-400 mb-2 shrink-0">Goods for Sale</h4>
                    <div className="overflow-y-auto scrollbar-thin pr-2">
                        {sortedMarketInventory.map(item => (
                            <div key={item.baseId} className="flex items-center p-2 rounded-md hover:bg-slate-700/50">
                                <span className="text-2xl mr-3 w-8 text-center">{item.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate text-slate-200">{item.name}</p>
                                    <p className="text-xs text-slate-400 italic truncate">{item.description}</p>
                                </div>
                                <span className="font-semibold text-yellow-400 mx-3">{item.buyPrice} 🪙</span>
                                <button onClick={() => onBuy(item.baseId, item.buyPrice)} disabled={playerCharacter.currency < item.buyPrice} className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed">Buy</button>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Your Wares */}
                <div className="flex flex-col bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                    <h4 className="font-semibold text-lg text-orange-400 mb-2 shrink-0">Your Wares</h4>
                    <div className="flex-grow grid grid-cols-2 gap-3 overflow-hidden">
                        <div className="overflow-y-auto scrollbar-thin pr-2">
                            {playerSellableInventory.map(item => (
                                <div key={item.id} onClick={() => setSelectedSellItem(item)} className={`flex items-center p-2 rounded-md cursor-pointer ${selectedSellItem?.id === item.id ? 'bg-blue-600/30 ring-1 ring-blue-500' : 'hover:bg-slate-700/50'}`}>
                                    <span className="text-2xl mr-3 w-8 text-center">{item.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate text-slate-200">{item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-slate-900/50 rounded-md p-3 flex flex-col items-center justify-center text-center">
                            {selectedSellItem ? (
                                <>
                                    <div className="text-5xl mb-3">{selectedSellItem.emoji}</div>
                                    <h5 className="font-bold text-white">{selectedSellItem.name}</h5>
                                    <p className="text-xs text-slate-400 mb-3 italic">{selectedSellItem.description}</p>
                                    <p className="text-sm text-slate-300 mb-1">Category: <span className="font-semibold text-white">{selectedSellItem.category}</span></p>
                                    <p className="text-sm text-slate-300 mb-4">Sell Price: <span className="font-bold text-xl text-yellow-400">{selectedSellItem.sellPrice} 🪙</span></p>
                                    <button onClick={() => onSell(selectedSellItem, selectedSellItem.sellPrice)} className="w-full text-sm bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-500">Sell One</button>
                                </>
                            ) : <p className="text-slate-500 italic">Select an item to sell.</p>}
                        </div>
                    </div>
                </div>
            </div>
            <footer className="flex justify-between items-center p-4 border-t border-slate-700 bg-slate-800/50 rounded-b-3xl shrink-0">
                <div className="text-lg font-bold text-yellow-300">Your Wallet: {playerCharacter.currency} 🪙</div>
                <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-500">Leave</button>
            </footer>
        </div>
    );
};

export default MarketplaceModal;
