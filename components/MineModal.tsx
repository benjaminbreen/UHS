/**
 * components/MineModal.tsx - Modal for interacting with mines
 */
import React, { useState, useMemo } from 'react';
import { Tile, PlayerCharacter, MapData, TerrainStructure, HistoricalEra } from '../types';
import { parseDateString } from '../utils/dateUtils';
import { getMaterialsForEra } from '../constants/gameData/mineQuarryMaterials';
import MiningRoguelikeDisplay from './MiningRoguelikeDisplay';

interface MineModalProps {
    structure: TerrainStructure;
    tile: Tile;
    playerCharacter: PlayerCharacter;
    mapData: MapData;
    currentLocation: string;
    onClose: () => void;
    onWork?: () => void;
    onInventoryAdd?: (item: any) => void;
    onHealthChange?: (newHealth: number) => void;
    onFatigueChange?: (newFatigue: number) => void;
}

const MineModal: React.FC<MineModalProps> = ({
    structure,
    tile,
    playerCharacter,
    mapData,
    currentLocation,
    onClose,
    onWork,
    onInventoryAdd,
    onHealthChange,
    onFatigueChange
}) => {
    const [isWorking, setIsWorking] = useState(false);
    const [showMiningRoguelike, setShowMiningRoguelike] = useState(false);
    
    const { era, year } = useMemo(() => {
        return parseDateString(mapData.timeSlice || '1650');
    }, [mapData.timeSlice]);
    
    const availableMaterials = useMemo(() => {
        return getMaterialsForEra(era as HistoricalEra, 'mine');
    }, [era]);
    
    const getMineDescription = () => {
        switch (era) {
            case HistoricalEra.PREHISTORY:
                return "A shallow pit where early humans extract flint and ochre using stone tools. The work is backbreaking and dangerous.";
            case HistoricalEra.ANTIQUITY:
                return "A well-organized mining operation with slaves and workers extracting precious metals. Oil lamps provide dim light in the dark tunnels.";
            case HistoricalEra.MEDIEVAL:
                return "A timber-supported mine shaft descending into the earth. Water wheels power the pumps that keep the tunnels from flooding.";
            case HistoricalEra.RENAISSANCE_EARLY_MODERN:
                return "An improved mining operation with horse-powered winches and better ventilation. The sound of hammers and chisels echoes from below.";
            case HistoricalEra.INDUSTRIAL_ERA:
                return "A steam-powered industrial mine with headframes and rail carts. Black smoke billows from the engine house as coal powers the operation.";
            case HistoricalEra.MODERN_ERA:
                return "A modern mining complex with electric lights, conveyor belts, and heavy machinery. Dump trucks carry tons of ore from the pit.";
            case HistoricalEra.FUTURE_ERA:
                return "An automated mining facility with drones and laser drilling. Holographic displays show real-time ore analysis.";
            default:
                return "A mining operation extracting valuable materials from the earth.";
        }
    };
    
    const getWorkingConditions = () => {
        switch (era) {
            case HistoricalEra.PREHISTORY:
            case HistoricalEra.ANTIQUITY:
                return { danger: "Extreme", pay: "Subsistence", hours: "Dawn to Dusk" };
            case HistoricalEra.MEDIEVAL:
                return { danger: "Very High", pay: "Poor", hours: "12 hours" };
            case HistoricalEra.RENAISSANCE_EARLY_MODERN:
                return { danger: "High", pay: "Modest", hours: "10 hours" };
            case HistoricalEra.INDUSTRIAL_ERA:
                return { danger: "High", pay: "Low wages", hours: "12-14 hours" };
            case HistoricalEra.MODERN_ERA:
                return { danger: "Moderate", pay: "Union wages", hours: "8 hour shifts" };
            case HistoricalEra.FUTURE_ERA:
                return { danger: "Low", pay: "Automated", hours: "24/7 operation" };
            default:
                return { danger: "High", pay: "Variable", hours: "Long" };
        }
    };
    
    const conditions = getWorkingConditions();
    const deposits = structure.mineralDeposits || {};
    const depositList = Object.entries(deposits);

    // Show mining roguelike if user selected mining
    if (showMiningRoguelike) {
        return (
            <div className="fixed inset-0 z-[60] bg-black">
                <MiningRoguelikeDisplay
                    mineData={{
                        name: structure.name || "Mine",
                        description: getMineDescription(),
                        oreType: depositList.length > 0 ? depositList[0][0] : "Iron Ore",
                        depth: 30,
                        culturalZone: mapData.culturalZone || "EUROPEAN",
                        historicalEra: era || "MEDIEVAL"
                    }}
                    playerCharacter={playerCharacter}
                    onExit={() => setShowMiningRoguelike(false)}
                    onHealthChange={onHealthChange}
                    onInventoryAdd={onInventoryAdd}
                    onFatigueChange={onFatigueChange}
                />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-600">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 via-slate-800 to-brown-900 p-6 rounded-t-2xl border-b border-slate-600">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-1">⛏️ {structure.name || 'Mine'}</h1>
                            <p className="text-sm text-slate-300">
                                {currentLocation} • Year {year}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-semibold text-yellow-400">Active Mine</div>
                            <div className="text-sm text-slate-300">Era: {era.replace(/_/g, ' ')}</div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="p-6 space-y-6">
                    {/* Description */}
                    <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                        <h3 className="text-lg font-bold text-slate-200 mb-3">🏔️ The Mining Operation</h3>
                        <p className="text-slate-300 leading-relaxed">
                            {getMineDescription()}
                        </p>
                    </div>
                    
                    {/* Mineral Deposits */}
                    <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                        <h3 className="text-lg font-bold text-slate-200 mb-3">💎 Mineral Deposits</h3>
                        {depositList.length > 0 ? (
                            <div className="space-y-2">
                                {depositList.map(([mineral, quantity]) => (
                                    <div key={mineral} className="flex justify-between items-center bg-slate-600 rounded p-2">
                                        <span className="text-slate-200 font-medium capitalize">
                                            {mineral.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-yellow-400">
                                            {typeof quantity === 'number' ? `${quantity.toLocaleString()} units` : 'Unknown quantity'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-400">No known deposits</p>
                        )}
                    </div>
                    
                    {/* Working Conditions */}
                    <div className="bg-amber-900 bg-opacity-30 rounded-lg p-4 border border-amber-700">
                        <h3 className="text-lg font-bold text-amber-300 mb-3">⚠️ Working Conditions</h3>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-slate-400">Danger Level:</span>
                                <p className="text-red-400 font-bold">{conditions.danger}</p>
                            </div>
                            <div>
                                <span className="text-slate-400">Payment:</span>
                                <p className="text-yellow-400 font-medium">{conditions.pay}</p>
                            </div>
                            <div>
                                <span className="text-slate-400">Work Hours:</span>
                                <p className="text-blue-400">{conditions.hours}</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Available Materials in Era */}
                    <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                        <h3 className="text-lg font-bold text-slate-200 mb-3">📦 Materials Available in {era.replace(/_/g, ' ')}</h3>
                        <div className="flex flex-wrap gap-2">
                            {availableMaterials.map(material => (
                                <span key={material.id} className="px-3 py-1 bg-slate-600 rounded-full text-sm text-slate-200">
                                    {material.name}
                                </span>
                            ))}
                        </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                        <h3 className="text-lg font-bold text-slate-200 mb-3">🎯 Available Actions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button
                                onClick={() => setShowMiningRoguelike(true)}
                                disabled={isWorking}
                                className="px-4 py-3 bg-gradient-to-r from-amber-600 to-brown-600 hover:from-amber-700 hover:to-brown-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-medium transition-all duration-200"
                            >
                                ⛏️ Enter Mine (Dig for Ore)
                            </button>
                            
                            <button
                                onClick={() => alert("Trading feature coming soon!")}
                                className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200"
                            >
                                💰 Trade with Foreman
                            </button>
                            
                            <button
                                onClick={() => alert("Information gathering coming soon!")}
                                className="px-4 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-lg font-medium transition-all duration-200"
                            >
                                🗣️ Talk to Miners
                            </button>
                            
                            <button
                                onClick={() => alert("Exploration feature coming soon!")}
                                className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-200"
                            >
                                🔦 Explore Deeper Tunnels
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Footer */}
                <div className="bg-slate-900 p-4 rounded-b-2xl border-t border-slate-600">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-slate-400">
                            {era === HistoricalEra.PREHISTORY || era === HistoricalEra.ANTIQUITY
                                ? "Mining is dangerous work with primitive tools"
                                : era === HistoricalEra.MODERN_ERA || era === HistoricalEra.FUTURE_ERA
                                ? "Modern safety regulations are in effect"
                                : "Watch out for cave-ins and toxic gases"}
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                        >
                            Leave the Mine
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MineModal;