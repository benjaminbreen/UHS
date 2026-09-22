# Universal History Simulator

A pixel-art historical simulation. Vite + TypeScript, Vitest, Playwright.

## Read only what the task needs

There are 30 docs at the root, about 140k tokens in total. **Do not read them to
orient yourself.** This file is the orientation. Open one of the others only
when the task is actually about its subject:

| Task is about | Read |
|---|---|
| Architecture, design intent | `UHS_DESIGN.md` |
| What shipped recently, current priorities | top of `PROGRESS.md` only — it is 155k |
| Eras, dates, historical content | `HISTORY.md` |
| Characters, appearance, wardrobe | `CHARACTERS.md` |
| Settlements, layout, roads | `SETTLEMENTS.md` |
| Buildings and props (drawing rules) | `OBLIQUE_ART.md`, `PROP_ART.md`, `PROPS.md` |
| Terrain, water, vegetation, ecology | `GRAPHICS.md`, then the specific one |
| World generation, geography | `WORLDS.md` |
| Audio | `AUDIO.md` |

## Verifying

- `npm run check` — **the gate before you call work done.** Typecheck, unit
  tests and a production build, 2.8 min, green on main. It is the only thing
  you need to pass; nothing below is a gate.
- `npm test` — 17s, 581 tests, **green on main**. If it is red, you broke it.
- `npx vitest run tests/<name>.test.ts` — after an edit, run just what covers it.
- `npm run shot -- artifacts/x.png "A Roman baker in Ostia, 100 CE"` — one
  screenshot of the running game. Starts the dev server itself if needed.
- `npm run town:sheet` — a generated settlement without a browser. Use before
  and after changing layout, yards or building art.
- `npm run capture:characters -- <preset>` and `npm run capture:terrain -- <review>`
  — the review sheets. No argument runs them all; a wrong name prints the
  valid ones.
- `npm run test:full` — 10 min, and has known failures. Only before a merge or
  when asked, and in the background.
- `npm run test:browser -- <pattern>` — the Playwright specs matching a name,
  e.g. `-- doors` or `-- '(props|doors)'`. **This is how to use it.** It starts
  the dev server itself and reuses one already up.
- `npm run test:browser` with no pattern runs all 140, takes 12 minutes, and
  last came back 81 failed / 61 passed. Do not run it unless you are asked to.
  Most of that red is UI and renderer drift older than your change, so a red
  spec is weak evidence about anything you did: check it against HEAD before
  believing it, and never adopt fixing the suite as a side quest.

The Python art pipeline (`npm run art*`, the `scripts/art/` sheets) needs PIL,
numpy, shapely, pyproj and pyshp in a `.venv`, which a fresh checkout does not
have. `python3 scripts/art/oblique_audit.py` needs none of them and works
anywhere. If an art command dies on a missing module, that is the cause; say so
rather than working around it.

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
  Say it in your reply. Note it in `PROGRESS.md` only for a milestone.

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
- Changes affecting existing generated worlds, saves or replays need deliberate
  version handling. `src/content/legacy-packs.ts` preserves generator-v1 inputs.
- Saves are not a priority during early development. Terrain graphics,
  procedural composition and performance come first. Do not write save-system
  tests unless asked.
- Buildings are drawn oblique; `python3 scripts/art/oblique_audit.py` must pass
  before `npm run art`.
- Never assert wall-clock timings in tests. Use `scripts/capture-benchmark.ts`.
- Other agents share this checkout. Check `git status`, preserve unrelated
  changes, and do not sweep them into your commit.
