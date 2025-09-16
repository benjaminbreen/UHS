/**
 * components/mobile/MobileControls.tsx
 * Mobile D-pad controls for touch movement
 */
import React, { useState, useCallback } from 'react';
import { triggerHaptic } from '../../utils/deviceUtils';

interface MobileControlsProps {
  onMove: (direction: 'north' | 'south' | 'east' | 'west') => void;
  disabled?: boolean;
}

const MobileControls: React.FC<MobileControlsProps> = ({ onMove, disabled = false }) => {
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const swipeThreshold = 50; // minimum distance for a swipe
  
  const handleTouchStart = useCallback((direction: 'north' | 'south' | 'east' | 'west') => {
    if (disabled) return;
    
    setActiveButton(direction);
    triggerHaptic('light');
    onMove(direction);
  }, [onMove, disabled]);
  
  const handleTouchEnd = useCallback(() => {
    setActiveButton(null);
  }, []);

  // Handle swipe gestures on the center dot
  const handleSwipeStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  }, [disabled]);

  const handleSwipeEnd = useCallback((e: React.TouchEvent) => {
    if (disabled || !touchStart) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    // Determine if this was a swipe
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > swipeThreshold || absY > swipeThreshold) {
      triggerHaptic('light');

      // Determine direction based on larger delta
      if (absX > absY) {
        // Horizontal swipe
        onMove(deltaX > 0 ? 'east' : 'west');
      } else {
        // Vertical swipe
        onMove(deltaY > 0 ? 'south' : 'north');
      }
    }

    setTouchStart(null);
  }, [disabled, touchStart, onMove, swipeThreshold]);
  
  const buttonStyle = (direction: string): React.CSSProperties => ({
    position: 'absolute',
    width: '50px',
    height: '50px',
    backgroundColor: activeButton === direction
      ? 'rgba(255, 255, 255, 0.2)'
      : 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    color: activeButton === direction ? '#fff' : 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    webkitBackdropFilter: 'blur(10px)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.1s ease',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
    opacity: disabled ? 0.3 : 1,
    transform: activeButton === direction ? 'scale(0.95)' : 'scale(1)',
  });
  
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 'calc(env(safe-area-inset-bottom) + 120px)',
    right: 'calc(env(safe-area-inset-right) + 15px)',
    width: '150px',
    height: '150px',
    zIndex: 1000,
    pointerEvents: 'none',
  };
  
  const centerDotStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50px',
    left: '50px',
    width: '50px',
    height: '50px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '8px',
    color: 'rgba(255, 255, 255, 0.4)',
  };
  
  return (
    <div style={containerStyle}>
      {/* Up button */}
      <button
        style={{
          ...buttonStyle('north'),
          top: '0',
          left: '50px',
          pointerEvents: 'auto',
        }}
        onTouchStart={() => handleTouchStart('north')}
        onTouchEnd={handleTouchEnd}
        onMouseDown={() => handleTouchStart('north')}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        disabled={disabled}
        aria-label="Move North"
      >
        ↑
      </button>
      
      {/* Down button */}
      <button
        style={{
          ...buttonStyle('south'),
          bottom: '0',
          left: '50px',
          pointerEvents: 'auto',
        }}
        onTouchStart={() => handleTouchStart('south')}
        onTouchEnd={handleTouchEnd}
        onMouseDown={() => handleTouchStart('south')}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        disabled={disabled}
        aria-label="Move South"
      >
        ↓
      </button>
      
      {/* Left button */}
      <button
        style={{
          ...buttonStyle('west'),
          top: '50px',
          left: '0',
          pointerEvents: 'auto',
        }}
        onTouchStart={() => handleTouchStart('west')}
        onTouchEnd={handleTouchEnd}
        onMouseDown={() => handleTouchStart('west')}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        disabled={disabled}
        aria-label="Move West"
      >
        ←
      </button>
      
      {/* Right button */}
      <button
        style={{
          ...buttonStyle('east'),
          top: '50px',
          right: '0',
          pointerEvents: 'auto',
        }}
        onTouchStart={() => handleTouchStart('east')}
        onTouchEnd={handleTouchEnd}
        onMouseDown={() => handleTouchStart('east')}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        disabled={disabled}
        aria-label="Move East"
      >
        →
      </button>
      
      {/* Center dot - now with swipe support */}
      <div
        style={{
          ...centerDotStyle,
          cursor: disabled ? 'not-allowed' : 'grab',
          touchAction: 'none'
        }}
        onTouchStart={handleSwipeStart}
        onTouchEnd={handleSwipeEnd}
        title="Swipe to move"
      >
        ✦
      </div>
    </div>
  );
};

export default React.memo(MobileControls);