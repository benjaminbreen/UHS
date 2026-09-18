import { it, expect, vi } from "vitest";
import { jev, type Evaluation } from "../src/chronicle/jev";
import {
  judgeJobs,
  renderReview,
  reviewChronicle,
} from "../src/chronicle/review";
import type { ChronicleTurn } from "../src/chronicle/chronicle";

const answers = (over: Partial<Record<string, unknown>> = {}) =>
  ({
    model: "jev-1.13.0",
    answers: {
      anachronism: { type: "noul", noul: 0.02 },
      outsideKnowledge: { type: "noul", noul: 0.03 },
      plausibility: {
        type: "score",
        score: 4,
        legend: {},
        probabilities: {},
        confidence: 0.8,
      },
      purpose: {
        type: "choice",
        choice: "subsistence",
        probabilities: {},
        confidence: 0.7,
      },
      ...over,
    },
    usage: { input_tokens: 400, output_tokens: 0 },
  }) as Evaluation;

const reply = (body: Evaluation, status = 200) =>
  new Response(JSON.stringify(body), { status });

const turn = (over: Partial<ChronicleTurn> = {}): ChronicleTurn => ({
  clock: 32400,
  command: { type: "interact", target: "s0-well", action: "drink" },
  status: "completed",
  events: [],
  ...over,
});

it("sends one typed request and reads the answers back", async () => {
  const fetch = vi.fn(async () => reply(answers()));
  const result = await jev({ apiKey: "k", fetch: fetch as never })("state", {});
  const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toBe("https://api.typesafe.ai/v1/systemone");
  expect((init.headers as Record<string, string>).Authorization).toBe(
    "Bearer k",
  );
  expect(JSON.parse(init.body as string)).toMatchObject({
    model: "jev-latest",
    state: "state",
  });
  expect(result.usage.input_tokens).toBe(400);
});

it("backs off on a rate limit but not on a bad key", async () => {
  let calls = 0;
  const limited = vi.fn(async () =>
    ++calls === 1
      ? new Response("slow down", { status: 429 })
      : reply(answers()),
  );
  await expect(
    jev({ apiKey: "k", fetch: limited as never })("s", {}),
  ).resolves.toBeTruthy();
  expect(calls).toBe(2);

  const denied = vi.fn(async () => new Response("nope", { status: 401 }));
  await expect(
    jev({ apiKey: "bad", fetch: denied as never })("s", {}),
  ).rejects.toThrow(/401/);
  expect(denied).toHaveBeenCalledTimes(1);
});

it("judges the deciding turns only, carrying the scene that preceded them", () => {
  const jobs = judgeJobs([
    turn({ command: { type: "move", dx: 1, dy: 0 }, scene: "SCENE first" }),
    turn({ command: { type: "pass", seconds: 60 } }),
    turn(),
    turn({ command: { type: "move", dx: 1, dy: 0 } }),
    turn({ status: "rejected", reason: "The way is blocked." }),
    turn({
      command: { type: "move", dx: 1, dy: 0 },
      rationale: { intent: "Follow the river road" },
    }),
  ]);
  expect(jobs.map((j) => j.index)).toEqual([2, 5]);
  expect(jobs[0].scene).toBe("SCENE first");
});

it("aggregates a review and puts what it flagged first", async () => {
  const evaluate = vi
    .fn()
    .mockResolvedValueOnce(answers())
    .mockResolvedValueOnce(
      answers({
        anachronism: { type: "noul", noul: 0.91 },
        plausibility: {
          type: "score",
          score: 1,
          legend: {},
          probabilities: {},
          confidence: 0.6,
        },
        purpose: {
          type: "choice",
          choice: "aimless",
          probabilities: {},
          confidence: 0.5,
        },
      }),
    );
  const review = await reviewChronicle(
    [turn(), turn({ rationale: { intent: "Buy a clock" } })],
    "WORLD\nA town by the Tiber. 100 CE.",
    evaluate,
    { concurrency: 1 },
  );
  expect(review.calls).toBe(2);
  expect(review.inputTokens).toBe(800);
  // Sent the character's world, not the whole item catalog.
  expect(evaluate.mock.calls[0][0].world).toContain("100 CE");
  expect(evaluate.mock.calls[0][0].world).not.toContain("Item catalog");

  const md = renderReview(review);
  expect(md).toContain("Buy a clock — anachronism 0.91");
  expect(md.indexOf("## Flagged")).toBeLessThan(md.indexOf("## How the time"));
  expect(md).toContain("aimless: 1 turn (50%)");
});
