/** Rebuild listening copies from the exact score + synth used by the map.
 * Requires the Vite server, Chrome, and optional ffmpeg for compact MP3 previews.
 */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { compose, type Arrangement } from "../src/audio/score";

const output = join(process.cwd(), "public/audio/previews");
await mkdir(output, { recursive: true });
const wavOutput = join(process.cwd(), "artifacts/audio");
await mkdir(wavOutput, { recursive: true });
const browser = await chromium.launch(
  process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : { channel: "chrome" },
);
const previews: Arrangement[] = [
  { themeId: "first-green", season: "spring", period: "day", era: "pastoral" },
  { themeId: "long-light", season: "summer", period: "dusk", era: "pastoral" },
  { themeId: "amber-road", season: "autumn", period: "day", era: "pastoral" },
  {
    themeId: "snow-lanterns",
    season: "winter",
    period: "night",
    era: "pastoral",
  },
  ...(["pastoral", "chamber", "electronic"] as const).map((era) => ({
    themeId: "remembered-road",
    season: "spring" as const,
    period: "day" as const,
    era,
  })),
];
const report: object[] = [];
try {
  for (const arrangement of previews) {
    // New page per render releases the offline context's instrument cache promptly.
    const page = await browser.newPage();
    // An empty same-origin document can import the synth without loading the game
    // or Vite's hot-reload client (asset writes must not interrupt an offline render).
    const renderUrl = new URL(
      "/__audio-render",
      process.env.AUDIO_BASE_URL || "http://127.0.0.1:5173",
    ).href;
    await page.route(renderUrl, (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><title>Soundtrack render</title>",
      }),
    );
    await page.goto(renderUrl);
    const base64 = await page.evaluate(async (config) => {
      const scorePath = "/src/audio/score.ts",
        synthPath = "/src/audio/synth.ts";
      const { compose } = await import(/* @vite-ignore */ scorePath);
      const { renderWav } = await import(/* @vite-ignore */ synthPath);
      const blob = await renderWav(compose(config), {
        melody: 1,
        harmony: 1,
        bass: 1,
        percussion: 1,
      });
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 32768)
        binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
      return btoa(binary);
    }, arrangement);
    const buffer = Buffer.from(base64, "base64");
    const name = `${arrangement.themeId}-${arrangement.period}-${arrangement.era}`;
    const wavPath = join(wavOutput, `${name}.wav`);
    await writeFile(wavPath, buffer);
    let peak = 0,
      squared = 0,
      count = 0,
      clipped = 0;
    for (let i = 44; i < buffer.length; i += 2) {
      const sample = buffer.readInt16LE(i) / 32768;
      peak = Math.max(peak, Math.abs(sample));
      squared += sample * sample;
      count++;
      if (Math.abs(sample) > 0.999) clipped++;
    }
    if (peak < 0.01 || clipped > 0)
      throw Error(
        `Invalid rendered signal for ${name}: peak=${peak}, clipped=${clipped}`,
      );
    execFileSync("ffmpeg", [
      "-y",
      "-loglevel",
      "error",
      "-i",
      wavPath,
      "-codec:a",
      "libmp3lame",
      "-q:a",
      "3",
      join(output, `${name}.mp3`),
    ]);
    const score = compose(arrangement);
    const entry = {
      ...arrangement,
      title: score.theme.title,
      bpm: score.bpm,
      seconds: count / 2 / 44100,
      peak,
      rms: Math.sqrt(squared / count),
      clippedSamples: clipped,
      file: `/audio/previews/${name}.mp3`,
    };
    report.push(entry);
    console.log(JSON.stringify(entry));
    await page.close();
  }
  await writeFile(
    join(output, "manifest.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
} finally {
  await browser.close();
}
