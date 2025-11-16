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
        <div className="flex flex-col h-full">
            {/* Header - Improved Typography */}
            <div className="px-4 py-3 border-b border-[var(--border-normal)]">
                <div className="flex items-center gap-2">
                    <Microscope className="w-4 h-4 text-[var(--accent-primary)]" />
                    <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 tracking-tight">Study Collection</h3>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-500 mt-1.5 leading-relaxed font-medium">
                    {specimens.length} specimens • {encounteredNpcs.length} NPCs • {encounteredAnimals.length} animals
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                {/* Specimens Section */}
                {specimens.length > 0 && (
                    <div>
                        <div className="flex items-center gap-1.5 mb-2.5">
                            <Microscope className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                            <h4 className="text-[11px] font-semibold text-[var(--accent-primary)] uppercase tracking-[0.08em]">Specimens Under Study</h4>
                        </div>
                        <div className="space-y-2.5">
                            {specimens.map((item, index) => (
                                <div key={item.id}
                                    className={`study-item-card rounded-xl p-3 border transition-all duration-300 cursor-pointer group ${
                                        selectedItems.includes(item.id)
                                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/15 ring-2 ring-[var(--accent-primary)]/40 shadow-lg shadow-[var(--accent-primary)]/20'
                                            : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 hover:bg-[var(--bg-elevated)]/80 hover:border-[var(--border-normal)] hover:shadow-md hover:-translate-y-0.5'
                                    }`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
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
                                                <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.name} 🔬</p>
                                                {item.studyProgress !== undefined && (
                                                    <span className="text-xs text-[var(--accent-primary)] font-bold">{item.studyProgress}%</span>
                                                )}
                                            </div>
                                            {item.description && (
                                                <p className="text-[11px] text-slate-600 dark:text-slate-500 mt-1 line-clamp-2 leading-snug">{item.description}</p>
                                            )}
                                            {item.discoveredProperties && item.discoveredProperties.length > 0 && (
                                                <div className="mt-2 space-y-0.5">
                                                    {item.discoveredProperties.map((prop, idx) => (
                                                        <p key={idx} className="text-xs text-[var(--color-success)] leading-relaxed">✓ {prop}</p>
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
                        <div className="flex items-center gap-1.5 mb-2.5">
                            <Users className="w-3.5 h-3.5 text-[var(--color-success)]" />
                            <h4 className="text-[11px] font-semibold text-[var(--color-success)] tracking-[0.08em] uppercase">Encountered NPCs</h4>
                        </div>
                        <div className="space-y-2">
                            {encounteredNpcs.slice(0, 10).map((npc, idx) => (
                                <div key={`npc-${idx}`}
                                    className="study-item-card bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 flex items-center justify-between hover:bg-[var(--bg-elevated)]/80 hover:border-[var(--border-normal)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-xl">{npc.emoji || '👤'}</span>
                                        <div>
                                            <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{npc.name}</p>
                                            <p className="text-[11px] text-slate-600 dark:text-slate-500 leading-snug">{npc.profession}</p>
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
                        <div className="flex items-center gap-1.5 mb-2.5">
                            <span className="w-3 h-3 text-[var(--color-warning)]">🐾</span>
                            <h4 className="text-xs font-semibold text-[var(--color-warning)] tracking-tight">Encountered Animals</h4>
                        </div>
                        <div className="space-y-2">
                            {encounteredAnimals.slice(0, 10).map((animal, idx) => (
                                <div key={`animal-${idx}`} className="surface-muted rounded-lg px-3 py-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {animal.imagePath ? (
                                          <img src={animal.imagePath} alt={animal.speciesName} className="w-6 h-6" />
                                        ) : (
                                          <span className="text-lg">{animal.emoji || '🐾'}</span>
                                        )}
                                        <div>
                                            <p className="text-xs font-medium text-text-primary tracking-tight">{animal.speciesName}</p>
                                            <p className="text-xs text-text-muted leading-relaxed">{animal.gender} • {animal.age}</p>
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
                    <div className="flex flex-col items-center justify-center h-full text-text-muted py-12 px-6">
                        <Microscope className="w-10 h-10 mb-3 opacity-50" />
                        <p className="text-sm font-semibold mb-2 tracking-tight">No Studies Yet</p>
                        <p className="text-xs text-center max-w-xs leading-relaxed" style={{ lineHeight: '1.6' }}>
                            Select items in your inventory and click "Study" to begin examining them.
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default StudyPanel;