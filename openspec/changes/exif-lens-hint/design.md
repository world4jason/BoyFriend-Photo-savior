# Design

## Data flow

```text
ImagePicker asset
  -> request EXIF metadata
  -> lensHintFromExif(asset.exif)
  -> keep only LensHint result
  -> buildGuideFromContour(...)
  -> EXIF hint overrides crop heuristic when valid
  -> GuideOverlay shows Start at N×
```

The raw EXIF object is not stored in GuideSpec and is not passed into matching.

## Priority

Lens guidance priority for a picked reference is:

1. usable 35mm-equivalent EXIF;
2. explicit template metadata when applicable;
3. crop/framing heuristic.

## Supported EXIF keys

The existing helper accepts common 35mm-equivalent variants:

- `FocalLengthIn35mmFilm`
- `FocalLengthIn35mmFormat`
- `FocalLength35mm`
- `FocalLengthIn35mm`

Numeric values and simple numeric/rational strings are accepted only when finite and positive.

## Multiplier buckets

The current practical phone-selector mapping remains:

- <20mm -> 0.5×
- 20..<40mm -> 1×
- 40..<70mm -> 2×
- >=70mm -> 3×

These are advisory buckets, not claims about exact physical equivalence across devices.

## Failure behavior

Missing, malformed, non-finite, zero, or negative metadata fails soft to the existing crop heuristic. Web platforms that do not provide EXIF must behave exactly like today.

## Invariants

- EXIF changes only `GuideSpec.lensHint`.
- Target geometry, crop classification, matching, Stable Match and Auto Capture remain unchanged.
- No raw EXIF object is retained after deriving the hint.
