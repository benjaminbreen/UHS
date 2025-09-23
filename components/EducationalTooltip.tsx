/**
 * Educational tooltip for providing historical context
 */

import React, { useState } from 'react';
import { Info, ExternalLink, Clock, MapPin } from 'lucide-react';

interface EducationalTooltipProps {
  content: string;
  historicalContext?: string;
  accuracy?: 'high' | 'medium' | 'low';
  era?: string;
  location?: string;
  sources?: string[];
  children: React.ReactNode;
  className?: string;
}

const EducationalTooltip: React.FC<EducationalTooltipProps> = ({
  content,
  historicalContext,
  accuracy = 'medium',
  era,
  location,
  sources = [],
  children,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const accuracyColor = {
    high: 'border-green-500/50 bg-green-900/30',
    medium: 'border-yellow-500/50 bg-yellow-900/30',
    low: 'border-red-500/50 bg-red-900/30'
  };

  const accuracyText = {
    high: 'Historically Verified',
    medium: 'Likely Accurate',
    low: 'Speculative/Simplified'
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className={`cursor-help ${className}`}
      >
        {children}
        <Info className="inline w-3 h-3 ml-1 text-blue-400 opacity-60 hover:opacity-100 transition-opacity" />
      </div>

      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 animate-fadeIn">
          <div className={`bg-slate-900/95 border rounded-lg shadow-xl p-4 ${accuracyColor[accuracy]}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-300">Historical Context</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                accuracy === 'high' ? 'bg-green-800/50 text-green-300' :
                accuracy === 'medium' ? 'bg-yellow-800/50 text-yellow-300' :
                'bg-red-800/50 text-red-300'
              }`}>
                {accuracyText[accuracy]}
              </span>
            </div>

            {/* Main content */}
            <p className="text-sm text-slate-200 leading-relaxed mb-3">
              {content}
            </p>

            {/* Historical context */}
            {historicalContext && (
              <div className="mb-3 p-2 bg-slate-800/50 rounded border border-slate-700/30">
                <p className="text-xs text-slate-300 italic">
                  "{historicalContext}"
                </p>
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
              {era && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {era}
                </span>
              )}
              {location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {location}
                </span>
              )}
            </div>

            {/* Sources */}
            {sources.length > 0 && (
              <div className="mt-3 pt-2 border-t border-slate-700/30">
                <p className="text-xs text-slate-400 mb-1">Sources:</p>
                <div className="space-y-1">
                  {sources.slice(0, 2).map((source, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs text-slate-300">
                      <ExternalLink className="w-3 h-3 opacity-50" />
                      <span className="truncate">{source}</span>
                    </div>
                  ))}
                  {sources.length > 2 && (
                    <p className="text-xs text-slate-500">
                      +{sources.length - 2} more sources
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationalTooltip;