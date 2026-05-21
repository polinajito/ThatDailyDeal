# UI Library — Handoff

Canonical reference for the ThatDailyDeal design system: design tokens (colors, typography, spacing, radius, shadows, liquid glass) plus every shared component currently in the library (price pill, button, menu item, menu, deals banner, swipe stamps, toast, rich toast).

This handoff is **library-wide**. Per-feature flows (when they exist) live in `../flows/` as single `.md` files — see _"Adding new components and flows"_ below.

## What's in this folder

| File / link                          | Purpose                                                                            |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| `spec.md`                            | Canonical spec. Tokens + every component, with property tables, states, composition rules, and source pointers. |
| `../../dist-v6/library.html`         | **Live preview.** Visual showcase of every foundation and component. Open in any browser. |
| `../../dist-v6/tokens.css`           | Source of truth for tokens. Every value in §1 of `spec.md` mirrors this file.      |
| `../../dist-v6/components.css`       | Source of truth for components. Every `Source:` line in `spec.md` points back here. |

## How to use it

1. Open `../../dist-v6/library.html` to see what each foundation and component looks like.
2. Skim `spec.md` for tokens, property values, states, and composition rules. Section order matches the showcase one-for-one.
3. Define a token / theme layer on your side first, then build components against it — same shape as the CSS source.
4. For feature-specific flows, look in `../flows/`. If the flow you need isn't there yet, ask and we'll add it.

The full running prototype lives at `../../dist-v6/index.html` — open it for app-level UX context (gesture feel, surrounding screens, animation timing).

## Ignore the iPhone frame in the prototype

The desktop view of `dist-v6/index.html` wraps the screen in an iPhone 15 Pro chrome (device PNG + status-bar PNG). That's pure preview scaffolding — it only renders at viewports ≥ 768 px and disappears on phone-sized viewports. Flutter handles real device chrome itself via `SafeArea` and the OS-drawn status bar / notch / home indicator. Nothing to implement from those visuals.

## What is NOT in this handoff

- **An `AppColors` / `AppTheme` Dart file.** The tokens in `spec.md` §1 (and `dist-v6/tokens.css`) are the source of truth; translate them into your theme layer in whatever shape fits the app.
- **Gesture physics.** Drag thresholds, rotation, opacity ramps for swipe stamps belong to the consumer (deal card). See the reveal-contract notes in `spec.md` §2.6 and §3.
- **Screen-level compositions.** How components combine into pages / sheets / modals isn't covered here — that's per-feature handoff territory.
- **Animations beyond per-component transitions.** Each component's `transition` values are listed; anything richer (slide-ins, sheet motion, hero transitions) is owned by the consumer.
- **Per-feature flows.** Per-feature flows live in `../flows/`. Each is a single `.md` file that references this library by component name and adds the flow-specific bits (interaction, state, timing).

## Open questions for the developer

1. **Poppins loading.** The font stack starts with Poppins and falls back to system fonts. Confirm Poppins is bundled (or loaded via `google_fonts`) on the Flutter side — otherwise every spec value lands on system fallback and visuals will drift.
2. **`backdrop-filter` parity.** Web glass surfaces use `backdrop-filter: blur(28px) saturate(180%)`. Flutter's `BackdropFilter` + `ImageFilter.blur` is the analogue; saturate has no direct equivalent and may need a `ColorFilter.matrix` or be approximated by tuning the glass background opacity. Flag drift early and we'll adjust the token if needed.
3. **`color-mix(...)` fallbacks.** A few rules use CSS `color-mix` (selected menu-item background, rich-toast icon tint). The mixed colors are already final values you can compute once and ship as constants on the Flutter side — no need to replicate the function.
