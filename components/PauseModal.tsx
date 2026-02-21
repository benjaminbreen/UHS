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
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: 'var(--surface-modal-overlay-bg)' }}
      onClick={onClose}
    >
      <div
        className="rounded-lg shadow-2xl px-6 py-4 text-center border"
        style={{
          backgroundColor: 'var(--surface-card-bg)',
          borderColor: 'var(--surface-card-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-3xl font-bold mb-2 tracking-wider" style={{ color: 'var(--text-primary)' }}>
          PAUSED
        </div>
        <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Press <kbd className="px-1.5 py-0.5 rounded border font-mono text-[10px]" style={{ backgroundColor: 'var(--surface-chip-bg)', borderColor: 'var(--surface-chip-border)' }}>ESC</kbd> or click to resume
        </div>
        <button
          onClick={onClose}
          className="ff-action-button px-4 py-1.5 text-sm rounded-lg flex items-center gap-2 mx-auto"
        >
          <Play className="w-3.5 h-3.5" />
          Resume
        </button>
      </div>
    </div>
  );
};

export default PauseModal;
