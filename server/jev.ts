import { z } from "zod";
import { jev } from "../src/chronicle/jev";
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
const text = z.string().max(400);
const questionSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("noul"),
      instructions: text,
      criteria: z.object({ true: text, false: text }).strict(),
    })
    .strict(),
  z
    .object({
      type: z.literal("choice"),
      instructions: text,
      criteria: z.record(z.string().max(80), text.nullable()),
    })
    .strict(),
]);
const requestSchema = z
  .object({
    state: z.record(z.string(), z.unknown()),
    questions: z.record(z.string().max(40), questionSchema),
  })
  .strict()
  .refine((r) => Object.keys(r.questions).length <= 6, "Too many questions.")
  .refine(
    (r) =>
      Object.values(r.questions).every(
        (q) => q.type !== "choice" || Object.keys(q.criteria).length <= 255,
      ),
    "Too many options.",
  );

/** Proxies one Jev evaluation. The key stays on the server; the client builds
 * the questions from what the engine can actually do. */
export async function jevRoute(
  request: Request,
  env: Environment = process.env,
  provider: typeof fetch = fetch,
): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);
  const key = env.TYPESAFE_API_KEY;
  if (!key) return json({ error: "No Jev key on this server." }, 503);
  if (overLimit(request, "jev", 30))
    return json({ error: "Too many requests. Wait a moment." }, 429);
  let input: z.infer<typeof requestSchema>;
  try {
    input = requestSchema.parse(JSON.parse(await request.text()));
  } catch {
    return json({ error: "Malformed request." }, 400);
  }
  try {
    return json(
      await jev({ apiKey: key, fetch: provider })(input.state, input.questions),
    );
  } catch (error) {
    return json({ error: String(error).slice(0, 300) }, 502);
  }
}
