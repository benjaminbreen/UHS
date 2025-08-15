import React, { useState } from 'react';
import { Item, ItemQuality } from '../types';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';

interface InventoryPanelProps {
    inventory: Item[];
    onCraft: (items: Item[], method: 'COMBINE' | 'DISAGGREGATE') => void;
}

// Helper function to get quality color
const getQualityColor = (quality?: ItemQuality): string => {
    switch (quality) {
        case 'excellent':
            return 'text-purple-400 border-purple-400/50 bg-purple-900/20';
        case 'good':
            return 'text-blue-400 border-blue-400/50 bg-blue-900/20';
        case 'standard':
            return 'text-gray-400 border-gray-400/50 bg-gray-900/20';
        case 'poor':
            return 'text-orange-400 border-orange-400/50 bg-orange-900/20';
        default:
            return '';
    }
};

// Helper to get quality label
const getQualityLabel = (quality?: ItemQuality): string => {
    switch (quality) {
        case 'excellent':
            return '★★★';
        case 'good':
            return '★★';
        case 'standard':
            return '★';
        case 'poor':
            return '◇';
        default:
            return '';
    }
};

const InventoryPanel: React.FC<InventoryPanelProps> = ({ inventory, onCraft }) => {
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  const handleItemClick = (item: Item) => {
      setSelectedItemIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(item.id)) {
              newSet.delete(item.id);
          } else {
              newSet.add(item.id);
          }
          return newSet;
      });
  };
  
  const handleCraft = (method: 'COMBINE' | 'DISAGGREGATE') => {
      const selectedItems = inventory.filter(item => selectedItemIds.has(item.id));
      onCraft(selectedItems, method);
      setSelectedItemIds(new Set());
  };

  const canCombine = selectedItemIds.size >= 2;
  const canDisaggregate = selectedItemIds.size === 1;

  if (inventory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-slate-800/60 border border-slate-600/50 rounded-xl">
        <div className="mb-4 text-6xl opacity-50">🎒</div>
        <p className="mb-2 text-lg font-semibold">Inventory is Empty</p>
        <p className="text-sm opacity-75 text-center max-w-xs">Forage, trade, or explore to discover items and equipment.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-800/60 border border-slate-600/50 rounded-xl shadow-lg">
      <div className="flex-shrink-0 p-4 border-b border-slate-600/50 bg-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎒</span>
            <span className="font-semibold text-gray-200 text-lg">Inventory</span>
          </div>
          <span className="px-3 py-1 text-sm font-bold text-blue-100 bg-blue-600/80 rounded-full shadow-sm">
            {inventory.length}
          </span>
        </div>
      </div>
      <div className="flex-1 min-h-0 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50">
        <div className="space-y-3">
          {inventory.map(item => (
            <div 
              key={item.id} 
              className={`flex items-center gap-3 p-3 transition-all duration-200 border rounded-xl cursor-pointer group hover:bg-slate-700/70 hover:scale-[1.02] hover:shadow-lg
              ${selectedItemIds.has(item.id) ? 'bg-blue-800/50 border-blue-500 ring-2 ring-blue-400/50' : 'bg-slate-700/50 border-slate-600/30'}`}
              title={item.description}
              onClick={() => handleItemClick(item)}
            >
              <div className="relative flex-shrink-0 w-12 h-12 flex items-center justify-center">
                <GenerativeItemIcon item={item} size={48} />
                {item.stackable && item.quantity > 1 && (
                  <span className="absolute flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full -bottom-1 -right-1 shadow-lg ring-2 ring-slate-800">
                    {item.quantity}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-200 transition-colors duration-150 truncate group-hover:text-white text-base">
                    {item.name}
                  </p>
                  {item.quality && (
                    <span className={`px-1.5 py-0.5 text-xs font-bold rounded-md border ${getQualityColor(item.quality)}`}>
                      {getQualityLabel(item.quality)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-400 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-shrink-0 p-3 border-t border-slate-600/50 bg-slate-800/80 flex gap-2">
          <button
              onClick={() => handleCraft('COMBINE')}
              disabled={!canCombine}
              className="ff-action-button flex-1 text-xs"
              title="Combine 2 or more selected items"
          >
              Combine
          </button>
          <button
              onClick={() => handleCraft('DISAGGREGATE')}
              disabled={!canDisaggregate}
              className="ff-action-button flex-1 text-xs"
              title="Break down 1 selected item"
          >
              Disaggregate
          </button>
      </div>
    </div>
  );
};

export default InventoryPanel;
