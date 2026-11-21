# Universal History Simulator

A pixel-art historical simulation. Vite + TypeScript, Vitest, Playwright.

Draw game assets directly as pixel art in the project’s Stardew Valley / Haunted Chocolatier house style. AI-generated images are for discussion and visual references only. Never use them as game assets or asset textures.

## You own this code

Work on this codebase as its maintainer, not as a visitor adding one feature.
The usual way it goes wrong is that each task adds a new system next to an old
one that did the same job: a second painter, a second registry, a revision
gate, a `-v2` file. Many of those pairs are still here. Do the opposite:

- **Before you build, find what already does the job.** Extend it. If it is
  not good enough, improve it in place rather than writing a sibling.
- **Leave each area simpler than you found it.** When your task touches code
  that has a superseded twin, move the remaining callers over and delete the
  old one, with its tests. That is part of the job, not scope creep. The
  table in `docs/ARCHITECTURE.md` ("Where the code doubles up") names the
  known pairs and which side to keep.
- **No saves to preserve yet**, and no run records or classroom recordings
  that must keep replaying. Change world generation in place. Do not add
  a `*Revision` gate or a legacy path for a change. Bump `PREPARED_VERSION`
  (`src/world/v3/prepared.ts`) when cached worlds would be wrong. Existing
  gates may be removed when you work in their area.
- **Keep the docs true.** A doc describes what is in the game now. When you
  change behaviour, fix or delete the lines that describe it in the same
  change. Plans that are not built go in `docs/ideas/`. Do not write a
  changelog in a topic doc; `git log` is the changelog.
- **Small retirements happen in place; big ones get a worktree.** Other
  agents share this checkout. Deleting an old twin your task already touches
  is fine here. A consolidation that crosses many files or systems runs in
  its own git worktree and branch.
- If a larger consolidation is worth doing but outside your task, say so in
  your reply rather than starting a parallel version.

## Read only what the task needs

**Do not read the docs to orient yourself.** This file is the orientation.
Open another doc only when the task is about its subject:

| Task is about | Read |
|---|---|
| Architecture, module ownership, determinism, duplicated systems | `docs/ARCHITECTURE.md` |
| Current priorities and half-done work | `docs/PROGRESS.md` |
| Eras, dates, cultural families, historical content | `docs/HISTORY.md` |
| Characters, appearance, wardrobe, portraits, generation | `docs/CHARACTERS.md` |
| World setting, revisions, geography | `docs/WORLDS.md` |
| Terrain, relief, ground art | `docs/TERRAIN.md` |
| Water, ecology and vegetation, animals | `docs/WATER.md`, `docs/ECOLOGY.md`, `docs/FAUNA.md` |
| Settlements, town layout, streets, signs | `docs/SETTLEMENTS.md` |
| Complexes, palaces, fairs, tombs, towers | `docs/COMPLEXES.md` |
| Buildings (drawing, painters, review) | `.claude/skills/building-art/SKILL.md` (the `building-art` skill in Claude Code; other agents read the file) |
| Props: drawing / gameplay and placement | `docs/PROP_ART.md` / `docs/PROPS.md` |
| Art labs, ownership, lighting | `docs/GRAPHICS.md` |
| Region map and travel between maps | `docs/TRAVEL.md` |
| Bicycles and motorcycles: kinds, handling, tricks, racks, shops | `docs/CYCLES.md` |
| Time travel, the years, mortality | `docs/TIME.md` |
| The day's cards, work, Today, the ledger | `docs/DAY.md` |
| Health, conditions, bonds, death | `docs/LIVES.md` |
| Plots and kin | `docs/PLOTS.md` |
| Classroom / edu mode | `docs/CLASSROOM.md` |
| Agents playing the game, run records | `docs/AGENTS.md` |
| Performance | `docs/PERFORMANCE.md` |
| Audio | `docs/AUDIO.md`; to make or tune a sound, `.claude/skills/sound/SKILL.md` |
| Licences of third-party art | `docs/ASSET_PROVENANCE.md` |

## Verifying

- `npm run check` — **the gate before you call work done.** Typecheck, unit
  tests and a production build. Stops scheduling tests after the first failure.
  It is the only gate.
- `npm run typecheck` — run TypeScript with the build's heap limit.
- `npm test` — the fast default: mechanics, terrain/rendering contracts, and
  representative integration checks. Keep repeated world builds, regional
  matrices and exhaustive rendering combinations in `test:full`.
- `npm run test:quick -- tests/<name>.test.ts` — run the default cases in a
  file, reuse cached transforms, and stop scheduling tests at the first failure.
  Add `-t "name"` to narrow it further.
- `npm run test:watch -- tests/<name>.test.ts` — rerun the default cases as
  their source files change. Prefix with `CHOKIDAR_USEPOLLING=1` if native
  file events are unavailable.
- `npx vitest run tests/<name>.test.ts` — include the file's opt-in cases.
  A `-t` name filter also enables them in ordinary runs.
- `npm run shot -- artifacts/x.png "A dyer in Kyoto, 1350"` — one
  screenshot of the running game. Starts an offline private dev server by
  default (`UHS_OFFLINE=1`). Set `UHS_URL` or `PORT` to use a running server.
  More `out.png "prompt"` pairs share one server and browser. Pass `--play`
  with `--setting`, `--seed`, and `--script` / `--cmd` / stdin to drive a live
  browser session with `Agent` commands and `shot <out.png>` at any step.
  Each shot has a 120-second deadline (`UHS_SHOT_TIMEOUT_MS`).
- `npm run town:sheet` — a generated settlement without a browser. Use before
  and after changing layout, yards or building art.
- `npm run capture:characters -- <preset>` and `npm run capture:terrain -- <review>`
  — the review sheets. No argument runs them all; a wrong name prints the
  valid ones.
- `npm run test:full` — optional regional/historical matrices, long simulation
  scenarios, exhaustive rendering and MCP integration. Use when those systems
  change or when asked; prefer a targeted file when it covers the change.
- `npm run test:browser` — Chromium specs plus mobile checks in WebKit that
  drive the real game. It starts the dev server itself and reuses one
  already up. Worth running when you touch movement, doors, situations, time
  travel or the mobile layout.
- Docs sometimes cite a browser spec that no longer exists. Those 54 review
  specs were deleted; `git show bef96b22^:tests/browser/<name>` reads one.

All npm Python commands and the dev server's art rebuild use `.venv/bin/python`.
The Python art pipeline (`npm run art*`, the `scripts/art/` sheets) needs PIL,
numpy, shapely, pyproj and pyshp in a `.venv`, which a fresh checkout does not
have. `python3 scripts/art/oblique_audit.py` needs none of them and works
anywhere. If an art command dies on a missing module, that is the cause; say so
rather than working around it.

For a major visual or gameplay change, include an inspected screenshot or contact sheet in the reply. Show the changed activity at play scale and, when regional variation matters, show representative settings. Label any offline render as such.

Review screenshots under `artifacts/` are local-only and not in the repo. Docs
cite them as a record of past review; a missing one is expected, not a problem.
Regenerate what you need rather than hunting for it.

Run these when a change plainly needs them or when asked — **not as a reflex
after every edit**. A passing suite does not establish that a world looks right;
take a shot and look at it.

**Do not spend minutes on a check that cannot change your answer.** Before
starting something slow, ask what a red result would make you do differently.
If a suite is mostly red already, or covers nothing you touched, running it
buys nothing and costs the session. Prefer the narrowest check that would
actually catch the mistake you might have made: the one test file over the
suite, one spec over all of them, one screenshot over a full review sheet.

## Finding your way

Fresh playable worlds use `prepareConnectedStart` in `src/runtime/map-travel.ts`.
`createSettingSession` builds a synchronous local scene for tests/reviews;
`createSession(pack, seed, options)` handles authored packs and pinned versions.

Every playable world is generator 3: `src/world/v3/` builds the local scene,
and `src/world/geography/` holds shared Earth geography. `src/world/generate.ts`
(generator 1) with `src/content/legacy-packs.ts` is the small authored town
behind `createSession("roman", …)`, the fast fixture for mechanics tests and
the building lab. Do not add generation rules to it.

`.claude/worktrees/` holds old worktrees with their own copies of the repo.
Keep it out of searches (`grep -r --exclude-dir=.claude`).

Do not grep or read these whole; they are generated or bulk content:
`src/content/task-lore/`, `*.generated.ts`, `src/audio/layered-themes.ts`.
`src/core/engine.ts` (~740k), `src/render/WorldScene.ts` (~400k), and
`src/world/v3/plan.ts` (~320k): search for the symbol and read a range.

Playtest game mechanics with `npm run agent:play -- --setting "Weaver in Oaxaca 1650" --seed playtest`
(add `--fast` for a single local map, `--record` to save a replayable folder).
Type `look` or shorthands (`goto b1`, `enter b1`, `wait 600`, `talk p1 Hi`).
Use `npm run --silent agent:serve` for MCP or `npm run shot -- --play` for a
visual browser playtest with screenshots. All agent and capture harnesses run
offline by default; **ask the user before passing `--paid`** (which enforces a
default `$1.00` spend cap, configurable with `--max-usd`). See `docs/AGENTS.md`.

## Do not add scaffolding

This repo once had 26 near-duplicate `capture-*.ts` scripts because agents
kept writing their own instead of finding the existing one. Before you create
anything:

- **Screenshots**: use `npm run shot` for the game, `capture:characters` or
  `capture:terrain` for a review sheet. Add a preset to those rather than a
  new file; shared browser handling lives in `scripts/capture/lib.ts`.
- **Tests**: add cases to the existing file that covers the area. A new test
  file needs a reason beyond "my change deserves one."
- **Docs**: do not write a summary, report, or plan file for work you just did.
  Say it in your reply. Update the topic doc your change made wrong. Add a
  line to `docs/PROGRESS.md` only for a milestone.
- **Systems**: no second registry, painter, renderer or `-v2` file beside one
  that already does the job. See "You own this code".

## Keep it small and quiet

The most common failure here is not a wrong answer, it is a correct answer
buried in three times the code it needed and twice the prose. Write the
smallest thing that does the job, then stop.

- **Comments earn their place or they go.** Write one only for something the
  code cannot say: a non-obvious *why*, a units or ordering trap, a constant
  whose value came from somewhere, a bug or commit link. One line, plain
  English.
- **Never narrate.** Do not restate the line below, label a block with what it
  obviously is, announce a section, explain the design in prose, or recap what
  a function just did. A comment that would survive being deleted should be.
- **Do not add a comment because a change felt significant.** The commit
  message is where that belongs.
- **Prefer the plain construction.** No wrapper, helper, options object,
  abstraction layer or configuration hook until a second caller actually
  needs it. Do not generalise on the first use.
- **Leave surrounding code alone.** Match its density and idiom; do not
  reformat, rename or "tidy" lines the task did not touch.

Compare, on the same logic:

```ts
// BAD: three comments, none of which the code needed
// Get the character's appearance from the setting
const appearance = characterAppearance(setting, seed, id, age);
// Loop over each direction to draw the sprite
for (let d = 0; d < 4; d++)
  drawCharacter(ctx, appearance, d, "walk", 0); // draw the walk frame

// GOOD: silent where the code speaks, one line where it does not
const appearance = characterAppearance(setting, seed, id, age);
// South, east, north, west: the atlas order, not the compass order.
for (const d of [2, 1, 0, 3]) drawCharacter(ctx, appearance, d, "walk", 0);
```

## Working rules

- The twelve era IDs in `src/content/history/dates.ts` are settled. Refine
  history through scoped dates and profiles, not by changing eras.
- Keep historical content in subject/regional files. Do not grow a global
  master file or a culture × era copy of every asset. Keep renderer behavior
  independent of cultural-family branches.
- Educated guessing is the default for historical content: extrapolate from
  real evidence and expert speculation. Reconstructed Proto-Indo-European
  religion and the like are wanted. Do not invent evidence; do not hedge every
  line or stop to verify unless asked.
- Preserve the distinction between documented evidence, inference, hypothesis
  and fiction.
- Player-facing text (cards, plot lines, dialogue, titles) is plain modern
  English, spoken lines included. The history goes in the facts (who is owed,
  which court, what the law allows), not in the voice: no "the day is going",
  "I'll not be put off", "amerced", "Nobody need hear of it". Period terms are
  fine where a modern word would be wrong, and get a gloss.
- Saves are not a priority during early development, and nobody depends on an
  old world. Terrain graphics, procedural composition and performance come
  first. Do not write save-system tests unless asked.
- Art audits are advice, not gates. `python3 scripts/art/front_audit.py <family>`
  flags black outlines, doors shorter than the adult, chimneys off the roof,
  noisy palettes and dithered gradients in what you changed; a fault that is a
  deliberate choice stays. Run it whole, or `oblique_audit.py` for the older
  oblique painters, only when shared art code changed.
- What can be handled, used, sat on, read, bought from or burned in any room is a
  prop in the catalogue with its flags and its `act`, not a list private to that
  kind of interior. See "One system for every interior" in `docs/PROPS.md`.
- Never assert wall-clock timings in tests. Use `scripts/capture-benchmark.ts`.
- Other agents share this checkout. Check `git status`, preserve unrelated
  changes, and do not sweep them into your commit.
