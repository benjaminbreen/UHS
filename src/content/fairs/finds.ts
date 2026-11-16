import type { FairFind } from "./types";

const look = (id: string, name: string, art: FairFind["art"], tags: string[], tier: FairFind["tier"], lookText: string, text: string, more: Partial<FairFind> = {}): FairFind =>
  ({ id, name, art, on: art === "painting" || art === "tapestry" || art === "carpet" || art === "panel" || art === "map" ? "wall" : "floor", tags, tier, verb: "Look closely", time: 60, look: lookText, text, basis: "documented", keeps: true, ...more });

/** What the 1889 fair showed. Anchored ones are placed by the area plan; the
 * rest fill stands in areas whose tags they share. */
export const fairFinds: readonly FairFind[] = [
  // The Tower.
  look("tower-ticket-office", "Tower ticket office", "kiosk", [], "common", "A booth at the foot of the leg. Two francs to the first platform, three to the second, five to the top.", "The clerk tears off your ticket. The lift is through the gate.", { verb: "Buy a ticket up", price: 2, loot: { "tower-ticket": 1 }, keeps: true }),
  look("restaurant-russian", "The Russian restaurant", "kiosk", [], "notable", "A restaurant in carved wood, serving zakuski and tea from a samovar.", "You sit by the rail with a glass of tea and look down on the crowd the size of ants.", { verb: "Take tea", price: 2, heal: 6, tint: "#b8432f" }),
  look("restaurant-flemish", "The Flemish restaurant", "kiosk", [], "common", "Beer, ham and waiters in Flemish costume.", "The beer is cold and the view is the whole of Paris.", { verb: "Have a beer", price: 1, heal: 4, tint: "#d8a640" }),
  look("bar-anglo-american", "The Anglo-American bar", "kiosk", [], "common", "Cocktails and iced drinks, which most Parisians have never had.", "The barman shakes something with ice and slides it over. It is very cold and very strong.", { verb: "Order a cocktail", price: 2, tint: "#4a6aa8" }),
  look("restaurant-french", "The French restaurant", "kiosk", [], "notable", "The smartest of the four, with white cloths and a long menu.", "Lunch takes an hour and a half. It is worth it.", { verb: "Have lunch", price: 6, heal: 15, time: 5400, tint: "#e8e0c8" }),
  look("figaro-press", "Le Figaro's printing office", "press", [], "prize", "A small press printing the paper's tower edition, 115 metres up.", "They set your name in type and print you a certificate that you came up the Tower.", { verb: "Have your name printed", price: 1, loot: { "figaro-certificate": 1 } }),
  look("tower-beacon", "The beacon", "lamp-standard", [], "notable", "The lantern at the top, which sweeps the city at night in blue, white and red.", "Up close it is a great lamp in a brass cage, warm even by day."),
  look("eiffel-rooms", "Eiffel's rooms", "panel", [], "prize", "A door to the small apartment Eiffel kept at the top, for guests and weather instruments.", "Through the glass you see a desk, a barometer and a piano. Edison will visit in September."),
  // The grounds.
  look("decauville-station", "Decauville railway halt", "kiosk", [], "notable", "A halt on the narrow-gauge line that runs along the quay, its little open cars crowded.", "You ride the toy train along the river, knees against the next bench, and back.", { verb: "Ride the little train", price: 1, time: 900 }),
  look("flower-bed", "Show bed", "pyramid", ["horticulture", "garden"], "common", "Bedding plants in a raised pyramid, each tier a different colour.", "The gardeners have chosen colours that read from the Tower.", { tint: "#d84a5a", weight: 2 }),
  look("orchid-stand", "Orchid stand", "vitrine", ["horticulture"], "notable", "Orchids under glass from a Paris grower, each with its Latin name.", "The prize bloom is no bigger than your thumb and worth more than a horse.", { tint: "#c88ad0" }),
  look("rose-show", "Rose show", "pyramid", ["horticulture"], "common", "Standard roses grown for the season, labelled by grower.", "They smell of tea and pepper.", { tint: "#e86a7a" }),
  look("garden-kiosk", "Refreshment kiosk", "kiosk", ["garden"], "common", "A painted kiosk selling lemonade, beer and cakes.", "A lemonade in a thick glass, very sweet.", { verb: "Buy a lemonade", price: 1, heal: 3, keeps: true, weight: 3 }),
  look("guide-seller", "Guidebook seller", "counter", ["garden"], "common", "A stand of guides, maps and catalogues.", "You buy the official guide, already dog-eared by the man who sold it.", { verb: "Buy a guide", price: 1, loot: { "fair-guide": 1 }, weight: 2 }),
  look("postcard-stand", "Picture card stand", "counter", ["garden", "habitation"], "common", "Cards printed with a drawing of the Tower, to be posted from its platforms.", "You buy a card with the Tower on it. It is the newest thing.", { verb: "Buy a card", price: 1, loot: { "tower-card": 1 }, weight: 2 }),
  look("medal-stand", "Souvenir medals", "counter", ["garden", "industries"], "common", "Brass medals struck with the Tower and the date.", "You buy a brass medal. It is still warm from the striking press.", { verb: "Buy a medal", price: 1, loot: { "fair-medal": 1 } }),
  // Fine arts.
  look("olympia", "Manet's Olympia", "painting", [], "prize", "A naked woman on a white bed looking straight out at you, a black cat at her feet. It caused a riot in 1865.", "People still stand in front of it a long time. A group of Manet's friends are raising money to buy it for the nation.", { tint: "#e8dcc0" }),
  look("centennale-corot", "Corot landscapes", "painting", [], "notable", "Silvery trees over still water.", "They are so soft they seem breathed onto the canvas.", { tint: "#8aa070" }),
  look("centennale-courbet", "Courbet's Burial at Ornans", "painting", [], "notable", "A whole village round an open grave, life size.", "Nobody in it is posing. That was the scandal.", { tint: "#3a3430", w: 2 }),
  look("sargent", "Sargent's portraits", "painting", [], "notable", "The American section's portraits, which won a medal.", "The sitters look as if they might step down and leave.", { tint: "#2a2830" }),
  look("salon-landscape", "Landscape", "painting", ["fine-arts"], "common", "A large landscape in a gilt frame.", "A brown field, a grey sky, a cart.", { tint: "#9a8a60", weight: 3 }),
  look("salon-history", "History painting", "painting", ["fine-arts"], "common", "Generals, horses and smoke.", "Every button has been painted.", { tint: "#7a4a3a", weight: 3 }),
  look("salon-portrait", "Portrait", "painting", ["fine-arts"], "common", "A lady in black silk.", "She looks bored, which is fair.", { tint: "#2a2a2a", weight: 3 }),
  look("sculpture", "Marble group", "statue", ["fine-arts", "garden"], "common", "A marble group on a plinth.", "Up close the marble has a skin like candle wax.", { tint: "#e8e4dc", weight: 2 }),
  // Liberal arts.
  look("history-of-work", "The History of Work", "model", [], "prize", "Tools and workshops from the Stone Age to the present, set out in order.", "You walk through ten thousand years of work in twenty minutes.", { tint: "#9a7a50" }),
  look("telephone-opera", "Opera telephones", "telephone", [], "notable", "Telephone receivers wired live to the Opéra stage.", "You hold a receiver to each ear and hear an aria from across Paris, small and clear.", { verb: "Listen", time: 300 }),
  look("photography", "Photography room", "panel", [], "common", "Prints, cameras and the new hand cameras that anyone can carry.", "A man shows you a camera the size of a box of cigars."),
  look("instruments", "Scientific instruments", "vitrine", ["liberal-arts"], "common", "Microscopes, theodolites and barometers in brass.", "Everything is polished like a weapon.", { tint: "#c8a050", weight: 3 }),
  look("printing", "Printing presses", "press", ["liberal-arts"], "common", "A rotary press running off sheets.", "The noise is a fast clatter and the paper comes out warm.", { weight: 2 }),
  look("maps", "Maps and globes", "map", ["liberal-arts"], "common", "Maps of the empire and a globe taller than a man.", "Large parts of Africa are still blank.", { tint: "#c8b890" }),
  // Industries.
  look("sevres", "Sèvres porcelain", "vase", [], "prize", "Vases from the state factory, taller than a child.", "The blue is so deep it looks wet.", { tint: "#2a4aa0" }),
  look("gobelins", "Gobelins tapestry", "tapestry", [], "notable", "A new tapestry from the state works, after a painting.", "Up close it is wool, stitch by stitch, years of it.", { tint: "#8a5a3a", w: 2 }),
  look("baccarat", "Baccarat crystal", "vitrine", [], "notable", "A crystal fountain and chandeliers that throw rainbows.", "When someone walks past the whole case shivers with light.", { tint: "#d8f0f8" }),
  look("christofle", "Christofle silver", "vitrine", [], "notable", "Table silver for a hundred places.", "A whole banquet laid out for nobody.", { tint: "#d8d8e0" }),
  look("menier", "Menier chocolate", "counter", [], "common", "The chocolate makers of Noisiel, with a model of their works.", "A girl in an apron gives you a square of chocolate.", { verb: "Take a sample", loot: { "chocolate-square": 1 }, keeps: false }),
  look("furniture", "Furniture", "counter", ["industries"], "common", "A suite of carved oak dining furniture.", "Heavy enough to sink a boat.", { tint: "#6a4a2a", weight: 3 }),
  look("silks", "Lyon silks", "vitrine", ["industries"], "common", "Bolts of figured silk from Lyon.", "The pattern changes as you walk past.", { tint: "#a83a5a", weight: 3 }),
  look("perfume", "Perfumery", "vitrine", ["industries"], "common", "Bottles of scent in tiers.", "An attendant dabs some on your wrist.", { tint: "#e8c8d8", weight: 2 }),
  look("japan-ceramics", "Japanese ceramics", "vase", ["industries"], "notable", "Japan's section: cloisonné, lacquer and porcelain.", "Painters in Paris are mad for these.", { tint: "#3a6a8a" }),
  look("pianos", "Pianos", "piano", ["industries"], "common", "Érard and Pleyel grands, lids up.", "Someone plays a scale and it fills the gallery.", { weight: 2 }),
  // Machines.
  look("pont-roulant", "The travelling bridge", "lift", [], "prize", "A gantry that runs the length of the hall above the machines, carrying visitors.", "You ride the bridge over the whole roaring hall, belts and wheels turning under your feet.", { verb: "Ride the bridge", price: 1, time: 900 }),
  look("edison", "Edison's phonographs", "phonograph", [], "prize", "Edison's stand: lamps, dynamos and a row of phonographs with listening tubes.", "You put the tubes in your ears and hear a voice that was recorded in America.", { verb: "Listen", time: 120, w: 2 }),
  look("dynamos", "Dynamos", "dynamo", [], "notable", "Dynamos lighting the hall, humming.", "The air smells of hot oil and something sharp.", { w: 2 }),
  look("locomotive-nord", "Express locomotive", "locomotive", [], "notable", "A new express engine of the Northern Railway, green and brass.", "Its driving wheels are taller than you.", { w: 5, h: 2, tint: "#2a5a3a" }),
  look("corliss", "Steam engine", "engine", [], "notable", "A big horizontal engine driving the line shafts.", "The flywheel turns so smoothly it seems still.", { w: 3, h: 2 }),
  look("loom", "Power loom", "loom", ["machines"], "common", "A Jacquard loom weaving a portrait from punched cards.", "The cards clack through like a song.", { weight: 3, w: 2 }),
  look("small-engine", "Engine", "engine", ["machines"], "common", "A smaller steam engine at work.", "Brass oilers drip in time.", { weight: 3, w: 2 }),
  look("electric-lamps", "Electric lamps", "lamp-standard", ["machines", "liberal-arts"], "common", "Arc and incandescent lamps on stands.", "Too bright to look at.", { weight: 2 }),
  // Agriculture.
  look("champagne", "Champagne", "barrels", [], "notable", "The champagne houses' stand, with a pyramid of bottles.", "A glass is poured for you.", { verb: "Taste", heal: 2, keeps: true }),
  look("giant-cheese", "Cheese", "counter", [], "common", "Cheeses of the departments.", "A sliver of Comté on a knife.", { verb: "Taste", heal: 3, keeps: true }),
  look("ploughs", "Ploughs and reapers", "engine", ["agriculture"], "common", "American reapers and French ploughs.", "The Americans have brought a machine that ties its own sheaves.", { weight: 3, w: 2 }),
  look("grain", "Grain", "sacks", ["agriculture", "latin-america"], "common", "Open sacks of wheat and maize.", "You run it through your fingers like everyone else.", { tint: "#d8b860", weight: 3 }),
  look("wine-casks", "Wine", "barrels", ["agriculture"], "common", "Casks and bottles of the year's wine.", "The man insists you try the Bordeaux.", { verb: "Taste", heal: 1, keeps: true, weight: 2 }),
  look("timber", "Timber sections", "bales", ["timber-trade"], "common", "Cross sections of trees, each labelled.", "One oak is older than the Revolution.", { tint: "#9a7040", weight: 3 }),
  // Latin America.
  look("silver", "Silver", "ingots", ["mexico", "bolivia"], "notable", "Bars and worked silver from the mines.", "A guard watches you look.", { tint: "#d8d8e0" }),
  look("onyx", "Onyx", "vase", ["mexico"], "common", "Mexican onyx carved into vases and clocks.", "It glows like honey where the light comes through.", { tint: "#d8c8a0" }),
  look("aztec-casts", "Casts of Aztec carvings", "statue", ["mexico"], "notable", "Plaster casts of the Calendar Stone and of gods.", "The Calendar Stone is taller than you.", { tint: "#b8a888" }),
  look("wool", "Wool", "bales", ["argentina", "latin-america"], "common", "Bales of merino wool from the Pampas.", "Greasy and warm.", { tint: "#e8e0c8", weight: 2 }),
  look("hides", "Hides", "bales", ["argentina", "latin-america"], "common", "Stacked cattle hides.", "They smell of a long voyage.", { tint: "#8a5a3a", weight: 2 }),
  look("frozen-meat", "Frozen meat", "vitrine", ["argentina"], "notable", "Mutton frozen in the Argentine and shipped in a refrigerated hold.", "Frost on the glass in July.", { tint: "#d89090" }),
  look("pampas", "Pictures of the Pampas", "painting", ["argentina"], "common", "Paintings of estancias and gauchos, for settlers.", "Land, the pictures say, for anyone who comes.", { tint: "#c8b870" }),
  look("nitrate", "Nitrate", "pyramid", ["chile"], "notable", "A pyramid of nitrate of soda from the Atacama.", "It is the fertiliser half of Europe's fields run on.", { tint: "#e8e4dc" }),
  look("copper", "Copper", "ingots", ["chile"], "common", "Copper bars and ore.", "Green where the air has got to it.", { tint: "#c87a4a" }),
  look("coffee", "Coffee", "sacks", ["brazil", "venezuela", "latin-america"], "common", "Sacks of coffee beans and a roaster.", "They hand you a tiny cup, strong enough to stand a spoon in.", { verb: "Take a cup", heal: 2, keeps: true, tint: "#5a3a2a", weight: 2 }),
  look("rubber", "Rubber", "bales", ["brazil", "bolivia"], "common", "Balls of raw rubber from the Amazon.", "They bounce.", { tint: "#3a3028" }),
  look("diamonds", "Diamonds", "vitrine", ["brazil"], "prize", "Brazilian diamonds, rough and cut.", "One is the size of a hazelnut.", { tint: "#e0f0ff" }),
  look("cacao", "Cacao", "sacks", ["ecuador", "venezuela"], "common", "Cacao pods and beans.", "The beans are bitter and smell of nothing like chocolate.", { tint: "#7a4a2a" }),
  look("straw-hats", "Straw hats", "counter", ["ecuador"], "common", "Fine woven hats from Ecuador, sold in Panama.", "Rolled up, one fits through a ring.", { tint: "#e8d8a0" }),
  look("mate", "Maté", "sacks", ["paraguay"], "common", "Maté leaves and gourds.", "Bitter, grassy, and strangely good.", { verb: "Try the maté", heal: 2, keeps: true, tint: "#7a8a3a" }),
  // Cairo.
  look("donkey-rank", "Donkey rank", "kiosk", ["cairo"], "notable", "Donkeys and their boys, waiting to carry visitors up and down the street.", "You ride a donkey the length of the street, the boy running beside, everyone laughing.", { verb: "Ride a donkey", price: 1, time: 300 }),
  look("cairo-stall", "Brass stall", "counter", ["cairo"], "common", "Trays, lamps and coffee pots in brass.", "The trader names a price and halves it as you walk away.", { tint: "#d8a040", weight: 3 }),
  look("cairo-carpets", "Carpets", "carpet", ["cairo", "colonies"], "common", "Carpets hung on the walls for sale.", "Wool, knotted by hand, in reds that do not fade.", { tint: "#a83a2a", weight: 2 }),
  look("cairo-coffee", "Coffee", "counter", ["cairo"], "common", "Coffee boiled in brass pots, thick and sweet.", "You drink it and leave the grounds.", { verb: "Drink a coffee", price: 1, heal: 2, keeps: true }),
  // Habitation and colonies.
  look("habitation-model", "Model of the house", "model", ["habitation"], "common", "A painted model of the house, with a card on the people it is meant to show.", "The card puts every people on one ladder, with Europe at the top.", { weight: 2 }),
  look("habitation-plan", "Garnier's drawing", "panel", ["habitation"], "common", "A watercolour elevation by Garnier's office.", "Neat, confident, half invented.", { weight: 2 }),
  look("gamelan", "The gamelan", "counter", [], "prize", "Bronze gongs and metallophones laid out on a mat.", "When they play, the sound shimmers and does not resolve. Musicians in the crowd stand very still.", { verb: "Listen", time: 600, tint: "#c8a040" }),
  look("angkor-casts", "Angkor casts", "statue", ["angkor"], "notable", "Plaster casts of Khmer carvings brought from Cambodia.", "Dancers in stone, the casts still smelling of plaster.", { tint: "#a89878" }),
  look("lacquer", "Lacquer", "vitrine", ["annam", "colonies"], "common", "Lacquered boxes and screens, inlaid with mother of pearl.", "The black is so deep it looks like water.", { tint: "#3a1a1a", weight: 2 }),
  look("tunisia-perfume", "Perfume bazaar", "counter", ["tunisia"], "common", "Rose and jasmine oils in small bottles.", "The man puts a drop on your hand and it lasts all day.", { tint: "#d8a0b0" }),
  look("dates", "Dates and olive oil", "sacks", ["algeria", "colonies"], "common", "Dates, oil and esparto grass from Algeria.", "A plate of dates to try.", { verb: "Try a date", heal: 2, keeps: true, tint: "#7a4a2a", weight: 2 }),
  look("colonial-map", "Map of the empire", "map", ["colonies"], "common", "The colonies coloured pink and the routes to them.", "The arrows all point at Paris.", { tint: "#d8a0a0" }),
];

export const fairItems = {
  "tower-ticket": ["Tower ticket", "papyrus", 0, "A printed ticket for the Tower lifts, torn at the corner."],
  "figaro-certificate": ["Figaro certificate", "papyrus", 3, "Your name in type, printed on the second platform of the Eiffel Tower by Le Figaro."],
  "fair-guide": ["Guide to the Exposition", "ledger", 1, "The official guide, with plans of the Champ de Mars and lists of every exhibitor."],
  "tower-card": ["Tower picture card", "papyrus", 1, "A card with a drawing of the Tower, to post to someone who is not here."],
  "fair-medal": ["Souvenir medal", "coin", 1, "A brass medal struck with the Tower and 1889."],
  "chocolate-square": ["Square of chocolate", "pebble", 0, "A square of Menier chocolate in silver paper."],
} as const;
