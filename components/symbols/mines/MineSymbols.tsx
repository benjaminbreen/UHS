/**
 * components/symbols/mines/MineSymbols.tsx - Era-specific mine symbols
 */
import React from 'react';
import PrehistoricMine from './PrehistoricMine';
import AntiquityMine from './AntiquityMine';
import MedievalMine from './MedievalMine';
import RenaissanceMine from './RenaissanceMine';
import IndustrialMine from './IndustrialMine';
import ModernMine from './ModernMine';
import FutureMine from './FutureMine';
import { HistoricalEra } from '../../../types';

export type MineSymbolType = 
  | 'prehistoric_mine'
  | 'antiquity_mine' 
  | 'medieval_mine'
  | 'renaissance_mine'
  | 'industrial_mine'
  | 'modern_mine'
  | 'future_mine';

export function getMineSymbol(era: HistoricalEra | string): React.ComponentType<any> {
  switch (era) {
    case HistoricalEra.PREHISTORIC:
    case 'PREHISTORIC':
      return PrehistoricMine;
    
    case HistoricalEra.ANTIQUITY:
    case 'ANTIQUITY':
      return AntiquityMine;
    
    case HistoricalEra.MEDIEVAL:
    case 'MEDIEVAL':
      return MedievalMine;
    
    case HistoricalEra.RENAISSANCE_EARLY_MODERN:
    case 'RENAISSANCE_EARLY_MODERN':
      return RenaissanceMine;
    
    case HistoricalEra.INDUSTRIAL_ERA:
    case 'INDUSTRIAL_ERA':
      return IndustrialMine;
    
    case HistoricalEra.MODERN_ERA:
    case 'MODERN_ERA':
      return ModernMine;
    
    case HistoricalEra.FUTURE_ERA:
    case 'FUTURE_ERA':
      return FutureMine;
    
    default:
      return IndustrialMine; // Default fallback
  }
}

export function getMineSymbolType(era: HistoricalEra | string): MineSymbolType {
  switch (era) {
    case HistoricalEra.PREHISTORIC:
    case 'PREHISTORIC':
      return 'prehistoric_mine';
    
    case HistoricalEra.ANTIQUITY:
    case 'ANTIQUITY':
      return 'antiquity_mine';
    
    case HistoricalEra.MEDIEVAL:
    case 'MEDIEVAL':
      return 'medieval_mine';
    
    case HistoricalEra.RENAISSANCE_EARLY_MODERN:
    case 'RENAISSANCE_EARLY_MODERN':
      return 'renaissance_mine';
    
    case HistoricalEra.INDUSTRIAL_ERA:
    case 'INDUSTRIAL_ERA':
      return 'industrial_mine';
    
    case HistoricalEra.MODERN_ERA:
    case 'MODERN_ERA':
      return 'modern_mine';
    
    case HistoricalEra.FUTURE_ERA:
    case 'FUTURE_ERA':
      return 'future_mine';
    
    default:
      return 'industrial_mine';
  }
}