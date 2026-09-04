# Design

## Benchmark implication

The existing renderer benchmark separates four visual languages:

- Outline: coherent human outside contour.
- Ghost: the same silhouette geometry with translucent fill.
- Skeleton: explicit joint/segment geometry.
- Guide: semantic composition lines/zones/labels.

The previous renderer work fixed how Outline/Ghost draw their geometry. This change fixes how source-derived silhouette geometry is extracted before rendering. A source contour that has already flattened all arm/torso or leg/background concavities cannot be repaired by stroke smoothing later.

## Current failure

`maskToOuterContour()` currently scans each mask row, records only `minX` and `maxX`, and then joins the left and right rails. That behaves like a row-wise silhouette hull:

```text
real mask:             scanline hull:
###   ####             ########
###   ####      ->     ########
###   ####             ########
  #####                  #####
```

Exterior negative space is lost even though MediaPipe supplied it.

## Boundary-tracing pipeline

1. Convert the category mask to a binary foreground mask using the existing `> 0` rule.
2. Find the largest 4-connected foreground component. This preserves the current one-primary-person product contract while rejecting small disconnected foreground noise.
3. Keep primary-component eligibility compatible with the previous extractor by requiring at least eight rows whose component width is strictly greater than `max(2, width * 0.006)`. Count qualifying rows independent of the old `y % rowStep` sampling phase so higher mask resolution does not impose an accidental area-percentage penalty on small but valid subjects.
4. Emit clockwise cell-boundary edges wherever a foreground pixel touches background or the image boundary.
5. Trace closed edge loops using a right-hand turn preference so foreground remains on the right side of the walk.
6. If multiple loops exist, choose the loop with the largest absolute polygon area as the source outer contour. Interior holes remain outside the current single-ring GuideSpec contract.
7. Normalize coordinates into `[0, 1]`.
8. Simplify with a small resolution-aware Ramer-Douglas-Peucker tolerance, then keep the final ring within a bounded 24..128 point budget. Densification is allowed only to keep very simple silhouettes stable for downstream geometry/render smoothing; it must not invent new extrema.
9. If tracing cannot produce a valid loop, fall back to the previous scanline-hull strategy over the selected primary component.

## Why cell edges instead of sorting boundary pixels

Sorting boundary pixels by angle around a centroid destroys concavities and can self-cross. Cell-boundary edges preserve adjacency from the binary mask, so concave exterior regions remain in the same order the mask provides.

## Connectivity choice

Primary-component selection uses 4-connectivity. This avoids treating diagonal-only noise as a coherent person region and avoids ambiguous corner-only unions during boundary walking. If MediaPipe genuinely splits a limb into a disconnected island, this change intentionally keeps the largest coherent component rather than inventing a bridge.

## Eligibility choice

Do not use a fixed percentage of total mask area as the primary-person acceptance gate. That makes the minimum subject size grow quadratically with mask resolution even though the previous scanline extractor's evidence floor was row-based. The row-evidence gate keeps small travel subjects eligible while still rejecting long 1px segmentation slivers that have area but no believable person width.

## Failure behavior

- No meaningful foreground -> existing user-facing `No clear person silhouette` failure.
- Largest component lacks eight sufficiently wide foreground rows -> same clear silhouette failure.
- Boundary loop cannot be completed -> use scanline fallback for the primary component.
- Interior hole -> choose outer ring only; do not claim hole fidelity yet.
- Multiple people/blobs -> largest connected component only; multi-person extraction remains later scope.

## Invariants

- `PersonGuide.contour` remains one normalized closed ring represented without repeating the first point at the end.
- No changes to `GuideSpec` matching anchors or transform semantics.
- Pose/face/crop evidence continues to come from existing trusted sources.
- Outline/Ghost continue to prefer source contour over fallback body envelopes.
- Camera sampling, Stable Match and Auto Capture state machines are untouched.
