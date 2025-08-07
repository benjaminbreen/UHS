import React, { useState, useEffect } from 'react';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import { useUI } from '../contexts/UIContext';

const DebugOverlay: React.FC = () => {
  const { isTestModeEnabled, debugSettings, setDebugSettings } = useUI();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const { metrics, resetMetrics } = usePerformanceMonitor(isTestModeEnabled);

  useEffect(() => {
    // Detect Safari browser
    const safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    setIsSafari(safari);
  }, []);

  if (!isTestModeEnabled) return null;

  const toggleSetting = (key: keyof typeof debugSettings) => {
    setDebugSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));

    // Apply settings immediately
    if (key === 'disableBlurEffects') {
      document.body.classList.toggle('disable-blur', !debugSettings.disableBlurEffects);
    }
    if (key === 'disableAnimations') {
      document.body.classList.toggle('disable-animations', !debugSettings.disableAnimations);
    }
    if (key === 'disableShadows') {
      document.body.classList.toggle('disable-shadows', !debugSettings.disableShadows);
    }
    if (key === 'reduceSVGComplexity') {
      document.body.classList.toggle('reduce-svg', !debugSettings.reduceSVGComplexity);
    }
  };

  const getFPSColor = (fps: number) => {
    if (fps >= 50) return 'text-green-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMemoryColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage < 50) return 'text-green-400';
    if (percentage < 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={`fixed top-20 right-4 z-50 transition-all duration-300 ${isCollapsed ? 'w-auto' : 'w-80'}`}>
      <div className="bg-black/80 backdrop-blur-sm border border-cyan-500/50 rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-3 border-b border-cyan-500/30">
          <h3 className="text-cyan-400 font-semibold text-sm">Debug Mode {isSafari && '(Safari)'}</h3>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {!isCollapsed && (
          <div className="p-3 space-y-3">
            {/* Performance Metrics */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Performance</h4>
              
              {debugSettings.showFPS && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300">FPS:</span>
                  <div className="text-right">
                    <span className={`font-mono ${getFPSColor(metrics.fps)}`}>{metrics.fps}</span>
                    <span className="text-gray-500 ml-2">
                      (min: {metrics.minFps}, max: {metrics.maxFps})
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300">Frame Time:</span>
                <span className="font-mono text-cyan-300">{metrics.frameTime}ms</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-300">Avg Frame Time:</span>
                <span className="font-mono text-cyan-300">{metrics.avgFrameTime}ms</span>
              </div>

              {debugSettings.showMemoryUsage && metrics.memoryLimit > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300">Memory:</span>
                  <span className={`font-mono ${getMemoryColor(metrics.memoryUsed, metrics.memoryLimit)}`}>
                    {metrics.memoryUsed}MB / {metrics.memoryLimit}MB
                  </span>
                </div>
              )}

              {debugSettings.showRenderCount && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300">Render Count:</span>
                  <div>
                    <span className="font-mono text-cyan-300">{metrics.renderCount}</span>
                    <button
                      onClick={resetMetrics}
                      className="ml-2 text-gray-500 hover:text-cyan-400 transition-colors"
                    >
                      reset
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Feature Toggles */}
            <div className="space-y-2 border-t border-cyan-500/30 pt-3">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Feature Toggles</h4>
              
              <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-white/5 p-1 rounded">
                <span className="text-gray-300">Disable Blur Effects</span>
                <input
                  type="checkbox"
                  checked={debugSettings.disableBlurEffects}
                  onChange={() => toggleSetting('disableBlurEffects')}
                  className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-white/5 p-1 rounded">
                <span className="text-gray-300">Disable Animations</span>
                <input
                  type="checkbox"
                  checked={debugSettings.disableAnimations}
                  onChange={() => toggleSetting('disableAnimations')}
                  className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-white/5 p-1 rounded">
                <span className="text-gray-300">Disable Shadows</span>
                <input
                  type="checkbox"
                  checked={debugSettings.disableShadows}
                  onChange={() => toggleSetting('disableShadows')}
                  className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-white/5 p-1 rounded">
                <span className="text-gray-300">Disable Particles</span>
                <input
                  type="checkbox"
                  checked={debugSettings.disableParticles}
                  onChange={() => toggleSetting('disableParticles')}
                  className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-white/5 p-1 rounded">
                <span className="text-gray-300">Reduce SVG Complexity</span>
                <input
                  type="checkbox"
                  checked={debugSettings.reduceSVGComplexity}
                  onChange={() => toggleSetting('reduceSVGComplexity')}
                  className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-white/5 p-1 rounded">
                <span className="text-gray-300">Disable Canvas Smoothing</span>
                <input
                  type="checkbox"
                  checked={debugSettings.disableCanvasSmoothing}
                  onChange={() => toggleSetting('disableCanvasSmoothing')}
                  className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-white/5 p-1 rounded">
                <span className="text-gray-300">Throttle Animation (30fps)</span>
                <input
                  type="checkbox"
                  checked={debugSettings.throttleAnimationFPS}
                  onChange={() => toggleSetting('throttleAnimationFPS')}
                  className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-white/5 p-1 rounded">
                <span className="text-gray-300">Log Performance</span>
                <input
                  type="checkbox"
                  checked={debugSettings.logPerformanceMetrics}
                  onChange={() => toggleSetting('logPerformanceMetrics')}
                  className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                />
              </label>
            </div>

            {/* Display Settings */}
            <div className="space-y-2 border-t border-cyan-500/30 pt-3">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Display Settings</h4>
              
              <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-white/5 p-1 rounded">
                <span className="text-gray-300">Show FPS</span>
                <input
                  type="checkbox"
                  checked={debugSettings.showFPS}
                  onChange={() => toggleSetting('showFPS')}
                  className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-white/5 p-1 rounded">
                <span className="text-gray-300">Show Render Count</span>
                <input
                  type="checkbox"
                  checked={debugSettings.showRenderCount}
                  onChange={() => toggleSetting('showRenderCount')}
                  className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer hover:bg-white/5 p-1 rounded">
                <span className="text-gray-300">Show Memory Usage</span>
                <input
                  type="checkbox"
                  checked={debugSettings.showMemoryUsage}
                  onChange={() => toggleSetting('showMemoryUsage')}
                  className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                />
              </label>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 border-t border-cyan-500/30 pt-3">
              <button
                onClick={() => {
                  console.log('Current Performance Metrics:', metrics);
                  console.log('Debug Settings:', debugSettings);
                }}
                className="w-full px-2 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 text-xs rounded transition-colors"
              >
                Log Current State to Console
              </button>
              
              <button
                onClick={() => {
                  localStorage.setItem('debugSettings', JSON.stringify(debugSettings));
                  alert('Debug settings saved to localStorage');
                }}
                className="w-full px-2 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs rounded transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugOverlay;