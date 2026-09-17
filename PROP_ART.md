# Drawing props

Rules learned the hard way while redrawing the water, farm and workshop
families. They apply to any new prop art in `scripts/art/props_b/`.

## Scale

**One metre is about 17 source pixels, in both axes.** The ruler is the
character: a standing body is 29px for roughly 1.7 m. It is *not* the terrain
grid, where a tile is 16px for 2 m — props are drawn at about twice the ground
scale, which is the usual convention for this kind of view.

Work out the object's real size first, in metres, then convert. A hand pump is
0.35 m across, so it is 6 px wide and its spout is one pixel thick. A well kerb
is 2.5 m across, so it is 42 px. If those two come out the same width, the
drawing is wrong no matter how good the shading is.

Every family declares its agreed size in `src/content/graphics/props.json` as
`"size": [w, h]`. The build prints anything over budget.

## Presence beats the tape measure

The character ruler sets *relative* size — a pump is narrower than a well, a
sickle shorter than a spade. It does not set absolute size. Props are drawn
above life scale, the way this kind of game does it: a water butt stands
higher than a person's waist on the map, not at the eleven pixels a metre and
a half would literally be. Draw the object large enough to carry its own
detail, then check it against the figure for *proportion*, not for height.

## Canvas

Each prop draws on its own canvas, sized to the object. A shared 48×48 box is
what made a sickle as wide as a well. `Canvas` adds one pixel of transparent
margin on every side so the outline pass has somewhere to go; the builder then
trims to the real silhouette and moves the pivot with the crop, so nothing
shifts on the ground.

## Order of operations

- **Outline last** for a solid object. **Outline before** adding any detail
  thinner than three pixels — warp threads, rope, single-pixel grain. Outlining
  afterwards rings every thread in black and a loom reads as a cage.
- **Small props get no full outline.** A dark ring around a two-pixel shaft
  doubles its width; a spade turns into a ladle. Outline the back or the
  underside only.

## Shading

- Five tones cannot carry grain, a rivet and a lit edge on the same board. The
  furniture studies use seven-step ramps (`oak7`, `iron7`, `brass7` …).
- Grain runs *with* the board, in runs of two to five pixels. Scattered single
  pixels read as dirt. Use `streak()`.
- Light comes from the upper left.
- Round things are shaded by **surface normal**, not by row: `blob()` treats a
  union of ellipsoids as a lit form and keeps the dither off the silhouette. A
  per-row ramp makes cones, and a dither that reaches the edge makes fur.
- Rims are tinted, not black: `soft_outline(low, high)` puts a dark tone under
  and to the right, a lighter one over the lit shoulder. A hard keyline on a
  small prop reads as a sticker.
- Anything with its own gaps — a bail handle, a rope — goes on **after** the
  rim pass, or the rim closes the gaps and it becomes a solid block.
- Vessels are bodies of revolution: `revolve()` shades from a profile of
  half-widths, so a pot, a jug and an amphora all turn under the same light and
  only their profile and fittings differ. Use `belly()` to write the profile
  from a few control widths. It carries the two tricks that sell a round pot:
  a sliver of reflected light on the shaded edge, and a `gloss` band for glaze
  or metal. Do not dither across a vessel — seven steps over ten pixels already
  band finely, and a checkerboard reads as dirt on the glaze.
- A hole is not a flat dark ellipse with a dither over it. Show the lining
  curving away on the far side, then ramp into shadow with the dither only on
  the boundary between steps. See `shaft()` in `wells.py`.
- Variants must differ in value, not only in hue: dark slate, warm sand and
  pale limestone, not three greys.

## Standing on the ground

Anything with a round base gets one: `revolve(..., foot=n)` drops the middle of
the body lower than its sides, because the base is an ellipse seen from
slightly above. The wells always had this; a flat bottom edge reads as a
sticker laid on the floor, which is what gave the barrel, the churn and the
skep away.

## Motion

A prop can also carry its own animation frames. List it in `ANIMATED` in
`scripts/art/props_b/__init__.py` with a frame count and give its draw
function a `frame` argument; the build emits `-m1..` beside the base sprite
and the renderer cycles them at 190ms, slower than a flame. The frame count
comes from the atlas, and more frames means a *slower* movement: over four,
the period doubles, so a beam scale settling takes three seconds while a bee's
round takes under one. The beehive uses
this for the bees going round it. Keep the moving part *outside* the
silhouette — bees drawn over the straw read as specks in the weave.

A prop that is blown rather than animated does it in layers, not in baked
frames. Split the drawing
with a `layer` argument and list the family in `LAYERED` in
`scripts/art/props_b/__init__.py`; the build emits `-frame` and `-hang`
alongside the whole sprite, which stays in the atlas for the lab, the UI and
the shadow mask.

The renderer draws `-frame` as the entity and rides `-hang` over it, swayed by
the scene's shared wind (`HANGING` profile: wide, slow, no rotation). Two rules
learned from the drying rack:

- The rigid part must not move. A rack whose legs sway is a rack falling over.
- The join belongs to the rigid layer. The knot stays on the pole and only what
  hangs below it swings, or the cord comes untied on every gust.

`windSway` gives integer translation; rotation past about a degree shears pixel
art, which is why the hanging profile sets `angle: 0`.

## Buildings

`building.py` holds the shared vocabulary — `_wall`, `_roof`, `_door`,
`_ground`, `_flies` — and every structure on the map is built from it: a wall
seen square on with a good deal of roof above it, lit from the upper left, the
eaves throwing a line of shadow down onto the wall. A region is a choice of
materials, not a redraw. Walls take their light across their width (bright at
the left, shaded at the right corner, darker at the ground); roofs narrow as
they climb, widen their overhang as they descend, and carry their own course
pattern per material.

## Working method

Draw, render, look. Do not write more than one prop between renders.

```bash
python3 -m scripts.art.props_b.review well trough   # contact sheet with a figure
python3 scripts/build_props.py                      # atlas + audit
```

`review.py` puts every prop beside the standing character, because scale
against the figure is most of the judgement and the source tells you nothing
about it.

`scripts/art/prop_audit.py` runs inside the build and catches what a rule can
see: a canvas edge cutting through the drawing, a sprite over its budget,
part-transparent alpha the shadow builder cannot use, shading too flat to read,
and a sprite that is mostly outline. It does not tell you whether the thing
looks like a well.

## The art audit

`npm run art:audit` measures every sprite in the shipped atlases -- props,
buildings, characters, terrain -- and writes `public/art-audit.json`. Open
Settings -> Developer -> Art audit, or `/art-audit`.

It reports numbers, not verdicts, because the useful question is usually
"which of these is unlike its neighbours", not "does this pass". Filter with
the sliders until the sprites listed are the ones that actually look wrong;
that range is the rule worth writing into this file. The presets are the
questions we ask most: hard keylines, thick outlines, neutral ink, off
palette, no light on it, banding.

Four overlays, because most of these faults are invisible at 1x: **Rim**
paints only the near-darkest boundary pixels, so a tinted rim nearly vanishes
and a keyline draws the whole outline; **Off palette** magentas any colour in
no declared ramp; **Value** throws the colour away; **Steps** recolours each
tone by its rank, which shows how many steps a surface really uses and where
they jump.

Every metric is compared against the median for its own kind, so a building
is judged against buildings.

## Reviewing

Open the prop lab (Settings → Prop lab) and tick **A/B compare**: the older
study and the redrawn one appear side by side under the same light, background
and figure. The stage grows with the largest frame, so a loom is not clipped.

Families drawn only in the B set (`town-well`, `anvil`, `loom`,
`strapped-chest`) show the B study alone.
