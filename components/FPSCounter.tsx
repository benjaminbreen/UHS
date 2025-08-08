/**
 * FPS Counter Component
 * Displays real-time FPS in the corner of the screen
 */

import React, { useEffect, useState, useRef } from 'react';
import { isSafari } from '../utils/safariUtils';

interface FPSCounterProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const FPSCounter: React.FC<FPSCounterProps> = ({ position = 'top-right' }) => {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fpsHistory = useRef<number[]>([]);

  useEffect(() => {
    let animationId: number;

    const measureFPS = () => {
      const now = performance.now();
      const delta = now - lastTime.current;
      
      frameCount.current++;
      
      // Update FPS every 500ms for stability
      if (delta >= 500) {
        const currentFPS = Math.round((frameCount.current * 1000) / delta);
        fpsHistory.current.push(currentFPS);
        
        // Keep only last 3 measurements for averaging
        if (fpsHistory.current.length > 3) {
          fpsHistory.current.shift();
        }
        
        // Calculate average FPS
        const avgFPS = Math.round(
          fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length
        );
        
        setFps(avgFPS);
        frameCount.current = 0;
        lastTime.current = now;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    measureFPS();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  const getFPSColor = () => {
    if (fps >= 30) return 'text-green-400';
    if (fps >= 15) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <div 
      className={`fixed ${getPositionClasses()} z-40 bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-2 shadow-lg pointer-events-none`}
    >
      <div className="flex items-center gap-2">
        <span className={`text-2xl font-bold font-mono ${getFPSColor()}`}>
          {fps}
        </span>
        <div className="text-xs text-slate-400">
          <div>FPS</div>
          {isSafari() && (
            <div className="text-yellow-500 font-semibold">Safari</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FPSCounter;