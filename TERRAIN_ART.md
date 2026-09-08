# Habitat, edge and street art

September 8, 2026. This pass keeps the existing pixel scale, buildings and relative terrain tiers. New configured worlds use ecological habitat fields, worker-baked native 16-pixel ground tiles and shared water/bank masks. It is a compositional model, not a climate or erosion simulation.

## Composition and rendering

`world/v3/habitats.ts` describes open ground, meadow, wet hollows, scrub, woodland and exposed ground inside the eight ecological envelopes. Moisture, water proximity, relief and connected seeded fields guide placement. Trees use jittered candidates grouped by cover rather than a regular three-cell grid. Ecology remains the broad envelope: tropical clearings retain tropical colors.

`render/terrain-tiles.ts` contains original small corner/edge silhouettes and grass glyphs. Broad habitat bands use these silhouettes, with narrow grouped intermediate-color pixels at seams. Quiet interiors, a limited palette and sparse larger clumps keep the ground readable. Texture and shore stone colors vary by ecology. No reference-image pixels are included.

`world/v3/path-art.ts` simplifies staircase route points within 0.75 cell for rendering, retaining endpoints and generated widths. The original routes and movement/reservations remain authoritative. Continuous native-pixel corridors replace independently rounded tile caps. Warm soil palettes, worn centers and sparsely placed chips replace the regular edge fringe. Bridge/ramp approaches retain their footprint. Paved plans do not donate dirt strokes to adjacent grass.

## Water geometry

Independent sparse coves and bars vary the two riverbanks, leaving quiet stretches and protecting the main channel. Water and bank rendering share their signed edge mask; animation uses cached shore pixels. Small eligible marsh basins enter the authoritative water terrain before settlement placement, while tiny surface wet spots remain decorative. Deserts do not receive marsh pools. This adds local variety, not a new watershed model.

## Streets

`content/settlements/streets/` resolves material from place and date; `render/street-raster.ts` only consumes basalt/cobble/slab/brick metadata. City and port profiles admit paved streets, while camp/prehistoric restrictions remain. A later regional-road pass now preserves paving rather than replacing it with soil. Materials use world-coordinate joints and external curb strips.

Roman Italian polygonal paving is an inferred art profile for generated Rome, informed by the [official Pompeii guide](https://pompeiisites.org/wp-content/uploads/Pompei-ING-LR-link.pdf). It is not a reconstruction of Rome's individual streets. European brick/cobble profiles and the slab fallback are intentionally broad art defaults. Rural paths remain dirt. Building density, complete sidewalk networks, drains and the dense courtyard architecture of the reference mockup are not recreated by this material pass.

## Review and checks

- `artifacts/street-review/index.html`: actual rural and Rome 100 CE scenes, overview and detail.
- `artifacts/terrain-study/index.html`: controlled production-raster fixtures for seams, diagonal routes, pools and banks, with ecology selector.
- `artifacts/edge-review/index.html`: grassland, tundra, tropical woodland and wetland scenes from the preceding edge review.
- `tests/street-rendering.test.ts`, `material-edges.test.ts`, `habitat-rendering.test.ts`, `terrain-art.test.ts`, `water-rendering.test.ts`: route simplification, material selection, signed chunk parity, mask continuity, ecology diversity, real pools and water blocking.

The regional-composition suite has a pre-existing density failure (8 households versus a minimum of 20), reproduced independently at checkpoint `96edf47`, plus timeout failures in this checkout. Those are not claimed fixed by this visual pass. Save restoration was not investigated, as requested.

## Final reference-guided polish

Ground ramps now separate warm dry ground, fresher turf and cool plant shadows. Dirt uses three discrete wear bands, sparse compacted-earth flecks and irregular grass overlaps. Small authored offsets and grouped intermediate pixels affect only a narrow seam; no screen-space blur or full-field dithering is used. Selected grass clumps are more frequent while most ground remains quiet. Building material ramps, foundation contacts, rock planes and foliage highlights were revised in the original asset recipes and rebuilt. The palette changes are visual and also affect existing scenes; no saved-world migration was attempted.

`artifacts/polish-review/index.html` is the latest review gallery. Its rural before image uses the same seed and camera as the after capture. The final 21 focused checks and production build passed.
