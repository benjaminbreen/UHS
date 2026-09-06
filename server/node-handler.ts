import type { IncomingMessage, ServerResponse } from "node:http";
import { worldWeaver } from "./world-weaver";
export async function handleWorldWeaver(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
) {
  try {
    let body = "";
    if (req.method !== "GET" && req.method !== "HEAD") {
      if (req.body !== undefined)
        body =
          typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      else
        for await (const chunk of req) {
          body += chunk.toString();
          if (body.length > 12000) {
            res.writeHead(413, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Description is too long." }));
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
    const request = new Request("http://localhost/api/world-weaver", {
      method: req.method,
      headers,
      ...(body ? { body } : {}),
      signal: abort.signal,
    });
    const result = await worldWeaver(request);
    res.writeHead(result.status, Object.fromEntries(result.headers));
    res.end(await result.text());
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Could not read the request." }));
  }
}
