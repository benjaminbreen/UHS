import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { handleWorldWeaver } from "./server/node-handler";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "world-weaver-local-api",
      configureServer(server) {
        const env = loadEnv(server.config.mode, process.cwd(), "");
        for (const key of [
          "GEMINI_API_KEY",
          "UHS_WORLD_WEAVER_ENABLED",
          "UHS_CLASSROOM_CODE",
          "UHS_WORLD_WEAVER_ACCESS_CODE",
          "UHS_WORLD_WEAVER_MODEL",
        ])
          if (env[key] && !process.env[key]) process.env[key] = env[key];
        server.middlewares.use("/api/world-weaver", (req, res) => {
          void handleWorldWeaver(req, res);
        });
      },
    },
  ],
  build: {
    rollupOptions: { output: { manualChunks: { phaser: ["phaser"] } } },
  },
  // PORT lets a second dev server run alongside the default one.
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: !process.env.PORT,
  },
});
