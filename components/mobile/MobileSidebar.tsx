/**
 * components/mobile/MobileSidebar.tsx
 * Tabbed sidebar for mobile with swipeable content
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PlayerCharacter } from '../../types';

interface MobileSidebarProps {
  player: PlayerCharacter | null;
  isOpen: boolean;
  onClose: () => void;
  children?: {
    inventory?: React.ReactNode;
    character?: React.ReactNode;
    quests?: React.ReactNode;
    settings?: React.ReactNode;
  };
}

type TabId = 'inventory' | 'character' | 'quests' | 'settings';

const MobileSidebar: React.FC<MobileSidebarProps> = ({ 
  player, 
  isOpen, 
  onClose,
  children = {} 
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('inventory');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;
  
  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'inventory', label: 'Inventory', icon: '🎒' },
    { id: 'character', label: 'Character', icon: '👤' },
    { id: 'quests', label: 'Quests', icon: '📜' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];
  
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);
  
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);
  
  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      
      if (isRightSwipe && currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1].id);
      }
      
      if (isLeftSwipe && currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1].id);
      }
    }
  }, [touchStart, touchEnd, activeTab, tabs]);
  
  // Handle swipe down to close
  const handleSwipeDown = useCallback((e: React.TouchEvent) => {
    const startY = e.targetTouches[0].clientY;
    
    const handleMove = (e: TouchEvent) => {
      const currentY = e.targetTouches[0].clientY;
      const distance = currentY - startY;
      
      if (distance > 50) {
        onClose();
        document.removeEventListener('touchmove', handleMove);
      }
    };
    
    document.addEventListener('touchmove', handleMove);
    
    const handleEnd = () => {
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
    
    document.addEventListener('touchend', handleEnd);
  }, [onClose]);
  
  useEffect(() => {
    // Prevent body scroll when sidebar is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2000,
    display: isOpen ? 'block' : 'none',
  };
  
  const sidebarStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70vh',
    maxHeight: 'calc(100vh - env(safe-area-inset-top) - 60px)',
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    backdropFilter: 'blur(20px)',
    webkitBackdropFilter: 'blur(20px)',
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
    display: 'flex',
    flexDirection: 'column',
    transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 0.3s ease',
  };
  
  const handleStyle: React.CSSProperties = {
    width: '40px',
    height: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '2px',
    margin: '12px auto',
  };
  
  const tabBarStyle: React.CSSProperties = {
    display: 'flex',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '0 10px',
  };
  
  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'transparent',
    border: 'none',
    color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.5)',
    borderBottom: isActive ? '2px solid #4CAF50' : '2px solid transparent',
    marginBottom: '-1px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '10px',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  });
  
  const tabIconStyle: React.CSSProperties = {
    fontSize: '20px',
  };
  
  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: '16px',
    paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
  };
  
  const emptyStateStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '14px',
    gap: '8px',
  };
  
  const renderContent = () => {
    const content = children[activeTab];
    
    if (content) {
      return content;
    }
    
    // Default empty states
    const emptyStates = {
      inventory: (
        <div style={emptyStateStyle}>
          <span style={{ fontSize: '48px' }}>🎒</span>
          <span>Your inventory is empty</span>
        </div>
      ),
      character: (
        <div style={emptyStateStyle}>
          <span style={{ fontSize: '48px' }}>👤</span>
          <span>Character stats</span>
          {player && (
            <div style={{ marginTop: '20px', textAlign: 'left', color: 'rgba(255, 255, 255, 0.8)' }}>
              <div>Name: {player.name}</div>
              <div>Class: {player.characterClass}</div>
              <div>Level: {player.level || 1}</div>
              <div>XP: {player.experience || 0}</div>
            </div>
          )}
        </div>
      ),
      quests: (
        <div style={emptyStateStyle}>
          <span style={{ fontSize: '48px' }}>📜</span>
          <span>No active quests</span>
        </div>
      ),
      settings: (
        <div style={emptyStateStyle}>
          <span style={{ fontSize: '48px' }}>⚙️</span>
          <span>Settings</span>
        </div>
      )
    };
    
    return emptyStates[activeTab];
  };
  
  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div style={sidebarStyle}>
        <div 
          style={handleStyle}
          onTouchStart={handleSwipeDown}
        />
        
        <div style={tabBarStyle}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              style={tabStyle(activeTab === tab.id)}
              onClick={() => setActiveTab(tab.id)}
            >
              <span style={tabIconStyle}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        
        <div 
          ref={contentRef}
          style={contentStyle}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default React.memo(MobileSidebar);