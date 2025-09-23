/**
 * components/charts/PopulationChart.tsx
 * Population distribution bell curve showing where player falls in human history
 */
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Dot } from 'recharts';
import { motion } from 'framer-motion';
import ChartErrorBoundary from '../ChartErrorBoundary';

interface PopulationChartProps {
  currentYear: number;
  culturalZone?: string;
}

// Generate a bell curve of human population through history
const generatePopulationCurve = () => {
  const data = [];
  
  // Simplified population curve from 10,000 BC to 2000 AD
  // Using rough historical estimates
  const populationByYear: Record<number, number> = {
    [-10000]: 1,      // 1 million
    [-8000]: 5,       // 5 million
    [-5000]: 5,       // 5 million
    [-3000]: 14,      // 14 million
    [-2000]: 27,      // 27 million
    [-1000]: 50,      // 50 million
    [-500]: 100,      // 100 million
    [1]: 200,         // 200 million (year 1 AD)
    [500]: 206,       // 206 million
    [1000]: 310,      // 310 million
    [1100]: 320,      // 320 million
    [1200]: 360,      // 360 million
    [1300]: 360,      // 360 million
    [1340]: 365,      // 365 million (pre-Black Death)
    [1400]: 350,      // 350 million (post-Black Death)
    [1500]: 460,      // 460 million
    [1600]: 580,      // 580 million
    [1700]: 610,      // 610 million
    [1800]: 990,      // 990 million
    [1850]: 1260,     // 1.26 billion
    [1900]: 1650,     // 1.65 billion
    [1950]: 2520,     // 2.52 billion
    [2000]: 6070,     // 6.07 billion
  };

  // Interpolate between points for smooth curve
  const years = Object.keys(populationByYear).map(Number).sort((a, b) => a - b);
  
  for (let year = -5000; year <= 2000; year += 100) {
    let pop = 0;
    
    // Find surrounding data points for interpolation
    for (let i = 0; i < years.length - 1; i++) {
      if (year >= years[i] && year <= years[i + 1]) {
        const y1 = years[i];
        const y2 = years[i + 1];
        const p1 = populationByYear[y1];
        const p2 = populationByYear[y2];
        
        // Linear interpolation
        const ratio = (year - y1) / (y2 - y1);
        pop = p1 + (p2 - p1) * ratio;
        break;
      }
    }
    
    if (year <= years[0]) pop = populationByYear[years[0]];
    if (year >= years[years.length - 1]) pop = populationByYear[years[years.length - 1]];
    
    data.push({
      year: year,
      population: Math.max(0, pop),
      displayYear: year < 0 ? `${Math.abs(year)} BC` : `${year} AD`
    });
  }
  
  return data;
};

// Calculate what percentage of humans lived before/after a given year
const calculateHistoricalPosition = (year: number) => {
  // Rough estimate: ~108 billion humans have ever lived
  // Distribution heavily weighted toward recent centuries
  
  // Simplified calculation based on historical demographics
  let percentBefore = 0;
  
  if (year < -8000) percentBefore = 0.5;
  else if (year < -3000) percentBefore = 2;
  else if (year < -1000) percentBefore = 5;
  else if (year < 1) percentBefore = 10;
  else if (year < 1000) percentBefore = 20;
  else if (year < 1500) percentBefore = 30;
  else if (year < 1700) percentBefore = 40;
  else if (year < 1800) percentBefore = 50;
  else if (year < 1900) percentBefore = 60;
  else if (year < 1950) percentBefore = 70;
  else if (year < 2000) percentBefore = 85;
  else percentBefore = 95;
  
  return {
    before: percentBefore,
    after: 100 - percentBefore
  };
};

const PopulationChart: React.FC<PopulationChartProps> = ({ currentYear, region }) => {
  const baseData = useMemo(() => generatePopulationCurve(), []);
  const position = useMemo(() => calculateHistoricalPosition(currentYear), [currentYear]);
  
  // Find current population with proper interpolation
  const currentPop = useMemo(() => {
    // Find the exact population value by interpolation
    const years = baseData.map(d => d.year);
    
    // Find the two data points that bracket the current year
    let lowerPoint = null;
    let upperPoint = null;
    
    for (let i = 0; i < baseData.length - 1; i++) {
      if (baseData[i].year <= currentYear && baseData[i + 1].year >= currentYear) {
        lowerPoint = baseData[i];
        upperPoint = baseData[i + 1];
        break;
      }
    }
    
    // If we found bracketing points, interpolate
    if (lowerPoint && upperPoint) {
      const yearRange = upperPoint.year - lowerPoint.year;
      const yearOffset = currentYear - lowerPoint.year;
      const ratio = yearOffset / yearRange;
      const interpolatedPop = lowerPoint.population + (upperPoint.population - lowerPoint.population) * ratio;
      return interpolatedPop;
    }
    
    // Edge cases: before first year or after last year
    if (currentYear <= baseData[0].year) {
      return baseData[0].population;
    }
    if (currentYear >= baseData[baseData.length - 1].year) {
      return baseData[baseData.length - 1].population;
    }
    
    // Fallback (shouldn't reach here)
    return 100;
  }, [baseData, currentYear]);
  
  // Create data with the current year point included
  const data = useMemo(() => {
    // Copy the base data
    const chartData = [...baseData];
    
    // Add the current year as a data point with a special marker
    const currentPoint = {
      year: currentYear,
      population: currentPop,
      displayYear: currentYear < 0 ? `${Math.abs(currentYear)} BC` : `${currentYear} AD`,
      isCurrentYear: true
    };
    
    // Insert the current point in the right position
    let inserted = false;
    for (let i = 0; i < chartData.length; i++) {
      if (chartData[i].year > currentYear) {
        chartData.splice(i, 0, currentPoint);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      chartData.push(currentPoint);
    }
    
    return chartData;
  }, [baseData, currentYear, currentPop]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      const year = payload[0].payload.year;
      return (
        <div className="bg-slate-900/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-amber-600/30 shadow-xl">
          <p className="text-amber-400 font-bold text-xs">
            {year < 0 ? `${Math.abs(year)} BC` : `${year} AD`}
          </p>
          <p className="text-amber-200 text-xs">
            ~{payload[0].value.toFixed(0)} million people
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom dot component for the current year
  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    
    if (payload.isCurrentYear) {
      return (
        <g>
          {/* Pulsing glow animation */}
          <circle cx={cx} cy={cy} r="8" fill="#f59e0b" opacity="0.3">
            <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite" />
          </circle>
          {/* Main dot */}
          <circle cx={cx} cy={cy} r="4" fill="#f59e0b" stroke="#fbbf24" strokeWidth="2" />
          {/* Inner bright spot */}
          <circle cx={cx} cy={cy} r="1.5" fill="#ffffff" opacity="0.9" />
          {/* Year label */}
          <text 
            x={cx} 
            y={cy + 20} 
            textAnchor="middle" 
            fill="#f59e0b" 
            fontSize="11" 
            fontWeight="bold"
          >
            {payload.displayYear}
          </text>
        </g>
      );
    }
    return null;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30"
    >
      <div className="mb-3">
        <h3 className="text-amber-400 font-bold text-sm mb-1">Population Distribution</h3>
        <p className="text-xs text-slate-400">{region}</p>
      </div>
      
      <div className="relative">
        <ChartErrorBoundary 
          fallbackTitle="Population Chart Error"
          fallbackMessage="Unable to display population data"
        >
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart 
              data={data} 
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            >
              <defs>
                <linearGradient id="populationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              
              <XAxis 
                dataKey="year"
                domain={[-10000, 2000]}
                ticks={[-8000, -4000, 0, 1000, 2000]}
                tickFormatter={(value) => {
                  if (value === 0) return '1 AD';
                  return value < 0 ? `${Math.abs(value/1000)}k BC` : `${value}`;
                }}
                stroke="#64748b"
                fontSize={9}
                tick={{ fill: '#64748b' }}
              />
              
              <YAxis 
                hide={true}
                domain={[0, 'dataMax']}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Area 
                type="monotone" 
                dataKey="population" 
                stroke="#f59e0b"
                strokeWidth={1.5}
                fill="url(#populationGradient)"
                animationDuration={1500}
                animationBegin={100}
                dot={renderCustomDot}
              />
              
            </AreaChart>
          </ResponsiveContainer>
        </ChartErrorBoundary>
      </div>
      
      <div className="mt-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">Current population:</span>
          <span className="text-amber-400 font-semibold">
            ~{Math.round(currentPop)} million
          </span>
        </div>
        <div className="text-xs text-slate-400 italic">
          {position.before}% of all humans lived before you
        </div>
      </div>
    </motion.div>
  );
};

export default PopulationChart;