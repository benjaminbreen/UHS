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

## Composed material textures — September 8, 2026

Replaced the fine per-pixel ground grain with original grouped motifs in `render/ground-motifs.ts`. Mineral bands now place 8×5 faceted stone glyphs with explicit face, highlight and contact-shadow tones; placement follows the visible mineral band even when the cell's habitat label is scrub. Grass and earth use separate small authored marks with quiet gaps and uneven colony density. Mediterranean turf has a brighter golden-green ramp and warm limestone ground. Path shoulders retain their inner wear colors and gain a narrow dark contact edge; dry-scrub grass may overlap their outer margin. Prevented the legacy dirt fallback from painting stray triangles outside an authored diagonal route.

Latest captures: `artifacts/texture-review/index.html` (Umbria and the matching grassland study). Fifteen focused motif, material-edge, habitat and street checks passed, along with the production build. This change leaves the concurrent character, performance and world-generation work separate and uncommitted.

### Four-band paths and supporting texture

Path coverage now scales with corridor radius, so broad roads retain four readable bands instead of saturating to the center color within a few pixels. Small world-anchored edge offsets and more candidate grass clumps vary the shoulders. Authored, rotated/reflected 2–4px clusters add restrained grain inside every material; larger faceted stones sit above that supporting rocky texture with varying colony density. The latest Umbria/grassland gallery was refreshed. Sixteen focused tests, including a wide/narrow path-band regression, and the production build passed.

### Organic path margins and ecological soil — September 8, 2026

Paths were a single vivid orange (`#d09846`) in every ecology but two, traced by a continuous dark contact pixel, and their margins followed one noise octave of about a pixel. The result read as a line drawn over the ground rather than as ground.

`render/material-edges.ts` now returns a path *field* — coverage, crossing position and local radius — instead of coverage alone. The corridor breathes (a slow width wave) and drifts (a lateral wander), both sampled on the center line so the two margins move together and the route still snakes through world-anchored noise. `render/habitat-raster.ts` carries a four-tone soil ramp per ecology plus a grit stone, tightened in value and desaturated below the local turf: grey-brown for temperate and boreal, pale grey for tundra, warm dun for grassland, laterite for tropical, and a pale scuff for desert. Two grouped hashes offset every wear threshold, so turf survives inside the road, grit strays out of it and the interior bands interlock instead of forming three ruled stripes. The contact shadow now appears in broken single pixels. Cart ruts appear on wagon-width roads only, dashed; stones collect off the treadway; a slow wash varies wear along the length; and turf loses color as it approaches the margin.

`world/v3/path-art.ts` narrows the art half-width (a generated `width: 1` street painted a 48-pixel ribbon, roughly twice the reference art). Reserved route cells, movement and collision are unchanged.

Rasterization cost rose from 178 to 193 µs per tile on a road-saturated fixture; tiles are worker-baked once per chunk. `artifacts/path-review/index.html` holds the before/after and the six ecologies. The `material-edges` band test now checks bands by crossing position rather than at fixed distances from the authored center line, since the corridor no longer holds one radius.

Follow-up: the first soil ramps were too grey. All eight are warmer, desert most of all — a pale cream track on warm sand rather than a grey one — with boreal and tundra still the coolest of the set. `render/ground-motifs.ts` gains `edgeTufts`, small blade clusters rooted on the verge and leaning out over the worn ground. Two per tile at most, gated by a coarse colony hash so whole stretches of margin stay bare, and absent from desert and tundra. Grass overlapping the road, rather than dithering alone, is what breaks its silhouette.
