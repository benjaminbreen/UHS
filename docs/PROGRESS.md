# Progress

What matters now and what is half done. `git log` records every change. Older
milestone write-ups are in `PROGRESS_ARCHIVE.md`. Do not open it unless you are asked to.

## Priorities

The owner keeps this list.

- Make terrain, buildings and towns look as good as Stardew Valley and Haunted Chocolatier. Simplicity beats noise.
- Procedural composition: towns, fields and roads should read as real places at every date.
- Performance, especially on phones.
- Historical breadth: dress, trades, signs and music by place and date.
- Simplify as you go. Retire the second system wherever two do the same job.

## Half done

- **Consolidation.** The table in [ARCHITECTURE.md](ARCHITECTURE.md#where-the-code-doubles-up) lists the systems that still exist twice. The world-generation retirement is on branch `claude/nifty-meninsky-07dc4e`, not yet merged.
- **Buildings.**
  - Some families are still drawn by the oblique and older painters, so a town can mix the two styles.
  - The building-art skill lists those families and the dead painters.
- **Rain sound.** The sound skill describes a grain-based rain bed. The committed `ambience.ts` uses filtered noise.
- **Babies.** Only back carries are drawn. Cradleboard, cradle and hip carries have no baby in play.
- **Classroom.** Assignments and carry-over between sessions are not built ([CLASSROOM.md](CLASSROOM.md)).

## Recent milestones

- November 13:
  - Dress by period and trade.
  - Soldiers and sentries.
  - Runtime shop signs in each street's script.
  - Realistic random starts.
  - Streets of the later twentieth century.
- November 12:
  - Motor-age towns: one grid, main streets, kerbs, highways.
  - Phone layout and memory.
  - Regional opening music and a danger/combat soundtrack.
- November 11:
  - Iberian-world houses (`casa`) and the `front_family` registry.
  - Trunk railways and highways on the atlas.
- November 10: the baby on the back, and caves.
- November 9: terraces, cliffs and tidal flats.
- November 8: the years ([TIME.md](TIME.md)).

Add a line here only for a milestone a newcomer should know about, and keep
the list short. Prune the oldest lines into the archive.
