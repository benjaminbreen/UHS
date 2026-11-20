import { sexOf } from "../../core/brief";
import { neighbours, notable, partnerWords, pickOf, pronounWords, temper, within } from "./common";
import type { Condition, PlotContext, PlotTemplate } from "./types";

const ARGENTINA = { years: [1976, 1984], bounds: [-69, -41, -57, -22], except: [[-62, -27, -54, -19]] } as const;
const CHILE = { years: [1973, 1990], bounds: [-76, -56, -69.5, -17.5], except: [[-71.8, -42.5, -69.5, -39]] } as const;
const URUGUAY = { years: [1973, 1985], bounds: [-58, -35, -53, -30] } as const;
const GREECE = { years: [1967, 1975], bounds: [19.3, 34.7, 26.7, 41.8], except: [[19.3, 40, 20.8, 42], [20.5, 41.35, 26, 42], [20.7, 40.85, 22.5, 41.35], [26, 40.3, 27, 42]] } as const;
// The Soviet Union of 1937 in two boxes, leaving out the Baltic states, Poland, Romania, Turkey and Mongolia.
const SOVIET_WEST = { years: [1937, 1939], bounds: [27, 44, 60, 70] } as const;
const SOVIET_EAST = { years: [1937, 1939], bounds: [60, 49, 180, 78] } as const;
const PURGES = [URUGUAY, ARGENTINA, CHILE, GREECE, SOVIET_WEST, SOVIET_EAST];

const castOf = (c: PlotContext) => {
  const patron = notable(c);
  const pool = neighbours(c).filter((a) => (a.age ?? 30) >= 40 && a.householdId !== patron?.householdId);
  const neighbour = pool.length ? pickOf(c, pool, "taken-parent") : undefined;
  return patron && neighbour && { neighbour, patron };
};

const fired = (id: string): Condition => ({ type: "fired", id });

/** Men come in the night for a neighbour's child, and nobody will say where
 * they have been taken. What the neighbours do, or don't, is the plot. */
export const taken: PlotTemplate = {
  id: "taken",
  shape: "witness",
  look: {
    emblem: "nightstreet",
    palette: { ink: "#0c0d12", fill: "#1e2230", edge: "#5a5660", light: "#e6e4ea", accent: "#d8b868" },
  },
  weight: (c) => (within(c, ...PURGES) && castOf(c) ? 0.6 * temper(c, "agreeableness") : 0),
  cast: (c) => castOf(c),
  begin: (c, cast) => {
    const neighbour = cast.neighbour!, patron = cast.patron!;
    const p = partnerWords(c);
    const midnight = Math.floor(c.clock / 86400) * 86400;
    const child = pickOf(c, ["son", "daughter"], "taken-child");
    const pp = pronounWords(patron);
    return {
      deadline: midnight + 21 * 3600,
      words: {
        neighbour: neighbour.name,
        patron: patron.name,
        taken: child,
        they: child === "son" ? "he" : "she",
        them: child === "son" ? "him" : "her",
        parent: sexOf(neighbour) === "male" ? "father" : "mother",
        pHe: pp.he,
        PHe: pp.He,
        pHis: pp.his,
        ...pronounWords(neighbour),
        ...p.words,
      },
      refs: { neighbour: neighbour.id, patron: patron.id, ...p.refs },
    };
  },
  opening: [{
    type: "choose", line: "door", focus: "neighbour", from: "neighbour",
    choices: [{ id: "go" }, { id: "ask", check: { stat: "extraversion", skill: "speech", odds: 0.5 } }, { id: "quiet" }],
  }],
  developments: [
    { id: "station", when: { type: "after", id: "go", hours: 2 }, then: [{ type: "card", line: "station", focus: "neighbour" }, { type: "regard", role: "neighbour", delta: 2 }] },
    { id: "asked", when: { type: "all", of: [{ type: "after", id: "ask", hours: 2 }, { type: "not", of: fired("ask:failed") }] }, then: [{ type: "card", line: "asked", focus: "patron" }, { type: "regard", role: "neighbour", delta: 1 }] },
    { id: "shut", when: fired("quiet"), then: [{ type: "regard", role: "neighbour", delta: -2 }] },
    {
      id: "bag",
      when: { type: "any", of: [{ type: "after", id: "go", hours: 3 }, { type: "after", id: "ask", hours: 3 }, { type: "after", id: "quiet", hours: 2 }] },
      then: [{ type: "choose", line: "bag", focus: "neighbour", choices: [{ id: "keep" }, { id: "burn" }, { id: "return" }] }],
    },
  ],
  endings: [
    { id: "kept", when: fired("keep") },
    { id: "burned", when: fired("burn") },
    { id: "returned", when: fired("return") },
    { id: "gone", when: { type: "gone", role: "neighbour" } },
    { id: "passed", when: { type: "due" } },
  ],
  wording: [
    {
      // Uruguay's dictatorship held more political prisoners for its size than any country in the world; families went from barracks to barracks to find them.
      scope: URUGUAY,
      title: "A Neighbour Was Taken",
      lines: {
        intro: "Soldiers came to {neighbour}'s house at three in the morning and took {his} {taken} away. Nobody has said where to, or why.",
        threat: "Thousands of people are in prison for their politics, and the army doesn't tell families where they are held. Anyone seen asking too many questions can be next.",
        partner: "Your {partnerKin} {partner} says to stay away from the window.",
        "kin-partner": "Don't get mixed up in it. Please. Think of the children.",
        "cast-neighbour": "Has been out looking for {his} {taken} since dawn.",
        "cast-patron": "Has a cousin who is an army officer.",
        door: "{neighbour} is at your door, grey in the face. {He} wants to know if you saw the soldiers, and whether you'll come with {him} to the barracks to ask where {his} {taken} is.",
        "go:label": "Go with {neighbour} to ask at the barracks",
        "go:then": "You walk with {neighbour} to the barracks gate. The sentry tells you to wait.",
        station: "After two barracks and four hours, an officer tells {neighbour} that {his} {taken} is being held, and that the family will be told where in due course. Nothing more.",
        "ask:label": "Ask {patron} to ask the cousin in the army",
        "ask:then": "{patron} listens, and says {pHe} will see what can be done.",
        asked: "{patron} comes back in the afternoon. The cousin says {neighbour}'s {taken} is alive and being held, and that the family shouldn't make a fuss. It's more than anyone else has heard.",
        burned: "You burn the papers in the kitchen sink and wash the ash away. Weeks later, {neighbour} learns that {his} {taken} is in a military prison, and the family can visit once a month and talk through glass.",
        returned: "You give the bag back to {neighbour}. Weeks later {neighbour} learns that {they} is in a military prison, and goes once a month to talk through the glass.",
      },
    },
    {
      // CONADEP documented nearly 9,000 disappearances in 1984 and human rights groups estimate 30,000; abductors often came at night in unmarked Ford Falcons. The Mothers of the Plaza de Mayo first walked there on 30 April 1977.
      scope: ARGENTINA,
      title: "A Neighbour Was Taken",
      lines: {
        intro: "At two in the morning a green Ford Falcon with no number plates stopped outside {neighbour}'s building. Men in plain clothes took {his} {taken} away. Nobody knows who they were, or where {they} has gone.",
        threat: "People who are taken like this aren't charged and aren't seen again. Anyone who asks too many questions can be next.",
        partner: "Your {partnerKin} {partner} says not to open the door to anyone.",
        "kin-partner": "Don't get involved. You saw nothing. Please.",
        "cast-neighbour": "Has been out looking for {his} {taken} since dawn.",
        "cast-patron": "Knows a colonel from {pHis} military service.",
        door: "{neighbour} is at your door, grey in the face. {He} wants to know if you saw the car, and whether you'll come with {him} to the police station.",
        "go:label": "Go with {neighbour} to the police station",
        "go:then": "You walk with {neighbour} to the station. {He} holds a photograph of {his} {taken} the whole way.",
        station: "At the desk an officer looks through a book and says there's no record of any arrest. Perhaps {his} {taken} ran off with friends. {neighbour} fills in a habeas corpus petition, a demand that a court say where a prisoner is being held, and you sign as a witness. Everyone knows the courts reject them.",
        "ask:label": "Ask {patron} to speak to the colonel",
        "ask:then": "{patron} listens with the door half closed, and says {pHe} will try.",
        "ask:failed": "{patron} says {pHe} doesn't know any colonels, and closes the door.",
        asked: "{patron} comes back in the evening. The colonel said there was nothing he could do, and that {patron} shouldn't ask again. It's the most anyone will say.",
        bag: "Last month {neighbour}'s {taken} left a bag with you to look after: books, a duplicating stencil, papers you didn't read. If anyone searches this building, they'll find it.",
        kept: "You hide the bag under the floorboards. Nobody ever comes for it. On Thursdays you sometimes see {neighbour} walking in the Plaza de Mayo beside the mothers in white headscarves, holding up {his} {taken}'s photograph.",
        burned: "You burn the papers in the bathroom and flush the ash away. On Thursdays you sometimes see {neighbour} walking in the Plaza de Mayo beside the mothers in white headscarves. You don't go.",
        returned: "You give the bag back to {neighbour}, who holds it for a long time without opening it. On Thursdays {neighbour} walks in the Plaza de Mayo beside the mothers in white headscarves, holding up {his} {taken}'s photograph, asking where {they} is.",
      },
    },
    {
      // After the coup of 11 September 1973 the secret police made over a thousand people disappear; families brought their lists to the Catholic Church's human rights office.
      scope: CHILE,
      title: "A Neighbour Was Taken",
      lines: {
        intro: "Last night after curfew, men in plain clothes came for {neighbour}'s {taken} and took {them} away in a car. They didn't say who they were. Nobody has said where {they} is.",
        threat: "The secret police don't tell families anything. People are taken and not heard of again, and asking questions can make you next.",
        partner: "Your {partnerKin} {partner} says to keep the curtains closed.",
        "kin-partner": "Don't get involved. We have children.",
        "cast-neighbour": "Has been out looking for {his} {taken} since the curfew lifted.",
        "cast-patron": "Is friendly with an officer at the regiment.",
        door: "{neighbour} is at your door, grey in the face. {He} wants to know if you saw the car, and whether you'll come with {him} to the church office that takes down the names of the missing.",
        "go:label": "Go with {neighbour} to the church office",
        "go:then": "You go with {neighbour} across town. The waiting room is full of people holding photographs.",
        station: "A priest and a lawyer take down {his} {taken}'s name, the time, the car. They will file a petition with the court, they say, but the courts have never once said yes. {neighbour} thanks them anyway.",
        "ask:label": "Ask {patron} to ask the officer at the regiment",
        "ask:then": "{patron} listens with {pHis} eyes on the street, and says {pHe} will try.",
        "ask:failed": "{patron} says it's better not to know such people, and closes the door.",
        asked: "{patron} comes back in the evening. The officer said {neighbour}'s {taken} isn't on any list he has seen. He didn't say there was no list.",
        kept: "You hide the bag in the roof. Nobody ever comes for it. Every few weeks {neighbour} goes back to the church office, and there is never any news.",
        returned: "You give the bag back to {neighbour}. Every few weeks {neighbour} goes back to the church office with {his} {taken}'s photograph, and there is never any news.",
      },
    },
    {
      // The colonels' junta of 1967 to 1974 held thousands of leftists without trial and sent many into exile on prison islands such as Gyaros and Leros.
      scope: GREECE,
      title: "A Neighbour Was Taken",
      lines: {
        intro: "The security police came for {neighbour}'s {taken} before dawn and took {them} away for questioning. That was eighteen hours ago.",
        threat: "Under the colonels, people suspected of being leftists are held without trial, and many are sent to prison islands. Anyone who asks too many questions is noted.",
        partner: "Your {partnerKin} {partner} says the man across the street watches everyone and reports what he sees.",
        "kin-partner": "Be careful who sees you talking to {neighbour}.",
        "cast-neighbour": "Has been waiting for {his} {taken} to come home since dawn.",
        "cast-patron": "Is known to be on good terms with the regime.",
        door: "{neighbour} is at your door, grey in the face. {He} wants you to come with {him} to the security police, to ask where {his} {taken} is being held.",
        "go:label": "Go with {neighbour} to the security police",
        "go:then": "You walk with {neighbour} to the security police building. The man at the desk takes your names as well.",
        station: "After three hours, an officer tells {neighbour} that {his} {taken} is being questioned, and the family will be told the outcome. He writes down your name and address too.",
        "ask:label": "Ask {patron} to put in a word",
        "ask:then": "{patron} says {pHe} will try, for the family's sake.",
        asked: "{patron} comes back in the evening. {neighbour}'s {taken} is to be sent to an island for a time, {pHe} says. At least the family will be allowed to send letters.",
        kept: "You hide the bag behind the water tank on the roof. Months later a postcard comes for {neighbour} from an island, and {neighbour} reads it to you on the stairs.",
        burned: "You burn the papers in the stove. Months later a postcard comes for {neighbour} from an island, and {neighbour} reads it to you on the stairs.",
        returned: "You give the bag back to {neighbour}. Months later a postcard comes from an island, and {neighbour} reads it to you on the stairs.",
      },
    },
    {
      // In 1937 and 1938 the NKVD arrested about 1.5 million people, mostly at night; relatives queued at prison windows to hand in parcels, and a parcel accepted meant the prisoner was still there.
      scope: SOVIET_WEST,
      title: "The Black Car",
      lines: {
        intro: "At three in the morning the black car came, the one people call the black raven, and NKVD men took {neighbour}'s {taken} away. The room was searched and sealed.",
        threat: "Families of enemies of the people can lose their jobs and their rooms, and sometimes more. People are already crossing the street to avoid {neighbour}.",
        partner: "Your {partnerKin} {partner} says not to be seen with {neighbour}.",
        "kin-partner": "Don't go near them. You know what happens to people who do.",
        "cast-neighbour": "Has been told nothing about where {his} {taken} has been taken.",
        "cast-patron": "Is a party member, and knows people in the district committee.",
        door: "{neighbour} is at your door, grey in the face. {He} wants you to come with {him} to stand in the line at the prison window, to hand in a parcel for {his} {taken}.",
        "go:label": "Stand in the prison line with {neighbour}",
        "go:then": "You join the line outside the prison with {neighbour} and the parcel. Nobody in the line talks.",
        station: "After six hours you reach the window. The clerk takes the parcel and the money. If they take the parcel, people say, the prisoner is still there.",
        "ask:label": "Ask {patron} to ask at the district committee",
        "ask:then": "{patron} listens, and says {pHe} will see.",
        "ask:failed": "{patron} looks at you for a long moment and says it is better not to ask about such people. Then {pHe} asks why you want to know.",
        asked: "{patron} comes back in the evening and says the case is with the NKVD, and that is the end of it. {PHe} doesn't look at you.",
        bag: "Last month {neighbour}'s {taken} left some books with you to look after. One of them was written by a man who has since been shot as an enemy of the people.",
        "quiet:label": "Say you can't, and close the door",
        "quiet:then": "You tell {neighbour} you can't, and close the door. {neighbour} stands on the landing for a while before {he} goes.",
        "keep:label": "Hide the books",
        "burn:label": "Burn them",
        "return:label": "Give them back to {neighbour}",
        kept: "You hide the books behind the stove. For months {neighbour} goes back to the prison window. One day the clerk says the sentence was ten years without the right to write letters, and won't take the parcel.",
        burned: "You burn the books in the stove, a few pages at a time. For months {neighbour} goes back to the prison window. One day the clerk says the sentence was ten years without the right to write letters, and won't take the parcel.",
        returned: "You give the books back to {neighbour}. For months {neighbour} goes back to the prison window. One day the clerk says the sentence was ten years without the right to write letters, and won't take the parcel.",
      },
    },
    {
      // The NKVD's arrests reached the far east as hard as Moscow; families there queued at the prison windows too.
      scope: SOVIET_EAST,
      title: "The Black Car",
      lines: {
        intro: "At three in the morning the black car came, the one people call the black raven, and NKVD men took {neighbour}'s {taken} away. The room was searched and sealed.",
        threat: "Families of enemies of the people can lose their jobs and their rooms, and sometimes more. People are already crossing the street to avoid {neighbour}.",
        partner: "Your {partnerKin} {partner} says not to be seen with {neighbour}.",
        "kin-partner": "Don't go near them. You know what happens to people who do.",
        "cast-neighbour": "Has been told nothing about where {his} {taken} has been taken.",
        "cast-patron": "Is a party member, and knows people in the district committee.",
        door: "{neighbour} is at your door, grey in the face. {He} wants you to come with {him} to stand in the line at the prison window, to hand in a parcel for {his} {taken}.",
        "go:label": "Stand in the prison line with {neighbour}",
        "go:then": "You join the line outside the prison with {neighbour} and the parcel. Nobody in the line talks.",
        station: "After six hours you reach the window. The clerk takes the parcel and the money. If they take the parcel, people say, the prisoner is still there.",
        "ask:label": "Ask {patron} to ask at the district committee",
        "ask:then": "{patron} listens, and says {pHe} will see.",
        "ask:failed": "{patron} looks at you for a long moment and says it is better not to ask about such people. Then {pHe} asks why you want to know.",
        asked: "{patron} comes back in the evening and says the case is with the NKVD, and that is the end of it. {PHe} doesn't look at you.",
        bag: "Last month {neighbour}'s {taken} left some books with you to look after. One of them was written by a man who has since been shot as an enemy of the people.",
        "quiet:label": "Say you can't, and close the door",
        "quiet:then": "You tell {neighbour} you can't, and close the door. {neighbour} stands on the landing for a while before {he} goes.",
        "keep:label": "Hide the books",
        "burn:label": "Burn them",
        "return:label": "Give them back to {neighbour}",
        kept: "You hide the books behind the stove. For months {neighbour} goes back to the prison window. One day the clerk says the sentence was ten years without the right to write letters, and won't take the parcel.",
        burned: "You burn the books in the stove, a few pages at a time. For months {neighbour} goes back to the prison window. One day the clerk says the sentence was ten years without the right to write letters, and won't take the parcel.",
        returned: "You give the books back to {neighbour}. For months {neighbour} goes back to the prison window. One day the clerk says the sentence was ten years without the right to write letters, and won't take the parcel.",
      },
    },
    {
      title: "A Neighbour Was Taken",
      lines: {
        aim: "Decide what you will do for {neighbour}, and about what {his} {taken} left with you.",
        intro: "Men came in the night and took {neighbour}'s {taken} away. Nobody has said who they were, or where {they} is.",
        threat: "Anyone who asks too many questions can be next.",
        partner: "Your {partnerKin} {partner} says to stay out of it.",
        "kin-partner": "Don't get involved. Please.",
        "cast-neighbour": "Has been out looking for {his} {taken} since dawn.",
        "cast-patron": "Knows people in the government.",
        door: "{neighbour} is at your door, grey in the face. {He} wants to know if you saw anything, and whether you'll come with {him} to ask where {his} {taken} is.",
        "go:label": "Go with {neighbour} to ask",
        "go:then": "You go with {neighbour}.",
        station: "Nobody will say where {his} {taken} is. {neighbour} writes {his} {taken}'s name on a form, and you sign as a witness.",
        "ask:label": "Ask {patron} to find out",
        "ask:then": "{patron} says {pHe} will see what can be done.",
        "ask:failed": "{patron} says it's better not to ask, and closes the door.",
        asked: "{patron} comes back in the evening with nothing more than a warning not to ask again.",
        "quiet:label": "Say you saw nothing, and close the door",
        "quiet:then": "You tell {neighbour} you didn't see anything, and close the door. {neighbour} stands on the landing for a while before {he} goes.",
        bag: "Last month {neighbour}'s {taken} left a bag with you to look after: books, and papers you didn't read. If anyone searches the building, they'll find it.",
        "keep:label": "Hide it",
        "burn:label": "Burn what's in it",
        "return:label": "Give it to {neighbour}",
        kept: "You hide the bag. Nobody ever comes for it, and nobody ever tells {neighbour} where {his} {taken} is.",
        burned: "You burn the papers and get rid of the ash. Nobody ever tells {neighbour} where {his} {taken} is.",
        returned: "You give the bag back to {neighbour}, who holds it a long time without opening it. Nobody ever tells {neighbour} where {his} {taken} is.",
        gone: "{neighbour} has gone, and {his} {taken}'s room stays empty.",
        passed: "The day ends. Across the street, {neighbour}'s windows stay dark.",
      },
    },
  ],
};
