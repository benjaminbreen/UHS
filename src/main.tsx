import { createRoot } from "react-dom/client";
import "./ui/style.css";
import { PropLabHost } from "./dev/PropLabHost";
async function start() {
  if (window.location.pathname === "/nature-lab") {
    const { NatureLab } = await import("./dev/NatureLab");
    createRoot(document.getElementById("root")!).render(<NatureLab />);
    return;
  }
  if (window.location.pathname === "/character-lab") {
    const { CharacterLab } = await import("./dev/CharacterLab");
    createRoot(document.getElementById("root")!).render(<CharacterLab />);
    return;
  }
  if (window.location.pathname === "/terrain-lab") {
    const { TerrainLab } = await import("./dev/TerrainLab");
    createRoot(document.getElementById("root")!).render(<TerrainLab />);
    return;
  }
  if (window.location.pathname === "/grass-lab") {
    const { GrassLab } = await import("./dev/GrassLab");
    createRoot(document.getElementById("root")!).render(<GrassLab />);
    return;
  }
  if (window.location.pathname === "/building-lab") {
    const { BuildingLab } = await import("./dev/BuildingLab");
    createRoot(document.getElementById("root")!).render(<BuildingLab />);
    return;
  }
  if (window.location.pathname === "/prop-lab") {
    createRoot(document.getElementById("root")!).render(
      <PropLabHost standalone />,
    );
    return;
  }
  if (window.location.pathname === "/history-lab") {
    const { HistoryLab } = await import("./dev/HistoryLab");
    createRoot(document.getElementById("root")!).render(
      <PropLabHost>
        <HistoryLab />
      </PropLabHost>,
    );
    return;
  }
  if (window.location.pathname === "/graphics-lab") {
    const { GraphicsLab } = await import("./dev/GraphicsLab");
    createRoot(document.getElementById("root")!).render(
      <PropLabHost>
        <GraphicsLab />
      </PropLabHost>,
    );
    return;
  }
  const { Splash } = await import("./ui/Splash");
  const root = createRoot(document.getElementById("root")!);
  root.render(
    <Splash
      onStart={async (engine) => {
        const { startGame } = await import("./runtime/bootstrap");
        startGame(root, engine);
      }}
    />,
  );
}
void start();
