# Generations: a death, a line, and what survives of a life

Status: plan, September 30, 2026. Builds on the time-travel flow in `TIME.md`.
Procedural everywhere; Luna is called in exactly three places, each with a
deterministic fallback, and never changes dates, kin or the world.

## The experience

You are a baker in Lyon in 1742. You have played a week. From the world
selector you choose **Let the years pass**. The dialog offers no year: it
offers *your death*, and beneath it, quieter, *a year of your choosing*.

You choose your death. The passage runs as it does now, day and night
spinning, but the world under it is your own street growing old: the
neighbour's timber house is rebuilt in stone, the sign over your shop
changes hands. It slows into March 1771. The camera settles on your house,
then inside it, on a bed. Your sprite is there, aged 63, hair grey, and
around the bed stand the people the engine already knows: Héloïse, now 60,
your daughter Florence with a child of her own, the apprentice who took the
shop. The lamps dim to a single held note. Black. In plain type:

> Jean Vidal, baker. Born 1708 in this parish, died March 1771 of a fever,
> in the house he was born in. Three of his six children were living.
> Héloïse outlived him by nine years.

Then one prompt, once a life: **What would you have them remember?** One
line, or nothing. It is the only thing you write.

The tree opens. Rows are generations; each person is their own small
portrait at the age they reached; the dead are ink, the living at the
chosen year are colour. Your line is drawn by hand. Beside your portrait is
your line of text. Beside Florence is what she told her son of it, with
two words changed. Four rows down it is a proverb no one attributes to
anyone. Six rows down it is gone, and so is the family name as you spelled
it. You can pan the years and at any year press **Live as** on anyone alive.
You arrive as them, in that year's town, with the arrival prose the game
already writes, plus one paragraph of what reached them: a saying, a trade,
a house on the same plot, a knife with your initials, or nothing at all.

Walk out of the house. There is a grave in the churchyard with your name,
weathered by the structure model. Three generations on, it is a bare patch.

## What already exists

- `TimeTravel.prepare/commit` and `TimeModal` stages choose, prepare, travel,
  arrive, family. Buildings are rebuilt per era by `buildingAt`; residents
  are regenerated every 28 years with no link to anyone.
- `Lineage` in `src/core/time/lineage.ts`: a single chain, gaps of 23 to 32
  years, lifespans 58 to 81, no family names, no siblings, not connected to
  the player's actual household. Replace it.
- `householdStory` in `src/world/v3/household-story.ts` already models
  marriage age, spacing, widowhood and child loss (30% pre-modern, 3%
  modern). Reuse its rules; do not write a second demography.
- Portraits age by `age` alone: grey from 50, folds from 42, children under
  14. `CharacterSprite` at any age is free.
- `Household.history` has `wed|born|died|left|joined|built|inherited|moved|
  fire|good-year|bad-year|robbed`. The tree is these events, continued.
- `CollapseNotice` is the death screen ("YOUR LIFE HAS ENDED"). It is a hook.
- `birthPercentile` on the arrival screen. Keep using it: "so many were born
  before you; so many since" is the frame for the whole feature.
- `NameTradition.windows` and `familyNamesFrom` already change naming over
  time. The family name drifting is real content, not a trick.
- Audio: `AudioDirector.configure/sound/event`, and `timeSound()`.

## Systems

### 1. A life has a length

`src/core/time/mortality.ts`. Deterministic from seed and person id.

- Adult hazard is Gompertz: `h(x) = a · e^(b·x)`, `b = 0.09`. Choose `a` so
  that the remaining expectation at 20 is 38 years before 1800, 45 for
  1800 to 1900, 52 for 1900 to 1950, 58 after. Standing shifts `a` by
  ±15% (destitute worse, elite better). Under 15 use `householdStory`'s
  child-loss rate as a one-shot at age 0 to 5.
- Maternal death: 1.2% per birth before 1900, 0.3% to 1950, 0.01% after.
- Cause of death: one table in `src/content/history/deaths.ts`, keyed by era
  class (`ancient|medieval|early-modern|industrial|modern`), age band, sex
  and season. Ten to fifteen causes per class, with weights, in the plain
  register: "of a fever", "in childbed", "under a cart", "of the flux", "of
  old age, in winter". Regional files may override a few entries. Do not
  grow a global master table.
- Trades die too: a per-era small list of occupational deaths (drowned
  fishermen, fallen masons) applied with weight by `origin.livelihood`.

The player's death year is drawn when the life is created, not when they
choose to die, so it is the same on every visit. Combat death (`Engine.hurt`)
still ends a life early and flows into the same scene with its own cause.

### 2. A tree, not a line

`src/core/time/tree.ts` replaces `lineage.ts`. `Person = Relative + {sex,
partnerId?, childIds, died: {year, cause}, movedAway?, keeps: Keepsake[],
memory?: MemoryVersion}`.

- Generation 0 is the player's real household: partner and children from
  `Household`, ages as they are. Nothing invented where the world has facts.
- Later generations are grown by `householdStory`'s rules per person:
  marriage at its age, births at its spacing, its child loss, partner drawn
  by `generateCharacter` with the community's tradition, `inheritedFamilies`
  and `inheritLikeness` passed down so faces and names carry.
- Occupation: a child follows a parent's trade with 0.6 pre-1800, 0.35
  industrial, 0.15 modern; daughters marry into a trade drawn from the
  community. This is where "patterns repeat" comes from honestly.
- Naming after grandparents: where the tradition has no rule, the first son
  takes the paternal grandfather's given name with 0.5 pre-1900 and the
  first daughter the maternal grandmother's. Real practice, and it makes
  the tree rhyme.
- Leaving: with 0.1 per generation pre-industrial and 0.3 after, a child
  `movedAway` to a named place from the geography resolver and their branch
  stops. The tree shows a dashed line to the edge.
- Residence: the household site persists while an heir stays. `temporalWorld`
  already rebuilds the building on the site by era; give the heir's household
  `owner` of that site so the descendant arrives at home.
- Cap the tree at eight generations forward and 200 people. It is grown
  lazily, by generation, cached in the session like today's lineage.

What the player's life changes, and only this: wealth and standing at death
(shifts hazard and marriage prospects of generation 1), living children,
the memory text, and keepsakes. Everything else is the era's demography.
Say so on the tree ("what you did changed the first row; the rest is what
happened to most people").

### 3. Keepsakes

At death the engine picks up to two things that pass down: one inventory
item, if any is durable (tool, vessel, cloth, not food), and the residence
if an heir stays. Each generation keeps a keepsake with 0.7, loses it with
0.25 (a `HouseholdEvent` like `fire` or `robbed` explains it), or it is
sold in a `bad-year`. A kept item appears in the descendant's inventory on
arrival with a two-word provenance ("Jean's knife") and `ageObject` applied.

### 4. The memory, and how it mutates

`MemoryVersion = {holderId, text, op, changed: [start, end][]}`. Generation 0
is the player's line, verbatim, or nothing. Each later holder is one child
(the one who stayed nearest, else eldest). Per generation, draw one op:

| op | weight | what happens |
|---|---|---|
| kept | 0.35 | verbatim; a literate household or a written copy freezes it (weight ×2 after 1850, or if any household event is `inherited`) |
| worn | 0.30 | a clause dropped, a specific noun made general ("the oven" to "the work") |
| misattributed | 0.15 | the same words, now "as my mother's father used to say", then "as they say here" |
| conflated | 0.12 | merged with a proverb from the region's proverb list (a new small `src/content/history/sayings/` per region, thirty lines each, documented ones marked) |
| lost | 0.08 | nothing passes; the row shows an empty space with the last version faint behind it |

The op sequence and the changed spans are deterministic. Wording of `worn`
and `conflated` is rendered by Luna when a key exists (`/api/memory`,
input: previous text, op, holder's era and trade, forty words max, must keep
every word not in `changed`); the fallback is the textual ops applied
literally, which is bland but never wrong. `misattributed` and `kept` need no
model. Show every version beside its holder, the changed span in that
generation's ink colour, so the drift is visible at a glance.

The saying also leaks: after `conflated`, the proverb can appear in NPC
dialogue briefs for that community, so a descendant may hear it from a
stranger.

### 5. The passing

`src/ui/time/Passing.tsx`, a new `TimeModal` stage between travel and the
tree. All timing on `requestAnimationFrame`, reduced-motion path cuts to the
card.

1. The world is rebuilt at the death year with the household present (the
   people from the tree who are alive and on the site, `age` set).
2. Camera: `startFollow` off, `zoomTo` the player's bed or the place of
   death over three seconds. Place of death by cause: bed, field, road,
   water, childbed at home. Add one function `panTo(x, y, seconds)` to
   `WorldScene`; it is the only camera addition.
3. Household sprites walk to within two tiles and face the player, using
   the existing goto. Their `expression` is `sad` or `worried`.
4. Light falls to night over four seconds through `timeVisualClock`; the
   `TiltShift` pipeline narrows focus to the bed.
5. Audio: `configure` keeps the culture's music, `setScene` ducks it, then a
   new `passingSound()` in `src/audio/time.ts`: one held tone from the
   cultural mode, resolving downward, eight seconds.
6. Black. The card, typed line by line as `EveningLedger` does its rows, from
   `lifeCard(person, tree)`: name and trade, born and died with the cause,
   living children, who outlived them, one fact from the household history.
7. The prompt for the line. Enter or skip.
8. The tree.

A player who died fighting gets the same scene from `CollapseNotice`, with
the camera where they fell and no household present unless they were home.

### 6. The tree

`src/ui/time/Tree.tsx`. One canvas or SVG, no library.

- Rows are generations, columns by birth year; a thin year scale down the
  left. Each person is a `CharacterSprite` portrait at the age they reached
  (or their age at the chosen year), 24 px, in colour if alive at the chosen
  year and ink otherwise. Partners sit side by side; children hang below
  from a hand-drawn line (a slightly wobbly stroke, seeded).
- The player's own line is drawn heavier. Echo glyphs: a small mark where a
  trade, a name or a cause repeats a direct ancestor's, with a tooltip
  ("named for his grandfather", "died in childbed, as her mother did").
- A year slider along the top: dragging it recolours who is alive and moves
  the "Live as" candidates. Click a person: a card with name, dates, trade,
  cause, keepsakes, their memory version, and **Live as** if alive at the
  slider year. That calls `TimeTravel.prepare(year)` with the chosen person.
- Pan by drag or arrow keys; mobile scrolls rows. Reduced motion draws it
  at once.
- Nothing on this screen calls a model.

### 7. Arrival, extended

`Arrival` gains one paragraph, procedural: what reached this person from the
ancestor, built from the tree: the memory version they hold, keepsakes, the
house, the trade, and the grave if it still stands. Luna's existing arrival
prose may quote it but cannot add to it.

### 8. The grave

A `grave` prop family in `src/content/props`, era and culture styled from the
existing death customs in task lore (cairn, stele, wooden marker, headstone,
none where the custom is cremation or no marker), placed at the burial place
the custom names, with a `Structure` so `ageStructure` weathers it. It is
removed when `temporalWorld` reuses the ground or after a per-culture span.
Walking a descendant past it shows one toast with the name. This is the
cheapest haunting in the plan and should ship early.

### 9. Living on

**Let the years pass** to a year short of death is the existing time
travel with the same person, older. Support it, and let a life have several
such jumps. The death year is fixed, so a player who jumps to 1770 knows
1771 is coming, which is the point.

## Build order

1. `mortality.ts`, `deaths.ts`, `tree.ts` with `householdStory` reuse and
   family names carried; tests in `tests/time.test.ts`: fixed seed gives the
   same tree twice, no one bears a child before 15 or after 45, remaining
   expectation at 20 within two years of the target per era. Delete
   `lineage.ts` when the tree passes.
2. The grave prop and its placement.
3. `Passing.tsx` with the card and the line prompt, `panTo`, `passingSound`.
4. `Tree.tsx`, year slider, Live as.
5. Memory versions, procedural ops only, shown on the tree.
6. `/api/memory` on Luna, fallback intact. Sayings lists for the twelve
   families, thirty lines each.
7. Keepsakes and the arrival paragraph.

Each step is playable on its own. Check by `npm run shot` at a death year
and a screenshot of the tree; the tree at eight generations must read at a
glance on a phone.

## Not in this plan

Saves of the tree across reloads (session-local, like the lineage today).
Epidemics, wars or famines as events; the cause table names them, the
demography does not yet spike for them. Aging NPCs within a played life.
Branching alternate histories. Do not present any of the tree as documented
genealogy; the tree screen carries the same one-line disclaimer the arrival
screen does.
