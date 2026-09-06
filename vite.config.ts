import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: { output: { manualChunks: { phaser: ["phaser"] } } },
  },
  server: { port: 5173, strictPort: true },
});
