/**
 * components/mobile/MobileHeader.tsx
 * Compact header for mobile displaying date, location, and player name
 */
import React, { useState, useCallback } from 'react';
import { PlayerCharacter } from '../../types';

interface MobileHeaderProps {
  currentDate: number;
  location: string;
  player: PlayerCharacter | null;
  onMenuClick?: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ 
  currentDate, 
  location, 
  player,
  onMenuClick 
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const formatDate = (date: number): string => {
    if (date < 0) {
      return `${Math.abs(date)} BCE`;
    }
    return `${date} CE`;
  };
  
  const handleTap = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded]);
  
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    paddingTop: 'env(safe-area-inset-top)',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(10px)',
    webkitBackdropFilter: 'blur(10px)',
    zIndex: 1100,
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'height 0.3s ease',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  };
  
  const mainBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    minHeight: '40px',
  };
  
  const infoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
    overflow: 'hidden',
  };
  
  const menuButtonStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '18px',
    cursor: 'pointer',
  };
  
  const expandedStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    display: expanded ? 'grid' : 'none',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    fontSize: '12px',
  };
  
  const statStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
  };
  
  const statValueStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.9)',
  };
  
  const separatorStyle: React.CSSProperties = {
    color: 'rgba(255, 255, 255, 0.3)',
    margin: '0 4px',
  };
  
  return (
    <div style={containerStyle}>
      <div style={mainBarStyle}>
        <div style={infoStyle} onClick={handleTap}>
          <span>{formatDate(currentDate)}</span>
          <span style={separatorStyle}>•</span>
          <span>{location}</span>
          <span style={separatorStyle}>•</span>
          <span>{player?.name || 'Unknown'}</span>
          {expanded ? ' ▲' : ' ▼'}
        </div>
        <button 
          style={menuButtonStyle}
          onClick={onMenuClick}
          aria-label="Menu"
        >
          ☰
        </button>
      </div>
      
      {player && (
        <div style={expandedStyle}>
          <div style={statStyle}>
            <span style={statValueStyle}>❤️ {player.currentHealth}</span>
            <span>Health</span>
          </div>
          <div style={statStyle}>
            <span style={statValueStyle}>🍖 {player.currentFood}</span>
            <span>Food</span>
          </div>
          <div style={statStyle}>
            <span style={statValueStyle}>💰 {(player.gold || 0).toFixed(0)}</span>
            <span>Gold</span>
          </div>
          <div style={statStyle}>
            <span style={statValueStyle}>⚡ {player.currentEnergy}</span>
            <span>Energy</span>
          </div>
          <div style={statStyle}>
            <span style={statValueStyle}>🛡️ {player.defenseRating}</span>
            <span>Defense</span>
          </div>
          <div style={statStyle}>
            <span style={statValueStyle}>🎯 {player.reputation}</span>
            <span>Rep</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MobileHeader);