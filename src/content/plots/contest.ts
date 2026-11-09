import { sexOf } from "../../core/brief";
import type { CharacterScope } from "../characters/context-types";
import type { Stats } from "../../core/types";
import { AEGEAN, B, BRITAIN, CHINA, dueOf, elderOf, fillIn, JAPAN, KOREA, neighbours, notable, partnerWords, pickOf, pronounWords, seasonOf, temper, within } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

type Game = { scope?: CharacterScope; season?: string; men?: boolean; ring?: number; stat: keyof Stats; title: string; game: string; setup: string; prize: string; win: string; lose: string };

const TRANSOXIANA = [55, 35, 76, 45] as const;

const GAMES: Game[] = [
  {
    // Ssireum bouts were the centre of the Dano festival; the champion led home a bull.
    scope: { years: [1392, 1910], bounds: KOREA }, men: true, stat: "strength", ring: 0, title: "Wrestling at Dano",
    game: "the ssireum wrestling", setup: "It's the Dano festival, and the ssireum ring has been marked out in sand by the river. Each wrestler grips the other's cloth belt, and the first to touch the ground with anything but a foot loses.",
    prize: "a bull", win: "You get your grip on {rival}'s belt, turn, and lay {him} in the sand. The last bout is yours, and someone is already leading the bull over.",
    lose: "You last two bouts, then {rival} lifts you clean off your feet. The crowd cheers anyway, and somebody gives you a cup of wine.",
  },
  {
    // Kurash, belt wrestling, was held at Nowruz and at weddings; winners were given a ram or a robe.
    scope: { years: [500, 2100], bounds: TRANSOXIANA }, season: "spring", men: true, stat: "strength", ring: 0, title: "Wrestling at Nowruz",
    game: "the kurash wrestling", setup: "It's Nowruz, the new year, and there's kurash wrestling in the square today. Each man holds the other by his sash, and you win by throwing him flat on his back.",
    prize: "a ram", win: "You get a firm hold on {rival}'s sash and throw {him} flat on {his} back. The judge calls it, and the ram is led over to you.",
    lose: "{rival} hooks your leg and puts you on your back. You shake hands, and people say you lasted longer than they expected.",
  },
  {
    scope: { years: [500, 2100], bounds: TRANSOXIANA }, men: true, stat: "strength", ring: 0, title: "Wrestling at the Wedding",
    game: "the kurash wrestling", setup: "A neighbour's wedding feast has kurash wrestling today. Each man holds the other by his sash, and you win by throwing him flat on his back.",
    prize: "a quilted robe", win: "You get a firm hold on {rival}'s sash and throw {him} flat on {his} back. The groom's father puts the robe on your shoulders.",
    lose: "{rival} hooks your leg and puts you on your back. You shake hands, and go back to the food.",
  },
  {
    // Oil wrestling at Kirkpinar, near Edirne, is recorded from the fourteenth century.
    scope: { years: [1350, 2100], bounds: [20, 36, 45, 42.5] }, men: true, stat: "strength", ring: 3, title: "Oil Wrestling",
    game: "the oil wrestling", setup: "There's oil wrestling in the meadow today. The wrestlers wear leather breeches and pour olive oil over each other, and you win by pinning the other man's back to the grass.",
    prize: "a purse of coins", win: "{rival} slips out of your hold twice, but the third time you turn {him} and pin {his} back to the grass. The purse is yours.",
    lose: "You can't keep a grip on {rival} through the oil, and {he} pins you. You go home smelling of olive oil.",
  },
  {
    scope: { years: [1500, 2100], bounds: [68, 8, 90, 32] }, men: true, stat: "strength", ring: 2, title: "The Wrestling Meet",
    game: "the dangal", setup: "There's a dangal, a wrestling meet, in the field today. The wrestlers rub red earth from the akhara on their bodies, and you win by pinning both of the other man's shoulders to the ground.",
    prize: "a new turban and some money", win: "You get behind {rival} and roll {him} onto both shoulders. The judge raises your arm, and the turban is tied on your head.",
    lose: "{rival} lifts you and puts you down flat on both shoulders. You dust off the red earth and go to find water.",
  },
  {
    // Sumo at shrine festivals was an offering to the gods long before it was a sport in Edo.
    scope: { years: [1185, 1950], bounds: JAPAN }, men: true, stat: "strength", ring: 1, title: "Shrine Sumo",
    game: "the shrine sumo", setup: "The shrine festival has a sumo ring today. You lose if you step out of the ring or touch the ground with anything but your feet.",
    prize: "a bale of rice", win: "You get under {rival}'s arms and walk {him} backwards out of the ring. The priest hands you the rice.",
    lose: "{rival} pushes you back step by step, and your heel goes over the straw. You bow and leave the ring.",
  },
  {
    scope: { years: [1000, 2100], bounds: [-17, 5, 15, 18] }, men: true, stat: "strength", ring: 0, title: "Harvest Wrestling",
    game: "the wrestling", setup: "The harvest is in, and the young men are wrestling in the village square today to drums. You win by putting the other man on his back.",
    prize: "a goat", win: "You throw {rival} on {his} back, and the drummers play you round the square. The goat is yours.",
    lose: "{rival} puts you on your back. The drummers play for {him}, and you clap along.",
  },
  {
    // The rubber-ball game was played across Mesoamerica for three thousand years, by villagers on plain courts as well as lords in stone ones.
    scope: { years: [B(1400), 1521], cultures: ["mesoamerican"] }, stat: "agility", title: "The Ball Game",
    game: "the ball game", setup: "There's a ball game today on the court at the edge of town. The heavy rubber ball may only be struck with the hips, and the side that lets it die loses.",
    prize: "bundles of cotton cloth", win: "You keep the ball alive off your hip again and again, and send it past {rival} for the last point. The people who bet on your side are shouting your name.",
    lose: "The ball comes at you hard and you miss it with your hip. {rival}'s side wins, and your bruises last a week.",
  },
  {
    // Kemari players kept a deerskin ball in the air among four trees, counting the kicks aloud.
    scope: { years: [794, 1185], bounds: JAPAN }, stat: "agility", title: "A Game of Kemari",
    game: "the kemari game", setup: "A great household is holding a kemari game, where players stand in a circle and keep a deerskin ball in the air with their feet. One of their players is ill, and they're asking around for someone quick on their feet.",
    prize: "a gift of silk", win: "You keep the ball up eleven times in a row and call each kick, and the courtiers applaud. {rival} has to admit you were the best, and the silk is brought out.",
    lose: "The ball hits your shin and rolls into a pond. The courtiers are polite about it. {rival} is not.",
  },
  {
    // Naadam: wrestling, archery and horse racing, the three games of men.
    scope: { years: [1200, 2100], bounds: [87, 41, 120, 53] }, men: true, stat: "strength", title: "Wrestling at the Naadam",
    game: "the naadam wrestling", setup: "There's a naadam today: horse races, archery and, above all, wrestling. The wrestlers dance like eagles before each bout, and the first to touch the ground with a knee or elbow loses.",
    prize: "a fine horse", win: "You throw {rival} in the last round, and do the eagle dance round the judges' banner while the crowd roars your name. The horse is led over to you.",
    lose: "{rival} hooks your leg and puts you down in the grass. You dance under {his} arm, as the loser must, and people say you fought well.",
  },
  {
    // A 1363 proclamation ordered Englishmen to practise archery at the butts on holidays.
    scope: { years: [1363, 1600], bounds: BRITAIN }, stat: "agility", title: "Shooting at the Butts",
    game: "the shooting", setup: "After church there's shooting at the butts (the earth target mounds) at the edge of the village, and a prize for the best archer.",
    prize: "a silver arrowhead", win: "Your last arrow lands closest to the peg, a hand's width better than {rival}'s. The silver arrowhead is yours.",
    lose: "{rival} puts three arrows in the target and you put two. Everyone buys {him} a drink, and {he} buys you one.",
  },
  {
    // Women raced only at Olympia's separate Heraia.
    scope: { years: [B(776), 400], bounds: AEGEAN }, men: true, stat: "agility", title: "The Footrace",
    game: "the footrace", setup: "It's the festival of the city's god, and there's a footrace later today: one length of the stadium, run naked, from the line to the post.",
    prize: "a jar of olive oil", win: "You come off the line fast and hold it. {rival} is a stride behind you at the post. The jar of oil is yours.",
    lose: "{rival} pulls away halfway down the track. You come in third, and the crowd is already looking at the winner.",
  },
  {
    // Song connoisseurs competed in whisking tea, judged by the whiteness of the froth and how long it lasted.
    scope: { years: [960, 1400], bounds: CHINA }, stat: "wit", title: "A Tea Contest",
    game: "the tea contest", setup: "The neighbours are holding a tea contest today. Each person whisks powdered tea in a dark bowl, and the judges look at how white the froth is and how long it lasts.",
    prize: "a fine tea bowl", win: "Your froth stays white and thick long after {rival}'s has sunk. The judges hand you the bowl.",
    lose: "{rival}'s froth lasts longer than yours. You drink your tea anyway, and it's good.",
  },
  {
    scope: { years: [1950, 2100] }, stat: "wit", title: "Quiz Night",
    game: "the quiz", setup: "There's a quiz today at the place on the corner. Teams of four, eight rounds, and a prize for the winners.",
    prize: "a bottle of wine", win: "It comes down to the last question, and you know it. Your team beats {rival}'s by one point.",
    lose: "{rival}'s team wins by two points. You knew the answer to the last question and wrote down something else.",
  },
  {
    scope: { years: [-50000, -8000] }, stat: "agility", title: "A Throwing Contest",
    game: "the throwing", setup: "Everyone is gathered while the meat roasts, and the young people are throwing spears with their spear-throwers at a mark on a far tree.",
    prize: "the best cut of meat", win: "Your spear sticks in the mark, closer than {rival}'s. You get the best cut tonight.",
    lose: "{rival}'s spear sticks right in the mark. Yours goes into the bushes, and the children run to find it.",
  },
  {
    stat: "strength", ring: 0, title: "A Wrestling Match",
    game: "the wrestling", setup: "There's wrestling today on the open ground at the edge of town, with one of the older men judging. You win by throwing the other person flat on their back.",
    prize: "a lamb", win: "You throw {rival} flat on {his} back in the last bout, and the lamb is yours.",
    lose: "{rival} puts you on your back in the last bout. You shake hands, and people say you fought well.",
  },
];

const gameOf = (c: PlotContext) => GAMES.find((g) => (!g.scope || within(c, g.scope)) && (!g.season || seasonOf(c) === g.season))!;

const castOf = (c: PlotContext) => {
  const men = gameOf(c).men;
  const pool = neighbours(c).filter((a) => (a.age ?? 30) < 40 && (!men || sexOf(a) === "male"));
  const rival = pool.length ? pickOf(c, pool, "contest-rival") : undefined;
  const host = rival && (notable(c, (a) => a.name !== rival.name && (!men || sexOf(a) === "male")) ?? elderOf(c, rival));
  return rival && host ? { rival, host } : undefined;
};

/** A contest later today that you could enter, watch, or let go by. */
export const contest: PlotTemplate = {
  id: "contest",
  shape: "light",
  look: {
    emblem: "contest",
    palette: { ink: "#141008", fill: "#3a2c14", edge: "#8a6a2e", light: "#f4ead2", accent: "#e8b030" },
  },
  weight: (c) => ((c.player.age ?? 30) >= 14 && (c.player.age ?? 30) < 45 && !(gameOf(c).men && sexOf(c.player) !== "male") && castOf(c) ? 0.6 * temper(c, gameOf(c).stat) * temper(c, "extraversion") : 0),
  cast: (c) => castOf(c),
  begin: (c, cast) => {
    const rival = cast.rival!, host = cast.host!;
    const g = gameOf(c);
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    const words = { rival: rival.name, host: host.name, ...pronounWords(rival) };
    return {
      deadline,
      words: {
        ...words,
        stat: g.stat,
        ...(g.ring === undefined ? {} : { ring: String(g.ring) }),
        due,
        title: g.title,
        game: g.game,
        setup: g.setup,
        prize: g.prize,
        win: fillIn(g.win, words),
        lose: fillIn(g.lose, words),
        ...p.words,
      },
      refs: { rival: rival.id, host: host.id, ...p.refs },
    };
  },
  opening: [{ type: "choose", line: "enter", focus: "host", from: "host", choices: [{ id: "entered" }, { id: "cheer" }, { id: "skip" }] }],
  developments: [
    {
      id: "go",
      when: { type: "any", of: [{ type: "fired", id: "entered" }, { type: "fired", id: "cheer" }] },
      then: [{ type: "gather", at: "green", when: 2, label: "crowd", aim: "go", scene: "match" }],
    },
    {
      id: "bout",
      when: { type: "all", of: [{ type: "fired", id: "entered" }, { type: "came" }] },
      then: [{ type: "choose", line: "bout", focus: "rival", from: "rival", choices: [{ id: "fight", check: { stat: "{stat}", odds: 0.45 } }, { id: "back" }] }],
    },
    {
      id: "won",
      when: { type: "all", of: [{ type: "fired", id: "fight" }, { type: "not", of: { type: "fired", id: "fight:failed" } }] },
      then: [{ type: "choose", line: "won", focus: "rival", from: "rival", choices: [{ id: "keep" }, { id: "friends" }] }],
    },
    { id: "rematch", when: { type: "fired", id: "friends" }, then: [{ type: "regard", role: "rival", delta: 3 }] },
  ],
  endings: [
    { id: "lost", when: { type: "fired", id: "fight:failed" } },
    { id: "champion", when: { type: "any", of: [{ type: "fired", id: "keep" }, { type: "all", of: [{ type: "fired", id: "won" }, { type: "gathered" }] }] } },
    { id: "friends", when: { type: "fired", id: "friends" } },
    { id: "backed", when: { type: "any", of: [{ type: "fired", id: "back" }, { type: "all", of: [{ type: "fired", id: "bout" }, { type: "gathered" }] }] } },
    { id: "watched", when: { type: "all", of: [{ type: "fired", id: "cheer" }, { type: "after", id: "came", hours: 0.5 }] } },
    { id: "skipped", when: { type: "after", id: "skip", hours: 3 } },
    { id: "missed", when: { type: "any", of: [{ type: "gathered" }, { type: "all", of: [{ type: "due" }, { type: "not", of: { type: "fired", id: "go" } }] }] } },
  ],
  wording: [{
    title: "{title}",
    lines: {
      aim: "Decide whether to enter {game}, {due}.",
      intro: "{setup}",
      threat: "The prize is {prize}, and half the neighbourhood will be watching.",
      partner: "Your {partnerKin} {partner} thinks you should have a go.",
      "kin-partner": "Go on. You'll regret it if you don't.",
      "cast-rival": "Everyone's favourite to win {game}.",
      "cast-host": "Is putting on {game}, and taking names.",
      enter: "{host} is taking names for {game}. {rival} has already put {his} name down.",
      "entered:label": "Put your name down",
      "entered:then": "{host} writes your name down.",
      "cheer:label": "Just come and watch",
      "skip:label": "Not this year",
      "skip:then": "{host} shrugs and goes to ask someone else.",
      crowd: "Watching {game}",
      go: "Be at {game} {meet}. It's marked on your map.",
      bout: "Your turn. {rival} steps out across from you, and the crowd goes quiet.",
      "fight:label": "Face {rival}",
      "fight:failed": "{lose}",
      "back:label": "Back out",
      won: "{win}",
      "keep:label": "Take the prize home",
      "friends:label": "Praise {rival} to the crowd",
      lost: "{rival} takes {prize} home, and you go home sore.",
      champion: "You take {prize} home, and for a week people stop you in the street to talk about it.",
      friends: "You tell the crowd {rival} was the best you've ever faced. They cheer you both. {He} buys you a drink that night and asks for a rematch next year.",
      backed: "You step back into the crowd. Someone laughs, and {rival} wins {prize} without much of a fight.",
      watched: "You watch from the crowd. {rival} wins {prize}, and you cheer with everyone else.",
      skipped: "You hear the shouting from {game} while you work. {rival} wins {prize}, as everyone said {he} would.",
      missed: "By the time you think of {game}, it's over. {rival} won {prize}.",
    },
  }],
};
