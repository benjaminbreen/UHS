import type { Actor } from "../core/types";
import { describeStats, statsOf } from "../core/stats";
import { describeStanding, standingOf } from "../core/standing";
import { outlookOf } from "../core/outlook";
import { communityProfiles } from "../content/characters/profiles/communities";
import type { Runtime } from "../runtime/session";
import { wearSlots } from "../core/character";
import { parseCloth } from "../content/characters/wardrobe/cloth";
import type { Expression } from "../render/portraits/constructed";

export type DialogueLine = { speaker: "npc" | "player"; text: string; original?: string };
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
function openness(actor: Actor, met: boolean) {
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

/** Small, local-only context: enough to ground a voice without resending the world card. */
export function dialogueContext(runtime: Runtime, actor: Actor) {
  const engine = runtime.engine;
  const state = engine.state;
  const place = actor.pos.space !== "outside" ? engine.world.place(actor.pos.space) : undefined;
  const setting = engine.world.pack.setting;
  const household = actor.householdId
    ? state.households?.find((h) => h.id === actor.householdId)
    : undefined;
  const family = (actor.relations ?? [])
    .map((relation) => {
      const other = [state.player, ...state.actors].find((candidate) => candidate.id === relation.other);
      return other ? `${relation.kind} ${other.name}` : undefined;
    })
    .filter(Boolean);
  const traits = describeStats(statsOf(state.manifest.seed, actor)).slice(0, 3);
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
    `Openness: ${openness(actor, met.length > 0)}`,
    `Background: ${background.join("; ")}.`,
    `Doing: ${actor.activity.toLowerCase()}. Location: ${location}.`,
    family.length ? `Family: ${family.join(", ")}.` : household ? "Family: household member." : "Family: lives alone.",
    traits.length ? `Traits: ${traits.join(", ")}.` : "Traits: ordinary temperament.",
    holds.length ? `Holds:\n- ${holds.join("\n- ")}` : "",
    possessions.length ? `Has: ${possessions.join(", ")}.` : "Has: ordinary work things.",
    met.length ? `Already ${feeling}; remembers you saying: ${met.join("; ")}.` : "Has not spoken with the player before.",
    `Setting: ${engine.world.pack.name}, ${engine.world.pack.date}.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function dialogueTurn(
  runtime: Runtime,
  actorId: string,
  input: string,
  history: DialogueLine[],
  signal?: AbortSignal,
  realLanguage = false,
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
    input.trim() ? `Player says: ${input.trim().slice(0, 400)}` : "Begin with one brief spoken line to the player.",
  ].join("\n\n");
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
    return { text: data.text.trim(), original: data.original?.trim() || undefined, receive: data.receive, regard: data.regard, mood: data.mood, error: undefined };
  } catch (cause) {
    // An abort is the player closing the conversation, not a failure.
    if (cause instanceof DOMException && cause.name === "AbortError")
      return { text: "", error: undefined, aborted: true };
    return { text: "", error: "The conversation is unavailable." };
  }
}
