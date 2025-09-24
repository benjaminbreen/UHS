/**
 * FactoryBannerTest.tsx
 * Simple test display for factory banners with various hardcoded settings
 */

import React, { useState } from 'react';
import FactoryBanner from './FactoryBanner';
import { X, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { ClimateType, Season, TimeOfDay } from '../types';

interface FactoryBannerTestProps {
  isOpen: boolean;
  onClose: () => void;
}

// Test configurations for different scenarios
const TEST_CONFIGS = [
  {
    name: "Industrial Era - Day - Temperate",
    era: "1850",
    culturalZone: "EUROPEAN",
    climate: ClimateType.TEMPERATE,
    season: 'Summer' as Season,
    timeOfDay: 'Day' as TimeOfDay,
    weather: { type: "clear" as const, precipitation: 0, windSpeed: 0.3, cloudCover: 0.2, visibility: 1 },
    industryName: "Steel Mill",
    productionLevel: 80
  },
  {
    name: "Medieval Workshop - Dawn - Rain",
    era: "1200",
    culturalZone: "EUROPEAN",
    climate: "temperate" as const,
    season: "spring" as const,
    timeOfDay: "Dawn" as const,
    weather: { type: "rain" as const, precipitation: 0.7, windSpeed: 0.5, cloudCover: 0.8, visibility: 0.7 },
    industryName: "Blacksmith Workshop",
    productionLevel: 60
  },
  {
    name: "Modern Factory - Night - Asian",
    era: "1960",
    culturalZone: "EAST_ASIAN",
    climate: "continental" as const,
    season: "fall" as const,
    timeOfDay: "Night" as const,
    weather: { type: "clear" as const, precipitation: 0, windSpeed: 0.2, cloudCover: 0.1, visibility: 1 },
    industryName: "Electronics Factory",
    productionLevel: 95
  },
  {
    name: "Colonial Plantation - Dusk - Tropical",
    era: "1750",
    culturalZone: "SOUTH_AMERICAN",
    climate: "tropical" as const,
    season: "summer" as const,
    timeOfDay: "Dusk" as const,
    weather: { type: "storm" as const, precipitation: 0.9, windSpeed: 0.8, cloudCover: 1, visibility: 0.5 },
    industryName: "Sugar Plantation",
    productionLevel: 70
  },
  {
    name: "Arctic Factory - Winter Snow",
    era: "1900",
    culturalZone: "EUROPEAN",
    climate: "arctic" as const,
    season: "winter" as const,
    timeOfDay: "Day" as const,
    weather: { type: "snow" as const, precipitation: 0.6, windSpeed: 0.4, cloudCover: 0.9, visibility: 0.6 },
    industryName: "Fish Processing",
    productionLevel: 50
  },
  {
    name: "Middle Eastern Workshop - Desert",
    era: "1400",
    culturalZone: "MENA",
    climate: "arid" as const,
    season: "summer" as const,
    timeOfDay: "Day" as const,
    weather: { type: "clear" as const, precipitation: 0, windSpeed: 0.6, cloudCover: 0, visibility: 1 },
    industryName: "Textile Workshop",
    productionLevel: 75
  },
  {
    name: "Sub-Saharan Workshop - Dawn",
    era: "1600",
    culturalZone: "SUB_SAHARAN_AFRICAN",
    climate: "tropical" as const,
    season: "spring" as const,
    timeOfDay: "Dawn" as const,
    weather: { type: "fog" as const, precipitation: 0.2, windSpeed: 0.1, cloudCover: 0.7, visibility: 0.3 },
    industryName: "Pottery Workshop",
    productionLevel: 65
  },
  {
    name: "Ruined Factory - Abandoned",
    era: "1920",
    culturalZone: "EUROPEAN",
    climate: "continental" as const,
    season: "fall" as const,
    timeOfDay: "Dusk" as const,
    weather: { type: "fog" as const, precipitation: 0.1, windSpeed: 0.3, cloudCover: 0.6, visibility: 0.4 },
    industryName: "Abandoned Mill",
    productionLevel: 0,
    isRuined: true
  }
];

const FactoryBannerTest: React.FC<FactoryBannerTestProps> = ({ isOpen, onClose }) => {
  const [currentConfigIndex, setCurrentConfigIndex] = useState(0);
  const [seed, setSeed] = useState(12345);

  if (!isOpen) return null;

  const currentConfig = TEST_CONFIGS[currentConfigIndex];

  const handleNext = () => {
    setCurrentConfigIndex((prev) => (prev + 1) % TEST_CONFIGS.length);
  };

  const handlePrevious = () => {
    setCurrentConfigIndex((prev) => (prev - 1 + TEST_CONFIGS.length) % TEST_CONFIGS.length);
  };

  const handleRandomize = () => {
    setSeed(Math.floor(Math.random() * 100000));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-gray-100">Factory Banner Test Display</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Current Configuration Info */}
        <div className="px-6 py-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrevious}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Previous configuration"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h3 className="text-lg font-semibold text-gray-100">{currentConfig.name}</h3>
                <p className="text-sm text-gray-400">
                  Config {currentConfigIndex + 1} of {TEST_CONFIGS.length} • Seed: {seed}
                </p>
              </div>
              <button
                onClick={handleNext}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Next configuration"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <button
              onClick={handleRandomize}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Randomize Seed
            </button>
          </div>
        </div>

        {/* Configuration Details */}
        <div className="px-6 py-3 bg-gray-850 border-b border-gray-700">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Era:</span>
              <span className="ml-2 text-gray-300">{currentConfig.era}</span>
            </div>
            <div>
              <span className="text-gray-500">Culture:</span>
              <span className="ml-2 text-gray-300">{currentConfig.culturalZone}</span>
            </div>
            <div>
              <span className="text-gray-500">Climate:</span>
              <span className="ml-2 text-gray-300">{currentConfig.climate}</span>
            </div>
            <div>
              <span className="text-gray-500">Season:</span>
              <span className="ml-2 text-gray-300">{currentConfig.season}</span>
            </div>
            <div>
              <span className="text-gray-500">Time:</span>
              <span className="ml-2 text-gray-300">{currentConfig.timeOfDay}</span>
            </div>
            <div>
              <span className="text-gray-500">Weather:</span>
              <span className="ml-2 text-gray-300">{currentConfig.weather.type}</span>
            </div>
            <div>
              <span className="text-gray-500">Industry:</span>
              <span className="ml-2 text-gray-300">{currentConfig.industryName}</span>
            </div>
            <div>
              <span className="text-gray-500">Production:</span>
              <span className="ml-2 text-gray-300">{currentConfig.productionLevel}%</span>
            </div>
          </div>
        </div>

        {/* Banner Display Area */}
        <div className="flex-1 overflow-auto bg-gray-950 p-8">
          <div className="flex items-center justify-center h-full">
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-2xl overflow-hidden">
              <FactoryBanner
                era={currentConfig.era}
                culturalZone={currentConfig.culturalZone}
                climate={currentConfig.climate}
                season={currentConfig.season}
                timeOfDay={currentConfig.timeOfDay}
                weather={currentConfig.weather}
                industryName={currentConfig.industryName}
                productionLevel={currentConfig.productionLevel}
                isRuined={currentConfig.isRuined || false}
                width={800}
                height={200}
                seed={seed}
                enableFxLayer={true}
              />
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="px-6 py-3 border-t border-gray-700 bg-gray-800">
          <div className="flex gap-2 overflow-x-auto">
            {TEST_CONFIGS.map((config, index) => (
              <button
                key={index}
                onClick={() => setCurrentConfigIndex(index)}
                className={`px-3 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                  index === currentConfigIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {config.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactoryBannerTest;