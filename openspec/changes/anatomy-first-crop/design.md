# Design

## Trust order

Crop classification uses the most semantic evidence first:

```text
trusted lower-body anatomy
    > trusted shoulder + segmentation extent
    > segmentation-only positional fallback
```

The segmentation silhouette remains valuable for shape/placement, but its absolute bottom coordinate does not identify which anatomical landmark was actually cropped by the photographer.

## Pure classifier

Use a small pure helper receiving already-trusted evidence:

```ts
type PortraitCropEvidence = {
  hasAnkle: boolean;
  hasKnee: boolean;
  hasHip: boolean;
  shoulderY?: number;
  silhouetteTop: number;
  silhouetteBottom: number;
};
```

Classification:

```text
if ankle                  -> full
else if knee              -> three-quarter
else if hip               -> half
else if trusted shoulder:
    belowShoulderRatio = (bottom - shoulderY) / (bottom - top)
    if ratio <= 0.38      -> headshot
    else                  -> half
else if bottom > 0.92     -> full
else if bottom > 0.78     -> three-quarter
else if bottom > 0.58     -> half
else                      -> headshot
```

`shoulderY` is the mean y-coordinate of the trusted shoulders that are actually available. It is never synthesized from contour fallback geometry for crop classification.

## Why shoulder extent instead of presence-only rules

Review found that `nose OR shoulder -> headshot` was too aggressive. A small full/half-body subject can retain a trusted nose/shoulder while lower-body landmarks drop out, and a close-up portrait can expose a wrist/hand near the face. Presence or absence of an arm/nose therefore does not identify crop extent reliably.

The segmentation span below the shoulder is more directly related to how much torso remains visible:

- shoulder near the bottom of the segmented subject -> tight head/shoulders crop;
- shoulder high within the segmented subject -> longer upper-body crop.

The `0.38` threshold is intentionally conservative and advisory. It is covered by regression fixtures on both sides of the boundary; future tuning can change this one pure classifier without touching the guide builder.

## Lower-body anatomy precedence

Trusted lower-body anchors still take precedence over shoulder extent:

- ankle -> `full`
- knee -> `three-quarter`
- hip -> `half`

This avoids a visible knee/ankle being overridden by an unusual shoulder position.

## Segmentation-only fallback

If neither trusted lower-body anatomy nor a trusted shoulder is available, preserve the existing bottom-position thresholds. A nose/face point or isolated arm/hand point alone does not force a crop label. This fallback is explicitly lower-confidence fail-soft behavior.

## Lens hints

No lens-hint mapping changes:

- `headshot -> 3×`
- `half / three-quarter -> 2×`
- `full -> 1×`

The improvement is entirely upstream: crop metadata becomes more trustworthy.

## Non-goals

- No new `unknown` crop enum in this MVP.
- No change to EXIF-based lens hints.
- No learned body-height/crop classifier.
- No change to GuideOverlay geometry or Live Coach.
