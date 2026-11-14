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
  - On desktop, `src/runtime/terrain-worker-owner.ts` hands the warmed worker to
    the terrain stream. On phones it terminates, and terrain gets a fresh one.
- **Terrain chunks own their resources.** `src/render/resources.ts` records
  each chunk's objects and textures, so streaming never diffs the whole scene.
  `src/runtime/device.ts` caps the terrain worker pool, at two on a phone.
- **Shared geography.** It lives in `src/world/geography/`.
  `scripts/prepare-atlas-index.mjs` precomputes the land-mask index, so the
  runtime decodes it instead of scanning polygons.
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

The biggest costs are decoded textures: the shadow, civic, prop-shadow and
building sheets. They are already tightly packed, so cutting them means loading
fewer frames, not repacking. Never scale a CSS sprite sheet's
`backgroundSize`: it makes the browser rasterise the whole sheet at that size.

## Measuring

```sh
npm run build && npm run preview -- --port 4173
npm run measure:performance -- sample-name
```

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
