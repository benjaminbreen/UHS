/**
 * components/symbols/StructureSymbol.tsx - Dynamic structure symbol selector
 */
import React from 'react';
import TentSymbol from './structures/TentSymbol';
import StoneHouseSymbol from './structures/StoneHouseSymbol';
import { DeployedStructure } from '../../types/structureTypes';

interface StructureSymbolProps {
  structure: DeployedStructure;
  x: number;
  y: number;
  size?: number;
}

const StructureSymbol: React.FC<StructureSymbolProps> = React.memo(({ structure, x, y, size }) => {
  switch (structure.type) {
    case 'tent':
      return <TentSymbol x={x} y={y} size={size} />;
    case 'stone_house':
      return <StoneHouseSymbol x={x} y={y} size={size} />;
    default:
      // Default to tent for unrecognized types
      return <TentSymbol x={x} y={y} size={size} />;
  }
});

export default StructureSymbol;
