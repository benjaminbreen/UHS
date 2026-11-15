import { applySituation, situationSchema } from "../src/content/geography/situation";
import { resolveSetting } from "../src/content/geography/resolve";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { overLimit } from "./rate-limit";
import { z } from "zod";
import { dropNulls, strictSchema } from "./json-schema";
import {
  architectures,
  climates,
  forms,
  settingSchema,
  startBriefSchema,
  waters,
  type AtlasPlace,
} from "../src/content/geography/types";
import { cultures } from "../src/content/history/types";
import { livelihoodIds } from "../src/content/characters/livelihoods";
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
    situation: situationSchema.optional(),
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
    work: z.enum(livelihoodIds as [string, ...string[]]).optional(),
    age: z.number().int().min(18).max(90).optional(),
    below: z.enum(["cave", "sewer", "mine"]).optional(),
    ...startBriefSchema.omit({ work: true }).shape,
  })
  .strict();
const digest = (s: string) => createHash("sha256").update(s).digest();
const requestedName = (prompt: string) => {
  const match = /\b(?:I am|I'm|my name is|play as)\s+((?!A\b|An\b|The\b)[A-Z][\p{L}]+(?:[-'’][A-Z]?[\p{L}]+)*(?:\s+[A-Z][\p{L}]+(?:[-'’][A-Z]?[\p{L}]+)*)?)/u.exec(prompt);
  return match?.[1];
};
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
  const local = resolveSetting(input.prompt);
  if (!("error" in local) && local.setting.situation) return json({ setting: local.setting });
  const q = normalize(input.prompt),
    matches = places.filter((p) =>
      [p.name, ...p.aliases].some((a) => q.includes(normalize(a))),
    );
  const candidates = [
    ...new Map([...matches, ...featuredPlaces].map((p) => [p.id, p])).values(),
  ].slice(0, 65);
  const schema = strictSchema(weaverSchema);
  const prompt = `You are World Weaver. Turn the player's description into the start of a life in a historical simulation: one real place on Earth, one year, one person, on one specific day.

WHO. Honour exactly what the description specifies and invent only what it leaves open.
- It names a person ("Caesar", "Yuri Gagarin", "I am Ea-Nasir"): the player is that person, at a documented moment of their life, with their real name, age, family and companions. Set figure to their name.
- It names a kind of person ("WW2 general", "Indonesian peasant", "potter's daughter", "a weird little guy"): the player is one plausible invented individual of that kind. Leave figure null.
- It names only a place, an era or a mood ("ancient Rome", "medieval"): choose the person the way history would. Most people were farmers, labourers, servants, craftspeople and their families, so choose one of them, somewhere ordinary, not the era's celebrity or capital by default.
In every case prefer an interesting moment to a typical one: a launch, a landing, a coronation, a famine, a fair, the week the news arrived.

STAGING. The simulation stages a settlement (city, town, village, hamlet), a camp or a tiny island or open water. When the request lies beyond that (orbit, a moving train, a battle in progress), choose the nearest real moment it can stage and make the hook say so: Gagarin is better begun on 12 April 1961 in the field near Smelovka where he came down by parachute, met by a farm woman and her granddaughter, than nowhere. Never invent a fictional settlement or magic.
BELOW GROUND. The player can also begin underground: below "mine" puts them down their settlement's mine, "sewer" in its sewers, "cave" in a cave nearby. Set below only when the description asks for it (a miner at the face, a sewer flusher, someone sheltering or living in a cave), and choose a place and year where it is real: a coalfield or mining district for a miner (Durham, the Rhondda, the Ruhr, Cornwall, Potosí, the Rand), a large paved city from about 1850 for sewers, cave country for a cave (the Vézère, the Mendips, Guilin). Otherwise omit it. A miner's role is the job as it was called there: hewer, putter, trapper boy, tributer, kajcha, barretero, pony driver, salt miner. A miner's work is coal-miner for coal after 1780, otherwise miner.
The optional situation field gives the place itself: islet with width/depth in game cells for tiny islands; open-ocean with raft/boat/swimming support for people adrift; local with a camp of military (soldiers' lines), headquarters (a commander's tent among the staff tents), expedition, pastoral or gathering. people excludes the player. Omit situation for a settlement start.

PLACE AND DATE. Choose a place from the catalog below and set placeId to its id, placeName/lon/lat to its values. Only when the description names somewhere absent from the catalog, or a famous moment happened elsewhere, use placeId "custom" with the real name and coordinates. climate, water, relief, culture, settlement and architecture are used only for a "custom" place; fill them plausibly regardless.
Years use astronomical numbering: 100 BCE = -99. Check that the place existed in that year (Alexandria was founded in 331 BCE) and that a named person was alive, of that age, and there in that season. When the description gives only an era, pick a year at random from anywhere inside it, not its midpoint or round centuries; two readings of the same description should land on different years.

THE PERSON.
- role: their title as it reads after "a" or "an", lower case except proper nouns: "king of Macedon", "cosmonaut", "potter's daughter", "rice farmer".
- work: the closest id from the list in the schema for what their days are spent doing. Rulers are ruler, generals commander, a pharaoh's minister statesman, a cosmonaut or pilot aviator; ordinary trades are what they say.
- characterName: the stated name exactly; otherwise a period- and culture-appropriate personal name. sex and age (18 to 90) as recorded, or plausible.
- community: one short phrase for their household or group, or "".
- hook: one or two sentences, second person, present tense, on what makes this particular day matter.
- aim: what this person wants from their life in one sentence (text), why (reason) and how they go about it (means). A king wants a king's things.
- kin: the parent, partner, child or sibling who share their roof at this place, by real name for a named figure; at most four. Empty when they are away from home that day.
- figures: up to four famous or notable people who would be close by that day (Hephaestion beside Alexander), with role and sex. Empty for an ordinary start unless someone notable is passing through.
- tidings: up to two one-sentence items of real news people there and then would be talking about. Never news about the player as if they were someone else.
- documented: true where the record says it, false where you filled it in.
All text is plain modern English, no period voice.
Catalog: ${JSON.stringify(candidates)}
Request id (vary your year and name with it): ${randomUUID()}
User description: ${input.prompt}`;
  const model = env.UHS_WORLD_WEAVER_MODEL ?? "gpt-6-luna";
  if (!/^[a-zA-Z0-9._-]+$/.test(model))
    return json({ error: "Server model configuration is invalid." }, 503);
  inFlight++;
  try {
    const response = await provider(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(60000)]),
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
          max_completion_tokens: 6000,
          reasoning_effort: "low",
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
    const raw = dropNulls(JSON.parse(result.choices?.[0]?.message?.content ?? ""));
    for (const key of ["figure", "hook"]) if (raw?.[key] === "") delete raw[key];
    const chosen = weaverSchema.parse(raw);
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
    const { figure, sex, hook, aim, kin, figures, tidings } = chosen;
    const brief = startBriefSchema.parse(JSON.parse(JSON.stringify({ figure: figure || undefined, work: chosen.work, sex, hook, aim,
      kin: kin?.length ? kin : undefined, figures: figures?.length ? figures : undefined, tidings: tidings?.length ? tidings : undefined })));
    const below = chosen.below ?? ("error" in local ? undefined : local.setting.below);
    const setting = settingSchema.parse({
      ...settingFor(place, chosen.year),
      role: chosen.role,
      characterName: requestedName(input.prompt) ?? chosen.characterName,
      community: chosen.community,
      ...(Object.keys(brief).length ? { brief } : {}),
      ...(below ? { below } : {}),
      ...(chosen.age ? { character: { age: chosen.age, hunger: 10, fatigue: 2 } } : {}),
    });
    return json({ setting: chosen.situation ? applySituation(setting, chosen.situation) : setting });
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
