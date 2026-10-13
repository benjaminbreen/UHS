import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Engine } from "../core/engine";
import { App } from "../ui/App";
import { Runtime } from "./session";

import { registerWebMCP } from "../agents/webmcp";
import { PropLabHost } from "../dev/PropLabHost";
import type { EduRecorder } from "../edu/recorder";
export function Game({ engine, active, onReady, edu }: {
  engine: Engine;
  active: boolean;
  onReady: () => void;
  edu?: EduRecorder;
}) {
  const [runtime] = useState(() => {
    const runtime = new Runtime(engine);
    runtime.timeTravelLocked = true;
    return runtime;
  });
  useEffect(() => { edu?.attach(runtime); }, [runtime, edu]);
  // Fast Refresh runs this cleanup and then the effect again on the same
  // runtime; disposing at once would drop map travel and leave every border a wall.
  const disposal = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    clearTimeout(disposal.current);
    return () => {
      disposal.current = setTimeout(() => runtime.dispose());
    };
  }, [runtime]);
  useLayoutEffect(() => {
    runtime.timeTravelLocked = !active;
    if (!active) return;
    runtime.resumeAmbient();
    // The public player surface projects visibility and validates all commands.
    Object.assign(window, {
      historySim: {
        observe: () => runtime.engine.observe(),
        inspect: (id: string) => runtime.engine.inspect(id),
        act: (request: Parameters<Runtime["act"]>[0]) => runtime.act(request),
      },
    });
    registerWebMCP(runtime);
    if (import.meta.env.DEV)
      Object.assign(window, {
        __uhs: runtime,
        say: (text: string) => runtime.say(text).then(console.log),
        chronicle: () => runtime.downloadChronicle(),
      });
    document.querySelector<HTMLElement>(".game-container")?.focus();
    return () => {
      delete (window as unknown as Record<string, unknown>).historySim;
      if (import.meta.env.DEV) {
        delete (window as unknown as Record<string, unknown>).__uhs;
        delete (window as unknown as Record<string, unknown>).say;
        delete (window as unknown as Record<string, unknown>).chronicle;
      }
    };
  }, [runtime, active]);
  return (
    <PropLabHost enabled={active} onOpen={() => runtime.stop()}>
      <App runtime={runtime} writer={false} active={active} onReady={onReady} />
    </PropLabHost>
  );
}
