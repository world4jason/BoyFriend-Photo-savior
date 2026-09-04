# Design

## Shared model

Extend portrait head metadata:

```ts
head: {
  center: NormalizedPoint;
  rx: number;
  ry: number;
  facing: 'left' | 'right' | 'front';
  facingKnown?: boolean;
}
```

`facing` remains the render/match value. `facingKnown` expresses whether that value is supported by usable evidence.

The optional field preserves compatibility with existing template/sample data.

## Reference-analysis semantics

### Dedicated Face Landmarker

If `detection.faceDirection` exists, including `front`:

```text
facing = detection.faceDirection
facingKnown = true
```

### Trusted pose fallback

Fallback inference returns `{ facing, known }` rather than only a direction.

- trusted nose + trusted eye/ear pair with left/right offset -> left/right, known=true
- trusted nose + trusted eye/ear pair centered -> front, known=true
- missing trusted nose or pair -> front, known=false

`front + known=false` means neutral/no precise turn claim.

## Live Coach compatibility helpers

Target face intent:

```text
if target.facingKnown is defined:
    required = target.facingKnown
else:
    required = target.facing !== 'front'
```

This preserves old templates:

- legacy left/right -> required
- legacy front -> neutral

Live face knowledge:

```text
if live.facingKnown is defined:
    known = live.facingKnown
else:
    known = live.facing !== 'front'
```

Source-derived live guides will explicitly provide the field, so legacy fallback mainly protects tests/templates.

## Face scoring

When target face is not required, omit face scoring exactly as today.

When target face is required:

```text
live unknown -> no public faceScore; aggregate uses [0, 0.12]
exact direction match -> 1.0
known left/right target vs known front live -> 0.55
known left target vs known right live (or reverse) -> 0.10
known front target vs known left/right live -> 0.25
```

The existing face weight remains `0.12`.

The 0.25 frontal-target side-turn score is intentionally below the existing 0.80 face component gate and makes the mismatch visible in aggregate without changing left/right legacy scoring.

## Guidance priority

After framing/scale corrections and before pose-detail corrections:

```text
face required + live unknown -> Show face clearly
known front target + known side live -> Face camera
known left/right target + mismatch -> existing Face ← left / Face → right
```

Pose visibility remains lower priority than required face visibility only when framing/scale already match.

## Aggregate honesty

A required face component is analogous to required pose evidence:

- verified -> include actual face score with weight 0.12
- required but live unknown -> include zero with weight 0.12
- not required -> omit face component

This prevents unavailable face evidence from renormalizing framing/scale to an artificially high headline score.

## Rendering

No new face mesh or debug landmarks are shown. Existing left/right arrow behavior remains. A known frontal target does not require a new permanent overlay in this change; Live Coach can surface `Face camera` when correction is needed.

## Non-goals

- No migration of all legacy templates to explicit frontal intent.
- No calibrated face-pose angle exposed to users.
- No change to Face Landmarker yaw thresholds.
- No new `unknown` value in the `facing` enum; confidence is represented separately.
- No Stable Match or Auto Capture temporal changes.