import { useEffect, useRef, useState } from "react";
import { gameAudio } from "../audio/director";
import {
  events,
  footstep,
  landing,
  scrape,
  strike,
  takeoff,
  work,
  type EventId,
  type Sound,
} from "../audio/sfx";
import {
  resetTuning,
  setTuning,
  tuning,
  tuningJson,
  type Tuning,
} from "../audio/sfx-tuning";

/** Each group is a throttle key the game plays under, with a sample to audition. */
const groups: { id: string; label: string; sample: () => Sound }[] = [
  { id: "step", label: "Footsteps", sample: () => footstep("sand")! },
  { id: "strike", label: "Tool strikes", sample: () => strike("haft", "rock", "thud") },
  { id: "work", label: "Tool work", sample: () => work("dig") },
  { id: "scrape", label: "Pushing", sample: () => scrape("soil") },
  { id: "jump", label: "Jump", sample: () => takeoff("soil") },
  { id: "land", label: "Landing", sample: () => landing("soil", 1) },
  { id: "hurt", label: "Hurt", sample: () => strike("blunt", "creature", "flinch", true) },
  { id: "air", label: "Combat whoosh", sample: () => strike("blunt", "air", "whoosh") },
  { id: "slam", label: "Combat slam", sample: () => strike("blunt", "soil", "thud", true) },
  { id: "throw", label: "Throw", sample: () => strike("haft", "air", "whoosh") },
  // The "hurt" event shares the combat hurt group above.
  ...(Object.keys(events) as EventId[]).filter((id) => id !== "hurt").map((id) => ({
    id,
    label: `Event · ${id}`,
    sample: events[id],
  })),
];

const knobs: { key: keyof Tuning; label: string; min: number; max: number; step: number; unit?: string }[] = [
  { key: "gain", label: "Volume", min: 0, max: 3, step: 0.05, unit: "×" },
  { key: "pitch", label: "Pitch (tones)", min: 0.25, max: 4, step: 0.01, unit: "×" },
  { key: "brightness", label: "Brightness (noise)", min: 0.25, max: 4, step: 0.01, unit: "×" },
  { key: "length", label: "Length", min: 0.25, max: 3, step: 0.05, unit: "×" },
  { key: "gap", label: "Min gap", min: 0, max: 1000, step: 10, unit: " ms" },
];
const stepKnob = { key: "spacing" as const, label: "Stride", min: 2, max: 32, step: 1, unit: " px" };

export function AudioTuningTab() {
  const [group, setGroup] = useState("step");
  const [, bump] = useState(0);
  const [looping, setLooping] = useState(false);
  const [note, setNote] = useState("");
  const current = groups.find((g) => g.id === group)!;
  const t = tuning(group);
  const play = () => void gameAudio()?.sound(current.sample(), group);

  // Loop at the group's cadence: the min gap, or for footsteps a walking pace.
  const tRef = useRef(t);
  tRef.current = t;
  useEffect(() => {
    if (!looping) return;
    let id: ReturnType<typeof setTimeout>;
    const next = () => {
      play();
      const c = tRef.current;
      // Walking covers roughly 64 px a second.
      const ms = group === "step" ? (c.spacing! / 64) * 1000 : Math.max(c.gap, 250);
      id = setTimeout(next, ms);
    };
    next();
    return () => clearTimeout(id);
  }, [looping, group]);

  const set = (patch: Partial<Tuning>) => {
    setTuning(group, patch);
    bump((n) => n + 1);
  };
  const copy = async () => {
    const json = tuningJson();
    try {
      await navigator.clipboard.writeText(json);
      setNote("Copied. Paste it to Claude or into src/audio/sfx-tuning.json.");
    } catch {
      setNote(json);
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([tuningJson()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "sfx-tuning.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="live-tuning-section live-perf">
      <p>
        Changes apply to the game at once and are kept in this browser. Export
        the JSON to make them permanent.
      </p>
      <label>
        <span>Sound</span>
        <select value={group} onChange={(e) => setGroup(e.currentTarget.value)}>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </label>
      <div className="live-frame-cap">
        <button onClick={play}>Play</button>
        <button aria-pressed={looping} onClick={() => setLooping(!looping)}>
          Loop
        </button>
        <button
          onClick={() => {
            resetTuning(group);
            bump((n) => n + 1);
          }}
        >
          Reset
        </button>
      </div>
      {[...knobs, ...(group === "step" ? [stepKnob] : [])].map((k) => (
        <label key={k.key}>
          <span>
            {k.label}{" "}
            <output>
              {Number(t[k.key]).toFixed(k.step < 1 ? 2 : 0)}
              {k.unit}
            </output>
          </span>
          <input
            aria-label={k.label}
            type="range"
            min={k.min}
            max={k.max}
            step={k.step}
            value={Number(t[k.key])}
            onChange={(e) => set({ [k.key]: Number(e.currentTarget.value) })}
          />
        </label>
      ))}
      <div className="live-frame-cap">
        <button onClick={copy}>Copy JSON</button>
        <button onClick={download}>Download JSON</button>
        <button
          onClick={() => {
            resetTuning();
            bump((n) => n + 1);
          }}
        >
          Reset all
        </button>
      </div>
      {note && <p style={{ whiteSpace: "pre-wrap" }}>{note}</p>}
    </section>
  );
}
