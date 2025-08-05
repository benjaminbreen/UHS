/**
 * components/LootModal.tsx - A modal for looting defeated NPCs.
 */
import React, { useState, useMemo } from 'react';
import { Item, NpcEntity } from '../types';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';

interface LootModalProps {
    opponent: NpcEntity;
    onClose: (lootedItems: Item[]) => void;
    onTakeItem: (item: Item, opponentId: string) => void;
    onTakeCoins: (amount: number, opponentId: string) => void;
}

const LootModal: React.FC<LootModalProps> = ({ opponent, onClose, onTakeItem, onTakeCoins }) => {
    const [lootedItems, setLootedItems] = useState<Item[]>([]);
    const [availableItems, setAvailableItems] = useState<Item[]>(() => {
        const equipped = Object.values(opponent.equippedItems || {}).filter(Boolean) as Item[];
        const inventory = opponent.inventory || [];
        return [...equipped, ...inventory];
    });
    const [availableCoins, setAvailableCoins] = useState(opponent.currency || 0);

    const handleTake = (itemToTake: Item) => {
        onTakeItem(itemToTake, opponent.id);
        setLootedItems(prev => [...prev, itemToTake]);
        setAvailableItems(prev => prev.filter(item => item.id !== itemToTake.id));
    };

    const handleTakeCoins = () => {
        if (availableCoins > 0) {
            onTakeCoins(availableCoins, opponent.id);
            setAvailableCoins(0);
        }
    };

    const handleTakeAll = () => {
        availableItems.forEach(item => onTakeItem(item, opponent.id));
        if (availableCoins > 0) handleTakeCoins();
        setLootedItems(prev => [...prev, ...availableItems]);
        setAvailableItems([]);
    };
    
    return (
        <div className="modal-overlay" onClick={() => onClose(lootedItems)}>
            <div className="ff-panel w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-center text-2xl font-press-start mb-4 text-amber-400">
                    Looting {opponent.name}
                </h3>

                <div className="my-6 text-center">
                    <span className="text-5xl">{opponent.emoji}</span>
                    <p className="text-sm text-slate-400 italic">{opponent.descriptions.short}</p>
                </div>

                <div className="p-4 bg-black/20 rounded-lg border border-blue-500/30 mb-6 min-h-[150px]">
                    <h4 className="text-lg font-semibold text-blue-300 mb-3">Items Found</h4>
                    {availableItems.length > 0 || availableCoins > 0 ? (
                        <div className="max-h-48 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                            {availableCoins > 0 && (
                                <div className="flex items-center justify-between gap-4 p-2 rounded-md bg-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🪙</span>
                                        <span className="font-semibold text-yellow-300">{availableCoins} Coins</span>
                                    </div>
                                    <button
                                        onClick={handleTakeCoins}
                                        className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500"
                                    >
                                        Take
                                    </button>
                                </div>
                            )}
                            {availableItems.map((item) => (
                                <div key={item.id} className="flex items-center justify-between gap-4 p-2 rounded-md bg-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 flex items-center justify-center">
                                           <GenerativeItemIcon item={item} size={32} />
                                        </div>
                                        <span className="font-semibold text-white">{item.name}</span>
                                    </div>
                                    <button
                                        onClick={() => handleTake(item)}
                                        className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500"
                                    >
                                        Take
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 italic text-center pt-8">Nothing left to take.</p>
                    )}
                </div>

                <div className="flex justify-between items-center gap-4">
                    <button
                        className="ff-action-button flex-1"
                        onClick={handleTakeAll}
                        disabled={availableItems.length === 0 && availableCoins === 0}
                    >
                        Take All
                    </button>
                    <button
                        className="ff-action-button flex-1"
                        onClick={() => onClose(lootedItems)}
                    >
                        Finish Looting
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LootModal;
