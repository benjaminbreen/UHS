import { ruled } from "../history/order";
import { BRITAIN, CHINA, ITALY, notable, partnerWords, pickOf, pronounWords, temper } from "./common";
import type { PlotTemplate } from "./types";

/** Word comes that the ruler is dead. Nothing has changed here yet, and everyone wonders what will. */
export const ruler: PlotTemplate = {
  id: "ruler",
  shape: "news",
  look: {
    emblem: "crier",
    palette: { ink: "#0e0e12", fill: "#3a3a4a", edge: "#7a6a5a", light: "#ececf0", accent: "#b8a8d8" },
  },
  weight: (c) => (ruled(c.setting) && notable(c) ? 0.3 * temper(c, "extraversion") : 0),
  cast: (c) => {
    const patron = notable(c);
    return patron && { patron };
  },
  begin: (c, cast) => {
    const patron = cast.patron!;
    const p = partnerWords(c);
    const midnight = Math.floor(c.clock / 86400) * 86400;
    return {
      deadline: midnight + 20 * 3600,
      words: { patron: patron.name, patronRole: patron.role.toLowerCase(), cousin: pickOf(c, ["cousin", "niece", "nephew", "brother"], "ruler-cousin"), ...pronounWords(patron), ...p.words },
      refs: { patron: patron.id, ...p.refs },
    };
  },
  opening: [{
    type: "choose", line: "news", focus: "patron",
    choices: [{ id: "mourn" }, { id: "forward" }, { id: "quiet", check: { stat: "wit", odds: 0.5 } }],
  }],
  developments: [
    { id: "obeyed", when: { type: "fired", id: "mourn" }, then: [{ type: "regard", role: "patron", delta: 1 }] },
    { id: "informed", when: { type: "fired", id: "quiet:failed" }, then: [{ type: "regard", role: "patron", delta: -1 }] },
  ],
  endings: [
    { id: "mourned", when: { type: "fired", id: "mourn" } },
    { id: "rushed", when: { type: "after", id: "forward", hours: 3 } },
    { id: "reported", when: { type: "fired", id: "informed" } },
    { id: "hushed", when: { type: "fired", id: "quiet" } },
    { id: "passed", when: { type: "due" } },
  ],
  wording: [
    {
      // Qing subjects were not to shave their heads or hold weddings and music in the mourning for an emperor; officials were punished for it as late as 1748.
      scope: { years: [1644, 1912], bounds: CHINA },
      title: "The Emperor Has Died",
      lines: {
        intro: "A runner came through at dawn: the emperor has died. Officials have taken the red tassels off their hats, and notices are going up.",
        threat: "There are rules for the mourning: no weddings, no music, and no shaving your head for a hundred days. People have been punished for less.",
        partner: "Your {partnerKin} {partner} wants to know if the wedding will have to wait.",
        "kin-partner": "Ask {patron} about the wedding. And don't go near the barber.",
        "cast-patron": "Has read the notice, and knows what the mourning rules are.",
        news: "Your {cousin}'s wedding is set for tomorrow: the go-between paid, the bride's gifts sent, the pigs bought. {patron} says the notice from the county will be on the gate by this afternoon, and after that there can be no weddings for a hundred days.",
        "mourn:label": "Put the wedding off a hundred days",
        "forward:label": "Hold it today, before the notice goes up",
        "forward:then": "You send runners to every guest. The bride's sedan chair comes at noon, half the gifts still wrapped.",
        "quiet:label": "Hold it tomorrow, quietly, no music",
        mourned: "You put the wedding off. The pigs will have to be fed for a hundred days, but nobody can say your family broke the mourning.",
        rushed: "The notice goes up on the gate while the guests are still eating. Your {cousin} is married, but only just in time.",
        hushed: "No drums, no horns, the bride carried over after dark in a plain chair. Everyone knows, but nobody reports it.",
        reported: "Someone tells the headman, and the headman tells {patron}. The family will pay a fine, and {patron} is not pleased to have been made to look careless.",
        passed: "The day ends quietly. No music from anywhere. The barbers have shut up shop.",
      },
    },
    {
      // When an emperor died the courts and shops shut for a public mourning, the iustitium, and each new emperor had the provinces swear an oath to him.
      scope: { years: [14, 476], bounds: ITALY },
      title: "The Emperor Is Dead",
      lines: {
        intro: "Word came this morning that the emperor is dead. Nobody is sure yet who will follow him, or whether the soldiers will agree.",
        threat: "The magistrates will declare a public mourning: courts closed, shops shut, no feasting. And a new emperor means new oaths, and sometimes a war over who it should be.",
        partner: "Your {partnerKin} {partner} says to keep your head down until it's clear who's in charge.",
        "kin-partner": "Keep your head down until we know who's emperor.",
        "cast-patron": "Hears the news from the palace before anyone else around here.",
        news: "Your {cousin}'s wedding feast is set for tomorrow, the guests asked and the food bought. {patron} says the mourning will be proclaimed in the forum this afternoon, and a feast after that will look like rejoicing.",
        "mourn:label": "Put the feast off until the mourning ends",
        "forward:label": "Hold the feast today, before the proclamation",
        "forward:then": "You send the boys round to every guest. The bride is brought over at noon, with half the food not ready.",
        "quiet:label": "Hold it tomorrow behind closed doors",
        mourned: "You put the feast off. Nobody will be able to say your family celebrated while the emperor lay unburied.",
        rushed: "The mourning is proclaimed while the guests are still eating. Your {cousin} is married, and nobody can say it was after.",
        hushed: "The doors stay shut and there are no flute players. Your {cousin} is married, and the neighbours say nothing.",
        reported: "A neighbour with a grudge says your family feasted while the emperor lay unburied. {patron} has to vouch for you, and is annoyed about it.",
        passed: "The day ends with everyone talking about the new emperor, and nothing different yet.",
      },
    },
    {
      // The king's peace died with the king: until his successor was proclaimed, men said, there was no law. Edward I's reign was first dated from the proclamation, in 1272.
      scope: { years: [1066, 1273], bounds: BRITAIN },
      title: "The King Is Dead",
      lines: {
        intro: "Word came this morning that the king is dead. The new one has not been crowned.",
        threat: "The king's peace died with him. Until the new king is proclaimed, people say, there is no law, and some people will take advantage of it.",
        partner: "Your {partnerKin} {partner} wants the door barred tonight.",
        "kin-partner": "Bar the door tonight. You know what happens between kings.",
        "cast-patron": "Hears the news before anyone else around here.",
        news: "Your {cousin}'s wedding is set for tomorrow, and half the guests have to come along the high road from the next village. {patron} says to put it off until the new king's peace is proclaimed.",
        "mourn:label": "Put the wedding off until the new king's peace",
        "forward:label": "Hold it today, while the roads are still quiet",
        "forward:then": "You send word to the next village. The guests who can come, come at a run.",
        "quiet:label": "Hold it tomorrow and trust the road",
        mourned: "You put it off. A week later the new king's peace is proclaimed, and the wedding goes ahead under it.",
        rushed: "Half the guests made it, and they are all home before dark. Your {cousin} is married.",
        hushed: "The guests come and go on the high road without trouble. Your {cousin} is married.",
        reported: "On the way home two of the guests are robbed on the high road. There is no king's peace to complain under, and {patron} says {he} told you so.",
        passed: "The day ends with nothing worse than talk. The new king will be crowned soon enough.",
      },
    },
    {
      title: "The Ruler Is Dead",
      lines: {
        aim: "Decide what to do about the wedding.",
        intro: "Word came this morning that the ruler is dead. Nobody here ever saw the ruler's face, but everybody is talking.",
        threat: "There will be days of mourning, and people will be watching who keeps them.",
        partner: "Your {partnerKin} {partner} says to keep your head down until it's clear who's in charge.",
        "kin-partner": "Keep your head down until we know who's in charge.",
        "cast-patron": "Hears the news before anyone else around here.",
        news: "Your {cousin}'s wedding is set for tomorrow, the guests asked and the food bought. {patron} says the mourning will be announced this afternoon, and nobody should be seen celebrating after that.",
        "mourn:label": "Put the wedding off",
        "forward:label": "Hold it today, before the mourning is announced",
        "forward:then": "You send word round to every guest. It is a scramble, but they come.",
        "quiet:label": "Hold it tomorrow, quietly, no music",
        mourned: "You put the wedding off. Nobody can say your family did not show respect.",
        rushed: "The mourning is announced while the guests are still eating. Your {cousin} is married, just before it.",
        hushed: "No music, no dancing, the guests in by the back door. Everyone knows, but nobody reports it.",
        reported: "Somebody tells {patron}, who has to do something about it. The family pays a fine, and people talk.",
        passed: "The day ends with everyone talking, and nothing different yet.",
      },
    },
  ],
};
