import type { ChronicleTurn } from "./chronicle";
import type { Evaluate, Question } from "./jev";

/**
 * What we want to know about a recorded turn. Each question is atomic, and
 * they are answered in parallel against one state.
 */
export const RUBRIC: Record<string, Question> = {
  anachronism: {
    type: "noul",
    instructions:
      "Judge only against the stated place and date. Does this turn involve a material, technique, food, institution, idea or word that did not exist there and then?",
    criteria: {
      true: "Something in the action or the reasoning is out of period for this place and date.",
      false: "Everything named would have been available in this place at this date.",
    },
  },
  outsideKnowledge: {
    type: "noul",
    instructions:
      "The character knows only what they could see, be told, or have learned by living there. Does the stated reasoning rely on anything else?",
    criteria: {
      true: "The reasoning uses grid coordinates, game mechanics, statistics, hindsight, or facts about people and places the character has not encountered.",
      false: "The reasoning stays inside what the character could plausibly know.",
    },
  },
  plausibility: {
    type: "score",
    instructions:
      "How plausibly is this what a person of this role and standing would be doing at this hour, in this season and weather?",
    criteria: [
      "Implausible: nobody of this role would do this here, at this hour.",
      "Doubtful: conceivable, but it cuts against the obligations of the role.",
      "Unremarkable: neither characteristic nor odd.",
      "Fitting: the sort of thing this role does at this hour.",
      "Characteristic: exactly what the day of such a person is made of.",
    ],
  },
  purpose: {
    type: "choice",
    instructions:
      "What does this turn serve? Judge by the action and its reasoning, not by the outcome.",
    criteria: {
      subsistence: "Food, water, fuel, shelter, tending animals or crops.",
      work: "The craft or labour of the character's own trade.",
      household: "Kin, dependents, domestic order, the household's property.",
      social: "Obligation, standing, hospitality, dispute, reputation.",
      religious: "Ritual, offering, the dead, the holy.",
      exchange: "Trade, debt, payment, market dealing.",
      curiosity: "Looking, asking, going to see, with no other end.",
      aimless: "No discernible end; wandering or idling.",
    },
  },
};

/** A turn worth a call. Walking and idling are not decisions. */
export const judgeable = (turn: ChronicleTurn) =>
  turn.status !== "rejected" &&
  (!!turn.rationale ||
    (turn.command.type !== "move" &&
      turn.command.type !== "pass" &&
      turn.command.type !== "wait"));

const hour = (clock: number) => {
  const h = Math.floor(clock / 3600) % 24;
  return `day ${Math.floor(clock / 86400) + 1}, hour ${h}`;
};

/** Every turn carries the world card, so the item catalog is not worth its
 * tokens: the scene already names what is in reach. */
const trimCard = (card: string) =>
  card.replace(/\n*Item catalog ids:.*$/s, "").trimEnd();

/** The turns worth a call, each with the last scene established before it. */
export function judgeJobs(turns: ChronicleTurn[]) {
  let scene: string | undefined;
  const jobs: { turn: ChronicleTurn; index: number; scene?: string }[] = [];
  turns.forEach((turn, index) => {
    if (turn.scene) scene = turn.scene;
    if (judgeable(turn)) jobs.push({ turn, index, scene });
  });
  return jobs;
}

/** The state Jev judges: the world, the character, and this one turn. */
export function turnState(turn: ChronicleTurn, card: string, scene?: string) {
  return {
    world: trimCard(card),
    when: hour(turn.clock),
    scene,
    did: turn.command,
    intent: turn.rationale?.intent,
    reasoning: turn.rationale?.reasoning,
    happened: turn.events,
  };
}

export type TurnReview = {
  index: number;
  clock: number;
  summary: string;
  anachronism: number;
  outsideKnowledge: number;
  plausibility: number;
  plausibilityConfidence: number;
  purpose: string;
  purposeConfidence: number;
};

export type Review = {
  turns: TurnReview[];
  inputTokens: number;
  calls: number;
};

/** Grade each deciding turn. The scene carries forward, because a turn is only
 * plausible relative to where the character was standing. */
export async function reviewChronicle(
  turns: ChronicleTurn[],
  card: string,
  evaluate: Evaluate,
  options: { concurrency?: number } = {},
): Promise<Review> {
  const queue = judgeJobs(turns);
  const reviews: TurnReview[] = [];
  let inputTokens = 0;
  let next = 0;
  const limit = options.concurrency ?? 4;
  const workers = Array.from({ length: Math.min(limit, queue.length) }, () =>
    (async () => {
      for (let job = queue[next++]; job; job = queue[next++]) {
        const result = await evaluate(
          turnState(job.turn, card, job.scene),
          RUBRIC,
        );
        const a = result.answers;
        if (
          a.anachronism?.type !== "noul" ||
          a.outsideKnowledge?.type !== "noul" ||
          a.plausibility?.type !== "score" ||
          a.purpose?.type !== "choice"
        )
          throw Error("Jev answered with an unexpected shape.");
        inputTokens += result.usage.input_tokens;
        reviews.push({
          index: job.index,
          clock: job.turn.clock,
          summary:
            job.turn.rationale?.intent ?? JSON.stringify(job.turn.command),
          anachronism: a.anachronism.noul,
          outsideKnowledge: a.outsideKnowledge.noul,
          plausibility: a.plausibility.score,
          plausibilityConfidence: a.plausibility.confidence,
          purpose: a.purpose.choice,
          purposeConfidence: a.purpose.confidence,
        });
      }
    })(),
  );
  await Promise.all(workers);
  reviews.sort((a, b) => a.index - b.index);
  return { turns: reviews, inputTokens, calls: reviews.length };
}

const mean = (xs: number[]) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

/** Flagged turns first, then how the day was actually spent. */
export function renderReview(review: Review, flagAt = 0.5): string {
  const flagged = review.turns.filter(
    (t) => t.anachronism >= flagAt || t.outsideKnowledge >= flagAt,
  );
  const weak = review.turns
    .filter((t) => t.plausibility <= 2 && !flagged.includes(t))
    .sort((a, b) => a.plausibility - b.plausibility);
  const purposes = new Map<string, number>();
  for (const t of review.turns)
    purposes.set(t.purpose, (purposes.get(t.purpose) ?? 0) + 1);

  const lines = [
    "# Review",
    "",
    `${review.calls} deciding turns judged · mean plausibility ${mean(
      review.turns.map((t) => t.plausibility),
    ).toFixed(2)} of 5 · ${review.inputTokens} input tokens ($${(
      (review.inputTokens * 0.042) /
      1e6
    ).toFixed(5)})`,
    "",
  ];
  lines.push("## Flagged", "");
  if (!flagged.length) lines.push("Nothing out of period or outside the character's knowledge.", "");
  for (const t of flagged)
    lines.push(
      `- **turn ${t.index}** ${t.summary} — ${
        t.anachronism >= flagAt
          ? `anachronism ${t.anachronism.toFixed(2)}`
          : ""
      }${t.anachronism >= flagAt && t.outsideKnowledge >= flagAt ? ", " : ""}${
        t.outsideKnowledge >= flagAt
          ? `outside knowledge ${t.outsideKnowledge.toFixed(2)}`
          : ""
      }`,
    );
  if (weak.length) {
    lines.push("", "## Least plausible", "");
    for (const t of weak.slice(0, 10))
      lines.push(
        `- **turn ${t.index}** ${t.summary} — ${t.plausibility} of 5 (confidence ${t.plausibilityConfidence.toFixed(2)})`,
      );
  }
  lines.push("", "## How the time went", "");
  for (const [purpose, count] of [...purposes].sort((a, b) => b[1] - a[1]))
    lines.push(
      `- ${purpose}: ${count} turn${count === 1 ? "" : "s"} (${Math.round(
        (count / review.calls) * 100,
      )}%)`,
    );
  return lines.join("\n") + "\n";
}
