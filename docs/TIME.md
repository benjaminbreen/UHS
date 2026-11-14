# Time: the years and time travel

Two ways the clock moves past a single day. **The years** run a life forward
from the evening ledger. **Time travel** jumps the same site up to a thousand
years either way. Entry files: `src/core/time/`, `src/ui/time/Years.tsx`,
`src/ui/time/TimeModal.tsx`.

## The years

`src/core/time/years.ts`, opened from the ledger (**Let the years pass**,
**To the end**) and from the Rest menu.

- `liveYears(engine)` steps the life a year at a time:
  - deaths from `yearlyRisk` and `childbedRisk` in `mortality.ts`, with causes
    from `src/content/history/deaths.ts`;
  - marriages and births by `householdWays` (`src/content/history/households.ts`);
  - children made by `child.ts`;
  - conditions with age;
  - tidings from `src/content/history/tidings.ts`;
  - the plot carried on.
- `liveOn(engine, life, year)` builds the world at a chosen year: the same
  house and town, the player older, the household as the years made it, some
  neighbours gone and their houses taken by newcomers.
- `endOfLife` closes it at the player's death, which leads to `DeathCard`
  ([LIVES.md](LIVES.md)).

The screen is `Years.tsx`.

## Time travel

`TimeTravel` in `src/core/time/travel.ts`, opened from "Change your world"
(`TimeModal.tsx`). `prepare(year, source)` builds the destination off to the
side. `commit` swaps it in. An error or cancel keeps the current world.

- `setting.ts`: `settingAt` and `timeContext` give the dated setting.
  `YEAR_MIN` and `YEAR_MAX` are the limits.
- `world.ts`: `buildingAt` and `temporalWorld` give each building site its
  incarnations. Earlier fabric survives as ruins, and the terrain is kept.
- `structure.ts`: material decay and damage per wall section, roof, charring,
  burial and vegetation (`ageStructure`, `damageStructure`). A ruin's
  surviving walls set collision.
- `objects.ts`: props age when abandoned.
- `lineage.ts`: an invented direct line of ancestors and descendants, so the
  player arrives as a relative.

Returning to a visited date restores its session checkpoint. Checkpoints are
session-local, not saves. Changing maps discards them.

Optional arrival prose comes from `server/time-arrival.ts` (`gpt-6-luna`),
with a local fallback. It summarises committed state and cannot change it.

## Which to extend

The two share `child.ts` and the dated content, but each has its own family
model:

- `years.ts` carries the real household. **Extend it** for anything within a
  lifetime: kin, fortune, the plot's tail.
- `lineage.ts` invents a separate chain for time travel. It is the candidate
  to retire. Deriving time-travel relatives from the household that `years.ts`
  carries would leave one family model. That is welcome work if you are in
  this area.

`years.ts` does not age buildings; time travel does. Within a lifetime that is
acceptable.

## Not built

- A plot's tail resolved by the years.
- A record of the life (a printable summary) at its end.
- Durable timelines across reloads.
- Fire and weapon damage commands. `damageStructure` accepts them, but nothing
  issues them yet.

## Checks

- `tests/time-travel.test.ts`, which covers the years too.
- `tests/browser/time-travel.spec.ts`.
