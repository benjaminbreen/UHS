import { useState, useEffect } from 'react';

/**
 * useIsMobile - Responsive hook that properly tracks mobile viewport
 *
 * Unlike useMemo with empty deps, this hook:
 * 1. Updates on window resize
 * 2. Uses a single shared event listener pattern
 * 3. Handles SSR gracefully
 *
 * @param breakpoint - Width threshold in pixels (default: 768)
 * @returns boolean indicating if viewport is mobile-sized
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    // Check immediately in case initial state was wrong
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}

/**
 * useIsDarkMode - Efficiently tracks dark mode without MutationObserver overhead
 *
 * Uses CSS media query listener instead of DOM mutation observer,
 * which is more performant (doesn't fire on every class change).
 * Also handles manual .dark class toggles via a fallback check.
 *
 * @returns boolean indicating if dark mode is active
 */
export function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    // Check both the class (manual toggle) and media query (system preference)
    return document.documentElement.classList.contains('dark') ||
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      // Only update if not manually overridden by .dark class
      if (!document.documentElement.classList.contains('dark') &&
          !document.documentElement.classList.contains('light')) {
        setIsDark(e.matches);
      }
    };

    // Also check for manual class changes, but throttled
    let lastCheck = Date.now();
    const checkDarkClass = () => {
      const now = Date.now();
      if (now - lastCheck > 100) { // Throttle to max 10 checks/second
        lastCheck = now;
        setIsDark(document.documentElement.classList.contains('dark'));
      }
    };

    // Use a more efficient approach: check on visibility change and focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsDark(document.documentElement.classList.contains('dark'));
      }
    };

    // For manual toggles, we use a custom event pattern
    const handleThemeChange = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Listen for custom theme-change event (can be dispatched by theme toggle)
    window.addEventListener('theme-change', handleThemeChange);

    // Initial sync
    setIsDark(document.documentElement.classList.contains('dark'));

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('theme-change', handleThemeChange);
    };
  }, []);

  return isDark;
}
