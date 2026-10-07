import data from "./mediterranean-buildings.json" with { type: "json" };
import type { WorldSetting } from "../geography/types";

export function mediterraneanStyle(setting?: WorldSetting): string | undefined {
  if (!setting) return undefined;
  return data.rules.find((r) => {
    const [w, s, e, n] = r.bounds;
    return setting.culture === r.culture && setting.year >= r.fromYear &&
      setting.year < r.toYear && setting.lon >= w && setting.lon <= e &&
      setting.lat >= s && setting.lat <= n;
  })?.style;
}

export function watchtowerFrame(setting: WorldSetting | undefined, storeys = 3): string | undefined {
  const style = mediterraneanStyle(setting) ?? retainedTowerStyle(setting);
  return style ? `house-watchtower-${style}-${storeys}` : undefined;
}

export function retainedTowerStyle(setting?: WorldSetting): string | undefined {
  if (!setting) return undefined;
  return data.retainedTowers.find((r) => {
    const [w, s, e, n] = r.bounds;
    return setting.culture === r.culture && setting.year >= r.fromYear &&
      setting.year < r.toYear && setting.lon >= w && setting.lon <= e &&
      setting.lat >= s && setting.lat <= n;
  })?.style;
}

export function mediterraneanShrineFrame(setting: WorldSetting | undefined, scale: string): string | undefined {
  const style = mediterraneanStyle(setting);
  if (!style || !("shrine" in data.styles[style as keyof typeof data.styles])) return undefined;
  return `religious-mediterranean-shrine-${scale}-${style}`;
}

export function mediterraneanInsulaFrames(setting: WorldSetting): string[] {
  const style = mediterraneanStyle(setting);
  return style && ["roman", "greek", "egypt", "levant"].includes(style)
    ? [`house-classical-insula-${style}-0`] : [];
}

export function mediterraneanProp(setting: WorldSetting | undefined, name: string): string | undefined {
  const style = mediterraneanStyle(setting);
  return style && ["roman", "greek", "egypt", "levant"].includes(style)
    ? `study-classical-${name}` : undefined;
}
