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
    text: "{Name}, who farms the next paddy, offers to help you plant out your rice seedlings today if you'll help with theirs tomorrow. Swapping work like this is how most villages here get the planting done.",
    choices: [
      {
        label: "Work together",
        note: "faster · you give up tomorrow to their field",
        then: [{ type: "day", delta: 1 }, { type: "regard", delta: 1 }, { type: "fatigue", n: 10 }],
        line: "You and {name} planted together, singing to keep the rows in time.",
      },
      {
        label: "Plant alone",
        note: "bent double all day · exhausting",
        then: [{ type: "fatigue", n: 20 }],
        line: "You planted alone, bent double all day.",
      },
      {
        label: "Hire a labourer for the day",
        note: "costs money · {name} may feel snubbed",
        then: [{ type: "item", item: "coin", n: -1 }, { type: "day", delta: 1 }, { type: "regard", delta: -1 }],
        line: "You hired a hand for the day.",
      },
    ],
  },
  {
    id: "rice-heat",
    slot: "rice-weed",
    when: "hot",
    evidence: "inferred",
    text: "By midday the water in the paddy is as warm as a bath, the sun is beating down, and the leeches are out.",
    choices: [
      {
        label: "Keep weeding",
        note: "you may not last · exhausting",
        check: { stat: "endurance", skill: "farming", odds: 0.55 },
        then: [{ type: "day", delta: 1 }, { type: "fatigue", n: 15 }],
        line: "You kept weeding through the heat.",
        otherwise: [{ type: "day", delta: -1 }, { type: "fatigue", n: 25 }],
        otherwiseLine: "The heat drove you out of the paddy.",
      },
      {
        label: "Rest in the shade until it cools",
        note: "you'll recover, but lose an hour or two",
        then: [{ type: "minutes", n: 90 }, { type: "fatigue", n: -10 }],
        line: "You rested under the trees until it cooled, then finished late.",
      },
      {
        label: "Leave the far corner",
        note: "no strain, but less rice",
        then: [{ type: "day", delta: -1 }],
        line: "You left the far corner to the weeds.",
      },
    ],
  },
  {
    id: "rice-slumped-bund",
    slot: "rice-weed",
    evidence: "inferred",
    text: "Part of the low earth wall round your paddy collapsed overnight, and your water is draining into the next field. Rice needs to stand in water.",
    choices: [
      {
        label: "Rebuild the wall properly",
        note: "sure to hold · an hour of heavy digging",
        then: [{ type: "minutes", n: 60 }, { type: "fatigue", n: 10 }],
        line: "You rebuilt the broken wall before weeding.",
      },
      {
        label: "Patch it with mud",
        note: "quick, but it may give way again",
        check: { stat: "agility", skill: "farming", odds: 0.5 },
        then: [],
        line: "You patched the wall with mud, and it held.",
        otherwise: [{ type: "day", delta: -1 }],
        otherwiseLine: "You patched the wall with mud, and it gave way again by midday.",
      },
      {
        label: "Let it drain for now",
        note: "no effort, but less rice",
        then: [{ type: "day", delta: -1 }],
        line: "You let the water run and got on with the weeding.",
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
    text: "Upstream, {name} has blocked the shared channel to fill their own paddy first, and your field is drying out.",
    choices: [
      {
        label: "Ask them to open it",
        note: "they may refuse, and it'll sour things",
        check: { stat: "wit", skill: "speech", odds: 0.5 },
        then: [],
        line: "{Name} grumbled but opened the channel.",
        otherwise: [{ type: "day", delta: -1 }, { type: "regard", delta: -1 }],
        otherwiseLine: "{Name} refused to open the channel.",
      },
      {
        label: "Open it yourself after dark",
        note: "you get the water · if they catch you, they won't forget it",
        check: { stat: "agility", odds: 0.55 },
        then: [{ type: "day", delta: 1 }, { type: "fatigue", n: 10 }],
        line: "You opened the channel at night, and your paddy filled.",
        otherwise: [{ type: "day", delta: 1 }, { type: "fatigue", n: 10 }, { type: "regard", delta: -3 }],
        otherwiseLine: "You opened the channel at night, and {name} caught you at it.",
      },
      {
        label: "Wait your turn",
        note: "keeps the peace, but less rice",
        then: [{ type: "day", delta: -1 }, { type: "regard", delta: 1 }],
        line: "You waited your turn for the water.",
      },
    ],
  },
  {
    id: "rice-rain-coming",
    slot: "rice-cut",
    when: "wet",
    // Helpers at harvest were fed and given drink, and owed help in return.
    evidence: "inferred",
    text: "The rains have come early and your rice is ripe. If you leave it standing, the rain will knock it flat and it will rot. If you cut it and can't get it dry, it will start to sprout. Either way, you lose rice.",
    choices: [
      {
        label: "Bring it all in yourself",
        note: "you may not finish · exhausting",
        check: { stat: "endurance", skill: "farming", odds: 0.55 },
        then: [{ type: "day", delta: 1 }, { type: "fatigue", n: 20 }],
        line: "You cut until dark and got all the rice under cover.",
        otherwise: [{ type: "day", delta: -1 }, { type: "fatigue", n: 30 }],
        otherwiseLine: "You cut until dark, but half the rice was still lying out in the rain.",
      },
      {
        label: "Ask the neighbours to help",
        note: "you'll owe them a meal, rice wine and a day's work",
        then: [{ type: "day", delta: 1 }, { type: "minutes", n: 30 }, { type: "pay", delta: -1 }, { type: "fatigue", n: 5 }],
        line: "The neighbours came out, and the rice was in before the worst of the rain. Now you owe them.",
      },
      {
        label: "Cut only the best of it",
        note: "lose part of the crop, but no risk",
        then: [{ type: "day", delta: -1 }],
        line: "You cut the best of it and let the rest go.",
      },
    ],
  },
  {
    id: "rice-gleaners",
    slot: "rice-cut",
    // The poor's right to glean after the reapers ran from China to Europe.
    evidence: "documented",
    text: "Poor women from the village are following behind you as you cut. They're waiting to pick up the rice you drop, which custom says is theirs.",
    choices: [
      {
        label: "Cut loosely and leave plenty",
        note: "the village will think well of you · less rice, but a quick job",
        then: [{ type: "day", delta: -1 }],
        line: "You cut loosely and left plenty behind for the gleaners.",
      },
      {
        label: "Cut it clean",
        note: "more rice · slow, careful work, and people will call you mean",
        then: [{ type: "day", delta: 1 }, { type: "minutes", n: 45 }, { type: "fatigue", n: 10 }],
        line: "You cut it clean, and the gleaners went away with little.",
      },
      {
        label: "Make them wait until you've finished",
        note: "fair to both, but you'll have to watch them all day",
        then: [{ type: "minutes", n: 30 }],
        line: "You let the gleaners in once the bundles were tied.",
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
    text: "The landlord's agent has come to measure the harvest. Your lease gives the landlord half.",
    choices: [
      {
        label: "Measure it out honestly",
        note: "you lose half, but no trouble",
        then: [{ type: "day", delta: -1 }],
        line: "You measured out half the rice for the landlord.",
      },
      {
        label: "Hide a basket in the loft",
        note: "if he finds it, he takes extra and remembers you",
        check: { stat: "agility", odds: 0.45 },
        then: [],
        line: "You hid a basket before the agent counted.",
        otherwise: [{ type: "day", delta: -2 }, { type: "regard", delta: -2 }],
        otherwiseLine: "The agent found the basket you had hidden.",
      },
      {
        label: "Tell him it was a bad year",
        note: "he'll probably not believe you",
        check: { stat: "wit", skill: "speech", odds: 0.35 },
        then: [],
        line: "The agent took less, just this once.",
        otherwise: [{ type: "day", delta: -1 }, { type: "regard", delta: -1 }],
        otherwiseLine: "The agent took his half and told you off as well.",
      },
    ],
  },
  {
    id: "rice-night-soil",
    slot: "rice-manure",
    // Night soil fed the paddies of China and Japan; in Edo it was sold.
    evidence: "documented",
    text: "The jars of human waste from the household are full. Spread on the paddy, it's the best fertiliser you have, and there are collectors who will buy it.",
    choices: [
      {
        label: "Carry it out to the paddy",
        note: "a better crop · heavy, filthy work",
        then: [{ type: "day", delta: 1 }, { type: "fatigue", n: 15 }, { type: "risk", ailment: "dysentery", odds: 40 }],
        line: "You carried the jars out to the paddy.",
      },
      {
        label: "Sell it to the collector",
        note: "a coin now, but a thinner crop",
        then: [{ type: "item", item: "coin", n: 1 }, { type: "day", delta: -1 }],
        line: "You sold the night soil to the collector for a coin.",
      },
      {
        label: "Leave it until spring",
        note: "no effort and no gain",
        then: [],
        line: "You left the jars standing until spring.",
      },
    ],
  },
];
