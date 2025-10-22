# Light Mode Revamp Plan

## Objectives
- Deliver a light theme that feels deliberate (warm, readable, consistent) without regressing the dark default.
- Improve theme toggle performance by reducing selector cost and redundant repaint work.
- Establish maintainable patterns so future UI work inherits correct theming automatically.

## Phase 1 – Structural Hooks (Current Focus)
**Goal:** Give the stylesheet reliable anchors so light‑mode rules target the right surfaces without expensive wildcard selectors.
- Add `data-surface` (or equivalent class hooks) to the root app shell, nav bar, left/right sidebars, map wrapper, modal chrome, and key panels.
- Audit `index.css` selectors; replace `[class*="sidebar"]`, `[class*="bg-slate"]`, and similar wildcard queries with direct references to the new anchors.
- Ensure the theme service still defaults to dark mode and that the new attributes are present immediately on load.
- Target Deliverable: reduced CSS complexity and faster theme toggle (no visible repaint lag).

## Phase 2 – Surface Tokens & Utilities
**Goal:** Swap hard-coded Tailwind color utilities on major surfaces for semantic theme tokens.
- Define a small `themeSurfaces` map (CSS variables or TS constants) for shell/background/foreground/accent colors.
- Update `TopNavBarPolished`, `LeftSidebar`, `RightSidebar`, and modal headers to use the tokens (via CSS modules or utility classes).
- Provide fallbacks so dark mode continues to match existing visuals.
- Target Deliverable: consistent palette foundation shared across components.

## Phase 3 – Component Palette Alignment
**Goal:** Apply the token system to high-traffic UI elements.
- Button sets, tabs, cards, and notification toasts migrate from literal colors to the shared tokens.
- Tone the light palette to avoid desaturation—introduce accent tint variables (sage, amber, indigo variants).
- Add subtle shadows/borders tuned for light backgrounds.
- Target Deliverable: polished light-mode appearance with coherent accents.

## Phase 4 – SVG & Inline Asset Harmonization
**Goal:** Remove baked-in dark values from inline styles/SVGs.
- Convert inline fills/strokes in React components and `public` SVG assets to use CSS variables or `currentColor`.
- Expose any necessary theme variables for gradients.
- Target Deliverable: assets adapt seamlessly to both themes.

## Phase 5 – Bootstrap Cleanup & Regression Safety
**Goal:** Lock in UX quality and future-proof changes.
- Update `index.html` preflight styles to respect stored theme or `prefers-color-scheme`, removing conflicting `!important` values post-mount.
- Add a theme-toggle smoke test (Vitest w/ jsdom or lightweight Playwright) that asserts token presence and key surface colors.
- Produce before/after screenshot notes for manual regression reference.
- Target Deliverable: fast, reliable theme toggle with guardrails against regressions.

## Milestone Sign-offs
- **Phase 1:** Hook selectors wired; toggle latency eliminated.
- **Phase 3:** Light theme aesthetic approved by design/product.
- **Phase 5:** Automated safeguards merged; documentation updated.
