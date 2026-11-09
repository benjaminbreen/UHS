import { random } from "../../core/random";
import { sexOf } from "../../core/brief";
import { ruled } from "../history/order";
import { claimFor } from "../economy/claims";
import { amountOf, B, CHINA, collectorOf, EGYPT, partnerWords, pronounWords } from "./common";
import type { Effect, PlotContext, PlotTemplate } from "./types";

/** The man who collects for the ruler here, who answers for the count. */
const headman = (c: PlotContext) => collectorOf(c, (a) => sexOf(a) === "male");
/** Labour owed where the year's claim says so, else wherever a state ruled. */
const owesLabour = (c: PlotContext) => {
  const claim = c.setting && claimFor(c.setting);
  return claim ? claim.labour : ruled(c.setting);
};

const choice: Effect = {
  type: "choose", line: "choice", focus: "official",
  choices: [{ id: "go" }, { id: "exempt", check: { stat: "wit", skill: "speech", odds: 0.35 } }, { id: "hide", check: { stat: "agility", odds: 0.45 } }],
};

/** Labour or arms owed to whoever rules, called up for tomorrow; silver can
 * buy a substitute. */
export const levy: PlotTemplate = {
  id: "levy",
  shape: "claim",
  look: {
    emblem: "levy",
    palette: { ink: "#17150f", fill: "#2a2618", edge: "#6b5a2e", light: "#efe6c8", accent: "#c9902f" },
  },
  payee: "official",
  weight: (c) => {
    const age = c.player.age ?? 30;
    const year = c.setting?.year ?? 0;
    return year > -3200 && year < 1920 && age >= 17 && age <= 45 && sexOf(c.player) !== "female" && owesLabour(c) && headman(c) ? 0.9 : 0;
  },
  cast: (c) => {
    const official = headman(c);
    return official && { official };
  },
  begin: (c, cast) => {
    const official = cast.official!;
    const owed = 5 + Math.floor(random(c.seed, "plot", "levy", "owed") * 5);
    const hour = Math.floor(c.clock / 3600) % 24;
    // The levy goes at the next first light, never less than a working day away.
    const deadline = Math.floor(c.clock / 86400) * 86400 + (hour < 2 ? 6 : 30) * 3600;
    const p = partnerWords(c);
    return {
      deadline,
      owed,
      words: {
        official: official.name,
        amount: amountOf(c, owed),
        due: "at first light",
        ...pronounWords(official),
        ...p.words,
      },
      refs: { official: official.id, ...p.refs },
    };
  },
  opening: [{ type: "approach", role: "official", line: "summons" }],
  developments: [
    {
      id: "choice",
      when: { type: "all", of: [{ type: "talked", role: "official" }, { type: "not", of: { type: "fired", id: "choice-late" } }, { type: "not", of: { type: "settled" } }] },
      then: [choice],
    },
    {
      id: "choice-late",
      when: { type: "all", of: [{ type: "since", hours: 1.5 }, { type: "not", of: { type: "fired", id: "choice" } }, { type: "not", of: { type: "settled" } }] },
      then: [choice],
    },
    {
      id: "remind",
      when: { type: "all", of: [{ type: "due", hours: -3 }, { type: "not", of: { type: "settled" } }, { type: "not", of: { type: "fired", id: "hide" } }] },
      then: [{ type: "approach", role: "official", line: "remind" }],
    },
  ],
  endings: [
    { id: "excused", when: { type: "gone", role: "official" } },
    { id: "commuted", when: { type: "settled" } },
    { id: "exempted", when: { type: "all", of: [{ type: "fired", id: "exempt" }, { type: "not", of: { type: "fired", id: "exempt:failed" } }] } },
    { id: "caught", when: { type: "fired", id: "hide:failed" } },
    { id: "hid", when: { type: "all", of: [{ type: "fired", id: "hide" }, { type: "due" }] } },
    { id: "served", when: { type: "fired", id: "go" } },
    { id: "served", when: { type: "due" } },
  ],
  wording: [
    {
      // Old and Middle Kingdom corvée: every household owed labour on dykes, canals and royal works.
      scope: { years: [B(3100), B(30)], bounds: EGYPT },
      title: "Called Up for Labour",
      lines: {
        aim: "Find someone to send in your place, or be ready for the corvée at first light.",
        intro: "The scribes have counted your household for the corvée. {official} the scribe has your name on the list for the canal works, and the gang leaves at first light.",
        threat: "A man who runs from the corvée is written down as a fugitive, and his family is held until he is found.",
        partner: "Your {partnerKin} {partner} has already started packing bread for you, in case you have to go.",
        "kin-partner": "They say the gang goes out to the canals tomorrow. Is there no one you can send?",
        "cast-official": "Keeps the list for the corvée, and has your name on it.",
        summons: "Your name is on the list for the canal works. Be at the landing at first light, or send someone in your place. {amount} would pay for a substitute.",
        remind: "The gang leaves at first light. Have you found a substitute, or are you coming yourself?",
        commuted: "{official} takes the {amount} and strikes your name. Another man will dig your stretch of the canal this year.",
        served: "At first light you join the gang at the landing. You'll be gone for weeks, and the field will have to wait.",
        excused: "With {official} gone, nobody comes to call your name. The list will be drawn up again next year.",
        "exempt:label": "Plead that the field can't spare you",
        "hide:label": "Hide in the marshes until the gang has gone",
        "hide:then": "You slip out to the papyrus marsh with bread and a waterskin, and wait for the gang to leave.",
        "hide:failed": "{official}'s men find you in the reeds before dark.",
        exempted: "{official} looks at the household list again, and agrees that your field can't be left with no one to work it. Your name is moved to next year's list.",
        caught: "They march you to the landing with your hands tied. Your name goes on the list of men who ran, and you'll dig twice as long.",
        hid: "The gang leaves at first light without you. Your name is written down as a fugitive, and the scribes will ask your family where you went.",
      },
    },
    {
      // Qin and Han men owed a month's labour each year and a term under arms; paying for a substitute was lawful.
      scope: { years: [B(221), 220], bounds: CHINA },
      title: "Called Up",
      lines: {
        aim: "Pay for a substitute, or be ready to march when the levy leaves.",
        intro: "{official} the village head says it's your turn for a month of labour, and the men leave for the works tomorrow.",
        threat: "Under the law, men who are late to the muster can be put to death.",
        partner: "Your {partnerKin} {partner} hasn't said a word about it.",
        "kin-partner": "I heard the levy goes tomorrow. Can't we pay for someone to go?",
        "cast-official": "Keeps the register of who owes service this year.",
        summons: "It's your turn. The men go tomorrow. Pay {amount} for a substitute, or be at the muster.",
        remind: "The levy leaves tomorrow. Pay for a substitute or come yourself.",
        commuted: "{official} takes the {amount}. Another man will carry earth on the walls in your place this year.",
        served: "You go with the levy. You'll be away a month, and the household will have to manage without you.",
        excused: "With {official} gone, nobody comes to collect you this time.",
        "hide:label": "Hide in the hills until the levy has gone",
        caught: "They find you before the levy leaves and bring you to the muster in chains. You're lucky the law isn't applied in full.",
        hid: "The levy marches without you. Your name is now on a list of men who ran, and the village head must answer for it.",
      },
    },
    {
      title: "Called Up",
      lines: {
        aim: "Pay for someone to go in your place, or be ready to leave with the levy {due}.",
        intro: "{official} the headman has come round counting men. Your household owes one for the levy, and it is you.",
        threat: "Men who hide from the levy are found, and their families are punished.",
        partner: "Your {partnerKin} {partner} keeps asking what you're going to do.",
        "kin-partner": "Is it true they are taking you with the levy? Is there nothing we can do?",
        "cast-official": "Is gathering men for the levy, and has counted you.",
        summons: "Your household owes a man for the levy, and the men go {due}. Give {amount} and I will find someone else.",
        remind: "It's getting late. Will you pay, or will you go?",
        commuted: "{official} takes the {amount}, and another goes in your place. You will not be asked again this year.",
        served: "You leave with the levy. Your household will have to manage without you.",
        excused: "With {official} gone, nobody comes to count you. The levy leaves without you.",
        choice: "The levy goes {due}, and {official} is waiting to hear what you'll do.",
        "go:label": "Get ready to go",
        "exempt:label": "Plead that your household can't spare you",
        "exempt:failed": "{official} hears you out and shakes {his} head. Every household says the same.",
        "hide:label": "Hide out until the levy has gone",
        "hide:then": "You pack some food and slip away to wait somewhere you won't be found.",
        "hide:failed": "{official}'s men find you before dark.",
        exempted: "{official} agrees that your household can't do without you this year, and puts another name in place of yours.",
        caught: "They bring you back with your hands tied and march you off with the levy. Everyone saw.",
        hid: "The levy leaves without you. You're free for now, but you're marked as a man who ran, and your household will hear about it.",
      },
    },
  ],
};
