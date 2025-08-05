/**
 * components/interiorMap/InteractionModal.tsx - Modal for displaying container contents.
 */
import React, { useState } from 'react';
import { Item } from '../../types';

interface InteractionModalProps {
  title: string;
  items: Item[] | null;
  isLoading: boolean;
  onClose: () => void;
  onTakeItem: (item: Item) => void;
}

const InteractionModal: React.FC<InteractionModalProps> = ({ title, items, isLoading, onClose, onTakeItem }) => {
  const [takingItemId, setTakingItemId] = useState<string | null>(null);

  const handleTake = (item: Item) => {
    setTakingItemId(item.id);
    setTimeout(() => {
        onTakeItem(item);
        setTakingItemId(null);
    }, 300); // Animation duration
  };

  return (
    <div 
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 animate-modalFadeIn" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="interaction-modal-title"
    >
      <div 
        className="flex flex-col w-full max-w-md p-6 text-left bg-gray-800 border border-gray-600 rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
        style={{ minHeight: '200px' }}
      >
        <h3 id="interaction-modal-title" className="pb-2 mb-4 text-xl font-semibold text-blue-300 capitalize border-b border-gray-700">
          {title}
        </h3>
        <div className="flex-grow">
            {isLoading ? (
                <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 border-b-2 border-blue-400 rounded-full animate-spin"></div>
                </div>
            ) : (
                <ul className="space-y-2 text-gray-300">
                    {items && items.length > 0 ? (
                        items.map((item) => (
                          <li key={item.id} className={`flex items-center justify-between p-2 transition-all duration-300 rounded-md bg-gray-700/50 ${takingItemId === item.id ? 'opacity-0 -translate-x-full' : ''}`}>
                            <div>
                                <span className="mr-2 text-lg">{item.emoji}</span>
                                <span>{item.name}</span>
                            </div>
                            <div className="space-x-2">
                                <button onClick={() => handleTake(item)} className="px-2 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700">Take</button>
                                <button className="px-2 py-1 text-xs text-white bg-gray-500 rounded hover:bg-gray-600">Leave</button>
                            </div>
                          </li>
                        ))
                    ) : (
                        <li>It appears to be empty.</li>
                    )}
                </ul>
            )}
        </div>
        <div className="flex justify-end mt-6">
             <button 
                className="px-5 py-2 text-sm font-semibold text-white transition duration-150 bg-gray-600 rounded-md hover:bg-gray-500"
                onClick={onClose}
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default InteractionModal;
