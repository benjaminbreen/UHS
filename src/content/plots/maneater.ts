import { faunaAt } from "../fauna";
import { EUROPE, neighbours, partnerWords, pickOf, pronounWords, temper } from "./common";
import type { Condition, PlotContext, PlotTemplate } from "./types";

/** Who turned man-eater where they lived, likeliest first, with what people called them. */
const BEASTS: [string, string, string[]][] = [
  ["tiger", "tiger", ["the Lame Tigress", "the Old Tigress", "the Widow-maker"]],
  ["lion", "lion", ["the Ghost", "the Darkness", "the Maneless One"]],
  ["leopard", "leopard", ["the Night Leopard", "the Devil", "the Grey Cat"]],
  ["jaguar", "jaguar", ["the Night Cat", "the Black One"]],
  ["nile-crocodile", "crocodile", ["the Old One", "Big Mouth"]],
  ["saltwater-crocodile", "crocodile", ["the Old One", "Big Mouth"]],
  ["spotted-hyena", "hyena", ["the Laugher", "the Night Dog"]],
  ["gray-wolf", "wolf", ["the Beast", "Bobtail", "the Grey Wolf"]],
  ["brown-bear", "bear", ["Clubfoot", "Old Scar"]],
  ["cougar", "cougar", ["the Grey Ghost", "the Shadow"]],
];

const beastOf = (c: PlotContext) => {
  if (!c.setting || c.setting.settlement === "city" || c.setting.year >= 1960) return;
  const here = new Set(faunaAt(c.setting).map((f) => f.id));
  return BEASTS.find(([id]) => here.has(id));
};

const castOf = (c: PlotContext) => {
  const pool = neighbours(c).filter((a) => (a.age ?? 30) < 65);
  const hunter = pool.find((a) => /hunt|trapper|shikar|soldier|guard/i.test(a.role)) ?? pool[0];
  const rest = pool.filter((a) => a !== hunter);
  const neighbour = rest.length ? pickOf(c, rest, "maneater-neighbour") : undefined;
  return hunter && neighbour ? { neighbour, helper: hunter } : undefined;
};

const fired = (id: string): Condition => ({ type: "fired", id });
const not = (of: Condition): Condition => ({ type: "not", of });
const dealt: Condition = { type: "any", of: [fired("beast:slain"), fired("trap"), fired("hunt"), fired("hire"), fired("granted")] };

const ACTS = [
  { id: "watch" },
  { id: "trap", check: { stat: "wit", skill: "hunting", odds: 0.4 } },
  { id: "hunt", check: { stat: "strength", skill: "hunting", odds: 0.35 } },
  { id: "hire" },
  { id: "petition" },
  { id: "indoors" },
] as const;

/** A beast that has learned people are easy prey. The Champawat tigress was
 * said to have killed 436 in Nepal and Kumaon before Corbett shot her in 1907;
 * the Tsavo lions stopped a railway in 1898; the Beast of Gévaudan killed
 * about a hundred in 1764–67; a wolf pack called Courtaud's got into Paris in 1450. */
export const maneater: PlotTemplate = {
  id: "maneater",
  shape: "world",
  look: {
    emblem: "shadow",
    palette: { ink: "#0e0c0a", fill: "#2c2418", edge: "#7a5a2a", light: "#efe6d2", accent: "#c8782e" },
  },
  payee: "helper",
  weight: (c) => (beastOf(c) && castOf(c) ? 0.35 * temper(c, "neuroticism") : 0),
  cast: (c) => castOf(c),
  begin: (c, cast) => {
    const neighbour = cast.neighbour!, helper = cast.helper!;
    const [id, kind, names] = beastOf(c)!;
    const p = partnerWords(c);
    const midnight = Math.floor(c.clock / 86400) * 86400;
    const victim = pickOf(c, ["a boy minding goats", "a woman cutting grass", "an old man going for water", "a herder asleep by his animals"], "maneater-victim");
    return {
      deadline: midnight + 2 * 86400 + 20 * 3600,
      owed: 4,
      words: {
        beast: pickOf(c, names, "maneater-name"), kind, species: id, victim,
        neighbour: neighbour.name, hunter: helper.name, ...pronounWords(neighbour), ...p.words,
      },
      refs: { neighbour: neighbour.id, hunter: helper.id, ...p.refs },
    };
  },
  opening: [{ type: "card", line: "rumour", focus: "neighbour" }, { type: "loose", as: "maneater" }],
  developments: [
    { id: "first", when: { type: "since", hours: 1 }, then: [{ type: "choose", line: "first", focus: "neighbour", choices: [...ACTS] }] },
    { id: "kept", when: fired("watch"), then: [{ type: "regard", role: "neighbour", delta: 1 }, { type: "gather", at: "edge", when: "evening", label: "fires", aim: "aim-fires", scene: "smoke" }] },
    { id: "night", when: { type: "all", of: [fired("watch"), { type: "came" }] }, then: [{ type: "choose", line: "night", focus: "neighbour", choices: [{ id: "hold", check: { stat: "endurance", odds: 0.55 } }, { id: "chase", check: { stat: "agility", skill: "hunting", odds: 0.3 } }] }] },
    { id: "paid", when: fired("hire"), then: [{ type: "seize", role: "helper" }] },
    { id: "summoned", when: fired("petition"), then: [{ type: "gather", at: "authority", when: "morning", label: "petition", aim: "aim-petition", scene: "hearing" }] },
    { id: "heard", when: { type: "all", of: [fired("petition"), { type: "came" }] }, then: [{ type: "choose", line: "heard", choices: [{ id: "granted", check: { stat: "wit", odds: 0.5 } }, { id: "home" }] }] },
    { id: "dusk", when: { type: "all", of: [{ type: "since", hours: 9 }, not(dealt)] }, then: [{ type: "card", line: "dusk" }] },
    {
      id: "again",
      when: { type: "all", of: [{ type: "since", hours: 28 }, not(fired("beast:slain")), not({ type: "all", of: [fired("hunt"), not(fired("hunt:failed"))] }),
        not({ type: "all", of: [fired("trap"), not(fired("trap:failed"))] }), not(fired("hire")), not(fired("hold")), not(fired("granted"))] },
      then: [{ type: "choose", line: "again", focus: "neighbour", choices: [{ id: "hunt2", check: { stat: "strength", skill: "hunting", odds: 0.45 } }, { id: "hire" }, { id: "wait" }] }],
    },
  ],
  endings: [
    { id: "slain", when: fired("beast:slain") },
    { id: "hunted", when: { type: "any", of: [{ type: "all", of: [fired("hunt"), not(fired("hunt:failed"))] }, { type: "all", of: [fired("hunt2"), not(fired("hunt2:failed"))] }] } },
    { id: "trapped", when: { type: "all", of: [fired("trap"), not(fired("trap:failed")), { type: "since", hours: 14 }] } },
    { id: "shot", when: { type: "all", of: [fired("hire"), { type: "after", id: "hire", hours: 10 }] } },
    { id: "driven", when: { type: "any", of: [fired("hold"), fired("chase"), fired("beast:gone")] } },
    { id: "bounty", when: { type: "all", of: [fired("granted"), not(fired("granted:failed"))] } },
    { id: "mauled", when: { type: "any", of: [fired("hunt:failed"), fired("hunt2:failed"), fired("chase:failed")] } },
    { id: "spared", when: { type: "all", of: [{ type: "due" }, { type: "any", of: [fired("indoors"), fired("wait")] }] } },
    { id: "still", when: { type: "due" } },
  ],
  wording: [
    {
      // The Beast of Gévaudan, 1764–67: the king sent dragoons, then his own gun-bearer; a local man, Jean Chastel, is said to have shot it.
      scope: { years: [1000, 1900], bounds: EUROPE },
      title: "The Beast",
      lines: {
        intro: "Something has been killing people on the hillsides. The shepherds call it {beast}. Those who saw it say it is a {kind}, bigger than any they have seen, and that it goes for the throat.",
        threat: "It takes people, not sheep. Children sent out with the flocks are the easiest for it. Nobody knows where it will be next.",
        "petition:label": "Ask {authority} to send men or offer a reward",
        "heard": "{authority} listens. A bounty would bring every gun in the province here, but it costs money and someone has to ask for it properly.",
        bounty: "A bounty is posted and men with guns arrive from three towns away. After two days of beating the woods, they bring {beast} down in a ravine. Its body is carried round the villages so people can see it is dead.",
      },
    },
    {
      // Colonial India paid bounties for man-eaters; Jim Corbett was called in to Champawat (1907) and Rudraprayag (1926).
      scope: { years: [1600, 1960], bounds: [60, 5, 98, 36] },
      title: "The Man-eater",
      lines: {
        intro: "A {kind} has turned man-eater. People are calling it {beast}. It has learned that people are slow and weak, and now it hunts them instead of deer.",
        threat: "It takes people from paths, fields and doorways, mostly at dusk. Once a {kind} has done this, it doesn't stop.",
        "petition:label": "Ask {authority} to post a reward or send a hunter",
        bounty: "A reward is posted and a hunter comes, a quiet man with a good rifle. He sits up four nights over a tied goat. On the fifth he shoots {beast}, and the whole district comes to look at the body.",
      },
    },
    {
      // The Tsavo lions killed railway workers for nine months of 1898 until Colonel Patterson shot them.
      scope: { years: [1000, 1960], bounds: [-18, -35, 52, 18] },
      title: "The Man-eater",
      lines: {
        intro: "A {kind} has started taking people. They call it {beast}. It comes at night, past the thorn fences, and drags people off.",
        threat: "Thorn fences don't stop it, and fires only sometimes. Each night someone else is taken.",
      },
    },
    {
      title: "The Man-eater",
      lines: {
        aim: "Deal with {beast} before it kills again.",
        intro: "A {kind} has started killing people near here. People call it {beast}. It has stopped fearing people, and now it hunts them.",
        threat: "Once an animal learns that people are easy prey, it doesn't stop. Nobody is safe outside after dark.",
        partner: "Your {partnerKin} {partner} won't let the children past the door.",
        "kin-partner": "Don't go out after dark. I mean it.",
        "cast-neighbour": "Lost someone to {beast}, and wants it dead.",
        "cast-helper": "The best hunter around here, and will go after {beast} for pay.",
        rumour: "{neighbour} comes running. {victim} was taken just outside the village this morning. They found blood and drag marks going into the bushes. People are saying it was {beast}.",
        first: "The village is frightened. {neighbour} says someone has to do something before it comes back tonight. What do you do?",
        "watch:label": "Help keep fires and a watch tonight",
        "watch:then": "{neighbour} says to gather wood and meet at the edge of the village at dusk.",
        "trap:label": "Dig a pit and bait it",
        "trap:then": "You dig a deep pit by the path it uses, put sharpened stakes at the bottom, and tie a goat over it. Now you wait.",
        "trap:failed": "The trap is finished, but in the morning the goat is gone, the rope is chewed, and the pit is empty.",
        "hunt:label": "Go after it yourself",
        "hunt:then": "You follow the drag marks into the bushes with a spear and two others.",
        "hunt:failed": "It was waiting for you. It comes out of the grass so fast nobody gets a spear up. One of the men is badly hurt, and you barely get away.",
        "hire:label": "Pay {hunter} to hunt it down",
        "hire:then": "{hunter} takes your payment and goes off to look for tracks.",
        "petition:label": "Ask {authority} for help",
        "petition:then": "You will go to {authority} in the morning and ask.",
        petition: "Asking for help with {beast}",
        "aim-petition": "Go to {authority} {meet} and ask for help against {beast}. It's marked on your map.",
        heard: "{authority} listens. Nobody wants to spend men or money on a {kind}, but nobody wants more people killed either.",
        "granted:label": "Argue that it will keep killing until someone stops it",
        "granted:failed": "{authority} promises to do something, but nothing happens.",
        "home:label": "Go home and handle it yourselves",
        "indoors:label": "Keep your family inside and wait",
        "indoors:then": "You bar the door at dusk. Nobody in your house goes out after dark.",
        fires: "Keeping fires against {beast}",
        "aim-fires": "Go to the edge of the village {meet} with firewood to keep the fires going against {beast}. It's marked on your map.",
        night: "It's late, and the fires are burning low. Something big is moving at the edge of the light. The dogs won't stop barking.",
        "hold:label": "Keep the fires high and shout",
        "hold:failed": "You can't keep all the fires going. Near dawn, something takes a calf from the far end, and nobody sees it come or go.",
        "chase:label": "Go out with a torch after it",
        "chase:failed": "It turns on you in the dark. You hear it before you see it.",
        dusk: "Nobody is out after sunset. Doors are barred early, and nobody fetches water late. All anyone talks about is {beast}.",
        again: "It has killed again: another body, on another path. {neighbour} wants to know if you'll help this time.",
        "hunt2:label": "Go after it with the other men",
        "hunt2:failed": "You track it all day and corner it in a ravine, but it gets out past you and someone is badly hurt.",
        "wait:label": "Stay inside and wait it out",
        slain: "{beast} is dead, and you killed it. People come from all around to see the body. For years they'll talk about the day you killed it.",
        hunted: "You find {beast} lying up in thick cover and kill it there. When you bring the body back, people cheer.",
        trapped: "Before dawn there is a terrible noise from the pit. {beast} fell in going for the goat. The men finish it with spears.",
        shot: "{hunter} comes back three days later with the {kind}'s skin rolled up on a pole. It cost you, but people can go out again at night.",
        driven: "After that night, {beast} moves on. Nobody sees it again, though people in the next valley start telling stories about it.",
        bounty: "A reward is offered and hunters come from far away. Within a few days one of them kills {beast}.",
        mauled: "{beast} got away, and you were lucky to come back alive. Your arm will carry the marks for the rest of your life.",
        spared: "Your family stayed inside and lived. Others weren't so lucky. In the end {beast} moves on, and nobody knows why.",
        still: "Nothing anyone did has stopped {beast}. It's still out there, and people still bar their doors at dusk.",
      },
    },
  ],
};
