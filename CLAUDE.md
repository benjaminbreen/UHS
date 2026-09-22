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

- `npm test` — 16s, 580 tests, **green on main**. If it is red, you broke it.
- `npx vitest run tests/<name>.test.ts` — after an edit, run just what covers it.
- `npm run shot -- artifacts/x.png "A Roman baker in Ostia, 100 CE"` — one
  screenshot of the running game. Starts the dev server itself if needed.
- `npm run town:sheet` — a generated settlement without a browser. Use before
  and after changing layout, yards or building art.
- `npm run test:full` — 10 min, and has known failures. Only before a merge or
  when asked, and in the background.
- `npm run test:browser` needs `npx playwright install` first.

Review screenshots under `artifacts/` are local-only and not in the repo. Docs
cite them as a record of past review; a missing one is expected, not a problem.
Regenerate what you need rather than hunting for it.

Run these when a change plainly needs them or when asked — **not as a reflex
after every edit**. A passing suite does not establish that a world looks right;
take a shot and look at it.

## Do not add scaffolding

This repo has accumulated 26 near-duplicate `capture-*.ts` scripts because
agents kept writing their own. Before you create anything:

- **Screenshots**: use `npm run shot`. Do not write a new capture script.
- **Tests**: add cases to the existing file that covers the area. A new test
  file needs a reason beyond "my change deserves one."
- **Docs**: do not write a summary, report, or plan file for work you just did.
  Say it in your reply. Note it in `PROGRESS.md` only for a milestone.
- **Comments**: only where the code cannot speak for itself — a non-obvious
  why, a units or ordering trap, a bug link. One line, plain English. Do not
  restate the line below. When in doubt, leave it out.

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
