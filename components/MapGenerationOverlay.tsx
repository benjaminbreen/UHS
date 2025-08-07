/**
 * components/MapGenerationOverlay.tsx - Loading overlay for map generation
 * Provides user feedback during heavy procedural generation processes
 */

import React, { useEffect, useState } from 'react';

interface MapGenerationOverlayProps {
  isVisible: boolean;
  onCancel?: () => void;
}

const GENERATION_PHASES = [
  "Initializing world parameters...",
  "Generating terrain and landmasses...",
  "Creating biomes and climate zones...",
  "Placing rivers and water features...",
  "Generating cities and settlements...",
  "Populating with creatures and NPCs...",
  "Adding vegetation and resources...",
  "Calculating tile properties...",
  "Finalizing world generation..."
];

export const MapGenerationOverlay: React.FC<MapGenerationOverlayProps> = ({ 
  isVisible, 
  onCancel 
}) => {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setCurrentPhase(0);
      setShowTips(false);
      return;
    }

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        const increment = Math.random() * 3 + 1; // Random increment between 1-4%
        return Math.min(prev + increment, 100);
      });
    }, 200);

    // Update phases
    const phaseInterval = setInterval(() => {
      setCurrentPhase(prev => {
        if (prev >= GENERATION_PHASES.length - 1) return prev;
        return prev + 1;
      });
    }, 1200);

    // Show performance tips after a few seconds
    const tipTimer = setTimeout(() => {
      setShowTips(true);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(phaseInterval);
      clearTimeout(tipTimer);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="map-generation-overlay">
      <div className="map-generation-content">
        <h2>🌍 Generating New World</h2>
        <p>{GENERATION_PHASES[currentPhase] || "Processing..."}</p>
        
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="progress-text">{Math.floor(progress)}% complete</p>
        
        {showTips && (
          <div className="performance-tip">
            <h3>💡 Performance Tip</h3>
            <p>
              World generation runs in a background thread to keep the interface responsive. 
              Complex worlds with high economic activity take longer but create richer, 
              more detailed environments for exploration.
            </p>
          </div>
        )}

        {onCancel && (
          <button 
            onClick={onCancel}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: '1px solid #666',
              color: '#ccc',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel Generation
          </button>
        )}
      </div>
    </div>
  );
};

export default MapGenerationOverlay;