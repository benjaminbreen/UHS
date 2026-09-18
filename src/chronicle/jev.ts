/**
 * Client for TypeSafe's Jev, a model that answers typed questions about a
 * state instead of generating text. Used here to grade playthrough records.
 * https://docs.typesafe.ai/api.md
 */
export type Question =
  | { type: "noul"; instructions: string; criteria: { true: string; false: string } }
  | { type: "choice"; instructions: string; criteria: Record<string, string | null> }
  | { type: "score"; instructions: string; criteria: string[] };

export type Answer =
  | { type: "noul"; noul: number }
  | { type: "choice"; choice: string; probabilities: Record<string, number>; confidence: number }
  | {
      type: "score";
      score: number;
      legend: Record<string, string>;
      probabilities: Record<string, number>;
      confidence: number;
    };

export type Evaluation = {
  model: string;
  answers: Record<string, Answer>;
  usage: { input_tokens: number; output_tokens: number };
};

export type Evaluate = (
  state: unknown,
  questions: Record<string, Question>,
) => Promise<Evaluation>;

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
/** The docs ask for exponential backoff on 429 and 529 rather than a retry. */
const RETRY = [500, 2000, 6000];

export function jev(options: {
  apiKey: string;
  model?: string;
  endpoint?: string;
  fetch?: typeof globalThis.fetch;
}): Evaluate {
  const send = options.fetch ?? globalThis.fetch;
  return async (state, questions) => {
    let last = "";
    for (let attempt = 0; attempt <= RETRY.length; attempt++) {
      const response = await send(options.endpoint ?? ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: options.model ?? "jev-latest",
          state,
          questions,
        }),
      });
      if (response.ok) return (await response.json()) as Evaluation;
      last = `${response.status} ${(await response.text()).slice(0, 200)}`;
      if (response.status !== 429 && response.status !== 529) break;
      if (attempt < RETRY.length)
        await new Promise((r) => setTimeout(r, RETRY[attempt]));
    }
    throw Error(`Jev refused the evaluation: ${last}`);
  };
}
