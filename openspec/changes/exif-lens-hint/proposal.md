# Proposal: EXIF-backed lens hints

## Why

The current camera shows a useful `Start at N×` hint, but uploaded references always fall back to crop/framing heuristics even when the original photo still contains 35mm-equivalent focal-length metadata.

For composition recreation, starting from the original focal-length family is materially better than guessing from crop alone: a half-body image made at ~50mm equivalent should not be treated the same as one made very close on a wide lens.

## Goal

When a user picks a reference photo and ImagePicker exposes usable 35mm-equivalent EXIF metadata, prefer that metadata for the advisory lens hint. If metadata is absent or invalid, retain the current crop/framing fallback.

## Non-goals

- Force CameraView to an exact physical lens.
- Convert raw sensor focal length without a 35mm-equivalent value.
- Change matching, Stable Match, Auto Capture, crop classification, or display-mode geometry.
- Persist EXIF beyond the in-memory lens-hint derivation.
