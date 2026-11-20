import { elderOf, dueOf, neighbours, partnerWords, pickOf, pronounWords, temper, trade, within } from "./common";
import type { CharacterScope } from "../characters/context-types";
import type { Actor } from "../../core/types";
import type { Condition, PlotContext, PlotTemplate } from "./types";

/** Work done for a wage at a works, a mill, a pit, a yard or the docks. */
export const INDUSTRIAL = /factory|mill-worker|loom|coal-miner|^miner$|ironworker|machine-operator|welder|garment|boilermaker|dock|oil-worker|railway|salt-worker/;

const RUST_BELT = [-91, 38.5, -74.5, 45.5] as const;
/** Inside the Rust Belt box but Canadian: Hamilton and Toronto. */
const ONTARIO: CharacterScope = { years: [1900, 2100], bounds: [-80.2, 43.15, -78.8, 44.2] };
const BRITAIN = [-8, 49.5, 2, 59] as const;
const ARGENTINA = [-74, -55.5, -53.5, -21.5] as const;
export const MUMBAI = [72.7, 18.85, 73.1, 19.35] as const;
const RUHR = [6.4, 51.2, 7.95, 51.75] as const;
const EX_SOVIET = [27, 44, 180, 72] as const;

const STEEL: CharacterScope = { years: [1977, 1993], bounds: RUST_BELT };
const OFFSHORED: CharacterScope = { years: [1993, 2013], bounds: RUST_BELT };
const SCOPES: CharacterScope[] = [STEEL, OFFSHORED, { years: [1979, 1995], bounds: BRITAIN }, { years: [1990, 2003], bounds: ARGENTINA },
  { years: [1983, 2001], bounds: MUMBAI }, { years: [1962, 2001], bounds: RUHR }, { years: [1992, 2000], bounds: EX_SOVIET }];

/** What the player's work is called: the pit, the mill, the docks, else the works or the plant. */
export function worksOf(c: PlotContext) {
  if (trade(c, /coal-miner|^miner$/)) return "the pit";
  if (trade(c, /dock/)) return "the docks";
  if (trade(c, /mill-worker|loom/) || within(c, { years: [1800, 2100], bounds: MUMBAI })) return "the mill";
  if (trade(c, /railway/)) return "the railway works";
  if (within(c, { years: [1900, 2100], bounds: EX_SOVIET })) return "the factory";
  if (within(c, { years: [1900, 2100], bounds: RUST_BELT })) return trade(c, /ironworker|boilermaker/) ? "the mill" : "the plant";
  if (within(c, { years: [1900, 2100], bounds: ARGENTINA })) return "the factory";
  return "the works";
}

/** Someone in the same trade, else another hand from a works, else any working-age neighbour. */
export function coworkerOf(c: PlotContext, key: string) {
  const pool = neighbours(c).filter((a) => (a.age ?? 30) >= 20 && (a.age ?? 30) < 60);
  const same = pool.filter((a) => a.origin?.livelihood === c.player.origin?.livelihood);
  const hands = pool.filter((a) => INDUSTRIAL.test(a.origin?.livelihood ?? ""));
  const from = same.length ? same : hands.length ? hands : pool;
  return from.length ? pickOf(c, from, key) : undefined;
}

/** The steward: an older hand from the works if there is one, else whoever the street listens to. */
const stewardOf = (c: PlotContext, friend: Actor) => {
  const hands = neighbours(c).filter((a) => (a.age ?? 30) >= 35 && a.householdId !== friend.householdId && INDUSTRIAL.test(a.origin?.livelihood ?? ""));
  return hands.length ? pickOf(c, hands, "plant-steward") : elderOf(c, friend);
};

const castOf = (c: PlotContext) => {
  const friend = coworkerOf(c, "plant-friend");
  const patron = friend && stewardOf(c, friend);
  return friend && patron && { friend, patron };
};

const fired = (id: string): Condition => ({ type: "fired", id });

/** The works the player's living depends on is closing for good. */
export const plant: PlotTemplate = {
  id: "plant",
  shape: "work",
  look: {
    emblem: "works",
    palette: { ink: "#121014", fill: "#2c2a30", edge: "#7a4a36", light: "#ece6de", accent: "#d8a040" },
  },
  weight: (c) => (trade(c, INDUSTRIAL) && within(c, ...SCOPES) && !within(c, ONTARIO) && castOf(c) ? 0.9 * temper(c, "conscientiousness") : 0),
  cast: castOf,
  begin: (c, cast) => {
    const friend = cast.friend!, patron = cast.patron!;
    const works = worksOf(c);
    return {
      deadline: dueOf(c.clock).deadline,
      words: {
        friend: friend.name,
        patron: patron.name,
        works,
        Works: works.replace(/^./, (x) => x.toUpperCase()),
        elsewhere: (c.setting?.year ?? 0) >= 2008 ? "North Dakota, in the oil fields" : "Tennessee, at the new car plants",
        goods: pickOf(c, ["teacups", "car tyres", "children's shoes", "bars of soap", "enamel saucepans"], "plant-goods"),
        ...pronounWords(friend),
        ...partnerWords(c).words,
      },
      refs: { friend: friend.id, patron: patron.id, ...partnerWords(c).refs },
    };
  },
  opening: [{ type: "approach", role: "friend", line: "word" }],
  developments: [
    {
      id: "notice",
      when: { type: "any", of: [{ type: "talked", role: "friend" }, { type: "working" }, { type: "since", hours: 1 }] },
      then: [{ type: "choose", line: "notice", focus: "patron", choices: [{ id: "fight" }, { id: "sign" }, { id: "go" }] }],
    },
    {
      id: "rally",
      when: fired("fight"),
      then: [
        { type: "regard", role: "patron", delta: 1 },
        { type: "gather", at: "patron", when: "evening", label: "meeting", scene: "hearing", aim: "aim-meeting" },
      ],
    },
    { id: "cold", when: fired("sign"), then: [{ type: "card", line: "cold", focus: "friend" }, { type: "regard", role: "friend", delta: -1 }] },
  ],
  endings: [
    { id: "fought", when: { type: "all", of: [fired("fight"), { type: "came" }] } },
    { id: "absent", when: { type: "all", of: [fired("fight"), { type: "gathered" }] } },
    { id: "signed", when: fired("cold") },
    { id: "moved", when: fired("go") },
    { id: "passed", when: { type: "all", of: [{ type: "due" }, { type: "not", of: fired("fight") }] } },
  ],
  wording: [
    {
      // Youngstown Sheet & Tube shut its Campbell Works on 19 September 1977, "Black Monday"; a church and union plan to buy it was turned down by Washington in 1979.
      scope: STEEL,
      title: "Shutdown",
      lines: {
        intro: "The notice went up on the board at {works} this morning: the company is shutting it down. {friend} read it twice and then went and sat in the car.",
        threat: "Steel in this valley has been closing mill by mill. Once a mill shuts it doesn't open again, and nothing else round here pays like it.",
        partner: "Your {partnerKin} {partner} is adding up what's left on the mortgage.",
        "kin-partner": "Is it true about {works}? What happens to the house?",
        "cast-patron": "Your steward at the union local, trying to organise a fight.",
        word: "Have you seen the board? They're closing it. My dad put thirty years in there, and they put up a notice.",
        notice: "{patron} says the union and the churches want to buy {works} and run it themselves, if Washington will back the loans. The company is offering severance and your pension to anyone who signs. {friend} has heard there's work in Houston.",
        "fight:label": "Go to the union meeting at {patron}'s",
        "sign:label": "Sign for the severance and the pension",
        "go:label": "Pack up for Houston",
        meeting: "At the union meeting at {patron}'s",
        fought: "The room is packed. {patron} reads out the plan to buy {works}, and everyone votes for it. It goes to Washington and never comes back. The mill stays shut, but you were in the room, and people remember who was.",
        signed: "You sign. The severance will last a few months if you're careful. After that there's unemployment, and after that nobody knows.",
        moved: "You tell {friend} you're going to Houston. By the end of the month there are For Sale signs up and down the street.",
      },
    },
    {
      // After NAFTA in 1994 plants moved south to Mexico; in the 2008–09 crash GM shut plants at Moraine, Ohio and Janesville, Wisconsin.
      scope: OFFSHORED,
      title: "The Plant Is Closing",
      lines: {
        intro: "Management called everyone onto the floor at shift change. {Works} is closing. The work is going to Mexico, or nowhere.",
        threat: "There are still jobs round here, but most pay half what {works} did and come without health insurance.",
        partner: "Your {partnerKin} {partner} is on the phone to the bank about the mortgage.",
        "kin-partner": "Is it true about {works}? What about the house?",
        "cast-patron": "Your rep at the union local.",
        word: "Did you hear? They're shutting the whole place down. They said 'restructuring' about twenty times.",
        notice: "The company is offering a buyout to anyone who signs this week. {patron} at the union local wants everyone to hold out for a better deal. {friend} has a cousin in {elsewhere} who says they're hiring.",
        "fight:label": "Hold out with the union for a better deal",
        "sign:label": "Take the buyout",
        "go:label": "Go to {elsewhere}",
        meeting: "At the union meeting at {patron}'s",
        fought: "The local votes to hold out. In the end the company adds a few weeks' pay and some retraining money, and shuts {works} anyway. {patron} calls that a win, and some days you believe it.",
        signed: "You sign for the buyout: a lump sum, and a letter about retraining at the community college.",
        moved: "You tell {friend} you're going to {elsewhere}. {He} says {he} might follow you if it works out.",
      },
    },
    {
      // British Steel shut Consett and Corby in 1980; Ravenscraig closed in 1992, and most coal pits after the 1984–85 strike.
      scope: { years: [1979, 1995], bounds: BRITAIN },
      title: "Redundancy",
      lines: {
        intro: "There's a letter in every pay packet this week: {works} is to close, and everyone on the books is being made redundant.",
        threat: "Half the town works at {works}, or for someone who does. When it goes, there's nothing to take its place.",
        partner: "Your {partnerKin} {partner} says at least there's the redundancy money.",
        "cast-patron": "The union convenor, who speaks for everyone at {works}.",
        word: "Have you opened yours? That's it, then. They've finished us.",
        notice: "{patron} from the union wants everyone at a meeting tonight to vote on fighting it. The redundancy money is the best anyone's been offered, but only if you sign before the closing date. {friend}'s brother-in-law went to Germany to lay bricks and says there's work there.",
        "fight:label": "Go to the meeting at {patron}'s",
        "sign:label": "Sign for the redundancy money",
        "go:label": "Follow the work to Germany",
        meeting: "At the union meeting at {patron}'s",
        fought: "The vote is to fight. There are marches, a petition, a delegation to London. {Works} closes on the date they first said, and people here will talk about the campaign for years.",
        moved: "You put your name down with an agency for building work in Germany. {friend} says you'll be back within the year. Plenty are.",
      },
    },
    {
      // Menem's government sold the state steel, oil, railways and phones in 1990–93, and tens of thousands took a "voluntary retirement" payout.
      scope: { years: [1990, 2003], bounds: ARGENTINA },
      title: "Voluntary Retirement",
      lines: {
        intro: "The new owners have said it plainly: {works} has twice the people it needs. Anyone who takes voluntary retirement gets a payout. Anyone who doesn't may end up with nothing.",
        threat: "The payout is a lump sum, and with the peso tied to the dollar it feels like a lot. People who took it last year have already spent it on taxis and corner kiosks that failed.",
        "cast-patron": "The union delegate on your floor.",
        word: "They want half of us gone. They're calling it voluntary.",
        notice: "{patron} says that if the owners close {works}, the workers should stay inside and run it themselves. The owners are paying voluntary retirement to anyone who signs. {friend}'s cousin went to Spain and sends money home.",
        "fight:label": "Go to the workers' meeting at {patron}'s",
        "sign:label": "Take the voluntary retirement payout",
        "go:label": "Look for work in Spain",
        meeting: "At the workers' meeting at {patron}'s",
        fought: "The meeting votes to stay. If the owners walk away, you'll keep the machines running yourselves and sell what you make. Nobody knows if that's legal. Everyone knows it's that or nothing.",
        signed: "You sign for the payout. {friend} says half the people who took it last year bought a car to drive as a taxi, and now there are too many taxis.",
        moved: "You start on the papers for Spain. Plenty of families here came from Spain and Italy in the first place; now people are going back the other way.",
      },
    },
    {
      // After the 1982–83 strike most of Girangaon's mills never fully reopened; owners sold the land, and some 100,000 mill workers lost their jobs.
      scope: { years: [1983, 2001], bounds: MUMBAI },
      title: "The Mill Gate Is Locked",
      lines: {
        intro: "The owners have put a lock on the gate of {works} and a notice beside it. They say the mill is losing money. Everyone says they want the land.",
        threat: "The mill land in Girangaon is worth more than the mill. Once the looms are sold, it will be offices and towers.",
        partner: "Your {partnerKin} {partner} says the rent on the room is due whatever happens.",
        "cast-patron": "Speaks for the union at {works}.",
        word: "They've locked the gate. They didn't even tell the night shift. The watchman says he has orders.",
        notice: "{patron} from the union says everyone should come to a meeting tonight and refuse to take a settlement. The owners are paying a lump sum to anyone who resigns. {friend} is talking about going home to the village in the Konkan, where at least there is the family's land.",
        "fight:label": "Go to the union meeting at {patron}'s",
        "sign:label": "Resign and take the lump sum",
        "go:label": "Go back to the village",
        meeting: "At the union meeting at {patron}'s",
        fought: "Everyone shouts that the mill must reopen. The case goes to the labour court and stays there for years. The gate stays locked.",
        signed: "You take the lump sum. A few weeks later there's a builder's sign on the mill wall.",
        moved: "You give up the room and take the train south to the village. {friend} keeps your name on the union's list, just in case.",
      },
    },
    {
      // The Ruhr had over 140 pits in 1957 and a few dozen by 1990; most men were moved to other pits or retired early on a state payment.
      scope: { years: [1962, 2001], bounds: RUHR },
      title: "The Last Shift",
      lines: {
        intro: "The company has announced that {works} will close at the end of the year. It costs more to keep it going than to buy from abroad.",
        threat: "Every year another pit or steelworks in the Ruhr shuts. For now, the men are being shared out among the ones still open.",
        "cast-patron": "Sits on the works council, and speaks for the men at {works}.",
        word: "End of the year. That's what they said. End of the year and that's it.",
        notice: "{patron} from the works council says there'll be a protest, and the union will make sure nobody is simply thrown out. Older men can retire early on a government payment; younger ones are offered places across the city. {friend} is thinking of taking a job at the Opel car plant in Bochum.",
        "fight:label": "Go to the meeting at {patron}'s about the protest",
        "sign:label": "Take the transfer the company is offering",
        "go:label": "Take a job at the car plant",
        meeting: "At the works council meeting at {patron}'s",
        fought: "Thousands march with black flags and miners' lamps. The closure goes ahead, but nobody from {works} is put out on the street. The union gets that much.",
        signed: "You accept the transfer. It's a longer journey and a new crew, and nobody knows how long that one will last either.",
        moved: "You sign on at the car plant. The work is clean, and the pay is steady.",
      },
    },
    {
      // By 1998 Russian workers were owed months of back wages, and many factories paid them in their own products instead.
      scope: { years: [1992, 2000], bounds: EX_SOVIET },
      title: "No Wages",
      lines: {
        aim: "Decide what to do about the wages {works} isn't paying.",
        intro: "{Works} hasn't paid anyone in five months. This week the director announced that wages will be paid in what {works} makes.",
        threat: "Nobody can live on what {works} makes. You'll have to sell it, and so will everyone else.",
        "cast-patron": "Has worked at {works} since Brezhnev, and wants to fight.",
        word: "Did you hear? We're to be paid in {goods}. Five months, and they give us {goods}.",
        notice: "{patron} says the miners are blocking the railway to get their wages, and {works} should do the same. The director is handing out this month's pay as {goods} to anyone who signs for it. {friend} is going to buy clothes in Istanbul to sell at the market here, and wants a partner.",
        "fight:label": "Go to the meeting at {patron}'s about blocking the line",
        "sign:label": "Sign for your wages in {goods}",
        "go:label": "Go into trading with {friend}",
        meeting: "At the meeting at {patron}'s",
        cold: "{friend} sees you carrying your box of {goods} home and laughs, not unkindly.",
        fought: "The meeting votes to block the railway line until the wages are paid. After three days, money arrives from the regional government: one month's back pay out of five.",
        signed: "Your wages come as a box of {goods}. On Sunday you'll be at the market trying to sell them, next to everyone else from {works}.",
        moved: "You and {friend} pool your savings for the first trip to Istanbul. You'll come back with bags of leather jackets to sell at the market.",
      },
    },
    {
      title: "The Closure",
      lines: {
        aim: "Decide what to do now that {works} is closing.",
        intro: "Word went round at the start of the shift: {works} is closing for good.",
        threat: "{Works} is where most people round here earn their living. When it shuts, there won't be much else.",
        partner: "Your {partnerKin} {partner} wants to know what you're going to do.",
        "kin-partner": "Is it true about {works}? What are we going to do?",
        "cast-friend": "Works alongside you at {works}.",
        "cast-patron": "Speaks for the workers at {works}, and wants to fight the closure.",
        word: "Have you heard? They're closing {works}. That's it for all of us.",
        notice: "{patron} wants everyone at a meeting tonight to fight the closure. The owners are offering a payout to anyone who leaves quietly. {friend} says there's work somewhere else, if you're willing to move.",
        "fight:label": "Go to the meeting at {patron}'s",
        "fight:then": "{patron} shakes your hand. The meeting is this evening; bring anyone you can.",
        "sign:label": "Take the payout",
        "go:label": "Go where the work is",
        meeting: "At the meeting at {patron}'s",
        "aim-meeting": "Be at the meeting at {patron}'s {meet}.",
        cold: "{friend} heard you signed. {He} says {he} understands, but {he} doesn't wait for you at the gate.",
        fought: "The meeting votes to fight. It may not save {works}, but nobody can say the workers went quietly.",
        absent: "The meeting went ahead without you, and {patron} noticed the empty chair.",
        signed: "You take the payout. It's more money than you've ever had at once, and it has to last until something turns up.",
        moved: "You decide to go where the work is. {friend} says {he}'ll keep an eye on your family.",
        passed: "The day ends with nothing decided, and {works} still closing.",
      },
    },
  ],
};
