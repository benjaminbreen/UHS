import type { Actor } from "../core/types";
import { describeStats, statsOf } from "../core/stats";
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
  return [
    `NPC: ${actor.name}; ${sexLabel(actor)}; age ${actor.age ?? "adult"}; ${actor.role}.`,
    `Doing: ${actor.activity.toLowerCase()}. Location: ${location}.`,
    family.length ? `Family: ${family.join(", ")}.` : household ? "Family: household member." : "Family: lives alone.",
    traits.length ? `Traits: ${traits.join(", ")}.` : "Traits: ordinary temperament.",
    possessions.length ? `Has: ${possessions.join(", ")}.` : "Has: ordinary work things.",
    `Setting: ${engine.world.pack.name}, ${engine.world.pack.date}.`,
  ].join("\n");
}

export async function dialogueTurn(
  runtime: Runtime,
  actorId: string,
  input: string,
  history: DialogueLine[],
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user }),
    });
    const data = (await response.json()) as { text?: string; error?: string; receive?: DialogueGift };
    if (!response.ok || !data.text) return { text: "", error: data.error ?? "The conversation is unavailable." };
    return { text: data.text.trim(), receive: data.receive, error: undefined };
  } catch {
    return { text: "", error: "The conversation is unavailable." };
  }
}
