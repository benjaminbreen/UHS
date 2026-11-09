import { capabilitiesFor } from "../characters/resolve";
import { B, BRITAIN, CHINA, dueOf, elderOf, notable, partnerWords, pickOf, pronounWords, temper, trade, working } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const digs = (c: PlotContext) => working(c) || trade(c, /build|mason|dig|ditch|potter|brick|labour|miner|quarr/);

const FINDS: Record<"coined" | "plain", [string, string][]> = {
  coined: [["a pot of old coins, green and stuck together, with a face on them nobody knows", "a coin"], ["a little bronze box with rings and a brooch inside", "a ring"]],
  plain: [["a bundle of stone blades, finer than anyone makes now", "a blade"], ["an old grave: bones laid on their side, with beads at the neck", "a string of the beads"]],
};

const findOf = (c: PlotContext) => pickOf(c, FINDS[c.setting && capabilitiesFor(c.setting).has("coinage") ? "coined" : "plain"], "hoard-find");

const after = (id: string) => ({ type: "after" as const, id, hours: 2 });

/** Your spade hits something that someone buried long before anyone here can remember. */
export const hoard: PlotTemplate = {
  id: "hoard",
  shape: "discovery",
  look: {
    emblem: "dig",
    palette: { ink: "#12100c", fill: "#3a2e20", edge: "#7a5a34", light: "#efe8da", accent: "#d8b45a" },
  },
  weight: (c) => (digs(c) && elderOf(c) && notable(c) ? 0.4 * temper(c, "openness") : 0),
  cast: (c) => {
    const patron = notable(c);
    const elder = elderOf(c, patron);
    return patron && elder && { patron, elder };
  },
  begin: (c, cast) => {
    const patron = cast.patron!, elder = cast.elder!;
    const p = partnerWords(c);
    const [find, piece] = findOf(c);
    const e = pronounWords(elder);
    return {
      deadline: dueOf(c.clock).deadline,
      words: { patron: patron.name, elder: elder.name, find, piece, elderHe: e.He, elderhe: e.he, ...pronounWords(patron), ...p.words },
      refs: { patron: patron.id, elder: elder.id, ...p.refs },
    };
  },
  opening: [{ type: "choose", line: "glint", choices: [{ id: "hand" }, { id: "piece" }, { id: "bury" }] }],
  developments: [
    { id: "thanked", when: { type: "fired", id: "hand" }, then: [{ type: "regard", role: "patron", delta: 2 }] },
    { id: "counted", when: after("piece"), then: [{ type: "choose", line: "counted", focus: "elder", choices: [{ id: "return" }, { id: "swear", check: { stat: "wit", odds: 0.5 } }] }] },
    { id: "seen-burying", when: after("bury"), then: [{ type: "choose", line: "noticed", focus: "elder", from: "elder", choices: [{ id: "admit" }, { id: "lie", check: { stat: "wit", odds: 0.5 } }] }] },
    { id: "exposed", when: { type: "fired", id: "lie:failed" }, then: [{ type: "regard", role: "patron", delta: -2 }] },
    { id: "doubted", when: { type: "fired", id: "swear:failed" }, then: [{ type: "regard", role: "patron", delta: -2 }] },
    { id: "trusted", when: { type: "fired", id: "admit" }, then: [{ type: "regard", role: "elder", delta: 1 }] },
  ],
  endings: [
    { id: "handed", when: { type: "fired", id: "thanked" } },
    { id: "caught", when: { type: "fired", id: "exposed" } },
    { id: "short", when: { type: "fired", id: "doubted" } },
    { id: "kept", when: { type: "fired", id: "swear" } },
    { id: "buried", when: { type: "fired", id: "lie" } },
    { id: "confessed", when: { type: "fired", id: "trusted" } },
    { id: "returned", when: { type: "fired", id: "return" } },
    { id: "out", when: { type: "due" } },
  ],
  wording: [
    {
      // Treasure trove belonged to the Crown, and the coroner held an inquest on every find; concealing one was an offence.
      scope: { years: [1200, 1997], bounds: BRITAIN },
      title: "Treasure Trove",
      lines: {
        intro: "Digging this morning, your spade hit {find}. Someone buried it a very long time ago and never came back.",
        threat: "Buried treasure belongs to the Crown, and the coroner holds an inquest on every find. Hiding one is a crime. Selling it quietly is tempting.",
        partner: "Your {partnerKin} {partner} says nobody has to know.",
        "kin-partner": "Nobody would know. Or tell {patron} and be done with it.",
        "cast-patron": "Will have to send for the coroner if {he} hears of it.",
        "hand:label": "Take it to {patron}",
        handed: "{patron} sends for the coroner, who holds an inquest and takes it for the Crown. You get a small reward, and a name for honesty.",
        confessed: "You tell {elder} the truth, and take all of it to {patron}. The coroner takes it for the Crown, and asks pointed questions about why it took you so long.",
        caught: "{elder} doesn't believe you, and says so to {patron}. The coroner's men dig it up, and you will answer for concealing treasure.",
        short: "{patron} has your house searched, and they find {piece}. You will answer to the coroner for concealing treasure.",
      },
    },
    {
      // In 116 BCE a bronze tripod dug up at Fenyin was taken as so lucky an omen that Han Wudi named his reign for it.
      scope: { years: [B(200), 1912], bounds: CHINA },
      title: "An Old Bronze",
      lines: {
        intro: "Digging this morning, your spade hit an old bronze vessel, green with age, with characters cast inside it that nobody alive can read.",
        threat: "Ancient bronzes are lucky things, and collectors pay well for them. Officials like to send them to the capital as good omens, and give the finder little.",
        partner: "Your {partnerKin} {partner} says a scholar in town would pay a year's earnings for it.",
        "kin-partner": "Sell it quietly. Or give it to {patron} and let {him} owe us.",
        "cast-patron": "Would like very much to be the one who presents an old bronze to the magistrate.",
        "cast-elder": "Can read a few of the old characters.",
        glint: "The bronze sits in the hole, green and heavy, the characters inside it full of earth. Nobody else has seen it yet.",
        "hand:label": "Take it to {patron}",
        "piece:label": "Sell it quietly to a collector",
        "piece:then": "You wrap it in sacking and take it to a dealer in town, who pays without asking where it came from.",
        "bury:label": "Wrap it and hide it in the store",
        "bury:then": "You wrap it in old cloth and push it behind the grain jars. You'll sell it when the price is right.",
        noticed: "{elder} saw you dig something up, and has been asking what it was. {elderHe} can read the old characters, and wants to see it.",
        counted: "{elder} saw you dig something up, and has heard a dealer in town paid well for an old bronze. {elderHe} asks you straight out whether it was yours.",
        "return:label": "Admit it, and give {patron} the silver",
        "swear:label": "Swear you never found anything",
        returned: "You give {patron} the dealer's silver. It isn't a bronze to present to the magistrate, but {patron} takes it, and keeps quiet.",
        short: "{elder} goes to {patron}, and {patron} goes to the dealer. By evening everyone knows where the bronze came from, and who sold it.",
        handed: "{patron} presents the bronze to the magistrate as a good omen, with your name mentioned. You get a bolt of silk and some respect.",
        kept: "{elder} lets it go. You have the dealer's silver, and nobody can prove where it came from.",
        buried: "{elder} goes away satisfied. The bronze is behind the grain jars, and only you know.",
        confessed: "You show {elder}, who makes out two characters: a family name, and the word for sacrifice. {elder} takes you to {patron}, who presents it to the magistrate.",
        caught: "{elder} doesn't believe you, and tells {patron}. By evening {patron} has the bronze, and everyone knows you tried to hide it.",
      },
    },
    {
      title: "Something in the Ground",
      lines: {
        aim: "Decide what to do with what you found.",
        intro: "Digging this morning, you turned up {find}. Someone put it there long before anyone here can remember.",
        threat: "Some people say things like this should be left alone. Others would want it for themselves.",
        partner: "Your {partnerKin} {partner} says to put it back where it came from.",
        "kin-partner": "Put it back. Or ask {elder} first.",
        "cast-patron": "Would want to know about anything valuable found nearby.",
        "cast-elder": "Knows the old stories about who lived here before.",
        glint: "You kneel by the hole: {find}. Nobody else has seen it yet.",
        "hand:label": "Take it to {patron}",
        "piece:label": "Keep {piece}, hand in the rest",
        "piece:then": "You keep {piece} back and take the rest to {patron}, who thanks you for it.",
        "bury:label": "Fill the hole in and say nothing",
        "bury:then": "You put it back, fill the hole in, and go on with your work.",
        noticed: "{elder} was out above the field and saw you stop digging and kneel. Now {elderhe} wants to know what you found.",
        "admit:label": "Tell {elder} the truth",
        "lie:label": "Say it was an old pot",
        counted: "{elder} saw you at the hole this morning, and tells {patron} the find looked bigger than what you brought in.",
        "return:label": "Hand over {piece} too",
        "swear:label": "Swear that was all of it",
        handed: "{patron} takes it, and thanks you in front of everyone. It does you no harm to have {him} grateful.",
        kept: "{patron} looks at you, then at {elder}, and lets it go. You have {piece} that nobody knows about.",
        short: "{patron} sends someone to search your house, and they find {piece}. Everyone knows you tried to keep it.",
        returned: "You hand over {piece}. {patron} says nothing, but {elder} nods. It is all handed in now, a few hours late.",
        buried: "{elder} shrugs and goes away. Only you know what is under that field.",
        confessed: "You tell {elder} the truth. {elder} says the people who were here before must have left it, and goes with you to {patron}, who takes it all.",
        caught: "{elder} doesn't believe you, and says so to {patron}. They dig it up in front of half the village, and everyone knows you tried to keep it.",
        out: "By evening everyone has heard about it, and everyone has an opinion.",
      },
    },
  ],
};
