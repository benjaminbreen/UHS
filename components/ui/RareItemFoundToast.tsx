/**
 * components/ui/RareItemFoundToast.tsx
 * Special toast notification for discovering rare or valuable items
 */

import React, { useEffect, useState } from 'react';
import { Item, Rarity } from '../../types';
import GenerativeItemIcon from '../symbols/GenerativeItemIcon';

interface RareItemFoundToastProps {
  item: Item;
  onClose: () => void;
}

const RareItemFoundToast: React.FC<RareItemFoundToastProps> = ({ item, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 50);

    // Auto-dismiss after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500); // Wait for exit animation
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  // Determine rarity-based colors and effects
  const getRarityConfig = (rarity: Rarity, value: number) => {
    // High value items get upgraded treatment
    if (value >= 100) {
      return {
        label: 'LEGENDARY FIND!',
        borderColor: 'border-yellow-400',
        bgGradient: 'from-yellow-500/20 via-orange-500/20 to-red-500/20',
        textColor: 'text-yellow-300',
        glowColor: 'shadow-[0_0_30px_rgba(251,191,36,0.6)]',
        sparkleColor: '#fbbf24',
      };
    }

    if (value >= 50 || rarity === 'Ultra-rare') {
      return {
        label: 'ULTRA RARE!',
        borderColor: 'border-purple-400',
        bgGradient: 'from-purple-500/20 via-pink-500/20 to-purple-500/20',
        textColor: 'text-purple-300',
        glowColor: 'shadow-[0_0_25px_rgba(192,132,252,0.5)]',
        sparkleColor: '#c084fc',
      };
    }

    if (rarity === 'Rare') {
      return {
        label: 'RARE FIND!',
        borderColor: 'border-blue-400',
        bgGradient: 'from-blue-500/20 via-cyan-500/20 to-blue-500/20',
        textColor: 'text-blue-300',
        glowColor: 'shadow-[0_0_20px_rgba(96,165,250,0.4)]',
        sparkleColor: '#60a5fa',
      };
    }

    return {
      label: 'UNCOMMON FIND!',
      borderColor: 'border-green-400',
      bgGradient: 'from-green-500/20 via-emerald-500/20 to-green-500/20',
      textColor: 'text-green-300',
      glowColor: 'shadow-[0_0_15px_rgba(74,222,128,0.4)]',
      sparkleColor: '#4ade80',
    };
  };

  const config = getRarityConfig(item.rarity, item.value);

  // Generate random sparkle positions
  const [sparkles] = useState(() =>
    Array.from({ length: 12 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 1 + Math.random() * 1.5,
    }))
  );

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
      }`}
      onClick={onClose}
    >
      <div
        className={`relative bg-gradient-to-br ${config.bgGradient} backdrop-blur-md border-2 ${config.borderColor} ${config.glowColor} rounded-2xl p-6 min-w-[400px] overflow-hidden cursor-pointer`}
      >
        {/* Sparkle effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {sparkles.map((sparkle, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full animate-sparkle"
              style={{
                left: `${sparkle.x}%`,
                top: `${sparkle.y}%`,
                backgroundColor: config.sparkleColor,
                animationDelay: `${sparkle.delay}s`,
                animationDuration: `${sparkle.duration}s`,
                boxShadow: `0 0 4px ${config.sparkleColor}`,
              }}
            />
          ))}
        </div>

        {/* Radial gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${config.sparkleColor}15 0%, transparent 70%)`,
          }}
        />

        {/* Content */}
        <div className="relative flex items-center gap-6">
          {/* Item icon with pulse animation */}
          <div className="relative flex-shrink-0">
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{ backgroundColor: config.sparkleColor }}
            />
            <div className="relative w-20 h-20 flex items-center justify-center animate-bounce-slow">
              <GenerativeItemIcon item={item} size={80} />
            </div>
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold tracking-wider ${config.textColor} mb-1 animate-pulse`}>
              ✨ {config.label} ✨
            </p>
            <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">
              {item.name}
            </h3>
            <p className="text-sm text-slate-300 italic line-clamp-2">
              "{item.description}"
            </p>
            {item.value >= 20 && (
              <p className="text-xs text-yellow-400 mt-2 font-semibold">
                Value: {item.value} 💰
              </p>
            )}
          </div>
        </div>

        {/* Shimmer effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${config.sparkleColor}20 50%, transparent 100%)`,
            animation: 'shimmer 3s infinite',
          }}
        />
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default RareItemFoundToast;
