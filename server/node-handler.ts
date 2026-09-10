import type { IncomingMessage, ServerResponse } from "node:http";
import { worldWeaver } from "./world-weaver";
import { narrator } from "./narrator";
type Route = (request: Request) => Promise<Response>;
export const handleWorldWeaver = handler(
  "/api/world-weaver",
  worldWeaver,
  12000,
);
export const handleNarrator = handler("/api/narrator", narrator, 24000);
function handler(path: string, route: Route, limit: number) {
  return async (
    req: IncomingMessage & { body?: unknown },
    res: ServerResponse,
  ) => {
    try {
      let body = "";
      if (req.method !== "GET" && req.method !== "HEAD") {
        if (req.body !== undefined)
          body =
            typeof req.body === "string" ? req.body : JSON.stringify(req.body);
        else
          for await (const chunk of req) {
            body += chunk.toString();
            if (body.length > limit) {
              res.writeHead(413, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Request is too long." }));
              return;
            }
          }
      }
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers))
        if (value)
          headers.set(key, Array.isArray(value) ? value.join(",") : value);
      const abort = new AbortController();
      res.on("close", () => {
        if (!res.writableEnded) abort.abort();
      });
      const request = new Request(`http://localhost${path}`, {
        method: req.method,
        headers,
        ...(body ? { body } : {}),
        signal: abort.signal,
      });
      const result = await route(request);
      res.writeHead(result.status, Object.fromEntries(result.headers));
      res.end(await result.text());
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Could not read the request." }));
    }
  };
}
