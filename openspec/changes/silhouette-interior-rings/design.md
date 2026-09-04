# Design

## Data contract

`PersonGuide` gains optional `contourHoles?: NormalizedPoint[][]`.

- `contour` remains the single outer source-derived boundary.
- `contourHoles` stores enclosed background rings belonging to that same selected person component.
- Rings are normalized source-image coordinates and do not repeat the first point at the end.
- Missing/empty `contourHoles` means the analyzer has no trusted interior-ring geometry; renderers must not invent it.

`MaskContourResult` carries the same optional rings so the segmentation boundary is explicit before `GuideSpec` construction.

## Ring extraction

The existing ordered boundary walker already returns all closed loops around the selected largest 4-connected component. Today it keeps only the loop with the greatest absolute polygon area.

The new extractor will:

1. trace all closed boundary loops;
2. choose the greatest-absolute-area loop as the outer contour;
3. keep only loops whose signed area is opposite the outer loop, which identifies enclosed background boundaries under the existing foreground-on-right edge orientation;
4. reject tiny pinholes using both absolute/relative area and minimum horizontal/vertical span;
5. keep at most the four largest meaningful holes;
6. simplify/resample each retained ring to a bounded point budget.

Proposed bounds:

- outer contour: existing 24..128 points;
- each interior ring: 12..64 points;
- at most 4 interior rings;
- ring area must be at least `max(12 px², outerArea * 0.0015)`;
- ring width and height must each span at least 3 mask pixels.

These thresholds intentionally favor silhouette legibility over preserving one-pixel segmentation defects.

## Fail-soft behavior

If ordered boundary tracing cannot produce a usable outer loop, the existing scanline fallback remains authoritative and returns no interior rings. Interior-ring extraction is an enhancement; it must never make a reference unusable when the outer fallback can still produce a guide.

## Rendering

Source-derived Outline/Ghost will use one SVG compound path:

`outer subpath + zero-or-more interior subpaths`

Both outer and interior rings use the existing smoothed closed quadratic path conversion.

- Outline: transparent fill, one consistent stroke across all subpaths.
- Ghost: translucent fill with `fillRule="evenodd"`, so each enclosed ring cuts transparent negative space while preserving the same outline stroke.

This keeps Outline and Ghost on identical silhouette geometry. Skeleton and Guide remain unchanged.

## Matching invariants

Matching continues to consume normalized target anchors/bounds rather than rendered SVG paths. `contourHoles` does not affect pose score, Stable Match, Auto Capture, crop classification, or lens hints.

## Known limit

A semantic overlap line where foreground body parts overlap with no background visible is not recoverable from a binary person mask. That should be a separate pose/part-reasoning change rather than manufacturing skeleton-like lines in this renderer.
