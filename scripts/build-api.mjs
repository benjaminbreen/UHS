// Vercel compiles api/*.ts one file at a time and never follows the
// imports into server/, so the functions crash on ERR_MODULE_NOT_FOUND.
// Bundling each entry gives the api file one resolvable specifier to import.
import { existsSync, readFileSync } from "node:fs";
import { build } from "esbuild";

const indexHtml = existsSync("dist/index.html")
  ? readFileSync("dist/index.html", "utf8")
  : readFileSync("index.html", "utf8");

await build({
  entryPoints: ["server/node-handler.ts"],
  outdir: "server/dist",
  outExtension: { ".js": ".mjs" },
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  packages: "external",
  define: {
    __UHS_INDEX_HTML__: JSON.stringify(indexHtml),
  },
});
