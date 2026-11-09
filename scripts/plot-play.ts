/** Plays one plot several ways and prints every card the player would see.
 *
 * Usage: npm run plot:play -- <plot> <place>:<year> [--seed=a] [--trade=fisher] [--season=summer]
  * Ways: waiting it out, going to any meeting it sets, doing the day's work, talking to each of the cast
 * (before and after work), and taking each answer on its choice cards.
 */
import { createSettingSession } from "../src/runtime/session";
import { startPlot } from "../src/core/plot";
import { PLOTS } from "../src/content/plots";
import { composeIntro, introText } from "../src/core/intro";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import { Engine } from "../src/core/engine";
import { items } from "../src/content/packs";
import type { PlayerCommand } from "../src/core/types";

const args = process.argv.slice(2);
const flag = (k: string) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const [id, where] = args.filter((a) => !a.startsWith("--"));
const template = PLOTS.find((t) => t.id === id);
if (!template || !where) throw Error(`usage: plot:play <plot> <place>:<year>; plots: ${PLOTS.map((t) => t.id).join(" ")}`);
const [placeId, year] = where.split(":");
const place = places.find((p) => p.id === placeId);
if (!place) throw Error(`no place ${placeId}`);
const setting = settingFor(place, Number(year));
delete (setting as { role?: string }).role;
if (flag("season")) setting.season = flag("season") as typeof setting.season;
const base = createSettingSession(setting, flag("seed") ?? "play");
const fresh = () => {
  const e = new Engine(base.world, items, structuredClone(base.state));
  delete e.state.plot;
  if (flag("trade")) e.state.player.origin = { ...e.state.player.origin!, livelihood: flag("trade")! };
  return e;
};

const probe = fresh();
const first = startPlot(probe.state, setting, id);
const p = probe.state.player;
console.log(`${template.id} at ${where}: ${p.name}, ${p.origin?.livelihood}, ${p.age}`);
if (!first) {
  console.log("did not fit (weight 0 or no cast)");
  process.exit(0);
}
console.log(`TITLE ${first.title}\nINTRO ${introText(composeIntro(probe.state, setting))}\nAIM ${probe.state.lifeAim?.text}`);
const roles = Object.keys(first.cast);
const choices = Math.max(1, ...[...template.opening, ...template.developments.flatMap((d) => d.then)]
  .map((e) => (e.type === "choose" ? e.choices.length : 0)));
const ways = ["wait", "go", "work", ...roles.flatMap((r) => [`talk:${r}`, `work,talk:${r}`])];

let serial = 0;
for (const way of ways)
  for (let pick = 0; pick < (choices > 1 ? choices : 1); pick++) {
    const e = fresh();
    const plot = startPlot(e.state, setting, id)!;
    const act = (command: PlayerCommand) => e.act({ actionId: `play-${serial++}`, expectedRevision: e.state.revision, command });
    const start = e.state.clock, seen = new Set<object>(), log: string[] = [];
    const talk = (role: string) => {
      const a = e.state.actors.find((x) => x.id === plot.cast[role]);
      if (!a || a.dead) return log.push(`  (no ${role} to talk to)`);
      a.pos = { ...e.state.player.pos, x: e.state.player.pos.x + 1 };
      act({ type: "interact", target: a.id, action: "talk" });
    };
    const read = () => {
      for (const c of e.cards) {
        if (seen.has(c)) continue;
        seen.add(c);
        const h = ((e.state.clock - start) / 3600).toFixed(1);
        if (c.kind === "title") continue;
        const who = c.speaker && e.state.actors.find((a) => a.id === c.speaker);
        const cast = who && Object.entries(plot.cast).find(([, id]) => id === who.id)?.[0];
        log.push(`  ${h}h ${c.kind}${c.moment ? `[${c.moment}]` : ""}${who ? ` ${cast ?? "(not cast)"} ${who.name}` : ""}: ${c.text}`);
        if (c.choose?.card.startsWith("plot:")) {
          const n = Math.min(pick, c.choose.choices.length - 1);
          log.push(`      choices: ${c.choose.choices.map((x) => x.label + (x.odds ? ` (${Math.round(x.odds * 100)}%)` : "")).join(" | ")} -> ${c.choose.choices[n].label}`);
          act({ type: "choose", card: c.choose.card, choice: n });
          if (e.lastChoice?.card === c.choose.card) log.push(`      => ${e.lastChoice.line}`);
        }
      }
      // The game takes each card off the queue as it shows it; a stale one would block the next choice card.
      e.cards.length = 0;
    };
    for (let step = 0; step < 6 * 60 && !plot.ended; step++) {
      read();
      if (way === "go" && plot.gathering && !plot.fired.includes("came") && e.state.clock < plot.gathering.until) {
        act({ type: "attend" });
        log.push(`  ${((e.state.clock - start) / 3600).toFixed(1)}h (went to ${plot.gathering.label})`);
        read();
      }
      if (step === 6)
        for (const part of way.split(",")) {
          if (part === "work") {
            plot.fired.push("worked");
            log.push("  (finished the day's work)");
          } else if (part.startsWith("talk:")) talk(part.slice(5));
        }
      act({ type: "wait", seconds: 600 });
    }
    read();
    const h = ((e.state.clock - start) / 3600).toFixed(1);
    console.log(`\n== ${way}${choices > 1 ? ` / answer ${pick + 1}` : ""}: ${plot.ended ? `ENDED ${plot.ended} at ${h}h` : `NOT ENDED after ${h}h`}`);
    console.log(log.join("\n"));
  }
