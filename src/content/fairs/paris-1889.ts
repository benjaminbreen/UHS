import type { Fair, FairArea, FairBuilding } from "./types";

// The Exposition Universelle of 1889, 6 May to 31 October, for the centenary of
// the Revolution: the Champ de Mars, the Trocadéro across the Seine, the Quai
// d'Orsay along the river and the Esplanade des Invalides. Up the screen is
// south-east, from the river to the Dôme Central and the Galerie des Machines,
// so the big fronts face the player as they faced the crowds coming from the
// bridge. The grid squeezes distances; who is next to whom follows the plans.

const pavilion = (id: string, name: string, style: FairBuilding["style"], x: number, w: number, look = 0, h = 5): FairBuilding =>
  ({ id, name, style, x, w, h, look, interior: `${id}-in` });

const visitors = ["fair-visitor", "fair-visitor", "fair-provincial", "fair-tourist", "fair-guard"];

const inside = (id: string, name: string, tags: string[], n: number, note: string, basis: FairArea["basis"], floor: FairArea["floor"] = "parquet", people = ["fair-visitor", "fair-attendant"]): FairArea =>
  ({ id: `${id}-in`, name, kind: "pavilion", floor, stands: { tags: [id, ...tags], n }, people, note, basis });

const areas: FairArea[] = [
  {
    id: "trocadero", name: "the Trocadéro gardens", kind: "grounds", gate: "s", links: { n: "iena" },
    buildings: [pavilion("eaux-et-forets", "the Water and Forests pavilion", "timber", 4, 14, 0, 6)],
    fountain: "basin", stands: { tags: ["horticulture"], n: 4 }, people: [...visitors, "fair-gardener"],
    note: "The Trocadéro slope held horticulture and the Forestry Department's log pavilion. The 1878 palace stands behind the visitor, off the bottom of the screen.",
    basis: "documented",
  },
  {
    id: "iena", name: "the Pont d'Iéna", kind: "bridge", river: true, links: { n: "tower", s: "trocadero", e: "habitation-west", w: "habitation-east" },
    people: [...visitors, "fair-hawker"],
    note: "The bridge carried the main axis from the Trocadéro to the foot of the Tower. Garnier's History of Human Habitation ran along the quay either side.",
    basis: "documented",
  },
  {
    id: "tower", name: "the foot of the Eiffel Tower", kind: "grounds", links: { s: "iena", n: "central-gardens", e: "americas", w: "bourdonnais" },
    lifts: ["tower-first"], exhibits: ["tower-ticket-office"], people: [...visitors, "fair-hawker", "tower-liftman"],
    note: "The four legs stood on the Champ de Mars over a garden. Lifts ran up the legs: French ones in the east and west, American Otis cars in the north and south.",
    basis: "documented",
  },
  {
    id: "tower-first", name: "the first platform", kind: "platform", lifts: ["tower", "tower-second"],
    exhibits: ["restaurant-russian", "restaurant-flemish", "bar-anglo-american", "restaurant-french"],
    people: ["fair-visitor", "fair-tourist", "fair-waiter", "tower-liftman"],
    note: "Fifty-seven metres up, four restaurants stood round the first platform: Russian, Flemish, an Anglo-American bar and a French one.",
    basis: "documented",
  },
  {
    id: "tower-second", name: "the second platform", kind: "platform", lifts: ["tower-first", "tower-top"],
    exhibits: ["figaro-press"], people: ["fair-visitor", "fair-tourist", "figaro-printer"],
    note: "Le Figaro printed a daily edition of the paper up here, with the buyer's name set into a souvenir certificate.",
    basis: "documented",
  },
  {
    id: "tower-top", name: "the top of the Tower", kind: "platform", lifts: ["tower-second"],
    exhibits: ["tower-beacon", "eiffel-rooms"], people: ["fair-visitor", "fair-tourist"],
    note: "The top opened to the public in June. A beacon in the tricolour swept Paris at night; Eiffel kept a small set of rooms for receiving guests and for his instruments.",
    basis: "documented",
  },
  {
    id: "central-gardens", name: "the central gardens", kind: "grounds", fountain: "coutan", links: { s: "tower", w: "liberal-arts", e: "fine-arts" },
    buildings: [{ id: "dome-central", name: "the Dôme Central", style: "dome-central", x: 18, w: 20, h: 7, interior: "dome-hall" }],
    stands: { tags: ["garden"], n: 3 }, people: [...visitors, "fair-gardener"],
    note: "Bouvard's gilded dome closed the gardens. In front of it Coutan's fountain, France lighting the world, played lit in colour after dark.",
    basis: "documented",
  },
  {
    id: "fine-arts", name: "before the Palace of Fine Arts", kind: "grounds", links: { w: "central-gardens", s: "americas" },
    buildings: [{ id: "beaux-arts", name: "the Palace of Fine Arts", style: "formige", x: 16, w: 24, h: 7, look: 0, interior: "fine-arts-hall" }],
    stands: { tags: ["garden"], n: 2 }, people: visitors,
    note: "Formigé's iron palace on the Suffren side, faced in coloured terracotta and tile under a blue dome.",
    basis: "documented",
  },
  {
    id: "liberal-arts", name: "before the Palace of the Liberal Arts", kind: "grounds", links: { e: "central-gardens", s: "bourdonnais" },
    buildings: [{ id: "arts-liberaux", name: "the Palace of the Liberal Arts", style: "formige", x: 16, w: 24, h: 7, look: 1, interior: "liberal-arts-hall" }],
    stands: { tags: ["garden"], n: 2 }, people: visitors,
    note: "The twin of the Fine Arts palace, on the La Bourdonnais side, which held the History of Work and the sciences.",
    basis: "documented",
  },
  {
    id: "fine-arts-hall", name: "the Palace of Fine Arts", kind: "hall", floor: "parquet",
    exhibits: ["olympia", "centennale-corot", "centennale-courbet", "sargent"], stands: { tags: ["fine-arts"], n: 10 },
    people: ["fair-visitor", "fair-visitor", "fair-artist", "fair-guard"],
    note: "The Centennial of French Art hung a hundred years of painting, Manet's Olympia among it; foreign sections filled the rest.",
    basis: "documented",
  },
  {
    id: "liberal-arts-hall", name: "the Palace of the Liberal Arts", kind: "hall", floor: "parquet",
    exhibits: ["history-of-work", "telephone-opera", "photography"], stands: { tags: ["liberal-arts"], n: 10 },
    people: ["fair-visitor", "fair-visitor", "fair-attendant", "fair-guard"],
    note: "The retrospective History of Work, instruments, printing, photography, and telephones that carried the Opéra live.",
    basis: "documented",
  },
  {
    id: "dome-hall", name: "the Galleries of Various Industries", kind: "hall", floor: "tile", links: { n: "machines" },
    exhibits: ["sevres", "gobelins", "baccarat", "christofle", "menier"], stands: { tags: ["industries"], n: 14 },
    people: ["fair-visitor", "fair-visitor", "fair-provincial", "fair-attendant", "fair-guard"],
    note: "Under the dome and down the thirty-metre gallery: porcelain, tapestry, crystal, silver, furniture and food, French and foreign.",
    basis: "documented",
  },
  {
    id: "machines", name: "the Galerie des Machines", kind: "machines", floor: "iron", links: { s: "dome-hall" },
    exhibits: ["pont-roulant", "edison", "dynamos", "locomotive-nord", "corliss"], stands: { tags: ["machines"], n: 12 },
    people: ["fair-visitor", "fair-engineer", "fair-engineer", "fair-guard"],
    note: "Dutert and Contamin's hall, 420 metres long and 115 wide on hinged arches, the widest roof yet built. Travelling bridges carried visitors over the running machines.",
    basis: "documented",
  },
  {
    id: "americas", name: "the American pavilions", kind: "grounds", links: { w: "tower", n: "fine-arts", e: "americas-south" },
    buildings: [pavilion("mexico", "the Mexican pavilion", "aztec", 4, 16, 0, 6), pavilion("argentina", "the Argentine pavilion", "iron-glass", 32, 18, 0, 6)],
    stands: { tags: ["garden"], n: 2 }, people: [...visitors, "fair-latin-american"],
    note: "The Latin American republics, keen to court French money and migrants, built some of the most talked-about pavilions. Mexico's was an Aztec palace; Argentina's iron and coloured glass.",
    basis: "documented",
  },
  {
    id: "americas-south", name: "the southern American pavilions", kind: "grounds", links: { w: "americas" },
    buildings: [pavilion("chile", "the Chilean pavilion", "iron-glass", 3, 12, 1), pavilion("bolivia", "the Bolivian pavilion", "classical", 20, 10, 1), pavilion("brazil", "the Brazilian pavilion", "classical", 36, 14, 2, 6)],
    stands: { tags: ["garden"], n: 2 }, people: [...visitors, "fair-latin-american"],
    note: "Chile sent an iron pavilion that was later shipped home to Santiago. Brazil, still an empire, showed coffee and rubber under a tower.",
    basis: "documented",
  },
  {
    id: "bourdonnais", name: "the La Bourdonnais gardens", kind: "grounds", links: { e: "tower", n: "liberal-arts", w: "rue-du-caire" },
    buildings: [pavilion("ecuador", "the Ecuadorian pavilion", "inca", 4, 10), pavilion("venezuela", "the Venezuelan pavilion", "classical", 20, 12), pavilion("paraguay", "the Paraguayan pavilion", "classical", 38, 10, 1)],
    stands: { tags: ["garden"], n: 2 }, people: [...visitors, "fair-latin-american"],
    note: "Smaller republics along the east side of the gardens. Ecuador's was built on an Inca temple.",
    basis: "inferred",
  },
  {
    id: "rue-du-caire", name: "the Rue du Caire", kind: "grounds", links: { e: "bourdonnais" },
    buildings: [pavilion("cairo-cafe", "the Egyptian café", "moorish", 4, 12, 2), pavilion("cairo-house", "a Cairo house", "moorish", 22, 10, 1), pavilion("cairo-mosque", "the mosque front", "moorish", 38, 12, 0, 6)],
    stands: { tags: ["cairo"], n: 4 }, people: ["fair-visitor", "fair-tourist", "donkey-boy", "donkey-boy", "cairo-dancer", "cairo-trader"],
    note: "A street of old Cairo built from salvaged woodwork and doors, with donkey rides, shops and a café where dancers performed; the most crowded spot of the fair.",
    basis: "documented",
  },
  {
    id: "habitation-west", name: "the History of Human Habitation", kind: "grounds", links: { w: "iena" },
    buildings: [pavilion("house-gaul", "a Gallic house", "timber", 4, 8, 1), pavilion("house-greek", "a Greek house", "classical", 16, 9, 0), pavilion("house-roman", "a Roman house", "classical", 29, 10, 1), pavilion("house-arab", "an Arab house", "moorish", 43, 9, 1)],
    stands: { tags: ["habitation"], n: 3 }, people: [...visitors, "fair-guide"],
    note: "Charles Garnier's houses of all ages and peoples, in a line along the quay at the foot of the Tower. They show the ranking of peoples that the time took for science.",
    basis: "documented",
  },
  {
    id: "habitation-east", name: "the History of Human Habitation", kind: "grounds", links: { e: "iena", w: "orsay" },
    buildings: [pavilion("house-chinese", "a Chinese house", "pagoda", 4, 9, 1), pavilion("house-hindu", "a Hindu house", "khmer", 17, 9, 1), pavilion("house-aztec", "an Aztec house", "aztec", 30, 9, 1), pavilion("house-renaissance", "a Renaissance house", "timber", 43, 9, 2)],
    stands: { tags: ["habitation"], n: 3 }, people: [...visitors, "fair-guide"],
    note: "The rest of Garnier's row, toward the Quai d'Orsay.",
    basis: "documented",
  },
  {
    id: "orsay", name: "the Quai d'Orsay", kind: "grounds", links: { e: "habitation-east", w: "invalides" },
    buildings: [{ id: "agriculture", name: "the Agriculture galleries", style: "classical", x: 4, w: 30, h: 6, look: 2, interior: "agriculture-hall" }, pavilion("wine", "the wine pavilion", "timber", 40, 12, 0)],
    exhibits: ["decauville-station"], stands: { tags: ["garden"], n: 2 }, people: [...visitors, "fair-hawker"],
    note: "Long galleries of farming, food and wine ran along the river. Decauville's little railway carried visitors along the quay between the Champ de Mars and the Invalides.",
    basis: "documented",
  },
  {
    id: "agriculture-hall", name: "the Agriculture galleries", kind: "hall", floor: "boards",
    exhibits: ["champagne", "giant-cheese"], stands: { tags: ["agriculture"], n: 12 },
    people: ["fair-visitor", "fair-provincial", "fair-attendant"],
    note: "Ploughs, reapers, seed, cheese, oils and wines by department and country.",
    basis: "documented",
  },
  {
    id: "invalides", name: "the Esplanade des Invalides", kind: "grounds", links: { e: "orsay", w: "invalides-villages" },
    buildings: [pavilion("algeria", "the Algerian palace", "moorish", 4, 18, 0, 6), pavilion("tunisia", "the Tunisian pavilion", "moorish", 34, 14, 2)],
    stands: { tags: ["colonies"], n: 3 }, people: [...visitors, "colonial-soldier"],
    note: "The colonial exhibition: France's empire as the Republic wished it seen, in palaces and in villages of people brought to live in them for the summer.",
    basis: "documented",
  },
  {
    id: "invalides-villages", name: "the colonial villages", kind: "grounds", links: { e: "invalides" },
    buildings: [pavilion("angkor", "the Angkor pagoda", "khmer", 4, 12, 0, 6), pavilion("annam", "the Annam-Tonkin pavilion", "pagoda", 21, 12), pavilion("kampong", "the Javanese village hall", "timber", 38, 12, 1)],
    exhibits: ["gamelan"], stands: { tags: ["colonies"], n: 2 }, people: ["fair-visitor", "fair-tourist", "javanese-dancer", "gamelan-player", "village-resident"],
    note: "Villages from Java, Senegal, New Caledonia and Indochina, their people on show to visitors. The Javanese dancers and gamelan were the season's sensation; Debussy came back to hear them.",
    basis: "documented",
  },
  inside("eaux-et-forets", "the Water and Forests pavilion", ["timber-trade"], 6, "Logs, sections of every French timber, and the work of the forest service.", "documented", "boards"),
  inside("mexico", "the Mexican pavilion", ["latin-america"], 7, "Silver, onyx, archaeology and coffee under painted Aztec gods.", "documented"),
  inside("argentina", "the Argentine pavilion", ["latin-america"], 7, "Wool, hides, grain, frozen meat and pictures of the Pampas, to bring settlers.", "documented"),
  inside("chile", "the Chilean pavilion", ["latin-america"], 6, "Nitrate, copper and wine.", "documented", "iron"),
  inside("bolivia", "the Bolivian pavilion", ["latin-america"], 5, "Silver from Potosí, tin, and rubber.", "inferred"),
  inside("brazil", "the Brazilian pavilion", ["latin-america"], 7, "Coffee, rubber, diamonds and the empire's railways.", "documented"),
  inside("ecuador", "the Ecuadorian pavilion", ["latin-america"], 5, "Cacao, straw hats and finds from the Andes.", "inferred"),
  inside("venezuela", "the Venezuelan pavilion", ["latin-america"], 5, "Cacao, coffee and gold.", "inferred"),
  inside("paraguay", "the Paraguayan pavilion", ["latin-america"], 4, "Maté, timber and lace.", "inferred"),
  inside("cairo-cafe", "the Egyptian café", ["cairo"], 4, "Coffee, music and the dancers everyone came to see.", "documented", "tile", ["fair-visitor", "cairo-dancer", "cairo-musician", "fair-waiter"]),
  inside("cairo-house", "a Cairo house", ["cairo"], 4, "Rooms behind lattice windows, fitted with old woodwork brought from Cairo.", "inferred", "tile", ["fair-visitor", "cairo-trader"]),
  inside("cairo-mosque", "the mosque front", ["cairo"], 3, "A copy of a mosque's front and court, for show.", "inferred", "tile", ["fair-visitor", "fair-tourist"]),
  inside("house-gaul", "a Gallic house", ["habitation"], 3, "Garnier's idea of a Gaulish hut, furnished.", "hypothesis", "boards", ["fair-visitor", "fair-guide"]),
  inside("house-greek", "a Greek house", ["habitation"], 3, "A Greek house as Garnier imagined it.", "hypothesis", "tile", ["fair-visitor", "fair-guide"]),
  inside("house-roman", "a Roman house", ["habitation"], 3, "An atrium house on the Pompeii plan.", "inferred", "tile", ["fair-visitor", "fair-guide"]),
  inside("house-arab", "an Arab house", ["habitation"], 3, "A court house with tiles and a fountain.", "inferred", "tile", ["fair-visitor", "fair-guide"]),
  inside("house-chinese", "a Chinese house", ["habitation"], 3, "A Chinese house with lacquer and screens.", "inferred", "boards", ["fair-visitor", "fair-guide"]),
  inside("house-hindu", "a Hindu house", ["habitation"], 3, "An Indian house as Garnier drew it.", "hypothesis", "tile", ["fair-visitor", "fair-guide"]),
  inside("house-aztec", "an Aztec house", ["habitation"], 3, "An Aztec house as Garnier drew it.", "hypothesis", "tile", ["fair-visitor", "fair-guide"]),
  inside("house-renaissance", "a Renaissance house", ["habitation"], 3, "A timbered house of the 1500s.", "inferred", "boards", ["fair-visitor", "fair-guide"]),
  inside("wine", "the wine pavilion", ["agriculture"], 5, "Wines of the departments, with tastings.", "inferred", "boards", ["fair-visitor", "fair-provincial", "fair-waiter"]),
  inside("algeria", "the Algerian palace", ["colonies"], 7, "Carpets, olive oil, wine, esparto and dates, shown as the fruits of French rule.", "documented", "tile"),
  inside("tunisia", "the Tunisian pavilion", ["colonies"], 5, "Silks, perfumes, pottery and a bazaar.", "documented", "tile"),
  inside("angkor", "the Angkor pagoda", ["colonies"], 4, "Casts from the Angkor temples.", "documented", "tile"),
  inside("annam", "the Annam-Tonkin pavilion", ["colonies"], 5, "Lacquer, silk, inlay and the products of Tonkin.", "documented", "boards"),
  inside("kampong", "the Javanese village hall", ["colonies"], 3, "The hall where the dancers performed to the gamelan.", "documented", "boards", ["fair-visitor", "javanese-dancer", "gamelan-player"]),
];

export const paris1889: Fair = {
  id: "paris-1889",
  name: "the Exposition Universelle",
  city: "Paris",
  where: [2.2, 48.8, 2.4, 48.9],
  years: [1889, 1889],
  entry: "trocadero",
  areas,
  ticket: 1,
};
