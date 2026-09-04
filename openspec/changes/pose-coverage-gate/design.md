# Design

## Current matcher shape

`relativePoseScore()` compares common target/live joint names after normalizing position and scale. It currently returns a score once at least four named points are common.

Shoulders are always included in those common points, while target pose intent is encoded by optional joints. Therefore:

```text
full-body target: shoulders + 8 optional joints
live sample:       shoulders + 2 optional joints
common count:      4  -> previously enough to produce poseScore
```

The score can be geometrically correct for those four points while still being semantically incomplete for the target pose.

A separate aggregate issue exists when required pose evidence is missing entirely: if the pose component is omitted from the weighted denominator, perfect framing/scale can renormalize to a 100% headline even though pose verification is unavailable.

## Decision

Add explicit optional-joint coverage metadata to the internal pose comparison.

For pose-required targets (`targetAnchorCount >= 2`):

```text
requiredLiveAnchors = min(targetAnchorCount, max(2, ceil(targetAnchorCount * 0.60)))
```

`relativePoseScore()` only exposes a usable score when:

1. at least four total comparison points exist (existing geometry floor), and
2. live optional-joint coverage meets `requiredLiveAnchors`.

If coverage is insufficient, the comparison reports no usable `poseScore`. The existing matcher then follows its current pose-required fallback:

```text
Show the full pose
```

For aggregate scoring, required pose intent is not treated as an optional signal. When `poseRequired` is true but no usable pose score exists, the existing pose weight remains in the denominator with component value 0:

```text
pose score available      -> [poseScore, 0.23]
pose required, unavailable -> [0,        0.23]
pose not required          -> omit pose component
```

This keeps the UI honest while preserving `poseScore === undefined` for the existing visibility/fallback guidance path.

## Why 60%

- 100% would be too brittle for sampled mobile landmark detection.
- 50% still allows a full-body target to be validated from only half of its intended optional anchors.
- 60% keeps tolerance for transient dropout while requiring a majority of the target's encoded intent.
- The hard minimum of two preserves the meaning of small 2-anchor / 3-anchor target poses.

## Non-goals

- No per-joint confidence weighting in this change.
- No left/right semantic remapping.
- No change to pose distance threshold (`0.72` good-component gate).
- No change to framing/scale/pose weight constants or hint priority.
- No change to Stable Match / Auto Capture temporal logic.

## Risk

Moderate-low. More live samples will correctly remain non-matched when landmark coverage is incomplete, and the headline score will be lower while required pose evidence is missing. This may make some full-body targets require a clearer camera view, which is preferable to false positive confidence or Auto Capture.