import type { SewerPerson } from "../sewers/types";

const PARIS_1889 = { years: [1889, 1889] as [number, number] };
const alone: readonly [number, number, number] = [0.7, 0.25, 0.05];
const pair: readonly [number, number, number] = [0.35, 0.45, 0.2];
const group: readonly [number, number, number] = [0.2, 0.4, 0.4];

const LONDON_1884 = { years: [1884, 1884] as [number, number] };
/** Who was at the Health Exhibition. */
const londoner = (id: string, label: string, dress: string, doing: string, manner: SewerPerson["manner"], lines: string[], more: Partial<SewerPerson> & { note: string }): SewerPerson =>
  ({ id, scope: LONDON_1884, label, dress, doing, manner, lines, party: alone, women: 0.3, weight: 1, basis: "inferred", ...more });
const sells = (verb: string, item: string, text: string) => ({ verb, wants: "coin" as const, price: 1, gives: { [item]: 1 }, time: 60, text });
const london: SewerPerson[] = [
  // The crowd.
  londoner("lhe-visitor", "Visitor", "clerk", "Seeing the exhibition", "explore", [
    "They call it the Healtheries. Four million through the gates, the paper says.",
    "We came for the fountains. After dark they light them from underneath and the colours change.",
    "It's a shilling to get in. Half a crown on Wednesdays, to keep people like me out.",
    "I walked through the bad house and now I want to go home and look at our drains.",
  ], { party: pair, women: 0.5, ages: [16, 70], quiet: true, weight: 3, note: "About four million visits in six months; a shilling on most days. The dearer midweek day is a guess from other South Kensington exhibitions." }),
  londoner("lhe-family", "Parent on a day out", "shop-assistant", "Having a day out", "explore", [
    "The children have had a bun and a glass of milk from a real cow. That's the week's money gone.",
    "We came up by the Underground to South Kensington. They're digging a subway straight to the door.",
    "My boy wants the scientific gentleman to measure him. Threepence to be told he's short.",
  ], { party: group, women: 0.55, ages: [24, 55], quiet: true, weight: 2, note: "The exhibition drew working families on shilling days; the District Railway's subway to the site opened the next year." }),
  londoner("lhe-child", "Child", "errand-boy", "Running ahead", "explore", [
    "I had milk out of a real cow!",
    "There's a street with a man in armour. Come and see!",
    "Father says we can't afford the Chinese dinner.",
  ], { party: pair, women: 0.5, ages: [7, 13], quiet: true, weight: 2, note: "Children came with families and in Board school parties." }),
  londoner("lhe-servant", "Servant on her day off", "domestic-servant", "Having her afternoon off", "explore", [
    "My mistress gave me the shilling and said go and learn something about kitchens.",
    "A gas stove would save me blacking the range every morning. She'll never buy one.",
  ], { party: pair, women: 1, ages: [16, 40], quiet: true, note: "Domestic service was the largest employment for women in London." }),
  londoner("lhe-soldier", "Soldier on leave", "soldier", "Walking out", "explore", [
    "The band's ours. I came to hear them and stayed for the ale.",
    "They've an ambulance wagon on show that's better than anything we had in Egypt.",
  ], { women: 0, ages: [19, 40], quiet: true, note: "Soldiers from the London barracks; the army's ambulance exhibits are on the plan." }),
  londoner("lhe-nurse", "Hospital nurse", "nurse", "Looking at the ambulance exhibits", "explore", [
    "I came for the sickroom fittings. A bed you can wash down is worth ten doctors.",
    "Half of what's shown here my ward has been asking for these three years.",
  ], { women: 1, ages: [22, 50], quiet: true, note: "Trained nursing was twenty years old; hospital and sickroom fittings were a class of the exhibition." }),
  londoner("lhe-doctor", "Doctor", "physician", "Looking at the sanitary exhibits", "explore", [
    "I tell my patients to come. A trapped drain will do them more good than my medicine.",
    "Typhoid comes up the waste pipe. Everyone here knows it now, and ten years ago nobody did.",
  ], { women: 0, ages: [28, 65], quiet: true, note: "The exhibition's council was led by sanitary doctors and engineers." }),
  londoner("lhe-tradesman", "Plumber up from the country", "plumber", "Studying the fittings", "explore", [
    "I've come to see the new closets. My customers read about them and now I have to fit them.",
    "Glass pipes, so you can see the flush. I'd like a set of those to show people.",
  ], { women: 0, ages: [22, 60], quiet: true, note: "Tradesmen came to study the appliances; the Plumbers' Company held a congress at the exhibition." }),
  londoner("lhe-constable", "Constable", "policeman", "Keeping order", "lookout", [
    "Mind your pockets by the fountains after dark. That's where the crowd is thickest.",
    "Lost children are kept at the office by the Exhibition Road entrance.",
    "Keep to the right in the arcades, please.",
  ], { women: 0, note: "The Metropolitan Police kept a detachment in the grounds." }),
  // The band.
  londoner("lhe-bandsman", "Bandsman of the Guards", "musician", "Playing", "work", [
    "We play twice a day, marches and selections. The Coldstreams have the other stand.",
    "Requests go to the bandmaster. He ignores them.",
    "The Chinese band plays by their tea house. People come to stare more than to listen.",
  ], { quiet: true, women: 0, ages: [18, 45], note: "Military bands played daily in the gardens; a band of Chinese musicians came with the Chinese court.", basis: "documented" }),
  // People at the stands and exhibits.
  londoner("lhe-attendant", "Exhibitor's attendant", "shop-assistant", "Minding a stand", "work", [
    "Everything on the stand can be ordered. Delivery in a fortnight, anywhere in London.",
    "The jury came round on Thursday with a thermometer and a notebook. We're hoping for a gold medal.",
    "People stop, read every card, and buy nothing. But they remember the name.",
  ], { quiet: true, women: 0.25, note: "Exhibitors were firms selling what they showed; juries awarded medals by class." }),
  londoner("lhe-measurer", "Laboratory attendant", "scientist", "Measuring visitors", "work", [
    "Stand against the rod, please. Mr Galton wants ten thousand people measured before the autumn.",
    "Squeeze this as hard as you can. Most men think they are stronger than they are.",
    "Read the smallest line of print you can at arm's length. No, without leaning.",
  ], { women: 0, note: "Galton's Anthropometric Laboratory measured 9,337 people at the exhibition for threepence each.", basis: "documented" }),
  londoner("lhe-bacteriologist", "Laboratory demonstrator", "scientist", "Showing cultures", "work", [
    "This plate was touched with one drop of Thames water three days ago. Count the colonies.",
    "The method is Dr Koch's, from Berlin. Until last year nobody in London had seen it done.",
  ], { women: 0, note: "The exhibition had a working biological laboratory demonstrating Koch's culture methods under Watson Cheyne.", basis: "documented" }),
  londoner("lhe-physician", "Sanitary lecturer", "physician", "Showing people through the houses", "work", [
    "Count the faults in the first house. Most visitors find every one of them in their own home.",
    "That green paper is coloured with arsenic. Damp makes it give off a gas. It is in half the nurseries in London.",
  ], { women: 0, note: "The sanitary and insanitary houses were shown with numbered faults and attendants to explain them.", basis: "documented" }),
  londoner("lhe-plumber", "Sanitary engineer's man", "plumber", "Demonstrating a closet", "work", [
    "The trap holds two inches of water. That water is all that stands between your bedroom and the sewer.",
    "Pull the chain. Two gallons, and the pan is clean. The old pan closets never were.",
  ], { quiet: true, women: 0, note: "Makers demonstrated water closets flushing, often with glass pipes." }),
  londoner("lhe-engineer", "Engine minder", "engineer", "Tending the machinery", "work", [
    "She makes ninety turns a minute all day and I oil her every hour.",
    "Keep your coat-tails out of the belts, sir.",
  ], { quiet: true, women: 0, note: "Machinery in Motion was run under steam all day by the exhibitors' own men." }),
  londoner("lhe-electrician", "Electrician", "electrician", "Watching the dynamos", "work", [
    "Every lamp in the gardens runs off these. If a belt slips, the fountain goes dark and ten thousand people groan.",
    "Don't touch the brass. I mean it.",
  ], { women: 0, note: "The exhibition's electric lighting plant was the largest yet set up in London.", basis: "documented" }),
  londoner("lhe-schoolteacher", "Schoolteacher", "schoolteacher", "Explaining the classroom", "work", [
    "Light should fall from the left, so the hand does not shadow the page.",
    "Sixty children to a room is the Board's limit. I have had ninety.",
  ], { quiet: true, women: 0.6, note: "The School was a class of the exhibition; the London School Board showed its own practice." }),
  londoner("lhe-tailor", "Dress exhibitor", "tailor", "Showing the clothing", "work", [
    "Wool lets the skin breathe. That is the whole of Dr Jaeger's system.",
    "No, madam, there is no corset in it. That is the point.",
  ], { quiet: true, women: 0.4, note: "Jaeger's woollen clothing and the Rational Dress Society both exhibited.", basis: "documented" }),
  londoner("lhe-printer", "Printer in old dress", "printer", "Working the old press", "work", [
    "The press is real, and so is the heat in these hose.",
    "A ballad sheet for a penny, printed while you watch, as they did it before the Fire.",
  ], { women: 0, note: "Old London Street had craftsmen in period dress working in the houses.", basis: "documented" }),
  londoner("lhe-potter", "Potter", "potter", "Throwing jars", "work", [
    "It's a filter jar. Charcoal goes in the middle and the water comes out fit to drink.",
    "People would sooner watch the wheel than look at a hundred finished pots.",
  ], { women: 0, note: "Inferred: Doulton exhibited filters and stoneware; a working wheel is a guess." }),
  londoner("lhe-bath-attendant", "Bath attendant", "domestic-servant", "Showing the baths", "work", [
    "Hot and cold laid on, and the waste runs to a trapped drain. Feel the water.",
    "The geyser heats a bath in ten minutes. Mind you open the window when it's lit.",
  ], { quiet: true, women: 0.5, note: "Baths were shown plumbed and working." }),
  londoner("lhe-belgian", "Belgian exhibitor", "merchant", "Minding the Belgian stands", "work", [
    "Every commune in Belgium must keep a school now. We have sent you a whole classroom.",
    "Our stove burns small coal all night. Your open grates send the heat up the chimney.",
  ], { quiet: true, women: 0.1, note: "Belgium's was the largest foreign section, strong in school exhibits." }),
  // People who sell food and drink.
  londoner("lhe-baker", "Baker", "baker", "Baking", "work", [
    "No hand touches the dough from the sack to the oven. That's what the machine is for.",
    "Hot loaves every twenty minutes. A penny.",
  ], { women: 0, deal: sells("Buy a loaf", "bread", "The loaf is too hot to hold. He wraps it in a sheet of paper."), note: "Machine bakeries worked all day in the exhibition and sold what they baked.", basis: "documented" }),
  londoner("lhe-dairymaid", "Dairymaid", "dairymaid", "Working the dairy", "work", [
    "The separator does in a minute what the cream pan does in a day.",
    "This cheese was milk on Monday.",
  ], { women: 1, deal: sells("Buy a piece of cheese", "cheese", "She cuts a wedge with a wire and weighs it."), note: "Working dairies with cows, separators and churns were among the most popular exhibits.", basis: "documented" }),
  londoner("lhe-grocer", "Provision merchant's man", "grocer", "Selling from the stand", "work", [
    "Australian mutton, cooked in the tin. Sixpence a pound against a shilling at the butcher's.",
    "Open it, heat it, eat it. It has been two months at sea and is as good as the day it was sealed.",
  ], { quiet: true, women: 0.1, deal: sells("Buy a tin of meat", "tinned-food", "He hands you a tin with a sheep on the label and tells you how to open it."), note: "Tinned and preserved foods were a large part of the Food class." }),
  londoner("lhe-pieman", "Pieman", "confectioner", "Selling pies", "work", [
    "Hot pies! Mutton or eel. Mind, the gravy's scalding.",
    "I sell more by this door in a day than in a week on the Brompton Road.",
  ], { quiet: true, women: 0.1, deal: sells("Buy a pasty", "pasty", "He forks a pasty out of the tin box and puts it in your hand."), note: "Inferred: hot food was sold from stalls in the food galleries." }),
  londoner("lhe-brewer", "Brewer's man", "brewer", "Drawing ale", "work", [
    "Pure malt and hops, and the chemist's certificate is on the cask.",
    "The temperance people have the cocoa rooms. I have a queue.",
  ], { quiet: true, women: 0, deal: sells("Buy a glass of ale", "ale", "He draws it from the cask and wipes the glass on his apron first."), note: "Brewers exhibited in the Food class with analysts' certificates of purity." }),
  londoner("lhe-waiter", "Waiter", "waiter", "Waiting at table", "work", [
    "The cooks are from Peking. I only carry it, and I could not tell you what half of it is.",
    "Sixpence for three courses and not a scrap of meat. We serve hundreds a day.",
    "Pay at the desk as you go in, please. That's the system here.",
  ], { quiet: true, women: 0.2, note: "The exhibition's dining rooms ranged from sixpenny dinners to table d'hôte." }),
  londoner("lhe-cook", "Cookery teacher", "cook", "Giving a lesson", "work", [
    "Scrag end of mutton, an onion and a carrot: dinner for four for sixpence. Watch.",
    "My girls will go into service. A cook who can make a stew gets two pounds a year more.",
  ], { women: 1, note: "The National Training School for Cookery gave public lessons at the exhibition.", basis: "documented" }),
  londoner("lhe-tea-girl", "Girl at the counter", "domestic-servant", "Serving", "work", [
    "Cocoa, tea or coffee, a penny the cup. No, we don't serve beer.",
    "Take the cup back to the counter, please. We're short.",
  ], { quiet: true, women: 1, ages: [16, 30], deal: sells("Buy a flask of tea", "flask-tea", "She fills a flask from the urn and screws the top down."), note: "Temperance companies ran the cocoa rooms." }),
];

const VERSAILLES = { years: [1682, 1789] as [number, number] };
/** Who was at Versailles. */
const atCourt = (id: string, label: string, dress: string, doing: string, manner: SewerPerson["manner"], lines: string[], more: Partial<SewerPerson> & { note: string }): SewerPerson =>
  ({ id, scope: VERSAILLES, label, dress, doing, manner, lines, party: pair, women: 0.3, weight: 1, basis: "documented", ...more });
const versaillesPeople: SewerPerson[] = [
  atCourt("vrs-courtier", "Courtier", "landowner", "Waiting to be seen", "explore", [
    "I have a room under the roof the size of a cupboard, and I would not give it up for a château.",
    "If the King does not see you, you do not exist. So we stand here all day.",
    "He said of a man last week, 'I never see him.' That man is finished.",
    "My estate pays for all this. I have not seen my estate in four years.",
  ], { women: 0, quiet: true, weight: 3, ages: [18, 70], note: "Attendance at court was the price of favour; nobles lodged in small rooms in the palace and its outbuildings." }),
  atCourt("vrs-lady", "Lady of the court", "landowner", "Paying her court", "explore", [
    "A duchess may sit on a stool in front of the Queen. Everyone else stands. Families have fought for years over that stool.",
    "The windows are never opened and the fires smoke. You learn to carry scent.",
    "Cards three evenings a week in the King's rooms. I lost a year's rent on Tuesday.",
  ], { women: 1, quiet: true, weight: 2, ages: [17, 65], note: "The right to sit on a stool in the royal presence was a jealously kept privilege of duchesses." }),
  atCourt("vrs-visitor", "Visitor from Paris", "merchant", "Come to see the King dine", "explore", [
    "They let anyone in who is decently dressed. I hired the sword at the gate for a few sous.",
    "We came to watch him eat his dinner. You file past behind a rail. He ate four plates of soup.",
    "I thought there would be guards at every door. You can walk straight into the Hall of Mirrors.",
  ], { women: 0.3, quiet: true, weight: 2, ages: [20, 65], note: "The palace was open to any respectably dressed visitor; the public could watch the King dine at the grand couvert." }),
  atCourt("vrs-petitioner", "Petitioner", "clerk", "Carrying a petition", "explore", [
    "I have carried this petition for three weeks. It is about a pension my father was promised.",
    "They say if you can put it into his own hand as he walks to Mass, he reads it.",
  ], { women: 0.3, quiet: true, ages: [25, 65], note: "Petitions could be handed to the King on his way to chapel or left for his secretaries." }),
  atCourt("vrs-footman", "Footman", "domestic-servant", "Carrying a tray", "explore", [
    "Mind the tray. This is for the third table, and it is already cold.",
    "The King's meat walks a quarter of a mile from the kitchen with an armed guard. People bow to it.",
    "There are four thousand of us in livery. I have never been in the same room as him.",
  ], { women: 0.1, quiet: true, ages: [16, 50], note: "The King's dinner was carried in procession from the Grand Commun under guard, and saluted as it passed." }),
  atCourt("vrs-officer", "Officer of the Guards", "soldier", "Off duty", "explore", [
    "I bought this commission for more than my family's house. Now I wait for a war to earn it back.",
    "The Swiss have the gates and we have the doors. Nobody has the corridors.",
  ], { women: 0, quiet: true, ages: [20, 55], note: "Commissions were bought; the Swiss Guards kept the outer gates and the Gardes du corps the inner doors." }),
  atCourt("vrs-abbe", "Abbé", "religious-specialist", "Looking for a patron", "explore", [
    "Mass is at ten. The court faces the King's gallery, not the altar. I have stopped being shocked.",
    "A bishopric is in the King's gift. So here I am, with every other priest in France.",
  ], { women: 0, quiet: true, ages: [24, 70], note: "Court clergy sought benefices in the King's gift; at Mass the courtiers faced the royal tribune." }),
  atCourt("vrs-guard", "Guardsman", "soldier", "On guard", "lookout", [
    "No sword, no hat, no entry past this door. You can hire both at the gate.",
    "Monks, beggars and anyone marked by the smallpox are turned back. Everyone else walks in.",
  ], { women: 0, party: alone, ages: [20, 50], note: "Entry required only decent dress, a sword and a hat; monks, beggars and those freshly marked by smallpox were barred." }),
  atCourt("vrs-valet", "First valet of the bedchamber", "domestic-servant", "Guarding the rail", "work", [
    "Nobody passes the rail. Bow to the bed, please, as you cross.",
    "At eight I draw the curtain and say, 'Sire, it is time.' Then the doctors, then the family, then a hundred people watch him put on his shirt.",
  ], { women: 0, party: alone, ages: [30, 65], note: "The lever and coucher were public ceremonies ordered by rank; the first valet slept at the foot of the royal bed." }),
  atCourt("vrs-musician", "Musician of the Chamber", "musician", "Playing", "work", [
    "Monday, Wednesday and Thursday evenings: music, cards and a buffet in the King's rooms.",
    "Monsieur Couperin has the organ in the chapel. I have the harpsichord here, and a wage six months late.",
  ], { women: 0.2, party: alone, ages: [18, 60], note: "The 'appartement' evenings were held three times a week in the state rooms. Couperin was an organist of the chapel from 1693." }),
  atCourt("vrs-secretary", "Secretary's clerk", "civil-servant", "Sorting petitions", "work", [
    "Leave it on the table. They are read on Mondays. Do not ask me which Monday.",
    "Write it on one sheet. He will not turn a page.",
  ], { women: 0, party: alone, ages: [20, 60], note: "Inferred: petitions were read and annotated by the King's secretaries on set days." , basis: "inferred" }),
  atCourt("vrs-cook", "Officer of the kitchen", "cook", "Selling from the royal tables", "work", [
    "This came back from the King's own table an hour ago. Partridge, hardly touched.",
    "It is my right to sell what returns. It is half my wage.",
  ], { women: 0.1, party: alone, deal: sells("Buy a pasty", "pasty", "He cuts you a piece of cold game pasty off a silver dish that has seen better company."), note: "Kitchen officers had the right to sell dishes returned from the royal tables, from stalls by the palace." }),
  atCourt("vrs-sword-hirer", "Sword hirer", "street-hawker", "Hiring out swords and hats", "work", [
    "A sword and a hat, sir, and you are a gentleman until sunset.",
    "Bring it back by dark or I keep your deposit.",
  ], { women: 0, party: alone, ages: [25, 60], note: "Swords and hats were hired out at the gates to visitors who lacked them." }),
  atCourt("vrs-gardener", "Fountain keeper", "market-gardener", "Working the fountains", "work", [
    "There is not water enough for every fountain at once. We open each as the King walks toward it and shut it when he has passed.",
    "A boy runs ahead and whistles. That is the whole secret of the gardens.",
  ], { women: 0, party: alone, ages: [18, 60], note: "The water supply could not run all the fountains together; they were turned on in sequence ahead of the King's walk." }),
];

const person = (id: string, label: string, dress: string, doing: string, manner: SewerPerson["manner"], lines: string[], more: Partial<SewerPerson> & { note: string }): SewerPerson =>
  ({ id, scope: PARIS_1889, label, dress, doing, manner, lines, party: alone, women: 0.3, weight: 1, basis: "documented", ...more });

/** Who was at the 1889 fair. Their lines are plain modern English; the period is in what they say. */
export const fairPeople: readonly SewerPerson[] = [
  ...london,
  ...versaillesPeople,
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
