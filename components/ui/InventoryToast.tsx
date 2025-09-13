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
        return { text: 'Collected', color: 'text-green-400', bgColor: 'bg-green-900/20', borderColor: 'border-green-500' };
      case 'stolen':
        return { text: 'Stolen', color: 'text-red-400', bgColor: 'bg-red-900/20', borderColor: 'border-red-500' };
      case 'found':
        return { text: 'Found', color: 'text-blue-400', bgColor: 'bg-blue-900/20', borderColor: 'border-blue-500' };
      case 'looted':
        return { text: 'Looted', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', borderColor: 'border-yellow-500' };
      default:
        return { text: 'Obtained', color: 'text-gray-400', bgColor: 'bg-gray-900/20', borderColor: 'border-gray-500' };
    }
  };

  const { text: actionText, color: textColor, bgColor, borderColor } = getActionDetails();

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
        fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[9998]
        transition-all duration-300 ease-out
        ${isVisible && !isExiting ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
      `}
    >
      <div className={`
        flex items-center gap-4 px-6 py-4
        bg-gray-900/95 backdrop-blur-md
        border-2 ${borderColor} rounded-lg
        shadow-2xl shadow-black/50
        min-w-[320px] max-w-[480px]
      `}>
        {/* Item Icon */}
        <div className={`
          w-16 h-16 flex items-center justify-center
          ${bgColor} rounded-lg border ${borderColor}
          shadow-inner
        `}>
          <GenerativeItemIcon item={item} size={48} />
        </div>

        {/* Item Info */}
        <div className="flex-1">
          {/* Action Text */}
          <div className={`text-xs font-bold uppercase tracking-wider ${textColor} mb-1`}>
            {actionText}
          </div>
          
          {/* Item Name */}
          <div className={`text-base font-semibold ${getRarityColor()}`}>
            {item.name}
            {item.quantity && item.quantity > 1 && (
              <span className="text-sm text-gray-400 ml-2">x{item.quantity}</span>
            )}
          </div>
          
          {/* Item Value */}
          {item.value > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              Value: <span className="text-yellow-400">{item.value}</span> coins
            </div>
          )}
        </div>

        {/* Special Indicators */}
        <div className="flex flex-col gap-1">
          {item.specialMapOnly && (
            <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded-full">
              Special
            </span>
          )}
          {item.value > 100 && (
            <span className="text-xs bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded-full">
              Valuable
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar for Auto-Dismiss */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 rounded-b-lg overflow-hidden">
        <div 
          className={`h-full ${bgColor} transition-all ease-linear`}
          style={{
            width: '100%',
            animation: `shrink ${duration}ms linear forwards`
          }}
        />
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default InventoryToast;