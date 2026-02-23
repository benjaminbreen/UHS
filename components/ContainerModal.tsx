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

const CONTAINER_EMOJIS: Record<string, string> = {
  [OverlayObjectType.CHEST]: '📦',
  [OverlayObjectType.BARREL]: '🪣',
  [OverlayObjectType.CRATE]: '📦',
  [OverlayObjectType.CABINET]: '🗄️',
  [OverlayObjectType.BOOKSHELF]: '📚',
  [OverlayObjectType.FILING_CABINET]: '🗃️',
  [OverlayObjectType.TANSU]: '🗃️',
  [OverlayObjectType.SPICE_CABINET]: '🫙',
  [OverlayObjectType.WEAPON_RACK]: '⚔️',
  [OverlayObjectType.ARMOR_STAND]: '🛡️',
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
  const containerEmoji = CONTAINER_EMOJIS[containerType] || '📦';

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

  return (
    <div
      data-surface="modal-overlay"
      className="modal-overlay theme-surface"
      onClick={handleClose}
    >
      <div
        data-surface="modal-panel"
        className="ff-panel theme-surface w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'modal-pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-normal)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-md flex items-center justify-center text-lg"
              style={{
                background: 'var(--surface-elevated-bg)',
                border: '1px solid var(--surface-elevated-border)',
              }}
            >
              {containerEmoji}
            </div>
            <div>
              <h2
                className="text-lg font-bold m-0"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-narrative, Georgia, serif)',
                }}
              >
                {containerName}
              </h2>
              <p
                className="text-xs m-0"
                style={{
                  color: 'var(--text-tertiary)',
                  fontFamily: 'var(--font-narrative, Georgia, serif)',
                  fontStyle: 'italic',
                }}
              >
                {containerDescription}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-[30px] h-[30px] rounded-md flex items-center justify-center text-base cursor-pointer transition-colors duration-150 hover:brightness-125"
            style={{
              border: '1px solid var(--border-normal)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-tertiary)',
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Ownership Warning */}
        {contents.ownerNpc && (
          <div
            className="relative px-5 py-3 overflow-hidden flex-shrink-0"
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              borderBottom: '1px solid rgba(248, 113, 113, 0.25)',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: 'linear-gradient(90deg, transparent, var(--color-error), transparent)',
              }}
            />
            <div
              className="flex items-center gap-2 text-sm"
              style={{ color: 'var(--color-error)' }}
            >
              <span>⚠️</span>
              <span>This container appears to belong to someone. Taking items may be considered theft.</span>
            </div>
          </div>
        )}

        {/* Contents */}
        <div
          className="flex-1 overflow-y-auto px-5 py-4 pr-3 scrollbar-thin"
          style={{ background: 'var(--bg-primary)' }}
        >
          {/* Section header */}
          <div className="flex justify-between items-center mb-3">
            <span
              className="font-bold uppercase"
              style={{
                fontSize: '0.68rem',
                letterSpacing: '0.12em',
                color: 'var(--text-tertiary)',
              }}
            >
              Contents
            </span>
            <span
              className="font-semibold px-2 py-0.5 rounded-full"
              style={{
                fontSize: '0.65rem',
                background: contents.items.length > 0 ? 'var(--pill-accent-bg)' : 'var(--pill-bg)',
                border: `1px solid`,
                borderColor: contents.items.length > 0 ? 'var(--pill-accent-border)' : 'var(--pill-border)',
                color: contents.items.length > 0 ? 'var(--pill-accent-text)' : 'var(--text-muted)',
              }}
            >
              {contents.items.length} {contents.items.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {contents.items.length === 0 ? (
            <div
              className="text-center py-12 text-sm"
              style={{
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-narrative, Georgia, serif)',
                fontStyle: 'italic',
              }}
            >
              This container is empty.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {contents.items.map((item, index) => {
                const rarityColor = getItemRarityColor(item.rarity);
                return (
                  <div
                    key={`${item.baseId}-${index}`}
                    className="grid items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:translate-x-0.5 hover:brightness-[1.08]"
                    style={{
                      gridTemplateColumns: '36px 1fr auto',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--surface-card-border)',
                      boxShadow: `inset 3px 0 0 ${rarityColor}`,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-md flex items-center justify-center"
                      style={{
                        background: 'var(--surface-elevated-bg)',
                        border: '1px solid var(--surface-elevated-border)',
                      }}
                    >
                      <GenerativeItemIcon item={item} size={28} />
                    </div>
                    <div className="min-w-0">
                      <div
                        className="text-sm font-semibold truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {item.name}
                      </div>
                      {item.description && (
                        <div
                          className="text-xs truncate mt-0.5"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {item.description}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                          {item.value} coin{item.value !== 1 ? 's' : ''}
                        </span>
                        <span
                          className="inline-block w-[3px] h-[3px] rounded-full"
                          style={{ background: 'var(--text-muted)' }}
                        />
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                          Wt. {item.weight}
                        </span>
                        <span
                          className="font-bold uppercase px-1.5 py-px rounded ml-0.5"
                          style={{
                            fontSize: '0.6rem',
                            letterSpacing: '0.06em',
                            color: rarityColor,
                            background: `${rarityColor}1a`,
                            border: `1px solid ${rarityColor}40`,
                          }}
                        >
                          {item.rarity}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTakeItem(item)}
                      className="px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-px"
                      style={{
                        fontSize: '0.75rem',
                        background: 'var(--button-primary-bg)',
                        border: '1px solid rgba(76, 146, 125, 0.55)',
                        color: 'var(--button-primary-text)',
                        boxShadow: '0 2px 8px rgba(12, 52, 41, 0.3)',
                      }}
                    >
                      Take
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{
            borderTop: '1px solid var(--border-normal)',
            background: 'var(--bg-secondary)',
          }}
        >
          <div>
            {contents.isValuable && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{
                  fontSize: '0.72rem',
                  background: 'var(--surface-chip-bg)',
                  border: '1px solid var(--surface-chip-border)',
                  color: 'var(--accent-secondary)',
                }}
              >
                💎 Valuable items
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-md text-sm font-semibold cursor-pointer transition-all duration-150"
              style={{
                background: 'var(--surface-muted-bg)',
                border: '1px solid var(--surface-muted-border)',
                color: 'var(--text-secondary)',
              }}
            >
              Close
            </button>
            {contents.items.length > 0 && (
              <button
                onClick={handleTakeAll}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-px"
                style={{
                  background: contents.ownerNpc ? 'rgba(234, 88, 12, 0.8)' : 'var(--button-primary-bg)',
                  border: contents.ownerNpc
                    ? '1px solid rgba(234, 88, 12, 0.55)'
                    : '1px solid rgba(76, 146, 125, 0.55)',
                  color: 'var(--button-primary-text)',
                  boxShadow: contents.ownerNpc
                    ? '0 4px 12px rgba(154, 52, 18, 0.3)'
                    : '0 4px 12px rgba(12, 52, 41, 0.3)',
                }}
              >
                {contents.ownerNpc ? '⚠ Steal All' : 'Take All'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContainerModal;
