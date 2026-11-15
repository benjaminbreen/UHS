# Drawing props

How prop art is drawn and built. What props do in the game, and where they
are placed, is [PROPS.md](PROPS.md). Buildings are the `building-art` skill.

## Three prop painters

- **`scripts/art/props_b/`** draws almost every family (`DRAW_B`). New prop art
  goes here. `npm run art:props` (`scripts/build_props.py`) builds the atlas.
- **`scripts/art/props/`** is the older 48x48 study set. It still draws 17
  families, all chests, mortars, fires, hearths, ovens, stoves, lamps and
  lanterns, through the `draw_prop` fallback in `build_props.py`. Porting
  them to `props_b` and deleting the fallback is welcome; `props/states.py`
  is still imported for runtime state sprites.
- **`scripts/art/front_props.py`** draws props baked into front-on buildings
  (wells, fountains, pots, trees). It belongs to the building painters.

`props_b/solid.py` holds the shapes that put a prop in the houses' view: a
solid of revolution (`lathe`), a box (`block`) and a lying log (`log_x`), each
showing its top at half its depth. Use them for anything that has a top.

The square's furniture is `props_b/plaza.py` (the shared kit and the helpers
that show a top: `disc`, `drum`, `box`, `parasol`) and one `plaza_*.py` per
part of the world. `plaza_families.py` sorts them into families by the job a
thing does, one variant per place, and prints the contact sheet:
`PYTHONPATH=scripts .venv/bin/python -m art.props_b.plaza_families`. A draw
function that takes `frame` is animated; one such variant animates its family.

Statues are `props_b/statuary.py` and its regional `statuary_*.py`. A figure
is a `Parts` list of lit ellipsoids and tapered limbs shaded by `sculpt`, so
one description draws at any size and in any `MATERIAL` ramp; `statue(kind,
material, size, pedestal)` stands it on a pedestal of its tradition. `CAST`
says which materials each kind was made in, and `variants()` is what gets
baked: the commonest material at three sizes, the others at a city's size.
Draw a raised limb tip first, or only its shaded underside shows. Their casts
are on a second shadow sheet, `public/props/shadows-2`.

Behaviour lives in `src/content/props/catalog.ts`; art budget and variants in
`src/content/graphics/props.json`. That split is deliberate.

## Design rule

Keep behaviour, physical definition, visual recipe and historical selection
separate. One plain earthen jar can serve Egypt and India; a jar of water and
a jar of grain differ in contents, not in implementation. Variants change the
readable silhouette (wide mouth or narrow neck, handled or not, lidded or
open), not just the hue. Open lids, broken pots, spills and debris are states
of a family, not new families.

## Scale

The ruler is the adult figure, 37px tall (`front_style.FIGURE`), not the 16px
terrain cell. Work out the object's real size in metres first, then convert
against the figure. A hand pump and a well kerb must not come out the same
width, however good the shading.

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

## Vehicles

A car is seen from four sides, and four hand-drawn views never light the
same way. `props_b/vehicles.py` describes each model in metres (deck line,
cabin, wheels, fenders, lamps, paint) and samples it as a column of parts at
every point of its plan, painted far to near with ground depth at half the
prop scale. Walls take their normal from the plan's outline, tops from the
height field. Add a car by adding a `MODELS` entry and render it with the
others before building; the sheet is `public/props/vehicles`, built by
`npm run art:props`.

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

Open the prop lab (`/prop-lab`, or Settings → Prop lab) and tick **A/B compare**: the older
study and the redrawn one appear side by side under the same light, background
and figure. The stage grows with the largest frame, so a loom is not clipped.

Families drawn only in the B set (`town-well`, `anvil`, `loom`,
`strapped-chest`) show the B study alone.
