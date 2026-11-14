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
| `src/world/` | World generation. `v3/` builds the local scene (`v3/generate.ts`, `v3/plan.ts` for settlements). `geography/` is shared Earth geography. `regional/` holds regional constraints for the planner. `travel/` holds the map squares and journeys. `worker.ts` runs generation off the main thread. Interiors, caves and sewers sit at the top level. |
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

New worlds use generator 3 (`createSettlementWorld`, `src/world/v3/`). Terrain, vegetation, hydrology and urban form have one model each. `integratedSetting` in `src/content/geography/defaults.ts` still pins a few revision fields (ecology, roads, streets, placement, characters, worksites and so on); the world doc lists them.

Generator 1 (`src/world/generate.ts`, with the `roman` and `neolithic` packs from `src/content/legacy-packs.ts`) stays as a small authored town for mechanics tests and the building lab. No playable world uses it.

The remaining revision branches exist so old records replay. **Nobody's saves depend on them yet.** Do not add a new revision gate when you change generation: change the current behaviour in place, and bump `PREPARED_VERSION` (`src/world/v3/prepared.ts`) when cached worlds would be wrong. When you work in an area that has old branches, deleting them and their tests is part of the job.

## Where the code doubles up

These pairs do the same job twice. Extend the first one. If your task takes you into this area, retire the second.

| Extend | Retire | Doc |
|---|---|---|
| Building painters `front_*` | oblique and older painters | building-art skill |
| Props `props_b` | `scripts/art/props/` (17 families) | PROP_ART |
| Character sprite renderer G (`render/characters/doll/`) | renderers b–f | CHARACTERS |
| Living water (`render/living-water/`) | the CPU water raster, except as the Canvas fallback | WATER |
| The family carried in `core/time/years.ts` | the invented chain in `lineage.ts`, used by time travel | TIME |
| A direct livelihood check for the day's work entry | `pickGoals` over `GOAL_TEMPLATES`, whose other picks are thrown away | DAY |
| Content scoped by `CharacterScope` records | growing the `resolveHistory` registry | HISTORY |
| Plots | life aims (`core/life-aim.ts`) | PLOTS |
| `LayeredTheme` music | `score.ts` themes and `CulturalTheme` | AUDIO |

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
