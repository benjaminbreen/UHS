import { useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import { sexFromName } from "../content/characters/name-sex";
import type { Runtime } from "../runtime/session";
import { dialogueTurn, type DialogueGift, type DialogueLine } from "../narrator/dialogue";
import { CharacterSprite } from "./CharacterSprite";

const genderLabel = (actor: { name: string; origin?: { sex?: string }; appearance?: { physique?: { sex?: string } } }) => {
  const sex = actor.origin?.sex ?? actor.appearance?.physique?.sex ?? sexFromName(actor.name);
  return sex === "female" ? "Female" : sex === "male" ? "Male" : "Person";
};

export function DialogueModal({ runtime, actorId, onClose }: { runtime: Runtime; actorId: string; onClose: () => void }) {
  const actor = runtime.engine.state.actors.find((candidate) => candidate.id === actorId);
  const [history, setHistory] = useState<DialogueLine[]>([]);
  const [input, setInput] = useState("");
  const [responding, setResponding] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [giftNotice, setGiftNotice] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const latest = history.at(-1);

  const commitGift = (gift?: DialogueGift) => {
    if (!gift) return;
    const result = runtime.narrate([{ type: "receive", from: actorId, item: gift }]);
    if (result.result?.status === "completed") {
      setGiftNotice(`${actor?.name ?? "NPC"} gave you ${gift.name}!`);
    } else if (result.result?.reason) {
      setError(result.result.reason);
    }
  };

  useEffect(() => {
    let live = true;
    void dialogueTurn(runtime, actorId, "", []).then((result) => {
      if (!live) return;
      setBusy(false);
      if (result.error) setError(result.error);
      else {
        setHistory([{ speaker: "npc", text: result.text }]);
        commitGift(result.receive);
      }
    });
    return () => { live = false; };
  }, [actorId, runtime]);

  useEffect(() => {
    if (responding) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, responding]);

  if (!actor) return null;
  const appearance = actor.appearance ?? runtime.appearanceFor(actor);
  const submit = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...history, { speaker: "player" as const, text }];
    setHistory(next);
    setInput("");
    setBusy(true);
    setError("");
    const result = await dialogueTurn(runtime, actorId, text, next);
    setBusy(false);
    if (result.error) setError(result.error);
    else {
      setHistory([...next, { speaker: "npc", text: result.text }]);
      commitGift(result.receive);
    }
  };
  return (
    <section className={`modal modal-dialogue${responding ? " is-responding" : ""}`} role="dialog" aria-modal="true" aria-label={`Conversation with ${actor.name}`}>
      <button className="close-modal icon-button" aria-label="Close conversation" onClick={onClose}><X size={20} /></button>
      <div className="dialogue-heading">
        <div className="dialogue-portrait"><CharacterSprite appearance={appearance} portrait age={actor.age ?? 30} /></div>
        <div><h2>{actor.name}</h2><p>{genderLabel(actor)} · {actor.age ?? "adult"} · {actor.role}</p></div>
      </div>
      {giftNotice && <div className="dialogue-gift" role="status">{giftNotice}</div>}
      <div className="dialogue-history" ref={scrollRef} aria-live="polite">
        {responding ? history.map((line, index) => <p className={`dialogue-line ${line.speaker}`} key={`${index}-${line.text}`}>{line.text}</p>) : latest && <p className="dialogue-line npc">{latest.text}</p>}
        {busy && <p className="dialogue-thinking"><span /><span /><span /></p>}
        {error && <p className="dialogue-error">{error}</p>}
      </div>
      <div className="dialogue-actions">
        {!responding && <button className="dialogue-respond" onClick={() => setResponding(true)}>Respond</button>}
        <button className="dialogue-continue" onClick={onClose}>Continue <span>▸</span></button>
      </div>
      {responding && <form className="dialogue-input" onSubmit={(event) => { event.preventDefault(); void submit(); }}><input autoFocus value={input} onChange={(event) => setInput(event.target.value)} placeholder={`Speak to ${actor.name}…`} aria-label="Your response" disabled={busy} /><button aria-label="Send response" disabled={!input.trim() || busy}><Send size={16} /></button></form>}
    </section>
  );
}
