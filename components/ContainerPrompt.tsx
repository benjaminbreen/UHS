/**
 * components/ContainerPrompt.tsx
 * Simple top-screen prompt for container interactions
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContainerPromptProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const ContainerPrompt: React.FC<ContainerPromptProps> = ({ 
  message, 
  isVisible, 
  onClose, 
  duration = 5000 
}) => {
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [isVisible, duration, onClose]);

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-none">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 25 
            }}
            className="
              bg-gradient-to-r from-blue-900/95 to-blue-800/95
              backdrop-blur-md rounded-lg shadow-2xl border border-white/10
              px-4 py-3 min-w-[300px] max-w-[400px]
              pointer-events-auto cursor-pointer
            "
            onClick={onClose}
          >
            <div className="flex items-center gap-3">
              <div className="text-blue-400">
                📦
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {message}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContainerPrompt;