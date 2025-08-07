import { useEffect, useRef, useState, useCallback } from 'react';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsed: number;
  memoryLimit: number;
  renderCount: number;
  lastRenderTime: number;
  avgFrameTime: number;
  minFps: number;
  maxFps: number;
}

export const usePerformanceMonitor = (enabled: boolean = true) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    memoryUsed: 0,
    memoryLimit: 0,
    renderCount: 0,
    lastRenderTime: 0,
    avgFrameTime: 0,
    minFps: 60,
    maxFps: 0,
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const frameTimes = useRef<number[]>([]);
  const renderCountRef = useRef(0);
  const animationFrameRef = useRef<number>();

  const measurePerformance = useCallback(() => {
    if (!enabled) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - lastTimeRef.current;

    // Calculate FPS
    frameCountRef.current++;
    if (deltaTime >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / deltaTime);
      
      // Track frame times for average
      frameTimes.current.push(deltaTime / frameCountRef.current);
      if (frameTimes.current.length > 60) {
        frameTimes.current.shift();
      }
      
      const avgFrameTime = frameTimes.current.reduce((a, b) => a + b, 0) / frameTimes.current.length;

      // Get memory info if available (Chrome/Edge)
      let memoryUsed = 0;
      let memoryLimit = 0;
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        memoryUsed = Math.round(memory.usedJSHeapSize / 1048576); // Convert to MB
        memoryLimit = Math.round(memory.jsHeapSizeLimit / 1048576);
      }

      setMetrics(prev => ({
        fps,
        frameTime: Math.round(deltaTime / frameCountRef.current * 100) / 100,
        memoryUsed,
        memoryLimit,
        renderCount: renderCountRef.current,
        lastRenderTime: currentTime,
        avgFrameTime: Math.round(avgFrameTime * 100) / 100,
        minFps: Math.min(prev.minFps, fps),
        maxFps: Math.max(prev.maxFps, fps),
      }));

      frameCountRef.current = 0;
      lastTimeRef.current = currentTime;
    }

    animationFrameRef.current = requestAnimationFrame(measurePerformance);
  }, [enabled]);

  // Track render counts
  const incrementRenderCount = useCallback(() => {
    renderCountRef.current++;
  }, []);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    renderCountRef.current = 0;
    frameTimes.current = [];
    setMetrics(prev => ({
      ...prev,
      renderCount: 0,
      minFps: 60,
      maxFps: 0,
    }));
  }, []);

  useEffect(() => {
    if (enabled) {
      animationFrameRef.current = requestAnimationFrame(measurePerformance);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, measurePerformance]);

  return {
    metrics,
    incrementRenderCount,
    resetMetrics,
  };
};