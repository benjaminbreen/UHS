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
  - `wording`, where the first scope match wins. The last entry supplies shared lines.
- **Conditions and effects** are small closed unions of plain data, not
  callbacks. Add one only when a plot needs it.
- **Runner.** About one life in ten draws an opening plot. Later chapters get
  a fresh roll. `startPlot` draws a shape, then a plot that fits. Its cast
  comes from existing people (the creditor from `owes`, a rival by trade), with `PlotRole` in
  `types.ts`. `stepPlot` evaluates conditions every game minute, so clocks
  measured in hours bite. `endPlot` closes it. Plot state is plain data in
  `engine.state.plot` and crosses map travel. A life that starts underground
  (`setting.below`) draws no plot whose opening sets a gathering.
- **Cards.** `engine.cards` feeds `PlotCard.tsx`. A `choose` effect puts up a
  decision card. Answers fire their id for developments and endings.
- **Reach.** Plot cards, care cards about kin and household deaths are
  brought by someone (`engine.bring`). While the player is in a cave, sewer
  or mine, or at sea, they wait in `engine.held`, and approachers stop at the
  surface; both come once the player climbs out or goes ashore. Cards for questions no longer asked
  are dropped then.
- **Emblems.** Banners are drawn in `src/ui/plot-emblems.ts` and
  `src/ui/emblems/scenes/`, at the opening, at each card and at each ending.
- **Clocks.** Some plots open within minutes. A seller notices a lull while
  working. A coworker can ask for half an hour of cover when spoken to at
  the shared workplace. Either encounter can pass undiscovered.
- **Wording.** One template per plot, with era and culture handled in
  scoped `wording` entries. Royal mourning requires a matching region, year
  and season for the death of [Augustus](https://sourcebooks.web.fordham.edu/ancient/suet-augustus-rolfe.asp),
  [William Rufus](https://www.royal.uk/william-rufus) or the
  [Kangxi emperor](https://www.dpm.org.cn/Uploads/pdf/4651/T00057_00.pdf).
  Scope years are end-exclusive: the year 1986 alone is `[1986, 1987]`.
- **Modern years.** A plot whose story only makes sense before modern times
  has weight 0 after it, rather than generic wording: strangers come to trade
  only before 1850, an unannounced comet only before 1900 (Halley in 1910 and
  1986 and Hale-Bopp in 1997 still come), and after 1900 sickness comes only
  as the 1918 flu, SARS in Hong Kong in 2003 or COVID. Debt, theft, fire,
  estate, token, labour and exam have modern wordings (a shop tab, the police
  station, the insurance claim, hospital births where they were the norm,
  cram schools). Plots built for modern slices: `plant` and `strike`
  (industrial work), `foreclosure`, `draft`, `banks` (frozen savings and
  hyperinflation), `taken` (night arrests under dictatorships), `overdose`,
  `abroad` (labour migration and its agents), `blackout` and `broadcast`
  (coronation, moon landing, World Cup finals, the Wall). Each is weight 0
  outside the places and years it names. Short events (a blackout, a
  broadcast, a strike, a sudden bank freeze, the Malvinas call-up) also need
  the season they fell in.

## Kin

`src/core/kin.ts`: `kinOf` lists the permanent cast (partner, child, parent,
sibling via a shared parent, master, apprentice, servant). `markOf` marks kin
and plot roles for the portrait border and sprite marker. `kinCall` decides
when one walks over to ask something: three calls a day at most, three hours
apart, none mid-work. Hunger, an empty store and the plot always come. Lines
are in `src/content/plots/kin.ts`. An approaching person is held in
`engine.approacher`.

Everyone who walks up, and every card a plot brings, shares one budget
(`mayCall` in the engine). Kin calls that are not urgent, favours (one a day)
and follow-up cards only start when no stage of work is under way, two hours
after the last arrival, and fewer than three have come that day. A plot's
visits and questions wait the same way, without the daily count, unless the
template is `urgent` (a birth, fire, flood, fever, a beast loose) or its
deadline is under an hour off. A plot question put away comes back after
three hours, or half an hour in an emergency. The keeper, robbers and the
day's work cards are not held back, but their arrivals count.

## Adding a plot

Copy the shape of `debt.ts`, add it to `PLOTS`, give it a `look` and an
emblem scene, and play it every way with `plot:play`. Reuse existing
conditions and effects first.

## Duplications to resolve

- **Life aim vs plot.** `src/core/life-aim.ts` still gives every life an aim
  (`ensureLifeAim` in `src/runtime/session.ts`), and a plot borrows one as
  `plot.aim`. Plots were meant to replace aims, but both run.

It is welcome cleanup when you are working nearby.

## Not built

A plot's tail resolved by the years: an unresolved plot does not yet get an
ending when years pass ([TIME.md](TIME.md)). Plots drawn from written sources
are an idea in [ideas/SCENARIOS.md](ideas/SCENARIOS.md).

## Checks

- `npm run plot:play -- <plot> <place>:<year>` plays a plot every way.
- `npm run capture:emblems -- <plot>` draws its banner states.
- `tests/plots.test.ts`.
