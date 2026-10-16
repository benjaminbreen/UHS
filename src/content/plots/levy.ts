import { random } from "../../core/random";
import { sexOf } from "../../core/brief";
import { ruled } from "../history/order";
import { amountOf, B, CHINA, EGYPT, notable, partnerWords, pronounWords } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

/** A man of the leading household, who answers to the ruler for the count. */
const headman = (c: PlotContext) => notable(c, (a) => sexOf(a) === "male");

/** Labour or arms owed to whoever rules, called up for tomorrow; silver can
 * buy a substitute. */
export const levy: PlotTemplate = {
  id: "levy",
  look: {
    emblem: "levy",
    palette: { ink: "#17150f", fill: "#2a2618", edge: "#6b5a2e", light: "#efe6c8", accent: "#c9902f" },
  },
  payee: "official",
  weight: (c) => {
    const age = c.player.age ?? 30;
    const year = c.setting?.year ?? 0;
    return year > -3200 && year < 1920 && age >= 17 && age <= 45 && sexOf(c.player) !== "female" && ruled(c.setting) && headman(c) ? 0.9 : 0;
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
      id: "remind",
      when: { type: "all", of: [{ type: "due", hours: -3 }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "approach", role: "official", line: "remind" }],
    },
  ],
  endings: [
    { id: "excused", when: { type: "gone", role: "official" } },
    { id: "commuted", when: { type: "settled" } },
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
        partner: "Your {partnerKin} {partner} has already begun packing bread for you, as if it were settled.",
        "kin-partner": "They say the gang goes out to the canals tomorrow. Is there no one you can send?",
        "cast-official": "Keeps the list for the corvée, and has your name on it.",
        summons: "Your name is on the list for the canal works. Be at the landing at first light, or send someone in your place. {amount} would pay for a substitute.",
        remind: "The gang leaves at first light. Have you found a substitute, or are you coming yourself?",
        commuted: "{official} takes the {amount} and strikes your name. Another man will dig your stretch of the canal this year.",
        served: "At first light you join the gang at the landing. You'll be gone for weeks, and the field will have to wait.",
        excused: "With {official} gone, nobody comes to call your name. The list will be drawn up again next year.",
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
      },
    },
  ],
};
