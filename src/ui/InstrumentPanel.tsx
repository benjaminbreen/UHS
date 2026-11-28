import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  INSTRUMENTS,
  KEYBOARD_MAP,
  midiName,
  type ChordPreset,
  type InstrumentId,
  type InstrumentTune,
} from "../audio/instruments";
import type { Voice } from "../audio/score";

type InstrumentAudio = {
  setInstrumentDuck(active: boolean): void;
  playInstrumentNote(voice: Voice, midi: number, velocity?: number, sustain?: number): Promise<void>;
};

export type InstrumentSessionResult = {
  instrument: InstrumentId;
  notesPlayed: number;
  completedTune?: string;
};

type Props = {
  instrument: InstrumentId;
  title?: string;
  place?: string;
  audio?: InstrumentAudio | null;
  onNote?: (midi: number) => void;
  onClose: (result: InstrumentSessionResult) => void;
};

const IS_BLACK = [false, true, false, true, false, false, true, false, true, false, true, false];
const FRETS = 7;

export function InstrumentPanel({ instrument, title, place, audio, onNote, onClose }: Props) {
  const spec = INSTRUMENTS[instrument];
  const [shift, setShift] = useState(0);
  const [sustain, setSustain] = useState(true);
  const [activeMidis, setActiveMidis] = useState<Set<number>>(() => new Set());
  const [vibratingStrings, setVibratingStrings] = useState<Set<number>>(() => new Set());
  const [recent, setRecent] = useState<string[]>([]);
  const [selectedTune, setSelectedTune] = useState<string>(spec.tunes[0]?.id ?? "");
  const [guideIdx, setGuideIdx] = useState<number | null>(null);
  const [demoing, setDemoing] = useState(false);
  const [completedTune, setCompletedTune] = useState<string | undefined>();
  const notesCount = useRef(0);
  const demoTimers = useRef<number[]>([]);
  const activeTimers = useRef<Map<number, number>>(new Map());
  const stringTimers = useRef<Map<number, number>>(new Map());

  const tune: InstrumentTune | undefined = useMemo(
    () => spec.tunes.find((t) => t.id === selectedTune) ?? spec.tunes[0],
    [spec.tunes, selectedTune],
  );
  const targetMidi = guideIdx !== null && tune ? tune.notes[guideIdx]?.midi : undefined;

  useEffect(() => {
    audio?.setInstrumentDuck(true);
    return () => {
      audio?.setInstrumentDuck(false);
      demoTimers.current.forEach((id) => window.clearTimeout(id));
      activeTimers.current.forEach((id) => window.clearTimeout(id));
      stringTimers.current.forEach((id) => window.clearTimeout(id));
    };
  }, [audio]);

  const stopDemo = useCallback(() => {
    demoTimers.current.forEach((id) => window.clearTimeout(id));
    demoTimers.current = [];
    setDemoing(false);
  }, []);

  const flashString = useCallback((idx: number) => {
    setVibratingStrings((prev) => new Set(prev).add(idx));
    const old = stringTimers.current.get(idx);
    if (old) window.clearTimeout(old);
    stringTimers.current.set(
      idx,
      window.setTimeout(() => {
        setVibratingStrings((prev) => {
          const next = new Set(prev);
          next.delete(idx);
          return next;
        });
      }, 360),
    );
  }, []);

  const triggerNote = useCallback(
    (midi: number, opts?: { fromDemo?: boolean; stringIdx?: number; velocity?: number }) => {
      const hold = sustain ? (spec.layout === "keys" ? 2.4 : 2.0) : 0.75;
      void audio?.playInstrumentNote(spec.voice, midi, opts?.velocity ?? 0.88, hold);
      onNote?.(midi);
      setActiveMidis((prev) => new Set(prev).add(midi));
      const old = activeTimers.current.get(midi);
      if (old) window.clearTimeout(old);
      activeTimers.current.set(
        midi,
        window.setTimeout(() => {
          setActiveMidis((prev) => {
            const next = new Set(prev);
            next.delete(midi);
            return next;
          });
        }, 260),
      );
      if (opts?.stringIdx !== undefined) {
        flashString(opts.stringIdx);
      } else if (spec.strings) {
        const si = spec.strings.findIndex((st) => midi >= st.openMidi && midi <= st.openMidi + FRETS);
        if (si >= 0) flashString(si);
      }
      setRecent((prev) => [...prev.slice(-7), midiName(midi)]);
      if (!opts?.fromDemo) {
        notesCount.current += 1;
        setGuideIdx((cur) => {
          if (cur === null || !tune) return cur;
          const want = tune.notes[cur]?.midi;
          if (want === midi || (want !== undefined && ((want - midi) % 12 + 12) % 12 === 0)) {
            if (cur + 1 >= tune.notes.length) {
              setCompletedTune(tune.title);
              return null;
            }
            return cur + 1;
          }
          return cur;
        });
      }
    },
    [audio, flashString, onNote, spec.layout, spec.strings, spec.voice, sustain, tune],
  );

  const strumChord = useCallback(
    (chord: ChordPreset) => {
      stopDemo();
      chord.midis.forEach((m, i) => {
        const id = window.setTimeout(() => {
          triggerNote(m, { velocity: 0.78, stringIdx: spec.strings ? Math.max(0, spec.strings.length - 1 - i) : undefined });
        }, i * 26);
        demoTimers.current.push(id);
      });
    },
    [spec.strings, stopDemo, triggerNote],
  );

  const playDemo = useCallback(() => {
    if (!tune) return;
    if (demoing) return void stopDemo();
    stopDemo();
    setGuideIdx(null);
    setDemoing(true);
    const beatMs = 60000 / tune.bpm;
    let cursor = 0;
    tune.notes.forEach((n) => {
      const id = window.setTimeout(() => triggerNote(n.midi, { fromDemo: true, velocity: 0.82 }), cursor);
      demoTimers.current.push(id);
      cursor += n.dur * beatMs;
    });
    demoTimers.current.push(window.setTimeout(() => setDemoing(false), cursor + 350));
  }, [demoing, stopDemo, triggerNote, tune]);

  const finish = useCallback(() => {
    stopDemo();
    onClose({ instrument, notesPlayed: notesCount.current, completedTune });
  }, [completedTune, instrument, onClose, stopDemo]);

  // Computer keyboard bindings while the instrument overlay is active.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        finish();
        return;
      }
      if (e.repeat) return;
      if (e.code === "KeyZ") {
        e.preventDefault();
        setShift((s) => Math.max(spec.minShift, s - 12));
        return;
      }
      if (e.code === "KeyX") {
        e.preventDefault();
        setShift((s) => Math.min(spec.maxShift, s + 12));
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        setSustain((v) => !v);
        return;
      }
      if (spec.chords && e.code.startsWith("Digit")) {
        const idx = Number(e.code.slice(5)) - 1;
        if (spec.chords[idx]) {
          e.preventDefault();
          strumChord(spec.chords[idx]);
          return;
        }
      }
      const mapped = KEYBOARD_MAP.find((k) => k.code === e.code);
      if (mapped) {
        e.preventDefault();
        stopDemo();
        triggerNote(spec.baseMidi + shift + mapped.offset);
      }
    };
    window.addEventListener("keydown", down, true);
    return () => window.removeEventListener("keydown", down, true);
  }, [finish, shift, spec.baseMidi, spec.chords, spec.maxShift, spec.minShift, stopDemo, strumChord, triggerNote]);

  // Build 25 piano keys (2 full octaves C..C) for keyboard layout.
  const pianoKeys = useMemo(() => {
    const start = spec.baseMidi + shift;
    const all = Array.from({ length: 25 }, (_, i) => {
      const midi = start + i;
      const black = IS_BLACK[((midi % 12) + 12) % 12];
      const kb = KEYBOARD_MAP.find((k) => k.offset === i)?.label;
      return { midi, black, kb, offset: i };
    });
    const whites = all.filter((k) => !k.black);
    const blacks = all
      .filter((k) => k.black)
      .map((k) => {
        const whiteIndex = all.slice(0, k.offset).filter((x) => !x.black).length;
        return { ...k, whiteIndex };
      });
    return { whites, blacks };
  }, [spec.baseMidi, shift]);

  const hintForStringCell = (openMidi: number, fret: number) =>
    targetMidi !== undefined && openMidi + fret === targetMidi;

  return (
    <div
      data-modal="true"
      role="dialog"
      aria-label={`Play ${title ?? spec.name}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "20px 18px 26px",
        background: "radial-gradient(circle at 50% 65%, rgba(12,8,18,0.18), rgba(10,7,16,0.58))",
        pointerEvents: "auto",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) finish();
      }}
    >
      <div
        style={{
          width: "min(860px, 96vw)",
          borderRadius: 12,
          border: "2px solid #c99a42",
          background: `linear-gradient(180deg, ${spec.wood[0]} 0%, ${spec.wood[1]} 100%)`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,228,168,0.3)",
          color: "#f4ead4",
          padding: "14px 18px 16px",
          fontFamily: "var(--font-ui, Georgia, serif)",
        }}
      >
        {/* Header Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#ffe39e", letterSpacing: 0.4 }}>
                ♪ {title ?? spec.name}
              </span>
              <span style={{ fontSize: 12, color: "#d8c49a", opacity: 0.88 }}>
                {place ? `${place} · ` : ""}{spec.subtitle}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#cbb78e", marginTop: 2 }}>
              {spec.layout === "keys"
                ? "Click keys or play A–' (black keys W E T Y U O P) · Z/X octave · Space sustain · Esc close"
                : "Click strings & frets, press 1–6 to strum chords, or play melody A–' · Esc close"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              onClick={() => setShift((s) => Math.max(spec.minShift, s - 12))}
              disabled={shift <= spec.minShift}
              style={pillStyle(false)}
              title="Octave down (Z)"
            >
              Oct −
            </button>
            <button
              type="button"
              onClick={() => setShift((s) => Math.min(spec.maxShift, s + 12))}
              disabled={shift >= spec.maxShift}
              style={pillStyle(false)}
              title="Octave up (X)"
            >
              Oct +
            </button>
            <button
              type="button"
              onClick={() => setSustain((v) => !v)}
              style={pillStyle(sustain)}
              title="Toggle sustain (Space)"
            >
              Sustain {sustain ? "On" : "Off"}
            </button>
            <button type="button" onClick={finish} style={{ ...pillStyle(false), borderColor: "#e4bc68", color: "#ffe9b2" }}>
              Done ✕
            </button>
          </div>
        </div>

        {/* Period Tunes & Guided Practice Strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
            padding: "7px 10px",
            marginBottom: 12,
            borderRadius: 8,
            background: "rgba(14, 9, 18, 0.45)",
            border: "1px solid rgba(201, 154, 66, 0.35)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, color: "#cfa75a" }}>Sheet Music</span>
            {spec.tunes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  stopDemo();
                  setSelectedTune(t.id);
                  setGuideIdx(null);
                  setCompletedTune(undefined);
                }}
                style={pillStyle(selectedTune === t.id)}
              >
                {t.title}
              </button>
            ))}
            <button type="button" onClick={playDemo} style={pillStyle(demoing)}>
              {demoing ? "■ Stop" : "▶ Listen"}
            </button>
            <button
              type="button"
              onClick={() => {
                stopDemo();
                setCompletedTune(undefined);
                setGuideIdx((cur) => (cur === null ? 0 : null));
              }}
              style={pillStyle(guideIdx !== null)}
            >
              {guideIdx !== null ? `Follow (${guideIdx}/${tune?.notes.length ?? 0})` : "✦ Follow"}
            </button>
          </div>
          <div style={{ fontSize: 12, color: completedTune ? "#ffe382" : "#e8d8b8", fontFamily: "monospace", minWidth: 140, textAlign: "right" }}>
            {completedTune
              ? `✦ Played "${completedTune}"!`
              : targetMidi !== undefined
                ? `Next: ${midiName(targetMidi)}`
                : recent.length
                  ? recent.join(" · ")
                  : "Touch a key or string…"}
          </div>
        </div>

        {/* Instrument Surface: Keys OR Strings */}
        {spec.layout === "keys" ? (
          <div
            style={{
              position: "relative",
              height: 168,
              borderRadius: 8,
              background: "#160d0a",
              padding: "6px 6px 8px",
              border: "2px solid #8c6028",
              boxShadow: "inset 0 6px 14px rgba(0,0,0,0.65)",
              userSelect: "none",
              touchAction: "manipulation",
            }}
          >
            {/* Felt red rail above keys */}
            <div style={{ height: 4, background: "linear-gradient(90deg,#6e1820,#a8242e,#6e1820)", borderRadius: 2, marginBottom: 2 }} />
            <div style={{ position: "relative", display: "flex", height: 150, gap: 2 }}>
              {pianoKeys.whites.map((k) => {
                const pressed = activeMidis.has(k.midi);
                const guided = targetMidi === k.midi;
                return (
                  <button
                    key={k.midi}
                    type="button"
                    aria-label={midiName(k.midi)}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      stopDemo();
                      triggerNote(k.midi);
                    }}
                    style={{
                      flex: 1,
                      height: "100%",
                      border: guided ? "2px solid #f0b83c" : "1px solid #8a7b64",
                      borderRadius: "0 0 6px 6px",
                      background: pressed
                        ? "linear-gradient(180deg, #ffe294 0%, #f2c258 100%)"
                        : guided
                          ? "linear-gradient(180deg, #fff6d2 0%, #f8df94 100%)"
                          : "linear-gradient(180deg, #fbf6ea 0%, #ebe1cc 86%, #d4c6aa 100%)",
                      transform: pressed ? "translateY(2px)" : "none",
                      boxShadow: pressed
                        ? "inset 0 2px 6px rgba(120,70,10,0.45)"
                        : guided
                          ? "0 0 14px rgba(255,204,88,0.65)"
                          : "0 3px 0 #9e8c72",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      paddingBottom: 6,
                      cursor: "pointer",
                      color: "#4a3824",
                      fontFamily: "monospace",
                    }}
                  >
                    {k.kb && <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.78 }}>{k.kb}</span>}
                    <span style={{ fontSize: 9, opacity: 0.55 }}>{midiName(k.midi)}</span>
                  </button>
                );
              })}

              {/* Black keys positioned accurately between white keys */}
              {pianoKeys.blacks.map((k) => {
                const pressed = activeMidis.has(k.midi);
                const guided = targetMidi === k.midi;
                const leftPct = (k.whiteIndex / pianoKeys.whites.length) * 100;
                return (
                  <button
                    key={k.midi}
                    type="button"
                    aria-label={midiName(k.midi)}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      stopDemo();
                      triggerNote(k.midi);
                    }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: `calc(${leftPct}% - 2.3%)`,
                      width: "4.6%",
                      height: "62%",
                      zIndex: 3,
                      border: guided ? "2px solid #ffd264" : "1px solid #0e0a0c",
                      borderRadius: "0 0 5px 5px",
                      background: pressed
                        ? "linear-gradient(180deg, #d89b32 0%, #9c6216 100%)"
                        : guided
                          ? "linear-gradient(180deg, #684b18 0%, #3a2a12 100%)"
                          : "linear-gradient(180deg, #342c30 0%, #1c161a 82%, #0e0a0e 100%)",
                      transform: pressed ? "translateY(2px)" : "none",
                      boxShadow: guided ? "0 0 12px rgba(255,204,88,0.75)" : "0 3px 5px rgba(0,0,0,0.65)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      paddingBottom: 5,
                      cursor: "pointer",
                      color: "#e8d6b2",
                      fontFamily: "monospace",
                      fontSize: 10,
                    }}
                  >
                    {k.kb ?? ""}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, userSelect: "none" }}>
            {/* Strum Chord Bar */}
            {spec.chords && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, color: "#cfa75a" }}>Strum Chords</span>
                {spec.chords.map((ch) => (
                  <button
                    key={ch.label}
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      strumChord(ch);
                    }}
                    style={{ ...pillStyle(false), minWidth: 54, fontWeight: 700 }}
                  >
                    <span style={{ opacity: 0.6, marginRight: 4, fontSize: 10 }}>{ch.key}</span>
                    {ch.label}
                  </button>
                ))}
              </div>
            )}
            {/* Wooden Fretboard + Rosette Soundhole */}
            <div
              style={{
                position: "relative",
                borderRadius: 10,
                background: "linear-gradient(90deg, #2b180e 0%, #3d2214 76%, #744622 76%, #8e582c 100%)",
                border: "2px solid #b58434",
                padding: "8px 10px",
                boxShadow: "inset 0 4px 16px rgba(0,0,0,0.6)",
              }}
            >
              {/* Decorative soundhole rosette on the right */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  right: 26,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, #180d08 0%, #24140c 60%, #c99a42 63%, #5a3418 70%, #c99a42 74%, transparent 78%)",
                  opacity: 0.82,
                  pointerEvents: "none",
                }}
              />
              {(spec.strings ?? []).map((st, sIdx) => {
                const vib = vibratingStrings.has(sIdx);
                const thickness = 1.2 + sIdx * 0.45;
                return (
                  <div
                    key={st.label}
                    style={{
                      position: "relative",
                      display: "grid",
                      gridTemplateColumns: `46px repeat(${FRETS + 1}, 1fr)`,
                      alignItems: "center",
                      height: 26,
                      zIndex: 2,
                    }}
                  >
                    <span style={{ fontSize: 11, fontFamily: "monospace", color: "#e8cf96", fontWeight: 700 }}>{st.label}</span>
                    {/* Physical string line */}
                    <div
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        left: 46,
                        right: 4,
                        top: "50%",
                        height: thickness,
                        transform: vib ? "translateY(-1.5px)" : "translateY(-50%)",
                        background: vib
                          ? "linear-gradient(90deg,#ffe896,#fff8d8,#ffe896)"
                          : "linear-gradient(90deg,#c8b288,#efe2c4,#bfa67a)",
                        boxShadow: vib ? "0 0 8px rgba(255,224,120,0.9)" : "0 1px 2px rgba(0,0,0,0.65)",
                        pointerEvents: "none",
                      }}
                    />
                    {Array.from({ length: FRETS + 1 }, (_, fret) => {
                      const midi = st.openMidi + fret + shift;
                      const pressed = activeMidis.has(midi);
                      const guided = hintForStringCell(st.openMidi + shift, fret);
                      return (
                        <button
                          key={fret}
                          type="button"
                          aria-label={`${st.label} fret ${fret} (${midiName(midi)})`}
                          onPointerDown={(e) => {
                            e.preventDefault();
                            stopDemo();
                            triggerNote(midi, { stringIdx: sIdx });
                          }}
                          style={{
                            position: "relative",
                            height: "100%",
                            background: "transparent",
                            border: "none",
                            borderRight: fret === 0 ? "3px solid #ead8b2" : fret < FRETS ? "1px solid rgba(212,174,106,0.48)" : "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                          }}
                        >
                          {(pressed || guided) && (
                            <span
                              style={{
                                padding: "2px 6px",
                                borderRadius: 10,
                                fontSize: 10,
                                fontFamily: "monospace",
                                fontWeight: 700,
                                background: pressed ? "#ffda72" : "rgba(255,204,88,0.28)",
                                color: pressed ? "#241408" : "#ffe69e",
                                border: "1px solid #ffd268",
                                boxShadow: "0 0 10px rgba(255,204,88,0.7)",
                              }}
                            >
                              {midiName(midi)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    padding: "4px 10px",
    borderRadius: 6,
    border: `1px solid ${active ? "#ffd268" : "rgba(201,154,66,0.45)"}`,
    background: active ? "linear-gradient(180deg,#d89e36,#9e6a1a)" : "rgba(26,16,24,0.68)",
    color: active ? "#1c1006" : "#f0e2c4",
    fontSize: 12,
    fontWeight: active ? 700 : 500,
    cursor: "pointer",
    fontFamily: "var(--font-ui, Georgia, serif)",
  };
}
