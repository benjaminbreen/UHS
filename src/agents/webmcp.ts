import { z } from "zod";
import { requestSchema } from "./player";
import type { Runtime } from "../runtime/session";
/** Optional browser standard. It exposes only the same public player commands. */
export function registerWebMCP(runtime: Runtime) {
  const context = (
    document as Document & {
      modelContext?: {
        registerTool: (
          tool: unknown,
          options: { signal: AbortSignal },
        ) => void | Promise<void>;
      };
    }
  ).modelContext;
  if (!context) return;
  const lifecycle = new AbortController();
  const tools = [
    {
      name: "observe",
      description: "Observe this character’s current visible surroundings.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: () => runtime.engine.observe(),
    },
    {
      name: "inspect",
      description: "Inspect a visible person, object, or entrance.",
      inputSchema: {
        type: "object",
        properties: { targetId: { type: "string" } },
        required: ["targetId"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: (input: unknown) => {
        const { targetId } = z
          .object({ targetId: z.string() })
          .strict()
          .parse(input);
        return (
          runtime.engine.inspect(targetId) ?? {
            error: "Target is not visible.",
          }
        );
      },
    },
    {
      name: "act",
      description:
        "Perform a validated command as the player and advance simulated time.",
      inputSchema: z.toJSONSchema(requestSchema),
      annotations: { readOnlyHint: false },
      execute: (input: unknown) => runtime.act(requestSchema.parse(input)),
    },
  ];
  for (const tool of tools)
    try {
      void Promise.resolve(
        context.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {
      /* Unsupported experimental registries leave normal play intact. */
    }
  window.addEventListener("pagehide", () => lifecycle.abort(), { once: true });
}
