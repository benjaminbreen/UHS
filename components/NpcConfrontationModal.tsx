/**
 * components/NpcConfrontationModal.tsx
 * Modal for NPC confrontations when caught stealing
 */

import React, { useState } from 'react';
import { NpcEntity, Item } from '../types';
import NpcIcon from './symbols/NpcIcon';

interface NpcConfrontationModalProps {
  npc: NpcEntity;
  item: Item;
  dialogue: string;
  onClose: () => void;
  onPayFine?: (amount: number) => void;
  onFight?: () => void;
  onSurrender?: () => void;
  onTryToEscape?: () => void;
  playerGold: number;
}

const NpcConfrontationModal: React.FC<NpcConfrontationModalProps> = ({
  npc,
  item,
  dialogue,
  onClose,
  onPayFine,
  onFight,
  onSurrender,
  onTryToEscape,
  playerGold
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Calculate fine based on item value
  const fineAmount = Math.max(10, Math.floor(item.value * 2));
  const canAffordFine = playerGold >= fineAmount;
  
  const isGuard = npc.role?.toLowerCase().includes('guard');
  const isMerchant = npc.role?.toLowerCase().includes('merchant');
  
  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    
    switch (option) {
      case 'pay':
        if (canAffordFine && onPayFine) {
          onPayFine(fineAmount);
        }
        break;
      case 'fight':
        onFight?.();
        break;
      case 'surrender':
        onSurrender?.();
        break;
      case 'escape':
        onTryToEscape?.();
        break;
      case 'apologize':
        // Just close for now - could add reputation recovery later
        onClose();
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-900/95 border-2 border-red-500 rounded-lg shadow-2xl max-w-md w-full animate-slideUp">
        {/* Header */}
        <div className="bg-red-900/50 border-b border-red-700 px-6 py-4">
          <h2 className="text-xl font-bold text-red-300 flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            Confrontation!
          </h2>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* NPC Section */}
          <div className="flex items-start gap-4 mb-6">
            {/* NPC Portrait */}
            <div className="w-20 h-20 bg-gray-800 rounded-lg border-2 border-red-700 flex items-center justify-center">
              <NpcIcon 
                npc={npc}
                x={0}
                y={0}
                isSelected={false}
                isWounded={false}
                zoom={1}
              />
            </div>
            
            {/* NPC Info & Dialogue */}
            <div className="flex-1">
              <div className="text-sm text-gray-400 mb-1">
                {npc.name || 'Unknown'} • {npc.role || 'Citizen'}
              </div>
              <div className="text-white bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <p className="italic">"{dialogue}"</p>
              </div>
            </div>
          </div>
          
          {/* Item Info */}
          <div className="bg-gray-800/50 rounded-lg p-3 mb-6 border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Accused of stealing:</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{item.emoji || '📦'}</span>
              <div>
                <div className="text-white font-semibold">{item.name}</div>
                <div className="text-xs text-yellow-400">Value: {item.value} coins</div>
              </div>
            </div>
          </div>
          
          {/* Options */}
          <div className="space-y-2">
            {/* Pay Fine Option - Only for guards/merchants */}
            {(isGuard || isMerchant) && onPayFine && (
              <button
                onClick={() => handleOptionSelect('pay')}
                disabled={!canAffordFine}
                className={`
                  w-full px-4 py-3 rounded-lg text-left transition-all
                  ${canAffordFine 
                    ? 'bg-yellow-900/50 hover:bg-yellow-900/70 border border-yellow-700 text-yellow-300'
                    : 'bg-gray-800/50 border border-gray-700 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span>💰 Pay Fine</span>
                  <span className="text-sm">
                    {fineAmount} coins {!canAffordFine && '(Can\'t afford)'}
                  </span>
                </div>
              </button>
            )}
            
            {/* Return Item Option - For merchants */}
            {isMerchant && (
              <button
                onClick={() => handleOptionSelect('apologize')}
                className="w-full px-4 py-3 rounded-lg text-left bg-blue-900/50 hover:bg-blue-900/70 border border-blue-700 text-blue-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span>🙏 Apologize & Return Item</span>
                  <span className="text-sm">-5 reputation</span>
                </div>
              </button>
            )}
            
            {/* Fight Option */}
            {onFight && (
              <button
                onClick={() => handleOptionSelect('fight')}
                className="w-full px-4 py-3 rounded-lg text-left bg-red-900/50 hover:bg-red-900/70 border border-red-700 text-red-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span>⚔️ Fight</span>
                  <span className="text-sm">Very dangerous!</span>
                </div>
              </button>
            )}
            
            {/* Escape Option */}
            {onTryToEscape && (
              <button
                onClick={() => handleOptionSelect('escape')}
                className="w-full px-4 py-3 rounded-lg text-left bg-purple-900/50 hover:bg-purple-900/70 border border-purple-700 text-purple-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span>🏃 Try to Escape</span>
                  <span className="text-sm">Risky!</span>
                </div>
              </button>
            )}
            
            {/* Surrender Option - Only for guards */}
            {isGuard && onSurrender && (
              <button
                onClick={() => handleOptionSelect('surrender')}
                className="w-full px-4 py-3 rounded-lg text-left bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600 text-gray-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span>🏳️ Surrender</span>
                  <span className="text-sm">Go to jail</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NpcConfrontationModal;