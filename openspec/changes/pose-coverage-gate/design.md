# Design

## Current matcher shape

`relativePoseScore()` compares common target/live joint names after normalizing position and scale. It currently returns a score once at least four named points are common.

Shoulders are always included in those common points, while `poseAnchorCount()` counts only optional joints encoded by the target. Therefore:

```text
full-body target: shoulders + 8 optional joints
live sample:       shoulders + 2 optional joints
common count:      4  -> currently enough to produce poseScore
```

The score can be geometrically correct for those four points while still being semantically incomplete for the target pose.

## Decision

Add explicit optional-joint coverage metadata to the internal pose comparison.

For pose-required targets (`targetAnchorCount >= 2`):

```text
requiredLiveAnchors = min(targetAnchorCount, max(2, ceil(targetAnchorCount * 0.60)))
```

`relativePoseScore()` only exposes a usable score when:

1. at least four total comparison points exist (existing geometry floor), and
2. live optional-joint coverage meets `requiredLiveAnchors`.

If coverage is insufficient, the comparison reports no usable score. The existing matcher then follows its current pose-required fallback:

```text
Show the full pose
```

## Why 60%

- 100% would be too brittle for sampled mobile landmark detection.
- 50% still allows a full-body target to be validated from only half of its intended optional anchors.
- 60% keeps tolerance for transient dropout while requiring a majority of the target's encoded intent.
- The hard minimum of two preserves the meaning of small 2-anchor / 3-anchor target poses.

## Non-goals

- No per-joint confidence weighting in this change.
- No left/right semantic remapping.
- No change to pose distance threshold (`0.72` good-component gate).
- No change to framing/scale weighting or hint priority.
- No change to Stable Match / Auto Capture temporal logic.

## Risk

Moderate-low. More live samples will correctly remain non-matched when landmark coverage is incomplete. This may make some full-body targets require a clearer camera view, which is preferable to false positive Auto Capture.