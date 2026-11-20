import { BRITAIN, ITALY, notable, partnerWords, pronounWords, seasonOf, temper, within } from "./common";
import type { PlotContext, PlotTemplate, PlotWording } from "./types";

const CORONATION = { years: [1953, 1954], bounds: BRITAIN } as const;
const MOON = { years: [1969, 1970] } as const;
const WALL = { years: [1989, 1990], bounds: [13.05, 52.35, 13.8, 52.7] } as const;

type Final = {
  scope: { years: readonly [number, number]; bounds: readonly [number, number, number, number] };
  /** The final, and where it is played, as the player would say it. */
  final: string;
  threat: string;
  out: string;
  there: string;
  after: string;
  celebrated: string;
};

// Finals won, so the street has something to pour out into.
const FINALS: Final[] = [
  {
    // 30 July 1966, Wembley: England 4, West Germany 2 after extra time.
    scope: { years: [1966, 1967], bounds: [-6, 49.9, 1.8, 55.8] },
    final: "England are in the World Cup final against West Germany, at Wembley",
    threat: "Half the country has hired or borrowed a television for it.",
    out: "Watch at the pub",
    there: "The pub is so full that people are standing on the benches to see the set over the bar.",
    after: "Extra time, and in the last minute Hurst scores again. \"They think it's all over,\" says the commentator, \"it is now!\" England have won the World Cup.",
    celebrated: "You go out into the street with everyone else. People are singing and dancing round the lamp-posts, and strangers buy you drinks until closing time.",
  },
  {
    // 21 June 1970, Mexico City: Brazil 4, Italy 1, the first final shown in colour.
    scope: { years: [1970, 1971], bounds: [-74, -34, -34, 5] },
    final: "Brazil are in the World Cup final against Italy, in Mexico City, and it is on television in colour",
    threat: "The generals in charge have made the team's song their own, and want the whole country watching.",
    out: "Watch on the screen in the square",
    there: "The square is packed shoulder to shoulder in front of a single colour set on a stand.",
    after: "Pelé heads in the first, and by the end it's four to one. Brazil have won the World Cup for the third time, and they keep the trophy for good.",
    celebrated: "You go out into streets full of green and yellow flags, fireworks and drums. Nobody goes to bed.",
  },
  {
    // 25 June 1978, River Plate stadium: Argentina 3, the Netherlands 1, under the military junta.
    scope: { years: [1978, 1979], bounds: [-74, -55, -53, -21] },
    final: "Argentina are in the World Cup final against the Netherlands, here in Buenos Aires at the River Plate stadium",
    threat: "The generals want the whole country celebrating. Not everyone you know feels like it.",
    out: "Watch at the café on the corner",
    there: "The café is so full that people are standing on the chairs.",
    after: "Kempes scores twice, Bertoni once more in extra time, and it's three to one. Argentina have won the World Cup.",
    celebrated: "The whole city pours out onto the streets and down to the Obelisk, honking and waving flags. The generals are on television, smiling.",
  },
  {
    // 11 July 1982, Madrid: Italy 3, West Germany 1; Tardelli's run with his arms out became the picture of it.
    scope: { years: [1982, 1983], bounds: ITALY },
    final: "Italy are in the World Cup final against West Germany, in Madrid",
    threat: "The president himself is in the stand, and the whole country will be in front of a screen.",
    out: "Watch at the bar in the square",
    there: "The bar is so full that people are standing on the chairs, and the rest are watching through the window.",
    after: "Rossi scores, then Tardelli, and he runs screaming with his arms out. Then Altobelli. Three to one: Italy have won the World Cup.",
    celebrated: "The whole town comes out into the square with flags and car horns, and people jump into the fountains.",
  },
  {
    // 29 June 1986, Mexico City: Argentina 3, West Germany 2, with Maradona as captain.
    scope: { years: [1986, 1987], bounds: [-74, -55, -53, -21] },
    final: "Argentina are in the World Cup final against West Germany, in Mexico City, with Maradona as captain",
    threat: "After beating England in the quarter-final, the whole country has stopped thinking about anything else.",
    out: "Watch at the café on the corner",
    there: "The café is so full that people are standing on the chairs.",
    after: "Two goals up, then the Germans draw level. Six minutes from the end Maradona slips the ball to Burruchaga, who runs half the pitch and scores. Argentina have won the World Cup.",
    celebrated: "The whole city pours out onto the streets and down to the Obelisk, singing Maradona's name.",
  },
  {
    // 12 July 1998, Stade de France: France 3, Brazil 0; a million people filled the Champs-Élysées.
    scope: { years: [1998, 1999], bounds: [-5, 42, 8.5, 51.2] },
    final: "France are in the World Cup final against Brazil, at the Stade de France",
    threat: "The team is black, white and Arab, and people are saying it's the whole country on the pitch.",
    out: "Watch on the big screen in town",
    there: "Thousands are packed in front of the big screen, and you can hardly see over the flags.",
    after: "Zidane heads in two corners before half-time, and Petit adds a third at the end. France have won the World Cup.",
    celebrated: "The streets fill with flags and car horns until dawn. In Paris, they're projecting Zidane's face onto the Arc de Triomphe.",
  },
  {
    // 11 July 2010, Johannesburg: Spain 1, the Netherlands 0 after extra time.
    scope: { years: [2010, 2011], bounds: [-9.5, 36, 3.4, 43.8] },
    final: "Spain are in the World Cup final against the Netherlands, in Johannesburg",
    threat: "Spain have never won it. The whole country has been following the octopus in a German aquarium that keeps picking Spain to win.",
    out: "Watch on the big screen in the square",
    there: "The square is packed in front of the big screen, and you can hardly see over the flags.",
    after: "Four minutes from the end of extra time, Iniesta scores. Spain have won the World Cup for the first time.",
    celebrated: "You go out into streets full of red and yellow, car horns and fireworks until morning.",
  },
  {
    // 13 July 2014, Rio de Janeiro: Germany 1, Argentina 0; hundreds of thousands watched at fan miles.
    scope: { years: [2014, 2015], bounds: [5.8, 47.2, 15.1, 55.1] },
    final: "Germany are in the World Cup final against Argentina, in Rio de Janeiro",
    threat: "After beating Brazil seven to one in the semi-final, everyone expects it.",
    out: "Watch on the big screen at the fan mile",
    there: "Hundreds of thousands are packed in front of the screens, and you can hardly see over the flags.",
    after: "In extra time Götze takes the ball on his chest and volleys it in. Germany have won the World Cup.",
    celebrated: "You go out into the streets with the flags and the car horns, and half the city is still singing on the trams in the morning.",
  },
];

/** Where the moon landing fell in the day, by longitude. */
const moonTime = (c: PlotContext) => {
  const lon = c.setting?.lon ?? 0;
  return lon < -30 ? "late tonight" : lon < 60 ? "in the small hours of the morning" : "around midday";
};

const event = (c: PlotContext) => {
  const season = seasonOf(c);
  const south = (c.setting?.lat ?? 0) < 0;
  const midyear = season === (south ? "winter" : "summer");
  return (midyear && (within(c, CORONATION, MOON) || FINALS.some((f) => within(c, f.scope)))) || (season === "autumn" && within(c, WALL));
};

const match = (f: Final): PlotWording => ({
  scope: f.scope,
  title: "The World Cup Final",
  lines: {
    aim: "Decide where to watch the final.",
    intro: `${f.final}. {patron} has the biggest television on the street, and half the neighbours are going there.`,
    threat: f.threat,
    partner: "Your {partnerKin} {partner} has painted the children's faces in the team's colours.",
    "kin-partner": "Are we going to {patron}'s for the final?",
    "cast-patron": "Has the biggest television on the street, and has asked the neighbours round for the final.",
    on: "{patron} has turned the television to face the open window and put chairs out on the pavement. What do you do?",
    "watch:label": "Watch at {patron}'s",
    "watch:then": "You squeeze in at {patron}'s with the neighbours, the children on the floor in front of the set.",
    "radio:label": "Keep working with the radio on",
    "radio:then": "You keep working with the radio on loud. Every shout from down the street tells you what happened before the commentator does.",
    "out:label": f.out,
    "out:then": f.there,
    after: f.after,
    "celebrate:label": "Go out and celebrate",
    "home:label": "Stay in and let the others celebrate",
    celebrated: f.celebrated,
    home: "You stay in. The car horns and singing go on outside until morning.",
    passed: "The day ends with the car horns still going.",
  },
});

/** Something is on television that everyone will remember, and the street watches it together. */
export const broadcast: PlotTemplate = {
  id: "broadcast",
  shape: "light",
  look: {
    emblem: "broadcast",
    palette: { ink: "#0c0e14", fill: "#22283a", edge: "#5a4a3a", light: "#eef0f4", accent: "#8ac0e8" },
  },
  weight: (c) => (event(c) && notable(c) ? 0.9 * temper(c, "extraversion") : 0),
  cast: (c) => {
    const patron = notable(c);
    return patron && { patron };
  },
  begin: (c, cast) => {
    const patron = cast.patron!;
    const p = partnerWords(c);
    const midnight = Math.floor(c.clock / 86400) * 86400;
    return {
      deadline: midnight + 30 * 3600,
      words: { patron: patron.name, when: moonTime(c), ...pronounWords(patron), ...p.words },
      refs: { patron: patron.id, ...p.refs },
    };
  },
  opening: [{ type: "choose", line: "on", focus: "patron", brought: true, choices: [{ id: "watch" }, { id: "radio" }, { id: "out" }] }],
  developments: [
    { id: "guest", when: { type: "fired", id: "watch" }, then: [{ type: "regard", role: "patron", delta: 1 }] },
    {
      id: "moment",
      when: { type: "any", of: [{ type: "after", id: "watch", hours: 2 }, { type: "after", id: "radio", hours: 2 }, { type: "after", id: "out", hours: 2 }] },
      then: [{ type: "choose", line: "after", focus: "patron", choices: [{ id: "celebrate" }, { id: "home" }] }],
    },
  ],
  endings: [
    { id: "celebrated", when: { type: "fired", id: "celebrate" } },
    { id: "home", when: { type: "fired", id: "home" } },
    { id: "passed", when: { type: "due" } },
  ],
  wording: [
    {
      // 2 June 1953: about twenty million people in Britain watched the coronation, most of them on someone else's set.
      scope: CORONATION,
      title: "The Coronation",
      lines: {
        aim: "Decide where to be when the Queen is crowned.",
        intro: "Today the Queen is crowned in Westminster Abbey, and for the first time it will be on television. {patron} bought a set for it, and has said half the street can come and watch.",
        threat: "It's pouring with rain, and the street party is supposed to be this afternoon.",
        partner: "Your {partnerKin} {partner} has ironed the bunting twice.",
        "kin-partner": "Are we going to {patron}'s? Everyone else is.",
        "cast-patron": "Bought a television for the coronation, and has asked the street round.",
        on: "{patron}'s front room already has chairs in rows facing a nine-inch screen, with the curtains drawn. What do you do?",
        "watch:label": "Squeeze into {patron}'s front room",
        "watch:then": "You sit on the floor at the front with the children. The picture is small and grey, and nobody says a word when the crown goes on.",
        "radio:label": "Listen on the radio at home",
        "radio:then": "You listen to the service on the radio, and try to picture it.",
        "out:label": "Go up to London to see the procession",
        "out:then": "You catch an early train and stand in the rain on the Mall for hours, for a glimpse of the gold coach.",
        after: "By teatime the rain has eased, and the trestle tables are going up in the street.",
        "celebrate:label": "Go to the street party",
        "home:label": "Stay in out of the wet",
        celebrated: "There are paper hats, jelly and sandwiches, and a bonfire at night. Every child gets a coronation mug, and you're not home until after midnight.",
        home: "You stay in by the fire. Through the window you can hear the street party singing until late.",
        passed: "The day ends with everyone still talking about the crowning.",
      },
    },
    {
      // Armstrong stepped onto the moon at 02:56 GMT on 21 July 1969; about 600 million people watched.
      scope: MOON,
      title: "The Moon Landing",
      lines: {
        aim: "Decide where to watch the moon landing.",
        intro: "Two American astronauts are about to walk on the moon, and it will be on television {when}. {patron} has a set, and the neighbours are already asking to come.",
        threat: "Everyone says this is the one thing you'll want to say you saw.",
        partner: "Your {partnerKin} {partner} says the children can stay up for it, just this once.",
        "kin-partner": "Are we going to {patron}'s for the moon?",
        "cast-patron": "Has a television, and has asked the neighbours round for the moon landing.",
        on: "{patron} has put the television in the doorway so people can watch from outside too. What do you do?",
        "watch:label": "Watch at {patron}'s",
        "watch:then": "You find a place among the neighbours in front of the set, with a child asleep on your lap.",
        "radio:label": "Listen on the radio",
        "radio:then": "You turn the radio up and sit by it.",
        "out:label": "Watch the televisions in the shop windows in town",
        "out:then": "You stand in the crowd on the pavement in front of a shop window full of televisions.",
        after: "The picture is grey and ghostly, but there he is, coming down the ladder. \"That's one small step for man...\" Nobody near you says anything for a while.",
        "celebrate:label": "Stay up and talk about it",
        "home:label": "Go to bed",
        celebrated: "Nobody wants to go home. You stay up with the neighbours until the astronauts are back inside, looking up at the moon now and then.",
        home: "You go to bed. Before you sleep, you look out of the window at the moon.",
        passed: "The day ends with everyone looking up at the moon.",
      },
    },
    {
      // 9 November 1989: Schabowski announced the new travel rules "immediately", and that night the crowds at Bornholmer Strasse made the guards open the gate.
      scope: WALL,
      title: "The Wall Is Open",
      lines: {
        aim: "Decide what to do now the border is open.",
        intro: "On the evening news a party official, reading from a sheet of paper, said people can cross the border, starting immediately. Nobody is sure he meant it.",
        threat: "If it's a mistake, the guards at the crossings are still armed.",
        partner: "Your {partnerKin} {partner} doesn't believe it, and wants to wait for the morning news.",
        "kin-partner": "Is it true? Are people really going across?",
        "cast-patron": "Heard the announcement, and is already putting a coat on.",
        on: "{patron} is in the stairwell in a coat, saying everyone is going to the crossings. What do you do?",
        "watch:label": "Watch the news at {patron}'s and see",
        "watch:then": "You watch at {patron}'s as the late news shows crowds building at the crossings.",
        "radio:label": "Listen to the radio from the other side",
        "radio:then": "You tune to the West Berlin station. The reporter can hardly be heard over the crowd.",
        "out:label": "Go to the border crossing",
        "out:then": "You walk to the crossing with half the street. Thousands are there already, chanting \"Open the gate!\"",
        after: "Just before midnight the guards give up and open the gate. People pour through in both directions, crying and laughing, strangers hugging.",
        "celebrate:label": "Cross over and see",
        "home:label": "Go home; it will still be open tomorrow",
        celebrated: "You cross with the crowd. On the other side people are handing out beer and flowers, and someone is chipping at the Wall with a hammer. You get home at dawn.",
        home: "You go home. All night you can hear car horns and the little two-stroke Trabants going past.",
        passed: "By morning there are queues at every crossing, and nobody has closed it again.",
      },
    },
    ...FINALS.map(match),
    {
      title: "Everyone Is Watching",
      lines: {
        aim: "Decide where to watch.",
        intro: "Something is on television tonight that everyone wants to see. {patron} has a set, and the neighbours are going there.",
        threat: "It's all anyone has talked about for a week.",
        partner: "Your {partnerKin} {partner} wants to go to {patron}'s.",
        "kin-partner": "Are we going to {patron}'s?",
        "cast-patron": "Has a television, and has asked the neighbours round.",
        on: "{patron} has set the television up where everyone can see it. What do you do?",
        "watch:label": "Watch at {patron}'s",
        "watch:then": "You squeeze in at {patron}'s with the neighbours.",
        "radio:label": "Listen on the radio",
        "radio:then": "You turn the radio up and sit by it.",
        "out:label": "Watch in town with the crowds",
        "out:then": "You stand in the crowd in front of a big screen.",
        after: "When it's over, nobody says anything for a moment.",
        "celebrate:label": "Stay out with everyone",
        "home:label": "Go home",
        celebrated: "You stay out late with the neighbours, talking about it.",
        home: "You go home. Outside, people are still talking about it.",
        passed: "The day ends with everyone still talking about it.",
      },
    },
  ],
};
