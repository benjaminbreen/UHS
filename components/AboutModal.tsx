import React from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 15, 30, 0.99) 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Header */}
        <div
          className="relative px-8 pt-10 pb-6"
          style={{
            background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.06) 0%, transparent 100%)'
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="text-center">
            <h1 className="brand-mark text-lg sm:text-xl mb-3">
              HISTORY SIMULATOR
            </h1>
            <p className="text-sm text-white/40 tracking-wide">
              An Educational History Simulation
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 overflow-y-auto max-h-[calc(85vh-180px)]">
          {/* Creator */}
          <div className="text-center mb-8 pb-8 border-b border-white/5">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/30 mb-2">Created by</p>
            <p className="text-lg font-medium text-white/90">Benjamin Breen</p>
            <p className="text-sm text-white/50">Historian, University of California Santa Cruz</p>
          </div>

          {/* About */}
          <div className="mb-8">
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-emerald-400/70 mb-4">About</h2>
            <p className="text-[15px] leading-relaxed text-white/70" style={{ fontFamily: "'Iowan Old Style', 'Palatino', Georgia, serif" }}>
              History Simulator is an educational game that combines procedurally generated worlds
              with historically-grounded cultures. Explore and interact with dynamic civilizations
              across different time periods, from ancient empires to early modern societies.
            </p>
          </div>

          {/* How to Play - Two Columns */}
          <div className="mb-8">
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-emerald-400/70 mb-4">How to Play</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Controls</h3>
                <ul className="space-y-2 text-sm text-white/50">
                  <li className="flex items-start gap-2">
                    <span className="text-white/30 mt-0.5">—</span>
                    <span>WASD or arrow keys to move</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/30 mt-0.5">—</span>
                    <span>Click and drag to pan the map</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/30 mt-0.5">—</span>
                    <span>Scroll to zoom in/out</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/30 mt-0.5">—</span>
                    <span>Click NPCs and structures to interact</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Features</h3>
                <ul className="space-y-2 text-sm text-white/50">
                  <li className="flex items-start gap-2">
                    <span className="text-white/30 mt-0.5">—</span>
                    <span>Procedural historical regions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/30 mt-0.5">—</span>
                    <span>Trade, craft, and explore</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/30 mt-0.5">—</span>
                    <span>Dynamic day/night and seasons</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/30 mt-0.5">—</span>
                    <span>Historical artifacts and events</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* World Creation */}
          <div className="mb-8 p-5 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-emerald-400/70 mb-3">World Creation</h2>
            <p className="text-sm text-white/50 leading-relaxed">
              Use the <span className="text-white/70">WorldWeaver</span> input in the navigation bar to describe any historical
              scenario. The AI will generate a matching world with appropriate geography, culture, and characters.
            </p>
          </div>

          {/* Educational Purpose */}
          <div className="mb-8">
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-emerald-400/70 mb-4">Educational Purpose</h2>
            <p className="text-sm text-white/50 leading-relaxed">
              Designed to help students understand historical processes, cultural interactions,
              and the development of civilizations. Explore trade networks, cultural diffusion,
              technological change, and the impact of geography on history.
            </p>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-white/5 flex items-center justify-between">
            <p className="text-[11px] text-white/25">
              Version 1.0
            </p>
            <p className="text-[11px] text-white/25">
              © 2025 Benjamin Breen, UCSC
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
