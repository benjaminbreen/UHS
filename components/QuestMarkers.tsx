/**
 * QuestMarkers.tsx - Visual markers for work offers on the map
 * (Quest system removed)
 */
import React, { useEffect, useState } from 'react';
// Quest system removed
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
  const [workOffers, setWorkOffers] = useState<WorkOffer[]>([]);

  useEffect(() => {
    // Load work offers only (quest system removed)
    const loadWorkOffers = () => {
      setWorkOffers(getActiveWorkOffers());
    };

    loadWorkOffers();

    // Listen for work offer updates
    const handleWorkOfferUpdate = () => loadWorkOffers();
    window.addEventListener('workOfferAccepted', handleWorkOfferUpdate);
    window.addEventListener('workOfferCompleted', handleWorkOfferUpdate);
    window.addEventListener('workOfferFailed', handleWorkOfferUpdate);
    window.addEventListener('workOfferAbandoned', handleWorkOfferUpdate);

    return () => {
      window.removeEventListener('workOfferAccepted', handleWorkOfferUpdate);
      window.removeEventListener('workOfferCompleted', handleWorkOfferUpdate);
      window.removeEventListener('workOfferFailed', handleWorkOfferUpdate);
      window.removeEventListener('workOfferAbandoned', handleWorkOfferUpdate);
    };
  }, []);

  // Calculate distance to player for each objective
  const getDistanceToPlayer = (objX: number, objY: number) => {
    return Math.sqrt(Math.pow(objX - playerX, 2) + Math.pow(objY - playerY, 2));
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* Quest system removed - only show work offer markers */}

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

      {/* Quest system removed - no directional arrows for quest objectives */}

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