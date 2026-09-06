import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Download,
  Music2,
  Pause,
  Play,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { AudioDirector } from "../audio/director";
import {
  compose,
  periods,
  seasons,
  slotThemes,
  stems,
  type Era,
  type Period,
  type Season,
} from "../audio/score";
import { effects, renderWav } from "../audio/synth";
import "./audio-lab.css";

const periodSymbols = { dawn: "◔", day: "☀", dusk: "◑", night: "☾" };
const seasonNotes = {
  spring: "New leaves & open paths",
  summer: "Long light & distant hills",
  autumn: "Amber fields & remembered roads",
  winter: "Still skies & lights at home",
};
const eraNotes: Record<Era, string> = {
  pastoral:
    "Breathy pipe, plucked strings, soft drum. A pastoral sketch for the early world.",
  chamber:
    "Bowed lead, plucked accompaniment, flute replies. A first chamber-ensemble study.",
  electronic:
    "Soft FM keys, rounded bass, a light pulse. The same melody looks forward.",
};
function duration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export function AudioLab({
  director,
  onClose,
}: {
  director: AudioDirector;
  onClose: () => void;
}) {
  const state = useSyncExternalStore(director.subscribe, director.getSnapshot);
  const { arrangement, beat } = state;
  const score = useMemo(() => compose(arrangement), [arrangement]);
  const library = slotThemes(arrangement.season);
  const [tab, setTab] = useState<"music" | "effects">("music");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [lastEffect, setLastEffect] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const elements = Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input, select, a[href]",
        ) ?? [],
      ).filter((el) => el.getClientRects().length);
      const first = elements[0],
        last = elements.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    panel.current?.addEventListener("keydown", trap);
    const element = panel.current;
    return () => {
      element?.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, []);
  const changeSlot = (season: Season, period: Period) => {
    director.follow(false);
    director.configure({ season, period, themeId: slotThemes(season)[0].id });
  };
  const exportTrack = async () => {
    setExporting(true);
    setExportError("");
    try {
      const blob = await renderWav(score, state.levels);
      const url = URL.createObjectURL(blob),
        link = document.createElement("a");
      link.href = url;
      link.download = `${score.theme.id}-${arrangement.season}-${arrangement.period}-${arrangement.era}.wav`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      setExportError(
        `Export failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setExporting(false);
    }
  };
  const melody = score.notes.filter((n) => n.stem === "melody");
  const phrase = Math.min(3, Math.floor(beat / 32));
  return (
    <div
      className="audio-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="audio-lab"
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="audio-title"
        data-modal="true"
      >
        <header className="audio-header">
          <div className="audio-mark">
            <Music2 size={23} />
          </div>
          <div>
            <span className="audio-eyebrow">
              WORLD SOUND · DEVELOPMENT STUDIO
            </span>
            <h2 id="audio-title">A soundtrack for the journey</h2>
          </div>
          <span className="audio-shortcut">⌘ 1</span>
          <button
            ref={close}
            className="audio-icon"
            onClick={onClose}
            aria-label="Close audio studio"
          >
            <X size={21} />
          </button>
        </header>
        <div className="audio-tabs" role="tablist" aria-label="Audio tools">
          <button
            role="tab"
            aria-selected={tab === "music"}
            onClick={() => setTab("music")}
          >
            Overworld music <span>05 themes</span>
          </button>
          <button
            role="tab"
            aria-selected={tab === "effects"}
            onClick={() => setTab("effects")}
          >
            Sound effects <span>06 sketches</span>
          </button>
          <div className="audio-status">
            <i className={state.playing ? "is-playing" : ""} />
            {state.loading
              ? "Preparing instruments…"
              : state.playing
                ? "Playing on the map"
                : "Ready to listen"}
          </div>
        </div>
        <div className="audio-scroll">
          {tab === "music" ? (
            <div className="audio-columns">
              <aside className="audio-library">
                <div className="audio-label">01 / THE WORLD</div>
                <label className="audio-select-label">
                  Season
                  <select
                    aria-label="Music season"
                    value={arrangement.season}
                    onChange={(e) =>
                      changeSlot(e.target.value as Season, arrangement.period)
                    }
                  >
                    {seasons.map((s) => (
                      <option key={s} value={s}>
                        {s[0].toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="audio-periods" aria-label="Time of day">
                  {periods.map((p) => (
                    <button
                      key={p}
                      aria-label={`Music time: ${p}`}
                      aria-pressed={arrangement.period === p}
                      onClick={() => changeSlot(arrangement.season, p)}
                    >
                      <span>{periodSymbols[p]}</span>
                      {p}
                    </button>
                  ))}
                </div>
                <label className="audio-follow">
                  <input
                    type="checkbox"
                    checked={state.followWorld}
                    onChange={(e) => director.follow(e.target.checked)}
                  />{" "}
                  Follow world clock
                </label>
                <p className="audio-fine">
                  When following, themes alternate after each piece. Calendar
                  sketch: 28 days per season, starting in spring.
                </p>
                <div className="audio-library-heading">
                  <div className="audio-label">02 / THE PIECES</div>
                  <span>2 in this setting</span>
                </div>
                {library.map((theme, i) => (
                  <button
                    className={`audio-track ${theme.id === arrangement.themeId ? "selected" : ""}`}
                    key={theme.id}
                    aria-pressed={theme.id === arrangement.themeId}
                    onClick={() => director.configure({ themeId: theme.id })}
                  >
                    <span className="audio-track-number">0{i + 1}</span>
                    <div>
                      <strong>{theme.title}</strong>
                      <small>
                        {theme.season
                          ? `${theme.season} theme`
                          : "recurring travel theme"}
                      </small>
                    </div>
                    <span className="audio-track-dot">
                      {theme.id === arrangement.themeId ? "●" : "○"}
                    </span>
                  </button>
                ))}
                <p className="audio-fine audio-library-foot">
                  Five original compositions. Two arrangements in every season /
                  time slot. Shared themes carry the world’s musical memory.
                </p>
              </aside>
              <section className="audio-player">
                <div
                  className={`audio-art audio-art-${arrangement.season}`}
                  aria-hidden="true"
                >
                  <div className="audio-sun" />
                  <div className="audio-hill audio-hill-far" />
                  <div className="audio-hill audio-hill-near" />
                  <div className="audio-art-caption">
                    <span>
                      {arrangement.season} / {arrangement.period}
                    </span>
                    <em>{seasonNotes[arrangement.season]}</em>
                  </div>
                  <span className="audio-art-index">
                    UHS / 0
                    {library.findIndex((t) => t.id === arrangement.themeId) + 1}
                  </span>
                </div>
                <div className="audio-title-row">
                  <div>
                    <div className="audio-label">NOW ON THE MUSIC STAND</div>
                    <h3>{score.theme.title}</h3>
                  </div>
                  <span className="audio-bpm">
                    {score.bpm}
                    <small>BPM · 4/4</small>
                  </span>
                </div>
                <p className="audio-description">{score.theme.subtitle}</p>
                <div
                  className="audio-score"
                  aria-label={`Melody score, bar ${Math.floor(beat / 4) + 1} of 32`}
                >
                  <svg
                    viewBox="0 0 640 74"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    {[0, 1, 2, 3, 4].map((i) => (
                      <line
                        key={i}
                        x1="0"
                        y1={12 + i * 12}
                        x2="640"
                        y2={12 + i * 12}
                        stroke="currentColor"
                        opacity=".1"
                      />
                    ))}
                    {melody.map((n, i) => (
                      <rect
                        key={i}
                        x={n.beat * 5}
                        y={62 - (n.midi - 59) * 1.8}
                        width={Math.max(2, n.duration * 5 - 1)}
                        height="3"
                        rx="1.5"
                        fill="currentColor"
                        opacity={n.beat <= beat ? 0.9 : 0.3}
                      />
                    ))}
                    <line
                      x1={beat * 5}
                      x2={beat * 5}
                      y1="4"
                      y2="70"
                      stroke="#fae7b6"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <div className="audio-phrases">
                    {[
                      "A · arrival",
                      "A′ · unfolding",
                      "B · beyond the hill",
                      "A″ · homeward",
                    ].map((name, i) => (
                      <span key={name} className={phrase === i ? "active" : ""}>
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="audio-transport">
                  <button
                    className="audio-play"
                    disabled={state.loading}
                    onClick={() =>
                      state.playing ? director.pause() : void director.play()
                    }
                    aria-label={state.playing ? "Pause music" : "Play music"}
                  >
                    {state.playing ? <Pause size={18} /> : <Play size={18} />}
                    {state.loading
                      ? "Preparing…"
                      : state.playing
                        ? "Pause"
                        : beat > 0
                          ? "Resume"
                          : "Listen"}
                  </button>
                  <button
                    className="audio-icon"
                    onClick={() => director.stop()}
                    aria-label="Stop music"
                  >
                    <Square size={16} />
                  </button>
                  <button
                    className="audio-icon"
                    onClick={() => {
                      director.stop();
                      void director.play();
                    }}
                    aria-label="Restart music"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <span className="audio-time">
                    {duration((beat * 60) / score.bpm)}{" "}
                    <span>/ {duration((128 * 60) / score.bpm)}</span>
                  </span>
                  <button
                    className="audio-export"
                    disabled={exporting}
                    onClick={() => void exportTrack()}
                  >
                    <Download size={15} />
                    {exporting ? "Rendering…" : "WAV"}
                  </button>
                </div>
                <div className="audio-orchestration">
                  <div className="audio-label">
                    03 / THROUGH THE ERAS <span>PREVIEW</span>
                  </div>
                  <div className="audio-era-buttons">
                    {(
                      [
                        ["pastoral", "I", "Pipe & earth"],
                        ["chamber", "II", "Chamber"],
                        ["electronic", "III", "After tomorrow"],
                      ] as const
                    ).map(([era, numeral, title]) => (
                      <button
                        key={era}
                        aria-label={title}
                        aria-pressed={arrangement.era === era}
                        onClick={() => director.configure({ era })}
                      >
                        <span>{numeral}</span>
                        {title}
                      </button>
                    ))}
                  </div>
                  <p className="audio-fine">
                    {eraNotes[arrangement.era]} Culture-specific tuning and
                    historically grounded instrumentation come later.
                  </p>
                </div>
                <div className="audio-mixer-heading">
                  <div className="audio-label">04 / THE ENSEMBLE</div>
                  <button onClick={() => director.resetMix()}>Reset mix</button>
                </div>
                <div className="audio-stems">
                  {stems.map((stem) => (
                    <label key={stem}>
                      <span>
                        {stem}
                        <small>{Math.round(state.levels[stem] * 100)}%</small>
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step=".01"
                        aria-label={`${stem} level`}
                        value={state.levels[stem]}
                        onChange={(e) =>
                          director.setLevel(stem, Number(e.target.value))
                        }
                      />
                    </label>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <section className="audio-effects">
              <div className="audio-label">
                THE SMALL SOUNDS OF A LIVING WORLD
              </div>
              <h3>Objects, gestures, little discoveries.</h3>
              <p>
                Original synthesized sketches. Audition here; these are not yet
                attached to world actions.
              </p>
              <div className="audio-effect-grid">
                {effects.map((effect) => (
                  <button
                    key={effect.id}
                    onClick={() => {
                      void director.effect(effect.id);
                      setLastEffect(effect.name);
                    }}
                  >
                    <span>{effect.icon}</span>
                    <div>
                      <strong>{effect.name}</strong>
                      <small>{effect.detail}</small>
                    </div>
                    <Play size={15} />
                  </button>
                ))}
              </div>
              <div className="audio-fine" aria-live="polite">
                {lastEffect
                  ? `Last audition: ${lastEffect}`
                  : "Choose a sound to audition it alongside the music."}
              </div>
            </section>
          )}
        </div>
        <footer className="audio-footer">
          <button
            className="audio-icon"
            onClick={() => director.mute()}
            aria-label={state.muted ? "Unmute all audio" : "Mute all audio"}
          >
            {state.muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>
          <label>
            Music
            <input
              type="range"
              aria-label="Music volume"
              min="0"
              max="1"
              step=".01"
              value={state.volume}
              onChange={(e) =>
                director.setVolume("volume", Number(e.target.value))
              }
            />
          </label>
          <label>
            SFX
            <input
              type="range"
              aria-label="Sound effects volume"
              min="0"
              max="1"
              step=".01"
              value={state.sfxVolume}
              onChange={(e) =>
                director.setVolume("sfxVolume", Number(e.target.value))
              }
            />
          </label>
          <span>
            {state.muted
              ? "All audio muted"
              : "Close the studio to keep listening on the map."}
          </span>
        </footer>
        {(state.error || exportError) && (
          <p role="alert" className="audio-error">
            {state.error || exportError}
          </p>
        )}
      </div>
    </div>
  );
}
