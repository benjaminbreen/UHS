import { CharacterSprite } from "./CharacterSprite";
import "./settings.css";
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
  Heart,
} from "lucide-react";
import { weatherAt } from "../core/weather";
import { lightingAt } from "../render/lighting";
import { regionAt } from "../content/geography/region-label";
import { WeatherPanel } from "./WeatherPanel";
import { AudioDirector } from "../audio/director";
const AudioLab = lazy(() =>
  import("../dev/AudioLab").then((m) => ({ default: m.AudioLab })),
);
import type { Runtime } from "../runtime/session";
import { restoreSession } from "../runtime/session";
import { download } from "../runtime/storage";
import { items } from "../content/packs";
import { distance, type ItemId, type PlayerCommand } from "../core/types";
import { WorldScene } from "../render/WorldScene";
import { WorldSetup } from "./WorldSetup";
import { AtlasMap } from "./AtlasMap";
import { toAtlas, fromAtlas } from "../world/geography/coordinates";
import { Sprite, Minimap, timeLabel } from "./components";
const CharacterLab = lazy(() =>
  import("../dev/CharacterLab").then((m) => ({ default: m.CharacterLab })),
);
export function App({ runtime }: { runtime: Runtime; writer: boolean }) {
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
  const [settingsTab, setSettingsTab] = useState("Display");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [command, setCommand] = useState("");
  const [sidebar, setSidebar] = useState(() => window.innerWidth > 640);
  const [mapRegion, setMapRegion] = useState(false);
  const [sideTab, setSideTab] = useState<"around" | "inventory" | "today">(
    "around",
  );
  const [mapSpan, setMapSpan] = useState(1600);
  const [earthMap, setEarthMap] = useState(false);
  // Reads the live snapshot so the keyboard listener never sees a stale world.
  const talkToNearest = () => {
    const { observation: o } = runtime.getSnapshot();
    const nearest = o.actors
      .filter((a) => a.kind === "human")
      .sort(
        (a, b) => distance(a.pos, o.player.pos) - distance(b.pos, o.player.pos),
      )[0];
    if (nearest) runtime.select(nearest.id);
    else {
      runtime.notice = "No one is in sight. Walk farther to meet someone.";
      runtime.emit();
    }
  };
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
      if (e.key.toLowerCase() === "q") talkToNearest();
      if (e.key.toLowerCase() === "r") setModal("map");
      if (e.key.toLowerCase() === "t")
        runtime.command({ type: "wait", seconds: 300 });
      if (e.key.toLowerCase() === "m") setModal("map");
      if (e.key.toLowerCase() === "j" || e.key.toLowerCase() === "n")
        setModal("notebook");
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
  const setting = pack.setting;
  const weather = weatherAt(
    obs.manifest.seed,
    setting?.climate ?? "temperate",
    setting?.season ?? "spring",
    obs.clock,
  );
  const lighting = lightingAt(obs.clock).id;
  const regionLabel =
    (setting && regionAt(setting.lon, setting.lat)?.label) || pack.region;
  const landscape = setting
    ? `${setting.climate[0].toUpperCase()}${setting.climate.slice(1)} ${
        setting.water.startsWith("river")
          ? "river valley"
          : setting.water.startsWith("coast")
            ? "coast"
            : setting.water === "lake"
              ? "lakeshore"
              : setting.relief > 0.5
                ? "hill country"
                : "plain"
      }`
    : pack.subtitle;
  const focusActor = obs.actors.find((a) => a.id === selection?.id);
  const focusSprite =
    selection &&
    (selection.sprite ??
      runtime.engine.world.place(selection.id)?.sprite ??
      obs.objects.find((o) => o.id === selection.id)?.sprite ??
      (focusActor
        ? focusActor.kind === "human"
          ? `${focusActor.sprite}-2-0`
          : `${focusActor.sprite}0`
        : undefined));
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
          <div>
            Universal History Simulator <i aria-hidden="true">✦</i>
          </div>
        </div>
        <button
          className="world-selector"
          onClick={openWorld}
          title="Change your world"
        >
          <i aria-hidden="true">◆</i>
          <span>
            {pack.name}, {pack.date}
          </span>
          <i aria-hidden="true">◆</i>
          <Pencil size={15} />
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
          <a
            className="quiet-button donate"
            href="https://buy.stripe.com/5kQaEXfJLgRGbqrf1L4F201"
            target="_blank"
            rel="noreferrer"
          >
            <Heart size={15} /> Donate
          </a>
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
          <footer className="bottom-bar">
            <div className="quick-actions">
              <button onClick={talkToNearest}>
                <MessageCircle size={17} />
                <span>Talk</span>
                <kbd>Q</kbd>
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
                <kbd>E</kbd>
              </button>
              <button onClick={() => setModal("map")}>
                <MapIcon size={17} />
                <span>Travel</span>
                <kbd>R</kbd>
              </button>
              <button
                onClick={() => runtime.command({ type: "wait", seconds: 300 })}
              >
                <Hourglass size={17} />
                <span>Wait</span>
                <kbd>T</kbd>
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
              <span className="hint-event">
                <i aria-hidden="true">✦</i>
                {obs.events.at(-1)?.text}
                <i aria-hidden="true">✦</i>
              </span>
              <span>
                <kbd>W</kbd>
                <kbd>A</kbd>
                <kbd>S</kbd>
                <kbd>D</kbd> walk
              </span>
              <span>
                <kbd>SPACE</kbd> interact
              </span>
              <span>
                <kbd>M</kbd> map
              </span>
            </div>
          </footer>
        </section>
        <aside className="sidebar">
          <section className="sky-card frame">
            <div className="place-heading">
              <h2>{regionLabel}</h2>
              <p title={`Day ${day} · ${timeLabel(obs.clock)}`}>
                {pack.date} <span>·</span> {period}
              </p>
              <small>{landscape}</small>
            </div>
            <WeatherPanel weather={weather} lighting={lighting} period={period} />
            <div className="character">
              <div className="portrait">
                <CharacterSprite
                  appearance={runtime.appearanceFor(p)}
                  portrait
                />
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
                {(pack.currency || !p.origin) && (
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
                )}
              </div>
            </div>
          </section>
          <section className="region-section frame">
            <div className="section-heading">
              <h2>Map</h2>
              <div className="map-switcher" role="group" aria-label="Map scale">
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
              <button className="explore" onClick={() => setModal("map")}>
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
              <span className="map-scale">
                <i />
                {mapRegion
                  ? `${(runtime.engine.world.regionExtent ?? 320) * 2} m`
                  : "220 m"}
              </span>
            </button>
          </section>
          <section className="context-section frame">
            {selection ? (
              <>
                <div className="section-heading">
                  <span className="eyebrow">IN FOCUS</span>
                  <button
                    aria-label="Clear selection"
                    onClick={() => runtime.select()}
                  >
                    <X size={14} />
                  </button>
                </div>
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
                <div className="side-tabs" role="tablist">
                  {(
                    [
                      ["around", "Around you"],
                      ["inventory", "Inventory"],
                      ["today", "Today"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      role="tab"
                      aria-selected={sideTab === id}
                      onClick={() => setSideTab(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {sideTab === "around" && (
                  <div className="nearby-list">
                    {obs.actors
                      .filter((a) => a.kind === "human")
                      .sort(
                        (a, b) =>
                          distance(a.pos, p.pos) - distance(b.pos, p.pos),
                      )
                      .slice(0, 5)
                      .map((a) => (
                        <button key={a.id} onClick={() => runtime.select(a.id)}>
                          <CharacterSprite
                            appearance={runtime.appearanceFor(a)}
                          />
                          <span>
                            {a.name}
                            <small>{a.role}</small>
                          </span>
                          <ChevronDown size={13} />
                        </button>
                      ))}
                    {obs.actors.filter((a) => a.kind === "human").length ===
                      0 && <p>{pack.concern}</p>}
                  </div>
                )}
                {sideTab === "inventory" && (
                  <div className="nearby-list">
                    {Object.entries(p.inventory)
                      .filter(([, n]) => n! > 0)
                      .map(([id, n]) => (
                        <button
                          key={id}
                          onClick={() => setModal("inventory")}
                        >
                          <Sprite name={items[id as ItemId].sprite} scale={1} />
                          <span>
                            {items[id as ItemId].name}
                            <small>Quantity: {n}</small>
                          </span>
                          <ChevronDown size={13} />
                        </button>
                      ))}
                    {!Object.values(p.inventory).some((n) => n! > 0) && (
                      <p>You carry nothing.</p>
                    )}
                  </div>
                )}
                {sideTab === "today" && (
                  <div className="event-log">
                    {[...runtime.engine.state.events]
                      .reverse()
                      .slice(0, 8)
                      .map((e) => (
                        <div key={e.id}>
                          <time>{timeLabel(e.time)}</time>
                          <span>{e.text}</span>
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}
          </section>
          <div className="sidebar-footer">
            <button onClick={() => setModal("notebook")}>
              <NotebookPen size={17} /> Notebook <kbd>N</kbd>
            </button>
            <button onClick={() => setModal("inventory")}>
              <ShoppingBag size={17} /> Inventory <kbd>I</kbd>
            </button>
          </div>
        </aside>
      </main>
      <div className="statusbar">
        <span>
          <span className="live-dot" />
          Fresh world each reload · export to keep
        </span>
        <span>
          Seed: {obs.manifest.seed} <span className="status-divider">/</span> No
          model calls
        </span>
        <span>Click to walk · Scroll to zoom</span>
      </div>
      {audioOpen && audio && (
        <Suspense fallback={<div data-modal="true">Loading audio…</div>}>
          <AudioLab director={audio} onClose={() => setAudioOpen(false)} />
        </Suspense>
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
                      {
                        {
                          documented: "Documented foundation",
                          inferred: "Inferred detail",
                          hypothesis: "Historical hypothesis",
                          fictional: "Fictional scenario / art choice",
                        }[e.status]
                      }
                    </span>
                    <h3>{e.title}</h3>
                    <p>{e.statement}</p>
                    <p className="limitation">{e.limitation}</p>
                    {e.url && (
                      <a href={e.url} target="_blank" rel="noreferrer">
                        Examine the source <ExternalLink size={13} />
                      </a>
                    )}
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
                <h2>Settings</h2>
                <div
                  className="settings-tabs"
                  role="tablist"
                  aria-label="Settings sections"
                >
                  {["Display", "Audio", "Journeys", "Developer"].map(
                    (tab, index, tabs) => (
                      <button
                        key={tab}
                        id={`settings-tab-${tab}`}
                        role="tab"
                        aria-selected={settingsTab === tab}
                        aria-controls={`settings-panel-${tab}`}
                        tabIndex={settingsTab === tab ? 0 : -1}
                        onClick={() => setSettingsTab(tab)}
                        onKeyDown={(e) => {
                          if (
                            ["ArrowRight", "ArrowLeft", "Home", "End"].includes(
                              e.key,
                            )
                          ) {
                            e.preventDefault();
                            const next =
                              e.key === "Home"
                                ? tabs[0]
                                : e.key === "End"
                                  ? tabs[tabs.length - 1]
                                  : tabs[
                                      (index +
                                        (e.key === "ArrowRight"
                                          ? 1
                                          : tabs.length - 1)) %
                                        tabs.length
                                    ];
                            setSettingsTab(next);
                            document
                              .getElementById(`settings-tab-${next}`)
                              ?.focus();
                          }
                        }}
                      >
                        {tab}
                      </button>
                    ),
                  )}
                </div>
                <div
                  role="tabpanel"
                  id="settings-panel-Developer"
                  aria-labelledby="settings-tab-Developer"
                  hidden={settingsTab !== "Developer"}
                  className="settings-tools"
                >
                  <p>Inspect artwork and content in the development labs.</p>
                  <a
                    className="action settings-featured"
                    href="/nature-lab"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Plants & animals{" "}
                    <small>
                      Browse sprites · compare backgrounds · preview animation
                      ↗
                    </small>
                  </a>
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
                    href="/building-lab"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Building panel · models & religious recipes ↗
                  </a>
                  <a
                    className="action"
                    href="/terrain-lab"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Terrain lab ↗
                  </a>
                  <a
                    className="action"
                    href="/history-lab"
                    target="_blank"
                    rel="noreferrer"
                  >
                    History & content lab ↗
                  </a>
                </div>
                <div
                  role="tabpanel"
                  id="settings-panel-Audio"
                  aria-labelledby="settings-tab-Audio"
                  hidden={settingsTab !== "Audio"}
                >
                  <h3>Music & sound</h3>
                  <p>
                    Listen, adjust playback, and explore the score in the audio
                    studio.
                  </p>
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
                </div>
                <div
                  role="tabpanel"
                  id="settings-panel-Display"
                  aria-labelledby="settings-tab-Display"
                  hidden={settingsTab !== "Display"}
                >
                  <h3>World display</h3>
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
                </div>
                <div
                  role="tabpanel"
                  id="settings-panel-Journeys"
                  aria-labelledby="settings-tab-Journeys"
                  hidden={settingsTab !== "Journeys"}
                >
                  <h3>Journeys & sources</h3>
                  <div className="settings-actions">
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
                        if (file.size > 20000000)
                          throw Error("File too large.");
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
                </div>
                <div className="settings-footnote">
                  <strong>Procedural mode</strong>
                  <p>
                    Everything runs on your device. No account, API key, or
                    model spending. Free-form model interpretation is a later
                    integration.
                  </p>
                  <small>
                    Original pixel art · Universal History Simulator
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
