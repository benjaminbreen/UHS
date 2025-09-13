/**
 * components/POIToastModal.tsx - Toast-style modal for POI interactions
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TerrainStructure } from '../types';
import { WorkerDialogue, ServiceOption } from '../services/poiDialogueService';
import { useUI } from '../contexts/UIContext';
import { usePlayer } from '../contexts/PlayerContext';
import QuarryBanner from './QuarryBanner';
import MineColonyBanner from './MineColonyBanner';
import FortressBanner from './FortressBanner';
import MillBanner from './MillBanner';
import FactoryBanner from './FactoryBanner';
import LumberCampBanner from './LumberCampBanner';

const POITypeIcon: React.FC<{ type: string }> = ({ type }) => {
  const iconMap: Record<string, string> = {
    quarry: '⛏️',
    mine: '⛏️',
    mill: '🌾',
    factory: '⚙️',
    fortress: '🛡️',
    woodcutter: '🪓'
  };
  
  return (
    <div className="w-8 h-8 text-2xl flex items-center justify-center">
      {iconMap[type] || '🏗️'}
    </div>
  );
};

export function POIToastModal() {
  const { poiToastData, setPoiToastData } = useUI();
  const { playerCharacter } = usePlayer();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-close on ESC key - MUST be before any conditional returns
  useEffect(() => {
    if (!poiToastData) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [poiToastData]);

  // Trigger entrance animation
  useEffect(() => {
    if (poiToastData) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 100);
      return () => clearTimeout(timer);
    }
  }, [poiToastData]);

  const handleClose = () => {
    console.log('POIToastModal: Closing modal');
    setIsAnimating(true);
    setTimeout(() => {
      setPoiToastData(null);
    }, 300);
  };

  const handleServiceClick = (service: ServiceOption) => {
    console.log('POIToastModal: Service clicked:', service.id);
    setSelectedService(service.id);
    // Service handling should be done in ModalHub or MapViewport
  };

  const getDefaultPOIName = (type: string): string => {
    const names: Record<string, string> = {
      quarry: 'Stone Quarry',
      mine: 'Mining Site', 
      mill: 'Processing Mill',
      factory: 'Workshop',
      fortress: 'Fortification',
      woodcutter: 'Woodcutter\'s Hut'
    };
    return names[type] || 'Work Site';
  };

  const getStructureDetail = (structure: TerrainStructure, detail: string): string => {
    switch (detail) {
      case 'workers':
        // Use actual structure data or derive from structure ID for consistency
        const workerCount = structure.workers || 
          (structure.id ? (structure.id.charCodeAt(0) % 5) + 2 : 4);
        return `${workerCount} workers`;
      case 'material':
        // Extract material from structure name or use structure-specific logic
        if (structure.name) {
          const nameWords = structure.name.toLowerCase().split(' ');
          const knownMaterials = ['sandstone', 'limestone', 'granite', 'marble', 'iron', 'copper', 'gold', 'silver', 'coal'];
          const foundMaterial = knownMaterials.find(material => 
            nameWords.some(word => word.includes(material))
          );
          if (foundMaterial) {
            return foundMaterial.charAt(0).toUpperCase() + foundMaterial.slice(1);
          }
        }
        
        // Fallback to structure type defaults (using consistent seed)
        const materials: Record<string, string[]> = {
          quarry: ['Sandstone', 'Limestone', 'Granite', 'Marble'],
          mine: ['Iron Ore', 'Copper', 'Gold', 'Silver'],
          mill: ['Wheat', 'Barley', 'Oats', 'Rice'],
          factory: ['Textiles', 'Tools', 'Pottery', 'Goods'],
          woodcutter: ['Oak', 'Pine', 'Cedar', 'Birch']
        };
        const typeMatls = materials[structure.type || 'quarry'] || ['Stone'];
        // Use structure ID for consistent material selection
        const materialIndex = structure.id ? (structure.id.charCodeAt(0) % typeMatls.length) : 0;
        return typeMatls[materialIndex];
      case 'status':
        return structure.state === 'active' ? 'Active' : 'Operating';
      default:
        return 'Unknown';
    }
  };

  // Check if player has required items in inventory
  const hasInventoryItem = (itemType: string): boolean => {
    if (!playerCharacter?.inventory) return false;
    
    const itemChecks: Record<string, (itemName: string) => boolean> = {
      stone: (name: string) => name.toLowerCase().includes('stone') && !name.toLowerCase().includes('cut'),
      wood: (name: string) => name.toLowerCase().includes('wood') || name.toLowerCase().includes('log') || name.toLowerCase().includes('timber'),
      grain: (name: string) => name.toLowerCase().includes('grain') || name.toLowerCase().includes('wheat') || name.toLowerCase().includes('barley'),
      ore: (name: string) => name.toLowerCase().includes('ore') || name.toLowerCase().includes('iron') || name.toLowerCase().includes('copper'),
      raw_materials: (name: string) => name.toLowerCase().includes('raw') || name.toLowerCase().includes('uncut') || name.toLowerCase().includes('rough')
    };
    
    const checkFn = itemChecks[itemType];
    if (!checkFn) return false;
    
    return playerCharacter.inventory.some(item => checkFn(item.name));
  };

  // Render the appropriate banner component based on POI type
  const renderBanner = (structure: TerrainStructure) => {
    const structureType = structure.structureType || structure.type || 'quarry';
    const bannerProps = {
      structure,
      era: 'medieval', // Default era
      culturalZone: 'europe', // Default zone
      climate: 'temperate' as const,
      season: 'spring' as const,
      timeOfDay: 'day' as const,
      width: 1000,
      height: 130,
      seed: 12345,
      adjacentBiomes: ['grassland' as const],
      isRuined: false
    };

    switch (structureType) {
      case 'quarry':
        return <QuarryBanner {...bannerProps} />;
      case 'mine':
      case 'mining_colony':
        return <MineColonyBanner {...bannerProps} />;
      case 'fortress':
        return <FortressBanner {...bannerProps} />;
      case 'mill':
        return <MillBanner {...bannerProps} />;
      case 'factory':
        return <FactoryBanner {...bannerProps} />;
      case 'woodcutter':
      case 'lumber_camp':
        return <LumberCampBanner {...bannerProps} />;
      default:
        // Fallback to MillBanner for unknown types
        return <MillBanner {...bannerProps} />;
    }
  };

  // Position styles for bottom-center toast with slide-up animation
  const getPositionStyles = () => {
    const baseTransform = isAnimating ? 'translate-y-full' : 'translate-y-0';
    return `bottom-6 left-1/2 -translate-x-1/2 ${baseTransform}`;
  };

  console.log('POIToastModal render - poiToastData:', poiToastData);
  
  if (!poiToastData) {
    console.log('POIToastModal: No poiToastData, returning null');
    return null;
  }
  
  console.log('POIToastModal: Rendering modal with data:', {
    type: poiToastData.structure?.type,
    name: poiToastData.structure?.name,
    hasDescription: !!poiToastData.description,
    hasDialogue: !!poiToastData.dialogue,
    isMobile
  });

  const { structure, description, dialogue } = poiToastData;

  return (
    <AnimatePresence>
      {/* Toast positioned at bottom-center, slides up from bottom */}
      <div className={`fixed z-50 ${getPositionStyles()} transition-transform duration-300 ease-out`}>
        <div className={`
          ${isMobile 
            ? 'w-[95vw] max-h-[70vh]' 
            : 'w-[1000px] max-w-[95vw] max-h-[60vh]'
          } 
          bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-600/50 overflow-hidden
        `}>
          
          {/* POI Banner - Only on desktop */}
          {!isMobile && (
            <div className="relative h-[200px] overflow-hidden rounded-t-2xl">
              {/* SVG Banner Component - Offset to show quarry structure, not sky */}
              <div className="absolute inset-0">
                <div className="w-full h-full relative" style={{ top: '-60px' }}>
                  {renderBanner(structure)}
                </div>
              </div>
              
              {/* Text overlay with gradient background for readability */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 via-black/40 to-transparent" />
              
              {/* Header content overlaid on banner */}
              <div className="absolute bottom-3 left-6 right-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <POITypeIcon type={structure.type || 'quarry'} />
                    <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                      {structure.name || getDefaultPOIName(structure.type || 'quarry')}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg text-xs backdrop-blur-sm">
                      <span className="text-amber-400">👥</span>
                      <span className="text-white">{getStructureDetail(structure, 'workers')}</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg text-xs backdrop-blur-sm">
                      <span className="text-blue-400">⛏️</span>
                      <span className="text-white">{getStructureDetail(structure, 'material')}</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg text-xs backdrop-blur-sm">
                      <span className="text-green-400">●</span>
                      <span className="text-white">{getStructureDetail(structure, 'status')}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              {/* ESC hint overlaid on banner */}
              <div className="absolute top-3 left-6">
                <span className="text-white/70 text-xs bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
                  Press ESC to leave
                </span>
              </div>
              
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors p-1.5 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Content - 2 column layout on desktop, single column on mobile */}
          <div className={`${isMobile ? 'p-4' : 'p-6'} ${isMobile ? 'max-h-[70vh] overflow-y-auto' : ''}`}>
            
            {/* Mobile header (when no banner) */}
            {isMobile && (
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <POITypeIcon type={structure.type || 'quarry'} />
                  <h2 className="text-xl font-bold text-white">
                    {structure.name || getDefaultPOIName(structure.type || 'quarry')}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="text-white/70 hover:text-white transition-colors p-1.5 rounded-full bg-slate-800/50 hover:bg-slate-700/50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-6'}`}>
              {/* Left Column - Details and Description */}
              <div className="space-y-4">
                
                {/* Description */}
                <div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {description}
                  </p>
                </div>

                {/* Worker Dialogue */}
                {dialogue && (
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-700/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-400 text-lg">👤</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-amber-300 font-medium text-sm mb-1">
                          {dialogue.speaker}
                        </p>
                        <p className="text-gray-300 text-xs italic leading-relaxed">
                          "{dialogue.greeting}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Services */}
              <div className="space-y-4">
                {/* Service Options */}
                {dialogue?.services && (
                  <div>
                    <div className="space-y-2">
                      {dialogue.services.slice(0, 4).map((service) => (
                        <button
                          key={service.id}
                          onClick={() => handleServiceClick(service)}
                          disabled={!service.available}
                          className={`w-full p-3 rounded-lg transition-all text-left ${
                            selectedService === service.id
                              ? 'bg-amber-600/30 border border-amber-500 ring-1 ring-amber-500/20'
                              : service.available
                              ? 'bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600'
                              : 'bg-slate-800/50 border border-slate-700 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="text-white font-medium text-sm">
                              {service.name}
                            </div>
                            <div className="text-amber-400 text-xs font-bold">
                              {service.cost}
                            </div>
                          </div>
                          <div className="text-gray-400 text-xs leading-tight">
                            {service.description}
                          </div>
                          {service.requirements && service.requirements.length > 0 && (
                            <div className="text-red-400 text-xs mt-1">
                              Req: {service.requirements[0]}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fortress-specific Actions */}
                {(structure.type === 'fortress' || structure.structureType === 'fortress') && (
                  <div>
                    <h3 className="text-white font-medium text-sm mb-3">Fortress Actions</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          console.log('POIToastModal: Ask to see commander clicked');
                          // TODO: Trigger fortress interior map with military commander
                        }}
                        className="w-full p-3 rounded-lg transition-all text-left bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          🏛️ Ask to see the Commander
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Request an audience with the fortress commander
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log('POIToastModal: Inquire about enlistment clicked');
                          // TODO: Trigger enlistment dialogue
                        }}
                        className="w-full p-3 rounded-lg transition-all text-left bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          ⚔️ Inquire about Enlistment
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Ask about joining the military forces
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log('POIToastModal: Request supplies clicked');
                          // TODO: Trigger supply trade dialogue
                        }}
                        className="w-full p-3 rounded-lg transition-all text-left bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          📦 Request Supplies
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Ask for military supplies or provisions
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Mill-specific Actions */}
                {(structure.type === 'mill' || structure.structureType === 'mill') && (
                  <div>
                    <h3 className="text-white font-medium text-sm mb-3">Mill Services</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          console.log('POIToastModal: Mill grain clicked');
                          // TODO: Trigger grain milling interface
                        }}
                        className="w-full p-3 rounded-lg transition-all text-left bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          🌾 Mill Your Grain
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Process raw grain into flour for a fee
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log('POIToastModal: Buy grain clicked');
                          // TODO: Trigger grain purchase interface
                        }}
                        className="w-full p-3 rounded-lg transition-all text-left bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          🛒 Buy Grain & Flour
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Purchase processed grain products
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log('POIToastModal: Sell grain clicked');
                          // TODO: Trigger grain selling interface
                        }}
                        className="w-full p-3 rounded-lg transition-all text-left bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          💰 Sell Raw Grain
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Trade your grain harvest for coin
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Woodcutter-specific Actions */}
                {(structure.type === 'woodcutter' || structure.structureType === 'woodcutter' || structure.type === 'lumber_camp' || structure.structureType === 'lumber_camp') && (
                  <div>
                    <h3 className="text-white font-medium text-sm mb-3">Woodcutter Services</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          console.log('POIToastModal: Saw logs clicked');
                          // TODO: Trigger log sawing interface
                        }}
                        className="w-full p-3 rounded-lg transition-all text-left bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          🪚 Saw Your Logs
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Have your timber cut into planks and boards
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log('POIToastModal: Buy lumber clicked');
                          // TODO: Trigger lumber purchase interface
                        }}
                        className="w-full p-3 rounded-lg transition-all text-left bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          🛒 Buy Lumber & Planks
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Purchase finished wood products
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log('POIToastModal: Sell logs clicked');
                          // TODO: Trigger log selling interface
                        }}
                        className="w-full p-3 rounded-lg transition-all text-left bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          💰 Sell Raw Logs
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Trade your timber for coin
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Quarry-specific Actions */}
                {(structure.type === 'quarry' || structure.structureType === 'quarry') && (
                  <div>
                    <h3 className="text-white font-medium text-sm mb-3">Quarry Services</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          console.log('POIToastModal: Polish stones clicked');
                          // TODO: Trigger stone polishing interface
                        }}
                        disabled={!hasInventoryItem('stone')}
                        className={`w-full p-3 rounded-lg transition-all text-left border ${
                          hasInventoryItem('stone')
                            ? 'bg-slate-700/50 hover:bg-slate-600/60 border-slate-600 cursor-pointer'
                            : 'bg-slate-800/30 border-slate-700/50 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <div className={`font-medium text-sm mb-1 ${
                          hasInventoryItem('stone') ? 'text-white' : 'text-gray-500'
                        }`}>
                          ✨ Polish Your Stones
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Have raw stone cut and polished {!hasInventoryItem('stone') && '(Need raw stone)'}
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log('POIToastModal: Buy stone clicked');
                          // TODO: Trigger stone purchase interface
                        }}
                        className="w-full p-3 rounded-lg transition-all text-left bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          🛒 Buy Cut Stone
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Purchase finished stone blocks
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log('POIToastModal: Sell raw stone clicked');
                          // TODO: Trigger raw stone selling interface
                        }}
                        className="w-full p-3 rounded-lg transition-all text-left bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          💰 Sell Raw Stone
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Trade uncut stone for coin
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Mine-specific Actions */}
                {(structure.type === 'mine' || structure.structureType === 'mine' || structure.type === 'mining_colony' || structure.structureType === 'mining_colony') && (
                  <div>
                    <h3 className="text-white font-medium text-sm mb-3">Mining Services</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          console.log('POIToastModal: Refine ore clicked');
                          // TODO: Trigger ore refining interface
                        }}
                        className="w-full p-3 rounded-lg transition-all text-left bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          🔥 Refine Your Ore
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Smelt raw ore into metal ingots
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log('POIToastModal: Buy metals clicked');
                          // TODO: Trigger metal purchase interface
                        }}
                        className="w-full p-3 rounded-lg transition-all text-left bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          🛒 Buy Refined Metals
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Purchase smelted iron, copper, and precious metals
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log('POIToastModal: Sell ore clicked');
                          // TODO: Trigger ore selling interface
                        }}
                        className="w-full p-3 rounded-lg transition-all text-left bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          💰 Sell Raw Ore
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Trade unrefined ore for coin
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Factory-specific Actions */}
                {(structure.type === 'factory' || structure.structureType === 'factory') && (
                  <div>
                    <h3 className="text-white font-medium text-sm mb-3">Workshop Services</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          console.log('POIToastModal: Craft items clicked');
                          // TODO: Trigger item crafting interface
                        }}
                        className="w-full p-3 rounded-lg transition-all text-left bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          🔨 Commission Crafting
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Have tools and goods crafted from materials
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log('POIToastModal: Buy manufactured goods clicked');
                          // TODO: Trigger goods purchase interface
                        }}
                        className="w-full p-3 rounded-lg transition-all text-left bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          🛒 Buy Manufactured Goods
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Purchase finished tools, textiles, and goods
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log('POIToastModal: Repair items clicked');
                          // TODO: Trigger item repair interface
                        }}
                        className="w-full p-3 rounded-lg transition-all text-left bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          🔧 Repair Items
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Fix damaged tools and equipment
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-end items-center pt-3 border-t border-slate-700/50">
                  <button
                    onClick={handleClose}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Leave
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}

export default POIToastModal;