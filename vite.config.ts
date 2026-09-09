import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { handleWorldWeaver } from "./server/node-handler";
import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";
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
        // Dev only: the building panel writes a recipe file and recompiles
        // the art. Paths are confined to the graphics content directory.
        server.middlewares.use("/api/art", (req, res) => {
          if (req.method !== "POST") {
            res.statusCode = 405;
            return res.end();
          }
          let body = "";
          req.on("data", (c) => (body += c));
          req.on("end", async () => {
            const reply = (code: number, data: unknown) => {
              res.statusCode = code;
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify(data));
            };
            try {
              const { path: rel, content } = JSON.parse(body);
              const dir = path.resolve("src/content/graphics");
              const target = path.resolve(rel);
              if (
                !target.startsWith(dir + path.sep) ||
                !target.endsWith(".json")
              )
                return reply(400, { ok: false, error: "Path not allowed" });
              JSON.parse(content);
              await writeFile(target, content);
              execFile(
                "python3",
                ["scripts/build_art.py"],
                { maxBuffer: 1 << 24 },
                (err, stdout, stderr) =>
                  reply(err ? 500 : 200, {
                    ok: !err,
                    error: err?.message,
                    output: stdout + stderr,
                  }),
              );
            } catch (e) {
              reply(400, { ok: false, error: String(e) });
            }
          });
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
