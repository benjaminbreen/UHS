/**
 * components/EatingResultModal.tsx - Modal for eating items and displaying results
 */
import React, { useState } from 'react';
import { Item } from '../types';
import { EatingResult } from '../types/eatingTypes';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';

interface EatingResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: Item;
    onExecuteEating: () => Promise<EatingResult | null>;
}

const EatingResultModal: React.FC<EatingResultModalProps> = ({ isOpen, onClose, item, onExecuteEating }) => {
    const [result, setResult] = useState<EatingResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        setIsLoading(true);
        const eatingResult = await onExecuteEating();
        setResult(eatingResult);
        setIsLoading(false);
    };

    const handleClose = () => {
        setResult(null);
        onClose();
    };

    if (!isOpen) return null;

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-400 mb-4"></div>
                    <p className="text-green-300">Consuming {item.name}...</p>
                </div>
            );
        }

        if (result) {
            return (
                <div className="text-center">
                    <p className={`text-lg mb-4 ${result.wasEdible ? 'text-green-400' : 'text-orange-400'}`}>
                        {result.wasEdible ? 'Consumed!' : 'That was unpleasant...'}
                    </p>

                    {/* Description */}
                    <p className="text-text-secondary italic mb-6">"{result.description}"</p>

                    {/* Effects Display */}
                    <div className="surface-muted rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-blue-300 mb-3">Effects:</h4>

                        <div className="space-y-2 text-sm">
                            {/* Health Change */}
                            <div className="flex items-center justify-between">
                                <span className="text-text-muted">Health:</span>
                                <span className={`font-bold ${result.healthChange > 0 ? 'text-green-400' : result.healthChange < 0 ? 'text-red-400' : 'text-text-muted'}`}>
                                    {result.healthChange > 0 ? '+' : ''}{result.healthChange} ❤️
                                </span>
                            </div>

                            {/* Fatigue Change */}
                            <div className="flex items-center justify-between">
                                <span className="text-text-muted">Fatigue:</span>
                                <span className={`font-bold ${result.fatigueChange > 0 ? 'text-green-400' : result.fatigueChange < 0 ? 'text-red-400' : 'text-text-muted'}`}>
                                    {result.fatigueChange > 0 ? '+' : ''}{result.fatigueChange} ⚡
                                </span>
                            </div>

                            {/* XP Gained */}
                            <div className="flex items-center justify-between border-t border-surface-muted pt-2 mt-2">
                                <span className="text-text-muted">Experience:</span>
                                <span className="font-bold text-amber-400">+1 ✨</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="text-center">
                {/* Item Display */}
                <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 flex items-center justify-center mb-3">
                        <GenerativeItemIcon item={item} size={96} />
                    </div>
                    <p className="text-xl font-semibold text-text-primary mb-2">{item.name}</p>
                    {item.description && (
                        <p className="text-sm text-text-muted italic max-w-md">{item.description}</p>
                    )}
                </div>

                {/* Confirmation Message */}
                <div className="surface-muted rounded-lg p-4 mb-4">
                    <p className="text-text-secondary">
                        Are you sure you want to eat this {item.emoji}?
                    </p>
                    {item.category !== 'Food' && (
                        <p className="text-orange-400 text-sm mt-2">
                            ⚠️ Warning: This doesn't appear to be food!
                        </p>
                    )}
                </div>
            </div>
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
                <h3 className="text-center text-2xl font-press-start mb-6 text-green-400">
                    {result ? 'Eating Result' : `Eat Item`}
                </h3>
                {renderContent()}
                <div className="flex justify-end mt-8 gap-4">
                    {result ? (
                        <button onClick={handleClose} className="ff-action-button">Close</button>
                    ) : (
                        <>
                            <button onClick={handleClose} className="ff-action-button">Cancel</button>
                            <button onClick={handleConfirm} className="ff-action-button bg-green-600 hover:bg-green-700" disabled={isLoading}>
                                {isLoading ? 'Eating...' : 'Eat 🍽️'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EatingResultModal;
