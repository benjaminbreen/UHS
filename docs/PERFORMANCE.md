# Performance

Where the expensive work happens, how it is kept off the main thread, and how
to measure. Measure before optimising, and never assert wall-clock timings in
tests.

## How load and play stay fast

- **World preparation runs in a worker.**
  - `src/runtime/preparation.ts` prepares a new world in a cancellable worker.
  - `src/world/v3/prepared.ts` defines the structured-clone geometry it hands
    back. That geometry is a cache, not a save format. Bump `PREPARED_VERSION`
    when its shape or content changes.
  - `src/runtime/prepared-store.ts` caches it.
  - In a build, the worker is a chunk of the app (`src/runtime/world-worker.ts`
    and its plugin in `vite.config.ts`), so it shares the page's geography and
    model chunks instead of downloading its own copy.
  - The worker answers a `hello` once its modules have loaded. Only then
    does it get its job and the scene art start downloading, so the two do
    not share the connection. A start cancelled before that keeps the
    loading worker for the next one.
  - On desktop, `src/runtime/terrain-worker-owner.ts` hands the warmed worker to
    the terrain stream. On phones it terminates after preparation, and terrain
    rasters time-sliced on the main thread (`workerBudget() === 0`) rather than
    holding a second copy of the world and module graph in a worker.
  - On phones, the splash screen skips speculative background world preparation
    and defers loading the session and scene chunks until the preparation worker
    terminates, so the tab never holds two copies of the world generator at once.
  - For a first start, `warmTerrainPool` starts the rest of the terrain pool
    as soon as the world exists, and every terrain worker works out the ground
    around the door while the scene boots. The scene adopts those workers
    instead of growing cold ones.
- **Job assignment** counts occupied workplace slots once per resident selection,
  then reuses the vacancies across eligible trades. Counts are refreshed for the
  next resident so workplace capacity and household-only jobs stay accurate.
- **Map exits** finish in the background on a fresh connected start. The desktop
  preparation worker sends each crossing to the live world. Phones use short
  slices of the same search on the live map. A nearby border or a walking
  destination near the edge gets priority. Later maps prepared for a crossing
  include their routes on arrival. Each search starts at a preferred crossing
  and works toward the spawn.
  Only a failed search triggers whole-map reachability discovery; its terrain
  and obstacle lookups are shared across exits. Collision and slope checks
  leave cosmetic ground wear for the first detailed sample of each cell. A
  route to the map edge can cross a forest without surveying 25 cells
  for tree cover around every step. The prepared world carries cached
  terrain within 32 tiles of the spawn. Distant cells used to find the
  exits can be regenerated when the player reaches them.
- **Terrain chunks own their resources.** `src/render/resources.ts` records
  each chunk's objects and textures, and `releaseTexture` / `releaseCanvas`
  zero non-pooled backing canvases so WebKit releases native surfaces right
  away. `src/runtime/device.ts` caps the terrain worker pool at zero on a phone
  (time-sliced on the main thread) and up to three on desktop.
- **Shared geography and building tables.** Earth coastlines, rivers and
  buckets (`src/world/geography/atlas.ts`), climate runs (`climate-map.ts`),
  and ecoregions (`ecoregions.ts`) pack into flat typed arrays and clear their
  parsed JSON arrays at import. `src/content/graphics/models.ts` indexes
  `models.generated.json` lazily from raw text and parses models on first
  access. `scripts/prepare-atlas-index.mjs` precomputes the land-mask index, so
  the runtime decodes it instead of scanning polygons.
- **The minimap** (`src/ui/Minimap.tsx`) keeps a padded terrain canvas and
  crops it as the player moves.
- **Drawing** covers the viewport plus a margin, not the observation radius.
  Drawing never activates simulation content.
- **NPC step timing.** `src/render/entity-presentation.ts` staggers NPC steps
  with seeded offsets. This is presentation only, with no timers in the
  simulation.
- **Saves** are coalesced to at most one per 500 ms during continuous input,
  with a flush when the page is hidden.
- **Canvases** whose pixels are read back (character frames, shadows) are
  created with `willReadFrequently`.
- **Lab routes** are chosen in `src/main.tsx` before the game bootstrap loads,
  and the Audio Lab is lazy.

## Phone memory

iOS Safari kills the tab, with no error, when it passes its memory budget.
`src/runtime/vitals.ts` writes a snapshot to `localStorage` every two seconds,
so the next load can say what the dead session held. Add `?vitals=1` for an
on-screen readout, or read `window.__vitals.now()` and `.last()` from a remote
inspector.

Chrome at phone size (`isMobile`, scale 3) holds roughly 180–200 MB of live V8
heap in play (down from ~400 MB when a terrain worker held a second copy of the
world and the atlas/model JSONs were kept parsed), plus decoded textures (~130–145 MB)
and GPU buffers. `getHeapUsage` sees only V8; take a
`disabled-by-default-memory-infra` dump (or `vmmap -summary` on macOS WebKit) to
see the rest.

- **Music notes** are float PCM, 0.8–1.2 MB each. `src/audio/synth.ts` stores
  each as it arrives, detaches the worker's copy, and on a phone keeps only
  the current and previous score's notes. Before that, ArrayBuffer garbage
  from score changes alone reached hundreds of megabytes.
- **h3-js** reserves 32 MB at import; `vite.config.ts` starts it at 8 MB.
- **Terrain chunks** on a phone raster inline without a duplicate terrain
  worker, skip bank shadow buffers/cells, and are kept half a chunk past the
  wanted ring rather than a chunk and a half.
- **Pixel textures over CanvasTextures**: living water layers, full-chunk
  ground pages, window glows/halos, grounded rock/mangrove overlays, fauna
  coat swaps, and phone character frames and shop signs upload directly via
  `addPixelTexture` (`addUint8Array`) instead of triple-buffered
  `CanvasTexture`s. On phones, building wear overlays, puddle reflection masks,
  and water reflections are skipped, and sculpted portraits cap their base
  cache at 16 and terminate their worker when idle.
- **No background world prefetch on phones**: `MapTravel.observe` skips
  speculative border staging and cross-border NPC gathering trips on phones so
  a second `world-worker` and `SettlementWorld` are never allocated while
  playing; neighboring maps still load on demand when the player crosses a
  border or takes a voyage, and `visited` is capped at 4 snapshots.
- **Decoded textures**: large building, fauna, harbor, and conveyance sheets
  are paged into 1024px pages (`scripts/art/page_sheets.py`) so a town decodes
  only the pages it draws. Startup preloads buildings near the player. The
  page indexes store cut rectangles, pivots and trim offsets as numbers.
  Phaser expands the frame records when it loads each page, and
  `WorldScene.pruneLazySheets` evicts unused lazy pages on phones.
  Never scale a CSS sprite sheet's `backgroundSize`: it makes
  the browser rasterise the whole sheet at that size.
- **GPU buffers**: the game disables Phaser's unused Pre FX pipeline. Its
  default pool allocates three color and depth targets per size at boot,
  including three the size of the game canvas. The camera's night grade
  and tilt shift use post-processing instead.

## Measuring

```sh
npm run build && npm run preview -- --port 4173
npm run measure:performance -- sample-name
```

- `PERF_FIRST_STEP=1 PERF_WORLD="A gatherer in Acapulco, 1039 BCE"` measures the Begin click through the first keyboard move that changes the player’s position. It dismisses the opening card as soon as it can and records a screenshot. On desktop it also counts finished crossings at that step.
- `PERF_URL` changes the server.
- `PERF_PROFILE=1` writes Chrome CPU profiles.
- `PERF_MEMORY=1 PERF_MOBILE=1 PERF_WORLD="A baker in Paris, 1400 CE"` samples
  phone-sized memory.
- `PERF_CARD_MS` and `PERF_IDLE_MS` change the holds.

The harness measures selection-to-visible-terrain time, long main-thread tasks,
360 frames and 40 movement commands. Run nothing else in the browser while it
samples. It is a local benchmark, not a guarantee for phones or the network.
`scripts/capture-benchmark.ts` covers screenshot timing.

## Rules of thumb

- **Profile first.** No ECS, renderer rewrite or generic event bus without
  profile evidence that the cost is there. The last real hotspot was a pixel
  readback, not architecture.
- **Check importers before deleting a compatibility path.** v3 and the labs
  still import some shared code from older paths. The labs are authoring
  tools: keep them, but keep them out of the game's entry chunk.
