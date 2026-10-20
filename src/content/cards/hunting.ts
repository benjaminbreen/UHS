import type { ChoiceCard } from "./types";

const work = ["Looking for game"] as const;

// A hunting day's trouble is the animal itself, and afterwards whoever has a
// claim on the kill: the lord or chief who holds the game, and the kin it is
// shared among. Which applies follows from the setting, not the region.
export const HUNTING_CARDS: ChoiceCard[] = [
  {
    id: "hunting-wounded-animal",
    slot: "hunt-2",
    work,
    hunting: {},
    evidence: "inferred",
    text: "You hit an animal, but not cleanly. It crashes off into the brush, bleeding.",
    choices: [
      {
        label: "Follow the blood trail now",
        note: "tiring · you may lose it",
        check: { stat: "endurance", skill: "hunting", odds: 0.55 },
        then: [{ type: "minutes", n: 90 }, { type: "fatigue", n: 12 }, { type: "item", item: "meat", n: 3 }, { type: "item", item: "hide", n: 1 }],
        line: "You followed the blood for an hour and found it down. You finished it.",
        otherwise: [{ type: "minutes", n: 90 }, { type: "fatigue", n: 15 }],
        otherwiseLine: "You lost the trail on stony ground.",
      },
      {
        label: "Wait for it to lie down, then follow",
        note: "slower · surer",
        check: { stat: "wit", skill: "hunting", odds: 0.7 },
        then: [{ type: "minutes", n: 150 }, { type: "item", item: "meat", n: 3 }, { type: "item", item: "hide", n: 1 }],
        line: "You sat still a long while, then tracked it to where it had lain down.",
        otherwise: [{ type: "minutes", n: 150 }],
        otherwiseLine: "By the time you followed, the trail had gone cold.",
      },
      {
        label: "Let it go and keep hunting",
        note: "no time lost",
        then: [{ type: "fatigue", n: 2 }],
        line: "You let the hurt animal go and kept hunting.",
      },
    ],
  },
  {
    id: "hunting-dangerous-animal",
    slot: "hunt-2",
    work,
    hunting: {},
    evidence: "inferred",
    text: "There is {danger} in the brush ahead, between you and the trail. It has seen you.",
    choices: [
      {
        label: "Back away slowly",
        note: "safe · time lost",
        then: [{ type: "minutes", n: 40 }],
        line: "You backed off slowly and went the long way round.",
      },
      {
        label: "Make yourself big and shout",
        note: "it may turn · it may not",
        check: { stat: "wit", odds: 0.6 },
        then: [{ type: "minutes", n: 10 }],
        line: "You shouted and waved, and it turned and crashed away.",
        otherwise: [{ type: "hurt", n: 12, cause: "a wild animal", injury: "a deep gash" }],
        otherwiseLine: "It charged anyway. You got clear with a deep gash.",
      },
      {
        label: "Stand your ground with {weapon}",
        note: "meat and a hide if it works · you could be badly hurt",
        check: { stat: "strength", skill: "hunting", odds: 0.4 },
        then: [{ type: "fatigue", n: 10 }, { type: "item", item: "meat", n: 4 }, { type: "item", item: "hide", n: 1 }],
        line: "It came at you and you brought it down. People will talk about it.",
        otherwise: [{ type: "hurt", n: 30, cause: "a wild animal", injury: "a bad mauling" }],
        otherwiseLine: "It knocked you down and mauled you before it ran off.",
      },
    ],
  },
  {
    id: "hunting-keeper",
    slot: "hunt-3",
    work,
    hunting: { owed: true, kill: true },
    who: "official",
    as: "the keeper of the game",
    // Forest law, the game laws and chiefs' rights to a share of a kill.
    evidence: "documented",
    text: "On the way home {name}, who keeps the game for {lord}, stops you and looks at what you're carrying. \"Where did you take that?\"",
    choices: [
      {
        label: "Hand over {lord}'s share",
        note: "less meat · no trouble",
        then: [{ type: "item", item: "meat", n: -2 }, { type: "regard", delta: 1 }],
        line: "You handed over a haunch, and {name} let you go on.",
      },
      {
        label: "Say you took it on common ground",
        note: "keep it all if you're believed",
        check: { stat: "wit", odds: 0.45 },
        then: [{ type: "regard", delta: -1 }],
        line: "{Name} looked hard at you, then waved you on.",
        otherwise: [{ type: "item", item: "meat", n: -3 }, { type: "regard", delta: -2 }, { type: "pay", delta: -1 }],
        otherwiseLine: "Nobody believed you. They took most of the meat, and you will be fined.",
      },
      {
        label: "Offer a coin to look the other way",
        note: "costs you · keeps the meat",
        then: [{ type: "item", item: "coin", n: -1 }],
        line: "A coin changed hands, and nobody saw anything.",
      },
    ],
  },
  {
    id: "hunting-sharing-the-kill",
    slot: "hunt-3",
    work,
    hunting: { sold: false, kill: true },
    who: "neighbour",
    as: "a neighbour",
    // Kalahari hunters let another hand out the meat of their arrows, and a
    // successful hunter was expected to make light of the kill.
    evidence: "documented",
    text: "Word has gone round that you made a kill. {Name} and the others come over while you are still cutting it up.",
    choices: [
      {
        label: "Share it out evenly, yourself last",
        note: "everyone eats · they'll remember",
        then: [{ type: "item", item: "meat", n: -2 }, { type: "regard", delta: 3 }],
        line: "You shared it round and kept no more than anyone else. Everyone ate well tonight.",
      },
      {
        label: "Let {name} do the sharing",
        note: "less for you · nobody can call you proud",
        then: [{ type: "item", item: "meat", n: -3 }, { type: "regard", delta: 2 }],
        line: "You let {name} hand out the meat, so nobody could say you were showing off.",
      },
      {
        label: "Keep most of it for your own household",
        note: "more meat at home · talk behind your back",
        then: [{ type: "regard", delta: -3 }],
        line: "You kept the best of it for your own. People noticed.",
      },
    ],
  },
];
