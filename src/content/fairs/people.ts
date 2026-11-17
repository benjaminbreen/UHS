import type { SewerPerson } from "../sewers/types";

const PARIS_1889 = { years: [1889, 1889] as [number, number] };
const alone: readonly [number, number, number] = [0.7, 0.25, 0.05];
const pair: readonly [number, number, number] = [0.35, 0.45, 0.2];
const group: readonly [number, number, number] = [0.2, 0.4, 0.4];

const LONDON_1884 = { years: [1884, 1884] as [number, number] };
/** Who was at the Health Exhibition. */
const londoner = (id: string, label: string, dress: string, doing: string, manner: SewerPerson["manner"], lines: string[], more: Partial<SewerPerson> & { note: string }): SewerPerson =>
  ({ id, scope: LONDON_1884, label, dress, doing, manner, lines, party: alone, women: 0.3, weight: 1, basis: "inferred", ...more });
const london: SewerPerson[] = [
  londoner("lhe-visitor", "Visitor", "clerk", "Seeing the exhibition", "explore", [
    "They call it the Healtheries. Four million through the gates, the paper says.",
    "We came for the fountains. After dark they light them from underneath and the colours change.",
    "It's a shilling to get in. Half a crown on Wednesdays, to keep people like me out.",
    "I walked through the bad house and now I want to go home and look at our drains.",
  ], { party: pair, women: 0.5, ages: [14, 70], note: "About four million visits in six months; a shilling on most days. The dearer midweek day is a guess from other South Kensington exhibitions." }),
  londoner("lhe-family", "Family on a day out", "farmer", "Having a day out", "explore", [
    "The children have had a bun, a glass of milk from a real cow and a ride in a lift. That's the whole week's money.",
    "We came up by the Underground to South Kensington. There's a subway being dug straight to the door.",
    "My boy wants to be measured by the scientific gentleman. Threepence to be told he's short.",
  ], { party: group, women: 0.55, ages: [6, 60], note: "The exhibition drew working families on shilling days; the District Railway's subway to the site opened the next year." }),
  londoner("lhe-attendant", "Exhibitor's attendant", "merchant", "Minding a stand", "work", [
    "Everything on the stand can be ordered. Delivery in a fortnight, anywhere in London.",
    "The jury came round on Thursday with a thermometer and a notebook. We're hoping for a gold medal.",
    "People stop, read every card, and buy nothing. But they remember the name.",
  ], { women: 0.2, note: "Exhibitors were firms selling what they showed; juries awarded medals by class." }),
  londoner("lhe-constable", "Constable", "policeman", "Keeping order", "lookout", [
    "Mind your pockets by the fountains after dark. That's where the crowd is thickest.",
    "Lost children are kept at the office by the Exhibition Road entrance.",
    "Keep to the right in the arcades, please.",
  ], { women: 0, note: "The Metropolitan Police kept a detachment in the grounds." }),
  londoner("lhe-bandsman", "Bandsman", "clerk", "Between sets", "work", [
    "We play twice a day in the gardens. The Guards have the other stand.",
    "The Chinese band plays by their tea house. People come to stare more than to listen.",
  ], { women: 0, note: "Military bands played daily in the gardens; a band of Chinese musicians came with the Chinese court.", basis: "documented" }),
];

const person = (id: string, label: string, dress: string, doing: string, manner: SewerPerson["manner"], lines: string[], more: Partial<SewerPerson> & { note: string }): SewerPerson =>
  ({ id, scope: PARIS_1889, label, dress, doing, manner, lines, party: alone, women: 0.3, weight: 1, basis: "documented", ...more });

/** Who was at the 1889 fair. Their lines are plain modern English; the period is in what they say. */
export const fairPeople: readonly SewerPerson[] = [
  ...london,
  person("fair-visitor", "Visitor", "clerk", "Seeing the fair", "explore", [
    "We came for the Tower and haven't even got to it yet. Every turn there's something else.",
    "Thirty-two million tickets, they say. I believe it. Look at this crowd.",
    "My feet are finished. My wife says one more pavilion.",
    "They sell tickets on the boulevard for half a franc. Nobody pays the full franc.",
  ], { party: group, women: 0.5, note: "Most of the fair's visitors were Parisians and provincials on cheap tickets.", ages: [8, 75] }),
  person("fair-provincial", "Visitor from the provinces", "farmer", "Seeing Paris for the first time", "explore", [
    "The whole village saved for this train. I have to see everything twice so I can tell them.",
    "In Brittany we'd heard about the Tower. Nobody believed how tall.",
    "The railway did special excursion fares. Otherwise I'd never have come.",
  ], { party: group, women: 0.45, note: "The railway companies ran cheap excursion trains from the provinces all summer." }),
  person("fair-tourist", "Foreign visitor", "merchant", "Touring the fair", "explore", [
    "We came over with Cook's. Everything is arranged, which is a relief, because my French is terrible.",
    "The Americans are everywhere. You can hear them three pavilions away.",
    "Half the crowned heads of Europe stayed away. It's a republic's party, celebrating a revolution.",
  ], { party: pair, women: 0.5, note: "Thomas Cook ran tours from Britain; many European monarchies boycotted the centenary of the Revolution officially, but their people came." }),
  person("fair-guard", "Fair guard", "policeman", "Keeping order", "lookout", [
    "Keep moving, please. Pickpockets love a crowd standing still.",
    "Lost children go to the office by the main gate. We get dozens a day.",
    "Don't touch the exhibits. Yes, even that one.",
  ], { women: 0, note: "The fair had its own guards as well as the Paris police." }),
  person("fair-hawker", "Hawker", "street-hawker", "Selling to the crowd", "explore", [
    "Guides! Plans of the fair! You'll get lost without one!",
    "Paper Tower, ten centimes! Lasts longer than the real one!",
  ], { women: 0.3, note: "Hawkers worked the approaches selling guides, maps and souvenirs.", goods: ["fair-guide", "tower-card"] }),
  person("fair-gardener", "Gardener", "market-gardener", "Tending the beds", "work", [
    "We change the whole bed every three weeks so it's always in flower.",
    "Everything here was planted this spring. Last year this was a parade ground.",
  ], { women: 0.1, note: "The city's park service under Alphand laid out and kept the gardens." }),
  person("fair-attendant", "Stand attendant", "shop-assistant", "Minding the stand", "work", [
    "Everything you see is for sale, except the medal. We won a gold, you know.",
    "Ask me anything. I've answered the same five questions all summer.",
  ], { women: 0.5, note: "Exhibitors staffed their stands, and the juries gave out thousands of medals." }),
  person("fair-guide", "Guide", "schoolteacher", "Explaining the houses", "work", [
    "Monsieur Garnier designed every one. He built the Opéra, so he knows a thing or two about houses.",
    "The idea is to show how people have lived, from the caves to now. Of course, it's a Frenchman's idea of it.",
  ], { women: 0.2, note: "Guides and lecturers took groups round the history displays.", basis: "inferred" }),
  person("fair-artist", "Painter", "artist", "Sketching", "work", [
    "The Centennial hangs Manet now. Twenty years ago they laughed at him.",
    "I'm here for the Japanese section. You have to see what they do with a single line.",
  ], { women: 0.2, note: "Artists came to the fine-arts sections in numbers; Van Gogh's circle exhibited at a café just outside the gates." }),
  person("fair-engineer", "Engineer", "engineer", "Watching the machines", "work", [
    "The roof's on hinged arches. No columns in the middle. Nobody's built a span like it.",
    "Everything in this hall runs off belts from the line shafts. One engine stops, half the hall stops.",
    "Edison's here himself in the autumn, they say.",
  ], { women: 0, note: "Engineers and mechanics ran the machines in motion in the Galerie des Machines." }),
  person("fair-waiter", "Waiter", "waiter", "Serving", "work", [
    "Table by the rail? Everyone wants a table by the rail.",
    "We carry everything up in the lift before opening. The ice goes up first.",
  ], { women: 0.1, note: "The Tower restaurants and the fair's cafés were run by caterers." }),
  person("tower-liftman", "Lift operator", "engineer", "Working the lift", "work", [
    "Mind the gap at the door. Fifty people a car. Hold on going round the curve.",
    "The American lifts go straight to the second platform. Ours are steadier.",
  ], { women: 0, note: "The lifts were worked by operators: Roux, Combaluzier and Lepape in two legs, Otis in two." }),
  person("figaro-printer", "Printer", "printer", "Setting type", "work", [
    "We print the paper up here every day. Your name, a franc, and you have proof you came up.",
  ], { women: 0, note: "Le Figaro set up a print shop on the second platform." }),
  person("fair-latin-american", "Commissioner's clerk", "civil-servant", "Showing visitors round", "work", [
    "We want settlers. Land, good wages, no winter. Take a pamphlet.",
    "Paris buys our wool and coffee. The pavilion is to remind it who sells them.",
  ], { women: 0.2, note: "The republics' commissions used their pavilions to attract investment and migrants." }),
  person("donkey-boy", "Donkey driver", "drover", "Hiring out a donkey", "work", [
    "Ride, ride! One franc to the end of the street and back!",
    "The donkeys came from Cairo with us. They hate the rain more than we do.",
  ], { women: 0, ages: [12, 30], note: "Egyptian donkey drivers and their animals were brought for the Rue du Caire and were one of its draws." }),
  person("cairo-dancer", "Dancer", "performer", "Waiting to dance", "work", [
    "We dance twice an hour. The crowds push so hard they broke a door last week.",
    "Parisians call it the danse du ventre. In Cairo it is just dancing.",
  ], { women: 1, note: "Dancers performed in the Rue du Caire café, and drew enormous crowds." }),
  person("cairo-musician", "Musician", "musician", "Playing", "work", [
    "The oud and the drum. Four hours a day, every day, since May.",
  ], { women: 0, note: "Egyptian musicians played in the café." }),
  person("cairo-trader", "Trader", "merchant", "Selling brass and cloth", "work", [
    "For you, a good price. No, a very good price.",
    "Half of what is on this street came on a ship from Alexandria. The other half was made in Paris.",
  ], { women: 0, note: "Traders sold goods in the street's shops.", goods: ["fair-medal"] }),
  person("colonial-soldier", "Colonial soldier", "soldier", "On guard", "lookout", [
    "We came for the review. Now we stand here and people stare at us too.",
  ], { women: 0, note: "Colonial troops were on show at the Invalides and marched in reviews.", basis: "inferred" }),
  person("javanese-dancer", "Javanese dancer", "performer", "Resting between dances", "camp", [
    "We are from the court at Solo. It is very cold here, even in summer.",
    "The French ask us to dance all day. At home we dance for a reason.",
  ], { women: 1, ages: [12, 20], note: "Young dancers from Java performed in the kampong; Debussy and many others heard them." }),
  person("gamelan-player", "Gamelan player", "musician", "Tuning the gongs", "camp", [
    "The bronze has to be tuned by ear. Every gamelan is its own; this one cannot play with another.",
  ], { women: 0, note: "The gamelan players came with the dancers from Java." }),
  person("village-resident", "Resident", "farmer", "Living in the village", "camp", [
    "We were brought here to be looked at. We cook, we work, and people watch us do it.",
    "Some of us were promised wages. Some of us were not asked.",
    "When it closes in October, they say we go home. I hope they mean it.",
  ], { women: 0.5, note: "People from French colonies were brought to live in the villages for the season as an exhibit; some fell ill or died in Paris.", basis: "documented" }),
];
