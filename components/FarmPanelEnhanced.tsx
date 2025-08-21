/**
 * components/FarmPanelEnhanced.tsx - Enhanced farm management interface that respects sidebars
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Tile, MapData, PlayerCharacter, Item, Season, HistoricalEra, NpcEntity,
  ClimateType, CulturalZone, TimeOfDay
} from '../types';
import FarmBanner from './FarmBanner';
import { generateFarmDetails } from '../services/farmGenerator';
import { calculatePrices } from '../services/economyService';
import { createItemInstance } from '../utils/inventoryUtils';
import { ITEM_DEFINITIONS } from '../constants';
import { 
  generateFarmResponse, 
  generateFarmActivityAdvice, 
  generateFarmEvent,
  updateCropGrowth,
  FarmState,
  CropInfo,
  LivestockInfo
} from '../services/minigameLLMService';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';

interface FarmPanelEnhancedProps {
  tile: Tile;
  mapData: MapData;
  playerCharacter: PlayerCharacter;
  npcs: NpcEntity[];
  onClose: () => void;
  onBuy: (itemBaseId: string, price: number) => void;
  onSell: (item: Item, price: number) => void;
  season: Season;
  gameTimeHours: number;
  onUpdatePlayerCurrency?: (newCurrency: number) => void;
  onAddToInventory?: (item: Item) => void;
  onProgressTime?: (months: number) => void;
  onShowEvent?: (event: any) => void;
}

type TabType = 'overview' | 'fields' | 'activities' | 'trade' | 'advisor' | 'laborer';

// Crop types available by season and culture
const CROP_TYPES_BY_CULTURE: Record<string, Record<Season, string[]>> = {
  EUROPEAN: {
    spring: ['wheat', 'barley', 'peas', 'oats'],
    summer: ['wheat', 'barley', 'vegetables'],
    fall: ['turnips', 'cabbage', 'onions'],
    winter: ['winter wheat']
  },
  EAST_ASIAN: {
    spring: ['rice', 'soybeans', 'millet'],
    summer: ['rice', 'vegetables', 'tea'],
    fall: ['rice', 'sweet potatoes'],
    winter: ['cabbage', 'radishes']
  },
  MENA: {
    spring: ['wheat', 'barley', 'lentils'],
    summer: ['dates', 'melons', 'cotton'],
    fall: ['wheat', 'chickpeas'],
    winter: ['wheat', 'barley']
  }
};

// Crop emojis for visual display
const CROP_EMOJIS: Record<string, string> = {
  wheat: '🌾',
  barley: '🌾',
  rice: '🌾',
  oats: '🌾',
  peas: '🟢',
  vegetables: '🥬',
  turnips: '🟣',
  cabbage: '🥬',
  onions: '🧅',
  soybeans: '🫘',
  millet: '🌾',
  tea: '🍵',
  dates: '🌴',
  melons: '🍈',
  cotton: '☁️',
  lentils: '🟤',
  chickpeas: '🟤',
  'sweet potatoes': '🍠',
  radishes: '🔴'
};

const FarmPanelEnhanced: React.FC<FarmPanelEnhancedProps> = ({
  tile, mapData, playerCharacter, npcs, onClose, onBuy, onSell, 
  season, gameTimeHours, onUpdatePlayerCurrency, onAddToInventory,
  onProgressTime, onShowEvent
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [farmState, setFarmState] = useState<FarmState | null>(null);
  const [farmDetails, setFarmDetails] = useState<any>(null);
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const [selectedCropType, setSelectedCropType] = useState<string>('wheat');
  const [isPlanting, setIsPlanting] = useState(false);
  const [llmResponse, setLlmResponse] = useState<string>('');
  const [llmQuery, setLlmQuery] = useState<string>('');
  const [isLlmLoading, setIsLlmLoading] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [localCurrency, setLocalCurrency] = useState(playerCharacter.currency);
  const [isWorking, setIsWorking] = useState(false);
  const [workDuration, setWorkDuration] = useState(3); // months
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Simple notification system replacement for missing toast
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);
  
  // Parse historical context
  const { era, culturalZone, year } = useMemo(() => {
    const dateInfo = parseDateString(mapData.timeSlice || '1650');
    return {
      era: dateInfo.era as HistoricalEra,
      culturalZone: mapLocationToCulture(mapData.continent || 'Europe', dateInfo.year),
      year: dateInfo.year
    };
  }, [mapData.timeSlice, mapData.continent]);
  
  // Get available crops for current culture and season
  const availableCrops = useMemo(() => {
    const cultural = CROP_TYPES_BY_CULTURE[culturalZone] || CROP_TYPES_BY_CULTURE.EUROPEAN;
    return cultural[season] || ['wheat'];
  }, [culturalZone, season]);
  
  // Initialize farm state
  useEffect(() => {
    const initializeFarm = async () => {
      const details = await generateFarmDetails(
        tile,
        { date: mapData.timeSlice || '1750', location: mapData.continent || 'Europe', climate: mapData.climate },
        false
      );
      setFarmDetails(details);
      
      // Initialize with some existing crops if it's an established farm
      const initialCrops: CropInfo[] = [];
      if (tile.cropType) {
        // Add some pre-existing crops
        for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
          initialCrops.push({
            type: tile.cropType,
            plantedDate: 'existing',
            growthStage: season === 'spring' ? 'sprout' : 
                        season === 'summer' ? 'growing' : 
                        season === 'fall' ? 'mature' : 'seed',
            health: 60 + Math.random() * 40,
            expectedYield: 80 + Math.floor(Math.random() * 40),
            daysToHarvest: season === 'fall' ? 0 : 
                          season === 'summer' ? 15 : 
                          season === 'spring' ? 45 : 60
          });
        }
      }
      
      const initialLivestock: LivestockInfo[] = details.economicStatus === 'prosperous' ? [
        { type: 'cattle', count: 2 + Math.floor(Math.random() * 2), health: 85, productivity: 75 },
        { type: 'chickens', count: 8 + Math.floor(Math.random() * 8), health: 90, productivity: 80 },
        { type: 'sheep', count: 4 + Math.floor(Math.random() * 4), health: 80, productivity: 70 }
      ] : [
        { type: 'chickens', count: 4 + Math.floor(Math.random() * 4), health: 75, productivity: 60 }
      ];
      
      const state: FarmState = {
        context: 'farm',
        location: mapData.localArea || mapData.continent || 'Unknown',
        season,
        year,
        era,
        culturalZone,
        recentActions: [],
        currency: localCurrency,
        crops: initialCrops,
        livestock: initialLivestock,
        workers: details.economicStatus === 'prosperous' ? 2 + Math.floor(Math.random() * 2) : 1,
        tools: details.economicStatus === 'prosperous' 
          ? ['plow', 'scythe', 'rake', 'hoe', 'seed drill']
          : ['hoe', 'sickle'],
        buildings: details.economicStatus === 'prosperous'
          ? ['farmhouse', 'barn', 'granary', 'well']
          : ['cottage', 'shed'],
        soilQuality: tile.altitude && tile.altitude > 0.5 ? 'poor' : 
                    tile.humidity && tile.humidity > 60 ? 'fertile' : 'average',
        waterAccess: true
      };
      
      setFarmState(state);
    };
    
    initializeFarm();
  }, [tile, mapData, season, year, era, culturalZone, localCurrency]);
  
  // Handle planting crops
  const handlePlantCrop = useCallback(() => {
    if (!farmState || selectedField === null) {
      showToast('Select a field first', 'error');
      return;
    }
    
    if (farmState.crops[selectedField]) {
      showToast('This field already has crops!', 'error');
      return;
    }
    
    // Check if player has seeds (simplified - in full game would check inventory)
    const seedCost = 10;
    if (localCurrency < seedCost) {
      showToast(`Need ${seedCost} coins for seeds`, 'error');
      return;
    }
    
    // Plant the crop
    const newCrop: CropInfo = {
      type: selectedCropType,
      plantedDate: `${season} ${year}`,
      growthStage: 'seed',
      health: 90 + Math.random() * 10,
      expectedYield: 60 + Math.floor(Math.random() * 40),
      daysToHarvest: 45
    };
    
    const updatedCrops = [...farmState.crops];
    updatedCrops[selectedField] = newCrop;
    
    setFarmState(prev => prev ? {
      ...prev,
      crops: updatedCrops,
      recentActions: [...prev.recentActions, `Planted ${selectedCropType}`].slice(-5)
    } : null);
    
    setLocalCurrency(prev => prev - seedCost);
    onUpdatePlayerCurrency?.(localCurrency - seedCost);
    
    showToast(`Planted ${selectedCropType} in field ${selectedField + 1}`, 'success');
    setIsPlanting(false);
  }, [farmState, selectedField, selectedCropType, localCurrency, season, year, showToast, onUpdatePlayerCurrency]);
  
  // Handle harvesting
  const handleHarvestCrop = useCallback((fieldIndex: number) => {
    if (!farmState || !farmState.crops[fieldIndex]) {
      showToast('No crop to harvest here', 'error');
      return;
    }
    
    const crop = farmState.crops[fieldIndex];
    if (crop.growthStage !== 'harvest' && crop.growthStage !== 'mature') {
      showToast('Crop is not ready for harvest', 'error');
      return;
    }
    
    // Calculate yield based on health
    const actualYield = Math.floor(crop.expectedYield * (crop.health / 100));
    const pricePerUnit = 2 + Math.random() * 2; // 2-4 coins per unit
    const earnings = Math.floor(actualYield * pricePerUnit);
    
    // Remove crop and add money
    const updatedCrops = [...farmState.crops];
    updatedCrops[fieldIndex] = null as any;
    
    setFarmState(prev => prev ? {
      ...prev,
      crops: updatedCrops,
      currency: prev.currency + earnings,
      recentActions: [...prev.recentActions, `Harvested ${crop.type} for ${earnings} coins`].slice(-5)
    } : null);
    
    setLocalCurrency(prev => prev + earnings);
    onUpdatePlayerCurrency?.(localCurrency + earnings);
    
    // Add harvested items to inventory
    if (onAddToInventory) {
      const itemId = crop.type.toUpperCase().replace(/ /g, '_');
      if (ITEM_DEFINITIONS[itemId]) {
        for (let i = 0; i < Math.min(actualYield, 5); i++) {
          const item = createItemInstance(itemId);
          onAddToInventory(item);
        }
      }
    }
    
    showToast(`Harvested ${actualYield} ${crop.type} for ${earnings} coins!`, 'success');
  }, [farmState, localCurrency, showToast, onUpdatePlayerCurrency, onAddToInventory]);
  
  // Handle tending fields
  const handleTendField = useCallback((fieldIndex: number) => {
    if (!farmState || !farmState.crops[fieldIndex]) {
      showToast('No crop to tend here', 'error');
      return;
    }
    
    const crop = farmState.crops[fieldIndex];
    
    // Improve health and reduce days to harvest
    const updatedCrop = {
      ...crop,
      health: Math.min(100, crop.health + 10 + Math.random() * 10),
      daysToHarvest: crop.daysToHarvest ? Math.max(0, crop.daysToHarvest - 2) : 0
    };
    
    const updatedCrops = [...farmState.crops];
    updatedCrops[fieldIndex] = updatedCrop;
    
    setFarmState(prev => prev ? {
      ...prev,
      crops: updatedCrops,
      recentActions: [...prev.recentActions, `Tended ${crop.type} field`].slice(-5)
    } : null);
    
    showToast(`Tended ${crop.type} field - health improved!`, 'success');
  }, [farmState, showToast]);
  
  // Handle working as farm laborer
  const handleWorkAsLaborer = useCallback(async (months: number) => {
    if (!farmState || !farmDetails) return;
    
    setIsWorking(true);
    
    // Calculate wages based on duration and farm prosperity
    const baseWagePerMonth = farmDetails.economicStatus === 'prosperous' ? 50 : 
                             farmDetails.economicStatus === 'moderate' ? 30 : 20;
    const totalWages = baseWagePerMonth * months;
    
    // Update crops based on time passed
    const daysPerMonth = 30;
    const daysPassed = months * daysPerMonth;
    const updatedCrops = updateCropGrowth(farmState.crops, season, daysPassed);
    
    setFarmState(prev => prev ? {
      ...prev,
      crops: updatedCrops,
      recentActions: [...prev.recentActions, `Worked for ${months} months`].slice(-5)
    } : null);
    
    // Progress time in the game
    if (onProgressTime) {
      onProgressTime(months);
    }
    
    // Create work completion event
    const workEvent = {
      title: 'Farm Labor Complete',
      description: `You worked on ${farmDetails.name || 'the farm'} for ${months} month${months > 1 ? 's' : ''}, helping with ${season} tasks.`,
      outcomes: [
        {
          text: 'Collect wages',
          effects: [
            { type: 'currency', value: totalWages },
            { type: 'reputation', value: 5 }
          ]
        }
      ]
    };
    
    // Update currency locally
    setLocalCurrency(prev => prev + totalWages);
    onUpdatePlayerCurrency?.(localCurrency + totalWages);
    
    // Show event modal if available
    if (onShowEvent) {
      onShowEvent(workEvent);
    } else {
      showToast(`Earned ${totalWages} coins for ${months} months of work!`, 'success');
    }
    
    setIsWorking(false);
  }, [farmState, farmDetails, season, localCurrency, onProgressTime, onShowEvent, onUpdatePlayerCurrency, showToast]);
  
  // Handle LLM queries
  const handleLlmQuery = useCallback(async () => {
    if (!farmState || !llmQuery.trim()) return;
    
    setIsLlmLoading(true);
    try {
      const response = await generateFarmResponse(llmQuery, farmState, playerCharacter);
      setLlmResponse(response);
      setFarmState(prev => prev ? {
        ...prev,
        recentActions: [...prev.recentActions, `Asked: ${llmQuery}`].slice(-5)
      } : null);
    } catch (error) {
      console.error('LLM query failed:', error);
      setLlmResponse('The farm advisor is momentarily distracted.');
    }
    setIsLlmLoading(false);
    setLlmQuery('');
  }, [llmQuery, farmState, playerCharacter]);
  
  // Generate farm events periodically
  useEffect(() => {
    if (!farmState) return;
    
    const eventTimer = setTimeout(async () => {
      if (Math.random() < 0.15) { // 15% chance every 20 seconds
        const event = await generateFarmEvent(farmState);
        setCurrentEvent(event);
      }
    }, 20000);
    
    return () => clearTimeout(eventTimer);
  }, [farmState]);
  
  // Update crops growth daily
  useEffect(() => {
    if (!farmState) return;
    
    const growthTimer = setInterval(() => {
      const updatedCrops = updateCropGrowth(farmState.crops, season, 1);
      setFarmState(prev => prev ? { ...prev, crops: updatedCrops } : null);
    }, 10000); // Every 10 seconds for demo (would be daily in real game)
    
    return () => clearInterval(growthTimer);
  }, [farmState, season]);
  
  // Render field grid
  const renderFieldGrid = () => {
    const fields = [];
    const gridCols = 4;
    const gridRows = 6;
    
    for (let i = 0; i < gridRows * gridCols; i++) {
      const crop = farmState?.crops[i];
      const isSelected = selectedField === i;
      
      fields.push(
        <div
          key={i}
          onClick={() => setSelectedField(i)}
          className={`
            relative border-2 cursor-pointer transition-all rounded-lg
            ${isSelected ? 'border-yellow-400 ring-2 ring-yellow-300 scale-105' : 'border-slate-600'}
            ${crop ? 'bg-gradient-to-br from-green-900 to-green-800' : 'bg-gradient-to-br from-amber-900 to-amber-800'}
            hover:border-yellow-300 hover:scale-102
            w-full aspect-square flex flex-col items-center justify-center
          `}
        >
          <div className="text-xs text-slate-300 absolute top-1 left-1">#{i + 1}</div>
          {crop ? (
            <>
              <div className="text-2xl mb-1">
                {crop.growthStage === 'seed' && '🌱'}
                {crop.growthStage === 'sprout' && '🌿'}
                {crop.growthStage === 'growing' && '🌾'}
                {crop.growthStage === 'mature' && (CROP_EMOJIS[crop.type] || '🌽')}
                {crop.growthStage === 'harvest' && '✨'}
                {crop.growthStage === 'dead' && '💀'}
              </div>
              <div className="text-xs text-center px-1">
                <div className="text-white font-semibold">{crop.type}</div>
                <div className="text-green-300">{Math.round(crop.health)}% HP</div>
                {crop.growthStage === 'harvest' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHarvestCrop(i);
                    }}
                    className="mt-1 px-2 py-0.5 bg-yellow-500 text-black text-xs rounded font-bold hover:bg-yellow-400"
                  >
                    Harvest
                  </button>
                )}
                {crop.growthStage !== 'harvest' && crop.growthStage !== 'dead' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTendField(i);
                    }}
                    className="mt-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-400"
                  >
                    Tend
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="text-3xl mb-1 opacity-30">🌱</div>
              <div className="text-xs text-slate-400">Empty</div>
              {isSelected && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlanting(true);
                  }}
                  className="mt-1 px-2 py-0.5 bg-green-500 text-white text-xs rounded hover:bg-green-400"
                >
                  Plant
                </button>
              )}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-4 gap-2">
        {fields}
      </div>
    );
  };
  
  // Determine time of day
  const timeOfDay = gameTimeHours >= 5 && gameTimeHours < 8 ? 'Dawn' :
                    gameTimeHours >= 8 && gameTimeHours < 12 ? 'Morning' :
                    gameTimeHours >= 12 && gameTimeHours < 16 ? 'Midday' :
                    gameTimeHours >= 16 && gameTimeHours < 19 ? 'Afternoon' :
                    gameTimeHours >= 19 && gameTimeHours < 21 ? 'Dusk' : 'Night';
  
  return (
    <div className="fixed inset-x-0 top-16 bottom-24 mx-auto max-w-6xl z-40 flex flex-col bg-slate-900/95 backdrop-blur-sm border-2 border-slate-700 rounded-lg shadow-2xl">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-600' :
          notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        } text-white font-semibold`}>
          {notification.message}
        </div>
      )}
      
      {/* Header with banner */}
      <div className="relative h-40 overflow-hidden rounded-t-lg">
        {farmDetails && (
          <FarmBanner
            era={era}
            culturalZone={culturalZone}
            condition={farmDetails.economicStatus as 'humble' | 'prosperous'}
            cropType={tile.cropType || 'wheat'}
            climate={mapData.climate}
            season={season}
            seed={mapData.seed}
            height={160}
            width={1200}
            timeOfDay={timeOfDay as TimeOfDay}
            farmName={farmDetails.farmName}
            farmerName={farmDetails.farmerName}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-4 text-white">
          <h1 className="text-2xl font-bold drop-shadow-lg">{farmDetails?.farmName || 'Farm'}</h1>
          <p className="text-sm drop-shadow-md opacity-90">
            {farmDetails?.farmerName} • {season} {year} • {localCurrency} 🪙
          </p>
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg transition-colors"
        >
          ✕
        </button>
      </div>
      
      {/* Tab navigation */}
      <div className="flex border-b border-slate-700 bg-slate-800/50">
        {(['overview', 'fields', 'activities', 'trade', 'advisor', 'laborer'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-2 font-semibold capitalize text-sm transition-all
              ${activeTab === tab 
                ? 'bg-slate-700 text-yellow-400 border-b-2 border-yellow-400' 
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'}
            `}
          >
            {tab === 'advisor' ? '🧙‍♂️ Advisor' : 
             tab === 'fields' ? '🌾 Fields' :
             tab === 'activities' ? '⚒️ Work' :
             tab === 'trade' ? '💰 Trade' : 
             tab === 'laborer' ? '👨‍🌾 Labor' :
             '📊 Overview'}
          </button>
        ))}
      </div>
      
      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Farm stats */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <h3 className="text-yellow-400 font-bold mb-2 text-sm">Farm Status</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Quality:</span>
                    <span className={`font-semibold ${
                      farmState?.soilQuality === 'fertile' ? 'text-green-400' :
                      farmState?.soilQuality === 'poor' ? 'text-red-400' : 'text-white'
                    }`}>{farmState?.soilQuality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Workers:</span>
                    <span className="text-white">{farmState?.workers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Buildings:</span>
                    <span className="text-white">{farmState?.buildings.length}</span>
                  </div>
                </div>
              </div>
              
              {/* Crops summary */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <h3 className="text-green-400 font-bold mb-2 text-sm">Crops</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Planted:</span>
                    <span className="text-white">{farmState?.crops.filter(c => c).length || 0}/24</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ready:</span>
                    <span className="text-yellow-400 font-bold">
                      {farmState?.crops.filter(c => c?.growthStage === 'harvest').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Health:</span>
                    <span className="text-white">
                      {farmState?.crops.filter(c => c).length > 0 
                        ? Math.round(farmState.crops.filter(c => c).reduce((sum, c) => sum + (c?.health || 0), 0) / farmState.crops.filter(c => c).length)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Livestock */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <h3 className="text-amber-400 font-bold mb-2 text-sm">Livestock</h3>
                <div className="space-y-1 text-xs">
                  {farmState?.livestock.map((animal, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-slate-300 capitalize">{animal.type}:</span>
                      <span className="text-white">{animal.count}</span>
                    </div>
                  )) || <p className="text-slate-500">No livestock</p>}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'fields' && (
            <div className="space-y-3">
              {isPlanting && selectedField !== null && (
                <div className="bg-slate-800 rounded-lg p-3 border-2 border-green-500">
                  <h3 className="text-green-400 font-bold mb-2">Plant in Field #{selectedField + 1}</h3>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {availableCrops.map(crop => (
                      <button
                        key={crop}
                        onClick={() => setSelectedCropType(crop)}
                        className={`px-3 py-1 rounded text-sm ${
                          selectedCropType === crop 
                            ? 'bg-green-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {CROP_EMOJIS[crop]} {crop}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePlantCrop}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-semibold"
                    >
                      Plant {selectedCropType} (10 🪙)
                    </button>
                    <button
                      onClick={() => setIsPlanting(false)}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              {renderFieldGrid()}
              
              {selectedField !== null && (
                <div className="bg-slate-800/50 rounded-lg p-3 mt-3 border border-slate-700">
                  <h3 className="text-yellow-400 font-bold mb-2">Field #{selectedField + 1} Details</h3>
                  {farmState?.crops[selectedField] ? (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-400">Crop:</span> {farmState.crops[selectedField].type}
                      </div>
                      <div>
                        <span className="text-slate-400">Stage:</span> {farmState.crops[selectedField].growthStage}
                      </div>
                      <div>
                        <span className="text-slate-400">Health:</span> {Math.round(farmState.crops[selectedField].health)}%
                      </div>
                      <div>
                        <span className="text-slate-400">Expected Yield:</span> {farmState.crops[selectedField].expectedYield}
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500">Empty field ready for planting</p>
                  )}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'activities' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab('fields')}
                className="bg-gradient-to-br from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white p-4 rounded-lg flex flex-col items-center transition-all"
              >
                <span className="text-3xl mb-2">🌱</span>
                <span className="font-bold">Plant Crops</span>
                <span className="text-xs mt-1 opacity-90">Select empty fields to plant</span>
              </button>
              
              <button
                onClick={() => {
                  const harvestable = farmState?.crops.filter(c => c?.growthStage === 'harvest');
                  if (harvestable?.length) {
                    showToast(`${harvestable.length} crops ready to harvest!`, 'info');
                    setActiveTab('fields');
                  } else {
                    showToast('No crops ready to harvest', 'error');
                  }
                }}
                className="bg-gradient-to-br from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white p-4 rounded-lg flex flex-col items-center transition-all"
              >
                <span className="text-3xl mb-2">🌾</span>
                <span className="font-bold">Harvest</span>
                <span className="text-xs mt-1 opacity-90">
                  {farmState?.crops.filter(c => c?.growthStage === 'harvest').length || 0} ready
                </span>
              </button>
              
              <button
                onClick={() => {
                  showToast('Select fields to tend individually', 'info');
                  setActiveTab('fields');
                }}
                className="bg-gradient-to-br from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white p-4 rounded-lg flex flex-col items-center transition-all"
              >
                <span className="text-3xl mb-2">💧</span>
                <span className="font-bold">Tend Fields</span>
                <span className="text-xs mt-1 opacity-90">Water and maintain crops</span>
              </button>
              
              <button
                onClick={() => showToast('Upgrade feature coming soon!', 'info')}
                className="bg-gradient-to-br from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 text-white p-4 rounded-lg flex flex-col items-center transition-all opacity-75"
              >
                <span className="text-3xl mb-2">⚒️</span>
                <span className="font-bold">Upgrade</span>
                <span className="text-xs mt-1 opacity-90">Improve tools & buildings</span>
              </button>
            </div>
          )}
          
          {activeTab === 'trade' && (
            <div className="space-y-3">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <h3 className="text-green-400 font-bold mb-3">Market Prices Today</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries(CROP_EMOJIS).slice(0, 8).map(([crop, emoji]) => (
                    <div key={crop} className="flex justify-between items-center">
                      <span className="text-slate-300">
                        {emoji} {crop}:
                      </span>
                      <span className="text-yellow-400 font-semibold">
                        {(2 + Math.random() * 2).toFixed(1)} 🪙/unit
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <h3 className="text-amber-400 font-bold mb-3">Your Harvest</h3>
                {farmState?.crops.filter(c => c?.growthStage === 'harvest').length ? (
                  <div className="space-y-2">
                    {farmState.crops.map((crop, i) => 
                      crop?.growthStage === 'harvest' ? (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-slate-300">
                            Field #{i + 1}: {crop.expectedYield} {crop.type}
                          </span>
                          <button
                            onClick={() => handleHarvestCrop(i)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-sm"
                          >
                            Sell for ~{Math.floor(crop.expectedYield * 2.5)} 🪙
                          </button>
                        </div>
                      ) : null
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500">No crops ready for harvest</p>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'advisor' && (
            <div className="space-y-3">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <p className="text-slate-300 mb-3 text-sm">
                  Ask about farming in {year} {mapData.continent}. I know about {culturalZone} farming traditions.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={llmQuery}
                    onChange={(e) => setLlmQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLlmQuery()}
                    placeholder="Ask about farming..."
                    className="flex-1 px-3 py-2 bg-slate-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                    disabled={isLlmLoading}
                  />
                  <button
                    onClick={handleLlmQuery}
                    disabled={isLlmLoading || !llmQuery.trim()}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded font-semibold disabled:opacity-50 text-sm"
                  >
                    Ask
                  </button>
                </div>
              </div>
              
              {llmResponse && (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-green-500/50">
                  <h3 className="text-green-400 font-bold mb-2 text-sm">Advisor Says:</h3>
                  <p className="text-white text-sm leading-relaxed">{llmResponse}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setLlmQuery('What should I plant this season?'); handleLlmQuery(); }}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300"
                >
                  Best crops for {season}?
                </button>
                <button
                  onClick={() => { setLlmQuery('How can I improve my soil?'); handleLlmQuery(); }}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300"
                >
                  Improve soil quality?
                </button>
                <button
                  onClick={() => { setLlmQuery('What farming tools should I use?'); handleLlmQuery(); }}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300"
                >
                  Best tools for era?
                </button>
                <button
                  onClick={() => { setLlmQuery('How do I deal with pests?'); handleLlmQuery(); }}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300"
                >
                  Pest control?
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'laborer' && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <h3 className="text-yellow-400 font-bold mb-3">Work as Farm Laborer</h3>
                <p className="text-slate-300 mb-4 text-sm">
                  Join the farm as a laborer to earn wages. Time will advance and you'll be paid for your work.
                </p>
                
                <div className="mb-4">
                  <p className="text-slate-400 text-sm mb-2">
                    Wage: {farmDetails?.economicStatus === 'prosperous' ? '50' : 
                           farmDetails?.economicStatus === 'moderate' ? '30' : '20'} coins per month
                  </p>
                  <p className="text-slate-400 text-sm">
                    Current Season: {season} {year}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-white font-semibold text-sm">Choose duration:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleWorkAsLaborer(1)}
                      disabled={isWorking}
                      className="p-3 bg-green-700 hover:bg-green-600 disabled:bg-slate-600 text-white rounded font-semibold text-sm"
                    >
                      Work 1 Month
                      <span className="block text-xs opacity-75">
                        Earn {farmDetails?.economicStatus === 'prosperous' ? '50' : 
                              farmDetails?.economicStatus === 'moderate' ? '30' : '20'} coins
                      </span>
                    </button>
                    <button
                      onClick={() => handleWorkAsLaborer(3)}
                      disabled={isWorking}
                      className="p-3 bg-green-700 hover:bg-green-600 disabled:bg-slate-600 text-white rounded font-semibold text-sm"
                    >
                      Work 3 Months
                      <span className="block text-xs opacity-75">
                        Earn {(farmDetails?.economicStatus === 'prosperous' ? 50 : 
                              farmDetails?.economicStatus === 'moderate' ? 30 : 20) * 3} coins
                      </span>
                    </button>
                    <button
                      onClick={() => handleWorkAsLaborer(6)}
                      disabled={isWorking}
                      className="p-3 bg-amber-700 hover:bg-amber-600 disabled:bg-slate-600 text-white rounded font-semibold text-sm"
                    >
                      Work Half Year
                      <span className="block text-xs opacity-75">
                        Earn {(farmDetails?.economicStatus === 'prosperous' ? 50 : 
                              farmDetails?.economicStatus === 'moderate' ? 30 : 20) * 6} coins
                      </span>
                    </button>
                    <button
                      onClick={() => handleWorkAsLaborer(12)}
                      disabled={isWorking}
                      className="p-3 bg-amber-700 hover:bg-amber-600 disabled:bg-slate-600 text-white rounded font-semibold text-sm"
                    >
                      Work Full Year
                      <span className="block text-xs opacity-75">
                        Earn {(farmDetails?.economicStatus === 'prosperous' ? 50 : 
                              farmDetails?.economicStatus === 'moderate' ? 30 : 20) * 12} coins
                      </span>
                    </button>
                  </div>
                </div>
                
                {isWorking && (
                  <div className="mt-4 p-3 bg-blue-900/50 border border-blue-500 rounded">
                    <p className="text-blue-300 text-sm">Working... Time is passing...</p>
                  </div>
                )}
                
                <div className="mt-4 p-3 bg-slate-700 rounded">
                  <p className="text-amber-400 text-xs font-semibold mb-1">⚠️ Note:</p>
                  <p className="text-slate-300 text-xs">
                    • Time will advance by your chosen duration<br/>
                    • Crops will grow or die based on season<br/>
                    • You'll gain reputation with the farm<br/>
                    • Health and fatigue will be affected by labor
                  </p>
                </div>
              </div>
              
              {/* Recent work history */}
              {farmState?.recentActions.filter(a => a.includes('Worked')).length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <h4 className="text-slate-400 font-semibold mb-2 text-sm">Work History</h4>
                  <ul className="space-y-1">
                    {farmState.recentActions.filter(a => a.includes('Worked')).map((action, i) => (
                      <li key={i} className="text-slate-300 text-xs">• {action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Side panel for events */}
        {currentEvent && (
          <div className="w-64 border-l border-slate-700 p-3 bg-slate-800/30">
            <div className="bg-amber-900/30 border border-amber-600 rounded-lg p-3">
              <h3 className="text-amber-400 font-bold mb-2 text-sm">{currentEvent.title}</h3>
              <p className="text-white text-xs mb-3">{currentEvent.description}</p>
              <div className="space-y-1">
                {currentEvent.options.map((option: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => {
                      setFarmState(prev => prev ? {
                        ...prev,
                        recentActions: [...prev.recentActions, option].slice(-5)
                      } : null);
                      setCurrentEvent(null);
                    }}
                    className="w-full text-left p-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white"
                  >
                    {i + 1}. {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmPanelEnhanced;