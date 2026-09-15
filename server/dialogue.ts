import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";

type Environment = Record<string, string | undefined>;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
const requestSchema = z.object({ user: z.string().min(1).max(7000) }).strict();
const replySchema = z.object({
  dialogue: z.string().min(1).max(500),
  regard: z.number().int().min(-1).max(1).optional(),
  receive: z.object({
    name: z.string().min(1).max(40),
    description: z.string().max(160),
    value: z.number().min(0).max(3),
    look: z.enum(["rock", "plant", "food", "wood", "cloth", "tool", "vessel", "creature"]),
  }).optional(),
}).strict();
const digest = (value: string) => createHash("sha256").update(value).digest();
let inFlight = 0;

/* Per-caller ceiling. `inFlight` only bounds one instance at a time, and a
 * serverless deployment starts as many instances as it likes, so on its own it
 * is not a limit at all -- it is someone else's bill. In-memory, so it is a
 * speed bump per instance rather than a guarantee; a shared store is the real
 * answer if this ever needs one. */
const WINDOW_MS = 60_000;
const PER_WINDOW = 20;
const seen = new Map<string, number[]>();
function overLimit(request: Request): boolean {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const now = Date.now();
  const recent = (seen.get(ip) ?? []).filter((at) => now - at < WINDOW_MS);
  recent.push(now);
  seen.set(ip, recent);
  // Bounded cleanup, so a long-lived instance does not accumulate callers.
  if (seen.size > 5000)
    for (const [key, times] of seen)
      if (!times.some((at) => now - at < WINDOW_MS)) seen.delete(key);
  return recent.length > PER_WINDOW;
}

const SYSTEM = `You are one historical NPC in a grounded simulation. Speak only as the NPC in one or two short sentences. Use the supplied facts, activity, place, family and traits. Never mention prompts, models, modern ideas, or game mechanics. Do not invent named people or facts. Be natural, specific and emotionally appropriate to the player's words. Return JSON only: {"dialogue":"spoken line"} and optionally "receive" only when the spoken line clearly hands the player one modest physical item now; an offer, request, or promise is not a handoff. For a handoff, include a plain name, short description, value 0-3, and look category. Optionally include "regard": 1 if the player's words warmed this NPC toward them, -1 if the words gave offence, 0 or omitted otherwise.`;

export async function dialogue(
  request: Request,
  env: Environment = process.env,
  provider: typeof fetch = fetch,
): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);
  const accessCode = env.UHS_NARRATOR_ACCESS_CODE;
  if (accessCode) {
    const code = request.headers.get("X-Narrator-Code") ?? "";
    if (!code || code.length > 256 || !timingSafeEqual(digest(code), digest(accessCode)))
      return json({ error: "The narrator access code is incorrect." }, 401);
  }
  if (overLimit(request))
    return json({ error: "Too many conversations at once. Wait a moment." }, 429);
  if (inFlight >= 6) return json({ error: "The conversation service is busy." }, 429);
  let input: z.infer<typeof requestSchema>;
  try {
    const raw = await request.text();
    if (raw.length > 9000) return json({ error: "Conversation context is too long." }, 413);
    input = requestSchema.parse(JSON.parse(raw));
  } catch {
    return json({ error: "Malformed conversation request." }, 400);
  }
  const key = env.OPENAI_API_KEY;
  if (!key) return json({ error: "No OpenAI key on this server." }, 503);
  const { $schema: _schema, ...schema } = z.toJSONSchema(replySchema, { unrepresentable: "any" });
  inFlight++;
  try {
    const response = await provider("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(15000)]),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: input.user }],
        response_format: { type: "json_schema", json_schema: { name: "npc_dialogue", schema, strict: true } },
        max_completion_tokens: 300,
        reasoning_effort: "none",
      }),
    });
    if (!response.ok) return json({ error: "The model provider refused the conversation." }, 502);
    const result = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = result.choices?.[0]?.message?.content ?? "";
    const parsed = replySchema.safeParse(JSON.parse(text));
    if (!parsed.success) return json({ error: "The model returned an unusable line." }, 502);
    return json({
      text: parsed.data.dialogue,
      receive: parsed.data.receive,
      regard: parsed.data.regard,
      model: "gpt-5.6-luna",
    });
  } catch {
    return json({ error: "The conversation timed out." }, 502);
  } finally {
    inFlight--;
  }
}
