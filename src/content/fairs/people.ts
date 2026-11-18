import type { SewerPerson } from "../sewers/types";
import { chicagoPeople } from "./chicago-1893";

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
/** Who was in a palace between two years. */
const household = (years: [number, number]) => (id: string, label: string, dress: string, doing: string, manner: SewerPerson["manner"], lines: string[], more: Partial<SewerPerson> & { note: string }): SewerPerson =>
  ({ id, scope: { years }, label, dress, doing, manner, lines, party: pair, women: 0.3, weight: 1, basis: "documented", quiet: true, ...more });
const atPalace = household([1856, 1901]);
const buckinghamPeople: SewerPerson[] = [
  atPalace("bp-guest", "Guest at court", "landowner", "Waiting to be presented", "explore", [
    "My daughter is to be presented at three. She has practised the curtsey for a month with a tablecloth pinned on for a train.",
    "You kiss the Queen's hand, then you walk out backwards, in a train nine feet long, without looking round.",
    "We sat two hours in the carriage in the Mall with the crowd looking in at the windows.",
    "Since the Prince died she is hardly ever here. Half the year the house is under dust sheets.",
  ], { women: 0.6, weight: 3, ages: [18, 70], note: "Presentation at a Drawing Room, with court dress and train, marked a young woman's entry into society; after 1861 the Queen was seldom in residence." }),
  atPalace("bp-lady", "Lady in waiting", "landowner", "In attendance", "explore", [
    "I am in waiting one month in three. Mostly it is standing, and reading the newspapers aloud.",
    "No one sits until she sits. No one speaks to her first.",
  ], { women: 1, ages: [22, 65], note: "Ladies of the household served in rotation and were bound by the etiquette of standing and silence." }),
  atPalace("bp-equerry", "Equerry", "soldier", "On duty", "explore", [
    "I see to the carriages and horses, and to who rides in which. That last part is the hard one.",
    "The drains under this house were so bad the Prince had them rebuilt. You can still smell the kitchens upstairs.",
  ], { women: 0, ages: [28, 60], note: "Equerries were army officers of the household; Prince Albert reorganised the palace's notoriously poor drains and management in the 1840s." }),
  atPalace("bp-footman", "Footman", "domestic-servant", "Carrying a tray", "explore", [
    "We are picked by height and matched in pairs. I am five foot ten and paid less than the six-footers.",
    "Powder in the hair for state days. It is flour and soap, and it itches.",
    "Until the Prince sorted it out, one department laid the fire and another lit it, so nobody did either.",
  ], { women: 0, ages: [18, 45], note: "Footmen were hired and paid by height and wore powdered hair on state occasions; divided responsibility between household departments was reformed in the 1840s." }),
  atPalace("bp-housemaid", "Housemaid", "domestic-servant", "Between rooms", "explore", [
    "There are forty of us and we are not to be seen. If a guest comes, you face the wall.",
    "Six hundred rooms. I have been here two years and I still get lost.",
  ], { women: 1, ages: [16, 40], note: "Under-servants were expected to keep out of sight of the family and guests." }),
  atPalace("bp-page", "Page of the Presence", "domestic-servant", "Minding the door", "work", [
    "Sign the book, if you please. Name and address, clearly.",
    "A boy got in three times in the forties and slept under a sofa. They found him by the fingermarks on the bolster.",
  ], { women: 0, party: alone, ages: [25, 60], note: "'The boy Jones' broke into the palace repeatedly between 1838 and 1841." }),
  atPalace("bp-guardsman", "Guardsman", "soldier", "On sentry", "lookout", [
    "Two hours on, four off. You do not speak and you do not smile.",
    "The guard changes in the forecourt. People come to watch the band more than us.",
  ], { women: 0, party: alone, quiet: false, ages: [19, 40], note: "The Foot Guards mounted the Queen's Guard at the palace." }),
  atPalace("bp-musician", "Musician of the Queen's band", "musician", "Playing", "work", [
    "The Queen's private band: we play at dinner and for the dancing. She used to sing with us.",
    "Herr Mendelssohn played on this piano. The parrot screamed until someone carried it out.",
  ], { women: 0.1, party: alone, ages: [20, 60], note: "Mendelssohn's visits of 1842 are described in his own letters, parrot included." }),
];

const atWhiteHouse = household([1818, 1900]);
const whiteHousePeople: SewerPerson[] = [
  household([1859, 2026])("senate-clerk", "Senate clerk", "civil-servant", "Preparing the roll", "work", [
    "I'll read the names as soon as the vote begins.",
  ], { ages: [22, 65], note: "A composite Senate clerk.", basis: "inferred" }),
  household([1859, 2026])("senate-member", "Senator", "statesman", "Reading a bill", "work", [
    "I want to hear the amendment before I vote.",
  ], { ages: [30, 75], note: "A composite senator taking part in a floor debate.", basis: "inferred" }),
  household([1935, 2026])("wh-aide", "White House aide", "civil-servant", "Checking the schedule", "work", [
    "The next appointment is here. I'll bring the papers in.",
  ], { ages: [22, 65], note: "A composite member of the West Wing office staff.", basis: "inferred" }),
  atWhiteHouse("wh-caller", "Caller", "merchant", "Come to see the house", "explore", [
    "It is our house, so I walked in. Nobody asked my name.",
    "On reception days you stand in line, shake his hand and are out of the door in a minute.",
    "At Jackson's inauguration the crowd stood on the chairs in muddy boots. They got people out by putting the punch on the lawn.",
  ], { weight: 3, women: 0.4, ages: [18, 70], note: "The house was open to callers and public receptions through the century; the 1829 inaugural crowd is well recorded." }),
  atWhiteHouse("wh-office-seeker", "Office seeker", "clerk", "Waiting to see the President", "explore", [
    "I want the post office at home. I worked for the ticket, and that is how it is paid.",
    "I have sat on these stairs for nine days. There are forty of us.",
    "One of us shot Garfield over a consulship. After that they started setting exams.",
  ], { weight: 2, women: 0.05, ages: [22, 65], note: "Federal jobs were party rewards and applicants besieged each new President; Garfield's assassination in 1881 led to the civil service act of 1883." }),
  atWhiteHouse("wh-congressman", "Congressman", "landowner", "Come on business", "explore", [
    "I have six men from my district who want places, and he has one place.",
    "Congress votes the money to furnish this house, and then complains about the furniture.",
  ], { women: 0, ages: [30, 70], note: "Members of Congress pressed the claims of constituents for appointments; furnishing appropriations were regularly attacked." }),
  atWhiteHouse("wh-servant", "House servant", "domestic-servant", "Carrying a tray", "explore", [
    "The President pays the household out of his own salary. So there are not many of us.",
    "Before the war most of the people working in this house were owned by the men who lived in it.",
    "The kitchen is in the basement and the dining room is not. Everything arrives lukewarm.",
  ], { women: 0.4, ages: [16, 60], note: "Presidents paid domestic staff themselves; before 1865 many presidents staffed the house with enslaved people." }),
  atWhiteHouse("wh-secretary", "Private secretary", "civil-servant", "Sorting the mail", "work", [
    "There are two of us to open every letter that comes to the President. Most of them want a job.",
    "He sees anybody who waits long enough. I wish he would not.",
  ], { women: 0, party: alone, ages: [22, 50], note: "The President's office staff was a handful of private secretaries for most of the century." }),
  atWhiteHouse("wh-officer", "Army officer", "soldier", "Waiting with a dispatch", "explore", [
    "A dispatch from the War Department. It is next door; I walked.",
    "In the war there were soldiers camped in the East Room.",
  ], { women: 0, ages: [22, 55], note: "Troops were quartered in the East Room in April 1861." }),
  atWhiteHouse("wh-doorkeeper", "Doorkeeper", "domestic-servant", "At the north door", "work", [
    "Leave your card on the tray. If he is seeing people, go up; if not, come back tomorrow.",
    "I have kept this door for five Presidents. The callers are always the same.",
  ], { women: 0, party: alone, quiet: false, ages: [30, 70], note: "A doorkeeper at the north entrance received callers' cards; several served through many administrations." }),
  atWhiteHouse("wh-gardener", "Gardener", "market-gardener", "Working the grounds", "work", [
    "The south grounds are open. People bring their dinner on band days.",
    "There were sheep and a cow or two on this lawn before now. It saves mowing.",
  ], { women: 0, party: alone, ages: [20, 65], note: "The south grounds were public for concerts; livestock grazed the lawns at various dates. The cow is inferred from several administrations' household cows.", basis: "inferred" }),
  atWhiteHouse("wh-bandsman", "Marine bandsman", "musician", "Playing", "work", [
    "The Marine Band. We play here for receptions and on the lawn on Saturdays in summer.",
    "They call us the President's Own. We have played for every one of them since Jefferson.",
  ], { women: 0, party: alone, ages: [18, 55], note: "The Marine Band has played at the house since 1801 and gave public concerts on the south grounds." }),
];

const inBigHouse = household([-6000, -2001]);
const bigHousePeople: SewerPerson[] = [
  inBigHouse("nh-kin", "Kinsman", "farmer", "In from the fields", "explore", [
    "We cut and carried every post of this house. Forty people for a whole summer.",
    "When the barley failed two winters ago, we ate from his baskets. Now we owe him days at harvest.",
    "He has more cattle than anyone on this river. That is why people listen to him.",
  ], { weight: 3, women: 0.5, ages: [14, 60], basis: "inferred", note: "Inferred: big houses took communal labour to build; standing came from stored food, cattle and the debts of people fed in bad years." }),
  inBigHouse("nh-herder", "Herder", "herder", "Minding the cattle", "explore", [
    "The cattle come inside the fence at night. Men from up the valley took six last autumn.",
    "A bull was killed for the feast when the house was finished. Its skull is the one on the wall.",
  ], { women: 0.2, ages: [12, 55], basis: "inferred", note: "Inferred from cattle bone at feasting sites and palisaded enclosures of the period." }),
  inBigHouse("nh-potter", "Potter", "potter", "Coiling a jar", "work", [
    "Clay from the stream bank, crushed flint mixed in so it does not crack in the fire.",
    "The marks round the rim are my mother's marks. Anyone who sees the pot knows whose it is.",
  ], { women: 0.8, party: alone, ages: [16, 60], basis: "inferred", note: "Tempered, coil-built, bonfire-fired pottery with decoration particular to a community is documented; who made it is inferred." }),
  inBigHouse("nh-elder", "Elder", "healer", "Sitting by the fire", "explore", [
    "The green axe came to his father from the south, hand to hand. Nobody here has seen the mountain it is from.",
    "My grandmother's people hunted here before anyone planted. We are the ones who came with the seed.",
  ], { women: 0.5, ages: [45, 75], basis: "inferred", note: "Alpine jadeite axes were exchanged across western Europe; farming arrived with incoming groups. The speaker's account is invented." }),
  inBigHouse("nh-child-minder", "Child minder", "child-minder", "Minding the small ones", "explore", [
    "Six families sleep under this roof. Somebody has to count the children.",
    "Keep them away from the hearth and out of the grain. That is the whole of it.",
  ], { women: 0.8, ages: [12, 65], basis: "inferred", note: "Inferred: long houses are generally read as housing several related households." }),
];

const inHall = household([-2000, 1150]);
const meadHallPeople: SewerPerson[] = [
  inHall("mh-warrior", "Warrior of the household", "soldier", "At the benches", "explore", [
    "I eat his bread and sleep on his bench. When he fights, I stand in front of him. That is the bargain.",
    "He gave me this sword and an arm-ring. If I outlive him in a fight, I can never show my face here again.",
    "We leave our spears at the door. Knives stay on, for the meat.",
  ], { weight: 3, women: 0, ages: [16, 50], note: "The bond of lord and retainer, paid in food, gifts and a place in the hall, runs through the early medieval sources." }),
  inHall("mh-guest", "Guest", "landowner", "Come to speak to the lord", "explore", [
    "I hold land two days north. I came to ask for his daughter for my son, and I brought a horse.",
    "You are seated by your rank. Watch who sits nearest him and you know how things stand.",
  ], { women: 0.2, ages: [20, 65], note: "Seating by rank and gift exchange between households are well attested." }),
  inHall("mh-servant", "Servant", "servant", "Carrying the ale", "explore", [
    "The lady carries the cup to him first, then to each man in order. After that it is me and a jug.",
    "Forty men eat here every night. The farms send food as rent, and it is never enough by spring.",
  ], { women: 0.6, ages: [12, 55], note: "The lady's cup-bearing by rank appears in Beowulf; food rents supported a lord's household." }),
  inHall("mh-weaver", "Weaver", "weaver", "At the loom", "work", [
    "The stones keep the threads tight. You weave from the top down and beat the cloth upward.",
    "The hangings behind his seat took two of us a winter.",
  ], { women: 1, party: alone, ages: [14, 60], note: "The warp-weighted loom, with its clay or stone weights, was the standard loom of the period." }),
  inHall("mh-poet", "Poet", "musician", "Tuning a lyre", "work", [
    "I keep the names of his fathers, nine back, and what each one did. When I sing them, he pays me.",
    "A lord nobody sings about is forgotten in two generations. He knows that.",
  ], { women: 0, party: alone, ages: [20, 70], note: "Court poets who kept genealogies and praise were paid by their lords; lyres survive from several high-status graves." }),
];

const inDomus = household([-300, 480]);
const domusPeople: SewerPerson[] = [
  inDomus("rm-client", "Client", "clerk", "Come to pay his respects", "explore", [
    "I am here at dawn every day, in a toga, to say good morning. For that I get a few coins and I am asked to dinner twice a year.",
    "When he goes down to the Forum, thirty of us walk behind him. That is what we are for.",
    "My father was his father's client. You inherit it, like a debt.",
  ], { weight: 3, women: 0, ages: [18, 70], note: "The morning salutatio: clients called on their patron at dawn, received the sportula, and escorted him in public." }),
  inDomus("rm-slave", "Household slave", "servant", "Crossing the hall", "explore", [
    "There are forty of us in this house. He knows perhaps ten of our names.",
    "I was born here. My mother carries water; I carry the lamp in front of him at night.",
    "If he frees me in his will, I take his name and I am his client. That is the best I can hope for.",
  ], { weight: 3, women: 0.5, ages: [10, 60], note: "A wealthy household was staffed almost entirely by enslaved people; manumission made a freedman his former owner's client." }),
  inDomus("rm-freedman", "Freedman secretary", "scribe", "Keeping the accounts", "work", [
    "I keep his letters and his accounts. I was his slave for twenty years; now I am his freedman and do the same work.",
    "He dictates walking up and down. I take it on wax and copy it fair at night.",
  ], { women: 0, party: alone, ages: [25, 65], note: "Educated freedmen ran the correspondence and accounts of great houses." }),
  inDomus("rm-matrona", "Lady of the house", "landowner", "Seeing to the household", "explore", [
    "The keys are mine. Nothing leaves the storeroom without my say.",
    "My dowry is still mine in law. He has the use of it while we are married.",
  ], { women: 1, ages: [18, 60], note: "The materfamilias ran the household; under the marriage usual by the late Republic a wife's property stayed separate from her husband's." }),
  inDomus("rm-guest", "Guest", "landowner", "Waiting to be seen", "explore", [
    "I came about the election. Everyone in this hall has come about the election.",
    "The middle couch, the lowest place: that is the seat of honour. I have never been put there.",
  ], { women: 0.1, ages: [25, 70], note: "The place of honour at dinner was the lowest place on the middle couch, the locus consularis." }),
  inDomus("rm-tutor", "Greek tutor", "scribe", "Teaching the children", "explore", [
    "I teach the boys Greek and Homer. I was a free man in Athens until the war.",
    "The children speak better Greek than Latin. Their father thinks this is my fault, and he is right.",
  ], { women: 0, party: alone, ages: [25, 70], note: "Educated Greeks, many enslaved in war, taught the children of the Roman elite." }),
  inDomus("rm-cook", "Cook", "cook", "Sending in the dishes", "work", [
    "Eggs to start and apples to end, and between them whatever he wants people to talk about tomorrow.",
    "A good cook costs more than a horse now. My grandfather's master had the baker do the cooking.",
  ], { women: 0, party: alone, ages: [20, 60], note: "'From eggs to apples' was the proverbial course of a dinner; Livy dates the rise in the price and standing of cooks to the second century BC." }),
];

const inEgypt = household([-1550, -332]);
const egyptPeople: SewerPerson[] = [
  inEgypt("eg-scribe", "Scribe", "scribe", "Checking a tally", "work", [
    "Every jar that comes into this house is written down twice, once by me and once by a man who is paid to doubt me.",
    "I was at school from the age of five. The teacher said a boy's ears are on his back: he listens when he is beaten.",
  ], { weight: 2, women: 0, ages: [16, 65], note: "Palace administration ran on written accounts; the school texts praising the scribe's life over every other trade survive in many copies." }),
  inEgypt("eg-servant", "Palace servant", "servant", "Carrying a jar", "explore", [
    "I carry water from the garden pool to the bath room and I carry it out again. It is not hard work, and it is indoors.",
    "The floors are painted with ducks and reeds. We are told to walk round the edges.",
  ], { weight: 3, women: 0.5, ages: [12, 55], note: "Painted plaster floors with marsh scenes are known from the palaces at Malkata and Amarna." }),
  inEgypt("eg-guard", "Doorkeeper", "soldier", "Standing at a door", "lookout", [
    "Past me is the hall of columns. Past the hall is the throne. You stop where you are told to stop.",
    "Most of the guard are Nubians and men from the western desert. The king pays well and on time.",
  ], { women: 0, party: alone, ages: [18, 50], note: "Foreign troops, Nubian Medjay among them, served as palace and police guards in the New Kingdom." }),
  inEgypt("eg-official", "Official", "landowner", "Waiting for an audience", "explore", [
    "I govern a district twelve days upriver. I have been waiting here nine days to say so.",
    "When you come before him you put your forehead on the floor. Seven times is polite.",
  ], { women: 0.1, ages: [25, 70], note: "Letters to the king open with the formula of falling at his feet seven times and seven times." }),
];

const inPersia = household([-550, -330]);
const persiaPeople: SewerPerson[] = [
  inPersia("pe-guard", "Spearman of the guard", "soldier", "Standing in file", "lookout", [
    "There are ten thousand of us. When one dies another is put in his place the same day, so there are always ten thousand.",
    "The butt of my spear is a golden apple. The ones nearest the king have pomegranates.",
  ], { weight: 2, women: 0, ages: [18, 45], note: "Herodotus describes the ten thousand 'Immortals' and the golden apples and pomegranates on their spear butts." }),
  inPersia("pe-usher", "Usher", "clerk", "Deciding who goes in", "work", [
    "Nobody comes before the king unless I lead him in. You keep your hands in your sleeves and you do not speak first.",
    "Every nation brings what it is known for. The Indians bring gold dust. The Arabs bring a camel.",
  ], { women: 0, party: alone, ages: [25, 65], note: "The Persepolis reliefs show delegations of the subject peoples led in by ushers, each bringing its own gift." }),
  inPersia("pe-envoy", "Envoy with gifts", "merchant", "Waiting to be led in", "explore", [
    "We walked three months to bring him two rams and a bolt of cloth. It is the bringing that counts.",
    "They gave us bread, wine and a sheep a day on the road, and wrote it all down at every stop.",
  ], { weight: 2, women: 0, ages: [20, 60], note: "The Persepolis Fortification tablets record daily rations issued to travellers on the royal roads." }),
  inPersia("pe-servant", "Palace servant", "servant", "Carrying a covered dish", "explore", [
    "Fifteen thousand people eat from the king's kitchen every day. I have never seen him.",
    "He eats behind a curtain. He can see the guests and they cannot see him.",
  ], { weight: 2, women: 0.4, ages: [12, 55], note: "Greek writers reported the scale of the king's table and that he dined screened from his guests." }),
];

const inAegean = household([-2000, -1100]);
const aegeanPeople: SewerPerson[] = [
  inAegean("ae-scribe", "Tablet writer", "scribe", "Scratching a clay tablet", "work", [
    "This tablet says how many sheep the shepherd at the far village owes us. Next year I will crush it and write a new one.",
    "Oil, wool, bronze, chariot wheels. If the house owns it, somebody here has counted it.",
  ], { weight: 2, women: 0, ages: [16, 60], note: "The Linear B tablets are palace accounts of livestock, cloth, oil, bronze and personnel, kept on unbaked clay for a year at a time." }),
  inAegean("ae-servant", "Palace servant", "servant", "Carrying a jar of oil", "explore", [
    "The store rooms hold jars taller than I am, sunk in the floor. I fill the small jars from the big ones.",
    "The oil is boiled with herbs here and sold abroad as scent. The whole house smells of it.",
  ], { weight: 3, women: 0.6, ages: [12, 55], note: "Perfumed oil was a palace industry at Pylos, recorded in the tablets and shipped in stirrup jars." }),
  inAegean("ae-guard", "Follower of the king", "soldier", "Leaning on a spear", "lookout", [
    "I ride in a chariot behind the king when he goes out. The palace gave me the chariot and can take it back.",
    "My helmet is made of boars' tusks. It took thirty boars.",
  ], { women: 0, ages: [18, 50], note: "The tablets list chariots issued to named men, and 'followers' attached to the king; boar's tusk helmets survive." }),
  inAegean("ae-priestess", "Priestess", "landowner", "Come from the shrine", "explore", [
    "I hold land in the god's name and I am arguing with the village about the rent. The tablet writers are tired of both of us.",
    "At the feast the king pours the first cup on the floor, by the hearth. Then everyone may drink.",
  ], { women: 1, party: alone, ages: [25, 70], note: "A Pylos tablet records a land dispute between the priestess Eritha and the local community." }),
];

const inChina = household([1368, 1911]);
const chinaPeople: SewerPerson[] = [
  inChina("cn-eunuch", "Palace eunuch", "servant", "Carrying a message", "explore", [
    "There are several thousand of us. We open the doors, carry the meals, keep the accounts and hear everything.",
    "I was sold to the palace at nine. My family ate for two years on what they were paid.",
  ], { weight: 3, women: 0, ages: [12, 70], note: "Ming and Qing palaces were staffed by eunuchs in the thousands, mostly from poor families of the northern provinces." }),
  inChina("cn-official", "Official", "clerk", "Waiting for the audience", "explore", [
    "The audience is at dawn. We wait in the cold from three in the morning, in order of rank, and nobody coughs.",
    "I sat the examinations four times. The square on my robe is a crane, which means the first rank. My father was a farmer.",
  ], { weight: 2, women: 0, ages: [28, 75], note: "Officials were recruited by examination and ranked in nine grades shown by the bird on the badge of the robe; court audiences were held at dawn." }),
  inChina("cn-guard", "Guardsman", "soldier", "Standing at a gate", "lookout", [
    "Every gate has a tally. You show your half, I show mine, and if they do not fit you do not go in.",
    "Nobody but the emperor walks through the middle door. I have never seen it opened for anyone else.",
  ], { women: 0, ages: [18, 50], note: "Entry to the palace was by matching tallies, and the central gateway on the axis was reserved for the emperor." }),
  inChina("cn-maid", "Palace maid", "servant", "Carrying a tray", "work", [
    "We come in at thirteen and go home at twenty-five, if we are not noticed. Being noticed is not always good luck.",
    "The inner court is ours and the eunuchs'. No other man comes past the middle gate.",
  ], { weight: 2, women: 1, ages: [13, 30], note: "Qing palace maids were drawn from bannermen's families and released to marry in their twenties." }),
];

const inJapan = household([1580, 1868]);
const japanPeople: SewerPerson[] = [
  inJapan("jp-retainer", "Retainer", "soldier", "Kneeling in his place", "lookout", [
    "I draw eighty bales of rice a year for sitting here every third day. My grandfather earned it with a spear.",
    "The long sword stays at the door. The short one stays in my belt, and if I draw it in this house I die for it.",
  ], { weight: 3, women: 0, ages: [16, 65], note: "Samurai stipends were paid in rice; drawing a sword inside the shogun's palace was a capital offence." }),
  inJapan("jp-lord", "Visiting lord", "landowner", "Waiting to be received", "explore", [
    "How far up the room I may sit was settled before my grandfather was born. I am an outside lord, so I sit near the door.",
    "Every other year I live in the capital. My wife and my heir live there always. Nobody calls them hostages.",
  ], { women: 0, party: alone, ages: [20, 70], note: "Lords were seated by hereditary category, and under alternate attendance kept their families permanently in Edo." }),
  inJapan("jp-page", "Page", "servant", "Sliding a screen open", "work", [
    "You open a screen kneeling, with two hands, in three movements. I practised for a year before I was let near a guest.",
    "The floor in the corridor squeaks on purpose. Nobody walks up on his lordship quietly.",
  ], { weight: 2, women: 0.2, ages: [12, 30], note: "The 'nightingale floors' of Nijo Castle sound underfoot; whether that was intended is argued over." }),
  inJapan("jp-lady", "Lady-in-waiting", "landowner", "Come from the inner rooms", "explore", [
    "The inner rooms are run by women, and a man who is not the lord needs leave to come in.",
    "I arrange the alcove each morning: one scroll, one branch. Two branches would be loud.",
  ], { women: 1, party: alone, ages: [18, 60], note: "The private quarters of a great household were administered by its women; the alcove display of scroll and flowers was a formal art." }),
];

const atCastle = household([1151, 1520]);
const castlePeople: SewerPerson[] = [
  atCastle("gc-guard", "Man-at-arms", "soldier", "On watch at a door", "lookout", [
    "I am paid by the quarter, fed at the lower tables and given a coat in the king's colours once a year.",
    "Nobody comes armed past the great chamber door. I take the swords and I give them back.",
  ], { weight: 2, women: 0, ages: [18, 55], note: "Royal and noble households retained paid men-at-arms in livery; ordinances regulated who might go armed within the court." }),
  atCastle("gc-usher", "Usher of the hall", "servant", "Seating people by rank", "work", [
    "I know every man's rank and where it puts him at table. A mistake at dinner is remembered for years.",
    "Two meals a day for three hundred people. What is left goes out at the gate to the poor, and they know the hour.",
  ], { weight: 3, women: 0.1, ages: [14, 60], note: "Household ordinances set out seating by rank in hall and the giving of broken meats as alms at the gate." }),
  atCastle("gc-clerk", "Clerk of the household", "scribe", "Writing up the day's account", "work", [
    "Every loaf and every candle is written down each night and added up each week. The king's house runs on parchment.",
    "I am in minor orders, which means I can read, and that I may not marry. One of those I regret.",
  ], { women: 0, party: alone, ages: [18, 65], note: "Daily household accounts survive from many late medieval courts; their clerks were usually in minor orders." }),
  atCastle("gc-lady", "Lady of the chamber", "landowner", "Come from the queen's rooms", "explore", [
    "I wait on the queen: I hold what she hands me and I hear what she does not say aloud.",
    "My husband has an office here because of me, not the other way about.",
  ], { women: 1, party: alone, ages: [16, 60], note: "Ladies and damsels of the queen's chamber were salaried members of the household and channels of patronage." }),
];

const atDivan = household([700, 1900]);
const divanPeople: SewerPerson[] = [
  atDivan("is-guard", "Palace guard", "soldier", "Standing at a gate", "lookout", [
    "I was bought as a boy, trained in the barracks and freed into the guard. I have no family but the men beside me.",
    "Past the second gate nobody rides, nobody shouts, and nobody goes further without being sent for.",
  ], { weight: 2, women: 0, ages: [18, 50], note: "Slave soldiers, bought young and trained in the ruler's household, formed palace guards from Abbasid Baghdad to Ottoman Istanbul." }),
  atDivan("is-eunuch", "Eunuch of the household", "servant", "Carrying a message inward", "explore", [
    "I can go where the guards cannot and where the women cannot. Every message between the two halves of this house passes through me.",
    "The chief of us answers only to the ruler, and holds the keys to the inner gate.",
  ], { weight: 2, women: 0, ages: [14, 70], note: "Eunuchs guarded the boundary between the public and private quarters, and the chief eunuch was among the great officers of the court." }),
  atDivan("is-secretary", "Secretary", "scribe", "Drafting a decree", "work", [
    "The decree must be in the correct hand, with the correct titles in the correct order, or it is not a decree.",
    "The council sits four mornings a week. Anyone may bring a complaint, and it is my job to write it shorter.",
  ], { weight: 2, women: 0, ages: [20, 70], note: "Chancery secretaries were trained in prescribed scripts and formulas; council sessions heard petitions from subjects." }),
  atDivan("is-petitioner", "Petitioner", "merchant", "Waiting with a paper in his hand", "explore", [
    "The tax farmer took twice what was owed. I have come two hundred miles to say so, and I will wait as long as it takes.",
    "You hand it to the secretary, the secretary reads it to the council, and the ruler listens from behind a grille. You never know if he is there.",
  ], { weight: 2, women: 0.1, ages: [20, 70], note: "Subjects could petition the ruler's council directly; at the Ottoman court the sultan might listen unseen from a screened window." }),
  atDivan("is-lady", "Woman of the household", "landowner", "Crossing the inner court", "explore", [
    "The ruler's mother runs this side of the house. She has her own income, her own secretary, and the last word.",
    "We are taught to read, to sew, to play and to keep accounts. Some of us leave to be married to governors.",
  ], { women: 1, ages: [14, 60], note: "The harem was a household with its own hierarchy and training, headed in the Ottoman case by the sultan's mother." }),
];

const atTecpan = household([1325, 1521]);
const tecpanPeople: SewerPerson[] = [
  atTecpan("az-guard", "Warrior of the guard", "soldier", "Standing with a shield", "lookout", [
    "I have taken four captives, so I may wear this lip plug and stand in this court. A man who has taken none carries loads.",
    "You go barefoot before him, in a plain cloak, with your eyes down. Even the great lords do.",
  ], { weight: 2, women: 0, ages: [18, 50], note: "Rank among Mexica warriors followed the number of captives taken; all who came before the ruler did so barefoot and plainly dressed." }),
  atTecpan("az-steward", "Steward", "clerk", "Checking a tribute list", "work", [
    "Four hundred loads of cloaks from this province every eighty days. If it is short, I am the one who walks there to ask why.",
    "The storehouses feed the palace, the army and the city in a bad year. The count is kept in pictures.",
  ], { weight: 2, women: 0, ages: [25, 65], note: "Stewards (calpixque) collected provincial tribute on fixed schedules recorded in painted registers such as the Matrícula de Tributos." }),
  atTecpan("az-painter", "Painter of books", "scribe", "Painting a folded book", "work", [
    "Red and black: that is what we call knowing things. I paint the tribute, the days and the lines of the families.",
    "My father taught me the signs. There are no letters. You have to know what you are looking at.",
  ], { women: 0.1, party: alone, ages: [18, 65], note: "The tlacuilo painted screenfold records; 'the red, the black' was the Nahuatl phrase for writing and wisdom." }),
  atTecpan("az-servant", "Palace servant", "servant", "Carrying a covered dish", "explore", [
    "Three hundred dishes are set out for him at each meal, on little braziers to keep them warm. He picks a few. The court eats the rest.",
    "After he eats he drinks chocolate, beaten to a foam, from a gold cup. I have carried it. I have never tasted it.",
  ], { weight: 3, women: 0.6, ages: [12, 55], note: "Spanish eyewitnesses described the hundreds of dishes kept warm for Moctezuma and the foamed cacao served after." }),
];

const atKancha = household([1400, 1533]);
const kanchaPeople: SewerPerson[] = [
  atKancha("in-guard", "Guard of the Inca", "soldier", "Standing at the gate", "lookout", [
    "The guard is drawn from the peoples he trusts. My village sends ten men every year, as its tax.",
    "Nobody looks at him. You come in with a load on your back, however great you are, to show you are his.",
  ], { weight: 2, women: 0, ages: [18, 50], note: "Labour, including guard service, was the Inca tax; those approaching the ruler carried a token burden and kept their eyes lowered." }),
  atKancha("in-quipu", "Keeper of the knots", "scribe", "Running cords through his fingers", "work", [
    "This cord is llamas, this one maize, this one men fit to fight. Colour tells you what, the knots tell you how many.",
    "I can read you every storehouse from here to the sea. If my count is wrong, I answer for it with my life.",
  ], { weight: 2, women: 0, party: alone, ages: [25, 70], note: "Khipukamayuq kept the state's decimal accounts on knotted cords; the system recorded numbers and categories without writing." }),
  atKancha("in-aclla", "Chosen woman", "weaver", "Weaving at a loom", "work", [
    "I was chosen at ten and brought here. We weave the cloth he wears once and then burns, and we brew the maize beer for the feasts.",
    "Some of us are given as wives to lords he wants to bind. I may go; I may weave here until I am old.",
  ], { weight: 2, women: 1, ages: [10, 60], note: "The aqllakuna were selected girls who wove fine cumbi cloth and brewed chicha for the state; some were given in marriage as royal favours." }),
  atKancha("in-servant", "Servant for life", "servant", "Carrying a jar", "explore", [
    "I belong to his house, not to a village. I pay no tax, I own no land, and my children will serve his children.",
    "When he dies he keeps this house, his servants and his lands. The new Inca has to build his own.",
  ], { weight: 3, women: 0.4, ages: [12, 60], note: "Yanakuna were hereditary retainers outside the village system; a dead ruler's estate stayed with his mummy and lineage." }),
];

export const fairPeople: readonly SewerPerson[] = [
  ...chicagoPeople,
  ...london,
  ...versaillesPeople,
  ...buckinghamPeople,
  ...whiteHousePeople,
  ...bigHousePeople,
  ...meadHallPeople,
  ...domusPeople,
  ...egyptPeople,
  ...persiaPeople,
  ...aegeanPeople,
  ...chinaPeople,
  ...japanPeople,
  ...castlePeople,
  ...divanPeople,
  ...tecpanPeople,
  ...kanchaPeople,
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
