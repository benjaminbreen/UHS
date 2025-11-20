/**
 * ThreatToast.tsx - Simple toast notification for weapon swing threats
 */
import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ThreatToastProps {
  entityName: string;
  entityType: 'npc' | 'animal';
  reaction: 'flee' | 'hostile';
  onClose?: () => void;
  autoHideDelay?: number;
}

const ThreatToast: React.FC<ThreatToastProps> = ({
  entityName,
  entityType,
  reaction,
  onClose,
  autoHideDelay = 3000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Entrance animation
    const animTimer = setTimeout(() => setIsAnimating(false), 100);

    // Auto-hide
    const hideTimer = setTimeout(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300);
    }, autoHideDelay);

    return () => {
      clearTimeout(animTimer);
      clearTimeout(hideTimer);
    };
  }, [autoHideDelay, onClose]);

  if (!isVisible) return null;

  const reactionText = reaction === 'flee'
    ? 'is frightened by your actions!'
    : 'turns hostile!';

  const bgColor = reaction === 'flee'
    ? 'bg-gradient-to-br from-amber-900/90 via-yellow-900/90 to-orange-900/90 border-yellow-500/40'
    : 'bg-gradient-to-br from-red-900/90 via-rose-900/90 to-pink-900/90 border-red-500/40';

  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out
        ${isAnimating ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
    >
      <div className={`
        flex items-center gap-3 px-5 py-3 rounded-lg border-2 backdrop-blur-md shadow-2xl
        ${bgColor}
      `}>
        <AlertTriangle className={`w-5 h-5 ${reaction === 'flee' ? 'text-yellow-400' : 'text-red-400'}`} />
        <div className="text-white font-semibold text-sm">
          <span className="text-yellow-200">{entityName}</span> {reactionText}
        </div>
      </div>
    </div>
  );
};

export default ThreatToast;
