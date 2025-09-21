/**
 * ButcherConfirmModal.tsx
 * Modal for confirming butchering of companion animals
 */

import React from 'react';
import { TamedAnimal } from '../services/animalTamingService';

interface ButcherConfirmModalProps {
  isOpen: boolean;
  animals: TamedAnimal[];
  onConfirm: () => void;
  onCancel: () => void;
}

const ButcherConfirmModal: React.FC<ButcherConfirmModalProps> = ({
  isOpen,
  animals,
  onConfirm,
  onCancel
}) => {
  if (!isOpen || animals.length === 0) return null;

  const isMultiple = animals.length > 1;
  const animalNames = animals.map(animal => animal.name || animal.speciesName);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-gradient-to-br from-red-900/95 to-red-800/98 border border-red-600/50 rounded-2xl shadow-2xl max-w-md w-full mx-auto transform animate-in fade-in-0 zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-red-600/30">
          <div className="flex items-center gap-3">
            <div className="text-3xl">⚠️</div>
            <div>
              <h2 className="text-xl font-bold text-red-100">
                Confirm Butchering
              </h2>
              <p className="text-sm text-red-200">
                This action cannot be undone
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-red-800/30 rounded-lg p-4 border border-red-600/30 mb-4">
            <p className="text-red-100 text-sm leading-relaxed">
              {isMultiple ? (
                <>
                  Are you sure you want to butcher these animals: <strong>{animalNames.join(', ')}</strong>?
                  These animals are your companions!
                </>
              ) : (
                <>
                  Are you sure you want to butcher <strong>{animalNames[0]}</strong>?
                  This animal is your companion!
                </>
              )}
            </p>
          </div>

          {/* Animal List */}
          <div className="space-y-2 mb-4">
            {animals.map((animal) => (
              <div key={animal.id} className="flex items-center gap-3 bg-red-900/20 rounded-lg p-3 border border-red-700/30">
                <div className="text-xl">{animal.emoji}</div>
                <div className="flex-1">
                  <p className="text-red-100 font-medium">
                    {animal.name || animal.speciesName}
                  </p>
                  <p className="text-red-300 text-xs">
                    Loyalty: {animal.loyalty}% • Value: {animal.value} coins
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-900/20 rounded-lg p-3 border border-amber-600/30">
            <p className="text-amber-200 text-xs">
              💡 Consider selling or releasing these companions instead of butchering them.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-red-600/30">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
          >
            Butcher {isMultiple ? 'Animals' : 'Animal'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ButcherConfirmModal;