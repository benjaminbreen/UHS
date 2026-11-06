# Water rendering

The shared topography renderer adds five stepped depth colors, submerged stones, river currents and curls, ocean crests, shoreline wash and cold-season edge accents. This is authored pixel art driven by terrain fields, not fluid simulation. Water collision, river routes, bridges and world elevation are unchanged by the water pass.

## Ecology and materials

`src/render/water-style.ts` defines shared material palettes selected by ecology and water type, independent of cultural families. Desert rivers have warm silt, buff sandstone and muted turquoise channels; tropical rivers have jade water, dark mineral tones and earthy banks, whereas tropical coasts have clear aqua shelves and pale sand. Temperate shores use blue-green water and neutral stone, boreal shores cooler blue and slate, tundra coasts cold blue with pale gravel, wetlands more olive water. Dry scrub uses warm banks with cooler water. The ecology remains the broad environmental envelope even when a local habitat becomes wetland or grassland.

Northern shores use gravel; temperate coastal gravel and sand vary with the existing shoreline width. Tropical coastal beaches retain pale sand. Existing ecological reeds and shoreline decorations are reused; rocks close to water receive the matching mineral tint. These are art-direction defaults, not a claim that latitude alone determines water color, geology or sediment. Regional water that ecology cannot say is in the waterscape below.

## Geometry and rendering

`TopographyCell.waterVisual` carries continuous shore distance, shore width, kind, base ecology, river tangent and cold-season margin information. Metadata is supplied by the experimental environment path; previous relief scenes use a neutral fallback. It does not replace shallow/deep gameplay categories or consume simulation random draws. Earlier non-topographic worlds keep their renderer.

`water-raster.ts` reconstructs the continuous bed at native pixel centers, selects five hue-shifted colors, and adds sparse world-anchored surface clusters and grouped submerged stones. Broad smooth fields create asymmetric shelves/pockets; restrained clustered transitions avoid a fine noisy edge. Shore lips have interrupted contact shade and warm highlights. Most surface pixels remain uninterrupted base color. Streaming terrain workers produce these pixels beside the existing contour raster. Chunk installation copies water pixels into one ground page, then composes land and bridges as usual. Water and land textures remain cached. The fixed art studies use the same raster directly.

`water-motifs.ts` authors a shared 128×96 pixel atlas with original eight-frame sequences for ripples, curls, scalloped crests, plants, leaves and expanding rings. Light and dim-tail pixels share a tinted atlas. It is allocated before chunk texture ownership starts, so evicting a chunk cannot remove the atlas. Containers own the per-chunk images and a small Graphics layer for shoreline wash; destroying a container also releases its images and manager registration.

Only visible containers animate, at 10 steps per second, using integer pixel positions. Surface silhouettes develop over eight drawings, then leave a quiet interval; river motifs follow the local tangent, and lake glints are nearly stationary. One surface motif is selected at most per 2×2 tile area, with additional empty areas and only about 40% of selected motifs active at a time. Shallow freshwater in woodland/wetland envelopes can have occasional swaying submerged blades, turning leaves or rings near the bank; these details replace the surface motif in their tile. They are absent from salt water, deserts and frozen margins. These are decorative habitat cues, not new species or collectible objects.

Ocean wash uses two longer broken wavelets per edge with quiet intervals, rather than four continuously visible dashes. Banks with relief get stronger foam. Effect pixels stay inside water tiles, crossing tiles suppress effects, and foreground cliffs/decks retain painter order. World-coordinate hashes and the scene clock prevent chunk-local phase restarts. The source-pixel occupancy, clipping at all flow directions, ecological gates and surface density are covered by unit tests.

The procedural explorer animates water while keeping its simulation/actors frozen. Pause water gives a reproducible frame; panning, zooming or loading a new chunk preserves that frame. New quick studies cover desert rivers, tropical rivers, tropical coasts and Arctic shores; existing woodland and coast presets remain available.

## Checks

`tests/water-rendering.test.ts` checks pixel/anchor parity at positive and negative chunk origins, continuous bed interpolation, ecological metadata, downstream tangents, water blocking and distinct materials. `tests/browser/water-rendering.spec.ts` checks five climate/water combinations, animation/pause, unchanged simulation state, camera movement, atlas survival after chunk eviction, 2× detail captures, preview/play teardown and frame timings. The existing bridge browser check covers real-time crossings and painter order. Screenshots are `artifacts/water-*.png`.

No save restoration work or new hydrology model is included. Rocky foam supports raised banks, but the environmental generator still generally creates a low coastal margin; this pass does not create a new cliff-coast landform.

## Local bank and marsh refinement — September 8, 2026

Sparse independent riverbank coves/bars and admitted small marsh basins add local variation before siting. Banks and water share a native-pixel signed edge mask; wash animation follows cached shoreline pixels. Low pool margins use muted wet soil and shallow water. This does not replace the existing reach planner with a watershed simulation. See `TERRAIN_ART.md`.

## Waterscapes — November 6, 2026

`content/geography/waterscapes.ts` reads a place's lon/lat, year and season into a `Waterscape`: delta, flood stage, tint, ice, icebergs, reef, tidal range, mangroves and water works. Region boxes are broad and editable there; nothing enters saves.

- **Deltas and flood.** Delta places (Nile, Shatt al-Arab, Yellow River, Ganges–Brahmaputra, Mekong, Irrawaddy, Indus, Red River, Mississippi, Rhine–Meuse) get a web of distributaries from the contours of two smooth fields, the town on its mound. The flood stage follows the river's regime by season (Nile autumn, monsoon summer, snowmelt spring; the Aswan dams end the Nile's). In flood the valley floor fills with wadable silty water and flood-system basin fields (`nile-flood-basins`) stand under it; a monsoon river widens within its banks.
- **Colour.** `tint` overrides the ecology palette: silt, Yellow River loess, clear karst water (Guilin, Yucatán, Dinaric, Florida). The living-water colour table has matching rows (160–199).
- **Ice.** Cold winters (and the Little Ice Age) freeze lakes and rivers: walkable (`waterDepthAt` is 0), with snow drifts, black ice and a single crack field. Subpolar coasts add shore-fast ice about seven cells out; polar ones pack floes beyond it. Glacier coasts (Greenland, Svalbard, Alaska, Patagonia, Antarctica) carry icebergs with a lit and a shaded face.
- **Reefs.** Atoll places are drawn as a ring of motus round a lagoon with passes; tropical reef coasts get a lagoon band, a coral crest with breakers, coral heads and seagrass.
- **Tides.** The scene stands at low water: the intertidal shelf, scaled by tidal range (macrotidal Fundy, Severn, Brittany, Yellow Sea, Bengal...), is bare mud with creeks and pools, wadable; temperate shores carry salt marsh above mid-tide. On mangrove coasts mangroves stand out on the mud.
- **Works.** Low Countries polders get drainage ditches and a raised dike along open water; the Valley of Mexico gets back its lake with chinampa beds and canals; Iran, Turpan, Oman and the Saharan foggara country get a qanat's line of shaft mounds.

The tide, ice and flood are fixed when the world is built from its starting season; they do not yet change as the engine's season turns. Review: `npm run capture:terrain -- waters` (pairs are A/B by season); the lab takes `lon`/`lat`.
