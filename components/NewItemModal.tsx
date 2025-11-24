import React, { useEffect } from 'react';
import { Item } from '../types';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';
import { getSafariOptimizedClassName } from '../utils/safariUtils';

interface NewItemModalProps {
    item: Item;
    onClose: () => void;
    mode?: 'acquired' | 'dropped' | 'npc_collected' | 'animal_collected';
    entityName?: string;
}

const NewItemModal: React.FC<NewItemModalProps> = ({ item, onClose, mode = 'acquired', entityName }) => {
    // Auto-dismiss after 10 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 10000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const isDropped = mode === 'dropped';
    const isNpcCollected = mode === 'npc_collected';
    const isAnimalCollected = mode === 'animal_collected';

    const labelText = isDropped ? 'ITEM DROPPED' :
                      isNpcCollected ? `${entityName?.toUpperCase()} COLLECTED` :
                      isAnimalCollected ? `${entityName?.toUpperCase()} ATE` :
                      'ITEM ACQUIRED';

    const labelColor = isDropped ? 'text-red-400' :
                       (isNpcCollected || isAnimalCollected) ? 'text-blue-400' :
                       'text-amber-300';

    const borderColor = isDropped ? 'border-red-400/50' :
                        (isNpcCollected || isAnimalCollected) ? 'border-blue-400/50' :
                        'border-amber-400/50';

    const shadowClass = isDropped ? 'shadow-glow-red' :
                        (isNpcCollected || isAnimalCollected) ? 'shadow-glow-blue' :
                        'shadow-glow-amber';

    return (
        <div
            className={getSafariOptimizedClassName(`fixed bottom-0 left-0 right-0 h-[200px] bg-slate-900/95 z-50 animate-panelSlideUp flex items-center justify-center p-4 border-t-2 ${borderColor} ${shadowClass}`)}
            onClick={onClose}
        >
            <div className="flex items-center gap-6 text-white text-center">
                <div className="w-16 h-16 animate-jump flex items-center justify-center">
                    <GenerativeItemIcon item={item} size={64} />
                </div>
                <div className="text-left">
                    <p className={`text-xs ${labelColor} font-semibold`}>{labelText}</p>
                    <h3 className="text-xl font-bold">{item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}</h3>
                    <p className="text-sm text-slate-300 italic mt-1">"{item.description}"</p>
                </div>
            </div>
        </div>
    );
};

export default NewItemModal;
