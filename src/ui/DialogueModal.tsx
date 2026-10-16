import { useEffect, useRef, useState } from "react";
import { CircleHelp, History, Languages, Send, X } from "lucide-react";
import { setRealLanguage, useRealLanguage } from "./real-language";
import { sexFromName } from "../content/characters/name-sex";
import type { Runtime } from "../runtime/session";
import { dialogueTurn, explainDialogue, knowsPlayer, type DialogueGift, type DialogueLine } from "../narrator/dialogue";
import { CharacterSprite, npcFacing } from "./CharacterSprite";
import type { Expression } from "../render/portraits/constructed";
import { calm, useTypewriter } from "./motion";
import { visemeFor, type Viseme } from "../render/portraits/constructed";
import { CueMark } from "./CueMark";
import { gameAudio } from "../audio/director";
import { voice, type Sound } from "../audio/sfx";
import { voiceOf } from "../audio/voices";
import type { CueKind } from "../core/combat";
import type { CallIn, Favour, WalkOff } from "../core/types";
type AskAnswer = "made" | "accepted" | "declined";
import { Choices, Frame, plotColours, type StoryLook } from "./PlotCard";
import { plotTemplate } from "../core/plot";
import { regardCue, regardLabel, regardNotches, REGARD_NOTCHES } from "../core/regard";

function Action({ text }: { text: string }) {
  return <em className="dialogue-action">{/[.!?]$/.test(text) ? text : `${text}.`}</em>;
}

/** A line spoken in its own language. A click fades to the English and back. */
function Glossed({ line }: { line: DialogueLine }) {
  const [english, setEnglish] = useState(false);
  const action = line.action && <Action text={line.action} />;
  if (!line.original) return <>{action}{line.text}</>;
  return (<>{action}
    <span
      className="dialogue-glossed"
      data-english={english || undefined}
      role="button"
      tabIndex={0}
      title={english ? "Show original" : line.language ? `${line.language}. Show English` : "Show English"}
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
  </>);
}

/** What the other person is saying, arriving as speech does. A click shows
 * the rest at once. */
function SpokenLine({ line, heard, onSpeaking, onLetter, voice: speaking }: { line: DialogueLine; heard: Set<string>; onSpeaking: (speaking: boolean) => void; onLetter: (letter: string) => void; voice: () => Sound }) {
  const text = line.original ?? line.text;
  // Opening the reply box redraws the line; it has been said once already.
  const typed = useTypewriter(text, heard.has(text), speaking, onLetter);
  useEffect(() => {
    if (typed.done) heard.add(text);
    onSpeaking(!typed.done);
    return () => onSpeaking(false);
  }, [typed.done, onSpeaking, heard, text]);
  if (typed.done) return <p className="dialogue-line npc"><Glossed line={line} /></p>;
  return (
    <p className="dialogue-line npc" onClick={typed.skip} data-typing>
      {line.action && <Action text={line.action} />}
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

export function DialogueModal({ runtime, actorId, situation, said, look, onClose, onTrade }: { runtime: Runtime; actorId: string; /** What the conversation opens on, when the player did not start it. */ situation?: string; /** A line they already spoke in the world, which the conversation picks up from. */ said?: string; look: StoryLook; onClose: () => void; /** The person agreed to show their goods or look at yours. */ onTrade?: () => void }) {
  const actor = runtime.engine.state.actors.find((candidate) => candidate.id === actorId);
  const [history, setHistory] = useState<DialogueLine[]>(() => said ? [{ speaker: "npc", text: said }] : []);
  const [input, setInput] = useState("");
  const [responding, setResponding] = useState(!!said);
  const [full, setFull] = useState(false);
  const [calling, setCalling] = useState(false);
  const firstChoice = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(!said);
  // Read once: meeting them in this conversation should not change the header mid-talk.
  const [known] = useState(() => !!actor && knowsPlayer(runtime, actor));
  const [lastTime] = useState(() =>
    actor?.memories.filter((m) => /^spoke:[^:]*:\s*\S/.test(m)).at(-1)?.split(":").slice(2).join(":").trim(),
  );
  const [error, setError] = useState("");
  const [explanation, setExplanation] = useState("");
  const [explainOpen, setExplainOpen] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const explainAbort = useRef<AbortController>(null);
  const [left, setLeft] = useState(false);
  const [trading, setTrading] = useState(false);
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
  const heard = useRef(new Set<string>(said ? [said] : [])).current;
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
  const situationRef = useRef(situation);

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
  const commitExchange = (said: string, regard?: number, leave?: WalkOff, ask?: AskAnswer, favour?: Favour) => {
    if (!said.trim() && !leave && !ask) return;
    // Looked up either side rather than diffed on one reference, and read
    // off the actor rather than off the model's number: the intent clamps the
    // delta and can refuse it outright, and what shows should be what
    // actually happened to them.
    const trustNow = () =>
      runtime.engine.state.actors.find((a) => a.id === actorId)?.trust ?? 0;
    const before = trustNow();
    runtime.narrate([
      { type: "converse", with: actorId, said: said.slice(0, 120), delta: regard ?? 0, leave, ask, favour },
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
    if (said) {
      heard.add(said);
      return () => { abort.current?.abort(); explainAbort.current?.abort(); };
    }
    const controller = new AbortController();
    abort.current = controller;
    void dialogueTurn(runtime, actorId, "", [], controller.signal, realRef.current, situationRef.current).then((result) => {
      if (controller.signal.aborted) return;
      runtime.onRecord?.("dialogue", { actorId, opening: result.text, error: result.error });
      setBusy(false);
      if (result.error) setError(result.error);
      else {
        setMood(result.mood);
        commitGift(result.receive);
        if (result.trade) setTrading(true);
        if (result.leave) setLeft(true);
        if (result.leave || result.ask) commitExchange("", 0, result.leave, result.ask, result.favour);
        say(() => setHistory([{ speaker: "npc", text: result.text, original: result.original, language: result.language, action: result.action, context: result.context }]));
      }
    });
    // Closing the conversation stops the request rather than paying for a
    // reply nobody will read.
    return () => { abort.current?.abort(); explainAbort.current?.abort(); };
  }, [actorId, runtime]);

  useEffect(() => {
    if (full) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, full]);

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
  // The voice follows the face: a cross line is spoken in a cross voice.
  const cross = ["angry", "stern", "disgust", "scowl"].includes(expression);
  const speaks = () => voice(voiceOf(actor), cross);
  const submit = async (said = input) => {
    const text = said.trim();
    if (!text || busy) return;
    const next = [...history, { speaker: "player" as const, text }];
    setHistory(next);
    setInput("");
    setBusy(true);
    setError("");
    setExplainOpen(false);
    setExplanation("");
    explainAbort.current?.abort();
    setExplaining(false);
    const controller = new AbortController();
    abort.current = controller;
    const result = await dialogueTurn(runtime, actorId, text, next, controller.signal, realRef.current, situationRef.current);
    runtime.onRecord?.("dialogue", { actorId, input: text, response: result.text, error: result.error, aborted: result.aborted });
    if (controller.signal.aborted) return;
    setBusy(false);
    if (result.error) setError(result.error);
    else {
      setMood(result.mood);
      commitExchange(text, result.regard, result.leave, result.ask, result.favour);
      if (result.ask === "accepted" && result.favour?.kind === "help" && runtime.engine.state.asks?.some((x) => x.by === actorId && x.kind === "help"))
        setGiftNotice(`${actor?.name.split(" ")[0]} takes you up on it. Follow them when you're done talking.`);
      commitGift(result.receive);
      if (result.trade) setTrading(true);
      if (result.leave) {
        setLeft(true);
        setResponding(false);
      }
      say(() => setHistory([...next, { speaker: "npc", text: result.text, original: result.original, language: result.language, action: result.action, context: result.context }]));
    }
  };
  const close = () => {
    abort.current?.abort();
    explainAbort.current?.abort();
    onClose();
  };
  const explain = async () => {
    const line = history.at(-1);
    if (explainOpen) { setExplainOpen(false); return; }
    if (!line || line.speaker !== "npc" || !line.context) return;
    setExplainOpen(true);
    if (explanation || explaining) return;
    const controller = new AbortController();
    explainAbort.current = controller;
    setExplaining(true);
    const result = await explainDialogue(line, controller.signal);
    if (controller.signal.aborted) return;
    setExplaining(false);
    setExplanation(result.explanation ?? result.error ?? "The explanation is unavailable.");
  };
  const callIn = (kind: CallIn) => {
    runtime.narrate([{ type: "converse", with: actorId, said: "", delta: 0, callIn: kind }]);
    setGiftNotice(runtime.engine.state.events.at(-1)?.text ?? null);
    setCalling(false);
    setMood("smile");
  };
  const first = actor?.name.split(" ")[0];
  const owed = actor ? ([["work", "Work beside me today"], ["lend", "Lend me something"], ["speak", "Speak for me"]] as const)
    .filter(([kind]) => !runtime.engine.callInProblem(actor, kind)) : [];
  const choices = calling ? [
    ...owed.map(([kind, label]) => ({ label, pick: () => callIn(kind) })),
    { label: "Never mind", pick: () => setCalling(false) },
  ] : undefined;
  const plot = runtime.engine.state.plot;
  const owing = !!plot && !plot.ended && (plot.owed ?? 0) > 0 && plot.cast[plotTemplate(plot)?.payee ?? "creditor"] === actorId;
  const pay = () => {
    const result = runtime.command({ type: "interact", target: actorId, action: "pay" });
    setGiftNotice(result?.status === "completed" ? runtime.engine.state.events.at(-1)?.text ?? null : result?.reason ?? "You have nothing they will take.");
  };
  const plotChoices = owing && !busy && !left && latest?.speaker === "npc" ? [
    { label: "Pay what you owe", pick: pay, primary: true },
    { label: "Ask for time", pick: () => void submit("I need more time.") },
    { label: "Refuse", pick: () => void submit("No. I won't pay you.") },
  ] : [];
  // They have asked for a hand with their work; the answer is a choice, not something to type.
  const helpAsked = !busy && !left && latest?.speaker === "npc" &&
    runtime.engine.state.asks?.some((x) => x.by === actorId && x.kind === "help" && !x.accepted);
  const inner = (<>
    <div className="dialogue-tools">
      {history.length > 1 && <button className="icon-button" aria-label="Show the whole conversation" title="Earlier in this conversation" aria-pressed={full} onClick={() => setFull(!full)}><History size={16} /></button>}
      <button className="icon-button" aria-label="Explain this line" title="Why did they say this?" aria-expanded={explainOpen} disabled={busy || latest?.speaker !== "npc" || !latest.context} onClick={() => void explain()}><CircleHelp size={16} /></button>
      <button
        className="icon-button"
        aria-pressed={realLanguage}
        aria-label="Real language mode"
        title={realLanguage ? "Real language: on (click a line for English)" : "Real language: off"}
        onClick={() => setRealLanguage(!realLanguage)}
      >
        <Languages size={16} />
      </button>
      <button className="icon-button" aria-label="Close conversation" onClick={close}><X size={16} /></button>
    </div>
    <div className="plot-speech-row">
      <div className="dialogue-face">
        <div className="plot-portrait dialogue-portrait" data-took={took && !calm() ? took.cue : undefined}><CharacterSprite appearance={appearance} portrait age={actor.age ?? 30} speaking={speaking} expression={expression} viseme={viseme} motion="npc" facing={npcFacing(actor.id)} /></div>
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
      <div className="plot-speech-body">
        <div className="dialogue-title">
        <span className="plot-name">{actor.name}</span>
        {known && (
          <p className="dialogue-meta">
            {genderLabel(actor)} · {actor.age ?? "adult"} · {actor.role}
            {/* Where you stand with them. The mark that pops over the portrait
                has to move something, or it is only a flourish. */}
            <span className="dialogue-regard" data-moved={took ? took.cue : undefined}>
              <span className="regard-notches" aria-hidden="true">
                {Array.from({ length: REGARD_NOTCHES }, (_, i) => (
                  <i key={i} className={i < regardNotches(actor.trust) ? "on" : ""} />
                ))}
              </span>
              {regardLabel(actor.trust)}
            </span>
            {actor.owes && <span>Owes you</span>}
          </p>
        )}
        </div>
        {giftNotice && <div className="dialogue-gift" role="status">{giftNotice}</div>}
        {explainOpen && <aside className="dialogue-explanation" role="status"><strong>Why this line?</strong> {explaining ? "Thinking…" : explanation}</aside>}
        {lastTime && !full && history.length <= 1 && <p className="dialogue-last">Last time you said “{lastTime}”</p>}
        <div className={`dialogue-history${full ? " is-full" : ""}`} ref={scrollRef} aria-live="polite">
          {full
            ? history.map((line, index) =>
                line.speaker === "npc" && index === history.length - 1 ? (
                  <SpokenLine key={`${index}-${line.text}`} line={line} heard={heard} onSpeaking={setSpeaking} onLetter={mouth} voice={speaks} />
                ) : (
                  <p className={`dialogue-line ${line.speaker}${index < history.length - 2 ? " past" : ""}`} key={`${index}-${line.text}`}><Glossed line={line} /></p>
                ),
              )
            : latest && <SpokenLine key={latest.text} line={latest} heard={heard} onSpeaking={setSpeaking} onLetter={mouth} voice={speaks} />}
          {busy && <p className="dialogue-thinking"><span /><span /><span /></p>}
          {error && <p className="dialogue-error">{error}</p>}
        </div>
        <div className="dialogue-foot">
          {responding && !helpAsked && !calling && <form className="dialogue-input" onSubmit={(event) => { event.preventDefault(); void submit(); }}><input autoFocus value={input} onChange={(event) => setInput(event.target.value)} placeholder={`Speak to ${actor.name}…`} aria-label="Your response" disabled={busy} /><button aria-label="Send response" disabled={!input.trim() || busy}><Send size={16} /></button></form>}
          <div className="plot-speech-actions" data-ready>
            <Choices
              focus={firstChoice}
              items={choices ?? (helpAsked ? [
                { label: "Offer to help", pick: () => { commitExchange("I'll help you.", 0, undefined, "accepted"); close(); }, primary: true },
                { label: "Not now", pick: () => { commitExchange("Not now.", 0, undefined, "declined"); setResponding(true); } },
              ] : [
                ...plotChoices,
                ...(!responding && !left ? [{ label: "Respond", pick: () => setResponding(true), primary: !plotChoices.length }] : []),
                ...(trading && onTrade && !busy && !left ? [{ label: "See what they have", pick: () => { abort.current?.abort(); onTrade(); }, primary: true }] : []),
                ...(owed.length && !busy && !left ? [{ label: `Call in ${first}'s debt`, pick: () => setCalling(true) }] : []),
                { label: left ? `${first} has gone` : responding ? "Leave" : "Continue", pick: close },
              ])}
            />
          </div>
        </div>
      </div>
    </div>
  </>);
  return (
    <div className="plot-floor dialogue-floor" data-look={look} data-picked-up={said ? true : undefined} style={plotColours(runtime)}>
      <section className="plot-speech dialogue-speech" role="dialog" aria-label={`Conversation with ${actor.name}`}>
        {look === "framed" ? <Frame>{inner}</Frame> : <div className="plot-frame">{inner}</div>}
      </section>
    </div>
  );
}
