/**
 * components/RuinModal.tsx - Modal for exploring ruins with roguelike dungeon option
 */
import React, { useState, useMemo, useEffect } from 'react';
import { Tile, PlayerCharacter, MapData } from '../types';
import RuinBanner from './RuinBanner';
import RoguelikeDisplay from './RoguelikeDisplay';

interface RuinModalProps {
    tile: Tile;
    playerCharacter: PlayerCharacter;
    mapData: MapData;
    onClose: () => void;
    onExplore?: () => void;
}

interface RuinType {
    name: string;
    description: string;
    age: string;
    dangers: string[];
}

const RUIN_TYPES: RuinType[] = [
    {
        name: 'Ancient Temple Complex',
        description: 'Crumbling stone pillars and weathered carvings hint at forgotten gods. Vines snake through collapsed archways where once pilgrims walked.',
        age: 'Over 800 years old',
        dangers: ['Unstable masonry', 'Hidden pits', 'Poisonous plants']
    },
    {
        name: 'Abandoned Fortress',
        description: 'The remnants of a once-mighty stronghold. Broken battlements and rusted gates tell of battles long past.',
        age: 'Approximately 400 years old',
        dangers: ['Crumbling walls', 'Deep cellars', 'Wild animals']
    },
    {
        name: 'Lost Settlement',
        description: 'Stone foundations and collapsed timber frames mark where a village once thrived. Nature has begun to reclaim what was built.',
        age: 'About 200 years old',
        dangers: ['Rotting wood', 'Overgrown paths', 'Vermin']
    },
    {
        name: 'Ruined Palace',
        description: 'Ornate columns and shattered marble speak of former grandeur. Broken frescoes peek through centuries of decay.',
        age: 'Nearly 600 years old',
        dangers: ['Collapsed chambers', 'Valuable artifacts', 'Treasure seekers']
    },
    {
        name: 'Ancient Observatory',
        description: 'A circular stone platform with strange astronomical markings. The roof has long since caved in.',
        age: 'Over 1000 years old',
        dangers: ['Mysterious symbols', 'Deep shaft', 'Strange energies']
    }
];

const RuinModal: React.FC<RuinModalProps> = ({
    tile,
    playerCharacter,
    mapData,
    onClose,
    onExplore
}) => {
    const [inRoguelike, setInRoguelike] = useState(false);
    const [description, setDescription] = useState('');

    const ruinType = useMemo(() => {
        // Select ruin type based on tile coordinates for consistency
        const index = (tile.x + tile.y * 37) % RUIN_TYPES.length;
        return RUIN_TYPES[index];
    }, [tile.x, tile.y]);

    useEffect(() => {
        // Generate contextual description
        const baseDescription = ruinType.description;
        const contextual = generateContextualDetails(tile, mapData);
        setDescription(`${baseDescription} ${contextual}`);
    }, [ruinType, tile, mapData]);

    const generateContextualDetails = (tile: Tile, mapData: MapData) => {
        const details = [];
        
        if (tile.biome === 'FOREST') {
            details.push('Ancient trees have grown through the ruins, their roots cracking stone.');
        } else if (tile.biome === 'DESERT') {
            details.push('Sand has drifted into every crevice, half-burying the remnants.');
        } else if (tile.biome === 'MOUNTAIN') {
            details.push('The mountain winds have worn the stones smooth over centuries.');
        } else if (tile.biome === 'COASTAL') {
            details.push('Salt air and sea spray have corroded much of the metalwork.');
        } else {
            details.push('Weather and time have taken their toll on these ancient stones.');
        }

        if (tile.elevation > 200) {
            details.push('From this elevated position, you can see for miles across the landscape.');
        }

        return details.join(' ');
    };

    const handleExploreRuin = () => {
        setInRoguelike(true);
        onExplore?.();
    };

    const handleExitRoguelike = () => {
        setInRoguelike(false);
    };

    if (inRoguelike) {
        return (
            <RoguelikeDisplay
                ruinType={ruinType}
                playerCharacter={playerCharacter}
                onExit={handleExitRoguelike}
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-600">
                {/* Banner */}
                <RuinBanner
                    ruinName={ruinType.name}
                    ruinAge={ruinType.age}
                    tile={tile}
                    mapData={mapData}
                />
                
                {/* Main Content */}
                <div className="p-6 space-y-6">
                    {/* Description */}
                    <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                        <h3 className="text-lg font-bold text-slate-200 mb-3">What You See</h3>
                        <p className="text-slate-300 leading-relaxed">
                            {description}
                        </p>
                    </div>

                    {/* Dangers */}
                    <div className="bg-red-900/30 rounded-lg p-4 border border-red-700/50">
                        <h3 className="text-lg font-bold text-red-300 mb-3">⚠️ Potential Hazards</h3>
                        <ul className="text-red-200 space-y-1">
                            {ruinType.dangers.map((danger, index) => (
                                <li key={index} className="flex items-center">
                                    <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                                    {danger}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Cave Opening */}
                    <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                        <h3 className="text-lg font-bold text-slate-200 mb-3">🕳️ A Dark Opening</h3>
                        <p className="text-slate-300 mb-4">
                            Among the rubble, you notice a cave-like opening leading deeper into the ruins. 
                            Cold air drifts up from the depths, carrying the scent of ancient stone and mystery. 
                            Strange echoes suggest vast chambers below.
                        </p>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={handleExploreRuin}
                                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors border border-amber-500 shadow-lg"
                            >
                                🏃 Descend into the Ruins
                            </button>
                            
                            <div className="text-xs text-slate-400 self-center">
                                <p>Enter a procedural dungeon</p>
                                <p>Find treasure • Avoid traps • Escape alive</p>
                            </div>
                        </div>
                    </div>

                    {/* Character Status */}
                    <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                        <h3 className="text-lg font-bold text-slate-200 mb-3">Your Condition</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-400">Health:</span>
                                <span className="text-green-400 ml-2">{Math.ceil(playerCharacter.health)}/{Math.ceil(playerCharacter.maxHealth)}</span>
                            </div>
                            <div>
                                <span className="text-slate-400">Gold:</span>
                                <span className="text-yellow-400 ml-2">{playerCharacter.currency}</span>
                            </div>
                            <div>
                                <span className="text-slate-400">Class:</span>
                                <span className="text-blue-400 ml-2 capitalize">{playerCharacter.class}</span>
                            </div>
                            <div>
                                <span className="text-slate-400">Level:</span>
                                <span className="text-purple-400 ml-2">{playerCharacter.stats.level}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-900 p-4 rounded-b-2xl border-t border-slate-600">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-slate-400">
                            Exploring ruins carries risk but may yield ancient treasures
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                        >
                            Leave the Ruins
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RuinModal;