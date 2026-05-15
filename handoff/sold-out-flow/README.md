# Sold-Out Flow — Handoff

Mini handoff covering four components in the out-of-stock experience: the persistent **Sold Out badge**, the left-swipe **Skip** stamp, the right-swipe **Notify me** stamp, and the white **notify-confirmation toast**.

## What's in this folder

| File                    | Purpose                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `preview.html`          | Visual reference. All four components on a dark backdrop. **Open in any browser.**     |
| `spec.md`               | Canonical property/state spec. Every value sources back to the prototype CSS.          |
| `flutter_snippets.dart` | Four paste-ready Flutter widgets (`SoldOutBadge`, `SkipStamp`, `NotifyStamp`, `NotifyConfirmationToast`). |

## How to use it

1. Open `preview.html` to see exactly what you're building.
2. Skim `spec.md` for values, states, and cross-component interactions.
3. Drop `flutter_snippets.dart` into your Flutter project's `lib/` and import the widgets. The widgets render the visuals correctly; the parent deck/sheet code owns gesture handling and entry/exit animation.

The running prototype lives at `../../dist-v6/index.html` — open it for the full UX context (gesture feel, timing, surrounding screens).

## What is NOT in this handoff (yet)

- Full theme / design tokens as a Dart file. The CSS variables in `dist-v6/v6.css:5-22` are the source of truth; the snippets inline the values they need. A proper `AppColors` / `AppTheme` lands with the UI library handoff later.
- Swipe gesture physics (drag thresholds, rotation, opacity ramps).
- The notify-me sheet itself.
- The rest of the app (cards, deck, nav, etc.).

## Open questions for the developer

1. **Icon library.** The `NotifyStamp` and `NotifyConfirmationToast` widgets use `Icons.notifications_outlined` (Material). If the app standardizes on Cupertino, swap for `CupertinoIcons.bell`. Either is fine — pick what matches the rest of the app.
2. **`FontWeight.w900` availability.** Black weight is supported on iOS (San Francisco) and most Android Roboto installs, but devices missing the weight fall back silently to the nearest available. If you see fallback drift, ping us and we'll bundle Inter (or similar) as a packaged font.

## Don't ship the SVG export

An earlier attempt produced `sold-out-badge.svg` as a static export. It looked wrong because system fonts rasterize per OS — a frozen vector will always drift. The widgets in `flutter_snippets.dart` render from primitives and will be pixel-correct at any scale. The old folder (`../sold-out-badge/`) has been removed.
