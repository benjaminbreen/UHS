/**
 * Theme Service - Manages light/dark mode switching
 */

export type Theme = 'light' | 'dark';

export class ThemeService {
  private static instance: ThemeService;
  private currentTheme: Theme = 'dark';
  private listeners: ((theme: Theme) => void)[] = [];

  private constructor() {
    this.initializeTheme();
  }

  static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }

  /**
   * Initialize theme on app startup
   */
  initializeTheme(): void {
    const saved = localStorage.getItem('theme') as Theme;

    // Default to dark mode unless explicitly set to light
    const shouldUseDark = saved ? saved === 'dark' : (saved !== 'light'); // Default to dark if no saved preference

    this.currentTheme = shouldUseDark ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const newTheme: Theme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Set a specific theme
   */
  setTheme(theme: Theme): void {
    this.currentTheme = theme;
    this.applyTheme(theme);
    localStorage.setItem('theme', theme);
    this.notifyListeners(theme);
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Check if current theme is dark
   */
  isDarkMode(): boolean {
    return this.currentTheme === 'dark';
  }

  /**
   * Subscribe to theme changes
   */
  subscribe(callback: (theme: Theme) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Apply theme to DOM
   */
  private applyTheme(theme: Theme): void {
    const html = document.documentElement;

    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }

  /**
   * Notify all listeners of theme change
   */
  private notifyListeners(theme: Theme): void {
    this.listeners.forEach(callback => callback(theme));
  }
}

// Export singleton instance
export const themeService = ThemeService.getInstance();