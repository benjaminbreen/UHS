import faunaAtlas from "../../public/fauna/atlas.json" with { type: "json" };
import { useEffect, useMemo, useState } from "react";
import type { FaunaState } from "../core/fauna";
import { faunaProfiles } from "../content/fauna";
import { Sprite } from "../ui/components";
import "./fauna-lab.css";

const aerial = new Set<FaunaState>([
  "takeoff",
  "flight",
  "approach",
  "landing",
]);

function firstState(index: number) {
  return Object.keys(faunaProfiles[index].art)[0] as FaunaState;
}

function frameInfo(id: string) {
  return (
    faunaAtlas.frames as Record<
      string,
      { frame: { x: number; y: number; w: number; h: number } }
    >
  )[id]?.frame;
}

export function FaunaLab() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const profile = faunaProfiles[selectedIndex];
  const [state, setState] = useState<FaunaState>(firstState(0));
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [direction, setDirection] = useState<"east" | "west">("east");
  const [scale, setScale] = useState(3);
  const [members, setMembers] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [spacing, setSpacing] = useState(24);
  const [flightHeight, setFlightHeight] = useState(28);
  const [shadows, setShadows] = useState(true);
  const [background, setBackground] = useState("meadow");
  const [message, setMessage] = useState("");
  const states = Object.keys(profile.art) as FaunaState[];
  const frames = profile.art[state] ?? [];
  const id = frames[frame % Math.max(1, frames.length)] ?? states[0];
  const flying = aerial.has(state);
  const dimensions = frameInfo(id);
  const frameDuration =
    state === "flight"
      ? 85
      : ["flee", "chase", "takeoff", "landing"].includes(state)
        ? 95
        : ["wander", "stalk", "approach"].includes(state)
          ? 140
          : 260;

  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const timer = window.setInterval(
      () => setFrame((current) => (current + 1) % frames.length),
      frameDuration / speed,
    );
    return () => window.clearInterval(timer);
  }, [frameDuration, frames.length, playing, speed, state]);

  const group = useMemo(
    () =>
      Array.from({ length: members }, (_, index) => {
        const columns = Math.min(members, 3);
        const row = Math.floor(index / columns);
        const rowMembers = Math.min(columns, members - row * columns);
        const column = (index % columns) - (rowMembers - 1) / 2;
        return {
          x: column * spacing,
          y: (row - Math.floor((members - 1) / columns) / 2) * spacing * 0.6,
        };
      }),
    [members, spacing],
  );

  const pick = (index: number) => {
    setSelectedIndex(index);
    const next = firstState(index);
    setState(next);
    setFrame(0);
    setMessage("");
  };

  async function exportPNG() {
    try {
      const image = new Image();
      image.src = "/fauna/atlas.png";
      await image.decode();
      const source = frameInfo(id)!;
      const canvas = document.createElement("canvas");
      canvas.width = source.w;
      canvas.height = source.h;
      canvas
        .getContext("2d")!
        .drawImage(
          image,
          source.x,
          source.y,
          source.w,
          source.h,
          0,
          0,
          source.w,
          source.h,
        );
      const link = document.createElement("a");
      link.href = canvas.toDataURL();
      link.download = `${id}.png`;
      link.click();
      setMessage("Native-size transparent frame exported.");
    } catch {
      setMessage("Could not export this frame. Please try again.");
    }
  }

  const contract = {
    profile,
    sampleGroup: {
      id: "study-group",
      speciesId: profile.id,
      memberCount: members,
      pos: { x: 0, y: 0, space: "outside" },
      home: { x: 0, y: 0, space: "outside" },
      homeRadius: profile.cohesionRadius * 3,
      state,
      nextDecisionAt: profile.calmDecisionSeconds,
    },
  };

  return (
    <main className="fauna-lab">
      <header className="fauna-header">
        <div>
          <div className="eyebrow">DEVELOPER · FAUNA STUDIES</div>
          <h1>Fauna Lab</h1>
          <p>Small silhouettes · soft palettes · lively movement.</p>
        </div>
        <a className="action" href="/">
          Game opening ↗
        </a>
      </header>

      <section className="fauna-lineup" aria-label="Shared pixel scale">
        <div className="eyebrow">WORLD-SCALE LINEUP · EVERY SPECIES AT 2×</div>
        <div className="fauna-lineup-animals">
          {faunaProfiles.map((candidate) => {
            const names =
              candidate.art.idle ??
              candidate.art.perch ??
              Object.values(candidate.art)[0]!;
            const size = frameInfo(names[0]);
            return (
              <div key={candidate.id}>
                <span className="fauna-lineup-sprite">
                  <Sprite name={names[0]} scale={2} />
                </span>
                <small>{candidate.label.replace(" study", "")}</small>
                <small>
                  {size?.w} × {size?.h} px
                </small>
              </div>
            );
          })}
        </div>
      </section>

      <div className="fauna-layout">
        <section className="fauna-library" aria-label="Species studies">
          <h2>Species studies</h2>
          <p className="muted">
            Artwork is isolated from playable generation until a behavior slice
            is approved.
          </p>
          <div className="fauna-grid">
            {faunaProfiles.map((candidate, index) => {
              const previewState = Object.keys(candidate.art)[0] as FaunaState;
              return (
                <button
                  key={candidate.id}
                  aria-pressed={index === selectedIndex}
                  onClick={() => pick(index)}
                >
                  <span className="fauna-thumb">
                    <Sprite name={candidate.art[previewState]![0]} scale={2} />
                  </span>
                  <strong>{candidate.label}</strong>
                  <small>
                    {candidate.category} · {candidate.social}
                  </small>
                </button>
              );
            })}
          </div>
          <div className="fauna-profile">
            <h3>Behavior profile</h3>
            <dl>
              <div>
                <dt>Activity</dt>
                <dd>{profile.activity}</dd>
              </div>
              <div>
                <dt>Group</dt>
                <dd>{profile.groupSize.join("–")}</dd>
              </div>
              <div>
                <dt>Alert radius</dt>
                <dd>{profile.alertRadius} tiles</dd>
              </div>
              <div>
                <dt>Decisions</dt>
                <dd>
                  {profile.calmDecisionSeconds}s /{" "}
                  {profile.urgentDecisionSeconds}s urgent
                </dd>
              </div>
            </dl>
            <p>
              Habitat: {profile.habitats.map((entry) => entry.tag).join(", ")}
            </p>
            <div className="fauna-palette" aria-label="Sprite palette">
              {profile.palette.map((color) => (
                <span key={color} title={color} style={{ background: color }} />
              ))}
            </div>
          </div>
        </section>

        <section className="fauna-inspector" aria-label="Fauna preview">
          <div className="fauna-title">
            <h2>{profile.label}</h2>
            <span>
              {dimensions?.w} × {dimensions?.h} px
            </span>
          </div>
          <div
            className={`fauna-stage fauna-bg-${background}`}
            data-testid="fauna-preview"
          >
            {group.map((member, index) => {
              const memberFrame = (frame + index * 3) % frames.length;
              const progress = memberFrame / (frames.length - 1);
              const lift = flying
                ? flightHeight *
                  (state === "takeoff"
                    ? progress
                    : state === "landing"
                      ? 1 - progress
                      : 1)
                : 0;
              return (
                <div key={index}>
                  {shadows && (
                    <span
                      className="fauna-shadow"
                      style={{
                        left: `calc(50% + ${member.x * scale}px)`,
                        top: `calc(62% + ${member.y * scale}px)`,
                        opacity: flying
                          ? Math.max(0.14, 0.5 - lift / 90)
                          : 0.48,
                        width: (dimensions?.w ?? 48) * scale * 0.55,
                        height: scale * 3,
                      }}
                    />
                  )}
                  <span
                    className="fauna-member"
                    style={{
                      left: `calc(50% + ${member.x * scale}px)`,
                      top: `calc(62% + ${member.y * scale - lift}px)`,
                      transform: `translate(-50%, -100%) scaleX(${direction === "west" ? -1 : 1})`,
                    }}
                  >
                    <Sprite name={frames[memberFrame]} scale={scale} />
                  </span>
                </div>
              );
            })}
            <span className="fauna-stage-caption">
              {members === 1 ? "Single-animal study" : "Group study"} · {scale}×
              native pixels
            </span>
          </div>

          <div className="fauna-timeline" aria-label="Animation frames">
            {frames.map((name, index) => (
              <button
                key={name}
                aria-label={`Frame ${index + 1}`}
                aria-pressed={frame === index}
                onClick={() => {
                  setPlaying(false);
                  setFrame(index);
                }}
              >
                <Sprite name={name} scale={1} />
                <small>{String(index + 1).padStart(2, "0")}</small>
              </button>
            ))}
          </div>

          <div className="fauna-controls">
            <label>
              Behavior state
              <select
                value={state}
                onChange={(event) => {
                  setState(event.target.value as FaunaState);
                  setFrame(0);
                }}
              >
                {states.map((candidate) => (
                  <option key={candidate}>{candidate}</option>
                ))}
              </select>
            </label>
            <label>
              Direction
              <select
                value={direction}
                onChange={(event) =>
                  setDirection(event.target.value as "east" | "west")
                }
              >
                <option value="east">East</option>
                <option value="west">West</option>
              </select>
            </label>
            <label>
              Pixel scale
              <select
                value={scale}
                onChange={(event) => setScale(Number(event.target.value))}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}×
                  </option>
                ))}
              </select>
            </label>
            <label>
              Backdrop
              <select
                value={background}
                onChange={(event) => setBackground(event.target.value)}
              >
                <option value="meadow">Meadow</option>
                <option value="dry">Dry ground</option>
                <option value="forest">Forest edge</option>
                <option value="night">Night blue</option>
                <option value="checker">Transparency</option>
              </select>
            </label>
          </div>
          <div className="fauna-sliders">
            <label>
              Playback · {speed}×
              <input
                aria-label="Playback speed"
                type="range"
                min="0.25"
                max="2"
                step="0.25"
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
              />
            </label>
            <label>
              Group members · {members}
              <input
                aria-label="Group members"
                type="range"
                min="1"
                max="9"
                value={members}
                onChange={(event) => setMembers(Number(event.target.value))}
              />
            </label>
            <label>
              Spacing · {spacing}px
              <input
                aria-label="Group spacing"
                type="range"
                min="10"
                max="64"
                value={spacing}
                onChange={(event) => setSpacing(Number(event.target.value))}
              />
            </label>
            <label>
              Flight height · {flightHeight}px
              <input
                aria-label="Flight height"
                type="range"
                min="0"
                max="64"
                disabled={!flying}
                value={flightHeight}
                onChange={(event) =>
                  setFlightHeight(Number(event.target.value))
                }
              />
            </label>
          </div>
          <div className="fauna-actions">
            <button
              className="action"
              aria-label="Previous frame"
              onClick={() => {
                setPlaying(false);
                setFrame(
                  (current) => (current + frames.length - 1) % frames.length,
                );
              }}
            >
              ←
            </button>
            <button
              className="action"
              aria-pressed={playing}
              onClick={() => setPlaying((current) => !current)}
            >
              {playing ? "Pause animation" : "Play animation"}
            </button>
            <button
              className="action"
              aria-label="Next frame"
              onClick={() => {
                setPlaying(false);
                setFrame((current) => (current + 1) % frames.length);
              }}
            >
              →
            </button>
            <label className="fauna-check">
              <input
                type="checkbox"
                checked={shadows}
                onChange={(event) => setShadows(event.target.checked)}
              />
              Shadows
            </label>
            <button className="action" onClick={exportPNG}>
              Export current frame
            </button>
          </div>
          <p className="fauna-frame">
            <code>{id}</code>
          </p>
          <p role="status">{message}</p>
          <details>
            <summary>Species and group contract</summary>
            <pre>{JSON.stringify(contract, null, 2)}</pre>
          </details>
        </section>
      </div>
    </main>
  );
}
