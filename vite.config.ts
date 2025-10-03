import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],

    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },

    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : []
    },

    build: {
      target: 'es2020',
      minify: 'esbuild',
      cssCodeSplit: true,

      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // CRITICAL: Keep enums.ts separate to avoid circular dependency issues
            if (id.includes('/types/enums.ts')) {
              return 'types-enums';
            }

            // Vendor chunks - group by library
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('three') || id.includes('@react-three')) {
                return 'vendor-3d';
              }
              if (id.includes('d3') || id.includes('topojson')) {
                return 'vendor-viz';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-animation';
              }
              return 'vendor-other';
            }

            // Data chunks - lazy load by category
            if (id.includes('/constants/gameData/')) {
              if (id.includes('factions/')) {
                // Extract zone name from path: /factions/european.ts → faction-european
                const match = id.match(/factions\/(\w+)\.ts$/);
                if (match) return `data-faction-${match[1]}`;
                return 'data-factions';
              }
              if (id.includes('cities')) return 'data-cities';
              if (id.includes('beliefs')) return 'data-beliefs';
              if (id.includes('geography')) return 'data-geography';
              if (id.includes('diseases')) return 'data-diseases';
              return 'data-game';
            }

            // Component chunks - group by type
            if (id.includes('/components/')) {
              if (id.includes('Modal.tsx') && !id.includes('ModalHub')) {
                // Extract modal name: CharacterProfileModal.tsx → modal-character-profile
                const match = id.match(/(\w+)Modal\.tsx$/);
                if (match) {
                  const name = match[1].replace(/([A-Z])/g, '-$1').toLowerCase().slice(1);
                  return `modal-${name}`;
                }
                return 'modals';
              }
              if (id.includes('/portraits/')) return 'portraits';
              if (id.includes('/symbols/')) return 'symbols';
              return 'components';
            }

            // Service chunks
            if (id.includes('/services/')) {
              if (id.includes('worldWeaver')) return 'service-world-weaver';
              if (id.includes('faction') || id.includes('economy')) return 'service-economy';
              return 'services';
            }

            // Generation chunks
            if (id.includes('/generation/')) {
              return 'generation';
            }
          },

          // Optimize chunk sizes
          chunkFileNames: (chunkInfo) => {
            return 'assets/[name]-[hash].js';
          },
        }
      },

      // Increase chunk size warning threshold (we've split intelligently)
      chunkSizeWarningLimit: 800, // 800KB per chunk is acceptable
    },

    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom'
      ],
      exclude: [
        '@google/genai',  // Only used in WorldWeaver - lazy load
      ]
    },
  };
});
