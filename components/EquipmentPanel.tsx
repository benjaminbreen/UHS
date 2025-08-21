import React, { useState } from 'react';
import { PlayerCharacter, Item, EquipmentSlot, Rarity } from '../types';
import { getProceduralItemStats } from '../services/combatService';
import ItemStatsPanel from './ItemStatsPanel';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';

const RarityTag: React.FC<{ rarity: Rarity }> = ({ rarity }) => {
    const rarityStyles: Record<Rarity, string> = {
        'Junk': 'bg-gray-500 text-gray-200',
        'Common': 'bg-slate-600 text-slate-200',
        'Uncommon': 'bg-green-600 text-green-100',
        'Rare': 'bg-blue-600 text-blue-100',
        'Ultra-rare': 'bg-purple-600 text-purple-100',
        'Unique': 'bg-amber-500 text-amber-100',
    };
    return (
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${rarityStyles[rarity] || 'bg-gray-500'}`}>
            {rarity.toUpperCase()}
        </span>
    );
};

const StatComparisonTooltip: React.FC<{ 
    item: Item | null; 
    comparison: { attack: number; defense: number } | null;
    action: 'equip' | 'unequip';
    position: { x: number; y: number };
}> = ({ item, comparison, action, position }) => {
    if (!item) return null;

    const StatChange: React.FC<{ label: string; value: number }> = ({ label, value }) => {
        if (value === 0) return null;
        const color = value > 0 ? 'text-green-400' : 'text-red-400';
        const sign = value > 0 ? '+' : '';
        return <div className={`flex justify-between ${color}`}><span>{label}</span><span>{sign}{value}</span></div>;
    };

    // Calculate position to be next to cursor
    const tooltipWidth = 320; // approximate width
    const tooltipHeight = 200; // approximate height
    const padding = 10;
    
    let finalX = position.x + 15;
    let finalY = position.y - 10;
    
    // Adjust if tooltip would go off right edge
    if (finalX + tooltipWidth > window.innerWidth - padding) {
        finalX = position.x - tooltipWidth - 15;
    }
    
    // Adjust if tooltip would go off bottom edge
    if (finalY + tooltipHeight > window.innerHeight - padding) {
        finalY = position.y - tooltipHeight + 10;
    }
    
    // Adjust if tooltip would go off top edge
    if (finalY < padding) {
        finalY = padding;
    }
    
    return (
        <div 
            className="fixed z-[9999] pointer-events-none p-4 w-80 text-xs text-white transition-opacity duration-100 bg-slate-900/95 border-2 rounded-lg shadow-2xl border-blue-400 backdrop-blur-sm animate-popIn"
            style={{ 
                top: finalY, 
                left: finalX,
                transform: 'translateZ(0)' // Force GPU acceleration
            }}
        >
            {/* Header with action */}
            <div className="flex items-center gap-3 mb-3">
                {/* Large icon */}
                <div className="w-16 h-16 flex items-center justify-center bg-slate-800/50 rounded-lg border border-slate-600">
                    <GenerativeItemIcon item={item} size={64} />
                </div>
                
                {/* Item name and rarity */}
                <div className="flex-1">
                    <h4 className="font-bold text-sm text-blue-300">
                        {action === 'equip' ? 'Equip' : 'Unequip'}
                    </h4>
                    <p className="font-semibold text-white mt-1">{item.name}</p>
                    {item.rarity && (
                        <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            item.rarity === 'Common' ? 'bg-slate-600 text-slate-200' :
                            item.rarity === 'Uncommon' ? 'bg-green-600 text-green-100' :
                            item.rarity === 'Rare' ? 'bg-blue-600 text-blue-100' :
                            item.rarity === 'Ultra-rare' ? 'bg-purple-600 text-purple-100' :
                            item.rarity === 'Unique' ? 'bg-amber-500 text-amber-100' :
                            'bg-gray-500 text-gray-200'
                        }`}>
                            {item.rarity.toUpperCase()}
                        </span>
                    )}
                </div>
            </div>
            
            {/* Item properties */}
            <div className="grid grid-cols-2 gap-2 mb-2 text-[11px] text-slate-300">
                {item.equipmentSlot && (
                    <div className="flex items-center gap-1">
                        <span className="text-slate-500">Slot:</span>
                        <span className="capitalize">{item.equipmentSlot.replace('_', ' ')}</span>
                    </div>
                )}
                {(() => {
                    // Extract color from item name if present
                    const colorWords = ['navy', 'blue', 'royal', 'red', 'crimson', 'green', 'forest', 'yellow', 'gold', 
                                       'purple', 'orange', 'brown', 'black', 'white', 'silver', 'gray', 'grey',
                                       'teal', 'turquoise', 'coral', 'tan', 'ivory', 'amber', 'bronze', 'copper'];
                    
                    // Materials that are their own color - don't need color prefix
                    const materialColors = ['leather', 'hide', 'fur', 'straw', 'iron', 'steel', 'bronze', 'copper', 
                                           'brass', 'gold', 'silver', 'wood', 'oak', 'pine', 'bamboo'];
                    
                    // Check if item has a material that is its own color
                    const material = (item.material || '').toLowerCase();
                    const hasMaterialColor = materialColors.some(mat => material.includes(mat));
                    
                    if (!hasMaterialColor) {
                        // Look for color in the name
                        const nameLower = item.name.toLowerCase();
                        for (const color of colorWords) {
                            if (nameLower.includes(color)) {
                                // Extract the color word with proper capitalization
                                const colorIndex = nameLower.indexOf(color);
                                const extractedColor = item.name.substring(colorIndex, colorIndex + color.length);
                                return (
                                    <div className="flex items-center gap-1">
                                        <span className="text-slate-500">Color:</span>
                                        <span className="capitalize">{extractedColor}</span>
                                    </div>
                                );
                            }
                        }
                    }
                    return null;
                })()}
                {item.value !== undefined && (
                    <div className="flex items-center gap-1">
                        <span className="text-slate-500">Value:</span>
                        <span className="text-yellow-400">{item.value} 🪙</span>
                    </div>
                )}
                {item.weight !== undefined && (
                    <div className="flex items-center gap-1">
                        <span className="text-slate-500">Weight:</span>
                        <span>{item.weight} kg</span>
                    </div>
                )}
                {item.throwable && (
                    <div className="flex items-center gap-1">
                        <span className="text-slate-500">Throwable:</span>
                        <span className="text-green-400">✓</span>
                    </div>
                )}
            </div>
            
            {/* Description */}
            {item.description && (
                <p className="text-[11px] text-slate-400 italic mb-3 border-t border-slate-700 pt-2">
                    {item.description}
                </p>
            )}
            
            {/* Stat changes */}
            {comparison && (
                <div className="space-y-1 font-mono border-t border-slate-700 pt-2">
                    <StatChange label="Attack" value={comparison.attack} />
                    <StatChange label="Defense" value={comparison.defense} />
                </div>
            )}
        </div>
    );
};

const EquipmentSlotDisplay: React.FC<{
    slot: EquipmentSlot;
    item: Item | undefined;
    icon: string;
    onUnequip: (slot: EquipmentSlot) => void;
    onHover: (item: Item | null, action: 'unequip') => void;
    onMouseMove?: (e: React.MouseEvent) => void;
}> = ({ slot, item, icon, onUnequip, onHover, onMouseMove }) => {
    return (
        <div 
            className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-1 text-center transition-colors
            ${item ? 'border-slate-500 bg-slate-800/30 hover:border-blue-400' : 'border-slate-700'}`}
            onMouseMove={onMouseMove}
        >
            {item ? (
                <div 
                    className="w-full h-full flex flex-col items-center justify-center cursor-pointer" 
                    onClick={() => onUnequip(slot)}
                    onMouseEnter={() => onHover(item, 'unequip')}
                    onMouseLeave={() => onHover(null, 'unequip')}
                    title=""
                >
                    <div className="w-10 h-10 flex items-center justify-center filter drop-shadow-lg">
                       <GenerativeItemIcon item={item} size={40} />
                    </div>
                    <p className="text-[10px] leading-tight text-white truncate w-full">{item.name}</p>
                </div>
            ) : (
                <div className="grayscale opacity-50">
                    <span className="text-3xl">{icon}</span>
                    <p className="text-xs text-slate-400 capitalize">{slot.replace('_', ' ')}</p>
                </div>
            )}
        </div>
    );
};

interface EquipmentPanelProps {
    character: PlayerCharacter;
    onEquipItem: (item: Item) => void;
    onUnequipItem: (slot: EquipmentSlot) => void;
}

const EquipmentPanel: React.FC<EquipmentPanelProps> = ({ character, onEquipItem, onUnequipItem }) => {
    const [tooltip, setTooltip] = useState<{ item: Item; action: 'equip' | 'unequip' } | null>(null);
    const [comparisonStats, setComparisonStats] = useState<{ attack: number; defense: number } | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Helper to format item names with colors
    const formatItemWithColor = (item: Item | undefined, colorHex?: string): string => {
        if (!item) return '';
        
        // Extended color list including "navy" and more specific colors
        const colorWords = ['navy', 'red', 'blue', 'green', 'yellow', 'purple', 'black', 'white', 'gold', 'silver', 
                           'royal blue', 'cobalt', 'indigo', 'crimson', 'scarlet', 'emerald', 'amber', 'bronze',
                           'copper', 'ivory', 'ebony', 'maroon', 'olive', 'teal', 'turquoise', 'coral', 'rose'];
        let colorPrefix = '';
        
        // Check if color is already in the name
        for (const color of colorWords) {
            if (item.name.toLowerCase().includes(color)) {
                // Color already in name, return as-is
                return item.name;
            }
        }
        
        // If no color in name but we have a palette color, use it
        if (!colorPrefix && colorHex) {
            const hexToColor: Record<string, string> = {
                '#000080': 'Navy',
                '#0000ff': 'Blue',
                '#ff0000': 'Red', 
                '#00ff00': 'Green',
                '#ffff00': 'Yellow',
                '#800080': 'Purple',
                '#ffa500': 'Orange',
                '#964B00': 'Brown',
                '#000000': 'Black',
                '#ffffff': 'White',
                '#ffd700': 'Gold',
                '#c0c0c0': 'Silver',
                '#dc143c': 'Crimson',
                '#008080': 'Teal',
                '#40e0d0': 'Turquoise',
                '#ff7f50': 'Coral'
            };
            
            const matchedColor = Object.entries(hexToColor).find(([hex]) => 
                hex.toLowerCase() === colorHex?.toLowerCase()
            );
            
            if (matchedColor) {
                colorPrefix = matchedColor[1] + ' ';
            }
        }
        
        return colorPrefix + item.name;
    };

    // Get equipment item for a slot - only from equippedItems, not appearance
    const getEquipmentItem = (slot: EquipmentSlot): Item | undefined => {
        // Only check equippedItems to avoid duplicates
        return character.equippedItems[slot];
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleItemHover = (item: Item | null, action: 'equip' | 'unequip') => {
        if (!item) {
            setTooltip(null);
            setComparisonStats(null);
            return;
        }

        setTooltip({ item, action });

        const newItemStats = getProceduralItemStats(item);

        if (action === 'unequip') {
            setComparisonStats({ attack: -newItemStats.attack, defense: -newItemStats.defense });
        } else { // 'equip'
            const targetSlot = newItemStats.equipmentSlot;
            const currentItem = targetSlot ? getEquipmentItem(targetSlot) : null;
            const currentItemStats = currentItem ? getProceduralItemStats(currentItem) : { attack: 0, defense: 0 };
            
            setComparisonStats({
                attack: newItemStats.attack - currentItemStats.attack,
                defense: newItemStats.defense - currentItemStats.defense,
            });
        }
    };
    
    const equippableInventory = character.inventory.filter(i => i.wearable || i.wieldable);

    return (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 h-full" onMouseMove={handleMouseMove}>
            {/* Left side: Ragdoll */}
            <div className="grid grid-cols-3 gap-3" style={{gridTemplateRows: 'repeat(4, 1fr)'}}>
                <EquipmentSlotDisplay slot="ring1" icon="💍" item={getEquipmentItem('ring1')} onUnequip={onUnequipItem} onHover={handleItemHover} onMouseMove={handleMouseMove} />
                <EquipmentSlotDisplay slot="head" icon="👑" item={getEquipmentItem('head')} onUnequip={onUnequipItem} onHover={handleItemHover} onMouseMove={handleMouseMove} />
                <EquipmentSlotDisplay slot="ring2" icon="💍" item={getEquipmentItem('ring2')} onUnequip={onUnequipItem} onHover={handleItemHover} onMouseMove={handleMouseMove} />
                
                <EquipmentSlotDisplay slot="amulet" icon="📿" item={getEquipmentItem('amulet')} onUnequip={onUnequipItem} onHover={handleItemHover} onMouseMove={handleMouseMove} />
                <EquipmentSlotDisplay slot="torso" icon="👕" item={getEquipmentItem('torso')} onUnequip={onUnequipItem} onHover={handleItemHover} onMouseMove={handleMouseMove} />
                <EquipmentSlotDisplay slot="cloak" icon="🧥" item={getEquipmentItem('cloak')} onUnequip={onUnequipItem} onHover={handleItemHover} onMouseMove={handleMouseMove} />
                
                <EquipmentSlotDisplay slot="main_hand" icon="⚔️" item={getEquipmentItem('main_hand')} onUnequip={onUnequipItem} onHover={handleItemHover} onMouseMove={handleMouseMove} />
                <EquipmentSlotDisplay slot="legs" icon="👖" item={getEquipmentItem('legs')} onUnequip={onUnequipItem} onHover={handleItemHover} onMouseMove={handleMouseMove} />
                <EquipmentSlotDisplay slot="off_hand" icon="🛡️" item={getEquipmentItem('off_hand')} onUnequip={onUnequipItem} onHover={handleItemHover} onMouseMove={handleMouseMove} />

                <EquipmentSlotDisplay slot="belt" icon="🎗️" item={getEquipmentItem('belt')} onUnequip={onUnequipItem} onHover={handleItemHover} onMouseMove={handleMouseMove} />
                <EquipmentSlotDisplay slot="feet" icon="👢" item={getEquipmentItem('feet')} onUnequip={onUnequipItem} onHover={handleItemHover} onMouseMove={handleMouseMove} />
                <div />
            </div>

            {/* Right side: Inventory & Stats */}
            <div className="flex flex-col gap-4">
                <div className="flex-grow flex flex-col bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 min-h-0">
                    <h4 className="font-semibold text-lg text-green-300 mb-2 shrink-0 px-1">Equippable Items</h4>
                    <div className="flex-1 overflow-y-auto scrollbar-thin pr-2 space-y-2 max-h-[280px]">
                        {equippableInventory.map(item => (
                            <div 
                                key={item.id}
                                className="flex items-center justify-between p-2 rounded-md bg-slate-900/50 hover:bg-slate-700/50 cursor-pointer"
                                onMouseEnter={() => handleItemHover(item, 'equip')}
                                onMouseLeave={() => handleItemHover(null, 'equip')}
                                onClick={() => onEquipItem(item)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 flex items-center justify-center">
                                       <GenerativeItemIcon item={item} size={32} />
                                    </div>
                                    <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                                </div>
                                <RarityTag rarity={item.rarity} />
                            </div>
                        ))}
                         {equippableInventory.length === 0 && (
                            <p className="text-center text-slate-500 italic py-8 text-sm">No equippable items in inventory.</p>
                        )}
                    </div>
                </div>
                <ItemStatsPanel character={character} comparisonStats={comparisonStats} />
            </div>
            
            {tooltip && <StatComparisonTooltip item={tooltip.item} action={tooltip.action} comparison={comparisonStats} position={mousePos} />}
        </div>
    );
};

export default EquipmentPanel;