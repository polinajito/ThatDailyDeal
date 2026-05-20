# UI Library — Component Spec

Canonical spec for the ThatDailyDeal design system. Foundations (tokens) come first, then every component currently in the shared library.

- **Live preview:** `../../dist-v6/library.html` — open in any browser. Section headings below mirror the showcase one-for-one.
- **Source of truth (CSS):** `../../dist-v6/tokens.css` (tokens) and `../../dist-v6/components.css` (components). Every "Source:" line points back into these files.
- **Worked example of a per-feature handoff that consumes this library:** `../sold-out-flow/` — four out-of-stock components documented in this same style.

Bind to tokens, not raw hex / px values. If a component needs a shade or spacing not in the foundations, that's a token gap — flag it instead of inlining a literal.

---

## Part 1 — Foundations

All tokens are defined as CSS custom properties on `:root` in `tokens.css:8-71`.

### 1.1 Colors

#### Brand

| Token                  | Value      | Use                                                         |
| ---------------------- | ---------- | ----------------------------------------------------------- |
| `--color-blue`         | `#3C65BD`  | Primary brand blue. `.btn-secondary` fill, brand surfaces.  |
| `--color-blue-dark`    | `#1E3464`  | `.btn-secondary` hover, deep brand backgrounds.             |
| `--color-blue-deep`    | `#14224a`  | Gradient depth — derived darker than `blue-dark`.           |
| `--color-blue-night`   | `#0c1530`  | Gradient depth — darkest. Bottom of brand gradients.        |
| `--color-gold`         | `#F0A12A`  | Accent / CTA. `.btn-primary` fill, selected menu pill, notify stamp, rich-toast icon. |
| `--color-gold-dark`    | `#D08818`  | `.btn-primary` hover, gold gradient depth.                  |

#### System

| Token            | Value      | Use                                                       |
| ---------------- | ---------- | --------------------------------------------------------- |
| `--color-red`    | `#D43A36`  | Sale / urgency. Discount badge, deals-banner icon + time, skip + sold-out stamps, menu item badge. |
| `--color-green`  | `#36c980`  | Success / confirmation. Add stamp.                        |

#### Neutrals

| Token              | Value      | Use                                                 |
| ------------------ | ---------- | --------------------------------------------------- |
| `--color-white`    | `#ffffff`  | Default text on dark surfaces, rich-toast bg.       |
| `--color-ink`      | `#1A1A1A`  | Default text on light surfaces (rich-toast title).  |
| `--color-gray-300` | `#C8CCD3`  | Desaturated states (skip stamp on sold-out cards).  |
| `--color-gray-500` | `#8A8F99`  | Mid-tone supporting text.                           |
| `--color-gray-700` | `#4A4F58`  | Secondary text on light surfaces (rich-toast sub).  |

### 1.2 Typography

| Token                    | Value                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| `--font-family-primary`  | `"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` |

There is no type-scale token set yet — per-component sizes/weights/letter-spacing are listed inline in each component's Visual table below. Poppins must be loaded by the host app; the system fallback stack covers a missing-font case.

### 1.3 Spacing

4px base scale. Use these for all padding, margin, and gap values.

| Token        | Value  |
| ------------ | ------ |
| `--space-1`  | `4px`  |
| `--space-2`  | `8px`  |
| `--space-3`  | `12px` |
| `--space-4`  | `16px` |
| `--space-5`  | `24px` |
| `--space-6`  | `32px` |
| `--space-7`  | `48px` |
| `--space-8`  | `64px` |

### 1.4 Border radius

| Token              | Value    | Use                                                  |
| ------------------ | -------- | ---------------------------------------------------- |
| `--radius-xs`      | `6px`    | Discount badge.                                      |
| `--radius-sm`      | `8px`    | Small chips, inputs.                                 |
| `--radius-md`      | `12px`   | Swipe-stamp border.                                  |
| `--radius-lg`      | `16px`   | Price pill, rich toast.                              |
| `--radius-xl`      | `22px`   | Card surfaces.                                       |
| `--radius-pill`    | `999px`  | Buttons, menu container, menu items, deals banner, toast, menu-item badge. |
| `--radius-circle`  | `50%`    | Avatar / icon circles (rich-toast icon container).   |

### 1.5 Shadows

| Token                | Value                                                | Use                                       |
| -------------------- | ---------------------------------------------------- | ----------------------------------------- |
| `--shadow-sm`        | `0 2px 6px rgba(0, 0, 0, .18)`                       | Subtle lift.                              |
| `--shadow-md`        | `0 4px 14px rgba(0, 0, 0, .25)`                      | Standard card lift.                       |
| `--shadow-lg`        | `0 12px 32px rgba(0, 0, 0, .45)`                     | Floating surfaces (rich toast).           |
| `--shadow-sheet`     | `0 -10px 40px rgba(0, 0, 0, .4)`                     | Upward shadow for bottom sheets.          |
| `--shadow-gold-glow` | `0 6px 16px rgba(240, 161, 42, .4)`                  | CTA glow under `.btn-primary`.            |

### 1.6 Liquid glass

A bundle of four tokens applied together to produce the primary glass surface (deals banner, price pill, action buttons, menu, bottom nav). Plus a subtler variant for toast / restock CTA.

#### Primary glass

| Token             | Value                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `--glass-bg`      | `rgba(20, 20, 20, .55)`                                                                                                          |
| `--glass-border`  | `1px solid rgba(255, 255, 255, .18)`                                                                                             |
| `--glass-blur`    | `blur(28px) saturate(180%)` — applied via `backdrop-filter` (and `-webkit-backdrop-filter`)                                      |
| `--glass-shadow`  | `0 12px 32px rgba(0, 0, 0, .45), inset 0 1px 0 rgba(255, 255, 255, .22), inset 0 -1px 0 rgba(0, 0, 0, .25)` — outer + two insets |

#### Subtle glass

| Token                  | Value                          |
| ---------------------- | ------------------------------ |
| `--glass-bg-subtle`    | `rgba(0, 0, 0, .5)`            |
| `--glass-blur-subtle`  | `blur(6px) saturate(140%)`     |

Glass needs a backdrop with content behind it to actually look like glass — the blur is the effect. On a flat opaque parent it just renders as a translucent dark fill.

---

## Part 2 — Components

Each component is independent. Implement in any order. Section headings match `library.html` section order.

### 2.1 Price pill

Liquid-glass pill showing product name + current price + (optional) old price + (optional) discount badge. Used as the overlay on a deal card.

#### Base — `.price-pill`

| Property        | Value                                            |
| --------------- | ------------------------------------------------ |
| Background      | `--glass-bg` + `--glass-border` + `--glass-blur` + `--glass-shadow` (primary glass bundle) |
| Border radius   | `--radius-lg` (16px)                             |
| Padding         | `--space-3` `--space-4` (12px vertical, 16px horizontal) |
| Layout          | `display: flex; align-items: center; gap: --space-3` |
| Text color      | `--color-white`                                  |
| Font family     | `--font-family-primary`                          |

#### Children

| Child             | Properties                                                                              |
| ----------------- | --------------------------------------------------------------------------------------- |
| `.pp-info`        | Flex-grow container that holds name + prices. `flex: 1 1 auto; min-width: 0` to allow ellipsis. |
| `.pp-name`        | 15px / weight 700 / `--color-white` / single-line ellipsis. Margin-bottom `--space-1`.  |
| `.pp-prices`      | Flex row, baseline-aligned, `gap: --space-2`, wraps if needed.                          |
| `.pp-now`         | 20px / weight 800 / `--color-white` — current price.                                    |
| `.pp-old`         | 13px / `rgba(255,255,255,.7)` / line-through — original price.                          |
| `.pp-discount`    | Pill badge: padding `--space-1` `--space-2`, 12px / weight 800, `--color-white` on `--color-red`, `--radius-xs`, letter-spacing `-0.2px`, nudged up `translateY(-1px)`. |

#### Variants

| Modifier       | Effect                                                                            |
| -------------- | --------------------------------------------------------------------------------- |
| `.pp-soldout`  | `.pp-now` becomes line-through, `rgba(255,255,255,.7)`, weight drops to 700. Old price unchanged. |

**Source:** `components.css:19-75`.

---

### 2.2 Button

Composable system: base + size + color + optional modifiers. Modifiers stack — e.g. `.btn .btn-secondary .btn-ghost .btn-icon-only .btn-md` is a valid combination.

#### Base — `.btn`

| Property         | Value                                                                |
| ---------------- | -------------------------------------------------------------------- |
| Font family      | `--font-family-primary`                                              |
| Font weight      | 700                                                                  |
| Border           | none                                                                 |
| Border radius    | `--radius-pill`                                                      |
| Layout           | `inline-flex`, items centered, `gap: --space-2` between icon + label |
| Press feedback   | `transform: scale(.97)` on `:active`                                 |
| Transitions      | bg / color / transform / filter / box-shadow                         |
| Tap highlight    | suppressed (`-webkit-tap-highlight-color: transparent`)              |
| User select      | none                                                                 |

#### Sizes

| Class      | Height | Font size | Horizontal padding |
| ---------- | ------ | --------- | ------------------ |
| `.btn-sm`  | 36px   | 13px      | `--space-4` (16px) |
| `.btn-md`  | 44px   | 14px      | `--space-5` (24px) |
| `.btn-lg`  | 54px   | 16px      | `--space-6` (32px) |

Icon-only variants force square aspect — width matches height: 36 / 44 / 54px.

#### Colors

| Class             | Background       | Text              | Shadow                       | Hover bg              |
| ----------------- | ---------------- | ----------------- | ---------------------------- | --------------------- |
| `.btn-primary`    | `--color-gold`   | `--color-white`   | `--shadow-gold-glow`         | `--color-gold-dark`   |
| `.btn-secondary`  | `--color-blue`   | `--color-white`   | `0 4px 14px rgba(60,101,189,.35)` | `--color-blue-dark`   |

#### Modifiers

| Modifier         | Effect                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `.btn-ghost`     | Transparent fill, no shadow, 1.5px border in `currentColor`. Composes on top of a color: `.btn-primary.btn-ghost` (gold text/border) or `.btn-secondary.btn-ghost` (blue text/border). Hover paints an 8%-opacity wash of the color. |
| `.btn-icon-only` | `padding: 0`, square aspect-ratio. Combine with a size class to set the width.                          |
| `.btn-glass`     | Replaces the solid fill with the primary glass bundle: `--glass-bg` + `--glass-border` + `--glass-blur` + `--glass-shadow`. Text becomes `--color-white`. Hover bg `rgba(40,40,40,.65)`. Primarily used for icon-only action buttons. |

#### Icon

Wrap the icon in `.btn-icon`. Size scales with the parent size class:

| Parent     | Icon size |
| ---------- | --------- |
| `.btn-sm`  | 16×16     |
| `.btn-md`  | 18×18     |
| `.btn-lg`  | 20×20     |

Icon position is DOM order — put the `.btn-icon` element before the label for left-aligned, after for right-aligned.

#### Toggle state pattern

For binary icon-only buttons (mute, pause, favorite, etc.) embed both icons in the button and let `.is-active` swap which is visible:

```html
<button class="btn btn-glass btn-icon-only btn-md">
  <svg class="btn-icon btn-icon-default">…</svg>
  <svg class="btn-icon btn-icon-active">…</svg>
</button>
```

| State        | Visible           |
| ------------ | ----------------- |
| default      | `.btn-icon-default` |
| `.is-active` | `.btn-icon-active`  |

#### `.btn-favorite`

Same toggle pattern, with one extra rule: when `.is-active`, color shifts to `--color-red` (heart reads as "liked"). Compose: `.btn-glass.btn-icon-only.btn-favorite` + `.is-active`.

**Source:** `components.css:83-166`.

---

### 2.3 Menu item

Vertical icon-over-label cell used inside a `.menu` container (or on its own). Optional badge in the top-right corner.

#### Base — `.menu-item`

| Property        | Value                                                                        |
| --------------- | ---------------------------------------------------------------------------- |
| Width           | 64px                                                                         |
| Min height      | 50px                                                                         |
| Padding         | `--space-1` `--space-2` (symmetric — overrides browser default button padding) |
| Background      | transparent                                                                  |
| Border          | none                                                                         |
| Border radius   | `--radius-pill`                                                              |
| Layout          | column flex, centered, `gap: --space-1` between icon + label                 |
| Text color      | `rgba(255, 255, 255, .65)` (idle)                                            |
| Hover color     | `--color-white`                                                              |
| Transitions     | color + background-color, 0.2s ease                                          |
| Tap highlight   | suppressed                                                                   |

#### Children

| Child               | Properties                                                                  |
| ------------------- | --------------------------------------------------------------------------- |
| `.menu-item-icon`   | 22×22px, no shrink.                                                         |
| `.menu-item-label`  | 10px / weight 600 / letter-spacing 0.1px / line-height 1. Inherits color.   |
| `.menu-item-badge`  | Absolute top:1px right:1px. `--color-red` on `--color-ink`, 10px / weight 700, min-width 17px, height 17px, `--radius-pill`, 2px solid `--color-ink` border (cuts into the parent). |

#### States

| Modifier        | Effect                                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `.is-selected`  | Color → `--color-white`, background → 85%-opacity `--color-gold`, 1px white border at 22% opacity, gold-glow shadow stack: `0 4px 14px rgba(240,161,42,.45), inset 0 1px 0 rgba(255,255,255,.45), inset 0 -1px 0 rgba(0,0,0,.15)`. |

**Source:** `components.css:198-258`.

---

### 2.4 Menu

Primary-glass pill container that holds `.menu-item`s. Adds a soft white highlight across the top edge.

#### Base — `.menu`

| Property        | Value                                                                              |
| --------------- | ---------------------------------------------------------------------------------- |
| Position        | `relative` (needed for the `::before` highlight)                                   |
| Background      | `--glass-bg` + `--glass-border` + `--glass-blur` + `--glass-shadow` (primary glass) |
| Border radius   | `--radius-pill`                                                                    |
| Padding         | `--space-1`                                                                        |
| Layout          | `inline-flex`, items centered, `gap: --space-1`                                    |
| Font family     | `--font-family-primary`                                                            |

#### Top highlight — `.menu::before`

A non-interactive overlay that softens the top edge with a vertical white fade:

| Property         | Value                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Inset            | `0` (covers the whole container)                                                             |
| Border radius    | inherits container                                                                           |
| Background       | `linear-gradient(180deg, rgba(255,255,255,.18) 0%, rgba(255,255,255,0) 55%)`                 |
| Pointer events   | none                                                                                         |
| Z-index          | 0 (behind menu items, which use `z-index: 1`)                                                |

**Source:** `components.css:174-196`.

---

### 2.5 Deals banner

Compact glass pill: red icon + countdown text. Used in card overlays and section headers.

#### Base — `.deals-banner`

| Property        | Value                                                                              |
| --------------- | ---------------------------------------------------------------------------------- |
| Layout          | `inline-flex`, items centered, `gap: --space-2`                                    |
| Padding         | `--space-2` `--space-4` (8px vertical, 16px horizontal)                            |
| Background      | `--glass-bg` + `--glass-border` + `--glass-blur` + `--glass-shadow` (primary glass) |
| Border radius   | `--radius-pill`                                                                    |
| Text color      | `rgba(255, 255, 255, .92)` (default label text)                                    |
| Font family     | `--font-family-primary`                                                            |
| Font size       | 12px                                                                               |
| Font weight     | 600                                                                                |
| Letter spacing  | 0.2px                                                                              |

#### Children

| Child                  | Properties                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `.deals-banner-icon`   | 14×14px SVG. Color `--color-red`. No shrink.                                        |
| `.deals-banner-time`   | Weight 800, color `--color-red`, `font-variant-numeric: tabular-nums`, letter-spacing 0.4px (countdown digits stay aligned). |

**Source:** `components.css:265-294`.

---

### 2.6 Swipe stamps

Large rotated overlays shown on a card during a swipe gesture, or persistently on sold-out cards. Base class is invisible by default — visibility is owned by the consumer (the deal card in the prototype toggles `.show-add` / `.show-skip` / `.show-notify` / `.sold-out` on itself to reveal the matching stamp).

#### Base — `.swipe-stamp`

| Property        | Value                                          |
| --------------- | ---------------------------------------------- |
| Position        | `absolute` (needs a positioned ancestor)       |
| Top             | 36%                                            |
| Font family     | `--font-family-primary`                        |
| Font size       | 56px                                           |
| Font weight     | 900                                            |
| Letter spacing  | 2px                                            |
| Border          | `4px solid currentColor`                       |
| Padding         | `--space-2` `--space-4` (8px / 16px)           |
| Border radius   | `--radius-md` (12px)                           |
| Text transform  | uppercase                                      |
| Opacity         | 0 (consumer ramps with drag distance)          |
| Pointer events  | none                                           |
| Z-index         | 4                                              |
| Transition      | `opacity .12s ease`                            |

#### Variants

| Class             | Color                | Position                                          | Rotation                            | Notes |
| ----------------- | -------------------- | ------------------------------------------------- | ----------------------------------- | ----- |
| `.stamp-add`      | `--color-green`      | `left: --space-5` (24px)                          | `-12deg`                            | Right-swipe on in-stock cards. |
| `.stamp-skip`     | `--color-red`        | `right: --space-5`                                | `+12deg`                            | Left-swipe on any card. |
| `.stamp-soldout`  | `--color-red`        | `left: 50%`                                       | `translateX(-50%) rotate(-8deg)`    | Persistent on sold-out cards. Text "SOLD OUT" stays on one line (`white-space: nowrap`). |
| `.stamp-notify`   | `--color-gold`       | `left: --space-5`                                 | `-12deg`                            | Right-swipe on sold-out cards (replaces `.stamp-add`). Font size 44px (smaller than the 56px default to balance with the bell icon). `inline-flex` with `gap: --space-2`; embeds a 44×44 SVG bell. |

#### Modifier

| Modifier   | Effect                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------- |
| `.is-muted` | Used on `.stamp-skip` for sold-out cards. Color → `--color-gray-300`. Desaturates the skip cue so it stays semantically meaningful without the "you're losing a good deal" red urgency. |

#### Reveal contract

The library does not own the trigger. The consumer (deal card) is responsible for:
- Ramping `opacity` from 0 → 1 with the drag distance (skip / add / notify).
- Fading back to 0 over ~120 ms if the drag is released without committing.
- Keeping the stamp visible while the card animates off-screen on commit.
- Toggling `.sold-out` to reveal `.stamp-soldout` (and triggering its fade during a swipe so it doesn't overlap with the active gesture stamp).

**Source:** `components.css:305-342`.

---

### 2.7 Toast

Small black pill, white text. Low-stakes feedback — "Liked", "Skip", "Link copied", "Added × N". Hidden by default; consumer adds `.show` to reveal and owns the slide-in transform.

#### Base — `.toast`

| Property        | Value                                            |
| --------------- | ------------------------------------------------ |
| Background      | `rgba(20, 20, 20, .92)`                          |
| Text color      | `--color-white`                                  |
| Font family     | `--font-family-primary`                          |
| Font size       | 13px                                             |
| Font weight     | 600                                              |
| Padding         | `--space-2` `--space-3` (8px / 12px)             |
| Border radius   | `--radius-pill`                                  |
| Opacity         | 0                                                |
| Pointer events  | none                                             |
| Transition      | `opacity .25s ease`                              |

#### Reveal

| State    | Effect            |
| -------- | ----------------- |
| `.show`  | `opacity: 1`      |

**Source:** `components.css:350-362`.

---

### 2.8 Rich toast

White card: circular gold-tinted icon, bold title, gray supporting text. High-stakes confirmations — "We'll notify you when this is back in stock", etc. Hidden by default; consumer adds `.show` to reveal and owns the slide-in transform.

#### Base — `.rich-toast`

| Property        | Value                                                                                |
| --------------- | ------------------------------------------------------------------------------------ |
| Layout          | `flex`, items centered, `gap: --space-3` between icon + text                         |
| Background      | `--color-white`                                                                      |
| Text color      | `--color-ink`                                                                        |
| Border radius   | `--radius-lg` (16px)                                                                 |
| Padding         | `--space-3` (12px all sides)                                                         |
| Box shadow      | `--shadow-lg`                                                                        |
| Font family     | `--font-family-primary`                                                              |
| Opacity         | 0                                                                                    |
| Pointer events  | none                                                                                 |
| Transition      | `opacity .28s ease`                                                                  |

#### Children

| Child                  | Properties                                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `.rich-toast-icon`     | 40×40px, `--radius-circle`, background `color-mix(in srgb, var(--color-gold) 16%, transparent)` (gold @ 16% alpha), icon color `--color-gold`, centered with flex. No shrink. |
| `.rich-toast-text`     | Flex-grow column, `min-width: 0` for ellipsis, row gap 2px.                                                      |
| `.rich-toast-title`    | 15px / weight 800 / `--color-ink` / line-height 1.2 / letter-spacing `-0.1px`.                                   |
| `.rich-toast-sub`      | 13px / weight 500 / `--color-gray-700` / line-height 1.35.                                                       |

#### Reveal

| State    | Effect            |
| -------- | ----------------- |
| `.show`  | `opacity: 1`      |

**Source:** `components.css:372-418`.

---

## Part 3 — Cross-cutting contracts

### Tokens over literals

Every component above binds to tokens. Implementations on the Flutter side should mirror that — define a token / theme layer first, then build components against it. If you find yourself reaching for a raw hex or pixel value, check whether it's a missing token (worth raising) vs. genuinely component-local (rare).

### Hidden-by-default + consumer-owned reveal

`.swipe-stamp`, `.toast`, and `.rich-toast` all start at `opacity: 0` with `pointer-events: none`. The library does not animate them in or out. The consumer:
- Adds the reveal class (`.show` on toasts; `.show-add` / `.show-skip` / `.show-notify` / `.sold-out` on the parent card for stamps).
- Owns any transform (slide-down, slide-up) layered on top of the opacity transition.
- Owns the dismiss timer (e.g. ~2800 ms for the notify confirmation rich-toast — see `sold-out-flow/spec.md` §4 for one worked example).

### Liquid-glass surfaces

Four components adopt the primary glass bundle and should feel like one material: `.price-pill`, `.menu`, `.deals-banner`, and `.btn` with `.btn-glass`. All four pull from the same four tokens (`--glass-bg`, `--glass-border`, `--glass-blur`, `--glass-shadow`). If a fifth glass surface is needed, reuse those tokens — don't redefine the values inline.

### Showcase parity

`library.html` is the live reference. If a property in this spec drifts from the showcase, the showcase wins — re-check the source CSS and update the spec.
