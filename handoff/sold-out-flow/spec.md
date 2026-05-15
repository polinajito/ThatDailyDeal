# Sold-Out Flow — Component Spec

Four components that together make up the out-of-stock experience on a deal card:

1. **Sold Out badge** — persistent overlay on out-of-stock cards
2. **Skip stamp** — left-swipe stamp (works on any card)
3. **Notify me stamp** — right-swipe stamp (sold-out cards only; replaces "Add")
4. **Notify confirmation toast** — white card shown after the user submits the notify-me sheet

Each section below is independent — the dev can implement them in any order. Visual reference: `preview.html`. Flutter widget translations: `flutter_snippets.dart`.

---

## 1. Sold Out badge

A diagonal "SOLD OUT" stamp overlaid on the product video card when an item is out of stock. Persistent (does not animate in/out except during a swipe — see Interactions).

### Visual

| Property        | Value                                                              |
| --------------- | ------------------------------------------------------------------ |
| Text            | `SOLD OUT` (uppercase)                                             |
| Font family     | System default (San Francisco on iOS, Roboto on Android)           |
| Font weight     | 900 (Black / Heavy)                                                |
| Font size       | 56 px                                                              |
| Letter spacing  | 2 px                                                               |
| Text color      | `#D43A36` (`--brand-red`)                                          |
| Border          | 4 px solid, color `#D43A36`                                        |
| Corner radius   | 12 px                                                              |
| Padding         | 8 px vertical, 18 px horizontal                                    |
| Rotation        | −8° (counter-clockwise) around the badge's own center              |
| Opacity         | 100%                                                               |

### Position

| Property              | Value                                          |
| --------------------- | ---------------------------------------------- |
| Horizontal anchor     | Centered on the product card                   |
| Vertical anchor       | 36% from the top of the product card           |
| Layering              | Above the video and overlay, below modal sheets |

**Source:** `dist-v6/v6.css:373-402`, selectors `.swipe-stamp` (base) and `.stamp-soldout`.

---

## 2. Skip stamp

Appears while the user drags a card to the left. Opacity ramps with horizontal drag distance; the parent (swipe gesture handler) controls visibility — the stamp itself is just a static-styled overlay.

### Visual

| Property        | Value                                                              |
| --------------- | ------------------------------------------------------------------ |
| Text            | `SKIP` (uppercase)                                                 |
| Font weight     | 900                                                                |
| Font size       | 56 px                                                              |
| Letter spacing  | 2 px                                                               |
| Text color      | `#D43A36` (`--brand-red`) — or `#C8CCD3` on sold-out cards         |
| Border          | 4 px solid, matches text color                                     |
| Corner radius   | 12 px                                                              |
| Padding         | 8 px vertical, 18 px horizontal                                    |
| Rotation        | +12° (clockwise)                                                   |

### Position

| Property              | Value                                          |
| --------------------- | ---------------------------------------------- |
| Horizontal anchor     | `right: 22 px` from the card edge              |
| Vertical anchor       | 36% from the top                               |
| Layering              | Above the video and overlay                    |

### Variants

| Card state         | Text/border color |
| ------------------ | ----------------- |
| In stock           | `#D43A36`         |
| Sold out           | `#C8CCD3` (gray-300) — desaturated visual cue that the "skip" action is the only allowed direction |

### Behavior

| State                          | Opacity                                |
| ------------------------------ | -------------------------------------- |
| Idle                           | 0                                      |
| User dragging left             | Ramps 0 → 1 with drag distance         |
| Drag released without commit   | Fades to 0 (120 ms, ease-out)          |
| Drag committed (card flies off) | Stays visible while card animates out |

**Source:** `dist-v6/v6.css:373-389` (base + `.stamp-skip`), `:1094` (sold-out color variant).

---

## 3. Notify me stamp

Right-swipe stamp shown **only on sold-out cards** (in place of the "Add" stamp). Combines a bell icon and the word "Notify".

### Visual

| Property            | Value                                                                  |
| ------------------- | ---------------------------------------------------------------------- |
| Icon                | Bell, 44 × 44 px, stroke (no fill), 3 px stroke weight                 |
| Text                | `NOTIFY` (uppercase)                                                   |
| Font weight         | 900                                                                    |
| Font size           | 44 px (smaller than the 56 px stamps to balance with the icon)         |
| Letter spacing      | 2 px                                                                   |
| Color (icon + text) | `#E6A745` (`--brand-gold`)                                             |
| Border              | 4 px solid, color `#E6A745`                                            |
| Corner radius       | 12 px                                                                  |
| Padding             | 8 px vertical, 18 px horizontal                                        |
| Rotation            | −12° (counter-clockwise)                                               |
| Icon-to-text gap    | 8 px                                                                   |

### Position

| Property              | Value                                          |
| --------------------- | ---------------------------------------------- |
| Horizontal anchor     | `left: 22 px` from the card edge               |
| Vertical anchor       | 36% from the top                               |

### Behavior

Same opacity-ramp pattern as the Skip stamp, but for right-drag gesture on sold-out cards. On in-stock cards, the right-drag shows the (separate) "Add" stamp instead.

**Source:** `dist-v6/v6.css:1078-1091`. Bell icon inline SVG in `dist-v6/v6.js:167-173`.

---

## 4. Notify confirmation toast

White card shown after the user successfully submits the notify-me sheet (subscribes to back-in-stock alerts). Slides down from the top, auto-dismisses.

### Visual

| Property              | Value                                            |
| --------------------- | ------------------------------------------------ |
| Background            | White (`#FFFFFF`)                                |
| Text color (title)    | `#1A1A1A` (`--ink`)                              |
| Text color (subtitle) | `#4A4F58` (`--gray-700`)                         |
| Corner radius         | 16 px                                            |
| Padding               | 12 px vertical, 14 px horizontal                 |
| Box shadow            | `0 12px 32px rgba(0,0,0,0.28)`                   |
| Icon container size   | 40 × 40 px circle                                |
| Icon container bg     | `rgba(230, 167, 69, 0.16)` (gold @ 16% alpha)    |
| Icon                  | Same bell SVG as the Notify stamp, 22 × 22 px, color `#E6A745`, 2 px stroke |
| Title text            | `Great choice!`                                  |
| Title font            | 15 px / weight 800 / letter-spacing −0.1 px / line-height 1.2 |
| Subtitle text         | `We'll notify you when this item is back in stock.` |
| Subtitle font         | 13 px / weight 500 / line-height 1.35            |
| Icon-to-text gap      | 12 px                                            |
| Text-block row gap    | 2 px (between title and subtitle)                |

### Position & motion

| Property              | Value                                            |
| --------------------- | ------------------------------------------------ |
| Horizontal anchor     | 14 px from left, 14 px from right (stretches)    |
| Vertical anchor       | 88 px from the top of the card                   |
| Z-index               | Above the deck and overlays                      |
| Entry transform       | `translateY(-12 px) → translateY(0)`             |
| Exit transform        | Reverse                                          |
| Transition            | Opacity + transform, 280 ms, `cubic-bezier(.22,.61,.36,1)` |
| Auto-dismiss          | 2800 ms after entry                              |

**Source:** `dist-v6/v6.css:426-480` (`.rich-toast` + children). Trigger logic and copy in `dist-v6/v6.js:741-758`.

---

## Interactions across components

- **Sold Out badge fades out during a swipe.** When the user drags a sold-out card and either the Skip or Notify stamp becomes visible, the persistent Sold Out badge fades to 0 (120 ms) so the two stamps don't overlap. Once the drag is released without commit, it fades back. Source: `dist-v6/v6.css:401-402`.
- **Skip desaturates on sold-out cards.** See variant table in §2.
- **Notify only on sold-out, Add only on in-stock.** The right-swipe direction shows a different stamp depending on stock state. Source: `dist-v6/v6.css:1090-1091`.
- **Confirmation toast triggers after sheet submit.** The notify-me sheet's submit button calls `notifyBackInStock()` which fires the rich-toast. The toast is not tied to the right-swipe gesture itself — only to a completed subscription. Source: `dist-v6/v6.js:753-758`.

---

## Tokens used

| Token            | Value                                  | Used by                                              |
| ---------------- | -------------------------------------- | ---------------------------------------------------- |
| `--brand-red`    | `#D43A36`                              | Sold Out border/text, Skip (in-stock) border/text    |
| `--brand-gold`   | `#E6A745`                              | Notify stamp, rich-toast icon + icon background tint |
| `--gray-300`     | `#C8CCD3`                              | Skip on sold-out cards (desaturated)                 |
| `--ink`          | `#1A1A1A`                              | rich-toast title                                     |
| `--gray-700`     | `#4A4F58`                              | rich-toast subtitle                                  |
| `--ease-out`     | `cubic-bezier(.22, .61, .36, 1)`       | All transitions in this flow                         |

Token definitions live in `dist-v6/v6.css:5-22`.

---

## Don't ship the SVG

A previous attempt to export the Sold Out badge as a static SVG (`handoff/sold-out-badge/sold-out-badge.svg`, now removed) didn't reproduce the original cleanly — system-font weight 900 rasterizes per OS, so any frozen vector will drift from the live rendering. **Render from primitives** (the values in this spec, or the widgets in `flutter_snippets.dart`) and you'll get pixel-perfect results that scale and respect Dynamic Type.
