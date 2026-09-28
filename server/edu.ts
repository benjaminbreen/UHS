import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { eduEventSchema } from "../src/edu/events";
import { neonEduStore, type EduStore } from "./edu-store";
import { overLimit } from "./rate-limit";

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const matches = (actual: string, expected: string) =>
  timingSafeEqual(Buffer.from(hash(actual), "hex"), Buffer.from(hash(expected), "hex"));
const startSchema = z.object({
  name: z.string().trim().min(1).max(100),
  code: z.string().min(1).max(200),
  consent: z.literal(true),
}).strict();
const batchSchema = z.object({
  sessionId: z.string().uuid(),
  events: z.array(eduEventSchema).min(1).max(40),
}).strict();
const resumeSchema = z.object({
  sessionId: z.string().uuid(),
  code: z.string().min(1).max(200),
}).strict();
const uuid = z.string().uuid();

export async function education(
  request: Request,
  env: Record<string, string | undefined> = process.env,
  store?: EduStore,
): Promise<Response> {
  const configured = !!(env.DATABASE_URL && env.UHS_EDU_CLASS_CODE && env.UHS_EDU_TEACHER_TOKEN);
  const url = new URL(request.url);
  if (request.method === "GET" && url.searchParams.get("view") === "config")
    return json({ available: configured });
  if (!configured && !store) return json({ error: "Classroom mode is not configured." }, 503);
  store ??= neonEduStore(env.DATABASE_URL!);
  const view = url.searchParams.get("view");
  try {
    if (request.method === "POST" && view === "start") {
      if (overLimit(request, "edu-start", 12)) return json({ error: "Try again later." }, 429);
      const raw = await request.text();
      if (raw.length > 2000) return json({ error: "Request is too large." }, 413);
      const input = startSchema.parse(JSON.parse(raw));
      if (!matches(input.code, env.UHS_EDU_CLASS_CODE ?? ""))
        return json({ error: "Invalid class code." }, 403);
      const id = randomUUID();
      const token = randomBytes(32).toString("hex");
      await store.create(id, input.name, hash(token));
      return json({ sessionId: id, token });
    }
    if (request.method === "POST" && view === "resume") {
      if (overLimit(request, "edu-resume", 12)) return json({ error: "Try again later." }, 429);
      const raw = await request.text();
      if (raw.length > 2000) return json({ error: "Request is too large." }, 413);
      const input = resumeSchema.parse(JSON.parse(raw));
      const token = request.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "";
      if (!matches(input.code, env.UHS_EDU_CLASS_CODE ?? "") ||
          !await store.authorized(input.sessionId, hash(token)))
        return json({ error: "Could not resume this session." }, 403);
      return json({ resumed: true });
    }
    if (request.method === "POST" && view === "events") {
      const raw = await request.text();
      if (raw.length > 100000) return json({ error: "Request is too large." }, 413);
      const input = batchSchema.parse(JSON.parse(raw));
      if (input.events.some((e, i) => i > 0 && e.seq !== input.events[i - 1].seq + 1))
        return json({ error: "Events must be in order." }, 400);
      if (input.events.some((e) => JSON.stringify(e.data).length > 50000))
        return json({ error: "An event is too large." }, 413);
      const token = request.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "";
      if (!await store.authorized(input.sessionId, hash(token)))
        return json({ error: "Session expired." }, 401);
      await store.append(input.sessionId, input.events);
      return json({ through: input.events.at(-1)!.seq });
    }
    const teacher = request.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "";
    if (overLimit(request, "edu-teacher", 60)) return json({ error: "Try again later." }, 429);
    if (!matches(teacher, env.UHS_EDU_TEACHER_TOKEN ?? ""))
      return json({ error: "Teacher access required." }, 401);
    if (request.method === "GET" && view === "sessions")
      return json({ sessions: await store.list() });
    if (request.method === "GET" && view === "session") {
      const id = uuid.parse(url.searchParams.get("id"));
      const record = await store.read(id);
      return record ? json(record) : json({ error: "Session not found." }, 404);
    }
    if (request.method === "DELETE" && view === "session") {
      await store.delete(uuid.parse(url.searchParams.get("id")));
      return json({ deleted: true });
    }
    return json({ error: "Unknown classroom request." }, 404);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return json({ error: "Invalid classroom request." }, 400);
    return json({ error: "Classroom storage is unavailable." }, 503);
  }
}
