# Plots and kin

A life may start inside a plot: a debt, a levy, a fever in the house, a comet.
Things then develop when conditions are met, not on a script, and the plot
ends in one of its endings, some of them deaths. Kin are the permanent cast
who call on the player. Entry files: `src/content/plots/`, `src/core/plot.ts`,
`src/core/kin.ts`, `src/ui/PlotCard.tsx`.

## How it works

- **Data.** Each plot is a `PlotTemplate` (`src/content/plots/types.ts`) in its
  own file. `debt.ts` is the worked example. `index.ts` lists them all in
  `PLOTS`. A template has:
  - a `shape` (claim, work, household, occasion, discovery, world, news, …);
  - a `look` (palette and emblem);
  - a `weight` function over `PlotContext`, and `cast` to bind roles;
  - `begin` (deadline, sum owed, words);
  - `opening` effects, `developments` (`when` a `Condition`, `then` effects);
  - an optional `journal`;
  - `endings`;
  - `wording`, where the first scope match wins and the last entry has no
    scope.
- **Conditions and effects** are small closed unions of plain data, not
  callbacks. Add one only when a plot needs it.
- **Runner.** `startPlot` draws a shape first, then a plot within it. About one
  life in five has none (`QUIET`). It binds the cast from people who already
  exist (the creditor from `owes`, a rival by trade), with `PlotRole` in
  `types.ts`. `stepPlot` evaluates conditions every game minute, so clocks
  measured in hours bite. `endPlot` closes it. Plot state is plain data in
  `engine.state.plot` and crosses map travel.
- **Cards.** `engine.cards` feeds `PlotCard.tsx`. A `choose` effect puts up a
  decision card. Answers fire their id for developments and endings.
- **Emblems.** Banners are drawn in `src/ui/plot-emblems.ts` and
  `src/ui/emblems/scenes/`, at the opening, at each card and at each ending.
- **Clocks.** Many players see only a few game hours, so a plot opens within
  minutes and develops within hours. The longest deadline is about 30 days,
  with a development in the first hour.
- **Wording.** One template per plot, with era and culture handled in
  scoped `wording` entries, never a copy per culture. Plain modern English.

## Kin

`src/core/kin.ts`: `kinOf` lists the permanent cast (partner, child, parent,
sibling via a shared parent, master, apprentice, servant). `markOf` marks kin
and plot roles for the portrait border and sprite marker. `kinCall` decides
when one walks over to ask something: three calls a day at most, three hours
apart, none mid-work. Hunger, an empty store and the plot always come. Lines
are in `src/content/plots/kin.ts`. An approaching person is held in
`engine.approacher`.

## Adding a plot

Copy the shape of `debt.ts`, add it to `PLOTS`, give it a `look` and an
emblem scene, and play it every way with `plot:play`. Reuse existing
conditions and effects first.

## Duplications to resolve

- **Life aim vs plot.** `src/core/life-aim.ts` still gives every life an aim
  (`ensureLifeAim` in `src/runtime/session.ts`), and a plot borrows one as
  `plot.aim`. Plots were meant to replace aims, but both run.
- **`challenger` vs `approacher`.** The temple guard still uses
  `engine.challenger`, read in `App.tsx`. Every other NPC who walks over uses
  `engine.approacher`. Folding the guard into `approacher` is the intended
  end state.

Either is welcome cleanup when you are working nearby.

## Not built

A plot's tail resolved by the years: an unresolved plot does not yet get an
ending when years pass ([TIME.md](TIME.md)). Plots drawn from written sources
are an idea in [ideas/SCENARIOS.md](ideas/SCENARIOS.md).

## Checks

- `npm run plot:play -- <plot> <place>:<year>` plays a plot every way.
- `npm run capture:emblems -- <plot>` draws its banner states.
- `tests/plots.test.ts`.
