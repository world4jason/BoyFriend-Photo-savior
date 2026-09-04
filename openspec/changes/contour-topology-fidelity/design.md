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
3. Emit clockwise cell-boundary edges wherever a foreground pixel touches background or the image boundary.
4. Trace closed edge loops using a right-hand turn preference so foreground remains on the right side of the walk.
5. If multiple loops exist, choose the loop with the largest absolute polygon area as the source outer contour. Interior holes remain outside the current single-ring GuideSpec contract.
6. Normalize coordinates into `[0, 1]`.
7. Simplify with a small resolution-aware Ramer-Douglas-Peucker tolerance, then keep the final ring within a bounded 24..128 point budget. Densification is allowed only to keep very simple silhouettes stable for downstream geometry/render smoothing; it must not invent new extrema.
8. If tracing cannot produce a valid loop, fall back to the previous scanline-hull strategy over the selected primary component.

## Why cell edges instead of sorting boundary pixels

Sorting boundary pixels by angle around a centroid destroys concavities and can self-cross. Cell-boundary edges preserve adjacency from the binary mask, so concave exterior regions remain in the same order the mask provides.

## Connectivity choice

Primary-component selection uses 4-connectivity. This avoids treating diagonal-only noise as a coherent person region and avoids ambiguous corner-only unions during boundary walking. If MediaPipe genuinely splits a limb into a disconnected island, this change intentionally keeps the largest coherent component rather than inventing a bridge.

## Failure behavior

- No meaningful foreground -> existing user-facing `No clear person silhouette` failure.
- Boundary loop cannot be completed -> use scanline fallback for the primary component.
- Interior hole -> choose outer ring only; do not claim hole fidelity yet.
- Multiple people/blobs -> largest connected component only; multi-person extraction remains later scope.

## Invariants

- `PersonGuide.contour` remains one normalized closed ring represented without repeating the first point at the end.
- No changes to `GuideSpec` matching anchors or transform semantics.
- Pose/face/crop evidence continues to come from existing trusted sources.
- Outline/Ghost continue to prefer source contour over fallback body envelopes.
- Camera sampling, Stable Match and Auto Capture state machines are untouched.
