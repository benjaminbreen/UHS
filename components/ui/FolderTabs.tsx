/**
 * components/ui/FolderTabs.tsx
 * Unified folder-style tab component for modals
 * Clean, elegant folder tabs with proper visual hierarchy
 */

import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface FolderTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

/**
 * FolderTabs - A clean folder-style tab bar
 *
 * Features:
 * - Proper folder visual metaphor (active tab "pops up")
 * - Clear visual hierarchy between active/inactive
 * - Responsive sizing
 * - Accessible keyboard navigation
 */
export const FolderTabs: React.FC<FolderTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}) => {
  return (
    <div
      className={`folder-tabs-container ${className}`}
      role="tablist"
      aria-label="Content tabs"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            className={`folder-tab ${isActive ? 'folder-tab-active' : 'folder-tab-inactive'}`}
          >
            <Icon className="folder-tab-icon" aria-hidden="true" />
            <span className="folder-tab-label">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

/**
 * Single FolderTab component for cases where you need more control
 */
export const FolderTab: React.FC<{
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}> = ({ label, icon: Icon, active, onClick }) => (
  <button
    role="tab"
    aria-selected={active}
    tabIndex={active ? 0 : -1}
    onClick={onClick}
    className={`folder-tab ${active ? 'folder-tab-active' : 'folder-tab-inactive'}`}
  >
    <Icon className="folder-tab-icon" aria-hidden="true" />
    <span className="folder-tab-label">{label}</span>
  </button>
);

export default FolderTabs;
