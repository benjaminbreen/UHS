/**
 * Performance monitoring and diagnostics utility
 * Provides detailed performance metrics and Safari-specific analysis
 */

import { isSafari } from './safariUtils';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage?: number;
  renderTime: number;
  scriptTime: number;
  layoutTime: number;
  paintTime: number;
  compositeTime: number;
  domNodes: number;
  svgElements: number;
  canvasElements: number;
  activeAnimations: number;
  cssTransforms: number;
  cssFilters: number;
  eventListeners: number;
  timestamp: number;
}

export interface PerformanceReport {
  current: PerformanceMetrics;
  average: PerformanceMetrics;
  min: PerformanceMetrics;
  max: PerformanceMetrics;
  bottlenecks: string[];
  recommendations: string[];
  browserInfo: {
    isSafari: boolean;
    userAgent: string;
    gpu: string;
    cores: number;
    memory: number;
  };
}

class PerformanceMonitor {
  private frameCount = 0;
  private lastFrameTime = 0;
  private frameStartTime = 0;
  private frameTimes: number[] = [];
  private metrics: PerformanceMetrics[] = [];
  private maxMetricsHistory = 100;
  private isMonitoring = false;
  private rafId: number | null = null;
  private observer: PerformanceObserver | null = null;
  private renderMetrics = {
    renderTime: 0,
    scriptTime: 0,
    layoutTime: 0,
    paintTime: 0,
    compositeTime: 0
  };

  constructor() {
    this.setupPerformanceObserver();
  }

  private setupPerformanceObserver() {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            switch (entry.name) {
              case 'render':
                this.renderMetrics.renderTime = entry.duration;
                break;
              case 'script':
                this.renderMetrics.scriptTime = entry.duration;
                break;
              case 'layout':
                this.renderMetrics.layoutTime = entry.duration;
                break;
              case 'paint':
                this.renderMetrics.paintTime = entry.duration;
                break;
            }
          }
        }
      });

      this.observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
    } catch (e) {
      console.warn('PerformanceObserver not available:', e);
    }
  }

  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.frameTimes = [];
    this.metrics = [];
    
    console.log('🎬 Performance Monitor Started');
    console.log('Browser:', isSafari() ? 'Safari' : 'Other');
    console.log('User Agent:', navigator.userAgent);
    
    this.measureFrame();
  }

  stop() {
    this.isMonitoring = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    console.log('🛑 Performance Monitor Stopped');
  }

  private measureFrame = () => {
    if (!this.isMonitoring) return;

    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    
    // Track frame times for FPS calculation
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }

    // Calculate FPS
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const fps = 1000 / avgFrameTime;

    // Collect DOM metrics
    const metrics: PerformanceMetrics = {
      fps: Math.round(fps),
      frameTime: avgFrameTime,
      renderTime: this.renderMetrics.renderTime,
      scriptTime: this.renderMetrics.scriptTime,
      layoutTime: this.renderMetrics.layoutTime,
      paintTime: this.renderMetrics.paintTime,
      compositeTime: this.renderMetrics.compositeTime,
      domNodes: document.getElementsByTagName('*').length,
      svgElements: document.getElementsByTagName('svg').length,
      canvasElements: document.getElementsByTagName('canvas').length,
      activeAnimations: this.countActiveAnimations(),
      cssTransforms: this.countCSSTransforms(),
      cssFilters: this.countCSSFilters(),
      eventListeners: this.countEventListeners(),
      timestamp: now
    };

    // Add memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metrics.memoryUsage = memory.usedJSHeapSize / 1048576; // Convert to MB
    }

    this.metrics.push(metrics);
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics.shift();
    }

    // Log every 60 frames (approximately once per second)
    this.frameCount++;
    if (this.frameCount % 60 === 0) {
      this.logMetrics(metrics);
      this.detectBottlenecks(metrics);
    }

    this.lastFrameTime = now;
    this.rafId = requestAnimationFrame(this.measureFrame);
  };

  private countActiveAnimations(): number {
    // Count CSS animations and transitions
    let count = 0;
    const elements = document.querySelectorAll('*');
    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.animationName !== 'none' || 
          style.transition !== 'none' && style.transition !== 'all 0s ease 0s') {
        count++;
      }
    });
    return count;
  }

  private countCSSTransforms(): number {
    let count = 0;
    const elements = document.querySelectorAll('*');
    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.transform !== 'none') {
        count++;
      }
    });
    return count;
  }

  private countCSSFilters(): number {
    let count = 0;
    const elements = document.querySelectorAll('*');
    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      if (style.filter !== 'none' || (style as any).backdropFilter !== 'none') {
        count++;
      }
    });
    return count;
  }

  private countEventListeners(): number {
    // This is an approximation - counts elements with common event attributes
    const eventAttributes = ['onclick', 'onmouseover', 'onmouseout', 'onmousemove', 'ontouchstart', 'ontouchmove'];
    let count = 0;
    
    eventAttributes.forEach(attr => {
      count += document.querySelectorAll(`[${attr}]`).length;
    });
    
    return count;
  }

  private logMetrics(metrics: PerformanceMetrics) {
    const emoji = metrics.fps > 30 ? '✅' : metrics.fps > 15 ? '⚠️' : '🔴';
    
    console.group(`${emoji} Performance Metrics (${new Date().toLocaleTimeString()})`);
    console.log(`FPS: ${metrics.fps} | Frame Time: ${metrics.frameTime.toFixed(2)}ms`);
    console.log(`DOM Nodes: ${metrics.domNodes} | SVG: ${metrics.svgElements} | Canvas: ${metrics.canvasElements}`);
    console.log(`Active Animations: ${metrics.activeAnimations} | Transforms: ${metrics.cssTransforms} | Filters: ${metrics.cssFilters}`);
    
    if (metrics.memoryUsage) {
      console.log(`Memory Usage: ${metrics.memoryUsage.toFixed(2)} MB`);
    }
    
    if (isSafari()) {
      console.log('🔶 Safari Detected - Known Performance Issues:');
      console.log('  - Poor SVG rendering performance');
      console.log('  - Inefficient CSS filter processing');
      console.log('  - Slower JavaScript execution');
      console.log('  - Limited GPU acceleration');
    }
    
    console.groupEnd();
  }

  private detectBottlenecks(metrics: PerformanceMetrics): string[] {
    const bottlenecks: string[] = [];
    
    // FPS issues
    if (metrics.fps < 10) {
      bottlenecks.push('CRITICAL: FPS below 10 - severe performance issues');
    } else if (metrics.fps < 30) {
      bottlenecks.push('WARNING: FPS below 30 - noticeable lag');
    }

    // DOM complexity
    if (metrics.domNodes > 3000) {
      bottlenecks.push(`HIGH DOM COUNT: ${metrics.domNodes} nodes (recommended: < 1500)`);
    }

    // SVG performance (especially bad on Safari)
    if (metrics.svgElements > 100) {
      bottlenecks.push(`MANY SVG ELEMENTS: ${metrics.svgElements} (Safari struggles with > 50)`);
      if (isSafari()) {
        bottlenecks.push('SAFARI SVG ISSUE: Consider reducing SVG complexity or using Canvas');
      }
    }

    // CSS Filters (very bad on Safari)
    if (metrics.cssFilters > 10) {
      bottlenecks.push(`CSS FILTERS DETECTED: ${metrics.cssFilters} elements with filters`);
      if (isSafari()) {
        bottlenecks.push('SAFARI FILTER ISSUE: CSS filters cause severe performance degradation');
      }
    }

    // Animations
    if (metrics.activeAnimations > 20) {
      bottlenecks.push(`MANY ANIMATIONS: ${metrics.activeAnimations} active animations`);
    }

    // Transforms
    if (metrics.cssTransforms > 100) {
      bottlenecks.push(`MANY TRANSFORMS: ${metrics.cssTransforms} elements with transforms`);
    }

    // Memory
    if (metrics.memoryUsage && metrics.memoryUsage > 500) {
      bottlenecks.push(`HIGH MEMORY: ${metrics.memoryUsage.toFixed(0)}MB used`);
    }

    if (bottlenecks.length > 0) {
      console.warn('🚨 Performance Bottlenecks Detected:', bottlenecks);
    }

    return bottlenecks;
  }

  generateReport(): PerformanceReport {
    if (this.metrics.length === 0) {
      return this.getEmptyReport();
    }

    const current = this.metrics[this.metrics.length - 1];
    const average = this.calculateAverageMetrics();
    const min = this.calculateMinMetrics();
    const max = this.calculateMaxMetrics();
    const bottlenecks = this.detectBottlenecks(current);
    const recommendations = this.generateRecommendations(current, bottlenecks);

    return {
      current,
      average,
      min,
      max,
      bottlenecks,
      recommendations,
      browserInfo: {
        isSafari: isSafari(),
        userAgent: navigator.userAgent,
        gpu: this.getGPUInfo(),
        cores: navigator.hardwareConcurrency || 0,
        memory: (navigator as any).deviceMemory || 0
      }
    };
  }

  private calculateAverageMetrics(): PerformanceMetrics {
    const sum = this.metrics.reduce((acc, m) => ({
      fps: acc.fps + m.fps,
      frameTime: acc.frameTime + m.frameTime,
      memoryUsage: (acc.memoryUsage || 0) + (m.memoryUsage || 0),
      renderTime: acc.renderTime + m.renderTime,
      scriptTime: acc.scriptTime + m.scriptTime,
      layoutTime: acc.layoutTime + m.layoutTime,
      paintTime: acc.paintTime + m.paintTime,
      compositeTime: acc.compositeTime + m.compositeTime,
      domNodes: acc.domNodes + m.domNodes,
      svgElements: acc.svgElements + m.svgElements,
      canvasElements: acc.canvasElements + m.canvasElements,
      activeAnimations: acc.activeAnimations + m.activeAnimations,
      cssTransforms: acc.cssTransforms + m.cssTransforms,
      cssFilters: acc.cssFilters + m.cssFilters,
      eventListeners: acc.eventListeners + m.eventListeners,
      timestamp: 0
    }), this.getEmptyMetrics());

    const count = this.metrics.length;
    return {
      fps: Math.round(sum.fps / count),
      frameTime: sum.frameTime / count,
      memoryUsage: sum.memoryUsage ? sum.memoryUsage / count : undefined,
      renderTime: sum.renderTime / count,
      scriptTime: sum.scriptTime / count,
      layoutTime: sum.layoutTime / count,
      paintTime: sum.paintTime / count,
      compositeTime: sum.compositeTime / count,
      domNodes: Math.round(sum.domNodes / count),
      svgElements: Math.round(sum.svgElements / count),
      canvasElements: Math.round(sum.canvasElements / count),
      activeAnimations: Math.round(sum.activeAnimations / count),
      cssTransforms: Math.round(sum.cssTransforms / count),
      cssFilters: Math.round(sum.cssFilters / count),
      eventListeners: Math.round(sum.eventListeners / count),
      timestamp: Date.now()
    };
  }

  private calculateMinMetrics(): PerformanceMetrics {
    return this.metrics.reduce((min, m) => ({
      fps: Math.min(min.fps, m.fps),
      frameTime: Math.min(min.frameTime, m.frameTime),
      memoryUsage: Math.min(min.memoryUsage || Infinity, m.memoryUsage || Infinity),
      renderTime: Math.min(min.renderTime, m.renderTime),
      scriptTime: Math.min(min.scriptTime, m.scriptTime),
      layoutTime: Math.min(min.layoutTime, m.layoutTime),
      paintTime: Math.min(min.paintTime, m.paintTime),
      compositeTime: Math.min(min.compositeTime, m.compositeTime),
      domNodes: Math.min(min.domNodes, m.domNodes),
      svgElements: Math.min(min.svgElements, m.svgElements),
      canvasElements: Math.min(min.canvasElements, m.canvasElements),
      activeAnimations: Math.min(min.activeAnimations, m.activeAnimations),
      cssTransforms: Math.min(min.cssTransforms, m.cssTransforms),
      cssFilters: Math.min(min.cssFilters, m.cssFilters),
      eventListeners: Math.min(min.eventListeners, m.eventListeners),
      timestamp: Date.now()
    }), this.getMaxMetrics());
  }

  private calculateMaxMetrics(): PerformanceMetrics {
    return this.metrics.reduce((max, m) => ({
      fps: Math.max(max.fps, m.fps),
      frameTime: Math.max(max.frameTime, m.frameTime),
      memoryUsage: Math.max(max.memoryUsage || 0, m.memoryUsage || 0),
      renderTime: Math.max(max.renderTime, m.renderTime),
      scriptTime: Math.max(max.scriptTime, m.scriptTime),
      layoutTime: Math.max(max.layoutTime, m.layoutTime),
      paintTime: Math.max(max.paintTime, m.paintTime),
      compositeTime: Math.max(max.compositeTime, m.compositeTime),
      domNodes: Math.max(max.domNodes, m.domNodes),
      svgElements: Math.max(max.svgElements, m.svgElements),
      canvasElements: Math.max(max.canvasElements, m.canvasElements),
      activeAnimations: Math.max(max.activeAnimations, m.activeAnimations),
      cssTransforms: Math.max(max.cssTransforms, m.cssTransforms),
      cssFilters: Math.max(max.cssFilters, m.cssFilters),
      eventListeners: Math.max(max.eventListeners, m.eventListeners),
      timestamp: Date.now()
    }), this.getEmptyMetrics());
  }

  private generateRecommendations(metrics: PerformanceMetrics, bottlenecks: string[]): string[] {
    const recommendations: string[] = [];

    if (isSafari()) {
      recommendations.push('Switch to Chrome or Firefox for better performance');
      
      if (metrics.svgElements > 50) {
        recommendations.push('Reduce SVG complexity or switch to Canvas rendering');
      }
      
      if (metrics.cssFilters > 0) {
        recommendations.push('Disable all CSS filters (already done automatically)');
      }
    }

    if (metrics.fps < 30) {
      recommendations.push('Reduce map zoom level to render fewer elements');
      recommendations.push('Disable animations in settings');
    }

    if (metrics.domNodes > 2000) {
      recommendations.push('Close unnecessary panels/sidebars');
      recommendations.push('Reduce visible map area');
    }

    if (metrics.activeAnimations > 10) {
      recommendations.push('Disable creature animations');
      recommendations.push('Turn off water/environmental effects');
    }

    if (metrics.memoryUsage && metrics.memoryUsage > 300) {
      recommendations.push('Reload the page to clear memory');
      recommendations.push('Close other browser tabs');
    }

    return recommendations;
  }

  private getGPUInfo(): string {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (gl) {
      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        return (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
    
    return 'Unknown';
  }

  private getEmptyMetrics(): PerformanceMetrics {
    return {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      renderTime: 0,
      scriptTime: 0,
      layoutTime: 0,
      paintTime: 0,
      compositeTime: 0,
      domNodes: 0,
      svgElements: 0,
      canvasElements: 0,
      activeAnimations: 0,
      cssTransforms: 0,
      cssFilters: 0,
      eventListeners: 0,
      timestamp: Date.now()
    };
  }

  private getMaxMetrics(): PerformanceMetrics {
    return {
      fps: -Infinity,
      frameTime: -Infinity,
      memoryUsage: -Infinity,
      renderTime: -Infinity,
      scriptTime: -Infinity,
      layoutTime: -Infinity,
      paintTime: -Infinity,
      compositeTime: -Infinity,
      domNodes: -Infinity,
      svgElements: -Infinity,
      canvasElements: -Infinity,
      activeAnimations: -Infinity,
      cssTransforms: -Infinity,
      cssFilters: -Infinity,
      eventListeners: -Infinity,
      timestamp: Date.now()
    };
  }

  private getEmptyReport(): PerformanceReport {
    const empty = this.getEmptyMetrics();
    return {
      current: empty,
      average: empty,
      min: empty,
      max: empty,
      bottlenecks: [],
      recommendations: ['Start performance monitoring to see metrics'],
      browserInfo: {
        isSafari: isSafari(),
        userAgent: navigator.userAgent,
        gpu: this.getGPUInfo(),
        cores: navigator.hardwareConcurrency || 0,
        memory: (navigator as any).deviceMemory || 0
      }
    };
  }

  // Test specific rendering scenarios
  runSafariTests() {
    console.group('🧪 Safari-Specific Performance Tests');
    
    // Test 1: SVG Rendering
    console.time('SVG Rendering Test');
    const svgCount = document.querySelectorAll('svg').length;
    const svgComplexity = Array.from(document.querySelectorAll('svg')).reduce((total, svg) => {
      return total + svg.querySelectorAll('*').length;
    }, 0);
    console.timeEnd('SVG Rendering Test');
    console.log(`SVG Elements: ${svgCount}, Total SVG Nodes: ${svgComplexity}`);
    
    // Test 2: CSS Transforms
    console.time('Transform Test');
    const transforms = document.querySelectorAll('[style*="transform"]').length;
    console.timeEnd('Transform Test');
    console.log(`Elements with transforms: ${transforms}`);
    
    // Test 3: Forced Reflow Test
    console.time('Reflow Test');
    const elements = document.querySelectorAll('*');
    let totalHeight = 0;
    elements.forEach(el => {
      totalHeight += el.getBoundingClientRect().height; // Forces reflow
    });
    console.timeEnd('Reflow Test');
    
    // Test 4: Animation Frame Timing
    let frameCount = 0;
    const startTime = performance.now();
    const measureFrames = () => {
      frameCount++;
      if (frameCount < 60) {
        requestAnimationFrame(measureFrames);
      } else {
        const elapsed = performance.now() - startTime;
        const actualFPS = (60 / elapsed) * 1000;
        console.log(`Animation Frame Test: ${actualFPS.toFixed(2)} FPS (expected: 60)`);
      }
    };
    measureFrames();
    
    console.groupEnd();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export for direct usage
export const startPerformanceMonitoring = () => performanceMonitor.start();
export const stopPerformanceMonitoring = () => performanceMonitor.stop();
export const getPerformanceReport = () => performanceMonitor.generateReport();
export const runSafariPerformanceTests = () => performanceMonitor.runSafariTests();