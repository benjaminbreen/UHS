import { inventedNameNote } from "../content/characters/invented-name";
import { resolveCharacterContext } from "../content/characters/resolve";
import { Flag } from "lucide-react";
import { formatHistoricalYear } from "../core/calendar";
import { regionAt } from "../content/geography/region-label";
import type { WorldSetting } from "../content/geography/types";

export function StartPreview({ setting }: { setting: WorldSetting }) {
  const context = setting.characterRevision
    ? resolveCharacterContext(setting)
    : undefined;
  const region = regionAt(setting.lon, setting.lat);
  return (
    <div
      className="start-preview"
      aria-label="Selected start"
      aria-live="polite"
    >
      <Flag size={18} aria-hidden="true" />
      <div>
        <strong>{setting.characterName}</strong>
        <span className="start-preview-role"> · {setting.role}</span>
        <p>
          {region && (
            <span className="region-tag" data-culture={region.culture}>
              {region.label}
            </span>
          )}
          {setting.location} · {formatHistoricalYear(setting.year)}
        </p>
        {context && (
          <small
            className="character-context-note"
            title={
              context.names || context.traditions ? undefined : inventedNameNote
            }
          >
            {context.names || context.traditions
              ? "Generated character"
              : "Invented name"}
          </small>
        )}
      </div>
    </div>
  );
}
