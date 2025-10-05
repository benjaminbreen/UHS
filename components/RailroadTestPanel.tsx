/**
 * RailroadTestPanel.tsx - Test panel for railroad generation and rendering
 */
import React, { useState, useMemo } from 'react';
import { X, Train, MapPin } from 'lucide-react';
import { generateRoadAndPathNetwork } from '../generation/standardMap/features/RoadAndPathGenerator';
import { ValueNoise } from '../utils/noise';
import { HistoricalEra } from '../types/ambiance';
import { MapData, PathType } from '../types';
import TrainSymbol from './symbols/TrainSymbol';

interface RailroadTestPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const RailroadTestPanel: React.FC<RailroadTestPanelProps> = ({ isOpen, onClose }) => {
  const [testSeed, setTestSeed] = useState(12345);
  const [testEra, setTestEra] = useState<HistoricalEra>(HistoricalEra.INDUSTRIAL_ERA);
  const [showTrains, setShowTrains] = useState(true);
  const [numTrains, setNumTrains] = useState(2);
  const [trainSpeed, setTrainSpeed] = useState(0.015);

  // Generate sample railroad paths for preview
  const sampleRailroads = useMemo(() => {
    const noise = new ValueNoise(testSeed);

    // Create simple sample paths
    const paths = [];

    // Horizontal railroad
    paths.push({
      id: 'test-rail-1',
      type: PathType.RAILROAD,
      svgD: 'M 50 150 L 450 150',
      strokeWidth: 6.72, // TILE_SIZE_PX * 0.28
      strokeColor: '#5a5a5a',
      opacity: 1.0,
      strokeDasharray: undefined
    });

    // Ballast for horizontal
    paths.push({
      id: 'test-rail-1-ballast',
      type: PathType.RAILROAD,
      svgD: 'M 50 150 L 450 150',
      strokeWidth: 9.4, // 1.4x width
      strokeColor: '#8b7d6b',
      opacity: 0.8,
      strokeDasharray: undefined
    });

    // Ties for horizontal
    paths.push({
      id: 'test-rail-1-ties',
      type: PathType.RAILROAD,
      svgD: 'M 50 150 L 450 150',
      strokeWidth: 5.7, // 0.85x width
      strokeColor: '#3d2817',
      opacity: 0.9,
      strokeDasharray: '3.6 3.6'
    });

    // Curved railroad
    paths.push({
      id: 'test-rail-2',
      type: PathType.RAILROAD,
      svgD: 'M 100 50 Q 250 100 400 250',
      strokeWidth: 6.72,
      strokeColor: '#5a5a5a',
      opacity: 1.0,
      strokeDasharray: undefined
    });

    // Ballast for curved
    paths.push({
      id: 'test-rail-2-ballast',
      type: PathType.RAILROAD,
      svgD: 'M 100 50 Q 250 100 400 250',
      strokeWidth: 9.4,
      strokeColor: '#8b7d6b',
      opacity: 0.8,
      strokeDasharray: undefined
    });

    // Ties for curved
    paths.push({
      id: 'test-rail-2-ties',
      type: PathType.RAILROAD,
      svgD: 'M 100 50 Q 250 100 400 250',
      strokeWidth: 5.7,
      strokeColor: '#3d2817',
      opacity: 0.9,
      strokeDasharray: '3.6 3.6'
    });

    return paths;
  }, [testSeed]);

  const mainRailroads = sampleRailroads.filter(p => !p.id.includes('ballast') && !p.id.includes('ties'));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="relative w-[90vw] max-w-4xl h-[85vh] bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <Train className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Railroad Test Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Controls */}
          <div className="grid grid-cols-2 gap-4">
            {/* Era Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Historical Era</label>
              <select
                value={testEra}
                onChange={(e) => setTestEra(e.target.value as HistoricalEra)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              >
                <option value={HistoricalEra.PREHISTORY}>Prehistory (No Railroads)</option>
                <option value={HistoricalEra.ANTIQUITY}>Antiquity (No Railroads)</option>
                <option value={HistoricalEra.MEDIEVAL}>Medieval (No Railroads)</option>
                <option value={HistoricalEra.RENAISSANCE_EARLY_MODERN}>Renaissance (No Railroads)</option>
                <option value={HistoricalEra.INDUSTRIAL_ERA}>Industrial Era (1850-1920)</option>
                <option value={HistoricalEra.MODERN_ERA}>Modern Era (1920-2000)</option>
                <option value={HistoricalEra.FUTURE_ERA}>Future Era (2000+)</option>
              </select>
            </div>

            {/* Seed Control */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Test Seed</label>
              <input
                type="number"
                value={testSeed}
                onChange={(e) => setTestSeed(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>

            {/* Show Trains */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-300">
                <input
                  type="checkbox"
                  checked={showTrains}
                  onChange={(e) => setShowTrains(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Show Animated Trains</span>
              </label>
            </div>

            {/* Number of Trains */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Number of Trains</label>
              <input
                type="range"
                min="1"
                max="5"
                value={numTrains}
                onChange={(e) => setNumTrains(parseInt(e.target.value))}
                className="w-full"
                disabled={!showTrains}
              />
              <div className="text-xs text-slate-400">{numTrains} train{numTrains !== 1 ? 's' : ''}</div>
            </div>

            {/* Train Speed */}
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium text-slate-300">Train Speed</label>
              <input
                type="range"
                min="0.005"
                max="0.05"
                step="0.005"
                value={trainSpeed}
                onChange={(e) => setTrainSpeed(parseFloat(e.target.value))}
                className="w-full"
                disabled={!showTrains}
              />
              <div className="text-xs text-slate-400">{trainSpeed.toFixed(3)} (speed multiplier)</div>
            </div>
          </div>

          {/* Visual Preview */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              <span>Railroad Preview</span>
            </h3>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <svg width="500" height="300" viewBox="0 0 500 300" className="w-full h-auto">
                {/* Background */}
                <rect width="500" height="300" fill="#1e293b" />

                {/* Grid */}
                <defs>
                  <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#334155" strokeWidth="0.5" opacity="0.3"/>
                  </pattern>
                </defs>
                <rect width="500" height="300" fill="url(#grid)" />

                {/* Render railroads in correct order: ballast -> ties -> rails */}
                {/* Ballast layer */}
                {sampleRailroads
                  .filter(p => p.id.includes('ballast'))
                  .map(path => (
                    <path
                      key={path.id}
                      d={path.svgD}
                      stroke={path.strokeColor}
                      strokeWidth={path.strokeWidth}
                      fill="none"
                      opacity={path.opacity}
                      strokeLinecap="square"
                    />
                  ))}

                {/* Ties layer */}
                {sampleRailroads
                  .filter(p => p.id.includes('ties'))
                  .map(path => (
                    <path
                      key={path.id}
                      d={path.svgD}
                      stroke={path.strokeColor}
                      strokeWidth={path.strokeWidth}
                      fill="none"
                      opacity={path.opacity}
                      strokeLinecap="square"
                      strokeDasharray={path.strokeDasharray}
                    />
                  ))}

                {/* Rails layer */}
                {mainRailroads.map(path => (
                  <path
                    key={path.id}
                    d={path.svgD}
                    stroke={path.strokeColor}
                    strokeWidth={path.strokeWidth}
                    fill="none"
                    opacity={path.opacity}
                    strokeLinecap="square"
                  />
                ))}

                {/* Trains */}
                {showTrains && mainRailroads.slice(0, numTrains).map((railroad, idx) => (
                  <TrainSymbol
                    key={`train-${idx}`}
                    pathData={railroad.svgD}
                    speed={trainSpeed + (idx * 0.005)}
                    numCars={3 + idx}
                  />
                ))}

                {/* Sample buildings to show z-index */}
                <g>
                  <rect x="200" y="100" width="40" height="40" fill="#8b4513" opacity="0.8" />
                  <rect x="200" y="100" width="40" height="10" fill="#654321" />
                  <text x="220" y="125" textAnchor="middle" fill="white" fontSize="8">Building</text>
                </g>
              </svg>
            </div>
          </div>

          {/* Railroad Specifications */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Railroad Specifications</h3>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400">Total Width:</span>
                  <span className="ml-2 text-white font-mono">6.72px (28% of tile)</span>
                </div>
                <div>
                  <span className="text-slate-400">Rail Color:</span>
                  <span className="ml-2 text-white font-mono">#5a5a5a</span>
                </div>
                <div>
                  <span className="text-slate-400">Ballast Width:</span>
                  <span className="ml-2 text-white font-mono">9.4px (140% of base)</span>
                </div>
                <div>
                  <span className="text-slate-400">Ballast Color:</span>
                  <span className="ml-2 text-white font-mono">#8b7d6b</span>
                </div>
                <div>
                  <span className="text-slate-400">Tie Width:</span>
                  <span className="ml-2 text-white font-mono">5.7px (85% of base)</span>
                </div>
                <div>
                  <span className="text-slate-400">Tie Color:</span>
                  <span className="ml-2 text-white font-mono">#3d2817</span>
                </div>
                <div>
                  <span className="text-slate-400">Opacity:</span>
                  <span className="ml-2 text-white font-mono">100% (full)</span>
                </div>
                <div>
                  <span className="text-slate-400">Z-Index:</span>
                  <span className="ml-2 text-white font-mono">Above buildings</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-slate-300">
                  <strong>Rendering Order:</strong> Ballast (gravel bed) → Ties (wooden) → Rails (steel)
                </p>
                <p className="text-slate-400 text-xs mt-2">
                  Railroads appear in Industrial Era (1850+), Modern Era, and Future Era maps.
                </p>
              </div>
            </div>
          </div>

          {/* Era Information */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Era Configuration</h3>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              {testEra === HistoricalEra.INDUSTRIAL_ERA && (
                <div className="text-sm text-slate-300">
                  <p className="font-semibold text-blue-400 mb-2">Industrial Era (1850-1920)</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>Primitive steam locomotives with coal smoke</li>
                    <li>Wooden railroad ties</li>
                    <li>Iron rails on gravel ballast</li>
                    <li>Connects cities to factories, mines, and industrial districts</li>
                  </ul>
                </div>
              )}
              {testEra === HistoricalEra.MODERN_ERA && (
                <div className="text-sm text-slate-300">
                  <p className="font-semibold text-blue-400 mb-2">Modern Era (1920-2000)</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>Diesel and electric locomotives</li>
                    <li>Steel rails with concrete ties</li>
                    <li>Extensive urban and intercity networks</li>
                    <li>Freight and passenger rail systems</li>
                  </ul>
                </div>
              )}
              {(testEra === HistoricalEra.PREHISTORY || testEra === HistoricalEra.ANTIQUITY || testEra === HistoricalEra.MEDIEVAL || testEra === HistoricalEra.RENAISSANCE_EARLY_MODERN) && (
                <div className="text-sm text-amber-400">
                  <p className="font-semibold mb-2">⚠️ No Railroads in This Era</p>
                  <p className="text-slate-400">Railroads only appear in maps set after 1850 (Industrial Era and later).</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RailroadTestPanel;
