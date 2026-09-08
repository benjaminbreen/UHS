import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Phaser from "phaser";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Compass,
  Download,
  Footprints,
  Hourglass,
  Map as MapIcon,
  MessageCircle,
  Minus,
  Plus,
  Settings,
  Pencil,
  Search,
  ShoppingBag,
  Upload,
  X,
  Hand,
  Pause,
  ExternalLink,
  NotebookPen,
  PanelRightClose,
  Play,
  SkipForward,
  Music2,
} from "lucide-react";
import { AudioDirector } from "../audio/director";
import { AudioLab } from "../dev/AudioLab";
import type { Runtime } from "../runtime/session";
import { restoreSession } from "../runtime/session";
import { download, save } from "../runtime/storage";
import { items } from "../content/packs";
import { distance, type ItemId, type PlayerCommand } from "../core/types";
import { WorldScene } from "../render/WorldScene";
import { WorldSetup } from "./WorldSetup";
import { AtlasMap } from "./AtlasMap";
import { toAtlas, fromAtlas } from "../world/v2/atlas";
import { Sprite, Minimap, timeLabel } from "./components";
const CharacterLab = lazy(() =>
  import("../dev/CharacterLab").then((m) => ({ default: m.CharacterLab })),
);
export function App({
  runtime,
  writer,
}: {
  runtime: Runtime;
  writer: boolean;
}) {
  const view = useSyncExternalStore(runtime.subscribe, runtime.getSnapshot);
  const { observation: obs, selection, pack } = view;
  const p = obs.player;
  const propControls = runtime.propControls();
  const [audio, setAudio] = useState<AudioDirector | null>(null);
  const [audioOpen, setAudioOpen] = useState(false);
  const [characterOpen, setCharacterOpen] = useState(false);
  useEffect(() => {
    const director = new AudioDirector();
    setAudio(director);
    return () => director.dispose();
  }, []);
  useEffect(() => audio?.updateWorld(obs.clock), [audio, obs.clock]);
  const [modal, setModal] = useState<
    "world" | "inventory" | "notebook" | "evidence" | "map" | "settings" | null
  >(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [command, setCommand] = useState("");
  const [saved, setSaved] = useState(false);
  const [sidebar, setSidebar] = useState(() => window.innerWidth > 640);
  const [mapRegion, setMapRegion] = useState(false);
  const [mapSpan, setMapSpan] = useState(1600);
  const [earthMap, setEarthMap] = useState(false);
  const mount = useRef<HTMLDivElement>(null);
  const upload = useRef<HTMLInputElement>(null);
  const replayUpload = useRef<HTMLInputElement>(null);
  const game = useRef<Phaser.Game | undefined>(undefined);
  useEffect(() => {
    if (!mount.current) return;
    const g = new Phaser.Game({
      type: Phaser.AUTO,
      parent: mount.current,
      backgroundColor: "#819253",
      pixelArt: true,
      roundPixels: true,
      antialias: false,
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: mount.current.clientWidth,
        height: mount.current.clientHeight,
      },
      scene: new WorldScene(runtime),
      audio: { noAudio: true },
      banner: false,
    });
    game.current = g;
    return () => {
      g.destroy(true);
    };
  }, [runtime]);
  useEffect(() => {
    if (selection && window.innerWidth <= 640) setSidebar(true);
  }, [selection?.id]);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.code === "Digit3") {
        e.preventDefault();
        if (!e.repeat) {
          setCharacterOpen((open) => !open);
          setModal(null);
          setAudioOpen(false);
          runtime.stop();
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.code === "Digit1") {
        e.preventDefault();
        if (!e.repeat) {
          setAudioOpen((open) => !open);
          setModal(null);
          runtime.stop();
        }
        return;
      }
      if (e.key === "Escape") {
        setCharacterOpen(false);
        setAudioOpen(false);
        setModal(null);
        runtime.stop();
        return;
      }
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        modal ||
        audioOpen ||
        document.querySelector('[data-modal="true"]') ||
        (e.target instanceof HTMLElement &&
          (e.target.isContentEditable || e.target.tagName === "BUTTON")) ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        if (!e.repeat) runtime.propAction("Space");
      }
      if ((e.code === "KeyE" || e.code === "KeyG") && !e.repeat) {
        e.preventDefault();
        runtime.propAction(e.code);
      }
      if (e.key.toLowerCase() === "i") setModal("inventory");
      if (e.key.toLowerCase() === "m") setModal("map");
      if (e.key.toLowerCase() === "j") setModal("notebook");
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [modal, audioOpen, runtime]);
  const day = Math.floor(obs.clock / 86400) + 1;
  const hour = Math.floor(obs.clock / 3600) % 24;
  const period =
    hour < 6
      ? "Before dawn"
      : hour < 10
        ? "Morning"
        : hour < 12
          ? "Late morning"
          : hour < 17
            ? "Afternoon"
            : hour < 20
              ? "Evening"
              : "Night";
  const focusActor = obs.actors.find((a) => a.id === selection?.id);
  const focusSprite =
    selection &&
    (runtime.engine.world.place(selection.id)?.sprite ??
      obs.objects.find((o) => o.id === selection.id)?.sprite ??
      (focusActor
        ? focusActor.kind === "human"
          ? `${focusActor.sprite}-2-0`
          : `${focusActor.sprite}0`
        : undefined));
  const currentPlace =
    p.pos.space === "outside"
      ? pack.region
      : runtime.engine.world.place(p.pos.space)?.name;
  const doAction = (c: PlayerCommand) => {
    if (c.type === "interact" && c.action === "follow")
      runtime.startFollow(c.target);
    else runtime.command(c);
  };
  const openWorld = () => {
    setModal("world");
    setError("");
  };
  const submit = () => {
    const text = command.trim().toLowerCase();
    if (!text) return;
    const minutes = /^wait(?:\s+(\d+))?/.exec(text);
    const eat = /^(?:eat|use)\s+(.+)$/.exec(text);
    if (minutes)
      runtime.command({
        type: "wait",
        seconds: Math.min(3600, Math.max(1, Number(minutes[1] || 5) * 60)),
      });
    else if (eat) {
      const item = Object.values(items).find((i) =>
        i.name.toLowerCase().includes(eat[1]),
      );
      if (item) runtime.command({ type: "use", item: item.id });
      else {
        runtime.notice = "That food is not in the supported item catalog.";
        runtime.emit();
      }
    } else if (/inventory/.test(text)) setModal("inventory");
    else if (/map/.test(text)) setModal("map");
    else {
      runtime.notice =
        "Try “wait 10”, “eat bread”, or select a person or object for contextual actions. Free-form model interpretation is not connected.";
      runtime.emit();
    }
    setCommand("");
  };
  const evidence =
    pack.evidence.find((e) => e.id === selection?.claim) ?? pack.evidence[0];
  return (
    <div className={`app ${!sidebar ? "sidebar-hidden" : ""}`}>
      {characterOpen && (
        <Suspense fallback={<div data-modal="true">Loading characters…</div>}>
          <CharacterLab
            runtime={runtime}
            onClose={() => setCharacterOpen(false)}
          />
        </Suspense>
      )}
      <header className="topbar">
        <div className="brand">
          <Compass size={24} />
          <div>Universal History Simulator</div>
        </div>
        <button
          className="world-selector"
          onClick={openWorld}
          title="Change your world"
        >
          <span>
            {pack.name}, {pack.date}
          </span>
          <Pencil size={17} />
        </button>
        <div className="header-actions">
          <button
            className="icon-button"
            aria-label="Audio studio"
            title="Audio studio (⌘1 / Ctrl+1)"
            onClick={() => {
              runtime.stop();
              setModal(null);
              setAudioOpen(true);
            }}
          >
            <Music2 size={19} />
          </button>
          <button className="quiet-button new-world" onClick={openWorld}>
            <Plus size={16} /> New world
          </button>
          <button
            aria-label="Settings"
            className="icon-button"
            onClick={() => setModal("settings")}
          >
            <Settings size={19} />
          </button>
        </div>
      </header>
      <main className="workspace">
        <section className="world-pane">
          <div
            className="game-container"
            ref={mount}
            aria-label="Playable historical world. Use arrow keys or WASD to walk."
            tabIndex={0}
          />
          <div className="prop-prompts" data-testid="prop-prompts">
            {obs.manifest.content === 1 && (
              <span>
                This saved world retains legacy props. Start a new world for
                interactive props.
              </span>
            )}
            {propControls.held && (
              <span>
                Holding: {propControls.held!.name}{" "}
                <button onClick={() => runtime.propAction("KeyG")}>
                  G · Put down
                </button>
              </span>
            )}
            {propControls.primary && (
              <button onClick={() => runtime.propAction("Space")}>
                Space · {propControls.primaryLabel}
              </button>
            )}
            {propControls.secondary && (
              <button onClick={() => runtime.propAction("KeyE")}>
                Press E to {propControls.secondaryLabel?.toLowerCase()}
              </button>
            )}
          </div>
          <div className="map-controls">
            <button
              aria-label="Zoom out"
              onClick={() => runtime.setZoom(view.zoom - 1)}
              disabled={view.zoom === 1}
            >
              <Minus size={17} />
            </button>
            <span>{view.zoom}×</span>
            <button
              aria-label="Zoom in"
              onClick={() => runtime.setZoom(view.zoom + 1)}
              disabled={view.zoom === 4}
            >
              <Plus size={17} />
            </button>
            <button
              aria-label="Toggle character panel"
              onClick={() => setSidebar(!sidebar)}
            >
              <PanelRightClose size={17} />
            </button>
          </div>
          <div className="location-label">
            <Compass size={13} />
            {p.pos.space === "outside"
              ? `${p.pos.x * 2} m E · ${-p.pos.y * 2} m N`
              : "Household interior"}
          </div>
          {view.replay && (
            <div className="replay-bar">
              <button
                aria-label={
                  view.replay.playing ? "Pause replay" : "Play replay"
                }
                onClick={() => runtime.toggleReplay()}
              >
                {view.replay.playing ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                aria-label="Next recorded action"
                onClick={() => runtime.stepReplay()}
              >
                <SkipForward size={16} />
              </button>
              <input
                aria-label="Replay position"
                type="range"
                min={0}
                max={view.replay.total}
                value={view.replay.index}
                onChange={(e) => runtime.seekReplay(Number(e.target.value))}
              />
              <span>
                {view.replay.index} / {view.replay.total}
              </span>
              <button onClick={() => runtime.branchReplay()}>
                Continue from here <ArrowRight size={14} />
              </button>
            </div>
          )}
          {(view.notice || view.running) && (
            <div className="world-notice" role="status">
              {view.running ? (
                <>
                  <Footprints size={16} />
                  <span>Walking through the world…</span>
                  <button onClick={() => runtime.stop()}>
                    <Pause size={14} /> Stop
                  </button>
                </>
              ) : (
                view.notice
              )}
            </div>
          )}
          <div className="event-strip">
            <span className="event-dot" />
            <span>{obs.events.at(-1)?.text}</span>
            <button
              aria-label="Open journal"
              onClick={() => setModal("notebook")}
            >
              <BookOpen size={16} />
            </button>
          </div>
          <footer className="bottom-bar">
            <div className="quick-actions">
              <button
                onClick={() => {
                  const nearest = obs.actors
                    .filter((a) => a.kind === "human")
                    .sort(
                      (a, b) => distance(a.pos, p.pos) - distance(b.pos, p.pos),
                    )[0];
                  if (nearest) runtime.select(nearest.id);
                  else {
                    runtime.notice =
                      "No one is in sight. Walk farther to meet someone.";
                    runtime.emit();
                  }
                }}
              >
                <MessageCircle size={17} />
                <span>Talk</span>
              </button>
              <button
                onClick={() => {
                  if (selection) {
                    runtime.select(selection.id);
                    return;
                  }
                  const targets = [
                    ...obs.places.map((place) => ({
                      id: place.id,
                      pos: { ...place.entrance, space: p.pos.space },
                    })),
                    ...obs.objects,
                  ];
                  const nearest = targets.sort(
                    (a, b) => distance(a.pos, p.pos) - distance(b.pos, p.pos),
                  )[0];
                  if (nearest) runtime.select(nearest.id);
                  else {
                    runtime.notice =
                      "Select something in the world to examine it.";
                    runtime.emit();
                  }
                }}
              >
                <Search size={19} />
                <span>Inspect</span>
              </button>
              <button onClick={() => setModal("map")}>
                <MapIcon size={17} />
                <span>Travel</span>
              </button>
              <button
                onClick={() => runtime.command({ type: "wait", seconds: 300 })}
              >
                <Hourglass size={17} />
                <span>Wait</span>
              </button>
            </div>
            <form
              className="command-input"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <input
                aria-label="Action command"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="What do you want to do?"
              />
              <button aria-label="Submit action">
                <ArrowRight size={19} />
              </button>
            </form>
            <div className="keyboard-hint">
              <span>
                <kbd>W A S D</kbd> walk
              </span>
              <span>
                <kbd>SPACE</kbd> pick up / wield · <kbd>E</kbd> interact ·{" "}
                <kbd>G</kbd> put down
              </span>
              <span>
                <kbd>M</kbd> map
              </span>
              <span>Click to walk · Scroll to zoom</span>
            </div>
          </footer>
        </section>
        <aside className="sidebar">
          <section className="character-section">
            <div className="place-heading">
              <h2>{currentPlace}</h2>
              <p title={`Day ${day} · ${timeLabel(obs.clock)}`}>
                {pack.date} <span>·</span> {period}
              </p>
            </div>
            <div className="character">
              <div className="portrait">
                <Sprite name={`portrait-${p.sprite}`} scale={2} />
              </div>
              <div>
                <h1>{p.name}</h1>
                <div className="role">{p.role}</div>
                <span className="condition">
                  {p.hunger > 70
                    ? "Hungry"
                    : p.fatigue > 65
                      ? "Tired"
                      : "Healthy · Rested"}
                </span>
                <div className="wealth">
                  <Sprite
                    name={pack.currency ? "coin" : "obsidian"}
                    scale={1}
                  />
                  <span>
                    {pack.currency
                      ? `${p.inventory.coin ?? 0} bronze coins`
                      : `${p.inventory.obsidian ?? 0} obsidian flakes`}
                  </span>
                </div>
              </div>
            </div>
          </section>
          <section className="region-section">
            <div className="section-heading">
              <h2>Region</h2>
              <button onClick={() => setModal("map")}>
                Explore <ArrowRight size={13} />
              </button>
            </div>
            <button
              className="map-button"
              aria-label="Open regional map"
              onClick={() => setModal("map")}
            >
              <Minimap runtime={runtime} regional={mapRegion} />
              <span className="north">N ↑</span>
            </button>
            <div className="map-switcher">
              <div role="group" aria-label="Map scale">
                <button
                  aria-pressed={!mapRegion}
                  onClick={() => setMapRegion(false)}
                >
                  Local
                </button>
                <button
                  aria-pressed={mapRegion}
                  onClick={() => setMapRegion(true)}
                >
                  Region
                </button>
              </div>
              <span>
                {mapRegion
                  ? `${(runtime.engine.world.regionExtent ?? 320) * 2} m`
                  : "220 m"}
              </span>
            </div>
          </section>
          <section className="context-section">
            <div className="section-heading">
              <span className="eyebrow">
                {selection ? "IN FOCUS" : "AROUND YOU"}
              </span>
              {selection && (
                <button
                  aria-label="Clear selection"
                  onClick={() => runtime.select()}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {selection ? (
              <>
                <div className="focus-card">
                  {focusSprite && (
                    <div className="focus-thumbnail">
                      <Sprite name={focusSprite} scale={1} />
                    </div>
                  )}
                  <div>
                    <h2>{selection.name}</h2>
                    <p>{selection.description}</p>
                  </div>
                </div>
                {distance(p.pos, selection.pos) > 2.5 && (
                  <button
                    className="action primary"
                    onClick={() => runtime.approach(selection.id)}
                  >
                    <Footprints size={17} /> Walk closer
                  </button>
                )}
                {selection.inventory && (
                  <p data-testid="container-contents">
                    Contents:{" "}
                    {Object.entries(selection.inventory)
                      .filter(([, n]) => n! > 0)
                      .map(([id, n]) => `${n} ${items[id as ItemId].name}`)
                      .join(", ") || "Empty"}
                  </p>
                )}
                <div className="context-actions">
                  {selection.affordances.map((a, i) => (
                    <button
                      key={i}
                      className="action"
                      disabled={!a.enabled}
                      title={a.reason}
                      onClick={() => doAction(a.command)}
                    >
                      {a.command.type === "trade" ? (
                        <ShoppingBag size={16} />
                      ) : a.label.includes("Talk") ? (
                        <MessageCircle size={16} />
                      ) : (
                        <Hand size={16} />
                      )}
                      <span>{a.label}</span>
                      <ArrowRight size={13} />
                    </button>
                  ))}
                </div>
                {selection.claim && (
                  <button
                    className="evidence-link"
                    onClick={() => setModal("evidence")}
                  >
                    <BookOpen size={15} /> Historical context
                  </button>
                )}
              </>
            ) : (
              <>
                <h2>Around you</h2>
                <p>
                  {pack.concern} Select something in the world to look closer.
                </p>
                <div className="nearby-list">
                  {obs.actors
                    .filter((a) => a.kind === "human")
                    .sort(
                      (a, b) => distance(a.pos, p.pos) - distance(b.pos, p.pos),
                    )
                    .slice(0, 3)
                    .map((a) => (
                      <button key={a.id} onClick={() => runtime.select(a.id)}>
                        <Sprite name={`${a.sprite}-2-0`} scale={1} />
                        <span>
                          {a.name}
                          <small>{a.role}</small>
                        </span>
                        <ChevronDown size={13} />
                      </button>
                    ))}
                </div>
              </>
            )}
          </section>
          <div className="sidebar-footer">
            <button onClick={() => setModal("notebook")}>
              <NotebookPen size={17} /> Notebook
            </button>
            <button onClick={() => setModal("inventory")}>
              <ShoppingBag size={17} /> Inventory
            </button>
          </div>
        </aside>
      </main>
      <div className="statusbar">
        <span>
          <span className="live-dot" />
          {writer
            ? "Saved on this device"
            : "Private tab copy · export to keep"}
        </span>
        <span>
          Seed: {obs.manifest.seed} <span className="status-divider">/</span> No
          model calls
        </span>
        <span>Click to walk · Scroll to zoom</span>
      </div>
      {audioOpen && audio && (
        <AudioLab director={audio} onClose={() => setAudioOpen(false)} />
      )}
      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <section
            className={`modal modal-${modal}`}
            role="dialog"
            aria-modal="true"
            aria-label={modal === "world" ? "Create a world" : modal}
            data-modal="true"
          >
            <button
              className="close-modal icon-button"
              aria-label="Close dialog"
              onClick={() => setModal(null)}
            >
              <X size={20} />
            </button>
            {modal === "world" && (
              <WorldSetup
                initialSeed={obs.manifest.seed}
                onStart={(engine) => {
                  runtime.zoom = engine.world.pack.setting ? 1 : 2;
                  runtime.replace(engine);
                  setModal(null);
                }}
              />
            )}
            {modal === "inventory" && (
              <>
                <div className="eyebrow">POSSESSIONS</div>
                <h2>What you carry</h2>
                <p>
                  Goods have real quantities. Eating, gathering, and exchanging
                  change this inventory.
                </p>
                {propControls.held && (
                  <div className="inventory-item">
                    <Sprite name={propControls.held!.sprite} scale={2} />
                    <strong>Holding: {propControls.held!.name}</strong>
                    {propControls.held!.prop !== "stick" && (
                      <button
                        className="action"
                        onClick={() =>
                          runtime.command({
                            type: "interact",
                            target: propControls.held!.id,
                            action: "look",
                          })
                        }
                      >
                        Look inside
                      </button>
                    )}
                    {propControls.held!.open && (
                      <p>
                        Contents:{" "}
                        {Object.entries(propControls.held!.inventory)
                          .filter(([, n]) => n! > 0)
                          .map(([id, n]) => `${n} ${items[id as ItemId].name}`)
                          .join(", ") || "Empty"}
                      </p>
                    )}
                    <button
                      className="action"
                      onClick={() => runtime.propAction("KeyG")}
                    >
                      Put down
                    </button>
                  </div>
                )}
                <div className="inventory-grid">
                  {Object.entries(p.inventory)
                    .filter(([, n]) => n! > 0)
                    .map(([id, n]) => (
                      <div className="inventory-item" key={id}>
                        <div className="item-art">
                          <Sprite name={items[id as ItemId].sprite} scale={2} />
                        </div>
                        <div>
                          <strong>{items[id as ItemId].name}</strong>
                          <small>Quantity: {n}</small>
                        </div>
                        {items[id as ItemId].edible && (
                          <button
                            className="small-button"
                            onClick={() =>
                              runtime.command({
                                type: "use",
                                item: id as ItemId,
                              })
                            }
                          >
                            Eat
                          </button>
                        )}
                      </div>
                    ))}
                </div>
                <div className="needs">
                  <label>
                    Hunger <meter min={0} max={100} value={p.hunger} />
                    <span>{Math.round(p.hunger)} / 100</span>
                  </label>
                  <label>
                    Fatigue <meter min={0} max={100} value={p.fatigue} />
                    <span>{Math.round(p.fatigue)} / 100</span>
                  </label>
                </div>
              </>
            )}
            {modal === "notebook" && (
              <>
                <div className="eyebrow">A RECORD OF YOUR DAY</div>
                <h2>Notebook</h2>
                <div className="note-entry">
                  <textarea
                    aria-label="Notebook entry"
                    placeholder="Something you noticed, a question to follow…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <button
                    className="filled-button"
                    disabled={!note.trim()}
                    onClick={() => {
                      runtime.addNote(note, selection?.claim);
                      setNote("");
                    }}
                  >
                    Save observation
                  </button>
                </div>
                {runtime.engine.state.notes.map((n) => (
                  <div key={n.id} className="saved-note">
                    <small>{timeLabel(n.time)} · Your observation</small>
                    <p>{n.text}</p>
                  </div>
                ))}
                <h3>What happened</h3>
                <div className="event-log">
                  {[...runtime.engine.state.events].reverse().map((e) => (
                    <div key={e.id}>
                      <time>{timeLabel(e.time)}</time>
                      <span>{e.text}</span>
                    </div>
                  ))}
                </div>
                <button
                  className="action"
                  onClick={() =>
                    download("uhs-notebook.json", {
                      world: obs.manifest,
                      notes: runtime.engine.state.notes,
                      events: runtime.engine.state.events,
                      evidence: pack.evidence,
                    })
                  }
                >
                  <Download size={16} /> Export notebook and sources
                </button>
              </>
            )}
            {modal === "evidence" && (
              <>
                <div className="eyebrow">HISTORY & INTERPRETATION</div>
                <h2>Why does the world depict this?</h2>
                {[
                  evidence,
                  ...pack.evidence.filter((e) => e.id !== evidence.id),
                ].map((e) => (
                  <article className="evidence-card" key={e.id}>
                    <span className="evidence-status">
                      {e.status === "documented"
                        ? "Documented foundation"
                        : "Inferred detail"}
                    </span>
                    <h3>{e.title}</h3>
                    <p>{e.statement}</p>
                    <p className="limitation">{e.limitation}</p>
                    <a href={e.url} target="_blank" rel="noreferrer">
                      Examine the source <ExternalLink size={13} />
                    </a>
                    <button
                      className="text-button"
                      onClick={() => runtime.addNote(e.statement, e.id)}
                    >
                      Save to notebook
                    </button>
                  </article>
                ))}
              </>
            )}
            {modal === "map" && (
              <>
                <div className="eyebrow">THE CONNECTED LANDSCAPE</div>
                <h2>{pack.region}</h2>
                <p>
                  Roads and settlements share the same world as the map beneath
                  your feet.
                </p>
                {pack.setting && (
                  <div className="weaver-modes">
                    <button
                      aria-pressed={!earthMap}
                      onClick={() => setEarthMap(false)}
                    >
                      Region
                    </button>
                    <button
                      aria-pressed={earthMap}
                      onClick={() => setEarthMap(true)}
                    >
                      Earth
                    </button>
                    {!earthMap && (
                      <>
                        <button
                          onClick={() => setMapSpan(Math.max(800, mapSpan / 2))}
                        >
                          Zoom in
                        </button>
                        <button
                          onClick={() =>
                            setMapSpan(Math.min(131072, mapSpan * 2))
                          }
                        >
                          Zoom out
                        </button>
                        <span>
                          {Math.round((mapSpan * 2) / 1000)} game km across
                        </span>
                      </>
                    )}
                  </div>
                )}
                {earthMap && pack.setting ? (
                  <AtlasMap
                    {...fromAtlas(
                      toAtlas(pack.anchor.lon, pack.anchor.lat).x + p.pos.x,
                      toAtlas(pack.anchor.lon, pack.anchor.lat).y + p.pos.y,
                    )}
                  />
                ) : (
                  <Minimap
                    runtime={runtime}
                    large
                    span={pack.setting ? mapSpan : undefined}
                  />
                )}
                <div className="destinations">
                  {runtime.engine.world.settlements.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        if (p.pos.space !== "outside") {
                          runtime.notice = "Return outside before traveling.";
                          runtime.emit();
                        } else runtime.walkTo({ x: s.x + 2, y: s.y + 5 });
                        setModal(null);
                      }}
                    >
                      <Compass size={17} />
                      <span>
                        {s.name}
                        <small>
                          {Math.round(
                            Math.hypot(s.x - p.pos.x, s.y - p.pos.y) * 2,
                          )}{" "}
                          m in a straight line
                        </small>
                      </span>
                      <ArrowRight size={15} />
                    </button>
                  ))}
                </div>
                <p className="map-note">
                  {pack.setting
                    ? "A compressed Earth atlas with continuous, generated local terrain. Zoom out to follow the same coastlines and waterways."
                    : `An invented settlement near ${pack.anchor.label}.`}
                </p>
              </>
            )}
            {modal === "settings" && (
              <>
                <div className="eyebrow">YOUR WORLD</div>
                <h2>Settings & saved journeys</h2>
                <button
                  className="action"
                  onClick={() => {
                    runtime.stop();
                    setModal(null);
                    setCharacterOpen(true);
                  }}
                >
                  Character lab · appearance & clothing
                </button>
                <button
                  className="action"
                  onClick={() =>
                    window.dispatchEvent(new Event("uhs-open-props"))
                  }
                >
                  Prop gallery · ⌘2 / Ctrl+2
                </button>
                <button
                  className="action"
                  onClick={() => {
                    runtime.stop();
                    setModal(null);
                    setAudioOpen(true);
                  }}
                >
                  <Music2 size={16} /> Audio studio · ⌘1 / Ctrl+1
                </button>
                <a
                  className="action"
                  href="/graphics-lab"
                  target="_blank"
                  rel="noreferrer"
                >
                  Graphics lab ↗
                </a>
                <a
                  className="action"
                  href="/history-lab"
                  target="_blank"
                  rel="noreferrer"
                >
                  History & content lab ↗
                </a>
                <p>
                  Simulation time moves only when you act. Reading and typing
                  never advance the day.
                </p>
                <div className="settings-row">
                  <span>World magnification</span>
                  <div>
                    <button
                      className="icon-button"
                      aria-label="Decrease zoom"
                      onClick={() => runtime.setZoom(view.zoom - 1)}
                    >
                      <Minus size={17} />
                    </button>{" "}
                    {view.zoom}×{" "}
                    <button
                      className="icon-button"
                      aria-label="Increase zoom"
                      onClick={() => runtime.setZoom(view.zoom + 1)}
                    >
                      <Plus size={17} />
                    </button>
                  </div>
                </div>
                <div className="settings-actions">
                  <button
                    className="action"
                    onClick={() => {
                      if (writer)
                        void save(runtime.engine.snapshot()).then(() => {
                          setSaved(true);
                          setTimeout(() => setSaved(false), 1500);
                        });
                    }}
                    disabled={!writer}
                  >
                    <Check size={16} />
                    {saved ? "Saved" : "Save now"}
                  </button>
                  <button
                    className="action"
                    onClick={() =>
                      download(
                        `uhs-${pack.id}-${obs.manifest.seed}.json`,
                        runtime.engine.snapshot(),
                      )
                    }
                  >
                    <Download size={16} /> Export world
                  </button>
                  <button
                    className="action"
                    onClick={() => upload.current?.click()}
                  >
                    <Upload size={16} /> Import world
                  </button>
                  <button
                    className="action"
                    onClick={() =>
                      download("uhs-trajectory.json", {
                        manifest: obs.manifest,
                        commands: runtime.engine.state.log,
                        hash: runtime.engine.hash(),
                      })
                    }
                  >
                    <Footprints size={16} /> Export trajectory
                  </button>
                  <button
                    className="action"
                    onClick={() => replayUpload.current?.click()}
                  >
                    <Play size={16} /> Replay a journey
                  </button>
                  <button
                    className="action"
                    onClick={() => setModal("evidence")}
                  >
                    <BookOpen size={16} /> Historical sources
                  </button>
                </div>
                <input
                  hidden
                  type="file"
                  accept=".json"
                  ref={replayUpload}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      if (file.size > 20000000) throw Error("File too large");
                      runtime.loadReplay(JSON.parse(await file.text()));
                      setModal(null);
                    } catch {
                      setError("This is not a compatible recorded journey.");
                    }
                  }}
                />
                <input
                  hidden
                  type="file"
                  accept=".json"
                  ref={upload}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      if (file.size > 20000000) throw Error("File too large.");
                      const engine = restoreSession(
                        JSON.parse(await file.text()),
                      );
                      runtime.replace(engine);
                      setModal(null);
                    } catch {
                      setError(
                        "This file is not a compatible UHS world. Your current world is unchanged.",
                      );
                    }
                  }}
                />
                {error && <p className="error">{error}</p>}
                <div className="settings-footnote">
                  <strong>Procedural mode</strong>
                  <p>
                    Everything runs on your device. No account, API key, or
                    model spending. Free-form model interpretation is a later
                    integration.
                  </p>
                  <small>
                    Original pixel art · Content version 1 · Simulation version
                    1
                  </small>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
