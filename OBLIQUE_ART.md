# Oblique buildings and props

The settled style for buildings: the front square on, the right-hand wall as a
shallow strip sheared up at 45 degrees, the roof leaning back over both. It is
a nod to depth, not a measured projection. General drawing rules are in
`BUILDING_ART.md` and `PROP_ART.md`; this file is only what is particular to
the oblique view.

## The numbers live in one file

`scripts/art/oblique_style.py`. Every house uses a 12px side wall, including
the new large footprints; only explicitly deep halls may use 14 or 16px. Roof
rise is independent of the side depth, as are eave and verge
overhang, storey height, sun direction, and the right-face depth for props.
A painter imports them. It never defines its own; the audit fails if it does.

## The loop

```bash
python3 scripts/art/review_sheet.py out.png --zoom 4 house-med-1        # one building, big
python3 scripts/art/oblique_audit.py --sheet out.png house-med-          # a family, on grass, beside the figure
python3 scripts/art/gold_master_sheet.py artifacts/gold-masters.png      # seven standards at three scales
python3 scripts/art/oblique_audit.py                                     # regularity; exit 1 on a fault
npm run art                                                              # ship
```

Judge a single building at 4x, then the family sheet for whether it hangs
together. Run the audit before `npm run art`.

The figure on these sheets is not an atlas human. It is cropped from the
current live renderer and kept at `scripts/art/reference/current-adult.png`.
After changing the character renderer, run Vite and then
`npx tsx scripts/capture-building-scale-reference.ts`. The adjacent JSON says
which renderer, pose and occupied bounds produced it.

## Gold masters and scale

The seven reference families are declared in `goldMasters` in
`src/content/graphics/buildings.json`. Their retained source is the small
column; `scripts/art/gold_masters.py` derives two medium seeds and one large
seed into real atlas recipes. They are ordinary world sprites, not enlarged
bitmaps. Footprints, facade parts and roof pixels are redrawn at native size.

Every family must have all four columns on the gold-master sheet. Medium is
the normal house against the current adult. Large is uncommon fabric: a
prosperous house, an extended household, or a communal prehistoric building.
Do not make a large form common merely to make a town look busy.

Roman, North African and West Asian urban houses are declared separately in
`src/content/graphics/regional-houses.json`. Structural families own footprint,
storeys, courtyard plan, function and scale; profiles own materials, openings,
surface treatment, parapet, accent and roof furniture. The compiler publishes
`roofSurfaces`, `roofVoid` and `roofAccess` on each model. Roof rectangles use
local footprint cells and a storey level, so a future traversal system can use
them without reverse-engineering pixels. Keep a quiet connected route across
each roof when adding furniture. Their contact sheet is built with
`npm run art:regional-houses`.

East and South Asian profiles use the same structural compiler and the same
12px return. Tiled courtyard plans publish four roof-slope rectangles around a
true courtyard void; East Asian street ranges publish paired pitched slopes;
Indian havelis publish flat terrace rings; Bengali and Malabar forms publish
deep monsoon slopes. Raised eaves, ridge caps and tile channels belong to the
roof style. Paper lattice, timber grids, jali, gates, noren and painted bands
belong to the profile. Keep these independent so a profile can vary without
forking the renderer. Build the review sheet with `npm run art:asian-houses`.

`wealthTier` is visual restraint as well as added detail. Tier 0 keeps a plain
ridge, muted gate and work-worn finish. Tier 1 may add one lamp, sign, jar group
or painted member. Tier 2 may add paired lanterns, a projecting gate canopy,
painted brackets and historically suitable ridge terminals. Do not use a
pagoda as generic house trim: Chinese and Korean domestic roofs use simplified
ridge ends and roof figures; a genuinely tiered sacred roof belongs to a
religious or civic recipe.

Courtyard roofs expose a deeper view into the opening while keeping the lateral
return at 12px. The painter publishes `courtyardLight` polygons in sprite pixels:
opening, visible floor, rear wall, side wall and apparent wall drop. These are
presentation geometry, separate from the footprint-cell `roofVoid` and traversal
surfaces. Inner wall feet, recessed openings and quiet paving establish depth;
solar shadows are added by `src/render/courtyard-lighting.ts` using the same six
phases and cloud strength as ground shadows. Morning and afternoon reverse the
cast, noon shortens it, and night supplies ambient recess shade without solar
cast. Only visible buildings retain composed textures; phase changes and scene
shutdown release unused textures. Review them in the graphics lab's courtyard
study with time-of-day colours both enabled and disabled.

Small `serviceStyle` buildings share the profile but change function and
silhouette: storehouse/granary, workshop, gatehouse/market pavilion and local
hall. They are settlement texture, not replacements for venue-scale civic and
religious landmarks.

Roofline polish is profile-owned. The regional painter distinguishes Chinese
raised terminals, Japanese kawara end caps, Korean pale ridges and painted
brackets, Bengali curved eaves, Malabar doubled rain fascia, South Asian jali or
stone parapets, and European ridge, verge and chimney treatment. Patina is a
small deterministic cluster, never all-over noise. Parapet kiosks, jars,
laundry and shade frames remain at the perimeter of flat roofs; the centreline
and the published connected route stay quiet.

These oversized families live in `/packs/regional-buildings`; loaders and art
tools must search it alongside the ordinary building and civic pages.

## Adding a region

1. Materials and recipes go in `src/content/graphics/buildings.json` with
   `"oblique": true`; add the base names to `bases` in `urban.json` so the
   row, shop, wide, tall and hall forms are derived.
2. Reach for a recipe option before new code: `roofs`, `roofForm: "flat"`,
   `windowStyle` (`casement`, `mullion`, `sash`, `shutter`, `slit`),
   `arcade`, `portico`, `frontispiece` (`stepped`, `pediment`), `wing`,
   `turret`, `chimneys`, `timber`. They are all in `scripts/art/oblique.py`.
3. A form the options cannot make (a dome, a curved eave, a drum) is a
   subclass, as `ObliquePlayhouse` and `ObliqueChurch` are. Paint each face
   flat, then shear it a row or a column at a time so pixels stay whole.
4. Gate the set in `src/content/geography/pack.ts`. A whole setting switches
   at once: a town must never mix flat-front and oblique buildings.
5. Venues switch art by date through `eras` in `src/content/venues/table.ts`.

## What the sprite owes the world

The front wall is the footprint's width and stands on its front edge. The side
wall and roof are overhang, never collision. The model publishes `anchor` (under
the middle of the front wall), `door` (the shared 10x23 leaf must fit it),
`occlusion`, and `margins`: the tiles it overhangs to the right and behind. A
plotted town keeps those clear; a town in rows lets the next house hide them.

Buildings drawn the same whichever way their lot faces are packed once. Keep
it that way: vary by seed, not by facing.

Town layout is not the art's business. `settlementLayout()` in
`src/content/settlements/layout.ts` decides plots or rows from place and date.

## Smoke

A painter lists where smoke leaves the building in `self.smoke`, as
`[x, y, 'chimney' | 'vent']` in sprite pixels: the top of a stack, the ridge
of a stackless roof, the apex of a round house, the hole in a flat roof. The
model publishes it and `src/render/smoke.ts` does the rest. A landmark with no
hearth publishes nothing.

## Props

Round things are left alone: a barrel looks the same from every side, and its
visible top already says the view is from above. A boxy prop wider than 12px
that stands beside buildings gets a shaded right face and a lit top from
`extrude()` in `scripts/art/props_b/core.py`. List its family in `OBLIQUE` in
`scripts/art/props_b/__init__.py`; do not draw the face by hand, so every
variant and motion frame gets the same one.

## Looking at a settlement without the browser

```bash
npm run town:sheet                   # the whole panel in scripts/town-sheet/panel.json
npm run town:sheet -- london-1308    # one setting
```

It generates the real plan, then pastes the game's own sprites onto flat
ground, depth-sorted as the game sorts them: `artifacts/towns/<name>.png` and
a `panel.png` of all twelve. Ground, fences and beds are schematic. Use it
before and after any change to layout, yards or building art; it is how
stacked roofs, over-paving and empty yards were each found. Add a setting to
the panel when you add a region.

## Where regional style lives

- `src/content/settlements/urban-form/*`: one record per fabric. Street plan,
  block, tiers, square, and now `plots` (block for two rows of house and
  garden, garden depth, how far down the tiers the cobbles go) and `quarters`
  (which building forms each quarter prefers; `house` is the pack's own).
- `src/content/settlements/layout.ts`: plots or rows, from the form and the
  climate, or the setting's own `settlementLayout`.
- `src/content/settlements/yards.ts`: the yard kit. Fence, front depth,
  shapes, bed crops, tree, and the props a resident's trade puts there.
- `src/content/settlements/wayside.ts`: which waymark and shrine a country
  stands by its roads.

In the planner, every fenced yard goes through `encloseYard` and every hall,
sanctuary and venue through `claimLandmark`. A bed marked `garden` is drawn
close-planted, up to its fence, in every growing season.
