import { createRoot } from "react-dom/client";
import { App } from "./ui/App";
import { createSession, restoreSession, Runtime } from "./runtime/session";
import { claimWriter, load, save, preserveRecovery } from "./runtime/storage";
import "./ui/style.css";
import { registerWebMCP } from "./agents/webmcp";
async function start() {
  if (window.location.pathname === "/history-lab") {
    const { HistoryLab } = await import("./dev/HistoryLab");
    createRoot(document.getElementById("root")!).render(<HistoryLab />);
    return;
  }
  if (window.location.pathname === "/graphics-lab") {
    const { GraphicsLab } = await import("./dev/GraphicsLab");
    createRoot(document.getElementById("root")!).render(<GraphicsLab />);
    return;
  }
  let engine = createSession();
  let notice = "";
  try {
    const stored = await load();
    if (stored) {
      try {
        engine = restoreSession(stored);
      } catch (error) {
        await preserveRecovery(stored);
        throw error;
      }
    }
  } catch {
    notice =
      "The saved world could not be loaded. Your stored copy has been preserved; a fresh world is open.";
  }
  const writer = await claimWriter();
  const runtime = new Runtime(engine);
  runtime.notice = notice;
  runtime.emit();
  if (writer)
    runtime.onChange = (snapshot) => {
      void save(snapshot).catch(() => {
        runtime.notice =
          "Local saving failed. Export your world from Settings to keep it.";
        runtime.emit();
      });
    };
  // The public player surface projects visibility and validates all commands.
  Object.assign(window, {
    historySim: {
      observe: () => runtime.engine.observe(),
      inspect: (id: string) => runtime.engine.inspect(id),
      act: (request: Parameters<Runtime["act"]>[0]) => runtime.act(request),
    },
  });
  registerWebMCP(runtime);
  if (import.meta.env.DEV) Object.assign(window, { __uhs: runtime });
  createRoot(document.getElementById("root")!).render(
    <App runtime={runtime} writer={writer} />,
  );
}
void start();
