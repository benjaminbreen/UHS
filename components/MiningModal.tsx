/**
 * components/MiningModal.tsx - Interactive modal for mining operations.
 */
import React from 'react';
import { TerrainStructure, PlayerCharacter, Item, DigSkillResult } from '../types';

interface MiningModalProps {
  structure: TerrainStructure;
  playerCharacter: PlayerCharacter;
  onClose: () => void;
  onMine: (structureId: string) => void;
  isMining: boolean;
  mineResult: DigSkillResult | null;
}

const MiningModal: React.FC<MiningModalProps> = ({ structure, playerCharacter, onClose, onMine, isMining, mineResult }) => {
  const { name, mineralDeposits } = structure;
  const oreType = Object.keys(mineralDeposits || {})[0];
  const remaining = mineralDeposits && oreType ? mineralDeposits[oreType] : 0;
  
  const hasPickaxe = playerCharacter.inventory.some(item => item.baseId === 'PICKAXE') || playerCharacter.equippedItems.main_hand?.baseId === 'PICKAXE';
  const canMine = hasPickaxe && playerCharacter.fatigue > 5 && !isMining && remaining > 0;

  const getDepositRichness = (amount: number) => {
      if (amount > 15000) return { text: 'Extremely Rich', color: 'text-green-400' };
      if (amount > 8000) return { text: 'Rich', color: 'text-green-500' };
      if (amount > 3000) return { text: 'Moderate', color: 'text-yellow-400' };
      if (amount > 500) return { text: 'Sparse', color: 'text-orange-400' };
      if (amount > 0) return { text: 'Nearly Depleted', color: 'text-red-500' };
      return { text: 'Depleted', color: 'text-gray-500' };
  };

  const richness = getDepositRichness(remaining);

  return (
    <div
      data-surface="modal-overlay"
      className="modal-overlay theme-surface"
      onClick={onClose}
    >
      <div
        data-surface="modal-panel"
        className="ff-panel theme-surface w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-blue-500/30">
            <h3 className="text-xl font-semibold text-blue-400">⛏️ {name}</h3>
            <button onClick={onClose} className="ff-action-button" style={{padding: '0.2rem 0.5rem', fontSize: '1rem'}}>&times;</button>
          </div>
          
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-gray-400">This mining colony is extracting <strong className="text-white">{oreType ? oreType.replace(/_/g, ' ') : 'Unknown Ore'}</strong>.</p>
              <p className="text-gray-400 mt-1">
                Deposit Status: <strong className={richness.color}>{richness.text}</strong> 
                <span className="text-gray-500"> ({remaining.toLocaleString()} units)</span>
              </p>
            </div>
            
            <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-300" style={{ width: `${Math.min(100, (remaining / 20000) * 100)}%` }}></div>
            </div>

            {mineResult && (
                <div className={`p-3 rounded-md text-center text-sm border transition-opacity duration-300 ${mineResult.success ? 'bg-green-900/50 border-green-700 text-green-300' : 'bg-red-900/50 border-red-700 text-red-300'}`}>
                    <p>{mineResult.message}</p>
                    {mineResult.item && <p className="font-bold mt-1">You obtained: {mineResult.item.name}!</p>}
                </div>
            )}
            
            <div className="pt-4 text-center">
              <button 
                onClick={() => onMine(structure.id)} 
                disabled={!canMine}
                className="ff-action-button w-48"
              >
                {isMining ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                ) : (
                  'Mine Ore'
                )}
              </button>
              {!hasPickaxe && <p className="text-xs text-red-400 mt-2">You need a Pickaxe to mine.</p>}
              {hasPickaxe && playerCharacter.fatigue <= 5 && <p className="text-xs text-yellow-400 mt-2">You are too fatigued to mine.</p>}
              {remaining <= 0 && <p className="text-xs text-gray-400 mt-2">This deposit has been depleted.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiningModal;
