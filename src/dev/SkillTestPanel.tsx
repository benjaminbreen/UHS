import { X } from "lucide-react";
import type { Engine } from "../core/engine";
import { MAX_LEVEL, SKILLS, levelOf, skillIds, xpFor, type SkillId } from "../core/skills";
import { TECHNIQUES, techniqueIds, type TechniqueId } from "../core/techniques";

/** Set any skill's level and learn or forget any technique, to try both the
 * choice screens and what each technique does in play. */
export function SkillTestPanel({
  engine,
  onChange,
  onClose,
}: {
  engine: Engine;
  onChange: () => void;
  onClose: () => void;
}) {
  const skills = engine.skills();
  const known = (engine.state.player.techniques ??= []);
  // Raising goes through grantXp, so the toast, chime and choice all fire.
  const raise = (id: SkillId) => {
    const level = levelOf(skills[id]);
    if (level >= MAX_LEVEL) return;
    skills[id] = xpFor(level + 1) - 0.5;
    engine.grantXp(id, 1);
    onChange();
  };
  const lower = (id: SkillId) => {
    const level = levelOf(skills[id]);
    skills[id] = level > 0 ? xpFor(level - 1) : 0;
    onChange();
  };
  const toggle = (id: TechniqueId) => {
    const at = known.indexOf(id);
    if (at >= 0) known.splice(at, 1);
    else known.push(id);
    onChange();
  };
  const setAll = (level: number) => {
    for (const id of skillIds) skills[id] = xpFor(level);
    onChange();
  };
  return (
    <aside className="live-graphics-panel combat-test-panel skill-test-panel" aria-label="Skill test">
      <header>
        <div>
          <span>DEVELOPER</span>
          <strong>Skill test</strong>
        </div>
        <button aria-label="Close skill test" onClick={onClose}>
          <X size={16} />
        </button>
      </header>
      <section className="live-animal-controls">
        <p>+ raises a level the way play does, so a milestone brings up its choice. Ticking a technique learns it outright.</p>
        <div className="live-animal-actions">
          <button onClick={() => setAll(0)}>All to 0</button>
          <button onClick={() => setAll(6)}>All to 6</button>
          <button onClick={() => { known.length = 0; onChange(); }}>Forget all</button>
        </div>
      </section>
      {skillIds.map((id) => (
        <section key={id} className="live-animal-controls skill-test-skill">
          <div className="skill-test-head">
            <strong>{SKILLS[id].name}</strong>
            <button onClick={() => lower(id)} aria-label={`Lower ${SKILLS[id].name}`}>−</button>
            <output>{levelOf(skills[id])}</output>
            <button onClick={() => raise(id)} aria-label={`Raise ${SKILLS[id].name}`}>+</button>
          </div>
          {techniqueIds
            .filter((t) => TECHNIQUES[t].skill === id)
            .map((t) => {
              const def = TECHNIQUES[t] as { name: string; tier: number; does: string; ready?: false };
              return (
                <label key={t} data-off={def.ready === false || undefined} title={def.does}>
                  <input
                    type="checkbox"
                    checked={known.includes(t)}
                    disabled={def.ready === false}
                    onChange={() => toggle(t)}
                  />
                  <small>{def.tier}</small> {def.name}
                  {def.ready === false && <em> · not built</em>}
                </label>
              );
            })}
        </section>
      ))}
    </aside>
  );
}
