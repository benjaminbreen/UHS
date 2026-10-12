import { formatHistoricalYear } from "../core/calendar";
import { kinWord } from "../core/concerns";
import { kinOf } from "../core/kin";
import type { Runtime } from "../runtime/session";
import { CharacterSprite } from "./CharacterSprite";

/** The end of a life: who died, of what, how old, where and when; then going
 * on as one of the household, or closing the life. */
export function DeathCard({ runtime, onClose }: { runtime: Runtime; onClose: () => void }) {
  const engine = runtime.engine, s = engine.state, p = s.player;
  const setting = engine.world.pack.setting;
  const kin = new Map(kinOf(s).map((k) => [k.actor.id, kinWord(k.kind, k.actor)]));
  const heirs = engine.heirs();
  const how = /^(of|in|by) /.test(p.dead ?? "") ? p.dead : `from ${p.dead}`;
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
