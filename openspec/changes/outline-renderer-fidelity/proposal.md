# Proposal: outline renderer fidelity

## Why

Web visual testing showed that our current approximate Outline renderer looks like a geometric skeleton wrapped in parallel lines. That visual language does not match the benchmark products we are learning from:

- SOVS/SOVS2 uses smooth, continuous hand-drawn body contours;
- PoseGhost uses hand-crafted silhouettes with consistent line weight/proportions that remain legible at low opacity;
- PoseOverlay uses an explicit keypoint skeleton for precise pose matching rather than pretending the skeleton is a contour;
- reCompose uses semantic composition guides instead of human contours.

## Goals

1. Make Outline read as a body silhouette/contour, not a widened skeleton.
2. Smooth source-derived contours before rendering.
3. Replace the generic fallback's disconnected parallel limb edges with continuous limb-envelope paths.
4. Reuse the same fallback envelope geometry for Ghost with translucent fill and consistent styling.
5. Keep Skeleton and Guide behavior independent.

## Non-goals

- Reconstruct source-specific contour geometry for every template in this change.
- Add new pose-detection models.
- Change Live Coach scoring or Auto Capture thresholds.
