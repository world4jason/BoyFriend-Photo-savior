# Proposal: anatomy-first portrait crop classification

## Why

Reference crop metadata currently mixes pose evidence with the absolute bottom of the segmentation silhouette:

```text
hasAnkle OR silhouetteBottom > 0.92 -> full
```

A waist-up or chest-up portrait that simply touches the bottom edge of the reference can therefore be classified as `full`. That leaks into photographer-facing metadata and the crop-based lens hint (`full -> Start at 1×`), even when trusted pose landmarks clearly indicate only upper-body anatomy is visible.

For this product, anatomy evidence is more trustworthy than “the silhouette reaches the image bottom.”

## What changes

- Classify portrait crop from trusted visible anatomy before consulting segmentation position.
- Anatomy order:
  - ankle -> `full`
  - knee -> `three-quarter`
  - hip -> `half`
  - elbow/wrist without lower-body evidence -> `half`
  - trusted face/shoulder only -> `headshot`
- Use the previous segmentation-bottom heuristic only when no trusted pose anatomy is available at all.
- Keep crop-based lens-hint mappings unchanged; better crop metadata naturally produces a better starting zoom hint.

## Scope

Primary affected capability: `reference-analysis`.

`shooting-aids` consumes the resulting crop metadata but its existing contract (“estimated, non-binding lens hint”) does not change.

No contour rendering, Live Coach matching, pose thresholds, camera sampling, or MediaPipe model settings change.