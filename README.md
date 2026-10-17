# Universal History Simulator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)
![Node 22.12+](https://img.shields.io/badge/node-22.12%2B-339933.svg)

**An experiment in teachably imperfect historical simulations.** Describe a
person, a place and a date — *"A Roman baker in Ostia, 100 CE"* — and the game
builds that world in pixel art and drops you into an ordinary day of that life.

**Play it:** [historysimulator.vercel.app](https://historysimulator.vercel.app)

![A baker in Rome, 100 CE: a neighbour's request, the day's tasks and the local map](docs/images/gameplay.png)

## What it does

- **Any place, any period.** A local parser (or an optional model-assisted
  interpreter) resolves the description into a setting across twelve eras, from
  deep prehistory to the present day. Terrain, rivers and climate come from real
  geography; towns, roads and buildings are generated to fit the region and date.
- **A life, not a tour.** You play one person with a household, a trade, health
  and neighbours. Each day brings work, errands and a plot with consequences —
  debts, rivals, feasts, illness — written in plain English.
- **People who keep their own lives.** Residents follow work and home routines,
  trade real quantities of goods, gossip, remember favours and notice theft.
- **Evidence kept separate from guesswork.** Historical content distinguishes
  documented evidence, inference, hypothesis and fiction, and the game shows
  which is which.

<table>
  <tr>
    <td><img src="docs/images/sprites.png" alt="Walking sprites by place and date: Rome 100, Europe 1200, Paris 1888, Mongolia 1200, West Asia 1400"></td>
    <td><img src="docs/images/portraits.png" alt="Generated portraits"></td>
  </tr>
  <tr>
    <td align="center"><sub>Dress follows place, date, age and wealth</sub></td>
    <td align="center"><sub>Every character gets a generated portrait</sub></td>
  </tr>
</table>

## Running locally

Requires Node 22.12+. No account, API key or Python is needed to play.

```bash
npm ci
npm run dev
```

Open the URL Vite prints. `npm run build` produces `dist/`.

### Controls

| | |
|---|---|
| Move | Arrow keys / WASD, or click to walk |
| Talk / Inspect | Enter / R, or select a person or object |
| Region map | M |
| Inventory · Notebook | I · J |
| Wait | Space (one minute) or the Rest button |

The command bar also accepts short commands such as `wait 10` or `eat bread`.

## How it works

The simulation is deterministic TypeScript, separate from the renderer: the
same seed and commands always produce the same world.

| Path | Role |
|---|---|
| `src/core` | State, action rules, time, visibility, randomness, pathfinding. No browser or historical content. |
| `src/content` | Geography, eras, cultures, professions, wardrobe, plots and card text. |
| `src/world/v2`, `v3` | The region atlas and the local scene: terrain, water, settlements, buildings. |
| `src/runtime` | Commands, worker bridge, persistence, replay. |
| `src/render` | The Phaser view. It draws the world and never decides outcomes. |
| `scripts/` | Art pipeline, geography preparation, capture and headless tools. |

Worlds are saved in the browser and can be exported, along with a full command
recording that replays exactly. The same engine runs headless
(`npm run headless`) and as an MCP server (`npm run mcp`) so agents can observe
and act in a world.

## Classroom mode

`/edumode` is an opt-in entry point for teaching. Students enter a name and
class code, see what will be recorded and choose to start; teachers review
timelines and export them from `/edumode/teacher`. It needs a Postgres database
and three server-side environment variables — see
[docs/CLASSROOM.md](docs/CLASSROOM.md).

## Documentation

Design notes live in [`docs/`](docs). Start with
[UHS_DESIGN.md](docs/UHS_DESIGN.md) for architecture,
[HISTORY.md](docs/HISTORY.md) for eras and content, and
[PROGRESS.md](docs/PROGRESS.md) for recent work.

## Development

```bash
npm run check   # typecheck, unit tests and production build
npm test        # unit tests only
```

## License

Code is released under the [MIT License](LICENSE). Some third-party art and
data keep their own terms; see [ASSET_PROVENANCE.md](docs/ASSET_PROVENANCE.md).
