# Proposal: trust-gate fallback face direction

## Why

`guideFromContour()` correctly confidence-filters most pose geometry through `visible()`, but its fallback face-direction inference currently reads raw pose landmarks directly. If the dedicated Face Landmarker is unavailable, low-confidence or non-finite nose/eye/ear points can therefore create a confident-looking left/right cue that the rest of reference analysis would have rejected.

Wrong face direction is worse than no face direction because it becomes an explicit shooting instruction and a Live Coach match gate.

## What changes

- Keep dedicated `FaceLandmarker` direction as the preferred source when available.
- Make pose-landmark fallback direction use the same finite/confidence trust gate as other pose geometry.
- Reject non-finite pose coordinates and non-finite confidence values from shared reference geometry.
- If trusted fallback face landmarks are insufficient, return `front`/no precise turn rather than inventing left/right.

## Scope

Affected capability: `reference-analysis`.

No MediaPipe model, segmentation contour, matcher threshold, display mode, or camera sampling behavior changes.