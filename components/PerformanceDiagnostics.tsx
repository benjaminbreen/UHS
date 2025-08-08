/**
 * Performance Diagnostics Component
 * Displays real-time performance metrics and analysis
 */

import React, { useState, useEffect } from 'react';
import { performanceMonitor, getPerformanceReport, runSafariPerformanceTests, PerformanceReport } from '../utils/performanceMonitor';
import { isSafari } from '../utils/safariUtils';

interface PerformanceDiagnosticsProps {
  isOpen: boolean;
  onClose: () => void;
}

const PerformanceDiagnostics: React.FC<PerformanceDiagnosticsProps> = ({ isOpen, onClose }) => {
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const updateReport = () => {
      if (isMonitoring) {
        const newReport = getPerformanceReport();
        setReport(newReport);
      }
    };

    const interval = setInterval(updateReport, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isMonitoring]);

  const handleStartMonitoring = () => {
    performanceMonitor.start();
    setIsMonitoring(true);
  };

  const handleStopMonitoring = () => {
    performanceMonitor.stop();
    setIsMonitoring(false);
  };

  const handleRunTests = () => {
    runSafariPerformanceTests();
  };

  const getFPSColor = (fps: number) => {
    if (fps >= 30) return 'text-green-400';
    if (fps >= 15) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusEmoji = (fps: number) => {
    if (fps >= 30) return '✅';
    if (fps >= 15) return '⚠️';
    return '🔴';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-4 border-b border-slate-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🔬 Performance Diagnostics
              {isSafari() && <span className="text-yellow-400 text-sm">(Safari Detected)</span>}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-red-400 transition-colors text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex gap-3">
            {!isMonitoring ? (
              <button
                onClick={handleStartMonitoring}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-semibold transition-colors"
              >
                ▶️ Start Monitoring
              </button>
            ) : (
              <button
                onClick={handleStopMonitoring}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-semibold transition-colors"
              >
                ⏹️ Stop Monitoring
              </button>
            )}
            <button
              onClick={handleRunTests}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-semibold transition-colors"
            >
              🧪 Run Safari Tests
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded font-semibold transition-colors"
            >
              {showDetails ? '📊 Simple View' : '📈 Detailed View'}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {report ? (
            <div className="space-y-4">
              {/* FPS Display */}
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">Performance Overview</h3>
                  <span className="text-3xl">{getStatusEmoji(report.current.fps)}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">FPS</p>
                    <p className={`text-2xl font-bold ${getFPSColor(report.current.fps)}`}>
                      {report.current.fps}
                    </p>
                    <p className="text-xs text-slate-500">
                      Avg: {report.average.fps} | Min: {report.min.fps}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Frame Time</p>
                    <p className="text-2xl font-bold text-white">
                      {report.current.frameTime.toFixed(1)}ms
                    </p>
                    <p className="text-xs text-slate-500">
                      Target: 16.67ms
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">DOM Nodes</p>
                    <p className="text-2xl font-bold text-white">
                      {report.current.domNodes}
                    </p>
                    <p className="text-xs text-slate-500">
                      SVG: {report.current.svgElements}
                    </p>
                  </div>
                  {report.current.memoryUsage && (
                    <div>
                      <p className="text-slate-400 text-sm">Memory</p>
                      <p className="text-2xl font-bold text-white">
                        {report.current.memoryUsage.toFixed(0)}MB
                      </p>
                      <p className="text-xs text-slate-500">
                        JS Heap
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Metrics */}
              {showDetails && (
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-3">Detailed Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-slate-900/50 p-2 rounded">
                      <span className="text-slate-400">Canvas Elements:</span>
                      <span className="text-white ml-2">{report.current.canvasElements}</span>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded">
                      <span className="text-slate-400">Active Animations:</span>
                      <span className="text-white ml-2">{report.current.activeAnimations}</span>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded">
                      <span className="text-slate-400">CSS Transforms:</span>
                      <span className="text-white ml-2">{report.current.cssTransforms}</span>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded">
                      <span className="text-slate-400">CSS Filters:</span>
                      <span className="text-white ml-2">{report.current.cssFilters}</span>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded">
                      <span className="text-slate-400">Event Listeners:</span>
                      <span className="text-white ml-2">{report.current.eventListeners}</span>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded">
                      <span className="text-slate-400">Render Time:</span>
                      <span className="text-white ml-2">{report.current.renderTime.toFixed(2)}ms</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottlenecks */}
              {report.bottlenecks.length > 0 && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-400 mb-2">🚨 Performance Issues</h3>
                  <ul className="space-y-1">
                    {report.bottlenecks.map((bottleneck, i) => (
                      <li key={i} className="text-red-200 text-sm">• {bottleneck}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {report.recommendations.length > 0 && (
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-400 mb-2">💡 Recommendations</h3>
                  <ul className="space-y-1">
                    {report.recommendations.map((rec, i) => (
                      <li key={i} className="text-blue-200 text-sm">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Browser Info */}
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-3">System Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-400">Browser:</span>
                    <span className="text-white ml-2">{report.browserInfo.isSafari ? 'Safari' : 'Other'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">CPU Cores:</span>
                    <span className="text-white ml-2">{report.browserInfo.cores || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Device Memory:</span>
                    <span className="text-white ml-2">{report.browserInfo.memory ? `${report.browserInfo.memory}GB` : 'Unknown'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">GPU:</span>
                    <span className="text-white ml-2 text-xs">{report.browserInfo.gpu}</span>
                  </div>
                </div>
              </div>

              {/* Safari Warning */}
              {isSafari() && (
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-2">⚠️ Safari Performance Warning</h3>
                  <p className="text-yellow-200 text-sm mb-2">
                    Safari has known performance issues with this application:
                  </p>
                  <ul className="space-y-1 text-yellow-200 text-sm">
                    <li>• SVG rendering is 3-10x slower than Chrome</li>
                    <li>• CSS filters cause severe performance degradation</li>
                    <li>• Limited GPU acceleration for transforms</li>
                    <li>• Inefficient JavaScript execution</li>
                  </ul>
                  <p className="text-yellow-400 font-semibold mt-3">
                    For optimal performance, please use Chrome or Firefox.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">Click "Start Monitoring" to begin performance analysis</p>
              <p className="text-slate-500 text-sm">
                The monitor will track FPS, DOM complexity, memory usage, and identify performance bottlenecks.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <p className="text-xs text-slate-400 text-center">
            Performance data is logged to the browser console for detailed analysis.
            {isSafari() && ' Safari users may experience significantly reduced performance.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDiagnostics;