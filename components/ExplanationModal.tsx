import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  explanation: string;
  subExplanation?: string;
  suggestion?: string;
}

const ExplanationModal: React.FC<ExplanationModalProps> = ({
  isOpen,
  onClose,
  title = "Setting Created",
  explanation,
  subExplanation,
  suggestion
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Background overlay - light tint */}
      <div 
        className="fixed inset-0 bg-black/20 z-50"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg">
        <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg shadow-2xl border border-slate-600/50 p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Title */}
          <h2 className="text-xl font-bold text-green-400 mb-4">{title}</h2>
          
          {/* Main explanation */}
          <div className="space-y-3">
            <p className="text-lg text-slate-200 leading-relaxed">
              {explanation}
            </p>
            
            {/* Reasoning */}
            {subExplanation && (
              <div className="border-l-2 border-green-500/30 pl-3">
                <p className="text-md text-slate-300 italic">
                  {subExplanation}
                </p>
              </div>
            )}
            
            {/* Suggestion */}
            {suggestion && (
              <div className="mt-4 p-3 bg-slate-700/50 rounded-md border border-slate-600/30">
                <p className="text-md text-amber-300">
                  <span className="font-semibold">Try this:</span> {suggestion}
                </p>
              </div>
            )}
          </div>
          
          {/* Continue button */}
          <button
            onClick={onClose}
            className="mt-6 w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-md font-medium rounded-md transition-colors"
          >
            Begin Adventure
          </button>
        </div>
      </div>
    </>
  );
};

export default ExplanationModal;