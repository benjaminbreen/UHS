import { z } from "zod";
import { tools, type Agent } from "./agent";

export type Message = { role: "user" | "assistant"; content: string };
export type Complete = (system: string, messages: Message[]) => Promise<string>;

export const decisionSchema = z
  .object({
    intent: z.string().min(1).max(200),
    reasoning: z.string().max(2000).optional(),
    expectation: z.string().max(400).optional(),
    tool: z.string(),
    input: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

/** The interface only: how to reply and what each tool does. What the person
 * should care about is left to the briefing, which may be empty. */
export function instructions(agent: Agent, briefing?: string, rationale = true) {
  const list = agent.names
    .map((n) => `- ${n}: ${tools[n].description}\n${JSON.stringify(z.toJSONSchema(z.object(tools[n].input).strict().omit({ rationale: true })))}`)
    .join("\n");
  return [
    "You are the person described in what you see. Each turn, decide what you do next.",
    rationale
      ? 'Before acting, give a brief reason and expected result in your own words. Reply with one JSON object: {"intent":"a short phrase","reasoning":"brief reason","expectation":"expected result","tool":"<name>","input":{...}}'
      : 'Reply with one JSON object: {"intent":"a short phrase","tool":"<name>","input":{...}}. Do not include reasoning or expectation.',
    'When asked to write a diary, reply only with {"diary":"..."} instead.',
    `Tools:\n${list}`,
    "Ids come from what you see. An act command takes the shapes the act tool names, for example {\"command\":{\"type\":\"interact\",\"target\":\"<id>\",\"action\":\"<one listed in [brackets] for that id>\"}}.",
    briefing?.trim() ?? "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Models wrap JSON in prose or fences often enough to be worth handling. */
export function extractJson(text: string): unknown {
  text = text.replace(/<think>[\s\S]*?<\/think>/g, "");
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  if (start < 0) throw Error("No JSON object in the reply.");
  let depth = 0,
    inString = false,
    escaped = false;
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
    else if (c === "}" && --depth === 0) return JSON.parse(body.slice(start, i + 1));
  }
  throw Error("Unterminated JSON object in the reply.");
}

export type LoopOptions = {
  days?: number;
  maxTurns?: number;
  briefing?: string;
  /** Turns carried forward verbatim; earlier days survive only as the diary. */
  recent?: number;
  rationale?: boolean;
  onTurn?: (line: string) => void;
};

/**
 * Lets a model live until the days or turns run out. Memory is the person's
 * own diary, written at the end of each day, plus the last few turns.
 */
export async function live(agent: Agent, model: Complete, options: LoopOptions = {}) {
  const system = instructions(agent, options.briefing, options.rationale);
  const days = options.days ?? 1,
    maxTurns = options.maxTurns ?? days * 80,
    keep = options.recent ?? 8;
  const day = () => Math.floor(agent.engine.state.clock / 86400);
  const firstDay = day();
  const diary: string[] = [];
  const recent: string[] = [];
  let turns = 0,
    calls = 0,
    stopped = "the days ran out",
    current = day();
  const ask = async (kind: string, messages: Message[]) => {
    calls++;
    const began = Date.now(), request = { system, messages };
    try {
      const reply = await model(system, messages);
      agent.record.trace({ kind, request, response: reply, ms: Date.now() - began });
      return reply;
    } catch (error) {
      agent.record.trace({ kind, request, error: String(error), ms: Date.now() - began });
      throw error;
    }
  };
  const closeDay = async (ended: boolean) => {
    const reply = await ask("diary", [
      { role: "user", content: `${agent.context()}\n\n${recent.join("\n")}\n\n${ended ? "The day is over." : "Pause here and write about the day so far."} Write a short diary entry in your own voice. Reply with JSON: {"diary":"..."}` },
    ]);
    let entry = "(no entry)";
    try {
      entry = z.object({ diary: z.string() }).parse(extractJson(reply)).diary;
    } catch (error) {
      agent.record.trace({ kind: "invalid-diary", response: reply, error: String(error) });
    }
    diary.push(`Day ${current - firstDay + 1}: ${entry}`);
    agent.record.entry({ tool: "diary", input: {}, status: "written", text: entry, clock: agent.engine.state.clock, after: agent.engine.state.clock, place: agent.engine.world.pack.setting?.location ?? "", year: agent.engine.world.pack.setting?.year });
    recent.length = 0;
  };

  let seen = await agent.call("look");
  while (turns < maxTurns && day() - firstDay < days) {
    if (agent.engine.state.player.dead && !agent.engine.heirs().length && !seen.includes("WAITING FOR YOUR ANSWER")) {
      stopped = "the person died";
      break;
    }
    const context = agent.context();
    const prompt = [
      diary.length ? `YOUR DIARY\n${diary.join("\n")}` : "",
      recent.length ? `EARLIER TODAY\n${recent.join("\n")}` : "",
      context,
      seen.startsWith(context) ? seen.slice(context.length).trim() : seen,
      "What do you do?",
    ]
      .filter(Boolean)
      .join("\n\n");
    let decision: z.infer<typeof decisionSchema> | undefined;
    let reply = await ask("decision", [{ role: "user", content: prompt }]);
    for (let attempt = 0; !decision; attempt++) {
      try {
        decision = decisionSchema.parse(extractJson(reply));
      } catch (error) {
        agent.record.trace({ kind: "invalid-decision", response: reply, error: String(error) });
        if (attempt >= 1) {
          stopped = `the model's replies were not usable: ${error instanceof Error ? error.message : error}`;
          break;
        }
        reply = await ask("repair", [
          { role: "user", content: prompt },
          { role: "assistant", content: reply },
          { role: "user", content: "That was not one JSON object in the stated shape. Reply again with only that." },
        ]);
      }
    }
    if (!decision) break;
    const input = { ...decision.input };
    Object.assign(input, { rationale: { intent: decision.intent, ...(options.rationale !== false ? { reasoning: decision.reasoning, expectation: decision.expectation } : {}) } });
    seen = await agent.call(decision.tool, input);
    turns++;
    const line = `${decision.intent} → ${seen.split("\n\n")[0].replace(/\n/g, " ").slice(0, 200)}`;
    recent.push(line);
    if (recent.length > keep) recent.shift();
    options.onTurn?.(line);
    if (day() !== current) {
      await closeDay(true);
      current = day();
    }
  }
  if (turns >= maxTurns) stopped = `the turn limit (${maxTurns})`;
  if (recent.length) await closeDay(false);
  return { turns, calls, diary, stopped };
}
