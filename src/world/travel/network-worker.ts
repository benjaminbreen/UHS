import { permanentMap, permanentExits, connectionPath, loadTileNames } from "./network";
self.onmessage = async ({ data }) => {
  try {
    await loadTileNames([data.id]);
    const path = data.exit ? connectionPath(data.exit) : undefined;
    self.postMessage({
      request: data.request,
      map: permanentMap(data.id, data.year),
      exits: permanentExits(data.id, data.year),
      path,
    });
  } catch (e) {
    self.postMessage({ request: data.request, error: String(e) });
  }
};
