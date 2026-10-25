## Fishing as a general system — October 18, 2026

`src/content/economy/fishing.ts` works out how a household fishes from the
place and date instead of from a regional profile: craft from climate and tools
(rafts and bundles before dugouts, reed where shores lack timber, bark and skin
in the north, plank boats after metal tools), method from the water and era
(nets from the Mesolithic, seines in rivers, lines at sea), drawn per household
so one landing mixes methods. Worksite revision 7 gives any watered settlement a
`fishing-landing` waterfront; the three researched profiles still win where they
apply, and peoples with their own village form (ring villages, plank-house rows)
keep it. Buildings and boats use the existing art as stand-ins.

Household heads take the boat out: their routine has a water leg to one of the
household's fishing grounds, they are drawn kneeling or seated in the hull, and
the moored boat leaves its berth meanwhile. The player's fishing day is gear,
grounds and landing: "Take the boat out" at the water's edge, paddle to the
grounds, fish, row back. The catch scales with season, hour and the day's luck,
and says why. Cities only route a budgeted share of residents, so some boats
stay moored there.

## Distinct household equipment forms — October 18, 2026

Both reviewed forms now ship as twelve separately named objects: clay tannur
and banked oven, brick/iron and clay/brass kettle stoves, bronze bowl and vented
iron braziers, raised and woven hen shelters, rail and wattle pens, and vise
and low planing benches. Regional/date eligibility selects among appropriate
forms. Native sprites preserve the approved player-relative scale, outlines,
fire animation, pivots and six lighting masks. Indoor workshop fixtures use
the selected sprite; both benches support woodwork. Outdoor placement avoids
building footprints. Prepared-world revision 33 refreshes generated scenes.

Generated indoor and outdoor examples were visually checked at
`artifacts/scenery-review/distinct-equipment-inside.png` and
`artifacts/scenery-review/distinct-equipment-outside-congo.png`.
All 28 prop checks and both extended baking checks pass; the default suite
passes 995 tests. Hanging signs no longer disappear because an actor starts
beneath their intended position.

## Household and workshop equipment — October 18, 2026

The reviewed hearth, oven, pottery kiln, bloomery, press and trough now replace
their shipped atlas frames. B is the baseline; three-stone hearths use C, and
brick ovens/kilns, stone-clad furnaces, screw presses and stone troughs use
bounded regional/date selection. Existing frame names retain the new art in
saved scenes. Expanded placement clearances use prepared-world revision 32.
Fires keep their animation; kilns gain ember motion. Native pivots and all six
lighting masks follow the larger shapes. The normal prop build includes the
painters, with `--equipment-only` available for a targeted atlas refresh.

Twenty-five prop checks pass, including Belgrade's ordinary shared-oven path,
variant boundaries, retained inventory/ownership, animation frames and shadows.
A generated Belgrade 1350 scene was visually checked at
`artifacts/scenery-review/equipment-installed-belgrade.png`.

## Second regional container batch — October 18, 2026

The twelve approved B sprites now ship as native container props: Egyptian and
Canaanite jars, painted northwest Chinese pottery, a coiled grain hamper,
Mexican olla, Andean sack, parfleche, Pacific leaf basket, raised woven grain
bin, stoneware crock, glass demijohn and reused kerosene tin. Regional and date
windows include appropriate port trade and later continuations. Early plain
basketry and sack coverage is explicitly treated as reconstruction.

The existing indoor furniture, household stores, yards and portable-object
rendering use the same definitions. Substitutions retain goods and ownership;
the grain bin stays nonportable. Prepared-world revision 31 refreshes generated
areas without rewriting saved furnishings. Both batches are included in the
normal art build, with native pivots and all six lighting masks.

All twelve atlas crops match the approved review images. Indoor/outdoor selection
and historical boundary checks pass; the project gate passes with 980 tests,
typechecking and production build. Generated-game captures were reviewed at
`artifacts/scenery-review/containers-batch2-installed-inside.png` and
`artifacts/scenery-review/containers-batch2-installed-outside.png`.

## Directional Nile reed skiff — October 18, 2026

The Middle Kingdom Nile fishing profile now uses an eight-direction reed skiff
through the same watercraft catalog as the Japanese and northern wooden boats.
Five compressed bundles, doubled transverse lashings, bound tips, visible knots,
a small reed working mat and two stowed wooden paddles distinguish its construction.
The northeast view has authored cord and knot finishing on the projected guide.
Olive-gold, sun-dried and weathered/rebound variants retain their finish as the
boat turns or switches between moored and occupied art. The rebound variant
adds a binding and retied cord; these material and repair treatments are
reconstructions, informed by the profile's Middle Kingdom model and relief sources.

The catalog supplies a kneeling posture and deck height for the reed craft.
Crew height moves the person above a stable waterline instead of shifting the
boat beneath them, and survives scene redraws and restores on leaving.
Japanese and clinker sprite pixels are unchanged. Existing Nile date, region,
revision and freshwater restrictions remain in the settlement planner.

Twenty-four Nile views and 72 packed full/front/back frames were checked for
repeatability, exact reconstruction, consistent pivots, clipping and overlapping
crew layers. All pass the shared palette, tinted-outline and no-dithering checks.
Seventeen water-rendering tests and five targeted Nile/profile checks pass.
The project gate passes: 979 tests, typechecking and production build.
A real game capture verifies all eight loaded headings, kneeling frames and three
completed movement commands. Captures: `artifacts/boats/nile-eight-directions.png`,
`artifacts/boats/nile-skiff-afloat-ne.png`,
`artifacts/boats/nile-skiff-waterfront-wide.png`.
Occupied captures exercise the existing afloat mode; boarding and animated
paddle strokes are not added by this art integration.

## Late Edo and Middle Kingdom fishing waterfronts — October 17, 2026

Worksite revision 6 adds two bounded regional reconstructions: late Edo Japanese
inshore fishing (1750–1867) and Middle Kingdom Nile fishing (2100–1651 BCE).
Sixteen new forms share the architectural materials, solid hull projection and
adult scale: timber/thatch shore buildings, mudbrick and reed-mat buildings,
plank-built transom skiffs and lashed reed skiffs in four bearings, net rails,
low seine pegs, shallow sorting trays and a reed sorting mat. Gear interiors
follow the building: timber/planks or reed/earth with an open entrance. Watercraft
are explicitly marked in the graphics catalog, excluding low floating hulls from
upright building shadows and bank reflections.

Profiles now supply equipment names, descriptions and shore work, including seine
hauling and catch distribution for the Nile set. Nile reed craft require river
or lake water. The same planner handles all three traditions; no culture branches
were added to the renderer. Player ownership recognises the underlying fishing
occupation after regional naming, instead of relying only on the word "Fisher".
Catch-basket placement tries several clear pockets in revision 6. Earlier pinned
revisions retain their content; prepared-world cache version is 27.

The profiles distinguish documented practices and boat evidence from reconstructed
ordinary shore buildings. Boats remain moored objects and catch stock uses the
existing household economy; offshore voyages and individual net deployments are
not simulated.

The art audit is clean (324 front buildings, 30 ramps), and the atlas was rebuilt.
The full project gate passes: 970 tests, typechecking and production build.
Eighteen targeted checks pass: all four shore bearings for all three sets,
regional/date/revision exclusions, rejection of a sea berth for the Nile craft,
and playable agent starts in Bergen 1500/1700, London 1650, Edo 1800 and the Nile
valley 2000 BCE. These check ownership, production, real walking routes and basket
carrying, retained equipment and appropriate gear interiors. The constrained Edo
shore fits one household; the Nile case fits two. Actual game captures:
`artifacts/waterfront-edo-1800.png`, `artifacts/waterfront-nile-2000-bce.png`.

## Regional storage and carrying vessels — October 17, 2026

The twelve approved B container drawings now ship at native scale with six
shadow phases each. Household, yard and work kits select regional forms;
furnished rooms and carried props use the same sprites. Existing goods and
ownership survive storage substitutions. Shared waterskins include inferred
Neolithic Old World coverage, while specific vessels use narrower date/place
windows and appropriate traditional containers persist alongside modern goods.
Prepared-world cache version is 30. Review captures:
`artifacts/scenery-review/containers-installed-outside.png` and
`artifacts/scenery-review/containers-installed-inside.png`.

## Fresh-catch landings and shared waterfronts — October 17, 2026

Worksite revision 5 moves fresh-fish sorting beside the landing and connects
homes, gear stores and net repair through a shared working frontage. Fishers
collect gear, receive catches, visibly carry baskets to the table, sort and sell
fresh fish, then put gear away. Household catch stock still uses the existing
economy; individual boat voyages and preservation industries are not simulated.
Existing shoreline tiers determine beach approaches or timber steps.

Placement searches for room for neighbouring fishing households before accepting
an isolated plot. Component reservations leave shared frontage accessible; scaled
settlement fringe claims prevent overlap with neighbouring industrial launchways.
The active coastal scene includes outlying homes and work areas. Revision 4 keeps
its original layout and routines; prepared-world cache version is 26.

The full project gate passes (929 tests, typechecking and production build).
Twenty-five targeted checks cover four shore bearings, agent travel, actual carried
baskets, household stock and workplaces across historical contexts. Identical seeds
reduce landing-to-table routes from 36 to 12 paces in Bergen 1500, 42 to 12 in
Bergen 1700, and 53 to 10 in London 1650. Actual game captures:
`artifacts/working-landing-bergen-1700.png` and
`artifacts/working-landing-london-1650.png`.

## Fishing waterfront households — October 17, 2026

Worksite revision 4 adds a reconstructed northern European fishing waterfront,
1400–1849. The shared shore planner groups up to three households near a repair
yard, tries compact setbacks first, and accepts fewer where the coast is
constrained. Homes and dry gear stores stay on land; owned clinker rowing boats
receive clear water berths. Landing routes, net repair and catch handling belong
to the same households, with two fishing jobs per boat and fish production through
the existing economy. Drinking water comes from the settlement, not the landing.
Ordinary shore fishing remains available outside these boat-owning households.

Eight new forms use the shared architectural materials and solid hull projection:
a cottage, gear store, net frame, sorting table and four boat bearings. Authored
worksite containers survive the generic furnishing pass. Local workplace context
now also reaches player-household generation, keeping its production consistent
with the assigned job. Prepared-world cache version is 25; older worksite
revisions retain their behavior.

Checks cover all shore bearings, dry buildings, wet berths, ownership, reachable
work stations, household fish production and actual retained equipment in Bergen
1500/1700 and London 1650. Art audit: clean, 308 buildings. Main gate passes 921 tests, typechecking and
the production build. Review captures:
`artifacts/fishing-bergen-1700-district.png`, `artifacts/fishing-bergen-1700-close.png`,
`artifacts/fishing-london-1650-close.png`. Boats are moored objects; offshore
voyages and regional preservation industries remain future work.

## Shoreline placement and the first boatyard — October 17, 2026

Worksite revision 3 adds shoreline compounds with a continuous dry working
approach, clear launching lane and open-water clearance. Placement considers
all four bearings, keeps buildings on dry ground and rejects narrow channels,
obstructions, cliff banks and falls. Existing shoreline heights are preserved;
small steps across a launching lane receive timber ramps. Working paths connect
the stocks to the settlement, with cleared aprons rather than a bare rectangular
compound. Prepared-world cache version is 24; revisions 1 and 2 keep their profiles.

The first authored profile is a reconstructed northern European small boatyard,
1400–1849: an open timber workshop, covered plank rack, separate store, clinker
hull on braced stocks and timber launching runners. The hull's outer planking,
inner frames, keel and supports share a depth buffer. The one form is scoped by
date and region; shoreline logic does not depend on those choices. Placed
capacity supplies boatwright jobs and a boat-specific workday. In revision 3,
actual waterside workplaces can satisfy water-dependent occupations even where
the broad setting lacks a water label.

Verification covers all four bearings and sea/river/lake shores, rejected sites,
staffing, reachable workplaces and every terrain step beyond the stocks toward
the water in London 1450/1650 and Bergen 1500/1800. Actual game captures:
`artifacts/boatyard-london-1450.png`, `artifacts/boatyard-bergen-1500.png`.
The front audit is clean (300 buildings); all seven new art parts match their
baked pixels and pivots. The main gate passes 909 tests, typechecking and the
production build, plus 12 focused placement, employment and workday checks.
Further regional forms await visual review.

## Processing workplaces — October 17, 2026

Potters, brickmakers, lime burners, dyers, fullers and tanners now use placed
work compounds, with 11 dated regional profiles and 10 new sprite forms.
Kilns and clamps stand beyond the dense core; wet-processing yards need fresh
river water. A small seeded selection supplies actual job capacity. Domestic
weaving and leatherworking remain independent. Regions without authored processing
profiles retain their existing domestic crafts rather than losing those professions. Processing facilities require worksite revision 2;
prepared-world cache version is 20.

The six trades have their own workday steps and stations instead of borrowing
household weaving. Resident starts keep a housing lot when venues compete for
scarce frontage; unavailable requested specialist jobs fall back to local work.
The art shares the existing projection, materials, roofs and fittings, including
curved kiln masonry, recessed pits, stave-built vats and regional pottery sheds.
Verified captures: `artifacts/processing-rome.png`, `processing-oaxaca.png`,
`processing-kyoto.png`, `processing-dyehouse.png`, `processing-tannery.png`,
`processing-fullery.png`, `processing-brickyard.png`, `processing-limeworks.png`.

Verification: 903 main tests, typechecking and production build pass, plus 17
workplace/access checks across historical starts and controlled river sites.
The front audit is clean (293 buildings); all 32 packed worksite sprites match
their painters byte for byte.

## Historical work compounds — October 17, 2026

Mills, mines and hospitals now have 18 dated regional profiles and 22 building
sprites, with service outbuildings, reserved yards and reachable workplaces.
Siting distinguishes urban institutions, peripheral compounds and water-powered
mills requiring a real river. Mines require a supported mining district; actual
placed capacity and accepted roles govern employment. Hospitals have dated
regional finishes, beds or mats, and monastic patient cells. Profiles record
sources and distinguish reconstructed buildings from documented evidence.

Worksite art uses its own paged atlas and cast shadows. New-world worksite
revision is 1; prepared-world cache version is 18. Verification includes 11 agent
starts, six positive workplace/access cases, controlled river placement and urban
non-overlap checks. The main gate passes 893 tests, typechecking and the production
build; the front art audit is clean (283 buildings). Review assets: `artifacts/worksites-art.png`,
`artifacts/interiors/worksites.png`, and
`artifacts/occupations/worksite-readouts.txt`.

## Classical buildings and surviving towers — October 7, 2026

The approved native kit is baked: 59 building variants (236 facing frames), with
nine regional tower styles, one to three storeys, classical insula street forms,
and Greek, Roman, Isis and Hadad shrine palettes. Regional date rules select
these beside the existing buildings; shrines retain their religious date limits.
Later European, Anatolian, Maghrebi and Iranian cities retain one historic tower
near their old core or public square, including nineteenth- and twentieth-century
settings. Walled towns can carry a lookout and a small gate storehouse.

Native lamps, wells, fountains, benches, planters and storage vessels use the
existing placement and prop behavior. Tower thresholds match the painted doors;
open statue shrines have no animated wooden leaf over the statue. Prepared-world
cache version is 14. Live captures: `artifacts/classical-native/rome-game.png`,
`alexandria-200-game.png`, and `istanbul-1920-game.png`. Regional specs live in
`src/content/graphics/mediterranean-buildings.json`. All 779 unit tests and the
production build pass with the test pool limited to two workers; front/oblique
audits and a byte comparison of all 59 baked base sprites against their painters
are clean.

## Modern city reference — September 27, 2026

Moscow 1975, seed `world-modern-square-review`, is the fixed in-game reference
for modern city work. Open `/?start=A%20traveler%20in%20Moscow%2C%201975%20CE&seed=world-modern-square-review`
and press Begin, then Enter life. The square has a larger clock-fronted hall,
coherent tenement frontages and municipal furniture. Parks reserve their ground
before infill. Industrial blocks have brick works, shed ranges, loading bays,
service access and wire fences with open gates. Street fragments reconnect
before parcels are placed; diagonal roads share continuous asphalt/curb geometry.
The prepared-world cache is version 12.

Judge changes in-game at the same seed and 1.25× zoom. Use the existing shot tool:
`UHS_SEED=modern-square-review UHS_ZOOM=1.25 UHS_AT=0,-3 npm run shot -- artifacts/modern-city-review/showpiece-square.png 'A traveler in Moscow, 1975 CE'`.
Other reference cameras: diagonal street `65,53`, park `22,-73`, factories
`-117,69`. Keep park paths, factory gates and building entrances usable; crossing
paint must land on a clear footway. The street and urban tests cover those layout
contracts, but a green suite does not replace reviewing these four views.

## Modern oblique gold masters — September 26, 2026

The first oblique buildings for the industrial and modern city: a brick
commercial block of about 1895 (three sizes), a sawtooth weaving shed with its
mill stack (two), and a curtain-wall office tower of about 1960 (five, nine and
fourteen storeys). They stand on commercial, industrial and downtown blocks by
region and date (`src/content/settlements/modern-buildings.ts`), pack to their
own `modern-buildings` atlas page, and ship a painted lit-room frame the scene
uses after dark. Stations have platforms, rivers are bridged by the railway,
and traffic signals cycle. See `OBLIQUE_ART.md`.

## Street paint and parked cars — September 26, 2026

Motor-age streets are wide enough to drive and park on and are painted in the
style of their place and date: centre lines, crossings, stop lines on the
driving side, gutters with drains, manholes, parking stalls, scored
sidewalks; country roads are blacktop. Nineteen period cars, from a 1915
touring car to a 2010 SUV by way of the Beetle, the Mini, the Volga, the
Ambassador and the kei car, park by region and date, drawn from 3D models so
all four headings share one light. See `SETTLEMENTS.md` and `PROP_ART.md`.
Also now: dated regional road surfaces (setts, brick, concrete, asphalt),
tram rails on large cities' arterials, boulevards with planted medians,
rounded kerbs with tactile paving at crossings, period traffic signals and
signs, a railway through every industrial-age town with level crossings and a
station, and blacktop country roads with centre lines, ditches and wired
utility poles.

## Industrial-age city layout — September 26, 2026

Phase 1 of the modern city revamp. Cities after their region's industrial
onset are zoned: a rebuilt downtown, a factory sector toward the water, and
rings of housing in the idiom of each ring's date (terraces, tenements,
suburbs, estates, self-built quarters) by region. Motor-age cities sprawl into
the corners of their extent, and open-air market fields give way to shops.
Modern fabrics now exist for Japan, the Soviet bloc, South Asia, North Africa
and West Asia, sub-Saharan Africa, Southeast Asia, Latin America and
Australasia; before this each fell through to the generic fabric. A 1980 mill
or cannery town such as Sitka is built as a town, not a medieval village, and a
tile inside a metropolis takes the metropolis's size. See `SETTLEMENTS.md`.
Buildings still use the existing flat-front modern kit; the oblique redraw,
street cross-sections, furniture, parked cars and animation are later phases.

## Daily agendas: occasions, holidays and commissions — September 26, 2026

Each person's day now carries one or two occasions beside their work, picked
from what is true of them that day: anniversaries in the household's history,
their patron and observance, a power whose domain matches their trade, kin and
their ages, a marriage being sought, fortune, rank, personality and outlook,
and calendar cycles (Kalends, nundinae, the seven-day week, the five- and
four-day market weeks). The life aim weighs up the occasions that serve it.
Content is scoped and sourced in `src/content/days/`; general stand-ins are
discounted where a scope has named ones. Documented rest days (Sunday,
Christmas, Saturnalia, Qingming, the Chinese New Year) take the work out of
every routine and bring the settlement to the church, square or graves.

NPC routines are rebuilt per day, swapped only while the resident is at home;
one-off errands are walked once at their hour. The player's sidebar goals and
the character modal read the same agenda, and the modal marks each occasion
documented, inferred or hypothesis. Workshop and market work names a client.
The generic tavern is now scoped to Europe, West Asia and North Africa.

Regional content now covers every region the belief systems do, 628
occasions and 116 festivals: palaeolithic foragers to the 1940s across Europe,
West Asia, Egypt and the Maghreb, sub-Saharan Africa, South, East and
Southeast Asia, the Pacific and Australia, Inner Eurasia, Mesoamerica, the
Andes, and indigenous and settler North and South America. Moveable lunar
feasts sit on a representative date, said in their notes.

## Continuous atlas-tile travel and journeys — September 24, 2026

Neighbouring maps are now adjacent 384-tile squares of the atlas, so coasts and
rivers continue across every border and crossing lands at the matching point.
Distant places are reached by choosing a destination on the Earth map, which
routes the trip and passes the days. Maps are named for the town, river or
region they contain. Details and naming rules are in `TRAVEL.md`. Border checks
on Luzon, Patna and Istanbul found at most one land/water disagreement in 912
cells; the old H3 backbone names and their generation scripts are removed.

## Compact freestanding signage — September 21, 2026

New worlds pin signage revision 1 and use seven small frame styles with sixteen
shared trade/function glyphs. The 21×37px sprites replace the oversized hanging
boards in new settlements; the panel carries one bold mark, with restrained
edge light and no decorative clutter. Regional selection covers medieval oak,
early-modern painted boards, industrial enamel, East Asian lacquer, Japanese
split cloth, southern pennants and bazaar cloth. These are explicit game
interpretations. Sacred markers remain locally scoped; camps, farms and
ancient streets do not receive medieval hanging posts.

Placement anchors at the post foot, reserves space for the panel, keeps door
approaches clear, and spaces optional shop signs apart. Asian signs now identify
the trade instead of randomly mixing regional boards. Civic and indoor public
venues use functional glyphs. Existing settings and all old sprite keys remain
available; no save migration or renderer-specific culture logic was added.

Actual sprite proof: `artifacts/signage-concepts/implemented-signposts.png`.
Browser checks cover the gallery and generated London/Beijing scenes. Oblique
audit and prop compilation pass; no audit notes concern the new signs. The
focused signage tests and TypeScript check pass. Full `npm test`: 576 passed,
four failures matching the previously recorded character-stream, missing
portable-boulder, river-fixture and wardrobe-wording failures, plus the existing
Vitest worker-update timeout. Generated town sheets were reviewed before/after.

## Historical time travel — September 21, 2026

Change your world now opens a separate time dialog: choose a date within
±1,000 years, start a day/night passage, then meet a direct ancestor or
descendant and browse the intervening family line. New world retains its
existing setup dialog. The transition has original synthesized sound, a
Shakespeare quotation, keyboard isolation and reduced-motion treatment.

Deterministic site incarnations retain terrain and street alignments while
buildings are maintained, replaced or reduced to material-specific ruins.
Surviving wall sections control collision; burial, vegetation, roof loss and
charring are separate state. Abandoned pottery and wooden props have different
survival periods. Eligible dated venues replace earlier institutions on
occupied sites. Naples has sourced historical context and a scoped inferred
name kit. Optional server-side Luna prose summarizes committed changes with a
local fallback; it never controls history or physics. A browser review caught
and corrected the previously unrestricted Apprentice Printer label.

Time checkpoints are local to the current map and session. The family survives
walking between maps, but local temporal checkpoints do not. Whole-settlement
founding, growth, migration, intervention branches, durable history, weapons,
ignition and fire spread remain future work. See TIME.md for the architecture
and next steps. The generic ruin painter still needs partial roofs and more
building-specific silhouettes.

Validation: 10 focused tests pass; the desktop/mobile browser journey passes,
including date selection without mutation, family browsing and restoring the
original character. Live Luna narration was verified. Production build passes.
The full npm test run reports 571 passes, four failures reproduced on unchanged
HEAD, plus one world-v2 timeout and two worker-update timeouts under contention.
The world-v2 suite passes all four tests when rerun alone. Screenshots are in
artifacts/time-*.png. Rapid transitions also exposed a terrain-preview cleanup
bug; disposing their images with their textures resolved the WebGL failure.

## Courtyard depth and directional daylight — September 21, 2026

Regional courtyard houses now show recessed paving, rear and side inner walls,
wall-foot contact shade and openings facing the court. Tiled compounds have
separately pitched and textured roof ranges. The deeper roof view retains the
12px exterior return; house footprints, entrances and roof traversal cells are
unchanged. Sprite bounds, occlusion and the art version follow the new pixels.

The painter publishes presentation-only courtyard polygons. WorldScene uses
these with the existing six daylight presets: morning and afternoon shadows
fall from opposite sides, noon has a short cast, and night darkens the recess
without a solar shadow. Cloud cover weakens direct light. Composed textures are
shared by visible copies and released when unused, with no per-frame repainting.
The graphics lab courtyard study now compares Chinese, Korean, Indian and
Maghrebi houses under the same production renderer.

Validation: oblique audit, atlas build, TypeScript check, targeted graphics and
courtyard tests, and two browser tests pass. Before/after Beijing and Seoul
sheets were inspected. `npm test` reports 553 passes and four failures, all four
reproduced on unchanged HEAD: character role/hair independence, a missing
portable-boulder frame, a river fixture's missing `habitatAt`, and modern shirt
wording. That full run also reported one Vitest worker-update timeout. The older
six-preset browser test also fails on unchanged HEAD because it expects a
`human-` frame in the former character-shadow atlas; the new courtyard-specific
browser checks pass independently.

## Settlement evolution foundation — September 21, 2026

New worlds now use vegetation revision 7. Trees publish an oblique canopy
envelope and test that whole silhouette against buildings, roads and other
claimed space, rather than checking only the trunk or four arbitrary cells.
Settlement plans share three spatial claims—occupied, access and clearance—so
later props and features can use the same placement contract. Revision-6
manifests retain their prior tree placement.

Geography now exposes a deterministic `landPotentialAt` query derived from the
existing terrain, drainage and habitat fields. It keeps arable, pasture,
fishing, wild food, timber, reeds, clay, stone and mineral prospectivity
separate, with only convenience summaries for subsistence, materials and
buildability. It does not mistake environmental opportunity for actual stock,
production, price or ore evidence. Roads, plots, farmland parcels and places
also carry minimal stable lifecycle metadata. The baseline year dates the
generated snapshot rather than claiming construction dates. This lays the seam
for later paving, reuse, abandonment and ruin passes without adding a
speculative economy.

## Final roofline, parapet and lived-detail polish — September 21, 2026

The enlarged building families now use distinct roof craft instead of sharing
one decorative pass. Chinese profiles have wealth-gated raised ridge terminals;
Japanese roofs use round kawara-like ridge ends rather than Chinese beasts;
Korean substantial buildings gain restrained painted eave brackets; Bengali
and Malabar roofs separate curved terracotta edges from deep layered timber
fascia. European roofs have material-specific ridge work, pegged bargeboards,
occasional finials and prosperous early-modern chimney pots. Flat-roof profiles
now distinguish jointed Roman coping, stepped and rounded parapets, stone caps,
timber screens and open jali, with tiny corner kiosks only on elite north-Indian
terraces.

Weathering is deterministic and clustered—moss in damp tile courses, dust on
dry roofs, individual repaired European tiles and lashed thatch patches—so it
does not become visual noise. Facade-edge sockets add Korean storage jars,
East Asian ceramic planters, South Asian water pots, early-modern herb pots and
prehistoric baskets without blocking doors or the 12px return. Paired lanterns
and plaques are reserved for neighborhood halls; generic household shrines are
deliberately excluded. Published traversal surfaces and roof routes are
unchanged.

## Inhabited facades and regional service kits — September 21, 2026

The enlarged East Asian, South Asian, European and Neolithic masters now carry
deterministic social/detail tiers instead of receiving the same decoration at
every scale. Wall faces use stepped palette clusters for sky light and foot
shade. East Asian roofs have stronger tile courses, separately lit courtyard
ranges, raised eaves and wealth-gated ridge terminals or simplified roof
figures; prosperous gates gain brackets, lanterns and canopies while ordinary
compounds remain restrained. Early-modern European houses may carry individual
herb or flower troughs, but medieval and prehistoric houses do not. Neolithic
details are work details—drying grain, reeds or fish—not back-projected national
decoration.

East and South Asian packs also include four uncommon 5×3 service forms per
profile: storehouse or granary, craft building, gate or market pavilion, and a
small neighborhood or devotional hall. Medieval and early-modern European
packs now mix corresponding stores, workshops, market sheds and a bell-cote
hall; the early European farming kit gains raised storage, a work shed and a
small communal building. They reuse the regional construction grammar but have
distinct openings, shop fronts, communal roofs or entrance markers. Major
temples, mosques, churches, academies and administrative halls remain
venue-scale work; the small halls are not substitutes for them.

Facade details occupy deterministic sockets around openings and never the door,
12px return or published roof route. Roof furniture remains outside the quiet
traversal bands. Review sheets: `artifacts/east-south-asian-houses.png`,
`artifacts/gold-masters.png` and `artifacts/prehistoric-expansion.png`.
The cross-cultural service comparison is
`artifacts/cultural-settlement-kits.png`.

## East and South Asian house gold masters — September 21, 2026

East and South Asia now use four enlarged regional families rather than the
small generic house pool: Chinese and Korean courtyard compounds, Chinese and
Japanese merchant/workshop ranges, North Indian and Deccan courtyard havelis,
and Bengali and Malabar monsoon houses. Medium footprints run from 8×5 to 10×8
cells and large footprints from 11×7 to 14×11. Chinese and Korean compounds
remain broad, low courtyard architecture; urban rows and havelis may rise to
three storeys. Every form retains the settled 12px right-hand return.

Profiles vary construction and legible details, not just colour: grey or lime
brick, post-and-beam frames, paper or timber lattice, jali, red gates, painted
beams, regional bands, noren, tile families, raised eaves and deep monsoon
eaves. Seeded surface treatments and building functions give coherent local
variation while keeping each regional roof silhouette recognizable. These are
historically informed illustrative types, not reconstructions of a single
surviving or excavated building.

Roof geometry is deliberately quiet and well bounded for later traversal.
Compound roofs publish four walkable rings around their courtyard void; pitched
rows publish connected slopes; havelis publish terrace rings. Review:
`artifacts/east-south-asian-houses.png`, plus Beijing, Seoul, Hangzhou, Kyoto,
Delhi, Bengal and Kochi sheets under `artifacts/towns/`.

## Roman, North African and West Asian urban houses — September 21, 2026

Roman domus and insula ranges now have native-pixel medium and large forms at
10×7 through 14×10 cells; the largest insulae are three storeys. Maghrebi,
Nile, Levantine, Iranian and Arabian courtyard houses span 6×4 one-storey,
9×7 two-storey and 13×9 three-storey forms. Profiles vary actual fabric—stone,
plaster, earth roof, pantile, parapet, lattice or shutter, restrained regional
bands, windcatchers, screens, water storage and shade—rather than recolouring
one drawing. Seeded forms also carry household, workshop, rental, merchant and
elite-compound functions. These are historically informed illustrative types,
not reconstructions of one excavated building.

Every house retains the settled 12px right-wall return regardless of footprint.
Large roof plans are separately proportioned for legibility and publish local
walkable roof rectangles, courtyard voids, storey levels and roof access. This
is data for a later traversal system; it does not yet make roofs interactive.
The large regional set packs on its own atlas page and is routed through the
world renderer, UI, minimap, labs, audit and town-sheet compositor.

Review: `artifacts/roman-west-asian-houses.png`; generated settlement sheets
for Rome, Alexandria, Cairo, Baghdad and Isfahan are under `artifacts/towns/`.
Oblique audit, full art build and TypeScript check pass. Broader tests and the
requested browser playtest remain deferred until the pre-commit test run.

## Enlarged prehistoric house families — September 21, 2026

The six early families omitted from the first gold-master pass now retain their
small sprites and compile two native-pixel medium variants plus one rare large
or communal variant: bark or mat domes, hide pole lodges, pit houses, stone
round houses, painted round houses and Aegean flat-roofed houses. Together with
the existing expanded round, mudbrick and longhouse families, every family in
the prehistoric regional selector now has meaningful scale tiers.

Seeded treatments change material history rather than merely hue: sewn panels,
repair patches, restrained ochre marks, reed or turf cover, lime or cream wash,
and regional geometric bands. The Great Plains lodge deliberately avoids later
historic painted-tipi iconography; the Aegean house avoids modern Cycladic
blue-and-white styling. These are explicit illustrative hypotheses, not claims
of excavated decoration.

Great Plains now resolves as a scoped 5141 BCE seasonal camp profile, so it can
be generated and reviewed without inheriting a generic early-farming place.
For expanded prehistoric camp families, medium is the ordinary dwelling while
the old small art remains a light or auxiliary shelter; communal large houses
remain rare. Review sheets: `artifacts/prehistoric-expansion.png` and
`artifacts/towns/great-plains-5141bce.png`. Oblique audit passed and the atlas
was rebuilt; broader tests and playtesting are intentionally deferred to the
requested pre-commit test run.

## Prop silhouette spacing and social house scale — September 21, 2026

Broad yard props now reserve their readable silhouettes rather than only an
anchor tile. Authored yards and routine-placed drying racks keep stock pens,
racks, troughs and stores clear of houses and one another without stripping
the yards of dense functional clusters.

Gold-master scale selection is shared by the current and fallback settlement
planners. Settlement form, central density, household means and urban quarter
now weight small, medium and large houses; large houses are exceptional at
village edges and farms but credible anchors in wealthy central or elite lots.
Focused tests cover both systems, and a Congo sheet joins the non-browser
settlement review panel.

## Oblique house gold masters and corrected figure scale — September 21, 2026

Building review sheets no longer compare against the deprecated 20×32 atlas
human. `scripts/capture-building-scale-reference.ts` crops the current default
renderer-B adult to its real 15×37 occupied bounds; oblique and prop sheets use
that generated reference. `BUILDING_ART.md` now requires native, enlarged,
grayscale, family and real-settlement review, with explicit rejection of
repeated texture and stretched facades.

Seven existing oblique house families retain their small forms and now compile
two medium seeds and one large seed from data: medieval thatch and timber,
early-modern brick and render, prehistoric round and mudbrick, and Neolithic
longhouse. These are native recipes with larger footprints rather than scaled
bitmaps. Gold facades leave quiet wall between opening groups and use a darker
right face. New worlds mix the larger forms into the applicable regional/date
sets; large houses remain the minority. The dedicated four-column contact sheet
is `artifacts/gold-masters.png`, generated with `npm run art:gold`.

Validation: oblique audit clean; focused content, graphics and urban-form tests
pass; atlas rebuilt. Town sheets for medieval and early-modern London,
Çatalhöyük, Danube first farmers and Bronze Age Britain were reviewed. The
graphics lab settlement check passed, and a direct timber-settlement browser
run rendered without page errors. One pre-existing graphics-lab test still
expects `/` to bypass the current start screen and failed before reaching the
lab; its independent settlement test passed.

## Shared habitat identity and geographic ecology — September 14, 2026

New worlds use ecology revision 2, hydrology revision 3, and prepared cache version 7. Regional sampling resolves ecology at the sampled coordinates and includes ecoregion identity in its cache. Valid geographic ecoregions precede broad climate fallbacks; dated regional/place defaults can explicitly specify ecology. Shared landscape recipes control moisture, canopy, substrate and floodability, including a more open seasonal monsoon forest and Mediterranean scrub/grass mosaics.

Every new natural cell has a `HabitatSite`: regional ecology, primary local community, normalized transition weights and physical conditions. Woodland, riparian woodland, scrub, grassland, marsh, swamp, bog, rock, barren ground, shore and water share a compact classifier. Existing art is retained. Ground raster and minimap use the same habitat colors; the raster interpolates them at tile edges. Independent vegetation palette substitutions, decorative rectangular litter gaps and extra clearing masks are bypassed for classified terrain. Tree and understory selection follow community weights. Inspection reports the regional ecology and actual local community.

`world.habitatAt(x,y)` exposes the cell identity and natural/cultivated/built land use. `supportsHabitatResource` provides eligibility for reeds, timber and stone; it does not invent mineral deposits, supplies, depletion or NPC harvesting behavior. The query is independent of pixel graphics. Older ecology policies remain available for pinned worlds.

Travel water crossings share normalized position, width and flow between map endpoints, including small tributaries. Interior connectors meet native channels, another outlet, a headwater or a basin. This is a procedural connection between map portraits, not continental drainage reconstruction. Wet ground follows water proximity and local slope; new random wetland pools are disabled. Ocean sandbars remain inside their map portrait rather than being clipped into border land.

Validation: focused habitat/classification, shared ground-color, source sampling, tributary, biome boundary and water-crossing regressions; land-exit/arrival integration checks. Production build passed. Main UI browser studies rendered monsoon and Mediterranean river landscapes without page errors, with matching minimap habitat patterns: `artifacts/habitat-community-review/*-app.png`. These are controlled recipe studies, not reconstructions of the user's exact seeds. The combined long seam test run hit a Vitest RPC reporting timeout after all assertions passed; its slow arrival test passed separately with the threads pool.

## Connected tributaries and freshwater swamp — September 14, 2026

New worlds pin hydrology revision 2 (previous revisions retain their water policy). River deformation now uses a continuous world-space warp instead of switching offsets with the nearest atlas segment; local water features merge with existing water. Creek routing and terrain painting share `mainWater`, including configured shores/lakes and regional water. Two spaced tributaries per eligible 192-cell block are attempted from a larger candidate set. Outlet-directed, winding polylines must reach real water, retain their mouth through smoothing, and widen downstream. The former extra displacement and random detached oxbows remain disabled. Prepared cache version is 5.

Named freshwater/peat swamp ecoregions previously fell through RESOLVE biome 1 into ordinary tropical woodland. They now resolve to wetland/swamp: a distinct freshwater swamp forest palette and tree mix, wetter understory, shallow flooded river margins, subdued mud banks and peat-green water. The living-water lookup has swamp rows (including frozen rows), reduced caustics and fewer rocks; the static water renderer has matching swamp tones.

Checks: river-connectivity regression at an atlas-direction change; tributary presence, sinuosity and wet centerlines through river/coast/lake mouths; named Borneo swamp resolution and shallow inundation. Browser terrain captures in `artifacts/water-repair-review/` and `artifacts/swamp-polish/`. The exact original screenshot seed was not reproduced.

## Connected biome transitions and minimaps — September 14, 2026

Travel settings now pin the neighbouring map's geographic/environment summary on each exit. Along land connections, the outer 112 cells blend toward the same mixture on both sides; desert/woodland boundaries introduce dry scrub and grassland. Existing habitat palette blending and ecological plant selection consume this mixture. Settings without neighbour metadata retain their previous ecology rules. Prepared cache version is 4.

The minimap samples a lightweight neighbouring environment across an exit, mapping border coordinates into the destination, instead of painting the playable-area water sentinel. This previews natural terrain, not the neighbouring settlement's buildings or dynamic state. Interior roads/buildings retain their normal rendering. Minimap ground colours use biome/colorway palettes and habitat moisture/cover, including transitional blends. Away from linked exits, out-of-bounds previews use the current geographic field.

Validation: TypeScript, two focused boundary/preview regressions, and a browser fixture rendering both desert-to-woodland minimaps without runtime errors. Capture: `artifacts/biome-boundary-minimaps.png`. No full travel/playthrough sweep.

## Water simplification — September 14, 2026

New worlds pin `hydrologyRevision: 1`. Earth maps retain their own coastline instead of blending in travel seams selected from the more land-heavy neighbour; travel links no longer author strips of land along these map edges. Existing manifests without the revision keep the previous generation policy. Prepared cache version is now 3.

Wet creeks are limited to one candidate per 192-cell block and must reach an outlet; failed walks no longer create automatic ponds. Configured tributaries use the configured river, regional tributaries recognize signed sea/lake/river outlets, and creek masks merge into the receiving water without the former three-cell dry gap. The extra post-walk meander displacement is disabled. Automatic oxbows and the per-reach river tier cache are disabled for new worlds; scattered basin pools are restricted to wetlands. This is a restrained procedural approximation, not a drainage simulation. Legacy code remains behind the pinned policy for existing manifests.

Focused regression coverage checks coastal border preservation, dry countryside, and new-world policy selection. No broad browser sweep requested; exact screenshot location unavailable.

Older entries: [PROGRESS_ARCHIVE.md](PROGRESS_ARCHIVE.md).
