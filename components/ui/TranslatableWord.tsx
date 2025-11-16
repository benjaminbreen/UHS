/**
 * components/ui/TranslatableWord.tsx
 * Component for displaying foreign words with translation tooltips
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TranslatableWordProps {
  word: string;
  translation?: string;
  language?: string;
}

const TranslatableWord: React.FC<TranslatableWordProps> = ({ word, translation, language }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const wordRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (showTooltip && wordRef.current) {
      const rect = wordRef.current.getBoundingClientRect();
      const tooltipLeft = rect.left + rect.width / 2;
      const tooltipTop = rect.top - 10; // Position above the word with some spacing

      setTooltipPosition({
        top: tooltipTop,
        left: tooltipLeft
      });
    }
  }, [showTooltip]);

  // Still show dotted underline even without translation
  if (!translation) {
    return (
      <em
        className="border-b border-dotted border-blue-400/40 cursor-help not-italic"
        style={{ fontStyle: 'italic' }}
        title="Translation unavailable"
      >
        {word}
      </em>
    );
  }

  return (
    <>
      <span
        className="relative inline-block"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* The foreign word with subtle dotted underline */}
        <em
          ref={wordRef}
          className="border-b border-dotted border-blue-400/40 hover:border-blue-400/70 transition-colors duration-150 cursor-help not-italic"
          style={{ fontStyle: 'italic' }}
        >
          {word}
        </em>
      </span>

      {/* Tooltip rendered via portal to avoid clipping */}
      {showTooltip && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed px-3 py-2
                     bg-slate-900/95 backdrop-blur-md
                     border border-slate-700/70 rounded-lg shadow-2xl
                     text-xs font-sans text-gray-100 leading-relaxed
                     max-w-[240px] text-center z-[10000]
                     pointer-events-none
                     animate-tooltip-fade-in"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {/* Translation text */}
          <span className="font-medium">{translation}</span>

          {/* Language label (optional) */}
          {language && (
            <span className="ml-2 text-xs text-slate-400">
              ({language})
            </span>
          )}

          {/* Arrow pointing down to word */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-full
                       border-4 border-transparent border-t-slate-900/95"
            style={{ marginTop: '-1px' }}
          />
        </div>,
        document.body
      )}

      <style jsx>{`
        @keyframes tooltip-fade-in {
          from {
            opacity: 0;
            transform: translate(-50%, calc(-100% + 4px));
          }
          to {
            opacity: 1;
            transform: translate(-50%, -100%);
          }
        }

        .animate-tooltip-fade-in {
          animation: tooltip-fade-in 150ms ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default TranslatableWord;
