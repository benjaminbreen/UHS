import type { Actor } from "../core/types";
import { describeStats, statsOf } from "../core/stats";
import { communityProfiles } from "../content/characters/profiles/communities";
import type { Runtime } from "../runtime/session";

export type DialogueLine = { speaker: "npc" | "player"; text: string };
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
  const background = [
    community ?? "local to this place",
    actor.origin?.standing === "unfree" ? "held in bondage" : undefined,
  ].filter(Boolean);
  // Only what this person remembers of the player: a conversation the player
  // has already had should not have to be had again.
  const met = (actor.memories ?? [])
    .filter((memory) => /^(spoke|regard):/.test(memory))
    .slice(-3)
    .map((memory) => memory.split(":").slice(2).join(":"))
    .filter(Boolean);
  const feeling = actor.trust < 0 ? "wary of you" : actor.trust > 2 ? "warm toward you" : "neutral toward you";
  return [
    `NPC: ${actor.name}; ${sexLabel(actor)}; age ${actor.age ?? "adult"}; ${actor.role}.`,
    `Background: ${background.join("; ")}.`,
    `Doing: ${actor.activity.toLowerCase()}. Location: ${location}.`,
    family.length ? `Family: ${family.join(", ")}.` : household ? "Family: household member." : "Family: lives alone.",
    traits.length ? `Traits: ${traits.join(", ")}.` : "Traits: ordinary temperament.",
    possessions.length ? `Has: ${possessions.join(", ")}.` : "Has: ordinary work things.",
    met.length ? `Already ${feeling}; remembers you saying: ${met.join("; ")}.` : "Has not spoken with the player before.",
    `Setting: ${engine.world.pack.name}, ${engine.world.pack.date}.`,
  ].join("\n");
}

export async function dialogueTurn(
  runtime: Runtime,
  actorId: string,
  input: string,
  history: DialogueLine[],
  signal?: AbortSignal,
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
  try {
    const response = await fetch("/api/dialogue", {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user }),
    });
    const data = (await response.json()) as {
      text?: string;
      error?: string;
      receive?: DialogueGift;
      regard?: number;
    };
    if (!response.ok || !data.text) return { text: "", error: data.error ?? "The conversation is unavailable." };
    return { text: data.text.trim(), receive: data.receive, regard: data.regard, error: undefined };
  } catch (cause) {
    // An abort is the player closing the conversation, not a failure.
    if (cause instanceof DOMException && cause.name === "AbortError")
      return { text: "", error: undefined, aborted: true };
    return { text: "", error: "The conversation is unavailable." };
  }
}
