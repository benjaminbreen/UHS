import type { Runtime } from "../runtime/session";
import { narratorReplySchema, type NarratorReply } from "../runtime/schema";
import { sceneDigest, worldCard } from "./prompt";
export type Provider = "openai" | "gemini";
export const PROVIDER_KEY = "uhs-narrator-provider";
export function narratorProvider(): Provider {
  try {
    return localStorage.getItem(PROVIDER_KEY) === "gemini"
      ? "gemini"
      : "openai";
  } catch {
    return "openai";
  }
}
export type Turn = {
  text: string;
  reply?: NarratorReply;
  outcomes: string[];
  error?: string;
};
/** One narrator turn: prompt, model, engine, log. The narration shown is the
 * model's lead-in plus whatever the engine then reported, so an attempt's
 * success or failure line follows the model's own words. */
export async function narratorTurn(
  runtime: Runtime,
  input: string,
  provider = narratorProvider(),
): Promise<Turn> {
  const engine = runtime.engine;
  input = input.trim().slice(0, 600);
  const body = {
    provider,
    system: worldCard(engine),
    user: sceneDigest(engine, input),
  };
  let reply: NarratorReply;
  try {
    const res = await fetch("/api/narrator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { text?: string; error?: string };
    if (!res.ok || !data.text)
      return {
        text: "",
        outcomes: [],
        error: data.error ?? "The narrator is unavailable.",
      };
    reply = narratorReplySchema.parse(JSON.parse(data.text));
  } catch {
    return {
      text: "",
      outcomes: [],
      error: "The narrator gave an unusable reply.",
    };
  }
  const outcomes: string[] = [],
    lines = [reply.narration.trim()];
  if (reply.command) {
    const r = runtime.command(reply.command);
    if (r?.status === "rejected")
      outcomes.push(r.reason ?? "That was not possible.");
    else if (r) lines.push(...r.events.map((e) => e.text));
  }
  if (reply.intents.length) {
    const { result, outcomes: got } = runtime.narrate(reply.intents);
    if (result?.status === "rejected") outcomes.push(result.reason ?? "");
    else if (result) {
      outcomes.push(...got);
      lines.push(
        ...result.events.filter((e) => e.kind !== "system").map((e) => e.text),
      );
    }
  }
  const text = lines.filter(Boolean).join(" ");
  const s = engine.state;
  s.narration = [...(s.narration ?? []), { clock: s.clock, input, text }].slice(
    -200,
  );
  runtime.touch();
  return { text, reply, outcomes };
}
