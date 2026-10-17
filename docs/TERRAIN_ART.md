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

## Blade hatch and vivid ramps — September 13, 2026

Turf now carries an authored all-over blade hatch (`swardHatch` in
`render/ground-motifs.ts`): short two-pixel dark strokes with an occasional lit
tip, rotated and flipped per 8-pixel block, under the existing tufts. Light
sward takes a softer stroke; wet ground a darker one. Turf tones meet in a
two-pixel checker with a darker rim on the base side. The green envelope ramps
gained 10–22% saturation and a little value; the wetland ramp moved from teal
to green. Tree palettes deepened their outline tone and saturated the mid
ramp. The baked GRASS+ swatch overlay in the default ground style is off; the
shipped turf texture is the authored hatch. Sand seas render exposed ground as
darker sand rather than stone. Reference: the supplied mockup and the Pixel
Crawler free pack, used as style references only.

### Sparser marks, regional rocks, contour donors — September 13, 2026

Turf tufts scale with lushness (cover and wetness less exposure): open dry
ground keeps about a third of the old lattice, thick meadow and hollow ground
about the old density, and every tuft wanders up to four pixels off its
lattice cell. Eight tuft glyphs replace the two mirrored ones. Faceted stone
motifs are roughly half as frequent. Loose rocks in the world are a trace
outside exposed ground and scatter only where exposure is high; scree at bank
feet remains. `scripts/art/rocks.py` adds six regional stone sets (dune sand,
red, basalt, mossy, slab, lichen; three arrangements each) and
`content/ecology/rocks.ts` picks them by ecology and colourway, keeping the
shared grey trio as the temperate default.

Contour boundary rows borrowed a neighbouring tier's whole cell, so a path
stroke or exposed patch from the donor was painted a cell across the edge.
`render/contour-surfaces.ts` now paints the location's own ground at the
donor's height and surface.

## Phase 1: one sun, no ruled lines — September 13, 2026

- **Shadows.** `scripts/art/shadows.py` rotated every non-building silhouette's
  width across the cast vector so tall trees would not collapse at low sun. A
  low wide object (rock, shrub, log) rotated that way read as a shadow thrown
  the other way from the tree beside it. Only upright silhouettes rotate now;
  all three shadow atlases were rebuilt. Characters, trees, props, rocks and
  bank shadows read the same `lighting.json` band.
- **Block seams.** Regional relief was sampled once per 128-cell ambient block
  and the landform (plain, rolling, ridge) chosen per block, so the height
  field and its tiers jumped along box edges. `regional.reliefAt` interpolates
  relief between block centres with the ecotone warp; `regionalLandforms`
  cross-fades the three forms by that relief in Earth mode, and the tier
  ceiling is fractional. The first terrace above a floodplain wanders by up to
  four cells instead of tracing a straight reach.
- **Band edges.** Exposed earth, wet and litter bands were four-corner masks of
  authored 8-pixel transition tiles, which stepped along cell corners. The
  raster now interpolates the habitat fields between cell centres and
  thresholds per pixel with a little noise, so patch edges are curves that
  cross tiles; farmed cells keep the tile transitions.
- **Inspector.** Command- or Ctrl-click a cell in play to print its envelope
  and colourway, habitat kind and fields, tier, surface, decoration, lat/lon
  and the RESOLVE ecoregion in the event bar (`Runtime.inspectCell`).

## Phase 2: landscapes, not fields — September 13, 2026

`world/v3/features.ts` is the one mechanism: deterministic placement rules over
the existing fields, consulted by the land sample, the generator and the
raster. Nothing enters saves.

- **Streams.** One walk per 192-cell block from a spring (highest of a few
  candidates) downhill on the height field, wandering, until open water, a
  hollow or the step budget. In green country it is a creek: one to two
  cells of shallow water, a pond where it ends blind, and a two-frame fall
  sprite (`nature-waterfall`) at each tier drop. In dry country (desert,
  scrub, savanna, steppe) the same walk is an arroyo: a pale silt bed with
  cracks and pebbles, a ragged margin, shrubs favoured along it, nothing in
  the bed. Grassland, savanna and scrub also get an animal trail walked from
  pasture toward water.
- **Worn ground.** Trodden ground at the feet of buildings and the trails
  feed the same path field as roads, so they get the identical shoulder,
  margin and verge treatment rather than a separate dither.
- **Shrub colonies.** Understory density is gated by a colony mask: patches
  at three times the base density with a bare heart, a tenth between.
- **Outcrops, pans, bars.** Rock outcrops on high exposed ground add stone
  motifs and regional rocks; salt pans (Atacama, plateau, Sahara, Kalahari)
  are pale cracked flats in dry basins; gravel bars replace sand along some
  shores; dune crests get a lit lip and a shaded fall.
- **Woodland floor.** Logs and stumps (`nature-stump`) under closed canopy,
  colony-gated.
- **Rivers and paths.** Atlas centrelines get a two-octave meander warp;
  path strokes are simplified at 1.1 cells and corner-cut twice, so roads
  bend instead of stepping. Route cells and movement are unchanged.
- **Mixing and tones.** The ecotone lattice is 64 cells with a wider warp.
  Every grass ramp carries `wet` and `bare` entries used by the wet hollow
  and bare-earth bands. A colourway's wet layout now offsets the field
  instead of scaling it, which had painted whole monsoon scenes one tone.

`tests/landscape-features.test.ts` covers the walk, the dry/green split and
the presence of creeks, arroyos and trails in sampled worlds.

### Ramps and two follow-ups — September 13, 2026

Ramps take a `rampStyle` chosen by the generator from the country and the use:
a grassy **slope** with a worn centre for natural passes, a **cut** earth ramp
for roads and villages, stone **steps** in paved towns, **timber** revetment
in boreal and tundra settlements, a **sand** slump in deserts. Cut rails are
broken (depth wanders 0–2 px along the run), the plateau's turf hangs a pixel
or two over the top, and a few stones tumble off the foot. Natural passes are
one to three cells wide instead of always two. Movement rules are unchanged;
a longer multi-cell ramp would need the tier-step rule to change and was not
done. Soil, turf and stone tones come from the colourway, so a savanna cut
is laterite and a Sahara ramp is sand without asking.

The ground style's per-tier brightness, saturation and swatch ladder is now
flat: it painted every plateau a paler block with a cell-stepped edge. The
woodland litter band needs cover above 0.5 and is drawn as litter mixed with
the dark turf rather than a slab.

## Hydrology: creeks on their terraces, falls as faces, meanders — September 13, 2026

- **Creeks keep their tier.** Every water cell used to be forced to the valley
  floor, so a creek walked across high ground dug a trench and a fall was a
  sprite on top. Now a creek's cells sit at the tier of the ground they cross
  (never above the walk's own descending tier), only the channel and its
  gravel edge take the creek's distance, and the walk prefers to stay on a
  terrace while it still descends, dropping only where nothing on that tier
  leads down. Falls are therefore at real edges, including the last drop into
  a river valley. A plunge pool widens the water below each fall. Stream
  polylines are corner-cut once so banks do not crenellate.
- **Elevated water is drawn.** Water above tier 0 is painted from its own
  water tile in the contour pass (`wallOwnsCell` admits it), and where water
  sits directly above water the cliff face is drawn as a fall: dark lip,
  streaks, foam at the foot. The sprite waterfall is gone. Creeks that would
  run through a settlement are discarded, so nothing pours over a bridge.
- **Mouths and ponds.** A creek walks one step past open water so it joins
  the river instead of stopping two cells short; a blind creek ends in a
  larger pond.
- **Meanders.** Atlas centrelines and planned courses are looked up at a
  point slid sideways to the channel by an amount that varies along it (a
  1‑D sway, not a 2‑D warp, which stretched the distance field into pools),
  so straight reaches bend into loops at constant width. Oxbow crescents sit
  on the floodplain of green envelopes, horns toward the river.

Not done: a river itself does not step down a tier (its floodplain still
defines the valley floor), braided channels, and confluence deltas.

### Rivers step down, arroyo beds by colourway, woodland floor — September 13, 2026

- A river no longer flows along a trench cut to the map's floor. Its valley
  floor is a ladder walked downstream: at each 12-cell station along the
  stable course coordinate (the plan's `along`, or the atlas flow projection)
  the floor is the lowest ground tier crossed so far in the reach, one step
  down, so it descends only where the land does, and the water face at each
  step is drawn as a fall the width of the channel.
- Arroyo beds follow the colourway: a pebbled gravel wash in the Sonoran and
  Kalahari, a darker rippled sand wadi in the Sahara, cracked silt elsewhere.
  A broken low cut bank runs along the uphill lip.
- Under a closed canopy the litter band carries fern fronds in colonies over
  the leaf marks, so a woodland floor reads as floor rather than dark turf.

### Edges, canals, wear, paddies — September 13, 2026

- Canals: the feeder now needs real fresh water as its source (a beach cell
  at the shore no longer qualifies, which removed the stripe that ran out
  onto the sand). Canal water carries dashed flow ripples in lanes; the
  outer lip breaks into the bank every few pixels.
- Trodden ground uses building footprints only (`plan.built`), not the
  whole solid set, so fences and yard trees no longer draw a worn bar along
  a plot boundary.
- Shore lines and field aprons take a slow half-cell wander on top of the
  fine jitter, and field apron corners are rounded: a middle ground between
  cell-corner steps and the fully organic habitat bands.
- Creek margins are gravel banks, not the sea's beach ramp: one dark wet
  pixel, then stones on turf.
- Wet plots shade a row under the near bund and glint along the far one.

### Canal raster — September 13, 2026

The canal tile is a channel seen from slightly in front rather than a flat
fill between two ruled lines: a raised earth berm outside each lip with a lit
crest and shaded slope, the near bank throwing a two-pixel shadow onto the
water, the far bank lit at its foot, river water (the same depth ramp as the
river that feeds it) darkening under the near bank, and ripples as short
crested dashes drifting in lanes. A trodden line runs along the far berm. The
ground raster treats a canal cell as worn, so the verge fades from the berm
into turf. `tests/field-raster.test.ts` checks the profile by hue rather than
exact palette entries.

### Forest floor — September 13, 2026

The litter band was a flat brown with two bright lattices on it (a 7×6 fern
dot pattern and 9-cell leaf marks), which read as noise. It is now three
scales: a two-octave dapple of ±10 value on the litter tone; sparse authored
leaf glyphs (a lit edge and a shadow pixel, three shapes, flipped per block)
placed one per 7-pixel block on a colony hash, off any lattice; and a 9×7
fern glyph in clumps only inside fern colonies. Nothing on the floor is
brighter than the turf's mid tone except the single frond tip. In light-gap
colonies the mottle lifts and ordinary turf shows through, so floor and turf
interpenetrate. Glyphs and placement are in `render/ground-motifs.ts`
(`leafGlyphs`, `fernGlyph`, `floorMark`).

### Living water on terraces, stream meanders — September 13, 2026

- The living-water layer skipped any water above tier 0, so terrace creeks
  and plateau ponds fell back to the old flat raster. It now draws water at
  its lifted screen position and the worker clears the plateau's painted
  water beneath it.
- Stream walks ran dead straight on smooth ground (eight directions, a bias
  toward continuing). A meander pass slides each vertex sideways by a slow
  noise along the stream, growing downstream, with the spring and mouth
  fixed. The river sway now also applies to regional feature rivers (a named
  town's own channel), not only the atlas river.
- Creek shore cells are no longer marked gravel; the ground raster paints
  the creek's edge per pixel, so it follows the channel instead of stepping
  along cells.

### Tributaries — September 13, 2026

Streams were one walk per 192-cell block from a random high point, so a
plain had at most one creek that stalled or wandered. Now each block seeds
two to four springs, scored by height plus closeness to a river (20–70 cells
out), at least 40 cells apart, and the walk carries a pull down the river's
distance field so flat ground still drains to the channel; near the channel
the pull dominates so the creek joins rather than shadowing the floodplain.
Creeks end inside the channel. A creek may cross a town's outskirts (roads
bridge it, houses keep off water) but not its centre. Meander amplitude grows
downstream. The old straight creek lane every 640 cells is gone.

Creek shores: the worker's paint sample replaced every water cell's shore
width with the living-water beach width, which handed creeks the river's
sand-and-gravel ramp in whole-cell blocks. Creeks keep their own width now,
so the ground raster paints one wet pixel and the odd stone on turf. The
capture script deletes the prepared-world cache from a non-app page before
each run; deleting from the app page was blocked by its own connection.

### Creek banks — September 14, 2026

The grey blocks along creeks were three things stacked. The worker's paint
sample gave every water cell the river's beach width (fixed earlier); creek
water tiles drew the river's cut lip inside their water; and, the real one,
the living-water layer only drew pixels on tier-0 ground, so on a terrace the
lobes of water that the interpolated shoreline pushes into bank cells were
never painted and the ground raster's dark wet line filled them instead. The
living layer now draws every cell at its own lifted tier and the worker clears
the plateau page under it, so creeks on terraces get the same per-pixel
shoreline as rivers. A creek's shore is a two-pixel wet line and the odd
stone on turf; the sand-and-gravel ramp stays with rivers and coasts.

Creeks are their own living-water kind: the same beach gradient and
shoreline reconstruction as rivers, in pebble tones (sand in deserts), about
a third of a cell wide. The colour table gained a fifth kind slot (160 rows).

### Creek shorelines and pebble beds — September 14, 2026

- **Sub-cell shoreline.** A creek cell now carries the unit gradient of its
  distance field (`waterVisual.gradient`, from the stream polyline's outward
  normal). `waterDistance` extends the containing cell's distance linearly to
  the pixel and hands over to the bilinear field near the cell edge. For a
  channel one or two cells wide the bilinear field alone collapsed into
  squares, because every neighbour of a water cell was a different bank.
  Rivers keep the interpolation. Ponds use a radial gradient.
- **Pebble beds by climate.** The creek bank is authored in the ground
  raster (`pebbleBed`): a wet dark line at the water, a half-cell band of
  bed tone darkening toward the water with dense pebble motifs in lit and
  shadow tones, then single stones straying onto the turf. Grey slate in
  temperate, boreal and tundra; ochre gravel in grassland, savanna and
  scrub; iron-red on red earth, Kalahari and Sonoran; cream on the Sahara and
  other deserts; dark green-grey in tropical and wetland country. The
  living-water layer draws only the wet contact on creeks.
