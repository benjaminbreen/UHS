/**
 * components/symbols/ruins/RuinsSymbolNew.tsx
 * Master component that selects appropriate ruin style based on culture/era
 */
import React from 'react';
import { Tile, ClimateType } from '../../../types';
import { getRuinArchitecture } from '../../../services/ruinArchitectureService';
import ClassicalRuinsSymbol from './ClassicalRuinsSymbol';
import MedievalRuinsSymbol from './MedievalRuinsSymbol';
import PyramidRuinsSymbol from './PyramidRuinsSymbol';
import AsianRuinsSymbol from './AsianRuinsSymbol';
import MegalithicRuinsSymbol from './MegalithicRuinsSymbol';
import IslamicRuinsSymbol from './IslamicRuinsSymbol';
import AfricanRuinsSymbol from './AfricanRuinsSymbol';
import NativeAmericanRuinsSymbol from './NativeAmericanRuinsSymbol';
import IndustrialRuinsSymbol from './IndustrialRuinsSymbol';
import ColonialRuinsSymbol from './ColonialRuinsSymbol';
import { ValueNoise } from '../../../utils/noise';

interface RuinsSymbolNewProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  climate?: ClimateType;
}

const RuinsSymbolNew: React.FC<RuinsSymbolNewProps> = ({ 
  x, y, size, seed, tile, climate = ClimateType.TEMPERATE 
}) => {
  // Get cultural zone and era from tile structure or defaults
  const culturalZone = tile.structure?.culturalZone || tile.culturalZone || 'EUROPEAN';
  const era = tile.structure?.era || 'MEDIEVAL';
  const constructionYear = tile.structure?.constructionYear || -500;
  
  // Get current year from somewhere (would need to be passed in or from context)
  const currentYear = 1650; // Default for now
  const ruinAge = Math.max(50, currentYear - constructionYear);
  
  // Get architecture details
  const architecture = getRuinArchitecture(culturalZone, era, climate, ruinAge);
  
  // Select appropriate symbol component based on architecture style
  const renderRuin = () => {
    const props = {
      x, y, size, seed, tile,
      preservationLevel: architecture.preservationLevel
    };
    
    switch (architecture.style) {
      // Classical antiquity
      case 'classical':
        return <ClassicalRuinsSymbol {...props} />;
      
      // Ancient Egyptian and pyramids
      case 'ancient_egyptian':
      case 'nubian':
        return <PyramidRuinsSymbol {...props} culturalZone="MENA" />;
        
      // Medieval European
      case 'gothic':
      case 'romanesque':
      case 'baroque':
        return <MedievalRuinsSymbol {...props} />;
        
      // Islamic architecture
      case 'islamic':
      case 'ottoman':
      case 'ancient_near_east':
        return <IslamicRuinsSymbol {...props} era={era} />;
        
      // Mesoamerican pyramids
      case 'maya_classic':
      case 'aztec':
      case 'olmec':
        return <PyramidRuinsSymbol {...props} culturalZone="MESOAMERICAN" />;
        
      // South American
      case 'inca':
      case 'moche':
      case 'chavin':
        return <PyramidRuinsSymbol {...props} culturalZone="SOUTH_AMERICAN" />;
        
      // Asian architecture
      case 'ancient_chinese':
      case 'han_dynasty':
      case 'tang_song':
      case 'mauryan':
      case 'dravidian':
        return <AsianRuinsSymbol {...props} />;
        
      // Prehistoric and megalithic
      case 'megalithic':
      case 'ancient_mound':
      case 'polynesian':
        return <MegalithicRuinsSymbol {...props} culturalZone={culturalZone} />;
        
      // Native American
      case 'ancestral_puebloan':
      case 'mississippian':
        return <NativeAmericanRuinsSymbol {...props} culturalZone={culturalZone} />;
        
      // Industrial era
      case 'industrial':
        return <IndustrialRuinsSymbol {...props} region={culturalZone} />;
        
      // African architecture
      case 'zimbabwe':
        return <AfricanRuinsSymbol {...props} region="SOUTH" />;
      case 'swahili':
        return <AfricanRuinsSymbol {...props} region="EAST" />;
      case 'sudanic':
      case 'yoruba':
        return <AfricanRuinsSymbol {...props} region="WEST" />;
        
      // Colonial architecture
      case 'colonial':
      case 'spanish_colonial':
        return <ColonialRuinsSymbol {...props} empire="Spanish" />;
      case 'portuguese_colonial':
        return <ColonialRuinsSymbol {...props} empire="Portuguese" />;
      case 'british_colonial':
        return <ColonialRuinsSymbol {...props} empire="British" />;
      case 'dutch_colonial':
        return <ColonialRuinsSymbol {...props} empire="Dutch" />;
        
      default:
        // Fallback based on era
        if (era === 'PREHISTORY') return <MegalithicRuinsSymbol {...props} culturalZone={culturalZone} />;
        if (era === 'INDUSTRIAL_ERA') return <IndustrialRuinsSymbol {...props} region={culturalZone} />;
        if (era === 'MODERN') return <IndustrialRuinsSymbol {...props} region={culturalZone} />;
        return <MedievalRuinsSymbol {...props} />;
    }
  };
  
  // Apply weathering effects overlay based on climate
  const weatheringOverlay = () => {
    const rng = new ValueNoise(seed + tile.x * 43 + tile.y * 47);
    const elements: JSX.Element[] = [];
    
    switch (architecture.weatheringType) {
      case 'overgrown':
        // Tropical overgrowth
        for (let i = 0; i < 3; i++) {
          const vineX = x + size * rng.random();
          const vineY = y + size * (0.2 + rng.random() * 0.6);
          elements.push(
            <path
              key={`vine-${i}`}
              d={`M ${vineX} ${vineY} Q ${vineX + size * 0.1} ${vineY + size * 0.2} ${vineX - size * 0.05} ${vineY + size * 0.35}`}
              stroke="#2F4F2F"
              strokeWidth="1.5"
              fill="none"
              opacity={0.4}
            />
          );
        }
        break;
        
      case 'sand_buried':
        // Sand drifts
        elements.push(
          <ellipse
            key="sand"
            cx={x + size * 0.5}
            cy={y + size * 0.85}
            rx={size * 0.55}
            ry={size * 0.1}
            fill="#F4A460"
            opacity={0.25}
          />
        );
        break;
        
      case 'frost_cracked':
        // Ice and snow
        elements.push(
          <g key="frost" opacity={0.3}>
            <ellipse cx={x + size * 0.5} cy={y + size * 0.8} rx={size * 0.4} ry={size * 0.08} fill="white" />
            {[0.2, 0.5, 0.8].map(off => (
              <rect key={off} x={x + size * off} y={y + size * 0.3} width={size * 0.02} height={size * 0.4} 
                fill="white" transform={`rotate(${10 - off * 20} ${x + size * off} ${y + size * 0.5})`} />
            ))}
          </g>
        );
        break;
        
      case 'salt_damaged':
        // Salt crystals and erosion
        elements.push(
          <g key="salt" opacity={0.2}>
            {Array.from({length: 8}).map((_, i) => (
              <circle key={i} cx={x + size * (0.1 + rng.random() * 0.8)} 
                cy={y + size * (0.3 + rng.random() * 0.5)} r={size * 0.01} fill="white" />
            ))}
          </g>
        );
        break;
    }
    
    return <g key="weathering">{elements}</g>;
  };
  
  return (
    <g>
      {renderRuin()}
      {weatheringOverlay()}
    </g>
  );
};


export default React.memo(RuinsSymbolNew);