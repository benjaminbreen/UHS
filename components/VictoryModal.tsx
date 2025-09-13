import React, { useEffect } from 'react';
import { Item, EncounterableEntity, isNpc } from '../types';
import gameSoundsService from '../services/gameSoundsService';

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
  // Play appropriate music based on opponent type
  useEffect(() => {
    if (isNpc(opponent)) {
      // Play dark danger music for NPC defeats
      gameSoundsService.playDangerMusic();
    } else {
      // Play FF6 battle music for animal defeats
      gameSoundsService.playIntenseBattleMusic();
    }
    
    // Cleanup: stop all music when modal closes
    return () => {
      gameSoundsService.stopIntenseBattleMusic();
      gameSoundsService.stopDangerMusic();
    };
  }, [opponent]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="ff-panel w-full max-w-2xl p-6" 
        onClick={(e) => e.stopPropagation()}
      >
        {isNpc(opponent) ? (
          // Somber header for NPC defeats
          <>
            <h3 className="text-center text-3xl font-press-start mb-4 text-red-400">
              💀 WHAT HAVE YOU DONE? 💀
            </h3>
            
            <div className="text-6xl text-center my-8 grayscale">{opponentEmoji}</div>
            
            <div className="text-center mb-8 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-lg mb-4 text-red-300">
                You just killed <strong className="text-red-400">{opponentName}</strong> - a human being.
              </p>
              <p className="text-base mb-3 text-slate-300">
                You have committed a grave act of evil, and your life will be forever altered by this disastrous and tragic event.
              </p>
              <p className="text-base text-orange-300 font-semibold">
                You had best watch your back going forward...
              </p>
            </div>
          </>
        ) : (
          // Celebratory header for animal defeats
          <>
            <h3 className="text-center text-4xl font-press-start mb-4 text-yellow-400">
              🎉 VICTORY! 🎉
            </h3>
            
            <div className="text-6xl text-center my-8">{opponentEmoji}</div>
            
            <p className="text-center text-lg mb-8">
              You have successfully defeated <strong className="text-yellow-400">{opponentName}</strong>!
            </p>
          </>
        )}

        <div className={`p-4 bg-black/20 rounded-lg border mb-8 space-y-4 ${
          isNpc(opponent) 
            ? 'border-red-500/30' 
            : 'border-blue-500/30'
        }`}>
          <div className="flex justify-between items-baseline text-lg font-semibold">
            <span className={`flex items-center gap-2 ${
              isNpc(opponent) 
                ? 'text-red-400' 
                : 'text-green-400'
            }`}>
              {isNpc(opponent) ? '🩸' : '🌟'} Experience Gained
            </span>
            <span className={`font-press-start text-xl ${
              isNpc(opponent) 
                ? 'text-red-400' 
                : 'text-yellow-400'
            }`}>
              +{xpGained} XP
            </span>
          </div>

          {isNpc(opponent) ? (
              <p className="text-sm text-red-400 italic text-center pt-2">
                If you must, you may now search the corpse...
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
          className={`w-52 mx-auto block ${
            isNpc(opponent)
              ? 'bg-red-700 hover:bg-red-600 text-white border-red-500 font-press-start text-sm py-3 px-6 rounded border-2 transition-colors'
              : 'ff-action-button'
          }`}
          onClick={onClose}
        >
          {isNpc(opponent) ? 'Carry This Burden...' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default VictoryModal;
