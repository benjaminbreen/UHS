/**
 * components/CharacterProfileModal.tsx - A sophisticated, multi-tab modal for the player character profile.
 * Enhanced with intuitive equipment system, comprehensive inventory management, and beautiful UI.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { PlayerCharacter, EquipmentSlot, Item, Rarity, Appearance, NpcEntity } from '../types';
import { useUI } from '../contexts/UIContext';
import { ProceduralPortrait } from './portraits';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import BeliefsPanel from './BeliefsPanel';
import { hexToColorName, formatAppearanceText } from '../utils/colorUtils';
import EquipmentPanel from './EquipmentPanel';
import { generateProceduralItemDescription, isGenericDescription } from '../services/itemDescriptionGenerator';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';


interface CharacterProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    character: PlayerCharacter;
    onCharacterUpdate: React.Dispatch<React.SetStateAction<PlayerCharacter | null>>;
    onRegenerate: () => void;
    isEnhancing?: boolean;
    onEquipItem: (item: Item) => void;
    onUnequipItem: (slot: EquipmentSlot) => void;
    onDropItem: (item: Item) => void;
    onConsumeItem: (item: Item) => void;
    date: string;
    location: string;
}

// Utility functions
const cmToFeetAndInches = (cm: number): string => {
    if (!cm) return `N/A`;
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}' ${inches}"`;
};

const kgToLbs = (kg: number): string => {
    if (!kg) return 'N/A';
    return `${Math.round(kg * 2.20462)} lbs`;
};

const formatItemName = (name: string): string => {
    if (!name) return '';
    return name.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}


// Enhanced StatBar Component
const StatBar: React.FC<{ label: string; value: number; icon: string; color: string; max?: number }> = ({ 
    label, value, icon, color, max = 20 
}) => {
    const [finalWidth, setFinalWidth] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            const percentage = Math.max(0, Math.min(100, (value / max) * 100));
            setFinalWidth(percentage);
        }, 100);
        return () => clearTimeout(timer);
    }, [value, max]);

    return (
        <div className="flex items-center gap-4 group">
            <span className="flex items-center text-slate-300 w-40 text-sm font-medium transition-colors group-hover:text-white">
                <span className="w-8 text-lg text-center">{icon}</span>
                {label}
            </span>
            <div className="flex-1 flex items-center gap-3">
                <div className="w-full h-5 bg-slate-800/50 rounded-md overflow-hidden border border-slate-700/50 relative">
                    <div
                        className="h-full rounded-md transition-all duration-1000 ease-out relative overflow-hidden"
                        style={{
                            width: `${finalWidth}%`,
                            backgroundColor: color,
                            boxShadow: `0 0 10px ${color}40`,
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                    </div>
                </div>
                <span className="font-bold text-white w-8 text-right pr-1 font-mono">{value}</span>
            </div>
        </div>
    );
};

// Enhanced RarityTag Component
const RarityTag: React.FC<{ rarity: Rarity }> = ({ rarity }) => {
    const rarityStyles: Record<Rarity, string> = {
        'Junk': 'bg-gray-500 text-gray-200 border-gray-400',
        'Common': 'bg-slate-600 text-slate-200 border-slate-400',
        'Uncommon': 'bg-green-600 text-green-100 border-green-400 shadow-glow-primary',
        'Rare': 'bg-blue-600 text-blue-100 border-blue-400 shadow-glow-blue',
        'Ultra-rare': 'bg-purple-600 text-purple-100 border-purple-400 shadow-glow-purple',
        'Unique': 'bg-amber-500 text-amber-100 border-amber-400 shadow-glow-amber',
    };
    
    return (
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border font-press-start ${rarityStyles[rarity] || 'bg-gray-500'}`}>
            {rarity.toUpperCase()}
        </span>
    );
};

// Enhanced DetailRow Component
const DetailRow: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-1">
        <span className="text-slate-400">{label}:</span> 
        <span className="font-semibold text-white capitalize text-right">{value}</span>
    </div>
);

// Enhanced TraitDisplay Component
const TraitDisplay: React.FC<{ label: string, value: number }> = ({ label, value }) => {
    const [animatedValue, setAnimatedValue] = useState(0);
    const percentage = value * 100;
    const intensity = value > 0.8 ? 'Very High' : value > 0.6 ? 'High' : value > 0.4 ? 'Moderate' : value > 0.2 ? 'Low' : 'Very Low';
    const colorClass = value > 0.7 ? 'bg-emerald-500' : value > 0.4 ? 'bg-blue-500' : 'bg-slate-500';
    const shadowColor = value > 0.7 ? '#10b981' : value > 0.4 ? '#3b82f6' : '#64748b';

    useEffect(() => {
        const timer = setTimeout(() => setAnimatedValue(percentage), 200);
        return () => clearTimeout(timer);
    }, [percentage]);

    return (
        <div className="text-sm mb-3">
            <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 font-medium">{label}</span>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{intensity}</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
                <div 
                    className={`h-full ${colorClass} transition-all duration-1000 ease-out relative overflow-hidden`} 
                    style={{ 
                        width: `${animatedValue}%`,
                        boxShadow: `0 0 8px ${shadowColor}40`
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                </div>
            </div>
        </div>
    );
};

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ 
    label, isActive, onClick 
}) => (
    <button 
        onClick={onClick}
        className={`flex-shrink-0 py-2.5 md:py-3 px-3 md:px-4 text-[11px] md:text-xs font-semibold border-b-2 transition-all duration-300 whitespace-nowrap ${
            isActive 
                ? 'text-white border-blue-500 bg-slate-700/50' 
                : 'text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-white hover:border-slate-500'
        }`}
    >
        {label}
    </button>
);

// Main Component
const CharacterProfileModal: React.FC<CharacterProfileModalProps> = ({ 
    isOpen, onClose, character, onRegenerate, isEnhancing, onEquipItem, onUnequipItem, 
    onDropItem, onConsumeItem, date, location 
}) => {
    const { setIsPortraitModalOpen, setPortraitModalCharacter } = useUI();
    const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'equipment' | 'inventory' | 'history' | 'beliefs'>('overview');
    const [selectedInventoryItem, setSelectedInventoryItem] = useState<Item | null>(null);
    const [inventoryFilter, setInventoryFilter] = useState<'All' | 'Weapons' | 'Clothing' | 'Consumables' | 'Other'>('All');
    
    useEffect(() => {
        if (!isOpen) {
            setActiveTab('overview');
            setSelectedInventoryItem(null);
        }
    }, [isOpen]);

    const allItems = useMemo(() => {
        if (!character) return [];
        return character.inventory || [];
    }, [character]);

    const filteredInventory = useMemo(() => {
        let items = allItems;
        if (inventoryFilter !== 'All') {
            items = items.filter(item => {
                switch(inventoryFilter) {
                    case 'Weapons': return item.category === 'Weapon';
                    case 'Clothing': return item.category === 'Apparel';
                    case 'Consumables': return item.category === 'Consumable' || item.sustenance > 0 || item.fatigueEffect || item.xpEffect;
                    case 'Other': return !['Weapon', 'Apparel', 'Consumable'].includes(item.category) && !item.sustenance && !item.fatigueEffect && !item.xpEffect;
                    default: return true;
                }
            });
        }
        return items;
    }, [allItems, inventoryFilter]);

    useEffect(() => {
        if (filteredInventory.length > 0 && (!selectedInventoryItem || !filteredInventory.find(i => i.id === selectedInventoryItem.id))) {
            setSelectedInventoryItem(filteredInventory[0]);
        } else if (filteredInventory.length === 0) {
            setSelectedInventoryItem(null);
        }
    }, [filteredInventory, selectedInventoryItem]);
    
    if (!isOpen || !character) return null;

    const renderOverview = () => {
        return (
            <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Left column: Portrait and Vitals */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Portrait with Name/Profession Box */}
                        <div className="space-y-4">
                            <div 
                                className="relative w-full max-w-xs mx-auto lg:max-w-none group cursor-pointer"
                                onClick={() => {
                                    setIsPortraitModalOpen(true);
                                    setPortraitModalCharacter(character);
                                }}
                                title="Click to view full portrait"
                            >
                                <div className="aspect-square bg-slate-900/50 rounded-xl border-2 border-slate-700/50 shadow-xl shadow-black/40 overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:border-blue-500/50 flex items-center justify-center">
                                    <div className="w-full h-full transform scale-110">
                                        <ProceduralPortrait character={character} size={300} />
                                    </div>
                                </div>
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none group-hover:from-black/40 transition-colors" />
                                <div className="absolute bottom-2 right-2 bg-black/50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Name and Profession Box */}
                            <div className="p-4 bg-slate-800/60 rounded-lg border border-slate-700/50 text-center">
                                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{character.name}</h3>
                                <p className="text-base md:text-lg font-semibold text-amber-300 capitalize">{character.profession}</p>
                            </div>
                        </div>

                        {/* Vitals Box */}
                        <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                            <h4 className="font-semibold text-blue-300 mb-3 text-sm uppercase tracking-wider">VITALS</h4>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-red-400">Health</span>
                                        <span className="text-sm font-bold text-white">{character.health}/{character.maxHealth}</span>
                                    </div>
                                    <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300" style={{width: `${(character.health/character.maxHealth) * 100}%`}}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-yellow-400">Fatigue</span>
                                        <span className="text-sm font-bold text-white">{Math.round(character.fatigue)}/100</span>
                                    </div>
                                    <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-300" style={{width: `${character.fatigue}%`}}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-cyan-400">Experience</span>
                                        <span className="text-sm font-bold text-white">{character.experience}/{character.maxExperience}</span>
                                    </div>
                                    <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300" style={{width: `${(character.experience/character.maxExperience) * 100}%`}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle column: Background and Status */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50 h-full">
                            <h3 className="text-base md:text-lg font-bold text-amber-400 mb-3 uppercase tracking-wider">Background</h3>
                            <p className="font-lora text-sm md:text-base text-slate-200 leading-relaxed italic whitespace-pre-wrap">
                               {character.backstory}
                            </p>
                        </div>
                    </div>

                    {/* Right column: Stats and Details */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                            <h4 className="font-semibold text-blue-300 mb-3 text-sm uppercase tracking-wider">CHARACTER INFO</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Level:</span>
                                    <span className="font-bold text-white">{character.level}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Age:</span>
                                    <span className="font-bold text-white">{character.age}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Class:</span>
                                    <span className="font-bold text-white text-right">{character.class?.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="text-slate-400">Religion:</span>
                                    <span className="font-bold text-white text-right max-w-[60%]">{character.religion}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Height:</span>
                                    <span className="font-bold text-white">{cmToFeetAndInches(character.appearance?.height || 170)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Weight:</span>
                                    <span className="font-bold text-white">{kgToLbs(character.appearance?.weight || 70)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                            <h4 className="font-semibold text-blue-300 mb-3 text-sm uppercase tracking-wider">APPEARANCE</h4>
                            <div className="text-sm space-y-2">
                                 <DetailRow label="Garment" value={formatAppearanceText(character.equippedItems.torso || character.appearance.garment, character.appearance.palette?.primary)} />
                                 <DetailRow label="Headgear" value={formatAppearanceText(character.equippedItems.head || character.appearance.headgear, character.appearance.palette?.secondary)} />
                                 <DetailRow label="Footwear" value={formatAppearanceText(character.equippedItems.feet || character.appearance.footwear, character.appearance.palette?.secondary)} />
                                 <DetailRow label="Build" value={character.appearance?.build} />
                            </div>
                        </div>
                        
                        <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                            <h4 className="font-semibold text-blue-300 mb-3 text-sm uppercase tracking-wider">TOP STATS</h4>
                            <div className="space-y-3">
                                {Object.entries(character.stats)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 3)
                                    .map(([stat, value]) => (
                                        <div key={stat} className="flex justify-between items-center">
                                            <span className="text-sm text-slate-300 capitalize">{stat}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-3 bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300" style={{width: `${(value/20) * 100}%`}}></div>
                                                </div>
                                                <span className="text-sm font-bold text-white w-6 text-right">{value}</span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderStats = () => (
        <div className="p-8 grid md:grid-cols-2 gap-8">
            <div>
                <h3 className="text-lg font-bold text-slate-300 mb-4 uppercase tracking-wider">Core Stats</h3>
                <div className="space-y-4">
                    <StatBar label="Strength" value={character.stats.strength} icon="💪" color="#ef4444" />
                    <StatBar label="Dexterity" value={character.stats.dexterity} icon="🤸" color="#22c55e" />
                    <StatBar label="Constitution" value={character.stats.constitution} icon="❤️" color="#f97316" />
                    <StatBar label="Intelligence" value={character.stats.intelligence} icon="🧠" color="#3b82f6" />
                    <StatBar label="Persuasion" value={character.stats.persuasion} icon="💬" color="#8b5cf6" />
                    <StatBar label="Perception" value={character.stats.perception} icon="👁️" color="#eab308" />
                </div>
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-300 mb-4 uppercase tracking-wider">Personality</h3>
                <div className="space-y-4">
                    <TraitDisplay label="Openness" value={character.personality.openness} />
                    <TraitDisplay label="Conscientiousness" value={character.personality.conscientiousness} />
                    <TraitDisplay label="Extraversion" value={character.personality.extraversion} />
                    <TraitDisplay label="Agreeableness" value={character.personality.agreeableness} />
                    <TraitDisplay label="Neuroticism" value={character.personality.neuroticism} />
                </div>
            </div>
        </div>
    );

    const renderHistoryTab = () => {
        const { lifeEvents = [], family = [] } = character;
        return (
            <div className="p-6 grid md:grid-cols-2 gap-8">
                <div>
                    <h4 className="font-semibold text-lg text-blue-400 mb-4 border-b border-slate-700 pb-2">Family</h4>
                    <div className="space-y-4 text-sm">
                        {(['father', 'mother'] as const).map(rel => {
                            const member = family.find(f => f.relation === rel);
                            if (!member) return null;
                            return <div key={rel}><strong>{member.relation.charAt(0).toUpperCase() + member.relation.slice(1)}:</strong> {member.name} ({member.profession})</div>
                        })}
                        {(['spouse'] as const).map(rel => {
                            const member = family.find(f => f.relation === rel);
                            if (!member) return null;
                            return <div key={rel}><strong>Spouse:</strong> {member.name} ({member.profession}, age {member.age})</div>
                        })}
                         <div>
                            <strong>Children:</strong>
                            <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                                {family.filter(f => f.relation === 'son' || f.relation === 'daughter').map(child => (
                                    <li key={child.name}>{child.name} (age {child.age})</li>
                                ))}
                                {family.filter(f => f.relation === 'son' || f.relation === 'daughter').length === 0 && <li>None</li>}
                            </ul>
                        </div>
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-lg text-blue-400 mb-4 border-b border-slate-700 pb-2">Timeline</h4>
                    <div className="relative border-l-2 border-gray-600 pl-6 space-y-6">
                        {lifeEvents.map((event, index) => (
                            <div key={index} className="relative">
                                <div className="absolute -left-[30.5px] top-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-gray-800"></div>
                                <div className="text-xs text-gray-400 font-semibold">{event.year}</div>
                                <div className="text-sm text-white">{event.event}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderInventory = () => {
        const displayDescription = selectedInventoryItem ? (isGenericDescription(selectedInventoryItem.description, selectedInventoryItem.name) ? generateProceduralItemDescription(selectedInventoryItem) : selectedInventoryItem.description) : '';

        return (
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                <div className="lg:col-span-2 flex flex-col bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                    <div className="flex justify-between items-center mb-2 shrink-0 px-1">
                        <h4 className="font-semibold text-lg text-green-300">Inventory</h4>
                        <div className="flex gap-1 p-1 bg-slate-900/50 rounded-md">
                            {(['All', 'Weapons', 'Clothing', 'Consumables', 'Other'] as const).map(cat => (
                                <button key={cat} onClick={() => setInventoryFilter(cat)} className={`px-2 py-0.5 text-xs rounded ${inventoryFilter === cat ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-thin pr-2 space-y-2">
                        {filteredInventory.map(item => (
                            <div 
                                key={item.id}
                                className={`flex items-center p-2 rounded-md cursor-pointer transition-all duration-150
                                ${selectedInventoryItem?.id === item.id ? 'bg-blue-800/50 ring-1 ring-blue-500' : 'bg-slate-900/50 hover:bg-slate-700/50'}`}
                                onClick={() => setSelectedInventoryItem(item)}
                            >
                                <div className="w-10 h-10 flex items-center justify-center">
                                    <GenerativeItemIcon item={item} size={40} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate text-white">{formatItemName(item.name)}</p>
                                </div>
                                {item.stackable && item.quantity > 1 && <span className="text-xs text-slate-400 mr-3">x{item.quantity}</span>}
                                <RarityTag rarity={item.rarity} />
                            </div>
                        ))}
                        {filteredInventory.length === 0 && (
                            <p className="text-center text-slate-500 italic py-8 text-sm">No items in this category.</p>
                        )}
                    </div>
                </div>
                <div className="flex flex-col bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                    {selectedInventoryItem ? (
                        <div className="text-center flex flex-col h-full">
                            <div className="w-24 h-24 my-4 mx-auto flex items-center justify-center">
                               <GenerativeItemIcon item={selectedInventoryItem} size={96} />
                            </div>
                            <h5 className="font-bold text-lg text-white">{formatItemName(selectedInventoryItem.name)}</h5>
                            <p className="text-sm text-slate-400 mb-4 italic">{displayDescription}</p>
                            <div className="text-xs space-y-1 text-left mb-4 p-2 bg-slate-900/30 rounded-md">
                                <DetailRow label="Category" value={selectedInventoryItem.category} />
                                <DetailRow label="Value" value={`${selectedInventoryItem.value} 🪙`} />
                                <DetailRow label="Weight" value={`${selectedInventoryItem.weight} lbs`} />
                            </div>
                            <div className="mt-auto space-y-2">
                                {(selectedInventoryItem.wearable || selectedInventoryItem.wieldable) && <button onClick={() => onEquipItem(selectedInventoryItem)} className="w-full ff-action-button">Equip</button>}
                                {(selectedInventoryItem.sustenance > 0 || selectedInventoryItem.fatigueEffect || selectedInventoryItem.xpEffect) && <button onClick={() => onConsumeItem(selectedInventoryItem)} className="w-full ff-action-button">Consume</button>}
                                <button onClick={() => onDropItem(selectedInventoryItem)} className="w-full ff-action-button bg-red-800/50 border-red-500/50 hover:bg-red-700/50">Drop</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500 italic">Select an item</div>
                    )}
                </div>
            </div>
        );
    }
    
    const renderContent = () => {
        return (
            <div className="min-h-[650px]">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'stats' && renderStats()}
                {activeTab === 'equipment' && <EquipmentPanel character={character} onEquipItem={onEquipItem} onUnequipItem={onUnequipItem} />}
                {activeTab === 'inventory' && renderInventory()}
                {activeTab === 'beliefs' && <div className="p-4"><BeliefsPanel character={character} /></div>}
                {activeTab === 'history' && renderHistoryTab()}
            </div>
        )
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="ff-panel w-full max-w-5xl md:max-w-6xl h-auto max-h-[95vh] md:max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] flex-grow min-h-0">
                    {/* Left Column: Party - hidden on mobile, shown on desktop */}
                    <div className="hidden md:flex p-3 flex-col gap-3 border-r-2 border-slate-700 bg-slate-800/30">
                        <h3 className="font-press-start text-lg text-slate-300 text-center tracking-wider">PARTY</h3>
                        <div className="p-3 rounded-lg bg-gradient-to-br from-slate-700/50 to-slate-800/40 border border-slate-600/50">
                            <div className="flex items-center gap-3">
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-900 border-2 border-slate-500 shadow-lg shrink-0 flex items-center justify-center">
                                    <div className="transform scale-110">
                                        <ProceduralPortrait character={character} size={64} />
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-base text-white truncate">{character.name}</h4>
                                    <p className="text-xs text-amber-300 capitalize truncate">{character.profession}</p>
                                    <p className="text-xs text-blue-300 mt-1">Level {character.level}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Tabs */}
                    <div className="flex flex-col min-h-0">
                        <div className="flex-shrink-0 flex border-b-2 border-slate-700 bg-slate-800/60 overflow-x-auto scrollbar-thin">
                            <TabButton label="Overview" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                            <TabButton label="Stats" isActive={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
                            <TabButton label="Equipment" isActive={activeTab === 'equipment'} onClick={() => setActiveTab('equipment')} />
                            <TabButton label="Inventory" isActive={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
                            <TabButton label="Beliefs" isActive={activeTab === 'beliefs'} onClick={() => setActiveTab('beliefs')} />
                            <TabButton label="History" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
                        </div>
                        <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50">
                            {renderContent()}
                        </div>
                    </div>
                </div>
                 {/* Footer */}
                 <div className="flex-shrink-0 p-4 border-t-2 border-slate-700 flex justify-between items-center bg-slate-800/80">
                    <div>
                        <button onClick={onRegenerate} className="ff-action-button" disabled={isEnhancing}>
                            {isEnhancing ? "Enhancing..." : "Regenerate Character"}
                        </button>
                    </div>
                    <button onClick={onClose} className="ff-action-button">Close</button>
                </div>
            </div>
        </div>
    );
};

export default CharacterProfileModal;
