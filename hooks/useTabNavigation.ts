/**
 * useTabNavigation - Hook for accessible tab navigation with arrow keys
 *
 * Implements ARIA Authoring Practices for tab components:
 * - Left/Right arrow keys navigate between tabs
 * - Home/End keys jump to first/last tab
 * - Automatic focus management
 * - Works with any tab state
 *
 * Usage:
 * ```tsx
 * const tabs = ['overview', 'stats', 'inventory'];
 * const [activeTab, setActiveTab] = useState('overview');
 *
 * const tabRefs = useTabNavigation({
 *   tabs,
 *   activeTab,
 *   onChange: setActiveTab,
 *   enabled: isModalOpen
 * });
 *
 * // In your JSX:
 * <button ref={el => tabRefs.current[0] = el}>Overview</button>
 * <button ref={el => tabRefs.current[1] = el}>Stats</button>
 * ```
 */

import { useEffect, useRef, useCallback, MutableRefObject } from 'react';

interface UseTabNavigationOptions<T extends string> {
  /**
   * Array of tab identifiers in display order
   */
  tabs: T[];

  /**
   * Currently active tab
   */
  activeTab: T;

  /**
   * Called when tab should change
   */
  onChange: (tab: T) => void;

  /**
   * If false, keyboard navigation is disabled
   * @default true
   */
  enabled?: boolean;

  /**
   * If true, arrow keys wrap around (last tab → first tab)
   * @default true
   */
  loop?: boolean;

  /**
   * If true, automatically focus the active tab when it changes
   * @default false
   */
  autoFocus?: boolean;
}

/**
 * Hook for accessible tab navigation with arrow keys
 */
export const useTabNavigation = <T extends string>({
  tabs,
  activeTab,
  onChange,
  enabled = true,
  loop = true,
  autoFocus = false
}: UseTabNavigationOptions<T>): MutableRefObject<(HTMLElement | null)[]> => {

  // Store refs to all tab buttons for focus management
  const tabRefs = useRef<(HTMLElement | null)[]>([]);

  // Get current tab index
  const currentIndex = tabs.indexOf(activeTab);

  // Navigate to a specific tab by index
  const navigateToTab = useCallback((index: number) => {
    if (index >= 0 && index < tabs.length) {
      onChange(tabs[index]);

      // Focus the tab button if autoFocus is enabled
      if (autoFocus && tabRefs.current[index]) {
        tabRefs.current[index]?.focus();
      }
    }
  }, [tabs, onChange, autoFocus]);

  // Navigate to next tab
  const navigateNext = useCallback(() => {
    const nextIndex = currentIndex + 1;

    if (nextIndex < tabs.length) {
      navigateToTab(nextIndex);
    } else if (loop) {
      // Wrap to first tab
      navigateToTab(0);
    }
  }, [currentIndex, tabs.length, loop, navigateToTab]);

  // Navigate to previous tab
  const navigatePrevious = useCallback(() => {
    const prevIndex = currentIndex - 1;

    if (prevIndex >= 0) {
      navigateToTab(prevIndex);
    } else if (loop) {
      // Wrap to last tab
      navigateToTab(tabs.length - 1);
    }
  }, [currentIndex, tabs.length, loop, navigateToTab]);

  // Navigate to first tab
  const navigateFirst = useCallback(() => {
    navigateToTab(0);
  }, [navigateToTab]);

  // Navigate to last tab
  const navigateLast = useCallback(() => {
    navigateToTab(tabs.length - 1);
  }, [tabs.length, navigateToTab]);

  // Handle keyboard events
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if focus is on a tab button
      const focusedElement = document.activeElement;
      const isFocusedOnTab = tabRefs.current.some(ref => ref === focusedElement);

      if (!isFocusedOnTab) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          navigatePrevious();
          break;

        case 'ArrowRight':
          event.preventDefault();
          navigateNext();
          break;

        case 'Home':
          event.preventDefault();
          navigateFirst();
          break;

        case 'End':
          event.preventDefault();
          navigateLast();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, navigateNext, navigatePrevious, navigateFirst, navigateLast]);

  return tabRefs;
};

/**
 * Utility hook for simple tab navigation (no ref management needed)
 *
 * Use this when you don't need focus management, just keyboard navigation
 *
 * Usage:
 * ```tsx
 * const tabs = ['overview', 'stats', 'inventory'];
 * const [activeTab, setActiveTab] = useState('overview');
 *
 * useSimpleTabNavigation({
 *   tabs,
 *   activeTab,
 *   onChange: setActiveTab
 * });
 * ```
 */
export const useSimpleTabNavigation = <T extends string>({
  tabs,
  activeTab,
  onChange,
  enabled = true,
  loop = true
}: Omit<UseTabNavigationOptions<T>, 'autoFocus'>): void => {

  const currentIndex = tabs.indexOf(activeTab);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle if typing in an input
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      let newIndex: number | null = null;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          newIndex = currentIndex - 1;
          if (newIndex < 0) {
            newIndex = loop ? tabs.length - 1 : 0;
          }
          break;

        case 'ArrowRight':
          event.preventDefault();
          newIndex = currentIndex + 1;
          if (newIndex >= tabs.length) {
            newIndex = loop ? 0 : tabs.length - 1;
          }
          break;

        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;

        case 'End':
          event.preventDefault();
          newIndex = tabs.length - 1;
          break;
      }

      if (newIndex !== null && newIndex !== currentIndex) {
        onChange(tabs[newIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [tabs, activeTab, currentIndex, onChange, enabled, loop]);
};
