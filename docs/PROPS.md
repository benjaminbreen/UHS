# Interactive props

What props do, how they are chosen and where they are placed. How they are
drawn is [PROP_ART.md](PROP_ART.md).

## Controls and behavior

Hovering a target shows its name and an available action. When a click or tap finds no walking route, the destination brackets close into a cross.

- **Space:** drop a held object first; otherwise pick up a nearby portable prop, preferring the facing direction. With no item available, tap for a two-tile jump or hold 240 ms for a three-tile jump that can climb two altitude levels. Jumps use the held movement direction, or the facing direction when stationary. A hold launches once; release before jumping again.
- **F, holding a stout stick:** strike a nearby breakable container. Clay takes one strike, fiber two, wood three; these are explicit game balancing values, not physical claims.
- **E:** drink at a water source or look inside a nearby container. A nearby water source takes priority; otherwise, when holding a container, E examines that container.
- **Shift + movement:** run at about 1.6× walking speed. **X:** throw the held item in the movement/facing direction.
- **G / Put down (alternative to Space):** put the held object on a clear adjacent tile, outside doorways.
- **Look inside** reveals persistent quantities. **Take contents** transfers all available goods, with ownership consequences where applicable. Picking up does not transfer the contents separately.
- **Wait** remains a toolbar button and text command. Key repeats, forms, and modal panels suppress gameplay actions.

There is one held object slot. Picking up equips that object; a stick has the strike capability, while a held container can be inspected and put down. Multiple equipment slots, item nesting, arbitrary per-stack transfers and locks are not implemented. A container with `lid: true` shows its lid off once looked into (**Lift the lid**) and can have it put back (**Put the lid back on**); lids are not animated.

Breaking preserves the original object ID, replaces the sprite with material-specific remains, and exposes the same contents in place. Taking those contents empties the remains; retrying a command never duplicates goods. Empty vessels remain visible. Damage, ownership, open/broken state and carrying survive save/reload. Nearby witnesses react to taking or damaging household property.

## Modules

- `src/content/props/catalog.ts`: definitions, shared art family, portability, container/material/strike/drink capabilities.
- `src/content/props/selection.ts`: flat household, yard, work and water kits selected from date, culture family and settlement form. Existing historical resolver exclusions/context/capability rules override the provisional defaults. Unknown entries remain qualified prototype selections, not researched historical presence.
- `src/content/props/place.ts`: deterministic content overlay on both world generators, including newly activated districts. Existing storage/water sites receive eligible objects; sparse work/yard pockets are placed beside buildings, avoiding blocked tiles, entrances, and other props.
- `src/core/props.ts`: facing/distance target selection and shared affordances; engine commands own all mutations.
- `public/props/`: the prop atlas and its time-of-day shadow masks, built by `npm run art:props`. Each sprite is trimmed to its own silhouette and drawn at 1x world scale; never shrink one at runtime. No shadows are baked into object pixels.

The renderer has no culture or era branches; selection does that.

## Props people work

A prop an NPC uses has to exist in the settlement plan, not in the prop
overlay: `place.ts` runs after the plan is closed, and a routine can only walk
to something the plan placed. The drying rack is the worked example.

- `routines.ts` attaches one rack per household whose livelihood works the
  water (`attachRack`), in their yard, or beside their work, or by the shore.
  The id goes on the `WorkSite` as `rackId`, next to `gateId`.
- Their day gains two stations: *Taking down the dry fish* before the boat goes
  out, and *Hanging the catch* on the way home. The second uses the
  `haul-catch` activity, so they carry a visible line of fish to it.
- `engine.followRoutine` sets `rack.open` from the owner's current activity,
  the same way it opens a pen gate. The renderer draws the rack's frame alone
  when it is empty and the hangings when it is loaded, so the state of the prop
  is the record of the household's day.

The same three pieces — a planned object, stations that visit it, one boolean
the engine writes — are what any other worked prop needs.

### Signs

`src/content/props/signage.ts` chooses signs by place, date and trade.

- **Wall signs.** `signFor` gives a street its style. Each household then hangs
  its own `wallsign-*` beside its door (`wallSignFor`), with a trade emblem
  where the style carries one.
  - Medieval Europe gets **oak** gallows; from 1500, **painted** iron-arm
    boards, or **cutout** silhouettes in German lands; from 1762, a **fascia**
    over the shop.
  - East Asia gets **lacquer** boards; Japan gets **split** and, from 1600,
    **noren** curtains.
  - South and Southeast Asia get **pennant** banners. West Asia, Inner Eurasia
    and the Swahili coast get **bazaar** cloths.
  - From 1800 in Europe, and from 1870 everywhere, the fascia is the default.
  - Venues add their own marks: the **bush** over a wine shop, the **barber**'s
    pole, the **sugidama** cedar ball and the Chinese **wineflag**.
- **Stall signs** (`stallSignFor`) go on market stalls.
- **Shop lettering** on modern shopfronts is drawn by the renderer
  (`src/render/shop-signs.ts`), not by props. See the `building-art` skill.

Only trades with a mark of their own get a sign; a generic merchant gets none.
These are game conventions, not a catalogue of attested signs. Review the
pixels with `python3 scripts/art/signpost_sheet.py`, or search "sign" in Prop
Lab.

### Settlement details

`src/content/props/settlement-details/` holds small dated details, one file per
region, placed by `placeSettlementDetails` after the yard props. Each rule sets
a density (one per N buildings), a cap and a minimum spacing, and may require a
trade in the building's name.

- Europe: wayside saint's shrines (medieval West; later Catholic regions only),
  Roman fountains and notice tablets, printed broadsides 1550–1950.
- West Asia: goods displays at merchants' doors, shaded drinking jars, and one
  small burial plot per town, four graves aligned to the qibla on the grid,
  with a turbaned stone in Ottoman lands.
- East Asia: roadside Jizō in Japan, sheltered notices elsewhere, shopfront goods.
- South and Southeast Asia: water pots, cloth and spice displays.
- Americas: colonial devotional niches and plaza goods; US newsstands and
  bulletin boards 1880–1950.

Beam scales are rare: a merchant-type building, an 8% roll, and 24 tiles from
the next scale.

### Street furniture

- **Door lanterns** at every other household door, hung from a bracket and
  swayed by the wind like the drying rack's fish.
- **Square centrepiece**, chosen in `focusFor(pack)` by culture and date,
  overriding the fabric's own focus: memorial arch, stele, spirit house,
  sabil, assembly tree, stepped platform, stone dais, cairn, war memorial,
  clock tower, carved post. Undefined leaves the fabric alone, which is the
  right answer for a camp, a hamlet, and for places whose assembly ground
  never had a monument in it.
- **The square's kit**, chosen in `plazaKitFor(pack)`
  (`src/content/settlements/plaza.ts`): table sets, sellers, a game table, a
  street trade, public water, planters, fixtures, pigeons, what stands in rows
  down the sides, and how much of the square is market pitches. Each region is
  a table of rows with the years a thing stood in the street. From 1850 the
  region is a map box (Turkey, the Andes and the archipelago override the
  wider one); before it, a cultural family and date: a Roman forum's togate
  statues and public scales, a medieval market place's pitches and well, a
  maidan's water jars and coffeehouse, a Chinese crossing's steles and
  xiangqi table, a Mesoamerican plaza's braziers and drum. Half the squares
  of 13 cells or more are built round one of the kit's centrepieces where it
  has any.
- **Statues** are chosen in `statueFor(pack, pick, rank)`
  (`src/content/settlements/statues.ts`): a table per tradition of which
  figures stood in public and when (a togate magistrate, a town's saint, a
  guardian lion, a chacmool, a heroic worker), drawn in the material that kind
  was made in. `rank` is the town's standing from its extent, 0 provincial to
  2 a capital: it sets the figure's size and keeps equestrians and colossi for
  the towns that could raise them. A third of the squares that put up figures
  are built round one; forums, temple approaches and spirit ways line their
  sides with them. Where a tradition put up no public figures (the Islamic
  world before the 1920s) the role falls to a fountain.
- **A fabric's ornament roles** (bench, planter, post, stele, cross, well,
  fountain, altar) are filled by `ornamentArt(pack, key)` with the art of the
  place and date. The small generic sprites in `ornaments` are a last resort
  and no longer reach a composed square.
- **Placing the kit** is `dressSquare` in `v3/plan.ts`, run after either
  square composer. Both axes through the centre stay clear. Tables cluster as
  one terrace against the north frontage; sellers work the south side, where a
  tall cart does not stand in front of a building; planters stand in pairs at
  the ways in; monuments stand in rows down the two sides; extra market
  pitches fill rows across the south half; pigeons are not solid. Counts scale
  with the square: one seller in a 9-cell square, four and a five-table
  terrace at 19.
- **Doorway marker**, chosen in `doorwayFor(pack)`: paper lanterns in east and
  southeast Asia, a garland across the lintel in south Asia, a pierced brass
  lamp in west Asia from 700, a horn lantern in Europe from 1100 and a gas
  bracket from 1820. Most cultures return nothing, because most doors had
  nothing on them.
- **Wayside crossroads and approaches**, chosen in `waysideFor(setting)` (`src/content/settlements/wayside.ts`):
  Up to two major rural junctions receive a `waymark` (`0` fingerpost, `1` wayside cross, `2` milestone, `3` pennant cairn, `4` South Asian brick-and-plaster *kos minar*, `5` East Asian or Mesoamerican road stela, or a `standing-stone` before 800 BCE), and the main settlement approach receives a `wayside-shrine` (`0` post shrine, `1` plastered niche, `2` stone lantern, `3` flagged cairn, `4` South Asian *chabutra* platform with sindoor stone and diya, `5` Japanese *hokora*) or regional `altShrine` (`jizo` in Japan from 1200, `saint-niche` in Catholic/Mediterranean Europe). In non-urban settlements, `plan.ts` grounds the marker on a worn earth or gravel pocket (`pocketFinish`), pairs it with a culturally matched `companion` (`bench` oak/stone/bamboo, `water-station` shaded *piau* or *sabil* drinking jars, `street-fountain` Roman *lacus*, or `seat-stone` sitting stone) two cells aside when clear, and plants a regional wayside shade tree behind the pocket.

Both frontage props are `solid: false` — a board hangs over the street and a
lantern above the step, so neither needs its cell kept clear. They are placed
beside the entrance by their own test, because the general one refuses every
cell within a step of a door, which is exactly where they belong.

### Market and street

A **beam scale** goes in the work slot of any building whose name gives a
trade — everything a market sold went over a balance first. It carries eight
motion frames and the renderer runs them at half speed, so the beam settles
one way and then the other over about three seconds rather than flicking.

A **hitching post** joins the work kit for any date before 1920: a post with a
ring, a mounting block beside one, or a rail between two.

### Granaries

Four builds, chosen in `selection.ts` by culture and date and placed from the
work kit in villages and farms: round mud stores under thatch in west and
southern Africa, a plank box on posts with rat guards where the monsoon comes,
a boarded granary on staddle stones in Europe from 1400, and a clay silo
everywhere else and everywhere early. Each carries its own variations —
one silo or a pair, thatch or tile, three stones or four, a lid on the clay bin
or an open mouth with the grain showing.

### Farm implements

Placed from `selection.ts` for villages, farms and camps: a plough and a
beehive from −3000, rake and fork from −4000, a cart from −1000, a milk churn
from 1850 when dairying goes industrial. A water butt goes in any back yard
from −1000. All but the butt are `worksite` props, so none of them turn up on
a city street.

### Where a prop belongs

A prop def can carry `where`. `backyard` — a washing line, a bin — is only
placed behind a household's own house and outside the middle of town.
`worksite` — crates, tins, drums, a barrow, a drying rack, a woodpile — needs a
building whose name gives a trade, or a settlement that is not a city.

The middle of town is a fraction of the settlement's own spread, so a small
town's centre is small and a city's is not. Over half the buildings in a city
are left with nothing outside at all: every house with its own bin and line is
what made a street read as a back yard.

Regional storage (`regionalContainer` in `content/props/containers.ts`)
swaps a planned sack, jar, crate or basket for the local vessel of its date
and place. Where the plan is bulk storage (a grain-sack pile, a crate stack,
a vat, a barrel) the grain bin, hamper, taru, Andean sack and cloth bale come
as their large fixed versions; elsewhere they are the small portable ones.

### Market stalls

`stallFor(pack, index)` picks one of five builds, and neighbouring pitches on
the same square take different variants.

| from | build |
| --- | --- |
| 1900 | tubular barrow under a canvas tilt, crates below, a scale on the end |
| 1650 | two-wheeled cart tipped down to sell from |
| 500 (east and southeast Asia) | roofed booth, boarded front, goods hung from the lintel |
| −500 | counter under a striped awning with a valance |
| before | boards on trestles |

Goods vary with the variant — produce, grain, pots, fish, bolts of cloth — so
two stalls of the same build are not the same stall.

### Street lighting

`lampFor(pack)` in `src/content/settlements/ornaments.ts` chooses what a place
lit its streets with, and `plan.ts` uses it wherever the block composer put a
lamp. Broad defaults, not a history of public lighting:

| from | what | where |
| --- | --- | --- |
| 1960 | sodium lamp, tapered column and a cut-off head | everywhere |
| 1890 | electric lamp, swan neck and enamel shade | everywhere |
| 1700 | gas lamp, fluted iron and four panes | European and west Asian cities |
| 1000 | lantern post, paper box under a little roof | east and southeast Asia |
| −500 | brazier column, an iron basket on stone | classical and south Asian cities |
| before | torch post, a brand in an iron cresset | anywhere |

`composeUrban` takes the settlement's year: a modern fabric's `furniture` list
still says it wants lamps, and any city from 1700 on gets them on its
arterials regardless of fabric. The torch and the brazier are drawn burning,
because that is what they are; the rest are drawn unlit, with the light itself
left to the renderer.

### Broken remains

One set per material rather than per object: a smashed jug and a smashed bowl
leave the same curved terracotta. `scripts/art/props_b/remains.py` draws seven
— clay, glaze, wood, fiber, metal, plastic, paper — in three arrangements
each, and the engine picks the arrangement from a hash of the object's id, so a
yard of broken crockery is not one pile stamped out three times.

What separates them is how the material fails: pottery leaves curved wedges
with the dark of the inside on every break, glaze adds a glint and shows raw
clay along the edge, wood splinters along the grain, wicker springs open,
metal folds rather than shatters, plastic whitens where it splits, card just
crushes. Resistance follows: wood and metal take three blows, wicker and
plastic two, everything else one.

### Knocked over, opened, dented

A prop's states are sprites listed in `STATES` in
`scripts/art/props_b/__init__.py` and built as `-fallen`, `-open`, `-dented`
and `-dented-open`. The renderer shows `fallen` when `tipped`, the lean frames
when leaning, and otherwise the most specific of `dented-open`, `open` and
`dented` that is drawn, from `open` and `damage`. A prop without a state
sprite keeps its plain one, so states can be drawn one family at a time.

A prop with `door: true` (the privies) offers **Open the door** and **Shut the
door**, which set `open`; its `-open` sprite shows the inside.

Sitting is a state. The `sit` use (benches, stools, seat logs, palace seats),
`mat` (on the floor), `warm` (at a fire) and `relieve` (the privies) set
`player.seated`, and the scene draws the figure in the doll's `sit-seat` or
`sit` pose on the prop. Waiting keeps you seated; any other command gets you
up first (`act`). Using a privy opens its door, seats you in the doorway
clipped by the jambs, and shuts the door when you get up. **Go to the privy**
in the Rest menu walks to the nearest one and uses it (`Runtime.toPrivy`, a
`go` plan with `use`).

Bins set down as street furniture (the kerb's, the square's, the park's, a
suburban house's) are catalogue props too, so they can be looked into and
knocked over, and a shop's pavement board can be shouldered down:
`kerbProp` in `src/world/v3/plan.ts`. The ice chest outside a petrol station
or market (`sites.ts`) is the `iceChest` prop, its lid lifted to look in.

A blow to a prop that both `topples` and is `breakable` dents it as it goes
over; once it is down, further blows break it. **Strike it** dents without
knocking it over.

Anything with `tips: true` in the catalog carries a fallen sprite, mostly from
`scripts/art/props_b/fallen.py`. It is drawn as the
same body of revolution lying down, not as the standing sprite rotated: the
light stays upper-left, so a fallen bin is lit along its top and dark
underneath, and its mouth becomes a disc you look into from the side.

**Knock it over** needs no tool and does not break anything: it sets `tipped`,
opens the object and spills what it held where it lies. **Set it upright**
puts it back. A stick to a basket still breaks the basket; a shoulder to it
only lays it down.

`topples: true` adds a two-stage response: running into a freestanding stone,
stool, bin or drum leaves it leaning 18 degrees. The next push (walking is
enough) lays it down; **Set it upright** also straightens a leaning object.
Both pushes keep the player outside its cell. Trees, wells and built-in
structures stay fixed. Lean frames are baked at native pixel resolution with
their ground pivot and shadow; fallen forms have their own drawings.

`muck: true` (the household and communal middens) is soft enough to fall
into. Walking into one, at a walk or a run, puts you down in it instead of
blocking: you stay where you were, lose 2 health (5 at a run), and the heap
takes `damage`, which shows its `-dented` frame, a print of you in it. The
scene plays a stumble, a splat and a spatter of muck. It comes before a running
collision or a sidestep, and like them needs the world's `hazards`.

The detail overlay also adds Roman milestones, late Viking-age Swedish
memorial stones and Edo-period stone lanterns, each with dated regional
placement.

### Old World kit

`techFor(pack)` says whether a settlement has wheeled vehicles, draught
traction, cooperage, dairying or the balance scale. These are Old World
things: in the Americas they arrive with contact, which the kit takes as 1550,
and in Oceania later still, taken as 1800. Before that the cart, the
wheelbarrow, the hitching post, the beam plough, the coopered water butt, the
milk churn, the iron cooking pot and the beam scale are all withheld.

It is not a claim about who invented what. It is what stops a wagon and a pair
of scales standing in a square in the 1485 Andes.

### Era ceilings

The kit is built upward from the earliest set, so every rule adds. Without a
ceiling a 1990s flat still rolls a storage jar and a city square still gets a
village wellhead. Three passes at the end of `selection.ts` take things back
out:

- **From 1900** the amphora, the sunken vat, glazed ware, the flask, the
  quern and the sickle stop being placed, and water becomes the pump alone.
- **From 1950, outside the countryside**, the household is cartons, plastic
  and tins; the yard is crates and tins; the fire is a drum. The pump stands
  in for a standpipe or a fountain, because there is no art for a tap.
- **From 1950 in a village, farm or camp**, only the clay cooking kit goes;
  baskets, buckets and benches stay.

From 1750 a wheelbarrow joins the work kit; from 1860 a galvanised bin and a
washing line join the yard and a steel drum the work kit. The washing line is
layered like the drying rack, so the washing lifts in the wind while the poles
stand still.

A drying rack is placed by `routines.ts` and gated the same way: after 1900
only a port, farm or village still cures its own catch in the open.

## Historical scope

The kits are broad material-culture defaults across all twelve eras, not
exhaustive archaeological coverage or invention dates. Refine place and date
in the historical registry (`src/content/history/`), not in interaction
handlers. Natural water sources reuse the basin art, and the stout stick is
there so breaking is discoverable.

## Bases and movement

Intact solid props block one ground tile, whatever their sprite height. The
one engine collision query serves walking, diagonal corners, click routes and
NPCs. Pots, barrels, woodpiles, containers and water fixtures block. Loose
sticks, carried props and broken remains do not. Dropping restores the
obstacle at once.

Yard composition uses a separate visual footprint. Broad low objects (pens,
drying racks, troughs, woodpiles, hayricks) reserve the tiles their sprite
reads across, as data on the prop definition.

## Checks

`tests/props.test.ts` covers conservation, hidden contents, pickup and drop,
damage, ownership, save and replay, every era and culture kit, and
entrance-safe placement.

## Acts, seats and what burns

A prop definition may carry three things beyond handling:

- `act`: something to do at it, offered as its own button (`attend`): its words, what is told when it is done (the object's own description when none is given), how long it takes, and whether it fills your water or rests you. Signposts and wall signs have "Read it", which tells what the sign says. In palaces a desk and a writing table are read, a globe is turned, a marble basin is drunk from.
- `seat`: how many it seats. The palace seats (stools, chairs, benches, sofas, couches, the high seat) are in the `sit` use, so the use key sits you on them as on a bench outdoors. People in the room do not use these seats yet.
- `burns`: what it would burn as (cloth, wood, thatch, paper, oil, leaf). Nothing reads this yet: fire on the map lights buildings and plants, has no `space`, and is refused indoors. It is there for the work on torches.

An act may also cost coin (`price`), hand you things (`gives`), restore health (`heal`), be done only once (`once`; the object's `open` records that it has been), and be told as a world event or a small action (`told`). The use key offers a prop's act like any other use, and the click menu lists it.

Every exhibit of a fair or a palace is a prop of this kind (`content/props/exhibits.ts`, one definition per find, key `exhibit-<find>`): look closely, listen, buy a plate, sign the book, take a horn of mead. The area still plans where each stands and keeps its cells closed; the object in the world is what is drawn and used. Only machines at work stay with the fair's own view, which plays their frames.

A tannur or a stove goes cold between meals: the renderer draws its `-out`
frame, ash in the mouth and no light, whenever `hearthLit` says that
household's fire is not in, the same schedule that sends smoke up the
chimneys. It stays lit while a neighbour works at it, and for two hours after
you cook, bake or tend at it (`fired` on the object).

A prop that carries a flame gives light through the map's lamp code (`lampLight` in `render/fire.ts`): palace candlesticks, candle stands and lamp stands are lit by day at half strength and fully after dark, flicker, and are lit again where they are put down. A lamp being carried gives no light.

## One system for every interior

A room's own pieces draw their states themselves: the chest (`room-chest`) lifts its lid and a shop's bank of drawers (`room-drawers`, the tobacconist's, apothecary's and tea dealer's stock) pulls two drawers out when looked into, from the object's `open`. A `lid` given as a pair of words names those two acts. Their drawings are grids in `src/render/interiors/sprites.ts`, with `-open` grids beside the closed ones.

Anything in a room that a person could handle, use, sit on, read, buy from or burn is a prop in the catalogue, placed as a `WorldObject` in that room's space, whatever built the room: a house interior, a fair gallery, a palace, a hall, a tomb. What it allows is said by its definition (`portable`, `topples`, `tips`, `breakable`, `container`, `seat`, `burns`, `act`), and the engine's prop code does the rest. An area generator lists its props on the level (`props`) and `arriveIn` puts them in the world. Do not give a new kind of interior its own list of things with its own actions. Scenery that is part of the building (walls, columns, hearths built in, floors) is painted by the area's view and is not a prop. Tomb finds are the one older list still to move.

