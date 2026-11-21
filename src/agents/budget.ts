export const DEFAULT_MAX_USD = 1;

export class BudgetExceededError extends Error {
  constructor(
    readonly spentUsd: number,
    readonly maxUsd: number,
    detail?: string,
  ) {
    super(
      `API spend cap reached ($${spentUsd.toFixed(4)} / $${maxUsd.toFixed(2)}).${detail ? ` ${detail}` : ""}`,
    );
    this.name = "BudgetExceededError";
  }
}

export type TokenUsage = {
  in: number;
  out: number;
  cacheRead?: number;
  cacheWrite?: number;
};

type Rates = { in: number; out: number; cacheRead?: number; cacheWrite?: number };

// USD per 1M tokens. Unknown models fall back to a conservative rate so a new
// model name cannot silently bypass the dollar cap.
const RATES: [RegExp, Rates][] = [
  [/claude-opus/i, { in: 15, out: 75, cacheRead: 1.5, cacheWrite: 18.75 }],
  [/claude-sonnet/i, { in: 3, out: 15, cacheRead: 0.3, cacheWrite: 3.75 }],
  [/claude-haiku/i, { in: 1, out: 5, cacheRead: 0.1, cacheWrite: 1.25 }],
  [/gpt-6-luna|gpt-5-nano|gpt-4o-mini|gpt-4\.1-mini|gpt-4\.1-nano/i, { in: 0.4, out: 1.6 }],
  [/gpt-5|gpt-4|o1|o3|o4/i, { in: 5, out: 15 }],
  [/gemini.*flash-lite/i, { in: 0.1, out: 0.4 }],
  [/gemini.*flash/i, { in: 0.3, out: 2.5 }],
  [/gemini.*pro/i, { in: 2.5, out: 10 }],
  [/jev/i, { in: 0.05, out: 0.05 }],
];
const FALLBACK_RATES: Rates = { in: 5, out: 15 };

export function isLocalUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
  } catch {
    return false;
  }
}

export function ratesFor(model = ""): Rates {
  for (const [pattern, rates] of RATES) if (pattern.test(model)) return rates;
  return FALLBACK_RATES;
}

export function parseUsage(body: unknown): TokenUsage | undefined {
  if (!body || typeof body !== "object") return undefined;
  const b = body as Record<string, any>;
  const u = b.usage ?? b.usageMetadata;
  if (!u || typeof u !== "object") return undefined;
  if (typeof u.prompt_tokens === "number" || typeof u.completion_tokens === "number") {
    const cached = u.prompt_tokens_details?.cached_tokens ?? 0;
    return {
      in: Math.max(0, (u.prompt_tokens ?? 0) - cached),
      out: u.completion_tokens ?? 0,
      cacheRead: cached,
    };
  }
  if (typeof u.input_tokens === "number" || typeof u.output_tokens === "number") {
    return {
      in: u.input_tokens ?? 0,
      out: u.output_tokens ?? 0,
      cacheRead: u.cache_read_input_tokens ?? 0,
      cacheWrite: u.cache_creation_input_tokens ?? 0,
    };
  }
  if (typeof u.promptTokenCount === "number" || typeof u.candidatesTokenCount === "number") {
    return {
      in: u.promptTokenCount ?? 0,
      out: u.candidatesTokenCount ?? 0,
      cacheRead: u.cachedContentTokenCount ?? 0,
    };
  }
  return undefined;
}

export function costForUsage(model: string, usage: TokenUsage, url = ""): number {
  if (url && isLocalUrl(url)) return 0;
  const r = ratesFor(model);
  return (
    (usage.in * r.in +
      usage.out * r.out +
      (usage.cacheRead ?? 0) * (r.cacheRead ?? r.in * 0.1) +
      (usage.cacheWrite ?? 0) * (r.cacheWrite ?? r.in * 1.25)) /
    1_000_000
  );
}

function modelFrom(text: string | undefined, url: string): string {
  if (text) {
    try {
      const parsed = JSON.parse(text) as { model?: unknown };
      if (typeof parsed.model === "string") return parsed.model;
    } catch {
      // Ignore non-JSON bodies.
    }
  }
  const gemini = /\/models\/([^/:?]+)/.exec(url);
  return gemini?.[1] ?? "";
}

export class SpendBudget {
  spentUsd = 0;
  calls = 0;
  tokens = { in: 0, out: 0 };

  constructor(readonly maxUsd = DEFAULT_MAX_USD) {
    if (!Number.isFinite(maxUsd) || maxUsd < 0)
      throw Error(`Invalid USD budget: ${maxUsd}`);
  }

  remainingUsd() {
    return Math.max(0, this.maxUsd - this.spentUsd);
  }

  wrap(send: typeof fetch, defaultModel = ""): typeof fetch {
    return async (input, init) => {
      const url = String(input);
      if (isLocalUrl(url)) return send(input, init);
      const bodyText = typeof init?.body === "string" ? init.body : undefined;
      const model = modelFrom(bodyText, url) || defaultModel;
      const estInput = bodyText ? Math.ceil(bodyText.length / 3.5) : 0;
      const estCost = costForUsage(model, { in: estInput, out: 0 }, url);
      if (this.spentUsd >= this.maxUsd || this.spentUsd + estCost > this.maxUsd) {
        throw new BudgetExceededError(
          this.spentUsd,
          this.maxUsd,
          `Refused request to ${model || url} (estimated +$${estCost.toFixed(4)}).`,
        );
      }
      const response = await send(input, init);
      this.calls++;
      let parsed: unknown;
      let raw = "";
      try {
        raw = await response.clone().text();
        parsed = JSON.parse(raw);
      } catch {
        // Non-JSON error body; still charge nothing if request failed.
      }
      if (response.ok) {
        const resModel = (parsed as { model?: string } | undefined)?.model || model;
        const usage = parseUsage(parsed) ?? {
          in: estInput,
          out: Math.ceil(raw.length / 4),
        };
        this.tokens.in += usage.in + (usage.cacheRead ?? 0) + (usage.cacheWrite ?? 0);
        this.tokens.out += usage.out;
        this.spentUsd += costForUsage(resModel, usage, url);
      }
      return response;
    };
  }
}
