# Lives: body, illness, death, bonds and concerns

What makes one life particular and what can end it: lasting conditions,
illness and care, hunger and danger, death and going on as kin, bonds, and
the concerns the opening card reads. Entry files: `src/core/health.ts`,
`src/content/health/`, `src/core/bonds.ts`, `src/core/concerns.ts`,
`src/core/danger.ts`, `src/ui/DeathCard.tsx`.

## Conditions

`src/content/health/conditions.ts` with `conditionsOf` in
`src/core/health.ts`. These are lasting conditions such as hearing loss, a
limp, smallpox scars, recurring malaria, consumption or a stammer. Each has a
rate by age, sex, era and place, a period name with a modern gloss, and
plain lines. They derive from the seed like stats, so every resident has them
at no storage cost. Rates are realistic: before modern medicine most adults
had something. No slurs; a period term gets the modern name in its gloss.
Conditions colour text; they do not yet change play.

## Illness

Acute illness lives in `state.ailments` (`src/content/health/ailments.ts`):
fevers, flux, coughs, childbed, smallpox, measles, plague in plague years,
broken bones. The sick stay home. A death removes the person and writes
`died` into the household's history.

New worlds pin `manifest.disease = 1` (`src/runtime/schema.ts`), which turns
on transmission (`src/content/health/infections.ts`):

- Respiratory infection builds with shared indoor and close time.
- Provisions can expose a household.
- Open wounds can become infected.
- Incubation precedes symptoms, and recovery gives temporary protection.

Practitioners must actually exist nearby and supplies are finite. Treatment
changes recovery and mortality. Diagnoses and latent outcomes are research
only. Rates are inferred game calibrations; the sources are in
`infectionEvidence`.

**Care.** Care cards (`src/content/cards/care.ts`) wait in `state.care`,
apart from the work. For the player's own illness they offer the healer, lying
up, a household remedy, prayer or keeping on, with honest odds: before germ
theory a fee bought care, not a cure. For kin they offer sitting with them or
sending for the healer. The `care` command and the body panel expose the same
treatments. A card's `risk` effect can start an illness. Illness wears health
down and costs up to half of strength, agility and endurance
(`engine.stats()`).

**Hazards.** Drowning, falls and rock falls are choices on hazard cards
(`src/content/cards/hazards.ts`, filtered by trade), not silent rolls.

## Body and danger

New worlds pin `manifest.survival = 1`:

- Hunger rises about two points per game hour, and eating uses carried food.
- High hunger and fatigue reduce physical ability.
- After two full days at maximum hunger, health wears down.
- Sheltered sleep restores fatigue. There is no thirst upkeep.

`src/core/danger.ts` rates the ground nearby from buildings, cover, people,
guards and darkness. A robbery is a choice card: surrender, run or resist. It
has a one-day cooldown. NPCs defend themselves and can retaliate after
serious provocation, with a visible threat first.

## Death and going on

When the player dies, in a day or in the years, `DeathCard.tsx` names the
cause, age, place and year. The player then chooses:

- **Go on as** one of the household aged twelve or more: the `become`
  command, which swaps identity and carries the household, plot and record.
- **Close this life**.

## A baby on the back

`src/core/baby.ts`: an infant carried by a parent, with mood and needs
(milk, wet, tired, startled, bored). It reacts to motion and rain and can be
nursed. The carrying cloth comes from `infantCarry` in the wardrobe.

## Bonds and concerns

- **Bonds** (`state.bonds`, `src/core/bonds.ts`): someone the player loves, a
  match being arranged, a rival in the trade, an estranged sibling. Absent
  family and recent deaths come from household history.
- **Concerns** (`src/core/concerns.ts`) score every fact above, plus
  household events (widowed, newly married, a new baby), for urgency. The
  opening card's second sentence takes the top one. A belief counts only
  where it collides with the plot.

## Legacy, do not extend

Manifests without `survival` or `disease` keep the older rules: a fixed
illness course set at onset, and plot cast exempt from illness. Extend only
the `disease: 1` and `survival: 1` paths. Retiring the old branches is welcome
when you work here.

## Not built

- Conditions that change play (hearing, sight, gait).
- Pregnancy as state.
- Burial of the dead. Graveyards are scenery props (`graveMound`), and
  `src/core/remains.ts` is animal remains.
- Mourning.

## Checks

`tests/core.test.ts`, `tests/combat.test.ts`, `tests/baby.test.ts`.
