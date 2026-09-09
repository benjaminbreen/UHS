# Contextual character generation

New procedural worlds pin `characterRevision: 1` in their setting. Players, settlement adults and household members use the same deterministic content pipeline. Existing unpinned inputs retain the earlier path; the unrestricted character art lab and explicit customized appearances remain separate.

## Ownership and flow

`src/content/characters/context-types.ts` defines small flat content contracts. `profiles/names.ts` owns bounded naming samples; `profiles/communities.ts` owns community scenarios and reusable appearance palettes; `livelihoods.ts` owns shared activity/supply kits. `resolve.ts` selects by exact year, geographic bounds, culture context and optional structured community. `validate.ts` checks references and evidence on load. Equal-specificity conflicts fail rather than depending on file order.

`generate.ts` samples stable independent streams addressed by world seed, actor ID and purpose. Changing a role does not reroll a face or name. Names, initial supply eligibility, appearance and provenance use one resolved context. No model calls or per-frame generation are involved. Geography caches by resolved character profile as well as settlement context, so crossing a profile boundary cannot reuse the previous population defaults.

Settlement planning selects eligible livelihoods and assigns fields/pens to the relevant owners. An NPC without an actual field/pen falls back to gathering. Household members currently participate as gatherers, with children retaining their life-stage label; they do not independently acquire invented farming/herding workplaces. Existing reciprocal household relations and age generation remain. Specialized work, learning, obligations and a full life-history generator are still future work.

The player role can retain an explicitly requested specialized scenario label (for example Legionary), with an origin note explaining that specialized mechanics are not implemented. Known but ineligible livelihood requests resolve to a supported activity. Starting inventory is filtered through the local allowed-item list, and household/market store inputs are filtered as well. This is not a complete regional economy or a comprehensive prop/crop availability audit. Generic `tool`, `grain`, `wool` and other current item IDs remain coarse gameplay proxies.

`Actor.origin` records the selected community/profile, naming kit, livelihood and qualifications. Visible NPC observations expose this content provenance. The start preview says “Invented name” for uncovered naming contexts, with a tooltip explaining the fictional treatment; internal profile/fallback labels stay out of the start card. Source-qualified content is also attached to the pack's existing evidence list. The detailed character modal is not implemented.

## Initial coverage and interpretation

- Congo Basin 1000–1800: dark complexion and dark hair art range; conservative shared livelihood/item choices. Wider dates and geography extrapolate beyond the cited Central African context. Local names remain unresearched; the game uses explicitly invented personal names.
- Australian interior before 1788: locally scoped dark complexion/dark hair default and gathering/hunting/craft scenarios. No Roman names, sheep-derived wool, coins or existing wheat-based starting goods. Excluding those wheat assets does **not** claim that Aboriginal seed processing or baking was absent. The compact wardrobe is schematic and very early dates remain speculative.
- Virginia: an explicitly selected English colonial starting community in 1607–1750 uses a light complexion palette with variation. Indigenous and African-descended starting-community choices use distinct profiles, with dates and limitations. This does not model Virginia's population shares, settlement boundaries, legal status, or claim that all residents belonged to one community. A free-text community hint can select the same structured contexts; an explicit choice wins.
- Small regional naming samples cover Roman Italy and portions of medieval/early modern England, France and Italy, plus English colonial Virginia. Modernized single display names are not full historical naming systems, gender assignments or recovered biographies. Geographic boxes are approximate and leave gaps deliberately rather than pretending to be historical borders.
- Broader regional palettes and rural activity sets are explicitly fictional fallback art/gameplay choices. They are not researched universal coverage. Missing local naming content uses deterministic invented names from `invented-name.ts`. The shared syllable set is not attributed to any historical language and is never described as an authentic local name or translation. This is a playable fictional treatment, not a substitute for expanding researched coverage.

Palette weights are art direction, not measured historical population probabilities. Community selection never determines personality, strength or skill. Grey hair can arise from the existing elder age rule. Individual appearance customization wins over generated defaults.

## Extension

Add a real, scoped kit/profile to the relevant subject file (split regional files as coverage grows). Supply exact applicability, evidence status, sources where nonfictional, and limitations. Reuse appearance and livelihood definitions rather than copying a complete character for every era. Name and community scopes use AND across fields, OR within lists, and half-open year ranges. Do not alter the twelve global eras.

Do not add a narrow historical label to a broad gameplay proxy without recording the distinction. Detailed beliefs, social institutions, mixtures within settlements, named languages and obligations need their own supported data/mechanics.

## Verification

`tests/character-generation.test.ts` checks featured starts, scoped names and palettes, deterministic streams, community distinctions and inventory/activity eligibility. `tests/browser/character-context.spec.ts` launches Congo, Australia and Virginia through the real setup and worker/runtime path, checks visible player/NPC appearance and provenance, exercises the community selector, and captures game screenshots under `artifacts/characters/context-*.png`. Focused settlement checks exercise reachable layouts and livestock behavior. Save restoration is not the focus of this change.

## Naming conventions (added during review)

A personal name is not assumed to be a single word, and a family name is not assumed to exist. Name kits declare `personal`, `family-personal`, `personal-family`, `personal-two-families`, or `personal-patronymic` format. Components retain their internal spaces. A patronymic is rendered as a parent-derived display element and is never inherited as a family name. `name-kits.ts` only assembles regional modules. Origins retain the selected format and generated family components where that convention actually uses families; custom names are preserved without attempting to parse a surname from their last word.

Burmese interior 1350 now has an explicitly hypothetical continuity reconstruction using complete personal names, with no hereditary surname or extracted honorific. Later Burmese coverage is inferred from modern naming scholarship. Central/eastern Chinese coverage uses family-first order with modern Pinyin as a display convention and openly reconstructed earlier components; it does not implement generation poems or naming taboos. Central Spanish modern scenarios use two family components with qualified source/date coverage. These are bounded samples, not exhaustive national naming systems.

For children, supported family-first profiles inherit a parent's family component, and two-family profiles inherit one component from each generated parent. Partners retain independently generated names. Parent ordering is the household prototype's ordering, not a claim of paternal/maternal lineage. Gender-specific names and full historical kinship/naming rules remain further authoring work.

The sidebar portrait and nearby-person icons now use the world character painter and actual appearance recipe. They no longer display legacy atlas complexions. The old automatic “0 obsidian flakes” wealth display is omitted for contextual characters without a currency. Evidence cards distinguish fictional choices, hypotheses, inference and documented claims.
