import type { ChoiceCard } from "./types";

export const RICE_CARDS: ChoiceCard[] = [
  {
    id: "rice-exchange",
    slot: "rice-plant",
    who: "neighbour",
    as: "neighbour",
    // Exchange labour for transplanting: yui in Japan, huangong in China,
    // gotong royong in Java.
    evidence: "documented",
    text: "{name} from the next paddy offers to help you transplant today, if you will help with theirs tomorrow.",
    choices: [
      {
        label: "Work together",
        note: "faster · tomorrow is theirs",
        then: [{ type: "day", delta: 1 }, { type: "regard", delta: 1 }],
        line: "You and {name} transplanted together, singing the rows.",
      },
      {
        label: "Plant alone",
        note: "slower",
        then: [{ type: "fatigue", n: 15 }],
        line: "You planted alone, bent double all day.",
      },
      {
        label: "Hire a day labourer",
        then: [{ type: "item", item: "coin", n: -1 }, { type: "day", delta: 1 }],
        line: "You hired a hand for the day.",
      },
    ],
  },
  {
    id: "rice-heat",
    slot: "rice-weed",
    when: "hot",
    evidence: "inferred",
    text: "By noon the paddy water is as warm as a bath, and the leeches are out.",
    choices: [
      {
        label: "Keep at it",
        check: { stat: "endurance", skill: "farming", odds: 0.55 },
        then: [{ type: "day", delta: 1 }, { type: "fatigue", n: 15 }],
        line: "You weeded on through the heat.",
        otherwise: [{ type: "day", delta: -1 }, { type: "fatigue", n: 25 }],
        otherwiseLine: "The heat drove you out of the paddy.",
      },
      {
        label: "Rest under the trees",
        then: [{ type: "minutes", n: 60 }, { type: "fatigue", n: -10 }],
        line: "You rested under the trees until it cooled.",
      },
      {
        label: "Leave the far corner",
        note: "less rice",
        then: [{ type: "day", delta: -1 }],
        line: "You left the far corner to the weeds.",
      },
    ],
  },
  {
    id: "rice-slumped-bund",
    slot: "rice-weed",
    evidence: "inferred",
    text: "A bund has slumped overnight, and your water is running away into the next paddy.",
    choices: [
      {
        label: "Rebuild it properly",
        then: [{ type: "minutes", n: 60 }],
        line: "You rebuilt the slumped bund before weeding.",
      },
      {
        label: "Patch it with mud",
        check: { stat: "agility", skill: "farming", odds: 0.5 },
        then: [],
        line: "You patched the bund with mud, and it held.",
        otherwise: [{ type: "day", delta: -1 }],
        otherwiseLine: "You patched the bund with mud, and it gave way again by noon.",
      },
      {
        label: "Let it run",
        note: "less water",
        then: [{ type: "day", delta: -1 }],
        line: "You let the water run and got on with the weeds.",
      },
    ],
  },
  {
    id: "rice-blocked-channel",
    slot: "rice-water",
    who: "neighbour",
    as: "neighbour",
    // Who got the water, and when, was the commonest quarrel in a rice village.
    evidence: "documented",
    text: "Upstream, {name} has blocked the channel to fill their own paddy first.",
    choices: [
      {
        label: "Ask them to open it",
        check: { stat: "wit", skill: "speech", odds: 0.5 },
        then: [],
        line: "{name} grumbled and opened the channel.",
        otherwise: [{ type: "day", delta: -1 }, { type: "regard", delta: -1 }],
        otherwiseLine: "{name} would not open the channel.",
      },
      {
        label: "Open it yourself after dark",
        note: "they may find out",
        check: { stat: "agility", odds: 0.55 },
        then: [{ type: "day", delta: 1 }],
        line: "You opened the channel at night, and your paddy filled.",
        otherwise: [{ type: "day", delta: 1 }, { type: "regard", delta: -3 }],
        otherwiseLine: "You opened the channel at night, and {name} caught you at it.",
      },
      {
        label: "Wait your turn",
        note: "less water",
        then: [{ type: "day", delta: -1 }],
        line: "You waited your turn for the water.",
      },
    ],
  },
  {
    id: "rice-rain-coming",
    slot: "rice-cut",
    when: "wet",
    evidence: "inferred",
    text: "The rain has come early. Rice left standing will lodge, and sheaves left lying will sprout.",
    choices: [
      {
        label: "Cut until dark",
        check: { stat: "endurance", skill: "farming", odds: 0.55 },
        then: [{ type: "day", delta: 1 }, { type: "fatigue", n: 20 }],
        line: "You cut until dark and got the sheaves under cover.",
        otherwise: [{ type: "day", delta: -1 }, { type: "fatigue", n: 30 }],
        otherwiseLine: "You cut until dark, but half the sheaves lay out in the rain.",
      },
      {
        label: "Call your kin out to help",
        then: [{ type: "day", delta: 1 }, { type: "minutes", n: 30 }],
        line: "Your kin came out, and the rice was in before the worst of it.",
      },
      {
        label: "Save what you can",
        note: "less rice",
        then: [{ type: "day", delta: -1 }],
        line: "You saved what you could and let the rest go.",
      },
    ],
  },
  {
    id: "rice-gleaners",
    slot: "rice-cut",
    // The poor's right to glean after the reapers ran from China to Europe.
    evidence: "documented",
    text: "Poor women from the village follow behind you as you cut, waiting to glean.",
    choices: [
      {
        label: "Leave plenty for them",
        note: "less rice · goodwill",
        then: [{ type: "day", delta: -1 }],
        line: "You cut loosely and left plenty behind for the gleaners.",
      },
      {
        label: "Cut it clean",
        note: "more rice",
        then: [{ type: "day", delta: 1 }],
        line: "You cut it clean, and the gleaners went away with little.",
      },
      {
        label: "Let them glean when you are done",
        then: [],
        line: "You let the gleaners in once the sheaves were tied.",
      },
    ],
  },
  {
    id: "rice-rent",
    slot: "rice-rent",
    who: "official",
    as: "landlord’s agent",
    // Tenants commonly paid half the main crop in kind.
    evidence: "documented",
    text: "The landlord’s agent has come to measure the harvest. He wants half, as agreed.",
    choices: [
      {
        label: "Measure it out fairly",
        note: "half the grain",
        then: [{ type: "day", delta: -1 }],
        line: "You measured out half the grain for the landlord.",
      },
      {
        label: "Hide a basket in the loft",
        check: { stat: "agility", odds: 0.45 },
        then: [],
        line: "You hid a basket before the agent counted.",
        otherwise: [{ type: "day", delta: -2 }, { type: "regard", delta: -2 }],
        otherwiseLine: "The agent found the basket you had hidden.",
      },
      {
        label: "Plead a poor year",
        check: { stat: "wit", skill: "speech", odds: 0.35 },
        then: [],
        line: "The agent took less, this once.",
        otherwise: [{ type: "day", delta: -1 }, { type: "regard", delta: -1 }],
        otherwiseLine: "The agent took his half, and a lecture besides.",
      },
    ],
  },
  {
    id: "rice-night-soil",
    slot: "rice-manure",
    // Night soil fed the paddies of China and Japan; in Edo it was sold.
    evidence: "documented",
    text: "The night-soil jars are full, and the paddy will be hungry come spring.",
    choices: [
      {
        label: "Carry it out yourself",
        then: [{ type: "day", delta: 1 }, { type: "fatigue", n: 15 }],
        line: "You carried the jars out to the paddy.",
      },
      {
        label: "Sell it to the collector",
        then: [{ type: "item", item: "coin", n: 1 }],
        line: "You sold the night soil to the collector for a coin.",
      },
      {
        label: "Leave it until spring",
        then: [{ type: "day", delta: -1 }],
        line: "You left the jars standing until spring.",
      },
    ],
  },
];
