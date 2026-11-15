import type { ChoiceCard } from "./types";

const ANDES = [-82, -35, -62, 2] as const;

/** A miner's shift: going down, the face, and coming out. A wrong call at
 * the face can bring the roof in or the water through, there and then. */
export const MINE_CARDS: ChoiceCard[] = [
  {
    id: "mine-ladders",
    slot: "mine-down",
    who: "boss",
    mine: ["coal"],
    evidence: "inferred",
    text: "“Cage is full,” says the {boss}. “Next one's half an hour.” There is always the ladder road: hundreds of feet of wet rungs and narrow landings.",
    choices: [
      { label: "Wait for the cage", note: "late to the face", then: [{ type: "minutes", n: 30 }, { type: "day", delta: -1 }], line: "You waited half an hour for the cage." },
      {
        label: "Take the ladders",
        note: "tiring · a wet rung is a long fall",
        check: { stat: "endurance", odds: 0.65 },
        then: [{ type: "fatigue", n: 12 }],
        line: "You went down by the ladder road.",
        otherwise: [{ type: "fatigue", n: 12 }, { type: "hurt", n: 12, cause: "a slip on the ladders", injury: "sprained ankle" }],
        otherwiseLine: "Your foot slipped on a wet rung, and you hit the next landing hard.",
      },
    ],
  },
  {
    // The Mines Act of 1842 kept boys under ten from working underground.
    id: "mine-trapper",
    slot: "mine-down",
    scope: { years: [1750, 1843] },
    mine: ["coal"],
    evidence: "documented",
    text: "A boy of about eight starts today as a trapper. He will sit alone in the dark for twelve hours, opening an air door whenever the tubs come through. His mother asks if you will see him to his door.",
    choices: [
      { label: "Walk him to his door", note: "a little time", then: [{ type: "minutes", n: 20 }], line: "You walked the new trapper boy to his door and showed him how to wedge it open." },
      { label: "Leave him to the deputy", then: [], line: "You left the new trapper boy to the deputy." },
    ],
  },
  {
    // A mitayo could pay silver to be let off a turn; many did, and went into debt for it.
    id: "mine-mita",
    slot: "mine-down",
    scope: { years: [1573, 1813], bounds: ANDES },
    evidence: "documented",
    text: "This week is your turn of the mita, the forced labour the Crown takes from your village. The ore you break belongs to the Crown and the mine's owner, and your pay barely covers your food.",
    choices: [
      {
        label: "Work hard and get the turn over",
        note: "exhausting",
        check: { stat: "endurance", odds: 0.55 },
        then: [{ type: "day", delta: 1 }, { type: "fatigue", n: 15 }],
        line: "You worked your mita turn as hard as you could.",
        otherwise: [{ type: "fatigue", n: 25 }, { type: "hurt", n: 8, cause: "exhaustion" }],
        otherwiseLine: "You pushed too hard on your mita turn and collapsed on the ladders.",
      },
      { label: "Pay silver to be let off next week's turn", note: "costs coin", then: [{ type: "item", item: "coin", n: -3 }], line: "You paid the owner silver to be let off your next mita turn." },
      { label: "Chew coca for the work", note: "uses coca", then: [{ type: "item", item: "coca", n: -1 }, { type: "fatigue", n: -10 }], line: "You chewed coca, and the cold and hunger went far away." },
    ],
  },
  {
    // A hole in the gauze let the flame through to the gas: the reason lamps were locked and checked.
    id: "mine-gauze",
    slot: "mine-down",
    scope: { years: [1816, 1930] },
    mine: ["coal"],
    evidence: "documented",
    text: "At the lamp cabin, the lampman hands you a safety lamp with a dented gauze. A split in the gauze would let the flame through to the gas.",
    choices: [
      { label: "Send it back and wait for another", note: "a little time", then: [{ type: "minutes", n: 15 }], line: "You sent back a lamp with a damaged gauze." },
      {
        label: "Take it, you're late already",
        note: "the gauze might hold",
        check: { stat: "wit", odds: 0.7 },
        then: [],
        line: "You took a lamp with a dented gauze, and nothing came of it.",
        otherwise: [{ type: "peril", kind: "afterdamp" }],
        otherwiseLine: "Later, a lamp with a damaged gauze fired the gas in the workings.",
      },
    ],
  },
  {
    id: "mine-roof-talking",
    slot: "mine-face",
    evidence: "inferred",
    text: "The roof over your place starts to tick and crack. Old miners call it the roof talking. Your {tub} is half full.",
    choices: [
      { label: "Set a prop under it first", note: "safe · slower", then: [{ type: "minutes", n: 30 }, { type: "day", delta: -1 }], line: "You set a prop before you went on. The roof held." },
      {
        label: "Keep working and listen",
        note: "more {stuff} · if it goes, run",
        check: { stat: "wit", skill: "stonework", odds: 0.55 },
        then: [{ type: "day", delta: 1 }],
        line: "You kept working and listened to the roof. It settled.",
        otherwise: [{ type: "peril", kind: "fall" }],
        otherwiseLine: "You kept working, and the roof came in.",
      },
      { label: "Clear out and fetch the deputy", note: "lose time", then: [{ type: "minutes", n: 45 }, { type: "day", delta: -1 }], line: "You cleared out and fetched the deputy, who set the props himself." },
    ],
  },
  {
    // Robbing pillars on the way back out of a district paid well and killed many.
    id: "mine-pillar",
    slot: "mine-face",
    who: "boss",
    mine: ["coal"],
    evidence: "documented",
    text: "The {boss} wants you to take out the pillar of coal beside your stall. Pillar coal pays well, but the pillar is what holds the roof up.",
    choices: [
      {
        label: "Take out the pillar",
        note: "better pay · the roof may go",
        check: { stat: "wit", skill: "stonework", odds: 0.5 },
        then: [{ type: "pay", delta: 2 }],
        line: "You took the pillar out, and the roof held.",
        otherwise: [{ type: "pay", delta: 1 }, { type: "peril", kind: "fall" }],
        otherwiseLine: "You were taking out the pillar when the roof came down.",
      },
      { label: "Refuse", note: "the {boss} won't like it", then: [{ type: "regard", delta: -1 }], line: "You refused to take out the pillar." },
      { label: "Take it slowly, propping as you go", note: "a long job · some extra pay", then: [{ type: "minutes", n: 60 }, { type: "pay", delta: 1 }], line: "You took the pillar out a bit at a time, propping as you went." },
    ],
  },
  {
    // After the Heaton inrush of 1815, boring ahead near old workings became the rule.
    id: "mine-sweating",
    slot: "mine-face",
    evidence: "documented",
    text: "The face is wet and ice cold to the touch, and you can hear a faint hiss behind the {stuff}. There could be old flooded workings just beyond it.",
    choices: [
      { label: "Stop and have them bore ahead", note: "lose time · safe", then: [{ type: "minutes", n: 40 }, { type: "day", delta: -1 }], line: "You stopped and had them bore ahead. They found old flooded workings two yards in." },
      {
        label: "Work on",
        note: "keep your count · the water may come through",
        check: { stat: "wit", odds: 0.5 },
        then: [{ type: "day", delta: 1 }],
        line: "You worked on. The hiss was only the {stuff} settling.",
        otherwise: [{ type: "peril", kind: "inrush" }],
        otherwiseLine: "You broke through into old flooded workings, and the water came in.",
      },
    ],
  },
  {
    id: "mine-firedamp",
    slot: "mine-face",
    who: "boss",
    mine: ["coal"],
    scope: { years: [1816, 2100] },
    evidence: "documented",
    text: "The {boss} comes through testing for gas. He holds his lamp up near the roof, and the flame grows a tall pale-blue cap. Firedamp.",
    choices: [
      { label: "Clear out until the air is put right", note: "lose time", then: [{ type: "minutes", n: 45 }, { type: "day", delta: -1 }], line: "You cleared out until they had brattice up and the gas cleared." },
      {
        label: "Work on below the gas",
        note: "keep your count · it may fire",
        check: { stat: "wit", odds: 0.5 },
        then: [{ type: "day", delta: 1 }],
        line: "You worked on below the gas, and it never fired.",
        otherwise: [{ type: "peril", kind: "afterdamp" }],
        otherwiseLine: "Somebody's flame touched the gas further along the face.",
      },
    ],
  },
  {
    // Hand drilling, one holding and turning the steel, one or two swinging.
    id: "mine-hammer",
    slot: "mine-face",
    mine: ["metal"],
    scope: { years: [1500, 1890] },
    evidence: "documented",
    text: "Your partner is tiring, and his hammer blows on the drill steel you hold are getting wild. One miss and it's your hand.",
    choices: [
      {
        label: "Swap, and you swing",
        note: "hard work",
        check: { stat: "strength", odds: 0.6 },
        then: [{ type: "day", delta: 1 }, { type: "fatigue", n: 10 }],
        line: "You took the hammer and he held, and the hole went in fast.",
        otherwise: [{ type: "day", delta: -1 }, { type: "fatigue", n: 10 }],
        otherwiseLine: "You took the hammer, but your blows went wild too.",
      },
      { label: "Stop for a rest", note: "lose time", then: [{ type: "minutes", n: 20 }], line: "You both stopped for a rest." },
      {
        label: "Keep holding",
        check: { stat: "agility", odds: 0.6 },
        then: [],
        line: "He kept on, and you kept your hand.",
        otherwise: [{ type: "hurt", n: 10, cause: "a hammer blow", injury: "crushed hand" }],
        otherwiseLine: "His hammer came down on your hand.",
      },
    ],
  },
  {
    // The miners of Wieliczka carved their chapels out of the rock salt in their own time.
    id: "mine-salt-saint",
    slot: "mine-face",
    mine: ["salt"],
    evidence: "documented",
    text: "Some of the men are carving a saint out of the salt wall in their own time, by candle. They ask if you will help.",
    choices: [
      { label: "Carve with them after the shift", note: "time · tiring", then: [{ type: "minutes", n: 60 }, { type: "fatigue", n: 10 }], line: "You stayed after the shift to help carve the saint in the salt." },
      { label: "Go home", then: [], line: "You went home and left them carving." },
    ],
  },
  {
    // Checkweighmen, paid by the men to watch the company's weighing, from the 1860 Act.
    id: "mine-weighbridge",
    slot: "mine-up",
    mine: ["coal"],
    scope: { years: [1860, 1990] },
    evidence: "documented",
    text: "At the weighbridge, the company's weighman docks two of your tubs for stone. The checkweighman, whom the men pay to watch him, says they were clean.",
    choices: [
      {
        label: "Back the checkweighman",
        note: "you might get them counted",
        check: { stat: "extraversion", odds: 0.5 },
        then: [{ type: "pay", delta: 1 }],
        line: "You stood with the checkweighman and got your tubs counted.",
        otherwise: [{ type: "pay", delta: -1 }],
        otherwiseLine: "You argued and lost, and the weighman docked the tubs anyway.",
      },
      { label: "Let it go", note: "lose the pay for them", then: [{ type: "pay", delta: -1 }], line: "You let the weighman dock two of your tubs." },
    ],
  },
  {
    id: "mine-ride-tub",
    slot: "mine-up",
    mine: ["coal", "metal"],
    scope: { years: [1800, 2100] },
    evidence: "inferred",
    text: "You're last out, and it's a long walk to the {pit}. The empty {tub}s are going back on the rope. Riding them is forbidden, and men lose legs doing it.",
    choices: [
      { label: "Walk out", note: "a long walk", then: [{ type: "minutes", n: 25 }], line: "You walked out the long way." },
      {
        label: "Ride a tub out",
        note: "quick · the rope may snap",
        check: { stat: "agility", odds: 0.6 },
        then: [],
        line: "You rode an empty tub out, and nobody saw.",
        otherwise: [{ type: "peril", kind: "tub" }],
        otherwiseLine: "The rope parted, the tubs ran loose, and you had to jump for it.",
      },
    ],
  },
  {
    id: "mine-pony",
    slot: "mine-up",
    mine: ["coal"],
    scope: { years: [1750, 1995] },
    evidence: "inferred",
    text: "The pony on your road is lame in the near foreleg, and its driver wants to keep working it to make his count.",
    choices: [
      { label: "Make him take it to the stables", note: "slower out", then: [{ type: "minutes", n: 20 }], line: "You made the driver take his lame pony back to the stables." },
      { label: "Say nothing", then: [], line: "You said nothing about the lame pony." },
    ],
  },
  {
    // Apiris carried ore up the ladders on their backs with a candle tied to the forehead.
    id: "mine-apiri",
    slot: "mine-up",
    scope: { years: [1545, 1825], bounds: ANDES },
    evidence: "documented",
    text: "Your last job is to carry a sack of ore up the ladders to the surface: a hundred pounds on your back and a candle tied to your forehead.",
    choices: [
      {
        label: "Carry a full sack",
        note: "full pay · a long climb",
        check: { stat: "endurance", odds: 0.55 },
        then: [{ type: "pay", delta: 1 }, { type: "fatigue", n: 15 }],
        line: "You carried a full sack of ore up the ladders.",
        otherwise: [{ type: "fatigue", n: 15 }, { type: "hurt", n: 14, cause: "a fall on the ladders", injury: "injured leg" }],
        otherwiseLine: "Near the top your legs gave, and you fell a full ladder's length.",
      },
      { label: "Carry half and be paid for half", note: "less pay", then: [{ type: "pay", delta: -1 }], line: "You carried half a sack up and were paid for half." },
    ],
  },
];
