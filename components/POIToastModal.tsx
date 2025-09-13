/**
 * components/POIToastModal.tsx - Toast-style modal for POI interactions
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TerrainStructure } from '../types';
import { WorkerDialogue, ServiceOption } from '../services/poiDialogueService';
import { useUIState } from '../hooks/useUIState';

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
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="w-7 h-7 text-xl flex items-center justify-center"
    >
      {iconMap[type] || '🏗️'}
    </motion.div>
  );
};

const POIBanner: React.FC<{ type: string }> = ({ type }) => {
  const getBannerStyle = () => {
    switch(type) {
      case 'quarry':
        // Stone quarry - gray rocky texture
        return {
          background: 'linear-gradient(180deg, #78716c 0%, #57534e 40%, #292524 80%, #0f172a 100%)',
          pattern: (
            <div className="absolute inset-0 opacity-30">
              <div style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px),
                                 repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)`
              }} className="w-full h-full" />
            </div>
          )
        };
      case 'mine':
        // Mine - dark with metallic hints
        return {
          background: 'linear-gradient(180deg, #52525b 0%, #3f3f46 40%, #18181b 80%, #0f172a 100%)',
          pattern: (
            <div className="absolute inset-0 opacity-20">
              <div style={{
                backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 15px, rgba(255,255,255,0.02) 15px, rgba(255,255,255,0.02) 30px)`
              }} className="w-full h-full" />
            </div>
          )
        };
      case 'mill':
        // Mill - warm wheat/grain colors
        return {
          background: 'linear-gradient(180deg, #d97706 0%, #b45309 40%, #7c2d12 80%, #0f172a 100%)',
          pattern: (
            <div className="absolute inset-0 opacity-25">
              <div style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                                 radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)`
              }} className="w-full h-full" />
            </div>
          )
        };
      case 'factory':
        // Factory - industrial gray
        return {
          background: 'linear-gradient(180deg, #6b7280 0%, #4b5563 40%, #1f2937 80%, #0f172a 100%)',
          pattern: (
            <div className="absolute inset-0 opacity-15">
              <div style={{
                backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 40px)`
              }} className="w-full h-full" />
            </div>
          )
        };
      case 'fortress':
        // Fortress - strong red/burgundy
        return {
          background: 'linear-gradient(180deg, #991b1b 0%, #7f1d1d 40%, #450a0a 80%, #0f172a 100%)',
          pattern: (
            <div className="absolute inset-0 opacity-20">
              <div style={{
                backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(0,0,0,0.2) 30px, rgba(0,0,0,0.2) 60px)`
              }} className="w-full h-full" />
            </div>
          )
        };
      case 'woodcutter':
        // Woodcutter - forest green with wood grain
        return {
          background: 'linear-gradient(180deg, #166534 0%, #15803d 40%, #166534 80%, #0f172a 100%)',
          pattern: (
            <div className="absolute inset-0 opacity-25">
              <div style={{
                backgroundImage: `repeating-linear-gradient(25deg, rgba(120,113,108,0.1) 0px, rgba(120,113,108,0.1) 2px, transparent 2px, transparent 15px),
                                 repeating-linear-gradient(-25deg, rgba(87,83,78,0.05) 0px, rgba(87,83,78,0.05) 1px, transparent 1px, transparent 8px)`
              }} className="w-full h-full" />
            </div>
          )
        };
      default:
        return {
          background: 'linear-gradient(180deg, #a16207 0%, #92400e 40%, #451a03 80%, #0f172a 100%)',
          pattern: null
        };
    }
  };

  const style = getBannerStyle();

  return (
    <div className="absolute inset-0" style={{ background: style.background }}>
      {style.pattern}
      {/* Noise texture overlay for realism */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }} />
    </div>
  );
};

export function POIToastModal() {
  const { poiToastData, hidePoiToast } = useUIState();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  
  console.log('POIToastModal render - poiToastData:', poiToastData);
  
  if (!poiToastData) {
    console.log('POIToastModal: No poiToastData, returning null');
    return null;
  }
  
  console.log('POIToastModal: Rendering modal with data:', {
    type: poiToastData.structure?.type,
    name: poiToastData.structure?.name,
    hasDescription: !!poiToastData.description,
    hasDialogue: !!poiToastData.dialogue
  });

  const { structure, description, dialogue } = poiToastData;

  // Auto-close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleClose = () => {
    console.log('POIToastModal: Closing modal');
    setIsClosing(true);
    setTimeout(() => {
      hidePoiToast();
      setIsClosing(false);
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
        const workerCount = structure.workers || Math.floor(Math.random() * 5) + 2;
        return `${workerCount} workers`;
      case 'material':
        const materials: Record<string, string[]> = {
          quarry: ['Limestone', 'Granite', 'Marble', 'Sandstone'],
          mine: ['Iron Ore', 'Copper', 'Gold', 'Silver'],
          mill: ['Wheat', 'Barley', 'Oats', 'Rice'],
          factory: ['Textiles', 'Tools', 'Pottery', 'Goods'],
          woodcutter: ['Oak', 'Pine', 'Cedar', 'Birch']
        };
        const typeMatls = materials[structure.type || 'quarry'] || ['Stone'];
        return typeMatls[Math.floor(Math.random() * typeMatls.length)];
      case 'status':
        return structure.state === 'active' ? 'Active' : 'Operating';
      default:
        return 'Unknown';
    }
  };

  console.log('POIToastModal: About to render with classes: "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px]"');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ 
          opacity: isClosing ? 0 : 1,
          scale: isClosing ? 0.9 : 1,
          y: isClosing ? 20 : 0
        }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ 
          type: "spring", 
          damping: 20, 
          stiffness: 250,
          duration: 0.3
        }}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] max-w-[95vw] z-[60] bg-red-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TESTING - Red background to make it obvious */}
        <div className="bg-slate-900/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-600/50 overflow-hidden min-h-[400px]">
          <div className="text-white p-4">
            <h2>DEBUG: POI Modal is rendering!</h2>
            <p>Type: {structure?.type}</p>
            <p>Name: {structure?.name || 'No name'}</p>
            <button onClick={handleClose} className="bg-red-600 text-white px-4 py-2 rounded">
              Close Debug Modal
            </button>
          </div>
          
          {/* Banner Section */}
          <div className="relative h-[200px] overflow-hidden rounded-t-2xl">
            {/* Banner Background with POI-specific styling */}
            <POIBanner type={structure.type || 'quarry'} />
            
            {/* Strong fade overlay at bottom for text readability */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent" />
            
            {/* Header content overlaid on banner */}
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-3">
              <div className="flex items-center gap-2">
                <POITypeIcon type={structure.type || 'quarry'} />
                <h3 className="text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {structure.name || getDefaultPOIName(structure.type || 'quarry')}
                </h3>
              </div>
            </div>
            
            {/* Close button in top right */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 text-gray-300 hover:text-white transition-colors p-1.5 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-5 pt-4">
            {/* POI Details Strip */}
            <motion.div 
              className="flex items-center justify-between text-xs text-gray-400 mb-4 pb-3 border-b border-slate-700/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex gap-2 flex-wrap">
                <span className="flex items-center gap-1 bg-slate-800/40 px-2.5 py-1 rounded-md border border-slate-700/50">
                  <span className="text-amber-400 text-sm">👥</span> 
                  <span className="text-slate-300">{getStructureDetail(structure, 'workers')}</span>
                </span>
                <span className="flex items-center gap-1 bg-slate-800/40 px-2.5 py-1 rounded-md border border-slate-700/50">
                  <span className="text-blue-400 text-sm">⛏️</span>
                  <span className="text-slate-300">{getStructureDetail(structure, 'material')}</span>
                </span>
                <span className="flex items-center gap-1 bg-slate-800/40 px-2.5 py-1 rounded-md border border-slate-700/50">
                  <span className="text-green-400 text-sm">●</span>
                  <span className="text-slate-300">{getStructureDetail(structure, 'status')}</span>
                </span>
                {structure.owner && (
                  <span className="flex items-center gap-1 bg-slate-800/40 px-2.5 py-1 rounded-md border border-slate-700/50">
                    <span className="text-purple-400 text-sm">👑</span>
                    <span className="text-slate-300">{structure.owner}</span>
                  </span>
                )}
              </div>
            </motion.div>
            
            {/* Description */}
            <motion.p 
              className="text-gray-300 text-sm leading-relaxed mb-4 poi-description-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {description}
            </motion.p>

            {/* Worker Dialogue */}
            {dialogue && (
              <motion.div 
                className="bg-slate-800/60 rounded-lg p-4 mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-700/30 flex items-center justify-center flex-shrink-0 poi-worker-avatar">
                    <span className="text-amber-400 text-lg">👤</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-amber-300 font-medium text-sm mb-1">
                      {dialogue.speaker}
                    </p>
                    <p className="text-gray-300 text-sm italic">
                      "{dialogue.greeting}"
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Service Options */}
            {dialogue?.services && (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {dialogue.services.slice(0, 4).map((service, index) => (
                  <motion.button
                    key={service.id}
                    onClick={() => handleServiceClick(service)}
                    disabled={!service.available}
                    className={`p-3 rounded-lg transition-all duration-200 text-left poi-service-button ${
                      selectedService === service.id
                        ? 'bg-amber-600/30 border border-amber-500 ring-2 ring-amber-500/20'
                        : service.available
                        ? 'bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600 hover:border-slate-500'
                        : 'bg-slate-800/50 border border-slate-700 opacity-50 cursor-not-allowed'
                    }`}
                    whileHover={service.available ? { scale: 1.02 } : {}}
                    whileTap={service.available ? { scale: 0.98 } : {}}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <div className="text-white font-medium text-sm mb-1">
                      {service.name}
                    </div>
                    <div className="text-gray-400 text-xs mb-2 leading-tight">
                      {service.description}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-amber-400 text-xs font-bold poi-service-cost">
                        {service.cost}
                      </div>
                      {service.requirements && service.requirements.length > 0 && (
                        <div className="text-red-400 text-xs">
                          Requires: {service.requirements[0]}
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* Footer */}
            <motion.div 
              className="flex justify-between items-center pt-2 border-t border-slate-700/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span>⌨️</span>
                <span>Press ESC or click away to leave</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Leave
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default POIToastModal;