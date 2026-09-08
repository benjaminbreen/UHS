# Performance implementation — September 8, 2026

Follow-up to `PERFORMANCE_REVIEW.md`, measured against character checkpoint `a00d0dc`. The deterministic engine and shared renderer remain the foundation.

## Measured results

Production samples are in `artifacts/performance/before.json` and `final.json`. Final measurements include the wider entity rendering and staggered NPC movement.

| Local measurement | Before | After |
| --- | --- | --- |
| Alexandria selection to visible terrain | 9.16 s | 5.68 s |
| Alexandria longest startup main-thread task | 3.66 s | 0.61 s |
| Anatolia revision-one selection to visible terrain | 2.32 s | 1.85 s |
| Alexandria frame p95 / maximum | 16.8 / 66.7 ms | 16.8 / 50.1 ms |
| Anatolia frame p95 / maximum | 16.8 / 33.4 ms | 16.7 / 33.4 ms |
| Alexandria command p95 / maximum | 38.3 / 40.6 ms | 35.5 / 44.7 ms |
| Anatolia command p95 / maximum | 24.3 / 40.0 ms | 25.7 / 42.2 ms |

Alexandria loading improved about 38%; its longest main-thread stall fell about 83%. Steady cadence was already around 60 FPS and remains so. These samples do **not** establish a consistent command-latency improvement. Default-world canvas startup remains around one second. Intermediate Alexandria samples were 5.76–5.79 s with 0.62–0.72 s longest tasks. CPU profiling perturbs timing; its separate recordings locate hotspots rather than provide headline results.

Both worlds completed all 40 movement commands without page errors. The minimap counter stayed at two background builds across default-world startup, replacement, and the movement sample, rather than rebuilding on every step. JavaScript heap readings vary substantially with GC and the now larger visible population; no memory reduction is claimed. Terrain installation maxima also vary by scene and run.

The final long-walk browser check recorded no missing terrain frames across 1,691 frames, p95 16.8 ms, maximum 83.4 ms, and maximum command time 43.3 ms. Occasional frame spikes remain despite the improved startup and ordinary cadence.

Validation: production build; 48 distinct focused unit tests including prepared-world/state/command equivalence, atlas regression samples, cancellation and observation isolation; browser coverage of characters, movement, wide-view culling, staggered motion, terrain streaming, procedural preview/play and ecological water. The new visibility test checks that offscreen culling still works and that visual interpolation does not mutate simulation state. The full suite and deployment were not run.

## Ownership and hot paths

- `runtime/preparation.ts` prepares new worlds in a cancellable worker. `world/v3/prepared.ts` defines disposable structured-clone geometry; it is not a save format. The main-thread world reconstructs query functions around that geometry. `terrain-worker-owner.ts` hands the warmed worker to `TerrainStream`, or terminates it if the runtime is replaced/disposed first. Node/headless creation remains synchronous.
- `main.tsx` selects lab routes before importing the game bootstrap. Audio Lab is lazy. The legacy tile worker starts on its first prefetch instead of in every runtime constructor.
- `world/geography/` owns shared atlas, coordinate, noise and landscape code. The old `world/v2` import paths are thin compatibility reexports. Actual v1/v2 generator behavior remains supported; it is not dead code.
- `scripts/prepare-atlas-index.mjs` generates compact land-mask and edge-bucket runs from the existing atlas. Run it directly after changing atlas data, or use `npm run prepare:atlas` for the full source-data pipeline. Runtime initialization decodes the prepared index rather than scanning polygons to build it.
- `render/resources.ts` makes each terrain chunk's object/texture ownership explicit. Streaming no longer diffs the whole scene and texture registry on installation. Queues rebuild when the view changes; diagnostic counts update when resources/view change, rather than every frame.
- `ui/Minimap.tsx` retains a padded terrain canvas and crops it as the player moves. It rebuilds when movement exhausts the margin, the world/scale changes, or activated place count changes. The player marker is drawn separately.
- Runtime selection/zoom/stop updates reuse their observation. Public action responses receive isolated copies. Saving requests are coalesced before snapshot cloning, at most once per 500 ms during continuous input, with a pending flush on page hide.
- Render depth/texture setters run only when values change. Character-frame and shadow canvases use `willReadFrequently` at first context creation: Phaser texture installation and shadow generation read their pixels, so GPU-backed source canvases caused synchronous readbacks in the CPU profile.
- Large derived caches evict their oldest one-eighth batch rather than clearing everything. Batch eviction also avoids repeatedly starting a `Map` iterator over tombstones. Actor ordering is computed once per command advance rather than each simulation substep.

## Visibility and movement

Entity drawing now uses the viewport plus an offscreen margin, not the player's 19-tile observation radius. Objects and NPCs therefore remain visible across the former on-screen boundary at wide zoom. Entities in other interiors remain excluded. Knowledge, public observations and interaction checks still use the engine's existing rules. The renderer scans already loaded entities; drawing does not activate additional simulation content.

`render/entity-presentation.ts` gives human NPC steps a seeded 0–160 ms start offset and 420–680 ms duration; animals use shorter timings. Retargeting continues from the displayed position without queuing stale steps, and culling cancels the affected tweens. Player timing is unchanged. This softens visual synchronization without introducing real-time simulation timers, random state changes, or extra simulation ticks. Large simulation-time jumps can still reposition actors immediately.

## Reproducing measurements

Build with `npm run build`, start `npm run preview -- --port 4173`, then run `npm run measure:performance -- sample-name`. `PERF_URL` changes the server; `PERF_PROFILE=1` also writes Chrome CPU profiles. Do not run other browser/build tests concurrently with timing samples.

The harness uses fresh contexts, installed headless Chrome, a 1440 × 1000 viewport, fixed worlds/seeds and no CPU/network throttling. It measures selection-to-visible-terrain readiness, records main-thread long tasks, waits for offscreen terrain completion, then records 360 frames with 40 accepted movement commands. It also records a blank-page cadence control. This is a local benchmark, not a guarantee for mobile hardware or deployed-network loading.

## Remaining limits

The gameplay dependency graph still loads Phaser and substantial geography/content. Routing before bootstrap isolates lab entry points, but a smaller entry chunk alone is not a smaller gameplay download. The prepared index adds about 384 KB of source JSON and increases the worker bundle from approximately 1.97 MB to 2.36 MB uncompressed. Shipping geography separately with caching/compression is a future network optimization; the existing Vite large-bundle advisory remains.

Initial scenery/minimap installation still has synchronous work. Snapshot coalescing reduces frequency but not the eventual cost of cloning a very long session. Dense populations, long-distance travel, maximum zoom-out and slower devices need continued measurement. No general entity-index framework, renderer rewrite or compatibility purge was added: the profile's concrete remaining hotspot was character pixel readback, not evidence for those larger changes.
