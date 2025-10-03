/**
 * components/symbols/quarries/QuarrySymbols.tsx - Era-specific quarry symbols
 */
import React from 'react';
import PrehistoricQuarry from './PrehistoricQuarry';
import AntiquityQuarry from './AntiquityQuarry';
import MedievalQuarry from './MedievalQuarry';
import RenaissanceQuarry from './RenaissanceQuarry';
import IndustrialQuarry from './IndustrialQuarry';
import ModernQuarry from './ModernQuarry';
import { HistoricalEra } from '../../../types';

export type QuarrySymbolType = 
  | 'prehistoric_quarry'
  | 'antiquity_quarry' 
  | 'medieval_quarry'
  | 'renaissance_quarry'
  | 'industrial_quarry'
  | 'modern_quarry';

export function getQuarrySymbol(era: HistoricalEra | string): React.ComponentType<any> {
  switch (era) {
    case HistoricalEra.PREHISTORY:
    case 'PREHISTORIC':
      return PrehistoricQuarry;
    
    case HistoricalEra.ANTIQUITY:
    case 'ANTIQUITY':
      return AntiquityQuarry;
    
    case HistoricalEra.MEDIEVAL:
    case 'MEDIEVAL':
      return MedievalQuarry;
    
    case HistoricalEra.RENAISSANCE_EARLY_MODERN:
    case 'RENAISSANCE_EARLY_MODERN':
      return RenaissanceQuarry;
    
    case HistoricalEra.INDUSTRIAL_ERA:
    case 'INDUSTRIAL_ERA':
      return IndustrialQuarry;
    
    case HistoricalEra.MODERN_ERA:
    case 'MODERN_ERA':
    case HistoricalEra.FUTURE_ERA:
    case 'FUTURE_ERA':
      return ModernQuarry;
    
    default:
      return MedievalQuarry; // Default fallback
  }
}

export function getQuarrySymbolType(era: HistoricalEra | string): QuarrySymbolType {
  switch (era) {
    case HistoricalEra.PREHISTORY:
    case 'PREHISTORIC':
      return 'prehistoric_quarry';
    
    case HistoricalEra.ANTIQUITY:
    case 'ANTIQUITY':
      return 'antiquity_quarry';
    
    case HistoricalEra.MEDIEVAL:
    case 'MEDIEVAL':
      return 'medieval_quarry';
    
    case HistoricalEra.RENAISSANCE_EARLY_MODERN:
    case 'RENAISSANCE_EARLY_MODERN':
      return 'renaissance_quarry';
    
    case HistoricalEra.INDUSTRIAL_ERA:
    case 'INDUSTRIAL_ERA':
      return 'industrial_quarry';
    
    case HistoricalEra.MODERN_ERA:
    case 'MODERN_ERA':
    case HistoricalEra.FUTURE_ERA:
    case 'FUTURE_ERA':
      return 'modern_quarry';
    
    default:
      return 'medieval_quarry';
  }
}