/**
 * components/ContainerModal.tsx
 * Modal for interacting with containers in special maps
 */

import React, { useEffect } from 'react';
import { Item } from '../types';
import { OverlayObjectType } from '../types/core/tile';
import { ContainerContents } from '../services/specialMapContainerService';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';
import gameSoundsService from '../services/gameSoundsService';

interface ContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  containerType: OverlayObjectType;
  contents: ContainerContents;
  onTakeItem: (item: Item) => void;
  onTakeAll: () => void;
  containerPosition?: { x: number; y: number };
  isAnimating?: boolean;
}

const CONTAINER_NAMES: Record<string, string> = {
  [OverlayObjectType.CHEST]: 'Chest',
  [OverlayObjectType.BARREL]: 'Barrel',
  [OverlayObjectType.CRATE]: 'Crate',
  [OverlayObjectType.CABINET]: 'Cabinet',
  [OverlayObjectType.BOOKSHELF]: 'Bookshelf',
  [OverlayObjectType.FILING_CABINET]: 'Filing Cabinet',
  [OverlayObjectType.TANSU]: 'Tansu (Japanese Chest)',
  [OverlayObjectType.SPICE_CABINET]: 'Spice Cabinet',
  [OverlayObjectType.WEAPON_RACK]: 'Weapon Rack',
  [OverlayObjectType.ARMOR_STAND]: 'Armor Stand',
};

const CONTAINER_DESCRIPTIONS: Record<string, string> = {
  [OverlayObjectType.CHEST]: 'A sturdy wooden chest with iron fittings.',
  [OverlayObjectType.BARREL]: 'A large barrel, possibly containing liquids or dry goods.',
  [OverlayObjectType.CRATE]: 'A wooden shipping crate, secured with rope.',
  [OverlayObjectType.CABINET]: 'A cabinet with multiple compartments.',
  [OverlayObjectType.BOOKSHELF]: 'A shelf lined with books and scrolls.',
  [OverlayObjectType.FILING_CABINET]: 'A metal filing cabinet with organized documents.',
  [OverlayObjectType.TANSU]: 'A traditional Japanese chest of drawers.',
  [OverlayObjectType.SPICE_CABINET]: 'A cabinet filled with aromatic spices and herbs.',
  [OverlayObjectType.WEAPON_RACK]: 'A wooden rack holding various weapons.',
  [OverlayObjectType.ARMOR_STAND]: 'A stand displaying pieces of armor.',
};

const ContainerModal: React.FC<ContainerModalProps> = ({
  isOpen,
  onClose,
  containerType,
  contents,
  onTakeItem,
  onTakeAll,
  containerPosition,
  isAnimating = false
}) => {
  // Play opening sound when modal opens
  useEffect(() => {
    if (isOpen) {
      // Convert containerType to the format expected by the sound service
      let soundType: 'chest' | 'barrel' | 'cabinet' | 'generic' = 'generic';
      if (containerType === OverlayObjectType.CHEST) {
        soundType = 'chest';
      } else if (containerType === OverlayObjectType.BARREL) {
        soundType = 'barrel';
      } else if (containerType === OverlayObjectType.CABINET || 
                 containerType === OverlayObjectType.FILING_CABINET ||
                 containerType === OverlayObjectType.SPICE_CABINET) {
        soundType = 'cabinet';
      }
      gameSoundsService.playContainerOpenSound(soundType);
    }
  }, [isOpen, containerType]);

  if (!isOpen) return null;

  const containerName = CONTAINER_NAMES[containerType] || 'Container';
  const containerDescription = CONTAINER_DESCRIPTIONS[containerType] || 'A container holding various items.';
  
  const handleTakeItem = (item: Item) => {
    onTakeItem(item);
  };

  const handleTakeAll = () => {
    onTakeAll();
    onClose();
  };

  const handleClose = () => {
    // Convert containerType to the format expected by the sound service
    let soundType: 'chest' | 'barrel' | 'cabinet' | 'generic' = 'generic';
    if (containerType === OverlayObjectType.CHEST) {
      soundType = 'chest';
    } else if (containerType === OverlayObjectType.BARREL) {
      soundType = 'barrel';
    } else if (containerType === OverlayObjectType.CABINET || 
               containerType === OverlayObjectType.FILING_CABINET ||
               containerType === OverlayObjectType.SPICE_CABINET) {
      soundType = 'cabinet';
    }
    gameSoundsService.playContainerCloseSound(soundType);
    onClose();
  };

  const getItemRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Ultra-rare': return '#ff6b35';
      case 'Rare': return '#8e44ad';
      case 'Uncommon': return '#3498db';
      case 'Common': return '#2ecc71';
      case 'Junk': return '#95a5a6';
      default: return '#2ecc71';
    }
  };

  const getOwnershipText = () => {
    if (contents.ownerNpc) {
      return (
        <div className="px-6 py-3 bg-red-900/20 border-l-4 border-red-500 text-red-300">
          <div className="flex items-center gap-2 text-sm">
            <span>⚠️</span>
            <span>This container appears to belong to someone. Taking items may be considered theft.</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes scaleIn {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }

          .container-modal.opening {
            animation: scaleIn 0.3s ease-out;
          }

          .container-with-loot:hover {
            filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.8)) !important;
          }

          .loot-indicator {
            animation: pulse 2s infinite;
          }

          @keyframes pulse {
            0%, 100% { opacity: 0.8; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
          }
        `}
      </style>
      <div
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 md:p-4"
        onClick={handleClose}
      >
        <div
          className={`bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-2 border-slate-700 rounded-2xl max-w-lg w-full max-h-[80vh] shadow-2xl transition-all duration-300 overflow-hidden flex flex-col ${isAnimating ? 'animate-scaleIn' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div>
              <h2 className="text-xl font-bold text-slate-100 m-0">
                {containerName}
              </h2>
              <p className="text-sm text-slate-400 m-0 italic">
                {containerDescription}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-200 text-xl p-2 hover:bg-slate-800 rounded-lg transition-all"
          >
            ✕
          </button>
        </div>

        {/* Ownership Warning */}
        {getOwnershipText()}

        {/* Contents */}
        <div className="flex-1 px-6 py-4 overflow-y-auto">
          <h3 className="text-lg font-semibold text-amber-400 mb-4 pb-2 border-b border-slate-700/50">
            Contents ({contents.items.length} {contents.items.length === 1 ? 'item' : 'items'})
          </h3>
          
          {contents.items.length === 0 ? (
            <div className="text-center text-slate-500 py-8 italic">
              This container is empty.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {contents.items.map((item, index) => (
                <div
                  key={`${item.baseId}-${index}`}
                  className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border transition-all hover:transform hover:-translate-y-0.5 hover:shadow-lg"
                  style={{
                    borderColor: getItemRarityColor(item.rarity)
                  }}
                >
                  <div className="flex items-center flex-1 gap-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <GenerativeItemIcon item={item} size={32} />
                    </div>
                    <div className="flex-1">
                      <div
                        className="font-semibold mb-1"
                        style={{ color: getItemRarityColor(item.rarity) }}
                      >
                        {item.name}
                      </div>
                      <div className="text-sm text-slate-300 mb-1">
                        {item.description}
                      </div>
                      <div className="text-xs text-slate-500">
                        Value: {item.value} • Weight: {item.weight} • {item.rarity}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTakeItem(item)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                  >
                    Take
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm">
            {contents.isValuable && (
              <span className="text-amber-400 flex items-center gap-1">
                <span>💎</span>
                <span>Contains valuable items</span>
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all"
            >
              Close
            </button>
            {contents.items.length > 0 && (
              <button
                onClick={handleTakeAll}
                className={`text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  contents.ownerNpc
                    ? 'bg-orange-600 hover:bg-orange-500'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {contents.ownerNpc ? 'Steal All' : 'Take All'}
              </button>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default ContainerModal;