import React, { useState } from 'react';
import { Item, CraftingResult } from '../types';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';

interface CraftingModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: Item[];
    method: 'COMBINE' | 'DISAGGREGATE';
    onExecuteCrafting: (intent: string) => Promise<CraftingResult | null>;
}

const CraftingModal: React.FC<CraftingModalProps> = ({ isOpen, onClose, items, method, onExecuteCrafting }) => {
    const [intent, setIntent] = useState('');
    const [result, setResult] = useState<CraftingResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        setIsLoading(true);
        const craftResult = await onExecuteCrafting(intent);
        setResult(craftResult);
        setIsLoading(false);
    };
    
    const handleClose = () => {
        setResult(null);
        setIntent('');
        onClose();
    };

    if (!isOpen) return null;
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400 mb-4"></div>
                    <p className="text-amber-300">The arcane energies of creation swirl...</p>
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
                <div className="flex flex-wrap justify-center gap-4 mb-6">
                    {items.map(item => (
                        <div key={item.id} className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 flex items-center justify-center"><GenerativeItemIcon item={item} size={64} /></div>
                            <p className="text-xs text-slate-300 w-20 truncate">{item.name} {item.quantity > 1 ? `x${item.quantity}` : ''}</p>
                        </div>
                    ))}
                </div>
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
        <div className="modal-overlay" onClick={handleClose}>
            <div className="ff-panel w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
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
