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
    if (!item || !comparison) return null;

    const StatChange: React.FC<{ label: string; value: number }> = ({ label, value }) => {
        if (value === 0) return null;
        const color = value > 0 ? 'text-green-400' : 'text-red-400';
        const sign = value > 0 ? '+' : '';
        return <div className={`flex justify-between ${color}`}><span>{label}</span><span>{sign}{value}</span></div>;
    };

    return (
        <div 
            className="fixed z-[9999] pointer-events-none p-3 max-w-xs text-xs text-white transition-opacity duration-100 bg-slate-900/90 border-2 rounded-lg shadow-2xl border-blue-400 backdrop-blur-sm animate-popIn"
            style={{ top: position.y + 20, left: position.x + 20 }}
        >
            <h4 className="font-bold text-blue-300 mb-2">{action === 'equip' ? 'Equip' : 'Unequip'}: {item.name}</h4>
            <div className="space-y-1 font-mono">
                <StatChange label="Attack" value={comparison.attack} />
                <StatChange label="Defense" value={comparison.defense} />
            </div>
        </div>
    );
};

const EquipmentSlotDisplay: React.FC<{
    slot: EquipmentSlot;
    item: Item | undefined;
    icon: string;
    onUnequip: (slot: EquipmentSlot) => void;
    onHover: (item: Item | null, action: 'unequip') => void;
}> = ({ slot, item, icon, onUnequip, onHover }) => {
    return (
        <div 
            className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-1 text-center transition-colors
            ${item ? 'border-slate-500 bg-slate-800/30 hover:border-blue-400' : 'border-slate-700'}`}
        >
            {item ? (
                <div 
                    className="w-full h-full flex flex-col items-center justify-center cursor-pointer" 
                    onClick={() => onUnequip(slot)}
                    onMouseEnter={() => onHover(item, 'unequip')}
                    onMouseLeave={() => onHover(null, 'unequip')}
                    title={`Unequip ${item.name}`}
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
            const currentItem = targetSlot ? character.equippedItems[targetSlot] : null;
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
                <EquipmentSlotDisplay slot="ring1" icon="💍" item={character.equippedItems.ring1} onUnequip={onUnequipItem} onHover={handleItemHover} />
                <EquipmentSlotDisplay slot="head" icon="👑" item={character.equippedItems.head} onUnequip={onUnequipItem} onHover={handleItemHover} />
                <EquipmentSlotDisplay slot="ring2" icon="💍" item={character.equippedItems.ring2} onUnequip={onUnequipItem} onHover={handleItemHover} />
                
                <EquipmentSlotDisplay slot="amulet" icon="📿" item={character.equippedItems.amulet} onUnequip={onUnequipItem} onHover={handleItemHover} />
                <EquipmentSlotDisplay slot="torso" icon="👕" item={character.equippedItems.torso} onUnequip={onUnequipItem} onHover={handleItemHover} />
                <EquipmentSlotDisplay slot="cloak" icon="🧥" item={character.equippedItems.cloak} onUnequip={onUnequipItem} onHover={handleItemHover} />
                
                <EquipmentSlotDisplay slot="main_hand" icon="⚔️" item={character.equippedItems.main_hand} onUnequip={onUnequipItem} onHover={handleItemHover} />
                <EquipmentSlotDisplay slot="legs" icon="👖" item={character.equippedItems.legs} onUnequip={onUnequipItem} onHover={handleItemHover} />
                <EquipmentSlotDisplay slot="off_hand" icon="🛡️" item={character.equippedItems.off_hand} onUnequip={onUnequipItem} onHover={handleItemHover} />

                <EquipmentSlotDisplay slot="belt" icon="🎗️" item={character.equippedItems.belt} onUnequip={onUnequipItem} onHover={handleItemHover} />
                <EquipmentSlotDisplay slot="feet" icon="👢" item={character.equippedItems.feet} onUnequip={onUnequipItem} onHover={handleItemHover} />
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