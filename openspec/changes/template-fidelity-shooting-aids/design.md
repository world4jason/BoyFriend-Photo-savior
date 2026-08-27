# Design

## Product model

The four Display Modes remain exactly:

- Outline
- Skeleton
- Ghost
- Guide

`Reference Overlay` is a separate source-photo layer that can coexist with any mode. It is not a fifth Display Mode.

## Reference Overlay

When `GuideSpec.sourceUri` exists, the camera can render that image using the same aspect-fit frame and target transform as GuideOverlay.

Initial opacity choices:

- Off
- 15%
- 30% (default when source-photo overlay is enabled)
- 50%

The overlay is presentation-only and SHALL NOT affect matching geometry.

## Lens hint

GuideSpec may carry a non-binding lens hint:

```ts
lensHint?: {
  zoom: 0.5 | 1 | 2 | 3;
  basis: 'exif-35mm' | 'template' | 'crop-heuristic';
  equivalentMm?: number;
}
```

Priority:

1. EXIF 35mm-equivalent focal length when available from an uploaded photo.
2. Explicit template metadata when a source-derived template specifies a preferred lens.
3. Crop heuristic fallback:
   - headshot -> 3×
   - half / three-quarter -> 2×
   - full -> 1×
   - tabletop / scene -> 1×

The app displays `Start at N×` rather than forcing camera zoom. Expo Camera's cross-platform `zoom` prop is normalized 0–1 of max zoom and is not a portable physical 1×/2×/3× mapping.

## Template fidelity

Benchmark templates gain a fidelity marker:

- `approximate`: hand-authored/generic POC geometry;
- `source-derived`: geometry extracted or deliberately reconstructed from a specific source sample.

Current generated benchmark templates default to `approximate` until individually replaced. Cards and reference metadata must not imply source-exact fidelity for approximate templates.

## Source-derived follow-up pipeline

```text
Official/site/store sample image
  -> research cache
  -> pose / contour / composition extraction
  -> normalize geometry
  -> visual review against source
  -> source-derived template + reference image
```
