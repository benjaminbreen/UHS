import { z } from "zod";
import { decisionSchema, type Complete, type Message } from "./loop";

const decisionJson = z.toJSONSchema(decisionSchema);

/** Rate limits, overload and dropped connections pass; a long run should not
 * end on one. Waits 2, 4, 8, 16, 32 s, or what retry-after asks. */
async function patient(send: typeof fetch, url: string, init: RequestInit) {
  for (let attempt = 0; ; attempt++) {
    const last = attempt === 5;
    let response;
    try {
      response = await send(url, init);
    } catch (error) {
      if (last) throw error;
    }
    if (response && (last || !(response.status === 408 || response.status === 429 || response.status >= 500))) return response;
    const after = Number(response?.headers.get("retry-after"));
    await new Promise((r) => setTimeout(r, after > 0 ? Math.min(after, 60) * 1000 : 2000 * 2 ** attempt));
  }
}

/**
 * Two shapes cover what this needs: Anthropic's Messages API, and anything
 * OpenAI-compatible, which is how a local model on this machine is served.
 */
export function anthropic(options: {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  fetch?: typeof globalThis.fetch;
}): Complete {
  const send = options.fetch ?? globalThis.fetch;
  return async (system, messages) => {
    const response = await patient(send, "https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": options.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: options.model ?? "claude-sonnet-5-5",
        max_tokens: options.maxTokens ?? 1024,
        ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
        ...(options.topP !== undefined ? { top_p: options.topP } : {}),
        // The world and the rules never change; let the provider cache them.
        system: [
          { type: "text", text: system, cache_control: { type: "ephemeral" } },
        ],
        messages,
      }),
    });
    if (!response.ok)
      throw Error(
        `Anthropic refused the turn: ${response.status} ${(
          await response.text()
        ).slice(0, 200)}`,
      );
    const body = (await response.json()) as {
      content: { type: string; text?: string }[];
    };
    return body.content
      .filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("");
  };
}

export function openaiCompatible(options: {
  baseUrl: string;
  apiKey?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  seed?: number;
  structured?: boolean;
  fetch?: typeof globalThis.fetch;
}): Complete {
  const send = options.fetch ?? globalThis.fetch;
  return async (system, messages: Message[]) => {
    const response = await patient(
      send,
      `${options.baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(options.apiKey
            ? { Authorization: `Bearer ${options.apiKey}` }
            : {}),
        },
        body: JSON.stringify({
          model: options.model,
          // OpenAI's own current models refuse max_tokens; local servers expect it.
          [/^https:\/\/api\.openai\.com\//.test(options.baseUrl) ? "max_completion_tokens" : "max_tokens"]: options.maxTokens ?? 1024,
          ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
          ...(options.topP !== undefined ? { top_p: options.topP } : {}),
          ...(options.seed !== undefined ? { seed: options.seed } : {}),
          ...(options.structured ? { response_format: { type: "json_schema", json_schema: {
            name: "agent_reply", strict: false,
            schema: { anyOf: [decisionJson, { type: "object", properties: { diary: { type: "string" } }, required: ["diary"], additionalProperties: false }] },
          } } } : {}),
          messages: [{ role: "system", content: system }, ...messages],
        }),
      },
    );
    if (!response.ok)
      throw Error(
        `The model refused the turn: ${response.status} ${(
          await response.text()
        ).slice(0, 200)}`,
      );
    const body = (await response.json()) as {
      choices: { message: { content: string } }[];
    };
    return body.choices[0]?.message.content ?? "";
  };
}
