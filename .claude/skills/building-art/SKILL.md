---
name: building-art
description: How to draw, redraw or review buildings and their parts (walls, roofs, windows, doors, signs, lanterns, chimneys, weathering) in the front-on pixel style. Load before touching any building painter, building sprite, facade, roof or building review sheet, or when asked to make buildings look better.
---

# Building art, front-on style

The bar is Stardew Valley and Haunted Chocolatier: one authored style, charm,
legibility, and here also historical specificity. The user judges by eye
and has said what works and what does not; those judgements are below with
their reasons. Do not re-argue a settled rule. Propose changing one only with
an A/B sheet that shows why.

Families converted to this style are drawn front-on. Unconverted families
still follow `OBLIQUE_ART.md`; a town must not mix the two.

## Rules, and why

1. **Front-on, camera a little above.** No sheared side wall (it added work
   and nothing the eye valued). Depth comes from what projects: sills,
   balconies, cornices, hoods and awnings show a top face and cast a shadow
   on the wall below. Balconies especially: a straight-on balcony reads flat.
2. **Roofs read as volume, at moderate depth.** The user rejected a deep
   overhead roof (a third of the building, flat-shaded): it looked flat and a
   street of them hides the street behind. Mansard plus a 30px top is right.
   Gable-front houses show both slopes rising up the screen, shingles laid
   along the rake (upright stepped tiles were rejected as "bricks").
3. **Chimneys stay inside the roof outline** and never clip over dormers,
   eaves or neighbours. The audit checks this.
4. **Scale to the 37px adult.** Doors taller than the adult, windows about
   two thirds of one, storeys about 50px. The old 28px storey was arbitrary
   and made buildings read as toys. The audit checks doors and windows.
5. **One value ladder.** Every colour comes from a ramp in
   `front_materials.RAMPS`, built on the same eight lightness steps; lights
   lean warm, shadows lean violet, by one rule. A violet "grade" laid over a
   finished sprite was rejected as muddy: shift hue inside the ramps instead.
   Roof colours follow the old gold standard (navy slate, dark slate-zinc),
   never pale blue-white.
6. **No dithering.** Checkerboard gradients read as a screen door. Use
   clean stepped bands. The audit checks this.
7. **Tinted outlines, never black.** An outline takes a dark step of what it
   touches. The audit checks for black.
8. **Palette discipline.** Colours used by a pixel or two are noise; the
   painters end with `consolidate()`, and the audit checks strays.
9. **Craft over fuss.** No anecdotal props (cats in windows, pigeons, pot
   plants on every sill) to fake life; the user rejected them. Improve
   bevels, recesses, shadows and proportions instead. Charm comes from
   hand-drawn small sprites (emblems, chimney pots) and from weathering.
10. **Modular but not absolutist.** Use the library where it serves and draw
    a part in place where it does not (the rake-laid roof slopes are drawn in
    `front_house.py`). The goal is extraordinary pixel art with one look, not
    purity. When a part is improved, improve it in the library so every
    building gains.
11. **Historical specificity lives in the spec**: which materials, frames,
    infills, heads, proportions, roof form, sign style and emblem. How a
    plank or a slate is drawn stays the same everywhere.

## The system

| File | Owns |
|---|---|
| `scripts/art/front_style.py` | Shared numbers: figure, doors, bay, storeys |
| `scripts/art/front_materials.py` | The value ladder, `RAMPS`, 22 wall and roof materials |
| `scripts/art/front_openings.py` | Frames x infills x heads, doors, open shutters, window boxes |
| `scripts/art/front_fixtures.py` | Wall-hung signs (the styles of `src/content/props/signage.ts`), the sixteen trade emblems, lanterns |
| `scripts/art/front_weather.py` | Moss, soot, sill streaks, lichen: one `wear` dial |
| `scripts/art/front_kit.py` | The immeuble from a spec; `outline`, `consolidate`; the game hook |
| `scripts/art/front_house.py` | The gabled house: five roof coverings, verges, ridges |
| `scripts/art/front_eave.py` | The eave-front house: roof band, hips, eaves, ridges, dormers, stacks, lean-to |
| `scripts/art/front_houses.py` | Pre-industrial European house families as specs; family and street A/B sheets |
| `scripts/art/front_audit.py` | The checkable rules; runs inside `oblique_audit.py` |
| `scripts/art/front_review.py` | Review sheets beside the pinned gold masters |
| `scripts/art/reference/front/` | Pinned gold masters |

Each module's `__main__` draws its own review sheet.

## Working loop

1. Find the current sprite and its painter. Write or extend a spec first; add
   a library part only when a spec cannot express the thing.
2. Draw it, then put it on a review sheet beside the gold masters and the
   adult: `.venv/bin/python scripts/art/front_review.py out.png new.png`.
3. Zoom in at 3x and criticise it yourself before the user sees it: value
   structure, silhouette, shadow logic, repetition, scale. Fix what you find.
4. `npm run art:front` (audit plus review). It must be clean.
5. Show the user one sheet. At most three passes before asking.
6. On approval, bake with `npm run art` and check one shot in game
   (`npm run shot`). If the new work beats a gold master, re-pin it with
   `front_review.py --pin` and note it below.

A fresh-eyes critique helps: give a subagent the sheet, the gold masters and
this file, and ask for specific defects.

## Open work

- In game: the immeubles (`city_kit.py` routes them to `front_kit`) and the
  seven pre-industrial European house families with all their urban forms
  (`front_houses.adopt`, called from `scripts/art/buildings.py`). Churches,
  halls and civic buildings in those towns are still oblique.
- The walkable entrance is still the footprint's middle, not the door.
- Fixtures are not yet placed by trade in game; signage.ts's freestanding
  signposts should give way to them on converted streets.
- Corner immeubles are plain fronts.

## Decisions log

Append a dated line when the user approves or rejects something.

- 2026-10-06 Front-on chosen over isometric and over the oblique strip.
- 2026-10-06 Scale set by the adult; 28px storey retired for converted families.
- 2026-10-06 Deep overhead roof rejected; pass-1 roof height kept. Violet grade rejected. Fussy props rejected.
- 2026-10-06 Paris immeuble pass 4 and the gabled bakery approved as gold masters.
- 2026-10-06 Materials and openings library approved at component level.
- 2026-10-06 Wall-hung fixtures wanted in place of freestanding signs.
- 2026-10-06 Next family: pre-industrial European houses (eave-front form added); shown as A/B before wiring.
- 2026-10-06 Eave-front roofs deepened; roof colours chosen per spec from historical regional tones (`TONES` in front_eave.py); European houses wired in.
