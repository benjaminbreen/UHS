import { CharacterSprite } from "./CharacterSprite";
import { CharacterPanel } from "./CharacterPanel";
import "./settings.css";
import {
  lazy,
  Suspense,
  type PointerEvent as ReactPointerEvent,
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
  ScrollText,
} from "lucide-react";
import { weatherAt } from "../core/weather";
import { seasonFor } from "../core/season";
import { lightingAt } from "../render/lighting";
import { regionAt } from "../content/geography/region-label";
import { WeatherPanel } from "./WeatherPanel";
import { sexFromName } from "../content/characters/name-sex";
import { AudioDirector } from "../audio/director";
const AudioLab = lazy(() =>
  import("../dev/AudioLab").then((m) => ({ default: m.AudioLab })),
);
import type { Runtime } from "../runtime/session";
import { restoreSession, ZOOM_STEPS } from "../runtime/session";

const formatZoom = (z: number) =>
  Number.isInteger(z) ? `${z}` : z.toFixed(2).replace(/0$/, "");
import { download } from "../runtime/storage";
import { distance, type PlayerCommand } from "../core/types";
import { describeStats, statKeys } from "../core/stats";
import { describeStanding, standingOf } from "../core/standing";
import { outlookOf, shortLabel } from "../core/outlook";

/** Both lines under the role must stay on one line each: as many words as fit,
 * fewer when they are long ones like "set in their ways". */
const fit = (words: string[], most: number, room: number, sep: string) => {
  for (let n = Math.min(most, words.length); n > 1; n--) {
    const line = words.slice(0, n).join(sep);
    if (line.length <= room) return line;
  }
  return words[0] ?? "";
};
const fitTraits = (words: string[]) => fit(words, 4, 28, ", ");
const fitOutlook = (words: string[]) => fit(words, 2, 25, " · ");
import { narratorProvider, PROVIDER_KEY } from "../narrator/turn";
import { NarratorPanel, turnTime } from "./NarratorPanel";
import { DialogueModal } from "./DialogueModal";
import { WorldScene } from "../render/WorldScene";
import { WorldSetup } from "./WorldSetup";
import { AtlasMap } from "./AtlasMap";
import { toAtlas, fromAtlas } from "../world/geography/coordinates";
import { Sprite, Minimap, timeLabel } from "./components";
import { LiveGraphicsPanel } from "../dev/LiveGraphicsPanel";
import {
  defaultLiveGraphicsSettings,
  type LiveGraphicsSettings,
} from "../render/live-graphics";
import type { FaunaState } from "../core/fauna";
const CharacterLab = lazy(() =>
  import("../dev/CharacterLab").then((m) => ({ default: m.CharacterLab })),
);
const PortraitLab = lazy(() =>
  import("../dev/PortraitLab").then((m) => ({ default: m.PortraitLab })),
);
/** Rest is the only way to move the clock by hand, so it offers the three
 * spans that matter: a pause, an afternoon, and the night. */
const REST_OPTIONS: {
  label: string;
  command: (runtime: Runtime) => PlayerCommand;
}[] = [
  { label: "Rest an hour", command: () => ({ type: "sleep", seconds: 3600 }) },
  {
    label: "Rest five hours",
    command: () => ({ type: "sleep", seconds: 5 * 3600 }),
  },
  {
    label: "Sleep until morning",
    command: (runtime) => ({
      type: "sleep",
      seconds: runtime.engine.untilMorning(),
    }),
  },
];

export function App({ runtime }: { runtime: Runtime; writer: boolean }) {
  const view = useSyncExternalStore(runtime.subscribe, runtime.getSnapshot);
  const { observation: obs, selection, pack } = view;
  const p = obs.player;
  const propControls = runtime.propControls();
  const speaker = runtime.nearestSpeaker();
  const [audio, setAudio] = useState<AudioDirector | null>(null);
  const [audioOpen, setAudioOpen] = useState(false);
  const [characterOpen, setCharacterOpen] = useState(false);
  const [portraitOpen, setPortraitOpen] = useState(false);
  const [statDetails, setStatDetails] = useState(false);
  const [provider, setProvider] = useState(narratorProvider);
  useEffect(() => {
    const director = new AudioDirector();
    setAudio(director);
    return () => director.dispose();
  }, []);
  useEffect(() => audio?.updateWorld(obs.clock), [audio, obs.clock]);
  const [restOpen, setRestOpen] = useState(false);
  const [modal, setModal] = useState<
    | "world"
    | "inventory"
    | "notebook"
    | "evidence"
    | "map"
    | "settings"
    | "narration"
    | "dialogue"
    | "character"
    | null
  >(null);
  const [characterId, setCharacterId] = useState("player");
  const openCharacter = (id: string) => {
    setCharacterId(id);
    setModal("character");
  };
  const [narratorOpen, setNarratorOpen] = useState(false);
  const [graphicsOpen, setGraphicsOpen] = useState(false);
  const [liveGraphics, setLiveGraphics] = useState<LiveGraphicsSettings>(
    () => ({
      ...defaultLiveGraphicsSettings,
    }),
  );
  const liveGraphicsRef = useRef(liveGraphics);
  const [narratorBusy, setNarratorBusy] = useState(false);
  const [narratorError, setNarratorError] = useState("");
  const [dialogueActorId, setDialogueActorId] = useState<string | null>(null);
  const commandForm = useRef<HTMLFormElement>(null);
  const say = async () => {
    const text = command.trim();
    if (!text || narratorBusy) return;
    setNarratorOpen(true);
    setNarratorBusy(true);
    setNarratorError("");
    setCommand("");
    const turn = await runtime.say(text);
    setNarratorBusy(false);
    setNarratorError(turn.error ?? "");
  };
  const [settingsTab, setSettingsTab] = useState("Display");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [command, setCommand] = useState("");
  const [sidebar, setSidebar] = useState(true);
  const [sheetSnap, setSheetSnap] = useState<"peek" | "half" | "full">("peek");
  const sheetPointerStart = useRef<number | null>(null);
  const [mapRegion, setMapRegion] = useState(false);
  const [sideTab, setSideTab] = useState<"around" | "inventory" | "today">(
    "around",
  );
  const [mapSpan, setMapSpan] = useState(1600);
  const [earthMap, setEarthMap] = useState(false);
  // Reads the live snapshot so the keyboard listener never sees a stale world.
  const talkToNearest = () => {
    const inReach = runtime.nearestSpeaker();
    if (inReach) {
      openDialogue(inReach.id);
      return;
    }
    const { observation: o } = runtime.getSnapshot();
    const nearest = o.actors
      .filter((a) => a.kind === "human")
      .sort(
        (a, b) => distance(a.pos, o.player.pos) - distance(b.pos, o.player.pos),
      )[0];
    if (nearest) openDialogue(nearest.id);
    else {
      runtime.notice = "No one is in sight. Walk farther to meet someone.";
      runtime.emit();
    }
  };
  const openDialogue = (id: string) => {
    const actor = runtime.engine.state.actors.find(
      (candidate) => candidate.id === id,
    );
    if (!actor || actor.kind !== "human") return;
    const result = runtime.command({
      type: "interact",
      target: id,
      action: "talk",
    });
    if (result?.status !== "completed") return;
    setDialogueActorId(id);
    setModal("dialogue");
  };
  const mount = useRef<HTMLDivElement>(null);
  const upload = useRef<HTMLInputElement>(null);
  const replayUpload = useRef<HTMLInputElement>(null);
  const game = useRef<Phaser.Game | undefined>(undefined);
  useEffect(() => {
    if (!mount.current) return;
    const scene = new WorldScene(runtime);
    scene.applyLiveGraphics(liveGraphicsRef.current);
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
      scene,
      // Two touches for pinch-zoom, plus a spare so a third finger is ignored.
      input: { activePointers: 3 },
      audio: { noAudio: true },
      banner: false,
    });
    game.current = g;
    return () => {
      g.destroy(true);
    };
  }, [runtime]);
  const updateLiveGraphics = (patch: Partial<LiveGraphicsSettings>) => {
    const next = { ...liveGraphicsRef.current, ...patch };
    liveGraphicsRef.current = next;
    setLiveGraphics(next);
    const scene = game.current?.scene.getScene("world") as
      | WorldScene
      | undefined;
    scene?.applyLiveGraphics(next);
  };
  const resetLiveGraphics = () => {
    updateLiveGraphics(defaultLiveGraphicsSettings);
    runtime.setZoom(2);
  };
  useEffect(() => {
    if (selection && window.innerWidth <= 640) {
      setSidebar(true);
      setSheetSnap("half");
    }
  }, [selection?.id]);
  const toggleCharacterPanel = () => {
    if (sidebar) setSidebar(false);
    else {
      setSidebar(true);
      setSheetSnap("half");
    }
  };
  const onSheetPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    sheetPointerStart.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onSheetPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const start = sheetPointerStart.current;
    sheetPointerStart.current = null;
    if (start === null) return;
    const delta = event.clientY - start;
    if (delta > 42) {
      if (sheetSnap === "full") setSheetSnap("half");
      else setSidebar(false);
    } else if (delta < -42) {
      setSheetSnap(sheetSnap === "peek" ? "half" : "full");
    } else {
      setSheetSnap(sheetSnap === "peek" ? "half" : "peek");
    }
  };
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
        setPortraitOpen(false);
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
      if (e.code === "Space") e.preventDefault();
      if (
        (e.code === "KeyE" || e.code === "KeyG" || e.code === "KeyF") &&
        !e.repeat
      ) {
        e.preventDefault();
        runtime.propAction(e.code);
      }
      if (e.key === "=" || e.key === "+") runtime.stepZoom(1);
      if (e.key === "-" || e.key === "_") runtime.stepZoom(-1);
      if (e.key === "0") runtime.setZoom(2);
      if (e.key.toLowerCase() === "i") setModal("inventory");
      if (e.key.toLowerCase() === "q") talkToNearest();
      if (e.key === "Enter" && !e.repeat && runtime.nearestSpeaker()) {
        e.preventDefault();
        talkToNearest();
      }
      if (e.key.toLowerCase() === "c" && !e.repeat) {
        e.preventDefault();
        runtime.climb();
      }
      if (e.key.toLowerCase() === "r") setModal("map");
      if (e.key.toLowerCase() === "t") setRestOpen((open) => !open);
      if (e.key.toLowerCase() === "m") setModal("map");
      if (e.key.toLowerCase() === "j" || e.key.toLowerCase() === "n")
        setModal("notebook");
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [modal, audioOpen, runtime]);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.code !== "Backquote" || !(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      if (!e.repeat) setGraphicsOpen((open) => !open);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
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
  const season = seasonFor(
    setting?.climate ?? "temperate",
    setting?.season ?? "spring",
    obs.clock,
  );
  const lighting = lightingAt(obs.clock).id;
  const regionLabel =
    (setting && regionAt(setting.lon, setting.lat)?.label) || pack.region;
  const borderHint = runtime.journey?.borderHint();
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
  // Kits without gendered names leave origin.sex unspecified; the drawn body still has one.
  const playerSex =
    p.origin?.sex && p.origin.sex !== "unspecified"
      ? p.origin.sex
      : (runtime.appearanceFor(p).physique?.sex ?? "unspecified") !==
          "unspecified"
        ? runtime.appearanceFor(p).physique?.sex
        : sexFromName(p.name);
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
    if (c.type === "interact" && c.action === "talk") {
      openDialogue(c.target);
      return;
    }
    if (c.type === "interact" && c.action === "follow")
      runtime.startFollow(c.target);
    else runtime.command(c);
  };
  const openWorld = () => {
    setModal("world");
    setError("");
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
      {portraitOpen && (
        <Suspense fallback={<div data-modal="true">Loading portraits…</div>}>
          <PortraitLab
            runtime={runtime}
            onClose={() => setPortraitOpen(false)}
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
            aria-label="Playable historical world. WASD or arrows to walk, Shift to run, Space to jump or pick up and drop items. Hold Space to charge a longer jump; jumping while running clears an extra tile."
            tabIndex={0}
          />
          {graphicsOpen && (
            <LiveGraphicsPanel
              settings={liveGraphics}
              zoom={view.zoom}
              onChange={updateLiveGraphics}
              onZoom={(zoom) => runtime.setZoom(zoom)}
              onClose={() => setGraphicsOpen(false)}
              onReset={resetLiveGraphics}
              onAddAnimal={(species, state: FaunaState, count) =>
                (
                  game.current?.scene.getScene("world") as
                    | WorldScene
                    | undefined
                )?.addTestFauna(species, state, count) ?? 0
              }
              onClearAnimals={() =>
                (
                  game.current?.scene.getScene("world") as
                    | WorldScene
                    | undefined
                )?.clearTestFauna()
              }
            />
          )}
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
                <span title="Throw in your facing direction">X · Throw</span>{" "}
                <button onClick={() => runtime.propAction("KeyG")}>
                  Space · Put down
                </button>
              </span>
            )}
            {propControls.primary && (
              <button
                onClick={() =>
                  runtime.propAction(propControls.held ? "KeyF" : "Space")
                }
              >
                {propControls.held ? "F" : "Space"} ·{" "}
                {propControls.primaryLabel}
              </button>
            )}
            {propControls.secondary && (
              <button onClick={() => runtime.propAction("KeyE")}>
                Press E to {propControls.secondaryLabel?.toLowerCase()}
              </button>
            )}
            {speaker && (
              <button
                className="talk-prompt"
                onClick={() => openDialogue(speaker.id)}
              >
                Enter · Talk to {speaker.name}
              </button>
            )}
            {(view.perch || view.climbable) && (
              <button className="talk-prompt" onClick={() => runtime.climb()}>
                C ·{" "}
                {view.perch
                  ? `Climb down from ${view.perch.label}`
                  : `Climb ${view.climbable!.label}`}
              </button>
            )}
          </div>
          <div className="map-controls">
            <button
              aria-label="Zoom out"
              onClick={() => runtime.stepZoom(-1)}
              disabled={view.zoom <= ZOOM_STEPS[0]}
            >
              <Minus size={17} />
            </button>
            <span>{formatZoom(view.zoom)}×</span>
            <button
              aria-label="Zoom in"
              onClick={() => runtime.stepZoom(1)}
              disabled={view.zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
            >
              <Plus size={17} />
            </button>
            <button
              aria-label="Toggle character panel"
              onClick={toggleCharacterPanel}
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
          {borderHint && (
            <div
              className="world-notice border-hint"
              role="status"
              aria-label="Map travel"
            >
              {borderHint}
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
          <NarratorPanel
            anchor={commandForm}
            open={narratorOpen && !modal}
            busy={narratorBusy}
            error={narratorError}
            last={runtime.engine.state.narration?.at(-1)}
            onClose={() => setNarratorOpen(false)}
            onLog={() => setModal("narration")}
          />
          <footer className="bottom-bar">
            <div className="quick-actions">
              <button onClick={talkToNearest}>
                <MessageCircle size={17} />
                <span>Talk</span>
                <kbd>{speaker ? "Enter" : "Q"}</kbd>
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
              <div className="rest-menu">
                {restOpen && (
                  <div className="rest-options" role="menu">
                    {REST_OPTIONS.map((option) => (
                      <button
                        key={option.label}
                        role="menuitem"
                        onClick={() => {
                          setRestOpen(false);
                          runtime.command(option.command(runtime));
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  aria-expanded={restOpen}
                  onClick={() => setRestOpen((open) => !open)}
                >
                  <Hourglass size={17} />
                  <span>Rest</span>
                  <kbd>T</kbd>
                </button>
              </div>
            </div>
            <form
              ref={commandForm}
              className="command-input"
              onSubmit={(e) => {
                e.preventDefault();
                void say();
              }}
            >
              <input
                aria-label="Action command"
                value={command}
                disabled={narratorBusy}
                onChange={(e) => setCommand(e.target.value)}
                onFocus={() => setNarratorOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setNarratorOpen(false);
                }}
                placeholder="What do you want to do?"
              />
              <button aria-label="Tell the narrator" disabled={narratorBusy}>
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
                <kbd>SHIFT</kbd> run <kbd>C</kbd> climb
              </span>
              <span title="Tap to jump; hold to charge. A running jump clears an extra tile. Nearby items take priority. No jumping while carrying.">
                <kbd>SPACE</kbd>{" "}
                {propControls.held
                  ? "drop"
                  : propControls.primary
                    ? "pick up"
                    : "jump (hold: long)"}
              </span>
              <span>
                <kbd>M</kbd> map
              </span>
            </div>
          </footer>
        </section>
        <aside className="sidebar" data-sheet-snap={sheetSnap}>
          <button
            className="mobile-sheet-grabber"
            aria-label={
              sheetSnap === "full"
                ? "Collapse character panel"
                : "Expand character panel"
            }
            onPointerDown={onSheetPointerDown}
            onPointerUp={onSheetPointerUp}
          >
            <span />
          </button>
          <button
            className="mobile-sheet-summary"
            aria-label="Expand character panel"
            onClick={() => setSheetSnap("half")}
          >
            <CharacterSprite appearance={runtime.appearanceFor(p)} />
            <span>
              <strong>{p.name}</strong>
              <small>{p.role}</small>
            </span>
            <ChevronDown aria-hidden="true" />
          </button>
          <section className="sky-card frame">
            <div className="place-heading">
              <h2>{regionLabel}</h2>
              <p title={`Day ${day} · ${timeLabel(obs.clock)}`}>
                {pack.date} <span>·</span>{" "}
                <em
                  className={`season season-${season.id}`}
                  style={{ ["--season" as string]: season.color }}
                >
                  {season.label}
                </em>
              </p>
              <small>{landscape}</small>
            </div>
            <WeatherPanel
              weather={weather}
              lighting={lighting}
              period={period}
            />
            <button
              className="character"
              aria-label={`Open ${p.name}'s profile`}
              onClick={() => openCharacter(p.id)}
            >
              <div className="portrait">
                <CharacterSprite
                  appearance={runtime.appearanceFor(p)}
                  age={p.age}
                  portrait
                />
              </div>
              <div>
                <h1>{p.name}</h1>
                <div className="role">
                  {p.role}
                  {playerSex === "female" && (
                    <i className="sex female" title="Female">
                      ♀
                    </i>
                  )}
                  {playerSex === "male" && (
                    <i className="sex male" title="Male">
                      ♂
                    </i>
                  )}
                  {p.age !== undefined && <span> · {p.age}</span>}
                </div>
                {pack.setting && (
                  <span className="condition">
                    {fitOutlook(
                      outlookOf(obs.manifest.seed, p, pack.setting).stances.map(
                        shortLabel,
                      ),
                    )}
                  </span>
                )}
                {p.stats && (
                  <span className="traits">
                    {fitTraits(describeStats(p.stats)) || "unremarkable"}
                  </span>
                )}
                {(pack.currency ||
                  !p.origin ||
                  (p.inventory.coin ?? 0) > 0) && (
                  <div className="wealth">
                    <Sprite
                      name={
                        pack.currency || (p.inventory.coin ?? 0) > 0
                          ? "coin"
                          : "obsidian"
                      }
                      scale={1}
                    />
                    <span>
                      {pack.currency || (p.inventory.coin ?? 0) > 0
                        ? `${p.inventory.coin ?? 0} bronze coins`
                        : `${p.inventory.obsidian ?? 0} obsidian flakes`}
                    </span>
                  </div>
                )}
              </div>
            </button>
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
                      .map(([id, n]) => `${n} ${runtime.item(id)!.name}`)
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
                        <button
                          key={a.id}
                          onClick={() => {
                            runtime.select(a.id);
                            openCharacter(a.id);
                          }}
                        >
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
                        <button key={id} onClick={() => setModal("inventory")}>
                          <Sprite name={runtime.item(id)!.sprite} scale={1} />
                          <span>
                            {runtime.item(id)!.name}
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
            <button aria-label="Notebook" onClick={() => setModal("notebook")}>
              <NotebookPen size={17} /> Notebook <kbd aria-hidden="true">N</kbd>
            </button>
            <button
              aria-label="Inventory"
              onClick={() => setModal("inventory")}
            >
              <ShoppingBag size={17} /> Inventory{" "}
              <kbd aria-hidden="true">I</kbd>
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
      {modal && modal !== "dialogue" && (
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
            {modal === "character" && (
              <CharacterPanel
                runtime={runtime}
                actorId={characterId}
                onClose={() => setModal(null)}
                onAction={doAction}
                onSelect={setCharacterId}
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
                          .map(([id, n]) => `${n} ${runtime.item(id)!.name}`)
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
                          <Sprite name={runtime.item(id)!.sprite} scale={2} />
                        </div>
                        <div>
                          <strong>{runtime.item(id)!.name}</strong>
                          <small>Quantity: {n}</small>
                        </div>
                        {runtime.item(id)!.edible && (
                          <button
                            className="small-button"
                            onClick={() =>
                              runtime.command({
                                type: "use",
                                item: id,
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
                  <label>
                    Health <meter min={0} max={100} value={p.health ?? 100} />
                    <span>{Math.round(p.health ?? 100)} / 100</span>
                  </label>
                </div>
                {p.stats && (
                  <div className="stats">
                    <p>
                      You are{" "}
                      {describeStats(p.stats).join(", ") || "unremarkable"}
                      {((s) => (s ? `, ${describeStanding(s)}` : ""))(
                        standingOf(obs.manifest.seed, p),
                      )}
                      .{" "}
                      <button
                        className="link"
                        onClick={() => setStatDetails((v) => !v)}
                      >
                        {statDetails ? "Hide details" : "Details"}
                      </button>
                    </p>
                    {pack.setting && (
                      <ul className="outlook">
                        {outlookOf(
                          obs.manifest.seed,
                          p,
                          pack.setting,
                        ).stances.map((stance) => (
                          <li key={stance.id}>
                            <a
                              href={stance.wiki}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {stance.label}
                            </a>
                            {stance.note ? ` — ${stance.note}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                    {statDetails && (
                      <div className="needs">
                        {statKeys.map((k) => (
                          <label key={k}>
                            {k[0].toUpperCase() + k.slice(1)}{" "}
                            <meter min={0} max={100} value={p.stats![k]} />
                            <span>{p.stats![k]} / 100</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            {modal === "narration" && (
              <>
                <div className="eyebrow">WHAT THE NARRATOR TOLD YOU</div>
                <h2>Narration log</h2>
                {runtime.engine.state.narration?.length ? (
                  <ol className="narration-log">
                    {runtime.engine.state.narration.map((t, i) => (
                      <li key={i}>
                        <small>{turnTime(t.clock)}</small>
                        <p className="narrator-said">{t.input}</p>
                        <p>{t.text}</p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p>Nothing yet. Click the action bar and say what you do.</p>
                )}
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
                    {e.status && (
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
                    )}
                    <h3>{e.title}</h3>
                    <p>{e.statement}</p>
                    {e.limitation && (
                      <p className="limitation">{e.limitation}</p>
                    )}
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
                    className="action"
                    href="/water-experiments"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Water experiments{" "}
                    <small>
                      Compare current water with two animated prototypes
                    </small>
                  </a>
                  <a
                    className="action"
                    href="/geography-lab"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Geography &amp; travel{" "}
                    <small>
                      Inspect routes, landscape stops and map boundaries
                    </small>
                  </a>
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
                  <a
                    className="action settings-featured"
                    href="/fauna-lab"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Fauna lab{" "}
                    <small>
                      Compare species, behavior states, flock spacing and flight
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
                    className="action settings-featured"
                    onClick={() => {
                      runtime.stop();
                      setModal(null);
                      setPortraitOpen(true);
                    }}
                  >
                    Portrait lab · facial recipes &amp; A/B renderers
                    <small>
                      Compare identical characters at a native 64 × 80 pixels
                    </small>
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
                    className="action settings-featured"
                    href="/art-audit"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Art audit{" "}
                    <small>
                      Measure every shipped sprite and filter for the ones that
                      break the style
                    </small>
                  </a>
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
                    className="action settings-featured"
                    href="/terrain-experiments"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Terrain experiments ↗
                    <small>
                      Grass, dirt and altitude steps · procedural vs. tileset
                      atlas
                    </small>
                  </a>
                  <a
                    className="action settings-featured"
                    href="/grass-lab"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Grass texture lab ↗
                    <small>
                      Edit native pixels & colors · export a code-friendly JSON
                      recipe
                    </small>
                  </a>
                  <a
                    className="action settings-featured"
                    href="/tree-lab"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Tree texture lab ↗
                    <small>
                      Edit tree pixels & palettes · export an atlas-aware JSON
                      recipe
                    </small>
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
                        onClick={() => runtime.stepZoom(-1)}
                      >
                        <Minus size={17} />
                      </button>{" "}
                      {formatZoom(view.zoom)}×{" "}
                      <button
                        className="icon-button"
                        aria-label="Increase zoom"
                        onClick={() => runtime.stepZoom(1)}
                      >
                        <Plus size={17} />
                      </button>
                    </div>
                  </div>
                  <h3>Narrator</h3>
                  <div className="settings-row">
                    <span>Model</span>
                    <select
                      value={provider}
                      onChange={(e) => {
                        const next = e.target.value as typeof provider;
                        setProvider(next);
                        try {
                          localStorage.setItem(PROVIDER_KEY, next);
                        } catch {
                          /* private mode */
                        }
                      }}
                    >
                      <option value="openai">OpenAI (GPT-5.6 luna)</option>
                      <option value="gemini">Gemini 3.5 Flash-Lite</option>
                    </select>
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
                      onClick={() => setModal("narration")}
                    >
                      <ScrollText size={16} /> Narration log
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
      {modal === "dialogue" && dialogueActorId && (
        <div className="modal-backdrop dialogue-backdrop">
          <DialogueModal
            runtime={runtime}
            actorId={dialogueActorId}
            onClose={() => {
              setModal(null);
              setDialogueActorId(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
