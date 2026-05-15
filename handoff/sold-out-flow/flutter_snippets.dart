// Sold-Out Flow — Flutter widget translations.
//
// Drop this file into a Flutter project (any path under lib/) and import where
// needed. Each widget is a direct translation of the corresponding CSS rule in
// dist-v6/v6.css — see the class docstring for the source selector and line.
//
// These are starter widgets. They render the visual correctly but don't yet
// handle:
//   • swipe gesture / drag-driven opacity (handled by the parent deck widget)
//   • show/hide animation timing (wrap in AnimatedOpacity / AnimatedSlide)
//   • theming (colors are inlined — refactor to a ThemeExtension when the
//     UI library is built; see _Tokens below for the values to lift)
//
// Specs: spec.md (this folder). Visual reference: preview.html (this folder).

import 'dart:math' as math;
import 'package:flutter/material.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Tokens — extracted from dist-v6/v6.css :root (lines 5-22).
// Move these to a ThemeExtension or AppColors class when expanding into the
// full UI library. Kept private here so this file is a self-contained drop-in.
// ─────────────────────────────────────────────────────────────────────────────
class _Tokens {
  static const Color brandRed   = Color(0xFFD43A36);
  static const Color brandGold  = Color(0xFFE6A745);
  static const Color brandGreen = Color(0xFF36C980);
  static const Color ink        = Color(0xFF1A1A1A);
  static const Color gray300    = Color(0xFFC8CCD3);
  static const Color gray700    = Color(0xFF4A4F58);

  /// Equivalent of CSS `cubic-bezier(.22,.61,.36,1)` — use with AnimatedOpacity,
  /// AnimatedContainer, etc.
  static const Cubic easeOut = Cubic(0.22, 0.61, 0.36, 1.0);
}

double _deg(double degrees) => degrees * math.pi / 180.0;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Sold Out badge
//    Persistent overlay on out-of-stock cards. Centered horizontally,
//    anchored ~36% from the top of the card.
//    Source: dist-v6/v6.css:373-395 (.swipe-stamp + .stamp-soldout)
// ─────────────────────────────────────────────────────────────────────────────
class SoldOutBadge extends StatelessWidget {
  const SoldOutBadge({super.key});

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: _deg(-8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
        decoration: BoxDecoration(
          border: Border.all(color: _Tokens.brandRed, width: 4),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Text(
          'SOLD OUT',
          style: TextStyle(
            color: _Tokens.brandRed,
            fontSize: 56,
            fontWeight: FontWeight.w900,
            letterSpacing: 2,
            height: 1.0,
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Skip stamp — left-swipe stamp.
//    Pass `soldOutVariant: true` to desaturate to gray-300 on sold-out cards.
//    The parent deck widget controls opacity via AnimatedOpacity wrapping.
//    Source: dist-v6/v6.css:373-389 (.swipe-stamp + .stamp-skip), :1094
// ─────────────────────────────────────────────────────────────────────────────
class SkipStamp extends StatelessWidget {
  const SkipStamp({super.key, this.soldOutVariant = false});

  final bool soldOutVariant;

  @override
  Widget build(BuildContext context) {
    final color = soldOutVariant ? _Tokens.gray300 : _Tokens.brandRed;
    return Transform.rotate(
      angle: _deg(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
        decoration: BoxDecoration(
          border: Border.all(color: color, width: 4),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          'SKIP',
          style: TextStyle(
            color: color,
            fontSize: 56,
            fontWeight: FontWeight.w900,
            letterSpacing: 2,
            height: 1.0,
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Notify me stamp — right-swipe stamp shown only on sold-out cards.
//    Bell icon + "NOTIFY" text. Bell icon uses Material's notifications_outlined
//    by default — swap for CupertinoIcons.bell if the app standardizes on
//    Cupertino. The original prototype uses a custom inline SVG; the Material
//    icon is the closest match and is the idiomatic Flutter choice.
//    Source: dist-v6/v6.css:1078-1091
// ─────────────────────────────────────────────────────────────────────────────
class NotifyStamp extends StatelessWidget {
  const NotifyStamp({super.key});

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: _deg(-12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
        decoration: BoxDecoration(
          border: Border.all(color: _Tokens.brandGold, width: 4),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.notifications_outlined,
              size: 44,
              color: _Tokens.brandGold,
            ),
            SizedBox(width: 8),
            Text(
              'NOTIFY',
              style: TextStyle(
                color: _Tokens.brandGold,
                fontSize: 44,
                fontWeight: FontWeight.w900,
                letterSpacing: 2,
                height: 1.0,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Notify confirmation toast (rich-toast).
//    White card shown after the user submits the notify-me sheet. Slides down
//    from the top with a 280 ms ease-out transition; auto-dismisses after
//    2800 ms. Wrap this widget in AnimatedSlide + AnimatedOpacity (or use a
//    Visibility + AnimationController) for the entry/exit motion.
//    Source: dist-v6/v6.css:426-480, dist-v6/v6.js:741-758
// ─────────────────────────────────────────────────────────────────────────────
class NotifyConfirmationToast extends StatelessWidget {
  const NotifyConfirmationToast({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Color(0x47000000), // rgba(0,0,0,0.28)
            blurRadius: 32,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              color: Color(0x29E6A745), // brandGold @ 16% alpha
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.notifications_outlined,
              size: 22,
              color: _Tokens.brandGold,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Great choice!',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: _Tokens.ink,
                    letterSpacing: -0.1,
                    height: 1.2,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  "We'll notify you when this item is back in stock.",
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: _Tokens.gray700,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
