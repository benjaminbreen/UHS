import type { Config } from 'tailwindcss';
import { defineConfig } from 'tailwindcss';

export default defineConfig({
  content: [
    './index.html',
    './App.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './contexts/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
    './workers/**/*.{ts,tsx}',
    './api/**/*.{ts,tsx}',
    './gameTypes/**/*.{ts,tsx}',
    './generation/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './types/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          card: 'var(--surface-card-bg)',
          muted: 'var(--surface-muted-bg)',
          popover: 'var(--surface-tooltip-bg)',
          overlay: 'var(--surface-modal-overlay-bg)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          muted: 'var(--text-muted)',
        },
        accent: {
          DEFAULT: 'var(--accent-primary)',
          hover: 'var(--accent-primary-hover)',
          active: 'var(--accent-primary-active)',
        },
        surface: {
          card: 'var(--surface-card-bg)',
          muted: 'var(--surface-muted-bg)',
          track: 'var(--surface-track-bg)',
          tooltip: 'var(--surface-tooltip-bg)',
        },
      },
      borderColor: {
        surface: {
          card: 'var(--surface-card-border)',
          muted: 'var(--surface-muted-border)',
        },
      },
      boxShadow: {
        'surface-card': 'var(--surface-card-shadow)',
      },
    },
  },
  safelist: [{ pattern: /(bg|text|border|ring)-(slate|gray|stone|neutral|zinc|amber|yellow|orange|red|rose|pink|purple|violet|indigo|blue|sky|cyan|teal|emerald|green|lime|white|black)(-[0-9]{2,3})?(\/[0-9]{1,3})?/ }],
}) satisfies Config;
