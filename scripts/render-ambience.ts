/** Render the ambience for each listening scene offline, measure it, and draw
 * it as a spectrogram above the field recordings it should resemble.
 *
 *   npm run audio:ambience                    every scene
 *   npm run audio:ambience -- drizzle-meadow  just these
 *   npm run audio:ambience -- --clap          also score with CLAP (.venv, slow first run)
 *
 * Writes artifacts/audio-review/<scene>.wav and .png, and report.json. Needs
 * Chrome and ffmpeg; no dev server. Reference recordings are downloaded once
 * into artifacts/audio-ref/.
 */
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { launchBrowser } from "./capture/lib";
import { listeningScenes, references, type ReferenceId } from "../src/audio/ambience-scenes";

const SECONDS = Number(process.env.SECONDS ?? 20);
const SR = 44100;
const args = process.argv.slice(2);
const clap = args.includes("--clap");
const wanted = args.filter((a) => !a.startsWith("--"));
const scenes = wanted.length ? listeningScenes.filter((s) => wanted.includes(s.id)) : listeningScenes;
if (!scenes.length) throw Error(`No such scene. Scenes: ${listeningScenes.map((s) => s.id).join(", ")}`);
const out = "artifacts/audio-review",
  refDir = "artifacts/audio-ref";
await mkdir(out, { recursive: true });
await mkdir(join(refDir, "raw"), { recursive: true });

async function fetchReference(id: ReferenceId) {
  const wav = join(refDir, `${id}.wav`);
  if (existsSync(wav)) return wav;
  const { url } = references[id];
  const raw = join(refDir, "raw", id + extname(new URL(url).pathname));
  if (!existsSync(raw)) {
    console.log(`fetching reference ${id}`);
    const res = await fetch(url, { headers: { "user-agent": "UHS-audio-review/1.0" } });
    if (!res.ok) throw Error(`${url}: ${res.status}`);
    await writeFile(raw, Buffer.from(await res.arrayBuffer()));
  }
  const start = "start" in references[id] ? references[id].start : 1;
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", String(start), "-t", String(SECONDS), "-i", raw, "-ar", String(SR), "-ac", "2", "-c:a", "pcm_s16le", wav]);
  return wav;
}

function wavBytes(left: Float32Array, right: Float32Array) {
  const n = left.length,
    buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 4, 40);
  const clamp = (v: number) => Math.round(Math.max(-1, Math.min(1, v)) * 32767);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(clamp(left[i]), 44 + i * 4);
    buf.writeInt16LE(clamp(right[i]), 46 + i * 4);
  }
  return buf;
}
/** Mono samples from a 16-bit stereo WAV; skips whatever chunks precede the data. */
function readMono(buf: Buffer) {
  let at = 12;
  while (buf.toString("ascii", at, at + 4) !== "data") at += 8 + buf.readUInt32LE(at + 4);
  const start = at + 8,
    n = Math.floor(buf.readUInt32LE(at + 4) / 4);
  const mono = new Float32Array(n);
  for (let i = 0; i < n; i++)
    mono[i] = (buf.readInt16LE(start + i * 4) + buf.readInt16LE(start + i * 4 + 2)) / 65536;
  return mono;
}

function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len)
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(ang * k),
          wi = Math.sin(ang * k);
        const a = i + k,
          b = a + len / 2;
        const xr = re[b] * wr - im[b] * wi,
          xi = re[b] * wi + im[b] * wr;
        re[b] = re[a] - xr;
        im[b] = im[a] - xi;
        re[a] += xr;
        im[a] += xi;
      }
  }
}

const ROWS = 140,
  COLS = 700,
  N = 2048,
  HOP = 512,
  LO = 40,
  HI = 18000;
/** Spectrogram on a log frequency axis plus the numbers worth comparing. */
function analyse(x: Float32Array) {
  const frames = Math.floor((x.length - N) / HOP);
  const win = Float64Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
  const rowOf = (bin: number) => {
    const f = (bin * SR) / N;
    return f < LO || f > HI ? -1 : Math.floor((Math.log(f / LO) / Math.log(HI / LO)) * ROWS);
  };
  const grid = Array.from({ length: COLS }, () => new Float64Array(ROWS));
  const bands = [0, 0, 0, 0],
    edges = [300, 1500, 5000];
  let centroidNum = 0,
    centroidDen = 0,
    flatSum = 0;
  const frameDb: number[] = [];
  for (let f = 0; f < frames; f++) {
    const re = new Float64Array(N),
      im = new Float64Array(N);
    for (let i = 0; i < N; i++) re[i] = x[f * HOP + i] * win[i];
    fft(re, im);
    const col = grid[Math.floor((f / frames) * COLS)];
    let logSum = 0,
      sum = 0,
      count = 0,
      total = 0;
    for (let k = 1; k < N / 2; k++) {
      const p = re[k] * re[k] + im[k] * im[k],
        hz = (k * SR) / N;
      const r = rowOf(k);
      if (r >= 0) col[r] = Math.max(col[r], p);
      total += p;
      bands[hz < edges[0] ? 0 : hz < edges[1] ? 1 : hz < edges[2] ? 2 : 3] += p;
      centroidNum += p * hz;
      centroidDen += p;
      if (hz > 100 && hz < 16000) {
        logSum += Math.log(p + 1e-20);
        sum += p;
        count++;
      }
    }
    flatSum += Math.exp(logSum / count) / (sum / count + 1e-20);
    frameDb.push(10 * Math.log10(total + 1e-20));
  }
  // Fill rows a low-frequency bin never lands on from the row below.
  for (const col of grid)
    for (let r = 1; r < ROWS; r++) if (!col[r]) col[r] = col[r - 1];
  const db = grid.map((col) => Array.from(col, (p) => 10 * Math.log10(p + 1e-20)));
  // Distinct drops: 5 ms energy above 2 kHz that jumps over its neighbourhood.
  const hp = new Float32Array(x.length);
  let prev = 0;
  for (let i = 0; i < x.length; i++) {
    hp[i] = 0.88 * ((hp[i - 1] ?? 0) + x[i] - prev);
    prev = x[i];
  }
  const step = Math.round(SR * 0.005),
    env: number[] = [];
  for (let i = 0; i + step <= hp.length; i += step) {
    let e = 0;
    for (let j = i; j < i + step; j++) e += hp[j] * hp[j];
    env.push(Math.sqrt(e / step));
  }
  let drops = 0;
  for (let i = 20; i < env.length - 20; i++) {
    const around = env.slice(i - 20, i + 20).sort((a, b) => a - b)[20];
    if (env[i] > 2.5 * around && env[i] >= env[i - 1] && env[i] > env[i + 1]) drops++;
  }
  const mean = env.reduce((a, b) => a + b, 0) / env.length;
  const sd = Math.sqrt(env.reduce((a, b) => a + (b - mean) ** 2, 0) / env.length);
  // How much the level swells over seconds: gusts, showers, thunder.
  const second = Math.round(SR / HOP),
    secs: number[] = [];
  for (let i = 0; i + second <= frameDb.length; i += second)
    secs.push(10 * Math.log10(frameDb.slice(i, i + second).reduce((a, b) => a + 10 ** (b / 10), 0) / second));
  const sMean = secs.reduce((a, b) => a + b, 0) / secs.length;
  let rms = 0;
  for (const v of x) rms += v * v;
  const totalBands = bands.reduce((a, b) => a + b, 0);
  return {
    db,
    metrics: {
      rmsDb: +(10 * Math.log10(rms / x.length + 1e-20)).toFixed(1),
      centroidHz: Math.round(centroidNum / centroidDen),
      bands: bands.map((b) => Math.round((100 * b) / totalBands)) as number[],
      flatness: +(flatSum / frames).toFixed(3),
      grain: +(sd / mean).toFixed(2),
      dropsPerSec: +(drops / (x.length / SR)).toFixed(1),
      swellDb: +Math.sqrt(secs.reduce((a, b) => a + (b - sMean) ** 2, 0) / secs.length).toFixed(1),
    },
  };
}
type Metrics = ReturnType<typeof analyse>["metrics"];
const describeMetrics = (m: Metrics) =>
  `rms ${m.rmsDb} dB · centroid ${m.centroidHz} Hz · bands <300/–1.5k/–5k/>5k ${m.bands.join("/")}% · flatness ${m.flatness} · grain ${m.grain} · drops ${m.dropsPerSec}/s · swell ${m.swellDb} dB`;

const bundle = await build({
  stdin: {
    contents: `export { renderAmbience, ambienceFor } from "./src/audio/ambience";
      export { listeningScenes } from "./src/audio/ambience-scenes";`,
    resolveDir: process.cwd(),
    loader: "ts",
  },
  bundle: true,
  format: "iife",
  globalName: "UHSAudio",
  write: false,
});

const browser = await launchBrowser();
const report: object[] = [];
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 400 } });
  page.on("pageerror", (e) => console.error("pageerror", e.message));
  // tsx names the functions it passes to evaluate() with a helper the page lacks.
  await page.addScriptTag({ content: "window.__name = (f) => f;" });
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  for (const scene of scenes) {
    const pcm = await page.evaluate(
      async ({ id, seconds }) => {
        const api = (window as never as { UHSAudio: typeof import("../src/audio/ambience") & typeof import("../src/audio/ambience-scenes") }).UHSAudio;
        const s = api.listeningScenes.find((x) => x.id === id)!;
        const buffer = await api.renderAmbience(api.ambienceFor(s.scene), seconds);
        const enc = (a: Float32Array) => {
          const bytes = new Uint8Array(a.buffer.slice(0));
          let bin = "";
          for (let i = 0; i < bytes.length; i += 32768) bin += String.fromCharCode(...bytes.subarray(i, i + 32768));
          return btoa(bin);
        };
        return [enc(buffer.getChannelData(0)), enc(buffer.getChannelData(1))];
      },
      { id: scene.id, seconds: SECONDS },
    );
    const [left, right] = pcm.map((b) => {
      const bytes = Buffer.from(b, "base64");
      return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.length / 4);
    });
    const wav = join(out, `${scene.id}.wav`);
    await writeFile(wav, wavBytes(left, right));
    const rows = [{ label: "Synth", file: wav, ...analyse(Float32Array.from(left, (v, i) => (v + right[i]) / 2)) }];
    for (const id of scene.refs) {
      const file = await fetchReference(id);
      rows.push({ label: `Ref · ${references[id].title}`, file, ...analyse(readMono(await readFile(file))) });
    }
    const png = await page.evaluate(
      ({ title, describe, rows, ROWS, COLS }) => {
        const pad = 10,
          head = 34,
          label = 18,
          axis = 34,
          h = head + rows.length * (ROWS + label + pad);
        const c = document.createElement("canvas");
        c.width = COLS + axis + pad * 2;
        c.height = h;
        const g = c.getContext("2d")!;
        g.fillStyle = "#111";
        g.fillRect(0, 0, c.width, c.height);
        g.fillStyle = "#fff";
        g.font = "bold 14px sans-serif";
        g.fillText(title, pad, 16);
        g.font = "11px sans-serif";
        g.fillStyle = "#aaa";
        g.fillText(`“${describe}”`, pad, 29);
        const stops = [[0, 0, 4], [40, 15, 90], [140, 40, 110], [230, 90, 60], [252, 200, 80], [252, 253, 191]];
        const colour = (t: number) => {
          const x = Math.max(0, Math.min(0.999, t)) * (stops.length - 1),
            i = Math.floor(x),
            f = x - i;
          return stops[i].map((v, k) => Math.round(v + (stops[i + 1][k] - v) * f));
        };
        rows.forEach((row, n) => {
          const top = head + n * (ROWS + label + pad);
          g.fillStyle = n ? "#9cf" : "#fc9";
          g.font = "bold 11px sans-serif";
          g.fillText(row.label, pad, top + 11);
          g.fillStyle = "#ccc";
          g.font = "10px sans-serif";
          g.fillText(row.text, pad + g.measureText(row.label).width + 120, top + 11);
          const max = Math.max(...row.db.map((col) => Math.max(...col)));
          const img = g.createImageData(COLS, ROWS);
          row.db.forEach((col, x) =>
            col.forEach((v, r) => {
              const [R, G, B] = colour((v - max + 75) / 75);
              const p = ((ROWS - 1 - r) * COLS + x) * 4;
              img.data.set([R, G, B, 255], p);
            }),
          );
          g.putImageData(img, pad + axis, top + label);
          g.fillStyle = "#888";
          g.font = "9px sans-serif";
          for (const hz of [100, 1000, 5000, 15000]) {
            const y = top + label + ROWS - (Math.log(hz / 40) / Math.log(18000 / 40)) * ROWS;
            g.fillText(hz >= 1000 ? `${hz / 1000}k` : String(hz), pad, y + 3);
          }
        });
        return c.toDataURL("image/png").split(",")[1];
      },
      {
        title: `${scene.label}  (${scene.id})`,
        describe: scene.describe,
        rows: rows.map((r) => ({ label: r.label, text: describeMetrics(r.metrics), db: r.db })),
        ROWS,
        COLS,
      },
    );
    await writeFile(join(out, `${scene.id}.png`), Buffer.from(png, "base64"));
    const entry = { scene: scene.id, describe: scene.describe, rows: rows.map((r) => ({ label: r.label, file: r.file, ...r.metrics })) };
    report.push(entry);
    console.log(`\n${scene.id}  →  ${join(out, scene.id)}.png`);
    for (const r of rows) console.log(`  ${r.label.padEnd(44).slice(0, 44)} ${describeMetrics(r.metrics)}`);
  }
} finally {
  await browser.close();
}

if (clap) {
  const python = ".venv/bin/python";
  const scores = JSON.parse(
    execFileSync(python, ["scripts/audio/clap_score.py"], {
      input: JSON.stringify({ labels: listeningScenes.map((s) => s.describe), report }),
      maxBuffer: 1 << 24,
      stdio: ["pipe", "pipe", "inherit"],
    }).toString(),
  ) as Record<string, { own: number; rank: number; best: string; decoy: string; decoyScore: number }>;
  console.log("\nCLAP: cosine to its own description, its rank among the scene descriptions, the nearest label of all, and the nearest decoy (static, frying…)");
  for (const entry of report as { scene: string; describe: string; rows: { label: string; file: string; clap?: object }[] }[])
    for (const row of entry.rows) {
      row.clap = scores[row.file];
      const s = scores[row.file];
      console.log(`  ${entry.scene.padEnd(18)} ${row.label.padEnd(40).slice(0, 40)} own ${s.own.toFixed(3)}  rank ${s.rank}/${listeningScenes.length}  best “${s.best}”  decoy “${s.decoy}” ${s.decoyScore.toFixed(3)}`);
    }
}
await writeFile(join(out, "report.json"), JSON.stringify(report, null, 2) + "\n");
