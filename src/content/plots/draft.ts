import { sexOf } from "../../core/brief";
import { neighbours, notable, partnerWords, pronounWords, seasonOf, US, within } from "./common";
import type { Actor } from "../../core/types";
import type { CharacterScope } from "../characters/context-types";
import type { Condition, PlotContext, PlotTemplate } from "./types";

// End years are exclusive.
const BRITAIN = { bounds: [-8, 49.9, 2, 59], except: [[-10.7, 51.3, -5.4, 55.5]] } as const;
const GREAT_WAR_BRITAIN = { years: [1916, 1919], ...BRITAIN } as const;
const GREAT_WAR_US = { years: [1917, 1919], ...US } as const;
const WAR_BRITAIN = { years: [1939, 1946], ...BRITAIN } as const;
const WAR_US = { years: [1940, 1946], ...US } as const;
const NATIONAL_SERVICE = { years: [1949, 1961], ...BRITAIN } as const;
const VIETNAM_US = { years: [1965, 1973], ...US } as const;
const BIRTHDAY_BALLOT = { years: [1965, 1973], bounds: [112, -44, 154, -10] } as const;
const MALVINAS = {
  years: [1982, 1983], bounds: [-73.6, -55.1, -53.6, -21.8],
  except: [[-76, -56, -70, -17], [-58.2, -35.1, -53, -30], [-62.7, -27.3, -54, -19]],
} as const satisfies CharacterScope;
const AFGHAN_WAR = {
  years: [1980, 1989],
  places: ["city-moscow", "city-st-petersburg", "city-kyiv", "city-minsk", "city-kharkiv", "city-odessa", "city-dnipro", "city-donetsk", "city-lviv",
    "city-tashkent", "city-dushanbe", "city-ashgabat", "city-bishkek", "city-almaty", "city-baku", "city-tbilisi", "city-yerevan",
    "city-riga", "city-vilnius", "city-tallinn", "city-novosibirsk", "city-yekaterinburg", "city-nizhny-novgorod", "city-samara", "city-kazan",
    "city-omsk", "city-chelyabinsk", "city-rostov", "city-ufa", "city-perm", "city-volgograd", "city-krasnoyarsk", "city-voronezh",
    "city-saratov", "city-krasnodar", "city-vladivostok", "city-irkutsk", "city-tomsk", "city-nizhny-tagil", "city-archangel", "city-murmansk"],
} as const;
const CALLED: CharacterScope[] = [GREAT_WAR_BRITAIN, GREAT_WAR_US, WAR_BRITAIN, WAR_US, NATIONAL_SERVICE, VIETNAM_US, BIRTHDAY_BALLOT, MALVINAS, AFGHAN_WAR];

/** The player's son of call-up age, else a brother: kin share a parent, as in core/kin.ts. */
function recruitOf(c: PlotContext): { kin: Actor; word: string } | undefined {
  const ofAge = (a?: Actor) => !!a && a.kind === "human" && !a.dead && sexOf(a) === "male" && (a.age ?? 0) >= 18 && (a.age ?? 0) <= 26;
  const byId = (id: string) => c.actors.find((a) => a.id === id);
  const relations = c.player.relations ?? [];
  const son = relations.filter((r) => r.kind === "child").map((r) => byId(r.other)).find(ofAge);
  if (son) return { kin: son, word: "son" };
  const parents = new Set(relations.filter((r) => r.kind === "parent").map((r) => r.other));
  const brother = parents.size
    ? c.actors.find((a) => a.id !== c.player.id && ofAge(a) && a.relations?.some((r) => r.kind === "parent" && parents.has(r.other)))
    : undefined;
  return brother && { kin: brother, word: "brother" };
}

/** An older man who has been through a war himself. */
const veteranOf = (c: PlotContext, apart: Actor[]) =>
  neighbours(c).find((a) => sexOf(a) === "male" && (a.age ?? 30) >= 45 && !apart.some((b) => b.id === a.id || b.householdId === a.householdId));

const fired = (id: string): Condition => ({ type: "fired", id });
const not = (of: Condition): Condition => ({ type: "not", of });

/** Papers come calling up the player's son or brother, with a date to report. */
export const draft: PlotTemplate = {
  id: "draft",
  shape: "household",
  look: {
    emblem: "notice",
    palette: { ink: "#11140f", fill: "#263022", edge: "#5e5a3a", light: "#ecebdc", accent: "#b85a3a" },
  },
  weight: (c) => {
    const recruit = recruitOf(c), patron = notable(c);
    // The Malvinas call-up ran from April to June 1982.
    const season = !within(c, MALVINAS) || seasonOf(c) === "autumn";
    return season && within(c, ...CALLED) && recruit && patron && veteranOf(c, [recruit.kin, patron]) ? 0.8 : 0;
  },
  cast: (c) => {
    const recruit = recruitOf(c), patron = notable(c);
    const elder = recruit && patron && veteranOf(c, [recruit.kin, patron]);
    return recruit && patron && elder && { kin: recruit.kin, patron, elder };
  },
  begin: (c, cast) => {
    const kin = cast.kin!, patron = cast.patron!, elder = cast.elder!;
    const p = partnerWords(c);
    return {
      deadline: Math.floor(c.clock / 86400) * 86400 + 22 * 3600,
      words: {
        kin: kin.name,
        kinWord: recruitOf(c)?.word ?? "son",
        patron: patron.name,
        patronRole: patron.role.toLowerCase(),
        elder: elder.name,
        ...pronounWords(kin),
        ...p.words,
      },
      refs: { kin: kin.id, patron: patron.id, elder: elder.id, ...p.refs },
    };
  },
  opening: [{
    type: "choose", line: "papers", focus: "kin", brought: true,
    choices: [{ id: "report" }, { id: "defer", check: { stat: "wit", skill: "speech", odds: 0.45 } }, { id: "flee" }],
  }],
  developments: [
    { id: "board", when: fired("defer:failed"), then: [{ type: "choose", line: "board", focus: "kin", choices: [{ id: "report" }, { id: "flee" }] }] },
    { id: "farewell", when: fired("report"), then: [{ type: "gather", at: "kin", when: "evening", label: "sendoff", scene: "feast" }] },
  ],
  endings: [
    { id: "deferred", when: { type: "all", of: [{ type: "after", id: "defer", hours: 3 }, not(fired("defer:failed"))] } },
    { id: "fled", when: { type: "after", id: "flee", hours: 2 } },
    { id: "sent", when: { type: "all", of: [fired("report"), { type: "came" }] } },
    { id: "missed", when: { type: "all", of: [fired("report"), { type: "gathered" }] } },
    { id: "passed", when: { type: "all", of: [not(fired("report")), { type: "due" }] } },
  ],
  wording: [
    {
      // The Military Service Act took single men from March 1916 and married men from May; local tribunals heard appeals, and about 16,000 men claimed conscience.
      scope: GREAT_WAR_BRITAIN,
      title: "Call-Up Papers",
      lines: {
        aim: "Decide with {kin} what to do about his call-up.",
        intro: "Your {kinWord} {kin} has his papers: he is to report to the depot in a week, to be sent to France. The lists of the dead in the paper get longer every morning.",
        threat: "The only way out is the local tribunal, a bench of businessmen and an army officer, and they turn down most of the men who ask.",
        partner: "Your {partnerKin} {partner} has read the casualty lists every day since the Somme.",
        "kin-partner": "He's had his papers. Talk to him before he decides anything on his own.",
        "cast-kin": "Your {kinWord}. Has been called up.",
        "cast-patron": "The {patronRole}, who knows the men who sit on the tribunal.",
        "cast-elder": "Fought in South Africa against the Boers, and doesn't talk about it.",
        papers: "{kin} puts the buff form on the table. \"Report in seven days,\" he says. \"What do you think I should do?\"",
        "report:label": "Tell him to go, and give him a proper send-off",
        "report:then": "He nods, and folds the papers into his pocket. Tonight the family will see him off.",
        "defer:label": "Appeal to the tribunal, and get {patron} to speak for him",
        "defer:then": "You and {kin} go to the town hall with {patron}, and wait on a bench outside with a dozen other men's families.",
        "defer:failed": "The tribunal hears you for four minutes. The army's man asks why your {kinWord} should stay home when other men's sons have gone. Appeal dismissed.",
        "flee:label": "Stand by him if he refuses to fight on grounds of conscience",
        board: "The tribunal turned him down. He reports in a week unless he refuses outright.",
        sendoff: "Seeing {kin} off",
        sent: "The neighbours crowd into the kitchen. {elder} shakes his hand and says nothing. In the morning you walk him to the station, and the train is full of boys his age.",
        missed: "{kin} goes to the station with his friends. You weren't there to say goodbye.",
        deferred: "{patron} tells the tribunal that {kin} is needed at home and at work, and the tribunal gives him three months' exemption. Then they'll see him again.",
        fled: "{kin} tells the tribunal he won't kill anyone. He is arrested, handed over to the army, and refuses to put on the uniform. The court martial gives him 112 days' hard labour. People in the street stop speaking to you.",
        passed: "The day goes by and nothing is decided. In a week {kin} reports to the depot like everyone else.",
      },
    },
    {
      // Ten million men registered on 5 June 1917; local boards granted exemptions for dependents and farm work, and "slacker raids" in 1918 rounded up men who hadn't.
      scope: GREAT_WAR_US,
      title: "The Draft Notice",
      lines: {
        aim: "Decide with {kin} what to do about his draft notice.",
        intro: "Your {kinWord} {kin} registered for the draft in June. Now the local board has called his number: he reports to camp next week, and then France.",
        threat: "Men who don't report are called slackers. The papers print their names, and there are raids to round them up.",
        partner: "Your {partnerKin} {partner} wants to know if the board ever lets anyone off.",
        "kin-partner": "His number came up. Talk to him.",
        "cast-kin": "Your {kinWord}. Has been drafted.",
        "cast-patron": "The {patronRole}, who sits with the men on the draft board at church.",
        "cast-elder": "Fought in Cuba in '98, and tells everyone the war will be over by Christmas.",
        papers: "{kin} shows you the card from the board. \"Camp next week,\" he says. \"What do you want me to do?\"",
        "report:label": "Tell him to go, and give him a send-off",
        "report:then": "He puts the card on the mantelpiece. Tonight the family will see him off.",
        "defer:label": "Get {patron} to ask the board for an exemption",
        "defer:then": "You and {patron} go to the board's office above the bank, with a letter about the household's work.",
        "defer:failed": "The board says every family needs its men. They don't grant it.",
        "flee:label": "Send him to a cousin's in the hills until it's over",
        board: "The board said no. He reports next week, unless he disappears first.",
        sendoff: "Seeing {kin} off",
        sent: "The whole street comes out. There's a band at the depot and flags on every porch. {elder} tells {kin} to keep his head down, and means it.",
        missed: "{kin} goes to the depot with the other boys and the band. You weren't there to see him go.",
        deferred: "The board grants a deferment: {kin} is needed for the household's work. Some neighbours call it favouritism.",
        fled: "{kin} leaves before dawn for a cousin's place where nobody asks questions. His name is in the paper as a slacker, and a federal agent comes asking. You tell him you don't know where he is.",
        passed: "The day goes by and nothing is decided. Next week {kin} goes to camp with the others.",
      },
    },
    {
      // From 1943 one in ten young men called up was sent by ballot to the coal mines instead of the forces: the Bevin Boys.
      scope: WAR_BRITAIN,
      title: "Call-Up Papers",
      lines: {
        aim: "Decide with {kin} what to do about his call-up.",
        intro: "The envelope came this morning: your {kinWord} {kin} is to report for his medical, and then for training. Most of the boys from the street have gone already.",
        threat: "Some jobs keep a man home: reserved occupations, they're called. Everyone else goes where the forces send him.",
        partner: "Your {partnerKin} {partner} has been listening to the news from the moment it came on.",
        "kin-partner": "His papers came. Talk to him.",
        "cast-kin": "Your {kinWord}. Has been called up.",
        "cast-patron": "The {patronRole}, who could write a letter saying {kin}'s work is reserved.",
        "cast-elder": "Was at the Somme, and walks with a stick because of it.",
        papers: "{kin} has the envelope open on the table. \"Medical on Thursday,\" he says. \"Then wherever they send me.\"",
        "report:label": "Tell him to go, and give him a proper send-off",
        "report:then": "He props the letter behind the clock. Tonight the family will see him off.",
        "defer:label": "Get {patron} to write that his work is reserved",
        "defer:then": "{patron} reads the list of reserved occupations twice and starts a letter.",
        "defer:failed": "{kin}'s work isn't on the list. {patron} says there's nothing to be done.",
        "flee:label": "Back him if he goes before the tribunal as a conscientious objector",
        board: "The work isn't reserved. He goes, unless he goes before the tribunal for conscience.",
        sendoff: "Seeing {kin} off",
        sent: "The neighbours bring what they can spare off the ration, and there's a cake of sorts. {elder} gives {kin} his old penknife. In the morning he goes.",
        missed: "{kin} catches the early train. You weren't there to see him off.",
        deferred: "The letter goes in, and {kin}'s work is counted as reserved. He stays, and some of the neighbours whose sons went don't hide what they think.",
        fled: "The tribunal registers {kin} as a conscientious objector, on condition that he works on the land. He goes to a farm two counties away. Some neighbours call him a conchie to your face.",
        passed: "The day goes by and nothing is decided. On Thursday {kin} passes his medical.",
      },
    },
    {
      // Induction orders began "Greeting:"; local boards deferred farm and war workers, and about 12,000 objectors served in Civilian Public Service camps.
      scope: WAR_US,
      title: "Greetings",
      lines: {
        aim: "Decide with {kin} what to do about his induction notice.",
        intro: "The letter from the draft board begins \"Greeting:\". Your {kinWord} {kin} is to report for induction in ten days. There are blue-star flags in half the windows on the street.",
        threat: "The board can defer farm workers and men in war plants. Anyone else goes.",
        partner: "Your {partnerKin} {partner} read the letter and went out to the yard without a word.",
        "kin-partner": "His letter came. Talk to him.",
        "cast-kin": "Your {kinWord}. Has been drafted.",
        "cast-patron": "The {patronRole}, who knows people at the plant and on the draft board.",
        "cast-elder": "Was in France in 1918, and still has the helmet.",
        papers: "{kin} reads it out to you, the \"Greeting\" and all. \"Ten days,\" he says.",
        "report:label": "Tell him to go, and give him a send-off",
        "report:then": "He props the letter on the radio. Tonight the family will see him off.",
        "defer:label": "Get {patron} to find him a job at the war plant",
        "defer:then": "{patron} makes some telephone calls, and you and {kin} go down to the plant's hiring office.",
        "defer:failed": "The plant is full up, and the board won't defer a man who's only just been hired.",
        "flee:label": "Back him if he registers as a conscientious objector",
        board: "No deferment. He goes in ten days, unless he goes as an objector.",
        sendoff: "Seeing {kin} off",
        sent: "The family puts a blue star in the window. {elder} comes by with a bottle, and tells {kin} to write to his mother every week. In ten days he's on the bus.",
        missed: "{kin} gets on the bus with the others. You weren't there.",
        deferred: "{kin} starts on the night shift at the plant, and the board classifies him II-B, essential war work. He stays home, and works seventy hours a week.",
        fled: "The board classifies {kin} as an objector, and sends him to a Civilian Public Service camp to fight forest fires, unpaid. The neighbours with stars in their windows have opinions about it.",
        passed: "The day goes by and nothing is decided. In ten days {kin} reports for induction.",
      },
    },
    {
      // Every young man owed two years from 1950; apprentices and students were deferred until they finished. The last were called up in 1960.
      scope: NATIONAL_SERVICE,
      title: "National Service",
      lines: {
        aim: "Decide with {kin} what to do about his National Service.",
        intro: "Your {kinWord} {kin} has his papers for National Service: two years in uniform. Most go to Germany, but some go to Malaya, Kenya or Cyprus, where there's shooting.",
        threat: "Apprentices and students can put it off until they finish. Nobody gets out of it altogether without a reason the board accepts.",
        partner: "Your {partnerKin} {partner} says two years of square-bashing never hurt anyone. Then reads the bit about Malaya again.",
        "kin-partner": "His papers came. Talk to him.",
        "cast-kin": "Your {kinWord}. Has his National Service papers.",
        "cast-patron": "The {patronRole}, who could find {kin} an apprenticeship.",
        "cast-elder": "Was at Dunkirk, and says the army makes a man or breaks him.",
        papers: "{kin} has the letter in one hand and his tea in the other. \"Two years,\" he says. \"Could be anywhere.\"",
        "report:label": "Tell him to go, and give him a send-off",
        "report:then": "He puts the letter in the drawer with the rent book. Tonight there'll be a send-off.",
        "defer:label": "Get {patron} to find him an apprenticeship",
        "defer:then": "{patron} goes round the works and the garages asking who needs an apprentice.",
        "defer:failed": "Nobody is taking on apprentices this year. The deferment won't come.",
        "flee:label": "Back him if he claims conscientious objection",
        board: "No apprenticeship. He goes, unless he objects on conscience.",
        sendoff: "Seeing {kin} off",
        sent: "There's a crowd at the pub, and someone buys {kin} his first pint as a soldier. {elder} gives him advice about sergeants. In the morning he's on the train to camp.",
        missed: "{kin} goes off to camp with a lad from up the road. You weren't there.",
        deferred: "{patron} finds a place at a garage. {kin} starts as an apprentice mechanic on Monday, and his call-up is put off until he has served his time. By then, people say, there may be no call-up at all.",
        fled: "The tribunal hears {kin}, and gives him non-combatant duties: he'll serve as a medical orderly. Some of the lads he grew up with won't speak to him.",
        passed: "The day goes by and nothing is decided. {kin} goes to camp with everyone else.",
      },
    },
    {
      // Student deferments held until the lottery of 1 December 1969; tens of thousands of draft-age men went to Canada, which did not send them back.
      scope: VIETNAM_US,
      title: "The Draft Notice",
      lines: {
        aim: "Decide with {kin} what to do about his draft notice.",
        intro: "Your {kinWord} {kin}'s induction notice came this morning. Two boys from the neighbourhood have come home from Vietnam in coffins this year.",
        threat: "A college place or a doctor's letter can keep a man out. Men without either go, or go to Canada.",
        partner: "Your {partnerKin} {partner} has been watching the war on the evening news for years, and turned it off tonight.",
        "kin-partner": "His notice came. Talk to him, before he does something.",
        "cast-kin": "Your {kinWord}. Has been drafted.",
        "cast-patron": "The {patronRole}, who knows a doctor, and somebody at the college.",
        "cast-elder": "Fought in Korea, and thinks a man answers when his country calls.",
        papers: "{kin} drops the notice on the kitchen table. \"Report for induction,\" he says. \"Some guys from school went to Toronto.\"",
        "report:label": "Tell him to go, and give him a send-off",
        "report:then": "He puts the notice on the fridge under a magnet. Tonight there'll be a send-off.",
        "defer:label": "Get {patron} to find a doctor's letter or a college place",
        "defer:then": "{patron} makes some calls. You drive {kin} across town to a doctor who's written letters before.",
        "defer:failed": "The doctor examines {kin} and won't sign anything. \"Healthy as a horse,\" he says, not kindly.",
        "flee:label": "Drive him to the Canadian border",
        board: "No letter. He reports, or he goes north.",
        sendoff: "Seeing {kin} off",
        sent: "There are paper plates and a cake that says GOOD LUCK. {elder} shakes {kin}'s hand for a long time. In the morning the bus takes him to the induction center.",
        missed: "{kin} goes to the induction center with a friend. You weren't there.",
        deferred: "The doctor finds something in the X-rays. {kin} is classified 4-F, unfit for service. Some people on the street give you looks.",
        fled: "You drive all night. At the border crossing they ask where he's going, and {kin} says to visit a friend. He doesn't come back. The FBI comes asking, and you say you don't know where he is.",
        passed: "The day goes by and nothing is decided. {kin} reports for induction.",
      },
    },
    {
      // From 1965 twenty-year-old Australians were drawn by birthday in a ballot of marbles, and from 1966 national servicemen went to Vietnam.
      scope: BIRTHDAY_BALLOT,
      title: "The Birthday Ballot",
      lines: {
        aim: "Decide with {kin} what to do about his call-up.",
        intro: "The government drew marbles from a barrel, one for each birthday, and {kin}'s birthday came up. Your {kinWord} is to do two years' National Service, and national servicemen are going to Vietnam.",
        threat: "Students and apprentices can be deferred. Refusing to register or to serve means prison.",
        partner: "Your {partnerKin} {partner} has heard about the Save Our Sons women who protest outside the call-up office.",
        "kin-partner": "His birthday came up. Talk to him.",
        "cast-kin": "Your {kinWord}. His birthday was drawn in the ballot.",
        "cast-patron": "The {patronRole}, who could find {kin} an apprenticeship.",
        "cast-elder": "Fought at Tobruk, and has no time for draft dodgers.",
        papers: "{kin} has the letter from the Department of Labour and National Service. \"My birthday,\" he says. \"Out of all of them.\"",
        "report:label": "Tell him to go, and give him a send-off",
        "report:then": "He puts the letter on the fridge. Tonight there'll be a send-off.",
        "defer:label": "Get {patron} to find him an apprenticeship",
        "defer:then": "{patron} asks around every workshop in town.",
        "defer:failed": "Nobody's taking on apprentices. The deferment won't come.",
        "flee:label": "Hide him with friends until the government changes",
        board: "No deferment. He goes, or he goes underground.",
        sendoff: "Seeing {kin} off",
        sent: "There's a barbecue in the yard and half the street comes. {elder} tells {kin} to listen to his sergeant. In the morning he goes.",
        missed: "{kin} goes off to the training camp at Kapooka with the other national servicemen. You weren't there.",
        deferred: "{patron} finds an apprenticeship with an electrician. {kin}'s call-up is deferred while he trains.",
        fled: "{kin} moves between friends' houses, never staying long. The Commonwealth Police come to the door twice. He'll stay out of sight until the law changes, if it does.",
        passed: "The day goes by and nothing is decided. {kin} reports for his medical.",
      },
    },
    {
      // Many of the 649 Argentines killed in the Malvinas war were conscripts of the classes of 1962 and 1963.
      scope: MALVINAS,
      title: "The Call-Up",
      lines: {
        aim: "Decide with {kin} what to do about his call-up.",
        intro: "The radio says the Malvinas are Argentine again, and the crowds in the Plaza de Mayo are cheering. Your {kinWord} {kin}'s class has been called back to the barracks. Conscripts are being flown south.",
        threat: "The British are sending a fleet. The boys going south are nineteen, and some have never fired a rifle.",
        partner: "Your {partnerKin} {partner} cheered with everyone else, until the letter came.",
        "kin-partner": "His class has been called up. Talk to him.",
        "cast-kin": "Your {kinWord}. His class has been called back.",
        "cast-patron": "The {patronRole}, who knows an officer at the regiment.",
        "cast-elder": "Did his own service under Perón, and says the junta will get these boys killed.",
        papers: "{kin} comes in with the notice from the regiment. \"Report by Monday,\" he says. \"They're sending boys to the islands.\"",
        "report:label": "Tell him to go, and give him a send-off",
        "report:then": "He folds the notice into his wallet. Tonight the family will see him off.",
        "defer:label": "Ask {patron} to get him posted somewhere in the city",
        "defer:then": "{patron} goes to see the officer {patron} knows.",
        "defer:failed": "The officer says every unit is being sent somewhere, and he can't be seen doing favours now.",
        "flee:label": "Send him to his aunt's in the country until it's over",
        board: "No favours. He reports by Monday, or he stays out of sight.",
        sendoff: "Seeing {kin} off",
        sent: "Everyone comes for an asado. {elder} grips {kin}'s shoulder and tells him to come home. On Monday he reports, and a week later he's on a plane south.",
        missed: "{kin} reports with the other boys from his class. You weren't there.",
        deferred: "The officer finds {kin} a place guarding a depot in the city. He spends the war there while other boys freeze in the trenches. You don't talk about it.",
        fled: "{kin} takes the bus to his aunt's. The army lists him as a deserter. The war is over by June, but the record isn't.",
        passed: "The day goes by and nothing is decided. On Monday {kin} reports to the regiment.",
      },
    },
    {
      // Soviet conscripts served two years, and about 15,000 died in Afghanistan; the bodies came home in sealed zinc coffins.
      scope: AFGHAN_WAR,
      title: "The Summons",
      lines: {
        aim: "Decide with {kin} what to do about his call-up.",
        intro: "The summons from the military enlistment office came this morning: your {kinWord} {kin} is to report for two years' service. Nobody says it out loud, but some of the boys go to Afghanistan.",
        threat: "The papers say little about it. But everyone knows a family who got a sealed zinc coffin and wasn't allowed to open it.",
        partner: "Your {partnerKin} {partner} is already asking who knows someone at the enlistment office.",
        "kin-partner": "His summons came. Talk to him.",
        "cast-kin": "Your {kinWord}. Has his summons.",
        "cast-patron": "The {patronRole}, who knows people, and how things get arranged.",
        "cast-elder": "Did his own two years in the army, and wears his father's medals on Victory Day.",
        papers: "{kin} puts the summons on the table. \"Two years,\" he says. \"They say nobody gets to choose where.\"",
        "report:label": "Tell him to go, and give him a send-off",
        "report:then": "He puts the summons in the drawer. Tonight there'll be a send-off.",
        "defer:label": "Ask {patron} to arrange a medical exemption",
        "defer:then": "{patron} says these things can be arranged, and that it will cost something.",
        "defer:failed": "The doctor at the enlistment office won't take the envelope. \"Not this year,\" he says. \"They're checking.\"",
        "flee:label": "Send him to relatives in the village and hope the file gets lost",
        board: "No exemption. He goes, or he hides and hopes.",
        sendoff: "Seeing {kin} off",
        sent: "The table is full: salads, vodka, toasts until late. {elder} tells {kin} to keep his head down. In the morning you walk him to the enlistment office, and the bus takes the boys away.",
        missed: "{kin} goes to the enlistment office with his friends. You weren't there.",
        deferred: "The papers come back: flat feet, unfit. {kin} stays home. Nobody asks how.",
        fled: "{kin} goes to relatives in the village. The file doesn't get lost. In the spring the police come, and he goes anyway, a year late and with a mark against his name.",
        passed: "The day goes by and nothing is decided. {kin} reports with the others.",
      },
    },
    {
      title: "Call-Up Papers",
      lines: {
        aim: "Decide with {kin} what to do about his call-up.",
        intro: "Your {kinWord} {kin} has been called up, and is to report in a few days.",
        threat: "The army takes whoever it calls unless someone with influence can keep him home.",
        partner: "Your {partnerKin} {partner} doesn't want him to go.",
        "kin-partner": "His papers came. Talk to him.",
        "cast-kin": "Your {kinWord}. Has been called up.",
        "cast-patron": "The {patronRole}, who has some influence.",
        "cast-elder": "Fought in an earlier war, and doesn't talk about it much.",
        papers: "{kin} shows you the papers. \"I report in a few days,\" he says. \"What should I do?\"",
        "report:label": "Tell him to go, and give him a send-off",
        "report:then": "He puts the papers away. Tonight the family will see him off.",
        "defer:label": "Ask {patron} to get him excused",
        "defer:then": "You go with {kin} to see {patron}.",
        "defer:failed": "{patron} tries, but nobody will make an exception.",
        "flee:label": "Help him get away until it's over",
        board: "Nobody will excuse him. He goes, or he leaves.",
        sendoff: "Seeing {kin} off",
        sent: "The neighbours come to see him off. {elder} gives him advice. In the morning he goes.",
        missed: "{kin} leaves with the others. You weren't there to see him off.",
        deferred: "{patron} gets him excused, for now.",
        fled: "{kin} leaves before dawn. Officials come asking, and you say you don't know where he is.",
        passed: "The day goes by and nothing is decided. {kin} reports with the others.",
      },
    },
  ],
};
