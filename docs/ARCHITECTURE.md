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

A tomb is planned from the seed (`tombPlan` in `world/tomb.ts`): areas on one axis from the entrance stair to the burial chamber, a shaft where a well room breaks the axis, side rooms off it, some doorways walled up, and the finds for each area with the prizes in the burial chamber. Each area is a main room by its role (`TombRole`), passages to its neighbours and small rooms off its sides. A tradition of tomb building is a `TombStyle` in `content/tombs/`: where and when, what the rooms are called, and the finds with their evidence labels. The only one so far is the New Kingdom rock-cut tomb at Thebes. `core/tomb.ts` is the lamp, the ropes, breaking through a blocked doorway and taking finds; `render/tomb/` paints rock, painted walls and grave goods. A prompt naming a tomb starts the life on its stair (`below: "tomb"`); nothing in the open world leads into one yet.

A fair is a `Fair` in `content/fairs/`: its areas, its own finds, people, coin, the words a prompt names it by, and what is said at its gate. There are two ways to plan one, and a fair may mix them.

- **From a map.** Each area has `at`, its rectangle on the fair's plan (north up, in plan units), and a kind: `gallery` or `court`. `world/fair.ts` sizes the area from the rectangle (`Fair.scale` cells to a unit, within what a couple of screens hold) and `fairWays` joins it to every area whose rectangle shares at least two units of an edge, with a doorway placed as far along the wall as the shared stretch lies. A gallery is a floor of stands by the tags of its class, or of working machines from the kit (`machinery`); a court is walks round railed gardens with a fountain or bandstands. The people are generated characters with real livelihoods (`people.ts`): a find may name who is posted at it (`staff`), a fair names who minds filler stands by class (`Fair.staff`), a court's bandstands hold a band (`band`), and the crowd is drawn from the area's `people` in numbers that grow with its size. Sellers trade through the ordinary `deal`, so a baker's loaf is the game's bread. The 1884 International Health Exhibition (`london-1884.ts`) is transcribed this way from its official General Plan; turning a map image into such a plan is not built.
- **By hand.** Paris 1889: each area names its neighbour through each edge (`links`) and its buildings.

The rest of this paragraph is the hand-planned kinds. A fair's area has each area has an archetype (grounds, bridge, hall, pavilion, machines, platform) that `world/fair.ts` lays out, edge links, the buildings along its top whose doors lead to their interiors, lifts, fixed exhibits and tags that draw filler stands. The building fronts are `scripts/art/front_fair.py`, one painter per `PavilionStyle`, baked to the `fair` sheet (`npm run art:fair`); ground, exhibits and decor are painted in `render/fair/`. Closed lawns become railed gardens (parterre, oval walk, open lawn, ribbon bed), mirrored across the avenue and drawn at the pixel over their cells, so walks curve and beds round off while the cells still decide where one can walk. A pavilion interior is painted as a cutaway, its back wall, flag and front steps drawn round the floor and its grounds round that. Halls fill their bays with exhibitors' stands and trophies under a bannered gallery; the Machines gallery sets its exhibits on islands of darker floor between the feet of its arched ribs. Its engines, dynamos, pumps and belt-driven line shaft come from `render/machines.ts`, a kit of working machinery painted as loops of frames (`paintMachine(kind, w, h, v)`) that is not tied to the fair; the view plays the frames. The Tower's far feet lean in under the great arch and its near feet lean out and fade overhead, so the ground under it stays open. A prompt naming the fair starts the life at its gate (`below: "fair"`).

A new kind of large interior plugs in at those three places. Do not start a parallel system for it.

A tower is not a complex. Its storeys are ordinary interiors, so the people who work there have desks, regulars and a day like any other building's. Storey n of a place is the space `<place>@<n>` (`world/tower.ts`: `floorSpace`, `parseFloor`), and `interiorOf` builds it from the tower's plan: which firm has the floor, its interior profile and colouring. A `TowerStyle` in `content/towers/` is the architecture: the frames that are towers, the range of storeys, the lift, the lobby and the rooms a storey can be fitted out as. Who rents them is `content/towers/tenants.ts`: kinds of firm scoped by years and region (no software houses in 1925, no law firms in a Soviet ministry tower), each naming itself from patterns with local surnames and employing a staff of livelihood ids. Each storey is also a workplace (`workplacesIn` in `world/v3/employment.ts` offers one per floor, for its day staff's livelihoods), so a resident or the player can be employed on the 23rd floor, and the "workplace" step of the day lands at a desk there. A tenant keeps its own hours: brokers start early, newspapers work into the night, and after closing a share of the staff stay late (`overtime`, a scoped share: high in postwar Japan, low in the Soviet Union). Flats and hotel floors (`stay`) hold residents or guests instead of staff. While the player is on a storey, `towerStaff` in the engine makes its staff as generated characters, seeded by storey and desk so the same people come back, with those working late, night staff after hours, and fewer when residents already work there. Beside a lift door the action key opens `ui/TowerSection.tsx`, the tower in section, and choosing a floor rides there (the `lift` action). The style's `section` gives the cutaway its stone, setbacks and crown.

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
