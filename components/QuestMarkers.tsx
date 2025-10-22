/**
 * QuestMarkers.tsx - Visual markers for quest objectives and work offers on the map
 */
import React, { useEffect, useState } from 'react';
import { questService } from '../services/questService';
import { Quest, QuestObjective } from '../types/questTypes';
import { WorkOffer } from '../types/workOffer';
import { getActiveWorkOffers } from '../services/workOfferStorage';
import { MapPin, Target, Flag, Briefcase } from 'lucide-react';

interface QuestMarkersProps {
  playerX: number;
  playerY: number;
  tileSize: number;
  viewportOffsetX: number;
  viewportOffsetY: number;
}

const QuestMarkers: React.FC<QuestMarkersProps> = ({
  playerX,
  playerY,
  tileSize,
  viewportOffsetX,
  viewportOffsetY
}) => {
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);
  const [currentObjectives, setCurrentObjectives] = useState<(QuestObjective & { questId: string })[]>([]);
  const [workOffers, setWorkOffers] = useState<WorkOffer[]>([]);

  useEffect(() => {
    // Load active quest and its current objectives (only show markers for active quest)
    const loadQuests = () => {
      const activeQuest = questService.getCurrentlyActiveQuest();
      const allQuests = questService.getActiveQuests();
      setActiveQuests(allQuests);

      // Get current objectives only from the currently active quest
      const objectives: (QuestObjective & { questId: string })[] = [];
      if (activeQuest) {
        const currentObj = activeQuest.objectives[activeQuest.currentObjectiveIndex];
        if (currentObj && !currentObj.completed && currentObj.targetLocation) {
          objectives.push({...currentObj, questId: activeQuest.id});
        }
      }
      setCurrentObjectives(objectives);

      // Load active work offers
      setWorkOffers(getActiveWorkOffers());
    };

    loadQuests();

    // Listen for quest updates
    const handleQuestUpdate = () => loadQuests();
    window.addEventListener('questAdded', handleQuestUpdate);
    window.addEventListener('questCompleted', handleQuestUpdate);
    window.addEventListener('questProgress', handleQuestUpdate);
    window.addEventListener('activeQuestChanged', handleQuestUpdate);

    // Listen for work offer updates
    window.addEventListener('workOfferAccepted', handleQuestUpdate);
    window.addEventListener('workOfferCompleted', handleQuestUpdate);
    window.addEventListener('workOfferFailed', handleQuestUpdate);
    window.addEventListener('workOfferAbandoned', handleQuestUpdate);

    return () => {
      window.removeEventListener('questAdded', handleQuestUpdate);
      window.removeEventListener('questCompleted', handleQuestUpdate);
      window.removeEventListener('questProgress', handleQuestUpdate);
      window.removeEventListener('activeQuestChanged', handleQuestUpdate);

      window.removeEventListener('workOfferAccepted', handleQuestUpdate);
      window.removeEventListener('workOfferCompleted', handleQuestUpdate);
      window.removeEventListener('workOfferFailed', handleQuestUpdate);
      window.removeEventListener('workOfferAbandoned', handleQuestUpdate);
    };
  }, []);

  // Calculate distance to player for each objective
  const getDistanceToPlayer = (objX: number, objY: number) => {
    return Math.sqrt(Math.pow(objX - playerX, 2) + Math.pow(objY - playerY, 2));
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {currentObjectives.map((objective, index) => {
        if (!objective.targetLocation) return null;

        const { x, y } = objective.targetLocation;

        // Don't render quest markers at invalid coordinates (0,0)
        if (x === 0 && y === 0) return null;

        const distance = getDistanceToPlayer(x, y);

        // Calculate screen position
        const screenX = (x - playerX) * tileSize + viewportOffsetX;
        const screenY = (y - playerY) * tileSize + viewportOffsetY;

        // Don't render if the screen position ends up at the origin (likely a bug)
        if (Math.abs(screenX) < 10 && Math.abs(screenY) < 10) {
          console.warn('[QuestMarkers] Skipping marker at suspicious screen position:', { x, y, screenX, screenY, playerX, playerY });
          return null;
        }
        
        // Don't render if too far off screen
        if (Math.abs(screenX - viewportOffsetX) > 1000 || Math.abs(screenY - viewportOffsetY) > 1000) {
          return null;
        }
        
        // Different styles based on distance
        const isNearby = distance < 5;
        const isPrimary = index === 0; // First objective is primary
        
        return (
          <div
            key={`marker-${objective.questId}-${objective.id}-${x}-${y}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${screenX}px`,
              top: `${screenY}px`,
            }}
          >
            {/* Pulsing circle effect */}
            <div className={`absolute inset-0 ${isPrimary ? 'animate-ping' : 'animate-pulse'}`}>
              <div className={`w-8 h-8 rounded-full ${
                isPrimary 
                  ? 'bg-yellow-400 opacity-30' 
                  : 'bg-blue-400 opacity-20'
              }`} />
            </div>
            
            {/* Main marker */}
            <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${
              isPrimary 
                ? 'bg-yellow-500 border-2 border-yellow-300 shadow-glow-yellow' 
                : 'bg-blue-500 border-2 border-blue-300 shadow-glow-blue'
            }`}>
              {isNearby ? (
                <Target className="w-4 h-4 text-white" />
              ) : isPrimary ? (
                <Flag className="w-4 h-4 text-white" />
              ) : (
                <MapPin className="w-4 h-4 text-white" />
              )}
            </div>
            
            {/* Distance indicator for nearby objectives */}
            {isNearby && (
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {Math.round(distance)} tiles away
              </div>
            )}
            
            {/* Objective description on hover (would need pointer-events-auto for actual hover) */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap max-w-xs">
              {objective.description}
            </div>
          </div>
        );
      })}

      {/* Work Offer Markers */}
      {workOffers.map((offer) => {
        // Show marker for NPC return location
        if (!offer.npcLocation) return null;
        const { x, y } = offer.npcLocation;

        if (x === 0 && y === 0) return null;

        const distance = getDistanceToPlayer(x, y);

        // Calculate screen position
        const screenX = (x - playerX) * tileSize + viewportOffsetX;
        const screenY = (y - playerY) * tileSize + viewportOffsetY;

        // Don't render if too far off screen
        if (Math.abs(screenX - viewportOffsetX) > 1000 || Math.abs(screenY - viewportOffsetY) > 1000) {
          return null;
        }

        const isNearby = distance < 5;
        const isCompleted = offer.completed;

        return (
          <div
            key={`work-marker-${offer.id}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${screenX}px`,
              top: `${screenY}px`,
            }}
          >
            {/* Pulsing circle effect */}
            <div className="absolute inset-0 animate-pulse">
              <div className={`w-8 h-8 rounded-full ${
                isCompleted ? 'bg-green-400 opacity-30' : 'bg-amber-400 opacity-25'
              }`} />
            </div>

            {/* Main marker */}
            <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${
              isCompleted
                ? 'bg-green-500 border-2 border-green-300'
                : 'bg-amber-500 border-2 border-amber-300'
            }`}>
              <Briefcase className="w-4 h-4 text-white" />
            </div>

            {/* Distance indicator for nearby work */}
            {isNearby && (
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {isCompleted ? '✓ Complete!' : `${Math.round(distance)} tiles`}
              </div>
            )}

            {/* Work description tooltip */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity bg-black/80 text-amber-200 text-xs px-2 py-1 rounded whitespace-nowrap max-w-xs">
              {isCompleted ? `Return to ${offer.npcName}` : offer.description}
            </div>
          </div>
        );
      })}

      {/* Directional arrows for off-screen objectives */}
      {currentObjectives.map((objective, index) => {
        if (!objective.targetLocation) return null;
        
        const { x, y } = objective.targetLocation;
        const screenX = (x - playerX) * tileSize + viewportOffsetX;
        const screenY = (y - playerY) * tileSize + viewportOffsetY;
        
        // Check if objective is off-screen
        const isOffScreen = Math.abs(screenX - viewportOffsetX) > 500 || Math.abs(screenY - viewportOffsetY) > 400;
        
        if (!isOffScreen) return null;
        
        // Calculate angle to objective
        const angle = Math.atan2(y - playerY, x - playerX);
        const distance = getDistanceToPlayer(x, y);
        
        // Position arrow at edge of screen
        const edgeDistance = 100;
        const arrowX = viewportOffsetX + Math.cos(angle) * edgeDistance;
        const arrowY = viewportOffsetY + Math.sin(angle) * edgeDistance;
        
        const isPrimary = index === 0;
        
        return (
          <div
            key={`arrow-${objective.questId}-${objective.id}`}
            className="absolute"
            style={{
              left: `${arrowX}px`,
              top: `${arrowY}px`,
              transform: `translate(-50%, -50%) rotate(${angle}rad)`,
            }}
          >
            <div className={`flex items-center ${isPrimary ? 'text-yellow-400' : 'text-blue-400'}`}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
                <path d="M24 16L8 24V8L24 16Z" />
              </svg>
              <span 
                className="ml-2 text-xs font-bold bg-black/70 px-1 rounded"
                style={{ transform: `rotate(${-angle}rad)` }}
              >
                {Math.round(distance)}
              </span>
            </div>
          </div>
        );
      })}

      {/* Directional arrows for off-screen work offers */}
      {workOffers.map((offer) => {
        if (!offer.npcLocation) return null;
        const { x, y } = offer.npcLocation;
        const screenX = (x - playerX) * tileSize + viewportOffsetX;
        const screenY = (y - playerY) * tileSize + viewportOffsetY;

        // Check if offer is off-screen
        const isOffScreen = Math.abs(screenX - viewportOffsetX) > 500 || Math.abs(screenY - viewportOffsetY) > 400;

        if (!isOffScreen) return null;

        // Calculate angle to NPC
        const angle = Math.atan2(y - playerY, x - playerX);
        const distance = getDistanceToPlayer(x, y);

        // Position arrow at edge of screen
        const edgeDistance = 100;
        const arrowX = viewportOffsetX + Math.cos(angle) * edgeDistance;
        const arrowY = viewportOffsetY + Math.sin(angle) * edgeDistance;

        const isCompleted = offer.completed;

        return (
          <div
            key={`work-arrow-${offer.id}`}
            className="absolute"
            style={{
              left: `${arrowX}px`,
              top: `${arrowY}px`,
              transform: `translate(-50%, -50%) rotate(${angle}rad)`,
            }}
          >
            <div className={`flex items-center ${isCompleted ? 'text-green-400' : 'text-amber-400'}`}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
                <path d="M24 16L8 24V8L24 16Z" />
              </svg>
              <span
                className="ml-2 text-xs font-bold bg-black/70 px-1 rounded"
                style={{ transform: `rotate(${-angle}rad)` }}
              >
                {Math.round(distance)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuestMarkers;