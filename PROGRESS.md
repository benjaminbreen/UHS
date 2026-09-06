# Implementation status — 6 September 2026

## Delivered

- Design v2 records the user's original-art requirement, free-first $10 ceiling, Roman/Neolithic initial scenes, and generic-engine priority.
- Original pixel-art proof and an atlas compiled from repeatable recipes. No purchased or restricted third-party pixels ship.
- One React/Vite/Phaser application with two seeded settings, four settlements each, sparse terrain, persistent interiors, people, wildlife, and shared contextual commands.
- Deterministic core, visibility projection, needs and routines, bounded distant catch-up, trade, theft/restitution, harvesting, eating/drinking/resting, following permission, animal handling, and capture uncertainty.
- Local save/import/export with validation and single-writer handling; command recording, graphical replay, single-step/scrub, and resume-from-replay branching.
- A Node player runner, actual local MCP transport, browser player API, and optional feature-detected WebMCP registration.
- A real prepared lower-Tiber centerline. Neolithic local geography remains explicitly inferred. The broader elevation/drainage geographic gate is not marked complete.

## Verification record

Final verification: 19 core/content/rendering/MCP checks and 8 real-browser checks passed; the production build passed. A short production movement sample in Chrome 152 at 1440 × 1000 recorded a 649 ms ready time, 16.7 ms median / 16.7 ms p95 frame interval, roughly 26 MB JS heap, and no page errors. An empty-page baseline in the same run also measured 16.7 ms, so this session was limited by the browser frame cadence. This is a short local measurement, not a cross-device performance guarantee. The exact report is `artifacts/performance.json`. `artifacts/` contains the original art proof, inspected game screenshots, stitched generated maps, and actual scripted-day trajectories/snapshots. Re-run the documented commands after changing versions or rules. Recorded hashes describe only their pinned implementation.

The two actual scripted days each executed 154 accepted commands, reaching 21:00. Exact replay verified Roman hash `b6d511bc` and Neolithic hash `830dca2c`.

The browser test found and resolved missed quick keyboard taps. Visual review found and resolved a spawn/roof overlap, excessively wide parcel spacing, abrupt terrain edges, and an initially obstructive narrow-screen panel. Replay files from both the browser and the Node runner are supported.

## Deliberate limits and next work

The prototype supports two concrete content packs; free text is catalog parsing, not arbitrary simulation generation. Optional model enhancement, hosted sessions, fine-grained geography/elevation, deeper social/economic systems, and further eras are not implemented. The browser's experimental WebMCP registry was unavailable for native verification; stdio MCP is tested against a real SDK client.

Next: review the live art/interaction experience with the user, enrich reusable construction modules and ecological rules where actual play exposes gaps, and add another sharply contrasting content pack through the existing definitions. Complete the geographic pipeline as a separate measured step. Add model enhancement only after choosing a provider and explicit spending controls; no model calls or spending occurred here.

A final botanical review replaced the Anatolian pack’s acacia selection with regionally attested hackberry and added the botanical evidence record. The schematic tree artwork and individual tree locations remain inferences.

No deployment, old-repository changes, asset purchases, or external messages were made.

## Mockup-driven polish pass

Rebuilt the interface with charcoal panels, thin gold borders, locally served Baskervville type, a 54 px header, map-owned toolbar, full-height portrait sidebar, context thumbnails and functional Local/Region minimap controls. The map owns more of the viewport; mobile panels and dialogs remain usable. Inspect and map changes cost no simulation time.

At completion of the earlier UI polish, the atlas contained 297 named frames: 18 portrait color/identity variants, revised foliage and tunic contours, deeper terracotta roofs, two-storey and pilastered facade modules, awnings with shelf detail, differentiated mudbrick roof furnishings, broken stone paving, quays and modular bridge arches. Both scenes use the same authoring method. No imported tileset pixels were added.

`src/render/materials.ts` provides bounded cached cosmetic surface rules shared by the scene and minimap; no save schema, entity position, entrance, collision or simulation rule changed. The engine tests still pass, and the browser suite now also verifies Local/Region switching and inspection without time advance. Final screenshots: `artifacts/roman-first.png`, `artifacts/roman-polished-context.png`, `artifacts/neolithic-first.png`, and `artifacts/mobile-inventory.png`.

The UI is much closer to the mockup. The largest remaining visual difference is settlement composition and density: the prototype still has widely spaced parcels and a small facade vocabulary. This pass preserves those physical layouts and refines their presentation; it does not claim exact mockup fidelity.

## Target 3 world-rendering pass

Completed a separate graphics pass against `mockup target 3.png`. The world now uses exposed earth bank faces, lit lips, contact shadows and shallow water; 8-neighbor corner treatments; animated water highlights; repainted, higher-contrast mudbrick roof/wall planes and roof openings; larger world characters; clustered foliage and rock volumes; coherent projected ground shadows with per-frame foot anchors; and narrow, connected paths derived from existing entrances through static walkability. Roman scenes inherit the shared lighting, foliage, props, characters and water refinements while retaining their stone waterfront treatment.

The atlas has 1,489 named frames, mostly generated edge-mask and shadow combinations. All five exported game-asset files regenerate byte-for-byte. No imported mockup pixels, paid assets, new UI pass, save-schema changes, entity moves or collision changes were introduced.

Visual iteration corrected detached shadows, overly busy water, excess reeds, disconnected paths, and crop clumps appearing over roads. Crops now draw up to three clumps per parent patch and share selection, inventory, and depletion. The browser test walks to a field, clicks a child clump, gathers grain, and verifies the shared state transition. New render tests exercise walkable path construction across seeds, water preservation, and surface-cache order independence.

Final inspected captures: `artifacts/target-3-pass.png` (1536 × 1024), `artifacts/target-3-map.png` (map only), `artifacts/neolithic-field-detail.png`, `artifacts/neolithic-field-harvested.png`, and both initial scene captures. Both production movement samples measured 16.7 ms median/p95 with the same blank-page cadence, no page errors, and no development handle. Neolithic scene switching measured 173 ms in that sample. These are short local measurements, not cross-device guarantees.

This pass improves depth and material treatment within the existing world layout. It does not claim pixel-for-pixel reconstruction of the illustrative target or new terrain-elevation simulation.

## Modular graphics and isolated review lab — September 6

Initialized a local Git repository before editing. Baseline commit `e9966ca` is tagged `checkpoint-before-graphics-refactor`; generated assets and the complete running source are recoverable without the ignored downloaded reference packs. No remote was configured and nothing was published.

Implemented content-owned building recipes and generated contracts (physical footprint/entrance, visual bounds/anchor, height, materials, roof form and attachments). The world generator selects frame IDs from pack data; the renderer does not branch on a Roman/mud architecture enum. Reusable wall, opening, foundation, roof and attachment functions produce four classical and four mudbrick variants plus three later construction studies. Revised foliage, quieter meadow patches, contact/cast shadows, water material variants and bank corner handling. Parcel-derived districts, communal-hub footpaths and shared enclosure geometry remove several previous renderer-specific layout assumptions.

Added `/graphics-lab` and a Settings link. It uses the normal Phaser WorldScene with isolated runtimes and no save or terrain-worker connection. Court/generated-settlement modes, six family presets, separate landscape choices, light treatments, integer zoom, true square/portrait test frames, seed/camera URLs, diagnostic bounds/entrances, frozen animation and PNG export are implemented. The later-era presets are explicitly construction studies, not new historical game packs.

Validation: 22 unit/integration checks and 10 browser tests passed; the final lab frame/PNG/reproducibility checks were rerun after the last frame-layout adjustment. Both original 154-command checkpoint journeys replay to their recorded hashes (`b6d511bc`, `830dca2c`); their saved snapshots still import. The generated atlas/material/contracts reproduce byte-for-byte. Production build and a production lab launch pass with no page errors or gameplay action surface in the lab. Production Chrome movement sampling at 1440×1000 reports median 16.7 ms in both scenes, p95 16.7–16.8 ms, with no page errors (local headless measurements, not a device-wide performance guarantee).

Remaining scope is explicit in `GRAPHICS.md`: physical generator-v1 channels are preserved for save compatibility; the varied-contour court is a fixture, not a silent change to old water collision. Fixed-direction light treatments do not model a moving sun. The universal settlement planner and comprehensive future-era asset families remain separate work. Artistic acceptance against the references remains a visual review, not an assertion made by these tests.
