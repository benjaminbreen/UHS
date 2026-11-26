# History: eras, cultures and dated content

How the game knows when and where it is, and how historical content is scoped
to a place and date. Code: `src/content/history/`, with the scope type in
`src/content/characters/context-types.ts`.

## Eras

The twelve eras in `src/content/history/dates.ts` are settled. They are
chronological bands for picking a baseline, not a worldwide technology ladder.
Refine history inside an era with scoped dates, never by adding or moving eras.

| ID | Range |
| --- | --- |
| `deep-prehistory` | to 10,000 BCE |
| `early-holocene` | 10,000–3500 BCE |
| `early-historical` | 3500–1000 BCE |
| `antiquity` | 1000 BCE–500 CE |
| `early-middle` | 500–1000 |
| `later-middle` | 1000–1500 |
| `early-modern` | 1500–1750 |
| `1750-1850`, `1850-1914`, `1914-1945`, `1945-1990` | as named |
| `contemporary` | 1990–2060 |

The history is written up to `PRESENT_YEAR` (2026) in `dates.ts`. Years after
it, to `LAST_YEAR` (2060), are projection: a player gets there by naming the year,
"the 2050s" or "the near future", never from a random start. A range that holds
now ends at `10001`, not at the current year, so it carries on into the
projection; give it a real end year only when something is expected to stop it.
Rankers that prefer the narrower range measure it with `knownSpan`, so an open
end does not make an entry look broad. Projected content says so in a comment
or `note`, the way inference does.

Years are astronomical: `0` is 1 BCE, `-6499` is 6500 BCE. Use `bce(6500)` from
`dates.ts`, not hand-written negative arithmetic. Ranges are `[start, end)`.

## Cultural families

Twelve broad families (`cultures` in `src/content/history/types.ts`) organise
reusable art, music and authoring conventions. They are production budgets,
not ethnic identities or map zones. Place, date and community decide what
actually appears; a family alone never generates a setting.

European · North African & West Asian · Inner Eurasian · South Asian · East
Asian · Southeast Asian · West & Central African · East & Southern African ·
Mesoamerican · Andean · Other Indigenous American · Australian & Pacific.

The last two are the loosest groupings and need the strongest local
distinctions. Do not derive identity from coordinates alone, and do not treat
"Neolithic", "industrial" or "nomadic" as a substitute for a local profile.

## Scoping content to a place and date

Most dated content is a list of records, each with a `CharacterScope`
(`years`, optional `cultures`, `places`, `bounds` boxes, `except`,
`communities`), filtered by `matchesCharacterScope` in
`src/content/characters/resolve.ts`. Wardrobe, names, beliefs, venues,
household practices, products, fauna looks, tidings, deaths and law all use it. **This is the system to extend** when you
add dated content: put records in a subject or regional file and give each a
scope.

Files in `src/content/history/` built this way:

- `deaths.ts`: causes of death by place and date, for the years.
- `households.ts`: who marries whom, at what age, and where the couple lives.
- `tidings.ts`: one-line news of the wider world; after 2026 only trends, no named events or people. `talkOf` hands the same lines (or World Weaver's) to NPC dialogue as common talk.
- `order.ts`: who keeps order and what penalties they use (engine, plots,
  dialogue).
- `languages/`: what language people speak, by region and date (narrator).
- `time/italy.ts`: dated place names for the time-travel arrival.

Consumers include `src/core/time/years.ts`, `src/core/intro.ts`,
`src/core/plot.ts`, `src/narrator/dialogue.ts` and the audio theme pickers.

## The history registry

`resolveHistory(historyRegistry, { culture, place, date })` in `resolve.ts` is
an older, more formal resolver: definitions, selections, kits, places, rules
and qualified facts (`types.ts`). Rules apply baseline → regional → local; a
more local selection replaces the whole record, and equal-specificity
collisions fail. It is used by prop selection (`src/content/props/selection.ts`),
the pack adapter (`src/content/geography/pack.ts`) and `/history-lab`
(`src/dev/HistoryLab.tsx`). Its profiles (`profiles/playable.ts`,
`profiles/research.ts`) cover only the two original packs and two studies.

The registry and `CharacterScope` overlap. Do not grow the registry for new
subjects. If you are working on prop selection, moving it onto scoped records
and retiring the registry is welcome.

## Evidence

Every claim carries one of four statuses (`Evidence` in `types.ts`, mirrored in
the UI):

- **documented**: directly supported by a cited source.
- **inferred**: a stated extension of evidence, such as a regional practice
  applied to an invented household.
- **hypothesis**: a contested reconstruction. Cite the theory and keep
  alternatives.
- **fictional**: an authoring choice or gap-filler.

Bold hypotheses are wanted, including prehistoric languages and religion.
Label them; never present them as attested. Prevalence labels are author
judgement, not percentages.

## Legacy, do not extend

- `src/content/legacy-packs.ts`: frozen inputs of the two original packs
  (Rome 100 CE, Konya), exposed through `catalog.ts` and `playable.ts`. Leave
  them as they are.

## Checks

- `/history-lab`: browse any family, era, exact date and place.
- `tests/history.test.ts`.
