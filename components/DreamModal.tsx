/**
 * components/DreamModal.tsx
 * Modal for displaying simple dream sequences during rest
 */

import React, { useEffect, useState, useRef } from 'react';
import { Moon, Eye, Sparkles } from 'lucide-react';
import { dreamService } from '../services/dreamService';
import { GameLogEntry } from '../types/journal';

interface DreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDreamComplete: () => void;
  gamelog?: GameLogEntry[];
}

const DreamModal: React.FC<DreamModalProps> = ({
  isOpen,
  onClose,
  onDreamComplete,
  gamelog = []
}) => {
  const [dreamText, setDreamText] = useState('');
  const [emojiSequence, setEmojiSequence] = useState('');
  const [currentPhase, setCurrentPhase] = useState<'entering' | 'dreaming' | 'waking'>('entering');
  const [isRevealed, setIsRevealed] = useState(false);

  // Use refs to store callbacks to prevent re-renders
  const onDreamCompleteRef = useRef(onDreamComplete);
  const onCloseRef = useRef(onClose);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  // Update refs when props change
  useEffect(() => {
    onDreamCompleteRef.current = onDreamComplete;
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) {
      // Reset state and clear any timers when modal closes
      setCurrentPhase('entering');
      setIsRevealed(false);
      setDreamText('');
      setEmojiSequence('');
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
      return;
    }

    // Generate dream content
    const dream = gamelog.length > 0
      ? dreamService.generateDreamFromGamelog(gamelog)
      : dreamService.generateSimpleDream();

    setDreamText(dream);
    setEmojiSequence(dreamService.getDreamEmojis());
    setCurrentPhase('entering');
    setIsRevealed(false);

    // Phase transitions
    const timer1 = setTimeout(() => {
      setCurrentPhase('dreaming');
    }, 1500);

    const timer2 = setTimeout(() => {
      setIsRevealed(true);
    }, 3000);

    const timer3 = setTimeout(() => {
      setCurrentPhase('waking');
    }, 6000);

    const timer4 = setTimeout(() => {
      onDreamCompleteRef.current();
      onCloseRef.current();
    }, 8000);

    timersRef.current = [timer1, timer2, timer3, timer4];

    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
    };
  }, [isOpen, gamelog]);

  if (!isOpen) return null;

  const getPhaseOpacity = () => {
    switch (currentPhase) {
      case 'entering': return 'opacity-30';
      case 'dreaming': return 'opacity-100';
      case 'waking': return 'opacity-70';
      default: return 'opacity-100';
    }
  };

  const getPhaseTransform = () => {
    switch (currentPhase) {
      case 'entering': return 'scale-95 blur-sm';
      case 'dreaming': return 'scale-100 blur-none';
      case 'waking': return 'scale-105 blur-sm';
      default: return 'scale-100';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Dreamlike background with shifting colors */}
      <div
        className={`absolute inset-0 transition-all duration-[3000ms] ${getPhaseOpacity()}`}
        style={{
          background: currentPhase === 'entering'
            ? 'radial-gradient(circle, rgba(30,30,60,0.95) 0%, rgba(10,10,30,0.98) 100%)'
            : currentPhase === 'dreaming'
            ? 'radial-gradient(circle, rgba(60,30,80,0.95) 0%, rgba(20,10,40,0.98) 100%)'
            : 'radial-gradient(circle, rgba(80,60,30,0.95) 0%, rgba(40,30,20,0.98) 100%)'
        }}
      />

      {/* Dream content */}
      <div
        className={`relative w-full max-w-2xl mx-4 p-8 transition-all duration-[2000ms] ${getPhaseTransform()}`}
      >
        <div className="text-center">
          {/* Dream header with phase-specific icon */}
          <div className="flex justify-center items-center gap-3 mb-6">
            {currentPhase === 'entering' && (
              <Eye className="w-8 h-8 text-purple-400 animate-pulse" />
            )}
            {currentPhase === 'dreaming' && (
              <Moon className="w-8 h-8 text-blue-300 animate-bounce" />
            )}
            {currentPhase === 'waking' && (
              <Sparkles className="w-8 h-8 text-yellow-400 animate-spin" />
            )}

            <h2 className="text-2xl font-light text-white/80 tracking-wide">
              {currentPhase === 'entering' && 'Sleep descends...'}
              {currentPhase === 'dreaming' && 'In dreams...'}
              {currentPhase === 'waking' && 'Dawn approaches...'}
            </h2>
          </div>

          {/* Emoji sequence - only show during dreaming phase */}
          {currentPhase === 'dreaming' && (
            <div className="text-4xl mb-6 animate-pulse">
              {emojiSequence}
            </div>
          )}

          {/* Dream text - show during dreaming and waking phases */}
          {(currentPhase === 'dreaming' || currentPhase === 'waking') && (
            <div className="bg-black bg-opacity-40 rounded-lg p-6 border border-purple-500 border-opacity-30">
              <p
                className={`text-gray-200 text-lg leading-relaxed font-serif transition-all duration-1000 ${
                  isRevealed ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {dreamText}
              </p>
            </div>
          )}

          {/* Subtle instruction */}
          {currentPhase === 'waking' && (
            <div className="mt-6">
              <p className="text-yellow-200/50 text-sm animate-pulse">
                Waking soon...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DreamModal;