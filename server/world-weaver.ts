import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { overLimit } from "./rate-limit";
import { z } from "zod";
import { strictSchema } from "./json-schema";
import {
  architectures,
  climates,
  forms,
  settingSchema,
  waters,
  type AtlasPlace,
} from "../src/content/geography/types";
import { cultures } from "../src/content/history/types";
import { featuredPlaces, places } from "../src/content/geography/places";
import { normalize, settingFor } from "../src/content/geography/resolve";
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
// The model picks only what a description can settle. Climate, culture,
// footprint and fabric at that date come from settingFor, which reads the
// gazetteer at the year being played.
const weaverSchema = z
  .object({
    placeId: z.string().min(1).max(100),
    placeName: z.string().min(1).max(120),
    lon: z.number().min(-180).max(180),
    lat: z.number().min(-85).max(85),
    year: z.number().int().min(-1000000).max(10000),
    role: z.string().min(1).max(100),
    characterName: z.string().min(1).max(80),
    community: z.string().max(160),
    climate: z.enum(climates),
    water: z.enum(waters),
    relief: z.number().min(0).max(1),
    culture: z.enum(cultures.map(([id]) => id)),
    settlement: z.enum(forms),
    architecture: z.enum(architectures),
  })
  .strict();
const digest = (s: string) => createHash("sha256").update(s).digest();
// A local concurrency guard, not a distributed billing limit. Provider/project quotas remain authoritative.
let inFlight = 0;
export async function worldWeaver(
  request: Request,
  env: Environment = process.env,
  provider: typeof fetch = fetch,
): Promise<Response> {
  // Open to everyone by default. A code is required only where the deployment
  // sets one; the rate limit, not a password, is what protects the key.
  const accessCode = env.UHS_WORLD_WEAVER_ACCESS_CODE ?? env.UHS_CLASSROOM_CODE;
  const enabled = env.UHS_WORLD_WEAVER_ENABLED !== "0" && !!env.OPENAI_API_KEY;
  if (request.method === "GET")
    return json({ enabled, requiresCode: !!accessCode });
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);
  if (!enabled)
    return json(
      {
        error:
          "World Weaver is not configured on this server. Procedural mode works without it.",
      },
      503,
    );
  if (accessCode) {
    const code =
      request.headers.get("X-World-Weaver-Code") ??
      request.headers.get("X-Classroom-Code") ??
      "";
    if (
      !code ||
      code.length > 256 ||
      !timingSafeEqual(digest(code), digest(accessCode))
    )
      return json({ error: "The World Weaver access code is incorrect." }, 401);
  }
  if (overLimit(request, "world-weaver", 12))
    return json({ error: "Too many worlds at once. Wait a moment." }, 429);
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
  const schema = strictSchema(weaverSchema);
  const prompt = `Interpret a historical game starting situation.
Choose a place from the catalog below and set placeId to its id, placeName/lon/lat to its values. Only when the description names somewhere absent from the catalog, use placeId "custom" with your own name and approximate Earth coordinates.
Years use astronomical numbering: 100 BCE = -99. When the description names an era or a broad period rather than a date, pick a year at random from anywhere inside that era, not its midpoint or its round centuries; two readings of the same description should land on different years.
role, characterName and community describe the person the player asked to be, not the place: an "orphan boy" is an orphan boy whatever the settlement does for a living. Give a plausible period- and culture-appropriate personal name. community is one short phrase for the household or group they belong to, or "" when they belong to none.
climate, water, relief, culture, settlement and architecture are used only for a "custom" place; fill them plausibly regardless.
Catalog: ${JSON.stringify(candidates)}
Request id (vary your year and name with it): ${randomUUID()}
User description: ${input.prompt}`;
  const model = env.UHS_WORLD_WEAVER_MODEL ?? "gpt-5.6-luna";
  if (!/^[a-zA-Z0-9._-]+$/.test(model))
    return json({ error: "Server model configuration is invalid." }, 503);
  inFlight++;
  try {
    const response = await provider(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(25000)]),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY!}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          response_format: {
            type: "json_schema",
            json_schema: { name: "world_setting", schema, strict: true },
          },
          max_completion_tokens: 900,
          reasoning_effort: "none",
          temperature: 1,
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
      choices?: { message?: { content?: string } }[];
    };
    const chosen = weaverSchema.parse(
      JSON.parse(result.choices?.[0]?.message?.content ?? ""),
    );
    const place: AtlasPlace = places.find((p) => p.id === chosen.placeId) ?? {
      id: "custom",
      name: chosen.placeName,
      aliases: [],
      lon: chosen.lon,
      lat: chosen.lat,
      climate: chosen.climate,
      relief: chosen.relief,
      water: chosen.water,
      culture: chosen.culture,
      year: chosen.year,
      settlement: chosen.settlement,
      architecture: chosen.architecture,
    };
    const setting = settingSchema.parse({
      ...settingFor(place, chosen.year),
      role: chosen.role,
      characterName: chosen.characterName,
      community: chosen.community,
    });
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
