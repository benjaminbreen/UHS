import { inventedNameNote } from "../content/characters/invented-name";
import { resolveCharacterContext } from "../content/characters/resolve";
import { fairById } from "../content/fairs";
import { theatres } from "../content/interiors/theatres";
import { Flag } from "lucide-react";
import { formatHistoricalYear } from "../core/calendar";
import { describedRegionAt, regionAt } from "../content/geography/region-label";
import type { WorldSetting } from "../content/geography/types";

export function StartPreview({ setting }: { setting: WorldSetting }) {
  const context = setting.characterRevision
    ? resolveCharacterContext(setting)
    : undefined;
  // The culture comes from the name-tradition region, which always matches;
  // the visible tag comes from the described one, which never shows a backstop.
  const culture = regionAt(setting.lon, setting.lat)?.culture;
  const region = describedRegionAt(setting.lon, setting.lat);
  const venue = setting.venue && fairById(setting.venue);
  const room = venue && venue.areas.find((a) => a.id === (setting.venueRoom ?? venue.entry));
  const theatreLabel = !venue && setting.startIn === "theatre" && setting.venue
    ? theatres.find((t) => t.id === setting.venue)?.label
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
          {region && (
            <span className="region-tag" data-culture={culture}>
              {region.label}
            </span>
          )}
          {setting.location} · {formatHistoricalYear(setting.year)}{room ? ` · ${room.name}` : theatreLabel ? ` · ${theatreLabel}` : ""}
        </p>
        {setting.brief?.figure ? <small>Historical figure</small> : context && (
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
