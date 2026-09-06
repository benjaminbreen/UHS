import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { settingSchema } from "../src/content/geography/types";
import { featuredPlaces, places } from "../src/content/geography/places";
import { normalize } from "../src/content/geography/resolve";
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
  .object({ prompt: z.string().trim().min(1).max(2000) })
  .strict();
const digest = (s: string) => createHash("sha256").update(s).digest();
// A local concurrency guard, not a distributed billing limit. Provider/project quotas remain authoritative.
let inFlight = 0;
export async function worldWeaver(
  request: Request,
  env: Environment = process.env,
  provider: typeof fetch = fetch,
): Promise<Response> {
  const enabled =
    env.UHS_WORLD_WEAVER_ENABLED === "1" &&
    !!env.GEMINI_API_KEY &&
    !!env.UHS_CLASSROOM_CODE;
  if (request.method === "GET") return json({ enabled });
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);
  if (!enabled)
    return json(
      {
        error:
          "World Weaver is not configured on this server. Procedural mode works without it.",
      },
      503,
    );
  const code = request.headers.get("X-Classroom-Code") ?? "";
  if (
    !code ||
    code.length > 256 ||
    !timingSafeEqual(digest(code), digest(env.UHS_CLASSROOM_CODE!))
  )
    return json({ error: "The classroom access code is incorrect." }, 401);
  if (inFlight >= 2)
    return json({ error: "World Weaver is busy. Try again shortly." }, 429);
  if (Number(request.headers.get("Content-Length") ?? 0) > 12000)
    return json({ error: "Description is too long." }, 413);
  let input: z.infer<typeof requestSchema>;
  try {
    const text = await request.text();
    if (text.length > 10000)
      return json({ error: "Description is too long." }, 413);
    input = requestSchema.parse(JSON.parse(text));
  } catch {
    return json(
      { error: "Enter a description of up to 2,000 characters." },
      400,
    );
  }
  const q = normalize(input.prompt),
    matches = places.filter((p) =>
      [p.name, ...p.aliases].some((a) => q.includes(normalize(a))),
    );
  const candidates = [
    ...new Map([...matches, ...featuredPlaces].map((p) => [p.id, p])).values(),
  ].slice(0, 65);
  const { $schema: _schema, ...schema } = z.toJSONSchema(settingSchema);
  const prompt = `Interpret a historical game starting situation. Return a WorldSetting, version 2. Invent a plausible concrete year and subregion when broad. Years use astronomical numbering: 100 BCE = -99. Select available architectural components, climate and settlement form. Preserve the player's role/community separately from geography. No tiles or adjacency lists. Coast direction describes where open sea lies relative to the settlement. A river direction describes its course. Prefer a matching placeId and its coordinates from this catalog. For a location absent here use placeId "custom", its name and approximate Earth coordinates. Local geography is evocative, not a reconstruction. Use this compact catalog: ${JSON.stringify(candidates)}\nUser description: ${input.prompt}`;
  const model = env.UHS_WORLD_WEAVER_MODEL ?? "gemini-3.5-flash-lite";
  if (!/^[a-zA-Z0-9._-]+$/.test(model))
    return json({ error: "Server model configuration is invalid." }, 503);
  inFlight++;
  try {
    const response = await provider(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(25000)]),
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY!,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseJsonSchema: schema,
            maxOutputTokens: 1800,
            temperature: 0.35,
          },
        }),
      },
    );
    if (!response.ok)
      return json(
        {
          error:
            "The model provider could not complete the request. Your description is preserved; procedural mode is available.",
        },
        502,
      );
    const result = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text =
      result.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("") ?? "";
    const setting = settingSchema.parse(JSON.parse(text));
    const place = places.find((p) => p.id === setting.placeId);
    if (place) {
      setting.lon = place.lon;
      setting.lat = place.lat;
      setting.location = place.name;
    } else if (setting.placeId !== "custom")
      return json(
        {
          error:
            "The model selected an unknown place identifier. Try again or choose a place in procedural mode.",
        },
        502,
      );
    return json({ setting });
  } catch {
    return json(
      {
        error:
          "World Weaver timed out or returned an unusable setting. Your description is preserved; procedural mode is available.",
      },
      502,
    );
  } finally {
    inFlight--;
  }
}
