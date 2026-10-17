# Water experiments handoff

**C / Living depths is the default WebGL game renderer.** The approved revision-7 JSON is preserved in `src/render/living-water/defaults.json`, shared with the lab. New lab visits use it and focus C; explicit URL values override it. **Load preferred C** restores it. The older revision-5 preset remains archived in the dev folder. JSON export includes all controls and the renderer revision.

## Current lab

C uses animated color forms, caustics, submerged fish, optional surface ripples, wave crests and obstacle-aware foam. Rocks and plants influence a presentation-only displacement field; this is not a fluid simulation. Beaches can range from broad ramps to zero-width cliff edges. Foam opacity, thickness and breakup are independent of wave intensity. Rock masks suppress crests inside their footprints and phase delay curves approaching wave fronts.

Bank climate is independent of water palette, using the existing ecological family names. Bank materials are automatic, sand, mud, clay or snow. Automatic art defaults use sand for coasts, mud for ordinary inland waters, red clay for desert inland waters, and snow for the arctic study. These are preview choices, not claims that all deserts have red sediment or all arctic banks are always snow-covered. Clean wet/contact bands preserve the preferred pixel-art boundary without stippling. Wet-edge width and bank-lapping amount are separate controls.

## Playable-map integration

The production renderer uses world-anchored GPU color forms/caustics and worker-prepared shoreline and rock-displacement textures. Common palette, bank and scenery code lives in `src/render/living-water`; the study re-exports it. It is a presentation change: generation, collision, navigation and simulation hashes are unchanged. Explicit `waterRenderer: "legacy"` and Canvas rendering retain the older water path; canals and bridges keep their existing rendering.

Map rules:

- Tropical woodland, desert, dry scrub and grassland use tropical water. Temperate/boreal woodland use sapphire (`blue`); wetland uses ocean green; tundra uses polar. There is no standalone monsoon ecology: tropical monsoon woodland remains tropical, while wetland maps receive green.
- Base beach width: rivers 1.5, lakes/ponds 1, coasts 4 (doubled after coast review). A stable ±10% variation and nearby elevation differences narrow steep banks. This measures local slope, not global altitude count. Existing cliffs remain terrain geometry.
- The approved warm bank colors remain the normal baseline. Existing red-earth desert colorways use clay tones; the map's frozen-margin flag uses snowy banks. No permanent snow is inferred from an arctic label alone.
- River current follows map flow vectors. Coast motion approaches shore. Small standing-water features move more quietly. Reflections use the same lighting phase as shadows.
- Deterministic decorative water rocks, reeds, lilies and coastal seaweed are separate from gameplay resources. Frozen margins and desert profiles suppress aquatic plants. Rock displacement bends the color/wave field; these decorative objects do not introduce gameplay collision.

Deferred: weather-driven strength/foam, wind-driven extra surface ripples (off in game by default), map-author controls for rock/vegetation/fish density, and finer feature-size/depth inputs. The approved JSON retains extra ripples for laboratory comparison. The GPU port shares the C art direction and palette but does not attempt byte-identical output to the fixed-size CPU study. Its water objects remain cosmetic.

## Revision 7 bank authoring

Direct dry/wet/contact colors, tint opacity, wet-edge opacity and a switchable stepped gradient are included in exported JSON. Colorway presets cover golden sand, red clay/stone, gray pebbles and snow/slush. Dry-bank speckles were removed after the user rejected dithering; preserve clean color shapes. Custom colors intentionally override automatic climate colors until disabled. Bank tint opacity blends custom dry color with the material base; wet-edge opacity composites the contact/gradient colors over dry sediment.

## Map-context polish study

`/water-experiments?context=map` opens the second workshop section. It embeds the real procedural map/WorldScene at gameplay zoom, with drag/zoom, ecology/season/water/seed selection, an explicit Apply action, current-C comparison, pause, and JSON export (`uhs-shoreline-context`). The approved polish is now the ordinary game default through `RenderOptions.shorePolish`; the study retains a comparison switch.

The study adds stepped sediment-to-ecology colors, small coherent bank-edge irregularities, stronger broken lapping lines, faceted stone groups with companion pebbles, and three authored low-plant sprite patterns with seasonal palettes. Aquatic plant placement favors tropical maps; tundra suppresses all study plants even when unfrozen. Existing map rocks contribute to the displacement field alongside study rocks. Their footprints remain an approximation, rather than a pixel-perfect extraction of each original sprite. New plants/stones are cosmetic, and original map geometry and resources are preserved.


## Scalloped ocean coasts and calm offshore water

Approved shoreline polish is enabled in WorldScene. Ocean beaches default to four tiles before local slope and seeded width variation; rivers/lakes retain their previous widths. The coast mask and worker-prepared ground share a bounded two-scale displacement of the supplied shoreline distance. It adds local bays/projections without replacing the coarse geographical outline. Water and outer beach edges use separate spatial variations. Paving, bridges, canals and elevated dry ground retain their existing protection. This remains presentation geometry; it does not rewrite the simulation's terrain or navigation classifications.

Map-context controls: Coastal scallop depth (tiles, default 1.4), scallop size (tiles, 18), ocean beach width (4), outer beach variation (0.5), offshore calmness (0.95). All export in map-settings JSON. `/water-experiments?context=coast` starts on a coast and centers the actual coast rather than the nearest inland water.

The former blocky ocean motion came from using per-tile shore-normal directions in the animated phase. Ocean surface advection now uses one world-space direction; shoreline lapping still follows distance to shore. From 2.5 to 6.5 tiles offshore, detailed waves/caustics fade into broad slow color forms. Rivers retain directional current. Surface noise and beach detail remain world anchored across chunk boundaries.


## Extended surf zone — September 11 revision

Ocean beach baseline is now eight tiles (double the preceding four), retaining local slope and width variation. Calm-water blending now spans 5–13 tiles offshore instead of 2.5–6.5. Ocean distance encoding preserves sixteenth-tile precision in the first four tiles and quarter-tile precision farther out, allowing this wider surf zone without clipping at eight tiles.

Ocean wave phase uses shore distance plus increasing time, so crest contours travel toward smaller distances on every coast orientation. Removed the fixed northward caustic advection; caustics now deform locally while stronger foam fronts approach shore. Offshore colors use low-contrast, finer stepped blends of two moving spatial scales, replacing static high-contrast blobs. River rendering retains its existing directional flow and distance precision.
