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
