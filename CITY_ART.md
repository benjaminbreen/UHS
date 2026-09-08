# Urban composition and art

New worlds pin `urbanRevision: 1`. Earlier settings keep their original building selection and layout. This work does not restore or migrate saves. The renderer continues to use the shared building, terrain, shadow and object systems.

## Composition

`src/world/v3/urban.ts` composes bounded neighborhoods: larger sites have four blocks; compact sites have one. Main streets, local streets and narrow passages are routed before parcels. Street corridors use bounded searches so route reuse cannot dissolve an intended block into a branching path. Block dimensions vary by seed; explicit planned layouts retain regular dimensions. Terrain and existing regional routes constrain actual routes and parcel acceptance.

Buildings share frontage and enclose walkable courts. Their footprints, entrances and upper-floor projections are separate. A civic range faces into a reserved square. Courts, squares, planted corners and footways are authored areas; terrain rendering preserves their extent instead of treating them as thin paths. Square/footway paving metadata is passed through the same worker and chunk pipeline as other terrain. `src/render/paving-stones.ts` carries forward the accepted v1 warm-gray flagstone ramp, broken corner silhouettes and short highlights, with continuous world-coordinate row offsets instead of repeating tile seams.

The main square contains public water, a brazier and market counters. Household social destinations use the square. Civic buildings have public access and functional interior exits; they do not create a household, private owner or resident family. No new economy or civic institution simulation is implied.

Failed terrain fits leave open land. The current neighborhood grammar is a bounded block composition, not a reconstruction of historical cadastral plans or a simulation of incremental urban growth. Geography and regional roads still determine the larger network.

## Art and content

`src/content/graphics/urban.json` contains flat shared forms and eligible base materials. `scripts/art/urban.py` extends the existing compiler with dimension-aware façades, bay rhythms, one/two/three-storey ranges, substantial roofs, market awnings and colonnades. Buildings are authored at native resolution, not enlarged existing bitmaps. The old frames remain intact. Material ramps, surface wear and light direction are shared across orientations. The atlas packer widens sheets before they exceed 4096 pixels and reports a build error instead of emitting an oversized texture. Unused civic/material combinations are excluded. Shadows and sprites are compiled once; no per-frame procedural building drawing is added.

`src/content/settlements/civic/` selects institutions by date, coordinates and cultural family. The initial researched interpretations cover late-Republican/Imperial Italy and an English market-hall example. Italy uses the Pompeii basilica dated to 130–120 BCE as a reference for a hall adjoining a square. Its extension to a procedural Roman neighborhood is explicitly an inference, not a reconstructed Roman monument. Other settings receive an explicitly fictional public meeting hall using their existing architectural materials. Coverage is intentionally qualified; a renderer branch does not pretend to supply historical research.

Sources are attached to the civic building's inspection claim. The permanent era boundaries and legacy packs are unchanged.

## Review

- `npm run art` compiles all building/object and shadow assets.
- `npx tsx scripts/check-cities.ts` checks deterministic flat-ground composition and prints planner timings.
- `npx vitest run tests/urban.test.ts tests/street-rendering.test.ts tests/road-network.test.ts tests/rendering.test.ts --maxWorkers=1`
- `UHS_CITY_URL=http://127.0.0.1:5174 npx playwright test tests/browser/cities.spec.ts` verifies a production preview, civic entry/exit, missing frames and local frame cadence.
- `UHS_CITY_URL=http://127.0.0.1:5174 npx tsx scripts/capture-cities.ts` captures matching neighborhood and detail views.

Review images live in `artifacts/cities/`. Browser measurements are local samples, not a device-independent frame-rate guarantee.
