# Water rendering

The shared topography renderer adds five stepped depth colors, submerged stones, river currents/stone wakes, ocean crests, shoreline wash and cold-season edge accents. This is authored pixel art driven by terrain fields, not fluid simulation. Water collision, river routes, bridges and world elevation are unchanged by the water pass.

## Ecology and materials

`src/render/water-style.ts` defines shared material palettes selected by ecology and water type, independent of cultural families. Desert rivers have warm silt, buff sandstone and muted turquoise channels; tropical rivers have jade water, dark mineral tones and earthy banks, whereas tropical coasts have clear aqua shelves and pale sand. Temperate shores use blue-green water and neutral stone, boreal shores cooler blue and slate, tundra coasts cold blue with pale gravel, wetlands more olive water. Dry scrub uses warm banks with cooler water. The ecology remains the broad environmental envelope even when a local habitat becomes wetland or grassland.

Northern shores use gravel; temperate coastal gravel and sand vary with the existing shoreline width. Tropical coastal beaches retain pale sand. Existing ecological reeds and shoreline decorations are reused; rocks close to water receive the matching mineral tint. Winter margins gain small pale ice accents, not walkable frozen water. These are art-direction defaults, not a claim that latitude alone determines water color, geology or sediment. The explorer's “Monsoon river” uses the existing tropical ecological envelope; it does not introduce a rainfall or flood-season simulation.

## Geometry and rendering

`TopographyCell.waterVisual` carries continuous shore distance, shore width, kind, base ecology, river tangent and cold-season margin information. Metadata is supplied by the experimental environment path; previous relief scenes use a neutral fallback. It does not replace shallow/deep gameplay categories or consume simulation random draws. Earlier non-topographic worlds keep their renderer.

`water-raster.ts` reconstructs the continuous bed at native pixel centers, selects a small color palette, and adds world-anchored surface clusters and submerged stones. Streaming terrain workers produce these pixels beside the existing contour raster. Chunk installation copies water pixels into one ground page, then composes land and bridges as usual. Water and land textures remain cached. The fixed art studies use the same raster directly.

`water.ts` owns one lightweight Graphics overlay per retained water chunk. Only visible overlays redraw, at 10 animation steps per second, using integer pixels. River strokes move along the supplied local tangent, slower in shallows, with tiny rotating wakes around some submerged stones. Oceans use sparser larger crests and staggered shoreline approach/crest/retreat cycles; lakes have almost stationary glints. Banks with relief get stronger foam. Effects stay inside water tiles, crossing tiles suppress effects, and foreground cliffs/decks retain painter order. World-coordinate hashes and the scene clock prevent chunk-local phase restarts. Destruction releases the overlay and its registration with the scene manager.

The procedural explorer animates water while keeping its simulation/actors frozen. Pause water gives a reproducible frame; panning, zooming or loading a new chunk preserves that frame. New quick studies cover desert rivers, tropical rivers, tropical coasts and Arctic shores; existing woodland and coast presets remain available.

## Checks

`tests/water-rendering.test.ts` checks pixel/anchor parity at positive and negative chunk origins, continuous bed interpolation, ecological metadata, downstream tangents, water blocking and distinct materials. `tests/browser/water-rendering.spec.ts` checks five climate/water combinations, animation/pause, unchanged simulation state, camera movement, preview/play teardown and frame timings. The existing bridge browser check covers real-time crossings and painter order. Screenshots are `artifacts/water-*.png`.

No save restoration work or new hydrology model is included. Rocky foam supports raised banks, but the environmental generator still generally creates a low coastal margin; this pass does not create a new cliff-coast landform.
