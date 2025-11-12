/**
 * components/StudyPanel.tsx
 * Panel for studying collected items and encountered entities
 */

import React, { useState } from 'react';
import { Item, NpcEntity } from '../types';
import { AnimalEntity } from '../types/animalTypes';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';
import { Microscope, Users, ArrowLeft } from 'lucide-react';
import { StudyAction } from '../types/studyTypes';

export interface StudiedItem extends Item {
    studyProgress?: number; // 0-100%
    notes?: string[];
    discoveredProperties?: string[];
    dateStudied?: number; // timestamp
}

export interface StudyData {
    specimens: StudiedItem[];
    encounters: {
        npcs: NpcEntity[];
        animals: AnimalEntity[];
        timestamp: number;
    }[];
}

interface StudyPanelProps {
    studyData: StudyData;
    selectedItems?: string[];
    onSelectionChange?: (selectedIds: string[]) => void;
    onReturnToInventory?: (item: StudiedItem) => void;
    onObserve?: (item: StudiedItem | NpcEntity | AnimalEntity) => void;
    onStudyAction?: (item: any, action: StudyAction, input: string) => void;
}

const StudyPanel: React.FC<StudyPanelProps> = ({
    studyData,
    selectedItems = [],
    onSelectionChange,
    onReturnToInventory,
    onObserve,
    onStudyAction
}) => {
    const { specimens, encounters } = studyData;

    // Flatten encounters for display
    const encounteredNpcs = encounters.flatMap(e => e.npcs);
    const encounteredAnimals = encounters.flatMap(e => e.animals);

    return (
        <div className="flex flex-col h-full surface-card rounded-lg">
            {/* Header */}
            <div className="px-3 py-2 border-b border-surface-muted">
                <div className="flex items-center gap-2">
                    <Microscope className="w-4 h-4 text-accent" />
                    <h3 className="text-sm font-bold text-text-primary">Study Collection</h3>
                </div>
                <div className="text-xs text-text-muted mt-1">
                    {specimens.length} specimens • {encounteredNpcs.length} NPCs • {encounteredAnimals.length} animals
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* Specimens Section */}
                {specimens.length > 0 && (
                    <div>
                        <div className="flex items-center gap-1 mb-2">
                            <Microscope className="w-3 h-3 text-accent" />
                            <h4 className="text-xs font-semibold text-accent">Specimens Under Study</h4>
                        </div>
                        <div className="space-y-2">
                            {specimens.map((item) => (
                                <div key={item.id} className={`surface-muted rounded-lg p-2 border transition-colors ${
                                    selectedItems.includes(item.id) ? 'border-accent/70 bg-accent/20' : 'border-surface-muted'
                                }`}>
                                    <div className="flex items-start gap-2">
                                        {/* Selection Checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.includes(item.id)}
                                            onChange={(e) => {
                                                if (!onSelectionChange) return;
                                                if (e.target.checked) {
                                                    onSelectionChange([...selectedItems, item.id]);
                                                } else {
                                                    onSelectionChange(selectedItems.filter(id => id !== item.id));
                                                }
                                            }}
                                            className="mt-1 w-4 h-4 text-accent bg-background-secondary border-surface-muted rounded focus:ring-accent focus:ring-2"
                                        />
                                        <div className="w-8 h-8 flex-shrink-0">
                                            <GenerativeItemIcon item={item} size={32} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-medium text-text-primary truncate">{item.name} 🔬</p>
                                                {item.studyProgress !== undefined && (
                                                    <span className="text-xs text-accent">{item.studyProgress}%</span>
                                                )}
                                            </div>
                                            {item.description && (
                                                <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{item.description}</p>
                                            )}
                                            {item.discoveredProperties && item.discoveredProperties.length > 0 && (
                                                <div className="mt-1">
                                                    {item.discoveredProperties.map((prop, idx) => (
                                                        <p key={idx} className="text-xs text-[var(--color-success)]">✓ {prop}</p>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Action Buttons */}
                                            <div className="mt-2 flex gap-1">
                                                <button
                                                    onClick={() => onReturnToInventory?.(item)}
                                                    className="text-xs px-2 py-0.5 surface-muted text-text-muted rounded hover:surface-card transition-colors flex items-center gap-1"
                                                >
                                                    <ArrowLeft className="w-3 h-3" />
                                                    Return
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* NPCs Section */}
                {encounteredNpcs.length > 0 && (
                    <div>
                        <div className="flex items-center gap-1 mb-2">
                            <Users className="w-3 h-3 text-[var(--color-success)]" />
                            <h4 className="text-xs font-semibold text-[var(--color-success)]">Encountered NPCs</h4>
                        </div>
                        <div className="space-y-1">
                            {encounteredNpcs.slice(0, 10).map((npc, idx) => (
                                <div key={`npc-${idx}`} className="surface-muted rounded px-2 py-1 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{npc.emoji || '👤'}</span>
                                        <div>
                                            <p className="text-xs text-text-primary">{npc.name}</p>
                                            <p className="text-xs text-text-muted">{npc.profession}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onObserve?.(npc)}
                                        className="text-xs px-2 py-0.5 bg-[var(--color-success)]/10 text-[var(--color-success)] rounded hover:bg-[var(--color-success)]/20 transition-colors"
                                    >
                                        Recall
                                    </button>
                                </div>
                            ))}
                            {encounteredNpcs.length > 10 && (
                                <p className="text-xs text-text-muted text-center">...and {encounteredNpcs.length - 10} more</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Animals Section */}
                {encounteredAnimals.length > 0 && (
                    <div>
                        <div className="flex items-center gap-1 mb-2">
                            <span className="w-3 h-3 text-[var(--color-warning)]">🐾</span>
                            <h4 className="text-xs font-semibold text-[var(--color-warning)]">Encountered Animals</h4>
                        </div>
                        <div className="space-y-1">
                            {encounteredAnimals.slice(0, 10).map((animal, idx) => (
                                <div key={`animal-${idx}`} className="surface-muted rounded px-2 py-1 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{animal.emoji || '🐾'}</span>
                                        <div>
                                            <p className="text-xs text-text-primary">{animal.speciesName}</p>
                                            <p className="text-xs text-text-muted">{animal.gender} • {animal.age}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onObserve?.(animal)}
                                        className="text-xs px-2 py-0.5 bg-[var(--color-warning)]/10 text-[var(--color-warning)] rounded hover:bg-[var(--color-warning)]/20 transition-colors"
                                    >
                                        Recall
                                    </button>
                                </div>
                            ))}
                            {encounteredAnimals.length > 10 && (
                                <p className="text-xs text-text-muted text-center">...and {encounteredAnimals.length - 10} more</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {specimens.length === 0 && encounteredNpcs.length === 0 && encounteredAnimals.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-text-muted py-8">
                        <Microscope className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm font-semibold mb-1">No Studies Yet</p>
                        <p className="text-xs text-center max-w-xs">
                            Select items in your inventory and click "Study" to begin examining them.
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default StudyPanel;