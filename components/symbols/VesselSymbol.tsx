/**
 * components/symbols/VesselSymbol.tsx - Dynamic vessel symbol selector
 */
import React from 'react';
import KayakSymbol from './vessels/KayakSymbol';
import RaftSymbol from './vessels/RaftSymbol';
import SailboatSymbol from './vessels/SailboatSymbol';
import RowboatSymbol from './vessels/RowboatSymbol';
import { Item } from '../../types';

interface VesselSymbolProps {
  vessel: Item;
  x: number;
  y: number;
  rotation?: number;
  size?: number;
}

const VesselSymbol: React.FC<VesselSymbolProps> = React.memo(({ vessel, x, y, rotation = 0, size }) => {
  const vesselType = vessel.name.toLowerCase();
  
  // Determine vessel type from name
  if (vesselType.includes('kayak') || vesselType.includes('canoe')) {
    return <KayakSymbol x={x} y={y} rotation={rotation} size={size} />;
  }
  
  if (vesselType.includes('raft') || vesselType.includes('log')) {
    return <RaftSymbol x={x} y={y} rotation={rotation} size={size} />;
  }
  
  if (vesselType.includes('sailboat') || vesselType.includes('sail')) {
    return <SailboatSymbol x={x} y={y} rotation={rotation} size={size} />;
  }
  
  if (vesselType.includes('rowboat') || vesselType.includes('row') || vesselType.includes('dinghy')) {
    return <RowboatSymbol x={x} y={y} rotation={rotation} size={size} />;
  }
  
  // Default to rowboat for unrecognized vessel types
  return <RowboatSymbol x={x} y={y} rotation={rotation} size={size} />;
});

export default VesselSymbol;