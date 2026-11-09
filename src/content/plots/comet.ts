import { B, BRITAIN, CHINA, elderOf, fillIn, partnerWords, pickOf, pronounWords, temper } from "./common";
import type { PlotTemplate } from "./types";

/** Years Halley's comet came round, from the Shiji's record of 240 BCE on. */
const HALLEY = [B(240), B(164), B(87), B(12), 66, 141, 218, 295, 374, 451, 530, 607, 684, 760, 837, 912, 989,
  1066, 1145, 1222, 1301, 1378, 1456, 1531, 1607, 1682, 1759, 1835, 1910, 1986];

/** A comet hangs in the sky before dawn, and everyone has an opinion about it. */
export const comet: PlotTemplate = {
  id: "comet",
  shape: "world",
  look: {
    emblem: "comet",
    palette: { ink: "#0a0c16", fill: "#1c2240", edge: "#4a3a30", light: "#e8ecf6", accent: "#e8d080" },
  },
  weight: (c) => (c.setting && elderOf(c) ? (HALLEY.includes(c.setting.year) ? 0.9 : 0.12) * temper(c, "openness") : 0),
  cast: (c) => {
    const elder = elderOf(c);
    return elder && { elder };
  },
  begin: (c, cast) => {
    const elder = cast.elder!;
    const p = partnerWords(c);
    const him = pronounWords(elder);
    const midnight = Math.floor(c.clock / 86400) * 86400;
    return {
      deadline: midnight + 30 * 3600,
      words: {
        elder: elder.name,
        side: pickOf(c, ["east", "west", "north-east", "north-west"], "comet-side"),
        reading: fillIn(pickOf(c, [
          "it means someone great will die before the year is out",
          "it means a change of rulers, and nobody can say whether for better or worse",
          "comets come and go, and this one won't change the harvest",
          "the last one came the year {his} father died, and {he} has not forgotten it",
        ], "comet-reading"), him),
        ...him,
        ...p.words,
      },
      refs: { elder: elder.id, ...p.refs },
    };
  },
  opening: [{
    type: "choose", line: "sky", focus: "elder",
    choices: [{ id: "offer" }, { id: "ignore" }, { id: "charms", check: { stat: "extraversion", odds: 0.5 } }],
  }],
  developments: [
    { id: "scorned", when: { type: "fired", id: "charms:failed" }, then: [{ type: "regard", role: "elder", delta: -1 }] },
  ],
  endings: [
    { id: "shamed", when: { type: "fired", id: "scorned" } },
    { id: "sold", when: { type: "fired", id: "charms" } },
    { id: "offered", when: { type: "fired", id: "offer" } },
    { id: "ignored", when: { type: "fired", id: "ignore" } },
    { id: "passed", when: { type: "due" } },
  ],
  wording: [
    {
      // William of Malmesbury has the monk Eilmer greet the comet of April 1066 as the ruin of England.
      scope: { years: [1066, 1067], bounds: BRITAIN },
      title: "A Star with Hair",
      lines: {
        aim: "Decide what to do about the star with hair.",
        intro: "For a week now a star with a long tail has hung in the {side} before dawn. King Edward died in January with no son, and the crown has been fought over ever since.",
        threat: "Everyone agrees it is a sign about the crown, but not what it means.",
        partner: "Your {partnerKin} {partner} was up before light to look at it, and won't say what it means.",
        sky: "People stand in the lane before dawn with their heads back. {elder} says {reading}. The priest is saying a special Mass against it.",
        "offer:label": "Give a candle and go to the Mass",
        offered: "You give a candle and stand at the back while the priest prays against the star. Monks will write for a hundred years that it foretold the ruin of the English.",
        "charms:label": "Sell written prayers against it",
        sold: "You sell a dozen scraps of prayer, copied by the priest's boy, to people who can't read them. Business is good while the star lasts.",
        shamed: "The priest hears of it and calls you a trader in holy things from the altar. Nobody buys anything from you after that.",
        ignored: "You get on with your work. Whatever it means for the crown, it makes no difference to your day.",
      },
    },
    {
      // The court astronomers reported every "broom star" (huixing); emperors answered omens with edicts blaming their own conduct.
      scope: { years: [B(250), 1912], bounds: CHINA },
      title: "The Broom Star",
      lines: {
        aim: "Decide what to do about the broom star.",
        intro: "A broom star, a comet with a long tail, has hung in the {side} before dawn for some nights. The court astronomers will have reported it to the throne by now.",
        threat: "A broom star sweeps away the old to make room for the new, people say, and that can mean the emperor.",
        partner: "Your {partnerKin} {partner} says the last time there was one, taxes went up.",
        sky: "People are burning incense at the shrine before dawn. {elder} says {reading}. And the emperor will probably announce an amnesty, as they always do.",
        "offer:label": "Burn incense at the shrine",
        offered: "You burn incense with everyone else and bow toward the {side}. Word comes later that the emperor has blamed his own faults for the omen and pardoned prisoners.",
        "charms:label": "Sell paper charms against it",
        sold: "You sell paper charms with the character for peace on them, a copper each, and run out before noon.",
        shamed: "{elder} tells everyone your charms are worthless, and that selling them is how rumours of rebellion start. People hand them back.",
        ignored: "You get on with your work. Word comes later that the emperor has pardoned prisoners because of it.",
      },
    },
    {
      // In May 1910 the Earth passed through the comet's tail, and "comet pills" sold well against the gas a newspaper said it carried.
      scope: { years: [1910, 1911], bounds: [-130, 20, 40, 65] },
      title: "The Comet",
      lines: {
        aim: "Decide what to do about the comet.",
        intro: "Halley's comet is back, bright in the {side} before dawn, and the papers say the Earth will pass through its tail. One astronomer says the tail is full of poisonous gas.",
        threat: "Someone down the street is selling comet pills, and some of your neighbours have bought them.",
        partner: "Your {partnerKin} {partner} wants to know whether you should stuff rags under the doors.",
        "cast-elder": "Heard about the last time, in 1835, from {his} parents.",
        sky: "People are up on the roofs to watch, some with bottles. {elder} laughs at the papers: it came in 1835 too, {he} says, and nobody died of it then.",
        "offer:label": "Stuff rags under the doors, to be safe",
        offered: "You stuff the cracks and sit up with the family. The Earth passes through the tail and nothing happens at all.",
        "charms:label": "Sell comet pills of your own",
        sold: "You sell sugar pills in paper twists at a dime a time. The Earth passes through the tail, nobody is poisoned, and your customers are sure it was the pills.",
        shamed: "A policeman asks what is in your pills. Sugar, you admit, and he tells you to clear off.",
        ignored: "You get your work done. That night the Earth passes through the tail and nothing happens at all.",
        passed: "The night of the tail comes and goes, and nobody is poisoned. The pill sellers have moved on.",
      },
    },
    {
      title: "A Star with a Tail",
      lines: {
        aim: "Decide what to do about the star with a tail.",
        intro: "For some nights a star with a long tail has hung in the {side} before dawn. Nobody here has seen one like it.",
        threat: "People are uneasy. Things like this are supposed to mean something.",
        partner: "Your {partnerKin} {partner} was up before light to look at it, and won't say what it means.",
        "cast-elder": "Has seen more years than anyone here, and remembers what came after the last comet.",
        sky: "People stand outside before dawn with their heads back. {elder} looks at it a long time, and says {reading}.",
        "offer:label": "Make an offering against it",
        offered: "You make an offering with the others, and feel better for it. The star fades over the next few nights.",
        "ignore:label": "Put it out of your mind and work",
        ignored: "You get on with your work, and by evening you have stopped looking up at it.",
        "charms:label": "Sell charms against it",
        sold: "You sell charms against the star to anyone frightened enough to want one. By evening you have done better than in a week of work.",
        shamed: "{elder} says loudly that your charms are rubbish and you know it. People who bought them want their things back.",
        passed: "The comet stays a few more nights and fades. Nobody can agree afterwards what it meant.",
      },
    },
  ],
};
