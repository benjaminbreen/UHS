/**
 * components/ui/InventoryToast.tsx
 * Toast notification for item collection in special maps
 */

import React, { useEffect, useState } from 'react';
import { Item } from '../../types';
import GenerativeItemIcon from '../symbols/GenerativeItemIcon';

interface InventoryToastProps {
  item: Item;
  action: 'collected' | 'stolen' | 'found' | 'looted';
  onClose: () => void;
  duration?: number; // milliseconds before auto-dismiss
}

const InventoryToast: React.FC<InventoryToastProps> = ({ 
  item, 
  action, 
  onClose, 
  duration = 3000 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const showTimer = setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss after duration
    const hideTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300); // Wait for exit animation
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onClose]);

  // Get action text and color
  const getActionDetails = () => {
    switch (action) {
      case 'collected':
        return {
          text: 'Collected',
          textClass: 'text-emerald-400',
          tintBg: 'rgba(34,197,94,0.12)',
          tintBorder: 'rgba(52,211,153,0.38)',
          progressColor: 'rgba(34,197,94,0.55)'
        };
      case 'stolen':
        return {
          text: 'Stolen',
          textClass: 'text-rose-400',
          tintBg: 'rgba(248,113,113,0.12)',
          tintBorder: 'rgba(248,113,113,0.35)',
          progressColor: 'rgba(248,113,113,0.55)'
        };
      case 'found':
        return {
          text: 'Found',
          textClass: 'text-sky-400',
          tintBg: 'rgba(96,165,250,0.12)',
          tintBorder: 'rgba(96,165,250,0.35)',
          progressColor: 'rgba(96,165,250,0.55)'
        };
      case 'looted':
        return {
          text: 'Looted',
          textClass: 'text-amber-400',
          tintBg: 'rgba(251,191,36,0.12)',
          tintBorder: 'rgba(251,191,36,0.36)',
          progressColor: 'rgba(250,204,21,0.55)'
        };
      default:
        return {
          text: 'Obtained',
          textClass: 'text-slate-200',
          tintBg: 'rgba(148,163,184,0.12)',
          tintBorder: 'rgba(148,163,184,0.32)',
          progressColor: 'rgba(148,163,184,0.55)'
        };
    }
  };

  const { text: actionText, textClass, tintBg, tintBorder, progressColor } = getActionDetails();

  // Get rarity color for item name
  const getRarityColor = () => {
    switch (item.rarity) {
      case 'Common': return 'text-gray-300';
      case 'Uncommon': return 'text-green-300';
      case 'Rare': return 'text-blue-300';
      case 'Ultra-rare': return 'text-purple-300';
      case 'Unique': return 'text-yellow-300';
      default: return 'text-white';
    }
  };

  return (
    <div
      className={`
        fixed left-1/2 bottom-[calc(7rem+4vh)] -translate-x-1/2 z-[9998]
        transition-all duration-400 ease-out
        ${isVisible && !isExiting ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}
      `}
    >
      <div
        data-surface="toast"
        className="relative flex items-center gap-4 px-6 py-4 rounded-xl shadow-xl min-w-[280px] max-w-[420px] backdrop-blur-xl border"
        style={{
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.28)'
        }}
      >
        <div
          className="w-[56px] h-[56px] flex items-center justify-center rounded-lg border shadow-inner"
          style={{ background: tintBg, borderColor: tintBorder }}
        >
          <GenerativeItemIcon item={item} size={44} />
        </div>

        <div className="flex-1 min-w-0">
          <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${textClass} mb-1`}>{actionText}</div>
          <div className={`text-base font-semibold ${getRarityColor()} truncate`}>{item.name}</div>
          {item.quantity && item.quantity > 1 && (
            <div style={{ color: 'var(--toast-surface-text)', opacity: 0.7 }} className="text-xs">
              Qty&nbsp;{item.quantity}
            </div>
          )}
          {item.value > 0 && (
            <div style={{ color: 'var(--toast-surface-text)', opacity: 0.7 }} className="text-[11px] mt-1">
              Value <span style={{ color: '#fbbf24', fontWeight: 600 }}>{item.value}</span> coins
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 text-xs" style={{ color: 'var(--toast-surface-text)', opacity: 0.75 }}>
          {item.specialMapOnly && (
            <span
              style={{
                background: 'rgba(168, 85, 247, 0.16)',
                color: 'rgba(107, 33, 168, 0.9)',
                padding: '2px 8px',
                borderRadius: '999px'
              }}
            >
              Special
            </span>
          )}
          {item.value > 100 && (
            <span
              style={{
                background: 'rgba(234, 179, 8, 0.16)',
                color: 'rgba(180, 83, 9, 0.9)',
                padding: '2px 8px',
                borderRadius: '999px'
              }}
            >
              Valuable
            </span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-b-xl" style={{ background: 'rgba(51,65,85,0.2)' }}>
          <div className="h-full" style={{ background: progressColor, animation: `toastProgress ${duration}ms linear forwards` }}></div>
        </div>
      </div>
    </div>
  );
};

export default InventoryToast;
