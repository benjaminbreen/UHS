/**
 * Hook to integrate unified animations into MapDisplayOptimized
 * This replaces multiple animation loops with a single coordinated system
 * Can be toggled on/off via ENABLE_UNIFIED_ANIMATIONS flag
 */

import { useEffect, useRef, useCallback } from 'react';
import { unifiedAnimationService } from '../services/unifiedAnimationService';
import { fireService } from '../services/fireService';
import { simpleBoatService } from '../services/simpleBoatService';

// FEATURE FLAG - Set to false to disable unified animations and use old system
export const ENABLE_UNIFIED_ANIMATIONS = true;

interface UnifiedAnimationConfig {
  // Fire animations
  onFireUpdate?: () => void;

  // Boat animations
  onBoatUpdate?: () => void;
  boatUpdateInterval?: number;

  // Camera smoothing
  onCameraSmooth?: (deltaTime: number) => void;
  cameraTargetX?: number | null;
  cameraTargetY?: number | null;

  // Zoom animations
  onZoomAnimation?: (progress: number) => void;
  zoomAnimationActive?: boolean;

  // Player movement animation
  onPlayerMove?: (deltaTime: number) => void;
  playerMoving?: boolean;

  // Component cleanup
  componentId: string;
}

export function useUnifiedAnimations(config: UnifiedAnimationConfig) {
  const animationRefs = useRef<{
    fireLastUpdate: number;
    boatLastUpdate: number;
    zoomStartTime: number;
    zoomDuration: number;
  }>({
    fireLastUpdate: 0,
    boatLastUpdate: 0,
    zoomStartTime: 0,
    zoomDuration: 0
  });

  // Fire animation handler
  const handleFireAnimation = useCallback((deltaTime: number, timestamp: number) => {
    if (config.onFireUpdate && fireService.getAllFires().length > 0) {
      config.onFireUpdate();
    }
  }, [config.onFireUpdate]);

  // Boat animation handler
  const handleBoatAnimation = useCallback((deltaTime: number, timestamp: number) => {
    if (config.onBoatUpdate) {
      simpleBoatService.update();
      config.onBoatUpdate();
    }
  }, [config.onBoatUpdate]);

  // Camera smoothing handler
  const handleCameraSmooth = useCallback((deltaTime: number, timestamp: number) => {
    if (config.onCameraSmooth &&
        (config.cameraTargetX !== null || config.cameraTargetY !== null)) {
      config.onCameraSmooth(deltaTime);
    }
  }, [config.onCameraSmooth, config.cameraTargetX, config.cameraTargetY]);

  // Zoom animation handler
  const handleZoomAnimation = useCallback((deltaTime: number, timestamp: number) => {
    if (config.onZoomAnimation && config.zoomAnimationActive) {
      if (animationRefs.current.zoomStartTime === 0) {
        animationRefs.current.zoomStartTime = timestamp;
        animationRefs.current.zoomDuration = 300; // 300ms zoom duration
      }

      const elapsed = timestamp - animationRefs.current.zoomStartTime;
      const progress = Math.min(elapsed / animationRefs.current.zoomDuration, 1);

      config.onZoomAnimation(progress);

      if (progress >= 1) {
        animationRefs.current.zoomStartTime = 0;
      }
    }
  }, [config.onZoomAnimation, config.zoomAnimationActive]);

  // Player movement animation handler
  const handlePlayerMovement = useCallback((deltaTime: number, timestamp: number) => {
    if (config.onPlayerMove && config.playerMoving) {
      config.onPlayerMove(deltaTime);
    }
  }, [config.onPlayerMove, config.playerMoving]);

  useEffect(() => {
    if (!ENABLE_UNIFIED_ANIMATIONS) return;

    const service = unifiedAnimationService;

    // Subscribe fire animations (normal priority, 4 FPS)
    service.subscribe({
      id: `${config.componentId}-fire`,
      priority: 'normal',
      frequency: 'low-freq',
      updateInterval: 250, // 4 FPS
      callback: handleFireAnimation
    });

    // Subscribe boat animations (low priority, 2 FPS)
    service.subscribe({
      id: `${config.componentId}-boat`,
      priority: 'low',
      frequency: 'low-freq',
      updateInterval: config.boatUpdateInterval || 500, // 2 FPS default
      callback: handleBoatAnimation
    });

    // Subscribe camera smoothing (critical priority, every frame)
    service.subscribe({
      id: `${config.componentId}-camera`,
      priority: 'critical',
      frequency: 'every-frame',
      updateInterval: 0, // Every frame
      callback: handleCameraSmooth
    });

    // Subscribe zoom animations (high priority when active)
    service.subscribe({
      id: `${config.componentId}-zoom`,
      priority: 'high',
      frequency: 'every-frame',
      updateInterval: 0, // Every frame during zoom
      callback: handleZoomAnimation
    });

    // Subscribe player movement (high priority when moving)
    service.subscribe({
      id: `${config.componentId}-player`,
      priority: 'high',
      frequency: 'high-freq',
      updateInterval: 16, // 60 FPS when moving
      callback: handlePlayerMovement
    });

    // Enable/disable based on activity
    service.setEnabled(`${config.componentId}-zoom`, config.zoomAnimationActive || false);
    service.setEnabled(`${config.componentId}-player`, config.playerMoving || false);

    return () => {
      // Cleanup all subscriptions
      service.unsubscribe(`${config.componentId}-fire`);
      service.unsubscribe(`${config.componentId}-boat`);
      service.unsubscribe(`${config.componentId}-camera`);
      service.unsubscribe(`${config.componentId}-zoom`);
      service.unsubscribe(`${config.componentId}-player`);
    };
  }, [
    config.componentId,
    config.boatUpdateInterval,
    handleFireAnimation,
    handleBoatAnimation,
    handleCameraSmooth,
    handleZoomAnimation,
    handlePlayerMovement
  ]);

  // Update enabled states when activity changes
  useEffect(() => {
    if (!ENABLE_UNIFIED_ANIMATIONS) return;

    unifiedAnimationService.setEnabled(
      `${config.componentId}-zoom`,
      config.zoomAnimationActive || false
    );
  }, [config.componentId, config.zoomAnimationActive]);

  useEffect(() => {
    if (!ENABLE_UNIFIED_ANIMATIONS) return;

    unifiedAnimationService.setEnabled(
      `${config.componentId}-player`,
      config.playerMoving || false
    );
  }, [config.componentId, config.playerMoving]);

  // Return stats for debugging
  return {
    enabled: ENABLE_UNIFIED_ANIMATIONS,
    stats: ENABLE_UNIFIED_ANIMATIONS ? unifiedAnimationService.getStats() : null
  };
}

/**
 * Hook to display animation performance stats
 */
export function useAnimationStats() {
  const stats = useRef(unifiedAnimationService.getStats());

  useEffect(() => {
    if (!ENABLE_UNIFIED_ANIMATIONS) return;

    const interval = setInterval(() => {
      stats.current = unifiedAnimationService.getStats();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return ENABLE_UNIFIED_ANIMATIONS ? stats.current : null;
}