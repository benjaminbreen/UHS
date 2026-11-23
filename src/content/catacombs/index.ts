import type { ItemDef } from "../../core/types";
import type { Box, CatacombDepth, CatacombKind, SewerFind, SewerPerson } from "../sewers/types";

export const ROME: Box = [12.35, 41.78, 12.65, 41.98];
export const PARIS: Box = [2.25, 48.8, 2.42, 48.88];
const inBox = ([w, s, e, n]: Box, lon: number, lat: number) => lon >= w && lon <= e && lat >= s && lat <= n;

/** Rome's catacombs from when the first were dug; the Paris ossuary from when
 * the first cemetery was emptied into the quarries. */
export function catacombKindAt(lon: number, lat: number, year: number): CatacombKind | undefined {
  if (inBox(ROME, lon, lat) && year >= 150) return "roman";
  if (inBox(PARIS, lon, lat) && year >= 1786) return "ossuary";
}

/** Who a start down there plays, by the year. */
export function catacombRole(kind: CatacombKind | undefined, year: number) {
  if (kind === "ossuary") return year >= 1970 ? "Cataphile" : "Quarryman";
  return year < 451 ? "Fossor" : year < 851 ? "Pilgrim" : year < 1850 ? "Relic hunter" : "Archaeologist";
}

export const CATACOMB_NAMES: Record<CatacombKind, Record<CatacombDepth, readonly string[]>> = {
  roman: { upper: ["the upper galleries"], lower: ["the lower galleries", "the martyrs' level"], deep: ["the deepest galleries", "an abandoned level"] },
  ossuary: { upper: ["the ossuary"], lower: ["the quarry galleries"], deep: ["the old quarry workings", "the flooded quarry"] },
};

const f = (id: string, name: string, art: SewerFind["art"], tier: SewerFind["tier"], verb: string, look: string, text: string, more: Partial<SewerFind> = {}): SewerFind =>
  ({ id, name, art, on: ["loculus", "arcosolium", "epitaph", "lamp-niche", "scratchings", "tablet", "street-mark", "graffiti"].includes(art) ? "wall" : "floor", tier, verb, look, text, basis: "documented", ...more });
const roman = (more: Partial<SewerFind>) => ({ kinds: ["roman"] as const, ...more });
const ossuary = (more: Partial<SewerFind>) => ({ kinds: ["ossuary"] as const, ...more });

/** What is found in the catacombs. Roman graves were dug and sold by the
 * fossores from the late 100s to about 450; relics were moved out to churches
 * in the 700s and 800s; the galleries were lost until 1578. Paris moved its
 * cemeteries' bones into the quarries from 1786 and opened them to visitors in 1809. */
export const catacombFinds: readonly SewerFind[] = [
  f("marble-sarcophagus", "Marble sarcophagus", "sarcophagus", "prize", "Lift the lid", "A coffin of white marble carved with wavy flutes, and a round portrait of a married couple in the middle.", "The lid grinds aside. Two skeletons in rotted cloth, a gold ring on one hand and a glass bottle by a skull.", roman({ depths: ["lower", "deep"], time: 2400, keeps: true, loot: { "gold-ring": [1, 2], "gold-glass": [0, 1] } })),
  f("martyrs-grave", "Martyr's grave", "martyr-arch", "prize", "Open the grave", "An arched recess over a grave, with a marble slab set up by Pope Damasus in beautiful square letters. The plaster round it is scratched with the names of pilgrims.", "The slab has been opened before, long ago. You find bones wrapped in a scrap of purple cloth, and a small glass flask stained dark.", roman({ depths: ["lower"], years: [300, 2100], time: 1500, keeps: true, loot: { relic: 1, "blood-vial": [0, 1] } })),
  f("painted-grave", "Painted grave", "arcosolium", "notable", "Look at the painting", "An arched recess cut over a grave, its plaster painted in red and green.", "Jonah is thrown to the sea monster, and lies resting under a vine. The family who paid for this grave wanted to be raised as he was.", roman({ keeps: true, weight: 2 })),
  f("gold-glass-grave", "Grave with a glass in the mortar", "loculus", "notable", "Prise out the glass", "A grave shelf sealed with tiles. Pressed into the wet mortar was the bottom of a glass cup, with a portrait in gold leaf.", "Families pressed something into the mortar to know their grave again: a coin, a shell, a doll, a glass. You work the gold glass free with a knife.", roman({ weight: 2, time: 300, loot: { "gold-glass": 1 } })),
  f("coins-in-mortar", "Coins in the mortar", "loculus", "common", "Prise out the coins", "Two bronze coins pushed into the mortar of a child's grave.", "Worn smooth. One shows an emperor's head.", roman({ time: 120, loot: { coin: [1, 2] } })),
  f("epitaph", "Epitaph", "epitaph", "common", "Read the epitaph", "A marble slab over a grave, with letters cut in it and painted red. A dove holds a branch in its beak.", "\"Victoria, who lived 7 years, 3 months. In peace.\" Under it is the Chi-Rho, the first two letters of Christ's name in Greek.", roman({ keeps: true, weight: 3 })),
  f("lit-niche", "Lamp in a niche", "lamp-niche", "common", "Take the oil", "A clay lamp burning in a niche cut in the wall.", "Families lit lamps at their graves on the anniversaries. There is still oil in the jar beside it.", roman({ years: [150, 850], fuel: 1200, keeps: true, weight: 2, glow: "#ffb060" })),
  f("sooty-niche", "Lamp niche", "soot-niche", "common", "Look in the niche", "A small niche cut in the wall at head height, blackened with soot.", "The diggers worked by lamps set in niches like this one.", roman({ years: [851, 2100], keeps: true })),
  f("clay-lamps", "Clay lamps", "clay-lamps", "common", "Take a lamp", "Small clay lamps left on the floor by a grave, one stamped with a cross.", "One still has oil in it. You take it.", roman({ fuel: 900, loot: { "terracotta-lamp": [0, 1] } })),
  f("open-grave", "Broken grave", "open-loculus", "common", "Look in", "A grave shelf with its tiles broken in. Bones lie in the dust inside.", "Robbers, or relic hunters. Whoever it was took the skull.", roman({ years: [700, 2100], keeps: true, weight: 2 })),
  f("pilgrim-scratchings", "Pilgrims' scratchings", "scratchings", "common", "Read the scratchings", "Names and prayers scratched into the plaster with nails and knives.", "\"Peter and Paul, remember Victor.\" \"Elpidius was here.\" Some are in Latin, some in Greek.", roman({ years: [300, 2100], depths: ["lower", "upper"], keeps: true })),
  f("funeral-jars", "Jars from a funeral meal", "amphora", "common", "Look at the jars", "A wine jar and a cup left by a grave.", "The family ate a meal here on the day of the burial, and again each year, and poured wine through a hole into the grave.", roman({ years: [150, 450], keeps: true })),
  f("fossor-tools", "Digger's tools", "toolbag", "common", "Look through it", "A broken pick, a basket for earth, a lamp hook.", "The fossores dug the galleries and sold the graves. One of them left these behind.", roman({ years: [150, 450], keeps: true, basis: "inferred" })),
  f("bones", "Bones", "bones", "common", "Look at the bones", "Bones dragged out of a broken grave and left in the dust.", "Long bones and a jaw. Nobody has been down here in a very long time.", roman({ years: [700, 2100], depths: ["deep", "lower"], keeps: true, flat: true })),

  f("smugglers-cache", "Smugglers' cache", "cache", "prize", "Open the chest", "A chest pushed into a dead end and covered with a sack.", "Paris taxed everything brought through its walls, and smugglers used the quarries to get goods in underneath. This lot never got collected.", ossuary({ years: [1786, 1860], depths: ["lower", "deep"], time: 120, loot: { tobacco: [1, 3], coin: [4, 9] } })),
  f("fire-basin", "Sepulchral lamp", "fire-basin", "notable", "Take some fuel", "A stone basin on a pillar where a fire was kept burning to draw air through the galleries.", "There are wood shavings and a little oil in a pot beside it.", ossuary({ depths: ["upper"], keeps: true, fuel: 2400, glow: "#ff9a40" })),
  f("cemetery-tablet", "Cemetery tablet", "tablet", "common", "Read the tablet", "A stone tablet set into the bone wall, framed in black.", "\"Bones from the Cemetery of the Innocents, placed here in April 1786.\" Six million people lie in these galleries.", ossuary({ depths: ["upper"], keeps: true, weight: 3 })),
  f("verse-tablet", "Verse tablet", "tablet", "common", "Read the tablet", "A tablet with a few lines of verse cut into it.", "Lines about how death is the end of every road. Héricart de Thury, who arranged the bones, chose the verses himself.", ossuary({ depths: ["upper"], years: [1810, 2100], keeps: true })),
  f("street-mark", "Street name", "street-mark", "common", "Read the mark", "A street name and a date cut into the limestone, with the initials of the quarry inspector.", "The street above. The inspectors cut each one in so a man down here could tell where he stood under the city.", ossuary({ keeps: true, weight: 3 })),
  f("skull-heap", "Heap of skulls", "skulls", "common", "Look at them", "Skulls and long bones tipped down a shaft from above and never stacked.", "Somebody's teeth are scattered in the dust.", ossuary({ depths: ["upper", "lower"], keeps: true, weight: 2 })),
  f("candle-ends", "Candle ends", "candles", "common", "Take the wax", "Wax drips and candle stubs on a ledge, and soot on the ceiling above.", "Visitors carried candles. You gather the stubs to burn later.", ossuary({ flat: true, fuel: 900, basis: "inferred" })),
  f("resistance-post", "Field telephone", "crate", "notable", "Look at it", "A field telephone on a crate, its wire running off up the gallery.", "In August 1944 the Resistance ran the rising in Paris from a command post down here, under Denfert-Rochereau, on the quarry inspectors' own telephone lines.", ossuary({ years: [1944, 1944], keeps: true })),
  f("cataphile-mural", "Painted wall", "graffiti", "common", "Look at the painting", "A wall painted from end to end by people who come down here for fun.", "The galleries were closed to the public in 1955. People come anyway.", ossuary({ years: [1970, 2100], depths: ["lower", "deep"], keeps: true })),
];

const doing = (label: string, dress: string, act: string, manner: SewerPerson["manner"]) => ({ label, dress, doing: act, manner });

/** Who is met in the catacombs, by place and date. */
export const catacombPeople: readonly SewerPerson[] = [
  {
    id: "fossor", scope: { years: [150, 451] }, kinds: ["roman"], ...doing("Fossor", "construction-labourer", "Cutting a new row of graves", "work"),
    lines: ["A grave for a child is cheap. One in the martyr's room costs more than I earn in a year.", "We dig down a level when this one's full. The tuff is soft, but the dust gets in your chest.", "Hold the lamp still. I need to see the line."],
    party: [0.5, 0.4, 0.1], women: 0, ages: [16, 60], lit: true, weight: 4,
    note: "The fossores dug the galleries and graves and sold burial places, organised under the clergy by the 300s; inscriptions and paintings show them with pick and lamp.", basis: "documented",
  },
  {
    id: "mourners", scope: { years: [150, 451] }, kinds: ["roman"], depths: ["upper", "lower"], ...doing("Mourner", "farm-labourer", "Keeping the anniversary at a grave", "camp"),
    lines: ["It's a year today since we buried her. We bring a meal, and we leave her some.", "Light the lamp from mine, it's bad luck to bring fire from outside.", "We paid for a painted grave. The fossor said the painter would come back for the face."],
    party: [0.2, 0.5, 0.3], women: 0.6, lit: true, weight: 3,
    note: "Funeral meals (refrigeria) at graves on anniversaries, with lamps and libations, are documented in Christian and pagan practice; some catacomb graves have holes for pouring wine.", basis: "documented",
  },
  {
    id: "pilgrim", scope: { years: [350, 851] }, kinds: ["roman"], depths: ["lower", "upper"], ...doing("Pilgrim", "pedlar", "Looking for the martyr's grave", "explore"),
    lines: ["I came from Gaul to pray at the grave of the martyrs. Is it this way?", "I've written my name by the saint's grave. He'll remember me now.", "The guide wanted money to bring us down. I came on my own."],
    party: [0.4, 0.4, 0.2], women: 0.35, lit: true, weight: 3,
    note: "Pope Damasus restored martyrs' graves and set up verse inscriptions in the 360s and 370s; pilgrims' itineraries of the 600s list the graves to visit, and pilgrims' graffiti survive.", basis: "documented",
  },
  {
    id: "relic-hunter", scope: { years: [1578, 1801] }, kinds: ["roman"], ...doing("Relic hunter", "construction-labourer", "Breaking open a grave", "scavenge"),
    lines: ["A glass with a red stain by the grave means a martyr. The monks pay well for a martyr.", "Bosio came down with a notebook. I come down with a bag.", "Keep your light low. There are men from the Pope's office who'd have us in prison."],
    party: [0.6, 0.35, 0.05], women: 0, ages: [16, 55], lit: true, flee: true, weight: 2,
    note: "After a catacomb was found by chance in 1578, bodies taken for martyrs' relics ('corpi santi') were extracted and sent all over Catholic Europe through the 1600s and 1700s.", basis: "documented",
  },
  {
    id: "archaeologist", scope: { years: [1850, 2101] }, kinds: ["roman"], ...doing("Archaeologist", "scholar", "Copying an inscription", "explore"),
    lines: ["Don't touch the plaster. The paintings come away on your fingers.", "This gallery was dug in the 200s. You can tell from the way they cut the corners.", "I'm copying every inscription on this level. It will take me years."],
    party: [0.6, 0.35, 0.05], women: 0.2, ages: [24, 70], lit: true, weight: 2,
    note: "Giovanni Battista de Rossi began the systematic study of the catacombs in the 1850s, and the Pontifical Commission for Sacred Archaeology has run them since 1852.", basis: "documented",
  },
  {
    id: "quarryman", scope: { years: [1786, 1901] }, kinds: ["ossuary"], ...doing("Quarryman", "quarryman", "Building a pillar to hold the roof", "work"),
    lines: ["Half the Left Bank is hollow underneath. We build pillars so the streets don't fall in.", "We brought the bones down at night, cartload after cartload, with priests walking behind.", "Read the marks on the walls. Every street up there has its name down here."],
    party: [0.4, 0.45, 0.15], women: 0, ages: [16, 60], lit: true, weight: 4,
    note: "The Inspection Générale des Carrières, founded in 1777, shored up the quarries under Paris and moved the bones of the emptied cemeteries into them from 1786.", basis: "documented",
  },
  {
    id: "ossuary-visitor", scope: { years: [1809, 2101] }, kinds: ["ossuary"], depths: ["upper"], ...doing("Visitor", "clerk", "Looking at the bones", "explore"),
    lines: ["They say there are six million people down here.", "My candle's guttering. Do you know the way back?", "Look at the skulls in that wall. Someone had to arrange every one."],
    party: [0.3, 0.45, 0.25], women: 0.45, lit: true, quiet: true, weight: 3,
    note: "The ossuary opened to visitors by appointment in 1809; they carried candles and followed a black line painted on the ceiling.", basis: "documented",
  },
  {
    id: "quarry-smuggler", scope: { years: [1786, 1861] }, kinds: ["ossuary"], depths: ["lower", "deep"], ...doing("Smuggler", "pedlar", "Waiting with a load", "lookout"),
    lines: ["You didn't see me. Go back the way you came.", "Wine costs half outside the wall. Down here, there is no wall."],
    party: [0.5, 0.4, 0.1], women: 0.1, lit: true, flee: true, weight: 2,
    note: "Smugglers used the quarries to bring goods under the Farmers-General toll wall (1785–1860) and avoid the city's entry tax.", basis: "documented",
  },
  {
    id: "resistance", scope: { years: [1944, 1945] }, kinds: ["ossuary"], depths: ["lower"], ...doing("Resistance fighter", "guerrilla", "Guarding the command post", "lookout"),
    lines: ["Colonel Rol is giving the orders from down here. Keep your voice down.", "The quarry telephone reaches half the city, and the Germans don't know it exists."],
    party: [0.3, 0.5, 0.2], women: 0.2, lit: true, weight: 3,
    note: "During the Liberation of Paris in August 1944, Henri Rol-Tanguy directed the FFI from a command post in the quarries under Place Denfert-Rochereau.", basis: "documented",
  },
  {
    id: "cataphile", scope: { years: [1970, 2101] }, kinds: ["ossuary"], depths: ["lower", "deep"], ...doing("Cataphile", "explorer", "Exploring the galleries", "explore"),
    lines: ["Three hundred kilometres of tunnels, and the police only patrol a few of them.", "There's a room with a cinema further on. Don't tell anyone.", "Wear boots. Some of the galleries are knee-deep."],
    party: [0.3, 0.45, 0.25], women: 0.35, ages: [18, 40], lit: true, weight: 3,
    note: "Unofficial explorers ('cataphiles') have used the closed quarries since the 1970s, despite a 1955 ban on entry.", basis: "documented",
  },
];

const def = (id: string, name: string, sprite: string, value: number, description: string): [string, ItemDef] => [id, { id, name, sprite, value, description }];
export const catacombItems: Record<string, ItemDef> = Object.fromEntries([
  def("gold-glass", "Gold glass", "pebble", 30, "The bottom of a glass cup with a portrait in gold leaf sealed inside, cut down and pressed into the mortar of a grave."),
  def("relic", "Relic", "pebble", 40, "A few bones in a scrap of purple cloth. Someone will swear they belonged to a martyr."),
  def("blood-vial", "Glass vial", "clay-pot", 12, "A small glass flask from a grave, stained dark inside. In the 1600s such a stain was taken as the blood of a martyr."),
]);
