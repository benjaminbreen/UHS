/**
 * Quest Chain Debug Panel
 * Development tool for monitoring and debugging quest chains
 */

import React, { useState, useEffect } from 'react';
import { worldWeaverQuestChain } from '../services/worldWeaverQuestChain';
import { questStorageCleanupService } from '../services/questStorageCleanupService';

interface QuestChainEntry {
  chainId: string;
  questIds: string[];
  currentQuestIndex: number;
  originalPrompt: string;
  completedQuests: any[];
  status: 'active' | 'completed' | 'failed';
}

export const QuestChainDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChains, setActiveChains] = useState<QuestChainEntry[]>([]);
  const [storageReport, setStorageReport] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Only show in development
  const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  useEffect(() => {
    if (!isDevelopment || !isOpen) return;

    const refreshData = () => {
      try {
        const chains = worldWeaverQuestChain.getAllActiveChains();
        setActiveChains(chains);
        setStorageReport(questStorageCleanupService.getStorageReport());
      } catch (error) {
        console.error('[QuestChainDebug] Error refreshing data:', error);
      }
    };

    refreshData();
    const interval = setInterval(refreshData, 2000); // Refresh every 2 seconds

    return () => clearInterval(interval);
  }, [isDevelopment, isOpen, refreshKey]);

  if (!isDevelopment) return null;

  const handleForceCleanup = async () => {
    try {
      await questStorageCleanupService.performMaintenanceCleanup();
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('[QuestChainDebug] Cleanup failed:', error);
    }
  };

  const handleInitializeChain = () => {
    // For testing purposes - create a sample chain
    const testContext = {
      mapData: {} as any,
      playerLocation: { x: 50, y: 50 },
      culturalZone: 'EUROPEAN',
      era: 'MEDIEVAL',
      year: 1473,
      location: 'Medieval Village'
    };

    worldWeaverQuestChain.createQuestChain(
      'Help a local merchant with a delivery problem',
      testContext
    ).then(chainId => {
      console.log('[QuestChainDebug] Created test chain:', chainId);
      setRefreshKey(prev => prev + 1);
    }).catch(error => {
      console.error('[QuestChainDebug] Failed to create test chain:', error);
    });
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-40 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors text-sm font-mono"
        title="Quest Chain Debug Panel"
      >
        🔗 Debug
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 w-96 max-h-96 bg-gray-900 text-white rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-purple-800 p-3 flex justify-between items-center">
            <h3 className="font-bold text-sm">Quest Chain Debug</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-purple-200 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1">
            {/* Storage Stats */}
            <div className="mb-4">
              <h4 className="font-semibold text-yellow-400 mb-2">Storage Stats</h4>
              <pre className="text-xs text-green-300 whitespace-pre-wrap bg-gray-800 p-2 rounded">
                {storageReport}
              </pre>
            </div>

            {/* Active Chains */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-blue-400">
                  Active Chains ({activeChains.length})
                </h4>
                <button
                  onClick={() => setRefreshKey(prev => prev + 1)}
                  className="text-xs bg-blue-600 px-2 py-1 rounded hover:bg-blue-700"
                >
                  Refresh
                </button>
              </div>

              {activeChains.length === 0 ? (
                <p className="text-gray-400 text-sm">No active quest chains</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {activeChains.map((chain) => (
                    <div key={chain.chainId} className="bg-gray-800 p-2 rounded text-xs">
                      <div className="font-semibold text-white truncate">
                        {chain.originalPrompt}
                      </div>
                      <div className="text-gray-300 mt-1">
                        Status: <span className="text-green-400">{chain.status}</span>
                        {' | '}
                        Quests: {chain.questIds.length}
                        {' | '}
                        Completed: {chain.completedQuests.length}
                      </div>
                      <div className="text-gray-400 text-xs">
                        ID: {chain.chainId.slice(0, 8)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleForceCleanup}
                className="w-full bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm transition-colors"
              >
                Force Storage Cleanup
              </button>
              <button
                onClick={handleInitializeChain}
                className="w-full bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm transition-colors"
              >
                Create Test Chain
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuestChainDebugPanel;