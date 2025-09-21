/**
 * Unified Animation Service
 * Consolidates all animation loops into a single RAF for better performance
 * Can be toggled on/off via feature flag for easy rollback
 */

export type AnimationPriority = 'critical' | 'high' | 'normal' | 'low';
export type AnimationFrequency = 'every-frame' | 'high-freq' | 'low-freq';

interface AnimationSubscriber {
  id: string;
  priority: AnimationPriority;
  frequency: AnimationFrequency;
  lastUpdate: number;
  updateInterval: number; // ms between updates
  callback: (deltaTime: number, timestamp: number) => void;
  enabled: boolean;
}

interface QualitySettings {
  frameSkip: number;
  lowPriorityInterval: number;
  normalPriorityInterval: number;
  disableLowPriority: boolean;
}

class UnifiedAnimationService {
  private static instance: UnifiedAnimationService | null = null;

  private mainLoopId: number | null = null;
  private subscribers = new Map<string, AnimationSubscriber>();
  private lastFrameTime = 0;
  private frameCount = 0;
  private isRunning = false;

  // Performance monitoring
  private frameTimes: number[] = [];
  private currentQuality: 'high' | 'normal' | 'low' = 'normal';

  // Safari detection and optimization
  private isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // Feature flag - can be toggled to disable unified animations
  public enabled = true;

  // Quality presets
  private qualityPresets: Record<string, QualitySettings> = {
    high: {
      frameSkip: 1,
      lowPriorityInterval: 250,
      normalPriorityInterval: 100,
      disableLowPriority: false
    },
    normal: {
      frameSkip: 1,
      lowPriorityInterval: 500,
      normalPriorityInterval: 250,
      disableLowPriority: false
    },
    low: {
      frameSkip: 2,
      lowPriorityInterval: 1000,
      normalPriorityInterval: 500,
      disableLowPriority: true
    }
  };

  private constructor() {
    // Apply Safari-specific settings
    if (this.isSafari) {
      this.qualityPresets.normal.frameSkip = 2;
      this.qualityPresets.high.normalPriorityInterval = 150;
    }
  }

  static getInstance(): UnifiedAnimationService {
    if (!UnifiedAnimationService.instance) {
      UnifiedAnimationService.instance = new UnifiedAnimationService();
    }
    return UnifiedAnimationService.instance;
  }

  /**
   * Subscribe an animation callback
   */
  subscribe(config: Omit<AnimationSubscriber, 'lastUpdate' | 'enabled'>): void {
    const subscriber: AnimationSubscriber = {
      ...config,
      lastUpdate: 0,
      enabled: true
    };

    this.subscribers.set(config.id, subscriber);

    // Start the loop if this is the first subscriber
    if (this.subscribers.size === 1 && !this.isRunning) {
      this.start();
    }
  }

  /**
   * Unsubscribe an animation
   */
  unsubscribe(id: string): void {
    this.subscribers.delete(id);

    // Stop the loop if no more subscribers
    if (this.subscribers.size === 0 && this.isRunning) {
      this.stop();
    }
  }

  /**
   * Temporarily disable/enable a subscriber
   */
  setEnabled(id: string, enabled: boolean): void {
    const subscriber = this.subscribers.get(id);
    if (subscriber) {
      subscriber.enabled = enabled;
    }
  }

  /**
   * Start the main animation loop
   */
  private start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.mainLoop(this.lastFrameTime);
  }

  /**
   * Stop the main animation loop
   */
  private stop(): void {
    if (this.mainLoopId !== null) {
      cancelAnimationFrame(this.mainLoopId);
      this.mainLoopId = null;
    }
    this.isRunning = false;
  }

  /**
   * Main animation loop
   */
  private mainLoop = (timestamp: number): void => {
    if (!this.isRunning) return;

    const deltaTime = timestamp - this.lastFrameTime;
    this.frameCount++;

    // Record performance
    this.recordFrameTime(deltaTime);

    // Auto-adjust quality based on performance
    this.adjustQuality();

    const quality = this.qualityPresets[this.currentQuality];

    // Skip frames based on quality settings
    if (this.frameCount % quality.frameSkip === 0) {
      // Process animations by priority
      this.processAnimations('critical', timestamp, deltaTime, 0);

      // Only process lower priorities if we have frame budget
      if (deltaTime < 18) { // ~55fps threshold
        this.processAnimations('high', timestamp, deltaTime, 0);

        if (deltaTime < 14 && !quality.disableLowPriority) { // ~70fps threshold
          this.processAnimations('normal', timestamp, deltaTime, quality.normalPriorityInterval);

          if (deltaTime < 10) { // Excellent performance
            this.processAnimations('low', timestamp, deltaTime, quality.lowPriorityInterval);
          }
        }
      }
    }

    this.lastFrameTime = timestamp;
    this.mainLoopId = requestAnimationFrame(this.mainLoop);
  };

  /**
   * Process animations for a specific priority level
   */
  private processAnimations(
    priority: AnimationPriority,
    timestamp: number,
    deltaTime: number,
    minInterval: number
  ): void {
    for (const [id, subscriber] of this.subscribers) {
      if (!subscriber.enabled || subscriber.priority !== priority) continue;

      // Check if enough time has passed based on subscriber's update interval
      const timeSinceLastUpdate = timestamp - subscriber.lastUpdate;
      const requiredInterval = Math.max(subscriber.updateInterval, minInterval);

      if (timeSinceLastUpdate >= requiredInterval) {
        try {
          subscriber.callback(deltaTime, timestamp);
          subscriber.lastUpdate = timestamp;
        } catch (error) {
          console.error(`[UnifiedAnimation] Error in subscriber ${id}:`, error);
        }
      }
    }
  }

  /**
   * Record frame time for performance monitoring
   */
  private recordFrameTime(deltaTime: number): void {
    this.frameTimes.push(deltaTime);

    // Keep last 60 frames
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }
  }

  /**
   * Auto-adjust quality based on average frame time
   */
  private adjustQuality(): void {
    if (this.frameTimes.length < 30) return; // Need enough samples

    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;

    // Adjust quality based on average frame time
    if (avgFrameTime > 20 && this.currentQuality !== 'low') {
      // Below 50 FPS, reduce quality
      this.currentQuality = 'low';
      // console.log('[UnifiedAnimation] Switching to low quality mode');
    } else if (avgFrameTime < 14 && this.currentQuality === 'low') {
      // Above 70 FPS, can increase quality
      this.currentQuality = 'normal';
      // console.log('[UnifiedAnimation] Switching to normal quality mode');
    } else if (avgFrameTime < 10 && this.currentQuality === 'normal' && !this.isSafari) {
      // Excellent performance, max quality (not on Safari)
      this.currentQuality = 'high';
      // console.log('[UnifiedAnimation] Switching to high quality mode');
    }
  }

  /**
   * Get current performance stats
   */
  getStats(): {
    fps: number;
    quality: string;
    subscriberCount: number;
    avgFrameTime: number;
  } {
    const avgFrameTime = this.frameTimes.length > 0
      ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
      : 0;

    return {
      fps: avgFrameTime > 0 ? Math.round(1000 / avgFrameTime) : 0,
      quality: this.currentQuality,
      subscriberCount: this.subscribers.size,
      avgFrameTime
    };
  }

  /**
   * Manual quality override
   */
  setQuality(quality: 'high' | 'normal' | 'low'): void {
    this.currentQuality = quality;
  }

  /**
   * Check if service is enabled (feature flag)
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Toggle unified animations on/off
   */
  toggle(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    } else if (this.subscribers.size > 0) {
      this.start();
    }
  }
}

// Export singleton instance
export const unifiedAnimationService = UnifiedAnimationService.getInstance();

// Export convenience function for React hooks
export function useUnifiedAnimation(
  id: string,
  config: {
    priority: AnimationPriority;
    frequency: AnimationFrequency;
    updateInterval: number;
    callback: (deltaTime: number, timestamp: number) => void;
  },
  deps: React.DependencyList = []
): void {
  const { useEffect } = require('react');

  useEffect(() => {
    if (!unifiedAnimationService.isEnabled()) return;

    unifiedAnimationService.subscribe({
      id,
      ...config
    });

    return () => {
      unifiedAnimationService.unsubscribe(id);
    };
  }, deps);
}