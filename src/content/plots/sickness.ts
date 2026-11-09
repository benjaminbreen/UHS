import { elderOf, EUROPE, ISLAMIC, notable, partnerWords, pronounWords, temper } from "./common";
import type { PlotTemplate } from "./types";

const LONDON = [-0.6, 51.3, 0.4, 51.7] as const;
const MEXICO = [-100, 17, -97, 21] as const;

/** Word comes that a sickness is in the next town, and it is coming this way along the road. */
export const sickness: PlotTemplate = {
  id: "sickness",
  shape: "news",
  look: {
    emblem: "crier",
    palette: { ink: "#10120e", fill: "#3a4232", edge: "#6a6248", light: "#eaeee2", accent: "#a8b878" },
  },
  weight: (c) => (c.setting?.settlement !== "camp" && notable(c) && elderOf(c, notable(c)) ? 0.3 * temper(c, "neuroticism") : 0),
  cast: (c) => {
    const patron = notable(c);
    const elder = elderOf(c, patron);
    return patron && elder && { patron, elder };
  },
  begin: (c, cast) => {
    const patron = cast.patron!, elder = cast.elder!;
    const p = partnerWords(c);
    const midnight = Math.floor(c.clock / 86400) * 86400;
    return {
      deadline: midnight + 20 * 3600,
      words: { patron: patron.name, elder: elder.name, ...pronounWords(patron), ...p.words },
      refs: { patron: patron.id, elder: elder.id, ...p.refs },
    };
  },
  opening: [{ type: "choose", line: "news", focus: "patron", choices: [{ id: "shut" }, { id: "help" }, { id: "leave" }] }],
  developments: [
    { id: "gate", when: { type: "after", id: "shut", hours: 2 }, then: [{ type: "choose", line: "gate", focus: "patron", choices: [{ id: "turn" }, { id: "shelter" }] }] },
    { id: "nursed", when: { type: "fired", id: "help" }, then: [{ type: "regard", role: "elder", delta: 2 }] },
  ],
  endings: [
    { id: "turned", when: { type: "fired", id: "turn" } },
    { id: "sheltered", when: { type: "fired", id: "shelter" } },
    { id: "helped", when: { type: "after", id: "help", hours: 3 } },
    { id: "left", when: { type: "fired", id: "leave" } },
    { id: "passed", when: { type: "due" } },
  ],
  wording: [
    {
      // In May 1348 Pistoia barred anyone coming from plague-struck Pisa or Lucca, and the import of their cloth.
      scope: { years: [1347, 1352], bounds: EUROPE },
      title: "The Great Mortality",
      lines: {
        intro: "Travellers say the sickness has reached the next town. Swellings in the armpit and groin, black spots, and most who get it are dead in three days. It came from the ports.",
        threat: "Nobody knows how it spreads. Some towns have shut their gates to anyone coming from places where it is.",
        partner: "Your {partnerKin} {partner} wants to send the children to relatives in the hills.",
        "kin-partner": "Ask {patron} to keep the strangers out. Please.",
        "cast-elder": "Lived through bad years before, and knows how to nurse a fever.",
        news: "{patron} is standing in the square with the other heads of households, arguing about whether to shut the road. {elder} is packing a basket of linen and vinegar to take to the next town, where nobody is left to nurse the sick.",
        helped: "You and {elder} wash and feed the sick in the next town all day, with vinegar on your faces. Most of them die anyway. You come home, and wait to see if you have it.",
        left: "You load what you can carry and take the family up into the hills to your kin there. Behind you, the town shuts its gate.",
        turned: "The family turns back down the road. Nobody here has the sickness so far.",
        sheltered: "{patron} lets them into the empty barn outside the gate, and food is left at the door. The child lives. Nobody else in the barn does.",
      },
    },
    {
      // In 1665 a house with plague was shut up for forty days with its people inside, a red cross on the door and "Lord have mercy upon us" above it.
      scope: { years: [1665, 1666], bounds: LONDON },
      title: "The Plague in St Giles",
      lines: {
        intro: "The bills of mortality, the weekly lists of the dead in each parish, show the plague rising in St Giles. Three houses in the next street have red crosses on their doors.",
        threat: "A house with plague in it is shut up for forty days with everyone inside, sick or well, and a watchman at the door.",
        partner: "Your {partnerKin} {partner} says people with money are already leaving for the country.",
        "kin-partner": "Everyone who can afford to is leaving. Can we?",
        "cast-patron": "Sits on the parish vestry, and has a say in how the parish deals with the sick.",
        "cast-elder": "Lived through the plague of 1636 as a child.",
        news: "{patron} wants the vestry to put a watchman on every shut-up house in the street. {elder} has been taking food to the shut houses and leaving it on the step. Half the street is packing for the country.",
        "shut:label": "Back {patron}: watchmen on the shut houses",
        "shut:then": "You stand with {patron} at the vestry. By noon there is a watchman with a halberd at every red-crossed door in the street.",
        "help:then": "You fill a basket with bread and small beer and go with {elder} from door to door.",
        "help:label": "Take food to the shut houses with {elder}",
        "leave:label": "Pack up and go to kin in the country",
        gate: "By midday the family in the shut house opposite are at their window. The father says the sick one is dead and the rest are well, and begs to be let out before they catch it too.",
        "turn:label": "Keep them shut in",
        "shelter:label": "Look the other way while they go",
        turned: "The watchman stays at the door. The bell for the dead cart goes past twice that night.",
        sheltered: "The watchman is somewhere else for an hour, and the house opposite is empty in the morning. {patron} is furious, and doesn't ask who saw.",
        helped: "You and {elder} leave bread and small beer on the steps of the shut houses all afternoon, and hear thanks through the doors.",
        left: "You get a cart, and a certificate of health from the parish, and leave for the country with the rest. Nobody knows if the villages will let you in.",
      },
    },
    {
      // Smallpox reached Tenochtitlan in 1520 with Narváez's men and killed perhaps a third of the city, Cuitláhuac the new ruler among them.
      scope: { years: [1520, 1521], bounds: MEXICO },
      title: "The Great Rash",
      lines: {
        intro: "The sickness that came with the strangers' second army is in the next town. Sores cover people from head to foot. They can't move, can't turn over in bed.",
        threat: "Nobody has seen anything like it. The old remedies do nothing.",
        partner: "Your {partnerKin} {partner} wants to keep the children inside and away from everyone.",
        "kin-partner": "Keep the children in. Don't let anyone near them.",
        "cast-patron": "One of the people who speaks for the neighbourhood, and is trying to decide what to do.",
        "cast-elder": "Knows more about medicine than anyone nearby.",
        news: "{patron} wants the causeway watched, so nobody from the next town comes in. {elder} is going there with herbs, though nothing has worked so far. Some families are already leaving for kin in the hills.",
        helped: "You and {elder} bring water and food to people who can't get up to fetch it. That is what kills most of them, {elder} says: hunger, not the sores.",
        sheltered: "{patron} has them put in an empty house at the edge of the neighbourhood, with food left at the door. In two days the sores have come out on the people next door.",
      },
    },
    {
      // Cairo in 1348, al-Maqrizi says, lost so many that the dead were carried out on boards and ladders.
      scope: { years: [1347, 1352], bounds: ISLAMIC },
      title: "The Plague",
      lines: {
        intro: "Travellers say the plague has reached the next town. Swellings, fever, and most who get it are dead in three days. It came along the trade roads.",
        threat: "Some scholars say plague is a mercy for believers, and the Prophet said not to flee a land where it has come. Others are leaving anyway.",
        partner: "Your {partnerKin} {partner} wants to go and pray.",
        "kin-partner": "Ask {patron} what is being done.",
        "cast-patron": "The one people here look to in a crisis.",
        "cast-elder": "Washes the dead, and has opinions about what keeps sickness away.",
        news: "{patron} is talking about shutting the road. {elder} is going to the next town to wash the dead, where there are too many for the washers. Some families are already packing.",
        "help:label": "Go with {elder} to wash the dead",
        helped: "You and {elder} wash and shroud the dead all day, and pray over them. People bless you for it. You come home, and wait to see if you have it.",
        left: "You load the donkey and leave for kin in the country. The imam says nothing, but you know what the Prophet said about leaving.",
      },
    },
    {
      title: "Sickness on the Road",
      lines: {
        aim: "Decide what your household does about the sickness.",
        intro: "Travellers say there's a sickness in the next town. Fever, then spots, and some of the children have died.",
        threat: "Nobody knows how it spreads, but everyone knows it travels along the road.",
        partner: "Your {partnerKin} {partner} wants the children kept indoors.",
        "kin-partner": "Ask {patron} to keep the strangers out.",
        "cast-patron": "Could get people to turn travellers away at the road.",
        "cast-elder": "Lived through bad years before, and knows how to nurse a fever.",
        news: "{patron} is talking about shutting the road to anyone from the next town. {elder} is going there instead, to nurse the sick. Some families are already packing to go to kin elsewhere.",
        "shut:label": "Back {patron}: shut the road",
        "shut:then": "{patron} puts men with staves on the road. Anyone from the next town is to be turned back.",
        "help:label": "Go with {elder} to nurse the sick",
        "help:then": "You go with {elder} down the road, with a basket of food and clean cloths.",
        "leave:label": "Take the household to kin elsewhere",
        gate: "A family from the next town is at the road, the father carrying a child who is hot with fever. They have kin here, they say.",
        "turn:label": "Turn them back",
        "shelter:label": "Put them in the empty barn by the road",
        turned: "The family turns back down the road. Nobody here is sick so far.",
        sheltered: "{patron} lets them into the empty barn outside the village, and food is left at the door. The child lives. Nobody else here falls sick.",
        helped: "You and {elder} nurse the sick in the next town all day. Some of them will live because of it. You come home, and wait to see if you have it.",
        left: "You load what you can carry and take the family to kin elsewhere until it passes.",
        passed: "The day ends with nothing decided, and the sickness is still in the next town.",
      },
    },
  ],
};
