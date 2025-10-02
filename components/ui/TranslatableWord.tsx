/**
 * components/ui/TranslatableWord.tsx
 * Component for displaying foreign words with translation tooltips
 */

import React, { useState } from 'react';

interface TranslatableWordProps {
  word: string;
  translation?: string;
  language?: string;
}

const TranslatableWord: React.FC<TranslatableWordProps> = ({ word, translation, language }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Don't render if no translation is available
  if (!translation) {
    return <em>{word}</em>;
  }

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* The foreign word with subtle dotted underline */}
      <em
        className="border-b border-dotted border-blue-400/40 hover:border-blue-400/70 transition-colors duration-150 cursor-help not-italic"
        style={{ fontStyle: 'italic' }}
      >
        {word}
      </em>

      {/* Tooltip */}
      {showTooltip && (
        <span
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2
                     bg-slate-900/95 backdrop-blur-md
                     border border-slate-700/70 rounded-lg shadow-2xl
                     text-xs font-sans text-gray-100
                     whitespace-nowrap z-[10000]
                     pointer-events-none
                     animate-tooltip-fade-in"
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
          <span
            className="absolute left-1/2 -translate-x-1/2 top-full
                       border-4 border-transparent border-t-slate-900/95"
            style={{ marginTop: '-1px' }}
          />
        </span>
      )}

      <style jsx>{`
        @keyframes tooltip-fade-in {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .animate-tooltip-fade-in {
          animation: tooltip-fade-in 150ms ease-out forwards;
        }
      `}</style>
    </span>
  );
};

export default TranslatableWord;
