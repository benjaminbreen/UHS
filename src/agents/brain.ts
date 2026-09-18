import { z } from "zod";
import { commandSchema } from "../runtime/schema";
import { rationaleSchema } from "./player";

/** What the character decides to do this turn. */
export const decisionSchema = z
  .object({
    intent: z.string().min(1).max(200),
    reasoning: z.string().min(1).max(2000),
    expectation: z.string().max(400).optional(),
    action: z.discriminatedUnion("kind", [
      z
        .object({
          kind: z.literal("goto"),
          target: z.string().optional(),
          x: z.number().int().optional(),
          y: z.number().int().optional(),
        })
        .strict(),
      z.object({ kind: z.literal("act"), command: commandSchema }).strict(),
      z.object({ kind: z.literal("inspect"), targetId: z.string() }).strict(),
      z
        .object({
          kind: z.literal("wait"),
          minutes: z.number().int().min(1).max(60),
        })
        .strict(),
    ]),
  })
  .strict();
export type Decision = z.infer<typeof decisionSchema>;

export const RULES = `You are the person described below, living one ordinary day after another. Decide what they do next.

Stay inside the period. Use only what the world and the scene name: these people, these buildings, these goods. You know what someone of this role and standing would know by living here, and nothing else — no dates from outside your own reckoning, no knowledge of distant places you have not visited, no awareness that this is a simulation.

Act as this person, with their obligations. A day is mostly work, food, water, kin and the people you owe something to. Follow the concern stated in your description. Boredom is not a reason to wander; hunger, thirst, duty and curiosity about what is in front of you are.

Reply with one JSON object and nothing else:
{"intent":"a short phrase naming what you are doing","reasoning":"why, in your own voice, one to three sentences","expectation":"what you think will happen (optional)","action":{...}}

The action is one of:
- {"kind":"goto","target":"<scene id>"} — walk to a person, thing or building in the scene. Use this rather than stepping; it covers the whole walk.
- {"kind":"goto","x":<n>,"y":<n>} — walk to a spot.
- {"kind":"act","command":{"type":"interact","target":"<scene id>","action":"<one listed in [brackets] for that id>"}}
- {"kind":"act","command":{"type":"trade","target":"<id>","give":"<item>","giveQuantity":<n>,"take":"<item>","takeQuantity":<n>}}
- {"kind":"act","command":{"type":"use","item":"<item in your inventory>"}}
- {"kind":"inspect","targetId":"<scene id>"} — look closer before deciding. Costs no time.
- {"kind":"wait","minutes":<1-60>} — stand where you are.
- {"kind":"act","command":{"type":"sleep","seconds":<600-86400>}} — lie down and sleep. Where you sleep matters: a bed under a roof mends you, a night in the open in cold or rain does not.

Only use an action listed in [brackets] for that id. Only name ids that appear in the scene.`;

export const journalRequest =
  'The day is over. Write one short paragraph in this person\'s voice: what you did, what came of it, and what you mean to do tomorrow. Reply with JSON: {"journal":"..."}';

export const journalSchema = z.object({ journal: z.string().max(1200) }).strict();

export type Message = { role: "user" | "assistant"; content: string };
export type Complete = (system: string, messages: Message[]) => Promise<string>;

/** Models wrap JSON in prose or fences often enough to be worth handling. */
export function extractJson(text: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  if (start < 0) throw Error("No JSON object in the reply.");
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < body.length; i++) {
    const c = body[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0)
      return JSON.parse(body.slice(start, i + 1));
  }
  throw Error("Unterminated JSON object in the reply.");
}

/** One decision, with a single corrective retry: a malformed reply is common
 * and cheap to fix, and the alternative is losing the turn. */
export async function decide(
  complete: Complete,
  system: string,
  messages: Message[],
): Promise<Decision> {
  let reply = await complete(system, messages);
  for (let attempt = 0; ; attempt++) {
    try {
      return decisionSchema.parse(extractJson(reply));
    } catch (error) {
      if (attempt >= 1) throw error;
      reply = await complete(system, [
        ...messages,
        { role: "assistant", content: reply },
        {
          role: "user",
          content: `That was not usable: ${
            error instanceof Error ? error.message : error
          }. Reply with one JSON object in the stated shape, and nothing else.`,
        },
      ]);
    }
  }
}

export const rationaleOf = (decision: Decision) =>
  rationaleSchema.parse({
    intent: decision.intent,
    reasoning: decision.reasoning,
    expectation: decision.expectation,
  });
