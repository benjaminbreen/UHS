/**
 * QuestMarkers.tsx - Visual markers for work offers on the map
 * Shows both NPC return locations AND target locations for tasks
 */
import React, { useEffect, useState } from 'react';
import { WorkOffer } from '../types/workOffer';
import { getActiveWorkOffers } from '../services/workOfferStorage';
import { MapPin, Target, Briefcase, Crosshair } from 'lucide-react';

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
  const [workOffers, setWorkOffers] = useState<WorkOffer[]>([]);

  useEffect(() => {
    const loadOffers = () => {
      setWorkOffers(getActiveWorkOffers());
    };

    loadOffers();

    // Listen for work offer updates
    const handleWorkOfferUpdate = () => loadOffers();
    window.addEventListener('workOfferAccepted', handleWorkOfferUpdate);
    window.addEventListener('workOfferCompleted', handleWorkOfferUpdate);
    window.addEventListener('workOfferFailed', handleWorkOfferUpdate);
    window.addEventListener('workOfferAbandoned', handleWorkOfferUpdate);
    window.addEventListener('inventoryUpdated', handleWorkOfferUpdate);

    return () => {
      window.removeEventListener('workOfferAccepted', handleWorkOfferUpdate);
      window.removeEventListener('workOfferCompleted', handleWorkOfferUpdate);
      window.removeEventListener('workOfferFailed', handleWorkOfferUpdate);
      window.removeEventListener('workOfferAbandoned', handleWorkOfferUpdate);
      window.removeEventListener('inventoryUpdated', handleWorkOfferUpdate);
    };
  }, []);

  const getDistanceToPlayer = (objX: number, objY: number) => {
    return Math.sqrt(Math.pow(objX - playerX, 2) + Math.pow(objY - playerY, 2));
  };

  // Helper to get task type icon and color
  const getTaskStyle = (taskType: string) => {
    switch (taskType) {
      case 'kill_animal':
        return { color: 'red', icon: '🎯', label: 'Hunt' };
      case 'explore_location':
        return { color: 'blue', icon: '🔍', label: 'Explore' };
      case 'deliver_to_location':
        return { color: 'purple', icon: '📦', label: 'Deliver' };
      case 'gather_resource':
        return { color: 'green', icon: '🌿', label: 'Gather' };
      default:
        return { color: 'cyan', icon: '📍', label: 'Go' };
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* TARGET LOCATION MARKERS - Where player needs to GO (not NPC location) */}
      {workOffers.filter(o => o.accepted && !o.completed && !o.failed).map((offer) => {
        // Only show target markers for location-based tasks
        if (!offer.targetLocation) return null;

        const { x, y, name, radius } = offer.targetLocation;
        if (x === 0 && y === 0) return null;

        const distance = getDistanceToPlayer(x, y);
        const screenX = (x - playerX) * tileSize + viewportOffsetX;
        const screenY = (y - playerY) * tileSize + viewportOffsetY;

        // Don't render if way off screen (will show arrow instead)
        if (Math.abs(screenX - viewportOffsetX) > 800 || Math.abs(screenY - viewportOffsetY) > 600) {
          return null;
        }

        const isNearby = distance <= (radius || 5);
        const taskStyle = getTaskStyle(offer.taskType);

        return (
          <div
            key={`target-marker-${offer.id}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${screenX}px`,
              top: `${screenY}px`,
            }}
          >
            {/* Pulsing radius indicator */}
            <div
              className="absolute rounded-full border-2 border-dashed animate-pulse"
              style={{
                width: `${(radius || 5) * tileSize * 2}px`,
                height: `${(radius || 5) * tileSize * 2}px`,
                left: `${-((radius || 5) * tileSize)}px`,
                top: `${-((radius || 5) * tileSize)}px`,
                borderColor: taskStyle.color === 'red' ? '#ef4444' :
                             taskStyle.color === 'blue' ? '#3b82f6' :
                             taskStyle.color === 'purple' ? '#a855f7' :
                             taskStyle.color === 'green' ? '#22c55e' : '#06b6d4',
                opacity: 0.4
              }}
            />

            {/* Main target marker */}
            <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 shadow-lg`}
              style={{
                backgroundColor: taskStyle.color === 'red' ? '#dc2626' :
                                 taskStyle.color === 'blue' ? '#2563eb' :
                                 taskStyle.color === 'purple' ? '#9333ea' :
                                 taskStyle.color === 'green' ? '#16a34a' : '#0891b2',
                borderColor: taskStyle.color === 'red' ? '#fca5a5' :
                             taskStyle.color === 'blue' ? '#93c5fd' :
                             taskStyle.color === 'purple' ? '#d8b4fe' :
                             taskStyle.color === 'green' ? '#86efac' : '#67e8f9',
              }}
            >
              <Crosshair className="w-5 h-5 text-white" />
            </div>

            {/* Location name and distance */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              <span className="font-semibold">{name}</span>
              {!isNearby && <span className="text-gray-300 ml-1">({Math.round(distance)} tiles)</span>}
              {isNearby && <span className="text-green-400 ml-1">✓ Arrived!</span>}
            </div>

            {/* Task type label */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-lg">
              {taskStyle.icon}
            </div>
          </div>
        );
      })}

      {/* NPC RETURN MARKERS - Where to return when task is done */}
      {workOffers.filter(o => o.accepted && !o.failed).map((offer) => {
        if (!offer.npcLocation) return null;
        const { x, y } = offer.npcLocation;
        if (x === 0 && y === 0) return null;

        const distance = getDistanceToPlayer(x, y);
        const screenX = (x - playerX) * tileSize + viewportOffsetX;
        const screenY = (y - playerY) * tileSize + viewportOffsetY;

        if (Math.abs(screenX - viewportOffsetX) > 800 || Math.abs(screenY - viewportOffsetY) > 600) {
          return null;
        }

        const isNearby = distance < 5;
        const isCompleted = offer.completed;

        // For non-location tasks (fetch_item, etc.), show a more prominent marker
        const isReturnReady = !offer.targetLocation || isCompleted;

        return (
          <div
            key={`npc-marker-${offer.id}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${screenX}px`,
              top: `${screenY}px`,
            }}
          >
            {/* Pulsing effect for ready-to-return */}
            {isReturnReady && (
              <div className="absolute inset-0 animate-pulse">
                <div className={`w-8 h-8 rounded-full ${
                  isCompleted ? 'bg-green-400 opacity-40' : 'bg-amber-400 opacity-30'
                }`} />
              </div>
            )}

            {/* Main marker */}
            <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              isCompleted
                ? 'bg-green-600 border-green-300'
                : isReturnReady
                  ? 'bg-amber-500 border-amber-300'
                  : 'bg-gray-600 border-gray-400 opacity-60'
            }`}>
              <Briefcase className="w-4 h-4 text-white" />
            </div>

            {/* NPC name and status */}
            {(isNearby || isReturnReady) && (
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {isCompleted ? (
                  <span className="text-green-400">✓ Return to {offer.npcName}</span>
                ) : isReturnReady ? (
                  <span className="text-amber-300">{offer.npcName}</span>
                ) : (
                  <span className="text-gray-400">{offer.npcName}</span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* DIRECTIONAL ARROWS for off-screen targets */}
      {workOffers.filter(o => o.accepted && !o.completed && !o.failed).map((offer) => {
        // Prioritize target location, fall back to NPC location
        const targetLoc = offer.targetLocation || offer.npcLocation;
        if (!targetLoc) return null;

        const x = 'x' in targetLoc ? targetLoc.x : 0;
        const y = 'y' in targetLoc ? targetLoc.y : 0;

        const screenX = (x - playerX) * tileSize + viewportOffsetX;
        const screenY = (y - playerY) * tileSize + viewportOffsetY;

        const isOffScreen = Math.abs(screenX - viewportOffsetX) > 400 || Math.abs(screenY - viewportOffsetY) > 300;
        if (!isOffScreen) return null;

        const angle = Math.atan2(y - playerY, x - playerX);
        const distance = getDistanceToPlayer(x, y);

        // Position arrow at edge of viewport
        const edgeDistance = 120;
        const arrowX = viewportOffsetX + Math.cos(angle) * edgeDistance;
        const arrowY = viewportOffsetY + Math.sin(angle) * edgeDistance;

        const taskStyle = getTaskStyle(offer.taskType);
        const isTargetMarker = offer.targetLocation != null;

        return (
          <div
            key={`arrow-${offer.id}`}
            className="absolute"
            style={{
              left: `${arrowX}px`,
              top: `${arrowY}px`,
              transform: `translate(-50%, -50%) rotate(${angle}rad)`,
            }}
          >
            <div className={`flex items-center ${
              isTargetMarker
                ? (taskStyle.color === 'red' ? 'text-red-400' :
                   taskStyle.color === 'blue' ? 'text-blue-400' :
                   taskStyle.color === 'purple' ? 'text-purple-400' :
                   taskStyle.color === 'green' ? 'text-green-400' : 'text-cyan-400')
                : 'text-amber-400'
            }`}>
              <svg width="28" height="28" viewBox="0 0 32 32" fill="currentColor">
                <path d="M24 16L8 24V8L24 16Z" />
              </svg>
              <span
                className="ml-1 text-xs font-bold bg-black/80 px-1.5 py-0.5 rounded"
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