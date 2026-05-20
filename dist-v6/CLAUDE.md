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

## Quick map

| Prototype class           | Source                                       |
| ------------------------- | -------------------------------------------- |
| `.btn`, `.btn-primary`…   | `components.css`                             |
| `.menu`, `.menu-item`     | `components.css` (positioned by `.bottom-nav` in `v6.css`) |
| `.price-pill`, `.pp-*`    | `components.css` (positioned by `v6.css`)    |
| `.deals-banner`           | `components.css` (positioned by `v6.css`)    |
| `.act-btn`                | Hook for icon swaps + like state in `v6.css`; visual from `.btn.btn-glass.btn-icon-only.btn-md` |
| `.dd-btn`                 | Width:100% modifier in `v6.css`; visual from `.btn.btn-primary` / `.btn.btn-secondary` |
