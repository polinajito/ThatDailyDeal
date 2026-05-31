# dist-v6 — components-first workflow

This directory contains the prototype (`index.html`, `v6.css`, `v6.js`)
and its design library (`library.html`, `library.css`). Tokens and shared
components live in two files that both pages link:

- `tokens.css` — design tokens (colors, type, spacing, radius, shadows,
  liquid glass). The single source of truth for raw values.
- `components.css` — canonical component rules (`.btn` family, `.menu` /
  `.menu-item` family, `.price-pill` family, `.deals-banner` family). All
  rules reference `tokens.css`, never hardcoded values.

## Rules for new work

1. **Components-first.** Any visual UI added to `index.html` (or rendered
   dynamically by `v6.js`) must use classes from `components.css`. If the
   element you need doesn't exist yet, add it to `components.css` *and*
   showcase it in `library.html` before using it in the prototype.
2. **Tokens over literals.** `v6.css` should reference `tokens.css`
   variables for colors, radii, shadows, type, and glass surfaces — not
   hex literals or hardcoded `rgba(...)`. The only thing `v6.css :root`
   owns is `--ease-out`, the prototype-only animation curve.
3. **`v6.css` is for prototype-only concerns only** — the phone-screen
   frame, the card deck, screens/overlays, sheet animations, and
   prototype-specific positioning of library components (e.g. where the
   price pill sits on the card). It should not redefine glass surfaces,
   button visuals, menu structure, etc.
4. **`library.css` is page chrome only** — the sidebar, foundation demos,
   and `.lib-*` scaffolding. Never put a shared component there.
5. **One feature = one JS file, migrated on build-out.** Each *feature*
   tab (`events`, `contests`, `rewards`, `cart`…) owns a classic script
   (`events.js`, etc.) loaded after `v6.js`. `index.html` carries only a
   thin mount point for it —
   `<section class="screen" data-tab="events"><div id="eventsRoot"></div></section>`
   — and the feature file renders its own markup into that root (mirroring
   how `v6.js` fills the deals `#deck`). This keeps `index.html` a skeleton
   and `v6.js` the app shell (nav, screen-switching, toggles).
   - **Migrate on build-out, not eagerly.** A tab that's still a trivial
     "Coming soon" placeholder may stay inline in `index.html`; split it
     into its own file the moment it gets real content. (As of this
     writing only `events` is split; `contests`/`rewards`/`cart` remain
     inline placeholders.)
   - **The `deals` shell screen stays in `v6.js`.** It's the home screen
     and its deck rendering is woven into the swipe/navigation logic, so
     it is a deliberate exception to the one-file rule.
   - Classic scripts, **not** ES modules: `<script type="module">` is
     blocked under `file://`, and library previews open these files
     directly. Wrap each feature in an IIFE to avoid global leakage.
   - Feature-only positioning may go in a per-feature CSS file
     (`events.css`) linked alongside `v6.css`, following rules 2–3.
     Shared visuals still land in `components.css` first (rule 1).

## Quick map

| Prototype class           | Source                                       |
| ------------------------- | -------------------------------------------- |
| `.btn`, `.btn-primary`…   | `components.css`                             |
| `.menu`, `.menu-item`     | `components.css` (positioned by `.bottom-nav` in `v6.css`) |
| `.price-pill`, `.pp-*`    | `components.css` (positioned by `v6.css`)    |
| `.deals-banner`           | `components.css` (positioned by `v6.css`)    |
| `.act-btn`                | Hook for icon swaps + like state in `v6.css`; visual from `.btn.btn-glass.btn-icon-only.btn-md` |
| `.dd-btn`                 | Width:100% modifier in `v6.css`; visual from `.btn.btn-primary` / `.btn.btn-secondary` |
