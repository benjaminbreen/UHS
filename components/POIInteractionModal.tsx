/**
 * POIInteractionModal - Standardized template for all POI interactions
 * Includes placeholders for LLM-driven events
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TerrainStructure, Item, PlayerCharacter } from '../types';
import POISymbol from './POISymbol';

export interface POIInteractionConfig {
  type: 'mill' | 'mine' | 'forge' | 'market' | 'shrine' | 'tavern' | 'ruins' | 'holy_site';
  structure: TerrainStructure;
  playerInventory: Item[];
  playerCurrency: number;
  playerCharacter?: PlayerCharacter;
  activeQuest?: any; // Quest that targets this location
  onProcess?: (inputs: Item[], cost: number) => Promise<ProcessResult>;
  onExplore?: () => Promise<LLMEvent>; // For quest exploration
  onClose: () => void;
  customData?: any; // Type-specific data
}

export interface ProcessResult {
  success: boolean;
  outputs?: Item[];
  message: string;
  currencyChange?: number;
  reputationChange?: number;
  llmEvent?: LLMEvent;
}

export interface LLMEvent {
  title: string;
  description: string;
  choices?: EventChoice[];
  outcome?: string;
}

export interface EventChoice {
  id: string;
  text: string;
  requirements?: string[];
  consequences?: string[];
}

const POIInteractionModal: React.FC<POIInteractionConfig> = ({
  type,
  structure,
  playerInventory,
  playerCurrency,
  playerCharacter,
  activeQuest,
  onProcess,
  onExplore,
  onClose,
  customData
}) => {
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [processingCost, setProcessingCost] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [llmEvent, setLlmEvent] = useState<LLMEvent | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isExploring, setIsExploring] = useState(false);
  const [explorationInput, setExplorationInput] = useState('');

  // Calculate processing cost based on selected items
  useEffect(() => {
    if (type === 'mill' && customData?.millType) {
      const cost = selectedItems.reduce((sum, item) => 
        sum + (item.quantity || 1) * customData.millType.processingCost, 0
      );
      setProcessingCost(cost);
    } else if (type === 'mine' && customData?.miningCost) {
      setProcessingCost(customData.miningCost);
    }
  }, [selectedItems, type, customData]);

  const handleProcess = async () => {
    if (!onProcess) return;
    
    setIsProcessing(true);
    try {
      const result = await onProcess(selectedItems, processingCost);
      setProcessResult(result);
      
      // Handle LLM event if present
      if (result.llmEvent) {
        setLlmEvent(result.llmEvent);
      }
      
      // Clear selection after successful processing
      if (result.success) {
        setSelectedItems([]);
      }
    } catch (error) {
      setProcessResult({
        success: false,
        message: 'An error occurred during processing.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleItemSelection = (item: Item) => {
    const isSelected = selectedItems.some(i => i.baseId === item.baseId);
    if (isSelected) {
      setSelectedItems(selectedItems.filter(i => i.baseId !== item.baseId));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const canProcess = selectedItems.length > 0 && 
                     playerCurrency >= processingCost && 
                     !isProcessing;
  
  const canExplore = (type === 'ruins' || type === 'holy_site') && 
                     activeQuest && 
                     onExplore && 
                     !isExploring;
  
  const handleExplore = async () => {
    if (!onExplore) return;
    
    setIsExploring(true);
    try {
      const event = await onExplore();
      setLlmEvent(event);
    } catch (error) {
      console.error('Exploration failed:', error);
      setProcessResult({
        success: false,
        message: 'Failed to explore this location.'
      });
    } finally {
      setIsExploring(false);
    }
  };
  
  const handleExplorationChoice = async (choice: string) => {
    // This would trigger quest progression
    if (activeQuest && onProcess) {
      const result = await onProcess([], 0);
      setProcessResult(result);
      if (result.success && result.llmEvent) {
        setLlmEvent(result.llmEvent);
      }
    }
  };

  const getHeaderTitle = () => {
    switch (type) {
      case 'mill': return `${structure.name || 'Mill'} - Grain Processing`;
      case 'mine': return `${structure.name || 'Mine'} - Ore Extraction`;
      case 'forge': return `${structure.name || 'Forge'} - Metal Working`;
      case 'market': return `${structure.name || 'Market'} - Trading Post`;
      case 'shrine': return `${structure.name || 'Shrine'} - Sacred Offerings`;
      case 'tavern': return `${structure.name || 'Tavern'} - Rest & Rumors`;
      case 'ruins': return `${structure.name || 'Ancient Ruins'} - Mysterious Site`;
      case 'holy_site': return `${structure.name || 'Holy Site'} - Sacred Ground`;
      default: return structure.name || 'Location';
    }
  };

  const getProcessButtonText = () => {
    switch (type) {
      case 'mill': return 'Grind Selected Items';
      case 'mine': return 'Extract Ore';
      case 'forge': return 'Forge Items';
      case 'market': return 'Complete Trade';
      case 'shrine': return 'Make Offering';
      case 'tavern': return 'Purchase Services';
      default: return 'Process';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-slate-900/95 backdrop-blur-md rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-700"
      >
        {/* Header */}
        <div className="bg-slate-800/80 p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16">
                <POISymbol structure={structure} size={64} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{getHeaderTitle()}</h2>
                <p className="text-sm text-gray-400">
                  {structure.description || `A ${type} facility`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* LLM Event Section - Priority display */}
          {llmEvent && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-amber-900/20 border border-amber-600/50 rounded-lg"
            >
              <h3 className="text-lg font-bold text-amber-400 mb-2">
                ⚡ {llmEvent.title}
              </h3>
              <p className="text-sm text-gray-300 mb-3">
                {llmEvent.description}
              </p>
              {llmEvent.choices && llmEvent.choices.length > 0 && (
                <div className="space-y-2">
                  {llmEvent.choices.map(choice => (
                    <button
                      key={choice.id}
                      onClick={() => setSelectedChoice(choice.id)}
                      className={`w-full text-left p-3 rounded transition-colors ${
                        selectedChoice === choice.id
                          ? 'bg-amber-600/30 border border-amber-500'
                          : 'bg-slate-800/50 border border-slate-600 hover:bg-slate-700/50'
                      }`}
                    >
                      <p className="text-sm text-white">{choice.text}</p>
                      {choice.requirements && (
                        <p className="text-xs text-gray-400 mt-1">
                          Requires: {choice.requirements.join(', ')}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {llmEvent.outcome && (
                <p className="text-sm text-green-400 mt-3 italic">
                  {llmEvent.outcome}
                </p>
              )}
            </motion.div>
          )}

          {/* Process Result Message */}
          {processResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mb-4 p-3 rounded-lg ${
                processResult.success 
                  ? 'bg-green-900/30 border border-green-600/50 text-green-300'
                  : 'bg-red-900/30 border border-red-600/50 text-red-300'
              }`}
            >
              <p className="text-sm">{processResult.message}</p>
              {processResult.outputs && processResult.outputs.length > 0 && (
                <div className="mt-2 text-xs">
                  <p className="font-semibold">Received:</p>
                  {processResult.outputs.map((item, i) => (
                    <span key={i}>
                      {item.quantity || 1}x {item.name}
                      {i < processResult.outputs!.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Quest-related exploration content */}
          {activeQuest && (type === 'ruins' || type === 'holy_site') && (
            <div className="mb-4 p-4 bg-amber-900/20 border border-amber-600/30 rounded-lg">
              <h3 className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
                <span>⚠️</span> Active Quest
              </h3>
              <p className="text-sm text-amber-200">{activeQuest.title}</p>
              <p className="text-xs text-gray-400 mt-1">{activeQuest.description}</p>
              {llmEvent && llmEvent.choices && (
                <div className="mt-4">
                  <p className="text-sm text-gray-300 mb-2">What do you do?</p>
                  <textarea
                    value={explorationInput}
                    onChange={(e) => setExplorationInput(e.target.value)}
                    placeholder="Describe your action..."
                    className="w-full p-2 bg-slate-800/50 border border-slate-600 rounded text-sm text-white placeholder-gray-500 resize-none"
                    rows={3}
                  />
                  <button
                    onClick={() => handleExplorationChoice(explorationInput)}
                    disabled={!explorationInput.trim() || isProcessing}
                    className="mt-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-gray-500 text-white rounded text-sm font-medium transition-colors"
                  >
                    Submit Action
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Type-specific content */}
          {type === 'mill' && customData?.millType && (
            <div className="space-y-4">
              {/* Mill Information */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">Mill Capabilities</h3>
                <p className="text-sm text-gray-400 mb-3">
                  {customData.millType.description}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Processing Cost:</span>
                    <span className="text-yellow-400 ml-2">
                      {customData.millType.processingCost} coins/item
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Capacity:</span>
                    <span className="text-blue-400 ml-2">
                      {customData.millType.capacity} items
                    </span>
                  </div>
                </div>
              </div>

              {/* Processing Options */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Processing Options</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {Object.entries(customData.millType.outputs).map(([input, output]) => (
                    <div key={input} className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">{input}</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-green-400">
                        {output.itemId} ({Math.round(output.ratio * 100)}% yield)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Item Selection */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Select Items to Process</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {playerInventory
                    .filter(item => customData.millType.inputs.includes(item.baseId))
                    .map(item => (
                      <button
                        key={item.baseId}
                        onClick={() => toggleItemSelection(item)}
                        className={`p-2 rounded text-sm transition-colors ${
                          selectedItems.some(i => i.baseId === item.baseId)
                            ? 'bg-blue-600/30 border border-blue-500'
                            : 'bg-slate-700/50 border border-slate-600 hover:bg-slate-600/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white">{item.name}</span>
                          <span className="text-gray-400">x{item.quantity || 1}</span>
                        </div>
                      </button>
                    ))}
                </div>
                {playerInventory.filter(item => customData.millType.inputs.includes(item.baseId)).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    You don't have any items this mill can process.
                  </p>
                )}
              </div>
            </div>
          )}

          {type === 'mine' && customData && (
            <div className="space-y-4">
              {/* Mine Information */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">Mine Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Ore Type</p>
                    <p className="text-lg font-bold text-cyan-400">
                      {customData.oreType || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Remaining Quantity</p>
                    <p className="text-lg font-bold text-green-400">
                      {customData.quantity || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Extraction Cost</p>
                    <p className="text-lg font-bold text-yellow-400">
                      {customData.miningCost || 0} coins
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Tool Required</p>
                    <p className="text-lg font-bold text-orange-400">
                      {customData.requiredTool || 'Pickaxe'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mining Options */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Extraction Options</h3>
                <div className="space-y-3">
                  <button className="w-full p-3 bg-slate-700/50 rounded hover:bg-slate-600/50 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="text-white">Standard Mining</span>
                      <span className="text-sm text-gray-400">3-5 ore</span>
                    </div>
                  </button>
                  <button className="w-full p-3 bg-slate-700/50 rounded hover:bg-slate-600/50 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="text-white">Careful Extraction</span>
                      <span className="text-sm text-gray-400">2-3 ore (higher quality)</span>
                    </div>
                  </button>
                  <button className="w-full p-3 bg-slate-700/50 rounded hover:bg-slate-600/50 transition-colors opacity-50" disabled>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Blast Mining</span>
                      <span className="text-sm text-gray-600">Requires explosives</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* LLM Event Placeholder */}
          {!llmEvent && (
            <div className="mt-4 p-3 bg-slate-800/30 border border-slate-700/50 rounded-lg">
              <p className="text-xs text-gray-500 text-center">
                🎲 Dynamic events may occur based on your actions and the world state
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-800/80 p-4 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-400">Your Coins:</span>
                <span className={`ml-2 font-bold ${playerCurrency >= processingCost ? 'text-yellow-400' : 'text-red-400'}`}>
                  {playerCurrency}
                </span>
              </div>
              {processingCost > 0 && (
                <div className="text-sm">
                  <span className="text-gray-400">Cost:</span>
                  <span className="ml-2 font-bold text-orange-400">
                    {processingCost}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
              >
                Cancel
              </button>
              {canExplore && (
                <button
                  onClick={handleExplore}
                  disabled={isExploring}
                  className={`px-6 py-2 rounded font-semibold transition-colors ${
                    !isExploring
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-slate-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isExploring ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Exploring...
                    </span>
                  ) : (
                    '🔍 Explore (Quest)'
                  )}
                </button>
              )}
              {onProcess && (
                <button
                  onClick={handleProcess}
                  disabled={!canProcess}
                  className={`px-6 py-2 rounded font-semibold transition-colors ${
                    canProcess
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-slate-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    getProcessButtonText()
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default POIInteractionModal;