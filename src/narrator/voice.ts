import type { Actor } from "../core/types";
import type { statsOf } from "../core/stats";
import { random } from "../core/random";

type Stats = ReturnType<typeof statsOf>;
type Trait = "openness" | "conscientiousness" | "extraversion" | "agreeableness" | "neuroticism";
type Register = { say: string; lean: Partial<Record<Trait, 1 | -1>>; lines: string[] };

// A cheap model gives the likeliest answer, so the spread between people is
// rolled here and handed over in words; trait scores alone all came out as one voice.
const REGISTERS: Register[] = [
  { say: "Blunt: says the plain thing with no softening and no small talk.", lean: { agreeableness: -1 }, lines: [
    'Asked how the work goes: "Badly."',
    'Asked if they like it here: "No. Nobody does. They just stay."',
    'Told their work is good: "It\'s crooked. Look at it."',
  ] },
  { say: "Crude: swears easily, jokes about bodies, laughs at their own remarks.", lean: { conscientiousness: -1, extraversion: 1 }, lines: [
    'Asked about a neighbour: "Him? Couldn\'t find his own arse with both hands."',
    'Asked how they slept: "Like shit. The baby, the dog, then the baby again."',
    'Asked the way: "Follow the smell of piss, then left."',
  ] },
  { say: "Devout: takes their faith (see \"Holds\") seriously. It shows when something serious comes up, such as a death, luck or a wrong, and not in small talk.", lean: { conscientiousness: 1, openness: -1 }, lines: [
    'Asked about the harvest: "Not for me to say. We did what was owed. Now we wait."',
    'Asked about a dead brother: "He was taken for a reason. I\'ve stopped asking what."',
    'Asked their plans: "If I\'m spared, the same as today."',
  ] },
  { say: "Literal-minded: answers exactly what was asked and misses hints and jokes.", lean: { openness: -1 }, lines: [
    'Asked "How\'s life?": "Which part?"',
    'Asked if they have a moment: "Yes."',
    'Asked what\'s new: "The bucket. The old one split."',
  ] },
  { say: "Boastful: the best at whatever is being discussed, and wants it known.", lean: { extraversion: 1, agreeableness: -1 }, lines: [
    'Asked about their work: "Best on this street. Ask anyone. Don\'t ask her, she\'s jealous."',
    'Asked about a rival: "He\'s fine. For someone who learned late."',
    'Asked who they are: "You haven\'t heard of me? You will."',
  ] },
  { say: "Guarded: gives little away, answers a question with a question, changes the subject.", lean: { extraversion: -1, neuroticism: 1 }, lines: [
    'Asked where they live: "Around. Why?"',
    'Asked about family: "They\'re well enough. Looks like rain, doesn\'t it."',
    'Asked what they are carrying: "Things. Who\'s asking?"',
  ] },
  { say: "A gossip: every subject leads to what somebody else has been up to.", lean: { extraversion: 1, conscientiousness: -1 }, lines: [
    'Asked the way: "Past the house with the new door. Don\'t ask how they paid for the door."',
    'Asked how they are: "Fine, fine. Did you hear about the two brothers? Not speaking. Over a ladder."',
    'Asked about a neighbour: "I shouldn\'t say. But she was seen. Twice."',
  ] },
  { say: "Dry: understates, deadpan, amused by other people's fuss.", lean: { neuroticism: -1, openness: 1 }, lines: [
    'Asked about the storm: "We lost the roof. Otherwise a quiet night."',
    'Asked about a husband: "He has many ideas. One of them worked once."',
    'Asked if they are busy: "No, I stand here holding this for the pleasure of it."',
  ] },
  { say: "A worrier: expects the worst and circles back to what might go wrong.", lean: { neuroticism: 1 }, lines: [
    'Asked how they are: "My chest again. And the roof won\'t last the winter. Do I look pale to you?"',
    'Asked about a son: "He\'s late. He\'s never late. Well, he\'s often late, but not like this."',
    'Asked about the weather: "Too warm. That\'s never good, this early."',
  ] },
  { say: "Sunny: easily pleased, quick to laugh, finds the good side, a bit much.", lean: { agreeableness: 1, neuroticism: -1 }, lines: [
    'Asked how they are: "Oh, can\'t complain! Well, I can, but look at that sky."',
    'Asked about the leaking roof: "It only drips on his side. So."',
    'Asked about the long walk: "My feet hate me. But I saw a fox! Right there, bold as anything."',
  ] },
  { say: "Vague and dreamy: half elsewhere, trails off, notices odd small things.", lean: { conscientiousness: -1, openness: 1 }, lines: [
    'Asked the way: "The way to... oh. Yes. Down there, I think. A bird nests in that wall, have you seen it?"',
    'Asked what they are doing: "I was going to... it\'ll come back to me."',
    'Asked the time: "The light\'s gone that yellow colour. So, late."',
  ] },
  { say: "Proper: correct and a little stiff, minds rank and manners, dislikes loose talk.", lean: { conscientiousness: 1, extraversion: -1 }, lines: [
    'Asked about a neighbour\'s quarrel: "That\'s their business, and I\'d thank you to leave it there."',
    'Asked how they are: "Well, thank you. And your family?"',
    'Asked something personal: "We don\'t know each other well enough for that."',
  ] },
  { say: "A grumbler: everything is too dear, too late or badly made, and they enjoy saying so.", lean: { agreeableness: -1, neuroticism: 1 }, lines: [
    'Asked about the bread: "Half air. And they want more for it than last year."',
    'Asked about the young: "Can\'t lift, won\'t listen. I carried twice this at their age."',
    'Asked how the day is: "Long. And my knee hurts."',
  ] },
  { say: "A tease: pokes fun at whoever is in front of them, kindly or not.", lean: { extraversion: 1, openness: 1 }, lines: [
    'Asked the way: "You\'re lost? In a place with one road?"',
    'Asked their name: "Guess. No. No. You\'re bad at this."',
    'Seeing a fine coat: "Nice coat. Did the last owner die in it?"',
  ] },
];

const CHILD_LINES = [
  'Asked what she is doing: "Water. Mum says if I spill it again I\'m carrying two. Why are your shoes like that?"',
  'Asked how old he is: "Seven. Nearly eight. My brother says six but he\'s a liar."',
  'Asked about the dog: "He bit a man once. Do you want to see where?"',
  'Asked what is in her hand: "A tooth. It\'s not mine."',
];
const OLD_LINES = [
  'Asked his name: "Ennu. My father was Ennu too. Nobody asks anymore."',
  'Asked the way: "There used to be a bridge. Before your time. You go round now, like everybody."',
  'Asked how she is: "Still here. They keep checking."',
  'Looking at the player: "You remind me of someone. He\'s dead, so don\'t take it badly."',
];

const HABITS = [
  "trails off and leaves sentences unfinished",
  "repeats the last words of what was just said before answering",
  "leans on filler: \"well\", \"you know\", \"anyway\"",
  "talks to the animal or the tool in hand as much as to the person",
  "laughs before getting to the funny part",
  "swears under their breath",
  "says \"we\" for \"I\", meaning the household",
  "starts answers with \"Look,\" or \"Listen,\"",
  "never uses a name: \"him\", \"her up the road\", \"that one\"",
  "compares things to food",
  "corrects themselves halfway through a sentence",
  "says \"eh?\" and makes people repeat themselves",
  "sighs before answering",
  "ends statements as questions: \"isn't it?\", \"don't they?\"",
  "gives exact numbers for everything: how many, how far, how long",
];

const PERSONAL = [
  "answers them truthfully and flatly, as if asked the price of eggs",
  "dodges them with a joke",
  "takes them as prying and says so",
  "goes shy and changes the subject",
  "says more than they meant to, then looks sorry they did",
  "answers, then asks the same thing straight back",
  "lies easily, with something duller than the truth",
  "likes being asked and settles in to tell it properly",
];

const DREAMS = [
  "their teeth crumbling and falling out",
  "being chased, and their legs not working",
  "falling from a height and waking with a jolt",
  "standing naked in the middle of a crowd",
  "finding a room in their house they never knew was there",
  "water rising over the floor",
  "their work going wrong, the same mistake again and again",
  "someone they want and should not",
  "flying low over the roofs",
  "a child or animal in their care, lost and not found",
  "being young again in the house they grew up in",
  "a snake, always the same one",
  "fire",
  "nothing they can remember; they sleep like a stone and say so",
  "one dream, years ago, that they took for a sign and still turn over",
];
const CHILD_DREAMS = ["something under the bedding", "falling", "being able to fly", "a big dog chasing them", "their mother gone and the house empty", "finding something wonderful and waking before they can keep it", "an animal that talks"];

const FEARS = ["drowning; cannot swim and keeps clear of deep water", "fire in the night", "dying alone", "dogs", "snakes", "the dark beyond the last houses", "going hungry again, as they once did", "sickness coming into the house", "losing the use of their hands or eyes and being unable to work", "being talked about", "thunder", "owing money", "the dead not staying where they were put", "outliving their children", "being found out as worse at their work than people think"];
const CHILD_FEARS = ["the dark", "one particular older child", "thunder", "a neighbour's dog", "being left behind", "the dead"];

const VANITIES = ["their hair", "their singing voice", "their memory: never forgets a face or a debt", "their strength", "the neatness of their handiwork", "being the one people come to for advice", "their cooking", "how far they once travelled", "their teeth, all still there", "telling a story well", "holding their drink", "knowing the weather before it comes", "driving a hard bargain", "their looks when they were young"];
const CHILD_VANITIES = ["running fastest", "being able to whistle", "a scar", "knowing a secret place", "being trusted with a grown-up's job"];

const SILENCES = ["a quarrel with a brother or sister that was never mended", "something they did when they were young", "money they owe", "why they left the place they came from", "who they wanted to marry instead", "a time they were shamed in front of everyone", "what they once saw happen to someone", "their father", "their health", "a promise they broke", "nothing; there is no subject they will not talk about"];
const CHILD_SILENCES = ["who really broke it", "why they were crying earlier", "where they go when they are meant to be working"];

const BREAKFASTS = [
  "nothing yet, and feeling it",
  "last night's leftovers, cold",
  "the same plain thing as every morning, and sick of it",
  "the usual, and content with it",
  "something better than usual that a neighbour or relative gave them",
  "a few mouthfuls, standing up, in a hurry",
  "little, having given most of theirs to someone else in the house",
  "something that is not sitting well",
  "too much, and sleepy for it",
  "only a drink",
];

const ANIMALS = ["dogs", "crows", "frogs", "spiders", "fish", "small birds"];

/** The voice, private life and two sample lines that set one person apart from the next. */
export function voiceBrief(seed: string, actor: Actor, stats: Stats, localAnimals: string[]) {
  const roll = (key: string) => random(seed, "voice", actor.id, key);
  const pick = <T>(list: T[], key: string) => list[Math.floor(roll(key) * list.length)];
  const age = actor.age ?? 30;
  const child = age < 13;

  let register = REGISTERS[0], best = -Infinity;
  REGISTERS.forEach((candidate, i) => {
    const score = Object.entries(candidate.lean).reduce((sum, [trait, way]) => sum + way * (stats[trait as Trait] - 50), 0) + roll(`register-${i}`) * 70;
    if (score > best) [register, best] = [candidate, score];
  });

  const talk = stats.extraversion + (roll("length") - 0.5) * 50;
  const length = talk < 40 ? "Says very little: a word or a few, rarely a whole sentence."
    : talk < 75 ? "Short and plain: one short sentence, now and then two."
    : talk < 92 ? "Talks easily: up to two sentences, three when they get going."
    : "A talker: can run on for three or four sentences and drift off the point.";
  const habit = roll("has-habit") < 0.7 ? ` Habit: ${pick(HABITS, "habit")}.` : "";

  const orphan = !actor.relations?.some((r) => r.kind === "parent");
  const mourned = child
    ? ["a baby brother", "a baby sister", "a grandmother", "a grandfather", "a friend their own age"]
    : ["a younger brother", "a younger sister", "an older brother", "an older sister", "a grandmother who half raised them", "a close friend",
        ...(orphan && age >= 20 ? ["their mother", "their father"] : []),
        ...(age >= 30 ? ["a baby of their own", "a first husband or wife"] : [])];
  const lost = roll("has-lost") < (child ? 0.45 : 0.2) ? undefined
    : `${pick(mourned, "lost")}, ${pick(["of an illness", "in an accident", "drowned", "suddenly, nobody knew why", "after a long sickness"], "lost-how")}, ${pick(child ? ["last year", "a while ago"] : ["last year, and it is still raw", "two years ago", "a few years ago", "when they were small", "long ago"], "lost-when")}`;
  const person = lost?.split(",")[0];
  const dreams = [...(child ? CHILD_DREAMS : DREAMS), ...(person ? [`${person} standing in the doorway, not speaking`, `${person} alive again, acting as if nothing happened`] : [])];

  const lines = [pick(register.lines, "line"), child ? pick(CHILD_LINES, "age-line") : age >= 60 ? pick(OLD_LINES, "age-line") : register.lines[(register.lines.indexOf(pick(register.lines, "line")) + 1) % register.lines.length]];
  return [
    `What makes ${actor.name} this person and not another. It outweighs sounding helpful.`,
    `Voice: ${register.say} ${length}${habit}`,
    `Personal questions: ${pick(PERSONAL, "personal")}.`,
    "Private, true, and known only to them:",
    lost ? `- Lost: ${lost}.` : "",
    `- Dreams of: ${pick(dreams, "dream")}. What they think dreams are follows their "Holds".`,
    `- Afraid of: ${pick(child ? CHILD_FEARS : FEARS, "fear")}.`,
    `- Quietly vain about: ${pick(child ? CHILD_VANITIES : VANITIES, "vanity")}.`,
    `- Will not talk about: ${pick(child ? CHILD_SILENCES : SILENCES, "silence")}.`,
    `- This morning ate: ${pick(BREAKFASTS, "breakfast")} (the food itself is whatever is ordinary for them here).`,
    `- Soft spot for: ${pick(localAnimals.length ? localAnimals : ANIMALS, "animal")}.`,
    "These are notes, not wording: never repeat their phrases, never list them, and never bring one up unasked. When the talk touches one, answer from it in this person's own ordinary words, or refuse or lie as \"Personal questions\" says.",
    `How they sound (manner only; never reuse these words or things):\n- ${lines.join("\n- ")}`,
  ].filter(Boolean).join("\n");
}
