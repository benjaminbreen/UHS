import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ItemDef } from "../core/types";
import type { Runtime } from "../runtime/session";
import { ItemIcon } from "./components";
import { gameAudio } from "../audio/director";
import { Turntable, itemKind } from "./ItemInspect";

const ideas = (a: ItemDef, b: ItemDef) =>
  a.edible && b.edible
    ? ["Mix them", "Knead into a cake", "Wrap one in the other"]
    : ["Tie them together", "Carve a figure", "Weave them"];

/** Two things in two hands and one line saying what to do with them. */
export function MakePanel({ runtime, first, onClose }: { runtime: Runtime; first?: string; onClose: () => void }) {
  const [picked, setPicked] = useState<(string | undefined)[]>([first, undefined]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ id?: string; text: string }>();
  const [past, setPast] = useState(false);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [onClose]);
  const held = runtime.engine.state.player.inventory;
  const count = (id: string) => held[id] ?? 0;
  // What was used up drops out of the hand it was in.
  const hands = picked.map((id, i) => (id && count(id) > (i === 1 && picked[0] === id ? 1 : 0) ? id : undefined));
  const [a, b] = hands.map((id) => (id ? runtime.item(id) : undefined));
  const carried = Object.keys(held).filter((id) => count(id) > 0 && runtime.item(id));
  const take = (id: string) => {
    const free = count(id) - hands.filter((h) => h === id).length;
    if (free <= 0 || busy) return;
    setResult(undefined);
    setPicked(hands[0] ? [hands[0], id] : [id, hands[1]]);
  };
  const make = async (words: string) => {
    if (!a || !b || busy) return;
    setBusy(true);
    setResult(undefined);
    // Long enough to see the hands at work even when the answer is instant.
    const [made] = await Promise.all([runtime.craft(a.id, b.id, words), new Promise((r) => setTimeout(r, 900))]);
    setBusy(false);
    setResult(made);
    if (made?.id) void gameAudio()?.event("gather");
    else void gameAudio()?.interfaceSound("deny");
  };
  const made = result?.id ? runtime.item(result.id) : undefined;
  const log = runtime.engine.state.made ?? [];
  return createPortal(
    <div className="inspect make" role="dialog" aria-modal="true" data-modal="true" aria-label="Make something">
      <div className="inspect-mist" aria-hidden="true" />
      {past ? (
        <section className="inspect-card make-past">
          <b className="inspect-rarity">Things you made</b>
          <ul>
            {[...log].reverse().map((m, i) => (
              <li key={i}>
                <button onClick={() => { setPast(false); setResult({ id: m.item, text: "" }); }} aria-label={runtime.item(m.item)?.name}>
                  <ItemIcon id={m.item} sprite={runtime.item(m.item)?.sprite} scale={2} />
                </button>
                <span>
                  <strong>{runtime.item(m.item)?.name}</strong>
                  {m.said && <em>“{m.said}”</em>}
                </span>
              </li>
            ))}
          </ul>
          <footer>
            <button className="inspect-action" onClick={() => setPast(false)}>
              Back
            </button>
          </footer>
        </section>
      ) : made ? (
        <>
          <div className="inspect-stage">
            <div className="inspect-plinth" aria-hidden="true" />
            <Turntable id={made.id} fallback={made.sprite} />
          </div>
          <section className="inspect-card">
            <b className="inspect-rarity">{made.made?.flop ? "You ended up with" : "You made"}</b>
            <h2 className={made.name.length > 22 ? "is-long" : undefined}>{made.name}</h2>
            <p className="inspect-kind">{itemKind(made)}</p>
            <div className="inspect-rule" aria-hidden="true">
              <i />
            </div>
            <p className="inspect-desc">{made.description}</p>
            <footer>
              <button className="inspect-action" onClick={() => setResult(undefined)}>
                Make another
              </button>
              <button className="inspect-action" onClick={onClose}>
                <kbd>Esc</kbd>
                Close
              </button>
            </footer>
          </section>
        </>
      ) : (
        <>
          <div className={`make-hands${busy ? " is-working" : ""}`}>
            {hands.map((id, i) => (
              <button
                key={i}
                className="make-hand"
                disabled={!id || busy}
                aria-label={id ? `Put down ${runtime.item(id)!.name}` : "Empty hand"}
                onClick={() => setPicked(hands.map((h, j) => (j === i ? undefined : h)))}
              >
                {id && <ItemIcon id={id} sprite={runtime.item(id)!.sprite} scale={4} />}
              </button>
            ))}
          </div>
          <section className="inspect-card">
            <p className="inspect-desc" aria-live="polite">
              {busy ? "Your hands are at work." : (result?.text ?? (a && b ? `${a.name} and ${b.name.toLowerCase()}.` : "Take two things you carry in hand."))}
            </p>
            <div className="make-strip">
              {carried.map((id) => (
                <button key={id} data-item={id} aria-label={runtime.item(id)!.name} data-tip={runtime.item(id)!.name} onClick={() => take(id)}>
                  <ItemIcon id={id} sprite={runtime.item(id)!.sprite} scale={2} />
                  {count(id) > 1 && <small>{count(id)}</small>}
                </button>
              ))}
            </div>
            {a && b && (
              <form
                className="make-line"
                onSubmit={(e) => {
                  e.preventDefault();
                  void make(text);
                }}
              >
                <input
                  autoFocus
                  value={text}
                  maxLength={200}
                  disabled={busy}
                  placeholder="What do you do with them?"
                  aria-label="What do you do with them?"
                  onChange={(e) => setText(e.target.value)}
                />
                <div>
                  {ideas(a, b).map((idea) => (
                    <button
                      type="button"
                      key={idea}
                      disabled={busy}
                      onClick={() => {
                        setText(idea);
                        void make(idea);
                      }}
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </form>
            )}
            <footer>
              {a && b && (
                <button className="inspect-action" disabled={busy} onClick={() => void make(text)}>
                  <kbd>Enter</kbd>
                  Make
                </button>
              )}
              {log.length > 0 && (
                <button className="inspect-action" onClick={() => setPast(true)}>
                  Things you made
                </button>
              )}
              <button className="inspect-action" onClick={onClose}>
                <kbd>Esc</kbd>
                Close
              </button>
            </footer>
          </section>
        </>
      )}
    </div>,
    document.body,
  );
}
