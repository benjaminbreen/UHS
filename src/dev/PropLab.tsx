import { useEffect, useRef, useState } from "react";
import catalog from "../content/graphics/props.json" with { type: "json" };
import atlas from "../render/generated/props.json" with { type: "json" };
import shadows from "../render/generated/prop-shadows.json" with { type: "json" };
import worldAtlas from "../render/generated/atlas.json" with { type: "json" };
import { lightingPresets } from "../render/lighting";
import "./prop-lab.css";

type Family = (typeof catalog.families)[number];
type Frame = {
  frame: { x: number; y: number; w: number; h: number };
  pivot?: { x: number; y: number };
};
const frames = atlas.frames as Record<string, Frame>;
const masks = shadows.frames as Record<string, Frame>;
/** Families with a B study: redrawn on a canvas sized to the object itself. */
const altFamilies = new Set(
  Object.keys(atlas.frames)
    .filter((k) => k.startsWith("study-propb-"))
    .map((k) => k.slice(12, k.lastIndexOf("-"))),
);
/** Families drawn only in the B set: there is no A study to compare against. */
const bOnly = new Set(
  [...altFamilies].filter(
    (id) =>
      !Object.keys(atlas.frames).some((k) => k.startsWith(`study-prop-${id}-`)),
  ),
);
/** The stage grows with the biggest study: a fixed 96x72 box clipped the
 * loom and the town well, which are deliberately larger than a 48px canvas. */
const stage = (() => {
  let w = 96,
    h = 72;
  for (const f of Object.values(frames)) {
    w = Math.max(w, f.frame.w + 44);
    h = Math.max(h, f.frame.h + 20);
  }
  return { w, h, feet: h - 13 };
})();
const backgrounds: Record<string, string> = {
  Sand: "#d6c8a2",
  Grass: "#85965a",
  Slate: "#343e43",
  Checker: "#c4c6bf",
};
let images: Promise<HTMLImageElement[]> | undefined;
function textures() {
  return (images ??= Promise.all(
    ["/props/atlas.png", "/props/shadows.png", "/packs/atlas.png"].map(
      (src) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(Error(`Cannot load ${src}`));
          img.src = src;
        }),
    ),
  ));
}
function PropCanvas({
  family,
  variant,
  scale = 2,
  background = "Sand",
  light = "morning",
  reference = false,
  set = "a",
}: {
  family: Family;
  variant: number;
  scale?: number;
  background?: string;
  light?: string;
  reference?: boolean;
  set?: "a" | "b";
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setError(false);
    const canvas = ref.current!;
    canvas.dataset.ready = "false";
    textures()
      .then(([sprites, shadow, people]) => {
        if (cancelled) return;
        const ctx = canvas.getContext("2d")!;
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = backgrounds[background];
        ctx.fillRect(0, 0, stage.w, stage.h);
        if (background === "Checker") {
          ctx.fillStyle = "#aeb3aa";
          for (let y = 0; y < stage.h; y += 8)
            for (let x = 0; x < stage.w; x += 8)
              if ((x + y) % 16 === 0) ctx.fillRect(x, y, 8, 8);
        }
        const key = `study-prop${set === "b" ? "b" : ""}-${family.id}-${variant}`;
        const draw = (
          image: HTMLImageElement,
          frame: Frame,
          x: number,
          y: number,
        ) => {
          const f = frame.frame;
          ctx.drawImage(
            image,
            f.x,
            f.y,
            f.w,
            f.h,
            Math.round(x - (frame.pivot?.x ?? 0.5) * f.w),
            Math.round(y - (frame.pivot?.y ?? 1) * f.h),
            f.w,
            f.h,
          );
        };
        const mid = Math.round(stage.w / 2) - 8;
        if (light !== "none")
          draw(shadow, masks[`${light}:${key}`], mid, stage.feet);
        draw(sprites, frames[key], mid, stage.feet);
        if (reference) {
          const person = (worldAtlas.frames as Record<string, Frame>)[
            "human-0-1-2-0"
          ];
          draw(people, person, stage.w - 17, stage.feet - 3);
        }
        canvas.dataset.ready = "true";
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [family.id, variant, scale, background, light, reference, set]);
  return (
    <>
      {error && <span role="alert">Preview image could not load.</span>}
      <canvas
        ref={ref}
        width={stage.w * scale}
        height={stage.h * scale}
        role="img"
        aria-label={`${family.name} — ${family.variants[variant]}${set === "b" ? " (B study)" : ""}`}
      />
    </>
  );
}

export default function PropLab({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState(catalog.families[0]);
  const [variant, setVariant] = useState(0);
  const [group, setGroup] = useState("All");
  const [query, setQuery] = useState("");
  const [background, setBackground] = useState("Sand");
  const [light, setLight] = useState("morning");
  const [zoom, setZoom] = useState(() => (innerWidth < 700 ? 3 : 4));
  const [reference, setReference] = useState(true);
  const [compare, setCompare] = useState(false);
  const [message, setMessage] = useState("");
  const panel = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const visible = catalog.families.filter(
    (f) =>
      (group === "All" || f.group === group) &&
      `${f.name} ${f.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const targets = Array.from(
        panel.current!.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input, select, a[href]",
        ),
      ).filter((e) => e.getClientRects().length);
      const first = targets[0],
        last = targets.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    const host = panel.current!;
    host.addEventListener("keydown", trap);
    return () => {
      host.removeEventListener("keydown", trap);
      document.body.style.overflow = before;
      previous?.focus();
    };
  }, []);
  const pick = (family: Family) => {
    setSelected(family);
    setVariant(0);
    setMessage("");
    if (innerWidth < 700)
      requestAnimationFrame(() =>
        panel.current
          ?.querySelector(".prop-detail")
          ?.scrollIntoView({ behavior: "smooth" }),
      );
  };
  const savePNG = () => {
    const canvas = panel.current?.querySelector<HTMLCanvasElement>(
      ".prop-detail-stage canvas",
    );
    if (!canvas || canvas.dataset.ready !== "true") return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL();
    a.download = `uhs-${selected.id}-${variant}-${zoom}x.png`;
    a.click();
    setMessage("Preview PNG saved.");
  };
  return (
    <div
      className="prop-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={panel}
        className="prop-lab"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prop-lab-title"
        data-modal="true"
      >
        <header className="prop-header">
          <div>
            <span className="prop-eyebrow">ART REVIEW · ⌘2 / CTRL+2</span>
            <h1 id="prop-lab-title">Everyday objects</h1>
            <p>
              40 shared families · 117 original pixel-art studies · choose an
              object to inspect
            </p>
          </div>
          <button
            ref={close}
            className="prop-close"
            onClick={onClose}
            aria-label="Close prop gallery"
          >
            ×
          </button>
        </header>
        <div className="prop-toolbar">
          <label>
            Find a prop
            <input
              type="search"
              placeholder="Jar, well, tools…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            Background
            <select
              value={background}
              onChange={(e) => setBackground(e.target.value)}
            >
              {Object.keys(backgrounds).map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
          <label>
            Shadow study
            <select value={light} onChange={(e) => setLight(e.target.value)}>
              <option value="none">No shadow</option>
              {lightingPresets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <a href="/props/atlas.png" download="uhs-prop-studies.png">
            Download atlas ↗
          </a>
        </div>
        <div className="prop-body">
          <section className="prop-browser" aria-label="Prop families">
            <div className="prop-groups">
              {["All", ...new Set(catalog.families.map((f) => f.group))].map(
                (g) => (
                  <button
                    key={g}
                    onClick={() => setGroup(g)}
                    aria-pressed={group === g}
                  >
                    {g}
                    {g === "All" ? " · 40" : ""}
                  </button>
                ),
              )}
            </div>
            <p className="prop-count">
              {visible.length} families · shared world grid · thumbnails at 2×
            </p>
            <div className="prop-grid">
              {visible.map((f) => (
                <button
                  className={`prop-card ${selected.id === f.id ? "selected" : ""}`}
                  key={f.id}
                  onClick={() => pick(f)}
                  aria-pressed={selected.id === f.id}
                  data-testid={`prop-${f.id}`}
                >
                  <PropCanvas
                    family={f}
                    variant={0}
                    background={background}
                    light={light}
                    set={bOnly.has(f.id) ? "b" : "a"}
                  />
                  <span>
                    <small>
                      {String(catalog.families.indexOf(f) + 1).padStart(2, "0")}
                    </small>
                    {f.name}
                  </span>
                  <em>
                    {f.variants.length}{" "}
                    {f.variants.length === 1 ? "study" : "variants"}
                    {altFamilies.has(f.id) ? " · A/B" : ""}
                  </em>
                </button>
              ))}
            </div>
            {!visible.length && (
              <p>No matching props. Try another name or category.</p>
            )}
          </section>
          <aside className="prop-detail" aria-label="Selected prop">
            <span className="prop-eyebrow">{selected.group}</span>
            <h2>{selected.name}</h2>
            <p>{selected.description}</p>
            <div className="prop-detail-stage">
              {compare && altFamilies.has(selected.id) && !bOnly.has(selected.id) ? (
                <div className="prop-ab">
                  {(["a", "b"] as const).map((set) => (
                    <figure key={set}>
                      <PropCanvas
                        family={selected}
                        variant={variant}
                        scale={zoom}
                        background={background}
                        light={light}
                        reference={reference}
                        set={set}
                      />
                      <figcaption>
                        {set === "a" ? "A · current" : "B · sized study"}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ) : (
                <PropCanvas
                  family={selected}
                  variant={variant}
                  scale={zoom}
                  background={background}
                  light={light}
                  reference={reference}
                  set={bOnly.has(selected.id) ? "b" : "a"}
                />
              )}
            </div>
            {compare && !altFamilies.has(selected.id) && (
              <p className="prop-note">No B study for this family yet.</p>
            )}
            {bOnly.has(selected.id) && (
              <p className="prop-note">New family: B study only.</p>
            )}
            <label>
              Inspect at
              <select
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              >
                {[2, 3, 4, 6].map((n) => (
                  <option value={n} key={n}>
                    {n}× source pixels
                  </option>
                ))}
              </select>
            </label>
            <label className="prop-check">
              <input
                type="checkbox"
                checked={compare}
                onChange={(e) => setCompare(e.target.checked)}
              />
              A/B compare ({altFamilies.size} redrawn)
            </label>
            <label className="prop-check">
              <input
                type="checkbox"
                checked={reference}
                onChange={(e) => setReference(e.target.checked)}
              />
              Show existing character for scale
            </label>
            <h3>Material / color studies</h3>
            <div className="prop-variants">
              {selected.variants.map((name, i) => (
                <button
                  key={name}
                  aria-pressed={variant === i}
                  onClick={() => {
                    setVariant(i);
                    setMessage("");
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
            <button className="prop-export" onClick={savePNG}>
              Save selected PNG
            </button>
            <p role="status">{message}</p>
            <p className="prop-note">
              These are shared art studies, not historical availability rules or
              new gameplay objects. Shadow direction uses the existing lighting
              system; painted surface highlights remain upper-left.
            </p>
            <p className="prop-note">
              Open and broken states come after this art review. Changes have
              not been committed.
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}
