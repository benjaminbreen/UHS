import type { Root } from "react-dom/client";
import type { Engine } from "../core/engine";
import { App } from "../ui/App";
import { Runtime } from "./session";

import { registerWebMCP } from "../agents/webmcp";
import { PropLabHost } from "../dev/PropLabHost";
export function startGame(root: Root, engine: Engine) {
  const runtime = new Runtime(engine);
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
  root.render(
    <PropLabHost onOpen={() => runtime.stop()}>
      <App runtime={runtime} writer={false} />
    </PropLabHost>,
  );
}
