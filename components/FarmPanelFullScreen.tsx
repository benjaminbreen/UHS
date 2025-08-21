/**
 * components/FarmPanelFullScreen.tsx - Full-screen interactive farm management interface
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Tile, MapData, PlayerCharacter, Item, Season, HistoricalEra, NpcEntity } from '../types';
import FarmBanner from './FarmBanner';
import { generateFarmDetails } from '../services/farmGenerator';
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
import { ITEM_DEFINITIONS } from '../constants';

interface FarmPanelFullScreenProps {
  tile: Tile;
  mapData: MapData;
  playerCharacter: PlayerCharacter;
  npcs: NpcEntity[];
  onClose: () => void;
  onBuy: (itemBaseId: string, price: number) => void;
  onSell: (item: Item, price: number) => void;
  season: Season;
  gameTimeHours: number;
}

type TabType = 'overview' | 'fields' | 'activities' | 'trade' | 'advisor';

const FarmPanelFullScreen: React.FC<FarmPanelFullScreenProps> = ({
  tile, mapData, playerCharacter, npcs, onClose, onBuy, onSell, season, gameTimeHours
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [farmState, setFarmState] = useState<FarmState | null>(null);
  const [llmResponse, setLlmResponse] = useState<string>('');
  const [llmQuery, setLlmQuery] = useState<string>('');
  const [isLlmLoading, setIsLlmLoading] = useState(false);
  const [farmDetails, setFarmDetails] = useState<any>(null);
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  
  // Parse historical context
  const { era, culturalZone, year } = useMemo(() => {
    const dateInfo = parseDateString(mapData.timeSlice || '1650');
    return {
      era: dateInfo.era as HistoricalEra,
      culturalZone: mapLocationToCulture(mapData.continent || 'Europe', dateInfo.year),
      year: dateInfo.year
    };
  }, [mapData.timeSlice, mapData.continent]);
  
  // Initialize farm state
  useEffect(() => {
    const initializeFarm = async () => {
      const details = await generateFarmDetails(
        tile,
        { date: mapData.timeSlice || '1750', location: mapData.continent || 'Europe', climate: mapData.climate },
        false
      );
      setFarmDetails(details);
      
      // Create initial farm state
      const initialCrops: CropInfo[] = tile.cropType ? [{
        type: tile.cropType,
        growthStage: season === 'spring' ? 'sprout' : season === 'summer' ? 'growing' : 'mature',
        health: 75 + Math.random() * 25,
        expectedYield: 100 + Math.floor(Math.random() * 50),
        daysToHarvest: season === 'spring' ? 60 : season === 'summer' ? 30 : 0
      }] : [];
      
      const initialLivestock: LivestockInfo[] = details.economicStatus === 'prosperous' ? [
        { type: 'cattle', count: 3 + Math.floor(Math.random() * 3), health: 80, productivity: 70 },
        { type: 'chickens', count: 10 + Math.floor(Math.random() * 10), health: 90, productivity: 85 }
      ] : [
        { type: 'chickens', count: 5 + Math.floor(Math.random() * 5), health: 75, productivity: 60 }
      ];
      
      const state: FarmState = {
        context: 'farm',
        location: mapData.localArea || mapData.continent || 'Unknown',
        season,
        year,
        era,
        culturalZone,
        recentActions: [],
        currency: playerCharacter.currency,
        crops: initialCrops,
        livestock: initialLivestock,
        workers: details.economicStatus === 'prosperous' ? 2 + Math.floor(Math.random() * 3) : 1,
        tools: details.economicStatus === 'prosperous' 
          ? ['plow', 'scythe', 'rake', 'hoe', 'seed drill']
          : ['hoe', 'sickle'],
        buildings: details.economicStatus === 'prosperous'
          ? ['farmhouse', 'barn', 'granary', 'well']
          : ['cottage', 'shed'],
        soilQuality: tile.altitude > 0.5 ? 'poor' : tile.humidity > 50 ? 'fertile' : 'average',
        waterAccess: true
      };
      
      setFarmState(state);
    };
    
    initializeFarm();
  }, [tile, mapData, season, year, era, culturalZone, playerCharacter.currency]);
  
  // Handle LLM queries
  const handleLlmQuery = useCallback(async () => {
    if (!farmState || !llmQuery.trim()) return;
    
    setIsLlmLoading(true);
    try {
      const response = await generateFarmResponse(llmQuery, farmState, playerCharacter);
      setLlmResponse(response);
      setFarmState(prev => prev ? {
        ...prev,
        recentActions: [...prev.recentActions, llmQuery].slice(-5)
      } : null);
    } catch (error) {
      console.error('LLM query failed:', error);
      setLlmResponse('The farm advisor is momentarily distracted.');
    }
    setIsLlmLoading(false);
    setLlmQuery('');
  }, [llmQuery, farmState, playerCharacter]);
  
  // Handle farm activities
  const handleActivity = useCallback(async (activity: 'plant' | 'harvest' | 'tend' | 'trade' | 'upgrade') => {
    if (!farmState) return;
    
    setIsLlmLoading(true);
    const advice = await generateFarmActivityAdvice(activity, farmState);
    setLlmResponse(advice);
    
    // Update farm state based on activity
    if (activity === 'harvest' && farmState.crops.some(c => c.growthStage === 'harvest')) {
      const harvestedCrops = farmState.crops.filter(c => c.growthStage === 'harvest');
      const newCurrency = farmState.currency + harvestedCrops.reduce((sum, c) => sum + c.expectedYield * 2, 0);
      
      setFarmState(prev => prev ? {
        ...prev,
        crops: prev.crops.filter(c => c.growthStage !== 'harvest'),
        currency: newCurrency,
        recentActions: [...prev.recentActions, `Harvested ${harvestedCrops.length} crops`].slice(-5)
      } : null);
    }
    
    setIsLlmLoading(false);
  }, [farmState]);
  
  // Generate random events
  useEffect(() => {
    if (!farmState) return;
    
    const eventTimer = setTimeout(async () => {
      if (Math.random() < 0.2) { // 20% chance every 30 seconds
        const event = await generateFarmEvent(farmState);
        setCurrentEvent(event);
      }
    }, 30000);
    
    return () => clearTimeout(eventTimer);
  }, [farmState]);
  
  // Render field map
  const renderFieldMap = () => {
    const fieldSize = 60;
    const fields = [];
    
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const fieldIndex = row * 6 + col;
        const crop = farmState?.crops[fieldIndex];
        const isSelected = selectedField === fieldIndex;
        
        fields.push(
          <div
            key={fieldIndex}
            className={`
              border-2 cursor-pointer transition-all
              ${isSelected ? 'border-yellow-400 scale-105' : 'border-slate-600'}
              ${crop ? 'bg-green-800' : 'bg-amber-900'}
              hover:border-yellow-300 hover:scale-102
            `}
            style={{ width: fieldSize, height: fieldSize }}
            onClick={() => setSelectedField(fieldIndex)}
          >
            {crop && (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                {crop.growthStage === 'seed' && '🌱'}
                {crop.growthStage === 'sprout' && '🌿'}
                {crop.growthStage === 'growing' && '🌾'}
                {crop.growthStage === 'mature' && '🌽'}
                {crop.growthStage === 'harvest' && '✨'}
                {crop.growthStage === 'dead' && '💀'}
              </div>
            )}
          </div>
        );
      }
    }
    
    return (
      <div className="grid grid-cols-6 gap-1 p-4 bg-slate-800 rounded-lg">
        {fields}
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/95 backdrop-blur-sm">
      {/* Header with banner */}
      <div className="relative h-48 overflow-hidden border-b-2 border-slate-700">
        {farmDetails && (
          <FarmBanner
            era={era}
            culturalZone={culturalZone}
            condition={farmDetails.economicStatus as 'humble' | 'prosperous'}
            cropType={tile.cropType || 'wheat'}
            climate={mapData.climate}
            season={season}
            seed={mapData.seed}
            height={192}
            width={1400}
            farmName={farmDetails.farmName}
            farmerName={farmDetails.farmerName}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-6 text-white">
          <h1 className="text-3xl font-bold drop-shadow-lg">{farmDetails?.farmName || 'Farm'}</h1>
          <p className="text-lg drop-shadow-md">Proprietor: {farmDetails?.farmerName} • {season} {year}</p>
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg"
        >
          ✕
        </button>
      </div>
      
      {/* Tab navigation */}
      <div className="flex border-b border-slate-700 bg-slate-800">
        {(['overview', 'fields', 'activities', 'trade', 'advisor'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-6 py-3 font-semibold capitalize transition-all
              ${activeTab === tab 
                ? 'bg-slate-700 text-yellow-400 border-b-2 border-yellow-400' 
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'}
            `}
          >
            {tab === 'advisor' ? '🧙 Farm Advisor' : tab}
          </button>
        ))}
      </div>
      
      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left panel - Main content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {/* Farm stats */}
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="text-yellow-400 font-bold mb-3">Farm Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Soil Quality:</span>
                      <span className="text-white">{farmState?.soilQuality}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Workers:</span>
                      <span className="text-white">{farmState?.workers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Buildings:</span>
                      <span className="text-white">{farmState?.buildings.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tools:</span>
                      <span className="text-white">{farmState?.tools.length}</span>
                    </div>
                  </div>
                </div>
                
                {/* Crops */}
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="text-green-400 font-bold mb-3">Crops</h3>
                  <div className="space-y-2 text-sm">
                    {farmState?.crops.map((crop, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-slate-300">{crop.type}:</span>
                        <span className={`
                          ${crop.growthStage === 'harvest' ? 'text-yellow-400' : 
                            crop.growthStage === 'dead' ? 'text-red-400' : 'text-green-400'}
                        `}>
                          {crop.growthStage}
                        </span>
                      </div>
                    )) || <p className="text-slate-500">No crops planted</p>}
                  </div>
                </div>
                
                {/* Livestock */}
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="text-amber-400 font-bold mb-3">Livestock</h3>
                  <div className="space-y-2 text-sm">
                    {farmState?.livestock.map((animal, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-slate-300">{animal.type}:</span>
                        <span className="text-white">{animal.count}</span>
                      </div>
                    )) || <p className="text-slate-500">No livestock</p>}
                  </div>
                </div>
              </div>
              
              {/* Recent actions */}
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-cyan-400 font-bold mb-3">Recent Activities</h3>
                <ul className="space-y-1 text-sm text-slate-300">
                  {farmState?.recentActions.map((action, i) => (
                    <li key={i}>• {action}</li>
                  )) || <li className="text-slate-500">No recent activities</li>}
                </ul>
              </div>
            </div>
          )}
          
          {activeTab === 'fields' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-yellow-400">Field Management</h2>
              {renderFieldMap()}
              {selectedField !== null && (
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="text-green-400 font-bold mb-2">Field #{selectedField + 1}</h3>
                  {farmState?.crops[selectedField] ? (
                    <div className="space-y-2 text-sm">
                      <p>Crop: {farmState.crops[selectedField].type}</p>
                      <p>Stage: {farmState.crops[selectedField].growthStage}</p>
                      <p>Health: {farmState.crops[selectedField].health}%</p>
                      <p>Expected Yield: {farmState.crops[selectedField].expectedYield} units</p>
                      {farmState.crops[selectedField].daysToHarvest && (
                        <p>Days to Harvest: {farmState.crops[selectedField].daysToHarvest}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-500">Empty field - ready for planting</p>
                  )}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'activities' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-yellow-400">Farm Activities</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleActivity('plant')}
                  className="bg-green-700 hover:bg-green-600 text-white p-6 rounded-lg flex flex-col items-center"
                  disabled={isLlmLoading}
                >
                  <span className="text-4xl mb-2">🌱</span>
                  <span className="font-bold">Plant Crops</span>
                  <span className="text-sm mt-1">Sow seeds in empty fields</span>
                </button>
                
                <button
                  onClick={() => handleActivity('harvest')}
                  className="bg-amber-700 hover:bg-amber-600 text-white p-6 rounded-lg flex flex-col items-center"
                  disabled={isLlmLoading || !farmState?.crops.some(c => c.growthStage === 'harvest')}
                >
                  <span className="text-4xl mb-2">🌾</span>
                  <span className="font-bold">Harvest</span>
                  <span className="text-sm mt-1">Collect mature crops</span>
                </button>
                
                <button
                  onClick={() => handleActivity('tend')}
                  className="bg-blue-700 hover:bg-blue-600 text-white p-6 rounded-lg flex flex-col items-center"
                  disabled={isLlmLoading}
                >
                  <span className="text-4xl mb-2">🔧</span>
                  <span className="font-bold">Tend Fields</span>
                  <span className="text-sm mt-1">Water, weed, and maintain</span>
                </button>
                
                <button
                  onClick={() => handleActivity('upgrade')}
                  className="bg-purple-700 hover:bg-purple-600 text-white p-6 rounded-lg flex flex-col items-center"
                  disabled={isLlmLoading}
                >
                  <span className="text-4xl mb-2">⚒️</span>
                  <span className="font-bold">Upgrade Farm</span>
                  <span className="text-sm mt-1">Improve tools and buildings</span>
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'trade' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-yellow-400">Trade & Market</h2>
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-green-400 font-bold mb-3">Available for Sale</h3>
                <div className="space-y-2">
                  {farmState?.crops.filter(c => c.growthStage === 'harvest').map((crop, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span>{crop.type} - {crop.expectedYield} units</span>
                      <button className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded">
                        Sell for {crop.expectedYield * 2} 🪙
                      </button>
                    </div>
                  )) || <p className="text-slate-500">No products ready for sale</p>}
                </div>
              </div>
              
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-amber-400 font-bold mb-3">Market Prices</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Wheat:</p>
                    <p className="text-white">2-3 coins/unit</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Barley:</p>
                    <p className="text-white">1-2 coins/unit</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Vegetables:</p>
                    <p className="text-white">3-4 coins/unit</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Livestock:</p>
                    <p className="text-white">10-20 coins/head</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'advisor' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-yellow-400">Farm Advisor</h2>
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-slate-300 mb-4">
                  Ask me anything about farming in {year} {mapData.continent}. I can help with planting schedules, 
                  crop selection, livestock management, and more.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={llmQuery}
                    onChange={(e) => setLlmQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLlmQuery()}
                    placeholder="Ask about farming..."
                    className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    disabled={isLlmLoading}
                  />
                  <button
                    onClick={handleLlmQuery}
                    disabled={isLlmLoading || !llmQuery.trim()}
                    className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-semibold disabled:opacity-50"
                  >
                    {isLlmLoading ? 'Thinking...' : 'Ask'}
                  </button>
                </div>
              </div>
              
              {llmResponse && (
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="text-green-400 font-bold mb-2">Advisor Says:</h3>
                  <p className="text-white leading-relaxed">{llmResponse}</p>
                </div>
              )}
              
              {/* Quick questions */}
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-cyan-400 font-bold mb-3">Quick Questions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setLlmQuery('What should I plant this season?'); handleLlmQuery(); }}
                    className="text-left p-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-300"
                  >
                    What to plant?
                  </button>
                  <button
                    onClick={() => { setLlmQuery('How can I improve my yields?'); handleLlmQuery(); }}
                    className="text-left p-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-300"
                  >
                    Improve yields?
                  </button>
                  <button
                    onClick={() => { setLlmQuery('What are the best farming practices for this era?'); handleLlmQuery(); }}
                    className="text-left p-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-300"
                  >
                    Best practices?
                  </button>
                  <button
                    onClick={() => { setLlmQuery('How do I deal with pests?'); handleLlmQuery(); }}
                    className="text-left p-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-300"
                  >
                    Pest control?
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right panel - Events and status */}
        <div className="w-80 border-l border-slate-700 p-4 bg-slate-800/50">
          {/* Wallet */}
          <div className="bg-slate-900 rounded-lg p-4 mb-4">
            <h3 className="text-yellow-400 font-bold mb-2">Resources</h3>
            <p className="text-2xl font-bold text-white">{farmState?.currency || 0} 🪙</p>
          </div>
          
          {/* Current event */}
          {currentEvent && (
            <div className="bg-amber-900/30 border-2 border-amber-600 rounded-lg p-4 mb-4">
              <h3 className="text-amber-400 font-bold mb-2">{currentEvent.title}</h3>
              <p className="text-white text-sm mb-3">{currentEvent.description}</p>
              <div className="space-y-2">
                {currentEvent.options.map((option: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => {
                      setFarmState(prev => prev ? {
                        ...prev,
                        recentActions: [...prev.recentActions, `Event: ${option}`].slice(-5)
                      } : null);
                      setCurrentEvent(null);
                    }}
                    className="w-full text-left p-2 bg-slate-700 hover:bg-slate-600 rounded text-sm text-white"
                  >
                    {i + 1}. {option}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Season info */}
          <div className="bg-slate-900 rounded-lg p-4">
            <h3 className="text-cyan-400 font-bold mb-2">Season: {season}</h3>
            <p className="text-sm text-slate-300">
              {season === 'spring' && 'Time to plant most crops. Prepare fields and sow seeds.'}
              {season === 'summer' && 'Keep crops watered and watch for pests. Growth season.'}
              {season === 'fall' && 'Harvest time! Collect crops before winter arrives.'}
              {season === 'winter' && 'Rest season. Plan for next year and maintain equipment.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmPanelFullScreen;