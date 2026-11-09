import { random } from "../../core/random";
import { ruled } from "../history/order";
import { amountOf, dueOf, elderOf, fillIn, neighbours, partnerWords, pickOf, pronounWords } from "./common";
import type { Condition, Effect, PlotTemplate } from "./types";

const answer: Effect = {
  type: "choose", line: "answer", focus: "accuser",
  choices: [
    { id: "elder", check: { stat: "agreeableness", odds: 0.55 } },
    { id: "bedside", check: { stat: "openness", odds: 0.5 } },
    { id: "diviner", check: { stat: "wit", odds: 0.5 } },
    { id: "gifts" },
  ],
};
const not = (id: string) => ({ type: "not", of: { type: "fired", id } }) as const;
const vouched: Condition = { type: "all", of: [{ type: "fired", id: "elder" }, not("elder:failed")] };

/** A neighbour blames your ill will for a sickness in their house. In small
 * communities without courts, misfortune is often explained by someone's
 * envy or anger, and settled by an elder's word or by gifts. */
export const sorcery: PlotTemplate = {
  id: "sorcery",
  shape: "claim",
  look: {
    emblem: "hex",
    palette: { ink: "#120f1a", fill: "#1f1a2c", edge: "#4a3a6e", light: "#e6e0f0", accent: "#8a6ad0" },
  },
  payee: "accuser",
  weight: (c) => (c.setting && !ruled(c.setting) && neighbours(c).length >= 3 && elderOf(c) ? 0.5 : 0),
  cast: (c) => {
    const elder = elderOf(c);
    const others = neighbours(c).filter((a) => a.id !== elder?.id && a.householdId !== elder?.householdId && (a.age ?? 30) < 50);
    const accuser = others.length ? pickOf(c, others, "sorcery-accuser") : undefined;
    return accuser && elder && { accuser, elder };
  },
  begin: (c, cast) => {
    const accuser = cast.accuser!, elder = cast.elder!;
    const owed = 2 + Math.floor(random(c.seed, "plot", "sorcery", "owed") * 3);
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    const pr = pronounWords(accuser);
    return {
      deadline,
      owed,
      words: {
        accuser: accuser.name,
        accuserRole: accuser.role.toLowerCase(),
        elder: elder.name,
        amount: amountOf(c, owed),
        due,
        sick: fillIn(pickOf(c, ["{his} child", "{his} mother", "{his} sister", "{his} youngest"], "sorcery-sick"), pr),
        quarrel: fillIn(pickOf(c, [
          "you argued over a dog that killed {his} hens",
          "you refused {him} a share of your catch",
          "you laughed at {him} at the last gathering",
          "{he} asked your household for help and was turned away",
        ], "sorcery-quarrel"), pr),
        ...pr,
        ...p.words,
      },
      refs: { accuser: accuser.id, elder: elder.id, ...p.refs },
    };
  },
  opening: [{ type: "approach", role: "accuser", line: "accuse" }],
  developments: [
    { id: "ask-elder", when: { type: "all", of: [{ type: "talked", role: "elder" }, not("ask-accuser"), not("ask-late")] }, then: [answer] },
    { id: "ask-accuser", when: { type: "all", of: [{ type: "talked", role: "accuser" }, not("ask-elder"), not("ask-late")] }, then: [answer] },
    { id: "ask-late", when: { type: "all", of: [{ type: "since", hours: 1 }, not("ask-elder"), not("ask-accuser"), { type: "not", of: { type: "settled" } }] }, then: [answer] },
    { id: "given", when: { type: "fired", id: "gifts" }, then: [{ type: "seize", role: "accuser" }] },
    { id: "named-pay", when: { type: "fired", id: "diviner:failed" }, then: [{ type: "seize", role: "accuser" }, { type: "regard", role: "accuser", delta: -2 }] },
    {
      id: "talk",
      when: { type: "all", of: [{ type: "since", hours: 3 }, { type: "not", of: vouched }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "card", line: "talk", focus: "accuser" }],
    },
    {
      id: "worse",
      when: { type: "fired", id: "bedside:failed" },
      then: [
        { type: "walk-off", role: "accuser", to: "authority" },
        { type: "gather", at: "authority", when: "morning", label: "hearing", scene: "hearing", aim: "aim-hearing" },
      ],
    },
    {
      id: "final",
      when: { type: "all", of: [{ type: "due" }, { type: "not", of: { type: "settled" } }, { type: "not", of: vouched }, not("worse")] },
      then: [
        { type: "walk-off", role: "accuser", to: "authority" },
        { type: "card", line: "blamed", focus: "accuser" },
        { type: "gather", at: "authority", when: "morning", label: "hearing", scene: "hearing", aim: "aim-hearing" },
      ],
    },
    {
      id: "verdict",
      when: { type: "all", of: [{ type: "came" }, { type: "not", of: vouched }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "seize", role: "accuser" }],
    },
    {
      id: "default",
      when: { type: "all", of: [{ type: "gathered" }, { type: "not", of: { type: "came" } }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "seize", role: "accuser" }, { type: "regard", role: "official", delta: -2 }],
    },
  ],
  endings: [
    { id: "named", when: { type: "fired", id: "named-pay" } },
    { id: "cleared", when: { type: "all", of: [vouched, not("final"), not("worse")] } },
    { id: "judged", when: { type: "fired", id: "verdict" } },
    { id: "absent", when: { type: "fired", id: "default" } },
    { id: "appeased", when: { type: "settled" } },
    { id: "heard", when: { type: "all", of: [{ type: "came" }, vouched] } },
    { id: "dropped", when: { type: "gone", role: "accuser" } },
    { id: "cooled", when: { type: "all", of: [{ type: "fired", id: "bedside" }, not("bedside:failed")] } },
    { id: "divined", when: { type: "all", of: [{ type: "fired", id: "diviner" }, not("diviner:failed")] } },
  ],
  wording: [
    {
      title: "Blamed for a Sickness",
      lines: {
        aim: "Get {elder} to speak for you, or give {accuser} gifts to make peace, {due}.",
        intro: "{accuser} the {accuserRole} says the sickness in {sick} began the day {quarrel}, and that your anger caused it.",
        threat: "If nobody stands up for you, {he} will take it to {authority}, and a household blamed for sickness can be made to leave.",
        partner: "Your {partnerKin} {partner} has stopped going to the water when {accuser}'s people are there.",
        "kin-partner": "Go and see {elder}. People still listen to {elder}.",
        "cast-accuser": "Blames your household for the sickness in {his} house.",
        "cast-elder": "The oldest here. If {elder} says you meant no harm, people will believe it.",
        accuse: "Since that day, the sickness hasn't left my house. Give me {amount} to put it right, {due}, or everyone will know who did this.",
        talk: "Mothers call their children in when you walk past.",
        answer: "{accuser}'s household is sure your anger made {sick} ill, and the whole place is waiting to see what you do.",
        "elder:label": "Ask {elder} to speak for you",
        "elder:failed": "{elder} won't take sides while {sick} is still sick.",
        "bedside:label": "Go to the sickbed and show you bear no grudge",
        "bedside:then": "You go into {accuser}'s house, sit by {sick}, and say in front of the family that you wish them well and hold nothing against them.",
        "bedside:failed": "That night {sick} gets worse, and {accuser}'s family say your visit did it. {accuser} goes to {authority}.",
        "diviner:label": "Ask for a diviner to find the cause",
        "diviner:failed": "The diviner looks for a long time, and then names your household.",
        "gifts:label": "Send {amount} in gifts to make peace",
        cooled: "{sick} sleeps through the night and wakes a little better. People say your heart must be clean after all, and {accuser} lets it rest.",
        divined: "The diviner names another cause: an old wrong done to the dead, not your quarrel. {accuser}'s household turn to putting that right, and leave yours alone.",
        named: "The diviner's word is taken. Your household has to pay {accuser} for the harm, and some people still won't eat food from your house.",
        cleared: "{elder} says publicly that you meant no harm and that the sickness came from somewhere else. {accuser} has nothing more to say.",
        appeased: "You give {accuser} gifts, and the two households eat together. The sickness isn't mentioned again.",
        blamed: "{accuser} has gone to {authority}. Your household will have to answer for the sickness.",
        dropped: "With {accuser} gone, people stop talking about it.",
        hearing: "At the hearing before {authority}",
        "aim-hearing": "Answer {accuser} before {authority} {meet}. Get {elder} to speak for you first.",
        heard: "{accuser} tells everyone about the sickness and your quarrel. Then {elder} stands up and says you meant no harm, and people nod. It's over.",
        judged: "{accuser} tells everyone about the sickness and your quarrel, and nobody speaks for you. You're told to give {accuser} {amount} to make up for the harm.",
        absent: "You stayed away, and people took that as proof. You're told to give {accuser} {amount} to make up for the harm, and some households have stopped speaking to yours.",
      },
    },
  ],
};
