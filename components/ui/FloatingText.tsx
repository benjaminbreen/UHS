/**
 * FloatingText.tsx - Animated floating text for visual feedback
 * Used for showing stat changes, damage, healing, etc.
 */
import React, { useState, useEffect } from 'react';

export interface FloatingTextMessage {
  id: string;
  text: string;
  type: 'health' | 'damage' | 'experience' | 'gold' | 'stat' | 'success' | 'error' | 'reputation';
  x: number; // Screen coordinates
  y: number;
  duration?: number; // milliseconds
}

interface FloatingTextProps {
  messages: FloatingTextMessage[];
  onMessageComplete: (id: string) => void;
}

const FloatingTextItem: React.FC<{
  message: FloatingTextMessage;
  onComplete: () => void;
}> = ({ message, onComplete }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger animation
    setMounted(true);
    
    // Auto-remove after duration
    const timer = setTimeout(() => {
      onComplete();
    }, message.duration || 2000);

    return () => clearTimeout(timer);
  }, [onComplete, message.duration]);

  const getTypeStyles = () => {
    switch (message.type) {
      case 'health':
        return 'text-green-400 drop-shadow-[0_0_6px_rgba(34,197,94,0.6)]';
      case 'damage':
        return 'text-red-400 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]';
      case 'experience':
        return 'text-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]';
      case 'gold':
        return 'text-yellow-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.6)]';
      case 'stat':
        return 'text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]';
      case 'success':
        return 'text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]';
      case 'error':
        return 'text-red-300 drop-shadow-[0_0_6px_rgba(248,113,113,0.6)]';
      case 'reputation':
        return 'text-pink-400 drop-shadow-[0_0_6px_rgba(244,114,182,0.6)]';
      default:
        return 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]';
    }
  };

  return (
    <div
      className={`fixed pointer-events-none z-[9999] font-bold text-lg transition-all duration-2000 ease-out ${getTypeStyles()} ${
        mounted ? 'opacity-0 transform -translate-y-20 scale-110' : 'opacity-100 transform translate-y-0 scale-100'
      }`}
      style={{
        left: `${message.x}px`,
        top: `${message.y}px`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
      }}
    >
      {message.text}
    </div>
  );
};

const FloatingText: React.FC<FloatingTextProps> = ({ messages, onMessageComplete }) => {
  return (
    <>
      {messages.map((message) => (
        <FloatingTextItem
          key={message.id}
          message={message}
          onComplete={() => onMessageComplete(message.id)}
        />
      ))}
    </>
  );
};

export default FloatingText;