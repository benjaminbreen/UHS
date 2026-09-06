# Procedural Earth and World Weaver

Both ways of starting a world produce the same `WorldSetting`. The same TypeScript generator, simulation, save, and replay then run it. A model never draws tiles or supplies executable rules.

**New world → Procedural** recognizes bundled place names, common period words, dates, roles, and seasons. Try Elizabethan London, Hellenistic Alexandria, a Roman legionary in Umbria, a free Black farmer in 19th-century Haiti, or a Paleolithic shaman in Siberia. The place selector also works without a prompt. Period-only input chooses a representative place and shows the choice. Unknown input stays in the form so it can be revised. Explicit BCE/CE dates take precedence over period words. The numeric year field uses astronomical numbering: 0 is 1 BCE, −99 is 100 BCE.

The procedural path makes no model or geocoding requests. Once the application assets are loaded, play is local. Opening/reloading the website without an internet connection is not yet guaranteed: there is no service worker that installs the application offline.

**New world → World Weaver** sends the description to an optional server endpoint. It returns the same setting fields, including approximate coordinates for places outside the bundled catalog. The setting is saved in full, so continuing, exporting, importing, and replaying never requires another interpretation request. This implements model-assisted world creation; model dialogue and autonomous model-driven NPCs are separate future features.

## Classroom server

Copy `.env.example` to `.env.local`, then set:

```dotenv
UHS_WORLD_WEAVER_ENABLED=1
GEMINI_API_KEY=your-server-key
UHS_CLASSROOM_CODE=your-classroom-code
UHS_WORLD_WEAVER_MODEL=gemini-3.5-flash-lite
```

Restart `npm run dev`. The Vite development server serves `/api/world-weaver`; `api/world-weaver.ts` provides the equivalent Vercel serverless handler. Configure the same environment variables on the hosting server. A static-only host supports procedural mode but needs a separate compatible endpoint for World Weaver. API keys must never use the `VITE_` prefix. The classroom code is entered in the form and is not saved with the world.

The endpoint checks the access code, request size, and structured response. It has a 25-second provider timeout and two-request concurrency limit per server instance. Use provider project quotas to bound spending across server instances. The endpoint defaults to disabled. Tests inject a fake provider; no paid requests are needed for development or verification.

## How geography works

- **One coordinate field.** Coarse Earth coastlines, major river lines, simplified mountain belts, and broad climate fields establish the landscape. The world is compressed to 2,048 game tiles per degree; this is a game atlas, not a distance-preserving map projection. Existing local movement timing remains game scale.
- **Local composition.** A named setting supplies climate, relief, river/coast orientation, settlement form, and architecture. Near the start these shape a readable landscape, then blend into the broader atlas. London gets an east–west river; Alexandria gets open sea to the north. Procedural valleys lower the terrain around channels. Watercourses connect to atlas rivers where available; this is not a rainfall/catchment simulation.
- **Shared features.** Deterministic districts place settlements and connecting paths. Chunks only sample this world. Looking at a neighbor first cannot alter a coast, road, building ID, or river. Nearby districts instantiate residents and objects as the player moves; saves restore those same districts.
- **One map at several scales.** Local and regional views sample the same terrain. At larger scales the map samples the landscape directly; Earth view draws its source atlas. Interiors retain their own grid and stable doors.

The important contracts are a valid start, reachable doors, continuous shared features, stable IDs, and repeatable saves. Historical content is an editable input, not a prerequisite for generating a plausible landscape. No per-marsh citations or dated GIS correction pipeline is required.

## Extending it

`src/content/geography/places.ts` contains the featured anchors and aliases. `types.ts` defines the setting contract, `resolve.ts` interprets offline text, and `pack.ts` adapts that setting to existing content and art. `src/world/v2/landscape.ts` describes terrain; `generate.ts` handles settlement placement and chunk sampling. `server/world-weaver.ts` only interprets settings.

The bundled catalog combines featured settings, Natural Earth place coordinates, and original UHS area descriptions where a named coordinate could be matched. The old UHS adjacency graph is not used. Broad regional coordinates from that graph are deliberately not treated as individual place locations. Named coordinates and default ecology are approximate and can be overridden in the featured anchor table.

```sh
npm run prepare:atlas
npm run headless -- --prompt "Elizabethan London"
npx vitest run tests/world-v2.test.ts
npx playwright test tests/browser/world-v2.spec.ts
```

Atlas preparation uses Python's standard library, caches pinned public-domain Natural Earth inputs, and records checksums. Generated files ship with the application; players do not download GIS datasets. Source details are in `ASSET_PROVENANCE.md`.

New worlds have generator/atlas/schema version 2 and retain their resolved setting in the manifest. The original Roman and Neolithic worlds remain available with generator version 1, preserving existing recordings. Changes to v2's generator or data after release require another version or a migration rather than silently changing saved geography.

## Current scope

This is broad geographic generation using the existing early-build simulation. Regional art libraries, clothes, crop varieties, household inventories, and occupational behavior still need expansion; a recognized place name does not imply a bespoke city or economy. Architecture currently reuses classical, mudbrick, timber, courtyard, board, thatched-house, and simple shelter components. Prehistoric and seasonal settings affect initial terrain/content; ice sheets, sea-level histories, and an evolving hydrological simulation are not implemented.

Travel generates nearby content from the starting setting's palette; it does not yet change societies as the player crosses continents. Long-distance transport, ocean crossing, polar coverage above 85°, and dateline wrap remain outside this build. Terrain caches are bounded; explored actors and objects persist, so extremely long journeys still need entity streaming before population memory can plateau.
