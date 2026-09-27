/** One screenshot of the running game.
 *
 * Usage: npm run shot -- [out.png] ["a prompt"]
 *        npm run shot -- artifacts/ostia.png "A Roman baker in Ostia, 100 CE"
 *
 * Starts the dev server itself if nothing is listening, and stops it again on
 * the way out; an already-running server is left alone. This is the supported
 * way to look at the game. Prefer it to writing another capture script.
 */
import { launchBrowser } from "./capture/lib";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const [out = "artifacts/shot.png", prompt = "A Roman baker in Ostia, 100 CE", review] =
  process.argv.slice(2);
const base = process.env.UHS_URL ?? "http://127.0.0.1:5173";

const up = async () => {
  try {
    return (await fetch(base, { signal: AbortSignal.timeout(1000) })).ok;
  } catch {
    return false;
  }
};

let server: ReturnType<typeof spawn> | undefined;
if (!(await up())) {
  console.log(`no server at ${base}; starting one`);
  server = spawn("npx", ["vite", "--host", "127.0.0.1"], { stdio: "ignore" });
  // Vite is usually listening in well under a second, but a cold optimize
  // pass can take longer on a fresh checkout.
  const deadline = Date.now() + 60000;
  while (!(await up())) {
    if (Date.now() > deadline) throw Error("dev server never came up");
    await new Promise((r) => setTimeout(r, 500));
  }
}

const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.on("pageerror", (e) => console.error("pageerror", e.message));
  await page.goto(base);
  await page.getByPlaceholder(/A hunter in Anatolia/).fill(prompt);
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  // A prompt that only partly matches opens the details dialog, whose own
  // Begin starts play; one that matches outright starts at once.
  const confirm = page
    .getByRole("dialog")
    .getByRole("button", { name: "Begin", exact: true });
  await Promise.race([
    confirm.click({ timeout: 15000 }).catch(() => {}),
    page.waitForFunction(() => !!(window as any).historySim, null, {
      timeout: 15000,
    }),
  ]).catch(() => {});
  // The arrival card holds play until "Enter life" is pressed.
  await page
    .getByRole("button", { name: /Enter life/ })
    .click({ timeout: 120000 });
  await page.waitForFunction(() => !!(window as any).historySim, null, {
    timeout: 30000,
  });
  await page.waitForSelector(".game-container canvas", { timeout: 30000 });
  // Let the first frames settle so the shot is not of a half-drawn world.
  await page.waitForTimeout(2500);
  // UHS_AT="x,y" stands the player on that cell first (needs the dev server).
  if (process.env.UHS_AT) {
    const [x, y] = process.env.UHS_AT.split(",").map(Number);
    await page.evaluate(
      ([x, y]) => {
        const r = (window as any).__uhs;
        r.engine.state.player.pos = { x, y, space: "outside" };
        r.emit();
      },
      [x, y],
    );
    await page.waitForTimeout(4000);
  }
  // UHS_KEYS="m" opens the region map, and so on for any key the game binds.
  for (const key of process.env.UHS_KEYS ?? "") {
    await page.keyboard.press(key);
    await page.waitForTimeout(4000);
  }
  mkdirSync(dirname(out), { recursive: true });
  // A live collision study, using the same commands as movement input.
  if (review === "--toppling") {
    const dir = await page.evaluate(() => {
      const r = (window as any).__uhs, e = r.engine, p = e.state.player.pos;
      r.stop();
      const dir = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) =>
        !e.blocked(p.x + dx, p.y + dy, p.space) && e.playerCanCross(p, { x: p.x + dx, y: p.y + dy }));
      if (!dir) throw Error("No clear approach for the toppling study");
      e.state.objects.push({ id: "toppling-study", prop: "romanMilestone", name: "Roman milestone",
        kind: "monument", sprite: "study-propb-roman-milestone-0", inventory: {},
        pos: { ...p, x: p.x + dir[0], y: p.y + dir[1] } });
      r.emit();
      return dir;
    });
    for (const [state, run] of [["lean", true], ["fallen", false]] as const) {
      await page.evaluate(([dx, dy, run]) => {
        const result = (window as any).__uhs.command({ type: "move", dx, dy, run });
        if (result.status !== "completed") throw Error("Toppling study collision was refused");
      }, [dir[0], dir[1], run]);
      await page.waitForFunction((state) => {
        const sprite = (window as any).uhsGame.scene.getScene("world").entities.get("toppling-study");
        return sprite?.frame.name.includes(state);
      }, state);
      await page.waitForTimeout(400);
      await page.screenshot({ path: out.replace(/\.png$/, `-${state}.png`) });
    }
  }
  await page.screenshot({ path: out });
  console.log(`wrote ${out}`);
} finally {
  await browser.close();
  server?.kill();
}
