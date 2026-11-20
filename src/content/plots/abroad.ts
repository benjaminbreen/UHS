import { random } from "../../core/random";
import { sexOf } from "../../core/brief";
import { amountOf, fillIn, neighbours, partnerWords, pickOf, pronounWords, temper, trade, within } from "./common";
import type { Condition, PlotContext, PlotTemplate } from "./types";

const SOUTH_ASIA = [60, 5, 92, 36] as const;
const PHILIPPINES = [116, 4, 127, 21] as const;
const TURKEY = [26, 36.6, 45, 42.2] as const;
const MEXICO = [-110, 15, -95, 26] as const;
const IRELAND = [-10.7, 51.3, -5.9, 55.5] as const;
const PORTUGAL = [-9.6, 36.9, -6.1, 42.2] as const;
const WEST_AFRICA = [-3.3, 4, 15, 14] as const;

const GULF = { years: [1975, 2021], bounds: SOUTH_ASIA } as const;
const MANILA = { years: [1975, 2021], bounds: PHILIPPINES } as const;
const GERMANY = { years: [1961, 1974], bounds: TURKEY } as const;
const BRACERO = { years: [1942, 1965], bounds: MEXICO } as const;
const NORTH = { years: [1965, 2021], bounds: MEXICO } as const;
const HOLYHEAD = { years: [1946, 1966], bounds: IRELAND } as const;
const SALTO = { years: [1957, 1975], bounds: PORTUGAL } as const;
const EUROPE = { years: [1990, 2021], bounds: WEST_AFRICA } as const;

/** Those with land, a business or a profession stay; it was the labouring and the young who went. */
const SETTLED = /landowner|merchant|banker|manager|physician|dentist|pharmacist|lawyer|magistrate|officer|mill-owner|shipowner|planter|broker|moneylender|money-changer|headman/;

const castOf = (c: PlotContext) => {
  const pool = neighbours(c).filter((a) => (a.age ?? 30) >= 22 && (a.age ?? 30) <= 65);
  const stranger = pool.length ? pickOf(c, pool, "abroad-agent") : undefined;
  const others = pool.filter((a) => a.householdId !== stranger?.householdId && (a.age ?? 30) <= 55);
  const friend = others.length ? pickOf(c, others, "abroad-friend") : undefined;
  return stranger && friend && { stranger, friend };
};

/** Men went to the building sites; women more often to housework, nursing and hotels. */
const jobOf = (c: PlotContext) => {
  const woman = sexOf(c.player) === "female";
  if (within(c, HOLYHEAD)) return woman ? "a place as an orderly at a hospital in London" : "a start with {his} ganger on the building sites, the foreman who hires the gangs";
  return woman ? "as a housemaid" : "on a building site";
};

const fired = (id: string): Condition => ({ type: "fired", id });
const not = (of: Condition): Condition => ({ type: "not", of });
const all = (...of: Condition[]): Condition => ({ type: "all", of });

/** Someone offers a way to work abroad, for a fee: pay it, borrow it, ask
 * someone who went what it is really like, or stay. */
export const abroad: PlotTemplate = {
  id: "abroad",
  shape: "desire",
  look: {
    emblem: "visa",
    palette: { ink: "#12100e", fill: "#2a2620", edge: "#6a5638", light: "#f0eadc", accent: "#3a8a6a" },
  },
  payee: "stranger",
  weight: (c) => {
    const age = c.player.age ?? 30;
    if (age < 18 || age > 45 || trade(c, SETTLED) || (c.household?.fortune ?? 0.5) > 0.75) return 0;
    if (!within(c, GULF, MANILA, GERMANY, NORTH, HOLYHEAD, SALTO, EUROPE) && !(within(c, BRACERO) && sexOf(c.player) === "male")) return 0;
    if (!castOf(c)) return 0;
    return 0.5 * temper(c, "openness");
  },
  cast: (c) => castOf(c),
  begin: (c, cast) => {
    const stranger = cast.stranger!, friend = cast.friend!;
    // Agents took a deposit and the rest from the first wages; the whole fee was often a year's pay at home.
    const owed = 4 + Math.floor(random(c.seed, "plot", "abroad", "owed") * 3);
    const p = partnerWords(c);
    const f = pronounWords(friend);
    return {
      deadline: Math.floor(c.clock / 86400) * 86400 + 40 * 3600,
      owed,
      words: {
        stranger: stranger.name,
        friend: friend.name,
        amount: amountOf(c, owed),
        job: fillIn(jobOf(c), pronounWords(stranger)),
        ...pronounWords(stranger),
        fhe: f.he, fHe: f.He,
        ...p.words,
      },
      refs: { stranger: stranger.id, friend: friend.id, ...p.refs },
    };
  },
  opening: [{
    type: "choose", line: "offer", focus: "stranger", from: "stranger",
    choices: [{ id: "pay" }, { id: "borrow" }, { id: "ask", check: { stat: "wit", odds: 0.55 } }, { id: "refuse" }],
  }],
  developments: [
    { id: "paying", when: fired("pay"), then: [{ type: "seize", role: "stranger" }] },
    {
      id: "heard",
      when: all({ type: "any", of: [fired("ask"), fired("ask:failed")] }, { type: "since", hours: 2 }),
      then: [{ type: "choose", line: "heard", focus: "friend", choices: [{ id: "pay" }, { id: "borrow" }, { id: "refuse" }] }],
    },
  ],
  endings: [
    { id: "sent", when: { type: "settled" } },
    { id: "borrowed", when: { type: "after", id: "borrow", hours: 1 } },
    { id: "short", when: all(fired("pay"), not({ type: "settled" }), { type: "after", id: "pay", hours: 2 }) },
    { id: "stayed", when: { type: "after", id: "refuse", hours: 1 } },
    { id: "gone", when: { type: "gone", role: "stranger" } },
    { id: "lapsed", when: { type: "due" } },
  ],
  wording: [
    {
      // Gulf recruitment ran on agents' fees and the kafala system, under which the sponsor (kafeel) held the worker's passport.
      scope: GULF,
      title: "A Visa for the Gulf",
      lines: {
        intro: "{stranger} has a visa for the Gulf: two years {job} in Dubai or Riyadh, with food and a room. Half the houses on your street have someone there sending money home.",
        threat: "There are real visas and fake ones, and you can't tell them apart by looking. Some people pay and never leave. Some go and find there is no job.",
        "cast-stranger": "A recruitment agent with a visa for the Gulf to sell.",
        "cast-friend": "Spent six years in the Gulf, and came back with a new roof and a bad back.",
        offer: "The sponsor needs twenty workers, and I can put your name down. {amount} now and the rest comes out of your first wages. Your passport stays with the sponsor while you're there; that's normal.",
        "borrow:label": "Pawn the household's gold to pay",
        "borrow:then": "You take the gold to the pawnbroker. It is enough for the deposit, and it will take a year's wages abroad to get it back.",
        "ask:then": "{friend} looks at the paper and laughs. It's a 'free visa': the sponsor sells the paper and gives you no job. You'd be working illegally from the day you landed. {fHe} says a real one comes with a contract and a company name.",
        "ask:failed": "{friend} says the work is hard and the heat is worse, but the money is real. {fHe} doesn't know anything about {stranger}.",
        sent: "{stranger} takes your passport and the money and writes out a receipt. The flight is in six weeks. You start telling people you're going.",
        stayed: "You tell {stranger} you'll stay. At night you think about the new roofs on the street, and aren't sure.",
      },
    },
    {
      // Philippine law from 1974 sent overseas contract workers through licensed agencies, which charged placement fees despite the caps.
      scope: MANILA,
      title: "Work Abroad",
      lines: {
        intro: "{stranger} from the placement agency says there are jobs for domestic helpers in Hong Kong and for construction workers in Saudi Arabia. The fee is high, but an overseas worker sends home more in a month than you make here in six.",
        threat: "Some agencies are licensed and some aren't. People have paid and waited for years.",
        "cast-stranger": "Works for a placement agency, and has a contract to offer.",
        "cast-friend": "Worked three contracts in Saudi Arabia and Hong Kong.",
        offer: "I have one place left on this contract. {amount} for the placement fee and the medical, the rest out of your salary. You'll fly within two months.",
        "borrow:label": "Borrow from the lender against the house",
        "borrow:then": "The lender gives you the money at ten percent a month. It will have to be paid back from your first salaries abroad.",
        "ask:then": "{friend} checks: the agency isn't on the government's list. Licensed agencies, {fhe} says, give you a contract you can read before you pay.",
        "ask:failed": "{friend} says it was hard and lonely but it paid for the children's school. {fHe} doesn't know the agency.",
      },
    },
    {
      // From 1961 the German Liaison Office in Istanbul recruited Turkish workers, checking teeth, hands and lungs; recruitment stopped in November 1973.
      scope: GERMANY,
      title: "Work in Germany",
      lines: {
        intro: "The Germans want workers for their factories and mines, and there is a list at the German office in Istanbul with thousands of names on it. {stranger} says {he} can get your name moved up.",
        threat: "The German doctors check everyone's teeth, hands and lungs. If you fail, you come home with nothing, fee or no fee.",
        "cast-stranger": "Knows someone at the employment office, or says {he} does.",
        "cast-friend": "Worked two years at a car factory near Cologne, and came home for the summer.",
        offer: "Your name is on the list, but at the bottom. For {amount}, it goes near the top. My cousin at the office does it for people I know.",
        "borrow:label": "Borrow from the family to pay",
        "borrow:then": "Your uncles each put something in. Now the whole family is waiting on your first wages from Germany.",
        "ask:then": "{friend} says the list is real and the work is real, but nobody can move names up; {fhe} waited a year like everyone else. {stranger} is taking money for nothing.",
        "ask:failed": "{friend} says the work is hard, the winters are dark and the money is good. {fHe} doesn't know how the list works.",
        sent: "{stranger} takes the money and says to expect a letter from the office. You go to Istanbul to have your teeth looked at, just in case.",
        stayed: "You keep your place at the bottom of the list. The letter will come when it comes.",
      },
    },
    {
      // Braceros needed a place on their town's quota list to reach the contracting centres; officials sold places.
      scope: BRACERO,
      title: "The Bracero List",
      lines: {
        intro: "The Americans are taking men for the harvests under the Bracero program, on six-month contracts. Every town gets a quota, and {stranger} draws up the list for yours.",
        threat: "Without your name on the list you can't get into the contracting centre. Men wait outside it for weeks anyway, sleeping in the street.",
        "cast-stranger": "Draws up the town's list of men for the Bracero contracts.",
        "cast-friend": "Picked cotton in Texas on two contracts.",
        offer: "There are forty places and two hundred men who want them. For {amount}, your name is on the list.",
        "borrow:label": "Borrow from the shopkeeper against the harvest",
        "borrow:then": "The shopkeeper lends it against your family's next harvest, at a rate you don't like to think about.",
        "ask:then": "{friend} says the list is what it is: everybody pays someone. But in Texas they took money for the bed and the food out of the wages, and {fhe} came home with half what was promised.",
        "ask:failed": "{friend} says the work was hard and the money was good. {fHe} doesn't say much else.",
        sent: "Your name is on the list. In a month you'll take the train north to the contracting centre, with your papers folded inside your hat.",
      },
    },
    {
      // After 1994 border enforcement pushed crossings into the Arizona desert, and smugglers' fees rose into the thousands of dollars.
      scope: NORTH,
      title: "Crossing North",
      lines: {
        intro: "{stranger} takes people across the border into the United States. You'd go by bus to the border, then walk at night with a group. Your cousins in Chicago say there's work in kitchens and on building sites.",
        threat: "People die in the desert every summer. Some coyotes, the smugglers, take the money and leave their people behind.",
        "cast-stranger": "A coyote, a smuggler who takes people across the border.",
        "cast-friend": "Spent eight years working in the United States, and came home last year.",
        offer: "{amount} now, the rest when you get to your cousins. I've taken people across for ten years. I don't lose anyone.",
        "borrow:label": "Borrow from your cousins in the north",
        "borrow:then": "Your cousins wire the money from Chicago. You'll pay them back out of your first months' work.",
        "ask:then": "{friend} knows {stranger}'s name. People {stranger} took last summer were left in the desert when the Border Patrol came. Two of them didn't come back.",
        "ask:failed": "{friend} says it depends on the coyote, and on luck. {fHe} doesn't know {stranger}.",
        sent: "You pay {stranger}. You leave in two weeks, with one bag, and you don't know when you'll see your family again.",
      },
    },
    {
      // Postwar Ireland lost about a sixth of its people, most to building sites and factories in England.
      scope: HOLYHEAD,
      title: "The Boat to Holyhead",
      lines: {
        intro: "{stranger} is home from England for Christmas in a good suit, and says there's work in London for anyone who wants it. {He} can get you {job}.",
        threat: "There's no work here. But once you go, you mightn't come back, and half the young people of the parish are gone already.",
        "cast-stranger": "Home from London for Christmas, and can get you a start.",
        "cast-friend": "Went to Birmingham, hated it, and came home.",
        offer: "Give me {amount} for the boat fare and the first week's lodgings in Kilburn, and you start on the Monday.",
        "borrow:label": "Ask your mother for the money",
        "borrow:then": "Your mother takes the money from the tin on the dresser without a word. It's what she had put by.",
        "ask:then": "{friend} says the work is there, but it's cash in hand with no insurance stamps, and you're let go when the job ends. And the landladies' signs say 'No Irish'.",
        "ask:failed": "{friend} says it's grand if you like that sort of thing, and won't say more.",
        sent: "You give {stranger} the money. In a week you'll take the boat from Dún Laoghaire to Holyhead, with a suitcase tied with string.",
      },
    },
    {
      // Portuguese who went 'a salto', without papers, over the Pyrenees often paid the passador half up front and half on arrival in France.
      scope: SALTO,
      title: "Over the Mountains",
      lines: {
        intro: "{stranger} is a passador, who takes people over the mountains into Spain and France without papers. They call it going 'a salto', at a jump. There's work in Paris building roads, and men from the village are already there.",
        threat: "The police will stop you if they catch you, and the army wants the young men for the war in Africa. The mountains are cold, and some passadores leave people halfway.",
        "cast-stranger": "A passador, who takes people over the border without papers.",
        "cast-friend": "Went to France at a jump, and lives in the shanty town at Champigny.",
        offer: "{amount} now. Tear your photograph in half and give me one half. When you reach France you send it back signed, and your family pays me the rest.",
        "borrow:label": "Sell the family's pig to pay",
        "borrow:then": "The pig goes to market. It's enough for the first half, and your family will owe the rest when your photograph comes back.",
        "ask:then": "{friend} has heard of {stranger}: honest, but slow, and {his} people spend a week in a barn in Spain waiting to cross. Bring a coat, {fhe} says.",
        "ask:failed": "{friend} says France is cold and the shanty town is mud, but there's work. {fHe} doesn't know {stranger}.",
        sent: "You give {stranger} the money and half your photograph. You leave on Thursday night, in your good shoes.",
      },
    },
    {
      // In the 1990s and 2000s many West Africans paid 'connection men' for visas or for the road across the Sahara to Libya and Europe.
      scope: EUROPE,
      title: "Going Abroad",
      lines: {
        intro: "{stranger} says {he} can get you a visa for Europe, or a place on the road north through Niger and Libya to Italy. A boy from the next street is in London now, sending money home.",
        threat: "Some visas are forged. The desert road is worse: people are robbed, held for ransom in Libya, and drowned at sea.",
        "cast-stranger": "A 'connection man' who arranges visas and travel to Europe.",
        "cast-friend": "Spent four years in Italy, and was sent home last year.",
        offer: "For {amount} I start the papers. The rest when the visa comes. Many people I have sent are in London now.",
        "borrow:label": "Borrow from the family meeting",
        "borrow:then": "The family meets and agrees to put the money together. You will owe it to all of them.",
        "ask:then": "{friend} looks at the papers {stranger} showed you and says the stamp is fake. {fHe} paid a man like {stranger} once, and lost the money.",
        "ask:failed": "{friend} says Europe is not what people think, and won't talk about the road.",
      },
    },
    {
      title: "Work Abroad",
      lines: {
        aim: "Decide whether to pay {stranger} and go abroad for work.",
        intro: "{stranger} says {he} can get you work abroad, where wages are many times what they are here. People who went are sending money home.",
        threat: "Some people who pay never leave. Some leave and find there's no job.",
        partner: "Your {partnerKin} {partner} asks how the household will manage without you for years.",
        "kin-partner": "Are you really going to pay {stranger}? Ask {friend} first.",
        "cast-stranger": "Says {he} can get you work abroad, for a fee.",
        "cast-friend": "Worked abroad for years, and came back.",
        offer: "I can get you a place. {amount} now and the rest from your first wages.",
        "pay:label": "Pay {stranger} the {amount}",
        "pay:then": "You get out the money the household has been saving.",
        "borrow:label": "Borrow the money to pay",
        "borrow:then": "You borrow the money. It will take your first year's wages abroad to pay it back.",
        "ask:label": "Ask {friend} what it's really like",
        "ask:then": "{friend} tells you plainly what it was like, and what to watch out for with people like {stranger}.",
        "ask:failed": "{friend} talks about the work and the money, but doesn't know anything about {stranger}.",
        "refuse:label": "Stay where you are",
        "refuse:then": "You tell {stranger} no.",
        heard: "Now you know what {friend} knows. {stranger} still wants an answer.",
        sent: "{stranger} takes the money and gives you a receipt. You start telling people you're going.",
        borrowed: "{stranger} has the money, and the household has a debt that only wages from abroad can pay.",
        short: "{stranger} took what the household had put by and wrote it down as part of the deposit. The rest is due before anything moves.",
        stayed: "You tell {stranger} you'll stay. Nobody here is going to get rich, but you're home.",
        gone: "{stranger} has disappeared, and so has the offer.",
        lapsed: "{stranger} has given your place to someone else.",
      },
    },
  ],
};
