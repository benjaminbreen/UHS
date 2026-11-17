# Architecture

How the game is put together, where each kind of code lives, and the rules
that keep it deterministic. Topic docs (listed at the end) go deeper.

The game is a React + Phaser browser app over one deterministic engine. The
same engine runs in the browser, in Node tests, in replay and under the agent
(MCP) runner. Model-written prose is optional and always has a local fallback.

## Where code lives

| Path | Owns |
|---|---|
| `src/core/` | Game state, rules and commands. `engine.ts` is the authority on what happens. Also time (`core/time/`), plots, kin, health, fauna, routing, topography. |
| `src/world/` | World generation. `v3/` builds the local scene (`v3/generate.ts`, `v3/plan.ts` for settlements). `geography/` is shared Earth geography. `regional/` holds regional constraints for the planner. `travel/` holds the map squares and journeys. `worker.ts` runs generation off the main thread. Interiors, caves, sewers and ships sit at the top level. |
| `src/content/` | Data and the resolvers that pick from it: history, geography, characters, beliefs, plots, cards, economy, props, settlements, ecology, fauna. |
| `src/runtime/` | The live session (`session.ts`, `Runtime`), save and manifest schema (`schema.ts`), world preparation (`preparation.ts`, `prepared-store.ts`), map travel (`map-travel.ts`) and the autopilot. |
| `src/render/` | The Phaser view (`WorldScene.ts`) and its painters, rasters and workers. |
| `src/ui/` | React screens: `App.tsx`, panels, cards, modals. |
| `src/audio/` | Music, ambience and effects. |
| `src/narrator/`, `server/`, `api/` | Model calls. `api/*.ts` are the Vercel endpoints. They wrap `server/*.ts`. |
| `src/agents/` + `scripts/agent.ts` | The agent tool set, its loop and run records. |
| `src/edu/` | Classroom mode. |
| `src/chronicle/` | The agent-turn chronicle. This is unrelated to the in-game years. |
| `src/dev/` | Labs, served at routes such as `/terrain-lab`, `/prop-lab` and `/character-lab` (see `src/main.tsx`). |
| `scripts/art/` | The Python art pipeline. It writes the atlases in `public/packs/`. |

`src/core` should not import from `src/render`. Today it does in three places:

- `engine.ts` imports `fence-pass`.
- `cave.ts` imports `edge-faces`.
- `sewer.ts` imports `carriageway`.

Do not add more. Moving those helpers into `core` or `world` is welcome. Core also imports a lot of `content` and some `world`. That is accepted.

## One path for every change of state

Everything the player or an agent does is a `PlayerCommand` (`src/core/types.ts`):

- It is wrapped in a `CommandRequest {actionId, expectedRevision, command}`.
- `engine.act` applies it and returns a `CommandResult` with a status of `completed`, `interrupted` or `rejected`.
- Receipts keyed by `actionId` make a repeated request harmless.
- `engine.observe()` and `engine.inspect(id)` read state without changing it.

The UI, the agent tools and replay all use this path. Do not mutate state from React, Phaser or a tool handler.

## Determinism

- Randomness comes from `random(seed, ...keys)` (`src/core/random.ts`) or `engine.rng(key)`. The counter is saved, and `stateHash` checks it.
- There is no `Math.random` or `Date.now` in `src/core`. The autopilot (`src/runtime/autopilot.ts`) still uses `Math.random`, which is a known exception.
- Model output enters the game as commands, mostly `narrate`, which carries `Intent`s such as `converse`. Those commands are logged, so replay never calls the model again.
- The renderer reads snapshots. It owns the camera, animation and wall-clock time, and never decides an outcome.

## Generation and revisions

New worlds use generator 3 (`createSettlementWorld`, `src/world/v3/`). `integratedSetting` in `src/content/geography/defaults.ts` pins them to the current revision of each subsystem: terrain, vegetation, hydrology, urban form, roads and so on. The world doc lists them.

Older generators and revisions are still branched in the code:

- generator 1 (`src/world/generate.ts`)
- generator 2 (`src/world/v2/generate.ts`)
- `urban-v1.ts`
- vegetation revisions below 9
- hydrology revisions below 3
- `src/content/legacy-packs.ts`

They exist so old records replay. **Nobody's saves depend on them yet.** Do not add a new revision gate when you change generation: change the current behaviour in place, and bump `PREPARED_VERSION` (`src/world/v3/prepared.ts`) when cached worlds would be wrong. When you work in an area that has old branches, deleting them and their tests is part of the job.

## Complexes

Caves, sewers, mines, world's fairs and tombs are complexes: areas generated from the seed one at a time and walked between.

- `world/complex.ts` holds the shape every area shares: exits (edge strips and doorways that take the player to the matching exit of another area, `exitAt`, `arrivalFrom`) and lifts (a stair, rope or shaft used with the action key).
- `core/complex.ts` holds the one run (`state.complex`), the record of each complex (`state.complexes`: finds taken, kills, areas walked), the host, and `KINDS`: one row per kind, which the engine's calls are routed through. A new kind is a row there, a generator in `world/`, a module in `core/` and a view.
- The same file holds what the walked kinds (fairs, tombs) share: `cachedArea`, `arriveIn` (land beside the exit or lift that leads back, note the area as walked), `areaTarget` (lifts and things in reach), `burnLight`, and `complexMap`, which lays the walked areas out by the side each way leaves from and shows the unwalked ones their ways lead to as "?". The sidebar draws it in place of the street map (`AreaMap` in `ui/Minimap.tsx`).
- Caves and sewers are still stacks of levels with their own level caches and arrival; they use the kind table, `takeFind` and `burnLight` but not exits.
- `render/lamplight.ts` lights the underground kinds' views and draws their lamp gauge. `WorldScene` has one slot, `areaView`, for the view of a fair's or a tomb's area.

A palace is planned and walked exactly as a fair is, and is a `Fair` in data: `content/palaces/versailles.ts` is Versailles from 1701, fourteen rooms and courts by rectangle from the forecourt to the Latona fountain, entered by a prompt naming it. Buckingham Palace and the White House are planned the same way. What makes it a palace is content: the `palace` look, painted in `render/fair/palace.ts`: a back wall seven cells tall set out in bays three cells wide (`palaceBays` in `world/fair.ts`), each bay an arch of mirror, a damask hanging with a picture, or a doorway with gilt leaves, between piers faced with red marble under a gilt entablature; parquet de Versailles in panels a bay square, or black and white marble; window light on the floor. A palace room is furnished against its walls, not in rows: pier tables with candlesticks and porcelain, stools, busts, benches, candle stands, orange trees in tubs (`paintPalaceDecor`), and the room's own piece once (`FURNITURE` in `render/fair/things.ts`: chimneypiece, altar, stand of arms, bureau). How a palace room is built, coloured and furnished is a `PalaceStyle` (`content/palaces/styles.ts`): ramps for the panelling, the mouldings, the furniture frames, the pier stone and the cloth; inset or fluted piers; a floor of parquet panels, herringbone, marble or carpet; the pattern of bays along the back wall (mirror, hanging, painted panel with a picture, sash window with curtains, bookcase, chimneypiece); and what the room is for (gallery, ballroom, drawing room, dining room, library, office), which picks its furniture in `world/fair.ts`. A palace sets one style (`palace` on the `Fair`) and a room overrides what differs (`palace` on the area), so one painter does Versailles (`louisQuatorze`), Buckingham Palace from 1856 (`victorianState`, `content/palaces/buckingham.ts`) and the President's House from 1818 (`federal`, `content/palaces/white-house.ts`). `content/palaces/kit.ts` holds the makers the three plans share. A new palace is a style, a list of rectangles and its people. A style's `order` says how the room is built. `classical` is the piers and cornice above. `timber` is a hall (`neolithicHall`, `meadHall`): the underside of the thatch on its rafters, daub or planks between braced posts, bays hung with weavings, shields, hides, antlers or shelves of pots, a beaten earth floor lit from its fires, and for furniture a high seat on the long wall, wall benches, looms, racks, pots and querns, two rows of roof posts, trestle boards and long hearths that burn in frames; a hall is dimmer than a palace room and its fires and torches glow. `roman` is a house of the late Republic and Empire (`romanHouse`): plastered walls painted in panels of the room's two colours between dark bands with gilded candelabra, over a dark dado and under a pale zone of garlands; bays may also be a painted garden, the household shrine or a cupboard of book rolls; doorways hung with a curtain; floors of black and white mosaic or red signinum. Two Roman rooms are built round an opening in the roof (`court` on the level): the atrium's pool in its marble rim, and the peristyle's garden with columns along it; daylight on the floor is brightest there. Its furniture is couches (three round a table in a dining room), a marble table at the head of the pool, the strongbox, lamp stands, folding stools, basins and a writing table. Palaces nobody drew are planned in `content/palaces/plan.ts`: a kind is a recipe that, from a seed, chooses its rooms and sets them out in rows from the gate inward (`setOut`); each kind is expanded into four plans at load, flagged `generated`. A prompt that asks for a kind (`asks`, e.g. warlord, chieftain, mead hall) starts in one of the plans whose years hold the date, picked by the world seed (`venueFor`, carried as `venue` on the setting); asked for at a date no kind covers, the start is an ordinary one. There are three hall kinds: the Neolithic big house, the chieftain's hall to AD 499, the lord's hall to 1150. The Roman house (`domus`, 60 BC to AD 480, and `domus-early` before it) is asked for by caesar, senator, patrician, consul, domus or "Roman house": atrium with bedrooms beside it, dining room and tablinum behind, garden court at the back. A yard (`rustic` on a court) is trodden earth with the map's own wattle fence painted round it (`render/boundary-forms.ts`) and the map's own props and trees stood in it by frame name (decor `atlas:<frame>:<cells>`, shown from the game's sheets by `FairView`). Its sprites take a soft edge in a deeper shade of their own colour, not the dark outline. Also room classes whose tables hold vases, clocks, busts, arms or plate, a throne and a bed of state, and a court of people with real livelihoods. The kind, the space ids and the types still say "fair"; renaming them to something that covers both is owed. Doors are not yet closed by rank.

A tomb is planned from the seed (`tombPlan` in `world/tomb.ts`): areas on one axis from the entrance stair to the burial chamber, a shaft where a well room breaks the axis, side rooms off it, some doorways walled up, and the finds for each area with the prizes in the burial chamber. Each area is a main room by its role (`TombRole`), passages to its neighbours and small rooms off its sides. A tradition of tomb building is a `TombStyle` in `content/tombs/`: where and when, what the rooms are called, and the finds with their evidence labels. The only one so far is the New Kingdom rock-cut tomb at Thebes. `core/tomb.ts` is the lamp, the ropes, breaking through a blocked doorway and taking finds; `render/tomb/` paints rock, painted walls and grave goods. A prompt naming a tomb starts the life on its stair (`below: "tomb"`); nothing in the open world leads into one yet.

A fair is a `Fair` in `content/fairs/`: its areas, its own finds, people, coin, the words a prompt names it by, and what is said at its gate. There are two ways to plan one, and a fair may mix them.

- **From a map.** Each area has `at`, its rectangle on the fair's plan (north up, in plan units), and a kind: `gallery` or `court`. `world/fair.ts` sizes the area from the rectangle (`Fair.scale` cells to a unit, within what a couple of screens hold) and `fairWays` joins it to every area whose rectangle shares at least two units of an edge, with a doorway placed as far along the wall as the shared stretch lies. A gallery is a floor of stands by the tags of its class, or of working machines from the kit (`machinery`). It is painted as an exhibition shed: boards underfoot with sunlight from the roof lantern, a back wall of iron columns, round-headed windows and bunting, and a signboard over each doorway. Most of its floor is display tables (`table:<class>:<w>x<h>`): broad low tables seen from a little above, some laid with cloth, with one exhibit to a cell from `render/fair/items.ts`, a library of about sixty small objects each drawn with its own outline and listed by class (loaves, hams and tins for food; hats, boots and bolts of cloth for dress; globes, slates and inkwells for the school), so every table is laid differently. Three-cell tables run down the side walls. Between the tables, its stands are drawn for their class (`stall:food`, `stall:dress`) with that trade's colours and something of its own beside each: a barrel and sack, a dress form, a stove alight, a globe; a court is walks round railed gardens with a fountain or bandstands. The people are generated characters with real livelihoods (`people.ts`): a find may name who is posted at it (`staff`), a fair names who minds filler stands by class (`Fair.staff`), a court's bandstands hold a band (`band`), and the crowd is drawn from the area's `people` in numbers that grow with its size. Sellers trade through the ordinary `deal`, so a baker's loaf is the game's bread. The 1884 International Health Exhibition (`london-1884.ts`) is transcribed this way from its official General Plan; turning a map image into such a plan is not built.
- **By hand.** Paris 1889: each area names its neighbour through each edge (`links`) and its buildings.

The rest of this paragraph is the hand-planned kinds. A fair's area has each area has an archetype (grounds, bridge, hall, pavilion, machines, platform) that `world/fair.ts` lays out, edge links, the buildings along its top whose doors lead to their interiors, lifts, fixed exhibits and tags that draw filler stands. The building fronts are `scripts/art/front_fair.py`, one painter per `PavilionStyle`, baked to the `fair` sheet (`npm run art:fair`); ground, exhibits and decor are painted in `render/fair/`. Closed lawns become railed gardens (parterre, oval walk, open lawn, ribbon bed), mirrored across the avenue and drawn at the pixel over their cells, so walks curve and beds round off while the cells still decide where one can walk. A pavilion interior is painted as a cutaway, its back wall, flag and front steps drawn round the floor and its grounds round that. Halls fill their bays with exhibitors' stands and trophies under a bannered gallery; the Machines gallery sets its exhibits on islands of darker floor between the feet of its arched ribs. Its engines, dynamos, pumps and belt-driven line shaft come from `render/machines.ts`, a kit of working machinery painted as loops of frames (`paintMachine(kind, w, h, v)`) that is not tied to the fair; the view plays the frames. The Tower's far feet lean in under the great arch and its near feet lean out and fade overhead, so the ground under it stays open. A prompt naming the fair starts the life at its gate (`below: "fair"`).

A new kind of large interior plugs in at those three places. Do not start a parallel system for it.

## Where the code doubles up

These pairs do the same job twice. Extend the first one. If your task takes you into this area, retire the second.

| Extend | Retire | Doc |
|---|---|---|
| Building painters `front_*` | oblique and older painters | building-art skill |
| Props `props_b` | `scripts/art/props/` (17 families) | PROP_ART |
| Living water (`render/living-water/`) | the CPU water raster, except as the Canvas fallback | WATER |
| The family carried in `core/time/years.ts` | the invented chain in `lineage.ts`, used by time travel | TIME |
| A direct livelihood check for the day's work entry | `pickGoals` over `GOAL_TEMPLATES`, whose other picks are thrown away | DAY |
| Content scoped by `CharacterScope` records | growing the `resolveHistory` registry | HISTORY |
| Plots | life aims (`core/life-aim.ts`) | PLOTS |
| `LayeredTheme` music | `score.ts` themes and `CulturalTheme` | AUDIO |
| Complexes (`core/complex.ts`, `render/lamplight.ts`) | the ship's own level, host and view (`core/ship.ts`, `render/ship/view.ts`) | ARCHITECTURE |

## Topic docs

- Day and work: [DAY](DAY.md)
- Health and bonds: [LIVES](LIVES.md)
- Plots and kin: [PLOTS](PLOTS.md)
- Time travel and years: [TIME](TIME.md)
- Eras and content: [HISTORY](HISTORY.md)
- Characters: [CHARACTERS](CHARACTERS.md)
- World:
  - [WORLDS](WORLDS.md)
  - [TERRAIN](TERRAIN.md)
  - [WATER](WATER.md)
  - [ECOLOGY](ECOLOGY.md)
  - [FAUNA](FAUNA.md)
  - [SETTLEMENTS](SETTLEMENTS.md)
  - [TRAVEL](TRAVEL.md)
- Art:
  - [GRAPHICS](GRAPHICS.md)
  - the `building-art` skill
  - [PROP_ART](PROP_ART.md)
  - [PROPS](PROPS.md)
- Sound: [AUDIO](AUDIO.md)
- Agents: [AGENTS](AGENTS.md)
- Performance: [PERFORMANCE](PERFORMANCE.md)
- Classroom: [CLASSROOM](CLASSROOM.md)
- Unbuilt designs: [`docs/ideas/`](ideas/)
