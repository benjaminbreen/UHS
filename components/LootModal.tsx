/**
 * components/LootModal.tsx - A modal for looting defeated NPCs.
 */
import React, { useState, useMemo, useCallback } from 'react';
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

    const handleTake = useCallback((itemToTake: Item) => {
        onTakeItem(itemToTake, opponent.id);
        setLootedItems(prev => [...prev, itemToTake]);
        setAvailableItems(prev => prev.filter(item => item.id !== itemToTake.id));
    }, [onTakeItem, opponent.id]);

    const handleTakeCoins = useCallback(() => {
        if (availableCoins > 0) {
            onTakeCoins(availableCoins, opponent.id);
            setAvailableCoins(0);
        }
    }, [availableCoins, onTakeCoins, opponent.id]);

    const handleTakeAll = useCallback(() => {
        availableItems.forEach(item => onTakeItem(item, opponent.id));
        if (availableCoins > 0) handleTakeCoins();
        setLootedItems(prev => [...prev, ...availableItems]);
        setAvailableItems([]);
    }, [availableItems, availableCoins, handleTakeCoins, onTakeItem, opponent.id]);

    const handleClose = useCallback(() => {
        onClose(lootedItems);
    }, [onClose, lootedItems]);

    const stopPropagation = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    const totalItems = availableItems.length + (availableCoins > 0 ? 1 : 0);

    return (
        <div
            data-surface="modal-overlay"
            className="modal-overlay theme-surface"
            onClick={handleClose}
        >
            <div
                data-surface="modal-panel"
                className="ff-panel theme-surface w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
                onClick={stopPropagation}
                style={{ animation: 'modal-pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-3 flex-shrink-0"
                    style={{
                        background: 'var(--bg-secondary)',
                        borderBottom: '1px solid var(--border-normal)',
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-md flex items-center justify-center text-2xl"
                            style={{
                                background: 'var(--surface-elevated-bg)',
                                border: '1px solid var(--surface-elevated-border)',
                            }}
                        >
                            {opponent.emoji}
                        </div>
                        <div>
                            <h2
                                className="text-lg font-bold m-0"
                                style={{
                                    color: 'var(--text-primary)',
                                    fontFamily: 'var(--font-narrative, Georgia, serif)',
                                }}
                            >
                                Looting {opponent.name}
                            </h2>
                            <p
                                className="text-xs m-0 truncate max-w-[280px]"
                                style={{
                                    color: 'var(--text-tertiary)',
                                    fontFamily: 'var(--font-narrative, Georgia, serif)',
                                    fontStyle: 'italic',
                                }}
                            >
                                {opponent.descriptions.short}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-[30px] h-[30px] rounded-md flex items-center justify-center text-base cursor-pointer transition-colors duration-150 hover:brightness-125"
                        style={{
                            border: '1px solid var(--border-normal)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-tertiary)',
                        }}
                        title="Finish Looting"
                    >
                        ✕
                    </button>
                </div>

                {/* Contents */}
                <div
                    className="flex-1 overflow-y-auto px-5 py-4 pr-3 scrollbar-thin"
                    style={{ background: 'var(--bg-primary)' }}
                >
                    {/* Section header */}
                    <div className="flex justify-between items-center mb-3">
                        <span
                            className="font-bold uppercase"
                            style={{
                                fontSize: '0.68rem',
                                letterSpacing: '0.12em',
                                color: 'var(--text-tertiary)',
                            }}
                        >
                            Items Found
                        </span>
                        <span
                            className="font-semibold px-2 py-0.5 rounded-full"
                            style={{
                                fontSize: '0.65rem',
                                background: totalItems > 0 ? 'var(--pill-accent-bg)' : 'var(--pill-bg)',
                                border: '1px solid',
                                borderColor: totalItems > 0 ? 'var(--pill-accent-border)' : 'var(--pill-border)',
                                color: totalItems > 0 ? 'var(--pill-accent-text)' : 'var(--text-muted)',
                            }}
                        >
                            {totalItems} {totalItems === 1 ? 'item' : 'items'}
                        </span>
                    </div>

                    {availableItems.length > 0 || availableCoins > 0 ? (
                        <div className="flex flex-col gap-1.5">
                            {/* Coins row */}
                            {availableCoins > 0 && (
                                <div
                                    className="grid items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:translate-x-0.5 hover:brightness-[1.08]"
                                    style={{
                                        gridTemplateColumns: '36px 1fr auto',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--surface-card-border)',
                                        boxShadow: 'inset 3px 0 0 var(--accent-secondary)',
                                    }}
                                >
                                    <div
                                        className="w-9 h-9 rounded-md flex items-center justify-center text-lg"
                                        style={{
                                            background: 'var(--surface-elevated-bg)',
                                            border: '1px solid var(--surface-elevated-border)',
                                        }}
                                    >
                                        🪙
                                    </div>
                                    <div className="min-w-0">
                                        <div
                                            className="text-sm font-semibold"
                                            style={{ color: 'var(--accent-secondary)' }}
                                        >
                                            {availableCoins} Coins
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleTakeCoins}
                                        className="px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-px"
                                        style={{
                                            fontSize: '0.75rem',
                                            background: 'var(--button-primary-bg)',
                                            border: '1px solid rgba(76, 146, 125, 0.55)',
                                            color: 'var(--button-primary-text)',
                                            boxShadow: '0 2px 8px rgba(12, 52, 41, 0.3)',
                                        }}
                                    >
                                        Take
                                    </button>
                                </div>
                            )}

                            {/* Item rows */}
                            {availableItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="grid items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:translate-x-0.5 hover:brightness-[1.08]"
                                    style={{
                                        gridTemplateColumns: '36px 1fr auto',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--surface-card-border)',
                                    }}
                                >
                                    <div
                                        className="w-9 h-9 rounded-md flex items-center justify-center"
                                        style={{
                                            background: 'var(--surface-elevated-bg)',
                                            border: '1px solid var(--surface-elevated-border)',
                                        }}
                                    >
                                        <GenerativeItemIcon item={item} size={28} />
                                    </div>
                                    <div className="min-w-0">
                                        <div
                                            className="text-sm font-semibold truncate"
                                            style={{ color: 'var(--text-primary)' }}
                                        >
                                            {item.name}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleTake(item)}
                                        className="px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-px"
                                        style={{
                                            fontSize: '0.75rem',
                                            background: 'var(--button-primary-bg)',
                                            border: '1px solid rgba(76, 146, 125, 0.55)',
                                            color: 'var(--button-primary-text)',
                                            boxShadow: '0 2px 8px rgba(12, 52, 41, 0.3)',
                                        }}
                                    >
                                        Take
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div
                            className="text-center py-12 text-sm"
                            style={{
                                color: 'var(--text-muted)',
                                fontFamily: 'var(--font-narrative, Georgia, serif)',
                                fontStyle: 'italic',
                            }}
                        >
                            Nothing left to take.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    className="flex items-center justify-end gap-3 px-5 py-3 flex-shrink-0"
                    style={{
                        borderTop: '1px solid var(--border-normal)',
                        background: 'var(--bg-secondary)',
                    }}
                >
                    <button
                        onClick={handleTakeAll}
                        disabled={availableItems.length === 0 && availableCoins === 0}
                        className="px-4 py-2 rounded-md text-sm font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        style={{
                            background: 'var(--button-primary-bg)',
                            border: '1px solid rgba(76, 146, 125, 0.55)',
                            color: 'var(--button-primary-text)',
                            boxShadow: '0 4px 12px rgba(12, 52, 41, 0.3)',
                        }}
                    >
                        Take All
                    </button>
                    <button
                        onClick={handleClose}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold cursor-pointer transition-all duration-150"
                        style={{
                            background: 'var(--surface-muted-bg)',
                            border: '1px solid var(--surface-muted-border)',
                            color: 'var(--text-secondary)',
                        }}
                    >
                        Finish Looting
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LootModal;
