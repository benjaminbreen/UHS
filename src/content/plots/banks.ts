import { fillIn, neighbours, notable, partnerWords, pickOf, pronounWords, seasonOf, within } from "./common";
import type { Condition, PlotContext, PlotTemplate } from "./types";

type Box = readonly [number, number, number, number];
const PARAGUAY: Box = [-62, -27, -54, -19];
const URUGUAY: Box = [-58, -35, -53, -30];
const GERMANY = { years: [1923, 1924], bounds: [5.8, 47.2, 15.1, 55.1], except: [[12.5, 48.5, 19, 50.9]] } as const;
const HOLIDAY = { years: [1933, 1934], bounds: [-125, 24.5, -66.9, 49] } as const;
const COLLOR = { years: [1990, 1991], bounds: [-70, -34, -34.8, 5.3], except: [PARAGUAY, URUGUAY, [-69.7, -22.9, -57.5, -9.7]] } as const;
const AUSTRAL = { years: [1989, 1990], bounds: [-69, -41, -57, -22], except: [PARAGUAY] } as const;
const MONTEVIDEO = { years: [2002, 2003], bounds: URUGUAY } as const;
const CORRALITO = { years: [2001, 2002], bounds: [-69, -41, -57, -22], except: [PARAGUAY] } as const;
const RUBLE = { years: [1998, 1999], bounds: [27, 41, 180, 78], except: [[22, 44.3, 35, 52.4], [23, 51.2, 31, 56.2]] } as const;
const ZIMBABWE = { years: [2008, 2009], bounds: [25.2, -22.4, 33.1, -15.6] } as const;
const CYPRUS = { years: [2013, 2014], bounds: [32.2, 34.5, 34.7, 35.8] } as const;
const GREECE = { years: [2015, 2016], bounds: [19.3, 34.7, 26.7, 41.8], except: [[19.3, 40, 20.8, 42], [20.5, 41.35, 26, 42], [20.7, 40.85, 22.5, 41.35], [26, 40.3, 27, 42]] } as const;
const LEBANON = { years: [2019, 2022], bounds: [35.1, 33.05, 36.62, 34.69] } as const;
const CRISES = [GERMANY, HOLIDAY, COLLOR, AUSTRAL, MONTEVIDEO, CORRALITO, RUBLE, ZIMBABWE, CYPRUS, GREECE, LEBANON];
// The sudden ones came in one season: March 1933, March 1990, December 2001, August 1998, March 2013, June 2015.
const SUDDEN = new Map<object, string>([[HOLIDAY, "spring"], [COLLOR, "autumn"], [CORRALITO, "summer"], [RUBLE, "summer"], [CYPRUS, "spring"], [GREECE, "summer"]]);

const castOf = (c: PlotContext) => {
  const patron = notable(c);
  const pool = neighbours(c).filter((a) => a.householdId !== patron?.householdId);
  const friend = pool.length ? pickOf(c, pool, "banks-friend") : undefined;
  return patron && friend && { patron, friend };
};

const fired = (id: string): Condition => ({ type: "fired", id });

/** The money stops working: the banks shut their doors, or the currency melts
 * faster than wages can be spent, and every household has to decide what to do with what it has. */
export const banks: PlotTemplate = {
  id: "banks",
  shape: "news",
  look: {
    emblem: "queue",
    palette: { ink: "#10120f", fill: "#2c3430", edge: "#6a6450", light: "#ecebe2", accent: "#c8a848" },
  },
  weight: (c) => (CRISES.some((k) => within(c, k) && (SUDDEN.get(k) ?? seasonOf(c)) === seasonOf(c)) && castOf(c) ? 0.9 : 0),
  cast: (c) => castOf(c),
  begin: (c, cast) => {
    const patron = cast.patron!, friend = cast.friend!;
    const p = partnerWords(c);
    const pr = pronounWords(friend);
    const midnight = Math.floor(c.clock / 86400) * 86400;
    return {
      deadline: midnight + 22 * 3600,
      words: {
        patron: patron.name,
        friend: friend.name,
        need: fillIn(pickOf(c, ["the rent", "{his} mother's medicine", "the children's school shoes", "the electricity bill"], "banks-need"), pr),
        His: pr.his.replace(/^./, (x) => x.toUpperCase()),
        ...pr,
        ...p.words,
      },
      refs: { patron: patron.id, friend: friend.id, ...p.refs },
    };
  },
  opening: [{ type: "choose", line: "news", focus: "patron", brought: true, choices: [{ id: "queue" }, { id: "change", check: { stat: "wit", odds: 0.55 } }, { id: "spend" }] }],
  developments: [
    { id: "door", when: { type: "after", id: "queue", hours: 2 }, then: [{ type: "choose", line: "door", focus: "patron", choices: [{ id: "take" }, { id: "stay" }] }] },
    {
      id: "ask",
      when: { type: "all", of: [{ type: "since", hours: 3 }, { type: "any", of: [fired("change"), fired("spend"), fired("take"), fired("stay")] }] },
      then: [{ type: "choose", line: "ask", focus: "friend", from: "friend", choices: [{ id: "lend" }, { id: "refuse" }] }],
    },
    { id: "thanked", when: fired("lend"), then: [{ type: "regard", role: "friend", delta: 2 }] },
    { id: "cooled", when: fired("refuse"), then: [{ type: "regard", role: "friend", delta: -1 }] },
  ],
  endings: [
    { id: "lent", when: fired("lend") },
    { id: "refused", when: fired("refuse") },
    { id: "gone", when: { type: "gone", role: "friend" } },
    { id: "passed", when: { type: "due" } },
  ],
  wording: [
    {
      // By autumn 1923 German prices doubled every few days; firms paid wages daily, and families ran to spend them before the next rise.
      scope: GERMANY,
      title: "The Mark Is Worthless",
      lines: {
        intro: "In the spring a loaf of bread cost a few thousand marks. This morning it costs two hundred million. The shops change the prices in their windows twice a day.",
        threat: "Money loses half its value in a few days. Whatever you earn has to be spent the same day, and money that was saved is worth nothing.",
        partner: "Your {partnerKin} {partner} wants to meet you at the works gate at noon and take the wages straight to the shops.",
        "kin-partner": "Get paid and get it spent before the afternoon prices go up.",
        "cast-patron": "Has dollars put away, and is doing better than anyone else on the street.",
        "cast-friend": "Was paid this morning, in money that was already worth less by noon.",
        news: "{patron} says the dollar went up again overnight. The savings bank is still open, and your book says the household has ten thousand marks in it, years of putting money by. Before the war that would have bought a house.",
        "queue:label": "Draw the savings out and see what they buy",
        "queue:then": "You stand in line at the savings bank with everyone else who still has a savings book.",
        door: "The clerk pays out your ten thousand marks without bothering to count them. They won't buy a postage stamp. Behind you a man is shouting that he saved for thirty years.",
        "take:label": "Take the notes and go",
        "take:then": "You put the notes in your pocket. Outside, children are building towers out of bundles of them.",
        "stay:label": "Stand with the people shouting at the clerks",
        "stay:then": "The shouting goes on until the police come and clear the hall. Nobody gets anything more.",
        "change:label": "Trade your good coat to {patron} for dollars",
        "change:then": "{patron} looks the coat over and counts out two dollar bills. Two dollars will still be two dollars next week.",
        "change:failed": "{patron} gives you one dollar for the coat. In the evening you find out it was worth three.",
        "spend:label": "Spend everything on things that keep: potatoes, soap, coal",
        "spend:then": "You spend it all before noon. By the time you get home, the same sack of potatoes costs a third more.",
        ask: "{friend} comes to the door. {He} was paid this morning, and by the time {he} reached the shop the money bought half what it did at breakfast. {He} can't pay {need}.",
        "lend:label": "Give {him} some of what you have",
        passed: "The day ends. Tomorrow the prices will be higher again.",
      },
    },
    {
      // Roosevelt closed every bank in the country on 6 March 1933; when they reopened on the 13th, more was paid in than taken out.
      scope: HOLIDAY,
      title: "The Bank Holiday",
      lines: {
        intro: "The bank on the corner hasn't opened. There's a notice on the door: by order of the President, every bank in the country is closed for a bank holiday. Nobody knows when they'll open again, or if this one will.",
        threat: "Thousands of banks have failed in the last three years, and the people with money in them lost all of it.",
        partner: "Your {partnerKin} {partner} wants to know how much cash is in the house.",
        "kin-partner": "How much do we have in the house? Count it.",
        "cast-patron": "Runs the store on the corner, and is deciding whose credit is still good.",
        "cast-friend": "Had all {his} savings in the bank that's closed.",
        news: "There's a crowd outside the bank, and {patron} has put a sign in the store window: no checks. Your household has six dollars in the house and everything else in the bank.",
        "queue:label": "Wait outside the bank with the others",
        "queue:then": "You join the crowd on the bank steps. Some of them have been there since dawn.",
        door: "Around noon a man from the bank comes out and reads a statement. The bank will open when the government examiners have been through its books. It might not open at all.",
        "take:label": "Go home and wait for the President's radio talk",
        "take:then": "You go home. That evening the whole street listens to the President on the radio, saying money is safer in a reopened bank than under the mattress.",
        "stay:label": "Stay on the steps in case the doors open",
        "stay:then": "You stay with the crowd until dark. The doors don't open, and a policeman tells everyone to go home.",
        "change:label": "Sell your paycheck to {patron} for cash",
        "change:then": "{patron} cashes it for ninety cents on the dollar. It's a loss, but it's cash.",
        "change:failed": "{patron} will only give seventy cents on the dollar, and you take it, because there's nowhere else to go.",
        "spend:label": "Ask {patron} to let you have groceries on credit",
        "spend:then": "{patron} writes your name in the credit book. Half the street is in there already.",
        ask: "{friend} stops you in the street. Everything {he} had was in the bank, and {he} has nothing for {need}.",
        "lend:label": "Lend {him} some of the cash in the house",
        passed: "The day ends with the banks still shut. The President says they'll start to open on Monday.",
      },
    },
    {
      // On 16 March 1990 the Collor Plan froze savings above 50,000 cruzados novos for eighteen months.
      scope: COLLOR,
      title: "The Savings Are Frozen",
      lines: {
        intro: "The new president went on television last night. Everyone's savings are frozen: you can take out fifty thousand, and the government keeps the rest for eighteen months. The money has a new name, the cruzeiro.",
        threat: "Prices had been going up by eighty percent a month. Nobody knows what the frozen money will be worth when it comes back.",
        partner: "Your {partnerKin} {partner} can't stop adding up what's stuck in the bank.",
        "kin-partner": "Eighteen months. What do we live on for eighteen months?",
        "cast-patron": "Owns the bakery, and has more money stuck in the bank than anyone.",
        "cast-friend": "Had {his} savings in the bank, put by for a flat of {his} own.",
        news: "The banks were shut for three days and have just reopened. The lines go round the block. {patron} says the president has robbed everyone in Brazil.",
        "queue:label": "Line up to take out the fifty thousand you're allowed",
        "queue:then": "You join the line. It moves a step every few minutes.",
        door: "At the counter the clerk tells you what everyone else has been told: fifty thousand and no more. The rest stays frozen. A woman behind you starts to cry.",
        "take:label": "Take the fifty thousand",
        "take:then": "You go home with what they'll let you have, and work out how long it will last.",
        "stay:label": "Stay with the people refusing to leave the bank",
        "stay:then": "Nobody leaves for an hour. Then the manager calls the police, and everybody leaves.",
        "change:label": "Buy dollars on the black market, the dólar paralelo",
        "change:then": "A man at a travel agency changes your cash at the street rate. Dollars won't be frozen.",
        "change:failed": "Afterwards you see the rate posted in a window across the street. He gave you a good deal less.",
        "spend:label": "Spend the cash on rice, beans and oil",
        "spend:then": "You spend the cash at the market. Whatever happens to the money, the household will eat this month.",
        ask: "{friend} comes round. {His} wages are stuck in the bank like everyone's, and {he} can't pay {need}.",
      },
    },
    {
      // In 1989 Argentine inflation passed 3,000 percent; in May hungry crowds looted supermarkets in Rosario and Greater Buenos Aires.
      scope: AUSTRAL,
      title: "Prices by the Hour",
      lines: {
        intro: "Prices are going up every few hours. In the supermarket, boys with pricing guns go along the shelves putting new labels over the old ones.",
        threat: "The austral loses value every day. If you're paid in australes, you have to spend them before tomorrow.",
        partner: "Your {partnerKin} {partner} wants the wages spent before the shops close.",
        "kin-partner": "Don't keep the money overnight. It won't be worth anything.",
        "cast-patron": "Keeps savings in dollars, and watches the exchange boards.",
        "cast-friend": "Is paid at the end of the month, which this month is a disaster.",
        news: "{patron} says the dollar went up again overnight. Your wages came this morning, in australes.",
        "queue:label": "Line up at the bank to get your savings out",
        "queue:then": "You join the line at the bank. Everyone in it is doing the same sums.",
        door: "The bank pays out what you ask for. By the time you're back on the street, the exchange houses have changed their boards again.",
        "take:label": "Take the cash and spend it fast",
        "take:then": "You go straight to the market and spend it on whatever will keep.",
        "stay:label": "Complain to the manager with the others",
        "stay:then": "The manager says it's the government, not the bank. He's right, and it doesn't help.",
        "change:label": "Change the wages into dollars at the exchange house",
        "change:then": "You change the wages into dollars. They go in an envelope under the mattress.",
        "change:failed": "The board changes while you're in the queue, and your wages buy fewer dollars than they would have an hour ago.",
        "spend:label": "Spend the wages on groceries before the prices change",
        "spend:then": "You fill bags with rice, oil and tins. At the checkout, the price of the oil has already gone up.",
        ask: "{friend} comes round. {His} wages ran out a week ago, and {he} can't pay {need}.",
      },
    },
    {
      // At the end of July 2002, after a run on its banks set off by Argentina's crisis, Uruguay closed them for five days.
      scope: MONTEVIDEO,
      title: "The Banks Are Closed",
      lines: {
        intro: "The banks didn't open this morning. The government has closed them for the rest of the week. Since January, almost half the money in the country's banks has been taken out.",
        threat: "Nobody with savings in the closed banks knows whether they'll see them again.",
        partner: "Your {partnerKin} {partner} wants to know how much cash is in the house.",
        "kin-partner": "How much cash do we have? Count it.",
        "cast-patron": "Runs the shop on the corner, and has stopped giving credit.",
        "cast-friend": "Had all {his} savings in one of the banks that's shut.",
        news: "There are people outside every branch, banging on the glass. {patron} says that across the river, in Argentina, people have been living like this since December.",
        "queue:label": "Wait outside the bank in case it opens",
        "queue:then": "You join the crowd outside the branch. A notice on the door gives the decree number and nothing else.",
        door: "The doors don't open. A man in a suit tells the crowd through the glass that the bank will reopen on Monday.",
        "take:label": "Go home and wait",
        "take:then": "You go home. On the radio they are talking about a loan from the United States.",
        "stay:label": "Stay and bang on the glass with the others",
        "stay:then": "You stay. Nobody comes out again.",
        "change:label": "Change pesos into dollars on the street",
        "change:then": "A man in a doorway changes your pesos into dollars. The rate is bad, but dollars are dollars.",
        "change:failed": "Later you look again at the bill he gave you. It's a fake.",
        "spend:label": "Spend the cash you have on food that keeps",
        "spend:then": "You fill a bag with rice, noodles, oil and yerba. Everyone else in the shop is doing the same.",
        ask: "{friend} comes round. {His} money is in a bank that's shut, and {he} has nothing for {need}.",
      },
    },
    {
      // From 1 December 2001 bank withdrawals were capped at 250 pesos a week; on 19 and 20 December the pot-banging cacerolazos helped bring down the government.
      scope: CORRALITO,
      title: "The Corralito",
      lines: {
        intro: "You can only take 250 pesos a week out of the bank. People call it the corralito, the little pen. Your wages go into an account you can't empty.",
        threat: "People say the peso won't stay at one dollar much longer. Anyone with savings in dollars is afraid they'll get them back in pesos.",
        partner: "Your {partnerKin} {partner} wants to bang a pot on the balcony tonight with everyone else.",
        "kin-partner": "Everyone's going out with pots tonight. Are you coming?",
        "cast-patron": "Kept dollars at home, under the floor, and isn't sorry now.",
        "cast-friend": "Has all {his} savings in a dollar account at the bank.",
        news: "There's a line round the block at the bank again. {patron} says the arbolitos, the money changers on the street, are paying more for dollars every day. Tonight people are going to bang pots and pans against the government.",
        "queue:label": "Line up at the bank for this week's 250",
        "queue:then": "You join the line. Someone at the front says the cash machines are already empty.",
        door: "You reach the teller at half past two. The 250 pesos are paid out, and the rest stays in the account. Someone behind you is banging on the glass.",
        "take:label": "Take the 250 and go",
        "take:then": "You take the 250 and work out how far it has to go.",
        "stay:label": "Bang a pot outside the bank with the others",
        "stay:then": "By evening the whole street is out with pots and pans, the cacerolazo, and the noise comes from every balcony in the city.",
        "change:label": "Change pesos into dollars with an arbolito",
        "change:then": "A man saying \"cambio, cambio\" under his breath changes your pesos into dollars in a doorway.",
        "change:failed": "Back home you look again at the hundred-dollar bill he gave you. It's a fake.",
        "spend:label": "Spend the pesos on things before they're worth less",
        "spend:then": "You spend what you have on tins, oil and flour. The shelves are already thinning out.",
        ask: "{friend} comes round. {His} savings are stuck in the corralito, and 250 a week won't cover {need}.",
        passed: "The day ends with the sound of pots from every balcony.",
      },
    },
    {
      // On 17 August 1998 Russia defaulted on its debts; within a month the ruble fell from six to the dollar to more than twenty.
      scope: RUBLE,
      title: "The Ruble Falls",
      lines: {
        intro: "The government has stopped paying its debts, and the ruble is falling. The boards outside the exchange booths change every hour. Some banks have stopped paying out at all.",
        threat: "People remember 1992, when savings were wiped out overnight. Nobody wants to wait and see if it happens again.",
        partner: "Your {partnerKin} {partner} wants to buy sugar and flour before the shops run out.",
        "kin-partner": "Buy sugar. Buy flour. Buy anything that keeps.",
        "cast-patron": "Has kept savings in dollars since 1992.",
        "cast-friend": "Hasn't been paid for three months.",
        news: "{patron} says two of the biggest banks have shut their doors and more will follow. The shops are emptying: people are buying sugar, flour and anything imported before the prices catch up.",
        "queue:label": "Go to the bank and try to get your savings out",
        "queue:then": "A guard at the bank door lets ten people in at a time. You join the line outside.",
        door: "The bank is paying out a fixed sum a day to each customer, in rubles, at last week's rate. The rest, the clerk says, will be paid later.",
        "take:label": "Take what they'll give",
        "take:then": "You take it and go straight to the exchange booth.",
        "stay:label": "Wait outside in case they pay more later",
        "stay:then": "You wait until closing. The doors are locked at six, and the guard says to come back tomorrow.",
        "change:label": "Change rubles into dollars at an exchange booth",
        "change:then": "You push your rubles under the glass and get dollars back. By evening the rate is worse.",
        "change:failed": "The booth changes its rate while you're counting out your rubles, and you get fewer dollars than the board said.",
        "spend:label": "Buy sugar, flour and tins before the prices go up",
        "spend:then": "You carry home as much as you can. In the afternoon the shop puts up new price labels.",
        ask: "{friend} comes round. {He} still hasn't been paid, and has nothing for {need}.",
      },
    },
    {
      // In November 2008 Zimbabwe's inflation reached 79.6 billion percent a month; in January the Reserve Bank issued a hundred-trillion-dollar note.
      scope: ZIMBABWE,
      title: "Billions for a Loaf",
      lines: {
        intro: "Bread costs billions of Zimbabwe dollars this week. The banks only let you take out a little cash a day, and it's worth less by the time you reach the front of the line.",
        threat: "The shops are half empty. Anything with a price on it is gone by the afternoon.",
        partner: "Your {partnerKin} {partner} says to get to the bank before it runs out of cash.",
        "kin-partner": "There's no point keeping Zimbabwe dollars. Spend them or change them.",
        "cast-patron": "Sells things for South African rand and US dollars.",
        "cast-friend": "Is paid in Zimbabwe dollars, and a month's pay won't buy a week's maize meal.",
        news: "People slept outside the bank last night to be first in line for today's cash. {patron} is selling goods for rand and US dollars, which is against the law, but it's what everyone wants.",
        "queue:label": "Line up for today's cash withdrawal",
        "queue:then": "You join the end of the line, behind people who slept on the pavement.",
        door: "After five hours you reach the counter. The daily limit buys two loaves of bread. The teller says the limit might go up next week.",
        "take:label": "Take it and buy bread",
        "take:then": "You buy the two loaves on the way home, while the money still buys them.",
        "stay:label": "Stay in line overnight to be first tomorrow",
        "stay:then": "You find a place on the pavement with the others. Someone has brought a radio.",
        "change:label": "Trade what you can spare to {patron} for rand",
        "change:then": "{patron} gives you a few rand for it. Rand will still buy something next week.",
        "change:failed": "{patron} gives you far fewer rand than it's worth. Nobody else is offering anything.",
        "spend:label": "Buy maize meal and cooking oil wherever you can find them",
        "spend:then": "You go from shop to shop. In the fourth one there is maize meal, and you buy all you can carry.",
        ask: "{friend} comes round. {His} pay won't cover {need}, and {he} has nothing left to sell.",
      },
    },
    {
      // In March 2013 the Cypriot banks stayed shut for twelve days; deposits over €100,000 at the two largest were partly seized to rescue them.
      scope: CYPRUS,
      title: "The Banks Are Shut",
      lines: {
        intro: "The banks have been shut for a week. The cash machines give out a hundred euros a day, when they have any. At the two biggest banks, deposits over a hundred thousand are going to be cut to pay for rescuing them.",
        threat: "When the banks open, there will be limits on how much anyone can take out or send abroad.",
        partner: "Your {partnerKin} {partner} wants to know how much cash is in the house.",
        "kin-partner": "Count the cash in the house. We don't know how long this will last.",
        "cast-patron": "Has all the business money in the bank that's being closed down.",
        "cast-friend": "Hasn't been paid since the banks shut.",
        news: "{patron} says the supermarkets have stopped taking cards. Everyone wants cash, and the cash machine down the road has a queue of twenty people.",
        "queue:label": "Queue at the cash machine",
        "queue:then": "You join the queue. Everyone in it is watching the person at the front.",
        door: "When it's your turn the machine gives you a hundred euros, then says it is out of cash. The man behind you swears and walks off to find another one.",
        "take:label": "Take the hundred and go",
        "take:then": "You fold the notes into your wallet. They have to last.",
        "stay:label": "Wait for the van to refill the machine",
        "stay:then": "The van comes after an hour, and the queue has doubled by then.",
        "change:label": "Ask {patron} to cash a cheque for you",
        "change:then": "{patron} gives you cash from the till for your cheque, as a favour. You'll owe {patron} for that.",
        "change:failed": "{patron} cashes it, but keeps back ten percent for the trouble.",
        "spend:label": "Stock up at the supermarket with what cash you have",
        "spend:then": "You fill a trolley with what will keep, and pay in cash.",
        ask: "{friend} comes round. {He} hasn't been paid since the banks shut, and has no cash for {need}.",
      },
    },
    {
      // On 29 June 2015 Greece shut its banks for three weeks and limited cash machines to €60 a day; the referendum on the bailout terms was held on 5 July.
      scope: GREECE,
      title: "Sixty Euros a Day",
      lines: {
        intro: "The banks have been closed since Monday. You can take sixty euros a day from the cash machine, and the queues go round the corner. There's a referendum on Sunday on the creditors' terms.",
        threat: "Nobody knows whether Greece will be pushed out of the euro, and if it is, what savings will be worth in drachmas.",
        partner: "Your {partnerKin} {partner} wants to go to the cash machine together, so you get sixty each.",
        "kin-partner": "Get your sixty today. Every day you don't is sixty lost.",
        "cast-patron": "Owns the kiosk on the corner, and is now taking cash only.",
        "cast-friend": "Has been queuing for {his} mother's pension, because she has no bank card.",
        news: "{patron} says the government has opened some branches for pensioners without cards, and the lines outside them started at dawn. The cash machines are working, sixty a day.",
        "queue:label": "Queue at the cash machine for today's sixty euros",
        "queue:then": "You join the queue at the cash machine. Nobody talks about anything but the referendum.",
        door: "The machine gives you three twenties. A pensioner in front of you, who has no card, is being told by a guard that the branch can only pay out a hundred and twenty euros a week.",
        "take:label": "Take the sixty and go",
        "take:then": "You put the three twenties away and go home.",
        "stay:label": "Stay and help the pensioner with the bank staff",
        "stay:then": "You stay with the pensioner until a clerk takes the details down. It's all they can do.",
        "change:label": "Buy a gold sovereign from the jeweller",
        "change:then": "The jeweller sells you a gold sovereign. It will be worth something whatever the money is called next month.",
        "change:failed": "The jeweller charges you far more than gold is worth. Everyone is buying, so he can.",
        "spend:label": "Buy everything you can on the card while card payments work",
        "spend:then": "You fill a trolley at the supermarket and pay by card. Plenty of other people had the same idea.",
        ask: "{friend} comes round. {He} spent the morning in the pensioners' line for {his} mother and came away with nothing, and now there's nothing for {need}.",
      },
    },
    {
      // From late 2019 Lebanese banks rationed withdrawals of dollar deposits, which savers called "lollars", while the pound lost most of its value.
      scope: LEBANON,
      title: "Your Dollars Are Stuck",
      lines: {
        intro: "The banks won't give you your own dollars. You can take out a few hundred a month, paid in Lebanese pounds at the bank's rate, which is a fraction of the street rate. People call the money stuck in the banks lollars.",
        threat: "The pound has lost most of its value. Prices follow the black market rate, and wages don't.",
        partner: "Your {partnerKin} {partner} wants to join the protest outside the bank.",
        "kin-partner": "It's our money. They can't just keep it.",
        "cast-patron": "Has a shop, and has started pricing everything in dollars.",
        "cast-friend": "Has all {his} savings in dollars at the bank, and can't get them out.",
        news: "There's a protest outside the bank on the corner again. {patron} says the bank has changed its rules for withdrawals for the third time this month.",
        "queue:label": "Go to the bank for this month's allowance",
        "queue:then": "You wait for an hour while the people ahead of you argue with the clerks.",
        door: "The teller pays out your allowance in pounds at the bank's rate. Changed on the street, it's worth a small part of what you put in.",
        "take:label": "Take it and go",
        "take:then": "You take the pounds and change them on the street before the rate moves again.",
        "stay:label": "Join the depositors protesting inside the branch",
        "stay:then": "You stay. The protesters sit down in the branch and refuse to leave, and the manager shuts the doors.",
        "change:label": "Change pounds into dollars with a street changer",
        "change:then": "A money changer in a corner shop gives you dollars at today's rate. Tomorrow's will be worse.",
        "change:failed": "The changer counts too fast, and when you count again at home you're short.",
        "spend:label": "Spend the pounds now, before prices go up again",
        "spend:then": "You buy what the household will need this month. The prices on the shelves have been stuck over three times.",
        ask: "{friend} comes round. {His} savings are stuck in the bank, and {he} has nothing for {need}.",
      },
    },
    {
      title: "The Money Has Stopped Working",
      lines: {
        aim: "Decide what to do with your household's money before it's worth less.",
        intro: "The banks have stopped paying out, and the money in your pocket buys less every day.",
        threat: "Whatever your household keeps in the bank, or in cash, is losing its value.",
        partner: "Your {partnerKin} {partner} wants to know how much cash is in the house.",
        "kin-partner": "Count the cash in the house. Then decide.",
        "cast-patron": "Kept savings somewhere safer than the bank.",
        "cast-friend": "Had all {his} savings in the bank.",
        news: "There's a crowd outside the bank. {patron} says it will only get worse.",
        "queue:label": "Line up at the bank",
        "queue:then": "You join the line outside the bank.",
        door: "When you reach the front, the bank gives you only part of what you asked for. The rest stays where it is.",
        "take:label": "Take what they'll give",
        "take:then": "You take what they'll give you and go home.",
        "stay:label": "Stay with the people protesting",
        "stay:then": "You stay with the crowd until the bank closes its doors.",
        "change:label": "Change your money into something that keeps its value",
        "change:then": "You change the money. Whatever happens now, you have something that will keep.",
        "change:failed": "The rate you get is worse than you thought, and you only find out afterwards.",
        "spend:label": "Spend it now on things that keep",
        "spend:then": "You spend the money on food and things that keep.",
        ask: "{friend} comes round. {He} has nothing left for {need}.",
        "lend:label": "Share some of what you have with {him}",
        "refuse:label": "Say you have nothing to spare",
        lent: "You share what you have with {friend}. It leaves your household shorter, but {he} won't forget who helped.",
        refused: "You tell {friend} you have nothing to spare. {He} nods and goes. Later you see {him} on the way to the pawnshop with something wrapped in a cloth.",
        gone: "{friend} has gone, and you never find out how {he} managed.",
        passed: "The day ends. Tomorrow the money will be worth less again.",
      },
    },
  ],
};
