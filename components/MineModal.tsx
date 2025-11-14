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
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)'
            }}
        >
            <div className="rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto surface-card animate-in slide-in-from-bottom-4 zoom-in-95 duration-500"
                style={{
                    borderWidth: '1px',
                    borderColor: 'var(--border-normal)'
                }}
            >
                {/* Header */}
                <div className="p-6 rounded-t-2xl animate-in slide-in-from-top-3 fade-in duration-500 delay-100"
                    style={{
                        background: 'linear-gradient(to right, var(--surface-elevated), var(--surface-card), var(--surface-elevated))',
                        borderBottomWidth: '1px',
                        borderColor: 'var(--border-normal)'
                    }}
                >
                    <div className="flex justify-between items-start">
                        <div className="animate-in slide-in-from-left-2 fade-in duration-500 delay-200">
                            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                                <span className="animate-in zoom-in duration-500 delay-300">⛏️</span> {structure.name || 'Mine'}
                            </h1>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {currentLocation} • Year {year}
                            </p>
                        </div>
                        <div className="text-right animate-in slide-in-from-right-2 fade-in duration-500 delay-200">
                            <div className="text-lg font-semibold" style={{ color: 'var(--color-success)' }}>Active Mine</div>
                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Era: {era.replace(/_/g, ' ')}</div>
                        </div>
                    </div>
                </div>
                
                {/* Main Content */}
                <div className="p-6 space-y-6">
                    {/* Description */}
                    <div className="rounded-lg p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] animate-in slide-in-from-left-3 fade-in duration-500 delay-100"
                        style={{
                            backgroundColor: 'var(--surface-elevated)',
                            borderWidth: '1px',
                            borderColor: 'var(--border-normal)'
                        }}
                    >
                        <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--accent-primary)' }}>
                            🏔️ The Mining Operation
                        </h3>
                        <p className="leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                            {getMineDescription()}
                        </p>
                    </div>
                    
                    {/* Mineral Deposits */}
                    <div className="rounded-lg p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] animate-in slide-in-from-right-3 fade-in duration-500 delay-200"
                        style={{
                            backgroundColor: 'var(--surface-elevated)',
                            borderWidth: '1px',
                            borderColor: 'var(--border-normal)'
                        }}
                    >
                        <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--accent-primary)' }}>
                            💎 Mineral Deposits
                        </h3>
                        {depositList.length > 0 ? (
                            <div className="space-y-2">
                                {depositList.map(([mineral, quantity], index) => (
                                    <div key={mineral} className="flex justify-between items-center rounded p-2 transition-all duration-300 hover:scale-105 hover:shadow-md animate-in slide-in-from-bottom-2 fade-in"
                                        style={{
                                            backgroundColor: 'var(--surface-muted)',
                                            animationDelay: `${300 + index * 50}ms`,
                                            animationDuration: '400ms'
                                        }}
                                    >
                                        <span className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                                            {mineral.replace(/_/g, ' ')}
                                        </span>
                                        <span style={{ color: 'var(--color-warning)' }}>
                                            {typeof quantity === 'number' ? `${quantity.toLocaleString()} units` : 'Unknown quantity'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)' }}>No known deposits</p>
                        )}
                    </div>
                    
                    {/* Working Conditions */}
                    <div className="rounded-lg p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] animate-in slide-in-from-left-3 fade-in duration-500 delay-300"
                        style={{
                            backgroundColor: 'var(--surface-elevated)',
                            borderWidth: '1px',
                            borderColor: 'var(--color-warning)'
                        }}
                    >
                        <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--color-warning)' }}>
                            ⚠️ Working Conditions
                        </h3>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <span style={{ color: 'var(--text-secondary)' }}>Danger Level:</span>
                                <p className="font-bold" style={{ color: 'var(--color-error)' }}>{conditions.danger}</p>
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-secondary)' }}>Payment:</span>
                                <p className="font-medium" style={{ color: 'var(--color-warning)' }}>{conditions.pay}</p>
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-secondary)' }}>Work Hours:</span>
                                <p style={{ color: 'var(--accent-primary)' }}>{conditions.hours}</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Available Materials in Era */}
                    <div className="rounded-lg p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] animate-in slide-in-from-right-3 fade-in duration-500 delay-400"
                        style={{
                            backgroundColor: 'var(--surface-elevated)',
                            borderWidth: '1px',
                            borderColor: 'var(--border-normal)'
                        }}
                    >
                        <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--accent-primary)' }}>
                            📦 Materials Available in {era.replace(/_/g, ' ')}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {availableMaterials.map((material, index) => (
                                <span key={material.id} className="px-3 py-1 rounded-full text-sm transition-all duration-300 hover:scale-110 hover:shadow-md animate-in zoom-in fade-in"
                                    style={{
                                        backgroundColor: 'var(--surface-muted)',
                                        color: 'var(--text-primary)',
                                        animationDelay: `${500 + index * 30}ms`,
                                        animationDuration: '300ms'
                                    }}
                                >
                                    {material.name}
                                </span>
                            ))}
                        </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="rounded-lg p-4 transition-all duration-300 hover:shadow-lg animate-in slide-in-from-bottom-3 fade-in duration-500 delay-500"
                        style={{
                            backgroundColor: 'var(--surface-elevated)',
                            borderWidth: '1px',
                            borderColor: 'var(--border-normal)'
                        }}
                    >
                        <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--accent-primary)' }}>
                            🎯 Available Actions
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button
                                onClick={() => setShowMiningRoguelike(true)}
                                disabled={isWorking}
                                className="px-4 py-3 text-white rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed animate-in zoom-in fade-in"
                                style={{
                                    backgroundColor: isWorking ? 'var(--surface-muted)' : 'var(--color-warning)',
                                    boxShadow: !isWorking ? '0 4px 12px -2px var(--color-warning)' : 'none',
                                    animationDelay: '600ms',
                                    animationDuration: '400ms'
                                }}
                            >
                                ⛏️ Enter Mine (Dig for Ore)
                            </button>

                            <button
                                onClick={() => alert("Trading feature coming soon!")}
                                className="px-4 py-3 text-white rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 animate-in zoom-in fade-in"
                                style={{
                                    backgroundColor: 'var(--accent-primary)',
                                    boxShadow: '0 4px 12px -2px var(--accent-primary)',
                                    animationDelay: '650ms',
                                    animationDuration: '400ms'
                                }}
                            >
                                💰 Trade with Foreman
                            </button>

                            <button
                                onClick={() => alert("Information gathering coming soon!")}
                                className="px-4 py-3 text-white rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 animate-in zoom-in fade-in"
                                style={{
                                    backgroundColor: 'var(--color-success)',
                                    boxShadow: '0 4px 12px -2px var(--color-success)',
                                    animationDelay: '700ms',
                                    animationDuration: '400ms'
                                }}
                            >
                                🗣️ Talk to Miners
                            </button>

                            <button
                                onClick={() => alert("Exploration feature coming soon!")}
                                className="px-4 py-3 text-white rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 animate-in zoom-in fade-in"
                                style={{
                                    backgroundColor: 'var(--accent-primary)',
                                    boxShadow: '0 4px 12px -2px var(--accent-primary)',
                                    animationDelay: '750ms',
                                    animationDuration: '400ms'
                                }}
                            >
                                🔦 Explore Deeper Tunnels
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Footer */}
                <div className="p-4 rounded-b-2xl animate-in slide-in-from-bottom-2 fade-in duration-500 delay-600"
                    style={{
                        backgroundColor: 'var(--surface-muted)',
                        borderTopWidth: '1px',
                        borderColor: 'var(--border-normal)'
                    }}
                >
                    <div className="flex justify-between items-center">
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {era === HistoricalEra.PREHISTORY || era === HistoricalEra.ANTIQUITY
                                ? "Mining is dangerous work with primitive tools"
                                : era === HistoricalEra.MODERN_ERA || era === HistoricalEra.FUTURE_ERA
                                ? "Modern safety regulations are in effect"
                                : "Watch out for cave-ins and toxic gases"}
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95"
                            style={{
                                backgroundColor: 'var(--surface-elevated)',
                                color: 'var(--text-primary)',
                                borderWidth: '1px',
                                borderColor: 'var(--border-normal)'
                            }}
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