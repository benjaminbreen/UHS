import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { handleTimeArrival, handleTaskLore, handleDialogue, handleNarrator, handleWorldWeaver, handleEdu, handleJev } from "./server/node-handler";
import { execFile } from "node:child_process";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
export default defineConfig({
  // Every worker is created with type "module", and the travel worker loads
  // its map names lazily, which a classic worker bundle cannot split.
  worker: { format: "es" },
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
          "OPENAI_API_KEY",
          "OPENROUTER_API_KEY",
          "UHS_HAIKU_MODEL",
          "DATABASE_URL",
          "UHS_EDU_CLASS_CODE",
          "UHS_EDU_TEACHER_TOKEN",
          "UHS_NARRATOR_ACCESS_CODE",
          "UHS_NARRATOR_OPENAI_MODEL",
          "UHS_NARRATOR_GEMINI_MODEL",
          "TYPESAFE_API_KEY",
        ])
          if (env[key] && !process.env[key]) process.env[key] = env[key];
        server.middlewares.use("/api/time-arrival", (req, res) => { void handleTimeArrival(req, res); });
        server.middlewares.use("/api/task-lore", (req, res) => { void handleTaskLore(req, res); });
        server.middlewares.use("/api/world-weaver", (req, res) => {
          void handleWorldWeaver(req, res);
        });
        server.middlewares.use("/api/narrator", (req, res) => {
          void handleNarrator(req, res);
        });
        server.middlewares.use("/api/dialogue", (req, res) => {
          void handleDialogue(req, res);
        });
        server.middlewares.use("/api/jev", (req, res) => { void handleJev(req, res); });
        server.middlewares.use("/api/edu", (req, res) => { void handleEdu(req, res); });
        // Dev only: the studio's ambience tab plays the reference recordings
        // that `npm run audio:ambience` fetched, and appends listening verdicts.
        server.middlewares.use("/api/audio-ref", (req, res) => {
          const name = path.basename(req.url ?? "");
          if (!/^[a-z-]+\.wav$/.test(name)) {
            res.statusCode = 400;
            return res.end();
          }
          readFile(path.resolve("artifacts/audio-ref", name)).then(
            (data) => {
              res.setHeader("content-type", "audio/wav");
              res.end(data);
            },
            () => {
              res.statusCode = 404;
              res.end();
            },
          );
        });
        server.middlewares.use("/api/audio-verdict", (req, res) => {
          if (req.method !== "POST") {
            res.statusCode = 405;
            return res.end();
          }
          let body = "";
          req.on("data", (c) => (body += c));
          req.on("end", async () => {
            try {
              const line = JSON.stringify({ ...JSON.parse(body), at: new Date().toISOString() });
              await mkdir("artifacts/audio-review", { recursive: true });
              await appendFile("artifacts/audio-review/verdicts.jsonl", line + "\n");
              res.end("{}");
            } catch {
              res.statusCode = 400;
              res.end();
            }
          });
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
                ".venv/bin/python",
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
  // Every JSON import is a default import, and the generated ones run to
  // megabytes. As a parsed string, not an object literal with an export per
  // key, the 8 MB building models no longer run the build out of heap.
  json: { namedExports: false, stringify: true },
  build: {
    rollupOptions: { output: { manualChunks: { phaser: ["phaser"] } } },
  },
  // PORT lets a second dev server run alongside the default one.
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: !process.env.PORT,
    // Other sessions' worktrees and review output would otherwise reload
    // every open game whenever they write a file.
    watch: { ignored: ["**/.claude/worktrees/**", "**/artifacts/**"] },
    // UHS_STILL=1 keeps an open game as it is while files change under it;
    // a manual reload still picks the changes up.
    hmr: process.env.UHS_STILL ? false : undefined,
  },
});
