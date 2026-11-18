# A day: work, cards and Today

How a played day works: the trade's three steps, the places they happen, the
choice cards on the way, the Today list and the evening ledger. Health and
death are in [LIVES.md](LIVES.md), the years after the day in
[TIME.md](TIME.md), plots in [PLOTS.md](PLOTS.md).

Entry files: `src/content/economy/recipes.ts`, `src/content/economy/processes.ts`,
`src/core/work-places.ts`, `src/content/cards/`, `src/core/cards.ts`,
`src/ui/task-view.ts`, `src/ui/EveningLedger.tsx`.

## The shape of a day

The player wakes at the trade's hour (a recipe's `rises`: bakers at three,
farmers at dawn). Today lists the day's work, its occasions (festivals,
errands, commissions) and the plot. Each entry is somewhere. The player walks
there, a card may come up, and holding F does the step (on a phone, one tap of Work works on
until tapped again). At night the ledger
tells the day back and offers **Another day**, **Let the years pass** or
**To the end**.

Every card trades one scarce thing for another: hours, coin, the batch, the
goodwill of a person. No choice is free and every effect shows on the ledger.

On dry fallow land in the medieval open-field, Mediterranean wheat, Mesopotamian canal, northern Chinese millet–wheat (from 206 BCE), Ethiopian highland (from 100 CE), and South Asian paddy–millet profiles (from 600 BCE), a village can put up to three farmers to work with ox teams when its plots have room. Inspect a farmer to take the handles, then walk the indicated row and turn at the headland. A cultivator’s **Break the ground** step can also lead to a working team. Each Work action cuts another length. Once the strip is turned, the farmer releases the oxen. In the local cereal’s sowing season, the household spends seed grain to plant the rows. On mixed rice holdings this dry strip takes an upland cereal. The player can help sow, or the farmer sows on a later working day. These cells grow that cereal by its calendar. Grain picked by hand is gone when the farmer brings the remaining crop into store. The strip can be worked again the following year.

In mainland Southeast Asian rice basins from 1200 onward, a rice holding with a suitable flooded bed can put one water buffalo to a plough in the spring planting season. The rice farmer’s transplanting work leads to the bed. Walk behind the buffalo, turn inside the bund and hand the handles back at any point. The farmer resumes that pass. The mixed mud stays visible until somebody plants it. Inspect the finished bed to transplant nursery seedlings, or leave the farmer to plant on a later working hour. The household supplies the seed stock and keeps the harvest.

European pony carts can appear from 1100 through 1924. Where a pony or buffalo cart can reach a grain holding, its lane joins the farm to the market. The carter loads up to twelve measures of surplus grain on a working trip, leaving a week’s grain per household member at home. Delivery transfers the load to a local household, with bakers preferred. Their grain is available for bread or household consumption. Inspect a stopped cart’s driver to take the reins, load at the farm, drive the lane, and unload at market. On a carter’s hauling day the three Work steps use the same cart and stocks. Carts without a reachable grain holding still run their ordinary routes.

## Work: recipes and family steps

Each kind of work has a **recipe** (`Recipe` in `recipes.ts`): three steps,
each with a verb in the trade's words, a **place role**, a scene for the task
screen and, sometimes, a card slot. `recipeFor` matches by livelihood id, then
activity, then local name. Recipes can vary by season (`dayOf`, `pieceOf`):
the rice farmer and cultivator have a day per season, and `{crop}` is the crop
on the household's own parcel. Days can also be dated: office staff (clerks,
typists, secretaries, accountants, managers) keep a counting house before
1880, a typewriter office until 1985 and a computer after, all at the
workplace, with cards in `cards/office.ts`. Office staff are paid a wage by
their supervisor (a recipe's `boss` names who pays, where it is not the
local foreman). Scholars and scribes keep the
older day of writing for whoever needs it.

A trade with no recipe falls back to its **process family** (`processFor` in
`processes.ts`): tend, gather, transform, carry or serve, each with three
generic steps. The work stays at the trade's prop (loom, anvil, counter) and
the steps around it go where the work went. **Add a recipe** to give a trade
a proper day; do not add a new step system.

### Place roles

`findPlace(role, ask)` in `src/core/work-places.ts` resolves a `PlaceRole`
(`processes.ts`) to a spot on the map:

- `home`: inside the house, at its bench (the oven, the anvil) or its fire.
- `yard`: the household store out front, or the gate of its own pen.
- `door`: the street door, where the baker sells.
- `field`: the household's own parcel (`plan.parcels`), else the nearest
  worked field.
- `pasture`: a pasture parcel, else fallow, else open ground.
- `wild`: open ground outside the houses.
- `water` and `shore`: the nearest bank.
- `well`: the nearest well.
- `sick`: the nearest house with someone ill in `state.ailments`.
- `market`: a market counter, else the square. Where there was no market, it
  becomes a neighbour's door, worded for barter.
- `client`: the door of the day's client, one of the eight nearest
  households.
- `station`, `line`: the town's railway.
- `workplace`, `gear`, `grounds`: the trade's institution or kit.
- `pit` and `face` (`minePlace` in `src/core/sewer.ts`): the shaft bottom or
  adit mouth of the household's mine, and the day's stall at a face, stope or
  salt chamber. The last step at the pit brings the miner back up.

At the `grounds` step a fisher plays the fishing game instead of holding to
work (`src/ui/fishing/`, opened by the work card's **Fish** button or F). It
ends in one `fish` command listing each fish landed: they go into the
inventory as `fish-<kind>` items from `fishItems` in `fishing.ts`, and
`state.fishLog` keeps each kind's count and heaviest. At landing,
`settleCatch` takes the owed share out of the fish carried and the buyer pays
their price for the rest. Agents and autopilot keep the timed step and the
flat takings. Settings → Developer → **Fishing test** opens the game at a
preset place without recording anything.

The species live in `src/content/economy/fish.json`, grouped by water
(`fishOf` picks the group by climate and culture). A kind may bite only at
night, at dusk, in some seasons or in rain (`biting`), may go into traps, and
fights in one of four styles; a leaper must be given slack while it is in the
air. Each kind's item icon is a voxel model built from the same file by
`scripts/art/voxel_items.py` (`--bake fish-`). Besides the cast gear, the
player can set traps, a weir (from the bank) and a set net, which fill on
their own and are hauled with a click. A line or trap sometimes brings up a
find (`fishingFinds`: shells, sticks, an old boot), which lands as an item but
not in the log. A cat may come for the creel: feed it or it takes a fish. **B**
opens the book of this water's kinds, caught or still unknown.

A role the map lacks falls back to the trade's prop. A trade that keeps a
shop (`shopKind`) makes the player's house a named shop on the street. A
herding player keeps their own animals in the first pen.

### Foundations

- The day's places and people are fixed at its first command
  (`state.workday`), so replays find the same patient, field and client.
- Work begun and unfinished carries on until six the next morning. A card
  left from a past day lapses.
- Every choice is kept in `state.record` (day, clock, card, choice, line).
  Today's lines also stay on the work entry as **So far**.
- The last step pays through `pay` or `dayOfWork` in the engine, scaled by
  **the day**: one number for how the work is going, which cards raise or
  lower.

## Cards

`ChoiceCard` and `CardChoice` are in `src/content/cards/types.ts`. A card has
a `slot` (the recipe step it belongs to), an optional person (`who`: boss,
neighbour, official or patient, with `as` for their role), an optional
`scope` and `when` weather, its text, two or three choices, and an evidence
status. A choice may carry a `check` (stat, skill, odds), effects (`then`,
`otherwise`) and the line kept for the day.

Effects (`CardEffect`): `day`, `pay`, `minutes`, `sleep`, `fatigue`, `item`,
`forfeit`, `regard`, `hurt`, `tend`, `care`, `go`, `risk` (may start an
illness).

Decks in `src/content/cards/`:

- `general.ts`: the general deck, two cards per family step (`tend-2` …
  `serve-3`), worded with `{good}` and `{work}`.
- Trade and regional decks that override it where they match: `baker`,
  `crafts`, `farm`, `rice`, `fishing`, `hunting`, `healer`, `rail`, `mine`
  (filtered by `mine` kind: coal, metal, salt).
- `hazards.ts`: drowning, falls and rock falls, offered as choices.
- `care.ts`: illness cards (see [LIVES.md](LIVES.md)).

**Underground.** A hewer is paid by the tubs (sacks before 1750) filled at the
face, `fillTubs` in the engine. Mine cards can start a live accident
(`{ type: "peril" }`, `src/core/mine-peril.ts`), and the mine also rolls its
own, more often deeper and before 1850. The four kinds are a roof fall, a
runaway tub, afterdamp and an inrush. Each is dodged in real time: the clock
slows to 8 game seconds a second while one is live. A fall that cuts the
player off leaves them shut in until a rescue digs them out, sooner if they
knock on the rails. Injuries go to health, and every outcome goes into the
evening's record.

**Picking** (`pickCard` in `src/core/cards.ts`) filters by slot, scope and
weather. A card for this place or this weather beats a general one, and unseen
cards come first. A card is drawn only if its person exists here, its society
could do what it asks (`needs`), and two of its choices make sense. A choice
that costs an item the player lacks is shown dimmed; one about an item this
world never had is hidden.

**Odds** are the check's `odds` plus stat and skill, clamped to 5–95%. They
are shown as words (`oddsWord`) and as a pie on hover.

**Answering** is a command, `{ type: "choose", card, choice }`, so replays
reproduce it. Add cards to an existing deck file; add a deck file only for a
new trade or region with several cards.

## Today, the panel and the task screen

Three views show the same entries in the same order:

- **The work panel** (`src/ui/WorkCard.tsx`): the current step, its place
  and distance, **Go**, and a five-pip meter for the day.
- **Today** (the sidebar tab, in `App.tsx`): the list.
- **The task screen** (`src/ui/TaskSky.tsx`): one page per entry, with the
  list as a strip along the bottom. Built from `tasksOf` and `TaskSource` in
  `src/ui/task-view.ts`.

The entries come from `engine.dailyGoals()`: a `work` entry titled by the
trade's day (`dayTitle`), plus `own` entries from the day's agenda
(`src/core/agenda.ts`: occasions, festivals, commissions). Kin may also walk
over and call (`kinCall` in `src/core/kin.ts`): three calls a day at most,
three hours apart, none mid-work.

**The town's rhythm.** Where a market keeps a cycle (`marketDay` in
`agenda.ts`), nearly every stall is staffed on its day and a quarter between,
and the town murmur rises. Shops, shutters and stalls keep one clock
(`shopOpen` in `src/core/itinerary.ts`). Mediterranean towns (`siestaOf`) shut
from 13:30 to 16:30, with residents indoors and stalls packed up.

The **pace** setting (`src/ui/start-mode.ts`) is Quick or full. Quick jumps
the player to the place on **Go**.

## The evening ledger

`src/ui/EveningLedger.tsx` reads `state.evening` and plays the day's lines
back. Its buttons are **Another day**, **Let the years pass** and **To the
end**. The last two open the years ([TIME.md](TIME.md)).

## Duplication to resolve

`engine.dailyGoals()` still runs the old goal picker (`pickGoals` in
`src/core/goals.ts` over `GOAL_TEMPLATES` in `src/content/goals/templates.ts`)
only to decide whether the day has a work entry. The need and social goals it
also picks are thrown away. Replacing that with a direct check on the
livelihood, and dropping the templates the agenda does not use, is welcome
cleanup when you are in this code.

## Text

Everything the player reads, speech included, is plain modern English.
Period terms are fine where a modern word would be wrong, with a gloss.

## Checks

- `tests/livelihood.test.ts` (slow tier): puts the player into every trade
  in eleven places through four seasons and checks every step finds its place.
- `tests/day-plan.test.ts`, `tests/livelihood-mix.test.ts`.
- `npm run agent:play -- --setting "Baker in Lyon 1742" --seed day` to play a
  day in the terminal.
