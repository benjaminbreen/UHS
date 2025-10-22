import React, { useState } from 'react';
import { Item, CraftingResult } from '../types';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';

interface CraftingModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: Item[];
    playerInventory?: Item[]; // Full inventory for multi-select
    method?: 'COMBINE' | 'DISAGGREGATE'; // Made optional, will be selectable in modal
    onExecuteCrafting: (intent: string, method: 'COMBINE' | 'DISAGGREGATE', items: Item[]) => Promise<CraftingResult | null>;
}

const CraftingModal: React.FC<CraftingModalProps> = ({ isOpen, onClose, items, playerInventory, method: initialMethod, onExecuteCrafting }) => {
    const [intent, setIntent] = useState('');
    const [result, setResult] = useState<CraftingResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [method, setMethod] = useState<'COMBINE' | 'DISAGGREGATE'>(initialMethod || 'COMBINE');
    const [additionalItems, setAdditionalItems] = useState<Set<string>>(new Set());

    const handleConfirm = async () => {
        setIsLoading(true);
        // Combine initial items with additionally selected items
        const selectedAdditional = playerInventory?.filter(item => additionalItems.has(item.id)) || [];
        const allItems = [...items, ...selectedAdditional];
        const craftResult = await onExecuteCrafting(intent, method, allItems);
        setResult(craftResult);
        setIsLoading(false);
    };
    
    const handleClose = () => {
        setResult(null);
        setIntent('');
        setMethod('COMBINE'); // Reset to default
        setAdditionalItems(new Set());
        onClose();
    };

    if (!isOpen) return null;
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400 mb-4"></div>
                    <p className="text-amber-300">Doing your best to make something...</p>
                </div>
            );
        }

        if (result) {
            return (
                <div className="text-center">
                    <p className={`text-lg mb-4 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                        {result.success ? 'Success!' : 'Failure!'}
                    </p>
                    <p className="text-slate-300 italic mb-6">"{result.outcome.message}"</p>
                    {result.outcome.newItems && result.outcome.newItems.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-blue-300 mb-2">Items Created:</h4>
                            <div className="space-y-2">
                                {result.outcome.newItems.map((item, index) => (
                                    <div key={index} className="flex items-center gap-4 p-2 rounded-md bg-slate-800/50">
                                        <div className="w-10 h-10 flex items-center justify-center"><GenerativeItemIcon item={item as Item} size={40} /></div>
                                        <p className="font-semibold text-white">{item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <>
                {/* Mode Toggle */}
                <div className="flex justify-center gap-2 mb-4">
                    <button
                        onClick={() => setMethod('COMBINE')}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                            method === 'COMBINE'
                                ? 'bg-blue-600 text-white shadow-glow-primary'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        Combine Items
                    </button>
                    <button
                        onClick={() => setMethod('DISAGGREGATE')}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                            method === 'DISAGGREGATE'
                                ? 'bg-orange-600 text-white shadow-glow-orange'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                        disabled={items.length !== 1}
                        title={items.length !== 1 ? 'Select exactly one item to take apart' : ''}
                    >
                        Take Apart
                    </button>
                </div>

                <div className="flex flex-wrap justify-center gap-4 mb-6">
                    {items.map(item => (
                        <div key={item.id} className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 flex items-center justify-center"><GenerativeItemIcon item={item} size={64} /></div>
                            <p className="text-xs text-slate-300 w-20 truncate">{item.name} {item.quantity > 1 ? `x${item.quantity}` : ''}</p>
                        </div>
                    ))}
                </div>

                {/* Multi-select for combining single item */}
                {method === 'COMBINE' && items.length === 1 && playerInventory && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Select items to combine with:
                        </label>
                        <div className="max-h-48 overflow-y-auto bg-slate-800/50 rounded-lg border border-slate-600 p-2">
                            {playerInventory
                                .filter(invItem => !items.some(selectedItem => selectedItem.id === invItem.id))
                                .map(invItem => (
                                    <div
                                        key={invItem.id}
                                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                            additionalItems.has(invItem.id)
                                                ? 'bg-blue-700/40 border border-blue-400'
                                                : 'hover:bg-slate-700/50'
                                        }`}
                                        onClick={() => {
                                            const newSet = new Set(additionalItems);
                                            if (newSet.has(invItem.id)) {
                                                newSet.delete(invItem.id);
                                            } else {
                                                newSet.add(invItem.id);
                                            }
                                            setAdditionalItems(newSet);
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={additionalItems.has(invItem.id)}
                                            onChange={() => {}}
                                            className="pointer-events-none"
                                        />
                                        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                                            <GenerativeItemIcon item={invItem} size={32} />
                                        </div>
                                        <span className="text-sm text-slate-200 flex-1">{invItem.name}</span>
                                        {invItem.quantity > 1 && (
                                            <span className="text-xs text-slate-400">x{invItem.quantity}</span>
                                        )}
                                    </div>
                                ))}
                        </div>
                        {additionalItems.size > 0 && (
                            <p className="text-xs text-blue-400 mt-2">
                                {additionalItems.size} additional item{additionalItems.size !== 1 ? 's' : ''} selected
                            </p>
                        )}
                    </div>
                )}

                {method === 'COMBINE' && (
                    <div className="mb-6">
                        <label htmlFor="crafting-intent" className="block text-sm font-medium text-slate-300 mb-2">Intent (Optional):</label>
                        <input
                            id="crafting-intent"
                            type="text"
                            value={intent}
                            onChange={(e) => setIntent(e.target.value)}
                            placeholder="e.g., 'Make a sharp point on the stick'"
                            className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-md placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                    </div>
                )}
            </>
        );
    };

    return (
        <div
            data-surface="modal-overlay"
            className="modal-overlay theme-surface"
            onClick={handleClose}
        >
            <div
                data-surface="modal-panel"
                className="ff-panel theme-surface w-full max-w-lg p-6"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-center text-2xl font-press-start mb-6 text-amber-400">
                    {result ? 'Crafting Result' : `Crafting: ${method}`}
                </h3>
                {renderContent()}
                <div className="flex justify-end mt-8 gap-4">
                    {result ? (
                        <button onClick={handleClose} className="ff-action-button">Close</button>
                    ) : (
                        <>
                            <button onClick={handleClose} className="ff-action-button">Cancel</button>
                            <button onClick={handleConfirm} className="ff-action-button" disabled={isLoading}>
                                {isLoading ? 'Crafting...' : 'Confirm'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CraftingModal;
