# Working on Universal History Simulator

- Read `UHS_DESIGN.md`, `HISTORY.md` and the current top of `PROGRESS.md` before architectural changes. The twelve era IDs/boundaries in `src/content/history/dates.ts` are settled; refine history through scoped dates and profiles rather than silently changing eras.
- Keep historical content in subject/regional files. Reuse definitions and flat kits; do not grow a single global master file or a culture × era copy of every asset. Keep renderer/interaction behavior independent of cultural-family branches.
- Preserve distinctions between documented evidence, inference, hypothesis and fiction. The user explicitly welcomes ambitious, sourced prehistoric hypotheses. Explain the chosen interpretation and alternatives without claiming recovered languages or invented evidence.
- The user approved the prop visual baseline and explicitly authorized committing the entire worktree, followed by interactive props. Baseline checkpoint: `120f870`. The shared prop MVP is documented in `PROPS.md`; new content-version-2 worlds use it while old saves/replays retain their original content. Geography/World Weaver remains documented in `WORLDS.md`.
- `src/content/legacy-packs.ts` preserves generator-v1 inputs. Changes affecting existing generated worlds, saves or replay require deliberate compatibility/version handling. Run relevant tests and verify user-facing changes in the browser.
- Other agent work may be present in the shared checkout. Inspect Git status; preserve unrelated changes and do not sweep them into a task commit.

- During early development, the user explicitly prioritizes terrain graphics, procedural composition and performance over saves. Do not spend effort on save restoration or save-system tests unless requested.
