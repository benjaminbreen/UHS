import { setSculptedRefined, trace } from "./sculpted";

self.onmessage = ({ data: { key, appearance, age, pose, refined } }) => {
  setSculptedRefined(refined);
  const { color, mat, layer, depth } = trace(appearance, age, pose);
  (self as unknown as Worker).postMessage({ key, color, mat, layer, depth }, [mat.buffer, layer.buffer, depth.buffer]);
};
