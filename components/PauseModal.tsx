import React from 'react';
import { Play } from 'lucide-react';

interface PauseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PauseModal: React.FC<PauseModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-slate-800/95 border border-slate-600 rounded-lg shadow-2xl px-6 py-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-3xl font-bold text-white mb-2 tracking-wider">
          PAUSED
        </div>
        <div className="text-slate-400 text-xs mb-3">
          Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded border border-slate-600 font-mono text-[10px]">ESC</kbd> or click to resume
        </div>
        <button
          onClick={onClose}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2 mx-auto"
        >
          <Play className="w-3.5 h-3.5" />
          Resume
        </button>
      </div>
    </div>
  );
};

export default PauseModal;
