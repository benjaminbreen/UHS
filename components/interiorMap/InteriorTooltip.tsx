/**
 * components/interiorMap/InteriorTooltip.tsx - A tooltip for interior objects.
 */
import React from 'react';
import { InteriorEntity } from '../../types';

interface InteriorTooltipProps {
  entity: InteriorEntity;
  position: { x: number; y: number };
}

const InteriorTooltip: React.FC<InteriorTooltipProps> = ({ entity, position }) => {
  const style: React.CSSProperties = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: 'translate(-50%, -120%)', // Center horizontally, place above cursor
    pointerEvents: 'none',
    zIndex: 1000,
  };
  
  const formattedName = entity.subType.replace(/_/g, ' ');

  return (
    <div style={style} className="bg-gray-900 bg-opacity-80 text-white text-xs rounded-md shadow-lg px-3 py-1.5 border border-gray-600 capitalize">
      {formattedName}
    </div>
  );
};

export default InteriorTooltip;