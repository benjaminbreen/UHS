import { useEffect, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import type { AudioDirector } from "../audio/director";
import { ambienceFor, type AmbienceMix } from "../audio/ambience";
import { listeningScenes, references } from "../audio/ambience-scenes";

const verdicts = ["Sounds right", "Better than before", "Worse than before", "Not like rain"];

/** Plays the world's ambience for a chosen scene, next to the field recording
 * it should resemble, and records what the listener thinks for Claude to read
 * (artifacts/audio-review/verdicts.jsonl). */
export function AmbienceTab({ director }: { director: AudioDirector }) {
  const [id, setId] = useState<string>();
  const [mix, setMix] = useState<AmbienceMix>();
  const [ref, setRef] = useState<string>();
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const player = useRef<HTMLAudioElement>(null);
  const scene = listeningScenes.find((s) => s.id === id);

  useEffect(() => {
    // The synthesis falls silent while a recording plays, so the two never mix.
    if (mix) director.pinScene(ref ? { ...mix, ...silentBeds } : mix).catch((e) => setStatus(String(e)));
  }, [director, mix, ref]);
  useEffect(() => () => void director.pinScene(undefined), [director]);

  const choose = (next: string) => {
    player.current?.pause();
    setRef(undefined);
    setId(next);
    setMix(ambienceFor(listeningScenes.find((s) => s.id === next)!.scene));
    setStatus("");
  };
  const stop = () => {
    setId(undefined);
    setMix(undefined);
    void director.pinScene(undefined);
  };
  const patch = (p: Partial<AmbienceMix>) => mix && setMix({ ...mix, ...p });
  const playRef = (r: string) => {
    const audio = player.current!;
    if (ref === r && !audio.paused) return audio.pause();
    setRef(r);
    audio.src = `/api/audio-ref/${r}.wav`;
    audio.play().catch(() => setStatus("No recording yet: run npm run audio:ambience to fetch them."));
  };
  const backToSynth = () => {
    player.current?.pause();
    setRef(undefined);
  };
  const judge = async (verdict: string) => {
    const entry = {
      scene: id,
      verdict,
      note,
      mix: mix && { rain: mix.rain, surface: mix.surface, inside: mix.inside, hard: mix.hard },
    };
    const ok = await fetch("/api/audio-verdict", { method: "POST", body: JSON.stringify(entry) })
      .then((r) => r.ok)
      .catch(() => false);
    if (!ok) await navigator.clipboard?.writeText(JSON.stringify(entry)).catch(() => {});
    setStatus(ok ? `Saved: ${verdict}` : "Copied the verdict; paste it to Claude.");
    setNote("");
  };

  return (
    <section className="audio-effects">
      <div className="audio-label">WEATHER AND PLACE</div>
      <h3>How the world sounds around you.</h3>
      <p>
        Pick a scene to hear its ambience as the game plays it. Where there is a
        field recording of the real thing, play it to compare, then say how close
        it is. Verdicts are saved for the next round of work.
      </p>
      {scene && mix ? (
        <div className="ambience-detail">
          <h4>{scene.label}</h4>
          <label>
            Rain {mix.rain.toFixed(2)}
            <input type="range" min={0} max={1} step={0.01} value={mix.rain} onChange={(e) => patch({ rain: +e.target.value })} />
          </label>
          <label>
            <input type="checkbox" checked={!!mix.inside} onChange={(e) => patch({ inside: e.target.checked ? 1 : 0, room: e.target.checked ? 0.3 : 0 })} />
            Indoors
          </label>
          <div className="ambience-refs">
            <button aria-pressed={!ref} onClick={backToSynth}>
              Game
            </button>
            {scene.refs.map((r) => (
              <button key={r} aria-pressed={ref === r} onClick={() => playRef(r)} title={references[r].licence}>
                Recording: {references[r].title.replace(/\.\w+$/, "")}
              </button>
            ))}
          </div>
          <textarea placeholder="What's off? (too hissy, too steady, drops too loud…)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="ambience-refs">
            {verdicts.map((v) => (
              <button key={v} onClick={() => void judge(v)}>
                {v}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="audio-effect-grid">
        {listeningScenes.map((s) => (
          <button key={s.id} aria-pressed={s.id === id} onClick={() => (s.id === id ? stop() : choose(s.id))}>
            <span>{s.id === id ? <Square size={18} /> : <Play size={18} />}</span>
            <div>
              <strong>{s.label}</strong>
              <small>{s.describe}</small>
            </div>
          </button>
        ))}
      </div>
      <audio ref={player} loop onEnded={backToSynth} />
      <div className="audio-fine" aria-live="polite">
        {status || (scene ? `Playing: ${scene.label}` : "Choose a scene to listen.")}
      </div>
    </section>
  );
}

const silentBeds: Partial<AmbienceMix> = {
  rain: 0,
  thunder: 0,
  frogs: 0,
  wind: 0,
  birds: 0,
  insects: 0,
  water: 0,
  town: 0,
  fire: 0,
};
