# Working on Universal History Simulator

- Read `UHS_DESIGN.md`, `HISTORY.md` and the current top of `PROGRESS.md` before architectural changes. The twelve era IDs/boundaries in `src/content/history/dates.ts` are settled; refine history through scoped dates and profiles rather than silently changing eras.
- Keep historical content in subject/regional files. Reuse definitions and flat kits; do not grow a single global master file or a culture × era copy of every asset. Keep renderer/interaction behavior independent of cultural-family branches.
- Preserve distinctions between documented evidence, inference, hypothesis and fiction. The user explicitly welcomes ambitious, sourced prehistoric hypotheses. Explain the chosen interpretation and alternatives without claiming recovered languages or invented evidence.
- The current handoff reserves settlement/landscape generation for a separate phase/agent. The user explicitly requested review of the era framework and `PROP_PLAN.md` before prop art or pickup/equipment/container mechanics. Do not cross that review gate without subsequent user direction.
- `src/content/legacy-packs.ts` preserves generator-v1 inputs. Changes affecting existing generated worlds, saves or replay require deliberate compatibility/version handling. Run relevant tests and verify user-facing changes in the browser.
- Other agent work may be present in the shared checkout. Inspect Git status; preserve unrelated changes and do not sweep them into a task commit.
