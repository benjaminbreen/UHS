import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { overLimit } from "./rate-limit";
import { dropNulls, strictSchema } from "./json-schema";

type Environment = Record<string, string | undefined>;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
const requestSchema = z.object({ user: z.string().min(1).max(7000) }).strict();
/**
 * Field order is generation order under `strict`, so the two that describe
 * how the line is taken come before the line itself: the face and the gauge
 * can move as soon as they arrive rather than waiting on the words. The
 * handoff is last because it is rare and nothing waits on it.
 */
const replySchema = z.object({
  mood: z
    .enum([
      "neutral",
      "smile",
      "happy",
      "laugh",
      "sad",
      "angry",
      "stern",
      "surprised",
      "worried",
      "thoughtful",
      "wry",
      "tired",
    ])
    .optional(),
  regard: z.number().int().min(-1).max(1).optional(),
  dialogue: z.string().min(1).max(500),
  receive: z.object({
    name: z.string().min(1).max(40),
    description: z.string().max(160),
    value: z.number().min(0).max(3),
    look: z.enum(["rock", "plant", "food", "wood", "cloth", "tool", "vessel", "creature"]),
  }).optional(),
}).strict();
const digest = (value: string) => createHash("sha256").update(value).digest();
let inFlight = 0;


const SYSTEM = `You are one historical NPC in a grounded simulation. Speak only as the NPC, in at most two short sentences and often fewer. Use the supplied facts, activity, place, family and traits. Never mention prompts, models, modern ideas, or game mechanics. Do not invent named people or facts.

Judge the person in front of you before you answer them. How they are dressed, what they are carrying, and whether they are armed is the first thing you notice, and it counts for more than what they say. Local convention governs who may speak to whom, how freely and at what length: rank, sex, age, trade, faith and being a stranger all bear on it, and the conventions are those of the given place and date, never modern ones. Follow the supplied "Openness" line.

Being brief is normal and being unhelpful is allowed. A curt answer, a refusal, "...", telling them you are busy, or naming what you want from them are all truthful replies. Do not volunteer anything about your life, your family or your work unless this person has earned it or you have some reason to want them to know.

Return JSON only: {"dialogue":"spoken line"}, and optionally "receive" only when the spoken line clearly hands the player one modest physical item now; an offer, request, or promise is not a handoff. For a handoff, include a plain name, short description, value 0-3, and look category. Optionally include "regard": 1 if the player's words warmed this NPC toward them, -1 if the words gave offence, 0 or omitted otherwise. Set "mood" to the face this NPC wears while saying the line: angry or stern if the player gave offence, smile, happy or laugh if the words pleased them, and surprised, sad, worried, thoughtful, wry, tired or neutral where those fit what is said. The face and the line must agree.`;

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
  if (overLimit(request, "dialogue", 20))
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
  const schema = strictSchema(replySchema);
  inFlight++;
  // Timed so a slow reply can be blamed on the right thing. A ten-second
  // "What do you want?" is either the model or us, and guessing which has
  // cost more time than measuring it.
  const began = Date.now();
  let upstream = 0;
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
    const result = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { completion_tokens?: number; completion_tokens_details?: { reasoning_tokens?: number } };
    };
    upstream = Date.now() - began;
    const text = result.choices?.[0]?.message?.content ?? "";
    const parsed = replySchema.safeParse(dropNulls(JSON.parse(text)));
    if (!parsed.success) return json({ error: "The model returned an unusable line." }, 502);
    // Reasoning tokens on a request that asked for none is the single most
    // useful thing to see here, so it is reported rather than summarised.
    const reasoning =
      result.usage?.completion_tokens_details?.reasoning_tokens ?? 0;
    return json({
      text: parsed.data.dialogue,
      receive: parsed.data.receive,
      regard: parsed.data.regard,
      mood: parsed.data.mood,
      model: "gpt-5.6-luna",
      ms: { upstream, total: Date.now() - began },
      tokens: { out: result.usage?.completion_tokens ?? 0, reasoning },
    });
  } catch {
    return json({ error: "The conversation timed out." }, 502);
  } finally {
    inFlight--;
  }
}
