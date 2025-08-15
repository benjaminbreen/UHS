/**
 * ReputationModal - Displays reputation changes to the player
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReputationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reputationChange: number;
  newReputation: number;
  reason: string;
  wasStealingDetected?: boolean;
}

const ReputationModal: React.FC<ReputationModalProps> = ({
  isOpen,
  onClose,
  reputationChange,
  newReputation,
  reason,
  wasStealingDetected
}) => {
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Auto-close after 4 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      setAutoCloseTimer(timer);
    }
    
    return () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  }, [isOpen]);

  const getReputationLevel = (rep: number) => {
    if (rep >= 80) return { label: 'Legendary', color: 'text-yellow-400' };
    if (rep >= 60) return { label: 'Honored', color: 'text-green-400' };
    if (rep >= 40) return { label: 'Respected', color: 'text-blue-400' };
    if (rep >= 20) return { label: 'Neutral', color: 'text-gray-400' };
    if (rep >= 0) return { label: 'Distrusted', color: 'text-orange-400' };
    return { label: 'Notorious', color: 'text-red-400' };
  };

  const repLevel = getReputationLevel(newReputation);
  const isPositive = reputationChange > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className={`
            bg-slate-900/95 backdrop-blur-md rounded-lg shadow-2xl p-6
            border-2 ${isPositive ? 'border-green-500' : 'border-red-500'}
            ${wasStealingDetected ? 'animate-pulse' : ''}
          `}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`text-3xl ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '📈' : '📉'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Reputation {isPositive ? 'Increased' : 'Decreased'}!
                </h3>
                {wasStealingDetected && (
                  <p className="text-xs text-red-300 animate-pulse">
                    ⚠️ You were caught stealing!
                  </p>
                )}
              </div>
            </div>

            {/* Change amount */}
            <div className="text-center mb-3">
              <span className={`text-4xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{reputationChange}
              </span>
            </div>

            {/* Reason */}
            <p className="text-sm text-gray-300 mb-3 text-center italic">
              "{reason}"
            </p>

            {/* New reputation level */}
            <div className="bg-slate-800/50 rounded p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">Current Status:</span>
                <span className={`font-bold ${repLevel.color}`}>
                  {repLevel.label}
                </span>
              </div>
              
              {/* Reputation bar */}
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: `${Math.max(0, Math.min(100, (newReputation - reputationChange + 50) / 1.5))}%` }}
                  animate={{ width: `${Math.max(0, Math.min(100, (newReputation + 50) / 1.5))}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={`h-full ${
                    newReputation >= 60 ? 'bg-green-500' :
                    newReputation >= 20 ? 'bg-blue-500' :
                    newReputation >= 0 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-50</span>
                <span className="font-bold text-gray-300">{newReputation}</span>
                <span>100</span>
              </div>
            </div>

            {/* Consequences hint */}
            {newReputation < 0 && (
              <p className="text-xs text-red-300 mt-3 text-center">
                ⚠️ Merchants may refuse to trade with you!
              </p>
            )}
            {newReputation > 60 && (
              <p className="text-xs text-green-300 mt-3 text-center">
                ✨ You may receive better prices and special quests!
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReputationModal;