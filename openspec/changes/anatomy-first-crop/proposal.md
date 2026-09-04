# Proposal: anatomy-first portrait crop classification

## Why

Reference crop metadata currently mixes pose evidence with the absolute bottom of the segmentation silhouette:

```text
hasAnkle OR silhouetteBottom > 0.92 -> full
```

A waist-up or chest-up portrait that simply touches the bottom edge of the reference can therefore be classified as `full`. That leaks into photographer-facing metadata and the crop-based lens hint (`full -> Start at 1×`), even when trusted pose landmarks clearly indicate only upper-body anatomy is visible.

For this product, trusted anatomy is more meaningful than “the silhouette reaches the image bottom,” but absence of lower-body landmarks is not enough by itself to claim a tight headshot.

## What changes

- Classify portrait crop from trusted lower-body anatomy first:
  - ankle -> `full`
  - knee -> `three-quarter`
  - hip -> `half`
- If no trusted lower-body anatomy exists but a trusted shoulder is available, distinguish `headshot` vs `half` from the amount of segmented subject that remains below the shoulder:
  - little body below shoulder -> `headshot`
  - substantial body below shoulder -> `half`
- Shoulder-based classification is used only when the shoulder lies within the segmented subject's vertical bounds; otherwise pose and segmentation disagree too much and the classifier falls back.
- A nose/face landmark or isolated hand/arm landmark alone does not force a crop label.
- Use the previous segmentation-bottom heuristic when neither trusted lower-body anatomy nor a usable trusted shoulder can support the crop decision.
- Keep crop-based lens-hint mappings unchanged; better crop metadata naturally produces a better starting zoom hint.

## Scope

Primary affected capability: `reference-analysis`.

`shooting-aids` consumes the resulting crop metadata but its existing contract (“estimated, non-binding lens hint”) does not change.

No contour rendering, Live Coach matching, pose thresholds, camera sampling, or MediaPipe model settings change.