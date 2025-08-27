/**
 * components/mobile/MobileQuickStats.tsx
 * Quick stats bar for mobile showing health, food, gold
 */
import React from 'react';
import { PlayerCharacter } from '../../types';

interface MobileQuickStatsProps {
  player: PlayerCharacter | null;
  onStatClick?: (stat: string) => void;
}

const MobileQuickStats: React.FC<MobileQuickStatsProps> = ({ player, onStatClick }) => {
  if (!player) return null;
  
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    left: '0',
    right: '0',
    bottom: 'calc(env(safe-area-inset-bottom) + 160px)', // Above D-pad
    height: '60px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '0 20px',
    zIndex: 999,
    userSelect: 'none',
    WebkitUserSelect: 'none',
  };
  
  const statStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
  };
  
  const statValueStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.95)',
  };
  
  const statLabelStyle: React.CSSProperties = {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };
  
  const getHealthColor = (health: number, maxHealth: number) => {
    const ratio = health / maxHealth;
    if (ratio > 0.6) return '#4CAF50';
    if (ratio > 0.3) return '#FFC107';
    return '#F44336';
  };
  
  const getFoodColor = (food: number) => {
    if (food > 10) return '#4CAF50';
    if (food > 5) return '#FFC107';
    return '#F44336';
  };
  
  const stats = [
    {
      id: 'health',
      icon: '❤️',
      value: player.currentHealth,
      max: player.maxHealth,
      label: 'Health',
      color: getHealthColor(player.currentHealth, player.maxHealth)
    },
    {
      id: 'food',
      icon: '🍖',
      value: player.currentFood,
      max: 20,
      label: 'Food',
      color: getFoodColor(player.currentFood)
    },
    {
      id: 'gold',
      icon: '💰',
      value: Math.floor(player.gold),
      max: null,
      label: 'Gold',
      color: '#FFD700'
    },
    {
      id: 'energy',
      icon: '⚡',
      value: player.currentEnergy,
      max: player.maxEnergy,
      label: 'Energy',
      color: '#64B5F6'
    }
  ];
  
  return (
    <div style={containerStyle}>
      {stats.map(stat => (
        <div 
          key={stat.id}
          style={statStyle}
          onClick={() => onStatClick?.(stat.id)}
        >
          <div style={statValueStyle}>
            <span>{stat.icon}</span>
            <span style={{ color: stat.color }}>
              {stat.value}
              {stat.max && (
                <span style={{ 
                  fontSize: '12px', 
                  color: 'rgba(255, 255, 255, 0.5)' 
                }}>
                  /{stat.max}
                </span>
              )}
            </span>
          </div>
          <div style={statLabelStyle}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(MobileQuickStats);