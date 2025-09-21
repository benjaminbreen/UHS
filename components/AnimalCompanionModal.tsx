/**
 * Animal Companion Modal Component
 * Allows users to view and name their tamed animals
 */

import React, { useState } from 'react';
import { TamedAnimal } from '../services/animalTamingService';
import { ANIMAL_DATA } from '../constants/index';

interface AnimalCompanionModalProps {
  animal: TamedAnimal;
  isOpen: boolean;
  onClose: () => void;
  onUpdateName: (animalId: string, newName: string) => void;
}

const AnimalCompanionModal: React.FC<AnimalCompanionModalProps> = ({
  animal,
  isOpen,
  onClose,
  onUpdateName
}) => {
  const [isNaming, setIsNaming] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [currentDisplayName, setCurrentDisplayName] = useState(animal.name || animal.speciesName);

  if (!isOpen) return null;

  const animalData = ANIMAL_DATA[animal.baseId];

  // Update current display name when animal prop changes
  React.useEffect(() => {
    setCurrentDisplayName(animal.name || animal.speciesName);
  }, [animal.name, animal.speciesName]);
  
  const handleNameSubmit = () => {
    if (nameInput.trim()) {
      onUpdateName(animal.id, nameInput.trim());
      setCurrentDisplayName(nameInput.trim()); // Update display immediately
      setIsNaming(false);
      setNameInput('');
    }
  };

  const handleCancelNaming = () => {
    setIsNaming(false);
    setNameInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      handleCancelNaming();
    }
  };

  const getLoyaltyColor = (loyalty: number): string => {
    if (loyalty >= 80) return 'text-green-400';
    if (loyalty >= 60) return 'text-yellow-400';
    if (loyalty >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getLoyaltyDescription = (loyalty: number): string => {
    if (loyalty >= 90) return 'Devoted';
    if (loyalty >= 80) return 'Very Loyal';
    if (loyalty >= 70) return 'Loyal';
    if (loyalty >= 60) return 'Friendly';
    if (loyalty >= 50) return 'Neutral';
    if (loyalty >= 40) return 'Wary';
    if (loyalty >= 30) return 'Distrustful';
    return 'Hostile';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-gradient-to-br from-slate-800/95 to-slate-900/98 border border-slate-600/50 rounded-2xl shadow-2xl max-w-md w-full mx-auto transform animate-in fade-in-0 zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600/50">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{animal.emoji}</div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isNaming ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={currentDisplayName}
                      className="bg-slate-700/80 border border-slate-500 rounded px-2 py-1 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                      maxLength={20}
                      autoFocus
                    />
                  </div>
                ) : (
                  currentDisplayName
                )}
              </h2>
              <p className="text-sm text-slate-300">
                {animalData?.type || 'Unknown'} • {animal.speciesName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/30">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Health</div>
              <div className="text-lg font-semibold text-white">
                {animal.health}/{animalData?.maxHealth || 10}
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full mt-2">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-green-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (animal.health / (animalData?.maxHealth || 10)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-amber-900/20 rounded-lg p-3 border border-amber-600/30">
              <div className="text-xs text-amber-400 uppercase tracking-wider mb-1">Loyalty</div>
              <div className={`text-lg font-semibold ${getLoyaltyColor(animal.loyalty)}`}>
                {animal.loyalty}%
              </div>
              <div className="text-xs text-amber-300 mt-1">
                {getLoyaltyDescription(animal.loyalty)}
              </div>
            </div>
          </div>

          {/* Value and Taming Info */}
          <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-600/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-300 text-sm">Market Value</span>
              <span className="text-yellow-400 font-semibold">{animal.value} coins</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-300 text-sm">Owner</span>
              <span className="text-white font-medium">{animal.owner}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Tamed</span>
              <span className="text-slate-400 text-sm">
                {animal.tamingDate.month}/{animal.tamingDate.day}/{animal.tamingDate.year}
              </span>
            </div>
          </div>

          {/* Description */}
          {animalData?.description && (
            <div className="bg-blue-900/10 rounded-lg p-4 border border-blue-600/20">
              <div className="text-xs text-blue-400 uppercase tracking-wider mb-2">About This Species</div>
              <p className="text-slate-300 text-sm leading-relaxed">
                {animalData.description}
              </p>
            </div>
          )}

          {/* Behavioral Notes */}
          <div className="bg-purple-900/10 rounded-lg p-4 border border-purple-600/20">
            <div className="text-xs text-purple-400 uppercase tracking-wider mb-2">Companion Notes</div>
            <p className="text-slate-300 text-sm leading-relaxed">
              {animalData?.type === 'Domestic' ? 
                `This ${animal.speciesName} is well-suited for companionship and follows you loyally. It may provide useful services during your travels.` :
                animalData?.type === 'Predator' ?
                `This ${animal.speciesName} is a dangerous but valuable ally. It can help in combat but requires careful handling.` :
                `This ${animal.speciesName} is an unusual companion. Its wild nature makes it unpredictable but potentially very useful.`
              }
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-600/50">
          {isNaming ? (
            <>
              <button
                onClick={handleNameSubmit}
                disabled={!nameInput.trim()}
                className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-500 disabled:bg-green-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Save Name
              </button>
              <button
                onClick={handleCancelNaming}
                className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setIsNaming(true);
                  setNameInput(currentDisplayName || '');
                }}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
              >
                {currentDisplayName !== animal.speciesName ? 'Rename' : 'Name'} Companion
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnimalCompanionModal;