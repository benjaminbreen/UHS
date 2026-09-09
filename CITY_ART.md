# Urban composition and art

New worlds pin `urbanRevision: 2`. Worlds pinned to revision 1 keep the earlier fixed-lattice composition in `src/world/v3/urban-v1.ts`; settings with no revision keep their original building selection and layout. This work does not restore or migrate saves. The renderer continues to use the shared building, terrain, shadow and object systems.

## Composition

`src/world/v3/blocks.ts` partitions a settlement into streets and blocks, and `src/world/v3/urban.ts` fits parcels into them. The partition is pure geometry: gates on the built edge, arterials inward from each gate, a public square that interrupts its arterials rather than being cut by them, then recursive subdivision of the remaining quarters down to a block module. Every street is an axis-aligned segment and every block a rectangle, so composition runs no graph search and costs are linear in the number of blocks rather than in ground area. Streets precede parcels. Terrain and existing regional routes constrain actual routes and parcel acceptance; a refused parcel leaves open ground, and a block whose parcels were all refused is not paved.

Block size, street-tier widths, regularity, courtyard share, blind-alley share, gate count and square placement come from `src/content/settlements/urban-form/`, selected by cultural family, date and coordinates. Extent comes from the site's own radius, which regional geography authors per place; `src/content/settlements/scale.ts` derives how many street-facing buildings that extent and that fabric imply. There is no worldwide growth curve and no population figure: a larger authored place produces a larger settlement, and a courtyard fabric spends more ground per household than a survey grid.

`urbanGates` is keyed on the site's own identity alone, so `src/world/regional/transport.ts` and `src/world/v3/generate.ts` can aim a through route at a gate without composing the settlement. A route that reaches a gate is built as two cardinal legs on open level ground, so it arrives square to the built edge instead of crossing the streets waiting for it as a diagonal stair. Routes between settlements with no built edge still run centre to centre.

Buildings share frontage and enclose walkable courts. Their footprints, entrances and upper-floor projections are separate. A civic range faces into a reserved square. Courts, squares, planted corners and footways are authored areas; terrain rendering preserves their extent instead of treating them as thin paths. Square/footway paving metadata is passed through the same worker and chunk pipeline as other terrain. `src/render/paving-stones.ts` carries forward the accepted v1 warm-gray flagstone ramp, broken corner silhouettes and short highlights, with continuous world-coordinate row offsets instead of repeating tile seams.

The main square contains public water, a brazier and market counters. Household social destinations use the square. Civic buildings have public access and functional interior exits; they do not create a household, private owner or resident family. No new economy or civic institution simulation is implied.

Failed terrain fits leave open land. The current neighborhood grammar is a bounded block composition, not a reconstruction of historical cadastral plans or a simulation of incremental urban growth. It has no walls, gates as built objects, suburbs, or change over time; the "gate" is a point on the built edge, not a structure. Geography and regional roads still determine the larger network.

## Art and content

`src/content/graphics/urban.json` contains flat shared forms and eligible base materials. `scripts/art/urban.py` extends the existing compiler with dimension-aware façades, bay rhythms, one/two/three-storey ranges, substantial roofs, market awnings and colonnades. Buildings are authored at native resolution, not enlarged existing bitmaps. The old frames remain intact. Material ramps, surface wear and light direction are shared across orientations. The atlas packer widens sheets before they exceed 4096 pixels and reports a build error instead of emitting an oversized texture. Unused civic/material combinations are excluded. Shadows and sprites are compiled once; no per-frame procedural building drawing is added.

`src/content/settlements/urban-form/` selects street fabric the same way, one file per region. Entries name the evidence that informs them — the Kaogongji ideal capital plan and the Ming Beijing grid, the Heian-kyo module, Pompeii's insulae, the Philadelphia and Manhattan survey grids, the blind-alley quarters of North African and West Asian medinas, the Arthashastra and Manasara prescriptions, Mohenjo-daro's streets, Teotihuacan's precinct, Cusco's kancha compounds, the wards of Benin City and Kano, Lamu and Zanzibar Stone Town, Great Zimbabwe's enclosures, Angkor Thom's grid, and the water-oriented plans of Ayutthaya and Melaka. Each is marked `inferred`: these are parameters informed by a named body of scholarship, not surveyed plans, and no entry reproduces a particular city. A cultural family with no entry gets an explicitly fictional generic fabric rather than another region's; that is missing research, not a claim that the region had no towns.

`src/content/settlements/civic/` selects institutions by date, coordinates and cultural family. The initial researched interpretations cover late-Republican/Imperial Italy and an English market-hall example. Italy uses the Pompeii basilica dated to 130–120 BCE as a reference for a hall adjoining a square. Its extension to a procedural Roman neighborhood is explicitly an inference, not a reconstructed Roman monument. Other settings receive an explicitly fictional public meeting hall using their existing architectural materials. Coverage is intentionally qualified; a renderer branch does not pretend to supply historical research.

Sources are attached to the civic building's inspection claim. The permanent era boundaries and legacy packs are unchanged.

## Review

- `npm run art` compiles all building/object and shadow assets.
- `npx tsx scripts/check-cities.ts` checks deterministic flat-ground composition and prints planner timings.
- `npx vitest run tests/urban-form.test.ts` checks fabric selection, evidence, block partitioning, gate agreement and capacity scaling.
- `npx vitest run tests/urban.test.ts tests/street-rendering.test.ts tests/road-network.test.ts tests/rendering.test.ts --maxWorkers=1`
- `UHS_CITY_URL=http://127.0.0.1:5174 npx playwright test tests/browser/cities.spec.ts` verifies a production preview, civic entry/exit, missing frames and local frame cadence.
- `UHS_CITY_URL=http://127.0.0.1:5174 npx tsx scripts/capture-cities.ts` captures matching neighborhood and detail views.

Review images live in `artifacts/cities/`. Browser measurements are local samples, not a device-independent frame-rate guarantee.
