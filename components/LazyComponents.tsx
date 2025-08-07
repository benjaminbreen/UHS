/**
 * components/LazyComponents.tsx - Lazy-loaded components for code splitting
 * Implements React.lazy for heavy components to reduce initial bundle size
 */

import React, { Suspense } from 'react';

// Lazy load heavy modal components
export const CharacterProfileModal = React.lazy(() => import('./CharacterProfileModal'));
export const CityModal = React.lazy(() => import('./CityModal'));
export const CombatModal = React.lazy(() => import('./CombatModal'));
export const CraftingModal = React.lazy(() => import('./CraftingModal'));
export const EncounterModal = React.lazy(() => import('./EncounterModal'));
export const LootModal = React.lazy(() => import('./LootModal'));
export const MarketplaceModal = React.lazy(() => import('./MarketplaceModal'));
export const SkillsModal = React.lazy(() => import('./SkillsModal'));
export const VictoryModal = React.lazy(() => import('./VictoryModal'));
export const WorldMapModal = React.lazy(() => import('./WorldMapModal'));
export const SettingsPanel = React.lazy(() => import('./SettingsPanel'));

// Loading component for suspense fallback
const ModalLoading: React.FC = () => (
  <div className="loading-modal-backdrop">
    <div className="loading-modal">
      <div className="loading-spinner"></div>
      <p>Loading...</p>
    </div>
  </div>
);

// Higher-order component to wrap lazy components with suspense
function withSuspense<P extends object>(Component: React.ComponentType<P>) {
  return function WrappedComponent(props: P) {
    return (
      <Suspense fallback={<ModalLoading />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Export wrapped components
export const LazyCharacterProfileModal = withSuspense(CharacterProfileModal);
export const LazyCityModal = withSuspense(CityModal);
export const LazyCombatModal = withSuspense(CombatModal);
export const LazyCraftingModal = withSuspense(CraftingModal);
export const LazyEncounterModal = withSuspense(EncounterModal);
export const LazyLootModal = withSuspense(LootModal);
export const LazyMarketplaceModal = withSuspense(MarketplaceModal);
export const LazySkillsModal = withSuspense(SkillsModal);
export const LazyVictoryModal = withSuspense(VictoryModal);
export const LazyWorldMapModal = withSuspense(WorldMapModal);
export const LazySettingsPanel = withSuspense(SettingsPanel);