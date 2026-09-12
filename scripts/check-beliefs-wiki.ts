/** Checks every Wikipedia link in the belief data against the live API.
 * `npx tsx scripts/check-beliefs-wiki.ts [--fix]` — with --fix, a dead
 * power-level link is dropped so the power falls back to its system's article,
 * and a dead system-level link is reported for a person to fix. */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { beliefSystems } from "../src/content/beliefs/index";

const dir = "src/content/beliefs/systems";
const fix = process.argv.includes("--fix");
const title = (url: string) =>
  decodeURIComponent(url.split("/wiki/")[1] ?? "").replace(/_/g, " ");

const links = new Map<string, string[]>();
for (const system of beliefSystems) {
  const add = (url: string | undefined, what: string) => {
    if (!url) return;
    const list = links.get(url) ?? [];
    list.push(what);
    links.set(url, list);
  };
  add(system.wiki, `${system.id} (system)`);
  for (const power of system.powers)
    add(power.wiki, `${system.id}/${power.name}`);
}
console.log(`${links.size} distinct links`);

const dead: string[] = [];
const urls = [...links.keys()];
for (let i = 0; i < urls.length; i += 40) {
  const batch = urls.slice(i, i + 40);
  const query = batch.map(title).join("|");
  // The API rate-limits an unidentified client hard, and the limit is a moving
  // window, so back off and retry rather than pausing a fixed amount.
  let body:
    | {
        query: { pages: Record<string, { title: string; missing?: string }> };
      }
    | undefined;
  for (let attempt = 0; attempt < 6 && !body; attempt++) {
    if (i || attempt)
      await new Promise((done) => setTimeout(done, attempt ? 15000 : 1500));
    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&titles=${encodeURIComponent(query)}`,
      { headers: { "user-agent": "UHS-belief-link-check/1.0 (local dev)" } },
    );
    const text = await response.text();
    if (text.startsWith("{")) body = JSON.parse(text);
    else process.stdout.write(" (rate limited, waiting)");
  }
  if (!body) throw Error("Wikipedia would not answer; try again later.");
  const missing = new Set(
    Object.values(body.query.pages)
      .filter((p) => p.missing !== undefined)
      .map((p) => p.title),
  );
  for (const url of batch) if (missing.has(title(url))) dead.push(url);
  process.stdout.write(
    `\rchecked ${Math.min(i + 40, urls.length)}/${urls.length}`,
  );
}
console.log();

if (!dead.length) {
  console.log("every link resolves");
  process.exit(0);
}
console.log(`\n${dead.length} dead links:`);
for (const url of dead)
  console.log(`  ${title(url)} — ${links.get(url)!.join(", ")}`);

if (!fix) process.exit(1);
const powerLevel = dead.filter(
  (url) => !links.get(url)!.some((w) => w.endsWith("(system)")),
);
let removed = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
  const path = `${dir}/${file}`;
  let source = readFileSync(path, "utf8");
  for (const url of powerLevel) {
    const line = new RegExp(
      `\\n\\s*wiki: "${url.replace(/[.*+?^$()|[\]\\]/g, "\\$&")}",`,
      "g",
    );
    const before = source;
    source = source.replace(line, "");
    if (source !== before) removed++;
  }
  writeFileSync(path, source);
}
console.log(
  `\ndropped ${removed} dead power links; system-level ones need a person`,
);
