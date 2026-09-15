import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { narratorReplySchema } from "../src/runtime/schema";
import { overLimit } from "./rate-limit";
type Environment = Record<string, string | undefined>;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
const requestSchema = z
  .object({
    provider: z.enum(["openai", "gemini"]),
    system: z.string().min(1).max(12000),
    user: z.string().min(1).max(8000),
  })
  .strict();
const digest = (s: string) => createHash("sha256").update(s).digest();
const MODEL_ID = /^[a-zA-Z0-9._-]+$/;
let inFlight = 0;
export function narratorStatus(env: Environment = process.env) {
  return {
    openai: !!env.OPENAI_API_KEY,
    gemini: !!env.GEMINI_API_KEY,
    code: !!env.UHS_NARRATOR_ACCESS_CODE,
  };
}
/** Proxies one narrator turn to the chosen model and returns its JSON text.
 * The client validates the reply; this only keeps keys and limits server-side. */
export async function narrator(
  request: Request,
  env: Environment = process.env,
  provider: typeof fetch = fetch,
): Promise<Response> {
  if (request.method === "GET") return json(narratorStatus(env));
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);
  const accessCode = env.UHS_NARRATOR_ACCESS_CODE;
  if (accessCode) {
    const code = request.headers.get("X-Narrator-Code") ?? "";
    if (
      !code ||
      code.length > 256 ||
      !timingSafeEqual(digest(code), digest(accessCode))
    )
      return json({ error: "The narrator access code is incorrect." }, 401);
  }
  // A narrator turn is the expensive call in the game; the ceiling is lower
  // than dialogue's for that reason.
  if (overLimit(request, "narrator", 12))
    return json({ error: "Too many narrator turns. Wait a moment." }, 429);
  if (inFlight >= 4)
    return json({ error: "The narrator is busy. Try again shortly." }, 429);
  let input: z.infer<typeof requestSchema>;
  try {
    const text = await request.text();
    if (text.length > 24000) return json({ error: "Turn is too long." }, 413);
    input = requestSchema.parse(JSON.parse(text));
  } catch {
    return json({ error: "Malformed narrator request." }, 400);
  }
  const key =
    input.provider === "openai" ? env.OPENAI_API_KEY : env.GEMINI_API_KEY;
  if (!key)
    return json({ error: `No ${input.provider} key on this server.` }, 503);
  const model =
    input.provider === "openai"
      ? (env.UHS_NARRATOR_OPENAI_MODEL ?? "gpt-5.6-luna")
      : (env.UHS_NARRATOR_GEMINI_MODEL ?? "gemini-3.5-flash-lite");
  if (!MODEL_ID.test(model))
    return json({ error: "Server model configuration is invalid." }, 503);
  const { $schema: _s, ...schema } = z.toJSONSchema(narratorReplySchema, {
    unrepresentable: "any",
  });
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(30000)]);
  inFlight++;
  try {
    const response =
      input.provider === "openai"
        ? await provider("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            signal,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: input.system },
                { role: "user", content: input.user },
              ],
              response_format: {
                type: "json_schema",
                json_schema: { name: "narrator_turn", schema, strict: false },
              },
              max_completion_tokens: 900,
              // Default effort roughly doubles latency for prose this short.
              reasoning_effort: "low",
            }),
          })
        : await provider(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: "POST",
              signal,
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": key,
              },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: input.system }] },
                contents: [{ role: "user", parts: [{ text: input.user }] }],
                generationConfig: {
                  responseMimeType: "application/json",
                  responseJsonSchema: schema,
                  maxOutputTokens: 900,
                  temperature: 0.8,
                },
              }),
            },
          );
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      return json(
        { error: `The model provider refused the turn. ${detail}` },
        502,
      );
    }
    const result = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text =
      input.provider === "openai"
        ? (result.choices?.[0]?.message?.content ?? "")
        : (result.candidates?.[0]?.content?.parts
            ?.map((p) => p.text ?? "")
            .join("") ?? "");
    if (!text) return json({ error: "The model returned nothing." }, 502);
    return json({ text, model });
  } catch {
    return json({ error: "The narrator timed out." }, 502);
  } finally {
    inFlight--;
  }
}
