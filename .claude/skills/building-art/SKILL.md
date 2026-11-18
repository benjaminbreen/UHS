---
name: building-art
description: How to draw, redraw or review buildings and their parts (walls, roofs, windows, doors, signs, lanterns, chimneys, weathering) in the house style (Stardew / Haunted Chocolatier adapted: walls square on, roofs from above at moderate depth). Load before touching any building painter, building sprite, facade, roof or building review sheet, or when asked to make buildings look better.
---

# Building art

This is the one reference for building art. Props have `docs/PROP_ART.md`;
town layout has `docs/SETTLEMENTS.md`.

The bar is Stardew Valley and Haunted Chocolatier: one authored style, charm,
legibility, and here also historical specificity. The user judges by eye.
The rules below are settled judgements with their reasons. Propose changing one
only with an A/B sheet that shows why.

The convention: **walls square on, roofs seen from above at moderate depth.**
A wall is drawn square on, with no perspective and no side wall. Roofs, wall
tops, steps and courtyards are seen from above and stack up the screen. The
roof always reads as a volume, never as a thin cap. It does not take
Haunted Chocolatier's half of the sprite either, because a city is many
buildings deep. The gold masters in `scripts/art/reference/front/` set the
proportion. "Front-on" in the code (`front_*.py`) names this convention.

Most buildings are front-on. Some families are still drawn by the older
oblique and pre-oblique painters (see "Legacy painters"), so towns mix the two
styles today. Porting a family is welcome whenever you are working in its
area.

## Rules, and why

1. **Walls square on, no side walls.** Depth comes from what projects: sills,
   balconies, cornices, hoods and awnings show a top face and cast a shadow
   on the wall below.
2. **Roofs read as volume, at moderate depth.**
   - Mansard plus a 30px top. A pitched roof is well under half the sprite,
     and about a third of the wall height or less on a row house.
   - Roofs earn their read through craft, not area: two lit planes, tiles in
     courses along the slope with a lit edge on each, bright verge and ridge
     caps, and a dark eave shadow on the wall below.
   - Hipped roofs round a court are mitred frames, with each plane's tiles
     running down its own slope.
   - Courtyards, atria and flat roofs are drawn from above. On flat-roofed
     modern blocks the roof shows half the footprint's depth as a walkable
     deck.
3. **Chimneys stay inside the roof outline** and never clip dormers, eaves or
   neighbours.
4. **Scale to the 37px adult** (`front_style.FIGURE`).
   - Doors are taller than the adult (`DOOR` 22x44).
   - Windows are about two thirds of the adult.
   - Upper storeys are about 50px.
   - Low hut doors are allowed.
5. **One value ladder and one light.**
   - Every colour comes from a ramp in `front_materials.RAMPS`, all on the
     same eight lightness steps. Lights lean warm and shadows lean violet.
   - Light comes from the upper left.
   - Shade a big plane by stepping its colours along the ramp in bands, never
     by mixing, which smears tiles and breaks the palette.
   - Never lay a colour grade over a finished sprite.
   - Roof colours follow historical regional tones (`TONES` in
     `front_eave.py`), never pale blue-white.
6. **Edges as Stardew draws them** (`front_kit.finish`): a lit rim inside top
   edges, a darker roll on the bottom and right, and an outline in a deep
   shade of what it touches. Never use black outlines.
7. **No dithered gradients.** A checkerboard gradient reads as a screen door.
   Single dithered rows in thatch courses or under an eave read as straw and
   are fine.
8. **Palette discipline.** Colours used by only a pixel or two are noise. The
   painters end with `consolidate()`.
9. **Craft over fuss.** Do not fake life with anecdotal props: no cats in
   windows and no pot plants on every sill. Improve bevels, recesses, shadows
   and proportions instead. Charm comes from small hand-drawn sprites
   (emblems, chimney pots) and from weathering.
10. **Round things stand on ellipses and project from above** (`front_solid`).
    Props and shop interiors are shared parts, not painted per building.
11. **Modular but not absolutist.** Use the library where it serves and draw a
    part in place where it does not. When a part is improved, improve it in
    the library so every building gains.
12. **Historical specificity lives in the spec**: materials, frames, infills,
    heads, proportions, roof form, sign style and emblem. How a plank or a
    slate is drawn stays the same everywhere.
13. **Signs are not baked.**
    - Wall-hung `wallsign-*` fixtures are chosen per household in
      `src/content/props/signage.ts`.
    - For a shopfront, the painter leaves the wall bare and calls
      `sign(x, y, w, h, kind, trade)` (`front_modern.Block`). The game draws
      the board and the words (`src/render/shop-signs.ts`) in the street's
      script.
    - Non-Latin words live in `src/content/settlements/sign-words.json`. Rerun
      `scripts/art/sign_glyphs.py` after editing that file.
14. **Keep what the old sprites did well.** When redrawing huts, tents,
    mud-brick or Mesoamerican houses, keep the old sprites' curated palettes,
    small scale and hand banding, and better them. Several first redraws were
    rejected for being bigger, greyer and more even than what they replaced.
    The old Hittite and Maya temples were preferred to their redraws and kept.
15. **Regional truth over habit.** Some regions have unglazed, shuttered
    windows and no chimneys. There, lamplight comes from shutters ajar,
    lattices and shell panes.

## Craft

**What passes:**
- The silhouette names the form before surface detail does.
- Material texture forms clusters, with quiet base colour between them.
- Openings group into a facade; they do not fill every bay.
- Wear collects at eaves, sills, thresholds and the wall foot, in two or three
  quiet clusters. Never stipple a whole roof.
- Seeded variants keep their identity while changing meaningful parts.
- A family includes ordinary small and medium fabric. Large is visibly rare.

**What fails:**
- Repeating every tile, brick or window at equal contrast.
- Stretching a short facade without regrouping its openings.
- Using noise to repair the wrong solid or weak value separation.
- Baking grass, flowers or a patch of ground into the sprite. The terrain
  draws those.

**Shade from a normal, not across the sprite.** A diagonal wipe puts one
gradient on a sphere, a cylinder and a flat roof. Give the surface a normal
and light it from one sun.
- Dome: `nx = (x-cx)/rx`, `ny = (y-foot)/rise`.
- Cylinder: `ny = 0`.
- Cone: `ny` fixed at minus the slope.
- Use seven or eight steps on a curved shell, and stretch the ramp so the
  shadow side is genuinely dark.
- A flat surface facing the sky is near evenly lit: one tone, with a darker
  ring at the far rim.

**Contact.**
- A wall's foot never sees the sky, so give it a few rows of bounce shadow.
- A roof needs a dark line where the eave turns under.
- One pixel of rim light along the lit edge. Two is a halo.
- The doorway is the darkest shape, so give it a clean silhouette and a frame.

**Detail is subtraction.** When something does not read, remove half of it
before adding anything. Three heavy posts read as a building; nine sticks
read as a fence.

**Form before finish.** No amount of shading fixes the wrong solid. Sample the
reference's palette rather than its impression.

**Ornament names a construction tradition before it signals wealth.** These
are separate vocabularies; never swap them as generic "Asian" or
"old-world" trim:
- Chinese ridge terminals
- Japanese round ridge-end caps
- Korean painted eave brackets
- Bengali curved terracotta eaves
- Malabar layered timber fascia
- European ridge rolls and chimney pots

Prosperity adds finish, not a different structure. Domestic clutter follows
use and place (Korean jar groups, South Asian water pots, prehistoric storage
baskets) and sits at facade edges. Household shrines are not a universal
prop. Do not back-project a later national style into prehistory.

## Towers

`Skyscraper` in `front_modern.py` is the pattern; the Moscow, Tokyo, slab and
podium towers subclass it. Review with
`npm run art:family -- mod out.png deco tropic vysotka`.

- **One bay grid.** `BAY` and `PIER` fix the rhythm. Tiers lose whole bays
  (`massing`), so piers line up from street to crown. Never size a tier as a
  fraction of the width.
- **A setback is a roof, not a shoulder.** The upper tier stands on the lower
  tier's roof, drawn from above with `deck`. Side strips with no front parapet
  read as buttresses.
- **The coping is one unbroken ring** in its own stone (`cope` in the spec, a
  beige a step off the wall colour), the same width on all four sides. Only
  the far parapet shows an inner face. Shadows fall on the paving in two
  steps: under the far parapet, along the left one, and to the right of
  anything standing on the deck.
- **Pavers are quiet**: one tone, joints one step darker and broken, in a
  running bond. A full grid reads as graph paper.
- **Edges take the colour they touch.** Towers set `EDGE = True`, so the
  outline is a deep, richer shade of its neighbour (`outline(c, deep=True)`),
  and a volume rising from a deck is edged in step 5 of its own ramp. Never
  one dark grey for everything.
- **Glass is saturated and two-toned**, spandrels dark and quiet. One thin
  chevron per spandrel is the ornament; anything heavier turns to noise at
  twelve storeys.
- **The doorway is a part, not a tower detail.** `portal(b, cx, base, top,
  stone, style)` in `front_modern.py` works on any `Block`: `deco` (proud
  jambs, lintel seen from above, twice-stepped mitred reveal, glass block over
  brass), `arch` (1880-1915, round arch and fanlight), `slab` (1950-1975,
  glazed lobby under a canopy). It is taller than the base and breaks the
  belt course. `sconce` and `metal_door` are its pieces. Add a style there
  rather than drawing a doorway in a painter.
- **`front_props.water_tank`** is the roof tank for any building: a lathe
  solid on a braced stand, with its shadow on the roof it is given.
- **Crowns are solids**: `ziggurat` (blocks with visible tops), `steel_crown`
  (arches lit as cylinders, ordered slit lights; no stipple), or `penthouse`
  and the water tank on a deep deck.
- **Crowns belong to every tower.** `crown_step`, `crown_spire`,
  `crown_tank`, `crown_helipad`, `crown_tiers`, `crown_dome`, `crown_plant`,
  `crown_billboard`, `crown_lattice` and `crown_pyramid` are
  `Skyscraper` methods picked by `crown` in the spec, so a new skyline is a
  new spec. Add a crown as another `crown_<name>(top, hw)`.
- **Street floors belong to every tower too**: `ground_mall` and
  `ground_lobby` on `Skyscraper`; add `ground_<name>(t, base)`.
- **A flat roof is a deck.** Every tower's top is `roof()` with its crown
  standing on it and shading it; never a cap line with things perched on it.
- **The podium tower** (`Tropic`) is the modern pattern: a street floor
  (`ground`), a podium storey, the
  podium roof as a `deck` with planters, then a shaft of `curtain` floors.
  The shaft's width is fitted to whole panes. Glass varies by a pane or two
  per floor and carries two or three short `glints`; big diagonal bands
  read as stickers. Glass towers take no weather streaks.
- **Narrow forms fill a dense city.** A look's `shop` (7 cells), `cottage`
  (6) and `hut` (4) forms are what leftover frontage can take. Give a tall
  look narrow forms with real height (`FLOORS`) rather than a one-storey
  stub: the deco sliver tower, the six-storey tenement, the loft building.
- **Light is registered as it is drawn.** `pane(..., lit_odds)` per storey so
  whole floors are lit or dark; `sconces` and crown slits glow; `beacon` for
  a mast light the game blinks; `tube` and `bulb_row` for neon and chasing
  bulbs (`bulbs=True` in a deco spec rings the portal). Give a look these
  through its spec, by era: no beacon before the 1930s, neon from the 1920s.

## The system

| File | Owns |
|---|---|
| `front_style.py` | Shared numbers: figure, doors, bay, storeys, outline |
| `front_materials.py` | The value ladder; `RAMPS`, 30 wall and roof materials |
| `front_openings.py` | Frames x infills x heads, doors, shutters, window boxes |
| `front_fixtures.py` | Wall-hung signs (the styles in `signage.ts`), trade emblems, lanterns |
| `front_weather.py` | Moss, soot, streaks, lichen: one `wear` dial |
| `front_kit.py` | The immeuble from a spec; `outline`, `consolidate`, `finish` |
| `front_parts.py` | Arches, windows of every period, buttresses, mouldings, gables, clocks, tower tops |
| `front_solid.py` | Projection kit: `box`, `lathe` (domes, pots, wells), `vault`, `recess` |
| `front_stepped.py` | Stepped masonry, paving from above, platforms, pyramids, stairs |
| `front_house.py`, `front_eave.py` | Gabled and eave-front houses: roof coverings, hips, dormers, stacks |
| `front_houses.py` | Pre-industrial European house families as specs |
| `front_church.py`, `front_civic.py`, `front_landmarks.py` | Churches with regional `STYLES`; civic halls with `HALL_STYLES`; one-off landmarks routed from `civic_spec` |
| `front_roman.py`, `front_classical.py`, `front_classical_props.py` | Roman houses, insulae, shops, domus, temples, thermae; watchtowers, shrines, street fittings |
| `front_persian.py`, `front_westasia.py` | `compound`, the courtyard form; Iranian, Levantine, Arabian, Nile and Maghrebi houses |
| `front_ancient.py` | Wires the Roman and Iranian frames to those builders |
| `front_sinitic.py` | Chinese, Korean and Japanese houses, halls, compounds, shops, temples, theatres |
| `front_southasia.py`, `front_seasia.py` | Havelis, Bengal and Malabar houses; Southeast Asian houses on posts |
| `front_africa.py`, `front_andes.py`, `front_pacific.py`, `front_orthodox.py` | West and Central African houses and the kay; Inca houses; the fare; Byzantine and Rus town houses |
| `front_huts.py`, `front_tents.py`, `front_mudbrick.py`, `front_meso.py` | Huts, lodges, round and long houses; black tents; early mud-brick in five regions; Maya and Nahua houses |
| `front_sacred.py`, `front_sacred_*.py` | Temples, mosques, churches, synagogues and shrines by region, one spec contract |
| `front_worksites.py`, `front_worksites_world.py` | Working buildings with their yard equipment |
| `front_goods.py`, `front_props.py` | Shop interiors as bays; props baked into buildings (wells, fountains, pots, trees) |
| `front_family.py` | The registry for spec-driven house families. `MODULES` lists `front_iberia`, `front_modern`, `front_modern_world`, `front_europe`, `front_homes`, `front_victorian` and `front_straits` |
| `front_iberia.py` | The `casa` family. Its roofs, window cages, balconies, doorways and shop bays are the library for this kind of house |
| `front_modern.py`, `front_modern_world.py`, `front_europe.py` | The 1900–1990 street; European city houses of 1700–1850 |
| `front_victorian.py` | The city centre of 1850–1914 in the British and American manner: `chambers`, `emporium` and `pub`. `light` draws a sash under a flat, round or pointed head in its ring of stone; `rustic`, `cornice`, `pediment`, `ledge` and `urn` are its other parts |
| `front_straits.py` | Rows of the South China Sea, 1820–1965: `shophouse`, `shophouse-late`, `shophouse-deco` over a covered walk, each unit in its own wash, and the Shanghai `lilong`. `shutter_window`, `fan` and `roof_tiles` are its parts |
| `front_homes.py` | Houses in gardens, 1850 on: villas in brick, stucco and weatherboard, the suburban house, bungalow, ranch house and rendered house. `Home` is the base for a detached house; `gable`, `hip`, `bay_window`, `veranda`, `pier_post`, `casement` and `garage_door` are its parts |
| `front_audit.py`, `front_review.py` | Checks, as advice; review sheets beside the pinned gold masters |

All of these are in `scripts/art/`. Each module's `__main__` draws its own
review sheet.

**How the bake picks a painter.** `scripts/art/buildings.py` merges every
recipe source. It then lets `front_houses.adopt`, `front_civic.adopt`,
`front_ancient.adopt` and `front_family.adopt` claim recipes by setting a
flag. In `paint()`, the first matching flag wins:
`frontWorksite` > `frontFamily` > `frontAncient` > `frontHouse` >
`frontCivic` > the legacy painters. A recipe that no front-on module adopts
falls through to the old code.

## What the sprite owes the world

- **Footprint.** The front wall is the footprint's width and stands on its
  front edge. Anything above or beside it is overhang, never collision.
- **Model fields.** The model publishes `anchor` (under the middle of the
  front wall), `entrance` (the cell the drawn door stands in), `door`,
  `visible` (the painted part, which planners keep clear) and `occlusion`. Oblique frames also publish `margins`: the tiles they overhang
  to the right and behind.
- **Smoke.** A painter lists where smoke leaves in `self.smoke`, as
  `[x, y, 'chimney' | 'vent']` in sprite pixels. `src/render/smoke.ts` does
  the rest. A building with no hearth publishes nothing.
- **Night.** A painter's `night` image ships as `<frame>-glow` (lit panes,
  paper, open rooms). The scene prefers it to guessing glass. A part that can
  be lit takes `lit=` and marks its region with `glow()`: 1 for panes, 2 for
  an open room.
- **Facing.** Buildings drawn the same whichever way their lot faces are
  packed once. Vary by seed, not by facing.

## Adding a regional house family

The `casa` family is the pattern. A new set of houses needs no change to the
bake, the atlas or the renderer.

1. **Parts first.** Draw what the region has that the library lacks as
   module functions taking `(c, x, y, ...)` and a ramp, so the next region can
   use them. Reuse `front_iberia`'s roofs, openings and balconies before
   drawing new ones.
2. **A look, not a sprite.** A look is:
   - a base spec
   - three colour variants
   - a `humble` override for small and poor houses
   - its usual and tallest storeys (`LOOKS` in `front_iberia.py`).

   One builder, `house(look, variant, form, cells, seed)`, must draw it at
   every width from 64px to 272px and in every form in `urban.json`. Settle
   the geometry in `__init__` so the bake can place the entrance without
   painting.
3. **Register it** with `front_family.register(prefix, looks, house)`, and add
   the module to `front_family.MODULES`. The game then gets
   `<prefix>-<look>-<0..2>` and `-urban-<form>` frames, each with a walkable
   entrance and a `-glow` frame.
4. **Review** with `npm run art:family -- <prefix> out.png [look ...]`. This
   writes every look at every form beside the gold masters, plus `-street` and
   `-night` sheets. Judge the street before the single sprite.
5. **Route it** in a subject file under `src/content/graphics/` (for example
   `iberian-houses.ts`, which holds region boxes and dates). Call it from
   `pack.ts`, and add rows to the house cases in `tests/place-eras.test.ts`.

## Working loop

1. Find the current sprite and its painter. Write or extend a spec first, and
   add a library part only when a spec cannot express the thing.
2. Put the result on a review sheet beside the gold masters and the adult:
   `.venv/bin/python scripts/art/front_review.py out.png new.png`.
3. Zoom to 3x and criticise it yourself before the user sees it: value
   structure, silhouette, shadow logic, repetition, scale.
4. Run `python3 scripts/art/front_audit.py <prefix>` on what you touched. Its
   faults are advice: fix the accidents, keep the choices. Use
   `npm run art:front` for the full audit plus the review sheet.
5. Show the user one sheet, and street sheets for a family. Do at most three
   passes before asking.
6. On approval, bake with `npm run art`. Check one shot in game
   (`npm run shot`) and one town without the browser (`npm run town:sheet`,
   or `npm run town:sheet -- london-1308` for a single setting). Add a setting
   to `scripts/town-sheet/panel.json` when you add a region.
7. If the new work beats a gold master, re-pin it with
   `front_review.py --pin <name>`. A bare `--pin` lists the masters and their
   drift. `casa-caribe`, `casa-bahay` and `casa-oaxaca` are the regional
   masters for their parts of the world.

A fresh-eyes critique helps: give a subagent the sheet, the gold masters and
this file, and ask for specific defects.

## Where regional style lives outside the art

- `src/content/settlements/urban-form/*`: one record per urban fabric (street
  plan, block, tiers, plots, quarters).
- `src/content/settlements/layout.ts` (`settlementLayout`): plots or rows.
- `src/content/settlements/yards.ts`: the yard kit.
- `src/content/settlements/wayside.ts`: waymarks and shrines.
- `src/content/graphics/*-houses.ts` and `pack.ts`: which family a place and
  date gets.
- `src/content/settlements/modern-buildings.ts`: which modern building each
  land use builds.

## Legacy painters

These still paint frames, through the fallthrough in `paint()`. Do not start
new work in them. Port a family to front-on when you are in its area, then
delete the painter once nothing reaches it.

| Painter (file) | Still draws | Natural front-on home |
|---|---|---|
| `ObliqueModern` (`oblique_modern.py`, via `city_kit`/`modern_grammar`) | Industrial and modern `modern-*` blocks, sheds, towers | `front_modern`, `front_kit` |
| `ObliqueBuilding` (`oblique.py`) | `house-aegean*`, `house-longhouse*`, `roman-insula-*`, the European and Neolithic service gold masters, `theatre-court-opera` | `front_family`, `front_ancient`, `front_huts`, `front_landmarks` |
| `ObliqueMeso`, `ObliqueMesoLandmark` (`oblique_meso*.py`) | Mesoamerican civic buildings, ballcourt, Maya temple | `front_meso`, `front_sacred_americas` |
| `PrecinctPiece` (`precincts.py`) | Sacred precinct pieces | `front_sacred*` |
| `UrbanBuilding`, `Building` (`urban.py`, `buildings.py`) | `house-mud/roman/thatch`, `study-*`, shelters, city walls and gates | `front_family`, `front_huts` |
| `HallBuilding` (`halls.py`) | Carved-gable hall, hammam, sweat lodge, open shelter | `front_huts`, `front_civic`, `front_persian` |
| `PeriodBuilding`, `ModernBuilding` (`period.py`, `modern.py`) | Older modern and period blocks | `front_modern`, `front_europe` |
| `TheatreBuilding` (`theatres.py`) | The opera house | `front_landmarks` |
| `Roadside` (`city_roadside.py`) | Roadside candidates | `front_worksites` |
| `VoxelTemple` (`sacred.py`) | The Hittite temple, kept on purpose | none |

The gold masters in `buildings.json` `goldMasters` (nine families) are mixed:
the cottages and early houses are front-on, while the longhouse and service
masters are still oblique.

**Clean-up candidates (no recipes reach them):**
- `ObliqueChurch` (its `build_banner` is still called)
- `ObliqueRound`, `ObliqueMudbrick`, `ObliqueSinitic`, `ObliqueSteppe`,
  `ObliqueForager`, `ObliqueLodge`, `ObliquePlayhouse`
- `CampBuilding`, `ReligiousBuilding`
- the oblique painter's `courtyardLight` output: no model carries it, so
  `src/render/courtyard-lighting.ts` never fires.

Confirm with a recipe count before deleting any of these.
`scripts/art/oblique_audit.py` and `oblique_style.py` go when the last
oblique painter does.

## Open work

- Entrances follow the drawn door for eave-front European houses and every
  registered family. Gabled houses have a centred door. Roman, Persian, East
  Asian and civic painters still use the footprint's middle.
- `casa` weak spots:
  - The Aegean cube is plain.
  - The Goan porch is small.
  - The Portuguese upper windows crowd the eave.
  - Its hall form is a wide house, not an arcaded cabildo.
- Roman relief and dipinto fixtures exist but are not hung in game. The
  fascia is hung blank.
- Corner immeubles are plain fronts.

When the user approves or rejects something, turn it into a rule above (or
adjust one), rather than keeping a dated log.
