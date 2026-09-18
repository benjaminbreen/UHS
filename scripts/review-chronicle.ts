/**
 * Grade a playthrough record for period plausibility.
 *   npx tsx scripts/review-chronicle.ts runs/<id>.jsonl [--out review.md] [--dry]
 * Needs TYPESAFE_API_KEY unless --dry, which prints one payload and the cost.
 */
import { readFileSync, writeFileSync } from "node:fs";
import type { ChronicleTurn } from "../src/chronicle/chronicle";
import { jev } from "../src/chronicle/jev";
import {
  RUBRIC,
  judgeJobs,
  renderReview,
  reviewChronicle,
  turnState,
} from "../src/chronicle/review";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i < 0 ? undefined : args[i + 1];
};
const path = args.find((a) => !a.startsWith("--"));
if (!path) throw Error("Name a chronicle .jsonl file.");

const lines = readFileSync(path, "utf8").split("\n").filter(Boolean);
const first = JSON.parse(lines[0]) as { card?: string };
if (!first.card)
  throw Error("This chronicle has no header line; re-run the playthrough.");
const turns = lines.slice(1).map((l) => JSON.parse(l) as ChronicleTurn);
const deciding = judgeJobs(turns);

if (args.includes("--dry")) {
  const sample = turnState(deciding[0].turn, first.card, deciding[0].scene);
  const tokens =
    deciding.length *
    Math.round(
      (JSON.stringify(sample).length + JSON.stringify(RUBRIC).length) / 4,
    );
  process.stdout.write(
    `${turns.length} turns, ${deciding.length} deciding.\n` +
      `Estimated ${tokens} input tokens, about $${((tokens * 0.042) / 1e6).toFixed(5)}.\n\n` +
      `One state:\n${JSON.stringify(sample, null, 2)}\n`,
  );
  process.exit(0);
}

const apiKey = process.env.TYPESAFE_API_KEY;
if (!apiKey) throw Error("Set TYPESAFE_API_KEY, or pass --dry.");
const review = await reviewChronicle(turns, first.card, jev({ apiKey }));
const out = flag("--out") ?? path.replace(/\.jsonl$/, "-review.md");
writeFileSync(out, renderReview(review));
writeFileSync(
  out.replace(/\.md$/, ".json"),
  JSON.stringify(review, null, 2) + "\n",
);
process.stdout.write(`${renderReview(review)}\nWritten to ${out}\n`);
