import React, { useState, useEffect } from 'react';

interface GuardWarningBoxProps {
  message: string;
  guardName?: string;
  severity: 'notice' | 'warning' | 'alert';
  turnsRemaining?: number;
}

const GuardWarningBox: React.FC<GuardWarningBoxProps> = ({
  message,
  guardName,
  severity,
  turnsRemaining
}) => {
  const [isVisible, setIsVisible] = useState(true);
  
  // Auto-hide notice messages after 3 seconds
  useEffect(() => {
    if (severity === 'notice') {
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [severity]);

  if (!isVisible) return null;

  const getBorderColor = () => {
    switch(severity) {
      case 'notice': return 'border-blue-400';
      case 'warning': return 'border-yellow-400';
      case 'alert': return 'border-red-400';
    }
  };

  const getBackgroundGradient = () => {
    switch(severity) {
      case 'notice': return 'from-blue-900/95 to-blue-800/95';
      case 'warning': return 'from-blue-900/95 to-indigo-800/95';
      case 'alert': return 'from-indigo-900/95 to-red-900/95';
    }
  };

  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40 animate-fadeIn">
      <div 
        className={`
          bg-gradient-to-b ${getBackgroundGradient()}
          border-4 ${getBorderColor()} 
          rounded-lg 
          px-6 py-4 
          shadow-2xl
          min-w-[350px]
          max-w-[500px]
          backdrop-blur-sm
        `}
        style={{
          borderStyle: 'double',
          borderWidth: '6px',
          boxShadow: '0 0 20px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.3)'
        }}
      >
        {/* Guard name label */}
        {guardName && (
          <div className="text-yellow-300 text-sm mb-2 font-bold tracking-wide uppercase">
            {guardName}:
          </div>
        )}
        
        {/* Main message with pixel-art style font */}
        <div 
          className="font-mono text-white text-lg leading-relaxed tracking-wide"
          style={{
            textShadow: '2px 2px 0px rgba(0,0,0,0.8)',
            fontFamily: '"Courier New", monospace',
            letterSpacing: '0.05em'
          }}
        >
          {message}
        </div>
        
        {/* Warning countdown */}
        {severity === 'warning' && turnsRemaining !== undefined && turnsRemaining > 0 && (
          <div className="mt-3 pt-2 border-t border-blue-600/50">
            <div className="text-xs text-blue-200 text-center font-mono">
              Move away in {turnsRemaining} turn{turnsRemaining !== 1 ? 's' : ''}...
            </div>
          </div>
        )}
        
        {/* Alert indicator */}
        {severity === 'alert' && (
          <div className="mt-3 pt-2 border-t border-red-600/50">
            <div className="text-xs text-red-300 text-center font-bold animate-pulse">
              ⚠ HOSTILE ⚠
            </div>
          </div>
        )}
      </div>
      
      {/* Optional decorative corners for FF6 feel */}
      <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white/30"></div>
      <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white/30"></div>
      <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white/30"></div>
      <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white/30"></div>
    </div>
  );
};

export default GuardWarningBox;