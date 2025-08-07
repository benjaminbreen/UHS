import React from 'react';
import { Item } from '../types';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';

interface NewItemModalProps {
    item: Item;
    onClose: () => void;
}

const NewItemModal: React.FC<NewItemModalProps> = ({ item, onClose }) => {
    return (
        <div
            className="fixed bottom-0 left-0 right-0 h-[200px] bg-slate-900/95 backdrop-blur-sm z-50 animate-panelSlideUp flex items-center justify-center p-4 border-t-2 border-amber-400/50 shadow-glow-amber"
            onClick={onClose}
        >
            <div className="flex items-center gap-6 text-white text-center">
                <div className="w-16 h-16 animate-jump flex items-center justify-center">
                    <GenerativeItemIcon item={item} size={64} />
                </div>
                <div className="text-left">
                    <p className="text-xs text-amber-300 font-semibold">ITEM ACQUIRED</p>
                    <h3 className="text-xl font-bold">{item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}</h3>
                    <p className="text-sm text-slate-300 italic mt-1">"{item.description}"</p>
                </div>
            </div>
        </div>
    );
};

export default NewItemModal;
