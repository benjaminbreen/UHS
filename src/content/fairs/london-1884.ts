import type { Fair, FairArea, FairFind } from "./types";

// The International Health Exhibition, South Kensington, 8 May to 30 October
// 1884: "the Healtheries". Four million visits to the sheds and gardens
// between the Royal Albert Hall and the Natural History Museum. The areas and
// where they lie are transcribed from the official General Plan (Wilson
// Bennison, surveyor; Clowes, 1884), north up, in units of about ten yards.
// The plan gives each space's name and class; what stood in each is from the
// official catalogue and guide where a note says so, and otherwise inferred
// from the class.

const WALL_ART = ["painting", "tapestry", "carpet", "panel", "map"];
const f = (id: string, name: string, art: FairFind["art"], tags: string[], tier: FairFind["tier"], look: string, text: string, more: Partial<FairFind> = {}): FairFind =>
  ({ id, name, art, on: WALL_ART.includes(art) ? "wall" : "floor", tags, tier, verb: "Look closely", time: 60, look, text, basis: "inferred", keeps: true, ...more });

export const londonFinds: readonly FairFind[] = [
  // Fixed exhibits.
  f("anthropometric-lab", "Anthropometric Laboratory", "counter", [], "prize", "A railed-off strip of gallery where Francis Galton's attendants measure anyone who pays threepence.", "They take your height, arm span and weight, the strength of your grip and your pull, how hard you can punch, how well you see and hear. You get a card with the figures. They keep a copy.", { verb: "Be measured", price: 1, time: 900, loot: { "anthropometric-card": 1 }, basis: "documented", staff: "lhe-measurer" }),
  f("sanitary-houses", "The sanitary and insanitary houses", "model", [], "prize", "Two full-size houses side by side. One has every fault a London house has. The other is built as it should be.", "You walk through the bad one first. A cistern over the water closet, a drain leaking under the floor, arsenic green on the nursery wall: each fault has a numbered card. Then the same rooms done right.", { time: 600, w: 3, h: 2, basis: "documented", staff: "lhe-physician" }),
  f("fountain-tower", "Fountain signal tower", "lamp-standard", [], "notable", "A small clock tower beside the basin. Sir Francis Bolton stands in it after dark and works the fountain by electric signals.", "Lamps under the water turn the jets red, green and white in turn. It is what most people come to see.", { basis: "documented" }),
  f("chinese-restaurant", "The Chinese restaurant", "kiosk", [], "notable", "A restaurant with cooks sent from Peking by Sir Robert Hart of the Chinese customs service.", "Bird's nest soup, shark's fin and warm rice wine. Most of London has never tasted any of it.", { verb: "Have dinner", price: 3, heal: 12, time: 3600, tint: "#c8402e", basis: "documented", staff: "lhe-waiter" }),
  f("vegetarian-dinner", "Vegetarian dining room", "kiosk", [], "notable", "The Vegetarian Society's dining room. Three courses with no meat for sixpence.", "Lentil soup, a savoury pie and a pudding. It is full every day.", { verb: "Have the sixpenny dinner", price: 1, heal: 10, time: 1800, tint: "#6a9a4a", basis: "documented", staff: "lhe-waiter" }),
  f("duval-dinner", "Cheap dining room", "kiosk", [], "common", "A dining room run the way the Duval restaurants are in Paris: every dish priced separately and paid for at the door.", "A plate of beef, bread and a mug of tea for a few pence.", { verb: "Have a plate of beef", price: 1, heal: 8, time: 1500, tint: "#a86a3a", staff: "lhe-waiter" }),
  f("school-of-cookery", "School of cookery", "counter", [], "notable", "A kitchen behind glass where the National Training School for Cookery gives lessons all day.", "A teacher shows a row of girls how to make a stew from sixpence of scrag end. A crowd watches through the glass.", { basis: "documented", staff: "lhe-cook" }),
  f("working-dairy", "Working dairy", "counter", [], "notable", "Cows in stalls behind a rail, and a steam separator spinning the cream out of the milk.", "The milk is still warm. A dairymaid pours you a glass.", { verb: "Buy a glass of milk", price: 1, heal: 4, tint: "#f0ecd8", basis: "documented", staff: "lhe-dairymaid" }),
  f("bakery-ovens", "Bakeries at work", "counter", [], "notable", "Ovens of the newest patterns, fired and baking, with machines kneading the dough so no hand touches it.", "You buy a roll straight from the oven.", { verb: "Buy a hot roll", price: 1, heal: 3, tint: "#d8a860", basis: "documented", staff: "lhe-baker" }),
  f("water-works", "Water companies' models", "model", [], "notable", "Models and sections of the works of London's eight water companies: intakes, filter beds, pumping engines.", "A card gives the death rate from cholera district by district, before and after filtering.", { basis: "documented", staff: "lhe-engineer" }),
  f("historical-dress", "Historical dress", "statue", [], "notable", "Wax figures in English dress from the Norman Conquest to 1820, in a row down the quadrant.", "Each is copied from a tomb, a portrait or a manuscript. The ruffs are as wide as plates.", { basis: "documented" }),
  f("rational-dress", "Rational dress", "vitrine", [], "notable", "The Rational Dress Society's case: divided skirts, wool next to the skin, and a plaster cast of ribs bent by a corset.", "The society says no woman should carry more than seven pounds of underclothing.", { tint: "#8a6a9a", basis: "documented", staff: "lhe-tailor" }),
  f("aquarium-tanks", "Aquarium tanks", "vitrine", ["aquarium"], "common", "Glass tanks of sea and river fish, kept on from last year's Fisheries Exhibition.", "A pike hangs dead still in green water and watches you.", { tint: "#4a8aa8", weight: 3, keeps: true }),
  f("old-london-printer", "Printer's shop", "press", [], "notable", "A printer in doublet and hose pulls sheets on a wooden press, in a house copied from one that burned in 1666.", "He prints you a ballad sheet. The street is full-size: you can go upstairs.", { basis: "documented", staff: "lhe-printer" }),
  f("old-london-gate", "Bishopsgate", "panel", [], "notable", "The old city gate, rebuilt in timber and plaster at the end of the street, with its statue of a bishop over the arch.", "Every house in the street is a copy of a real one from before the Great Fire.", { basis: "documented" }),
  f("lighting-engines", "Dynamos for the lighting", "dynamo", [], "notable", "The dynamos that light the whole exhibition after dark, in a row, each belted to its own steam engine.", "It is the largest electric lighting plant in London. The gardens are lit by it every evening.", { w: 2, basis: "documented", staff: "lhe-electrician" }),
  f("technical-students", "Technical Institute workshop", "loom", [], "notable", "Students of the City and Guilds Institute at work at benches and looms, to show what technical schooling is.", "A boy of fifteen is cutting a screw thread on a lathe, and doing it well.", { staff: "lhe-schoolteacher" }),
  f("school-furniture", "School furniture", "model", [], "common", "Desks of every pattern, graded to the height of the child, so nobody has to stoop to write.", "A card warns that bad desks bend spines and ruin eyes."),
  f("reading-room", "Library and reading room", "panel", [], "common", "Shelves of books on health, building and food, free to read at the tables.", "Somebody is asleep over a report on the drains of Windsor."),
  f("hygienic-lab", "Hygienic laboratory", "counter", [], "prize", "A working laboratory behind a rail: microscopes, flasks of broth, and glass plates of jelly with specks growing on them.", "The demonstrator puts London tap water under the microscope for you, and then the same water after filtering. Each speck on the plate grew from one germ.", { time: 600, staff: "lhe-bacteriologist", basis: "documented" }),
  f("weather-station", "Meteorological station", "model", [], "notable", "A louvred screen of thermometers, a rain gauge and a wind vane on a pole, fenced off on the lawn.", "A man from the Meteorological Office reads the instruments three times a day and chalks the figures on a board.", { basis: "documented" }),
  f("doulton-potter", "Potter at the wheel", "vase", [], "notable", "A potter throwing stoneware filter jars on a wheel, with the finished ones stacked behind him.", "He pulls a jar up out of a lump of clay in under a minute.", { tint: "#8a6a4a", staff: "lhe-potter" }),
  f("belgian-school", "Belgian schoolroom", "model", [], "notable", "A whole primary classroom sent from Brussels: desks, wall charts, a museum cupboard of stones and seeds.", "Belgium put a school in every commune five years ago and is proud of it.", { w: 3, staff: "lhe-belgian", basis: "documented" }),
  // Stands by class.
  f("slipper-baths", "Baths, plumbed and running", "bath", ["baths"], "common", "Baths of enamelled iron, copper and glazed fireclay, each with hot and cold water laid on and running.", "The attendant fills one for you to feel. The hot comes from a gas geyser on the wall, which roars.", { weight: 4, staff: "lhe-bath-attendant" }),
  f("needle-bath", "Needle bath", "model", ["baths"], "notable", "A cage of brass pipes that sprays water from every side at once.", "It is meant for hospitals and hydropathic hotels. A card promises it is bracing."),
  f("turkish-bath", "Model Turkish bath", "model", ["baths"], "notable", "A model of a Turkish bath in three rooms, warm, hot and hotter, with a plunge pool at the end.", "London has a dozen of these now. A doctor's card says they cure gout."),
  f("public-baths", "Plans of public baths", "map", ["baths"], "common", "Plans of parish baths and wash-houses, where a hot bath costs twopence and a woman can do her washing for a penny an hour.", "Most London houses have no bath. These are where people wash.", { basis: "documented" }),
  f("pie-stall", "Pie and pasty stall", "kiosk", ["food"], "common", "A stall of hot meat pies and pasties under a striped awning.", "The pieman sells them as fast as his boy can bring them from the oven.", { tint: "#c88a4a", weight: 2, staff: "lhe-pieman" }),
  f("cheese-stand", "Cheeses", "counter", ["food"], "common", "English and American cheeses cut open on a marble slab.", "The American is cheaper and the cheesemonger would rather you did not notice.", { tint: "#e8c860", weight: 2, staff: "lhe-dairymaid" }),
  f("ale-stand", "Brewer's stand", "barrels", ["food"], "common", "Casks of pale ale and porter from a Burton brewery, with a chemist's certificate that it is pure.", "The brewer's man draws you a glass.", { tint: "#b8863a", weight: 2, staff: "lhe-brewer" }),
  f("belgian-glass", "Belgian crystal", "vase", ["belgium"], "common", "Cut crystal from the Val-Saint-Lambert works near Liège.", "The decanters ring when the exhibitor flicks them.", { tint: "#c8e0e8", weight: 2 }),
  f("belgian-stoves", "Belgian stoves", "counter", ["belgium"], "common", "Enamelled iron stoves that burn small coal slowly all night.", "They heat a room with a third of the coal an English grate uses.", { tint: "#3a4a5a", weight: 2, staff: "lhe-belgian" }),
  f("belgian-lace", "Brussels lace", "vitrine", ["belgium"], "common", "Lace from Brussels and Mechlin under glass, with a lacemaker's pillow and bobbins beside it.", "A collar this size is a month of one woman's work.", { tint: "#f0ece0", weight: 2 }),
  f("tinned-meats", "Tinned meats", "pyramid", ["food"], "common", "A pyramid of tinned beef and mutton from Australia and America.", "Meat that has crossed the world in a tin, at half the butcher's price.", { tint: "#b84a3a", weight: 3, staff: "lhe-grocer" }),
  f("flour-sacks", "Flours and meals", "sacks", ["food"], "common", "Sacks of wheat flour, oatmeal, maize and lentils, each with a card giving what it costs to feed a man on it.", "The cheapest full diet shown is oatmeal, at under twopence a day.", { weight: 3, staff: "lhe-grocer" }),
  f("mineral-waters", "Mineral waters", "barrels", ["food", "refreshments"], "common", "Bottled waters from English and German springs, and soda made on the spot.", "The firm claims its water has never touched lead pipe.", { tint: "#6aa8c8", weight: 2 }),
  f("meat-extract", "Extract of meat", "vitrine", ["food"], "common", "Jars of beef extract and tins of condensed milk in a glass case.", "A teaspoon in hot water makes a cup of beef tea.", { tint: "#7a4a2a", weight: 2 }),
  f("adulteration", "Adulterated foods", "vitrine", ["food"], "notable", "A case of food as it is often sold: tea made of used leaves, mustard coloured with chalk, sweets dyed with lead.", "Beside each is the same thing pure, to show the difference.", { tint: "#a8a86a" }),
  f("wool-clothing", "Sanitary woollens", "vitrine", ["dress"], "common", "Dr Jaeger's wool clothing: undershirts, stockings and whole suits of undyed wool.", "The doctor holds that linen and cotton next to the skin are unhealthy.", { tint: "#c8b890", weight: 2, basis: "documented", staff: "lhe-tailor" }),
  f("boots", "Boots made to the foot", "counter", ["dress"], "common", "Boots cut to the real shape of a foot, beside the pointed kind and a cast of what those do to toes.", "The bootmaker measures both your feet. They are not the same size.", { weight: 2 }),
  f("waterproofs", "Waterproofs", "vitrine", ["dress"], "common", "Coats of rubbered cloth with ventilation holes under the arms.", "The cloth smells of rubber and the holes are neatly eyeleted.", { tint: "#4a5a6a" }),
  f("baths", "Baths and basins", "vitrine", ["dwelling", "sanitary"], "common", "Baths of enamelled iron and of glazed fireclay, with taps for hot and cold.", "A fixed bath with hot water laid on is still a thing for the rich.", { tint: "#e8e4dc", weight: 2 }),
  f("water-closets", "Water closets", "model", ["sanitary"], "common", "Water closets of every make, in section, with glass pipes to show the flush and the trap.", "The attendant flushes one for you. The trap keeps the drain air out of the house.", { weight: 3, staff: "lhe-plumber" }),
  f("wallpapers", "Wallpapers free of arsenic", "panel", ["dwelling"], "common", "Wallpapers printed without arsenic green, each with the analyst's certificate.", "Arsenic papers have been killing children in their nurseries for years.", { tint: "#6a9a7a", weight: 2, basis: "documented" }),
  f("ventilators", "Ventilators", "model", ["dwelling", "sanitary"], "common", "Ventilating cowls and window fittings, some of them turning.", "Each claims to change the air of a room without a draught.", { weight: 2 }),
  f("furniture", "Furniture and fittings", "vitrine", ["dwelling"], "common", "A room set with plain furniture that can be washed down, and no heavy curtains to hold dust.", "The card says dust is where disease lives.", { tint: "#a8845a", weight: 2 }),
  f("gas-stoves", "Gas cooking stoves", "counter", ["heating"], "common", "Stoves that cook by gas, alight, with a joint roasting in one.", "The maker says the joint costs a penny of gas. Most kitchens still burn coal.", { tint: "#3a3e46", weight: 3, basis: "documented" }),
  f("smokeless-grates", "Smokeless grates", "model", ["heating"], "common", "Open grates built to burn their own smoke, tested by a jury with instruments in the flue.", "London's fog is mostly coal smoke from a million open fires.", { weight: 3, basis: "documented" }),
  f("kitchen-ranges", "Kitchen ranges", "counter", ["heating"], "common", "Iron ranges with ovens, boilers and plate racks, blacked and polished.", "The biggest would cook for a hotel.", { tint: "#2e3238", weight: 2 }),
  f("model-classroom", "Model classroom", "model", ["school"], "common", "A classroom set out as the School Board would have it: light from the left, desks in pairs, a map on rollers.", "A card gives the cubic feet of air each child should have.", { weight: 2, staff: "lhe-schoolteacher" }),
  f("kindergarten", "Kindergarten", "counter", ["school"], "common", "Froebel's gifts laid out: wooden balls, cubes, sticks and paper for folding.", "Children under seven are meant to learn by playing with these.", { tint: "#d8a84a", weight: 2 }),
  f("gymnasium", "School gymnasium", "model", ["school"], "common", "Wall bars, ropes and dumb-bells, and drawings of Swedish drill.", "The Board schools have begun to drill children in the playground.", { weight: 2 }),
  f("ice-machine", "Ice-making machine", "engine", ["machinery"], "notable", "A refrigerating engine making blocks of clear ice while you watch.", "A block slides out with a flower frozen in the middle of it.", { w: 3, staff: "lhe-engineer" }),
  f("bottling-machine", "Bottling machine", "press", ["machinery"], "common", "A machine filling and corking bottles of soda water, six at a turn.", "The corks go in with a bang.", { weight: 2 }),
  f("laundry-machines", "Steam laundry", "loom", ["machinery"], "common", "Washing machines, wringers and a mangle, all driven from one shaft.", "A shirt goes in dirty at one end and comes out pressed.", { weight: 2 }),
  f("indian-carpets", "Indian carpets", "carpet", ["india"], "common", "Carpets from the jails of Agra and Lahore, hung along the wall.", "The colours are deeper than anything machine-made.", { tint: "#a83a2e", weight: 2 }),
  f("indian-tea", "Indian tea", "bales", ["india"], "common", "Chests of Assam and Darjeeling tea, with a planter pouring cups.", "Indian tea has only just begun to outsell China tea in London.", { verb: "Take a cup of tea", price: 1, heal: 3, tint: "#5a7a3a", weight: 2 }),
  f("chinese-wares", "Chinese wares", "vase", ["china"], "common", "Porcelain, silk robes and models of Chinese houses and shops.", "The court was arranged by the Chinese customs service and staffed from Peking.", { tint: "#3a6aa8", weight: 2, basis: "documented" }),
  f("japanese-wares", "Japanese exhibits", "vitrine", ["japan"], "common", "School work, food and dress from Japan, sent by the education ministry.", "The schoolbooks are printed from woodblocks and the handwriting is done with a brush.", { tint: "#c84a5a", weight: 2 }),
  f("belgian-wares", "Belgian exhibits", "vitrine", ["belgium"], "common", "Belgian glass, stoves and school fittings.", "The Belgian schools exhibit is the largest of any foreign country.", { tint: "#d8b84a", weight: 2, staff: "lhe-belgian" }),
  f("french-foods", "French foods and wines", "barrels", ["france"], "common", "Wines, preserved fruits and chocolate from French houses.", "A man offers a thimble of something green and very strong.", { tint: "#8a2a4a", weight: 2 }),
  f("drinking-fountain", "Drinking fountain", "vase", ["garden"], "common", "A fountain with iron cups on chains, fed with filtered water.", "The water is cold and tastes of nothing, which is the point.", { verb: "Drink", heal: 2, weight: 2, keeps: true, basis: "documented" }),
  f("refreshment-pavilion", "Refreshment pavilion", "kiosk", ["garden", "refreshments"], "common", "A pavilion selling tea, ices and buns.", "A cup of tea and a bun, standing up.", { verb: "Have tea and a bun", price: 1, heal: 3, weight: 2, tint: "#d86a5a", staff: "lhe-tea-girl" }),
  f("guide-stall", "Guide and catalogue stall", "counter", ["garden", "entrance"], "common", "The official guide, the catalogue and a shelf of handbooks on health.", "You buy the guide. It has the plan folded in the front.", { verb: "Buy the guide", price: 1, loot: { "healtheries-guide": 1 }, weight: 2 }),
  f("cocoa-stall", "Cocoa rooms", "kiosk", ["cocoa"], "common", "A counter selling cocoa by the cup, run by a temperance company.", "Hot, thick and sweet, for a penny.", { verb: "Have a cup of cocoa", price: 1, heal: 4, tint: "#6a4a3a", staff: "lhe-tea-girl" }),
];

export const londonItems = {
  "anthropometric-card": ["Anthropometric card", "papyrus", 2, "A card from Galton's laboratory with your height, span, weight, grip, pull, sight and hearing written in."],
  "healtheries-guide": ["Guide to the Health Exhibition", "ledger", 1, "The official guide, with the general plan folded in the front."],
} as const;

const crowd = ["lhe-visitor", "lhe-visitor", "lhe-family", "lhe-family", "lhe-servant", "lhe-soldier", "lhe-nurse", "lhe-doctor", "lhe-tradesman", "lhe-child", "lhe-child", "lhe-constable"];
const stands = crowd;
const gallery = (id: string, name: string, at: [number, number, number, number], tags: string[], n: number, note: string, more: Partial<FairArea> = {}): FairArea =>
  ({ id, name, kind: "gallery", at, floor: "boards", stands: { tags, n }, people: stands, note, basis: "documented", ...more });
const court = (id: string, name: string, at: [number, number, number, number], note: string, more: Partial<FairArea> = {}): FairArea =>
  ({ id, name, kind: "court", at, stands: { tags: ["garden"], n: 3 }, people: crowd, note, basis: "documented", ...more });

const areas: FairArea[] = [
  gallery("albert-hall", "the Royal Albert Hall", [16, 0, 8, 5], ["school"], 2, "School furniture on the top floor, the library and ladies' clothing round the corridors; the north entrance.", { gate: "n", floor: "parquet", exhibits: ["school-furniture", "reading-room"] }),
  gallery("conservatory", "the Conservatory", [16, 5, 8, 4], ["garden"], 2, "The Horticultural Society's conservatory, between the Hall and the gardens.", { floor: "tile" }),
  gallery("west-quadrant", "the West Quadrant: Historical Dress", [10, 5, 6, 4], ["dress"], 2, "Historical dress on the ground floor, dining rooms above.", { exhibits: ["historical-dress"] }),
  gallery("east-quadrant", "the East Quadrant: Modern Dress", [24, 5, 6, 4], ["dress"], 4, "Modern dress.", { exhibits: ["rational-dress"] }),
  court("upper-garden", "the upper gardens", [10, 9, 20, 6], "The Horticultural Gardens' upper terrace, with a bandstand at each end and refreshment pavilions.", { bandstands: 2, band: "lhe-bandsman", exhibits: ["weather-station"] }),
  court("fountain-garden", "the fountain garden", [14, 15, 12, 6], "The illuminated fountains, lit by electric lamps under the water every evening.", { fountain: "coutan", exhibits: ["fountain-tower"] }),
  gallery("machinery-west", "Machinery in Motion: the West Gallery", [10, 15, 4, 9], ["machinery"], 2, "Machinery in motion.", { machinery: true, floor: "iron" }),
  gallery("china", "the China Gallery", [26, 15, 4, 6], ["china"], 4, "The Chinese court and pavilion, with its restaurant and tea house.", { exhibits: ["chinese-restaurant"] }),
  gallery("east-arcade", "the East Arcade: Heating and Cooking Apparatus", [30, 14, 3, 26], ["heating"], 8, "Heating and cooking apparatus the length of the arcade."),
  gallery("india", "the Indian Section", [14, 21, 3, 3], ["india"], 3, "India."),
  gallery("science", "Science and Art: the Central Gallery", [17, 21, 9, 3], ["school", "dwelling"], 3, "The central gallery. Galton's Anthropometric Laboratory stood in the exhibition; its place here is a guess.", { exhibits: ["anthropometric-lab"], basis: "inferred" }),
  gallery("decoration", "Wall Decoration and Furniture", [26, 21, 4, 3], ["dwelling"], 3, "Internal house decoration, wall decoration and furniture."),
  gallery("west-annexe", "Machinery in Motion: the West Annexe", [10, 24, 4, 6], ["machinery"], 2, "Machinery in motion.", { machinery: true, floor: "iron" }),
  gallery("foreign", "the Foreign Galleries: France", [14, 24, 4, 6], ["france", "belgium"], 5, "The west central galleries, given to France and other foreign countries."),
  gallery("avenue", "the Central Avenue", [18, 24, 2, 6], ["garden"], 1, "The avenue down the middle of the central galleries."),
  gallery("school", "The School", [20, 24, 3, 6], ["school"], 5, "The east central gallery: the school."),
  gallery("dwelling", "The Dwelling: Fittings", [23, 24, 3, 6], ["dwelling"], 4, "The dwelling: fittings. Doulton showed filters and stoneware; the potter at a wheel is a guess.", { exhibits: ["doulton-potter"] }),
  gallery("east-annexe", "the East Annexe: Sanitary Appliances", [26, 24, 4, 6], ["sanitary"], 3, "Sanitary appliances. The sanitary and insanitary houses are number 2 on the plan, near here.", { exhibits: ["sanitary-houses"] }),
  gallery("aquarium", "the Aquarium", [6, 21, 4, 9], ["aquarium"], 6, "The aquarium kept from the 1883 Fisheries Exhibition, off the West Arcade.", { floor: "tile" }),
  gallery("belgium", "Belgium: the Queen's Gate Annexe", [1, 22, 5, 10], ["belgium"], 8, "The Belgian section, the largest foreign one, with the Queen's Gate entrance.", { gate: "w", exhibits: ["belgian-school"] }),
  gallery("education", "the City and Guilds Institute: Education", [33, 24, 5, 6], ["school"], 3, "Education, in the new Technical Institute on Exhibition Road.", { floor: "parquet", exhibits: ["hygienic-lab", "technical-students"] }),
  gallery("japan", "the Japanese Section", [33, 30, 4, 4], ["japan"], 4, "Japan."),
  gallery("cheap-dining", "the Cheap Dining Room", [33, 34, 4, 6], ["refreshments"], 1, "The cheap dining room.", { floor: "tile", exhibits: ["duval-dinner"] }),
  gallery("apartments", "the Complete Fitted Apartments", [14, 30, 6, 3], ["dwelling"], 4, "Whole rooms fitted and furnished."),
  gallery("baths", "the Baths", [20, 30, 6, 3], ["baths"], 5, "Baths, marked C on the plan between the Dwelling and the fitted apartments.", { floor: "tile" }),
  gallery("cocoa-rooms", "the Cocoa Rooms", [6, 30, 8, 3], ["cocoa", "refreshments"], 2, "Cocoa rooms and refreshments at the foot of the West Arcade.", { floor: "tile", exhibits: ["cocoa-stall"] }),
  gallery("east-corridor", "the East Corridor", [26, 30, 4, 10], ["sanitary", "dwelling"], 4, "The corridor from the east annexe down to the food galleries."),
  gallery("old-london", "Old London Street", [8, 33, 10, 3], [], 0, "A full-size street of houses copied from London before the Great Fire, with craftsmen at work in them.", { floor: "iron", exhibits: ["old-london-gate", "old-london-printer"] }),
  gallery("water-pavilion", "the London Water Companies' Pavilion", [18, 33, 6, 5], ["sanitary"], 2, "The pavilion of the London water companies.", { floor: "tile", exhibits: ["water-works"] }),
  gallery("electric", "Machinery for Electric Lighting", [8, 36, 6, 4], ["machinery"], 0, "The engines and dynamos that lit the exhibition.", { machinery: true, floor: "iron", exhibits: ["lighting-engines"] }),
  gallery("bakeries", "the Bakeries", [14, 38, 12, 2], ["food"], 2, "Bakeries at work.", { floor: "tile", exhibits: ["bakery-ovens"] }),
  gallery("foods", "Foods: the South Gallery", [6, 40, 24, 3], ["food"], 10, "The long south gallery of foods."),
  gallery("entrance", "the Principal Entrances", [30, 40, 5, 4], ["entrance"], 2, "The principal entrances from Exhibition Road.", { gate: "e", floor: "tile" }),
  gallery("dairy", "the Dairies", [8, 43, 6, 3], ["food"], 2, "Working dairies.", { floor: "tile", exhibits: ["working-dairy"] }),
  gallery("dining", "the Dining Rooms", [14, 43, 12, 3], ["refreshments"], 1, "Dining rooms and the School of Cookery.", { floor: "tile", exhibits: ["school-of-cookery", "vegetarian-dinner"] }),
  court("promenade", "the South Promenade", [6, 46, 22, 3], "The promenade along the south front."),
];

export const london1884: Fair = {
  id: "london-1884",
  name: "the International Health Exhibition",
  city: "London",
  where: [-0.4, 51.3, 0.1, 51.7],
  years: [1884, 1884],
  entry: "entrance",
  areas,
  scale: 4,
  finds: londonFinds,
  ticket: 1,
  coin: ["shilling", "shillings"],
  prompt: /\bhealth exhibition\b|\bhealtheries\b/,
  place: "london",
  staff: {
    food: "lhe-grocer", dress: "lhe-tailor", school: "lhe-schoolteacher", machinery: "lhe-engineer", sanitary: "lhe-plumber", baths: "lhe-bath-attendant",
    belgium: "lhe-belgian", refreshments: "lhe-waiter", cocoa: "lhe-tea-girl", "": "lhe-attendant",
  },
  words: {
    short: "It is a shilling at the turnstile, and you don't have it.",
    enter: "gaslight and hot bread, and a band playing somewhere in the gardens.",
  },
};
