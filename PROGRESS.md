## Live renderer tuning and test animals — September 13, 2026

Command/Ctrl+Backquote now opens a compact panel over the playable world for direct pixel-rendering comparisons. It changes camera pixel rounding, nearest/linear texture filtering, browser canvas sampling, arbitrary 0.05-step zoom, zoom duration/easing, camera-follow smoothing and the existing frame meter live. Reset restores the shipped rendering defaults and 2× zoom. Normal stepped zoom now eases over 130 ms without removing any of the thirteen zoom stops. These controls are presentation state only and do not enter saves or simulation hashes.

The same panel can place one to twelve examples of any authored fauna species and animation state around the player. Test animals use the playable fauna atlas, direction, lighting, depth and frame cycle, but remain scene-local: they are not simulated or saved, cannot be selected as real animals, clear on map replacement, and can be removed independently. Validation: typecheck and the focused live-browser check pass, including shortcut toggling, live renderer attributes, an in-progress and completed eased zoom, animal placement/clearing and reset. `artifacts/live-graphics-panel.png` was visually reviewed. No commit or deployment.

## Ten recognizable belief cores and foundational icons — September 12, 2026

Ten high-value traditions now use compact authored kits: Russian Orthodoxy, Roman civic religion, Latin Catholicism, Sunni Islam, Puranic Hinduism, Song–Ming Chinese religious life, Theravada Buddhism, Pure Land Mahayana, Second Temple Judaism and Classical Greek religion. Each representative profile has no more than three foundational powers and five important figures. The same flat kits can update closely related dated profiles without regenerating worlds or creating a culture-by-era content matrix; regional figures remain only where they add real personal texture.

Six new foundational emblems—God the Father, Jesus Christ, the Holy Spirit, Allah, YHWH and Tian/Heaven—were generated in the approved carved pixel-relic style and processed through the existing transparent 64×64, 16-color deity pipeline. The Allah, YHWH and Tian images are non-anthropomorphic; the first two contain no sacred lettering. The v1 deity set now contains 198 icons, with generated sources preserved under `public/beliefs/deities/v1/sources/foundational/`.

Validation: production build passes. A focused test locks the recognizable foundational order and 3+5 cap for all ten traditions, verifies foundational figure icons, and retains structural checks for every relationship in all belief systems.

## Simpler authored belief hierarchy — September 12, 2026

Belief panels now show at most three foundational figures and five important figures in authored order. Personal devotion no longer promotes a random non-paramount power into the top row; it is assigned only from an explicit system list. Observance variation no longer treats personality openness as evidence against religiosity. The panel uses plain foundational/important language, and belief resolution can use the actor's authored community as well as place and date.

Russian Orthodoxy is the reference cleanup. Russian and Russian-Siberian profiles reuse one flat kit: God the Father, Jesus Christ the Son and the Holy Spirit above the Theotokos, Nicholas, Peter and Paul, George and Michael. Bayanai, generic ancestors, land spirits and the Domovoi are no longer presented as part of every Siberian Orthodox character's religion; existing Indigenous belief profiles remain separate. European-culture Siberian starts prefer the Orthodox profile, while Indigenous contexts can continue to resolve their own regional content.

Validation: 18 focused belief/hierarchy/officiant tests passed across all 214 systems; the Russian Orthodox browser check confirms the exact 3+5 display in the Ural Mountains at 1750. The general character-panel browser check and production build pass. `artifacts/character-panel-orthodox.png` was visually reviewed. The pre-change shared worktree, including Fauna Lab B-set work, was committed and pushed as `50d469d`; these belief changes are not yet committed.

## Fauna small-sprite art revision — September 12, 2026

Replaced the initial fauna art with 248 compact frames, simplifying the detailed intermediate pass in response to the user's Stardew-like sprite-sheet reference. Native canvases preserve relative size: sparrow 16×16, dove 18×18, chicken 20×20, sheep 32×32, wolf 40×32 and deer 40×40. A shared 2× lineup makes proportions directly comparable. Six-color palettes have no enclosing outlines. Eight-frame cycles include articulated gaits, pecks, wingbeats, grazing, resting and small ear/eye gestures. No world placement or simulation behavior changed.

The lab defaults to a single animal, with a clickable frame strip, stepping, playback speed, and correctly held/exported selected frames. Generated metadata supplies profile palettes and frame counts. Art validation checks transparency, palette limits and margins; focused profile and browser checks cover mappings, frame selection, playback, export and mobile layout. Larger intermediate drawings were replaced, not retained as another renderer.

## Fauna Lab and behavior contracts — September 12, 2026

Added an isolated `/fauna-lab` with 88 original native-pixel frames for house sparrow, rock dove, chicken, sheep, red deer and gray wolf. The lab compares every authored behavior state, animation, mirrored direction, native scale, group size/spacing, flight height, shadows and five backdrops; it exposes the selected flat profile/group JSON and exports individual transparent frames. Settings → Developer opens the lab in a separate tab. No playable-world placement, behavior, save or simulation version changed.

Introduced a small serializable fauna-group contract and subject-owned bird, domestic and temperate-wildlife profiles. Profiles carry semantic habitat weights, settlement tolerance, social organization, activity period, group bounds, alert/cohesion/separation radii, calm/urgent decision cadence, diet, palette and art mapping. `npm run art:fauna` builds an independent 512×198 atlas with binary alpha, limited palettes, unclipped margins and stable anchors. The unlicensed third-party animal folder is not imported. See `FAUNA.md`.

Validation: fauna profile/atlas tests, production build and the Fauna Lab browser check pass. Desktop flight and mobile captures were visually reviewed; the contact sheet is under `artifacts/fauna-lab/`. Unrelated deity and portrait work in the shared checkout was preserved; no commit or deployment.

## Three-quarter portrait renderers B and C — September 12, 2026

The Portrait Lab now compares three renderers on the same recipe. B is a first three-quarter bust on a new canvas-free raster (`src/render/portraits/raster.ts`: polygon fill, spline silhouettes, dithered gradient shading, one-pixel material contours, cast shadows). C rebuilds the head from a proper three-quarter construction: feature midline at two thirds of the face width, profile nose overlapping the far cheek, foreshortened far eye, diagonal near jaw to an off-centre chin, one visible ear, hair weighted to the near side, and shoulders with bare or sleeved upper arms. Both honour every appearance field A does.

C exposes construction offsets (turn, face width, jaw, chin, eyes, nose, mouth, neck, hair volume, shoulders, shadow) as lab sliders with a reset and a JSON readout of non-default values, so tuned defaults can be baked into `constructedDefaults`. The contact sheet follows the selected renderer tab. `scripts/portrait-sheet.ts` renders the twelve studies through B or C to a PNG without a browser.

Validation: typecheck, ten character tests and the Portrait Lab browser check (three stage canvases, recipe edits on all three, slider changes and reset on C, full-page captures per renderer) pass. Not committed.

## Versioned faces and Portrait Lab — September 12, 2026

Character appearances now carry an optional revision-1 semantic face recipe covering eye size/shape/spacing, brows, nose, mouth, chin, hair texture/hairline and facial detail. New characters generate it deterministically; the save schema accepts it while remaining compatible with older appearance records. This is the same appearance object used by the world character, not a second portrait-only identity.

Added a dedicated transparent 64×80 layered pixel portrait renderer and `/portrait-lab`. The lab can inspect live players/NPCs or twelve deterministic studies, edit every facial field, reveal the complete recipe and compare identical inputs through explicit A/B renderer slots. System A is implemented; System B is deliberately registered without a renderer for a separate art pass. Settings → Developer opens the lab against the current world.

Validation: production build, ten focused character tests and two Portrait Lab browser checks pass. They verify deterministic contact sheets, real facial edits, the A/B slot contract, Settings integration with live-world actors and a full-page render. The portrait system is a development study and is not yet selected as the profile-modal renderer. Unrelated name-content work in the shared checkout was preserved; no commit or deployment.

## Connected starts, ecotones and shared borders — September 11, 2026

Normal new-game creation now prepares a permanent bounded map and attaches live travel automatically. Small maps are 304 tiles; dated cities use 384. Older 512-tile contracts remain readable but are not selected for new starts. Catalog places attach to nearby backbone nodes in each available cardinal direction, preserving reciprocal IDs. Land classification searches for a route around bays rather than requiring a straight line over land. Boundary movement chooses a matching land connection along the edge instead of requiring the original marker tile. Guidance is a proximity toast inside the world pane; the camera and terrain/scenery streaming centers stop at the footprint with a narrow visual margin.

New ecology-revision-1 settings blend regional environments and the starting envelope using smooth, warped weights. Moisture, ground and soil colors, tree density and clustered plant selection share those weights. Historical/cultural profiles remain discrete and independent. Inputs without the ecology revision retain the prior selector.

Land connections carry reciprocal sampled boundary profiles for coast/river distances, elevation and trail position. Each connection occupies an edge segment; profiles agree in normalized segment coordinates across differing map sizes. The existing environment generator blends them through a 32-tile apron, leaving the interior sampling unchanged. Trails reach matching boundary positions and suppress obstructing decorative vegetation. This is a compressed geographic connection, not a claim that distant map interiors are contiguous pieces of Earth. Existing procedural waterways away from the apron remain unchanged.

Validation: focused network, crossing, ecology and seam tests pass, including California overland access, directional catalog connections and small/medium boundary agreement. Production build passed. Browser validation and broader coast/rugged-terrain review are recorded with the final delivery. Other-agent water and wading work in this checkout was preserved.

## Wider beaches and shoreward ocean surf — September 11, 2026

Doubled ocean beach baseline again to eight tiles. Extended the calm-water fade to 5–13 tiles offshore and the caustic fade to 8–12. Expanded ocean distance encoding beyond the former eight-tile ceiling while preserving nearshore precision. Ocean crests now use a shore-distance phase, rather than northward world-space advection, and are broader/brighter. Offshore colors animate at two scales with much lower contrast and finer stepped transitions; nearby water also uses finer color steps.

## Shipped shoreline polish, scalloped coasts and quiet offshore water — September 11, 2026

Enabled the approved shoreline polish in ordinary WorldScene. Added bounded, world-anchored ocean-coast displacement, independent outer beach width variation, and doubled base ocean beach width to four tiles. The underlying geographical outline stays intact. Both worker ground and the water mask use the shared coast functions. Removed per-tile ocean surface phase directions, replacing them with coherent offshore drift; fine caustics/crests fade into broad calm forms offshore.

The real-map water study exposes/export scallop depth/size, ocean beach width, outer edge variation and offshore calmness. Its coast preset now centers sea shore specifically. Pure tests verify bounded displacement, zero-amplitude behavior, offshore falloff and matching masks across chunks. Existing live-map comparison/export/arctic tests pass. These are visual shoreline refinements; navigation/terrain classifications are unchanged.

## Shoreline polish in real map context — September 11, 2026

Added a second Water experiments section at `/water-experiments?context=map`, embedding the actual procedural terrain renderer at 2× with pan/zoom. Current C and the opt-in polish share the same seed/map. Controls cover climate, season, water feature, bank transition, low plants, stone clusters and edge wavelets; explicit Apply, pause and JSON export are available.

Polish adds coherent stepped earth/grass transitions, organic edge shapes, brighter shore wash, grouped stones/pebbles, authored low-plant patterns and seasonal colors. Tropical water receives plants and fish; arctic study vegetation is prohibited. Existing map rocks now join the study displacement field, though their footprints are still approximate. Study changes are not globally enabled. Browser checks cover the live map, comparison, Apply, pause, arctic exclusion and exported settings; profile/continuity unit tests also pass.

## Direct bank colors and stepped gradients — September 11, 2026

Added bank-surface, wet-edge and water-contact color pickers, custom-color override toggle, bank tint opacity and wet-edge opacity. Warm golden sand, red stone/clay, gray pebbles and snow/slush are one-click colorways. Clay and pebble variants also recolor rock facets. Removed the random dry-bank speckles. Wet margins now support an optional two-to-eight-color stepped gradient with no dithering; toggling it off restores clean bands. All new values are persisted in URLs and revision-7 JSON exports. The exact user-supplied C preset remains archived and loadable.

Validation: seven browser checks passed, including actual JSON download contents, colors/opacity, gradient toggling/reload, approved preset values, climate/material resolution, foam masking, and earlier controls. Final typecheck passed; preceding climate-bank build passed. Reviewed warm-bank gradient capture and captured red-bank rock recoloring. The previously failing climate selector lookup is fixed with explicit accessible labels. Gameplay integration remains deferred per WATER_EXPERIMENTS.md; no commit/deployment.

## Preferred C and climate bank materials — September 11, 2026

Preserved the user's exact revision-5 JSON in `src/dev/water-experiments/presets/preferred-c.json`. New visits default to its settings and C; Load preferred C restores it without requiring a new URL. Added independent bank climate/material controls, clean wet/contact bands, wet-edge width and bank-lapping strength. Inland banks default to mud, desert inland banks to red clay, and arctic studies to snow; sand remains selectable. No rejected dithering was reintroduced. River shoreline wavelets are thicker at minimum and vary along the bank separately from directional flow.

The preceding beach-width/altitude proxy, foam opacity/thickness/breakup, extra C ripples and rock-aware crest masking/phase deflection also passed their five browser checks and production build. New handoff document `WATER_EXPERIMENTS.md` records the user's intended future map-based resolution from local slope, climate/colorway, season, feature size, weather/wind and time. Those gameplay mappings are explicitly deferred; the approved preset's extra ripples remain on while future gameplay should default them off until weather warrants them.

No playable-world changes, commit or deployment. Unrelated shared-checkout work preserved.

## Clean bank outlines and JSON export — September 11, 2026

Removed the rejected shoreline and bank stippling, restoring clean sand boundaries. Replaced Mud–sand blend with bank-boundary color picker/presets, darkness and opacity controls. Old bankBlend URL values are ignored. Original dark-earth color at full opacity is the default; rock contact-ripple correction remains intact.

Save settings JSON downloads a versioned `uhs-water-study` document with all settings, renderer revision, current comparison view/selected renderer, animation time and source URL for implementation handoff. No save-game changes. Validation: all four water browser tests passed, including parsing the actual downloaded JSON and verifying the selected C renderer, custom boundary values and URL restoration. Typecheck passed. Clean pond boundary capture visually reviewed in `artifacts/water-clean-boundary.png`. No commit or deployment.

## Wet sand and rock contact ripples — September 11, 2026

Added a world-pixel-anchored dithered wet-sand strip at the B/C shoreline. The new Mud–sand blend slider feathers the outer muddy bank into beach sand; zero preserves the hard bank edge, and the setting is restored from study URLs. Rock contact ripples now follow each rendered silhouette's bottom pixels, with a one-to-two-pixel wash, instead of an offset ellipse centered below the rock. Reduced the displaced rock shadow.

Validation: three water browser checks passed; the expanded blend-slider persistence check passed separately. Typecheck passed. Enlarged pond capture visually reviewed for wet sand, bank dithering and rock contact alignment. No playable-renderer changes, commit or deployment.

## Water scenery and sculpted banks — September 11, 2026

Extended the B/C water studies with deterministic, spaced rock and plant placement. Rocks have irregular faceted silhouettes, mineral highlights, moss, contact shadows, broken waterline foam and directional river wakes. Freshwater supports reeds/cattails, lily clusters and occasional flowers; coasts force swaying seaweed. Removed the earlier fixed scattered plant/stone overlay. A precomputed obstacle field bends the moving color coordinates around rocks and, more gently, plants. This is a visual flow approximation, not fluid simulation or gameplay collision.

New URL-persisted controls: rock count and size, plant-cluster count and type, bank height, bank vegetation and shoreline roughness. Available space caps actual placement. Banks now have a textured soil face, shaded foot, grassy lip, clustered ground cover, tufts and sparse flowers. Scenery and bank treatment apply to B/C; A retains its production water rendering. The common shoreline roughness control changes the lab fixture only.

Validation: three browser tests passed for surface motion/stillness, pause, habitats, mobile, control persistence, zero-count removal, coastal plant selection and nonzero rock/plant flow effects. Typecheck passed; production build checked. Enlarged river/coast captures reviewed at `artifacts/water-scenery-{river,coast}.png`. Shared map-travel changes preserved. No commit or deployment.

## Moving water color fields — September 11, 2026

Rebuilt both water experiments after visual feedback and the supplied vivid pixel-art reference. Removed the cached static five-band water base. B now advects a periodic multiscale color-cluster field through a saturated nine-color ramp; irregular horizontal pixel forms move across depth transitions and deep water. C recomputes refracted color forms and warped caustic networks every surface frame, with sharper submerged stones and swaying plants. Replaced the large outlined offshore-wave overlay with crests derived from the moving wave field. Production A and playable water remain unchanged.

Validation: two browser checks passed, including an isolated surface test with no fish, foam or glitter overlays. Between t=1 and t=2, 43% of B and 68% of C deep-water pixels changed visibly; Still produced no changed surface pixels. Tropical and polar palettes differ throughout the sampled water. Pause, habitat controls, reload and mobile checks still pass. Visually reviewed updated comparison and pond captures. The new full surface is more expensive than the previous static base: a short local sample measured maximum surface generation of 7.4 ms B and 14.3 ms C, not a production-scale guarantee. Full-world integration is still deferred. No commit or deployment.

## Water experiments — September 11, 2026

Added `/water-experiments`, linked from Settings → Developer. A runs the existing water raster, motif atlas and shoreline effects on a shared habitat-aware synthetic fixture. B (Pixel tides) uses vivid stepped shelves and quantized drifting ripple patterns; C (Living depths) uses traveling crests, depth-dependent sand transparency, caustics and submerged fish. Both prototypes have lapping shoreline wash, coastal storm droplets, pond splash rings and reflection glitters driven by the existing lighting presets. River, pond, lake and coast fixtures, four climate colorways, intensity, flow, time, clarity, fish/glitter toggles, pause, speed, reset, enlarged inspection and shareable control URLs are available.

These are isolated rendering studies, not a change to the playable renderer. Baseline A retains its original climate mapping and animation timing; new intensity, speed, fish/transparency and glitters apply only to supporting prototypes. Transparency is a composited bed/fish demonstration; fish are visual rather than simulation entities. Coastal waves approach the north shore; river directions are explicit art-test overrides. Full-world integration, terrain/chunk interaction and production-scale performance await selection of a direction.

Validation: browser checks passed for three distinct canvases, animation, stable pause, habitat changes, URL restoration and mobile overflow, with no page errors. Production build passed; final refinements typechecked. Visually reviewed comparison and storm captures in `artifacts/water-experiments-{comparison,storm,pond}.png`. A short local three-panel storm run measured p95 browser frame interval 20.2 ms, B redraw 1.3 ms and C redraw 5.1 ms (A effects-only 0.3 ms is not a like-for-like full raster cost). Unrelated map-travel work preserved; no commit or deployment.

## Live map crossings and preparation — September 10, 2026

The Permanent maps panel now launches the actual game through Play connected maps. Walking outward through a reachable land entrance switches to the permanently connected map and its paired entrance. The traveler, health, carried objects and clock continue; changed actors and objects remain on return within the session. Arrival protection prevents an immediate bounce back. Failed destination preparation leaves the current map intact. Sea exits report the boat requirement.

Nearby land entrances prepare one destination in advance; crossing reuses that preparation. Superseded work is cancelled. Inactive maps retain simulation snapshots rather than engines or renderers; terrain workers and render streams are released on replacement or disposal. Terrain streaming and scenery requests respect the bounded footprint with a rendering apron. Loading pauses the ambient clock. Small remains the default, medium is restricted to dated cities, and large remains unused.

Validation: nine focused permanent-map/travel checks passed, including return-state, inventory, failed arrival, entrance guards, prefetch reuse and cancellation. The live browser check crossed London → Oxford → London, preserving the character, health and a changed object, then waited for terrain readiness. Production build passed. This is available through the geography panel; ordinary unbounded game starts remain unchanged. Persistent multi-map saves and sailing are deferred. The preceding entire worktree, including the other agent's contour material fix, was committed and pushed as fdcc35e before this work.

## Contour material alignment — September 10, 2026

The styled terrain pass now sources displaced surface pixels and bank trim from the appropriate height tier, with a nearest-tier fallback for tall drops. A sparse three-native-pixel material fringe softens natural transitions; exposed faces retain their crisp geometry. Shoreline underpainting no longer spills lower beach sand onto raised grass without a same-tier shore neighbor. Chunk-edge donor textures are cached on demand. Terrain heights, collision and generation are unchanged; the unstyled shoreline path is preserved.

Validation: 26 focused terrain/material/habitat/water checks passed across the final targeted runs; TypeScript build checks passed. A browser lake fixture checks opaque coverage and was visually reviewed, alongside a live riverbank capture. The fixture no longer shows the detached shoreline strips. Review image: `artifacts/terrain-material-bank.png`. No commit or push.

## Permanent maps and bounded preparation — September 10, 2026

Added a destination-independent global playable-map network in the existing geography panel. A deterministic sparse land backbone coarsens H3 resolution-2 cells only over land; ocean groups use separate basin spacing. Catalog places attach locally with stable IDs, and nearby places connect without a destination query. Reciprocal connection IDs survive date changes and independent inspections. Following a connection resolves its underlying path through the existing geographic router. Fine shoreline checks distinguish coastal/island anchors from the coarse routing mask.

The Permanent maps panel lets users pick a place, follow connections, return, and generate its bounded terrain. Small (384 tiles) is the default, dated cities use medium (512), and large is reserved. The original route-spacing inspector remains available below; its route-specific proposals are not the permanent network.

The existing generator accepts an optional playableMap contract, restricts regional settlement planning to fitting sites, blocks movement outside the footprint, and retains a rendering apron for natural terrain sampling. Dated/unresearched landscape previews suppress named habitation; city previews retain the existing settlement generator. A worker-prepared flood fill finds reachable boundary entrances or shore access, preserving connection IDs and paths from spawn. Unreachable entrances are reported explicitly. A visual mask shows the finite footprint without altering its Earth coastline or relief. Live crossing is still stage 3.

Validation: 15 permanent-map and existing travel tests passed; browser follow/return and bounded London checks passed. Build passed. Remaining geographic limitations include coarse routing barriers and polar local generation beyond ±85°; ocean local previews remain reserved for vessel gameplay. No commit or push. Unrelated terrain-style work in the checkout was preserved.

## Boreal palette and differentiated vegetation — September 10, 2026

Replaced the overly blue boreal ground with moss/olive greens and warmer forest-floor tones. Boreal turf marks now form sparser patches. Added savanna, steppe and alpine vegetation profiles without new climate IDs: open grass colonies and scattered trees, mostly treeless dry grass with wet refuges, and treeless low alpine plants with exposed mineral ground. Automatic selection uses existing latitude, moisture and relief inputs; the high-mountain threshold is a local proxy, not a measured treeline. The terrain lab exposes an explicit Vegetation pattern override and restores it from shared URLs.

Generation changes are pinned to vegetation revision 6 for new worlds. Older revisions retain their existing placement rules. Existing plant assets and terrain geometry are reused; ground raster patterns and palettes carry the visual distinction. No global name data is used as a historical vegetation map.

Validation: 15 vegetation/composition/habitat tests passed, including old-revision selection and alpine exclusions. Two browser checks passed for boreal rendering and the three explicit profiles; captures visually reviewed. See TRAVEL.md for the five remaining implementation stages, beginning with a permanent destination-independent playable network in the existing geography panel. No commit or push.

## Geographic preview environments and ecological color — September 10, 2026

Geography previews now resolve their own coordinate-based climate, relief and ecology using the existing regional climate rule and dated profiles, instead of inheriting a nearby catalog city's environment. The inspector distinguishes the actual atlas shoreline from the coarse routing mask, allowing small island anchors to be previewed even when their routing cell is water. Existing Earth sampling supports maps surrounded by water; no new island terrain recipe was needed. The fully zoomed-out preview requires time to stream terrain, so browser captures now wait for terrain readiness at the normal review zoom.

Ground palettes now distinguish amber scrub, cooler boreal woodland, deeper tropical vegetation, muted tundra, golden Sahara and stronger terracotta red desert. Red desert roads and banks share the warmer palette; woodland floor colors appear at lower cover thresholds. These are rendering changes only; world topology, generated objects, coastlines, movement and saved simulation state are unchanged. No new climate IDs were added. The procedural terrain lab now uses configured geography for unnamed studies so selected ecology, population, water and colorway reach the generator; explicit place studies retain Earth geography. Shared URLs now restore colorway.

Validation: 18 travel/environment/naming tests, 13 regional/environment tests and four habitat rendering tests passed. Seven geography browser checks passed before the visual palette update; the dry-map and island browser check passed again afterward with terrain-ready captures. Production build passed. Earlier extreme-zoom capture timed out while streaming and was interrupted by development reload; normal-zoom captures show dry terrain and island coastline correctly. No commit or push.

## Global geographic naming and 500 km default — September 10, 2026

Travel naming now resolves globally from 1,332 imported Natural Earth physical/marine records and RESOLVE Ecoregions 2017 regional fallbacks. Offline importers pin source checksums and licenses, preserve source identities and full ecological labels, and compile approximately 4 MB of data. No runtime model or network calls are needed. Modern ecological names are explicit regional labels, not historical vegetation assertions. Existing terrain, rendering and geographic paths remain unchanged.

The workshop includes an on-demand global naming audit and clickable coverage overlay. Its 3,318 distinct catalog/globe samples include 1,660 land cells, with five unresolved land labels exposed explicitly. Source geometry and coarse coastlines can disagree. Unresearched city endpoints now show named landscapes rather than generic city-area labels. Data refinements remain independent of H3 map identity and dated settlement coverage. See TRAVEL.md.

User review approved the system and selected 500 km as the default land spacing; presets now use that value while explicit shared URLs retain their settings. Ocean spacing remains separate. User authorized committing and pushing all current worktree changes, including the existing movement, terrain and performance work and review artifacts.

Validation: 21 focused travel, naming, movement and runtime tests passed; six production-browser checks passed after restarting the stopped preview server. Production build passed with the existing bundle advisory. Global naming coverage and route screenshots were visually reviewed.

## Ocean compression and landscape names — September 10, 2026

Open-water compression now uses distinct spacing across all five oceans and selected marginal seas, independent of the land slider. Geographic paths, requested stops, and coastal transfers remain intact. Ocean names use fixed sectors rather than route-relative numbers. London–El Paso at 180 km land spacing now produces 28 maps, including five water maps with coastal approaches.

Added compact, stable-ID US landscape polygons based on a simplified interpretation of USGS physiographic regions. Southern routes now name coastal plains, Mississippi landscapes, Piney Woods, Texas prairies, Edwards Plateau and Chihuahuan Desert; sustained region transitions are retained in compression. Global land naming remains incomplete. Existing terrain generation and renderer behavior are unchanged. See TRAVEL.md for spacing values, sources and boundary limitations.

Validation: ten travel tests and five production-browser checks passed; ocean tests cover Atlantic, Pacific, Indian, Arctic and Southern passages independently of land spacing. Production build passed with the existing bundle advisory. Visually reviewed artifacts/geography/london-el-paso.png. No commit or deployment.

## Mixed land and sea journeys — September 10, 2026

The geography panel now defaults to combined land/sea routing, with optional walking-only and sea-only restrictions. Shared routing permits sampled coastal transfers with a modest transfer penalty; there is no route-distance or search-expansion cutoff. Compression retains departure/landfall and adjacent sea stops. Blue sailing sections and boat-required labels distinguish transport; nominal walking excludes ocean maps. Named settlement endpoints use land cells. Existing game terrain, renderer and boat gameplay are unchanged.

Endpoint changes clear preset waypoints; failed queries clear obsolete results and stop the loading indicator. All statistics hide during recalculation. Explicit mode URLs remain respected. Coastal transfer locations remain approximate at the existing atlas resolution. See TRAVEL.md.

Validation: eight travel unit tests passed, including transoceanic Matamoros–Dalian, reciprocal return paths, retained transfers, inland walking and Iceland mixed travel. Production build passed with the existing bundle advisory. Four production-browser checks passed, including transoceanic routing, mode persistence, waypoint clearing, error recovery, and the existing terrain preview. Pacific-spanning visual review also exposed and fixed wrapped coastline polygons. Screenshot: artifacts/geography/mixed-ocean.png.

## Geography workshop and travel foundation — September 10, 2026

Added `/geography-lab`, linked from Settings → Developer, with an isolated production preview on port 5186. The panel uses a shared global H3 resolution-4 graph, existing atlas land/sea masking, reciprocal terrain-aware routing in a worker, and adjustable proposed-stop compression. British (London → Oxford → Edinburgh), illustrative Morocco → Cairo → Delhi, and Iceland sea queries are presets; arbitrary catalog endpoints and via locations remain editable. Default review journeys contain 8 and 39 stops respectively.

Compact regional travel files supply short landscape names and explicit inferred settlement coverage windows. Geographic IDs survive date changes; missing settlement coverage shows the landscape without asserting a named town. Earth pan/zoom, route/cell overlays, compass-labeled neighbors, shareable URLs and mobile layout are implemented. A lazy local preview uses the existing generator and WorldScene with 384/512/640-tile boundary overlays. Existing terrain generation, live movement and saves are unchanged; unrelated shared-checkout work was preserved.

Scope: the underlying geographic graph is shared, but stop compression is still a route-review proposal, not the finalized global playable-stop network. Actual boundary crossing, dated historical roads, comprehensive settlement dates and climate refinement remain pending. Coarse coastline routing and anchor snapping are visible limitations. See `TRAVEL.md` for contracts and next integration decisions.

Validation: six focused travel tests and three production-browser checks passed, covering dates, reciprocal routing, compression, island/sea behavior, polar identities, invalid inputs, UI changes, mobile/share state, and the existing terrain renderer/boundary overlay. Production build passed with the existing bundle advisory. Captures are in `artifacts/geography/`. No commit or deployment.

## Space jump/pickup/drop and Shift running — September 10, 2026

Space now drops a held item first, picks up a nearby portable prop second, and otherwise charges a jump. A quick release jumps up to two tiles in 260 ms; holding 240 ms launches one three-tile jump in 300 ms, with a two-altitude-level rise limit rather than one. Aim follows held movement keys or facing direction. Holding Space does not repeat jumps, and menus, text focus and blur cancel pending input. Shift moves at an 85 ms base cadence versus 140 ms walking; new run commands also use less simulation time per step. F retains striking and X throws in the movement/facing direction; E and G remain available. Hints and PROPS.md updated.

New explicit jump/run command fields preserve the old movement/traversal path. Charged jumps require a dry landing, cannot cross solid props, walls or blocked diagonal corners, and reject carrying at the engine boundary. Source changes preserve the earlier uncommitted portrait/visibility work.

Validation: 21 focused movement, terrain and runtime tests passed. Browser input checks passed for tap/hold distance, one jump per hold, pickup/drop priority, text-focus cancellation and faster running, including three repeated runs and a final run with an input fixture away from doorways. Visually reviewed the updated game controls. Production build passed with the existing bundle advisory. No commit or deployment.

## Portrait caching and observation visibility — September 10, 2026

Repaired `measure:performance` for the splash → starting-details → Begin flow. Benchmark UUIDs are deterministic so before/after runs use identical world manifests. Sidebar character sprites now retain their rendered output across value-identical observations and share a bounded 128-entry source/crop cache. Appearance changes invalidate the rendered output; bust/full-body changes reuse the source pixels. Observation visibility gathers nearby building candidates once per call, retaining the existing line-of-sight rules and avoiding persistent world caches.

Validation: four runtime tests passed, including visibility equivalence across movement, interiors and building additions/removals. Browser portrait checks verified pixel identity, reuse across remounts/mode switches, and appearance invalidation. Production build and final typecheck passed (existing bundle advisory). Both production benchmark scenarios completed without browser errors and with identical before/after manifests; visually reviewed Alexandria captures. Command p95: Anatolia 2.2→1.7 ms, Alexandria 2.3→2.3 ms; frame p95 remained about 16.7 ms. These single-run timings are indicative, not a reliable FPS gain. A focused same-world Alexandria observation measurement was 0.37→0.27 ms with 210 places and 290 actors. Reports/captures: `artifacts/performance/portrait-visibility-{before,after}*`. No commit/deployment; unrelated artifacts preserved.

## Random-start names without numeric placeholders — September 8, 2026

Fixed the uncovered-context path exposed by Amazon basin 1400: it no longer produces `Resident NNNNNN`. Players and NPCs receive repeatable invented personal names from a shared fictional syllable set when no scoped naming kit applies. Provenance explicitly says these are not attested local names, translations or recovered languages. Researched/scoped naming kits still take precedence, and custom names are preserved. This is not new researched Amazonian coverage.

Removed internal regional-art/fallback labels from the start card. Uncovered names show a short “Invented name” note with an explanatory tooltip; fuller evidence remains in the existing source/provenance views. Random selection retains all its settings instead of hiding uncovered regions.

Validation: ten focused generation tests passed, including every featured start and a 96-person uncovered population. Browser checks passed for the exact Amazon 1400 setup/play path and 100 random starts plus visible random-card checks. Production build passed with the existing bundle advisory. No commit or deployment; other shared-checkout changes preserved.

## Distinct habitat plants and quieter inland tropical composition — September 8, 2026

Added native bamboo (64×96), upright teak-like tree (88×128), wetland sedge and dry bunchgrass (28×24) through `scripts/art/habitat_plants.py`. The lab has 42 plant-related assets; all 24 nature additions have precomputed lighting masks (144 total). Native palette, alpha and margin assertions pass. Inland South/Southeast Asian tropical mixes favor deciduous tree forms and bamboo; palms and flowering ginger are rarer. FAO references and the limitations of these broad regional interpretations are recorded in `VEGETATION.md`.

New worlds use vegetation revision 4, with wider crown spacing, lower tree/understory retention and a shared low-frequency clearing mask. Fixed inland tropical sample drops from 157 trees / 77 low plants to 50 / 25 versus revision 3. Existing revision rules, native pixel scale, canopy fading and plant inspection remain supported. Corrected the terrain schema's inadvertently broadened accepted revisions back to its implemented 1/2 values; vegetation revisions remain separate.

Production build and eight unit checks passed. Browser checks cover the gallery, Settings, four ecologies, normal Korean game/minimap and a Burmese scene containing both new tree silhouettes. Reviewed `artifacts/nature-lab/habitat-plants.png` and `burma-quiet.png`. Unrelated work preserved; no commit/deployment.

## Contextual character generation and naming conventions — September 8, 2026

New procedural starts pin `characterRevision: 1` and share a deterministic player/NPC pipeline for scoped names, appearance, eligible livelihoods and starting supplies. Flat regional/community profiles replace unrelated Roman defaults on this path; missing naming coverage is explicit. Household members use the same palette and naming rules, and field/pen assignments respect actual livelihoods. Existing customized appearances and unpinned input paths are preserved. Rendering remains independent of cultural-family branches.

Initial content covers Congo Basin and precolonial Australian appearance scenarios, distinct English-colonial/Indigenous/African-descended Virginia contexts, qualified regional art defaults, and scoped naming samples. World setup exposes Virginia community choice. Names support complete personal sequences, family-first, family-last and two-family formats; children can inherit appropriate family components without forcing shared surnames on partners. Burmese interior 1350 uses an openly hypothetical naming reconstruction rather than numbered residents. Chinese earlier components and Spanish date coverage retain explicit qualifications; coverage is not comprehensive.

Sidebar portraits and nearby-person icons now paint the actual appearance recipe, fixing the independent legacy-complexion mismatch. Removed the default zero-obsidian wealth line for contextual characters without currency. Evidence UI now distinguishes fictional choices and hypotheses from inference/documentation. Three Luna agents contributed bounded content and tests; their outputs were reviewed and corrected before integration.

Validation: 17 focused character/generation unit tests passed; 11,646 place/date contexts resolved without rule conflicts. Four browser starts (Burma, Congo, Australia, Virginia) passed through the real setup/worker/runtime path, including name preservation, community selection, visible actor provenance and matching sidebar/world complexion; captures are `artifacts/characters/context-*.png`. Focused layout, pen collision and herder-duty checks passed after updating the latter's fixture seed for the changed generated population. Two additional production-browser checks passed for the Roman and Korean opening scenarios (isolated from development hot reload). Production build passed with the existing bundle-size advisory. See `CHARACTER_GENERATION.md` for contracts, sources, interpretation and remaining scope. No commit or deployment; unrelated shared-checkout work preserved.

## Quieter vegetation, small shrubs and plant focus — September 8, 2026

New worlds and terrain previews use vegetation revision 3, with wider crown spacing plus a further 20% tree thinning. Low scenery is reduced across all biomes, including open ground and dry thorn scrub; the final pass halves the first adjustment's shrub/flower retention. Fixed temperate sample: 202→138 trees and 221→44 low plants compared with revision 2. Dry scrub sample: 45→37 trees and 238→44 low plants. Older revision behavior stays intact.

Added four original native pixel shrubs in `scripts/art/small_shrubs.py`: small dry scrub (24×20), medium dry scrub (32×24), low leafy shrub (24×20), and low heath (28×22). Small/medium/large dry shrubs use a 60/30/10 mix; most heath and many fern/bush candidates also use smaller silhouettes, without adding spawn sites. Nature lab now has 38 plant-related assets and the nature atlas has 120 prebuilt lighting masks. No image resampling is used for world sprites.

Plant sprites now support opaque-pixel selection and engine-backed inspection, showing their name, description and sprite in the existing In focus sidebar. This does not advance time or start walking. Production build, seven unit checks, and four final browser checks passed (lab/settings and actual tree/shrub clicks); canopy fading also passed after revision 3 density changes. Reviewed small shrub artwork and the final focus scene. See `VEGETATION.md` and `artifacts/nature-lab/plant-focus-shrub.png`. Unrelated work preserved; no commit/deployment.

## Native broadleaf ages and crown-aware woodland composition — September 8, 2026

New worlds use vegetation revision 2. Added four independently authored broadleaf sizes (48×64, 72×96, 112×144, 144×192), visible under Broadleaf ages in the nature lab. World rendering keeps native pixel scale. Bounded deterministic crown-aware thinning gives large trees more space while preserving habitat groves; settlement edges receive additional clearance and thinning. The fixed tropical composition sample now has 494 trees versus 1,154 previously. Woodland understory is reduced and forest-floor litter added.

Large crowns fade when they obscure the player, retaining opaque lower trunks and precomputed shadows. Earlier vegetation revisions preserve their placement behavior. See `VEGETATION.md`. Production build, 11 focused unit/preparation tests, and eight browser checks passed, including four ecology scenes, normal game/minimap, lab/settings, and canopy fade/restore at native scale. Final rounded crown artwork and tropical composition capture visually reviewed. No commit/deployment; unrelated shared-checkout edits preserved.

## Habitat vegetation integrated into new worlds — September 8, 2026

New sessions pin `vegetationRevision: 1` and use content-owned tree mixes plus habitat-conditioned understory. All twelve native additions now appear through generator-v3 vegetation: conifers/birch in boreal woodland, pine/oak in temperate woodland, freshwater willow, tropical broadleaf/palm, regional Sahel thorn, dry scrub, and habitat/regional fern, heath, sagebrush and ginger. Existing road/water/field exclusions remain; low plants are nonblocking. Courtyard tree pools follow ecology. Existing manifests without the revision retain original selection.

WorldScene and the minimap load the nature atlas. Added 72 precomputed lighting masks with native origins and terrain lift; no per-frame pixel processing. See `VEGETATION.md` for ownership, interpretation limits and reproduction. Production build, eight unit/preparation checks, and five browser checks passed, including four ecology scenes and a normal Korean game/minimap. Browser captures: `artifacts/nature-lab/map-*.png`. No commit/deployment; unrelated work preserved.

Visual follow-up identified with the user: broad crowns still inherit the old dense candidate spacing and have only one mature size. Next work should distinguish tree age/size, use crown-aware spacing and lower settlement-edge density while retaining native pixel scale.

## Four understory pixel-art studies — September 8, 2026

Added woodland fern, flowering heath, sagebrush (each 48×40), and tropical flowering ginger (48×56) through the subject-specific `scripts/art/nature_understory.py` recipes. Their pinnate fronds, pink bell sprays, silver lobed leaves and broad leaves/red bracts provide different visual forms for future habitat composition. These are visual studies, not species-distribution claims or new world placement rules.

The nature lab now shows 30 plant-related assets, with these four under New understory. `npm run art:nature` builds all 12 additions, preserving native pixels, binary transparency, limited palettes and unclipped margins. Production build and both nature/settings browser checks passed, including selection of all four additions. Reviewed `artifacts/nature-lab/ginger-preview.png` and `understory.png`. No commit or deployment; unrelated work preserved.

## Birch, tropical broadleaf, willow and thorn scrub — September 8, 2026

Added four more original native pixel-art studies to the nature atlas: silver birch (64×88), tropical broadleaf (96×96), riverside willow (88×88), and dry thorn scrub (56×40). Pale scarred bark, buttress roots, hanging leaf curtains and low thorny stems supply distinct silhouettes. The lab now lists 26 plant-related assets, separates the new shrub category, and uses the same sprite preview/export path. Existing ecological placement remains unchanged.

Rebuild with `npm run art:nature`; all eight new assets pass palette, binary-alpha and unclipped-margin assertions. The comparison sheet now supports two rows; `artifacts/nature-lab/second-plants.png` shows this batch. Production build and nature/settings browser checks passed, including selection of all four additions. Unrelated work preserved; no commit or deployment.

## Four native pixel-art tree studies — September 8, 2026

Added feather palm (80×96), spreading pine (80×88), boreal spruce (64×96), and Sahel thorn (88×80) to the nature lab, with the new trees listed first. These are original integer-grid drawing recipes in `scripts/art/nature_trees.py`, using opaque limited palettes, authored branch/crown arrangements and seeded interior leaf plates. Generated concept images were superseded after the user's direction to author native pixel art; no generated image pixels are included. Native assets and a separate atlas live in `public/nature/`; rebuild with `npm run art:nature`. Existing world vegetation and ecological selection remain unchanged pending visual review.

The shared Sprite component and lab metadata/export use the new atlas. Increased thumbnail height to accommodate the taller silhouettes. Build-time checks enforce binary alpha, at most 24 colors and transparent margins. Production build and the two nature/settings browser checks passed; reviewed the four-tree comparison at `artifacts/nature-lab/new-trees.png`. No commit or deployment; unrelated work preserved.

## Nature asset lab and tabbed Settings — September 8, 2026

Added `/nature-lab`, available through Settings → Developer → Plants & animals. The lazy-loaded viewer uses the production atlases and shared Sprite component for 18 plant/crop/harvest/debris assets and four two-frame animals. It provides search, pixel scales, five background swatches, manual/animated animal frames, dimensions/frame IDs and native transparent PNG export. It opens in a separate tab so the active world remains open; previews show raw sprites, not world lighting or ecological placement. No new plant artwork or generation changes.

Settings now uses splash-aligned navy gradients, lavender double borders and gold selections, with keyboard-accessible Display, Audio, Journeys and Developer tabs. Existing actions remain available; the developer tab also exposes the terrain lab. Production build and two browser checks passed, including gallery frames/export, tab navigation, opening the lab from a live Korean setting and mobile overflow. Visual captures: `artifacts/nature-lab/`. Unrelated shared-checkout work preserved; no commit or deployment.

## Compact World Weaver and shared random-start previews — September 8, 2026

Reduced the World Weaver heading, controls, map, and spacing to fit a 1280×720 viewport, with a sticky Begin row on smaller windows. Splash and modal now share brass accents and a compact character/place/date preview. Splash Random start cycles previews without generating a world; Begin uses the selected setting and seed. Opening the modal preserves that selection. New populated characters carry an optional appearance seed, consumed at session creation for randomized appearance and the existing wardrobe kit; earlier settings without it retain prior behavior. Names, roles, and initial needs stay in the selected setting.

Production build, character tests, and laptop visual checks completed. Browser coverage exercises preview cycling, selected-character identity through the modal and direct Begin, distinct generated appearances, scenario starts, typed prompts, and reload behavior. Captures: `artifacts/splash/weaver-compact.png` and `random-preview.png`. Unrelated shared-checkout edits preserved.

## Material mixes within cities — September 8, 2026

Paving now uses compact, content-owned mixes by street role, with a stable selection per route, square or frontage. New urban worlds distinguish basalt, rounded cobbles, dressed granite blocks, brick, warm-gray slabs and earth lanes. Squares and footways honor the chosen material instead of forcing slabs. Earlier trunk surfaces survive access-lane intersections. Unprofiled settings use slabs as the fallback rather than a worldwide year-based material progression; dated Italian/European profiles and a nineteenth-century NYC mix provide local interpretations. NYC granite blocks have an official Street Design Manual reference; proportions and placement remain artistic inference. Renderer branches only on material, not culture, and routes/collisions remain unchanged.

Validation: production build, 12 focused street/urban/road checks, and three production city browser checks passed. Browser sampling confirmed basalt/cobble/slab/soil in Rome and granite/cobble/brick/slab/soil in NYC. Reproducible captures use `scripts/capture-paving.ts`.

## Compact splash layout — September 8, 2026

Removed the unsolicited geography/rules and browser-saving footer copy. Reduced the splash to an 840px composition with smaller logo, type, controls, and scenario icons; centered it with larger surrounding margins. Existing structure, custom tagline, About credit, and glint remain. Checked desktop/mobile rendering, About behavior, reduced motion, TypeScript, and whitespace.

## Splash logotype polish and About — September 8, 2026

Removed the logo backdrop with an SVG alpha filter that preserves the source image. Added a brief stepped pixel glint on the capital H every 14 seconds, disabled by reduced-motion preferences. Replaced the tagline with “An experiment in teachably imperfect historical simulations.” About expands inline to credit Benjamin Breen and link to the configured GitHub repository. Desktop/mobile captures updated; browser checks verified expansion, repository URL, reduced-motion behavior, no horizontal overflow, and no runtime errors. TypeScript and whitespace checks passed. The opening flow previously passed all seven production-browser checks, including all four scenarios, typed requests, random starts, and reload behavior.

## Opening splash and playable scenario selection — September 8, 2026

The normal entry route now opens a responsive splash using the supplied `logotype uhs.png` (served unchanged from `public/brand/uhs.png`). No simulation is prepared until Begin, Random start, or a scenario is selected. Prompt details carry into World Weaver; unmatched requests remain editable. Random start creates a fresh seeded character/world; reload returns to the splash with no local game persistence. The scenario cards explicitly resolve a Neolithic hunter in Konya (7000 BCE), legionary in Umbria (20 BCE), farmer in Seoul (1750), and free Black farmer in Haiti (1820). These are playable generated settings, not scripted historical reenactments. Orbital survival and a Brutus/Forum event were replaced by supported Earth-based starts rather than advertised as implemented mechanics. Added local Hunter prompt recognition.

The splash includes loading/cancel/error states, keyboard-accessible details, and working method/help panels. Scenario definitions remain in geographic content; generation uses the shared preparation path. Developer lab routes are preserved. Visual captures: `artifacts/splash/desktop.png` and `mobile.png`. Validation is covered by `tests/browser/splash.spec.ts`; production build and TypeScript checks passed. Unrelated shared-checkout changes remain intact.

## Urban blocks, civic squares and v1-inspired paving — September 8, 2026

New worlds pin `urbanRevision: 1` for larger modular urban ranges, shared frontage, bounded block streets, compact neighborhoods, enclosed courts, planted corners, footways and civic squares. A civic hall faces its public square; water, a brazier and explicit market counters occupy the square, and residents use it as a social destination. Civic halls support public entry/exit without creating a household. New urban sites no longer inherit the eight-building secondary-settlement cap. Existing regional clustered layouts remain explicit choices.

Shared content-owned forms drive width, storeys, window bays, roofs, materials, awnings and civic colonnades. Original frames remain available. Larger footprints are included in scenery culling. Atlases repack wider within a 4096-pixel limit; unused civic/material combinations are not compiled. The ground renderer preserves intentionally cleared block areas. The final user-requested paving revision carries forward the original Roman map's warm-gray flagstones, clipped corners, quiet face variation and short highlights, with world-coordinate joints across chunks.

Dated civic profiles provide qualified Italian basilica/square and English market-hall interpretations; other settings explicitly use fictional meeting halls in their existing architectural materials. This is a reusable neighborhood grammar, not a surveyed reconstruction or a civic/economic simulation. Permanent era boundaries and legacy generation inputs are unchanged; no save restoration work.

Validation: production build; 14 focused unit checks across urban composition, streets, road networks, rendering, six settlement forms and prop behavior; three production Chrome city checks (Roman, timber and earthen). Verified civic entry/exit, reachable destinations, non-overlapping footprints, preserved market-counter frames, and missing-frame checks. The final Roman cadence sample measured p95 16.8 ms; an earlier run measured 33.4 ms, so timings remain host-dependent. A normal Earth-mode Rome 100 BCE seed generated 34 buildings including its civic hall. The initial London art fixture resolved to Westminster's independently scoped clustered layout; the timber renderer check uses a controlled study instead.

See `CITY_ART.md`, `scripts/check-cities.ts`, `scripts/capture-cities.ts`, and `artifacts/cities/`. Unrelated road, character, performance and UI work is preserved. No commit or deployment.

## Sparse road network and continuous joins — September 8, 2026

Implemented new-world `roadRevision: 1`: sparse regional connection selection, deterministic batches that reuse corridors/crossings, fewer hamlet lanes, single-search access to road centerlines, smaller doorstep wear and softer narrow footpaths. Removed separate drawn yard-service routes while retaining access validation. Unified duplicate drawing edges and fixed the paired semicircle junction defect by joining centerlines rather than painted shoulders. Clear level approaches can straighten without crossing solids/water; bridge searches resolve narrow decks at unit steps and retain reused deck geometry.

Validation: 17 focused road/render tests and three existing settlement layout/routing/crossing checks passed; production build passed with the existing bundle advisory. Production Chrome preview and eight gameplay steps across the revised junction passed without page errors. The older movement browser test expects immediate gameplay on `/` and fails against the current world-creation screen; the shared dev server restarted during the procedural browser test. The isolated production capture avoids those harness issues. See `artifacts/roads/after-junction.png`, `after.json`, and `comparison.json`; reproduction scripts and scope are documented in `SETTLEMENTS.md`. No commit/deployment; unrelated ongoing city, graphics and runtime work preserved.

## World Weaver layout and fresh starts — September 8, 2026

Restyled world creation around the supplied navy-and-gold reference, with mode cards, prompt presets, editable place/year/layout/role, atlas preview, and a centered Begin action. Responsive details stack on phones. Each page load now prepares a fresh featured place/date with a random seed and character; Random start uses the same generator. Browser restore, autosave, writer locks, and Save now are disconnected. Existing stored data is untouched and file import/export remains explicit.

Validation: production build and five focused world-generation tests passed. Chrome exercised prompt selection, role editing, Begin, reload (different seed and character), and a 390px viewport with no horizontal overflow or runtime errors. Existing unrelated worktree changes preserved.

## Final character contour, width and breathing polish — September 8, 2026

Removed idle head turns. The playable character now uses a slow four-second breathing pose with one-pixel shoulder/chest movement and fixed head, feet and prop grips; the lab exposes the pose for inspection. Tightened side-view hand travel to ±2px and lift to 1px, retaining opposing leg movement. Skin contours are darker brown/plum; lower/right outlines have cooler shadow hues while clothes/hair keep their own ramps. Default build −1 narrows the torso one native pixel, keeps earlier widths available, and weights adult generation toward narrow builds. Heights are unchanged.

Eight character unit tests and seven browser tests passed, including stable breathing anchors, no idle head turns, width difference, carrying, crisp alpha and time-of-day shadows. Review `artifacts/characters/final-polish.png` and `scripts/capture-character-polish.ts`. Unrelated performance/world work is preserved.

## Performance, viewport visibility and organic NPC motion — September 8, 2026

Implemented cancellable worker world preparation with warmed-worker handoff to terrain rendering; lazy gameplay/lab imports and tile workers; offline atlas indexes; shared geography modules; explicit chunk resource ownership; padded minimap caching; reused observations; coalesced snapshot creation; guarded frame setters; CPU-backed character canvases; and incremental derived-cache eviction. Existing generator/version behavior remains supported. See `PERFORMANCE.md` for module ownership, reproduction commands, results and limits.

Fixed on-screen NPC/object popping by separating viewport rendering from the 19-tile knowledge radius. A padded camera rectangle determines drawing; other interiors and offscreen entities remain excluded. Seeded NPC tween delays/durations soften synchronized steps while preserving authoritative timing and state. Player controls keep their existing response.

Against `a00d0dc`, local production Alexandria selection-to-terrain fell from 9.16 s to 5.68 s and its longest startup task from 3.66 s to 0.61 s. Anatolia preview fell from 2.32 s to 1.85 s. Steady cadence remains about 60 FPS; command-time improvements are not consistent. Gameplay bundle size and initial scenery work remain follow-ups. Production build, 48 focused unit tests, and character/movement/viewport/terrain/procedural/water browser checks passed. Changes are in the worktree for review; no new commit or deployment.

## Reviewed character checkpoint and v2 integration — September 8, 2026

User requested review, commit and push of the current worktree into `origin/v2`, including the existing `codex/character-lab` checkpoint. Remote `v2` was at `96edf47`; `222f0b7` is its direct descendant and contains the terrain/art work. This checkpoint adds the complete character lab, body/face/clothing variants, carried-object presentation, dynamic human shadows, village study, recipes and captures. It also includes the performance review and the two supplied UI reference mockups. Those mockups remain reference assets, not implemented character/belief panels.

Reviewed the pending code and visual studies. Production TypeScript/Vite build, 20 focused character/prop/movement/rendering/lighting unit tests, nine character/prop/movement browser checks, and whitespace validation passed. The existing bundle advisory and performance-review follow-ups remain; no performance refactor or save-restoration work was included. The branch integrates by fast-forward, preserving the existing history and leaving remote `main` untouched.

## Character silhouettes, faces and time-of-day grounding — September 8, 2026

Added five head/jaw choices, weighted age/physique face defaults with explicit overrides, tapered/rounded bodies, continuous garment shading, eight clothing silhouettes, sleeve/hem/drape choices and six resting postures. Default actor clothing now uses small content-owned generic wardrobe kits; explicit worn appearance remains authoritative. These are qualified art defaults, not researched costume reconstructions. Strength/profile values are appearance metadata rather than a new simulation statistic.

Human shadows now derive from each composed pose and carried object, use the existing six time-of-day directions/opacities, and retain a compact foot contact at night. Frame and shadow textures share bounded scene caches. Character Lab adds all controls plus a six-person production WorldScene study with time-of-day selection. Original adult height and age-limited smaller sizes are preserved. Verified morning/midday/dusk/night captures in `artifacts/characters/village-*.png`.

Validation: production build, 15 character/prop unit tests and eight browser tests passed, including face variety, crisp pixels, live clock-driven shadows, carried-object shadow changes, age sizes, pickup/swing/drop and clothing customization. Character work remains uncommitted for review; unrelated worktree files are untouched.

## Adult height defaults and smaller children — September 8, 2026

Restored the original sprite height as the ordinary adult default. Deterministic adult art weights are 80% original, 10% short (−3px), 9% tall (+3px), 1% tallest (+6px). Added −6px for children under six only, and −3px for older children and short adults. Existing age data now reaches the renderer; cached appearance resolution tracks age. Explicit adult heights remain selectable, but in-game customization and presentation prevent adult use of the under-six size.

The lab has an age input for its preview and generated population, with age-appropriate height choices. Smaller bodies retain the native pixel grid and common foot anchor. Child population studies default to the original width and no beard. See `artifacts/characters/heights.png` and `scripts/capture-character-heights.ts`. Six focused unit tests and five character browser checks passed, covering the age-six boundary, distribution, editor controls and actual pixel-height differences. No generation or simulation-age changes.

## Character lab, appearance and carrying — September 8, 2026

Checkpointed the complete prior worktree as `222f0b7` and pushed it to `origin/codex/character-lab`. Remote `main` contains the older UHS project with unrelated history; it was preserved.

Added `/character-lab` and an in-game editor (Settings or ⌘3/Ctrl+3), seeded batches up to 192 people, independent native-pixel heights/builds, complexion/hair/facial-hair variation, explicit worn garments/colors/accessories, four-direction pose sheets, frame stepping, JSON import/export, PNG exports and recipe links. The lab and world share one pixel painter. All portable props have hand-attached presentations; pickup, strike/air swing and drop are visible. Explicit appearance/clothing can be applied to player or NPCs. Legacy actors retain their tunic palette through a deterministic presentation fallback; generation and historical boundaries are unchanged.

The reference-guided refinement adds actual side-profile anatomy, opposing arm/leg strides, elbow bends, palm clusters, and continuous torso/sleeve masks. Material-colored outlines are strong and hue-preserving. Shoulder pieces are merged before outlining; cuffs do not create detached rectangular caps. Art is original code-authored work, not extracted Stardew assets.

Validation: production build, 12 focused unit tests and six character/prop browser checks passed. Reviewed four-direction walks, the complete carrying study and a green-shirt character in the world. The existing large-bundle build advisory remains.

See `CHARACTERS.md` for controls, architecture, supported gameplay animation, review scripts and limits. Historical wardrobe selection and new action mechanics are not implied by the unrestricted art studies. New character work is uncommitted for review.

## Habitat, path and material polish — September 8, 2026

Checkpointed the previously integrated work as `96edf47`; no remote is configured, so the requested push could not be completed. The subsequent visual work is uncommitted for review.

Added ecological habitat fields, clustered vegetation, original native-pixel transition silhouettes and ground clumps. Local riverbanks gain independent coves/bars, and eligible marsh hollows can contain authoritative shallow pools. Ground and water share shoreline masks. Continuous art strokes simplify staircase footpaths without changing the generated route, endpoints or movement rules. Dated content profiles select basalt, cobble, slab or brick paving; the regional-road overlay now preserves paved surfaces.

The final reference-guided pass enriches ecological palettes, gives dirt paths a light worn center and dark shoulder, adds restrained grouped earth texture and grass overlaps, and confines interlocking pixel blends to narrow habitat seams. Original building material ramps, foliage highlights and rock planes have stronger separation; foundation contacts are deeper. Assets were rebuilt from their code recipes. Quiet interiors and the original scale/layout remain. This is not a reconstruction of the dense Roman courtyard layout in the reference.

Review: `artifacts/polish-review/index.html` contains matching rural before/after plus Rome 100 CE, desert, marsh and northern grassland captures. See `TERRAIN_ART.md` for architecture and material interpretation. Twenty-one focused terrain/water/street tests and the production build passed. The broader regional-composition suite had density and timeout failures; the density failure (8 versus 20 households) also reproduces at checkpoint `96edf47`. No save restoration work was performed.

## Integrated regional world generation — September 8, 2026

Implemented shared production geography for new procedural/World Weaver worlds (`geographyRevision: 1`, terrain revision 2). The explorer now enters the same pipeline with bounded starting overrides. Earth coastlines/rivers and broad relief constrain local terrain; dated regional files can supply named settlement footprints, open land, water geometry and connections. Districts index multiple places/neighborhoods rather than defining one town. Buildings respect shared footprints and land-use exclusions; local roads and regional routes share generation and are reserved before building placement.

Regional content resolves by coordinates/date for settlements, households, props, resource availability and the live location display. Regional maps label unvisited named places without activating households. General gazetteer names are restricted to contemporary coverage; dated content files add earlier anchors without projecting modern towns into prehistory. New regional data is intentionally approximate and source-qualified. The World Weaver modal has **Random place & era**, selecting across twelve families and twelve eras with a fresh seed and visible editable result.

`src/world/regional/` owns context, settlement identities and transport; `src/content/geography/regions/` owns data. `WorldModel.geography` exposes places, connections, local content and resource potentials for future traffic/trade. Water connections remain unserved proposals; economic dependencies and moving boats are not implemented. Existing generation dispatch is retained for previously pinned worlds; no save restoration work or new tests were added. User requested to perform gameplay/browser verification themselves. See `WORLDS.md` for scope and extension contracts.

Build checks: TypeScript compilation, production bundling and `git diff --check` passed during implementation. No unit, gameplay or browser test suites were run at the user's request. No commit or deployment.

## Restrained water animation and palette polish — September 8, 2026

The user-approved full worktree was checkpointed as `dd00761` before this pass. Added an original shared 128×96 pixel atlas with eight-frame ripple, curl, crest, plant, leaf and ring sequences. Surface motifs form, open and dissolve, with quiet intervals and at most one selection per 2×2 cell area. Rare habitat details replace that tile's surface motif. River motion follows the existing tangent; coastal wash now uses fewer, longer broken shapes with gaps. Warm sandy lips stay soft while raised rocky edges retain stronger contact shade.

Five hue-shifted depth colors, broad asymmetric seabed fields, sparse clustered surface marks and fewer grouped submerged stones enrich the water without filling it with detail. Small plants, turning leaves and expanding rings are limited to appropriate unfrozen woodland/wetland freshwater. Cultural families, world generation, collision and gameplay state are unchanged. Chunk containers own the animated images; the shared atlas is created before chunk texture ownership and survives chunk eviction. Per-frame work reuses cached active counts, and only shoreline cells produce foam geometry. See `WATER.md`.

Validation: seven focused water tests passed, including native-pixel bounds for every motif/flow, deterministic chunk parity, density limits and ecological gates. Three browser checks passed: five climates at overview and 2× zoom, pixel animation/pause stability, chunk eviction/atlas survival, preview/play lifecycle, actual bridge crossings, and a blank-page versus water cadence benchmark. Reviewed `artifacts/water-*.png`, `artifacts/water-detail-*.png` and the bridge capture. Active motif fractions were about 7–8%. An initial five-scene run measured p95 16.7–16.8 ms; a later run measured 33.4 ms, and the dedicated comparison measured the same 33.4 ms for both a blank page and animated water. Timings reflect the local browser/host conditions, not a universal frame-rate promise. Production build passed with the existing bundle-size advisory; `git diff --check` passed.

The water pass remains rendering-only. At the user’s subsequent request, the full worktree is checkpointed together, including the independently authored palm-art changes in `scripts/art/vegetation.py` (Python syntax validated). No deployment.

## Ecological water, currents and coastal waves — September 8, 2026

Added shared pixel-water rendering to topographic worlds: five continuous-field depth bands, quiet surface clusters, submerged stones, flowing river highlights and stone wakes, offshore crests, staggered shoreline wash and winter edge accents. Base ecology selects independent river/coastal colors and bank/stone materials: warm desert silt/sandstone, dark jade tropical rivers, pale aqua tropical beaches, neutral temperate shores, cooler boreal/slate and Arctic gravel. Northern shore surfaces are gravel; narrow temperate coastal margins can also be stony. Existing reeds and shoreline decoration remain ecology-driven. The “Monsoon river” study uses the existing tropical envelope rather than a new precipitation model.

Water pixels rasterize in the terrain worker and install as one composed ground page; retained, culled Graphics overlays animate at 10 Hz. World-coordinate placement and a shared clock preserve seams and pause phase across chunk loads. Bridge tiles suppress effects and foreground painter order is retained. New desert/monsoon river, tropical lagoon and Arctic shore quick studies plus Pause water make comparison straightforward. Wilderness previews now frame the nearest water directly; player placement is unchanged.

Validation: 22 focused unit tests passed across water, topography, terrain-world and regional-composition suites. Two browser checks passed, including five ecological water scenes, real pixel changes during animation, reproducible paused screenshots, unchanged simulation state, chunk pan/zoom, preview/play teardown and actual bridge crossings. Final five-scene samples measured p95 16.7–16.8 ms; sampled maximum water updates 0.4–3.4 ms and maximum chunk installs 14.5–24.8 ms. Bridge round trip measured p95 16.8 ms / maximum 50.1 ms. These are local measurements, not device-independent budgets. Production build passed with the existing bundle-size advisory. Reviewed `artifacts/water-*.png` and the bridge capture.

See `WATER.md` for ownership and limits. No fluid simulation, new river routes, collision changes, save restoration work or new cliff-coast landform. Other shared-checkout terrain/settlement edits are preserved. No commit or deployment.

## Natural landforms and terrain-led settlements — September 8, 2026

Implemented the requested stage-one/two composition pass for the experimental procedural explorer. Replaced sine-wave rivers with cached coarse routes influenced by continuous terrain, bounded lateral movement and shared reach endpoints. Warped broad forms produce irregular ridge/basin shoulders; variable shores and asymmetric floodplains carve low ground before visible tiers are assigned. Small unsupported elevation protrusions are softened. Natural two-cell passes are selected along stable contours instead of appearing at fixed coordinate intervals. River gravel banks, lake/coast margins and wet pockets use distinct surface rules.

Settlement centers favor flat dry ground near water. Organic settlements connect suitable neighborhood/court/crossing anchors before placing buildings, reuse routes and add limited cross-links. Dense and waterfront patterns no longer imply a grid; planned settlements retain one. Frontage intervals, setbacks and visible yard wear vary. Field plots are selected from fitting connected ground using moisture and proximity. Wider stone-surfaced routes and narrow dirt paths retain distinct treatment. Generation-only diagonal search still rasterizes to validated cardinal paths; player routing defaults and crossing rules are unchanged.

The regional planner shares bounded deterministic reach data with the existing production generation path. Road searches use explicit budgets and cached ground preferences. Natural pass planning is only triggered at relevant contours. Wilderness previews now frame nearby water without changing the player start. Existing explorer seeds intentionally generate the new composition; `de1e0bc` is the preceding checkpoint. Original Anatolia revision-one composition and earlier generator behavior remain unchanged.

Validation: 26 focused tests passed, including positive/negative reach boundaries, cache-order/eviction independence, continuous water, margin variation, and reachable household entrances for rolling, dense plain, ridge and basin worlds. Two browser checks passed, covering all six explorer presets, three uninhabited geography views, preview/play identity, overlays and a dense-town runtime command. Latest dense-town five-minute command: approximately 576 ms in Chrome locally; generation and simulation timings vary with load. Production build passed with the existing bundle-size advisory. Reviewed `artifacts/procedural-*.png` and `artifacts/regional-*.png`. No commit or deployment in this task.

This remains bounded procedural composition, not watershed/tributary simulation, erosion or historical urban growth. See `ECOLOGY.md` and `SETTLEMENTS.md` for ownership and limits.

## General environments, household livelihoods and procedural explorer — September 7, 2026

Added opt-in v3 terrain revision 2 with eight ecological envelopes, four independent landforms, river/lake/coast/no-water configurations, sparse/settled/uninhabited population and resident/visitor/wanderer/shepherd starts. Local habitat pockets influence vegetation, resources, materials and minimap ground. Sand and winter snow extend the shared terrain atlas; existing three-tier contours, two water depths, timber bridges, collision and chunk rendering are reused. No settlement or valley is mandatory. The original Anatolia shortcut remains a revision-one test.

Generated households now have residences, shared stores, ages and reciprocal family/co-resident links. Finite fruit, berries, branches, reeds, grain and grazing stock connect ecology to activity. Adults discover and gather reachable supplies, return them to household stores, eat/refill household water and return indoors at night; children stay near home. Player members can contribute supplies to the same store. Sheep/goats consume grazing patches. These are bounded prototype activity rules and generic ecological categories, not a complete demographic simulation or historically certified species catalogue.

`/terrain-lab` now opens a procedural explorer with six contrasting quick studies, seed/reseed, ecology, landform, water, population, settlement pattern, starting role, household composition, season/date, height/moisture overlays and household/stock inspection. Local previews use the production renderer; Play this world opens the exact same Runtime. Preview camera focus is independent of the player, with settlement/player centering. The fixed art fixtures remain under `?study=meadow` and `?study=contours`. Fixed scene teardown so repeated preview/play switches dispose subscriptions and terrain workers.

Validation: 20 focused unit tests passed (ecology/household/resource simulation, terrain, crossing and contour seams), along with all three relevant browser checks. The new browser check renders all six presets, verifies preview/play hash identity, checks settlement-free and shepherd starts, switches overlays and advances the dense town through the playable runtime. Production build passed with the existing bundle-size advisory. Visually reviewed woodland, coast, desert camp, tropical waterfront, snowy tundra and dense-town previews. Local woodland 30-minute simulation measured about 290 ms in isolation / 670 ms alongside build/tests; the dense-town five-minute runtime command measured 562 ms in Chrome. These are local measurements, not universal budgets.

See `ECOLOGY.md` for module ownership, assumptions and remaining scope. Industrial production, species/date/region research, demographic change and climate-driven hydrology remain future work. No commit or deployment in this task.

## Terrain streaming and diagonal movement repair — September 7, 2026

Fixed the outdoor diagonal regression: the shared crossing rule now checks all four cardinal edges around a diagonal; clear level ground permits it, while water, solids, ledges and ramp side entry remain blocked. Removed the unconditional diagonal rejection in the relief world adapter. This is additive command support; world generation inputs and prior successful cardinal commands are unchanged.

Replaced synchronous whole-view topography rebuilding with retained 16×16 chunks. Terrain sampling (including neighboring settlement preparation) and contour rasterization run in the existing world-worker bundle. The main thread installs at most one completed chunk per frame, prioritizes visible terrain, prepares a fringe ahead of movement and evicts distant chunks/textures. Zoom and lighting retain geometry. Scenery refreshes independently over a smaller region. Relief sessions skip the unused legacy tile prefetch. Ground variation uses world coordinates; pixel/row ownership and neighbor sampling preserve contour seams, and bridge discovery preserves whole spans across chunk edges. Existing bridge/ground artwork from the shared worktree is retained.

Validation: 21 focused unit tests passed, including outdoor diagonal commands, corner restrictions, contour pixel/depth parity across positive/negative chunk seams, bridge span identity and settlement coverage. Four browser checks passed: ordinary input/animation, the terrain study, bridge crossing and a 190-step outdoor round trip which builds new chunks and checks zoom/lighting reuse. Latest long-walk measurements: p95 16.8 ms, maximum frame 100 ms, 53 chunks built, 61 retained, maximum chunk installation 4.8 ms and zero frames missing visible terrain. The bridge round trip peaked at 50 ms. Previous reviewed whole-view rebuilds took 928–1,381 ms on the main thread.

Production build and production-browser smoke check passed; the existing large-bundle advisory remains. Production preview reached visible-terrain readiness in 1.93 s after selection (1.44 s terrain preparation), with maximum chunk installation 4.8 ms and no page errors. Measurements are local, not cross-device guarantees. New screenshots: `artifacts/terrain-stream-overview.png`, `artifacts/terrain-stream-bridge.png`, `artifacts/terrain-stream-production.png`. Existing unrelated screenshots and worktree edits were preserved; no commit or deployment.

## Timber bridges and crossing performance — September 7, 2026

Checkpointed the complete approved terrain worktree as `7691fe6`. Relief bridges now render as connected timber spans with long shaded planks, pegs, capped end posts, front bearers and cast shadows over water. Deck rows participate in elevation-aware painter order; bank bevels are clipped beneath the span so they cannot cut holes in its abutments. The shared renderer serves the meadow study and the playable Anatolia preview.

Static ground and material blends are now composed into 512px canvas pages, eliminating thousands of persistent ground sprites. The visible terrain patch has a 32-tile movement allowance instead of rebuilding at every 16-tile boundary. This is bounded viewport reuse, not streaming terrain: longer journeys, zoom or lighting changes can still rebuild the patch. The larger overscan trades some initial draw time for smooth local travel.

Validation: eight terrain unit tests and both focused browser checks passed, including a real-time bridge crossing in both directions and visual inspection with the player on the deck. Latest local round-trip measurement: p95 16.8 ms, maximum 66.7 ms, zero terrain rebuilds; preview ready about 2.2 seconds. These measurements are device/load dependent. Screenshot: `artifacts/bridge-closeup.png`.

## Terrain composition and loading correction — September 7, 2026

User explicitly deprioritized save restoration; current work and tests focus on graphics, generation, movement and speed. Replaced per-cell ramp spawning with separated paired road openings; broad northern/southern uplands expose substantial front faces. Buildings require level plots rather than overwriting the land with rectangular grading patches. Bridge decks include their dry approaches. The test settlement uses eight households, narrower visible paths and smaller bare yards. Gravel beaches, shoreline boulders, irregular shallows, turf shading and warmer earth planes distinguish river margins from uplands.

Performance: the initial preview no longer builds distant inter-settlement roads or samples the full Earth atlas per local cell. Contour rasterization works on exposed-edge spans with typed height lookup; production no longer builds an invisible duplicate tilemap. Measured local generation about 350 ms, browser preview ready about 1.3 seconds and static terrain render about 620 ms. These are local measurements, not device-independent budgets. Terrain tests check slope counts and household access; no save-restoration work was performed.

## V3 Anatolia terrain preview — September 7, 2026

Checkpointed the full prior worktree as `7eb4d94`. Added an opt-in saved terrain revision to v3, with seeded three-tier relief, wetland/grassland/dry-upland ecology, shallow/deep river water, graded settlement plots and slope-aware player/NPC routing. Playable rendering now projects terrain, objects and actors; minimap ledges and water depths share the same sample. New-world shortcut creates the 6500 BCE Konya preview (`anatolia-relief-1`). Earlier worlds omit the revision and retain their behavior. Details and deliberate hydrology/art limitations are in `TOPOGRAPHY.md`.

Validation: 30 focused terrain, settlement and legacy core tests passed; production build passed with existing bundle advisory; the new browser preview check passed. Reviewed `artifacts/anatolia-topography-v3.png`. An initial in-app browser crash prompted tighter contour textures and reduced offscreen rendering. The optimized preview then loaded successfully in a fresh in-app tab and was visually reviewed. All three terrain browser checks pass.

## Terrain border repair — September 7, 2026

Removed the independent rectangular contact-shadow strips and aligned contour coverage with the underlying ground. Small outward turf variations preserve coverage; faces now use warm vertical soil planes and tapered recesses instead of block noise. Ground surfaces render before contour walls so the next tile row cannot clip their connecting edges. Movement and height data are unchanged. Browser screenshots were reviewed; this remains a terrain-lab art study, with further visual distance from the reference mockup.

## Terrain relief and continuous banks — September 7, 2026

Revised the stage-one study following the user's comparison images: three readable meadow tiers, one broad northeast rise, two-wide slope, terrain-routed roads, winding two-depth river, pocketed marsh/reeds, and shared 14px projection for tops, actors, shadows and picking. Replaced disconnected side/front caps with a continuous contour silhouette and bevel; world-coordinate texture and subtle pixel variation now carry through bank turns. Retired the unused cap/face atlas pieces. The four-tier diagnostic scene remains. This is still an isolated review fixture, not production procedural hydrology or a world-generation migration.

Validation: seven terrain tests pass, including pixel connectivity around a stepped bank, plateau connectivity, water depths and ramp projection. Two browser tests pass, including elevated clicking, movement, pan/zoom, export and save isolation. Production build passes with the existing bundle advisory. See `TOPOGRAPHY.md`; screenshots are `artifacts/topography-*.png`. Unrelated worktree edits are preserved; no commit or deployment.

## Terrain stage 1 — September 7, 2026

Added isolated `/terrain-lab`: composed river meadow plus all-direction slope/corner fixture, four local height tiers, shared 24-color/16px terrain recipes, grass/damp/dry surfaces, gravel channels/bars, banks, ledges, ramps, and existing building/vegetation sprites. Shared pure crossing rules govern keyboard and click-route movement; controls include height overlay, pan/zoom, reset and PNG export. New optional core/render modules are not consumed by existing generators. See `TOPOGRAPHY.md` for ownership and the stage-two boundary. Existing saves, playable atlases and other worktree edits are preserved.

Validation: three focused terrain tests and two browser checks pass, including traversal, blocked ledges, all-tier reachability, mobile layout, export and save isolation. Production build passes with the existing bundle-size advisory. Reviewed desktop meadow, contour and mobile screenshots. Work remains uncommitted.

## Shared prop pixel grid — September 6, 2026

Removed fractional per-definition sprite/shadow scaling. Sixteen small/medium families now use smaller hand-authored silhouettes on the same world pixel grid, plus a compact runtime stick. Prop Lab and the forty-family contact sheet show actual relative sizes at a common integer zoom. Source canvases remain 48×48 transparent storage; occupied art determines size. Rebuilt all material variants and dynamic silhouette shadows. Collision, saved identities, placement and era/culture rules are unchanged. Validation: production build, eight prop unit tests and six browser checks pass (gallery, keyboard interactions, water and collision).

## Settlement generator 3 — September 6, 2026

Implemented the approved settlement work for new procedural/World Weaver starts: six layout profiles, shared terrain-aware streets and river crossings, oriented buildings with accessible household/work plots, player-owned housing, fields, gated pens/troughs/pasture, and daily household/work/water/common-area activity. Weighted player/NPC routing uses the same collision rules; player gate opening is a recorded command. Generator 1 and 2 worlds retain their earlier generation and simulation. See [SETTLEMENTS.md](SETTLEMENTS.md) for the implementation and extension points.

New-world controls include a settlement-layout override. Florence has a city anchor; Neolithic defaults now generate villages rather than camps. Regional named-content and ecology expansion remain separate work. Browser checks cover six forms, walking into owned houses, pens, free/LLM routing, old journeys, save/replay, movement, props and lighting. The full 60-test suite and production build pass; all eight settlement tests also pass after the final visual changes. The existing large-bundle advisory remains. The legacy full-day test is substantially faster after indexing obstacles during simulation updates; this optimization preserves its hashes.

Screenshots: `artifacts/settlement-*.png`. `scripts/check-settlements.ts` checks six sample settings and reports reachable destinations and layout counts. No provider calls or deployment were needed. Shared unrelated edits remain preserved.

## Prop size and collision correction

Replaced blanket half-size portable rendering with per-definition scale (barrels 1×, chests/crates 0.9×, smaller vessels 0.6–0.75×); shadows match. Intact solid props now block their ground tile through the shared engine query for players, pathfinding and NPCs. Pickup/break clears collision and dropping restores it. Loose sticks/remains stay walkable; empty intact containers remain solid. See `PROPS.md` for replay implications.

## Movement polish — September 6, 2026

Player/NPC sprites retain active interpolation across UI/worker redraws; destinations are tracked independently from displayed positions. Keyboard and click-route steps share a 140 ms presentation cadence, with distance-adjusted diagonal timing, fractional camera following, motion-driven walking frames, moving depth and selection markers. Arrows/WASD combine axes; opposite directions cancel, short taps are buffered, and focus loss clears input/stops routes. Diagonals validate both adjacent cardinal cells to prevent corner cutting and cost three integer simulation seconds (plus the existing slope cost). Cardinal costs, NPC decisions, pathfinding, generation and saved state shape are unchanged. This is additive command support: old successful command logs contain no diagonals; legacy checkpoint hashes still pass. NPC time remains action-driven, as designed.

Validation: 50 existing unit/integration tests plus the new eight-direction/collision test pass; production build passes. Focused browser coverage verifies held arrows/WASD, key release, player/NPC intermediate positions and redraw preservation. Six existing journey browser tests pass, including input focus and browser/Node parity. One existing journey assertion expects Space to wait 60 seconds; the previously implemented prop controls perform a two-second pickup instead. Left untouched as unrelated prop-test maintenance. Visual check: `artifacts/movement-polish.png`. Shared unrelated work remains uncommitted and preserved.

## World Weaver routing clarification

World Weaver is the general LLM-enabled mode, not a classroom-only product. Clear place/culture-zone + period requests resolve locally even in LLM-enabled mode; incomplete or unrecognized requests use World Weaver. Procedural mode never calls a model and shows its fallback choice. Periods/centuries, names and existing starting hunger/fatigue fields now vary by seed; exact dates and saved results remain fixed. Existing settings without generated character fields retain their previous startup state for replay. The endpoint uses `UHS_WORLD_WEAVER_ACCESS_CODE`; earlier classroom-named configuration remains compatible. Prop work in the shared checkout is independent of this change. Validation: production build, 11 focused unit/replay tests and six world-creation browser tests pass; the browser regression verifies zero requests for Renaissance Florence and one mocked interpretation for “ancient shaman guy”. No real model calls were made.

## Interactive prop MVP

Validation: full suite passed at 45 tests before the final two prop tests were added; all 7 prop tests and the 25-test core/world/prop group pass, as do the 5 prop/gallery browser checks. Legacy replay hashes pass. Build passed after implementation, but the final build encountered a concurrently added `src/content/geography/character.ts` referencing a `WorldSetting.character` field not yet in its schema; that unrelated work was left untouched. The interactive implementation remains uncommitted after the requested baseline checkpoint.

Baseline committed as `120f870`. New content-version-2 worlds select shared props by era/culture/context and place them beside buildings; historical resolver exclusions win over defaults. Space picks up or strikes with a held stick, E looks inside/drinks, G puts down. Contents, identity, ownership and damage persist; broken remains expose existing goods. Old save/replay content stays version 1. See `PROPS.md` for scope and known provisional content.

## Ten additional prop redraws

Redrew storage jar, water jug, amphora, glazed jar, lidded basket, barrel, crate, pail, trough and roofed well, including 30 material variants. Updated Prop Lab and added `artifacts/prop-next-ten.png` contact sheet. Reused palettes, revised mouth construction and well masonry; ground shadows remain separate. All 30 variants pass dimensions/alpha/determinism checks; atlas and sheet regenerate identically. Work remains uncommitted.

## Prop proof geometry correction

Revised the six review sprites: aligned ellipse rims, deeper well interior, finer wrapped basket courses, folded sack mouth, and front-facing overhead chest. Contact sheet now has no static ground shadows; existing time-of-day masks remain independent. No gameplay changes or commit.

# Current: shared procedural Earth / World Weaver creation

The user authorized full implementation of the simplified geographic foundation with both local and optional LLM interpretation. `WORLDS.md` is the current geography/creation handoff, superseding the older regional-GIS proposal below. Both modes produce one saved `WorldSetting` and use generator v2; v1 worlds and recordings retain their generator and inputs.

Implemented: bundled Earth coastlines and major rivers, simple relief/climate fields, local coast/river composition, deterministic settlement districts and crossings, local/regional/Earth views, place/period/role parsing, keyword examples, and a server-only optional Gemini interpreter. The place catalog reuses original UHS descriptions only where named coordinates were matched; the old adjacency graph is retired. No historical certification gate was added. Added compact shelters and a thatched-house option using the existing art pipeline.

The classroom endpoint defaults to disabled and needs the environment values in `.env.example`. No real provider calls or deployment were performed. Content remains the early simulation's shared asset/occupation libraries: more local clothing, ecology, professions and economies are future content work. Global society transitions, sea-level history, long-distance travel and persistent-entity eviction remain future work. Prop gameplay approval is unchanged.

Verification includes offline creation without model requests, both endpoint outcomes with injected responses, same-seed world switching, negative chunk coordinates, shoreline/river orientation, valid catalog settings, doors, save/reload/replay, and legacy recording hashes. Completed validation: 40 unit tests, 12 journey/world-creation browser tests, production build, v2 headless replay parity, and visual inspection of London, Alexandria, Siberia and Haiti. After final layout changes, the five world-v2 unit tests and five world-v2 browser tests were rerun successfully. The build retains the bundle-size advisory for the atlas/Phaser assets.

---

## Prop review gallery — September 6, 2026

User-authorized, uncommitted review gallery: Command+2 / Ctrl+2 and `/prop-lab`, 40 families / 117 original code-authored pixel studies. Separate catalog, modular recipes and atlas; existing silhouette lighting reused. Search, category filters, variants, integer zoom, character scale, backgrounds and PNG exports. No prop gameplay or historical eligibility integration yet. Validation: production build and all three gallery browser tests pass; art outputs regenerate byte-identically. A broader test run encountered audio/world-v2 timeouts and a world-v2 save/replay hash mismatch in concurrent work outside this gallery.

# Implementation status — 6 September 2026

## Current summary

Two historical settings are playable: the Roman Tiber lowlands and Neolithic Konya plain. Reusable building contracts, the isolated graphics lab, six-band lighting and the Audio studio are implemented. The accepted twelve-family approach is documented in [design section 20](UHS_DESIGN.md#20-cultural-content-families-and-dated-local-profiles); its resolver and fixed twelve-era registry are implemented; additional playable historical settings are not.

The entries below are implementation records. Their test totals and performance samples apply to the work described, not to an automatically refreshed project-wide certification. The historical framework pass reran the checks recorded in the current handoff below; older counts remain records of their respective milestones.

## Current handoff: review eras before props

Prop-scope clarification: the demos are test environments, not the intended coverage limit. `PROP_PLAN.md` now proposes forty shared everyday object families, one-sentence art directions and controlled material/color variation; its old C/U proposal labels have been removed. This revision is planning only, not new art or interaction implementation.

The latest user instruction takes precedence over the earlier sequencing below. Delivered the executable twelve-era framework and read-only `/history-lab`, with culture/date/place/community resolution, source-linked hypotheses, explicit exclusions and context/capability gates. Roman and Neolithic pack exports pass byte-for-byte comparison with frozen v1 inputs; existing replay checks pass. Read [HISTORY.md](HISTORY.md) for the contract and [PROP_PLAN.md](PROP_PLAN.md) for the proposed silhouettes and era/family allocations.

The user explicitly requested review before prop art or item mechanics. No pickup, equipment, opening/breakage, new prop art, generation changes or occupation production cycles were implemented. Space still waits in the playable game; the proposed empty-handed pickup behavior is reserved for the next approved slice. Settlement and landscape generation are reserved for another phase/agent.

Historical research examples: Konya's conjectural early Indo-European affiliation under the farming hypothesis (with competing models and an unclassified alternative); a deep-Eurasian macrofamily thought experiment; a day-level Moscow 1991 political transition inside a single era. These are qualified records, not recovered speech, complete political boundaries or new playable settings. All 144 culture-era queries resolve structurally; most return unresearched coverage. Existing catalog assumptions are explicitly labeled rather than recertified as historical facts.

Validation: 35 unit/integration tests passed, including both original 154-command checkpoint replays. Two new browser tests passed for date changes, evidence/exclusions, hypothetical-language display, report/link reproducibility, isolated save behavior, mobile layout and invalid inputs. Final production build passed. The seven historical-framework tests were rerun after the final isolation/determinism refinements, and all nine browser checks in history-lab + journey passed, including browser/Node equivalence and saved-journey interactions.

## Earlier recommendation: dated local content profiles (partly delivered; sequencing superseded)

**Recommendation after reviewing the design, implementation history, graphics, audio, provenance and current content code:** make the existing worlds resolve through small dated local profiles, then prove a genuinely different daily-life setting in Java. The art and audio extension points are ahead of the occupation and content-resolution systems.

Current constraints observed in code:

- `src/core/types.ts` has one flat `Pack` definition and a fixed `ItemId` union; `src/runtime/schema.ts` repeats item IDs and accepts only `roman`/`neolithic` manifests. Extend registered definitions and validation together; do not merely relax validation to arbitrary strings.
- `src/world/generate.ts` assigns role labels from pack data but gives residents a common trade-based inventory template and generic work locations. Some containers, household stores and crops remain hard-coded.
- `src/core/engine.ts` supplies a common home/work routine and role-based activity text; it does not yet simulate distinct production processes for the listed professions.
- Graphics already select reusable recipes; music already separates composition and instrumentation. Neither provides complete, authenticated cultural coverage. Audio's four 28-day seasons are provisional, and its six SFX cues are audition-only.

Recommended bounded sequence:

1. **Resolve the two existing profiles without changing their worlds.** Separate dated identity, selected component libraries, ecology/capabilities and local overrides only where current packs need them. Use a small explicit function returning resolved definitions. Validate references, exclusions and conflicts. Preserve existing manifests, IDs, random draws and generated results; do not scaffold twelve empty pack implementations.
2. **Prove behavior as well as appearance in one new setting.** Research a specific Javanese locality around 950, then deliver one small settlement and a playable work-and-exchange cycle with suitable houses, clothing, tools, inventory, a distinct NPC occupation and a musical treatment. Add only the shared mechanics that cycle needs. New mechanics or physical generation changes need explicit versioning; preserve compatibility or provide a documented migration/refusal path.
3. **Use Melbourne, 1950 as the later modern stress test.** First test its profile and asset selection; introduce transport, electrical infrastructure and modern work only when a bounded playable scene needs them. Do not represent unsupported systems with labels alone.

Acceptance for step 1: both existing 154-command checkpoint journeys still produce their recorded hashes; saves import and round-trip; browser/Node commands agree; unsupported place/date combinations fail clearly; renderer and UI acquire no cultural-family branches. Add focused resolver tests for local overrides and excluded content.

Acceptance for step 2: the player can recognize the setting through everyday buildings, clothing and objects without reading the title; observe a distinct NPC work cycle with actual persistent inventory effects; participate in an exchange; save/reload and replay it through the same command interface. Manual listening/visual review must accompany functional checks. Dates, season assumptions, introduced goods and historical claims need explicit applicability.

Finish small sensory integration alongside this slice: choose appropriate sound cues for actual successful actions and give the new setting a justified seasonal mapping. Keep settlement composition improvements tied to the selected scene. Broader GIS, a universal city generator, model-enhanced dialogue and production of all twelve libraries remain separate work. Existing milestone numbering in the design is historical sequencing, not a reason to start model integration before this content proof.

## Delivered

- Design v2 records the user's original-art requirement, free-first $10 ceiling, Roman/Neolithic initial scenes, and generic-engine priority.
- Original pixel-art proof and an atlas compiled from repeatable recipes. No purchased or restricted third-party pixels ship.
- One React/Vite/Phaser application with two seeded settings, four settlements each, sparse terrain, persistent interiors, people, wildlife, and shared contextual commands.
- Deterministic core, visibility projection, needs and routines, bounded distant catch-up, trade, theft/restitution, harvesting, eating/drinking/resting, following permission, animal handling, and capture uncertainty.
- Local save/import/export with validation and single-writer handling; command recording, graphical replay, single-step/scrub, and resume-from-replay branching.
- A Node player runner, actual local MCP transport, browser player API, and optional feature-detected WebMCP registration.
- A real prepared lower-Tiber centerline. Neolithic local geography remains explicitly inferred. The broader elevation/drainage geographic gate is not marked complete.

## Verification record

Initial foundation verification: 19 core/content/rendering/MCP checks and 8 real-browser checks passed; the production build passed. A short production movement sample in Chrome 152 at 1440 × 1000 recorded a 649 ms ready time, 16.7 ms median / 16.7 ms p95 frame interval, roughly 26 MB JS heap, and no page errors. An empty-page baseline in the same run also measured 16.7 ms, so this session was limited by the browser frame cadence. This is a short local measurement, not a cross-device performance guarantee. The exact report is `artifacts/performance.json`. `artifacts/` contains the original art proof, inspected game screenshots, stitched generated maps, and actual scripted-day trajectories/snapshots. Re-run the documented commands after changing versions or rules. Recorded hashes describe only their pinned implementation.

The two actual scripted days each executed 154 accepted commands, reaching 21:00. Exact replay verified Roman hash `b6d511bc` and Neolithic hash `830dca2c`.

The browser test found and resolved missed quick keyboard taps. Visual review found and resolved a spawn/roof overlap, excessively wide parcel spacing, abrupt terrain edges, and an initially obstructive narrow-screen panel. Replay files from both the browser and the Node runner are supported.

## Deliberate limits and next work

The prototype supports two concrete content packs; free text is catalog parsing, not arbitrary simulation generation. Optional model enhancement, hosted sessions, fine-grained geography/elevation, deeper social/economic systems, and further eras are not implemented. The browser's experimental WebMCP registry was unavailable for native verification; stdio MCP is tested against a real SDK client.

The current sequence is user review of the era framework and prop plan, followed by the approved interactive-prop slice. The earlier Java proposal is deferred. Continue visual and interaction review within those slices. The geographic pipeline remains a separate measured step. Model enhancement still requires a chosen provider and explicit spending controls; no model calls or spending occurred in the recorded implementation work.

A final botanical review replaced the Anatolian pack’s acacia selection with regionally attested hackberry and added the botanical evidence record. The schematic tree artwork and individual tree locations remain inferences.

No deployment, old-repository changes, asset purchases, or external messages were made.

## Mockup-driven polish pass

Rebuilt the interface with charcoal panels, thin gold borders, locally served Baskervville type, a 54 px header, map-owned toolbar, full-height portrait sidebar, context thumbnails and functional Local/Region minimap controls. The map owns more of the viewport; mobile panels and dialogs remain usable. Inspect and map changes cost no simulation time.

At completion of the earlier UI polish, the atlas contained 297 named frames: 18 portrait color/identity variants, revised foliage and tunic contours, deeper terracotta roofs, two-storey and pilastered facade modules, awnings with shelf detail, differentiated mudbrick roof furnishings, broken stone paving, quays and modular bridge arches. Both scenes use the same authoring method. No imported tileset pixels were added.

`src/render/materials.ts` provides bounded cached cosmetic surface rules shared by the scene and minimap; no save schema, entity position, entrance, collision or simulation rule changed. The engine tests still pass, and the browser suite now also verifies Local/Region switching and inspection without time advance. Final screenshots: `artifacts/roman-first.png`, `artifacts/roman-polished-context.png`, `artifacts/neolithic-first.png`, and `artifacts/mobile-inventory.png`.

The UI is much closer to the mockup. The largest remaining visual difference is settlement composition and density: the prototype still has widely spaced parcels and a small facade vocabulary. This pass preserves those physical layouts and refines their presentation; it does not claim exact mockup fidelity.

## Target 3 world-rendering pass

Completed a separate graphics pass against `mockup target 3.png`. The world now uses exposed earth bank faces, lit lips, contact shadows and shallow water; 8-neighbor corner treatments; animated water highlights; repainted, higher-contrast mudbrick roof/wall planes and roof openings; larger world characters; clustered foliage and rock volumes; coherent projected ground shadows with per-frame foot anchors; and narrow, connected paths derived from existing entrances through static walkability. Roman scenes inherit the shared lighting, foliage, props, characters and water refinements while retaining their stone waterfront treatment.

At completion of the target-3 pass, the atlas had 1,489 named frames, mostly generated edge-mask and shadow combinations. All five game-asset files exported in that pass regenerated byte-for-byte. No imported mockup pixels, paid assets, new UI pass, save-schema changes, entity moves or collision changes were introduced.

Visual iteration corrected detached shadows, overly busy water, excess reeds, disconnected paths, and crop clumps appearing over roads. Crops now draw up to three clumps per parent patch and share selection, inventory, and depletion. The browser test walks to a field, clicks a child clump, gathers grain, and verifies the shared state transition. New render tests exercise walkable path construction across seeds, water preservation, and surface-cache order independence.

Final inspected captures: `artifacts/target-3-pass.png` (1536 × 1024), `artifacts/target-3-map.png` (map only), `artifacts/neolithic-field-detail.png`, `artifacts/neolithic-field-harvested.png`, and both initial scene captures. Both production movement samples measured 16.7 ms median/p95 with the same blank-page cadence, no page errors, and no development handle. Neolithic scene switching measured 173 ms in that sample. These are short local measurements, not cross-device guarantees.

This pass improves depth and material treatment within the existing world layout. It does not claim pixel-for-pixel reconstruction of the illustrative target or new terrain-elevation simulation.

## Modular graphics and isolated review lab — September 6

Initialized a local Git repository before editing. Baseline commit `e9966ca` is tagged `checkpoint-before-graphics-refactor`; generated assets and the complete running source are recoverable without the ignored downloaded reference packs. No remote was configured and nothing was published.

Implemented content-owned building recipes and generated contracts (physical footprint/entrance, visual bounds/anchor, height, materials, roof form and attachments). The world generator selects frame IDs from pack data; the renderer does not branch on a Roman/mud architecture enum. Reusable wall, opening, foundation, roof and attachment functions produce four classical and four mudbrick variants plus three later construction studies. Revised foliage, quieter meadow patches, contact/cast shadows, water material variants and bank corner handling. Parcel-derived districts, communal-hub footpaths and shared enclosure geometry remove several previous renderer-specific layout assumptions.

Added `/graphics-lab` and a Settings link. It uses the normal Phaser WorldScene with isolated runtimes and no save or terrain-worker connection. Court/generated-settlement modes, six family presets, separate landscape choices, light treatments, integer zoom, true square/portrait test frames, seed/camera URLs, diagnostic bounds/entrances, frozen animation and PNG export are implemented. The later-era presets are explicitly construction studies, not new historical game packs.

Validation: 22 unit/integration checks and 10 browser tests passed; the final lab frame/PNG/reproducibility checks were rerun after the last frame-layout adjustment. Both original 154-command checkpoint journeys replay to their recorded hashes (`b6d511bc`, `830dca2c`); their saved snapshots still import. The generated atlas/material/contracts reproduce byte-for-byte. Production build and a production lab launch pass with no page errors or gameplay action surface in the lab. Production Chrome movement sampling at 1440×1000 reports median 16.7 ms in both scenes, p95 16.7–16.8 ms, with no page errors (local headless measurements, not a device-wide performance guarantee).

Remaining scope is explicit in `GRAPHICS.md`: physical generator-v1 channels are preserved for save compatibility; the varied-contour court is a fixture, not a silent change to old water collision. At that stage, fixed-direction light treatments did not model a moving sun; the subsequent six-band lighting pass is recorded below. The universal settlement planner and comprehensive future-era asset families remain separate work. Artistic acceptance against the references remains a visual review, not an assertion made by these tests.

## Time-of-day lighting and silhouette correction — September 6

Replaced the fixed cast/contact shadow frames with six local-hour presets shared by the compiler, gameplay and graphics lab. Solar casts reverse from morning to afternoon, shorten at midday, and disappear at night while base contact remains. The matching optional color treatment tints terrain and world sprites and adds a restrained ambient wash. Existing painted highlights remain part of the source art; no normal-map or astronomical lighting system was introduced.

The user's tree/pot detail exposed a near-flat projection: keeping source width screen-horizontal collapsed the canopy over its trunk at low angles. Upright casters now preserve width across the cast direction. Contacts use actual base pixels rather than generic ovals. Building footprints retain their own ground-plane projection; hearth flames are excluded from casting and keep their color. All masks are generated once into one separate atlas, using native Phaser pivots. Old fixed-shadow frames and the extra anchor manifest were removed.

Validated the six presets in the browser, independent color/shadow toggles, midnight/band boundaries, game-clock transition and reload, and a pixel-mask regression check requiring a narrow tree trunk and vessel neck relative to canopy/body. Checkpoint journey replay remains unchanged. Documentation and lab URLs cover the six phases; older day/warm links still resolve. Review images are under `artifacts/lighting-*.png`.

## Audio foundation and cultural-content decision — September 6

Delivered the Audio studio (Command+1 / Ctrl+1), five original 32-bar themes, two choices per season/time slot, three orchestration previews, four stem controls, six SFX auditions, WAV export and seven rendered MP3 listening copies. Composition and instrumentation are separate, with world-clock selection and a declared provisional calendar. Cultural orchestration and live world-action SFX remain future work; see [AUDIO.md](AUDIO.md).

Recorded verification from the audio implementation session: 28 unit/integration tests passed; the focused audio and existing journey browser suites passed nine tests together; the two audio browser tests and production build were rerun after the final lifecycle adjustment. All seven preview renders were checked for non-silence and clipped samples, with results in `public/audio/previews/manifest.json`. This does not claim the entire browser suite was rerun in that session or that automated checks establish musical quality.

The subsequent documentation review recorded the accepted twelve-family approach in design section 20, distinguished planned profiles from implemented content, prioritized the resolver/Java sequence above, and corrected obsolete fixed-shadow asset references. No new historical pack or runtime feature was implemented by that documentation update.

## Wetness-responsive trees and light sward transition — September 9, 2026

New worlds use vegetation revision 5. Tree candidates now respond to the same
continuous habitat wetness and exposure fields that drive ground bands: wetter
patches receive stronger grouping, exposed ground retains only a small residual
chance, and existing revision 4 placement remains reproducible. The existing
intermediate light ground band is now a quiet light sward without the larger
turf motif or island outline; it remains a render-only transition, not a new
ecological envelope. Grass ticks now continue through that light band and use
the lighter shared mark palette.

The shared world renderer now applies a render-only wind clock: reeds sway
faster, while modern tree canopies sway independently of their fixed trunks
and shadows. Willows and palms use slower, slightly stronger profiles; frozen
lab previews remain deterministic. Focused vegetation tests, production build,
and regional composition browser checks passed. The wind profiles were then
retuned to longer cycles and smaller amplitudes after visual review, with the
willow receiving the largest reduction. The existing play-mode plant focus
check remains flaky before reaching its scene hook and is unrelated to the
wind pass.
