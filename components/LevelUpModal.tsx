/**
 * components/LevelUpModal.tsx - A modal for character level-up progression.
 */
import React, { useState, useMemo, useEffect } from 'react';
import { PlayerCharacter, HistoricalEra, CulturalZone } from '../types';
import { PROFESSIONS } from '../constants/index';
import { gameSounds } from '../services/gameSoundsService';

interface LevelUpModalProps {
    character: PlayerCharacter;
    onLevelUp: (stat?: keyof PlayerCharacter['stats'], newProfession?: string) => void;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({ character, onLevelUp }) => {
    const [selectedStat, setSelectedStat] = useState<keyof PlayerCharacter['stats'] | null>(null);
    const [selectedProfession, setSelectedProfession] = useState<string>(character.profession);

    // Play Generic Music (FF6 style) when modal opens
    useEffect(() => {
        gameSounds.playGenericMusic();
        // Also play the level up fanfare sound
        gameSounds.playLevelUpFanfareSound();

        // Cleanup on unmount
        return () => {
            gameSounds.stopGenericMusic();
        };
    }, []);

    const availableProfessions = useMemo(() => {
        const eraProfessions = PROFESSIONS[character.culturalZone]?.[character.era];
        if (!eraProfessions) return [character.profession];

        const professions: string[] = [];
        for (const socialClass in eraProfessions) {
            for (const roleName in eraProfessions[socialClass]) {
                professions.push(roleName);
            }
        }
        return [...new Set(professions)].sort();
    }, [character.culturalZone, character.era, character.profession]);

    const statChoices: (keyof PlayerCharacter['stats'])[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'persuasion', 'perception'];

    const handleConfirm = () => {
        gameSounds.playLevelUpSound(); // Play level up confirmation sound
        onLevelUp(selectedStat || undefined, selectedProfession);
    };

    return (
        <div
            data-surface="modal-overlay"
            className="modal-overlay theme-surface"
        >
            <div
                data-surface="modal-panel"
                className="ff-panel theme-surface w-full max-w-2xl p-6"
            >
                <h3 className="text-center text-4xl font-press-start mb-4 text-yellow-400">
                    LEVEL UP!
                </h3>
                <p className="text-center text-lg mb-6">
                    Congratulations, {character.name}! You've reached Level {character.level + 1}!
                </p>

                <div className="p-4 bg-black/20 rounded-lg border border-blue-500/30 mb-6 space-y-3 text-center">
                    <p className="text-blue-300">Your base stats have increased!</p>
                    <p className="text-sm text-slate-400">Max Health +10, Attack +1, Defense +1.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Stat Increase */}
                    <div>
                        <h4 className="font-semibold text-lg text-green-400 mb-3">Choose a Stat to Improve</h4>
                        <div className="space-y-2">
                            {statChoices.map(stat => (
                                <button
                                    key={stat}
                                    onClick={() => {
                                        setSelectedStat(stat);
                                        gameSounds.playUIClickSound(); // Click sound for stat selection
                                    }}
                                    className={`w-full p-3 text-left rounded-md border-2 transition-all duration-200 ${
                                        selectedStat === stat 
                                        ? 'bg-green-800/50 border-green-400' 
                                        : 'bg-slate-700/50 border-transparent hover:border-green-500/50'
                                    }`}
                                >
                                    <span className="font-bold capitalize">{stat}</span>
                                    <span className="text-sm text-slate-400 ml-2">(Current: {character.stats[stat]})</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Profession Change */}
                    <div>
                        <h4 className="font-semibold text-lg text-orange-400 mb-3">Change Your Path?</h4>
                        <p className="text-xs text-slate-400 mb-3">You can choose to change your profession to reflect your new experiences.</p>
                        <select
                            value={selectedProfession}
                            onChange={(e) => {
                                setSelectedProfession(e.target.value);
                                gameSounds.playButtonClickSound(); // Click sound for profession change
                            }}
                            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white"
                        >
                            {availableProfessions.map(prof => (
                                <option key={prof} value={prof}>
                                    {prof}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex justify-center mt-8">
                    <button
                        onClick={handleConfirm}
                        className="ff-action-button w-64"
                        disabled={!selectedStat}
                    >
                        {selectedStat ? 'Confirm Level Up' : 'Please select a stat'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LevelUpModal;
