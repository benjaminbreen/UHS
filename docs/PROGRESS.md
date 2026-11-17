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

- November 16: skyscrapers. Downtown New York, Chicago and their neighbours
  build setback towers from 1923 (`mod-deco` in `front_modern.py`), Moscow,
  Warsaw and Riga Stalin's high-rises from 1952 (`mod-vysotka`), Tokyo,
  Osaka and Nagoya glass towers from 1974 (`mod-bubble`), with bars and a
  mahjong parlour low down. Each
  storey is an ordinary interior let to a firm, planned from the seed by a
  `TowerStyle` (`src/content/towers/`, `src/world/tower.ts`); the lift door
  opens the tower in section, where a floor is picked and the car rides
  there (`src/ui/TowerSection.tsx`). Windows look down on the city by
  height. Aviation lights blink and neon runs after dark, as building
  overlays (`beacon`, `chase-<colour>`) and in the section. Floors are let
  from a catalogue of firms scoped by era and economy
  (`src/content/towers/tenants.ts`) and staffed by generated people in
  graded office jobs (`city-work.ts`); office work has its own day.
- November 16: fairs from a map. An area can be given as a rectangle on the
  fair's plan and the game sizes it, joins it to its neighbours and fills it
  by class. The 1884 International Health Exhibition is the first: 35 areas
  from its General Plan ("A visitor at the Health Exhibition"). The machines
  in its galleries and in Paris's come from `src/render/machines.ts`, a kit of
  animated machinery not tied to fairs.
- November 16: tombs, the first complex planned from the seed, and a map of
  the areas walked for fairs and tombs in the sidebar. "A tomb robber in
  Thebes, 1110 BCE" starts on the stair of a New Kingdom rock-cut tomb
  (`src/content/tombs/`, `src/world/tomb.ts`, `src/core/tomb.ts`,
  `src/render/tomb/`). No way in from the open world yet, and nobody else
  is in the tomb.
- November 16: the 1889 Exposition Universelle, the first world's fair. A
  prompt naming the fair or the Eiffel Tower starts at the Trocadéro gate:
  47 areas from the Champ de Mars to the colonial villages, pavilion
  interiors, the Tower's lifts and platforms, and exhibits to see or buy
  (`src/content/fairs/`, `src/world/fair.ts`, `src/core/fair.ts`,
  `src/render/fair/`, `scripts/art/front_fair.py`). The street outside
  has no gate into it yet.
- November 14: lives at sea. About 1.5% of random starts, or a prompt such as
  "a pilgrim on a dhow", begin aboard a square-rigger, junk, dhow or steamer
  (`src/content/ships/`, `src/world/ship.ts`, `src/core/ship.ts`,
  `src/render/ship/`), and go ashore at landfall.
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
