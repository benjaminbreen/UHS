/**
 * components/symbols/GovernmentDistrictSymbol.tsx - Era and culture-specific government building rendering dispatcher.
 */
import React from 'react';
import { Tile, HistoricalEra } from '../../types';
import { parseDateString } from '../../utils/dateUtils';
import RomanForumSymbol from './government/RomanForumSymbol';
import FeudalHallSymbol from './government/FeudalHallSymbol';
import TownHallSymbol from './government/TownHallSymbol';
import CityHallSymbol from './government/CityHallSymbol';
import AdminCenterSymbol from './government/AdminCenterSymbol';
import CaliphCourtSymbol from './government/CaliphCourtSymbol';
import MandateHallSymbol from './government/MandateHallSymbol';
import ColonialOfficeSymbol from './government/ColonialOfficeSymbol';
import TribalCouncilSymbol from './government/TribalCouncilSymbol';
import AgoraSymbol from './government/AgoraSymbol';
import ShogunateSymbol from './government/ShogunateSymbol';
import AztecPalaceSymbol from './government/AztecPalaceSymbol';
import SovietMinistrySymbol from './government/SovietMinistrySymbol';
import OceanianMeetingHouseSymbol from './government/OceanianMeetingHouseSymbol';

interface GovernmentDistrictSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  date?: string;
  zone?: string;
  nightIntensity?: number;
}

const GovernmentDistrictSymbol: React.FC<GovernmentDistrictSymbolProps> = ({ 
  x, y, size, seed, tile, date = "1000 CE", zone = "Europe", nightIntensity = 0 
}) => {
  const { era } = parseDateString(date);
  
  const commonProps = {
    x, y, size, seed, tile,
  };

  const renderGovernmentBuilding = () => {
    // Get the government building type from tile properties
    const buildingType = tile.governmentType || '';
    
    // Era and culture-specific logic
    if (zone === "Europe") {
      if (era === HistoricalEra.ANTIQUITY) {
        // Use Agora for Greek areas, Forum for Roman
        const isGreek = buildingType?.toLowerCase().includes('greek') || 
                       buildingType?.toLowerCase().includes('agora') ||
                       tile.cityName?.toLowerCase().includes('athens') ||
                       tile.cityName?.toLowerCase().includes('sparta');
        if (isGreek) {
          return <AgoraSymbol {...commonProps} buildingName={buildingType || "Agora"} />;
        }
        return <RomanForumSymbol {...commonProps} buildingName={buildingType || "Forum"} />;
      }
      if (era === HistoricalEra.MEDIEVAL) {
        return <FeudalHallSymbol {...commonProps} buildingName={buildingType || "Great Hall"} />;
      }
      if (era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
        return <TownHallSymbol {...commonProps} buildingName={buildingType || "Town Hall"} />;
      }
      if (era === HistoricalEra.INDUSTRIAL_ERA) {
        return <CityHallSymbol {...commonProps} buildingName={buildingType || "City Hall"} />;
      }
      if (era === HistoricalEra.MODERN_ERA) {
        // Use Soviet style for Eastern Europe post-1945
        const year = parseInt(date.match(/\d+/)?.[0] || '2000');
        const isEasternEurope = tile.cityName?.toLowerCase().includes('moscow') ||
                               tile.cityName?.toLowerCase().includes('warsaw') ||
                               tile.cityName?.toLowerCase().includes('berlin') ||
                               tile.region?.toLowerCase().includes('eastern');
        if (year >= 1945 && year <= 1991 && isEasternEurope) {
          return <SovietMinistrySymbol {...commonProps} buildingName={buildingType || "Ministry"} />;
        }
        return <AdminCenterSymbol {...commonProps} buildingName={buildingType || "Government Complex"} />;
      }
    }
    
    else if (zone === "MENA") {
      if (era === HistoricalEra.ANTIQUITY) {
        return <RomanForumSymbol {...commonProps} buildingName={buildingType || "Palace Complex"} variant="persian" />;
      }
      if (era === HistoricalEra.MEDIEVAL) {
        return <CaliphCourtSymbol {...commonProps} buildingName={buildingType || "Diwan"} />;
      }
      if (era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
        return <CaliphCourtSymbol {...commonProps} buildingName={buildingType || "Court of the Pasha"} variant="ottoman" />;
      }
      if (era === HistoricalEra.INDUSTRIAL_ERA) {
        return <ColonialOfficeSymbol {...commonProps} buildingName={buildingType || "Colonial Administration"} />;
      }
      if (era === HistoricalEra.MODERN_ERA) {
        return <AdminCenterSymbol {...commonProps} buildingName={buildingType || "Ministry Building"} variant="modern" />;
      }
    }
    
    else if (zone === "East Asia") {
      if (era === HistoricalEra.ANTIQUITY) {
        return <MandateHallSymbol {...commonProps} buildingName={buildingType || "Commandery Office"} />;
      }
      if (era === HistoricalEra.MEDIEVAL) {
        // Use Shogunate for Japan, Mandate Hall for China
        const isJapan = tile.cityName?.toLowerCase().includes('kyoto') ||
                       tile.cityName?.toLowerCase().includes('edo') ||
                       tile.cityName?.toLowerCase().includes('osaka') ||
                       tile.region?.toLowerCase().includes('japan');
        if (isJapan) {
          return <ShogunateSymbol {...commonProps} buildingName={buildingType || "Bakufu"} />;
        }
        return <MandateHallSymbol {...commonProps} buildingName={buildingType || "Prefecture Hall"} />;
      }
      if (era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
        return <MandateHallSymbol {...commonProps} buildingName={buildingType || "Magistrate's Yamen"} />;
      }
      if (era === HistoricalEra.INDUSTRIAL_ERA) {
        return <ColonialOfficeSymbol {...commonProps} buildingName={buildingType || "Treaty Port Office"} variant="eastern" />;
      }
      if (era === HistoricalEra.MODERN_ERA) {
        return <AdminCenterSymbol {...commonProps} buildingName={buildingType || "People's Government Building"} variant="communist" />;
      }
    }
    
    else if (zone === "North America" || zone === "South America") {
      if (era === HistoricalEra.PREHISTORY) {
        return <TribalCouncilSymbol {...commonProps} buildingName={buildingType || "Council Lodge"} />;
      }
      if (era === HistoricalEra.ANTIQUITY || era === HistoricalEra.MEDIEVAL) {
        // Use Aztec Palace for Mesoamerica
        const isMesoamerica = tile.cityName?.toLowerCase().includes('tenochtitlan') ||
                             tile.cityName?.toLowerCase().includes('mexico') ||
                             tile.region?.toLowerCase().includes('mexico') ||
                             tile.region?.toLowerCase().includes('maya') ||
                             tile.region?.toLowerCase().includes('aztec');
        if (isMesoamerica) {
          return <AztecPalaceSymbol {...commonProps} buildingName={buildingType || "Tecpan"} />;
        }
        return <TribalCouncilSymbol {...commonProps} buildingName={buildingType || "Great Council House"} variant="advanced" />;
      }
      if (era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
        return <ColonialOfficeSymbol {...commonProps} buildingName={buildingType || "Colonial Government"} />;
      }
      if (era === HistoricalEra.INDUSTRIAL_ERA) {
        return <CityHallSymbol {...commonProps} buildingName={buildingType || "Town Hall"} variant="colonial" />;
      }
      if (era === HistoricalEra.MODERN_ERA) {
        return <AdminCenterSymbol {...commonProps} buildingName={buildingType || "Municipal Building"} />;
      }
    }
    
    else if (zone === "Sub Saharan Africa") {
      if (era === HistoricalEra.PREHISTORY || era === HistoricalEra.ANTIQUITY) {
        return <TribalCouncilSymbol {...commonProps} buildingName={buildingType || "Chief's Compound"} variant="african" />;
      }
      if (era === HistoricalEra.MEDIEVAL) {
        return <TribalCouncilSymbol {...commonProps} buildingName={buildingType || "Royal Palace"} variant="kingdom" />;
      }
      if (era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
        return <ColonialOfficeSymbol {...commonProps} buildingName={buildingType || "Trading Post Office"} variant="coastal" />;
      }
      if (era === HistoricalEra.INDUSTRIAL_ERA) {
        return <ColonialOfficeSymbol {...commonProps} buildingName={buildingType || "Colonial Administration"} />;
      }
      if (era === HistoricalEra.MODERN_ERA) {
        return <AdminCenterSymbol {...commonProps} buildingName={buildingType || "District Office"} />;
      }
    }
    
    else if (zone === "South Asia") {
      if (era === HistoricalEra.ANTIQUITY) {
        return <MandateHallSymbol {...commonProps} buildingName={buildingType || "Raja's Court"} variant="indian" />;
      }
      if (era === HistoricalEra.MEDIEVAL) {
        return <CaliphCourtSymbol {...commonProps} buildingName={buildingType || "Sultan's Diwan"} variant="mughal" />;
      }
      if (era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
        return <CaliphCourtSymbol {...commonProps} buildingName={buildingType || "Mughal Court"} variant="mughal" />;
      }
      if (era === HistoricalEra.INDUSTRIAL_ERA) {
        return <ColonialOfficeSymbol {...commonProps} buildingName={buildingType || "British Residency"} variant="raj" />;
      }
      if (era === HistoricalEra.MODERN_ERA) {
        return <AdminCenterSymbol {...commonProps} buildingName={buildingType || "Collectorate"} />;
      }
    }
    
    else if (zone === "Oceania") {
      if (era === HistoricalEra.PREHISTORY || era === HistoricalEra.ANTIQUITY || era === HistoricalEra.MEDIEVAL) {
        return <OceanianMeetingHouseSymbol {...commonProps} buildingName={buildingType || "Fale Fono"} />;
      }
      if (era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
        return <ColonialOfficeSymbol {...commonProps} buildingName={buildingType || "Mission Station"} variant="pacific" />;
      }
      if (era === HistoricalEra.INDUSTRIAL_ERA) {
        return <ColonialOfficeSymbol {...commonProps} buildingName={buildingType || "Colonial Office"} variant="australian" />;
      }
      if (era === HistoricalEra.MODERN_ERA) {
        return <AdminCenterSymbol {...commonProps} buildingName={buildingType || "Council Chambers"} />;
      }
    }

    // Fallback to European medieval
    return <FeudalHallSymbol {...commonProps} buildingName={buildingType || "Government Hall"} />;
  };

  // Government building lighting effects (less elaborate than palaces)
  const renderGovernmentLights = () => {
    if (nightIntensity < 0.3) return null;
    
    const lights = [];
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    
    // Moderate lighting - governmental but not as grand as palaces
    const numLights = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numLights; i++) {
      const angle = (i / numLights) * Math.PI * 2;
      const radius = size * 0.25;
      const lightX = centerX + Math.cos(angle) * radius;
      const lightY = centerY + Math.sin(angle) * radius;
      
      lights.push(
        <g key={`gov-light-${i}`}>
          {/* Government torch/lamp glow */}
          <circle
            cx={lightX}
            cy={lightY}
            r={size * 0.12}
            fill="rgba(255, 200, 80, 0.35)"
            opacity={nightIntensity}
            filter="blur(4px)"
          />
          {/* Center */}
          <circle
            cx={lightX}
            cy={lightY}
            r={size * 0.06}
            fill="rgba(255, 210, 140, 0.8)"
            opacity={nightIntensity}
          />
        </g>
      );
    }
    
    return <g opacity={nightIntensity * 0.8}>{lights}</g>;
  };

  return (
    <g>
      {renderGovernmentBuilding()}
      {renderGovernmentLights()}
    </g>
  );
};

export default React.memo(GovernmentDistrictSymbol);