import type { ChoiceCard } from "./types";

// The dangers of particular work, met as a choice rather than a silent roll:
// the water, the height, the rock face. Drowning, falls and crushing were the
// commonest deaths at work wherever records were kept.
export const HAZARD_CARDS: ChoiceCard[] = [
  {
    id: "hazard-oven-burn",
    slot: "bake-oven",
    hazards: 2,
    evidence: "inferred",
    text: "The loaf catches as you try to draw it out. You could reach in to free it while the oven is still hot.",
    choices: [
      {
        label: "Reach in and free the loaf",
        note: "keep the next batch on time · risk a burn",
        check: { stat: "agility", skill: "crafting", odds: 0.55 },
        then: [{ type: "day", delta: 1 }],
        line: "You freed the loaf and got your hand out in time.",
        otherwise: [{ type: "hurt", n: 12, cause: "a burn at the oven", injury: "burned hand" }],
        otherwiseLine: "Your hand brushed the hot oven as the loaf came free.",
      },
      {
        label: "Let it cool first",
        note: "safe · the next batch will be late",
        then: [{ type: "minutes", n: 30 }, { type: "day", delta: -1 }],
        line: "You let the oven cool enough to free the loaf.",
      },
    ],
  },
  {
    id: "hazard-tool-slip",
    slot: "wood-knot",
    hazards: 2,
    evidence: "inferred",
    text: "The piece shifts under your tool. You can keep working if you hold it firmly with your other hand.",
    choices: [
      {
        label: "Hold it steady and keep working",
        note: "get more done · risk a cut",
        check: { stat: "agility", skill: "woodcraft", odds: 0.55 },
        then: [{ type: "day", delta: 1 }],
        line: "You held the piece steady and finished the job.",
        otherwise: [{ type: "hurt", n: 10, cause: "a slipping tool", injury: "cut palm" }],
        otherwiseLine: "The piece shifted again and the tool cut your palm.",
      },
      {
        label: "Stop and brace the piece",
        note: "safe · takes fifteen minutes",
        then: [{ type: "minutes", n: 15 }],
        line: "You took the time to brace the piece before finishing the job.",
      },
    ],
  },
  {
    id: "hazard-pen-crush",
    slot: "herd-home",
    hazards: 2,
    evidence: "inferred",
    text: "The {herd} bunch up at the pen entrance. If you stand in the gap, you could get them through before they scatter.",
    choices: [
      {
        label: "Stand in the gap and guide them through",
        note: "pen them quickly · risk getting knocked down",
        check: { stat: "strength", skill: "animals", odds: 0.55 },
        then: [{ type: "day", delta: 1 }],
        line: "You held your ground and got the {herd} through.",
        otherwise: [{ type: "hurt", n: 16, cause: "a crush at the pen", injury: "bruised ribs" }],
        otherwiseLine: "The {herd} knocked you into the side of the pen as they crowded through.",
      },
      {
        label: "Stand back and let them settle",
        note: "safe · takes twenty minutes",
        then: [{ type: "minutes", n: 20 }],
        line: "You stood back until the {herd} settled and went in.",
      },
    ],
  },
  {
    id: "hazard-field-slip",
    slot: "farm-weed",
    hazards: 2,
    evidence: "inferred",
    text: "The ground between the rows gives way under your feet. The far rows still need weeding.",
    choices: [
      {
        label: "Step across and finish the far rows",
        note: "get more done · risk a fall",
        check: { stat: "agility", skill: "farming", odds: 0.55 },
        then: [{ type: "day", delta: 1 }],
        line: "You found your footing and finished the far rows.",
        otherwise: [{ type: "hurt", n: 10, cause: "a fall in the field", injury: "twisted ankle" }],
        otherwiseLine: "Your foot slipped into a rut and your ankle turned under you.",
      },
      {
        label: "Walk around to the far side",
        note: "safe · takes twenty minutes",
        then: [{ type: "minutes", n: 20 }],
        line: "You went around the field and worked back from the far edge.",
      },
    ],
  },
  {
    id: "hazard-swamped",
    slot: "gather-2",
    work: ["Working the water", "Working near water"],
    text: "The wind picks up, the water gets rough, and waves are coming over the side. If the boat fills, it will sink.",
    evidence: "inferred",
    choices: [
      {
        label: "Bail it out and keep working",
        note: "a full catch if it calms · you could drown",
        check: { stat: "endurance", skill: "foraging", odds: 0.75 },
        then: [{ type: "day", delta: 1 }],
        line: "You bailed the boat out and kept working, and the wind dropped.",
        otherwise: [{ type: "hurt", n: 100, cause: "drowning" }],
        otherwiseLine: "The boat filled and went over.",
      },
      {
        label: "Head back to shore",
        note: "safe · lose half the catch",
        then: [{ type: "day", delta: -1 }, { type: "minutes", n: 60 }],
        line: "You headed back to shore with half a catch.",
      },
    ],
  },
  {
    id: "hazard-fall",
    slot: "transform-2",
    work: ["Building", "Working the roof"],
    text: "The scaffolding pole you are standing on slips under your weight. The rope holding it has worked loose.",
    evidence: "inferred",
    choices: [
      {
        label: "Grab the wall and hold on",
        note: "you'll probably manage · if not, a bad fall",
        check: { stat: "agility", odds: 0.8 },
        then: [{ type: "fatigue", n: 10 }],
        line: "You grabbed the wall and held on until someone tied the pole tight again.",
        otherwise: [{ type: "hurt", n: 70, cause: "a fall", injury: "broken bones" }],
        otherwiseLine: "You fell.",
      },
      {
        label: "Climb down and tie it again",
        note: "safe · loses most of an hour",
        then: [{ type: "minutes", n: 45 }, { type: "day", delta: -1 }],
        line: "You climbed down and tied the pole again before going back up.",
      },
    ],
  },
  {
    id: "hazard-rockfall",
    slot: "gather-2",
    work: ["Working stone"],
    text: "Small stones are trickling down the rock face above where you are cutting. That often means a bigger piece is about to come loose.",
    evidence: "inferred",
    choices: [
      {
        label: "Finish cutting the block first",
        note: "saves the day's work · the rock may fall on you",
        check: { stat: "agility", skill: "stonework", odds: 0.7 },
        then: [{ type: "day", delta: 1 }],
        line: "You got the block out before the rock came down.",
        otherwise: [{ type: "hurt", n: 60, cause: "a fall of rock", injury: "a crushed leg" }],
        otherwiseLine: "The rock face came down on you.",
      },
      {
        label: "Move away and wait",
        note: "safe · lose an hour",
        then: [{ type: "minutes", n: 60 }],
        line: "You moved away, and part of the rock face came down where you had been.",
      },
    ],
  },
  // Everyday risks, in any family's day: the water and the company.
  ...(["tend-2", "gather-3", "transform-2", "carry-2", "serve-2"] as const).flatMap((slot): ChoiceCard[] => [
    {
      id: `risk-ditch-${slot}`,
      slot,
      when: "hot",
      text: "It’s hot and you’re thirsty. The only water nearby is in the ditch, and ditch water often gives people diarrhoea.",
      evidence: "inferred",
      choices: [
        { label: "Drink from the ditch", note: "refreshing · you might get sick", then: [{ type: "fatigue", n: -10 }, { type: "risk", ailment: "flux", odds: 0.15 }], line: "You drank from the ditch." },
        { label: "Wait until the work is done", note: "no risk · tiring in this heat", then: [{ type: "fatigue", n: 15 }], line: "You went thirsty until the work was done." },
        { label: "Walk to the well", note: "clean water · half an hour lost", then: [{ type: "minutes", n: 30 }], line: "You walked to the well for clean water." },
      ],
    },
    {
      id: `risk-cough-${slot}`,
      slot,
      who: "neighbour",
      text: "{Name} has a bad cough and wants to sit close and chat. Coughs spread easily.",
      evidence: "inferred",
      choices: [
        { label: "Sit and chat", note: "{name} will appreciate it · you might catch it", then: [{ type: "minutes", n: 20 }, { type: "regard", delta: 1 }, { type: "risk", ailment: "cough", odds: 0.2 }], line: "You sat with {name} and talked a while." },
        { label: "Keep your distance", note: "no risk · {name} may be offended", then: [{ type: "regard", delta: -1 }], line: "You kept your distance from {name}, who noticed." },
      ],
    },
  ]),
];

export const FORD_CARD: ChoiceCard = {
  id: "river-ford",
  slot: "river-ford",
  evidence: "inferred",
  text: "The river deepens here. The current is strong enough to knock you off your feet.",
  choices: [
    {
      label: "Step into the current",
      note: "endurance and wayfaring help · a fall costs one heart",
      check: { stat: "endurance", skill: "wayfaring", odds: 0.6 },
      then: [{ type: "fatigue", n: 5 }],
      line: "You braced against the current and kept your footing.",
      otherwise: [{ type: "hurt", n: 20, cause: "a fall in the river", injury: "bruised knee" }, { type: "fatigue", n: 12 }],
      otherwiseLine: "The current knocked you down and you struck your knee on the riverbed.",
    },
    {
      label: "Stay back",
      note: "look for shallower water or a bridge",
      then: [],
      line: "You stayed back from the current.",
    },
  ],
};

export const ROADSIDE_CARDS: ChoiceCard[] = [{
  id: "roadside-robbery", slot: "roadside", evidence: "inferred",
  text: "Two people step into your path and demand your valuables. One keeps a hand on a weapon. There is still room to run, but they are watching you.",
  choices: [
    { label: "Give them two coins", note: "lose two coins · avoid a fight", then: [{ type: "item", item: "coin", n: -2 }, { type: "minutes", n: 5 }], line: "You handed over two coins, and they let you pass." },
    { label: "Give them your most valuable possession", note: "lose one carried item · avoid a fight", then: [{ type: "forfeit" }, { type: "minutes", n: 5 }], line: "You gave up a possession and were allowed to go." },
    { label: "Run for it", note: "easier when fed and rested · a beating if caught", check: { stat: "agility", skill: "wayfaring", odds: 0.6 }, then: [{ type: "minutes", n: 10 }, { type: "fatigue", n: 12 }], line: "You got away from the robbers.", otherwise: [{ type: "forfeit" }, { type: "hurt", n: 18, cause: "a roadside assault", injury: "bruised ribs" }, { type: "minutes", n: 20 }], otherwiseLine: "They caught you, beat you, and took something before leaving." },
    { label: "Fight back", note: "dangerous · your strength and injuries matter", check: { stat: "strength", skill: "arms", odds: 0.35 }, then: [{ type: "minutes", n: 10 }, { type: "fatigue", n: 15 }], line: "You fought hard enough to drive them off.", otherwise: [{ type: "forfeit" }, { type: "hurt", n: 30, cause: "a roadside assault", injury: "injured shoulder" }, { type: "minutes", n: 30 }], otherwiseLine: "They overwhelmed you and left you hurt beside the route." },
  ],
}];
