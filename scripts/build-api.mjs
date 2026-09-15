// Vercel compiles api/*.ts file by file and never follows the extensionless
// imports into server/, so the functions crash on ERR_MODULE_NOT_FOUND.
// Bundling each entry gives the api file one resolvable specifier to import.
import { build } from "esbuild";

await build({
  entryPoints: ["server/dialogue.ts", "server/narrator.ts", "server/world-weaver.ts"],
  outdir: "server/dist",
  outExtension: { ".js": ".mjs" },
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  packages: "external",
});
