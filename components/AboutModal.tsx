import React from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-slate-600">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-cyan-400">About Universal History Simulator</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4 text-gray-300">
            <section>
              <h3 className="text-lg font-semibold text-green-400 mb-2">Created By</h3>
              <p>
                <strong>Benjamin Breen</strong><br />
                Historian, University of California Santa Cruz
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-green-400 mb-2">What is This?</h3>
              <p className="leading-relaxed">
                The Universal History Simulator is an educational history simulation game designed for both casual players 
                and history students. It combines procedurally generated worlds with historically-inspired cultures, 
                allowing players to explore and interact with dynamic civilizations across different time periods.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-green-400 mb-2">How to Play</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-cyan-300">Basic Controls</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Click and drag to move around the map</li>
                    <li>Scroll or use zoom controls to zoom in/out</li>
                    <li>Click on tiles, NPCs, and structures to interact</li>
                    <li>Use WASD or arrow keys to move your character</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-cyan-300">Game Features</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Explore procedurally generated historical regions</li>
                    <li>Interact with NPCs from various cultures and time periods</li>
                    <li>Trade, craft, and manage resources</li>
                    <li>Engage in combat and diplomacy</li>
                    <li>Experience dynamic day/night cycles and seasons</li>
                    <li>Discover historical artifacts and points of interest</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-cyan-300">Map Generation</h4>
                  <p className="ml-2">
                    Use the "Configure New Map" button in the top navigation to customize your world with different 
                    climates, terrains, and historical settings. Each world is unique and offers different challenges 
                    and opportunities for exploration.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-green-400 mb-2">Educational Purpose</h3>
              <p className="leading-relaxed">
                This simulator is designed to help students understand historical processes, cultural interactions, 
                and the development of civilizations over time. Through gameplay, players can explore concepts like 
                trade networks, cultural diffusion, technological advancement, and the impact of geography on history.
              </p>
            </section>

            <section className="pt-4 border-t border-slate-600">
              <p className="text-sm text-gray-400 text-center">
                Version 1.0 • © 2025 Benjamin Breen, UCSC
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;