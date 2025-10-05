/**
 * components/charts/SimplePopulationChart.tsx
 * Lightweight static SVG population chart - replaces heavy Recharts version
 * Shows player's position in human history without D3/Recharts dependency
 */
import React, { useMemo } from 'react';

interface SimplePopulationChartProps {
  currentYear: number;
  culturalZone?: string;
}

// Detect Safari
const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// Simplified historical population data [year, population in millions]
const POPULATION_DATA: [number, number][] = [
  [-5000, 5], [-3000, 14], [-1000, 50], [1, 200], [500, 206],
  [1000, 310], [1200, 360], [1400, 350], [1500, 460], [1600, 580],
  [1700, 610], [1800, 990], [1900, 1650], [1950, 2520], [2025, 8070]
];

// Cumulative births by year [year, cumulative births in millions]
// Based on demographic estimates: ~110 billion total humans ever born
const CUMULATIVE_BIRTHS: [number, number][] = [
  [-5000, 5000],    // ~5 billion by 5000 BCE
  [-3000, 10000],   // ~10 billion by 3000 BCE
  [-1000, 20000],   // ~20 billion by 1000 BCE
  [1, 45000],       // ~45 billion by 1 CE
  [500, 50000],     // ~50 billion by 500 CE
  [1000, 55000],    // ~55 billion by 1000 CE
  [1200, 60000],    // ~60 billion by 1200 CE
  [1400, 65000],    // ~65 billion by 1400 CE
  [1500, 70000],    // ~70 billion by 1500 CE
  [1600, 75000],    // ~75 billion by 1600 CE
  [1700, 80000],    // ~80 billion by 1700 CE
  [1800, 85000],    // ~85 billion by 1800 CE
  [1900, 95000],    // ~95 billion by 1900 CE
  [1950, 102000],   // ~102 billion by 1950 CE
  [2000, 108000]    // ~108 billion by 2000 CE
];

const SimplePopulationChart: React.FC<SimplePopulationChartProps> = ({ currentYear }) => {
  // Simple linear interpolation for population
  function interpolatePopulation(year: number): number {
    for (let i = 0; i < POPULATION_DATA.length - 1; i++) {
      const [y1, p1] = POPULATION_DATA[i];
      const [y2, p2] = POPULATION_DATA[i + 1];
      if (year >= y1 && year <= y2) {
        const ratio = (year - y1) / (y2 - y1);
        return p1 + (p2 - p1) * ratio;
      }
    }
    return POPULATION_DATA[POPULATION_DATA.length - 1][1];
  }

  // Linear interpolation for cumulative births
  function interpolateCumulativeBirths(year: number): number {
    // Before earliest data point
    if (year <= CUMULATIVE_BIRTHS[0][0]) {
      return CUMULATIVE_BIRTHS[0][1];
    }
    // After latest data point
    if (year >= CUMULATIVE_BIRTHS[CUMULATIVE_BIRTHS.length - 1][0]) {
      return CUMULATIVE_BIRTHS[CUMULATIVE_BIRTHS.length - 1][1];
    }
    // Interpolate between data points
    for (let i = 0; i < CUMULATIVE_BIRTHS.length - 1; i++) {
      const [y1, b1] = CUMULATIVE_BIRTHS[i];
      const [y2, b2] = CUMULATIVE_BIRTHS[i + 1];
      if (year >= y1 && year <= y2) {
        const ratio = (year - y1) / (y2 - y1);
        return b1 + (b2 - b1) * ratio;
      }
    }
    return CUMULATIVE_BIRTHS[CUMULATIVE_BIRTHS.length - 1][1];
  }

  const { pathD, width, height, padding, playerX, playerY, playerPop, percentLivedAfter } = useMemo(() => {
    const w = 280;
    const h = 140;
    const p = 20;
    const minYear = -5000;
    const maxYear = 2025;
    const maxP = 8500;

    const yearToX = (year: number) => p + ((year - minYear) / (maxYear - minYear)) * (w - 2 * p);
    const popToY = (pop: number) => h - p - ((pop / maxP) * (h - 2 * p));

    const pts = POPULATION_DATA.map(([year, pop]) => ({
      x: yearToX(year),
      y: popToY(pop)
    }));

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      path += ` L ${pts[i].x} ${pts[i].y}`;
    }
    path += ` L ${pts[pts.length - 1].x} ${h - p} L ${pts[0].x} ${h - p} Z`;

    // Calculate player position
    const playerX = yearToX(currentYear);
    const playerPop = interpolatePopulation(currentYear);
    const playerY = popToY(playerPop);

    // Calculate percentage of people who lived after player
    const TOTAL_HUMANS_EVER = 110000; // ~110 billion in millions
    const birthsUpToPlayerYear = interpolateCumulativeBirths(currentYear);
    const birthsAfterPlayer = TOTAL_HUMANS_EVER - birthsUpToPlayerYear;
    const percentLivedAfter = ((birthsAfterPlayer / TOTAL_HUMANS_EVER) * 100).toFixed(1);

    return { pathD: path, width: w, height: h, padding: p, playerX, playerY, playerPop, percentLivedAfter };
  }, [currentYear]);

  const cardClass = isSafari
    ? "bg-slate-800 rounded-xl p-4 border border-slate-700"
    : "bg-slate-800/70 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50";

  const chartBgClass = isSafari
    ? "relative bg-slate-900 rounded-lg p-3"
    : "relative bg-slate-900/50 rounded-lg p-3";

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-200">Your Place in History</h3>
        <span className="text-sm font-semibold text-slate-300">Population: ~{Math.round(playerPop)} million</span>
      </div>
      <div className={chartBgClass}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          style={{ minHeight: '160px' }}
        >
          {/* Grid lines - subtle slate */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#475569" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#475569" strokeWidth="1" />

          {/* Population curve - muted slate and amber */}
          <path
            d={pathD}
            fill="url(#populationGradient)"
            stroke="#64748b"
            strokeWidth="1.5"
          />

          {/* Gradient definition - muted slate tones */}
          <defs>
            <linearGradient id="populationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#64748b" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#334155" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Player position marker - amber */}
          <line
            x1={playerX}
            y1={padding}
            x2={playerX}
            y2={height - padding}
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <circle
            cx={playerX}
            cy={playerY}
            r="5"
            fill="#f59e0b"
            stroke="#fbbf24"
            strokeWidth="2"
          />

          {/* Axis labels */}
          <text x={padding} y={height - 5} fill="#94a3b8" fontSize="9" textAnchor="start">
            5000 BCE
          </text>
          <text x={width - padding} y={height - 5} fill="#94a3b8" fontSize="9" textAnchor="end">
            2025 CE
          </text>

          {/* Year label above player marker */}
          <text
            x={playerX}
            y={padding - 6}
            fill="#f59e0b"
            fontSize="10"
            fontWeight="600"
            textAnchor="middle"
          >
            {currentYear < 0 ? `${Math.abs(currentYear)} BC` : `${currentYear} CE`}
          </text>
        </svg>
      </div>
      <p className="text-xs text-slate-400 mt-2 text-center">
        {percentLivedAfter}% of all humans lived after you
      </p>
    </div>
  );
};

export default SimplePopulationChart;
