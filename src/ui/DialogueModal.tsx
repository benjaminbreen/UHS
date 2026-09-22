import { useEffect, useRef, useState } from "react";
import { Languages, Send, X } from "lucide-react";
import { setRealLanguage, useRealLanguage } from "./real-language";
import { sexFromName } from "../content/characters/name-sex";
import type { Runtime } from "../runtime/session";
import { dialogueTurn, type DialogueGift, type DialogueLine } from "../narrator/dialogue";
import { CharacterSprite } from "./CharacterSprite";
import type { Expression } from "../render/portraits/constructed";
import { calm, useTypewriter } from "./motion";
import { visemeFor, type Viseme } from "../render/portraits/constructed";
import { CueMark } from "./CueMark";
import { gameAudio } from "../audio/director";
import type { CueKind } from "../core/combat";
import { regardCue, regardLabel, regardNotches, REGARD_NOTCHES } from "../core/regard";

/** A line spoken in its own language. A click fades to the English and back. */
function Glossed({ line }: { line: DialogueLine }) {
  const [english, setEnglish] = useState(false);
  if (!line.original) return <>{line.text}</>;
  return (
    <span
      className="dialogue-glossed"
      data-english={english || undefined}
      role="button"
      tabIndex={0}
      title={english ? "Show original" : "Show English"}
      onClick={() => setEnglish(!english)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setEnglish(!english);
        }
      }}
    >
      <span lang="und" aria-hidden={english}>{line.original}</span>
      <span aria-hidden={!english}>{line.text}</span>
    </span>
  );
}

/** What the other person is saying, arriving as speech does. A click shows
 * the rest at once. */
function SpokenLine({ line, heard, onSpeaking, onLetter }: { line: DialogueLine; heard: Set<string>; onSpeaking: (speaking: boolean) => void; onLetter: (letter: string) => void }) {
  const text = line.original ?? line.text;
  // Opening the reply box redraws the line; it has been said once already.
  const typed = useTypewriter(text, heard.has(text), true, onLetter);
  useEffect(() => {
    if (typed.done) heard.add(text);
    onSpeaking(!typed.done);
    return () => onSpeaking(false);
  }, [typed.done, onSpeaking, heard, text]);
  if (typed.done) return <p className="dialogue-line npc"><Glossed line={line} /></p>;
  return (
    <p className="dialogue-line npc" onClick={typed.skip} data-typing>
      {typed.text}
      {/* Holds the line's full height from the first letter, so nothing below it jumps. */}
      <span className="dialogue-unspoken" aria-hidden="true">{text.slice(typed.text.length)}</span>
    </p>
  );
}

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
  const [speaking, setSpeaking] = useState(false);
  // The face the NPC wears. The model names it with the line; failing that,
  // how they already feel about the player is a better guess than nothing.
  const [mood, setMood] = useState<Expression | undefined>(undefined);
  // How they took what was just said. The world already pops this mark over
  // their head; while the conversation is open, the portrait is where it can
  // actually be seen. The serial restarts the animation on a repeat.
  const [took, setTook] = useState<{ cue: CueKind; serial: number } | null>(
    null,
  );
  const heard = useRef(new Set<string>()).current;
  // Cancels a line waiting on its beat, so closing mid-reply says nothing.
  const beat = useRef<(() => void) | null>(null);
  // Which mouth shape the portrait holds, written per letter as the line
  // arrives. A ref, not state: the canvas samples it, and a re-render of the
  // whole conversation for every character is not worth a moving lip.
  const viseme = useRef<Viseme>("closed");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController>(null);
  const latest = history.at(-1);
  const realLanguage = useRealLanguage();
  // Read at request time, so toggling mid-conversation takes effect on the next line.
  const realRef = useRef(realLanguage);
  realRef.current = realLanguage;

  const commitGift = (gift?: DialogueGift) => {
    if (!gift) return;
    const result = runtime.narrate([{ type: "receive", from: actorId, item: gift }]);
    if (result.result?.status === "completed") {
      setGiftNotice(`${actor?.name ?? "NPC"} gave you ${gift.name}!`);
      // Handing something over is a warm act; the giver's face should say so
      // whatever the line was. The item's flight to the bag is already
      // handled, off the player's inventory changing.
      setMood("smile");
      void gameAudio()?.event("gather");
    } else if (result.result?.reason) {
      setError(result.result.reason);
    }
  };

  /** The exchange itself, recorded on the person spoken to. */
  const commitExchange = (said: string, regard?: number) => {
    if (!said.trim()) return;
    // Looked up either side rather than diffed on one reference, and read
    // off the actor rather than off the model's number: the intent clamps the
    // delta and can refuse it outright, and what shows should be what
    // actually happened to them.
    const trustNow = () =>
      runtime.engine.state.actors.find((a) => a.id === actorId)?.trust ?? 0;
    const before = trustNow();
    runtime.narrate([
      { type: "converse", with: actorId, said: said.slice(0, 120), delta: regard ?? 0 },
    ]);
    const after = trustNow();
    if (after !== before) show(regardCue(after - before, after));
  };
  /**
   * A beat between the face changing and the words starting. People react
   * before they speak, and landing both on the same frame reads as a card
   * being turned over rather than as someone taking something in.
   */
  const mouth = (letter: string) => {
    viseme.current = visemeFor(letter);
  };
  const say = (speak: () => void) => {
    if (calm()) return speak();
    const timer = window.setTimeout(speak, 200);
    beat.current = () => window.clearTimeout(timer);
  };
  /** Plays the mark, and the small movement and note that sell it. */
  const show = (cue: CueKind) => {
    setTook({ cue, serial: Date.now() });
    if (cue === "warm") void gameAudio()?.event("warm");
    else if (cue === "anger") void gameAudio()?.event("anger");
  };

  useEffect(() => {
    const controller = new AbortController();
    abort.current = controller;
    void dialogueTurn(runtime, actorId, "", [], controller.signal, realRef.current).then((result) => {
      if (controller.signal.aborted) return;
      setBusy(false);
      if (result.error) setError(result.error);
      else {
        setMood(result.mood);
        commitGift(result.receive);
        say(() => setHistory([{ speaker: "npc", text: result.text, original: result.original }]));
      }
    });
    // Closing the conversation stops the request rather than paying for a
    // reply nobody will read.
    return () => abort.current?.abort();
  }, [actorId, runtime]);

  useEffect(() => {
    if (responding) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, responding]);

  // Cleared on a clock rather than on the animation ending, because with
  // reduced motion there is no animation to end.
  useEffect(() => {
    if (!took) return;
    const timer = window.setTimeout(() => setTook(null), 1400);
    return () => window.clearTimeout(timer);
  }, [took]);

  // A face does not hold one expression until the next thing is said. Once
  // the line is out and a few seconds have passed, it settles back to
  // whatever this person's resting face is.
  useEffect(() => {
    if (!mood || speaking) return;
    const timer = window.setTimeout(() => setMood(undefined), 5000);
    return () => window.clearTimeout(timer);
  }, [mood, speaking]);

  useEffect(() => () => beat.current?.(), []);

  if (!actor) return null;
  const appearance = actor.appearance ?? runtime.appearanceFor(actor);
  const resting: Expression =
    actor.trust < 0 ? "stern" : actor.trust > 2 ? "smile" : "neutral";
  const expression = busy ? "thoughtful" : (mood ?? resting);
  const submit = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...history, { speaker: "player" as const, text }];
    setHistory(next);
    setInput("");
    setBusy(true);
    setError("");
    const controller = new AbortController();
    abort.current = controller;
    const result = await dialogueTurn(runtime, actorId, text, next, controller.signal, realRef.current);
    if (controller.signal.aborted) return;
    setBusy(false);
    if (result.error) setError(result.error);
    else {
      setMood(result.mood);
      commitExchange(text, result.regard);
      commitGift(result.receive);
      say(() => setHistory([...next, { speaker: "npc", text: result.text, original: result.original }]));
    }
  };
  const close = () => {
    abort.current?.abort();
    onClose();
  };
  return (
    <section className={`modal modal-dialogue${responding ? " is-responding" : ""}`} role="dialog" aria-modal="true" aria-label={`Conversation with ${actor.name}`}>
      <button className="close-modal icon-button" aria-label="Close conversation" onClick={close}><X size={20} /></button>
      <button
        className="dialogue-language icon-button"
        aria-pressed={realLanguage}
        aria-label="Real language mode"
        title={realLanguage ? "Real language: on (click a line for English)" : "Real language: off"}
        onClick={() => setRealLanguage(!realLanguage)}
      >
        <Languages size={18} />
      </button>
      <div className="dialogue-heading">
        <div className="dialogue-face">
          <div className="dialogue-portrait" data-took={took && !calm() ? took.cue : undefined}><CharacterSprite appearance={appearance} portrait age={actor.age ?? 30} speaking={speaking} expression={expression} viseme={viseme} /></div>
          {took && (
            <span key={took.serial} className="dialogue-took" role="status">
              <CueMark cue={took.cue} />
              <b className="visually-hidden">
                {took.cue === "anger"
                  ? `${actor.name} takes offence.`
                  : took.cue === "warm"
                    ? `${actor.name} warms to you.`
                    : `${actor.name} takes it well.`}
              </b>
            </span>
          )}
        </div>
        <div>
          <h2>{actor.name}</h2>
          <p>{genderLabel(actor)} · {actor.age ?? "adult"} · {actor.role}</p>
          {/* Where you stand with them. The mark that pops over the portrait
              has to move something, or it is only a flourish. */}
          <p className="dialogue-regard" data-moved={took ? took.cue : undefined}>
            <span className="regard-notches" aria-hidden="true">
              {Array.from({ length: REGARD_NOTCHES }, (_, i) => (
                <i key={i} className={i < regardNotches(actor.trust) ? "on" : ""} />
              ))}
            </span>
            {regardLabel(actor.trust)}
          </p>
        </div>
      </div>
      {giftNotice && <div className="dialogue-gift" role="status">{giftNotice}</div>}
      <div className="dialogue-history" ref={scrollRef} aria-live="polite">
        {responding
          ? history.map((line, index) =>
              line.speaker === "npc" && index === history.length - 1 ? (
                <SpokenLine key={`${index}-${line.text}`} line={line} heard={heard} onSpeaking={setSpeaking} onLetter={mouth} />
              ) : (
                <p className={`dialogue-line ${line.speaker}`} key={`${index}-${line.text}`}><Glossed line={line} /></p>
              ),
            )
          : latest && <SpokenLine key={latest.text} line={latest} heard={heard} onSpeaking={setSpeaking} onLetter={mouth} />}
        {busy && <p className="dialogue-thinking"><span /><span /><span /></p>}
        {error && <p className="dialogue-error">{error}</p>}
      </div>
      <div className="dialogue-actions">
        {!responding && <button className="dialogue-respond" onClick={() => setResponding(true)}>Respond</button>}
        <button className="dialogue-continue" onClick={close}>Continue <span>▸</span></button>
      </div>
      {responding && <form className="dialogue-input" onSubmit={(event) => { event.preventDefault(); void submit(); }}><input autoFocus value={input} onChange={(event) => setInput(event.target.value)} placeholder={`Speak to ${actor.name}…`} aria-label="Your response" disabled={busy} /><button aria-label="Send response" disabled={!input.trim() || busy}><Send size={16} /></button></form>}
    </section>
  );
}
