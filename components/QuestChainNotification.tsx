/**
 * Quest Chain Notification Component
 * Shows notifications when quest chains progress or new quests become available
 */

import React, { useEffect, useState } from 'react';

interface QuestChainProgressEvent {
  questTitle: string;
  questNumber: number;
  message: string;
}

export const QuestChainNotification: React.FC = () => {
  const [notification, setNotification] = useState<QuestChainProgressEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleQuestChainProgression = (event: CustomEvent<QuestChainProgressEvent>) => {
      console.log('[QuestChainNotification] Received quest chain progression event:', event.detail);

      setNotification(event.detail);
      setIsVisible(true);

      // Auto-hide after 5 seconds
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        // Clear notification after fade animation
        setTimeout(() => setNotification(null), 300);
      }, 5000);

      return () => clearTimeout(hideTimer);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('questChainProgression', handleQuestChainProgression as EventListener);

      return () => {
        window.removeEventListener('questChainProgression', handleQuestChainProgression as EventListener);
      };
    }
  }, []);

  if (!notification) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 bg-gradient-to-r from-purple-900 to-blue-900 text-white rounded-lg shadow-2xl border border-purple-400 max-w-sm transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
      style={{
        background: 'linear-gradient(135deg, #4c1d95 0%, #1e3a8a 100%)',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(147, 51, 234, 0.2)',
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-purple-900 font-bold">🔗</span>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-sm text-yellow-100">
              Quest Chain Progress
            </h3>
            <p className="text-xs text-blue-200">
              Quest {notification.questNumber}
            </p>
          </div>
        </div>

        {/* Quest Title */}
        <div className="mb-3">
          <h4 className="font-semibold text-white leading-tight">
            "{notification.questTitle}"
          </h4>
        </div>

        {/* Message */}
        <p className="text-sm text-blue-100 leading-relaxed mb-3">
          {notification.message}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsVisible(false)}
            className="flex-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs font-medium transition-colors"
          >
            Check Quest Log
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs opacity-75 transition-all"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-lg overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 animate-pulse"
          style={{
            width: '100%',
            animation: 'questProgress 5s ease-out forwards'
          }}
        />
      </div>

      <style jsx>{`
        @keyframes questProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default QuestChainNotification;