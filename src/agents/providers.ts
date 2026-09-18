import type { Complete, Message } from "./brain";

/**
 * Two shapes cover what this needs: Anthropic's Messages API, and anything
 * OpenAI-compatible, which is how a local model on this machine is served.
 */
export function anthropic(options: {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  fetch?: typeof globalThis.fetch;
}): Complete {
  const send = options.fetch ?? globalThis.fetch;
  return async (system, messages) => {
    const response = await send("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": options.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: options.model ?? "claude-sonnet-5",
        max_tokens: options.maxTokens ?? 1024,
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
  fetch?: typeof globalThis.fetch;
}): Complete {
  const send = options.fetch ?? globalThis.fetch;
  return async (system, messages: Message[]) => {
    const response = await send(
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
          max_tokens: options.maxTokens ?? 1024,
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
