# Design

## Current inconsistency

Reference pose landmarks are stored in one map. Most geometry calls a `visible(name, confidence)` helper before using a point, but fallback face direction calls `inferFacing(byName)` and reads raw `nose`, `left/right_eye`, and `left/right_ear` entries.

This creates two trust standards inside the same GuideSpec.

## Decision

Make `visible()` the single pose-landmark trust boundary:

```text
point exists
AND x/y are finite
AND confidence is absent OR finite and >= threshold
```

Fallback face inference receives the trusted accessor rather than the raw landmark map.

Fallback thresholds:

- nose: 0.10 minimum confidence
- eye/ear pair: normal geometry threshold (0.18)

Dedicated `detection.faceDirection` from Face Landmarker continues to take precedence.

If no trusted pair exists, fallback direction is `front`. This means “no precise left/right claim,” not a guarantee the subject is physically frontal.

## Additional safety

The same finite-value gate protects shoulders, hips, wrists, knees, ankles, and face-point geometry from NaN/Infinity propagation into the guide.

## Non-goals

- No change to Face Landmarker yaw thresholds.
- No change to contour extraction.
- No new UI state for “unknown face direction” in this MVP; `front` remains the neutral/no-turn fallback representation.
- No matching threshold changes.
