# Lives: conditions, illness, bonds and concerns

Status: building, October 2026. What the opening card says about a person
comes from here, and later plots read the same facts.

## Why

The opening card's second sentence ("You are Teriʻi, twenty-two, and …")
needs the one or two most pressing or remarkable things about a life. Belief
stances are for the Beliefs tab; they read as cryptic here. The facts that
make a life particular are bodily, familial and local: a sister with a fever,
a son gone to sea, someone you hope to marry, hearing lost to a childhood
illness.

Story first. Conditions do not change play yet (hearing, sight, gait); that
is a later pass.

## Four layers

1. **Conditions** (`src/content/health/conditions.ts`, `src/core/health.ts`).
   Lasting: hearing loss, poor sight, cataract, colour-blindness, a limp, a
   clubfoot, missing fingers, smallpox scars, goitre, recurring malaria,
   consumption, the falling sickness, melancholy, a stammer, rickets, Nile
   bilharzia. Each has a rate by age, sex, era and place, a period name with
   a modern gloss, and plain lines. Derived from the seed like stats, so every
   resident has them at no storage cost. Rates are realistic: before modern
   medicine a large share of adults had something; the card mentions one only
   when it outranks everything else. No slurs; period terms that are not slurs
   ("the falling sickness") with the modern name in the gloss.
2. **Ailments** (`src/content/health/ailments.ts`). Acute and stateful in
   `state.ailments`: fevers, the flux, coughs, childbed, smallpox, measles,
   plague in plague years, broken bones. Seasonal and regional, more for the
   young and the old. Each has a course fixed at onset (mend, linger, die)
   that the player can turn by sitting with the sick. The sick stay home,
   laid up. A death removes the person, writes `died` into the household's
   history, and shows a turn card. Plot cast are never killed by illness.
3. **Bonds** (`state.bonds`, `src/core/bonds.ts`). From the player outward:
   someone they love (mutual or not; same-sex love exists and is usually
   unspoken, open only where the culture made room for it, as among Greek
   men in the classical period), a match being arranged, a rival in the same
   trade, an estranged sibling. Absent family and recent deaths come from the
   household's history, given reasons by era and place.
4. **Concerns** (`src/core/concerns.ts`). Every fact above, plus the
   household events the intro already used (widowed, newly come, newly
   married, a new baby), scored for urgency. The intro's second sentence takes
   the top one; a life without a plot may take the second for its second
   paragraph. A belief is a concern only where it collides with the plot
   (usury called theft, while in debt). The rare line takes the rarest
   condition or stat.

## Later

Play effects of conditions; pregnancy and childbirth as state; plots chosen
by concern (a sick child makes the Mending or the Hungry Season likelier);
burials and remains; the bereaved mourning.
