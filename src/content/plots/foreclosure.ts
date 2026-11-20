import { neighbours, notable, partnerWords, pronounWords, US, within, working } from "./common";
import type { Actor } from "../../core/types";
import type { CharacterScope } from "../characters/context-types";
import type { Condition, Effect, PlotContext, PlotTemplate } from "./types";

// End years are exclusive.
const PLAINS_FARMS = { years: [1930, 1936], bounds: [-104, 37, -89, 49] } as const;
const DEPRESSION_CITIES = {
  years: [1930, 1936],
  places: ["city-new-york", "city-chicago", "city-detroit", "city-cleveland", "city-philadelphia", "city-pittsburgh", "city-boston",
    "city-st-louis", "city-milwaukee", "city-minneapolis", "city-st-paul", "city-baltimore", "city-buffalo", "city-cincinnati",
    "city-kansas-city", "city-omaha", "city-des-moines", "city-los-angeles", "city-san-francisco", "city-seattle", "city-indianapolis"],
} as const;
const SUBPRIME = { years: [2007, 2013], ...US } as const;
/** Where it hit hardest: the Rust Belt's old streets and the Sun Belt's new ones. */
const SUBPRIME_WORST = {
  years: [2007, 2013],
  places: ["city-cleveland", "city-detroit", "city-las-vegas", "city-phoenix", "city-miami", "city-tampa", "city-orlando", "city-jacksonville",
    "city-sacramento", "city-fresno", "city-san-bernardino", "city-atlanta", "city-buffalo", "city-milwaukee", "city-indianapolis"],
} as const;
const SPAIN = {
  years: [2008, 2015], bounds: [-9.4, 35.9, 3.4, 43.8], cultures: ["european"],
  except: [[-9.6, 36.9, -7.4, 42.15], [-1.8, 42.9, 3.4, 44]],
} as const satisfies CharacterScope;
const IRELAND = { years: [2009, 2016], bounds: [-10.7, 51.3, -5.9, 55.4], except: [[-8.2, 54, -5.4, 55.4]] } as const satisfies CharacterScope;

const farmSlice = (c: PlotContext) => within(c, PLAINS_FARMS) && (working(c) || !["city", "port"].includes(c.setting?.settlement ?? ""));

const scale = (c: PlotContext) =>
  within(c, DEPRESSION_CITIES, SUBPRIME_WORST, SPAIN) || farmSlice(c) ? 0.9 : within(c, SUBPRIME, IRELAND) ? 0.45 : 0;

/** Someone who can talk to a bank or a landlord in its own language. */
const LEARNED = /lawyer|notary|clerk|civil-servant|teacher|religious|priest|minister|banker|bank|insurance|accountant|journalist|magistrate|manager/i;
const patronOf = (c: PlotContext) => neighbours(c).find((a) => LEARNED.test(a.role) && (a.age ?? 30) >= 30) ?? notable(c);
const helperOf = (c: PlotContext, patron?: Actor) =>
  neighbours(c).find((a) => (a.age ?? 30) >= 25 && a.id !== patron?.id && a.householdId !== patron?.householdId);

const fired = (id: string): Condition => ({ type: "fired", id });
const not = (of: Condition): Condition => ({ type: "not", of });
const counselled: Condition = { type: "all", of: [fired("counsel"), not(fired("counsel:failed"))] };

const options: Effect = {
  type: "choose", line: "notice", focus: "helper", brought: true,
  choices: [{ id: "counsel", check: { stat: "wit", skill: "speech", odds: 0.4 } }, { id: "door" }, { id: "kin" }],
};

/** The household is behind on the house, and the notice says it will be
 * sold or emptied tomorrow morning. */
export const foreclosure: PlotTemplate = {
  id: "foreclosure",
  shape: "claim",
  look: {
    emblem: "notice",
    palette: { ink: "#12131a", fill: "#262a36", edge: "#5a5046", light: "#eeeae0", accent: "#c8a24a" },
  },
  weight: (c) => ((c.household?.fortune ?? 0.5) < 0.5 && (c.player.age ?? 30) >= 25 && helperOf(c, patronOf(c)) ? scale(c) : 0),
  cast: (c) => {
    const patron = patronOf(c);
    const helper = helperOf(c, patron);
    return patron && helper && { patron, helper };
  },
  begin: (c, cast) => {
    const patron = cast.patron!, helper = cast.helper!;
    const p = partnerWords(c);
    const midnight = Math.floor(c.clock / 86400) * 86400;
    return {
      deadline: midnight + 34 * 3600,
      words: {
        patron: patron.name,
        patronRole: patron.role.toLowerCase(),
        helper: helper.name,
        due: "tomorrow morning",
        ...pronounWords(helper),
        ...p.words,
      },
      refs: { patron: patron.id, helper: helper.id, ...p.refs },
    };
  },
  opening: [options],
  developments: [
    { id: "again", when: fired("counsel:failed"), then: [{ type: "choose", line: "again", focus: "helper", choices: [{ id: "door" }, { id: "kin" }] }] },
    {
      id: "organised",
      when: { type: "all", of: [fired("door"), { type: "talked", role: "helper" }] },
      then: [{ type: "card", line: "organised", focus: "helper" }, { type: "regard", role: "helper", delta: 1 }],
    },
    {
      id: "remind",
      // Mid-evening of the first day: the last chance to bring the neighbours.
      when: { type: "all", of: [{ type: "due", hours: -14 }, not(fired("organised")), not(fired("kin")), not(counselled)] },
      then: [{ type: "approach", role: "helper", line: "remind" }],
    },
  ],
  endings: [
    { id: "delayed", when: { type: "all", of: [{ type: "after", id: "counsel", hours: 3 }, not(fired("counsel:failed"))] } },
    { id: "moved", when: { type: "after", id: "kin", hours: 2 } },
    { id: "blocked", when: { type: "all", of: [fired("organised"), { type: "due" }] } },
    { id: "alone", when: { type: "all", of: [fired("door"), { type: "due" }] } },
    { id: "evicted", when: { type: "due" } },
  ],
  wording: [
    {
      // Communist-led Unemployed Councils carried evicted families' furniture back in; in Chicago in August 1931 police killed three men at one such eviction.
      scope: DEPRESSION_CITIES,
      title: "The Notice on the Door",
      lines: {
        aim: "Keep the household in its rooms past {due}.",
        intro: "You're three months behind on the rent. There's no work, and the relief office has a line round the block. The marshal's notice is on the door: the family and everything you own go out on the sidewalk {due}.",
        threat: "Evictions happen on every street now. The furniture goes on the curb, and if nobody takes the family in, the kids go to the city.",
        partner: "Your {partnerKin} {partner} has been to every relative who might have a spare room.",
        "kin-partner": "{helper} says the Council can stop it. Talk to {him}.",
        "cast-patron": "The {patronRole}, who knows the landlord, and might get him to wait.",
        "cast-helper": "Goes to the Unemployed Council meetings, and has been at evictions before.",
        notice: "{helper} saw the marshal pin it up. \"They put the Kowalskis out last week,\" {he} says, \"and we carried every chair back in before the truck turned the corner.\"",
        "counsel:label": "Ask {patron} to talk to the landlord",
        "counsel:then": "{patron} puts on a hat and goes round to see the landlord.",
        "counsel:failed": "{patron} comes back shaking {his} head. The landlord has his own mortgage to pay and won't wait another week.",
        "door:label": "Get {helper} and the Council to stop it",
        "door:then": "\"Come by after dark,\" {helper} says. \"We'll need everybody on the stairs.\"",
        "kin:label": "Move the family in with kin",
        again: "The landlord won't wait. The marshal is coming {due}.",
        organised: "{helper} has half the block lined up, and the boys from the Council will be there at seven. When the furniture comes out, it goes straight back in.",
        remind: "The marshal's coming {due}. Do you want us there or not?",
        delayed: "{patron} gets the landlord to take half the back rent now and wait a month for the rest. You start looking for any work there is.",
        moved: "You carry the beds and the stove across town to your relatives' place. Six people in two rooms, but nobody is on the sidewalk.",
        blocked: "The marshal's men carry your table and beds out to the curb, and forty neighbours carry them straight back up the stairs. After the third trip the marshal gives up and leaves. The landlord will try again, but not this week.",
        alone: "A few people come, but not enough. The marshal's men stack your things on the curb, and you spend the night sitting on them.",
        evicted: "The marshal's men carry everything down to the sidewalk and change the lock. Your neighbours bring coffee, and help you find somewhere to sleep.",
      },
    },
    {
      // In 1932-33 Farmers' Holiday men packed Iowa and Nebraska foreclosure sales, bid pennies and gave the farm back; Iowa passed a moratorium in February 1933.
      scope: PLAINS_FARMS,
      title: "The Sheriff's Sale",
      lines: {
        aim: "Save the farm before the sheriff's sale {due}.",
        intro: "Corn is selling for ten cents a bushel, less than it costs to grow, and the mortgage payments stopped two years ago. The sheriff has posted the notice: the farm, the stock and the machinery go up for auction on your own yard {due}.",
        threat: "Whoever bids highest gets the farm. Usually that's the insurance company that holds the mortgage, and they bid just enough to cover the debt.",
        partner: "Your {partnerKin} {partner} has been going through the barn, deciding what to hide at the neighbours'.",
        "kin-partner": "{helper} says the neighbours won't let it happen. Go and talk to {him}.",
        "cast-patron": "The {patronRole}, who knows the men at the bank in town.",
        "cast-helper": "Belongs to the Farmers' Holiday Association, and has been to other sales this year.",
        notice: "{helper} read the notice on the fence before you did. \"They did the same to the Larsens in the spring,\" {he} says. \"It doesn't have to go the way they want.\"",
        "counsel:label": "Go to the bank with {patron} and ask for time",
        "counsel:then": "You put on your good shirt and drive into town with {patron}.",
        "counsel:failed": "The man at the bank is polite and says the mortgage belongs to an insurance company in Des Moines. There's nothing he can do.",
        "door:label": "Let {helper} fill the sale with neighbours",
        "door:then": "\"Come by tonight,\" {helper} says. \"We'll work out who bids, and who stands near the auctioneer.\"",
        "kin:label": "Sell what you can and move in with kin",
        again: "The bank won't help. The sale is still on for {due}.",
        organised: "{helper}'s kitchen is full of men in overalls. The plan is simple: nobody bids more than a few cents, and nobody from outside bids at all.",
        remind: "The sale is {due}. If you want the neighbours there, I need to know tonight.",
        delayed: "{patron} talks the bank round, and the bank talks to the insurance company. The sale is called off for a year while the debt is written down. It's not saved, but it's still yours.",
        moved: "You sell the team and the seed corn and load the truck. Your {partnerKin} doesn't look back as you drive out.",
        blocked: "Two hundred neighbours fill the yard. The plough goes for a nickel, the cows for a dime each, the farm for a dollar. When the bank's man tries to bid, someone puts a rope over a tree. Afterwards the neighbours hand the whole lot back to you.",
        alone: "A few neighbours come, but not enough. The insurance company's lawyer bids the debt, and the farm is theirs by noon.",
        evicted: "The auctioneer sells the farm to the insurance company's lawyer in ten minutes. You have thirty days to get off the land.",
      },
    },
    {
      // Cleveland's Slavic Village had more foreclosures in 2007 than any other ZIP code in the country.
      scope: SUBPRIME,
      title: "The Notice on the Door",
      lines: {
        aim: "Keep the house past {due}.",
        intro: "The mortgage was cheap for two years, then the rate reset and the payment doubled. You fell behind, the bank sued, and the sheriff's sale has come and gone. The notice is taped to the door: the deputies are coming to clear the house {due}.",
        threat: "Half the houses on the street are empty already, boarded up or stripped for copper. Nobody's buying anything.",
        partner: "Your {partnerKin} {partner} has been on hold with the bank for two hours.",
        "kin-partner": "{helper} says we don't have to just walk out. Go and talk to {him}.",
        "cast-patron": "The {patronRole}, who knows how the bank's paperwork works.",
        "cast-helper": "Lost {his} own house down the street last year, and knows what's coming.",
        notice: "{helper} saw the deputies tape it up. \"They gave me three hours when they came for mine,\" {he} says. \"Don't wait for them.\"",
        "counsel:label": "Get {patron} to push the bank for a loan modification",
        "counsel:then": "You and {patron} sit at the kitchen table and fax the same forms to the bank for the fourth time.",
        "counsel:failed": "The bank says it never got the forms. The person on the phone says the case is with a different department now, and transfers you to a recording.",
        "door:label": "Ask {helper} to get people on the porch",
        "door:then": "\"Come round tonight,\" {helper} says. \"I know some people who've done this before.\"",
        "kin:label": "Pack up and move in with family",
        again: "The bank has lost the paperwork again. The deputies are still coming {due}.",
        organised: "{helper} has called around. A dozen neighbours and two people from a housing group will be on the porch in the morning, and somebody from the local news might come.",
        remind: "The deputies come {due}. If you're staying, I need to start calling people.",
        delayed: "{patron} gets through to someone at the bank who can actually decide things. They put the eviction on hold while a trial modification is reviewed. It's three months, maybe more.",
        moved: "You rent a truck and take what fits. The house goes back to the bank, and stands empty with the rest.",
        blocked: "The deputies find twenty people on the porch and a camera on the sidewalk. They make a call, and leave. The eviction is postponed for thirty days while the bank reviews the file.",
        alone: "Two neighbours come. The deputies are polite, and your things go out on the lawn anyway.",
        evicted: "The deputies give you an hour. The bank's contractors change the locks, and your things go out on the front lawn.",
      },
    },
    {
      // The PAH, founded in Barcelona in 2009, blocked hundreds of evictions at the door; Spanish law left evicted owners still owing the rest of the loan.
      scope: SPAIN,
      title: "The Eviction Order",
      lines: {
        aim: "Keep the flat past {due}.",
        intro: "When the building work dried up, so did the money. The bank took the flat at auction for half what you paid, and under the law you still owe it the rest. The court's eviction order says the judicial officers come {due}.",
        threat: "Losing the flat doesn't clear the mortgage. You'll owe the bank for years, with nowhere to live.",
        partner: "Your {partnerKin} {partner} wants to go to the PAH meeting, the people who stop evictions.",
        "kin-partner": "{helper} goes to the PAH meetings. Go and talk to {him}.",
        "cast-patron": "The {patronRole}, who understands the bank's papers.",
        "cast-helper": "Goes to the PAH meetings, the platform for people hit by mortgages, and has stood at other people's doors.",
        notice: "{helper} came up the stairs with the court letter in {his} hand. \"There's a meeting tonight,\" {he} says. \"Last week fifty of us stopped one in the next street.\"",
        "counsel:label": "Go to the bank with {patron} and ask them to take the keys and cancel the debt",
        "counsel:then": "You and {patron} wait at the branch for the manager, with every paper you have in a folder.",
        "counsel:failed": "The manager says the decision is made at head office, and head office has said no.",
        "door:label": "Go to the PAH meeting with {helper}",
        "door:then": "\"Come tonight,\" {helper} says. \"Bring the court papers. We'll need them.\"",
        "kin:label": "Move back in with family",
        again: "The bank won't cancel the debt. The officers come {due}.",
        organised: "The meeting room is full. People you've never met write your address down. They'll be on the stairs at eight, in green shirts.",
        remind: "They come {due}. Are you coming to the meeting?",
        delayed: "{patron} finds a clause in the papers, and the bank agrees to take the flat and cancel what's left of the debt, and to let you rent it for two years. It's not yours any more, but you can stay.",
        moved: "You move back in with family, five to a flat meant for three. Yours goes to the bank, and you still owe it money.",
        blocked: "The stairwell is full of green shirts when the judicial officers arrive. They don't try to get past. They write a report and go. The eviction is put off, and the bank agrees to talk.",
        alone: "A handful of people come. The police come with the officers, and the lock is changed by ten.",
        evicted: "The officers come with the police and a locksmith. You carry out what you can, and the bank still says you owe it the rest.",
      },
    },
    {
      // Irish mortgage arrears peaked in 2013; MABS, the state's money advice service, helped households negotiate with the banks.
      scope: IRELAND,
      title: "The Bank's Letter",
      lines: {
        aim: "Keep the house past the court date {due}.",
        intro: "The house was bought at the top of the boom, and the job went in the crash. The bank's solicitors have written: the repossession hearing is {due}.",
        threat: "If the county registrar grants the order, the house is the bank's, and you still owe what it doesn't sell for.",
        partner: "Your {partnerKin} {partner} has a folder of every letter from the bank.",
        "kin-partner": "{helper} went through all this. Ask {him}.",
        "cast-patron": "The {patronRole}, who knows how to talk to banks.",
        "cast-helper": "Went through a repossession hearing two years ago, and kept the house.",
        notice: "{helper} came over when {he} saw the solicitor's letter on the hall table. \"Don't go in there alone,\" {he} says. \"Half the cases get adjourned if you just turn up with a plan.\"",
        "counsel:label": "Go to the money advice service with {patron}",
        "counsel:then": "You and {patron} sit down with an adviser and go through every bill.",
        "counsel:failed": "The adviser does the sums twice. Even with the arrears spread out, the payments are more than you earn.",
        "door:label": "Ask {helper} and the neighbours to come to court",
        "door:then": "\"Come by tonight,\" {helper} says. \"We'll get you ready.\"",
        "kin:label": "Hand back the keys and move in with family",
        again: "The sums don't work. The hearing is still {due}.",
        organised: "{helper} goes through it all with you at the kitchen table: what to say, what to bring. Three neighbours say they'll come and sit in the court.",
        remind: "The hearing's {due}. Are you ready for it?",
        delayed: "With the adviser's plan in hand, the bank agrees to restructure the loan. Lower payments, longer term. The hearing is struck out.",
        moved: "You hand the keys back and move in with your family. The bank sells the house for half what you paid.",
        blocked: "You turn up with a plan and a row of neighbours behind you. The registrar adjourns the case for six months and tells the bank to engage.",
        alone: "You go in alone. The bank's barrister has the papers in order, and the registrar grants the order.",
        evicted: "You don't go to the hearing. The order is granted without you, and a letter tells you when to be out.",
      },
    },
    {
      title: "The Notice on the Door",
      lines: {
        aim: "Keep the household's home past {due}.",
        intro: "The household is months behind on the home. The notice is on the door: you're to be out {due}.",
        threat: "If nothing is done, your things go out on the street.",
        partner: "Your {partnerKin} {partner} has been asking relatives about a spare room.",
        "kin-partner": "{helper} says we don't have to just leave. Talk to {him}.",
        "cast-patron": "The {patronRole}, who might be able to talk to whoever holds the debt.",
        "cast-helper": "Has seen this happen to others, and has ideas about stopping it.",
        notice: "{helper} saw the notice go up. \"It happened to people I know,\" {he} says. \"It doesn't always go the way they want.\"",
        "counsel:label": "Ask {patron} to talk to whoever holds the debt",
        "counsel:then": "You go with {patron} to plead for more time.",
        "counsel:failed": "Nobody will wait. The notice stands.",
        "door:label": "Get {helper} to bring the neighbours to the door",
        "door:then": "\"Come by tonight,\" {helper} says, \"and we'll work out who stands where.\"",
        "kin:label": "Move in with kin",
        again: "Nobody will wait. You have until {due}.",
        organised: "{helper} has the neighbours ready. They'll be at the door in the morning.",
        remind: "It's {due}. Do you want the neighbours there or not?",
        delayed: "{patron} gets you more time. It's not over, but you're still in your home.",
        moved: "You pack up and move in with kin.",
        blocked: "The neighbours stand at the door, and the men sent to clear the house leave without doing it.",
        alone: "Not enough people come, and your things go out on the street.",
        evicted: "Your things go out on the street, and the lock is changed.",
      },
    },
  ],
};
