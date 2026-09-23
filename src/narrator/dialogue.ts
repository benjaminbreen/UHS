import type { Actor, WalkOff } from "../core/types";
import { describeStats, statsOf } from "../core/stats";
import { weatherAt } from "../core/weather";
import { seasonAt } from "../core/livelihood";
import { describeStanding, standingOf } from "../core/standing";
import { outlookOf } from "../core/outlook";
import { communityProfiles } from "../content/characters/profiles/communities";
import type { Runtime } from "../runtime/session";
import { wearSlots } from "../core/character";
import { parseCloth } from "../content/characters/wardrobe/cloth";
import type { Expression } from "../render/portraits/constructed";
import { faunaProfile } from "../content/fauna";
import { random } from "../core/random";

export type DialogueLine = { speaker: "npc" | "player"; text: string; original?: string; action?: string };
export type DialogueGift = {
  name: string;
  description: string;
  value: number;
  look: "rock" | "plant" | "food" | "wood" | "cloth" | "tool" | "vessel" | "creature";
};

const sexLabel = (actor: Actor) => {
  const sex = actor.origin?.sex ?? actor.appearance?.physique?.sex;
  return sex === "female" ? "Female" : sex === "male" ? "Male" : "Person";
};

/** How well turned out the player looks, by the quality of the body garment. */
const DRESS = [
  "in worn, poor clothes",
  "plainly dressed",
  "well dressed",
  "richly dressed",
  "dressed with a finery few here could afford",
];

/**
 * What the player looks like standing in front of someone: what they have on,
 * how good it is, and what is in their hand. People read this before they
 * hear a word, and a barefoot stranger holding an axe is not owed the same
 * answer as a well-dressed one holding a basket of figs.
 */
function playerPresence(runtime: Runtime) {
  const engine = runtime.engine;
  const p = engine.state.player;
  const worn = p.worn ?? {};
  const pieces = wearSlots
    .map((slot) => (worn[slot] ? engine.item(worn[slot]!)?.name : undefined))
    .filter(Boolean) as string[];
  const body = worn.body ? parseCloth(worn.body) : undefined;
  const quality = body?.cloth.quality ?? 0;
  // Shoes alone used to read as "in worn, poor clothes", so a naked stranger
  // got a shrug. No body garment is nakedness, whatever else is on.
  const dress = !pieces.length
    ? "stark naked"
    : !worn.body && !worn.over
      ? `naked but for ${pieces.slice(0, 5).join(", ")}, genitals and all on show`
      : `${DRESS[Math.max(0, Math.min(4, quality + 1))]}: ${pieces.slice(0, 5).join(", ")}`;
  const carried = p.held
    ? engine.state.objects.find((o) => o.id === p.held)
    : undefined;
  const item = p.heldItem ? engine.item(p.heldItem) : undefined;
  const held = carried?.name ?? item?.name;
  const hands = !held
    ? "Hands empty."
    : `Carrying ${held} in hand${item?.hand?.strike ? ", held as a weapon" : ""}.`;
  const sex =
    p.appearance?.physique?.sex ?? p.origin?.sex ?? "unspecified";
  const who = sex === "female" ? "A woman" : sex === "male" ? "A man" : "A person";
  return `${who}${p.age ? ` of about ${p.age}` : ""}, ${dress}. ${hands}`;
}

/**
 * How much this person owes the player in the way of conversation. Read off
 * the game's own state rather than left to the model to guess, so a stranger
 * interrupting a day's work is not as forthcoming as a friend.
 */
/** How this person takes finding the player inside their home uninvited. The
 * model ignored raw trait scores here and answered like a shopkeeper. */
function intrusionReaction(seed: string, actor: Actor, stats: ReturnType<typeof statsOf>) {
  if (actor.trust >= 3)
    return "They know and like you, so they are startled and puzzled more than afraid, but it is still strange and they say so.";
  if (stats.neuroticism >= 65)
    return stats.extraversion <= 35
      ? "They are frightened: a gasp or scream, backing away, freezing, or a thin \"Who are you? Get out!\""
      : "They are frightened and loud: they scream, shout for help or for family, or grab something to hold between you.";
  if (stats.agreeableness <= 35)
    return "They are furious: \"What the HELL are you doing in my house?\", cursing, ordering you out, maybe reaching for something heavy.";
  if (stats.agreeableness >= 65 && stats.neuroticism <= 35)
    return "They are taken aback but keep their manners: \"Oh... hello? This is my house. What are you doing in here?\"";
  const middling = [
    "They are alarmed and demand to know who you are and why you are inside.",
    "They jump, then stare: confused more than angry at first, and working out whether you are dangerous.",
    "They are indignant and want you out, but ask one sharp question first.",
    "They call out to someone else in the house before they say anything to you.",
  ];
  return middling[Math.floor(random(seed, "intrusion", actor.id) * middling.length)];
}

function openness(actor: Actor, met: boolean) {
  if ((actor.age ?? 30) < 13 && actor.trust >= 0)
    return "A child. Children are curious about strangers, say what they think, ask questions back, and wander off the subject; shyness is possible, stiff adult caution is not.";
  if (actor.trust < -1)
    return "They want nothing to do with you. Answer curtly or refuse to answer.";
  if (actor.trust < 0)
    return "They are wary of you and will give you as little as they can.";
  // Ill feeling carries across a first meeting; goodwill does not. Somebody
  // you have never spoken to is a stranger however the number reads.
  if (!met)
    return "A stranger has interrupted your work. A few words at most, unless something about them earns more.";
  if (actor.trust >= 3) return "They are glad of you and will talk freely.";
  if (actor.trust >= 1) return "They are friendly and will answer properly.";
  return "You have met, but barely. Civil and brief.";
}

// Seeded per person per day, so the same concern colours every talk that day.
const CONCERNS = {
  child: ["wants to play", "was told off this morning", "is showing off something they found", "is hungry", "is scared of a bigger child", "has a secret they want to tell", "is bored of their chore", "wonders about something they saw yesterday"],
  adult: ["is worried about money or what is owed", "is annoyed with someone in the household", "is thinking about a sick animal or relative", "has news or gossip they are itching to share", "is behind on the work and wants to finish", "is in a good mood about something small", "is fretting about the weather and the crops or trade", "has a sore back or tooth", "is waiting for someone who is late", "is planning a meal or a feast"],
  old: ["remembers how things used to be", "has aches and complains of them", "is worried about a grandchild", "has opinions about the young", "is lonely and glad of any talk"],
};

function onTheirMind(seed: string, clock: number, actor: Actor) {
  const age = actor.age ?? 30;
  const list = age < 13 ? CONCERNS.child : age >= 60 ? CONCERNS.old : CONCERNS.adult;
  const day = Math.floor(clock / 86400);
  const pick = list[Math.floor(random(seed, "dialogue-concern", actor.id, day) * list.length)];
  return [
    pick,
    actor.hunger > 60 ? "is hungry" : "",
    actor.fatigue > 70 ? "is tired" : "",
    actor.injury ? `is hurt (${actor.injury.name})` : "",
  ].filter(Boolean).join("; ");
}

function now(runtime: Runtime) {
  const { state, world } = runtime.engine;
  const setting = world.pack.setting;
  const clock = state.clock;
  const hour = Math.floor((((clock / 3600) % 24) + 24) % 24);
  const part = hour < 5 ? "night" : hour < 8 ? "early morning" : hour < 12 ? "morning" : hour < 14 ? "midday" : hour < 18 ? "afternoon" : hour < 21 ? "evening" : "night";
  const weather = weatherAt(state.manifest.seed, setting?.climate ?? "temperate", setting?.season ?? "spring", clock);
  return `${part}, ${seasonAt(setting?.season ?? "spring", clock)}, ${weather.label.toLowerCase()}, about ${Math.round(weather.tempC)}°C`;
}

/** Small, local-only context: enough to ground a voice without resending the world card. */
export function dialogueContext(runtime: Runtime, actor: Actor) {
  const engine = runtime.engine;
  const state = engine.state;
  const place = actor.pos.space !== "outside" ? engine.world.place(actor.pos.space) : undefined;
  const setting = engine.world.pack.setting;
  const household = actor.householdId
    ? state.households?.find((h) => h.id === actor.householdId)
    : undefined;
  const playerHome = state.households?.find(
    (h) => h.residence === state.player.pos.space && h.id === actor.householdId,
  );
  const homePlace = playerHome
    ? engine.world.place(playerHome.residence!)
    : undefined;
  const invited = homePlace?.owner
    ? (state.permissions[homePlace.owner] ?? 0) > state.clock
    : false;
  // A shop or inn is walked into; the player's own family's house is theirs.
  const intruding =
    !!playerHome && !invited && actor.householdId !== state.player.householdId;
  const familyPresent = playerHome?.members
    .filter((id) => id !== actor.id)
    .map((id) => state.actors.find((candidate) => candidate.id === id))
    .filter((candidate) => candidate?.pos.space === state.player.pos.space)
    .map((candidate) => candidate!.name) ?? [];
  const family = (actor.relations ?? [])
    .map((relation) => {
      const other = [state.player, ...state.actors].find((candidate) => candidate.id === relation.other);
      return other ? `${relation.kind} ${other.name}` : undefined;
    })
    .filter(Boolean);
  const stats = statsOf(state.manifest.seed, actor);
  const rude = engine.nuisance.get(actor.id);
  const temperament = describeStats(stats).filter((word) => !["frail", "strong", "clumsy", "nimble", "easily spent", "tireless"].includes(word));
  const possessions = Object.entries(actor.inventory)
    .filter(([, quantity]) => (quantity ?? 0) > 0)
    .slice(0, 4)
    .map(([id, quantity]) => `${engine.item(id)?.name ?? id} x${quantity}`);
  const location = place?.name ?? setting?.location ?? engine.world.terrain(actor.pos.x, actor.pos.y);
  // The community this person was actually drawn from. Without it two people
  // on the same street in 1790s Knoxville got identical prompts but for a name.
  const community = communityProfiles
    .find((profile) => profile.id === actor.origin?.profile)
    ?.label.split(",")[0];
  // The role is already on the line above; the drawn livelihood label often
  // disagrees with it, and sending both just contradicts the prompt.
  const standing = standingOf(state.manifest.seed, actor);
  const background = [
    community ?? "local to this place",
    standing
      ? describeStanding(standing)
      : actor.origin?.standing === "unfree"
        ? "held in bondage"
        : undefined,
  ].filter(Boolean);
  // Only what this person remembers of the player: a conversation the player
  // has already had should not have to be had again.
  const met = (actor.memories ?? [])
    .filter((memory) => /^(spoke|regard):/.test(memory))
    .slice(-3)
    .map((memory) => memory.split(":").slice(2).join(":"))
    .filter(Boolean);
  // What this person saw the player do. The engine already records these on
  // the witness ("Saw player smash my pot"), but the prompt only ever sent
  // the spoke/regard memories, so a smashed pot never reached the model.
  // Object and item ids are swapped for names: nobody says "pot-3".
  const named = (memory: string) =>
    memory.replace(/[a-z][\w-]*\d[\w-]*/gi, (token) => {
      const object = engine.state.objects.find((candidate) => candidate.id === token);
      return object?.name.toLowerCase() ?? engine.item(token)?.name.toLowerCase() ?? token;
    });
  const grievances = (actor.memories ?? [])
    .filter((memory) => !/^(spoke|regard):/.test(memory))
    .slice(-4)
    .map(named);
  const feeling = actor.trust < 0 ? "wary of you" : actor.trust > 2 ? "warm toward you" : "neutral toward you";
  // This prompt is built for one person, so it can afford the whole outlook
  // and what each position actually holds, which is what stops the model
  // writing a label it has only half-heard of.
  const holds = setting
    ? outlookOf(state.manifest.seed, actor, setting).stances.map(
        (stance) => `${stance.label}${stance.note ? ` — ${stance.note}` : ""}`,
      )
    : [];
  return [
    `NPC: ${actor.name}; ${sexLabel(actor)}; age ${actor.age ?? "adult"}; ${actor.role}.`,
    // Before the words: who has walked up, and what they are holding.
    `In front of you: ${playerPresence(runtime)}`,
    intruding
      ? homePlace?.access === "public"
        ? `The player has walked into ${homePlace.name}, which is your household's home as well as where you work. Whether that is normal depends on your trade: a trader, shopkeeper, innkeeper or craftsman selling goods expects buyers to walk in by day and may treat them as a customer; a herder, farmer, labourer or anyone else does not, and for them a stranger walking in is an intrusion. It is also an intrusion if the player looks odd, armed or dangerous (see "In front of you"). If it is an intrusion: ${intrusionReaction(state.manifest.seed, actor, stats)}`
        : `THE PLAYER HAS COME INTO YOUR HOME UNINVITED and is standing inside ${homePlace?.name ?? "your house"} right now.${familyPresent.length ? ` Your family ${familyPresent.join(", ")} are here too.` : ""} This is what the conversation is about until they leave or explain themselves. ${intrusionReaction(state.manifest.seed, actor, stats)} Never greet them as a customer or ask what they need.`
      : `Openness: ${openness(actor, met.length > 0)}`,
    `Background: ${background.join("; ")}.`,
    `Doing: ${actor.activity.toLowerCase()}. Location: ${place ? `indoors, in ${place.name}` : `outdoors in ${location}, on foot in the open; no desk, counter or furniture unless the context names it`}. Now: ${now(runtime)}.`,
    `On their mind: ${onTheirMind(state.manifest.seed, state.clock, actor)}.`,
    family.length ? `Family: ${family.join(", ")}.` : household ? "Family: household member." : "Family: lives alone.",
    temperament.length ? `Temperament: ${temperament.join(", ")}.` : "",
    `Big Five: openness ${stats.openness}/100, conscientiousness ${stats.conscientiousness}/100, extraversion ${stats.extraversion}/100, agreeableness ${stats.agreeableness}/100, neuroticism ${stats.neuroticism}/100.`,
    holds.length ? `Holds:\n- ${holds.join("\n- ")}` : "",
    possessions.length ? `Has: ${possessions.join(", ")}.` : "Has: ordinary work things.",
    rude && state.clock - rude.at < 180
      ? `Just now, ${Math.max(1, Math.round((state.clock - rude.at) / 60))} minute(s) ago, the player ${rude.what}. Remark on it first, in your own way: annoyed, startled, sarcastic, amused or wary. A bump is small; a weapon swung near you is not.`
      : "",
    grievances.length
      ? `Seen with your own eyes, oldest first, the last of them just now: ${grievances.join("; ")}. This happened; it is not hearsay, and you have not forgotten it.`
      : "",
    met.length ? `Already ${feeling}; remembers you saying: ${met.join("; ")}.` : "Has not spoken with the player before.",
    `Setting: ${engine.world.pack.name}, ${engine.world.pack.date}.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function dialogueInterruption(runtime: Runtime, actor: Actor, exchange: number) {
  const { state } = runtime.engine;
  const seed = state.manifest.seed;
  const key = ["dialogue-interruption", actor.id, state.clock, exchange] as const;
  if (random(seed, ...key, "chance") >= 0.12) return "";
  const nearby = (point: { x: number; y: number }) =>
    Math.hypot(point.x - actor.pos.x, point.y - actor.pos.y) <= 8;
  const people = state.actors.filter(
    (other) =>
      other.id !== actor.id &&
      other.id !== state.player.id &&
      other.kind === "human" &&
      other.pos.space === actor.pos.space &&
      nearby(other.pos),
  );
  const animals = (state.fauna ?? []).flatMap((group) => {
    if (group.pos.space !== actor.pos.space) return [];
    const member = group.members.find(nearby);
    const species = faunaProfile(group.speciesId);
    return member && species ? [species.label] : [];
  });
  const choices = [
    ...(people.length ? ["person", "person"] : []),
    ...(animals.length ? ["animal", "animal"] : []),
    "fart",
    "burp",
    "lose-thread",
    "sneeze",
  ];
  const choice = choices[Math.floor(random(seed, ...key, "kind") * choices.length)];
  if (choice === "person") {
    const other = people[Math.floor(random(seed, ...key, "person") * people.length)];
    return `Just now, nearby ${other.name}, a ${other.role}, has called to you with a question while you are speaking with the player. Let the two exchanges briefly overlap if that feels natural.`;
  }
  if (choice === "animal") {
    const animal = animals[Math.floor(random(seed, ...key, "animal") * animals.length)];
    return `Just now, a nearby ${animal} has interrupted what you were doing: it is nosing, stealing, pecking, barking, or otherwise making trouble in a way plausible for that animal. React to it; this may be comic, inconvenient, or barely worth noticing.`;
  }
  if (choice === "fart")
    return "Just now, you let out an audible fart in the middle of speaking. Put it in \"action\", not the spoken line; the line may acknowledge it, ignore it, or show embarrassment.";
  if (choice === "burp")
    return "Just now, you burped while speaking. Put it in \"action\", not the spoken line; react only if this person would.";
  if (choice === "sneeze")
    return "Just now, a sneeze interrupted you. Put it in \"action\", not the spoken line.";
  return "Just now, you lost your train of thought mid-sentence. Let the hesitation show, then recover or ask what you were saying.";
}

export async function dialogueTurn(
  runtime: Runtime,
  actorId: string,
  input: string,
  history: DialogueLine[],
  signal?: AbortSignal,
  realLanguage = false,
  /** What has just happened between the two of them, if anything has. */
  situation = "",
) {
  const actor = runtime.engine.state.actors.find((candidate) => candidate.id === actorId);
  if (!actor) return { text: "", error: "That person is no longer here." };
  const transcript = history
    .slice(-8)
    .map((line) => `${line.speaker === "npc" ? actor.name : "Player"}: ${line.text}`)
    .join("\n");
  const user = [
    dialogueContext(runtime, actor),
    transcript ? `Conversation so far:\n${transcript}` : "Conversation so far: none.",
    situation ? `Just now: ${situation}` : "",
    dialogueInterruption(runtime, actor, history.length),
    input.trim() ? `Player says: ${input.trim().slice(0, 400)}` : "Begin with one brief spoken line to the player.",
  ].filter(Boolean).join("\n\n");
  const began = Date.now();
  try {
    const response = await fetch("/api/dialogue", {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, realLanguage }),
    });
    const data = (await response.json()) as {
      text?: string;
      original?: string;
      error?: string;
      receive?: DialogueGift;
      regard?: number;
      mood?: Expression;
      action?: string;
      leave?: WalkOff;
      ms?: { upstream: number; total: number };
      tokens?: { out: number; reasoning: number };
    };
    // Where the wait went, in dev. `round` is the whole round trip including
    // our own server; `upstream` is the model alone. A large gap between them
    // is ours to fix; a small one is not.
    if (import.meta.env.DEV && data.ms)
      console.debug(
        `[dialogue] ${input.trim() ? "reply" : "opening"} to ${actorId} · ` +
          `round ${Date.now() - began}ms · upstream ${data.ms.upstream}ms · ` +
          `${data.tokens?.out ?? 0} out (${data.tokens?.reasoning ?? 0} reasoning)`,
      );
    if (!response.ok || !data.text) return { text: "", error: data.error ?? "The conversation is unavailable." };
    return { text: data.text.trim(), original: data.original?.trim() || undefined, action: data.action?.trim() || undefined, leave: data.leave, receive: data.receive, regard: data.regard, mood: data.mood, error: undefined };
  } catch (cause) {
    // An abort is the player closing the conversation, not a failure.
    if (cause instanceof DOMException && cause.name === "AbortError")
      return { text: "", error: undefined, aborted: true };
    return { text: "", error: "The conversation is unavailable." };
  }
}
