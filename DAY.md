# A day, the years, and a death

Status: plan, October 8, 2026. Supersedes the daily goals, the hold-F work
stages and `PLOTS.md`'s one-plot-per-day clocks where they disagree. Takes
mortality and the passing from `GENERATIONS.md`; leaves its tree, memory and
keepsakes for later.

## The experience

You spawn as Catherine, a baker in Lyon in 1742, at three in the morning,
because that is when bakers got up. The title card names your plot, if you
have one: *The Debt. The miller wants his money by Saint John's day.*

Today, in the sidebar, says what the day holds: the bake in three stages, the
Mass for your late husband at the parish church at ten, and the miller.
Each entry is somewhere. You go there and a card comes up: a situation, a
person, two or three choices. The flour sack is damp. The oven runs hot. The
inspector is weighing loaves on the street. What you choose on one card
changes the next, and every card draws on the same few things: the hours left,
the coin in the box, the batch on the board, the goodwill of the people you
meet. You cannot do everything. Your daughter is coughing. You could skip
the Mass. You could walk out of the city and never come back.

At night the ledger tells the day back as a chain: damp flour, a small batch,
short of coin, the miller unpaid. Then three buttons: **Another day**,
**Let the years pass**, **To the end**.

Letting years pass runs your life forward as household history: a grandson
born, the oven sold, a winter fever, the price of bread in 1770. You can stop
at any year and play another day, older, in the same house. Or you die, often
early, of something real, and choose to go on as someone in your household or
to close the life. Closing it gives a record to keep as a PDF: the day as you
lived it, the years, the death, and how your life compared with the lives
around it.

## The rules this plan holds itself to

- **Beautiful.** One card, drawn well, in the plot cards' pixel language,
  with the person's portrait and the place behind it. No new chrome.
- **Simple.** One new data shape, the card. Everything else is a system
  that exists, shown through it. The years are written as household history
  in the format the game already reads.
- **Functional.** Every phase ends playable, with or without Luna.
- **Historically particular.** The work, the hour, the people, the money, the
  risks and the remedies come from the place and date. General cards fill
  every life; regional cards override them where written.
- **Fun.** Every card trades one scarce thing for another. No choice is
  free, none is flavour without effect, and the effect shows on the ledger.

## What already exists and is reused

| Need | Exists |
|---|---|
| The card's look, palette, emblem, clock hold, queue | `PlotCard` (`src/ui/PlotCard.tsx`), `engine.cards`, plot `look` |
| A person walking over to speak | the approacher and speech box, kin calls (`src/core/kin.ts`): three a day at most, three hours apart, none mid-work or while F is held; hunger, an empty store and the plot always come |
| Card effects | plot `Effect` union (`src/content/plots/types.ts`) |
| The work's three stages per trade | process families and steps (`src/content/economy/processes.ts`), `doWork`, `pay`, `dayOfWork` in `engine.ts` |
| Where work happens | `workStation`, `client`, stations by prop family |
| The day's occasions, with place, time of day and minutes | `AgendaItem` (`src/core/agenda.ts`), 628 occasions, 116 festivals |
| Odds | `statsOf` (strength, agility, endurance, wit, five traits), skills and XP |
| Regard, standing, fortune | `regard`, `standingOf`, `Household.fortune` |
| Illness with a course and a death rate | `AILMENTS`, `onsets`, NPC death writing `died` |
| Lasting conditions by age, era and place | `conditionsOf` |
| Demography | `householdStory` (`src/world/v3/household-story.ts`) |
| Dated regional news | `TIDINGS` (`src/content/history/tidings.ts`) |
| Household history kinds | `wed born died left joined built inherited moved fire good-year bad-year robbed` |
| The day's end | `EveningLedger`, `state.evening` |
| An older self in the same place | time travel (`src/runtime/time-travel.ts`) |
| Model prose with a fallback | Luna endpoints in `api/` and `server/` |
| The life aim | kept as it is, for roleplaying |

## 1. The card

As built for the railway labourer (`src/content/cards/types.ts`):

```ts
type ChoiceCard = {
  id: string;
  slot: string;             // the recipe step it belongs to: "rail-line"
  who?: "boss" | "neighbour" | "official" | "patient";  // none: told
  as?: string;              // "inspector", where their trade would mislead
  scope?: CharacterScope;
  when?: "hot" | "wet" | "cold";  // today's weather it needs
  text: string;             // said by or of the person, 40 words at most
  choices: CardChoice[];    // two or three
  evidence: Evidence["status"];
};
type CardChoice = {
  label: string;
  note?: string;            // what it costs, beside the label
  check?: { stat: keyof Stats; skill?: SkillId; odds: number };
  then: CardEffect[];
  line: string;             // the sentence kept for the day
  otherwise?: CardEffect[]; // when the check fails
  otherwiseLine?: string;
};
```

Effects so far: `day` (how today's work is going, which sets the wage or
the goods made), `pay`, `minutes`, `fatigue`, `item`, `regard` (with the
card's person), `hurt` and `tend` (a dying patient may mend). A card's
`who` is the boss, a neighbour, an official or the patient, and `as` names
what they are to the player where their own trade would mislead. Still to come as cards need them: `standing`, `risk` (an ailment and
its odds), `aim` (a step on the life aim), and the plot's effects.

**Picking a card** (`src/core/cards.ts`). Filter by slot, scope and today's
weather; a card for this place or this weather outranks one for any day
anywhere; a seeded pick by day among the rest.

**Answering.** The answer is a command, `{ type: "choose", card, choice }`,
so replays reproduce it. The card waiting is kept on today's work; the F
prompt goes quiet until it is answered, and the panel can put it back on
screen. A choice with a check shows its outcome in a second speech box; a
plain choice's line goes to the log.

**What can be chosen.** A choice that costs an item the player has not got
is shown but cannot be taken ("You have no coin"); one about an item this
world never had (coin among foragers) is not shown. A card is drawn only if
its person exists here, its society could do what it asks (`needs`, such as
`market_exchange` for the market inspector), and two of its choices make
sense. Cards not yet seen in this life come first.

**Odds.** `odds` plus the stat and skill, clamped to 5–95%. Shown as words
(*a long shot* under 25, *risky* under 50, *likely* under 80, *all but
certain*), the number on hover.

**Luna.** With a key, the card's text and outcome lines are rewritten for the
place and year from the template, the slots and the scope, before the card is
shown (prefetched one card ahead so it never waits). The choices' mechanics
never change. Output is stored in the log like dialogue, so replays need no
call. Without a key the template stands, so templates must read well alone.

**The back end.** Each choice's line is kept on today's work (`lines`) for
**So far** and the ledger. A life-long `state.record` with card id, evidence
and sources for the edu recorder comes with the record (section 7). None of
it is shown to players.

**Look.** The speech box of `PlotCard`: the person's portrait, their name
with their role beside it, the text typed out, the answers in a column with
their cost on the right and the pointing hand. Phones and reduced motion as
`PlotCard` already handles them.

## 2. The workday

### Why the old one did not work

Every trade fell into one of five families with three stock lines ("Set out
tools and materials, work steadily at it, finish off and clear up"). 53 of the
229 trades have no station prop and fell back to the household store, so most
people worked in their own yard; a railway labourer held F at a galvanised bin.
All three stages happened on one spot. "Hold F" showed only once you stood
there with the panel open, and F also meant whatever door was nearest. Working
jumped the clock and printed a line. "Do it for me" played the day for you.

### Recipes

Each kind of work has a **recipe**: three steps, each with a verb in the
trade's words, a **place role**, a scene for the task screen and, sometimes, a
card. About 85 activities collapse to some 30 recipes; the five family steps
stay as the fallback for an activity without one.

As built (`recipes` in `src/content/economy/processes.ts`), matched by
livelihood id, then activity, then local name:

| Trade | Step 1 | Step 2 | Step 3 | Paid |
|---|---|---|---|---|
| Railway labourer | Report to the ganger · the station | Tamp ballast · the line | Draw the day's wage · the station | wage |
| Baker | Fire the oven and set the dough · your oven | Bake the loaves · your oven | Sell the bread · your shop window | takings and bread |
| Rice farmer, spring | Pull seedlings · your paddy | Transplant the paddy · your paddy | Let water in · the channel | the rice |
| Healer, herbalist, nurse | Make up remedies · your house | Call on the sick · a house where someone is ill | Sit with them · that house | a fee, in coin or kind |
| Farmer, spring (and all cultivators) | Fetch the seed · your house | Break the ground · your field | Sow the {crop} · your field | the crop |
| Herder, summer (four seasons) | Drive the animals out · the pasture | Watch the herd · the pasture | Bring them home · your house | the herd's yield |
| Weaver | Spin the yarn · your house | Weave · the loom | Take the cloth to market · the market | the cloth |
| Smith | Light the forge · the anvil | Hammer out the work · the anvil | Take it to whoever ordered it · their house | a fee |
| Carpenter | Choose the timber · your house | Shape it · the bench | Deliver the work · their house | a fee |
| Market trader | Set out your wares · the market | Sell through the day · the market | Count the takings · your house | takings |
| Keeping house | Fetch the water · the well | Grind, cook, keep the fire · your house | Get what the house needs · the market | the household fed |
| Scribe | Make ready · your house | Write for whoever needs it · the market | Carry it to its owner · their house | a fee |
| Watch | Take up your post · the square | Walk the round · the edge of town | Hand over the watch · the square | the watch |

The rice farmer and the cultivator each have a day for each season. Rice:
transplanting, weeding (the bunds, the water), the harvest (cutting,
threshing, the landlord's share), the slack season (bunds, night soil, straw
rope). Other crops: ploughing and sowing, weeding and watching (birds,
fences), the harvest (reaping, stacking, the share owed), the slack season
(the store, mending, muck). `{crop}` is the crop on the household's own
parcel, so a Norman sows rye and a Mexica farmer maize.

**Work with no recipe** takes its family's three steps. The work itself stays
at the trade's prop (the loom, the anvil, the counter); the steps round it go
where the work went:

| Family | Step 1 | Step 2 | Step 3 |
|---|---|---|---|
| tend | your house | the prop | your house |
| gather | out beyond the houses, or the water for fishers | the same | your house |
| transform | your house, for the materials | the prop | the market (a counter, else the square) |
| carry | the market (the well for water carriers) | the client's door | the client's door |
| serve | the prop | the client's door | your house |

Quarrying and mining keep their picks and boulders. The client is one of the
eight nearest households, a different one each day, and pays at the end. It
also draws the general deck (`src/content/cards/general.ts`) at its second and
third steps: two cards for each of the ten slots (`tend-2` … `serve-3`),
worded with `{good}` and `{work}` so a weaver is asked about cloth and a smith
about ironwork.

Place roles (`findPlace` in `work-places.ts`): `home` is inside the house,
at its bench (a recipe's `bench`, the baker's oven or the smith's anvil, set
on the shop's own fixture) or else its fire; `yard` the household store out
front, or the gate of the household's own pen where it keeps stock; `door`
the street door, where the baker sells; `field`
the household's own parcel from the plan (`plan.parcels`), however far out,
else the nearest worked field; `water` the nearest bank within 24 cells of
that field; `sick` the nearest house with someone ill in `state.ailments`,
else the nearest house, its eldest the patient; `pasture` a pasture parcel, else
the fallow (stock grazed it in open-field farming), else open ground 25 to 60
cells out; `wild` that open ground; `shore` the nearest bank within 40
cells; `market` the nearest market counter, else the town square; `client`
the door of the day's client; `station` and `line` from the town's railway. A step may name its place (`label: "your oven"`). The
player's house is the first ordinary lot, never a venue's or a townhouse, and
a trade that keeps a shop (`shopKind`) makes it one on the street, named for
it: *The bakehouse*, *The smithy*, *Weaver's workshop*. A herding player
keeps their own animals in the first pen, the species their trade names or
the place and date's (`keptSpecies`), and the cards call them by it: ewes and
lambs, mares and foals, she-camels. The pen stands open while the day is out
at grass and while the herd is brought in, so the herd goes out and comes home
with them. A role
the map lacks falls back to the old prop work. The coverage test
(`tests/livelihood.test.ts`, in the slow tier) builds eleven places from
Konya in 6499 BCE to Melbourne in 1950, puts the player into every trade
found there in turn, through all four seasons, and checks every step finds
its place or its prop. It found and fixed: fishers far from water, farmers
with no parcels, a house outside its town's plan. One exception stands: the
headless worlds draw no rivers, so a fisher there falls back to their gear.

### The day's foundations

- **A day's work belongs to the day it began.** Work begun and unfinished
  carries on through the night until six the next morning, with its steps,
  places, card and wage; a card left from a day gone by lapses.
- **The day's places and people are fixed at its first command**
  (`state.workday`), so a replay that never drew the panel finds the same
  patient, field and client as the game that did.
- **Every choice goes into a life record** (`state.record`: day, clock, card,
  choice, line), for the record and the PDF; today's lines stay on the work as
  **So far**.
- **Officials are each their own man**, picked by role, and a neighbour is one
  of the four nearest households, varying by card and day.
- **Work with no tool of its own here goes to the house or yard** ("your
  workshop"), never to the household's store; the store is a station only
  when its prop is the trade's own (a potter's pot).
- **Where people had no market**, steps that go to market go to a neighbour's
  door instead, worded for barter ("Trade the pots with a neighbour").
- Place finding is in `src/core/work-places.ts`, recipes in
  `src/content/economy/recipes.ts`.

### What the player sees

- **The panel** names the step and its place, a clock chip for how long it
  takes (red when it runs past a plot's deadline), and one action: Go, the F
  key to hold, or an answer to a waiting card. Opened, it lists the steps
  with their lengths, a five-pip meter for how the day is going, and the
  expected pay. No sentences of metadata.
- **First time only**, a small "Start here" under Go and "Hold F to work"
  when the player first stands at a step; stored per browser.
- **Cards come on arrival.** Walking to the step's place draws its card
  before the work; holding F then does the work. (Set down there without
  walking, the card comes after.)
- **Choices are numbered** and taken with 1 to 3 or a click; nothing is
  chosen in advance, and nothing can be for a moment after the text ends.
  Time and money costs show as small icons; a roll shows as a pie with its
  percentage. A choice the player cannot afford is dimmed with the reason.
- **After a choice** the same card shows what happened, a ✓ or ✗ for a
  roll, and chips for what changed: time, money, the work going better or
  worse, someone's regard, a hurt.
- **The hours pass on the sky.** When a step completes, the world's clock
  runs from its start to its end over a second or so, with a small time pill
  at the top, and the player waits.
- **Plain modern English** in everything the game says, characters' speech
  included. Period terms where needed, with a gloss; no archaic phrasing.

### Playing a step

The panel names the step and its place, with **Go** (the same walking as a
click on the map; the workday autopilot goes). Arriving, the step becomes the
first F prompt at bottom left: **F Report to the ganger**. Holding F does the
step and moves the clock by `process.hours / 3`. A step with a card shows it
when the hold completes.

### Cards and the day

Each step may draw a card (section 1). One number connects them, **the day**:
how the work is going, from poor to good. Choices raise or lower it, add
coin, cost time or regard. The last step pays through `pay` or `dayOfWork`,
scaled by it. Each choice's line is kept against the work entry, as **So
far**.

**Decks.** `src/content/cards/`: a general deck per family and step, worded
with the trade's nouns, and trade or regional decks beside them that override
where they match (the bread assize, a temple barley loan, a Ming pawnshop, a
Nile corvée gang, a Lowell overseer, a ganger short of men). Every card is
bound to a real person where one exists, so the choices land on someone.

## 3. Today, the panel and the task screen

The day's entries are the work, today's occasions, the plot and anyone
calling for you. Three views show the same entries, in the same order, with
the same names.

**The panel** (top left of the game, where the work card was). Closed: an
icon, the current step in plain words, its distance, **Go**. Open: the three
steps with their places and ticks, and one line on how the day is going
("Steady. About 4 ringgit if it holds."). Closing it hides it until
tomorrow. Clicking its title opens the task screen on that entry.

**Today** (the sidebar tab). The list, replacing the daily goals. Each row
opens the task screen.

**The task screen** (`TaskSky`) is the page for one entry, and its bottom
strip is the same list, life aim first. Done entries tick, the current one is
marked, missed ones are struck through; the work chip carries its three dots
and the plot chip its palette.

- **Header:** "Work · Morning" and the trade's day, *A day on the line*.
- **Your day panel:** the steps with places and distances, **How** for the
  current step, **So far** (card outcomes on this entry), **The day**, the
  skill. **Go** replaces "Show me the way"; **Follow this** replaces "Make this
  today's aim" and sets which entry the panel tracks.
- **The scene** follows the current step's scene (talk, haul, market).
- **In the record** asks for lore on this trade and step.

Occasion pages gain **Go** and **So far**. The plot gets a page: who, what is
owed, the deadline, where, what has happened, the panel edged in the plot's
palette. A call gets a short page while open. The life aim page is unchanged.

Code: `tasksOf` reads the day's entries; `TaskSource` gains `work`, `plot`
and `kin`; the work page is built from the recipe. "On the line", "At the
machine", "Building" and "Working the roof" leave the civic workplace, which
is why a railway labourer was given Speech and lore on radio.

**The day starts at the trade's hour.** Bakers at three, farmers at dawn,
clerks at eight. A `rises` hour on the recipe; the arrival clock follows it.

**Speed** is density, chosen at the start and in settings: *Quick*, about 20
minutes, one occasion, **Go** jumps you to the place; *Standard*, 40 to 50,
walking; *Slow*, two occasions, more calls and encounters.

**The day's end.** `EveningLedger` gains the day's chain, the record lines in
order, and three buttons: **Another day** (sleep, a new morning, the plot
goes on), **Let the years pass** (choose how many, up to the end), **To the
end** (run the years until death).

## 4. Health and death

Death should be common and real. The model is the one that exists, with
risks added:

- A card choice can carry `risk`: river water and the flux, a crowded
  festival and a fever, a fall from the roof.
- Each process family and some trades carry a daily hazard: drowning for
  fishers, falls for masons, burns for smiths, childbirth for anyone pregnant.
- Falling sick shows a treatment card with the period's options: the healer
  (coin), rest (lost work), a remedy, a saint, a vow, a charm. Honest odds:
  most did little. Sitting with a sick kinsman is a card too.
- The player's own illness lowers stats while it runs, so the day gets
  harder.

A player who dies, in the day or in the years, sees the death card, then
chooses: **Go on as** one of the living household aged 12 or more (the
widow, the eldest son, the apprentice), or **Close this life**. Going on is
a new engine function, `becomeKin(id)`, that swaps the player's identity and
carries the household, plot and record.

## 5. The years

`src/core/time/mortality.ts` as `GENERATIONS.md` specifies (Gompertz by era,
standing, maternal death, a causes table in `src/content/history/deaths.ts`),
and `src/core/time/chronicle.ts`, which steps a year at a time and writes
`HouseholdEvent`s into `Household.history`. Because it writes history in the
format the game already reads, the next played day's intro, concerns,
anniversaries and kin know what happened, with no new plumbing.

Each year, seeded by year and state:

- **Death:** the hazard for the player and each household member, from age,
  standing, the trade's hazard, conditions, and any epidemic in scope.
  Choices in played days move the inputs, so a life can be shortened.
- **Kin:** marriages, births, child deaths, children leaving, partners dying
  and remarrying, by `householdStory`'s rules.
- **The body:** conditions that appear at the new age by `conditionsOf`, plus
  a short table of ageing lines with no effect (grey hair, teeth lost,
  failing sight before spectacles).
- **Fortune:** a seeded walk biased by standing, the trade, the plot's tail
  and bad years; it writes `good-year`, `bad-year`, `fire`, `robbed`.
- **The world:** `TIDINGS` whose span covers the year, plus dated famines,
  plagues and wars from the same regional sources, one line each.
- **The plot's tail**, below.

**Let the years pass** plays these as a scrolling chronicle over the
time-travel passage, a line per event, pausable. A placeholder with good
bones first; its real UI is its own design pass. Stopping on a year prepares
the world at that year through time travel with the same, older person, the
player's household carried onto its site (the largest engine task in this
phase). **To the end** runs until the player's death.

## 6. Plots

One per life, drawn at spawn, or none (about one life in five has none).
Eight to ten plots, in order of build:

1. The Debt (built)
2. The Hungry Season
3. The Mending (a sickness in the house)
4. The Levy
5. The Rival
6. The Accused
7. Love and Trouble
8. The Dying Elder
9. A Stranger Comes
10. The Journey Out

The Grind, the Wrong Done and Grief fold into cards and chronicle events.

A plot's developments become cards with choices, in the same component.
Its cast is bound from people already in the routine where it can be (the
creditor is the supplier, the rival works the next stall), so its people
appear on ordinary work cards and add a plot choice there. That is where the
plot shapes the day.

Each plot has a **played part** on short clocks, as now, and a **tail**: if
it is unresolved when years are skipped, the chronicle picks an ending by
weights from state (fortune, regard with the cast, standing) and writes it as
history: "The debt was never paid. In 1745 the miller took the oven."

## 7. The record

`src/ui/LifeRecord.tsx`, opened from the death card and the day's end:

1. Who: portrait, name, trade, place, born and died.
2. The day, or days, as lived: the record lines with their hours.
3. The years: the chronicle by year.
4. The death: cause, place, who was there.
5. Against the typical: life expectancy at birth and at 20 for the era and
   standing, children born and surviving, set beside this life. "Most people
   born in Lyon in 1686 who reached twenty lived to about 58. You lived to
   61. You buried three of six children; that was ordinary."
6. One line the player may write: what they would have them remember.

Luna turns sections 2 to 5 into prose from the facts (`/api/life`), adding
no facts; the fallback is the lines as written. The page has a print
stylesheet, and **Save as PDF** opens the print dialog, which keeps the
fonts and the pixel portraits. A direct download library only if that proves
not good enough on school Chromebooks.

## Phases

Each ends playable. Narrow checks per phase; `npm run check` at the end of
each. One `npm run shot` per new screen.

1. **The card and the workday.** Done, October 8 and 9. Recipes for the
   railway labourer, baker, rice farmer, cultivator and herder (four
   seasons each for the land and the herd), healer, weaver, smith,
   carpenter, market trader, keeping house, scribe and watch; every other
   trade takes its family's steps with places. 78 cards picked by weather
   and scope, the general deck under them all. The panel, the work page on
   the task screen, the civic fix, the coverage test. Later: recipes for the
   rest of the 85 activities, a day of births for midwives.
2. **Today and the day's end.** Started: the Today tab and the task
   screen's strip are now the work, the occasions and the plot (the need
   and social goals are gone), and the plot has a page. Still: call pages,
   the trade's waking hour, speed setting,
   the ledger's chain and three buttons. Retire `GOAL_TEMPLATES` except where
   the agenda uses them.
3. **Health and death.** Done, October 12. The player falls ill as anyone
   does and can die of it; illness wears health down and takes up to half
   of strength, agility and endurance (`engine.stats()`). Care cards
   (`cards/care.ts`) wait apart from the work in `state.care`: for the
   player's own illness the healer, lying up, a household remedy, prayer,
   or keeping on, with honest odds (a fee bought care, not a cure, before
   germ theory); for kin, sitting with them or sending for the healer. A
   `risk` effect starts an illness (ditch water, a coughing neighbour), and
   hazard cards (`cards/hazards.ts`, filtered by `work`) carry drowning,
   falls and rock falls as choices rather than silent rolls. The death card
   (`DeathCard.tsx`) names the cause, age, place and year, then **Go on
   as** one of the household aged twelve or more (`become` command,
   `becomeKin`) or **Close this life**. Pregnancy and childbirth as state
   wait for the years, where births are.
4. **The years.** `mortality.ts`, `deaths.ts`, `chronicle.ts`, the scrolling
   placeholder, stopping on a year with the household carried. Tests in
   `tests/time.test.ts`: same seed same life; expectation at 20 within two
   years of target per era; no births before 15 or after 45.
5. **Plots.** Plot per life with the none chance, developments as cards,
   cast bound into routine cards, the tail. Then plots 2 to 10, each with
   general wording, three regional wordings and a tail.
6. **The record.** `LifeRecord`, the typical-life comparison, `/api/life`,
   print stylesheet. Luna card rewriting lands here too if not earlier.
7. **Breadth.** Regional decks across every family the occasions cover,
   written like `days/`: specific, sourced in the back end, plain.

## Not in this plan

The years' real UI (a placeholder until its own pass). The family tree,
memory drift and keepsakes from `GENERATIONS.md`. Graves. Tuning how
representative spawns are. Emailing records to teachers. Saves.
