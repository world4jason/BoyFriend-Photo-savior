# Design

## Current inconsistency

Reference pose landmarks are stored in one map. Most guide geometry calls a `visible(name, confidence)` helper before using a point, but fallback face direction previously called `inferFacing(byName)` and read raw `nose`, `left/right_eye`, and `left/right_ear` entries.

Review also found an upstream problem: the DOM analyzer used `clamp01(Number(x))` before checking finiteness. `Infinity` could therefore be laundered into a valid-looking boundary coordinate (`1` or `0`) before the guide builder had a chance to reject it.

## Decision

Use two defensive trust layers.

### Layer 1: raw MediaPipe sanitizer

`poseLandmarkSanitizer.ts` converts raw MediaPipe points into shared `PoseLandmark` values:

```text
raw coordinate exists
AND raw x/y are finite
THEN clamp finite coordinates into 0..1

if visibility is present:
    visibility must be finite
else if presence is present:
    presence must be finite
else:
    confidence remains undefined
```

A non-finite raw coordinate or present confidence signal drops the landmark before it enters shared geometry. Finite out-of-frame coordinates may still clamp to `0..1` after passing the finite check.

### Layer 2: guide-builder trusted accessor

`guideFromContour.ts` applies the existing per-feature confidence thresholds and repeats the finite-value checks as defense-in-depth:

```text
point exists
AND x/y are finite
AND confidence is absent OR finite and >= caller threshold
```

Fallback face inference receives this trusted accessor rather than the raw landmark map.

Fallback thresholds:

- nose: 0.10 minimum confidence
- eye/ear pair: normal geometry threshold (0.18)

Dedicated `detection.faceDirection` from Face Landmarker continues to take precedence. Its own analyzer path already rejects unusable/non-finite face geometry before producing a direction.

If no trusted fallback pair exists, direction is `front`. This means “no precise left/right claim,” not a guarantee the subject is physically frontal.

## Additional safety

The same guide-builder finite/confidence gate protects shoulders, hips, wrists, knees, ankles, and face-point geometry. The upstream sanitizer prevents non-finite raw model output from being converted into apparently-valid boundary coordinates before that second layer.

## Non-goals

- No change to Face Landmarker yaw thresholds.
- No change to contour extraction.
- No new UI state for “unknown face direction” in this MVP; `front` remains the neutral/no-turn fallback representation.
- No matching threshold changes.
