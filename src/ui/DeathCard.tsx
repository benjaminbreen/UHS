import { formatHistoricalYear } from "../core/calendar";
import { kinWord } from "../core/concerns";
import { kinOf } from "../core/kin";
import type { Runtime } from "../runtime/session";
import { CharacterSprite } from "./CharacterSprite";
import { inWords } from "../core/concerns";
import { typicalDeathAge } from "../core/time/mortality";
import "./time/time.css";

const counted = (n: number) => (n === 1 ? "one" : inWords(n));
function children(born: number, living: number) {
  if (born === 1) return living ? "Your only child outlived you." : "Your only child died before you.";
  if (living === born) return `All ${counted(born)} of your children outlived you.`;
  if (!living) return `None of your ${counted(born)} children outlived you.`;
  return `${counted(living).replace(/^./, (c) => c.toUpperCase())} of your ${counted(born)} children outlived you.`;
}

/** The end of a life: who died, of what, how old, where and when; then going
 * on as one of the household, or closing the life. */
export function DeathCard({ runtime, onClose }: { runtime: Runtime; onClose: () => void }) {
  const engine = runtime.engine, s = engine.state, p = s.player;
  const setting = engine.world.pack.setting;
  const kin = new Map(kinOf(s).map((k) => [k.actor.id, kinWord(k.kind, k.actor)]));
  const heirs = engine.heirs();
  const how = /^(of|in|by|at|under) /.test(p.dead ?? "") ? p.dead : `from ${p.dead}`;
  const history = s.households?.find((h) => h.id === p.householdId)?.history ?? [];
  const child = (e: { as?: string }) => e.as === "son" || e.as === "daughter";
  const born = history.filter((e) => e.kind === "born" && child(e)).length;
  const lost = history.filter((e) => e.kind === "died" && child(e)).length;
  const partner = kinOf(s).find((k) => k.kind === "partner")?.actor;
  const typical = setting && (p.age ?? 0) >= 20 ? typicalDeathAge(setting.year, setting) : undefined;
  const summary = [
    born ? children(born, Math.max(0, born - lost)) : "",
    partner ? `${partner.name.split(" ")[0]} outlived you.` : "",
    typical ? `Most people here who reached twenty lived to about ${typical}. You lived to ${p.age}.` : "",
  ].filter(Boolean);
  return (
    <div className="collapse-notice death-card" role="alertdialog" aria-label={`${p.name} has died`}>
      <div>
        <small>A LIFE ENDS</small>
        <span className="death-portrait">
          <CharacterSprite appearance={runtime.appearanceFor(p)} age={p.age} portrait />
        </span>
        <h2>{p.name}</h2>
        <p>
          Died {how}, aged {p.age}.
          <br />
          {setting?.location ?? engine.world.pack.name}
          {setting ? `, ${formatHistoricalYear(setting.year)}` : ""}
        </p>
        {summary.length > 0 && <p className="death-summary">{summary.join(" ")}</p>}
        {heirs.length > 0 && (
          <>
            <small>GO ON AS</small>
            <ul className="death-heirs">
              {heirs.map((a) => (
                <li key={a.id}>
                  <button onClick={() => runtime.command({ type: "become", heir: a.id })}>
                    <span className="death-heir-portrait">
                      <CharacterSprite appearance={runtime.appearanceFor(a)} age={a.age} portrait />
                    </span>
                    <span>
                      <b>{a.name.split(" ")[0]}</b>
                      <em>{kin.get(a.id) ? `your ${kin.get(a.id)}` : "of the household"}, {a.age}</em>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        <button className="death-close" autoFocus={!heirs.length} onClick={onClose}>
          Close this life
        </button>
      </div>
    </div>
  );
}
