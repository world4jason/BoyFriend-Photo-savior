# Design

## Trust order

Crop classification uses the most semantic evidence first:

```text
trusted body anatomy
    > trusted upper-body anatomy
    > segmentation-only positional fallback
```

The segmentation silhouette remains valuable for shape/placement, but its bottom coordinate does not identify which anatomical landmark was actually cropped by the photographer.

## Pure classifier

Add a small pure helper receiving already-trusted evidence:

```ts
type PortraitCropEvidence = {
  hasAnkle: boolean;
  hasKnee: boolean;
  hasHip: boolean;
  hasArm: boolean;
  hasUpperPose: boolean;
  silhouetteBottom: number;
};
```

Classification:

```text
if ankle                  -> full
else if knee              -> three-quarter
else if hip               -> half
else if arm               -> half
else if upper pose        -> headshot
else if bottom > 0.92     -> full
else if bottom > 0.78     -> three-quarter
else if bottom > 0.58     -> half
else                      -> headshot
```

`hasUpperPose` means trusted nose and/or shoulder evidence exists. `hasArm` means a trusted elbow or wrist exists. Lower-body cases are checked first, so a full-body subject that also has visible arms remains `full`.

## Why arms map to half

A reference with visible elbows/wrists but no trusted hip/knee/ankle evidence contains more upper-body composition than a face-and-shoulders headshot. `half` is a conservative label and keeps the advisory lens hint at 2× rather than jumping to 3×.

## Segmentation-only fallback

If pose analysis is unavailable or all relevant pose anatomy fails the trust gate, preserve the existing bottom-position thresholds. This is explicitly lower-confidence fail-soft behavior; it must never override trusted anatomy.

## Lens hints

No lens-hint mapping changes:

- `headshot -> 3×`
- `half / three-quarter -> 2×`
- `full -> 1×`

The improvement is entirely upstream: the crop label becomes more trustworthy.

## Non-goals

- No new `unknown` crop enum in this MVP.
- No change to EXIF-based lens hints.
- No body-height/shape ML classifier.
- No change to GuideOverlay geometry or Live Coach.
