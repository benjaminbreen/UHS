import React from 'react';
import { Item, EncounterableEntity, isNpc } from '../types';

interface VictoryModalProps {
  xpGained: number;
  itemsGained: Item[];
  onClose: () => void;
  opponentName: string;
  opponentEmoji: string;
  opponent: EncounterableEntity;
}

const VictoryModal: React.FC<VictoryModalProps> = ({ 
  xpGained, 
  itemsGained, 
  onClose, 
  opponentName, 
  opponentEmoji,
  opponent
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="ff-panel w-full max-w-2xl p-6" 
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-center text-4xl font-press-start mb-4 text-yellow-400">
          🎉 VICTORY! 🎉
        </h3>
        
        <div className="text-6xl text-center my-8">{opponentEmoji}</div>
        
        <p className="text-center text-lg mb-8">
          You have successfully defeated <strong className="text-yellow-400">{opponentName}</strong>!
        </p>

        <div className="p-4 bg-black/20 rounded-lg border border-blue-500/30 mb-8 space-y-4">
          <div className="flex justify-between items-baseline text-lg font-semibold">
            <span className="text-green-400 flex items-center gap-2">🌟 Experience Gained</span>
            <span className="text-yellow-400 font-press-start text-xl">
              +{xpGained} XP
            </span>
          </div>

          {isNpc(opponent) ? (
              <p className="text-sm text-slate-400 italic text-center pt-2">
                You may now loot the body.
              </p>
          ) : itemsGained.length > 0 ? (
            <div>
              <div className="flex justify-between items-baseline text-lg font-semibold mb-3">
                <span className="text-blue-400 flex items-center gap-2">🎁 Items Recovered</span>
                <span className="text-slate-300 text-sm">({itemsGained.length} item{itemsGained.length > 1 ? 's' : ''})</span>
              </div>
              
              <div className="max-h-40 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-blue-400/50 scrollbar-track-slate-800/50">
                {itemsGained.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-2 rounded-md bg-slate-800/50">
                    <div className="text-2xl flex-shrink-0 w-8 text-center">
                      {item.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        {item.name}
                      </div>
                      {item.description && (
                        <div className="text-xs text-slate-400 italic">
                          {item.description}
                        </div>
                      )}
                    </div>
                    {item.quantity > 1 && (
                      <div className="flex-shrink-0 text-xs font-bold bg-slate-700 text-white rounded-full px-2 py-1">
                        x{item.quantity}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic text-center pt-2">
              No items were recovered from this encounter.
            </p>
          )}
        </div>

        <button 
          className="ff-action-button w-52 mx-auto block" 
          onClick={onClose}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default VictoryModal;
