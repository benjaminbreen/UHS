// Vercel compiles api/*.ts one file at a time and never follows the
// imports into server/, so the functions crash on ERR_MODULE_NOT_FOUND.
// Bundling each entry gives the api file one resolvable specifier to import.
import { build } from "esbuild";

await build({
  entryPoints: ["server/node-handler.ts"],
  outdir: "server/dist",
  outExtension: { ".js": ".mjs" },
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  packages: "external",
});
