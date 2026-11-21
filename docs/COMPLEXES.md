# Complexes, Palaces, Fairs, Tombs and Towers

Large multi-area interiors generated from the seed one area at a time and walked between, plus multi-storey towers.

## Shared complex architecture

Caves, sewers, mines, world's fairs, palaces and tombs are complexes:

- `src/world/complex.ts` holds the shape every area shares: exits (edge strips and doorways taking the player to the matching exit of another area, `exitAt`, `arrivalFrom`) and lifts (a stair, rope or shaft used with the action key).
- `src/core/complex.ts` holds the active run (`state.complex`), per-complex record (`state.complexes`: finds taken, kills, areas walked), the host, and `KINDS` (one row per kind routing engine calls). A new kind is a row there, a generator in `src/world/`, a module in `src/core/`, and a view.
- The walked kinds (fairs, palaces, tombs) share `cachedArea`, `arriveIn` (land beside the returning exit/lift, record the area as walked), `areaTarget` (lifts and things in reach), `burnLight`, and `complexMap`, drawn in the sidebar as `AreaMap` (`src/ui/Minimap.tsx`).
- Caves and sewers remain stacks of levels with their own caches and arrival; they use `KINDS`, `takeFind`, and `burnLight` without exits.
- `src/render/lamplight.ts` lights underground views and draws the lamp gauge. `WorldScene` has one `areaView` slot for a fair, palace, or tomb area.

A new kind of large interior plugs in at those three places (`world/complex.ts`, `core/complex.ts`, `areaView`). Do not start a parallel system.

## Palaces and halls

A palace is planned and walked as a `Fair` in data (the kind, space ids and types still say `fair`; renaming them is owed). Doors are not yet closed by rank, and no door leads from the open map into a palace yet.

### Rendering and styles

- Hand-planned palaces (`src/content/palaces/versailles.ts`, `buckingham.ts`, `white-house.ts`, shared helpers in `kit.ts`) and generated plans (`src/content/palaces/plan.ts`) use `PalaceStyle` (`src/content/palaces/styles.ts`) painted by `src/render/fair/palace.ts`: ramps for panelling, mouldings, furniture frames, pier stone and cloth; floor types (parquet, herringbone, marble, carpet, tatami, brick, earth, flags); wall bay patterns; and room-specific furniture from `FURNITURE` (`src/render/fair/things.ts`).
- **Orders**:
  - `classical` (`louisQuatorze`, `victorianState`, `federal`): piers and cornice, seven-cell back walls in three-cell bays (`palaceBays` in `src/world/fair.ts`), window light on the floor.
  - `timber` (`neolithicHall`, `meadHall`, plus `walling: "stone"` for `gothicHall` and `"ashlar"` for `incaHall`): thatch rafters or oak boards, hung wall bays, roof posts, trestle boards, glowing hearths, high seat.
  - `roman` (`romanHouse`): panelled plaster over a dado under garlands, curtained doorways, mosaic or signinum floors, roof openings (`court`: atrium pool, peristyle garden).
  - `pillared` (`egyptianPalace`, `persianPalace`, `aegeanPalace`, `islamicPalace`, `mexicaPalace`): free-standing columns (`papyrus`, `persian`, `aegean`, `moorish`, `mexica`) painted by `pillaredBack`, rows to a dais throne (or round hearth in Aegean halls).
  - `screened` (`chinesePalace` / `lacquer`, `shoinPalace` / `cypress`): timber frame with screens painted by `screenedBack` (Ming/Qing red posts on stone drums; Japanese bare posts, tatami mats, cushions, gold folding screens).
- A rustic yard (`rustic` on a court) uses trodden earth, wattle fencing (`src/render/boundary-forms.ts`), and map props/trees via `atlas:<frame>:<cells>` in `FairView`.

### Furniture as props

Palace furniture is props, not scenery: `src/content/props/palace.ts` defines each piece in the prop catalogue (carried, topples, breaks, containers, `seat`, `burns`), `src/world/fair.ts` lists them on the level (`props`), and `arriveIn` spawns them into `state.objects` on first entry. They render from `made:palace:<fair>:<area>:<kind>:<n>` (`palacePropPicture`; `@<px>` raises tabletop items until picked up). Columns, posts, hearths, and laid dining tables remain scenery. Exhibits are also props (`src/content/props/exhibits.ts`, marked by `AreaThing.prop`).

### Generated palace plans and court posts

`src/content/palaces/plan.ts` expands each kind into four seeded plans at load (`generated`), setting rooms in rows from the gate inward (`setOut`; rooms with `opens` only connect to listed neighbours):

- **Halls & manors**: Neolithic big house (`hall-stone`), chieftain's hall to AD 499 (`hall-iron`), lord's hall to 1150 (`hall-lord`), manor (`manor`, 1151–1520, `manorPlan`), Gothic castle (`palace-gothic`, 1151–1649, `castlePlan`), Baroque palace (`palace-baroque`, 1650–1789, `enfiladePlan`), nineteenth-century great house (`palace-house`, 1790–1914, `corridorPlan`).
- **Processional & courtyard plans**: Egyptian (`palace-egypt`, 1550–332 BC), Persian (`palace-persia`, 550–330 BC), Mycenaean (`palace-aegean`, 1450–1150 BC), Inca (`palace-inca`, 1400–1533), and Mexica (`palace-mexica`, 1325–1521) via `axisPlan`; Chinese (`palace-china`, 1368–1911, `courtAxisPlan`); Japanese (`palace-japan`, 1580–1868, `shoinPlan`); Islamic (`palace-islamic`, 700–1900, `divanPlan`); Roman house (`domus` / `domus-early`, 60 BC–AD 480).
- Each kind lists household `posts` (title, prompt keywords, livelihood, household share). Prompts naming a ruler or court post start inside via `venueFor` / `postFor` (also resolved in `server/world-weaver.ts`), and a quarter of unprompted city starts begin at court (`courtStart`, `COURT_SHARE`).

## World's fairs

A fair is a `Fair` in `src/content/fairs/` (`london-1884.ts`, `paris-1889.ts`, `chicago-1893.ts`), planned either **from a map** (area `at` rectangles joined by `fairWays` in `src/world/fair.ts`) or **by hand** (explicit `links` and archetypes). Prompts naming a fair start at its gate (`below: "fair"`).

- Galleries hold display tables (`table:<class>:<w>x<h>`), trade stalls (`stall:*`), working machinery loops (`src/render/machines.ts`), and glass catalog cases (`on: "case"`).
- Small handheld exhibits come from `src/render/fair/items.ts`; standalone floor furnishings use `src/render/fair/things.ts` with footprints from `FAIR_SIZES`. Fixed tabletop exhibits (`on: "table"`) and catalog cases open focus cards with historical catalog source links and photos.
- Building fronts are painted in `scripts/art/front_fair.py` (`npm run art:fair`); `npm run capture:interiors -- fair` and `fair-variants` export review sheets.

## Tombs

`src/world/tomb.ts` (`tombPlan`) lays out areas from entrance stair to burial chamber with shafts, side rooms, walled-up doorways, and grave goods from a `TombStyle` in `src/content/tombs/` (currently New Kingdom Thebes). `src/core/tomb.ts` handles lamps, ropes, breaking blocked doorways, and finds; `src/render/tomb/` paints the rock and walls. Prompts naming a tomb start on its stair (`below: "tomb"`).

## Towers (not a complex)

Tower storeys are ordinary interiors (`<place>@<n>`, `src/world/tower.ts`: `floorSpace`, `parseFloor`) built on demand by `interiorOf`:

- `TowerStyle` (`src/content/towers/`) defines skyscraper frames (`mod-deco`, `mod-vysotka`, `mod-bubble`), storey count, lift, lobby, and room styles; ordinary buildings of 4+ storeys use `blockStyle` (`src/content/towers/blocks.ts`).
- `src/content/towers/tenants.ts` scopes firms by era and region; each floor is a real workplace (`workplacesIn` in `src/world/v3/employment.ts`) with its own hours, overtime, night shifts, and seeded `towerStaff`.
- Beside a lift door, the action key opens `src/ui/TowerSection.tsx` to choose a floor (`lift` action).
