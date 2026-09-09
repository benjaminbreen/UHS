import { inventedNameNote } from "../content/characters/invented-name";
import { resolveCharacterContext } from "../content/characters/resolve";
import { Flag } from "lucide-react";
import { formatHistoricalYear } from "../core/calendar";
import type { WorldSetting } from "../content/geography/types";

export function StartPreview({ setting }: { setting: WorldSetting }) {
  const context = setting.characterRevision
    ? resolveCharacterContext(setting)
    : undefined;
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
          {setting.location} · {formatHistoricalYear(setting.year)}
        </p>
        {context && (
          <small
            className="character-context-note"
            title={!context.names ? inventedNameNote : undefined}
          >
            {context.names ? "Generated character" : "Invented name"}
          </small>
        )}
      </div>
    </div>
  );
}
