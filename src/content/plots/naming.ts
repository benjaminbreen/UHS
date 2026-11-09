import { B, elderOf, ITALY, partnerWords, pronounWords } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const kinOf = (c: PlotContext) => {
  const partner = c.player.relations?.find((r) => r.kind === "partner")?.other;
  return c.actors.find((a) => a.id === partner && !a.dead && a.householdId === c.player.householdId);
};

const named = (id: string) => ({ type: "all" as const, of: [{ type: "came" as const }, { type: "fired" as const, id }] });

/** The household's newest baby has lived long enough to be given a name,
 * and the name has to be settled first. */
export const naming: PlotTemplate = {
  id: "naming",
  shape: "occasion",
  look: {
    emblem: "naming",
    palette: { ink: "#14120c", fill: "#2a2216", edge: "#7a6030", light: "#f4eedc", accent: "#e8b850" },
  },
  weight: (c) => ((c.household?.infants ?? 0) > 0 && kinOf(c) && elderOf(c) ? 0.6 : 0),
  cast: (c) => {
    const kin = kinOf(c), elder = elderOf(c);
    return kin && elder && { kin, elder };
  },
  begin: (c, cast) => {
    const kin = cast.kin!, elder = cast.elder!;
    const p = partnerWords(c);
    return {
      deadline: Math.floor(c.clock / 86400) * 86400 + 18 * 3600,
      words: { kin: kin.name, elder: elder.name, ...pronounWords(elder), ...p.words },
      refs: { kin: kin.id, elder: elder.id, ...p.refs },
    };
  },
  opening: [
    { type: "gather", at: "kin", when: "evening", label: "gather", scene: "feast" },
    { type: "choose", line: "name", choices: [{ id: "theirs" }, { id: "mine" }, { id: "guard" }] },
  ],
  developments: [
    { id: "pleased", when: { type: "fired", id: "theirs" }, then: [{ type: "regard", role: "kin", delta: 1 }] },
    { id: "hurt", when: { type: "fired", id: "mine" }, then: [{ type: "regard", role: "kin", delta: -1 }] },
    { id: "heeded", when: { type: "fired", id: "guard" }, then: [{ type: "regard", role: "elder", delta: 1 }] },
  ],
  endings: [
    { id: "named", when: named("theirs") },
    { id: "yours", when: named("mine") },
    { id: "guarded", when: named("guard") },
    { id: "missed", when: { type: "gathered" } },
  ],
  wording: [
    {
      // Yoruba isomoloruko: on the eighth day the baby is given water, salt, honey, kola and bitter kola, each with a prayer.
      scope: { years: [1500, 2100], bounds: [2.7, 6.2, 5.5, 9.5] },
      title: "The Naming",
      lines: {
        aim: "Be at home {meet} for the baby's naming.",
        intro: "The baby is eight days old, and today is the naming day (isomoloruko). The elders will touch each of the tastes of life to the baby's lips, water, salt, honey, kola and bitter kola, and every relative may give a name.",
        threat: "A child can carry a dozen names given that day. The one the family calls it by is still to be settled.",
        "guard:label": "Give it a name that tells death to stay away",
        "guard:then": "You settle on Malomo, \"don't go again\", the kind of name given to a child that death might come back for.",
        guarded: "{elder} touches honey and bitter kola to the baby's lips and calls out Malomo, and the old women nod. Then the other names are called, and everyone drops a gift into the bowl.",
      },
    },
    {
      // A Roman baby was purified and named on the dies lustricus, the ninth day for a boy and the eighth for a girl.
      scope: { years: [B(300), 400], bounds: ITALY },
      title: "The Naming Day",
      lines: {
        aim: "Be at home {meet} for the baby's naming day.",
        intro: "The baby has lived through its first eight days, and the most dangerous are behind it. Today it is purified and given its name (dies lustricus), and gets the charm (bulla) it will wear until it is grown.",
        threat: "Until today the baby had no name, and its father had not yet formally taken it into the family.",
        name: "{kin} has a grandparent's name picked out, from the other side of the family. You had your own parent's name in mind. And {elder} says the baby needs protection from the evil eye more than it needs a name.",
        "guard:label": "Ask {elder} for a charm against the evil eye",
        "guard:then": "{elder} brings an amulet against the evil eye (fascinum) to tie at the baby's neck beside the bulla.",
        guarded: "The baby is carried round the hearth, purified with water and named before the household gods, with {elder}'s amulet at its neck. There is a meal for everyone who came.",
      },
    },
    {
      title: "The Naming",
      lines: {
        aim: "Be at home {meet}, when the baby is given a name.",
        intro: "The newest baby in the house has come through its first days, and tonight the family gathers to give it its name.",
        threat: "Everyone in the family will be there. If you aren't, they will notice.",
        partner: "Your {partnerKin} {partner} wants the name to be a grandparent's.",
        "kin-partner": "People are coming tonight for the naming. Don't be late.",
        "cast-kin": "Is the baby's other parent, and is getting ready for the naming.",
        "cast-elder": "Will say the name over the baby tonight.",
        gather: "At the naming",
        name: "{kin} has a grandparent's name picked out, from the other side of the family. You had your own parent's name in mind. And {elder} says the babies that live are the ones with names death won't want.",
        "theirs:label": "Use {kin}'s choice",
        "theirs:then": "You tell {kin} to go ahead with that name. It is a good one.",
        "mine:label": "Insist on your parent's name",
        "mine:then": "You tell {kin} it will be your parent's name. {kin} doesn't argue, but goes quiet.",
        "guard:label": "Give it an ugly name to fool death",
        "guard:then": "You take {elder}'s advice: a name so plain and ugly no spirit would want to steal the child. The real name can wait until it's older.",
        named: "The baby is passed from arm to arm, and {elder} says the name aloud for everyone to hear. {kin} is beaming. From now on the baby is part of the family.",
        yours: "{elder} says the name aloud, your parent's name, and for a moment you think of your parent. {kin} smiles for the guests.",
        guarded: "{elder} says the ugly name aloud and the guests laugh, and then nod. A name like that is meant to make death pass the child by.",
        missed: "The baby was named without you there. People asked where you were.",
      },
    },
  ],
};
