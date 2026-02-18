# UI Refactor Plan (Global Atmosphere + Horizon)

## Goals
- Make the time-aware sky a **global atmosphere layer** behind all UI panels, not just a frame around the map.
- Keep the narrative panel readable while allowing the background to show through.
- Move the horizon line to a **global bottom-of-canvas layer**, matching the Apothecary feel.
- Stub special/roguelike/minigame backgrounds so they can be swapped later without redoing the architecture.

## Architecture Overview
- **Global atmosphere** should live at the app shell level (not inside MapViewport).
- **Global horizon** should render across the full canvas bottom.
- **MapViewport** should render only map content + framing/vignette, not sky/weather/horizon.
- **Shared atmosphere state** (time/season/weather/etc.) should be computed once and reused.

## Phase 1 — Shared Atmosphere State (hook)
Create `hooks/useAtmosphereState.ts`:
- Inputs: `useGame()` for time/date/season, `useMap()` for map data + special maps, `usePlayer()` for viewMode.
- Compute weather with the same logic currently in `MapViewport`:
  - Use map center tile, `weatherService.getWeather(...)`, and update on hour/season changes.
- Output:
  - `gameTimeHours`, `gameTimeMinutes`, `season`, `currentTimeOfDay`
  - `climate`, `mapData`, `isSpecialMap`, `viewMode`
  - `currentWeather`
  - `atmosphereMode: 'outdoor' | 'interior' | 'special' | 'roguelike'` (stub roguelike)

## Phase 2 — AppAtmosphere (global background)
Create `components/AppAtmosphere.tsx`:
- Renders a full-bleed absolute layer (`inset-0`, `z-index: 0`).
- Switch on `atmosphereMode`:
  - `outdoor`: `TimeAwareBackground`, `CloudSystem`, `CelestialBodies`, `WeatherEffects`
  - `special`: `SpecialMapBackground` (use current special config)
  - `interior`: `TimeAwareBackground` with `viewMode="interior"` (neutral/dim)
  - `roguelike`: placeholder gradient + TODO comment
- **Note:** This should replace the TimeAwareBackground stack inside `MapViewport`.

## Phase 3 — Global Horizon Layer
Create `components/GlobalHorizonLayer.tsx`:
- Full-width bottom layer (`position: absolute; bottom: 0; width: 100%; pointer-events: none`).
- For `outdoor`: render `HorizonLayer` using map biome + weather data (same props currently in `MapViewport`).
- For `special`: render `InteriorHorizon` (using special config).
- For `interior/roguelike`: return null for now (stubs).

## Phase 4 — Make App Shell Transparent
Update `index.css`:
- `[data-surface="app-shell"]` => `background: transparent;`
- Adjust dark theme surfaces to be more translucent:
  - `--surface-sidebar-bg`, `--surface-top-nav-bg`, `--surface-card-bg`
- Keep narrative panel more opaque for readability.

## Phase 5 — MapViewport Cleanup
- Remove `TimeAwareBackground`, `CloudSystem`, `CelestialBodies`, `WeatherEffects` from `MapViewport`.
- Remove the local horizon block at the bottom of the map viewport.
- Keep map frame/vignette (these still help the map feel intentional).

## Readability Guidance
- Sidebars should be **more translucent** (glanceable info).
- Narrative panel should be **more opaque** (continuous reading).

## Execution Notes (for implementation)
- Add `AppAtmosphere` + `GlobalHorizonLayer` as the first children in `App.tsx` under `data-surface="app-shell"`.
- Make sure the app shell is `position: relative` so absolute layers anchor correctly.
- Keep z-indexes consistent: atmosphere at `0`, UI at `10+`.
- Stub roguelike/minigame visuals with TODO placeholders so the architecture is ready.
