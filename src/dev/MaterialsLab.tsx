import { useEffect, useRef, useState } from "react";
import { MaterialsLab as Lab, TOOLS, treeNames, WORLD_H, WORLD_W, type Tool } from "./materials/lab";
import "./materials-lab.css";

const TOOL_LABEL: Record<Tool, string> = {
  axe: "Axe",
  pick: "Pick",
  spade: "Spade",
  torch: "Torch",
  bucket: "Bucket",
};

export function MaterialsLab() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const lab = useRef<Lab | null>(null);
  const [tool, setTool] = useState<Tool>("axe");
  const [age, setAgeState] = useState({ years: 0, abandoned: false, upkeep: 0.5 });
  const [band, setBand] = useState("as good as new");
  const setAge = (patch: Partial<typeof age>) => {
    const next = { ...age, ...patch };
    if (patch.abandoned !== undefined && patch.abandoned !== age.abandoned) next.years = 0;
    setAgeState(next);
    if (lab.current) setBand(lab.current.setAge(next));
  };
  const [wind, setWind] = useState(0.2);
  const [tree, setTree] = useState("nature-oak");
  const [buildings, setBuildings] = useState<string[]>([]);
  const [building, setBuilding] = useState("house-cottage-timber-1-urban-cottage");

  useEffect(() => {
    const l = new Lab(canvas.current!);
    lab.current = l;
    l.init();
    void l.buildingNames().then(setBuildings);
    const key = (down: boolean) => (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("select, input")) return;
      if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
      l.key(e.code, down);
      setTool(l.tool);
    };
    const down = key(true),
      up = key(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      l.stop();
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const pointer = (down: boolean | null) => (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    lab.current?.pointer(
      ((e.clientX - r.left) / r.width) * WORLD_W,
      ((e.clientY - r.top) / r.height) * WORLD_H,
      down,
    );
  };

  return (
    <main className="materials-lab">
      <header>
        <h1>Materials lab</h1>
        <p>
          WASD or arrows to walk · Space or click to use · 1–5 to change tool. Chop a trunk past half its width and
          it falls; fire smoulders, then spreads pixel by pixel to char and ash. Dig a ditch from the pond and
          water runs in; strike ore with the pick for sparks that can light what they land on.
        </p>
      </header>
      <div className="materials-layout">
        <canvas
          ref={canvas}
          onPointerDown={pointer(true)}
          onPointerMove={pointer(null)}
          onPointerUp={pointer(false)}
          onPointerLeave={pointer(false)}
        />
        <aside>
          <section>
            <h2>Tool</h2>
            <div className="materials-tools">
              {TOOLS.map((t, i) => (
                <button
                  key={t}
                  aria-pressed={tool === t}
                  onClick={() => {
                    lab.current!.tool = t;
                    setTool(t);
                  }}
                >
                  <kbd>{i + 1}</kbd> {TOOL_LABEL[t]}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2>Trees and rock</h2>
            <select value={tree} onChange={(e) => setTree(e.target.value)}>
              {treeNames.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <button onClick={() => void lab.current?.plantTree(tree)}>Plant</button>
            <button onClick={() => lab.current?.placeOre()}>Iron ore boulder</button>
          </section>
          <section>
            <h2>Buildings</h2>
            <select value={building} onChange={(e) => setBuilding(e.target.value)}>
              {buildings.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <button onClick={() => void lab.current?.placeBuilding(building)}>Build</button>
            <div className="materials-tools">
              {[false, true].map((abandoned) => (
                <button
                  key={String(abandoned)}
                  aria-pressed={age.abandoned === abandoned}
                  onClick={() => setAge({ abandoned })}
                >
                  {abandoned ? "Abandoned" : "Lived in"}
                </button>
              ))}
            </div>
            <label>
              {age.abandoned ? "Years since abandoned" : "Years since built"} <output>{age.years}</output>
              <input
                type="range"
                min={0}
                max={age.abandoned ? 500 : 200}
                step={1}
                value={age.years}
                onChange={(e) => setAge({ years: +e.target.value })}
              />
            </label>
            {!age.abandoned && (
              <label>
                Upkeep <output>{Math.round(age.upkeep * 100)}%</output>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={age.upkeep}
                  onChange={(e) => setAge({ upkeep: +e.target.value })}
                />
              </label>
            )}
            <small>
              Condition: <strong>{band}</strong>. State comes from the game's structure model; changing it rebuilds
              the building, undoing any chopping or burning.
            </small>
          </section>
          <section>
            <h2>Weather</h2>
            <label>
              Wind <output>{wind.toFixed(1)}</output>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.1}
                value={wind}
                onChange={(e) => {
                  setWind(+e.target.value);
                  lab.current!.scene.wind = +e.target.value;
                }}
              />
            </label>
          </section>
          <button onClick={() => lab.current?.clear()}>Clear scene</button>
        </aside>
      </div>
    </main>
  );
}
