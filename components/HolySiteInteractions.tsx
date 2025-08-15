/**
 * components/HolySiteInteractions.tsx - Religious services and interactions for holy sites
 */
import React, { useState, useEffect } from 'react';
import { TerrainStructure, NpcEntity } from '../types';
import { holySiteEconomyService, ReligiousService } from '../services/holySiteEconomyService';
import { useMap } from '../contexts/MapContext';

interface HolySiteInteractionsProps {
  structure: TerrainStructure;
  religion?: string;
  playerCharacter?: NpcEntity;
  onServicePurchased?: (service: ReligiousService) => void;
}

const HolySiteInteractions: React.FC<HolySiteInteractionsProps> = ({ 
  structure, 
  religion = 'Local Faith',
  playerCharacter,
  onServicePurchased 
}) => {
  const { updatePlayerCharacter } = useMap();
  const [services, setServices] = useState<ReligiousService[]>([]);
  const [selectedService, setSelectedService] = useState<ReligiousService | null>(null);
  const [message, setMessage] = useState<string>('');
  const [economySummary, setEconomySummary] = useState<string>('');

  useEffect(() => {
    // Get available services from the service
    const availableServices = holySiteEconomyService.getServices(structure.id);
    if (availableServices) {
      setServices(availableServices);
    }

    // Get economy summary
    const summary = holySiteEconomyService.getEconomySummary(structure.id);
    setEconomySummary(summary);
  }, [structure.id]);

  const handleServicePurchase = (service: ReligiousService) => {
    if (!playerCharacter) {
      setMessage('No player character available');
      return;
    }

    const result = holySiteEconomyService.purchaseService(
      structure.id,
      service.id,
      playerCharacter
    );

    setMessage(result.message);
    
    if (result.success) {
      // Update player character in the game state
      updatePlayerCharacter?.(playerCharacter);
      
      // Notify parent component
      onServicePurchased?.(service);
      
      // Clear selection
      setSelectedService(null);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleTithe = () => {
    if (!playerCharacter) {
      setMessage('No player character available');
      return;
    }

    // Default tithe amount (could be made configurable)
    const titheAmount = 10;
    
    const success = holySiteEconomyService.processTithe(
      structure.id,
      playerCharacter,
      titheAmount
    );

    if (success) {
      setMessage(`Donated ${titheAmount} coins to the ${structure.name}`);
      updatePlayerCharacter?.(playerCharacter);
    } else {
      setMessage('Insufficient funds for tithe');
    }

    setTimeout(() => setMessage(''), 3000);
  };

  const getPlayerCoins = (): number => {
    if (!playerCharacter) return 0;
    const coins = playerCharacter.inventory?.find(item => item.id === 'coins');
    return coins?.quantity || 0;
  };

  return (
    <div className="space-y-4">
      {/* Economy Overview */}
      {structure.allegianceGroup && (
        <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
          <h4 className="font-semibold text-amber-300 mb-2">Holy Site Economy</h4>
          <div className="text-xs text-slate-300 whitespace-pre-line">
            {economySummary}
          </div>
        </div>
      )}

      {/* Religious Services */}
      <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
        <h4 className="font-semibold text-cyan-400 mb-2">Religious Services</h4>
        
        {services.length > 0 ? (
          <div className="space-y-2">
            {services.map(service => (
              <div 
                key={service.id}
                className={`p-2 rounded border cursor-pointer transition-colors ${
                  selectedService?.id === service.id 
                    ? 'bg-blue-900/40 border-blue-500' 
                    : 'bg-slate-900/40 border-slate-600 hover:bg-slate-800/60'
                }`}
                onClick={() => setSelectedService(service)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-white">{service.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{service.description}</p>
                    {service.requirements && (
                      <p className="text-xs text-yellow-400 mt-1">
                        {service.requirements.allegianceGroup && 
                          `Requires ${service.requirements.allegianceGroup} faith`}
                        {service.requirements.minReputation && 
                          ` • Min reputation: ${service.requirements.minReputation}`}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-sm font-bold text-yellow-300">
                      {service.cost === 0 ? 'Free' : `${service.cost} coins`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No services available</p>
        )}

        {selectedService && (
          <div className="mt-3 flex gap-2">
            <button 
              className="ff-action-button flex-1"
              onClick={() => handleServicePurchase(selectedService)}
              disabled={getPlayerCoins() < selectedService.cost}
            >
              Purchase Service
            </button>
            <button 
              className="ff-action-button"
              onClick={() => setSelectedService(null)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
        <h4 className="font-semibold text-blue-300 mb-2">Actions</h4>
        <div className="grid grid-cols-2 gap-2">
          <button 
            className="ff-action-button"
            onClick={handleTithe}
            disabled={getPlayerCoins() < 10}
          >
            Pay Tithe (10 coins)
          </button>
          <button className="ff-action-button">
            Pray
          </button>
          <button className="ff-action-button">
            Seek Counsel
          </button>
          <button className="ff-action-button">
            Study Texts
          </button>
        </div>
      </div>

      {/* Player Resources */}
      {playerCharacter && (
        <div className="p-2 bg-slate-900/60 rounded text-center">
          <p className="text-sm text-slate-300">
            Your coins: <span className="text-yellow-300 font-bold">{getPlayerCoins()}</span>
          </p>
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className="p-3 bg-blue-900/40 border border-blue-500 rounded-lg text-center">
          <p className="text-sm text-white">{message}</p>
        </div>
      )}
    </div>
  );
};

export default HolySiteInteractions;